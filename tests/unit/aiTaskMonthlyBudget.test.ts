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
    expect(gate).toHaveBeenCalledOnce(); expect(gate.mock.calls[0][3]).toEqual({ daily: true });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig.maxOutputTokens).toBe(4500);
  });
  it('ne tente aucun modèle de repli après refus de budget', async () => {
    gate.mockRejectedValue(new BrewerBudgetError('ai-monthly-limit', 'Budget mensuel atteint.'));
    expect(await aiTask.run(payload() as any)).toMatchObject({ ok: false, error: 'Budget mensuel atteint.' });
    expect(gate).toHaveBeenCalledOnce(); expect(fetchMock).not.toHaveBeenCalled();
  });
  it('chaque repli est lui-même réservé, y compris après une réponse JSON invalide', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'broken' }] } }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, totalTokenCount: 3 } }) });
    expect(await aiTask.run(payload() as any)).toMatchObject({ ok: true });
    expect(gate).toHaveBeenCalledTimes(2); expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
