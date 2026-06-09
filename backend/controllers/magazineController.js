const Magazine = require('../models/Magazine');

exports.getPublic = async (req, res) => {
  try {
    const items = await Magazine.find({ isActive: true }).sort({ order: 1, publishedDate: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const { search, category, featured, status, page = 1, limit = 50 } = req.query;
    const q = {};
    if (search) q.title = { $regex: search, $options: 'i' };
    if (category) q.category = category;
    if (featured !== undefined && featured !== '') q.featured = featured === 'true';
    if (status === 'active') q.isActive = true;
    else if (status === 'inactive') q.isActive = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Magazine.find(q).sort({ order: 1, publishedDate: -1 }).skip(skip).limit(parseInt(limit)),
      Magazine.countDocuments(q)
    ]);
    res.json({ success: true, data: items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.tags === 'string') data.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (typeof data.featured === 'string') data.featured = data.featured === 'true';
    if (typeof data.isActive === 'string') data.isActive = data.isActive === 'true';
    if (req.files) {
      if (req.files.coverImage) data.coverImage = `/uploads/${req.files.coverImage[0].filename}`;
      if (req.files.pdfFile) data.pdfFile = `/uploads/${req.files.pdfFile[0].filename}`;
    }
    const item = new Magazine(data);
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.tags === 'string') data.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (typeof data.featured === 'string') data.featured = data.featured === 'true';
    if (typeof data.isActive === 'string') data.isActive = data.isActive === 'true';
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
