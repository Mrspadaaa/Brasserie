// Planche de lecture : plusieurs captures côte à côte dans une seule image, pour les regarder ensemble.
// Usage : node scripts/theme/planche.mjs <sortie.png> <largeur-colonne> <capture1.png> <capture2.png> …
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const [sortie, col, ...images] = process.argv.slice(2);
const w = Number(col) || 300;
const html = `<body style="margin:0;background:#7a7a7a;font:12px sans-serif;display:flex;gap:6px;padding:6px;align-items:flex-start">${images
  .map((i) => `<figure style="margin:0;width:${w}px"><figcaption style="color:#fff;padding:2px 0">${path.basename(i, '.png')}</figcaption><img style="width:${w}px;display:block" src="${pathToFileURL(path.resolve(i)).href}"></figure>`)
  .join('')}</body>`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: images.length * (w + 6) + 6, height: 400 });
const fichier = path.join(os.tmpdir(), `planche-${process.pid}.html`);
fs.writeFileSync(fichier, html);
await page.goto(pathToFileURL(fichier).href, { waitUntil: 'load' });
await page.screenshot({ path: sortie, fullPage: true });
await browser.close();
console.log(`PLANCHE ${sortie}`);
