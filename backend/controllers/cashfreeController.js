const axios  = require('axios');
const crypto = require('crypto');
const Payment          = require('../models/Payment');
const PaymentEvent     = require('../models/PaymentEvent');
const Appointment      = require('../models/Appointment');
const MagazinePurchase = require('../models/MagazinePurchase');
const Magazine         = require('../models/Magazine');
const SiteSettings     = require('../models/SiteSettings');
const whatsapp         = require('../services/whatsapp');
const emailService     = require('../services/email');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getCashfreeConfig() {
  const docs = await SiteSettings.find({ key: { $in: ['cashfree_app_id', 'cashfree_secret_key', 'cashfree_environment'] } });
  const m = Object.fromEntries(docs.map(d => [d.key, d.value]));
  const appId  = m.cashfree_app_id      || process.env.CASHFREE_APP_ID      || '';
  const secret = m.cashfree_secret_key  || process.env.CASHFREE_SECRET_KEY  || '';
  const env    = m.cashfree_environment || process.env.CASHFREE_ENVIRONMENT || 'production';
  const baseUrl = env === 'sandbox'
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg';
  return { appId, secret, baseUrl, env };
}

function cfHeaders(appId, secret) {
  return {
    'x-client-id':    appId,
    'x-client-secret': secret,
    'x-api-version':  '2023-08-01',
    'Content-Type':   'application/json',
  };
}

const genOrderId      = () => `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
const genApptId       = () => `APT${String(Date.now()).slice(-8)}`;
const genReceiptId    = () => `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
const genTransactionId = () => `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

function safePhone(phone) {
  return (phone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999';
}

// ── PUBLIC: Create Cashfree order for appointment ─────────────────────────────

exports.createAppointmentOrder = async (req, res) => {
  try {
    const { name, email, phone, service, date, time, message, appointmentMode, amount } = req.body;
    if (!name || !phone || !service || !date || !time || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { appId, secret, baseUrl, env } = await getCashfreeConfig();
    if (!appId || !secret) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured. Contact admin.' });
    }

    const orderId = genOrderId();
    const FRONTEND = process.env.FRONTEND_URL || 'https://ashritha-d.github.io/ChauhanAdvocate';
    const BACKEND  = process.env.BACKEND_URL  || 'https://chauhanadvocate.onrender.com';

    const { data: cfOrder } = await axios.post(`${baseUrl}/orders`, {
      order_id:      orderId,
      order_amount:  parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id:    safePhone(phone),
        customer_name:  name,
        customer_email: email || 'noreply@balulawchamber.in',
        customer_phone: safePhone(phone),
      },
      order_meta: {
        return_url: `${FRONTEND}/payment?order_id=${orderId}&status={order_status}`,
        notify_url: `${BACKEND}/api/payments/cashfree/webhook`,
      },
      order_note: `Consultation: ${service}`,
    }, { headers: cfHeaders(appId, secret) });

    const payment = await Payment.create({
      type:          'appointment',
      clientName:    name,
      clientPhone:   phone,
      clientEmail:   email || '',
      amount:        String(amount),
      totalAmount:   String(amount),
      paymentMethod: 'cashfree',
      status:        'pending_verification',
      utrNumber:     orderId,
      details:       { name, email, phone, service, date, time, message, appointmentMode, orderId, env },
    });

    res.json({
      success:             true,
      payment_session_id:  cfOrder.payment_session_id,
      order_id:            orderId,
      payment_db_id:       String(payment._id),
      environment:         env,
    });
  } catch (err) {
    const msg = err?.response?.data?.message || err.message;
    console.error('[Cashfree createAppointmentOrder]', msg);
    res.status(500).json({ success: false, message: msg });
  }
};

// ── PUBLIC: Create Cashfree order for magazine ────────────────────────────────

exports.createMagazineOrder = async (req, res) => {
  try {
    const magazine = await Magazine.findById(req.params.id).select('title type price isActive');
    if (!magazine || !magazine.isActive) {
      return res.status(404).json({ success: false, message: 'Magazine not found' });
    }
    if (magazine.type !== 'paid') {
      return res.status(400).json({ success: false, message: 'This magazine is free' });
    }

    const existing = await MagazinePurchase.findOne({ userId: req.user._id, magazineId: magazine._id, status: 'completed' });
    if (existing) return res.status(409).json({ success: false, message: 'Already purchased', purchased: true });

    const { appId, secret, baseUrl, env } = await getCashfreeConfig();
    if (!appId || !secret) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured. Contact admin.' });
    }

    const orderId  = genOrderId();
    const FRONTEND = process.env.FRONTEND_URL || 'https://ashritha-d.github.io/ChauhanAdvocate';
    const BACKEND  = process.env.BACKEND_URL  || 'https://chauhanadvocate.onrender.com';

    const { data: cfOrder } = await axios.post(`${baseUrl}/orders`, {
      order_id:       orderId,
      order_amount:   magazine.price,
      order_currency: 'INR',
      customer_details: {
        customer_id:    String(req.user._id),
        customer_name:  req.user.name,
        customer_email: req.user.email || 'noreply@balulawchamber.in',
        customer_phone: safePhone(req.user.phone),
      },
      order_meta: {
        return_url: `${FRONTEND}/magazines?order_id=${orderId}&status={order_status}`,
        notify_url: `${BACKEND}/api/payments/cashfree/webhook`,
      },
      order_note: `Magazine: ${magazine.title}`,
    }, { headers: cfHeaders(appId, secret) });

    const payment = await Payment.create({
      type:          'magazine',
      referenceId:   magazine._id,
      clientName:    req.user.name,
      clientPhone:   req.user.phone || '',
      clientEmail:   req.user.email || '',
      amount:        String(magazine.price),
      totalAmount:   String(magazine.price),
      paymentMethod: 'cashfree',
      status:        'pending_verification',
      utrNumber:     orderId,
      details:       { magazineId: String(magazine._id), magazineTitle: magazine.title, orderId, env },
    });

    await MagazinePurchase.findOneAndUpdate(
      { userId: req.user._id, magazineId: magazine._id },
      { userId: req.user._id, magazineId: magazine._id, paymentId: payment._id, amount: String(magazine.price), status: 'pending_verification' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success:            true,
      payment_session_id: cfOrder.payment_session_id,
      order_id:           orderId,
      payment_db_id:      String(payment._id),
      environment:        env,
    });
  } catch (err) {
    const msg = err?.response?.data?.message || err.message;
    console.error('[Cashfree createMagazineOrder]', msg);
    res.status(500).json({ success: false, message: msg });
  }
};

// ── PUBLIC: Poll order status ─────────────────────────────────────────────────

exports.getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { appId, secret, baseUrl } = await getCashfreeConfig();
    if (!appId || !secret) return res.status(503).json({ success: false, message: 'Gateway not configured' });

    const { data: cfOrder } = await axios.get(`${baseUrl}/orders/${orderId}`, { headers: cfHeaders(appId, secret) });
    const payment = await Payment.findOne({ utrNumber: orderId }).select('status _id type');

    res.json({
      success:        true,
      order_status:   cfOrder.order_status,
      payment_status: payment?.status || 'pending_verification',
      payment_db_id:  payment?._id || null,
      payment_type:   payment?.type || null,
    });
  } catch (err) {
    const msg = err?.response?.data?.message || err.message;
    res.status(500).json({ success: false, message: msg });
  }
};

// ── PUBLIC: Cashfree webhook ──────────────────────────────────────────────────

exports.webhookHandler = async (req, res) => {
  // Cashfree sends x-webhook-timestamp and x-webhook-signature headers
  const timestamp = req.headers['x-webhook-timestamp'] || '';
  const signature = req.headers['x-webhook-signature'] || '';
  const rawBody   = req.rawBody || JSON.stringify(req.body);

  let signatureValid = false;
  try {
    const { secret } = await getCashfreeConfig();
    if (secret && timestamp && signature) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(timestamp + rawBody)
        .digest('base64');
      signatureValid = (expected === signature);
    }
  } catch {}

  // Record every webhook for audit trail
  const eventDoc = await PaymentEvent.create({
    type:           req.body?.type || 'UNKNOWN',
    gateway:        'cashfree',
    payload:        req.body,
    signatureValid,
    processed:      false,
  }).catch(() => null);

  if (!signatureValid) {
    console.warn('[Cashfree webhook] Bad signature — logged but not processed');
    return res.status(200).json({ received: true });
  }

  try {
    const eventType = req.body?.type || '';
    const data      = req.body?.data || {};
    const orderId   = data?.order?.order_id;

    if (!orderId) {
      if (eventDoc) await PaymentEvent.findByIdAndUpdate(eventDoc._id, { processed: true, error: 'No order_id' });
      return res.status(200).json({ received: true });
    }

    const payment = await Payment.findOne({ utrNumber: orderId });
    if (!payment) {
      if (eventDoc) await PaymentEvent.findByIdAndUpdate(eventDoc._id, { processed: true, error: 'Payment not found' });
      return res.status(200).json({ received: true });
    }

    if (eventDoc) await PaymentEvent.findByIdAndUpdate(eventDoc._id, { paymentId: payment._id });

    // Idempotency — skip if already approved/rejected
    if (['approved', 'rejected', 'refunded'].includes(payment.status)) {
      if (eventDoc) await PaymentEvent.findByIdAndUpdate(eventDoc._id, { processed: true, error: 'Already in terminal state' });
      return res.status(200).json({ received: true });
    }

    // ── PAYMENT_SUCCESS_WEBHOOK ───────────────────────────────────────────────
    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const cfPaymentId  = data?.payment?.cf_payment_id || '';
      const transactionId = genTransactionId();
      const receiptId    = genReceiptId();
      const appointmentId = genApptId();

      await Payment.findByIdAndUpdate(payment._id, {
        status:         'approved',
        transactionId,
        receiptId,
        approvedAt:     new Date(),
        isRead:         false,
        details:        { ...(payment.details || {}), cf_payment_id: cfPaymentId },
      });

      if (payment.type === 'appointment') {
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
          paymentMethod:   'cashfree',
          paymentStatus:   'paid',
          consultationFee: payment.amount,
          status:          'confirmed',
          appointmentId,
          paymentId:       payment._id,
        });
        await Payment.findByIdAndUpdate(payment._id, { referenceId: appt._id });

        whatsapp.appointmentPaymentConfirmed?.({
          name: payment.clientName, phone: payment.clientPhone, appointmentId,
          date: appt.date, time: appt.time, appointmentMode: appt.appointmentMode,
          amount: payment.amount, transactionId, receiptId,
        }).catch(() => {});

        if (payment.clientEmail) {
          const adminEmailDoc = await SiteSettings.findOne({ key: 'admin_email' });
          emailService.sendPaymentReceipt?.({
            to: payment.clientEmail, bcc: adminEmailDoc?.value || process.env.ADMIN_EMAIL,
            receiptId, transactionId, appointmentId,
            name: payment.clientName, phone: payment.clientPhone,
            service: d.service || '', date: appt.date, time: appt.time,
            appointmentMode: appt.appointmentMode, amount: payment.amount, paymentMethod: 'Cashfree',
          }).catch(() => {});
        }
      } else if (payment.type === 'magazine') {
        await MagazinePurchase.findOneAndUpdate(
          { paymentId: payment._id },
          { status: 'completed', purchaseDate: new Date() }
        );
      }

    // ── PAYMENT_FAILED / USER_DROPPED ─────────────────────────────────────────
    } else if (['PAYMENT_FAILED_WEBHOOK', 'PAYMENT_USER_DROPPED_WEBHOOK'].includes(eventType)) {
      await Payment.findByIdAndUpdate(payment._id, { status: 'failed' });
      if (payment.type === 'magazine') {
        await MagazinePurchase.findOneAndUpdate({ paymentId: payment._id }, { status: 'failed' });
      }

    // ── REFUND_STATUS_WEBHOOK ─────────────────────────────────────────────────
    } else if (eventType === 'REFUND_STATUS_WEBHOOK') {
      if (data?.refund?.refund_status === 'SUCCESS') {
        await Payment.findByIdAndUpdate(payment._id, { status: 'refunded' });
      }
    }

    if (eventDoc) await PaymentEvent.findByIdAndUpdate(eventDoc._id, { processed: true });
    res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Cashfree webhook error]', err.message);
    if (eventDoc) await PaymentEvent.findByIdAndUpdate(eventDoc._id, { error: err.message }).catch(() => {});
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADMIN: Webhook event logs ─────────────────────────────────────────────────

exports.getWebhookLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, gateway } = req.query;
    const filter = gateway ? { gateway } : {};
    const total  = await PaymentEvent.countDocuments(filter);
    const events = await PaymentEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('paymentId', 'clientName amount status type');
    res.json({ success: true, data: events, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
