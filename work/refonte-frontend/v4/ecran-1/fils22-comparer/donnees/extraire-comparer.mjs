// Extraction des entrées du lot 22 (Comparer, stout 16D) au contrat de voies/r6e-entrees/VOIE.md.
// Lit les profils versionnés (fils21-choisir), les fiches (pack-fiches), les composés, les panels
// (comparatifs-dryhop) ; écrit comparer-stout.json. Sans dépendance. Depuis la racine du dépôt :
//   node work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/extraire-comparer.mjs
// Le contrôle D102 (tournoi/outils/controle-entrees-lot22.mjs) recalcule la sortie.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const PROFILS = 'work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json';
const FICHES = 'prototypes/houblons-v4/data/pack-fiches.json';
const COMPOSES = 'prototypes/houblons-v4/data/composes-houblon.json';
const PANELS = 'work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/comparatifs-dryhop.json';
const SORTIE = 'work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json';

const lire = (p) => JSON.parse(fs.readFileSync(path.join(RACINE, p), 'utf8'));
const P = lire(PROFILS);
const F = lire(FICHES).fichesHoublons;
const C = lire(COMPOSES);
const D = lire(PANELS);

const NOMS = ['Cascade', 'Idaho 7', 'Galaxy', 'Nelson Sauvin'];
const US05 = 'fermentis-us05';
const GENERIQUES = ['fruité', 'fruity', 'noble', 'doux', 'mild', 'sucré', 'sweet'];
const GOOSEBERRY = ['gooseberry', 'groseille à maquereau'];
const r2 = (x) => Math.round(x * 100) / 100;
const r1 = (x) => Math.round(x * 10) / 10;
const norm = (s) => s.toLowerCase().replace(/\(.*\)/g, '').replace(/[-\s]+/g, ' ').trim();
// Mots rattachés : chaque mot de aromes[].mots[].mots (les sources ne comptent pas).
const motsRattaches = (aromes) => (aromes || []).reduce((s, a) => s + (a.mots || []).reduce((t, x) => t + (x.mots || []).length, 0), 0);
const fiche = (nom) => {
  const f = F.find((x) => x.name === nom);
  if (!f) throw new Error(`fiche absente : ${nom}`);
  return f;
};
const deltaDe = (key, fam, dose) => {
  const g = P.grille.find((x) => x.houblon === key && x.moment === 'dryPost' && x.dose_gL === dose && x.levure === US05 && x.jours === 3);
  const v = g?.delta?.[fam];
  if (v == null) throw new Error(`delta absent : ${key} ${fam} ${dose} g/L`);
  return v;
};
// Dose d'effet égal : interpolation linéaire entre (0,0) et les doses 1, 2, 4, 8 g/L ; premier segment qui encadre la cible.
const doseEffet = (key, fam, cible) => {
  const pts = [[0, 0], ...[1, 2, 4, 8].map((d) => [d, deltaDe(key, fam, d)])];
  for (let i = 1; i < pts.length; i++) {
    const [d0, v0] = pts[i - 1], [d1, v1] = pts[i];
    if (cible >= v0 && cible <= v1 && v1 > v0) return r1(d0 + ((cible - v0) / (v1 - v0)) * (d1 - d0));
  }
  return null;
};

const houblons = NOMS.map((nom) => {
  const f = fiche(nom);
  const sf = (f.motsSansFamille || []).length;
  const key = f.key;
  return {
    key,
    nom,
    alpha: f.alpha,
    beta: f.beta,
    role: f.role,
    usage: f.usage,
    huiles: f.huiles,
    aromes: f.aromes,
    motsSansFamille: f.motsSansFamille,
    ibuParGramme: f.ibuParGramme,
    partSansFamille: r2(sf / (motsRattaches(f.aromes) + sf)),
    composes: C.varietes[key] ?? null,
    grille: P.grille.filter((g) => g.houblon === key),
    panels: D.etudes.filter((e) => (e.varietes || []).some((v) => norm(v) === norm(nom))),
  };
});

// Effet égal : référence Cascade (citrus) et Galaxy (tropical) à 4 g/L.
const effetEgal = [['citrus', 'Cascade'], ['tropical', 'Galaxy']].map(([famille, ref]) => {
  const cible = deltaDe(fiche(ref).key, famille, 4);
  const doses = {};
  const horsGrille = [];
  for (const nom of NOMS) {
    const d = doseEffet(fiche(nom).key, famille, cible);
    doses[nom] = d;
    if (d === null) horsGrille.push(nom);
  }
  return { famille, reference: { nom: ref, dose_gL: 4 }, moment: 'dryPost', jours: 3, levure: US05, cible, doses, horsGrille };
});

const ibuEgal = [['b10', 10], ['wp', 5]].map(([moment, ibu]) => {
  const doses = {};
  for (const nom of NOMS) {
    const ipg = fiche(nom).ibuParGramme.moments.find((m) => m.code === moment)?.ibuPerGram?.value;
    doses[nom] = ipg ? r2(ibu / ipg / 20) : null;
  }
  return { moment, ibu, volumeL: 20, doses };
});

const A = { regle: 'gooseberry et « groseille à maquereau » rangés dans Petits fruits', mots: GOOSEBERRY, famille: 'berries', effets: {} };
for (const nom of NOMS) {
  const f = fiche(nom);
  const sansFamille = (f.motsSansFamille || []).map((x) => x.mot);
  const deplaces = sansFamille.filter((m) => GOOSEBERRY.includes(m.toLowerCase()));
  const sf = sansFamille.length;
  A.effets[nom] = { deplaces, partSansFamilleA: r2((sf - deplaces.length) / (motsRattaches(f.aromes) + sf)) };
}

const B = { generiques: GENERIQUES, seuil: 0.25, plafond: 0.33, aCorriger: 'proposés par le pilote, à corriger par le brasseur', parts: {} };
for (const nom of NOMS) {
  const f = fiche(nom);
  const gen = new Set(GENERIQUES);
  const concepts = [...new Set((f.motsSansFamille || []).map((x) => x.mot.toLowerCase()).filter((x) => !gen.has(x)))];
  const part = concepts.length / (motsRattaches(f.aromes) + concepts.length || 1);
  B.parts[nom] = { concepts, part: r2(part), visible: part >= B.seuil, partDessinee: r2(Math.min(part, B.plafond)) };
}

const sortie = {
  version: 'comparer-stout-v1',
  date: new Date().toISOString().slice(0, 10),
  simule: P.mention,
  sources: { profils: PROFILS, fiches: FICHES, composes: COMPOSES, panels: PANELS },
  biere: P.biere,
  style: P.style,
  echelle: P.echelle,
  familles: P.familles,
  formatGrille: P.formatGrille,
  houblons,
  panelOSU: C.saturation,
  egalites: {
    doseEgale: { dose_gL: 4, moment: 'dryPost', jours: 3, levure: US05 },
    effetEgal,
    ibuEgal,
  },
  descripteurs: { A, B },
};

const cible = path.join(RACINE, SORTIE);
fs.mkdirSync(path.dirname(cible), { recursive: true });
fs.writeFileSync(cible, JSON.stringify(sortie, null, 2) + '\n');
console.log(`ÉCRIT ${SORTIE} (${houblons.length} houblons, grille ${houblons.map((h) => h.grille.length).join('/')})`);
