import { beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie k7-enregistrer, défaut 1 : « Le détail des lignes doit correspondre exactement au total TTC » refusait une commande dont le total imprimé est
 * arrondi à 5 centimes (D261b n'avait levé que la pastille). Pièce INVENTÉE : aucune valeur d'une vraie pièce. Drive et Firestore simulés.
 * Témoin : sur HEAD, les cas « enregistre » échouent (le refus est levé) et aucune ligne d'arrondi n'existe.
 */
const state = vi.hoisted(() => ({ transactions: [] as any[], stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[] }, writes: [] as any[] }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), addTransaction: (tx: any) => { state.writes.push(['transaction', tx]); state.transactions.push(tx); }, addStockItem: (type: string, item: any) => { state.writes.push(['stock', type, item]); }, addEquipment: () => undefined, updateTransaction: () => undefined } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined, adjustNumber: (...args: any[]) => state.writes.push(['adjust', ...args]), put: (...args: any[]) => state.writes.push(['put', ...args]) } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: (tx: any) => { state.writes.push(['transaction', tx]); } } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined }));
import * as entry from '../../../../src/services/purchaseEntry';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../../src/services/purchaseEntry';

const ligne = (id: string, amount: number, more: Partial<PurchaseLineDraft> = {}): PurchaseLineDraft => ({ id, description: `Article fictif ${id}`, kind: 'packaging', amount, unit: '', stockAction: 'none', equipmentAction: 'none', ...more });
let n = 0;
/** Deux lignes (100,10 + 70,11 = 170,21) : le total imprimé est fixé par chaque cas. */
const brouillon = (amount: number, lines: PurchaseLineDraft[] = [ligne('a', 100.10), ligne('b', 70.11)]): PurchaseDraft => ({ submissionId: `k7-arrondi-${String(++n).padStart(5, '0')}`, date: '09.09.2026', vendor: 'Boutique fictive', invoiceNumber: '1', description: 'Achat fictif', category: 'brassage', amount, lines, paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF' });
const ecrite = () => state.writes.find(w => w[0] === 'transaction')![1];
const somme = (tx: any) => tx.finance.lines.reduce((s: number, l: any) => s + l.amountCents, 0);
const refuse = (d: PurchaseDraft) => entry.validatePurchase(d, state.stocks as any, []).join(' ');
beforeEach(() => { state.transactions = []; state.writes = []; state.stocks = { rawMaterials: [], cleaning: [], equipment: [] }; });

describe('k7 — un total arrondi à 5 centimes s’enregistre, l’écart devient une ligne', () => {
  it('lignes 170,21, total imprimé 170,20 : enregistre ; une ligne « Arrondi à 5 centimes » de −0,01 (remise), somme des lignes = total', () => {
    const d = brouillon(170.20);
    expect(refuse(d)).toBe('');
    entry.savePurchase(d);
    const tx = ecrite();
    expect(tx.amountTTC).toBe(170.2);
    expect(tx.finance.amountCents).toBe(17020);
    expect(somme(tx)).toBe(17020);
    expect(tx.finance.lines).toHaveLength(3);
    expect(tx.finance.lines[2]).toMatchObject({ description: 'Arrondi à 5 centimes', kind: 'discount', amountCents: -1 });
    expect(tx.finance.lines[2].stockItemRef).toBeUndefined();
    expect(tx.finance.lines[2].equipmentRef).toBeUndefined();
  });

  it('lignes 124,48, total 124,50 : une ligne « autre » de +0,02', () => {
    const d = brouillon(124.50, [ligne('a', 100), ligne('b', 24.48)]);
    entry.savePurchase(d);
    const tx = ecrite();
    expect(tx.finance.lines[2]).toMatchObject({ description: 'Arrondi à 5 centimes', kind: 'other', amountCents: 2 });
    expect(somme(tx)).toBe(12450);
  });

  it('aucun mouvement de stock pour la ligne d’arrondi : seules les lignes de stock en écrivent', () => {
    const d = brouillon(170.20, [ligne('a', 100.10, { kind: 'ingredient', description: 'Produit fictif', quantity: 2, unit: 'kg', stockAction: 'new' }), ligne('b', 70.11)]);
    entry.savePurchase(d);
    expect(state.writes.filter(w => w[0] === 'stock')).toHaveLength(1);
    expect(state.writes.filter(w => w[0] === 'put' && w[3]?.type === 'receipt')).toHaveLength(1);
  });

  it('une somme exacte ne reçoit aucune ligne d’arrondi', () => {
    entry.savePurchase(brouillon(170.21));
    const tx = ecrite();
    expect(tx.finance.lines).toHaveLength(2);
    expect(somme(tx)).toBe(17021);
  });

  it('l’identifiant de la ligne d’arrondi ne heurte pas celui d’une ligne du brouillon', () => {
    entry.savePurchase(brouillon(170.20, [ligne('arrondi-5ct', 100.10, { description: 'Article fictif a' }), ligne('b', 70.11)]));
    const ids = ecrite().finance.lines.map((l: any) => l.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('une ligne d’arrondi déjà imprimée sur le document : rien n’est ajouté (somme exacte)', () => {
    const d = brouillon(170.20, [ligne('a', 100.10), ligne('b', 70.11), ligne('c', -0.01, { kind: 'discount', description: 'Rundung' })]);
    entry.savePurchase(d);
    expect(ecrite().finance.lines).toHaveLength(3);
    expect(somme(ecrite())).toBe(17020);
  });

  it('une ligne d’arrondi imprimée n’autorise pas un écart de plus : refusé', () => {
    const d = brouillon(170.20, [ligne('a', 100.11), ligne('b', 70.11), ligne('c', -0.01, { kind: 'discount', description: 'Arrondi' })]);
    expect(refuse(d)).toMatch(/Le détail des lignes doit correspondre exactement au total TTC/);
  });
});

describe('k7 — tout autre écart reste refusé, mot pour mot', () => {
  const MOT = 'Le détail des lignes doit correspondre exactement au total TTC.';
  it.each([
    ['170,22 pour 170,21 : pas un multiple de 5 centimes', 170.22],
    ['170,25 pour 170,21 : quatre centimes', 170.25],
    ['170,15 pour 170,21 : six centimes', 170.15],
    ['171,00 pour 170,21 : un franc', 171],
  ])('%s', (_nom, total) => {
    expect(refuse(brouillon(total))).toContain(MOT);
    expect(() => entry.savePurchase(brouillon(total))).toThrow(MOT);
  });
  it('multiple de 5 centimes qui n’est pas l’arrondi le plus proche (124,45 pour 124,48 : 3 centimes) : refusé', () => {
    expect(refuse(brouillon(124.45, [ligne('a', 100), ligne('b', 24.48)]))).toContain(MOT);
  });
  it('arrondi à 5 centimes dans l’autre sens du plus proche (124,55 pour 124,48) : refusé', () => {
    expect(refuse(brouillon(124.55, [ligne('a', 100), ligne('b', 24.48)]))).toContain(MOT);
  });
  it('rien n’est écrit après un refus', () => {
    expect(() => entry.savePurchase(brouillon(170.22))).toThrow();
    expect(state.writes).toEqual([]);
  });
});
