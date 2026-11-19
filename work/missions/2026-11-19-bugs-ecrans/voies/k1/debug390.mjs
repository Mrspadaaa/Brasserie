import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
page.on('pageerror', (e) => console.log('pageerror', String(e).slice(0, 300)));
await page.goto('http://localhost:3105/work/missions/2026-11-19-bugs-ecrans/voies/k1/banc/banc-notes.html?theme=cave', { waitUntil: 'domcontentloaded', timeout: 240000 });
await new Promise((r) => setTimeout(r, 8000));
console.log(await page.evaluate(() => ({
  txt: document.body.innerText.slice(0, 900).split('\n').join(' / '),
  summaries: [...document.querySelectorAll('summary')].map((s) => s.textContent.trim().slice(0, 60)),
  btns: [...document.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 40)).filter(Boolean).slice(0, 20),
})));
await page.screenshot({ path: 'work/missions/2026-11-19-bugs-ecrans/voies/k1/debug-notes.png' });
await browser.close();
