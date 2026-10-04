import type { BrewerContext, BrewerReferenceRequest } from './companionTypes.js';

/** IDs from the actual recipe/structured tool input are dereferenced even when
 * a saved entry lies beyond the bounded overview. Text never chooses a collection. */
export function brewerToolReferenceHints(name: string, args: Record<string, unknown>, context: BrewerContext): BrewerReferenceRequest {
  const varieties = new Set<string>(), lots = new Set<string>(), knowledge = new Set<string>();
  const add = (set: Set<string>, value: unknown) => {
    if (typeof value === 'string' && value.length <= 200 && /^[\p{L}\p{N}_.:-]+$/u.test(value) && !/^\.{1,2}$|^__.*__$/.test(value)) set.add(value);
  };
  const visit = (value: unknown, depth = 0) => {
    if (depth > 14 || !value || typeof value !== 'object') return;
    if (Array.isArray(value)) { for (const item of value) visit(item, depth + 1); return; }
    for (const [key, child] of Object.entries(value)) {
      if (['varietyId', 'hopVarietyId', 'targetVarietyId', 'referenceVarietyId'].includes(key)) add(varieties, child);
      else if (['lotId', 'hopLotId'].includes(key)) add(lots, child);
      else if (['yeastId', 'hopIndexId', 'targetYeastId', 'referenceYeastId', 'guideId', 'modelId'].includes(key)) add(knowledge, child);
      if (child && typeof child === 'object') visit(child, depth + 1);
    }
  };
  visit(context.recipe); visit(args);
  if (name === 'lookup_hop_reference') add(varieties, args.query);
  if (name === 'lookup_yeast_reference' || name === 'lookup_style_reference') add(knowledge, args.query);
  for (const key of ['requestJson', 'inputJson']) {
    if (typeof args[key] !== 'string' || (args[key] as string).length > 200_000) continue;
    try { visit(JSON.parse(args[key] as string)); } catch { /* The tool's own validator reports malformed JSON. */ }
  }
  const index = context.hopIndex;
  const missing = (ids: Set<string>, rows: Array<{ id: string }> | undefined) => [...ids].filter(id => !rows?.some(row => row.id === id));
  return { varietyIds: missing(varieties, index?.varieties), lotIds: missing(lots, index?.lots), knowledgeIds: missing(knowledge, index?.knowledge) };
}

export function mergeBrewerReferenceSupplement(context: BrewerContext, extra: NonNullable<BrewerContext['hopIndex']>) {
  if (!context.hopIndex) { context.hopIndex = extra; return; }
  const merge = <T extends { id: string }>(base: T[], supplement: T[]) => [...new Map([...base, ...supplement].map(row => [row.id, row])).values()];
  context.hopIndex.varieties = merge(context.hopIndex.varieties, extra.varieties);
  context.hopIndex.lots = merge(context.hopIndex.lots, extra.lots);
  context.hopIndex.knowledge = merge(context.hopIndex.knowledge, extra.knowledge);
}
