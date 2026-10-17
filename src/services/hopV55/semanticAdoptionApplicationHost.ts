import type { BrewerContext } from '../../../functions/src/companionTypes';
import {
  HOP_ADVICE_PROTOCOL_V1, buildHopAdviceV1WireV3,
  type HopAdviceV1ClientEntryV3, type HopAdviceV1PublicJob, type HopAdviceV1PublicTurn, type HopAdviceV1WireInputV3,
  buildHopAdviceV1WireV3ForWizardV1,
  type HopAdviceV1WizardClientEntryV1, type HopAdviceV1WizardWireInputV1,
} from '../../../functions/src/brewerHopAdviceTransportV1';
import { mapBrewerHopAdviceLaunchSourceToScopeV1, type BrewerHopAdviceContextScopeV1 } from '../../../functions/src/brewerHopAdviceContextBinding';
import { mapBrewerHopAdviceWizardSourceToScopeV1 } from '../../../functions/src/brewerHopAdviceWizardSourceV1';
import type { BrewerHopAdviceWizardDraftScopeV1 } from '../../../functions/src/brewerHopAdviceContextBinding';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopPropertyAdviceCandidatePolicy } from '../../domain/hopDecision/propertyAdviceSchema';
import type { HopV55ContextSource, HopV55Services, HopV55Workspace } from './contracts';
import { readHopV55DecisionReadingArchive } from './decisionArchive';
import type { HopV55DecisionReadingArchiveV4 } from './brewerHopAdviceSemanticSource4';
import { readHopV55DecisionReadingArchiveForWizardV1, type HopV55WizardDecisionReadingArchiveV4 } from './decisionArchive';
import type { BrewerHopAdviceWizardRequestV3 } from '../../../functions/src/brewerHopAdviceSemanticV3';
import type { BrewerHopAdviceWizardOriginV1, BrewerHopAdviceWizardCanonicalSnapshotV1 } from '../../../functions/src/brewerHopAdviceWizardSourceV1';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import {
  prepareHopV55SemanticAssistedAdviceLaunchV1,
  prepareHopV55SemanticAssistedAdviceLaunchForWizardV1,
  prepareHopV55SemanticCurrentPageContextV1,
  type PrepareHopV55SemanticContextLaunchInput,
  type PrepareHopV55SemanticContextLaunchInputForWizardV1,
} from './assistedSemanticAdviceContextV4';
import {
  createHopV55AssistedAdviceRecordV2, createHopV55AssistedAdviceTicketV3,
  createHopV55AssistedAdviceWizardRecordV1, createHopV55AssistedAdviceWizardTicketV1,
  readHopV55AssistedAdviceArchiveV2, readHopV55AssistedAdviceTicketV2,
  readHopV55AssistedAdviceWizardArchiveV1, readHopV55AssistedAdviceWizardTicketV1,
  assertHopV55AssistedAdviceCandidatePolicyV1,
  type HopV55AssistedAdviceRecordV2, type HopV55AssistedAdviceTicketV3,
  type HopV55AssistedAdviceWizardRecordV1, type HopV55AssistedAdviceWizardTicketV1,
} from './assistedSemanticAdviceArchiveV2';
import { readHopAdviceV1PublicTurn } from '../brewerHopAdviceApi';
import {
  createHopV55SemanticAdoptionController,
  type HopV55SemanticAdoptionControllerConfirmV1,
  type HopV55SemanticAdoptionControllerPreviewV1,
  type HopV55SemanticAdoptionHistoryReadV1,
  type HopV55SemanticAdoptionPreviewCommandV1,
} from './semanticAdoptionController';
import type { HopV55SemanticAdoptionPrincipalV1 } from './assistedSemanticAdviceAdoptionV6';
import { receiveHopV55AssistedSemanticAdviceProposalV6 } from './assistedSemanticAdviceV6';
import { readHopV55SemanticAdoptionTurnClosureV1 } from './semanticAdoptionTurnSource';
import { getHopV55ReferenceProjection } from './referenceWorkspace';
import { prepareHopV55AdoptedContext } from './adoptedContextPreparation';
import { readHopV55WizardSourceSnapshotForArchiveV1 } from './workspaceRepository';
import { hopV55ScenarioRuntimeReference } from './scenarioCommit';
import { canonicalizeHopV55RecipeDraft } from './recipeStepContext';
import { prepareBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { readHopV55SemanticAdoptionTurnClosureForWizardV1 } from './semanticAdoptionTurnSource';
import { readBrewerHopAdviceProposalEnvelopeV6ForWizardV1 } from '../../../functions/src/brewerHopAdviceSemanticV6';

/** Local-only discriminants; the serialized wire mode remains hopAdviceReadonlyV1. */
export const HOP_V55_SEMANTIC_ASSISTED_SESSION_V3 = 'hop-v55-semantic-assisted-session-v3' as const;
export const HOP_V55_SEMANTIC_ASSISTED_SESSION_WIZARD_V1 = 'hop-v55-semantic-assisted-session-wizard-v1' as const;
export const HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3 = 'hop-v55-semantic-job-snapshot-v3' as const;
export const HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT = HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3;
export const HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1 = 'hop-v55-semantic-job-snapshot-wizard-v1' as const;

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const clone = <T,>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown): boolean => {
  try { return hopAdviceContentReference('hop-v55-semantic-application-host-equality-v1', left)
    === hopAdviceContentReference('hop-v55-semantic-application-host-equality-v1', right); }
  catch { return false; }
};

export interface HopV55SemanticActorV1 { uid: string; displayName?: string | null }
export type HopV55SemanticWorkspaceAuthorityV1 =
  | { kind: 'owner'; actorUid: string; ownerKey: string; workspaceId: string; scope: BrewerHopAdviceContextScopeV1 }
  | { kind: 'verifiedShare'; actorUid: string; ownerKey: string; workspaceId: string; scope: BrewerHopAdviceContextScopeV1; grantReference: string };
export interface HopV55SemanticShareAuthorityRequestV1 {
  actorUid: string; ownerKey: string; workspaceId: string; scope: BrewerHopAdviceContextScopeV1;
}

export type HopV55SemanticApplicationStatusV1 =
  | 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid' | 'conflict' | 'notFound';
export class HopV55SemanticAdoptionApplicationError extends Error {
  constructor(readonly code: HopV55SemanticApplicationStatusV1, message: string, readonly snapshot?: unknown) {
    super(message);
  }
}

export interface HopV55SemanticAdoptionApplicationHostOptionsV1 {
  /** Owner-partitioned #67 repository and its existing CAS; no second database is created. */
  services: Pick<HopV55Services, 'ownerKey' | 'workspaces'>;
  /** Must read the live Auth session, not a React label or the captured Page owner prop. */
  readActor(): HopV55SemanticActorV1 | null;
  /** Without this explicit resolver, only ownerUid === ownerKey is available. */
  resolveVerifiedShare?(input: HopV55SemanticShareAuthorityRequestV1): Promise<HopV55SemanticWorkspaceAuthorityV1 | null>;
  /** Resolves the selected source from the latest workspace/App state after each await. */
  readCurrentContext(input: { workspace: HopV55Workspace; sourceArchive: HopV55DecisionReadingArchiveV4;
    ownerKey: string; workspaceId: string; scope: BrewerHopAdviceContextScopeV1 }): Promise<BrewerContext>;
  /** Reads the actual unsaved Wizard draft from its live host; never substitutes the stored Recipe. */
  readCurrentWizardContext?(input: { workspace: HopV55Workspace; sourceArchive: HopV55WizardDecisionReadingArchiveV4;
    origin: BrewerHopAdviceWizardOriginV1; scope: BrewerHopAdviceWizardDraftScopeV1 }): Promise<{
      snapshot: BrewerHopAdviceWizardCanonicalSnapshotV1; context: BrewerContext; livePrepared: PreparedBrewingScenarioContext;
    }>;
  now(): string;
  makeId(kind: 'session' | 'ticket' | 'record', operationId?: string): string;
}

export interface HopV55SemanticAdoptionApplicationHostFactoryOptionsV1 {
  services: Pick<HopV55Services, 'ownerKey' | 'workspaces' | 'loadContext'>;
  readActor(): HopV55SemanticActorV1 | null;
  resolveVerifiedShare?(input: HopV55SemanticShareAuthorityRequestV1): Promise<HopV55SemanticWorkspaceAuthorityV1 | null>;
  readCurrentWizardContext?: HopV55SemanticAdoptionApplicationHostOptionsV1['readCurrentWizardContext'];
  now(): string;
  makeId(kind: 'session' | 'ticket' | 'record', operationId?: string): string;
}

function contextSourceForSemanticArchive(source: HopV55DecisionReadingArchiveV4['source']): HopV55ContextSource {
  switch (source.kind) {
    case 'recipe': return { kind: 'recipe', recipeId: source.id };
    case 'batch': return { kind: 'batch', batchId: source.id };
    case 'exploration': return { kind: 'exploration' };
    case 'localRecipeCopy': return source;
    case 'localFutureDraft': return source;
  }
}

/** Shared Host/RecipeStep adapter: current facts are reloaded from the exact archived source. */
export function createHopV55SemanticAdoptionApplicationHostForServicesV1(
  options: HopV55SemanticAdoptionApplicationHostFactoryOptionsV1,
): HopV55SemanticAdoptionApplicationHostV1 {
  return createHopV55SemanticAdoptionApplicationHostV1({
    services: { ownerKey: options.services.ownerKey, workspaces: options.services.workspaces },
    readActor: options.readActor,
    ...(options.resolveVerifiedShare ? { resolveVerifiedShare: options.resolveVerifiedShare } : {}),
    readCurrentContext: ({ sourceArchive }) => options.services.loadContext(undefined, contextSourceForSemanticArchive(sourceArchive.source)),
    ...(options.readCurrentWizardContext ? { readCurrentWizardContext: options.readCurrentWizardContext } : {}),
    now: options.now,
    makeId: options.makeId,
  });
}

export interface HopV55SemanticWireAuthorizationV3 {
  status: 'authorized'; ticketReference: string; wireReference: string;
  operationId: string; generation: number; wire: HopAdviceV1WireInputV3;
}
export type HopV55SemanticWireAuthorizationResultV3 = HopV55SemanticWireAuthorizationV3
  | { status: 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid'; reason: string; snapshot?: unknown };

/** V3-only job-store port. A provider must call the guard immediately before every actual send/retry. */
export interface HopV55SemanticJobStoreV3 {
  readonly kind: 'hopAdviceRequest3';
  /** Explicit provider lane; tests must identify their deterministic V6 fixture here. */
  readonly providerKind: 'fixture' | 'authorizedRequest3';
  submit(input: { operationId: string; generation: number; ticketReference: string; wireReference: string; wire: HopAdviceV1WireInputV3;
    authorizeBeforeEachEmission(): Promise<HopV55SemanticWireAuthorizationResultV3> }): Promise<HopV55SemanticJobSnapshotV3>;
  retry(input: { operationId: string; generation: number; ticketReference: string; wireReference: string; wire: HopAdviceV1WireInputV3;
    authorizeBeforeEachEmission(): Promise<HopV55SemanticWireAuthorizationResultV3> }): Promise<HopV55SemanticJobSnapshotV3>;
  read(input: { ownerKey: string; workspaceId: string; operationId: string; generation: number;
    question: string; ticketReference: string; wireReference: string }):
    Promise<HopV55SemanticJobSnapshotV3 | null>;
}

export interface HopV55SemanticWizardWireAuthorizationV1 {
  status: 'authorized'; ticketReference: string; wireReference: string;
  operationId: string; generation: number; wire: HopAdviceV1WizardWireInputV1;
}
export type HopV55SemanticWizardWireAuthorizationResultV1 = HopV55SemanticWizardWireAuthorizationV1
  | { status: 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid'; reason: string; snapshot?: unknown };

/** A separate Request3 Wizard store contract; it cannot accept classic Request3 or Request2 wires. */
export interface HopV55SemanticWizardJobStoreV1 {
  readonly kind: 'hopAdviceWizardRequest3V1';
  readonly providerKind: 'fixture' | 'authorizedRequest3';
  submit(input: { operationId: string; generation: number; ticketReference: string; wireReference: string;
    wire: HopAdviceV1WizardWireInputV1; authorizeBeforeEachEmission(): Promise<HopV55SemanticWizardWireAuthorizationResultV1> }):
    Promise<HopV55SemanticWizardJobSnapshotV1>;
  retry(input: { operationId: string; generation: number; ticketReference: string; wireReference: string;
    wire: HopAdviceV1WizardWireInputV1; authorizeBeforeEachEmission(): Promise<HopV55SemanticWizardWireAuthorizationResultV1> }):
    Promise<HopV55SemanticWizardJobSnapshotV1>;
  read(input: { ownerKey: string; workspaceId: string; operationId: string; generation: number; question: string;
    ticketReference: string; wireReference: string; wire: HopAdviceV1WizardWireInputV1;
    authorizeBeforeRead(): Promise<HopV55SemanticWizardWireAuthorizationResultV1> }): Promise<HopV55SemanticWizardJobSnapshotV1 | null>;
}

export interface HopV55SemanticWizardJobSnapshotV1 {
  format: typeof HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1;
  operationId: string; generation: number; ticketReference: string; wireReference: string;
  status: 'pending' | 'received' | 'failed' | 'unsupportedReadOnly';
  job?: HopAdviceV1PublicJob; turn?: unknown; reason?: string;
}

/** Client-side V3 job view. Turn proposal remains opaque until the canonical V6 reader sees that same public turn. */
export interface HopV55SemanticJobSnapshotV3 {
  format: typeof HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3;
  operationId: string; generation: number; ticketReference: string; wireReference: string;
  status: 'pending' | 'received' | 'failed' | 'unsupportedReadOnly';
  job?: HopAdviceV1PublicJob; turn?: unknown; reason?: string;
}
export interface HopV55SemanticTurnV3 { job: HopAdviceV1PublicJob; turn: unknown }

export interface HopV55SemanticAdoptionSessionV3 {
  format: typeof HOP_V55_SEMANTIC_ASSISTED_SESSION_V3;
  id: string; ownerKey: string; workspaceId: string; sourceReadingReference: string;
  /** Actor whose live owner/share authority opened this view; the label never participates. */
  openedByPrincipalId: string;
  scope: BrewerHopAdviceContextScopeV1; request: HopAdviceV1ClientEntryV3['hopAdvice'];
  candidatePolicy: HopPropertyAdviceCandidatePolicy; context?: BrewerContext;
  /** Set only when the Page reopened an exact persisted ticket; used for guarded recovery, never as authority. */
  resumedOperationId?: string; resumedGeneration?: number;
  /** Strictly reread local record, when present; this is an archive view, not a provider response. */
  resumedRecord?: HopV55AssistedAdviceRecordV2;
  persistTicketBeforeSend(input: HopAdviceV1ClientEntryV3): Promise<HopV55AssistedAdviceTicketV3>;
  authorizeBeforeEmission(input: { operationId: string; generation: number }): Promise<HopV55SemanticWireAuthorizationResultV3>;
  submit(input: { entry: HopAdviceV1ClientEntryV3; store: HopV55SemanticJobStoreV3 }): Promise<HopV55SemanticSubmissionResultV3>;
  retry(input: { operationId: string; generation: number; store: HopV55SemanticJobStoreV3 }): Promise<HopV55SemanticSubmissionResultV3>;
  /** Explicit re-emission from the durable ticket's original wire; never rebuilds Request3 or creates a new ticket. */
  resubmit(input: { operationId: string; store: HopV55SemanticJobStoreV3 }): Promise<HopV55SemanticSubmissionResultV3>;
  recover(input: { operationId: string; store: HopV55SemanticJobStoreV3 }): Promise<HopV55SemanticSubmissionResultV3>;
  receiveTurn(snapshot: HopV55SemanticJobSnapshotV3): Promise<HopV55SemanticTurnResultV3>;
  preview(input: Omit<HopV55SemanticAdoptionPreviewCommandV1, 'ownerKey' | 'workspaceId' | 'ticketId' | 'operationId'> & { operationId: string }):
    Promise<HopV55SemanticAdoptionControllerPreviewV1 | { status: 'unavailable'; reason: string }>;
  confirm(plan: unknown): Promise<HopV55SemanticAdoptionControllerConfirmV1 | { status: 'unavailable'; reason: string }>;
  readHistory(commandId: string): Promise<HopV55SemanticAdoptionHistoryReadV1 | { status: 'unavailable'; reason: string }>;
}

export type HopV55SemanticWizardTurnResultV1 =
  | { status: 'recorded' | 'alreadyRecorded'; record: HopV55AssistedAdviceWizardRecordV1 }
  | { status: 'pending' | 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid' | 'conflict'; reason: string; snapshot?: unknown };
export type HopV55SemanticWizardSubmissionResultV1 =
  | { status: 'submitted' | 'pending'; ticket: HopV55AssistedAdviceWizardTicketV1; job?: HopV55SemanticWizardJobSnapshotV1 }
  | { status: 'received'; ticket: HopV55AssistedAdviceWizardTicketV1; record: HopV55AssistedAdviceWizardRecordV1 }
  | { status: 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid' | 'conflict' | 'notFound';
      reason: string; snapshot?: unknown; durable?: HopV55SemanticSubmissionDurableReferenceV3 };

export interface HopV55SemanticAdoptionSessionForWizardV1 {
  format: typeof HOP_V55_SEMANTIC_ASSISTED_SESSION_WIZARD_V1;
  id: string; ownerKey: string; workspaceId: string; sourceReadingReference: string; openedByPrincipalId: string;
  scope: BrewerHopAdviceWizardDraftScopeV1; snapshot: BrewerHopAdviceWizardCanonicalSnapshotV1; request: BrewerHopAdviceWizardRequestV3;
  candidatePolicy: HopPropertyAdviceCandidatePolicy; context?: BrewerContext;
  resumedOperationId?: string; resumedGeneration?: number; resumedRecord?: HopV55AssistedAdviceWizardRecordV1;
  persistTicketBeforeSend(entry: HopAdviceV1WizardClientEntryV1): Promise<HopV55AssistedAdviceWizardTicketV1>;
  authorizeBeforeEmission(input: { operationId: string; generation: number }): Promise<HopV55SemanticWizardWireAuthorizationResultV1>;
  submit(input: { entry: HopAdviceV1WizardClientEntryV1; store: HopV55SemanticWizardJobStoreV1 }): Promise<HopV55SemanticWizardSubmissionResultV1>;
  retry(input: { operationId: string; generation: number; store: HopV55SemanticWizardJobStoreV1 }): Promise<HopV55SemanticWizardSubmissionResultV1>;
  resubmit(input: { operationId: string; store: HopV55SemanticWizardJobStoreV1 }): Promise<HopV55SemanticWizardSubmissionResultV1>;
  recover(input: { operationId: string; store: HopV55SemanticWizardJobStoreV1 }): Promise<HopV55SemanticWizardSubmissionResultV1>;
  receiveTurn(snapshot: HopV55SemanticWizardJobSnapshotV1): Promise<HopV55SemanticWizardTurnResultV1>;
  preview(input: Omit<HopV55SemanticAdoptionPreviewCommandV1, 'ownerKey' | 'workspaceId' | 'ticketId' | 'operationId' | 'profile'>
    & { operationId: string }): Promise<HopV55SemanticAdoptionControllerPreviewV1>;
  confirm(plan: unknown): Promise<HopV55SemanticAdoptionControllerConfirmV1>;
  readHistory(commandId: string): Promise<HopV55SemanticAdoptionHistoryReadV1>;
}
export type HopV55SemanticSessionOpenResultV3 =
  | { status: 'ready'; session: HopV55SemanticAdoptionSessionV3 }
  | { status: 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid' | 'notFound'; reason: string; snapshot?: unknown };
export type HopV55SemanticWizardSessionOpenResultV1 =
  | { status: 'ready'; session: HopV55SemanticAdoptionSessionForWizardV1 }
  | { status: 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid' | 'notFound'; reason: string; snapshot?: unknown };
export type HopV55SemanticTurnResultV3 =
  | { status: 'recorded'; record: HopV55AssistedAdviceRecordV2 }
  | { status: 'alreadyRecorded'; record: HopV55AssistedAdviceRecordV2 }
  | { status: 'pending' | 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid' | 'conflict'; reason: string; snapshot?: unknown };
export type HopV55SemanticSubmissionResultV3 =
  | { status: 'submitted' | 'pending'; ticket: HopV55AssistedAdviceTicketV3; job?: HopV55SemanticJobSnapshotV3 }
  | { status: 'received'; ticket: HopV55AssistedAdviceTicketV3; record: HopV55AssistedAdviceRecordV2 }
  | { status: 'unavailable' | 'stale' | 'unsupportedReadOnly' | 'invalid' | 'conflict' | 'notFound'; reason: string;
      snapshot?: unknown; durable?: HopV55SemanticSubmissionDurableReferenceV3 };
export interface HopV55SemanticSubmissionDurableReferenceV3 {
  operationId: string; generation: number; ticketReference: string; wireReference: string;
}
export interface HopV55SemanticAdoptionApplicationHostV1 {
  openSession(input: { workspaceId: string; sourceReadingReference: string; scopeAtPageLaunch: BrewerHopAdviceContextScopeV1;
    candidatePolicy: HopPropertyAdviceCandidatePolicy }): Promise<HopV55SemanticSessionOpenResultV3>;
  /** Strictly restores from the durable ticket; never reparses or rebuilds Request3 after reload. */
  resumeSession(input: { workspaceId: string; operationId: string }): Promise<HopV55SemanticSessionOpenResultV3>;
  /** Strict Wizard profile: the source archive and current unsaved draft are read independently from saved Recipes. */
  openWizardSession(input: { workspaceId: string; sourceReadingReference: string; scopeAtPageLaunch: BrewerHopAdviceWizardDraftScopeV1;
    candidatePolicy: HopPropertyAdviceCandidatePolicy }): Promise<HopV55SemanticWizardSessionOpenResultV1>;
  resumeWizardSession(input: { workspaceId: string; operationId: string }): Promise<HopV55SemanticWizardSessionOpenResultV1>;
}

function failure(error: unknown): { status: HopV55SemanticApplicationStatusV1; reason: string; snapshot?: unknown } {
  if (error instanceof HopV55SemanticAdoptionApplicationError) return {
    status: error.code, reason: error.message, ...(error.snapshot === undefined ? {} : { snapshot: clone(error.snapshot) }),
  };
  return { status: 'invalid', reason: error instanceof Error ? error.message : 'Commande assistée V3 invalide.' };
}
function requireWorkspace(value: HopV55Workspace | null, ownerKey: string, workspaceId: string): HopV55Workspace {
  if (!value) throw new HopV55SemanticAdoptionApplicationError('notFound', 'Workspace exact absent.');
  if (value.ownerKey !== ownerKey || value.id !== workspaceId) throw new HopV55SemanticAdoptionApplicationError('invalid', 'Workspace relu hors owner/workspace demandé.');
  return value;
}
function readArchiveV4(workspace: HopV55Workspace, sourceReadingReference: string): HopV55DecisionReadingArchiveV4 {
  const rows = (workspace.decisionReadings ?? []).filter(row => isRow(row) && row.contentReference === sourceReadingReference);
  if (rows.length !== 1) throw new HopV55SemanticAdoptionApplicationError(rows.length ? 'invalid' : 'notFound',
    rows.length ? 'Plusieurs archives revendiquent la source exacte.' : 'L’archive source V4 exacte est absente.');
  const read = readHopV55DecisionReadingArchive(rows[0]);
  if (read.status === 'unsupportedFormat') throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly',
    'Format d’archive futur conservé : ' + read.format, read.raw);
  if (read.status === 'invalidRecord') throw new HopV55SemanticAdoptionApplicationError('invalid', read.reason);
  if (read.archive.format !== 'hop-v55-decision-reading-v4' || read.archive.contentReference !== sourceReadingReference) {
    throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', 'Seule l’archive V4 exacte peut lancer Request3.', read.archive);
  }
  return read.archive as HopV55DecisionReadingArchiveV4;
}
function readWizardArchiveV4(workspace: HopV55Workspace, sourceReadingReference: string): HopV55WizardDecisionReadingArchiveV4 {
  const rows = (workspace.decisionReadings ?? []).filter(row => isRow(row) && row.contentReference === sourceReadingReference);
  if (rows.length !== 1) throw new HopV55SemanticAdoptionApplicationError(rows.length ? 'invalid' : 'notFound',
    rows.length ? 'Plusieurs archives revendiquent la lecture Wizard exacte.' : 'Archive Wizard exacte absente du workspace.');
  const read = readHopV55DecisionReadingArchiveForWizardV1(rows[0]);
  if (read.status === 'unsupportedFormat') throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly',
    `Archive Wizard future conservée : ${read.format}.`, read.raw);
  if (read.status === 'invalidRecord') throw new HopV55SemanticAdoptionApplicationError('invalid', read.reason);
  if (read.archive.format !== 'hop-v55-decision-reading-v4' || read.archive.contentReference !== sourceReadingReference) {
    throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', 'L’archive Wizard ne correspond pas à sa référence persistée.', read.archive);
  }
  return read.archive;
}
function rowsFor(workspace: HopV55Workspace, key: 'assistedSemanticAdviceTickets' | 'assistedSemanticAdviceRecords'): unknown[] {
  const value = workspace[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new HopV55SemanticAdoptionApplicationError('invalid', key + ' illisible.');
  return value;
}
function findTicket(workspace: HopV55Workspace, operationId: string): HopV55AssistedAdviceTicketV3 | null {
  const hits = rowsFor(workspace, 'assistedSemanticAdviceTickets').filter(row => isRow(row) && row.operationId === operationId);
  if (hits.length > 1) throw new HopV55SemanticAdoptionApplicationError('invalid', 'Plusieurs tickets sémantiques revendiquent la même opération.');
  if (!hits.length) {
    if ((workspace.assistedAdviceTickets ?? []).some(row => isRow(row) && row.operationId === operationId)) {
      throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', 'Cette opération appartient au transport V1; aucun ticket Request3 n’est créé.');
    }
    return null;
  }
  const read = readHopV55AssistedAdviceTicketV2(hits[0]);
  if (read.status === 'invalid') throw new HopV55SemanticAdoptionApplicationError('invalid', read.reason);
  if (read.status !== 'readOnly') throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', read.reason, read.snapshot);
  if (read.ticket.format !== 'hop-v55-assisted-advice-ticket-v3') {
    throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', 'Ticket V2 sans policy conservé en lecture seule.', read.ticket);
  }
  return read.ticket;
}
function findWizardTicket(workspace: HopV55Workspace, operationId: string): HopV55AssistedAdviceWizardTicketV1 | null {
  const hits = rowsFor(workspace, 'assistedSemanticAdviceTickets').filter(row => isRow(row) && row.operationId === operationId);
  if (hits.length > 1) throw new HopV55SemanticAdoptionApplicationError('invalid', 'Plusieurs tickets revendiquent l’opération Wizard.');
  if (!hits.length) {
    if ((workspace.assistedAdviceTickets ?? []).some(row => isRow(row) && row.operationId === operationId)
      || (workspace.assistedSemanticAdviceTickets ?? []).some(row => isRow(row) && row.operationId === operationId)) {
      throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', 'Cette opération appartient à un autre profil assisté; aucun cast Wizard.');
    }
    return null;
  }
  if (isRow(hits[0]) && hits[0].format !== 'hop-v55-assisted-advice-ticket-v4-wizard-v1') {
    throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', 'Cette opération est scellée sous un autre profil assisté; aucun cast Wizard.', hits[0]);
  }
  const read = readHopV55AssistedAdviceWizardTicketV1(hits[0]);
  if (read.status === 'invalid') throw new HopV55SemanticAdoptionApplicationError('invalid', read.reason);
  if (read.status !== 'readOnly') throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', read.reason, read.snapshot);
  return read.ticket;
}
function sameAuthority(left: { principal: HopV55SemanticAdoptionPrincipalV1; kind: 'owner' | 'verifiedShare'; grantReference?: string },
  right: { principal: HopV55SemanticAdoptionPrincipalV1; kind: 'owner' | 'verifiedShare'; grantReference?: string }): boolean {
  return left.kind === right.kind && left.grantReference === right.grantReference
    && left.principal.principalId === right.principal.principalId && left.principal.ownerKey === right.principal.ownerKey
    && left.principal.workspaceId === right.principal.workspaceId && same(left.principal.scope, right.principal.scope);
}
function advancedAt(previous: string, next: string): string {
  const left = Date.parse(previous); const right = Date.parse(next);
  return Number.isFinite(left) && Number.isFinite(right) && left > right ? previous : next;
}

export function createHopV55SemanticAdoptionApplicationHostV1(
  options: HopV55SemanticAdoptionApplicationHostOptionsV1,
): HopV55SemanticAdoptionApplicationHostV1 {
  const { services } = options;
  const ownerKey = services.ownerKey;
  if (!isText(ownerKey)) throw new HopV55SemanticAdoptionApplicationError('invalid', 'Owner partition exact requis.');

  async function readWorkspace(workspaceId: string): Promise<HopV55Workspace> {
    if (!isText(workspaceId)) throw new HopV55SemanticAdoptionApplicationError('invalid', 'WorkspaceId exact requis.');
    return requireWorkspace(await services.workspaces.read(ownerKey, workspaceId), ownerKey, workspaceId);
  }

  async function resolveAuthority(workspaceId: string, scope: BrewerHopAdviceContextScopeV1): Promise<{
    principal: HopV55SemanticAdoptionPrincipalV1; kind: 'owner' | 'verifiedShare'; grantReference?: string;
  }> {
    const actor = options.readActor();
    if (!actor || !isText(actor.uid)) throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Aucune session Auth active.');
    if (actor.uid === ownerKey) return { kind: 'owner', principal: {
      principalId: actor.uid, ownerKey, workspaceId, scope: clone(scope), label: actor.displayName?.trim() || actor.uid,
    } };
    if (!options.resolveVerifiedShare) throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Aucune capacité de partage vérifiée pour cet owner.');
    const request: HopV55SemanticShareAuthorityRequestV1 = { actorUid: actor.uid, ownerKey, workspaceId, scope: clone(scope) };
    const grant = await options.resolveVerifiedShare(request);
    const afterGrant = options.readActor();
    if (!afterGrant || afterGrant.uid !== actor.uid) throw new HopV55SemanticAdoptionApplicationError('unavailable', 'La session Auth a changé pendant la vérification du partage.');
    if (!grant || grant.kind !== 'verifiedShare' || grant.actorUid !== actor.uid || grant.ownerKey !== ownerKey
      || grant.workspaceId !== workspaceId || !same(grant.scope, scope) || !isText(grant.grantReference)) {
      throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Aucun droit de partage exact et vérifiable pour cette source.');
    }
    return { kind: 'verifiedShare', grantReference: grant.grantReference, principal: {
      principalId: actor.uid, ownerKey, workspaceId, scope: clone(scope), label: actor.displayName?.trim() || actor.uid,
    } };
  }

  async function requireAuthorityStable(before: Awaited<ReturnType<typeof resolveAuthority>>, workspaceId: string,
    scope: BrewerHopAdviceContextScopeV1): Promise<void> {
    const after = await resolveAuthority(workspaceId, scope);
    if (!sameAuthority(before, after)) throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Le principal ou son droit a changé pendant l’action.');
  }

  async function readCurrentInput(input: { workspace: HopV55Workspace; archive: HopV55DecisionReadingArchiveV4;
    scope: BrewerHopAdviceContextScopeV1 }): Promise<PrepareHopV55SemanticContextLaunchInput> {
    const persisted = readArchiveV4(input.workspace, input.archive.contentReference);
    if (!same(persisted, input.archive)) throw new HopV55SemanticAdoptionApplicationError('invalid', 'L’archive V4 relue diffère de la closure source exacte.');
    const context = await options.readCurrentContext({ workspace: input.workspace, sourceArchive: input.archive,
      ownerKey, workspaceId: input.workspace.id, scope: input.scope });
    return { archive: clone(input.archive), workspace: input.workspace, ownerKey, workspaceId: input.workspace.id,
      scopeAtPageLaunch: clone(input.scope), context };
  }

  async function readCurrentWizardInput(input: { workspace: HopV55Workspace; archive: HopV55WizardDecisionReadingArchiveV4;
    scope: BrewerHopAdviceWizardDraftScopeV1 }): Promise<PrepareHopV55SemanticContextLaunchInputForWizardV1> {
    const persisted = readWizardArchiveV4(input.workspace, input.archive.contentReference);
    if (!same(persisted, input.archive)) throw new HopV55SemanticAdoptionApplicationError('invalid', 'L’archive Wizard relue diffère de la closure source exacte.');
    if (!options.readCurrentWizardContext) throw new HopV55SemanticAdoptionApplicationError('unavailable',
      'Aucune lecture live du brouillon Wizard non enregistré n’est fournie à cette Application.');
    const scope = mapBrewerHopAdviceWizardSourceToScopeV1(input.archive.source);
    if (!same(scope, input.scope)) throw new HopV55SemanticAdoptionApplicationError('stale', 'Le scope courant ne correspond plus à l’origine Wizard archivée.');
    const origin: BrewerHopAdviceWizardOriginV1 = { ownerKey: ownerKey,
      workspaceId: input.workspace.id, draftId: input.archive.source.draftId };
    const current = await options.readCurrentWizardContext({ workspace: input.workspace, sourceArchive: input.archive,
      origin, scope: clone(scope) });
    return { archiveWizard: clone(input.archive), workspace: input.workspace, origin, snapshot: clone(current.snapshot),
      scopeAtPageLaunch: clone(scope), context: clone(current.context), livePrepared: clone(current.livePrepared) };
  }

  async function readPrincipalForController(input: { ownerKey: string; workspaceId: string; scope: BrewerHopAdviceContextScopeV1 }) {
    if (input.ownerKey !== ownerKey) throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Le contrôleur pointe vers une autre partition owner.');
    return (await resolveAuthority(input.workspaceId, input.scope)).principal;
  }

  async function readCultureBinding(input: { workspace: HopV55Workspace; current: PrepareHopV55SemanticContextLaunchInput }) {
    let projection: ReturnType<typeof getHopV55ReferenceProjection>;
    try { projection = getHopV55ReferenceProjection(input.workspace); }
    catch (error) { throw new HopV55SemanticAdoptionApplicationError('invalid', error instanceof Error ? error.message : 'Journal NR illisible.'); }
    const prepared = prepareHopV55AdoptedContext({ context: input.current.context, workspace: input.workspace,
      expected: projection?.currentReference ?? null });
    if (prepared.resolution.status === 'absent') return null;
    if ('cultureBinding' in prepared) return prepared.cultureBinding;
    if (prepared.resolution.status === 'stale') throw new HopV55SemanticAdoptionApplicationError('stale',
      'La référence NR courante a changé (' + prepared.resolution.code + ').');
    if (prepared.resolution.status === 'unsupportedFormat') throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly',
      'Le journal NR futur est conservé sans conversion.', prepared.resolution.raw);
    throw new HopV55SemanticAdoptionApplicationError('invalid', prepared.resolution.reason);
  }
  async function readCultureBindingForWizard(input: { workspace: HopV55Workspace; current: PrepareHopV55SemanticContextLaunchInputForWizardV1 }) {
    let projection: ReturnType<typeof getHopV55ReferenceProjection>;
    try { projection = getHopV55ReferenceProjection(input.workspace); }
    catch (error) { throw new HopV55SemanticAdoptionApplicationError('invalid', error instanceof Error ? error.message : 'Journal NR illisible.'); }
    const prepared = prepareHopV55AdoptedContext({ context: input.current.context, workspace: input.workspace,
      expected: projection?.currentReference ?? null });
    if (prepared.resolution.status === 'absent') return null;
    if ('cultureBinding' in prepared) return prepared.cultureBinding;
    if (prepared.resolution.status === 'stale') throw new HopV55SemanticAdoptionApplicationError('stale',
      'La référence NR courante a changé (' + prepared.resolution.code + ').');
    if (prepared.resolution.status === 'unsupportedFormat') throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly',
      'Le journal NR futur est conservé sans conversion.', prepared.resolution.raw);
    throw new HopV55SemanticAdoptionApplicationError('invalid', prepared.resolution.reason);
  }
  const v6 = createHopV55SemanticAdoptionController({
    workspaces: services.workspaces,
    readPrincipal: readPrincipalForController,
    readCurrent: async input => readCurrentInput({ workspace: input.workspace, archive: input.sourceArchive, scope: input.scope }),
    readCultureBinding,
    readCurrentWizard: async input => {
      if (input.scope.kind !== 'draft') throw new HopV55SemanticAdoptionApplicationError('invalid', 'Le scope Wizard doit rester draft.');
      return readCurrentWizardInput({ workspace: input.workspace, archive: input.sourceArchive,
        scope: { kind: 'draft', id: input.scope.id } });
    },
    readCultureBindingForWizard,
    now: options.now,
  });

  async function openSession(input: { workspaceId: string; sourceReadingReference: string; scopeAtPageLaunch: BrewerHopAdviceContextScopeV1;
    candidatePolicy: HopPropertyAdviceCandidatePolicy }): Promise<HopV55SemanticSessionOpenResultV3> {
    try {
      const ws = await readWorkspace(input.workspaceId);
      const archive = readArchiveV4(ws, input.sourceReadingReference);
      const mappedScope = mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, ws.id, archive.source);
      if (!same(mappedScope, input.scopeAtPageLaunch)) throw new HopV55SemanticAdoptionApplicationError('invalid', 'Le scope choisi ne correspond pas à la source V4 exacte.');
      const accessBefore = await resolveAuthority(ws.id, mappedScope);
      const launchInput = await readCurrentInput({ workspace: ws, archive, scope: mappedScope });
      const launch = prepareHopV55SemanticAssistedAdviceLaunchV1(launchInput);
      if (launch.status !== 'ready') throw new HopV55SemanticAdoptionApplicationError(
        launch.status === 'stale' ? 'stale' : launch.status === 'legacyReadOnly' || launch.status === 'unsupportedReadOnly'
          ? 'unsupportedReadOnly' : 'invalid',
        'reason' in launch ? launch.reason : 'La preparation Request3 V4 a échoué.',
        'snapshot' in launch ? launch.snapshot : undefined);
      await requireAuthorityStable(accessBefore, ws.id, mappedScope);
      return { status: 'ready', session: createSession({ sessionId: options.makeId('session'), workspaceId: ws.id,
        scope: mappedScope, sourceArchive: launch.sourceArchive, request: launch.request,
        candidatePolicy: clone(input.candidatePolicy), context: clone(launchInput.context), launcherAuthority: accessBefore }) };
    } catch (error) {
      const result = failure(error);
      return { status: result.status === 'conflict' || result.status === 'notFound' ? 'invalid' : result.status,
        reason: result.reason, ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }) };
    }
  }

  async function resumeSession(input: { workspaceId: string; operationId: string }): Promise<HopV55SemanticSessionOpenResultV3> {
    try {
      const ws = await readWorkspace(input.workspaceId);
      const ticket = findTicket(ws, input.operationId);
      if (!ticket) throw new HopV55SemanticAdoptionApplicationError('notFound', 'Aucun ticket V3 durable pour cette opération.');
      const archive = readArchiveV4(ws, ticket.references.sourceReadingReference);
      if (!same(archive, ticket.sourceArchive)) throw new HopV55SemanticAdoptionApplicationError('invalid', 'Le ticket V3 et l’archive V4 persistée divergent.');
      const access = await resolveAuthority(ws.id, ticket.request.contextLaunch.scope);
      const recordRows = rowsFor(ws, 'assistedSemanticAdviceRecords').filter(row => isRow(row) && row.ticketReference === ticket.reference);
      if (recordRows.length > 1) throw new HopV55SemanticAdoptionApplicationError('invalid', 'Plusieurs records revendiquent ce ticket V3 exact.');
      let resumedRecord: HopV55AssistedAdviceRecordV2 | undefined;
      if (recordRows.length === 1) {
        const recordRead = readHopV55AssistedAdviceArchiveV2({ ticket, record: recordRows[0] });
        if (recordRead.status !== 'readOnly') throw new HopV55SemanticAdoptionApplicationError(
          recordRead.status === 'unsupportedReadOnly' || recordRead.status === 'legacyReadOnly' ? 'unsupportedReadOnly' : 'invalid',
          recordRead.status === 'invalid' ? recordRead.reason : recordRead.reason,
          recordRead.status === 'unsupportedReadOnly' || recordRead.status === 'legacyReadOnly' ? recordRead.snapshot : undefined);
        resumedRecord = recordRead.record;
      }
      return { status: 'ready', session: createSession({ sessionId: options.makeId('session', ticket.operationId),
        workspaceId: ws.id, scope: ticket.request.contextLaunch.scope, sourceArchive: ticket.sourceArchive,
        request: ticket.request, candidatePolicy: ticket.candidatePolicy, ticket, resumedRecord, launcherAuthority: access }) };
    } catch (error) {
      const result = failure(error);
      return { status: result.status === 'conflict' || result.status === 'notFound' ? 'notFound' : result.status,
        reason: result.reason, ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }) };
    }
  }

  async function openWizardSession(input: { workspaceId: string; sourceReadingReference: string;
    scopeAtPageLaunch: BrewerHopAdviceWizardDraftScopeV1; candidatePolicy: HopPropertyAdviceCandidatePolicy }):
    Promise<HopV55SemanticWizardSessionOpenResultV1> {
    try {
      if (!options.readCurrentWizardContext) throw new HopV55SemanticAdoptionApplicationError('unavailable',
        'Le host ne lit pas le brouillon Wizard vivant; aucun fallback vers Recipe stockée.');
      assertHopV55AssistedAdviceCandidatePolicyV1(input.candidatePolicy);
      const ws = await readWorkspace(input.workspaceId);
      const archive = readWizardArchiveV4(ws, input.sourceReadingReference);
      const scope = mapBrewerHopAdviceWizardSourceToScopeV1(archive.source);
      if (!same(scope, input.scopeAtPageLaunch)) throw new HopV55SemanticAdoptionApplicationError('invalid',
        'Le scope de Page ne correspond pas à l’origine Wizard exacte de l’archive.');
      const authority = await resolveAuthority(ws.id, scope);
      const current = await readCurrentWizardInput({ workspace: ws, archive, scope });
      const launch = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1(current);
      if (launch.status !== 'ready') throw new HopV55SemanticAdoptionApplicationError(
        launch.status === 'stale' ? 'stale' : launch.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid',
        'reason' in launch ? launch.reason : 'La préparation Request3 Wizard a échoué.',
        'snapshot' in launch ? launch.snapshot : undefined);
      await requireAuthorityStable(authority, ws.id, scope);
      return { status: 'ready', session: createWizardSession({ sessionId: options.makeId('session'),
        workspaceId: ws.id, scope, snapshot: { recipe: clone(launch.sourceSnapshot.draft), reference: launch.sourceSnapshot.source.contentReference },
        sourceArchive: launch.sourceArchive, request: launch.request,
        candidatePolicy: clone(input.candidatePolicy), context: clone(launch.context), launcherAuthority: authority }) };
    } catch (error) {
      const result = failure(error);
      return { status: result.status === 'conflict' || result.status === 'notFound' ? 'invalid' : result.status,
        reason: result.reason, ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }) };
    }
  }

  async function resumeWizardSession(input: { workspaceId: string; operationId: string }):
    Promise<HopV55SemanticWizardSessionOpenResultV1> {
    try {
      const ws = await readWorkspace(input.workspaceId);
      const ticket = findWizardTicket(ws, input.operationId);
      if (!ticket) throw new HopV55SemanticAdoptionApplicationError('notFound', 'Aucun ticket Wizard durable pour cette opération.');
      const archive = readWizardArchiveV4(ws, ticket.references.sourceReadingReference);
      if (!same(archive, ticket.sourceArchive)) throw new HopV55SemanticAdoptionApplicationError('invalid',
        'Le ticket Wizard et l’archive V4 persistée divergent.');
      if (ticket.scope.kind !== 'draft') throw new HopV55SemanticAdoptionApplicationError('invalid', 'Le ticket Wizard conserve un scope non draft.');
      const wizardScope: BrewerHopAdviceWizardDraftScopeV1 = { kind: 'draft', id: ticket.scope.id };
      const authority = await resolveAuthority(ws.id, wizardScope);
      const storedSnapshot = readHopV55WizardSourceSnapshotForArchiveV1({ workspace: ws, archive: ticket.sourceArchive });
      const recordRows = rowsFor(ws, 'assistedSemanticAdviceRecords').filter(row => isRow(row) && row.ticketReference === ticket.reference);
      if (recordRows.length > 1) throw new HopV55SemanticAdoptionApplicationError('invalid', 'Plusieurs records revendiquent ce ticket Wizard.');
      let resumedRecord: HopV55AssistedAdviceWizardRecordV1 | undefined;
      if (recordRows.length === 1) {
        const recordRead = readHopV55AssistedAdviceWizardArchiveV1({ ticket, record: recordRows[0] });
        if (recordRead.status !== 'readOnly') throw new HopV55SemanticAdoptionApplicationError(
          recordRead.status === 'invalid' ? 'invalid' : 'unsupportedReadOnly', recordRead.reason,
          recordRead.status === 'unsupportedReadOnly' ? recordRead.snapshot : undefined);
        resumedRecord = recordRead.record;
      }
      return { status: 'ready', session: createWizardSession({ sessionId: options.makeId('session', ticket.operationId),
        workspaceId: ws.id, scope: wizardScope,
        snapshot: { recipe: clone(storedSnapshot.draft), reference: storedSnapshot.source.contentReference },
        sourceArchive: ticket.sourceArchive,
        request: ticket.request, candidatePolicy: ticket.candidatePolicy, ticket, resumedRecord, launcherAuthority: authority }) };
    } catch (error) {
      const result = failure(error);
      return { status: result.status === 'conflict' || result.status === 'notFound' ? 'notFound' : result.status,
        reason: result.reason, ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }) };
    }
  }

  function createSession(input: { sessionId: string; workspaceId: string; scope: BrewerHopAdviceContextScopeV1;
    sourceArchive: HopV55DecisionReadingArchiveV4; request: HopAdviceV1ClientEntryV3['hopAdvice'];
    candidatePolicy: HopPropertyAdviceCandidatePolicy; context?: BrewerContext; ticket?: HopV55AssistedAdviceTicketV3;
    resumedRecord?: HopV55AssistedAdviceRecordV2;
    launcherAuthority: Awaited<ReturnType<typeof resolveAuthority>> }): HopV55SemanticAdoptionSessionV3 {
    let durableTicket = input.ticket;
    let operationId = input.ticket?.operationId;
    let generation = input.ticket?.generation;

    async function ticketForOperation(op: string, expectedGeneration?: number): Promise<HopV55AssistedAdviceTicketV3> {
      const ws = await readWorkspace(input.workspaceId);
      const ticket = findTicket(ws, op);
      if (!ticket) throw new HopV55SemanticAdoptionApplicationError('notFound', 'Le ticket V3 n’est pas persisté.');
      if (ticket.workspaceId !== input.workspaceId || ticket.ownerKey !== ownerKey || ticket.operationId !== op
        || expectedGeneration !== undefined && ticket.generation !== expectedGeneration
        || ticket.references.sourceReadingReference !== input.sourceArchive.contentReference
        || !same(ticket.request, input.request) || !same(ticket.candidatePolicy, input.candidatePolicy)
        || !same(ticket.scope, input.scope)) {
        throw new HopV55SemanticAdoptionApplicationError('stale', 'La closure ticketée diffère de la session Request3 exacte.');
      }
      if (durableTicket && durableTicket.reference !== ticket.reference) {
        throw new HopV55SemanticAdoptionApplicationError('conflict', 'La fermeture durable a changé de référence.');
      }
      durableTicket = ticket;
      return ticket;
    }

    async function authorizeBeforeEmission(args: { operationId: string; generation: number }): Promise<HopV55SemanticWireAuthorizationResultV3> {
      try {
        const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
        const ticket = await ticketForOperation(args.operationId, args.generation);
        if (ticket.principal.principalId !== accessBefore.principal.principalId) {
          throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Un autre acteur ne rejoue pas le ticket du launcher.');
        }
        const ws = await readWorkspace(input.workspaceId);
        const archive = readArchiveV4(ws, ticket.references.sourceReadingReference);
        if (!same(archive, ticket.sourceArchive) || !same(archive, input.sourceArchive)) {
          throw new HopV55SemanticAdoptionApplicationError('stale', 'L’archive V4 du ticket a changé ou n’est plus la source de cette session.');
        }
        const current = await readCurrentInput({ workspace: ws, archive, scope: input.scope });
        const currentPage = prepareHopV55SemanticCurrentPageContextV1(current);
        if (currentPage.status !== 'ready') throw new HopV55SemanticAdoptionApplicationError(
          currentPage.status === 'stale' ? 'stale' : currentPage.status === 'legacyReadOnly' || currentPage.status === 'unsupportedFormat'
            ? 'unsupportedReadOnly' : 'invalid', 'Le contexte courant ne qualifie plus la source ticketée.',
          'raw' in currentPage ? currentPage.raw : undefined);
        const expectedProjection = hopAdviceContentReference('brewer-hop-advice-context-projection-v1', ticket.request.contextLaunch.expected);
        const currentProjection = hopAdviceContentReference('brewer-hop-advice-context-projection-v1', currentPage.projection);
        if (expectedProjection !== currentProjection) throw new HopV55SemanticAdoptionApplicationError('stale', 'Le contexte pertinent a changé; aucune reprise automatique.');
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        const persisted = await ticketForOperation(args.operationId, args.generation);
        if (persisted.reference !== ticket.reference || persisted.references.wireReference !== ticket.references.wireReference) {
          throw new HopV55SemanticAdoptionApplicationError('stale', 'Le wire ou ticket exact a changé avant son émission.');
        }
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        return { status: 'authorized', ticketReference: ticket.reference, wireReference: ticket.references.wireReference,
          operationId: ticket.operationId, generation: ticket.generation, wire: clone(ticket.wire) };
      } catch (error) {
        const result = failure(error);
        const status = result.status === 'conflict' || result.status === 'notFound' ? 'stale' : result.status;
        return { status, reason: result.reason, ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }) };
      }
    }
    async function persistTicketBeforeSend(entry: HopAdviceV1ClientEntryV3): Promise<HopV55AssistedAdviceTicketV3> {
      if (operationId && operationId !== entry.operationId) throw new HopV55SemanticAdoptionApplicationError('conflict', 'Une session V3 ne change pas d’opération.');
      if (generation !== undefined && generation !== entry.generation) throw new HopV55SemanticAdoptionApplicationError('conflict', 'La génération V3 a changé dans la même session.');
      if (!Number.isSafeInteger(entry.generation) || Number(entry.generation) < 0 || !isText(entry.operationId)
        || entry.question !== input.request.question || !same(entry.hopAdvice, input.request) || !same(entry.scope, input.scope)) {
        throw new HopV55SemanticAdoptionApplicationError('invalid', 'Question, Request3, scope ou génération du composeur diffère de la lecture V4 figée.');
      }
      const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
      if (!sameAuthority(accessBefore, input.launcherAuthority)) {
        throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Le principal de lancement a changé avant la sauvegarde du ticket.');
      }
      const ws = await readWorkspace(input.workspaceId);
      const archive = readArchiveV4(ws, input.sourceArchive.contentReference);
      if (!same(archive, input.sourceArchive)) throw new HopV55SemanticAdoptionApplicationError('stale', 'L’archive V4 a changé depuis l’ouverture de la session.');
      const freshInput = await readCurrentInput({ workspace: ws, archive, scope: input.scope });
      const freshLaunch = prepareHopV55SemanticAssistedAdviceLaunchV1(freshInput);
      if (freshLaunch.status !== 'ready' || !same(freshLaunch.request, input.request)) {
        const reason = freshLaunch.status === 'ready' ? 'Request3 courante différente de la lecture ouverte.'
          : 'reason' in freshLaunch ? freshLaunch.reason : 'La source ne qualifie plus Request3.';
        const code = freshLaunch.status === 'stale' ? 'stale'
          : freshLaunch.status === 'unsupportedReadOnly' || freshLaunch.status === 'legacyReadOnly' ? 'unsupportedReadOnly' : 'invalid';
        throw new HopV55SemanticAdoptionApplicationError(code, reason,
          'snapshot' in freshLaunch ? freshLaunch.snapshot : undefined);
      }
      await requireAuthorityStable(accessBefore, ws.id, input.scope);
      const wire = buildHopAdviceV1WireV3(entry);
      const existing = findTicket(ws, entry.operationId);
      if (existing) {
        if (!same(existing.candidatePolicy, input.candidatePolicy) || !same(existing.request, input.request)
          || !same(existing.wire, wire) || existing.principal.principalId !== accessBefore.principal.principalId) {
          throw new HopV55SemanticAdoptionApplicationError('conflict', 'Cette operationId a déjà une fermeture V3 différente.');
        }
        durableTicket = existing; operationId = existing.operationId; generation = existing.generation;
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        return existing;
      }
      if ((ws.assistedAdviceTickets ?? []).some(row => isRow(row) && row.operationId === entry.operationId)) {
        throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', 'operationId déjà utilisé par le transport V1 historique.');
      }
      const captured = createHopV55AssistedAdviceTicketV3({ id: options.makeId('ticket', entry.operationId),
        createdAt: options.now(), principal: accessBefore.principal, sourceArchive: archive, wire,
        candidatePolicy: input.candidatePolicy });
      if (captured.status !== 'ready') throw new HopV55SemanticAdoptionApplicationError(
        captured.status === 'tooLarge' || captured.status === 'unsupportedReadOnly' || captured.status === 'legacyReadOnly'
          ? 'unsupportedReadOnly' : 'invalid',
        'reason' in captured ? captured.reason : 'La Request3/wire dépasse la borne ou est invalide.',
        'snapshot' in captured ? captured.snapshot : undefined);
      const ticket = captured.ticket;
      await requireAuthorityStable(accessBefore, ws.id, input.scope);
      const next: HopV55Workspace = { ...ws, updatedAt: advancedAt(ws.updatedAt, ticket.createdAt),
        assistedSemanticAdviceTickets: [...(ws.assistedSemanticAdviceTickets ?? []), ticket] };
      const saved = await services.workspaces.save(next, ws.revision);
      const persisted = await readWorkspace(input.workspaceId);
      const readBack = findTicket(persisted, entry.operationId);
      if (!readBack || readBack.reference !== ticket.reference || !same(readBack, ticket)) {
        throw new HopV55SemanticAdoptionApplicationError('invalid', 'Le CAS du ticket n’a pas rendu la fermeture V3 exacte.');
      }
      await requireAuthorityStable(accessBefore, ws.id, input.scope);
      if (saved.id !== input.workspaceId || saved.ownerKey !== ownerKey) {
        throw new HopV55SemanticAdoptionApplicationError('invalid', 'Workspace sauvegardé hors partition attendue.');
      }
      durableTicket = readBack; operationId = readBack.operationId; generation = readBack.generation;
      return readBack;
    }

    async function receiveTurn(snapshot: HopV55SemanticJobSnapshotV3): Promise<HopV55SemanticTurnResultV3> {
      try {
        if (snapshot.format !== HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT || snapshot.status !== 'received'
          || !snapshot.job || snapshot.turn === undefined) {
          return snapshot.status === 'unsupportedReadOnly'
            ? { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Retour public futur conservé.' }
            : { status: 'pending', reason: snapshot.reason ?? 'Le job V3 attend encore un tour public.' };
        }
        const ws = await readWorkspace(input.workspaceId);
        const ticket = findTicket(ws, snapshot.operationId);
        if (!ticket || ticket.reference !== snapshot.ticketReference || ticket.generation !== snapshot.generation
          || ticket.references.wireReference !== snapshot.wireReference) {
          return { status: 'invalid', reason: 'Le snapshot public ne désigne pas le ticket/wire/génération V3 persistés.' };
        }
        const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
        const turnRead = readHopAdviceV1PublicTurn(snapshot.turn);
        if (turnRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: turnRead.reason, snapshot: turnRead.snapshot };
        if (turnRead.status !== 'available') return { status: 'invalid', reason: turnRead.reason };
        const turn = turnRead.value;
        const job = snapshot.job;
        if (job.protocol !== HOP_ADVICE_PROTOCOL_V1.name || job.status !== 'done' || job.id !== turn.id
          || job.operationId !== ticket.operationId || job.generation !== ticket.generation || job.question !== ticket.question
          || turn.operationId !== ticket.operationId || turn.question !== ticket.question || !same(job.scope, ticket.scope)) {
          return { status: 'invalid', reason: 'Job/tour public différent du ticket V3 exact.' };
        }
        const previous = (ws.assistedSemanticAdviceRecords ?? []).filter(row => isRow(row) && row.ticketReference === ticket.reference);
        if (previous.length > 1) return { status: 'invalid', reason: 'Plusieurs records revendiquent ce ticket V3.' };
        if (previous.length === 1) {
          const read = readHopV55AssistedAdviceArchiveV2({ ticket, record: previous[0] });
          if (read.status !== 'readOnly' || !same(read.record.turn, turn) || !same(read.record.job, job)) {
            return { status: 'conflict', reason: 'Un autre tour est déjà archivé sous ce ticket V3.' };
          }
          const closure = readHopV55SemanticAdoptionTurnClosureV1({ workspace: ws, ownerKey, workspaceId: ws.id,
            ticketId: ticket.id, operationId: ticket.operationId });
          if (closure.status !== 'available') return { status: closure.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid', reason: closure.reason };
          if (closure.closure.sourceRecordReference !== read.record.reference) return { status: 'invalid', reason: 'La fermeture durable pointe vers un autre record.' };
          await requireAuthorityStable(accessBefore, ws.id, input.scope);
          return { status: 'alreadyRecorded', record: read.record };
        }
        const archive = readArchiveV4(ws, ticket.references.sourceReadingReference);
        if (!same(archive, ticket.sourceArchive)) return { status: 'invalid', reason: 'Archive V4 source du ticket absente ou modifiée.' };
        const current = await readCurrentInput({ workspace: ws, archive, scope: input.scope });
        const v6 = receiveHopV55AssistedSemanticAdviceProposalV6({ request: ticket.request, sourceArchive: archive,
          envelope: turn.hopAdviceProposal, current, turnEvidence: turn.evidence, candidatePolicy: ticket.candidatePolicy });
        if (v6.status !== 'readOnly') {
          return { status: v6.status === 'legacyReadOnly' || v6.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid',
            reason: v6.status === 'invalid' ? v6.reason : v6.status === 'legacyReadOnly'
              ? 'Réponse legacy conservée sans promotion V6.' : v6.reason,
            ...(v6.status === 'legacyReadOnly' || v6.status === 'unsupportedReadOnly' ? { snapshot: v6.snapshot } : {}) };
        }
        if (!same(v6.envelope, turn.hopAdviceProposal) || !same(v6.turnEvidence, turn.evidence)) {
          return { status: 'invalid', reason: 'La réception V6 n’a pas conservé l’enveloppe et les preuves du même tour.' };
        }
        const record = createHopV55AssistedAdviceRecordV2({ id: options.makeId('record', ticket.operationId), recordedAt: options.now(),
          principal: ticket.principal, ticket, persistedTickets: ws.assistedSemanticAdviceTickets ?? [], job, turn, fullEvidence: turn.evidence });
        if (record.semantic.kind !== 'verifiedV6') {
          return { status: 'unsupportedReadOnly', reason: 'Le record reste opaque; aucun tour V5/futur n’est promu.', snapshot: record };
        }
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        const next: HopV55Workspace = { ...ws, updatedAt: advancedAt(ws.updatedAt, record.recordedAt),
          assistedSemanticAdviceRecords: [...(ws.assistedSemanticAdviceRecords ?? []), record] };
        await services.workspaces.save(next, ws.revision);
        const persisted = await readWorkspace(input.workspaceId);
        const savedRows = (persisted.assistedSemanticAdviceRecords ?? []).filter(row => isRow(row) && row.ticketReference === ticket.reference);
        if (savedRows.length !== 1) return { status: 'invalid', reason: 'Le CAS n’a pas rendu un record V2 unique sous le ticket exact.' };
        const read = readHopV55AssistedAdviceArchiveV2({ ticket, record: savedRows[0] });
        if (read.status === 'invalid') return { status: 'invalid', reason: read.reason };
        if (read.status !== 'readOnly') return { status: 'unsupportedReadOnly', reason: read.reason };
        if (read.record.reference !== record.reference || read.record.semantic.kind !== 'verifiedV6') {
          return { status: 'invalid', reason: 'Le record V2 durable diffère de la réponse V6 écrite.' };
        }
        const closure = readHopV55SemanticAdoptionTurnClosureV1({ workspace: persisted, ownerKey, workspaceId: persisted.id,
          ticketId: ticket.id, operationId: ticket.operationId });
        if (closure.status !== 'available') return { status: closure.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid', reason: closure.reason };
        if (closure.closure.sourceRecordReference !== read.record.reference) return { status: 'invalid', reason: 'La fermeture relue diffère du record V2 écrit.' };
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        return { status: 'recorded', record: read.record };
      } catch (error) {
        const result = failure(error);
        return { status: result.status === 'notFound' ? 'invalid' : result.status, reason: result.reason,
          ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }) };
      }
    }

    async function preview(args: Omit<HopV55SemanticAdoptionPreviewCommandV1,
      'ownerKey' | 'workspaceId' | 'ticketId' | 'operationId'> & { operationId: string }) {
      try {
        const ticket = await ticketForOperation(args.operationId);
        const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
        const result = await v6.preview({ ...args, ownerKey, workspaceId: input.workspaceId,
          ticketId: ticket.id, operationId: ticket.operationId });
        const accessAfter = await resolveAuthority(input.workspaceId, input.scope);
        if (!sameAuthority(accessBefore, accessAfter)) return { status: 'unavailable' as const, reason: 'Le principal ou son droit a changé pendant le preview.' };
        return result;
      } catch (error) {
        const result = failure(error);
        return result.status === 'unavailable' ? { status: 'unavailable' as const, reason: result.reason }
          : { status: result.status === 'notFound' ? 'notFound' as const : result.status === 'unsupportedReadOnly' ? 'unsupported' as const
            : result.status === 'stale' ? 'stale' as const : 'invalid' as const, reason: result.reason };
      }
    }

    async function confirm(plan: unknown) {
      try {
        const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
        const result = await v6.confirm({ ownerKey, workspaceId: input.workspaceId, plan });
        const accessAfter = await resolveAuthority(input.workspaceId, input.scope);
        if (!sameAuthority(accessBefore, accessAfter)) return { status: 'unavailable' as const, reason: 'Le principal ou son droit a changé pendant la confirmation/relecture.' };
        return result;
      } catch (error) { return { status: 'unavailable' as const, reason: error instanceof Error ? error.message : 'Autorité indisponible.' }; }
    }

    async function readHistory(commandId: string) {
      try {
        const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
        const history = await v6.readHistory({ ownerKey, workspaceId: input.workspaceId, commandId });
        const accessAfter = await resolveAuthority(input.workspaceId, input.scope);
        if (!sameAuthority(accessBefore, accessAfter)) return { status: 'unavailable' as const, reason: 'Le principal ou son droit a changé avant la relecture historique.' };
        return history;
      } catch (error) { return { status: 'unavailable' as const, reason: error instanceof Error ? error.message : 'Autorité indisponible.' }; }
    }

    return {
      format: HOP_V55_SEMANTIC_ASSISTED_SESSION_V3,
      id: input.sessionId,
      ownerKey,
      workspaceId: input.workspaceId,
      sourceReadingReference: input.sourceArchive.contentReference,
      openedByPrincipalId: input.launcherAuthority.principal.principalId,
      scope: clone(input.scope),
      request: clone(input.request),
      candidatePolicy: clone(input.candidatePolicy),
      ...(input.context ? { context: clone(input.context) } : {}),
      ...(input.ticket ? { resumedOperationId: input.ticket.operationId, resumedGeneration: input.ticket.generation } : {}),
      ...(input.resumedRecord ? { resumedRecord: clone(input.resumedRecord) } : {}),
      persistTicketBeforeSend,
      authorizeBeforeEmission,
      receiveTurn,
      async submit(args) {
        try {
          if (args.store.kind !== 'hopAdviceRequest3') return { status: 'unsupportedReadOnly', reason: 'Le store V1 ne reçoit pas Request3.' };
          const ticket = await persistTicketBeforeSend(args.entry);
          const preflight = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
          if (preflight.status !== 'authorized') return { status: preflight.status, reason: preflight.reason };
          const snapshot = await args.store.submit({ operationId: ticket.operationId, generation: ticket.generation,
            ticketReference: ticket.reference, wireReference: ticket.references.wireReference, wire: clone(ticket.wire),
            authorizeBeforeEachEmission: () => authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation }) });
          if (!snapshotMatchesTicket(snapshot, ticket)) return { status: 'invalid', reason: 'Le store V3 a rendu un job attaché à un autre wire/ticket.' };
          if (snapshot.status === 'received') {
            const receipt = await receiveTurn(snapshot);
            return submissionFromTurn(receipt, ticket, snapshot);
          }
          if (snapshot.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Job futur conservé.',
            durable: submissionDurableReference(ticket) };
          if (snapshot.status === 'failed') {
            const finalGate = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
            return finalGate.status === 'authorized'
              ? { status: 'invalid', reason: snapshot.reason ?? 'Le provider V3 a refusé le job.', durable: submissionDurableReference(ticket) }
              : { status: finalGate.status, reason: finalGate.reason, durable: submissionDurableReference(ticket) };
          }
          return { status: 'pending', ticket, job: snapshot };
        } catch (error) {
          const result = failure(error);
          return { status: result.status === 'notFound' ? 'invalid' : result.status, reason: result.reason,
            ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }),
            ...(durableTicket ? { durable: submissionDurableReference(durableTicket) } : {}) };
        }
      },
      async retry(args) {
        let retryTicket: HopV55AssistedAdviceTicketV3 | undefined;
        try {
          if (args.store.kind !== 'hopAdviceRequest3') return { status: 'unsupportedReadOnly', reason: 'Le store V1 ne reprend pas Request3.' };
          const ticket = await ticketForOperation(args.operationId, args.generation);
          retryTicket = ticket;
          const preflight = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
          if (preflight.status !== 'authorized') return { status: preflight.status, reason: preflight.reason };
          const snapshot = await args.store.retry({ operationId: ticket.operationId, generation: ticket.generation,
            ticketReference: ticket.reference, wireReference: ticket.references.wireReference, wire: clone(ticket.wire),
            authorizeBeforeEachEmission: () => authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation }) });
          if (!snapshotMatchesTicket(snapshot, ticket)) return { status: 'invalid', reason: 'Le retry V3 a changé operationId, génération ou wire.' };
          if (snapshot.status === 'received') {
            const receipt = await receiveTurn(snapshot);
            return submissionFromTurn(receipt, ticket, snapshot);
          }
          if (snapshot.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Job futur conservé.',
            durable: submissionDurableReference(ticket) };
          if (snapshot.status === 'failed') {
            const finalGate = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
            return finalGate.status === 'authorized'
              ? { status: 'invalid', reason: snapshot.reason ?? 'Le retry V3 a échoué.', durable: submissionDurableReference(ticket) }
              : { status: finalGate.status, reason: finalGate.reason, durable: submissionDurableReference(ticket) };
          }
          return { status: 'pending', ticket, job: snapshot };
        } catch (error) {
          const result = failure(error);
          return { status: result.status === 'notFound' ? 'notFound' : result.status, reason: result.reason,
            ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }),
            ...(retryTicket ? { durable: submissionDurableReference(retryTicket) } : {}) };
        }
      },
      async resubmit(args) {
        let ticket: HopV55AssistedAdviceTicketV3 | undefined;
        try {
          if (args.store.kind !== 'hopAdviceRequest3') return { status: 'unsupportedReadOnly', reason: 'Le store V1 ne réémet pas un wire Request3.' };
          ticket = await ticketForOperation(args.operationId);
          const preflight = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
          if (preflight.status !== 'authorized') return { status: preflight.status, reason: preflight.reason,
            durable: submissionDurableReference(ticket) };
          const snapshot = await args.store.submit({ operationId: ticket.operationId, generation: ticket.generation,
            ticketReference: ticket.reference, wireReference: ticket.references.wireReference, wire: clone(ticket.wire),
            authorizeBeforeEachEmission: () => authorizeBeforeEmission({ operationId: ticket!.operationId, generation: ticket!.generation }) });
          if (!snapshotMatchesTicket(snapshot, ticket)) return { status: 'invalid', reason: 'La réémission n’a pas relu le wire durable exact.',
            durable: submissionDurableReference(ticket) };
          if (snapshot.status === 'received') return submissionFromTurn(await receiveTurn(snapshot), ticket, snapshot);
          if (snapshot.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly',
            reason: snapshot.reason ?? 'Retour futur conservé.', durable: submissionDurableReference(ticket) };
          if (snapshot.status === 'failed') {
            const finalGate = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
            return finalGate.status === 'authorized'
              ? { status: 'invalid', reason: snapshot.reason ?? 'Le provider a refusé le wire durable.', durable: submissionDurableReference(ticket) }
              : { status: finalGate.status, reason: finalGate.reason, durable: submissionDurableReference(ticket) };
          }
          return { status: 'pending', ticket, job: snapshot };
        } catch (error) {
          const result = failure(error);
          return { status: result.status === 'notFound' ? 'notFound' : result.status, reason: result.reason,
            ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }),
            ...(ticket ? { durable: submissionDurableReference(ticket) } : {}) };
        }
      },
      async recover(args) {
        let recoveredTicket: HopV55AssistedAdviceTicketV3 | undefined;
        try {
          if (args.store.kind !== 'hopAdviceRequest3') return { status: 'unsupportedReadOnly', reason: 'Le store V1 ne relit pas Request3.' };
          const ticket = await ticketForOperation(args.operationId);
          recoveredTicket = ticket;
          const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
          const snapshot = await args.store.read({ ownerKey, workspaceId: input.workspaceId,
            operationId: ticket.operationId, generation: ticket.generation, ticketReference: ticket.reference,
            question: ticket.question, wireReference: ticket.references.wireReference });
          await requireAuthorityStable(accessBefore, input.workspaceId, input.scope);
          if (!snapshot) return { status: 'pending', ticket };
          if (!snapshotMatchesTicket(snapshot, ticket)) return { status: 'invalid', reason: 'Le job relu ne correspond pas au wire et ticket V3 durables.' };
          if (snapshot.status === 'received') {
            const receipt = await receiveTurn(snapshot);
            return submissionFromTurn(receipt, ticket, snapshot);
          }
          if (snapshot.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Job futur conservé.' };
          if (snapshot.status === 'failed') return { status: 'invalid', reason: snapshot.reason ?? 'Job V3 en échec.' };
          return { status: 'pending', ticket, job: snapshot };
        } catch (error) {
          const result = failure(error);
          return { status: result.status === 'notFound' ? 'notFound' : result.status, reason: result.reason,
            ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }),
            ...(recoveredTicket ? { durable: submissionDurableReference(recoveredTicket) } : {}) };
        }
      },
      preview,
      confirm,
      readHistory,
    };
  }

  function createWizardSession(input: { sessionId: string; workspaceId: string; scope: BrewerHopAdviceWizardDraftScopeV1;
    snapshot: BrewerHopAdviceWizardCanonicalSnapshotV1;
    sourceArchive: HopV55WizardDecisionReadingArchiveV4; request: BrewerHopAdviceWizardRequestV3;
    candidatePolicy: HopPropertyAdviceCandidatePolicy; context?: BrewerContext; ticket?: HopV55AssistedAdviceWizardTicketV1;
    resumedRecord?: HopV55AssistedAdviceWizardRecordV1;
    launcherAuthority: Awaited<ReturnType<typeof resolveAuthority>> }): HopV55SemanticAdoptionSessionForWizardV1 {
    let durableTicket = input.ticket;
    let operationId = input.ticket?.operationId;
    let generation = input.ticket?.generation;

    async function ticketForOperation(op: string, expectedGeneration?: number): Promise<HopV55AssistedAdviceWizardTicketV1> {
      const ws = await readWorkspace(input.workspaceId);
      const ticket = findWizardTicket(ws, op);
      if (!ticket) throw new HopV55SemanticAdoptionApplicationError('notFound', 'Ticket Wizard exact non persisté.');
      if (ticket.ownerKey !== ownerKey || ticket.workspaceId !== input.workspaceId || ticket.operationId !== op
        || expectedGeneration !== undefined && ticket.generation !== expectedGeneration
        || ticket.references.sourceReadingReference !== input.sourceArchive.contentReference
        || !same(ticket.request, input.request) || !same(ticket.candidatePolicy, input.candidatePolicy)
        || !same(ticket.scope, input.scope)) {
        throw new HopV55SemanticAdoptionApplicationError('stale', 'La closure Wizard durable diffère de la session Request3 exacte.');
      }
      if (durableTicket && durableTicket.reference !== ticket.reference) {
        throw new HopV55SemanticAdoptionApplicationError('conflict', 'Le ticket Wizard durable a changé de référence.');
      }
      durableTicket = ticket;
      return ticket;
    }

    function durableReference(ticket: HopV55AssistedAdviceWizardTicketV1): HopV55SemanticSubmissionDurableReferenceV3 {
      return { operationId: ticket.operationId, generation: ticket.generation,
        ticketReference: ticket.reference, wireReference: ticket.references.wireReference };
    }

    async function persistTicketBeforeSend(entry: HopAdviceV1WizardClientEntryV1): Promise<HopV55AssistedAdviceWizardTicketV1> {
      if (operationId && operationId !== entry.operationId) throw new HopV55SemanticAdoptionApplicationError('conflict', 'Une session Wizard ne change pas d’opération.');
      if (generation !== undefined && generation !== entry.generation) throw new HopV55SemanticAdoptionApplicationError('conflict', 'La génération Wizard a changé dans la même session.');
      if (!isText(entry.operationId) || !Number.isSafeInteger(entry.generation) || entry.generation < 0
        || entry.question !== input.request.question || !same(entry.hopAdvice, input.request)
        || !same(entry.scope, input.scope) || !same(entry.draft, input.snapshot.recipe)) {
        throw new HopV55SemanticAdoptionApplicationError('invalid', 'Question, Request3, scope ou génération du composeur Wizard diffère de la lecture figée.');
      }
      const wire = buildHopAdviceV1WireV3ForWizardV1(entry);
      const wireRequest = wire.hopAdvice;
      if (!same(wireRequest, input.request) || !same(wire.scope, input.scope) || !same(wire.draft, input.snapshot.recipe)) {
        throw new HopV55SemanticAdoptionApplicationError('invalid', 'Le wire Wizard ne conserve pas les champs exacts du composeur.');
      }
      const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
      if (!sameAuthority(accessBefore, input.launcherAuthority)) {
        throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Le principal du composeur a changé avant la capture du ticket Wizard.');
      }
      const ws = await readWorkspace(input.workspaceId);
      const archive = readWizardArchiveV4(ws, input.sourceArchive.contentReference);
      if (!same(archive, input.sourceArchive)) throw new HopV55SemanticAdoptionApplicationError('stale', 'L’archive Wizard source a changé depuis l’ouverture.');
      const freshInput = await readCurrentWizardInput({ workspace: ws, archive, scope: input.scope });
      const freshLaunch = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1(freshInput);
      if (freshLaunch.status !== 'ready' || !same(freshLaunch.request, input.request)) {
        throw new HopV55SemanticAdoptionApplicationError(freshLaunch.status === 'stale' ? 'stale'
          : freshLaunch.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid',
        freshLaunch.status === 'ready' ? 'La Request3 Wizard courante diffère de la session.' : freshLaunch.reason,
        'snapshot' in freshLaunch ? freshLaunch.snapshot : undefined);
      }
      await requireAuthorityStable(accessBefore, ws.id, input.scope);
      const existing = findWizardTicket(ws, entry.operationId);
      if (existing) {
        if (!same(existing.candidatePolicy, input.candidatePolicy) || !same(existing.request, input.request)
          || !same(existing.wire, wire) || existing.principal.principalId !== accessBefore.principal.principalId) {
          throw new HopV55SemanticAdoptionApplicationError('conflict', 'Cette operationId possède déjà un autre ticket Wizard.');
        }
        durableTicket = existing; operationId = existing.operationId; generation = existing.generation;
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        return existing;
      }
      if ((ws.assistedSemanticAdviceTickets ?? []).some(row => isRow(row) && row.operationId === entry.operationId)
        || (ws.assistedAdviceTickets ?? []).some(row => isRow(row) && row.operationId === entry.operationId)) {
        throw new HopV55SemanticAdoptionApplicationError('unsupportedReadOnly', 'Cette operationId est déjà liée à un autre profil; aucune conversion implicite.');
      }
      const captured = createHopV55AssistedAdviceWizardTicketV1({ id: options.makeId('ticket', entry.operationId),
        createdAt: options.now(), principal: accessBefore.principal, sourceArchive: archive,
        request: input.request, wire, candidatePolicy: input.candidatePolicy });
      if (captured.status !== 'ready') throw new HopV55SemanticAdoptionApplicationError(
        captured.status === 'unsupportedReadOnly' || captured.status === 'tooLarge' ? 'unsupportedReadOnly' : 'invalid',
        'reason' in captured ? captured.reason ?? 'Le ticket Wizard ou son wire dépasse la borne.' : 'Ticket Wizard invalide.',
        'snapshot' in captured ? captured.snapshot : undefined);
      const ticket = captured.ticket;
      const beforeCas = await readWorkspace(input.workspaceId);
      if (beforeCas.revision !== ws.revision) throw new HopV55SemanticAdoptionApplicationError('stale',
        'Le workspace a changé pendant la préparation du ticket Wizard; aucune rébase automatique.');
      const beforeCasArchive = readWizardArchiveV4(beforeCas, ticket.references.sourceReadingReference);
      if (!same(beforeCasArchive, ticket.sourceArchive)) throw new HopV55SemanticAdoptionApplicationError('stale',
        'L’archive Wizard a changé avant le CAS du ticket.');
      const beforeCasCurrent = await readCurrentWizardInput({ workspace: beforeCas, archive: beforeCasArchive, scope: input.scope });
      const beforeCasLaunch = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1(beforeCasCurrent);
      if (beforeCasLaunch.status !== 'ready' || !same(beforeCasLaunch.request, ticket.request)
        || !same(beforeCasLaunch.prepared, freshLaunch.prepared) || !same(beforeCasLaunch.sourceSnapshot, freshLaunch.sourceSnapshot)) {
        throw new HopV55SemanticAdoptionApplicationError(beforeCasLaunch.status === 'stale' ? 'stale'
          : beforeCasLaunch.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid',
        beforeCasLaunch.status === 'ready' ? 'Le contexte ou Prepared Wizard a changé avant le CAS du ticket.' : beforeCasLaunch.reason,
        'snapshot' in beforeCasLaunch ? beforeCasLaunch.snapshot : undefined);
      }
      await requireAuthorityStable(accessBefore, beforeCas.id, input.scope);
      const existingAtCas = findWizardTicket(beforeCas, entry.operationId);
      if (existingAtCas) {
        if (!same(existingAtCas.candidatePolicy, input.candidatePolicy) || !same(existingAtCas.request, input.request)
          || !same(existingAtCas.wire, wire) || existingAtCas.principal.principalId !== accessBefore.principal.principalId) {
          throw new HopV55SemanticAdoptionApplicationError('conflict', 'Cette operationId a été capturée pour un autre ticket pendant la préparation.');
        }
        durableTicket = existingAtCas; operationId = existingAtCas.operationId; generation = existingAtCas.generation;
        return existingAtCas;
      }
      const next: HopV55Workspace = { ...beforeCas, updatedAt: advancedAt(beforeCas.updatedAt, ticket.createdAt),
        assistedSemanticAdviceTickets: [...(beforeCas.assistedSemanticAdviceTickets ?? []), ticket] };
      const saved = await services.workspaces.save(next, beforeCas.revision);
      const persisted = await readWorkspace(input.workspaceId);
      const readBack = findWizardTicket(persisted, entry.operationId);
      if (!readBack || readBack.reference !== ticket.reference || !same(readBack, ticket)) {
        throw new HopV55SemanticAdoptionApplicationError('invalid', 'Le CAS n’a pas rendu le ticket Wizard exact.');
      }
      await requireAuthorityStable(accessBefore, ws.id, input.scope);
      if (saved.id !== input.workspaceId || saved.ownerKey !== ownerKey) {
        throw new HopV55SemanticAdoptionApplicationError('invalid', 'Ticket Wizard sauvegardé hors partition attendue.');
      }
      durableTicket = readBack; operationId = readBack.operationId; generation = readBack.generation;
      return readBack;
    }

    async function authorizeBeforeEmission(args: { operationId: string; generation: number }):
      Promise<HopV55SemanticWizardWireAuthorizationResultV1> {
      try {
        const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
        if (!sameAuthority(accessBefore, input.launcherAuthority)) {
          throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Un autre acteur ne réémet pas le ticket du composeur Wizard.');
        }
        const ticket = await ticketForOperation(args.operationId, args.generation);
        if (ticket.principal.principalId !== accessBefore.principal.principalId) {
          throw new HopV55SemanticAdoptionApplicationError('unavailable', 'Le ticket Wizard appartient à un autre acteur.');
        }
        const ws = await readWorkspace(input.workspaceId);
        const archive = readWizardArchiveV4(ws, ticket.references.sourceReadingReference);
        if (!same(archive, ticket.sourceArchive) || !same(archive, input.sourceArchive)) {
          throw new HopV55SemanticAdoptionApplicationError('stale', 'L’archive Wizard ou son contenu a changé; aucun rebasage.');
        }
        const current = await readCurrentWizardInput({ workspace: ws, archive, scope: input.scope });
        const launch = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1(current);
        if (launch.status !== 'ready' || !same(launch.request, ticket.request)) {
          throw new HopV55SemanticAdoptionApplicationError(launch.status === 'stale' ? 'stale'
            : launch.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid',
          launch.status === 'ready' ? 'La Request3 Wizard courante diffère du ticket.' : launch.reason,
          'snapshot' in launch ? launch.snapshot : undefined);
        }
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        const persisted = await ticketForOperation(args.operationId, args.generation);
        if (persisted.reference !== ticket.reference || persisted.references.wireReference !== ticket.references.wireReference) {
          throw new HopV55SemanticAdoptionApplicationError('stale', 'Le ticket ou wire Wizard exact a changé avant l’émission.');
        }
        const finalWorkspace = await readWorkspace(input.workspaceId);
        const finalTicket = findWizardTicket(finalWorkspace, args.operationId);
        if (!finalTicket || finalTicket.reference !== ticket.reference || finalTicket.generation !== args.generation
          || finalTicket.references.wireReference !== ticket.references.wireReference) {
          throw new HopV55SemanticAdoptionApplicationError('stale', 'Le ticket Wizard a changé avant le dernier garde d’émission.');
        }
        const finalArchive = readWizardArchiveV4(finalWorkspace, finalTicket.references.sourceReadingReference);
        if (!same(finalArchive, input.sourceArchive)) throw new HopV55SemanticAdoptionApplicationError('stale',
          'L’archive Wizard source a changé avant l’émission.');
        const finalCurrent = await readCurrentWizardInput({ workspace: finalWorkspace, archive: finalArchive, scope: input.scope });
        const finalLaunch = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1(finalCurrent);
        if (finalLaunch.status !== 'ready' || !same(finalLaunch.request, finalTicket.request)) {
          throw new HopV55SemanticAdoptionApplicationError(finalLaunch.status === 'stale' ? 'stale'
            : finalLaunch.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid',
          finalLaunch.status === 'ready' ? 'La Request3 Wizard a changé avant le dernier garde d’émission.' : finalLaunch.reason,
          'snapshot' in finalLaunch ? finalLaunch.snapshot : undefined);
        }
        await requireAuthorityStable(accessBefore, finalWorkspace.id, input.scope);
        return { status: 'authorized', ticketReference: ticket.reference, wireReference: ticket.references.wireReference,
          operationId: ticket.operationId, generation: ticket.generation, wire: clone(ticket.wire) };
      } catch (error) {
        const result = failure(error);
        const status = result.status === 'conflict' || result.status === 'notFound' ? 'stale' : result.status;
        return { status, reason: result.reason, ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }) };
      }
    }

    async function receiveTurn(snapshot: HopV55SemanticWizardJobSnapshotV1): Promise<HopV55SemanticWizardTurnResultV1> {
      try {
        if (snapshot.format !== HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1 || snapshot.status !== 'received'
          || !snapshot.job || snapshot.turn === undefined) {
          return snapshot.status === 'unsupportedReadOnly'
            ? { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Tour Wizard futur conservé.' }
            : { status: 'pending', reason: snapshot.reason ?? 'Le job Wizard attend encore un tour réel.' };
        }
        const ws = await readWorkspace(input.workspaceId);
        const ticket = findWizardTicket(ws, snapshot.operationId);
        if (!ticket || ticket.reference !== snapshot.ticketReference || ticket.generation !== snapshot.generation
          || ticket.references.wireReference !== snapshot.wireReference) {
          return { status: 'invalid', reason: 'Le snapshot public ne désigne pas le ticket/wire/génération Wizard persistés.' };
        }
        const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
        const turnRead = readHopAdviceV1PublicTurn(snapshot.turn);
        if (turnRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: turnRead.reason, snapshot: turnRead.snapshot };
        if (turnRead.status !== 'available') return { status: 'invalid', reason: turnRead.reason };
        const turn = turnRead.value;
        const job = snapshot.job;
        if (job.protocol !== HOP_ADVICE_PROTOCOL_V1.name || job.status !== 'done' || job.id !== turn.id
          || job.operationId !== ticket.operationId || job.generation !== ticket.generation || job.question !== ticket.question
          || turn.operationId !== ticket.operationId || turn.question !== ticket.question || !same(job.scope, ticket.scope)) {
          return { status: 'invalid', reason: 'Job ou tour réel différent du ticket Wizard exact.' };
        }
        const prior = (ws.assistedSemanticAdviceRecords ?? []).filter(row => isRow(row) && row.ticketReference === ticket.reference);
        if (prior.length > 1) return { status: 'invalid', reason: 'Plusieurs records revendiquent ce ticket Wizard.' };
        if (prior.length === 1) {
          const existing = readHopV55AssistedAdviceWizardArchiveV1({ ticket, record: prior[0] });
          if (existing.status !== 'readOnly' || !same(existing.record.turn, turn) || !same(existing.record.job, job)) {
            return { status: 'conflict', reason: 'Un autre tour a déjà été archivé sous ce ticket Wizard.' };
          }
          await requireAuthorityStable(accessBefore, ws.id, input.scope);
          return { status: 'alreadyRecorded', record: existing.record };
        }
        const record = createHopV55AssistedAdviceWizardRecordV1({ id: options.makeId('record', ticket.operationId),
          recordedAt: options.now(), principal: ticket.principal, ticket, persistedTickets: ws.assistedSemanticAdviceTickets ?? [],
          job, turn, fullEvidence: turn.evidence });
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        const next: HopV55Workspace = { ...ws, updatedAt: advancedAt(ws.updatedAt, record.recordedAt),
          assistedSemanticAdviceRecords: [...(ws.assistedSemanticAdviceRecords ?? []), record] };
        await services.workspaces.save(next, ws.revision);
        const persisted = await readWorkspace(input.workspaceId);
        const rows = (persisted.assistedSemanticAdviceRecords ?? []).filter(row => isRow(row) && row.ticketReference === ticket.reference);
        if (rows.length !== 1) return { status: 'invalid', reason: 'Le CAS Wizard n’a pas rendu un record unique sous son ticket.' };
        const read = readHopV55AssistedAdviceWizardArchiveV1({ ticket, record: rows[0] });
        if (read.status === 'invalid') return { status: 'invalid', reason: read.reason };
        if (read.status === 'unsupportedReadOnly') return { status: 'invalid', reason: read.reason };
        if (read.record.reference !== record.reference) return { status: 'invalid', reason: 'La référence du record Wizard relu diffère.' };
        await requireAuthorityStable(accessBefore, ws.id, input.scope);
        return { status: 'recorded', record: read.record };
      } catch (error) {
        const result = failure(error);
        return { status: result.status === 'conflict' || result.status === 'notFound' ? 'invalid' : result.status,
          reason: result.reason, ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }) };
      }
    }

    function durableResult(ticket: HopV55AssistedAdviceWizardTicketV1) { return durableReference(ticket); }
    function submissionFromWizardTurn(result: HopV55SemanticWizardTurnResultV1, ticket: HopV55AssistedAdviceWizardTicketV1,
      snapshot: HopV55SemanticWizardJobSnapshotV1): HopV55SemanticWizardSubmissionResultV1 {
      if ('record' in result) return { status: 'received', ticket, record: result.record };
      if (result.status === 'pending') return { status: 'pending', ticket, job: snapshot };
      return { status: result.status, reason: result.reason, ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }), durable: durableResult(ticket) };
    }

    return {
      format: HOP_V55_SEMANTIC_ASSISTED_SESSION_WIZARD_V1, id: input.sessionId, ownerKey, workspaceId: input.workspaceId,
      sourceReadingReference: input.sourceArchive.contentReference, openedByPrincipalId: input.launcherAuthority.principal.principalId,
      scope: clone(input.scope), snapshot: clone(input.snapshot), request: clone(input.request), candidatePolicy: clone(input.candidatePolicy),
      ...(input.context ? { context: clone(input.context) } : {}),
      ...(input.ticket ? { resumedOperationId: input.ticket.operationId, resumedGeneration: input.ticket.generation } : {}),
      ...(input.resumedRecord ? { resumedRecord: clone(input.resumedRecord) } : {}),
      async persistTicketBeforeSend(entry) {
        if (entry.hopAdvice.question !== input.request.question || entry.question !== input.request.question
          || !same(entry.hopAdvice, input.request) || !same(entry.scope, input.scope)) {
          throw new HopV55SemanticAdoptionApplicationError('invalid', 'Le composeur Wizard ne porte pas la Request3 exacte de cette session.');
        }
        return persistTicketBeforeSend(entry);
      },
      authorizeBeforeEmission,
      async submit(args) {
        let ticket: HopV55AssistedAdviceWizardTicketV1 | undefined;
        try {
          if (args.store.kind !== 'hopAdviceWizardRequest3V1') return { status: 'unsupportedReadOnly', reason: 'Le store classique ne reçoit pas de wire Wizard.' };
          ticket = await persistTicketBeforeSend(args.entry);
          const preflight = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
          if (preflight.status !== 'authorized') return { status: preflight.status, reason: preflight.reason, durable: durableResult(ticket) };
          const snapshot = await args.store.submit({ operationId: ticket.operationId, generation: ticket.generation,
            ticketReference: ticket.reference, wireReference: ticket.references.wireReference, wire: clone(ticket.wire),
            authorizeBeforeEachEmission: () => authorizeBeforeEmission({ operationId: ticket!.operationId, generation: ticket!.generation }) });
          if (!snapshotMatchesWizardTicket(snapshot, ticket)) return { status: 'invalid', reason: 'Le store Wizard a rendu un job lié à un autre wire/ticket.', durable: durableResult(ticket) };
          if (snapshot.status === 'received') return submissionFromWizardTurn(await receiveTurn(snapshot), ticket, snapshot);
          if (snapshot.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Retour Wizard futur.', durable: durableResult(ticket) };
          if (snapshot.status === 'failed') return { status: 'invalid', reason: snapshot.reason ?? 'Le provider Wizard a échoué.', durable: durableResult(ticket) };
          return { status: 'pending', ticket, job: snapshot };
        } catch (error) {
          const result = failure(error);
          return { status: result.status === 'notFound' ? 'notFound' : result.status, reason: result.reason,
            ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }), ...(ticket ? { durable: durableResult(ticket) } : {}) };
        }
      },
      async retry(args) {
        let ticket: HopV55AssistedAdviceWizardTicketV1 | undefined;
        try {
          if (args.store.kind !== 'hopAdviceWizardRequest3V1') return { status: 'unsupportedReadOnly', reason: 'Le store classique ne relit pas un ticket Wizard.' };
          ticket = await ticketForOperation(args.operationId, args.generation);
          const gate = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
          if (gate.status !== 'authorized') return { status: gate.status, reason: gate.reason, durable: durableResult(ticket) };
          const snapshot = await args.store.retry({ operationId: ticket.operationId, generation: ticket.generation,
            ticketReference: ticket.reference, wireReference: ticket.references.wireReference, wire: clone(ticket.wire),
            authorizeBeforeEachEmission: () => authorizeBeforeEmission({ operationId: ticket!.operationId, generation: ticket!.generation }) });
          if (!snapshotMatchesWizardTicket(snapshot, ticket)) return { status: 'invalid', reason: 'Le retry Wizard a changé le wire ou la génération.', durable: durableResult(ticket) };
          if (snapshot.status === 'received') return submissionFromWizardTurn(await receiveTurn(snapshot), ticket, snapshot);
          if (snapshot.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Retour Wizard futur.', durable: durableResult(ticket) };
          if (snapshot.status === 'failed') return { status: 'invalid', reason: snapshot.reason ?? 'Retry Wizard en échec.', durable: durableResult(ticket) };
          return { status: 'pending', ticket, job: snapshot };
        } catch (error) {
          const result = failure(error);
          return { status: result.status === 'notFound' ? 'notFound' : result.status, reason: result.reason,
            ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }), ...(ticket ? { durable: durableResult(ticket) } : {}) };
        }
      },
      async resubmit(args) {
        let ticket: HopV55AssistedAdviceWizardTicketV1 | undefined;
        try {
          if (args.store.kind !== 'hopAdviceWizardRequest3V1') return { status: 'unsupportedReadOnly', reason: 'Le store classique ne réémet pas un ticket Wizard.' };
          ticket = await ticketForOperation(args.operationId);
          const gate = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
          if (gate.status !== 'authorized') return { status: gate.status, reason: gate.reason, durable: durableResult(ticket) };
          const snapshot = await args.store.submit({ operationId: ticket.operationId, generation: ticket.generation,
            ticketReference: ticket.reference, wireReference: ticket.references.wireReference, wire: clone(ticket.wire),
            authorizeBeforeEachEmission: () => authorizeBeforeEmission({ operationId: ticket!.operationId, generation: ticket!.generation }) });
          if (!snapshotMatchesWizardTicket(snapshot, ticket)) return { status: 'invalid', reason: 'La réémission n’a pas relu le wire Wizard durable exact.', durable: durableResult(ticket) };
          if (snapshot.status === 'received') return submissionFromWizardTurn(await receiveTurn(snapshot), ticket, snapshot);
          if (snapshot.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Retour futur conservé.', durable: durableResult(ticket) };
          if (snapshot.status === 'failed') return { status: 'invalid', reason: snapshot.reason ?? 'La réémission Wizard a échoué.', durable: durableResult(ticket) };
          return { status: 'pending', ticket, job: snapshot };
        } catch (error) {
          const result = failure(error);
          return { status: result.status === 'notFound' ? 'notFound' : result.status, reason: result.reason,
            ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }), ...(ticket ? { durable: durableResult(ticket) } : {}) };
        }
      },
      async recover(args) {
        let ticket: HopV55AssistedAdviceWizardTicketV1 | undefined;
        try {
          if (args.store.kind !== 'hopAdviceWizardRequest3V1') return { status: 'unsupportedReadOnly', reason: 'Le store classique ne relit pas le job Wizard.' };
          ticket = await ticketForOperation(args.operationId);
          const accessBefore = await resolveAuthority(input.workspaceId, input.scope);
          if (!sameAuthority(accessBefore, input.launcherAuthority)) return { status: 'unavailable',
            reason: 'L’acteur courant ne peut pas reprendre le wire du composeur Wizard.' };
          const gate = await authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation });
          if (gate.status !== 'authorized') return { status: gate.status, reason: gate.reason, durable: durableResult(ticket) };
          const snapshot = await args.store.read({ ownerKey, workspaceId: input.workspaceId, operationId: ticket.operationId,
            generation: ticket.generation, question: ticket.question, ticketReference: ticket.reference,
            wireReference: ticket.references.wireReference, wire: clone(ticket.wire),
            authorizeBeforeRead: () => authorizeBeforeEmission({ operationId: ticket!.operationId, generation: ticket!.generation }) });
          await requireAuthorityStable(accessBefore, input.workspaceId, input.scope);
          if (!snapshot) return { status: 'pending', ticket };
          if (!snapshotMatchesWizardTicket(snapshot, ticket)) return { status: 'invalid', reason: 'Job relu différent du ticket/wire Wizard exact.' };
          if (snapshot.status === 'received') return submissionFromWizardTurn(await receiveTurn(snapshot), ticket, snapshot);
          if (snapshot.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', reason: snapshot.reason ?? 'Job futur conservé.' };
          if (snapshot.status === 'failed') return { status: 'invalid', reason: snapshot.reason ?? 'Job Wizard en échec.' };
          return { status: 'pending', ticket, job: snapshot };
        } catch (error) {
          const result = failure(error);
          return { status: result.status === 'notFound' ? 'notFound' : result.status, reason: result.reason,
            ...(result.snapshot === undefined ? {} : { snapshot: result.snapshot }), ...(ticket ? { durable: durableResult(ticket) } : {}) };
        }
      },
      receiveTurn,
      async preview(args) {
        const ticket = await ticketForOperation(args.operationId);
        return v6.preview({ ...args, profile: 'wizardV1', ownerKey, workspaceId: input.workspaceId,
          ticketId: ticket.id, operationId: ticket.operationId });
      },
      confirm(plan) { return v6.confirm({ ownerKey, workspaceId: input.workspaceId, plan }); },
      readHistory(commandId) { return v6.readHistory({ ownerKey, workspaceId: input.workspaceId, commandId }); },
    };
  }

  return { openSession, resumeSession, openWizardSession, resumeWizardSession };
}

function snapshotMatchesTicket(snapshot: HopV55SemanticJobSnapshotV3, ticket: HopV55AssistedAdviceTicketV3): boolean {
  return snapshot.format === HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT
    && snapshot.ticketReference === ticket.reference && snapshot.wireReference === ticket.references.wireReference
    && snapshot.operationId === ticket.operationId && snapshot.generation === ticket.generation;
}
function snapshotMatchesWizardTicket(snapshot: HopV55SemanticWizardJobSnapshotV1, ticket: HopV55AssistedAdviceWizardTicketV1): boolean {
  return snapshot.format === HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1
    && snapshot.ticketReference === ticket.reference && snapshot.wireReference === ticket.references.wireReference
    && snapshot.operationId === ticket.operationId && snapshot.generation === ticket.generation;
}
function submissionDurableReference(ticket: HopV55AssistedAdviceTicketV3): HopV55SemanticSubmissionDurableReferenceV3 {
  return { operationId: ticket.operationId, generation: ticket.generation,
    ticketReference: ticket.reference, wireReference: ticket.references.wireReference };
}
function submissionFromTurn(receipt: HopV55SemanticTurnResultV3, ticket: HopV55AssistedAdviceTicketV3,
  snapshot: HopV55SemanticJobSnapshotV3): HopV55SemanticSubmissionResultV3 {
  if (receipt.status === 'recorded' || receipt.status === 'alreadyRecorded') {
    return { status: 'received', ticket, record: receipt.record };
  }
  if (receipt.status === 'pending') return { status: 'pending', ticket, job: snapshot };
  return { status: receipt.status, reason: receipt.reason,
    ...(receipt.snapshot === undefined ? {} : { snapshot: receipt.snapshot }), durable: submissionDurableReference(ticket) };
}
