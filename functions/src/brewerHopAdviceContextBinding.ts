/**
 * Browser-safe context projection shared by the assisted-advice client and worker.
 * It seals the normalized source fields selected for the assistant plus journal/culture
 * lineage; calculation/catalogue/tool evidence remain separate dependencies. This fingerprint is
 * an integrity reference, never authentication or scientific validation.
 */
import { hopAdviceContentReference } from './hopAdviceContentReference.js';
import { BATCH_FIELDS, RECIPE_FIELDS, pick, validateScope } from './brewerContext.js';
import { normalizeRecipe } from './brewerTools.js';
import type { BrewerContext } from './companionTypes.js';

export const BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT = 'brewer-hop-advice-context-projection-v1' as const;
export const BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT = 'brewer-hop-advice-context-launch-v1' as const;
export const BREWER_HOP_ADVICE_TOOL_DEPENDENCIES_FORMAT = 'brewer-hop-advice-tool-dependencies-v2' as const;

export type BrewerHopAdviceContextScopeV1 = {
  kind: 'recipe' | 'batch' | 'draft' | 'app';
  id: string;
};

/** Client launch claim; the worker never repeats this as its effective source. */
export type BrewerHopAdviceLaunchSourceV1 =
  | { kind: 'recipe'; id: string }
  | { kind: 'batch'; id: string }
  | { kind: 'exploration' }
  | { kind: 'localRecipeCopy'; workspaceId: string; copyId: string; recipeId: string; recipeReference: string }
  | { kind: 'localFutureDraft'; workspaceId: string; draftId: string; revision: number; contentReference: string };

/** This source is derived from the context actually loaded by the worker. */
export type BrewerHopAdviceEffectiveSourceV1 =
  | { kind: 'recipe'; id: string; label: string | null; snapshotReference: string }
  | { kind: 'batch'; id: string; label: string | null; snapshotReference: string }
  | { kind: 'draft'; id: string; label: string | null; snapshotReference: string }
  | { kind: 'app'; id: string; label: string | null; snapshotReference: null };

export type BrewerHopAdviceJournalRevisionV1 =
  | { state: 'absent' }
  | { state: 'present'; value: number };

export interface BrewerHopAdviceJournalBindingV1 {
  state: 'absent' | 'present';
  revision: BrewerHopAdviceJournalRevisionV1;
  contentReference: string | null;
  localOverlay: 'notPresent' | 'matchesLoaded';
}

export type BrewerHopAdviceCultureUseV1 =
  | { status: 'notApplicable' | 'notReceived' }
  | {
      status: 'declaredNotConsumed';
      reference: { id: string; version: string; contentReference: string };
      bindingReference: string;
    }
  | {
      status: 'consumed';
      reference: { id: string; version: string; contentReference: string };
      bindingReference: string;
      cultureReference: string;
    };

/** Strict effective context returned by the worker. It contains no client archive/owner claims. */
export interface BrewerHopAdviceContextProjectionV1 {
  format: typeof BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT;
  scope: BrewerHopAdviceContextScopeV1;
  source: BrewerHopAdviceEffectiveSourceV1;
  journal: BrewerHopAdviceJournalBindingV1;
  culture: BrewerHopAdviceCultureUseV1;
  /** Versioned reference of the normalized full source recipe/batch fields selected for the assistant. */
  physicalAnchorReference: string;
  catalogueDependencyReference: string;
  calculationDependencyReference: string;
  runtimeDataRevision: string | null;
  stockAvailabilityReference: string | null;
}

/** Structural view of the canonical preparer output; keeps Functions independent of src/services/domain runtime imports. */
export interface BrewerHopAdvicePreparedRuntimeV1 {
  engineData: unknown;
  materials: readonly unknown[];
  current?: unknown;
  biologicalContext?: unknown;
  beerContext?: unknown;
  dataRevision?: string;
}

export interface BrewerHopAdvicePreparedContextV1 {
  runtime: BrewerHopAdvicePreparedRuntimeV1;
}

export interface BrewerHopAdvicePreparedCultureV1 {
  state: 'single' | 'mixed' | 'unknown';
  members: readonly unknown[];
  explanation?: string;
}

export interface BrewerHopAdviceContextLaunchClaimV1 {
  format: typeof BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT;
  /** Client claims, validated against its local archive/workspace before dispatch. */
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  source: BrewerHopAdviceLaunchSourceV1;
  sourceRuntimeReference: string;
  scope: BrewerHopAdviceContextScopeV1;
  expected: BrewerHopAdviceContextProjectionV1;
}

export type BrewerHopAdviceContextProjectionResult =
  | { status: 'ready'; projection: BrewerHopAdviceContextProjectionV1 }
  | { status: 'invalid'; reason: string }
  | { status: 'conflict'; code: 'scopeMismatch' | 'journalSourceDiverged' | 'cultureNotConsumed'; reason: string };

export type BrewerHopAdviceContextComparison =
  | { status: 'matched'; catalogueDependenciesChanged: boolean; calculationDependenciesChanged: boolean;
      runtimeDataRevisionChanged: boolean; stockAvailabilityChanged: boolean }
  | { status: 'stale'; conflicts: Array<'scopeChanged' | 'sourceChanged' | 'journalChanged' | 'cultureChanged' | 'physicalAnchorChanged'> }
  | { status: 'invalid'; reason: string };

export interface BrewerHopAdviceEvidenceDependencyV2 {
  evidenceId: string;
  toolName: string;
  contentReference: string;
}

/** Minimum identity needed by the projector; extra fields stay on the same received proof object. */
export interface BrewerHopAdviceEvidenceIdentityV2 {
  readonly id: string;
  readonly name: string;
}

type Row = Record<string, unknown>;
const isRecord = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype;
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const exactKeys = (value: Row, keys: readonly string[]) => Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key));
const same = (left: unknown, right: unknown) => hopAdviceContentReference('brewer-hop-advice-context-compare-v1', left)
  === hopAdviceContentReference('brewer-hop-advice-context-compare-v1', right);
const clone = <T>(value: T): T => structuredClone(value);

function validScope(value: unknown): value is BrewerHopAdviceContextScopeV1 {
  return isRecord(value) && exactKeys(value, ['kind', 'id']) && ['recipe', 'batch', 'draft', 'app'].includes(String(value.kind))
    && isText(value.id);
}

function validLaunchSource(value: unknown, workspaceId?: string): value is BrewerHopAdviceLaunchSourceV1 {
  if (!isRecord(value) || !isText(value.kind)) return false;
  if (value.kind === 'recipe' || value.kind === 'batch') return exactKeys(value, ['kind', 'id']) && isText(value.id);
  if (value.kind === 'exploration') return exactKeys(value, ['kind']);
  if (value.kind === 'localRecipeCopy') return exactKeys(value, ['kind', 'workspaceId', 'copyId', 'recipeId', 'recipeReference'])
    && isText(value.workspaceId) && (!workspaceId || value.workspaceId === workspaceId) && isText(value.copyId)
    && isText(value.recipeId) && isText(value.recipeReference);
  if (value.kind === 'localFutureDraft') return exactKeys(value, ['kind', 'workspaceId', 'draftId', 'revision', 'contentReference'])
    && isText(value.workspaceId) && (!workspaceId || value.workspaceId === workspaceId) && isText(value.draftId)
    && Number.isSafeInteger(value.revision) && (value.revision as number) >= 1 && isText(value.contentReference);
  return false;
}

/** Maps V5.5 source IDs to a strict BrewerScope without losing the original launch source. */
export function mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey: string, workspaceId: string,
  source: BrewerHopAdviceLaunchSourceV1): BrewerHopAdviceContextScopeV1 {
  if (!isText(ownerKey) || !isText(workspaceId) || !validLaunchSource(source, workspaceId)) {
    throw Error('Source de lancement assisté invalide ou étrangère au workspace.');
  }
  if (source.kind === 'recipe') return validateScope({ kind: 'recipe', id: source.id });
  if (source.kind === 'batch') return validateScope({ kind: 'batch', id: source.id });
  if (source.kind === 'exploration') return validateScope({ kind: 'app', id: 'stocks-hops' });
  const digestRef = hopAdviceContentReference('brewer-hop-v55-assisted-scope-v1', { ownerKey, workspaceId, source });
  const digest = digestRef.slice(digestRef.lastIndexOf(':') + 1);
  return validateScope({ kind: 'draft', id: `hop-v55-${digest}` });
}

function effectiveSource(scope: BrewerHopAdviceContextScopeV1, context: BrewerContext): BrewerHopAdviceEffectiveSourceV1 | null {
  const recipe = context.recipe == null ? undefined : normalizeRecipe(pick(context.recipe, RECIPE_FIELDS));
  const batch = context.batch == null ? undefined : pick(context.batch, BATCH_FIELDS);
  if (batch?.recipeSnapshot && isRecord(batch.recipeSnapshot)) {
    batch.recipeSnapshot = normalizeRecipe(pick(batch.recipeSnapshot, RECIPE_FIELDS));
  }
  const rawLabel = recipe?.name ?? batch?.name ?? (scope.kind === 'app' ? context.workspace?.screen : undefined);
  const label = typeof rawLabel === 'string' ? rawLabel : null;
  if (scope.kind === 'recipe') {
    if (!isRecord(recipe) || recipe.id !== scope.id || batch != null) return null;
    return { kind: 'recipe', id: scope.id, label,
      snapshotReference: hopAdviceContentReference('brewer-hop-advice-normalized-recipe-source-v1', recipe) };
  }
  if (scope.kind === 'batch') {
    if (!isRecord(batch) || batch.id !== scope.id || !isRecord(batch.recipeSnapshot) || !isRecord(recipe)
      || !same(batch.recipeSnapshot, recipe)) return null;
    return { kind: 'batch', id: scope.id, label,
      snapshotReference: hopAdviceContentReference('brewer-hop-advice-normalized-batch-source-v1', {
        batch, recipe: recipe ?? null,
      }) };
  }
  if (scope.kind === 'draft') {
    // Draft IDs are the actual declared draft/copy IDs supplied by Page, never recipe IDs invented here.
    if (!isRecord(recipe) || batch != null) return null;
    return { kind: 'draft', id: scope.id, label,
      snapshotReference: hopAdviceContentReference('brewer-hop-advice-normalized-draft-source-v1', recipe) };
  }
  if (recipe != null || batch != null) return null;
  return { kind: 'app', id: scope.id, label, snapshotReference: null };
}

function journalBinding(context: BrewerContext): BrewerHopAdviceJournalBindingV1 | null {
  const journal = context.journal;
  const local = context.localJournal;
  if (local != null) {
    if (journal == null || !same(journal, local)) return null;
  }
  if (journal == null) return {
    state: 'absent', revision: { state: 'absent' }, contentReference: null,
    localOverlay: local == null ? 'notPresent' : 'matchesLoaded',
  };
  if (!isRecord(journal)) return null;
  const rawRevision = journal.revision;
  let revision: BrewerHopAdviceJournalRevisionV1;
  if (rawRevision === undefined || rawRevision === null) revision = { state: 'absent' };
  else if (Number.isSafeInteger(rawRevision) && (rawRevision as number) >= 0) revision = { state: 'present', value: rawRevision as number };
  else return null;
  return {
    state: 'present', revision,
    // Keep the entire journal: density/temperature readings and other useful facts are context, not noise.
    contentReference: hopAdviceContentReference('brewer-hop-advice-journal-v1', journal),
    localOverlay: local == null ? 'notPresent' : 'matchesLoaded',
  };
}

function projectCulture(value: unknown): unknown {
  if (!isRecord(value)) return null;
  return {
    state: value.state ?? null,
    members: Array.isArray(value.members) ? value.members.map(member => {
      if (!isRecord(member)) return null;
      return Object.fromEntries(['yeastId', 'name', 'proportion'].filter(key => Object.prototype.hasOwnProperty.call(member, key))
        .map(key => [key, member[key]]));
    }) : [],
    ...(value.explanation !== undefined ? { explanation: value.explanation } : {}),
  };
}

/** Stable reference for the exact culture projection placed in the prepared runtime. */
export function brewerHopAdviceCurrentCultureReference(runtime: BrewerHopAdvicePreparedRuntimeV1): string | null {
  const current = isRecord(runtime.current) ? runtime.current : null;
  const culture = projectCulture(current?.culture);
  return culture == null ? null : hopAdviceContentReference('brewer-hop-advice-consumed-culture-v1', culture);
}

function projectBeerContext(value: unknown): unknown {
  if (!isRecord(value)) return null;
  // Keep the index signature after the boolean guard crosses a callback boundary.
  const styleValue: Row | null = isRecord(value.style) ? value.style : null;
  const style = styleValue ? Object.fromEntries(['guideId', 'version', 'styleId', 'role']
    .filter(key => Object.prototype.hasOwnProperty.call(styleValue, key)).map(key => [key, styleValue[key]])) : null;
  const facts = Array.isArray(value.facts) ? value.facts.map(fact => {
    if (!isRecord(fact)) return null;
    return Object.fromEntries(['id', 'field', 'status', 'origin', 'value', 'range', 'unit', 'basis', 'matrixId', 'timepoint']
      .filter(key => Object.prototype.hasOwnProperty.call(fact, key)).map(key => [key, fact[key]]));
  }) : [];
  return { style, matrixId: value.matrixId ?? null, facts };
}

function projectProgram(value: unknown): unknown {
  if (!isRecord(value)) return null;
  const additions = Array.isArray(value.additions) ? value.additions.map(addition => {
    if (!isRecord(addition)) return null;
    return Object.fromEntries(['id', 'materialId', 'grams', 'use', 'status', 'boilMinutes', 'contactHours', 'temperatureC', 'dayOffset']
      .filter(key => Object.prototype.hasOwnProperty.call(addition, key)).map(key => [key, addition[key]]));
  }) : [];
  return {
    ...Object.fromEntries(['id', 'revision', 'stage', 'volumeL', 'wortGravity']
      .filter(key => Object.prototype.hasOwnProperty.call(value, key)).map(key => [key, value[key]])),
    additions,
  };
}

function calculationDependencyBody(runtime: BrewerHopAdvicePreparedRuntimeV1): unknown {
  const current = isRecord(runtime.current) ? runtime.current : null;
  return {
    inputReference: current?.inputReference ?? null,
    input: current?.input ?? null,
    program: projectProgram(current?.program),
    currentBiologicalContext: current?.biologicalContext ?? null,
    runtimeBiologicalContext: runtime.biologicalContext ?? null,
    currentCulture: projectCulture(current?.culture),
    currentBeerContext: projectBeerContext(current?.beerContext),
    runtimeBeerContext: projectBeerContext(runtime.beerContext),
  };
}

function validCultureUse(value: unknown): value is BrewerHopAdviceCultureUseV1 {
  if (!isRecord(value) || typeof value.status !== 'string') return false;
  if (value.status === 'notApplicable' || value.status === 'notReceived') return exactKeys(value, ['status']);
  if (value.status !== 'declaredNotConsumed' && value.status !== 'consumed') return false;
  if (value.status === 'declaredNotConsumed' && !exactKeys(value, ['status', 'reference', 'bindingReference'])) return false;
  if (value.status === 'consumed' && !exactKeys(value, ['status', 'reference', 'bindingReference', 'cultureReference'])) return false;
  return isRecord(value.reference) && exactKeys(value.reference, ['id', 'version', 'contentReference'])
    && isText(value.reference.id) && isText(value.reference.version) && isText(value.reference.contentReference)
    && isText(value.bindingReference)
    && (value.status !== 'consumed' || isText(value.cultureReference));
}

function physicalBody(value: Pick<BrewerHopAdviceContextProjectionV1, 'scope' | 'source' | 'journal' | 'culture'>) {
  return {
    scope: value.scope,
    source: value.source,
    // Keep localOverlay as a diagnostic, but omit that redundant metadata from
    // the loaded journal's identity and physical anchor.
    journal: {
      state: value.journal.state,
      revision: value.journal.revision,
      contentReference: value.journal.contentReference,
    },
    // Local knowledge that no NR culture is adopted and a server that received
    // no NR binding both mean no adopted culture entered this runtime.
    culture: value.culture.status === 'notApplicable' || value.culture.status === 'notReceived'
      ? { status: 'noNRBindingConsumed' as const } : value.culture,
  };
}

function isProjection(value: unknown): value is BrewerHopAdviceContextProjectionV1 {
  if (!isRecord(value) || !exactKeys(value, ['format', 'scope', 'source', 'journal', 'culture', 'physicalAnchorReference',
    'catalogueDependencyReference', 'calculationDependencyReference', 'runtimeDataRevision', 'stockAvailabilityReference'])
    || value.format !== BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT
    || !validScope(value.scope) || !isRecord(value.source) || !isText(value.source.kind) || !isText(value.source.id)
    || !['recipe', 'batch', 'draft', 'app'].includes(value.source.kind)
    || !exactKeys(value.source, ['kind', 'id', 'label', 'snapshotReference'])
    || value.source.label !== null && !isText(value.source.label)
    || (value.source.kind === 'app' ? value.source.snapshotReference !== null : !isText(value.source.snapshotReference))
    || !isRecord(value.journal) || !exactKeys(value.journal, ['state', 'revision', 'contentReference', 'localOverlay'])
    || !['absent', 'present'].includes(String(value.journal.state))
    || !isRecord(value.journal.revision) || !['absent', 'present'].includes(String(value.journal.revision.state))
    || value.journal.state === 'absent' && value.journal.contentReference !== null
    || value.journal.state === 'present' && !isText(value.journal.contentReference)
    || value.journal.revision.state === 'present' && (!Number.isSafeInteger(value.journal.revision.value) || (value.journal.revision.value as number) < 0)
    || value.journal.revision.state === 'absent' && Object.keys(value.journal.revision).length !== 1
    || value.journal.revision.state === 'present' && !exactKeys(value.journal.revision, ['state', 'value'])
    || !['notPresent', 'matchesLoaded'].includes(String(value.journal.localOverlay))
    || !validCultureUse(value.culture)
    || !isText(value.physicalAnchorReference) || !isText(value.catalogueDependencyReference)
    || !isText(value.calculationDependencyReference)
    || value.runtimeDataRevision !== null && !isText(value.runtimeDataRevision)
    || value.stockAvailabilityReference !== null && !isText(value.stockAvailabilityReference)) return false;
  return true;
}

/**
 * Project the actual scope/context/runtime at one endpoint. `runtime` must be
 * prepared from this same `context` by the canonical prepareBrewingScenarioContext.
 * The function does not accept a client source/archive as an assertion.
 */
export function projectBrewerHopAdviceContext(input: {
  scope: unknown;
  context: BrewerContext;
      runtime: BrewerHopAdvicePreparedRuntimeV1;
  cultureUse?: BrewerHopAdviceCultureUseV1;
}): BrewerHopAdviceContextProjectionResult {
  try {
    if (!validScope(input.scope)) return { status: 'invalid', reason: 'Scope de contexte assiste invalide.' };
    if (!input.runtime || !input.runtime.engineData || !Array.isArray(input.runtime.materials)) {
      return { status: 'invalid', reason: 'Préparation canonique du contexte absente.' };
    }
    const source = effectiveSource(input.scope, input.context);
    if (!source) return { status: 'conflict', code: 'scopeMismatch', reason: 'La source réellement chargée ne correspond pas au scope demandé.' };
    const journal = journalBinding(input.context);
    if (!journal) return { status: 'conflict', code: 'journalSourceDiverged', reason: 'Le journal local diffère du journal chargé ou sa révision est invalide.' };
    const culture = input.cultureUse ?? { status: 'notReceived' as const };
    if (!validCultureUse(culture)) return { status: 'invalid', reason: 'Déclaration de consommation culturelle invalide.' };
    const current = isRecord(input.runtime.current) ? input.runtime.current : null;
    if (culture.status === 'consumed' && !current?.culture) {
      return { status: 'conflict', code: 'cultureNotConsumed', reason: 'La liaison NR est déclarée consommée, mais le runtime préparé ne contient pas cette culture.' };
    }
    if (culture.status === 'consumed' && culture.cultureReference !== brewerHopAdviceCurrentCultureReference(input.runtime)) {
      return { status: 'conflict', code: 'cultureNotConsumed', reason: 'La référence de culture ne correspond pas au contexte réellement préparé.' };
    }
    const body = { format: BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT, scope: clone(input.scope), source, journal, culture };
    const projection: BrewerHopAdviceContextProjectionV1 = {
      ...body,
      physicalAnchorReference: hopAdviceContentReference('brewer-hop-advice-physical-anchor-v1', physicalBody(body)),
      catalogueDependencyReference: hopAdviceContentReference('brewer-hop-advice-catalogue-dependencies-v1', {
        engineData: input.runtime.engineData, materials: input.runtime.materials,
      }),
      calculationDependencyReference: hopAdviceContentReference('brewer-hop-advice-calculation-dependencies-v1',
        calculationDependencyBody(input.runtime)),
      runtimeDataRevision: input.runtime.dataRevision ?? null,
      stockAvailabilityReference: current?.stockAvailabilityReference == null ? null : String(current.stockAvailabilityReference),
    };
    if (!isProjection(projection)) return { status: 'invalid', reason: 'Projection de contexte produite hors contrat strict.' };
    return { status: 'ready', projection };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Projection de contexte illisible.' };
  }
}

/** Alias intended for the worker call site: arguments must be the loaded context and its canonical preparation. */
export const deriveBrewerHopAdviceContextBinding = projectBrewerHopAdviceContext;

/** Compare launch, server receipt or confirmation projections without adopting either one. */
export function compareBrewerHopAdviceContextBindings(expectedValue: unknown, actualValue: unknown): BrewerHopAdviceContextComparison {
  try {
    if (!isProjection(expectedValue) || !isProjection(actualValue)) return { status: 'invalid', reason: 'Référence de contexte absente, future ou invalide.' };
    const conflicts: Array<'scopeChanged' | 'sourceChanged' | 'journalChanged' | 'cultureChanged' | 'physicalAnchorChanged'> = [];
    if (!same(expectedValue.scope, actualValue.scope)) conflicts.push('scopeChanged');
    if (!same(expectedValue.source, actualValue.source)) conflicts.push('sourceChanged');
    const journalIdentity = (journal: BrewerHopAdviceJournalBindingV1) => ({
      state: journal.state, revision: journal.revision, contentReference: journal.contentReference,
    });
    if (!same(journalIdentity(expectedValue.journal), journalIdentity(actualValue.journal))) conflicts.push('journalChanged');
    const noNR = (culture: BrewerHopAdviceCultureUseV1) => culture.status === 'notApplicable' || culture.status === 'notReceived';
    if (!(noNR(expectedValue.culture) && noNR(actualValue.culture)) && !same(expectedValue.culture, actualValue.culture)) {
      conflicts.push('cultureChanged');
    }
    if (expectedValue.physicalAnchorReference !== actualValue.physicalAnchorReference) conflicts.push('physicalAnchorChanged');
    if (conflicts.length) return { status: 'stale', conflicts };
    return {
      status: 'matched',
      // Prepared input/catalogue/stock dependencies are reported apart from physical source freshness.
      catalogueDependenciesChanged: expectedValue.catalogueDependencyReference !== actualValue.catalogueDependencyReference,
      calculationDependenciesChanged: expectedValue.calculationDependencyReference !== actualValue.calculationDependencyReference,
      runtimeDataRevisionChanged: expectedValue.runtimeDataRevision !== actualValue.runtimeDataRevision,
      stockAvailabilityChanged: expectedValue.stockAvailabilityReference !== actualValue.stockAvailabilityReference,
    };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Comparaison de contexte illisible.' };
  }
}

/** Exact same-turn evidence references; kept separate from the physical anchor. */
export function projectBrewerHopAdviceToolDependencies(
  evidence: readonly BrewerHopAdviceEvidenceIdentityV2[]
): BrewerHopAdviceEvidenceDependencyV2[] {
  const ids = new Set<string>();
  return evidence.map(row => {
    if (!isRecord(row) || !isText(row.id) || !isText(row.name) || ids.has(row.id)) {
      throw Error('Dépendance d’outil sans identité de tour unique.');
    }
    ids.add(row.id);
    return {
      evidenceId: row.id,
      toolName: row.name,
      // Hash the complete proof as received: displayed facts, limits, sources,
      // label, products/model and full data all remain in the same object.
      contentReference: hopAdviceContentReference('brewer-hop-advice-tool-evidence-v2', row),
    };
  });
}

/** Strict validation for the client-only claim before a worker accepts the envelope. */
export function isBrewerHopAdviceContextLaunchClaim(value: unknown): value is BrewerHopAdviceContextLaunchClaimV1 {
  if (!isRecord(value) || !exactKeys(value, ['format', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'source',
    'sourceRuntimeReference', 'scope', 'expected']) || value.format !== BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT
    || !isText(value.ownerKey) || !isText(value.workspaceId) || !isText(value.sourceReadingReference)
    || !isText(value.sourceRuntimeReference) || !validLaunchSource(value.source, value.workspaceId)
    || !validScope(value.scope) || !isProjection(value.expected)) return false;
  try {
    return same(mapBrewerHopAdviceLaunchSourceToScopeV1(value.ownerKey, value.workspaceId, value.source), value.scope)
      && same(value.scope, value.expected.scope);
  } catch { return false; }
}

