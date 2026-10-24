// Captures de la planche à 390 px (densité 2) : planche-390.png (page entière), tailles-390.png (chaque
// proposition seule à 12, 16, 24 px et entre la feuille et les brins, cartes masquées), cartes-390.png
// (les vraies cartes, tailles masquées). Usage : node capturer.mjs (après node generer.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
fs.mkdirSync(path.join(ICI, 'captures'), { recursive: true });
const url = pathToFileURL(path.join(ICI, 'etat.html')).href;
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const capture = async (nom, css) => {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'load' });
  if (css) await p.addStyleTag({ content: css });
  await new Promise((r) => setTimeout(r, 200));
  await p.screenshot({ path: path.join(ICI, 'captures', nom), fullPage: true });
  await p.close();
};
await capture('planche-390.png');
await capture('tailles-390.png', '.re-cs, .re-src, .re-sous { display: none !important; } .re-tl { border: 0; padding: 0; } .re-v { margin-bottom: 6px; padding-bottom: 10px; }');
await capture('cartes-390.png', '.re-tl, .re-dit, .re-src, .re-ray, .re-sous { display: none !important; } .re-cs { margin-top: 6px; } .re-v { margin-bottom: 6px; padding-bottom: 8px; }');
await nav.close();
console.log('CAPTURES écrites : planche-390.png, tailles-390.png, cartes-390.png');
