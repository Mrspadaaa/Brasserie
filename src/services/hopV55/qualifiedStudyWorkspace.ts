import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import type { HopDecisionStudySnapshotV2, CreateHopDecisionDossierV2Input,
  HopDecisionDossierRead, HopDecisionEventRead, HopDecisionEventV2 } from '../../domain/hopDecision/dossier';
import { createHopDecisionDossierV2 } from '../../domain/hopDecision/dossier';
import { assertHopAdviceDossierCreateInput, hopAdviceStudyReference, type CreateHopAdviceDossierInput, type HopAdviceDossierRead,
  type HopAdviceDossierV3,
  type HopAdviceEventRead, type HopAdviceEventV3, type HopAdviceStudyV3 } from '../../domain/hopDecision/adviceDossier';
import type { HopProcessStage } from '../../domain/hopDecision/types';
import type { HopDecisionLocalRepository } from '../hopDecisionLocalRepository';
import { readHopV55DecisionReadingArchive } from './decisionArchive';
import type { HopV55DecisionReadingArchive } from './decisionArchive';
import type { HopV55QualifiedAdviceFutureStageV1, HopV55QualifiedAdviceStudyPreparationV2 } from './qualifiedStudyPreparation';
import type { HopV55Workspace, HopV55WorkspaceRepository } from './contracts';
import { hopV55DecisionReadingScopesV1 } from './decisionReadingAccessors';
import type { HopV55QuestionScopeCoverageV1, HopV55QuestionScopeLedgerV1 } from './questionScopeReading';
import { HopV55OperationValidationScope, hopV55QualifiedContentReference, sameCanonicalData } from './operationScopedQualifiedValidation';

export const HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT = 'hop-v55-qualified-study-preparation-v1' as const;
export const HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT = 'hop-v55-qualified-study-preparation-v2' as const;
export const HOP_V55_QUALIFIED_STUDY_LINK_V1_FORMAT = 'hop-v55-qualified-study-link-v1' as const;
export const HOP_V55_QUALIFIED_ADVICE_PREPARATION_CONTEXT_V1_FORMAT = 'hop-v55-qualified-advice-preparation-context-v1' as const;

export type HopV55QualifiedStudyCreateCommandV1 =
  | ({ kind: 'products' } & CreateHopDecisionDossierV2Input)
  | ({ kind: 'advice' } & CreateHopAdviceDossierInput);

/** Host-only replay context; never copied into the domain create command. */
export interface HopV55QualifiedAdvicePreparationContextV1 {
  format: typeof HOP_V55_QUALIFIED_ADVICE_PREPARATION_CONTEXT_V1_FORMAT;
  explicitFutureStage?: HopV55QualifiedAdviceFutureStageV1;
}

export interface HopV55QualifiedStudyPreparationV1 {
  format: typeof HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT;
  id: string;
  kind: HopV55QualifiedStudyCreateCommandV1['kind'];
  formatVersion: 2 | 3;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparedReference: string;
  dossierId: string;
  eventId: string;
  recordedAt: string;
  studyReference: string;
  /** Exact domain create input, saved before HopDecisionLocalRepository.create. */
  createCommand: HopV55QualifiedStudyCreateCommandV1;
  /** Optional host replay context for advice studies; absent from historical preparations and product studies. */
  advicePreparationContext?: HopV55QualifiedAdvicePreparationContextV1;
  reference: string;
}

/**
 * V2 preserves the exact scope evaluation that accompanied a qualified advice
 * study. It never changes the domain create command and is not projected again
 * when an archived preparation is reopened.
 */
export interface HopV55QualifiedStudyPreparationV2 extends Omit<HopV55QualifiedStudyPreparationV1, 'format' | 'reference'> {
  format: typeof HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT;
  scopeLedgerReference: string;
  scopeCoverage: HopV55QuestionScopeCoverageV1[];
  /** The full qualification DTO returned by the V2 preparer, preserved byte-for-byte in meaning. */
  qualifiedPreparation: HopV55QualifiedAdviceStudyPreparationV2;
  reference: string;
}

export type HopV55QualifiedStudyPreparationRecord = HopV55QualifiedStudyPreparationV1 | HopV55QualifiedStudyPreparationV2;

export interface HopV55QualifiedStudyLinkV1 {
  format: typeof HOP_V55_QUALIFIED_STUDY_LINK_V1_FORMAT;
  id: string;
  kind: HopV55QualifiedStudyCreateCommandV1['kind'];
  formatVersion: 2 | 3;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparationReference: string;
  dossierId: string;
  eventId: string;
  studyReference: string;
  reference: string;
}

export interface HopV55QualifiedStudyUnknownRecord {
  format: string;
  readonly [key: string]: unknown;
}

export type HopV55QualifiedStudyPreparationHistoryEntry = HopV55QualifiedStudyPreparationRecord | HopV55QualifiedStudyUnknownRecord;
export type HopV55QualifiedStudyLinkHistoryEntry = HopV55QualifiedStudyLinkV1 | HopV55QualifiedStudyUnknownRecord;
export type HopV55QualifiedStudyFreshness =
  | { status: 'current' }
  | { status: 'historical'; reason: string };
export type HopV55QualifiedStudyLinkStatus = 'linked' | 'alreadyLinked' | 'recoveredHistorical';

export interface PersistHopV55QualifiedStudyResult {
  status: HopV55QualifiedStudyLinkStatus;
  freshContext: HopV55QualifiedStudyFreshness;
  repositoryStatus: 'created' | 'duplicate';
  preparation: HopV55QualifiedStudyPreparationRecord;
  link: HopV55QualifiedStudyLinkV1;
  dossier: HopDecisionDossierRead | HopAdviceDossierRead;
  events: Array<HopDecisionEventRead | HopAdviceEventRead>;
  /** The first immutable studySaved event; dossier.revision may already be greater than 1. */
  studySavedEvent: HopDecisionEventV2 | HopAdviceEventV3;
  workspace: HopV55Workspace;
}

/**
 * Optional operation scope. Only a frozen preparation captured and validated by
 * this same open scope skips a repeated strict validation; any other object is
 * validated again.
 */
export interface HopV55QualifiedStudyOperationOptionsV1 {
  scope?: HopV55OperationValidationScope;
  /** Stored rows entering a fresh parse never consume an earlier row certificate. */
  revalidate?: boolean;
}

/** Opaque proof returned only after strict validation of one workspace object. */
export interface HopV55QualifiedStudyCollectionsIndexV1 {
  readonly format: 'hop-v55-qualified-study-collections-index-v1';
}

export interface HopV55QualifiedStudyCollectionsIndexViewV1 {
  sourceReadingReferences: ReadonlySet<string>;
  preparations: ReadonlyMap<object, HopV55QualifiedStudyPreparationRecord>;
  preparationsByReference: ReadonlyMap<string, HopV55QualifiedStudyPreparationRecord>;
  links: ReadonlyMap<object, HopV55QualifiedStudyLinkV1>;
  linksByPreparationReference: ReadonlyMap<string, HopV55QualifiedStudyLinkV1>;
}

export type IndexedWorkspace = Pick<HopV55Workspace, 'id' | 'ownerKey' | 'revision' | 'decisionReadings'
  | 'qualifiedStudyPreparations' | 'qualifiedStudyLinks'>;
interface HopV55QualifiedStudyCollectionsIndexStateV1 extends HopV55QualifiedStudyCollectionsIndexViewV1 {
  workspace: IndexedWorkspace;
  snapshot: IndexedWorkspace;
  scopeLedgersByReading?: ReadonlyMap<string, HopV55QuestionScopeLedgerV1>;
  sourceRuntimeReferencesByReading?: ReadonlyMap<string, string>;
}
const qualifiedStudyCollectionsIndexStates = new WeakMap<object, HopV55QualifiedStudyCollectionsIndexStateV1>();
// Ephemeral certificates for exact rows from a strict workspace parse. They are
// not keyed by reference/revision/content and never carry freshness authority.
// Each fresh parse ignores them; a later consumer of that same mutable row must
// prove its whole content equal to the private detached validated snapshot.
const qualifiedPreparationRowCertificates = new WeakMap<object, HopV55QualifiedStudyPreparationRecord>();

function indexedWorkspaceData(workspace: IndexedWorkspace): IndexedWorkspace {
  const { id, ownerKey, revision, decisionReadings, qualifiedStudyPreparations, qualifiedStudyLinks } = workspace;
  return { id, ownerKey, revision, decisionReadings, qualifiedStudyPreparations, qualifiedStudyLinks };
}

function collectionsIndexState(index: HopV55QualifiedStudyCollectionsIndexV1 | undefined,
  workspace: IndexedWorkspace): HopV55QualifiedStudyCollectionsIndexStateV1 | undefined {
  if (!index || typeof index !== 'object') return undefined;
  const state = qualifiedStudyCollectionsIndexStates.get(index);
  if (!state || state.workspace !== workspace) return undefined;
  try { return sameCanonicalData(state.snapshot, indexedWorkspaceData(workspace)) ? state : undefined; }
  catch { return undefined; }
}

/** Returns detached maps only for the exact workspace object that was validated. */
export function readHopV55QualifiedStudyCollectionsIndexV1(index: HopV55QualifiedStudyCollectionsIndexV1 | undefined,
  workspace: IndexedWorkspace): HopV55QualifiedStudyCollectionsIndexViewV1 | undefined {
  const state = collectionsIndexState(index, workspace);
  if (!state) return undefined;
  // Containers and their values are detached; one returned view may share its
  // own values between maps, but none can mutate the workspace/private index.
  const copies = new Map<object, unknown>();
  const detached = <K, V extends object>(rows: ReadonlyMap<K, V>): Map<K, V> => new Map([...rows].map(([key, value]) => {
    if (!copies.has(value)) copies.set(value, clone(value));
    return [key, copies.get(value) as V];
  }));
  return {
    sourceReadingReferences: new Set(state.sourceReadingReferences),
    preparations: detached(state.preparations),
    preparationsByReference: detached(state.preparationsByReference),
    links: detached(state.links),
    linksByPreparationReference: detached(state.linksByPreparationReference),
  };
}

export class HopV55QualifiedStudyWorkspaceError extends Error {
  constructor(readonly code: 'invalidInput' | 'notFound' | 'staleRevision' | 'eventConflict' | 'unsupportedFormat' | 'invalidStoredRecord', message: string) {
    super(message);
    this.name = 'HopV55QualifiedStudyWorkspaceError';
  }
}

type Row = Record<string, any>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const clone = <T,>(value: T): T => structuredClone(value);
const validInstant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));
/** Module-private: only this module's strict validator can register a preparation in a scope. */
const PREPARATION_SCOPE_KIND = Symbol('hop-v55-qualified-study-preparation');

function onlyKeys(value: Row, keys: readonly string[], label: string): void {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `${label} contient une clé inconnue.`);
}

const adviceStageValues: readonly HopProcessStage[] = ['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'];

function assertHopV55QualifiedAdvicePreparationContextV1(value: unknown): asserts value is HopV55QualifiedAdvicePreparationContextV1 {
  if (!isRow(value) || value.format !== HOP_V55_QUALIFIED_ADVICE_PREPARATION_CONTEXT_V1_FORMAT) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Contexte de préparation advice V1 illisible ou inconnu.');
  }
  onlyKeys(value, ['format', 'explicitFutureStage'], 'Contexte de préparation advice V1');
  if (value.explicitFutureStage === undefined) return;
  const stage = value.explicitFutureStage;
  if (!isRow(stage)) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Stade futur explicite illisible.');
  onlyKeys(stage, ['kind', 'stage', 'basis'], 'Stade futur explicite');
  if (stage.kind !== 'futureExploration' || !adviceStageValues.includes(stage.stage as HopProcessStage) || !text(stage.basis)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Stade futur explicite incomplet ou invalide.');
  }
}

export function createHopV55QualifiedAdvicePreparationContextV1(input: {
  explicitFutureStage?: HopV55QualifiedAdviceFutureStageV1;
} = {}): HopV55QualifiedAdvicePreparationContextV1 {
  const context: HopV55QualifiedAdvicePreparationContextV1 = {
    format: HOP_V55_QUALIFIED_ADVICE_PREPARATION_CONTEXT_V1_FORMAT,
    ...(input.explicitFutureStage ? { explicitFutureStage: clone(input.explicitFutureStage) } : {}),
  };
  assertHopV55QualifiedAdvicePreparationContextV1(context);
  return clone(context);
}

export function readHopV55QualifiedAdvicePreparationContextV1(value: unknown):
  | { status: 'available'; context: HopV55QualifiedAdvicePreparationContextV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  if (isRow(value) && typeof value.format === 'string'
    && value.format.startsWith('hop-v55-qualified-advice-preparation-context-')
    && value.format !== HOP_V55_QUALIFIED_ADVICE_PREPARATION_CONTEXT_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur de contexte advice conservé brut.' };
  }
  assertHopV55QualifiedAdvicePreparationContextV1(value);
  return { status: 'available', context: clone(value) };
}

function preparationReference(value: Omit<HopV55QualifiedStudyPreparationV1, 'reference'> | HopV55QualifiedStudyPreparationV1): string {
  const { reference: _reference, ...body } = value as HopV55QualifiedStudyPreparationV1;
  return hopV55QualifiedContentReference(HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT, body);
}

function preparationReferenceV2(value: Omit<HopV55QualifiedStudyPreparationV2, 'reference'> | HopV55QualifiedStudyPreparationV2): string {
  const { reference: _reference, ...body } = value as HopV55QualifiedStudyPreparationV2;
  return hopV55QualifiedContentReference(HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT, body);
}

function linkReference(value: Omit<HopV55QualifiedStudyLinkV1, 'reference'> | HopV55QualifiedStudyLinkV1): string {
  const { reference: _reference, ...body } = value as HopV55QualifiedStudyLinkV1;
  return hopAdviceContentReference(HOP_V55_QUALIFIED_STUDY_LINK_V1_FORMAT, body);
}

/**
 * Strictly validates a create command and returns the study reference that the
 * domain validator has just recomputed from the study content.
 */
function verifyCreateCommand(value: unknown): string {
  if (!isRow(value) || (value.kind !== 'products' && value.kind !== 'advice')) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Commande d’étude qualifiée inconnue.');
  }
  onlyKeys(value, ['kind', 'ownerKey', 'dossierId', 'eventId', 'recordedAt', 'study', 'supersedesDossierId'], 'Commande d’étude');
  if (!text(value.ownerKey) || !text(value.dossierId) || !text(value.eventId) || !validInstant(value.recordedAt)
    || value.supersedesDossierId !== undefined && (!text(value.supersedesDossierId) || value.supersedesDossierId === value.dossierId)
    || !isRow(value.study)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Commande d’étude qualifiée incomplète.');
  }
  if (value.kind === 'products') {
    const study = value.study as HopDecisionStudySnapshotV2;
    if (study.formatVersion !== 2 || study.actionKind !== 'understandProducts'
      || study.request?.action?.kind !== 'understandProducts') {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Une étude produit doit être une étude qualifiée V2 understandProducts.');
    }
    const { kind: _kind, ...createInput } = value;
    try { createHopDecisionDossierV2(clone(createInput) as unknown as CreateHopDecisionDossierV2Input); }
    catch (error) { throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `Étude produit V2 invalide : ${(error as Error).message}`); }
    return hopDecisionReference(value.study);
  }
  const study = value.study as HopAdviceStudyV3;
  if (study.formatVersion !== 3 || study.kind !== 'advice' || study.requestSnapshot?.action?.kind !== 'exploreStrategies') {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Une étude de stratégie doit être une HopAdviceStudyV3 exploreStrategies.');
  }
  const { kind: _kind, ...createInput } = value;
  // The same domain checks as createHopAdviceDossier, without materialising a dossier copy.
  try { return assertHopAdviceDossierCreateInput(createInput as unknown as CreateHopAdviceDossierInput); }
  catch (error) { throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `Étude de stratégie V3 invalide : ${(error as Error).message}`); }
}

interface PreparationCheckOptions {
  /** Internal only: the caller sealed `reference` from this exact body in the same synchronous step. */
  referenceComputedHere?: boolean;
  /** Internal only: this exact private command object was verified in the same synchronous step. */
  verifiedCreateCommand?: { command: unknown; studyReference: string };
}

function assertPreparationV1(value: unknown, options: PreparationCheckOptions = {}): asserts value is HopV55QualifiedStudyPreparationV1 {
  if (!isRow(value) || value.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT || !text(value.id)
    || (value.kind !== 'products' && value.kind !== 'advice') || ![2, 3].includes(value.formatVersion)
    || !text(value.ownerKey) || !text(value.workspaceId) || !text(value.sourceReadingReference)
    || !text(value.preparedReference) || !text(value.dossierId) || !text(value.eventId) || !validInstant(value.recordedAt)
    || !text(value.studyReference) || !text(value.reference)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Préparation d’étude qualifiée invalide.');
  }
  onlyKeys(value, ['format', 'id', 'kind', 'formatVersion', 'ownerKey', 'workspaceId', 'sourceReadingReference',
    'preparedReference', 'dossierId', 'eventId', 'recordedAt', 'studyReference', 'createCommand', 'advicePreparationContext', 'reference'],
  'Préparation d’étude qualifiée');
  const verifiedStudyReference = options.verifiedCreateCommand && options.verifiedCreateCommand.command === value.createCommand
    ? options.verifiedCreateCommand.studyReference : verifyCreateCommand(value.createCommand);
  const command = value.createCommand as HopV55QualifiedStudyCreateCommandV1;
  const expectedFormatVersion = command.kind === 'products' ? 2 : 3;
  const hasAdviceContext = Object.prototype.hasOwnProperty.call(value, 'advicePreparationContext');
  let unsupportedContextReason: string | undefined;
  if (hasAdviceContext) {
    if (command.kind !== 'advice') {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Un contexte de préparation advice ne peut pas accompagner une étude produit.');
    }
    const contextRead = readHopV55QualifiedAdvicePreparationContextV1(value.advicePreparationContext);
    if (contextRead.status === 'unsupportedReadOnly') unsupportedContextReason = contextRead.reason;
    else if (contextRead.context.explicitFutureStage
      && contextRead.context.explicitFutureStage.stage !== command.study.requestSnapshot.action.situation.stage) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Le stade futur conservé diffère du stade exact de l’étude advice.');
    }
  }
  if (value.kind !== command.kind || value.formatVersion !== expectedFormatVersion
    || value.ownerKey !== command.ownerKey || value.dossierId !== command.dossierId
    || value.eventId !== command.eventId || value.recordedAt !== command.recordedAt
    || value.studyReference !== verifiedStudyReference
    || !options.referenceComputedHere && preparationReference(value as unknown as HopV55QualifiedStudyPreparationV1) !== value.reference) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Préparation scellée différente de sa commande ou de ses identités exactes.');
  }
  if (unsupportedContextReason) throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', unsupportedContextReason);
}

function assertScopeCoverageSpan(value: unknown, label: string): void {
  if (!isRow(value)) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `${label} de portée invalide.`);
  onlyKeys(value, ['start', 'end', 'text'], label);
  if (!Number.isSafeInteger(value.start) || value.start < 0 || !Number.isSafeInteger(value.end)
    || value.end <= value.start || !text(value.text)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `${label} de portée incomplet.`);
  }
}

function assertScopeCoverage(value: unknown): asserts value is HopV55QuestionScopeCoverageV1 {
  if (!isRow(value) || !text(value.scopeId) || !['employmentTiming', 'materialSelection'].includes(String(value.kind))
    || !['open', 'retained', 'excluded'].includes(String(value.disposition))
    || !['proposal', 'brasseur'].includes(String(value.origin))
    || !['bounded', 'unresolved', 'excluded'].includes(String(value.coverage)) || !text(value.reason)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Couverture de portée V2 invalide.');
  }
  onlyKeys(value, ['scopeId', 'kind', 'disposition', 'sourceSpan', 'focusSpan', 'relatedScopeIds',
    'relatedCriterionIds', 'relatedOperationIds', 'origin', 'coverage', 'optionIds', 'materialIds', 'uses', 'reason'],
  'Couverture de portée V2');
  assertScopeCoverageSpan(value.sourceSpan, 'Ancre source');
  if (value.focusSpan !== undefined) assertScopeCoverageSpan(value.focusSpan, 'Focalisation');
  for (const key of ['relatedScopeIds', 'relatedCriterionIds', 'relatedOperationIds', 'optionIds', 'materialIds', 'uses']) {
    if (!Array.isArray(value[key]) || value[key].some(item => !text(item))) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `Liste ${key} de couverture V2 invalide.`);
    }
  }
}

function assertPreparationV2(value: unknown, options: Pick<PreparationCheckOptions, 'referenceComputedHere'> = {}):
  asserts value is HopV55QualifiedStudyPreparationV2 {
  if (!isRow(value) || value.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT
    || value.kind !== 'advice' || !text(value.scopeLedgerReference) || !Array.isArray(value.scopeCoverage)
    || !isRow(value.qualifiedPreparation) || !text(value.reference)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Préparation qualifiée V2 incomplète.');
  }
  onlyKeys(value, ['format', 'id', 'kind', 'formatVersion', 'ownerKey', 'workspaceId', 'sourceReadingReference',
    'preparedReference', 'dossierId', 'eventId', 'recordedAt', 'studyReference', 'createCommand',
    'advicePreparationContext', 'scopeLedgerReference', 'scopeCoverage', 'qualifiedPreparation', 'reference'], 'Préparation qualifiée V2');
  const scopeIds = new Set<string>();
  for (const row of value.scopeCoverage) {
    assertScopeCoverage(row);
    if (scopeIds.has(row.scopeId)) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Une portée est dupliquée dans la couverture V2.');
    scopeIds.add(row.scopeId);
  }
  const { format: _format, reference: _reference, scopeLedgerReference: _ledger, scopeCoverage: _coverage,
    qualifiedPreparation: _qualifiedPreparation, ...base } = value;
  const legacyBody = { ...base, format: HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT } as Omit<HopV55QualifiedStudyPreparationV1, 'reference'>;
  const legacy = { ...legacyBody, reference: preparationReference(legacyBody) };
  // `legacy.reference` was just sealed from legacyBody; re-hashing it here would be a tautology.
  assertPreparationV1(legacy, { referenceComputedHere: true });
  const qualified = value.qualifiedPreparation;
  const qualifiedKeys = ['format', 'kind', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'sourceRuntimeReference',
    'sourceContext', 'sourceContextReference', 'qualificationInputReference', 'preparedReference', 'action', 'explicitFutureStage',
    'study', 'preparation', 'advicePreparationContext', 'scopeLedgerReference', 'scopeCoverage', 'reference'];
  onlyKeys(qualified, qualifiedKeys, 'DTO qualifié V2');
  const { reference: _qualifiedReference, ...qualifiedBody } = qualified;
  if (qualified.format !== 'hop-v55-qualified-advice-study-preparation-v2' || qualified.kind !== 'advice'
    || !text(qualified.ownerKey) || !text(qualified.workspaceId) || !text(qualified.sourceReadingReference)
    || !text(qualified.sourceRuntimeReference) || !text(qualified.sourceContextReference)
    || !text(qualified.qualificationInputReference) || !text(qualified.preparedReference)
    || !text(qualified.scopeLedgerReference) || !Array.isArray(qualified.scopeCoverage)
    || !text(qualified.reference) || !isRow(qualified.preparation) || !isRow(qualified.study)
    || !isRow(qualified.action)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'DTO qualifié V2 incomplet ou futur.');
  }
  // When the nested preparation is exactly the plain data of the legacy projection
  // validated above, its verdict is that same verdict. Otherwise the historical
  // order is kept: strict validation of the nested record, then the divergence check.
  const nestedIsLegacy = sameCanonicalData(qualified.preparation, legacy);
  if (!nestedIsLegacy) assertPreparationV1(qualified.preparation);
  if (!(nestedIsLegacy || sameValue(qualified.preparation, legacy)) || !sameValue(qualified.scopeCoverage, value.scopeCoverage)
    || qualified.scopeLedgerReference !== value.scopeLedgerReference
    || qualified.ownerKey !== value.ownerKey || qualified.workspaceId !== value.workspaceId
    || qualified.sourceReadingReference !== value.sourceReadingReference || qualified.preparedReference !== value.preparedReference
    || qualified.study.reference !== value.studyReference
    || qualified.reference !== hopV55QualifiedContentReference('hop-v55-qualified-advice-study-preparation-v2', qualifiedBody)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Le DTO qualifié V2 diverge de sa couverture, de ses références ou de la commande scellée.');
  }
  if (!options.referenceComputedHere
    && value.reference !== preparationReferenceV2(value as unknown as HopV55QualifiedStudyPreparationV2)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Référence de préparation qualifiée V2 incohérente.');
  }
}

function assertPreparation(value: unknown, options: HopV55QualifiedStudyOperationOptionsV1 = {}): asserts value is HopV55QualifiedStudyPreparationRecord {
  if (options.scope?.has(PREPARATION_SCOPE_KIND, value)) return;
  if (options.scope) {
    options.scope.validateCopy(PREPARATION_SCOPE_KIND, value, row => { assertPreparation(row); });
    return;
  }
  if (isRow(value) && value.format === HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT) assertPreparationV2(value);
  else assertPreparationV1(value);
}

function assertLink(value: unknown): asserts value is HopV55QualifiedStudyLinkV1 {
  if (!isRow(value) || value.format !== HOP_V55_QUALIFIED_STUDY_LINK_V1_FORMAT || !text(value.id)
    || (value.kind !== 'products' && value.kind !== 'advice') || ![2, 3].includes(value.formatVersion)
    || !text(value.ownerKey) || !text(value.workspaceId) || !text(value.sourceReadingReference)
    || !text(value.preparationReference) || !text(value.dossierId) || !text(value.eventId)
    || !text(value.studyReference) || !text(value.reference)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Lien d’étude qualifiée invalide.');
  }
  onlyKeys(value, ['format', 'id', 'kind', 'formatVersion', 'ownerKey', 'workspaceId', 'sourceReadingReference',
    'preparationReference', 'dossierId', 'eventId', 'studyReference', 'reference'], 'Lien d’étude qualifiée');
  if ((value.kind === 'products' ? 2 : 3) !== value.formatVersion
    || linkReference(value as unknown as HopV55QualifiedStudyLinkV1) !== value.reference) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Lien d’étude qualifiée ou sa référence est incohérent.');
  }
}

export function createHopV55QualifiedStudyPreparationV1(input: {
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparedReference: string;
  createCommand: HopV55QualifiedStudyCreateCommandV1;
  advicePreparationContext?: HopV55QualifiedAdvicePreparationContextV1;
}): HopV55QualifiedStudyPreparationV1 {
  let command: HopV55QualifiedStudyCreateCommandV1;
  try { command = clone(input.createCommand); }
  catch (error) {
    // A non-clonable command keeps the validator's own refusal.
    verifyCreateCommand(input.createCommand);
    throw error;
  }
  // The private copy is the object that is verified, sealed and returned below.
  const studyReference = verifyCreateCommand(command);
  const advicePreparationContext = input.advicePreparationContext === undefined
    ? undefined : readHopV55QualifiedAdvicePreparationContextV1(input.advicePreparationContext);
  if (advicePreparationContext?.status === 'unsupportedReadOnly') {
    throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', advicePreparationContext.reason);
  }
  const body: Omit<HopV55QualifiedStudyPreparationV1, 'reference'> = {
    format: HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT, id: input.id,
    kind: command.kind, formatVersion: command.kind === 'products' ? 2 : 3,
    ownerKey: input.ownerKey, workspaceId: input.workspaceId, sourceReadingReference: input.sourceReadingReference,
    preparedReference: input.preparedReference, dossierId: command.dossierId, eventId: command.eventId,
    recordedAt: command.recordedAt, studyReference, createCommand: command,
    ...(advicePreparationContext?.status === 'available' ? { advicePreparationContext: advicePreparationContext.context } : {}),
  };
  const record = { ...body, reference: preparationReference(body) };
  assertPreparationV1(record, { referenceComputedHere: true, verifiedCreateCommand: { command, studyReference } });
  // Built only from this call's private copies: no other holder can alter it, so it is returned as is.
  return record;
}

export function createHopV55QualifiedStudyPreparationV2(input: {
  qualifiedPreparation: HopV55QualifiedAdviceStudyPreparationV2;
}): HopV55QualifiedStudyPreparationV2 {
  const qualifiedPreparation = clone(input.qualifiedPreparation);
  if (!isRow(qualifiedPreparation) || !isRow(qualifiedPreparation.preparation)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Un DTO qualifié V2 complet est requis.');
  }
  const basePreparation = qualifiedPreparation.preparation as HopV55QualifiedStudyPreparationV1;
  assertPreparationV1(basePreparation);
  if (basePreparation.kind !== 'advice' || !text(qualifiedPreparation.scopeLedgerReference)
    || !Array.isArray(qualifiedPreparation.scopeCoverage)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Une préparation V2 exige un conseil advice et sa couverture de portées exacte.');
  }
  const { format: _format, reference: _reference, ...common } = clone(basePreparation);
  const body: Omit<HopV55QualifiedStudyPreparationV2, 'reference'> = {
    format: HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT,
    ...common,
    scopeLedgerReference: qualifiedPreparation.scopeLedgerReference,
    scopeCoverage: clone(qualifiedPreparation.scopeCoverage),
    qualifiedPreparation,
  };
  const preparationV2 = { ...body, reference: preparationReferenceV2(body) };
  // The V2 reference was sealed from this private body just above; every other V2 check still runs.
  assertPreparationV2(preparationV2, { referenceComputedHere: true });
  return preparationV2;
}

export type HopV55QualifiedStudyPreparationDecode =
  | { status: 'available'; preparation: HopV55QualifiedStudyPreparationRecord }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };
type PreparationDecode = HopV55QualifiedStudyPreparationDecode;

function isFuturePreparationFormat(value: unknown): boolean {
  return isRow(value) && typeof value.format === 'string'
    && value.format.startsWith('hop-v55-qualified-study-preparation-')
    && value.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT
    && value.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT;
}

const FUTURE_PREPARATION_REASON = 'Format futur de préparation qualifiée conservé brut.';

function unsupportedContextRefusal(error: unknown, value: unknown): string | undefined {
  return error instanceof HopV55QualifiedStudyWorkspaceError && error.code === 'unsupportedFormat'
    && isRow(value) && Object.prototype.hasOwnProperty.call(value, 'advicePreparationContext') ? error.message : undefined;
}

/**
 * Strict decode with the exact semantics of readHopV55QualifiedStudyPreparation,
 * but returning the validated input row itself instead of a copy. It creates no
 * new alias: use it only for synchronous checks that neither retain nor mutate
 * the row.
 */
export function decodeHopV55QualifiedStudyPreparationRow(value: unknown, options: HopV55QualifiedStudyOperationOptionsV1 = {}): PreparationDecode {
  if (isFuturePreparationFormat(value)) return { status: 'unsupportedReadOnly', snapshot: value, reason: FUTURE_PREPARATION_REASON };
  const certificate = !options.revalidate && isRow(value) ? qualifiedPreparationRowCertificates.get(value) : undefined;
  if (certificate) {
    try { if (sameCanonicalData(value, certificate)) return { status: 'available', preparation: value as HopV55QualifiedStudyPreparationRecord }; }
    catch { /* A changed/exotic row goes through the strict validator below. */ }
  }
  try { assertPreparation(value, options); }
  catch (error) {
    const reason = unsupportedContextRefusal(error, value);
    if (reason !== undefined) return { status: 'unsupportedReadOnly', snapshot: value, reason };
    throw error;
  }
  return { status: 'available', preparation: value as HopV55QualifiedStudyPreparationRecord };
}

export function readHopV55QualifiedStudyPreparation(value: unknown, options: HopV55QualifiedStudyOperationOptionsV1 = {}):
  | { status: 'available'; preparation: HopV55QualifiedStudyPreparationRecord }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  const read = decodeHopV55QualifiedStudyPreparationRow(value, options);
  return read.status === 'available'
    ? { status: 'available', preparation: clone(read.preparation) }
    : { status: 'unsupportedReadOnly', snapshot: clone(read.snapshot), reason: read.reason };
}

/**
 * Captures a frozen copy of a preparation in an explicit operation scope after
 * the canonical strict validation of that frozen copy. Later checks in the same
 * open scope recognise only this returned object.
 */
export function captureHopV55QualifiedStudyPreparation(scope: HopV55OperationValidationScope,
  value: unknown): HopV55QualifiedStudyPreparationRecord {
  const read = capturePreparation(scope, value);
  if (read.status !== 'available') throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', read.reason);
  return read.preparation;
}

function capturePreparation(scope: HopV55OperationValidationScope, value: unknown): PreparationDecode {
  if (isFuturePreparationFormat(value)) return { status: 'unsupportedReadOnly', snapshot: value, reason: FUTURE_PREPARATION_REASON };
  try {
    return { status: 'available',
      preparation: scope.capture<HopV55QualifiedStudyPreparationRecord>(PREPARATION_SCOPE_KIND, value, frozen => { assertPreparation(frozen); }) };
  } catch (error) {
    const reason = unsupportedContextRefusal(error, value);
    if (reason !== undefined) return { status: 'unsupportedReadOnly', snapshot: value, reason };
    throw error;
  }
}

export function createHopV55QualifiedStudyLinkV1(preparation: HopV55QualifiedStudyPreparationRecord,
  options: HopV55QualifiedStudyOperationOptionsV1 = {}): HopV55QualifiedStudyLinkV1 {
  assertPreparation(preparation, options);
  const body: Omit<HopV55QualifiedStudyLinkV1, 'reference'> = {
    format: HOP_V55_QUALIFIED_STUDY_LINK_V1_FORMAT, id: preparation.id,
    kind: preparation.kind, formatVersion: preparation.formatVersion,
    ownerKey: preparation.ownerKey, workspaceId: preparation.workspaceId,
    sourceReadingReference: preparation.sourceReadingReference,
    preparationReference: preparation.reference, dossierId: preparation.dossierId,
    eventId: preparation.eventId, studyReference: preparation.studyReference,
  };
  const link = { ...body, reference: linkReference(body) };
  assertLink(link);
  return clone(link);
}

export function readHopV55QualifiedStudyLink(value: unknown):
  | { status: 'available'; link: HopV55QualifiedStudyLinkV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  if (isRow(value) && typeof value.format === 'string'
    && value.format.startsWith('hop-v55-qualified-study-link-') && value.format !== HOP_V55_QUALIFIED_STUDY_LINK_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur de lien d’étude qualifiée conservé brut.' };
  }
  assertLink(value);
  return { status: 'available', link: clone(value) };
}

function assertOpaqueScope(value: unknown, ownerKey: string, workspaceId: string,
  sourceReadingReferences: ReadonlySet<string>, label: string): void {
  if (!isRow(value)) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `${label} futur illisible.`);
  if (value.ownerKey !== undefined && value.ownerKey !== ownerKey
    || value.workspaceId !== undefined && value.workspaceId !== workspaceId) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `${label} futur d’un owner/workspace différent.`);
  }
  if (value.sourceReadingReference !== undefined
    && (!text(value.sourceReadingReference) || !sourceReadingReferences.has(value.sourceReadingReference))) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `${label} futur sans archive de lecture exacte.`);
  }
}

interface ArchiveIndex {
  available: HopV55DecisionReadingArchive[];
  scopeLedgersByReading: Map<string, HopV55QuestionScopeLedgerV1>;
  sourceRuntimeReferencesByReading: Map<string, string>;
}

/** One strict pass over the archives instead of one pass per derived map. */
function archiveIndexFromWorkspace(workspace: Pick<HopV55Workspace, 'decisionReadings'>): ArchiveIndex {
  const index: ArchiveIndex = { available: [], scopeLedgersByReading: new Map(), sourceRuntimeReferencesByReading: new Map() };
  for (const raw of workspace.decisionReadings ?? []) {
    const read = readHopV55DecisionReadingArchive(raw);
    if (read.status !== 'available') continue;
    index.available.push(read.archive);
    const scopes = hopV55DecisionReadingScopesV1(read.archive);
    if (scopes) index.scopeLedgersByReading.set(read.archive.contentReference, scopes.scopeLedger);
    index.sourceRuntimeReferencesByReading.set(read.archive.contentReference, read.archive.runtimeReference);
  }
  return index;
}

function assertPreparationScopeCoverage(preparation: HopV55QualifiedStudyPreparationRecord,
  scopeLedgers: ReadonlyMap<string, HopV55QuestionScopeLedgerV1> | undefined,
  sourceRuntimeReferences: ReadonlyMap<string, string> | undefined): void {
  if (preparation.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT) return;
  const ledger = scopeLedgers?.get(preparation.sourceReadingReference);
  const runtimeReference = sourceRuntimeReferences?.get(preparation.sourceReadingReference);
  if (!ledger || ledger.reference !== preparation.scopeLedgerReference) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput',
      'La couverture V2 ne cite pas le ledger exact de l’archive source persistée.');
  }
  if (!runtimeReference || preparation.qualifiedPreparation.sourceRuntimeReference !== runtimeReference) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput',
      'Le DTO qualifié V2 ne cite pas le runtime exact de l’archive source persistée.');
  }
  const scopes = new Map(ledger.sourceScopes.map(scope => [scope.id, scope]));
  const latest = new Map<string, HopV55QuestionScopeLedgerV1['entries'][number]>();
  for (const entry of ledger.entries) latest.set(entry.scopeId, entry);
  if (preparation.scopeCoverage.length !== scopes.size) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'La couverture V2 ne contient pas chaque portée source exactement une fois.');
  }
  for (const row of preparation.scopeCoverage) {
    const source = scopes.get(row.scopeId), decision = latest.get(row.scopeId);
    const active = decision?.status === 'excluded' ? source : decision?.activeScope ?? source;
    if (!source || !decision || row.kind !== source.kind || row.disposition !== decision.status
      || !active || !sameValue(row.sourceSpan, source.sourceSpan)
      || !sameValue(row.focusSpan ?? null, active.focusSpan ?? null)
      || !sameValue(row.relatedScopeIds, active.relatedScopeIds)
      || !sameValue(row.relatedCriterionIds, active.relatedCriterionIds)
      || !sameValue(row.relatedOperationIds, active.relatedOperationIds)
      || row.origin !== active.origin
      || (row.disposition === 'excluded') !== (row.coverage === 'excluded')) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput',
        'La couverture V2 ne correspond pas aux portées et dispositions du ledger source exact.');
    }
  }
}

export function assertHopV55QualifiedStudyWorkspaceCollections(input: {
  ownerKey: string;
  workspaceId: string;
  sourceReadingReferences: ReadonlySet<string>;
  scopeLedgersByReading?: ReadonlyMap<string, HopV55QuestionScopeLedgerV1>;
  sourceRuntimeReferencesByReading?: ReadonlyMap<string, string>;
  preparations?: unknown;
  links?: unknown;
  workspace?: IndexedWorkspace;
  scope?: HopV55OperationValidationScope;
}): HopV55QualifiedStudyCollectionsIndexV1 {
  const preparationRows = input.preparations ?? [];
  const linkRows = input.links ?? [];
  if (!Array.isArray(preparationRows) || !Array.isArray(linkRows)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Historique des études qualifiées invalide.');
  }
  const preparationsByRow = new Map<object, HopV55QualifiedStudyPreparationRecord>();
  const preparationsByReference = new Map<string, HopV55QualifiedStudyPreparationRecord>();
  const linksByRow = new Map<object, HopV55QualifiedStudyLinkV1>();
  const linksByPreparationReference = new Map<string, HopV55QualifiedStudyLinkV1>();
  const preparationIds = new Set<string>();
  const preparationDossierIds = new Set<string>(), preparationEventIds = new Set<string>();
  const linkIds = new Set<string>(), linkReferences = new Set<string>();
  const futurePreparationSources = new Set<string>(), futureLinkSources = new Set<string>();
  for (const raw of preparationRows) {
    const read = decodeHopV55QualifiedStudyPreparationRow(raw, { scope: input.scope, revalidate: true });
    if (read.status === 'unsupportedReadOnly') {
      assertOpaqueScope(read.snapshot, input.ownerKey, input.workspaceId, input.sourceReadingReferences, 'Préparation qualifiée');
      if (isRow(read.snapshot) && typeof read.snapshot.sourceReadingReference === 'string') futurePreparationSources.add(read.snapshot.sourceReadingReference);
      if (isRow(read.snapshot) && typeof read.snapshot.id === 'string') {
        if (preparationIds.has(read.snapshot.id)) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'ID de préparation qualifiée dupliqué.');
        preparationIds.add(read.snapshot.id);
      }
      if (isRow(read.snapshot) && typeof read.snapshot.dossierId === 'string') {
        if (preparationDossierIds.has(read.snapshot.dossierId)) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'ID de dossier dans les préparations qualifiées dupliqué.');
        preparationDossierIds.add(read.snapshot.dossierId);
      }
      if (isRow(read.snapshot) && typeof read.snapshot.eventId === 'string') {
        if (preparationEventIds.has(read.snapshot.eventId)) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'ID d’événement dans les préparations qualifiées dupliqué.');
        preparationEventIds.add(read.snapshot.eventId);
      }
      continue;
    }
    const preparation = read.preparation;
    if (preparation.ownerKey !== input.ownerKey || preparation.workspaceId !== input.workspaceId
      || !input.sourceReadingReferences.has(preparation.sourceReadingReference)) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'La préparation qualifiée est liée à un autre owner/workspace ou à une lecture absente.');
    }
    assertPreparationScopeCoverage(preparation, input.scopeLedgersByReading, input.sourceRuntimeReferencesByReading);
    if (futurePreparationSources.has(preparation.sourceReadingReference)) {
      throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Une préparation future existe pour cette lecture; aucun record courant ne la remplace.');
    }
    if (preparationIds.has(preparation.id) || preparationDossierIds.has(preparation.dossierId)
      || preparationEventIds.has(preparation.eventId) || preparationsByReference.has(preparation.reference)) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'ID ou référence de préparation/dossier/événement qualifié dupliqué.');
    }
    preparationIds.add(preparation.id);
    preparationDossierIds.add(preparation.dossierId);
    preparationEventIds.add(preparation.eventId);
    preparationsByReference.set(preparation.reference, preparation);
    preparationsByRow.set(raw as object, preparation);
  }
  for (const raw of linkRows) {
    const read = readHopV55QualifiedStudyLink(raw);
    if (read.status === 'unsupportedReadOnly') {
      assertOpaqueScope(read.snapshot, input.ownerKey, input.workspaceId, input.sourceReadingReferences, 'Lien d’étude qualifiée');
      if (isRow(read.snapshot) && typeof read.snapshot.sourceReadingReference === 'string') futureLinkSources.add(read.snapshot.sourceReadingReference);
      if (isRow(read.snapshot) && typeof read.snapshot.id === 'string') {
        if (linkIds.has(read.snapshot.id)) throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'ID de lien qualifié dupliqué.');
        linkIds.add(read.snapshot.id);
      }
      continue;
    }
    const link = read.link;
    const preparation = preparationsByReference.get(link.preparationReference);
    if (link.ownerKey !== input.ownerKey || link.workspaceId !== input.workspaceId
      || !input.sourceReadingReferences.has(link.sourceReadingReference)
      || !preparation || preparation.ownerKey !== link.ownerKey || preparation.workspaceId !== link.workspaceId
      || preparation.sourceReadingReference !== link.sourceReadingReference || preparation.id !== link.id
      || preparation.kind !== link.kind || preparation.formatVersion !== link.formatVersion
      || preparation.dossierId !== link.dossierId || preparation.eventId !== link.eventId
      || preparation.studyReference !== link.studyReference) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Le lien workspace ne correspond pas à sa préparation et son archive exactes.');
    }
    if (futureLinkSources.has(link.sourceReadingReference)) {
      throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Un lien futur existe pour cette lecture; aucun lien courant ne le remplace.');
    }
    if (linkIds.has(link.id) || linkReferences.has(link.reference)) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'ID ou référence de lien qualifié dupliqué.');
    }
    linkIds.add(link.id); linkReferences.add(link.reference);
    linksByRow.set(raw as object, link);
    linksByPreparationReference.set(link.preparationReference, link);
  }
  const index: HopV55QualifiedStudyCollectionsIndexV1 = Object.freeze({ format: 'hop-v55-qualified-study-collections-index-v1' });
  if (input.workspace && input.workspace.ownerKey === input.ownerKey && input.workspace.id === input.workspaceId
    && input.workspace.qualifiedStudyPreparations === input.preparations
    && input.workspace.qualifiedStudyLinks === input.links) {
    const data = indexedWorkspaceData(input.workspace);
    try {
      const snapshot = clone(data);
      for (let index = 0; index < preparationRows.length; index++) {
        const raw = preparationRows[index];
        const copied = snapshot.qualifiedStudyPreparations?.[index];
        if (isRow(raw) && preparationsByRow.has(raw) && copied && sameCanonicalData(raw, copied)) {
          qualifiedPreparationRowCertificates.set(raw, copied as HopV55QualifiedStudyPreparationRecord);
        }
      }
      if (sameCanonicalData(data, snapshot)) qualifiedStudyCollectionsIndexStates.set(index, {
        workspace: input.workspace, snapshot, sourceReadingReferences: new Set(input.sourceReadingReferences),
        preparations: preparationsByRow, preparationsByReference, links: linksByRow, linksByPreparationReference,
        scopeLedgersByReading: input.scopeLedgersByReading
          ? new Map([...input.scopeLedgersByReading].map(([key, value]) => [key, clone(value)])) : undefined,
        sourceRuntimeReferencesByReading: input.sourceRuntimeReferencesByReading
          ? new Map(input.sourceRuntimeReferencesByReading) : undefined,
      });
    } catch { /* An opaque/exotic row is never authorized by the optional index. */ }
  }
  return index;
}

function sameValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((value, index) => sameValue(value, right[index]));
  }
  const leftRow = left as Record<string, unknown>, rightRow = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRow).sort(), rightKeys = Object.keys(rightRow).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index]
    && sameValue(leftRow[key], rightRow[key]));
}

export function appendHopV55QualifiedStudyPreparationRecord(workspace: HopV55Workspace,
  preparation: HopV55QualifiedStudyPreparationRecord, options: HopV55QualifiedStudyOperationOptionsV1 = {}): HopV55Workspace {
  assertPreparation(preparation, options);
  const archives = archiveIndexFromWorkspace(workspace);
  if (workspace.ownerKey !== preparation.ownerKey || workspace.id !== preparation.workspaceId
    || !archives.available.some(archive => archive.ownerKey === workspace.ownerKey
      && archive.workspaceId === workspace.id && archive.contentReference === preparation.sourceReadingReference)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Owner/workspace et archive de lecture doivent correspondre exactement avant la préparation.');
  }
  assertPreparationScopeCoverage(preparation, archives.scopeLedgersByReading, archives.sourceRuntimeReferencesByReading);
  const rows = workspace.qualifiedStudyPreparations ?? [];
  const existing = rows.map(row => decodeHopV55QualifiedStudyPreparationRow(row, options)).find(read => read.status === 'available'
    && read.preparation.id === preparation.id);
  if (existing?.status === 'available') {
    if (existing.preparation.reference !== preparation.reference) throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'ID de préparation déjà utilisé avec un autre payload.');
    return clone(workspace);
  }
  if (rows.some(row => isFuturePreparationFormat(row) && (row as Row).sourceReadingReference === preparation.sourceReadingReference)) {
    throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Une préparation future reste en lecture seule.');
  }
  const next = clone(workspace);
  return { ...next, qualifiedStudyPreparations: [...(next.qualifiedStudyPreparations ?? []), preparation] };
}

export function appendHopV55QualifiedStudyPreparation(workspace: HopV55Workspace,
  input: Omit<HopV55QualifiedStudyPreparationV1, 'format' | 'reference' | 'studyReference' | 'formatVersion' | 'dossierId' | 'eventId' | 'recordedAt'>
    & { createCommand: HopV55QualifiedStudyCreateCommandV1 }): HopV55Workspace {
  return appendHopV55QualifiedStudyPreparationRecord(workspace, createHopV55QualifiedStudyPreparationV1(input));
}

export function appendHopV55QualifiedStudyLink(workspace: HopV55Workspace,
  preparation: HopV55QualifiedStudyPreparationRecord, options: HopV55QualifiedStudyOperationOptionsV1 = {}): HopV55Workspace {
  assertPreparation(preparation, options);
  if (workspace.ownerKey !== preparation.ownerKey || workspace.id !== preparation.workspaceId
    || !workspace.decisionReadings?.some(archive => archive.contentReference === preparation.sourceReadingReference)
    || !workspace.qualifiedStudyPreparations?.some(row => {
      // The stored row is another object: it is always decoded strictly.
      const read = decodeHopV55QualifiedStudyPreparationRow(row, options);
      return read.status === 'available' && read.preparation.reference === preparation.reference;
    })) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'La préparation et son archive source doivent être déjà persistées dans ce workspace.');
  }
  const link = createHopV55QualifiedStudyLinkV1(preparation, options);
  const rows = workspace.qualifiedStudyLinks ?? [];
  const existing = rows.map(readHopV55QualifiedStudyLink).find(read => read.status === 'available'
    && read.link.preparationReference === preparation.reference);
  if (existing?.status === 'available') {
    if (existing.link.reference !== link.reference) throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'Préparation déjà liée avec un autre payload.');
    return clone(workspace);
  }
  if (rows.some(row => isRow(row) && typeof row.format === 'string'
    && row.format.startsWith('hop-v55-qualified-study-link-')
    && row.format !== HOP_V55_QUALIFIED_STUDY_LINK_V1_FORMAT
    && row.sourceReadingReference === preparation.sourceReadingReference)) {
    throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Un lien futur reste en lecture seule.');
  }
  const next = clone(workspace);
  return { ...next, qualifiedStudyLinks: [...(next.qualifiedStudyLinks ?? []), link] };
}

/**
 * Append-only transition. `previousIndex` may carry the collections index that
 * assertHopV55QualifiedStudyWorkspaceCollections returned for `previous` in the
 * same synchronous step; rows absent from it are decoded strictly.
 */
export function assertHopV55QualifiedStudyAppendOnly(previous: HopV55Workspace, next: HopV55Workspace, options: {
  previousIndex?: HopV55QualifiedStudyCollectionsIndexV1;
} = {}): void {
  const validatedIndex = collectionsIndexState(options.previousIndex, previous);
  const priorPreparations = previous.qualifiedStudyPreparations ?? [];
  const nextPreparations = next.qualifiedStudyPreparations ?? [];
  if (nextPreparations.length < priorPreparations.length
    || priorPreparations.some((row, index) => !sameValue(row, nextPreparations[index]))) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Une préparation d’étude qualifiée est append-only.');
  }
  const priorReadingReferences = new Set((previous.decisionReadings ?? []).map(row => row.contentReference));
  const newPreparations = nextPreparations.slice(priorPreparations.length);
  if (newPreparations.length) {
    const archives = validatedIndex?.scopeLedgersByReading && validatedIndex.sourceRuntimeReferencesByReading
      ? undefined : archiveIndexFromWorkspace(previous);
    const ledgers = validatedIndex?.scopeLedgersByReading ?? archives!.scopeLedgersByReading;
    const runtimes = validatedIndex?.sourceRuntimeReferencesByReading ?? archives!.sourceRuntimeReferencesByReading;
    for (const raw of newPreparations) {
      const read = decodeHopV55QualifiedStudyPreparationRow(raw);
      if (read.status !== 'available') throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Une préparation future ne peut pas être écrite par ce client.');
      if (!priorReadingReferences.has(read.preparation.sourceReadingReference)) {
        throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'L’archive de lecture doit être persistée avant la préparation d’étude.');
      }
      assertPreparationScopeCoverage(read.preparation, ledgers, runtimes);
    }
  }
  const priorLinks = previous.qualifiedStudyLinks ?? [];
  const nextLinks = next.qualifiedStudyLinks ?? [];
  if (nextLinks.length < priorLinks.length || priorLinks.some((row, index) => !sameValue(row, nextLinks[index]))) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Un lien d’étude qualifiée est append-only.');
  }
  const priorPrepReferences = new Set(priorPreparations.flatMap(row => {
    const known = isRow(row) ? validatedIndex?.preparations.get(row) : undefined;
    if (known) return [known.reference];
    const read = decodeHopV55QualifiedStudyPreparationRow(row);
    return read.status === 'available' ? [read.preparation.reference] : [];
  }));
  for (const raw of nextLinks.slice(priorLinks.length)) {
    const read = readHopV55QualifiedStudyLink(raw);
    if (read.status !== 'available') throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Un lien futur ne peut pas être écrit par ce client.');
    if (!priorPrepReferences.has(read.link.preparationReference)
      || !priorReadingReferences.has(read.link.sourceReadingReference)) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'La préparation et sa lecture doivent être CAS-persistées avant le lien dossier.');
    }
  }
}

export function assertHopV55QualifiedStudyWorkspace(workspace: Pick<HopV55Workspace,
  'id' | 'ownerKey' | 'revision' | 'decisionReadings' | 'qualifiedStudyPreparations' | 'qualifiedStudyLinks'>): HopV55QualifiedStudyCollectionsIndexV1 {
  const archives = archiveIndexFromWorkspace(workspace);
  const readingReferences = new Set(archives.available.flatMap(archive =>
    archive.ownerKey === workspace.ownerKey && archive.workspaceId === workspace.id ? [archive.contentReference] : []));
  return assertHopV55QualifiedStudyWorkspaceCollections({ ownerKey: workspace.ownerKey, workspaceId: workspace.id,
    sourceReadingReferences: readingReferences, scopeLedgersByReading: archives.scopeLedgersByReading,
    sourceRuntimeReferencesByReading: archives.sourceRuntimeReferencesByReading,
    preparations: workspace.qualifiedStudyPreparations,
    links: workspace.qualifiedStudyLinks, workspace });
}

export interface HopV55QualifiedStudyFreshnessCheck {
  status: 'current' | 'historical';
  reason?: string;
}

export interface HopV55QualifiedStudyFreshnessInput {
  preparation: HopV55QualifiedStudyPreparationRecord;
  phase: 'beforeCreate' | 'beforeLink' | 'alreadyLinked';
}

export type HopV55QualifiedStudyFreshnessValidator =
  (input: HopV55QualifiedStudyFreshnessInput) => Promise<HopV55QualifiedStudyFreshnessCheck>;

function normalizeFreshness(value: unknown): HopV55QualifiedStudyFreshness {
  if (!isRow(value) || value.status === 'current' && Object.keys(value).some(key => key !== 'status')
    || value.status === 'historical' && (Object.keys(value).some(key => key !== 'status' && key !== 'reason') || !text(value.reason))
    || value.status !== 'current' && value.status !== 'historical') {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Le contrôle de fraîcheur doit produire un état courant ou historique explicite.');
  }
  return value.status === 'current' ? { status: 'current' } : { status: 'historical', reason: value.reason as string };
}

function commandForRepository(preparation: HopV55QualifiedStudyPreparationRecord): CreateHopDecisionDossierV2Input | CreateHopAdviceDossierInput {
  const { kind: _kind, ...command } = preparation.createCommand;
  return clone(command as CreateHopDecisionDossierV2Input | CreateHopAdviceDossierInput);
}

function readDomainDossier(study: HopDecisionDossierRead | HopAdviceDossierRead, preparation: HopV55QualifiedStudyPreparationRecord) {
  if ('status' in study) throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Le dossier de domaine est futur ou reste en lecture seule.');
  if (study.ownerKey !== preparation.ownerKey || study.dossierId !== preparation.dossierId
    || study.formatVersion !== preparation.formatVersion
    || study.supersedesDossierId !== preparation.createCommand.supersedesDossierId) {
    throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'Le dossier local existe sous un autre owner, ID ou format.');
  }
  const reference = preparation.kind === 'products'
    ? hopDecisionReference((study as Extract<HopDecisionDossierRead, { formatVersion: 2 }>).study)
    : hopAdviceStudyReference((study as HopAdviceDossierV3).study);
  if (reference !== preparation.studyReference) {
    throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'Le dossier local possède une autre étude qualifiée.');
  }
  return study;
}

async function readDomainReceipt(repository: HopDecisionLocalRepository, preparation: HopV55QualifiedStudyPreparationRecord) {
  const dossierRaw = await repository.read(preparation.ownerKey, preparation.dossierId);
  if (!dossierRaw) return null;
  const dossier = readDomainDossier(dossierRaw, preparation);
  const events = await repository.readEvents(preparation.ownerKey, preparation.dossierId);
  if (events.some(event => 'status' in event)) throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'L’historique du dossier contient un événement futur.');
  const first = events[0];
  if (!first || 'status' in first || first.kind !== 'studySaved' || first.ownerKey !== preparation.ownerKey
    || first.dossierId !== preparation.dossierId || first.eventId !== preparation.eventId
    || first.eventFormatVersion !== preparation.formatVersion) {
    throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'Le premier studySaved du dossier ne correspond pas à la préparation exacte.');
  }
  if (first.payload.snapshotFormatVersion !== preparation.formatVersion) {
    throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'Le format du snapshot studySaved diffère de la préparation persistée.');
  }
  if (first.payload.supersedesDossierId !== preparation.createCommand.supersedesDossierId) {
    throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'La filiation du premier studySaved diffère de la préparation persistée.');
  }
  return { dossier, events, studySavedEvent: first as HopDecisionEventV2 | HopAdviceEventV3 };
}

/**
 * Finds the exact stored preparation in this freshly read workspace and captures
 * a frozen, strictly validated copy of it in `scope`. Rows are matched by their
 * stored reference before the strict decode, which then proves the reference
 * from the content.
 */
function validateStoredPreparation(workspace: HopV55Workspace, ownerKey: string, workspaceId: string,
  preparationReferenceValue: string, scope: HopV55OperationValidationScope): HopV55QualifiedStudyPreparationRecord {
  if (workspace.ownerKey !== ownerKey || workspace.id !== workspaceId) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Owner/workspace différent du rattachement préparé.');
  }
  let preparation: HopV55QualifiedStudyPreparationRecord | undefined;
  for (const row of workspace.qualifiedStudyPreparations ?? []) {
    if (!isRow(row) || row.reference !== preparationReferenceValue) continue;
    const read = capturePreparation(scope, row);
    if (read.status === 'available' && read.preparation.reference === preparationReferenceValue) { preparation = read.preparation; break; }
  }
  if (!preparation) throw new HopV55QualifiedStudyWorkspaceError('notFound', 'Préparation exacte d’étude absente du workspace.');
  const archives = archiveIndexFromWorkspace(workspace);
  assertPreparationScopeCoverage(preparation, archives.scopeLedgersByReading, archives.sourceRuntimeReferencesByReading);
  const archive = archives.available.find(row => row.contentReference === preparation!.sourceReadingReference);
  if (!archive || archive.ownerKey !== ownerKey
    || archive.workspaceId !== workspaceId || archive.contentReference !== preparation.sourceReadingReference) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'La lecture source n’est pas persistée sous son owner/workspace exact.');
  }
  return preparation;
}

function sameLink(left: HopV55QualifiedStudyLinkV1, right: HopV55QualifiedStudyLinkV1): boolean {
  return left.reference === right.reference && linkReference(left) === linkReference(right);
}

/**
 * Creates/recovers the exact durable domain study, then links it in the workspace
 * with a separate CAS. This deliberately does not claim cross-database atomicity.
 * Each attempt re-reads the workspace and captures the stored preparation in a
 * fresh operation scope; callbacks receive their own mutable copy.
 */
export async function persistHopV55QualifiedStudy(input: {
  workspaces: Pick<HopV55WorkspaceRepository, 'read' | 'save'>;
  qualifiedStudies: HopDecisionLocalRepository;
  ownerKey: string;
  workspaceId: string;
  preparationReference: string;
  validateFreshness: HopV55QualifiedStudyFreshnessValidator;
  maxLinkAttempts?: number;
  scope?: HopV55OperationValidationScope;
}): Promise<PersistHopV55QualifiedStudyResult> {
  if (!text(input.ownerKey) || !text(input.workspaceId) || !text(input.preparationReference)
    || typeof input.validateFreshness !== 'function') {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Owner/workspace/préparation et validation de fraîcheur explicite requis.');
  }
  const maxAttempts = input.maxLinkAttempts ?? 4;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 8) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Nombre de reprises CAS invalide.');
  }

  let domainResult: 'created' | 'duplicate' = 'duplicate';
  let createdInThisCall = false;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const scope = input.scope ?? new HopV55OperationValidationScope();
    try {
      const workspace = await input.workspaces.read(input.ownerKey, input.workspaceId);
      if (!workspace) throw new HopV55QualifiedStudyWorkspaceError('notFound', 'Workspace de l’étude qualifiée introuvable.');
      const preparation = validateStoredPreparation(workspace, input.ownerKey, input.workspaceId, input.preparationReference, scope);
      const freshnessFor = async (phase: HopV55QualifiedStudyFreshnessInput['phase']) =>
        normalizeFreshness(await input.validateFreshness({ preparation: clone(preparation), phase }));
      const durable = await readDomainReceipt(input.qualifiedStudies, preparation);
      let domainReceipt = durable;
      if (!domainReceipt) {
        const beforeCreate = await freshnessFor('beforeCreate');
        if (beforeCreate.status !== 'current') {
          throw new HopV55QualifiedStudyWorkspaceError('staleRevision', beforeCreate.reason || 'La source ou la qualification a changé avant la création de l’étude.');
        }
        const created = await input.qualifiedStudies.create(commandForRepository(preparation));
        domainResult = created.status;
        createdInThisCall = created.status === 'created';
        // Read the committed domain rows again. Only this durable reread may authorize a workspace link.
        domainReceipt = await readDomainReceipt(input.qualifiedStudies, preparation);
        if (!domainReceipt) throw new HopV55QualifiedStudyWorkspaceError('invalidStoredRecord', 'Le create domaine a retourné sans étude durable relisible.');
      }
      if (!createdInThisCall) domainResult = 'duplicate';

      const link = createHopV55QualifiedStudyLinkV1(preparation, { scope });
      const priorLinkRaw = workspace.qualifiedStudyLinks?.find(row => {
        const read = readHopV55QualifiedStudyLink(row);
        return read.status === 'available' && read.link.preparationReference === preparation.reference;
      });
      if (priorLinkRaw) {
        const priorLinkRead = readHopV55QualifiedStudyLink(priorLinkRaw);
        if (priorLinkRead.status !== 'available' || !sameLink(priorLinkRead.link, link)) {
          throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'Le rattachement existant porte un autre dossier/étude.');
        }
        const freshness = await freshnessFor('alreadyLinked');
        return { status: freshness.status === 'historical' ? 'recoveredHistorical' : 'alreadyLinked',
          freshContext: freshness, repositoryStatus: domainResult, preparation: clone(preparation), link: priorLinkRead.link,
          dossier: domainReceipt.dossier, events: domainReceipt.events, studySavedEvent: domainReceipt.studySavedEvent,
          workspace };
      }

      const freshness = await freshnessFor('beforeLink');
      const next = appendHopV55QualifiedStudyLink(workspace, preparation, { scope });
      try {
        const saved = await input.workspaces.save(next, workspace.revision);
        return { status: freshness.status === 'historical' ? 'recoveredHistorical' : 'linked',
          freshContext: freshness, repositoryStatus: domainResult, preparation: clone(preparation), link,
          dossier: domainReceipt.dossier, events: domainReceipt.events, studySavedEvent: domainReceipt.studySavedEvent,
          workspace: saved };
      } catch (error) {
        if ((error as { code?: unknown })?.code === 'staleRevision') { lastError = error; continue; }
        throw error;
      }
    } finally {
      if (!input.scope) scope.close();
    }
  }
  throw new HopV55QualifiedStudyWorkspaceError('staleRevision',
    `Le dossier domaine reste durable, mais le lien workspace attend une reprise CAS : ${(lastError as Error | undefined)?.message ?? 'révision modifiée'}`);
}

/**
 * Durably prepares the exact command in workspace CAS, creates the independent
 * domain dossier, then links its receipt with a second workspace CAS. A retry
 * finds the same preparation/domain IDs and never rebuilds the study. The
 * caller's preparation is captured once (frozen copy, strict validation);
 * mutating the caller's object afterwards cannot change what is stored.
 */
export async function saveHopV55QualifiedStudy(input: {
  workspaces: Pick<HopV55WorkspaceRepository, 'read' | 'save'>;
  qualifiedStudies: HopDecisionLocalRepository;
  preparation: HopV55QualifiedStudyPreparationRecord;
  validateFreshness: HopV55QualifiedStudyFreshnessValidator;
  maxPreparationAttempts?: number;
  maxLinkAttempts?: number;
  scope?: HopV55OperationValidationScope;
}): Promise<PersistHopV55QualifiedStudyResult> {
  const scope = input.scope ?? new HopV55OperationValidationScope();
  try {
    const preparation = scope.capture<HopV55QualifiedStudyPreparationRecord>(PREPARATION_SCOPE_KIND, input.preparation,
      frozen => { assertPreparation(frozen); });
    const maxPreparationAttempts = input.maxPreparationAttempts ?? 4;
    if (!Number.isSafeInteger(maxPreparationAttempts) || maxPreparationAttempts < 1 || maxPreparationAttempts > 8) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Nombre de reprises CAS de préparation invalide.');
    }
    let persisted = false;
    let lastError: unknown;
    for (let attempt = 0; attempt < maxPreparationAttempts; attempt++) {
      const workspace = await input.workspaces.read(preparation.ownerKey, preparation.workspaceId);
      if (!workspace) throw new HopV55QualifiedStudyWorkspaceError('notFound', 'Workspace source de l’étude qualifiée introuvable.');
      const existing = (workspace.qualifiedStudyPreparations ?? []).flatMap(row => {
        const read = decodeHopV55QualifiedStudyPreparationRow(row, { scope });
        return read.status === 'available' && read.preparation.id === preparation.id ? [read.preparation] : [];
      })[0];
      if (existing) {
        if (existing.reference !== preparation.reference) {
          throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'ID de préparation déjà utilisé avec un contenu différent.');
        }
        persisted = true;
        break;
      }
      const next = appendHopV55QualifiedStudyPreparationRecord(workspace, preparation, { scope });
      try {
        await input.workspaces.save(next, workspace.revision);
        persisted = true;
        break;
      } catch (error) {
        if ((error as { code?: unknown })?.code === 'staleRevision') { lastError = error; continue; }
        throw error;
      }
    }
    if (!persisted) throw new HopV55QualifiedStudyWorkspaceError('staleRevision',
      `La préparation exacte reste en attente d’un CAS workspace : ${(lastError as Error | undefined)?.message ?? 'révision modifiée'}`);
    return await persistHopV55QualifiedStudy({ workspaces: input.workspaces, qualifiedStudies: input.qualifiedStudies,
      ownerKey: preparation.ownerKey, workspaceId: preparation.workspaceId,
      preparationReference: preparation.reference, validateFreshness: input.validateFreshness,
      maxLinkAttempts: input.maxLinkAttempts, scope });
  } finally {
    if (!input.scope) scope.close();
  }
}
