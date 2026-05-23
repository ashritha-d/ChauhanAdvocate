import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import path from 'path';

const outDir = path.resolve('screenshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  headless: true
});

const page = await browser.newPage();
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('http://localhost:5500', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Force all AOS elements to animate so screenshots show final state
await page.evaluate(() => {
  document.querySelectorAll('[data-aos]').forEach(el => el.classList.add('aos-animate'));
});
await page.waitForTimeout(300);

// Check for body horizontal overflow
const overflowInfo = await page.evaluate(() => ({
  bodyScrollWidth: document.body.scrollWidth,
  innerWidth: window.innerWidth,
  hasOverflow: document.body.scrollWidth > window.innerWidth,
}));
console.log('Horizontal overflow check:', overflowInfo);

const snapshots = [
  { name: 'yt_header',    scroll: 1380 },
  { name: 'books_full',   scroll: 3100 },
  { name: 'drafts_full',  scroll: 4100 },
  { name: 'joinus_full',  scroll: 5600 },
];

for (const s of snapshots) {
  await page.evaluate(y => window.scrollTo(0, y), s.scroll);
  await page.waitForTimeout(600);
  const p = path.join(outDir, `check_${s.name}.png`);
  await page.screenshot({ path: p });
  console.log(`Saved: ${p}`);
}

await browser.close();
