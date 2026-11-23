import { describe, expect, it, vi } from 'vitest';
import type { BrewerChatInput, BrewerTurn } from '../../functions/src/companionTypes';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import * as decisionModule from '../../src/services/hopV55/decision';
import * as assistedProposalModule from '../../src/services/hopV55/assistedAdviceProposal';
import {
  createHopV55DecisionReadingArchiveV3,
  hopV55DecisionReadingForDisplay,
  type HopV55DecisionReadingArchiveV3,
} from '../../src/services/hopV55/decisionArchive';
import {
  createHopV55QuestionScopeLedgerV1,
  readHopV55QuestionScopeDraftsV1,
} from '../../src/services/hopV55/questionScopeReading';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import {
  createHopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4,
} from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { prepareCorrectionV4, upgradeV3ToV4 } from '../../src/services/hopV55/propertyAdvicePreparationV4';
import {
  beforeSubmitHopV55AssistedAdvice,
  captureHopV55AssistedAdviceTicketV1,
  confirmHopV55AssistedAdviceSuggestion,
  prepareHopV55AssistedAdviceLaunchV1,
  readHopV55AssistedAdviceHistory,
  readHopV55AssistedAdviceTicketV1,
  receiveHopV55AssistedAdvice,
} from '../../src/services/hopV55/assistedAdviceController';
import { createBrewerHopAdviceProposalEnvelope } from '../../functions/src/brewerHopAdviceProposal';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';

const ownerKey = 'owner:assisted-controller-fixture';
const workspaceId = 'workspace:assisted-controller-fixture';
const createdAt = '2026-10-04T09:00:00.000Z';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie explicitement.' };
const question = 'Je veux plus de poire et plus de floral. Quand utiliser mes houblons et lesquels pour cette bière d’été ?';

function transition(input: { kind: 'upgradeV3' | 'revise'; parentRecordReference: string; parentReadingReference: string; actId: string }) {
  return { ...input, reason: 'Confirmation explicite dans le test de service.', actor: { origin: 'user' as const, label: 'Brasseur fixture' }, recordedAt: createdAt };
}

function sealV4(result: ReturnType<typeof prepareCorrectionV4>): HopV55PropertyAdviceAnswerRecordV4 {
  if (result.status === 'ready') {
    const answerSnapshot = buildHopPropertyAdviceV3(result.requestDraftV3.requestSnapshot);
    return createHopV55PropertyAdviceAnswerRecordV4({ draft: result.recordDraft, outcome: {
      kind: 'domainAnswer', requestDraftReference: result.requestDraftV3.reference, answerSnapshot,
      answerReference: answerSnapshot.reference,
    } });
  }
  return createHopV55PropertyAdviceAnswerRecordV4({ draft: result.recordDraft, outcome: { kind: 'allRejected' } });
}

function setup() {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(question, prepared);
  const scopeDrafts = readHopV55QuestionScopeDraftsV1({ question, reading });
  expect(scopeDrafts.map(scope => scope.kind)).toEqual(expect.arrayContaining(['employmentTiming', 'materialSelection']));
  const scopeTransition = { actId: 'create:reading', kind: 'create' as const,
    reason: 'Portées lues dans la question source.', recordedAt: createdAt,
    actor: { origin: 'user' as const, label: 'Brasseur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({
    question, reading, scopeDrafts, transition: scopeTransition,
  });
  const scope = { kind: 'recipe' as const, id: context.recipe!.id! };
  const archive = createHopV55DecisionReadingArchiveV3({
    id: 'reading:assisted-controller', ownerKey, workspaceId, recordedAt: createdAt, reading,
    source: { kind: 'recipe', id: scope.id }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
    scopeLedger, transition: scopeTransition,
  });
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: 'request:parent', ownerKey,
    workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy });
  const answerSnapshot = buildHopPropertyAdviceV3(draft.requestSnapshot);
  const parentRecord = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot, answerRecordId: 'answer:parent' });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 4, title: 'Fixture conseil assisté',
    intent: { question, criteria: [] }, sourceRecipeId: scope.id, decisionReadings: [archive],
    documentaryAnswers: [parentRecord], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: createdAt,
  };
  const input = { archive, workspace, ownerKey, workspaceId, context };
  const launch = prepareHopV55AssistedAdviceLaunchV1({ archive, workspace, ownerKey, workspaceId, context,
    candidatePolicy, adviceBaseRecord: parentRecord });
  if (launch.status !== 'ready') throw new Error(`Préparation fixture refusée : ${launch.reason}`);
  const capture = captureHopV55AssistedAdviceTicketV1({ id: 'ticket:operation-A', operationId: 'operation-A', createdAt, launch: launch.launch });
  if (capture.status !== 'ready') throw new Error(`Capture fixture refusée : ${capture.reason}`);
  const chatInput: BrewerChatInput = { scope, operationId: 'operation-A', question, hopAdvice: launch.launch.request };
  const submitted = beforeSubmitHopV55AssistedAdvice({ ticket: capture.ticket, current: { ...input, scopeAtPageLaunch: scope }, input: chatInput });
  if (submitted.status !== 'ready') throw new Error(`Envoi fixture refusé : ${submitted.reason}`);
  const floral = reading.criterionDrafts.find(row => row.source.text === 'floral');
  if (!floral) throw new Error('Le critère floral attendu doit exister dans la fixture.');
  const envelope = createBrewerHopAdviceProposalEnvelope({
    request: submitted.ticket.request,
    raw: {
      readerReview: [{ annotationId: floral.id, verdict: 'revise', reason: 'Proposition assistée à confirmer.',
        revision: { property: 'aroma', role: 'target', direction: 'decrease', required: true, basis: 'current', metric: 'sensory',
          subject: 'beer', subjectLabel: 'Ma bière', sensoryContext: 'beer', reason: 'Lecture proposée.' } }],
      answer: { summary: 'Lecture et options à examiner.', readingNote: 'Proposition non adoptée.', options: [{ id: 'assist-option',
        kind: 'investigation', title: 'Examiner la lecture', rationale: 'La proposition reste à confirmer.', conditions: [], tradeoffs: [], related: [], evidenceIds: [] }], unknowns: [],
        program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [] },
    }, evidence: [], readers: {},
    serverContext: { phase: 'planning', provenance: ['Fixture locale.'], loadedAt: 1,
      binding: submitted.ticket.request.contextLaunch.expected },
  });
  const turn = {
    id: 'turn:operation-A', operationId: 'operation-A', question, advice: { level: 'info', summary: '', action: '', why: '', watch: '', question, evidenceIds: [] },
    evidence: [], createdAt: Date.parse(createdAt), model: 'fixture', reviewed: true, contextLabel: 'Fixture', hopAdviceProposal: envelope,
  } as BrewerTurn;
  const turnResult = receiveHopV55AssistedAdvice({ ticket: capture.ticket, input: submitted.input,
    job: { operationId: 'operation-A', input: submitted.input }, turn, envelope, evidence: turn.evidence,
    current: { ...input, scopeAtPageLaunch: scope }, receivedAt: createdAt });
  if (turnResult.status !== 'ready') throw new Error(`Réception fixture refusée : ${turnResult.reason}`);
  if (turnResult.payload.clientResult.status !== 'ready') throw new Error(`Résultat client fixture périmé : ${turnResult.payload.clientResult.reason}`);
  return { context, prepared, reading, archive, draft, parentRecord, scope, scopeDrafts, workspace, input, capture: capture.ticket,
    launch: launch.launch, submitted: submitted.input, turn, envelope, received: turnResult.payload, floral };
}

describe('contrôleur local du conseil assisté', () => {
  it('capture un ticket V3 exact et renvoie un input réseau canonique sans élargir le scope', () => {
    const f = setup();
    const read = readHopV55AssistedAdviceTicketV1(f.capture);
    expect(f.launch.request.question).toBe(question);
    expect(f.launch).not.toHaveProperty('operationId');
    expect(read).toMatchObject({ status: 'readOnly', ticket: {
      operationId: 'operation-A', sourceReadingReference: f.archive.contentReference,
      scopeLedgerReference: f.archive.scopeLedger.reference,
      request: { question, readerScopes: expect.arrayContaining([expect.objectContaining({ kind: 'employmentTiming' }), expect.objectContaining({ kind: 'materialSelection' })]) },
      launchSnapshot: { archive: { contentReference: f.archive.contentReference }, context: f.context,
        workspace: { decisionReadings: [{ contentReference: f.archive.contentReference }] } },
    } });
    expect(f.submitted.hopAdvice).toEqual(f.capture.request);
    expect(f.submitted.question).toBe(question);
    expect(f.submitted.scope).toEqual(f.scope);
    expect(f.workspace.documentaryAnswers).toHaveLength(1);

    const noParentWorkspace = { ...f.workspace, documentaryAnswers: [] };
    const explicitFirstLaunch = prepareHopV55AssistedAdviceLaunchV1({ archive: f.archive, workspace: noParentWorkspace,
      ownerKey, workspaceId, context: f.context, candidatePolicy });
    expect(explicitFirstLaunch).toMatchObject({ status: 'ready', launch: { candidatePolicy } });
    const missingPolicy = prepareHopV55AssistedAdviceLaunchV1({ archive: f.archive, workspace: noParentWorkspace,
      ownerKey, workspaceId, context: f.context });
    expect(missingPolicy).toMatchObject({ status: 'invalid' });
  });

  it('prépare le tour sous A et archive un retour A sous B comme historique non confirmable', () => {
    const f = setup();
    const changedContext = structuredClone(f.context);
    changedContext.recipe!.name = `${changedContext.recipe!.name} — contexte B`;
    const currentB = { ...f.input, scopeAtPageLaunch: f.scope, context: changedContext };
    const result = receiveHopV55AssistedAdvice({ ticket: f.capture, input: f.submitted,
      job: { operationId: 'operation-A', input: f.submitted }, turn: f.turn, envelope: f.envelope,
      evidence: f.turn.evidence, current: currentB, receivedAt: createdAt });
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.payload.clientResult.status).toBe('ready');
    if (result.payload.clientResult.status !== 'ready') return;
    expect(result.payload.clientResult.contextCheck.history.status).toBe('matched');
    expect(result.payload.contextCheckAtReception).toMatchObject({ history: { status: 'matched' }, applicability: { status: 'stale' },
      historicalSourceReadingReference: f.archive.contentReference });
    expect(result.payload.clientResult.envelope.request.question).toBe(question);
    expect(result.payload.clientResult.v4Suggestions).toHaveLength(1);
    expect(f.workspace.documentaryAnswers?.[0]).toEqual(f.parentRecord);

    const staleEnvelope = structuredClone(f.envelope);
    staleEnvelope.serverContext.binding.physicalAnchorReference = 'changed:server-physical-anchor';
    const staleTurn = { ...f.turn, hopAdviceProposal: staleEnvelope };
    const staleHistory = receiveHopV55AssistedAdvice({ ticket: f.capture, input: f.submitted,
      job: { operationId: 'operation-A', input: f.submitted }, turn: staleTurn, envelope: staleEnvelope,
      evidence: staleTurn.evidence, current: { ...f.input, scopeAtPageLaunch: f.scope }, receivedAt: createdAt });
    expect(staleHistory).toMatchObject({ status: 'ready', payload: {
      clientResult: { status: 'stale' }, contextCheckAtReception: { history: { status: 'stale' } },
    } });
  });

  it('refuse les preuves d’un autre tour, une requête mutée et un parent/ledger différent avant le callback V4', async () => {
    const f = setup();
    const otherEvidence = [{ id: 'E2', name: 'lookup_hop', label: 'Autre tour', data: { records: [] } }];
    expect(receiveHopV55AssistedAdvice({ ticket: f.capture, input: f.submitted, job: { operationId: 'operation-A' },
      turn: f.turn, envelope: f.envelope, evidence: otherEvidence, current: { ...f.input, scopeAtPageLaunch: f.scope }, receivedAt: createdAt }))
      .toMatchObject({ status: 'invalid' });
    const wrongRequest = { ...f.submitted, question: 'Autre question.' };
    expect(receiveHopV55AssistedAdvice({ ticket: f.capture, input: wrongRequest, job: { operationId: 'operation-A' }, turn: f.turn,
      envelope: f.envelope, evidence: f.turn.evidence, current: { ...f.input, scopeAtPageLaunch: f.scope }, receivedAt: createdAt }))
      .toMatchObject({ status: 'blocked' });

    const otherParent = createHopV55PropertyAdviceAnswerRecordV3({ draft: f.draft, prepared: f.prepared,
      answerSnapshot: f.parentRecord.answerSnapshot, answerRecordId: 'answer:parent-next' });
    f.workspace.documentaryAnswers!.push(otherParent);
    const executeV4 = vi.fn(async () => ({ committed: true }));
    const base = { ticket: f.capture, payload: f.received, current: { ...f.input, scopeAtPageLaunch: f.scope },
      transition: transition({ kind: 'upgradeV3', parentRecordReference: otherParent.reference,
        parentReadingReference: f.archive.contentReference, actId: 'act:upgrade-other' }),
      suggestion: f.received.clientResult.v4Suggestions[0], confirmation: { kind: 'brewerConfirmation' as const, reason: 'Je confirme.' }, executeV4 };
    await expect(confirmHopV55AssistedAdviceSuggestion({ ...base, sourceRecord: otherParent })).resolves.toMatchObject({ status: 'blocked' });
    expect(executeV4).not.toHaveBeenCalled();
  });

  it('refuse la mutation d’un fact, d’une limite ou d’une source d’outil même si turn.evidence suit la mutation', () => {
    const f = setup();
    const originalEvidence = {
      id: 'E-proof', name: 'lookup_hop_reference', label: 'Référence houblon',
      facts: ['Un fait documentaire conservé.'], limits: ['Aucun lot mesuré.'], data: { note: 'payload exact' },
      sources: [{ title: 'Source fixture', url: 'https://example.invalid/reference' }],
    };
    const envelope = createBrewerHopAdviceProposalEnvelope({ request: f.capture.request,
      raw: { answer: { summary: 'Réponse à examiner.', readingNote: 'Proposition non adoptée.', options: [{ id: 'assist-option',
        kind: 'investigation', title: 'Vérifier une référence', rationale: 'La preuve demeure documentaire.', conditions: [],
        tradeoffs: [], related: [], evidenceIds: [] }], unknowns: [], program: { kind: 'none', note: 'Aucun programme.' }, refusals: [] } },
      evidence: [originalEvidence], readers: {}, serverContext: { phase: 'planning', provenance: ['Fixture locale.'], loadedAt: 1,
        binding: f.capture.request.contextLaunch.expected } });
    const turn = { ...f.turn, id: 'turn:evidence-v2', hopAdviceProposal: envelope, evidence: [originalEvidence] };
    const accepted = receiveHopV55AssistedAdvice({ ticket: f.capture, input: f.submitted,
      job: { operationId: f.capture.operationId, input: f.submitted }, turn, envelope, evidence: turn.evidence,
      current: { ...f.input, scopeAtPageLaunch: f.scope }, receivedAt: createdAt });
    expect(accepted.status).toBe('ready');

    const mutations = [
      (row: typeof originalEvidence) => { row.facts[0] = 'Fait modifié après émission.'; },
      (row: typeof originalEvidence) => { row.limits[0] = 'Limite retirée après émission.'; },
      (row: typeof originalEvidence) => { row.sources[0].url = 'https://example.invalid/changed'; },
    ];
    for (const mutate of mutations) {
      const alteredEvidence = structuredClone(originalEvidence);
      mutate(alteredEvidence);
      const alteredTurn = { ...turn, evidence: [alteredEvidence] };
      expect(receiveHopV55AssistedAdvice({ ticket: f.capture, input: f.submitted,
        job: { operationId: f.capture.operationId, input: f.submitted }, turn: alteredTurn, envelope,
        evidence: alteredTurn.evidence, current: { ...f.input, scopeAtPageLaunch: f.scope }, receivedAt: createdAt }))
        .toMatchObject({ status: 'invalid' });
    }
  });

  it('bloque une lecture A remplacée et un ledger V4 plus récent au lieu de réutiliser le conseil sous la nouvelle tête', async () => {
    const f = setup();
    const archiveB = createHopV55DecisionReadingArchiveV3({
      id: 'reading:assisted-controller-B', ownerKey, workspaceId, recordedAt: '2026-10-04T09:05:00.000Z',
      reading: f.reading, source: f.archive.source, runtimeReference: f.archive.runtimeReference,
      scopeLedger: f.archive.scopeLedger, transition: structuredClone(f.archive.transition),
    });
    const changedArchiveWorkspace = { ...f.workspace, decisionReadings: [f.archive, archiveB] };
    const staleSubmit = beforeSubmitHopV55AssistedAdvice({ ticket: f.capture, input: f.submitted,
      current: { archive: archiveB, workspace: changedArchiveWorkspace, ownerKey, workspaceId, scopeAtPageLaunch: f.scope, context: f.context } });
    expect(staleSubmit).toMatchObject({ status: 'blocked' });

    const v4Upgrade = upgradeV3ToV4({ sourceRecord: f.parentRecord, sourceReadingArchive: f.archive, prepared: f.prepared,
      recordId: 'answer:v4-parent', requestId: 'request:v4-parent',
      transition: transition({ kind: 'upgradeV3', parentRecordReference: f.parentRecord.reference,
        parentReadingReference: f.archive.contentReference, actId: 'act:v4-parent' }) });
    const v4Parent = sealV4(v4Upgrade);
    const v4Workspace: HopV55Workspace = { ...f.workspace, documentaryAnswers: [v4Parent] };
    const v4Launch = prepareHopV55AssistedAdviceLaunchV1({ archive: f.archive, workspace: v4Workspace, ownerKey, workspaceId,
      context: f.context, candidatePolicy, adviceBaseRecord: v4Parent });
    if (v4Launch.status !== 'ready') throw new Error(`Préparation du ticket V4 refusée : ${v4Launch.reason}`);
    const capturedV4 = captureHopV55AssistedAdviceTicketV1({ id: 'ticket:v4-parent', operationId: 'operation-v4', createdAt,
      launch: v4Launch.launch });
    if (capturedV4.status !== 'ready') throw new Error(`Capture du ledger V4 refusée : ${capturedV4.reason}`);
    const v4Input: BrewerChatInput = { scope: f.scope, operationId: 'operation-v4', question };
    const v4Submit = beforeSubmitHopV55AssistedAdvice({ ticket: capturedV4.ticket, input: v4Input,
      current: { archive: f.archive, workspace: v4Workspace, ownerKey, workspaceId, scopeAtPageLaunch: f.scope, context: f.context } });
    if (v4Submit.status !== 'ready') throw new Error(`Envoi du ticket V4 refusé : ${v4Submit.reason}`);
    const v4Turn = { ...f.turn, id: 'turn:operation-v4', operationId: 'operation-v4', hopAdviceProposal: f.envelope };
    const v4Receipt = receiveHopV55AssistedAdvice({ ticket: capturedV4.ticket, input: v4Submit.input,
      job: { operationId: 'operation-v4', input: v4Submit.input }, turn: v4Turn, envelope: f.envelope, evidence: f.turn.evidence,
      current: { archive: f.archive, workspace: v4Workspace, ownerKey, workspaceId, scopeAtPageLaunch: f.scope, context: f.context }, receivedAt: createdAt });
    if (v4Receipt.status !== 'ready') throw new Error(`Réception du ticket V4 refusée : ${v4Receipt.reason}`);
    if (v4Receipt.payload.clientResult.status !== 'ready') throw new Error(`Résultat V4 périmé : ${v4Receipt.payload.clientResult.reason}`);

    const rejectedId = v4Parent.ledger.sourceAnnotations[0].id;
    const revised = prepareCorrectionV4({ sourceRecord: v4Parent, sourceReadingArchive: f.archive, prepared: f.prepared,
      recordId: 'answer:v4-ledger-next', requestId: 'request:v4-ledger-next',
      transition: transition({ kind: 'revise', parentRecordReference: v4Parent.reference,
        parentReadingReference: f.archive.contentReference, actId: 'act:v4-ledger-next' }),
      actions: [{ kind: 'reject', annotationId: rejectedId, reason: 'Changement explicite du ledger source.' }],
    });
    const newerLedger = sealV4(revised);
    const currentWorkspace: HopV55Workspace = { ...v4Workspace, documentaryAnswers: [v4Parent, newerLedger] };
    const executeV4 = vi.fn(async () => ({ committed: true }));
    const result = await confirmHopV55AssistedAdviceSuggestion({ ticket: capturedV4.ticket, payload: v4Receipt.payload,
      current: { archive: f.archive, workspace: currentWorkspace, ownerKey, workspaceId, scopeAtPageLaunch: f.scope, context: f.context },
      sourceRecord: newerLedger, transition: transition({ kind: 'revise', parentRecordReference: newerLedger.reference,
        parentReadingReference: f.archive.contentReference, actId: 'act:must-not-run' }),
      suggestion: v4Receipt.payload.clientResult.v4Suggestions[0],
      confirmation: { kind: 'brewerConfirmation', reason: 'Je confirme.' }, executeV4 });
    expect(result).toMatchObject({ status: 'blocked' });
    expect(executeV4).not.toHaveBeenCalled();
  });

  it('confirme uniquement une suggestion exacte, avec transition et refs stables; les retries reprennent le même appel V4', async () => {
    const f = setup();
    const executeV4 = vi.fn(async (command) => ({ action: command.action, expected: command.expected }));
    const commandTransition = transition({ kind: 'upgradeV3', parentRecordReference: f.parentRecord.reference,
      parentReadingReference: f.archive.contentReference, actId: 'act:operation-A:confirm-1' });
    const args = { ticket: f.capture, payload: f.received, current: { ...f.input, scopeAtPageLaunch: f.scope },
      sourceRecord: f.parentRecord, transition: commandTransition, suggestion: f.received.clientResult.v4Suggestions[0],
      confirmation: { kind: 'brewerConfirmation' as const, reason: 'Je retiens cette correction.' }, executeV4 };
    const first = await confirmHopV55AssistedAdviceSuggestion(args);
    const retry = await confirmHopV55AssistedAdviceSuggestion(args);
    expect(first.status).toBe('applied');
    expect(retry).toEqual(first);
    expect(executeV4).toHaveBeenCalledTimes(2);
    expect(executeV4.mock.calls[0][0]).toEqual(executeV4.mock.calls[1][0]);
    expect(executeV4.mock.calls[0][0]).toMatchObject({ expected: {
      sourceReadingReference: f.archive.contentReference, sourceRecordReference: f.parentRecord.reference,
    }, transition: commandTransition });
    expect(executeV4.mock.calls[0][0].action).toMatchObject({ kind: 'revise', annotationId: f.floral.id,
      activeIntent: { interpretationOrigin: 'user' } });
    expect(f.workspace.documentaryAnswers).toHaveLength(1);
  });

  it('historique appelle exclusivement le reader Runtime injecté, sans relecture de question ni reconstruction', () => {
    const f = setup();
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    const requestBuilder = vi.spyOn(assistedProposalModule, 'buildHopV55AssistedAdviceRequest');
    expect(readHopV55AssistedAdviceTicketV1(f.capture)).toMatchObject({ status: 'readOnly' });
    expect(parser).not.toHaveBeenCalled();
    expect(requestBuilder).not.toHaveBeenCalled();
    parser.mockRestore();
    requestBuilder.mockRestore();

    const record = { format: 'runtime-assisted-record-v1', payload: { unicode: 'bière d’été — poire' } };
    const codec = { read: vi.fn((value: unknown) => ({ status: 'readOnly' as const, record: value })) };
    const before = structuredClone(record);
    expect(readHopV55AssistedAdviceHistory(record, codec)).toEqual({ status: 'readOnly', record });
    expect(codec.read).toHaveBeenCalledOnce();
    expect(codec.read).toHaveBeenCalledWith(record);
    expect(record).toEqual(before);
  });
});
