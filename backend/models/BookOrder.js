const mongoose = require('mongoose');

const bookOrderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: false, default: '', lowercase: true, trim: true },
  bookTitle: { type: String, required: true, trim: true },
  bookPrice: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  address: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  orderId: { type: String, unique: true, sparse: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['qr_code', 'cash', 'none'], default: 'none' },
  paymentStatus: { type: String, enum: ['unpaid', 'pending_verification', 'paid', 'failed'], default: 'unpaid' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
}, { timestamps: true });

module.exports = mongoose.model('BookOrder', bookOrderSchema);
