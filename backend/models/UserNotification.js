const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['appointment', 'order', 'payment', 'general'], default: 'general' },
  isRead: { type: Boolean, default: false },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  referenceType: { type: String, enum: ['Appointment', 'BookOrder', 'Payment', ''], default: '' },
}, { timestamps: true });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
