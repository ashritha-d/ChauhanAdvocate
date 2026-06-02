/**
 * WhatsApp notification service — Meta WhatsApp Cloud API (FREE)
 * https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Free tier: 1000 conversations/month — sufficient for a law firm.
 * No client opt-in required. Messages go to any WhatsApp number.
 *
 * Required .env vars:
 *   META_WHATSAPP_TOKEN      — Access token from Meta Developer Console
 *   META_PHONE_NUMBER_ID     — Phone Number ID from Meta Developer Console
 *   ADMIN_WHATSAPP           — Admin phone with country code e.g. "918523035920"
 *
 * Setup:
 *   1. Go to developers.facebook.com → Create App → Business
 *   2. Add WhatsApp product → API Setup
 *   3. Copy Phone Number ID and Access Token
 *   4. Add them to .env and Render environment variables
 */

const https = require('https');

function toE164(number) {
  if (!number) return null;
  const digits = String(number).replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function sendMeta(to, body) {
  return new Promise((resolve) => {
    const token      = process.env.META_WHATSAPP_TOKEN;
    const phoneNumId = process.env.META_PHONE_NUMBER_ID;

    if (!token || !phoneNumId) {
      console.log('[WhatsApp LOG] To:', to, '\nMessage:', body);
      return resolve({ logged: true });
    }

    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    });

    const options = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${phoneNumId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) console.error('[WhatsApp META ERROR]', json.error.message);
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

    req.write(payload);
    req.end();
  });
}

async function sendWhatsApp(number, message) {
  const digits = toE164(number);
  if (!digits) return;
  try {
    await sendMeta(digits, message);
  } catch (e) {
    console.error('[WhatsApp] Failed:', e.message);
  }
}

const adminNumber = () => toE164(process.env.ADMIN_WHATSAPP || '');

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
