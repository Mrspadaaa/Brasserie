import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const environment = vi.hoisted(() => {
  const previous = { accounts: process.env.AUTHORIZED_ACCOUNTS, key: process.env.GEMINI_API_KEY };
  process.env.AUTHORIZED_ACCOUNTS = 'd100-test@example.invalid';
  process.env.GEMINI_API_KEY = 'fake-unit-test-key';
  return previous;
});
const gate = vi.hoisted(() => vi.fn());
vi.mock('../../functions/src/monthlyAiBudget', () => ({ runWithMonthlyAiBudget: gate }));
import { aiTask } from '../../functions/src/ai';

/** #100 : défauts de production relevés par le banc réel #91, Gemini toujours simulé. */
const fetchMock = vi.fn();
const usage = { promptTokenCount: 1329, candidatesTokenCount: 4500, totalTokenCount: 5829 };
const reply = (text: string, finishReason = 'STOP') => ({
  ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }], usageMetadata: usage })
});
const call = (data: Record<string, unknown>) => ({
  data, auth: { uid: 'test-user', token: { email: 'd100-test@example.invalid', email_verified: true } }
});
const yeast = (tier?: 'fast' | 'max') => call({ task: 'lookupIngredient', tier, instruction: 'levure : SafAle S-04', context: { kind: 'levure', name: 'SafAle S-04' } });
const postedBody = (index = 0) => JSON.parse(fetchMock.mock.calls[index][1].body);
/** The S-04 answer of the #91 bench, cut by the output cap inside `"tempMinC": 18.000…`. */
const s04Loop = `{"found":true,"name":"SafAle S-04","source":"Fermentis","sourceUrl":"https://fermentis.com/en/product/safale-s-04/","technicalFacts":[],"lab":"Fermentis","strain":"S-04","tempMinC": 18.${'0'.repeat(400)}`;

beforeEach(() => {
  gate.mockReset(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
  // Same contract as runWithMonthlyAiBudget: an unusable answer is refused after its cost is known.
  gate.mockImplementation(async (_model: string, body: any, generate: any, options: any) => {
    const result = await generate(body);
    const unusable = options?.inspect?.(result);
    if (unusable) throw unusable;
    return result;
  });
  fetchMock.mockResolvedValue(reply('{"found":false,"name":"x","source":"x","sourceUrl":"https://example.invalid/fiche","technicalFacts":[]}'));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
afterAll(() => {
  for (const [key, value] of [['AUTHORIZED_ACCOUNTS', environment.accounts], ['GEMINI_API_KEY', environment.key]]) {
    if (value == null) delete process.env[key!]; else process.env[key!] = value;
  }
});

describe('#100.1 — fiche levure sans boucle numérique', () => {
  it('demande des températures entières et bornées, et borne les autres scalaires des fiches', async () => {
    await aiTask.run(yeast() as any);
    const yeastSchema = postedBody().generationConfig.responseSchema.properties;
    expect(yeastSchema.tempMinC).toMatchObject({ type: 'INTEGER', minimum: expect.any(Number), maximum: expect.any(Number) });
    expect(yeastSchema.tempMaxC).toMatchObject({ type: 'INTEGER', minimum: expect.any(Number), maximum: expect.any(Number) });
    expect(yeastSchema.attenuationPct).toMatchObject({ minimum: 0, maximum: 100 });
    expect(yeastSchema.alcoholTolerancePct).toMatchObject({ minimum: 0, maximum: expect.any(Number) });
    fetchMock.mockClear();
    await aiTask.run(call({ task: 'lookupIngredient', instruction: 'malt : Pale Ale', context: { kind: 'malt', name: 'Pale Ale' } }) as any);
    const shared = postedBody().generationConfig.responseSchema.properties;
    for (const key of ['colorEbc', 'potentialPpg', 'diastaticPower', 'alphaPct', 'betaPct', 'tempMinC', 'tempMaxC'])
      expect(shared[key], key).toMatchObject({ minimum: expect.any(Number), maximum: expect.any(Number) });
  });

  it('plafonne bas la sortie de la fiche levure au réglage Rapide', async () => {
    await aiTask.run(yeast('fast') as any);
    expect(postedBody().generationConfig).toMatchObject({ maxOutputTokens: 4500, thinkingConfig: { thinkingLevel: 'low' } });
  });

  it('refuse vite une sortie dégénérée : erreur claire, une seule requête, coût soldé comme inutilisable', async () => {
    fetchMock.mockResolvedValue(reply(s04Loop, 'MAX_TOKENS'));
    const result: any = await aiTask.run(yeast() as any);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/nombre répété sans fin/);
    expect(result.error).toMatch(/Rien n’est appliqué/);
    // V3 m10: the same request would loop again and be billed again; never invite to resend it as is.
    expect(result.error).not.toMatch(/relance la demande/);
    expect(result.error).toMatch(/même demande bouclerait encore\s:\smodifie-la/);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(gate).toHaveBeenCalledOnce();
    expect(gate.mock.calls[0][3]).toMatchObject({ daily: true, inspect: expect.any(Function) });
  });

  it('refuse une réponse tronquée sans nombre en boucle, sans nouvelle tentative', async () => {
    fetchMock.mockResolvedValue(reply('{"found":true,"name":"SafAle S-04","technicalFacts":[{"key":"species","reported":"Saccharomyces', 'MAX_TOKENS'));
    const result: any = await aiTask.run(yeast() as any);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/coupée au plafond de sortie/);
    expect(result.error).not.toMatch(/relance la demande/);
    expect(result.error).toMatch(/même demande serait coupée encore\s:\smodifie-la/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('accepte une fiche complète et lisible', async () => {
    const fiche = { found: true, name: 'SafAle S-04', source: 'Fermentis — fiche technique', sourceUrl: 'https://fermentis.com/en/product/safale-s-04/',
      technicalFacts: [{ key: 'temperature', reported: '18-26 °C', range: { min: 18, max: 26 }, unit: '°C', qualifier: 'range', origin: 'ai',
        source: 'Fermentis — fiche technique', sourceUrl: 'https://fermentis.com/en/product/safale-s-04/', retrievedAt: '2026-10-16' }],
      tempMinC: 18, tempMaxC: 26 };
    fetchMock.mockResolvedValue(reply(JSON.stringify(fiche)));
    expect(await aiTask.run(yeast() as any)).toMatchObject({ ok: true, data: fiche, model: 'gemini-3.8-flash' });
  });
});

describe('#100.2 et #100.4 — import et relecture au réglage Rapide de 3.8', () => {
  const recipe = { name: 'Brown ale', style: 'Brown', volumeL: 20, fermentables: [{ name: 'Pale', weightKg: 4, kind: 'grain', use: 'empatage' }],
    hops: [{ name: 'Fuggle', weightG: 30, stage: 'boil', timeMin: 60 }] };
  it.each(['importRecipe', 'reviewRecipe'])('%s part en réflexion basse même si le client demande Max, et le dit', async task => {
    fetchMock.mockResolvedValue(reply(task === 'importRecipe' ? JSON.stringify(recipe) : '{"verdict":"ok","findings":[]}'));
    const result: any = await aiTask.run(call({ task, tier: 'max', instruction: 'Recette de test', context: task === 'reviewRecipe' ? { recette: 'x' } : undefined }) as any);
    expect(postedBody().generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'low' });
    // V3 m3: a long recipe gets its own cap, above the 4500 of a fiche.
    expect(postedBody().generationConfig.maxOutputTokens).toBe(8000);
    expect(result).toMatchObject({ ok: true, tier: 'fast', model: 'gemini-3.8-flash' });
  });

  it('les autres tâches gardent 4 500 jetons au réglage Rapide', async () => {
    await aiTask.run(yeast('fast') as any);
    await aiTask.run(call({ task: 'lookupIngredient', tier: 'fast', instruction: 'malt : Pale Ale', context: { kind: 'malt', name: 'Pale Ale' } }) as any);
    expect([postedBody(0), postedBody(1)].map(body => body.generationConfig.maxOutputTokens)).toEqual([4500, 4500]);
  });
});

describe('#100.2 — délai serveur borné et dit', () => {
  it('un dépassement de délai ne relance pas et rend un message qui dit que l’appel a pu être compté', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    const result: any = await aiTask.run(call({ task: 'importRecipe', instruction: 'Recette de test assez longue' }) as any);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/délai/);
    expect(result.error).toMatch(/compté dans le budget IA/);
  });

  it('chaque requête porte un signal d’abandon et aucune nouvelle tentative ne part sans temps suffisant', async () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    fetchMock.mockImplementation(async () => {
      now += 110_000; // the first attempt consumed nearly the whole task budget
      return { ok: false, status: 503, headers: new Headers(), json: async () => ({}) };
    });
    const result: any = await aiTask.run(call({ task: 'importRecipe', instruction: 'Recette de test assez longue' }) as any);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(result.ok).toBe(false);
  });
});

describe('#100.3 — nombres impossibles de l’import écartés côté serveur', () => {
  it('retire timeMin dénormal et alpha négatif, garde le reste et rend un avertissement', async () => {
    const corrupted = { name: 'Brown ale', style: 'Brown', volumeL: 20,
      fermentables: [{ name: 'Pale', weightKg: 4, kind: 'grain', use: 'empatage' }],
      hops: [{ name: 'Fuggle', weightG: 30, stage: 'boil', timeMin: 6e-323, alpha: -4.5 }, { name: 'EKG', weightG: 20, stage: 'boil', timeMin: 15 }] };
    fetchMock.mockResolvedValue(reply(JSON.stringify(corrupted)));
    const result: any = await aiTask.run(call({ task: 'importRecipe', instruction: 'Recette de test assez longue' }) as any);
    expect(result.ok).toBe(true);
    expect(result.data.hops[0]).toEqual({ name: 'Fuggle', weightG: 30, stage: 'boil' });
    expect(result.data.hops[1]).toEqual({ name: 'EKG', weightG: 20, stage: 'boil', timeMin: 15 });
    expect(result.data.importWarnings).toHaveLength(2);
    expect(result.data.importWarnings.join('\n')).toMatch(/Fuggle/);
  });
});

describe('#100 — textes visibles conformes à DESIGN.md', () => {
  it('les nouveaux messages ne nomment pas le fournisseur du modèle', async () => {
    fetchMock.mockResolvedValueOnce(reply(s04Loop, 'MAX_TOKENS'));
    const degenerate: any = await aiTask.run(yeast() as any);
    fetchMock.mockResolvedValueOnce(reply('{"found":true,"name":"SafAle S-04","technicalFacts":[{"key":"species"', 'MAX_TOKENS'));
    const truncated: any = await aiTask.run(yeast() as any);
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    const late: any = await aiTask.run(call({ task: 'importRecipe', instruction: 'Recette de test assez longue' }) as any);
    for (const error of [degenerate.error, truncated.error, late.error]) {
      expect(error).toEqual(expect.any(String));
      expect(error).not.toMatch(/Gemini|Google/);
    }
  });

  it('les messages de panne et d’erreur définitive ne nomment pas non plus le fournisseur', async () => {
    const failure = (status: number, error: Record<string, unknown> = {}) =>
      ({ ok: false, status, headers: new Headers(), json: async () => ({ error }) });
    const errors: string[] = [];
    fetchMock.mockResolvedValue(failure(503));
    errors.push((await aiTask.run(call({ task: 'reviewRecipe', context: { recette: 'x' } }) as any) as any).error);
    for (const [status, error] of [[403, { status: 'PERMISSION_DENIED' }], [400, { status: 'INVALID_ARGUMENT' }],
      [429, { message: 'Your project has exceeded its monthly spending cap.' }], [404, { status: 'NOT_FOUND' }]] as const) {
      fetchMock.mockReset(); fetchMock.mockResolvedValue(failure(status, error));
      errors.push((await aiTask.run(call({ task: 'reviewRecipe', context: { recette: 'x' } }) as any) as any).error);
    }
    expect(errors).toHaveLength(5);
    for (const error of errors) {
      expect(error).toEqual(expect.any(String));
      expect(error).not.toMatch(/Gemini|Google|gemini-/);
    }
  });
});

describe('#100.4 — erreur HTTP sans corps', () => {
  it('une erreur non relançable sans corps rend un message français, statut gardé dans le diagnostic', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, headers: new Headers(), json: async () => { throw new SyntaxError('Unexpected end of JSON input'); } });
    const result: any = await aiTask.run(call({ task: 'reviewRecipe', context: { recette: 'x' } }) as any);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/a refusé le format de la requête/);
    expect(result.error).not.toMatch(/Gemini|Google/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
