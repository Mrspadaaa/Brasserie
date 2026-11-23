// Captures de r6p2 à 390 px : page entière, premier écran, un toucher (Défi), fiche (appui long), et chaque
// feuille du dock, la pastille ouverte, la quatrième colonne, la légende.
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/captures.mjs
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
  await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(URL + q, { waitUntil: 'networkidle0' }); await attendre(400); return p;
};
const cap = async (p, nom, o = {}) => { await p.screenshot({ path: path.join(CAP, 'r6p2-' + nom + '.png'), ...o }); };
let p = await ouvrir();
await cap(p, 'premier-ecran');
await cap(p, '390', { fullPage: true });
// appui long sur Idaho 7
const h = await p.$('[data-houblon="Idaho 7"]');
const t = await h.touchStart(); await attendre(700); await t.end(); await attendre(500);
await cap(p, 'fiche-390');
await p.close();
// le geste de r6p2 : toucher la colonne de Cascade, puis celle de Galaxy ; la ligne du pourquoi écrit leur perte contre ★
p = await ouvrir();
await (await p.$('.r6p2-tetes [data-col="Cascade"]')).tap(); await attendre(400);
await cap(p, 'toucher-390');
await (await p.$('.r6p2-tetes [data-col="Galaxy"]')).tap(); await attendre(400);
await cap(p, 'galaxy-390');
await p.close();
// un toucher du dock : Défi, joué au doigt
p = await ouvrir('', 1400);
await (await p.$('[aria-controls="r6p2-f-defi"]')).tap(); await attendre(400);
await cap(p, 'defi-390');
await p.close();
for (const [q, nom, hh] of [['?ouvre=valeurs', 'valeurs-390', 1800], ['?ouvre=preuve', 'preuve-390', 1500], ['?ouvre=egaler', 'egaler-390', 1100], ['?ouvre=frise', 'frise-390', 1100], ['?ouvre=souche', 'souche-390', 1100],
  ['?ouvre=pq', 'pourquoi-390', 844], ['?liste', 'critere-390', 844], ['?crit=2', 'tropicaux-390', 844], ['?crit=3', 'resineux-390', 844], ['?crit=3&sel=Galaxy', 'resineux-galaxy-390', 844], ['?crit=3&n4', 'resineux-quatre-390', 844], ['?crit=1', 'agrumes-390', 844], ['?crit=1&sel=Idaho 7', 'agrumes-idaho-390', 844], ['?n4', 'quatre-390', 844], ['?n4&sel=Nelson Sauvin', 'quatre-nelson-390', 844], ['?ouvre=ajout', 'ajout-390', 844], ['?legende', 'legende-390', 844]]) {
  p = await ouvrir(q, hh); await cap(p, nom); await p.close();
}
p = await ouvrir('?sel=Galaxy');
await (await p.$('[data-e="absolu"]')).tap(); await attendre(400);
await cap(p, 'absolu-galaxy-390');
await p.close();
await b.close();
console.log(erreurs.length ? 'ERREURS\n' + erreurs.join('\n') : 'CAPTURES r6p2 OK');
