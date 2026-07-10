const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:          { type: String, required: true, trim: true },
  email:         { type: String, default: '', trim: true, lowercase: true },
  phone:         { type: String, required: true, trim: true },
  programmeName: { type: String, default: 'LLB Internship Programme' },
  amount:        { type: Number, default: 1000 },
  paymentMethod: { type: String, default: 'upi_id' },
  utrNumber:     { type: String, default: '', trim: true },
  screenshot:    { type: String, default: '' },
  paymentStatus: { type: String, enum: ['pending_verification', 'paid', 'rejected'], default: 'pending_verification' },
  status:        { type: String, enum: ['pending', 'under_review', 'selected', 'rejected', 'completed'], default: 'pending' },
  notes:         { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Internship', internshipSchema);
