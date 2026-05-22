const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  group: {
    type: String,
    enum: ['general', 'hero', 'about', 'contact', 'social', 'seo', 'advocate'],
    default: 'general'
  },
  label: { type: String },
  type: { type: String, enum: ['text', 'textarea', 'image', 'url', 'email', 'phone', 'json'], default: 'text' }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
