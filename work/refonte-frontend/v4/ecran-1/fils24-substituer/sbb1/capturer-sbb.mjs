// Captures de la série b : premier écran (<id>-premier-ecran.png, 390 × 844), page entière (<id>-page.png),
// la fiche ouverte par appui long (<id>-fiche.png) et le geste (<id>-geste.png : un toucher sur un autre remplaçant).
// Usage : node capturer-sbb.mjs [sbb1 …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lot = path.resolve(ici, '..');
const out = path.join(lot, 'captures');
fs.mkdirSync(out, { recursive: true });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['sbb1', 'sbb2', 'sbb3', 'sbb4', 'sbb5', 'sbb6', 'sbb7', 'sbb8'];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const att = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const f = path.join(lot, id, 'etat.html');
  if (!fs.existsSync(f)) continue;
  const url = pathToFileURL(f).href;
  const page = await browser.newPage();
  const err = [];
  page.on('pageerror', (e) => err.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0' }); await att(250);
  await page.screenshot({ path: path.join(out, id + '-premier-ecran.png') });
  await page.screenshot({ path: path.join(out, id + '-page.png'), fullPage: true });
  const dims = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth }));
  // le geste : toucher le deuxième remplaçant
  const autre = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-cand]')].find((x) => { const r = x.getBoundingClientRect(); return r.height > 0 && x.getAttribute('aria-checked') !== 'true' && x.getAttribute('aria-pressed') !== 'true' && r.top > 0 && r.bottom < innerHeight; }); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + Math.min(30, r.width / 2), y: r.top + r.height / 2, k: b.dataset.cand }; });
  if (autre) { await page.touchscreen.tap(autre.x, autre.y); await att(250); await page.screenshot({ path: path.join(out, id + '-geste.png') }); }
  const apres = await page.evaluate(() => document.body.dataset.cand || null);
  // la fiche : appui long sur le premier houblon visible
  await page.goto(url, { waitUntil: 'networkidle0' }); await att(200);
  const h = await page.evaluate(() => { const e = [...document.querySelectorAll('[data-houblon]')].find((x) => { const r = x.getBoundingClientRect(); return r.height > 0 && r.top > 0 && r.bottom < innerHeight; }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(40, r.width / 2), y: r.top + r.height / 2, n: e.dataset.houblon }; });
  const t = await page.touchscreen.touchStart(h.x, h.y); await att(700); await t.end(); await att(300);
  await page.screenshot({ path: path.join(out, id + '-fiche.png') });
  console.log(id, '· page', dims.h, 'px', dims.w > 390 ? '· DÉBORDE ' + dims.w : '', '· geste →', autre && autre.k, apres, '· fiche', h.n, err.length ? '· ERREURS ' + err.join(' | ') : '');
  await page.close();
}
await browser.close();
