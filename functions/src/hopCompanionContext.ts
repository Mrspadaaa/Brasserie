import type { BrewerContext, BrewerProposal } from './companionTypes.js';
import { yeastCompanionSummary } from './yeastCompanion.js';
type Index = NonNullable<BrewerContext['hopIndex']>;
/** Keep the complete catalogue in tool memory, not duplicated in every model prompt. */
export function hopIndexOverview(index: Index | undefined) {
  if (!index) return null;
  const relevant = new Set(index.lots.map(l => l.varietyId));
  index.knowledge.forEach(k => { if (k.kind === 'model') relevant.add(k.scope.varietyId); });
  const varieties = index.varieties.filter(v => relevant.has(v.id)).slice(0, 40);
  const yeasts = index.knowledge.filter(k => k.kind === 'yeast');
  const yeastPreview = new Set(yeasts.slice(0, 20).map(k => k.id));
  return {
    instruction: 'Aperçu documentaire. lookup_hop_reference donne les COA ; lookup_yeast_reference recherche toutes les levures, même absentes de cet aperçu ; fermentation_advice donne les conduites et limites sourcées. predict_hop_aroma calcule le triplet complet. Ne pas calculer depuis cet aperçu. Un lot referenceOnly est un échantillon publié.',
    yeastCatalogue: { references: yeasts.length, manufacturers: [...new Set(yeasts.map(y => y.catalogue?.manufacturer).filter(Boolean))], omittedFromOverview: Math.max(0, yeasts.length - yeastPreview.size) },
    catalogue: { references: index.varieties.length, sources: [...new Set(index.varieties.map(v => v.analysis?.[0]?.source?.author ?? v.descriptions?.[0]?.source?.author).filter(Boolean))], omittedFromOverview: index.varieties.length - varieties.length },
    varieties: varieties.map(v => ({ id: v.id, name: v.name, aliases: v.aliases, origin: v.origin, form: v.form, source: v.analysis?.[0]?.source?.author ?? v.descriptions?.[0]?.source?.author, archived: v.archived })),
    lots: index.lots.map(l => ({ id: l.id, varietyId: l.varietyId, name: l.name, lotNumber: l.lotNumber, harvestYear: l.harvestYear, growingRegion: l.growingRegion, grower: l.grower, storageNotes: l.storageNotes, referenceOnly: l.referenceOnly, form: l.form, archived: l.archived })),
    knowledge: index.knowledge.filter(k => k.kind !== 'yeast' || yeastPreview.has(k.id)).map(k => k.kind === 'yeast' ? {
      id: k.id, kind: k.kind, name: k.name, form: k.form, source: k.source,
      instruction: 'Identité seulement ; consulter lookup_yeast_reference pour caractéristiques, contradictions et provenance.'
    } : k.kind === 'styleGuide' ? {
      id: k.id, kind: k.kind, name: k.name, version: k.version, edition: k.edition, enabled: k.enabled,
      source: k.source, styleCount: k.styles.length,
      instruction: 'Référentiel de styles partagé avec le formulaire. Une ambiguïté exige un choix explicite ; ne pas imposer les statistiques à une variante personnelle.'
    } : k.kind === 'noloScience' ? {
      id: k.id, kind: k.kind, name: k.name, version: k.version, enabled: k.enabled, source: k.source,
      strains: k.strains.map(s => ({ yeastId: s.yeastId, name: s.name })),
      instruction: 'Calculer avec calculate_recipe ou fermentation_advice. Sucres partiels, analyses datées, supports et resucrage restent distincts. Aucun coefficient sensoriel alcoolisé transféré au NOLO.'
    } : k.kind === 'fermentationScience' ? {
      id: k.id, kind: k.kind, name: k.name, version: k.version, enabled: k.enabled,
      goals: k.goals, compounds: k.compounds.map(c => ({ id: c.id, name: c.name, family: c.family })),
      instruction: 'Utiliser fermentation_advice. Leviers qualitatifs et calculs de conduite, sans intensité inventée. Étude DM303 locale, aucun transfert automatique à la recette.'
    } : k.kind === 'fermentation' ? {
      id: k.id, kind: k.kind, name: k.name, version: k.version, enabled: k.enabled, yeastId: k.yeastId, styles: k.styles,
      goals: k.plans.map(p => p.goal), instruction: 'Programme complet et sources via fermentation_advice.'
    } : k.kind === 'extrapolation' ? {
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
  if (context.workspace?.finance) {
    // Finance is already calculated and bounded; don't send another 500-row stock copy.
    // The original context remains intact for inspect_brewery and other read-only tools.
    const inventory = (context.inventory ?? []).slice(0, 12).map((item: any) => ({ id: item.id, name: String(item.name ?? '').slice(0, 100), unit: item.unit, currentStock: item.currentStock }));
    return { ...context,
      workspace: { ...context.workspace, records: {} },
      inventory, material: context.workspace.finance.equipment?.records ?? [], waterSources: [],
      provenance: [...(context.provenance ?? []), `Aperçu de stock limité à ${inventory.length} sur ${context.inventory?.length ?? 0} articles chargés ; outils de lecture inchangés. Le résumé financier indique séparément ses limites de lecture. Les périodes absentes sont inconnues.`] };
  }
  return { ...context, yeastContext: yeastCompanionSummary(context.recipe, context.hopIndex?.knowledge),
    ...(context.hopIndex ? { hopIndex: hopIndexOverview(context.hopIndex) } : {}) };
}
/** Proposal replay needs identities and definitions, not a copy of every catalogue COA. */
export function brewerContextForStorage(context: BrewerContext, proposal?: BrewerProposal): BrewerContext {
  const index = context.hopIndex;
  if (!index) return context;
  const varieties = new Set<string>(), lots = new Set<string>(), yeasts = new Set<string>();
  if (context.recipe?.yeast?.hopIndexId) yeasts.add(context.recipe.yeast.hopIndexId);
  const keepHop = (hop: any) => { if (hop?.hopVarietyId) varieties.add(hop.hopVarietyId); if (hop?.hopLotId) lots.add(hop.hopLotId); };
  (context.recipe?.hops ?? []).forEach(keepHop);
  for (const change of proposal?.target === 'recipe' ? proposal.changes : []) {
    if (change.path === 'yeast.hopIndexId' && change.value) yeasts.add(change.value);
    if (change.path === 'yeast' && change.value?.hopIndexId) yeasts.add(change.value.hopIndexId);
    if (change.path === 'hops' && Array.isArray(change.value)) change.value.forEach(keepHop);
    if (/^hops\.\d+\.hopVarietyId$/.test(change.path) && change.value) varieties.add(change.value);
    if (/^hops\.\d+\.hopLotId$/.test(change.path) && change.value) lots.add(change.value);
  }
  index.lots.filter(l => lots.has(l.id)).forEach(l => varieties.add(l.varietyId));
  return { ...context, hopIndex: {
    varieties: index.varieties.filter(v => varieties.has(v.id)).map(v => ({ id: v.id, name: v.name, aliases: [], form: v.form, analysis: [], descriptions: [] })),
    lots: index.lots.filter(l => lots.has(l.id)).map(l => ({ id: l.id, name: l.name, varietyId: l.varietyId, form: l.form, referenceOnly: l.referenceOnly, analysis: [] })),
    knowledge: index.knowledge.filter(k => k.kind !== 'styleGuide' && (k.kind !== 'yeast' || yeasts.has(k.id))).map(k => {
      if (k.kind !== 'yeast') return k;
      const { catalogue: _catalogue, ...identity } = k; return identity;
    }), predictions: [], tastings: [],
    truncated: [...index.truncated, 'Contexte de proposition : analyses et historique à recharger avant tout nouveau calcul.']
  } };
}
