import { BrewingMath } from '../../../../src/services/brewingMath';
import { predictHopRecipe, type HopRecipeInput } from '../../../../functions/src/hopRecipePrediction';
import { createHopPredictor } from '../../../../functions/src/hopPredictionCore';
import type { HopEstimate, HopPrediction, HopTiming, HopTriplet } from '../../../../functions/src/hopPredictionSchema';
import { ENGINE_DATA, EXTRAPOLATION, POLICY, YEASTS, hopRef, type HopRef } from './data';
import { FAMILIES, type FamilyId } from './families';

// ---------- Moments ----------
export type MomentId = 'fwh' | 'b60' | 'b30' | 'b15' | 'b10' | 'b5' | 'b0' | 'wp' | 'dryActive' | 'dryPost';
export interface Moment { id: MomentId; label: string; kind: 'amertume' | 'arôme'; timing: HopTiming; minutes?: number; estimated?: string }
export const MOMENTS: Record<MomentId, Moment> = {
  fwh: { id: 'fwh', label: 'premier moût', kind: 'amertume', timing: 'firstWort' },
  b60: { id: 'b60', label: '60′', kind: 'amertume', timing: 'boil', minutes: 60 },
  b30: { id: 'b30', label: '30′', kind: 'amertume', timing: 'boil', minutes: 30 },
  b15: { id: 'b15', label: '15′', kind: 'amertume', timing: 'boil', minutes: 15 },
  b10: { id: 'b10', label: '10′', kind: 'arôme', timing: 'boil', minutes: 10 },
  b5: { id: 'b5', label: '5′', kind: 'arôme', timing: 'boil', minutes: 5 },
  b0: { id: 'b0', label: '0′ (fin d’ébullition)', kind: 'arôme', timing: 'boil', minutes: 0 },
  wp: { id: 'wp', label: 'whirlpool', kind: 'arôme', timing: 'whirlpool' },
  dryActive: { id: 'dryActive', label: 'dry hop en fermentation active', kind: 'arôme', timing: 'fermentation',
    estimated: 'Dry hop en fermentation active : biotransformation possible, non quantifiée par le moteur.' },
  dryPost: { id: 'dryPost', label: 'dry hop après fermentation', kind: 'arôme', timing: 'postFermentation' },
};
/** Doses de recherche du solveur V5.5 (g/L), par moment, « à adapter ». */
export const searchDoses = (m: MomentId) => POLICY.defaults[MOMENTS[m].timing].searchDosesGL.map((p) => p.central);

// ---------- Recette ----------
export interface Addition {
  id: string; hopKey: string; moment: MomentId; grams: number;
  /** Jour d'un houblonnage à cru (J+n de fermentation) : noté, non utilisé par le modèle V5.5 du prototype. */
  day?: number;
}
export interface Recipe {
  name: string; styleCode: string; volumeL: number; og: number; boilMin: number; yeastId: string | null;
  /** Contexte de la bière (R41), facultatif : couleur, densité finale, alcool, acidité. */
  ebc?: number; fg?: number; abv?: number; ph?: number;
  additions: Addition[];
}

export function tripletOf(a: Addition, recipe: Recipe, ref = hopRef(a.hopKey), doseGL = a.grams / recipe.volumeL): HopTriplet {
  const m = MOMENTS[a.moment];
  const d = POLICY.defaults[m.timing];
  const contactHours = m.timing === 'boil' ? m.minutes! / 60 : m.timing === 'firstWort' ? recipe.boilMin / 60 : d.contactHours.central;
  const temperatureC = m.timing === 'boil' || m.timing === 'firstWort' ? 100 : d.temperatureC.central;
  return { varietyId: ref?.varietyId ?? null, lotId: ref?.lotId ?? null, yeastId: recipe.yeastId, timing: m.timing, doseGL, temperatureC, contactHours, matrixId: null };
}

// ---------- Amertume (BrewingMath.hopIbu, importé de l'app) ----------
const IBU_STAGE = { fwh: 'firstWort', b60: 'boil', b30: 'boil', b15: 'boil', b10: 'boil', b5: 'boil', b0: 'boil', wp: 'whirlpool', dryActive: 'dryHop', dryPost: 'dryHop' } as const;
/** IBU d'un gramme de ce houblon à ce moment, pour un alpha donné (linéaire en masse). */
export function ibuPerGram(alpha: number, moment: MomentId, recipe: Recipe): number {
  const m = MOMENTS[moment];
  return BrewingMath.hopIbu({ weightG: 1, alpha, stage: IBU_STAGE[moment], timeMin: m.minutes ?? (moment === 'wp' ? 20 : undefined), tempC: moment === 'wp' ? 80 : undefined } as never, recipe.volumeL, recipe.og, recipe.boilMin);
}
/** IBU d'un gramme pour un stade, une durée et une température libres (BrewingMath.hopIbu). */
export function ibuPerGramAt(alpha: number, stage: 'firstWort' | 'boil' | 'whirlpool', timeMin: number | undefined, tempC: number | undefined, recipe: Recipe, boilMin = recipe.boilMin): number {
  return BrewingMath.hopIbu({ weightG: 1, alpha, stage, timeMin, tempC } as never, recipe.volumeL, recipe.og, boilMin);
}
export interface Ibu { value: number; min: number; max: number; unknown: string[] }
export function additionIbu(a: Addition, recipe: Recipe): Ibu {
  const ref = hopRef(a.hopKey);
  if (!ref?.alpha) return { value: 0, min: 0, max: 0, unknown: IBU_STAGE[a.moment] === 'dryHop' ? [] : [a.id] };
  const k = (alpha: number) => a.grams * ibuPerGram(alpha, a.moment, recipe);
  return { value: k(ref.alpha.value), min: k(ref.alpha.min), max: k(ref.alpha.max), unknown: [] };
}
export function recipeIbu(recipe: Recipe): Ibu {
  return recipe.additions.map((a) => additionIbu(a, recipe)).reduce((s, x) => ({ value: s.value + x.value, min: s.min + x.min, max: s.max + x.max, unknown: [...s.unknown, ...x.unknown] }), { value: 0, min: 0, max: 0, unknown: [] as string[] });
}
/** Dose (g) pour un IBU visé, ou null si l'alpha est inconnu ou le moment sans IBU (dry hop). */
export function gramsForIbu(ibu: number, ref: HopRef, moment: MomentId, recipe: Recipe): number | null {
  if (!ref.alpha) return null;
  const k = ibuPerGram(ref.alpha.value, moment, recipe);
  return k > 0 ? ibu / k : null;
}

// ---------- Profil par famille ----------
export interface FamilyEstimate {
  family: FamilyId;
  /** « inconnu » : aucune plage ; jamais un zéro. */
  status: 'estimé' | 'inconnu';
  range: { min: number; max: number } | null;
  /** Repère central V5.5 : scénario aux valeurs centrales des paramètres, ni moyenne ni espérance. */
  central?: number;
  confidence: 'low' | 'medium' | 'high';
  /** Plage 0–100 entière : le modèle ne discrimine pas cette intensité. */
  completeDomain: boolean;
  /** Le modèle situe cette famille : ni plage pleine, ni plage partant de 0 sans repère central.
   * Sinon la vue écrit « non situé » et n'affiche pas la plage. */
  situated: boolean;
  extrapolated: boolean;
}
export type Profile = Record<FamilyId, FamilyEstimate>;
const round1 = (x: number) => Math.round(x * 10) / 10;
export function toEstimate(family: FamilyId, e: HopEstimate | undefined, extrapolated: boolean): FamilyEstimate {
  if (!e?.range) return { family, status: 'inconnu', range: null, confidence: 'low', completeDomain: false, situated: false, extrapolated };
  const range = { min: round1(e.range.min), max: round1(e.range.max) };
  const completeDomain = range.min <= 0.5 && range.max >= 99.5;
  return { family, status: 'estimé', range, ...(e.central !== undefined ? { central: round1(e.central) } : {}), confidence: e.confidence,
    completeDomain, situated: !completeDomain && (e.central !== undefined || range.min > 0.5), extrapolated };
}
export const profileOf = (p: Pick<HopPrediction, 'profile' | 'extrapolatedAxes'>): Profile =>
  Object.fromEntries(FAMILIES.map((f) => [f, toEstimate(f, p.profile[f], !!p.extrapolatedAxes?.includes(f))])) as Profile;

// ---------- Levure (R43, R44) ----------
export interface YeastInfo { id: string | null; name: string | null; status: 'caractérisée' | 'inconnue' | 'absente'; note: string }
export function yeastInfo(yeastId: string | null): YeastInfo {
  const y = YEASTS.find((k) => k.id === yeastId);
  if (!y) return { id: yeastId, name: null, status: 'absente', note: 'Levure non référencée : aucune prédiction aromatique, chaque famille reste « inconnu ».' };
  if (EXTRAPOLATION.yeasts.some((s) => s.yeastId === y.id)) return { id: y.id, name: y.name, status: 'caractérisée', note: 'Arôme propre et expression du houblon tirés du profil de cette souche dans le modèle V5.5 (bornes de conception, non ajustées sur dégustation).' };
  return { id: y.id, name: y.name, status: 'inconnue', note: 'Souche sans profil dans le modèle V5.5 : enveloppe de levure inconnue (arôme propre et expression larges), jamais neutre.' };
}

// ---------- Matrice et masquage (R41) ----------
export interface MatrixContext {
  factor: { range: { min: number; max: number }; central: number; source: string };
  contextApplied: false;
  context: { label: string; value: string | null }[];
  unknowns: string[];
}
/** Le facteur de matrice V5.5 est une seule plage commune, sans lien au torréfié, à la douceur,
 * à l'alcool ou à l'acidité. Aucun coefficient n'est inventé : le contexte est rendu comme inconnue. */
export function matrixContext(recipe: Recipe): MatrixContext {
  const m = EXTRAPOLATION.matrix;
  const val = (x: number | undefined, u: string, n = 0) => (x === undefined ? null : `${x.toLocaleString('fr-CH', { maximumFractionDigits: n })} ${u}`.trim());
  return {
    factor: { range: m.range, central: m.central, source: `${m.source.author}, ${m.source.reference} : ${m.source.locator.split(' Hypothèse')[0]}` },
    contextApplied: false,
    context: [
      { label: 'Couleur (torréfié)', value: val(recipe.ebc, 'EBC') },
      { label: 'Densité initiale', value: val(recipe.og, '', 3) },
      { label: 'Densité finale (douceur)', value: val(recipe.fg, '', 3) },
      { label: 'Alcool', value: val(recipe.abv, '% vol', 1) },
      { label: 'Acidité', value: val(recipe.ph, 'pH', 1) },
    ],
    unknowns: [
      'Masquage par le torréfié : non quantifié ; le moteur applique la même plage de matrice à toutes les bières.',
      'Douceur résiduelle et alcool : effet sur la perception des familles non étalonné.',
      'Acidité : effet non étalonné.',
      'Interactions du mélange d’ajouts : non quantifiées (cumul V5.5 conditionnel).',
    ],
  };
}

// ---------- Prédictions V5.5 ----------
export const predictTriplet = createHopPredictor(ENGINE_DATA);
export function recipeInput(recipe: Recipe): HopRecipeInput {
  return { volumeL: recipe.volumeL, yeastId: recipe.yeastId, fermentation: [],
    additions: recipe.additions.filter((a) => a.grams > 0).map((a) => ({ id: a.id, name: hopRef(a.hopKey)?.name ?? a.hopKey, triplet: tripletOf(a, recipe) })) };
}
export interface RecipeProfile { profile: Profile; warnings: string[]; yeast: YeastInfo; interactions: boolean }
/** Profil de la recette entière : cumul expérimental V5.5 (predictHopRecipe), en plages par famille. */
export function recipeProfile(recipe: Recipe): RecipeProfile {
  const p = predictHopRecipe(recipeInput(recipe), {}, ENGINE_DATA);
  return { profile: profileOf(p.overall), warnings: p.warnings, yeast: yeastInfo(recipe.yeastId), interactions: p.overall.interactionsNonQuantifiees };
}
