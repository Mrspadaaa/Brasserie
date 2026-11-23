// D84 (19.10, soir) : une voie ne prend pas trop de place. Les mots du brasseur, sur l5 Tuiles du lot
// 18 : « Un poil gros et épaisy prends trop de place ». Règle, sur la page des voies à 390 × 844 :
//   P1 au moins 5 voies ([data-voie], numéros distincts) entièrement visibles au premier écran ;
//   P2 la hauteur médiane d'une voie visible ne dépasse pas 90 px (mesuré le 19.10 : l5 121 px et 4 voies ; q2b 77 px et 6 voies ; l8, dont il aime la disposition, 50 px et 7 voies).
// Usage : node controle-place-voies.mjs <dossier> [ids…] [--page=etat-b.html] [--voies=5] [--haut=90] ;
// imprime PLACE OK, ou PLACE ECHEC et la liste (avec les mesures de chaque page).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = opt('page', 'etat-b.html'), MIN = +opt('voies', 5), HAUT = +opt('haut', 90);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    // La voie la plus extérieure par numéro (une voie peut contenir des sous-éléments data-voie).
    const vs = [...document.querySelectorAll('[data-voie]')].filter((e) => vis(e) && !e.parentElement.closest('[data-voie="' + e.dataset.voie + '"]'));
    const hs = vs.map((e) => e.getBoundingClientRect().height).sort((a, b) => a - b);
    const entieres = new Set(vs.filter((e) => { const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; }).map((e) => e.dataset.voie));
    return { n: entieres.size, mediane: hs.length ? Math.round(hs[Math.floor(hs.length / 2)]) : 0, total: new Set(vs.map((e) => e.dataset.voie)).size };
  });
  await page.close();
  if (r.n < MIN) problems.push(id + ' ' + pg + ' : P1, ' + r.n + ' voie(s) entières au premier écran (' + MIN + ' au moins)');
  if (r.mediane > HAUT) problems.push(id + ' ' + pg + ' : P2, voie de ' + r.mediane + ' px en médiane (' + HAUT + ' au plus)');
  console.log(id + ' · ' + r.n + ' voies au premier écran · médiane ' + r.mediane + ' px · ' + r.total + ' voies');
}
await browser.close();
if (problems.length) { console.log('PLACE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('PLACE OK');
