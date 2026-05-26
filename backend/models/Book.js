const mongoose = require('mongoose');
const bookSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  author: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, default: 0 },
  image: { type: String, default: '' },
  description: { type: String, trim: true },
  stockStatus: { type: String, enum: ['available', 'out_of_stock'], default: 'available' },
  contactNumber: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Book', bookSchema);
