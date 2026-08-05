const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // UX-01: Email is required — needed for account recovery via OTP
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true, unique: true },
  // Kept in sync with backend/utils/passwordPolicy.js's MIN_LENGTH (4) — this is
  // a second, independent gate (Mongoose validates before the pre-save hash hook
  // runs), so it must match or a valid password would be silently rejected here.
  password: { type: String, required: true, minlength: 4, select: false },
  profilePhoto: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  // Set when an admin resets a user's password to a temporary one — forces the
  // user to set their own password before they can use the account normally.
  mustChangePassword: { type: Boolean, default: false },
  // SEC-06: Incremented on password change / deactivation to invalidate existing JWTs
  tokenVersion: { type: Number, default: 0 },
  // Single-device session enforcement — an opaque id claimed at login and embedded in
  // the JWT ('sid'); every request re-checks it matches so a second device can never
  // hold a simultaneously-valid session. select:false keeps it out of default queries
  // and (via sanitizeUser) out of every API response — this is internal bookkeeping,
  // not something the frontend should ever see.
  activeSessionId: { type: String, default: null, select: false },
  sessionCreatedAt: { type: Date, default: null, select: false },
  lastActivityAt: { type: Date, default: null, select: false },
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpiry: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
  return token;
};

module.exports = mongoose.model('User', userSchema);
