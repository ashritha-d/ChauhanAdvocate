const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  designation: { type: String, default: 'Client' },
  avatar: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  message: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
