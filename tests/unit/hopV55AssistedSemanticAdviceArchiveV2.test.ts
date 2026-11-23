import { describe, expect, it } from 'vitest';
import source4Fixture from '../fixtures/source4-contract-fixture.json';
import type { BrewerEvidence } from '../../functions/src/companionTypes';
import { HOP_ADVICE_PROTOCOL_V1, buildHopAdviceV1WireV3, type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn } from '../../functions/src/brewerHopAdviceTransportV1';
import { brewerAdviceFromSemanticProposalV5 } from '../../functions/src/brewerHopAdviceSemanticAdapter';
import {
  BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5,
  createBrewerHopAdviceProposalEnvelopeV5,
} from '../../functions/src/brewerHopAdviceSemanticV3';
import { createBrewerHopAdviceProposalEnvelopeV6 } from '../../functions/src/brewerHopAdviceSemanticV6';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55DecisionReadingArchiveV3 } from '../../src/services/hopV55/decisionArchive';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionScopeDraftsV1 } from '../../src/services/hopV55/questionScopeReading';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import {
  createHopV55DecisionReadingArchiveV4,
  readHopV55QuestionSemanticV1,
} from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import {
  captureHopV55AssistedAdviceTicketV1,
  prepareHopV55AssistedAdviceLaunchV1,
} from '../../src/services/hopV55/assistedAdviceController';
import { prepareHopV55SemanticAssistedAdviceLaunchV1 } from '../../src/services/hopV55/assistedSemanticAdviceContextV4';
import type { HopV55SemanticAdoptionPrincipalV1 } from '../../src/services/hopV55/assistedSemanticAdviceAdoptionV6';
import {
  createHopV55AssistedAdviceRecordV2,
  createHopV55AssistedAdviceTicketV2,
  createHopV55AssistedAdviceTicketV3,
  HOP_V55_ASSISTED_ADVICE_RECORD_V2_FORMAT,
  HOP_V55_ASSISTED_ADVICE_TICKET_V2_FORMAT,
  HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT,
  hopV55AssistedAdviceSemanticTicketReference,
  hopV55AssistedAdviceRecordV2Reference,
  hopV55AssistedAdviceTicketV2Reference,
  readHopV55AssistedAdviceArchiveV2,
  readHopV55AssistedAdviceRecordV2,
  readHopV55AssistedAdviceSemanticEnvelopeV2,
  readHopV55AssistedAdviceTicketV2,
} from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';

const QUESTION = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const OWNER = 'owner:semantic-archive-v2-fixture';
const WORKSPACE = 'workspace:semantic-archive-v2-fixture';
const CREATED_AT = '2026-10-04T12:00:00.000Z';
const withoutReference = (value: Record<string, unknown>) => {
  const { reference: _reference, ...body } = value;
  return body;
};

function setupArchive(sourceResponse?: unknown, question = QUESTION) {
  const context = makeHopV55FixtureContext('unknown');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55QuestionSemanticV1(question, prepared);
  if (sourceResponse !== undefined) reading.response = structuredClone(sourceResponse);
  const sourceArchive = createHopV55DecisionReadingArchiveV4({
    id: 'reading:semantic-archive-v2-fixture', ownerKey: OWNER, workspaceId: WORKSPACE, recordedAt: CREATED_AT,
    reading, source: { kind: 'exploration' }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: WORKSPACE, ownerKey: OWNER, revision: 1,
    title: 'Fixture archive sémantique V2', intent: { question, criteria: [] },
    decisionReadings: [sourceArchive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: CREATED_AT,
  };
  const contextLaunch = prepareHopV55SemanticAssistedAdviceLaunchV1({ archive: sourceArchive, workspace, ownerKey: OWNER,
    workspaceId: WORKSPACE, scopeAtPageLaunch: { kind: 'app', id: 'stocks-hops' }, context });
  if (contextLaunch.status !== 'ready') throw new Error(`Launch source4 fixture invalide : ${JSON.stringify(contextLaunch)}`);
  return { context, prepared, sourceArchive, workspace, request: contextLaunch.request, ownerKey: OWNER, workspaceId: WORKSPACE };
}

function captureTicket(overrides: { sourceResponse?: unknown; operationId?: string; generation?: number; question?: string } = {}) {
  const page = setupArchive(overrides.sourceResponse, overrides.question);
  const operationId = overrides.operationId ?? 'operation-semantic-v2-capture-001';
  const generation = overrides.generation ?? 4;
  const wire = buildHopAdviceV1WireV3({ operationId, question: page.request.question, scope: page.request.contextLaunch.scope,
    analysisMode: 'auto', generation, hopAdvice: page.request });
  const principal: HopV55SemanticAdoptionPrincipalV1 = { principalId: 'principal:host-fixture', ownerKey: OWNER,
    workspaceId: WORKSPACE, scope: structuredClone(wire.scope), label: 'Brasseur fixture' };
  const created = createHopV55AssistedAdviceTicketV2({ id: `ticket:${operationId}`, createdAt: CREATED_AT,
    principal, sourceArchive: page.sourceArchive, wire });
  if (created.status !== 'ready') throw new Error(`Capture ticket V2 invalide : ${JSON.stringify(created)}`);
  return { ...page, operationId, generation, wire, principal, ticket: created.ticket, ticketBytes: created };
}

function captureLegacyV1Ticket() {
  const legacyQuestion = 'Je veux plus de poire et plus de floral. Quand utiliser mes houblons et lesquels pour cette bière d’été ?';
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(legacyQuestion, prepared);
  const scopeDrafts = readHopV55QuestionScopeDraftsV1({ question: legacyQuestion, reading });
  const transition = { actId: 'scope:create:strict-record-v1-reader', kind: 'create' as const,
    reason: 'Fixture V1 pour vérifier le lecteur historique strict.', recordedAt: CREATED_AT,
    actor: { origin: 'user' as const, label: 'Brasseur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question: legacyQuestion, reading, scopeDrafts, transition });
  const recipeId = context.recipe?.id;
  if (!recipeId) throw new Error('La recette de la fixture historique doit porter un ID.');
  const archive = createHopV55DecisionReadingArchiveV3({ id: 'reading:strict-record-v1-reader', ownerKey: OWNER,
    workspaceId: WORKSPACE, recordedAt: CREATED_AT, reading, source: { kind: 'recipe', id: recipeId },
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime), scopeLedger, transition });
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: WORKSPACE, ownerKey: OWNER, revision: 0,
    title: 'Fixture V1 du lecteur strict', intent: { question: legacyQuestion, criteria: [] }, sourceRecipeId: recipeId,
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: CREATED_AT };
  const launch = prepareHopV55AssistedAdviceLaunchV1({ archive, workspace, ownerKey: OWNER, workspaceId: WORKSPACE, context,
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucune matière choisie dans la fixture.' } });
  if (launch.status !== 'ready') throw new Error(`Préparation V1 refusée : ${launch.reason}`);
  const captured = captureHopV55AssistedAdviceTicketV1({ id: 'ticket:strict-record-v1-reader', operationId: 'operation:strict-record-v1-reader',
    createdAt: CREATED_AT, launch: launch.launch });
  if (captured.status !== 'ready') throw new Error(`Capture V1 refusée : ${captured.reason}`);
  return captured.ticket;
}

const evidence: BrewerEvidence[] = [{ id: 'E1', name: 'lookup_style_reference', label: 'Fiche de style fixture',
  facts: ['Référence locale du tour.'], limits: ['Pas une mesure de bière.'], data: { styleId: 'fixture-style' } }];

function createV6Turn(fixture: ReturnType<typeof captureTicket>) {
  const request = fixture.ticket.request;
  const raw = {
    annotationReviews: [], semanticRevisionProposals: [], propertyIntentProposals: [], openQuestions: [], materials: [],
    answer: {
      summary: 'La lecture reste à confirmer par les éléments disponibles.',
      readingNote: 'Le constat rapporté est conservé sans le transformer en mesure.',
      options: [
        { id: 'assist-option-v6-investigation', kind: 'investigation', title: 'Comparer la fiche consultée',
          rationale: 'Cette piste conserve sa provenance documentaire.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: ['E1'] },
        { id: 'assist-option-v6-characterization', kind: 'characterization', title: 'Caractériser un échantillon',
          rationale: 'Une observation resterait distincte d’une cible.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [] },
      ],
      unknowns: [], program: { kind: 'none', note: 'Aucun programme n’est préparé par cette lecture.' }, refusals: [],
    },
    optionProposalLinks: [],
  };
  const envelope = createBrewerHopAdviceProposalEnvelopeV6({ request, prepared: fixture.prepared, raw, evidence,
    serverContext: { phase: fixture.context.phase, provenance: [...fixture.context.provenance], loadedAt: fixture.context.now,
      binding: request.contextLaunch.expected } });
  const job: HopAdviceV1PublicJob = {
    id: `job:${fixture.operationId}`, operationId: fixture.operationId, scope: structuredClone(fixture.wire.scope),
    generation: fixture.generation, question: fixture.wire.question, label: 'Écran de fixture', status: 'done', stage: 'saving',
    createdAt: Date.parse(CREATED_AT), updatedAt: Date.parse(CREATED_AT), finishedAt: Date.parse(CREATED_AT), attempt: 1,
    protocol: HOP_ADVICE_PROTOCOL_V1.name,
  };
  const turn: HopAdviceV1PublicTurn = {
    id: job.id, operationId: fixture.operationId, question: fixture.wire.question,
    advice: brewerAdviceFromSemanticProposalV5(envelope.proposal), evidence: structuredClone(evidence), createdAt: Date.parse(CREATED_AT),
    model: 'gemini-3.8-flash', reviewed: true, reviewModel: 'gemini-2.5-flash', reviewReason: 'fast', mode: 'auto',
    contextLabel: 'Fixture · exploration', protocol: HOP_ADVICE_PROTOCOL_V1.name, hopAdviceProposal: envelope,
  };
  return { job, turn, envelope, raw };
}

function createV5Turn(fixture: ReturnType<typeof captureTicket>) {
  const v6 = createV6Turn(fixture);
  const { optionProposalLinks: _links, ...raw } = structuredClone(v6.raw);
  const envelope = createBrewerHopAdviceProposalEnvelopeV5({ request: fixture.ticket.request, prepared: fixture.prepared, raw,
    evidence, serverContext: { phase: fixture.context.phase, provenance: [...fixture.context.provenance], loadedAt: fixture.context.now,
      binding: fixture.ticket.request.contextLaunch.expected } });
  const turn = { ...v6.turn, advice: brewerAdviceFromSemanticProposalV5(envelope.proposal), hopAdviceProposal: envelope };
  return { job: v6.job, turn, envelope };
}

describe('façade d’archive locale sémantique V2', () => {
  it('capture le vrai wire V3 et la fermeture archive4 entière sans appliquer la borne réseau à l’archive locale', () => {
    const source = (source4Fixture as any).sourceReadingArchive.reading.response;
    if (!source || typeof source.answer !== 'string') throw new Error('La fixture source4 doit contenir une réponse locale connue.');
    const longResponse = structuredClone(source);
    longResponse.answer = longResponse.answer.repeat(8000);
    const f = captureTicket({ sourceResponse: longResponse, operationId: 'operation-semantic-v2-large-archive-01' });
    const localArchiveBytes = new TextEncoder().encode(JSON.stringify(f.ticket.sourceArchive)).byteLength;
    expect(localArchiveBytes).toBeGreaterThan(1_700_000);
    expect(f.ticket.sourceArchive.reading.response).toEqual(longResponse);
    expect(f.ticket.request.question).toBe(f.wire.question);
    expect(f.ticket.request.sourceView.localDerivations.readingResponse).toMatchObject({ state: 'localOnly', path: 'reading.response' });
    expect(f.ticket.wire).toEqual(f.wire);
    expect(f.ticketBytes.wireBytes.utf8Bytes).toBeLessThan(100_000);
    expect(f.ticketBytes.wireBytes.maxDepth).toBeLessThanOrEqual(18);
    expect(readHopV55AssistedAdviceTicketV2(JSON.parse(JSON.stringify(f.ticket)))).toEqual({ status: 'readOnly', ticket: f.ticket });
  });

  it('préserve la question exacte autorisée par Request3 sans trim ni normalisation Unicode', () => {
    const question = 'Question\u0301 avec  double espace, houblon 🌿';
    const f = captureTicket({ question, operationId: 'operation-semantic-v2-unicode-01' });
    expect(f.ticket.question).toBe(question);
    expect(f.ticket.request.question).toBe(question);
    expect(f.ticket.wire.question).toBe(question);
    expect(readHopV55AssistedAdviceTicketV2(JSON.parse(JSON.stringify(f.ticket)))).toMatchObject({ status: 'readOnly', ticket: { question } });
  });

  it('scelle un tour public V6 et toutes ses preuves après que le ticket exact figure dans l’historique persistant', () => {
    const f = captureTicket();
    const { job, turn, envelope } = createV6Turn(f);
    expect(() => createHopV55AssistedAdviceRecordV2({ id: 'record:without-persisted-ticket', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [], job, turn, fullEvidence: evidence }))
      .toThrow(/persisté dans le workspace/);
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:semantic-v2-turn-01', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn, fullEvidence: evidence });
    expect(record.turn.hopAdviceProposal).toEqual(envelope);
    expect(record.turn.evidence).toEqual(evidence);
    expect(record.fullEvidence).toEqual(evidence);
    expect(record.references.requestReference).toBe(f.ticket.references.requestReference);
    expect(record.references.wireReference).toBe(f.ticket.references.wireReference);
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: f.ticket, record: JSON.parse(JSON.stringify(record)) }))
      .toEqual({ status: 'readOnly', ticket: f.ticket, record });
  });

  it('refuse une enveloppe V6 corrompue avant son enfant futur et scelle un futur intact sans le convertir en V6', () => {
    const f = captureTicket();
    const { job, turn } = createV6Turn(f);
    const futureProposal = { format: 'brewer-hop-advice-proposal-v99', opaque: { preserve: ['raw', 'V99'] } };
    const futureTurn = { ...turn, hopAdviceProposal: futureProposal } as unknown as HopAdviceV1PublicTurn;
    const futureRecord = createHopV55AssistedAdviceRecordV2({ id: 'record:future-layer-01', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn: futureTurn, fullEvidence: evidence });
    expect(futureRecord.semantic).toMatchObject({ kind: 'opaqueReadOnly', status: 'unsupportedReadOnly' });
    expect(futureRecord.turn.hopAdviceProposal).toEqual(futureProposal);
    expect(futureRecord.fullEvidence).toEqual(evidence);
    const corruptedFuture = { ...futureRecord, reference: 'known-record-reference-corrupt' };
    expect(readHopV55AssistedAdviceRecordV2(corruptedFuture, f.ticket)).toMatchObject({ status: 'invalid' });
    expect(readHopV55AssistedAdviceRecordV2(futureRecord, f.ticket)).toMatchObject({ status: 'readOnly', record: { semantic: futureRecord.semantic } });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: f.ticket, record: futureRecord })).toMatchObject({ status: 'readOnly', record: futureRecord });

    const futureTicket = structuredClone(f.ticket) as any;
    futureTicket.wire.hopAdvice = { format: 'brewer-hop-advice-request-v99', question: futureTicket.question,
      sourceReadingReference: futureTicket.references.sourceReadingReference, opaque: { keep: true } };
    futureTicket.request = structuredClone(futureTicket.wire.hopAdvice);
    futureTicket.references.wireReference = hopAdviceContentReference('hop-v55-assisted-advice-wire-v3-v2', {
      protocol: HOP_ADVICE_PROTOCOL_V1, wire: futureTicket.wire,
    });
    futureTicket.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(futureTicket));
    expect(readHopV55AssistedAdviceTicketV2({ ...futureTicket, reference: 'known-ticket-reference-corrupt' })).toMatchObject({ status: 'invalid' });
    expect(readHopV55AssistedAdviceTicketV2(futureTicket)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureTicket });
  });

  it('conserve un vrai tour V5 comme opaque readonly avec le tour et les preuves exacts', () => {
    const f = captureTicket();
    const { job, turn, envelope } = createV5Turn(f);
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:v5-opaque-01', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn, fullEvidence: evidence });
    expect(record.semantic).toEqual({ kind: 'opaqueReadOnly', status: 'legacyReadOnly',
      format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5, reason: 'Envelope V5 vérifiée sous son propre lecteur; aucun lien V6 n’est reconstruit.' });
    expect(record.turn).toEqual(turn);
    expect(record.turn.hopAdviceProposal).toEqual(envelope);
    expect(record.fullEvidence).toEqual(evidence);
    const read = readHopV55AssistedAdviceArchiveV2({ ticket: f.ticket, record: JSON.parse(JSON.stringify(record)) });
    expect(read).toMatchObject({ status: 'readOnly', record: { semantic: { kind: 'opaqueReadOnly', status: 'legacyReadOnly' } } });
    const diagnosticEdited = structuredClone(record) as any;
    diagnosticEdited.semantic.reason = 'Diagnostic capturé par une version antérieure du lecteur.';
    diagnosticEdited.reference = hopV55AssistedAdviceRecordV2Reference(withoutReference(diagnosticEdited));
    expect(readHopV55AssistedAdviceRecordV2(diagnosticEdited, f.ticket)).toMatchObject({ status: 'readOnly' });
    const wrongDisposition = structuredClone(record) as any;
    wrongDisposition.semantic.status = 'unsupportedReadOnly';
    wrongDisposition.reference = hopV55AssistedAdviceRecordV2Reference(withoutReference(wrongDisposition));
    expect(readHopV55AssistedAdviceRecordV2(wrongDisposition, f.ticket)).toMatchObject({ status: 'invalid' });
  });

  it('refuse les liens hôte connus altérés avant le retour opaque d’une Request3 ou archive future', () => {
    const f = captureTicket();
    const futureArchive = { format: 'hop-v55-decision-reading-v99', ownerKey: OWNER, workspaceId: WORKSPACE,
      contentReference: f.ticket.references.sourceArchiveReference };
    const badOwner = structuredClone(f.ticket) as any;
    badOwner.ownerKey = 'owner:changed';
    badOwner.sourceArchive = futureArchive;
    badOwner.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(badOwner));
    expect(readHopV55AssistedAdviceTicketV2(badOwner)).toMatchObject({ status: 'invalid' });

    const badScope = structuredClone(f.ticket) as any;
    badScope.sourceArchive = futureArchive;
    badScope.scope.id = 'another-app';
    badScope.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(badScope));
    expect(readHopV55AssistedAdviceTicketV2(badScope)).toMatchObject({ status: 'invalid' });

    const badWireQuestion = structuredClone(f.ticket) as any;
    badWireQuestion.sourceArchive = futureArchive;
    badWireQuestion.wire.question = `${badWireQuestion.question} altérée`;
    badWireQuestion.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(badWireQuestion));
    expect(readHopV55AssistedAdviceTicketV2(badWireQuestion)).toMatchObject({ status: 'invalid' });

    const futureRequest = { format: 'brewer-hop-advice-request-v99', question: `${f.ticket.question} altérée`,
      sourceReadingReference: f.ticket.references.sourceReadingReference, opaque: { preserve: true } };
    const badFutureQuestion = structuredClone(f.ticket) as any;
    badFutureQuestion.request = futureRequest;
    badFutureQuestion.wire.hopAdvice = futureRequest;
    badFutureQuestion.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(badFutureQuestion));
    expect(readHopV55AssistedAdviceTicketV2(badFutureQuestion)).toMatchObject({ status: 'invalid' });

    const sameQuestionFutureRequest = { format: 'brewer-hop-advice-request-v99', question: f.ticket.question,
      sourceReadingReference: f.ticket.references.sourceReadingReference, opaque: { revision: 'A' } };
    const badWireDigest = structuredClone(f.ticket) as any;
    badWireDigest.request = sameQuestionFutureRequest;
    badWireDigest.wire.hopAdvice = sameQuestionFutureRequest;
    badWireDigest.references.wireReference = 'wrong-known-wire-reference';
    badWireDigest.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(badWireDigest));
    expect(readHopV55AssistedAdviceTicketV2(badWireDigest)).toMatchObject({ status: 'invalid' });

    const divergentRequests = structuredClone(f.ticket) as any;
    divergentRequests.request = sameQuestionFutureRequest;
    divergentRequests.wire.hopAdvice = { ...sameQuestionFutureRequest, opaque: { revision: 'B' } };
    divergentRequests.references.wireReference = hopAdviceContentReference('hop-v55-assisted-advice-wire-v3-v2', {
      protocol: HOP_ADVICE_PROTOCOL_V1, wire: divergentRequests.wire,
    });
    divergentRequests.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(divergentRequests));
    expect(readHopV55AssistedAdviceTicketV2(divergentRequests)).toMatchObject({ status: 'invalid' });

    const { job, turn } = createV6Turn(f);
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:known-link-before-ticket-future', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn, fullEvidence: evidence });
    const futureTicketForRecord = structuredClone(f.ticket) as any;
    futureTicketForRecord.request = sameQuestionFutureRequest;
    futureTicketForRecord.wire.hopAdvice = sameQuestionFutureRequest;
    futureTicketForRecord.references.wireReference = hopAdviceContentReference('hop-v55-assisted-advice-wire-v3-v2', {
      protocol: HOP_ADVICE_PROTOCOL_V1, wire: futureTicketForRecord.wire,
    });
    futureTicketForRecord.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(futureTicketForRecord));
    const corruptedRecord = structuredClone(record) as any;
    corruptedRecord.ticketReference = futureTicketForRecord.reference;
    corruptedRecord.references.ticketReference = futureTicketForRecord.reference;
    corruptedRecord.references.wireReference = futureTicketForRecord.references.wireReference;
    corruptedRecord.job.id = 'job:detached-from-turn';
    corruptedRecord.references.jobReference = hopAdviceContentReference('hop-v55-assisted-advice-public-job-v2', corruptedRecord.job);
    corruptedRecord.reference = hopV55AssistedAdviceRecordV2Reference(withoutReference(corruptedRecord));
    expect(readHopV55AssistedAdviceRecordV2(corruptedRecord, futureTicketForRecord)).toMatchObject({ status: 'invalid' });
  });

  it('ignore le label affiché qui change après la capture mais refuse un autre principal ou scope', () => {
    const f = captureTicket();
    const { job, turn } = createV6Turn(f);
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:label-changed-01', recordedAt: CREATED_AT,
      principal: { ...f.principal, label: 'Nom affiché actualisé' }, ticket: f.ticket, persistedTickets: [f.ticket], job, turn,
      fullEvidence: evidence });
    expect(record.principal).toEqual(f.principal);
    expect(() => createHopV55AssistedAdviceRecordV2({ id: 'record:principal-changed-01', recordedAt: CREATED_AT,
      principal: { ...f.principal, principalId: 'principal:other' }, ticket: f.ticket, persistedTickets: [f.ticket], job, turn,
      fullEvidence: evidence })).toThrow(/principal courant/);
    expect(() => createHopV55AssistedAdviceRecordV2({ id: 'record:scope-changed-01', recordedAt: CREATED_AT,
      principal: { ...f.principal, scope: { kind: 'app', id: 'other-app' } }, ticket: f.ticket, persistedTickets: [f.ticket], job, turn,
      fullEvidence: evidence })).toThrow(/principal courant/);
  });

  it('conserve comme opaque un tour public sans hopAdviceProposal ni mode, sans compléter le snapshot', () => {
    const f = captureTicket();
    const { job, turn } = createV6Turn(f);
    const { hopAdviceProposal: _proposal, mode: _mode, ...historicalTurn } = turn;
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:missing-proposal-01', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn: historicalTurn, fullEvidence: evidence });
    expect(record.semantic).toMatchObject({ kind: 'opaqueReadOnly', status: 'missingReadOnly' });
    expect(record.turn).not.toHaveProperty('hopAdviceProposal');
    expect(record.turn).not.toHaveProperty('mode');
    expect(readHopV55AssistedAdviceRecordV2(JSON.parse(JSON.stringify(record)), f.ticket)).toMatchObject({ status: 'readOnly' });
  });

  it('conserve sans plafond local les preuves complètes d’un tour opaque au-delà de quarante entrées', () => {
    const f = captureTicket();
    const { job, turn } = createV6Turn(f);
    const rawEvidence = { ...structuredClone(evidence[0]), label: ' Fiche brute\n', facts: [' Source brute \nmultiligne '],
      limits: [' Limite brute\n'] };
    const manyEvidence: BrewerEvidence[] = [rawEvidence, ...Array.from({ length: 40 }, (_, index) => ({ id: `E${index + 2}`,
      name: 'lookup_style_reference', label: `Fiche locale ${index + 2}`, facts: ['Source locale.'], limits: ['Pas une mesure.'],
      data: { styleId: `fixture-style-${index + 2}` } }))];
    const withAllEvidence = { ...turn, evidence: manyEvidence,
      hopAdviceProposal: { format: 'brewer-hop-advice-proposal-v99', raw: ['entire future payload'] } } as unknown as HopAdviceV1PublicTurn;
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:full-evidence-41', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn: withAllEvidence, fullEvidence: manyEvidence });
    expect(record.semantic).toMatchObject({ kind: 'opaqueReadOnly', status: 'unsupportedReadOnly' });
    expect(record.turn.hopAdviceProposal).toEqual({ format: 'brewer-hop-advice-proposal-v99', raw: ['entire future payload'] });
    expect(record.fullEvidence).toHaveLength(41);
    expect(record.turn.evidence[0]).toEqual(rawEvidence);
    expect(record.fullEvidence[0]).toEqual(rawEvidence);
    expect(readHopV55AssistedAdviceRecordV2(JSON.parse(JSON.stringify(record)), f.ticket)).toMatchObject({ status: 'readOnly' });
  });

  it('ne traite pas un format V1 malformé comme un record historique valide', () => {
    const legacyTicket = captureLegacyV1Ticket();
    const malformedLegacyRecord = { format: 'hop-v55-assisted-advice-record-v1' };
    expect(readHopV55AssistedAdviceRecordV2(malformedLegacyRecord, legacyTicket)).toMatchObject({ status: 'invalid' });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: legacyTicket, record: malformedLegacyRecord })).toMatchObject({ status: 'invalid' });

    const f = captureTicket();
    const { job, turn } = createV6Turn(f);
    const validRecord = createHopV55AssistedAdviceRecordV2({ id: 'record:ticket-future-bad-record', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn, fullEvidence: evidence });
    const futureRequest = { format: 'brewer-hop-advice-request-v99', question: f.ticket.question,
      sourceReadingReference: f.ticket.references.sourceReadingReference, opaque: { preserve: true } };
    const futureTicket = structuredClone(f.ticket) as any;
    futureTicket.request = futureRequest;
    futureTicket.wire.hopAdvice = futureRequest;
    futureTicket.references.wireReference = hopAdviceContentReference('hop-v55-assisted-advice-wire-v3-v2', {
      protocol: HOP_ADVICE_PROTOCOL_V1, wire: futureTicket.wire,
    });
    futureTicket.reference = hopV55AssistedAdviceTicketV2Reference(withoutReference(futureTicket));
    expect(readHopV55AssistedAdviceTicketV2(futureTicket)).toMatchObject({ status: 'unsupportedReadOnly' });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: futureTicket,
      record: { ...validRecord, reference: 'known-corrupt-record-seal' } })).toMatchObject({ status: 'invalid' });
  });

  it('relit le V5 avec son lecteur strict readonly sans reconstruire une enveloppe V6', () => {
    const f = captureTicket();
    const { raw: rawV6 } = createV6Turn(f);
    const { optionProposalLinks: _v6Links, ...rawV5 } = structuredClone(rawV6);
    const v5 = createBrewerHopAdviceProposalEnvelopeV5({ request: f.ticket.request, prepared: f.prepared, raw: rawV5,
      evidence, serverContext: { phase: f.context.phase, provenance: [...f.context.provenance], loadedAt: f.context.now,
        binding: f.ticket.request.contextLaunch.expected } });
    const read = readHopV55AssistedAdviceSemanticEnvelopeV2({ envelope: JSON.parse(JSON.stringify(v5)),
      request: f.ticket.request, fullEvidence: evidence });
    expect(read).toMatchObject({ status: 'legacyReadOnly', format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5, snapshot: v5 });
    if (read.status !== 'legacyReadOnly') throw new Error('V5 doit rester une lecture historique stricte.');
    expect(read.snapshot).not.toHaveProperty('proposal.optionProposalLinks');
  });
});

const POLICY = { kind: 'explicit' as const, materialIds: ['variety:fixture-a'], basis: 'Choix local explicite du brasseur avant envoi.' };

/** V2 and V3 captured from the same page and wire: only the format and the sealed local policy may differ. */
function captureBothTickets(candidatePolicy: unknown, operationId = 'operation-semantic-v3-policy-01') {
  const f = captureTicket({ operationId });
  const v3 = createHopV55AssistedAdviceTicketV3({ id: `ticket:${operationId}`, createdAt: CREATED_AT, principal: f.principal,
    sourceArchive: f.sourceArchive, wire: f.wire, candidatePolicy });
  return { ...f, v3 };
}

function resealTicket(ticket: any): any {
  ticket.reference = hopV55AssistedAdviceSemanticTicketReference(withoutReference(ticket) as any);
  return ticket;
}

/** Future Request99 that keeps the known question, source reading and context-launch snapshot of the original. */
function futureRequestTicket(f: ReturnType<typeof captureTicket>, mutate?: (ticket: any) => void) {
  const request99 = { format: 'brewer-hop-advice-request-v99', question: f.ticket.question,
    sourceReadingReference: f.ticket.references.sourceReadingReference,
    contextLaunch: structuredClone(f.ticket.request.contextLaunch), opaque: { child: 'V99' } };
  const ticket = structuredClone(f.ticket) as any;
  ticket.request = structuredClone(request99);
  ticket.wire.hopAdvice = structuredClone(request99);
  ticket.references.wireReference = hopAdviceContentReference('hop-v55-assisted-advice-wire-v3-v2', {
    protocol: HOP_ADVICE_PROTOCOL_V1, wire: ticket.wire,
  });
  mutate?.(ticket);
  return resealTicket(ticket);
}

/** Relinks a known V2 record to another ticket exactly as a future writer would, keeping its own snapshots. */
function relinkRecord(record: unknown, ticket: any, mutate?: (record: any) => void) {
  const relinked = structuredClone(record) as any;
  relinked.ticketReference = ticket.reference;
  relinked.references = { ...relinked.references, ...ticket.references, ticketReference: ticket.reference };
  mutate?.(relinked);
  relinked.reference = hopV55AssistedAdviceRecordV2Reference(withoutReference(relinked));
  return relinked;
}

describe('#66 — politique de candidats locale scellée dans le ticket V3', () => {
  it('scelle la politique choisie avant envoi sans toucher Request3, le wire ni leurs références', () => {
    const f = captureBothTickets(POLICY);
    if (f.v3.status !== 'ready') throw new Error(`Ticket V3 attendu : ${JSON.stringify(f.v3)}`);
    const v3 = f.v3.ticket;
    expect(v3.format).toBe(HOP_V55_ASSISTED_ADVICE_TICKET_V3_FORMAT);
    expect(v3.candidatePolicy).toEqual(POLICY);
    expect(v3.request).toEqual(f.ticket.request);
    expect(v3.wire).toEqual(f.ticket.wire);
    expect(v3.references).toEqual(f.ticket.references);
    expect(f.v3.wireBytes).toEqual(f.ticketBytes.wireBytes);
    expect(v3.request).not.toHaveProperty('candidatePolicy');
    expect(JSON.stringify(v3.wire)).not.toContain(POLICY.basis);
    expect(v3.reference).not.toBe(f.ticket.reference);
    expect(readHopV55AssistedAdviceTicketV2(JSON.parse(JSON.stringify(v3)))).toEqual({ status: 'readOnly', ticket: v3 });

    const v2 = readHopV55AssistedAdviceTicketV2(JSON.parse(JSON.stringify(f.ticket)));
    expect(v2).toMatchObject({ status: 'readOnly', ticket: { format: HOP_V55_ASSISTED_ADVICE_TICKET_V2_FORMAT } });
    if (v2.status === 'readOnly') expect(v2.ticket).not.toHaveProperty('candidatePolicy');

    const { job, turn } = createV6Turn({ ...f, ticket: v3 as any });
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:v3-policy-01', recordedAt: CREATED_AT, principal: f.principal,
      ticket: v3, persistedTickets: [v3], job, turn, fullEvidence: evidence });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: JSON.parse(JSON.stringify(v3)), record: JSON.parse(JSON.stringify(record)) }))
      .toEqual({ status: 'readOnly', ticket: v3, record });
  });

  it.each([
    ['absente', undefined],
    ['nulle', null],
    ['sans motif', { kind: 'explicit', materialIds: [] }],
    ['motif vide', { kind: 'explicit', materialIds: [], basis: '' }],
    ['matière dupliquée', { kind: 'explicit', materialIds: ['variety:a', 'variety:a'], basis: 'Choix.' }],
    ['découverte sans périmètre', { kind: 'discover', materialIds: [], basis: 'Tout le catalogue.' }],
    ['genre inventé', { kind: 'all', materialIds: [], basis: 'Défaut.' }],
    ['champ étendu', { kind: 'explicit', materialIds: [], basis: 'Choix.', default: true }],
  ])('refuse une politique %s avant toute capture', (_label, candidatePolicy) => {
    const f = captureBothTickets(candidatePolicy, 'operation-semantic-v3-policy-invalid');
    expect(f.v3).toMatchObject({ status: 'invalid' });
    expect(f.v3).not.toHaveProperty('ticket');
  });

  it('garde le V2 sans politique et refuse toute politique glissée, retirée ou altérée', () => {
    const f = captureBothTickets(POLICY);
    if (f.v3.status !== 'ready') throw new Error('Ticket V3 attendu.');
    const smuggled = resealTicket({ ...structuredClone(f.ticket), candidatePolicy: structuredClone(POLICY) });
    expect(readHopV55AssistedAdviceTicketV2(smuggled)).toMatchObject({ status: 'invalid' });
    const { candidatePolicy: _policy, ...withoutPolicy } = structuredClone(f.v3.ticket) as any;
    expect(readHopV55AssistedAdviceTicketV2(resealTicket(withoutPolicy))).toMatchObject({ status: 'invalid' });
    const altered = structuredClone(f.v3.ticket) as any;
    altered.candidatePolicy.basis = 'Politique réécrite après envoi.';
    expect(readHopV55AssistedAdviceTicketV2(altered)).toMatchObject({ status: 'invalid' });
    const downgraded = resealTicket({ ...structuredClone(f.v3.ticket), format: HOP_V55_ASSISTED_ADVICE_TICKET_V2_FORMAT });
    expect(readHopV55AssistedAdviceTicketV2(downgraded)).toMatchObject({ status: 'invalid' });
  });
});

describe('#65 FACADE-V2-R01 — références connues contrôlées avant tout verdict futur', () => {
  it('rend invalide une projection de contexte connue et altérée sous une Request99, intact restant futur', () => {
    const f = captureTicket();
    const intact = futureRequestTicket(f);
    expect(readHopV55AssistedAdviceTicketV2(intact)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: intact });
    const badProjection = futureRequestTicket(f, ticket => {
      ticket.references.contextProjectionReference = hopAdviceContentReference('hop-v55-assisted-context-projection-v1', { altered: true });
    });
    expect(readHopV55AssistedAdviceTicketV2(badProjection))
      .toMatchObject({ status: 'invalid', reason: expect.stringMatching(/contextProjectionReference/) });
    const badLaunch = futureRequestTicket(f, ticket => {
      ticket.references.contextLaunchReference = hopAdviceContentReference('hop-v55-assisted-context-launch-v1', { altered: true });
    });
    expect(readHopV55AssistedAdviceTicketV2(badLaunch)).toMatchObject({ status: 'invalid' });

    const { job, turn } = createV6Turn(f);
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:r01-dispatcher', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn, fullEvidence: evidence });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: intact, record: relinkRecord(record, intact) }))
      .toMatchObject({ status: 'unsupportedReadOnly' });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: badProjection, record: relinkRecord(record, badProjection) }))
      .toMatchObject({ status: 'invalid' });
    expect(readHopV55AssistedAdviceRecordV2(relinkRecord(record, badProjection), badProjection)).toMatchObject({ status: 'invalid' });
  });

  it('contrôle les références enfant d’une Request3 connue même quand l’archive est future', () => {
    const f = captureTicket();
    const futureArchive = { format: 'hop-v55-decision-reading-v99', ownerKey: OWNER, workspaceId: WORKSPACE,
      contentReference: f.ticket.references.sourceArchiveReference, opaque: { retained: true } };
    const withFutureArchive = (mutate?: (ticket: any) => void) => {
      const ticket = structuredClone(f.ticket) as any;
      ticket.sourceArchive = structuredClone(futureArchive);
      mutate?.(ticket);
      return resealTicket(ticket);
    };
    expect(readHopV55AssistedAdviceTicketV2(withFutureArchive())).toMatchObject({ status: 'unsupportedReadOnly' });
    for (const key of ['requestReference', 'sourceViewReference', 'sourceMetadataReference', 'contextProjectionReference']) {
      expect(readHopV55AssistedAdviceTicketV2(withFutureArchive(ticket => { ticket.references[key] = `${ticket.references[key]}-altered`; })))
        .toMatchObject({ status: 'invalid', reason: expect.stringContaining(key) });
    }
  });

  it('vérifie les références propres et la disposition du record avant le verdict opaque d’un ticket futur', () => {
    const f = captureTicket();
    const intact = futureRequestTicket(f);
    const { job, turn } = createV6Turn(f);
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:r01-own-links', recordedAt: CREATED_AT,
      principal: f.principal, ticket: f.ticket, persistedTickets: [f.ticket], job, turn, fullEvidence: evidence });
    expect(readHopV55AssistedAdviceRecordV2(relinkRecord(record, intact), intact)).toMatchObject({ status: 'unsupportedReadOnly' });

    const badJob = relinkRecord(record, intact, rec => {
      rec.references.jobReference = hopAdviceContentReference('hop-v55-assisted-advice-public-job-v2', { altered: true });
    });
    expect(readHopV55AssistedAdviceRecordV2(badJob, intact)).toMatchObject({ status: 'invalid' });
    const badEvidence = relinkRecord(record, intact, rec => {
      rec.references.turnEvidenceReference = hopAdviceContentReference('hop-v55-assisted-advice-full-evidence-v2', []);
    });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: intact, record: badEvidence })).toMatchObject({ status: 'invalid' });

    const v6WithoutProposal = relinkRecord(record, intact, rec => {
      delete rec.turn.hopAdviceProposal;
      rec.references.proposalSlotReference = hopAdviceContentReference('hop-v55-assisted-advice-proposal-slot-v2', { present: false });
      rec.references.serverBindingReference = hopAdviceContentReference('hop-v55-assisted-advice-server-binding-slot-v2', { present: false });
      rec.references.turnReference = hopAdviceContentReference('hop-v55-assisted-advice-public-turn-v2', rec.turn);
    });
    expect(v6WithoutProposal.semantic).toEqual({ kind: 'verifiedV6', format: 'brewer-hop-advice-proposal-v6' });
    expect(readHopV55AssistedAdviceRecordV2(v6WithoutProposal, intact)).toMatchObject({ status: 'invalid' });

    const missingButPresent = relinkRecord(record, intact, rec => {
      rec.semantic = { kind: 'opaqueReadOnly', status: 'missingReadOnly', reason: 'Sans proposition déclarée.' };
    });
    expect(readHopV55AssistedAdviceRecordV2(missingButPresent, intact)).toMatchObject({ status: 'invalid' });
  });
});

describe('#65 R01b — lien connu des références archive/lecture sous Archive99', () => {
  function archive99Ticket(ticket: any, divergentSourceReference: boolean) {
    const changed = structuredClone(ticket);
    changed.sourceArchive = { format: 'hop-v55-decision-reading-v99', ownerKey: OWNER, workspaceId: WORKSPACE,
      opaque: { preserve: ['Archive99', 'sans contentReference'] } };
    if (divergentSourceReference) changed.references.sourceArchiveReference = `${changed.references.sourceReadingReference}:other`;
    return resealTicket(changed);
  }

  it('rejects les références parent divergentes pour V2, V3 et un record relinké, tout en gardant Archive99 intact readonly', () => {
    const base = captureBothTickets(POLICY);
    if (base.v3.status !== 'ready') throw new Error('Ticket V3 attendu.');
    const v2Good = readHopV55AssistedAdviceTicketV2(base.ticket);
    const v3Good = readHopV55AssistedAdviceTicketV2(base.v3.ticket);
    expect(v2Good).toMatchObject({ status: 'readOnly' });
    expect(v3Good).toMatchObject({ status: 'readOnly' });

    const v2FutureIntact = archive99Ticket(base.ticket, false);
    const v2FutureRead = readHopV55AssistedAdviceTicketV2(v2FutureIntact);
    expect(v2FutureRead).toMatchObject({ status: 'unsupportedReadOnly', snapshot: v2FutureIntact });
    if (v2FutureRead.status === 'unsupportedReadOnly') expect(v2FutureRead.snapshot).toEqual(v2FutureIntact);
    const v2Divergent = archive99Ticket(base.ticket, true);
    expect(readHopV55AssistedAdviceTicketV2(v2Divergent)).toMatchObject({
      status: 'invalid', reason: expect.stringMatching(/sourceArchiveReference|sourceReadingReference/),
    });

    const v3FutureIntact = archive99Ticket(base.v3.ticket, false);
    expect(readHopV55AssistedAdviceTicketV2(v3FutureIntact)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: v3FutureIntact });
    const v3Divergent = archive99Ticket(base.v3.ticket, true);
    expect(readHopV55AssistedAdviceTicketV2(v3Divergent)).toMatchObject({
      status: 'invalid', reason: expect.stringMatching(/sourceArchiveReference|sourceReadingReference/),
    });

    const { job, turn } = createV6Turn({ ...base, ticket: base.v3.ticket } as any);
    const record = createHopV55AssistedAdviceRecordV2({ id: 'record:archive99-parent-link', recordedAt: CREATED_AT,
      principal: base.principal, ticket: base.v3.ticket, persistedTickets: [base.v3.ticket], job, turn, fullEvidence: evidence });
    const relinkedFuture = relinkRecord(record, v3Divergent);
    expect(readHopV55AssistedAdviceRecordV2(relinkedFuture, v3Divergent)).toMatchObject({ status: 'invalid' });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket: v3Divergent, record: relinkedFuture })).toMatchObject({ status: 'invalid' });
  });
});
