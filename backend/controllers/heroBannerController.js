const HeroBanner = require('../models/HeroBanner');

exports.getAll = async (req, res) => {
  try {
    const banners = await HeroBanner.find({ isActive: true }).sort('order');
    res.json({ success: true, data: banners });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAdminAll = async (req, res) => {
  try {
    const banners = await HeroBanner.find().sort('order');
    res.json({ success: true, data: banners });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const banner = await HeroBanner.create(req.body);
    res.status(201).json({ success: true, data: banner, message: 'Banner created' });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const banner = await HeroBanner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, data: banner, message: 'Banner updated' });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const banner = await HeroBanner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
