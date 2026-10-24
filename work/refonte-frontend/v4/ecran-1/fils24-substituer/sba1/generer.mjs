// Génère les huit concepts de la série sba : node sba1/generer.mjs [sba1 sba2 …] [--captures]
// Chaque concept est décrit dans sbaN/concept.mjs ; la page autonome va dans sbaN/etat.html ;
// captures à 390 × 844 (×2) dans ../captures : <id>-premier-ecran.png, <id>-page.png, et les états du concept.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page } from './socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const LOT = path.resolve(ici, '..');
const args = process.argv.slice(2);
const voulus = args.filter((a) => !a.startsWith('--'));
const ids = (voulus.length ? voulus : fs.readdirSync(LOT).filter((d) => /^sba\d$/.test(d) && fs.existsSync(path.join(LOT, d, 'concept.mjs')))).sort();
const concepts = {};
for (const id of ids) {
  const c = (await import(pathToFileURL(path.join(LOT, id, 'concept.mjs')).href + '?t=' + Date.now())).default;
  concepts[id] = c;
  fs.writeFileSync(path.join(LOT, id, 'etat.html'), page(c));
  console.log(id + ' · ' + c.chaleur + ' · ' + c.nom);
}
if (args.includes('--captures')) {
  const puppeteer = (await import('puppeteer-core')).default;
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const cap = path.join(LOT, 'captures');
  fs.mkdirSync(cap, { recursive: true });
  for (const id of ids) {
    const etats = [['premier-ecran', '', false], ['page', '', true], ...(concepts[id].etats || []).map((e) => [e[0], e[1], !!e[2]])];
    for (const [nom, req, plein] of etats) {
      const pg = await b.newPage();
      await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const erreurs = [];
      pg.on('pageerror', (x) => erreurs.push(String(x)));
      pg.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
      await pg.goto(pathToFileURL(path.join(LOT, id, 'etat.html')).href + req, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 500));
      await pg.screenshot({ path: path.join(cap, id + '-' + nom + '.png'), fullPage: plein });
      const larg = await pg.evaluate(() => document.documentElement.scrollWidth);
      console.log('  ' + id + '-' + nom + '.png' + (larg > 390 ? ' · DÉFILEMENT HORIZONTAL ' + larg : '') + (erreurs.length ? ' · ERREURS ' + erreurs.join(' | ') : ''));
      await pg.close();
    }
  }
  await b.close();
}
