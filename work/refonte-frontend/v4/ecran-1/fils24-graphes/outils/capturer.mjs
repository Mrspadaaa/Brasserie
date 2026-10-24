// Captures de la planche (390 × 844, tactile) : <id>-repos.png (premier écran), <id>-toucher.png (lecture b, doigt
// posé et tenu), <id>-toucher-c.png (lecture c), <id>-page.png (page entière).
// Usage : node capturer.mjs [gr1 …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const lot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cap = path.join(lot, 'captures');
fs.mkdirSync(cap, { recursive: true });
const CIBLES = { gr1: ['agrumes', 'citrus', 'citrus'], gr2: ['', 'floral', 'resin'], gr3: ['', 'resin', 'floral'], gr4: ['', 'floral', 'resin'], gr5: ['', 'citrus', 'citrus'], gr6: ['', 'Galaxy', 'floral'] };
const voulus = process.argv.slice(2);
const ids = voulus.length ? voulus : Object.keys(CIBLES);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ouvrir = async (id, h = 844) => {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.join(lot, id, 'etat.html')).href, { waitUntil: 'networkidle0' });
  await wait(500);
  return p;
};
for (const id of ids) {
  let p = await ouvrir(id);
  await p.screenshot({ path: path.join(cap, id + '-repos.png') });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.close();
  p = await ouvrir(id, H);
  await p.screenshot({ path: path.join(cap, id + '-page.png') });
  await p.close();
  for (const [k, nom] of [['b', '-toucher'], ['c', '-toucher-c']]) {
    p = await ouvrir(id);
    const f = CIBLES[id][k === 'b' ? 1 : 2];
    const pt = await p.evaluate((k, f) => window.jgPoint(k, f), k, f);
    await wait(250);
    await p.touchscreen.touchStart(pt.x, pt.y);
    await wait(400);
    const vu = await p.evaluate(() => { const e = document.querySelector('.jg-bulle'); return e.hidden ? '' : e.innerText; });
    await p.screenshot({ path: path.join(cap, id + nom + '.png') });
    console.log(id + nom + ' · ' + (vu || 'AUCUNE BULLE'));
    await p.close();
  }
}
await b.close();
