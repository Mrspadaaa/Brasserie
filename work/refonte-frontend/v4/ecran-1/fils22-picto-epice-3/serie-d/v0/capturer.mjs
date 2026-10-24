// Captures de la planche à 390 px : planche-390.png (page entière), tailles-390.png (chaque proposition
// à 12, 16, 24 px et à côté de la feuille et des brins, cartes masquées), cartes-390.png (les vraies
// cartes, tailles masquées). En plus, captures/travail/loupe.png : les vrais pixels à densité 1 de chaque
// picto à 12, 16 et 24 px, agrandis ×6 sans lissage, pour les nommer à voix haute (L12).
// Usage : node capturer.mjs (après node generer.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const CAP = path.join(ICI, 'captures');
fs.mkdirSync(path.join(CAP, 'travail'), { recursive: true });
const url = pathToFileURL(path.join(ICI, 'etat.html')).href;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const nouvelle = async (dsf, css = '') => {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'load' });
  if (css) await p.addStyleTag({ content: css });
  await new Promise((r) => setTimeout(r, 300));
  return p;
};
const pleine = async (p, f) => {
  const h = await p.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  await p.screenshot({ path: path.join(CAP, f), clip: { x: 0, y: 0, width: 390, height: h } });
  await p.close();
};
await pleine(await nouvelle(2), 'planche-390.png');
await pleine(await nouvelle(3, '.d-cartes, .d-src { display: none !important; } .d-v { padding-bottom: 8px; } .d-row { border: 0; padding-bottom: 0; }'), 'tailles-390.png');
await pleine(await nouvelle(2, '.d-row, .d-sous { display: none !important; } .d-t { margin-bottom: 4px; }'), 'cartes-390.png');

// La loupe : vrais pixels à densité 1, agrandis ×6 sans lissage.
const p1 = await nouvelle(1, '.d-cartes, .d-sous, .d-src, h1 { display: none !important; } .d-v { padding: 6px 10px; margin-bottom: 4px; } .d-row { border: 0; padding: 0; }');
const h1 = await p1.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
const brut = await p1.screenshot({ clip: { x: 0, y: 0, width: 390, height: h1 }, encoding: 'base64' });
await p1.close();
const z = 4;
const p2 = await browser.newPage();
await p2.setViewport({ width: 390 * z, height: Math.min(h1 * z, 16000), deviceScaleFactor: 1 });
await p2.setContent(`<img src="data:image/png;base64,${brut}" style="display:block;width:${390 * z}px;height:${h1 * z}px;image-rendering:pixelated">`);
await p2.screenshot({ path: path.join(CAP, 'travail/loupe.png'), clip: { x: 0, y: 0, width: 390 * z, height: h1 * z } });
await p2.close();
await browser.close();
console.log('CAPTURES écrites : planche-390.png, tailles-390.png, cartes-390.png, travail/loupe.png');
