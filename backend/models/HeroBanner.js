const mongoose = require('mongoose');

const heroBannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  badgeText: { type: String, trim: true },
  image: { type: String, default: '' },
  primaryBtnText: { type: String, default: 'Book Free Consultation' },
  primaryBtnLink: { type: String, default: '#appointment' },
  secondaryBtnText: { type: String, default: 'Our Services' },
  secondaryBtnLink: { type: String, default: '#services' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('HeroBanner', heroBannerSchema);
