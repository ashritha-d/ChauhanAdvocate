const mongoose = require('mongoose');

const jrAdvocateSchema = new mongoose.Schema({
  // Personal
  name: { type: String, required: true, trim: true },
  fatherName: { type: String, trim: true, default: '' },
  dob: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  phone: { type: String, required: true, trim: true },
  whatsapp: { type: String, trim: true, default: '' },
  email: { type: String, required: true, lowercase: true, trim: true },
  address: { type: String, trim: true, default: '' },
  // Education
  qualification: { type: String, required: true, trim: true },
  college: { type: String, trim: true, default: '' },
  yearOfPassing: { type: String, trim: true, default: '' },
  percentage: { type: String, trim: true, default: '' },
  // Professional
  skills: { type: String, trim: true, default: '' },
  experience: { type: String, trim: true, default: '' },
  // Files
  resume: { type: String, default: '' },
  passportPhoto: { type: String, default: '' },
  // Extra
  coverLetter: { type: String, trim: true, default: '' },
  // Tracking
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'selected', 'rejected'],
    default: 'pending'
  },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('JrAdvocate', jrAdvocateSchema);
