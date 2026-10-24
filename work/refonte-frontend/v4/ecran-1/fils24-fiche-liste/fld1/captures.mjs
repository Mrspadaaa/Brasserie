// Captures de la série d : node captures.mjs fld1[:Nelson Sauvin] fld2[:Motueka] …
// Pour chaque concept : <id>-premier-ecran.png (390 × 844), <id>-page.png (page entière), et, si un autre houblon
// est donné, <id>-<houblon>.png (son premier écran) ; <id>-fiche.png : la fiche courte ouverte par l'appui long.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lot = path.join(ici, '..');
const out = path.join(lot, 'captures');
fs.mkdirSync(out, { recursive: true });
const slug = (n) => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const arg of process.argv.slice(2)) {
  const [id, autre, etat] = arg.split(':');
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const url = pathToFileURL(path.join(lot, id, 'etat.html')).href;
  await p.goto(url, { waitUntil: 'networkidle0' }); await wait(250);
  await p.screenshot({ path: path.join(out, id + '-premier-ecran.png') });
  await p.screenshot({ path: path.join(out, id + '-page.png'), fullPage: true });
  // L'appui long sur le nom ouvre la fiche courte.
  const n = await p.$('[data-appui]'); const bb = await n.boundingBox();
  await p.touchscreen.touchStart(bb.x + 10, bb.y + bb.height / 2); await wait(650); await p.touchscreen.touchEnd(); await wait(300);
  await p.screenshot({ path: path.join(out, id + '-fiche.png') });
  if (etat === 'absolu') {
    await p.goto(url, { waitUntil: 'networkidle0' }); await wait(200);
    await p.click('[data-e="absolu"]'); await wait(300);
    await p.screenshot({ path: path.join(out, id + '-absolu.png') });
  }
  if (autre) {
    await p.goto(pathToFileURL(path.join(lot, id, 'h-' + slug(autre) + '.html')).href, { waitUntil: 'networkidle0' }); await wait(250);
    await p.screenshot({ path: path.join(out, id + '-' + slug(autre) + '.png') });
    await p.screenshot({ path: path.join(out, id + '-' + slug(autre) + '-page.png'), fullPage: true });
  }
  await p.close();
  console.log(id + ' capturé');
}
await b.close();
