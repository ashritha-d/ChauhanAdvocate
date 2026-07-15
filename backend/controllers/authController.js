const Admin    = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const { generateToken } = require('../middleware/auth');
const securityLogger = require('../services/securityLogger');

function getIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
}

async function auditLog(action, opts = {}) {
  try { await AuditLog.create(opts); } catch (_) {}
}

exports.login = async (req, res) => {
  const ip = getIp(req);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email, deletedAt: null }).select('+password');

    if (!admin || !admin.isActive) {
      const reason = !admin ? 'Account not found' : 'Account inactive';
      await auditLog('FAILED_LOGIN', {
        adminName: 'Unknown', adminEmail: email,
        action: 'FAILED_LOGIN', ipAddress: ip,
        details: { reason },
      });
      await securityLogger.warn('ADMIN_LOGIN_FAILED', { email, reason }, req);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      await auditLog('FAILED_LOGIN', {
        adminId: admin._id, adminName: admin.name, adminEmail: admin.email,
        action: 'FAILED_LOGIN', ipAddress: ip,
        details: { reason: 'Wrong password' },
      });
      await securityLogger.warn('ADMIN_LOGIN_FAILED', { email, reason: 'wrong password' }, req);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    admin.lastLogin   = new Date();
    admin.lastLoginIp = ip;
    await admin.save({ validateBeforeSave: false });

    await auditLog('LOGIN', {
      adminId: admin._id, adminName: admin.name, adminEmail: admin.email,
      action: 'LOGIN', ipAddress: ip,
    });

    const token = generateToken(admin._id);
    res.json({ success: true, token, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await auditLog('LOGOUT', {
      adminId: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      action: 'LOGOUT', ipAddress: getIp(req),
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.admin._id, { name, avatar }, { new: true, runValidators: true });
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password');
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedAdmin = async (req, res) => {
  try {
    const email    = req.body.email    || process.env.ADMIN_EMAIL;
    const password = req.body.password || process.env.ADMIN_PASSWORD;
    const name     = req.body.name     || process.env.ADMIN_NAME || 'Admin';
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const exists = await Admin.findOne({ email });
    if (exists) {
      exists.password = password;
      exists.name     = name;
      exists.role     = 'superadmin';
      await exists.save();
      return res.json({ success: true, message: 'Admin updated to superadmin successfully' });
    }
    await Admin.create({ name, email, password, role: 'superadmin' });
    res.json({ success: true, message: 'Superadmin created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
