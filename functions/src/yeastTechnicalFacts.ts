import { YEAST_FACT_KEYS, type YeastFactKey } from './yeastCatalogueSchema.js';

/** A reported observation. These values are never fitted model coefficients. */
export interface YeastTechnicalFact {
  key: YeastFactKey;
  reported: string;
  range?: { min: number; max: number };
  unit?: string;
  qualifier?: 'range' | 'reportedPoint' | 'atLeast' | 'upTo';
  origin: 'manufacturer' | 'personal' | 'ai';
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  context?: string;
}

const text = (value: unknown, max = 2000): value is string =>
  typeof value === 'string' && !!value.trim() && value.length <= max;

/** Validate the whole transport so an invalid bound is never silently narrowed. */
export function readYeastTechnicalFacts(value: unknown): YeastTechnicalFact[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: YeastTechnicalFact[] = [];
  for (const fact of value) {
    if (!fact || typeof fact !== 'object' || Array.isArray(fact) ||
      !YEAST_FACT_KEYS.includes(fact.key) || !text(fact.reported) ||
      !['manufacturer', 'personal', 'ai'].includes(fact.origin)) return undefined;
    for (const key of ['source', 'sourceUrl', 'retrievedAt', 'context'])
      if (fact[key] !== undefined && !text(fact[key])) return undefined;
    if (fact.sourceUrl !== undefined) {
      try { if (!['http:', 'https:'].includes(new URL(fact.sourceUrl).protocol)) return undefined; }
      catch { return undefined; }
    }
    if (fact.retrievedAt !== undefined && !Number.isFinite(Date.parse(fact.retrievedAt))) return undefined;
    if (fact.range !== undefined) {
      const { min, max } = fact.range ?? {};
      if (!Number.isFinite(min) || !Number.isFinite(max) || min > max ||
        !text(fact.unit, 40) || !['range', 'reportedPoint', 'atLeast', 'upTo'].includes(fact.qualifier) ||
        (fact.qualifier !== 'range' && min !== max) ||
        (fact.unit === '%' && (min < 0 || max > 100))) return undefined;
    } else if (fact.unit !== undefined || fact.qualifier !== undefined) return undefined;
    result.push({
      key: fact.key, reported: fact.reported, origin: fact.origin,
      ...(fact.range !== undefined ? { range: { min: fact.range.min, max: fact.range.max }, unit: fact.unit, qualifier: fact.qualifier } : {}),
      ...(fact.source !== undefined ? { source: fact.source } : {}),
      ...(fact.sourceUrl !== undefined ? { sourceUrl: fact.sourceUrl } : {}),
      ...(fact.retrievedAt !== undefined ? { retrievedAt: fact.retrievedAt } : {}),
      ...(fact.context !== undefined ? { context: fact.context } : {})
    });
  }
  return result;
}
