/**
 * Browser-safe Runtime archive codec for assisted-advice receipts. App retains
 * ticket ownership; exact backend readers/verifiers are injected at the seam.
 */
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type {
  BrewerHopAdviceProposalEnvelope,
  BrewerHopAdviceRequest,
} from '../../../functions/src/brewerHopAdviceProposal';
import type { BrewerEvidence, BrewerJob, BrewerTurn } from '../../../functions/src/companionTypes';
import { HOP_ADVICE_PROTOCOL_V1 } from '../../../functions/src/brewerHopAdviceTransportV1';
import type { CompareHopV55AssistedContextAtReceptionResult } from './assistedAdviceContext';
import type { PrepareHopV55AssistedAdviceResult } from './assistedAdviceProposal';
import type { HopV55AssistedAdviceTicketV1, HopV55AssistedAdviceTicketRead,
  HopV55AssistedAdviceReceptionPayloadV1 } from './assistedAdviceController';

export const HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT = 'hop-v55-assisted-advice-record-v1' as const;
export const HOP_V55_ASSISTED_RECORD_COLLECTION = 'assistedAdviceRecords' as const;

/** Nested contract versions are supplied by the exact backend package, not hard-coded here. */
export interface HopV55AssistedAdviceBackendContractV1 {
  requestFormat: string;
  contextLaunchFormat: string;
  contextProjectionFormat: string;
  proposalFormat: string;
  /** App-owned strict ticket reader; this codec never rebuilds or reseals the ticket. */
  readTicket(value: unknown): HopV55AssistedAdviceTicketRead;
  /** Pure canonical backend readers. The caller supplies the exact implementations. */
  assertProposalEnvelope(value: unknown): asserts value is BrewerHopAdviceProposalEnvelope;
  verifyTurnEvidence(envelope: BrewerHopAdviceProposalEnvelope, evidence: readonly BrewerEvidence[]): void;
}

export type HopV55AssistedJsonValue = null | boolean | number | string
  | HopV55AssistedJsonValue[] | { [key: string]: HopV55AssistedJsonValue };

export type HopV55AssistedPersistableClientResultV1 =
  | Extract<PrepareHopV55AssistedAdviceResult, { status: 'ready' }>
  | Extract<PrepareHopV55AssistedAdviceResult, { status: 'stale' }>;

export type HopV55AssistedJobReferenceV1 = Pick<BrewerJob, 'id' | 'operationId' | 'generation' | 'scope' | 'question'>;

export interface HopV55AssistedAdviceRecordV1 {
  format: typeof HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  operationId: string;
  ticketId: string;
  ticketReference: string;
  sourceReadingReference: string;
  sourceRecordReference: string | null;
  ledgerReference: string | null;
  request: BrewerHopAdviceRequest;
  /** Exact job identity/generation, distinct from the turn payload and its operationId. */
  job: HopV55AssistedJobReferenceV1;
  turn: BrewerTurn;
  envelope: BrewerHopAdviceProposalEnvelope;
  /** The entire App-owned unsealed reception payload is copied verbatim into this seal. */
  payload: HopV55AssistedAdviceReceptionPayloadV1;
  references: {
    requestReference: string;
    contextLaunchReference: string;
    contextProjectionReference: string;
    envelopeReference: string;
    serverBindingReference: string;
    jobReference: string;
    turnReference: string;
    turnEvidenceReference: string;
    receptionPayloadReference: string;
  };
  reference: string;
}

export type HopV55AssistedRecordRead<T> =
  | { status: 'available'; record: T }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export class HopV55AssistedAdviceArchiveError extends Error {
  constructor(readonly code: 'invalidInput' | 'conflict' | 'unsupportedFormat', message: string) {
    super(message);
    this.name = 'HopV55AssistedAdviceArchiveError';
  }
}

type Row = Record<string, unknown>;
const isRecord = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype;
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const isNullableText = (value: unknown): value is string | null => value === null || isText(value);
const exactKeys = (value: Row, keys: readonly string[]) => Object.keys(value).length === keys.length
  && Object.keys(value).every(key => keys.includes(key));
const hasOnlyKeys = (value: Row, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));
const clone = <T>(value: T): T => structuredClone(value);

function fail(message: string): never { throw new HopV55AssistedAdviceArchiveError('invalidInput', message); }

function assertJsonValue(value: unknown, path = 'snapshot', ancestors = new WeakSet<object>()): asserts value is HopV55AssistedJsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(`${path} contient un nombre non fini.`);
    return;
  }
  if (typeof value !== 'object' || value === undefined) fail(`${path} n’est pas un snapshot JSON sérialisable.`);
  if (ancestors.has(value)) fail(`${path} contient une référence cyclique.`);
  ancestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertJsonValue(entry, `${path}[${index}]`, ancestors));
  } else {
    if (Object.getPrototypeOf(value) !== Object.prototype) fail(`${path} doit être un objet JSON simple.`);
    for (const [key, entry] of Object.entries(value)) assertJsonValue(entry, `${path}.${key}`, ancestors);
  }
  ancestors.delete(value);
}

function contentReference(namespace: string, value: unknown): string {
  try { return hopAdviceContentReference(namespace, value); }
  catch (error) { fail(`Référence ${namespace} impossible : ${error instanceof Error ? error.message : String(error)}`); }
}

function same(left: unknown, right: unknown, namespace = 'hop-v55-assisted-equality-v1'): boolean {
  try { return contentReference(namespace, left) === contentReference(namespace, right); }
  catch { return false; }
}

function assertInstant(value: unknown, label: string): asserts value is string {
  if (!isText(value) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    || !Number.isFinite(Date.parse(value))) fail(`${label} doit être un instant ISO explicite.`);
}

function assertScope(value: unknown, label: string): asserts value is BrewerJob['scope'] {
  if (!isRecord(value) || !exactKeys(value, ['kind', 'id']) || !['recipe', 'batch', 'draft', 'app'].includes(String(value.kind))
    || !isText(value.id)) fail(`${label} est invalide.`);
}

function assertReception(value: unknown, sourceReadingReference: string): asserts value is CompareHopV55AssistedContextAtReceptionResult {
  if (!isRecord(value) || !hasOnlyKeys(value, ['history', 'applicability', 'stage', 'historicalSourceReadingReference', 'currentSourceReadingReference'])
    || !['history', 'applicability', 'stage', 'historicalSourceReadingReference'].every(key => Object.prototype.hasOwnProperty.call(value, key))
    || value.stage !== 'reception' || value.historicalSourceReadingReference !== sourceReadingReference) {
    fail('Comparaison de réception absente ou liée à une autre archive.');
  }
  const history = value.history;
  if (!isRecord(history) || history.status !== 'matched' || !exactKeys(history, ['status', 'catalogueDependenciesChanged',
    'calculationDependenciesChanged', 'runtimeDataRevisionChanged', 'stockAvailabilityChanged'])
    || ['catalogueDependenciesChanged', 'calculationDependenciesChanged', 'runtimeDataRevisionChanged', 'stockAvailabilityChanged']
      .some(key => typeof history[key] !== 'boolean')) {
    fail('Le contexte effectif serveur ne correspond pas à la source historique A.');
  }
  const applicability = value.applicability;
  if (!isRecord(applicability) || typeof applicability.status !== 'string') fail('Applicabilité de réception absente.');
  if (applicability.status === 'current') {
    if (!exactKeys(applicability, ['status', 'recalculationRequired', 'catalogueDependenciesChanged',
      'calculationDependenciesChanged', 'runtimeDataRevisionChanged', 'stockAvailabilityChanged'])
      || ['recalculationRequired', 'catalogueDependenciesChanged', 'calculationDependenciesChanged', 'runtimeDataRevisionChanged',
        'stockAvailabilityChanged'].some(key => typeof applicability[key] !== 'boolean')) fail('État courant de réception invalide.');
  } else if (applicability.status === 'stale') {
    if (!exactKeys(applicability, ['status', 'conflicts', 'reason']) || !Array.isArray(applicability.conflicts)
      || applicability.conflicts.some(conflict => !isText(conflict)) || !isText(applicability.reason)) fail('État périmé de réception invalide.');
  } else if (applicability.status === 'unavailable') {
    if (!exactKeys(applicability, ['status', 'reason']) || !isText(applicability.reason)) fail('Contexte courant indisponible invalide.');
  } else fail('État d’applicabilité inconnu.');
  if (value.currentSourceReadingReference !== undefined && !isText(value.currentSourceReadingReference)) {
    fail('currentSourceReadingReference invalide.');
  }
  if (applicability.status === 'current' && value.currentSourceReadingReference !== sourceReadingReference) {
    fail('Un contexte différent ne peut pas être déclaré courant pour la source historique A.');
  }
}

function assertJobReference(value: unknown): asserts value is HopV55AssistedJobReferenceV1 {
  if (!isRecord(value) || !exactKeys(value, ['id', 'operationId', 'generation', 'scope', 'question']) || !isText(value.id)
    || !isText(value.operationId) || !Number.isSafeInteger(value.generation) || (value.generation as number) < 0
    || !isText(value.question)) fail('Références de job/opération/génération invalides.');
  assertScope(value.scope, 'job.scope');
  assertJsonValue(value, 'job reference');
}
function assertEvidenceRows(value: unknown): asserts value is BrewerEvidence[] {
  if (!Array.isArray(value) || value.length > 40) fail('turn.evidence invalide ou trop volumineuse.');
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, ['id', 'name', 'label', 'facts', 'limits', 'data', 'sources', 'products', 'model'])
      || !isText(entry.id) || !isText(entry.name) || !isText(entry.label) || ids.has(entry.id)
      || !Array.isArray(entry.facts) || entry.facts.some(fact => !isText(fact)) || !Array.isArray(entry.limits)
      || entry.limits.some(limit => !isText(limit)) || !Object.prototype.hasOwnProperty.call(entry, 'data')) {
      fail(`turn.evidence[${index}] invalide ou dupliquée.`);
    }
    ids.add(entry.id);
    if (entry.sources !== undefined && !Array.isArray(entry.sources)) fail(`turn.evidence[${index}].sources invalide.`);
    if (entry.products !== undefined && !Array.isArray(entry.products)) fail(`turn.evidence[${index}].products invalide.`);
    if (entry.model !== undefined && !isText(entry.model)) fail(`turn.evidence[${index}].model invalide.`);
    assertJsonValue(entry, `turn.evidence[${index}]`);
  });
}

function assertTurn(value: unknown): asserts value is BrewerTurn {
  const allowed = ['id', 'operationId', 'question', 'advice', 'evidence', 'createdAt', 'model', 'reviewed', 'reviewModel', 'reviewReason',
    'mode', 'contextLabel', 'proposal', 'hopAdviceProposal', 'protocol'];
  if (!isRecord(value) || !hasOnlyKeys(value, allowed) || !isText(value.id) || !isText(value.operationId) || !isText(value.question)
    || !isRecord(value.advice) || !Array.isArray(value.evidence) || !Number.isFinite(value.createdAt)
    || !isText(value.model) || typeof value.reviewed !== 'boolean' || !isText(value.contextLabel)
    || !isRecord(value.hopAdviceProposal)) fail('Snapshot du tour assisté invalide.');
  const advice = value.advice;
  const adviceKeys = ['level', 'summary', 'action', 'why', 'watch', 'question', 'evidenceIds', 'productUrls'];
  if (!isRecord(advice) || !hasOnlyKeys(advice, adviceKeys) || !['info', 'attention', 'urgent'].includes(String(advice.level))
    || ['summary', 'action', 'why'].some(key => !isText(advice[key])) || typeof advice.watch !== 'string'
    || typeof advice.question !== 'string'
    || !Array.isArray(advice.evidenceIds) || advice.evidenceIds.some(id => !isText(id))
    || advice.productUrls !== undefined && (!Array.isArray(advice.productUrls) || advice.productUrls.some(url => !isText(url)))) {
    fail('turn.advice invalide.');
  }
  if (value.reviewModel !== undefined && !isText(value.reviewModel)) fail('turn.reviewModel invalide.');
  if (value.protocol !== undefined && value.protocol !== HOP_ADVICE_PROTOCOL_V1.name) fail('turn.protocol assisté futur ou invalide.');
  if (value.reviewReason !== undefined && !['fast', 'requested', 'sensitive', 'repair', 'complexity', 'research'].includes(String(value.reviewReason))) {
    fail('turn.reviewReason invalide.');
  }
  if (value.mode !== undefined && !['fast', 'auto', 'deep'].includes(String(value.mode))) fail('turn.mode invalide.');
  if (value.proposal !== undefined && !isRecord(value.proposal)) fail('turn.proposal invalide.');
  assertEvidenceRows(value.evidence);
  assertJsonValue(value, 'turn');
}

function assertReadyResult(value: unknown, envelope: BrewerHopAdviceProposalEnvelope,
  historicalSourceReadingReference: string): asserts value is Extract<PrepareHopV55AssistedAdviceResult, { status: 'ready' }> {
  const readyKeys = ['status', 'envelope', 'contextCheck', 'readerDraft', 'assistedDraft', 'changedFromReader', 'annotations', 'conflicts',
    'scopeDrafts', 'openQuestions', 'materials', 'answer', 'evidenceRecords', 'coldContactEvidence', 'v4Suggestions', 'notes'];
  if (!isRecord(value) || !exactKeys(value, readyKeys) || value.status !== 'ready' || !same(value.envelope, envelope)
    || typeof value.changedFromReader !== 'boolean'
    || !['annotations', 'conflicts', 'scopeDrafts', 'openQuestions', 'materials', 'evidenceRecords', 'coldContactEvidence', 'v4Suggestions', 'notes']
      .every(key => Array.isArray(value[key])) || !isRecord(value.answer)
    || value.readerDraft !== null && !isRecord(value.readerDraft) || value.assistedDraft !== null && !isRecord(value.assistedDraft)) {
    fail('Résultat prêt du client absent, altéré ou détaché de l’enveloppe historique.');
  }
  assertReception(value.contextCheck, historicalSourceReadingReference);
  assertJsonValue(value, 'clientResult.ready');
}

function assertPersistableClientResult(value: unknown, envelope: BrewerHopAdviceProposalEnvelope,
  historicalSourceReadingReference: string): asserts value is HopV55AssistedPersistableClientResultV1 {
  if (isRecord(value) && value.status === 'ready') {
    assertReadyResult(value, envelope, historicalSourceReadingReference);
    return;
  }
  if (isRecord(value) && value.status === 'stale' && exactKeys(value, ['status', 'reason']) && isText(value.reason)) {
    assertJsonValue(value, 'clientResult.stale');
    return;
  }
  fail('Seuls un résultat prêt vérifié ou un retour périmé archivable sont conservés; un retour invalide n’est pas une proposition.');
}

function recordReferenceFields(record: Omit<HopV55AssistedAdviceRecordV1, 'references' | 'reference'>) {
  return {
    requestReference: contentReference('hop-v55-assisted-request-v1', record.request),
    contextLaunchReference: contentReference('hop-v55-assisted-context-launch-v1', record.request.contextLaunch),
    contextProjectionReference: contentReference('hop-v55-assisted-context-projection-v1', record.request.contextLaunch.expected),
    envelopeReference: contentReference('hop-v55-assisted-proposal-envelope-v1', record.envelope),
    serverBindingReference: contentReference('hop-v55-assisted-server-binding-v1', record.envelope.serverContext.binding),
    jobReference: contentReference('hop-v55-assisted-job-snapshot-v1', record.job),
    turnReference: contentReference('hop-v55-assisted-turn-snapshot-v1', record.turn),
    turnEvidenceReference: contentReference('hop-v55-assisted-turn-evidence-v1', record.turn.evidence),
    receptionPayloadReference: contentReference('hop-v55-assisted-reception-payload-v1', record.payload),
  };
}

function recordHasFutureNestedFormat(value: unknown, contract: HopV55AssistedAdviceBackendContractV1): boolean {
  if (!isRecord(value) || !isRecord(value.request) || !isRecord(value.request.contextLaunch)
    || !isRecord(value.request.contextLaunch.expected) || !isRecord(value.envelope)
    || !isRecord(value.envelope.serverContext) || !isRecord(value.envelope.serverContext.binding)) return false;
  const formats: Array<[unknown, string, string]> = [
    [value.request.format, 'brewer-hop-advice-request-', contract.requestFormat],
    [value.request.contextLaunch.format, 'brewer-hop-advice-context-launch-', contract.contextLaunchFormat],
    [value.request.contextLaunch.expected.format, 'brewer-hop-advice-context-projection-', contract.contextProjectionFormat],
    [value.envelope.format, 'brewer-hop-advice-proposal-', contract.proposalFormat],
    [value.envelope.serverContext.binding.format, 'brewer-hop-advice-context-projection-', contract.contextProjectionFormat],
  ];
  return formats.some(([raw, prefix, expected]) => typeof raw === 'string' && raw.startsWith(prefix) && raw !== expected)
    || isRecord(value.turn) && typeof value.turn.protocol === 'string'
      && value.turn.protocol !== HOP_ADVICE_PROTOCOL_V1.name;
}

function hasValidRecordSeal(value: unknown): boolean {
  if (!isRecord(value) || value.format !== HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT || !isText(value.reference)) return false;
  try {
    assertJsonValue(value, 'receipt');
    const { reference, ...body } = value;
    return contentReference(HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT, body) === reference;
  } catch { return false; }
}

function requireAppTicket(value: unknown, contract: HopV55AssistedAdviceBackendContractV1): HopV55AssistedAdviceTicketV1 {
  const read = contract.readTicket(value);
  if (read.status === 'unsupportedReadOnly') throw new HopV55AssistedAdviceArchiveError('unsupportedFormat', read.reason);
  if (read.status !== 'readOnly') throw new HopV55AssistedAdviceArchiveError('invalidInput', read.reason);
  return read.ticket;
}

function assertTicketLink(ticket: HopV55AssistedAdviceTicketV1, contract: HopV55AssistedAdviceBackendContractV1): void {
  if (!isText(ticket.id) || !isText(ticket.ownerKey) || !isText(ticket.workspaceId) || !isText(ticket.operationId)
    || !isText(ticket.sourceReadingReference) || ticket.archiveReference !== ticket.sourceReadingReference || !isText(ticket.reference)) {
    fail('Reader App a rendu un ticket sans identité exacte.');
  }
  if (ticket.request.format !== contract.requestFormat || ticket.request.sourceReadingReference !== ticket.sourceReadingReference
    || ticket.request.contextLaunch.format !== contract.contextLaunchFormat
    || ticket.request.contextLaunch.expected.format !== contract.contextProjectionFormat
    || ticket.contextProjection.format !== contract.contextProjectionFormat
    || ticket.request.contextLaunch.ownerKey !== ticket.ownerKey || ticket.request.contextLaunch.workspaceId !== ticket.workspaceId
    || ticket.request.contextLaunch.sourceReadingReference !== ticket.sourceReadingReference
    || !same(ticket.source, ticket.request.contextLaunch.source)
    || ticket.sourceRuntimeReference !== ticket.request.contextLaunch.sourceRuntimeReference
    || !same(ticket.scope, ticket.request.contextLaunch.scope)
    || !same(ticket.contextProjection, ticket.request.contextLaunch.expected)) {
    fail('Le ticket App et la demande portent des captures de lancement différentes.');
  }
  if (ticket.adviceBase !== undefined) {
    const base = ticket.adviceBase;
    if (!isRecord(base) || !isText(base.recordReference) || base.answerReference !== undefined && !isText(base.answerReference)
      || base.ledgerReference !== undefined && !isText(base.ledgerReference)) fail('Références de la base V3/V4 du ticket invalides.');
  }
}

function assertRecord(value: unknown, ticket: HopV55AssistedAdviceTicketV1,
  contract: HopV55AssistedAdviceBackendContractV1): asserts value is HopV55AssistedAdviceRecordV1 {
  assertTicketLink(ticket, contract);
  const allowed = ['format', 'id', 'ownerKey', 'workspaceId', 'operationId', 'ticketId', 'ticketReference',
    'sourceReadingReference', 'sourceRecordReference', 'ledgerReference', 'request', 'job', 'turn', 'envelope',
    'payload', 'references', 'reference'];
  if (!isRecord(value) || !exactKeys(value, allowed) || value.format !== HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT
    || !isText(value.id) || value.ownerKey !== ticket.ownerKey || value.workspaceId !== ticket.workspaceId
    || value.operationId !== ticket.operationId || value.ticketId !== ticket.id || value.ticketReference !== ticket.reference
    || value.sourceReadingReference !== ticket.sourceReadingReference || !isNullableText(value.sourceRecordReference)
    || !isNullableText(value.ledgerReference) || !isText(value.reference) || !isRecord(value.references)) {
    fail('Réponse assistée détachée du ticket, de l’owner, du workspace ou de la lecture.');
  }
  if (!isRecord(value.request) || !same(value.request, ticket.request)
    || value.request.sourceReadingReference !== ticket.sourceReadingReference) fail('Le record a déplacé la requête ou sa lecture source du ticket.');
  assertJobReference(value.job);
  assertTurn(value.turn);
  if (value.job.operationId !== ticket.operationId || value.job.question !== ticket.request.question
    || !same(value.job.scope, ticket.request.contextLaunch.scope) || value.turn.operationId !== ticket.operationId
    || value.turn.question !== ticket.request.question) fail('Les références de job, opération, scope ou tour sont croisées.');
  if (!isRecord(value.payload) || !exactKeys(value.payload, ['ticketReference', 'operationId', 'turnId', 'receivedAt', 'clientResult',
    'turnEvidence', 'contextCheckAtReception']) || value.payload.ticketReference !== ticket.reference
    || value.payload.operationId !== ticket.operationId || value.payload.turnId !== value.turn.id
    || !isText(value.payload.receivedAt)) fail('Payload de réception App différent du ticket ou du tour.');
  assertInstant(value.payload.receivedAt, 'payload.receivedAt');
  if (!same(value.payload.turnEvidence, value.turn.evidence)) fail('Les preuves du payload de réception ne sont pas celles du tour complet.');
  contract.assertProposalEnvelope(value.envelope);
  if (!same(value.turn.hopAdviceProposal, value.envelope) || !same(value.envelope.request, value.request)
    || value.envelope.status !== 'proposal' || value.envelope.format !== contract.proposalFormat) {
    fail('L’enveloppe archivée diffère de celle du tour ou du request exact.');
  }
  contract.verifyTurnEvidence(value.envelope, value.turn.evidence);
  assertReception(value.payload.contextCheckAtReception, ticket.sourceReadingReference);
  assertPersistableClientResult(value.payload.clientResult, value.envelope, ticket.sourceReadingReference);
  const sourceRecordReference = ticket.adviceBase?.recordReference ?? null;
  const ledgerReference = ticket.adviceBase?.ledgerReference ?? null;
  if (value.sourceRecordReference !== sourceRecordReference || value.ledgerReference !== ledgerReference) {
    fail('Les références de base V3/V4 du receipt diffèrent du ticket figé.');
  }
  const expectedReferences = recordReferenceFields(value as unknown as Omit<HopV55AssistedAdviceRecordV1, 'references' | 'reference'>);
  if (!exactKeys(value.references, Object.keys(expectedReferences)) || !same(value.references, expectedReferences)) {
    fail('Références internes du receipt différentes des payloads conservés.');
  }
  assertJsonValue(value, 'receipt');
  const { reference: _reference, ...body } = value;
  if (contentReference(HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT, body) !== value.reference) fail('Sceau du receipt assisté invalide.');
}

/** Runtime seals the App-owned ticket reference with the exact raw payload, job and turn. */
export function createHopV55AssistedAdviceRecordV1(input: {
  id: string;
  ticket: unknown;
  job: HopV55AssistedJobReferenceV1;
  turn: BrewerTurn;
  payload: HopV55AssistedAdviceReceptionPayloadV1;
}, contract: HopV55AssistedAdviceBackendContractV1): HopV55AssistedAdviceRecordV1 {
  const ticket = requireAppTicket(input.ticket, contract);
  if (!isText(input.id)) fail('Identifiant du receipt requis.');
  assertTicketLink(ticket, contract);
  assertJobReference(input.job);
  assertTurn(input.turn);
  if (input.turn.protocol !== HOP_ADVICE_PROTOCOL_V1.name) fail('Un nouveau receipt exige le marqueur de tour hopAdvice v1 validé par le runtime.');
  if (!isRecord(input.turn.hopAdviceProposal)) fail('Le tour ne contient pas l’enveloppe de proposition exacte.');
  const envelope = input.turn.hopAdviceProposal as BrewerHopAdviceProposalEnvelope;
  contract.assertProposalEnvelope(envelope);
  contract.verifyTurnEvidence(envelope, input.turn.evidence);
  if (input.job.operationId !== ticket.operationId || input.job.question !== ticket.request.question
    || !same(input.job.scope, ticket.request.contextLaunch.scope) || input.turn.operationId !== ticket.operationId
    || input.turn.question !== ticket.request.question) {
    fail('Job, tour, enveloppe, opération ou scope ne correspondent pas au ticket A.');
  }
  if (!isRecord(input.payload) || !exactKeys(input.payload, ['ticketReference', 'operationId', 'turnId', 'receivedAt', 'clientResult',
    'turnEvidence', 'contextCheckAtReception']) || input.payload.ticketReference !== ticket.reference
    || input.payload.operationId !== ticket.operationId || input.payload.turnId !== input.turn.id
    || !isText(input.payload.receivedAt) || !same(input.payload.turnEvidence, input.turn.evidence)) {
    fail('Payload de réception App différent du ticket, du tour ou des preuves originales.');
  }
  assertInstant(input.payload.receivedAt, 'payload.receivedAt');
  assertReception(input.payload.contextCheckAtReception, ticket.sourceReadingReference);
  assertPersistableClientResult(input.payload.clientResult, envelope, ticket.sourceReadingReference);
  const body: Omit<HopV55AssistedAdviceRecordV1, 'references' | 'reference'> = {
    format: HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT, id: input.id, ownerKey: ticket.ownerKey, workspaceId: ticket.workspaceId,
    operationId: ticket.operationId, ticketId: ticket.id, ticketReference: ticket.reference,
    sourceReadingReference: ticket.sourceReadingReference,
    sourceRecordReference: ticket.adviceBase?.recordReference ?? null,
    ledgerReference: ticket.adviceBase?.ledgerReference ?? null,
    request: clone(ticket.request), job: clone(input.job), turn: clone(input.turn), envelope: clone(envelope), payload: clone(input.payload),
  };
  const record = { ...body, references: recordReferenceFields(body), reference: '' };
  record.reference = contentReference(HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT, (({ reference: _reference, ...rest }) => rest)(record));
  assertRecord(record, ticket, contract);
  return clone(record);
}

export function readHopV55AssistedAdviceRecordV1(value: unknown, ticketValue: unknown,
  contract: HopV55AssistedAdviceBackendContractV1): HopV55AssistedRecordRead<HopV55AssistedAdviceRecordV1> {
  if (isRecord(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-assisted-advice-record-')
    && value.format !== HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur de receipt assisté conservé sans réinterprétation.' };
  }
  if (!hasValidRecordSeal(value)) return { status: 'invalid', reason: 'Sceau ou sérialisation JSON du receipt assisté invalide.' };
  if (recordHasFutureNestedFormat(value, contract)) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'DTO assisté imbriqué futur conservé sans fallback ni reconstruction.' };
  }
  let ticket: HopV55AssistedAdviceTicketV1;
  try { ticket = requireAppTicket(ticketValue, contract); }
  catch (error) {
    if (error instanceof HopV55AssistedAdviceArchiveError && error.code === 'unsupportedFormat') {
      return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Ticket de lancement futur : receipt conservé sans requalification.' };
    }
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Ticket source invalide.' };
  }
  try {
    assertRecord(value, ticket, contract);
    return { status: 'available', record: clone(value) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Receipt assisté invalide.' };
  }
}

export function readHopV55AssistedAdviceArchiveV1(input: { ticket: unknown; record: unknown },
  contract: HopV55AssistedAdviceBackendContractV1):
  | { status: 'available'; ticket: HopV55AssistedAdviceTicketV1; record: HopV55AssistedAdviceRecordV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string } {
  if (isRecord(input.record) && typeof input.record.format === 'string'
    && input.record.format.startsWith('hop-v55-assisted-advice-record-')
    && input.record.format !== HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone({ ticket: input.ticket, record: input.record }),
      reason: 'Format futur de receipt assisté conservé sans interprétation.' };
  }
  if (!hasValidRecordSeal(input.record)) return { status: 'invalid', reason: 'Sceau ou sérialisation JSON du receipt assisté invalide.' };
  if (recordHasFutureNestedFormat(input.record, contract)) {
    return { status: 'unsupportedReadOnly', snapshot: clone({ ticket: input.ticket, record: input.record }),
      reason: 'DTO assisté imbriqué futur conservé sans fallback ni reconstruction.' };
  }
  let ticket: HopV55AssistedAdviceTicketV1;
  try { ticket = requireAppTicket(input.ticket, contract); }
  catch (error) {
    if (error instanceof HopV55AssistedAdviceArchiveError && error.code === 'unsupportedFormat') {
      return { status: 'unsupportedReadOnly', snapshot: clone({ ticket: input.ticket, record: input.record }), reason: 'Ticket futur : archive complète conservée en lecture seule.' };
    }
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Ticket source invalide.' };
  }
  const recordRead = readHopV55AssistedAdviceRecordV1(input.record, ticket, contract);
  if (recordRead.status !== 'available') return recordRead;
  return { status: 'available', ticket, record: recordRead.record };
}
export interface HopV55AssistedAppendResult<T> {
  status: 'appended' | 'duplicate';
  records: T[];
}

function assertOpaqueScope(value: unknown, ownerKey: string, workspaceId: string, label: string): void {
  if (!isRecord(value)) fail(`${label} future illisible.`);
  if (value.ownerKey !== undefined && value.ownerKey !== ownerKey || value.workspaceId !== undefined && value.workspaceId !== workspaceId) {
    fail(`${label} future appartient à un autre owner ou workspace.`);
  }
}

function findAppTicket(ticketHistory: readonly unknown[], reference: string, operationId: string, ownerKey: string, workspaceId: string,
  contract: HopV55AssistedAdviceBackendContractV1): HopV55AssistedAdviceTicketV1 {
  let match: HopV55AssistedAdviceTicketV1 | undefined;
  for (const raw of ticketHistory) {
    const read = contract.readTicket(raw);
    if (read.status === 'unsupportedReadOnly') {
      assertOpaqueScope(read.snapshot, ownerKey, workspaceId, 'Ticket');
      if (isRecord(read.snapshot) && (read.snapshot.reference === reference || read.snapshot.operationId === operationId)) {
        throw new HopV55AssistedAdviceArchiveError('unsupportedFormat', 'Un ticket futur utilise cette référence ou cet operationId; aucun receipt courant ne le reprend.');
      }
      continue;
    }
    if (read.status === 'invalid') throw new HopV55AssistedAdviceArchiveError('invalidInput', `Ticket historique invalide : ${read.reason}`);
    if (read.ticket.ownerKey !== ownerKey || read.ticket.workspaceId !== workspaceId) {
      throw new HopV55AssistedAdviceArchiveError('invalidInput', 'Ticket historique étranger au workspace.');
    }
    if (read.ticket.operationId === operationId && read.ticket.reference !== reference) {
      throw new HopV55AssistedAdviceArchiveError('conflict', 'Cet operationId a déjà un autre ticket App scellé.');
    }
    if (read.ticket.reference === reference) {
      if (read.ticket.operationId !== operationId) {
        throw new HopV55AssistedAdviceArchiveError('invalidInput', 'Le ticket exact cite un autre operationId.');
      }
      if (match && !same(match, read.ticket)) throw new HopV55AssistedAdviceArchiveError('conflict', 'Référence ticket dupliquée avec un contenu différent.');
      match = read.ticket;
    }
  }
  if (match) return match;
  throw new HopV55AssistedAdviceArchiveError('invalidInput', 'Le ticket App doit être persisté par CAS avant le receipt du tour.');
}

export function appendHopV55AssistedAdviceRecordV1(history: readonly unknown[], candidate: unknown,
  ticketHistory: readonly unknown[], contract: HopV55AssistedAdviceBackendContractV1): HopV55AssistedAppendResult<unknown> {
  if (!isRecord(candidate) || !isText(candidate.ticketReference) || !isText(candidate.operationId)
    || !isText(candidate.ownerKey) || !isText(candidate.workspaceId)) {
    throw new HopV55AssistedAdviceArchiveError('invalidInput', 'Receipt sans référence de ticket ou de workspace.');
  }
  if (typeof candidate.format === 'string' && candidate.format.startsWith('hop-v55-assisted-advice-record-')
    && candidate.format !== HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT) {
    throw new HopV55AssistedAdviceArchiveError('unsupportedFormat', 'Un writer courant ne peut pas ajouter un format futur comme record connu.');
  }
  const ticket = findAppTicket(ticketHistory, candidate.ticketReference, candidate.operationId, candidate.ownerKey, candidate.workspaceId, contract);
  const candidateRead = readHopV55AssistedAdviceRecordV1(candidate, ticket, contract);
  if (candidateRead.status === 'unsupportedReadOnly') throw new HopV55AssistedAdviceArchiveError('unsupportedFormat', candidateRead.reason);
  if (candidateRead.status !== 'available') throw new HopV55AssistedAdviceArchiveError('invalidInput', candidateRead.reason);
  const next: unknown[] = history.map(clone);
  for (const raw of history) {
    const rawRow = isRecord(raw) ? raw : {};
    if (typeof rawRow.format === 'string' && rawRow.format.startsWith('hop-v55-assisted-advice-record-')
      && rawRow.format !== HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT) {
      assertOpaqueScope(raw, candidateRead.record.ownerKey, candidateRead.record.workspaceId, 'Receipt');
      if (rawRow.sourceReadingReference === candidateRead.record.sourceReadingReference
        || rawRow.operationId === candidateRead.record.operationId || rawRow.ticketReference === candidateRead.record.ticketReference) {
        throw new HopV55AssistedAdviceArchiveError('unsupportedFormat', 'Un receipt futur de cette lecture/commande reste opaque; aucun fallback courant ne le remplace.');
      }
      continue;
    }
    const existingTicketReference = isRecord(raw) ? raw.ticketReference : undefined;
    const existingOperationId = isRecord(raw) ? raw.operationId : undefined;
    if (!isText(existingTicketReference) || !isText(existingOperationId)) {
      throw new HopV55AssistedAdviceArchiveError('invalidInput', 'Receipt historique sans ticket/operationId exact.');
    }
    const existingTicket = findAppTicket(ticketHistory, existingTicketReference, existingOperationId, candidateRead.record.ownerKey,
      candidateRead.record.workspaceId, contract);
    const read = readHopV55AssistedAdviceRecordV1(raw, existingTicket, contract);
    if (read.status !== 'available') {
      throw new HopV55AssistedAdviceArchiveError(read.status === 'unsupportedReadOnly' ? 'unsupportedFormat' : 'invalidInput', read.reason);
    }
    const previous = read.record;
    if (previous.ownerKey !== candidateRead.record.ownerKey || previous.workspaceId !== candidateRead.record.workspaceId) {
      throw new HopV55AssistedAdviceArchiveError('invalidInput', 'Historique de receipts étranger au workspace demandé.');
    }
    if (previous.id === candidateRead.record.id || previous.operationId === candidateRead.record.operationId
      || previous.ticketReference === candidateRead.record.ticketReference || previous.turn.id === candidateRead.record.turn.id) {
      if (previous.reference === candidateRead.record.reference && same(previous, candidateRead.record)) return { status: 'duplicate', records: next };
      throw new HopV55AssistedAdviceArchiveError('conflict', 'Retry operationId/tour/ticket déjà archivé avec un contenu différent.');
    }
  }
  next.push(clone(candidateRead.record));
  return { status: 'appended', records: next };
}

export type HopV55AssistedAdviceOperationRead =
  | { status: 'available'; record: HopV55AssistedAdviceRecordV1 }
  | { status: 'absent' }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

/** Reload/retry lookup. A future or duplicate row for this operation blocks fallback to an older record. */
export function readHopV55AssistedAdviceRecordByOperationId(input: {
  records: readonly unknown[];
  tickets: readonly unknown[];
  ownerKey: string;
  workspaceId: string;
  operationId: string;
}, contract: HopV55AssistedAdviceBackendContractV1): HopV55AssistedAdviceOperationRead {
  if (!isText(input.ownerKey) || !isText(input.workspaceId) || !isText(input.operationId)) {
    return { status: 'invalid', reason: 'Owner/workspace/operationId requis pour relire un receipt assisté.' };
  }
  const matches: HopV55AssistedAdviceRecordV1[] = [];
  for (const raw of input.records) {
    if (isRecord(raw) && typeof raw.format === 'string' && raw.format.startsWith('hop-v55-assisted-advice-record-')
      && raw.format !== HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT) {
      if (raw.operationId === input.operationId) {
        try { assertOpaqueScope(raw, input.ownerKey, input.workspaceId, 'Receipt'); }
        catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Receipt futur étranger.' }; }
        return { status: 'unsupportedReadOnly', snapshot: clone(raw), reason: 'Ce operationId est détenu par un format futur; aucun receipt antérieur ne le remplace.' };
      }
      continue;
    }
    if (!isRecord(raw) || raw.operationId !== input.operationId) continue;
    if (raw.ownerKey !== input.ownerKey || raw.workspaceId !== input.workspaceId) {
      return { status: 'invalid', reason: 'Le operationId correspond à un receipt d’un autre owner/workspace.' };
    }
    if (!isText(raw.ticketReference)) return { status: 'invalid', reason: 'Receipt sans référence au ticket source exact.' };
    let ticket: HopV55AssistedAdviceTicketV1;
    try { ticket = findAppTicket(input.tickets, raw.ticketReference, input.operationId, input.ownerKey, input.workspaceId, contract); }
    catch (error) {
      if (error instanceof HopV55AssistedAdviceArchiveError && error.code === 'unsupportedFormat') {
        return { status: 'unsupportedReadOnly', snapshot: clone(raw), reason: error.message };
      }
      return { status: 'invalid', reason: error instanceof Error ? error.message : 'Ticket source illisible.' };
    }
    const read = readHopV55AssistedAdviceRecordV1(raw, ticket, contract);
    if (read.status === 'unsupportedReadOnly') return read;
    if (read.status !== 'available') return read;
    matches.push(read.record);
  }
  if (!matches.length) return { status: 'absent' };
  if (matches.length !== 1) return { status: 'invalid', reason: 'Plusieurs receipts partagent le même operationId.' };
  return { status: 'available', record: matches[0] };
}

export interface HopV55AssistedWorkspaceSeamV1 {
  id: string;
  ownerKey: string;
  assistedAdviceRecords?: unknown[];
}

/** Pure seam: App's ticket array is read-only here; caller persists the returned record array with Workspace CAS. */
export function appendHopV55AssistedAdviceRecordToWorkspace<T extends HopV55AssistedWorkspaceSeamV1>(workspace: T,
  receipt: unknown, ticketHistory: readonly unknown[], contract: HopV55AssistedAdviceBackendContractV1):
  { status: 'appended' | 'duplicate'; workspace: T } {
  const appended = appendHopV55AssistedAdviceRecordV1(workspace.assistedAdviceRecords ?? [], receipt, ticketHistory, contract);
  return { status: appended.status, workspace: { ...clone(workspace), assistedAdviceRecords: appended.records } as T };
}

/** Pure append-only seam; App owns the ticket array and Workspace owner adds actual CAS/persistence. */
export function assertHopV55AssistedAdviceAppendOnly(previous: HopV55AssistedWorkspaceSeamV1,
  next: HopV55AssistedWorkspaceSeamV1, ticketHistory: readonly unknown[], contract: HopV55AssistedAdviceBackendContractV1): void {
  if (previous.id !== next.id || previous.ownerKey !== next.ownerKey) fail('Owner/workspace du raccord assisté immuable.');
  const oldRecords = previous.assistedAdviceRecords ?? [];
  const newRecords = next.assistedAdviceRecords ?? [];
  if (newRecords.length < oldRecords.length || oldRecords.some((row, index) => !same(row, newRecords[index]))) {
    fail('Les receipts assistés sont immuables et append-only.');
  }
  let prefix = [...oldRecords];
  for (const row of newRecords.slice(oldRecords.length)) {
    const result = appendHopV55AssistedAdviceRecordV1(prefix, row, ticketHistory, contract);
    if (result.status !== 'appended') fail('Un receipt est déjà présent ou une reprise a changé son contenu.');
    prefix = result.records;
  }
}
