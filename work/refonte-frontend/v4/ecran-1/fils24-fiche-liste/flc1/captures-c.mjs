// Série c · captures à 390 × 844 (×2) : premier écran, page entière, et les états qui comptent (absolu, autre houblon, fiche g1).
// Usage : node work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/flc1/captures-c.mjs flc1 [flc2 …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const LOT = path.resolve(ICI, '..'), OUT = path.join(LOT, 'captures');
fs.mkdirSync(OUT, { recursive: true });
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const extra = process.argv.includes('--etats');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const url = pathToFileURL(path.join(LOT, id, 'etat.html')).href;
  const vues = [['premier-ecran', '', false], ['page', '', true]];
  if (extra) vues.push(['absolu', '?abs', false], ['nelson', '?h=Nelson%20Sauvin', false], ['motueka', '?h=Motueka', false], ['legende', '?legende', false]);
  for (const [suf, q, full] of vues) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(url + q, { waitUntil: 'networkidle0' }); await wait(400);
    await p.screenshot({ path: path.join(OUT, id + '-' + suf + '.png'), fullPage: full });
    await p.close();
  }
  if (extra) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(url, { waitUntil: 'networkidle0' }); await wait(400);
    const h = await p.$('[data-houblon]');
    const t = await h.touchStart(); await wait(700); await t.end(); await wait(500);
    await p.screenshot({ path: path.join(OUT, id + '-fiche-g1.png') });
    await p.close();
  }
  console.log('captures ' + id);
}
await b.close();
