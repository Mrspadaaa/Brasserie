// Voie fn-montant-seul (mission 2026-11-01-bascule-lecture) : une ligne qui n'a qu'UN montant, lu en `price` (sans quantité, ou à quantité 1),
// garde ce montant en `amountTTC`. Pièce fictive du 01.11 : 7 lignes, un montant chacune, total 110,40. Avant la règle, la 3.8 rangeait
// chaque montant en `price` seul : « TTC — » sur chaque ligne, « Somme des lignes non vérifiée ». Ces tests ont été écrits AVANT le code (L13).
// Gemini entièrement simulé : aucun appel réel.
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'document-hash' }) }));
import { logger } from '../../functions/node_modules/firebase-functions';
import { scanInvoiceSafely } from '../../functions/src/ai';
import { normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { INVOICE_SCAN_PROMPTS } from '../../functions/src/invoiceScanPrompts';

const MONTANTS = [52.5, 3.75, 18, 6.4, 9.8, 9.2, 10.75];
const NOMS = ['Ligne A', 'Ligne B', 'Ligne C', 'Ligne D', 'Ligne E', 'Ligne F', 'Ligne G'];
const base = (items: any[], extra: Record<string, unknown> = {}) => ({ vendor: 'Fournisseur fictif', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-1', amountHT: null, tvaAmount: null, amountTTC: 110.4, items, ...extra });
/** Ce que fait la 3.8 le 01.11 : chaque montant en `price`, ni quantité ni montant de ligne. */
const prixSeul = () => base(MONTANTS.map((price, i) => ({ name: NOMS[i], kind: 'other', quantity: null, unit: '', price, amountTTC: null })));
/** Ce que lisent les Flash-Lite : le montant dans `amountTTC`. */
const montantLu = (extra: (i: number) => Record<string, unknown> = () => ({})) => base(MONTANTS.map((m, i) => ({ name: NOMS[i], kind: 'other', quantity: null, unit: '', price: null, amountTTC: m, ...extra(i) })));

describe('fn-montant-seul — normalizeInvoiceScan d\'une lecture', () => {
  it('sept lignes à `price` seul : amountTTC = price, quantité vide, price gardé, somme vérifiée à 110,40', () => {
    const r = normalizeInvoiceScan(prixSeul());
    expect(r.items.map(item => item.amountTTC)).toEqual(MONTANTS);
    expect(r.items.map(item => item.price)).toEqual(MONTANTS);
    expect(r.items.every(item => item.quantity === null)).toBe(true);
    expect(r.controls.sum).toEqual({ statut: 'ok', base: 'TTC' });
    expect(r.points.some(p => p.code === 'somme-incomplete' || p.code === 'somme-ecart')).toBe(false);
  });
  it('quantité 1 sans amountTTC : amountTTC = price, la quantité reste 1', () => {
    const r = normalizeInvoiceScan(base([{ name: 'Port', kind: 'shipping', quantity: 1, unit: 'pièce', price: 12.5, amountTTC: null }], { amountTTC: 12.5 }));
    expect(r.items[0]).toMatchObject({ quantity: 1, price: 12.5, amountTTC: 12.5 });
    expect(r.controls.lines).toMatchObject({ checked: 1, failed: 0 });
    expect(r.controls.sum.statut).toBe('ok');
  });
  it('quantité 3 sans amountTTC : inchangée (jamais de multiplication)', () => {
    const r = normalizeInvoiceScan(base([{ name: 'Malt', kind: 'stock', quantity: 3, unit: 'kg', price: 10, amountTTC: null }], { amountTTC: 30 }));
    expect(r.items[0]).toMatchObject({ quantity: 3, price: 10, amountTTC: null });
    expect(r.controls.sum.statut).toBe('incomplet');
  });
  it('quantité 0,5 ou 2 sans amountTTC : inchangée', () => {
    for (const quantity of [0.5, 2]) {
      const r = normalizeInvoiceScan(base([{ name: 'Article', kind: 'stock', quantity, unit: 'kg', price: 10, amountTTC: null }]));
      expect(r.items[0].amountTTC).toBeNull();
    }
  });
  it('un amountTTC déjà lu n\'est jamais touché, même s\'il diffère du price (quantité vide, 1 ou 3)', () => {
    for (const quantity of [null, 1, 3]) {
      const r = normalizeInvoiceScan(base([{ name: 'Article', kind: 'stock', quantity, unit: 'pièce', price: 10, amountTTC: 27 }]));
      expect(r.items[0]).toMatchObject({ quantity, price: 10, amountTTC: 27 });
    }
  });
  it('sans price (null, texte, NaN, infini) : amountTTC reste vide, aucune valeur inventée', () => {
    for (const price of [null, undefined, '12', NaN, Infinity]) {
      const r = normalizeInvoiceScan(base([{ name: 'Article', kind: 'other', quantity: null, unit: '', price, amountTTC: null }]));
      expect(r.items[0].amountTTC).toBeNull();
      expect(r.items[0].price).toBeNull();
    }
  });
  it('une remise (montant négatif) à price seul garde son signe', () => {
    const r = normalizeInvoiceScan(base([{ name: 'Rabais', kind: 'discount', quantity: null, unit: '', price: -2, amountTTC: null }]));
    expect(r.items[0]).toMatchObject({ price: -2, amountTTC: -2 });
  });
  it('une ligne touchée ne change que son amountTTC : le reste de la ligne est celui de la lecture', () => {
    const lu = { name: 'Frais', kind: 'service', quantity: null, unit: '', price: 7.5, amountTTC: null, reference: 'R1', variant: 'v', vatCode: 'A', ambiguity: 'doute' };
    const avec = normalizeInvoiceScan(base([lu])).items[0];
    const sans = normalizeInvoiceScan(base([{ ...lu, amountTTC: 7.5 }])).items[0];
    expect(avec).toEqual(sans);
    expect(avec).toMatchObject({ reference: 'R1', variant: 'v', vatCode: 'A', ambiguity: 'doute', quantity: null });
  });
  it('les contrôles existants disent l\'écart : montants en price seul qui ne totalisent pas le total imprimé', () => {
    const r = normalizeInvoiceScan({ ...prixSeul(), amountTTC: 120 });
    expect(r.controls.sum.statut).toBe('ecart');
    expect(r.points.some(p => p.code === 'somme-ecart')).toBe(true);
  });
  it('une ligne mélange : les lignes à price seul sont complétées, celle à quantité 3 reste incomplète, la somme est dite « incomplet »', () => {
    const r = normalizeInvoiceScan(base([{ name: 'A', kind: 'other', quantity: null, unit: '', price: 5, amountTTC: null }, { name: 'B', kind: 'stock', quantity: 3, unit: 'kg', price: 10, amountTTC: null }], { amountTTC: 35 }));
    expect(r.items.map(item => item.amountTTC)).toEqual([5, null]);
    expect(r.controls.sum.statut).toBe('incomplet');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Chemin complet : `scanInvoiceSafely` (C★v8 + N), fetch simulé, aiguillé par la consigne (1, 2 : Flash-Lite ; 3 : la 3.8).
// ---------------------------------------------------------------------------------------------------------------------
const fetchMock = vi.fn();
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const body = (data: any) => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 700, thoughtsTokenCount: 50, totalTokenCount: 1750 } });
const slot = (options: any) => ['l1', 'l2', 's3'][INVOICE_SCAN_PROMPTS.indexOf(JSON.parse(options.body).contents[0].parts[0].text)];
function jouer(plan: Partial<Record<'l1' | 'l2' | 's3', any>>) {
  fetchMock.mockImplementation(async (_url: string, options: any) => {
    const answer = plan[slot(options) as 'l1'];
    if (answer === undefined) throw new Error(`appel imprévu : ${slot(options)}`);
    return { ok: true, json: async () => body(answer) };
  });
}
const lire = async () => (await scanInvoiceSafely('u', file, 'fake-test-key')) as any;
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); vi.spyOn(logger, 'info').mockImplementation(() => undefined); vi.spyOn(logger, 'warn').mockImplementation(() => undefined); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('fn-montant-seul — lireCsv8 simulé : la 3.8 qui tranche lit `price` seul', () => {
  it('deux Flash-Lite lisent amountTTC (elles divergent sur une unité), la 3.8 lit price seul : sept amountTTC finals, somme vérifiée', async () => {
    jouer({ l1: montantLu(), l2: montantLu(i => (i === 2 ? { unit: 'kg' } : {})), s3: prixSeul() });
    const { data } = await lire();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(data.items).toHaveLength(7);
    expect(data.items.map((item: any) => item.amountTTC)).toEqual(MONTANTS);
    expect(data.items.every((item: any) => item.quantity === null)).toBe(true);
    expect(data.controls.sum).toEqual({ statut: 'ok', base: 'TTC' });
    expect(data.controls.sum.statut).not.toBe('incomplet');
    expect(data.points.some((p: any) => p.code === 'somme-incomplete' || p.code === 'somme-ecart')).toBe(false);
  });
  it('la 3.8 qui tranche seule en price seul (les deux Flash-Lite lisent aussi price seul et divergent sur une unité) : sept amountTTC, somme vérifiée', async () => {
    const lite = (unit: string) => ({ ...prixSeul(), items: prixSeul().items.map((item, i) => (i === 2 ? { ...item, unit } : item)) });
    jouer({ l1: lite(''), l2: lite('kg'), s3: prixSeul() });
    const { data } = await lire();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(data.items.map((item: any) => item.amountTTC)).toEqual(MONTANTS);
    expect(data.controls.sum.statut).toBe('ok');
  });
  it('trois lectures à price seul qui s\'accordent : plus de 3.8 appelée, sept amountTTC', async () => {
    jouer({ l1: prixSeul(), l2: prixSeul(), s3: prixSeul() });
    const { data } = await lire();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data.items.map((item: any) => item.amountTTC)).toEqual(MONTANTS);
    expect(data.controls.sum.statut).toBe('ok');
  });
  it('une Flash-Lite lit amountTTC, l\'autre price seul : elles s\'accordent désormais, la 3.8 n\'est pas appelée', async () => {
    jouer({ l1: montantLu(), l2: prixSeul() });
    const { data } = await lire();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data.items.map((item: any) => item.amountTTC)).toEqual(MONTANTS);
  });
  it('une ligne à quantité 3 sans amountTTC reste incomplète de bout en bout : somme « incomplet »', async () => {
    const mixte = base([{ name: 'A', kind: 'other', quantity: null, unit: '', price: 5, amountTTC: null }, { name: 'B', kind: 'stock', quantity: 3, unit: 'kg', price: 10, amountTTC: null }], { amountTTC: 35 });
    jouer({ l1: mixte, l2: mixte });
    const { data } = await lire();
    expect(data.items.map((item: any) => item.amountTTC)).toEqual([5, null]);
    expect(data.controls.sum.statut).toBe('incomplet');
  });
});
