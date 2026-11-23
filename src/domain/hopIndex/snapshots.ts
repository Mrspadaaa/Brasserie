import { HopEngineData, predictHopTriplet, usableHopKnowledge } from './engine';
import { HopPredictionSnapshot, HopTriplet } from '../../../functions/src/hopPredictionSchema';
import { HopRange } from '../../../functions/src/hopIndexSchema';
import { assertHopRecipeInput, predictHopRecipe, type HopRecipeInput } from '../../../functions/src/hopRecipePrediction';
export function captureHopPrediction(triplet: HopTriplet, target: Record<string, HopRange>, data: HopEngineData,
  identity: Pick<HopPredictionSnapshot, 'id' | 'name' | 'createdAt' | 'recipeId' | 'batchId'>): HopPredictionSnapshot {
  const prediction = predictHopTriplet(triplet, target, data);
  const knowledge = usableHopKnowledge(data.knowledge).valid.filter(k => ['note', 'trial', 'solver', 'fermentation'].includes(k.kind) ? false : (k.kind === 'model' || k.kind === 'extrapolation')
    ? prediction.modelRefs.some(ref => ref.id === k.id) : k.kind === 'yeast' ? k.id === triplet.yeastId : true);
  const current = prediction.extrapolatedAxes?.length || knowledge.some(k => k.kind === 'model' && k.outputs.some(o => o.doseCurve));
  return structuredClone({ ...identity, engineVersion: current ? 'hop-experimental-v4' : 'hop-envelope-v2', target, prediction,
    evidence: { varieties: data.varieties.filter(v => v.id === triplet.varietyId), lots: data.lots.filter(l => l.id === triplet.lotId), knowledge } });
}

/** Freeze the real programme alongside its per-addition results. No fictitious
 * triplet represents a blend. The first-addition field preserves old clients. */
export function captureHopRecipePrediction(input: HopRecipeInput, target: Record<string, HopRange>, data: HopEngineData,
  identity: Pick<HopPredictionSnapshot, 'id' | 'name' | 'createdAt' | 'recipeId' | 'batchId'>): HopPredictionSnapshot {
  assertHopRecipeInput(input);
  if (!input.additions.length) throw Error('Ajoute un houblon avant de conserver ce programme.');
  const checked = usableHopKnowledge(data.knowledge);
  if (checked.errors.length) throw Error('Corrige les références invalides avant de figer ce programme.');
  const varietyIds = new Set(input.additions.map(a => a.triplet.varietyId));
  const lotIds = new Set(input.additions.map(a => a.triplet.lotId));
  const evidence = {
    varieties: data.varieties.filter(v => varietyIds.has(v.id)), lots: data.lots.filter(l => lotIds.has(l.id)),
    knowledge: checked.valid.filter(k => k.kind === 'yeast' ? k.id === input.yeastId
      : k.kind === 'fermentation' ? k.yeastId === input.yeastId : !['note', 'trial', 'solver', 'fermentationScience'].includes(k.kind))
  };
  const { additions, ...recipePrediction } = predictHopRecipe(input, target, evidence);
  return structuredClone({ ...identity, engineVersion: 'hop-experimental-v4', target,
    prediction: additions[0], recipePrediction, evidence });
}
