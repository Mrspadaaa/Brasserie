import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'document-hash' }) }));
import { scanInvoiceSafely } from '../../functions/src/ai';
import { SCAN_MAX_OUTPUT, SCAN_MODEL } from '../../functions/src/invoiceScanCore';
import { GEMINI_LITE_MODEL } from '../../functions/src/models';
const fetchMock = vi.fn();
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const invoice = (kind = 'stock') => ({ vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber:'F-42', amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, tvaRate: .081, items: [{ name: 'Article', kind, quantity: 2, unit: 'pièce', price:54.05, amountTTC: 108.1 }] });
const response = (data: any, thoughts = false) => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [...(thoughts ? [{ thought:true, text:'Internal non-JSON reasoning' }] : []), { text: JSON.stringify(data) }] } }], usageMetadata: { totalTokenCount: 10 } }) });
const failure = (status:number) => ({ ok:false, status, json:async () => ({}) });
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());
// Voie fn-csv8 (D247) : la lecture est C★v8 (deux Flash-Lite, la 3.8 sur désaccord ou lecture manquante). Les tests de ce fichier qui décrivaient A
// (deux lectures 3.8, un vote à trois, aucune 3.8 quand une lecture manque) sont adaptés ; le détail des cas est dans invoiceScanCsv8.test.ts.
describe('Vision des justificatifs : fournisseur entièrement simulé', () => {
  it('lance deux lectures complètes parallèles, Flash-Lite haute résolution, sans web ni clé dans URL', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    fetchMock.mockImplementation(async () => { await gate; return response(invoice()); });
    const pending = scanInvoiceSafely('u', file, 'fake-test-key');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    release();
    const result = await pending;
    expect(result).toMatchObject({ ok:true, model:SCAN_MODEL, documentHash:'document-hash', data:{ review:{ status:'checked', readers:2 } } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, options] of fetchMock.mock.calls) {
      expect(url).toContain(`${GEMINI_LITE_MODEL}:generateContent`);
      expect(url).not.toContain('key=');
      expect(options.headers['x-goog-api-key']).toBe('fake-test-key');
      const body = JSON.parse(options.body);
      expect(body.tools).toBeUndefined();
      expect(body.contents[0].parts[1].inlineData).toEqual(file);
      expect(body.generationConfig).toMatchObject({ mediaResolution:'MEDIA_RESOLUTION_HIGH', thinkingConfig:{ thinkingLevel:'LOW' }, maxOutputTokens:8192 });
    }
  });
  it('corrige le préclassement matériel après une majorité indépendante de deux sur trois (la 3.8 est la troisième)', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(response(invoice('maintenance'))).mockResolvedValueOnce(response(invoice('maintenance')));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.data).toMatchObject({ items:[{ kind:'maintenance' }], review:{ status:'corrected', readers:3, correctedFields:['items.0.kind'] } });
    expect(fetchMock.mock.calls[2][0]).toContain(`${SCAN_MODEL}:generateContent`);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).generationConfig.maxOutputTokens).toBe(SCAN_MAX_OUTPUT);
    for (const [, options] of fetchMock.mock.calls.slice(1)) {
      const reviewer = JSON.parse(options.body);
      expect(reviewer.contents[0].parts[0].text).not.toContain('108.1');
      expect(reviewer.contents[0].parts[1].inlineData).toEqual(file);
    }
  });
  it('la 3.8 tranche avec sa valeur et le résultat reste en désaccord après trois lectures toutes différentes', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice())).mockResolvedValueOnce(response({ ...invoice(), amountTTC:118.1 })).mockResolvedValueOnce(response({ ...invoice(), amountTTC:128.1 }));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(result.data).toMatchObject({ amountTTC:128.1, review:{ status:'disputed', readers:3 } });
    expect((result.data as any).issues.join(' ')).toContain('Montant TTC');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('ne relance pas une lecture pour une devise étrangère identiquement transcrite', async () => {
    fetchMock.mockResolvedValue(response({ ...invoice(), currency:'EUR' }));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data).toMatchObject({ currency:'EUR', review:{ status:'disputed' } });
    expect((result.data as any).issues.join(' ')).toContain('réellement payé en CHF');
  });
  it('aucun retry après rejet des lectures par le fournisseur : deux Flash-Lite puis la 3.8 une seule fois, jamais une quatrième', async () => {
    fetchMock.mockResolvedValue(failure(429));
    await expect(scanInvoiceSafely('u', file, 'fake-test-key')).rejects.toThrow('429');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][0]).toContain(`${SCAN_MODEL}:generateContent`);
  });
  it('attend une sœur encore en cours après le rejet de la première, puis appelle la 3.8', async () => {
    let release!: (value:any) => void;
    fetchMock.mockResolvedValueOnce(failure(503)).mockImplementationOnce(() => new Promise(resolve => { release = resolve; })).mockResolvedValueOnce(response(invoice()));
    let finished = false;
    const pending = scanInvoiceSafely('u', file, 'fake-test-key').then(result => { finished = true; return result; });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(finished).toBe(false);
    release(response(invoice()));
    expect((await pending).data).toMatchObject({ amountTTC:108.1, review:{ status:'checked', readers:2 } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('une seconde lecture échouée appelle la 3.8, qui vote à deux avec la première', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(failure(503)).mockResolvedValueOnce(response(invoice('equipment')));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(result.data).toMatchObject({ items:[{ kind:'equipment' }], review:{ status:'checked', readers:2 } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('une seconde lecture échouée et la 3.8 aussi garde la première, sans quatrième appel', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(failure(503)).mockResolvedValueOnce(failure(503));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(result.data).toMatchObject({ review:{ status:'unavailable', readers:1 } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('un arbitrage échoué laisse les divergences explicites sans quatrième appel', async () => {
    fetchMock.mockResolvedValueOnce(response(invoice('equipment'))).mockResolvedValueOnce(response(invoice('maintenance'))).mockResolvedValueOnce(failure(503));
    const result = await scanInvoiceSafely('u', file, 'fake-test-key');
    expect(result.data).toMatchObject({ items:[{ kind:'equipment' }], review:{ status:'disputed', readers:2 } });
    expect((result.data as any).issues.join(' ')).toContain('complémentaire n’a pas abouti');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('ignore les pensées du modèle lors de la lecture du JSON', async () => {
    fetchMock.mockResolvedValue(response(invoice(), true));
    expect((await scanInvoiceSafely('u', file, 'fake-test-key')).data).toMatchObject({ review:{ status:'checked' } });
  });
  it('respecte le petit plafond de sortie du test réel', async () => {
    fetchMock.mockResolvedValue(response(invoice()));
    await scanInvoiceSafely('u', file, 'fake-test-key', { maxOutputTokens:2048 });
    expect(fetchMock.mock.calls.every(([, options]) => JSON.parse(options.body).generationConfig.maxOutputTokens === 2048)).toBe(true);
  });
  it('refuse un format non autorisé avant toute lecture', async () => {
    await expect(scanInvoiceSafely('u', { ...file, mimeType:'image/svg+xml' }, 'fake-test-key')).rejects.toThrow('Choisis');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
