// Captures de r2b (passe 2, Nouvelle dépense) : les états ?etat=… à 390 et à 1280, puis les gestes.
// Usage : node work/missions/2026-10-31-ecran-depense/v1/r2b/capturer.mjs
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'file:///' + path.join(ICI, 'etat.html').replace(/\\/g, '/');
const ETATS = ['1', '2', '3', '4', '4b', '5', '6', '7', '7b', '8', '9'];
// [nom, état, expression jouée, sélecteur à centrer ou null, attente ms]
const GESTES = [
  ['preuve', '3', "document.querySelector('#r2b-pbtn').click()", null],
  ['tva-ouverte', '3', "document.querySelector('#r2b-ttva').click()", '#r2b-ptva'],
  ['paye-ouvert', '3', "document.querySelector('#r2b-tpay').click()", '#r2b-ppay'],
  ['chip-target', '3', "document.querySelector('[data-va=\"p4\"]').click()", '.r2b-li[data-n="8"]', 900],
  ['chip-mouture', '3', "document.querySelector('[data-va=\"p3\"]').click()", '.r2b-plat', 900],
  ['moutures-rattachees', '3', "document.querySelector('[data-tous]').click()", '.r2b-li[data-n="1"]'],
  ['sabro-unite', '3', "document.querySelector('[data-u=\"g\"]').click()", '.r2b-li[data-n="20"]'],
  ['ligne-ouverte', '3', 'window.r2bOuvrir(1)', '.r2b-plat'],
  ['enregistre-points-laisses', '3', "document.querySelector('#r2b-go').click()", null, 2200],
];
const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const p = await navigateur.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e)));
const charger = async (url, w, h, mobile) => {
  await p.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 250));
};
const ecrire = (nom) => path.join(ICI, `r2b-${nom}.png`);
await charger(BASE, 390, 844, true);
await p.screenshot({ path: ecrire('repos') });
await p.screenshot({ path: ecrire('page'), fullPage: true });
for (const e of ETATS) {
  await charger(`${BASE}?etat=${e}`, 390, 844, true);
  await p.screenshot({ path: ecrire(`etat${e}-390`) });
  await charger(`${BASE}?etat=${e}`, 1280, 800, false);
  await p.screenshot({ path: ecrire(`etat${e}-1280`) });
}
for (const [nom, e, js, cible, attente] of GESTES) {
  await charger(`${BASE}?etat=${e}`, 390, 844, true);
  await p.evaluate(js);
  await new Promise((r) => setTimeout(r, attente || 400));
  if (cible) await p.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: 'center' }); }, cible);
  await new Promise((r) => setTimeout(r, 300));
  await p.screenshot({ path: ecrire(nom) });
}
await charger(BASE, 1280, 800, false);
await p.screenshot({ path: ecrire('1280') });
await p.evaluate(() => document.querySelector('#r2b-annexe').scrollIntoView());
await new Promise((r) => setTimeout(r, 200));
await p.screenshot({ path: ecrire('1280-annexe') });
console.log(`r2b : captures écrites${erreurs.length ? ' · ERREURS ' + erreurs.join(' | ') : ' · 0 erreur de script'}`);
await navigateur.close();
