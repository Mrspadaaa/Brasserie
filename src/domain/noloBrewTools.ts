import type { HopRange } from '../../functions/src/hopIndexSchema';
import { NOLO_SUGARS, type NoloOperation, type NoloScience } from '../../functions/src/noloSchema';
import { aromaAlcoholContribution } from '../../functions/src/noloScenario';
import { BrewingMath } from '../services/brewingMath';
import type { TrialRecipe } from './hopIndex/trials';
import { newNoloConfig, noloPlanningSource } from './nolo';

/** Empty number inputs remain unknown. These tools may run on every keystroke. */
export type MaybeNumber = number | null | undefined;
export type ToolResult<T> = { value: T; issue: null } | { value: null; issue: string };
const ok = <T>(value: T): ToolResult<T> => ({ value, issue: null });
const unavailable = <T = never>(issue: string): ToolResult<T> => ({ value: null, issue });
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const nonnegative = (n: unknown): n is number => finite(n) && n >= 0;
const positive = (n: unknown): n is number => finite(n) && n > 0;
const rangeValid = (r: HopRange | null | undefined, max = Infinity): r is HopRange =>
  !!r && nonnegative(r.min) && nonnegative(r.max) && r.min <= r.max && r.max <= max;
const exact = (n: number): HopRange => ({ min: n, max: n });
const withinSg = (n: unknown): n is number => finite(n) && n >= 1 && n <= 3;

export interface NoloWortInput {
  targetAbvPct: MaybeNumber;
  /** Percentage POINTS held aside at the base beer volume, before any later dilution. */
  reserveAbvPct: MaybeNumber;
  /** Explicit brewing hypothesis; never inferred from the name of a yeast. */
  attenuationPct: HopRange | null | undefined;
  simulationSg?: MaybeNumber;
}
export interface NoloWortResult {
  wortBudgetAbvPct: number;
  maxSg: number;
  currentSg: number | null;
  currentAbvPct: HopRange | null;
  currentIssue: string | null;
  simulationAbvPct: HopRange | null;
  scaleFactor: number | null;
  curve: { sg: number; abvPct: HopRange }[];
}

/** Ingredient calculation only: an OG reading is never overwritten or invented. */
function currentWortSg(recipe: TrialRecipe): ToolResult<number> {
  if (recipe.nolo?.process === 'secondRunnings')
    return unavailable('Drêches : utiliser la densité du moût récupéré. Aucun nouveau rendement du malt n’est calculé.');
  if (recipe.nolo?.process === 'coldExtraction')
    return unavailable('Extraction à froid : mesurer la densité et le rendement du moût obtenu. Le rendement d’empâtage à chaud ne s’applique pas.');
  if (!positive(recipe.volumeL)) return unavailable('Renseigner un volume de moût supérieur à 0 L.');
  const before = recipe.fermentables.filter(f => f.use !== 'fermentation');
  if (before.some(f => !nonnegative(f.weightKg))) return unavailable('Vérifier les masses de fermentescibles avant fermentation.');
  const active = before.filter(f => f.weightKg > 0);
  if (!active.length) return unavailable('Ajouter les fermentescibles du moût pour calculer l’OG et les quantités à ajuster.');
  const missing = active.filter(f => !positive(f.potentialPpg));
  if (missing.length) return unavailable('Potentiel PPG à renseigner : ' + missing.map(f => f.name).join(', ') + '.');
  const efficiency = recipe.efficiencyPct ?? recipe.brewhouse?.efficiencyPct;
  const needsMashYield = active.some(f => (f.kind ?? 'grain') === 'grain');
  if (needsMashYield && (!positive(efficiency) || efficiency > 100))
    return unavailable('Renseigner un rendement d’extraction connu, entre 0 et 100 % excluant 0.');
  // For extract/sugar only, 100 is the mass balance, not an assumed mash yield.
  const points = BrewingMath.extractPoints(before, recipe.volumeL, needsMashYield ? efficiency! : 100, 'full');
  const sg = points ? 1 + points.total / 1000 : null;
  return withinSg(sg) ? ok(sg) : unavailable('L’extrait calculé est hors du domaine de densité SG 1 à 3.');
}

/** SG/attenuation sensitivity, conditional on the entered attenuation range.
 * SG max is the boundary at the HIGHEST attenuation, with additions reserved.
 * This relation is a planning estimate, not an assay or biological guarantee. */
export function wortTool(recipe: TrialRecipe, input: NoloWortInput, science: NoloScience): ToolResult<NoloWortResult> {
  if (!nonnegative(input.targetAbvPct) || input.targetAbvPct > 100)
    return unavailable('Renseigner une cible d’alcool entre 0 et 100 % vol.');
  if (!nonnegative(input.reserveAbvPct) || input.reserveAbvPct > input.targetAbvPct)
    return unavailable('La réserve pour les ajouts doit être comprise entre 0 et la cible, en points de % vol.');
  if (!rangeValid(input.attenuationPct, 100))
    return unavailable('Renseigner une plage d’atténuation ordonnée entre 0 et 100 %.');
  if (input.attenuationPct.max === 0)
    return unavailable('Une atténuation maximale de 0 % ne permet pas de fixer une OG maximale.');
  const factor = science.planningModels?.sgAbvFactor.value;
  if (!positive(factor)) return unavailable('La relation SG–alcool sourcée est absente ou invalide.');
  if (input.simulationSg != null && !withinSg(input.simulationSg))
    return unavailable('La densité à simuler doit être comprise entre SG 1 et 3.');
  const wortBudgetAbvPct = input.targetAbvPct - input.reserveAbvPct;
  const maxSg = 1 + wortBudgetAbvPct / (factor * input.attenuationPct.max / 100);
  if (!withinSg(maxSg)) return unavailable('Cette hypothèse ne donne pas de limite d’OG exploitable entre SG 1 et 3.');
  const attenuation = input.attenuationPct;
  const project = (sg: number): HopRange => ({
    min: (sg - 1) * attenuation.min / 100 * factor,
    max: (sg - 1) * attenuation.max / 100 * factor
  });
  const current = currentWortSg(recipe);
  const currentSg = current.value;
  const simulationAbvPct = input.simulationSg == null ? null : project(input.simulationSg);
  // Axis bounds only; 1.010 avoids an empty chart for a zero alcohol budget.
  const end = Math.max(1.01, maxSg, currentSg ?? 1, input.simulationSg ?? 1);
  const points = new Set(Array.from({ length: 21 }, (_, i) => 1 + (end - 1) * i / 20));
  points.add(maxSg);
  if (currentSg !== null) points.add(currentSg);
  if (input.simulationSg != null) points.add(input.simulationSg);
  const curve = [...points].sort((a, b) => a - b).map(sg => ({ sg, abvPct: project(sg) }));
  if (curve.some(point => !rangeValid(point.abvPct))) return unavailable('La relation SG–alcool donne un résultat hors de la plage de calcul.');
  return ok({ wortBudgetAbvPct, maxSg, currentSg,
    currentAbvPct: currentSg === null ? null : project(currentSg), currentIssue: current.issue,
    simulationAbvPct, scaleFactor: currentSg !== null && currentSg > 1 ? (maxSg - 1) / (currentSg - 1) : null,
    curve });
}

/** Explicit apply action. All pre-fermentation extract is scaled proportionally,
 * including kettle sugars; later additions, measurements and programmes stay intact.
 * Water treatment and hop dosing need their own review after changing the grist. */
export function applyNoloWortSg<T extends TrialRecipe>(recipe: T, targetSg: MaybeNumber): ToolResult<T> {
  if (!withinSg(targetSg)) return unavailable('La densité à appliquer doit être comprise entre SG 1 et 3.');
  const current = currentWortSg(recipe);
  if (current.value === null) return unavailable(current.issue!);
  if (current.value <= 1) return unavailable('Un extrait initial non nul est nécessaire pour conserver les proportions.');
  const factor = (targetSg - 1) / (current.value - 1);
  const fermentables = recipe.fermentables.map(f => f.use === 'fermentation' ? f : { ...f, weightKg: f.weightKg * factor });
  const totalGristKg = fermentables.filter(f => (f.kind ?? 'grain') === 'grain').reduce((sum, f) => sum + f.weightKg, 0);
  if (!nonnegative(totalGristKg) || fermentables.some(f => !nonnegative(f.weightKg)))
    return unavailable('Les masses ajustées sont invalides. Vérifier les quantités et la densité.');
  const nolo = recipe.nolo ?? newNoloConfig();
  return ok({ ...recipe, fermentables, totalGristKg, ogTarget: targetSg,
    nolo: { ...nolo, planning: { ...nolo.planning, version: 1,
      source: nolo.planning?.source ?? noloPlanningSource, exactExtract: true } } });
}

interface OperationIdentity { id: string; name: string }
type SugarOperation = Extract<NoloOperation, { kind: 'sugar' }>;
type AromaOperation = Extract<NoloOperation, { kind: 'aroma' }>;
export interface FruitSugarInput extends OperationIdentity {
  fruitKg: MaybeNumber;
  sugarsGPer100G: MaybeNumber;
  /** Net added volume at this stage; no kg-to-L conversion is assumed. */
  addedVolumeL: MaybeNumber;
}
export function fruitSugarOperation(input: FruitSugarInput): ToolResult<SugarOperation> {
  if (!input.id.trim() || !input.name.trim()) return unavailable('Donner un nom à l’ajout de fruit.');
  if (!nonnegative(input.fruitKg)) return unavailable('Renseigner la masse de fruit en kg.');
  if (!nonnegative(input.sugarsGPer100G) || input.sugarsGPer100G > 100)
    return unavailable('Renseigner les sucres totaux de la fiche produit, de 0 à 100 g/100 g.');
  if (!nonnegative(input.addedVolumeL)) return unavailable('Renseigner le volume net ajouté en L ; la masse de fruit ne donne pas son volume.');
  const sugarG = input.fruitKg * input.sugarsGPer100G * 10;
  if (!nonnegative(sugarG)) return unavailable('La masse de sucres calculée est trop grande.');
  return ok({ id: input.id, name: input.name, kind: 'sugar', sugarsG: {}, complete: true,
    volumeL: input.addedVolumeL, unclassifiedSugarG: exact(sugarG) });
}
export interface PrimingSugarInput extends OperationIdentity {
  doseGL: MaybeNumber;
  beerVolumeL: MaybeNumber;
  /** Pure sucrose or glucose, not an unspecified syrup or glucose monohydrate. */
  sugar: 'sucrose' | 'glucose';
}
export function primingSugarOperation(input: PrimingSugarInput): ToolResult<SugarOperation> {
  if (!input.id.trim() || !input.name.trim()) return unavailable('Donner un nom au resucrage.');
  if (!nonnegative(input.doseGL)) return unavailable('Renseigner la dose de sucre en g/L.');
  if (!positive(input.beerVolumeL)) return unavailable('Renseigner le volume de bière à resucrer, supérieur à 0 L.');
  if (input.sugar !== 'sucrose' && input.sugar !== 'glucose') return unavailable('Choisir saccharose ou glucose pur.');
  const sugarG = input.doseGL * input.beerVolumeL;
  if (!nonnegative(sugarG)) return unavailable('La masse de resucrage calculée est trop grande.');
  // Dry sugar: no liquid carrier is added in this approximation.
  return ok({ id: input.id, name: input.name, kind: 'sugar', sugarsG: { [input.sugar]: exact(sugarG) }, complete: true, volumeL: 0 });
}
export interface AromaInput extends OperationIdentity {
  doseML: MaybeNumber;
  carrierAbvPct: HopRange | null | undefined;
  /** Total sugar mass in the dose, g, as specified by the supplier. */
  sugarG: MaybeNumber;
  composition?: string;
  moment?: string;
}
export function aromaOperation(input: AromaInput): ToolResult<AromaOperation> {
  if (!input.id.trim() || !input.name.trim()) return unavailable('Donner un nom au produit aromatique.');
  if (!nonnegative(input.doseML)) return unavailable('Renseigner la dose de produit en mL.');
  if (!rangeValid(input.carrierAbvPct, 100)) return unavailable('Renseigner l’alcool du support aromatique, de 0 à 100 % vol.');
  if (!nonnegative(input.sugarG)) return unavailable('Renseigner la masse totale de sucre dans cette dose, en g.');
  if (input.doseML === 0 && input.sugarG > 0) return unavailable('Une dose de produit de 0 mL ne peut pas apporter du sucre.');
  return ok({ id: input.id, name: input.name, kind: 'aroma', volumeML: input.doseML,
    carrierAbvPct: { ...input.carrierAbvPct }, sugarG: exact(input.sugarG),
    composition: input.composition ?? '', moment: input.moment ?? '' });
}

export interface NoloAdditionImpactInput {
  /** Volume and alcohol range immediately BEFORE this single operation. */
  baseVolumeL: MaybeNumber;
  baseAbvPct: HopRange | null | undefined;
  targetAbvPct: MaybeNumber;
  operation: NoloOperation | null | undefined;
}
export interface NoloAdditionImpact {
  finalVolumeL: number;
  abvPct: HopRange;
  /** Sugar brought by this operation only, never base beer residual sugar. */
  sugarG: HopRange;
  /** Contribution on FINAL volume, from carrier alcohol to full sugar conversion. */
  addedAlcoholAbvPct: HopRange;
  /** Target minus upper final bound, in percentage points; negative is an overrun. */
  marginAbvPct: number;
}

/** Local material balance. Sugar conversion spans zero to its stoichiometric
 * maximum. Residual beer sugars and biological stability are outside this tool. */
export function additionImpact(input: NoloAdditionImpactInput, science: NoloScience): ToolResult<NoloAdditionImpact> {
  if (!positive(input.baseVolumeL)) return unavailable('Renseigner le volume de bière avant l’ajout, supérieur à 0 L.');
  if (!rangeValid(input.baseAbvPct, 100)) return unavailable('Renseigner une plage d’alcool valide pour la bière avant l’ajout.');
  if (!nonnegative(input.targetAbvPct) || input.targetAbvPct > 100) return unavailable('Renseigner la cible d’alcool en % vol.');
  if (!input.operation) return unavailable('Compléter les données de l’ajout.');
  const density = science.ethanolDensityGL.value;
  const yields = NOLO_SUGARS.map(s => science.ethanolMaxGPerG[s]?.value);
  if (!positive(density) || yields.some(y => !positive(y) || y >= 1))
    return unavailable('Les constantes sourcées du bilan de sucres sont absentes ou invalides.');
  const yieldMax = Math.max(...yields);
  const operation = input.operation;
  const final = noloVolumeAfterOperations(input.baseVolumeL, [operation]);
  if (final.value === null) return unavailable(final.issue!);
  const finalVolumeL = final.value;
  let beerAlcohol = { min: input.baseAbvPct.min * input.baseVolumeL * density / 100,
    max: input.baseAbvPct.max * input.baseVolumeL * density / 100 };
  let contribution = exact(0);
  let sugarG = exact(0);
  if (operation.kind === 'sugar') {
    if (!operation.sugarsG || Object.keys(operation.sugarsG).some(k => !NOLO_SUGARS.includes(k as typeof NOLO_SUGARS[number])))
      return unavailable('Le profil de sucres de l’ajout est invalide.');
    for (const sugar of NOLO_SUGARS) {
      const amount = operation.sugarsG[sugar];
      if (amount == null && (!(operation.complete === true) || sugar in operation.sugarsG))
        return unavailable('Compléter les masses de sucres de l’ajout ou préciser un total connu non classé.');
      if (amount != null) {
        if (!rangeValid(amount)) return unavailable('Vérifier la plage de masse de chaque sucre ajouté.');
        sugarG.min += amount.min; sugarG.max += amount.max;
        contribution.max += amount.max * science.ethanolMaxGPerG[sugar].value;
      }
    }
    if (operation.unclassifiedSugarG !== undefined) {
      if (!rangeValid(operation.unclassifiedSugarG)) return unavailable('Renseigner la masse totale des sucres non classés.');
      sugarG.min += operation.unclassifiedSugarG.min; sugarG.max += operation.unclassifiedSugarG.max;
      contribution.max += operation.unclassifiedSugarG.max * yieldMax;
    }
  } else if (operation.kind === 'aroma') {
    if (!rangeValid(operation.carrierAbvPct, 100) || !rangeValid(operation.sugarG))
      return unavailable('Renseigner l’alcool du support et la masse de sucre du produit aromatique.');
    if (operation.volumeML === 0 && operation.sugarG.max > 0)
      return unavailable('Une dose de produit de 0 mL ne peut pas apporter du sucre.');
    sugarG = { ...operation.sugarG };
    try {
      const alcohol = aromaAlcoholContribution(operation, science).combined;
      if (alcohol.max === null) return unavailable('La composition aromatique ne permet pas de borner cet ajout.');
      contribution = { min: alcohol.min, max: alcohol.max };
    } catch (error) {
      return unavailable(error instanceof Error ? error.message : 'La composition du produit aromatique est incohérente.');
    }
  } else if (operation.kind === 'blend') {
    if (!rangeValid(operation.abvPct, 100) || !rangeValid(operation.remainingSugarG))
      return unavailable('Renseigner l’alcool et les sucres résiduels de la bière ajoutée.');
    sugarG = { ...operation.remainingSugarG };
    contribution = { min: operation.volumeL! * operation.abvPct.min * density / 100,
      max: operation.volumeL! * operation.abvPct.max * density / 100 + sugarG.max * yieldMax };
  } else if (operation.kind === 'removal') {
    if (!rangeValid(operation.ethanolRemovedPct, 100) || !operation.source.trim())
      return unavailable('Renseigner la plage et la source du retrait d’alcool envisagé.');
    beerAlcohol = { min: beerAlcohol.min * (1 - operation.ethanolRemovedPct.max / 100),
      max: beerAlcohol.max * (1 - operation.ethanolRemovedPct.min / 100) };
  }
  const toAbv = 100 / density / finalVolumeL;
  const abvPct = { min: (beerAlcohol.min + contribution.min) * toAbv, max: (beerAlcohol.max + contribution.max) * toAbv };
  if (!rangeValid(sugarG) || !rangeValid(abvPct, 100)) return unavailable('Le bilan donne un résultat impossible. Vérifier masses, volumes et teneurs.');
  return ok({ finalVolumeL, abvPct, sugarG,
    addedAlcoholAbvPct: { min: contribution.min * toAbv, max: contribution.max * toAbv },
    marginAbvPct: input.targetAbvPct - abvPct.max });
}

/** Replay active operations once, in order. A removal sets the final volume,
 * it does not add it. Repeated identities are rejected instead of double counted. */
export function noloVolumeAfterOperations(baseVolumeL: MaybeNumber, operations: readonly NoloOperation[]): ToolResult<number> {
  let volume = positive(baseVolumeL) ? baseVolumeL : null;
  let issue: string | null = volume === null ? 'Renseigner le volume de bière initial, supérieur à 0 L.' : null;
  const seen = new Set<string>();
  for (const operation of operations) {
    if (!operation.id || seen.has(operation.id)) return unavailable('Chaque opération doit avoir une identité unique pour être comptée une seule fois.');
    seen.add(operation.id);
    if (operation.kind === 'removal') {
      // A known downstream volume can re-anchor an earlier missing volume.
      volume = positive(operation.finalVolumeL) ? operation.finalVolumeL : null;
      issue = volume === null ? 'Renseigner le volume après désalcoolisation, supérieur à 0 L.' : null;
      continue;
    }
    const added = operation.kind === 'aroma' ? (operation.volumeML == null ? null : operation.volumeML / 1000) : operation.volumeL;
    if (!nonnegative(added)) {
      volume = null;
      issue = 'Renseigner un volume ajouté valide pour « ' + (operation.name || operation.kind) + ' ».';
    } else if (volume !== null) {
      volume += added;
      if (!positive(volume)) return unavailable('Le volume total calculé est invalide.');
    }
  }
  return volume === null ? unavailable(issue!) : ok(volume);
}

export interface NoloDilutionInput {
  baseVolumeL: MaybeNumber;
  baseAbvPct: HopRange | null | undefined;
  targetAbvPct: MaybeNumber;
  /** Added water explored now, excluding dilution operations already in the base. */
  waterL: MaybeNumber;
  initialIbu?: MaybeNumber;
  capacityL?: MaybeNumber;
}
export interface NoloDilutionResult {
  requiredWaterL: number | null;
  requiredIssue: string | null;
  finalVolumeL: number;
  abvPct: HopRange;
  beerFractionPct: number;
  ibu: number | null;
  capacityExceeded: boolean;
  requiredCapacityExceeded: boolean;
  curve: { waterL: number; abvPct: HopRange }[];
}

/** Conservation of alcohol and IBU concentration at additive volume. This does
 * not estimate flavour, colour, dissolved oxygen or microbiological stability. */
export function dilutionTool(input: NoloDilutionInput): ToolResult<NoloDilutionResult> {
  if (!positive(input.baseVolumeL)) return unavailable('Renseigner le volume actuel de bière, supérieur à 0 L.');
  if (!rangeValid(input.baseAbvPct, 100)) return unavailable('Renseigner une plage d’alcool actuelle ordonnée, de 0 à 100 % vol.');
  if (!nonnegative(input.targetAbvPct) || input.targetAbvPct > 100) return unavailable('Renseigner la cible de dilution en % vol.');
  if (!nonnegative(input.waterL)) return unavailable('Renseigner le volume d’eau à explorer en L.');
  if (input.initialIbu != null && !nonnegative(input.initialIbu)) return unavailable('L’amertume de départ doit être positive ou nulle, en IBU.');
  if (input.capacityL != null && !positive(input.capacityL)) return unavailable('La capacité du contenant doit être supérieure à 0 L.');
  const baseVolume = input.baseVolumeL, abv = input.baseAbvPct;
  const impossibleZero = input.targetAbvPct === 0 && abv.max > 0;
  const rawRequired = abv.max <= input.targetAbvPct ? 0 : impossibleZero ? null : baseVolume * (abv.max - input.targetAbvPct) / input.targetAbvPct;
  if (rawRequired !== null && !nonnegative(rawRequired)) return unavailable('Le volume d’eau nécessaire est hors de la plage de calcul.');
  // The applied amount is never rounded down: retain protection at the high ABV bound.
  const requiredWaterL = rawRequired === null ? null : Math.ceil(rawRequired * 100) / 100;
  const finalVolumeL = baseVolume + input.waterL;
  if (!positive(finalVolumeL) || (requiredWaterL !== null && !nonnegative(requiredWaterL))) return unavailable('Le volume final est hors de la plage de calcul.');
  const project = (waterL: number): HopRange => ({ min: abv.min * (baseVolume / (baseVolume + waterL)), max: abv.max * (baseVolume / (baseVolume + waterL)) });
  const beerFraction = baseVolume / finalVolumeL;
  const end = Math.max(input.waterL, requiredWaterL ?? 0, baseVolume / 4);
  if (!positive(baseVolume + end)) return unavailable('Le volume exploré est hors de la plage de calcul.');
  const points = new Set(Array.from({ length: 21 }, (_, i) => end * (i / 20)));
  points.add(input.waterL);
  if (requiredWaterL !== null) points.add(requiredWaterL);
  return ok({ requiredWaterL,
    requiredIssue: impossibleZero ? 'Aucune quantité finie d’eau ne ramène un alcool présent à exactement 0 % vol.' : null,
    finalVolumeL, abvPct: project(input.waterL), beerFractionPct: beerFraction * 100,
    ibu: input.initialIbu == null ? null : input.initialIbu * beerFraction,
    capacityExceeded: input.capacityL != null && finalVolumeL > input.capacityL,
    requiredCapacityExceeded: input.capacityL != null && (requiredWaterL === null || baseVolume + requiredWaterL > input.capacityL),
    curve: [...points].sort((a, b) => a - b).map(waterL => ({ waterL, abvPct: project(waterL) })) });
}

export interface BenchTrialInput {
  /** Beer aliquot BEFORE the product is added. */
  sampleML: MaybeNumber;
  doseML: MaybeNumber;
  /** Remaining beer to treat, excluding samples already drawn. */
  beerVolumeL: MaybeNumber;
}

export interface GravityTrialInput {
  ogSg: MaybeNumber;
  fgSg: MaybeNumber;
  /** Absolute SG tolerance for EACH reading, e.g. 0.001, not gravity points. */
  readingToleranceSg: MaybeNumber;
}
export interface GravityTrialResult {
  attenuationPct: HopRange;
  abvPct: HopRange;
}
/** Read back a pilot's apparent attenuation, to adopt explicitly as a future
 * hypothesis. SG readings must be corrected to the instrument's temperature;
 * raw refractometer readings in fermented beer are unsuitable. Independent
 * ± tolerances give an envelope, not a confidence interval or an alcohol assay. */
export function analyzeGravityTrial(input: GravityTrialInput, science: NoloScience): ToolResult<GravityTrialResult> {
  if (!withinSg(input.ogSg) || input.ogSg <= 1)
    return unavailable('Renseigner une OG supérieure à SG 1, dans le domaine de lecture SG 1 à 3.');
  if (!withinSg(input.fgSg) || input.fgSg > input.ogSg)
    return unavailable('La FG doit être comprise entre SG 1 et l’OG. Vérifier les deux lectures.');
  if (!nonnegative(input.readingToleranceSg)) return unavailable('Renseigner la tolérance de chaque lecture en SG, positive ou nulle.');
  const lowOg = input.ogSg - input.readingToleranceSg, highOg = input.ogSg + input.readingToleranceSg;
  const lowFg = input.fgSg - input.readingToleranceSg, highFg = input.fgSg + input.readingToleranceSg;
  if (lowOg <= 1) return unavailable('La tolérance atteint SG 1 pour l’OG : l’atténuation ne peut pas être bornée utilement.');
  const factor = science.planningModels?.sgAbvFactor.value;
  if (!positive(factor)) return unavailable('La relation SG–alcool sourcée est absente ou invalide.');
  const attenuationPct = {
    min: Math.max(0, Math.min(100, (lowOg - highFg) / (lowOg - 1) * 100)),
    max: Math.max(0, Math.min(100, (highOg - lowFg) / (highOg - 1) * 100))
  };
  const abvPct = { min: Math.max(0, (lowOg - highFg) * factor), max: Math.max(0, (highOg - lowFg) * factor) };
  if (!rangeValid(attenuationPct, 100) || !rangeValid(abvPct, 100)) return unavailable('Les lectures et leur tolérance donnent un résultat hors du domaine du calcul.');
  return ok({ attenuationPct, abvPct });
}
export interface BenchTrialResult {
  batchDoseML: number;
  doseMLPerL: number;
  aliquots: { factor: number; sampleML: number; doseML: number }[];
}
/** Same product-to-beer ratio at glass and batch scale. No sensory extrapolation
 * and no recipe write; the brewer first compares the control and three doses. */
export function scaleBenchTrial(input: BenchTrialInput): ToolResult<BenchTrialResult> {
  if (!positive(input.sampleML)) return unavailable('Renseigner le volume de bière par verre, supérieur à 0 mL.');
  if (!nonnegative(input.doseML)) return unavailable('Renseigner la dose du produit par verre en mL.');
  if (!positive(input.beerVolumeL)) return unavailable('Renseigner le volume de bière restant à traiter, supérieur à 0 L.');
  const doseMLPerL = input.doseML / input.sampleML * 1000;
  const batchDoseML = doseMLPerL * input.beerVolumeL;
  if (!nonnegative(batchDoseML) || !nonnegative(doseMLPerL) || !nonnegative(input.doseML * 1.5))
    return unavailable('La dose calculée est hors de la plage de calcul.');
  return ok({ batchDoseML, doseMLPerL,
    aliquots: [0, .5, 1, 1.5].map(factor => ({ factor, sampleML: input.sampleML!, doseML: input.doseML! * factor })) });
}
