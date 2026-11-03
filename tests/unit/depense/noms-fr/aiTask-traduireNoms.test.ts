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


  it('texte seul, Rapide imposé, plafond de sortie du banc pour le plus gros ticket (35 lignes, comme la lecture)', () => {
    const tache = (TASKS as Record<string, any>).traduireNoms;
    expect(tache.acceptsFile).toBe(false);
    expect(tache.tier).toBe('fast');
    expect(tache.defaultTier).toBe('fast');
    expect(tache.grounded).toBeUndefined();
    // D379 : la lecture n'a plus de plafond (SCAN_MAX_ITEMS est un garde-fou) ; 35 est la taille d'une tranche de noms, au plafond de sortie du banc.
    expect(NOMS_MAX_ENTREES).toBe(35);
    expect(SCAN_MAX_ITEMS).toBeGreaterThan(1000);
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
