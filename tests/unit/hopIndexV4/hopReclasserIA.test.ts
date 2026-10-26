// Voie i2 : le callable `hopReclasserIA` et le module partagé de l'invite, fournisseur simulé. Jamais de Gemini réel ici.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const environment = vi.hoisted(() => {
  const previous = { accounts: process.env.AUTHORIZED_ACCOUNTS, key: process.env.GEMINI_API_KEY, emu: process.env.FUNCTIONS_EMULATOR, over: process.env.HOP_RECLASS_ENDPOINT_EMULATEUR };
  process.env.AUTHORIZED_ACCOUNTS = 'reclass-test@example.invalid';
  process.env.GEMINI_API_KEY = 'fake-unit-test-key';
  delete process.env.FUNCTIONS_EMULATOR; delete process.env.HOP_RECLASS_ENDPOINT_EMULATEUR;
  return previous;
});
const gate = vi.hoisted(() => vi.fn());
vi.mock('../../../functions/src/monthlyAiBudget', () => ({ runWithMonthlyAiBudget: gate }));
import { hopReclasserIA } from '../../../functions/src/hopReclasserIA';
import { BrewerBudgetError } from '../../../functions/src/brewerLimits';
import { GENERATION, SCHEMA, SYSTEME, TAILLE_POOL, analyserReponse, construireInvite, ficheDeCatalogue, lireEntree } from '../../../functions/src/hopReclassCore';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';

const LITE = 'gemini-3.5-flash-lite';
const fetchMock = vi.fn();
const fiches = CATALOGUE.slice(0, 21).map(ficheDeCatalogue);
const entree = (n = TAILLE_POOL, moment: unknown = { type: 'dryhop' }) => ({
  moment, original: fiches[0], candidats: fiches.slice(1, 1 + n).map((fiche, i) => ({ id: `cle-${i + 1}`, fiche })),
});
const requete = (data: unknown, email = 'reclass-test@example.invalid') => ({ data, auth: { uid: 'u', token: { email, email_verified: true } } });
const classement = (ids: string[], phrase = 'Proche par les agrumes.') => JSON.stringify({ classement: ids.map((id) => ({ id, phrase })) });
const dix = Array.from({ length: 10 }, (_, i) => `c${String(i + 1).padStart(2, '0')}`);
const reponse = (text: string, finishReason = 'STOP') => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }], usageMetadata: { promptTokenCount: 3800, candidatesTokenCount: 520, totalTokenCount: 4320 } }) });
const corps = (i = 0) => JSON.parse(fetchMock.mock.calls[i][1].body);

beforeEach(() => {
  gate.mockReset(); fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
  gate.mockImplementation(async (_m: string, body: any, generate: any, options?: { inspect?: (r: unknown) => Error | undefined }) => {
    const r = await generate(body); const bad = options?.inspect?.(r); if (bad) throw bad; return r;
  });
  fetchMock.mockResolvedValue(reponse(classement(dix)));
});
afterEach(() => { vi.unstubAllGlobals(); delete process.env.FUNCTIONS_EMULATOR; delete process.env.HOP_RECLASS_ENDPOINT_EMULATEUR; });
afterAll(() => {
  for (const [k, v] of [['AUTHORIZED_ACCOUNTS', environment.accounts], ['GEMINI_API_KEY', environment.key], ['FUNCTIONS_EMULATOR', environment.emu], ['HOP_RECLASS_ENDPOINT_EMULATEUR', environment.over]] as const) {
    if (v == null) delete process.env[k]; else process.env[k] = v;
  }
});

describe('hopReclasserIA : accès', () => {
  it('refuse sans connexion, sans adresse vérifiée et hors des comptes autorisés, sans rien dépenser', async () => {
    await expect(hopReclasserIA.run({ data: entree() } as any)).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(hopReclasserIA.run({ data: entree(), auth: { uid: 'u', token: { email: 'reclass-test@example.invalid', email_verified: false } } } as any)).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(hopReclasserIA.run(requete(entree(), 'intrus@example.invalid') as any)).rejects.toMatchObject({ code: 'permission-denied' });
    expect(gate).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('hopReclasserIA : une réponse valide', () => {
  it('réserve le budget (mensuel et quotidien) avant l’envoi, appelle Flash-Lite seul, rend l’ordre sous les clés du client', async () => {
    const r: any = await hopReclasserIA.run(requete(entree()) as any);
    expect(r).toMatchObject({ ok: true, model: LITE, promptVersion: 'v1' });
    expect(r.ordre).toEqual(dix.map((_, i) => `cle-${i + 1}`));
    expect(Object.keys(r.phrases)).toEqual(r.ordre); expect(r.phrases['cle-1']).toBe('Proche par les agrumes.');
    expect(gate).toHaveBeenCalledOnce();
    expect(gate.mock.calls[0][0]).toBe(LITE); expect(gate.mock.calls[0][3]).toEqual({ daily: true, inspect: expect.any(Function) });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${LITE}:generateContent`);
    const b = corps();
    expect(b.systemInstruction.parts[0].text).toBe(SYSTEME); expect(b.generationConfig).toMatchObject({ responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 4000, thinkingConfig: { thinkingLevel: 'low' } });
    expect(b.contents[0].parts[0].text).toContain('c20 · '); expect(b.contents[0].parts[0].text).toContain('dry hop, en fermentation active');
  });
  it('l’ordre rendu peut différer de celui du moteur : c07 d’abord, les clés suivent', async () => {
    fetchMock.mockResolvedValue(reponse(classement(['c07', 'c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c08', 'c09', 'c10'])));
    const r: any = await hopReclasserIA.run(requete(entree()) as any);
    expect(r.ordre.slice(0, 3)).toEqual(['cle-7', 'cle-1', 'cle-2']);
  });
  it('un client ne choisit ni le modèle ni la clé : un champ « model » est ignoré', async () => {
    await hopReclasserIA.run(requete({ ...entree(), model: 'gemini-3.8-flash', apiKey: 'x' }) as any);
    expect(String(fetchMock.mock.calls[0][0])).toContain(LITE); expect(JSON.stringify(corps())).not.toContain('"x"');
  });
});

describe('hopReclasserIA : jamais un ordre inventé', () => {
  const ordreAbsent = (r: any) => { expect(r).toMatchObject({ ok: false, reason: 'invalide' }); expect(r.ordre).toBeUndefined(); expect(r.phrases).toBeUndefined(); };
  it.each([
    ['identifiant hors liste', classement([...dix.slice(0, 9), 'c99'])],
    ['identifiant en double', classement([dix[0], ...dix.slice(0, 9)])],
    ['JSON coupé', '{"classement": [{"id": "c01", "phrase": "coupé'],
    ['neuf entrées', classement(dix.slice(0, 9))],
    ['identifiant au-delà de la liste envoyée', classement([...dix.slice(0, 9), 'c21'])],
    ['phrase vide', JSON.stringify({ classement: dix.map((id, i) => ({ id, phrase: i === 3 ? '' : 'ok' })) })],
    ['sans classement', '{}'],
  ])('refuse : %s', async (_nom, texte) => {
    fetchMock.mockResolvedValue(reponse(texte as string));
    ordreAbsent(await hopReclasserIA.run(requete(entree()) as any));
    expect(fetchMock).toHaveBeenCalledOnce();   // pas de seconde tentative
  });
  it('refuse une réponse coupée au plafond de sortie (facturée, jamais lue)', async () => {
    fetchMock.mockResolvedValue(reponse(classement(dix), 'MAX_TOKENS'));
    ordreAbsent(await hopReclasserIA.run(requete(entree()) as any));
  });
  it('ignore au-delà de la dixième entrée, comme l’essai', async () => {
    fetchMock.mockResolvedValue(reponse(classement([...dix, 'c11', 'c12'])));
    const r: any = await hopReclasserIA.run(requete(entree()) as any);
    expect(r.ok).toBe(true); expect(r.ordre).toHaveLength(10);
  });
});

describe('hopReclasserIA : refus, pannes, entrée', () => {
  it('le budget refusé arrête avant tout appel et le dit', async () => {
    gate.mockRejectedValue(new BrewerBudgetError('ai-monthly-limit', 'Budget mensuel atteint.'));
    expect(await hopReclasserIA.run(requete(entree()) as any)).toMatchObject({ ok: false, reason: 'budget', error: 'Budget mensuel atteint.' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('une panne du fournisseur n’est pas retentée : une seule requête, jamais 3.8', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, headers: new Headers(), json: async () => ({ error: { code: 503, status: 'UNAVAILABLE' } }) });
    expect(await hopReclasserIA.run(requete(entree()) as any)).toMatchObject({ ok: false, reason: 'indisponible' });
    expect(fetchMock).toHaveBeenCalledOnce(); expect(gate).toHaveBeenCalledOnce();
  });
  it('un délai dépassé rend une erreur propre', async () => {
    const t = new Error('timeout'); t.name = 'TimeoutError'; fetchMock.mockRejectedValue(t);
    expect(await hopReclasserIA.run(requete(entree()) as any)).toMatchObject({ ok: false, reason: 'indisponible' });
  });
  it.each([
    ['moins de 10 candidats', entree(9)], ['plus de 20 candidats', { ...entree(), candidats: [...entree().candidats, { id: 'cle-x', fiche: fiches[20] }] }],
    ['moment inconnu', entree(20, { type: 'cave' })], ['absente', null], ['nom vide', { ...entree(), original: { ...fiches[0], nom: '' } }],
    ['plage négative', { ...entree(), original: { ...fiches[0], alpha: [-1, 3] } }],
    ['clé en double', { ...entree(), candidats: entree().candidats.map((c) => ({ ...c, id: 'meme' })) }],
  ])('refuse une entrée : %s, sans budget ni requête', async (_n, data) => {
    expect(await hopReclasserIA.run(requete(data) as any)).toMatchObject({ ok: false, reason: 'entree' });
    expect(gate).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });
  it('hors émulateur, aucune variable ne détourne l’appel de Google', async () => {
    process.env.HOP_RECLASS_ENDPOINT_EMULATEUR = 'http://127.0.0.1:9999/v1beta/models';
    await hopReclasserIA.run(requete(entree()) as any);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/generativelanguage\.googleapis\.com\//);
  });
  it('dans l’émulateur, et là seulement, le fournisseur simulé local est atteint (sans clé)', async () => {
    process.env.HOP_RECLASS_ENDPOINT_EMULATEUR = 'http://127.0.0.1:9999/v1beta/models'; process.env.FUNCTIONS_EMULATOR = 'true';
    await hopReclasserIA.run(requete(entree()) as any);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`http://127.0.0.1:9999/v1beta/models/${LITE}:generateContent`);
    fetchMock.mockClear(); process.env.HOP_RECLASS_ENDPOINT_EMULATEUR = 'https://exemple.invalid/v1beta/models';
    await hopReclasserIA.run(requete(entree()) as any);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/generativelanguage\.googleapis\.com\//);
  });
});

describe('module partagé : l’invite de l’essai ia1, mot pour mot', () => {
  const figees = JSON.parse(readFileSync(resolve('work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement/requetes/requetes-moteur.json'), 'utf8'));
  const parId = new Map(CATALOGUE.map((h) => [h.id, h]));
  it('le système, le schéma et la génération sont ceux des requêtes figées', () => {
    expect(figees.systeme).toBe(SYSTEME); expect(figees.schema).toEqual(SCHEMA); expect(figees.generation).toEqual(GENERATION);
  });
  it('chaque message de l’essai (78 cas, dry hop et 60′) est reconstruit à l’identique', () => {
    expect(figees.cas.length).toBeGreaterThan(70);
    for (const c of figees.cas) {
      const moment = c.moment === 'dryActive' ? { type: 'dryhop' as const } : { type: 'ebullition' as const, minutes: 60 };
      const user = construireInvite(moment, ficheDeCatalogue(parId.get(c.hop)!), c.candidats.map((x: { key: string }) => ficheDeCatalogue(parId.get(x.key)!)));
      expect(user, c.id).toBe(c.user);
    }
  });
  it('lireEntree accepte une entrée bien formée et en garde les fiches', () => {
    const e = lireEntree(entree(12, { type: 'ebullition', minutes: 15 }));
    expect(e.candidats).toHaveLength(12); expect(e.moment).toEqual({ type: 'ebullition', minutes: 15 }); expect(e.original.nom).toBe(fiches[0].nom);
  });
  it('analyserReponse : même règle que l’essai (dix distincts, dans la liste)', () => {
    expect(analyserReponse(classement(dix), dix).valide).toBe(true);
    expect(analyserReponse(classement(dix), dix.slice(0, 9)).valide).toBe(false);
  });
});
