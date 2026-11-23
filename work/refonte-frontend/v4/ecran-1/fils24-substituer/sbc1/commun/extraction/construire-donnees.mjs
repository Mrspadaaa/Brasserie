// Série c (Substituer, lot D125) : assemble donnees-sbc.json depuis les deux sorties du moteur v4.
//   extraire.ts : substitutes('beermaverick-nugget', 46 g, recette S1, style 16D) à 60′, 15′, whirlpool, actif,
//                 et hopSheet() de chaque houblon nommé (vraies valeurs et sources) ;
//   biere.ts    : lireBiere() du parcours (la maquette jouable) : ma stout après le remplacement, à 60′ et au whirlpool.
// Lancement (depuis prototypes/houblons-v4) :
//   npx vite-node --root C:/Users/mrspa <ce dossier>/extraire.ts <tmp>/donnees.json
//   npx vite-node --root C:/Users/mrspa <ce dossier>/biere.ts <tmp>/biere.json
//   node construire-donnees.mjs <tmp>/donnees.json <tmp>/biere.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const [fd, fb] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(fd, 'utf8')), BI = JSON.parse(fs.readFileSync(fb, 'utf8'));
const k = (n) => 'beermaverick-' + n;
const NOMS = ['nugget', 'magnat', 'yeoman', 'altus', 'trident', 'zenia', 'nelson-sauvin', 'galaxy', 'sabro', 'idaho-7', 'target', 'cascade', 'falconers-flight'];
const hops = {};
for (const n of NOMS) {
  const f = D.fiches[k(n)]; if (!f) { console.log('pas de fiche', n); continue; }
  const comp = (f.huiles && f.huiles.composants) || {};
  hops[f.name] = {
    key: f.key, nom: f.name, origine: f.origin || null,
    alpha: f.alpha, beta: f.beta, huile: (f.huiles && f.huiles.totale) || null,
    composants: Object.fromEntries(['myrcene', 'humulene', 'caryophyllene', 'linalool'].map((c) => [c, comp[c] || null])),
    aromes: f.aromes, sans: f.motsSansFamille || [], desc: f.descripteurs || null, usage: f.usage, usageRaison: f.usageRaison || null,
    role: f.role, stock: f.stock ? f.stock.grams : 0,
  };
}
const sub = (s) => s && { rang: s.rank, score: s.score, palier: s.palier, composantes: s.composantes, couverture: s.couverture, gagne: (s.familles || {}).gagne || s.gagne, perd: (s.familles || {}).perd || s.perd, communes: (s.familles || {}).communes || [], dose: s.dose, stock: s.stock, conflits: s.conflitsStyle || [], deconseille: s.amertumeDeconseillee || null, raison: s.raison };
const moments = {};
for (const m of ['b60', 'wp']) {
  const o = D.moments[m], par = {};
  for (const s of [...o.top, ...o.enStock]) par[s.name] = sub(s);
  for (const [kk, s] of Object.entries(D.suivis[m])) if (kk[0] !== '_' && s) { const nom = D.hops[kk].name; if (!par[nom]) par[nom] = sub(s); }
  moments[m] = { contexte: o.contexte, poids: o.poids, reference: o.reference, candidats: o.candidats, manque: o.manque, top: o.top.map((s) => s.name), enStock: o.enStock.map((s) => s.name), par };
}
const prof = (x) => Object.fromEntries(Object.entries(x.profil).map(([f, v]) => [f, { v: v.valeur, bande: v.bande, hors: v.horsStyle, statut: v.statut, raison: v.raison }]));
const biere = { b60: { avant: { ibu: BI.avant.ibu.valeur, profil: prof(BI.avant) }, apres: {} }, wp: { avant: { ibu: BI.wp.avant.ibu.valeur, profil: prof(BI.wp.avant) }, apres: {} } };
for (const [kk, x] of Object.entries(BI.apres)) biere.b60.apres[D.hops[kk].name] = { ibu: x.ibu.valeur, profil: prof(x) };
for (const [kk, x] of Object.entries(BI.wp)) if (kk !== 'avant') biere.wp.apres[D.hops[kk].name] = { ibu: x.ibu.valeur, grams: x.grams, profil: prof(x) };
const ici = path.dirname(fileURLToPath(import.meta.url));
const out = { source: 'moteur v4 (prototypes/houblons-v4/src/engine/substitution.ts, fiches.ts) et parcours (moteur/index.ts, lireBiere), ' + D.date.slice(0, 10), hops, moments, biere };
fs.writeFileSync(path.join(ici, '..', 'donnees-sbc.json'), JSON.stringify(out));
console.log('donnees-sbc.json', Object.keys(hops).length, 'houblons', Math.round(JSON.stringify(out).length / 1024), 'Ko');
