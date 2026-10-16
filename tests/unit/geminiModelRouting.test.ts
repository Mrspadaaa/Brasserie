import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const environment = vi.hoisted(() => {
  const previous = { accounts: process.env.AUTHORIZED_ACCOUNTS, key: process.env.GEMINI_API_KEY };
  process.env.AUTHORIZED_ACCOUNTS = 'routing-test@example.invalid';
  process.env.GEMINI_API_KEY = 'fake-unit-test-key';
  return previous;
});
const gate = vi.hoisted(() => vi.fn());
vi.mock('../../functions/src/monthlyAiBudget', () => ({ runWithMonthlyAiBudget: gate }));
import { aiTask } from '../../functions/src/ai';
import { geminiTransport } from '../../functions/src/brewerHarness';
import { GeminiRequestNotSentError } from '../../functions/src/geminiErrors';
import { GEMINI_MODEL, TIERS, aiTier, assertGeminiModel, modelChain } from '../../functions/src/models';

const fetchMock = vi.fn();
const answer = (text = '{"found":false,"analysis":[]}') => ({
  ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 } })
});
const outage = () => ({ ok: false, status: 503, headers: new Headers(), json: async () => ({ error: { code: 503, status: 'UNAVAILABLE' } }) });
const call = (data: Record<string, unknown>) => ({
  data, auth: { uid: 'test-user', token: { email: 'routing-test@example.invalid', email_verified: true } }
});
const coa = { data: Buffer.from('%PDF-1.4 COA de test').toString('base64'), mimeType: 'application/pdf' };
const postedModels = () => fetchMock.mock.calls.map(([url]) => /\/models\/([^:]+):generateContent$/.exec(String(url))?.[1]);
const postedBody = (index = 0) => JSON.parse(fetchMock.mock.calls[index][1].body);

beforeEach(() => {
  gate.mockReset(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
  gate.mockImplementation(async (_model: string, body: any, generate: any) => generate(body));
  fetchMock.mockResolvedValue(answer());
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => {
  for (const [key, value] of [['AUTHORIZED_ACCOUNTS', environment.accounts], ['GEMINI_API_KEY', environment.key]]) {
    if (value == null) delete process.env[key!]; else process.env[key!] = value;
  }
});

describe('Gemini 3.8, seul modèle de l’application', () => {
  it('place Rapide et Max sur 3.8, sans aucun modèle de repli', () => {
    expect(GEMINI_MODEL).toBe('gemini-3.8-flash');
    expect(TIERS.fast.primary).toBe('gemini-3.8-flash');
    expect(TIERS.max.primary).toBe('gemini-3.8-flash');
    expect(TIERS.fast).not.toHaveProperty('fallbacks');
    expect(TIERS.max).not.toHaveProperty('fallbacks');
    for (const tier of ['fast', 'max'] as const) {
      // One new attempt on the same model, never another model.
      expect(modelChain(tier)).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash']);
    }
  });

  it('garde Rapide et Max comme réglages de température et de réflexion', () => {
    expect(TIERS.fast).toMatchObject({ temperature: 0, thinkingLevel: 'low', label: 'Rapide' });
    expect(TIERS.max).toMatchObject({ temperature: 0.2, thinkingLevel: 'high', label: 'Max' });
  });

  it('ramène tout niveau inconnu ou ancien à Rapide, sans migration', () => {
    expect(aiTier('max')).toBe('max');
    expect(aiTier('fast')).toBe('fast');
    for (const stale of [undefined, null, '', 'gemini-3.1-pro-preview', 'gemini-3.5-flash-lite', 'pro', '__proto__', 'constructor', 42])
      expect(aiTier(stale)).toBe('fast');
  });

  it('refuse tout autre modèle avant l’envoi', () => {
    expect(() => assertGeminiModel('gemini-3.8-flash')).not.toThrow();
    for (const other of ['gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro-preview', 'gemini-3.8-flash-lite', '', undefined])
      expect(() => assertGeminiModel(other)).toThrow(/gemini-3\.8-flash/);
  });

  it('le transport du compagnon refuse un autre modèle sans rien envoyer', async () => {
    const transport = geminiTransport('fake-unit-test-key');
    for (const other of ['gemini-3.1-pro-preview', 'gemini-3.7-flash'])
      await expect(transport(other, { contents: [] }, new AbortController().signal)).rejects.toBeInstanceOf(GeminiRequestNotSentError);
    expect(fetchMock).not.toHaveBeenCalled();
    await transport('gemini-3.8-flash', { contents: [] }, new AbortController().signal);
    expect(postedModels()).toEqual(['gemini-3.8-flash']);
  });

  it('sert une lecture de document Rapide avec 3.8 et ses réglages', async () => {
    const result = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(result).toMatchObject({ ok: true, model: 'gemini-3.8-flash', tier: 'fast' });
    expect(postedModels()).toEqual(['gemini-3.8-flash']);
    expect(gate.mock.calls[0][0]).toBe('gemini-3.8-flash');
    expect(postedBody().generationConfig).toMatchObject({ temperature: 0, thinkingConfig: { thinkingLevel: 'low' } });
  });

  it('applique le réglage Max sur le même modèle', async () => {
    const result = await aiTask.run(call({ task: 'monthlySummary', context: { expenses: [] } }) as any);
    expect(result).toMatchObject({ ok: true, model: 'gemini-3.8-flash', tier: 'max' });
    expect(postedBody().generationConfig).toMatchObject({ temperature: 0.2, thinkingConfig: { thinkingLevel: 'high' } });
  });

  it('laisse à la réflexion haute de Max la place de répondre, sans changer Rapide', async () => {
    // Real 3.8 call of 13.10: a one-page COA at Max spent 4486 of 4500 output tokens, mostly thinking; its JSON was cut.
    await aiTask.run(call({ task: 'readHopCoa', tier: 'max', file: coa }) as any);
    expect(postedBody().generationConfig).toMatchObject({ thinkingConfig: { thinkingLevel: 'high' }, maxOutputTokens: 12000 });
    fetchMock.mockClear();
    await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(postedBody().generationConfig).toMatchObject({ thinkingConfig: { thinkingLevel: 'low' }, maxOutputTokens: 4500 });
  });

  it('ignore un modèle ou un niveau étranger envoyé par le client et dit la vérité sur le modèle', async () => {
    const result = await aiTask.run(call({
      task: 'readHopCoa', file: coa, model: 'gemini-3.1-pro-preview', tier: 'gemini-3.5-flash-lite'
    }) as any);
    expect(result).toMatchObject({ ok: true, model: 'gemini-3.8-flash', tier: 'fast' });
    expect(postedModels()).toEqual(['gemini-3.8-flash']);
    expect(JSON.stringify(fetchMock.mock.calls)).not.toMatch(/pro-preview|flash-lite/);
  });

  it('retente une fois sur 3.8 puis répond en français, sans autre modèle', async () => {
    fetchMock.mockResolvedValue(outage());
    const result = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(postedModels()).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash']);
    expect(result).toMatchObject({ ok: false, tier: 'fast' });
    // DESIGN.md: the model provider is not named on screen (#100, V3 REV-D100).
    expect(result.error).toMatch(/L’IA n’a pas pu traiter la demande/);
    expect(result.error).not.toMatch(/Gemini|Google/);
    expect(result.error).toMatch(/Réessaie/);
    expect(result.error).not.toMatch(/Aucun modèle|HTTP|gemini-3\.[0-7]/);
  });

  it('une panne passagère réussit à la nouvelle tentative sur 3.8', async () => {
    fetchMock.mockResolvedValueOnce(outage()).mockResolvedValueOnce(answer());
    const result = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(result).toMatchObject({ ok: true, model: 'gemini-3.8-flash' });
    expect(postedModels()).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash']);
  });

  it('une erreur définitive ne retente pas et reste lisible en français', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, headers: new Headers(), json: async () => ({ error: { code: 403, status: 'PERMISSION_DENIED' } }) });
    const result = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(postedModels()).toEqual(['gemini-3.8-flash']);
    expect(result).toMatchObject({ ok: false });
    expect(result.error).toMatch(/Le service IA refuse l’accès/);
    expect(result.error).not.toMatch(/Gemini|Google/);
  });
});
