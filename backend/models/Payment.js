const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: { type: String, enum: ['appointment', 'book_order', 'magazine'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  receiptId: { type: String, default: '' },
  transactionId: { type: String, default: '' },
  clientName: { type: String, required: true, trim: true },
  clientPhone: { type: String, required: true, trim: true },
  clientEmail: { type: String, trim: true, lowercase: true, default: '' },
  amount: { type: String, required: true },
  gstAmount: { type: String, default: '0' },
  totalAmount: { type: String, default: '' },
  paymentMethod: {
    type: String,
    enum: ['phonepe', 'googlepay', 'upi_id', 'qr_code', 'cash', 'bank_transfer'],
    default: 'bank_transfer'
  },
  utrNumber: { type: String, trim: true, default: '' },
  screenshot: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending_verification', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending_verification'
  },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  approvedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  verifiedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  rejectedAt: { type: Date },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
