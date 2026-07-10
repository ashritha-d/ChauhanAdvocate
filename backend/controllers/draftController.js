const Draft = require('../models/Draft');
const path = require('path');
const fs = require('fs');

exports.getPublic = async (req, res) => {
  try {
    const items = await Draft.find({ status: 'published' }).sort({ lastSavedAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const { search, contentType, status, page = 1, limit = 50 } = req.query;
    const q = {};
    if (search) q.title = { $regex: search, $options: 'i' };
    if (contentType) q.contentType = contentType;
    if (status) q.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Draft.find(q).sort({ lastSavedAt: -1, updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Draft.countDocuments(q)
    ]);
    res.json({ success: true, data: items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.contentDataJson === 'string') {
      try { data.contentDataJson = JSON.parse(data.contentDataJson); } catch { data.contentDataJson = {}; }
    }
    if (req.files?.thumbnail?.[0]) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.draftFile?.[0]) {
      if (!data.contentDataJson || typeof data.contentDataJson !== 'object') data.contentDataJson = {};
      data.contentDataJson.file = req.files.draftFile[0].path;
    }
    data.lastSavedAt = new Date();
    const item = await Draft.create(data);
    res.status(201).json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.contentDataJson === 'string') {
      try { data.contentDataJson = JSON.parse(data.contentDataJson); } catch { data.contentDataJson = {}; }
    }
    if (req.files?.thumbnail?.[0]) data.thumbnail = req.files.thumbnail[0].path;
    if (req.files?.draftFile?.[0]) {
      if (!data.contentDataJson || typeof data.contentDataJson !== 'object') data.contentDataJson = {};
      data.contentDataJson.file = req.files.draftFile[0].path;
    }
    data.lastSavedAt = new Date();
    const item = await Draft.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const item = await Draft.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    // File stored on Cloudinary — no local cleanup needed
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.publish = async (req, res) => {
  try {
    const item = await Draft.findByIdAndUpdate(
      req.params.id,
      { status: 'published', lastSavedAt: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });
    await Draft.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} drafts deleted` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.bulkPublish = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });
    await Draft.updateMany({ _id: { $in: ids } }, { status: 'published', lastSavedAt: new Date() });
    res.json({ success: true, message: `${ids.length} drafts published` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
