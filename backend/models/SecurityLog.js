const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  event: { type: String, required: true, index: true },
  level: { type: String, enum: ['info', 'warn', 'critical'], default: 'warn' },
  userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Auto-delete logs older than 90 days
schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('SecurityLog', schema);
