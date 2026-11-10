// p2 bloquant 1b (jeu en ligne 4) : la lecture serveur d'une dépense à deux pages. Deux tickets Sun Store (14,60 puis 149,25, « Total EFT 163,85 » imprimé sur les deux) : les deux Flash-Lite lisent les deux pages ;
// la 3.8, qui tranche seule (C★), rend la page 2 seule. Avant p2, rien dans le résultat (donc rien au cache) ne disait que deux lignes et 14,60 avaient été retirés. Fournisseur simulé : aucun appel réel.
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'document-hash' }) }));
import { logger } from '../../../functions/node_modules/firebase-functions';
import { scanInvoiceSafely } from '../../../functions/src/ai';
import { INVOICE_SCAN_PROMPTS } from '../../../functions/src/invoiceScanPrompts';

const fetchMock = vi.fn();
const page = (octet: number) => ({ mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, octet, 217]).toString('base64') });
const art = (name: string, amount: number, extra: Record<string, unknown> = {}) => ({ name, kind: 'other', quantity: 1, unit: 'pièce', price: amount, amountTTC: amount, ...extra });
const ticket = (items: any[], total: number, tva: number) => ({ vendor: 'Sun Store Fictive SA', currency: 'CHF', date: '05.11.2026', invoiceNumber: '', amountHT: null, tvaAmount: tva, amountTTC: total, tvaRate: null, items });
const PAGE1 = [art('Paracétamol 500 mg', 5.4), art('Ibuprofène 400 mg', 9.2)];
const PAGE2 = [art('Vaccin grippe 1 dose', 26.68), art('Prestation vaccination', 50), art('Vaccin covid 1 dose', 75.15), art('NoVatTax - 0%', -0.68, { kind: 'discount' }), art('NoVatTax - 0%', -1.9, { kind: 'discount' })];
const body = (data: any) => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 700, totalTokenCount: 1700 } });
const slot = (options: any) => ['l1', 'l2', 's3'][INVOICE_SCAN_PROMPTS.findIndex(p => JSON.parse(options.body).contents[0].parts[0].text.startsWith(p))];
const jouer = (plan: Record<string, any>) => fetchMock.mockImplementation(async (_url: string, options: any) => ({ ok: true, json: async () => body(plan[slot(options)]) }));
const lire = async () => (await scanInvoiceSafely('u', [page(1), page(2)], 'fake-test-key')) as any;
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); vi.spyOn(logger, 'info').mockImplementation(() => undefined); vi.spyOn(logger, 'warn').mockImplementation(() => undefined); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('p2 1b — ce que la 3.8 retire est écrit dans le résultat (donc dans le cache)', () => {
  it('lectures 1 et 2 : 7 lignes et 163,85 ; 3.8 : 5 lignes, 149,25, TVA 0 : les deux lignes de la page 1, le total et la TVA d’avant sont dans `retirees`', async () => {
    const deux = ticket([...PAGE1, ...PAGE2], 163.85, 0.37);
    /* la 3.8 n'est appelée que sur un désaccord : ici une quantité (le cas du jeu en ligne : la 3.8 a tranché seule). */
    jouer({ l1: deux, l2: { ...deux, items: deux.items.map((i, k) => (k === 2 ? { ...i, quantity: 2 } : i)) }, s3: ticket(PAGE2, 149.25, 0) });
    const { data } = await lire();
    expect(data.items).toHaveLength(5);
    expect(data.amountTTC).toBe(149.25);
    expect(data.retirees.lignes.map((x: any) => x.ligne.name)).toEqual(['Paracétamol 500 mg', 'Ibuprofène 400 mg']);
    expect(data.retirees.lignes.map((x: any) => x.ligne.amountTTC)).toEqual([5.4, 9.2]);
    expect(data.retirees.lignes.map((x: any) => x.rang)).toEqual([0, 1]);
    expect(data.retirees).toMatchObject({ amountTTC: 163.85, tvaAmount: 0.37 });
  });
  it('rien n’est retiré (la 3.8 confirme les lignes et les totaux, seule une quantité diffère) : aucun champ `retirees`', async () => {
    const deux = ticket([...PAGE1, ...PAGE2], 163.85, 0.37);
    jouer({ l1: deux, l2: { ...deux, items: deux.items.map((i, k) => (k === 0 ? { ...i, quantity: 2 } : i)) }, s3: deux });
    const { data } = await lire();
    expect(data.items).toHaveLength(7);
    expect(data.retirees).toBeUndefined();
  });
  it('deux lectures d’accord, aucune 3.8 : aucun champ `retirees`', async () => {
    const deux = ticket([...PAGE1, ...PAGE2], 163.85, 0.37);
    jouer({ l1: deux, l2: deux });
    const { data } = await lire();
    expect(data.retirees).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
