import { YEAST_FACT_KEYS, YEAST_FACT_QUALIFIERS, type YeastFactKey, type YeastFactQualifier } from './yeastCatalogueSchema.js';
export type { YeastFactQualifier } from './yeastCatalogueSchema.js';

export const YEAST_TECHNICAL_SELECTION_KEYS = ['temperature', 'attenuation', 'alcoholTolerance', 'flocculation'] as const;
export type YeastTechnicalSelectionKey = typeof YEAST_TECHNICAL_SELECTION_KEYS[number];

/** A reported observation. These values are never fitted model coefficients. */
export interface YeastTechnicalFact {
  key: YeastFactKey;
  reported: string;
  range?: { min: number; max: number };
  unit?: string;
  qualifier?: YeastFactQualifier;
  origin: 'manufacturer' | 'personal' | 'ai';
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  context?: string;
}

export type YeastTechnicalSelections = Partial<Record<YeastTechnicalSelectionKey, YeastTechnicalFact | null>>;

/** A reading keeps the source's distinction instead of flattening every number to a point. */
export type YeastFactValue =
  | { kind: 'range'; min: number; max: number; qualifier: 'range' }
  | { kind: 'point'; value: number; qualifier: 'reportedPoint' }
  | { kind: 'bound'; value: number; qualifier: 'atLeast' | 'upTo' | 'greaterThan' | 'lessThan'; operator: '≥' | '≤' | '>' | '<' }
  | { kind: 'category'; value: string }
  | { kind: 'unknown' };

/** The normalized value and its verbatim documentary context/provenance. */
export interface YeastFactReading {
  value: YeastFactValue;
  key?: YeastFactKey;
  reported?: string;
  unit?: string;
  context?: string;
  origin?: YeastTechnicalFact['origin'];
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
}

/** Narrative product information, kept apart from measurable/qualitative facts. */
export interface YeastDocumentaryNote {
  text: string;
  origin: YeastTechnicalFact['origin'];
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  context?: string;
}
export type YeastDocumentaryNotes = YeastDocumentaryNote[] | null;

const text = (value: unknown, max = 2000): value is string =>
  typeof value === 'string' && !!value.trim() && value.length <= max;

/** Equivalent volume-percent labels; retain the original unit in the dossier. */
export const alcoholPercentUnit = (unit: string | undefined) => typeof unit === 'string' &&
  /^%(?:vol\.?|v\/v|abv)?$/i.test(unit.replace(/\s/g, ''));

/** Recover the operator from older records whose parser incorrectly stored `>` as `atLeast`. */
function reportedQualifier(reported: string): YeastFactQualifier | undefined {
  const operator = /^\s*[^0-9<>≥≤]{0,120}(>=|<=|>|≥|<|≤)\s*[+-]?\d/.exec(reported)?.[1];
  if (!operator) return undefined;
  if (operator === '>') return 'greaterThan';
  if (operator === '<') return 'lessThan';
  if (operator === '>=' || operator === '≥') return 'atLeast';
  return 'upTo';
}

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
      // `reported` is the retained source wording. It corrects legacy parser
      // records that flattened a strict sign into an inclusive qualifier.
      const qualifier = reportedQualifier(fact.reported) ?? fact.qualifier;
      if (!Number.isFinite(min) || !Number.isFinite(max) || min > max ||
        !text(fact.unit, 40) || !YEAST_FACT_QUALIFIERS.includes(qualifier) ||
        (qualifier !== 'range' && min !== max) ||
        ((fact.unit === '%' || fact.key === 'alcoholTolerance' && alcoholPercentUnit(fact.unit)) && (min < 0 || max > 100))) return undefined;
      result.push({
        key: fact.key, reported: fact.reported, origin: fact.origin,
        range: { min, max }, unit: fact.unit, qualifier,
        ...(fact.source !== undefined ? { source: fact.source } : {}),
        ...(fact.sourceUrl !== undefined ? { sourceUrl: fact.sourceUrl } : {}),
        ...(fact.retrievedAt !== undefined ? { retrievedAt: fact.retrievedAt } : {}),
        ...(fact.context !== undefined ? { context: fact.context } : {})
      });
      continue;
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

/** Return a discriminated reading; malformed or absent data stays explicitly unknown. */
export function readYeastFactValue(value: unknown): YeastFactReading {
  const fact = readYeastTechnicalFacts([value])?.[0];
  if (!fact) return { value: { kind: 'unknown' } };
  let reading: YeastFactValue;
  if (!fact.range || !fact.qualifier) reading = { kind: 'category', value: fact.reported };
  else if (fact.qualifier === 'range') reading = { kind: 'range', min: fact.range.min, max: fact.range.max, qualifier: 'range' };
  else if (fact.qualifier === 'reportedPoint') reading = { kind: 'point', value: fact.range.min, qualifier: 'reportedPoint' };
  else {
    const operator = fact.qualifier === 'greaterThan' ? '>' : fact.qualifier === 'lessThan' ? '<'
      : fact.qualifier === 'atLeast' ? '≥' : '≤';
    reading = { kind: 'bound', value: fact.range.min, qualifier: fact.qualifier, operator };
  }
  return {
    value: reading, key: fact.key, reported: fact.reported,
    ...(fact.unit !== undefined ? { unit: fact.unit } : {}),
    ...(fact.context !== undefined ? { context: fact.context } : {}),
    origin: fact.origin,
    ...(fact.source !== undefined ? { source: fact.source } : {}),
    ...(fact.sourceUrl !== undefined ? { sourceUrl: fact.sourceUrl } : {}),
    ...(fact.retrievedAt !== undefined ? { retrievedAt: fact.retrievedAt } : {})
  };
}

/** Validate accepted observations separately from the raw observation list. */
export function readYeastTechnicalSelections(value: unknown): YeastTechnicalSelections | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    Object.keys(value).some(key => !YEAST_TECHNICAL_SELECTION_KEYS.includes(key as YeastTechnicalSelectionKey))) return undefined;
  const result: YeastTechnicalSelections = {};
  for (const [key, selected] of Object.entries(value) as [YeastTechnicalSelectionKey, unknown][]) {
    if (selected === null) { result[key] = null; continue; }
    const fact = readYeastTechnicalFacts([selected])?.[0];
    if (!fact || fact.key !== key) return undefined;
    const reading = readYeastFactValue(fact);
    if (key === 'flocculation' ? reading.value.kind !== 'category' : reading.value.kind === 'category' || reading.value.kind === 'unknown') return undefined;
    if (key === 'temperature' && fact.unit !== '°C' || key === 'attenuation' && fact.unit !== '%' ||
      key === 'alcoholTolerance' && !alcoholPercentUnit(fact.unit)) return undefined;
    result[key] = fact;
  }
  return result;
}

/** Read notes without conflating a missing property, explicit unknown, and an intentionally cleared list. */
export function readYeastDocumentaryNotes(value: unknown): YeastDocumentaryNotes | undefined {
  if (value === null) return null;
  if (!Array.isArray(value)) return undefined;
  const result: YeastDocumentaryNote[] = [];
  for (const note of value) {
    if (!note || typeof note !== 'object' || Array.isArray(note) ||
      Object.keys(note).some(key => !['text', 'origin', 'source', 'sourceUrl', 'retrievedAt', 'context'].includes(key)) ||
      typeof note.text !== 'string' || !note.text.trim() || !['manufacturer', 'personal', 'ai'].includes(note.origin)) return undefined;
    for (const key of ['source', 'retrievedAt', 'context'])
      if (note[key] !== undefined && !text(note[key])) return undefined;
    if (note.sourceUrl !== undefined) {
      if (!text(note.sourceUrl)) return undefined;
      try { if (!['http:', 'https:'].includes(new URL(note.sourceUrl).protocol)) return undefined; }
      catch { return undefined; }
    }
    if (note.retrievedAt !== undefined && !Number.isFinite(Date.parse(note.retrievedAt))) return undefined;
    result.push({ text: note.text, origin: note.origin,
      ...(note.source !== undefined ? { source: note.source } : {}),
      ...(note.sourceUrl !== undefined ? { sourceUrl: note.sourceUrl } : {}),
      ...(note.retrievedAt !== undefined ? { retrievedAt: note.retrievedAt } : {}),
      ...(note.context !== undefined ? { context: note.context } : {}) });
  }
  return [...new Map(result.map(note => [JSON.stringify(note), note])).values()];
}
