const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  videoSourceType: { type: String, enum: ['url', 'upload'], default: 'url' },
  videoUrl: { type: String, default: '' },
  uploadedVideoPath: { type: String, default: '' },
  videoSize: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
  isPreview: { type: Boolean, default: false },
  // Defaults to true so every video that predates this field keeps rendering for students.
  isPublished: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

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
  instructor: { type: String, default: 'Srinivas Chauhan Advocate' },
  duration: { type: String, default: '' },
  category: { type: String, default: '' },
  // Which of the 3 fixed learning-portal categories this course belongs to.
  // Not `required` so pre-existing courses (created before this field existed) keep saving fine.
  programType: { type: String, enum: ['internship', 'training', 'judiciary'], default: 'training' },
  banner: { type: String, default: '' },
  validityDays: { type: Number, default: 365 },
  enrollmentLimit: { type: Number, default: 0 }, // 0 = unlimited
  status: { type: String, enum: ['available', 'coming-soon'], default: 'available' },
  sortOrder: { type: Number, default: 0 },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  language: { type: String, default: 'Telugu / English' },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  modules: [moduleSchema],
  resources: [{
    title: { type: String, trim: true },
    type: { type: String, enum: ['study_material', 'assignment', 'case_study', 'previous_paper', 'mock_test'], default: 'study_material' },
    fileUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
  }],
  certificate: { type: Boolean, default: false },
  totalStudents: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

// Matches getPublicCourses' query+sort shape exactly: filter by isActive (+ optional
// programType), sort by sortOrder/isFeatured/createdAt.
courseSchema.index({ isActive: 1, programType: 1, sortOrder: 1, isFeatured: -1, createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
