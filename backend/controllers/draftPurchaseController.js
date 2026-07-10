const DraftPurchase = require('../models/DraftPurchase');
const Draft = require('../models/Draft');

// USER: purchase a paid draft
exports.create = async (req, res) => {
  try {
    const draftId = req.params.draftId;
    const draft = await Draft.findById(draftId);
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
    if (draft.accessType !== 'paid') return res.status(400).json({ success: false, message: 'This draft is free to download' });

    // Check if user already has a non-rejected purchase
    const existing = await DraftPurchase.findOne({ userId: req.user._id, draftId, status: { $ne: 'rejected' } });
    if (existing) return res.json({ success: true, data: existing, alreadyExists: true });

    const { paymentMethod, utrNumber } = req.body;
    const screenshotPath = req.file?.path || '';

    const purchase = await DraftPurchase.create({
      userId: req.user._id,
      draftId,
      draftTitle: draft.title,
      amount: draft.price || 0,
      paymentMethod: paymentMethod || 'upi_id',
      utrNumber: utrNumber || '',
      screenshot: screenshotPath,
    });
    res.status(201).json({ success: true, data: purchase });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// USER: check purchase status for a specific draft
exports.checkStatus = async (req, res) => {
  try {
    const purchase = await DraftPurchase.findOne({
      userId: req.user._id,
      draftId: req.params.draftId,
      status: { $ne: 'rejected' },
    });
    res.json({ success: true, purchased: !!purchase, status: purchase?.status || null, data: purchase || null });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// USER: get all my draft purchases
exports.getMyPurchases = async (req, res) => {
  try {
    const items = await DraftPurchase.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('draftId', 'title contentDataJson accessType price');
    res.json({ success: true, data: items });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ADMIN: get all purchases
exports.getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const q = {};
    if (search) q.draftTitle = { $regex: search, $options: 'i' };
    if (status) q.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      DraftPurchase.find(q).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('userId', 'name email phone')
        .populate('draftId', 'title'),
      DraftPurchase.countDocuments(q),
    ]);
    res.json({ success: true, data: items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ADMIN: approve or reject purchase
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const item = await DraftPurchase.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await DraftPurchase.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
