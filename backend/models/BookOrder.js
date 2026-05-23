const mongoose = require('mongoose');

const bookOrderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  bookTitle: { type: String, required: true, trim: true },
  bookPrice: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  address: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('BookOrder', bookOrderSchema);
