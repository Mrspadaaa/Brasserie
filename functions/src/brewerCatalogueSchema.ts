import type { HopDescription, HopSource, HopVariety } from './hopIndexSchema.js';
import type { HopYeast } from './hopPredictionSchema.js';
import type { BrewingStyleGuide } from './brewingStyleSchema.js';

/** Stable catalogue identities exposed by the first mutation tranche. Lots,
 * commercial yeast products, offers and stock remain linked, separate records. */
export const BREWER_CATALOGUE_KINDS = ['hopVariety', 'yeastStrain', 'brewingStyle'] as const;
export type BrewerCatalogueKind = typeof BREWER_CATALOGUE_KINDS[number];
export type BrewerCatalogueEpistemic =
  | 'measured' | 'manufacturerClaim' | 'researchClaim' | 'personalObservation'
  | 'estimate' | 'hypothesis' | 'modelOutput';
export type BrewerCatalogueJson = null | boolean | number | string | BrewerCatalogueJson[] | { [key: string]: BrewerCatalogueJson };

export type BrewerCatalogueNormalized =
  | { kind: 'point'; value: number; unit: string; basis?: string; qualifier?: string }
  | { kind: 'range'; min: number; max: number; unit: string; basis?: string; qualifier?: string }
  | { kind: 'bound'; value: number; unit: string; operator: '>' | '>=' | '<' | '<='; limitKind?: 'lod' | 'loq'; basis?: string; qualifier?: string }
  | { kind: 'category'; value: string }
  | { kind: 'text'; value: string };

/** One source-specific assertion. Open `property` does not open a calculator's
 * analyte enum; normalization/projectability are checked separately. */
export interface BrewerCatalogueClaim {
  id: string;
  scope: string;
  property: string;
  label?: string;
  reported: string;
  rawValue?: BrewerCatalogueJson;
  normalized?: BrewerCatalogueNormalized;
  epistemic: BrewerCatalogueEpistemic;
  source: HopSource;
  dates: { publishedAt?: string; retrievedAt?: string; observedAt?: string; recordedAt: string };
  context?: BrewerCatalogueJson;
  dependsOn?: string[];
  conflictGroupId?: string;
  /** Required when a legacy HOP measurement projection is explicitly selected. */
  confidence?: 'low' | 'medium' | 'high';
  method?: string;
}

export interface BrewerCatalogueUnmappedValue {
  id: string;
  sourcePath: string;
  rawValue: BrewerCatalogueJson;
  source?: HopSource;
  recordedAt: string;
  reason: string;
}

/** Immutable decision log. A scenario choice never writes a claim into a
 * factual legacy field. `previousValue` preserves the value replaced by an
 * explicitly selected legacy projection. */
export interface BrewerCatalogueProjectionDecision {
  id: string;
  claimId: string;
  targetField: string;
  mode: 'legacy' | 'scenario';
  reason: string;
  recordedAt: string;
  supersedesProjectionId?: string;
  previousValue?: BrewerCatalogueJson;
}
export interface BrewerCatalogueProjectionChoice {
  id: string;
  claimId: string;
  targetField: string;
  mode: 'legacy' | 'scenario';
  reason: string;
  supersedesProjectionId?: string;
}
export interface BrewerCatalogueCorrectionLink {
  oldClaimId: string;
  newClaimId: string;
  reason: string;
  recordedAt: string;
}
export interface BrewerCatalogueIdentityCandidate {
  kind: BrewerCatalogueKind;
  id: string;
  fingerprint: string;
  styleId?: string;
}
export interface BrewerCatalogueIdentityResolution {
  decision: 'distinct';
  candidates: BrewerCatalogueIdentityCandidate[];
  reason: string;
  recordedAt: string;
}
export interface BrewerCatalogueMeta {
  schemaVersion: 1;
  entityKind: BrewerCatalogueKind;
  revision: number;
  /** SHA-256 of the canonical record with this property omitted; provider-set. */
  fingerprint?: string;
  claims: BrewerCatalogueClaim[];
  unmapped: BrewerCatalogueUnmappedValue[];
  projections: BrewerCatalogueProjectionDecision[];
  corrections: BrewerCatalogueCorrectionLink[];
  identityResolutions: BrewerCatalogueIdentityResolution[];
}

export type BrewerCatalogueEntity =
  | (HopVariety & { catalogueMeta?: BrewerCatalogueMeta })
  | (HopYeast & { catalogueMeta?: BrewerCatalogueMeta })
  | (BrewingStyleGuide & { catalogueMeta?: BrewerCatalogueMeta });

export type BrewerCatalogueCreateEntity =
  | { kind: 'hopVariety'; value: Omit<HopVariety, 'id' | 'catalogueMeta'> }
  | { kind: 'yeastStrain'; value: Omit<HopYeast, 'id' | 'catalogueMeta'> }
  | { kind: 'brewingStyle'; value: Omit<BrewingStyleGuide, 'id' | 'catalogueMeta' | 'history' | 'styles'> & { styles: Array<Omit<BrewingStyleGuide['styles'][number], 'id'>> } };

export interface BrewerCatalogueTarget {
  kind: BrewerCatalogueKind;
  id: string;
  expectedRevision: number;
  /** Provider-computed over the whole canonical document, including legacy fields. */
  expectedFingerprint: string;
  /** Required for editing a style nested inside a guide. */
  styleId?: string;
  /** Every style-guide document update gets a new immutable styleRef version. */
  nextVersion?: string;
}

export type BrewerCatalogueCommand =
  | {
      schemaVersion: 1; operationId: string; operation: 'create';
      entity: BrewerCatalogueCreateEntity;
      claims: BrewerCatalogueClaim[]; unmapped: BrewerCatalogueUnmappedValue[];
      projectionChoices: BrewerCatalogueProjectionChoice[];
      identityResolution?: Omit<BrewerCatalogueIdentityResolution, 'recordedAt'>;
    }
  | {
      schemaVersion: 1; operationId: string; operation: 'enrich';
      target: BrewerCatalogueTarget;
      claims: BrewerCatalogueClaim[]; unmapped: BrewerCatalogueUnmappedValue[];
      projectionChoices: BrewerCatalogueProjectionChoice[];
    }
  | {
      schemaVersion: 1; operationId: string; operation: 'reviewedCorrection';
      target: BrewerCatalogueTarget;
      claims: BrewerCatalogueClaim[]; unmapped: BrewerCatalogueUnmappedValue[];
      replacements: Array<{ oldClaimId: string; newClaimId: string; reason: string }>;
      projectionChoices: BrewerCatalogueProjectionChoice[];
    };

/** `create` has no catalogue ID. The authenticated provider allocates it once
 * and supplies it only to the reducer execution context. */
export interface BrewerCatalogueExecutionMeta {
  allocatedId?: string;
  /** IDs for id-less style rows, in the exact order supplied by create. */
  allocatedStyleIds?: string[];
  /** True only after an exhaustive same-kind scan and reservation-key lock. */
  identityCheckComplete?: boolean;
  /** Full exact homonym/alias matches returned by that provider scan. */
  identityCandidates?: BrewerCatalogueIdentityCandidate[];
  /** Recomputed by the provider from current full data, ignoring stored fingerprint. */
  currentFingerprint?: string | null;
  recordedAt: string;
}

export interface BrewerCatalogueCommandDescription {
  kind: BrewerCatalogueKind;
  schemaVersion: 1;
  identity: string;
  create: Record<string, unknown>;
  enrich: Record<string, unknown>;
  claimFields: string[];
  projectionTargets: string[];
  identityResolution: Record<string, unknown>;
  rules: string[];
  examples: { create: Record<string, unknown>; enrich: Record<string, unknown> };
  examplesAreFictional: true;
}

const sourceKinds = ['coa', 'manufacturer', 'research', 'review', 'observation', 'community', 'judgment'] as const;
const epistemics: readonly string[] = ['measured', 'manufacturerClaim', 'researchClaim', 'personalObservation', 'estimate', 'hypothesis', 'modelOutput'];
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
const plain = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max = 4000): value is string => typeof value === 'string' && !!value.trim() && value.length <= max;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const onlyKeys = (value: Record<string, unknown>, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));
const validId = (value: unknown) => text(value, 120) && !value.includes('/') && !/^\.{1,2}$|^__.*__$/.test(value);
const validOperationId = (value: unknown) => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
const validDate = (value: unknown) => typeof value === 'string' && value.length <= 40 &&
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) && Number.isFinite(Date.parse(value));
const validFingerprint = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);

function jsonValue(value: unknown, depth = 0, budget = { nodes: 0 }): value is BrewerCatalogueJson {
  budget.nodes++;
  if (budget.nodes > 10_000 || depth > 12) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 20_000;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 2_000 && value.every(child => jsonValue(child, depth + 1, budget));
  if (!plain(value)) return false;
  const keys = Object.keys(value);
  return keys.length <= 2_000 && keys.every(key => !forbiddenKeys.has(key) && key.length <= 200 && jsonValue(value[key], depth + 1, budget));
}

function validSource(value: unknown): value is HopSource {
  return plain(value) && onlyKeys(value, ['title', 'author', 'year', 'kind', 'reference', 'locator']) &&
    text(value.title, 1000) && text(value.author, 1000) && text(value.reference, 4000) &&
    sourceKinds.includes(value.kind) && (value.year === null || Number.isInteger(value.year) && value.year >= 1) &&
    (value.locator === undefined || text(value.locator, 2000));
}

/** The one supported legacy view of a sensory variety claim. The complete
 * context, report, dates and citation remain in the claim; this is only the
 * exact HopVariety description row consumed by existing readers. */
export function readBrewerCatalogueHopDescriptionClaim(value: unknown): HopDescription {
  const sensoryContexts = ['rawHop', 'infusion', 'beer', 'unspecified'] as const;
  const factualEpistemics = ['measured', 'manufacturerClaim', 'researchClaim', 'personalObservation'] as const;
  if (!plain(value) || value.scope !== 'variety' || value.property !== 'hop.description' ||
      !plain(value.normalized) || value.normalized.kind !== 'text' || !text(value.normalized.value, 4000) ||
      !plain(value.context) || !sensoryContexts.includes(value.context.sensoryContext) ||
      !factualEpistemics.includes(value.epistemic) || !validSource(value.source)) {
    throw Error('La description HOP exige un claim variety/hop.description, un texte exact, un contexte sensoriel explicite, une source et une origine factuelle.');
  }
  return {
    text: value.normalized.value,
    context: value.context.sensoryContext,
    source: structuredClone(value.source)
  };
}

function assertNormalized(value: unknown): asserts value is BrewerCatalogueNormalized {
  if (!plain(value) || !['point', 'range', 'bound', 'category', 'text'].includes(value.kind)) throw Error('Valeur normalisée de catalogue invalide.');
  if (value.kind === 'point') {
    if (!onlyKeys(value, ['kind', 'value', 'unit', 'basis', 'qualifier']) || !finite(value.value) || !text(value.unit, 80)) throw Error('Point normalisé invalide.');
  } else if (value.kind === 'range') {
    if (!onlyKeys(value, ['kind', 'min', 'max', 'unit', 'basis', 'qualifier']) || !finite(value.min) || !finite(value.max) || value.min > value.max || !text(value.unit, 80)) throw Error('Plage normalisée invalide.');
  } else if (value.kind === 'bound') {
    if (!onlyKeys(value, ['kind', 'value', 'unit', 'operator', 'limitKind', 'basis', 'qualifier']) || !finite(value.value) || !text(value.unit, 80) || !['>', '>=', '<', '<='].includes(value.operator) ||
      value.limitKind !== undefined && !['lod', 'loq'].includes(value.limitKind)) throw Error('Borne normalisée invalide.');
  } else if (!onlyKeys(value, ['kind', 'value']) || !text(value.value, 4000)) throw Error('Valeur descriptive normalisée invalide.');
  if ('basis' in value && value.basis !== undefined && !text(value.basis, 120)) throw Error('Base de normalisation invalide.');
  if ('qualifier' in value && value.qualifier !== undefined && !text(value.qualifier, 120)) throw Error('Qualificatif de normalisation invalide.');
}

export function assertBrewerCatalogueClaim(value: unknown): asserts value is BrewerCatalogueClaim {
  if (!plain(value) || !onlyKeys(value, ['id', 'scope', 'property', 'label', 'reported', 'rawValue', 'normalized', 'epistemic', 'source', 'dates', 'context', 'dependsOn', 'conflictGroupId', 'confidence', 'method']) ||
      !validId(value.id) || !text(value.scope, 120) || !text(value.property, 200) ||
      value.label !== undefined && !text(value.label, 500) || !text(value.reported, 8000) ||
      !epistemics.includes(value.epistemic) || !validSource(value.source) ||
      value.rawValue !== undefined && !jsonValue(value.rawValue) || value.context !== undefined && !jsonValue(value.context) ||
      value.conflictGroupId !== undefined && !validId(value.conflictGroupId) ||
      value.dependsOn !== undefined && (!Array.isArray(value.dependsOn) || value.dependsOn.length > 500 || value.dependsOn.some((id: unknown) => !validId(id))) ||
      value.confidence !== undefined && !['low', 'medium', 'high'].includes(value.confidence) || value.method !== undefined && !text(value.method, 2000)) throw Error('Assertion de catalogue invalide.');
  if (!plain(value.dates) || !onlyKeys(value.dates, ['publishedAt', 'retrievedAt', 'observedAt', 'recordedAt']) || !validDate(value.dates.recordedAt) ||
      ['publishedAt', 'retrievedAt', 'observedAt'].some(key => value.dates[key] !== undefined && !validDate(value.dates[key]))) throw Error('Dates de provenance invalides.');
  if (value.normalized !== undefined) assertNormalized(value.normalized);
}

export function assertBrewerCatalogueUnmapped(value: unknown): asserts value is BrewerCatalogueUnmappedValue {
  if (!plain(value) || !onlyKeys(value, ['id', 'sourcePath', 'rawValue', 'source', 'recordedAt', 'reason']) ||
      !validId(value.id) || !text(value.sourcePath, 500) || !jsonValue(value.rawValue) ||
      value.source !== undefined && !validSource(value.source) || !validDate(value.recordedAt) || !text(value.reason, 2000)) throw Error('Valeur de catalogue non projetée invalide.');
}

function assertProjectionChoice(value: unknown): asserts value is BrewerCatalogueProjectionChoice {
  if (!plain(value) || !onlyKeys(value, ['id', 'claimId', 'targetField', 'mode', 'reason', 'supersedesProjectionId']) ||
      !validId(value.id) || !validId(value.claimId) || !text(value.targetField, 240) ||
      !['legacy', 'scenario'].includes(value.mode) || !text(value.reason, 2000) ||
      value.supersedesProjectionId !== undefined && !validId(value.supersedesProjectionId)) throw Error('Choix de projection invalide.');
  if (value.mode === 'legacy' && value.targetField === 'hop.description' && value.supersedesProjectionId !== undefined) {
    throw Error('Une projection de description HOP legacy s’ajoute sans remplacer de description antérieure.');
  }
}

function assertProjectionDecision(value: unknown): asserts value is BrewerCatalogueProjectionDecision {
  if (!plain(value) || !onlyKeys(value, ['id', 'claimId', 'targetField', 'mode', 'reason', 'recordedAt', 'supersedesProjectionId', 'previousValue']) ||
      !validDate(value.recordedAt) || value.previousValue !== undefined && !jsonValue(value.previousValue)) throw Error('Décision historique de projection invalide.');
  const { recordedAt: _recordedAt, previousValue: _previousValue, ...choice } = value;
  assertProjectionChoice(choice);
}

export function assertBrewerCatalogueMeta(value: unknown, expectedKind?: BrewerCatalogueKind): asserts value is BrewerCatalogueMeta {
  if (!plain(value) || !onlyKeys(value, ['schemaVersion', 'entityKind', 'revision', 'fingerprint', 'claims', 'unmapped', 'projections', 'corrections', 'identityResolutions']) ||
      value.schemaVersion !== 1 || !BREWER_CATALOGUE_KINDS.includes(value.entityKind) || expectedKind !== undefined && value.entityKind !== expectedKind ||
      !Number.isSafeInteger(value.revision) || value.revision < 1 ||
      value.fingerprint !== undefined && !validFingerprint(value.fingerprint) ||
      !Array.isArray(value.claims) || value.claims.length > 2_000 || !Array.isArray(value.unmapped) || value.unmapped.length > 1_000 ||
      !Array.isArray(value.projections) || value.projections.length > 2_000 || !Array.isArray(value.corrections) || value.corrections.length > 2_000 ||
      !Array.isArray(value.identityResolutions) || value.identityResolutions.length > 200) throw Error('Métadonnées de catalogue invalides.');
  const claimIds = new Set<string>();
  for (const claim of value.claims) {
    assertBrewerCatalogueClaim(claim);
    if (claimIds.has(claim.id)) throw Error('Identifiant d’assertion répété.');
    claimIds.add(claim.id);
  }
  for (const claim of value.claims) if (claim.dependsOn?.some((id: string) => !claimIds.has(id))) throw Error('Une dépendance d’assertion est absente.');
  const unmappedIds = new Set<string>();
  for (const row of value.unmapped) {
    assertBrewerCatalogueUnmapped(row);
    if (unmappedIds.has(row.id)) throw Error('Identifiant de champ non projeté répété.');
    unmappedIds.add(row.id);
  }
  const projectionIds = new Set<string>();
  for (const decision of value.projections) {
    assertProjectionDecision(decision);
    const claim = value.claims.find((row: BrewerCatalogueClaim) => row.id === decision.claimId) as BrewerCatalogueClaim | undefined;
    if (!claim || projectionIds.has(decision.id) || decision.supersedesProjectionId !== undefined && !projectionIds.has(decision.supersedesProjectionId)) throw Error('Historique de projection invalide.');
    if (decision.mode === 'legacy' && ['estimate', 'hypothesis', 'modelOutput'].includes(claim.epistemic)) throw Error('Une hypothèse ne peut pas être une projection legacy.');
    if (decision.targetField === 'identity.alias' &&
        (!['hopVariety', 'yeastStrain'].includes(value.entityKind) || claim.property !== 'identity.alias' ||
          !claim.normalized || !['category', 'text'].includes(claim.normalized.kind) || decision.supersedesProjectionId !== undefined)) throw Error('Projection d’alias HOP/YEAST invalide.');
    const styleAlias = /^styles\.([A-Za-z0-9._-]+)\.aliases$/.exec(decision.targetField);
    if (styleAlias && (value.entityKind !== 'brewingStyle' || claim.property !== `style.${styleAlias[1]}.identity.alias` ||
        !claim.normalized || !['category', 'text'].includes(claim.normalized.kind) || decision.supersedesProjectionId !== undefined)) throw Error('Projection d’alias STYLE invalide.');
    if (decision.mode === 'legacy' && decision.targetField === 'hop.description') {
      if (value.entityKind !== 'hopVariety' || decision.supersedesProjectionId !== undefined) throw Error('Projection de description HOP legacy invalide.');
      readBrewerCatalogueHopDescriptionClaim(claim);
    }
    projectionIds.add(decision.id);
  }
  const correctionIds = new Set<string>();
  for (const correction of value.corrections) {
    if (!plain(correction) || !onlyKeys(correction, ['oldClaimId', 'newClaimId', 'reason', 'recordedAt']) ||
        !claimIds.has(correction.oldClaimId) || !claimIds.has(correction.newClaimId) || correction.oldClaimId === correction.newClaimId ||
        !text(correction.reason, 2000) || !validDate(correction.recordedAt)) throw Error('Lien de correction de catalogue invalide.');
    const key = `${correction.oldClaimId}\0${correction.newClaimId}`;
    if (correctionIds.has(key)) throw Error('Lien de correction répété.');
    correctionIds.add(key);
  }
  for (const resolution of value.identityResolutions) {
    if (!plain(resolution) || !onlyKeys(resolution, ['decision', 'candidates', 'reason', 'recordedAt']) || resolution.decision !== 'distinct' ||
        !Array.isArray(resolution.candidates) || !resolution.candidates.length || resolution.candidates.length > 50 || !text(resolution.reason, 2000) || !validDate(resolution.recordedAt)) throw Error('Décision de résolution d’identité invalide.');
    const seen = new Set<string>();
    for (const candidate of resolution.candidates) {
      if (!plain(candidate) || !onlyKeys(candidate, ['kind', 'id', 'fingerprint', 'styleId']) || !BREWER_CATALOGUE_KINDS.includes(candidate.kind) || !validId(candidate.id) ||
          candidate.kind !== value.entityKind || !validFingerprint(candidate.fingerprint) || candidate.styleId !== undefined && (!validId(candidate.styleId) || candidate.kind !== 'brewingStyle')) throw Error('Candidat de collision d’identité invalide.');
      const key = `${candidate.kind}:${candidate.id}:${candidate.styleId ?? ''}`;
      if (seen.has(key)) throw Error('Candidat d’identité répété.');
      seen.add(key);
    }
  }
  const encoded = JSON.stringify(value);
  if (encoded.length > 450_000) throw Error('Métadonnées de catalogue trop volumineuses.');
}

function assertTarget(value: unknown): asserts value is BrewerCatalogueTarget {
  if (!plain(value) || !onlyKeys(value, ['kind', 'id', 'expectedRevision', 'expectedFingerprint', 'styleId', 'nextVersion']) ||
      !BREWER_CATALOGUE_KINDS.includes(value.kind) || !validId(value.id) || !Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0 ||
      !validFingerprint(value.expectedFingerprint) || value.styleId !== undefined && !validId(value.styleId) ||
      value.nextVersion !== undefined && !text(value.nextVersion, 120)) throw Error('Cible ou précondition de catalogue invalide.');
  if (value.kind === 'brewingStyle' && (!value.styleId || !value.nextVersion)) throw Error('Une mise à jour de guide de style exige un ID de style et une nouvelle version résolvable.');
  if (value.kind !== 'brewingStyle' && (value.styleId !== undefined || value.nextVersion !== undefined)) throw Error('Sous-identité réservée au catalogue de styles.');
}

export function assertBrewerCatalogueCommand(value: unknown): asserts value is BrewerCatalogueCommand {
  if (!plain(value) || value.schemaVersion !== 1 || !validOperationId(value.operationId) || !['create', 'enrich', 'reviewedCorrection'].includes(value.operation)) throw Error('Commande de catalogue invalide.');
  const common = ['schemaVersion', 'operationId', 'operation', 'claims', 'unmapped', 'projectionChoices'];
  const allowed = value.operation === 'create' ? [...common, 'entity', 'identityResolution'] : [...common, 'target', ...(value.operation === 'reviewedCorrection' ? ['replacements'] : [])];
  if (!onlyKeys(value, allowed) || !Array.isArray(value.claims) || value.claims.length > 500 || !Array.isArray(value.unmapped) || value.unmapped.length > 500 ||
      !Array.isArray(value.projectionChoices) || value.projectionChoices.length > 200) throw Error('Corps de commande de catalogue invalide.');
  for (const claim of value.claims) assertBrewerCatalogueClaim(claim);
  for (const row of value.unmapped) assertBrewerCatalogueUnmapped(row);
  for (const choice of value.projectionChoices) assertProjectionChoice(choice);
  if (value.operation === 'create') {
    if (!plain(value.entity) || !['hopVariety', 'yeastStrain', 'brewingStyle'].includes(value.entity.kind) || !plain(value.entity.value) ||
        Object.prototype.hasOwnProperty.call(value.entity.value, 'id') || Object.prototype.hasOwnProperty.call(value.entity.value, 'catalogueMeta') ||
        value.entity.kind === 'brewingStyle' && (Object.prototype.hasOwnProperty.call(value.entity.value, 'history') ||
          !Array.isArray(value.entity.value.styles) || value.entity.value.styles.some((style: any) => !plain(style) || Object.prototype.hasOwnProperty.call(style, 'id')))) throw Error('Création de catalogue sans identité fournie valide.');
    if (value.identityResolution !== undefined) {
      const resolution = value.identityResolution;
      if (!plain(resolution) || !onlyKeys(resolution, ['decision', 'candidates', 'reason']) || resolution.decision !== 'distinct' || !Array.isArray(resolution.candidates) ||
          !resolution.candidates.length || resolution.candidates.length > 50 || !text(resolution.reason, 2000)) throw Error('Une création homonyme doit expliquer explicitement sa distinction.');
      const seen = new Set<string>();
      for (const candidate of resolution.candidates) {
        if (!plain(candidate) || !onlyKeys(candidate, ['kind', 'id', 'fingerprint', 'styleId']) || !BREWER_CATALOGUE_KINDS.includes(candidate.kind) || !validId(candidate.id) ||
            candidate.kind !== value.entity.kind || !validFingerprint(candidate.fingerprint) || candidate.styleId !== undefined && (!validId(candidate.styleId) || candidate.kind !== 'brewingStyle')) throw Error('Candidat homonyme à distinguer invalide.');
        const key = `${candidate.kind}:${candidate.id}:${candidate.styleId ?? ''}`;
        if (seen.has(key)) throw Error('Candidat homonyme répété.');
        seen.add(key);
      }
    }
  } else {
    assertTarget(value.target);
    if (value.operation === 'reviewedCorrection') {
      if (!Array.isArray(value.replacements) || !value.replacements.length || value.replacements.length > 500) throw Error('Correction sans correspondances avant/après.');
      const newIds = new Set(value.claims.map((claim: BrewerCatalogueClaim) => claim.id));
      const before = new Set<string>(), after = new Set<string>();
      for (const replacement of value.replacements) {
        if (!plain(replacement) || !onlyKeys(replacement, ['oldClaimId', 'newClaimId', 'reason']) || !validId(replacement.oldClaimId) ||
            !validId(replacement.newClaimId) || replacement.oldClaimId === replacement.newClaimId || !newIds.has(replacement.newClaimId) ||
            !text(replacement.reason, 2000) || before.has(replacement.oldClaimId) || after.has(replacement.newClaimId)) throw Error('Correspondance de correction invalide.');
        before.add(replacement.oldClaimId); after.add(replacement.newClaimId);
      }
    }
  }
}

/** Query/collision identity only. This is stricter than descriptive search. */
export function normalizeBrewerCatalogueIdentity(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss')
    .toLocaleLowerCase('fr').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

/** Stable keys a transaction provider can reserve to serialize same-kind creates. */
export function brewerCatalogueIdentityKeys(
  value: BrewerCatalogueEntity | BrewerCatalogueCreateEntity,
  extraClaims: BrewerCatalogueClaim[] = [],
  extraProjections: BrewerCatalogueProjectionChoice[] = []
): string[] {
  const creating = plain(value) && 'kind' in value && 'value' in value;
  const kind: BrewerCatalogueKind = creating ? (value as BrewerCatalogueCreateEntity).kind :
    'kind' in (value as object)
      ? ((value as HopYeast | BrewingStyleGuide).kind === 'yeast' ? 'yeastStrain' : 'brewingStyle')
      : 'hopVariety';
  const row: any = creating ? (value as BrewerCatalogueCreateEntity).value : value;
  const values: unknown[] = [];
  if (kind === 'hopVariety') {
    values.push(row.name, ...(Array.isArray(row.aliases) ? row.aliases : []));
  } else if (kind === 'yeastStrain') {
    values.push(row.name, ...(row.catalogue?.aliases ?? []));
    if (row.catalogue?.manufacturer && row.catalogue?.productCode) values.push(`${row.catalogue.manufacturer} ${row.catalogue.productCode}`);
  } else {
    for (const style of row.styles ?? []) {
      values.push(style.name, ...(style.aliases ?? []));
      if (row.name && row.edition && style.code) values.push(`${row.name} ${row.edition} ${style.code}`);
    }
  }
  const claims = [...(row.catalogueMeta?.claims ?? []), ...extraClaims];
  const selectedAliasClaimIds = new Set([
    ...((row.catalogueMeta?.projections ?? []) as BrewerCatalogueProjectionDecision[]).filter((projection: BrewerCatalogueProjectionDecision) => projection.mode === 'legacy' &&
      (projection.targetField === 'identity.alias' || /^styles\.[A-Za-z0-9._-]+\.aliases$/.test(projection.targetField))).map((projection: BrewerCatalogueProjectionDecision) => projection.claimId),
    ...extraProjections.filter(projection => projection.mode === 'legacy' &&
      (projection.targetField === 'identity.alias' || /^styles\.[A-Za-z0-9._-]+\.aliases$/.test(projection.targetField))).map(projection => projection.claimId)
  ]);
  for (const claim of claims) {
    if (selectedAliasClaimIds.has(claim.id) && !['estimate', 'hypothesis', 'modelOutput'].includes(claim.epistemic) &&
        (claim.property === 'identity.alias' || claim.property.endsWith('.identity.alias')) &&
        claim.normalized && ['category', 'text'].includes(claim.normalized.kind)) values.push(claim.normalized.value);
  }
  return [...new Set(values.map(label => typeof label === 'string' ? normalizeBrewerCatalogueIdentity(label) : '')
    .filter(Boolean).map(key => `${kind}:${key}`))].sort();
}

const fictiveSource: HopSource = { title: 'Exemple fictif — aucune fiche consultée', author: 'Exemple de schéma', year: null, kind: 'judgment', reference: 'example://catalogue-not-a-real-source' };
const fictiveClaim = (property: string, reported: string): BrewerCatalogueClaim => ({
  id: 'example-claim-1', scope: 'identity', property, reported, epistemic: 'hypothesis', source: fictiveSource,
  dates: { recordedAt: '2026-10-01T12:00:00.000Z' }
});

/** Tool-facing contract: examples are deliberately fictitious and carry no real assay. */
export function describeBrewerCatalogueCommand(kind: BrewerCatalogueKind): BrewerCatalogueCommandDescription {
  if (!BREWER_CATALOGUE_KINDS.includes(kind)) throw Error('Type de catalogue inconnu.');
  const identity = kind === 'hopVariety' ? 'HopVariety.id' : kind === 'yeastStrain' ? 'HopYeast.id (HopKnowledge.kind=yeast)' : 'BrewingStyleGuide.id + style.id';
  const entityValue = kind === 'hopVariety'
    ? { name: 'Variété fictive', aliases: [], form: 'unknown', descriptions: [], analysis: [] }
    : kind === 'yeastStrain'
      ? { kind: 'yeast', name: 'Souche fictive', betaLyase: 'unknown', source: fictiveSource }
      : { kind: 'styleGuide', name: 'Guide fictif personnel', version: 'personal-v1', enabled: true, edition: 'Profil personnel', createdAt: '2026-10-01', retrievedAt: null,
          attribution: 'Exemple fictif — aucune édition réglementaire', source: fictiveSource,
          styles: [{ code: 'PERS', name: 'Style fictif', aliases: [], family: 'personnel', stats: {}, source: fictiveSource }] };
  const target = { kind, id: 'existing-example-id', expectedRevision: 1, expectedFingerprint: 'a'.repeat(64), ...(kind === 'brewingStyle' ? { styleId: 'style-fictif', nextVersion: 'personal-v2' } : {}) };
  const projectionTargets = kind === 'hopVariety' ? ['identity.alias', 'form', 'analysis.<HopAnalyte>', 'hop.description'] : kind === 'yeastStrain'
    ? ['identity.alias', 'betaLyase', 'reviewedDocumentary.technicalSelections.temperature|attenuation|alcoholTolerance|flocculation']
    : ['styles.<styleId>.aliases', 'styles.<styleId>.stats.og|fg|abv|ibu|srm'];
  const descriptionClaim: BrewerCatalogueClaim = {
    id: 'example-hop-description-claim', scope: 'variety', property: 'hop.description',
    label: 'Description sensorielle fictive', reported: 'Exemple fictif, sans source réelle ni dégustation effectuée.',
    normalized: { kind: 'text', value: 'Exemple floral fictif' }, epistemic: 'manufacturerClaim',
    source: { title: 'Référence fictive — aucune fiche consultée', author: 'Exemple de schéma', year: null,
      kind: 'manufacturer', reference: 'example://catalogue-not-a-real-source' },
    dates: { recordedAt: '2026-10-01T12:00:00.000Z' },
    context: { sensoryContext: 'rawHop', conditions: 'Exemple fictif uniquement' }
  };
  const enrichClaims = kind === 'hopVariety' ? [descriptionClaim] : [fictiveClaim('catalogue.example', 'Hypothèse fictive, à ne pas convertir en mesure.')];
  const enrichProjectionChoices = kind === 'hopVariety' ? [{ id: 'example-hop-description-projection', claimId: descriptionClaim.id,
    targetField: 'hop.description', mode: 'legacy' as const, reason: 'Exemple de choix descriptif fictif.' }] : [];
  return {
    kind, schemaVersion: 1, identity,
    create: { schemaVersion: 1, operationId: 'uuid-stable-on-retry', operation: 'create', entity: { kind, value: entityValue }, claims: [], unmapped: [], projectionChoices: [] },
    enrich: { schemaVersion: 1, operationId: 'uuid-stable-on-retry', operation: 'enrich', target, claims: [], unmapped: [], projectionChoices: [] },
    claimFields: ['id', 'scope', 'property', 'label?', 'reported', 'rawValue?', 'normalized?', 'epistemic', 'source', 'dates.recordedAt', 'context?', 'dependsOn?', 'conflictGroupId?', 'confidence?', 'method?'],
    projectionTargets,
    identityResolution: { optionalForCreate: true, requiredWhenProviderReturnsCandidates: true,
      shape: { decision: 'distinct', candidates: [{ kind, id: 'ID retourné par lookup', fingerprint: '<SHA-256 courant>', ...(kind === 'brewingStyle' ? { styleId: 'ID style retourné par lookup' } : {}) }], reason: 'Pourquoi les identités sont distinctes malgré le nom/alias commun.' } },
    rules: ['Create omet toute identité catalogue préalable; le provider attribue un ID.', 'Enrich exige ID, expectedRevision et expectedFingerprint courants.',
      'Les assertions concurrentes et les hypothèses sont conservées séparément; aucune mesure n’est écrasée par un ajout partiel.',
      'Une projection legacy est explicite et validée; les champs append-only gardent chaque décision, les autres champs conservent la valeur remplacée dans l’historique.',
      'Une estimation/hypothèse ne devient jamais une mesure; sélection scenario = entrée de scénario distincte.',
      ...(kind === 'hopVariety' ? ['Pour HOP, hop.description exige scope=variety, property=hop.description, normalized.kind=text, context.sensoryContext=rawHop|infusion|beer|unspecified et epistemic=measured|manufacturerClaim|researchClaim|personalObservation. normalized.value est copié exactement avec la source; reported, dates et contexte détaillé restent dans le claim. La projection legacy s’ajoute, sans supersedes; seule une description strictement identique (texte+contexte sensoriel+source) est dédupliquée. Tous les claims et toutes les décisions restent conservés.'] : []),
      'Create de variété commence avec analysis vide/form unknown; projeter un analyte depuis un claim choisi. Create de souche commence betaLyase unknown sans feuille préliée; projeter depuis un claim après attribution ID.',
      'Les alias créés/enrichis doivent être des claims identity.alias avec projection legacy explicite; une hypothèse descriptive n’est pas un alias de recherche exact.',
      'Le provider vérifie l’absence par clé normalisée et réservation transactionnelle; un résultat vide tronqué ne prouve pas l’absence.',
      'Un nom/code/style homonyme est un candidat, pas une fusion ni une interdiction. Pour créer un distinct, citer exactement les candidats retournés et expliquer la différence.'],
    examples: {
      create: { schemaVersion: 1, operationId: 'example-create-operation', operation: 'create', entity: { kind, value: entityValue }, claims: [fictiveClaim('catalogue.example', 'Assertion fictive sans source externe.')], unmapped: [], projectionChoices: [] },
      enrich: { schemaVersion: 1, operationId: 'example-enrich-operation', operation: 'enrich', target, claims: enrichClaims,
        unmapped: [], projectionChoices: enrichProjectionChoices }
    },
    examplesAreFictional: true
  };
}
