const Magazine         = require('../models/Magazine');
const MagazinePurchase = require('../models/MagazinePurchase');
const Payment          = require('../models/Payment');
const whatsapp         = require('../services/whatsapp');

// Check if user already purchased a magazine (or has pending payment)
exports.checkPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await MagazinePurchase.findOne({
      userId: req.user._id,
      magazineId: id,
    });
    const purchased = purchase?.status === 'completed';
    const pending   = purchase?.status === 'pending_verification';
    res.json({ success: true, purchased, pending, purchase: purchase || null });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Get all of a user's purchased magazines
exports.getMyPurchases = async (req, res) => {
  try {
    const purchases = await MagazinePurchase.find({
      userId: req.user._id,
      status: 'completed',
    })
      .populate('magazineId', 'title coverImage issueNumber category publishedDate pdfFile type price allowDownload')
      .sort({ purchaseDate: -1 });

    res.json({ success: true, data: purchases });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Submit manual (bank transfer / UPI) payment for magazine purchase
exports.submitManualPurchase = async (req, res) => {
  try {
    const { utrNumber, paymentMethod } = req.body;
    const magazineId = req.params.id;

    const magazine = await Magazine.findById(magazineId).select('title type price isActive');
    if (!magazine || !magazine.isActive) {
      return res.status(404).json({ success: false, message: 'Magazine not found' });
    }
    if (magazine.type !== 'paid') {
      return res.status(400).json({ success: false, message: 'This magazine is free — no payment needed' });
    }

    const existing = await MagazinePurchase.findOne({ userId: req.user._id, magazineId });
    if (existing?.status === 'completed') {
      return res.status(409).json({ success: false, message: 'Already purchased', purchased: true });
    }
    if (existing?.status === 'pending_verification') {
      return res.status(409).json({ success: false, message: 'Payment already submitted and is pending verification', pending: true });
    }

    const screenshotUrl = req.file?.path || '';

    const payment = await Payment.create({
      type: 'magazine',
      referenceId: magazine._id,
      clientName:  req.user.name,
      clientPhone: req.user.phone || '',
      clientEmail: req.user.email || '',
      amount:      String(magazine.price),
      totalAmount: String(magazine.price),
      paymentMethod: paymentMethod || 'bank_transfer',
      utrNumber:   utrNumber || '',
      screenshot:  screenshotUrl,
      status:      'pending_verification',
      details:     { magazineId: String(magazineId), magazineTitle: magazine.title },
    });

    await MagazinePurchase.findOneAndUpdate(
      { userId: req.user._id, magazineId },
      { userId: req.user._id, magazineId, paymentId: payment._id, amount: String(magazine.price), status: 'pending_verification', purchaseDate: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    whatsapp.sendAdminPaymentAlert?.({
      name: req.user.name,
      phone: req.user.phone || '',
      paymentMethod: paymentMethod || 'bank_transfer',
      amount: magazine.price,
      service: `Magazine: ${magazine.title}`,
      utrNumber: utrNumber || '',
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Payment submitted! Your magazine will be unlocked after admin verification (usually within a few hours).',
      data: { paymentId: String(payment._id), status: 'pending_verification' },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
