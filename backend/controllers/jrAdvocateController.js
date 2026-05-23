const JrAdvocate = require('../models/JrAdvocate');

exports.createJrAdvocate = async (req, res) => {
  try {
    const resume = req.file ? `/uploads/${req.file.filename}` : '';
    const jrAdvocate = await JrAdvocate.create({ ...req.body, resume });
    res.status(201).json({ success: true, message: 'Application submitted successfully!', data: jrAdvocate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllJrAdvocates = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { qualification: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await JrAdvocate.countDocuments(query);
    const applications = await JrAdvocate.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: applications, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getJrAdvocate = async (req, res) => {
  try {
    const application = await JrAdvocate.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateJrAdvocate = async (req, res) => {
  try {
    const application = await JrAdvocate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteJrAdvocate = async (req, res) => {
  try {
    const application = await JrAdvocate.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await JrAdvocate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const total = await JrAdvocate.countDocuments();
    const unread = await JrAdvocate.countDocuments({ isRead: false });
    res.json({ success: true, stats, total, unread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
