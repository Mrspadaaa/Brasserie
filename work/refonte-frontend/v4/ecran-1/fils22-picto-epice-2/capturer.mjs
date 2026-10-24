// Captures de la planche à 390 px : planche-390.png (page entière) et contexte-390.png (avant, puis
// chaque proposition dans les lignes de houblon ; tailles masquées, échelle ×3).
// Usage : node capturer.mjs (après node generer-planche.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../package.json'));
const puppeteer = require('puppeteer-core');
fs.mkdirSync(path.join(ICI, 'captures'), { recursive: true });
const url = pathToFileURL(path.join(ICI, 'planche/etat.html')).href;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const nouvelle = async (dsf) => {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 300));
  return p;
};
let p = await nouvelle(2);
await p.screenshot({ path: path.join(ICI, 'captures/planche-390.png'), fullPage: true });
await p.close();
p = await nouvelle(3);
await p.addStyleTag({ content: '.tailles, .ba, .src, h1 { display: none !important; } .v, .av { padding: 6px 10px; margin-bottom: 6px; } .t { margin-bottom: 2px; }' });
const h = await p.evaluate(() => Math.ceil(document.body.getBoundingClientRect().bottom) + 8);
await p.screenshot({ path: path.join(ICI, 'captures/contexte-390.png'), clip: { x: 0, y: 0, width: 390, height: h } });
await browser.close();
console.log('CAPTURES écrites');
