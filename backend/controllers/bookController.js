const Book = require('../models/Book');
const path = require('path');
const fs = require('fs');

exports.getPublic = async (req, res) => {
  try {
    const items = await Book.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const items = await Book.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const item = await Book.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const item = await Book.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const item = await Book.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    if (item.image) {
      const filePath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
