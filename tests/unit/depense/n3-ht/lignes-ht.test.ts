import { describe, expect, it, vi } from 'vitest';
/**
 * Voie n3-ht (D304, D317) : une pièce aux lignes imprimées HORS TAXE se confirme. Les lignes passent au TTC au prorata (par groupe de TVA quand `vatCode` et `vat[]`
 * le permettent), dans `normalizeResult` : le provisoire du flux et le final y passent tous deux. Lectures INVENTÉES : aucune valeur d'une pièce du brasseur,
 * Gemini jamais appelé. Les témoins passent par l'API publique (`normalizeResult`, `invoiceFieldHints`, `validatePurchase`) : rouges sur l'arbre d'avant.
 */
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }) } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined, documentWriteState: () => ({ status: 'unknown' }), waitForDocument: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [], stageNewTransactionPayment: () => undefined } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined }));
import { GeminiScannerService, type ScannedInvoiceResult } from '../../../../src/services/geminiScanner';
import { invoiceFieldHints, invoiceTotalProposal } from '../../../../src/services/purchasePrefill';
import { validatePurchase, type PurchaseDraft, type PurchaseLineDraft } from '../../../../src/services/purchaseEntry';

const cts = (n: number | null | undefined) => Math.round((n ?? 0) * 100);
const somme = (r: ScannedInvoiceResult) => r.items.reduce((s, i) => s + cts(i.amountTTC), 0);
const ligneBrute = (n: number, name: string, quantity: number | null, price: number | null, amountTTC: number | null, vatCode?: string) =>
  ({ name, kind: 'packaging', reference: '', variant: '', quantity, unit: 'pce', price, amountTTC, stockCategory: '', evidence: '', ambiguity: '', ...(vatCode ? { vatCode } : {}), id: `x${n}` });
const controls = (base: 'TTC' | 'HT' | null, statut = 'ok') => ({ lines: { checked: 3, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut, base }, vat: { statut: 'ok', base }, totals: { statut: 'ok' } });
const brute = (items: any[], over: Record<string, unknown> = {}) => ({
  documentType: 'invoice', paymentEvidence: 'paid', vendor: 'Atelier Fictif SA', date: '02.11.2026', currency: 'CHF', invoiceNumber: 'HT-1', category: 'divers', description: 'Pièces fictives',
  amountHT: 100, tvaRate: 8.1, tvaAmount: 8.1, amountTTC: 108.1, items, issues: [], review: { status: 'checked', findings: [], readers: 2 }, controls: controls('HT'), ...over,
});
const trois = () => [ligneBrute(1, 'Pièce A', 2, 20, 40), ligneBrute(2, 'Pièce B', 1, 35, 35), ligneBrute(3, 'Pièce C', 5, 5, 25)];

describe('(a) un taux, trois lignes hors taxe : la somme est le TTC au centime', () => {
  it('passe au TTC, au prorata, le reste à la plus grande ligne', () => {
    const r = GeminiScannerService.normalizeResult(brute(trois()));
    expect(somme(r)).toBe(10810);
    expect(r.items.map(i => i.amountTTC)).toEqual([43.23, 37.84, 27.03]); // prorata arrondi : 43,24 ; 37,84 ; 27,03 (27,025) = 108,11, le centime en trop retiré à la plus grande ligne
    expect(r.amountHT).toBe(100); expect(r.amountTTC).toBe(108.1); // les totaux lus restent
  });
  it('le prix unitaire suit le même rapport que sa ligne', () => {
    const r = GeminiScannerService.normalizeResult(brute(trois()));
    expect(r.items[0].price).toBe(21.615); expect(r.items[1].price).toBe(37.84); expect(r.items[2].price).toBe(5.406);
  });
  it('un reste de centimes va à la plus grande ligne (3 lignes de 33,33 → TTC au centime)', () => {
    const r = GeminiScannerService.normalizeResult(brute([ligneBrute(1, 'A', 1, 33.33, 33.33), ligneBrute(2, 'B', 1, 33.33, 33.33), ligneBrute(3, 'C', 1, 33.34, 33.34)], { amountTTC: 108.1 }));
    expect(somme(r)).toBe(10810);
    expect(r.items.length).toBe(3);
  });
});

describe('(b) deux taux : chaque groupe est base + montant de sa rangée', () => {
  it('2,6 % et 8,1 % avec vatCode et vat[]', () => {
    const items = [ligneBrute(1, 'Livre', 1, 50, 50, 'A'), ligneBrute(2, 'Pièce', 2, 12.5, 25, 'B'), ligneBrute(3, 'Autre pièce', 1, 25, 25, 'B')];
    const vat = [{ code: 'A', rate: 2.6, base: 50, amount: 1.3 }, { code: 'B', rate: 8.1, base: 50, amount: 4.05 }];
    const r = GeminiScannerService.normalizeResult(brute(items, { vat, tvaRate: null, tvaAmount: 5.35, amountTTC: 105.35 }));
    const groupe = (code: string) => r.items.filter(i => i.vatCode === code).reduce((s, i) => s + cts(i.amountTTC), 0);
    expect(groupe('A')).toBe(5130);
    expect(groupe('B')).toBe(5405);
    expect(somme(r)).toBe(10535);
    expect(r.items[0].amountTTC).toBe(51.3);
  });
  it('une rangée qui ne retrouve pas la somme de son groupe : un seul rapport pour toutes les lignes', () => {
    const items = [ligneBrute(1, 'Livre', 1, 50, 50, 'A'), ligneBrute(2, 'Pièce', 1, 50, 50, 'B')];
    const vat = [{ code: 'A', rate: 2.6, base: 49, amount: 1.27 }, { code: 'B', rate: 8.1, base: 51, amount: 4.13 }];
    const r = GeminiScannerService.normalizeResult(brute(items, { vat, tvaRate: null, amountTTC: 105.4 }));
    expect(somme(r)).toBe(10540);
    expect(r.items.map(i => i.amountTTC)).toEqual([52.7, 52.7]);
  });
});

describe('(c) une remise suit le même rapport', () => {
  it('la remise reste négative, la somme est le TTC', () => {
    const items = [ligneBrute(1, 'Pièce A', 4, 25, 100), { ...ligneBrute(2, 'Remise', null, null, -10), kind: 'discount' }];
    const r = GeminiScannerService.normalizeResult(brute(items, { amountHT: 90, amountTTC: 97.29, tvaAmount: 7.29 }));
    expect(somme(r)).toBe(9729);
    expect(r.items[1].amountTTC).toBe(-10.81);
    expect(r.items[1].price).toBeNull();
  });
});

describe('(d) (e) (f) rien ne change quand la conversion n’est pas permise', () => {
  const identique = (raw: any) => {
    const r = GeminiScannerService.normalizeResult(raw);
    expect(r.items.map(i => i.amountTTC)).toEqual(raw.items.map((i: any) => i.amountTTC));
    expect(r.items.map(i => i.price)).toEqual(raw.items.map((i: any) => i.price));
    expect(invoiceFieldHints(r).amountTTC ?? '').not.toContain('hors taxe');
  };
  it('(d) base TTC', () => identique(brute(trois(), { controls: controls('TTC'), amountHT: 92.5, tvaAmount: 7.5, amountTTC: 100 })));
  it('(e) amountHT absent', () => identique(brute(trois(), { amountHT: null })));
  it('(e bis) amountTTC absent', () => identique(brute(trois(), { amountTTC: null })));
  it('(e ter) une ligne sans montant', () => identique(brute([...trois().slice(0, 2), ligneBrute(3, 'Pièce C', 5, 5, null)])));
  it('(e quater) la somme des lignes n’est pas le HT lu', () => identique(brute(trois(), { amountHT: 99 })));
  it('(f) devise EUR', () => identique(brute(trois(), { currency: 'EUR' })));
  it('rejouer la fonction sur son résultat ne convertit pas deux fois', () => {
    const une = GeminiScannerService.normalizeResult(brute(trois()));
    const deux = GeminiScannerService.normalizeResult({ ...une });
    expect(deux.items.map(i => i.amountTTC)).toEqual(une.items.map(i => i.amountTTC));
  });
});

/** Le brouillon, construit comme `applyOutcome` (ExpenseSheet.tsx:335 et :365) : montant de ligne = amountTTC, prix = price, total = `invoiceTotalProposal`. */
const brouillonDe = (result: ScannedInvoiceResult): PurchaseDraft => {
  const lines: PurchaseLineDraft[] = result.items.map(item => ({ id: item.id, description: item.name, kind: 'packaging', amount: result.currency === 'CHF' ? (item.amountTTC ?? undefined) : undefined, quantity: item.quantity ?? undefined, unit: item.unit, unitPrice: result.currency === 'CHF' ? (item.price ?? undefined) : undefined, stockAction: 'none', equipmentAction: 'none' } as PurchaseLineDraft));
  return { submissionId: 'n3-ht-00001', date: '02.11.2026', vendor: result.vendor, invoiceNumber: result.invoiceNumber, description: 'Achat fictif', category: 'divers', amount: invoiceTotalProposal(result).amount, lines, paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF' } as PurchaseDraft;
};

describe('(g) le brouillon passe validatePurchase sans l’erreur « total TTC »', () => {
  const erreurs = (d: PurchaseDraft) => validatePurchase(d, { rawMaterials: [], cleaning: [], equipment: [] } as any, []).join(' | ');
  it('lignes HT converties : aucune erreur de total', () => {
    const d = brouillonDe(GeminiScannerService.normalizeResult(brute(trois())));
    expect(d.amount).toBe(108.1);
    expect(erreurs(d)).not.toContain('total TTC');
  });
  it('contre-témoin : les mêmes lignes non converties (base TTC déclarée) sont refusées', () => {
    const d = brouillonDe(GeminiScannerService.normalizeResult(brute(trois(), { controls: controls('TTC') })));
    expect(erreurs(d)).toContain('total TTC');
  });
});

describe('(h) le provisoire du flux et le final donnent les mêmes montants', () => {
  it('deux lectures de la même pièce, passées chacune par normalizeResult', () => {
    const provisoire = GeminiScannerService.normalizeResult(brute(trois()));
    const final = GeminiScannerService.normalizeResult({ ...brute(trois()), provisoireJeton: 'j1' });
    expect(final.items.map(i => i.amountTTC)).toEqual(provisoire.items.map(i => i.amountTTC));
    expect(final.items.map(i => i.price)).toEqual(provisoire.items.map(i => i.price));
  });
});

describe('(i) l’indice de champ', () => {
  it('une phrase courte sur amountTTC quand la conversion a eu lieu', () => {
    expect(invoiceFieldHints(GeminiScannerService.normalizeResult(brute(trois()))).amountTTC).toBe('Lignes imprimées hors taxe, passées au TTC.');
  });
  it('un indice plus grave déjà posé n’est pas remplacé', () => {
    const r = GeminiScannerService.normalizeResult(brute(trois(), { review: { status: 'unavailable', findings: [], readers: 1 } }));
    expect(invoiceFieldHints(r).amountTTC).toBe('Vérification incomplète. Confirme ce montant sur le document.');
  });
  it('un avertissement du serveur sur le total reste celui qu’on lit', () => {
    const r = GeminiScannerService.normalizeResult(brute(trois(), { fieldWarnings: [{ field: 'amountTTC', message: 'Total à vérifier.' }] }));
    expect(invoiceFieldHints(r).amountTTC).toBe('Total à vérifier.');
  });
});
