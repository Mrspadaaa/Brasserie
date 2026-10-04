/** Workspace CAS seam for the App-owned assisted ticket and Runtime receipt. */
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { readBrewingScenarioEvidence } from '../../domain/brewingScenarioArchive';
import { BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT, BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT } from '../../../functions/src/brewerHopAdviceContextBinding';
import { BREWER_HOP_ADVICE_PROPOSAL_FORMAT, BREWER_HOP_ADVICE_REQUEST_FORMAT,
  assertBrewerHopAdviceProposalEnvelope, verifyBrewerHopAdviceEvidence } from '../../../functions/src/brewerHopAdviceProposal';
import { readHopV55AssistedAdviceTicketV1,
  type HopV55AssistedAdviceTicketRead, type HopV55AssistedAdviceTicketV1 } from './assistedAdviceController';
import { HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT, createHopV55AssistedAdviceRecordV1,
  appendHopV55AssistedAdviceRecordV1, appendHopV55AssistedAdviceRecordToWorkspace,
  readHopV55AssistedAdviceArchiveV1, readHopV55AssistedAdviceRecordV1,
  readHopV55AssistedAdviceRecordByOperationId,
  type HopV55AssistedAdviceBackendContractV1, type HopV55AssistedAdviceRecordV1,
  type HopV55AssistedJobReferenceV1 } from './assistedAdviceArchive';
import type { BrewerTurn } from '../../../functions/src/companionTypes';
import { readHopV55DecisionReadingArchive } from './decisionArchive';
import { readHopV55DocumentaryAnswerRecord } from './documentaryRecords';
import type { HopV55PropertyAdviceAnswerRecordV4 } from './propertyAdviceRecordsV4';
import type { HopV55Workspace, HopV55WorkspaceRepository } from './contracts';
import type { HopV55AssistedAdviceReceptionPayloadV1 } from './assistedAdviceController';

export interface HopV55AssistedAdviceOpaqueWorkspaceRecord {
  format: string;
  readonly [key: string]: unknown;
}

export type HopV55AssistedAdviceTicketHistoryEntry = HopV55AssistedAdviceTicketV1 | HopV55AssistedAdviceOpaqueWorkspaceRecord;
export type HopV55AssistedAdviceRecordHistoryEntry = HopV55AssistedAdviceRecordV1 | HopV55AssistedAdviceOpaqueWorkspaceRecord;

export type HopV55AssistedAdviceWorkspaceErrorCode = 'invalidInput' | 'unsupportedFormat' | 'conflict' | 'notFound' | 'staleRevision';

export class HopV55AssistedAdviceWorkspaceError extends Error {
  constructor(readonly code: HopV55AssistedAdviceWorkspaceErrorCode, message: string) {
    super(message);
    this.name = 'HopV55AssistedAdviceWorkspaceError';
  }
}

type Row = Record<string, unknown>;
const isRecord = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const clone = <T>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown): boolean => {
  try { return hopAdviceContentReference('hop-v55-assisted-workspace-equality-v1', left)
    === hopAdviceContentReference('hop-v55-assisted-workspace-equality-v1', right); }
  catch { return false; }
};
function fail(message: string, code: HopV55AssistedAdviceWorkspaceErrorCode = 'invalidInput'): never {
  throw new HopV55AssistedAdviceWorkspaceError(code, message);
}

/** Default canonical contract; its validators/readers are pure and versioned by their source modules. */
export function createHopV55AssistedAdviceBackendContractV1(): HopV55AssistedAdviceBackendContractV1 {
  return {
    requestFormat: BREWER_HOP_ADVICE_REQUEST_FORMAT,
    contextLaunchFormat: BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT,
    contextProjectionFormat: BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT,
    proposalFormat: BREWER_HOP_ADVICE_PROPOSAL_FORMAT,
    readTicket: readHopV55AssistedAdviceTicketV1,
    assertProposalEnvelope: assertBrewerHopAdviceProposalEnvelope,
    verifyTurnEvidence: (envelope, evidence) => verifyBrewerHopAdviceEvidence(envelope, evidence,
      { readScenario: readBrewingScenarioEvidence }),
  };
}

function opaqueScope(value: unknown, workspace: HopV55Workspace, label: string): void {
  if (!isRecord(value)) fail(`${label} futur illisible.`, 'unsupportedFormat');
  if (value.ownerKey !== undefined && value.ownerKey !== workspace.ownerKey
    || value.workspaceId !== undefined && value.workspaceId !== workspace.id) {
    fail(`${label} futur appartient à un autre owner ou workspace.`);
  }
}

function readAppTicket(raw: unknown, contract: HopV55AssistedAdviceBackendContractV1): HopV55AssistedAdviceTicketRead {
  return contract.readTicket(raw);
}

function findSourceArchive(workspace: HopV55Workspace, sourceReadingReference: string) {
  for (const raw of workspace.decisionReadings ?? []) {
    const read = readHopV55DecisionReadingArchive(raw);
    if (read.status === 'unsupportedFormat') {
      if (isRecord(raw) && raw.contentReference === sourceReadingReference) {
        fail(`Archive source future conservée sans fallback : ${read.format}.`, 'unsupportedFormat');
      }
      continue;
    }
    if (read.status === 'invalidRecord') {
      if (isRecord(raw) && raw.contentReference === sourceReadingReference) fail(`Archive source invalide : ${read.reason}`);
      continue;
    }
    if (read.archive.contentReference === sourceReadingReference) return read.archive;
  }
  fail('L’archive de lecture exacte du ticket n’existe pas dans ce workspace.');
}

function documentaryAnswerReference(record: unknown, version: 'v1' | 'v2' | 'v3' | 'v4'): string | undefined {
  if (version === 'v4') {
    const v4 = record as HopV55PropertyAdviceAnswerRecordV4;
    return v4.outcome.kind === 'domainAnswer' ? v4.outcome.answerReference : undefined;
  }
  return isRecord(record) && typeof record.answerReference === 'string' ? record.answerReference : undefined;
}

function assertTicketBase(workspace: HopV55Workspace, ticket: HopV55AssistedAdviceTicketV1): void {
  const base = ticket.adviceBase;
  if (!base) return;
  const raw = (workspace.documentaryAnswers ?? []).find(row => isRecord(row) && row.reference === base.recordReference);
  if (!raw) fail('Le record de conseil parent du ticket n’est pas persisté dans ce workspace.');
  let read: ReturnType<typeof readHopV55DocumentaryAnswerRecord>;
  try { read = readHopV55DocumentaryAnswerRecord(raw); }
  catch (error) { fail(`Le record de conseil parent est invalide : ${error instanceof Error ? error.message : String(error)}`); }
  if (read.status === 'unsupportedReadOnly') fail(`Le record de conseil parent reste futur/opaque : ${read.reason}`, 'unsupportedFormat');
  const record = read.record;
  if (record.reference !== base.recordReference || record.ownerKey !== workspace.ownerKey || record.workspaceId !== workspace.id
    || record.sourceReadingReference !== ticket.sourceReadingReference) {
    fail('Le record parent du ticket pointe vers un autre owner, workspace ou source.');
  }
  const expectedVersion = base.format === 'hop-v55-documentary-answer-record-v3' ? 'v3'
    : base.format === 'hop-v55-documentary-answer-record-v4' ? 'v4' : undefined;
  if (!expectedVersion || read.version !== expectedVersion) fail('Format du record parent différent du ticket.');
  const answerReference = documentaryAnswerReference(record, read.version);
  if (base.answerReference !== undefined && answerReference !== base.answerReference) {
    fail('Référence de réponse parent différente du ticket.');
  }
  if (read.version === 'v4') {
    const ledgerReference = (record as HopV55PropertyAdviceAnswerRecordV4).ledger.reference;
    if (base.ledgerReference !== ledgerReference) fail('Ledger V4 parent différent du ticket.');
  } else if (base.ledgerReference !== undefined) fail('Un parent V3 ne porte pas de ledger V4.');
}

function assertTicketWorkspaceAdmission(workspace: HopV55Workspace, ticket: HopV55AssistedAdviceTicketV1): void {
  if (ticket.ownerKey !== workspace.ownerKey || ticket.workspaceId !== workspace.id
    || ticket.archiveReference !== ticket.sourceReadingReference
    || ticket.request.sourceReadingReference !== ticket.sourceReadingReference
    || ticket.request.contextLaunch.ownerKey !== workspace.ownerKey
    || ticket.request.contextLaunch.workspaceId !== workspace.id
    || ticket.request.contextLaunch.sourceReadingReference !== ticket.sourceReadingReference
    || ticket.request.contextLaunch.sourceRuntimeReference !== ticket.sourceRuntimeReference
    || !same(ticket.source, ticket.request.contextLaunch.source)
    || !same(ticket.scope, ticket.request.contextLaunch.scope)
    || !same(ticket.contextProjection, ticket.request.contextLaunch.expected)) {
    fail('Ticket d’un autre owner/workspace/source ou launch détaché.');
  }
  const archive = findSourceArchive(workspace, ticket.sourceReadingReference);
  if (archive.ownerKey !== workspace.ownerKey || archive.workspaceId !== workspace.id
    || archive.runtimeReference !== ticket.sourceRuntimeReference || !same(archive.source, ticket.source)
    || !same(archive, ticket.launchSnapshot.archive) || !same(archive.reading, ticket.launchSnapshot.reading)) {
    fail('Ticket ne conserve pas l’archive A exacte déjà persistée.');
  }
  const capturedWorkspace = ticket.launchSnapshot.workspace;
  if (capturedWorkspace.id !== workspace.id || capturedWorkspace.ownerKey !== workspace.ownerKey
    || !Array.isArray(capturedWorkspace.decisionReadings) || capturedWorkspace.decisionReadings.length !== 1
    || !same(capturedWorkspace.decisionReadings[0], archive)) {
    fail('Snapshot workspace borné du ticket ne cite pas l’archive A unique.');
  }
  assertTicketBase(workspace, ticket);
}

function readTicketInWorkspace(workspace: HopV55Workspace, raw: unknown,
  contract: HopV55AssistedAdviceBackendContractV1): HopV55AssistedAdviceTicketV1 | undefined {
  const read = readAppTicket(raw, contract);
  if (read.status === 'unsupportedReadOnly') {
    opaqueScope(read.snapshot, workspace, 'Ticket');
    return undefined;
  }
  if (read.status === 'invalid') fail(`Ticket assisté invalide : ${read.reason}`);
  assertTicketWorkspaceAdmission(workspace, read.ticket);
  return read.ticket;
}

/** Strict read validation used by the existing Dexie workspace repository. */
export function assertHopV55AssistedAdviceWorkspaceCollections(value: HopV55Workspace,
  contract?: HopV55AssistedAdviceBackendContractV1): void {
  const rawTickets = value.assistedAdviceTickets;
  const rawRecords = value.assistedAdviceRecords;
  if (rawTickets === undefined && rawRecords === undefined || Array.isArray(rawTickets) && !rawTickets.length
    && Array.isArray(rawRecords) && !rawRecords.length) return;
  if (!Array.isArray(rawTickets ?? []) || !Array.isArray(rawRecords ?? [])) fail('Collections assistées doivent être des tableaux.');
  if (!contract) {
    // An older client may preserve these bytes while continuing ordinary workspace work.
    // It cannot interpret, append, reorder, or remove them without the exact readers.
    for (const [label, rows] of [['Ticket', rawTickets ?? []], ['Receipt', rawRecords ?? []]] as const) {
      for (const raw of rows) {
        if (!isRecord(raw) || typeof raw.format !== 'string') fail(`${label} assisté conservé, mais son format est illisible.`, 'unsupportedFormat');
        opaqueScope(raw, value, label);
      }
    }
    return;
  }
  const tickets = rawTickets ?? [];
  const records = rawRecords ?? [];
  const ticketIds = new Set<string>(), ticketRefs = new Set<string>(), ticketOperations = new Set<string>();
  const knownTickets = new Map<string, HopV55AssistedAdviceTicketV1>();
  for (const raw of tickets) {
    const read = readAppTicket(raw, contract);
    if (read.status === 'unsupportedReadOnly') {
      opaqueScope(read.snapshot, value, 'Ticket');
      const opaque = isRecord(read.snapshot) ? read.snapshot : {};
      for (const [field, set] of [['id', ticketIds], ['reference', ticketRefs], ['operationId', ticketOperations]] as const) {
        const item = opaque[field];
        if (isText(item)) {
          if (set.has(item)) fail(`Ticket futur dupliqué (${field}).`, 'unsupportedFormat');
          set.add(item);
        }
      }
      continue;
    }
    if (read.status === 'invalid') fail(`Ticket assisté invalide : ${read.reason}`);
    const ticket = read.ticket;
    assertTicketWorkspaceAdmission(value, ticket);
    for (const [field, item, set] of [['id', ticket.id, ticketIds], ['reference', ticket.reference, ticketRefs],
      ['operationId', ticket.operationId, ticketOperations]] as const) {
      if (set.has(item)) fail(`Ticket assisté dupliqué (${field}).`);
      set.add(item);
    }
    knownTickets.set(ticket.reference, ticket);
  }
  const recordIds = new Set<string>(), recordRefs = new Set<string>(), recordOperations = new Set<string>(), turnIds = new Set<string>();
  for (const raw of records) {
    if (isRecord(raw) && typeof raw.format === 'string' && raw.format.startsWith(`${HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT.slice(0, -2)}`)
      && raw.format !== HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT) {
      opaqueScope(raw, value, 'Receipt');
      for (const [field, set] of [['id', recordIds], ['reference', recordRefs], ['operationId', recordOperations]] as const) {
        const item = raw[field];
        if (isText(item)) {
          if (set.has(item)) fail(`Receipt futur dupliqué (${field}).`, 'unsupportedFormat');
          set.add(item);
        }
      }
      continue;
    }
    if (!isRecord(raw) || !isText(raw.ticketReference)) fail('Receipt assisté sans ticket exact.');
    const ticket = knownTickets.get(raw.ticketReference);
    if (!ticket) {
      const futureTicket = tickets.find(row => isRecord(row) && row.reference === raw.ticketReference);
      if (futureTicket) fail('Receipt lié à un ticket futur reste opaque.', 'unsupportedFormat');
      fail('Receipt assisté sans ticket déjà persisté.');
    }
    const read = readHopV55AssistedAdviceRecordV1(raw, ticket, contract);
    if (read.status === 'unsupportedReadOnly') {
      opaqueScope(read.snapshot, value, 'Receipt');
      const opaque = isRecord(read.snapshot) ? read.snapshot : {};
      for (const [field, set] of [['id', recordIds], ['reference', recordRefs], ['operationId', recordOperations]] as const) {
        const item = opaque[field];
        if (isText(item)) {
          if (set.has(item)) fail(`Receipt futur dupliqué (${field}).`, 'unsupportedFormat');
          set.add(item);
        }
      }
      continue;
    }
    if (read.status !== 'available') fail(`Receipt assisté invalide : ${read.reason}`);
    const record = read.record;
    for (const [field, item, set] of [['id', record.id, recordIds], ['reference', record.reference, recordRefs],
      ['operationId', record.operationId, recordOperations], ['turnId', record.turn.id, turnIds]] as const) {
      if (set.has(item)) fail(`Receipt assisté dupliqué (${field}).`);
      set.add(item);
    }
  }
}

function samePrefix(previous: readonly unknown[], next: readonly unknown[], label: string): void {
  if (next.length < previous.length || previous.some((row, index) => !same(row, next[index]))) {
    fail(`${label} est immuable et append-only.`);
  }
}

function appendTicketToWorkspace(workspace: HopV55Workspace, rawTicket: unknown,
  contract: HopV55AssistedAdviceBackendContractV1): { status: 'appended' | 'duplicate'; workspace: HopV55Workspace } {
  const ticketRead = readAppTicket(rawTicket, contract);
  if (ticketRead.status === 'unsupportedReadOnly') fail(ticketRead.reason, 'unsupportedFormat');
  if (ticketRead.status === 'invalid') fail(ticketRead.reason);
  const ticket = ticketRead.ticket;
  assertTicketWorkspaceAdmission(workspace, ticket);
  const history = workspace.assistedAdviceTickets ?? [];
  for (const raw of history) {
    const read = readAppTicket(raw, contract);
    if (read.status === 'unsupportedReadOnly') {
      opaqueScope(read.snapshot, workspace, 'Ticket');
      const opaque = isRecord(read.snapshot) ? read.snapshot : {};
      if (opaque.operationId === ticket.operationId || opaque.id === ticket.id || opaque.reference === ticket.reference) {
        fail('Un ticket futur réserve déjà cet operationId ou cette identité.', 'unsupportedFormat');
      }
      continue;
    }
    if (read.status !== 'readOnly') fail(`Ticket existant invalide : ${read.reason}`);
    if (read.ticket.ownerKey !== workspace.ownerKey || read.ticket.workspaceId !== workspace.id) fail('Ticket existant étranger au workspace.');
    if (read.ticket.operationId === ticket.operationId || read.ticket.id === ticket.id || read.ticket.reference === ticket.reference) {
      if (read.ticket.reference === ticket.reference && same(read.ticket, ticket)) return { status: 'duplicate', workspace: clone(workspace) };
      fail('Ce ticket/operationId a déjà un autre contenu.', 'conflict');
    }
  }
  const next = { ...clone(workspace), assistedAdviceTickets: [...history, clone(ticket)] };
  return { status: 'appended', workspace: next };
}

export function assertHopV55AssistedAdviceWorkspaceAppendOnly(previous: HopV55Workspace, next: HopV55Workspace,
  contract?: HopV55AssistedAdviceBackendContractV1): void {
  const oldTickets = previous.assistedAdviceTickets ?? [];
  const newTickets = next.assistedAdviceTickets ?? [];
  const oldRecords = previous.assistedAdviceRecords ?? [];
  const newRecords = next.assistedAdviceRecords ?? [];
  if (!oldTickets.length && !newTickets.length && !oldRecords.length && !newRecords.length) return;
  if (!contract) {
    if (!same(oldTickets, newTickets) || !same(oldRecords, newRecords)) {
      fail('Les archives assistées sont conservées sans writer tant que leurs contrats exacts ne sont pas chargés.', 'unsupportedFormat');
    }
    return;
  }
  samePrefix(oldTickets, newTickets, 'Les tickets assistés');
  samePrefix(oldRecords, newRecords, 'Les receipts assistés');
  assertHopV55AssistedAdviceWorkspaceCollections(next, contract);
  for (const raw of newTickets.slice(oldTickets.length)) {
    const read = readAppTicket(raw, contract);
    if (read.status !== 'readOnly') fail('Un ticket futur/invalide ne peut pas être ajouté par ce writer.', 'unsupportedFormat');
    assertTicketWorkspaceAdmission(next, read.ticket);
  }
  for (const raw of newRecords.slice(oldRecords.length)) {
    if (!isRecord(raw) || !isText(raw.ticketReference)) fail('Receipt sans ticket exact.');
    const ticketRows = oldTickets;
    const ticketRead = ticketRows.map(row => readAppTicket(row, contract)).find(read => read.status === 'readOnly'
      && read.ticket.reference === raw.ticketReference);
    if (!ticketRead || ticketRead.status !== 'readOnly') fail('Un receipt exige un ticket déjà sauvegardé dans le CAS précédent.');
    assertTicketWorkspaceAdmission(previous, ticketRead.ticket);
    const read = readHopV55AssistedAdviceRecordV1(raw, ticketRead.ticket, contract);
    if (read.status !== 'available') fail(read.status === 'invalid' ? read.reason : read.reason,
      read.status === 'unsupportedReadOnly' ? 'unsupportedFormat' : 'invalidInput');
  }
}

export type HopV55AssistedAdviceWorkspaceRead<T> =
  | { status: 'available'; value: T; revision: number }
  | { status: 'absent'; revision: number }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string; revision: number }
  | { status: 'invalid'; reason: string; revision: number };

export interface HopV55AssistedAdviceWorkspaceClientV1 {
  ownerKey: string;
  readWorkspace(workspaceId: string): Promise<HopV55Workspace | null>;
  listTickets(workspaceId: string): Promise<unknown[]>;
  readTicketByOperationId(workspaceId: string, operationId: string): Promise<HopV55AssistedAdviceWorkspaceRead<HopV55AssistedAdviceTicketV1>>;
  appendTicket(workspaceId: string, ticket: unknown, expectedRevision: number): Promise<{ status: 'appended' | 'duplicate'; workspace: HopV55Workspace }>;
  listRecords(workspaceId: string): Promise<unknown[]>;
  readRecordByOperationId(workspaceId: string, operationId: string): Promise<HopV55AssistedAdviceWorkspaceRead<HopV55AssistedAdviceRecordV1>>;
  readArchiveByOperationId(workspaceId: string, operationId: string): Promise<HopV55AssistedAdviceWorkspaceRead<{
    ticket: HopV55AssistedAdviceTicketV1; record: HopV55AssistedAdviceRecordV1;
  }>>;
  /** Pure strict sealing helper; ticket must still be appended before appendRecord. */
  createRecord(input: { id: string; ticket: HopV55AssistedAdviceTicketV1; job: HopV55AssistedJobReferenceV1;
    turn: BrewerTurn; payload: HopV55AssistedAdviceReceptionPayloadV1 }): HopV55AssistedAdviceRecordV1;
  appendRecord(workspaceId: string, record: unknown, expectedRevision: number): Promise<{ status: 'appended' | 'duplicate'; workspace: HopV55Workspace }>;
}

export function createHopV55AssistedAdviceWorkspaceClient(input: {
  ownerKey: string;
  workspaces: HopV55WorkspaceRepository;
  contract?: HopV55AssistedAdviceBackendContractV1;
}): HopV55AssistedAdviceWorkspaceClientV1 {
  const { ownerKey, workspaces, contract } = input;
  if (!isText(ownerKey) || ownerKey.trim() !== ownerKey) fail('ownerKey explicite requis.');
  async function load(workspaceId: string): Promise<HopV55Workspace> {
    const workspace = await workspaces.read(ownerKey, workspaceId);
    if (!workspace) fail('Workspace assisté introuvable.', 'notFound');
    if (workspace.ownerKey !== ownerKey || workspace.id !== workspaceId) fail('Workspace assisté hors owner/key demandé.');
    return workspace;
  }
  const laterTimestamp = (existing: string, event: string) => Date.parse(existing) >= Date.parse(event) ? existing : event;
  return {
    ownerKey,
    async readWorkspace(workspaceId) { return load(workspaceId); },
    async listTickets(workspaceId) {
      const workspace = await load(workspaceId);
      return clone(workspace.assistedAdviceTickets ?? []);
    },
    async readTicketByOperationId(workspaceId, operationId) {
      const workspace = await load(workspaceId);
      if (!isText(operationId)) return { status: 'invalid', reason: 'operationId requis.', revision: workspace.revision };
      if (!contract) {
        const snapshot = workspace.assistedAdviceTickets ?? [];
        return snapshot.length ? { status: 'unsupportedReadOnly', snapshot: clone(snapshot),
          reason: 'Lecteurs du contrat assisté absents; tickets conservés sans interprétation ni écriture.', revision: workspace.revision }
          : { status: 'absent', revision: workspace.revision };
      }
      const found: HopV55AssistedAdviceTicketV1[] = [];
      for (const raw of workspace.assistedAdviceTickets ?? []) {
        const read = readAppTicket(raw, contract);
        if (read.status === 'unsupportedReadOnly') {
          opaqueScope(read.snapshot, workspace, 'Ticket');
          if (isRecord(read.snapshot) && read.snapshot.operationId === operationId) {
            return { status: 'unsupportedReadOnly', snapshot: clone(read.snapshot), reason: read.reason, revision: workspace.revision };
          }
          continue;
        }
        if (read.status === 'invalid') return { status: 'invalid', reason: read.reason, revision: workspace.revision };
        if (read.ticket.operationId === operationId) {
          assertTicketWorkspaceAdmission(workspace, read.ticket);
          found.push(read.ticket);
        }
      }
      if (found.length > 1) return { status: 'invalid', reason: 'operationId ticket dupliqué.', revision: workspace.revision };
      return found.length ? { status: 'available', value: clone(found[0]), revision: workspace.revision }
        : { status: 'absent', revision: workspace.revision };
    },
    async appendTicket(workspaceId, rawTicket, expectedRevision) {
      const workspace = await load(workspaceId);
      if (!contract) fail('Lecteur du contrat assisté absent; aucun ticket n’est écrit.', 'unsupportedFormat');
      const ticket = readAppTicket(rawTicket, contract);
      if (ticket.status !== 'readOnly') fail(ticket.status === 'invalid' ? ticket.reason : ticket.reason,
        ticket.status === 'unsupportedReadOnly' ? 'unsupportedFormat' : 'invalidInput');
      const appended = appendTicketToWorkspace(workspace, ticket.ticket, contract);
      if (appended.status === 'duplicate') return appended;
      if (workspace.revision !== expectedRevision) fail('Workspace changé avant l’append du ticket.', 'staleRevision');
      const updatedAt = laterTimestamp(workspace.updatedAt, ticket.ticket.createdAt);
      const saved = await workspaces.save({ ...appended.workspace, updatedAt, revision: expectedRevision }, expectedRevision);
      return { status: 'appended', workspace: saved };
    },
    async listRecords(workspaceId) {
      const workspace = await load(workspaceId);
      return clone(workspace.assistedAdviceRecords ?? []);
    },
    async readRecordByOperationId(workspaceId, operationId) {
      const workspace = await load(workspaceId);
      if (!contract) {
        const snapshot = { tickets: workspace.assistedAdviceTickets ?? [], records: workspace.assistedAdviceRecords ?? [] };
        return snapshot.tickets.length || snapshot.records.length ? { status: 'unsupportedReadOnly', snapshot: clone(snapshot),
          reason: 'Lecteurs du contrat assisté absents; receipts conservés sans interprétation ni écriture.', revision: workspace.revision }
          : { status: 'absent', revision: workspace.revision };
      }
      const result = readHopV55AssistedAdviceRecordByOperationId({
        records: workspace.assistedAdviceRecords ?? [], tickets: workspace.assistedAdviceTickets ?? [], ownerKey,
        workspaceId, operationId,
      }, contract);
      if (result.status === 'available') return { status: 'available', value: result.record, revision: workspace.revision };
      if (result.status === 'absent') return { status: 'absent', revision: workspace.revision };
      if (result.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(result.snapshot),
        reason: result.reason, revision: workspace.revision };
      return { status: 'invalid', reason: result.reason, revision: workspace.revision };
    },
    async readArchiveByOperationId(workspaceId, operationId) {
      const workspace = await load(workspaceId);
      if (!contract) {
        const snapshot = { tickets: workspace.assistedAdviceTickets ?? [], records: workspace.assistedAdviceRecords ?? [] };
        return snapshot.tickets.length || snapshot.records.length ? { status: 'unsupportedReadOnly', snapshot: clone(snapshot),
          reason: 'Lecteurs du contrat assisté absents; archive conservée sans interprétation ni écriture.', revision: workspace.revision }
          : { status: 'absent', revision: workspace.revision };
      }
      const recordRead = readHopV55AssistedAdviceRecordByOperationId({
        records: workspace.assistedAdviceRecords ?? [], tickets: workspace.assistedAdviceTickets ?? [], ownerKey,
        workspaceId, operationId,
      }, contract);
      if (recordRead.status === 'absent') return { status: 'absent', revision: workspace.revision };
      if (recordRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(recordRead.snapshot),
        reason: recordRead.reason, revision: workspace.revision };
      if (recordRead.status === 'invalid') return { status: 'invalid', reason: recordRead.reason, revision: workspace.revision };
      const ticketRaw = (workspace.assistedAdviceTickets ?? []).find(row => isRecord(row) && row.reference === recordRead.record.ticketReference);
      if (!ticketRaw) return { status: 'invalid', reason: 'Ticket exact absent à l’ouverture de l’archive.', revision: workspace.revision };
      const archive = readHopV55AssistedAdviceArchiveV1({ ticket: ticketRaw, record: recordRead.record }, contract);
      if (archive.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(archive.snapshot),
        reason: archive.reason, revision: workspace.revision };
      if (archive.status === 'invalid') return { status: 'invalid', reason: archive.reason, revision: workspace.revision };
      return { status: 'available', value: { ticket: archive.ticket, record: archive.record }, revision: workspace.revision };
    },
    createRecord(recordInput) {
      if (!contract) fail('Lecteur du contrat assisté absent; aucun receipt n’est construit.', 'unsupportedFormat');
      try { return clone(createHopV55AssistedAdviceRecordV1(recordInput, contract)); }
      catch (error) {
        const code = error instanceof Error && 'code' in error && (error as { code?: unknown }).code === 'unsupportedFormat'
          ? 'unsupportedFormat' : 'invalidInput';
        fail(error instanceof Error ? error.message : 'Receipt assisté invalide.', code);
      }
    },
    async appendRecord(workspaceId, receipt, expectedRevision) {
      const workspace = await load(workspaceId);
      if (!contract) fail('Lecteur du contrat assisté absent; aucun receipt n’est écrit.', 'unsupportedFormat');
      const appended = appendHopV55AssistedAdviceRecordToWorkspace(workspace, receipt, workspace.assistedAdviceTickets ?? [], contract);
      if (appended.status === 'duplicate') return appended;
      if (workspace.revision !== expectedRevision) fail('Workspace changé avant l’append du receipt.', 'staleRevision');
      const receiptValue = receipt as HopV55AssistedAdviceRecordV1;
      const updatedAt = laterTimestamp(workspace.updatedAt, receiptValue.payload.receivedAt);
      const saved = await workspaces.save({ ...appended.workspace, updatedAt, revision: expectedRevision }, expectedRevision);
      return { status: 'appended', workspace: saved };
    },
  };
}
