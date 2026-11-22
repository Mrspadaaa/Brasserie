// Captures de la série u : chaque état (?etat=) à 390 × 844 (premier écran), plus l'année à 1280 × 800.
// Usage : node capturer.mjs <id> [id…]   (depuis n'importe où ; écrit dans tva/v0/<id>/captures/)
// Sortie : une ligne par capture, erreurs de console et débordement horizontal compris.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const v0 = path.resolve(ici, '..');
const RACINE = path.resolve(v0, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ETATS = ['annee', 'inconnues', 'douteuse', 'etrangere', 'vide', 'si', 'horsligne'];
const ids = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
let erreurs = 0;
for (const id of ids) {
  const dossier = path.join(v0, id, 'captures');
  fs.mkdirSync(dossier, { recursive: true });
  const url = pathToFileURL(path.join(v0, id, 'etat.html')).href;
  const cas = [...ETATS.map((e) => [e, 390, 844]), ['annee', 1280, 800]];
  for (const [e, w, h] of cas) {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', (x) => errs.push(String(x)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.setViewport({ width: w, height: h, deviceScaleFactor: w > 500 ? 1 : 2, isMobile: w < 500, hasTouch: w < 500 });
    await page.goto(url + '?etat=' + e, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 200));
    const deb = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const f = path.join(dossier, `${id}-${e}-${w}.png`);
    await page.screenshot({ path: f });
    if (w < 500) await page.screenshot({ path: path.join(dossier, `${id}-${e}-${w}-page.png`), fullPage: true });
    if (errs.length || deb > 0) erreurs++;
    console.log(`${id} ${e} ${w} : ${path.relative(RACINE, f).replace(/\\/g, '/')} · débordement ${deb} px · erreurs ${errs.length ? errs.join(' | ') : 0}`);
    await page.close();
  }
}
await browser.close();
console.log(erreurs ? `CAPTURES ECHEC ${erreurs}` : 'CAPTURES OK');
