const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  service: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  message: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rescheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  rescheduledDate: { type: Date, default: null },
  rescheduledTime: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  adminNotes: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['qr_code', 'cash', 'none'], default: 'none' },
  paymentStatus: { type: String, enum: ['unpaid', 'pending_verification', 'paid', 'failed'], default: 'unpaid' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  consultationFee: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
