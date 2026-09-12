import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBrewerHarness, type Generate } from '../../functions/src/brewerHarness';
import type { BrewerContext } from '../../functions/src/companionTypes';

const context = (): BrewerContext => ({
  inventory: [], material: [], waterSources: [], provenance: [], phase: 'Préparation', now: Date.now()
});
const advice = {
  level: 'info', summary: 'Vérifie la température.', action: 'Relève la température réelle de la bière.',
  why: 'La consigne ne remplace pas une mesure.', watch: '', question: '', evidenceIds: []
};
const tool = (name: string, args: unknown) => ({
  candidates: [{ content: { role: 'model', parts: [{ functionCall: { name, args } }] } }]
});
const approved = () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
  approved: true, proposalApproved: true, issues: []
}) }] } }] });
const untilAborted = (signal: AbortSignal) => new Promise<never>((_resolve, reject) => {
  if (signal.aborted) reject(signal.reason);
  else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
});
const delayedFailure = (ms: number) => new Promise<never>((_resolve, reject) => {
  setTimeout(() => reject(new Error('Fournisseur temporairement indisponible')), ms);
});
const outcome = <T>(promise: Promise<T>) => promise.then(value => ({ value }), error => ({ error }));

beforeEach(() => {
  vi.useFakeTimers();
  // Native AbortSignal.timeout is outside Vitest's clock. Keep the same abort
  // contract while making all latency checks deterministic and instantaneous.
  vi.spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException('Délai atteint', 'TimeoutError')), ms);
    return controller.signal;
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Délais de l’équipe Flash', () => {
  it('partage les 45 secondes de l’analyse avec son repli et n’ouvre pas un troisième essai', async () => {
    const signals: AbortSignal[] = [];
    const generate = vi.fn<Generate>((_model, _body, signal) => {
      signals.push(signal);
      return signals.length === 1 ? delayedFailure(30_000) : untilAborted(signal);
    });
    const result = outcome(runBrewerHarness(context(), 'Une question', [], generate));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(signals[1]).toBe(signals[0]);
    await vi.advanceTimersByTimeAsync(15_000);
    await expect(result).resolves.toMatchObject({ error: { name: 'TimeoutError' } });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls.every(([model]) => model.includes('flash'))).toBe(true);
  });

  it('partage les 45 secondes de recherche avec son repli puis conclut sans inventer de source', async () => {
    const researchSignals: AbortSignal[] = [];
    let analyses = 0;
    const generate = vi.fn<Generate>(async (_model, body, signal) => {
      if ((body.tools as any[])?.some(entry => entry.googleSearch)) {
        researchSignals.push(signal);
        return researchSignals.length === 1 ? delayedFailure(30_000) : untilAborted(signal);
      }
      if ((body.generationConfig as any)?.responseMimeType === 'application/json') return approved();
      return ++analyses === 1
        ? tool('lookup_brewing_reference', { query: 'Fiche fabricant de la souche' })
        : tool('finish_advice', advice);
    });
    const result = outcome(runBrewerHarness(context(), 'Cherche une fiche', [], generate));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(researchSignals).toHaveLength(2);
    expect(researchSignals[1]).toBe(researchSignals[0]);
    await vi.advanceTimersByTimeAsync(15_000);
    await expect(result).resolves.toMatchObject({ value: {
      reviewed: true, evidence: [], trace: expect.arrayContaining([
        expect.objectContaining({ name: 'lookup_brewing_reference', error: expect.stringContaining('aucune source') })
      ])
    } });
    expect(researchSignals).toHaveLength(2);
  });

  it('partage les 30 secondes de relecture entre les modèles de repli', async () => {
    const reviewSignals: AbortSignal[] = [];
    const generate = vi.fn<Generate>(async (_model, body, signal) => {
      if ((body.generationConfig as any)?.responseMimeType === 'application/json') {
        reviewSignals.push(signal);
        return reviewSignals.length === 1 ? delayedFailure(20_000) : untilAborted(signal);
      }
      return tool('finish_advice', advice);
    });
    const result = outcome(runBrewerHarness(context(), 'Une question simple', [], generate));
    await vi.advanceTimersByTimeAsync(20_000);
    expect(reviewSignals).toHaveLength(2);
    expect(reviewSignals[1]).toBe(reviewSignals[0]);
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(result).resolves.toMatchObject({ error: { name: 'TimeoutError' } });
    expect(reviewSignals).toHaveLength(2);
  });

  it('la limite globale interrompt un rôle avant son délai individuel', async () => {
    const generate = vi.fn<Generate>((_model, _body, signal) => untilAborted(signal));
    const result = outcome(runBrewerHarness(context(), 'Une question', [], generate, { deadlineMs: 10_000 }));
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(result).resolves.toMatchObject({ error: { name: 'TimeoutError' } });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('n’appelle pas le transport si l’enregistrement de progression a déjà consommé le délai', async () => {
    const generate = vi.fn<Generate>().mockResolvedValue(tool('finish_advice', advice));
    const onProgress = vi.fn(async () => { await new Promise(resolve => setTimeout(resolve, 1_500)); });
    const result = outcome(runBrewerHarness(context(), 'Une question', [], generate, {
      deadlineMs: 1_000, onProgress
    }));
    await vi.advanceTimersByTimeAsync(1_500);
    await expect(result).resolves.toMatchObject({ error: { name: 'TimeoutError' } });
    expect(generate).not.toHaveBeenCalled();
  });
});
