const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  serviceType: { type: String, required: true },
  description: { type: String, required: true, trim: true },
  contactMethod: { type: String, enum: ['phone', 'email', 'whatsapp'], default: 'phone' },
  documents: [{ type: String }],
  address: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'closed'],
    default: 'pending'
  },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
