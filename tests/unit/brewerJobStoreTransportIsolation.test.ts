// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerChatInput, BrewerJob, BrewerReply, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
import { BrewerChat } from '../../src/services/brewerChat';
import { createBrewerJobStore, type BrewerJobStoreOptions, type BrewerJobStoreTransport,
  type ClientBrewerJob } from '../../src/services/brewerJobs';

const stores: ReturnType<typeof createBrewerJobStore>[] = [];

function makeJob(input: Pick<BrewerChatInput, 'scope' | 'operationId' | 'question' | 'generation'>,
  overrides: Partial<ClientBrewerJob> = {}): ClientBrewerJob {
  const now = Date.now();
  return {
    id: input.operationId, operationId: input.operationId, scope: input.scope, question: input.question,
    generation: input.generation ?? 0, label: 'Fixture isolée', status: 'queued', stage: 'queued',
    createdAt: now, updatedAt: now, attempt: 0, ...overrides,
  };
}

function makeTurn(operationId: string, question: string): BrewerTurn {
  return { id: `turn:${operationId}`, operationId, question, evidence: [], createdAt: Date.now(), model: 'fixture',
    reviewed: true, contextLabel: 'Fixture transport',
    advice: { level: 'info', summary: 'Réponse fixture.', action: 'Consulter.', why: 'Essai local.', watch: 'Aucune action.',
      question: '', evidenceIds: [] } };
}

function makeTransport(input: { userKey?: string; activity?: BrewerJob[]; submitReply?: BrewerReply; retryReply?: BrewerReply;
  statusReply?: BrewerReply } = {}) {
  const transport: BrewerJobStoreTransport = {
    userKey: vi.fn(async () => input.userKey ?? 'transport-owner'),
    activity: vi.fn(async () => structuredClone(input.activity ?? [])),
    submit: vi.fn(async (request) => input.submitReply ?? { turn: makeTurn(request.operationId, request.question) }),
    retry: vi.fn(async (_jobId, operationId) => input.retryReply ?? { turn: makeTurn(operationId, 'Reprise fixture.') }),
    status: vi.fn(async (request) => input.statusReply ?? { turn: makeTurn(request.operationId, request.question) }),
    markRead: vi.fn(async () => undefined),
  };
  return transport;
}

function createIsolatedStore(namespace: string, transport: BrewerJobStoreTransport,
  sameScope = (left: BrewerScope, right: BrewerScope) => left.kind === right.kind && left.id === right.id,
  retainInputUntilRead = false) {
  const options: BrewerJobStoreOptions = {
    transport,
    storageKeyForUser: (userKey) => `hop-v55-jobs:${namespace}:${userKey}`,
    scopeIdentity: (scope) => `${scope.kind}:${scope.id}`,
    sameScope,
    retainInputUntilRead,
  };
  const store = createBrewerJobStore(options);
  stores.push(store);
  return store;
}

afterEach(() => {
  for (const store of stores.splice(0)) store.stop();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('BrewerJobStore — transport et partition isolés', () => {
  it('envoie, suit, récupère, relance et marque lu uniquement par le transport injecté', async () => {
    const scope: BrewerScope = { kind: 'draft', id: 'draft-transport-1' };
    const input: BrewerChatInput = { scope, operationId: 'operation-transport-1', question: 'Question isolée', generation: 2 };
    const recoveredJob = makeJob(input, { id: 'server-job-transport-1', status: 'done', stage: 'review', updatedAt: Date.now() + 100 });
    const transport = makeTransport({ userKey: 'shared-owner', activity: [recoveredJob] });
    const store = createIsolatedStore('one', transport);
    const defaultSubmit = vi.spyOn(BrewerChat, 'submit').mockRejectedValue(new Error('Le transport singleton ne doit pas être appelé.'));
    const defaultRetry = vi.spyOn(BrewerChat, 'retry').mockRejectedValue(new Error('Le transport singleton ne doit pas être appelé.'));
    const defaultActivity = vi.spyOn(BrewerChat, 'activity').mockRejectedValue(new Error('Le transport singleton ne doit pas être appelé.'));
    const defaultStatus = vi.spyOn(BrewerChat, 'status').mockRejectedValue(new Error('Le transport singleton ne doit pas être appelé.'));
    const defaultMarkRead = vi.spyOn(BrewerChat, 'markRead').mockRejectedValue(new Error('Le transport singleton ne doit pas être appelé.'));
    const defaultUserKey = vi.spyOn(BrewerChat, 'userKey').mockRejectedValue(new Error('Le transport singleton ne doit pas être appelé.'));

    await store.start();
    await vi.waitFor(() => expect(transport.status).toHaveBeenCalledWith({ scope, operationId: input.operationId,
      generation: 2, question: input.question }));
    await vi.waitFor(() => expect(store.snapshot().jobs.find((job) => job.operationId === input.operationId)?.turn).toBeDefined());

    store.submit(input, 'Question fixture');
    await vi.waitFor(() => expect(transport.submit).toHaveBeenCalledWith(input));
    await vi.waitFor(() => expect(store.snapshot().jobs.some((job) => job.operationId === input.operationId)).toBe(true));
    const completed = store.snapshot().jobs.find((job) => job.operationId === input.operationId)!;
    store.markRead(completed);
    await vi.waitFor(() => expect(transport.markRead).toHaveBeenCalledWith(completed.id));

    const retryJob = { ...completed, sourceJobId: 'server-job-original', input, turn: undefined, readAt: undefined };
    store.retry(retryJob);
    await vi.waitFor(() => expect(transport.retry).toHaveBeenCalledWith('server-job-original', input.operationId));
    expect(transport.userKey).toHaveBeenCalledTimes(1);
    expect(transport.activity).toHaveBeenCalled();
    expect(defaultSubmit).not.toHaveBeenCalled();
    expect(defaultRetry).not.toHaveBeenCalled();
    expect(defaultActivity).not.toHaveBeenCalled();
    expect(defaultStatus).not.toHaveBeenCalled();
    expect(defaultMarkRead).not.toHaveBeenCalled();
    expect(defaultUserKey).not.toHaveBeenCalled();
  });

  it('isole les clés au reload pour le même owner/opération/scope et garde recipe et draft distincts', async () => {
    const transportA = makeTransport({ userKey: 'same-owner' });
    const transportB = makeTransport({ userKey: 'same-owner' });
    const storeA = createIsolatedStore('alpha', transportA);
    const storeB = createIsolatedStore('beta', transportB);
    await Promise.all([storeA.start(), storeB.start()]);
    const scope: BrewerScope = { kind: 'recipe', id: 'same-recipe' };
    const common = { scope, operationId: 'same-operation', question: 'Question commune', generation: 1 };
    storeA.merge([makeJob(common, { label: 'Store alpha' })]);
    storeB.merge([makeJob(common, { label: 'Store beta' })]);
    expect(localStorage.getItem('hop-v55-jobs:alpha:same-owner')).not.toBeNull();
    expect(localStorage.getItem('hop-v55-jobs:beta:same-owner')).not.toBeNull();
    expect(localStorage.getItem('brewer-jobs:same-owner')).toBeNull();

    const reloadedA = createIsolatedStore('alpha', makeTransport({ userKey: 'same-owner' }));
    const reloadedB = createIsolatedStore('beta', makeTransport({ userKey: 'same-owner' }));
    await Promise.all([reloadedA.start(), reloadedB.start()]);
    await vi.waitFor(() => expect(reloadedA.snapshot().jobs[0]?.label).toBe('Store alpha'));
    await vi.waitFor(() => expect(reloadedB.snapshot().jobs[0]?.label).toBe('Store beta'));

    const exactScopeStore = createIsolatedStore('scope-identity', makeTransport({ userKey: 'same-owner' }));
    await exactScopeStore.start();
    const sameOp = 'same-operation-in-two-scopes';
    const recipe = makeJob({ scope: { kind: 'recipe', id: 'same-id' }, operationId: sameOp, question: 'Recette', generation: 1 });
    const draft = makeJob({ scope: { kind: 'draft', id: 'same-id' }, operationId: sameOp, question: 'Brouillon', generation: 1 });
    exactScopeStore.merge([recipe, draft]);
    expect(exactScopeStore.snapshot().jobs).toHaveLength(2);
    exactScopeStore.forget(recipe.scope, 2);
    expect(exactScopeStore.snapshot().jobs.map((job) => job.scope)).toEqual([draft.scope]);
  });

  it('refuse les options injectées partielles au lieu de retomber sur BrewerChat', () => {
    const partialUserKey = vi.fn(async () => 'partial-owner');
    const partial = { transport: { userKey: partialUserKey }, storageKeyForUser: (userKey: string) => `jobs:${userKey}`,
      scopeIdentity: (scope: BrewerScope) => `${scope.kind}:${scope.id}`,
      sameScope: (left: BrewerScope, right: BrewerScope) => left.kind === right.kind && left.id === right.id } as unknown as BrewerJobStoreOptions;
    expect(() => createBrewerJobStore(partial)).toThrow(/transport complet/i);
    const transport = makeTransport();
    const missingComparator = { transport, storageKeyForUser: (userKey: string) => `jobs:${userKey}`,
      scopeIdentity: (scope: BrewerScope) => `${scope.kind}:${scope.id}` } as unknown as BrewerJobStoreOptions;
    expect(() => createBrewerJobStore(missingComparator)).toThrow(/comparaison de scope/i);
    expect(partialUserKey).not.toHaveBeenCalled();
    expect(transport.userKey).not.toHaveBeenCalled();
  });

  it('ne purge pas l’input sur un readAt distant et le purge seulement après son propre markRead réussi', async () => {
    const scope: BrewerScope = { kind: 'recipe', id: 'retained-input-source' };
    const transport = makeTransport({ userKey: 'retained-owner' });
    const store = createIsolatedStore('retained-input', transport, undefined, true);
    await store.start();
    const externallyReadInput: BrewerChatInput = { scope, operationId: 'op:remote-read', question: 'Question conservée', generation: 1 };
    const externallyRead = { ...makeJob(externallyReadInput, { id: 'server:remote-read', status: 'done',
      readAt: Date.now() }), input: externallyReadInput };
    store.merge([externallyRead]);
    expect(store.snapshot().jobs[0]?.input).toEqual(externallyReadInput);

    const localInput: BrewerChatInput = { scope, operationId: 'op:local-read', question: 'Receipt local', generation: 1 };
    const localDone = { ...makeJob(localInput, { id: 'server:local-read', status: 'done' }), input: localInput };
    store.merge([localDone]);
    store.markRead(localDone);
    await vi.waitFor(() => expect(transport.markRead).toHaveBeenCalledWith(localDone.id));
    await vi.waitFor(() => expect(store.snapshot().jobs.find((job) => job.operationId === localInput.operationId)?.input).toBeUndefined());
  });

  it('préserve la clé, le transport et l’identité de scope du store ordinaire sans options', async () => {
    const userKey = vi.spyOn(BrewerChat, 'userKey').mockResolvedValue('ordinary-owner');
    const activity = vi.spyOn(BrewerChat, 'activity').mockResolvedValue([]);
    const store = createBrewerJobStore();
    stores.push(store);
    await store.start();
    const draftScope: BrewerScope = { kind: 'draft', id: 'ordinary-scope' };
    store.merge([makeJob({ scope: draftScope, operationId: 'ordinary-op', question: 'Question', generation: 1 })]);
    expect(userKey).toHaveBeenCalledOnce();
    expect(activity).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('brewer-jobs:ordinary-owner') ?? '[]')).toHaveLength(1);
    store.forget({ kind: 'recipe', id: draftScope.id }, 2);
    expect(store.snapshot().jobs).toHaveLength(0);
  });
});
