import {
  assertBrewingScenarioRequest,
  assertBrewingScenarioResult,
  brewingScenarioInputReference,
  type BrewingScenarioRuntime,
  type BrewingScenarioRequest,
  type BrewingScenarioResult,
} from '../../domain/brewingScenario';
import {
  getBrewingReferenceProjection,
  type BrewingReferenceIdentityV1,
} from '../../domain/brewingReference';
import {
  readBrewingScenarioRecord,
  type BrewingScenarioEventV1,
  type BrewingScenarioRecordRead,
  type BrewingScenarioSnapshotV1,
} from '../../domain/brewingScenarioDossier';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import type { BrewingScenarioLocalRepository } from '../brewingScenarioLocalRepository';
import { readHopV55DecisionReadingArchive } from './decisionArchive';
import { readHopV55FutureRecipeDraft } from './futureRecipeDraft';
import { readHopV55AdoptedContextBinding, resolveHopV55AdoptedContext,
  type HopV55AdoptedContextBindingV1 } from './adoptedContextResolution';
import {
  getHopV55ReferenceProjection,
  linkHopV55ScenarioResult,
  readHopV55ReferenceJournal,
} from './referenceWorkspace';
import type {
  HopV55ContextSource,
  HopV55Intent,
  HopV55Workspace,
  HopV55WorkspaceRepository,
} from './contracts';

export const HOP_V55_SCENARIO_PREPARATION_VERSION = 'hop-v55-scenario-preparation-v1' as const;
export const HOP_V55_SCENARIO_PREPARATION_HASH_KIND = 'hop-v55-scenario-preparation-content-v1' as const;
export const HOP_V55_SCENARIO_COMMIT_CAS_ATTEMPTS = 3 as const;

export interface HopV55ScenarioPreparationPriorV1 {
  scenarioId: string;
  /** Exact head snapshot on which the explicit re-evaluation was based. */
  snapshotReference: string;
  resultRevision: number;
  /** Event-ledger revision supplied as the resultRevised expectedRevision. */
  dossierRevision: number;
}

/** Immutable workspace intent persisted before any J5 write or calculation. */
export interface HopV55ScenarioPreparationV1 {
  version: typeof HOP_V55_SCENARIO_PREPARATION_VERSION;
  id: string;
  ownerKey: string;
  workspaceId: string;
  /** The same ID is used for the local resultSaved/resultRevised event and every retry. */
  eventId: string;
  scenarioId: string;
  operation: 'create' | 'reevaluate';
  request: BrewingScenarioRequest;
  requestReference: string;
  /** Stable content hash of the runtime dependencies used to prepare the computation; excludes wall-clock noise. */
  runtimeReference: string;
  intent: HopV55Intent;
  /** Exact adopted NR version at preparation time; null means deliberately unlinked. */
  reference: BrewingReferenceIdentityV1 | null;
  /** Full adopted NR provenance consumed by this J5 preparation; absent on historical V1 records. */
  cultureBinding?: HopV55AdoptedContextBindingV1;
  /** Exact pre-calculation reading archive; points to its sealed contentReference. */
  decisionReadingReference?: string;
  source: HopV55ContextSource;
  createdAt: string;
  prior?: HopV55ScenarioPreparationPriorV1;
  contentReference: string;
}

export type HopV55ScenarioPreparationRead =
  | { status: 'available'; preparation: HopV55ScenarioPreparationV1 }
  | { status: 'unsupportedFormat'; reason: string; raw: unknown }
  | { status: 'invalid'; reason: string };

export interface HopV55ScenarioPreparationInput {
  id: string;
  ownerKey: string;
  workspaceId: string;
  eventId: string;
  scenarioId: string;
  operation: 'create' | 'reevaluate';
  request: BrewingScenarioRequest;
  runtimeReference: string;
  intent: HopV55Intent;
  reference: BrewingReferenceIdentityV1 | null;
  cultureBinding?: HopV55AdoptedContextBindingV1;
  decisionReadingReference?: string;
  source: HopV55ContextSource;
  createdAt?: string;
  prior?: HopV55ScenarioPreparationPriorV1;
}

export interface HopV55ScenarioCommitServices {
  ownerKey: string;
  scenarios: BrewingScenarioLocalRepository;
  workspaces: HopV55WorkspaceRepository;
}

export interface HopV55ScenarioCommitInput extends HopV55ScenarioPreparationInput {
  services: HopV55ScenarioCommitServices;
  workspace: Pick<HopV55Workspace, 'id' | 'ownerKey'>;
  compute: (request: BrewingScenarioRequest) => BrewingScenarioResult | Promise<BrewingScenarioResult>;
  now?: () => string;
}

export interface HopV55ScenarioResumeInput {
  services: HopV55ScenarioCommitServices;
  ownerKey: string;
  workspaceId: string;
  preparationId: string;
  /** Required only if the exact result event is absent; this is an explicit compute/resume act. */
  compute?: (request: BrewingScenarioRequest) => BrewingScenarioResult | Promise<BrewingScenarioResult>;
  /** Fresh host context must reproduce the exact frozen request and source before an unsaved prep may run. */
  freshRequest?: BrewingScenarioRequest;
  freshSource?: HopV55ContextSource;
  freshRuntimeReference?: string;
  /** Explicit current binding or explicit absence; required only when the exact J5 result event is missing. */
  freshCultureBinding?: HopV55AdoptedContextBindingV1 | null;
  now?: () => string;
}

export interface HopV55ScenarioCommitResult {
  workspace: HopV55Workspace;
  record: BrewingScenarioRecordRead;
  /** Exact snapshot saved by this preparation's event, even when it is no longer the current head. */
  snapshot: BrewingScenarioSnapshotV1;
  event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }>;
  preparation: HopV55ScenarioPreparationV1;
  /** True iff this invocation called the supplied compute callback. */
  computed: boolean;
}

export type HopV55ScenarioCommitErrorCode =
  | 'invalidInput' | 'unsupportedPreparationFormat' | 'preparationNotFound' | 'preparationConflict'
  | 'sourceMismatch' | 'referenceMismatch' | 'resultMismatch' | 'staleScenario'
  | 'scenarioUnavailable' | 'workspaceUnavailable' | 'workspaceConflict' | 'eventConflict';

export class HopV55ScenarioCommitError extends Error {
  constructor(readonly code: HopV55ScenarioCommitErrorCode, message: string) {
    super(message);
    this.name = 'HopV55ScenarioCommitError';
  }
}

type Row = Record<string, any>;
const isRecord = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isId = (value: unknown): value is string => isText(value) && value.length <= 160 && !/[\\/]/.test(value)
  && !/^__.*__$/.test(value) && !['.', '..', 'constructor', 'prototype'].includes(value);
const clone = <T>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown): boolean => hopAdviceContentReference('hop-v55-scenario-commit-value-v1', left)
  === hopAdviceContentReference('hop-v55-scenario-commit-value-v1', right);
const identityKey = (identity: BrewingReferenceIdentityV1) => `${identity.id}\0${identity.version}\0${identity.contentReference}`;

function isoDate(value: unknown): value is string {
  return isText(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function fail(code: HopV55ScenarioCommitErrorCode, message: string): never {
  throw new HopV55ScenarioCommitError(code, message);
}

function preparationContentReference(value: Omit<HopV55ScenarioPreparationV1, 'contentReference'> | HopV55ScenarioPreparationV1): string {
  const { contentReference: _contentReference, ...body } = value as HopV55ScenarioPreparationV1;
  return hopAdviceContentReference(HOP_V55_SCENARIO_PREPARATION_HASH_KIND, body);
}

function assertIntent(value: unknown): asserts value is HopV55Intent {
  if (!isRecord(value) || Object.keys(value).some(key => !['question', 'criteria'].includes(key))
    || typeof value.question !== 'string' || !Array.isArray(value.criteria)) fail('invalidInput', 'Intention de scénario préparée invalide.');
  const ids = new Set<string>();
  for (const criterion of value.criteria) {
    if (!isRecord(criterion) || Object.keys(criterion).some(key => !['id', 'label', 'direction', 'axisId', 'familyId'].includes(key))
      || !isId(criterion.id) || !isText(criterion.label)
      || !['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(criterion.direction)
      || criterion.axisId !== undefined && !isId(criterion.axisId)
      || criterion.familyId !== undefined && !isId(criterion.familyId) || ids.has(criterion.id)) {
      fail('invalidInput', 'Critère d’intention préparé invalide ou dupliqué.');
    }
    ids.add(criterion.id);
  }
}

function assertSource(value: unknown): asserts value is HopV55ContextSource {
  if (!isRecord(value)) fail('invalidInput', 'Source de scénario préparée absente.');
  if (value.kind === 'recipe' && Object.keys(value).every(key => ['kind', 'recipeId'].includes(key)) && isId(value.recipeId)) return;
  if (value.kind === 'batch' && Object.keys(value).every(key => ['kind', 'batchId'].includes(key)) && isId(value.batchId)) return;
  if (value.kind === 'exploration' && Object.keys(value).every(key => key === 'kind')) return;
  if (value.kind === 'localRecipeCopy' && Object.keys(value).every(key => ['kind', 'workspaceId', 'copyId', 'recipeId', 'recipeReference'].includes(key))
    && isId(value.workspaceId) && isId(value.copyId) && isId(value.recipeId) && isText(value.recipeReference)) return;
  if (value.kind === 'localFutureDraft' && Object.keys(value).every(key => ['kind', 'workspaceId', 'draftId', 'revision', 'contentReference'].includes(key))
    && isId(value.workspaceId) && isId(value.draftId) && Number.isSafeInteger(value.revision) && value.revision >= 1 && isText(value.contentReference)) return;
  fail('invalidInput', 'Source de scénario préparée mal formée.');
}

function assertReference(value: unknown): asserts value is BrewingReferenceIdentityV1 | null {
  if (value === null) return;
  if (!isRecord(value) || Object.keys(value).some(key => !['id', 'version', 'contentReference'].includes(key))
    || !isText(value.id) || !isText(value.version) || !isText(value.contentReference)) {
    fail('invalidInput', 'Identité exacte de référence NR invalide.');
  }
}

/** Reader validator is pure: request hashes and archived shapes only, no catalogues or engine. */
export function assertHopV55ScenarioPreparation(value: unknown): asserts value is HopV55ScenarioPreparationV1 {
  if (!isRecord(value)) fail('invalidInput', 'Préparation J5 absente.');
  const allowed = ['version', 'id', 'ownerKey', 'workspaceId', 'eventId', 'scenarioId', 'operation', 'request', 'requestReference',
    'runtimeReference', 'intent', 'reference', 'cultureBinding', 'decisionReadingReference', 'source', 'createdAt', 'prior', 'contentReference'];
  if (Object.keys(value).some(key => !allowed.includes(key))) fail('invalidInput', 'Préparation J5 contient un champ inconnu.');
  if (value.version !== HOP_V55_SCENARIO_PREPARATION_VERSION || !isId(value.id) || !isId(value.ownerKey)
    || !isId(value.workspaceId) || !isId(value.eventId) || !isId(value.scenarioId)
    || !['create', 'reevaluate'].includes(value.operation) || !isoDate(value.createdAt)
    || !isText(value.contentReference) || !isText(value.requestReference) || !isText(value.runtimeReference)
    || value.decisionReadingReference !== undefined && !isText(value.decisionReadingReference)) {
    fail('invalidInput', 'Enveloppe ou identité de préparation J5 invalide.');
  }
  try { assertBrewingScenarioRequest(value.request); }
  catch (error) { fail('invalidInput', `Requête J5 préparée invalide : ${error instanceof Error ? error.message : 'structure inconnue'}`); }
  if (value.request.scenarioId !== value.scenarioId || value.requestReference !== brewingScenarioInputReference(value.request)) {
    fail('invalidInput', 'La requête J5 et sa référence de contenu ne correspondent pas à la préparation.');
  }
  assertIntent(value.intent);
  assertReference(value.reference);
  assertSource(value.source);
  if (Object.prototype.hasOwnProperty.call(value, 'cultureBinding')) {
    const binding = readHopV55AdoptedContextBinding(value.cultureBinding);
    if (binding.status !== 'available' || value.reference === null
      || binding.binding.ownerKey !== value.ownerKey || binding.binding.workspaceId !== value.workspaceId
      || identityKey(binding.binding.reference) !== identityKey(value.reference as BrewingReferenceIdentityV1)
      || !same(binding.binding.baseline, value.request.baseline)) {
      fail('invalidInput', 'Binding culturel J5 absent, étranger ou différent de la baseline et de la référence exactes.');
    }
  }
  if (value.operation === 'create') {
    if (value.prior !== undefined || value.request.revision !== 1) fail('invalidInput', 'Une création J5 commence sans snapshot antérieur et à la révision 1.');
  } else {
    const prior = value.prior;
    if (!isRecord(prior) || Object.keys(prior).some(key => !['scenarioId', 'snapshotReference', 'resultRevision', 'dossierRevision'].includes(key))
      || prior.scenarioId !== value.scenarioId || !isText(prior.snapshotReference) || !Number.isSafeInteger(prior.resultRevision) || prior.resultRevision < 1
      || !Number.isSafeInteger(prior.dossierRevision) || prior.dossierRevision < 1
      || value.request.revision !== prior.resultRevision + 1) {
      fail('invalidInput', 'Une réévaluation doit figer son snapshot J5, sa révision de résultat et sa révision de dossier exacts.');
    }
  }
  if (value.contentReference !== preparationContentReference(value as unknown as HopV55ScenarioPreparationV1)) {
    fail('invalidInput', 'Empreinte de préparation J5 invalide.');
  }
}

export function readHopV55ScenarioPreparation(value: unknown): HopV55ScenarioPreparationRead {
  if (!isRecord(value)) return { status: 'invalid', reason: 'Préparation J5 absente.' };
  if (value.version !== HOP_V55_SCENARIO_PREPARATION_VERSION) {
    if (typeof value.version !== 'string') return { status: 'invalid', reason: 'Version de préparation J5 absente.' };
    return { status: 'unsupportedFormat', reason: `Format de préparation ${String(value.version)} conservé en lecture seule.`, raw: clone(value) };
  }
  try {
    assertHopV55ScenarioPreparation(value);
    return { status: 'available', preparation: clone(value) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Préparation J5 invalide.' };
  }
}

/** Hashes the explicit facts consumed by J5, excluding wall-clock noise. */
export function hopV55ScenarioRuntimeReference(runtime: BrewingScenarioRuntime): string {
  if (!runtime || !runtime.engineData || !Array.isArray(runtime.materials)) fail('invalidInput', 'Dépendances runtime nécessaires au calcul absentes.');
  return hopAdviceContentReference('hop-v55-scenario-runtime-v1', {
    current: runtime.current ?? null,
    materials: runtime.materials,
    engineData: runtime.engineData,
    biologicalContext: runtime.biologicalContext ?? null,
    beerContext: runtime.beerContext ?? null,
    dataRevision: runtime.dataRevision ?? null,
  });
}

function createPreparation(input: HopV55ScenarioPreparationInput, createdAt: string): HopV55ScenarioPreparationV1 {
  const body = {
    version: HOP_V55_SCENARIO_PREPARATION_VERSION,
    id: input.id,
    ownerKey: input.ownerKey,
    workspaceId: input.workspaceId,
    eventId: input.eventId,
    scenarioId: input.scenarioId,
    operation: input.operation,
    request: clone(input.request),
    requestReference: brewingScenarioInputReference(input.request),
    runtimeReference: input.runtimeReference,
    intent: clone(input.intent),
    reference: input.reference ? clone(input.reference) : null,
    ...(input.cultureBinding ? { cultureBinding: clone(input.cultureBinding) } : {}),
    ...(input.decisionReadingReference ? { decisionReadingReference: input.decisionReadingReference } : {}),
    source: clone(input.source),
    createdAt,
    ...(input.prior ? { prior: clone(input.prior) } : {}),
  } satisfies Omit<HopV55ScenarioPreparationV1, 'contentReference'>;
  const preparation = { ...body, contentReference: preparationContentReference(body) };
  assertHopV55ScenarioPreparation(preparation);
  return preparation;
}

function samePreparationIntent(left: HopV55ScenarioPreparationV1, right: HopV55ScenarioPreparationV1): boolean {
  const omitTime = (value: HopV55ScenarioPreparationV1) => {
    const { createdAt: _createdAt, contentReference: _contentReference, ...body } = value;
    return body;
  };
  return same(omitTime(left), omitTime(right));
}

function assertPreparationWorkspace(preparation: HopV55ScenarioPreparationV1, workspace: HopV55Workspace): void {
  if (preparation.ownerKey !== workspace.ownerKey || preparation.workspaceId !== workspace.id) {
    fail('sourceMismatch', 'La préparation ne correspond pas à l’identité exacte du workspace.');
  }
  const expectedSource: HopV55ContextSource = workspace.sourceBatchId
    ? { kind: 'batch', batchId: workspace.sourceBatchId }
    : workspace.sourceRecipeId ? { kind: 'recipe', recipeId: workspace.sourceRecipeId } : { kind: 'exploration' };
  const localCopyReference = preparation.source.kind === 'localRecipeCopy' ? preparation.source : null;
  const localCopySource = !!localCopyReference && localCopyReference.workspaceId === workspace.id
    && workspace.copies.some(copy => copy.id === localCopyReference.copyId && copy.recipe.id === localCopyReference.recipeId
      && hopDecisionReference(copy.recipe) === localCopyReference.recipeReference);
  const futureDraftSource = preparation.source.kind === 'localFutureDraft'
    ? preparation.source
    : null;
  const matchingFutureDraft = futureDraftSource && futureDraftSource.workspaceId === workspace.id
    && (workspace.futureDrafts ?? []).some(raw => {
      const read = readHopV55FutureRecipeDraft(raw);
      return read.status === 'available' && read.draft.draftId === futureDraftSource.draftId
        && read.draft.revision === futureDraftSource.revision && read.draft.contentReference === futureDraftSource.contentReference;
    });
  if (!(localCopySource || matchingFutureDraft || same(preparation.source, expectedSource))) {
    fail('sourceMismatch', 'La source préparée ne correspond pas à une recette/brassin figé ou à une version exacte de brouillon conservé dans ce workspace.');
  }
  const persistedPreparation = workspaceRows(workspace).some(row => row.id === preparation.id && row.contentReference === preparation.contentReference);
  if (preparation.operation === 'create' && workspace.scenarioIds.includes(preparation.scenarioId) && !persistedPreparation) {
    fail('preparationConflict', 'La création préparée utilise un scenarioId déjà rattaché au workspace.');
  }
  if (preparation.operation === 'reevaluate' && preparation.prior?.scenarioId !== preparation.scenarioId) {
    fail('preparationConflict', 'Le prior ne porte pas l’identité exacte du scénario réévalué.');
  }
  if (preparation.operation === 'reevaluate' && !workspace.scenarioIds.includes(preparation.scenarioId)) {
    fail('preparationConflict', 'La réévaluation préparée ne référence pas un scénario déjà rattaché à ce workspace.');
  }
  if (preparation.reference) {
    const journal = readHopV55ReferenceJournal(workspace);
    if (journal.status !== 'available') fail('referenceMismatch', 'La référence exacte figée n’est plus lisible dans le journal NR du workspace.');
    const projection = getBrewingReferenceProjection(journal.read);
    const key = identityKey(preparation.reference);
    const exists = projection.references.some(reference => identityKey(reference) === key);
    const adopted = projection.adoptions.some(adoption => identityKey(adoption.reference) === key);
    if (!exists || !adopted) fail('referenceMismatch', 'La référence exacte préparée n’est pas adoptée dans le journal NR.');
  }
  if (preparation.decisionReadingReference) {
    const stored = (workspace.decisionReadings ?? []).find(row => row.contentReference === preparation.decisionReadingReference);
    const read = stored && readHopV55DecisionReadingArchive(stored);
    if (!read || read.status !== 'available') {
      fail('preparationConflict', 'La lecture exacte préparée est absente ou n’est plus lisible dans le workspace.');
    }
    const archiveSource = read.archive.source;
    const expectedReadingSource = preparation.source.kind === 'localFutureDraft' || preparation.source.kind === 'localRecipeCopy' ? preparation.source
      : preparation.source.kind === 'recipe' ? { kind: 'recipe', id: preparation.source.recipeId }
        : preparation.source.kind === 'batch' ? { kind: 'batch', id: preparation.source.batchId }
          : { kind: 'exploration' };
    if (read.archive.ownerKey !== preparation.ownerKey || read.archive.workspaceId !== preparation.workspaceId
      || !same(archiveSource, expectedReadingSource) || !same(read.archive.reading.intent, preparation.intent)) {
      fail('preparationConflict', 'La lecture scellée doit garder le même owner, workspace, source et question/intention que la préparation.');
    }
  }
}

/** Verifies the exact adoption currently selected before a new preparation or computation. */
function assertCurrentAdoptedContext(preparation: HopV55ScenarioPreparationV1, workspace: HopV55Workspace,
  currentBinding: HopV55AdoptedContextBindingV1 | null): void {
  const resolution = resolveHopV55AdoptedContext({
    workspace: { id: workspace.id, ownerKey: workspace.ownerKey, referenceJournal: workspace.referenceJournal },
    expected: preparation.reference,
  });
  if (preparation.reference === null) {
    if (currentBinding !== null || resolution.status !== 'absent') {
      fail('referenceMismatch', 'Une adoption NR est devenue courante après la préparation non liée; relis le contexte avant un nouveau calcul J5.');
    }
    return;
  }
  if (resolution.status !== 'resolved') {
    fail('referenceMismatch', 'La référence NR préparée n’est plus l’adoption courante; aucun nouveau calcul J5 ne démarre sous une autre version.');
  }
  if (!currentBinding) fail('referenceMismatch', 'Un nouveau calcul J5 avec adoption exige le binding NR exact relu depuis le contexte courant.');
  const bindingRead = readHopV55AdoptedContextBinding(currentBinding);
  if (bindingRead.status !== 'available' || bindingRead.binding.ownerKey !== workspace.ownerKey
    || bindingRead.binding.workspaceId !== workspace.id
    || bindingRead.binding.bindingReference !== resolution.binding.bindingReference
    || !same(bindingRead.binding.reference, preparation.reference)
    || !same(bindingRead.binding.baseline, preparation.request.baseline)
    || preparation.cultureBinding && preparation.cultureBinding.bindingReference !== bindingRead.binding.bindingReference) {
    fail('referenceMismatch', 'Le binding NR frais ne correspond pas au binding scellé et à la baseline de la préparation J5.');
  }
}

function repoErrorCode(error: unknown): string | undefined {
  return isRecord(error) && typeof error.code === 'string' ? error.code : undefined;
}

function workspaceRows(workspace: HopV55Workspace): HopV55ScenarioPreparationV1[] {
  return (workspace.scenarioPreparations ?? []) as HopV55ScenarioPreparationV1[];
}

async function latestWorkspace(services: HopV55ScenarioCommitServices, ownerKey: string, workspaceId: string): Promise<HopV55Workspace> {
  const current = await services.workspaces.read(ownerKey, workspaceId);
  if (!current) fail('workspaceUnavailable', 'Le workspace préparé n’existe plus dans son dépôt local.');
  if (current.ownerKey !== ownerKey || current.id !== workspaceId || services.ownerKey !== ownerKey) {
    fail('workspaceUnavailable', 'La relecture du workspace renvoie une autre identité de compte ou de dossier.');
  }
  return current;
}

async function assertJ5PreparationPrecondition(services: HopV55ScenarioCommitServices,
  preparation: HopV55ScenarioPreparationV1): Promise<void> {
  const loaded = await services.scenarios.read(preparation.ownerKey, preparation.scenarioId);
  if (!loaded) {
    if (preparation.operation === 'reevaluate') fail('staleScenario', 'Le dossier J5 préparé pour réévaluation est absent.');
    return;
  }
  if (loaded.status !== 'available') fail('scenarioUnavailable', 'Le dossier J5 est dans un format futur; la préparation reste en attente sans exécution.');
  if (loaded.record.events.some(event => event.eventId === preparation.eventId)) {
    fail('eventConflict', 'L’eventId est déjà utilisé avant la persistance de cette préparation.');
  }
  if (preparation.operation === 'create') fail('staleScenario', 'Un dossier J5 existe déjà pour le scenarioId de création.');
  const prior = preparation.prior!;
  if (loaded.record.dossier.revision !== prior.dossierRevision
    || loaded.record.currentSnapshot.reference !== prior.snapshotReference
    || loaded.record.currentSnapshot.result.revision !== prior.resultRevision) {
    fail('staleScenario', 'Le snapshot J5 préexistant ne correspond pas au prior exact de la préparation.');
  }
}

/** Persist an immutable preparation before invoking J5. Existing identical IDs are idempotent. */
export async function prepareHopV55ScenarioCommit(input: HopV55ScenarioPreparationInput & {
  services: HopV55ScenarioCommitServices;
  workspace: Pick<HopV55Workspace, 'id' | 'ownerKey'>;
  now?: () => string;
}): Promise<{ workspace: HopV55Workspace; preparation: HopV55ScenarioPreparationV1 }> {
  if (!input || !input.services || !input.workspace || input.workspace.id !== input.workspaceId || input.workspace.ownerKey !== input.ownerKey
    || input.services.ownerKey !== input.ownerKey) fail('invalidInput', 'Workspace, owner et services doivent partager leurs identités exactes.');
  const createdAt = input.createdAt ?? input.now?.() ?? new Date().toISOString();
  const proposed = createPreparation(input, createdAt);
  for (let attempt = 0; attempt < HOP_V55_SCENARIO_COMMIT_CAS_ATTEMPTS; attempt++) {
    const latest = await latestWorkspace(input.services, input.ownerKey, input.workspaceId);
    const rows = workspaceRows(latest);
    const existing = rows.find(row => row.id === proposed.id);
    if (existing) {
      const read = readHopV55ScenarioPreparation(existing);
      if (read.status !== 'available' || !samePreparationIntent(read.preparation, proposed)) {
        fail('preparationConflict', 'Cet identifiant de préparation existe déjà avec une autre requête, source, référence, sélection ou eventId.');
      }
      assertPreparationWorkspace(read.preparation, latest);
      return { workspace: latest, preparation: read.preparation };
    }
    assertPreparationWorkspace(proposed, latest);
    assertCurrentAdoptedContext(proposed, latest, input.cultureBinding ?? null);
    await assertJ5PreparationPrecondition(input.services, proposed);
    if (rows.some(row => row.eventId === proposed.eventId)) fail('preparationConflict', 'Cet eventId J5 est déjà réservé par une autre préparation du workspace.');
    if (proposed.operation === 'create' && rows.some(row => row.operation === 'create' && row.scenarioId === proposed.scenarioId)) {
      fail('preparationConflict', 'Ce scenarioId est déjà réservé par une autre création préparée.');
    }
    const next = clone(latest);
    next.scenarioPreparations = [...rows, clone(proposed)];
    next.updatedAt = createdAt;
    try {
      const saved = await input.services.workspaces.save(next, latest.revision);
      return { workspace: saved, preparation: clone(proposed) };
    } catch (error) {
      if (repoErrorCode(error) === 'staleRevision' && attempt + 1 < HOP_V55_SCENARIO_COMMIT_CAS_ATTEMPTS) continue;
      if (repoErrorCode(error) === 'staleRevision') break;
      throw error;
    }
  }
  fail('workspaceConflict', 'Le workspace a changé pendant trois tentatives de préparation; aucune écriture J5 n’a été lancée.');
}

function resultEventFor(record: BrewingScenarioRecordRead, preparation: HopV55ScenarioPreparationV1) {
  const events = record.events.filter((event): event is Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }> =>
    (event.kind === 'resultSaved' || event.kind === 'resultRevised') && event.eventId === preparation.eventId);
  if (events.length > 1) fail('eventConflict', 'Plusieurs événements de résultat portent le même eventId préparé.');
  const event = events[0];
  if (!event) return null;
  const expectedKind = preparation.operation === 'create' ? 'resultSaved' : 'resultRevised';
  const expectedRevision = preparation.operation === 'create' ? 0 : preparation.prior!.dossierRevision;
  if (event.kind !== expectedKind || event.scenarioId !== preparation.scenarioId || event.expectedRevision !== expectedRevision
    || event.resultingRevision !== expectedRevision + 1) {
    fail('eventConflict', 'L’eventId préparé existe avec une opération ou une révision J5 différente.');
  }
  const snapshot = event.payload.snapshot;
  const result = snapshot.result;
  try { assertBrewingScenarioResult(result); }
  catch (error) { fail('resultMismatch', `Le résultat sauvegardé ne peut pas être relu : ${error instanceof Error ? error.message : 'résultat invalide'}`); }
  if (snapshot.reference !== result.reference || result.scenarioId !== preparation.scenarioId
    || result.revision !== preparation.request.revision || result.inputReference !== preparation.requestReference
    || !same(result.requestSnapshot, preparation.request)
    || event.kind === 'resultRevised' && event.payload.previousSnapshotReference !== preparation.prior!.snapshotReference) {
    fail('eventConflict', 'Le résultat de cet eventId ne correspond pas à la requête et au snapshot préparés.');
  }
  return { event, snapshot };
}

async function readSavedResult(services: HopV55ScenarioCommitServices, preparation: HopV55ScenarioPreparationV1): Promise<{
  record: BrewingScenarioRecordRead; event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }>;
  snapshot: BrewingScenarioSnapshotV1;
} | null> {
  const loaded = await services.scenarios.read(preparation.ownerKey, preparation.scenarioId);
  if (!loaded) return null;
  if (loaded.status !== 'available') fail('scenarioUnavailable', 'Le dossier J5 est dans un format futur; aucune nouvelle exécution ni reprise n’est tentée.');
  const found = resultEventFor(loaded.record, preparation);
  if (found) return { record: loaded.record, ...found };
  if (loaded.record.events.some(event => event.eventId === preparation.eventId)) {
    fail('eventConflict', 'L’eventId préparé est déjà consommé par un événement autre que le résultat attendu.');
  }
  if (preparation.operation === 'create') fail('staleScenario', 'Un dossier J5 existe déjà, sans le resultSaved exact de cette préparation.');
  if (loaded.record.dossier.revision !== preparation.prior!.dossierRevision
    || loaded.record.currentSnapshot.reference !== preparation.prior!.snapshotReference
    || loaded.record.currentSnapshot.result.revision !== preparation.prior!.resultRevision) {
    fail('staleScenario', 'Le snapshot ou la révision J5 a changé depuis la préparation; le calcul est refusé.');
  }
  return null;
}

function assertFreshResume(preparation: HopV55ScenarioPreparationV1, request: BrewingScenarioRequest | undefined,
  source: HopV55ContextSource | undefined, runtimeReference: string | undefined,
  workspace: HopV55Workspace, currentBinding: HopV55AdoptedContextBindingV1 | null): void {
  if (!request || !source || !isText(runtimeReference)) fail('sourceMismatch', 'Aucun résultat exact n’existe encore; une reprise exige une requête, une source et des dépendances runtime fraîches relues explicitement.');
  try { assertBrewingScenarioRequest(request); }
  catch (error) { fail('sourceMismatch', `La requête fraîche n’est pas compatible : ${error instanceof Error ? error.message : 'requête invalide'}`); }
  if (request.scenarioId !== preparation.scenarioId || !same(request, preparation.request)
    || brewingScenarioInputReference(request) !== preparation.requestReference || !same(source, preparation.source)
    || runtimeReference !== preparation.runtimeReference) {
    fail('sourceMismatch', 'La source, la requête ou les dépendances runtime fraîches ont changé depuis la préparation; aucun fallback vers une autre recette/référence n’est tenté.');
  }
  assertCurrentAdoptedContext(preparation, workspace, currentBinding);
}

async function saveComputedResult(services: HopV55ScenarioCommitServices, preparation: HopV55ScenarioPreparationV1,
  compute: HopV55ScenarioCommitInput['compute'], now: () => string,
  currentBinding: HopV55AdoptedContextBindingV1 | null): Promise<{
    record: BrewingScenarioRecordRead; event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }>;
    snapshot: BrewingScenarioSnapshotV1; computed: boolean;
  }> {
  const beforeCompute = await readSavedResult(services, preparation);
  if (beforeCompute) return { ...beforeCompute, computed: false };
  const latest = await latestWorkspace(services, preparation.ownerKey, preparation.workspaceId);
  assertPreparationWorkspace(preparation, latest);
  assertCurrentAdoptedContext(preparation, latest, currentBinding);
  const result = await compute(clone(preparation.request));
  try { assertBrewingScenarioResult(result); }
  catch (error) { fail('resultMismatch', `Le calcul fourni ne renvoie pas un résultat J5 valide : ${error instanceof Error ? error.message : 'résultat invalide'}`); }
  if (result.scenarioId !== preparation.scenarioId || result.revision !== preparation.request.revision
    || result.inputReference !== preparation.requestReference || !same(result.requestSnapshot, preparation.request)) {
    fail('resultMismatch', 'Le résultat fourni provient d’une autre requête/source/référence que la préparation immuable.');
  }

  if (preparation.operation === 'create') {
    await services.scenarios.saveResult({ ownerKey: preparation.ownerKey, scenarioId: preparation.scenarioId,
      eventId: preparation.eventId, recordedAt: now(), result: clone(result) });
  } else {
    const prior = preparation.prior!;
    await services.scenarios.reviseResult({ ownerKey: preparation.ownerKey, scenarioId: preparation.scenarioId,
      eventId: preparation.eventId, expectedRevision: prior.dossierRevision, recordedAt: now(),
      previousSnapshotReference: prior.snapshotReference, reason: 'Réévaluation explicite depuis une préparation J5 immuable.', result: clone(result) });
  }
  const saved = await readSavedResult(services, preparation);
  if (!saved) fail('scenarioUnavailable', 'L’écriture J5 n’a pas de reçu exact relisible; la préparation reste à reprendre sans nouveau calcul automatique.');
  return { ...saved, computed: true };
}

function linkPresent(workspace: HopV55Workspace, preparation: HopV55ScenarioPreparationV1, snapshot: BrewingScenarioSnapshotV1,
  event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }>): boolean {
  if (!preparation.reference) return true;
  const projection = getHopV55ReferenceProjection(workspace);
  const link = projection?.j5ResultLinks.find(row => row.id === `result-link:${preparation.eventId}`);
  if (!link) return false;
  const expected = {
    id: `result-link:${preparation.eventId}`,
    reference: preparation.reference,
    result: { scenarioId: preparation.scenarioId, resultId: preparation.scenarioId, resultRevision: snapshot.result.revision,
      resultReference: snapshot.reference, snapshotReference: snapshot.reference },
    receipt: { status: 'local' as const, receiptId: preparation.eventId, localRecordId: preparation.scenarioId, receivedAt: event.recordedAt },
  };
  if (!same(link, expected)) fail('eventConflict', 'Un lien NR portant le reçu préparé existe pour un autre contenu.');
  return true;
}

function finalized(workspace: HopV55Workspace, preparation: HopV55ScenarioPreparationV1, snapshot: BrewingScenarioSnapshotV1,
  event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }>): boolean {
  const idAttached = workspace.scenarioIds.includes(preparation.scenarioId);
  const intentAttached = (workspace.snapshotIntents ?? []).some(row => row.scenarioId === preparation.scenarioId
    && row.snapshotReference === snapshot.reference && same(row.intent, preparation.intent)
    && row.decisionReadingReference === preparation.decisionReadingReference);
  return idAttached && intentAttached && linkPresent(workspace, preparation, snapshot, event);
}

async function finishWorkspace(services: HopV55ScenarioCommitServices, preparation: HopV55ScenarioPreparationV1,
  saved: { record: BrewingScenarioRecordRead; event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }>; snapshot: BrewingScenarioSnapshotV1 },
  now: () => string): Promise<HopV55Workspace> {
  for (let attempt = 0; attempt < HOP_V55_SCENARIO_COMMIT_CAS_ATTEMPTS; attempt++) {
    const latest = await latestWorkspace(services, preparation.ownerKey, preparation.workspaceId);
    const storedPreparation = workspaceRows(latest).find(row => row.id === preparation.id);
    const storedRead = storedPreparation && readHopV55ScenarioPreparation(storedPreparation);
    if (!storedRead || storedRead.status !== 'available' || storedRead.preparation.contentReference !== preparation.contentReference) {
      fail('preparationNotFound', 'La préparation immuable a disparu ou changé avant son rattachement; le résultat J5 reste conservé.');
    }
    assertPreparationWorkspace(preparation, latest);
    if (finalized(latest, preparation, saved.snapshot, saved.event)) return latest;

    const next = clone(latest);
    if (!next.scenarioIds.includes(preparation.scenarioId)) next.scenarioIds = [...next.scenarioIds, preparation.scenarioId];
    const intents = [...(next.snapshotIntents ?? [])];
    const priorIntent = intents.find(row => row.scenarioId === preparation.scenarioId && row.snapshotReference === saved.snapshot.reference);
    if (priorIntent && (!same(priorIntent.intent, preparation.intent)
      || priorIntent.decisionReadingReference !== preparation.decisionReadingReference)) {
      fail('eventConflict', 'Une autre intention ou lecture est déjà liée à ce snapshot exact.');
    }
    if (!priorIntent) intents.push({ scenarioId: preparation.scenarioId, snapshotReference: saved.snapshot.reference,
      intent: clone(preparation.intent), ...(preparation.decisionReadingReference ? { decisionReadingReference: preparation.decisionReadingReference } : {}) });
    next.snapshotIntents = intents;
    if (preparation.reference) {
      const linked = linkHopV55ScenarioResult(next, {
        result: saved.snapshot.result,
        snapshotReference: saved.snapshot.reference,
        receiptId: preparation.eventId,
        receivedAt: saved.event.recordedAt,
        reference: clone(preparation.reference),
      });
      next.referenceJournal = linked.referenceJournal;
    }
    next.updatedAt = now();
    try {
      return await services.workspaces.save(next, latest.revision);
    } catch (error) {
      if (repoErrorCode(error) === 'staleRevision' && attempt + 1 < HOP_V55_SCENARIO_COMMIT_CAS_ATTEMPTS) continue;
      if (repoErrorCode(error) === 'staleRevision') break;
      throw error;
    }
  }
  fail('workspaceConflict', 'Le résultat J5 est conservé, mais trois rattachements CAS ont échoué; reprendre cette préparation sans recalcul.');
}

async function complete(services: HopV55ScenarioCommitServices, preparation: HopV55ScenarioPreparationV1,
  saved: { record: BrewingScenarioRecordRead; event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }>; snapshot: BrewingScenarioSnapshotV1; computed: boolean },
  now: () => string): Promise<HopV55ScenarioCommitResult> {
  const workspace = await finishWorkspace(services, preparation, saved, now);
  // Re-read after the workspace CAS: returning a write buffer is not a durable confirmation.
  const reloaded = await latestWorkspace(services, preparation.ownerKey, preparation.workspaceId);
  const exact = await readSavedResult(services, preparation);
  if (!exact) fail('scenarioUnavailable', 'Le snapshot lié n’est plus relisible depuis son eventId exact.');
  if (!reloaded.scenarioIds.includes(preparation.scenarioId)
    || !(reloaded.snapshotIntents ?? []).some(row => row.scenarioId === preparation.scenarioId
      && row.snapshotReference === exact.snapshot.reference && same(row.intent, preparation.intent)
      && row.decisionReadingReference === preparation.decisionReadingReference)
    || !linkPresent(reloaded, preparation, exact.snapshot, exact.event)) {
    fail('workspaceUnavailable', 'La relecture fraîche du workspace ne confirme pas le rattachement exact du reçu J5.');
  }
  return { workspace: reloaded, record: exact.record, snapshot: exact.snapshot, event: exact.event, preparation: clone(preparation), computed: saved.computed };
}

/** Prepare, compute once (unless its exact event already exists), save J5, then CAS-merge the workspace. */
export async function commitHopV55Scenario(input: HopV55ScenarioCommitInput): Promise<HopV55ScenarioCommitResult> {
  const prepared = await prepareHopV55ScenarioCommit(input);
  const now = input.now ?? (() => new Date().toISOString());
  const existing = await readSavedResult(input.services, prepared.preparation);
  const saved = existing
    ? { ...existing, computed: false as const }
    : await saveComputedResult(input.services, prepared.preparation, input.compute, now, input.cultureBinding ?? null);
  return complete(input.services, prepared.preparation, saved, now);
}

/** Resume the exact prepared event. An existing event always wins over re-computation. */
export async function resumeHopV55ScenarioCommit(input: HopV55ScenarioResumeInput): Promise<HopV55ScenarioCommitResult> {
  if (!input || !input.services || !isId(input.ownerKey) || !isId(input.workspaceId) || !isId(input.preparationId)
    || input.services.ownerKey !== input.ownerKey) fail('invalidInput', 'Compte, workspace et préparation sont requis pour reprendre le commit J5.');
  const workspace = await latestWorkspace(input.services, input.ownerKey, input.workspaceId);
  const rawPreparation = workspaceRows(workspace).find(row => row.id === input.preparationId);
  if (!rawPreparation) fail('preparationNotFound', 'Aucune préparation J5 avec cet identifiant dans le workspace relu.');
  const read = readHopV55ScenarioPreparation(rawPreparation);
  if (read.status === 'unsupportedFormat') fail('unsupportedPreparationFormat', read.reason);
  if (read.status !== 'available') fail('invalidInput', read.reason);
  const preparation = read.preparation;
  assertPreparationWorkspace(preparation, workspace);

  const existing = await readSavedResult(input.services, preparation);
  if (existing) {
    return complete(input.services, preparation, { ...existing, computed: false }, input.now ?? (() => new Date().toISOString()));
  }
  if (!input.compute) fail('scenarioUnavailable', 'Aucun résultat sauvegardé n’existe; cette préparation ne peut reprendre sans acte explicite de calcul.');
  if (!Object.prototype.hasOwnProperty.call(input, 'freshCultureBinding') || input.freshCultureBinding === undefined) {
    fail('referenceMismatch', 'Toute nouvelle reprise de calcul J5 doit déclarer explicitement le binding NR courant ou son absence.');
  }
  assertFreshResume(preparation, input.freshRequest, input.freshSource, input.freshRuntimeReference,
    workspace, input.freshCultureBinding);
  const now = input.now ?? (() => new Date().toISOString());
  const saved = await saveComputedResult(input.services, preparation, input.compute, now, input.freshCultureBinding);
  return complete(input.services, preparation, saved, now);
}
