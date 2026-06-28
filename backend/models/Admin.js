const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  username:     { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, trim: true, default: '' },
  password:     { type: String, required: true, minlength: 6, select: false },
  role:         { type: String, enum: ['superadmin', 'admin', 'editor', 'content_manager', 'support'], default: 'admin' },
  permissions:  { type: [String], default: [] },
  avatar:       { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
  lastLogin:    { type: Date },
  lastLoginIp:  { type: String, default: '' },
  deletedAt:    { type: Date, default: null },
}, { timestamps: true });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
