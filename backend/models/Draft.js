const mongoose = require('mongoose');
const draftSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  description: { type: String, trim: true },
  file: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Draft', draftSchema);
