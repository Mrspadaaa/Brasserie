// Lot 16 : le radar seul (.c-radar), à 390 px et en pixels doubles, pour chaque variante à 3 et à 4
// houblons ; les bandes des houblons au-dessus gardent leurs couleurs (le nom de chacun).
// Usage : node captures.mjs ; écrit captures/<rN>-radar-3.png et <rN>-radar-4.png.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const ids = fs.readdirSync(ici).filter((d) => /^r\d$/.test(d)).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) for (const [n, f] of [['3', 'comparer-radar.html'], ['4', 'comparer-radar-4.html']]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(ici, id, f)).href, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  const el = await page.$('.c-bandes');
  const r = await page.$('.c-radar');
  const a = await el.boundingBox(), b = await r.boundingBox();
  const out = path.join(ici, 'captures', id + '-radar-' + n + '.png');
  await page.screenshot({ path: out, clip: { x: 0, y: a.y - 4, width: 390, height: b.y + b.height - a.y + 8 }, captureBeyondViewport: true });
  console.log('SHOT ' + path.relative(ici, out));
  await page.close();
}
await browser.close();
