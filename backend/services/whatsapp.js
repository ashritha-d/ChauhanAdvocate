/**
 * WhatsApp notification service — Fonnte
 * https://fonnte.com
 *
 * Required .env vars:
 *   FONNTE_TOKEN    — API token from fonnte.com → Device → Token
 *   ADMIN_WHATSAPP  — Admin phone e.g. "8523035920"
 */

const https = require('https');
const querystring = require('querystring');

function toE164(number) {
  if (!number) return null;
  const digits = String(number).replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function sendFonnte(to, message) {
  return new Promise((resolve) => {
    const token = process.env.FONNTE_TOKEN;

    if (!token) {
      console.log('[WhatsApp LOG] To:', to, '\nMessage:', message);
      return resolve({ logged: true });
    }

    const postData = querystring.stringify({ target: to, message });

    const options = {
      hostname: 'api.fonnte.com',
      path: '/send',
      method: 'POST',
      headers: {
        'Authorization': token,
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
          if (!json.status) console.error('[WhatsApp FONNTE ERROR]', data);
          else console.log('[WhatsApp SENT] To:', to);
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
  const digits = toE164(number);
  if (!digits) return;
  try {
    await sendFonnte(digits, message);
  } catch (e) {
    console.error('[WhatsApp] Failed:', e.message);
  }
}

const adminNumber = () => toE164(process.env.ADMIN_WHATSAPP || '');

// ─── Appointment Notifications ────────────────────────────────────────────────

exports.appointmentBooked = async ({ name, phone, appointmentId, date, time, appointmentMode }) => {
  const fmtDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const modeLabel = appointmentMode === 'online' ? 'Online' : 'Offline';

  const clientMsg =
`Dear ${name},

Your appointment has been successfully booked.

Appointment ID: ${appointmentId}
Date: ${fmtDate}
Time: ${time}
Mode: ${modeLabel}

Thank you.
Balu Law Chamber`;

  const adminMsg =
`New appointment booked.

Client: ${name}
Phone: ${phone}
Date: ${fmtDate}
Time: ${time}
Mode: ${modeLabel}
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

Thank you for choosing Balu Law Chamber.`);
};

// ─── Order Notifications ──────────────────────────────────────────────────────

exports.orderPlaced = async ({ name, phone, orderId, bookTitle }) => {
  const clientMsg =
`Dear ${name},

Your order has been received.

Order ID: ${orderId}
Book: ${bookTitle}

We will confirm within 24 hours.
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

Thank you!
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
