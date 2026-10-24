// Captures de la passe 2 (sbb7b, sbb5b) : <id>-60.png (repos, Nugget à 60′), <id>-whirlpool.png (un toucher sur la puce
// du moment), <id>-page.png (page entière à 60′), <id>-geste.png (un toucher sur un autre remplaçant), <id>-fiche.png
// (appui long). Mesure au DOM, dans les deux états : aucun point ni étiquette ne se chevauchent (sbb7b).
// Usage : node capturer-b.mjs [sbb7b sbb5b]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lot = path.resolve(ici, '..');
const out = path.join(lot, 'captures');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['sbb7b', 'sbb5b'];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const collisions = () => {
  const vis = (e) => e.checkVisibility() && e.getBoundingClientRect().width > 0;
  const els = [...document.querySelectorAll('[data-point], .' + document.body.className.split(' ')[0] + '-lab')].filter(vis).map((e) => ({ n: (e.dataset.point ? 'point ' : 'boîte ') + (e.dataset.point || e.dataset.houblon), r: e.getBoundingClientRect() }));
  const f = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i].r, b = els[j].r; if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) f.push(els[i].n + ' / ' + els[j].n); }
  return { n: els.length, f };
};
for (const id of ids) {
  const url = pathToFileURL(path.join(lot, id, 'etat.html')).href;
  const page = await browser.newPage();
  const err = []; page.on('pageerror', (e) => err.push(String(e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0' }); await att(250);
  await page.screenshot({ path: path.join(out, id + '-60.png') });
  await page.screenshot({ path: path.join(out, id + '-page.png'), fullPage: true });
  const c60 = await page.evaluate(collisions);
  const lire = () => page.evaluate(() => ({ etat: document.body.dataset.moment, cand: document.body.dataset.choix, pied: [...document.querySelectorAll('footer p')].filter((e) => e.checkVisibility()).map((e) => e.innerText.replace(/\s+/g, ' ')).join('') }));
  const r60 = await lire();
  const pt = async (sel) => page.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.checkVisibility() && x.getAttribute('aria-checked') !== 'true'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(30, r.width / 2), y: r.top + r.height / 2 }; }, sel);
  let p = await pt('[data-cand]'); if (p) { await page.touchscreen.tap(p.x, p.y); await att(250); await page.evaluate(() => window.scrollTo(0, 0)); await att(100); await page.screenshot({ path: path.join(out, id + '-geste.png') }); }
  const rg = await lire();
  await page.goto(url, { waitUntil: 'networkidle0' }); await att(200);
  p = await pt('[data-vers]'); await page.touchscreen.tap(p.x, p.y); await att(300); await page.evaluate(() => window.scrollTo(0, 0)); await att(100);
  await page.screenshot({ path: path.join(out, id + '-whirlpool.png') });
  const cwp = await page.evaluate(collisions);
  const rwp = await lire();
  await page.screenshot({ path: path.join(out, id + '-whirlpool-page.png'), fullPage: true });
  await page.goto(url, { waitUntil: 'networkidle0' }); await att(200);
  const h = await page.evaluate(() => { const e = [...document.querySelectorAll('[data-houblon]')].find((x) => { const r = x.getBoundingClientRect(); return x.checkVisibility() && r.top > 0 && r.bottom < innerHeight; }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(30, r.width / 2), y: r.top + r.height / 2, n: e.dataset.houblon }; });
  const t = await page.touchscreen.touchStart(h.x, h.y); await att(700); await t.end(); await att(300);
  await page.screenshot({ path: path.join(out, id + '-fiche.png') });
  console.log(id, '· 60′', JSON.stringify(r60), '· geste', JSON.stringify(rg), '· whirlpool', JSON.stringify(rwp), '· fiche', h.n);
  console.log('  collisions 60′ :', c60.n, 'éléments,', c60.f.length ? c60.f.join(' ; ') : 'aucune', '· whirlpool :', cwp.n, 'éléments,', cwp.f.length ? cwp.f.join(' ; ') : 'aucune', err.length ? '· ERREURS ' + err.join(' | ') : '');
  await page.close();
}
await browser.close();
