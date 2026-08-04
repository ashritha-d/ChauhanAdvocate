const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Appointment = require('../models/Appointment');
const BookOrder = require('../models/BookOrder');
const UserNotification = require('../models/UserNotification');
const {
  generateUserToken, issueRefreshToken, consumeRefreshToken, revokeRefreshToken,
  setRefreshCookie, clearRefreshCookie, parseCookieHeader, REFRESH_COOKIE_NAME,
  claimSession, releaseSession, forceNewSession,
} = require('../middleware/userAuth');
const { sendOTPEmail } = require('../services/email');
const securityLogger = require('../services/securityLogger');
const { validatePasswordStrength, generateTempPassword } = require('../utils/passwordPolicy');

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
}

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // UX-01: Email is now required — it is needed for password reset
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Name, email, mobile, and password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, message: pwCheck.message });
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const [emailExists, phoneExists] = await Promise.all([
      User.findOne({ email: cleanEmail }),
      User.findOne({ phone: phone.trim() }),
    ]);
    if (emailExists) return res.status(400).json({ success: false, message: 'Email is already registered' });
    if (phoneExists) return res.status(400).json({ success: false, message: 'Mobile number is already registered' });

    const user = await User.create({ name: name.trim(), email: cleanEmail, phone: phone.trim(), password });

    await UserNotification.create({
      userId: user._id,
      title: 'Welcome to Advocate Chauhan!',
      message: `Hi ${user.name}, your account has been created successfully. You can now book appointments and track your orders.`,
      type: 'general',
    });

    // A brand-new account can't already have a session, so this always succeeds —
    // still going through claimSession keeps every login path consistent.
    const sessionId = await claimSession(user._id);
    const token = generateUserToken(user, sessionId);
    const { raw, expiresAt } = await issueRefreshToken(user._id, getIp(req), req.headers['user-agent'] || '');
    setRefreshCookie(res, raw, expiresAt);
    res.status(201).json({ success: true, message: 'Account created successfully', token, user: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: `${field === 'email' ? 'Email' : 'Mobile number'} is already registered` });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/mobile and password are required' });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const query = isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() };

    const user = await User.findOne(query).select('+password');
    if (!user || !user.isActive) {
      await securityLogger.warn('USER_LOGIN_FAILED', { identifier, reason: !user ? 'not found' : 'inactive' }, req);
      return res.status(401).json({ success: false, message: 'Invalid credentials or account deactivated' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await securityLogger.warn('USER_LOGIN_FAILED', { identifier, reason: 'wrong password' }, req);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Single-device enforcement: this must happen before any state changes below,
    // and via one atomic operation, so two near-simultaneous login requests can't
    // both succeed (see claimSession's findOneAndUpdate for the race-safety).
    const sessionId = await claimSession(user._id);
    if (!sessionId) {
      return res.status(409).json({
        success: false,
        message: 'This account is already logged in on another device. Please log out from that device before logging in here.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateUserToken(user, sessionId);
    const { raw, expiresAt } = await issueRefreshToken(user._id, getIp(req), req.headers['user-agent'] || '');
    setRefreshCookie(res, raw, expiresAt);
    res.json({ success: true, message: 'Login successful', token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp +otpExpiry');
    if (!user) {
      return res.json({ success: true, message: 'If this email is registered, an OTP has been sent' });
    }

    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    console.log(`[OTP for ${email}]: ${otp}`);

    try {
      await sendOTPEmail({ to: email, otp, name: user.name });
    } catch (emailErr) {
      console.error('[OTP Email Error]', emailErr.message);
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again later.' });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email address',
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp +otpExpiry');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid OTP or email' });

    if (!user.otp || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const resetToken = user.generateResetToken();
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'OTP verified', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;
    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, message: pwCheck.message });
    }

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpiry');

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token. Please request a new OTP.' });

    user.password = newPassword;
    user.mustChangePassword = false;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get Profile ───────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
};

// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) {
      if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
        return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' });
      }
      const phoneExists = await User.findOne({ phone: phone.trim(), _id: { $ne: req.user._id } });
      if (phoneExists) return res.status(400).json({ success: false, message: 'Mobile number already in use' });
      updates.phone = phone.trim();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated successfully', user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Change Password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }
    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return res.status(400).json({ success: false, message: pwCheck.message });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    // SEC-06: Bump tokenVersion to invalidate all existing sessions
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.mustChangePassword = false;
    await user.save();

    // Rotate the session too — invalidates any other device that was active, while
    // seamlessly keeping this (the legitimate, currently-authenticated) request working.
    const sessionId = await forceNewSession(user._id);
    const token = generateUserToken(user, sessionId);
    res.json({ success: true, message: 'Password changed successfully', token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Upload Profile Photo ──────────────────────────────────────────────────────
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const photoUrl = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl }, { new: true });
    res.json({ success: true, message: 'Profile photo updated', photoUrl, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── My Appointments ───────────────────────────────────────────────────────────
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .populate('paymentId', 'receiptId status amount utrNumber approvedAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── My Orders ─────────────────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await BookOrder.find({ userId: req.user._id })
      .populate('paymentId', 'receiptId status amount utrNumber approvedAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await UserNotification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await UserNotification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await UserNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await UserNotification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: List Users ─────────────────────────────────────────────────────────
// SEC-05: Escape regex to prevent ReDoS
function escapeRegex(str) {
  return String(str).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.adminGetUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const raw = req.query.search || '';
    const search = escapeRegex(raw);
    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);
    res.json({ success: true, data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.adminGetUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const [appointments, orders] = await Promise.all([
      Appointment.find({ userId: user._id }).sort({ createdAt: -1 }),
      BookOrder.find({ userId: user._id }).sort({ createdAt: -1 }),
    ]);
    res.json({ success: true, data: { user, appointments, orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.adminUpdateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = isActive;
    // SEC-06: Revoke all tokens instantly when deactivating an account
    if (!isActive) user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.adminDeleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generates a temporary password on the user's behalf rather than letting the
// admin view or set an arbitrary one — the plaintext is returned exactly once
// in this response for the admin to relay out-of-band, then never stored or
// shown again. mustChangePassword forces the user onto their own password
// before they can use the account, and bumping tokenVersion signs them out
// of any existing sessions immediately.
exports.adminResetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tempPassword = generateTempPassword();
    user.password = tempPassword;
    user.mustChangePassword = true;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    // The user isn't the one making this request, so there's no "their" session to
    // hand a fresh id to — just free the slot; login with the temp password claims
    // a new one through the normal flow.
    await releaseSession(user._id);

    await UserNotification.create({
      userId: user._id,
      title: 'Password Reset by Admin',
      message: 'Your password was reset by an administrator. Please use your new temporary password to log in, then set a new password.',
      type: 'general',
    });

    res.json({ success: true, message: 'Password reset successfully', tempPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.adminSendNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message are required' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await UserNotification.create({ userId: user._id, title, message, type: type || 'general' });
    res.json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const raw = parseCookieHeader(req.headers.cookie, REFRESH_COOKIE_NAME);
    const { user, family } = await consumeRefreshToken(raw);

    // Refreshing extends the SAME session, it never creates a new one — the sid
    // travels forward unchanged from whatever this device's session already is.
    const accessToken = generateUserToken(user, user.activeSessionId);
    const { raw: newRaw, expiresAt } = await issueRefreshToken(
      user._id, getIp(req), req.headers['user-agent'] || '', family,
    );
    setRefreshCookie(res, newRaw, expiresAt);
    res.json({ success: true, token: accessToken, user: sanitizeUser(user) });
  } catch (err) {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logoutUser = async (req, res) => {
  try {
    const raw = parseCookieHeader(req.headers.cookie, REFRESH_COOKIE_NAME);
    if (raw) {
      // Look up the owner before revoking, so the session slot can be freed —
      // this route has no Bearer token to identify the user by (the access token
      // may well already be expired by the time someone clicks Logout).
      const record = await RefreshToken.findOne({ tokenHash: RefreshToken.hashToken(raw) });
      if (record) await releaseSession(record.userId);
      await revokeRefreshToken(raw);
    }
  } catch { /* best-effort revocation */ }
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

// ── Helper ────────────────────────────────────────────────────────────────────
function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  delete obj.activeSessionId;
  delete obj.sessionCreatedAt;
  delete obj.lastActivityAt;
  return obj;
}
