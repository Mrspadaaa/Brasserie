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
import { CONDITIONS, DEGUSTATION, H, LEVURES, recetteDegustee } from '../prototypes/houblons-v4/parcours/src/donnees/cas';
import { placer } from '../prototypes/houblons-v4/parcours/src/etat/quand';
import { CALCULS } from '../prototypes/houblons-v4/parcours/src/moteur/client';
import type { AjoutParcours, Quand, RecetteParcours } from '../prototypes/houblons-v4/parcours/src/etat/types';

const args = process.argv.slice(2);
const K = Number(args.find((a) => a.startsWith('--echelle='))?.split('=')[1] ?? 1);
const BALAYAGE = args.includes('--balayage');
const VOLUME = args.includes('--volume');
const TEMOIN = args.find((a) => a.startsWith('--temoin='))?.split('=')[1] ?? null;
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

if (VOLUME) { volume(); process.exit(0); }

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

// =====================================================================================================================
// Mode --volume (#166, voie t17-banc) : le jeu réaliste « beaucoup de données » et les mesures du contrôle bloquant
// scripts/check-hop-tools-perf.mjs. Sortie : un objet JSON { meta, mesures: { id: { n, med, p95, max } } } sur stdout ; le
// contrôle juge (budgets par moment), le banc mesure seulement. Jeu : 318 houblons (×K au-delà), stock ×5 (80 articles),
// 10 recettes et 10 dégustations (SIMULÉES : graine fixe, aucune donnée réelle), snapshots répétés.
// Chaque calcul est mesuré À FROID sur une entrée que le cache n'a jamais vue (L20), sauf ceux qui disent « cache ».
// --temoin=lent : un délai de 8 ms est injecté dans un calcul fait sous le doigt (le contrôle doit alors échouer).
// =====================================================================================================================
function volume() {
  const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))]; };
  const M: Record<string, number[]> = {};
  const noter = (id: string, ms: number) => { (M[id] ??= []).push(ms); };
  const mesure = <T,>(id: string, f: () => T): T => { const [r, ms] = t(f); noter(id, ms); return r; };
  const attendre = (ms: number) => { const a = performance.now(); while (performance.now() - a < ms) { /* délai du témoin */ } };
  let graine = 20261025;
  const alea = () => { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296; };
  const entre = (a: number, b: number) => a + alea() * (b - a);
  const choix = <T,>(xs: T[]): T => xs[Math.floor(alea() * xs.length)];
  const g1 = (x: number) => Math.round(x * 10) / 10;
  const GROUPES = (args.find((a) => a.startsWith('--groupes='))?.split('=')[1] ?? 'repos,toucher,glisser,snapshot').split(',');
  const STOCK_N = Number(args.find((a) => a.startsWith('--stock='))?.split('=')[1] ?? 80);
  const clone = <T,>(x: T): T => structuredClone(x);

  // ---- Stock ×5 : les 16 articles du jeu d'essai + 64 lots simulés sur des variétés distinctes (80 à ×1 ; 16K au-delà).
  const stock: StockHop[] = [...J.stock];
  if (K === 1) {
    const prises = new Set(stock.map((s) => s.varietyId));
    const libres = J.catalogue.filter((c) => c.alpha && !prises.has(c.id));
    for (let i = 0; stock.length < STOCK_N && i < libres.length * 7; i += 7) {
      const c = libres[(i * 3) % libres.length];
      if (prises.has(c.id)) continue;
      prises.add(c.id);
      const a = ((c.alpha![0] + c.alpha![1]) / 2) * (1 + (((i * 7) % 11) - 5) / 100);
      stock.push({ key: c.id, varietyId: c.id, form: 'unknown', grams: 20 + ((i * 37) % 480), alpha: Math.round(a * 10) / 10, alphaFrom: 'lot simulé (jeu de volume)', items: [] } as StockHop);
    }
  }

  // ---- 10 recettes et 10 dégustations (simulées) ; l'addition n1 est neuve : elle n'est pas dans la dégustation.
  const STYLES: [string, number, string, number, number][] = [
    ['16D', 1.066, 'fermentis-us05', 20, 60], ['21A', 1.062, 'lalbrew-pomona', 25, 60], ['18B', 1.068, 'lalbrew-verdant-ipa', 20, 60], ['15B', 1.042, 'fermentis-us05', 30, 60],
    ['3B', 1.052, 'lalbrew-diamond', 20, 90], ['12C', 1.050, 'fermentis-us05', 15, 60], ['22A', 1.080, 'lalbrew-verdant-ipa', 20, 60], ['20B', 1.056, 'fermentis-us05', 40, 60],
    ['5D', 1.054, 'lalbrew-diamond', 20, 90], ['7B', 1.060, 'lalbrew-pomona', 20, 60],
  ];
  const NIVEAUX = ['faible', 'moyen', 'marqué'] as const;
  const FAM = (v4 as any).FAMILIES as string[];
  interface Cas { i: number; recette: RecetteParcours; base: RecetteParcours; tasting: any; direction: Record<string, number>; neuf: AjoutParcours }
  const cas: Cas[] = STYLES.map(([code, og, levure, vol, boil], i) => {
    const additions: AjoutParcours[] = [];
    const moments: [string, number | null][] = [['b60', null], ['b10', null], ['wp', null], ['b60', null], ['dryActive', 2]];
    for (let k = 0; k < 3 + (i % 3); k++) {
      const [moment, day] = moments[k];
      additions.push({ id: `a${k + 1}`, hopKey: choix(stock).key, moment: moment as any, grams: g1(entre(15, 60)), ...(day ? { day, jours: 3 } : {}) } as AjoutParcours);
    }
    const neuf = { id: 'n1', hopKey: choix(stock).key, moment: 'dryPost', grams: g1(entre(40, 110)), day: 7, jours: 3 } as AjoutParcours;
    const base: RecetteParcours = { name: `Recette simulée ${i + 1}`, styleCode: code, volumeL: vol, og, boilMin: boil, yeastId: levure, ebc: 20 + i * 6, additions };
    const f1 = FAM[(i * 5) % FAM.length], f2 = FAM[(i * 5 + 3) % FAM.length];
    const tasting = (v4 as any).tastingFrom({ [f1]: NIVEAUX[i % 3], [f2]: NIVEAUX[(i + 1) % 3] }, { origin: 'jeu simulé', date: '2026-10-18', quote: null, source: 'jeu de volume simulé (t17)' });
    return { i, base, recette: { ...base, additions: [...additions, neuf] }, tasting, direction: { [f1]: 1, [f2]: -1 }, neuf };
  });
  const donneesDe = (c: Cas) => ({ fiches: J.catalogue, catalogue: J.catalogue, stock, degustation: { tasting: c.tasting, recette: () => clone(c.base) } });
  const empreinteJeu = empreinte([J.catalogue.map((c) => c.id), stock.map((s) => [s.key, s.grams, s.alpha]), cas.map((c) => [c.recette, c.direction])]);

  const crans = (r: RecetteParcours): Quand[] => adapter.cransFrise(r).filter((q) => q.type !== 'dryhop' || [1, 2, 3, 5, 7].includes(q.jours));
  const avecAjout = (r: RecetteParcours, a: AjoutParcours): RecetteParcours => ({ ...r, additions: [...r.additions.filter((x) => x.id !== a.id), a] });
  // Douze houblons à comparer, différents d'un cas à l'autre (stock puis catalogue en fenêtre glissante) : jamais la même entrée.
  const tousHoublons = [...new Set([...stock.map((s) => s.key), ...J.catalogue.map((c) => c.id)])];
  const comparablesDe = (i: number) => Array.from({ length: 12 }, (_, k) => tousHoublons[(i * 31 + k * 7) % tousHoublons.length]);

  for (const c of cas) {
    const comparables = comparablesDe(c.i);
    // ---- Au repos : le moteur est créé, Ma bière est lue (premier écran), puis le préchauffage de la Coquille en tranches :
    // voiesDe (proposer + leviers, une tranche) et un remplaçants par ajout (une tranche chacun).
    const debut = performance.now();
    const [, creation] = t(() => adapter.configurerDonnees(donneesDe(c) as any));
    if (GROUPES.includes('repos')) {
    noter('repos:creation-du-moteur', creation);
    mesure('repos:premier-ecran-ma-biere', () => adapter.lireBiere(c.recette));
    const [, tProposer] = t(() => adapter.proposer(c.recette, c.direction as any));
    const [, tLeviers] = t(() => adapter.leviersLevure(c.recette, c.direction));
    noter('repos:voies-proposer', tProposer); noter('repos:voies-leviers-levure', tLeviers); noter('repos:tranche-voies-de-suggerer', tProposer + tLeviers);
    for (const a of c.recette.additions) mesure('repos:tranche-remplacants', () => adapter.remplacants(c.recette, a.id, 6));
    noter('repos:total-premier-ecran-et-prechauffage', performance.now() - debut);
    }

    const a = c.neuf, base = c.base;
    if (GROUPES.includes('toucher')) {
    // ---- À un toucher : l'ouverture d'un outil, sur ce que le préchauffage ne couvre pas.
    mesure('toucher:dryhopper-frise-complete', () => { for (const q of crans(base)) adapter.simulerMoment(base, a, q); });
    const actif = placer(a, { type: 'dryhop', phase: 'actif', jours: 3 }, base);
    mesure('toucher:levure-effets-4-souches', () => { adapter.effetLevure(base, actif, LEVURES.map((l) => l.id)); adapter.lireBiere(base); });
    const cible = c.recette.additions[0];
    mesure('toucher:substituer-classement', () => (CALCULS as any).substitutes(cible.hopKey, { moment: cible.moment, grams: cible.grams, recipe: c.recette, style: adapter.style(c.recette.styleCode), stockFirst: false }));
    mesure('toucher:comparer-12-houblons', () => adapter.comparer(c.recette, comparables));
    mesure('toucher:comparer-jour-apres-jour', () => { for (let j = 1; j <= 7; j++) adapter.comparer(c.recette, comparables, { quand: { type: 'dryhop', phase: 'apres', jours: j } }); });
    const dir2 = Object.fromEntries(Object.entries(c.direction).map(([f, k]) => [f, k * 2]));
    mesure('toucher:suggerer-sans-prechauffage', () => { adapter.proposer(c.recette, dir2 as any); adapter.leviersLevure(c.recette, dir2); });
    mesure('toucher:suggerer-prechauffe-cache', () => { adapter.proposer(c.recette, c.direction as any); adapter.leviersLevure(c.recette, c.direction); });
    mesure('toucher:ma-biere-apres-un-outil', () => adapter.lireBiere({ ...c.recette, additions: c.recette.additions.map((x) => (x.id === 'n1' ? { ...x, grams: x.grams + 7 } : x)) }));
    for (const cle of comparables) mesure('toucher:fiche-houblon', () => adapter.houblon(cle));

    }
    if (GROUPES.includes('glisser')) {
    // ---- Sous le doigt : un cran du glisser (moment, jours) et un pas de dose, sur des entrées jamais vues.
    const dose2 = g1(a.grams + 3.3);
    for (const q of crans(base).filter((_, k) => k % 2 === 0)) {
      const aq = placer({ ...a, grams: dose2 }, q, base);
      mesure('glisser:cran-ma-biere', () => { if (TEMOIN === 'lent') attendre(8); return adapter.lireBiere(avecAjout(base, aq)); });
      mesure('glisser:cran-apercu-levure', () => adapter.effetLevure(base, aq, [base.yeastId ?? CONDITIONS.levure, 'lalbrew-pomona']));
    }
    for (const q of crans(base).slice(0, 12)) { const aq = placer(a, q, base); mesure('glisser:cran-deja-calcule-cache', () => adapter.lireBiere(avecAjout(base, aq))); }
    for (let d = 1; d <= 8; d++) {
      const r = { ...c.recette, additions: c.recette.additions.map((x) => (x.id === 'a1' ? { ...x, grams: g1(x.grams + d) } : x)) };
      mesure('glisser:pas-de-dose', () => { adapter.lireBiere(r); adapter.lireBiere({ ...r, additions: r.additions.filter((x) => x.id !== 'a1') }); });
    }
    }
  }

  // ---- Snapshots répétés : le magasin rend les mêmes données dans des tableaux neufs (Firestore, Dexie). Référence : le même
  // moteur rappelé (chaud). Recréé : creerMoteur sur une copie des mêmes données, puis son premier calcul.
  if (GROUPES.includes('snapshot')) snapshots();
  function snapshots() {
  const c0 = cas[0].recette.additions[0];
  const optionsSub = (r: RecetteParcours) => ({ moment: c0.moment, grams: c0.grams, recipe: r, style: adapter.style(r.styleCode), stockFirst: true, limit: 8 });
  const ref = (v4 as any).creerMoteur({ catalogue: J.catalogue, stock });
  ref.substitutes(c0.hopKey, optionsSub(cas[0].recette));
  for (let i = 0; i < 5; i++) noter('snapshot:calcul-sur-le-meme-moteur', t(() => ref.substitutes(c0.hopKey, optionsSub(cas[0].recette)))[1]);
  for (let i = 0; i < 5; i++) {
    const copie = { catalogue: clone(J.catalogue), stock: clone(stock) };
    const [m, ms] = t(() => (v4 as any).creerMoteur(copie));
    noter('snapshot:creation-du-moteur', ms);
    noter('snapshot:calcul-apres-donnees-identiques', t(() => m.substitutes(c0.hopKey, optionsSub(cas[0].recette)))[1]);
  }
  }

  const sortie: Record<string, unknown> = {};
  for (const [id, xs] of Object.entries(M)) sortie[id] = { n: xs.length, med: r2(med(xs)), p95: r2(pct(xs, 0.95)), max: r2(Math.max(...xs)) };
  process.stdout.write(JSON.stringify({ meta: { echelle: K, temoin: TEMOIN, catalogue: J.catalogue.length, stock: stock.length, recettes: cas.length, degustations: cas.length, empreinteJeu, memoireMo: Math.round(process.memoryUsage().heapUsed / 1e5) / 10 }, mesures: sortie }) + '\n');
}
