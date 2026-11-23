import { readIngredientFermentationFacts, type IngredientFermentationFacts } from './ingredientFermentationFacts.js';
import {
  readYeastDocumentaryNotes,
  readYeastTechnicalFacts,
  readYeastTechnicalSelections,
  type YeastDocumentaryNotes,
  type YeastTechnicalFact,
  type YeastTechnicalSelections
} from './yeastTechnicalFacts.js';
import type { YeastCatalogue, YeastCatalogueFact } from './yeastCatalogueSchema.js';

export type YeastDocumentaryForm = 'sèche' | 'liquide' | 'levain';

/** Legacy documentary scalars only. Null means explicitly unknown; absence means no override. */
export interface YeastCandidateDocumentaryFields {
  lab?: string | null;
  strain?: string | null;
  form?: YeastDocumentaryForm | null;
  declaredAttenuationPct?: number | null;
  fermTempMinC?: number | null;
  fermTempMaxC?: number | null;
  flocculation?: string | null;
  alcoholTolerancePct?: number | null;
  fermentDays?: number | null;
  technicalSource?: string | null;
}

/** Body shared by candidate catalogue sheets and recipe/lot-local sheets. */
export interface YeastDocumentaryBody {
  documentary?: YeastCandidateDocumentaryFields;
  technicalFacts?: YeastTechnicalFact[];
  technicalSelections?: YeastTechnicalSelections;
  documentaryNotes?: YeastDocumentaryNotes;
  fermentationFacts?: IngredientFermentationFacts;
}

/** Durable documentary sheet accepted for one stable catalogue identity. */
export interface YeastDocumentarySheet extends YeastDocumentaryBody {
  version: 1;
  hopIndexId: string;
}

/** Stable identity for an observation, deliberately independent of its read date.
 * The audit keeps complete before/after values; this key only joins the sparse
 * personal overlay back to the immutable harvested fact it supersedes. */
export function yeastTechnicalFactIdentity(fact: YeastTechnicalFact): string {
  return JSON.stringify([
    fact.key, fact.reported, fact.range?.min ?? null, fact.range?.max ?? null,
    fact.unit ?? null, fact.qualifier ?? null, fact.context ?? null,
    fact.source ?? null, fact.sourceUrl ?? null
  ]);
}

/** Convert one untouched harvested observation without changing its wording,
 * bounds, units, context, citation, or retrieval date. */
export function harvestedYeastTechnicalFact(
  fact: YeastCatalogueFact,
  catalogue: YeastCatalogue
): YeastTechnicalFact {
  const sourceUrl = /^https?:\/\//i.test(fact.source.reference) ? fact.source.reference : undefined;
  const retrievedAt = sourceUrl
    ? catalogue.retrievals.find(retrieval => retrieval.url === sourceUrl)?.retrievedAt
    : undefined;
  return {
    key: fact.key,
    reported: fact.reported,
    origin: 'manufacturer',
    ...(fact.range ? { range: { ...fact.range }, unit: fact.unit, qualifier: fact.qualifier } : {}),
    source: fact.source.title,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(retrievedAt ? { retrievedAt } : {}),
    ...(fact.context ? { context: fact.context } : {})
  };
}

/** Documentary information scoped to its containing recipe/lot ingredient. */
export interface YeastLocalDocumentary extends YeastDocumentaryBody {
  version: 1;
}

const DOCUMENTARY_FIELDS = [
  'lab', 'strain', 'form', 'declaredAttenuationPct', 'fermTempMinC', 'fermTempMaxC',
  'flocculation', 'alcoholTolerancePct', 'fermentDays', 'technicalSource'
] as const;
const BODY_FIELDS = ['documentary', 'technicalFacts', 'technicalSelections', 'documentaryNotes', 'fermentationFacts'] as const;

/** Validate and copy the historical scalar section without flattening its nulls. */
export function readYeastCandidateDocumentaryFields(value: unknown): YeastCandidateDocumentaryFields | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !DOCUMENTARY_FIELDS.includes(key as typeof DOCUMENTARY_FIELDS[number]))) return undefined;
  const strings = ['lab', 'strain', 'flocculation', 'technicalSource'] as const;
  if (strings.some(key => row[key] !== undefined && row[key] !== null &&
      (typeof row[key] !== 'string' || !row[key].trim() || row[key].length > 2000)) ||
    row.form !== undefined && row.form !== null && !['sèche', 'liquide', 'levain'].includes(row.form as string)) return undefined;
  const bounds: Partial<Record<keyof YeastCandidateDocumentaryFields, readonly [number, number]>> = {
    declaredAttenuationPct: [0, 100], fermTempMinC: [-5, 60], fermTempMaxC: [-5, 60],
    alcoholTolerancePct: [0, 100], fermentDays: [0, Infinity]
  };
  for (const [key, [min, max]] of Object.entries(bounds) as [keyof YeastCandidateDocumentaryFields, readonly [number, number]][]) {
    const n = row[key];
    if (n !== undefined && n !== null && (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max)) return undefined;
  }
  if (typeof row.fermTempMinC === 'number' && typeof row.fermTempMaxC === 'number' && row.fermTempMinC > row.fermTempMaxC) return undefined;
  return Object.fromEntries(Object.entries(row)) as YeastCandidateDocumentaryFields;
}

/** Validate the shared body. Absent fields, nulls and empty lists remain distinct. */
export function readYeastDocumentaryBody(value: unknown): YeastDocumentaryBody | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !BODY_FIELDS.includes(key as typeof BODY_FIELDS[number]))) return undefined;
  const documentary = row.documentary === undefined ? undefined : readYeastCandidateDocumentaryFields(row.documentary);
  if (row.documentary !== undefined && !documentary) return undefined;
  const technicalFacts = row.technicalFacts === undefined ? undefined : readYeastTechnicalFacts(row.technicalFacts);
  if (row.technicalFacts !== undefined && !technicalFacts) return undefined;
  const technicalSelections = row.technicalSelections === undefined ? undefined : readYeastTechnicalSelections(row.technicalSelections);
  if (row.technicalSelections !== undefined && !technicalSelections) return undefined;
  const documentaryNotes = row.documentaryNotes === undefined ? undefined : readYeastDocumentaryNotes(row.documentaryNotes);
  if (row.documentaryNotes !== undefined && documentaryNotes === undefined) return undefined;
  const fermentationFacts = row.fermentationFacts === undefined ? undefined : readIngredientFermentationFacts(row.fermentationFacts);
  if (row.fermentationFacts !== undefined && !fermentationFacts) return undefined;

  return {
    ...(documentary !== undefined ? { documentary } : {}),
    ...(technicalFacts !== undefined ? { technicalFacts } : {}),
    ...(technicalSelections !== undefined ? { technicalSelections } : {}),
    ...(documentaryNotes !== undefined ? { documentaryNotes } : {}),
    ...(fermentationFacts !== undefined ? { fermentationFacts } : {})
  };
}

/**
 * Strictly validate the versioned, identity-bound catalogue transport.
 * Optional fields stay optional; explicit nulls and empty lists stay as supplied.
 */
export function readYeastDocumentarySheet(value: unknown, expectedHopIndexId?: string): YeastDocumentarySheet | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !['version', 'hopIndexId', ...BODY_FIELDS].includes(key)) || row.version !== 1 ||
      typeof row.hopIndexId !== 'string' || !row.hopIndexId.trim() || row.hopIndexId !== row.hopIndexId.trim() ||
      row.hopIndexId.length > 200 || expectedHopIndexId !== undefined && row.hopIndexId !== expectedHopIndexId) return undefined;
  const body = readYeastDocumentaryBody(Object.fromEntries(BODY_FIELDS.filter(key => Object.prototype.hasOwnProperty.call(row, key)).map(key => [key, row[key]])));
  if (!body) return undefined;
  return { version: 1, hopIndexId: row.hopIndexId, ...body };
}

/** Validate the same documentary body without assigning a catalogue identity. */
export function readYeastLocalDocumentary(value: unknown): YeastLocalDocumentary | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !['version', ...BODY_FIELDS].includes(key)) || row.version !== 1) return undefined;
  const body = readYeastDocumentaryBody(Object.fromEntries(BODY_FIELDS.filter(key => Object.prototype.hasOwnProperty.call(row, key)).map(key => [key, row[key]])));
  return body ? { version: 1, ...body } : undefined;
}
