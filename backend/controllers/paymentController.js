const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const BookOrder = require('../models/BookOrder');
const MagazinePurchase = require('../models/MagazinePurchase');
const SiteSettings = require('../models/SiteSettings');
const path = require('path');
const fs = require('fs');

// Ensure payments upload directory exists
const paymentsDir = path.join(__dirname, '../uploads/payments');
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

function generateReceiptId() {
  const year = new Date().getFullYear();
  const seq = String(Date.now()).slice(-6);
  return `RCP-${year}-${seq}`;
}

// PUBLIC: Create payment record + linked appointment/book_order in one step
exports.createPayment = async (req, res) => {
  try {
    const {
      type, amount, paymentMethod, utrNumber,
      // appointment fields
      name, email, phone, service, date, time, message,
      // book order fields
      bookTitle, bookPrice, quantity, address, notes
    } = req.body;

    if (!type || !['appointment', 'book_order'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid payment type' });
    }

    let referenceId;
    let itemData;

    if (type === 'appointment') {
      itemData = { name, email, phone, service, date, time, message: message || '' };
      const appt = await Appointment.create({
        ...itemData,
        paymentMethod: paymentMethod || 'qr_code',
        paymentStatus: 'pending_verification',
        consultationFee: amount || ''
      });
      referenceId = appt._id;
    } else {
      itemData = { name, email, phone, bookTitle, bookPrice, quantity: parseInt(quantity) || 1, address, notes: notes || '' };
      const order = await BookOrder.create({
        ...itemData,
        paymentMethod: paymentMethod || 'qr_code',
        paymentStatus: 'pending_verification'
      });
      referenceId = order._id;
    }

    const screenshotPath = req.file ? `/uploads/payments/${req.file.filename}` : '';

    const payment = await Payment.create({
      type,
      referenceId,
      clientName: name,
      clientPhone: phone,
      clientEmail: email || '',
      amount: amount || '0',
      paymentMethod: paymentMethod || 'qr_code',
      utrNumber: utrNumber || '',
      screenshot: screenshotPath,
      details: itemData
    });

    // Link payment back to the record
    if (type === 'appointment') {
      await Appointment.findByIdAndUpdate(referenceId, { paymentId: payment._id });
    } else {
      await BookOrder.findByIdAndUpdate(referenceId, { paymentId: payment._id });
    }

    res.status(201).json({
      success: true,
      message: 'Payment submitted for verification! We will confirm your booking shortly.',
      data: { paymentId: payment._id, status: payment.status }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Get all payments with filters
exports.getAllPayments = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const unread = await Payment.countDocuments({ isRead: false });
    res.json({ success: true, data: payments, total, unread, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Get single payment with linked record
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    let linkedRecord = null;
    if (payment.referenceId) {
      if (payment.type === 'appointment') {
        linkedRecord = await Appointment.findById(payment.referenceId);
      } else {
        linkedRecord = await BookOrder.findById(payment.referenceId);
      }
    }

    // Mark as read
    if (!payment.isRead) { payment.isRead = true; await payment.save(); }

    res.json({ success: true, data: payment, linkedRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Approve or reject payment
exports.updatePayment = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = status || payment.status;
    if (adminNotes !== undefined) payment.adminNotes = adminNotes;
    payment.isRead = true;

    if (status === 'approved') {
      payment.approvedAt = new Date();
      if (!payment.receiptId) payment.receiptId = generateReceiptId();

      // Confirm the linked record
      if (payment.type === 'appointment') {
        await Appointment.findByIdAndUpdate(payment.referenceId, {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentId: payment._id
        });
      } else if (payment.type === 'book_order') {
        await BookOrder.findByIdAndUpdate(payment.referenceId, {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentId: payment._id
        });
      } else if (payment.type === 'magazine') {
        await MagazinePurchase.findOneAndUpdate(
          { paymentId: payment._id },
          { status: 'completed', purchaseDate: new Date() }
        );
      }
    } else if (status === 'rejected') {
      if (payment.type === 'appointment') {
        await Appointment.findByIdAndUpdate(payment.referenceId, { paymentStatus: 'failed' });
      } else if (payment.type === 'book_order') {
        await BookOrder.findByIdAndUpdate(payment.referenceId, { paymentStatus: 'failed' });
      } else if (payment.type === 'magazine') {
        await MagazinePurchase.findOneAndUpdate(
          { paymentId: payment._id },
          { status: 'failed' }
        );
      }
    }

    await payment.save();
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Stats
exports.getStats = async (req, res) => {
  try {
    const counts = await Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const total = await Payment.countDocuments();
    const unread = await Payment.countDocuments({ isRead: false });
    res.json({ success: true, counts, total, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUBLIC: Get QR image URL from site settings
exports.getQRCode = async (req, res) => {
  try {
    const setting = await SiteSettings.findOne({ key: 'payment_qr_image' });
    const qrUrl = setting?.value || '';
    res.json({ success: true, qrUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Upload QR image and save URL in site settings
exports.uploadQRCode = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const qrUrl = '/uploads/payments/' + req.file.filename;
    await SiteSettings.findOneAndUpdate(
      { key: 'payment_qr_image' },
      { key: 'payment_qr_image', value: qrUrl, group: 'payment' },
      { upsert: true, new: true }
    );
    res.json({ success: true, qrUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Revenue dashboard stats
exports.getRevenue = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); dateFilter.$lte = t; }

    const matchStage = { status: { $in: ['approved', 'completed'] } };
    if (from || to) matchStage.approvedAt = dateFilter;

    const [revenue, byMethod, byMonth, failedCount, pendingCount] = await Promise.all([
      Payment.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: matchStage },
        { $group: { _id: '$paymentMethod', total: { $sum: { $toDouble: '$amount' } }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { year: { $year: '$approvedAt' }, month: { $month: '$approvedAt' } },
            total: { $sum: { $toDouble: '$amount' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({ status: 'pending_verification' }),
    ]);

    res.json({
      success: true,
      totalRevenue: revenue[0]?.total || 0,
      totalApproved: revenue[0]?.count || 0,
      byMethod,
      byMonth,
      failedCount,
      pendingCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: Export payments as CSV
exports.exportPayments = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); query.createdAt.$lte = t; }
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 }).limit(5000);

    const header = [
      'Receipt ID', 'Transaction ID', 'Date', 'Client Name', 'Phone', 'Email',
      'Type', 'Amount (₹)', 'GST (₹)', 'Payment Method', 'Status',
      'UTR/Ref', 'Razorpay Payment ID', 'Appointment/Order ID'
    ].join(',');

    const rows = payments.map(p => [
      p.receiptId || '',
      p.transactionId || '',
      p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '',
      `"${(p.clientName || '').replace(/"/g, '""')}"`,
      p.clientPhone || '',
      p.clientEmail || '',
      p.type || '',
      p.amount || '',
      p.gstAmount || '0',
      p.paymentMethod || '',
      p.status || '',
      p.utrNumber || '',
      p.razorpay_payment_id || '',
      p.referenceId || '',
    ].join(','));

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
