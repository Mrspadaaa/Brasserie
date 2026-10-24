// Captures de la planche série C à 390 px (après node generer.mjs) :
//   captures/planche-390.png  la planche entière ;
//   captures/tailles-390.png  chaque proposition seule à 24, 16 et 12 px, et à 12 px entre la feuille et les brins ;
//   captures/cartes-390.png   chaque proposition sur les trois vraies cartes (Saaz, Hallertau Mittelfrüh, Cascade).
// Usage : node capturer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
fs.mkdirSync(path.join(ICI, 'captures'), { recursive: true });
const url = pathToFileURL(path.join(ICI, 'etat.html')).href;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const prendre = async (nom, css, dsf = 2) => {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle0' });
  if (css) await p.addStyleTag({ content: css });
  await new Promise((r) => setTimeout(r, 200));
  await p.screenshot({ path: path.join(ICI, 'captures', nom), fullPage: true });
  await p.close();
};
await prendre('planche-390.png');
await prendre('tailles-390.png', '.c4d-cartes, .c4d-av, .c4d-src, .c4d-intro { display: none !important; } .c4d-ep { border-bottom: 0; } .c4d-v { padding-bottom: 6px; margin-bottom: 6px; }', 3);
await prendre('cartes-390.png', '.c4d-ep, .c4d-dit, .c4d-intro, .c4d-src { display: none !important; } .c4d-v { margin-bottom: 6px; }');
await browser.close();
console.log('CAPTURES écrites : planche-390.png, tailles-390.png, cartes-390.png');
