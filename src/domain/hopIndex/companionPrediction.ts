import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopRecipePrediction } from '../../../functions/src/hopRecipePrediction';

type ReferencedSources<T> = T extends HopSource ? { sourceRef: string }
  : T extends HopSource[] ? { sourceSetRef: string }
  : T extends readonly (infer V)[] ? ReferencedSources<V>[]
  : T extends object ? { [K in keyof T]: K extends 'reasons' ? { reasonSetRef: string } : ReferencedSources<T[K]> } : T;
export type HopRecipeCompanionEvidence = ReferencedSources<HopRecipePrediction> & {
  sourceDictionary: Record<string, HopSource>; sourceSets: Record<string, string[]>; reasonSets: Record<string, string[]>;
};

/** Lossless tool representation. The same sources/reasons recur on every axis and addition;
 * retaining them once keeps both the model prompt and stored conversation bounded.
 * Calculation/snapshot formats and every numerical value remain unchanged. */
export function compactHopEvidence<T>(prediction: T): ReferencedSources<T> & {
  sourceDictionary: Record<string, HopSource>; sourceSets: Record<string, string[]>; reasonSets: Record<string, string[]>;
} {
  const isSource = (value: any): value is HopSource => !!value && typeof value === 'object' && !Array.isArray(value)
    && typeof value.title === 'string' && typeof value.author === 'string' && typeof value.reference === 'string'
    && (value.year === null || typeof value.year === 'number') && typeof value.kind === 'string';
  const sourceDictionary: Record<string, HopSource> = {}, ids = new Map<string, string>();
  const sourceSets: Record<string, string[]> = {}, setIds = new Map<string, string>();
  const reasonSets: Record<string, string[]> = {}, reasonIds = new Map<string, string>();
  const reference = (source: HopSource) => {
    const key = JSON.stringify(source);
    let id = ids.get(key);
    if (!id) { id = `S${ids.size + 1}`; ids.set(key, id); sourceDictionary[id] = structuredClone(source); }
    return { sourceRef: id };
  };
  const references = (sources: HopSource[]) => {
    const members = sources.map(source => reference(source).sourceRef), key = JSON.stringify(members);
    let id = setIds.get(key);
    if (!id) { id = `G${setIds.size + 1}`; setIds.set(key, id); sourceSets[id] = members; }
    return { sourceSetRef: id };
  };
  const reasons = (entries: string[]) => {
    const key = JSON.stringify(entries);
    let id = reasonIds.get(key);
    if (!id) { id = `R${reasonIds.size + 1}`; reasonIds.set(key, id); reasonSets[id] = [...entries]; }
    return { reasonSetRef: id };
  };
  const compact = (value: any): any => {
    if (Array.isArray(value)) return value.map(compact);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key,
      key === 'sources' && Array.isArray(entry) && entry.every(isSource) ? references(entry)
        : key === 'source' && isSource(entry) ? reference(entry)
          : key === 'reasons' && Array.isArray(entry) && entry.every(item => typeof item === 'string') ? reasons(entry) : compact(entry)]));
  };
  return { ...compact(prediction), sourceDictionary, sourceSets, reasonSets };
}

export function compactHopRecipeEvidence(prediction: HopRecipePrediction): HopRecipeCompanionEvidence {
  return compactHopEvidence(prediction);
}
