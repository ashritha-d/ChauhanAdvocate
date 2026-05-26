const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = generateToken(admin._id);
    res.json({ success: true, token, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.admin._id, { name, avatar }, { new: true, runValidators: true });
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password');
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    admin.password = newPassword;
    await admin.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedAdmin = async (req, res) => {
  try {
    const email = req.body.email || process.env.ADMIN_EMAIL;
    const password = req.body.password || process.env.ADMIN_PASSWORD;
    const name = req.body.name || process.env.ADMIN_NAME || 'Admin';
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const exists = await Admin.findOne({ email });
    if (exists) return res.json({ success: true, message: 'Admin already exists' });
    await Admin.create({ name, email, password, role: 'superadmin' });
    res.json({ success: true, message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
