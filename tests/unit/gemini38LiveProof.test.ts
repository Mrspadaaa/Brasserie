import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LIVE_ENDPOINT, LIVE_LAUNCH_CAP, LIVE_TOTAL_CAP, guardLiveFetch, liveCallBudget, liveEndpoint, liveJournalRow, livePreflight,
  readLiveCounter, reserveLiveCall, withLiveCounter, type LiveCall
} from '../../scripts/gemini38LiveCore';

// Offline only: the provider is a local fake, the Gemini network guard stays active.
const journal = (used: number) => `# Journal\n\n**Compteur : ${used} / 40**\n\n| # | Heure |\n|---|---|\n`;
const SECRET = 'fixture-secret-not-a-real-key';
const LITE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';
const providerAnswer = (modelVersion = 'gemini-3.8-flash') => new Response(JSON.stringify({
  modelVersion,
  candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"found":true}' }] } }],
  usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 100, thoughtsTokenCount: 20, totalTokenCount: 1120 }
}), { status: 200 });
const init = (thinkingLevel = 'low') => ({
  method: 'POST', headers: { 'x-goog-api-key': SECRET },
  body: JSON.stringify({ contents: [], generationConfig: { thinkingConfig: { thinkingLevel } } })
});
const clock = () => { let t = 0; return () => (t += 250); };
const counter = (first: number) => { let next = first; return () => next++; };

const dirs: string[] = [];
const tempJournal = (used: number) => {
  const dir = mkdtempSync(join(tmpdir(), 'g38-live-test-'));
  dirs.push(dir);
  const path = join(dir, 'gemini-journal.md');
  writeFileSync(path, journal(used));
  return { path, lock: join(dir, 'gemini-journal.lock') };
};
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('Garde-fous du test spécial Gemini 3.8 réel', () => {
  it('lit le compteur global et borne chaque lancement à 5 appels dans les 40 (décision 63)', () => {
    expect([LIVE_LAUNCH_CAP, LIVE_TOTAL_CAP]).toEqual([5, 40]);
    expect(readLiveCounter(journal(0))).toEqual({ used: 0, total: 40 });
    expect([0, 5, 35, 36, 39, 40].map(used => liveCallBudget(journal(used)))).toEqual([5, 5, 5, 4, 1, 0]);
    expect(withLiveCounter(journal(4), 5)).toContain('**Compteur : 5 / 40**');
    expect(() => readLiveCounter('# Journal sans compteur')).toThrow(/aucun appel/);
    // A journal still at the old envelope, or with any other total, is refused rather than reinterpreted.
    for (const total of [10, 12, 41]) expect(() => readLiveCounter(`**Compteur : 1 / ${total}**`)).toThrow(/illisible/);
  });

  it('contrôle les modèles résolus (liste blanche du serveur) puis le compteur avant l’opt-in payant', () => {
    const optIn = vi.fn();
    for (const models of [['gemini-3.8-flash', 'gemini-3.7-flash'], ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'], ['gemini-3.1-pro-preview'], []])
      expect(() => livePreflight(models, journal(1), optIn)).toThrow(/hors de la liste blanche \(gemini-3\.8-flash et gemini-3\.5-flash-lite\)/);
    expect(() => livePreflight(['gemini-3.8-flash'], journal(40), optIn)).toThrow(/Compteur global atteint \(40 \/ 40\)/);
    expect(() => livePreflight(['gemini-3.8-flash'], '# Journal sans compteur', optIn)).toThrow(/aucun appel/);
    expect(optIn).not.toHaveBeenCalled();
    expect(livePreflight(['gemini-3.8-flash', 'gemini-3.8-flash'], journal(38), optIn)).toEqual({ used: 38, cap: 2 });
    expect(livePreflight(['gemini-3.5-flash-lite', 'gemini-3.8-flash'], journal(5), optIn)).toEqual({ used: 5, cap: 5 });
    expect(optIn).toHaveBeenCalledTimes(2);
  });

  it('réserve chaque appel sous verrou, compteur relu, avant l’envoi', () => {
    const { path, lock } = tempJournal(38);
    expect(reserveLiveCall(path, lock)).toBe(39);
    expect(readFileSync(path, 'utf8')).toContain('**Compteur : 39 / 40**');
    expect(existsSync(lock)).toBe(false);
    // Another session reserved the last call meanwhile: the launch budget computed at start no longer counts.
    writeFileSync(path, withLiveCounter(readFileSync(path, 'utf8'), 40));
    expect(() => reserveLiveCall(path, lock)).toThrow(/Compteur global atteint \(40 \/ 40\).*avant l’envoi/);
    expect(readFileSync(path, 'utf8')).toContain('**Compteur : 40 / 40**');
    expect(existsSync(lock)).toBe(false);
  });

  it('refuse de réserver tant que le verrou du journal est tenu ailleurs', () => {
    const { path, lock } = tempJournal(3);
    mkdirSync(lock);
    expect(() => reserveLiveCall(path, lock, { timeoutMs: 120 })).toThrow(/Verrou .* occupé/);
    expect(readFileSync(path, 'utf8')).toContain('**Compteur : 3 / 40**');
    expect(existsSync(lock)).toBe(true);
  });

  it('refuse tout autre modèle ou hôte avant l’envoi, sans rien réserver', async () => {
    const provider = vi.fn<typeof fetch>(async () => providerAnswer());
    const reserve = vi.fn(counter(1));
    const onCall = vi.fn();
    const { fetch: guarded } = guardLiveFetch(provider, { cap: 3, reserve, onCall });
    for (const url of [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
      `${LITE_ENDPOINT}?alt=sse`,
      'https://europe-west1-aiplatform.googleapis.com/v1/projects/x/models/gemini-3.5-flash-lite:generateContent',
      'https://europe-west1-aiplatform.googleapis.com/v1/projects/x/models/gemini-3.8-flash:generateContent',
      'https://example.invalid/'
    ]) await expect(guarded(url, init())).rejects.toThrow(/refusée avant l’envoi/);
    expect(provider).not.toHaveBeenCalled();
    expect(reserve).not.toHaveBeenCalled();
    expect(onCall).not.toHaveBeenCalled();
    await guarded('http://127.0.0.1:8080/v1/projects/demo-g38/databases/(default)/documents', { method: 'GET' });
    expect(provider).toHaveBeenCalledOnce();
    expect(reserve).not.toHaveBeenCalled();
    expect(onCall).not.toHaveBeenCalled();
  });

  it('réserve avant chaque envoi et ne part pas si la réservation est refusée', async () => {
    const order: string[] = [];
    const provider = vi.fn<typeof fetch>(async () => { order.push('envoi'); return providerAnswer(); });
    const next = counter(9);
    const reserve = vi.fn(() => {
      order.push('réservation');
      const n = next();
      if (n > 10) throw new Error('Compteur global atteint (10 / 10) : requête refusée avant l’envoi.');
      return n;
    });
    const onCall = vi.fn();
    const { fetch: guarded, calls } = guardLiveFetch(provider, { cap: 3, reserve, onCall });
    await guarded(LIVE_ENDPOINT, init());
    await guarded(LIVE_ENDPOINT, init());
    await expect(guarded(LIVE_ENDPOINT, init())).rejects.toThrow(/refusée avant l’envoi/);
    expect(order).toEqual(['réservation', 'envoi', 'réservation', 'envoi', 'réservation']);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(calls.map(call => call.n)).toEqual([9, 10]);
    expect(onCall).toHaveBeenCalledTimes(2);
  });

  it('mesure, compte et journalise chaque appel 3.8 sans jamais exposer la clé', async () => {
    const calls: LiveCall[] = [];
    const reserve = vi.fn(counter(4));
    const { fetch: guarded } = guardLiveFetch(async () => providerAnswer(), {
      cap: 2, reserve, onCall: call => calls.push({ ...call }), now: clock()
    });
    const response = await guarded(LIVE_ENDPOINT, init('high'));
    expect(await response.json()).toMatchObject({ modelVersion: 'gemini-3.8-flash' });
    await guarded(LIVE_ENDPOINT, init());
    await expect(guarded(LIVE_ENDPOINT, init())).rejects.toThrow(/Plafond/);
    expect(reserve).toHaveBeenCalledTimes(2);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      n: 4, status: 200, latencyMs: 250, modelVersion: 'gemini-3.8-flash', thinkingLevel: 'high', finishReason: 'STOP',
      inputTokens: 1000, outputTokens: 120
    });
    expect(calls[1]).toMatchObject({ n: 5, thinkingLevel: 'low' });
    expect(calls[0].costMicroChf).toBeGreaterThan(0);
    const row = liveJournalRow(calls[0], '#22 (G38)', 'test', 'HTTP 200');
    expect(row).toMatch(/\| 4 \| .+ \| #22 \(G38\) \| test \| gemini-3\.8-flash \| 1000 \/ 120 \| 0\.\d{4} CHF \| HTTP 200 \|/);
    expect(JSON.stringify(calls) + row).not.toContain(SECRET);
  });

  it('laisse partir les deux modèles de la liste blanche, chacun compté à son tarif', async () => {
    expect(LIVE_ENDPOINT).toBe(liveEndpoint('gemini-3.8-flash'));
    expect(liveEndpoint('gemini-3.5-flash-lite')).toBe(LITE_ENDPOINT);
    const calls: LiveCall[] = [];
    const { fetch: guarded } = guardLiveFetch(async input => providerAnswer(String(input).includes('flash-lite') ? 'gemini-3.5-flash-lite' : 'gemini-3.8-flash'), {
      cap: 2, reserve: counter(6), onCall: call => calls.push({ ...call }), now: clock()
    });
    await guarded(LITE_ENDPOINT, init('minimal'));
    await guarded(LIVE_ENDPOINT, init('low'));
    expect(calls.map(({ n, model, modelVersion, thinkingLevel }) => ({ n, model, modelVersion, thinkingLevel }))).toEqual([
      { n: 6, model: 'gemini-3.5-flash-lite', modelVersion: 'gemini-3.5-flash-lite', thinkingLevel: 'minimal' },
      { n: 7, model: 'gemini-3.8-flash', modelVersion: 'gemini-3.8-flash', thinkingLevel: 'low' }
    ]);
    // Same tokens, cheaper model: the journal cost follows the model that served the call.
    expect(calls[0].costMicroChf).toBeGreaterThan(0);
    expect(calls[0].costMicroChf!).toBeLessThan(calls[1].costMicroChf!);
  });

  it('journalise aussi un appel interrompu, juste après l’échec', async () => {
    const onCall = vi.fn();
    const failure = Object.assign(new Error('socket'), { name: 'TypeError' });
    const { fetch: guarded } = guardLiveFetch(async () => { throw failure; }, { cap: 3, reserve: counter(1), onCall, now: clock() });
    await expect(guarded(LIVE_ENDPOINT, init())).rejects.toBe(failure);
    expect(onCall).toHaveBeenCalledOnce();
    expect(onCall.mock.calls[0][0]).toMatchObject({ n: 1, error: 'TypeError' });
  });
});
