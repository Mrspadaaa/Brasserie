// Série C · captures à 390 px (×2) : premier écran, page entière, 60′, après 3 j, la fiche d'Idaho 7.
// Usage : node work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/captures.mjs [c1 c2 …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ICI, 'captures');
fs.mkdirSync(OUT, { recursive: true });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const f = path.join(ICI, id, 'etat.html');
  if (!fs.existsSync(f)) continue;
  const url = pathToFileURL(f).href;
  const vues = [['-390', '', false], ['-pleine-390', '', true], ['-60-390', '?moment=b60', false], ['-apres-390', '?moment=dryPost%7C3', false], ['-j1-390', '?moment=dryActive%7C1', false]];
  for (const [suf, q, full] of vues) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(url + q, { waitUntil: 'networkidle0' }); await wait(500);
    await p.screenshot({ path: path.join(OUT, id + suf + '.png'), fullPage: full });
    await p.close();
  }
  // La fiche : appui long réel sur le nom d'Idaho 7.
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle0' }); await wait(400);
  const h = await p.$('[data-houblon]');
  const t = await h.touchStart(); await wait(700); await t.end(); await wait(500);
  await p.screenshot({ path: path.join(OUT, id + '-fiche-390.png') });
  await p.close();
  console.log('captures ' + id);
}
await b.close();
