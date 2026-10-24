// Captures de la planche à 390 px : planche-390.png (page entière), contexte-390.png (gros plan des lignes
// de contexte : tailles masquées, échelle ×4), et, pour le travail, gros-24.png (tous les pictos à 24 px ×8).
// Usage : node capturer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
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
p = await nouvelle(4);
await p.addStyleTag({ content: '.tailles, .ref { display: none !important; } .v { padding: 8px 12px; margin-bottom: 6px; }' });
const h = await p.evaluate(() => Math.ceil(document.body.getBoundingClientRect().bottom) + 8);
await p.screenshot({ path: path.join(ICI, 'captures/contexte-390.png'), clip: { x: 0, y: 0, width: 390, height: h } });
await p.close();
p = await nouvelle(1);
await p.addStyleTag({ content: 'svg[data-famille] { transform-origin: 0 0; } .tailles svg:nth-child(3), .ref .vo:first-child svg { width: 120px !important; height: 120px !important; } .tailles { gap: 6px !important; }' });
await p.screenshot({ path: path.join(ICI, 'captures/gros-24.png'), fullPage: true });
await browser.close();
console.log('CAPTURES écrites');
