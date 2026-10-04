import {
  HOP_ANALYTES, HOP_FORMS, HOP_UNITS, assertHopDocument, hopMeasurementError,
  type HopMeasurement, type HopRange, type HopVariety
} from './hopIndexSchema.js';
import { assertHopKnowledge, type HopKnowledge, type HopYeast } from './hopPredictionSchema.js';
import { assertBrewingStyleGuide, type BrewingStyle, type BrewingStyleGuide, type BrewingStyleGuideRevision } from './brewingStyleSchema.js';
import {
  assertBrewerCatalogueClaim, assertBrewerCatalogueCommand, assertBrewerCatalogueMeta, assertBrewerCatalogueUnmapped,
  readBrewerCatalogueHopDescriptionClaim,
  type BrewerCatalogueClaim, type BrewerCatalogueCommand, type BrewerCatalogueCorrectionLink,
  type BrewerCatalogueCreateEntity, type BrewerCatalogueEntity, type BrewerCatalogueEpistemic,
  type BrewerCatalogueExecutionMeta, type BrewerCatalogueJson, type BrewerCatalogueKind,
  type BrewerCatalogueMeta, type BrewerCatalogueProjectionChoice, type BrewerCatalogueProjectionDecision,
  type BrewerCatalogueUnmappedValue, normalizeBrewerCatalogueIdentity
} from './brewerCatalogueSchema.js';
import {
  readYeastDocumentarySheet, type YeastDocumentarySheet
} from './yeastDocumentarySheet.js';
import {
  readYeastTechnicalFacts, readYeastTechnicalSelections, type YeastTechnicalFact,
  type YeastTechnicalSelectionKey
} from './yeastTechnicalFacts.js';
import { YEAST_FACT_KEYS, type YeastFactKey } from './yeastCatalogueSchema.js';

export type BrewerCatalogueApplyResult =
  | { status: 'applied'; record: BrewerCatalogueEntity; projection: BrewerCatalogueProjection }
  | { status: 'conflict' | 'invalid'; reason: string };

export interface BrewerCatalogueScenarioInput {
  decision: BrewerCatalogueProjectionDecision;
  claim: BrewerCatalogueClaim;
}
export interface BrewerCatalogueProjection {
  record: BrewerCatalogueEntity;
  kind: BrewerCatalogueKind;
  id: string;
  revision: number;
  fingerprint?: string;
  /** Raw source claims remain available regardless of projection. */
  claims: BrewerCatalogueClaim[];
  unmapped: BrewerCatalogueUnmappedValue[];
  activeLegacyClaims: Array<{ targetField: string; claim: BrewerCatalogueClaim; decision: BrewerCatalogueProjectionDecision }>;
  scenarioInputs: BrewerCatalogueScenarioInput[];
  searchTerms: string[];
}

class CatalogueConflict extends Error {}
const plain = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const idOk = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.length <= 120 &&
  !value.includes('/') && !/^\.{1,2}$|^__.*__$/.test(value);
const validDate = (value: unknown): value is string => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) && Number.isFinite(Date.parse(value));
const sha256 = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const clone = <T>(value: T): T => structuredClone(value);
const canonical = (value: unknown): string => JSON.stringify(sortJson(value));
function sortJson(value: any, root = true): any {
  if (Array.isArray(value)) return value.map(child => sortJson(child, false));
  if (!plain(value)) return value;
  const entries = Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return Object.fromEntries(entries.map(([key, child]) => {
    if (key === 'catalogueMeta' && root && plain(child)) {
      const meta = { ...child };
      delete meta.fingerprint;
      return [key, sortJson(meta, false)];
    }
    return [key, sortJson(child, false)];
  }));
}

function kindOf(record: unknown): BrewerCatalogueKind | undefined {
  if (!plain(record)) return undefined;
  if (record.kind === 'yeast') return 'yeastStrain';
  if (record.kind === 'styleGuide') return 'brewingStyle';
  if (typeof record.id === 'string' && Array.isArray(record.aliases) && Array.isArray(record.analysis) && Array.isArray(record.descriptions)) return 'hopVariety';
  return undefined;
}

function assertEntity(record: unknown): asserts record is BrewerCatalogueEntity {
  const kind = kindOf(record);
  if (!kind) throw Error('Identité de catalogue non prise en charge.');
  if (kind === 'hopVariety') assertHopDocument('hopVarieties', record);
  else assertHopKnowledge(record);
  const meta = (record as any).catalogueMeta;
  if (meta !== undefined) assertBrewerCatalogueMeta(meta, kind);
}

function initialMeta(kind: BrewerCatalogueKind, revision: number, claims: BrewerCatalogueClaim[], unmapped: BrewerCatalogueUnmappedValue[]): BrewerCatalogueMeta {
  return { schemaVersion: 1, entityKind: kind, revision, claims, unmapped, projections: [], corrections: [], identityResolutions: [] };
}

function addById<T extends { id: string }>(existing: T[], incoming: T[], encode: (value: T) => string, label: string): T[] {
  const result = [...existing], indices = new Map(result.map((value, index) => [value.id, index]));
  for (const value of incoming) {
    const index = indices.get(value.id);
    if (index === undefined) { indices.set(value.id, result.length); result.push(clone(value)); continue; }
    if (encode(result[index]) !== encode(value)) throw new CatalogueConflict(`${label} ${value.id} existe avec un contenu différent.`);
  }
  return result;
}

function sourceUrl(claim: BrewerCatalogueClaim): string | undefined {
  return /^https?:\/\//i.test(claim.source.reference) ? claim.source.reference : undefined;
}
function yeastOrigin(claim: BrewerCatalogueClaim): YeastTechnicalFact['origin'] {
  if (claim.source.kind === 'manufacturer' || claim.source.kind === 'coa') return 'manufacturer';
  if (claim.source.kind === 'observation') return 'personal';
  return 'ai';
}
function yeastFactFromClaim(claim: BrewerCatalogueClaim, key: YeastFactKey): YeastTechnicalFact {
  const normalized = claim.normalized;
  const context = claim.context === undefined ? undefined : typeof claim.context === 'string' ? claim.context : JSON.stringify(claim.context);
  if (!normalized) throw Error('Une projection levure exige une valeur structurée.');
  if (normalized.kind === 'category' || normalized.kind === 'text') {
    return { key, reported: claim.reported, origin: yeastOrigin(claim), source: claim.source.title,
      ...(sourceUrl(claim) ? { sourceUrl: sourceUrl(claim) } : {}), ...(claim.dates.retrievedAt ? { retrievedAt: claim.dates.retrievedAt } : {}), ...(context ? { context } : {}) };
  }
  if (normalized.kind === 'point') return {
    key, reported: claim.reported, range: { min: normalized.value, max: normalized.value }, unit: normalized.unit,
    qualifier: yeastQualifier(normalized.qualifier, 'reportedPoint'), origin: yeastOrigin(claim), source: claim.source.title,
    ...(sourceUrl(claim) ? { sourceUrl: sourceUrl(claim) } : {}), ...(claim.dates.retrievedAt ? { retrievedAt: claim.dates.retrievedAt } : {}), ...(context ? { context } : {})
  };
  if (normalized.kind === 'range') return {
    key, reported: claim.reported, range: { min: normalized.min, max: normalized.max }, unit: normalized.unit,
    qualifier: yeastQualifier(normalized.qualifier, 'range'), origin: yeastOrigin(claim), source: claim.source.title,
    ...(sourceUrl(claim) ? { sourceUrl: sourceUrl(claim) } : {}), ...(claim.dates.retrievedAt ? { retrievedAt: claim.dates.retrievedAt } : {}), ...(context ? { context } : {})
  };
  throw Error('Une borne stricte ne peut pas être projetée dans cette sélection de levure.');
}
function yeastQualifier(value: string | undefined, fallback: NonNullable<YeastTechnicalFact['qualifier']>): NonNullable<YeastTechnicalFact['qualifier']> {
  const accepted = ['range', 'reportedPoint', 'atLeast', 'upTo', 'greaterThan', 'lessThan'];
  const selected = value ?? fallback;
  if (!accepted.includes(selected)) throw Error('Le qualificatif ne peut pas être projeté dans une sélection de levure.');
  return selected as NonNullable<YeastTechnicalFact['qualifier']>;
}

function normalizedPointOrRange(claim: BrewerCatalogueClaim): HopMeasurement {
  const normalized = claim.normalized;
  if (!normalized || normalized.kind === 'category' || normalized.kind === 'text' || !claim.confidence) throw Error('Projection HOP exige une plage/valeur structurée et sa confiance déclarée.');
  const common = { analyte: '' as HopMeasurement['analyte'], unit: normalized.unit as HopMeasurement['unit'], basis: (normalized.basis ?? 'unknown') as HopMeasurement['basis'],
    source: claim.source, confidence: claim.confidence, ...(claim.method ? { method: claim.method } : {}), note: claim.reported };
  if (normalized.kind === 'point') return { ...common, kind: 'point', value: normalized.value };
  if (normalized.kind === 'range') return { ...common, kind: 'range', range: { min: normalized.min, max: normalized.max } };
  if ((normalized.operator === '<' || normalized.operator === '<=') && normalized.limitKind) {
    return { ...common, kind: 'below', limit: normalized.value, limitKind: normalized.limitKind };
  }
  throw Error('Cette borne n’a pas de représentation analytique HOP compatible.');
}

function activeDecision(decisions: BrewerCatalogueProjectionDecision[], targetField: string) {
  const rows = decisions.filter(decision => decision.targetField === targetField);
  const superseded = new Set(rows.map(decision => decision.supersedesProjectionId).filter((id): id is string => !!id));
  return [...rows].reverse().find(decision => !superseded.has(decision.id));
}

function styleGuideSnapshot(guide: BrewingStyleGuide): BrewingStyleGuideRevision {
  return {
    version: guide.version, edition: guide.edition, enabled: guide.enabled, retrievedAt: guide.retrievedAt,
    ...(guide.createdAt ? { createdAt: guide.createdAt } : {}), attribution: guide.attribution,
    source: clone(guide.source), styles: clone(guide.styles)
  };
}

function aliasFromClaim(claim: BrewerCatalogueClaim): string {
  if (claim.property !== 'identity.alias' && !/\.identity\.alias$/.test(claim.property)) throw Error('Une projection d’alias exige une assertion identity.alias.');
  const value = claim.normalized && (claim.normalized.kind === 'category' || claim.normalized.kind === 'text') ? claim.normalized.value : undefined;
  if (typeof value !== 'string' || !value.trim() || normalizeBrewerCatalogueIdentity(value) === '') throw Error('Un alias projeté exige le libellé exact dans normalized.value.');
  return value.trim();
}
function appendAlias(values: string[], alias: string): string[] {
  const normalized = normalizeBrewerCatalogueIdentity(alias);
  return values.some(value => normalizeBrewerCatalogueIdentity(value) === normalized) ? values : [...values, alias];
}
function appendOnlyProjection(targetField: string, mode: BrewerCatalogueProjectionChoice['mode'] = 'legacy'): boolean {
  return targetField === 'identity.alias' || /^styles\.[A-Za-z0-9._-]+\.aliases$/.test(targetField) ||
    targetField === 'hop.description' && mode === 'legacy';
}

function allowedLegacyProjection(entity: BrewerCatalogueEntity, claim: BrewerCatalogueClaim, targetField: string): { entity: BrewerCatalogueEntity; previousValue?: unknown } {
  if (['estimate', 'hypothesis', 'modelOutput'].includes(claim.epistemic)) throw Error('Une estimation ou hypothèse ne se promeut pas dans un fait de catalogue. Choisir mode=scenario.');
  if (targetField === 'hop.description' && 'aliases' in entity) {
    const description = readBrewerCatalogueHopDescriptionClaim(claim);
    const row = clone(entity) as HopVariety;
    const key = canonical([description.text, description.context, description.source]);
    const alreadyPresent = row.descriptions.some(existing => canonical([existing.text, existing.context, existing.source]) === key);
    if (!alreadyPresent) row.descriptions = [...row.descriptions, description];
    assertHopDocument('hopVarieties', row);
    return { entity: row as BrewerCatalogueEntity };
  }
  if (targetField === 'identity.alias' && claim.scope === 'identity') {
    const alias = aliasFromClaim(claim);
    if ('aliases' in entity) {
      const row = clone(entity) as HopVariety;
      row.aliases = appendAlias(row.aliases, alias);
      assertHopDocument('hopVarieties', row);
      return { entity: row as BrewerCatalogueEntity };
    }
    if ('kind' in entity && entity.kind === 'yeast') {
      // Persist only the claim/projection link. Read adapters derive the exact
      // alias from that link so the text and provenance cannot drift apart.
      return { entity: clone(entity) };
    }
    throw Error('Alias d’identité non pris en charge pour ce type de catalogue.');
  }
  if (targetField === 'form' && 'aliases' in entity) {
    const value = claim.normalized;
    if (claim.scope !== 'variety' || claim.property !== 'hop.form' || !value || (value.kind !== 'category' && value.kind !== 'text') ||
        !HOP_FORMS.includes(value.value as any) || value.value === 'unknown') throw Error('Projection de forme HOP exige une forme connue et sourcée de la référence variété.');
    const row = { ...clone(entity), form: value.value as HopVariety['form'] };
    assertHopDocument('hopVarieties', row);
    return { entity: row as BrewerCatalogueEntity, previousValue: entity.form };
  }
  if (targetField === 'betaLyase' && 'kind' in entity && entity.kind === 'yeast') {
    const value = claim.normalized;
    if (claim.scope !== 'strain' || claim.property !== 'yeast.betaLyase' || !value || value.kind !== 'category' ||
        !['positive', 'negative', 'unknown'].includes(value.value)) throw Error('Projection β-lyase exige un état catégoriel sourcé de la souche.');
    const row: HopYeast = { ...clone(entity), betaLyase: value.value as HopYeast['betaLyase'] };
    assertHopKnowledge(row);
    return { entity: row, previousValue: entity.betaLyase };
  }
  const styleAlias = /^styles\.([A-Za-z0-9._-]+)\.aliases$/.exec(targetField);
  if (styleAlias && 'kind' in entity && entity.kind === 'styleGuide' && ['style', `style:${styleAlias[1]}`].includes(claim.scope) &&
      claim.property === `style.${styleAlias[1]}.identity.alias`) {
    const alias = aliasFromClaim(claim), row = clone(entity) as BrewingStyleGuide;
    const style = row.styles.find(item => item.id === styleAlias[1]);
    if (!style) throw Error('Le style cible de l’alias n’existe pas.');
    style.aliases = appendAlias(style.aliases, alias);
    assertBrewingStyleGuide(row);
    return { entity: row };
  }
  if ('aliases' in entity) {
    const match = /^analysis\.([A-Za-z0-9]+)$/.exec(targetField);
    if (!match || !HOP_ANALYTES.includes(match[1] as any) || claim.scope !== 'variety' ||
        !['hop.', 'analysis.'].some(prefix => claim.property === `${prefix}${match[1]}`) || !claim.confidence) throw Error('Projection HOP hors des analytes calculables ou incomplète.');
    const measurement = normalizedPointOrRange(claim) as HopMeasurement;
    const next: HopMeasurement = { ...measurement, analyte: match[1] as HopMeasurement['analyte'] };
    const error = hopMeasurementError(next);
    if (error) throw Error(`Mesure HOP projetée incompatible : ${error}`);
    const row = clone(entity) as HopVariety;
    const previousValue = row.analysis.find(old => old.analyte === next.analyte);
    row.analysis = [...row.analysis.filter(old => old.analyte !== next.analyte), next];
    assertHopDocument('hopVarieties', row);
    return { entity: row as BrewerCatalogueEntity, ...(previousValue ? { previousValue } : {}) };
  }
  if ('kind' in entity && entity.kind === 'yeast') {
    const match = /^reviewedDocumentary\.technicalSelections\.(temperature|attenuation|alcoholTolerance|flocculation)$/.exec(targetField);
    if (!match || !YEAST_FACT_KEYS.includes(match[1] as any) || claim.scope !== 'strain' || !['yeast.', 'yeast.technical.'].some(prefix => claim.property === `${prefix}${match[1]}`)) throw Error('Projection levure hors des sélections calculables.');
    const key = match[1] as YeastTechnicalSelectionKey;
    const fact = yeastFactFromClaim(claim, key as YeastFactKey);
    const technicalFact = readYeastTechnicalFacts([fact])?.[0];
    if (!technicalFact) throw Error('Le fait projeté ne respecte pas le schéma documentaire levure.');
    const currentSheet = entity.reviewedDocumentary ? readYeastDocumentarySheet(entity.reviewedDocumentary, entity.id) : undefined;
    if (entity.reviewedDocumentary && !currentSheet) throw Error('La feuille documentaire existante est invalide.');
    const base: YeastDocumentarySheet = currentSheet ?? { version: 1, hopIndexId: entity.id };
    const oldFact = base.technicalSelections?.[key];
    const selections = readYeastTechnicalSelections({ ...base.technicalSelections, [key]: technicalFact });
    if (!selections) throw Error('La sélection technique levure n’est pas compatible avec sa clé.');
    const facts = readYeastTechnicalFacts([...(base.technicalFacts ?? []), technicalFact]);
    if (!facts) throw Error('Le fait technique levure ne peut pas être conservé.');
    const row: HopYeast = {
      ...clone(entity),
      reviewedDocumentary: { ...base, technicalFacts: facts, technicalSelections: selections },
      reviewedDocumentaryRevision: { revision: (entity.reviewedDocumentaryRevision?.revision ?? 0) + 1,
        replacements: clone(entity.reviewedDocumentaryRevision?.replacements ?? []) }
    };
    assertHopKnowledge(row);
    return { entity: row, ...(oldFact ? { previousValue: oldFact } : {}) };
  }
  if ('kind' in entity && entity.kind === 'styleGuide') {
    const match = /^styles\.([A-Za-z0-9._-]+)\.stats\.(og|fg|abv|ibu|srm)$/.exec(targetField);
    if (!match || !['style', `style:${match[1]}`].includes(claim.scope) ||
        claim.property !== `style.${match[1]}.stats.${match[2]}` ||
        !claim.normalized || claim.normalized.kind !== 'range') throw Error('Projection de style exige une plage sourcée pour une statistique connue.');
    const units: Record<string, string[]> = { og: ['SG', 'sg'], fg: ['SG', 'sg'], abv: ['% vol', '%vol'], ibu: ['IBU'], srm: ['SRM'] };
    if (!units[match[2]].includes(claim.normalized.unit)) throw Error('Unité incompatible avec cette statistique de style.');
    const row = clone(entity) as BrewingStyleGuide;
    const style = row.styles.find(item => item.id === match[1]);
    if (!style) throw Error('Le style cible n’existe pas dans ce guide.');
    const previous = style.stats[match[2] as keyof typeof style.stats] ?? null;
    style.stats = { ...style.stats, [match[2]]: { min: claim.normalized.min, max: claim.normalized.max } };
    assertBrewingStyleGuide(row);
    return { entity: row, ...(previous ? { previousValue: previous } : {}) };
  }
  throw Error('Type de catalogue non compatible avec une projection legacy.');
}

function activeScenarioInputs(entity: BrewerCatalogueEntity): BrewerCatalogueScenarioInput[] {
  const meta = entity.catalogueMeta;
  if (!meta) return [];
  const claims = new Map(meta.claims.map(claim => [claim.id, claim]));
  const fields = [...new Set(meta.projections.filter(decision => decision.mode === 'scenario').map(decision => decision.targetField))];
  return fields.flatMap(targetField => {
    const decision = activeDecision(meta.projections.filter(row => row.mode === 'scenario'), targetField);
    const claim = decision && claims.get(decision.claimId);
    return decision && claim ? [{ decision, claim }] : [];
  });
}

function searchableTerms(entity: BrewerCatalogueEntity): string[] {
  const terms: string[] = [];
  if ('aliases' in entity) terms.push(entity.name, ...entity.aliases, entity.origin ?? '', ...entity.descriptions.map(item => item.text));
  else if ('kind' in entity && entity.kind === 'yeast') terms.push(entity.name, entity.catalogue?.manufacturer ?? '', entity.catalogue?.productCode ?? '', ...(entity.catalogue?.aliases ?? []),
    ...(entity.catalogue?.categories ?? []), ...(entity.catalogue?.facts ?? []).map(fact => fact.reported));
  else for (const style of entity.styles) terms.push(entity.name, style.name, style.code, ...style.aliases);
  for (const claim of entity.catalogueMeta?.claims ?? []) terms.push(claim.property, claim.label ?? '', claim.reported, ...(claim.normalized && 'value' in claim.normalized ? [String(claim.normalized.value)] : []));
  for (const row of entity.catalogueMeta?.unmapped ?? []) terms.push(row.sourcePath, typeof row.rawValue === 'string' ? row.rawValue : JSON.stringify(row.rawValue));
  return [...new Set(terms.map(value => value.trim()).filter(Boolean))];
}

/** Read projection consumed by lookup/calculation adapters. Assertions stay
 * attached to the record; only explicitly selected supported claims are legacy inputs. */
export function projectBrewerCatalogueEntity(
  entity: BrewerCatalogueEntity,
  choices: BrewerCatalogueProjectionChoice[] = [],
  recordedAt?: string
): BrewerCatalogueProjection {
  assertEntity(entity);
  let record = clone(entity);
  for (const choice of choices) {
    if (!validDate(recordedAt)) throw Error('La projection choisie exige une date d’enregistrement distincte.');
    const meta = record.catalogueMeta;
    if (!meta) throw Error('L’identité doit être versionnée avant toute projection.');
    const claim = meta.claims.find(item => item.id === choice.claimId);
    if (!claim) throw Error(`Assertion ${choice.claimId} absente de cette identité.`);
    const priorDecision = meta.projections.find(item => item.id === choice.id);
    if (priorDecision) {
      const same = priorDecision.claimId === choice.claimId && priorDecision.targetField === choice.targetField && priorDecision.mode === choice.mode && priorDecision.reason === choice.reason && priorDecision.supersedesProjectionId === choice.supersedesProjectionId;
      if (!same) throw new CatalogueConflict(`Projection ${choice.id} existe avec un autre choix.`);
      continue;
    }
    const appendOnly = appendOnlyProjection(choice.targetField, choice.mode);
    if (appendOnly && choice.supersedesProjectionId) throw Error('Une projection append-only s’ajoute; elle ne remplace aucune valeur antérieure.');
    const active = appendOnly ? undefined : activeDecision(meta.projections.filter(item => item.mode === choice.mode), choice.targetField);
    if (active && choice.supersedesProjectionId !== active.id) throw new CatalogueConflict(`La projection ${choice.targetField} a changé; citer ${active.id} pour la remplacer.`);
    if (!active && choice.supersedesProjectionId) throw new CatalogueConflict('La projection à remplacer n’est plus active.');
    if (choice.mode === 'scenario') {
      meta.projections.push({ ...clone(choice), recordedAt });
      continue;
    }
    if (['estimate', 'hypothesis', 'modelOutput'].includes(claim.epistemic)) throw Error('Une estimation ou hypothèse ne se promeut pas dans un fait de catalogue. Choisir mode=scenario.');
    const previousRecord = clone(record);
    const projected = allowedLegacyProjection(record, claim, choice.targetField);
    record = projected.entity;
    const previousValue = projected.previousValue ?? getLegacyTarget(previousRecord, choice.targetField);
    if (record.catalogueMeta) record.catalogueMeta.projections.push({ ...clone(choice), recordedAt,
      ...(active ? { supersedesProjectionId: active.id } : {}), ...(previousValue !== undefined && previousValue !== null ? { previousValue: clone(previousValue) as BrewerCatalogueJson } : {}) });
  }
  assertEntity(record);
  const kind = kindOf(record)!;
  return {
    record, kind, id: record.id, revision: record.catalogueMeta?.revision ?? 0, fingerprint: record.catalogueMeta?.fingerprint,
    claims: clone(record.catalogueMeta?.claims ?? []), unmapped: clone(record.catalogueMeta?.unmapped ?? []),
    activeLegacyClaims: activeProjectionRows(record), scenarioInputs: activeScenarioInputs(record), searchTerms: searchableTerms(record)
  };
}

function getLegacyTarget(entity: BrewerCatalogueEntity, target: string): unknown {
  if ('aliases' in entity) {
    if (target === 'form') return entity.form;
    const match = /^analysis\.([A-Za-z0-9]+)$/.exec(target);
    return match ? entity.analysis.find(row => row.analyte === match[1]) : undefined;
  }
  if ('kind' in entity && entity.kind === 'styleGuide') {
    const match = /^styles\.([A-Za-z0-9._-]+)\.stats\.(og|fg|abv|ibu|srm)$/.exec(target);
    return match ? entity.styles.find(style => style.id === match[1])?.stats[match[2] as keyof BrewingStyle['stats']] : undefined;
  }
  if ('kind' in entity && entity.kind === 'yeast') {
    if (target === 'betaLyase') return entity.betaLyase;
    const match = /^reviewedDocumentary\.technicalSelections\.(temperature|attenuation|alcoholTolerance|flocculation)$/.exec(target);
    return match ? entity.reviewedDocumentary?.technicalSelections?.[match[1] as YeastTechnicalSelectionKey] : undefined;
  }
  return undefined;
}

function activeProjectionRows(entity: BrewerCatalogueEntity) {
  const meta = entity.catalogueMeta;
  if (!meta) return [];
  const claims = new Map(meta.claims.map(claim => [claim.id, claim]));
  const fields = [...new Set(meta.projections.filter(decision => decision.mode === 'legacy').map(decision => decision.targetField))];
  return fields.flatMap(targetField => {
    const rows = meta.projections.filter(row => row.mode === 'legacy' && row.targetField === targetField);
    const decisions = appendOnlyProjection(targetField, 'legacy') ? rows : [activeDecision(rows, targetField)].filter((row): row is BrewerCatalogueProjectionDecision => !!row);
    return decisions.flatMap(decision => { const claim = claims.get(decision.claimId); return claim ? [{ targetField, claim, decision }] : []; });
  });
}

/** Pure reducer. The provider allocates IDs and computes both canonical hashes. */
export function applyBrewerCatalogueCommand(
  current: BrewerCatalogueEntity | null,
  command: BrewerCatalogueCommand,
  execution: BrewerCatalogueExecutionMeta
): BrewerCatalogueApplyResult {
  try {
    assertBrewerCatalogueCommand(command);
    if (!validDate(execution.recordedAt)) throw Error('Horodatage de commande invalide.');
    let record: BrewerCatalogueEntity;
    if (command.operation === 'create') {
      if (current !== null) throw new CatalogueConflict('L’identité catalogue existe déjà; aucun remplacement n’est autorisé.');
      if (!idOk(execution.allocatedId)) throw Error('Le provider doit attribuer l’ID de catalogue avant la réduction.');
      if (execution.identityCheckComplete !== true) throw new CatalogueConflict('L’absence doit être vérifiée par un scan complet et une réservation transactionnelle des clés.');
      const candidates = execution.identityCandidates ?? [];
      if (candidates.some(candidate => candidate.kind !== command.entity.kind || !idOk(candidate.id) || !sha256(candidate.fingerprint) ||
          candidate.styleId !== undefined && (!idOk(candidate.styleId) || candidate.kind !== 'brewingStyle')) ||
          new Set(candidates.map(candidate => `${candidate.kind}:${candidate.id}:${candidate.styleId ?? ''}`)).size !== candidates.length) throw Error('Liste de candidats d’identité fournie par le provider invalide.');
      if (candidates.length) {
        const resolution = command.identityResolution;
        if (!resolution) throw new CatalogueConflict(`Des identités homonymes ou alias exacts existent (${candidates.map(candidate => candidate.id).join(', ')}); relire puis distinguer explicitement ou enrichir.`);
        const byKey = (rows: typeof candidates) => [...rows].map(row => `${row.kind}:${row.id}:${row.styleId ?? ''}:${row.fingerprint.toLowerCase()}`).sort();
        if (canonical(byKey(candidates)) !== canonical(byKey(resolution.candidates))) throw new CatalogueConflict('La décision de création distincte ne couvre pas exactement les candidats actuels.');
      } else if (command.identityResolution) throw new CatalogueConflict('Les candidats à distinguer ont disparu; relire avant de créer.');
      const value = clone(command.entity.value) as any;
      if (command.entity.kind === 'hopVariety') {
        if (value.form !== 'unknown') throw Error('Une variété créée sans lot garde sa forme inconnue; la forme de produit appartient au lot.');
        if (Array.isArray(value.analysis) && value.analysis.length) throw Error('Créer les analyses HOP à partir de claims sourcés et de projectionChoices explicites; aucun HopMeasurement direct au create.');
        if (Array.isArray(value.aliases) && value.aliases.length) throw Error('Créer les alias HOP via des claims identity.alias projetés, pour lier chaque alias à sa provenance.');
        record = { ...value, id: execution.allocatedId } as HopVariety;
      } else if (command.entity.kind === 'yeastStrain') {
        if (value.betaLyase !== 'unknown') throw Error('Créer la β-lyase en unknown puis sélectionner un claim sourcé par projection explicite.');
        if (value.reviewedDocumentary !== undefined || value.reviewedDocumentaryRevision !== undefined) throw Error('Créer les feuilles YEAST par claims après attribution de l’ID, pas avec un overlay prélié.');
        if (Array.isArray(value.catalogue?.aliases) && value.catalogue.aliases.length) throw Error('Créer les alias YEAST via des claims identity.alias projetés, pour lier chaque alias à sa provenance.');
        record = { ...value, id: execution.allocatedId, kind: 'yeast' } as HopYeast;
      }
      else {
        const styleRows = value.styles as Array<Omit<BrewingStyle, 'id'>>;
        if (styleRows.some(style => Array.isArray(style.aliases) && style.aliases.length)) throw Error('Créer les alias STYLE après attribution des IDs, via des claims alias projetés avec leur source.');
        const ids = execution.allocatedStyleIds;
        if (!ids || ids.length !== styleRows.length || ids.some(id => !idOk(id)) || new Set(ids).size !== ids.length) throw Error('Le provider doit attribuer chaque ID de style dans l’ordre du guide.');
        const styles = styleRows.map((style, index) => ({ ...style, id: ids[index] }));
        record = { ...value, id: execution.allocatedId, styles } as BrewingStyleGuide;
      }
      const kind = command.entity.kind;
      record.catalogueMeta = initialMeta(kind, 1, clone(command.claims), clone(command.unmapped));
      if (command.identityResolution) record.catalogueMeta.identityResolutions.push({ ...clone(command.identityResolution), recordedAt: execution.recordedAt });
    } else {
      if (!current) throw new CatalogueConflict('L’identité cible n’existe plus; relire avant toute écriture.');
      assertEntity(current);
      if (kindOf(current) !== command.target.kind || current.id !== command.target.id) throw new CatalogueConflict('La cible ne correspond pas à l’identité lue.');
      if (!sha256(execution.currentFingerprint) || execution.currentFingerprint !== command.target.expectedFingerprint) throw new CatalogueConflict('L’empreinte complète a changé depuis la lecture.');
      const revision = current.catalogueMeta?.revision ?? 0;
      if (revision !== command.target.expectedRevision) throw new CatalogueConflict('La révision catalogue a changé depuis la lecture.');
      if (command.target.kind === 'brewingStyle') {
        const guide = current as BrewingStyleGuide;
        if (!command.target.styleId || !guide.styles.some(style => style.id === command.target.styleId)) throw new CatalogueConflict('Le style cible est absent du guide.');
        if (command.target.nextVersion === guide.version || guide.history?.some(history => history.version === command.target.nextVersion)) throw new CatalogueConflict('La nouvelle version de style existe déjà.');
      }
      const kind = kindOf(current)!;
      const meta: BrewerCatalogueMeta = current.catalogueMeta ? clone(current.catalogueMeta) : initialMeta(kind, 0, [], []);
      const priorClaims = [...meta.claims];
      meta.claims = addById<BrewerCatalogueClaim>(meta.claims, command.claims, canonical, 'Assertion');
      meta.unmapped = addById<BrewerCatalogueUnmappedValue>(meta.unmapped, command.unmapped, canonical, 'Valeur non projetée');
      if (command.operation === 'reviewedCorrection') {
        const oldIds = new Set(priorClaims.map(claim => claim.id)), newIds = new Set(command.claims.map(claim => claim.id));
        for (const replacement of command.replacements) {
          if (!oldIds.has(replacement.oldClaimId) || !newIds.has(replacement.newClaimId)) throw Error('Une correction doit lier une assertion existante à une nouvelle assertion de cette commande.');
          const exists = meta.corrections.some(row => row.oldClaimId === replacement.oldClaimId && row.newClaimId === replacement.newClaimId);
          if (!exists) meta.corrections.push({ ...clone(replacement), recordedAt: execution.recordedAt });
        }
      }
      meta.entityKind = kind;
      meta.schemaVersion = 1;
      meta.revision = revision + 1;
      delete meta.fingerprint;
      record = { ...clone(current), catalogueMeta: meta } as BrewerCatalogueEntity;
      if (command.target.kind === 'brewingStyle') {
        const guide = record as BrewingStyleGuide;
        guide.history = [...(guide.history ?? []), styleGuideSnapshot(current as BrewingStyleGuide)];
        guide.version = command.target.nextVersion!;
      }
    }
    assertEntity(record);
    const projection = projectBrewerCatalogueEntity(record, command.projectionChoices, execution.recordedAt);
    return { status: 'applied', record: projection.record, projection };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Commande de catalogue invalide.';
    return { status: error instanceof CatalogueConflict ? 'conflict' : 'invalid', reason };
  }
}

/** Canonical digest input. Provider hashes this text with SHA-256, then stamps it. */
export function canonicalBrewerCatalogueFingerprintInput(entity: BrewerCatalogueEntity): string {
  assertEntity(entity);
  const value = clone(entity) as any;
  if (value.catalogueMeta) delete value.catalogueMeta.fingerprint;
  return canonical(value);
}

export function stampBrewerCatalogueFingerprint<T extends BrewerCatalogueEntity>(entity: T, fingerprint: string): T {
  if (!sha256(fingerprint)) throw Error('Empreinte catalogue SHA-256 invalide.');
  const result = clone(entity) as T;
  if (!result.catalogueMeta) throw Error('Une révision catalogue manque avant scellement.');
  result.catalogueMeta.fingerprint = fingerprint.toLowerCase();
  assertEntity(result);
  return result;
}
