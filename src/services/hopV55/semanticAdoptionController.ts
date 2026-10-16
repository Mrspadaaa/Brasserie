/**
 * Application controller for V6 semantic adoption. By default its turns come from the durable semantic
 * archive (ticket V3 + record V2) re-read through the workspace repository; an injected reader is only a
 * test seam. The older Request2/V5 ticket facade, policy-less V2 tickets and opaque turns never start an
 * adoption. The repository fields (`assistedSemanticAdvice*`, `semanticAdoptionCommits`) belong to #67.
 */
import type { BrewerEvidence } from '../../../functions/src/companionTypes';
import { brewerHopAdviceRequestV3Reference, brewerHopAdviceRequestV3ReferenceForWizardV1,
  type BrewerHopAdviceRequestV3 } from '../../../functions/src/brewerHopAdviceSemanticV3';
import type { BrewerHopAdviceProposalEnvelopeV6 } from '../../../functions/src/brewerHopAdviceSemanticV6';
import type { BrewerHopAdviceContextScopeV1 } from '../../../functions/src/brewerHopAdviceContextBinding';
import type { HopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopV55Workspace, HopV55WorkspaceRepository } from './contracts';
import { readHopV55DocumentaryAnswerRecord } from './documentaryRecords';
import { readHopV55PropertyAdviceAnswerRecordV4ForWizardV1,
  type HopV55PropertyAdviceAnswerRecordV4, type HopV55PropertyAdviceAnswerRecordV4ForWizardV1 } from './propertyAdviceRecordsV4';
import type { HopV55DecisionReadingArchiveV4 } from './brewerHopAdviceSemanticSource4';
import { prepareHopV55SemanticAssistedAdviceLaunchForWizardV1,
  type PrepareHopV55SemanticContextLaunchInput, type PrepareHopV55SemanticContextLaunchInputForWizardV1 } from './assistedSemanticAdviceContextV4';
import type { HopV55WizardDecisionReadingArchiveV4 } from './decisionArchive';
import {
  confirmHopV55SemanticAdoptionV1,
  hopV55SemanticAdoptionFingerprintV1,
  prepareHopV55SemanticAdoptionPlanV1,
  readHopV55SemanticAdoptionPlanV1,
  readHopV55SemanticAdoptionReceiptV1,
  resolveHopV55SemanticAdoptionReplayV1,
  type PrepareHopV55SemanticAdoptionPlanV1Result,
  type ConfirmHopV55SemanticAdoptionV1Result,
  type HopV55SemanticAdoptionPlanV1,
  type HopV55SemanticAdoptionPrincipalV1,
  type HopV55SemanticAdoptionReceiptV1,
  type HopV55SemanticAdoptionSelectionInputV1,
  type HopV55SemanticAdoptionTicketV1,
} from './assistedSemanticAdviceAdoptionV6';
import { HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT, HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT,
  HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT } from './assistedSemanticAdviceArchiveV2';
import {
  createHopV55SemanticAdoptionTurnSourceV1,
  type HopV55SemanticAdviceArchiveWorkspaceV1,
  type HopV55SemanticAdoptionTurnClosureForWizardV1,
  type HopV55SemanticAdoptionTurnReadForWizardV1,
} from './semanticAdoptionTurnSource';

export const HOP_V55_SEMANTIC_ADOPTION_COMMIT_V1_FORMAT = 'hop-v55-semantic-adoption-commit-v1' as const;
const COMMIT_PREFIX = 'hop-v55-semantic-adoption-commit-';

type Row = Record<string, unknown>;
type AdoptionWorkspace = HopV55SemanticAdviceArchiveWorkspaceV1 & { semanticAdoptionCommits?: unknown[] };
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const clone = <T,>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown) => {
  try { return hopAdviceContentReference('hop-v55-semantic-adoption-controller-equality-v1', left)
    === hopAdviceContentReference('hop-v55-semantic-adoption-controller-equality-v1', right); }
  catch { return false; }
};
const exactKeys = (value: Row, keys: readonly string[]) => Object.keys(value).sort().join('|') === [...keys].sort().join('|');

export interface HopV55SemanticAdoptionCommitV1 {
  format: typeof HOP_V55_SEMANTIC_ADOPTION_COMMIT_V1_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceTicketReference: string;
  sourceRecordReference: string;
  wireReference: string;
  plan: HopV55SemanticAdoptionPlanV1;
  recordReference: string;
  receipt: HopV55SemanticAdoptionReceiptV1;
  reference: string;
}

/** A future commit is preserved without interpretation or use as the current head. */
export interface HopV55SemanticAdoptionOpaqueCommitV1 {
  format: string;
  readonly [key: string]: unknown;
}

export type HopV55SemanticAdoptionCommitHistoryEntryV1 = HopV55SemanticAdoptionCommitV1 | HopV55SemanticAdoptionOpaqueCommitV1;

/** Durable closure rows of the workspace, already validated by the semantic collection validator of the same pass. */
export interface HopV55SemanticAdoptionClosureRowsV1 {
  tickets: readonly unknown[];
  records: readonly unknown[];
}

export type HopV55SemanticAdoptionCommitReadV1 =
  | { status: 'readOnly'; commit: HopV55SemanticAdoptionCommitV1 }
  | { status: 'unsupportedReadOnly'; raw: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type HopV55SemanticAdoptionTurnClosureV1 = {
  /** Exact V2 archive envelope references resolved from the durable ticket/record reader. */
  sourceTicketReference: string;
  sourceRecordReference: string;
  wireReference: string;
  /** Narrow identity is derived by the host's strict durable ticket reader, never by the model. */
  ticket: HopV55SemanticAdoptionTicketV1;
  request: BrewerHopAdviceRequestV3;
  /** Explicit policy saved with the V6 ticket; RequestV3 intentionally does not contain this field. */
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  sourceArchive: HopV55DecisionReadingArchiveV4;
  envelope: BrewerHopAdviceProposalEnvelopeV6;
  turnEvidence: readonly BrewerEvidence[];
};

export type HopV55SemanticAdoptionTurnReadV1 =
  | { status: 'available'; closure: HopV55SemanticAdoptionTurnClosureV1 }
  | { status: 'absent' | 'unsupportedReadOnly' | 'invalid'; reason: string; raw?: unknown };

/** This reader must be backed by the eventual durable V6 façade; the Request2/V5 App reader cannot implement it. */
export interface HopV55SemanticAdoptionTurnReaderV1 {
  read(input: { ownerKey: string; workspaceId: string; ticketId: string; operationId: string }):
    Promise<HopV55SemanticAdoptionTurnReadV1>;
  readWizard?(input: { ownerKey: string; workspaceId: string; ticketId: string; operationId: string }):
    Promise<HopV55SemanticAdoptionTurnReadForWizardV1>;
}

export interface HopV55SemanticAdoptionControllerHostV1 {
  workspaces: HopV55WorkspaceRepository;
  /** Defaults to the durable semantic archive read through `workspaces`; an injected reader is a test seam only. */
  turns?: HopV55SemanticAdoptionTurnReaderV1;
  /** Re-resolves Recipe/Batch/source and prepares current physical Page context; never reuses a caller snapshot. */
  readCurrent(input: { workspace: HopV55Workspace; sourceArchive: HopV55DecisionReadingArchiveV4;
    scope: BrewerHopAdviceContextScopeV1 }): Promise<PrepareHopV55SemanticContextLaunchInput>;
  /** Authenticated session principal; label is display metadata only. */
  readPrincipal(input: { ownerKey: string; workspaceId: string; scope: BrewerHopAdviceContextScopeV1 }):
    Promise<HopV55SemanticAdoptionPrincipalV1>;
  /** Resolves the current NR binding, including explicit absence; no model-provided binding is accepted. */
  readCultureBinding(input: { workspace: HopV55Workspace; current: PrepareHopV55SemanticContextLaunchInput }):
    Promise<import('./adoptedContextResolution').HopV55AdoptedContextBindingV1 | null>;
  /** Current unsaved Wizard source and Prepared; absent means the Wizard lane is unavailable in this host. */
  readCurrentWizard?(input: { workspace: HopV55Workspace; sourceArchive: HopV55WizardDecisionReadingArchiveV4;
    scope: BrewerHopAdviceContextScopeV1 }): Promise<PrepareHopV55SemanticContextLaunchInputForWizardV1>;
  readCultureBindingForWizard?(input: { workspace: HopV55Workspace; current: PrepareHopV55SemanticContextLaunchInputForWizardV1 }):
    Promise<import('./adoptedContextResolution').HopV55AdoptedContextBindingV1 | null>;
  now(): string;
}

export interface HopV55SemanticAdoptionPreviewCommandV1 {
  profile?: 'wizardV1';
  ownerKey: string;
  workspaceId: string;
  ticketId: string;
  operationId: string;
  commandId: string;
  recordId: string;
  requestId: string;
  reason: string;
  selection: readonly HopV55SemanticAdoptionSelectionInputV1[];
}

export type HopV55SemanticAdoptionControllerPreviewV1 =
  | { status: 'ready'; plan: HopV55SemanticAdoptionPlanV1;
      preview: Extract<PrepareHopV55SemanticAdoptionPlanV1Result, { status: 'ready' }>['preview'] }
  | { status: 'stale' | 'pending' | 'unsupported' | 'invalid' | 'notFound'; reason: string;
      historical?: HopV55SemanticAdoptionTurnClosureV1 | HopV55SemanticAdoptionTurnClosureForWizardV1 };

export type HopV55SemanticAdoptionControllerConfirmV1 =
  | { status: 'committed'; record: HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1;
      receipt: HopV55SemanticAdoptionReceiptV1;
      recipeEffect: 'none'; workspaceRevision: number }
  | { status: 'replay'; receipt: HopV55SemanticAdoptionReceiptV1; recipeEffect: 'none'; workspaceRevision: number }
  | { status: 'stale' | 'pending' | 'unsupported' | 'invalid' | 'conflict' | 'notFound'; reason: string };

export type HopV55SemanticAdoptionHistoryReadV1 =
  | { status: 'readOnly'; commit: HopV55SemanticAdoptionCommitV1;
      record: HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1; revision: number }
  | { status: 'absent' | 'unsupportedReadOnly' | 'invalid'; reason: string; raw?: unknown };

const commitRef = (body: Omit<HopV55SemanticAdoptionCommitV1, 'reference'>) =>
  hopAdviceContentReference(HOP_V55_SEMANTIC_ADOPTION_COMMIT_V1_FORMAT, body);

export function createHopV55SemanticAdoptionCommitV1(input: {
  plan: HopV55SemanticAdoptionPlanV1;
  record: HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1;
  receipt: HopV55SemanticAdoptionReceiptV1;
  sourceTicketReference: string;
  sourceRecordReference: string;
  wireReference: string;
}): HopV55SemanticAdoptionCommitV1 {
  const plan = readHopV55SemanticAdoptionPlanV1(input.plan);
  const receipt = readHopV55SemanticAdoptionReceiptV1(input.receipt);
  if (receipt.commandId !== plan.commandId || receipt.planReference !== plan.reference
    || !isText(input.sourceTicketReference) || !isText(input.sourceRecordReference) || !isText(input.wireReference)
    || receipt.record.id !== input.record.id || receipt.record.reference !== input.record.reference
    || receipt.record.ledgerReference !== input.record.ledger.reference
    || input.record.transition.actId !== plan.commandId
    || input.record.ownerKey !== plan.principal.ownerKey || input.record.workspaceId !== plan.principal.workspaceId
    || input.record.sourceReadingReference !== plan.sourceReadingReference) {
    throw new Error('Record V4, plan et reçu V6 ne désignent pas le même commit exact.');
  }
  const body: Omit<HopV55SemanticAdoptionCommitV1, 'reference'> = {
    format: HOP_V55_SEMANTIC_ADOPTION_COMMIT_V1_FORMAT,
    id: plan.commandId, ownerKey: plan.principal.ownerKey, workspaceId: plan.principal.workspaceId,
    sourceTicketReference: input.sourceTicketReference, sourceRecordReference: input.sourceRecordReference, wireReference: input.wireReference,
    plan: clone(plan), recordReference: input.record.reference, receipt: clone(receipt),
  };
  return { ...body, reference: commitRef(body) };
}

export function readHopV55SemanticAdoptionCommitV1(value: unknown): HopV55SemanticAdoptionCommitReadV1 {
  if (!isRow(value)) return { status: 'invalid', reason: 'Commit d’adoption V6 illisible.' };
  if (typeof value.format === 'string' && value.format.startsWith(COMMIT_PREFIX)
    && value.format !== HOP_V55_SEMANTIC_ADOPTION_COMMIT_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', raw: clone(value), reason: `Format futur de commit V6 : ${value.format}.` };
  }
  if (value.format !== HOP_V55_SEMANTIC_ADOPTION_COMMIT_V1_FORMAT) {
    return { status: 'invalid', reason: 'Format de commit d’adoption V6 inconnu.' };
  }
  const keys = ['format', 'id', 'ownerKey', 'workspaceId', 'sourceTicketReference', 'sourceRecordReference', 'wireReference',
    'plan', 'recordReference', 'receipt', 'reference'];
  if (!exactKeys(value, keys) || !isText(value.id) || !isText(value.ownerKey) || !isText(value.workspaceId)
    || !isText(value.sourceTicketReference) || !isText(value.sourceRecordReference) || !isText(value.wireReference)
    || !isText(value.recordReference) || !isText(value.reference)) {
    return { status: 'invalid', reason: 'Commit V6 connu incomplet ou étendu.' };
  }
  try {
    const plan = readHopV55SemanticAdoptionPlanV1(value.plan);
    const receipt = readHopV55SemanticAdoptionReceiptV1(value.receipt);
    const { reference: _reference, ...body } = value;
    if (commitRef(body as Omit<HopV55SemanticAdoptionCommitV1, 'reference'>) !== value.reference
      || value.id !== plan.commandId || value.ownerKey !== plan.principal.ownerKey || value.workspaceId !== plan.principal.workspaceId
      || receipt.commandId !== plan.commandId || receipt.planReference !== plan.reference
      || receipt.fingerprint !== hopV55SemanticAdoptionFingerprintV1(plan)
      || !same(receipt.principal, plan.principal) || !same(receipt.ticket, plan.ticket)
      || !same(receipt.expectedHead, plan.expectedHead)
      || !same(receipt.selection, plan.selection.map(row => ({ optionId: row.optionId, proposalId: row.proposalId })) )
      || receipt.record.id !== plan.recordId || receipt.record.reference !== value.recordReference) {
      return { status: 'invalid', reason: 'Commit, plan et reçu V6 ne sont pas liés par les références exactes.' };
    }
    return { status: 'readOnly', commit: clone(value as unknown as HopV55SemanticAdoptionCommitV1) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Plan ou reçu V6 illisible.' };
  }
}

function readV4Answers(rows: unknown[], ownerKey: string, workspaceId: string): Map<string,
  HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1> {
  const records = new Map<string, HopV55PropertyAdviceAnswerRecordV4 | HopV55PropertyAdviceAnswerRecordV4ForWizardV1>();
  for (const raw of rows) {
    if (isRow(raw) && isRow(raw.preparation) && isRow(raw.preparation.source)
      && raw.preparation.source.kind === 'wizardDraft') {
      const wizard = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(raw);
      if (wizard.status === 'readOnly') {
        const record = wizard.record;
        if (record.ownerKey !== ownerKey || record.workspaceId !== workspaceId) throw new Error('Record V4 Wizard hors owner/workspace.');
        records.set(record.reference, record);
      }
      continue;
    }
    const read = readHopV55DocumentaryAnswerRecord(raw);
    if (read.status === 'unsupportedReadOnly') continue;
    if (read.version === 'v4') {
      const record = read.record as HopV55PropertyAdviceAnswerRecordV4;
      if (record.ownerKey !== ownerKey || record.workspaceId !== workspaceId) throw new Error('Record V4 hors owner/workspace.');
      records.set(record.reference, record);
    }
  }
  return records;
}

/**
 * A known commit names the exact durable closure it came from: a V3 ticket that sealed the same policy,
 * ticket identity, Request3 and wire, and its V2 record carrying the adopted V6 envelope. Rows are those
 * validated by the semantic collection validator of the same pass; only their links are compared here.
 */
function assertCommitClosureLinks(commit: HopV55SemanticAdoptionCommitV1, closures: HopV55SemanticAdoptionClosureRowsV1): void {
  const ticket = closures.tickets.find(row => isRow(row) && row.reference === commit.sourceTicketReference);
  const record = closures.records.find(row => isRow(row) && row.reference === commit.sourceRecordReference);
  const plan = commit.plan;
  if (!isRow(ticket) || !isRow(record) || !isRow(ticket.references)) {
    throw new Error('Commit V6 sans fermeture durable liée (ticket ou record absent ou illisible).');
  }
  if (plan.profile === 'wizardV1') {
    if (ticket.format !== HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT
      || record.format !== HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT
      || record.ticketReference !== ticket.reference || ticket.references.wireReference !== commit.wireReference
      || ticket.references.requestReference !== plan.ticket.requestReference || ticket.references.requestReference !== plan.requestReference
      || ticket.id !== plan.ticket.ticketId || ticket.operationId !== plan.ticket.operationId || ticket.generation !== plan.ticket.generation
      || ticket.ownerKey !== commit.ownerKey || ticket.workspaceId !== commit.workspaceId
      || !same(ticket.candidatePolicy, plan.candidatePolicy) || !isRow(record.semantic) || record.semantic.kind !== 'verifiedV6'
      || !isRow(record.turn) || !isRow(record.turn.hopAdviceProposal) || record.turn.hopAdviceProposal.reference !== plan.envelopeReference) {
      throw new Error('Commit V6 détaché de la closure Wizard exacte (ticket, record, wire, politique ou enveloppe).');
    }
    return;
  }
  if (ticket.format !== HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT
    || record.ticketReference !== ticket.reference
    || ticket.references.wireReference !== commit.wireReference || ticket.references.requestReference !== plan.ticket.requestReference
    || ticket.references.requestReference !== plan.requestReference
    || ticket.id !== plan.ticket.ticketId || ticket.operationId !== plan.ticket.operationId || ticket.generation !== plan.ticket.generation
    || ticket.ownerKey !== commit.ownerKey || ticket.workspaceId !== commit.workspaceId
    || !same(ticket.candidatePolicy, plan.candidatePolicy)
    || !isRow(record.semantic) || record.semantic.kind !== 'verifiedV6'
    || !isRow(record.turn) || !isRow(record.turn.hopAdviceProposal) || record.turn.hopAdviceProposal.reference !== plan.envelopeReference) {
    throw new Error('Commit V6 détaché de la fermeture durable exacte (ticket V3, record V2, wire, politique ou enveloppe).');
  }
}

export function assertHopV55SemanticAdoptionCommitHistoryV1(input: {
  commits: unknown; documentaryAnswers: unknown; ownerKey: string; workspaceId: string;
  /** Durable closure rows; when given, every known commit must link to its exact V3 ticket and V2 record. */
  closures?: HopV55SemanticAdoptionClosureRowsV1;
}): void {
  if (input.commits === undefined) return;
  if (!Array.isArray(input.commits) || !Array.isArray(input.documentaryAnswers)) throw new Error('Historique de commits V6 ou réponses documentaires illisible.');
  const answers = readV4Answers(input.documentaryAnswers, input.ownerKey, input.workspaceId);
  const ids = new Set<string>(), refs = new Set<string>(), recordRefs = new Set<string>();
  for (const raw of input.commits) {
    const read = readHopV55SemanticAdoptionCommitV1(raw);
    if (read.status === 'unsupportedReadOnly') {
      const opaque = read.raw;
      if (isRow(opaque) && ((opaque.ownerKey !== undefined && opaque.ownerKey !== input.ownerKey)
        || (opaque.workspaceId !== undefined && opaque.workspaceId !== input.workspaceId))) throw new Error('Commit futur hors owner/workspace.');
      if (isRow(opaque)) {
        const id = isText(opaque.id) ? opaque.id : isText(opaque.commandId) ? opaque.commandId : undefined;
        const reference = isText(opaque.reference) ? opaque.reference : undefined;
        const recordReference = isText(opaque.recordReference) ? opaque.recordReference : undefined;
        if (id && ids.has(id) || reference && refs.has(reference) || recordReference && recordRefs.has(recordReference)) {
          throw new Error('Identité ou référence de commit V6 connue dupliquée par une ligne future.');
        }
        if (id) ids.add(id);
        if (reference) refs.add(reference);
        if (recordReference) recordRefs.add(recordReference);
      }
      continue;
    }
    if (read.status !== 'readOnly') throw new Error(read.reason);
    const commit = read.commit;
    const record = answers.get(commit.recordReference);
    if (!record || record.id !== commit.receipt.record.id || record.ledger.reference !== commit.receipt.record.ledgerReference
      || record.transition.actId !== commit.plan.commandId || record.sourceReadingReference !== commit.plan.sourceReadingReference
      || record.transition.reason !== commit.plan.reason || record.transition.actor.origin !== 'user'
      || record.transition.actor.label !== commit.plan.principal.label || record.transition.recordedAt !== commit.receipt.effectiveAt
      || record.outcome.kind !== 'domainAnswer') {
      throw new Error('Commit V6 orphelin ou non lié au record/ledger V4 exact.');
    }
    const expected = commit.plan.expectedHead;
    if (expected.kind === 'none' && (record.transition.kind !== 'create' || record.transition.parentRecordReference !== undefined)
      || expected.kind === 'recordV3' && (record.transition.kind !== 'upgradeV3' || record.transition.parentRecordReference !== expected.reference
        || record.transition.parentReadingReference !== commit.plan.sourceReadingReference)
      || expected.kind === 'recordV4' && (record.transition.kind !== 'revise' || record.transition.parentRecordReference !== expected.reference
        || record.transition.parentReadingReference !== commit.plan.sourceReadingReference)) {
      throw new Error('Le record V4 ne prolonge pas le head documentaire exact scellé dans le plan.');
    }
    if (expected.kind === 'recordV4') {
      const parent = answers.get(expected.reference);
      if (!parent || parent.ledger.reference !== expected.ledgerReference
        || parent.sourceReadingReference !== commit.plan.sourceReadingReference) {
        throw new Error('Le ledger du parent V4 ne correspond pas au head scellé dans le plan V6.');
      }
    }
    if (expected.kind === 'recordV3') {
      const parentRead = input.documentaryAnswers.flatMap(raw => {
        try {
          const value = readHopV55DocumentaryAnswerRecord(raw);
          return value.status === 'readOnly' && value.version === 'v3' && value.record.reference === expected.reference
            ? [value.record] : [];
        } catch { return []; }
      })[0];
      if (!parentRead || parentRead.ownerKey !== input.ownerKey || parentRead.workspaceId !== input.workspaceId
        || parentRead.sourceReadingReference !== commit.plan.sourceReadingReference) {
        throw new Error('Le parent V3 du plan V6 est absent ou hors lecture source.');
      }
    }
    if (input.closures) assertCommitClosureLinks(commit, input.closures);
    if (ids.has(commit.id) || refs.has(commit.reference) || recordRefs.has(commit.recordReference)) throw new Error('Commit V6 dupliqué.');
    ids.add(commit.id); refs.add(commit.reference); recordRefs.add(commit.recordReference);
  }
}

export function assertHopV55SemanticAdoptionCommitAppendOnlyV1(input: {
  previous: unknown; next: unknown; previousAnswers: readonly unknown[]; nextAnswers: readonly unknown[];
  ownerKey: string; workspaceId: string;
  /** Closure rows of the previous snapshot: a new commit may only cite a ticket and record persisted before its CAS. */
  previousClosures?: HopV55SemanticAdoptionClosureRowsV1;
  closures?: HopV55SemanticAdoptionClosureRowsV1;
}): void {
  const previous = input.previous ?? [];
  const next = input.next ?? [];
  if (!Array.isArray(previous) || !Array.isArray(next) || next.length < previous.length
    || previous.some((row, index) => !same(row, next[index]))) throw new Error('Les commits V6 sont immuables et append-only.');
  const oldAnswerRefs = new Set(input.previousAnswers.flatMap(row => isRow(row) && isText(row.reference) ? [row.reference] : []));
  const newAnswerRefs = new Set(input.nextAnswers.flatMap(row => isRow(row) && isText(row.reference) ? [row.reference] : []));
  const oldIds = new Set<string>();
  for (const raw of previous) {
    const read = readHopV55SemanticAdoptionCommitV1(raw);
    if (read.status === 'readOnly') oldIds.add(read.commit.id);
    else if (read.status === 'unsupportedReadOnly' && isRow(read.raw)) {
      if (isText(read.raw.id)) oldIds.add(read.raw.id);
      else if (isText(read.raw.commandId)) oldIds.add(read.raw.commandId);
    }
  }
  for (const raw of next.slice(previous.length)) {
    const read = readHopV55SemanticAdoptionCommitV1(raw);
    if (read.status !== 'readOnly') throw new Error('Un nouveau commit V6 doit être connu et scellé.');
    if (oldIds.has(read.commit.id) || oldAnswerRefs.has(read.commit.recordReference)
      || !newAnswerRefs.has(read.commit.recordReference)) throw new Error('Un commit V6 doit ajouter une commande et son record V4 dans le même CAS.');
    if (input.previousClosures) assertCommitClosureLinks(read.commit, input.previousClosures);
    oldIds.add(read.commit.id);
  }
  assertHopV55SemanticAdoptionCommitHistoryV1({ commits: next, documentaryAnswers: input.nextAnswers,
    ownerKey: input.ownerKey, workspaceId: input.workspaceId, ...(input.closures ? { closures: input.closures } : {}) });
}

function closureRows(workspace: AdoptionWorkspace): HopV55SemanticAdoptionClosureRowsV1 {
  return { tickets: workspace.assistedSemanticAdviceTickets ?? [], records: workspace.assistedSemanticAdviceRecords ?? [] };
}

export interface HopV55SemanticAdoptionPreviewInputV1 extends HopV55SemanticAdoptionPreviewCommandV1 {}

function workspaceWithCommits(value: HopV55Workspace): AdoptionWorkspace { return value as AdoptionWorkspace; }

function findHead(workspace: HopV55Workspace, sourceReadingReference: string):
  | { status: 'ready'; head: { kind: 'none' } | { kind: 'recordV3' | 'recordV4'; record: unknown } }
  | { status: 'unsupported' | 'invalid'; reason: string } {
  let latest: { version: 'v1' | 'v2' | 'v3' | 'v4' | 'v4Wizard'; record: unknown } | undefined;
  for (const raw of workspace.documentaryAnswers ?? []) {
    if (isRow(raw) && isRow(raw.preparation) && isRow(raw.preparation.source)
      && raw.preparation.source.kind === 'wizardDraft') {
      const wizard = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(raw);
      if (wizard.status === 'unsupportedReadOnly') {
        if (isRow(wizard.snapshot) && wizard.snapshot.sourceReadingReference === sourceReadingReference) {
          return { status: 'unsupported', reason: wizard.reason };
        }
        continue;
      }
      if (wizard.record.sourceReadingReference === sourceReadingReference) latest = { version: 'v4Wizard', record: wizard.record };
      continue;
    }
    try {
      const read = readHopV55DocumentaryAnswerRecord(raw);
      if (read.status === 'unsupportedReadOnly') {
        if (isRow(read.snapshot) && read.snapshot.sourceReadingReference === sourceReadingReference) {
          return { status: 'unsupported', reason: read.reason };
        }
        continue;
      }
      if (read.record.sourceReadingReference === sourceReadingReference) latest = { version: read.version, record: read.record };
    } catch (error) {
      if (isRow(raw) && raw.sourceReadingReference === sourceReadingReference) {
        return { status: 'invalid', reason: error instanceof Error ? error.message : 'Head documentaire illisible.' };
      }
    }
  }
  if (!latest) return { status: 'ready', head: { kind: 'none' } };
  if (latest.version !== 'v3' && latest.version !== 'v4' && latest.version !== 'v4Wizard') {
    return { status: 'unsupported', reason: `La tête ${latest.version.toUpperCase()} doit suivre sa migration explicite avant adoption V6.` };
  }
  return { status: 'ready', head: { kind: latest.version === 'v3' ? 'recordV3' : 'recordV4', record: latest.record } };
}

/** Projects a re-read head onto the sealed plan shape; a raw record is never compared to its references. */
function expectedHeadFromRead(head: { kind: 'none' } | { kind: 'recordV3' | 'recordV4'; record: unknown }): unknown {
  if (head.kind === 'none') return { kind: 'none' };
  const record = (head as { record?: unknown }).record;
  if (!isRow(record) || !isText(record.reference)) return null;
  if (head.kind === 'recordV3') return { kind: 'recordV3', reference: record.reference };
  return isRow(record.ledger) && isText(record.ledger.reference)
    ? { kind: 'recordV4', reference: record.reference, ledgerReference: record.ledger.reference } : null;
}

function archiveIsPersisted(workspace: HopV55Workspace, closure: HopV55SemanticAdoptionTurnClosureV1): boolean {
  return (workspace.decisionReadings ?? []).some(raw => isRow(raw)
    && raw.contentReference === closure.sourceArchive.contentReference
    && same(raw, closure.sourceArchive));
}

function archiveWizardIsPersisted(workspace: HopV55Workspace, closure: HopV55SemanticAdoptionTurnClosureForWizardV1): boolean {
  return (workspace.decisionReadings ?? []).some(raw => isRow(raw)
    && raw.contentReference === closure.sourceArchive.contentReference && same(raw, closure.sourceArchive));
}

function matchWizardTurnClosure(input: { closure: HopV55SemanticAdoptionTurnClosureForWizardV1; ownerKey: string;
  workspaceId: string; ticketId: string; operationId: string }): string | null {
  const { ticket, request, sourceArchive } = input.closure;
  if (ticket.profile !== 'wizardV1' || ticket.ticketId !== input.ticketId || ticket.operationId !== input.operationId
    || ticket.ownerKey !== input.ownerKey || ticket.workspaceId !== input.workspaceId
    || !isText(input.closure.sourceTicketReference) || !isText(input.closure.sourceRecordReference) || !isText(input.closure.wireReference)
    || request.sourceReadingReference !== sourceArchive.contentReference
    || brewerHopAdviceRequestV3ReferenceForWizardV1(request) !== ticket.requestReference) {
    return 'La closure Wizard durable ne désigne pas le ticket, le wire, l’archive et la Request3 exacts.';
  }
  return null;
}

/** Authentication identity is separate from the display-only label. */
function samePrincipalAuthority(left: HopV55SemanticAdoptionPrincipalV1, right: HopV55SemanticAdoptionPrincipalV1): boolean {
  return left.principalId === right.principalId && left.ownerKey === right.ownerKey
    && left.workspaceId === right.workspaceId && same(left.scope, right.scope);
}

function principalMatchesPlan(principal: HopV55SemanticAdoptionPrincipalV1, plan: HopV55SemanticAdoptionPlanV1): boolean {
  return samePrincipalAuthority(principal, plan.principal);
}

function matchTurnClosure(input: { closure: HopV55SemanticAdoptionTurnClosureV1; ownerKey: string; workspaceId: string;
  ticketId: string; operationId: string }): string | null {
  const { ticket, request, sourceArchive } = input.closure;
  if (ticket.ticketId !== input.ticketId || ticket.operationId !== input.operationId
    || ticket.ownerKey !== input.ownerKey || ticket.workspaceId !== input.workspaceId
    || !isText(input.closure.sourceTicketReference) || !isText(input.closure.sourceRecordReference) || !isText(input.closure.wireReference)
    || request.sourceReadingReference !== sourceArchive.contentReference
    || ticket.requestReference !== brewerHopAdviceRequestV3Reference(request)) {
    return 'La façade durable n’a pas rendu le ticket, la RequestV3 et l’archive4 exacts demandés.';
  }
  return null;
}

function resultToController(value: PrepareHopV55SemanticAdoptionPlanV1Result,
  historical?: HopV55SemanticAdoptionTurnClosureV1 | HopV55SemanticAdoptionTurnClosureForWizardV1): HopV55SemanticAdoptionControllerPreviewV1 {
  if (value.status === 'ready') return { status: 'ready', plan: value.plan, preview: value.preview };
  return { status: value.status, reason: value.reason, ...(historical ? { historical: clone(historical) } : {}) };
}

/**
 * Local Application controller. The repository's one `save` is the only write: it appends a V4 row
 * to documentaryAnswers and the sealed replay commit in the same workspace revision/CAS.
 */
export function createHopV55SemanticAdoptionController(host: HopV55SemanticAdoptionControllerHostV1) {
  const turns = host.turns ?? createHopV55SemanticAdoptionTurnSourceV1({ workspaces: host.workspaces });

  async function readWorkspace(ownerKey: string, workspaceId: string): Promise<HopV55Workspace> {
    const workspace = await host.workspaces.read(ownerKey, workspaceId);
    if (!workspace) throw new Error('Workspace introuvable.');
    if (workspace.ownerKey !== ownerKey || workspace.id !== workspaceId) throw new Error('Workspace hors owner/workspace demandé.');
    return workspace;
  }

  async function closureFor(input: { ownerKey: string; workspaceId: string; ticketId: string; operationId: string }):
    Promise<HopV55SemanticAdoptionTurnReadV1> {
    return turns.read({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, ticketId: input.ticketId, operationId: input.operationId });
  }

  async function previewWizard(input: HopV55SemanticAdoptionPreviewInputV1): Promise<HopV55SemanticAdoptionControllerPreviewV1> {
    try {
      if (!turns.readWizard || !host.readCurrentWizard || !host.readCultureBindingForWizard) {
        return { status: 'unsupported', reason: 'Cette Application n’expose pas la capacité durable Wizard V1 complète.' };
      }
      const workspace = await readWorkspace(input.ownerKey, input.workspaceId);
      const turn = await turns.readWizard({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: input.ticketId, operationId: input.operationId });
      if (turn.status !== 'available') return { status: turn.status === 'absent' ? 'notFound'
        : turn.status === 'unsupportedReadOnly' ? 'unsupported' : 'invalid', reason: turn.reason };
      const closure = turn.closure;
      const mismatch = matchWizardTurnClosure({ closure, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: input.ticketId, operationId: input.operationId });
      if (mismatch) return { status: 'invalid', reason: mismatch, historical: clone(closure) };
      if (!archiveWizardIsPersisted(workspace, closure)) return { status: 'invalid',
        reason: 'L’archive Wizard exacte du ticket n’est plus persistée.', historical: clone(closure) };
      if (!isRow(closure.candidatePolicy)) return { status: 'unsupported',
        reason: 'La politique de candidats n’est pas scellée dans le ticket Wizard.', historical: clone(closure) };
      const principalBefore = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        scope: closure.ticket.scope });
      const current = await host.readCurrentWizard({ workspace, sourceArchive: closure.sourceArchive, scope: closure.ticket.scope });
      const cultureBinding = await host.readCultureBindingForWizard({ workspace, current });
      const principalAfter = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        scope: closure.ticket.scope });
      if (!samePrincipalAuthority(principalBefore, principalAfter)) return { status: 'stale',
        reason: 'Le principal, owner, workspace ou scope a changé pendant le contexte Wizard frais.' };
      const head = findHead(workspace, closure.sourceArchive.contentReference);
      if (head.status !== 'ready') return { status: head.status, reason: head.reason, historical: clone(closure) };
      return resultToController(prepareHopV55SemanticAdoptionPlanV1({ envelope: closure.envelope,
        request: closure.request, sourceArchive: closure.sourceArchive, turnEvidence: closure.turnEvidence,
        current, principal: principalAfter, ticket: closure.ticket, selection: input.selection, head: head.head,
        commandId: input.commandId, recordId: input.recordId, requestId: input.requestId, reason: input.reason,
        candidatePolicy: closure.candidatePolicy, cultureBinding, previewedAt: host.now() }), closure);
    } catch (error) {
      return { status: 'invalid', reason: error instanceof Error ? error.message : 'Preview Wizard V6 impossible.' };
    }
  }

  async function preview(input: HopV55SemanticAdoptionPreviewInputV1): Promise<HopV55SemanticAdoptionControllerPreviewV1> {
    if (input.profile === 'wizardV1') return previewWizard(input);
    try {
      const workspace = await readWorkspace(input.ownerKey, input.workspaceId);
      const turn = await closureFor(input);
      if (turn.status !== 'available') return { status: turn.status === 'absent' ? 'notFound'
        : turn.status === 'unsupportedReadOnly' ? 'unsupported' : 'invalid', reason: turn.reason };
      const closure = turn.closure;
      const mismatch = matchTurnClosure({ closure, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: input.ticketId, operationId: input.operationId });
      if (mismatch) return { status: 'invalid', reason: mismatch, historical: clone(closure) };
      if (!archiveIsPersisted(workspace, closure)) return { status: 'invalid', reason: 'L’archive source4 du ticket n’est pas persistée exactement dans ce workspace.', historical: clone(closure) };
      if (!isRow(closure.candidatePolicy)) {
        return { status: 'unsupported', reason: 'Le ticket durable ne porte pas de politique de candidats locale; il reste lisible, jamais adopté.', historical: clone(closure) };
      }
      const principalBefore = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: closure.ticket.scope });
      const current = await host.readCurrent({ workspace, sourceArchive: closure.sourceArchive, scope: closure.ticket.scope });
      const cultureBinding = await host.readCultureBinding({ workspace, current });
      const principal = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: closure.ticket.scope });
      if (!samePrincipalAuthority(principalBefore, principal)) {
        return { status: 'stale', reason: 'Le principal, l’owner, le workspace ou le scope a changé pendant la relecture fraîche.' };
      }
      const head = findHead(workspace, closure.sourceArchive.contentReference);
      if (head.status !== 'ready') return { status: head.status, reason: head.reason, historical: clone(closure) };
      return resultToController(prepareHopV55SemanticAdoptionPlanV1({
        envelope: closure.envelope, request: closure.request, sourceArchive: closure.sourceArchive,
        turnEvidence: closure.turnEvidence, current, principal, ticket: closure.ticket, selection: input.selection,
        head: head.head, commandId: input.commandId, recordId: input.recordId, requestId: input.requestId,
        reason: input.reason, candidatePolicy: closure.candidatePolicy, cultureBinding, previewedAt: host.now(),
      }), closure);
    } catch (error) {
      return { status: 'invalid', reason: error instanceof Error ? error.message : 'Preview d’adoption V6 impossible.' };
    }
  }

  async function readHistory(input: { ownerKey: string; workspaceId: string; commandId: string }): Promise<HopV55SemanticAdoptionHistoryReadV1> {
    try {
      const workspace = workspaceWithCommits(await readWorkspace(input.ownerKey, input.workspaceId));
      const raw = workspace.semanticAdoptionCommits?.find(row => isRow(row) && row.id === input.commandId);
      if (raw === undefined) return { status: 'absent', reason: 'Aucun commit V6 sous cette commande.' };
      const read = readHopV55SemanticAdoptionCommitV1(raw);
      if (read.status !== 'readOnly') return { status: read.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'invalid',
        reason: read.status === 'invalid' ? read.reason : read.reason, raw: read.status === 'unsupportedReadOnly' ? read.raw : raw };
      if (read.commit.plan.profile === 'wizardV1') {
        const rawAnswer = workspace.documentaryAnswers?.find(row => isRow(row) && row.reference === read.commit.recordReference);
        if (!rawAnswer) return { status: 'invalid', reason: 'Le commit Wizard ne retrouve pas son answer V4 exact.' };
        const wizardAnswer = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(rawAnswer);
        if (wizardAnswer.status !== 'readOnly') return { status: 'unsupportedReadOnly', reason: wizardAnswer.reason,
          raw: wizardAnswer.status === 'unsupportedReadOnly' ? wizardAnswer.snapshot : rawAnswer };
        assertHopV55SemanticAdoptionCommitHistoryV1({ commits: workspace.semanticAdoptionCommits,
          documentaryAnswers: workspace.documentaryAnswers, ownerKey: workspace.ownerKey, workspaceId: workspace.id,
          closures: closureRows(workspace) });
        return { status: 'readOnly', commit: read.commit, record: wizardAnswer.record, revision: workspace.revision };
      }
      const answer = (workspace.documentaryAnswers ?? []).map(row => readHopV55DocumentaryAnswerRecord(row))
        .find(row => row.status === 'readOnly' && row.version === 'v4' && row.record.reference === read.commit.recordReference);
      if (!answer || answer.status !== 'readOnly' || answer.version !== 'v4') return { status: 'invalid', reason: 'Le commit d’historique ne retrouve pas son answer record V4 exact.' };
      assertHopV55SemanticAdoptionCommitHistoryV1({ commits: workspace.semanticAdoptionCommits,
        documentaryAnswers: workspace.documentaryAnswers, ownerKey: workspace.ownerKey, workspaceId: workspace.id,
        closures: closureRows(workspace) });
      return { status: 'readOnly', commit: read.commit, record: answer.record as HopV55PropertyAdviceAnswerRecordV4,
        revision: workspace.revision };
    } catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Lecture historique V6 impossible.' }; }
  }

  async function confirmWizardPlan(input: { ownerKey: string; workspaceId: string; plan: HopV55SemanticAdoptionPlanV1 }):
    Promise<HopV55SemanticAdoptionControllerConfirmV1> {
    const plan = input.plan;
    try {
      if (plan.profile !== 'wizardV1' || !turns.readWizard || !host.readCurrentWizard || !host.readCultureBindingForWizard) {
        return { status: 'unsupported', reason: 'Le plan Wizard n’a pas de capacité Application Wizard complète.' };
      }
      const workspace = await readWorkspace(input.ownerKey, input.workspaceId);
      const extended = workspaceWithCommits(workspace);
      const principalForPlan = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: plan.principal.scope });
      if (!principalMatchesPlan(principalForPlan, plan)) return { status: 'invalid',
        reason: 'Principal authentifié, owner, workspace ou scope différent du plan Wizard.' };
      const existingRaw = extended.semanticAdoptionCommits?.find(row => isRow(row) && row.id === plan.commandId);
      if (existingRaw !== undefined) {
        const read = readHopV55SemanticAdoptionCommitV1(existingRaw);
        if (read.status !== 'readOnly') return { status: read.status === 'invalid' ? 'invalid' : 'unsupported', reason: read.reason };
        if (read.commit.plan.profile !== 'wizardV1' || hopV55SemanticAdoptionFingerprintV1(plan) !== read.commit.receipt.fingerprint) {
          return { status: 'conflict', reason: 'Cette commandId est déjà liée à un autre profil ou fingerprint.' };
        }
        const replay = resolveHopV55SemanticAdoptionReplayV1({ existingReceipt: read.commit.receipt,
          commandId: plan.commandId, fingerprint: read.commit.receipt.fingerprint });
        if (replay.status !== 'replay') return { status: replay.status === 'conflict' ? 'conflict' : 'invalid',
          reason: replay.status === 'new' ? 'Commit Wizard existant sans reçu rejouable.' : replay.reason };
        const historical = await readHistory({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, commandId: plan.commandId });
        if (historical.status !== 'readOnly' || historical.commit.reference !== read.commit.reference) {
          return { status: historical.status === 'unsupportedReadOnly' ? 'unsupported' : 'invalid',
            reason: historical.status === 'readOnly' ? 'Le commit Wizard relu diffère de la ligne trouvée.' : historical.reason };
        }
        return { status: 'replay', receipt: historical.commit.receipt, recipeEffect: 'none', workspaceRevision: historical.revision };
      }
      const turnRead = await turns.readWizard({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: plan.ticket.ticketId, operationId: plan.ticket.operationId });
      if (turnRead.status !== 'available') return { status: turnRead.status === 'absent' ? 'notFound'
        : turnRead.status === 'unsupportedReadOnly' ? 'unsupported' : 'invalid', reason: turnRead.reason };
      const closure = turnRead.closure;
      const mismatch = matchWizardTurnClosure({ closure, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: plan.ticket.ticketId, operationId: plan.ticket.operationId });
      if (mismatch) return { status: 'invalid', reason: mismatch };
      if (!archiveWizardIsPersisted(workspace, closure)) return { status: 'invalid', reason: 'L’archive Wizard exacte du ticket n’est plus persistée.' };
      if (!same(closure.candidatePolicy, plan.candidatePolicy)) return { status: 'stale',
        reason: 'La politique candidate scellée dans le ticket Wizard diffère du plan.' };
      const current = await host.readCurrentWizard({ workspace, sourceArchive: closure.sourceArchive, scope: closure.ticket.scope });
      const cultureBinding = await host.readCultureBindingForWizard({ workspace, current });
      const principal = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: closure.ticket.scope });
      if (!samePrincipalAuthority(principalForPlan, principal) || !principalMatchesPlan(principal, plan)) return { status: 'stale',
        reason: 'Le principal, owner, workspace ou scope a changé pendant la relecture fraîche Wizard.' };
      const head = findHead(workspace, closure.sourceArchive.contentReference);
      if (head.status !== 'ready') return { status: head.status, reason: head.reason };
      const result = confirmHopV55SemanticAdoptionV1({ plan, envelope: closure.envelope, request: closure.request,
        sourceArchive: closure.sourceArchive, turnEvidence: closure.turnEvidence, current, principal,
        ticket: closure.ticket, head: head.head, cultureBinding, effectiveAt: host.now() });
      if (result.status === 'replay') return { status: 'replay', receipt: result.receipt, recipeEffect: 'none', workspaceRevision: workspace.revision };
      if (result.status !== 'ready') return { status: result.status, reason: result.reason };
      const commit = createHopV55SemanticAdoptionCommitV1({ plan, record: result.record, receipt: result.receipt,
        sourceTicketReference: closure.sourceTicketReference, sourceRecordReference: closure.sourceRecordReference,
        wireReference: closure.wireReference });
      const finalWorkspace = await readWorkspace(input.ownerKey, input.workspaceId);
      if (finalWorkspace.revision !== workspace.revision) return { status: 'stale',
        reason: 'Le workspace/head a changé pendant la confirmation Wizard; aucun rebasage CAS.' };
      const finalTurnRead = await turns.readWizard({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: plan.ticket.ticketId, operationId: plan.ticket.operationId });
      if (finalTurnRead.status !== 'available') return { status: finalTurnRead.status === 'absent' ? 'notFound'
        : finalTurnRead.status === 'unsupportedReadOnly' ? 'unsupported' : 'invalid', reason: finalTurnRead.reason };
      const finalClosure = finalTurnRead.closure;
      if (matchWizardTurnClosure({ closure: finalClosure, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: plan.ticket.ticketId, operationId: plan.ticket.operationId })
        || finalClosure.sourceTicketReference !== closure.sourceTicketReference
        || finalClosure.sourceRecordReference !== closure.sourceRecordReference
        || finalClosure.wireReference !== closure.wireReference
        || !same(finalClosure.request, closure.request) || !same(finalClosure.envelope, closure.envelope)
        || !same(finalClosure.candidatePolicy, closure.candidatePolicy)
        || !archiveWizardIsPersisted(finalWorkspace, finalClosure)) {
        return { status: 'stale', reason: 'La fermeture Wizard ou ses références ont changé avant le CAS.' };
      }
      const finalCurrent = await host.readCurrentWizard({ workspace: finalWorkspace,
        sourceArchive: finalClosure.sourceArchive, scope: finalClosure.ticket.scope });
      const finalLaunch = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1(finalCurrent);
      if (finalLaunch.status !== 'ready' || !same(finalLaunch.request, finalClosure.request)
        || !same(finalLaunch.prepared, current.livePrepared)) {
        return { status: 'stale', reason: finalLaunch.status === 'ready'
          ? 'Le Prepared Wizard a changé avant le CAS.' : finalLaunch.reason };
      }
      const finalCultureBinding = await host.readCultureBindingForWizard({ workspace: finalWorkspace, current: finalCurrent });
      if (!same(finalCultureBinding, cultureBinding)) return { status: 'stale', reason: 'Le binding NR a changé avant le CAS Wizard.' };
      const finalHead = findHead(finalWorkspace, finalClosure.sourceArchive.contentReference);
      if (finalHead.status !== 'ready' || !same(expectedHeadFromRead(finalHead.head), plan.expectedHead)) return { status: 'stale',
        reason: finalHead.status === 'ready' ? 'La tête documentaire a changé avant le CAS.' : finalHead.reason };
      const finalPrincipal = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        scope: finalClosure.ticket.scope });
      if (!samePrincipalAuthority(principal, finalPrincipal) || !principalMatchesPlan(finalPrincipal, plan)) return { status: 'stale',
        reason: 'Le principal a changé avant le CAS Wizard.' };
      const principalBeforeCas = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        scope: finalClosure.ticket.scope });
      if (!samePrincipalAuthority(finalPrincipal, principalBeforeCas) || !principalMatchesPlan(principalBeforeCas, plan)) {
        return { status: 'stale', reason: 'L’autorité a changé avant le CAS Wizard; aucun answer ni reçu n’est écrit.' };
      }
      const finalExtended = workspaceWithCommits(finalWorkspace);
      const previousCommits = finalExtended.semanticAdoptionCommits ?? [];
      const next: HopV55Workspace = { ...finalWorkspace,
        updatedAt: Date.parse(finalWorkspace.updatedAt) > Date.parse(result.receipt.effectiveAt) ? finalWorkspace.updatedAt : result.receipt.effectiveAt,
        documentaryAnswers: [...(finalWorkspace.documentaryAnswers ?? []), result.record],
        ...({ semanticAdoptionCommits: [...previousCommits, commit] } as Partial<AdoptionWorkspace>),
      };
      try {
        const saved = await host.workspaces.save(next, finalWorkspace.revision);
        const savedWorkspace = workspaceWithCommits(saved);
        const durable = await readHistory({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, commandId: plan.commandId });
        if (durable.status !== 'readOnly' || durable.commit.reference !== commit.reference
          || durable.record.reference !== result.record.reference) return { status: 'invalid',
            reason: 'Le CAS Wizard n’a pas rendu le commit et l’answer exacts; ne pas publier le succès.' };
        return { status: 'committed', record: result.record, receipt: result.receipt, recipeEffect: 'none',
          workspaceRevision: savedWorkspace.revision };
      } catch (error) {
        const reread = await readHistory({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, commandId: plan.commandId });
        if (reread.status === 'readOnly') {
          if (reread.commit.receipt.fingerprint === result.receipt.fingerprint) return { status: 'replay',
            receipt: reread.commit.receipt, recipeEffect: 'none', workspaceRevision: reread.revision };
          return { status: 'conflict', reason: 'Une autre confirmation a lié cette commandId à un autre contenu.' };
        }
        const code = isRow(error) ? (error as { code?: unknown }).code : undefined;
        return { status: code === 'staleRevision' ? 'stale' : 'invalid',
          reason: error instanceof Error ? error.message : 'CAS d’adoption Wizard impossible.' };
      }
    } catch (error) {
      return { status: 'invalid', reason: error instanceof Error ? error.message : 'Confirmation Wizard impossible.' };
    }
  }

  async function confirm(input: { ownerKey: string; workspaceId: string; plan: unknown }): Promise<HopV55SemanticAdoptionControllerConfirmV1> {
    let plan: HopV55SemanticAdoptionPlanV1;
    try { plan = readHopV55SemanticAdoptionPlanV1(input.plan); }
    catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Plan V6 illisible.' }; }
    if (plan.profile === 'wizardV1') return confirmWizardPlan({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, plan });
    if (plan.principal.ownerKey !== input.ownerKey || plan.principal.workspaceId !== input.workspaceId) {
      return { status: 'invalid', reason: 'Plan V6 hors owner/workspace courant.' };
    }
    try {
      const workspace = await readWorkspace(input.ownerKey, input.workspaceId);
      const extended = workspaceWithCommits(workspace);
      const principalForPlan = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: plan.principal.scope });
        if (!principalMatchesPlan(principalForPlan, plan)) {
          return { status: 'invalid', reason: 'Principal authentifié, owner, workspace ou scope différent du plan V6.' };
        }
      const existingRaw = extended.semanticAdoptionCommits?.find(row => isRow(row) && row.id === plan.commandId);
      if (existingRaw !== undefined) {
        const read = readHopV55SemanticAdoptionCommitV1(existingRaw);
        if (read.status !== 'readOnly') return { status: read.status === 'invalid' ? 'invalid' : 'unsupported', reason: read.reason };
        if (hopV55SemanticAdoptionFingerprintV1(plan) !== read.commit.receipt.fingerprint) {
          return { status: 'conflict', reason: 'Cette commandId V6 est déjà liée à un autre fingerprint.' };
        }
        const replay = resolveHopV55SemanticAdoptionReplayV1({ existingReceipt: read.commit.receipt,
          commandId: plan.commandId, fingerprint: read.commit.receipt.fingerprint });
        if (replay.status !== 'replay') return { status: replay.status === 'conflict' ? 'conflict' : 'invalid',
          reason: replay.status === 'new' ? 'Commit V6 existant sans reçu rejouable.' : replay.reason };
        const historical = await readHistory({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, commandId: plan.commandId });
        if (historical.status !== 'readOnly' || historical.commit.reference !== read.commit.reference) {
          return { status: historical.status === 'unsupportedReadOnly' ? 'unsupported' : 'invalid',
            reason: historical.status === 'readOnly' ? 'Le commit relu diffère de la ligne trouvée.' : historical.reason };
        }
        return { status: 'replay', receipt: historical.commit.receipt, recipeEffect: 'none', workspaceRevision: historical.revision };
      }
      const closureRead = await closureFor({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: plan.ticket.ticketId, operationId: plan.ticket.operationId });
      if (closureRead.status !== 'available') {
        return { status: closureRead.status === 'absent' ? 'notFound'
          : closureRead.status === 'unsupportedReadOnly' ? 'unsupported' : 'invalid', reason: closureRead.reason };
      }
      const closure = closureRead.closure;
      const turnMismatch = matchTurnClosure({ closure, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
        ticketId: plan.ticket.ticketId, operationId: plan.ticket.operationId });
      if (turnMismatch) return { status: 'invalid', reason: turnMismatch };
      if (!archiveIsPersisted(workspace, closure)) return { status: 'invalid', reason: 'L’archive4 exacte de la closure V6 n’est plus présente.' };
      // The policy is the one sealed in the durable ticket before submit; a plan never supplies or replaces it.
      if (!isRow(closure.candidatePolicy)) {
        return { status: 'unsupported', reason: 'Le ticket durable ne porte pas de politique de candidats locale; aucune adoption.' };
      }
      if (!same(closure.candidatePolicy, plan.candidatePolicy)) {
        return { status: 'stale', reason: 'La politique de candidats scellée dans le ticket diffère de celle du plan; aucune adoption.' };
      }
      const current = await host.readCurrent({ workspace, sourceArchive: closure.sourceArchive, scope: closure.ticket.scope });
      const cultureBinding = await host.readCultureBinding({ workspace, current });
      const principal = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: closure.ticket.scope });
      if (!samePrincipalAuthority(principalForPlan, principal) || !principalMatchesPlan(principal, plan)) {
        return { status: 'stale', reason: 'Le principal, l’owner, le workspace ou le scope a changé pendant la relecture fraîche.' };
      }
      const head = findHead(workspace, closure.sourceArchive.contentReference);
      if (head.status !== 'ready') return { status: head.status, reason: head.reason };
      // Only a new confirmation reaches the pure confirmer; a durable replay returned above from the original commit.
      const result = confirmHopV55SemanticAdoptionV1({
        plan,
        envelope: closure.envelope, request: closure.request, sourceArchive: closure.sourceArchive,
        turnEvidence: closure.turnEvidence, current, principal, ticket: closure.ticket,
        head: head.head, cultureBinding, effectiveAt: host.now(),
      });
      if (result.status === 'replay') return { status: 'replay', receipt: result.receipt, recipeEffect: 'none', workspaceRevision: workspace.revision };
      if (result.status !== 'ready') return { status: result.status, reason: result.reason };
      const commit = createHopV55SemanticAdoptionCommitV1({ plan, record: result.record, receipt: result.receipt,
        sourceTicketReference: closure.sourceTicketReference, sourceRecordReference: closure.sourceRecordReference,
        wireReference: closure.wireReference });
      const principalBeforeCas = await host.readPrincipal({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: closure.ticket.scope });
      if (!samePrincipalAuthority(principal, principalBeforeCas) || !principalMatchesPlan(principalBeforeCas, plan)) {
        return { status: 'stale', reason: 'L’autorité du brasseur a changé avant le CAS; aucun record ni reçu n’est écrit.' };
      }
      const previousCommits = extended.semanticAdoptionCommits ?? [];
      const next: HopV55Workspace = {
        ...workspace,
        updatedAt: Date.parse(workspace.updatedAt) > Date.parse(result.receipt.effectiveAt) ? workspace.updatedAt : result.receipt.effectiveAt,
        documentaryAnswers: [...(workspace.documentaryAnswers ?? []), result.record],
        ...({ semanticAdoptionCommits: [...previousCommits, commit] } as Partial<AdoptionWorkspace>),
      };
      try {
        const saved = await host.workspaces.save(next, workspace.revision);
        const savedWorkspace = workspaceWithCommits(saved);
        const durable = await readHistory({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, commandId: plan.commandId });
        if (durable.status !== 'readOnly' || durable.commit.reference !== commit.reference
          || durable.record.reference !== result.record.reference) {
          return { status: 'invalid', reason: 'Le CAS a rendu un workspace sans le commit V6 exact; ne pas publier le succès.' };
        }
        return { status: 'committed', record: result.record, receipt: result.receipt, recipeEffect: 'none',
          workspaceRevision: savedWorkspace.revision };
      } catch (error) {
        const reread = await readHistory({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, commandId: plan.commandId });
        if (reread.status === 'readOnly') {
          if (reread.commit.receipt.fingerprint === result.receipt.fingerprint) {
            return { status: 'replay', receipt: reread.commit.receipt, recipeEffect: 'none', workspaceRevision: reread.revision };
          }
          return { status: 'conflict', reason: 'Une autre confirmation a lié cette commandId à un contenu différent.' };
        }
        // Only the repository's CAS code means "changed since read"; no autorebase, the brewer previews again.
        const code = isRow(error) ? (error as { code?: unknown }).code : undefined;
        return { status: code === 'staleRevision' ? 'stale' : 'invalid',
          reason: error instanceof Error ? error.message : 'CAS d’adoption V6 impossible.' };
      }
    } catch (error) {
      return { status: 'invalid', reason: error instanceof Error ? error.message : 'Confirmation V6 impossible.' };
    }
  }

  return { preview, confirm, readHistory };
}

/** Keeps the canonical pure result shape visible to consumers without widening the V6 builder. */
export type HopV55SemanticAdoptionPureConfirmResultV1 = ConfirmHopV55SemanticAdoptionV1Result;
