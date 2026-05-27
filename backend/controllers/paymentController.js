const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const BookOrder = require('../models/BookOrder');
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
      }
    } else if (status === 'rejected') {
      if (payment.type === 'appointment') {
        await Appointment.findByIdAndUpdate(payment.referenceId, { paymentStatus: 'failed' });
      } else if (payment.type === 'book_order') {
        await BookOrder.findByIdAndUpdate(payment.referenceId, { paymentStatus: 'failed' });
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
