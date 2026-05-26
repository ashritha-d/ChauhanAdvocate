const mongoose = require('mongoose');
const joinWithUsSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  eligibility: { type: String, trim: true },
  lastDate: { type: Date },
  applyLink: { type: String, trim: true, default: '' },
  applyFile: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('JoinWithUs', joinWithUsSchema);
