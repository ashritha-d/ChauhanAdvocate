const Internship = require('../models/Internship');

exports.create = async (req, res) => {
  try {
    const { userId, name, email, phone, programmeName, amount, paymentMethod, utrNumber } = req.body;
    const screenshotPath = req.file?.path || '';
    const item = await Internship.create({
      ...(userId ? { userId } : {}),
      name, email: email || '', phone,
      programmeName: programmeName || 'LLB Internship Programme',
      amount: parseFloat(amount) || 1000,
      paymentMethod: paymentMethod || 'upi_id',
      utrNumber: utrNumber || '',
      screenshot: screenshotPath,
    });
    res.status(201).json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMyApplications = async (req, res) => {
  try {
    const items = await Internship.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const { search, status, paymentStatus, page = 1, limit = 50 } = req.query;
    const q = {};
    if (search) q.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    if (status) q.status = status;
    if (paymentStatus) q.paymentStatus = paymentStatus;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Internship.find(q).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Internship.countDocuments(q),
    ]);
    res.json({ success: true, data: items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, paymentStatus, notes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (notes !== undefined) update.notes = notes;
    const item = await Internship.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const item = await Internship.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
