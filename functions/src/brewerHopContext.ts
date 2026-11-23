import { getFirestore } from 'firebase-admin/firestore';
import { loadBrewingCatalogueReferences } from './brewerTools.js';
import type { HopEngineData } from './hopPredictionCore.js';
import type { HopPredictionComparison, HopTasting } from './hopPredictionSchema.js';
import type { BrewerReferenceRequest } from './companionTypes.js';
/** Shared brewery references plus bounded persisted records. Truncation is explicit. */
export async function loadBrewerHopContext(request: BrewerReferenceRequest = {}): Promise<HopEngineData & { predictions: HopPredictionComparison[]; tastings: HopTasting[]; truncated: string[] }> {
  const names = ['hopVarieties', 'hopLots', 'hopKnowledge', 'hopPredictions', 'hopTastings'] as const;
  const truncated: string[] = [];
  const db = getFirestore();
  const idList = (ids: string[] | undefined) => {
    if (!ids) return [];
    if (ids.length > 500 || ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 200 || /[\\/]/.test(id) || /^\.{1,2}$|^__.*__$/.test(id))) throw Error('Références de catalogue invalides ou trop nombreuses.');
    return [...new Set(ids)];
  };
  const targeted = await Promise.all([
    ['hopVarieties', idList(request.varietyIds)], ['hopLots', idList(request.lotIds)], ['hopKnowledge', idList(request.knowledgeIds)]
  ].map(async ([collection, ids]) => {
    const keys = ids as string[];
    if (!keys.length) return [];
    return (await db.getAll(...keys.map(id => db.doc(`${collection}/${id}`)))).filter(doc => doc.exists).map(doc => ({ ...doc.data(), id: doc.id }));
  }));
  const linkedVarieties = idList(targeted[1].map(lot => (lot as any).varietyId).filter((id): id is string => typeof id === 'string'))
    .filter(id => !targeted[0].some(variety => variety.id === id));
  if (linkedVarieties.length) targeted[0].push(...(await db.getAll(...linkedVarieties.map(id => db.doc(`hopVarieties/${id}`))))
    .filter(doc => doc.exists).map(doc => ({ ...doc.data(), id: doc.id })));
  if (request.onlyReferences) return { varieties: targeted[0], lots: targeted[1], knowledge: targeted[2], predictions: [], tastings: [], truncated } as any;
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
  const references = await loadBrewingCatalogueReferences();
  const merge = (proposed: any[], saved: any[]) => [...new Map([...proposed, ...saved].map(row => [row.id, row])).values()];
  return { varieties: merge(references.varieties, [...rows[0], ...targeted[0]]), lots: merge(rows[1], targeted[1]),
    knowledge: merge(references.knowledge, [...rows[2], ...targeted[2]]), predictions: rows[3], tastings: rows[4], truncated } as any;
}
