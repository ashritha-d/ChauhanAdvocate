const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  date:        { type: Date, default: Date.now },
  link:        { type: String, default: '' },
  linkLabel:   { type: String, default: 'Read More' },
  isActive:    { type: Boolean, default: true },
  priority:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);
