const mongoose = require('mongoose');
const magazineSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  coverImage: { type: String, default: '' },
  pdfFile: { type: String, default: '' },
  description: { type: String, trim: true },
  publishedDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Magazine', magazineSchema);
