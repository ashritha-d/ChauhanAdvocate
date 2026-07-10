const mongoose = require('mongoose');

const draftPurchaseSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  draftId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Draft', required: true },
  draftTitle:    { type: String, default: '' },
  amount:        { type: Number, required: true },
  paymentMethod: { type: String, default: 'upi_id' },
  utrNumber:     { type: String, default: '', trim: true },
  screenshot:    { type: String, default: '' },
  status:        { type: String, enum: ['pending_verification', 'approved', 'rejected'], default: 'pending_verification' },
}, { timestamps: true });

// Prevent duplicate purchase submissions
draftPurchaseSchema.index({ userId: 1, draftId: 1 });

module.exports = mongoose.model('DraftPurchase', draftPurchaseSchema);
