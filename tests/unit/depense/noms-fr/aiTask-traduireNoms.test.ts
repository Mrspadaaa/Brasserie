// Voie f5c-noms-prod (D278, D280) : la tâche `traduireNoms` d'aiTask, telle que mesurée au banc `scripts/banc-noms-fr.ts`.
// Rien n'est appelé pour de bon : `fetch` et le budget mensuel sont simulés (L'appel Gemini réel n'existe jamais dans npm test).
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

const environment = vi.hoisted(() => {
  const previous = { accounts: process.env.AUTHORIZED_ACCOUNTS, key: process.env.GEMINI_API_KEY };
  process.env.AUTHORIZED_ACCOUNTS = 'noms-test@example.invalid';
  process.env.GEMINI_API_KEY = 'fake-unit-test-key';
  return previous;
});
const gate = vi.hoisted(() => vi.fn());
vi.mock('../../../../functions/src/monthlyAiBudget', () => ({ runWithMonthlyAiBudget: gate }));

import { aiTask } from '../../../../functions/src/ai';
import { GEMINI_LITE_MODEL, GEMINI_MODEL, geminiAttempts } from '../../../../functions/src/models';
import { TASKS } from '../../../../functions/src/prompts';
import { INVOICE_SCAN_PROMPTS } from '../../../../functions/src/invoiceScanPrompts';
import { LITE_SCAN_MAX_OUTPUT, SCAN_MAX_ITEMS, SCAN_MAX_OUTPUT, SCAN_MODEL } from '../../../../functions/src/invoiceScanCore';
import { NOMS_SCHEMA, SYSTEME_NOMS_FR, buildNomsBody, maxSortie } from '../../../../scripts/banc-noms-fr';
import { NOMS_MAX_ENTREES } from '../../../../src/domain/nomsBase';

const FLASH = 'gemini-3.8-flash';
const fetchMock = vi.fn();
const answer = (noms: unknown[] = [{ i: 0, nameFr: 'Sac à houblon fin' }]) => ({
  ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ noms }) }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 300, candidatesTokenCount: 30, totalTokenCount: 330 } })
});
const call = (data: Record<string, unknown>) => ({
  data, auth: { uid: 'test-user', token: { email: 'noms-test@example.invalid', email_verified: true } }
});
const entrees = [{ i: 0, base: 'Hopfensack fein', kind: 'equipment', stockCategory: '' }, { i: 1, base: 'CARABELGE®', kind: 'stock', stockCategory: 'Malt' }];
const requete = { task: 'traduireNoms', tier: 'fast', context: { entrees } };
const posted = (index = 0) => JSON.parse(fetchMock.mock.calls[index][1].body);
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

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

describe('f5c — la tâche traduireNoms reprend le banc mesuré, sans retouche', () => {
  it('la consigne et le schéma sont ceux du banc, mot pour mot', () => {
    const tache = (TASKS as Record<string, any>).traduireNoms;
    expect(tache).toBeDefined();
    expect(tache.system).toBe(SYSTEME_NOMS_FR);
    expect(tache.schema).toEqual(NOMS_SCHEMA);
  });

  it('texte seul, Rapide imposé, plafond de sortie du banc pour le plus gros ticket (35 lignes, comme la lecture)', () => {
    const tache = (TASKS as Record<string, any>).traduireNoms;
    expect(tache.acceptsFile).toBe(false);
    expect(tache.tier).toBe('fast');
    expect(tache.defaultTier).toBe('fast');
    expect(tache.grounded).toBeUndefined();
    expect(NOMS_MAX_ENTREES).toBe(SCAN_MAX_ITEMS);
    expect(tache.maxOutputTokens).toBe(maxSortie(NOMS_MAX_ENTREES));
    expect(tache.maxOutputTokens).toBe(600 + 36 * 35);
  });

  it('le routage met la 3.8 (jamais Flash-Lite), réflexion basse, une seule nouvelle tentative sur la 3.8', () => {
    expect(geminiAttempts('traduireNoms', 'fast')).toEqual([{ model: FLASH, thinkingLevel: 'low' }, { model: FLASH, thinkingLevel: 'low' }]);
    expect(geminiAttempts('traduireNoms', 'fast').some(attempt => attempt.model === GEMINI_LITE_MODEL)).toBe(false);
  });

  it('un appel réel simulé part vers la 3.8 : texte seul, température 0, réflexion basse, schéma et consigne du banc', async () => {
    const resultat = await aiTask.run(call(requete) as any);
    expect(resultat).toMatchObject({ ok: true, model: FLASH, tier: 'fast', data: { noms: [{ i: 0, nameFr: 'Sac à houblon fin' }] } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(`/models/${FLASH}:generateContent`);
    expect(gate.mock.calls.map(([model]) => model)).toEqual([FLASH]);
    const corps = posted(), banc = buildNomsBody(entrees as any) as any;
    expect(corps.systemInstruction).toEqual(banc.systemInstruction);
    expect(corps.generationConfig.responseSchema).toEqual(banc.generationConfig.responseSchema);
    expect(corps.generationConfig).toMatchObject({ responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 1860, thinkingConfig: { thinkingLevel: 'low' } });
    expect(JSON.stringify(corps)).not.toContain('inlineData');
    expect(corps.contents[0].parts).toHaveLength(1);
    // Le chemin générique préfixe la donnée (« Données : ») ; les entrées elles-mêmes sont octet pour octet celles du banc.
    expect(corps.contents[0].parts[0].text).toBe(`Données :\n${JSON.stringify({ entrees })}`);
    expect(JSON.stringify({ entrees })).toBe(banc.contents[0].parts[0].text);
  });

  it('refuse une pièce jointe : la tâche est texte seul', async () => {
    await expect(aiTask.run(call({ ...requete, file: { data: Buffer.from('x').toString('base64'), mimeType: 'application/pdf' } }) as any))
      .rejects.toMatchObject({ code: 'invalid-argument', message: expect.stringMatching(/n'accepte pas de pièce jointe/) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('une réponse coupée n’est pas relancée en boucle : une nouvelle tentative au plus, sur la 3.8, puis l’échec est rendu', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, headers: new Headers(), json: async () => ({ error: { code: 503, status: 'UNAVAILABLE', message: '' } }) });
    const resultat = await aiTask.run(call(requete) as any) as any;
    expect(resultat.ok).toBe(false);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
  });
});

describe('f5c — la lecture de facture ne change pas d’un octet (instantané pris sur HEAD, 01.11)', () => {
  it('scanInvoice : consigne, schéma, réglages', () => {
    expect(sha(TASKS.scanInvoice)).toBe('b219d6217e6d321a1dfd3e0c5a68f69a92680a380655dc953790560eaacb48fe');
  });
  it('les trois consignes de la lecture, les plafonds de sortie et le modèle', () => {
    expect(sha({ prompts: INVOICE_SCAN_PROMPTS, lite: LITE_SCAN_MAX_OUTPUT, strong: SCAN_MAX_OUTPUT, model: SCAN_MODEL }))
      .toBe('66427dd87a6fa7aef5fd18b69b624b86c6eecb3bd9b6afa0132ccb2b306b5e50');
    expect([LITE_SCAN_MAX_OUTPUT, SCAN_MAX_OUTPUT, SCAN_MODEL]).toEqual([8192, 5100, GEMINI_MODEL]);
  });
  it('les seize autres tâches d’aiTask sont inchangées', () => {
    const autres = Object.fromEntries(Object.entries(TASKS).filter(([id]) => id !== 'traduireNoms'));
    expect(Object.keys(autres)).toHaveLength(16);
    expect(sha(autres)).toBe('f8400650cd0a8e3edf8541dbb1b4aeec3ba2a2f6661fe8761579bad23b29a508');
  });
});
