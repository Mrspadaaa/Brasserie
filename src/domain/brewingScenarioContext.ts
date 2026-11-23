import type { BrewerContext } from '../../functions/src/companionTypes';
import { recipeForHopAnalysis, usableHopKnowledge, type HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { prepareHopRecipeInput } from './hopIndex/recipePrediction';
import { bindHopRecipe, type HopRecipeBinding } from './hopDecision/recipeAdapter';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';
import type { HopDecisionMaterial, HopProcessStage } from './hopDecision/types';
import { hopRecipeScenarioInputReference, type BrewingScenarioRuntime, type BrewingScenarioCultureContext, type BrewingScenarioBeerContext } from './brewingScenario';
import { yeastRecipeComputedOg } from './yeastProjection';
import { noloRecipeForBatch } from './nolo';
import { guidePredictionKnowledge } from './hopIndex/predictionReferences';
import { prepareBrewingStockAvailability, type BrewingStockAvailability } from './brewingStockAvailability';

export interface PreparedBrewingScenarioContext {
  version: 'brewing-scenario-context-v1';
  runtime: BrewingScenarioRuntime;
  binding?: HopRecipeBinding;
  limitations: string[];
  provenance: string[];
  stockAvailability?: Omit<BrewingStockAvailability, 'materials'>;
}

function stageFor(context: BrewerContext): HopProcessStage | null {
  const status = context.batch?.status;
  if (status === 'annule') return null;
  if (status === 'conditionne' || status === 'termine') return 'packaged';
  if (status === 'garde') return 'conditioning';
  if (status === 'fermentation' || Number.isFinite(context.journal?.pitchedAt)) return 'fermenting';
  if (Number.isFinite(context.journal?.startedAt)) return 'hotSide';
  if (!context.batch || status === 'planifie') return 'planning';
  return null;
}

/** One preparation path for UI and Gemini: the same recipe snapshot, actual
 * journal additions and catalogue produce the same input and freshness refs. */
export function prepareBrewingScenarioContext(
  context: BrewerContext, options: { culture?: BrewingScenarioCultureContext } = {}
): PreparedBrewingScenarioContext {
  const engineData: HopEngineData = structuredClone(context.hopIndex
    ? { varieties: context.hopIndex.varieties, lots: context.hopIndex.lots, knowledge: context.hopIndex.knowledge }
    : { varieties: [], lots: [], knowledge: [] });
  engineData.knowledge = guidePredictionKnowledge(engineData.knowledge);
  const limitations = [...(context.hopIndex?.truncated ?? [])];
  const provenance = [...context.provenance];
  const varieties = new Map(engineData.varieties.map(row => [row.id, row]));
  const materials: HopDecisionMaterial[] = [
    ...engineData.varieties.map(variety => ({ id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety })),
    ...engineData.lots.map(lot => ({ id: `lot:${lot.id}`, name: lot.name, form: lot.form, lot,
      ...(varieties.has(lot.varietyId) ? { variety: varieties.get(lot.varietyId)! } : {}),
      ...(lot.stockItemRef ? { stockItemRef: lot.stockItemRef } : {}) }))
  ];
  const runtime: BrewingScenarioRuntime = { engineData, materials };
  const applyStock = (binding?: HopRecipeBinding) => {
    const { materials: qualified, ...stockAvailability } = prepareBrewingStockAvailability({ materials: runtime.materials,
      inventory: context.inventory, reservations: context.stockReservations, batch: context.batch,
      program: runtime.current?.program, recipe: context.recipe, journal: context.journal });
    runtime.materials = qualified;
    if (binding) binding.materials = qualified;
    if (stockAvailability.rows.length) {
      runtime.dataRevision = stockAvailability.reference;
      if (runtime.current) runtime.current.stockAvailabilityReference = stockAvailability.reference;
      limitations.push(...stockAvailability.limitations);
      provenance.push(`Disponibilité de stock : ${stockAvailability.reference}; base ${stockAvailability.readBasis}.`);
      return stockAvailability;
    }
    return undefined;
  };
  if (!context.recipe) {
    const stockAvailability = applyStock();
    return { version: 'brewing-scenario-context-v1', runtime, limitations, provenance, ...(stockAvailability ? { stockAvailability } : {}) };
  }
  const withBatchNolo = context.batch?.nolo ? { ...context.recipe, nolo: context.batch.nolo } : context.recipe;
  const sourceRecipe = structuredClone(withBatchNolo.nolo?.enabled && context.batch
    ? noloRecipeForBatch({ ...context.batch, recipeSnapshot: withBatchNolo }) ?? withBatchNolo : withBatchNolo);
  const recipe = recipeForHopAnalysis(sourceRecipe, context.journal);
  recipe.id = context.batch?.id ?? sourceRecipe.id ?? sourceRecipe.sourceRecipeId ?? 'recipe-in-context';
  recipe.hops = (recipe.hops ?? []).map((hop: any, index: number) => {
    const actual = context.journal?.additions?.[`hop-${index}`];
    const next = { ...hop };
    if (hop.stage === 'boil' && typeof actual?.doneAt === 'number' && Number.isFinite(actual.doneAt)
      && typeof context.journal?.boilStartedAt === 'number' && Number.isFinite(context.journal.boilStartedAt)
      && typeof context.journal?.boilFinishedAt === 'number' && Number.isFinite(context.journal.boilFinishedAt)) {
      // The received adapter binds boilMinutes from timeMin; both representations
      // must use the completed contact calculated from this same journal.
      next.timeMin = next.aromaContactHours * 60;
    }
    if (actual && typeof actual.amount === 'number' && Number.isFinite(actual.amount)) {
      if (actual.unit === 'kg') next.weightG = actual.amount * 1000;
      else if (actual.unit && actual.unit !== 'g') {
        next.weightG = null;
        limitations.push(`Ajout ${index + 1} : unité du relevé incompatible avec une masse en grammes; dose inconnue.`);
      } else if (!actual.unit) {
        provenance.push(`Ajout ${index + 1} : le champ de masse du journal est interprété en grammes selon son contrat historique; aucune unité supplémentaire n'est déduite.`);
      }
      if (!Number.isFinite(next.weightG)) next.weightG = null;
    }
    if (actual?.replacement?.name && actual.replacement.name !== sourceRecipe.hops?.[index]?.name) {
      next.name = actual.replacement.name;
      delete next.hopVarietyId; delete next.hopLotId; delete next.stockItemRef;
      next.alpha = null;
      limitations.push(`Ajout ${index + 1} : remplacement consigné; anciennes analyses et identité retirées du scénario courant.`);
    }
    if (typeof actual?.temperatureC === 'number' && Number.isFinite(actual.temperatureC)) next.aromaTemperatureC = actual.temperatureC;
    return next;
  });
  const yeasts = usableHopKnowledge(engineData.knowledge).valid.filter((row): row is HopYeast => row.kind === 'yeast');
  const prepared = prepareHopRecipeInput(recipe, engineData.varieties, yeasts);
  // J1's program and the recipe predictor must address the very same addition IDs.
  prepared.input.additions = prepared.input.additions.map((addition, index) => ({ ...addition, id: `recipe-hop:${index}` }));
  if (typeof context.journal?.pitchTemperatureC === 'number' && Number.isFinite(context.journal.pitchTemperatureC)
    && typeof context.journal?.pitchedAt === 'number' && Number.isFinite(context.journal.pitchedAt)) prepared.input.pitchTempC = context.journal.pitchTemperatureC;
  provenance.push(...prepared.proposed);
  const recipeReference = hopAdviceContentReference('brewing-scenario-context-recipe-v1', {
    recipe: sourceRecipe, journal: context.journal ?? null, batch: context.batch ?? null,
    ...(options.culture ? { culture: options.culture } : {})
  });
  const inputReference = hopRecipeScenarioInputReference(prepared.input);
  const recipeSource = { title: 'Recette et journal du scénario', author: 'Données enregistrées du brasseur', year: null,
    kind: 'observation' as const, reference: recipeReference };
  const beerContext: BrewingScenarioBeerContext = { facts: [] };
  if (sourceRecipe.styleRef?.guideId && sourceRecipe.styleRef?.version && sourceRecipe.styleRef?.styleId) {
    beerContext.style = { ...sourceRecipe.styleRef, role: 'target' };
  }
  if (typeof sourceRecipe.style === 'string' && sourceRecipe.style) beerContext.facts.push({ id: 'style-intention', field: 'style.name',
    status: 'target', origin: 'userHypothesis', value: sourceRecipe.style, source: recipeSource });
  for (const [field, unit] of [['volumeL', 'L'], ['ogTarget', 'SG'], ['fgTarget', 'SG'], ['abvTarget', '% vol.'], ['ibuTarget', 'IBU']] as const) {
    const value = sourceRecipe[field];
    if (typeof value === 'number' && Number.isFinite(value)) beerContext.facts.push({ id: `target-${field}`, field,
      status: 'target', origin: 'userHypothesis', value, unit, source: recipeSource });
  }
  if (typeof context.batch?.volumeBrewedL === 'number' && Number.isFinite(context.batch.volumeBrewedL)) beerContext.facts.push({
    id: 'recorded-brewed-volume', field: 'batch.volumeBrewedL', status: 'observed', origin: 'observation', value: context.batch.volumeBrewedL,
    unit: 'L', source: recipeSource, timepoint: 'Volume produit consigné; ne prouve pas le volume à chaque contact.' });
  for (const [index, reading] of (context.journal?.readings ?? []).entries()) {
    if (typeof reading.value !== 'number' || !Number.isFinite(reading.value) || typeof reading.unit !== 'string' || !reading.unit) continue;
    beerContext.facts.push({ id: `reading-${index}`, field: `journal.${reading.kind}`, status: 'observed', origin: 'observation',
      value: reading.value, unit: reading.unit, ...(reading.volumeBasis ? { basis: reading.volumeBasis } : {}),
      ...(typeof reading.at === 'number' && Number.isFinite(new Date(reading.at).getTime()) ? { timepoint: new Date(reading.at).toISOString() } : {}),
      source: { ...recipeSource, locator: JSON.stringify(reading) } });
  }
  const culture: BrewingScenarioCultureContext = options.culture ?? (prepared.input.yeastId
    ? { state: 'single', members: [{ yeastId: prepared.input.yeastId }], explanation: 'Une souche est explicitement liée ou résolue dans cette recette; aucune composition supplémentaire supposée.' }
    : { state: 'unknown', members: [], explanation: 'La culture de la recette reste inconnue.' });
  const performedIndices = Object.keys(context.journal?.additions ?? {}).flatMap(key => {
    const match = /^hop-(\d+)$/.exec(key);
    const doneAt = context.journal?.additions?.[key]?.doneAt;
    return match && typeof doneAt === 'number' && Number.isFinite(doneAt) ? [Number(match[1])] : [];
  });
  runtime.current = { recipeReference, inputReference, input: prepared.input, program: null, culture, beerContext,
    performedAdditionIds: performedIndices.map(index => `recipe-hop:${index}`), limitations };
  let binding: HopRecipeBinding | undefined;
  const stage = stageFor(context);
  if (stage === null) limitations.push('Stade opérationnel inconnu ou brassin annulé : aperçu du programme indisponible; exploration séparée possible.');
  else {
    const materialByIndex: Record<number, string> = {};
    for (let index = 0; index < prepared.input.additions.length; index++) {
      const triplet = prepared.input.additions[index].triplet;
      const materialId = triplet.lotId ? `lot:${triplet.lotId}` : triplet.varietyId ? `variety:${triplet.varietyId}` : null;
      if (materialId && materials.some(material => material.id === materialId)) materialByIndex[index] = materialId;
    }
    try {
      binding = bindHopRecipe(recipe, { materials, materialByIndex, performedIndices, stage,
        revision: Number.isSafeInteger(context.journal?.revision) && context.journal.revision >= 0 ? context.journal.revision : 0,
        wortGravity: yeastRecipeComputedOg(recipe) });
      runtime.materials = binding.materials;
      runtime.current.program = binding.program;
      limitations.push(...binding.assumptions);
    } catch (error) {
      // Unknown timing can prevent a physical preview, without closing all sensory/biological branches.
      limitations.push(`Programme non lié : ${(error as Error).message}`);
    }
  }
  const stockAvailability = applyStock(binding);
  return { version: 'brewing-scenario-context-v1', runtime, ...(binding ? { binding } : {}), limitations, provenance,
    ...(stockAvailability ? { stockAvailability } : {}) };
}
