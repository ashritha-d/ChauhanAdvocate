const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema({
  type:           { type: String, required: true },
  gateway:        { type: String, enum: ['cashfree', 'razorpay', 'manual'], default: 'cashfree' },
  payload:        { type: mongoose.Schema.Types.Mixed, default: {} },
  signatureValid: { type: Boolean, default: false },
  processed:      { type: Boolean, default: false },
  error:          { type: String, default: '' },
  paymentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
}, { timestamps: true });

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
