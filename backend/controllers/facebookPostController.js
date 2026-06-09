const FacebookPost = require('../models/FacebookPost');
const path = require('path');
const fs = require('fs');

const FB_URL_PATTERN = /^https?:\/\/(www\.|m\.)?facebook\.com\/.+|^https?:\/\/fb\.watch\/.+/;

function isValidFacebookUrl(url) {
  return url && FB_URL_PATTERN.test(url.trim());
}

exports.getPublic = async (req, res) => {
  try {
    const posts = await FacebookPost.find({ isActive: true }).sort({ order: 1, date: -1 });
    res.json({ success: true, data: posts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const posts = await FacebookPost.find().sort({ order: 1, date: -1 });
    res.json({ success: true, data: posts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { facebookUrl } = req.body;
    if (facebookUrl && !isValidFacebookUrl(facebookUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid Facebook URL. Must be a facebook.com or fb.watch link.' });
    }
    const data = { ...req.body };
    if (req.file) data.thumbnail = `/uploads/${req.file.filename}`;
    const post = await FacebookPost.create(data);
    res.status(201).json({ success: true, data: post });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { facebookUrl } = req.body;
    if (facebookUrl && !isValidFacebookUrl(facebookUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid Facebook URL. Must be a facebook.com or fb.watch link.' });
    }
    const data = { ...req.body };
    if (req.file) data.thumbnail = `/uploads/${req.file.filename}`;
    const post = await FacebookPost.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: post });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const post = await FacebookPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Not found' });
    if (post.thumbnail) {
      const filePath = path.join(__dirname, '..', post.thumbnail);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
