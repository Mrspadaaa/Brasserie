import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55AssistedAdviceFixtureRuntime } from '../../src/services/hopV55/assistedAdviceFixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { readHopV55QuestionScopeDraftsV1 } from '../../src/services/hopV55/questionScopeReading';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { prepareHopV55AssistedAdviceContextLaunch } from '../../src/services/hopV55/assistedAdviceContext';
import { beforeSubmitHopV55AssistedAdvice, captureHopV55AssistedAdviceTicketV1,
  prepareHopV55AssistedAdviceLaunchV1, receiveHopV55AssistedAdvice } from '../../src/services/hopV55/assistedAdviceController';
import { mapBrewerHopAdviceLaunchSourceToScopeV1 } from '../../functions/src/brewerHopAdviceContextBinding';
import { HOP_ADVICE_PROTOCOL_V1 } from '../../functions/src/brewerHopAdviceTransportV1';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { buildHopV55AssistedAdviceRequest, prepareHopV55AssistedAdviceFromProposal } from '../../src/services/hopV55/assistedAdviceProposal';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import type { BrewerChatInput, BrewerContext, BrewerScope } from '../../functions/src/companionTypes';
import type { HopV55AssistedCompanionSession } from '../../src/ui/hopV55/assistedAdviceUiContracts';
import { createHopV55FixtureServices } from '../../src/services/hopV55/fixtureRuntime';
import type { HopV55WorkspaceDatabaseAdapter, HopV55WorkspaceEnvelopeV1, HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';

const QUESTION = 'Je veux comprendre le contact à froid sans augmenter l’amertume.';
const OWNER = 'fixture:assistantFixture-owner';
const WORKSPACE = 'workspace:assistantFixture-cold-contact';
const CANDIDATE_POLICY = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’a encore été choisie.' };

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [
      (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
    ]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  readonly workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(work);
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Test-only memory adapter. */ }
}

function sessionFor(question = QUESTION, readingId = 'reading:assistantFixture-a', ownerKey = OWNER, workspaceId = WORKSPACE) {
  const sourceContext = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(sourceContext);
  const reading = readHopV55Question(question, prepared);
  const scopeDrafts = readHopV55QuestionScopeDraftsV1({ question, reading });
  const scope: BrewerScope = { kind: 'recipe', id: sourceContext.recipe!.id! };
  const archive = createHopV55DecisionReadingArchiveV2({ id: readingId, ownerKey, workspaceId,
    recordedAt: '2026-10-04T08:00:00.000Z', reading, source: { kind: 'recipe', id: scope.id },
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1, title: 'Fixture assistantFixture',
    intent: { question, criteria: [] }, sourceRecipeId: scope.id, decisionReadings: [archive],
    scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: archive.recordedAt
  };
  const current = { archive, workspace, ownerKey, workspaceId, scopeAtPageLaunch: scope, context: sourceContext };
  const launched = prepareHopV55AssistedAdviceContextLaunch(current);
  if (launched.status !== 'ready') throw new Error(`Fixture assistée : ${JSON.stringify(launched)}`);
  const request = buildHopV55AssistedAdviceRequest({ reading, sourceReadingReference: archive.contentReference,
    scopeDrafts, contextLaunch: launched.launch });
  const session: HopV55AssistedCompanionSession = {
    id: `assistantFixture:${archive.id}`, request, context: sourceContext, label: 'Lecture assistée simulée',
    onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}),
    onAssistedTurn: vi.fn(async () => {})
  };
  return { session, reading, scopeDrafts, prepared, current, contextCheck: { launch: launched.launch, current }, archive };
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('runtime de transport assistantFixture', () => {
  it('construit une enveloppe depuis la requête exacte avec une suggestion V4 et une preuve froide canonique', async () => {
    const setup = sessionFor();
    const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'cold-contact', delay: 'immediate' });
    fixture.setSession(setup.session);
    await fixture.runtime.jobs.start();
    const input: BrewerChatInput = { scope: setup.session.request.contextLaunch.scope,
      operationId: 'assistant-fixture-operation-1', question: setup.session.request.question,
      mode: 'auto', generation: 0, hopAdvice: structuredClone(setup.session.request) };
    fixture.runtime.jobs.submit(input, setup.session.label);

    await vi.waitFor(() => {
      const current = fixture.runtime.jobs.snapshot().jobs[0];
      if (current?.status === 'error') throw new Error(current.sendError);
      expect(current?.status).toBe('done');
    });
    const job = fixture.runtime.jobs.snapshot().jobs[0];
    expect(job.operationId).toBe(input.operationId);
    expect(job.turn?.hopAdviceProposal?.request).toEqual(setup.session.request);
    expect(job.turn?.evidence).toHaveLength(1);
    expect(job.turn?.evidence[0]).toMatchObject({ id: 'E-assistant-fixture-cold-contact', name: 'cold_contact_bitterness_reference' });
    expect(job.turn?.evidence[0].data).toMatchObject({ format: 'cold-hop-bu-reference-result-v1', status: 'publishedObservation' });

    const prepared = prepareHopV55AssistedAdviceFromProposal({
      envelope: job.turn!.hopAdviceProposal,
      turnEvidence: job.turn!.evidence,
      reading: setup.reading,
      sourceReadingReference: setup.archive.contentReference,
      context: setup.contextCheck,
      scopeDrafts: setup.scopeDrafts,
      prepared: setup.prepared,
      requestId: 'assistant-fixture-response-check',
      ownerKey: OWNER,
      workspaceId: WORKSPACE,
      candidatePolicy: CANDIDATE_POLICY
    });
    expect(prepared.status).toBe('ready');
    if (prepared.status !== 'ready') return;
    expect(prepared.v4Suggestions).toHaveLength(1);
    expect(prepared.v4Suggestions[0]).toMatchObject({ kind: 'revise' });
    expect(prepared.coldContactEvidence).toHaveLength(1);
    expect(prepared.coldContactEvidence[0]).toMatchObject({ status: 'ready', evidenceId: 'E-assistant-fixture-cold-contact',
      snapshot: { valueBU: 21, controlBU: 17 } });
    expect(prepared.answer.options[0].provenance).toBe('documentaryReference');
    expect(fixture.runtime.storeNamespace).toContain('hopAdviceReadonlyV1');
  });

  it('reçoit la preuve froide complète et refuse sa mutation, sans projeter les evidence fields', async () => {
    const services = createHopV55FixtureServices(`assistant-cold-roundtrip-${crypto.randomUUID()}`,
      { mode: 'planning', workspaceDatabase: new MemoryWorkspaceDatabase() });
    try {
      const workspaceId = 'workspace:assistant-cold-roundtrip';
      const setup = sessionFor(QUESTION, 'reading:assistantFixture-cold-roundtrip', services.ownerKey, workspaceId);
      const initialWorkspace = await services.workspaces.save({ ...setup.current.workspace, revision: 0 }, null);
      const currentAtLaunch = { ...setup.current, workspace: initialWorkspace };
      const launch = prepareHopV55AssistedAdviceLaunchV1({ archive: setup.archive, workspace: initialWorkspace,
        ownerKey: services.ownerKey, workspaceId, context: setup.current.context, candidatePolicy: CANDIDATE_POLICY });
      if (launch.status !== 'ready') throw new Error(`Lancement Page fixture refusé : ${launch.reason}`);
      const operationId = 'assistant-fixture-cold-receive';
      const captured = captureHopV55AssistedAdviceTicketV1({ id: 'assistant-fixture-cold-ticket',
        operationId, createdAt: '2026-10-04T08:01:00.000Z', launch: launch.launch });
      if (captured.status !== 'ready') throw new Error(`Ticket Page fixture refusé : ${captured.reason}`);
      const input = { scope: launch.launch.request.contextLaunch.scope, operationId,
        question: launch.launch.request.question, mode: 'auto' as const, generation: 0,
        hopAdvice: structuredClone(launch.launch.request) } satisfies BrewerChatInput;
      const submitted = beforeSubmitHopV55AssistedAdvice({ ticket: captured.ticket, current: currentAtLaunch, input });
      if (submitted.status !== 'ready') throw new Error(`Input Page fixture refusé : ${submitted.reason}`);
      const ticketAppend = await services.assistedAdvice.appendTicket(workspaceId, captured.ticket, initialWorkspace.revision);
      expect(ticketAppend.status).toBe('appended');
      if (ticketAppend.status !== 'appended') return;
      const currentAfterTicket = { ...currentAtLaunch, workspace: ticketAppend.workspace };

      const session = { ...setup.session, id: 'assistantFixture:page-roundtrip', request: launch.launch.request };
      const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'cold-evidence-receive', delay: 'manual' });
      fixture.setSession(session);
      await fixture.runtime.jobs.start();
      fixture.runtime.jobs.submit(submitted.input, session.label);
      expect(await fixture.releaseNext()).toBe(true);
      const job = fixture.runtime.jobs.snapshot().jobs[0];
      const turn = job.turn!;
      expect(turn.protocol).toBe(HOP_ADVICE_PROTOCOL_V1.name);
      expect(turn.evidence[0]).toMatchObject({ id: 'E-assistant-fixture-cold-contact',
        name: 'cold_contact_bitterness_reference', facts: expect.any(Array), limits: expect.any(Array) });
      expect(turn.hopAdviceProposal?.evidence.dependencies).toEqual(expect.arrayContaining([
        expect.objectContaining({ evidenceId: 'E-assistant-fixture-cold-contact', toolName: 'cold_contact_bitterness_reference' })
      ]));

      const received = receiveHopV55AssistedAdvice({ ticket: captured.ticket, input: submitted.input,
        job: { operationId: job.operationId, input: submitted.input }, turn, envelope: turn.hopAdviceProposal,
        evidence: turn.evidence, current: currentAfterTicket, receivedAt: '2026-10-04T08:02:00.000Z' });
      expect(received.status).toBe('ready');
      if (received.status !== 'ready') return;
      expect(received.payload.clientResult.status).toBe('ready');
      if (received.payload.clientResult.status !== 'ready') return;
      expect(received.payload.clientResult.coldContactEvidence).toHaveLength(1);

      const rawRecord = services.assistedAdvice.createRecord({ id: `assistant:${operationId}:${turn.id}`,
        ticket: captured.ticket, job: { id: job.id, operationId, generation: job.generation, scope: job.scope, question: job.question },
        turn, payload: received.payload });
      expect((await services.assistedAdvice.readRecordByOperationId(workspaceId, operationId)).status).toBe('absent');
      await services.assistedAdvice.appendRecord(workspaceId, rawRecord, ticketAppend.workspace.revision);
      const archived = await services.assistedAdvice.readArchiveByOperationId(workspaceId, operationId);
      expect(archived.status).toBe('available');
      if (archived.status !== 'available') return;
      expect(archived.value.record.turn.protocol).toBe(HOP_ADVICE_PROTOCOL_V1.name);
      expect(archived.value.record.turn.evidence).toEqual(turn.evidence);
      expect((await services.assistedAdvice.readRecordByOperationId(workspaceId, operationId)).status).toBe('available');

      const mutatedEvidence = structuredClone(turn.evidence);
      mutatedEvidence[0] = { ...mutatedEvidence[0], facts: [...(mutatedEvidence[0].facts ?? []), 'mutation de fixture refusée'] };
      const mutatedTurn = { ...turn, evidence: mutatedEvidence };
      const refused = receiveHopV55AssistedAdvice({ ticket: captured.ticket, input: submitted.input,
        job: { operationId: job.operationId, input: submitted.input }, turn: mutatedTurn,
        envelope: turn.hopAdviceProposal, evidence: mutatedEvidence, current: currentAfterTicket, receivedAt: '2026-10-04T08:02:01.000Z' });
      expect(refused.status).toBe('invalid');
      if (refused.status === 'invalid') expect(refused.reason).toMatch(/dépendance d’outil du tour manque ou son contenu a changé/i);
    } finally {
      services.close();
    }
  });

  it('dérive la suggestion d’une annotation poire/floral sans exiger un mot de contact', async () => {
    const question = 'Je veux plus de poire et plus de floral.';
    const setup = sessionFor(question, 'reading:assistantFixture-pear-floral');
    const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'pear-floral', delay: 'immediate' });
    fixture.setSession(setup.session);
    await fixture.runtime.jobs.start();
    const input: BrewerChatInput = { scope: setup.session.request.contextLaunch.scope,
      operationId: 'assistant-fixture-pear-floral', question,
      generation: 0, hopAdvice: structuredClone(setup.session.request) };
    fixture.runtime.jobs.submit(input, setup.session.label);

    await vi.waitFor(() => {
      const current = fixture.runtime.jobs.snapshot().jobs[0];
      if (current?.status === 'error') throw new Error(current.sendError);
      expect(current?.status).toBe('done');
    });
    const turn = fixture.runtime.jobs.snapshot().jobs[0].turn!;
    const prepared = prepareHopV55AssistedAdviceFromProposal({
      envelope: turn.hopAdviceProposal,
      turnEvidence: turn.evidence,
      reading: setup.reading,
      sourceReadingReference: setup.archive.contentReference,
      context: setup.contextCheck,
      scopeDrafts: setup.scopeDrafts,
      prepared: setup.prepared,
      requestId: 'assistant-fixture-pear-floral-check',
      ownerKey: OWNER,
      workspaceId: WORKSPACE,
      candidatePolicy: CANDIDATE_POLICY
    });
    expect(turn.question).not.toMatch(/contact/i);
    expect(prepared.status).toBe('ready');
    if (prepared.status !== 'ready') return;
    expect(prepared.v4Suggestions).toHaveLength(1);
    expect(setup.reading.criterionDrafts.map(row => row.id)).toContain(prepared.v4Suggestions[0].annotationId);
    expect(prepared.coldContactEvidence).toHaveLength(1);
    expect(prepared.answer.options[0].rationale).toMatch(/ne prédit pas/i);
  });

  it('déclare explicitement l’absence de suggestion lorsque la lecture ne garde que garder/éviter', async () => {
    const question = 'Je veux garder la poire et éviter le côté floral.';
    const setup = sessionFor(question, 'reading:assistantFixture-no-revision');
    const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'no-revision', delay: 'immediate' });
    fixture.setSession(setup.session);
    await fixture.runtime.jobs.start();
    const input: BrewerChatInput = { scope: setup.session.request.contextLaunch.scope,
      operationId: 'assistant-fixture-no-revision', question,
      generation: 0, hopAdvice: structuredClone(setup.session.request) };
    fixture.runtime.jobs.submit(input, setup.session.label);

    await vi.waitFor(() => {
      const current = fixture.runtime.jobs.snapshot().jobs[0];
      if (current?.status === 'error') throw new Error(current.sendError);
      expect(current?.status).toBe('done');
    });
    const turn = fixture.runtime.jobs.snapshot().jobs[0].turn!;
    const prepared = prepareHopV55AssistedAdviceFromProposal({
      envelope: turn.hopAdviceProposal,
      turnEvidence: turn.evidence,
      reading: setup.reading,
      sourceReadingReference: setup.archive.contentReference,
      context: setup.contextCheck,
      scopeDrafts: setup.scopeDrafts,
      prepared: setup.prepared,
      requestId: 'assistant-fixture-no-revision-check',
      ownerKey: OWNER,
      workspaceId: WORKSPACE,
      candidatePolicy: CANDIDATE_POLICY
    });
    expect(prepared.status).toBe('ready');
    if (prepared.status !== 'ready') return;
    expect(prepared.v4Suggestions).toHaveLength(0);
    expect(prepared.answer.refusals.map(row => row.text).join(' ')).toMatch(/aucune annotation canonique révisable/i);
    expect(prepared.coldContactEvidence).toHaveLength(1);
  });

  it('attend le geste visible de libération en mode manuel et conserve le même operationId', async () => {
    const setup = sessionFor();
    const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'manual-release', delay: 'manual' });
    fixture.setSession(setup.session);
    await fixture.runtime.jobs.start();
    const input: BrewerChatInput = { scope: setup.session.request.contextLaunch.scope,
      operationId: 'assistant-fixture-manual-operation', question: setup.session.request.question,
      generation: 0, hopAdvice: structuredClone(setup.session.request) };
    fixture.runtime.jobs.submit(input, setup.session.label);
    expect(fixture.pending()).toHaveLength(1);
    expect(fixture.runtime.jobs.snapshot().jobs[0].turn).toBeUndefined();

    expect(await fixture.releaseNext()).toBe(true);
    expect(fixture.runtime.jobs.snapshot().jobs[0].turn?.operationId).toBe(input.operationId);
    expect(fixture.pending()).toHaveLength(0);
  });

  it('refuse une source recipe assortie de champs draft/localJournal avant de créer un job', async () => {
    const setup = sessionFor();
    const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'source-fields', delay: 'manual' });
    fixture.setSession(setup.session);
    await fixture.runtime.jobs.start();
    const input: BrewerChatInput = { scope: setup.session.request.contextLaunch.scope,
      operationId: 'assistant-fixture-source-fields', question: setup.session.request.question,
      generation: 0, hopAdvice: structuredClone(setup.session.request) };

    expect(() => fixture.runtime.jobs.submit({ ...input, draft: {} }, setup.session.label)).toThrow(/source|wire/i);
    expect(() => fixture.runtime.jobs.submit({ ...input, localJournal: {} }, setup.session.label)).toThrow(/source|wire/i);
    expect(fixture.runtime.jobs.snapshot().jobs).toHaveLength(0);
  });

  it('refuse une source exploration qui prétend porter le scope recipe de la session', async () => {
    const setup = sessionFor();
    const mismatchedSession = { ...setup.session, request: structuredClone(setup.session.request) };
    mismatchedSession.request.contextLaunch.source = { kind: 'exploration' };
    const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'source-kind', delay: 'manual' });
    fixture.setSession(mismatchedSession);
    await fixture.runtime.jobs.start();
    const input: BrewerChatInput = { scope: mismatchedSession.request.contextLaunch.scope,
      operationId: 'assistant-fixture-source-kind', question: mismatchedSession.request.question,
      generation: 0, hopAdvice: structuredClone(mismatchedSession.request) };

    expect(() => fixture.runtime.jobs.submit(input, mismatchedSession.label)).toThrow(/source|wire/i);
    expect(fixture.runtime.jobs.snapshot().jobs).toHaveLength(0);
  });

  it('recharge le pending dans le namespace fixture après une recréation du runtime', async () => {
    const setup = sessionFor();
    const first = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'reload-retry', delay: 'manual' });
    first.setSession(setup.session);
    await first.runtime.jobs.start();
    const input: BrewerChatInput = { scope: setup.session.request.contextLaunch.scope,
      operationId: 'assistant-fixture-reload-operation', question: setup.session.request.question,
      generation: 0, hopAdvice: structuredClone(setup.session.request) };
    first.runtime.jobs.submit(input, setup.session.label);

    const reloadedSession = sessionFor(QUESTION, 'reading:assistantFixture-a').session;
    const reloaded = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'reload-retry', delay: 'manual' });
    reloaded.setSession(reloadedSession);
    await reloaded.runtime.jobs.start();
    const recovered = reloaded.runtime.jobs.snapshot().jobs[0];
    expect(recovered.operationId).toBe(input.operationId);
    expect(recovered.input).toEqual(input);
    expect(recovered.sendError).toMatch(/même operationId/);

    reloaded.runtime.jobs.retry(recovered);
    expect(reloaded.runtime.jobs.snapshot().jobs[0].operationId).toBe(input.operationId);
    expect(await reloaded.releaseNext()).toBe(true);
    expect(reloaded.runtime.jobs.snapshot().jobs[0].turn?.operationId).toBe(input.operationId);
  });

  it('ne répond pas à A avec le contexte courant B quand le ticket A a disparu', async () => {
    const a = sessionFor(QUESTION, 'reading:assistantFixture-a');
    const bQuestion = 'Je veux comparer le contact à froid en gardant l’amertume actuelle.';
    const b = sessionFor(bQuestion, 'reading:assistantFixture-b');
    const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'late-a-b', delay: 'manual' });
    fixture.setSession(a.session);
    await fixture.runtime.jobs.start();
    const inputA: BrewerChatInput = { scope: a.session.request.contextLaunch.scope,
      operationId: 'assistant-fixture-late-a', question: a.session.request.question,
      generation: 0, hopAdvice: structuredClone(a.session.request) };
    fixture.runtime.jobs.submit(inputA, a.session.label);
    fixture.setSession(b.session);
    expect(fixture.runtime.jobs.snapshot().jobs[0].input?.hopAdvice).toEqual(a.session.request);
    expect(fixture.runtime.jobs.snapshot().jobs[0].input?.hopAdvice).not.toEqual(b.session.request);
    expect(await fixture.releaseNext()).toBe(true);
    expect(fixture.runtime.jobs.snapshot().jobs[0].turn?.question).toBe(QUESTION);
    expect(fixture.runtime.jobs.snapshot().jobs[0].operationId).toBe(inputA.operationId);
  });

  it('libère le pending A depuis le namespace après changement de scope sans exposer A au snapshot de B', async () => {
    const a = sessionFor(QUESTION, 'reading:assistantFixture-pending-scope-a');
    const b = sessionFor('Je veux comparer le contact à froid en gardant l’amertume actuelle.',
      'reading:assistantFixture-pending-scope-b');
    const launchB = structuredClone(b.session.request.contextLaunch);
    const source = { kind: 'localRecipeCopy' as const, workspaceId: WORKSPACE, copyId: 'fixture-copy-b',
      recipeId: 'recipe-copy-b', recipeReference: 'recipe-fixture-b' };
    const scopeB = mapBrewerHopAdviceLaunchSourceToScopeV1(OWNER, WORKSPACE, source);
    launchB.source = source;
    launchB.scope = scopeB;
    launchB.sourceRuntimeReference = 'runtime:fixture-draft-b';
    launchB.expected = { ...launchB.expected, scope: scopeB,
      source: { kind: 'draft', id: scopeB.id, label: 'Brouillon fixture B', snapshotReference: 'draft:fixture-b' } };
    const sessionB: HopV55AssistedCompanionSession = { ...b.session,
      request: { ...b.session.request, contextLaunch: launchB } };

    const fixture = createHopV55AssistedAdviceFixtureRuntime({ namespace: 'pending-across-scopes', delay: 'manual' });
    fixture.setSession(a.session);
    await fixture.runtime.jobs.start();
    const inputA: BrewerChatInput = { scope: a.session.request.contextLaunch.scope,
      operationId: 'assistant-fixture-pending-scope-a', question: a.session.request.question,
      generation: 0, hopAdvice: structuredClone(a.session.request) };
    fixture.runtime.jobs.submit(inputA, a.session.label);
    expect(fixture.pending().map(job => job.operationId)).toEqual([inputA.operationId]);

    fixture.setSession(sessionB);
    expect(fixture.runtime.jobs.snapshot().jobs).toHaveLength(0);
    expect(fixture.pending().map(job => job.operationId)).toEqual([inputA.operationId]);
    expect(await fixture.releaseNext()).toBe(true);

    expect(fixture.runtime.jobs.snapshot().jobs).toHaveLength(0);
    expect(await fixture.runtime.history(inputA.scope)).toEqual(expect.arrayContaining([
      expect.objectContaining({ operationId: inputA.operationId, question: QUESTION })
    ]));
    expect(fixture.pending()).toHaveLength(0);
  });
});
