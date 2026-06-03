const News = require('../models/News');

// Public — active news only, sorted by priority then date
exports.getActiveNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    let query = News.find({ isActive: true }).sort({ priority: -1, date: -1 });
    if (limit) query = query.limit(limit);
    const news = await query;
    res.json({ success: true, data: news });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Public — paginated news page with search + date filter
exports.getNewsPage = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 9;
    const q     = { isActive: true };
    if (req.query.search) q.title = { $regex: req.query.search, $options: 'i' };
    if (req.query.from)   q.date  = { ...q.date, $gte: new Date(req.query.from) };
    if (req.query.to)     q.date  = { ...q.date, $lte: new Date(req.query.to + 'T23:59:59') };
    const total = await News.countDocuments(q);
    const data  = await News.find(q).sort({ priority: -1, date: -1 }).skip((page - 1) * limit).limit(limit);
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Admin — all news
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ priority: -1, date: -1 });
    const activeCount = news.filter(n => n.isActive).length;
    res.json({ success: true, data: news, activeCount });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createNews = async (req, res) => {
  try {
    const news = await News.create(req.body);
    res.status(201).json({ success: true, data: news });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.updateNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!news) return res.status(404).json({ success: false, message: 'News not found' });
    res.json({ success: true, data: news });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News not found' });
    res.json({ success: true, message: 'News deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
