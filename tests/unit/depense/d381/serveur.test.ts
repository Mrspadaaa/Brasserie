// D380, D381 : la lecture d'un morceau côté serveur (`functions/src/ai.ts`), Gemini et le budget simulés.
// Le morceau est validé, sa consigne part dans le corps, le schéma demande `suite` d'abord, la clé de cache dépend de k/n.
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

const budget = vi.hoisted(() => ({ keys: [] as any[] }));
vi.mock('../../../../functions/src/invoiceScanBudget', () => ({
  runBudgetedInvoiceScan: async (_uid: any, key: any, work: any, provider: any) => { budget.keys.push(key); return { result: await work(provider), cached: false, documentHash: 'document-hash' }; }
}));
import * as ai from '../../../../functions/src/ai';
import { morceauNote } from '../../../../functions/src/invoiceMorceaux';

const { scanInvoiceSafely, morceauDeLecture } = ai as any;
const A = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217, 1, 7]).toString('base64') };
const lu = () => ({ vendor: '', currency: '', date: '', amountTTC: null, items: [{ suite: true, name: '', kind: 'stock', quantity: 1, unit: 'Stk', price: 2, amountTTC: 2 }, { suite: false, name: 'C', kind: 'stock', quantity: 1, unit: 'Stk', price: 3, amountTTC: 3 }] });
const reponse = (data: any) => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { totalTokenCount: 10 } }) });
const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); budget.keys = []; vi.stubGlobal('fetch', fetchMock); fetchMock.mockImplementation(async () => reponse(lu())); });
afterEach(() => vi.unstubAllGlobals());
const corps = () => fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body));

describe('morceauDeLecture : entiers, 1 ≤ k ≤ n ≤ 400', () => {
  it('accepte un rang valide, refuse le reste', () => {
    expect(morceauDeLecture(undefined)).toBeUndefined();
    expect(morceauDeLecture({ k: 2, n: 12 })).toEqual({ k: 2, n: 12 });
    for (const faux of [{ k: 0, n: 2 }, { k: 3, n: 2 }, { k: 1.5, n: 2 }, { k: 1, n: 401 }, { k: '1', n: 2 }, {}]) expect(() => morceauDeLecture(faux)).toThrow(/Morceau/);
  });
});

describe('la lecture d’un morceau', () => {
  it('envoie la consigne du morceau et le schéma à suite, garde la suite, clé propre à k/n', async () => {
    const r: any = await scanInvoiceSafely('u', A, 'clé-factice', undefined, undefined, { k: 2, n: 3 });
    expect(r.ok).toBe(true);
    for (const body of corps()) {
      expect(body.contents[0].parts[0].text).toContain(morceauNote(2, 3));
      const item = body.generationConfig.responseSchema.properties.items.items;
      expect(item.required[0]).toBe('suite');
      expect(Object.keys(item.properties)[0]).toBe('suite');
      expect(item.properties.suite).toEqual({ type: 'BOOLEAN' });
    }
    expect(r.data.items.map((i: any) => i.suite)).toEqual([true, undefined]);
    await scanInvoiceSafely('u', A, 'clé-factice', undefined, undefined, { k: 3, n: 3 });
    expect(budget.keys[0]).not.toEqual(budget.keys[1]);
    expect(budget.keys[0]).not.toEqual(A);
  });
  it('sans morceau : ni consigne de morceau ni suite (la lecture d’aujourd’hui)', async () => {
    await scanInvoiceSafely('u', A, 'clé-factice');
    for (const body of corps()) {
      expect(body.contents[0].parts[0].text).not.toContain('aucune ligne n’est sur deux parties');
      expect(body.generationConfig.responseSchema.properties.items.items.properties.suite).toBeUndefined();
    }
    expect(budget.keys[0]).toEqual(A);
  });
});
