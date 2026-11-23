// Sonde (19.10, D69) : la descente pas à pas, de 60′ au bas de l'écran ; à chaque pas, le moment tenu,
// le segment de la loupe et le bas du rail. Usage : node sonde-extremes-pas.mjs <page.html> <hauteur>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const f = path.resolve(process.argv[2]);
const H = Number(process.argv[3] || 844);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const q = await browser.newPage();
await q.setViewport({ width: 390, height: H, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await q.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0' });
await wait(300);
const l = await q.evaluate(() => { const r = document.querySelector('[data-role="ligne-houblon"] [data-role="glisser-moment"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, H0: document.querySelector('.frise').getBoundingClientRect().height }; });
console.log('repos : frise', Math.round(l.H0), 'px');
const t = await q.touchscreen.touchStart(l.x, l.y);
let y = l.y;
await t.move(l.x, y + 3); await wait(200);
let avant = '';
while (y < H - 6) {
  y = Math.min(H - 6, y + 6);
  await t.move(l.x, y); await wait(40);
  const m = await q.evaluate(() => {
    const g = document.querySelector('[data-glisse] [data-role="quand"]');
    const fo = document.querySelector('[data-rang].focus');
    const ax = document.querySelector('[data-geste] .axe').getBoundingClientRect();
    return (g ? g.innerText.trim() : '?') + ' ' + (fo ? fo.dataset.rang : '?') + ' bas ' + Math.round(ax.bottom);
  });
  if (m !== avant) console.log('doigt', Math.round(y), m);
  avant = m;
}
await t.end();
await browser.close();
