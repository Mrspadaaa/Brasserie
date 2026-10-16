/**
 * Local semantic-assisted archive V2. This is a new closed codec: RequestV2/ticketV1/recordV1
 * keep their own readers and bytes. The codec stores the exact bounded V3 wire beside the full
 * source4 archive, and records only a verified V6 public turn plus its complete tool evidence.
 * It is pure; the Application owner persists its outputs through the existing workspace CAS.
 *
 * Ticket V3 is the same closed capture plus the brewer's explicit local candidate policy. The policy is
 * sealed in the ticket before submit and never enters Request3 or the wire. Ticket V2 keeps its exact
 * bytes and reader: it stays readable for history, but it carries no policy and is never adoptable.
 */
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopPropertyAdviceCandidatePolicy } from '../../domain/hopDecision/propertyAdviceSchema';
import type { BrewerAdvice, BrewerEvidence } from '../../../functions/src/companionTypes';
import {
  HOP_ADVICE_PROTOCOL_V1,
  type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn,
  type HopAdviceV1Scope,
  type HopAdviceV1WireInputV3,
  type HopAdviceV1WizardWireInputV1,
} from '../../../functions/src/brewerHopAdviceTransportV1';
import {
  assertBrewerHopAdviceProposalV5MatchesSource,
  assertBrewerHopAdviceRequestV3,
  assertBrewerHopAdviceSourceViewMatchesArchiveV1,
  brewerHopAdviceRequestV3Reference,
  brewerHopAdviceSourceViewReferenceV1,
  measureBrewerHopAdviceSemanticJsonWire,
  readBrewerHopAdviceProposalEnvelopeV5,
  readBrewerHopAdviceRequestV3,
  verifyBrewerHopAdviceSemanticEvidenceV5,
  type BrewerHopAdviceProposalEnvelopeV5,
  type BrewerHopAdviceRequestV3,
  assertBrewerHopAdviceRequestV3ForWizardV1,
  assertBrewerHopAdviceSourceViewMatchesArchiveV1ForWizardV1,
  brewerHopAdviceRequestV3ReferenceForWizardV1,
  brewerHopAdviceSourceViewReferenceV1ForWizardV1,
  measureBrewerHopAdviceSemanticJsonWire as measureSemanticJsonForWizard,
  readBrewerHopAdviceRequestV3ForWizardV1,
  type BrewerHopAdviceWizardRequestV3,
} from '../../../functions/src/brewerHopAdviceSemanticV3';
import { readBrewerHopAdviceSourceViewMetadataV1ForWizardV1 } from '../../../functions/src/brewerHopAdviceSourceViewMetadataV1';
import { brewerHopAdviceEffectiveDraftReferenceForWizardV1 } from '../../../functions/src/brewerHopAdviceContextBinding';
import {
  assertBrewerHopAdviceProposalV6MatchesSource,
  brewerHopAdviceProposalEnvelopeV6Reference,
  readBrewerHopAdviceProposalEnvelopeV6,
  verifyBrewerHopAdviceSemanticEvidenceV6,
  type BrewerHopAdviceProposalEnvelopeV6,
} from '../../../functions/src/brewerHopAdviceSemanticV6';
import {
  buildHopV55AssistedSemanticAdviceRequestV3,
  measureHopAdviceV1SemanticWireV3,
} from './assistedSemanticAdviceRequestV3';
import {
  readHopV55DecisionReadingArchive,
  readHopV55DecisionReadingArchiveV4MetadataV1,
  type HopV55DecisionReadingArchiveV4,
  type HopV55DecisionReadingArchiveV4MetadataV1,
} from './brewerHopAdviceSemanticSource4';
import { readHopV55AssistedAdviceTicketV1, type HopV55AssistedAdviceTicketV1 } from './assistedAdviceController';
import { readHopV55AssistedAdviceRecordV1 } from './assistedAdviceArchive';
import { createHopV55AssistedAdviceBackendContractV1 } from './assistedAdviceWorkspace';
import type { HopV55SemanticAdoptionPrincipalV1 } from './assistedSemanticAdviceAdoptionV6';
import {
  readHopV55DecisionReadingArchiveForWizardV1,
  type HopV55WizardDecisionReadingArchiveV4,
} from './decisionArchive';
import {
  assertBrewerHopAdviceWizardSourceMatchesSnapshotV1,
  mapBrewerHopAdviceWizardSourceToScopeV1,
} from '../../../functions/src/brewerHopAdviceWizardSourceV1';
import {
  assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1,
  readBrewerHopAdviceProposalEnvelopeV6ForWizardV1,
  verifyBrewerHopAdviceSemanticEvidenceV6ForWizardV1,
  type BrewerHopAdviceWizardProposalEnvelopeV6,
} from '../../../functions/src/brewerHopAdviceSemanticV6';

export const HOP_V55_ASSISTED_ADVICE_TICKET_V2_FORMAT = 'hop-v55-assisted-advice-ticket-v2' as const;
export const HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT = 'hop-v55-assisted-advice-ticket-v3' as const;
export const HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT = 'hop-v55-assisted-advice-record-v2' as const;
export const HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT = 'hop-v55-assisted-advice-ticket-v4-wizard-v1' as const;
export const HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT = 'hop-v55-assisted-advice-record-v3-wizard-v1' as const;
const TICKET_PREFIX = 'hop-v55-assisted-advice-ticket-';
const RECORD_PREFIX = 'hop-v55-assisted-advice-record-';

export interface HopV55AssistedAdviceSourceReferencesV2 {
  sourceReadingReference: string;
  sourceArchiveReference: string;
  requestReference: string;
  wireReference: string;
  sourceViewReference: string;
  contextLaunchReference: string;
  contextProjectionReference: string;
  sourceMetadataReference: string;
}

/** Immutable local capture made by the host before the network submit. */
export interface HopV55AssistedAdviceTicketV2 {
  format: typeof HOP_V55_ASSISTED_ADVICE_TICKET_V2_FORMAT;
  id: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ownerKey: string;
  workspaceId: string;
  operationId: string;
  generation: number;
  createdAt: string;
  scope: HopAdviceV1Scope;
  /** Raw user question, preserved exactly as it was sent. */
  question: string;
  request: BrewerHopAdviceRequestV3;
  wire: HopAdviceV1WireInputV3;
  /** Complete immutable archive4; sourceView is not used to reconstruct this body. */
  sourceArchive: HopV55DecisionReadingArchiveV4;
  references: HopV55AssistedAdviceSourceReferencesV2;
  reference: string;
}

/** Ticket V2 plus the explicit local candidate policy chosen before submit; Request3 and wire are unchanged. */
export interface HopV55AssistedAdviceTicketV3 extends Omit<HopV55AssistedAdviceTicketV2, 'format'> {
  format: typeof HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT;
  candidatePolicy: HopPropertyAdviceCandidatePolicy;
}

/** Tickets of this codec: V2 (history, no local policy, never adoptable) and V3 (sealed policy). */
export type HopV55AssistedAdviceSemanticTicket = HopV55AssistedAdviceTicketV2 | HopV55AssistedAdviceTicketV3;
type SemanticTicketBody = Omit<HopV55AssistedAdviceTicketV2, 'reference'> | Omit<HopV55AssistedAdviceTicketV3, 'reference'>;

/** Explicit modern Wizard ticket. Its source archive, Request3 and exact wire are never cast into the classic profile. */
export interface HopV55AssistedAdviceWizardTicketV1 {
  format: typeof HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT;
  id: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ownerKey: string;
  workspaceId: string;
  operationId: string;
  generation: number;
  createdAt: string;
  scope: HopAdviceV1Scope;
  question: string;
  request: BrewerHopAdviceWizardRequestV3;
  wire: HopAdviceV1WizardWireInputV1;
  sourceArchive: HopV55WizardDecisionReadingArchiveV4;
  candidatePolicy: HopPropertyAdviceCandidatePolicy;
  references: HopV55AssistedAdviceSourceReferencesV2;
  reference: string;
}

export type HopV55AssistedAdviceWizardTicketV1Read =
  | { status: 'readOnly'; ticket: HopV55AssistedAdviceWizardTicketV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type CreateHopV55AssistedAdviceWizardTicketV1Result =
  | { status: 'ready'; ticket: HopV55AssistedAdviceWizardTicketV1;
      requestBytes: { utf8Bytes: number; maxDepth: number }; wireBytes: { utf8Bytes: number; maxDepth: number } }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid' | 'tooLarge'; reason?: string;
      requestBytes?: { utf8Bytes: number; maxDepth: number }; wireBytes?: { utf8Bytes: number; maxDepth: number };
      maxBytes?: 100000; maxDepth?: 18; snapshot?: unknown };

export type HopV55AssistedAdviceTicketV2Read =
  | { status: 'readOnly'; ticket: HopV55AssistedAdviceSemanticTicket }
  | { status: 'legacyReadOnly'; format: string; snapshot: unknown; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type CreateHopV55AssistedAdviceTicketV2Result =
  | { status: 'ready'; ticket: HopV55AssistedAdviceTicketV2; requestBytes: { utf8Bytes: number; maxDepth: number }; wireBytes: { utf8Bytes: number; maxDepth: number } }
  | { status: 'tooLarge'; requestBytes?: { utf8Bytes: number; maxDepth: number }; wireBytes?: { utf8Bytes: number; maxDepth: number };
      maxBytes: 100000; maxDepth: 18; snapshot: unknown }
  | { status: 'legacyReadOnly'; format: string; snapshot: unknown; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type CreateHopV55AssistedAdviceTicketV3Result =
  | { status: 'ready'; ticket: HopV55AssistedAdviceTicketV3; requestBytes: { utf8Bytes: number; maxDepth: number }; wireBytes: { utf8Bytes: number; maxDepth: number } }
  | Exclude<CreateHopV55AssistedAdviceTicketV2Result, { status: 'ready' }>;

export type HopV55AssistedAdviceSemanticTurnV2 =Omit<HopAdviceV1PublicTurn, 'hopAdviceProposal'> & {
  hopAdviceProposal: BrewerHopAdviceProposalEnvelopeV6;
};

export type HopV55AssistedAdviceSemanticDispositionV2 =
  | { kind: 'verifiedV6'; format: BrewerHopAdviceProposalEnvelopeV6['format'] }
  | { kind: 'opaqueReadOnly'; status: 'legacyReadOnly' | 'unsupportedReadOnly' | 'missingReadOnly'; format?: string; reason: string };

export type HopV55AssistedAdviceWizardSemanticTurnV1 = Omit<HopAdviceV1PublicTurn, 'hopAdviceProposal'> & {
  hopAdviceProposal: BrewerHopAdviceWizardProposalEnvelopeV6;
};

export interface HopV55AssistedAdviceWizardRecordV1 {
  format: typeof HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT;
  id: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ownerKey: string;
  workspaceId: string;
  operationId: string;
  generation: number;
  ticketId: string;
  ticketReference: string;
  recordedAt: string;
  job: HopAdviceV1PublicJob;
  turn: HopAdviceV1PublicTurn;
  semantic: HopV55AssistedAdviceSemanticDispositionV2;
  fullEvidence: BrewerEvidence[];
  references: HopV55AssistedAdviceRecordReferencesV2;
  reference: string;
}

export type HopV55AssistedAdviceWizardRecordV1Read =
  | { status: 'readOnly'; record: HopV55AssistedAdviceWizardRecordV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type HopV55AssistedAdviceWizardArchiveV1Read =
  | { status: 'readOnly'; ticket: HopV55AssistedAdviceWizardTicketV1; record: HopV55AssistedAdviceWizardRecordV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export interface HopV55AssistedAdviceRecordReferencesV2 extends HopV55AssistedAdviceSourceReferencesV2 {
  ticketReference: string;
  principalReference: string;
  proposalSlotReference: string;
  serverBindingReference: string;
  jobReference: string;
  turnReference: string;
  turnEvidenceReference: string;
}

interface HopV55AssistedAdviceRecordV2Base {
  format: typeof HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT;
  id: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ownerKey: string;
  workspaceId: string;
  operationId: string;
  generation: number;
  ticketId: string;
  ticketReference: string;
  recordedAt: string;
  job: HopAdviceV1PublicJob;
  turn: HopAdviceV1PublicTurn;
  semantic: HopV55AssistedAdviceSemanticDispositionV2;
  /** Full raw public turn evidence, also required to equal turn.evidence exactly. */
  fullEvidence: BrewerEvidence[];
  references: HopV55AssistedAdviceRecordReferencesV2;
  reference: string;
}

/** A verified V6 turn or the exact incompatible public turn kept opaque; no V6 is synthesized. */
export type HopV55AssistedAdviceRecordV2 =
  | (HopV55AssistedAdviceRecordV2Base & { semantic: { kind: 'verifiedV6'; format: BrewerHopAdviceProposalEnvelopeV6['format'] };
      turn: HopV55AssistedAdviceSemanticTurnV2 })
  | (HopV55AssistedAdviceRecordV2Base & { semantic: Extract<HopV55AssistedAdviceSemanticDispositionV2, { kind: 'opaqueReadOnly' }> });

export type HopV55AssistedAdviceRecordV2Read =
  | { status: 'readOnly'; record: HopV55AssistedAdviceRecordV2 }
  | { status: 'legacyReadOnly'; format: string; snapshot: unknown; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type HopV55AssistedAdviceSemanticEnvelopeV2Read =
  | { status: 'readOnly'; envelope: BrewerHopAdviceProposalEnvelopeV6 }
  | { status: 'legacyReadOnly'; format: string; snapshot: unknown; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type HopV55AssistedAdviceArchiveV2Read =
  | { status: 'readOnly'; ticket: HopV55AssistedAdviceSemanticTicket; record: HopV55AssistedAdviceRecordV2 }
  | { status: 'legacyReadOnly'; snapshot: unknown; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export class HopV55AssistedAdviceArchiveV2Error extends Error {
  constructor(readonly code: 'invalidInput' | 'conflict' | 'unsupportedFormat' | 'tooLarge' | 'ticketNotPersisted', message: string) {
    super(message);
    this.name = 'HopV55AssistedAdviceArchiveV2Error';
  }
}

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype;
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const clone = <T>(value: T): T => structuredClone(value);
const exactKeys = (value: Row, keys: readonly string[]) => Object.keys(value).length === keys.length
  && Object.keys(value).every(key => keys.includes(key));
const hasOnlyKeys = (value: Row, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));

function fail(message: string, code: HopV55AssistedAdviceArchiveV2Error['code'] = 'invalidInput'): never {
  throw new HopV55AssistedAdviceArchiveV2Error(code, message);
}

function assertJsonValue(value: unknown, path = 'snapshot', ancestors = new WeakSet<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(`${path} contient un nombre non fini.`);
    return;
  }
  if (typeof value !== 'object' || value === undefined) fail(`${path} n’est pas un snapshot JSON sérialisable.`);
  if (ancestors.has(value)) fail(`${path} contient une référence cyclique.`);
  ancestors.add(value);
  if (Array.isArray(value)) value.forEach((entry, index) => assertJsonValue(entry, `${path}[${index}]`, ancestors));
  else {
    if (Object.getPrototypeOf(value) !== Object.prototype) fail(`${path} doit être un objet JSON simple.`);
    for (const [key, entry] of Object.entries(value)) assertJsonValue(entry, `${path}.${key}`, ancestors);
  }
  ancestors.delete(value);
}

function contentReference(namespace: string, value: unknown): string {
  try { return hopAdviceContentReference(namespace, value); }
  catch (error) { fail(`Référence ${namespace} impossible : ${error instanceof Error ? error.message : String(error)}`); }
}

function same(left: unknown, right: unknown, namespace = 'hop-v55-assisted-semantic-archive-v2-equality'): boolean {
  try { return contentReference(namespace, left) === contentReference(namespace, right); }
  catch { return false; }
}

function isoInstant(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    && Number.isFinite(Date.parse(value));
}

function assertScope(value: unknown, label: string): asserts value is HopAdviceV1Scope {
  if (!isRow(value) || !exactKeys(value, ['kind', 'id']) || !['recipe', 'batch', 'draft', 'app'].includes(String(value.kind))
    || !isText(value.id)) fail(`${label} invalide.`);
}

function assertPrincipal(value: unknown): asserts value is HopV55SemanticAdoptionPrincipalV1 {
  if (!isRow(value) || !exactKeys(value, ['principalId', 'ownerKey', 'workspaceId', 'scope', 'label'])
    || !isText(value.principalId) || !isText(value.ownerKey) || !isText(value.workspaceId) || typeof value.label !== 'string') {
    fail('Principal hôte absent ou invalide.');
  }
  assertScope(value.scope, 'principal.scope');
}

/**
 * Exact local choice of the brewer (same closed shape as the V1 ticket policy). It is never derived from
 * the question, the archive, the catalogue or a default; a discovery always names its perimeter.
 */
function assertCandidatePolicy(value: unknown): asserts value is HopPropertyAdviceCandidatePolicy {
  if (!isRow(value) || !exactKeys(value, ['kind', 'materialIds', 'basis']) || !['explicit', 'discover'].includes(String(value.kind))
    || !Array.isArray(value.materialIds) || value.materialIds.some(id => !isText(id))
    || new Set(value.materialIds).size !== value.materialIds.length || !isText(value.basis)) {
    fail('Politique de candidats locale absente ou inexacte; elle doit être choisie explicitement avant l’envoi.');
  }
  if (value.kind === 'discover' && value.materialIds.length === 0) {
    fail('Une découverte nomme son périmètre; elle ne signifie jamais tout le catalogue.');
  }
}

/** Public strict policy assertion shared by the host and local ticket writer; no default is supplied. */
export function assertHopV55AssistedAdviceCandidatePolicyV1(value: unknown): asserts value is HopPropertyAdviceCandidatePolicy {
  assertCandidatePolicy(value);
}

const wireReferenceOf = (wire: unknown) => contentReference('hop-v55-assisted-advice-wire-v3-v2', { protocol: HOP_ADVICE_PROTOCOL_V1, wire });
const wizardWireReferenceOf = (wire: unknown) => contentReference('hop-v55-assisted-advice-wizard-wire-v1', { protocol: HOP_ADVICE_PROTOCOL_V1, wire });

function readWizardArchive(value: unknown): HopV55WizardDecisionReadingArchiveV4 {
  const read = readHopV55DecisionReadingArchiveForWizardV1(value);
  if (read.status !== 'available') {
    if (read.status === 'unsupportedFormat') throw new HopV55AssistedAdviceArchiveV2Error('unsupportedFormat',
      `Archive Wizard future conservée : ${read.format}.`);
    fail(read.reason);
  }
  return read.archive;
}

function wizardTicketReferences(input: {
  request: BrewerHopAdviceWizardRequestV3;
  sourceArchive: HopV55WizardDecisionReadingArchiveV4;
  wire: HopAdviceV1WizardWireInputV1;
}): HopV55AssistedAdviceSourceReferencesV2 {
  const metadataRead = readBrewerHopAdviceSourceViewMetadataV1ForWizardV1(input.request.sourceView);
  if (metadataRead.status !== 'readOnly') fail(metadataRead.status === 'invalid' ? metadataRead.reason : metadataRead.reason);
  return {
    sourceReadingReference: input.request.sourceReadingReference,
    sourceArchiveReference: input.sourceArchive.contentReference,
    requestReference: brewerHopAdviceRequestV3ReferenceForWizardV1(input.request),
    wireReference: wizardWireReferenceOf(input.wire),
    sourceViewReference: brewerHopAdviceSourceViewReferenceV1ForWizardV1(input.request.sourceView),
    contextLaunchReference: contentReference('hop-v55-assisted-wizard-context-launch-v1', input.request.contextLaunch),
    contextProjectionReference: contentReference('hop-v55-assisted-wizard-context-projection-v1', input.request.contextLaunch.expected),
    sourceMetadataReference: contentReference('hop-v55-assisted-source4-metadata-v1', metadataRead.metadata),
  };
}

function assertWizardTicketKnownLinks(ticket: HopV55AssistedAdviceWizardTicketV1): void {
  const wire = ticket.wire as unknown as Row;
  if (!hasOnlyKeys(wire, ['mode', 'analysisMode', 'scope', 'operationId', 'question', 'generation', 'phase', 'hopAdvice', 'draft'])
    || wire.mode !== HOP_ADVICE_PROTOCOL_V1.name || !['fast', 'auto', 'deep'].includes(String(wire.analysisMode))
    || !isText(wire.operationId) || !isText(wire.question) || !Number.isSafeInteger(wire.generation)
    || (wire.generation as number) < 0 || wire.phase !== undefined && typeof wire.phase !== 'string'
    || !isRow(wire.scope) || !exactKeys(wire.scope, ['kind', 'id']) || wire.scope.kind !== 'draft' || !isText(wire.scope.id)
    || !Object.prototype.hasOwnProperty.call(wire, 'draft')) {
    fail('Wire Wizard mal formé ou élargi hors du contrat exact Request3.');
  }
  if (ticket.ownerKey !== ticket.principal.ownerKey || ticket.workspaceId !== ticket.principal.workspaceId
    || ticket.ownerKey !== ticket.sourceArchive.ownerKey || ticket.workspaceId !== ticket.sourceArchive.workspaceId) {
    fail('Owner ou workspace du ticket Wizard, du principal et de l’archive divergent.');
  }
  if (ticket.question !== ticket.request.question || ticket.question !== ticket.wire.question) fail('Question Request3 du ticket et du wire Wizard divergente.');
  if (ticket.operationId !== ticket.wire.operationId || ticket.generation !== ticket.wire.generation) fail('OperationId/génération du wire Wizard divergents.');
  if (ticket.scope.kind !== 'draft' || !same(ticket.scope, mapBrewerHopAdviceWizardSourceToScopeV1(ticket.sourceArchive.source))) {
    fail('Scope draft du ticket ne correspond pas au tuple d’origine Wizard stable.');
  }
  if (!same(ticket.scope, ticket.wire.scope)) fail('Scope du ticket et du wire Wizard différent.');
  if (!same(ticket.scope, ticket.principal.scope)) fail('Scope du principal hôte différent du ticket Wizard.');
  if (ticket.request.sourceReadingReference !== ticket.sourceArchive.contentReference
    || ticket.request.contextLaunch.sourceReadingReference !== ticket.sourceArchive.contentReference) {
    fail('Request3 Wizard détachée de la référence de lecture de l’archive.');
  }
  if (ticket.wire.mode !== HOP_ADVICE_PROTOCOL_V1.name || !same(ticket.request, ticket.wire.hopAdvice)) {
    fail('Le wire Wizard ne conserve pas la Request3 exacte sous son profil de protocole.');
  }
  assertBrewerHopAdviceRequestV3ForWizardV1(ticket.request);
  assertBrewerHopAdviceSourceViewMatchesArchiveV1ForWizardV1(ticket.request.sourceView, ticket.sourceArchive);
  const requestRead = readBrewerHopAdviceRequestV3ForWizardV1(ticket.wire.hopAdvice);
  if (requestRead.status !== 'readOnly' || !same(requestRead.request, ticket.request)) {
    fail(requestRead.status === 'invalid' ? requestRead.reason : 'La Request3 du wire Wizard diffère du ticket.');
  }
  const launch = ticket.request.contextLaunch;
  if (launch.ownerKey !== ticket.ownerKey || launch.workspaceId !== ticket.workspaceId
    || !same(launch.scope, ticket.scope) || !same(launch.source, ticket.sourceArchive.source)
    || launch.sourceRuntimeReference !== ticket.sourceArchive.runtimeReference
    || launch.expected.source.kind !== 'draft' || launch.expected.source.id !== ticket.scope.id) {
    fail('Le lancement Request3 ne décrit pas l’origine Wizard et le scope du ticket.');
  }
  assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(ticket.sourceArchive.source, {
    recipe: ticket.wire.draft, reference: ticket.sourceArchive.source.contentReference,
  });
  if (launch.expected.source.snapshotReference !== brewerHopAdviceEffectiveDraftReferenceForWizardV1(ticket.wire.draft)) {
    fail('Le wire Wizard ne porte pas le snapshot canonique déclaré dans le lancement.');
  }
  assertJsonValue(ticket.wire, 'ticket.wire');
  const requestBytes = measureSemanticJsonForWizard(ticket.request);
  const wireBytes = measureSemanticJsonForWizard(ticket.wire);
  if (requestBytes.utf8Bytes > 100000 || requestBytes.maxDepth > 18 || wireBytes.utf8Bytes > 100000 || wireBytes.maxDepth > 18) {
    fail('La Request3 ou le wire Wizard dépasse la borne stricte UTF-8/profondeur.', 'tooLarge');
  }
  const expected = wizardTicketReferences({ request: ticket.request, sourceArchive: ticket.sourceArchive, wire: ticket.wire });
  if (!exactKeys(ticket.references as unknown as Row, Object.keys(expected)) || !same(ticket.references, expected)) {
    fail('Références Wizard différentes de l’archive, de Request3 ou du wire exact.');
  }
}

export function hopV55AssistedAdviceWizardTicketV1Reference(
  value: Omit<HopV55AssistedAdviceWizardTicketV1, 'reference'> | HopV55AssistedAdviceWizardTicketV1,
): string {
  const { reference: _reference, ...body } = value as HopV55AssistedAdviceWizardTicketV1;
  return contentReference(HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT, body);
}

/** Strict V1 Wizard reader; known parent references are checked before any future child is returned opaque. */
export function readHopV55AssistedAdviceWizardTicketV1(value: unknown): HopV55AssistedAdviceWizardTicketV1Read {
  if (!isRow(value) || typeof value.format !== 'string'
    || !value.format.startsWith(HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT)) {
    return { status: 'invalid', reason: 'Ticket V1 Wizard absent ou de namespace inconnue.' };
  }
  try {
    assertJsonValue(value, 'ticket Wizard');
    if (value.format !== HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT) {
      const refs = isRow(value.references) ? value.references : undefined;
      const archive = isRow(value.sourceArchive) ? value.sourceArchive : undefined;
      const request = isRow(value.request) ? value.request : undefined;
      const wire = isRow(value.wire) ? value.wire : undefined;
      if (refs && isText(archive?.contentReference) && isText(refs.sourceArchiveReference)
        && refs.sourceArchiveReference !== archive.contentReference) fail('Référence archive connue du ticket Wizard futur altérée.');
      if (refs && isText(request?.sourceReadingReference) && isText(refs.sourceReadingReference)
        && refs.sourceReadingReference !== request.sourceReadingReference) fail('Référence de lecture connue du ticket Wizard futur altérée.');
      if (refs && wire && isText(refs.wireReference) && wizardWireReferenceOf(wire) !== refs.wireReference) {
        fail('Référence du wire connu dans le ticket Wizard futur altérée.');
      }
      return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: `Ticket Wizard futur conservé : ${value.format}.` };
    }
    if (!exactKeys(value, ['format', 'id', 'principal', 'ownerKey', 'workspaceId', 'operationId', 'generation', 'createdAt',
      'scope', 'question', 'request', 'wire', 'sourceArchive', 'candidatePolicy', 'references', 'reference'])
      || !isText(value.id) || !isText(value.ownerKey) || !isText(value.workspaceId) || !isText(value.operationId)
      || !Number.isSafeInteger(value.generation) || (value.generation as number) < 0 || !isoInstant(value.createdAt)
      || !isText(value.question) || !isText(value.reference) || !isRow(value.request) || !isRow(value.wire)
      || !isRow(value.sourceArchive) || !isRow(value.references)) fail('Structure ou identité du ticket Wizard invalide.');
    const { reference: _reference, ...body } = value;
    if (contentReference(HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT, body) !== value.reference) {
      fail('Sceau du ticket Wizard invalide.');
    }
    assertPrincipal(value.principal);
    assertScope(value.scope, 'ticket Wizard.scope');
    assertCandidatePolicy(value.candidatePolicy);
    const archive = readWizardArchive(value.sourceArchive);
    const requestRead = readBrewerHopAdviceRequestV3ForWizardV1(value.request);
    if (requestRead.status !== 'readOnly') fail(requestRead.status === 'invalid' ? requestRead.reason : requestRead.reason);
    const ticket = value as unknown as HopV55AssistedAdviceWizardTicketV1;
    if (!same(archive, ticket.sourceArchive) || !same(requestRead.request, ticket.request)) fail('Les sources relues du ticket Wizard divergent.');
    assertWizardTicketKnownLinks(ticket);
    return { status: 'readOnly', ticket: clone(ticket) };
  } catch (error) {
    if (error instanceof HopV55AssistedAdviceArchiveV2Error && error.code === 'unsupportedFormat') {
      return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: error.message };
    }
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Ticket Wizard illisible.' };
  }
}

/** Seals the Request3 Wizard and its exact wire. Caller must persist the returned ticket before submit. */
export function createHopV55AssistedAdviceWizardTicketV1(input: {
  id: string;
  createdAt: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  sourceArchive: unknown;
  request: unknown;
  wire: unknown;
  candidatePolicy: unknown;
}): CreateHopV55AssistedAdviceWizardTicketV1Result {
  try {
    if (!isText(input.id) || !isoInstant(input.createdAt)) fail('ID ou instant de capture du ticket Wizard invalide.');
    assertPrincipal(input.principal);
    assertCandidatePolicy(input.candidatePolicy);
    const sourceArchive = readWizardArchive(input.sourceArchive);
    const requestRead = readBrewerHopAdviceRequestV3ForWizardV1(input.request);
    if (requestRead.status !== 'readOnly') fail(requestRead.status === 'invalid' ? requestRead.reason : requestRead.reason);
    const request = requestRead.request;
    if (!isRow(input.wire)) fail('Wire Wizard Request3 complet requis.');
    const wire = input.wire as unknown as HopAdviceV1WizardWireInputV1;
    const ticketBody = {
      format: HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT,
      id: input.id, principal: clone(input.principal), ownerKey: input.principal.ownerKey,
      workspaceId: input.principal.workspaceId, operationId: wire.operationId, generation: wire.generation,
      createdAt: input.createdAt, scope: clone(wire.scope), question: request.question, request: clone(request),
      wire: clone(wire), sourceArchive: clone(sourceArchive), candidatePolicy: clone(input.candidatePolicy),
      references: wizardTicketReferences({ request, sourceArchive, wire }),
    };
    const ticket = { ...ticketBody, reference: contentReference(HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT, ticketBody) };
    const checked = readHopV55AssistedAdviceWizardTicketV1(ticket);
    if (checked.status !== 'readOnly') fail(checked.status === 'invalid' ? checked.reason : checked.reason);
    const requestBytes = measureSemanticJsonForWizard(request);
    const wireBytes = measureSemanticJsonForWizard(wire);
    if (requestBytes.utf8Bytes > 100000 || requestBytes.maxDepth > 18 || wireBytes.utf8Bytes > 100000 || wireBytes.maxDepth > 18) {
      return { status: 'tooLarge', requestBytes, wireBytes, maxBytes: 100000, maxDepth: 18, snapshot: clone(wire) };
    }
    return { status: 'ready', ticket: checked.ticket, requestBytes, wireBytes };
  } catch (error) {
    if (error instanceof HopV55AssistedAdviceArchiveV2Error && error.code === 'tooLarge') {
      return { status: 'tooLarge', maxBytes: 100000, maxDepth: 18, snapshot: clone(input.wire) };
    }
    if (error instanceof HopV55AssistedAdviceArchiveV2Error && error.code === 'unsupportedFormat') {
      return { status: 'unsupportedReadOnly', snapshot: clone(input.sourceArchive), reason: error.message };
    }
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Capture ticket Wizard impossible.' };
  }
}

function assertHostBinding(principal: HopV55SemanticAdoptionPrincipalV1, request: BrewerHopAdviceRequestV3,
  sourceArchive: HopV55DecisionReadingArchiveV4, scope: unknown): void {
  if (sourceArchive.ownerKey !== principal.ownerKey || sourceArchive.workspaceId !== principal.workspaceId
    || request.contextLaunch.ownerKey !== principal.ownerKey || request.contextLaunch.workspaceId !== principal.workspaceId
    || request.contextLaunch.sourceReadingReference !== sourceArchive.contentReference
    || request.sourceReadingReference !== sourceArchive.contentReference
    || !same(request.contextLaunch.scope, principal.scope) || !same(scope, principal.scope)) {
    fail('Principal, source4, RequestV3 et scope host ne correspondent pas.');
  }
}

function sourceMetadataInput(request: BrewerHopAdviceRequestV3): HopV55DecisionReadingArchiveV4MetadataV1 {
  const { format: _format, reference: _reference, localDerivations: _localDerivations, ...metadata } = request.sourceView;
  const read = readHopV55DecisionReadingArchiveV4MetadataV1(metadata);
  if (read.status === 'unsupportedReadOnly') fail(read.reason, 'unsupportedFormat');
  if (read.status !== 'readOnly') fail(read.reason);
  return read.metadata;
}

function ticketReferences(input: {
  request: BrewerHopAdviceRequestV3;
  sourceArchive: HopV55DecisionReadingArchiveV4;
  wire: HopAdviceV1WireInputV3;
  metadata: HopV55DecisionReadingArchiveV4MetadataV1;
}): HopV55AssistedAdviceSourceReferencesV2 {
  return {
    sourceReadingReference: input.request.sourceReadingReference,
    sourceArchiveReference: input.sourceArchive.contentReference,
    requestReference: brewerHopAdviceRequestV3Reference(input.request),
    wireReference: wireReferenceOf(input.wire),
    sourceViewReference: brewerHopAdviceSourceViewReferenceV1(input.request.sourceView),
    contextLaunchReference: contentReference('hop-v55-assisted-context-launch-v1', input.request.contextLaunch),
    contextProjectionReference: contentReference('hop-v55-assisted-context-projection-v1', input.request.contextLaunch.expected),
    sourceMetadataReference: contentReference('hop-v55-assisted-source4-metadata-v1', input.metadata),
  };
}

function assertTicketKnownLinks(ticket: HopV55AssistedAdviceSemanticTicket): void {
  const request = ticket.request as unknown as Row;
  const wire = ticket.wire as unknown as Row;
  const references = ticket.references as unknown as Row;
  const referenceKeys = ['sourceReadingReference', 'sourceArchiveReference', 'requestReference', 'wireReference',
    'sourceViewReference', 'contextLaunchReference', 'contextProjectionReference', 'sourceMetadataReference'];
  if (!exactKeys(references, referenceKeys) || referenceKeys.some(key => !isText(references[key]))) {
    fail('Références connues du ticket V2 absentes ou mal formées.');
  }
  if (ticket.ownerKey !== ticket.principal.ownerKey || ticket.workspaceId !== ticket.principal.workspaceId
    || ticket.operationId !== wire.operationId || ticket.generation !== wire.generation
    || !same(ticket.scope, ticket.principal.scope) || !same(ticket.scope, wire.scope)
    || ticket.question !== wire.question || !isText(wire.question)
    || wire.mode !== HOP_ADVICE_PROTOCOL_V1.name || !['fast', 'auto', 'deep'].includes(String(wire.analysisMode))) {
    fail('Identité connue du ticket, principal et wire divergente.');
  }
  if (references.wireReference !== wireReferenceOf(ticket.wire) || !same(ticket.request, wire.hopAdvice)) {
    fail('Digest du wire ou snapshot Request3 exact du ticket divergent.');
  }
  if (!isText(request.question) || request.question !== ticket.question
    || !isText(request.sourceReadingReference) || request.sourceReadingReference !== references.sourceReadingReference) {
    fail('Question ou lecture source connue de Request3 détachée du ticket.');
  }
  if (isRow(request.contextLaunch)) {
    const launch = request.contextLaunch;
    if (isText(launch.ownerKey) && launch.ownerKey !== ticket.ownerKey
      || isText(launch.workspaceId) && launch.workspaceId !== ticket.workspaceId
      || isText(launch.sourceReadingReference) && launch.sourceReadingReference !== references.sourceReadingReference
      || launch.scope !== undefined && !same(launch.scope, ticket.scope)) {
      fail('Owner, workspace, scope ou lecture source connus du lancement Request3 divergents.');
    }
  }
  if (!isRow(wire.hopAdvice) || !isText(wire.hopAdvice.question) || wire.hopAdvice.question !== ticket.question
    || !isText(wire.hopAdvice.sourceReadingReference) || wire.hopAdvice.sourceReadingReference !== references.sourceReadingReference) {
    fail('Question ou lecture source connue de wire.hopAdvice détachée du ticket.');
  }
  if (references.sourceArchiveReference !== references.sourceReadingReference) {
    fail('Référence sourceArchiveReference divergente de sourceReadingReference dans le ticket.');
  }
  const archive = ticket.sourceArchive as unknown as Row;
  if (isText(archive.contentReference) && (archive.contentReference !== references.sourceArchiveReference
    || archive.contentReference !== references.sourceReadingReference)) {
    fail('Référence source connue de l’archive détachée du ticket.');
  }
  if (archive.ownerKey !== undefined && archive.ownerKey !== ticket.ownerKey
    || archive.workspaceId !== undefined && archive.workspaceId !== ticket.workspaceId) {
    fail('Owner ou workspace connu de l’archive source détaché du ticket.');
  }
}

/**
 * FACADE-V2-R01. Before a legacy or future child decides the verdict, every reference of the known
 * container that is still calculable is checked. Container references over raw snapshots (wire, context
 * launch and its projection, source reading, known archive4) need no child interpretation; child-codec
 * references (Request3, SourceView1, metadata) are computed only once that child was read by its own reader.
 */
function assertCalculableTicketReferences(ticket: HopV55AssistedAdviceSemanticTicket,
  requestRead: ReturnType<typeof readBrewerHopAdviceRequestV3>, archive: ReturnType<typeof sourceArchiveRead>): void {
  const request = ticket.request as unknown as Row;
  const references = ticket.references as unknown as Row;
  const expected: Partial<Record<keyof HopV55AssistedAdviceSourceReferencesV2, string>> = { wireReference: wireReferenceOf(ticket.wire) };
  if (isText(request.sourceReadingReference)) expected.sourceReadingReference = request.sourceReadingReference;
  if (archive.status === 'readOnly') expected.sourceArchiveReference = archive.archive.contentReference;
  if (isRow(request.contextLaunch)) {
    expected.contextLaunchReference = contentReference('hop-v55-assisted-context-launch-v1', request.contextLaunch);
    if (Object.prototype.hasOwnProperty.call(request.contextLaunch, 'expected')) {
      expected.contextProjectionReference = contentReference('hop-v55-assisted-context-projection-v1', request.contextLaunch.expected);
    }
  }
  if (requestRead.status === 'readOnly') {
    expected.requestReference = brewerHopAdviceRequestV3Reference(requestRead.request);
    expected.sourceViewReference = brewerHopAdviceSourceViewReferenceV1(requestRead.request.sourceView);
    const { format: _format, reference: _reference, localDerivations: _localDerivations, ...metadata } = requestRead.request.sourceView;
    const metadataRead = readHopV55DecisionReadingArchiveV4MetadataV1(metadata);
    if (metadataRead.status === 'invalid') fail(metadataRead.reason);
    if (metadataRead.status === 'readOnly') {
      expected.sourceMetadataReference = contentReference('hop-v55-assisted-source4-metadata-v1', metadataRead.metadata);
    }
  }
  for (const [key, reference] of Object.entries(expected)) {
    if (references[key] !== reference) fail(`Référence ${key} du ticket incohérente avec ses snapshots connus.`);
  }
}

/** Seal namespace follows the known ticket version; V2 bodies keep their exact historical seal. */
export function hopV55AssistedAdviceSemanticTicketReference(value: SemanticTicketBody | HopV55AssistedAdviceSemanticTicket): string {
  const { reference: _reference, ...body } = value as HopV55AssistedAdviceSemanticTicket;
  return contentReference(body.format === HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT
    ? HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT : HOP_V55_ASSISTED_ADVICE_TICKET_V2_FORMAT, body);
}

export function hopV55AssistedAdviceTicketV2Reference(value: Omit<HopV55AssistedAdviceTicketV2, 'reference'> | HopV55AssistedAdviceTicketV2): string {
  return hopV55AssistedAdviceSemanticTicketReference(value);
}

function readTicketV1(value: unknown): HopV55AssistedAdviceTicketV2Read {
  const read = readHopV55AssistedAdviceTicketV1(value);
  if (read.status === 'readOnly') return { status: 'legacyReadOnly', format: read.ticket.format,
    snapshot: clone(read.ticket), reason: 'Ticket V1 request2 conservé sous son lecteur strict; aucune conversion en Request3.' };
  if (read.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(read.snapshot), reason: read.reason };
  return { status: 'invalid', reason: read.reason };
}

function sourceArchiveRead(value: unknown):
  | { status: 'readOnly'; archive: HopV55DecisionReadingArchiveV4 }
  | { status: 'legacyReadOnly'; format: string; snapshot: unknown; reason: string }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string } {
  const read = readHopV55DecisionReadingArchive(value);
  if (read.status === 'unsupportedFormat') return { status: 'unsupportedReadOnly', snapshot: clone(read.raw), reason: `Archive source future conservée : ${read.format}.` };
  if (read.status !== 'available') return { status: 'invalid', reason: read.reason };
  if (read.archive.format !== 'hop-v55-decision-reading-v4') return { status: 'legacyReadOnly', format: read.archive.format,
    snapshot: clone(read.archive), reason: 'Archive source historique; V2 exige une archive V4 intégrale.' };
  return { status: 'readOnly', archive: read.archive as HopV55DecisionReadingArchiveV4 };
}

const TICKET_V2_KEYS = ['format', 'id', 'principal', 'ownerKey', 'workspaceId', 'operationId', 'generation', 'createdAt', 'scope',
  'question', 'request', 'wire', 'sourceArchive', 'references', 'reference'] as const;
const isKnownTicketFormat = (format: unknown) => format === HOP_V55_ASSISTED_ADVICE_TICKET_V2_FORMAT
  || format === HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT;

function ticketView(value: unknown): HopV55AssistedAdviceTicketV2Read {
  if (!isRow(value)) return { status: 'invalid', reason: 'Ticket V2 absent ou illisible.' };
  if (value.format === 'hop-v55-assisted-advice-ticket-v1') return readTicketV1(value);
  if (!isKnownTicketFormat(value.format)) {
    if (typeof value.format === 'string' && value.format.startsWith(TICKET_PREFIX)) {
      try { assertJsonValue(value); return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: `Ticket futur conservé : ${value.format}.` }; }
      catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Ticket futur non sérialisable.' }; }
    }
    return { status: 'invalid', reason: 'Format de ticket assisté inconnu.' };
  }

  try {
    assertJsonValue(value, 'ticket');
    if (!isText(value.reference)) fail('Référence du ticket V2 absente.');
    const { reference: _reference, ...body } = value;
    if (hopV55AssistedAdviceSemanticTicketReference(body as unknown as SemanticTicketBody) !== value.reference) {
      fail('Sceau du ticket V2 invalide.');
    }
    const withPolicy = value.format === HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT;
    const allowed: readonly string[] = withPolicy ? [...TICKET_V2_KEYS, 'candidatePolicy'] : TICKET_V2_KEYS;
    if (!exactKeys(value, allowed) || !isText(value.id)
      || !isText(value.ownerKey) || !isText(value.workspaceId) || !isText(value.operationId)
      || !Number.isSafeInteger(value.generation) || (value.generation as number) < 0 || !isoInstant(value.createdAt)
      || !isText(value.question)) fail('Structure ou identité du ticket V2 invalide.');
    if (withPolicy) assertCandidatePolicy(value.candidatePolicy);
    assertPrincipal(value.principal);
    assertScope(value.scope, 'ticket.scope');
    if (!isRow(value.wire) || !isRow(value.request) || !isRow(value.sourceArchive) || !isRow(value.references)) {
      fail('Wire V3, Request3, archive4 ou références absents du ticket V2.');
    }

    const ticket = value as unknown as HopV55AssistedAdviceSemanticTicket;
    assertTicketKnownLinks(ticket);
    const requestRead = readBrewerHopAdviceRequestV3(ticket.request);
    if (requestRead.status === 'invalid' || requestRead.status === 'legacyReadOnly') {
      fail(requestRead.status === 'invalid' ? requestRead.reason : 'Request V2 historique attachée à un ticket V2.');
    }
    const wireRequestRead = readBrewerHopAdviceRequestV3(ticket.wire.hopAdvice);
    if (wireRequestRead.status === 'invalid' || wireRequestRead.status === 'legacyReadOnly') {
      fail(wireRequestRead.status === 'invalid' ? wireRequestRead.reason : 'Request V2 historique dans le wire V3.');
    }
    const archive = sourceArchiveRead(ticket.sourceArchive);
    if (requestRead.status === 'readOnly') {
      const request = requestRead.request;
      assertBrewerHopAdviceRequestV3(request);
      if (request.contextLaunch.ownerKey !== ticket.ownerKey || request.contextLaunch.workspaceId !== ticket.workspaceId
        || !same(request.contextLaunch.scope, ticket.scope)
        || request.sourceReadingReference !== ticket.references.sourceReadingReference) {
        fail('Request3, lancement et identité hôte ne correspondent pas.');
      }
      if (archive.status === 'readOnly') assertHostBinding(ticket.principal, request, archive.archive, ticket.scope);
    }
    assertScope(ticket.wire.scope, 'ticket.wire.scope');
    if (ticket.scope.kind !== ticket.wire.scope.kind || ticket.scope.id !== ticket.wire.scope.id) {
      fail('Wire, Request3, principal et identité de ticket divergents.');
    }
    if (requestRead.status === 'readOnly' && wireRequestRead.status === 'readOnly'
      && !same(wireRequestRead.request, requestRead.request)) {
      fail('Request3 du wire différent du snapshot Request3 du ticket.');
    }
    if (archive.status === 'invalid') fail(archive.reason);
    assertCalculableTicketReferences(ticket, requestRead, archive);
    if (archive.status === 'legacyReadOnly') return { status: 'legacyReadOnly', format: archive.format,
      snapshot: clone(value), reason: archive.reason };
    if (archive.status === 'unsupportedReadOnly') {
      return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: archive.reason };
    }
    if (requestRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: requestRead.reason };
    if (wireRequestRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: wireRequestRead.reason };
    if (requestRead.status !== 'readOnly' || wireRequestRead.status !== 'readOnly') fail('Request3 invalide.');
    const request = requestRead.request;
    assertBrewerHopAdviceSourceViewMatchesArchiveV1(request.sourceView, archive.archive);
    const metadata = sourceMetadataInput(request);
    const measured = measureHopAdviceV1SemanticWireV3({ request, wire: ticket.wire, sourceArchive: archive.archive });
    if (measured.status === 'tooLarge') fail(`Wire V3 conservé hors limite (${measured.wireBytes.utf8Bytes} octets).`, 'tooLarge');
    if (measured.status !== 'ready') fail(measured.reason);
    const expectedReferences = ticketReferences({ request, sourceArchive: archive.archive, wire: ticket.wire, metadata });
    if (!exactKeys(ticket.references as unknown as Row, Object.keys(expectedReferences)) || !same(ticket.references, expectedReferences)) {
      fail('Références du ticket V2 différentes de l’archive, de Request3 ou du wire complet.');
    }
    return { status: 'readOnly', ticket: clone(ticket) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Ticket V2 invalide.' };
  }
}

interface CaptureHopV55AssistedAdviceTicketInput {
  id: string;
  createdAt: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  sourceArchive: unknown;
  wire: unknown;
}

/**
 * Historical V2 capture, kept byte-compatible. A V2 ticket carries no local candidate policy, so no
 * adoption can ever start from it; new launches use `createHopV55AssistedAdviceTicketV3`.
 */
export function createHopV55AssistedAdviceTicketV2(input: CaptureHopV55AssistedAdviceTicketInput): CreateHopV55AssistedAdviceTicketV2Result {
  const captured = captureSemanticTicket(input);
  return captured.status === 'ready' ? { ...captured, ticket: captured.ticket as HopV55AssistedAdviceTicketV2 } : captured;
}

/**
 * Pure host capture with the brewer's explicit local candidate policy, sealed before the network submit.
 * Request3 and the wire are exactly those of V2. A ready result is not proof of persistence: the host
 * must CAS-store this ticket and must send nothing if that save fails.
 */
export function createHopV55AssistedAdviceTicketV3(input: CaptureHopV55AssistedAdviceTicketInput & { candidatePolicy: unknown }):
  CreateHopV55AssistedAdviceTicketV3Result {
  try { assertCandidatePolicy(input.candidatePolicy); }
  catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Politique de candidats invalide.' }; }
  const captured = captureSemanticTicket(input, clone(input.candidatePolicy as HopPropertyAdviceCandidatePolicy));
  return captured.status === 'ready' ? { ...captured, ticket: captured.ticket as HopV55AssistedAdviceTicketV3 } : captured;
}

function captureSemanticTicket(input: CaptureHopV55AssistedAdviceTicketInput, candidatePolicy?: HopPropertyAdviceCandidatePolicy):
  | { status: 'ready'; ticket: HopV55AssistedAdviceSemanticTicket; requestBytes: { utf8Bytes: number; maxDepth: number }; wireBytes: { utf8Bytes: number; maxDepth: number } }
  | Exclude<CreateHopV55AssistedAdviceTicketV2Result, { status: 'ready' }> {
  try {
    if (!isText(input.id) || !isoInstant(input.createdAt)) fail('ID hôte ou instant de capture invalide.');
    assertPrincipal(input.principal);
    if (!isRow(input.wire) || !isRow(input.wire.hopAdvice) || !isRow(input.wire.hopAdvice.contextLaunch)) {
      fail('Wire Request3 complet requis pour capturer le ticket V2.');
    }
    const requestRead = readBrewerHopAdviceRequestV3(input.wire.hopAdvice);
    if (requestRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(input.wire), reason: requestRead.reason };
    if (requestRead.status === 'legacyReadOnly') return { status: 'legacyReadOnly', format: requestRead.request.format,
      snapshot: clone(input.wire), reason: 'Request2 reste dans son ticket/archive V1; aucun passage par Request3.' };
    if (requestRead.status !== 'readOnly') fail(requestRead.status === 'invalid' ? requestRead.reason : 'Request3 V3 requise.');
    const sourceRead = sourceArchiveRead(input.sourceArchive);
    if (sourceRead.status === 'legacyReadOnly') return { status: 'legacyReadOnly', format: sourceRead.format,
      snapshot: clone(input.sourceArchive), reason: sourceRead.reason };
    if (sourceRead.status === 'unsupportedReadOnly') {
      return { status: 'unsupportedReadOnly', snapshot: clone(input.sourceArchive), reason: sourceRead.reason };
    }
    if (sourceRead.status !== 'readOnly') fail(sourceRead.reason);
    const sourceArchive = sourceRead.archive;
    const request = requestRead.request;
    assertBrewerHopAdviceRequestV3(request);
    assertHostBinding(input.principal, request, sourceArchive, input.wire.scope);
    if (input.wire.operationId === undefined || !isText(input.wire.operationId)
      || !Number.isSafeInteger(input.wire.generation) || (input.wire.generation as number) < 0
      || !isText(input.wire.question) || !same(input.wire.hopAdvice, request)) {
      fail('OperationId, génération ou question wire absents ou détachés de Request3.');
    }
    if (input.wire.operationId === '' || input.wire.question !== request.question) fail('Question ou operationId wire incohérents.');
    assertBrewerHopAdviceSourceViewMatchesArchiveV1(request.sourceView, sourceArchive);
    const measured = measureHopAdviceV1SemanticWireV3({ request, wire: input.wire, sourceArchive });
    if (measured.status === 'tooLarge') return { status: 'tooLarge', wireBytes: measured.wireBytes, maxBytes: 100000, maxDepth: 18, snapshot: clone(input.wire) };
    if (measured.status !== 'ready') fail(measured.reason);
    const metadata = sourceMetadataInput(request);
    const scope = request.contextLaunch.scope;
    const references = ticketReferences({ request, sourceArchive, wire: measured.wire, metadata });
    const common: Omit<HopV55AssistedAdviceTicketV2, 'reference' | 'format'> = {
      id: input.id, principal: clone(input.principal), ownerKey: input.principal.ownerKey, workspaceId: input.principal.workspaceId,
      operationId: measured.wire.operationId, generation: measured.wire.generation!, createdAt: input.createdAt,
      scope: clone(scope), question: request.question, request: clone(request), wire: clone(measured.wire),
      sourceArchive: clone(sourceArchive), references,
    };
    const body: SemanticTicketBody = candidatePolicy
      ? { ...common, format: HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT, candidatePolicy: clone(candidatePolicy) }
      : { ...common, format: HOP_V55_ASSISTED_ADVICE_TICKET_V2_FORMAT };
    const ticket = { ...body, reference: hopV55AssistedAdviceSemanticTicketReference(body) };
    const checked = ticketView(ticket);
    if (checked.status !== 'readOnly') fail(checked.status === 'invalid' ? checked.reason : 'Ticket V2 capturé non relisible.');
    return { status: 'ready', ticket: checked.ticket, requestBytes: measureBrewerHopAdviceSemanticJsonWire(request), wireBytes: measured.wireBytes };
  } catch (error) {
    if (error instanceof HopV55AssistedAdviceArchiveV2Error && error.code === 'tooLarge') {
      return { status: 'tooLarge', maxBytes: 100000, maxDepth: 18, snapshot: clone(input.wire) };
    }
    if (error instanceof HopV55AssistedAdviceArchiveV2Error && error.code === 'unsupportedFormat') {
      return { status: 'unsupportedReadOnly', snapshot: clone(input.wire), reason: error.message };
    }
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Capture V2 impossible.' };
  }
}

function assertPublicJob(value: unknown): asserts value is HopAdviceV1PublicJob {
  const allowed = ['id', 'operationId', 'scope', 'generation', 'question', 'label', 'status', 'stage', 'detail', 'model', 'createdAt',
    'updatedAt', 'startedAt', 'finishedAt', 'readAt', 'attempt', 'protocol', 'catalogueReceipts', 'scenarioReceipts', 'error'];
  if (!isRow(value) || !hasOnlyKeys(value, allowed) || !isText(value.id) || !isText(value.operationId)
    || !Number.isSafeInteger(value.generation) || (value.generation as number) < 0 || !isText(value.question)
    || typeof value.label !== 'string' || value.status !== 'done' || value.protocol !== HOP_ADVICE_PROTOCOL_V1.name) {
    fail('Job public V1 absent, incomplet ou non terminé.');
  }
  assertScope(value.scope, 'job.scope');
  if (!['queued', 'running', 'done', 'error', 'cancelled'].includes(String(value.status))) fail('job.status invalide.');
  if (!['queued', 'context', 'analysis', 'tools', 'research', 'review', 'repair', 'saving', 'retry'].includes(String(value.stage))) {
    fail('job.stage invalide.');
  }
  if (!Number.isFinite(value.createdAt) || !Number.isFinite(value.updatedAt) || !Number.isSafeInteger(value.attempt)
    || (value.attempt as number) < 0) fail('Horodatages ou tentative du job invalides.');
  if (value.detail !== undefined && typeof value.detail !== 'string' || value.model !== undefined && typeof value.model !== 'string'
    || value.startedAt !== undefined && !Number.isFinite(value.startedAt)
    || value.finishedAt !== undefined && !Number.isFinite(value.finishedAt) || value.readAt !== undefined && !Number.isFinite(value.readAt)) {
    fail('Champs optionnels du job invalides.');
  }
  assertJsonValue(value, 'job');
}

const TURN_KEYS = ['id', 'operationId', 'question', 'advice', 'evidence', 'createdAt', 'model', 'reviewed', 'reviewModel',
  'reviewReason', 'mode', 'contextLabel', 'proposal', 'hopAdviceProposal', 'protocol'] as const;
const ADVICE_KEYS = ['level', 'summary', 'action', 'why', 'watch', 'question', 'evidenceIds', 'productUrls'] as const;
const EVIDENCE_KEYS = ['id', 'name', 'label', 'facts', 'limits', 'data', 'sources', 'products', 'model'] as const;

function assertEvidenceRows(value: unknown): asserts value is BrewerEvidence[] {
  if (!Array.isArray(value)) fail('Preuves complètes du tour invalides.');
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    if (!isRow(entry) || !hasOnlyKeys(entry, EVIDENCE_KEYS) || !isText(entry.id) || ids.has(entry.id)
      || typeof entry.name !== 'string' || typeof entry.label !== 'string' || !Array.isArray(entry.facts) || entry.facts.some(fact => typeof fact !== 'string')
      || !Array.isArray(entry.limits) || entry.limits.some(limit => typeof limit !== 'string') || !Object.prototype.hasOwnProperty.call(entry, 'data')) {
      fail(`turnEvidence[${index}] invalide ou dupliquée.`);
    }
    ids.add(entry.id);
    if (entry.sources !== undefined && !Array.isArray(entry.sources) || entry.products !== undefined && !Array.isArray(entry.products)
      || entry.model !== undefined && typeof entry.model !== 'string') fail(`turnEvidence[${index}] contient un champ optionnel invalide.`);
    assertJsonValue(entry, `turnEvidence[${index}]`);
  });
}

function assertTurnCommon(value: unknown): asserts value is HopAdviceV1PublicTurn {
  if (!isRow(value) || !hasOnlyKeys(value, TURN_KEYS) || !isText(value.id) || !isText(value.operationId)
    || !isText(value.question) || !Number.isFinite(value.createdAt) || typeof value.model !== 'string'
    || typeof value.reviewed !== 'boolean' || typeof value.contextLabel !== 'string'
    || value.protocol !== HOP_ADVICE_PROTOCOL_V1.name) {
    fail('Tour public V1/V6 incomplet ou de protocole différent.');
  }
  if (!isRow(value.advice) || !hasOnlyKeys(value.advice, ADVICE_KEYS)
    || !['info', 'attention', 'urgent'].includes(String(value.advice.level))
    || ['summary', 'action', 'why'].some(key => typeof value.advice[key] !== 'string') || typeof value.advice.watch !== 'string'
    || typeof value.advice.question !== 'string' || !Array.isArray(value.advice.evidenceIds)
    || value.advice.evidenceIds.some(id => !isText(id))) fail('turn.advice invalide.');
  if (value.advice.productUrls !== undefined && (!Array.isArray(value.advice.productUrls) || value.advice.productUrls.some(url => typeof url !== 'string'))) {
    fail('turn.advice.productUrls invalide.');
  }
  if (value.reviewModel !== undefined && typeof value.reviewModel !== 'string'
    || value.reviewReason !== undefined && !['fast', 'requested', 'sensitive', 'repair', 'complexity', 'research'].includes(String(value.reviewReason))
    || value.mode !== undefined && !['fast', 'auto', 'deep'].includes(String(value.mode))
    || value.proposal !== undefined && !isRow(value.proposal)) fail('Champs optionnels du tour invalides.');
  assertEvidenceRows(value.evidence);
  assertJsonValue(value, 'turn');
}

/** Record references computed from the record's own snapshots; the ticket is not needed for them. */
function recordOwnReferences(input: { principal: unknown; job: unknown; turn: unknown; fullEvidence: unknown }) {
  const turn = input.turn as Row;
  const proposal = turn.hopAdviceProposal;
  const serverContext = isRow(proposal) && isRow(proposal.serverContext) ? proposal.serverContext : undefined;
  const proposalSlot = Object.prototype.hasOwnProperty.call(turn, 'hopAdviceProposal')
    ? { present: true, value: proposal } : { present: false };
  const serverBindingSlot = serverContext && Object.prototype.hasOwnProperty.call(serverContext, 'binding')
    ? { present: true, value: serverContext.binding } : { present: false };
  return {
    principalReference: contentReference('hop-v55-assisted-advice-principal-v2', input.principal),
    proposalSlotReference: contentReference('hop-v55-assisted-advice-proposal-slot-v2', proposalSlot),
    serverBindingReference: contentReference('hop-v55-assisted-advice-server-binding-slot-v2', serverBindingSlot),
    jobReference: contentReference('hop-v55-assisted-advice-public-job-v2', input.job),
    turnReference: contentReference('hop-v55-assisted-advice-public-turn-v2', input.turn),
    turnEvidenceReference: contentReference('hop-v55-assisted-advice-full-evidence-v2', input.fullEvidence),
  };
}

export function createHopV55AssistedAdviceRecordReferencesV2(input: {
  ticket: HopV55AssistedAdviceSemanticTicket;
  job: HopAdviceV1PublicJob;
  turn: HopAdviceV1PublicTurn;
  fullEvidence: readonly BrewerEvidence[];
}): HopV55AssistedAdviceRecordReferencesV2 {
  return {
    ...input.ticket.references,
    ticketReference: input.ticket.reference,
    ...recordOwnReferences({ principal: input.ticket.principal, job: input.job, turn: input.turn, fullEvidence: input.fullEvidence }),
  };
}

const SOURCE_REFERENCE_KEYS = ['sourceReadingReference', 'sourceArchiveReference', 'requestReference', 'wireReference',
  'sourceViewReference', 'contextLaunchReference', 'contextProjectionReference', 'sourceMetadataReference'] as const;
const RECORD_REFERENCE_KEYS = [...SOURCE_REFERENCE_KEYS, 'ticketReference', 'principalReference', 'proposalSlotReference',
  'serverBindingReference', 'jobReference', 'turnReference', 'turnEvidenceReference'] as const;

/**
 * FACADE-V2-R01 on the record side: its own references and the disposition invariants that need no
 * ticket are checked before a future or legacy ticket can turn the pair into an opaque verdict.
 */
function assertRecordCalculableLinks(record: {
  ticketReference: string; principal: unknown; job: unknown; turn: HopAdviceV1PublicTurn; fullEvidence: readonly BrewerEvidence[];
  references: Row; semantic: unknown;
}): void {
  const references = record.references;
  if (!exactKeys(references, RECORD_REFERENCE_KEYS) || RECORD_REFERENCE_KEYS.some(key => !isText(references[key]))) {
    fail('Références du record V2 absentes ou mal formées.');
  }
  const own = recordOwnReferences(record);
  if (references.ticketReference !== record.ticketReference
    || Object.entries(own).some(([key, reference]) => references[key] !== reference)) {
    fail('Références propres du record V2 incohérentes avec son principal, son job, son tour ou ses preuves.');
  }
  const semantic = record.semantic;
  const hasProposal = Object.prototype.hasOwnProperty.call(record.turn, 'hopAdviceProposal');
  if (!isRow(semantic)) fail('Disposition sémantique V2 absente.');
  if (semantic.kind === 'verifiedV6') {
    if (!exactKeys(semantic, ['kind', 'format']) || !isText(semantic.format) || !hasProposal) {
      fail('Disposition V6 sans enveloppe V6 conservée.');
    }
    // The envelope and its evidence are self-verifiable; only its match with Request3 needs the ticket.
    const read = readBrewerHopAdviceProposalEnvelopeV6(record.turn.hopAdviceProposal);
    if (read.status !== 'readOnly' || read.envelope.format !== semantic.format) fail('Disposition V6 posée sur une enveloppe non V6.');
    verifyBrewerHopAdviceSemanticEvidenceV6(read.envelope, record.fullEvidence);
    return;
  }
  if (semantic.kind !== 'opaqueReadOnly' || !hasOnlyKeys(semantic, ['kind', 'status', 'format', 'reason'])
    || !['legacyReadOnly', 'unsupportedReadOnly', 'missingReadOnly'].includes(String(semantic.status)) || !isText(semantic.reason)
    || semantic.format !== undefined && !isText(semantic.format)) {
    fail('Disposition opaque V2 mal formée.');
  }
  if ((semantic.status === 'missingReadOnly') !== !hasProposal || semantic.status === 'missingReadOnly' && semantic.format !== undefined) {
    fail('Disposition « sans proposition » incohérente avec le tour public conservé.');
  }
}

export function hopV55AssistedAdviceRecordV2Reference(value: Omit<HopV55AssistedAdviceRecordV2, 'reference'> | HopV55AssistedAdviceRecordV2): string {
  const { reference: _reference, ...body } = value as HopV55AssistedAdviceRecordV2;
  return contentReference(HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT, body);
}

/** Strict version dispatch: V5 is read by its own reader and remains non-V6/legacy readonly. */
export function readHopV55AssistedAdviceSemanticEnvelopeV2(input: {
  envelope: unknown;
  request: unknown;
  fullEvidence: readonly BrewerEvidence[];
}): HopV55AssistedAdviceSemanticEnvelopeV2Read {
  const v6 = readBrewerHopAdviceProposalEnvelopeV6(input.envelope);
  if (v6.status === 'readOnly') {
    try {
      assertBrewerHopAdviceProposalV6MatchesSource(v6.envelope, input.request);
      verifyBrewerHopAdviceSemanticEvidenceV6(v6.envelope, input.fullEvidence);
      return { status: 'readOnly', envelope: v6.envelope };
    } catch (error) {
      return { status: 'invalid', reason: error instanceof Error ? error.message : 'Envelope V6 ou preuves invalides.' };
    }
  }
  if (v6.status === 'legacyReadOnly' && v6.version === 'v5') {
    const v5 = readBrewerHopAdviceProposalEnvelopeV5(input.envelope);
    if (v5.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(input.envelope), reason: v5.reason };
    if (v5.status !== 'readOnly') return { status: 'invalid', reason: v5.status === 'invalid' ? v5.reason : 'Envelope V5 historique illisible.' };
    try {
      assertBrewerHopAdviceProposalV5MatchesSource(v5.envelope, input.request);
      verifyBrewerHopAdviceSemanticEvidenceV5(v5.envelope, input.fullEvidence);
      return { status: 'legacyReadOnly', format: v5.envelope.format, snapshot: v5.envelope,
        reason: 'Envelope V5 vérifiée sous son propre lecteur; aucun lien V6 n’est reconstruit.' };
    } catch (error) {
      return { status: 'invalid', reason: error instanceof Error ? error.message : 'Envelope V5 historique invalide.' };
    }
  }
  if (v6.status === 'legacyReadOnly') return { status: 'legacyReadOnly', format: 'brewer-hop-advice-proposal-v4',
    snapshot: clone(input.envelope), reason: 'Envelope historique V4 conservée sans conversion.' };
  if (v6.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(input.envelope), reason: v6.reason };
  return { status: 'invalid', reason: v6.reason };
}

function readSemanticDisposition(turn: HopAdviceV1PublicTurn, request: unknown,
  fullEvidence: readonly BrewerEvidence[]): HopV55AssistedAdviceSemanticDispositionV2 {
  if (!Object.prototype.hasOwnProperty.call(turn, 'hopAdviceProposal')) {
    return { kind: 'opaqueReadOnly', status: 'missingReadOnly', reason: 'Le tour public réel ne porte pas de hopAdviceProposal.' };
  }
  const read = readHopV55AssistedAdviceSemanticEnvelopeV2({ envelope: turn.hopAdviceProposal, request, fullEvidence });
  if (read.status === 'invalid') fail(read.reason);
  if (read.status === 'readOnly') return { kind: 'verifiedV6', format: read.envelope.format };
  return { kind: 'opaqueReadOnly', status: read.status, ...(read.status === 'legacyReadOnly' ? { format: read.format } : {}),
    reason: read.reason };
}

function assertSemanticDisposition(stored: unknown, resolved: HopV55AssistedAdviceSemanticDispositionV2): void {
  if (!isRow(stored) || !isText(stored.reason) && stored.kind === 'opaqueReadOnly') {
    fail('Diagnostic ou disposition sémantique V2 absent.');
  }
  if (resolved.kind === 'verifiedV6') {
    if (stored.kind !== 'verifiedV6' || stored.format !== resolved.format || Object.keys(stored).some(key => !['kind', 'format'].includes(key))) {
      fail('Disposition V6 différente de l’enveloppe vérifiée.');
    }
    return;
  }
  if (stored.kind !== 'opaqueReadOnly' || stored.status !== resolved.status || stored.format !== resolved.format
    || Object.keys(stored).some(key => !['kind', 'status', 'format', 'reason'].includes(key))) {
    fail('Disposition opaque différente du format relu sous son contrat.');
  }
  if (resolved.format === undefined && Object.prototype.hasOwnProperty.call(stored, 'format')) fail('Format ajouté à une disposition sans format source.');
}

function exactPersistedTicket(history: readonly unknown[], expected: HopV55AssistedAdviceSemanticTicket,
  principal: HopV55SemanticAdoptionPrincipalV1): HopV55AssistedAdviceSemanticTicket {
  assertPrincipal(principal);
  if (principal.principalId !== expected.principal.principalId || principal.ownerKey !== expected.ownerKey
    || principal.workspaceId !== expected.workspaceId || !same(principal.scope, expected.principal.scope)) {
    fail('Le principal courant ne correspond pas au ticket V2 exact.');
  }
  let found: HopV55AssistedAdviceSemanticTicket | undefined;
  for (const raw of history) {
    const read = ticketView(raw);
    if (read.status === 'invalid') fail(`Historique de tickets invalide : ${read.reason}`);
    if (read.status === 'legacyReadOnly') {
      const legacy = read.snapshot as Partial<HopV55AssistedAdviceTicketV1>;
      if (legacy.ownerKey === principal.ownerKey && legacy.workspaceId === principal.workspaceId
        && (legacy.operationId === expected.operationId || legacy.id === expected.id)) {
        fail('Une demande historique V1 emploie déjà cet ID ou cette opération; aucun mélange V1/V2 implicite.', 'conflict');
      }
      continue;
    }
    if (read.status === 'unsupportedReadOnly') {
      const opaque = isRow(read.snapshot) ? read.snapshot : {};
      if ((opaque.ownerKey === undefined || opaque.ownerKey === principal.ownerKey)
        && (opaque.workspaceId === undefined || opaque.workspaceId === principal.workspaceId)
        && (opaque.operationId === expected.operationId || opaque.id === expected.id || opaque.reference === expected.reference)) {
        fail('Un ticket futur opaque réserve cette opération; aucune reprise courante.', 'unsupportedFormat');
      }
      continue;
    }
    const ticket = read.ticket;
    if (ticket.ownerKey !== principal.ownerKey || ticket.workspaceId !== principal.workspaceId) {
      fail('Ticket V2 historique étranger au workspace courant.');
    }
    if (ticket.operationId === expected.operationId && ticket.reference !== expected.reference
      || ticket.id === expected.id && ticket.reference !== expected.reference) {
      fail('ID/opération V2 déjà scellé avec un autre contenu.', 'conflict');
    }
    if (ticket.reference === expected.reference) {
      if (!same(ticket, expected)) fail('Référence ticket V2 dupliquée avec un contenu différent.', 'conflict');
      found = ticket;
    }
  }
  if (!found) fail('Le ticket V2 exact doit être persisté dans le workspace avant création du record.', 'ticketNotPersisted');
  return found;
}

function readRecordV1(value: unknown, ticketValue: unknown): HopV55AssistedAdviceRecordV2Read {
  const ticket = readHopV55AssistedAdviceTicketV1(ticketValue);
  if (ticket.status === 'invalid') return { status: 'invalid', reason: ticket.reason };
  if (ticket.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone({ ticket: ticket.snapshot, record: value }), reason: ticket.reason };
  const legacy = readHopV55AssistedAdviceRecordV1(value, ticket.ticket, createHopV55AssistedAdviceBackendContractV1());
  if (legacy.status === 'available') return { status: 'legacyReadOnly', format: legacy.record.format, snapshot: clone(legacy.record),
    reason: 'Record V1 validé par son lecteur historique strict; aucune conversion en V2.' };
  if (legacy.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone(legacy.snapshot), reason: legacy.reason };
  return { status: 'invalid', reason: legacy.reason };
}

/** The pure record writer refuses a ticket that is not present in the caller's persisted history snapshot. */
export function createHopV55AssistedAdviceRecordV2(input: {
  id: string;
  recordedAt: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ticket: unknown;
  persistedTickets: readonly unknown[];
  job: unknown;
  turn: unknown;
  fullEvidence: readonly BrewerEvidence[];
}): HopV55AssistedAdviceRecordV2 {
  try {
    if (!isText(input.id) || !isoInstant(input.recordedAt)) fail('ID du record ou instant host invalide.');
    const ticketRead = ticketView(input.ticket);
    if (ticketRead.status === 'unsupportedReadOnly') fail(ticketRead.reason, 'unsupportedFormat');
    if (ticketRead.status !== 'readOnly') fail(ticketRead.status === 'invalid' ? ticketRead.reason : 'Ticket historique V1 non convertible.');
    const ticket = exactPersistedTicket(input.persistedTickets, ticketRead.ticket, input.principal);
    assertPublicJob(input.job);
    assertTurnCommon(input.turn);
    assertEvidenceRows(input.fullEvidence);
    const turn = input.turn as HopAdviceV1PublicTurn;
    if (input.job.protocol !== HOP_ADVICE_PROTOCOL_V1.name || input.job.id !== turn.id
      || input.job.operationId !== ticket.operationId || input.job.generation !== ticket.generation
      || !same(input.job.scope, ticket.scope) || input.job.question !== ticket.question
      || turn.operationId !== ticket.operationId || turn.question !== ticket.question
      || turn.mode !== undefined && turn.mode !== ticket.wire.analysisMode || !same(turn.evidence, input.fullEvidence)) {
      fail('Job/tour réel différent du ticket, de la génération, du scope ou des preuves originales.');
    }
    const semantic = readSemanticDisposition(turn, ticket.request, input.fullEvidence);
    const body: Omit<HopV55AssistedAdviceRecordV2, 'reference'> = {
      format: HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT,
      id: input.id,
      principal: clone(ticket.principal), ownerKey: ticket.ownerKey, workspaceId: ticket.workspaceId,
      operationId: ticket.operationId, generation: ticket.generation, ticketId: ticket.id, ticketReference: ticket.reference,
      recordedAt: input.recordedAt,
      job: clone(input.job) as HopAdviceV1PublicJob,
      turn: clone(turn), semantic,
      fullEvidence: clone(input.fullEvidence),
      references: createHopV55AssistedAdviceRecordReferencesV2({ ticket, job: input.job, turn, fullEvidence: input.fullEvidence }),
    };
    const record = { ...body, reference: hopV55AssistedAdviceRecordV2Reference(body) };
    const checked = recordView(record, ticket);
    if (checked.status !== 'readOnly') fail(checked.status === 'invalid' ? checked.reason : 'Record V2 créé non relisible.');
    return clone(checked.record);
  } catch (error) {
    if (error instanceof HopV55AssistedAdviceArchiveV2Error) throw error;
    throw new HopV55AssistedAdviceArchiveV2Error('invalidInput', error instanceof Error ? error.message : 'Création V2 invalide.');
  }
}

function recordView(value: unknown, ticketValue: unknown): HopV55AssistedAdviceRecordV2Read {
  if (!isRow(value)) return { status: 'invalid', reason: 'Record V2 absent ou illisible.' };
  if (value.format === 'hop-v55-assisted-advice-record-v1') {
    return readRecordV1(value, ticketValue);
  }
  if (typeof value.format !== 'string' || value.format !== HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT) {
    if (typeof value.format === 'string' && value.format.startsWith(RECORD_PREFIX)) {
      try { assertJsonValue(value); return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: `Record futur conservé : ${value.format}.` }; }
      catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Record futur non sérialisable.' }; }
    }
    return { status: 'invalid', reason: 'Format de record assisté inconnu.' };
  }
  try {
    assertJsonValue(value, 'record');
    if (!isText(value.reference)) fail('Référence de record V2 absente.');
    const { reference: _reference, ...body } = value;
    if (hopV55AssistedAdviceRecordV2Reference(body as Omit<HopV55AssistedAdviceRecordV2, 'reference'>) !== value.reference) fail('Sceau du record V2 invalide.');

    const allowed = ['format', 'id', 'principal', 'ownerKey', 'workspaceId', 'operationId', 'generation', 'ticketId', 'ticketReference',
      'recordedAt', 'job', 'turn', 'semantic', 'fullEvidence', 'references', 'reference'];
    if (!exactKeys(value, allowed) || value.format !== HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT || !isText(value.id)
      || !isText(value.ownerKey) || !isText(value.workspaceId) || !isText(value.operationId) || !isText(value.ticketId)
      || !isText(value.ticketReference) || !Number.isSafeInteger(value.generation) || (value.generation as number) < 0
      || !isoInstant(value.recordedAt) || !isRow(value.references)) fail('Structure ou identité du record V2 invalide.');
    assertPrincipal(value.principal);
    assertPublicJob(value.job);
    assertTurnCommon(value.turn);
    assertEvidenceRows(value.fullEvidence);
    if (value.ownerKey !== value.principal.ownerKey || value.workspaceId !== value.principal.workspaceId
      || value.job.operationId !== value.operationId || value.job.generation !== value.generation
      || value.turn.operationId !== value.operationId || value.job.id !== value.turn.id
      || value.job.question !== value.turn.question || !same(value.fullEvidence, value.turn.evidence)) {
      fail('Liens connus du principal, du job, du tour et des preuves divergents.');
    }
    if (isRow(ticketValue)) {
      const capturedPrincipal = isRow(ticketValue.principal) ? ticketValue.principal : undefined;
      const capturedReferences = isRow(ticketValue.references) ? ticketValue.references : undefined;
      const sourceReferenceKeys = ['sourceReadingReference', 'sourceArchiveReference', 'requestReference', 'wireReference',
        'sourceViewReference', 'contextLaunchReference', 'contextProjectionReference', 'sourceMetadataReference'];
      if (isText(ticketValue.ownerKey) && ticketValue.ownerKey !== value.ownerKey
        || isText(ticketValue.workspaceId) && ticketValue.workspaceId !== value.workspaceId
        || isText(ticketValue.operationId) && ticketValue.operationId !== value.operationId
        || Number.isSafeInteger(ticketValue.generation) && ticketValue.generation !== value.generation
        || isText(ticketValue.id) && ticketValue.id !== value.ticketId
        || isText(ticketValue.reference) && ticketValue.reference !== value.ticketReference
        || isText(ticketValue.question) && ticketValue.question !== value.turn.question
        || isRow(ticketValue.scope) && !same(ticketValue.scope, value.job.scope)
        || isRow(ticketValue.wire) && isText(ticketValue.wire.analysisMode)
          && value.turn.mode !== undefined && value.turn.mode !== ticketValue.wire.analysisMode
        || capturedReferences && sourceReferenceKeys.some(key => isText(capturedReferences[key])
          && capturedReferences[key] !== value.references[key])
        || isRow(capturedPrincipal) && (capturedPrincipal.principalId !== value.principal.principalId
          || capturedPrincipal.ownerKey !== value.principal.ownerKey || capturedPrincipal.workspaceId !== value.principal.workspaceId
          || !same(capturedPrincipal.scope, value.principal.scope))) {
        fail('Liens connus du record vers le ticket V2 divergent.');
      }
    }
    assertRecordCalculableLinks({ ticketReference: value.ticketReference as string, principal: value.principal, job: value.job,
      turn: value.turn as HopAdviceV1PublicTurn, fullEvidence: value.fullEvidence as BrewerEvidence[],
      references: value.references as Row, semantic: value.semantic });

    const ticketRead = ticketView(ticketValue);
    if (ticketRead.status === 'legacyReadOnly') fail('Un ticket V1 ne peut pas être relié à un record V2.');
    if (ticketRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone({ ticket: ticketRead.snapshot, record: value }), reason: ticketRead.reason };
    if (ticketRead.status !== 'readOnly') fail(ticketRead.reason);
    const ticket = ticketRead.ticket;
    if (value.ownerKey !== ticket.ownerKey || value.workspaceId !== ticket.workspaceId || value.principal.ownerKey !== ticket.ownerKey
      || value.principal.workspaceId !== ticket.workspaceId || !same(value.principal, ticket.principal)
      || value.operationId !== ticket.operationId || value.generation !== ticket.generation
      || value.ticketId !== ticket.id || value.ticketReference !== ticket.reference
      || value.job.operationId !== ticket.operationId || value.job.generation !== ticket.generation
      || value.job.question !== ticket.question || !same(value.job.scope, ticket.scope)
      || value.turn.operationId !== ticket.operationId || value.turn.question !== ticket.question
      || value.turn.mode !== undefined && value.turn.mode !== ticket.wire.analysisMode
      || value.job.id !== value.turn.id || !same(value.fullEvidence, value.turn.evidence)) {
      fail('Record V2 détaché du ticket, du principal, du job, du tour ou du wire exact.');
    }
    const expectedReferences = createHopV55AssistedAdviceRecordReferencesV2({ ticket, job: value.job, turn: value.turn, fullEvidence: value.fullEvidence });
    if (!exactKeys(value.references, Object.keys(expectedReferences)) || !same(value.references, expectedReferences)) {
      fail('Références internes du record V2 différentes des snapshots conservés.');
    }

    const semantic = readSemanticDisposition(value.turn, ticket.request, value.fullEvidence);
    assertSemanticDisposition(value.semantic, semantic);
    return { status: 'readOnly', record: clone(value as unknown as HopV55AssistedAdviceRecordV2) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Record V2 invalide.' };
  }
}

export function readHopV55AssistedAdviceTicketV2(value: unknown): HopV55AssistedAdviceTicketV2Read {
  return ticketView(value);
}

export function readHopV55AssistedAdviceRecordV2(value: unknown, ticket: unknown): HopV55AssistedAdviceRecordV2Read {
  return recordView(value, ticket);
}

/** Historical display only: validates the stored closure without consulting a current Page or current engine state. */
export function readHopV55AssistedAdviceArchiveV2(input: { ticket: unknown; record: unknown }): HopV55AssistedAdviceArchiveV2Read {
  const ticket = ticketView(input.ticket);
  if (ticket.status === 'legacyReadOnly') {
    const record = recordView(input.record, input.ticket);
    if (record.status === 'legacyReadOnly') return { status: 'legacyReadOnly', snapshot: clone({ ticket: input.ticket, record: input.record }), reason: record.reason };
    if (record.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone({ ticket: input.ticket, record: input.record }), reason: record.reason };
    if (record.status === 'invalid') return { status: 'invalid', reason: record.reason };
    return { status: 'invalid', reason: 'Un record V2 ne peut pas être lié à un ticket V1.' };
  }
  if (ticket.status === 'unsupportedReadOnly') {
    const record = recordView(input.record, input.ticket);
    if (record.status === 'invalid') return { status: 'invalid', reason: record.reason };
    return { status: 'unsupportedReadOnly', snapshot: clone({ ticket: input.ticket, record: input.record }), reason: ticket.reason };
  }
  if (ticket.status !== 'readOnly') return { status: 'invalid', reason: ticket.reason };
  const record = recordView(input.record, ticket.ticket);
  if (record.status === 'legacyReadOnly') return { status: 'legacyReadOnly', snapshot: clone({ ticket: ticket.ticket, record: input.record }), reason: record.reason };
  if (record.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: clone({ ticket: ticket.ticket, record: input.record }), reason: record.reason };
  if (record.status !== 'readOnly') return { status: 'invalid', reason: record.reason };
  return { status: 'readOnly', ticket: ticket.ticket, record: record.record };
}

function readWizardSemanticDisposition(turn: HopAdviceV1PublicTurn, request: BrewerHopAdviceWizardRequestV3,
  fullEvidence: readonly BrewerEvidence[]): HopV55AssistedAdviceSemanticDispositionV2 {
  if (!Object.prototype.hasOwnProperty.call(turn, 'hopAdviceProposal')) {
    return { kind: 'opaqueReadOnly', status: 'missingReadOnly', reason: 'Le tour public exact ne porte pas de hopAdviceProposal.' };
  }
  const read = readBrewerHopAdviceProposalEnvelopeV6ForWizardV1(turn.hopAdviceProposal);
  if (read.status === 'invalid') fail(read.reason);
  if (read.status === 'readOnly') {
    assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1(read.envelope, request);
    verifyBrewerHopAdviceSemanticEvidenceV6ForWizardV1(read.envelope, fullEvidence);
    return { kind: 'verifiedV6', format: read.envelope.format };
  }
  return { kind: 'opaqueReadOnly', status: 'unsupportedReadOnly',
    ...(isRow(read.snapshot) && isText(read.snapshot.format) ? { format: read.snapshot.format } : {}), reason: read.reason };
}

function exactPersistedWizardTicket(history: readonly unknown[], expected: HopV55AssistedAdviceWizardTicketV1,
  principal: HopV55SemanticAdoptionPrincipalV1): HopV55AssistedAdviceWizardTicketV1 {
  assertPrincipal(principal);
  if (principal.principalId !== expected.principal.principalId || principal.ownerKey !== expected.ownerKey
    || principal.workspaceId !== expected.workspaceId || !same(principal.scope, expected.principal.scope)) {
    fail('Le principal courant ne correspond pas au ticket Wizard exact.');
  }
  let found: HopV55AssistedAdviceWizardTicketV1 | undefined;
  for (const raw of history) {
    const read = readHopV55AssistedAdviceWizardTicketV1(raw);
    if (read.status === 'invalid') fail(`Historique Wizard invalide : ${read.reason}`);
    if (read.status === 'unsupportedReadOnly') {
      const opaque = isRow(read.snapshot) ? read.snapshot : {};
      if (opaque.operationId === expected.operationId || opaque.id === expected.id || opaque.reference === expected.reference) {
        fail('Un ticket Wizard futur réserve cette opération; aucune reprise courante.', 'unsupportedFormat');
      }
      continue;
    }
    const ticket = read.ticket;
    if (ticket.ownerKey !== principal.ownerKey || ticket.workspaceId !== principal.workspaceId) {
      fail('Ticket Wizard historique étranger au workspace courant.');
    }
    if ((ticket.operationId === expected.operationId || ticket.id === expected.id) && ticket.reference !== expected.reference) {
      fail('ID/opération Wizard déjà scellé avec un autre contenu.', 'conflict');
    }
    if (ticket.reference === expected.reference) {
      if (!same(ticket, expected)) fail('Référence ticket Wizard dupliquée avec un contenu différent.', 'conflict');
      found = ticket;
    }
  }
  if (!found) fail('Le ticket Wizard exact doit être persisté dans le workspace avant création du record.', 'ticketNotPersisted');
  return found;
}

function wizardRecordReferences(input: {
  ticket: HopV55AssistedAdviceWizardTicketV1;
  job: HopAdviceV1PublicJob;
  turn: HopAdviceV1PublicTurn;
  fullEvidence: readonly BrewerEvidence[];
}): HopV55AssistedAdviceRecordReferencesV2 {
  return { ...input.ticket.references, ticketReference: input.ticket.reference,
    ...recordOwnReferences({ principal: input.ticket.principal, job: input.job, turn: input.turn, fullEvidence: input.fullEvidence }) };
}

export function hopV55AssistedAdviceWizardRecordV1Reference(
  value: Omit<HopV55AssistedAdviceWizardRecordV1, 'reference'> | HopV55AssistedAdviceWizardRecordV1,
): string {
  const { reference: _reference, ...body } = value as HopV55AssistedAdviceWizardRecordV1;
  return contentReference(HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT, body);
}

function wizardRecordView(value: unknown, ticketValue: unknown): HopV55AssistedAdviceWizardRecordV1Read {
  if (!isRow(value) || typeof value.format !== 'string') return { status: 'invalid', reason: 'Record Wizard absent ou illisible.' };
  if (value.format !== HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT) {
    if (value.format.startsWith(RECORD_PREFIX)) {
      try { assertJsonValue(value); return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: `Record futur conservé : ${value.format}.` }; }
      catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Record futur non sérialisable.' }; }
    }
    return { status: 'invalid', reason: 'Format de record Wizard inconnu.' };
  }
  try {
    assertJsonValue(value, 'record Wizard');
    if (!isText(value.reference)) fail('Référence du record Wizard absente.');
    const { reference: _reference, ...body } = value;
    if (hopV55AssistedAdviceWizardRecordV1Reference(body as unknown as HopV55AssistedAdviceWizardRecordV1) !== value.reference) {
      fail('Sceau du record Wizard invalide.');
    }
    const keys = ['format', 'id', 'principal', 'ownerKey', 'workspaceId', 'operationId', 'generation', 'ticketId',
      'ticketReference', 'recordedAt', 'job', 'turn', 'semantic', 'fullEvidence', 'references', 'reference'];
    if (!exactKeys(value, keys) || !isText(value.id) || !isText(value.ownerKey) || !isText(value.workspaceId)
      || !isText(value.operationId) || !isText(value.ticketId) || !isText(value.ticketReference)
      || !Number.isSafeInteger(value.generation) || (value.generation as number) < 0 || !isoInstant(value.recordedAt)
      || !isRow(value.references)) fail('Structure ou identité du record Wizard invalide.');
    assertPrincipal(value.principal);
    assertPublicJob(value.job);
    assertTurnCommon(value.turn);
    assertEvidenceRows(value.fullEvidence);
    if (value.ownerKey !== value.principal.ownerKey || value.workspaceId !== value.principal.workspaceId
      || value.job.operationId !== value.operationId || value.job.generation !== value.generation
      || value.turn.operationId !== value.operationId || value.job.id !== value.turn.id
      || value.job.question !== value.turn.question || !same(value.fullEvidence, value.turn.evidence)) {
      fail('Liens connus du record Wizard, principal, job, tour ou preuves divergents.');
    }
    const ticketRead = readHopV55AssistedAdviceWizardTicketV1(ticketValue);
    if (ticketRead.status === 'invalid') fail(ticketRead.reason);
    if (ticketRead.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly',
      snapshot: clone({ ticket: ticketRead.snapshot, record: value }), reason: ticketRead.reason };
    const ticket = ticketRead.ticket;
    if (value.ownerKey !== ticket.ownerKey || value.workspaceId !== ticket.workspaceId
      || !same(value.principal, ticket.principal) || value.operationId !== ticket.operationId
      || value.generation !== ticket.generation || value.ticketId !== ticket.id || value.ticketReference !== ticket.reference
      || value.job.operationId !== ticket.operationId || value.job.generation !== ticket.generation
      || value.job.question !== ticket.question || !same(value.job.scope, ticket.scope)
      || value.turn.operationId !== ticket.operationId || value.turn.question !== ticket.question
      || value.turn.mode !== undefined && value.turn.mode !== ticket.wire.analysisMode) {
      fail('Record Wizard détaché du ticket, du principal, du job ou du wire exact.');
    }
    const expectedReferences = wizardRecordReferences({ ticket, job: value.job as HopAdviceV1PublicJob,
      turn: value.turn as HopAdviceV1PublicTurn, fullEvidence: value.fullEvidence as BrewerEvidence[] });
    if (!exactKeys(value.references, Object.keys(expectedReferences)) || !same(value.references, expectedReferences)) {
      fail('Références du record Wizard différentes des snapshots conservés.');
    }
    const disposition = readWizardSemanticDisposition(value.turn as HopAdviceV1PublicTurn, ticket.request,
      value.fullEvidence as BrewerEvidence[]);
    assertSemanticDisposition(value.semantic, disposition);
    return { status: 'readOnly', record: clone(value as unknown as HopV55AssistedAdviceWizardRecordV1) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Record Wizard invalide.' };
  }
}

export function createHopV55AssistedAdviceWizardRecordV1(input: {
  id: string;
  recordedAt: string;
  principal: HopV55SemanticAdoptionPrincipalV1;
  ticket: unknown;
  persistedTickets: readonly unknown[];
  job: unknown;
  turn: unknown;
  fullEvidence: readonly BrewerEvidence[];
}): HopV55AssistedAdviceWizardRecordV1 {
  try {
    if (!isText(input.id) || !isoInstant(input.recordedAt)) fail('ID du record Wizard ou instant host invalide.');
    const ticketRead = readHopV55AssistedAdviceWizardTicketV1(input.ticket);
    if (ticketRead.status !== 'readOnly') fail(ticketRead.status === 'invalid' ? ticketRead.reason : ticketRead.reason, 'unsupportedFormat');
    const ticket = exactPersistedWizardTicket(input.persistedTickets, ticketRead.ticket, input.principal);
    assertPublicJob(input.job);
    assertTurnCommon(input.turn);
    assertEvidenceRows(input.fullEvidence);
    const turn = input.turn as HopAdviceV1PublicTurn;
    if (input.job.protocol !== HOP_ADVICE_PROTOCOL_V1.name || input.job.id !== turn.id
      || input.job.operationId !== ticket.operationId || input.job.generation !== ticket.generation
      || !same(input.job.scope, ticket.scope) || input.job.question !== ticket.question
      || turn.operationId !== ticket.operationId || turn.question !== ticket.question
      || turn.mode !== undefined && turn.mode !== ticket.wire.analysisMode || !same(turn.evidence, input.fullEvidence)) {
      fail('Job/tour Wizard différent du ticket, de la génération, du scope ou des preuves d’origine.');
    }
    const semantic = readWizardSemanticDisposition(turn, ticket.request, input.fullEvidence);
    const body: Omit<HopV55AssistedAdviceWizardRecordV1, 'reference'> = {
      format: HOP_V55_ASSISTED_ADVICE_WIZARD_RECORD_V1_FORMAT, id: input.id,
      principal: clone(ticket.principal), ownerKey: ticket.ownerKey, workspaceId: ticket.workspaceId,
      operationId: ticket.operationId, generation: ticket.generation, ticketId: ticket.id,
      ticketReference: ticket.reference, recordedAt: input.recordedAt, job: clone(input.job) as HopAdviceV1PublicJob,
      turn: clone(turn), semantic, fullEvidence: clone(input.fullEvidence),
      references: wizardRecordReferences({ ticket, job: input.job as HopAdviceV1PublicJob, turn, fullEvidence: input.fullEvidence }),
    };
    const record = { ...body, reference: hopV55AssistedAdviceWizardRecordV1Reference(body) };
    const checked = wizardRecordView(record, ticket);
    if (checked.status !== 'readOnly') fail(checked.status === 'invalid' ? checked.reason : checked.reason);
    return clone(checked.record);
  } catch (error) {
    if (error instanceof HopV55AssistedAdviceArchiveV2Error) throw error;
    throw new HopV55AssistedAdviceArchiveV2Error('invalidInput', error instanceof Error ? error.message : 'Création record Wizard invalide.');
  }
}

export function readHopV55AssistedAdviceWizardRecordV1(value: unknown, ticket: unknown): HopV55AssistedAdviceWizardRecordV1Read {
  return wizardRecordView(value, ticket);
}

export function readHopV55AssistedAdviceWizardArchiveV1(input: { ticket: unknown; record: unknown }): HopV55AssistedAdviceWizardArchiveV1Read {
  const ticket = readHopV55AssistedAdviceWizardTicketV1(input.ticket);
  if (ticket.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly',
    snapshot: clone({ ticket: input.ticket, record: input.record }), reason: ticket.reason };
  if (ticket.status !== 'readOnly') return { status: 'invalid', reason: ticket.reason };
  const record = wizardRecordView(input.record, ticket.ticket);
  if (record.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly',
    snapshot: clone({ ticket: ticket.ticket, record: input.record }), reason: record.reason };
  if (record.status !== 'readOnly') return { status: 'invalid', reason: record.reason };
  return { status: 'readOnly', ticket: ticket.ticket, record: record.record };
}
