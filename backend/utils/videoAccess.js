const jwt = require('jsonwebtoken');

// Deliberately longer-lived than the main access token (15 min) — a single lecture
// can run well past that, and re-authenticating mid-playback would interrupt it.
// Still narrowly scoped: this token is only ever accepted by the stream endpoint,
// for exactly one video, and every request re-verifies enrollment/session fresh
// from the DB rather than trusting these claims blindly (see streamVideo).
const VIDEO_TOKEN_EXPIRE = process.env.VIDEO_TOKEN_EXPIRE || '4h';

function generateVideoAccessToken({ userId, sessionId, courseId, videoId, preview }) {
  return jwt.sign(
    { type: 'video', uid: userId || null, sid: sessionId || null, courseId, videoId, preview: !!preview },
    process.env.JWT_SECRET,
    { expiresIn: VIDEO_TOKEN_EXPIRE },
  );
}

function verifyVideoAccessToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'video') throw new Error('Invalid token type');
  return decoded;
}

module.exports = { generateVideoAccessToken, verifyVideoAccessToken };
