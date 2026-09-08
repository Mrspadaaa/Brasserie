import { HopEngineData, predictHopTriplet, usableHopKnowledge } from './engine';
import { HopPredictionSnapshot, HopTriplet } from '../../../functions/src/hopPredictionSchema';
import { HopRange } from '../../../functions/src/hopIndexSchema';
export function captureHopPrediction(triplet: HopTriplet, target: Record<string, HopRange>, data: HopEngineData,
  identity: Pick<HopPredictionSnapshot, 'id' | 'name' | 'createdAt' | 'recipeId' | 'batchId'>): HopPredictionSnapshot {
  const prediction = predictHopTriplet(triplet, target, data);
  const knowledge = usableHopKnowledge(data.knowledge).valid.filter(k => ['note', 'trial', 'solver'].includes(k.kind) ? false : (k.kind === 'model' || k.kind === 'extrapolation')
    ? prediction.modelRefs.some(ref => ref.id === k.id) : k.kind === 'yeast' ? k.id === triplet.yeastId : true);
  const current = prediction.extrapolatedAxes?.length || knowledge.some(k => k.kind === 'model' && k.outputs.some(o => o.doseCurve));
  return structuredClone({ ...identity, engineVersion: current ? 'hop-experimental-v4' : 'hop-envelope-v2', target, prediction,
    evidence: { varieties: data.varieties.filter(v => v.id === triplet.varietyId), lots: data.lots.filter(l => l.id === triplet.lotId), knowledge } });
}
