import { getFirestore } from 'firebase-admin/firestore';
import type { HopEngineData } from './hopPredictionCore.js';
import type { HopPredictionComparison, HopTasting } from './hopPredictionSchema.js';
/** One user's bounded catalogue. Truncation is explicit. */
export async function loadBrewerHopContext(): Promise<HopEngineData & { predictions: HopPredictionComparison[]; tastings: HopTasting[]; truncated: string[] }> {
  const names = ['hopVarieties', 'hopLots', 'hopKnowledge', 'hopPredictions', 'hopTastings'] as const;
  const truncated: string[] = [];
  const rows = await Promise.all(names.map(async name => {
    const historical = name === 'hopPredictions' || name === 'hopTastings';
    const maximum = historical ? 20 : name === 'hopKnowledge' ? 5000 : name === 'hopVarieties' ? 1000 : 400;
    const collection = getFirestore().collection(name);
    const query = historical ? collection.orderBy(name === 'hopTastings' ? 'date' : 'createdAt', 'desc') : collection;
    const snapshot = await query.limit(maximum + 1).get();
    if (snapshot.size > maximum) truncated.push(`${name} (${maximum} fiches${historical ? ' récentes' : ''})`);
    return snapshot.docs.slice(0, maximum).map(doc => {
      const value = doc.data();
      if (name === 'hopPredictions') return { id: doc.id, name: value.name, createdAt: value.createdAt,
        ...(value.recipeId ? { recipeId: value.recipeId } : {}), ...(value.batchId ? { batchId: value.batchId } : {}),
        prediction: value.prediction, ...(value.recipePrediction ? { recipePrediction: value.recipePrediction } : {}), evidence: { knowledge: (value.evidence?.knowledge ?? []).filter((k: any) => k.kind === 'axis') } };
      return { ...value, id: doc.id };
    });
  }));
  return { varieties: rows[0], lots: rows[1], knowledge: rows[2], predictions: rows[3], tastings: rows[4], truncated } as any;
}
