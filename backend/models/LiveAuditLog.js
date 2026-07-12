const mongoose = require('mongoose');

const liveAuditSchema = new mongoose.Schema({
  adminId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  adminName:    { type: String, default: 'Admin' },
  adminEmail:   { type: String, default: '' },
  action:       { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
  sessionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', default: null },
  sessionTitle: { type: String, default: '' },
  changes:      { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

liveAuditSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LiveAuditLog', liveAuditSchema);
