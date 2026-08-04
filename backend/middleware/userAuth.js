const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const REFRESH_COOKIE_NAME = 'rt';
const REFRESH_EXPIRE_DAYS = parseInt(process.env.USER_REFRESH_TOKEN_EXPIRE_DAYS) || 30;
// Configurable single central place for how long an inactive session stays "claimed"
// before another device is allowed to log in — an abandoned browser tab, not an
// explicit logout, is the normal way this matters.
const SESSION_TIMEOUT_MS = (parseInt(process.env.USER_SESSION_TIMEOUT_MINUTES) || 60) * 60 * 1000;

// ── Cookie helper (no cookie-parser dependency) ───────────────────────────────
exports.parseCookieHeader = function parseCookieHeader(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

// ── Single-device session enforcement ─────────────────────────────────────────
// Atomically claims the "one active session" slot on the user document. The
// existence check and the write happen in a single findOneAndUpdate, so two
// concurrent login requests can never both succeed: MongoDB serializes writes to
// the same document, and whichever one commits second will find the filter no
// longer matches (activeSessionId is now fresh, not null/stale).
exports.claimSession = async (userId) => {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - SESSION_TIMEOUT_MS);
  const updated = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { activeSessionId: null },
        { lastActivityAt: null },
        { lastActivityAt: { $lt: staleCutoff } },
      ],
    },
    { activeSessionId: sessionId, sessionCreatedAt: now, lastActivityAt: now },
    { new: true },
  );
  if (!updated) return null; // another device's session is still active
  // Close the loop: a refresh token minted under the previous session must not be
  // able to silently obtain a new access token now that the slot has changed hands.
  await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  return sessionId;
};

// Unconditionally rotates the session — for a user changing their OWN password
// while already legitimately authenticated. claimSession's "reject if occupied"
// check would wrongly fail here (their own session is, correctly, still active);
// this instead just issues them a fresh one, which incidentally also invalidates
// any other device's stale session, satisfying "changing a password invalidates
// the existing active session" without needing a separate code path for that.
exports.forceNewSession = async (userId) => {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const now = new Date();
  await User.findByIdAndUpdate(userId, { activeSessionId: sessionId, sessionCreatedAt: now, lastActivityAt: now });
  await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  return sessionId;
};

// Frees the session slot (logout, or an admin/self password reset) so another
// device can claim it immediately, and revokes any outstanding refresh tokens so
// a still-open old tab can't silently keep itself alive via silent refresh.
exports.releaseSession = async (userId) => {
  await User.findByIdAndUpdate(userId, { activeSessionId: null, sessionCreatedAt: null, lastActivityAt: null });
  await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
};

// ── JWT access token ──────────────────────────────────────────────────────────
async function verifyUserToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'user') throw new Error('Invalid token type');
  const user = await User.findById(decoded.id).select('+activeSessionId +lastActivityAt');
  if (!user || !user.isActive) throw new Error('Account not found or deactivated');
  if (decoded.tv !== undefined && decoded.tv !== user.tokenVersion) {
    throw new Error('Session revoked');
  }
  // decoded.sid is only absent on tokens issued before this feature shipped — those
  // are short-lived (15 min default) and will pick up a sid on their next silent
  // refresh, so this is just a brief, harmless transition window, not a bypass.
  if (decoded.sid && decoded.sid !== user.activeSessionId) {
    throw new Error('Session no longer active — logged in elsewhere or session expired');
  }
  // Sliding-expiration heartbeat, throttled to avoid a DB write on every request.
  const now = Date.now();
  if (!user.lastActivityAt || now - user.lastActivityAt.getTime() > 60000) {
    User.updateOne({ _id: user._id }, { lastActivityAt: new Date(now) }).catch(() => {});
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

// Access token — short-lived (default 15 min). sessionId is passed explicitly
// (rather than read off `user.activeSessionId`, which is select:false and easy to
// forget to fetch) so a caller can never accidentally mint a token with a missing
// or stale sid.
exports.generateUserToken = (user, sessionId) => {
  return jwt.sign(
    { id: user._id, type: 'user', tv: user.tokenVersion || 0, sid: sessionId || null },
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

  const user = await User.findById(record.userId).select('+activeSessionId');
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
