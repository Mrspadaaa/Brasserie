// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerChatInput, BrewerJob, BrewerReply, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
import { HOP_ADVICE_PROTOCOL_V1, buildHopAdviceV1Wire, hopAdviceV1ClientPartitionKey,
  type HopAdviceV1Scope, type HopAdviceV1WireInput } from '../../functions/src/brewerHopAdviceTransportV1';
import type { BrewerHopAdviceRequest } from '../../functions/src/brewerHopAdviceProposal';
import { createBrewerHopAdviceRuntime, createBrewerHopAdviceRuntimeFactory,
  type BrewerHopAdviceV1RuntimeTransport } from '../../src/services/brewerHopAdviceRuntime';
import type { BrewerChatAssistedRuntime } from '../../src/ui/BrewerChat';
import type { HopV55AssistedRuntimeFactory } from '../../src/ui/hopV55/Host';

const ownerKey = 'owner:hop-advice-runtime-fixture';
const runtimes: Array<ReturnType<typeof createBrewerHopAdviceRuntime>> = [];

function runtime(scope: HopAdviceV1Scope, transport: BrewerHopAdviceV1RuntimeTransport, userKey = ownerKey) {
  const created = createBrewerHopAdviceRuntime({ ownerKey: userKey, scope, transport });
  runtimes.push(created);
  return created;
}

function makeRequest(question: string, scope: BrewerScope): BrewerHopAdviceRequest {
  return {
    format: 'brewer-hop-advice-request-v2', question, sourceReadingReference: 'reading:fixture-exact',
    contextLaunch: { scope: structuredClone(scope) },
  } as BrewerHopAdviceRequest;
}

function makeJob(input: Pick<BrewerChatInput, 'scope' | 'operationId' | 'question' | 'generation'>,
  overrides: Partial<BrewerJob> = {}): BrewerJob {
  const now = Date.now();
  return {
    id: input.operationId, operationId: input.operationId, scope: input.scope, question: input.question,
    generation: input.generation ?? 0, label: 'Fixture hopAdvice', status: 'running', stage: 'analysis',
    createdAt: now, updatedAt: now, attempt: 1, ...overrides,
  };
}

function makeTurn(operationId: string, question: string): BrewerTurn {
  return { id: `turn:${operationId}`, operationId, question, evidence: [], createdAt: Date.now(), model: 'fixture',
    reviewed: true, contextLabel: 'Fixture hopAdvice',
    advice: { level: 'info', summary: 'Réponse fixture.', action: 'Examiner.', why: 'Test local.', watch: '',
      question: '', evidenceIds: [] } };
}

function transport(overrides: Partial<BrewerHopAdviceV1RuntimeTransport> = {}): BrewerHopAdviceV1RuntimeTransport {
  return {
    userKey: vi.fn(async () => ownerKey),
    submit: vi.fn(async (wire: HopAdviceV1WireInput) => ({ job: makeJob(wire) })),
    retry: vi.fn(async (_jobId, operationId) => ({ turn: makeTurn(operationId, 'Question de reprise fixture.') })),
    activity: vi.fn(async () => []),
    status: vi.fn(async (input) => ({ turn: makeTurn(input.operationId, input.question) })),
    markRead: vi.fn(async () => undefined),
    history: vi.fn(async () => Object.assign([] as BrewerTurn[], { generation: 0 })),
    reset: vi.fn(async (_scope, generation) => ({ generation: generation + 1 })),
    ...overrides,
  };
}

function makeInput(input: {
  scope: BrewerScope;
  operationId: string;
  question: string;
  mode: 'fast' | 'auto' | 'deep';
  generation?: number;
  phase?: string;
  draft?: unknown;
  localJournal?: unknown;
  requestScope?: BrewerScope;
}): BrewerChatInput {
  const requestScope = input.requestScope ?? input.scope;
  return {
    scope: structuredClone(input.scope), operationId: input.operationId, question: input.question, mode: input.mode,
    ...(input.generation === undefined ? {} : { generation: input.generation }),
    ...(input.phase === undefined ? {} : { phase: input.phase }),
    ...(input.draft === undefined ? {} : { draft: input.draft }),
    ...(input.localJournal === undefined ? {} : { localJournal: input.localJournal }),
    hopAdvice: makeRequest(input.question, requestScope),
  };
}

afterEach(() => {
  for (const item of runtimes.splice(0)) item.dispose();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('runtime hopAdviceReadonlyV1', () => {
  it('projette les sources v1 et conserve Unicode, génération, phase et mode exacts', async () => {
    const draftScope: HopAdviceV1Scope = { kind: 'draft', id: 'source-α' };
    const draftTransport = transport();
    const draftRuntime = runtime(draftScope, draftTransport);
    const uiRuntime: BrewerChatAssistedRuntime = draftRuntime;
    expect(uiRuntime.storeNamespace).toBe(hopAdviceV1ClientPartitionKey(ownerKey, draftScope));
    const draftInput = makeInput({ scope: draftScope, operationId: 'op-draft-雪',
      question: 'Garde la poire — malgré l’amertume 🍐', mode: 'deep', generation: 7, phase: 'Fermentation · 18 °C',
      draft: { name: 'Brouillon Étoilé', nested: ['élevage', 'cuve 🟦'] } });
    await draftRuntime.jobs.start();
    draftRuntime.jobs.submit(draftInput, 'Brouillon');
    await vi.waitFor(() => expect(draftTransport.submit).toHaveBeenCalledTimes(1));
    const draftWire = draftTransport.submit.mock.calls[0][0];
    expect(draftWire.draft).toBe(draftInput.draft);
    expect(draftWire.hopAdvice).toBe(draftInput.hopAdvice);
    expect(draftTransport.submit).toHaveBeenCalledWith({
      mode: HOP_ADVICE_PROTOCOL_V1.name, analysisMode: 'deep', scope: draftScope,
      operationId: 'op-draft-雪', question: 'Garde la poire — malgré l’amertume 🍐', generation: 7,
      draft: draftInput.draft, phase: 'Fermentation · 18 °C', hopAdvice: draftInput.hopAdvice,
    });
    expect(draftRuntime.storeNamespace).toBe(hopAdviceV1ClientPartitionKey(ownerKey, draftScope));

    const batchScope: HopAdviceV1Scope = { kind: 'batch', id: 'brassin-é' };
    const batchTransport = transport();
    const batchRuntime = runtime(batchScope, batchTransport);
    const localJournal = { events: [{ name: 'Densité observée', value: '1,042' }], exact: 'œuf' };
    const batchInput = makeInput({ scope: batchScope, operationId: 'op-batch-1', question: 'Question de brassin',
      mode: 'fast', generation: 0, localJournal });
    await batchRuntime.jobs.start();
    batchRuntime.jobs.submit(batchInput, 'Brassin');
    await vi.waitFor(() => expect(batchTransport.submit).toHaveBeenCalledTimes(1));
    const batchWire = (batchTransport.submit as ReturnType<typeof vi.fn>).mock.calls[0][0] as HopAdviceV1WireInput;
    expect(batchWire.localJournal).toBe(localJournal);
    expect(batchWire).not.toHaveProperty('draft');
    expect(batchWire).toMatchObject({ mode: HOP_ADVICE_PROTOCOL_V1.name, analysisMode: 'fast', generation: 0,
      scope: batchScope });
    expect(batchWire).not.toHaveProperty('phase');

    const recipeScope: HopAdviceV1Scope = { kind: 'recipe', id: 'recipe-a' };
    const recipeTransport = transport();
    const recipeRuntime = runtime(recipeScope, recipeTransport);
    const recipeInput = makeInput({ scope: recipeScope, operationId: 'op-recipe-1', question: 'Question de recette', mode: 'auto' });
    await recipeRuntime.jobs.start();
    recipeRuntime.jobs.submit(recipeInput, 'Recette');
    await vi.waitFor(() => expect(recipeTransport.submit).toHaveBeenCalledTimes(1));
    const recipeWire = (recipeTransport.submit as ReturnType<typeof vi.fn>).mock.calls[0][0] as HopAdviceV1WireInput;
    expect(recipeWire).toMatchObject({ mode: HOP_ADVICE_PROTOCOL_V1.name, analysisMode: 'auto', scope: recipeScope,
      operationId: 'op-recipe-1', question: 'Question de recette' });
    expect(recipeWire).not.toHaveProperty('generation');
    expect(recipeWire).not.toHaveProperty('phase');
    expect(recipeWire).not.toHaveProperty('draft');
    expect(recipeWire).not.toHaveProperty('localJournal');
  });

  it('partage seulement la partition draft/recipe canonique et refuse un handoff source différent', async () => {
    const draftScope: HopAdviceV1Scope = { kind: 'draft', id: 'same-canonical-source' };
    const recipeScope: HopAdviceV1Scope = { kind: 'recipe', id: 'same-canonical-source' };
    expect(hopAdviceV1ClientPartitionKey(ownerKey, draftScope)).toBe(hopAdviceV1ClientPartitionKey(ownerKey, recipeScope));
    const transportMock = transport();
    const runtimeForDraft = runtime(draftScope, transportMock);
    const exactRecipeInput = makeInput({ scope: recipeScope, requestScope: recipeScope, operationId: 'op-recipe-after-draft',
      question: 'Même partition, source Recipe explicite', mode: 'auto' });
    await runtimeForDraft.jobs.start();
    runtimeForDraft.jobs.submit(exactRecipeInput, 'Recipe');
    await vi.waitFor(() => expect(transportMock.submit).toHaveBeenCalledTimes(1));

    const wrongSourceTransport = transport();
    const wrongSourceRuntime = runtime(draftScope, wrongSourceTransport);
    await wrongSourceRuntime.jobs.start();
    const mismatched = makeInput({ scope: recipeScope, requestScope: draftScope, operationId: 'op-wrong-source',
      question: 'Question source mismatch', mode: 'fast' });
    wrongSourceRuntime.jobs.submit(mismatched, 'Source incorrecte');
    await vi.waitFor(() => expect(wrongSourceRuntime.jobs.snapshot().jobs[0]?.sendError).toBeDefined());
    expect(wrongSourceTransport.submit).not.toHaveBeenCalled();

    const otherScope = makeInput({ scope: { kind: 'batch', id: 'not-this-partition' }, operationId: 'op-outside',
      question: 'Scope étranger', mode: 'fast' });
    expect(() => runtimeForDraft.jobs.submit(otherScope, 'Étranger')).toThrow(/partition/i);
  });

  it('filtre activity à la partition et passe history/reset à la portée exacte fournie', async () => {
    const scope: HopAdviceV1Scope = { kind: 'draft', id: 'shared-recipe-partition' };
    const samePartitionRecipe: HopAdviceV1Scope = { kind: 'recipe', id: scope.id };
    const opInput = { scope: samePartitionRecipe, operationId: 'op-historical-recipe', question: 'Historique', generation: 3 };
    const allowed = makeJob(opInput, { id: 'server-recipe-job' });
    const foreign = makeJob({ scope: { kind: 'batch', id: 'different' }, operationId: 'op-foreign', question: 'Autre', generation: 3 },
      { id: 'server-foreign-job' });
    const history = Object.assign([makeTurn(opInput.operationId, opInput.question)], { generation: 3, draft: { unchanged: true } });
    const transportMock = transport({ activity: vi.fn(async () => [allowed, foreign]), history: vi.fn(async () => history) });
    const created = runtime(scope, transportMock);
    await created.jobs.start();
    await vi.waitFor(() => expect(created.jobs.snapshot().jobs.map((job) => job.operationId)).toEqual([opInput.operationId]));
    await expect(created.history(samePartitionRecipe)).resolves.toBe(history);
    await expect(created.reset(samePartitionRecipe, 3, 'reset-op')).resolves.toEqual({ generation: 4 });
    expect(transportMock.history).toHaveBeenCalledWith(samePartitionRecipe, undefined);
    expect(transportMock.reset).toHaveBeenCalledWith(samePartitionRecipe, 3, 'reset-op');
  });

  it('garde l’input exact au reload jusqu’au markRead après succès du callback local', async () => {
    const scope: HopAdviceV1Scope = { kind: 'recipe', id: 'receipt-pending-source' };
    const question = 'Préserve le texte reçu : poire, œillet et houblon 🟩';
    const input = makeInput({ scope, operationId: 'op-receipt-pending', question, mode: 'deep', generation: 11,
      phase: 'Garde', draft: undefined });
    const firstActivity: BrewerJob[] = [];
    let serverJob: BrewerJob | undefined;
    const transportFirst = transport({
      activity: vi.fn(async () => structuredClone(serverJob ? [serverJob] : firstActivity)),
      submit: vi.fn(async (wire) => {
        serverJob = makeJob(wire, { id: 'durable-server-job', status: 'running', stage: 'analysis' });
        return { job: structuredClone(serverJob) };
      }),
    });
    const firstRuntime = runtime(scope, transportFirst);
    expect(firstRuntime.jobs.retainInputUntilRead).toBe(true);
    firstRuntime.jobs.submit(input, 'Pending receipt');
    await vi.waitFor(() => expect(transportFirst.submit).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(firstRuntime.jobs.snapshot().jobs[0]?.id).toBe('durable-server-job'));
    expect(firstRuntime.jobs.snapshot().jobs[0]?.input).toEqual(input);
    if (!serverJob) throw new Error('Le job transport fixture doit être durable.');
    serverJob = { ...serverJob, status: 'done', stage: 'review', updatedAt: Date.now() + 100 };
    await firstRuntime.jobs.refresh();
    await vi.waitFor(() => expect(firstRuntime.jobs.snapshot().jobs[0]?.turn).toBeDefined());
    expect(firstRuntime.jobs.snapshot().jobs[0]?.input).toEqual(input);
    firstRuntime.dispose();

    const completedJob = structuredClone(serverJob);
    const markRead = vi.fn().mockRejectedValueOnce(new Error('Receipt local pas encore attaché.')).mockResolvedValue(undefined);
    const transportReloaded = transport({ activity: vi.fn(async () => [completedJob]), markRead });
    const reloaded = runtime(scope, transportReloaded);
    await reloaded.jobs.start();
    await vi.waitFor(() => expect(reloaded.jobs.snapshot().jobs[0]?.turn).toBeDefined());
    const recovered = reloaded.jobs.snapshot().jobs[0];
    expect(recovered.input).toEqual(input);
    expect(recovered.operationId).toBe(input.operationId);
    expect(transportReloaded.submit).not.toHaveBeenCalled();

    let localReceiptAttached = false;
    await Promise.resolve(recovered.input).then((persistedInput) => {
      expect(persistedInput).toEqual(input);
      localReceiptAttached = true;
    });
    if (localReceiptAttached) reloaded.jobs.markRead(recovered);
    await vi.waitFor(() => expect(markRead).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(reloaded.jobs.snapshot().jobs[0]?.input).toEqual(input);

    if (localReceiptAttached) reloaded.jobs.markRead(reloaded.jobs.snapshot().jobs[0]);
    await vi.waitFor(() => expect(markRead).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(reloaded.jobs.snapshot().jobs[0]?.readAt).toBeDefined());
    expect(reloaded.jobs.snapshot().jobs[0]?.input).toBeUndefined();
    const stored = JSON.parse(localStorage.getItem(reloaded.storeNamespace) ?? '[]') as Array<Record<string, unknown>>;
    expect(stored[0]).not.toHaveProperty('input');
  });

  it('refuse un transport incomplet ou un userKey autre que l’owner capturé', async () => {
    const scope: HopAdviceV1Scope = { kind: 'app', id: 'hop-advice-screen' };
    expect(() => createBrewerHopAdviceRuntimeFactory({ submit: vi.fn() } as never)).toThrow(/history\/reset injectés/i);
    const hostFactory: HopV55AssistedRuntimeFactory = createBrewerHopAdviceRuntimeFactory(transport());
    const hostRuntime = hostFactory({ ownerKey, scope });
    expect(hostRuntime.mode).toBe(HOP_ADVICE_PROTOCOL_V1.name);
    expect(hostRuntime.storeNamespace).toBe(hopAdviceV1ClientPartitionKey(ownerKey, scope));
    const created = runtime(scope, transport({ userKey: vi.fn(async () => 'other-user') }));
    await expect(created.jobs.start()).rejects.toThrow(/userKey.*ownerKey/i);
  });
});
