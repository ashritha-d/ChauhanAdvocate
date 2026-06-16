const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://ashritha-d.github.io/ChauhanAdvocate';
const OUT_DIR = path.join(__dirname, 'screenshots');
const PDF_OUT = path.join(__dirname, 'AdvocateChauhan_UserGuide.pdf');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

async function shot(page, url, file, opts = {}) {
  console.log(`  Screenshotting: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() =>
    page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  );
  await new Promise(r => setTimeout(r, 2500));
  if (opts.scrollTo) await page.evaluate(y => window.scrollTo(0, y), opts.scrollTo);
  await new Promise(r => setTimeout(r, 800));
  const clip = opts.clip || null;
  const p = path.join(OUT_DIR, file);
  await page.screenshot({ path: p, fullPage: !clip, ...(clip ? { clip } : {}) });
  return p;
}

function img(filePath, caption = '', width = '100%') {
  const rel = path.relative(__dirname, filePath).replace(/\\/g, '/');
  const data = fs.readFileSync(filePath).toString('base64');
  return `
    <div class="screenshot-wrap">
      <img src="data:image/png;base64,${data}" style="width:${width};border-radius:8px;border:1px solid #ddd;box-shadow:0 2px 12px rgba(0,0,0,.12);" />
      ${caption ? `<p class="caption">${caption}</p>` : ''}
    </div>`;
}

function section(num, title, color = '#1a1a2e') {
  return `<div class="section-header" style="background:${color}">
    <span class="sec-num">${num}</span>
    <h2>${title}</h2>
  </div>`;
}

function tip(text) {
  return `<div class="tip"><span class="tip-icon">💡</span> <strong>Tip:</strong> ${text}</div>`;
}

function note(text) {
  return `<div class="note"><span>ℹ️</span> ${text}</div>`;
}

function steps(items) {
  return `<ol class="steps">${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
}

function faq(q, a) {
  return `<div class="faq-item"><div class="faq-q">❓ ${q}</div><div class="faq-a">${a}</div></div>`;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; color: #222; background: #fff; font-size: 13px; line-height: 1.65; }
  h1,h2,h3,h4 { font-family: 'Playfair Display', serif; }

  /* Cover */
  .cover { page-break-after: always; min-height: 100vh; background: linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:60px 40px; }
  .cover .logo-circle { width:120px;height:120px;background:linear-gradient(135deg,#c9a84c,#a8893a);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 30px;font-size:52px; }
  .cover h1 { color:#c9a84c; font-size:36px; margin-bottom:12px; line-height:1.2; }
  .cover h2 { color:#fff; font-size:20px; font-weight:300; margin-bottom:30px; }
  .cover .divider { width:80px;height:3px;background:#c9a84c;margin:20px auto; }
  .cover p { color:rgba(255,255,255,.75); font-size:14px; max-width:480px; }
  .cover .badge { display:inline-block;background:rgba(201,168,76,.15);border:1px solid #c9a84c;color:#c9a84c;padding:6px 20px;border-radius:20px;font-size:13px;margin-top:40px; }

  /* TOC */
  .toc { padding: 50px 60px; }
  .toc h2 { font-size:28px;color:#1a1a2e;border-bottom:3px solid #c9a84c;padding-bottom:12px;margin-bottom:30px; }
  .toc ol { list-style:none;padding:0; }
  .toc ol li { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px dashed #e0e0e0;font-size:14px; }
  .toc ol li span.toc-title { color:#1a1a2e;font-weight:500; }
  .toc ol li span.toc-pg { color:#c9a84c;font-weight:600; }
  .toc ol li .toc-num { background:#1a1a2e;color:#c9a84c;width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-right:14px;flex-shrink:0; }

  /* Pages */
  .page { padding: 40px 55px; page-break-before: always; }
  .page:first-of-type { page-break-before: avoid; }

  /* Section header */
  .section-header { display:flex;align-items:center;gap:16px;padding:20px 24px;border-radius:10px;margin-bottom:24px; }
  .section-header h2 { color:#fff;font-size:22px;margin:0; }
  .sec-num { background:#c9a84c;color:#1a1a2e;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0; }

  /* Content */
  p { margin-bottom:12px;color:#444; }
  h3 { color:#1a1a2e;font-size:16px;margin:20px 0 10px;border-left:4px solid #c9a84c;padding-left:12px; }
  h4 { color:#c9a84c;font-size:14px;margin:16px 0 8px;text-transform:uppercase;letter-spacing:.5px; }

  /* Steps */
  .steps { padding-left:0;list-style:none;counter-reset:step;margin:16px 0; }
  .steps li { counter-increment:step;display:flex;align-items:flex-start;gap:14px;margin-bottom:12px;padding:12px 16px;background:#f8f9fa;border-radius:8px;border-left:3px solid #c9a84c; }
  .steps li::before { content:counter(step);background:#1a1a2e;color:#c9a84c;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0; }

  /* Screenshot */
  .screenshot-wrap { margin:20px 0;text-align:center; }
  .caption { font-size:12px;color:#888;margin-top:8px;font-style:italic; }

  /* Tip / Note */
  .tip { background:#fffbea;border-left:4px solid #c9a84c;padding:12px 16px;border-radius:6px;margin:16px 0;font-size:13px;color:#555; }
  .tip-icon { font-size:16px; }
  .note { background:#e8f4fd;border-left:4px solid #1a6fc4;padding:12px 16px;border-radius:6px;margin:16px 0;font-size:13px;color:#1a3a5c; }

  /* Feature grid */
  .feature-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0; }
  .feature-card { background:#f8f9fa;border-radius:10px;padding:16px;border-top:3px solid #c9a84c; }
  .feature-card .icon { font-size:24px;margin-bottom:8px; }
  .feature-card h4 { color:#1a1a2e;margin:0 0 6px;font-size:13px;text-transform:none; }
  .feature-card p { font-size:12px;color:#666;margin:0; }

  /* FAQ */
  .faq-item { margin-bottom:20px; }
  .faq-q { font-weight:600;color:#1a1a2e;margin-bottom:6px;font-size:14px; }
  .faq-a { color:#555;padding-left:20px;border-left:2px solid #c9a84c; }

  /* Contact */
  .contact-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0; }
  .contact-card { background:#1a1a2e;color:#fff;border-radius:10px;padding:20px;text-align:center; }
  .contact-card .icon { font-size:28px;margin-bottom:10px; }
  .contact-card h4 { color:#c9a84c;margin-bottom:6px;font-size:13px;text-transform:none; }
  .contact-card p { font-size:13px;color:rgba(255,255,255,.8);margin:0; }

  /* Thank you */
  .thankyou { page-break-before:always;min-height:60vh;background:linear-gradient(135deg,#1a1a2e,#0f3460);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;border-radius:0; }
  .thankyou h1 { color:#c9a84c;font-size:32px;margin-bottom:16px; }
  .thankyou p { color:rgba(255,255,255,.85);font-size:15px;max-width:500px;line-height:1.8; }
  .thankyou .seal { font-size:60px;margin-bottom:20px; }

  /* Footer on each page */
  .page-footer { margin-top:30px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;color:#aaa;font-size:11px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-before: always; }
    .cover { page-break-after: always; }
  }
`;

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const shots = {};

  try {
    console.log('\nTaking screenshots...');

    shots.home = await shot(page, `${BASE_URL}/`, 'home.png');
    shots.homeHero = await shot(page, `${BASE_URL}/`, 'home_hero.png', { clip: { x: 0, y: 0, width: 1280, height: 600 } });
    shots.login = await shot(page, `${BASE_URL}/login`, 'login.png');
    shots.register = await shot(page, `${BASE_URL}/register`, 'register.png');
    shots.courses = await shot(page, `${BASE_URL}/courses`, 'courses.png');
    shots.gallery = await shot(page, `${BASE_URL}/gallery`, 'gallery.png');
    shots.news = await shot(page, `${BASE_URL}/news`, 'news.png');

    // Scroll to appointments section on home
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => {
      const el = document.querySelector('#appointment') || document.querySelector('[id*="appoint"]') || document.querySelector('section:nth-of-type(4)');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 1000));
    shots.appt = await page.screenshot({ path: path.join(OUT_DIR, 'appointment.png') });
    shots.appt = path.join(OUT_DIR, 'appointment.png');

    // Books section
    await page.evaluate(() => {
      const el = document.querySelector('#books') || document.querySelector('[id*="book"]') || document.querySelector('section:nth-of-type(6)');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 1000));
    shots.books = await page.screenshot({ path: path.join(OUT_DIR, 'books.png') });
    shots.books = path.join(OUT_DIR, 'books.png');

    // Contact section
    await page.evaluate(() => {
      const el = document.querySelector('#contact') || document.querySelector('[id*="contact"]');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 1000));
    shots.contact = await page.screenshot({ path: path.join(OUT_DIR, 'contact.png') });
    shots.contact = path.join(OUT_DIR, 'contact.png');

  } catch (e) {
    console.error('Screenshot error:', e.message);
  }

  console.log('\nGenerating HTML...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Advocate Chauhan - User Guide</title>
<style>${CSS}</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="logo-circle">⚖️</div>
  <h1>Website User Manual &amp;<br/>Getting Started Guide</h1>
  <h2>Advocate Chauhan — Expert Legal Services</h2>
  <div class="divider"></div>
  <p>A complete guide to help you book appointments, order books, enroll in courses, and manage your account on our platform.</p>
  <div class="badge">Version 1.0 &nbsp;•&nbsp; June 2026</div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc">
  <h2>Table of Contents</h2>
  <ol>
    <li><span><span class="toc-num">1</span><span class="toc-title">Welcome &amp; Introduction</span></span><span class="toc-pg">3</span></li>
    <li><span><span class="toc-num">2</span><span class="toc-title">User Registration</span></span><span class="toc-pg">4</span></li>
    <li><span><span class="toc-num">3</span><span class="toc-title">User Login</span></span><span class="toc-pg">5</span></li>
    <li><span><span class="toc-num">4</span><span class="toc-title">Dashboard Overview</span></span><span class="toc-pg">6</span></li>
    <li><span><span class="toc-num">5</span><span class="toc-title">Book an Appointment</span></span><span class="toc-pg">7</span></li>
    <li><span><span class="toc-num">6</span><span class="toc-title">Order Books</span></span><span class="toc-pg">9</span></li>
    <li><span><span class="toc-num">7</span><span class="toc-title">Enroll in Courses</span></span><span class="toc-pg">11</span></li>
    <li><span><span class="toc-num">8</span><span class="toc-title">Payments</span></span><span class="toc-pg">12</span></li>
    <li><span><span class="toc-num">9</span><span class="toc-title">Profile Management</span></span><span class="toc-pg">13</span></li>
    <li><span><span class="toc-num">10</span><span class="toc-title">Notifications &amp; Status Tracking</span></span><span class="toc-pg">14</span></li>
    <li><span><span class="toc-num">11</span><span class="toc-title">Frequently Asked Questions</span></span><span class="toc-pg">15</span></li>
    <li><span><span class="toc-num">12</span><span class="toc-title">Contact Support</span></span><span class="toc-pg">16</span></li>
  </ol>
</div>

<!-- SECTION 1: WELCOME -->
<div class="page">
  ${section(1, 'Welcome &amp; Introduction')}
  <p>Welcome to <strong>Advocate Chauhan's official website</strong> — your trusted online platform for expert legal services, legal education, and professional support. This guide will walk you through every feature of the platform so you can get started quickly and easily.</p>
  ${shots.homeHero ? img(shots.homeHero, 'Homepage — Advocate Chauhan') : ''}
  <h3>What You Can Do on This Platform</h3>
  <div class="feature-grid">
    <div class="feature-card">
      <div class="icon">📅</div>
      <h4>Book Appointments</h4>
      <p>Schedule in-person or online legal consultations with Advocate Chauhan at your preferred date and time.</p>
    </div>
    <div class="feature-card">
      <div class="icon">📚</div>
      <h4>Order Legal Books</h4>
      <p>Browse and purchase legal books and study materials authored or recommended by the advocate.</p>
    </div>
    <div class="feature-card">
      <div class="icon">🎓</div>
      <h4>Enroll in Courses</h4>
      <p>Access online legal courses, video lectures, and downloadable study resources.</p>
    </div>
    <div class="feature-card">
      <div class="icon">🔔</div>
      <h4>Track Everything</h4>
      <p>Monitor appointment status, order delivery, and course progress from one unified dashboard.</p>
    </div>
  </div>
  ${tip('Bookmark the website so you can easily return: <strong>https://ashritha-d.github.io/ChauhanAdvocate/</strong>')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 3</span></div>
</div>

<!-- SECTION 2: REGISTRATION -->
<div class="page">
  ${section(2, 'User Registration')}
  <p>Creating an account is free and takes less than 2 minutes. You need an account to book appointments, order books, and enroll in courses.</p>
  ${shots.register ? img(shots.register, 'Registration Page') : ''}
  <h3>Step-by-Step Registration</h3>
  ${steps([
    'Open the website and click the <strong>"Register"</strong> or <strong>"Sign Up"</strong> button in the top navigation bar.',
    'Enter your <strong>Full Name</strong> as you want it to appear on your profile and receipts.',
    'Enter your <strong>Email Address</strong> — this will be used for login and notifications.',
    'Enter your <strong>Mobile Number</strong> — used for WhatsApp appointment notifications.',
    'Create a strong <strong>Password</strong> (minimum 6 characters — mix letters and numbers).',
    'Click <strong>"Create Account"</strong> to complete registration.',
    'You will be automatically logged in and redirected to the dashboard.',
  ])}
  ${tip('Use a mobile number that has WhatsApp — you will receive appointment confirmations and updates via WhatsApp.')}
  ${note('Your information is kept private and secure. We do not share personal data with third parties.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 4</span></div>
</div>

<!-- SECTION 3: LOGIN -->
<div class="page">
  ${section(3, 'User Login')}
  <p>Once registered, you can log in anytime to access your dashboard, appointments, orders, and courses.</p>
  ${shots.login ? img(shots.login, 'Login Page') : ''}
  <h3>Step-by-Step Login</h3>
  ${steps([
    'Click <strong>"Login"</strong> in the top navigation bar.',
    'Enter your registered <strong>Email Address</strong> or <strong>Mobile Number</strong>.',
    'Enter your <strong>Password</strong>.',
    'Click <strong>"Login"</strong> — you will be redirected to your personal dashboard.',
  ])}
  <h3>Forgot Your Password?</h3>
  ${steps([
    'Click <strong>"Forgot Password?"</strong> on the login page.',
    'Enter your registered email address.',
    'Click <strong>"Send Reset Link"</strong>.',
    'Check your email inbox and follow the link to create a new password.',
  ])}
  ${tip('Stay logged in by checking "Remember me" so you do not have to log in every time.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 5</span></div>
</div>

<!-- SECTION 4: DASHBOARD -->
<div class="page">
  ${section(4, 'Dashboard Overview')}
  <p>After logging in, you land on your personal dashboard — the central hub for all your activities on the platform.</p>
  <h3>Dashboard Sections</h3>
  <div class="feature-grid">
    <div class="feature-card">
      <div class="icon">👤</div>
      <h4>Profile</h4>
      <p>View and update your personal information, photo, and password.</p>
    </div>
    <div class="feature-card">
      <div class="icon">📅</div>
      <h4>My Appointments</h4>
      <p>See all your booked appointments with status updates (Pending / Confirmed / Completed).</p>
    </div>
    <div class="feature-card">
      <div class="icon">📦</div>
      <h4>My Orders</h4>
      <p>Track all book orders and their delivery status.</p>
    </div>
    <div class="feature-card">
      <div class="icon">🎓</div>
      <h4>My Courses</h4>
      <p>Access enrolled courses and continue learning from where you left off.</p>
    </div>
    <div class="feature-card">
      <div class="icon">🔔</div>
      <h4>Notifications</h4>
      <p>View all system alerts — appointment updates, order status, payment confirmations.</p>
    </div>
    <div class="feature-card">
      <div class="icon">🚪</div>
      <h4>Logout</h4>
      <p>Securely sign out from your account when done.</p>
    </div>
  </div>
  ${tip('Check the Notifications bell icon regularly to stay updated on your appointment and order status.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 6</span></div>
</div>

<!-- SECTION 5: BOOK APPOINTMENT -->
<div class="page">
  ${section(5, 'Book an Appointment')}
  <p>You can book an in-person (<strong>Offline</strong>) or virtual (<strong>Online</strong>) consultation with Advocate Chauhan directly from the website.</p>
  ${shots.appt ? img(shots.appt, 'Appointment Booking Section') : ''}
  <h3>Step-by-Step Appointment Booking</h3>
  ${steps([
    'On the homepage, scroll to the <strong>"Book Appointment"</strong> section, or click <strong>"Appointments"</strong> in the navigation.',
    'Select your preferred <strong>Service</strong> (e.g., Civil Litigation, Property Law, Family Law).',
    'Choose <strong>Offline</strong> (in-person visit) or <strong>Online</strong> (video/phone call).',
    'Pick your preferred <strong>Date</strong> from the calendar — only available dates are shown.',
    'Select a <strong>Time Slot</strong> — only open slots are shown (booked slots are greyed out).',
    'Fill in your <strong>Name, Mobile Number, and Email</strong>.',
    'Click <strong>"Book Appointment"</strong> to proceed.',
    'Complete the <strong>payment</strong> if required (Razorpay / UPI / Card).',
    'You will receive a <strong>WhatsApp confirmation</strong> with your Appointment ID.',
  ])}
  ${tip('You will receive real-time WhatsApp notifications for every status change — Booked, Confirmed, Rescheduled, or Completed.')}
  <h3>Appointment Status Meanings</h3>
  <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;">
    <tr style="background:#1a1a2e;color:#c9a84c;">
      <th style="padding:10px;text-align:left;border-radius:6px 0 0 0;">Status</th>
      <th style="padding:10px;text-align:left;">Meaning</th>
    </tr>
    <tr style="background:#f8f9fa;"><td style="padding:10px;border-bottom:1px solid #eee;">⏳ Pending</td><td style="padding:10px;border-bottom:1px solid #eee;">Booking received, waiting for confirmation</td></tr>
    <tr><td style="padding:10px;border-bottom:1px solid #eee;">✅ Confirmed</td><td style="padding:10px;border-bottom:1px solid #eee;">Advocate has confirmed your appointment</td></tr>
    <tr style="background:#f8f9fa;"><td style="padding:10px;border-bottom:1px solid #eee;">🔄 Rescheduled</td><td style="padding:10px;border-bottom:1px solid #eee;">Appointment date/time has been changed</td></tr>
    <tr><td style="padding:10px;border-bottom:1px solid #eee;">✔️ Completed</td><td style="padding:10px;border-bottom:1px solid #eee;">Consultation is done</td></tr>
    <tr style="background:#f8f9fa;"><td style="padding:10px;">❌ Cancelled</td><td style="padding:10px;">Appointment was cancelled</td></tr>
  </table>
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 7–8</span></div>
</div>

<!-- SECTION 6: ORDER BOOKS -->
<div class="page">
  ${section(6, 'Order Books')}
  <p>Browse and purchase legal books, study materials, and publications from the Books section on the homepage.</p>
  ${shots.books ? img(shots.books, 'Books Section') : ''}
  <h3>Step-by-Step Book Ordering</h3>
  ${steps([
    'On the homepage, scroll down to the <strong>"Books"</strong> section.',
    'Browse the available books — each card shows the title, description, and price.',
    'Click on a book to view its full details.',
    'Click <strong>"Order Now"</strong> or <strong>"Add to Cart"</strong>.',
    'Enter your <strong>Name, Phone Number, and Delivery Address</strong>.',
    'Select your <strong>Payment Method</strong> (Razorpay / UPI / Manual payment).',
    'Complete payment and receive an <strong>Order Confirmation</strong> with a unique Order ID.',
    'Track your order status in the <strong>Dashboard → My Orders</strong> section.',
  ])}
  <h3>Order Status Meanings</h3>
  <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;">
    <tr style="background:#1a1a2e;color:#c9a84c;">
      <th style="padding:10px;text-align:left;">Status</th>
      <th style="padding:10px;text-align:left;">Meaning</th>
    </tr>
    <tr style="background:#f8f9fa;"><td style="padding:10px;border-bottom:1px solid #eee;">📋 Pending</td><td style="padding:10px;border-bottom:1px solid #eee;">Order placed, awaiting confirmation</td></tr>
    <tr><td style="padding:10px;border-bottom:1px solid #eee;">✅ Confirmed</td><td style="padding:10px;border-bottom:1px solid #eee;">Order confirmed by the team</td></tr>
    <tr style="background:#f8f9fa;"><td style="padding:10px;border-bottom:1px solid #eee;">⚙️ Processing</td><td style="padding:10px;border-bottom:1px solid #eee;">Book is being packed and prepared for shipping</td></tr>
    <tr><td style="padding:10px;border-bottom:1px solid #eee;">🚚 Shipped</td><td style="padding:10px;border-bottom:1px solid #eee;">Book is on its way to you</td></tr>
    <tr style="background:#f8f9fa;"><td style="padding:10px;border-bottom:1px solid #eee;">📦 Delivered</td><td style="padding:10px;border-bottom:1px solid #eee;">Book delivered successfully</td></tr>
    <tr><td style="padding:10px;">❌ Cancelled</td><td style="padding:10px;">Order was cancelled</td></tr>
  </table>
  ${tip('You will receive WhatsApp updates at every stage — when your order is confirmed, shipped, and delivered.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 9–10</span></div>
</div>

<!-- SECTION 7: COURSES -->
<div class="page">
  ${section(7, 'Enroll in Courses')}
  <p>Access professional legal training courses designed by Advocate Chauhan. Learn at your own pace with video lectures and downloadable resources.</p>
  ${shots.courses ? img(shots.courses, 'Courses Page') : ''}
  <h3>Step-by-Step Course Enrollment</h3>
  ${steps([
    'Click <strong>"Courses"</strong> in the top navigation menu.',
    'Browse the available courses — each shows title, duration, and fee.',
    'Click on a course to view full details, syllabus, and instructor info.',
    'Click <strong>"Enroll Now"</strong>.',
    'Complete the payment (if the course is paid).',
    'Once enrolled, the course appears in <strong>Dashboard → My Courses</strong>.',
    'Click <strong>"Start Learning"</strong> to watch video lectures and download resources.',
  ])}
  ${tip('Enrolled courses are available to you lifetime — you can revisit them anytime from your dashboard.')}
  ${note('Some courses may include free preview videos so you can assess the content before purchasing.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 11</span></div>
</div>

<!-- SECTION 8: PAYMENTS -->
<div class="page">
  ${section(8, 'Payments')}
  <p>All payments on the platform are secure and processed through trusted payment gateways. Your financial data is never stored on our servers.</p>
  <h3>Available Payment Methods</h3>
  <div class="feature-grid">
    <div class="feature-card">
      <div class="icon">💳</div>
      <h4>Credit / Debit Card</h4>
      <p>Visa, Mastercard, RuPay — all major cards accepted via Razorpay.</p>
    </div>
    <div class="feature-card">
      <div class="icon">📱</div>
      <h4>UPI</h4>
      <p>Pay using Google Pay, PhonePe, Paytm, or any UPI app instantly.</p>
    </div>
    <div class="feature-card">
      <div class="icon">🏦</div>
      <h4>Net Banking</h4>
      <p>Supported for all major Indian banks through the Razorpay gateway.</p>
    </div>
    <div class="feature-card">
      <div class="icon">📷</div>
      <h4>QR Code / Manual UPI</h4>
      <p>Scan QR code and pay, then upload payment screenshot for manual verification.</p>
    </div>
  </div>
  <h3>Payment Process</h3>
  ${steps([
    'After selecting service/book/course, click <strong>"Proceed to Pay"</strong>.',
    'A secure Razorpay payment window opens.',
    'Choose your preferred payment method and complete payment.',
    'You will be redirected back with a <strong>Payment Confirmation</strong> screen.',
    'A receipt with Transaction ID and Receipt ID is generated automatically.',
    'Receipt details are sent to your registered email and WhatsApp.',
  ])}
  <h3>Download Your Receipt</h3>
  <p>After payment, a receipt page is shown with all details. Click <strong>"Download Receipt"</strong> or take a screenshot for your records. Your receipt includes:</p>
  <ul style="padding-left:20px;color:#444;line-height:2;">
    <li>Appointment/Order ID</li>
    <li>Transaction ID &amp; Receipt ID</li>
    <li>Amount Paid &amp; Payment Method</li>
    <li>Date, Time, and Service details</li>
    <li>Status confirmation</li>
  </ul>
  ${tip('If a payment fails but amount is deducted, contact us immediately with your Transaction ID — refunds are processed within 5–7 business days.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 12</span></div>
</div>

<!-- SECTION 9: PROFILE -->
<div class="page">
  ${section(9, 'Profile Management')}
  <p>Your profile stores all your personal details and activity history. Keeping it updated ensures you receive accurate notifications and receipts.</p>
  <h3>Update Personal Information</h3>
  ${steps([
    'Log in and go to <strong>Dashboard → Profile</strong> tab.',
    'Click <strong>"Edit Profile"</strong>.',
    'Update your Name, Email, Mobile Number, or Address.',
    'Click <strong>"Save Changes"</strong>.',
  ])}
  <h3>Change Password</h3>
  ${steps([
    'Go to <strong>Profile → Security</strong> section.',
    'Enter your <strong>Current Password</strong>.',
    'Enter and confirm your <strong>New Password</strong>.',
    'Click <strong>"Update Password"</strong>.',
  ])}
  <h3>Upload Profile Photo</h3>
  ${steps([
    'Go to your <strong>Profile</strong> page.',
    'Click on the profile photo / avatar.',
    'Select a photo from your device (JPG or PNG, max 5MB).',
    'Click <strong>"Upload"</strong> — your photo updates immediately.',
  ])}
  <h3>View Purchase History</h3>
  <p>All your past appointments, book orders, and course enrollments are stored in your dashboard under their respective tabs — <strong>My Appointments</strong>, <strong>My Orders</strong>, and <strong>My Courses</strong>.</p>
  ${tip('Keep your mobile number updated so you receive WhatsApp notifications for all your bookings and orders.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 13</span></div>
</div>

<!-- SECTION 10: NOTIFICATIONS -->
<div class="page">
  ${section(10, 'Notifications &amp; Status Tracking')}
  <p>The platform keeps you informed at every step through in-app notifications and WhatsApp messages.</p>
  <h3>Types of Notifications You Receive</h3>
  <div class="feature-grid">
    <div class="feature-card">
      <div class="icon">📅</div>
      <h4>Appointment Updates</h4>
      <p>Booked → Confirmed → Rescheduled → Completed notifications with Appointment ID and details.</p>
    </div>
    <div class="feature-card">
      <div class="icon">📦</div>
      <h4>Order Tracking</h4>
      <p>Order Placed → Confirmed → Processing → Shipped → Delivered notifications with tracking info.</p>
    </div>
    <div class="feature-card">
      <div class="icon">🎓</div>
      <h4>Course Notifications</h4>
      <p>Enrollment confirmation and new content availability alerts for your courses.</p>
    </div>
    <div class="feature-card">
      <div class="icon">💰</div>
      <h4>Payment Confirmations</h4>
      <p>Instant payment receipt with Transaction ID, amount, and service details sent via WhatsApp and email.</p>
    </div>
  </div>
  <h3>Where to See Notifications</h3>
  <ul style="padding-left:20px;color:#444;line-height:2.2;">
    <li><strong>🔔 Bell icon</strong> (top right) — in-app notifications with unread count badge</li>
    <li><strong>📱 WhatsApp</strong> — real-time messages from the official business number</li>
    <li><strong>📧 Email</strong> — receipts and confirmation emails to your registered address</li>
    <li><strong>📋 Dashboard tabs</strong> — full history in Appointments, Orders, and Courses sections</li>
  </ul>
  ${note('WhatsApp notifications are sent from our official number. Save it as "Advocate Chauhan" in your contacts to avoid missing messages.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 14</span></div>
</div>

<!-- SECTION 11: FAQ -->
<div class="page">
  ${section(11, 'Frequently Asked Questions')}
  ${faq('How do I reset my password?', 'Click "Forgot Password?" on the Login page, enter your registered email address, and follow the link sent to your inbox to create a new password.')}
  ${faq('How can I cancel an appointment?', 'Contact us via WhatsApp or email with your Appointment ID. Cancellations requested more than 24 hours before the appointment are processed without penalty.')}
  ${faq('How do I access purchased courses?', 'Log in and go to Dashboard → My Courses. All enrolled courses appear here. Click "Start Learning" on any course to begin.')}
  ${faq('How can I track my book order?', 'Go to Dashboard → My Orders. Each order shows its current status (Pending / Confirmed / Processing / Shipped / Delivered). You also receive WhatsApp updates for every status change.')}
  ${faq('What if my payment failed but money was deducted?', 'This can sometimes happen due to network issues. Contact our support team immediately with your Transaction ID and amount. Refunds are processed within 5–7 business days.')}
  ${faq('Can I reschedule my appointment?', 'Yes. Contact us via WhatsApp or email with your Appointment ID and preferred new date and time. Rescheduling is subject to availability.')}
  ${faq('How do I contact support?', 'You can reach us via WhatsApp, phone, or email. Contact details are on the website\'s Contact section and on the last page of this guide.')}
  ${faq('Is my personal information safe?', 'Yes. All data is encrypted and stored securely. We do not share your personal information with any third parties. Payments are processed by Razorpay — a PCI-DSS compliant gateway.')}
  ${faq('Can I book an appointment without creating an account?', 'You can fill the appointment form without logging in, but creating an account lets you track status, receive notifications, and view your history.')}
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 15</span></div>
</div>

<!-- SECTION 12: CONTACT -->
<div class="page">
  ${section(12, 'Contact Support')}
  <p>Our team is available to help you with any questions, issues, or assistance you need. Reach us through any of the channels below.</p>
  ${shots.contact ? img(shots.contact, 'Contact Section on Website') : ''}
  <div class="contact-grid">
    <div class="contact-card">
      <div class="icon">📧</div>
      <h4>Email Support</h4>
      <p>Send us your query and we'll respond within 24 hours</p>
    </div>
    <div class="contact-card">
      <div class="icon">📱</div>
      <h4>WhatsApp Support</h4>
      <p>Chat with us directly on WhatsApp for quick help</p>
    </div>
    <div class="contact-card">
      <div class="icon">📞</div>
      <h4>Phone</h4>
      <p>Call us during business hours (Mon–Sat, 9 AM – 6 PM)</p>
    </div>
    <div class="contact-card">
      <div class="icon">🌐</div>
      <h4>Website</h4>
      <p>Fill the contact form on the website's Contact section</p>
    </div>
  </div>
  ${note('For appointment cancellations or reschedules, always include your <strong>Appointment ID</strong> in your message for faster resolution.')}
  <h3>Business Hours</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;">
    <tr style="background:#1a1a2e;color:#c9a84c;"><th style="padding:10px;text-align:left;">Day</th><th style="padding:10px;text-align:left;">Hours</th></tr>
    <tr style="background:#f8f9fa;"><td style="padding:10px;border-bottom:1px solid #eee;">Monday – Friday</td><td style="padding:10px;border-bottom:1px solid #eee;">9:00 AM – 6:00 PM</td></tr>
    <tr><td style="padding:10px;border-bottom:1px solid #eee;">Saturday</td><td style="padding:10px;border-bottom:1px solid #eee;">9:00 AM – 2:00 PM</td></tr>
    <tr style="background:#f8f9fa;"><td style="padding:10px;">Sunday</td><td style="padding:10px;">Closed</td></tr>
  </table>
  <div class="page-footer"><span>Advocate Chauhan — User Guide</span><span>Page 16</span></div>
</div>

<!-- THANK YOU -->
<div class="thankyou">
  <div class="seal">⚖️</div>
  <h1>Thank You for Using Our Platform</h1>
  <div style="width:60px;height:3px;background:#c9a84c;margin:16px auto;"></div>
  <p>"We are committed to providing seamless legal services, educational resources, and professional support. Your trust is our greatest responsibility."</p>
  <p style="margin-top:24px;color:#c9a84c;font-family:'Playfair Display',serif;font-size:17px;">— Advocate Chauhan</p>
  <p style="margin-top:32px;font-size:12px;color:rgba(255,255,255,.5);">Advocate Chauhan — Expert Legal Services &nbsp;•&nbsp; v1.0 — June 2026</p>
</div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, 'guide.html');
  fs.writeFileSync(htmlPath, html);
  console.log('HTML written to:', htmlPath);

  console.log('\nConverting to PDF...');
  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));

  await pdfPage.pdf({
    path: PDF_OUT,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  });

  await browser.close();

  console.log('\n✅ PDF generated successfully!');
  console.log('📄 Output:', PDF_OUT);
  console.log('📊 File size:', (fs.statSync(PDF_OUT).size / 1024 / 1024).toFixed(2), 'MB');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
