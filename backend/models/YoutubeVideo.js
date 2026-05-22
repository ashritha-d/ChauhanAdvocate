const mongoose = require('mongoose');

const youtubeVideoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  videoId: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('YoutubeVideo', youtubeVideoSchema);
