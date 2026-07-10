const mongoose = require('mongoose');

const CONTENT_TYPES = ['blog', 'course', 'magazine', 'news', 'facebook', 'youtube'];

const draftSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true },
  contentType:     { type: String, enum: CONTENT_TYPES, required: true },
  contentDataJson: { type: mongoose.Schema.Types.Mixed, default: {} },
  thumbnail:       { type: String, default: '' },
  status:          { type: String, enum: ['draft', 'published'], default: 'draft' },
  accessType:      { type: String, enum: ['free', 'paid'], default: 'free' },
  price:           { type: Number, default: 0 },
  lastSavedAt:     { type: Date, default: Date.now },
  createdBy:       { type: String, default: '' },
  order:           { type: Number, default: 0 }
}, { timestamps: true });

draftSchema.pre('save', function (next) {
  this.lastSavedAt = new Date();
  next();
});

module.exports = mongoose.model('Draft', draftSchema);
