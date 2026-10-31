// Captures de la série z (v0, 31.10) : 1280 px pour chaque concept, et l'état « un point réglé » à 390 px.
// Usage : node work/missions/2026-10-31-ecran-depense/v0/z1/capturer-z.mjs [z1 z2 …]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const v0 = path.resolve(ici, '..');
const RACINE = path.resolve(v0, '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['z1', 'z2', 'z3', 'z4'];
// Le premier geste qui règle le premier point (TVA laissée vide), par concept.
const GESTE = { z1: '[data-tva=""]', z2: '[data-tva=""]', z3: '[data-tva=""]', z4: '[data-tva=""]' };

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
try {
  for (const id of ids) {
    const page = path.join(v0, id, 'etat.html');
    const url = `file:///${page.split(path.sep).join('/')}`;
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await p.goto(url, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(v0, id, `${id}-1280.png`) });
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.reload({ waitUntil: 'networkidle0' });
    const geste = GESTE[id];
    const ok = await p.evaluate((s) => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, geste);
    await new Promise((r) => setTimeout(r, 450));
    await p.screenshot({ path: path.join(v0, id, `${id}-regle.png`) });
    console.log(`${id} : 1280 et regle captures${ok ? '' : ' (geste introuvable)'}${erreurs.length ? ' ; erreurs : ' + erreurs.join(' | ') : ''}`);
    await p.close();
  }
} finally { await nav.close(); }
