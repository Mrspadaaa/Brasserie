// LE4 — une ligne de journal par lecture ; une lecture coupée se dit telle quelle (statut unavailable honnête), jamais « vérifiée ».
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'document-hash' }) }));
import { logger } from '../../../../functions/node_modules/firebase-functions';
import { scanInvoiceSafely } from '../../../../functions/src/ai';
import { ligneJournalLecture, ScanReadCutError } from '../../../../functions/src/invoiceVisionReview';
import { entete, ligne } from '../lecture/aide';

const fetchMock = vi.fn();
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const facture = (patch: Record<string, unknown> = {}) => entete({ amountTTC: 5, items: [ligne({ name: 'Malt fictif', reference: 'MA1', quantity: 2, unit: 'kg', price: 2.5, amountTTC: 5 })], ...patch });
const reponse = (data: any, finishReason = 'STOP', usage: any = { promptTokenCount: 1000, candidatesTokenCount: 700, thoughtsTokenCount: 50, totalTokenCount: 1750 }) =>
  ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text: finishReason === 'STOP' ? JSON.stringify(data) : '{"items":[' }] } }], usageMetadata: usage }) });
const abandon = () => Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
let info: any, warn: any;
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); info = vi.spyOn(logger, 'info').mockImplementation(() => undefined); warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('LE4 — le journal d\'une lecture', () => {
  it('ligneJournalLecture : durée, jetons, finishReason, coupée ou non ; null quand une valeur manque', () => {
    const response = { candidates: [{ finishReason: 'MAX_TOKENS' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, totalTokenCount: 35 } };
    expect(ligneJournalLecture({ lecture: 2, etape: 'parallele', elapsedMs: 8123, response })).toEqual({
      lecture: 2, etape: 'parallele', elapsedMs: 8123, promptTokens: 10, outputTokens: 20, thoughtsTokens: null, totalTokens: 35, finishReason: 'MAX_TOKENS', coupee: true,
    });
    expect(ligneJournalLecture({ lecture: 1, etape: 'parallele', elapsedMs: 1, response: {} })).toMatchObject({ promptTokens: null, outputTokens: null, finishReason: null, coupee: false });
    expect(ligneJournalLecture({ lecture: 3, etape: 'troisieme', elapsedMs: 5, response: { candidates: [{ finishReason: 'STOP' }] } }).coupee).toBe(false);
  });

  it('scanInvoiceSafely journalise une ligne par lecture (deux, puis trois)', async () => {
    fetchMock.mockResolvedValue(reponse(facture()));
    await scanInvoiceSafely('u', file, 'fake-test-key');
    const lignes = info.mock.calls.filter((c: any[]) => c[0] === 'Lecture de facture').map((c: any[]) => c[1]);
    expect(lignes.map((l: any) => l.lecture).sort()).toEqual([1, 2]);
    expect(lignes[0]).toMatchObject({ finishReason: 'STOP', coupee: false, totalTokens: 1750, etape: 'parallele' });
    fetchMock.mockReset(); info.mockClear();
    fetchMock.mockResolvedValueOnce(reponse(facture())).mockResolvedValueOnce(reponse(facture({ date: '10.09.2026' }))).mockResolvedValueOnce(reponse(facture()));
    await scanInvoiceSafely('u', file, 'fake-test-key');
    const trois = info.mock.calls.filter((c: any[]) => c[0] === 'Lecture de facture').map((c: any[]) => c[1]);
    expect(trois.map((l: any) => l.lecture).sort()).toEqual([1, 2, 3]);
    expect(trois.find((l: any) => l.lecture === 3).etape).toBe('troisieme');
  });
});

describe('LE4 — une lecture coupée est dite telle quelle', () => {
  it('une lecture sur deux coupée (limite de sortie) : unavailable, readers 1, phrase et point lecture-coupee', async () => {
    fetchMock.mockResolvedValueOnce(reponse(facture(), 'MAX_TOKENS')).mockResolvedValueOnce(reponse(facture()));
    const { data } = await scanInvoiceSafely('u', file, 'fake-test-key') as any;
    expect(data.review.status).toBe('unavailable');
    expect(data.review.readers).toBe(1);
    expect(data.issues.join(' ')).toMatch(/coupée/);
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'sortie', pese: true });
    expect(info.mock.calls.some((c: any[]) => c[1]?.coupee === true && c[1]?.finishReason === 'MAX_TOKENS')).toBe(true);
  });

  it('une lecture arrêtée par le délai (AbortError) : cause « delai »', async () => {
    fetchMock.mockRejectedValueOnce(abandon()).mockResolvedValueOnce(reponse(facture()));
    const { data } = await scanInvoiceSafely('u', file, 'fake-test-key') as any;
    expect(data.review.status).toBe('unavailable');
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'delai' });
    expect(data.issues.join(' ')).toMatch(/délai/);
    expect(warn.mock.calls.some((c: any[]) => c[0] === 'Lecture de facture en échec' && c[1].cause === 'delai')).toBe(true);
  });

  it('les deux lectures coupées : l\'erreur existante remonte', async () => {
    fetchMock.mockResolvedValue(reponse(facture(), 'MAX_TOKENS'));
    await expect(scanInvoiceSafely('u', file, 'fake-test-key')).rejects.toThrow('Lecture incomplète');
  });

  it('la troisième lecture coupée : disputed, phrase existante conservée, point lecture-coupee', async () => {
    fetchMock.mockResolvedValueOnce(reponse(facture())).mockResolvedValueOnce(reponse(facture({ date: '10.09.2026' }))).mockResolvedValueOnce(reponse(facture(), 'MAX_TOKENS'));
    const { data } = await scanInvoiceSafely('u', file, 'fake-test-key') as any;
    expect(data.review.status).toBe('disputed');
    expect(data.issues.join(' ')).toContain('contrôle complémentaire n’a pas abouti');
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'sortie' });
  });

  it('délai global atteint : la troisième lecture est sautée AVEC phrase et point, statut disputed', async () => {
    const reelle = AbortSignal.timeout.bind(AbortSignal);
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => (ms === 100_000 ? AbortSignal.abort() : reelle(ms)));
    fetchMock.mockResolvedValueOnce(reponse(facture())).mockResolvedValueOnce(reponse(facture({ date: '10.09.2026' })));
    const { data } = await scanInvoiceSafely('u', file, 'fake-test-key') as any;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data.review.status).toBe('disputed');
    expect(data.points.find((p: any) => p.code === 'lecture-coupee')).toMatchObject({ luTexte: 'delai-saute' });
    expect(data.issues.join(' ')).toContain('contrôle complémentaire n’a pas abouti');
  });

  it('ScanReadCutError garde le message d\'avant et le finishReason', () => {
    const e = new ScanReadCutError('MAX_TOKENS');
    expect(e.message).toBe('Lecture incomplète. Complète le justificatif manuellement.');
    expect(e.finishReason).toBe('MAX_TOKENS');
    expect(e).toBeInstanceOf(Error);
  });
});
