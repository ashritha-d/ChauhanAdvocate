/**
 * WhatsApp notification service using Twilio's WhatsApp API.
 *
 * Required .env vars:
 *   TWILIO_ACCOUNT_SID   — Twilio Account SID
 *   TWILIO_AUTH_TOKEN    — Twilio Auth Token
 *   TWILIO_WHATSAPP_FROM — e.g. "whatsapp:+14155238886" (sandbox) or approved number
 *   ADMIN_WHATSAPP       — Admin's number e.g. "whatsapp:+919392538226"
 *
 * If credentials are missing, messages are logged to console instead of sent.
 */

const https = require('https');
const querystring = require('querystring');

function formatTo(number) {
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  const e164 = digits.startsWith('91') ? `+${digits}` : digits.length === 10 ? `+91${digits}` : `+${digits}`;
  return `whatsapp:${e164}`;
}

function sendTwilio(to, body) {
  return new Promise((resolve, reject) => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!sid || !token || !from) {
      console.log('[WhatsApp LOG] To:', to, '\nMessage:', body);
      return resolve({ logged: true });
    }

    const postData = querystring.stringify({ From: from, To: to, Body: body });
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');

    const options = {
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${sid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          console.error('[WhatsApp ERROR]', res.statusCode, data);
          resolve({ error: true, status: res.statusCode });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[WhatsApp REQUEST ERROR]', e.message);
      resolve({ error: true, message: e.message });
    });

    req.write(postData);
    req.end();
  });
}

const adminTo = () => {
  const raw = process.env.ADMIN_WHATSAPP || '';
  if (raw.startsWith('whatsapp:')) return raw;
  return formatTo(raw);
};

async function sendWhatsApp(to, message) {
  const formattedTo = to.startsWith('whatsapp:') ? to : formatTo(to);
  if (!formattedTo) return;
  try {
    await sendTwilio(formattedTo, message);
  } catch (e) {
    console.error('[WhatsApp] Failed to send:', e.message);
  }
}

// ─── Appointment Notifications ───────────────────────────────────────────────

exports.appointmentBooked = async ({ name, phone, appointmentId, date, time }) => {
  const fmtDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const clientMsg = `Dear ${name},\n\nYour appointment has been successfully booked.\n\nAppointment ID: ${appointmentId}\nDate: ${fmtDate}\nTime: ${time}\n\nThank you.\nBalu Law Chamber`;

  const adminMsg = `New appointment booked.\n\nClient: ${name}\nPhone: ${phone}\nDate: ${fmtDate}\nTime: ${time}\nID: ${appointmentId}`;

  await Promise.all([
    sendWhatsApp(phone, clientMsg),
    adminTo() ? sendWhatsApp(adminTo(), adminMsg) : Promise.resolve(),
  ]);
};

exports.appointmentConfirmed = async ({ name, phone, appointmentId, date, time }) => {
  const fmtDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const clientMsg = `Dear ${name},\n\nYour appointment has been confirmed.\n\nAppointment ID: ${appointmentId}\nDate: ${fmtDate}\nTime: ${time}\n\nWe look forward to meeting you.\nBalu Law Chamber`;

  await sendWhatsApp(phone, clientMsg);
};

exports.appointmentRescheduled = async ({ name, phone, appointmentId, newDate, newTime }) => {
  const fmtDate = new Date(newDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const clientMsg = `Dear ${name},\n\nYour appointment has been rescheduled.\n\nAppointment ID: ${appointmentId}\nNew Date: ${fmtDate}\nNew Time: ${newTime}\n\nPlease note the updated schedule.\nBalu Law Chamber`;

  const adminMsg = `Appointment rescheduled.\n\nClient: ${name}\nPhone: ${phone}\nID: ${appointmentId}\nNew Date: ${fmtDate}\nNew Time: ${newTime}`;

  await Promise.all([
    sendWhatsApp(phone, clientMsg),
    adminTo() ? sendWhatsApp(adminTo(), adminMsg) : Promise.resolve(),
  ]);
};

exports.appointmentCancelled = async ({ name, phone, appointmentId }) => {
  const clientMsg = `Dear ${name},\n\nYour appointment (ID: ${appointmentId}) has been cancelled.\n\nPlease contact us to choose another slot.\n\nBalu Law Chamber`;

  await sendWhatsApp(phone, clientMsg);
};

exports.appointmentCompleted = async ({ name, phone, appointmentId }) => {
  const clientMsg = `Dear ${name},\n\nYour appointment (ID: ${appointmentId}) has been marked as completed.\n\nThank you for choosing Balu Law Chamber. We hope we were able to assist you.`;

  await sendWhatsApp(phone, clientMsg);
};

// ─── Order Notifications ──────────────────────────────────────────────────────

exports.orderPlaced = async ({ name, phone, orderId, bookTitle }) => {
  const clientMsg = `Dear ${name},\n\nYour order has been received.\n\nOrder ID: ${orderId}\nBook: ${bookTitle}\n\nWe will confirm your order within 24 hours.\nBalu Law Chamber`;

  const adminMsg = `New book order placed.\n\nCustomer: ${name}\nPhone: ${phone}\nOrder ID: ${orderId}\nBook: ${bookTitle}`;

  await Promise.all([
    sendWhatsApp(phone, clientMsg),
    adminTo() ? sendWhatsApp(adminTo(), adminMsg) : Promise.resolve(),
  ]);
};

exports.orderConfirmed = async ({ name, phone, orderId }) => {
  const clientMsg = `Dear ${name},\n\nYour order has been confirmed.\n\nOrder ID: ${orderId}\n\nThank you for your purchase.\nBalu Law Chamber`;

  await sendWhatsApp(phone, clientMsg);
};

exports.orderProcessing = async ({ name, phone, orderId }) => {
  const clientMsg = `Dear ${name},\n\nYour order (ID: ${orderId}) is now being processed and will be shipped soon.\n\nBalu Law Chamber`;

  await sendWhatsApp(phone, clientMsg);
};

exports.orderShipped = async ({ name, phone, orderId, trackingNumber }) => {
  const trackInfo = trackingNumber ? `\nTracking Number: ${trackingNumber}` : '';
  const clientMsg = `Dear ${name},\n\nYour order has been shipped.${trackInfo}\n\nOrder ID: ${orderId}\n\nBalu Law Chamber`;

  await sendWhatsApp(phone, clientMsg);
};

exports.orderDelivered = async ({ name, phone, orderId }) => {
  const clientMsg = `Dear ${name},\n\nYour order (ID: ${orderId}) has been delivered successfully.\n\nThank you!\nBalu Law Chamber`;

  await sendWhatsApp(phone, clientMsg);
};

exports.orderCancelled = async ({ name, phone, orderId }) => {
  const clientMsg = `Dear ${name},\n\nYour order (ID: ${orderId}) has been cancelled.\n\nFor assistance, please contact us.\nBalu Law Chamber`;

  await sendWhatsApp(phone, clientMsg);
};
