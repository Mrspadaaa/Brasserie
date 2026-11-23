import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'document-hash' }) }));
import { scanInvoiceSafely } from '../../functions/src/ai';
import { SCAN_MAX_OUTPUT, SCAN_MODEL } from '../../functions/src/invoiceScanCore';
import { GEMINI_LITE_MODEL } from '../../functions/src/models';

// Voie h1 (14.11) : la 3ᵉ lecture des justificatifs est lue par Hydrogen (réflexion basse), repli une fois sur la 3.8. Gemini est entièrement simulé.
// Les noms sont écrits en clair : un test qui importerait la constante passerait aussi sur une constante fausse.
const HYDROGEN = 'gemini-4-hydrogen', FLASH = 'gemini-3.8-flash';
const fetchMock = vi.fn();
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const invoice = (kind = 'stock', amountTTC = 108.1) => ({ vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', amountHT: 100, tvaAmount: 8.1, amountTTC, tvaRate: .081, items: [{ name: 'Article', kind, quantity: 2, unit: 'pièce', price: 54.05, amountTTC }] });
const response = (data: any, finishReason = 'STOP') => ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { totalTokenCount: 10 } }) });
const failure = (status: number) => ({ ok: false, status, json: async () => ({}) });
const modelOf = (index: number) => /\/models\/([^:]+):generateContent$/.exec(String(fetchMock.mock.calls[index][0]))?.[1];
const bodyOf = (index: number) => JSON.parse(fetchMock.mock.calls[index][1].body);
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('3ᵉ lecture des justificatifs : Hydrogen, réflexion basse (voie h1)', () => {
  it('sur désaccord, la 3ᵉ lecture part vers gemini-4-hydrogen, réflexion LOW, plafond de sortie de 12 000', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(response(invoice('maintenance'))).mockResolvedValueOnce(response(invoice('maintenance')));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect([modelOf(0), modelOf(1)]).toEqual([GEMINI_LITE_MODEL, GEMINI_LITE_MODEL]);
    expect(modelOf(2)).toBe(HYDROGEN);
    expect(bodyOf(2).generationConfig).toMatchObject({ thinkingConfig: { thinkingLevel: 'LOW' }, maxOutputTokens: 12000, mediaResolution: 'MEDIA_RESOLUTION_HIGH', temperature: 0 });
    expect(bodyOf(2).tools).toBeUndefined();
    expect(result).toMatchObject({ ok: true, model: HYDROGEN, data: { items: [{ kind: 'maintenance' }], review: { status: 'corrected', readers: 3 } } });
  });

  it('Hydrogen en panne (HTTP 503) : une seule nouvelle tentative, sur la 3.8, qui tranche comme avant', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(response(invoice('maintenance')))
      .mockResolvedValueOnce(failure(503)).mockResolvedValueOnce(response(invoice('maintenance')));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect([modelOf(2), modelOf(3)]).toEqual([HYDROGEN, FLASH]);
    expect(modelOf(3)).toBe(SCAN_MODEL);
    expect(bodyOf(3).generationConfig).toMatchObject({ thinkingConfig: { thinkingLevel: 'LOW' }, maxOutputTokens: SCAN_MAX_OUTPUT });
    expect(result).toMatchObject({ ok: true, model: FLASH, data: { items: [{ kind: 'maintenance' }], review: { status: 'corrected', readers: 3 } } });
  });

  it('Hydrogen coupée (finishReason MAX_TOKENS, réponse inutilisable) : repli sur la 3.8', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(response(invoice('maintenance')))
      .mockResolvedValueOnce(response(invoice('maintenance'), 'MAX_TOKENS')).mockResolvedValueOnce(response(invoice('maintenance')));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect([modelOf(2), modelOf(3)]).toEqual([HYDROGEN, FLASH]);
    expect(result.data).toMatchObject({ review: { readers: 3 } });
  });

  it('Hydrogen répond du texte qui n\'est pas une facture : repli sur la 3.8', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(response(invoice('maintenance')))
      .mockResolvedValueOnce(response({ pas: 'une facture' })).mockResolvedValueOnce(response(invoice('maintenance')));
    await scanInvoiceSafely('u', file, 'fake-test-key');
    expect([modelOf(2), modelOf(3)]).toEqual([HYDROGEN, FLASH]);
  });

  it('Hydrogen et la 3.8 échouent toutes deux : pas de cinquième appel, le résultat des deux Flash-Lite est rendu', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(response(invoice('maintenance')))
      .mockResolvedValueOnce(failure(503)).mockResolvedValueOnce(failure(503));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.ok).toBe(true);
    expect((result.data as any).review.readers).toBe(2);
  });

  it('une Flash-Lite manque : la 3ᵉ lecture est quand même Hydrogen (et la 3.8 seulement en repli)', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice())).mockResolvedValueOnce(failure(503)).mockResolvedValueOnce(response(invoice()));
    await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(modelOf(2)).toBe(HYDROGEN);
  });

  it('deux Flash-Lite d\'accord : aucune 3ᵉ lecture, donc aucun appel Hydrogen ni 3.8', async () => {
    fetchMock.mockResolvedValue(response(invoice()));
    await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect([modelOf(0), modelOf(1)]).toEqual([GEMINI_LITE_MODEL, GEMINI_LITE_MODEL]);
  });
});
