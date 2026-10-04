import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrewerChat, type BrewerChatAssistedRuntime, type BrewerChatJobActivity } from '../../src/ui/BrewerChat';
import { BrewerChat as api } from '../../src/services/brewerChat';
import type { BrewerHistory } from '../../src/services/brewerChat';
import { brewerJobs } from '../../src/services/brewerJobs';
import type { BrewerChatInput, BrewerReply, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
import type { ClientBrewerJob } from '../../src/services/brewerJobs';
import type { HopV55AssistedCompanionTurn } from '../../src/ui/hopV55/assistedAdviceUiContracts';
import { hopAdviceV1ClientPartitionKey } from '../../functions/src/brewerHopAdviceTransportV1';
import {
  BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT,
  BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT
} from '../../functions/src/brewerHopAdviceContextBinding';
import {
  BREWER_HOP_ADVICE_PROPOSAL_FORMAT,
  BREWER_HOP_ADVICE_REQUEST_FORMAT,
  validateBrewerHopAdviceRequest,
  type BrewerHopAdviceProposalEnvelope,
  type BrewerHopAdviceRequest
} from '../../functions/src/brewerHopAdviceProposal';

vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: {
    userKey: vi.fn().mockResolvedValue('test-user'),
    history: vi.fn(),
    submit: vi.fn(),
    activity: vi.fn(),
    markRead: vi.fn(),
    status: vi.fn(),
    reset: vi.fn(),
    apply: vi.fn()
  },
  brewerChatError: () => 'La question est conservée ; réessaie.'
}));

vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer }: any) =>
    open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null
}));

const scope: BrewerScope = { kind: 'recipe', id: 'REC-A' };
const baseProps = { scope, label: 'Recette A' };

function createAssistedRuntime(storeNamespace = 'test:hopAdviceReadonlyV1:owner:recipe:REC-A') {
  let state: BrewerChatJobActivity = { jobs: [], connectionError: '' };
  let started = false;
  const listeners = new Set<() => void>();
  const persist = () => {
    try { localStorage.setItem(storeNamespace, JSON.stringify(state.jobs)); } catch { /* Fixture-only best effort. */ }
  };
  const publish = (job: ClientBrewerJob) => {
    const next = new Map(state.jobs.map((row) => [row.operationId, row]));
    next.set(job.operationId, job);
    state = { ...state, jobs: [...next.values()].sort((a, b) => a.createdAt - b.createdAt) };
    persist();
    listeners.forEach((listener) => listener());
  };
  const transportSubmit = vi.fn(async (_input: BrewerChatInput): Promise<BrewerReply> => ({}));
  const history = vi.fn(async (_scope: BrewerScope, before?: number): Promise<BrewerHistory> =>
    Object.assign(state.jobs.map((job) => job.turn).filter((turn): turn is BrewerTurn => !!turn && (before === undefined || turn.createdAt < before)), { generation: 0 }));
  const reset = vi.fn(async (_scope: BrewerScope, _generation: number, _operationId: string) => ({ generation: 1 }));
  const jobs: BrewerChatAssistedRuntime['jobs'] = {
    retainInputUntilRead: true,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    snapshot: () => state,
    start: vi.fn(async () => {
      if (started) return;
      started = true;
      try {
        const stored = JSON.parse(localStorage.getItem(storeNamespace) ?? '[]');
        if (Array.isArray(stored)) state = { jobs: stored.map((job) => job && typeof job === 'object'
          ? { ...job, sending: false, ...(!job.turn && job.input?.hopAdvice && !job.sendError
            ? { sendError: 'Réponse assistée non confirmée; réessaie le même operationId.' } : {}) }
          : job).filter((job) => job && typeof job.operationId === 'string'), connectionError: '' };
        listeners.forEach((listener) => listener());
      } catch { /* Ignore only this fake fixture namespace. */ }
    }),
    refresh: vi.fn(async () => {}),
    submit: vi.fn((input, label) => {
      const now = Date.now();
      const pending: ClientBrewerJob = {
        id: input.operationId, operationId: input.operationId, input, scope: input.scope,
        question: input.question, generation: input.generation ?? 0, label, status: 'queued',
        stage: 'queued', createdAt: now, updatedAt: now, attempt: 0, sending: true
      };
      publish(pending);
      void transportSubmit(input).then((reply) => {
        if (reply.turn) publish({ ...pending, id: reply.turn.id, status: 'done', stage: 'saving',
          turn: reply.turn, sending: false, finishedAt: Date.now(), updatedAt: Date.now() });
        else if (reply.job) publish({ ...pending, ...reply.job, sending: false });
      }).catch((error) => publish({ ...pending, sending: false, sendError: String(error) }));
    }),
    retry: vi.fn((job) => {
      if (!job.input) return;
      const pending = { ...job, sending: true, sendError: undefined, updatedAt: Date.now() };
      publish(pending);
      void transportSubmit(job.input).then((reply) => {
        if (reply.turn) publish({ ...pending, id: reply.turn.id, status: 'done', stage: 'saving',
          turn: reply.turn, sending: false, finishedAt: Date.now(), updatedAt: Date.now() });
      });
    }),
    markRead: vi.fn((job) => {
      if (job.readAt || job.sending || job.status === 'running' || job.status === 'queued') return;
      publish({ ...job, readAt: Date.now(), input: job.status === 'done' ? undefined : job.input });
    }),
    forget: vi.fn((targetScope, generation) => {
      state = { ...state, jobs: state.jobs.filter((job) => job.scope.id !== targetScope.id || job.generation >= generation) };
      persist();
      listeners.forEach((listener) => listener());
    })
  };
  const runtime: BrewerChatAssistedRuntime = {
    mode: 'hopAdviceReadonlyV1',
    storeNamespace,
    history,
    reset,
    jobs
  };
  return { runtime, transportSubmit, publish, setSession: vi.fn((_session: unknown) => {}) };
}

function requestFor(question: string, sourceReadingReference = 'reading:A'): BrewerHopAdviceRequest {
  const launchScope = { kind: 'recipe' as const, id: 'REC-A' };
  const expected = {
    format: BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT,
    scope: launchScope,
    source: { kind: 'recipe' as const, id: 'REC-A', label: 'Recette A', snapshotReference: 'recipe:REC-A:v1' },
    journal: { state: 'absent' as const, revision: { state: 'absent' as const }, contentReference: null, localOverlay: 'notPresent' as const },
    culture: { status: 'notReceived' as const },
    physicalAnchorReference: 'physical:REC-A:v1',
    catalogueDependencyReference: 'catalogue:v1',
    calculationDependencyReference: 'calculation:v1',
    runtimeDataRevision: null,
    stockAvailabilityReference: null
  };
  return validateBrewerHopAdviceRequest({
    format: BREWER_HOP_ADVICE_REQUEST_FORMAT,
    question,
    sourceReadingReference,
    contextLaunch: {
      format: BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT,
      ownerKey: 'owner-test',
      workspaceId: 'workspace-test',
      sourceReadingReference,
      source: { kind: 'recipe', id: 'REC-A' },
      sourceRuntimeReference: 'runtime:REC-A:v1',
      scope: launchScope,
      expected
    },
    readerAnnotations: [],
    readerScopes: []
  }, question);
}

type AssistedInput = BrewerChatInput & { hopAdvice: BrewerHopAdviceRequest };
function responseTurn(input: AssistedInput): BrewerTurn {
  const evidence: BrewerTurn['evidence'] = [{
    id: 'evidence-full', name: 'lookup_brewing_catalogue', label: 'Catalogue local',
    facts: ['Fait conservé'], limits: ['Limite conservée'], data: { exact: ['payload', 'kept'] }
  }];
  const envelope: BrewerHopAdviceProposalEnvelope = {
    format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT,
    status: 'proposal',
    request: structuredClone(input.hopAdvice),
    proposal: {} as BrewerHopAdviceProposalEnvelope['proposal'],
    evidence: { tools: [], dependencies: [], records: [] },
    serverContext: {
      phase: 'brassage', provenance: ['source chargée'], loadedAt: 10,
      binding: structuredClone(input.hopAdvice.contextLaunch.expected)
    }
  };
  return {
    id: `turn-${input.operationId}`,
    operationId: input.operationId,
    question: input.question,
    createdAt: Date.now(),
    model: 'model-test',
    reviewed: true,
    contextLabel: 'Recette A',
    evidence,
    advice: {
      level: 'info', summary: `Résumé ${input.operationId}`, action: 'Relire les faits.', why: '',
      watch: '', question: '', evidenceIds: []
    },
    hopAdviceProposal: envelope
  };
}

async function openChat() {
  fireEvent.click(screen.getByRole('button', { name: /Compagnon brasseur/ }));
  await waitFor(() => expect(screen.queryByText('Chargement des échanges…')).not.toBeInTheDocument());
}

beforeEach(() => {
  brewerJobs.stop();
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(api.history).mockResolvedValue([]);
  vi.mocked(api.status).mockResolvedValue({});
  vi.mocked(api.activity).mockImplementation(async () => brewerJobs.snapshot().jobs);
  vi.mocked(api.markRead).mockResolvedValue(undefined);
  vi.mocked(api.reset).mockResolvedValue({ generation: 1 });
});

afterEach(() => {
  cleanup();
  brewerJobs.stop();
});

describe('BrewerChat — raccord de lecture assistée', () => {
  it('garde le mode normal et transmet la question après son trim habituel', async () => {
    vi.mocked(api.submit).mockImplementation(async (input) => ({
      turn: {
        id: 'normal-turn', operationId: input.operationId, question: input.question, createdAt: Date.now(),
        model: 'model-test', reviewed: true, contextLabel: 'Recette A', evidence: [],
        advice: { level: 'info', summary: 'Réponse', action: '', why: '', watch: '', question: '', evidenceIds: [] }
      }
    }));
    render(<BrewerChat {...baseProps} initialQuestion="  Question normale  " />);
    await openChat();
    expect(screen.getByText('On regarde ça ensemble.')).toBeVisible();
    expect(screen.getByRole('button', { name: /Vérifie ma recette et mon matériel/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(api.submit).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.submit).mock.calls[0][0]).toMatchObject({ question: 'Question normale' });
    expect(vi.mocked(api.submit).mock.calls[0][0].hopAdvice).toBeUndefined();
  });

  it('envoie le texte Unicode exact après le hook et rend le reçu complet une seule fois', async () => {
    const question = '\u00a0Quel houblon\u202f: garde-le\t?\u00a0';
    const request = requestFor(question);
    const { runtime, transportSubmit, publish } = createAssistedRuntime();
    const order: string[] = [];
    const onBeforeSend = vi.fn(async (_input: BrewerChatInput) => { order.push('ticket'); });
    const onAssistedTurn = vi.fn();
    transportSubmit.mockImplementation(async (input) => {
      order.push('transport');
      return { turn: responseTurn(input as AssistedInput) };
    });
    render(<BrewerChat {...baseProps} assistedRuntime={runtime}
      assistedAdvice={{ id: 'session-verbatim', request, onBeforeSend, onAssistedTurn }} />);
    await openChat();
    expect(screen.getByText('Lecture assistée')).toBeVisible();
    expect(screen.getByText(/question reste liée à la lecture enregistrée et à son contexte exact/i)).toBeVisible();
    expect(screen.getByText(/Le conseil reste une proposition/)).toBeVisible();
    expect(screen.queryByRole('button', { name: /Vérifie ma recette et mon matériel/ })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(question);
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(onAssistedTurn).toHaveBeenCalledTimes(1));
    const input = transportSubmit.mock.calls[0][0];
    expect(order).toEqual(['ticket', 'transport']);
    expect(input.question).toBe(question);
    expect(input.hopAdvice).toEqual(request);
    expect(input.scope).toEqual(request.contextLaunch.scope);
    expect(input).not.toHaveProperty('turnEvidence');
    expect(onBeforeSend.mock.calls[0][0]).toEqual(input);
    const delivered = onAssistedTurn.mock.calls[0][0];
    expect(delivered.input).toEqual(input);
    expect(delivered.job.input).toEqual(input);
    expect(delivered.envelope).toEqual(delivered.turn.hopAdviceProposal);
    expect(delivered.evidence).toEqual(delivered.turn.evidence);
    expect(delivered.evidence[0].data).toEqual({ exact: ['payload', 'kept'] });

    const finished = runtime.jobs.snapshot().jobs.find((job) => job.operationId === input.operationId)!;
    await act(async () => publish({ ...finished, updatedAt: finished.updatedAt + 1 }));
    expect(onAssistedTurn).toHaveBeenCalledTimes(1);
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('marque l’attente fixture comme locale sans changer les libellés du runtime hôte', async () => {
    const request = requestFor('Question de contrôle de la fixture locale.');
    const local = createAssistedRuntime('assistantFixture:hopAdviceReadonlyV1:r23-status');
    const localInput: AssistedInput = { scope, operationId: 'operation:r23-local', question: request.question,
      generation: 0, hopAdvice: request };
    const localJob: ClientBrewerJob = { id: localInput.operationId, operationId: localInput.operationId, input: localInput,
      scope, question: localInput.question, generation: 0, label: 'Lecture assistée simulée', status: 'running', stage: 'analysis',
      createdAt: Date.now(), updatedAt: Date.now(), attempt: 1, sending: false, model: 'Réponse assistée simulée' };
    render(<BrewerChat {...baseProps} assistedRuntime={local.runtime} assistedAdvice={{ id: 'session-r23-local', request,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn: vi.fn() }} />);
    await openChat();
    await act(async () => { local.publish(localJob); });
    expect(screen.getByText('Réponse simulée en attente')).toBeVisible();
    expect(screen.getByText('Traitement local · réponse simulée')).toBeVisible();
    expect(screen.queryByText('Gemini analyse ta question')).not.toBeInTheDocument();
    expect(screen.queryByText('Enregistrée sur le serveur')).not.toBeInTheDocument();

    cleanup();
    const host = createAssistedRuntime(hopAdviceV1ClientPartitionKey('owner-test', { kind: 'recipe', id: 'REC-A' }));
    const hostInput: AssistedInput = { ...localInput, operationId: 'operation:r23-host' };
    const hostJob: ClientBrewerJob = { ...localJob, id: hostInput.operationId, operationId: hostInput.operationId, input: hostInput,
      label: 'Recette A', stage: 'analysis', model: undefined };
    render(<BrewerChat {...baseProps} assistedRuntime={host.runtime} assistedAdvice={{ id: 'session-r23-host', request,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn: vi.fn() }} />);
    await openChat();
    await act(async () => { host.publish(hostJob); });
    expect(screen.getByText('Gemini analyse ta question')).toBeVisible();
    expect(screen.getByText('Enregistrée sur le serveur')).toBeVisible();
  });

  it.each([
    ['namespace absent', undefined],
    ['namespace futur', 'assistantFixture:hopAdviceReadonlyV2:future'],
  ])('garde le refus normal si le runtime a un %s, sans envoyer la question', async (_label, namespace) => {
    const request = requestFor('Question avec namespace fixture non reconnu');
    const { runtime, transportSubmit } = createAssistedRuntime(namespace ?? 'fixture:temporary');
    if (namespace === undefined) delete (runtime as unknown as { storeNamespace?: string }).storeNamespace;
    const onBeforeSend = vi.fn(async (_input: BrewerChatInput) => {});
    const onAssistedTurn = vi.fn();
    render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: `session-${_label}`, request,
      onBeforeSend, onAssistedTurn }} />);
    await openChat();

    expect(screen.getByText(/Aucune question ne partira par le compagnon standard/)).toBeVisible();
    const send = screen.getByRole('button', { name: 'Envoyer la question' });
    expect(send).toBeDisabled();
    fireEvent.click(send);
    expect(onBeforeSend).not.toHaveBeenCalled();
    expect(onAssistedTurn).not.toHaveBeenCalled();
    expect(transportSubmit).not.toHaveBeenCalled();
    expect(api.history).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('refuse une portée différente avant le hook ou le transport', async () => {
    const request = requestFor('Question issue de REC-A');
    const { runtime, transportSubmit } = createAssistedRuntime();
    const onBeforeSend = vi.fn(async (_input: BrewerChatInput) => {});
    const onAssistedTurn = vi.fn();
    render(<BrewerChat scope={{ kind: 'batch', id: 'BATCH-B' }} label="Brassin B"
      assistedRuntime={runtime} assistedAdvice={{ id: 'session-scope', request, onBeforeSend, onAssistedTurn }} />);
    await openChat();
    expect(screen.getByText(/liée à une autre portée/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Envoyer la question' })).toBeDisabled();
    expect(onBeforeSend).not.toHaveBeenCalled();
    expect(transportSubmit).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('ferme l’envoi si la façade qualifiée manque, sans appeler le transport ordinary', async () => {
    const request = requestFor('Question assistée sans runtime');
    render(<BrewerChat {...baseProps} assistedAdvice={{ id: 'session-no-runtime', request,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn: vi.fn() }} />);
    await openChat();
    expect(screen.getByText(/Aucune question ne partira par le compagnon standard/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Envoyer la question' })).toBeDisabled();
    expect(api.history).not.toHaveBeenCalled();
    expect(api.activity).not.toHaveBeenCalled();
    expect(api.userKey).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
    expect(api.reset).not.toHaveBeenCalled();
  });

  it('refuse une façade portant le mauvais mode même si elle expose un job store', async () => {
    const request = requestFor('Question avec mauvais mode');
    const { runtime, transportSubmit } = createAssistedRuntime();
    (runtime as unknown as { mode: string }).mode = 'ordinary';
    render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: 'session-wrong-mode', request,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn: vi.fn() }} />);
    await openChat();
    expect(screen.getByText(/Aucune question ne partira par le compagnon standard/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Envoyer la question' })).toBeDisabled();
    expect(transportSubmit).not.toHaveBeenCalled();
    expect(api.history).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('ne traite pas les anciennes réponses assistées, qui restent au reader d’historique', async () => {
    const request = requestFor('Ancienne question');
    const { runtime, transportSubmit } = createAssistedRuntime();
    const input: AssistedInput = {
      scope, operationId: 'historic-operation', question: request.question, hopAdvice: request
    };
    const historicalTurn = responseTurn(input);
    runtime.history.mockResolvedValue(Object.assign([historicalTurn], { generation: 0 }));
    const onAssistedTurn = vi.fn();
    render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: 'session-history', request,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn }} />);
    await openChat();
    expect(screen.queryByText(`Résumé ${input.operationId}`)).not.toBeInTheDocument();
    expect(onAssistedTurn).not.toHaveBeenCalled();
    expect(transportSubmit).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('conserve un job de format futur en lecture seule, sans retry ni acquittement', async () => {
    const question = 'Question associée à une proposition future';
    const request = requestFor(question);
    const { runtime, transportSubmit, publish } = createAssistedRuntime();
    const operationId = 'unsupported-operation';
    const rawSnapshot = { format: 'brewer-hop-advice-proposal-v5', payload: { exact: ['kept', 17] } };
    const job: ClientBrewerJob = {
      id: operationId, operationId, input: { scope, operationId, question, generation: 0, hopAdvice: request },
      scope, question, generation: 0, label: 'Réponse future', status: 'error', stage: 'analysis',
      createdAt: Date.now(), updatedAt: Date.now(), attempt: 1, sending: false, sendError: 'Format futur conservé.',
      unsupportedReadOnly: { source: 'brewer-hop-advice-proposal-v5', snapshot: rawSnapshot, reason: 'Aucune conversion disponible.' }
    };
    publish(job);
    const onBeforeSend = vi.fn(async (_input: BrewerChatInput) => {});
    const onAssistedTurn = vi.fn();
    render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: 'session-unsupported', request,
      onBeforeSend, onAssistedTurn }} />);
    await openChat();

    expect(screen.getByText('Format futur conservé · lecture seule')).toBeVisible();
    expect(screen.getByText('Source conservée sans conversion · brewer-hop-advice-proposal-v5')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Réessayer l’envoi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reformuler' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Données brutes conservées (lecture seule)'));
    expect(screen.getByText(/"exact":/)).toBeVisible();
    expect(screen.getByText(/kept/)).toBeVisible();
    expect(runtime.jobs.retry).not.toHaveBeenCalled();
    expect(runtime.jobs.markRead).not.toHaveBeenCalled();
    expect(onBeforeSend).not.toHaveBeenCalled();
    expect(onAssistedTurn).not.toHaveBeenCalled();
    expect(transportSubmit).not.toHaveBeenCalled();
  });

  it('refuse localement une question modifiée et demande une nouvelle lecture', async () => {
    const request = requestFor('Question lue exactement');
    const { runtime, transportSubmit } = createAssistedRuntime();
    const onBeforeSend = vi.fn(async (_input: BrewerChatInput) => {});
    render(<BrewerChat {...baseProps} assistedRuntime={runtime}
      assistedAdvice={{ id: 'session-edited', request, onBeforeSend, onAssistedTurn: vi.fn() }} />);
    await openChat();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Question lue exactement.' } });
    expect(screen.getByText(/Reprends une nouvelle lecture dans l’atelier/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Envoyer la question' })).toBeDisabled();
    expect(onBeforeSend).not.toHaveBeenCalled();
    expect(transportSubmit).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('reprend après échec du hook avec le même input et le même operationId', async () => {
    const request = requestFor('Question à préparer');
    const { runtime, transportSubmit } = createAssistedRuntime();
    const onBeforeSend = vi.fn(async (_input: BrewerChatInput) => {})
      .mockRejectedValueOnce(new Error('Préparation indisponible.'))
      .mockResolvedValueOnce(undefined);
    transportSubmit.mockImplementation(() => new Promise(() => {}));
    render(<BrewerChat {...baseProps} assistedRuntime={runtime}
      assistedAdvice={{ id: 'session-retry', request, onBeforeSend, onAssistedTurn: vi.fn() }} />);
    await openChat();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await screen.findByRole('alert');
    expect(transportSubmit).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue(request.question);
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(transportSubmit).toHaveBeenCalledTimes(1));
    expect(onBeforeSend).toHaveBeenCalledTimes(2);
    expect(onBeforeSend.mock.calls[1][0]).toEqual(onBeforeSend.mock.calls[0][0]);
    expect(transportSubmit.mock.calls[0][0]).toEqual(onBeforeSend.mock.calls[0][0]);
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('restaure un pending après reload, revalide son ticket puis retry avec le même input/opération', async () => {
    const request = requestFor('Question conservée après reload', 'reading:reload');
    const namespace = 'test:hopAdviceReadonlyV1:owner:recipe:REC-A:reload';
    const first = createAssistedRuntime(namespace);
    first.transportSubmit.mockImplementation(() => new Promise(() => {}));
    const onBeforeSendA = vi.fn(async (_input: BrewerChatInput) => {});
    const firstView = render(<BrewerChat {...baseProps} assistedRuntime={first.runtime} assistedAdvice={{
      id: 'session-reload', request, onBeforeSend: onBeforeSendA, onAssistedTurn: vi.fn()
    }} />);
    await openChat();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(first.transportSubmit).toHaveBeenCalledTimes(1));
    const originalInput = first.transportSubmit.mock.calls[0][0];
    firstView.unmount();

    const reloaded = createAssistedRuntime(namespace);
    const onBeforeSendReloaded = vi.fn(async (_input: BrewerChatInput) => {});
    const onAssistedTurnReloaded = vi.fn();
    reloaded.transportSubmit.mockImplementation(async input => ({ turn: responseTurn(input as AssistedInput) }));
    render(<BrewerChat {...baseProps} assistedRuntime={reloaded.runtime} assistedAdvice={{
      id: 'session-reload', request, onBeforeSend: onBeforeSendReloaded, onAssistedTurn: onAssistedTurnReloaded
    }} />);
    await openChat();
    expect(screen.getByRole('button', { name: 'Réessayer l’envoi' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer l’envoi' }));
    await waitFor(() => expect(onAssistedTurnReloaded).toHaveBeenCalledTimes(1));
    expect(onBeforeSendReloaded).toHaveBeenCalledTimes(1);
    expect(onBeforeSendReloaded.mock.calls[0][0]).toEqual(originalInput);
    expect(reloaded.transportSubmit.mock.calls[0][0]).toEqual(originalInput);
    expect(reloaded.transportSubmit.mock.calls[0][0].operationId).toBe(originalInput.operationId);
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('n’expose pas au session B un pending A qui ne correspond pas à sa question', async () => {
    const requestA = requestFor('Je veux comprendre le contact à froid sans augmenter l’amertume.', 'reading:A-pending');
    const requestB = requestFor('Question B, contact à froid mais sans reprendre A.', 'reading:B-current');
    const { runtime, transportSubmit, setSession } = createAssistedRuntime('test:hopAdviceReadonlyV1:owner:recipe:REC-A:pending-a');
    transportSubmit.mockImplementation(() => new Promise(() => {}));
    const onBeforeSendA = vi.fn(async (_input: BrewerChatInput) => {});
    const view = render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{
      id: 'session-A-pending', request: requestA, onBeforeSend: onBeforeSendA, onAssistedTurn: vi.fn()
    }} />);
    setSession({ id: 'session-A-pending', request: requestA, context: {} as any, label: 'A',
      onBeforeSend: onBeforeSendA, onAssistedTurn: vi.fn() });
    await openChat();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(transportSubmit).toHaveBeenCalledTimes(1));

    const onBeforeSendB = vi.fn(async (_input: BrewerChatInput) => {});
    setSession({ id: 'session-B-current', request: requestB, context: {} as any, label: 'B',
      onBeforeSend: onBeforeSendB, onAssistedTurn: vi.fn() });
    view.rerender(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{
      id: 'session-B-current', request: requestB, onBeforeSend: onBeforeSendB, onAssistedTurn: vi.fn()
    }} />);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(requestB.question));
    expect(screen.queryByRole('button', { name: 'Réessayer l’envoi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rattacher la réponse assistée' })).not.toBeInTheDocument();
    expect(transportSubmit).toHaveBeenCalledTimes(1);
    expect(onBeforeSendB).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('garde une réponse DONE de A dans le reader Page au lieu de la rattacher depuis B', async () => {
    const requestA = requestFor('Je veux comprendre le contact à froid sans augmenter l’amertume.', 'reading:A-done');
    const requestB = requestFor('Question B, une autre lecture du contact à froid.', 'reading:B-done');
    const { runtime, publish } = createAssistedRuntime('test:hopAdviceReadonlyV1:owner:recipe:REC-A:done-a');
    const inputA: AssistedInput = { scope, operationId: 'operation-done-A', question: requestA.question, generation: 0, hopAdvice: requestA };
    const turnA = responseTurn(inputA);
    publish({ id: turnA.id, operationId: inputA.operationId, input: inputA, scope, question: inputA.question,
      generation: 0, label: 'A', status: 'done', stage: 'saving', createdAt: Date.now(), updatedAt: Date.now(),
      attempt: 1, turn: turnA, sending: false, finishedAt: Date.now() });
    const onBeforeSendB = vi.fn(async (_input: BrewerChatInput) => {});
    const onAssistedTurnB = vi.fn(async () => {});
    render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{
      id: 'session-B-current', request: requestB, onBeforeSend: onBeforeSendB, onAssistedTurn: onAssistedTurnB
    }} />);
    await openChat();
    expect(onAssistedTurnB).not.toHaveBeenCalled();
    expect(screen.queryByText(`Résumé ${inputA.operationId}`)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rattacher la réponse assistée' })).not.toBeInTheDocument();
    expect(onBeforeSendB).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue(requestB.question);
    const stored = runtime.jobs.snapshot().jobs.find(job => job.operationId === inputA.operationId)!;
    expect(stored.readAt).toBeUndefined();
    expect(stored.input).toEqual(inputA);
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('rattache une réponse DONE de la même lecture seulement au geste, puis ack après son callback', async () => {
    const request = requestFor('Je veux comprendre le contact à froid sans augmenter l’amertume.', 'reading:A-reopen');
    const { runtime, publish } = createAssistedRuntime('test:hopAdviceReadonlyV1:owner:recipe:REC-A:reopen-a');
    const input: AssistedInput = { scope, operationId: 'operation-reopen-A', question: request.question,
      generation: 0, hopAdvice: request };
    const turn = responseTurn(input);
    publish({ id: turn.id, operationId: input.operationId, input, scope, question: input.question,
      generation: 0, label: 'A', status: 'done', stage: 'saving', createdAt: Date.now(), updatedAt: Date.now(),
      attempt: 1, turn, sending: false, finishedAt: Date.now() });
    let resolveReceipt!: () => void;
    const onAssistedTurn = vi.fn(async (_receipt: HopV55AssistedCompanionTurn) => { await new Promise<void>((resolve) => { resolveReceipt = resolve; }); });
    const onBeforeSend = vi.fn(async (_input: BrewerChatInput) => {});
    render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: 'session-A-reopened',
      request, onBeforeSend, onAssistedTurn }} />);
    await openChat();
    expect(onAssistedTurn).not.toHaveBeenCalled();
    expect(screen.queryByText(`Résumé ${input.operationId}`)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rattacher la réponse assistée' }));
    await waitFor(() => expect(onAssistedTurn).toHaveBeenCalledTimes(1));
    expect(onBeforeSend).not.toHaveBeenCalled();
    const receipt = onAssistedTurn.mock.calls[0][0];
    expect(receipt.input).toEqual(input);
    expect(receipt.job.input).toEqual(input);
    expect(receipt.turn.question).toBe(request.question);
    expect(receipt.envelope.request).toEqual(request);
    expect(receipt.evidence).toEqual(turn.evidence);
    expect(runtime.jobs.snapshot().jobs[0].readAt).toBeUndefined();
    expect(runtime.jobs.snapshot().jobs[0].input).toEqual(input);

    await act(async () => resolveReceipt());
    await waitFor(() => expect(runtime.jobs.snapshot().jobs[0].readAt).toBeDefined());
    expect(runtime.jobs.snapshot().jobs[0].input).toBeUndefined();
    expect(screen.getByRole('textbox')).toHaveValue(request.question);
    expect(screen.getByText(`Résumé ${input.operationId}`)).toBeVisible();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('conserve A sous son ticket quand B est affichée sans changer le texte de B', async () => {
    const requestA = requestFor('Question A', 'reading:A');
    const requestB = requestFor('Question B', 'reading:B');
    const { runtime, transportSubmit } = createAssistedRuntime();
    const onAssistedTurnA = vi.fn();
    const onAssistedTurnB = vi.fn();
    const resolvers = new Map<string, (reply: BrewerReply) => void>();
    transportSubmit.mockImplementation((input) => new Promise((resolve) => {
      resolvers.set(input.operationId, resolve);
    }));
    const view = render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: 'session-A', request: requestA,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn: onAssistedTurnA }} />);
    await openChat();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(transportSubmit).toHaveBeenCalledTimes(1));
    const inputA = transportSubmit.mock.calls[0][0];
    view.rerender(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: 'session-B', request: requestB,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn: onAssistedTurnB }} />);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('Question B'));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(transportSubmit).toHaveBeenCalledTimes(2));
    const inputB = transportSubmit.mock.calls[1][0];

    await act(async () => resolvers.get(inputA.operationId)!({ turn: responseTurn(inputA as AssistedInput) }));
    await waitFor(() => expect(onAssistedTurnA).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('textbox')).toHaveValue('Question B');
    expect(onAssistedTurnA.mock.calls[0][0].input.operationId).toBe(inputA.operationId);
    expect(onAssistedTurnA.mock.calls[0][0].input.hopAdvice).toEqual(requestA);
    expect(onAssistedTurnB).not.toHaveBeenCalled();
    expect(screen.queryByText(`Résumé ${inputA.operationId}`)).not.toBeInTheDocument();
    expect(api.submit).not.toHaveBeenCalled();

    await act(async () => resolvers.get(inputB.operationId)!({ turn: responseTurn(inputB as AssistedInput) }));
    await waitFor(() => expect(onAssistedTurnB).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('textbox')).toHaveValue('Question B');
  });

  it('attribue un nouvel operationId à une nouvelle session, même pour la même requête archivée', async () => {
    const request = requestFor('Question relancée', 'reading:same');
    const { runtime, transportSubmit } = createAssistedRuntime();
    const onAssistedTurnA = vi.fn();
    const onAssistedTurnB = vi.fn();
    transportSubmit.mockImplementation(async (input) => ({ turn: responseTurn(input as AssistedInput) }));
    const view = render(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: 'session-first', request,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn: onAssistedTurnA }} />);
    await openChat();
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(onAssistedTurnA).toHaveBeenCalledTimes(1));
    const operationA = transportSubmit.mock.calls[0][0].operationId;

    view.rerender(<BrewerChat {...baseProps} assistedRuntime={runtime} assistedAdvice={{ id: 'session-second', request,
      onBeforeSend: vi.fn(async (_input: BrewerChatInput) => {}), onAssistedTurn: onAssistedTurnB }} />);
    await waitFor(() => expect(screen.queryByText('Chargement des échanges…')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la question' }));
    await waitFor(() => expect(onAssistedTurnB).toHaveBeenCalledTimes(1));
    const operationB = transportSubmit.mock.calls[1][0].operationId;
    expect(operationB).not.toBe(operationA);
    expect(api.submit).not.toHaveBeenCalled();
  });
});
