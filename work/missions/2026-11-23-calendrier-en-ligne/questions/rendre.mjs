// Rend chaque [data-m] de maquettes.html en PNG (img/<id>.png), au double de la résolution du téléphone.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const erreurs = [];
try {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(e.message));
  await p.setViewport({ width: 420, height: 900, deviceScaleFactor: 2 });
  await p.goto('file:///' + path.join(ICI, 'maquettes.html').split(path.sep).join('/'), { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(ICI, 'img'), { recursive: true });
  const ids = await p.$$eval('[data-m]', (els) => els.map((e) => e.dataset.m));
  for (const id of ids) {
    const el = await p.$(`[data-m="${id}"]`);
    await el.screenshot({ path: path.join(ICI, 'img', `${id}.png`) });
  }
  console.log(`${ids.length} images : ${ids.join(', ')}`);
} finally { await nav.close(); }
if (erreurs.length) { console.log('ERREURS', erreurs); process.exit(1); }
