const mongoose = require('mongoose');

const magazineSchema = new mongoose.Schema({
  title:               { type: String, required: true, trim: true },
  slug:                { type: String, unique: true, sparse: true },
  coverImage:          { type: String, default: '' },
  pdfFile:             { type: String, default: '' },       // public preview / free full PDF
  previewPdf:          { type: String, default: '' },       // explicit preview for paid magazines
  fullPdf:             { type: String, default: '' },       // protected full PDF (paid only)
  description:         { type: String, trim: true, default: '' },
  issueNumber:         { type: String, trim: true, default: '' },
  publishedDate:       { type: Date, default: Date.now },
  category:            { type: String, trim: true, default: 'General' },
  tags:                [{ type: String }],
  featured:            { type: Boolean, default: false },
  isActive:            { type: Boolean, default: true },
  order:               { type: Number, default: 0 },
  // Monetisation
  type:                { type: String, enum: ['free', 'paid'], default: 'free' },
  price:               { type: Number, default: 0, min: 0 },
  purchaseButtonText:  { type: String, default: 'Purchase Now', trim: true },
  allowDownload:       { type: Boolean, default: true },
  downloadCount:       { type: Number, default: 0 },
}, { timestamps: true });

magazineSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    const base = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    this.slug = `${base}-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Magazine', magazineSchema);
