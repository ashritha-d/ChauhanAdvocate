const Magazine = require('../models/Magazine');
const path = require('path');
const fs = require('fs');

exports.getPublic = async (req, res) => {
  try {
    const items = await Magazine.find({ isActive: true }).sort({ order: 1, publishedDate: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const items = await Magazine.find().sort({ order: 1, publishedDate: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files.coverImage) data.coverImage = `/uploads/${req.files.coverImage[0].filename}`;
      if (req.files.pdfFile) data.pdfFile = `/uploads/${req.files.pdfFile[0].filename}`;
    }
    const item = await Magazine.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files.coverImage) data.coverImage = `/uploads/${req.files.coverImage[0].filename}`;
      if (req.files.pdfFile) data.pdfFile = `/uploads/${req.files.pdfFile[0].filename}`;
    }
    const item = await Magazine.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const item = await Magazine.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
