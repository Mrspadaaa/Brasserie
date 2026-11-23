// Fige une page rendue en HTML statique (DOM après rendu, scripts retirés, styles gardés) :
// le point de départ d'un fil de fer pris sur une variante choisie, sans son générateur.
// Usage : node work/refonte-frontend/v4/tournoi/outils/figer.mjs <page.html> <sortie.html>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const [src, out] = process.argv.slice(2).map((p) => path.resolve(p));
if (!src || !out) { console.error('Usage : figer.mjs <page.html> <sortie.html>'); process.exit(2); }
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(src).href, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 400));
const html = await page.evaluate(() => {
  document.querySelectorAll('script').forEach((s) => s.remove());
  return '<!doctype html>\n' + document.documentElement.outerHTML;
});
await browser.close();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('FIGE ' + out + ' ' + Math.round(html.length / 1024) + ' ko');
