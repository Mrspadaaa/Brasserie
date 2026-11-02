// Voie fn-csv8 (mission 2026-11-01-bascule-lecture, D247) : la lecture de facture en production est C★v8 + N du banc.
// Deux lectures Flash-Lite (consignes 1 et 2, 8 192 jetons), la 3.8 (consigne 3, 8 192 jetons depuis le 02.11) sur désaccord OU quand une Flash-Lite manque ;
// ses valeurs, le statut du vote ; la devise en code ISO (N). Fournisseur entièrement simulé : aucun appel réel.
// Ces tests ont été écrits AVANT le code (L13) et échouaient sur A (deux lectures 3.8 en parallèle).
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'document-hash' }) }));
import { logger } from '../../functions/node_modules/firebase-functions';
import { scanInvoiceSafely } from '../../functions/src/ai';
import { GEMINI_LITE_MODEL, GEMINI_MODEL } from '../../functions/src/models';
import { SCAN_MAX_OUTPUT, SCAN_MODEL } from '../../functions/src/invoiceScanCore';
import { INVOICE_SCAN_PROMPTS } from '../../functions/src/invoiceScanPrompts';
import { TASKS } from '../../functions/src/prompts';

const fetchMock = vi.fn();
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const invoice = (kind = 'stock', extra: Record<string, unknown> = {}) => ({ vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, tvaRate: .081,
  items: [{ name: 'Article', kind, quantity: 2, unit: 'pièce', price: 54.05, amountTTC: 108.1 }], ...extra });

/** Ce que Gemini rend à un appel : un objet (lecture complète), une coupure, un refus HTTP ou un délai. */
const CUT = Symbol('cut');
const refusal = (status: number) => ({ __refusal: status });
const TIMEOUT = Symbol('timeout');
const body = (data: any, finishReason = 'STOP') => ({ candidates: [{ finishReason, content: { parts: [{ text: finishReason === 'STOP' ? JSON.stringify(data) : '{"items":[' }] } }],
  usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 700, thoughtsTokenCount: 50, totalTokenCount: 1750 } });
/** Les lectures sont aiguillées par leur consigne (1, 2 ou 3), pas par l'ordre d'arrivée : le test ne dépend pas de la concurrence. */
type Plan = Partial<Record<'l1' | 'l2' | 's3', any>>;
const slot = (options: any) => ['l1', 'l2', 's3'][INVOICE_SCAN_PROMPTS.indexOf(JSON.parse(options.body).contents[0].parts[0].text)];
function jouer(plan: Plan) {
  fetchMock.mockImplementation(async (_url: string, options: any) => {
    const answer = plan[slot(options) as keyof Plan];
    if (answer === undefined) throw new Error(`appel imprévu : ${slot(options)}`);
    if (answer === TIMEOUT) throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
    if (answer === CUT) return { ok: true, json: async () => body(invoice(), 'MAX_TOKENS') };
    if (answer?.__refusal) return { ok: false, status: answer.__refusal, json: async () => ({}) };
    return { ok: true, json: async () => body(answer) };
  });
}
/** Les appels faits : lecture (1, 2, 3), modèle de l'URL, plafond de sortie. */
const appels = () => fetchMock.mock.calls.map(([url, options]: any[]) => ({ lecture: INVOICE_SCAN_PROMPTS.indexOf(JSON.parse(options.body).contents[0].parts[0].text) + 1,
  model: String(url).match(/models\/([^:]+):/)![1], max: JSON.parse(options.body).generationConfig.maxOutputTokens })).sort((a: any, b: any) => a.lecture - b.lecture);
const lire = async () => (await scanInvoiceSafely('u', file, 'fake-test-key')) as any;
let info: any, warn: any;
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); info = vi.spyOn(logger, 'info').mockImplementation(() => undefined); warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('fn-csv8 — deux Flash-Lite d\'accord : aucune 3.8', () => {
  it('deux appels Flash-Lite, 8 192 jetons, consignes 1 et 2 ; statut du vote « checked » à deux lecteurs', async () => {
    jouer({ l1: invoice(), l2: invoice() });
    const result = await lire();
    expect(appels()).toEqual([{ lecture: 1, model: GEMINI_LITE_MODEL, max: 8192 }, { lecture: 2, model: GEMINI_LITE_MODEL, max: 8192 }]);
    expect(result).toMatchObject({ ok: true, documentHash: 'document-hash', data: { review: { status: 'checked', readers: 2 } } });
  });
  it('corps de chaque appel : même schéma, température 0, réflexion LOW, haute résolution, pas d\'outil, clé en en-tête', async () => {
    jouer({ l1: invoice(), l2: invoice() });
    await lire();
    for (const [url, options] of fetchMock.mock.calls) {
      expect(url).toContain(`${GEMINI_LITE_MODEL}:generateContent`);
      expect(url).not.toContain('key=');
      expect(options.headers['x-goog-api-key']).toBe('fake-test-key');
      const sent = JSON.parse(options.body);
      expect(sent.tools).toBeUndefined();
      expect(sent.systemInstruction.parts[0].text).toBe(TASKS.scanInvoice.system);
      expect(sent.contents[0].parts[1].inlineData).toEqual(file);
      expect(sent.generationConfig).toEqual({ responseMimeType: 'application/json', responseSchema: TASKS.scanInvoice.schema, temperature: 0, maxOutputTokens: 8192,
        mediaResolution: 'MEDIA_RESOLUTION_HIGH', thinkingConfig: { thinkingLevel: 'LOW' } });
    }
  });
  it('les deux lectures sont lancées ensemble (en parallèle), avant toute réponse', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    fetchMock.mockImplementation(async () => { await gate; return { ok: true, json: async () => body(invoice()) }; });
    const pending = lire();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    release();
    expect((await pending).data.review.readers).toBe(2);
  });
  it('le résultat porte toujours le modèle d\'arbitrage de la réponse au client (forme inchangée)', async () => {
    jouer({ l1: invoice(), l2: invoice() });
    expect(await lire()).toMatchObject({ ok: true, model: SCAN_MODEL, tier: 'fast' });
    expect(SCAN_MODEL).toBe(GEMINI_MODEL);
  });
  it('les pensées du modèle sont ignorées à la lecture', async () => {
    fetchMock.mockImplementation(async () => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'raisonnement non JSON' }, { text: JSON.stringify(invoice()) }] } }], usageMetadata: { totalTokenCount: 10 } }) }));
    expect((await lire()).data.review.status).toBe('checked');
  });
});

describe('fn-csv8 — désaccord : la 3.8 tranche, avec ses valeurs et le statut du vote', () => {
  it('trois lectures toutes différentes : la 3.8 (consigne 3) donne SES valeurs, le statut reste « disputed » (vote à trois)', async () => {
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: invoice('service') });
    const { data } = await lire();
    expect(appels()).toEqual([{ lecture: 1, model: GEMINI_LITE_MODEL, max: 8192 }, { lecture: 2, model: GEMINI_LITE_MODEL, max: 8192 }, { lecture: 3, model: GEMINI_MODEL, max: SCAN_MAX_OUTPUT }]);
    expect(data.items[0].kind).toBe('service');
    expect(data.review).toMatchObject({ status: 'disputed', readers: 3 });
    expect(data.points.some((p: any) => p.source === 'désaccord' && p.cle === 'lectures-divergentes:1:kind')).toBe(true);
    expect(data.issues.join(' ')).toContain('nature : lectures divergentes');
  });
  it('majorité de deux sur trois : la valeur de la 3.8, statut « corrected » et trois lecteurs', async () => {
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: invoice('maintenance') });
    const { data } = await lire();
    expect(appels().map((c: any) => c.model)).toEqual([GEMINI_LITE_MODEL, GEMINI_LITE_MODEL, GEMINI_MODEL]);
    expect(data).toMatchObject({ items: [{ kind: 'maintenance' }], review: { status: 'corrected', readers: 3, correctedFields: ['items.0.kind'] } });
  });
  it('la 3.8 ne reçoit pas les montants des deux premières lectures', async () => {
    jouer({ l1: invoice(), l2: { ...invoice(), amountTTC: 118.1 }, s3: invoice() });
    await lire();
    const third = JSON.parse(fetchMock.mock.calls.find(([, options]: any[]) => slot(options) === 's3')![1].body);
    expect(third.contents[0].parts[0].text).toBe(INVOICE_SCAN_PROMPTS[2]);
    expect(third.contents[0].parts[0].text).not.toContain('118.1');
    expect(third.contents[0].parts[1].inlineData).toEqual(file);
  });
  it('trois lectures sur le total : la 3.8 tranche seule (sa valeur), le désaccord reste visible', async () => {
    jouer({ l1: invoice(), l2: { ...invoice(), amountTTC: 118.1 }, s3: { ...invoice(), amountTTC: 128.1 } });
    const { data } = await lire();
    expect(data.amountTTC).toBe(128.1);
    expect(data.review).toMatchObject({ status: 'disputed', readers: 3 });
    expect(data.issues.join(' ')).toContain('Montant TTC');
  });
  it('une devise étrangère transcrite à l\'identique par les deux lectures ne déclenche pas la 3.8', async () => {
    jouer({ l1: { ...invoice(), currency: 'EUR' }, l2: { ...invoice(), currency: 'EUR' } });
    const { data } = await lire();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data).toMatchObject({ currency: 'EUR', review: { status: 'disputed' } });
    expect(data.issues.join(' ')).toContain('réellement payé en CHF');
  });
});

describe('fn-csv8 — une Flash-Lite manque : la 3.8 est appelée aussi', () => {
  it('une Flash-Lite coupée : la 3.8 est appelée, le résultat est un vote à deux (jamais « Lecture indisponible »)', async () => {
    jouer({ l1: invoice(), l2: CUT, s3: invoice() });
    const { data } = await lire();
    expect(appels().map((c: any) => c.lecture)).toEqual([1, 2, 3]);
    expect(data.review).toMatchObject({ status: 'checked', readers: 2 });
    expect(info.mock.calls.some((c: any[]) => c[1]?.coupee === true && c[1]?.finishReason === 'MAX_TOKENS')).toBe(true);
  });
  it('une Flash-Lite refusée (HTTP 503) : la 3.8 vote avec l\'autre', async () => {
    jouer({ l1: refusal(503), l2: invoice('equipment'), s3: invoice('equipment') });
    const { data } = await lire();
    expect(appels().map((c: any) => c.lecture)).toEqual([1, 2, 3]);
    expect(data).toMatchObject({ items: [{ kind: 'equipment' }], review: { readers: 2 } });
    expect(warn.mock.calls.some((c: any[]) => c[0] === 'Lecture de facture en échec' && c[1].lecture === 1)).toBe(true);
  });
  it('une Flash-Lite arrêtée par le délai : la 3.8 est appelée', async () => {
    jouer({ l1: TIMEOUT, l2: invoice(), s3: invoice() });
    const { data } = await lire();
    expect(appels()).toHaveLength(3);
    expect(data.review.readers).toBe(2);
  });
  it('les deux Flash-Lite coupées : la 3.8 seule, « unavailable » à un lecteur, coupure dite telle quelle', async () => {
    jouer({ l1: CUT, l2: CUT, s3: invoice() });
    const { data } = await lire();
    expect(appels().map((c: any) => c.lecture)).toEqual([1, 2, 3]);
    expect(data.review).toMatchObject({ status: 'unavailable', readers: 1 });
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'sortie', pese: true });
    expect(data.issues.join(' ')).toMatch(/coupée/);
    expect(data.amountTTC).toBe(108.1);
  });
  it('une seule Flash-Lite lisible et la 3.8 en échec : « unavailable » honnête, coupure dite', async () => {
    jouer({ l1: invoice(), l2: CUT, s3: refusal(503) });
    const { data } = await lire();
    expect(data.review).toMatchObject({ status: 'unavailable', readers: 1 });
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'sortie' });
  });
  it('rien de lisible nulle part : l\'erreur de la première lecture remonte (message existant), trois appels seulement', async () => {
    jouer({ l1: CUT, l2: CUT, s3: CUT });
    await expect(lire()).rejects.toThrow('Lecture incomplète');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('les trois lectures refusées par le fournisseur : l\'erreur remonte, aucun quatrième appel', async () => {
    jouer({ l1: refusal(429), l2: refusal(429), s3: refusal(429) });
    await expect(lire()).rejects.toThrow('429');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('fn-csv8 — la 3.8 en échec après un désaccord : repli et coupure dite', () => {
  it('3.8 coupée : divergences explicites, statut « disputed », phrase et point lecture-coupee « sortie »', async () => {
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: CUT });
    const { data } = await lire();
    expect(data.items[0].kind).toBe('equipment');
    expect(data.review).toMatchObject({ status: 'disputed' });
    expect(data.issues.join(' ')).toContain('contrôle complémentaire n’a pas abouti');
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'sortie' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('3.8 refusée (503) : même repli, cause « delai-saute » faute de coupure connue', async () => {
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: refusal(503) });
    const { data } = await lire();
    expect(data.review.status).toBe('disputed');
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'delai-saute' });
  });
  it('3.8 arrêtée par le délai : cause « delai »', async () => {
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: TIMEOUT });
    const { data } = await lire();
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'delai' });
  });
  it('délai global (100 s) atteint avant la 3.8 : elle est sautée AVEC phrase et point', async () => {
    const reelle = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => (ms === 100_000 ? AbortSignal.abort() : reelle(ms)));
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: invoice('maintenance') });
    const { data } = await lire();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data.review.status).toBe('disputed');
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'delai-saute' });
  });
});

describe('fn-csv8 — N : la devise en code ISO', () => {
  it('« Fr. » lu par les deux Flash-Lite devient « CHF » : aucune remarque de devise', async () => {
    jouer({ l1: { ...invoice(), currency: 'Fr.' }, l2: { ...invoice(), currency: 'SFr.' } });
    const { data } = await lire();
    expect(data.currency).toBe('CHF');
    expect(data.issues.join(' ')).not.toMatch(/Document en|Devise/);
    expect(data.points.some((p: any) => p.code === 'devise-non-chf')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('« Fr. » d\'une lecture et « CHF » de l\'autre ne font plus un désaccord : pas de 3.8', async () => {
    jouer({ l1: { ...invoice(), currency: 'Fr.' }, l2: invoice() });
    const { data } = await lire();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data.review).toMatchObject({ status: 'checked', readers: 2 });
  });
  it('N touche aussi la lecture de la 3.8', async () => {
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: { ...invoice('maintenance'), currency: 'CHF.' } });
    expect((await lire()).data.currency).toBe('CHF');
  });
  it('une devise étrangère n\'est jamais devinée', async () => {
    jouer({ l1: { ...invoice(), currency: 'EUR' }, l2: { ...invoice(), currency: 'eur' } });
    expect((await lire()).data.currency).toBe('EUR');
  });
  it('les lignes au-delà du plafond de 35 restent écartées, avec leur remarque', async () => {
    const trop = { ...invoice(), items: Array.from({ length: 40 }, (_, i) => ({ name: `Article ${i}`, kind: 'stock', quantity: 1, unit: 'pièce', price: 1, amountTTC: 1 })) };
    jouer({ l1: trop, l2: trop });
    const { data } = await lire();
    expect(data.items).toHaveLength(35);
    expect(data.issues.join(' ')).toContain('Plus de 35 lignes');
  });
});

describe('fn-csv8 — journal par lecture, sans contenu de facture', () => {
  it('une ligne par lecture : numéro, étape, modèle, jetons, finishReason', async () => {
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: invoice('maintenance') });
    await lire();
    const lignes = info.mock.calls.filter((c: any[]) => c[0] === 'Lecture de facture').map((c: any[]) => c[1]).sort((a: any, b: any) => a.lecture - b.lecture);
    expect(lignes.map((l: any) => [l.lecture, l.etape, l.model])).toEqual([[1, 'parallele', GEMINI_LITE_MODEL], [2, 'parallele', GEMINI_LITE_MODEL], [3, 'troisieme', GEMINI_MODEL]]);
    expect(lignes[0]).toMatchObject({ finishReason: 'STOP', coupee: false, totalTokens: 1750 });
    expect(JSON.stringify(info.mock.calls)).not.toContain('Fournisseur');
  });
});

describe('fn-csv8 — garde-fous inchangés', () => {
  it('le petit plafond de sortie d\'un test réel s\'applique à chaque appel', async () => {
    jouer({ l1: invoice('equipment'), l2: invoice('maintenance'), s3: invoice('maintenance') });
    await scanInvoiceSafely('u', file, 'fake-test-key', { maxOutputTokens: 2048 });
    expect(appels().map((c: any) => c.max)).toEqual([2048, 2048, 2048]);
  });
  it('un plafond de test au-delà de la production est refusé avant tout appel', async () => {
    await expect(scanInvoiceSafely('u', file, 'fake-test-key', { maxOutputTokens: SCAN_MAX_OUTPUT + 1 })).rejects.toThrow('Plafond de sortie invalide');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('refuse un format non autorisé avant toute lecture', async () => {
    await expect(scanInvoiceSafely('u', { ...file, mimeType: 'image/svg+xml' }, 'fake-test-key')).rejects.toThrow('Choisis');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('attend une sœur encore en cours après le rejet de la première, puis appelle la 3.8', async () => {
    let release!: (value: any) => void;
    fetchMock.mockImplementation((_url: string, options: any) => {
      const lecture = slot(options);
      if (lecture === 'l1') return Promise.resolve({ ok: false, status: 503, json: async () => ({}) });
      if (lecture === 'l2') return new Promise(resolve => { release = resolve; });
      return Promise.resolve({ ok: true, json: async () => body(invoice()) });
    });
    let finished = false;
    const pending = lire().then(result => { finished = true; return result; });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(finished).toBe(false);
    release({ ok: true, json: async () => body(invoice()) });
    expect((await pending).data.review.readers).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
