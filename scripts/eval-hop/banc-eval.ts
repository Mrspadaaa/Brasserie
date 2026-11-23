// Banc d'évaluation hors ligne de Substituer et de Suggérer (#181, première étape : MESURER, ne rien régler).
// Lancement, depuis la racine : npx vite-node scripts/eval-hop/banc-eval.ts -- --sortie=<dossier>
// Sortie : resultats.json (déterministe : aucune durée, aucune date) et rapport.md dans le dossier.
// Vérité de terrain : le bloc `bm` de proto-data.json (substituts choisis par des brasseurs sur Beer Maverick, D75). Le moteur
// ne lit aucun de ces champs : pas de fuite. Hors ligne : ni Gemini, ni Firestore, ni réseau. Le moteur est celui de la fabrique
// (creerMoteur), sans stock (pool = les 318 variétés du catalogue) : le stock d'un brasseur ne doit pas peser sur une mesure.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, bmLienId, type CatalogueHop } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';
import type { Recipe, MomentId } from '../../src/domain/hopIndex/v4/recipe';
import type { Substitute, SubstitutionWeights, Voie } from '../../src/domain/hopIndex/v4';
import { arrondi, echantillon, mediane, moyenne, mulberry32, rangMoyenGroupe, resume, type Obs, type Resume } from './metriques';
import { VERDICTS_PHARES } from './verdicts';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/e1-banc-eval/resultats');
const GRAINE = 181;          // graine de l'échantillon Suggérer (numéro du ticket)
const TAILLE_ECHANTILLON = 60;
const t0 = performance.now();
const chrono = (nom: string) => process.stderr.write(`[banc] ${nom} ${(performance.now() - t0).toFixed(0)} ms\n`);

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const parId = new Map(CATALOGUE.map((h) => [h.id, h]));
const nom = (id: string) => parId.get(id)?.name ?? id;
const COLL = new Intl.Collator('fr');
const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)} %`);
const f1 = (x: number | null) => (x === null ? '–' : String(Math.round(x * 10) / 10).replace('.', ','));
const f3 = (x: number | null) => (x === null ? '–' : x.toFixed(3).replace('.', ','));

// ---------- Vérité de terrain ----------
interface Cible { id: string; purpose: CatalogueHop['purpose']; attendus: string[]; nonReliesBm: number }
const cibles: Cible[] = CATALOGUE.filter((h) => h.bm?.substituts && h.bm.substituts.length > 0).map((h) => {
  const liens = h.bm!.substituts!;
  const ids = [...new Set(liens.map((l) => bmLienId(l)).filter((x): x is string => !!x && x !== h.id && parId.has(x)))];
  return { id: h.id, purpose: h.purpose ?? null, attendus: ids, nonReliesBm: liens.length - ids.length };
}).filter((c) => c.attendus.length > 0).sort((a, b) => (a.id < b.id ? -1 : 1));
const reciproque = (() => {
  let tot = 0, rec = 0;
  for (const c of cibles) for (const s of c.attendus) { tot++; if (parId.get(s)?.bm?.substituts?.some((l) => bmLienId(l) === c.id)) rec++; }
  return { paires: tot, reciproques: rec };
})();

// Noms de substituts que la page cite et que le dépôt n'a pas reliés : une correspondance indulgente (sans parenthèse, sans accent) en retrouve-t-elle ?
const normNom = (x: string) => x.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const nonRelies = (() => {
  const noms = [...new Set(CATALOGUE.flatMap((h) => (h.bm?.substituts ?? []).filter((l): l is { name: string } => typeof l !== 'string').map((l) => l.name)))].sort();
  const lignes = noms.map((n) => {
    const a = normNom(n);
    const trouves = CATALOGUE.filter((h) => { const b = normNom(h.name); return b === a || b.startsWith(a + ' ') || a.startsWith(b + ' ') || (b.length >= 4 && a.length >= 4 && (b.startsWith(a) || a.startsWith(b))) || b.replace(/ /g, '').includes(a.replace(/ /g, '')); }).map((h) => h.name);
    return { nom: n, candidats: trouves };
  });
  return { distincts: noms.length, retrouvables: lignes.filter((l) => l.candidats.length > 0).length, lignes };
})();

// ---------- Substituer ----------
const MOMENTS: [string, MomentId][] = [['60′', 'b60'], ['10′', 'b10'], ['whirlpool', 'wp'], ['dry hop actif', 'dryActive']];
type Classement = { ordre: string[]; lignes: Map<string, Substitute> };
const classer = (id: string, moment: MomentId, weights?: SubstitutionWeights): Classement => {
  const r = m.substitutes(id, { moment, ...(weights ? { weights } : {}) });
  return { ordre: r.remplacants.map((s) => s.key), lignes: new Map(r.remplacants.map((s) => [s.key, s])) };
};
const parMoment = new Map<MomentId, Map<string, Classement>>();
for (const [, mo] of MOMENTS) parMoment.set(mo, new Map(cibles.map((c) => [c.id, classer(c.id, mo)])));
chrono('substituer: classements');
const obsDe = (mo: MomentId, cs: Cible[]): Obs[] => cs.map((c) => { const o = parMoment.get(mo)!.get(c.id)!.ordre; return { rangs: c.attendus.map((a) => { const i = o.indexOf(a); return i < 0 ? null : i + 1; }) }; });
const memeOrdre = (a: MomentId, b: MomentId) => cibles.filter((c) => parMoment.get(a)!.get(c.id)!.ordre.join() === parMoment.get(b)!.get(c.id)!.ordre.join()).length;

// Référence aléatoire : même nombre de substituts, classement tiré au hasard (graine fixe, 20 tirages par houblon).
const aleatoire = (() => {
  const rnd = mulberry32(GRAINE + 1), N = CATALOGUE.length - 1;
  const obs: Obs[] = [];
  for (let t = 0; t < 20; t++) for (const c of cibles) {
    const rangs = c.attendus.map(() => 1 + Math.floor(rnd() * N)); // approximation : tirages indépendants
    obs.push({ rangs });
  }
  return resume(obs);
})();

const USAGES = ['aroma', 'dual', 'bittering'] as const;
const tableSubstituer: Record<string, { tous: Resume; parUsage: Record<string, Resume> }> = {};
for (const [lib, mo] of MOMENTS) {
  tableSubstituer[lib] = { tous: resume(obsDe(mo, cibles)), parUsage: Object.fromEntries(USAGES.map((u) => [u, resume(obsDe(mo, cibles.filter((c) => c.purpose === u)))])) };
}

// ---------- Descripteurs par houblon (données manquantes, mots sans famille) ----------
interface Fiche { nbFamilles: number; mots: number; sansFamille: number; partSans: number | null; motsSet: string[]; arome: number[] | null }
const fiches = new Map<string, Fiche>();
for (const h of CATALOGUE) {
  const d = m.describeFamilies(h.id), w = m.familyWords(h.id);
  const nbFamilles = FAMILIES.filter((f) => d[f].level !== 'non décrit').length;
  const avec = new Set<string>(), sans = new Set<string>();
  for (const f of FAMILIES) for (const row of w.mots[f]) for (const x of row.mots) avec.add(x.toLowerCase().replace(/[_-]+/g, ' '));
  for (const x of w.sansFamille) sans.add(x.mot.toLowerCase().replace(/[_-]+/g, ' '));
  const mots = new Set([...avec, ...sans]);
  fiches.set(h.id, { nbFamilles, mots: mots.size, sansFamille: [...sans].filter((x) => !avec.has(x)).length, partSans: mots.size ? [...sans].filter((x) => !avec.has(x)).length / mots.size : null, motsSet: [...mots].sort(), arome: h.bm?.arome ?? null });
}
const sansArome = CATALOGUE.filter((h) => fiches.get(h.id)!.nbFamilles === 0).length;
const creux = CATALOGUE.filter((h) => fiches.get(h.id)!.nbFamilles <= 2).length;
const sansHuiles = CATALOGUE.filter((h) => (['myrcene', 'humulene', 'caryophyllene'] as const).filter((o) => h.oils[o]).length + (h.hsLinalool ? 1 : 0) < 2).length;
const motsSansFamilleFort = CATALOGUE.filter((h) => (fiches.get(h.id)!.partSans ?? 0) >= 0.5 && fiches.get(h.id)!.mots >= 6).length;

// ---------- Où la référence semble fausse : écarts de rôle, d'α, d'arôme ----------
const mid = (r: [number, number] | null) => (r ? (r[0] + r[1]) / 2 : null);
interface Paire { cible: string; sub: string; rangArome: number | null; rang60: number | null; scoreArome: number | null; drapeaux: string[] }
const paires: Paire[] = [];
for (const c of cibles) {
  const ho = parId.get(c.id)!, A = parMoment.get('dryActive')!.get(c.id)!, B = parMoment.get('b60')!.get(c.id)!;
  for (const s of c.attendus) {
    const hs = parId.get(s)!, drap: string[] = [];
    if ((ho.purpose === 'aroma' && hs.purpose === 'bittering') || (ho.purpose === 'bittering' && hs.purpose === 'aroma')) drap.push('usage opposé');
    const a1 = mid(ho.alpha), a2 = mid(hs.alpha);
    if (a1 && a2 && Math.max(a1, a2) / Math.min(a1, a2) >= 2) drap.push('α à plus du double');
    const i = A.ordre.indexOf(s), j = B.ordre.indexOf(s);
    const row = A.lignes.get(s);
    if (row && row.familles.communes.length === 0 && row.couverture.arome) drap.push('aucune famille en commun');
    paires.push({ cible: c.id, sub: s, rangArome: i < 0 ? null : i + 1, rang60: j < 0 ? null : j + 1, scoreArome: row?.score ?? null, drapeaux: drap });
  }
}
const nbDrap = (d: string) => paires.filter((p) => p.drapeaux.includes(d)).length;
const flagStats = { paires: paires.length, usageOppose: nbDrap('usage opposé'), alphaDouble: nbDrap('α à plus du double'), sansFamilleCommune: nbDrap('aucune famille en commun'),
  auMoinsUn: paires.filter((p) => p.drapeaux.length > 0).length };
// 5 exemples : les paires les plus mal classées à l'arôme ET à 60′, portant au moins un drapeau ; une par cible, ordre déterministe.
// Exemples : les deux houblons ont au moins 3 familles décrites (le mauvais rang ne vient donc pas d'un profil creux).
const exemplesFaux = paires.filter((p) => p.drapeaux.length > 0 && p.rangArome !== null && p.rang60 !== null && fiches.get(p.cible)!.nbFamilles >= 3 && fiches.get(p.sub)!.nbFamilles >= 3)
  .sort((a, b) => (b.rangArome! + b.rang60!) - (a.rangArome! + a.rang60!) || (a.cible + a.sub < b.cible + b.sub ? -1 : 1))
  .filter((p, i, a) => a.findIndex((q) => q.cible === p.cible) === i).slice(0, 5)
  .map((p) => { const ho = parId.get(p.cible)!, hs = parId.get(p.sub)!;
    return { ...p, cibleNom: ho.name, subNom: hs.name, usage: [ho.purpose, hs.purpose], alpha: [ho.alpha, hs.alpha], tagsCible: ho.tagsFr.slice(0, 6), tagsSub: hs.tagsFr.slice(0, 6) }; });

// ---------- Poids : grille hors ligne sur les composantes rendues, puis contrôle exact par le moteur ----------
const GRILLE: SubstitutionWeights[] = [];
for (let a = 0; a <= 10; a++) for (let h = 0; h <= 10 - a; h++) GRILLE.push({ arome: a / 10, huiles: h / 10, amertume: (10 - a - h) / 10 });
interface Ligne { k: string; name: string; a: number | null; o: number | null; b: number | null; faible: boolean; demotion: boolean }
const lignesDe = (cl: Classement): Ligne[] => [...cl.lignes.values()].map((s) => ({ k: s.key, name: s.name, a: s.composantes.arome, o: s.composantes.huiles, b: s.composantes.amertume, faible: s.couverture.fiabilite === 'faible', demotion: !!s.amertumeDeconseillee }));
const scoreHL = (l: Ligne, w: SubstitutionWeights, a = l.a): number => {
  let tw = 0, num = 0;
  if (a !== null) { tw += w.arome; num += w.arome * a; }
  if (l.o !== null) { tw += w.huiles; num += w.huiles * l.o; }
  if (l.b !== null) { tw += w.amertume; num += w.amertume * l.b; }
  return tw > 0 ? Math.round(num / tw) : 0;
};
const avant = (x: Ligne, sx: number, y: Ligne, sy: number) => (x.faible !== y.faible ? !x.faible : x.demotion !== y.demotion ? !x.demotion : sx !== sy ? sx > sy : COLL.compare(x.name, y.name) < 0);
/** Rang des attendus d'une cible sous des poids (et un arôme remplaçable), par comptage : même ordre que le moteur. */
function rangsSous(lignes: Ligne[], attendus: string[], w: SubstitutionWeights, aromeDe?: (l: Ligne) => number | null): (number | null)[] {
  const sc = lignes.map((l) => scoreHL(l, w, aromeDe ? aromeDe(l) : l.a));
  return attendus.map((a) => {
    const i = lignes.findIndex((l) => l.k === a);
    if (i < 0) return null;
    let r = 1;
    for (let j = 0; j < lignes.length; j++) if (j !== i && avant(lignes[j], sc[j], lignes[i], sc[i])) r++;
    return r;
  });
}
const cacheLignes = new Map<string, Ligne[]>();
const lignesCible = (c: Cible, mo: MomentId) => { const k = c.id + mo; let l = cacheLignes.get(k); if (!l) cacheLignes.set(k, (l = lignesDe(parMoment.get(mo)!.get(c.id)!))); return l; };
const moitie = (c: Cible) => cibles.indexOf(c) % 2; // 0 : apprentissage, 1 : contrôle
const evalPoids = (cs: Cible[], mo: MomentId, w: SubstitutionWeights) => resume(cs.map((c) => ({ rangs: rangsSous(lignesCible(c, mo), c.attendus, w) })));
const poidsCourants: Record<string, SubstitutionWeights> = { '60′': { arome: 0.2, huiles: 0.2, amertume: 0.6 }, 'arôme (10′, whirlpool, dry hop)': { arome: 0.6, huiles: 0.3, amertume: 0.1 } };
const REP: Record<string, MomentId> = { '60′': 'b60', 'arôme (10′, whirlpool, dry hop)': 'dryActive' };
const optPoids: Record<string, unknown> = {};
const meilleursPoids: Record<string, SubstitutionWeights> = {};
for (const lib of Object.keys(poidsCourants)) {
  const mo = REP[lib], app = cibles.filter((c) => moitie(c) === 0), ctl = cibles.filter((c) => moitie(c) === 1);
  const notes = GRILLE.map((w) => ({ w, r: evalPoids(app, mo, w) })).sort((x, y) => (y.r.mrr! - x.r.mrr!) || (y.r.rappel10! - x.r.rappel10!) || (JSON.stringify(x.w) < JSON.stringify(y.w) ? -1 : 1));
  const best = notes[0].w;
  meilleursPoids[lib] = best;
  optPoids[lib] = {
    courants: { poids: poidsCourants[lib], tous: evalPoids(cibles, mo, poidsCourants[lib]), controle: evalPoids(ctl, mo, poidsCourants[lib]) },
    meilleurs_sur_moitie_apprentissage: { poids: best, apprentissage: notes[0].r, controle: evalPoids(ctl, mo, best), tous: evalPoids(cibles, mo, best) },
    dix_meilleurs_apprentissage: notes.slice(0, 10).map((n) => ({ poids: n.w, mrr: n.r.mrr, rappel10: n.r.rappel10 })),
    sans_amertume: { poids: { arome: 0.7, huiles: 0.3, amertume: 0 }, tous: evalPoids(cibles, mo, { arome: 0.7, huiles: 0.3, amertume: 0 }) },
    arome_seul: { poids: { arome: 1, huiles: 0, amertume: 0 }, tous: evalPoids(cibles, mo, { arome: 1, huiles: 0, amertume: 0 }) },
    huiles_seules: { poids: { arome: 0, huiles: 1, amertume: 0 }, tous: evalPoids(cibles, mo, { arome: 0, huiles: 1, amertume: 0 }) },
    amertume_seule: { poids: { arome: 0, huiles: 0, amertume: 1 }, tous: evalPoids(cibles, mo, { arome: 0, huiles: 0, amertume: 1 }) },
  };
}
// Contrôle exact : le moteur lui-même, avec ces poids imposés (valide la réplique hors ligne).
const exactPoids: Record<string, { poids: SubstitutionWeights; tous: Resume }> = {};
for (const lib of Object.keys(poidsCourants)) {
  const mo = REP[lib], w = meilleursPoids[lib];
  exactPoids[lib] = { poids: w, tous: resume(cibles.map((c) => { const o = classer(c.id, mo, w).ordre; return { rangs: c.attendus.map((a) => { const i = o.indexOf(a); return i < 0 ? null : i + 1; }) }; })) };
}
chrono('poids');

// ---------- Mots sans famille et radar Beer Maverick : arôme remplaçable hors ligne ----------
const N_HOUBLONS = CATALOGUE.length;
const df = new Map<string, number>();
for (const h of CATALOGUE) for (const w of fiches.get(h.id)!.motsSet) df.set(w, (df.get(w) ?? 0) + 1);
const idf = (w: string) => Math.log((N_HOUBLONS + 1) / ((df.get(w) ?? 0) + 1));
const poidsMots = new Map<string, Map<string, number>>();
for (const h of CATALOGUE) poidsMots.set(h.id, new Map(fiches.get(h.id)!.motsSet.map((w) => [w, idf(w)])));
const cosMots = (a: string, b: string): number | null => {
  const A = poidsMots.get(a)!, B = poidsMots.get(b)!;
  if (!A.size || !B.size) return null;
  let dot = 0, na = 0, nb = 0;
  for (const [w, x] of A) { na += x * x; const y = B.get(w); if (y !== undefined) dot += x * y; }
  for (const y of B.values()) nb += y * y;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
};
const cosRadar = (a: string, b: string): number | null => {
  const A = fiches.get(a)!.arome, B = fiches.get(b)!.arome;
  if (!A || !B) return null;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < 9; i++) { dot += A[i] * B[i]; na += A[i] ** 2; nb += B[i] ** 2; }
  return na && nb ? dot / Math.sqrt(na * nb) : null;
};
const W_AROME = poidsCourants['arôme (10′, whirlpool, dry hop)'];
const remplacerArome = (cs: Cible[], mix: (cible: string, l: Ligne) => number | null) => resume(cs.map((c) => ({ rangs: rangsSous(lignesCible(c, 'dryActive'), c.attendus, W_AROME, (l) => mix(c.id, l)) })));
const lambda = [1, 0.75, 0.5, 0.25, 0];
const optMots: Record<string, Resume> = {}, optRadar: Record<string, Resume> = {}, optRadarSous: Record<string, Resume> = {}, optMotsRadarRef: Record<string, Resume> = {};
const avecRadar = cibles.filter((c) => fiches.get(c.id)!.arome && c.attendus.some((a) => fiches.get(a)!.arome));
for (const L of lambda) {
  const mixMots = (cid: string, l: Ligne) => { const x = cosMots(cid, l.k); return l.a === null || x === null ? l.a : Math.round(L * l.a + (1 - L) * 100 * x); };
  const mixRadar = (cid: string, l: Ligne) => { const x = cosRadar(cid, l.k); return l.a === null || x === null ? l.a : Math.round(L * l.a + (1 - L) * 100 * x); };
  optMots[`λ=${L}`] = remplacerArome(cibles, mixMots);
  optRadar[`λ=${L}`] = remplacerArome(cibles, mixRadar);
  optRadarSous[`λ=${L}`] = remplacerArome(avecRadar, mixRadar);
  optMotsRadarRef[`λ=${L}`] = remplacerArome(avecRadar, mixMots);
}
const comboMots = (() => {
  const mix = (cid: string, l: Ligne) => { const x = cosMots(cid, l.k); return l.a === null || x === null ? l.a : Math.round(0.25 * l.a + 0.75 * 100 * x); };
  const w = meilleursPoids['arôme (10′, whirlpool, dry hop)'];
  const ap = cibles.filter((c) => moitie(c) === 0), ct = cibles.filter((c) => moitie(c) === 1);
  const ev = (cs: Cible[]) => resume(cs.map((c) => ({ rangs: rangsSous(lignesCible(c, 'dryActive'), c.attendus, w, (l) => mix(c.id, l)) })));
  return { poids: w, lambda: 0.25, tous: ev(cibles), controle: ev(ct), apprentissage: ev(ap) };
})();
// Nelson Sauvin (K4) sous la variante « mots » : où passent ses substituts Beer Maverick ?
const motsNelson = (() => {
  const c = cibles.find((x) => x.id === 'beermaverick-nelson-sauvin')!;
  return Object.fromEntries([0.5, 0.25, 0].map((L) => {
    const mix = (cid: string, l: Ligne) => { const x = cosMots(cid, l.k); return l.a === null || x === null ? l.a : Math.round(L * l.a + (1 - L) * 100 * x); };
    return [`λ=${L}`, c.attendus.map((a, i) => ({ nom: nom(a), rang: rangsSous(lignesCible(c, 'dryActive'), c.attendus, W_AROME, (l) => mix(c.id, l))[i] }))];
  }));
})();
chrono('mots et radar');

// ---------- Houblons phares ----------
const PHARES: [string, string][] = [['Nelson Sauvin', 'nelson-sauvin'], ['Citra', 'citra'], ['Motueka', 'motueka'], ['Mosaic', 'mosaic'], ['Galaxy', 'galaxy'], ['Simcoe', 'simcoe'], ['Saaz', 'saaz-cz'], ['Cascade', 'cascade'], ['Idaho 7', 'idaho-7']];
const phares = PHARES.map(([libelle, s]) => {
  const id = `beermaverick-${s}`, h = parId.get(id)!;
  const bm = (h.bm?.substituts ?? []).map((l) => (bmLienId(l) ?? (l as { name: string }).name));
  const vue = (mo: MomentId) => {
    const cl = classer(id, mo);
    return {
      top10: cl.ordre.slice(0, 10).map((k, i) => { const r = cl.lignes.get(k)!; return { rang: i + 1, nom: r.name, score: r.score, arome: r.composantes.arome, huiles: r.composantes.huiles, amertume: r.composantes.amertume, usage: parId.get(k)?.purpose ?? null, alpha: parId.get(k)?.alpha ?? null, familles: r.familles.communes.length }; }),
      bm: bm.map((x) => { const i = cl.ordre.indexOf(x); return { nom: parId.get(x)?.name ?? x, relie: parId.has(x), rang: i < 0 ? null : i + 1, score: i < 0 ? null : cl.lignes.get(x)!.score }; }),
    };
  };
  const f = fiches.get(id)!;
  return { libelle, id, usage: h.purpose, alpha: h.alpha, nbFamilles: f.nbFamilles, mots: f.mots, partSansFamille: arrondi(f.partSans, 2), dry: vue('dryActive'), a60: vue('b60'), verdict: VERDICTS_PHARES[s] ?? null };
});
chrono('phares');

// ---------- Classement des erreurs par cause ----------
const CAUSES = ['données manquantes', 'amérisant écarté à 60′', 'profil creux (inconnus lus comme zéros)', 'mots sans famille', 'poids de l’amertume', 'levure', 'non expliqué (référence discutable ou vrai écart)'] as const;
const erreurs: Record<string, unknown> = {};
for (const [lib, mo] of [['60′', 'b60'], ['arôme (10′, whirlpool, dry hop)', 'dryActive']] as [string, MomentId][]) {
  const exclusif: Record<string, number> = Object.fromEntries(CAUSES.map((c) => [c, 0]));
  const inclusif: Record<string, number> = Object.fromEntries(CAUSES.map((c) => [c, 0]));
  let manques = 0, total = 0;
  for (const c of cibles) {
    const cl = parMoment.get(mo)!.get(c.id)!, fo = fiches.get(c.id)!;
    const meil = rangsSous(lignesCible(c, mo), c.attendus, meilleursPoids[lib]);
    c.attendus.forEach((a, ai) => {
      total++;
      const pos = cl.ordre.indexOf(a) + 1;
      if (pos <= 10) return;
      manques++;
      const row = cl.lignes.get(a)!, fs = fiches.get(a)!;
      const flags: Record<string, boolean> = {
        'données manquantes': row.couverture.fiabilite !== 'bonne' || row.composantes.amertume === null,
        'amérisant écarté à 60′': mo === 'b60' && !!row.amertumeDeconseillee,
        'profil creux (inconnus lus comme zéros)': fo.nbFamilles <= 2 || fs.nbFamilles <= 2,
        'mots sans famille': ((fo.partSans ?? 0) >= 0.5 && fo.mots >= 6) || ((fs.partSans ?? 0) >= 0.5 && fs.mots >= 6),
        'poids de l’amertume': (meil[ai] ?? 999) <= 10,
        'levure': false,
        'non expliqué (référence discutable ou vrai écart)': false,
      };
      const premiere = CAUSES.find((k) => flags[k]) ?? CAUSES[CAUSES.length - 1];
      exclusif[premiere]++;
      for (const k of CAUSES) if (flags[k]) inclusif[k]++;
      if (!CAUSES.slice(0, -1).some((k) => flags[k])) inclusif[CAUSES[CAUSES.length - 1]]++;
    });
  }
  erreurs[lib] = { substitutsReferences: total, horsDesDix: manques, partHorsDesDix: arrondi(manques / total), exclusif, inclusif };
}
const inventaire = { varietes: N_HOUBLONS, sansAucuneFamille: sansArome, auPlusDeuxFamilles: creux, huilesInsuffisantes: sansHuiles, motsSansFamilleAu50pc: motsSansFamilleFort };

// ---------- Suggérer : aller-retour ----------
// Visée = le profil d'une variété X : « plus » sur ses familles marquées (trois au plus). On mesure où Suggérer range X et ses
// substituts Beer Maverick. Recette de base sans houblon, 20 L, US-05 ; dry hop en fermentation active (un seul moment : le rang
// d'un houblon est le rang de sa meilleure dose). Base neutre (style sans échelle) : seule la ressemblance de profil joue ; base IPA 21A
// en contrôle (les bandes et les conflits du style s'ajoutent).
const BASE_NEUTRE: Recipe = { name: 'neutre', styleCode: '', volumeL: 20, og: 1.050, boilMin: 60, yeastId: 'fermentis-us05', additions: [] };
const BASE_IPA: Recipe = { name: 'IPA', styleCode: '21A', volumeL: 20, og: 1.062, boilMin: 60, yeastId: 'fermentis-us05', additions: [] };
const direction = (id: string): Partial<Record<FamilyId, number>> | null => {
  const d = m.describeFamilies(id);
  const f = FAMILIES.filter((x) => d[x].level !== 'non décrit').sort((a, b) => (d[b].level === 'marqué' ? 1 : 0) - (d[a].level === 'marqué' ? 1 : 0) || (d[b].sources / (d[b].of || 1)) - (d[a].sources / (d[a].of || 1)) || (FAMILIES.indexOf(a) - FAMILIES.indexOf(b)));
  const marquees = f.filter((x) => d[x].level === 'marqué');
  const choix = (marquees.length ? marquees : f.slice(0, 1)).slice(0, 3);
  return choix.length ? Object.fromEntries(choix.map((x) => [x, 1])) : null;
};
const eligibles = cibles.filter((c) => direction(c.id)).map((c) => c.id);
const phareIds = PHARES.map(([, s]) => `beermaverick-${s}`);
const echant = [...new Set([...echantillon(eligibles, GRAINE, TAILLE_ECHANTILLON), ...phareIds.filter((p) => eligibles.includes(p))])].sort();
interface Passage { rangs: Map<string, number>; tailles: Map<number, number>; liste: string[]; voies: Voie[] }
function passage(recette: Recipe, dir: Partial<Record<FamilyId, number>>, moments: MomentId[] = ['dryActive']): Passage {
  const r = m.proposeVoies(recette, dir, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, moments, assemblages: false });
  const voies = r.voies.filter((v) => v.type === 'ajouter');
  const rangs = new Map<string, number>();
  for (const v of voies) { const k = v.actions[0].hopKey; if (!rangs.has(k) || v.rank < rangs.get(k)!) rangs.set(k, v.rank); }
  const tailles = new Map<number, number>();
  for (const rk of rangs.values()) tailles.set(rk, (tailles.get(rk) ?? 0) + 1);
  return { rangs, tailles, liste: [...rangs.keys()], voies };
}
const moyen = (p: Passage, k: string): number | null => { const r = p.rangs.get(k); return r === undefined ? null : rangMoyenGroupe(r, p.tailles.get(r)!); };
type LigneSugg = { x: string; dir: string[]; nListe: number; rangX: number | null; groupeX: number | null; premierGroupe: number; obs: Obs; distincts: number };
function aller(base: Recipe, ids: string[]) {
  const sugg: LigneSugg[] = [], passages = new Map<string, Passage>();
  for (const id of ids) {
    const dir = direction(id)!, p = passage(base, dir);
    passages.set(id, p);
    const c = cibles.find((x) => x.id === id)!;
    const rx = moyen(p, id);
    const autres = (k: string) => { const r = moyen(p, k); if (r === null) return null; return rx !== null && rx < r ? r - 1 : r; }; // X ôté de la liste
    const premier = Math.min(...p.rangs.values());
    sugg.push({ x: id, dir: Object.keys(dir), nListe: p.rangs.size, rangX: arrondi(rx, 1), groupeX: p.rangs.has(id) ? p.tailles.get(p.rangs.get(id)!)! : null, premierGroupe: p.tailles.get(premier)!, obs: { rangs: c.attendus.map(autres) }, distincts: p.tailles.size });
  }
  const resumeSugg = {
    houblons: ids.length,
    X: {
      dansLaListe: sugg.filter((s) => s.rangX !== null).length,
      rangMoyenMedian: mediane(sugg.filter((s) => s.rangX !== null).map((s) => s.rangX!)),
      dansLesDix: sugg.filter((s) => s.rangX !== null && s.rangX <= 10).length,
      premierGroupeMedian: mediane(sugg.map((s) => s.premierGroupe)),
      groupesDistinctsMedian: mediane(sugg.map((s) => s.distincts)),
      listeMediane: mediane(sugg.map((s) => s.nListe)),
    },
    substitutsBM: resume(sugg.map((s) => s.obs)),
    absentsDeLaListe: (() => { let a = 0, t = 0; for (const s of sugg) for (const r of s.obs.rangs) { t++; if (r === null) a++; } return { absents: a, total: t }; })(),
  };
  return { sugg, passages, resumeSugg };
}
const aN = aller(BASE_NEUTRE, echant), aI = aller(BASE_IPA, echant.slice(0, 20));
const sugg = aN.sugg, passages = aN.passages;
const resumeSugg = { echantillon: echant.length, graine: GRAINE, tailleDemandee: TAILLE_ECHANTILLON, neutre: aN.resumeSugg, ipa21A: aI.resumeSugg,
  // Référence aléatoire : un classement au hasard parmi les 317 autres variétés (comme Substituer), 20 tirages par houblon.
  referenceAleatoire: (() => { const rnd = mulberry32(GRAINE + 2); const obs: Obs[] = []; for (const s of sugg) for (let t = 0; t < 20; t++) obs.push({ rangs: s.obs.rangs.map(() => 1 + Math.floor(rnd() * (N_HOUBLONS - 1))) }); return resume(obs); })() };
chrono('suggerer: aller-retour');
// Inconnu lu comme zéro : parmi les 10 premières voies, celles dont une famille visée n'est pas établie (distance comptée avec un effet 0).
const inconnuZero = (() => {
  let voies = 0, avecInconnu = 0;
  for (const id of echant) {
    const dir = direction(id)!, p = passages.get(id)!;
    for (const v of p.voies.slice(0, 10)) { voies++; if (Object.keys(dir).some((f) => !v.effect[f as FamilyId].established)) avecInconnu++; }
  }
  return { voies, avecFamilleVisee_inconnue: avecInconnu };
})();
// Levure : les mêmes visées avec une autre souche (Pomona) pour les 10 premiers de l'échantillon.
const levure = (() => {
  const deltas: number[] = [], groupes: number[] = [];
  for (const id of echant.slice(0, 10)) {
    const base = passages.get(id)!, alt = passage({ ...BASE_NEUTRE, yeastId: 'lalbrew-pomona' }, direction(id)!);
    const a = moyen(base, id), b = moyen(alt, id);
    if (a !== null && b !== null) deltas.push(Math.abs(a - b));
    const top = (p: Passage) => new Set([...p.rangs].filter(([, r]) => r === Math.min(...p.rangs.values())).map(([k]) => k));
    const A = top(base), B = top(alt);
    groupes.push([...A].filter((x) => B.has(x)).length / Math.max(1, new Set([...A, ...B]).size));
  }
  return { houblons: 10, ecartMoyenDuRangDeX: arrondi(moyenne(deltas), 2), recouvrementPremierGroupe: arrondi(moyenne(groupes), 2) };
})();
chrono('suggerer: levure');

// ---------- Cinq cas « recette et attente » (mots du brasseur) ----------
const mStock = creerMoteur();
const S1: Recipe = { name: 'Stout export', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const LAGER: Recipe = { name: 'Lager tchèque', styleCode: '3B', volumeL: 20, og: 1.052, boilMin: 60, yeastId: 'lalbrew-diamond', additions: [] };
const citeDe = (id: string, f: FamilyId) => m.describeFamilies(id)[f].level !== 'non décrit';
const hopsDes = (voies: Voie[], n: number) => { const o: string[] = []; for (const v of voies) for (const a of v.actions) if (!o.includes(a.hopKey)) o.push(a.hopKey); return o.slice(0, n); };
const tasting = m.tastingFrom({ resin: 'marqué' }, { origin: 'parole du brasseur', date: '2026-10-18', quote: 'ma stout est trop résineuses, je la veux plus floral', source: 'SPEC-BRASSEUR.md § 1 (18.10)' } as never);
const k1 = (() => {
  const r = mStock.proposeVoies(S1, { floral: 1, resin: -1 }, { tasting, assemblages: true });
  const hops = hopsDes(r.voies.filter((v) => v.type !== 'levure'), 5);
  const bons = hops.filter((h) => citeDe(mStock.hopRef(h)!.varietyId, 'floral') && !citeDe(mStock.hopRef(h)!.varietyId, 'resin'));
  const conflits = r.voies.slice(0, 10).filter((v) => v.conflicts.length).length;
  // Réserve : un houblon « floral sans résineux » selon les fiches dont les mots sans famille disent dank, cannabis ou pin (inconnu lu comme absence).
  const reserves = hops.map((h) => ({ nom: mStock.hopRef(h)!.name, mots: m.familyWords(mStock.hopRef(h)!.varietyId).sansFamille.map((x) => x.mot).filter((x) => /dank|cannabis|resin|pine|piney|pin/i.test(x)) })).filter((x) => x.mots.length);
  return { id: 'K1', titre: 'Stout 16D « trop résineuse, plus floral »', mots: '« ma stout est trop résineuses, je la veux plus floral » (SPEC-BRASSEUR.md § 1, 18.10)',
    attendu: 'Les 5 premiers houblons proposés citent le floral dans leurs fiches et ne citent pas le résineux ; aucune des 10 premières voies en conflit ; aucun ne porte un mot résineux sans famille (dank, cannabis, pin).',
    observe: { top5: hops.map((h) => mStock.hopRef(h)!.name), floralSansResine: bons.length, conflitsDansLesDix: conflits, reservesMotsResineuxSansFamille: reserves }, ok: bons.length === hops.length && conflits === 0 && reserves.length === 0 };
})();
const k2 = (() => {
  // Toutes les voies « ajouter » (pas les dix premières : le classement place en tête celles qui débordent le moins, ce qui masquerait l'écart).
  const part = (rec: Recipe) => { const r = m.proposeVoies(rec, { resin: 1 }, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, moments: ['dryActive'], assemblages: false }); const v = r.voies.filter((x) => x.type === 'ajouter'); return { voies: v.length, horsStyle: v.filter((x) => x.styleOverflow.length || x.conflicts.length).length }; };
  const st = part({ ...BASE_NEUTRE, styleCode: '16D' }), lg = part({ ...BASE_NEUTRE, styleCode: '3B' }); // même recette, même levure : seul le style change
  const ps = st.voies ? st.horsStyle / st.voies : 0, pl = lg.voies ? lg.horsStyle / lg.voies : 0;
  const echelle = (code: string) => { const f = getStyleScale(code).families.resin; return { statut: f.status, bande: f.band, cran: arrondi(f.cran, 1) }; };
  return { id: 'K2', titre: '« Plus résineux » : la stout le tolère, la lager non', mots: '« un peu plus résineux pour une stout est pas très problématique, pour une lager kolsch très » (SPEC-BRASSEUR.md § 1, 18.10)',
    attendu: 'Pour la même visée (résineux +1), la part des voies hors style est plus forte sur la lager 3B que sur la stout 16D, d’au moins 25 points ; l’échelle du résineux n’est pas la même.',
    observe: { stout: { ...st, part: arrondi(ps, 2) }, lager: { ...lg, part: arrondi(pl, 2) }, echelleResineux16D: echelle('16D'), echelleResineux3B: echelle('3B') }, ok: pl - ps >= 0.25 };
})();
const k3 = (() => {
  const c = (code: string) => getStyleScale(code).families.citrus;
  const ipa = c('21A'), lag = c('3B');
  return { id: 'K3', titre: 'Agrumes : un écart faible en IPA est grand en lager', mots: '« le côté agrumes pour une ipa est infiniment plus subtil pour une cezc lager. Les échelles doivent être revu en fonction du style » (SPEC-BRASSEUR.md § 2, 18.10)',
    attendu: 'Le cran « plus agrumes » (points sur 0–100) est plus petit en lager 3B qu’en IPA 21A, au moins deux fois plus petit.',
    observe: { cran21A: arrondi(ipa.cran, 1), cran3B: arrondi(lag.cran, 1), bande21A: ipa.band, bande3B: lag.band }, ok: lag.cran * 2 <= ipa.cran };
})();
const k4 = (() => {
  const cl = classer('beermaverick-nelson-sauvin', 'dryActive');
  const bm = ['hallertau-blanc', 'enigma', 'motueka', 'riwaka'].map((s) => `beermaverick-${s}`);
  const rangs = bm.map((b) => ({ nom: nom(b), rang: cl.ordre.indexOf(b) < 0 ? null : cl.ordre.indexOf(b) + 1 }));
  const dansDix = rangs.filter((r) => r.rang !== null && r.rang <= 10).length;
  return { id: 'K4', titre: 'Nelson Sauvin : « sauvignon blanc », « houblon incroyable »', mots: '« nelson sauvin est un houbon ordinaire alors que c’est un un houbon incroyable » (l5f, SPEC-BRASSEUR.md § 1) ; « on voit pas que c’est Sauvignon blanc » (24.10)',
    attendu: 'Au dry hop, au moins deux des quatre substituts de Beer Maverick (Hallertau Blanc, Enigma, Motueka, Riwaka) dans les 10 premiers ; Hallertau Blanc (« white wine ») en fait partie.',
    observe: { rangsBM: rangs, top3: cl.ordre.slice(0, 3).map(nom) }, ok: dansDix >= 2 && rangs[0].rang !== null && rangs[0].rang <= 10 };
})();
const k5 = (() => {
  const g = classer('beermaverick-galaxy', 'dryActive'), s = classer('beermaverick-saaz-cz', 'dryActive');
  const sg = g.lignes.get('beermaverick-saaz-cz')!.score, gs = s.lignes.get('beermaverick-galaxy')!.score;
  return { id: 'K5', titre: 'Galaxy n’est pas Saaz', mots: '« différencier un houblon hyper aromatique type Galaxy d’un houblon plus fade type Saaz » ; « il faut aussi que on voit comme il faut les différences » (SPEC-BRASSEUR.md § 3, D131 ter)',
    attendu: 'Au dry hop, Galaxy n’est pas « très proche » (score ≥ 80) de Saaz, ni Saaz de Galaxy.',
    observe: { saazChezGalaxy: sg, galaxyChezSaaz: gs, rangSaazChezGalaxy: g.ordre.indexOf('beermaverick-saaz-cz') + 1, rangGalaxyChezSaaz: s.ordre.indexOf('beermaverick-galaxy') + 1 }, ok: sg < 80 && gs < 80 };
})();
const cas = [k1, k2, k3, k4, k5];
chrono('cinq cas');

// ---------- Sortie ----------
const resultats = {
  banc: { version: 1, issue: 181, graineEchantillon: GRAINE, poolSubstituer: `${N_HOUBLONS} variétés du catalogue, sans stock`, moteur: 'creerMoteur({ catalogue: CATALOGUE, stock: [] })' },
  verite: { houblonsAvecSubstituts: cibles.length, substitutsReferences: cibles.reduce((s, c) => s + c.attendus.length, 0), substitutsNonReliesIgnores: cibles.reduce((s, c) => s + c.nonReliesBm, 0), reciprocite: reciproque,
    attendusParHoublonMedian: mediane(cibles.map((c) => c.attendus.length)), parUsage: Object.fromEntries(USAGES.map((u) => [u, cibles.filter((c) => c.purpose === u).length])) },
  substituer: { nonRelies, parMoment: tableSubstituer, rankingsIdentiques: { b10_wp: memeOrdre('b10', 'wp'), b10_dry: memeOrdre('b10', 'dryActive'), sur: cibles.length }, aleatoire, drapeauxReference: flagStats, exemplesFaux },
  phares,
  suggerer: { resume: resumeSugg, inconnuLuCommeZero: inconnuZero, levure, echantillon: aN.sugg.map((s) => ({ x: s.x, dir: s.dir, nListe: s.nListe, rangX: s.rangX, groupeX: s.groupeX, premierGroupe: s.premierGroupe, rangsBM: s.obs.rangs.map((r) => arrondi(r, 1)) })), cas },
  erreurs: { causes: erreurs, inventaire },
  options: { poids: optPoids, poidsControleExact: exactPoids, motsSansFamille: optMots, radarBM: { tous: optRadar, surHoublonsAvecRadar: optRadarSous, nHoublonsAvecRadar: avecRadar.length }, motsSurHoublonsAvecRadar: optMotsRadarRef, motsPlusPoids: comboMots, motsNelsonSauvin: motsNelson },
};
const json = JSON.stringify(resultats, null, 1);
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'resultats.json'), json + '\n');
const { rapport } = await import('./rapport');
writeFileSync(join(SORTIE, 'rapport.md'), rapport(resultats as never, { pct, f1, f3 }));
chrono('écrit');
process.stdout.write(`sha256 ${createHash('sha256').update(json + '\n').digest('hex')}\n`);
void f1; void f3; void pct; void moyenne;
