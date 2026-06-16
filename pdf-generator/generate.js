const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME  = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE    = 'https://ashritha-d.github.io/ChauhanAdvocate';
const API     = 'https://chauhanadvocate.onrender.com/api';
const SHOTS   = path.join(__dirname, 'screenshots');
const PDF_OUT = path.join(__dirname, 'AdvocateChauhan_UserGuide.pdf');

// Test account used only for capturing logged-in screenshots
const TEST_USER = { name: 'PDF Guide', email: 'pdfguide2026@gmail.com', mobile: '9876543210', password: 'PdfGuide@2026' };

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Navigation ─────────────────────────────────────────────────────────────────
async function goto(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    .catch(() => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }));
  await sleep(2500);
}

// ── Screenshot ─────────────────────────────────────────────────────────────────
async function shot(page, name, opts = {}) {
  const p = path.join(SHOTS, name);
  await page.screenshot({ path: p, fullPage: !opts.clip && !opts.viewport, ...(opts.clip ? { clip: opts.clip } : {}), ...(opts.viewport ? { fullPage: false } : {}) });
  console.log('  ✓', name);
  return p;
}

// ── Scroll to section by ID ────────────────────────────────────────────────────
async function scrollTo(page, id) {
  await page.evaluate(id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, id);
  await sleep(1000);
}

// ── Highlight button/element before screenshot ─────────────────────────────────
async function highlight(page, selector, color = '#e74c3c') {
  await page.evaluate((sel, c) => {
    document.querySelectorAll('.__hl').forEach(e => e.remove());
    const el = document.querySelector(sel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ov = document.createElement('div');
    ov.className = '__hl';
    ov.style.cssText = `position:fixed;top:${r.top - 3}px;left:${r.left - 3}px;width:${r.width + 6}px;height:${r.height + 6}px;border:3px solid ${c};border-radius:6px;box-shadow:0 0 0 5px ${c}33;pointer-events:none;z-index:999999;`;
    document.body.appendChild(ov);
    // Arrow label
    const lbl = document.createElement('div');
    lbl.className = '__hl';
    lbl.style.cssText = `position:fixed;top:${r.top - 30}px;left:${r.left}px;background:${c};color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;pointer-events:none;z-index:999999;font-family:sans-serif;`;
    lbl.textContent = '▼ Click Here';
    document.body.appendChild(lbl);
  }, selector, color);
}

async function clearHL(page) {
  await page.evaluate(() => document.querySelectorAll('.__hl').forEach(e => e.remove()));
}

// ── Open modal by clicking button with text ────────────────────────────────────
async function clickText(page, text) {
  await page.evaluate(txt => {
    const el = Array.from(document.querySelectorAll('button,a,.btn')).find(e => e.textContent.trim().toLowerCase().includes(txt.toLowerCase()));
    if (el) el.click();
  }, text);
  await sleep(1800);
}

// ── Auth: Register then Login using React-compatible input dispatch ────────────
async function setReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return;
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function authUser(page) {
  console.log('\n── Authenticating ────────────────────────────────────────');

  // Try register first
  await goto(page, `${BASE}/register`);
  await page.waitForSelector('.auth-input', { timeout: 8000 }).catch(() => {});
  const regInputs = await page.$$('.auth-input');
  if (regInputs.length >= 4) {
    await setReactInput(page, '.auth-input:nth-of-type(1)', TEST_USER.name);
    // set by index via evaluate
    await page.evaluate((u) => {
      const ins = document.querySelectorAll('.auth-input');
      const set = (el, v) => {
        if (!el) return;
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el, v);
        el.dispatchEvent(new Event('input',{bubbles:true}));
      };
      set(ins[0], u.name);
      set(ins[1], u.email);
      set(ins[2], u.mobile);
      set(ins[3], u.password);
      if (ins[4]) set(ins[4], u.password);
    }, TEST_USER);
    await sleep(300);
    await page.click('button[type="submit"]');
    await sleep(4000);
    const token = await page.evaluate(() => localStorage.getItem('userToken'));
    if (token) { console.log('  ✓ Registered & logged in'); await goto(page, `${BASE}/`); return; }
  }

  // Login with email identifier
  await goto(page, `${BASE}/login`);
  await page.waitForSelector('.auth-input', { timeout: 8000 }).catch(() => {});
  await page.evaluate((u) => {
    const ins = document.querySelectorAll('.auth-input');
    const set = (el, v) => {
      if (!el) return;
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el, v);
      el.dispatchEvent(new Event('input',{bubbles:true}));
    };
    set(ins[0], u.email);   // use email as identifier
    set(ins[1], u.password);
  }, TEST_USER);
  await sleep(300);
  await page.click('button[type="submit"]');
  await sleep(4000);
  const token = await page.evaluate(() => localStorage.getItem('userToken'));
  if (token) {
    console.log('  ✓ Logged in successfully');
  } else {
    // Try with mobile as identifier
    await goto(page, `${BASE}/login`);
    await page.waitForSelector('.auth-input', { timeout: 5000 }).catch(() => {});
    await page.evaluate((u) => {
      const ins = document.querySelectorAll('.auth-input');
      const set = (el, v) => {
        if (!el) return;
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(el, v);
        el.dispatchEvent(new Event('input',{bubbles:true}));
      };
      set(ins[0], u.mobile);
      set(ins[1], u.password);
    }, TEST_USER);
    await sleep(300);
    await page.click('button[type="submit"]');
    await sleep(4000);
    const token2 = await page.evaluate(() => localStorage.getItem('userToken'));
    if (token2) { console.log('  ✓ Logged in (mobile)'); }
    else { console.log('  ! Auth failed — showing public view screenshots'); }
  }

  await goto(page, `${BASE}/`);
}

// ── Embed image as base64 ──────────────────────────────────────────────────────
function img(p, caption = '', width = '100%') {
  if (!p || !fs.existsSync(p)) return '';
  const b64 = fs.readFileSync(p).toString('base64');
  return `<div class="sw"><img src="data:image/png;base64,${b64}" style="width:${width};max-width:100%;border-radius:8px;border:1px solid #ddd;box-shadow:0 2px 10px rgba(0,0,0,.1);"/>${caption ? `<p class="cap">${caption}</p>` : ''}</div>`;
}

function img2(p1, c1, p2, c2) {
  return `<div class="sw2">${img(p1, c1, '100%')}${img(p2, c2, '100%')}</div>`;
}

// ── HTML helpers ───────────────────────────────────────────────────────────────
const PB  = () => `<div class="pb"></div>`;
const sec = (n, t) => `<div class="sh"><div class="sn">${n}</div><h2>${t}</h2></div>`;
const h3  = t => `<h3>${t}</h3>`;
const p   = t => `<p>${t}</p>`;
const tip = t => `<div class="tip">💡 <strong>Tip:</strong> ${t}</div>`;
const note= t => `<div class="note">ℹ️ ${t}</div>`;

function steps(items) {
  return `<ol class="steps">${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
}

function flow(...labels) {
  return `<div class="flow">${labels.map((l,i) => `<span class="fs">${l}</span>${i < labels.length - 1 ? '<span class="fa">→</span>' : ''}`).join('')}</div>`;
}

function faq(q, a) {
  return `<div class="faq"><div class="fq">❓ ${q}</div><div class="fa_">${a}</div></div>`;
}

function statusTable(rows) {
  return `<table class="st"><tr><th>Status</th><th>Meaning</th></tr>${rows.map((r,i) => `<tr${i%2?' style="background:#f8f9fa"':''}><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`;
}

function grid(...cards) {
  return `<div class="g2">${cards.map(c => `<div class="gc"><div class="gi">${c.icon}</div><h4>${c.title}</h4><p>${c.desc}</p></div>`).join('')}</div>`;
}

function contact(...cards) {
  return `<div class="cg">${cards.map(c => `<div class="cc"><div class="ci">${c.icon}</div><h4>${c.title}</h4><p>${c.text}</p></div>`).join('')}</div>`;
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;color:#222;background:#fff;font-size:13px;line-height:1.65;}
  h1,h2,h3{font-family:'Playfair Display',serif;}

  /* Page breaks */
  .pb{break-before:page;page-break-before:always;height:0;display:block;}

  /* Cover */
  .cover{min-height:100vh;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 40px;}
  .lc{width:110px;height:110px;background:linear-gradient(135deg,#c9a84c,#a8893a);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 28px;font-size:48px;}
  .cover h1{color:#c9a84c;font-size:36px;margin-bottom:10px;line-height:1.2;}
  .cover h2{color:#fff;font-size:19px;font-weight:300;margin-bottom:28px;}
  .cover .dv{width:70px;height:3px;background:#c9a84c;margin:18px auto;}
  .cover p{color:rgba(255,255,255,.75);font-size:13px;max-width:480px;}
  .cover .badge{display:inline-block;background:rgba(201,168,76,.15);border:1px solid #c9a84c;color:#c9a84c;padding:5px 18px;border-radius:20px;font-size:12px;margin-top:36px;}

  /* TOC */
  .toc{padding:48px 55px;}
  .toc h2{font-size:26px;color:#1a1a2e;border-bottom:3px solid #c9a84c;padding-bottom:12px;margin-bottom:26px;}
  .ti{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px dashed #e0e0e0;font-size:13px;}
  .tl{display:flex;align-items:center;gap:10px;}
  .tn{background:#1a1a2e;color:#c9a84c;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
  .tp{color:#c9a84c;font-weight:700;font-size:14px;}

  /* Pages */
  .page{padding:36px 52px;}

  /* Section header */
  .sh{display:flex;align-items:center;gap:14px;padding:18px 22px;border-radius:10px;margin-bottom:22px;background:#1a1a2e;}
  .sh h2{color:#fff;font-size:21px;margin:0;}
  .sn{background:#c9a84c;color:#1a1a2e;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;}

  /* Typography */
  p{margin-bottom:11px;color:#444;}
  h3{color:#1a1a2e;font-size:14px;margin:18px 0 9px;border-left:4px solid #c9a84c;padding-left:11px;font-family:'Playfair Display',serif;}
  h4{color:#1a1a2e;font-size:13px;margin:12px 0 6px;font-weight:600;}

  /* Steps */
  .steps{padding-left:0;list-style:none;counter-reset:step;margin:14px 0;}
  .steps li{counter-increment:step;display:flex;align-items:flex-start;gap:12px;margin-bottom:9px;padding:10px 14px;background:#f8f9fa;border-radius:8px;border-left:3px solid #c9a84c;}
  .steps li::before{content:counter(step);background:#1a1a2e;color:#c9a84c;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}

  /* Screenshot */
  .sw{margin:14px 0;text-align:center;}
  .sw2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0;}
  .cap{font-size:11px;color:#888;margin-top:6px;font-style:italic;}

  /* Tip / Note */
  .tip{background:#fffbea;border-left:4px solid #c9a84c;padding:10px 14px;border-radius:6px;margin:13px 0;font-size:12px;color:#555;}
  .note{background:#e8f4fd;border-left:4px solid #1a6fc4;padding:10px 14px;border-radius:6px;margin:13px 0;font-size:12px;color:#1a3a5c;}

  /* Flow strip */
  .flow{display:flex;align-items:center;gap:6px;margin:13px 0;flex-wrap:wrap;}
  .fs{background:#1a1a2e;color:#c9a84c;padding:5px 12px;border-radius:16px;font-size:11px;font-weight:600;}
  .fa{color:#c9a84c;font-weight:700;}

  /* Grid */
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}
  .gc{background:#f8f9fa;border-radius:10px;padding:14px;border-top:3px solid #c9a84c;}
  .gi{font-size:20px;margin-bottom:7px;}
  .gc h4{color:#1a1a2e;margin:0 0 5px;font-size:13px;}
  .gc p{font-size:12px;color:#666;margin:0;}

  /* Status table */
  .st{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;}
  .st th{background:#1a1a2e;color:#c9a84c;padding:9px 10px;text-align:left;}
  .st td{padding:8px 10px;border-bottom:1px solid #eee;}

  /* FAQ */
  .faq{margin-bottom:16px;}
  .fq{font-weight:600;color:#1a1a2e;margin-bottom:5px;font-size:13px;}
  .fa_{color:#555;padding-left:16px;border-left:2px solid #c9a84c;font-size:12px;}

  /* Contact */
  .cg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}
  .cc{background:#1a1a2e;color:#fff;border-radius:10px;padding:16px;text-align:center;}
  .ci{font-size:24px;margin-bottom:7px;}
  .cc h4{color:#c9a84c;margin-bottom:4px;font-size:12px;}
  .cc p{font-size:12px;color:rgba(255,255,255,.8);margin:0;}

  /* Footer */
  .foot{margin-top:22px;padding-top:9px;border-top:1px solid #eee;display:flex;justify-content:space-between;color:#aaa;font-size:10px;}

  /* Thank you */
  .ty{min-height:70vh;background:linear-gradient(135deg,#1a1a2e,#0f3460);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;}
  .ty h1{color:#c9a84c;font-size:30px;margin-bottom:12px;}
  .ty p{color:rgba(255,255,255,.85);font-size:14px;max-width:500px;line-height:1.8;}
  .ty .seal{font-size:56px;margin-bottom:18px;}

  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
`;

// ── MAIN ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const S = {};

  try {
    console.log('\n── Homepage ──────────────────────────────────────────────');
    await goto(page, `${BASE}/`);
    S.hero   = await shot(page, 'hero.png',   { clip: { x:0, y:0, width:1280, height:700 } });
    S.home   = await shot(page, 'home.png');

    // ── Login so modals show the actual forms ────────────────────────────────
    await authUser(page);

    // ── Appointment section card ─────────────────────────────────────────────
    console.log('\n── Appointment Section ───────────────────────────────────');
    await goto(page, `${BASE}/`);
    await scrollTo(page, 'appointment');
    S.apptSection = await shot(page, 'appt_section.png', { viewport: true });

    // Highlight the "Proceed to Payment" / book button
    await highlight(page, '.btn-gold');
    S.apptSectionHL = await shot(page, 'appt_section_hl.png', { viewport: true });
    await clearHL(page);

    // Open appointment modal via header button
    await goto(page, `${BASE}/`);
    await sleep(1000);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button,.btn')).find(e =>
        e.textContent.trim().toLowerCase().includes('book an appointment'));
      if (btn) btn.click();
    });
    await page.waitForSelector('.appointment-modal, .appt-modal, [class*="appointment"]', { timeout: 6000 }).catch(() => sleep(2000));
    await sleep(800);
    S.apptModal = await shot(page, 'appt_modal.png', { viewport: true });

    // Highlight the service dropdown inside modal
    await highlight(page, '.appt-type-card, select, .form-select', '#c9a84c');
    S.apptModalHL = await shot(page, 'appt_modal_hl.png', { viewport: true });
    await clearHL(page);

    // ── Books section ────────────────────────────────────────────────────────
    console.log('\n── Books Section ─────────────────────────────────────────');
    await goto(page, `${BASE}/`);
    await scrollTo(page, 'books');
    // Wait for book cards to load
    await page.waitForSelector('.book-card', { timeout: 10000 }).catch(() => {});
    await sleep(1000);
    S.booksSection = await shot(page, 'books_section.png', { viewport: true });

    // Highlight "Order Now" on first available book card
    await highlight(page, '.book-card .btn-gold:not([disabled])');
    S.bookCardHL = await shot(page, 'book_card_hl.png', { viewport: true });
    await clearHL(page);

    // Click Order Now — wait for .order-modal to appear
    await page.evaluate(() => {
      const btn = document.querySelector('.book-card .btn-gold:not([disabled])');
      if (btn) btn.click();
    });
    await page.waitForSelector('.order-modal', { timeout: 8000 }).catch(() => sleep(2000));
    await sleep(800);
    S.orderModal = await shot(page, 'order_modal.png', { viewport: true });

    // ── Courses page ─────────────────────────────────────────────────────────
    console.log('\n── Courses Page ──────────────────────────────────────────');
    await goto(page, `${BASE}/courses`);
    S.coursesPage = await shot(page, 'courses_page.png', { viewport: true });
    S.coursesFull = await shot(page, 'courses_full.png');

    // Highlight Enroll button
    await highlight(page, '.course-card-footer .btn-gold, .course-card .btn-gold');
    S.courseCardHL = await shot(page, 'course_card_hl.png', { viewport: true });
    await clearHL(page);

    // Click Enroll to open enroll modal
    await clickText(page, 'Enroll');
    await sleep(2000);
    S.enrollModal = await shot(page, 'enroll_modal.png', { viewport: true });

    // ── Login / Register pages ───────────────────────────────────────────────
    console.log('\n── Auth Pages ────────────────────────────────────────────');
    await goto(page, `${BASE}/login`);
    S.login = await shot(page, 'login.png');

    await goto(page, `${BASE}/register`);
    S.register = await shot(page, 'register.png');

    // ── Gallery / News / Contact ─────────────────────────────────────────────
    console.log('\n── Other Pages ───────────────────────────────────────────');
    await goto(page, `${BASE}/gallery`);
    S.gallery = await shot(page, 'gallery.png', { viewport: true });

    await goto(page, `${BASE}/news`);
    S.news = await shot(page, 'news.png', { viewport: true });

    await goto(page, `${BASE}/`);
    await page.evaluate(() => {
      const el = document.getElementById('contact') || Array.from(document.querySelectorAll('section')).find(s => s.textContent.toLowerCase().includes('contact us'));
      if (el) el.scrollIntoView({ behavior:'instant', block:'start' });
    });
    await sleep(1000);
    S.contact = await shot(page, 'contact.png', { viewport: true });

  } catch (e) {
    console.error('\nScreenshot error:', e.message);
  }

  // ── Build HTML ───────────────────────────────────────────────────────────────
  console.log('\nBuilding HTML...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Advocate Chauhan — User Guide</title>
<style>${CSS}</style>
</head>
<body>

<!-- ═══════════════════════ COVER ═══════════════════════ -->
<div class="cover">
  <div class="lc">⚖️</div>
  <h1>Website User Manual &amp;<br/>Getting Started Guide</h1>
  <h2>Advocate Chauhan — Expert Legal Services</h2>
  <div class="dv"></div>
  <p>A complete step-by-step guide for booking appointments, ordering books, enrolling in courses, and managing your account.</p>
  <div class="badge">Version 2.0 &nbsp;•&nbsp; June 2026</div>
</div>

${PB()}

<!-- ═══════════════════════ TOC ═══════════════════════ -->
<div class="toc">
  <h2>Table of Contents</h2>
  ${[
    ['1','Welcome & Introduction','3'],
    ['2','User Registration','4'],
    ['3','User Login','5'],
    ['4','Dashboard Overview','6'],
    ['5','Book an Appointment','7'],
    ['6','Order Books','9'],
    ['7','Enroll in Courses','11'],
    ['8','Payments','13'],
    ['9','Profile Management','14'],
    ['10','Notifications & Tracking','15'],
    ['11','Frequently Asked Questions','16'],
    ['12','Contact Support','17'],
  ].map(([n,t,pg]) => `<div class="ti"><div class="tl"><span class="tn">${n}</span><span>${t}</span></div><span class="tp">${pg}</span></div>`).join('')}
</div>

${PB()}

<!-- ═══════════════════════ S1: WELCOME ═══════════════════════ -->
<div class="page">
  ${sec(1,'Welcome &amp; Introduction')}
  ${p('Welcome to <strong>Advocate Chauhan\'s official website</strong> — your trusted platform for expert legal consultations, legal education, and professional support. This guide walks you through every feature so you can get started quickly.')}
  ${S.hero ? img(S.hero,'Homepage — Advocate Chauhan. Your Trusted Legal Partner Since 2009') : ''}
  ${h3('What You Can Do on This Platform')}
  ${grid(
    {icon:'📅',title:'Book Appointments',desc:'Schedule online or in-person legal consultations at your preferred date and time.'},
    {icon:'📚',title:'Order Legal Books',desc:'Browse and purchase legal books and study materials.'},
    {icon:'🎓',title:'Enroll in Courses',desc:'Access online legal courses with video lectures and downloadable resources.'},
    {icon:'🔔',title:'Track Everything',desc:'Monitor appointment status, orders, and courses from one dashboard.'},
  )}
  ${tip('Bookmark the website: <strong>https://ashritha-d.github.io/ChauhanAdvocate/</strong>')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 3</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S2: REGISTRATION ═══════════════════════ -->
<div class="page">
  ${sec(2,'User Registration')}
  ${p('Creating an account is free and takes less than 2 minutes. You need an account to book appointments, order books, and enroll in courses.')}
  ${S.register ? img(S.register,'Registration Page — fill in your details to create a free account') : ''}
  ${h3('Step-by-Step Registration')}
  ${steps([
    'Open the website and click <strong>"Register"</strong> in the top navigation bar.',
    'Enter your <strong>Full Name</strong> as it should appear on receipts.',
    'Enter your <strong>Email Address</strong> — used for login and email receipts.',
    'Enter your <strong>Mobile Number</strong> — used for WhatsApp notifications.',
    'Create a <strong>Password</strong> (minimum 6 characters).',
    'Click <strong>"Create Account"</strong>.',
    'You are automatically logged in and redirected to the dashboard.',
  ])}
  ${tip('Use a mobile number that has WhatsApp — you will receive real-time appointment confirmations and order updates there.')}
  ${note('Your personal information is kept private and secure. We never share it with third parties.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 4</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S3: LOGIN ═══════════════════════ -->
<div class="page">
  ${sec(3,'User Login')}
  ${p('Once registered, log in anytime to access your dashboard, appointments, orders, and courses.')}
  ${S.login ? img(S.login,'Login Page — enter your registered email and password') : ''}
  ${h3('Step-by-Step Login')}
  ${steps([
    'Click <strong>"Login"</strong> in the top navigation bar.',
    'Enter your registered <strong>Email Address</strong>.',
    'Enter your <strong>Password</strong>.',
    'Click <strong>"Login"</strong> — you are redirected to your dashboard.',
  ])}
  ${h3('Forgot Your Password?')}
  ${steps([
    'Click <strong>"Forgot Password?"</strong> on the login page.',
    'Enter your registered email and click <strong>"Send Reset Link"</strong>.',
    'Check your inbox and follow the link to set a new password.',
  ])}
  ${tip('Check "Remember me" to stay logged in so you don\'t need to log in every visit.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 5</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S4: DASHBOARD ═══════════════════════ -->
<div class="page">
  ${sec(4,'Dashboard Overview')}
  ${p('After logging in you land on your personal dashboard — the central hub for all your activity on the platform.')}
  ${h3('Dashboard Sections at a Glance')}
  ${grid(
    {icon:'👤',title:'Profile',desc:'View and update your personal info, password, and profile photo.'},
    {icon:'📅',title:'My Appointments',desc:'See all booked appointments with real-time status updates.'},
    {icon:'📦',title:'My Orders',desc:'Track all book orders and their delivery status.'},
    {icon:'🎓',title:'My Courses',desc:'Access enrolled courses and continue where you left off.'},
    {icon:'🔔',title:'Notifications',desc:'View all alerts — appointment updates, payments, order changes.'},
    {icon:'🚪',title:'Logout',desc:'Securely sign out when you are done.'},
  )}
  ${note('The bell icon (🔔) in the top navigation bar shows unread notification count. Check it regularly to stay updated.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 6</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S5: APPOINTMENT ═══════════════════════ -->
<div class="page">
  ${sec(5,'Book an Appointment')}
  ${p('You can book an in-person (<strong>Offline</strong>) or virtual (<strong>Online</strong>) consultation with Advocate Chauhan directly from the website.')}
  ${flow('Homepage','Scroll to Appointment','Fill Form','Proceed to Payment','Confirmation')}
  ${h3('Step 1 — Find the Appointment Section')}
  ${p('Scroll down the homepage until you see the <strong>Book an Appointment</strong> section, or click the <strong>"Book an Appointment"</strong> button in the navigation bar.')}
  ${S.apptSection ? img(S.apptSection,'Appointment section on the homepage — login to access the booking form') : ''}
  ${S.apptSectionHL ? img(S.apptSectionHL,'The highlighted button opens the booking form') : ''}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 7</span></div>
</div>

${PB()}

<div class="page">
  ${h3('Step 2 — Fill in the Booking Form')}
  ${p('After logging in, the appointment form appears. Fill in all required details.')}
  ${S.apptModal ? img(S.apptModal,'Appointment Booking Form — enter your name, phone, service, date and time') : ''}
  ${S.apptModalHL ? img(S.apptModalHL,'Select your preferred date and time slot — only available slots are shown') : ''}
  ${h3('Step 3 — Complete the Flow')}
  ${steps([
    'Select your preferred <strong>Service</strong> (e.g., Civil Litigation, Property Law, Family Law).',
    'Choose <strong>Offline</strong> (visit office) or <strong>Online</strong> (call/video) mode.',
    'Pick an available <strong>Date</strong> and <strong>Time Slot</strong>.',
    'Enter your <strong>Name, Mobile Number</strong>, and optionally your email.',
    'Add a brief <strong>Case Description</strong> (optional but helpful).',
    'Click <strong>"Proceed to Payment"</strong> to pay and confirm.',
    'After payment you receive an <strong>Appointment ID</strong> and WhatsApp confirmation.',
  ])}
  ${tip('You will receive WhatsApp notifications for every status change — Booked, Confirmed, Rescheduled, Completed.')}
  ${statusTable([
    ['⏳ Pending','Booking received, awaiting advocate confirmation'],
    ['✅ Confirmed','Advocate has confirmed your appointment'],
    ['🔄 Rescheduled','Appointment moved to a new date/time'],
    ['✔️ Completed','Consultation completed successfully'],
    ['❌ Cancelled','Appointment was cancelled'],
  ])}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 8</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S6: BOOKS ═══════════════════════ -->
<div class="page">
  ${sec(6,'Order Books')}
  ${p('Browse and purchase legal books, study materials, and publications directly from the website.')}
  ${flow('Homepage','Scroll to Books','Click Order Now','Fill Details','Payment','Confirmation')}
  ${h3('Step 1 — Browse the Books Section')}
  ${p('Scroll down the homepage to the <strong>Books</strong> section. Each card shows the book title, author, price, and description.')}
  ${S.booksSection ? img(S.booksSection,'Books Section — browse available legal books and publications') : ''}
  ${h3('Step 2 — Click "Order Now"')}
  ${p('Click the <strong>Order Now</strong> button (highlighted below) on any book card to start your order.')}
  ${S.bookCardHL ? img(S.bookCardHL,'Click the highlighted "Order Now" button on a book card') : ''}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 9</span></div>
</div>

${PB()}

<div class="page">
  ${h3('Step 3 — Complete the Order Form')}
  ${S.orderModal ? img(S.orderModal,'Order Form — enter your delivery details and proceed to payment') : ''}
  ${steps([
    'Click <strong>"Order Now"</strong> on your chosen book card.',
    'The order form opens — enter your <strong>Name, Phone Number</strong>, and <strong>Delivery Address</strong>.',
    'Select your <strong>Payment Method</strong> (Razorpay / UPI).',
    'Click <strong>"Place Order"</strong> and complete the payment.',
    'You receive an <strong>Order ID</strong> and WhatsApp confirmation.',
    'Track your order in <strong>Dashboard → My Orders</strong>.',
  ])}
  ${statusTable([
    ['📋 Pending','Order placed, awaiting confirmation'],
    ['✅ Confirmed','Order confirmed by the team'],
    ['⚙️ Processing','Book being packed for shipment'],
    ['🚚 Shipped','Book dispatched — tracking info sent via WhatsApp'],
    ['📦 Delivered','Book delivered successfully'],
    ['❌ Cancelled','Order was cancelled'],
  ])}
  ${tip('You receive WhatsApp updates at every stage — confirmed, shipped, and delivered.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 10</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S7: COURSES ═══════════════════════ -->
<div class="page">
  ${sec(7,'Enroll in Courses')}
  ${p('Access professional legal training courses designed by Advocate Chauhan. Learn at your own pace with video lectures and downloadable resources.')}
  ${flow('Courses Page','Browse Cards','Click Enroll','Payment','Start Learning')}
  ${h3('Step 1 — Open the Courses Page')}
  ${p('Click <strong>"Courses"</strong> in the top navigation. You will see all available courses as cards.')}
  ${S.coursesPage ? img(S.coursesPage,'Courses Page — browse all available legal training courses') : ''}
  ${h3('Step 2 — Choose a Course &amp; Click Enroll')}
  ${S.courseCardHL ? img(S.courseCardHL,'Click the highlighted "Enroll Now" or "Enroll Free" button on a course card') : ''}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 11</span></div>
</div>

${PB()}

<div class="page">
  ${h3('Step 3 — Enrollment &amp; Payment')}
  ${S.enrollModal ? img(S.enrollModal,'Course Enrollment — confirm enrollment and complete payment if required') : ''}
  ${steps([
    'Click <strong>"Courses"</strong> in the top navigation.',
    'Browse available courses — each shows title, level, duration, and price.',
    'Click <strong>"Enroll Now"</strong> (paid) or <strong>"Enroll Free"</strong> (free courses).',
    'Confirm enrollment in the popup window.',
    'Complete payment for paid courses via Razorpay.',
    'Once enrolled, the course appears in <strong>Dashboard → My Courses</strong>.',
    'Click <strong>"Start Learning"</strong> to watch video lectures and download resources.',
  ])}
  ${tip('Enrolled courses are available to you for life — revisit them anytime from your dashboard.')}
  ${note('Some courses include free preview videos. Click <strong>"Watch Preview"</strong> to assess content before purchasing.')}
  ${h3('Course Badge Levels')}
  <table class="st"><tr><th>Badge</th><th>Level</th></tr>
    <tr><td>🟢 Beginner</td><td>Suitable for those new to legal concepts</td></tr>
    <tr style="background:#f8f9fa"><td>🟡 Intermediate</td><td>Requires basic legal knowledge</td></tr>
    <tr><td>🔴 Advanced</td><td>For experienced legal professionals</td></tr>
  </table>
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 12</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S8: PAYMENTS ═══════════════════════ -->
<div class="page">
  ${sec(8,'Payments')}
  ${p('All payments are secure and processed through Razorpay — a trusted, PCI-DSS compliant payment gateway. Your financial data is never stored on our servers.')}
  ${h3('Available Payment Methods')}
  ${grid(
    {icon:'💳',title:'Credit / Debit Card',desc:'Visa, Mastercard, RuPay — all major cards accepted.'},
    {icon:'📱',title:'UPI',desc:'Google Pay, PhonePe, Paytm, or any UPI app.'},
    {icon:'🏦',title:'Net Banking',desc:'All major Indian banks supported via Razorpay.'},
    {icon:'📷',title:'QR Code / Manual UPI',desc:'Scan QR code and pay — upload screenshot for verification.'},
  )}
  ${h3('Payment Flow')}
  ${steps([
    'Select your service / book / course and click <strong>"Proceed to Pay"</strong>.',
    'A secure Razorpay window opens — choose your payment method.',
    'Complete the payment.',
    'A <strong>Payment Confirmation</strong> screen is shown with Transaction ID and Receipt ID.',
    'Receipt is sent to your registered email and WhatsApp.',
  ])}
  ${h3('Download Your Receipt')}
  ${p('After payment, a receipt is generated with all details. Save or download it for your records. It includes: Appointment/Order ID, Transaction ID, Receipt ID, Amount, Service, Date, and Payment Method.')}
  ${tip('If payment fails but amount is deducted, contact us with your Transaction ID — refunds are processed within 5–7 business days.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 13</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S9: PROFILE ═══════════════════════ -->
<div class="page">
  ${sec(9,'Profile Management')}
  ${p('Your profile stores personal details and activity history. Keeping it updated ensures you receive accurate notifications and receipts.')}
  ${h3('Update Personal Information')}
  ${steps([
    'Log in and go to <strong>Dashboard → Profile</strong> tab.',
    'Click <strong>"Edit Profile"</strong>.',
    'Update your Name, Email, or Mobile Number.',
    'Click <strong>"Save Changes"</strong>.',
  ])}
  ${h3('Change Your Password')}
  ${steps([
    'Go to Profile → Security section.',
    'Enter your <strong>Current Password</strong>.',
    'Enter and confirm your <strong>New Password</strong>.',
    'Click <strong>"Update Password"</strong>.',
  ])}
  ${h3('Upload Profile Photo')}
  ${steps([
    'Go to your <strong>Profile</strong> page.',
    'Click on your profile photo / avatar.',
    'Select a photo from your device (JPG or PNG, max 5MB).',
    'Click <strong>"Upload"</strong> — your photo updates immediately.',
  ])}
  ${tip('Keep your mobile number updated to receive WhatsApp notifications for all your bookings and orders.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 14</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S10: NOTIFICATIONS ═══════════════════════ -->
<div class="page">
  ${sec(10,'Notifications &amp; Status Tracking')}
  ${p('The platform keeps you informed at every step through in-app notifications and WhatsApp messages.')}
  ${grid(
    {icon:'📅',title:'Appointment Updates',desc:'Booked → Confirmed → Rescheduled → Completed — each stage notified.'},
    {icon:'📦',title:'Order Tracking',desc:'Placed → Confirmed → Processing → Shipped → Delivered.'},
    {icon:'🎓',title:'Course Alerts',desc:'Enrollment confirmation and new content availability alerts.'},
    {icon:'💰',title:'Payment Confirmations',desc:'Instant receipt with Transaction ID, amount, and service details.'},
  )}
  ${h3('Where to See Notifications')}
  <ul style="padding-left:18px;color:#444;line-height:2.2;">
    <li><strong>🔔 Bell icon</strong> (top right) — in-app notifications with unread badge count</li>
    <li><strong>📱 WhatsApp</strong> — real-time messages from the official business number</li>
    <li><strong>📧 Email</strong> — receipts and confirmations to your registered address</li>
    <li><strong>📋 Dashboard tabs</strong> — full history in Appointments, Orders, and Courses sections</li>
  </ul>
  ${note('Save the WhatsApp business number as "Advocate Chauhan" in your contacts so you never miss a notification.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 15</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S11: FAQ ═══════════════════════ -->
<div class="page">
  ${sec(11,'Frequently Asked Questions')}
  ${faq('How do I reset my password?','Click "Forgot Password?" on the Login page → enter your registered email → follow the reset link sent to your inbox.')}
  ${faq('How can I cancel an appointment?','Contact us via WhatsApp or email with your Appointment ID. Cancellations more than 24 hours before the appointment are processed without charge.')}
  ${faq('How do I access purchased courses?','Log in → Dashboard → My Courses. All enrolled courses appear here. Click "Start Learning" on any course.')}
  ${faq('How can I track my book order?','Go to Dashboard → My Orders. Each order shows its current status. You also receive WhatsApp updates for every status change.')}
  ${faq('My payment failed but money was deducted — what do I do?','This can happen due to network issues. Contact our support team immediately with your Transaction ID and amount paid. Refunds are processed within 5–7 business days.')}
  ${faq('Can I reschedule my appointment?','Yes. Contact us via WhatsApp or email with your Appointment ID and preferred new date/time. Rescheduling is subject to availability.')}
  ${faq('Can I book an appointment without creating an account?','You need to log in to book an appointment. Registration is free and takes under 2 minutes.')}
  ${faq('Is my personal information safe?','Yes. All data is encrypted and stored securely. Payments are processed by Razorpay — PCI-DSS compliant. We do not share your data with third parties.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 16</span></div>
</div>

${PB()}

<!-- ═══════════════════════ S12: CONTACT ═══════════════════════ -->
<div class="page">
  ${sec(12,'Contact Support')}
  ${p('Our team is available to help with any questions or issues. Reach us through any of the channels below.')}
  ${S.contact ? img(S.contact,'Contact Section — find us on the website homepage') : ''}
  ${contact(
    {icon:'📧',title:'Email Support',text:'Send your query and we\'ll respond within 24 hours'},
    {icon:'📱',title:'WhatsApp Support',text:'Chat with us directly for quick help'},
    {icon:'📞',title:'Phone',text:'Call us Mon–Sat, 9 AM – 6 PM'},
    {icon:'🌐',title:'Website Contact Form',text:'Fill the form on the Contact section of the homepage'},
  )}
  ${h3('Business Hours')}
  <table class="st"><tr><th>Day</th><th>Hours</th></tr>
    <tr><td>Monday – Friday</td><td>9:00 AM – 6:00 PM</td></tr>
    <tr style="background:#f8f9fa"><td>Saturday</td><td>9:00 AM – 2:00 PM</td></tr>
    <tr><td>Sunday</td><td>Closed</td></tr>
  </table>
  ${note('Always include your <strong>Appointment ID</strong> or <strong>Order ID</strong> when contacting support for faster resolution.')}
  <div class="foot"><span>Advocate Chauhan — User Guide v2.0</span><span>Page 17</span></div>
</div>

${PB()}

<!-- ═══════════════════════ THANK YOU ═══════════════════════ -->
<div class="ty">
  <div class="seal">⚖️</div>
  <h1>Thank You for Using Our Platform</h1>
  <div style="width:60px;height:3px;background:#c9a84c;margin:14px auto;"></div>
  <p>"We are committed to providing seamless legal services, educational resources, and professional support. Your trust is our greatest responsibility."</p>
  <p style="margin-top:24px;color:#c9a84c;font-family:'Playfair Display',serif;font-size:17px;">— Advocate Chauhan</p>
  <p style="margin-top:30px;font-size:11px;color:rgba(255,255,255,.4);">Advocate Chauhan — Expert Legal Services &nbsp;•&nbsp; User Guide v2.0 — June 2026</p>
</div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, 'guide.html');
  fs.writeFileSync(htmlPath, html);
  console.log('HTML written.');

  console.log('\nGenerating PDF...');
  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file:///${htmlPath.replace(/\\/g,'/')}`, { waitUntil:'networkidle0', timeout:60000 });
  await sleep(4000);

  await pdfPage.pdf({
    path: PDF_OUT,
    format: 'A4',
    printBackground: true,
    margin: { top:'0mm', right:'0mm', bottom:'0mm', left:'0mm' },
  });

  await browser.close();

  const mb = (fs.statSync(PDF_OUT).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Done! ${PDF_OUT}\n📊 ${mb} MB`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
