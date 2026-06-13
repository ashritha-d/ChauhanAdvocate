const path = require('path');
const fs   = require('fs');
const Magazine         = require('../models/Magazine');
const MagazinePurchase = require('../models/MagazinePurchase');

// Fields never returned to public clients
const PUBLIC_EXCLUDE = '-fullPdf';

exports.getPublic = async (req, res) => {
  try {
    const { type } = req.query;
    const q = { isActive: true };
    if (type === 'free' || type === 'paid') q.type = type;
    const items = await Magazine.find(q)
      .select(PUBLIC_EXCLUDE)
      .sort({ order: 1, publishedDate: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const { search, category, featured, status, type, page = 1, limit = 50 } = req.query;
    const q = {};
    if (search)   q.title    = { $regex: search, $options: 'i' };
    if (category) q.category = category;
    if (featured !== undefined && featured !== '') q.featured = featured === 'true';
    if (status === 'active')   q.isActive = true;
    else if (status === 'inactive') q.isActive = false;
    if (type === 'free' || type === 'paid') q.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Magazine.find(q).sort({ order: 1, publishedDate: -1 }).skip(skip).limit(parseInt(limit)),
      Magazine.countDocuments(q),
    ]);
    res.json({ success: true, data: items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [total, free, paid, revenue, downloads] = await Promise.all([
      Magazine.countDocuments(),
      Magazine.countDocuments({ type: 'free' }),
      Magazine.countDocuments({ type: 'paid' }),
      MagazinePurchase.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } },
      ]),
      Magazine.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),
    ]);
    res.json({
      success: true,
      data: {
        total,
        free,
        paid,
        revenue: revenue[0]?.total || 0,
        downloads: downloads[0]?.total || 0,
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

function parseFields(data) {
  if (typeof data.tags        === 'string') data.tags        = data.tags.split(',').map(t => t.trim()).filter(Boolean);
  if (typeof data.featured    === 'string') data.featured    = data.featured    === 'true';
  if (typeof data.isActive    === 'string') data.isActive    = data.isActive    === 'true';
  if (typeof data.allowDownload === 'string') data.allowDownload = data.allowDownload === 'true';
  if (data.price !== undefined) data.price = parseFloat(data.price) || 0;
  return data;
}

exports.create = async (req, res) => {
  try {
    const data = parseFields({ ...req.body });
    if (req.files) {
      if (req.files.coverImage)  data.coverImage  = `/uploads/${req.files.coverImage[0].filename}`;
      if (req.files.pdfFile)     data.pdfFile     = `/uploads/${req.files.pdfFile[0].filename}`;
      if (req.files.previewPdf)  data.previewPdf  = `/uploads/${req.files.previewPdf[0].filename}`;
      if (req.files.fullPdf)     data.fullPdf     = `/uploads/${req.files.fullPdf[0].filename}`;
    }
    const item = new Magazine(data);
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = parseFields({ ...req.body });
    if (req.files) {
      if (req.files.coverImage)  data.coverImage  = `/uploads/${req.files.coverImage[0].filename}`;
      if (req.files.pdfFile)     data.pdfFile     = `/uploads/${req.files.pdfFile[0].filename}`;
      if (req.files.previewPdf)  data.previewPdf  = `/uploads/${req.files.previewPdf[0].filename}`;
      if (req.files.fullPdf)     data.fullPdf     = `/uploads/${req.files.fullPdf[0].filename}`;
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

exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });
    await Magazine.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} magazines deleted` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.bulkPublish = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });
    await Magazine.updateMany({ _id: { $in: ids } }, { isActive });
    res.json({ success: true, message: `${ids.length} magazines updated` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Secure download: full PDF (requires purchase) ──────────────────────────
exports.downloadFull = async (req, res) => {
  try {
    const magazine = await Magazine.findById(req.params.id);
    if (!magazine || !magazine.isActive) {
      return res.status(404).json({ success: false, message: 'Magazine not found' });
    }

    if (magazine.type === 'paid') {
      const purchase = await MagazinePurchase.findOne({
        userId: req.user._id,
        magazineId: magazine._id,
        status: 'completed',
      });
      if (!purchase) {
        return res.status(403).json({ success: false, message: 'Purchase required to download this magazine' });
      }
    }

    if (!magazine.allowDownload) {
      return res.status(403).json({ success: false, message: 'Downloads are not allowed for this magazine' });
    }

    // Choose the correct PDF source
    const pdfPath = magazine.type === 'paid'
      ? (magazine.fullPdf || magazine.pdfFile)
      : magazine.pdfFile;

    if (!pdfPath) {
      return res.status(404).json({ success: false, message: 'PDF not available' });
    }

    // Increment download counter
    Magazine.findByIdAndUpdate(magazine._id, { $inc: { downloadCount: 1 } }).catch(() => {});

    // Return the URL (the client downloads directly)
    res.json({ success: true, url: pdfPath });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Public preview download ───────────────────────────────────────────────
exports.downloadPreview = async (req, res) => {
  try {
    const magazine = await Magazine.findById(req.params.id).select('previewPdf pdfFile type isActive');
    if (!magazine || !magazine.isActive) {
      return res.status(404).json({ success: false, message: 'Magazine not found' });
    }
    const previewPath = magazine.previewPdf || (magazine.type === 'free' ? magazine.pdfFile : '');
    if (!previewPath) {
      return res.status(404).json({ success: false, message: 'Preview not available' });
    }
    res.json({ success: true, url: previewPath });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
