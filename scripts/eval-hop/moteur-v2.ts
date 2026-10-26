// Moteur v2 de Substituer, phase 1 hors ligne (#181, voie e2-moteur-substitution, D80).
// Lancement, depuis la racine : npx vite-node scripts/eval-hop/moteur-v2.ts [-- --sortie=<dossier>]
// Sortie : resultats.json, rapport.md, listes-60.json (déterministes : aucune durée, aucune date). Mesure seulement : src/domain n'est pas touché.
//
// La formule v2 (voir `formuleV2.ts`, partagée avec le test de la phase 2) :
//  - une ressemblance par variable, entre 0 et 1 : α, β, cohumulone, usage ; huile totale, myrcène, humulène, caryophyllène, farnésène,
//    linalol, géraniol ; familles, mots, radar Beer Maverick ;
//  - moyenne pondérée des variables connues des deux houblons (poids renormalisés) : un inconnu sort du calcul, jamais 0 ;
//  - trois jeux de poids : amertume (premier moût, 60′, 30′, 15′), arôme chaud (10′, whirlpool), à froid (dry hop) ;
//  - poids de groupe (amertume, huile, arôme) et part des mots dans l'arôme choisis sur la moitié d'apprentissage (parité de l'indice
//    du houblon parmi les 217 triés par id), jugés sur la moitié de contrôle ; les poids à l'intérieur d'un groupe sont fixés à la main.
// Références : (a) les substituts Beer Maverick (fuite : sa formule les a produits) ; (b) le jugement du brasseur : les 3 premiers de D
// (option 1 + IA) pour les 8 phares.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, bmLienId } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES } from '../../src/domain/hopIndex/v4/families';
import { roleFromAlpha } from '../../src/domain/hopIndex/v4/roles';
import { lireComplements, type ComplementsBrut } from '../../src/domain/hopIndex/v4/complements';
import complementsJson from '../../src/data/hopV4/complements.json';
import { arrondi, mediane, moyenne, mulberry32, premierRang, rangReciproque, rappelA, type Obs } from './metriques';
import {
  NV, VARS, GROUPE, poidsV2, PROFILS, type Moment3, type R, type FicheV2, similitudes, sigmaDe, motsPoids,
} from './formuleV2';
import { rapportV2 } from './rapport-v2';
import { substitutes as substitutesV1 } from './substitution-v1';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/e2-moteur-substitution');
const IA1 = resolve('work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement/resultats/cote-a-cote.json');
/** Par défaut, sans complements.json : c'est ce que le moteur de l'app peut lire (il ne charge jamais les compléments), donc ce que la phase 2
 * reproduit à l'identique. `--avec-complements` ajoute les enveloppes valides de complements.json (mesure du gain que cela apporterait). */
const CATALOGUE_SEUL = !args.includes('--avec-complements');
const GRAINE = 181;
const BOOT = 1000;
const t0 = performance.now();
const chrono = (nom: string) => process.stderr.write(`[v2] ${nom} ${(performance.now() - t0).toFixed(0)} ms\n`);

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const N = CATALOGUE.length;
const ids = CATALOGUE.map((h) => h.id);
const idx = new Map(ids.map((id, i) => [id, i]));
const nom = (i: number) => CATALOGUE[i].name;
const COLL = new Intl.Collator('fr');
const nameRank = (() => { const o = CATALOGUE.map((_, i) => i).sort((a, b) => COLL.compare(CATALOGUE[a].name, CATALOGUE[b].name) || a - b); const r = new Array<number>(N); o.forEach((i, k) => { r[i] = k; }); return r; })();

// ---------- Moments ----------
const MOMENTS: Moment3[] = ['am', 'ch', 'fr'];
const MOMENT_MOTEUR: Record<Moment3, 'b60' | 'wp' | 'dryActive'> = { am: 'b60', ch: 'wp', fr: 'dryActive' };
const LIB_MOMENT: Record<Moment3, string> = { am: 'amertume (60′ ; premier moût, 30′, 15′)', ch: 'arôme chaud (10′, whirlpool)', fr: 'à froid (dry hop)' };

// ---------- Vérité (a) : les substituts Beer Maverick (comme suite-mots.ts) ----------
const parId = new Map(CATALOGUE.map((h) => [h.id, h]));
interface Cible { id: string; i: number; purpose: string | null; attendus: number[]; moitie: 0 | 1 }
const cibles0 = CATALOGUE.filter((h) => h.bm?.substituts?.length).map((h) => ({
  id: h.id, purpose: (h.purpose ?? null) as string | null,
  attendus: [...new Set(h.bm!.substituts!.map((l) => bmLienId(l)).filter((x): x is string => !!x && x !== h.id && parId.has(x)))].map((x) => idx.get(x)!),
})).filter((c) => c.attendus.length > 0).sort((a, b) => (a.id < b.id ? -1 : 1));
const cibles: Cible[] = cibles0.map((c, k) => ({ ...c, i: idx.get(c.id)!, moitie: (k % 2) as 0 | 1 }));
const app = cibles.filter((c) => c.moitie === 0), ctl = cibles.filter((c) => c.moitie === 1);
const estAmer = (c: Cible) => c.purpose === 'bittering';
const SOUS_ENSEMBLES: Record<string, { app: Cible[]; ctl: Cible[]; tous: Cible[] }> = {
  'tous les houblons': { app, ctl, tous: cibles },
  'amérisants (usage BM : bittering)': { app: app.filter(estAmer), ctl: ctl.filter(estAmer), tous: cibles.filter(estAmer) },
};

// ---------- Vérité (b) : les 3 premiers de D pour les 8 phares ----------
interface Phare { nom: string; i: number; d: number[]; dNoms: string[] }
const ia1 = JSON.parse(readFileSync(IA1, 'utf8')) as { phares: { nom: string; id: string; option1PlusIA: { rang: number; nom: string }[] }[] };
const parNom = new Map<string, number>();
CATALOGUE.forEach((h, i) => { if (!parNom.has(h.name)) parNom.set(h.name, i); });
const phares: Phare[] = ia1.phares.map((p) => {
  const trois = p.option1PlusIA.slice(0, 3);
  const d = trois.map((x) => { const i = parNom.get(x.nom); if (i === undefined) throw Error(`(b) : « ${x.nom} » absent du catalogue`); return i; });
  return { nom: p.nom, i: idx.get(p.id)!, d, dNoms: trois.map((x) => x.nom) };
});

// ---------- Données de chaque houblon ----------
const complements = lireComplements(complementsJson as unknown as ComplementsBrut);
const sources: Record<string, { catalogue: number; complements: number; inconnu: number }> = {};
const note = (v: string, s: 'catalogue' | 'complements' | 'inconnu') => { (sources[v] ??= { catalogue: 0, complements: 0, inconnu: 0 })[s]++; };
/** Plage [min, max] : le catalogue d'abord, sinon l'enveloppe valide des compléments. Une borne seule (« jusqu'à… ») ou [0, 0] : inconnu. */
function plage(h: (typeof CATALOGUE)[number], v: string, cat: R | null | undefined, champ: string | null): R | null {
  const ok = (r: R | null | undefined): r is R => !!r && Number.isFinite(r[0]) && Number.isFinite(r[1]) && r[1] > 0;
  if (ok(cat)) { note(v, 'catalogue'); return cat; }
  const e = champ && !CATALOGUE_SEUL ? complements.enveloppeDe(h.id, champ as never) : null;
  if (e && e[0] !== null && e[1] !== null && ok([e[0], e[1]])) { note(v, 'complements'); return [e[0], e[1]]; }
  note(v, 'inconnu');
  return null;
}
const norm = (x: string) => x.toLowerCase().replace(/[_-]+/g, ' ');
const fiches: FicheV2[] = CATALOGUE.map((h) => {
  const d = m.describeFamilies(h.id), w = m.familyWords(h.id);
  const levels = FAMILIES.map((f) => (d[f].level === 'marqué' ? 2 : d[f].level === 'cité' ? 1 : 0));
  const cited = levels.some((l) => l > 0), marked = levels.some((l) => l === 2);
  const aromaV = cited ? FAMILIES.map((f, k) => (d[f].of ? (levels[k] / 2) * (d[f].sources / d[f].of) : 0)) : null;
  const mots = new Set<string>();
  for (const f of FAMILIES) for (const row of w.mots[f]) for (const x of row.mots) mots.add(norm(x));
  for (const x of w.sansFamille) mots.add(norm(x.mot));
  const alpha = plage(h, 'alpha', h.alpha, 'alpha');
  const radar = h.bm?.arome && h.bm.arome.some((x) => x > 0) ? h.bm.arome : null; // un radar tout à zéro vaut « pas de donnée »
  note('radar', radar ? 'catalogue' : 'inconnu');
  note('familles', aromaV ? 'catalogue' : 'inconnu');
  note('mots', mots.size ? 'catalogue' : 'inconnu');
  const role = alpha ? roleFromAlpha((alpha[0] + alpha[1]) / 2, marked) : null;
  note('usage', role ? 'catalogue' : 'inconnu');
  return {
    alpha, beta: plage(h, 'beta', h.beta, 'beta'), cohu: plage(h, 'cohumulone', h.cohumulone, 'cohumulone'),
    huile: plage(h, 'huile', h.oil ?? h.hs?.totalOil, 'huile'),
    myr: plage(h, 'myrcène', h.oils.myrcene, 'myrcene'), hum: plage(h, 'humulène', h.oils.humulene, 'humulene'),
    car: plage(h, 'caryophyllène', h.oils.caryophyllene, 'caryophyllene'), far: plage(h, 'farnésène', h.oils.farnesene, 'farnesene'),
    lin: plage(h, 'linalol', h.hsLinalool?.range, 'linalol'), ger: plage(h, 'géraniol', null, 'geraniol'),
    role: role as string | null, aromaV, levels, mots, radar: radar as number[] | null,
  };
});
const sigma = sigmaDe(fiches);
const motsW = motsPoids(fiches);
chrono('fiches');

// ---------- Similitudes : une table par contexte (0 : arôme, 1 : amertume), [o][j][variable], NaN = inconnu ----------
const PAIRES = [new Float64Array(N * N * NV), new Float64Array(N * N * NV)];
const FAIBLE = new Uint8Array(N * N); // v2 : ni famille ni mot connus des deux
for (let o = 0; o < N; o++) for (let j = 0; j < N; j++) {
  if (o === j) continue;
  similitudes(fiches[o], fiches[j], false, sigma, motsW[o], motsW[j], PAIRES[0], (o * N + j) * NV);
  similitudes(fiches[o], fiches[j], true, sigma, motsW[o], motsW[j], PAIRES[1], (o * N + j) * NV);
  const p = PAIRES[0], b = (o * N + j) * NV;
  FAIBLE[o * N + j] = Number.isNaN(p[b + 11]) && Number.isNaN(p[b + 12]) ? 1 : 0;
}
chrono('similitudes');

// ---------- Le moteur actuel (A) et sa variante « mots » (C), par moment ----------
interface EngineLigne { score: Int16Array; faible: Uint8Array; demo: Uint8Array; a: Int16Array; o: Int16Array; b: Int16Array; ordre: number[] }
const ABS = -1; // composante inconnue
const engine: Record<string, EngineLigne[]> = {};
for (const mo of MOMENTS) {
  engine[mo] = [];
  for (let o = 0; o < N; o++) {
    const r = m.dans(() => substitutesV1(ids[o], { moment: MOMENT_MOTEUR[mo] })); // A = le moteur v1 figé (substitution-v1.ts), pas celui de l'app
    const L: EngineLigne = { score: new Int16Array(N), faible: new Uint8Array(N), demo: new Uint8Array(N), a: new Int16Array(N).fill(ABS), o: new Int16Array(N).fill(ABS), b: new Int16Array(N).fill(ABS), ordre: [] };
    for (const s of r.remplacants) {
      const j = idx.get(s.key)!;
      L.score[j] = s.score; L.faible[j] = s.couverture.fiabilite === 'faible' ? 1 : 0; L.demo[j] = s.amertumeDeconseillee ? 1 : 0;
      if (s.composantes.arome !== null) L.a[j] = s.composantes.arome;
      if (s.composantes.huiles !== null) L.o[j] = s.composantes.huiles;
      if (s.composantes.amertume !== null) L.b[j] = s.composantes.amertume;
      L.ordre.push(j);
    }
    engine[mo].push(L);
  }
}
chrono('moteur A');
const DEMO_60 = engine.am; // les raisons de passer après les amérisants ne dépendent que de l'original et du candidat (contexte d'amertume)

// ---------- Classement : mêmes clés que le moteur (faible, démotion, score entier, nom) ----------
const cle = (faible: number, demo: number, score: number, j: number) => ((faible * 2 + demo) * 101 + (100 - score)) * 512 + nameRank[j];
const clesBuf = new Float64Array(N);
function cles(o: number, score: ArrayLike<number>, faible: ArrayLike<number>, demo: ArrayLike<number> | null): Float64Array {
  for (let j = 0; j < N; j++) clesBuf[j] = j === o ? Infinity : cle(faible[j], demo ? demo[j] : 0, score[j], j);
  return clesBuf;
}
function rangsDe(o: number, attendus: number[], K: Float64Array): number[] {
  return attendus.map((e) => { let r = 1; const ke = K[e]; for (let j = 0; j < N; j++) if (K[j] < ke) r++; return r; });
}
function ordreDe(o: number, K: Float64Array): number[] { return Array.from({ length: N }, (_, j) => j).filter((j) => j !== o).sort((x, y) => K[x] - K[y]); }

type Methode = 'A' | 'C' | 'v2' | 'v2libre';
interface Jeu { w: Float64Array }
const VARIANTES: Record<string, Record<Moment3, Jeu>> = {};

/** Scores entiers de v2 pour un original sous des poids. */
function scoresV2(o: number, mo: Moment3, w: Float64Array, out: Int16Array) {
  const P = PAIRES[mo === 'am' ? 1 : 0], base = o * N * NV;
  for (let j = 0; j < N; j++) {
    if (j === o) { out[j] = 0; continue; }
    let tw = 0, num = 0; const b = base + j * NV;
    for (let v = 0; v < NV; v++) { const s = P[b + v]; if (w[v] > 0 && s === s) { tw += w[v]; num += w[v] * s; } }
    out[j] = tw > 0 ? Math.round((100 * num) / tw) : 0;
  }
}
/** Arôme de C : λ = 0,25, garde de 2 mots (la variante « retenue » de e1) ; seulement aux moments d'arôme. */
const W_AROME = { arome: 0.6, huiles: 0.3, amertume: 0.1 };
function scoresC(o: number, mo: Moment3, out: Int16Array) {
  const E = engine[mo][o];
  if (mo === 'am') { out.set(E.score); return; }
  const P = PAIRES[0];
  for (let j = 0; j < N; j++) {
    if (j === o) { out[j] = 0; continue; }
    const cos = P[(o * N + j) * NV + 12];
    let a: number | null = E.a[j] === ABS ? null : E.a[j];
    if (a !== null && !Number.isNaN(cos)) a = Math.round(0.25 * a + 0.75 * 100 * cos);
    let tw = 0, num = 0;
    if (a !== null) { tw += W_AROME.arome; num += W_AROME.arome * a; }
    if (E.o[j] !== ABS) { tw += W_AROME.huiles; num += W_AROME.huiles * E.o[j]; }
    if (E.b[j] !== ABS) { tw += W_AROME.amertume; num += W_AROME.amertume * E.b[j]; }
    out[j] = tw > 0 ? Math.round(num / tw) : 0;
  }
}
const tmpScore = new Int16Array(N);
/** Clés de classement d'une méthode pour un original à un moment. */
function clesMethode(o: number, mo: Moment3, meth: Methode, variante?: string): Float64Array {
  const E = engine[mo][o];
  if (meth === 'A') return cles(o, E.score, E.faible, mo === 'am' ? E.demo : null);
  if (meth === 'C') { scoresC(o, mo, tmpScore); return cles(o, tmpScore, E.faible, mo === 'am' ? E.demo : null); }
  const w = VARIANTES[variante ?? meth][mo].w;
  scoresV2(o, mo, w, tmpScore);
  return cles(o, tmpScore, FAIBLE.subarray(o * N, o * N + N), mo === 'am' ? DEMO_60[o].demo : null);
}
// Contrôle de la réplique : l'ordre calculé ici pour A égale celui de substitutes().
{
  let ecarts = 0, total = 0;
  for (const mo of MOMENTS) for (let o = 0; o < N; o++) { const K = clesMethode(o, mo, 'A'); const mine = ordreDe(o, K), ref = engine[mo][o].ordre; total++; if (mine.join() !== ref.join()) ecarts++; }
  if (ecarts) throw Error(`réplique de A : ${ecarts} classements sur ${total} diffèrent de substitutes()`);
}
chrono('réplique A exacte');

// ---------- Métriques ----------
interface PH { rr: number; r10: number; r5: number; premier: number }
const obsDe = (rangs: number[]): Obs => ({ rangs });
const phDe = (rangs: number[]): PH => { const o = obsDe(rangs); return { rr: rangReciproque(o), r10: rappelA(o, 10), r5: rappelA(o, 5), premier: premierRang(o) ?? 999 }; };
const stat = (ph: PH[]) => ({ mrr: moyenne(ph.map((p) => p.rr)) ?? 0, rappel10: moyenne(ph.map((p) => p.r10)) ?? 0, rangMedian: mediane(ph.map((p) => p.premier)) ?? 0 });
function ic(ph: PH[], ref?: PH[]) {
  const rnd = mulberry32(GRAINE + 7), n = ph.length;
  const t = { mrr: [] as number[], r10: [] as number[], med: [] as number[] };
  for (let b = 0; b < BOOT; b++) {
    const ix = Array.from({ length: n }, () => Math.floor(rnd() * n));
    const s = stat(ix.map((i) => ph[i]));
    if (ref) { const r = stat(ix.map((i) => ref[i])); t.mrr.push(s.mrr - r.mrr); t.r10.push(s.rappel10 - r.rappel10); t.med.push(s.rangMedian - r.rangMedian); }
    else { t.mrr.push(s.mrr); t.r10.push(s.rappel10); t.med.push(s.rangMedian); }
  }
  const q = (xs: number[]): [number, number] => { const s = [...xs].sort((a, b) => a - b); return [arrondi(s[Math.floor(0.025 * BOOT)], 3)!, arrondi(s[Math.floor(0.975 * BOOT)], 3)!]; };
  return { mrr: q(t.mrr), rappel10: q(t.r10), rangMedian: q(t.med) };
}
const phCache = new Map<string, PH>();
function phMeth(cs: Cible[], mo: Moment3, meth: Methode, variante?: string): PH[] {
  return cs.map((c) => {
    const k = `${meth}|${variante ?? ''}|${mo}|${c.id}`; const hit = phCache.get(k);
    if (hit) return hit;
    const ph = phDe(rangsDe(c.i, c.attendus, clesMethode(c.i, mo, meth, variante)));
    phCache.set(k, ph);
    return ph;
  });
}
const ligne = (ph: PH[], ref?: PH[]) => { const s = stat(ph); return { n: ph.length, mrr: arrondi(s.mrr), rappel10: arrondi(s.rappel10), rangMedian: s.rangMedian, ic95: ic(ph), ecart: ref ? ic(ph, ref) : null, ecartPoint: ref ? { mrr: arrondi(s.mrr - stat(ref).mrr), rappel10: arrondi(s.rappel10 - stat(ref).rappel10), rangMedian: s.rangMedian - stat(ref).rangMedian } : null }; };

// ---------- Apprentissage des poids ----------
const GRILLE: [number, number, number][] = [];
for (let a = 0; a <= 10; a++) for (let h = 0; h <= 10 - a; h++) GRILLE.push([a / 10, h / 10, (10 - a - h) / 10]);
const PARTS_MOTS = [0.25, 0.5, 0.75];
/** Familles de contraintes a priori (poids de groupe : [amertume, huile, arôme]). Amertume : un seul a priori (le groupe amertume pèse au
 * moins 0,4). Moments d'arôme : quatre, de la plus libre à la plus proche des poids actuels (arôme 0,6) ; « libre » : aucune. */
type Fam = 'k1' | 'k2' | 'k3' | 'k4' | 'libre';
const FAMILLES: Fam[] = ['k1', 'k2', 'k3', 'k4', 'libre'];
const DEFINITION_FAMILLES: Record<Fam, string> = {
  k1: 'amertume ≤ 0,3', k2: 'amertume ≤ 0,3 et arôme ≥ 0,4', k3: 'amertume ≤ 0,2 et arôme ≥ 0,5', k4: 'arôme ≥ 0,6 (comme A et C)', libre: 'aucune contrainte',
};
const contrainte = (mo: Moment3, f: Fam, g: [number, number, number]) => {
  if (f === 'libre') return true;
  if (mo === 'am') return g[0] >= 0.4;
  return f === 'k1' ? g[0] <= 0.3 : f === 'k2' ? g[0] <= 0.3 && g[2] >= 0.4 : f === 'k3' ? g[0] <= 0.2 && g[2] >= 0.5 : g[2] >= 0.6;
};
const scoreRapide = (cs: Cible[], mo: Moment3, w: Float64Array) => {
  const ph = cs.map((c) => { scoresV2(c.i, mo, w, tmpScore); return phDe(rangsDe(c.i, c.attendus, cles(c.i, tmpScore, FAIBLE.subarray(c.i * N, c.i * N + N), mo === 'am' ? DEMO_60[c.i].demo : null))); });
  const s = stat(ph); return { mrr: s.mrr, r10: s.rappel10 };
};
interface Appris { g: [number, number, number]; partMots: number; mrrApp: number; rappelApp: number; dix: { g: number[]; partMots: number; mrr: number }[] }
function apprendre(mo: Moment3, cs: Cible[], fam: Fam): Appris {
  const essais: { g: [number, number, number]; r: number; mrr: number; r10: number }[] = [];
  for (const g of GRILLE) {
    if (!contrainte(mo, fam, g)) continue;
    for (const r of mo === 'am' ? [0.5] : PARTS_MOTS) {
      const s = scoreRapide(cs, mo, poidsV2(mo, g, r));
      essais.push({ g, r, mrr: s.mrr, r10: s.r10 });
    }
  }
  essais.sort((x, y) => y.mrr - x.mrr || y.r10 - x.r10 || (JSON.stringify([x.g, x.r]) < JSON.stringify([y.g, y.r]) ? -1 : 1));
  const b = essais[0];
  return { g: b.g, partMots: b.r, mrrApp: arrondi(b.mrr)!, rappelApp: arrondi(b.r10)!, dix: essais.slice(0, 10).map((e) => ({ g: e.g, partMots: e.r, mrr: arrondi(e.mrr)! })) };
}
// Amertume : jugé sur les substituts des amérisants (usage BM : bittering) ; arôme chaud et à froid : sur tous les houblons.
const appris: Record<string, Record<Moment3, Appris>> = { v2: {} as never, v2libre: {} as never };
const parFamille: Record<Fam, Record<Moment3, Appris>> = {} as never;
for (const f of FAMILLES) {
  parFamille[f] = {} as never;
  for (const mo of MOMENTS) parFamille[f][mo] = apprendre(mo, mo === 'am' ? SOUS_ENSEMBLES['amérisants (usage BM : bittering)'].app : app, f);
  VARIANTES[`fam-${f}`] = Object.fromEntries(MOMENTS.map((mo) => [mo, { w: poidsV2(mo, parFamille[f][mo].g, parFamille[f][mo].partMots) }])) as Record<Moment3, Jeu>;
}
// Référence (b) comme garde : parmi les familles d'a priori, v2 prend, à chaque moment d'arôme, la meilleure sur la moitié d'apprentissage
// dont la liste D est retrouvée aux trois quarts de l'écart A → C (dans les 10 premiers, à froid). (b) n'est donc pas une épreuve tenue à
// l'écart : c'est l'écart (a) du contrôle qui l'est. À l'amertume, (b) n'existe pas (D est une liste au dry hop) : v2 = famille k1 (amertume ≥ 0,4).
const bDans10 = (variante: string, mo: Moment3) => phares.reduce((s, p) => s + rangsDe(p.i, p.d, clesMethode(p.i, mo, 'v2', variante)).filter((r) => r <= 10).length, 0);
const bA = phares.reduce((s, p) => s + rangsDe(p.i, p.d, clesMethode(p.i, 'fr', 'A')).filter((r) => r <= 10).length, 0);
const bC = phares.reduce((s, p) => s + rangsDe(p.i, p.d, clesMethode(p.i, 'fr', 'C')).filter((r) => r <= 10).length, 0);
const SEUIL_B = Math.ceil(bA + 0.75 * (bC - bA));
const choisie: Record<Moment3, Fam> = { am: 'k1', ch: 'k1', fr: 'k1' };
for (const mo of ['ch', 'fr'] as const) {
  const ok = (['k1', 'k2', 'k3', 'k4'] as Fam[]).filter((f) => bDans10(`fam-${f}`, mo) >= SEUIL_B);
  const meilleur = (fs: Fam[]) => [...fs].sort((x, y) => parFamille[y][mo].mrrApp - parFamille[x][mo].mrrApp || (x < y ? -1 : 1))[0];
  choisie[mo] = ok.length ? meilleur(ok) : (['k1', 'k2', 'k3', 'k4'] as Fam[]).sort((x, y) => bDans10(`fam-${y}`, mo) - bDans10(`fam-${x}`, mo) || (x < y ? -1 : 1))[0];
}
for (const mo of MOMENTS) { appris.v2[mo] = parFamille[choisie[mo]][mo]; appris.v2libre[mo] = parFamille.libre[mo]; }
// Variante « amertume apprise sur tous les houblons » : garde-fou contre un réglage ajusté sur 20 amérisants.
const amerTous = apprendre('am', app, 'k1');
for (const nomV of ['v2', 'v2libre']) VARIANTES[nomV] = Object.fromEntries(MOMENTS.map((mo) => [mo, { w: poidsV2(mo, appris[nomV][mo].g, appris[nomV][mo].partMots) }])) as Record<Moment3, Jeu>;
VARIANTES['v2tous'] = { ...VARIANTES.v2, am: { w: poidsV2('am', amerTous.g, amerTous.partMots) } };
chrono('apprentissage');

// ---------- Résultats (a) ----------
const meths: [string, Methode, string | undefined][] = [['A (actuel)', 'A', undefined], ['C (mots, λ 0,25)', 'C', undefined], ['v2', 'v2', 'v2'], ['v2 libre (sans contrainte)', 'v2libre', 'v2libre'], ['v2 (amertume apprise sur tous)', 'v2', 'v2tous']];
const resultatsA: Record<string, Record<string, Record<string, unknown>>> = {};
for (const mo of MOMENTS) {
  resultatsA[mo] = {};
  for (const [lib, ens] of Object.entries(SOUS_ENSEMBLES)) {
    if (mo !== 'am' && lib !== 'tous les houblons') continue;
    const out: Record<string, unknown> = {};
    for (const part of ['app', 'ctl', 'tous'] as const) {
      const cs = ens[part];
      const A = phMeth(cs, mo, 'A'), C = phMeth(cs, mo, 'C');
      const row: Record<string, unknown> = {};
      for (const [l, meth, va] of meths) {
        const ph = phMeth(cs, mo, meth, va);
        row[l] = { ...ligne(ph, l.startsWith('A') ? undefined : A), contreC: l.startsWith('A') || l.startsWith('C') ? null : ic(ph, C), contreCPoint: l.startsWith('A') || l.startsWith('C') ? null : { mrr: arrondi(stat(ph).mrr - stat(C).mrr), rappel10: arrondi(stat(ph).rappel10 - stat(C).rappel10) } };
      }
      out[part] = row;
    }
    resultatsA[mo][lib] = out;
  }
}
// Hasard (même nombre de substituts, tirages indépendants, 20 par houblon) : repère.
const hasard = (cs: Cible[]) => { const rnd = mulberry32(GRAINE + 1); const ph: PH[] = []; for (let t = 0; t < 20; t++) for (const c of cs) ph.push(phDe(c.attendus.map(() => 1 + Math.floor(rnd() * (N - 1))))); return stat(ph); };
const reperes = { tous: hasard(ctl), amer: hasard(SOUS_ENSEMBLES['amérisants (usage BM : bittering)'].ctl) };
chrono('résultats (a)');

// ---------- Ce que chaque variable ajoute : v2 sans elle ----------
const sansVar = (mo: Moment3, v: number | number[]): Jeu => { const w = Float64Array.from(VARIANTES.v2[mo].w); for (const k of Array.isArray(v) ? v : [v]) w[k] = 0; return { w }; };
function phAvec(cs: Cible[], mo: Moment3, jeu: Jeu): PH[] {
  return cs.map((c) => { scoresV2(c.i, mo, jeu.w, tmpScore); return phDe(rangsDe(c.i, c.attendus, cles(c.i, tmpScore, FAIBLE.subarray(c.i * N, c.i * N + N), mo === 'am' ? DEMO_60[c.i].demo : null))); });
}
const ablation: Record<string, unknown[]> = {};
const lignesAbl: { nom: string; ids: number[] }[] = [...VARS.map((v, i) => ({ nom: v, ids: [i] })), ...GROUPE.map((g) => ({ nom: `groupe ${g.nom}`, ids: g.ids }))];
for (const mo of MOMENTS) {
  for (const [lib, ens] of Object.entries(SOUS_ENSEMBLES)) {
    if (mo !== 'am' && lib !== 'tous les houblons') continue;
    const base = phAvec(ens.ctl, mo, VARIANTES.v2[mo]);
    ablation[`${mo} | ${lib}`] = lignesAbl.map((l) => {
      const ph = phAvec(ens.ctl, mo, sansVar(mo, l.ids)), s = stat(ph), sb = stat(base);
      const poids = l.ids.reduce((x, k) => x + VARIANTES.v2[mo].w[k], 0);
      return { variable: l.nom, poids: arrondi(poids, 3), mrrSans: arrondi(s.mrr), ecartMrr: arrondi(s.mrr - sb.mrr), ecartRappel10: arrondi(s.rappel10 - sb.rappel10), ic: ic(ph, base) };
    });
  }
}
chrono('ablation');

// ---------- Réglages essayés (toutes les familles d'a priori, rien n'est caché) ----------
const essais = Object.fromEntries(MOMENTS.map((mo) => {
  const ensA = mo === 'am' ? SOUS_ENSEMBLES['amérisants (usage BM : bittering)'] : SOUS_ENSEMBLES['tous les houblons'];
  const refA = phMeth(ensA.ctl, mo, 'A'), refC = phMeth(ensA.ctl, mo, 'C');
  return [mo, FAMILLES.map((f) => {
    const jeu = VARIANTES[`fam-${f}`][mo], ph = phAvec(ensA.ctl, mo, jeu), s = stat(ph);
    const rb = phares.flatMap((p) => rangsDe(p.i, p.d, clesMethode(p.i, mo, 'v2', `fam-${f}`)));
    const tousCtl = mo === 'am' ? stat(phAvec(SOUS_ENSEMBLES['tous les houblons'].ctl, mo, jeu)).mrr : null;
    return {
      famille: f, definition: DEFINITION_FAMILLES[f], g: parFamille[f][mo].g, partMots: parFamille[f][mo].partMots, mrrApp: parFamille[f][mo].mrrApp, rappelApp: parFamille[f][mo].rappelApp,
      mrrCtl: arrondi(s.mrr), rappel10Ctl: arrondi(s.rappel10), rangMedianCtl: s.rangMedian, ecartA: ic(ph, refA).mrr, ecartAPoint: arrondi(s.mrr - stat(refA).mrr), ecartC: ic(ph, refC).mrr, ecartCPoint: arrondi(s.mrr - stat(refC).mrr),
      mrrCtlTous: arrondi(tousCtl), bDans10: rb.filter((r) => r <= 10).length, bRangMedian: mediane(rb), retenu: f === choisie[mo] && f !== 'libre',
    };
  })];
}));

// ---------- Référence (b) : les 3 premiers de D ----------
const refB: Record<string, unknown> = {};
const methB: [string, Methode, string | undefined][] = [['A (actuel)', 'A', undefined], ['C (mots, λ 0,25)', 'C', undefined], ['v2', 'v2', 'v2'], ['v2 libre', 'v2libre', 'v2libre']];
for (const mo of MOMENTS) {
  const out: Record<string, unknown> = {};
  for (const [l, meth, va] of methB) {
    const parPhare = phares.map((p) => ({ phare: p.nom, rangs: rangsDe(p.i, p.d, clesMethode(p.i, mo, meth, va)) }));
    const tous = parPhare.flatMap((x) => x.rangs);
    out[l] = { parPhare, dansLes10: tous.filter((r) => r <= 10).length, sur: tous.length, rangMedian: mediane(tous), rangMoyen: arrondi(moyenne(tous), 1) };
  }
  refB[mo] = out;
}

// ---------- Les 10 premiers de v2 pour les 8 phares, aux 3 moments ----------
const marque = (p: Phare, j: number) => ({ bm: cibles.find((c) => c.i === p.i)?.attendus.includes(j) ?? false, d: p.d.includes(j) });
const topPhares = phares.map((p) => ({
  phare: p.nom, d: p.dNoms, bm: (cibles.find((c) => c.i === p.i)?.attendus ?? []).map(nom),
  parMoment: Object.fromEntries(MOMENTS.map((mo) => {
    const K = clesMethode(p.i, mo, 'v2', 'v2'), sc = new Int16Array(N); scoresV2(p.i, mo, VARIANTES.v2[mo].w, sc);
    const top = ordreDe(p.i, K).slice(0, 10);
    const rangBM = (cibles.find((c) => c.i === p.i)?.attendus ?? []).map((j) => ({ nom: nom(j), rang: rangsDe(p.i, [j], K)[0] }));
    return [mo, { dix: top.map((j, k) => ({ rang: k + 1, nom: nom(j), score: sc[j], ...marque(p, j) })), rangsBM: rangBM, rangsD: p.d.map((j) => ({ nom: nom(j), rang: rangsDe(p.i, [j], K)[0] })) }];
  })),
}));

// ---------- Listes à 60′ : A et v2, pour les 8 phares et 8 amérisants courants ----------
const AMERISANTS = ['beermaverick-magnum-us', 'beermaverick-nugget', 'beermaverick-columbus', 'beermaverick-warrior', 'beermaverick-herkules', 'beermaverick-apollo', 'beermaverick-summit', 'beermaverick-target'];
const w60 = VARIANTES.v2.am.w;
const wTot = w60.reduce((a, b) => a + b, 0);
function listeCote(o: number, meth: 'A' | 'v2') {
  const K = clesMethode(o, 'am', meth, 'v2'), ordre = ordreDe(o, K).slice(0, 10);
  const sc = new Int16Array(N); if (meth === 'v2') scoresV2(o, 'am', w60, sc);
  const bm = new Set(cibles.find((c) => c.i === o)?.attendus ?? []);
  return ordre.map((j, k) => {
    const h = CATALOGUE[j];
    const base = { rang: k + 1, nom: h.name, id: h.id, score: meth === 'A' ? engine.am[o].score[j] : sc[j], alpha: h.alpha, usage: h.purpose ?? null, dansBeerMaverick: bm.has(j), aromatiqueDeconseille: engine.am[o].demo[j] === 1 };
    if (meth === 'A') return base;
    const P = PAIRES[1], b = (o * N + j) * NV;
    let known = 0; const inconnues: string[] = [];
    for (let v = 0; v < NV; v++) { if (w60[v] <= 0) continue; if (Number.isNaN(P[b + v])) inconnues.push(VARS[v]); else known += w60[v]; }
    const parGroupe = Object.fromEntries(GROUPE.map((g) => { let tw = 0, num = 0; for (const v of g.ids) if (w60[v] > 0 && !Number.isNaN(P[b + v])) { tw += w60[v]; num += w60[v] * P[b + v]; } return [g.nom, tw > 0 ? Math.round((100 * num) / tw) : null]; }));
    return { ...base, parGroupe, couverturePoids: arrondi(known / wTot, 2), variablesInconnues: inconnues };
  });
}
const cibles60 = [...phares.map((p) => ({ nom: p.nom, i: p.i, sorte: 'phare' })), ...AMERISANTS.map((id) => ({ nom: CATALOGUE[idx.get(id)!].name, i: idx.get(id)!, sorte: 'amérisant courant' }))];
const listes60 = {
  lecture: 'Dix premiers au 60′ (moment d’amertume : premier moût, 60′, 30′, 15′ donnent le même classement) : A = substitutes() de l’app ; v2 = moteur v2 (phase 1). Sans stock : le catalogue entier. « dansBeerMaverick » : le substitut figure sur la page Beer Maverick de l’original (référence imparfaite). « aromatiqueDeconseille » : produit d’arôme ou houblon aromatique, passé derrière les amérisants (règle du moteur actuel, conservée). Le brasseur les juge dans son écran u4, dessiné à 60′ ; il n’a pas encore de liste de référence à lui à ce moment.',
  poidsV2: { groupe: appris.v2.am.g, variables: Object.fromEntries(VARS.map((v, i) => [v, arrondi(w60[i], 3)])) },
  houblons: cibles60.map((c) => ({ houblon: c.nom, id: ids[c.i], sorte: c.sorte, alpha: CATALOGUE[c.i].alpha, usage: CATALOGUE[c.i].purpose ?? null, A: listeCote(c.i, 'A'), v2: listeCote(c.i, 'v2') })),
};
// Recouvrement des dix premiers, A contre v2, à 60′.
const recouvrement = listes60.houblons.map((h) => ({ houblon: h.houblon, communs: h.A.filter((x) => h.v2.some((y) => y.id === x.id)).length }));
chrono('listes');

// ---------- Contrôles de la phase 2 ----------
const sel = (r: Record<string, Record<string, Record<string, unknown>>>, mo: Moment3, ens: string, part: string, l: string) => (r[mo][ens][part] as Record<string, { mrr: number }>)[l];
const verdict = {
  amertume60: {
    amerisantsControle: { A: sel(resultatsA, 'am', 'amérisants (usage BM : bittering)', 'ctl', 'A (actuel)').mrr, v2: sel(resultatsA, 'am', 'amérisants (usage BM : bittering)', 'ctl', 'v2').mrr },
    tousControle: { A: sel(resultatsA, 'am', 'tous les houblons', 'ctl', 'A (actuel)').mrr, v2: sel(resultatsA, 'am', 'tous les houblons', 'ctl', 'v2').mrr },
  },
  chaud: { C: sel(resultatsA, 'ch', 'tous les houblons', 'ctl', 'C (mots, λ 0,25)').mrr, v2: sel(resultatsA, 'ch', 'tous les houblons', 'ctl', 'v2').mrr, A: sel(resultatsA, 'ch', 'tous les houblons', 'ctl', 'A (actuel)').mrr },
  froid: { C: sel(resultatsA, 'fr', 'tous les houblons', 'ctl', 'C (mots, λ 0,25)').mrr, v2: sel(resultatsA, 'fr', 'tous les houblons', 'ctl', 'v2').mrr, A: sel(resultatsA, 'fr', 'tous les houblons', 'ctl', 'A (actuel)').mrr },
};

const resultats = {
  issue: 181, voie: 'e2-moteur-substitution', graine: GRAINE, rééchantillons: BOOT,
  moitie: 'parité de l’indice du houblon parmi les 217 triés par id : 0 apprentissage, 1 contrôle',
  effectifs: { cibles: cibles.length, apprentissage: app.length, controle: ctl.length, amerisantsApprentissage: SOUS_ENSEMBLES['amérisants (usage BM : bittering)'].app.length, amerisantsControle: SOUS_ENSEMBLES['amérisants (usage BM : bittering)'].ctl.length },
  donnees: sources, sigma: Object.fromEntries(Object.entries(sigma).map(([k, v]) => [k, arrondi(v, 2)])),
  profils: PROFILS, appris, amerTous, essais, seuilB: { A: bA, C: bC, seuil: SEUIL_B, famillesChoisies: choisie, definitions: DEFINITION_FAMILLES }, poids: Object.fromEntries(Object.entries(VARIANTES).map(([k, v]) => [k, Object.fromEntries(MOMENTS.map((mo) => [mo, Object.fromEntries(VARS.map((x, i) => [x, arrondi(v[mo].w[i], 3)]))]))])),
  hasard: reperes, resultatsA, ablation, refB, topPhares, recouvrement60: recouvrement, verdict,
};
const json = JSON.stringify(resultats, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'resultats.json'), json);
writeFileSync(join(SORTIE, 'listes-60.json'), JSON.stringify(listes60, null, 1) + '\n');
writeFileSync(join(SORTIE, 'rapport.md'), rapportV2(resultats as never, LIB_MOMENT));
process.stdout.write(`sha256 ${createHash('sha256').update(json).digest('hex')}\n`);
chrono('fin');
