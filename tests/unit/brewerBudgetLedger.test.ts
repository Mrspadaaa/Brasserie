import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  docs: new Map<string, any>(),
  transactions: 0,
  failSettlement: false,
  unsubscribe: vi.fn()
}));
function doc(path: string): any {
  return {
    path,
    get: async () => ({ data: () => structuredClone(state.docs.get(path)) }),
    onSnapshot: (next: any) => {
      next({ data: () => structuredClone(state.docs.get(path)) });
      return state.unsubscribe;
    }
  };
}
function update(path: string, patch: any) {
  const result = structuredClone(state.docs.get(path));
  for (const [key, value] of Object.entries(patch)) {
    const parts = key.split('.');
    let target = result;
    for (const part of parts.slice(0, -1)) target = target[part] ??= {};
    target[parts.at(-1)!] = structuredClone(value);
  }
  state.docs.set(path, result);
}
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js', () => ({
  getFirestore: () => ({
    doc,
    runTransaction: async (fn: any) => {
      state.transactions++;
      const writes: Array<() => void> = [];
      const result = await fn({
        get: (ref: any) => ref.get(),
        set: (ref: any, data: any) => writes.push(() => state.docs.set(ref.path, structuredClone(data))),
        update: (ref: any, patch: any) => writes.push(() => update(ref.path, patch))
      });
      if (state.failSettlement && state.transactions === 2) throw Error('Commit unavailable');
      writes.forEach((write) => write());
      return result;
    }
  })
}));
vi.mock('../../functions/src/brewSession', () => ({ requireBrewer: () => 'test-brewer' }));
import { budgetedBrewerTransport, brewerBudgetDay } from '../../functions/src/brewerBudget';
import { GeminiApiError } from '../../functions/src/geminiErrors';

const jobPath = 'brewerJobs/test-job';
const budget = () => state.docs.get(jobPath).budget;
const daily = () => state.docs.get(`brewerAiUsage/${brewerBudgetDay()}`).usage;
const request = { contents: [{ parts: [{ text: 'Test local uniquement' }] }], generationConfig: { maxOutputTokens: 128 } };
const signal = () => new AbortController().signal;

beforeEach(() => {
  state.docs.clear();
  state.transactions = 0;
  state.failSettlement = false;
  state.unsubscribe.mockClear();
  state.docs.set(jobPath, { status: 'running', fence: 'test-fence' });
  state.docs.set('brewerAiControls/current', { paused: false });
});

describe('Réconciliation des réservations Gemini, sans appel réseau', () => {
  it('libère les tokens refusés mais garde les tentatives et le plafond par question', async () => {
    state.docs.set('brewerAiControls/current', { limits: { questionCalls: 1 } });
    const error = new GeminiApiError(429, 'gemini-test-pro', 'spend-cap');
    const generate = vi.fn().mockRejectedValue(error);
    const guard = budgetedBrewerTransport(generate, 'test-job', 'test-fence');
    await expect(guard.generate('gemini-test-pro', request, signal())).rejects.toBe(error);
    expect(daily()).toEqual({ calls: 1, proCalls: 1, tokens: 0 });
    expect(budget().usage).toEqual(daily());
    expect(Object.values(budget().calls)).toEqual([
      expect.objectContaining({ status: 'rejected', charged: 0, provider: error.diagnostic() })
    ]);
    await expect(guard.generate('gemini-test-pro', request, signal())).rejects.toMatchObject({ code: 'ai-question-limit' });
    expect(generate).toHaveBeenCalledTimes(1);
    guard.close();
    expect(state.unsubscribe).toHaveBeenCalledOnce();
  });

  it('préserve les tokens réellement utilisés lors du refus suivant', async () => {
    const generate = vi.fn()
      .mockResolvedValueOnce({ usageMetadata: { totalTokenCount: 42 } })
      .mockRejectedValueOnce(new GeminiApiError(429, 'gemini-test', 'rate-limit'));
    const guard = budgetedBrewerTransport(generate, 'test-job', 'test-fence');
    await guard.generate('gemini-test', request, signal());
    await expect(guard.generate('gemini-test', request, signal())).rejects.toBeInstanceOf(GeminiApiError);
    expect(daily()).toEqual({ calls: 2, proCalls: 0, tokens: 42 });
    expect(budget().usage).toEqual(daily());
    expect(Object.values(budget().calls).map((call: any) => call.status)).toEqual(['completed', 'rejected']);
    guard.close();
  });

  it.each([
    new Error('Network timeout'),
    new GeminiApiError(503, 'gemini-test', 'server')
  ])('garde la marge si la consommation est inconnue : %s', async (error) => {
    const generate = vi.fn().mockRejectedValue(error);
    const guard = budgetedBrewerTransport(generate, 'test-job', 'test-fence');
    await expect(guard.generate('gemini-test', request, signal())).rejects.toBe(error);
    expect(daily().tokens).toBeGreaterThan(128);
    expect(budget().usage.tokens).toBe(daily().tokens);
    expect(Object.values(budget().calls)[0]).toMatchObject({ status: 'reserved' });
    expect(generate).toHaveBeenCalledOnce();
    guard.close();
  });

  it('ne recommence pas une génération si la réconciliation Firestore échoue', async () => {
    state.failSettlement = true;
    const result = { usageMetadata: { totalTokenCount: 42 } };
    const generate = vi.fn().mockResolvedValue(result);
    const guard = budgetedBrewerTransport(generate, 'test-job', 'test-fence');
    await expect(guard.generate('gemini-test', request, signal())).resolves.toBe(result);
    expect(generate).toHaveBeenCalledOnce();
    expect(daily().tokens).toBeGreaterThan(128);
    expect(budget().usage.tokens).toBe(daily().tokens);
    guard.close();
  });

  it('conserve le diagnostic Google même si le remboursement ne peut pas être enregistré', async () => {
    state.failSettlement = true;
    const error = new GeminiApiError(429, 'gemini-test', 'spend-cap');
    const generate = vi.fn().mockRejectedValue(error);
    const guard = budgetedBrewerTransport(generate, 'test-job', 'test-fence');
    await expect(guard.generate('gemini-test', request, signal())).rejects.toBe(error);
    expect(generate).toHaveBeenCalledOnce();
    expect(daily().tokens).toBeGreaterThan(128);
    expect(budget().usage.tokens).toBe(daily().tokens);
    guard.close();
  });
});
