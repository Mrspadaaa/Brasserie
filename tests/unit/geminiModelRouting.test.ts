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
import { BrewerBudgetError } from '../../functions/src/brewerLimits';
import { quoteGeminiCost } from '../../functions/src/geminiCosts';
import { GeminiRequestNotSentError } from '../../functions/src/geminiErrors';
import { SCAN_MODEL } from '../../functions/src/invoiceScanCore';
import {
  GEMINI_LITE_MODEL, GEMINI_MODEL, GEMINI_MODELS, LITE_ROUTES, TIERS, aiTier, assertGeminiModel, geminiAttempts, modelChain
} from '../../functions/src/models';
import { TASKS } from '../../functions/src/prompts';

const LITE = 'gemini-3.5-flash-lite', FLASH = 'gemini-3.8-flash';
const fetchMock = vi.fn();
const answer = (text = '{"found":false,"analysis":[]}', finishReason = 'STOP') => ({
  ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }],
    usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 } })
});
const refusal = (code: number, status: string, message = '') => ({
  ok: false, status: code, headers: new Headers(), json: async () => ({ error: { code, status, message } })
});
const outage = () => refusal(503, 'UNAVAILABLE');
const call = (data: Record<string, unknown>) => ({
  data, auth: { uid: 'test-user', token: { email: 'routing-test@example.invalid', email_verified: true } }
});
const coa = { data: Buffer.from('%PDF-1.4 COA de test').toString('base64'), mimeType: 'application/pdf' };
const diagnosis = { task: 'diagnoseBatch', tier: 'fast', context: { readings: [{ sg: 1.030 }] } };
const postedModels = () => fetchMock.mock.calls.map(([url]) => /\/models\/([^:]+):generateContent$/.exec(String(url))?.[1]);
const postedBody = (index = 0) => JSON.parse(fetchMock.mock.calls[index][1].body);
const budgetedModels = () => gate.mock.calls.map(([model]) => model);

beforeEach(() => {
  gate.mockReset(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
  // Like the real budget: the call's own inspection refuses a complete but unusable answer.
  gate.mockImplementation(async (_model: string, body: any, generate: any, options?: { inspect?: (r: unknown) => Error | undefined }) => {
    const result = await generate(body);
    const unusable = options?.inspect?.(result);
    if (unusable) throw unusable;
    return result;
  });
  fetchMock.mockResolvedValue(answer());
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => {
  for (const [key, value] of [['AUTHORIZED_ACCOUNTS', environment.accounts], ['GEMINI_API_KEY', environment.key]]) {
    if (value == null) delete process.env[key!]; else process.env[key!] = value;
  }
});

describe('Routage Gemini par usage, choisi par le serveur (décision 68)', () => {
  it('n’admet que deux modèles, et Rapide comme Max restent des réglages de 3.8', () => {
    expect(GEMINI_MODEL).toBe(FLASH);
    expect(GEMINI_LITE_MODEL).toBe(LITE);
    expect([...GEMINI_MODELS]).toEqual([FLASH, LITE]);
    expect(TIERS.fast.primary).toBe(FLASH);
    expect(TIERS.max.primary).toBe(FLASH);
    expect(TIERS.fast).not.toHaveProperty('fallbacks');
    expect(TIERS.max).not.toHaveProperty('fallbacks');
    expect(TIERS.fast).toMatchObject({ temperature: 0, thinkingLevel: 'low', label: 'Rapide' });
    expect(TIERS.max).toMatchObject({ temperature: 0.2, thinkingLevel: 'high', label: 'Max' });
    // The invoice scan keeps its own fixed 3.8 path.
    expect(SCAN_MODEL).toBe(FLASH);
  });

  it('ne passe en 3.5 Flash-Lite que les trois usages mesurés sans perte au banc #91, à leur réflexion', () => {
    expect({ ...LITE_ROUTES }).toEqual({ readHopCoa: 'minimal', diagnoseBatch: 'low', lookup_brewing_reference: 'minimal' });
    expect(geminiAttempts('readHopCoa')).toEqual([{ model: LITE, thinkingLevel: 'minimal' }, { model: FLASH, thinkingLevel: 'low' }]);
    expect(geminiAttempts('diagnoseBatch', 'fast')).toEqual([{ model: LITE, thinkingLevel: 'low' }, { model: FLASH, thinkingLevel: 'low' }]);
    expect(geminiAttempts('lookup_brewing_reference')).toEqual([{ model: LITE, thinkingLevel: 'minimal' }, { model: FLASH, thinkingLevel: 'low' }]);
  });

  it('garde 3.8 pour Max, pour tout usage non mesuré et pour toute clé étrangère', () => {
    for (const usage of Object.keys(LITE_ROUTES))
      expect(geminiAttempts(usage, 'max')).toEqual([{ model: FLASH, thinkingLevel: 'high' }, { model: FLASH, thinkingLevel: 'high' }]);
    for (const usage of ['importRecipe', 'reviewRecipe', 'lookupIngredient', 'lookupHopVariety', 'scanInvoice', 'find_brewing_suppliers',
      'analysis', 'review', 'companion', '', '__proto__', 'constructor', 'toString', 'hasOwnProperty'])
      expect(geminiAttempts(usage)).toEqual([{ model: FLASH, thinkingLevel: 'low' }, { model: FLASH, thinkingLevel: 'low' }]);
    // The 3.8-only chain of the yeast-database correction and the scripts is unchanged.
    for (const tier of ['fast', 'max'] as const) expect(modelChain(tier)).toEqual([FLASH, FLASH]);
  });

  it('ramène tout niveau inconnu ou ancien à Rapide, sans migration', () => {
    expect(aiTier('max')).toBe('max');
    expect(aiTier('fast')).toBe('fast');
    for (const stale of [undefined, null, '', 'gemini-3.1-pro-preview', LITE, 'pro', '__proto__', 'constructor', 42])
      expect(aiTier(stale)).toBe('fast');
  });

  it('refuse tout modèle hors de la liste blanche avant l’envoi', () => {
    for (const allowed of [FLASH, LITE]) expect(() => assertGeminiModel(allowed)).not.toThrow();
    for (const other of ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview', 'gemini-3.8-flash-lite',
      'gemini-3.5-flash-lite-preview', 'GEMINI-3.8-FLASH', '', undefined, null, ['gemini-3.8-flash']])
      expect(() => assertGeminiModel(other)).toThrow(/gemini-3\.8-flash et gemini-3\.5-flash-lite/);
  });

  it('le transport du compagnon refuse un autre modèle sans rien envoyer, et sert les deux admis', async () => {
    const transport = geminiTransport('fake-unit-test-key');
    for (const other of ['gemini-3.1-pro-preview', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'])
      await expect(transport(other, { contents: [] }, new AbortController().signal)).rejects.toBeInstanceOf(GeminiRequestNotSentError);
    expect(fetchMock).not.toHaveBeenCalled();
    await transport(FLASH, { contents: [] }, new AbortController().signal);
    await transport(LITE, { contents: [] }, new AbortController().signal);
    expect(postedModels()).toEqual([FLASH, LITE]);
  });

  it('lit un COA en Rapide avec 3.5 Flash-Lite `minimal`, budgété à son tarif, et le dit', async () => {
    const result = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(result).toMatchObject({ ok: true, model: LITE, tier: 'fast' });
    expect(postedModels()).toEqual([LITE]);
    expect(budgetedModels()).toEqual([LITE]);
    expect(postedBody().generationConfig).toMatchObject({ temperature: 0, maxOutputTokens: 4500, thinkingConfig: { thinkingLevel: 'minimal' } });
  });

  it('diagnostique un brassin en Rapide avec 3.5 Flash-Lite `low`', async () => {
    const result = await aiTask.run(call(diagnosis) as any);
    expect(result).toMatchObject({ ok: true, model: LITE, tier: 'fast' });
    expect(postedModels()).toEqual([LITE]);
    expect(postedBody().generationConfig).toMatchObject({ temperature: 0, thinkingConfig: { thinkingLevel: 'low' } });
  });

  it('garde 3.8 pour un COA ou un diagnostic en Max, réglage non mesuré en Flash-Lite', async () => {
    // Real 3.8 call of 13.10: a one-page COA at Max spent 4486 of 4500 output tokens, mostly thinking; its JSON was cut.
    await aiTask.run(call({ task: 'readHopCoa', tier: 'max', file: coa }) as any);
    expect(postedModels()).toEqual([FLASH]);
    expect(postedBody().generationConfig).toMatchObject({ temperature: 0.2, thinkingConfig: { thinkingLevel: 'high' }, maxOutputTokens: 12000 });
    fetchMock.mockClear();
    // Without a tier, the diagnosis keeps its default Max.
    const result = await aiTask.run(call({ task: 'diagnoseBatch', context: { readings: [] } }) as any);
    expect(result).toMatchObject({ ok: true, model: FLASH, tier: 'max' });
    expect(postedModels()).toEqual([FLASH]);
  });

  it('garde 3.8 pour toutes les autres tâches, dans les deux réglages', async () => {
    const others = (Object.keys(TASKS) as Array<keyof typeof TASKS>).filter(task => !['readHopCoa', 'diagnoseBatch', 'scanInvoice'].includes(task));
    expect(others).toEqual(expect.arrayContaining(['importRecipe', 'reviewRecipe', 'lookupIngredient', 'lookupHopVariety', 'shelfInventory', 'monthlySummary']));
    for (const task of others) for (const tier of ['fast', 'max']) {
      fetchMock.mockClear();
      await aiTask.run(call({ task, tier, context: { kind: 'malt', name: 'Pale Ale', items: [] }, instruction: 'Test de routage' }) as any);
      expect([task, tier, [...new Set(postedModels())]]).toEqual([task, tier, [FLASH]]);
    }
  });

  it('ignore un modèle ou un niveau étranger envoyé par le client et dit la vérité sur le modèle', async () => {
    const forced = await aiTask.run(call({ task: 'monthlySummary', context: { expenses: [] }, model: LITE, tier: 'max' }) as any);
    expect(forced).toMatchObject({ ok: true, model: FLASH, tier: 'max' });
    fetchMock.mockClear();
    const lite = await aiTask.run(call({ task: 'readHopCoa', file: coa, model: FLASH, tier: LITE }) as any);
    expect(lite).toMatchObject({ ok: true, model: LITE, tier: 'fast' });
    expect(postedModels()).toEqual([LITE]);
    expect(JSON.stringify(fetchMock.mock.calls)).not.toMatch(/pro-preview/);
  });

  it.each([
    ['coupée au plafond de sortie', () => answer('{"found":true,"analysis":[', 'MAX_TOKENS')],
    ['terminée autrement que normalement', () => answer('{"found":true,"analysis":[]}', 'SAFETY')],
    ['en boucle numérique', () => answer(`{"found":true,"alpha":12.${'0'.repeat(40)}`, 'STOP')],
    ['en JSON illisible', () => answer('{"found":true,', 'STOP')],
    ['vide', () => answer('', 'STOP')],
    ['refusée pour son schéma (HTTP 400)', () => refusal(400, 'INVALID_ARGUMENT')],
    ['en panne passagère (HTTP 503)', () => outage()]
  ])('reprend une réponse Flash-Lite %s une seule fois sur 3.8, sans redemander au brasseur', async (_label, failed) => {
    fetchMock.mockResolvedValueOnce(failed()).mockResolvedValueOnce(answer());
    const result = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(result).toMatchObject({ ok: true, model: FLASH, tier: 'fast' });
    expect(postedModels()).toEqual([LITE, FLASH]);
    expect(budgetedModels()).toEqual([LITE, FLASH]);
    expect(postedBody(1).generationConfig).toMatchObject({ temperature: 0, thinkingConfig: { thinkingLevel: 'low' } });
    expect(postedBody(1).contents).toEqual(postedBody(0).contents);
  });

  it('ne retente pas après un dépassement de délai de Flash-Lite', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('délai'), { name: 'TimeoutError' }));
    const result = await aiTask.run(call(diagnosis) as any);
    expect(postedModels()).toEqual([LITE]);
    expect(result).toMatchObject({ ok: false, tier: 'fast' });
    expect(result.error).toMatch(/délai/);
  });

  it('ne retente pas après un refus du budget, ni après un refus d’accès ou de plafond du service', async () => {
    gate.mockRejectedValueOnce(new BrewerBudgetError('ai-monthly-limit', 'Budget mensuel IA insuffisant.'));
    const budget = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(budget).toMatchObject({ ok: false, error: 'Budget mensuel IA insuffisant.' });
    expect(budgetedModels()).toEqual([LITE]);
    expect(fetchMock).not.toHaveBeenCalled();
    for (const refused of [refusal(403, 'PERMISSION_DENIED'), refusal(429, 'RESOURCE_EXHAUSTED', 'Your project has exceeded its monthly spending cap.')]) {
      fetchMock.mockReset().mockResolvedValue(refused);
      const result = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
      expect(result).toMatchObject({ ok: false });
      expect(postedModels()).toEqual([LITE]);
    }
    // A plain rate limit is a passing outage: 3.8 takes over, as before for 3.8 itself.
    fetchMock.mockReset().mockResolvedValueOnce(refusal(429, 'RESOURCE_EXHAUSTED')).mockResolvedValueOnce(answer());
    await expect(aiTask.run(call({ task: 'readHopCoa', file: coa }) as any)).resolves.toMatchObject({ ok: true, model: FLASH });
    expect(postedModels()).toEqual([LITE, FLASH]);
  });

  it('garde la règle #100 pour 3.8 : pas de nouvelle tentative après une réponse coupée', async () => {
    fetchMock.mockResolvedValue(answer('{"summary":"', 'MAX_TOKENS'));
    const result = await aiTask.run(call({ task: 'monthlySummary', context: { expenses: [] } }) as any);
    expect(postedModels()).toEqual([FLASH]);
    expect(result).toMatchObject({ ok: false });
    fetchMock.mockReset().mockResolvedValueOnce(answer('{"found":', 'MAX_TOKENS')).mockResolvedValueOnce(answer('{"found":', 'MAX_TOKENS'));
    const twice = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    // Flash-Lite cut, then 3.8 cut: no third attempt.
    expect(postedModels()).toEqual([LITE, FLASH]);
    expect(twice).toMatchObject({ ok: false });
    expect(twice.error).toMatch(/coupée/);
  });

  it('retente une fois sur 3.8 puis répond en français, sans autre modèle', async () => {
    fetchMock.mockResolvedValue(outage());
    const result = await aiTask.run(call({ task: 'shelfInventory', file: coa }) as any);
    expect(postedModels()).toEqual([FLASH, FLASH]);
    expect(result).toMatchObject({ ok: false, tier: 'fast' });
    // DESIGN.md: the model provider is not named on screen (#100, V3 REV-D100).
    expect(result.error).toMatch(/L’IA n’a pas pu traiter la demande/);
    expect(result.error).not.toMatch(/Gemini|Google/);
    expect(result.error).toMatch(/Réessaie/);
    expect(result.error).not.toMatch(/Aucun modèle|HTTP|gemini-3\.[0-7]/);
    fetchMock.mockClear();
    const lite = await aiTask.run(call({ task: 'readHopCoa', file: coa }) as any);
    expect(postedModels()).toEqual([LITE, FLASH]);
    expect(lite.error).toMatch(/L’IA n’a pas pu traiter la demande/);
  });

  it('une panne passagère réussit à la nouvelle tentative sur 3.8', async () => {
    fetchMock.mockResolvedValueOnce(outage()).mockResolvedValueOnce(answer());
    const result = await aiTask.run(call({ task: 'shelfInventory', file: coa }) as any);
    expect(result).toMatchObject({ ok: true, model: FLASH });
    expect(postedModels()).toEqual([FLASH, FLASH]);
  });

  it('une erreur définitive ne retente pas et reste lisible en français', async () => {
    fetchMock.mockResolvedValue(refusal(403, 'PERMISSION_DENIED'));
    const result = await aiTask.run(call({ task: 'shelfInventory', file: coa }) as any);
    expect(postedModels()).toEqual([FLASH]);
    expect(result).toMatchObject({ ok: false });
    expect(result.error).toMatch(/Le service IA refuse l’accès/);
    expect(result.error).not.toMatch(/Gemini|Google/);
  });

  it('réserve chaque tentative au tarif de son modèle', () => {
    const body = { contents: [{ role: 'user', parts: [{ text: 'COA' }] }], generationConfig: { maxOutputTokens: 4500 } };
    const lite = quoteGeminiCost(LITE, body), flash = quoteGeminiCost(FLASH, body);
    expect(lite.model).toBe(LITE);
    expect(lite.reservedMicroChf).toBeGreaterThan(0);
    expect(lite.reservedMicroChf).toBeLessThan(flash.reservedMicroChf);
  });
});
