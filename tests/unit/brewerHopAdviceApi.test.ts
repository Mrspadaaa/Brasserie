import { describe, expect, it, vi } from 'vitest';
import type { BrewerJob, BrewerReply, BrewerTurn } from '../../functions/src/companionTypes';
import { BREWER_HOP_ADVICE_REQUEST_FORMAT, type BrewerHopAdviceRequest } from '../../functions/src/brewerHopAdviceProposal';
import { BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT, BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT } from '../../functions/src/brewerHopAdviceContextBinding';
import {
  HOP_ADVICE_PROTOCOL_V1,
  HOP_ADVICE_V1_FUNCTIONS,
  buildHopAdviceV1Wire,
  type HopAdviceV1ClientEntry,
  type HopAdviceV1PublicTurn,
  type HopAdviceV1Scope,
  type HopAdviceV1WireInput,
} from '../../functions/src/brewerHopAdviceTransportV1';
import { createBrewerHopAdviceApiV1, type BrewerHopAdviceV1CallableTransport } from '../../src/services/brewerHopAdviceApi';

const ownerKey = 'owner:hop-advice-api-é';
const scope: HopAdviceV1Scope = { kind: 'recipe', id: 'recette-雪' };
const question = 'Garde la poire et examine le houblon 🟩 — texté sans perte.';

function entry(overrides: Partial<HopAdviceV1ClientEntry> = {}): HopAdviceV1ClientEntry {
  const request = {
    format: BREWER_HOP_ADVICE_REQUEST_FORMAT, question, sourceReadingReference: 'reading:unicode-v1',
    contextLaunch: { format: BREWER_HOP_ADVICE_CONTEXT_LAUNCH_FORMAT, ownerKey, workspaceId: 'workspace:api-test',
      sourceReadingReference: 'reading:unicode-v1', scope, source: { kind: 'recipe', id: scope.id },
      sourceRuntimeReference: 'runtime:exact', expected: { format: BREWER_HOP_ADVICE_CONTEXT_PROJECTION_FORMAT, scope } },
  } as unknown as BrewerHopAdviceRequest;
  return { scope, operationId: 'operation:unicode-1', question, analysisMode: 'deep', generation: 3,
    phase: 'Fermentation · 17 °C', hopAdvice: request, ...overrides };
}

function publicJob(input: { scope?: HopAdviceV1Scope; operationId?: string; question?: string; generation?: number;
  id?: string; protocol?: string }): BrewerJob & { protocol: string } {
  const now = 1750000000000;
  return { protocol: input.protocol ?? HOP_ADVICE_PROTOCOL_V1.name, id: input.id ?? 'server-job-1',
    operationId: input.operationId ?? 'operation:unicode-1', scope: input.scope ?? scope,
    generation: input.generation ?? 0, question: input.question ?? question, label: 'Lecture assistée',
    status: 'done', stage: 'review', createdAt: now, updatedAt: now, attempt: 1 };
}

function publicTurn(input: { operationId?: string; question?: string; id?: string; protocol?: string;
  hopAdviceProposal?: unknown }): HopAdviceV1PublicTurn {
  return { protocol: input.protocol ?? HOP_ADVICE_PROTOCOL_V1.name, id: input.id ?? 'server-turn-1',
    operationId: input.operationId ?? 'operation:unicode-1', question: input.question ?? question,
    advice: { level: 'info', summary: 'Proposition publique.', action: 'Examiner.', why: 'Essai exact.', watch: '',
      question: '', evidenceIds: [] }, evidence: [], createdAt: 1750000000000, model: 'fixture-model', reviewed: true,
    contextLabel: 'Fixture v1', ...(input.hopAdviceProposal === undefined ? {} : { hopAdviceProposal: input.hopAdviceProposal }) };
}

function makeTransport(responses: Array<unknown | Error>, current = ownerKey) {
  const calls: Array<{ name: string; payload: unknown }> = [];
  const transport: BrewerHopAdviceV1CallableTransport = {
    currentUserKey: vi.fn(async () => current),
    invoke: vi.fn(async (name, payload) => {
      calls.push({ name, payload: structuredClone(payload) });
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next;
    }),
  };
  return { transport, calls };
}

describe('façade callable Hop Advice v1', () => {
  it('appelle uniquement les noms v1 avec les DTO exacts et préserve le proposal public en unknown', async () => {
    const proposalBytes = { format: 'brewer-hop-advice-proposal-v99', custom: { name: 'Étoile 🟣' } };
    const askReceipt = { protocol: HOP_ADVICE_PROTOCOL_V1.name, turn: publicTurn({ hopAdviceProposal: proposalBytes }) };
    const retryRequest = { jobId: 'server-job-1', operationId: 'operation:retry-1', generation: 3 };
    const retryReceipt = { protocol: HOP_ADVICE_PROTOCOL_V1.name,
      job: publicJob({ id: 'server-job-retry', operationId: retryRequest.operationId, generation: 3 }) };
    const historyRequest = { scope, before: 1750000000000 };
    const historyReceipt = { protocol: HOP_ADVICE_PROTOCOL_V1.name, generation: 3, draft: { title: 'Ébauche 🟨' },
      turns: [publicTurn({ id: 'history-turn-1' }), publicTurn({ id: 'future-turn', protocol: 'hopAdviceReadonlyV2' })] };
    const statusRequest = { scope, operationId: 'operation:status-0' };
    const statusReceipt = { protocol: HOP_ADVICE_PROTOCOL_V1.name,
      job: publicJob({ id: 'server-job-status-0', operationId: statusRequest.operationId, generation: 0 }) };
    const resetRequest = { scope, operationId: 'operation:reset-1', generation: 0 };
    const resetReceipt = { protocol: HOP_ADVICE_PROTOCOL_V1.name, generation: 1 };
    const statusAfterReset = { scope, operationId: 'operation:status-1', generation: resetReceipt.generation };
    const statusAfterResetReceipt = { protocol: HOP_ADVICE_PROTOCOL_V1.name,
      job: publicJob({ id: 'server-job-status-1', operationId: statusAfterReset.operationId, generation: 1 }) };
    const activityReceipt = { protocol: HOP_ADVICE_PROTOCOL_V1.name,
      jobs: [publicJob({ operationId: 'operation:activity-1' }), { protocol: 'unsupported', id: 'future-job-v2' }] };
    const markReadRequest = { jobId: 'server-job-status-1' };
    const markReadReceipt = { ok: true, protocol: HOP_ADVICE_PROTOCOL_V1.name };
    const { transport, calls } = makeTransport([askReceipt, retryReceipt, historyReceipt, statusReceipt,
      resetReceipt, statusAfterResetReceipt, activityReceipt, markReadReceipt]);
    const api = createBrewerHopAdviceApiV1({ ownerKey, transport });

    const askEntry = entry();
    const asked = await api.ask(askEntry);
    expect(asked.status).toBe('available');
    if (asked.status !== 'available' || !('turn' in asked.value)) throw new Error('Turn v1 attendu.');
    expect(asked.value.turn.hopAdviceProposal).toEqual(proposalBytes);
    expect(typeof asked.value.turn.hopAdviceProposal).toBe('object');
    expect(calls[0].payload).toEqual(buildHopAdviceV1Wire(askEntry));
    expect(calls[0].payload).toMatchObject({ mode: HOP_ADVICE_PROTOCOL_V1.name, analysisMode: 'deep',
      question, generation: 3, phase: 'Fermentation · 17 °C', scope });

    const retried = await api.retry(retryRequest, scope);
    expect(retried).toMatchObject({ status: 'available', value: { protocol: HOP_ADVICE_PROTOCOL_V1.name,
      job: { operationId: retryRequest.operationId, scope, generation: 3 } } });
    expect(calls[1]).toEqual({ name: HOP_ADVICE_V1_FUNCTIONS.retry, payload: retryRequest });

    const history = await api.history(historyRequest);
    expect(history).toMatchObject({ status: 'available', value: { generation: 3, draft: { title: 'Ébauche 🟨' },
      turns: [{ status: 'available' }, { status: 'unsupportedReadOnly' }] } });
    expect(calls[2]).toEqual({ name: HOP_ADVICE_V1_FUNCTIONS.conversation, payload: historyRequest });

    const status0 = await api.status(statusRequest);
    expect(status0).toMatchObject({ status: 'available', value: { job: { generation: 0, operationId: statusRequest.operationId } } });
    expect(calls[3]).toEqual({ name: HOP_ADVICE_V1_FUNCTIONS.conversation, payload: statusRequest });
    const reset = await api.reset(resetRequest);
    expect(reset).toEqual({ status: 'available', value: resetReceipt });
    expect(calls[4]).toEqual({ name: HOP_ADVICE_V1_FUNCTIONS.reset, payload: resetRequest });
    const status1 = await api.status(statusAfterReset);
    expect(status1).toMatchObject({ status: 'available', value: { job: { generation: resetReceipt.generation } } });
    expect(calls[5]).toEqual({ name: HOP_ADVICE_V1_FUNCTIONS.conversation, payload: statusAfterReset });

    const activity = await api.activity();
    expect(activity).toMatchObject({ status: 'available', value: { jobs: [{ status: 'available' }, { status: 'unsupportedReadOnly' }] } });
    expect(calls[6]).toEqual({ name: HOP_ADVICE_V1_FUNCTIONS.activity, payload: {} });
    expect(await api.markRead(markReadRequest)).toEqual({ status: 'available', value: markReadReceipt });
    expect(calls[7]).toEqual({ name: HOP_ADVICE_V1_FUNCTIONS.markRead, payload: markReadRequest });
    expect(calls.map((call) => call.name)).toEqual([
      HOP_ADVICE_V1_FUNCTIONS.ask, HOP_ADVICE_V1_FUNCTIONS.retry,
      HOP_ADVICE_V1_FUNCTIONS.conversation, HOP_ADVICE_V1_FUNCTIONS.conversation,
      HOP_ADVICE_V1_FUNCTIONS.reset, HOP_ADVICE_V1_FUNCTIONS.conversation,
      HOP_ADVICE_V1_FUNCTIONS.activity, HOP_ADVICE_V1_FUNCTIONS.markRead,
    ]);
    expect(calls.map((call) => call.name)).not.toContain('askBrewer');
    expect(transport.currentUserKey).toHaveBeenCalledTimes(calls.length);
  });

  it('refuse une portée status croisée, un job d’autre scope et un statut gen 1 lorsque la génération omise vaut 0', async () => {
    const { transport } = makeTransport([
      { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: publicJob({ operationId: 'operation:scope',
        scope: { kind: 'batch', id: 'autre-brassin' }, generation: 0 }) },
      { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: publicJob({ operationId: 'operation:gen', generation: 1 }) },
    ]);
    const api = createBrewerHopAdviceApiV1({ ownerKey, transport });
    expect(await api.status({ scope, operationId: 'operation:scope' })).toMatchObject({ status: 'invalid' });
    expect(await api.status({ scope, operationId: 'operation:gen' })).toMatchObject({ status: 'invalid' });
  });

  it('conserve une réponse d’un protocole futur sans la requalifier', async () => {
    const future = { protocol: 'hopAdviceReadonlyV2', turn: { protocol: 'hopAdviceReadonlyV2', payload: 'raw' } };
    const { transport } = makeTransport([future]);
    const api = createBrewerHopAdviceApiV1({ ownerKey, transport });
    const read = await api.ask(entry());
    expect(read).toEqual({ status: 'unsupportedReadOnly', snapshot: future,
      reason: 'Protocole de réponse futur ou absent; contenu conservé sans réinterprétation.' });
  });

  it('réessaie le même operationId et le même wire après échec réseau sans générer une seconde opération', async () => {
    const request = entry({ operationId: 'operation:network-retry' });
    const response = { protocol: HOP_ADVICE_PROTOCOL_V1.name,
      job: publicJob({ id: 'job:network-retry', operationId: request.operationId, generation: request.generation }) };
    const { transport, calls } = makeTransport([new Error('transport hors ligne'), response]);
    const api = createBrewerHopAdviceApiV1({ ownerKey, transport });
    await expect(api.ask(request)).rejects.toThrow('transport hors ligne');
    expect(await api.ask(request)).toMatchObject({ status: 'available', value: { job: { operationId: request.operationId } } });
    expect(calls).toHaveLength(2);
    expect(calls[0].name).toBe(HOP_ADVICE_V1_FUNCTIONS.ask);
    expect(calls[1]).toEqual(calls[0]);
    expect((calls[1].payload as HopAdviceV1WireInput).operationId).toBe(request.operationId);
  });

  it('vérifie ownerKey avant invocation et ne déclenche aucun callable si la session diffère', async () => {
    const { transport, calls } = makeTransport([], 'other-owner');
    const api = createBrewerHopAdviceApiV1({ ownerKey, transport });
    await expect(api.ask(entry())).rejects.toThrow(/ownerKey capturé/i);
    await expect(api.userKey()).rejects.toThrow(/ownerKey capturé/i);
    expect(calls).toEqual([]);
  });
});
