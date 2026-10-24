// Données de la série sba (Substituer, « le geste d'abord »), tirées du moteur v4 et des fiches, rien d'inventé.
// Entrées : subst.json (calc.ts : substitutes() de Nugget 46 g dans la stout S1, à chaque moment) et houblons.json
// (calc2.ts : fiches des remplaçants), produits par vite-node dans os.tmpdir() ; grille simulée du lot 21
// (profils-simules.json, US-05, 2 g/L) ; ma bière et la bande du style 16D (écran Dryhopper de la carte).
// Usage : node preparer.mjs <dossier des sorties de calc> ; écrit donnees.json à côté.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ici = path.dirname(fileURLToPath(import.meta.url));
const ECRAN = path.resolve(ici, '../../..');
const tmp = process.argv[2];
const sub = JSON.parse(fs.readFileSync(path.join(tmp, 'subst.json'), 'utf8'));
const hb = JSON.parse(fs.readFileSync(path.join(tmp, 'houblons.json'), 'utf8'));
const grille = JSON.parse(fs.readFileSync(path.join(ECRAN, 'fils21-choisir/donnees/profils-simules.json'), 'utf8')).grille;
const carte = fs.readFileSync(path.join(ECRAN, 'fils22-carte/dryhopper/etat.html'), 'utf8');
const X = new Function(carte.split('\n').find((l) => l.startsWith('var T = ')) + '; return { T, BA, AV, B };')();
const style = JSON.parse(fs.readFileSync(path.join(ECRAN, '../../../../prototypes/houblons-v4/data/style-bands.json'), 'utf8'));
const s16 = (style.styles || []).find?.((s) => s.code === '16D') || Object.values(style.families ? {} : style).find((s) => s && s.code === '16D');
const ANGLAIS = new Set(['white wine', 'fruity', 'grape', 'gooseberry', 'coffee', 'tabacco', 'lilac', 'oregano', 'dark fruit', 'vanilla', 'resiny', 'doux']);
const MOMENTS = ['b60', 'wp', 'dryPost'];
const garder = (s) => ({ key: s.key, name: s.name, score: s.score, palier: s.palier, comp: s.composantes, fiab: s.couverture.fiabilite,
  gagne: s.familles.gagne, perd: s.familles.perd, communes: s.familles.communes, dose: { g: s.dose.grams, min: s.dose.min, max: s.dose.max, regle: s.dose.regle },
  stock: s.stock, rang: s.rank, rangGeneral: s.rangGeneral ?? s.rank, amerDeconseille: s.amertumeDeconseillee, raison: s.raison });
const out = { moments: {}, houblons: {}, sim: {}, T: X.T, BA: X.BA, AV: X.AV, B: X.B };
const cles = new Set(['beermaverick-nugget']);
for (const m of MOMENTS) {
  const o = sub[m];
  const top = o.top.slice(0, 6).map(garder), stock = o.stock.slice(0, 5).map(garder);
  top.concat(stock).forEach((s) => cles.add(s.key));
  out.moments[m] = { contexte: o.contexte, poids: o.poids, ref: o.reference, candidats: o.candidats, top, stock };
}
for (const k of cles) {
  const h = hb[k];
  const vus = new Set();
  const sans = h.sansFamille.filter((w) => { const l = w.toLowerCase(); if (ANGLAIS.has(l) || vus.has(l)) return false; vus.add(l); return true; });
  out.houblons[k] = { name: h.name, alpha: h.alpha ? { v: +h.alpha.value.toFixed(2), min: h.alpha.min, max: h.alpha.max, lot: !/plage/.test(h.alpha.from), from: h.alpha.from } : null,
    plage: h.alphaPlage, beta: h.beta, role: h.role.value, stock: h.stock ? h.stock.g : null, origin: h.origin,
    familles: Object.fromEntries(Object.entries(h.familles).map(([f, x]) => [f, [x.level === 'marqué' ? 2 : x.level === 'cité' ? 1 : 0, x.n, x.of]])),
    mots: h.mots, sans, oils: h.oils, linalol: h.linalol };
}
for (const nom of ['Nelson Sauvin', 'Galaxy', 'Idaho 7', 'Cascade', 'Motueka']) {
  const k = Object.keys(out.houblons).find((c) => out.houblons[c].name === nom);
  if (!k) continue;
  out.sim[k] = {};
  for (const m of MOMENTS) {
    const e = grille.find((x) => x.nom === nom && x.moment === m && x.dose_gL === 2 && x.levure === 'fermentis-us05' && (m !== 'dryPost' || x.jours === 3));
    if (e) out.sim[k][m] = { d: e.delta, conf: e.confiance };
  }
}
out.style = { code: '16D', nom: 'Foreign Extra Stout', ibu: [50, 70], attendues: ['floral', 'herbal', 'earthy'] };
fs.writeFileSync(path.join(ici, 'donnees.json'), JSON.stringify(out));
console.log('donnees.json :', Object.keys(out.houblons).length, 'houblons ;', MOMENTS.map((m) => m + ' ' + out.moments[m].top.length + '+' + out.moments[m].stock.length).join(', '), '; simulés', Object.keys(out.sim).length);
