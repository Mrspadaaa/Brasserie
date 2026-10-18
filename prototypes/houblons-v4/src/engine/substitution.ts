// Remplaçants d'un houblon, calculés depuis les fiches du dépôt (#119, 18.10.2026, soir).
// Le brasseur : « Et un système pour la substitution de houblons. » Beer Maverick publie des scores
// de substitution, mais ils n'ont pas été importés (fiche : substituts null) : rien n'en est repris ni
// imité. La ressemblance se calcule sur ce que les fiches savent vraiment : familles citées (N fiches
// sur M), composants de l'huile, alpha, bêta. Règle du prototype, à valider par le brasseur.
import { CATALOGUE, STOCK, hopRef, type HopRef } from './data';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { REFERENCE, describeFamilies } from './hops';
import { MOMENTS, ibuPerGram, type MomentId, type Recipe } from './recipe';
import { hopRole, roleFromAlpha, type HopRoleValue } from './roles';
import type { StyleScale } from '../style/scale';

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
}
const mid = (r: Range) => (r[0] + r[1]) / 2;
const half = (r: Range) => (r[1] - r[0]) / 2;
const round = (x: number, n = 0) => Math.round(x * 10 ** n) / 10 ** n;
const fr = (x: number, n = 1) => String(round(x, n)).replace('.', ',');

const featureCache = new Map<string, Features>();
function features(key: string): Features {
  const hit = featureCache.get(key);
  if (hit) return hit;
  const ref = hopRef(key);
  if (!ref) throw Error(`Houblon inconnu : ${key}`);
  const c = ref.catalogue, desc = describeFamilies(ref.varietyId);
  const levels = Object.fromEntries(FAMILIES.map((f) => [f, desc[f].level === 'marqué' ? 2 : desc[f].level === 'cité' ? 1 : 0])) as Record<FamilyId, Level>;
  const cited = FAMILIES.some((f) => levels[f] > 0);
  const aroma = cited ? Object.fromEntries(FAMILIES.map((f) => [f, desc[f].of ? (levels[f] / 2) * (desc[f].sources / desc[f].of) : 0])) as Record<FamilyId, number> : null;
  const marked = FAMILIES.some((f) => levels[f] === 2);
  const out: Features = {
    key, ref, levels, aroma,
    oils: { myrcene: c.oils.myrcene, humulene: c.oils.humulene, caryophyllene: c.oils.caryophyllene, linalool: c.hsLinalool?.range ?? null },
    alpha: c.alpha, beta: c.beta, role: c.alpha ? roleFromAlpha(mid(c.alpha), marked) : null,
  };
  featureCache.set(key, out);
  return out;
}

/** Écart-type des milieux de plage du catalogue, par composant de l'huile (échelle de comparaison). */
let sigmaCache: Record<OilId, number> | null = null;
function oilSigma(): Record<OilId, number> {
  if (sigmaCache) return sigmaCache;
  const sd = (xs: number[]) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length); };
  const ranges: Record<OilId, (Range | null)[]> = {
    myrcene: CATALOGUE.map((c) => c.oils.myrcene), humulene: CATALOGUE.map((c) => c.oils.humulene),
    caryophyllene: CATALOGUE.map((c) => c.oils.caryophyllene), linalool: CATALOGUE.map((c) => c.hsLinalool?.range ?? null),
  };
  sigmaCache = Object.fromEntries(OILS.map((o) => [o, sd(ranges[o].filter((r): r is Range => !!r).map(mid))])) as Record<OilId, number>;
  return sigmaCache;
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
const roleCache = new Map<string, ReturnType<typeof hopRole>>();
const engineRole = (key: string) => { if (!roleCache.has(key)) roleCache.set(key, hopRole(key)); return roleCache.get(key)!; };
/** Raison de passer après les amérisants et doubles usages à un moment d'amertume, ou null. */
function bitterDemotion(orig: HopRef, sub: HopRef, context: SubstitutionContext): string | null {
  if (context !== 'amertume' || aromaProduct(orig) || engineRole(orig.key).value === 'aromatique') return null;
  const product = aromaProduct(sub);
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

/** Remplaçants classés d'un houblon (clé du prototype : id de variété, « :cryo » pour l'article Cryo). */
export function substitutes(key: string, options: SubstitutionOptions = {}): SubstitutionResult {
  const orig = features(key);
  const moment = options.moment ?? 'b60', grams = options.grams ?? 1, recipe = options.recipe ?? defaultRecipe();
  const context: SubstitutionContext = options.context ?? (options.moment ? (MOMENTS[options.moment].kind === 'amertume' ? 'amertume' : 'arôme') : 'défaut');
  // Témoin négatif : V4_TEMOIN_NEGATIF=substitution met tous les poids à zéro (scores nuls, ordre alphabétique).
  const w = process.env.V4_TEMOIN_NEGATIF === 'substitution' ? ZERO : options.weights ?? WEIGHTS[context];
  const style = options.style?.documented ? options.style : undefined;
  const pool = options.pool ?? [...CATALOGUE.map((c) => c.id), ...STOCK.map((s) => s.key).filter((k) => !CATALOGUE.some((c) => c.id === k))];
  const used = (k: string) => (recipe.additions ?? []).filter((a) => a.hopKey === k).reduce((t, a) => t + a.grams, 0);

  const rows = pool.filter((k) => k !== key).map((k): Omit<Substitute, 'rank'> => {
    const sub = features(k);
    const a = aromaSim(orig, sub, context, style), o = oilSim(orig, sub), b = bitterSim(orig, sub, context);
    const comps = [{ s: a, w: w.arome }, { s: o.value, w: w.huiles }, { s: b.value, w: w.amertume }].filter((c) => c.s !== null);
    const tw = comps.reduce((t, c) => t + c.w, 0);
    const score = tw > 0 ? round((100 * comps.reduce((t, c) => t + c.w * c.s!, 0)) / tw) : 0;
    const fiabilite = a === null ? 'faible' : o.value === null ? 'partielle' : 'bonne';
    const communes = FAMILIES.filter((f) => orig.levels[f] > 0 && sub.levels[f] > 0).sort((x, y) => Math.min(sub.levels[y], orig.levels[y]) - Math.min(sub.levels[x], orig.levels[x]));
    const moves = FAMILIES.filter((f) => orig.levels[f] !== sub.levels[f]).map((f) => ({ family: f, de: orig.levels[f], a: sub.levels[f] }));
    const dose = doseOf(orig.ref, sub.ref, moment, grams, recipe);
    const st = sub.ref.stock, libre = st ? round(st.grams - used(k), 1) : null;
    const etat = !st ? 'à acheter' : libre! > 0 ? 'en stock' : 'épuisé';
    const conflitsStyle = style ? FAMILIES.filter((f) => style.families[f].status === 'indésirable' && sub.levels[f] > 0 && orig.levels[f] === 0) : [];
    const row: Omit<Substitute, 'rank' | 'raison'> = {
      key: k, name: sub.ref.name, score, palier: palierOf(score),
      composantes: { arome: a === null ? null : round(100 * a), huiles: o.value === null ? null : round(100 * o.value), amertume: b.value === null ? null : round(100 * b.value) },
      couverture: { arome: a !== null, huiles: o.compared, amertume: b.compared, fiabilite },
      familles: { communes, gagne: moves.filter((m) => m.a > m.de), perd: moves.filter((m) => m.a < m.de) },
      dose, stock: { etat, libre, suffisant: etat === 'en stock' ? libre! >= dose.grams : null },
      conflitsStyle, memeVariete: sub.ref.varietyId === orig.ref.varietyId, amertumeDeconseillee: bitterDemotion(orig.ref, sub.ref, context),
    };
    return { ...row, raison: reasonOf(row, orig, sub) };
  });
  const stockFirst = !!options.stockFirst;
  const keys = (r: Omit<Substitute, 'rank'>) => [r.conflitsStyle.length ? 1 : 0, r.couverture.fiabilite === 'faible' ? 1 : 0, r.amertumeDeconseillee ? 1 : 0,
    ...(stockFirst ? [PALIER_RANK[r.palier], stockRank(r.stock)] : []), -r.score];
  const cmp = (x: Omit<Substitute, 'rank'>, y: Omit<Substitute, 'rank'>) => { const kx = keys(x), ky = keys(y); for (let i = 0; i < kx.length; i++) if (kx[i] !== ky[i]) return kx[i] - ky[i]; return 0; };
  const sorted = rows.sort((x, y) => cmp(x, y) || x.name.localeCompare(y.name, 'fr')) as Substitute[];
  sorted.forEach((r, i) => { r.rank = i > 0 && cmp(sorted[i - 1], r) === 0 ? sorted[i - 1].rank : i + 1; });

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
    manque, candidats: rows.length, remplacants: sorted.slice(0, options.limit ?? sorted.length), regle: RANKING,
  };
}
