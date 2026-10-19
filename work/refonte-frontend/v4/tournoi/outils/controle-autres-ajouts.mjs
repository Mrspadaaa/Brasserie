// D76 (19.10, soir) : ce qu'une voie ajoute d'autre se voit. Les mots du brasseur, sur s5 (lot 14) :
//   « l'autre limitation, c'est que on voit pas quels sont les autre ajouts, alors oui par nelson
//   sauving agumente un peu le floral mais on voit pas ce qu'il ajoute en plus... c'est pas vraiment
//   non plus idéal » ; « le seul procédé qui permet de fixer ça. Tu en as peut être un autre, ça serait
//   le top, mais ça serait d'amener à ensuite l'onglet comparaison. on selectionne plusieurs houbon et
//   ensuite on peut comparer ».
// Règle, pour chaque voie montrée ([data-voie] visible ; numéro = place dans la liste du cas, 1 pour
// la première) :
//   A1 au moins une de ses apparitions montre chaque famille hors objectifs que la voie fait bouger
//      ([data-role="extra"][data-famille] visible dedans) : apport établi, 0,5 point au moins ;
//   A2 aucune famille montrée en plus n'est inventée (absente des apports établis de la voie).
// --via-comparer : la page des voies offre le choix ([data-role="choisir"], deux au moins) et le
// passage à Comparer ([data-role="comparer"]) ; A1 et A2 se contrôlent alors sur comparer.html.
// Le cas : <html data-cas="c1"> (donnees/c1.json du lot 15) ; sans data-cas, S1 de pack-mini-protos
// (le lot 14, témoin).
// Usage : node controle-autres-ajouts.mjs <dossier> [ids…] [--pages=etat-b.html] [--via-comparer]
//         [--donnees=<dossier des cas>]
// Imprime AUTRES OK, ou AUTRES ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const viaComparer = args.includes('--via-comparer');
const pages = (opt('pages') || 'etat-b.html').split(',');
const donnees = path.resolve(opt('donnees') || path.join(ici, '../../ecran-1/fils15-s5-complexe/donnees'));
const PACK = JSON.parse(fs.readFileSync(path.join(ici, '../../../../../prototypes/houblons-v4/data/pack-mini-protos.json'), 'utf8'));
const SEUIL = 0.5;

// Familles hors objectifs que chaque voie fait bouger, par numéro de voie (1 = la première).
function attendus(cas) {
  if (!cas) {
    const s = PACK.scenarios.S1, vis = new Set(s.direction.map((d) => d.family));
    return s.voies.map((v) => Object.entries(v.effect).filter(([f, e]) => !vis.has(f) && e.established && e.central != null && Math.abs(e.central) >= SEUIL).map(([f]) => f));
  }
  const d = JSON.parse(fs.readFileSync(path.join(donnees, cas + '.json'), 'utf8'));
  return d.voies.map((v) => v.tout.filter((t) => !t.visee && Math.abs(t.effet) >= SEUIL).map((t) => t.famille));
}

const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => pages.some((p) => fs.existsSync(path.join(dir, d, p))))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const lire = async (f) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0; };
    const cas = document.documentElement.dataset.cas || document.body.dataset.cas || null;
    const voies = [...document.querySelectorAll('[data-voie]')].filter(vis).map((e) => ({ n: e.dataset.voie,
      extras: [...e.querySelectorAll('[data-role="extra"][data-famille]')].filter(vis).map((x) => x.dataset.famille) }));
    return { cas, voies, choisir: [...document.querySelectorAll('[data-role="choisir"]')].filter(vis).length, comparer: [...document.querySelectorAll('[data-role="comparer"]')].filter(vis).length };
  });
  await page.close();
  return r;
};
const verifier = (id, pg, r) => {
  const p = (m) => problems.push(id + ' ' + pg + ' : ' + m);
  const att = attendus(r.cas);
  if (!r.voies.length) { p('aucune voie visible ([data-voie])'); return; }
  const parVoie = new Map();
  for (const v of r.voies) parVoie.set(v.n, [...(parVoie.get(v.n) || []), v.extras]);
  for (const [n, occ] of parVoie) {
    const a = att[+n - 1];
    if (!a) { p('voie ' + n + ' absente du cas ' + (r.cas || 'S1')); continue; }
    const vus = new Set(occ.flat());
    const meilleure = occ.reduce((m, e) => (a.filter((f) => e.includes(f)).length > a.filter((f) => m.includes(f)).length ? e : m), occ[0]);
    const manque = a.filter((f) => !meilleure.includes(f));
    if (manque.length) p('A1, voie ' + n + ' : ' + manque.join(', ') + ' non montré(s)');
    const invente = [...vus].filter((f) => !a.includes(f));
    if (invente.length) p('A2, voie ' + n + ' : ' + invente.join(', ') + ' montré(s) sans apport établi');
  }
};
for (const id of ids) {
  if (viaComparer) {
    const f = path.join(dir, id, pages[0]), c = path.join(dir, id, 'comparer.html');
    if (!fs.existsSync(f)) continue;
    const r = await lire(f);
    if (r.choisir < 2) problems.push(id + ' ' + pages[0] + ' : moins de deux voies à choisir ([data-role="choisir"])');
    if (!r.comparer) problems.push(id + ' ' + pages[0] + ' : pas de passage à Comparer ([data-role="comparer"])');
    if (!fs.existsSync(c)) { problems.push(id + ' : comparer.html absent'); continue; }
    const rc = await lire(c);
    verifier(id, 'comparer.html', { ...rc, cas: rc.cas || r.cas });
    console.log(id + ' · choisir ' + r.choisir + ', comparer ' + r.comparer + ' · comparer.html ' + rc.voies.length + ' voie(s)');
    continue;
  }
  for (const pg of pages) {
    const f = path.join(dir, id, pg);
    if (!fs.existsSync(f)) continue;
    const r = await lire(f);
    verifier(id, pg, r);
    console.log(id + ' ' + pg + ' · cas ' + (r.cas || 'S1') + ' · ' + new Set(r.voies.map((v) => v.n)).size + ' voie(s), ' + r.voies.filter((v) => v.extras.length).length + ' avec extras');
  }
}
await browser.close();
if (problems.length) { console.log('AUTRES ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('AUTRES OK');
