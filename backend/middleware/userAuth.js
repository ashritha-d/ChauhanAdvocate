const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const REFRESH_COOKIE_NAME = 'rt';
const REFRESH_EXPIRE_DAYS = parseInt(process.env.USER_REFRESH_TOKEN_EXPIRE_DAYS) || 30;

// ── Cookie helper (no cookie-parser dependency) ───────────────────────────────
exports.parseCookieHeader = function parseCookieHeader(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

// ── JWT access token ──────────────────────────────────────────────────────────
async function verifyUserToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'user') throw new Error('Invalid token type');
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new Error('Account not found or deactivated');
  if (decoded.tv !== undefined && decoded.tv !== user.tokenVersion) {
    throw new Error('Session revoked');
  }
  return user;
}

exports.protectUser = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    req.user = await verifyUserToken(header.split(' ')[1]);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid, expired, or revoked' });
  }
};

// Sets req.user if token is valid, otherwise null (no 401)
exports.optionalUserAuth = async (req, res, next) => {
  req.user = null;
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try { req.user = await verifyUserToken(header.split(' ')[1]); } catch { }
  next();
};

// Access token — short-lived (default 15 min)
exports.generateUserToken = (user) => {
  return jwt.sign(
    { id: user._id, type: 'user', tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.USER_JWT_EXPIRE || '15m' },
  );
};

// ── Refresh token lifecycle ───────────────────────────────────────────────────

exports.issueRefreshToken = async (userId, ip = '', userAgent = '', family = null) => {
  const raw = crypto.randomBytes(40).toString('hex');
  const tokenHash = RefreshToken.hashToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRE_DAYS * 24 * 60 * 60 * 1000);
  const tokenFamily = family || crypto.randomBytes(16).toString('hex');
  await RefreshToken.create({ tokenHash, userId, family: tokenFamily, expiresAt, ip, userAgent });
  return { raw, expiresAt, family: tokenFamily };
};

// Validates and rotates a refresh token. Throws on any failure.
exports.consumeRefreshToken = async (raw) => {
  if (!raw) throw new Error('No refresh token');
  const tokenHash = RefreshToken.hashToken(raw);
  const record = await RefreshToken.findOne({ tokenHash });

  if (!record) throw new Error('Refresh token not found');
  if (record.isRevoked) {
    // Reuse detected — revoke every token in this family
    await RefreshToken.updateMany({ family: record.family }, { isRevoked: true });
    throw new Error('Refresh token reused — all sessions revoked');
  }
  if (record.expiresAt < new Date()) throw new Error('Refresh token expired');

  const user = await User.findById(record.userId);
  if (!user || !user.isActive) throw new Error('Account not found or deactivated');

  record.isRevoked = true;
  await record.save();

  return { user, family: record.family };
};

exports.revokeRefreshToken = async (raw) => {
  if (!raw) return;
  const tokenHash = RefreshToken.hashToken(raw);
  await RefreshToken.findOneAndUpdate({ tokenHash }, { isRevoked: true });
};

// ── Cookie helpers ────────────────────────────────────────────────────────────
const isProd = () => process.env.NODE_ENV === 'production';

exports.setRefreshCookie = (res, raw, expiresAt) => {
  res.cookie(REFRESH_COOKIE_NAME, raw, {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? 'none' : 'lax',
    expires: expiresAt,
    path: '/api/users',
  });
};

exports.clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? 'none' : 'lax',
    path: '/api/users',
  });
};

exports.REFRESH_COOKIE_NAME = REFRESH_COOKIE_NAME;
