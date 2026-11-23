/**
 * Durable source of the V6 adoption closure (#66). It re-reads, from the workspace repository, the exact
 * semantic ticket and record persisted by the host, validates them with the closed V2/V3 codec, and hands
 * the controller only a verified V6 turn bound to a ticket that sealed the brewer's local candidate policy.
 * No cache, Map or caller snapshot stands in for storage; V1, V5, future and policy-less tickets stay readable
 * elsewhere but are never adoptable here.
 *
 * Storage: semantic tickets and records live in their own workspace collections. The V1 assisted collections
 * keep their exact readers and writer; a V1 launch never shares an ID or operation with a semantic one.
 */
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { BrewerEvidence } from '../../../functions/src/companionTypes';
import type { HopV55Workspace, HopV55WorkspaceRepository } from './contracts';
import {
  HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT,
  HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT,
  readHopV55AssistedAdviceArchiveV2,
  readHopV55AssistedAdviceWizardArchiveV1,
  readHopV55AssistedAdviceWizardTicketV1,
  readHopV55AssistedAdviceWizardRecordV1,
  HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT,
  HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT,
  readHopV55AssistedAdviceSemanticEnvelopeV2,
  readHopV55AssistedAdviceTicketV2,
  type HopV55AssistedAdviceTicketV3,
  type HopV55AssistedAdviceWizardTicketV1,
} from './assistedSemanticAdviceArchiveV2';
import { readHopV55DecisionReadingArchiveForWizardV1 } from './decisionArchive';
import type { BrewerHopAdviceWizardRequestV3 } from '../../../functions/src/brewerHopAdviceSemanticV3';
import {
  readBrewerHopAdviceProposalEnvelopeV6ForWizardV1,
  assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1,
  verifyBrewerHopAdviceSemanticEvidenceV6ForWizardV1,
  type BrewerHopAdviceWizardProposalEnvelopeV6,
} from '../../../functions/src/brewerHopAdviceSemanticV6';
import type { HopV55SemanticAdoptionTicketV1 } from './assistedSemanticAdviceAdoptionV6';
import type {
  HopV55SemanticAdoptionTurnClosureV1,
  HopV55SemanticAdoptionTurnReadV1,
  HopV55SemanticAdoptionTurnReaderV1,
} from './semanticAdoptionController';

/** Workspace fields owned by the repository (#67 patch); typed here until `contracts.ts` declares them. */
export type HopV55SemanticAdviceArchiveWorkspaceV1 = HopV55Workspace & {
  assistedSemanticAdviceTickets?: unknown[];
  assistedSemanticAdviceRecords?: unknown[];
};

export type HopV55SemanticAdoptionTurnClosureForWizardV1 = {
  sourceTicketReference: string;
  sourceRecordReference: string;
  wireReference: string;
  ticket: HopV55SemanticAdoptionTicketV1 & { profile: 'wizardV1' };
  request: BrewerHopAdviceWizardRequestV3;
  candidatePolicy: import('../../domain/hopDecision/propertyAdviceSchema').HopPropertyAdviceCandidatePolicy;
  sourceArchive: import('./decisionArchive').HopV55WizardDecisionReadingArchiveV4;
  envelope: BrewerHopAdviceWizardProposalEnvelopeV6;
  turnEvidence: readonly BrewerEvidence[];
};

export type HopV55SemanticAdoptionTurnReadForWizardV1 =
  | { status: 'available'; closure: HopV55SemanticAdoptionTurnClosureForWizardV1 }
  | { status: 'absent' | 'unsupportedReadOnly' | 'invalid'; reason: string; raw?: unknown };

const TICKET_PREFIX = 'hop-v55-assisted-advice-ticket-';
const RECORD_PREFIX = 'hop-v55-assisted-advice-record-';
const LEGACY_RECORD_FORMAT = 'hop-v55-assisted-advice-record-v1';

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const clone = <T,>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown) => {
  try {
    return hopAdviceContentReference('hop-v55-semantic-adoption-turn-source-equality-v1', left)
      === hopAdviceContentReference('hop-v55-semantic-adoption-turn-source-equality-v1', right);
  } catch { return false; }
};

function rows(value: unknown, label: string): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${label} sémantiques illisibles.`);
  return value;
}

const refuse = (status: 'absent' | 'unsupportedReadOnly' | 'invalid', reason: string, raw?: unknown): HopV55SemanticAdoptionTurnReadV1 =>
  ({ status, reason, ...(raw === undefined ? {} : { raw: clone(raw) }) });

const refuseWizard = (status: 'absent' | 'unsupportedReadOnly' | 'invalid', reason: string, raw?: unknown): HopV55SemanticAdoptionTurnReadForWizardV1 =>
  ({ status, reason, ...(raw === undefined ? {} : { raw: clone(raw) }) });

/** Pure exact Wizard turn closure; no current Recipe lookup or re-synthesis of its archived wire. */
export function readHopV55SemanticAdoptionTurnClosureForWizardV1(input: {
  workspace: HopV55Workspace;
  ownerKey: string;
  workspaceId: string;
  ticketId: string;
  operationId: string;
}): HopV55SemanticAdoptionTurnReadForWizardV1 {
  try {
    const workspace = input.workspace as HopV55SemanticAdviceArchiveWorkspaceV1;
    if (!isText(input.ticketId) || !isText(input.operationId)) return refuseWizard('invalid', 'ID de ticket Wizard et operationId exacts requis.');
    if (workspace.ownerKey !== input.ownerKey || workspace.id !== input.workspaceId) {
      return refuseWizard('invalid', 'Workspace Wizard relu hors owner/workspace demandé.');
    }
    const tickets = rows(workspace.assistedSemanticAdviceTickets, 'Tickets');
    const records = rows(workspace.assistedSemanticAdviceRecords, 'Records');
    if ((workspace.assistedAdviceTickets ?? []).some(row => isRow(row)
      && (row.id === input.ticketId || row.operationId === input.operationId))) {
      return refuseWizard('unsupportedReadOnly', 'Cette opération utilise le ticket Request2 historique; aucun ticket Wizard n’est fabriqué.');
    }
    const candidates = tickets.filter(row => isRow(row) && (row.id === input.ticketId || row.operationId === input.operationId));
    if (!candidates.length) return refuseWizard('absent', 'Aucun ticket Wizard durable sous cet ID/opération.');
    if (candidates.length > 1) return refuseWizard('invalid', 'Plusieurs tickets revendiquent l’ID/opération Wizard.');
    const rawTicket = candidates[0];
    if (!isRow(rawTicket) || rawTicket.format !== HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT) {
      return refuseWizard('unsupportedReadOnly', 'L’opération n’est pas un ticket Wizard V1 connu; historique conservé sans promotion.', rawTicket);
    }
    const ticketRead = readHopV55AssistedAdviceWizardTicketV1(rawTicket);
    if (ticketRead.status === 'invalid') return refuseWizard('invalid', ticketRead.reason);
    if (ticketRead.status !== 'readOnly') return refuseWizard('unsupportedReadOnly', ticketRead.reason, rawTicket);
    const ticket = ticketRead.ticket;
    if (ticket.id !== input.ticketId || ticket.operationId !== input.operationId
      || ticket.ownerKey !== input.ownerKey || ticket.workspaceId !== input.workspaceId) {
      return refuseWizard('invalid', 'ID/opération ou partition du ticket Wizard divergent.');
    }
    const archiveRead = readHopV55DecisionReadingArchiveForWizardV1(ticket.sourceArchive);
    if (archiveRead.status !== 'available' || !same(archiveRead.archive, ticket.sourceArchive)) {
      return refuseWizard(archiveRead.status === 'unsupportedFormat' ? 'unsupportedReadOnly' : 'invalid',
        archiveRead.status === 'available' ? 'Archive Wizard du ticket incohérente.' : archiveRead.status === 'invalidRecord'
          ? archiveRead.reason : `Format archive future ${archiveRead.format}.`, ticket.sourceArchive);
    }
    if (!(workspace.decisionReadings ?? []).some(row => isRow(row) && row.contentReference === ticket.sourceArchive.contentReference
      && same(row, ticket.sourceArchive))) {
      return refuseWizard('invalid', 'L’archive Wizard complète n’est pas persistée dans ce workspace exact.');
    }
    const linked = records.filter(row => isRow(row) && row.ticketReference === ticket.reference);
    if (!linked.length) return refuseWizard('absent', 'Aucun tour réel n’est encore archivé sous le ticket Wizard.');
    if (linked.length > 1) return refuseWizard('invalid', 'Plusieurs records revendiquent le ticket Wizard.');
    const pair = readHopV55AssistedAdviceWizardArchiveV1({ ticket, record: linked[0] });
    if (pair.status === 'invalid') return refuseWizard('invalid', pair.reason);
    if (pair.status !== 'readOnly') return refuseWizard('unsupportedReadOnly', pair.reason, pair.snapshot);
    if (pair.record.semantic.kind !== 'verifiedV6') {
      return refuseWizard('unsupportedReadOnly', `Tour Wizard conservé opaque (${pair.record.semantic.status}); non adoptable.`, pair.record);
    }
    const envelopeRead = readBrewerHopAdviceProposalEnvelopeV6ForWizardV1(pair.record.turn.hopAdviceProposal);
    if (envelopeRead.status !== 'readOnly') {
      return refuseWizard('unsupportedReadOnly', envelopeRead.status === 'invalid' ? envelopeRead.reason : envelopeRead.reason,
        pair.record.turn.hopAdviceProposal);
    }
    assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1(envelopeRead.envelope, pair.ticket.request);
    verifyBrewerHopAdviceSemanticEvidenceV6ForWizardV1(envelopeRead.envelope, pair.record.fullEvidence);
    const closure: HopV55SemanticAdoptionTurnClosureForWizardV1 = {
      sourceTicketReference: ticket.reference,
      sourceRecordReference: pair.record.reference,
      wireReference: ticket.references.wireReference,
      ticket: { profile: 'wizardV1', ticketId: ticket.id, operationId: ticket.operationId, generation: ticket.generation,
        ownerKey: ticket.ownerKey, workspaceId: ticket.workspaceId, scope: clone(ticket.scope),
        requestReference: ticket.references.requestReference },
      request: clone(ticket.request), candidatePolicy: clone(ticket.candidatePolicy),
      sourceArchive: clone(ticket.sourceArchive), envelope: clone(envelopeRead.envelope), turnEvidence: clone(pair.record.fullEvidence),
    };
    return { status: 'available', closure };
  } catch (error) {
    return refuseWizard('invalid', error instanceof Error ? error.message : 'Fermeture de tour Wizard illisible.');
  }
}

/**
 * Pure read of one closure in an already loaded workspace. The repository source below loads that
 * workspace fresh on each call; the controller re-reads its own workspace and archive presence too.
 */
export function readHopV55SemanticAdoptionTurnClosureV1(input: {
  workspace: HopV55Workspace;
  ownerKey: string;
  workspaceId: string;
  ticketId: string;
  operationId: string;
}): HopV55SemanticAdoptionTurnReadV1 {
  try {
    const workspace = input.workspace as HopV55SemanticAdviceArchiveWorkspaceV1;
    if (!isText(input.ticketId) || !isText(input.operationId)) return refuse('invalid', 'Ticket et opération exacts requis.');
    if (workspace.ownerKey !== input.ownerKey || workspace.id !== input.workspaceId) {
      return refuse('invalid', 'Workspace relu hors owner/workspace demandé.');
    }
    const tickets = rows(workspace.assistedSemanticAdviceTickets, 'Tickets');
    const records = rows(workspace.assistedSemanticAdviceRecords, 'Records');
    if ((workspace.assistedAdviceTickets ?? []).some(row => isRow(row)
      && (row.id === input.ticketId || row.operationId === input.operationId))) {
      return refuse('unsupportedReadOnly', 'Cette opération appartient à un ticket V1 Request2; il reste lisible sous son lecteur et n’est jamais adopté en V6.');
    }
    const candidates = tickets.filter(row => isRow(row) && (row.id === input.ticketId || row.operationId === input.operationId));
    if (!candidates.length) return refuse('absent', 'Aucun ticket sémantique durable sous cet ID et cette opération.');
    if (candidates.length > 1) return refuse('invalid', 'Plusieurs tickets durables revendiquent cet ID ou cette opération.');
    const rawTicket = candidates[0];
    const ticketRead = readHopV55AssistedAdviceTicketV2(rawTicket);
    if (ticketRead.status === 'invalid') return refuse('invalid', ticketRead.reason);
    if (ticketRead.status !== 'readOnly') return refuse('unsupportedReadOnly', ticketRead.reason, rawTicket);
    const ticket = ticketRead.ticket;
    if (ticket.id !== input.ticketId || ticket.operationId !== input.operationId) {
      return refuse('invalid', 'L’ID et l’opération demandés ne désignent pas le même ticket durable.');
    }
    if (ticket.ownerKey !== input.ownerKey || ticket.workspaceId !== input.workspaceId) {
      return refuse('invalid', 'Ticket durable étranger à l’owner ou au workspace demandés.');
    }
    if (ticket.format !== HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT) {
      return refuse('unsupportedReadOnly', 'Ticket V2 sans politique de candidats locale : conservé en lecture seule, jamais adopté ni complété.', rawTicket);
    }
    const linked = records.filter(row => isRow(row) && row.ticketReference === ticket.reference);
    if (!linked.length) return refuse('absent', 'Aucun tour reçu n’est encore scellé sous ce ticket durable.');
    if (linked.length > 1) return refuse('invalid', 'Plusieurs records durables revendiquent ce ticket.');
    const pair = readHopV55AssistedAdviceArchiveV2({ ticket: rawTicket, record: linked[0] });
    if (pair.status === 'invalid') return refuse('invalid', pair.reason);
    if (pair.status !== 'readOnly') return refuse('unsupportedReadOnly', pair.reason, pair.snapshot);
    const record = pair.record;
    if (record.semantic.kind !== 'verifiedV6') {
      return refuse('unsupportedReadOnly', `Tour conservé opaque (${record.semantic.status}) : aucune enveloppe V6 n’est fabriquée ni adaptée.`, record);
    }
    const envelope = readHopV55AssistedAdviceSemanticEnvelopeV2({ envelope: record.turn.hopAdviceProposal,
      request: pair.ticket.request, fullEvidence: record.fullEvidence });
    if (envelope.status !== 'readOnly') {
      return refuse('invalid', 'La disposition V6 scellée ne se relit plus comme enveloppe V6 de cette Request3.');
    }
    const sealed = pair.ticket as HopV55AssistedAdviceTicketV3;
    const closure: HopV55SemanticAdoptionTurnClosureV1 = {
      sourceTicketReference: sealed.reference,
      sourceRecordReference: record.reference,
      wireReference: sealed.references.wireReference,
      ticket: { ticketId: sealed.id, operationId: sealed.operationId, generation: sealed.generation, ownerKey: sealed.ownerKey,
        workspaceId: sealed.workspaceId, scope: clone(sealed.scope), requestReference: sealed.references.requestReference },
      request: clone(sealed.request),
      candidatePolicy: clone(sealed.candidatePolicy),
      sourceArchive: clone(sealed.sourceArchive),
      envelope: clone(envelope.envelope),
      turnEvidence: clone(record.fullEvidence),
    };
    return { status: 'available', closure };
  } catch (error) {
    return refuse('invalid', error instanceof Error ? error.message : 'Fermeture sémantique durable illisible.');
  }
}

/** Repository-backed reader: one fresh workspace read per call, no memory between calls. */
export function createHopV55SemanticAdoptionTurnSourceV1(input: { workspaces: HopV55WorkspaceRepository }): HopV55SemanticAdoptionTurnReaderV1 {
  return {
    async read(request) {
      try {
        const workspace = await input.workspaces.read(request.ownerKey, request.workspaceId);
        if (!workspace) return refuse('absent', 'Workspace introuvable.');
        return readHopV55SemanticAdoptionTurnClosureV1({ workspace, ...request });
      } catch (error) {
        return refuse('invalid', error instanceof Error ? error.message : 'Lecture durable de la fermeture impossible.');
      }
    },
    async readWizard(request) {
      try {
        const workspace = await input.workspaces.read(request.ownerKey, request.workspaceId);
        if (!workspace) return refuseWizard('absent', 'Workspace Wizard introuvable.');
        return readHopV55SemanticAdoptionTurnClosureForWizardV1({ workspace, ...request });
      } catch (error) {
        return refuseWizard('invalid', error instanceof Error ? error.message : 'Lecture durable de la fermeture Wizard impossible.');
      }
    },
  };
}

/**
 * Collection validator for the repository (#67). Semantic tickets/records are read with the exact codec;
 * future rows stay opaque but owned and unique; a V1 launch cannot share an ID or operation with them;
 * each readable ticket's archive4 is a persisted decision reading of this workspace.
 */
export function assertHopV55SemanticAdviceArchiveCollectionsV1(input: {
  ownerKey: string;
  workspaceId: string;
  tickets: unknown;
  records: unknown;
  legacyTickets: unknown;
  decisionReadings: unknown;
}): void {
  if (input.tickets === undefined && input.records === undefined) return;
  const tickets = rows(input.tickets, 'Tickets');
  const records = rows(input.records, 'Records');
  const readings = new Set(rows(input.decisionReadings, 'Lectures').flatMap(row => isRow(row) && isText(row.contentReference) ? [row.contentReference] : []));
  const ticketIds = new Set<string>(), operations = new Set<string>(), ticketRefs = new Map<string, unknown>();
  const owned = (row: Row, label: string) => {
    if (row.ownerKey !== undefined && row.ownerKey !== input.ownerKey || row.workspaceId !== undefined && row.workspaceId !== input.workspaceId) {
      throw new Error(`${label} sémantique hors owner/workspace.`);
    }
  };
  const unique = (set: Set<string>, value: unknown, label: string) => {
    if (!isText(value)) return;
    if (set.has(value)) throw new Error(`${label} sémantique dupliqué.`);
    set.add(value);
  };
  for (const raw of tickets) {
    if (!isRow(raw) || typeof raw.format !== 'string' || !raw.format.startsWith(TICKET_PREFIX)) throw new Error('Ticket sémantique de format illisible.');
    if (raw.format === HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT) {
      const wizard = readHopV55AssistedAdviceWizardTicketV1(raw);
      if (wizard.status === 'invalid') throw new Error(`Ticket Wizard invalide : ${wizard.reason}`);
      owned(raw, 'Ticket Wizard');
      unique(ticketIds, raw.id, 'ID de ticket');
      unique(operations, raw.operationId, 'Opération');
      if (isText(raw.reference)) {
        if (ticketRefs.has(raw.reference)) throw new Error('Référence de ticket sémantique dupliquée.');
        ticketRefs.set(raw.reference, raw);
      }
      if (wizard.status === 'readOnly' && !readings.has(wizard.ticket.sourceArchive.contentReference)) {
        throw new Error('Le ticket Wizard exige son archive V4 Wizard exacte dans le workspace.');
      }
      continue;
    }
    const read = readHopV55AssistedAdviceTicketV2(raw);
    if (read.status === 'invalid') throw new Error(`Ticket sémantique invalide : ${read.reason}`);
    if (read.status === 'legacyReadOnly') {
      throw new Error(raw.format === 'hop-v55-assisted-advice-ticket-v1'
        ? 'Un ticket V1 reste dans sa collection historique.'
        : 'Un ticket sémantique exige une archive4 intégrale; une lecture historique n’entre pas dans cette collection.');
    }
    owned(raw, 'Ticket');
    unique(ticketIds, raw.id, 'ID de ticket');
    unique(operations, raw.operationId, 'Opération');
    if (isText(raw.reference)) {
      if (ticketRefs.has(raw.reference)) throw new Error('Référence de ticket sémantique dupliquée.');
      ticketRefs.set(raw.reference, raw);
    }
    if (read.status === 'readOnly' && !readings.has(read.ticket.sourceArchive.contentReference)) {
      throw new Error('Un ticket sémantique exige son archive4 exacte parmi les lectures du workspace.');
    }
  }
  for (const raw of rows(input.legacyTickets, 'Tickets V1')) {
    if (isRow(raw) && (raw.ownerKey === undefined || raw.ownerKey === input.ownerKey)
      && (raw.workspaceId === undefined || raw.workspaceId === input.workspaceId)
      && (isText(raw.id) && ticketIds.has(raw.id) || isText(raw.operationId) && operations.has(raw.operationId))) {
      throw new Error('Un ID ou une opération V1 est réemployé par un ticket sémantique; aucun mélange implicite.');
    }
  }
  const recordIds = new Set<string>(), recordRefs = new Set<string>(), linkedTickets = new Set<string>(), recordOperations = new Set<string>();
  for (const raw of records) {
    if (!isRow(raw) || typeof raw.format !== 'string' || !raw.format.startsWith(RECORD_PREFIX) || raw.format === LEGACY_RECORD_FORMAT) {
      throw new Error('Record sémantique de format illisible ou V1 hors de sa collection.');
    }
    owned(raw, 'Record');
    unique(recordIds, raw.id, 'ID de record');
    unique(recordRefs, raw.reference, 'Référence de record');
    unique(recordOperations, raw.operationId, 'Opération de record');
    if (raw.format === HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT) {
      if (!isText(raw.ticketReference) || !ticketRefs.has(raw.ticketReference)) throw new Error('Record Wizard sans ticket exact.');
      unique(linkedTickets, raw.ticketReference, 'Record Wizard par ticket');
      const read = readHopV55AssistedAdviceWizardRecordV1(raw, ticketRefs.get(raw.ticketReference));
      if (read.status === 'invalid') throw new Error(`Record Wizard invalide : ${read.reason}`);
      continue;
    }
    if (raw.format !== HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT) continue;
    if (!isText(raw.ticketReference) || !ticketRefs.has(raw.ticketReference)) throw new Error('Record sémantique sans ticket durable exact.');
    unique(linkedTickets, raw.ticketReference, 'Record par ticket');
    const read = readHopV55AssistedAdviceArchiveV2({ ticket: ticketRefs.get(raw.ticketReference), record: raw });
    if (read.status === 'invalid') throw new Error(`Record sémantique invalide : ${read.reason}`);
    if (read.status === 'legacyReadOnly') throw new Error('Un record sémantique ne se rattache jamais à un ticket V1.');
  }
}

/**
 * Append-only transition for the repository CAS (#67). A new ticket is a readable V3 (policy sealed before
 * the network) whose archive4 was persisted earlier; a new record is a readable V2 whose ticket was
 * persisted by an earlier CAS. Earlier rows, future ones included, are never rewritten or removed.
 */
export function assertHopV55SemanticAdviceArchiveAppendOnlyV1(input: { previous: HopV55Workspace; next: HopV55Workspace }): void {
  const previous = input.previous as HopV55SemanticAdviceArchiveWorkspaceV1;
  const next = input.next as HopV55SemanticAdviceArchiveWorkspaceV1;
  const oldTickets = rows(previous.assistedSemanticAdviceTickets, 'Tickets');
  const newTickets = rows(next.assistedSemanticAdviceTickets, 'Tickets');
  const oldRecords = rows(previous.assistedSemanticAdviceRecords, 'Records');
  const newRecords = rows(next.assistedSemanticAdviceRecords, 'Records');
  for (const [label, before, after] of [['tickets', oldTickets, newTickets], ['records', oldRecords, newRecords]] as const) {
    if (after.length < before.length || before.some((row, index) => !same(row, after[index]))) {
      throw new Error(`Les ${label} sémantiques sont immuables et append-only.`);
    }
  }
  const readings = new Set((previous.decisionReadings ?? []).flatMap(row => isRow(row) && isText(row.contentReference) ? [row.contentReference] : []));
  for (const raw of newTickets.slice(oldTickets.length)) {
    if (isRow(raw) && raw.format === HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT) {
      const read = readHopV55AssistedAdviceWizardTicketV1(raw);
      if (read.status !== 'readOnly' || !readings.has(read.ticket.sourceArchive.contentReference)) {
        throw new Error('Un nouveau ticket Wizard doit être strictement lisible et suivre le CAS de son archive V4 exacte.');
      }
      continue;
    }
    const read = readHopV55AssistedAdviceTicketV2(raw);
    if (read.status !== 'readOnly' || read.ticket.format !== HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT) {
      throw new Error('Un nouveau ticket sémantique doit être un V3 lisible portant la politique locale choisie avant l’envoi.');
    }
    if (!readings.has(read.ticket.sourceArchive.contentReference)) {
      throw new Error('L’archive4 doit être persistée par un CAS antérieur au ticket sémantique.');
    }
  }
  const previousTickets = new Map(oldTickets.flatMap(row => isRow(row) && isText(row.reference) ? [[row.reference, row] as const] : []));
  for (const raw of newRecords.slice(oldRecords.length)) {
    if (isRow(raw) && raw.format === HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT && isText(raw.ticketReference)) {
      const ticket = previousTickets.get(raw.ticketReference);
      if (ticket === undefined) throw new Error('Un record Wizard exige un ticket Wizard persisté dans un CAS antérieur.');
      const read = readHopV55AssistedAdviceWizardArchiveV1({ ticket, record: raw });
      if (read.status !== 'readOnly') throw new Error(`Record Wizard non ajoutable : ${read.status === 'invalid' ? read.reason : read.reason}`);
      continue;
    }
    if (!isRow(raw) || raw.format !== HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT || !isText(raw.ticketReference)) {
      throw new Error('Un nouveau record sémantique doit être un V2 connu lié à son ticket.');
    }
    const ticket = previousTickets.get(raw.ticketReference);
    if (ticket === undefined) throw new Error('Un record sémantique exige un ticket persisté dans un CAS antérieur.');
    const read = readHopV55AssistedAdviceArchiveV2({ ticket, record: raw });
    if (read.status !== 'readOnly') throw new Error(`Record sémantique non ajoutable : ${read.reason}`);
  }
}
