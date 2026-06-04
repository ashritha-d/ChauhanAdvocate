const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: { type: String, enum: ['appointment', 'book_order'], required: true },
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
    enum: ['razorpay', 'phonepe', 'googlepay', 'upi_id', 'qr_code', 'cash'],
    default: 'razorpay'
  },
  utrNumber: { type: String, trim: true, default: '' },
  screenshot: { type: String, default: '' },
  // Razorpay-specific fields
  razorpay_order_id: { type: String, default: '' },
  razorpay_payment_id: { type: String, default: '' },
  razorpay_signature: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending_verification', 'approved', 'rejected', 'completed', 'failed'],
    default: 'pending_verification'
  },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
