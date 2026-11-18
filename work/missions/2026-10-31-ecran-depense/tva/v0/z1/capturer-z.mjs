// Captures de la série z (vue TVA, v0, 01.11) : les sept états à 390 × 844, l'état « annee » à 1280 × 800.
// Usage : node work/missions/2026-10-31-ecran-depense/tva/v0/z1/capturer-z.mjs [z1 z2 …]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const v0 = path.resolve(ici, '..');
const RACINE = path.resolve(v0, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['z1', 'z2', 'z3', 'z4'];
const ETATS = ['annee', 'inconnues', 'douteuse', 'etrangere', 'vide', 'si', 'horsligne'];

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
try {
  for (const id of ids) {
    const page = path.join(v0, id, 'etat.html');
    const url = `file:///${page.split(path.sep).join('/')}`;
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await p.goto(url + '?etat=annee', { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(v0, id, `${id}-1280.png`) });
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    for (const e of ETATS) {
      await p.goto(url + '?etat=' + e, { waitUntil: 'networkidle0' });
      await p.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 200));
      await p.screenshot({ path: path.join(v0, id, `${id}-${e}.png`) });
    }
    console.log(`${id} : 1280 et ${ETATS.length} états captures${erreurs.length ? ' ; erreurs : ' + erreurs.join(' | ') : ''}`);
    await p.close();
  }
} finally { await nav.close(); }
