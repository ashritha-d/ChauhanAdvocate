const mongoose = require('mongoose');
const contactDetailSchema = new mongoose.Schema({
  officeName: { type: String, required: true, trim: true },
  address: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  whatsapp: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  mapsLink: { type: String, trim: true, default: '' },
  facebookLink: { type: String, trim: true, default: '' },
  instagramLink: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('ContactDetail', contactDetailSchema);
