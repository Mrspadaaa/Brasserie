#!/usr/bin/env node
// p3c (D245) : la liste de p3a-3, plus compacte ; tout le reste au pixel près.
// node work/missions/2026-10-31-ecran-depense/v3/p3c-outils/controle-compact.mjs <id…>   (id = p3c-1, p3c-2, p3c-3 ; témoin : p3a-3)
// Pour chaque id, à 390 × 844 tactile (isMobile, hasTouch), réseau externe coupé (mêmes polices de repli pour tous) :
//  - a (lignes entières au premier écran) et b (liste défilée) : la mesure de ../p3a-1/lignes-commun.mjs ; a > 12 et b > 17 (p3a-3) ;
//  - la hauteur médiane d'une ligne de facture (li[data-ligne], ?etat=repos, ordre par catégorie) < celle de p3a-3, mesurée à l'instant ;
//  - INCHANGE : la zone au-dessus de la première bande de groupe, à ?etat=repos, identique à p3a-3 (0,5 % de pixels différents au plus),
//    et la bande au même endroit ;
//  - aucun en-tête de colonnes (« qté », « prix », « CHF » seuls, dans la liste, avant la première ligne).
// Sortie : une ligne par id (a, b, médiane, inchangé, en-tête), puis COMPACT OK ou COMPACT ECHEC — <raison>.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { compterMaquette } from '../p3a-1/lignes-commun.mjs';

const V3 = path.resolve(import.meta.dirname, '..');
const RACINE = path.resolve(V3, '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const REF = 'p3a-3';
const REF_A = 12, REF_B = 17;
const ids = process.argv.slice(2);
if (!ids.length) { console.log('usage : controle-compact.mjs <id…>'); process.exit(2); }
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (id, etat) => 'file:///' + path.join(V3, id, 'etat.html').replace(/\\/g, '/') + `?etat=${etat}`;

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
async function ouvrir(id) {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/^(file:|data:|blob:|about:)/.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  await p.goto(url(id, 'repos'), { waitUntil: 'load' });
  await p.waitForSelector('[data-ligne]');
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await dormir(300);
  return p;
}
async function mesurerRepos(id) {
  const p = await ouvrir(id);
  const m = await p.evaluate(() => {
    const hs = [...document.querySelectorAll('li[data-ligne]')].map((e) => e.getBoundingClientRect().height).sort((x, y) => x - y);
    const med = hs.length ? (hs.length % 2 ? hs[(hs.length - 1) / 2] : (hs[hs.length / 2 - 1] + hs[hs.length / 2]) / 2) : NaN;
    const gh = document.querySelector('[data-groupe] .p3a3-gh, [data-groupe] [class$="-gh"]');
    const haut = gh ? Math.floor(gh.getBoundingClientRect().top) : NaN;
    // en-tête de colonnes : un texte seul « qté », « prix » ou « CHF » dans la liste, au-dessus de la première ligne
    const liste = document.getElementById('p3a3-liste') || document.querySelector('[data-booster="liste"]');
    const l1 = document.querySelector('[data-ligne]').getBoundingClientRect().top;
    const entetes = liste ? [...liste.querySelectorAll('*')].filter((e) => {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return !e.children.length && r.height > 2 && r.bottom <= l1 + 1 && s.visibility !== 'hidden' && /^(qté|qte|prix|chf)$/i.test(e.textContent.trim());
    }).map((e) => e.textContent.trim()) : [];
    return { med, n: hs.length, haut, entetes };
  });
  const img = m.haut > 0 ? await p.screenshot({ encoding: 'base64', clip: { x: 0, y: 0, width: 390, height: m.haut } }) : null;
  await p.close();
  return { ...m, img };
}
async function comparer(b64a, b64b) {
  const p = await nav.newPage();
  const r = await p.evaluate(async (a, b) => {
    const charger = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([charger(a), charger(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { part: 1, taille: `${ia.width}×${ia.height} ≠ ${ib.width}×${ib.height}` };
    const lire = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
    const da = lire(ia), db = lire(ib); let d = 0;
    for (let k = 0; k < da.length; k += 4) if (Math.abs(da[k] - db[k]) + Math.abs(da[k + 1] - db[k + 1]) + Math.abs(da[k + 2] - db[k + 2]) > 24) d++;
    return { part: d / (da.length / 4) };
  }, b64a, b64b);
  await p.close();
  return r;
}

let echecs = [];
try {
  const ref = await mesurerRepos(REF);
  console.log(`référence ${REF} : a=${REF_A} b=${REF_B} médiane=${ref.med.toFixed(1)} px (${ref.n} lignes) ; première bande à y=${ref.haut}`);
  for (const id of ids) {
    if (!fs.existsSync(path.join(V3, id, 'etat.html'))) { console.log(`${id} : etat.html absent`); echecs.push(`${id} absent`); continue; }
    const c = await compterMaquette(path.join(V3, id, 'etat.html'));
    const m = await mesurerRepos(id);
    const raisons = [];
    if (!(c.a > REF_A)) raisons.push(`a=${c.a} ≤ ${REF_A}`);
    if (!(c.b > REF_B)) raisons.push(`b=${c.b} ≤ ${REF_B}`);
    if (!(m.med < ref.med)) raisons.push(`médiane ${m.med.toFixed(1)} ≥ ${ref.med.toFixed(1)}`);
    let inch = 'non mesuré';
    if (m.haut !== ref.haut) { inch = `bande à y=${m.haut} ≠ ${ref.haut}`; raisons.push('INCHANGE : ' + inch); }
    else { const d = await comparer(ref.img, m.img); inch = d.taille ? d.taille : `${(d.part * 100).toFixed(2)} % de pixels différents`; if (d.taille || d.part > 0.005) raisons.push('INCHANGE : ' + inch); }
    if (m.entetes.length) raisons.push('en-tête de colonnes : ' + m.entetes.join(', '));
    console.log(`${id} : a=${c.a} b=${c.b} médiane=${m.med.toFixed(1)} px (${m.n} lignes, total ${c.total}) ; au-dessus de la liste : ${inch} ; en-tête de colonnes : ${m.entetes.length ? m.entetes.join(', ') : 'aucun'}${raisons.length ? ' → ' + raisons.join(' ; ') : ''}`);
    if (raisons.length) echecs.push(`${id} : ${raisons.join(' ; ')}`);
  }
} finally { await nav.close(); }
console.log(echecs.length ? `COMPACT ECHEC — ${echecs.join(' | ')}` : `COMPACT OK (${ids.length})`);
process.exit(echecs.length ? 1 : 0);
