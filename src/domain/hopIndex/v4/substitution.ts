// Remplaçants d'un houblon, calculés depuis les fiches du dépôt (#119, 18.10.2026 ; v2 le 26.10.2026, #181, D80).
// Le brasseur : « Et un système pour la substitution de houblons. » Beer Maverick publie des scores
// de substitution, mais ils n'ont pas été importés (fiche : substituts null) : rien n'en est repris ni
// imité. La ressemblance se calcule sur ce que les fiches savent vraiment : une ressemblance par variable (entre 0 et 1), puis la
// moyenne pondérée des variables connues des deux houblons. Un inconnu sort du calcul : il n'est jamais 0.
// Règle du prototype, à valider par le brasseur. Mesure hors ligne : scripts/eval-hop/moteur-v2.ts (même formule : formuleV2.ts).
import { catalogue as catalogueDuMoteur, courant, local, hopRef, type CatalogueHop, type HopRef } from './data';
import { Lru, borneHoublons } from './lru';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { REFERENCE, describeFamilies, familyWords, marquee } from './hops';
import { MOMENTS, ibuPerGram, type MomentId, type Recipe } from './recipe';
import { hopRole, roleFromAlpha, type HopRoleValue } from './roles';
import type { StyleScale } from './style/scale';
import { temoinNegatif } from './temoin';

export const SUBSTITUTION_METHOD = {
  nom: 'substitution calculée v2',
  date: '2026-10-26',
  statut: 'règle du prototype, à valider par le brasseur',
  sources: 'fiches du dépôt : familles et mots des descripteurs (Beer Maverick, Hopsteiner, faits cités), huile totale et composants de l’huile (Beer Maverick ; linalol Hopsteiner), α, β et cohumulone (Beer Maverick), radar d’arôme (Beer Maverick)',
  nonRepris: 'scores et substituts de Beer Maverick : non importés dans le dépôt, ni repris ni imités',
} as const;

export type SubstitutionContext = 'défaut' | 'amertume' | 'arôme';
export interface SubstitutionWeights { arome: number; huiles: number; amertume: number }
/** Les trois moments de la formule : amertume (premier moût, 60′, 30′, 15′), arôme chaud (10′ et après, en ébullition ou au whirlpool), à froid (dry hop). */
export type MomentSubstitution = 'amertume' | 'chaud' | 'froid';
/** Poids des trois groupes de variables par moment, appris sur la moitié d'apprentissage (scripts/eval-hop/moteur-v2.ts, rapport.md § 2). */
export const WEIGHTS_MOMENT: Record<MomentSubstitution, SubstitutionWeights> = {
  amertume: { arome: 0.1, huiles: 0.2, amertume: 0.7 },
  chaud: { arome: 0.5, huiles: 0.2, amertume: 0.3 },
  froid: { arome: 0.5, huiles: 0.3, amertume: 0.2 },
};
/** Poids des trois groupes selon le contexte : « arôme » et « défaut » lisent le moment chaud (le dry hop a ses propres poids : WEIGHTS_MOMENT.froid). */
export const WEIGHTS: Record<SubstitutionContext, SubstitutionWeights> = {
  défaut: WEIGHTS_MOMENT.chaud,
  amertume: WEIGHTS_MOMENT.amertume,
  arôme: WEIGHTS_MOMENT.chaud,
};
/** Part des mots dans l'arôme (hors radar) aux moments d'arôme, apprise avec les poids. */
const PART_MOTS: Record<MomentSubstitution, number> = { amertume: 0.5, chaud: 0.75, froid: 0.75 };
/** Paliers de lecture du score [H], à valider : ils servent aussi à « en stock d'abord ». */
export const PALIERS = [{ min: 80, label: 'très proche' }, { min: 65, label: 'proche' }, { min: 50, label: 'partiel' }, { min: 0, label: 'éloigné' }] as const;
export type Palier = (typeof PALIERS)[number]['label'];

export const RANKING = [
  'Candidats : les variétés du catalogue (Beer Maverick, 318) et les articles du stock sous une autre forme (Citra cryo) ; le houblon lui-même exclu ; la même variété sous une autre forme reste, signalée.',
  'Une ressemblance par variable, entre 0 et 1, puis la moyenne pondérée des variables connues des deux houblons (poids renormalisés). Un inconnu sort du calcul : jamais 0. Treize variables en trois groupes. Amertume : α et β (1 − |ln(rapport)| / ln 3 : un rapport de 3 ne ressemble plus), cohumulone (% des α), usage (rôle par la règle rôle-α v1 sur l’α variétal : même rôle 1, double face à un autre 0,5, amérisant face à aromatique 0). Huile : huile totale (rapport, comme l’α), myrcène, humulène, caryophyllène, farnésène, linalol (écart entre les moitiés centrales des deux plages, rapporté à deux écarts-types des milieux du catalogue : 1 − écart / 2σ, plancher 0 ; le géraniol n’a aucune valeur dans le catalogue et ne compte pas). Arôme : les 12 familles (vecteur : niveau de fiche / 2 × N fiches qui la citent / M fiches lues ; cosinus ; avec un style, les familles attendues comptent double), les mots fins des fiches (cosinus pondéré par leur rareté ; moins de 2 mots partagés : 0), le radar Beer Maverick à 9 axes (quand les deux l’ont ; un radar tout à zéro vaut « pas de donnée »).',
  'Trois jeux de poids (groupes amertume · huile · arôme, fixés sur la moitié d’apprentissage des substituts Beer Maverick, jugés sur l’autre). Moment d’amertume (premier moût, 60′, 30′, 15′) : 0,7 · 0,2 · 0,1. Arôme chaud (10′ et après, whirlpool) : 0,3 · 0,2 · 0,5, mots 0,75 de l’arôme hors radar. À froid (dry hop) : 0,2 · 0,3 · 0,5, mots 0,75. À l’intérieur d’un groupe, les poids sont fixés à la main selon le moment (cohumulone, humulène et caryophyllène comptent à l’amertume ; linalol, huile totale et mots pèsent plus à froid). Le radar compte pour 0,1 de l’arôme, aux moments d’arôme seulement.',
  'Contexte amertume, en brasseur : l’arôme de l’original part à l’ébullition, l’arôme ne compte que par la part étrangère du remplaçant (1 − part de son vecteur sur des familles que l’original ne cite pas) ; un α plus haut vaut 1 (moins de matière pour le même IBU) ; amérisant et double tiennent le même rôle ; ni les mots ni le radar n’y comptent.',
  'Composantes affichées : un score par groupe (amertume, huile, arôme), moyenne pondérée des variables connues du groupe ; « inconnue » seulement quand aucune variable du groupe n’est connue des deux houblons. Couverture : bonne (arôme et au moins deux variables d’huile), partielle (moins de deux variables d’huile), faible (ni familles ni mots) ; un score faible n’est jamais présenté comme une ressemblance d’arôme.',
  'Classement lexicographique : 1) avec un style, conflit derrière (le remplaçant marque une famille indésirable du style que l’original ne cite pas : la moitié au moins de ses fiches la citent, D90) ; 2) couverture faible derrière ; 3) à un moment d’amertume, produit d’arôme ou houblon aromatique derrière (règle suivante) ; 4) si « en stock d’abord » : palier du score (très proche ≥ 80, proche ≥ 65, partiel ≥ 50, éloigné), puis en stock suffisant, en stock insuffisant, à acheter (épuisé compris) : le stock ne passe jamais devant un palier meilleur ; 5) score décroissant (entier) ; 6) nom. Égalité de toutes les clés : même rang.',
  'Amertume en brasseur (premier moût, 60′, 30′, 15′) : un brasseur n’amérise pas avec un produit d’arôme ni avec un houblon aromatique (usage et coût). Les produits cryo, lupuline ou poudre (lus dans le nom, les alias ou la forme de la fiche ou de l’article du stock) et les houblons de rôle aromatique (rôle du moteur : fournisseur, sinon règle rôle-α v1) passent après les amérisants et doubles usages, même à score égal ou supérieur ; raison écrite « produit d’arôme, cher pour amériser » ou « houblon aromatique, cher pour amériser ». Ne s’applique pas si l’original est lui-même aromatique ou un produit d’arôme (choix délibéré du brasseur). Le score ne change pas : seul l’ordre change.',
  'Dose : même IBU au même moment (BrewingMath.hopIbu, linéaire en α) : g du remplaçant = IBU de l’original ÷ IBU par gramme du remplaçant ; plage par l’α du remplaçant (lot, sinon plage variétale). À froid, ou sans IBU au moment choisi : à masse égale.',
  'Gains et pertes : familles dont le niveau de fiche (0 non décrit, 1 cité, 2 marqué) monte ou descend. C’est une citation dans les fiches, pas une intensité dans la bière.',
];

type Range = [number, number];
const OILS = ['myrcene', 'humulene', 'caryophyllene', 'farnesene', 'linalool'] as const;
export type OilId = (typeof OILS)[number];
const OIL_NAMES: Record<OilId, string> = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
type Level = 0 | 1 | 2;
export type BitterPart = 'α' | 'β' | 'cohumulone' | 'rôle';

// Les variables de la formule : indices communs à tout le fichier (même ordre que scripts/eval-hop/formuleV2.ts).
const V_ALPHA = 0, V_BETA = 1, V_COHU = 2, V_USAGE = 3, V_HUILE = 4, V_MYR = 5, V_HUM = 6, V_CAR = 7, V_FAR = 8, V_LIN = 9, V_GER = 10, V_FAM = 11, V_MOTS = 12, V_RADAR = 13;
const NV = 14;
/** Variables de composition comparées par écart de plages, et le composant de l'huile qu'elles désignent. */
const ECARTS: [number, OilId | null][] = [[V_COHU, null], [V_MYR, 'myrcene'], [V_HUM, 'humulene'], [V_CAR, 'caryophyllene'], [V_FAR, 'farnesene'], [V_LIN, 'linalool']];
const HUILE_VARS = [V_HUILE, V_MYR, V_HUM, V_CAR, V_FAR, V_LIN, V_GER];
/** Poids à l'intérieur de chaque groupe, fixés à la main selon le moment (la somme d'un groupe vaut 1) : [α, β, cohumulone, usage] et
 * [huile totale, myrcène, humulène, caryophyllène, farnésène, linalol, géraniol]. */
const PROFILS: Record<MomentSubstitution, { amertume: number[]; huile: number[] }> = {
  // D102 (J1, 26.10) : à 60′ l'α passe de 0,4 à 0,15 dans le groupe d'amertume (β 0,25, cohumulone 0,3, usage 0,3). L'α portait 43 % de la dispersion des scores (50 % chez les amérisants) ;
  // il en porte 14 %. Principe du brasseur : l'α se règle par la dose (doseOf : même IBU), il compte mais pas seul, et selon le style. Mesuré par f1 (partie 3) sur l'autre moitié :
  // |ΔMRR| ≤ 0,01, intervalles autour de zéro : ni gain ni perte mesurés, la raison est le principe, pas un gain de banc. Dry hop et arôme chaud : inchangés.
  amertume: { amertume: [0.15, 0.25, 0.3, 0.3], huile: [0.25, 0.05, 0.3, 0.25, 0.05, 0.05, 0.05] },
  chaud: { amertume: [0.3, 0.2, 0.1, 0.4], huile: [0.2, 0.15, 0.15, 0.1, 0.1, 0.2, 0.1] },
  froid: { amertume: [0.25, 0.15, 0.1, 0.5], huile: [0.25, 0.1, 0.1, 0.05, 0.1, 0.25, 0.15] },
};
/** Poids de chaque variable : poids du groupe × poids intérieur (arôme : familles, mots, radar ; à l'amertume, les familles seules). */
function poidsVariables(mo: MomentSubstitution, g: SubstitutionWeights, partMots: number): Float64Array {
  const w = new Float64Array(NV), p = PROFILS[mo];
  p.amertume.forEach((x, i) => { w[i] = g.amertume * x; });
  p.huile.forEach((x, i) => { w[V_HUILE + i] = g.huiles * x; });
  if (mo === 'amertume') w[V_FAM] = g.arome;
  else { w[V_FAM] = g.arome * 0.9 * (1 - partMots); w[V_MOTS] = g.arome * 0.9 * partMots; w[V_RADAR] = g.arome * 0.1; }
  return w;
}
const GROUPES: number[][] = [[V_ALPHA, V_BETA, V_COHU, V_USAGE], HUILE_VARS, [V_FAM, V_MOTS, V_RADAR]];

interface MotsPoids { w: Map<string, number>; n2: number }
interface Features {
  key: string; ref: HopRef;
  levels: Record<FamilyId, Level>;
  /** D90 (g2c) : familles marquées (citées par la moitié au moins des fiches) : seules elles font un conflit de style. */
  marquees: Record<FamilyId, boolean>;
  /** Vecteur d'arôme (niveau / 2 × N/M) ; null si aucune famille citée. */
  aroma: Record<FamilyId, number> | null;
  /** Plages des variables de composition, indexées par variable (V_ALPHA, V_BETA, V_COHU, V_HUILE, V_MYR… V_LIN) ; null : inconnue. */
  pl: (Range | null)[];
  role: HopRoleValue | null;
  /** Mots des fiches (poids de rareté) ; null si la fiche n'en a aucun. Radar à 9 axes ; null s'il manque ou vaut zéro partout (« pas de donnée »). */
  mots: MotsPoids | null; radar: number[] | null;
  /** Vecteurs dans l'ordre de FAMILIES (calcul du classement sans objet intermédiaire). */
  levelsV: Level[]; aromaV: number[] | null;
  /** Raison de passer après les amérisants à un moment d'amertume (bitterDemotion, côté remplaçant) ; undefined : pas encore lue. */
  demotion?: string | null;
}
const mid = (r: Range) => (r[0] + r[1]) / 2;
const half = (r: Range) => (r[1] - r[0]) / 2;
const round = (x: number, n = 0) => Math.round(x * 10 ** n) / 10 ** n;
const fr = (x: number, n = 1) => String(round(x, n)).replace('.', ',');
/** Plage utilisable : deux bornes finies, la haute positive (une borne seule ou [0, 0] vaut « inconnu »). */
const valide = (r: [number, number] | null | undefined): Range | null => (r && Number.isFinite(r[0]) && Number.isFinite(r[1]) && r[1] > 0 ? [r[0], r[1]] : null);
/** Plages d'une fiche, indexées par variable (usage, familles, mots, radar : null ici). */
function plagesDe(c: CatalogueHop): (Range | null)[] {
  const pl: (Range | null)[] = new Array(V_GER + 1).fill(null);
  pl[V_ALPHA] = valide(c.alpha); pl[V_BETA] = valide(c.beta); pl[V_COHU] = valide(c.cohumulone); pl[V_HUILE] = valide(c.oil ?? c.hs?.totalOil);
  pl[V_MYR] = valide(c.oils.myrcene); pl[V_HUM] = valide(c.oils.humulene); pl[V_CAR] = valide(c.oils.caryophyllene); pl[V_FAR] = valide(c.oils.farnesene); pl[V_LIN] = valide(c.hsLinalool?.range);
  return pl;
}

/** Mots de chaque variété du catalogue et leur poids de rareté log((N+1) / (max(df, 8)+1)) : un mot compte comme s'il figurait dans 8 fiches au moins. Une fois par moteur. */
const PLAFOND_DF = 8;
const motsDuCatalogue = () => local('substitution:mots', () => {
  const norm = (x: string) => x.toLowerCase().replace(/[_-]+/g, ' ');
  const cat = catalogueDuMoteur(), df = new Map<string, number>(), parId = new Map<string, Set<string>>();
  for (const c of cat) {
    const w = familyWords(c.id), s = new Set<string>();
    for (const f of FAMILIES) for (const row of w.mots[f]) for (const x of row.mots) s.add(norm(x));
    for (const x of w.sansFamille) s.add(norm(x.mot));
    parId.set(c.id, s);
    for (const x of s) df.set(x, (df.get(x) ?? 0) + 1);
  }
  const out = new Map<string, MotsPoids>();
  for (const [id, s] of parId) {
    const w = new Map<string, number>(); let n2 = 0;
    for (const x of s) { const y = Math.log((cat.length + 1) / (Math.max(df.get(x) ?? 0, PLAFOND_DF) + 1)); w.set(x, y); n2 += y * y; }
    out.set(id, { w, n2 });
  }
  return out;
});

/** Traits d'un houblon : un cache borné par moteur (deux fois les houblons connus : un classement n'y recalcule rien). */
const featureCache = () => local('substitution:traits', () => new Lru<Features>(borneHoublons(courant().catalogue.length + courant().stock.length)));
function features(key: string): Features {
  const cache = featureCache();
  const hit = cache.get(key);
  if (hit) return hit;
  const ref = hopRef(key);
  if (!ref) throw Error(`Houblon inconnu : ${key}`);
  const c = ref.catalogue, desc = describeFamilies(ref.varietyId);
  // Une passe sur les familles (mêmes valeurs que les Object.fromEntries d'avant ; ordre des clés : FAMILIES).
  const levels = {} as Record<FamilyId, Level>, levelsV: Level[] = [], marquees = {} as Record<FamilyId, boolean>;
  let cited = false, marked = false;
  for (const f of FAMILIES) {
    marquees[f] = marquee(ref.varietyId, f);
    const l: Level = desc[f].level === 'marqué' ? 2 : desc[f].level === 'cité' ? 1 : 0;
    levels[f] = l; levelsV.push(l);
    if (l > 0) cited = true;
    if (l === 2) marked = true;
  }
  let aroma: Record<FamilyId, number> | null = null, aromaV: number[] | null = null;
  if (cited) {
    aroma = {} as Record<FamilyId, number>; aromaV = [];
    for (const f of FAMILIES) { const x = desc[f].of ? (levels[f] / 2) * (desc[f].sources / desc[f].of) : 0; aroma[f] = x; aromaV.push(x); }
  }
  const pl = plagesDe(c), mots = motsDuCatalogue().get(ref.varietyId) ?? null;
  const out: Features = {
    key, ref, levels, marquees, aroma, pl,
    role: pl[V_ALPHA] ? roleFromAlpha(mid(pl[V_ALPHA]), marked) : null,
    mots: mots && mots.w.size ? mots : null,
    radar: c.bm?.arome && c.bm.arome.some((x) => x > 0) ? c.bm.arome : null,
    levelsV, aromaV,
  };
  cache.set(key, out);
  return out;
}

/** Écart-type des milieux de plage du catalogue, par variable de composition (échelle de comparaison ; 0 si aucune valeur : la variable ne compte pas). */
const sigmas = (): number[] => local('substitution:sigma', sigmaDuCatalogue);
function sigmaDuCatalogue(): number[] {
  const pls = catalogueDuMoteur().map(plagesDe), out = new Array<number>(NV).fill(0);
  for (const [v] of ECARTS) {
    const xs = pls.map((p) => p[v]).filter((r): r is Range => !!r).map(mid);
    if (!xs.length) continue;
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    out[v] = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
  }
  return out;
}
/** Écart-types utilisés, pour les lire dans le pack. */
export const oilScales = () => Object.fromEntries(ECARTS.filter((e): e is [number, OilId] => e[1] !== null).map(([v, o]) => [o, round(sigmas()[v], 2)])) as Record<OilId, number>;

const ratioSim = (x: number, y: number) => Math.max(0, 1 - Math.abs(Math.log(x / y)) / Math.log(3));
const roleSim = (x: HopRoleValue, y: HopRoleValue) => (x === y ? 1 : x === 'double' || y === 'double' ? 0.5 : 0);
/** Ressemblance de chaque variable entre l'original `a` et le candidat `b`, dans `out` (NaN : inconnue d'au moins un des deux) ; W : poids par
 * famille (2 pour une famille attendue par le style). Même arithmétique et même ordre de somme que scripts/eval-hop/formuleV2.ts. */
function ressemblances(a: Features, b: Features, amertume: boolean, W: number[], sg: number[], out: Float64Array): void {
  out.fill(Number.NaN);
  const pa = a.pl, pb = b.pl;
  // À l'amertume, un α plus haut n'est pas un défaut (moins de matière pour le même IBU) ; amérisant et double y tiennent le même rôle.
  if (pa[V_ALPHA] && pb[V_ALPHA]) out[V_ALPHA] = amertume && mid(pb[V_ALPHA]) >= mid(pa[V_ALPHA]) ? 1 : ratioSim(mid(pa[V_ALPHA]), mid(pb[V_ALPHA]));
  if (pa[V_BETA] && pb[V_BETA]) out[V_BETA] = ratioSim(mid(pa[V_BETA]), mid(pb[V_BETA]));
  if (a.role && b.role) out[V_USAGE] = amertume && a.role !== 'aromatique' && b.role !== 'aromatique' ? 1 : roleSim(a.role, b.role);
  if (pa[V_HUILE] && pb[V_HUILE]) out[V_HUILE] = ratioSim(mid(pa[V_HUILE]), mid(pb[V_HUILE]));
  for (const [v] of ECARTS) {
    const x = pa[v], y = pb[v];
    if (!x || !y || !sg[v]) continue;
    const gap = Math.max(0, Math.abs(mid(x) - mid(y)) - (half(x) + half(y)) / 2);
    out[v] = Math.max(0, 1 - gap / (2 * sg[v]));
  }
  // Familles : cosinus ; à l'amertume, 1 − part du vecteur du candidat sur des familles que l'original ne cite pas.
  const A = a.aromaV, B = b.aromaV;
  if (A && B) {
    if (amertume) {
      let foreign = 0, total = 0;
      for (let i = 0; i < W.length; i++) { total += W[i] * B[i]; if (a.levelsV[i] === 0) foreign += W[i] * B[i]; }
      if (total) out[V_FAM] = 1 - foreign / total;
    } else {
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < W.length; i++) { dot += W[i] * A[i] * B[i]; na += W[i] * A[i] ** 2; nb += W[i] * B[i] ** 2; }
      out[V_FAM] = na && nb ? dot / Math.sqrt(na * nb) : 0;
    }
  }
  // Mots : cosinus pondéré par la rareté ; moins de 2 mots partagés : 0.
  if (a.mots && b.mots) {
    let dot = 0, n = 0;
    for (const [x, y] of a.mots.w) if (b.mots.w.has(x)) { dot += y * y; n++; }
    out[V_MOTS] = n < 2 ? 0 : a.mots.n2 && b.mots.n2 ? dot / Math.sqrt(a.mots.n2 * b.mots.n2) : 0;
  }
  // Radar Beer Maverick (9 axes).
  if (a.radar && b.radar) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < 9; i++) { dot += a.radar[i] * b.radar[i]; na += a.radar[i] ** 2; nb += b.radar[i] ** 2; }
    if (na && nb) out[V_RADAR] = dot / Math.sqrt(na * nb);
  }
}
/** Score entier (0–100) : moyenne pondérée des variables connues dont le poids est positif ; 0 sans aucune. */
function scoreDe(s: Float64Array, w: Float64Array): number {
  let tw = 0, num = 0;
  for (let v = 0; v < NV; v++) { const x = s[v]; if (w[v] > 0 && x === x) { tw += w[v]; num += w[v] * x; } }
  return tw > 0 ? round((100 * num) / tw) : 0;
}
/** Score d'un groupe (poids intérieurs du moment), ou null si aucune de ses variables n'est connue des deux. */
function scoreGroupe(s: Float64Array, w: Float64Array, ids: number[]): number | null {
  let tw = 0, num = 0;
  for (const v of ids) { const x = s[v]; if (w[v] > 0 && x === x) { tw += w[v]; num += w[v] * x; } }
  return tw > 0 ? round((100 * num) / tw) : null;
}
const INTERIEUR: SubstitutionWeights = { arome: 1, huiles: 1, amertume: 1 };

export interface FamilyMove { family: FamilyId; de: Level; a: Level }
export interface SubstituteDose {
  moment: MomentId; momentLabel: string;
  /** Masse du remplaçant (g) à l'α retenu ; min et max par la plage d'α du remplaçant. */
  grams: number; min: number; max: number;
  regle: 'même IBU' | 'masse égale'; ibu: number | null; raison?: string;
}
export interface Substitute {
  rank: number; key: string; name: string;
  score: number; palier: Palier;
  /** Un score par groupe de variables (amertume, huile, arôme) ; null : aucune variable du groupe n'est connue des deux houblons. */
  composantes: { arome: number | null; huiles: number | null; amertume: number | null };
  couverture: { arome: boolean; huiles: (OilId | 'totale')[]; amertume: BitterPart[]; fiabilite: 'bonne' | 'partielle' | 'faible' };
  familles: { communes: FamilyId[]; gagne: FamilyMove[]; perd: FamilyMove[] };
  dose: SubstituteDose;
  stock: { etat: 'en stock' | 'épuisé' | 'à acheter'; libre: number | null; suffisant: boolean | null };
  conflitsStyle: FamilyId[];
  memeVariete: boolean;
  /** À un moment d'amertume : pourquoi ce remplaçant passe après les amérisants et doubles usages ; sinon null. */
  amertumeDeconseillee: string | null;
  raison: string;
}
export interface SubstitutionOptions {
  /** Moment de l'original : règle la dose (même IBU à ce moment) et, sans contexte donné, les poids. Défaut 60′. */
  moment?: MomentId;
  /** Masse de l'original (g) ; défaut 1 g (la dose se lit alors en g par g). */
  grams?: number;
  /** Recette : base d'IBU et stock libre (stock moins ses ajouts). Défaut : référence 20 L, DI 1,050, 60 min. */
  recipe?: Recipe;
  /** Poids : défaut, amertume ou arôme ; sans valeur, déduit du moment donné (sinon défaut). */
  context?: SubstitutionContext;
  /** Style : familles attendues comptées double dans l'arôme, familles indésirables gagnées en conflit. */
  style?: StyleScale;
  /** « En stock d'abord » (dans un même palier de score). */
  stockFirst?: boolean;
  limit?: number;
  /** Poids des trois groupes imposés (témoin négatif, essais) ; prioritaires sur le moment. */
  weights?: SubstitutionWeights;
  /** Candidats imposés (clés) ; défaut : catalogue et articles du stock. */
  pool?: string[];
}
export interface SubstitutionResult {
  key: string; name: string; methode: typeof SUBSTITUTION_METHOD;
  contexte: SubstitutionContext; poids: SubstitutionWeights; stockFirst: boolean; style: string | null;
  reference: { moment: MomentId; momentLabel: string; grams: number; ibu: number | null };
  /** Ce que la fiche de l'original ne dit pas (variables privées de comparaison). */
  manque: string[];
  candidats: number; remplacants: Substitute[]; regle: string[];
}

const ZERO: SubstitutionWeights = { arome: 0, huiles: 0, amertume: 0 };
const palierOf = (score: number): Palier => PALIERS.find((p) => score >= p.min)!.label;
const PALIER_RANK = Object.fromEntries(PALIERS.map((p, i) => [p.label, i])) as Record<Palier, number>;
const stockRank = (s: Substitute['stock']) => (s.etat === 'en stock' ? (s.suffisant === false ? 1 : 0) : 2);
const defaultRecipe = (): Recipe => ({ name: 'référence', styleCode: '', volumeL: REFERENCE.volumeL, og: REFERENCE.og, boilMin: REFERENCE.boilMin, yeastId: REFERENCE.yeastId, additions: [] });
const gramsRound = (g: number) => round(g, g < 10 ? 2 : 1);

function doseOf(orig: HopRef, sub: HopRef, moment: MomentId, grams: number, recipe: Recipe): SubstituteDose {
  const label = MOMENTS[moment].label;
  const same = (raison: string): SubstituteDose => ({ moment, momentLabel: label, grams: gramsRound(grams), min: gramsRound(grams), max: gramsRound(grams), regle: 'masse égale', ibu: null, raison });
  const timing = MOMENTS[moment].timing;
  if (timing === 'fermentation' || timing === 'postFermentation') return same('À froid : pas d’IBU, à masse égale.');
  const k0 = orig.alpha ? ibuPerGram(orig.alpha.value, moment, recipe) : 0;
  if (k0 <= 0) return same(orig.alpha ? `Aucun IBU à ${label} : à masse égale.` : 'α de l’original inconnu : à masse égale.');
  if (!sub.alpha) return same('α du remplaçant inconnu : à masse égale.');
  const ibu = grams * k0, k = (a: number) => ibuPerGram(a, moment, recipe);
  return { moment, momentLabel: label, grams: gramsRound(ibu / k(sub.alpha.value)), min: gramsRound(ibu / k(sub.alpha.max)), max: gramsRound(ibu / k(sub.alpha.min)), regle: 'même IBU', ibu: round(ibu, 2) };
}

/** Produit d'arôme (cryo, lupuline, poudre) lisible dans le nom, les alias ou la forme de la fiche ou de l'article. */
const AROMA_PRODUCT: [RegExp, string][] = [[/cryo/i, 'cryo'], [/lupul|lupomax/i, 'lupuline'], [/poudre|powder/i, 'poudre']];
function aromaProduct(ref: HopRef): string | null {
  const text = [ref.name, ...ref.catalogue.aliases, (ref.catalogue as { form?: string }).form ?? '', ref.stock?.form ?? '', ...(ref.stock?.items ?? [])].join(' ');
  return AROMA_PRODUCT.find(([re]) => re.test(text))?.[1] ?? null;
}
const roleCache = () => local('substitution:roles', () => new Lru<ReturnType<typeof hopRole>>(borneHoublons(courant().catalogue.length + courant().stock.length)));
const engineRole = (key: string) => roleCache().obtenir(key, () => hopRole(key));
/** Produit d'arôme d'un houblon, une fois par moteur (lu à chaque classement d'amertume, pour chaque candidat). */
const produitCache = () => local('substitution:produits', () => new Lru<string | null>(borneHoublons(courant().catalogue.length + courant().stock.length)));
const produitDe = (ref: HopRef) => produitCache().obtenir(ref.key, () => aromaProduct(ref));
/** D102 (A) : la forme de produit d'arôme (« cryo », « lupuline », « poudre ») d'un houblon, par sa clé, ou null. La même lecture que la démotion d'amertume de Substituer :
 * Suggérer la partage à 60′ (voies.ts, infoPalierDe) pour que les deux écrans disent la même chose d'un cryo. */
export const produitDArome = (key: string): string | null => { const ref = hopRef(key); return ref ? produitDe(ref) : null; };
/** Raison de passer après les amérisants et doubles usages à un moment d'amertume, ou null. */
/** L'original échappe-t-il à la règle (contexte d'arôme, ou lui-même produit d'arôme ou aromatique) ? */
const demotionExclue = (orig: HopRef, context: SubstitutionContext) => context !== 'amertume' || !!produitDe(orig) || engineRole(orig.key).value === 'aromatique' || orig.catalogue.purpose === 'aroma';
function demotionDe(sub: HopRef): string | null {
  const product = produitDe(sub);
  if (product) return `produit d’arôme (${product}), cher pour amériser`;
  const role = engineRole(sub.key);
  if (role.value === 'aromatique') return `houblon aromatique (${role.source}), cher pour amériser`;
  // D106 (3) : la même lecture que Suggérer à 60′ (rangUsage : l'usage « arôme » de Beer Maverick passe après les amérisants et doubles usages). Le moteur lit le rôle par l'α : un houblon d'usage
  // « arôme » à α 9 à 18 % (Falconer's Flight, Altus, Akoya, Loral, Sequoia Blend) lui paraissait amérisant ; il recule aussi ici, avec sa raison écrite. L'α reste réglé par la dose.
  return sub.catalogue.purpose === 'aroma' ? 'usage « arôme » (Beer Maverick), cher pour amériser' : null;
}

const names = (fs: FamilyId[]) => fs.map((f) => FAMILY_NAMES[f].toLowerCase()).join(', ');
function reasonOf(s: Omit<Substitute, 'rank' | 'raison'>, orig: Features, sub: Features): string {
  if (s.memeVariete) return `Même variété, autre forme (${s.name}) : même profil des fiches ; dose à ${s.dose.regle === 'même IBU' ? 'IBU égal' : 'masse égale'}${s.amertumeDeconseillee ? ` ; ${s.amertumeDeconseillee}` : ''}.`;
  const parts: string[] = [];
  if (!s.couverture.arome) parts.push(`Arôme inconnu (${!sub.aroma ? s.name : orig.ref.name} : aucune famille citée) ; score sur l’huile et l’amertume seulement`);
  else {
    parts.push(s.familles.communes.length ? `En commun : ${names(s.familles.communes.slice(0, 3))}` : 'Aucune famille en commun');
    const lost = s.familles.perd.filter((m) => m.a === 0).map((m) => m.family), won = s.familles.gagne.filter((m) => m.de === 0).map((m) => m.family);
    if (lost.length) parts.push(`perd ${names(lost.slice(0, 2))}`);
    if (won.length) parts.push(`gagne ${names(won.slice(0, 2))}`);
  }
  // L'α qui fait la dose : celui du lot quand il est connu (sinon le milieu de la plage variétale),
  // pour que « α 9,6 % (lot) » et « 62 g » se lisent ensemble ; le score, lui, compare les variétés.
  const alphaDose = (r: HopRef) => r.alpha && `${fr(r.alpha.value)} %${r.alpha.min === r.alpha.max ? ' (lot)' : ''}`;
  if (orig.pl[V_ALPHA] && sub.pl[V_ALPHA] && orig.ref.alpha && sub.ref.alpha) parts.push(`α ${alphaDose(sub.ref)} contre ${alphaDose(orig.ref)}`);
  if (s.conflitsStyle.length) parts.push(`indésirable au style : ${names(s.conflitsStyle)}`);
  if (s.amertumeDeconseillee) parts.push(s.amertumeDeconseillee);
  const text = parts.join(' ; ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

/** Remplaçants classés d'un houblon (clé du prototype : id de variété, « :cryo » pour l'article Cryo).
 * Deux temps (#164) : 1) chaque candidat reçoit son score et ses clés de classement (couverture, conflit,
 * amertume déconseillée, stock) ; 2) seuls les rendus (`limit`) reçoivent composantes, familles, dose, raison. Même classement et
 * mêmes rendus qu'en un seul temps : la dose n'entre dans le classement que par « stock suffisant », calculée alors
 * pour les candidats en stock. */
export function substitutes(key: string, options: SubstitutionOptions = {}): SubstitutionResult {
  const orig = features(key);
  const moment = options.moment ?? 'b60', grams = options.grams ?? 1, recipe = options.recipe ?? defaultRecipe();
  const context: SubstitutionContext = options.context ?? (options.moment ? (MOMENTS[options.moment].kind === 'amertume' ? 'amertume' : 'arôme') : 'défaut');
  // Les trois moments de la formule : amertume, arôme chaud, à froid (dry hop : fermentation active ou après).
  const timing = MOMENTS[moment].timing;
  const mo: MomentSubstitution = context === 'amertume' ? 'amertume' : context === 'arôme' && (timing === 'fermentation' || timing === 'postFermentation') ? 'froid' : 'chaud';
  const poidsGroupes = options.weights ?? (context === 'arôme' || context === 'amertume' ? WEIGHTS_MOMENT[mo] : WEIGHTS.défaut);
  // Témoin négatif : V4_TEMOIN_NEGATIF=substitution met tous les poids à zéro (scores nuls, ordre alphabétique).
  const w = temoinNegatif() === 'substitution' ? ZERO : poidsGroupes;
  const wv = poidsVariables(mo, w, PART_MOTS[mo]);
  const style = options.style?.documented ? options.style : undefined;
  const pool = options.pool ?? [...catalogueDuMoteur().map((c) => c.id), ...courant().stockHorsCatalogue];
  const usedBy = new Map<string, number>();
  for (const a of recipe.additions ?? []) usedBy.set(a.hopKey, (usedBy.get(a.hopKey) ?? 0) + a.grams);
  const used = (k: string) => usedBy.get(k) ?? 0;
  const stockFirst = !!options.stockFirst;

  // 1) Score et clés de classement de chaque candidat.
  interface Ligne {
    k: string; sub: Features; name: string; score: number; palier: Palier;
    fiabilite: Substitute['couverture']['fiabilite'];
    stock: Substitute['stock']; dose: SubstituteDose | null; conflitsStyle: FamilyId[]; amertumeDeconseillee: string | null; cles: number[];
    /** Les clés en un nombre (ordre lexicographique : chaque clé est bornée), quand le score est un entier de 0 à 100. */
    rang: number;
  }
  const lignes: Ligne[] = [];
  const amertume = context === 'amertume';
  const exclue = demotionExclue(orig.ref, context);
  const W = FAMILIES.map((f) => (style?.documented && style.families[f].status === 'attendue' ? 2 : 1));
  const sg = sigmas(), s = new Float64Array(NV);
  // Familles indésirables au style que l'original ne cite pas : un conflit si le candidat en marque une (D90 ; ordre de FAMILIES).
  const indesirables = style ? FAMILIES.filter((f) => style.families[f].status === 'indésirable' && orig.levels[f] === 0) : [];
  for (const k of pool) {
    if (k === key) continue;
    const sub = features(k);
    ressemblances(orig, sub, amertume, W, sg, s);
    const score = scoreDe(s, wv);
    // Faible : ni familles ni mots connus des deux ; partielle : moins de deux variables d'huile connues.
    let nHuile = 0;
    for (const v of HUILE_VARS) if (s[v] === s[v]) nHuile++;
    const fiabilite = s[V_FAM] !== s[V_FAM] && s[V_MOTS] !== s[V_MOTS] ? 'faible' : nHuile < 2 ? 'partielle' : 'bonne';
    const st = sub.ref.stock, libre = st ? round(st.grams - used(k), 1) : null;
    const etat = !st ? 'à acheter' : libre! > 0 ? 'en stock' : 'épuisé';
    const dose = etat === 'en stock' ? doseOf(orig.ref, sub.ref, moment, grams, recipe) : null;
    const stock: Substitute['stock'] = { etat, libre, suffisant: etat === 'en stock' ? libre! >= dose!.grams : null };
    // D90 (g2c) : un conflit de style seulement si la famille indésirable est marquée chez le candidat (plus pour une fiche isolée).
    const conflitsStyle = indesirables.length ? indesirables.filter((f) => sub.marquees[f]) : indesirables;
    const amertumeDeconseillee = exclue ? null : sub.demotion !== undefined ? sub.demotion : (sub.demotion = demotionDe(sub.ref));
    const palier = palierOf(score);
    const c0 = conflitsStyle.length ? 1 : 0, c1 = fiabilite === 'faible' ? 1 : 0, c2 = amertumeDeconseillee ? 1 : 0;
    const cles = stockFirst ? [c0, c1, c2, PALIER_RANK[palier], stockRank(stock), -score] : [c0, c1, c2, -score];
    const rang = ((((c0 * 2 + c1) * 2 + c2) * 4 + (stockFirst ? PALIER_RANK[palier] : 0)) * 3 + (stockFirst ? stockRank(stock) : 0)) * 101 + (100 - score);
    lignes.push({ k, sub, name: sub.ref.name, score, palier, fiabilite, stock, dose, conflitsStyle, amertumeDeconseillee, cles, rang });
  }
  // Classement : clés, puis nom. Le rang numérique vaut les clés quand chaque score est un entier de 0 à 100 (toujours, sauf
  // poids imposés hors de [0, 1]) ; sinon, comparaison clé par clé. Avec une limite, seuls les candidats dont le rang ne
  // dépasse pas celui du dernier rendu sont triés par nom (les ex aequo de la limite compris) : même ordre qu'un tri complet.
  const entiers = lignes.every((l) => Number.isInteger(l.score) && l.score >= 0 && l.score <= 100);
  const cmp = entiers ? (x: Ligne, y: Ligne) => x.rang - y.rang
    : (x: Ligne, y: Ligne) => { const kx = x.cles, ky = y.cles; for (let i = 0; i < kx.length; i++) if (kx[i] !== ky[i]) return kx[i] - ky[i]; return 0; };
  const limite = Math.min(options.limit ?? lignes.length, lignes.length);
  let tries = lignes;
  if (entiers && limite > 0 && limite < lignes.length) {
    const seuil = Float64Array.from(lignes, (l) => l.rang).sort()[limite - 1];
    tries = lignes.filter((l) => l.rang <= seuil);
  }
  // c6 (D175) : à égalité de rang, une variété à peu de données (une source, pas d'α) ne passe jamais devant une variété documentée ; puis le nom.
  tries.sort((x, y) => cmp(x, y) || Number(!!x.sub.ref.catalogue.peuDeDonnees) - Number(!!y.sub.ref.catalogue.peuDeDonnees) || NOMS.compare(x.name, y.name));

  // 2) Les rendus seulement : composantes, couverture, familles, dose, raison.
  const rendus = tries.slice(0, limite);
  const remplacants: Substitute[] = [];
  const wi = poidsVariables(mo, INTERIEUR, PART_MOTS[mo]);
  rendus.forEach((l, i) => {
    const { sub } = l;
    ressemblances(orig, sub, amertume, W, sg, s);
    const [gb, go, ga] = [scoreGroupe(s, wi, GROUPES[0]), scoreGroupe(s, wi, GROUPES[1]), scoreGroupe(s, wi, GROUPES[2])];
    const connue = (v: number) => s[v] === s[v];
    const communes = FAMILIES.filter((f) => orig.levels[f] > 0 && sub.levels[f] > 0).sort((x, y) => Math.min(sub.levels[y], orig.levels[y]) - Math.min(sub.levels[x], orig.levels[x]));
    const moves = FAMILIES.filter((f) => orig.levels[f] !== sub.levels[f]).map((f) => ({ family: f, de: orig.levels[f], a: sub.levels[f] }));
    const dose = l.dose ?? doseOf(orig.ref, sub.ref, moment, grams, recipe);
    const row: Omit<Substitute, 'rank' | 'raison'> = {
      key: l.k, name: l.name, score: l.score, palier: l.palier,
      composantes: { arome: ga, huiles: go, amertume: gb },
      couverture: {
        arome: ga !== null,
        huiles: [...(connue(V_HUILE) ? ['totale' as const] : []), ...ECARTS.filter((e): e is [number, OilId] => e[1] !== null && connue(e[0])).map((e) => e[1])],
        amertume: [...(connue(V_ALPHA) ? ['α' as const] : []), ...(connue(V_BETA) ? ['β' as const] : []), ...(connue(V_COHU) ? ['cohumulone' as const] : []), ...(connue(V_USAGE) ? ['rôle' as const] : [])],
        fiabilite: l.fiabilite,
      },
      familles: { communes, gagne: moves.filter((m) => m.a > m.de), perd: moves.filter((m) => m.a < m.de) },
      dose, stock: l.stock,
      conflitsStyle: [...l.conflitsStyle], memeVariete: sub.ref.varietyId === orig.ref.varietyId, amertumeDeconseillee: l.amertumeDeconseillee,
    };
    const r = { ...row, raison: reasonOf(row, orig, sub) } as Substitute;
    r.rank = i > 0 && cmp(rendus[i - 1], l) === 0 ? remplacants[i - 1].rank : i + 1;
    remplacants.push(r);
  });

  // Ce que la fiche de l'original ne dit pas, parmi les variables qui comptent (le radar, facultatif, et le géraniol, sans valeur au
  // catalogue, ne sont pas listés).
  const manque = [
    ...(!orig.aroma ? ['arôme : aucune famille citée dans les fiches'] : []),
    ...(!orig.mots ? ['mots : aucun descripteur dans les fiches'] : []),
    ...(!orig.pl[V_HUILE] ? ['huile totale : absente de la fiche'] : []),
    ...ECARTS.filter((e): e is [number, OilId] => e[1] !== null && !orig.pl[e[0]]).map((e) => `${OIL_NAMES[e[1]]} : absent de la fiche`),
    ...(!orig.pl[V_BETA] ? ['β : absent de la fiche'] : []),
    ...(!orig.pl[V_COHU] ? ['cohumulone : absente de la fiche'] : []),
  ];
  const k0 = orig.ref.alpha ? ibuPerGram(orig.ref.alpha.value, moment, recipe) : 0;
  return {
    key, name: orig.ref.name, methode: SUBSTITUTION_METHOD, contexte: context, poids: w, stockFirst, style: style?.code ?? null,
    reference: { moment, momentLabel: MOMENTS[moment].label, grams, ibu: k0 > 0 ? round(grams * k0, 2) : null },
    manque, candidats: lignes.length, remplacants, regle: RANKING,
  };
}
/** Tri des noms : Intl.Collator('fr') est la définition de localeCompare(…, 'fr') (ECMA-402), construit une fois. */
const NOMS = new Intl.Collator('fr');
