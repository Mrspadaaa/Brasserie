// Captures de la série F : premier écran à 390 × 844 (<id>-390.png), un geste joué (<id>-60-390.png :
// le moment glissé à 60′ par flèches clavier), et la fiche ouverte sur f1 (f1-fiche-390.png).
// Usage : node capturer-f.mjs [ids…]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(ici, 'captures'); fs.mkdirSync(out, { recursive: true });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const url = pathToFileURL(path.join(ici, id, 'etat.html')).href;
  const page = await browser.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e.message || e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(400);
  const m = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, mots: document.body.innerText.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length }));
  await page.screenshot({ path: path.join(out, id + '-390.png') });
  // geste : le curseur glissé jusqu'à 60′ (poser(0), ce que fait la flèche gauche répétée)
  await page.evaluate(() => { poser(0); });
  await wait(200);
  await page.screenshot({ path: path.join(out, id + '-60-390.png') });
  if (id === 'f1') {
    await page.goto(url, { waitUntil: 'networkidle0' }); await wait(300);
    const h = await page.$('[data-houblon]'); const t = await h.touchStart(); await wait(700); await t.end(); await wait(400);
    await page.screenshot({ path: path.join(out, id + '-fiche-390.png') });
  }
  console.log(id, '· largeur', m.scrollW, '· hauteur', m.scrollH, '· mots visibles (page entière)', m.mots, erreurs.length ? '· ERREURS ' + erreurs.join(' | ') : '· sans erreur');
  await page.close();
}
await browser.close();
