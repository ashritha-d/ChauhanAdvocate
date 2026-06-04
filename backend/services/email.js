const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass },
  });
}

exports.sendPaymentReceipt = async ({
  to, bcc, receiptId, transactionId, appointmentId,
  name, phone, service, date, time, appointmentMode, amount, paymentMethod,
}) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[Email LOG] Receipt would be sent to:', to);
    return;
  }

  const fmtDate = date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  const modeLabel = appointmentMode === 'online' ? 'Online' : 'Offline';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
  .header { background: #1a1a2e; color: #C9A84C; padding: 24px; text-align: center; }
  .header h2 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; color: #aaa; font-size: 13px; }
  .badge { display: inline-block; background: #C9A84C; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 8px; }
  .body { padding: 24px; }
  .row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 8px 0; font-size: 14px; }
  .label { color: #666; }
  .value { font-weight: 600; }
  .total-row { background: #f9f5e7; padding: 12px; border-radius: 8px; margin-top: 12px; }
  .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #888; }
  .success-badge { background: #d4edda; color: #155724; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 16px; }
</style></head>
<body>
  <div class="header">
    <h2>BALU LAW CHAMBER</h2>
    <p>New Venkatramana Colony, Hasthinapuram, LB Nagar</p>
    <div class="badge">PAYMENT RECEIPT</div>
  </div>
  <div class="body">
    <div class="success-badge">
      ✅ Payment Successful — Appointment Confirmed!
    </div>
    <div class="row"><span class="label">Receipt ID</span><span class="value">${receiptId}</span></div>
    <div class="row"><span class="label">Transaction ID</span><span class="value">${transactionId}</span></div>
    <div class="row"><span class="label">Appointment ID</span><span class="value">${appointmentId}</span></div>
    <div class="row"><span class="label">Client Name</span><span class="value">${name}</span></div>
    <div class="row"><span class="label">Mobile</span><span class="value">${phone}</span></div>
    <div class="row"><span class="label">Service</span><span class="value">${service}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${fmtDate}</span></div>
    <div class="row"><span class="label">Time</span><span class="value">${time}</span></div>
    <div class="row"><span class="label">Mode</span><span class="value">${modeLabel}</span></div>
    <div class="row"><span class="label">Payment Method</span><span class="value">${paymentMethod}</span></div>
    <div class="total-row">
      <div class="row" style="border:none;padding:0">
        <span class="label" style="font-size:16px;font-weight:bold">Amount Paid</span>
        <span class="value" style="font-size:18px;color:#C9A84C">₹${amount}</span>
      </div>
    </div>
  </div>
  <div class="footer">
    Thank you for choosing Balu Law Chamber<br>
    This is an auto-generated receipt. Please retain for your records.
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Balu Law Chamber" <${process.env.EMAIL_USER}>`,
    to,
    bcc: bcc || undefined,
    subject: `Payment Receipt — ${receiptId} | Balu Law Chamber`,
    html,
  });

  console.log('[Email SENT] Receipt to:', to);
};
