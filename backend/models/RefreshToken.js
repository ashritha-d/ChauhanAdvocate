const mongoose = require('mongoose');
const crypto = require('crypto');

const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  family: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

// TTL — MongoDB auto-deletes documents once expiresAt is reached
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

schema.statics.hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

module.exports = mongoose.model('RefreshToken', schema);
