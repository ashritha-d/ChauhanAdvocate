const mongoose = require('mongoose');

const jrAdvocateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  qualification: { type: String, required: true, trim: true },
  experience: { type: String, trim: true },
  resume: { type: String, default: '' },
  message: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('JrAdvocate', jrAdvocateSchema);
