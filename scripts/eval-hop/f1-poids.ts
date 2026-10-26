// Voie f1-affinage-diagnostic, parties 3 et 4 : le poids de l'α à 60′ et un critère de justesse sans artefact. MESURE seulement : rien dans src/.
// Lancement : npx vite-node scripts/eval-hop/f1-poids.ts -- --sortie=<dossier>   (sortie : poids.json, déterministe ; sha256 imprimé)
//
// Contexte d'amertume de Substituer (60′), sans style ni stock : la formule de formuleV2.ts (copie exacte de substitution.ts : le script
// vérifie ses scores contre substitutes() pour les 318 houblons, sinon arrêt).
// Banc de justesse (partie 4), trois indicateurs INDÉPENDANTS du produit de Beer Maverick ou de son α :
//   P1 substituts publiés par d'autres que lui : Hopsteiner « Brewhouse » (producteur, par moment), Hopslist et Hops Direct (agrégateur, distributeur) ;
//   P2 jugements du brasseur : D de ia1 (3 premiers des 8 phares, au dry hop), K4 et K5 de ia1 ; au 60′ aucun jugement n'existe (dit) ;
//   P3 Beer Maverick en secondaire, l'α retiré : le rang du substitut BM parmi les candidats d'α voisin (rapport ≤ 1,25).
//   P4 selon le style : part des 10 premiers dont les styles publiés par les producteurs (fiche : usage.styles) disent le style de la recette.
// Choix sur une moitié (parité de l'indice parmi les ids triés), jugement sur l'autre, dans les deux sens (L20, D77).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, bmLienId } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES } from '../../src/domain/hopIndex/v4/families';
import { roleFromAlpha } from '../../src/domain/hopIndex/v4/roles';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { arrondi, mediane, moyenne, mulberry32 } from './metriques';
import { NV, PROFILS, type FicheV2, type R, similitudes, sigmaDe, motsPoids } from './formuleV2';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/f1-affinage-diagnostic');
const RACINE = resolve('.');
const VOIES = join(RACINE, 'work/missions/2026-10-25-integration-houblons/voies');
const lire = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const N = CATALOGUE.length;
const ids = CATALOGUE.map((h) => h.id);
const idx = new Map(ids.map((id, i) => [id, i]));
const COLL = new Intl.Collator('fr');
const norm = (x: string) => x.toLowerCase().replace(/[_-]+/g, ' ');

// ---------- Fiches (comme moteur-v2.ts, sans compléments : ce que lit le moteur de l'app) ----------
const ok = (r: R | null | undefined): r is R => !!r && Number.isFinite(r[0]) && Number.isFinite(r[1]) && r[1] > 0;
const plage = (r: R | null | undefined): R | null => (ok(r) ? r : null);
const fiches: FicheV2[] = CATALOGUE.map((h) => {
  const d = m.describeFamilies(h.id), w = m.familyWords(h.id);
  const levels = FAMILIES.map((f) => (d[f].level === 'marqué' ? 2 : d[f].level === 'cité' ? 1 : 0));
  const marked = levels.some((l) => l === 2);
  const aromaV = levels.some((l) => l > 0) ? FAMILIES.map((f, k) => (d[f].of ? (levels[k] / 2) * (d[f].sources / d[f].of) : 0)) : null;
  const mots = new Set<string>();
  for (const f of FAMILIES) for (const row of w.mots[f]) for (const x of row.mots) mots.add(norm(x));
  for (const x of w.sansFamille) mots.add(norm(x.mot));
  const alpha = plage(h.alpha);
  return {
    alpha, beta: plage(h.beta), cohu: plage(h.cohumulone), huile: plage(h.oil ?? h.hs?.totalOil),
    myr: plage(h.oils.myrcene), hum: plage(h.oils.humulene), car: plage(h.oils.caryophyllene), far: plage(h.oils.farnesene), lin: plage(h.hsLinalool?.range), ger: null,
    role: alpha ? roleFromAlpha((alpha[0] + alpha[1]) / 2, marked) : null, aromaV, levels, mots, radar: h.bm?.arome && h.bm.arome.some((x) => x > 0) ? h.bm.arome : null,
  };
});
const sigma = sigmaDe(fiches), motsW = motsPoids(fiches);
const mid = (r: R | null) => (r ? (r[0] + r[1]) / 2 : null);

// ---------- Table des ressemblances (contexte d'amertume) et clés de classement du moteur (faible, démotion) ----------
const P = new Float64Array(N * N * NV);
for (let o = 0; o < N; o++) for (let j = 0; j < N; j++) if (o !== j) similitudes(fiches[o], fiches[j], true, sigma, motsW[o], motsW[j], P, (o * N + j) * NV);
const FAIBLE = new Uint8Array(N * N), DEMO = new Uint8Array(N * N), SCORE_MOTEUR = new Int16Array(N * N);
for (let o = 0; o < N; o++) {
  for (const s of m.substitutes(ids[o], { moment: 'b60' }).remplacants) {
    const j = idx.get(s.key)!;
    FAIBLE[o * N + j] = s.couverture.fiabilite === 'faible' ? 1 : 0; DEMO[o * N + j] = s.amertumeDeconseillee ? 1 : 0; SCORE_MOTEUR[o * N + j] = s.score;
  }
}
// ---------- Poids ----------
type Jeu = { nom: string; G: [number, number, number]; interne: [number, number, number, number]; style?: number };
const poidsDe = (g: Jeu): Float64Array => {
  const w = new Float64Array(NV), p = PROFILS.am;
  g.interne.forEach((x, i) => { w[i] = g.G[0] * x; });
  p.huile.forEach((x, i) => { w[4 + i] = g.G[1] * x; });
  w[11] = g.G[2];
  return w;
};
const ACTUEL: Jeu = { nom: 'actuel', G: [0.7, 0.2, 0.1], interne: [0.4, 0.2, 0.2, 0.2] };
const J1: Jeu = { nom: 'J1 α allégé (même groupes)', G: [0.7, 0.2, 0.1], interne: [0.15, 0.25, 0.3, 0.3] };
const J2: Jeu = { nom: 'J2 α allégé, huile et arôme restant plus lourds', G: [0.5, 0.3, 0.2], interne: [0.2, 0.25, 0.25, 0.3] };
const J3: Jeu = { nom: 'J3 = J2 + part du style (0,15)', G: [0.5, 0.3, 0.2], interne: [0.2, 0.25, 0.25, 0.3], style: 0.15 };
const JEUX = [ACTUEL, J1, J2];
const W = new Map<Jeu, Float64Array>([...JEUX, J3].map((j) => [j, poidsDe(j)]));
// Vérification de la réplique : le jeu actuel redonne exactement le score de substitutes() (aucun écart toléré).
let ecartsReplique = 0;
function scoreDe(o: number, j: number, w: Float64Array, styleX = Number.NaN, wStyle = 0): number {
  let tw = 0, num = 0; const b = (o * N + j) * NV;
  for (let v = 0; v < NV; v++) { const s = P[b + v]; if (w[v] > 0 && s === s) { tw += w[v]; num += w[v] * s; } }
  if (wStyle > 0 && styleX === styleX) { tw += wStyle; num += wStyle * styleX; }
  return tw > 0 ? Math.round((100 * num) / tw) : 0;
}
for (let o = 0; o < N; o++) for (let j = 0; j < N; j++) if (o !== j && scoreDe(o, j, W.get(ACTUEL)!) !== SCORE_MOTEUR[o * N + j]) ecartsReplique++;
if (ecartsReplique) throw new Error(`réplique : ${ecartsReplique} scores diffèrent de substitutes()`);

/** Classement d'un original (indices des candidats), mêmes clés que le moteur : couverture faible, démotion, score, nom. */
function ordre(o: number, w: Float64Array, styleDe?: (j: number) => number, wStyle = 0, sansCles = false): number[] {
  const sc = new Map<number, number>();
  const out: number[] = [];
  for (let j = 0; j < N; j++) if (j !== o) { sc.set(j, scoreDe(o, j, w, styleDe ? styleDe(j) : Number.NaN, wStyle)); out.push(j); }
  return out.sort((a, b) => (sansCles ? 0 : FAIBLE[o * N + a] - FAIBLE[o * N + b] || DEMO[o * N + a] - DEMO[o * N + b]) || sc.get(b)! - sc.get(a)! || COLL.compare(CATALOGUE[a].name, CATALOGUE[b].name));
}
const rangDans = (ord: number[], e: number) => { const i = ord.indexOf(e); return i < 0 ? null : i + 1; };

// ---------- Moitiés : parité de l'indice parmi les ids triés ----------
const triees = [...ids].sort();
const moitie = new Map(triees.map((id, k) => [id, k % 2]));
const demi = (o: number) => moitie.get(ids[o])!;

// ================================================================================================================================
// PARTIE 3a : combien l'α décide-t-il des rangs de Substituer à 60′ ?
// ================================================================================================================================
const wA0 = (w: Float64Array) => { const c = Float64Array.from(w); c[0] = 0; return c; };
const wAlphaSeul = (): Float64Array => { const c = new Float64Array(NV); c[0] = 1; return c; };
const chevauche = (a: number[], b: number[], k = 10) => { const s = new Set(b.slice(0, k)); return a.slice(0, k).filter((x) => s.has(x)).length / k; };
/** Corrélation de rang (Spearman, rangs moyens pour les ex æquo) entre deux séries. */
function spearman(x: number[], y: number[]): number {
  const rg = (v: number[]) => { const ix = v.map((_, i) => i).sort((a, b) => v[a] - v[b]); const r = new Array<number>(v.length); let i = 0; while (i < ix.length) { let j = i; while (j + 1 < ix.length && v[ix[j + 1]] === v[ix[i]]) j++; for (let k = i; k <= j; k++) r[ix[k]] = (i + j) / 2; i = j + 1; } return r; };
  const a = rg(x), b = rg(y), ma = a.reduce((s, t) => s + t, 0) / a.length, mb = b.reduce((s, t) => s + t, 0) / b.length;
  let num = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
const GROUPES_V: [string, number[]][] = [['α', [0]], ['β', [1]], ['cohumulone', [2]], ['usage (rôle)', [3]], ['huile', [4, 5, 6, 7, 8, 9, 10]], ['arôme restant', [11, 12, 13]]];
function poidsDeAlpha(jeu: Jeu, originals: number[]) {
  const w = W.get(jeu)!, wsans = wA0(w), wseul = wAlphaSeul();
  const part: number[][] = GROUPES_V.map(() => []);
  const ch10: number[] = [], chSans: number[] = [], spear: number[] = [], premierChange: number[] = [], rhoAlphaSeul: number[] = [], vsActuel10: number[] = [], vsActuel1: number[] = [];
  for (const o of originals) {
    const cands = Array.from({ length: N }, (_, j) => j).filter((j) => j !== o);
    // Part de la dispersion des scores portée par chaque groupe de variables : Cov(score, terme du groupe) / Var(score) (la somme vaut 1, avant arrondi).
    const termes = cands.map((j) => { let tw = 0; const b = (o * N + j) * NV; const t = new Array<number>(GROUPES_V.length).fill(0); for (let v = 0; v < NV; v++) { const s = P[b + v]; if (w[v] > 0 && s === s) tw += w[v]; } for (let g = 0; g < GROUPES_V.length; g++) for (const v of GROUPES_V[g][1]) { const s = P[b + v]; if (w[v] > 0 && s === s && tw > 0) t[g] += (w[v] * s) / tw; } return t; });
    const tot = termes.map((t) => t.reduce((a, b) => a + b, 0)), mt = tot.reduce((a, b) => a + b, 0) / tot.length;
    const vt = tot.reduce((a, b) => a + (b - mt) ** 2, 0);
    if (vt > 0) GROUPES_V.forEach((_, g) => { const mg = termes.reduce((a, t) => a + t[g], 0) / termes.length; part[g].push(termes.reduce((a, t, i) => a + (t[g] - mg) * (tot[i] - mt), 0) / vt); });
    const base = ordre(o, w), sans = ordre(o, wsans), seul = ordre(o, wseul);
    const actuel = ordre(o, W.get(ACTUEL)!);
    vsActuel10.push(chevauche(base, actuel)); vsActuel1.push(base[0] === actuel[0] ? 1 : 0);
    ch10.push(chevauche(base, sans)); chSans.push(chevauche(base, seul)); premierChange.push(base[0] === sans[0] ? 0 : 1);
    spear.push(spearman(cands.map((j) => base.indexOf(j)), cands.map((j) => sans.indexOf(j))));
    rhoAlphaSeul.push(spearman(cands.map((j) => base.indexOf(j)), cands.map((j) => seul.indexOf(j))));
  }
  return {
    originaux: originals.length,
    ceQueCeJeuChangeALEcran: { chevauchementTop10AvecLeJeuActuel: arrondi(moyenne(vsActuel10), 3), memePremierQueLeJeuActuel: arrondi(moyenne(vsActuel1), 3) },
    partDeLaDispersionDesScores: Object.fromEntries(GROUPES_V.map(([n], g) => [n, arrondi(moyenne(part[g]) ?? 0, 3)])),
    chevauchementTop10SansAlpha: arrondi(moyenne(ch10), 3), premierChangeSansAlpha: arrondi(moyenne(premierChange), 3),
    spearmanAvecLeClassementSansAlpha: arrondi(moyenne(spear), 3),
    chevauchementTop10AvecAlphaSeul: arrondi(moyenne(chSans), 3), spearmanAvecAlphaSeul: arrondi(moyenne(rhoAlphaSeul), 3),
  };
}
const tous = Array.from({ length: N }, (_, i) => i);
const amerisants = tous.filter((i) => CATALOGUE[i].purpose === 'bittering' || CATALOGUE[i].purpose === 'dual');
const poidsAlpha = Object.fromEntries(JEUX.map((j) => [j.nom, { groupes: j.G, interneAmertume: j.interne,
  tousLesHoublons: poidsDeAlpha(j, tous), amerisantsEtDoubleUsage: poidsDeAlpha(j, amerisants),
  moitieA: poidsDeAlpha(j, tous.filter((i) => demi(i) === 0)), moitieB: poidsDeAlpha(j, tous.filter((i) => demi(i) === 1)) }]));

// ================================================================================================================================
// PARTIE 4 : références indépendantes
// ================================================================================================================================
const nomVersId = new Map<string, string>();
for (const h of CATALOGUE) for (const n of [h.name, ...h.aliases]) nomVersId.set(norm(n.replace(/[®™]/g, '').trim()), h.id);
const resoudre = (n: string): number | null => { const id = nomVersId.get(norm(String(n).replace(/[®™]/g, '').trim())); return id ? idx.get(id)! : null; };
interface Obs { o: number; attendus: number[]; source: string }
const SRC = join(RACINE, 'src/data/hopSources');
const obsHopsteiner: Obs[] = [], obsHopslist: Obs[] = [], nonResolus: Record<string, number> = { hopsteiner: 0, hopslist: 0, hopsdirect: 0 };
const originalDe = (f: { varietyId?: string | null; nom: string }) => (f.varietyId && idx.has(f.varietyId) ? idx.get(f.varietyId)! : resoudre(f.nom));
for (const f of lire(join(SRC, 'hopsteiner.json')).fiches as { nom: string; varietyId?: string | null; listes: { substituts: Record<string, { nom: string }[]> } }[]) {
  const o = originalDe(f); const bw = f.listes.substituts?.Brewhouse; if (o === null || !bw?.length) continue;
  const att = bw.map((x) => { const e = resoudre(x.nom); if (e === null) nonResolus.hopsteiner++; return e; }).filter((e): e is number => e !== null && e !== o);
  if (att.length) obsHopsteiner.push({ o, attendus: [...new Set(att)], source: 'hopsteiner' });
}
const parOriginal = new Map<number, Set<number>>();
for (const [src, fichier] of [['hopslist', 'hopslist.json'], ['hopsdirect', 'hopsdirect.json']] as const) {
  for (const f of lire(join(SRC, fichier)).fiches as { nom: string; varietyId?: string | null; listes?: { substituts?: (string | { nom: string })[] | null } }[]) {
    const o = originalDe(f); const l = f.listes?.substituts; if (o === null || !l?.length) continue;
    for (const x of l) { const e = resoudre(typeof x === 'string' ? x : x.nom); if (e === null) nonResolus[src]++; else if (e !== o) (parOriginal.get(o) ?? parOriginal.set(o, new Set()).get(o)!).add(e); }
  }
}
for (const [o, s] of parOriginal) obsHopslist.push({ o, attendus: [...s], source: 'hopslist+hopsdirect' });
const estAmerisant = (o: number) => CATALOGUE[o].purpose === 'bittering' || CATALOGUE[o].purpose === 'dual';
// Hopslist et Hops Direct ne disent pas le moment : seuls les amérisants et doubles usages comptent pour le 60′ (un Citra n'y est pas jugé à 60′).
const P1 = { hopsteinerBrewhouse: obsHopsteiner, hopslistEtHopsDirect60: obsHopslist.filter((x) => estAmerisant(x.o)) };
const obsBM: Obs[] = CATALOGUE.flatMap((h, i) => (estAmerisant(i) && h.bm?.substituts?.length ? [{ o: i, attendus: [...new Set(h.bm.substituts.map((l) => bmLienId(l)).filter((x): x is string => !!x && x !== h.id && idx.has(x)).map((x) => idx.get(x)!))], source: 'bm' }] : [])).filter((x) => x.attendus.length);

interface Mesure { n: number; mrr: number | null; rappel10: number | null; rangMedian: number | null }
function mesure(obs: Obs[], w: Float64Array, filtreAlpha = false): Mesure & { rr: number[] } {
  const rr: number[] = [], r10: number[] = [], prem: number[] = [];
  for (const ob of obs) {
    let ord = ordre(ob.o, w);
    let att = ob.attendus;
    if (filtreAlpha) {
      // P3 : parmi les candidats d'α voisin seulement (rapport ≤ 1,25) ; un attendu d'α éloigné n'est pas jugé (son rang tiendrait à l'α).
      const ao = mid(fiches[ob.o].alpha); if (ao === null) continue;
      ord = ord.filter((j) => { const a = mid(fiches[j].alpha); return a !== null && Math.abs(Math.log(a / ao)) <= Math.log(1.25); });
      att = att.filter((e) => ord.includes(e));
    }
    if (!att.length) continue;
    const rangs = att.map((e) => rangDans(ord, e)!);
    const p = Math.min(...rangs);
    rr.push(1 / p); prem.push(p); r10.push(rangs.filter((r) => r <= 10).length / rangs.length);
  }
  return { n: rr.length, mrr: arrondi(moyenne(rr)), rappel10: arrondi(moyenne(r10)), rangMedian: mediane(prem), rr };
}
const sousEnsemble = (obs: Obs[], h: 0 | 1) => obs.filter((x) => demi(x.o) === h);
const moy = (xs: (number | null)[]) => moyenne(xs.filter((x): x is number => x !== null)) ?? 0;
const composite = (w: Float64Array, h: 0 | 1) => {
  const a = mesure(sousEnsemble(P1.hopsteinerBrewhouse, h), w), b = mesure(sousEnsemble(P1.hopslistEtHopsDirect60, h), w), c = mesure(sousEnsemble(obsBM, h), w, true);
  return { P1a: a, P1b: b, P3: c, composite: arrondi(moy([a.mrr, b.mrr, c.mrr]), 4) };
};
const strip = (x: Mesure & { rr: number[] }): Mesure => ({ n: x.n, mrr: x.mrr, rappel10: x.rappel10, rangMedian: x.rangMedian });
const parMoitie = Object.fromEntries(JEUX.map((j) => [j.nom, { A: composite(W.get(j)!, 0), B: composite(W.get(j)!, 1) }]));
const resume = Object.fromEntries(JEUX.map((j) => [j.nom, Object.fromEntries((['A', 'B'] as const).map((h) => { const c = parMoitie[j.nom][h]; return [h, { P1a_hopsteiner: strip(c.P1a), P1b_hopslist_hopsdirect: strip(c.P1b), P3_BM_alphaConstant: strip(c.P3), composite: c.composite }]; }))]));
// Choix sur une moitié, jugement sur l'autre, dans les deux sens ; écart au jeu actuel avec intervalle (rééchantillonnage des houblons de la moitié de jugement).
function jugement(choixSur: 'A' | 'B') {
  const juge = choixSur === 'A' ? 'B' : 'A', hj = juge === 'A' ? 0 : 1;
  const choisi = JEUX.reduce((best, j) => (parMoitie[j.nom][choixSur].composite! > parMoitie[best.nom][choixSur].composite! ? j : best), ACTUEL);
  const wc = W.get(choisi)!, wa = W.get(ACTUEL)!;
  const rnd = mulberry32(2610);
  const sets = [['P1a', sousEnsemble(P1.hopsteinerBrewhouse, hj), false], ['P1b', sousEnsemble(P1.hopslistEtHopsDirect60, hj), false], ['P3', sousEnsemble(obsBM, hj), true]] as const;
  const ecarts = sets.map(([nom, obs, f]) => {
    const x = mesure(obs, wc, f), y = mesure(obs, wa, f);
    // Les listes rr ne sont alignées que si les mêmes observations sont gardées (même filtre α : le filtre dépend du jeu seulement par l'ordre, pas par l'ensemble des candidats d'α voisin).
    const n = Math.min(x.rr.length, y.rr.length), d: number[] = []; for (let b = 0; b < 500; b++) { let s = 0; for (let i = 0; i < n; i++) { const k = Math.floor(rnd() * n); s += x.rr[k] - y.rr[k]; } d.push(s / n); }
    d.sort((a, b) => a - b);
    return { indicateur: nom, n, ecartMrr: arrondi((moyenne(x.rr) ?? 0) - (moyenne(y.rr) ?? 0), 4), ic95: [arrondi(d[12], 4), arrondi(d[487], 4)] };
  });
  return { choisiSur: choixSur, jugeSur: juge, jeuChoisi: choisi.nom, ecartsAuJeuActuel: ecarts };
}

// ---------- P2 : jugements du brasseur ----------
const ia1 = lire(join(VOIES, 'ia1-reclassement/resultats/cote-a-cote.json')) as { phares: { nom: string; id: string; option1PlusIA: { rang: number; nom: string }[]; moment: string }[] };
const pairesDuBrasseur = ia1.phares.map((p) => ({ nom: p.nom, o: idx.get(p.id)!, attendus: p.option1PlusIA.slice(0, 3).map((x) => resoudre(x.nom)).filter((e): e is number => e !== null), moment: p.moment }));
const wDry = ((): Float64Array => { const w = new Float64Array(NV), p = PROFILS.fr, g: [number, number, number] = [0.2, 0.3, 0.5]; p.amertume.forEach((x, i) => { w[i] = g[0] * x; }); p.huile.forEach((x, i) => { w[4 + i] = g[1] * x; }); const pm = 0.75; w[11] = g[2] * 0.9 * (1 - pm); w[12] = g[2] * 0.9 * pm; w[13] = g[2] * 0.1; return w; })();
// Au dry hop, le contexte d'arôme est celui du moteur (PAIRES[0]) : la table est refaite ici pour les 8 phares et les deux cas K4 et K5.
const Pf = new Map<number, Float64Array>();
const tableAroma = (o: number) => { let t = Pf.get(o); if (!t) { t = new Float64Array(N * NV); for (let j = 0; j < N; j++) if (j !== o) similitudes(fiches[o], fiches[j], false, sigma, motsW[o], motsW[j], t, j * NV); Pf.set(o, t); } return t; };
const ordreDry = (o: number): number[] => { const t = tableAroma(o); const sc = (j: number) => { let tw = 0, num = 0; for (let v = 0; v < NV; v++) { const s = t[j * NV + v]; if (wDry[v] > 0 && s === s) { tw += wDry[v]; num += wDry[v] * s; } } return tw > 0 ? Math.round((100 * num) / tw) : 0; };
  const faible = (j: number) => (t[j * NV + 11] !== t[j * NV + 11] && t[j * NV + 12] !== t[j * NV + 12] ? 1 : 0);
  return Array.from({ length: N }, (_, j) => j).filter((j) => j !== o).sort((a, b) => faible(a) - faible(b) || sc(b) - sc(a) || COLL.compare(CATALOGUE[a].name, CATALOGUE[b].name)); };
const P2 = pairesDuBrasseur.map((p) => { const ord = ordreDry(p.o); const rangs = p.attendus.map((e) => rangDans(ord, e)); return { phare: p.nom, attendus: p.attendus.map((e) => CATALOGUE[e].name), rangsDansLeMoteurDryHop: rangs, premier: Math.min(...(rangs as number[])) }; });
const ns = idx.get('beermaverick-nelson-sauvin')!, hb = idx.get('beermaverick-hallertau-blanc')!, gal = idx.get('beermaverick-galaxy')!, saaz = idx.get('beermaverick-saaz-cz') ?? resoudre('Saaz (CZ)');
const K4 = rangDans(ordreDry(ns), hb), K5 = saaz === null ? null : rangDans(ordreDry(gal), saaz);

// ---------- P4 : selon le style (styles publiés par les producteurs) ----------
const STYLES: Record<string, { re: RegExp; nom: string }> = { '21C': { re: /ipa|hazy|neipa|pale ale/i, nom: 'IPA / NEIPA / pale ale' }, '16D': { re: /stout|porter|dark|brown/i, nom: 'stout / porter / bière brune' } };
const stylesDe = (i: number) => CATALOGUE[i].usage?.flatMap((u) => u.styles) ?? [];
const styleX = (code: string) => (j: number) => { const s = stylesDe(j); return s.length ? (s.some((x) => STYLES[code].re.test(x)) ? 1 : 0) : Number.NaN; };
const ORIG_STYLE = ['nugget', 'magnum', 'warrior', 'columbus', 'chinook', 'galena', 'northern-brewer', 'herkules', 'hallertau-magnum', 'summit', 'apollo', 'zeus'].map((x) => idx.get(`beermaverick-${x}`)).filter((x): x is number => x !== undefined);
const couvertureStyle = arrondi(CATALOGUE.filter((_, i) => stylesDe(i).length).length / N, 3);
function p4(jeu: Jeu, code: string, h: 0 | 1 | null) {
  const w = W.get(jeu)!, sx = styleX(code), part: number[] = [], couv: number[] = [];
  for (const o of ORIG_STYLE.filter((i) => h === null || demi(i) === h)) {
    const top = ordre(o, w, jeu.style ? sx : undefined, jeu.style ?? 0).slice(0, 10), connus = top.filter((j) => sx(j) === sx(j));
    couv.push(connus.length / 10); if (connus.length) part.push(connus.filter((j) => sx(j) === 1).length / connus.length);
  }
  return { originaux: ORIG_STYLE.filter((i) => h === null || demi(i) === h).length, partDesDixPremiersAuStyle: arrondi(moyenne(part), 3), partDesDixPremiersAuStyleConnu: arrondi(moyenne(couv), 3) };
}
const p4Res = Object.fromEntries(Object.keys(STYLES).map((code) => [code, Object.fromEntries([...JEUX, J3].map((j) => [j.nom, { tous: p4(j, code, null), moitieA: p4(j, code, 0), moitieB: p4(j, code, 1) }]))]));

// ================================================================================================================================
// PARTIE 3b : Suggérer à 60′ (palier g2b : usage, puis α = grammes). L'α décide-t-il seul ? Et le même classement par ressemblance au houblon d'amertume de la recette.
// ================================================================================================================================
const R21C: Recipe = { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const nug = idx.get('beermaverick-nugget')!;
const sans = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const suggerer60 = [['21C', R21C, { citrus: 1 }], ['16D', R16D, { floral: 1 }]].map(([code, r, dir]) => {
  const res = sans.proposeVoies(r as Recipe, dir as never, { palier60: { ibu: 10 }, dryHop: false, maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false });
  const voies = res.palier60!.voies;
  const cles = voies.map((v) => idx.get(v.actions[0].hopKey)!);
  const alpha = cles.map((i) => mid(fiches[i].alpha) ?? 0);
  const usage = cles.map((i) => (CATALOGUE[i].purpose === 'aroma' ? 1 : CATALOGUE[i].purpose ? 0 : 2));
  // Rang de position contre α, par classe d'usage : un Spearman de −1 veut dire « l'α décide seul ».
  const rhoParClasse = [0, 1, 2].map((u) => { const ix = cles.map((_, k) => k).filter((k) => usage[k] === u); return ix.length > 2 ? { classe: ['amérisant ou double usage', 'arôme', 'usage inconnu'][u], n: ix.length, spearmanPositionContreAlpha: arrondi(spearman(ix.map((k) => k), ix.map((k) => alpha[k])), 3) } : null; }).filter(Boolean);
  const actuel10 = cles.slice(0, 10);
  const alt = (jeu: Jeu, avecStyle: boolean) => {
    const w = W.get(jeu)!, sx = styleX(code as string);
    const sc = new Map(cles.map((j) => [j, scoreDe(nug, j, w, avecStyle ? sx(j) : Number.NaN, avecStyle ? jeu.style ?? 0 : 0)]));
    const ord = [...cles].sort((a, b) => (CATALOGUE[a].purpose === 'aroma' ? 1 : 0) - (CATALOGUE[b].purpose === 'aroma' ? 1 : 0) || sc.get(b)! - sc.get(a)! || COLL.compare(CATALOGUE[a].name, CATALOGUE[b].name));
    const t10 = ord.slice(0, 10), sx2 = styleX(code as string), conn = t10.filter((j) => sx2(j) === sx2(j));
    return { top10: t10.map((j) => `${CATALOGUE[j].name} α${arrondi(mid(fiches[j].alpha), 1)}`), chevauchementAvecLeRangActuel: arrondi(chevauche(t10, actuel10), 2), alphaMoyenTop10: arrondi(moyenne(t10.map((j) => mid(fiches[j].alpha) ?? 0)), 1),
      partAuStyle: conn.length ? arrondi(conn.filter((j) => sx2(j) === 1).length / conn.length, 2) : null, connus: conn.length };
  };
  const connA = actuel10.filter((j) => styleX(code as string)(j) === styleX(code as string)(j));
  return {
    recette: code, candidats: voies.length, tete10Actuelle: actuel10.map((j) => `${CATALOGUE[j].name} α${arrondi(mid(fiches[j].alpha), 1)}`),
    alphaTop10: { min: Math.min(...actuel10.map((j) => mid(fiches[j].alpha) ?? 0)), max: Math.max(...actuel10.map((j) => mid(fiches[j].alpha) ?? 0)) }, rhoParClasse,
    partAuStyleActuel: connA.length ? arrondi(connA.filter((j) => styleX(code as string)(j) === 1).length / connA.length, 2) : null, connusActuel: connA.length,
    alternatives: { 'S1 : usage puis ressemblance à Nugget (jeu J1)': alt(J1, false), 'S2 : usage puis ressemblance à Nugget (jeu J2)': alt(J2, false), 'S3 : usage puis J3 (J2 + style)': alt(J3, true) },
  };
});

const sortie = {
  voie: 'f1-affinage-diagnostic, parties 3 et 4', repliqueVerifiee: { scoresComparesASubstitutes: N * (N - 1), ecarts: ecartsReplique },
  jeux: JEUX.concat(J3).map((j) => ({ nom: j.nom, groupesAmertumeHuileArome: j.G, interneAmertume_alpha_beta_cohu_usage: j.interne, partDuStyle: j.style ?? 0 })),
  partie3a_poidsDeLAlpha: poidsAlpha,
  partie4: {
    references: { hopsteinerBrewhouse: { originaux: P1.hopsteinerBrewhouse.length, paires: P1.hopsteinerBrewhouse.reduce((s, x) => s + x.attendus.length, 0) },
      hopslistEtHopsDirect: { originaux: P1.hopslistEtHopsDirect60.length, paires: P1.hopslistEtHopsDirect60.reduce((s, x) => s + x.attendus.length, 0) }, bmAlphaConstant: { originaux: obsBM.length }, nonResolus, couvertureStylesProducteurs: couvertureStyle },
    parMoitie: resume, jugements: [jugement('A'), jugement('B')],
    P2_brasseur: { lecture: 'Au dry hop (moment de ses listes), rang dans le moteur des 3 premiers de D par phare ; K4 : rang de Hallertau Blanc chez Nelson Sauvin ; K5 : rang de Saaz chez Galaxy (doit rester loin). Au 60′ : aucun jugement du brasseur.', phares: P2, K4, K5 },
    P4_style: { couvertureStylesProducteurs: couvertureStyle, parStyle: p4Res, originauxUtilises: ORIG_STYLE.map((i) => CATALOGUE[i].name) },
  },
  partie3b_suggerer60: suggerer60,
};
const json = JSON.stringify(sortie, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'poids.json'), json);
process.stdout.write(`réplique : ${ecartsReplique} écart(s) ; sha256 ${createHash('sha256').update(json).digest('hex')}\n`);
