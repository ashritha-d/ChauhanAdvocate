const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId },
  moduleId: { type: mongoose.Schema.Types.ObjectId },
  completedAt: { type: Date },
}, { _id: false });

const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'pending_verification', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: { type: String, default: 'upi' },
  paymentScreenshot: { type: String, default: '' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  amountPaid: { type: Number, default: 0 },
  enrolledAt: { type: Date, default: null },
  progress: [progressSchema],
  completedVideos: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: null },
}, { timestamps: true });

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
