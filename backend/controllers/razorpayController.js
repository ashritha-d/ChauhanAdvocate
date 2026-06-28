const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const SiteSettings = require('../models/SiteSettings');
const whatsapp = require('../services/whatsapp');

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

    if (!name || !phone || !service || !date || !time) {
      return res.status(400).json({ success: false, message: 'Missing required appointment fields' });
    }

    const appt = await Appointment.create({
      name, email: email || '', phone, service,
      date: new Date(date), time,
      message: message || '',
      appointmentMode: appointmentMode || 'offline',
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentStatus: 'pending_verification',
      consultationFee: String(amount || 0),
      status: 'pending',
    });

    const screenshotPath = req.file?.path || (req.file ? `/uploads/payments/${req.file.filename}` : '');

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
