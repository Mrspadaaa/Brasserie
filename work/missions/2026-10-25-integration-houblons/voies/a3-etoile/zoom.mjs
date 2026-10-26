#!/usr/bin/env node
// Capture de la zone du ★ (recadrage large, au-dessus du svg compris). Usage : node zoom.mjs <dossier construit> <préfixe de sortie>
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';

const dossier = path.resolve(process.argv[2]);
const sortie = path.resolve(process.argv[3]);
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [nom, w, h, mob] of [['390', 390, 844, true], ['1280', 1280, 800, false]]) {
  const page = await nav.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mob, hasTouch: mob, deviceScaleFactor: 3 });
  await page.goto(pathToFileURL(path.join(dossier, 'dryhopper', 'etat.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.pq-dry-svg');
  await new Promise((r) => setTimeout(r, 600));
  await (await page.$('.pq-dry-svg')).evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 300));
  const b = await page.evaluate(() => { const e = document.querySelector('.pq-dry-etoile').getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 }; });
  const L = mob ? 90 : 120;
  await page.screenshot({ path: `${sortie}-${nom}.png`, clip: { x: Math.max(0, b.x - L), y: Math.max(0, b.y - 40), width: 2 * L, height: 110 } });
  await page.close();
}
await nav.close();
console.log('ZOOM OK');
