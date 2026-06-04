const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const SiteSettings = require('../models/SiteSettings');
const whatsapp = require('../services/whatsapp');
const emailService = require('../services/email');

async function getSettingValue(key) {
  const s = await SiteSettings.findOne({ key });
  return s?.value || '';
}

async function getRazorpayKeys() {
  const keyId = (await getSettingValue('razorpay_key_id')) || process.env.RAZORPAY_KEY_ID;
  const secret = (await getSettingValue('razorpay_secret')) || process.env.RAZORPAY_SECRET;
  return { keyId, secret };
}

function generateTransactionId() {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function generateReceiptId() {
  return `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

function generateAppointmentId() {
  return `APT${String(Date.now()).slice(-8)}`;
}

// PUBLIC: Get payment settings (key_id, UPI ID, QR URL — never expose secret)
exports.getPaymentSettings = async (req, res) => {
  try {
    const keys = [
      'razorpay_key_id',
      'payment_upi_id',
      'payment_qr_image',
      'consultation_fee',
      'consultation_fee_online',
      'consultation_fee_offline',
      'admin_email',
    ];
    const settings = await SiteSettings.find({ key: { $in: keys } });
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });

    // Fallback fee values
    if (!result.consultation_fee_online) result.consultation_fee_online = '1';
    if (!result.consultation_fee_offline) result.consultation_fee_offline = '2';

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUBLIC: Create Razorpay order — appointment is NOT created yet (only after payment verified)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { name, email, phone, service, date, time, message, appointmentMode, amount } = req.body;

    if (!name || !phone || !service || !date || !time || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { keyId, secret } = await getRazorpayKeys();
    if (!keyId || !secret) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured. Please contact admin.' });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
    const amountPaise = Math.round(parseFloat(amount) * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `appt_${Date.now()}`,
      notes: { name, phone, service, appointmentMode },
    });

    // Store appointment details in the payment record only.
    // The actual Appointment document is created in verifyRazorpayPayment
    // AFTER the payment signature is verified — so no appointment exists until payment succeeds.
    const payment = await Payment.create({
      type: 'appointment',
      clientName: name,
      clientPhone: phone,
      clientEmail: email || '',
      amount: String(amount),
      totalAmount: String(amount),
      paymentMethod: 'razorpay',
      razorpay_order_id: order.id,
      status: 'pending_verification',
      details: { name, email, phone, service, date, time, message, appointmentMode },
    });

    res.json({
      success: true,
      order_id: order.id,
      key_id: keyId,
      amount: amountPaise,
      payment_db_id: String(payment._id),
      prefill: { name, email: email || '', contact: phone },
    });
  } catch (err) {
    console.error('[Razorpay createOrder]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUBLIC: Verify Razorpay payment signature + confirm appointment
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_db_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payment_db_id) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    // Check for duplicate payment (prevent double processing)
    const existing = await Payment.findOne({ razorpay_payment_id });
    if (existing && existing.status === 'approved') {
      return res.json({ success: true, message: 'Payment already verified', alreadyProcessed: true });
    }

    const { secret } = await getRazorpayKeys();
    if (!secret) return res.status(503).json({ success: false, message: 'Payment gateway not configured' });

    // HMAC-SHA256 signature verification
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      // Mark payment as failed
      await Payment.findByIdAndUpdate(payment_db_id, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // Generate IDs
    const transactionId = generateTransactionId();
    const receiptId = generateReceiptId();
    const appointmentId = generateAppointmentId();

    // Update payment record
    const payment = await Payment.findByIdAndUpdate(
      payment_db_id,
      {
        status: 'approved',
        razorpay_payment_id,
        razorpay_signature,
        transactionId,
        receiptId,
        approvedAt: new Date(),
        isRead: false,
      },
      { new: true }
    );

    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    // Create appointment NOW — only after payment is verified.
    // No appointment record existed before this point.
    const d = payment.details || {};
    const appt = await Appointment.create({
      name:            d.name            || payment.clientName,
      email:           d.email           || payment.clientEmail || '',
      phone:           d.phone           || payment.clientPhone,
      service:         d.service         || '',
      date:            d.date ? new Date(d.date) : new Date(),
      time:            d.time            || '',
      message:         d.message         || '',
      appointmentMode: d.appointmentMode || 'offline',
      paymentMethod:   'razorpay',
      paymentStatus:   'paid',
      consultationFee: payment.amount,
      status:          'confirmed',
      appointmentId,
      paymentId:       payment._id,
    });

    // Link payment → appointment
    await Payment.findByIdAndUpdate(payment._id, { referenceId: appt._id });

    // WhatsApp notifications (non-blocking)
    whatsapp.appointmentPaymentConfirmed({
      name: payment.clientName,
      phone: payment.clientPhone,
      appointmentId,
      date: appt?.date,
      time: appt?.time || '',
      appointmentMode: appt?.appointmentMode || 'offline',
      amount: payment.amount,
      transactionId,
      receiptId,
    }).catch(e => console.error('[WhatsApp]', e.message));

    // Email receipt (non-blocking)
    if (payment.clientEmail) {
      const adminEmail = (await getSettingValue('admin_email')) || process.env.ADMIN_EMAIL;
      emailService.sendPaymentReceipt({
        to: payment.clientEmail,
        bcc: adminEmail,
        receiptId,
        transactionId,
        appointmentId,
        name: payment.clientName,
        phone: payment.clientPhone,
        service: payment.details?.service || '',
        date: appt?.date,
        time: appt?.time || '',
        appointmentMode: appt?.appointmentMode || 'offline',
        amount: payment.amount,
        paymentMethod: 'Razorpay',
      }).catch(e => console.error('[Email]', e.message));
    }

    res.json({
      success: true,
      transactionId,
      receiptId,
      appointmentId,
      appointmentData: appt,
      paymentData: {
        _id: payment._id,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
      },
    });
  } catch (err) {
    console.error('[Razorpay verifyPayment]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUBLIC: Submit manual UPI / QR payment for appointment
exports.createManualPayment = async (req, res) => {
  try {
    const {
      name, email, phone, service, date, time, message, appointmentMode,
      amount, paymentMethod, utrNumber,
    } = req.body;

    if (!name || !phone || !service || !date || !time) {
      return res.status(400).json({ success: false, message: 'Missing required appointment fields' });
    }

    const appt = await Appointment.create({
      name, email: email || '', phone, service,
      date: new Date(date), time,
      message: message || '',
      appointmentMode: appointmentMode || 'offline',
      paymentMethod: paymentMethod || 'qr_code',
      paymentStatus: 'pending_verification',
      consultationFee: String(amount || 0),
      status: 'pending',
    });

    const screenshotPath = req.file ? `/uploads/payments/${req.file.filename}` : '';

    const payment = await Payment.create({
      type: 'appointment',
      referenceId: appt._id,
      clientName: name,
      clientPhone: phone,
      clientEmail: email || '',
      amount: String(amount || 0),
      paymentMethod: paymentMethod || 'qr_code',
      utrNumber: utrNumber || '',
      screenshot: screenshotPath,
      status: 'pending_verification',
      details: { name, email, phone, service, date, time, message, appointmentMode },
    });

    await Appointment.findByIdAndUpdate(appt._id, { paymentId: payment._id });

    // Notify admin via WhatsApp
    const adminNumber = whatsapp.getAdminNumber?.() ||
      (process.env.ADMIN_WHATSAPP ? process.env.ADMIN_WHATSAPP.replace(/\D/g, '') : '');
    if (adminNumber) {
      whatsapp.sendAdminPaymentAlert({
        name, phone, paymentMethod, amount,
        service, date, time,
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Appointment submitted! Payment is pending verification. We will confirm within a few hours.',
      data: { paymentId: payment._id, status: payment.status },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
