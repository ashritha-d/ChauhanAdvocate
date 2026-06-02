/**
 * WhatsApp notification service — UltraMsg
 * https://ultramsg.com
 *
 * Required .env vars:
 *   ULTRAMSG_INSTANCE_ID  — e.g. "instance12345"
 *   ULTRAMSG_TOKEN        — your UltraMsg token
 *   ADMIN_WHATSAPP        — admin phone, digits only, e.g. "918523035920"
 *
 * If credentials are missing, messages are logged to console instead.
 * No opt-in required from clients — messages go to any WhatsApp number.
 */

const https = require('https');
const querystring = require('querystring');

function toE164Digits(number) {
  if (!number) return null;
  const digits = String(number).replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function sendUltraMsg(to, body) {
  return new Promise((resolve) => {
    const instance = process.env.ULTRAMSG_INSTANCE_ID;
    const token   = process.env.ULTRAMSG_TOKEN;

    if (!instance || !token) {
      console.log('[WhatsApp LOG] To:', to, '\nMessage:', body);
      return resolve({ logged: true });
    }

    const postData = querystring.stringify({ token, to, body });

    const options = {
      hostname: 'api.ultramsg.com',
      path: `/${instance}/messages/chat`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.sent && !json.id) console.error('[WhatsApp ERROR]', data);
          resolve(json);
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[WhatsApp REQUEST ERROR]', e.message);
      resolve({ error: true });
    });

    req.write(postData);
    req.end();
  });
}

async function sendWhatsApp(number, message) {
  const digits = toE164Digits(number);
  if (!digits) return;
  try {
    await sendUltraMsg(digits, message);
  } catch (e) {
    console.error('[WhatsApp] Failed:', e.message);
  }
}

const adminNumber = () => toE164Digits(process.env.ADMIN_WHATSAPP || '');

// ─── Appointment Notifications ────────────────────────────────────────────────

exports.appointmentBooked = async ({ name, phone, appointmentId, date, time }) => {
  const fmtDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const clientMsg =
`Dear ${name},

Your appointment has been successfully booked.

Appointment ID: ${appointmentId}
Date: ${fmtDate}
Time: ${time}

Thank you.
Balu Law Chamber`;

  const adminMsg =
`New appointment booked.

Client: ${name}
Phone: ${phone}
Date: ${fmtDate}
Time: ${time}
ID: ${appointmentId}`;

  await Promise.all([
    sendWhatsApp(phone, clientMsg),
    adminNumber() ? sendWhatsApp(adminNumber(), adminMsg) : Promise.resolve(),
  ]);
};

exports.appointmentConfirmed = async ({ name, phone, appointmentId, date, time }) => {
  const fmtDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  await sendWhatsApp(phone,
`Dear ${name},

Your appointment has been confirmed.

Appointment ID: ${appointmentId}
Date: ${fmtDate}
Time: ${time}

We look forward to meeting you.
Balu Law Chamber`);
};

exports.appointmentRescheduled = async ({ name, phone, appointmentId, newDate, newTime }) => {
  const fmtDate = new Date(newDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const clientMsg =
`Dear ${name},

Your appointment has been rescheduled.

Appointment ID: ${appointmentId}
New Date: ${fmtDate}
New Time: ${newTime}

Please note the updated schedule.
Balu Law Chamber`;

  const adminMsg =
`Appointment rescheduled.

Client: ${name}
Phone: ${phone}
ID: ${appointmentId}
New Date: ${fmtDate}
New Time: ${newTime}`;

  await Promise.all([
    sendWhatsApp(phone, clientMsg),
    adminNumber() ? sendWhatsApp(adminNumber(), adminMsg) : Promise.resolve(),
  ]);
};

exports.appointmentCancelled = async ({ name, phone, appointmentId }) => {
  await sendWhatsApp(phone,
`Dear ${name},

Your appointment (ID: ${appointmentId}) has been cancelled.

Please contact us to choose another slot.

Balu Law Chamber`);
};

exports.appointmentCompleted = async ({ name, phone, appointmentId }) => {
  await sendWhatsApp(phone,
`Dear ${name},

Your appointment (ID: ${appointmentId}) has been completed.

Thank you for choosing Balu Law Chamber. We hope we were able to assist you.`);
};

// ─── Order Notifications ──────────────────────────────────────────────────────

exports.orderPlaced = async ({ name, phone, orderId, bookTitle }) => {
  const clientMsg =
`Dear ${name},

Your order has been received.

Order ID: ${orderId}
Book: ${bookTitle}

We will confirm your order within 24 hours.
Balu Law Chamber`;

  const adminMsg =
`New book order placed.

Customer: ${name}
Phone: ${phone}
Order ID: ${orderId}
Book: ${bookTitle}`;

  await Promise.all([
    sendWhatsApp(phone, clientMsg),
    adminNumber() ? sendWhatsApp(adminNumber(), adminMsg) : Promise.resolve(),
  ]);
};

exports.orderConfirmed = async ({ name, phone, orderId }) => {
  await sendWhatsApp(phone,
`Dear ${name},

Your order has been confirmed.

Order ID: ${orderId}

Thank you for your purchase.
Balu Law Chamber`);
};

exports.orderProcessing = async ({ name, phone, orderId }) => {
  await sendWhatsApp(phone,
`Dear ${name},

Your order (ID: ${orderId}) is being processed and will be shipped soon.

Balu Law Chamber`);
};

exports.orderShipped = async ({ name, phone, orderId, trackingNumber }) => {
  const trackInfo = trackingNumber ? `\nTracking Number: ${trackingNumber}` : '';
  await sendWhatsApp(phone,
`Dear ${name},

Your order has been shipped.${trackInfo}

Order ID: ${orderId}

Balu Law Chamber`);
};

exports.orderDelivered = async ({ name, phone, orderId }) => {
  await sendWhatsApp(phone,
`Dear ${name},

Your order (ID: ${orderId}) has been delivered successfully.

Thank you!
Balu Law Chamber`);
};

exports.orderCancelled = async ({ name, phone, orderId }) => {
  await sendWhatsApp(phone,
`Dear ${name},

Your order (ID: ${orderId}) has been cancelled.

For assistance, please contact us.
Balu Law Chamber`);
};
