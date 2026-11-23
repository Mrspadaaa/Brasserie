// Captures de r6n1 à 390 px : premier écran, page entière, toucher (Preuve + Défi + Tire 20), fiche (appui long),
// et des états utiles (critère agrumes, Nelson Sauvin ajouté, absolu, légende).
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/captures.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const URL = pathToFileURL(path.join(ICI, 'etat.html')).href, CAP = path.join(ICI, '../captures');
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const erreurs = [];
const ouvrir = async (q = '', h = 844) => {
  const p = await b.newPage();
  p.on('pageerror', (e) => erreurs.push(q + ' : ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') erreurs.push(q + ' : ' + m.text()); });
  await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(URL + q, { waitUntil: 'networkidle0' }); await attendre(400); return p;
};
const cap = (n) => path.join(CAP, 'r6n1-' + n + '.png');
let p = await ouvrir();
await p.screenshot({ path: cap('premier-ecran') });
await p.screenshot({ path: cap('390'), fullPage: true });
// appui long sur Cascade : la vraie fiche
const h = await p.$('[data-houblon="Cascade"]');
const t = await h.touchStart(); await attendre(700); await t.end(); await attendre(500);
await p.screenshot({ path: cap('fiche-390') });
await p.close();
// un toucher sur chaque bouton d'action : Défi, Tire 20, puis Preuve (chimie et vraies valeurs)
p = await ouvrir();
await (await p.$('[aria-controls="r6n1-defi"]')).tap(); await attendre(250);
await (await p.$('#r6n1-tire')).tap(); await attendre(250);
await p.evaluate(() => window.scrollTo(0, 330)); await attendre(200);
await p.screenshot({ path: cap('toucher-390') });
await (await p.$('#r6n1-preuve')).tap(); await attendre(300);
await p.evaluate(() => document.querySelector('#r6n1-vraies').scrollIntoView({ block: 'start' }));
await attendre(200);
await p.screenshot({ path: cap('preuve-390') });
await p.close();
// la pastille de critère ouverte, puis agrumes choisi
p = await ouvrir();
await (await p.$('.r6n1-crit-b')).tap(); await attendre(250);
await p.screenshot({ path: cap('critere-390'), clip: { x: 0, y: 0, width: 390, height: 420 } });
await (await p.$('.r6n1-crit-o[data-crit="citrus"]')).tap(); await attendre(350);
await p.screenshot({ path: cap('agrumes-390') });
await p.close();
// « + » : Nelson Sauvin en quatrième colonne
p = await ouvrir();
await (await p.$('.r6n1-plus')).tap(); await attendre(250);
await (await p.$('.r6n1-aj-o')).tap(); await attendre(350);
await p.screenshot({ path: cap('nelson-390') });
await p.close();
// absolu, Galaxy en avant
p = await ouvrir('?sel=Galaxy');
await (await p.$('[data-e="absolu"]')).tap(); await attendre(400);
await p.screenshot({ path: cap('absolu-galaxy-390') });
await p.close();
p = await ouvrir('?legende');
await p.screenshot({ path: cap('legende-390') });
await p.close();
await b.close();
if (erreurs.length) { console.log('ERREURS'); for (const e of erreurs) console.log('  ' + e); process.exit(1); }
console.log('CAPTURES r6n1 OK');
