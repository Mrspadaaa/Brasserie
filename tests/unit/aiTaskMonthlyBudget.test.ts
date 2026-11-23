import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const environment = vi.hoisted(() => {
  const previous = { accounts: process.env.AUTHORIZED_ACCOUNTS, key: process.env.GEMINI_API_KEY };
  process.env.AUTHORIZED_ACCOUNTS = 'budget-test@example.invalid';
  process.env.GEMINI_API_KEY = 'fake-unit-test-key';
  return previous;
});
const gate = vi.hoisted(() => vi.fn());
vi.mock('../../functions/src/monthlyAiBudget', () => ({ runWithMonthlyAiBudget: gate }));
import { aiTask } from '../../functions/src/ai';
import { BrewerBudgetError } from '../../functions/src/brewerLimits';
const fetchMock = vi.fn();
const payload = (task = 'monthlySummary') => ({ data: { task, context: { brewery: 'Local test', expenses: [] } }, auth: { uid: 'test-user', token: { email: 'budget-test@example.invalid', email_verified: true } } });
beforeEach(() => {
  gate.mockReset(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
  gate.mockImplementation(async (_model: string, body: any, generate: any) => generate(body));
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"summary":"Test local"}' }] } }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 } }) });
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => { for (const [key, value] of [['AUTHORIZED_ACCOUNTS', environment.accounts], ['GEMINI_API_KEY', environment.key]]) { if (value == null) delete process.env[key!]; else process.env[key!] = value; } });
describe('Autres tâches IA derrière le même contrôle, fournisseur simulé', () => {
  it('réserve budget mensuel et quotidien avant le transport et impose la sortie', async () => {
    expect(await aiTask.run(payload() as any)).toMatchObject({ ok: true });
    // #100 (D100): the gate also inspects the answer, to settle a cut or looping one as unusable.
    expect(gate).toHaveBeenCalledOnce(); expect(gate.mock.calls[0][3]).toEqual({ daily: true, inspect: expect.any(Function) });
    // monthlySummary runs at Max: high reasoning shares the output cap, raised from 4500 to 12000 after a real 3.8 call.
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig.maxOutputTokens).toBe(12000);
  });
  it('ne retente pas après refus de budget', async () => {
    gate.mockRejectedValue(new BrewerBudgetError('ai-monthly-limit', 'Budget mensuel atteint.'));
    expect(await aiTask.run(payload() as any)).toMatchObject({ ok: false, error: 'Budget mensuel atteint.' });
    expect(gate).toHaveBeenCalledOnce(); expect(fetchMock).not.toHaveBeenCalled();
  });
  it('demande un dossier structuré pour la levure sans déplacer ses faits dans les champs houblon', async () => {
    const input = payload('lookupIngredient'); input.data.context = { kind: 'levure', name: 'Culture personnelle' } as any;
    await aiTask.run(input as any);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body), schema = body.generationConfig.responseSchema;
    expect(schema.required).toContain('technicalFacts');
    expect(schema.properties.technicalFacts.items.properties.qualifier.enum).toEqual([
      'range', 'reportedPoint', 'atLeast', 'upTo', 'greaterThan', 'lessThan'
    ]);
    expect(schema.properties).toHaveProperty('tempMaxC');
    expect(schema.properties).not.toHaveProperty('usage');
    expect(body.tools).toEqual([{ googleSearch: {} }]);
    // #100.1 (D100): capped low at Rapide; 12000 let the `"tempMinC": 18.000…` loop run for 69 s on the #91 bench.
    expect(body.generationConfig.maxOutputTokens).toBe(4500);
    fetchMock.mockClear(); input.data.context = { kind: 'houblon', name: 'Citra' } as any;
    await aiTask.run(input as any);
    const hopBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(hopBody.generationConfig.responseSchema.properties).toHaveProperty('usage');
    expect(hopBody.generationConfig.maxOutputTokens).toBe(4500);
  });
  it('la nouvelle tentative sur 3.8 est elle-même réservée, y compris après une réponse JSON invalide', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'broken' }] } }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 } }) });
    expect(await aiTask.run(payload() as any)).toMatchObject({ ok: true });
    expect(gate).toHaveBeenCalledTimes(2); expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(gate.mock.calls.map(([model]) => model)).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash']);
    expect(fetchMock.mock.calls.every(([url]) => String(url).endsWith('/models/gemini-3.8-flash:generateContent'))).toBe(true);
  });
  it('ne présente pas comme réussi un autocomplete de levure sans source exploitable et ne dépense pas de repli', async () => {
    const input = payload('lookupIngredient'); input.data.context = { kind: 'levure', name: 'Culture de test' } as any;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      found: true, name: 'Culture de test', source: 'Fiche', sourceUrl: 'https://example.invalid/ogimage.png', technicalFacts: []
    }) }] } }] }) });
    expect(await aiTask.run(input as any)).toMatchObject({ ok: false, error: expect.stringContaining('Aucune donnée appliquée') });
    expect(gate).toHaveBeenCalledOnce();
  });
});
