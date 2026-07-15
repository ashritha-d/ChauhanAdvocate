const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const BookOrder = require('../models/BookOrder');
const SiteSettings = require('../models/SiteSettings');
const UserNotification = require('../models/UserNotification');
const whatsapp = require('../services/whatsapp');
const { isSlotTaken, withOptionalTransaction } = require('../utils/slotUtils');

async function getSettingValue(key) {
  const s = await SiteSettings.findOne({ key });
  return s?.value || '';
}

// PUBLIC: Get payment settings (bank details, UPI ID, QR URL)
exports.getPaymentSettings = async (req, res) => {
  try {
    const keys = [
      'payment_upi_id',
      'payment_qr_image',
      'consultation_fee',
      'consultation_fee_online',
      'consultation_fee_offline',
      'admin_email',
      'bank_account_holder',
      'bank_name',
      'bank_account_number',
      'bank_ifsc',
    ];
    const settings = await SiteSettings.find({ key: { $in: keys } });
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });

    if (!result.consultation_fee_online) result.consultation_fee_online = '1';
    if (!result.consultation_fee_offline) result.consultation_fee_offline = '2';

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUBLIC: Submit manual UPI / QR / bank transfer payment for appointment
exports.createManualPayment = async (req, res) => {
  try {
    const {
      name, email, phone, service, date, time, message, appointmentMode,
      amount, paymentMethod, utrNumber,
    } = req.body;
    // SEC-04: userId is always derived from the authenticated session — never trusted from the request body
    const userId = req.user?._id || undefined;

    if (!name || !phone || !service || !date || !time) {
      return res.status(400).json({ success: false, message: 'Missing required appointment fields' });
    }

    let appt;
    try {
      appt = await withOptionalTransaction(async (session) => {
        if (await isSlotTaken(date, time, session)) {
          const e = new Error('SLOT_TAKEN'); e.slotTaken = true; throw e;
        }
        const [created] = await Appointment.create([{
          name, email: email || '', phone, service,
          date: new Date(date), time,
          message: message || '',
          appointmentMode: appointmentMode || 'offline',
          paymentMethod: paymentMethod || 'bank_transfer',
          paymentStatus: 'pending_verification',
          consultationFee: String(amount || 0),
          status: 'pending',
          ...(userId ? { userId } : {}),
        }], session ? { session } : {});
        return created;
      });
    } catch (err) {
      if (err.slotTaken) {
        return res.status(409).json({ success: false, message: 'This appointment slot is no longer available. Please choose another time.' });
      }
      throw err;
    }

    // BUG-02: Use Cloudinary URL from multer-storage-cloudinary (req.file.path = secure_url)
    const screenshotPath = req.file?.path || '';

    const payment = await Payment.create({
      type: 'appointment',
      referenceId: appt._id,
      clientName: name,
      clientPhone: phone,
      clientEmail: email || '',
      amount: String(amount || 0),
      paymentMethod: paymentMethod || 'bank_transfer',
      utrNumber: utrNumber || '',
      screenshot: screenshotPath,
      status: 'pending_verification',
      details: { name, email, phone, service, date, time, message, appointmentMode },
    });

    await Appointment.findByIdAndUpdate(appt._id, { paymentId: payment._id });

    // In-app notification for logged-in users
    if (userId) {
      await UserNotification.create({
        userId,
        title: 'Appointment Booked',
        message: `Your appointment for "${service}" on ${new Date(date).toLocaleDateString('en-IN')} at ${time} has been received. Payment is pending verification.\nAppointment ID: ${appt.appointmentId}`,
        type: 'appointment',
        referenceId: appt._id,
        referenceType: 'Appointment',
      }).catch(() => {});
    }

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

// PUBLIC: Submit manual UPI/QR payment for a book order
exports.createBookManualPayment = async (req, res) => {
  try {
    const {
      name, email, phone, whatsappNumber, bookTitle, bookPrice,
      address, quantity, notes, paymentMethod, utrNumber, orderId,
    } = req.body;
    // SEC-04: userId always from verified JWT session, never from request body
    const userId = req.user?._id || undefined;

    if (!name || !phone || !bookTitle || !address) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const order = await BookOrder.create({
      name,
      email: email || '',
      phone,
      bookTitle,
      bookPrice: String(bookPrice || ''),
      address,
      quantity: parseInt(quantity) || 1,
      notes: notes || '',
      orderId: orderId || undefined,
      userId: userId || undefined,
      paymentMethod: 'qr_code',
      paymentStatus: parseFloat(bookPrice) > 0 ? 'pending_verification' : 'unpaid',
      status: 'pending',
    });

    // BUG-02: Use Cloudinary URL (req.file.path = secure_url from multer-storage-cloudinary)
    const screenshotPath = req.file?.path || '';

    let payment = null;
    if (parseFloat(bookPrice) > 0) {
      const totalAmount = parseFloat(bookPrice) * (parseInt(quantity) || 1);
      payment = await Payment.create({
        type: 'book_order',
        referenceId: order._id,
        clientName: name,
        clientPhone: phone,
        clientEmail: email || '',
        amount: String(totalAmount),
        paymentMethod: paymentMethod || 'qr_code',
        utrNumber: utrNumber || '',
        screenshot: screenshotPath,
        status: 'pending_verification',
        details: { bookTitle, quantity, address, notes },
      });
      await BookOrder.findByIdAndUpdate(order._id, { paymentId: payment._id });
    }

    if (userId) {
      const totalAmt = parseFloat(bookPrice) > 0
        ? `\nTotal: ₹${parseFloat(bookPrice) * (parseInt(quantity) || 1)}`
        : '';
      await UserNotification.create({
        userId,
        title: 'Book Order Placed',
        message: `Your order for "${bookTitle}" (Qty: ${parseInt(quantity) || 1}) has been placed.${totalAmt} Payment pending verification.\nOrder ID: ${order.orderId || order._id}`,
        type: 'order',
        referenceId: order._id,
        referenceType: 'BookOrder',
      }).catch(() => {});
    }

    whatsapp.orderPlaced({
      name,
      phone: whatsappNumber || phone,
      orderId: order.orderId || order._id.toString(),
      bookTitle,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Book order placed! Payment is pending verification.',
      data: {
        orderId: order.orderId || order._id,
        paymentId: payment?._id,
        status: order.paymentStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
