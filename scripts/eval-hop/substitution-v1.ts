// COPIE FIGÉE du moteur v1 de substitutes() (état du 26.10, avant la v2 de la voie e2), pour le banc moteur-v2.ts : A = ce fichier.
// Seuls changent les imports (chemins) et les noms des caches (« substitutionV1: ») ; ne pas modifier. Appeler dans le contexte d'un moteur : m.dans(() => substitutes(…)).
// Remplaçants d'un houblon, calculés depuis les fiches du dépôt (#119, 18.10.2026, soir).
// Le brasseur : « Et un système pour la substitution de houblons. » Beer Maverick publie des scores
// de substitution, mais ils n'ont pas été importés (fiche : substituts null) : rien n'en est repris ni
// imité. La ressemblance se calcule sur ce que les fiches savent vraiment : familles citées (N fiches
// sur M), composants de l'huile, alpha, bêta. Règle du prototype, à valider par le brasseur.
import { catalogue as catalogueDuMoteur, courant, local, hopRef, type HopRef } from '../../src/domain/hopIndex/v4/data';
import { Lru, borneHoublons } from '../../src/domain/hopIndex/v4/lru';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import { REFERENCE, describeFamilies } from '../../src/domain/hopIndex/v4/hops';
import { MOMENTS, ibuPerGram, type MomentId, type Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { hopRole, roleFromAlpha, type HopRoleValue } from '../../src/domain/hopIndex/v4/roles';
import type { StyleScale } from '../../src/domain/hopIndex/v4/style/scale';
import { temoinNegatif } from '../../src/domain/hopIndex/v4/temoin';

export const SUBSTITUTION_METHOD = {
  nom: 'substitution calculée v1',
  date: '2026-10-18',
  statut: 'règle du prototype, à valider par le brasseur',
  sources: 'fiches du dépôt : familles citées (Beer Maverick, Hopsteiner, faits cités), composants de l’huile (Beer Maverick ; linalol Hopsteiner), alpha et bêta (Beer Maverick)',
  nonRepris: 'scores de substitution de Beer Maverick : non importés dans le dépôt, ni repris ni imités',
} as const;

export type SubstitutionContext = 'défaut' | 'amertume' | 'arôme';
export interface SubstitutionWeights { arome: number; huiles: number; amertume: number }
/** Poids des trois composantes selon le contexte (décision du pilote, réversible). */
export const WEIGHTS: Record<SubstitutionContext, SubstitutionWeights> = {
  défaut: { arome: 0.5, huiles: 0.25, amertume: 0.25 },
  amertume: { arome: 0.2, huiles: 0.2, amertume: 0.6 },
  arôme: { arome: 0.6, huiles: 0.3, amertume: 0.1 },
};
/** Paliers de lecture du score [H], à valider : ils servent aussi à « en stock d'abord ». */
export const PALIERS = [{ min: 80, label: 'très proche' }, { min: 65, label: 'proche' }, { min: 50, label: 'partiel' }, { min: 0, label: 'éloigné' }] as const;
export type Palier = (typeof PALIERS)[number]['label'];

export const RANKING = [
  'Candidats : les variétés du catalogue (Beer Maverick, 318) et les articles du stock sous une autre forme (Citra cryo) ; le houblon lui-même exclu ; la même variété sous une autre forme reste, signalée.',
  'Arôme (0–100) : vecteur des 12 familles, valeur = niveau de fiche / 2 × N fiches qui la citent / M fiches lues (0 si non décrite) ; ressemblance cosinus. Avec un style, les familles attendues comptent double. Inconnu si l’un des deux houblons n’a aucune famille citée.',
  'Huiles (0–100) : myrcène, humulène, caryophyllène (Beer Maverick) et linalol (Hopsteiner), en % de l’huile. Par composant : écart entre les moitiés centrales des deux plages, rapporté à deux écarts-types des milieux du catalogue (1 − écart / 2σ, plancher 0). Moyenne des composants connus des deux ; inconnu sous deux composants communs. Farnésène non importé.',
  'Amertume (0–100) : α 50 %, β 25 %, rôle 25 %. α et β : milieux des plages variétales, 1 − |ln(rapport)| / ln 3 (un rapport de 3 ne ressemble plus). Rôle par la règle rôle-α v1 sur l’α variétal (même rôle 1, double face à un autre 0,5, amérisant face à aromatique 0) : le rôle déclaré par un fournisseur décrit une recette, pas la variété.',
  'Score = moyenne pondérée des composantes connues (poids renormalisés). Défaut : arôme 0,5, huiles 0,25, amertume 0,25. Moment d’amertume (premier moût, 60′, 30′, 15′) : 0,2 / 0,2 / 0,6. Moment d’arôme (10′ et après, whirlpool, à froid) : 0,6 / 0,3 / 0,1.',
  'Contexte amertume, en brasseur : l’arôme de l’original part à l’ébullition, l’arôme ne compte que par la part étrangère du remplaçant (1 − part de son vecteur sur des familles que l’original ne cite pas) ; un α plus haut vaut 1 (moins de matière pour le même IBU) ; amérisant et double tiennent le même rôle.',
  'Couverture : bonne (arôme, huiles, amertume), partielle (huiles inconnues), faible (arôme inconnu) ; un score faible n’est jamais présenté comme une ressemblance d’arôme.',
  'Classement lexicographique : 1) avec un style, conflit derrière (le remplaçant cite une famille indésirable du style que l’original ne cite pas) ; 2) couverture faible derrière ; 3) à un moment d’amertume, produit d’arôme ou houblon aromatique derrière (règle suivante) ; 4) si « en stock d’abord » : palier du score (très proche ≥ 80, proche ≥ 65, partiel ≥ 50, éloigné), puis en stock suffisant, en stock insuffisant, à acheter (épuisé compris) : le stock ne passe jamais devant un palier meilleur ; 5) score décroissant (entier) ; 6) nom. Égalité de toutes les clés : même rang.',
  'Amertume en brasseur (premier moût, 60′, 30′, 15′) : un brasseur n’amérise pas avec un produit d’arôme ni avec un houblon aromatique (usage et coût). Les produits cryo, lupuline ou poudre (lus dans le nom, les alias ou la forme de la fiche ou de l’article du stock) et les houblons de rôle aromatique (rôle du moteur : fournisseur, sinon règle rôle-α v1) passent après les amérisants et doubles usages, même à score égal ou supérieur ; raison écrite « produit d’arôme, cher pour amériser » ou « houblon aromatique, cher pour amériser ». Ne s’applique pas si l’original est lui-même aromatique ou un produit d’arôme (choix délibéré du brasseur). Le score ne change pas : seul l’ordre change.',
  'Dose : même IBU au même moment (BrewingMath.hopIbu, linéaire en α) : g du remplaçant = IBU de l’original ÷ IBU par gramme du remplaçant ; plage par l’α du remplaçant (lot, sinon plage variétale). À froid, ou sans IBU au moment choisi : à masse égale.',
  'Gains et pertes : familles dont le niveau de fiche (0 non décrit, 1 cité, 2 marqué) monte ou descend. C’est une citation dans les fiches, pas une intensité dans la bière.',
];

type Range = [number, number];
const OILS = ['myrcene', 'humulene', 'caryophyllene', 'linalool'] as const;
export type OilId = (typeof OILS)[number];
const OIL_NAMES: Record<OilId, string> = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', linalool: 'linalol' };
type Level = 0 | 1 | 2;

interface Features {
  key: string; ref: HopRef;
  levels: Record<FamilyId, Level>;
  /** Vecteur d'arôme (niveau / 2 × N/M) ; null si aucune famille citée. */
  aroma: Record<FamilyId, number> | null;
  oils: Record<OilId, Range | null>;
  alpha: Range | null; beta: Range | null; role: HopRoleValue | null;
  /** Vecteurs dans l'ordre de FAMILIES (calcul du classement sans objet intermédiaire). */
  levelsV: Level[]; aromaV: number[] | null;
  /** Raison de passer après les amérisants à un moment d'amertume (bitterDemotion, côté remplaçant) ; undefined : pas encore lue. */
  demotion?: string | null;
}
const mid = (r: Range) => (r[0] + r[1]) / 2;
const half = (r: Range) => (r[1] - r[0]) / 2;
const round = (x: number, n = 0) => Math.round(x * 10 ** n) / 10 ** n;
const fr = (x: number, n = 1) => String(round(x, n)).replace('.', ',');

/** Traits d'un houblon : un cache borné par moteur (deux fois les houblons connus : un classement n'y recalcule rien). */
const featureCache = () => local('substitutionV1:traits', () => new Lru<Features>(borneHoublons(courant().catalogue.length + courant().stock.length)));
function features(key: string): Features {
  const cache = featureCache();
  const hit = cache.get(key);
  if (hit) return hit;
  const ref = hopRef(key);
  if (!ref) throw Error(`Houblon inconnu : ${key}`);
  const c = ref.catalogue, desc = describeFamilies(ref.varietyId);
  // Une passe sur les familles (mêmes valeurs que les Object.fromEntries d'avant ; ordre des clés : FAMILIES).
  const levels = {} as Record<FamilyId, Level>, levelsV: Level[] = [];
  let cited = false, marked = false;
  for (const f of FAMILIES) {
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
  const out: Features = {
    key, ref, levels, aroma,
    oils: { myrcene: c.oils.myrcene, humulene: c.oils.humulene, caryophyllene: c.oils.caryophyllene, linalool: c.hsLinalool?.range ?? null },
    alpha: c.alpha, beta: c.beta, role: c.alpha ? roleFromAlpha(mid(c.alpha), marked) : null,
    levelsV, aromaV,
  };
  cache.set(key, out);
  return out;
}

/** Écart-type des milieux de plage du catalogue, par composant de l'huile (échelle de comparaison). */
const oilSigma = (): Record<OilId, number> => local('substitutionV1:sigma', sigmaDuCatalogue);
function sigmaDuCatalogue(): Record<OilId, number> {
  const sd = (xs: number[]) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length); };
  const ranges: Record<OilId, (Range | null)[]> = {
    myrcene: catalogueDuMoteur().map((c) => c.oils.myrcene), humulene: catalogueDuMoteur().map((c) => c.oils.humulene),
    caryophyllene: catalogueDuMoteur().map((c) => c.oils.caryophyllene), linalool: catalogueDuMoteur().map((c) => c.hsLinalool?.range ?? null),
  };
  return Object.fromEntries(OILS.map((o) => [o, sd(ranges[o].filter((r): r is Range => !!r).map(mid))])) as Record<OilId, number>;
}
/** Écart-types utilisés, pour les lire dans le pack. */
export const oilScales = () => Object.fromEntries(OILS.map((o) => [o, round(oilSigma()[o], 2)])) as Record<OilId, number>;

function aromaSim(a: Features, b: Features, context: SubstitutionContext, style?: StyleScale): number | null {
  if (!a.aroma || !b.aroma) return null;
  const w = (f: FamilyId) => (style?.documented && style.families[f].status === 'attendue' ? 2 : 1);
  if (context === 'amertume') {
    // À l'amertume, l'arôme de l'original part à l'ébullition : seule compte la part étrangère du remplaçant.
    let foreign = 0, total = 0;
    for (const f of FAMILIES) { total += w(f) * b.aroma[f]; if (a.levels[f] === 0) foreign += w(f) * b.aroma[f]; }
    return total ? 1 - foreign / total : null;
  }
  let dot = 0, na = 0, nb = 0;
  for (const f of FAMILIES) { dot += w(f) * a.aroma[f] * b.aroma[f]; na += w(f) * a.aroma[f] ** 2; nb += w(f) * b.aroma[f] ** 2; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
function oilSim(a: Features, b: Features): { value: number | null; compared: OilId[] } {
  const sigma = oilSigma();
  const compared = OILS.filter((o) => a.oils[o] && b.oils[o]);
  if (compared.length < 2) return { value: null, compared };
  const sims = compared.map((o) => {
    const x = a.oils[o]!, y = b.oils[o]!;
    const gap = Math.max(0, Math.abs(mid(x) - mid(y)) - (half(x) + half(y)) / 2);
    return Math.max(0, 1 - gap / (2 * sigma[o]));
  });
  return { value: sims.reduce((s, x) => s + x, 0) / sims.length, compared };
}
const ratioSim = (x: number, y: number) => Math.max(0, 1 - Math.abs(Math.log(x / y)) / Math.log(3));
const roleSim = (x: HopRoleValue, y: HopRoleValue) => (x === y ? 1 : x === 'double' || y === 'double' ? 0.5 : 0);
/** oilSim, valeur seule et sans tableau intermédiaire (classement de tous les candidats) : même arithmétique, même ordre. */
/** aromaSim sur les vecteurs (poids W par famille, ordre de FAMILIES) : même arithmétique, même ordre de somme. */
function aromaValue(a: Features, b: Features, context: SubstitutionContext, W: number[]): number | null {
  const A = a.aromaV, B = b.aromaV;
  if (!A || !B) return null;
  if (context === 'amertume') {
    let foreign = 0, total = 0;
    for (let i = 0; i < W.length; i++) { total += W[i] * B[i]; if (a.levelsV[i] === 0) foreign += W[i] * B[i]; }
    return total ? 1 - foreign / total : null;
  }
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < W.length; i++) { dot += W[i] * A[i] * B[i]; na += W[i] * A[i] ** 2; nb += W[i] * B[i] ** 2; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
function oilValue(a: Features, b: Features): number | null {
  const sigma = oilSigma();
  let n = 0, sum = 0;
  for (const o of OILS) {
    const x = a.oils[o], y = b.oils[o];
    if (!x || !y) continue;
    n++;
    const gap = Math.max(0, Math.abs(mid(x) - mid(y)) - (half(x) + half(y)) / 2);
    sum += Math.max(0, 1 - gap / (2 * sigma[o]));
  }
  return n < 2 ? null : sum / n;
}
type BitterPart = 'α' | 'β' | 'rôle';
function bitterSim(a: Features, b: Features, context: SubstitutionContext): { value: number | null; compared: BitterPart[] } {
  const parts: { id: BitterPart; w: number; s: number }[] = [];
  const bitter = context === 'amertume';
  // À l'amertume, un α plus haut n'est pas un défaut (moins de matière pour le même IBU) ; amérisant et double y tiennent le même rôle.
  if (a.alpha && b.alpha && mid(a.alpha) > 0 && mid(b.alpha) > 0) parts.push({ id: 'α', w: 0.5, s: bitter && mid(b.alpha) >= mid(a.alpha) ? 1 : ratioSim(mid(a.alpha), mid(b.alpha)) });
  if (a.beta && b.beta && mid(a.beta) > 0 && mid(b.beta) > 0) parts.push({ id: 'β', w: 0.25, s: ratioSim(mid(a.beta), mid(b.beta)) });
  if (a.role && b.role) parts.push({ id: 'rôle', w: 0.25, s: bitter && a.role !== 'aromatique' && b.role !== 'aromatique' ? 1 : roleSim(a.role, b.role) });
  if (!parts.some((p) => p.id === 'α')) return { value: null, compared: parts.map((p) => p.id) };
  const tw = parts.reduce((s, p) => s + p.w, 0);
  return { value: parts.reduce((s, p) => s + p.w * p.s, 0) / tw, compared: parts.map((p) => p.id) };
}

/** bitterSim, valeur seule et sans tableau intermédiaire : mêmes parts (α 0,5, β 0,25, rôle 0,25), même ordre de somme. */
function bitterValue(a: Features, b: Features, context: SubstitutionContext): number | null {
  const bitter = context === 'amertume';
  let tw = 0, num = 0;
  if (!(a.alpha && b.alpha && mid(a.alpha) > 0 && mid(b.alpha) > 0)) return null;
  const sa = bitter && mid(b.alpha) >= mid(a.alpha) ? 1 : ratioSim(mid(a.alpha), mid(b.alpha));
  tw += 0.5; num += 0.5 * sa;
  if (a.beta && b.beta && mid(a.beta) > 0 && mid(b.beta) > 0) { tw += 0.25; num += 0.25 * ratioSim(mid(a.beta), mid(b.beta)); }
  if (a.role && b.role) { tw += 0.25; num += 0.25 * (bitter && a.role !== 'aromatique' && b.role !== 'aromatique' ? 1 : roleSim(a.role, b.role)); }
  return num / tw;
}
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
  composantes: { arome: number | null; huiles: number | null; amertume: number | null };
  couverture: { arome: boolean; huiles: OilId[]; amertume: BitterPart[]; fiabilite: 'bonne' | 'partielle' | 'faible' };
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
  /** Poids imposés (témoin négatif, essais) ; prioritaires sur le contexte. */
  weights?: SubstitutionWeights;
  /** Candidats imposés (clés) ; défaut : catalogue et articles du stock. */
  pool?: string[];
}
export interface SubstitutionResult {
  key: string; name: string; methode: typeof SUBSTITUTION_METHOD;
  contexte: SubstitutionContext; poids: SubstitutionWeights; stockFirst: boolean; style: string | null;
  reference: { moment: MomentId; momentLabel: string; grams: number; ibu: number | null };
  /** Ce que la fiche de l'original ne dit pas (composantes privées de comparaison). */
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
const roleCache = () => local('substitutionV1:roles', () => new Lru<ReturnType<typeof hopRole>>(borneHoublons(courant().catalogue.length + courant().stock.length)));
const engineRole = (key: string) => roleCache().obtenir(key, () => hopRole(key));
/** Produit d'arôme d'un houblon, une fois par moteur (lu à chaque classement d'amertume, pour chaque candidat). */
const produitCache = () => local('substitutionV1:produits', () => new Lru<string | null>(borneHoublons(courant().catalogue.length + courant().stock.length)));
const produitDe = (ref: HopRef) => produitCache().obtenir(ref.key, () => aromaProduct(ref));
/** Raison de passer après les amérisants et doubles usages à un moment d'amertume, ou null. */
/** L'original échappe-t-il à la règle (contexte d'arôme, ou lui-même produit d'arôme ou aromatique) ? */
const demotionExclue = (orig: HopRef, context: SubstitutionContext) => context !== 'amertume' || !!produitDe(orig) || engineRole(orig.key).value === 'aromatique';
function bitterDemotion(orig: HopRef, sub: HopRef, context: SubstitutionContext, exclue = demotionExclue(orig, context)): string | null {
  return exclue ? null : demotionDe(sub);
}
function demotionDe(sub: HopRef): string | null {
  const product = produitDe(sub);
  if (product) return `produit d’arôme (${product}), cher pour amériser`;
  const role = engineRole(sub.key);
  return role.value === 'aromatique' ? `houblon aromatique (${role.source}), cher pour amériser` : null;
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
  if (orig.alpha && sub.alpha && orig.ref.alpha && sub.ref.alpha) parts.push(`α ${alphaDose(sub.ref)} contre ${alphaDose(orig.ref)}`);
  if (s.conflitsStyle.length) parts.push(`indésirable au style : ${names(s.conflitsStyle)}`);
  if (s.amertumeDeconseillee) parts.push(s.amertumeDeconseillee);
  const text = parts.join(' ; ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

/** Remplaçants classés d'un houblon (clé du prototype : id de variété, « :cryo » pour l'article Cryo).
 * Deux temps (#164) : 1) chaque candidat reçoit son score et ses clés de classement (composantes, couverture, conflit,
 * amertume déconseillée, stock) ; 2) seuls les rendus (`limit`) reçoivent familles, dose, raison. Même classement et
 * mêmes rendus qu'en un seul temps : la dose n'entre dans le classement que par « stock suffisant », calculée alors
 * pour les candidats en stock. */
export function substitutes(key: string, options: SubstitutionOptions = {}): SubstitutionResult {
  const orig = features(key);
  const moment = options.moment ?? 'b60', grams = options.grams ?? 1, recipe = options.recipe ?? defaultRecipe();
  const context: SubstitutionContext = options.context ?? (options.moment ? (MOMENTS[options.moment].kind === 'amertume' ? 'amertume' : 'arôme') : 'défaut');
  // Témoin négatif : V4_TEMOIN_NEGATIF=substitution met tous les poids à zéro (scores nuls, ordre alphabétique).
  const w = temoinNegatif() === 'substitution' ? ZERO : options.weights ?? WEIGHTS[context];
  const style = options.style?.documented ? options.style : undefined;
  const pool = options.pool ?? [...catalogueDuMoteur().map((c) => c.id), ...courant().stockHorsCatalogue];
  const usedBy = new Map<string, number>();
  for (const a of recipe.additions ?? []) usedBy.set(a.hopKey, (usedBy.get(a.hopKey) ?? 0) + a.grams);
  const used = (k: string) => usedBy.get(k) ?? 0;
  const stockFirst = !!options.stockFirst;

  // 1) Score et clés de classement de chaque candidat.
  interface Ligne {
    k: string; sub: Features; name: string; score: number; palier: Palier;
    a: number | null; o: number | null; b: number | null; fiabilite: Substitute['couverture']['fiabilite'];
    stock: Substitute['stock']; dose: SubstituteDose | null; conflitsStyle: FamilyId[]; amertumeDeconseillee: string | null; cles: number[];
    /** Les clés en un nombre (ordre lexicographique : chaque clé est bornée), quand le score est un entier de 0 à 100. */
    rang: number;
  }
  const lignes: Ligne[] = [];
  const exclue = demotionExclue(orig.ref, context);
  const W = FAMILIES.map((f) => (style?.documented && style.families[f].status === 'attendue' ? 2 : 1));
  // Familles indésirables au style que l'original ne cite pas : un conflit si le candidat en cite une (ordre de FAMILIES).
  const indesirables = style ? FAMILIES.filter((f) => style.families[f].status === 'indésirable' && orig.levels[f] === 0) : [];
  for (const k of pool) {
    if (k === key) continue;
    const sub = features(k);
    const a = aromaValue(orig, sub, context, W), o = oilValue(orig, sub), b = bitterValue(orig, sub, context);
    let tw = 0, num = 0;
    if (a !== null) { tw += w.arome; num += w.arome * a; }
    if (o !== null) { tw += w.huiles; num += w.huiles * o; }
    if (b !== null) { tw += w.amertume; num += w.amertume * b; }
    const score = tw > 0 ? round((100 * num) / tw) : 0;
    const fiabilite = a === null ? 'faible' : o === null ? 'partielle' : 'bonne';
    const st = sub.ref.stock, libre = st ? round(st.grams - used(k), 1) : null;
    const etat = !st ? 'à acheter' : libre! > 0 ? 'en stock' : 'épuisé';
    const dose = etat === 'en stock' ? doseOf(orig.ref, sub.ref, moment, grams, recipe) : null;
    const stock: Substitute['stock'] = { etat, libre, suffisant: etat === 'en stock' ? libre! >= dose!.grams : null };
    const conflitsStyle = indesirables.length ? indesirables.filter((f) => sub.levels[f] > 0) : indesirables;
    const amertumeDeconseillee = exclue ? null : sub.demotion !== undefined ? sub.demotion : (sub.demotion = demotionDe(sub.ref));
    const palier = palierOf(score);
    const c0 = conflitsStyle.length ? 1 : 0, c1 = fiabilite === 'faible' ? 1 : 0, c2 = amertumeDeconseillee ? 1 : 0;
    const cles = stockFirst ? [c0, c1, c2, PALIER_RANK[palier], stockRank(stock), -score] : [c0, c1, c2, -score];
    const rang = ((((c0 * 2 + c1) * 2 + c2) * 4 + (stockFirst ? PALIER_RANK[palier] : 0)) * 3 + (stockFirst ? stockRank(stock) : 0)) * 101 + (100 - score);
    lignes.push({ k, sub, name: sub.ref.name, score, palier, a, o, b, fiabilite, stock, dose, conflitsStyle, amertumeDeconseillee, cles, rang });
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
  tries.sort((x, y) => cmp(x, y) || NOMS.compare(x.name, y.name));

  // 2) Les rendus seulement : familles, dose, raison.
  const rendus = tries.slice(0, limite);
  const remplacants: Substitute[] = [];
  rendus.forEach((l, i) => {
    const { sub, a } = l;
    const o = oilSim(orig, sub), b = bitterSim(orig, sub, context);
    const communes = FAMILIES.filter((f) => orig.levels[f] > 0 && sub.levels[f] > 0).sort((x, y) => Math.min(sub.levels[y], orig.levels[y]) - Math.min(sub.levels[x], orig.levels[x]));
    const moves = FAMILIES.filter((f) => orig.levels[f] !== sub.levels[f]).map((f) => ({ family: f, de: orig.levels[f], a: sub.levels[f] }));
    const dose = l.dose ?? doseOf(orig.ref, sub.ref, moment, grams, recipe);
    const row: Omit<Substitute, 'rank' | 'raison'> = {
      key: l.k, name: l.name, score: l.score, palier: l.palier,
      composantes: { arome: a === null ? null : round(100 * a), huiles: o.value === null ? null : round(100 * o.value), amertume: b.value === null ? null : round(100 * b.value) },
      couverture: { arome: a !== null, huiles: o.compared, amertume: b.compared, fiabilite: l.fiabilite },
      familles: { communes, gagne: moves.filter((m) => m.a > m.de), perd: moves.filter((m) => m.a < m.de) },
      dose, stock: l.stock,
      conflitsStyle: [...l.conflitsStyle], memeVariete: sub.ref.varietyId === orig.ref.varietyId, amertumeDeconseillee: l.amertumeDeconseillee,
    };
    const r = { ...row, raison: reasonOf(row, orig, sub) } as Substitute;
    r.rank = i > 0 && cmp(rendus[i - 1], l) === 0 ? remplacants[i - 1].rank : i + 1;
    remplacants.push(r);
  });

  const manque = [
    ...(!orig.aroma ? ['arôme : aucune famille citée dans les fiches'] : []),
    ...OILS.filter((x) => !orig.oils[x]).map((x) => `${OIL_NAMES[x]} : absent de la fiche`),
    ...(!orig.beta ? ['β : absent de la fiche'] : []),
    'farnésène : publié par Beer Maverick, non importé',
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
