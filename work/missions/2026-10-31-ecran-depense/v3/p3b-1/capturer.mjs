#!/usr/bin/env node
// Captures d'une variante p3b (passe 3, Nouvelle dépense) : chaque ?etat= à 390 × 844 tactile, le repos et l'échec à 1280,
// la page entière au repos. Usage : node work/missions/2026-10-31-ecran-depense/v3/<id>/capturer.mjs
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const ID = path.basename(ICI);
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = pathToFileURL(path.join(ICI, 'etat.html')).href;
const ETATS = ['repos', 'defile', 'renvoi', 'regle', 'tous', 'papier', 'envoi', 'reussi', 'echec', 'rouverte', 'lecture', 'horsligne'];
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const p = await nav.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e)));
const charger = async (etat, w, h) => {
  await p.setViewport({ width: w, height: h, isMobile: w < 600, hasTouch: w < 600, deviceScaleFactor: 1 });
  await p.goto(`${BASE}?etat=${etat}`, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 450));
};
for (const e of ETATS) {
  await charger(e, 390, 844);
  await p.screenshot({ path: path.join(ICI, `${ID}-${e}.png`) });
}
await charger('repos', 390, 844);
await p.screenshot({ path: path.join(ICI, `${ID}-page.png`), fullPage: true });
for (const e of ['repos', 'echec', 'renvoi']) {
  await charger(e, 1280, 800);
  await p.screenshot({ path: path.join(ICI, `${ID}-1280-${e}.png`) });
}
await nav.close();
console.log(erreurs.length ? 'CAPTURES ECHEC ' + erreurs.join(' | ') : `CAPTURES OK ${ETATS.length + 4} (${ID})`);
process.exit(erreurs.length ? 1 : 0);
