const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: { type: String, enum: ['appointment', 'book_order'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  receiptId: { type: String, default: '' },
  clientName: { type: String, required: true, trim: true },
  clientPhone: { type: String, required: true, trim: true },
  clientEmail: { type: String, trim: true, lowercase: true, default: '' },
  amount: { type: String, required: true },
  paymentMethod: { type: String, enum: ['qr_code', 'cash'], default: 'qr_code' },
  utrNumber: { type: String, trim: true, default: '' },
  screenshot: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending_verification', 'approved', 'rejected', 'completed'],
    default: 'pending_verification'
  },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
