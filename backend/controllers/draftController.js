const Draft = require('../models/Draft');
const path = require('path');
const fs = require('fs');

exports.getPublic = async (req, res) => {
  try {
    const items = await Draft.find({ isActive: true }).sort({ order: 1, date: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const items = await Draft.find().sort({ order: 1, date: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.file = `/uploads/${req.file.filename}`;
    const item = await Draft.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.file = `/uploads/${req.file.filename}`;
    const item = await Draft.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const item = await Draft.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    if (item.file) {
      const filePath = path.join(__dirname, '..', item.file);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
