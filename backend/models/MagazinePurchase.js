const mongoose = require('mongoose');

const magazinePurchaseSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  magazineId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Magazine', required: true },
  paymentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  amount:      { type: String, default: '0' },
  status:      { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  purchaseDate:{ type: Date, default: null },
}, { timestamps: true });

// One active purchase per user per magazine
magazinePurchaseSchema.index({ userId: 1, magazineId: 1 }, { unique: true });

module.exports = mongoose.model('MagazinePurchase', magazinePurchaseSchema);
