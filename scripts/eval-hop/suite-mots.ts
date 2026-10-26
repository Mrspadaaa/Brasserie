// Suite d'e1 (#181) après l'avis du conseil sur l'option « mots » : λ choisi sur une moitié et jugé sur l'autre, intervalles à 95 %,
// variante « mots hors famille seulement », candidats remontés par un seul mot, garde, explication de Motueka / Riwaka / Nelson Sauvin,
// listes avant/après. Lancement : npx vite-node scripts/eval-hop/suite-mots.ts -- --sortie=<dossier>
// Sortie : suite-mots.json, suite-mots.md, listes-lambda.json (déterministes). Mesure seulement : src/domain n'est pas touché.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, bmLienId } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES } from '../../src/domain/hopIndex/v4/families';
import type { Substitute, SubstitutionWeights } from '../../src/domain/hopIndex/v4';
import { arrondi, mediane, moyenne, mulberry32, premierRang, rangReciproque, rappelA, type Obs } from './metriques';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/e1-banc-eval/resultats');
const GRAINE = 181;
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const parId = new Map(CATALOGUE.map((h) => [h.id, h]));
const nom = (id: string) => parId.get(id)?.name ?? id;
const COLL = new Intl.Collator('fr');
const W: SubstitutionWeights = { arome: 0.6, huiles: 0.3, amertume: 0.1 }; // poids d'arôme du moteur (10′, whirlpool, dry hop)

// ---------- Vérité de terrain (comme banc-eval) ----------
interface Cible { id: string; attendus: string[] }
const cibles: Cible[] = CATALOGUE.filter((h) => h.bm?.substituts?.length).map((h) => ({
  id: h.id, attendus: [...new Set(h.bm!.substituts!.map((l) => bmLienId(l)).filter((x): x is string => !!x && x !== h.id && parId.has(x)))],
})).filter((c) => c.attendus.length > 0).sort((a, b) => (a.id < b.id ? -1 : 1));
const moitie = (c: Cible) => cibles.indexOf(c) % 2; // 0 : apprentissage, 1 : contrôle

// ---------- Mots de chaque houblon ----------
const norm = (x: string) => x.toLowerCase().replace(/[_-]+/g, ' ');
const tous = new Map<string, Set<string>>(), sans = new Map<string, Set<string>>();
for (const h of CATALOGUE) {
  const w = m.familyWords(h.id), avec = new Set<string>(), s = new Set<string>();
  for (const f of FAMILIES) for (const row of w.mots[f]) for (const x of row.mots) avec.add(norm(x));
  for (const x of w.sansFamille) s.add(norm(x.mot));
  tous.set(h.id, new Set([...avec, ...s]));
  sans.set(h.id, new Set([...s].filter((x) => !avec.has(x))));
}
const N = CATALOGUE.length;
const dfDe = (ens: Map<string, Set<string>>) => { const df = new Map<string, number>(); for (const s of ens.values()) for (const w of s) df.set(w, (df.get(w) ?? 0) + 1); return df; };
const dfTous = dfDe(tous), dfSans = dfDe(sans);
const idfDe = (df: Map<string, number>, w: string, plafondDf = 0) => Math.log((N + 1) / (Math.max(df.get(w) ?? 0, plafondDf) + 1));

// ---------- Similarité de mots ----------
type Genre = 'tous' | 'sans';
interface Garde { min: number; plafondDf: number } // min : mots partagés au moins ; plafondDf : un mot compte comme s'il apparaissait dans au moins ce nombre de houblons
const AUCUNE: Garde = { min: 0, plafondDf: 0 };
const cacheCos = new Map<string, { cos: number | null; partages: string[] }>();
function simMots(a: string, b: string, genre: Genre, g: Garde): { cos: number | null; partages: string[] } {
  const cle = `${genre}|${g.min}|${g.plafondDf}|${a}|${b}`;
  const hit = cacheCos.get(cle);
  if (hit) return hit;
  const ens = genre === 'tous' ? tous : sans, df = genre === 'tous' ? dfTous : dfSans;
  const A = ens.get(a)!, B = ens.get(b)!;
  let out: { cos: number | null; partages: string[] };
  if (!A.size || !B.size) out = { cos: null, partages: [] };
  else {
    let dot = 0, na = 0, nb = 0; const part: string[] = [];
    for (const w of A) { const x = idfDe(df, w, g.plafondDf); na += x * x; if (B.has(w)) { dot += x * x; part.push(w); } }
    for (const w of B) { const x = idfDe(df, w, g.plafondDf); nb += x * x; }
    out = { cos: part.length < g.min ? 0 : na && nb ? dot / Math.sqrt(na * nb) : 0, partages: part.sort() };
  }
  cacheCos.set(cle, out);
  return out;
}

// ---------- Classements du moteur et réplique hors ligne ----------
interface Ligne { k: string; name: string; a: number | null; o: number | null; b: number | null; faible: boolean; demotion: boolean; score: number }
const lignesCache = new Map<string, Ligne[]>();
function lignesDe(id: string): Ligne[] {
  let l = lignesCache.get(id);
  if (!l) {
    const r = m.substitutes(id, { moment: 'dryActive' });
    l = r.remplacants.map((s: Substitute) => ({ k: s.key, name: s.name, a: s.composantes.arome, o: s.composantes.huiles, b: s.composantes.amertume, faible: s.couverture.fiabilite === 'faible', demotion: !!s.amertumeDeconseillee, score: s.score }));
    lignesCache.set(id, l);
  }
  return l;
}
const scoreHL = (l: Ligne, a: number | null): number => {
  let tw = 0, num = 0;
  if (a !== null) { tw += W.arome; num += W.arome * a; }
  if (l.o !== null) { tw += W.huiles; num += W.huiles * l.o; }
  if (l.b !== null) { tw += W.amertume; num += W.amertume * l.b; }
  return tw > 0 ? Math.round(num / tw) : 0;
};
const avant = (x: Ligne, sx: number, y: Ligne, sy: number) => (x.faible !== y.faible ? !x.faible : x.demotion !== y.demotion ? !x.demotion : sx !== sy ? sx > sy : COLL.compare(x.name, y.name) < 0);
/** Arôme d'un candidat sous une variante : λ × arôme du moteur + (1 − λ) × 100 × cosinus des mots ; repli sur le moteur sans mots. */
interface Variante { genre: Genre; lambda: number; garde: Garde }
const aromeSous = (cid: string, l: Ligne, v: Variante): { a: number | null; sim: ReturnType<typeof simMots> } => {
  const sim = simMots(cid, l.k, v.genre, v.garde);
  if (v.lambda >= 1 || l.a === null || sim.cos === null) return { a: l.a, sim };
  return { a: Math.round(v.lambda * l.a + (1 - v.lambda) * 100 * sim.cos), sim };
};
/** Ordre complet des candidats d'un original sous une variante (comme le moteur : clés puis score entier puis nom). */
function classerSous(cid: string, v: Variante): { ordre: string[]; lignes: Map<string, { l: Ligne; a: number | null; score: number; partages: string[] }> } {
  const L = lignesDe(cid);
  // λ = 1 : le moteur lui-même (son ordre exact) ; sinon réplique hors ligne sur les composantes rendues (entiers : ±1 rang possible).
  if (v.lambda >= 1) return { ordre: L.map((l) => l.k), lignes: new Map(L.map((l) => [l.k, { l, a: l.a, score: l.score, partages: simMots(cid, l.k, v.genre, v.garde).partages }])) };
  const det = L.map((l) => { const { a, sim } = aromeSous(cid, l, v); return { l, a, score: scoreHL(l, a), partages: sim.partages }; });
  const idx = det.map((_, i) => i).sort((i, j) => (avant(det[i].l, det[i].score, det[j].l, det[j].score) ? -1 : avant(det[j].l, det[j].score, det[i].l, det[i].score) ? 1 : 0));
  return { ordre: idx.map((i) => det[i].l.k), lignes: new Map(det.map((d) => [d.l.k, d])) };
}
const cacheOrdre = new Map<string, ReturnType<typeof classerSous>>();
const cleV = (cid: string, v: Variante) => `${cid}|${v.genre}|${v.lambda}|${v.garde.min}|${v.garde.plafondDf}`;
const ordreSous = (cid: string, v: Variante) => { const k = cleV(cid, v); let o = cacheOrdre.get(k); if (!o) cacheOrdre.set(k, (o = classerSous(cid, v))); return o; };

// ---------- Métriques avec intervalles ----------
interface PH { rr: number; r10: number; r5: number; premier: number } // par houblon
const parHoublon = (cs: Cible[], v: Variante): PH[] => cs.map((c) => {
  const o = ordreSous(c.id, v).ordre, obs: Obs = { rangs: c.attendus.map((a) => { const i = o.indexOf(a); return i < 0 ? null : i + 1; }) };
  return { rr: rangReciproque(obs), r10: rappelA(obs, 10), r5: rappelA(obs, 5), premier: premierRang(obs) ?? 999 };
});
const stat = (ph: PH[]) => ({ mrr: moyenne(ph.map((p) => p.rr))!, rappel10: moyenne(ph.map((p) => p.r10))!, rangMedian: mediane(ph.map((p) => p.premier))! });
const B = 1000;
/** Intervalle à 95 % par rééchantillonnage (graine fixe) des houblons ; `ref` : écart apparié à la référence (le moteur). */
function ic(ph: PH[], ref?: PH[]) {
  const rnd = mulberry32(GRAINE + 7), n = ph.length;
  const tirages: { mrr: number[]; r10: number[]; med: number[] } = { mrr: [], r10: [], med: [] };
  for (let b = 0; b < B; b++) {
    const idx = Array.from({ length: n }, () => Math.floor(rnd() * n));
    const s = stat(idx.map((i) => ph[i]));
    if (ref) { const sr = stat(idx.map((i) => ref[i])); tirages.mrr.push(s.mrr - sr.mrr); tirages.r10.push(s.rappel10 - sr.rappel10); tirages.med.push(s.rangMedian - sr.rangMedian); }
    else { tirages.mrr.push(s.mrr); tirages.r10.push(s.rappel10); tirages.med.push(s.rangMedian); }
  }
  const q = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return [arrondi(s[Math.floor(0.025 * B)], 3), arrondi(s[Math.floor(0.975 * B)], 3)]; };
  return { mrr: q(tirages.mrr), rappel10: q(tirages.r10), rangMedian: q(tirages.med) };
}
const ligneMetrique = (cs: Cible[], v: Variante, moteur: Variante) => {
  const ph = parHoublon(cs, v), pr = parHoublon(cs, moteur), s = stat(ph);
  return { n: cs.length, mrr: arrondi(s.mrr), rappel10: arrondi(s.rappel10), rangMedian: s.rangMedian, ic95: ic(ph), ecartAuMoteur_ic95: v.lambda >= 1 ? null : ic(ph, pr) };
};

// ---------- 1. λ choisi sur une moitié, jugé sur l'autre ----------
const LAMBDAS = [1, 0.75, 0.5, 0.25, 0];
const MOTEUR: Variante = { genre: 'tous', lambda: 1, garde: AUCUNE };
const app = cibles.filter((c) => moitie(c) === 0), ctl = cibles.filter((c) => moitie(c) === 1);
const GENRES: [Genre, string][] = [['tous', 'tous les mots'], ['sans', 'mots hors famille seulement']];
const choixLambda: Record<string, unknown> = {};
const choisis: Record<string, { lambda: number; inverse: number }> = {};
const tableLambda: Record<string, unknown> = {};
for (const [genre, lib] of GENRES) {
  const rows: Record<string, unknown> = {};
  const mrrApp = new Map<number, number>(), mrrCtl = new Map<number, number>();
  for (const L of LAMBDAS) {
    const v: Variante = { genre, lambda: L, garde: AUCUNE };
    mrrApp.set(L, stat(parHoublon(app, v)).mrr); mrrCtl.set(L, stat(parHoublon(ctl, v)).mrr);
    rows[`λ=${L}`] = { apprentissage: ligneMetrique(app, v, MOTEUR), controle: ligneMetrique(ctl, v, MOTEUR), tous: ligneMetrique(cibles, v, MOTEUR) };
  }
  // λ = 1 est le moteur : un λ < 1 n'est « choisi » que s'il bat strictement le moteur sur la moitié d'apprentissage.
  const best = (mp: Map<number, number>) => [...mp.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  choisis[genre] = { lambda: best(mrrApp), inverse: best(mrrCtl) };
  tableLambda[lib] = rows;
  choixLambda[lib] = { choisiSurMoitie0_jugeSurMoitie1: best(mrrApp), choisiSurMoitie1_jugeSurMoitie0: best(mrrCtl) };
}

// ---------- 2. Candidats remontés par un seul mot ----------
const L_RETENU = choisis.tous.lambda < 1 ? choisis.tous.lambda : 0.25;
const toutesCibles = CATALOGUE.map((h) => h.id);
function entrants(v: Variante) {
  const lignes: { original: string; candidat: string; rang: number; rangMoteur: number | null; partages: string[]; idfMax: number }[] = [];
  const df = v.genre === 'tous' ? dfTous : dfSans;
  for (const id of toutesCibles) {
    const base = ordreSous(id, MOTEUR).ordre, nouv = ordreSous(id, v);
    for (const k of nouv.ordre.slice(0, 10)) {
      const iM = base.indexOf(k);
      if (iM >= 0 && iM < 10) continue;
      const part = nouv.lignes.get(k)!.partages;
      lignes.push({ original: id, candidat: k, rang: nouv.ordre.indexOf(k) + 1, rangMoteur: iM < 0 ? null : iM + 1, partages: part, idfMax: arrondi(Math.max(0, ...part.map((w) => idfDe(df, w))), 2)! });
    }
  }
  return lignes;
}
const vRetenu: Variante = { genre: 'tous', lambda: L_RETENU, garde: AUCUNE };
const ent = entrants(vRetenu);
const un = ent.filter((e) => e.partages.length === 1), zero = ent.filter((e) => e.partages.length === 0);
const exemplesUn = [...un].sort((a, b) => b.idfMax - a.idfMax || (a.original + a.candidat < b.original + b.candidat ? -1 : 1)).slice(0, 25)
  .map((e) => ({ original: nom(e.original), candidat: nom(e.candidat), rang: e.rang, rangMoteur: e.rangMoteur, mot: e.partages[0], idf: e.idfMax }));
const dankCannabis = ent.filter((e) => e.partages.some((w) => /dank|cannabis/.test(w))).map((e) => ({ original: nom(e.original), candidat: nom(e.candidat), rang: e.rang, rangMoteur: e.rangMoteur, partages: e.partages }));
const GARDES: [string, Garde][] = [['aucune', AUCUNE], ['au moins 2 mots partagés', { min: 2, plafondDf: 0 }], ['plafond de rareté (un mot compte au moins comme df = 8)', { min: 0, plafondDf: 8 }], ['les deux', { min: 2, plafondDf: 8 }]];
const gardes = GARDES.map(([lib, g]) => {
  const v: Variante = { genre: 'tous', lambda: L_RETENU, garde: g }, e = entrants(v);
  return { garde: lib, lambda: L_RETENU, entrantsDansLesDix: e.length, dontUnSeulMot: e.filter((x) => x.partages.length === 1).length, dontAucunMot: e.filter((x) => x.partages.length === 0).length,
    apprentissage: ligneMetrique(app, v, MOTEUR), controle: ligneMetrique(ctl, v, MOTEUR), tous: ligneMetrique(cibles, v, MOTEUR) };
});

// ---------- 3. Nelson Sauvin, Motueka, Riwaka : pourquoi ce rang ----------
const NS = 'beermaverick-nelson-sauvin';
const expliquer = (original: string, sujets: string[]) => sujets.map((s) => ({
  candidat: nom(s),
  parLambda: Object.fromEntries([...GENRES.flatMap(([genre]) => LAMBDAS.map((L) => [genre, L] as const))].map(([genre, L]) => {
    const v: Variante = { genre, lambda: L, garde: AUCUNE }, o = ordreSous(original, v), d = o.lignes.get(s)!;
    return [`${genre === 'tous' ? 'tous' : 'hors-famille'} λ=${L}`, { rang: o.ordre.indexOf(s) + 1, arome: d.a, aromeMoteur: d.l.a, score: d.score, motsPartages: d.partages }];
  })),
  cosinusFamilles: arrondi((lignesDe(original).find((l) => l.k === s)?.a ?? NaN) / 100, 2),
  motsDuCandidat: [...tous.get(s)!].sort(),
}));
const sujetsNS = ['hallertau-blanc', 'enigma', 'motueka', 'riwaka'].map((x) => `beermaverick-${x}`);
const explications = {
  original: nom(NS), motsOriginal: [...tous.get(NS)!].sort(), motsSansFamilleOriginal: [...sans.get(NS)!].sort(),
  candidats: expliquer(NS, sujetsNS),
  tete: Object.fromEntries([0.5, 0.25].map((L) => { const v: Variante = { genre: 'tous', lambda: L, garde: AUCUNE }, o = ordreSous(NS, v); return [`tous λ=${L}`, o.ordre.slice(0, 10).map((k) => ({ nom: nom(k), motsPartages: o.lignes.get(k)!.partages })).slice(0, 5)]; })),
  motueka: { original: 'Motueka', motsOriginal: [...tous.get('beermaverick-motueka')!].sort(), candidatsBM: ['saaz-us', 'sterling'].map((x) => `beermaverick-${x}`).map((s) => ({ candidat: nom(s),
    parLambda: Object.fromEntries(LAMBDAS.map((L) => { const v: Variante = { genre: 'tous', lambda: L, garde: AUCUNE }, o = ordreSous('beermaverick-motueka', v); return [`λ=${L}`, { rang: o.ordre.indexOf(s) + 1, motsPartages: o.lignes.get(s)!.partages }]; })) })) },
};

// ---------- 4. Listes avant/après ----------
const GARDE_RETENUE: Garde = { min: 2, plafondDf: 8 };
const lambdaPrudent: Variante = { genre: 'tous', lambda: 0.5, garde: GARDE_RETENUE };
const vMeilleur: Variante = { genre: 'tous', lambda: L_RETENU, garde: GARDE_RETENUE };
const LISTES: [string, string][] = [['Nelson Sauvin', NS], ['Motueka', 'beermaverick-motueka'], ['Citra', 'beermaverick-citra'], ['Galaxy', 'beermaverick-galaxy'], ['Saaz (CZ)', 'beermaverick-saaz-cz'],
  ['Mosaic', 'beermaverick-mosaic'], ['Simcoe', 'beermaverick-simcoe'], ['Cascade', 'beermaverick-cascade'], ['Fuggle', 'beermaverick-fuggle'], ['Magnum (US)', 'beermaverick-magnum-us'], ['Willamette', 'beermaverick-willamette']];
const liste = (id: string, v: Variante) => {
  const o = ordreSous(id, v), tmo = tous.get(id)!;
  return o.ordre.slice(0, 10).map((k, i) => { const h = parId.get(k)!, d = o.lignes.get(k)!;
    return { rang: i + 1, nom: h.name, alpha: h.alpha, usage: h.purpose ?? null, score: d.score, motsPartages: [...tous.get(k)!].filter((w) => tmo.has(w)).sort() }; });
};
const listes = LISTES.filter(([, id]) => parId.has(id)).map(([lib, id]) => ({
  houblon: lib, alpha: parId.get(id)!.alpha, usage: parId.get(id)!.purpose ?? null,
  moteur: liste(id, MOTEUR),
  reglage_retenu: liste(id, vMeilleur),
  reglage_prudent: liste(id, lambdaPrudent),
}));

// ---------- Sortie ----------
const reglage = (v: Variante) => ({ lambda: v.lambda, genre: v.genre, garde: v.garde, apprentissage: ligneMetrique(app, v, MOTEUR), controle: ligneMetrique(ctl, v, MOTEUR), tous: ligneMetrique(cibles, v, MOTEUR) });
const retenuM = reglage(vMeilleur), prudent = reglage(lambdaPrudent);
const resultats = {
  suite: { issue: 181, graine: GRAINE, rééchantillons: B, moitie: 'parité de l’indice du houblon parmi les 217 triés par id : 0 apprentissage (109), 1 contrôle (108)', retenu: { genre: 'tous', lambda: L_RETENU, garde: GARDE_RETENUE }, prudent: { genre: 'tous', lambda: 0.5, garde: GARDE_RETENUE }, gardeLecture: 'min : mots partagés au moins (sinon le terme « mots » vaut 0) ; plafondDf : un mot compte comme s’il figurait dans au moins ce nombre de fiches de houblons' },
  choix: choixLambda, lambda: tableLambda, unSeulMot: { nEntrants: ent.length, unSeulMot: un.length, aucunMot: zero.length, exemples: exemplesUn, dankCannabis, gardes }, retenu: retenuM, prudent, explications,
};
const json = JSON.stringify(resultats, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'suite-mots.json'), json);
writeFileSync(join(SORTIE, 'listes-lambda.json'), JSON.stringify({ lecture: 'Dix premiers de substitutes() au dry hop (poids d’arôme du moteur), du moteur et de deux réglages « mots » ; mots partagés = mots des fiches communs à l’original et au candidat.', reglages: resultats.suite, listes }, null, 1) + '\n');
const { rapportSuite } = await import('./rapport-suite');
writeFileSync(join(SORTIE, 'suite-mots.md'), rapportSuite(resultats as never));
process.stdout.write(`sha256 ${createHash('sha256').update(json).digest('hex')}\n`);
