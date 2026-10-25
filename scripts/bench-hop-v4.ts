// Banc du moteur v4 (#164, voie t5-causes) : catalogue et stock ×1, ×5, ×10, construits PAR LA FABRIQUE creerMoteur
// (aucun singleton muté). Un processus par échelle ; sortie : un seul objet JSON sur stdout (le résumé va sur stderr).
// Lancement, depuis la racine : npx vite-node scripts/bench-hop-v4.ts -- --echelle=10 --json
// Méthode reprise de i0 (ETAT-DES-LIEUX, § Beaucoup de données) : clones à α décalé de ±5 %, mêmes fiches (descripteurs,
// huiles) ; cas S1 (stout 16D, 20 L, US-05, dégustation du 18.10). Froid = premier appel du processus ; chaud = médiane
// de 5 appels identiques. Options : --balayage (classement léger de tout le catalogue, 5 moments ; long à ×10).
// Avant la fabrique (HEAD de t4), le banc retombe sur la méthode i0 (singletons mutés) et le dit dans `methode`.
import { createHash } from 'node:crypto';
import * as v4 from '../src/domain/hopIndex/v4';
import * as data from '../src/domain/hopIndex/v4/data';
import type { CatalogueHop, StockHop } from '../src/domain/hopIndex/v4';
import * as adapter from '../prototypes/houblons-v4/parcours/src/moteur/index';
import { DEGUSTATION, H, recetteDegustee } from '../prototypes/houblons-v4/parcours/src/donnees/cas';

const args = process.argv.slice(2);
const K = Number(args.find((a) => a.startsWith('--echelle='))?.split('=')[1] ?? 1);
const BALAYAGE = args.includes('--balayage');
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const k = Math.floor(s.length / 2); return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const r2 = (x: number) => Math.round(x * 100) / 100;
function t<T>(f: () => T): [T, number] { const a = performance.now(); const r = f(); return [r, performance.now() - a]; }
const empreinte = (x: unknown) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12);

// ---- Jeu ×K : clones à α décalé (même règle que i0), mêmes fiches.
const base = { catalogue: [...(data as any).CATALOGUE ?? (data as any).DONNEES_FIXTURE.catalogue] as CatalogueHop[],
  stock: [...(data as any).STOCK ?? (data as any).DONNEES_FIXTURE.stock] as StockHop[] };
function jeu(k: number) {
  const catalogue = [...base.catalogue], stock = [...base.stock];
  for (let i = 1; i < k; i++) {
    base.catalogue.forEach((v, idx) => {
      const c = structuredClone(v);
      c.id = `${v.id}~${i}`; c.name = `${v.name} ${i}`; c.aliases = []; c.hopsteinerId = null;
      const f = 1 + (((i * 7 + idx) % 11) - 5) / 100;
      if (c.alpha) c.alpha = [c.alpha[0] * f, c.alpha[1] * f];
      catalogue.push(c);
    });
    base.stock.forEach((s) => {
      const c = structuredClone(s);
      const cryo = s.key.endsWith(':cryo');
      const b = cryo ? s.key.slice(0, -5) : s.key;
      c.varietyId = `${s.varietyId}~${i}`; c.key = cryo ? `${b}~${i}:cryo` : `${b}~${i}`;
      stock.push(c);
    });
  }
  return { catalogue, stock };
}
const J = jeu(K);

let moteur: any, methode: string;
if (typeof (v4 as any).creerMoteur === 'function') {
  moteur = (v4 as any).creerMoteur({ catalogue: J.catalogue, stock: J.stock });
  adapter.configurerDonnees({ fiches: J.catalogue, catalogue: J.catalogue, stock: J.stock } as any);
  methode = 'fabrique creerMoteur';
} else {
  // HEAD avant t5 : singletons du moteur mutés (méthode i0), puis l'index de l'adaptateur reconstruit.
  const d = data as any;
  for (const c of J.catalogue.slice(base.catalogue.length)) {
    d.CATALOGUE.push(c); d.CATALOGUE_BY_ID.set(c.id, c);
    const ev = d.ENGINE_DATA.varieties.find((x: any) => x.id === c.id.replace(/~\d+$/, ''));
    const nv = { ...ev, id: c.id, name: c.name, aliases: [] }; d.ENGINE_DATA.varieties.push(nv); d.VARIETY_BY_ID.set(nv.id, nv);
  }
  for (const s of J.stock.slice(base.stock.length)) { d.STOCK.push(s); d.STOCK_BY_KEY.set(s.key, s); }
  adapter.configurerDonnees();
  moteur = v4;
  methode = 'singletons mutés (avant la fabrique, méthode i0)';
}
const recette = recetteDegustee();
const out: Record<string, unknown> = { echelle: K, methode, catalogue: J.catalogue.length, stock: J.stock.length, stockAvecGrammes: J.stock.filter((s) => s.grams > 0).length };

// 1. substitutes (Nugget à 60′, 46 g, recette S1, style 16D, en stock d'abord, 8 rendus).
// froidProcessus : premier appel du processus (code pas encore compilé, caches vides), sur un moteur à part (copie des tableaux :
// un autre contexte, d'autres caches). froid : premier appel du moteur mesuré (caches vides, code déjà compilé par l'appel
// précédent) ; c'est le froid d'un moteur recréé quand le stock change. i0 mesurait son froid après le balayage (code compilé,
// fiches déjà lues) : notre froid est au moins aussi strict. HEAD (singletons) : un seul froid, celui du processus.
const options = () => ({ moment: 'b60', grams: 46, recipe: recette as any, style: adapter.style(recette.styleCode), stockFirst: true, limit: 8 });
let froidProcessus: number | null = null;
if (methode.startsWith('fabrique')) froidProcessus = t(() => (v4 as any).creerMoteur({ catalogue: [...J.catalogue], stock: [...J.stock] }).substitutes(H.nugget, options()))[1];
const sub = () => moteur.substitutes(H.nugget, { moment: 'b60', grams: 46, recipe: recette as any, style: adapter.style(recette.styleCode), stockFirst: true, limit: 8 });
// froid : médiane de trois moteurs neufs (chacun sur sa copie des tableaux : caches vides), puis le moteur mesuré.
const froids: number[] = [];
if (methode.startsWith('fabrique')) for (let i = 0; i < 2; i++) froids.push(t(() => (v4 as any).creerMoteur({ catalogue: [...J.catalogue], stock: [...J.stock] }).substitutes(H.nugget, options()))[1]);
const [sr, subFroid0] = t(sub);
froids.push(subFroid0);
const subFroid = med(froids);
const subC: number[] = []; for (let i = 0; i < 5; i++) subC.push(t(sub)[1]);
out.substitutes = { froid: r2(subFroid), froids: froids.map(r2), froidProcessus: froidProcessus === null ? r2(subFroid) : r2(froidProcessus), chaud: r2(med(subC)), chaudMax: r2(Math.max(...subC)), candidats: sr.candidats, rendus: sr.remplacants.length,
  empreinte: empreinte(sr.remplacants.map((r: any) => [r.key, r.rank, r.score, r.dose, r.stock, r.raison, r.amertumeDeconseillee])) };

// 2. simulerCas sur un ajout (Idaho 7, 4 g/L, après fermentation, US-05) : léger et complet, froid puis chaud.
const cas = (complet: boolean, dose = 4) => moteur.simulerCas({ id: 'm', titre: 'm', ajouts: [{ id: 'x', houblon: H.idaho7, dose_gL: dose, moment: 'dryPost', jourDebut: 7, jours: 3 }],
  levure: 'fermentis-us05', recette: recette as any, degustation: DEGUSTATION, complet });
const [cl, legerFroid] = t(() => cas(false)); const cL: number[] = []; for (let i = 0; i < 30; i++) cL.push(t(() => cas(false))[1]);
const [cc, completFroid] = t(() => cas(true)); const cC: number[] = []; for (let i = 0; i < 30; i++) cC.push(t(() => cas(true))[1]);
const dL: number[] = []; for (let i = 0; i < 30; i++) dL.push(t(() => cas(false, 3 + i * 0.1))[1]);
out.simulerCas = { legerFroid: r2(legerFroid), legerChaud: r2(med(cL)), legerDoseChangee: r2(med(dL)), completFroid: r2(completFroid), completChaud: r2(med(cC)),
  empreinte: empreinte([cl.apres ?? cl, cc.apres ?? cc]) };

// 3. Adaptateur de la maquette : ce que les écrans appellent.
const [lb, lbF] = t(() => adapter.lireBiere(recette));
const lbs: number[] = []; for (let i = 0; i < 16; i++) { const r = { ...recette, additions: recette.additions.map((a: any) => ({ ...a, grams: a.grams + i + 1 })) }; lbs.push(t(() => adapter.lireBiere(r))[1]); }
out.lireBiere = { froid: r2(lbF), entreesDifferentes: r2(med(lbs)), empreinte: empreinte(lb) };
const [cands, sgF] = t(() => adapter.suggerer(recette, 'floral')); const sg = t(() => adapter.suggerer(recette, 'floral'))[1];
const [, sgDose] = t(() => adapter.suggerer(recette, 'floral', { doseGL: 5 }));
out.suggerer = { candidats: cands.length, froid: r2(sgF), chaud: r2(sg), doseChangee: r2(sgDose), empreinte: empreinte(cands.map((c: any) => [c.cle, c.visee, c.besoin])) };
const [vr, pF] = t(() => adapter.proposer(recette, { floral: 1, resin: -1 } as any)); const pC = t(() => adapter.proposer(recette, { floral: 1, resin: -1 } as any))[1];
out.proposer = { voies: (vr as any).voies.length, evaluees: (vr as any).evaluated, froid: r2(pF), chaud: r2(pC), empreinte: empreinte((vr as any).voies) };
const nug = recette.additions[0];
const [rm, rmF] = t(() => adapter.remplacants(recette, nug.id)); const rmC = t(() => adapter.remplacants(recette, nug.id))[1];
out.remplacants = { rendus: rm.length, froid: r2(rmF), chaud: r2(rmC), empreinte: empreinte(rm) };
const cmp = (n: number) => t(() => adapter.comparer(recette, J.catalogue.slice(0, n).map((c) => c.id)));
const [c12, c12ms] = cmp(12);
out.comparer = { n3: r2(cmp(3)[1]), n12: r2(c12ms), empreinte: empreinte(c12.map((c: any) => [c.cle, c.lu.ecart])) };

// 4. Optionnel : classement léger de tout le catalogue (5 moments), froid puis chaud.
if (BALAYAGE) {
  const M5: [string, number | null, number | null][] = [['b60', null, null], ['b10', null, null], ['wp', null, null], ['dryActive', 2, 3], ['dryPost', 7, 3]];
  const tour = () => t(() => { for (const c of J.catalogue) for (const [m, jd, j] of M5) moteur.simulerCas({ id: 'b', titre: 'b', ajouts: [{ id: 'x', houblon: c.id, dose_gL: 4, moment: m, jourDebut: jd, jours: j }], levure: 'fermentis-us05', recette: recette as any, degustation: DEGUSTATION, complet: false }); })[1];
  out.balayage = { cas: J.catalogue.length * 5, froid: Math.round(tour()), chaud: Math.round(tour()) };
}
out.memoireMo = Math.round(process.memoryUsage().heapUsed / 1e5) / 10;
process.stderr.write(`banc ×${K} (${methode}) : substitutes froid ${(out.substitutes as any).froid} ms, chaud ${(out.substitutes as any).chaud} ms\n`);
process.stdout.write(JSON.stringify(out) + '\n');
