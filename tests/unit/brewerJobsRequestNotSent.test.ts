import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A request refused before sending (no key, body not encodable for REST) is neither charged nor worth retrying.
const state = vi.hoisted(() => ({ docs: new Map<string, any>(), unsubscribe: vi.fn() }));
function doc(path: string): any {
  return {
    path,
    get: async () => ({ data: () => structuredClone(state.docs.get(path)) }),
    onSnapshot: (next: any) => { next({ data: () => structuredClone(state.docs.get(path)) }); return state.unsubscribe; },
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
  FieldValue: { delete: () => '__fixture_delete__', serverTimestamp: () => 1700000000000 },
  getFirestore: () => ({
    doc,
    runTransaction: async (fn: any) => {
      const writes: Array<() => void> = [];
      const result = await fn({
        get: (ref: any) => ref.get(),
        set: (ref: any, data: any) => writes.push(() => state.docs.set(ref.path, structuredClone(data))),
        update: (ref: any, patch: any) => writes.push(() => update(ref.path, patch)),
      });
      writes.forEach(write => write());
      return result;
    },
  }),
}));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/functions/index.js', () => ({
  getFunctions: () => ({ taskQueue: () => ({ enqueue: async () => {} }) }),
}));
vi.mock('../../functions/src/brewSession', () => ({ requireBrewer: () => 'test-brewer' }));
// The shared monthly gate already releases an uncharged request (monthlyAiBudget.test.ts); only the daily ledger is under test.
vi.mock('../../functions/src/monthlyAiBudget', () => ({ runWithMonthlyAiBudget: (_model: string, body: any, generate: any) => generate(body) }));
import { budgetedBrewerTransport, brewerBudgetDay } from '../../functions/src/brewerBudget';
import { jobError } from '../../functions/src/brewerJobs';
import { geminiTransport, runBrewerHarness } from '../../functions/src/brewerHarness';
import { GeminiRequestNotSentError } from '../../functions/src/geminiErrors';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { practicalEquipment } from '../../src/domain/brewEquipment';

const jobPath = 'brewerJobs/test-job';
const request = { contents: [{ parts: [{ text: 'Test local uniquement' }] }], generationConfig: { maxOutputTokens: 128 } };
const notSent = () => new GeminiRequestNotSentError(new TypeError('Gemini FunctionDeclaration non convertible (parameters.type): fixture'));

beforeEach(() => {
  state.docs.clear();
  state.unsubscribe.mockClear();
  state.docs.set(jobPath, { status: 'running', fence: 'test-fence' });
  state.docs.set('brewerAiControls/current', { paused: false });
});

describe('requête Gemini refusée avant envoi', () => {
  it('donne un échec public non réessayable, sans détail interne', () => {
    const failure = jobError(notSent());
    expect(failure).toMatchObject({ code: 'request-not-sent', retryable: false });
    expect(failure.message).not.toMatch(/FunctionDeclaration|parameters\.type|fixture/u);
  });

  it('libère les tokens journaliers réservés et garde la tentative comptée', async () => {
    const error = notSent();
    const generate = vi.fn().mockRejectedValue(error);
    const guard = budgetedBrewerTransport(generate, 'test-job', 'test-fence');
    await expect(guard.generate('gemini-test-pro', request, new AbortController().signal)).rejects.toBe(error);
    expect(state.docs.get(`brewerAiUsage/${brewerBudgetDay()}`).usage).toEqual({ calls: 1, proCalls: 1, tokens: 0 });
    expect(Object.values(state.docs.get(jobPath).budget.calls)).toEqual([
      expect.objectContaining({ status: 'rejected', charged: 0 }),
    ]);
    guard.close();
  });
});

// The harness must stop on the first unsent request: the key and the REST encoding do not depend on the model.
describe('harnais : une requête non envoyée est terminale', () => {
  const context = (): BrewerContext => ({
    recipe: recipe({ efficiencyPct: 75 }), journal: brewState(), now: Date.now(), phase: 'Empâtage',
    provenance: [], inventory: [], material: [], waterSources: [],
    equipment: { id: 'test', volumeL: 24, efficiencyPct: 75, equipment: practicalEquipment },
  });
  const failure = (promise: Promise<unknown>) => promise.then(
    () => { throw new Error('Le harnais aurait dû s’arrêter sur la requête non envoyée.'); }, (error: unknown) => error);
  afterEach(() => vi.unstubAllGlobals());

  it.each(['deep', 'fast', 'auto'] as const)('mode %s : clé absente, un seul appel, request-not-sent non réessayable', async mode => {
    const network = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', network);
    const transport = geminiTransport('');
    const generate = vi.fn((model: string, body: Record<string, unknown>, signal: AbortSignal) => transport(model, body, signal));

    const error = await failure(runBrewerHarness(context(), 'Contrôle ma fermentation', [], generate, { mode }));

    expect(error).toBeInstanceOf(GeminiRequestNotSentError);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(network).not.toHaveBeenCalled();
    expect(jobError(error)).toMatchObject({ code: 'request-not-sent', retryable: false });
  });

  it('une recherche non envoyée arrête l’analyse au lieu de devenir une erreur d’outil', async () => {
    const network = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', network);
    const transport = geminiTransport('');
    const isResearch = (body: Record<string, unknown>) => JSON.stringify(body.tools ?? []).includes('googleSearch');
    let analysisCalls = 0;
    const generate = vi.fn(async (model: string, body: Record<string, unknown>, signal: AbortSignal) => {
      if (isResearch(body)) return transport(model, body, signal);
      analysisCalls += 1;
      if (analysisCalls > 1) throw new Error('Analyse poursuivie après une recherche non envoyée.');
      return { candidates: [{ content: { role: 'model', parts: [{ functionCall: {
        name: 'lookup_brewing_reference', args: { query: 'Fiche fabricant de la levure de la recette' } } }] } }] };
    });

    const error = await failure(runBrewerHarness(context(), 'Trouve la fiche fabricant de ma levure', [], generate, { mode: 'fast' }));

    expect(error).toBeInstanceOf(GeminiRequestNotSentError);
    expect(generate.mock.calls.filter(([, body]) => isResearch(body))).toHaveLength(1);
    expect(analysisCalls).toBe(1);
    expect(network).not.toHaveBeenCalled();
  });
});
