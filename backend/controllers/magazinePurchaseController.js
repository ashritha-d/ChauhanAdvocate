const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Magazine         = require('../models/Magazine');
const MagazinePurchase = require('../models/MagazinePurchase');
const Payment          = require('../models/Payment');
const SiteSettings     = require('../models/SiteSettings');

async function getRazorpayKeys() {
  const [keyDoc, secretDoc] = await Promise.all([
    SiteSettings.findOne({ key: 'razorpay_key_id' }),
    SiteSettings.findOne({ key: 'razorpay_secret' }),
  ]);
  return {
    keyId:  keyDoc?.value  || process.env.RAZORPAY_KEY_ID  || '',
    secret: secretDoc?.value || process.env.RAZORPAY_SECRET || '',
  };
}

// Check if user already purchased a magazine
exports.checkPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await MagazinePurchase.findOne({
      userId: req.user._id,
      magazineId: id,
      status: 'completed',
    });
    res.json({ success: true, purchased: !!purchase, purchase: purchase || null });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Create Razorpay order for magazine purchase
exports.createRazorpayOrder = async (req, res) => {
  try {
    const magazine = await Magazine.findById(req.params.id).select('title type price isActive');
    if (!magazine || !magazine.isActive) {
      return res.status(404).json({ success: false, message: 'Magazine not found' });
    }
    if (magazine.type !== 'paid') {
      return res.status(400).json({ success: false, message: 'This magazine is free' });
    }
    if (!magazine.price || magazine.price <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid magazine price' });
    }

    // Check already purchased
    const existing = await MagazinePurchase.findOne({
      userId: req.user._id,
      magazineId: magazine._id,
      status: 'completed',
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already purchased', purchased: true });
    }

    const { keyId, secret } = await getRazorpayKeys();
    if (!keyId || !secret) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured' });
    }

    const razorpay    = new Razorpay({ key_id: keyId, key_secret: secret });
    const amountPaise = Math.round(magazine.price * 100);

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `mag_${magazine._id}_${Date.now()}`,
      notes:    { magazineId: String(magazine._id), userId: String(req.user._id) },
    });

    // Pending payment record
    const payment = await Payment.create({
      type:        'magazine',
      referenceId: magazine._id,
      clientName:  req.user.name,
      clientPhone: req.user.phone || '',
      clientEmail: req.user.email || '',
      amount:      String(magazine.price),
      totalAmount: String(magazine.price),
      paymentMethod: 'razorpay',
      razorpay_order_id: order.id,
      status: 'pending_verification',
      details: { magazineId: String(magazine._id), magazineTitle: magazine.title },
    });

    res.json({
      success:        true,
      order_id:       order.id,
      key_id:         keyId,
      amount:         amountPaise,
      payment_db_id:  String(payment._id),
      magazine:       { title: magazine.title, price: magazine.price },
      prefill: {
        name:    req.user.name,
        email:   req.user.email  || '',
        contact: req.user.phone  || '',
      },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Verify Razorpay payment + unlock magazine
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_db_id } = req.body;
    const magazineId = req.params.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payment_db_id) {
      return res.status(400).json({ success: false, message: 'Missing verification fields' });
    }

    const { secret } = await getRazorpayKeys();
    if (!secret) return res.status(503).json({ success: false, message: 'Payment gateway not configured' });

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      await Payment.findByIdAndUpdate(payment_db_id, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update payment
    const payment = await Payment.findByIdAndUpdate(
      payment_db_id,
      {
        status: 'approved',
        razorpay_payment_id,
        razorpay_signature,
        approvedAt: new Date(),
        receiptId: `MAG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      },
      { new: true }
    );

    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    // Create or update purchase record
    await MagazinePurchase.findOneAndUpdate(
      { userId: req.user._id, magazineId },
      {
        userId:       req.user._id,
        magazineId,
        paymentId:    payment._id,
        amount:       payment.amount,
        status:       'completed',
        purchaseDate: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success:   true,
      message:   'Payment verified! You can now download the magazine.',
      purchased: true,
    });
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
