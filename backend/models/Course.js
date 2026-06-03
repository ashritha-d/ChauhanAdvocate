const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  duration: { type: String, default: '' },
  isPreview: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  videos: [videoSchema],
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  price: { type: Number, required: true, default: 0 },
  discountPrice: { type: Number, default: 0 },
  instructor: { type: String, default: 'Advocate B. Chauhan' },
  duration: { type: String, default: '' },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  language: { type: String, default: 'Telugu / English' },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  modules: [moduleSchema],
  studyMaterials: [{ name: String, fileUrl: String }],
  certificate: { type: Boolean, default: false },
  totalStudents: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
