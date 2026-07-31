const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  adminName:        { type: String, default: 'System' },
  adminEmail:       { type: String, default: '' },
  action:           {
    type: String,
    enum: [
      'ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_DELETED',
      'ADMIN_ACTIVATED', 'ADMIN_DEACTIVATED', 'PASSWORD_RESET',
      'LOGIN', 'LOGOUT', 'FAILED_LOGIN',
      'PAYMENT_APPROVED', 'PAYMENT_REJECTED',
    ],
    required: true,
  },
  targetAdminId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  targetAdminEmail: { type: String, default: '' },
  ipAddress:        { type: String, default: '' },
  details:          { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ adminId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
