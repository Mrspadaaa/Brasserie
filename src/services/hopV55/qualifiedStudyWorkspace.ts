import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import type { HopDecisionStudySnapshotV2, CreateHopDecisionDossierV2Input,
  HopDecisionDossierRead, HopDecisionEventRead, HopDecisionEventV2 } from '../../domain/hopDecision/dossier';
import { createHopDecisionDossierV2 } from '../../domain/hopDecision/dossier';
import { createHopAdviceDossier, hopAdviceStudyReference, type CreateHopAdviceDossierInput, type HopAdviceDossierRead,
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
  return hopAdviceContentReference(HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT, body);
}

function preparationReferenceV2(value: Omit<HopV55QualifiedStudyPreparationV2, 'reference'> | HopV55QualifiedStudyPreparationV2): string {
  const { reference: _reference, ...body } = value as HopV55QualifiedStudyPreparationV2;
  return hopAdviceContentReference(HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT, body);
}

function linkReference(value: Omit<HopV55QualifiedStudyLinkV1, 'reference'> | HopV55QualifiedStudyLinkV1): string {
  const { reference: _reference, ...body } = value as HopV55QualifiedStudyLinkV1;
  return hopAdviceContentReference(HOP_V55_QUALIFIED_STUDY_LINK_V1_FORMAT, body);
}

function assertCreateCommand(value: unknown): asserts value is HopV55QualifiedStudyCreateCommandV1 {
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
  } else {
    const study = value.study as HopAdviceStudyV3;
    if (study.formatVersion !== 3 || study.kind !== 'advice' || study.requestSnapshot?.action?.kind !== 'exploreStrategies') {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Une étude de stratégie doit être une HopAdviceStudyV3 exploreStrategies.');
    }
    const { kind: _kind, ...createInput } = value;
    try { createHopAdviceDossier(clone(createInput) as unknown as CreateHopAdviceDossierInput); }
    catch (error) { throw new HopV55QualifiedStudyWorkspaceError('invalidInput', `Étude de stratégie V3 invalide : ${(error as Error).message}`); }
  }
}

function studyReferenceForCommand(command: HopV55QualifiedStudyCreateCommandV1): string {
  return command.kind === 'products' ? hopDecisionReference(command.study) : hopAdviceStudyReference(command.study);
}

function assertPreparationV1(value: unknown): asserts value is HopV55QualifiedStudyPreparationV1 {
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
  assertCreateCommand(value.createCommand);
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
    || value.studyReference !== studyReferenceForCommand(command)
    || preparationReference(value as unknown as HopV55QualifiedStudyPreparationV1) !== value.reference) {
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

function assertPreparationV2(value: unknown): asserts value is HopV55QualifiedStudyPreparationV2 {
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
  assertPreparationV1(legacy);
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
  assertPreparationV1(qualified.preparation);
  if (!sameValue(qualified.preparation, legacy) || !sameValue(qualified.scopeCoverage, value.scopeCoverage)
    || qualified.scopeLedgerReference !== value.scopeLedgerReference
    || qualified.ownerKey !== value.ownerKey || qualified.workspaceId !== value.workspaceId
    || qualified.sourceReadingReference !== value.sourceReadingReference || qualified.preparedReference !== value.preparedReference
    || qualified.study.reference !== value.studyReference
    || qualified.reference !== hopAdviceContentReference('hop-v55-qualified-advice-study-preparation-v2', qualifiedBody)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Le DTO qualifié V2 diverge de sa couverture, de ses références ou de la commande scellée.');
  }
  if (value.reference !== preparationReferenceV2(value as unknown as HopV55QualifiedStudyPreparationV2)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Référence de préparation qualifiée V2 incohérente.');
  }
}

function assertPreparation(value: unknown): asserts value is HopV55QualifiedStudyPreparationRecord {
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
  assertCreateCommand(input.createCommand);
  const command = clone(input.createCommand);
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
    recordedAt: command.recordedAt, studyReference: studyReferenceForCommand(command), createCommand: command,
    ...(advicePreparationContext?.status === 'available' ? { advicePreparationContext: advicePreparationContext.context } : {}),
  };
  const record = { ...body, reference: preparationReference(body) };
  assertPreparation(record);
  return clone(record);
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
  assertPreparationV2(preparationV2);
  return clone(preparationV2);
}

export function readHopV55QualifiedStudyPreparation(value: unknown):
  | { status: 'available'; preparation: HopV55QualifiedStudyPreparationRecord }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  if (isRow(value) && typeof value.format === 'string'
    && value.format.startsWith('hop-v55-qualified-study-preparation-')
    && value.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT
    && value.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur de préparation qualifiée conservé brut.' };
  }
  try { assertPreparation(value); }
  catch (error) {
    if (error instanceof HopV55QualifiedStudyWorkspaceError && error.code === 'unsupportedFormat'
      && isRow(value) && Object.prototype.hasOwnProperty.call(value, 'advicePreparationContext')) {
      return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: error.message };
    }
    throw error;
  }
  return { status: 'available', preparation: clone(value) };
}

export function createHopV55QualifiedStudyLinkV1(preparation: HopV55QualifiedStudyPreparationRecord): HopV55QualifiedStudyLinkV1 {
  assertPreparation(preparation);
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

function scopeLedgersFromWorkspace(workspace: Pick<HopV55Workspace, 'decisionReadings'>): Map<string, HopV55QuestionScopeLedgerV1> {
  const result = new Map<string, HopV55QuestionScopeLedgerV1>();
  for (const raw of workspace.decisionReadings ?? []) {
    const read = readHopV55DecisionReadingArchive(raw);
    if (read.status !== 'available') continue;
    const scopes = hopV55DecisionReadingScopesV1(read.archive);
    if (scopes) result.set(read.archive.contentReference, scopes.scopeLedger);
  }
  return result;
}

function sourceRuntimeReferencesFromWorkspace(workspace: Pick<HopV55Workspace, 'decisionReadings'>): Map<string, string> {
  const result = new Map<string, string>();
  for (const raw of workspace.decisionReadings ?? []) {
    const read = readHopV55DecisionReadingArchive(raw);
    if (read.status === 'available') result.set(read.archive.contentReference, read.archive.runtimeReference);
  }
  return result;
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
}): void {
  const preparationRows = input.preparations ?? [];
  const linkRows = input.links ?? [];
  if (!Array.isArray(preparationRows) || !Array.isArray(linkRows)) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Historique des études qualifiées invalide.');
  }
  const preparationsByReference = new Map<string, HopV55QualifiedStudyPreparationRecord>();
  const preparationIds = new Set<string>();
  const preparationDossierIds = new Set<string>(), preparationEventIds = new Set<string>();
  const linkIds = new Set<string>(), linkReferences = new Set<string>();
  const futurePreparationSources = new Set<string>(), futureLinkSources = new Set<string>();
  for (const raw of preparationRows) {
    const read = readHopV55QualifiedStudyPreparation(raw);
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
  }
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
  preparation: HopV55QualifiedStudyPreparationRecord): HopV55Workspace {
  assertPreparation(preparation);
  if (workspace.ownerKey !== preparation.ownerKey || workspace.id !== preparation.workspaceId
    || !workspace.decisionReadings?.some(raw => {
      const archive = readHopV55DecisionReadingArchive(raw);
      return archive.status === 'available' && archive.archive.ownerKey === workspace.ownerKey
        && archive.archive.workspaceId === workspace.id && archive.archive.contentReference === preparation.sourceReadingReference;
    })) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Owner/workspace et archive de lecture doivent correspondre exactement avant la préparation.');
  }
  assertPreparationScopeCoverage(preparation, scopeLedgersFromWorkspace(workspace), sourceRuntimeReferencesFromWorkspace(workspace));
  const rows = workspace.qualifiedStudyPreparations ?? [];
  const existing = rows.map(readHopV55QualifiedStudyPreparation).find(read => read.status === 'available'
    && read.preparation.id === preparation.id);
  if (existing?.status === 'available') {
    if (existing.preparation.reference !== preparation.reference) throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'ID de préparation déjà utilisé avec un autre payload.');
    return clone(workspace);
  }
  if (rows.some(row => isRow(row) && typeof row.format === 'string'
    && row.format.startsWith('hop-v55-qualified-study-preparation-')
    && row.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V1_FORMAT
    && row.format !== HOP_V55_QUALIFIED_STUDY_PREPARATION_V2_FORMAT
    && row.sourceReadingReference === preparation.sourceReadingReference)) {
    throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Une préparation future reste en lecture seule.');
  }
  return { ...clone(workspace), qualifiedStudyPreparations: [...clone(rows), preparation] };
}

export function appendHopV55QualifiedStudyPreparation(workspace: HopV55Workspace,
  input: Omit<HopV55QualifiedStudyPreparationV1, 'format' | 'reference' | 'studyReference' | 'formatVersion' | 'dossierId' | 'eventId' | 'recordedAt'>
    & { createCommand: HopV55QualifiedStudyCreateCommandV1 }): HopV55Workspace {
  return appendHopV55QualifiedStudyPreparationRecord(workspace, createHopV55QualifiedStudyPreparationV1(input));
}

export function appendHopV55QualifiedStudyLink(workspace: HopV55Workspace,
  preparation: HopV55QualifiedStudyPreparationRecord): HopV55Workspace {
  assertPreparation(preparation);
  if (workspace.ownerKey !== preparation.ownerKey || workspace.id !== preparation.workspaceId
    || !workspace.decisionReadings?.some(archive => archive.contentReference === preparation.sourceReadingReference)
    || !workspace.qualifiedStudyPreparations?.some(row => {
      const read = readHopV55QualifiedStudyPreparation(row);
      return read.status === 'available' && read.preparation.reference === preparation.reference;
    })) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'La préparation et son archive source doivent être déjà persistées dans ce workspace.');
  }
  const link = createHopV55QualifiedStudyLinkV1(preparation);
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
  return { ...clone(workspace), qualifiedStudyLinks: [...clone(rows), link] };
}

export function assertHopV55QualifiedStudyAppendOnly(previous: HopV55Workspace, next: HopV55Workspace): void {
  const priorPreparations = previous.qualifiedStudyPreparations ?? [];
  const nextPreparations = next.qualifiedStudyPreparations ?? [];
  if (nextPreparations.length < priorPreparations.length
    || priorPreparations.some((row, index) => !sameValue(row, nextPreparations[index]))) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Une préparation d’étude qualifiée est append-only.');
  }
  const priorReadingReferences = new Set((previous.decisionReadings ?? []).map(row => row.contentReference));
  for (const raw of nextPreparations.slice(priorPreparations.length)) {
    const read = readHopV55QualifiedStudyPreparation(raw);
    if (read.status !== 'available') throw new HopV55QualifiedStudyWorkspaceError('unsupportedFormat', 'Une préparation future ne peut pas être écrite par ce client.');
    if (!priorReadingReferences.has(read.preparation.sourceReadingReference)) {
      throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'L’archive de lecture doit être persistée avant la préparation d’étude.');
    }
    assertPreparationScopeCoverage(read.preparation, scopeLedgersFromWorkspace(previous), sourceRuntimeReferencesFromWorkspace(previous));
  }
  const priorLinks = previous.qualifiedStudyLinks ?? [];
  const nextLinks = next.qualifiedStudyLinks ?? [];
  if (nextLinks.length < priorLinks.length || priorLinks.some((row, index) => !sameValue(row, nextLinks[index]))) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Un lien d’étude qualifiée est append-only.');
  }
  const priorPrepReferences = new Set(priorPreparations.flatMap(row => {
    const read = readHopV55QualifiedStudyPreparation(row);
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
  'id' | 'ownerKey' | 'decisionReadings' | 'qualifiedStudyPreparations' | 'qualifiedStudyLinks'>): void {
  const readingReferences = new Set((workspace.decisionReadings ?? []).flatMap(archive => {
    const read = readHopV55DecisionReadingArchive(archive);
    return read.status === 'available' && read.archive.ownerKey === workspace.ownerKey && read.archive.workspaceId === workspace.id
      ? [read.archive.contentReference] : [];
  }));
  assertHopV55QualifiedStudyWorkspaceCollections({ ownerKey: workspace.ownerKey, workspaceId: workspace.id,
    sourceReadingReferences: readingReferences, scopeLedgersByReading: scopeLedgersFromWorkspace(workspace),
    sourceRuntimeReferencesByReading: sourceRuntimeReferencesFromWorkspace(workspace),
    preparations: workspace.qualifiedStudyPreparations,
    links: workspace.qualifiedStudyLinks });
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

function validateStoredPreparation(workspace: HopV55Workspace, ownerKey: string, workspaceId: string,
  preparationReferenceValue: string): HopV55QualifiedStudyPreparationRecord {
  if (workspace.ownerKey !== ownerKey || workspace.id !== workspaceId) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Owner/workspace différent du rattachement préparé.');
  }
  const raw = workspace.qualifiedStudyPreparations?.find(row => {
    const read = readHopV55QualifiedStudyPreparation(row);
    return read.status === 'available' && read.preparation.reference === preparationReferenceValue;
  });
  const read = raw && readHopV55QualifiedStudyPreparation(raw);
  if (!read || read.status !== 'available') throw new HopV55QualifiedStudyWorkspaceError('notFound', 'Préparation exacte d’étude absente du workspace.');
  const preparation = read.preparation;
  assertPreparationScopeCoverage(preparation, scopeLedgersFromWorkspace(workspace), sourceRuntimeReferencesFromWorkspace(workspace));
  const archiveRaw = workspace.decisionReadings?.find(row => row.contentReference === preparation.sourceReadingReference);
  const archiveRead = archiveRaw && readHopV55DecisionReadingArchive(archiveRaw);
  if (!archiveRead || archiveRead.status !== 'available' || archiveRead.archive.ownerKey !== ownerKey
    || archiveRead.archive.workspaceId !== workspaceId || archiveRead.archive.contentReference !== preparation.sourceReadingReference) {
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
 */
export async function persistHopV55QualifiedStudy(input: {
  workspaces: Pick<HopV55WorkspaceRepository, 'read' | 'save'>;
  qualifiedStudies: HopDecisionLocalRepository;
  ownerKey: string;
  workspaceId: string;
  preparationReference: string;
  validateFreshness: HopV55QualifiedStudyFreshnessValidator;
  maxLinkAttempts?: number;
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
    const workspace = await input.workspaces.read(input.ownerKey, input.workspaceId);
    if (!workspace) throw new HopV55QualifiedStudyWorkspaceError('notFound', 'Workspace de l’étude qualifiée introuvable.');
    const preparation = validateStoredPreparation(workspace, input.ownerKey, input.workspaceId, input.preparationReference);
    const durable = await readDomainReceipt(input.qualifiedStudies, preparation);
    let domainReceipt = durable;
    if (!domainReceipt) {
      const beforeCreate = normalizeFreshness(await input.validateFreshness({ preparation, phase: 'beforeCreate' }));
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

    const link = createHopV55QualifiedStudyLinkV1(preparation);
    const priorLinkRaw = workspace.qualifiedStudyLinks?.find(row => {
      const read = readHopV55QualifiedStudyLink(row);
      return read.status === 'available' && read.link.preparationReference === preparation.reference;
    });
    if (priorLinkRaw) {
      const priorLinkRead = readHopV55QualifiedStudyLink(priorLinkRaw);
      if (priorLinkRead.status !== 'available' || !sameLink(priorLinkRead.link, link)) {
        throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'Le rattachement existant porte un autre dossier/étude.');
      }
      const freshness = normalizeFreshness(await input.validateFreshness({ preparation, phase: 'alreadyLinked' }));
      return { status: freshness.status === 'historical' ? 'recoveredHistorical' : 'alreadyLinked',
        freshContext: freshness, repositoryStatus: domainResult, preparation, link: priorLinkRead.link,
        dossier: domainReceipt.dossier, events: domainReceipt.events, studySavedEvent: domainReceipt.studySavedEvent,
        workspace };
    }

    const freshness = normalizeFreshness(await input.validateFreshness({ preparation, phase: 'beforeLink' }));
    const next = appendHopV55QualifiedStudyLink(workspace, preparation);
    try {
      const saved = await input.workspaces.save(next, workspace.revision);
      return { status: freshness.status === 'historical' ? 'recoveredHistorical' : 'linked',
        freshContext: freshness, repositoryStatus: domainResult, preparation, link,
        dossier: domainReceipt.dossier, events: domainReceipt.events, studySavedEvent: domainReceipt.studySavedEvent,
        workspace: saved };
    } catch (error) {
      if ((error as { code?: unknown })?.code === 'staleRevision') { lastError = error; continue; }
      throw error;
    }
  }
  throw new HopV55QualifiedStudyWorkspaceError('staleRevision',
    `Le dossier domaine reste durable, mais le lien workspace attend une reprise CAS : ${(lastError as Error | undefined)?.message ?? 'révision modifiée'}`);
}

/**
 * Durably prepares the exact command in workspace CAS, creates the independent
 * domain dossier, then links its receipt with a second workspace CAS. A retry
 * finds the same preparation/domain IDs and never rebuilds the study.
 */
export async function saveHopV55QualifiedStudy(input: {
  workspaces: Pick<HopV55WorkspaceRepository, 'read' | 'save'>;
  qualifiedStudies: HopDecisionLocalRepository;
  preparation: HopV55QualifiedStudyPreparationRecord;
  validateFreshness: HopV55QualifiedStudyFreshnessValidator;
  maxPreparationAttempts?: number;
  maxLinkAttempts?: number;
}): Promise<PersistHopV55QualifiedStudyResult> {
  assertPreparation(input.preparation);
  const maxPreparationAttempts = input.maxPreparationAttempts ?? 4;
  if (!Number.isSafeInteger(maxPreparationAttempts) || maxPreparationAttempts < 1 || maxPreparationAttempts > 8) {
    throw new HopV55QualifiedStudyWorkspaceError('invalidInput', 'Nombre de reprises CAS de préparation invalide.');
  }
  let persisted = false;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxPreparationAttempts; attempt++) {
    const workspace = await input.workspaces.read(input.preparation.ownerKey, input.preparation.workspaceId);
    if (!workspace) throw new HopV55QualifiedStudyWorkspaceError('notFound', 'Workspace source de l’étude qualifiée introuvable.');
    const existing = (workspace.qualifiedStudyPreparations ?? []).flatMap(row => {
      const read = readHopV55QualifiedStudyPreparation(row);
      return read.status === 'available' && read.preparation.id === input.preparation.id ? [read.preparation] : [];
    })[0];
    if (existing) {
      if (existing.reference !== input.preparation.reference) {
        throw new HopV55QualifiedStudyWorkspaceError('eventConflict', 'ID de préparation déjà utilisé avec un contenu différent.');
      }
      persisted = true;
      break;
    }
    const next = appendHopV55QualifiedStudyPreparationRecord(workspace, input.preparation);
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
  return persistHopV55QualifiedStudy({ workspaces: input.workspaces, qualifiedStudies: input.qualifiedStudies,
    ownerKey: input.preparation.ownerKey, workspaceId: input.preparation.workspaceId,
    preparationReference: input.preparation.reference, validateFreshness: input.validateFreshness,
    maxLinkAttempts: input.maxLinkAttempts });
}
