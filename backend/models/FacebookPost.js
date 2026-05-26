const mongoose = require('mongoose');
const facebookPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  facebookUrl: { type: String, trim: true },
  thumbnail: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('FacebookPost', facebookPostSchema);
