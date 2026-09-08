import type { BrewerContext, BrewerProposal } from './companionTypes.js';
type Index = NonNullable<BrewerContext['hopIndex']>;
/** Keep the complete catalogue in tool memory, not duplicated in every model prompt. */
export function hopIndexOverview(index: Index | undefined) {
  if (!index) return null;
  const relevant = new Set(index.lots.map(l => l.varietyId));
  index.knowledge.forEach(k => { if (k.kind === 'model') relevant.add(k.scope.varietyId); });
  const varieties = index.varieties.filter(v => relevant.has(v.id)).slice(0, 40);
  return {
    instruction: 'Aperçu documentaire. lookup_hop_reference donne les plages et COA complets ; predict_hop_aroma calcule depuis les données complètes chargées, jamais depuis cet aperçu. Un lot referenceOnly est un échantillon publié, pas un lot possédé par la brasserie.',
    catalogue: { references: index.varieties.length, sources: [...new Set(index.varieties.map(v => v.analysis?.[0]?.source?.author ?? v.descriptions?.[0]?.source?.author).filter(Boolean))], omittedFromOverview: index.varieties.length - varieties.length },
    varieties: varieties.map(v => ({ id: v.id, name: v.name, aliases: v.aliases, origin: v.origin, form: v.form, source: v.analysis?.[0]?.source?.author ?? v.descriptions?.[0]?.source?.author, archived: v.archived })),
    lots: index.lots.map(l => ({ id: l.id, varietyId: l.varietyId, name: l.name, lotNumber: l.lotNumber, harvestYear: l.harvestYear, growingRegion: l.growingRegion, grower: l.grower, storageNotes: l.storageNotes, referenceOnly: l.referenceOnly, form: l.form, archived: l.archived })),
    knowledge: index.knowledge.map(k => k.kind === 'extrapolation' ? {
      id: k.id, kind: k.kind, name: k.name, version: k.version, enabled: k.enabled, source: k.source,
      limitations: k.limitations, axes: k.axes.map(a => ({ id: a.id, version: a.version })),
      instruction: 'Les coefficients restent dans les données complètes de predict_hop_aroma. Extrapolation experte non calibrée ; ne pas calculer soi-même un point ni une concentration depuis les descripteurs.'
    } : k),
    predictions: index.predictions.map(p => ({ id: p.id, name: p.name, createdAt: p.createdAt, recipeId: p.recipeId, batchId: p.batchId })),
    tastings: index.tastings.map(t => ({ id: t.id, name: t.name, date: t.date, origin: t.origin, predictionId: t.predictionId })),
    truncated: index.truncated
  };
}
export function brewerContextForPrompt(context: BrewerContext) {
  return context.hopIndex ? { ...context, hopIndex: hopIndexOverview(context.hopIndex) } : context;
}
/** Proposal replay needs identities and definitions, not a copy of every catalogue COA. */
export function brewerContextForStorage(context: BrewerContext, proposal?: BrewerProposal): BrewerContext {
  const index = context.hopIndex;
  if (!index) return context;
  const varieties = new Set<string>(), lots = new Set<string>();
  const keepHop = (hop: any) => { if (hop?.hopVarietyId) varieties.add(hop.hopVarietyId); if (hop?.hopLotId) lots.add(hop.hopLotId); };
  (context.recipe?.hops ?? []).forEach(keepHop);
  for (const change of proposal?.target === 'recipe' ? proposal.changes : []) {
    if (change.path === 'hops' && Array.isArray(change.value)) change.value.forEach(keepHop);
    if (/^hops\.\d+\.hopVarietyId$/.test(change.path) && change.value) varieties.add(change.value);
    if (/^hops\.\d+\.hopLotId$/.test(change.path) && change.value) lots.add(change.value);
  }
  index.lots.filter(l => lots.has(l.id)).forEach(l => varieties.add(l.varietyId));
  return { ...context, hopIndex: {
    varieties: index.varieties.filter(v => varieties.has(v.id)).map(v => ({ id: v.id, name: v.name, aliases: [], form: v.form, analysis: [], descriptions: [] })),
    lots: index.lots.filter(l => lots.has(l.id)).map(l => ({ id: l.id, name: l.name, varietyId: l.varietyId, form: l.form, referenceOnly: l.referenceOnly, analysis: [] })),
    knowledge: index.knowledge, predictions: [], tastings: [],
    truncated: [...index.truncated, 'Contexte de proposition : analyses et historique à recharger avant tout nouveau calcul.']
  } };
}
