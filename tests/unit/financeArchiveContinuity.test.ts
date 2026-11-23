import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FinanceTransaction, FinancialClosing, FinancialPayment, FinancialProfile } from '../../src/domain/finance/types';
import type { Recipe, StockItem } from '../../src/types';
import { archiveIndex, isTransactionArchived } from '../../src/domain/finance/archive';
import { FinancialArchiveService } from '../../src/services/financialArchiveService';
import { StorageService } from '../../src/services/storage';
import { FinanceService, validateRefundTransaction } from '../../src/services/financeService';
import { purchaseDuplicates } from '../../src/services/purchaseEntry';
import { paymentState, refundLinkIssue, summarizeLedger } from '../../src/domain/finance/ledger';
import { buildForecast } from '../../src/domain/finance/forecast';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { estimateBrewBudget, latestBrewPrices, type BrewBudgetSettings } from '../../src/domain/finance/brewBudget';

const memory = vi.hoisted(() => {
  const collections = new Map<string, Map<string, any>>();
  const all = (name: string) => [...(collections.get(name)?.values() ?? [])].map(value => structuredClone(value));
  const put = vi.fn((name: string, id: string, data: any, options?: { merge?: boolean }) => {
    if (!collections.has(name)) collections.set(name, new Map());
    collections.get(name)!.set(id, structuredClone({ ...(options?.merge ? collections.get(name)!.get(id) : {}), ...data }));
  });
  return { collections, all, put, remove: vi.fn(), syncSession: () => 1,
    find: (name: string, id: string) => all(name).find(value => value.id === id),
    adjustNumber: (name: string, id: string, field: string, delta: number, extra: Record<string, unknown> = {}) => {
      const old = collections.get(name)?.get(id);
      put(name, id, { ...extra, [field]: (old?.[field] ?? 0) + delta }, { merge: true });
    },
    waitForDocument: vi.fn(async (name: string, id: string, _timeout?: number, identity?: (value: any) => boolean) => {
      const value = collections.get(name)?.get(id);
      if (!value || identity && !identity(value)) throw Error('Document différent');
      return structuredClone(value);
    })
  };
});
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: memory, ALL_COLLECTIONS: [] }));

const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2025-01-01', amountCents: 100_000, confirmed: true } };
const expense = (id = 'TX-2025', amountCents = 10_000, date = '01.12.2025'): FinanceTransaction => ({
  id, date, description: 'Sac de malt Pilsner', category: 'brassage', subcategory: 'Malt', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents, vendor: 'Malterie', invoiceNumber: id, paymentStatus: 'unpaid', dueDate: '2026-06-15', recordedAt: '2025-12-01T10:00:00Z', proofDocumentId: `PROOF-${id}`, lines: [{ id: 'malt', kind: 'ingredient', description: 'Pilsner', amountCents, stockItemRef: 'MP-PILS', quantity: 25, unit: 'kg' }] }
});
const payment = (transactionId: string, amountCents = 4000): FinancialPayment => ({ id: `PAY-${transactionId}`, transactionId, amountCents, date: '2025-12-15', direction: 'out', method: 'bank', recordedAt: '2025-12-15T10:00:00Z' });
const closing = (year: number): FinancialClosing => ({ id: `C-${year}`, year, createdAt: '2026-06-01T12:00:00Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [] });
const seed = (transactions: FinanceTransaction[], payments: FinancialPayment[] = []) => {
  transactions.forEach(tx => memory.put('transactions', tx.id, tx));
  payments.forEach(p => memory.put('financialPayments', p.id, p));
  memory.put.mockClear();
};
const visible = () => {
  const index = archiveIndex(FinancialArchiveService.getArchives());
  return StorageService.getTransactions().filter(tx => !isTransactionArchived(tx, index));
};

beforeEach(() => {
  memory.collections.clear(); memory.put.mockClear(); memory.remove.mockClear(); memory.waitForDocument.mockClear();
  vi.spyOn(StorageService, 'getCurrentUser').mockReturnValue('Gaëtan');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('Les archives rangent le journal sans retirer son historique financier', () => {
  it('conserve exactement les pièces, paiements, trésorerie et dettes avant archivage puis restauration', async () => {
    const tx = expense(), paid = payment(tx.id);
    seed([tx], [paid]);
    const originalTransactions = StorageService.getTransactions(), originalPayments = FinanceService.getPayments();
    const before = summarizeLedger(originalTransactions, originalPayments, profile, '2026-06-01');
    await FinancialArchiveService.setYearArchived(2025, true);
    expect(visible()).toEqual([]);
    expect(StorageService.getTransactions()).toEqual(originalTransactions);
    expect(FinanceService.getPayments()).toEqual(originalPayments);
    const after = summarizeLedger(StorageService.getTransactions(), FinanceService.getPayments(), profile, '2026-06-01');
    expect(after).toEqual(before);
    expect(after.cashCents).toBe(96_000);
    expect(after.payablesCents).toBe(6000);
    expect(memory.put.mock.calls.every(([collection]) => ['financialArchives', 'auditLogs'].includes(collection))).toBe(true);
    expect(memory.remove).not.toHaveBeenCalled();
    await FinancialArchiveService.setYearArchived(2025, false);
    expect(visible().map(row => row.id)).toEqual([tx.id]);
    expect(StorageService.getTransactions()).toEqual(originalTransactions);
  });

  it('une facture archivée reste à payer et figure toujours dans la prévision', async () => {
    const tx = expense(); seed([tx], [payment(tx.id)]);
    const input = () => ({ transactions: StorageService.getTransactions(), payments: FinanceService.getPayments(), profile, plans: [], asOf: '2026-06-01', months: 2 });
    const before = buildForecast(input());
    await FinancialArchiveService.setYearArchived(2025, true);
    const after = buildForecast(input());
    expect(after).toEqual(before);
    expect(after.items).toContainEqual(expect.objectContaining({ id: `invoice:${tx.id}`, date: '2026-06-15', amountCents: 6000, source: 'invoice' }));
    expect(after.months[0].balanceCents).toBe(90_000);
    const historical = { ...tx, finance: { ...tx.finance!, paymentStatus: 'unknown' as const } };
    expect(isTransactionArchived(historical, archiveIndex(FinancialArchiveService.getArchives()))).toBe(true);
    expect(paymentState(historical, [], [historical]).state).toBe('unknown');
  });

  it('retrouve un justificatif archivé lors de la détection des achats en double', async () => {
    const tx = expense(); seed([tx]);
    await FinancialArchiveService.setYearArchived(2025, true);
    expect(purchaseDuplicates({ submissionId: 'NEW-RECEIPT-2026', date: tx.date, vendor: 'Malterie', invoiceNumber: tx.id, description: 'Même facture scannée', category: 'brassage', amount: 100, lines: [], paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '' }, StorageService.getTransactions()).map(row => row.id)).toEqual([tx.id]);
  });

  it('conserve le rapport annuel, ses justificatifs et son résultat calculé sur les mêmes pièces', async () => {
    const tx = expense(); seed([tx], [payment(tx.id)]);
    const report = () => buildAnnualReport({ year: 2025, transactions: StorageService.getTransactions(), payments: FinanceService.getPayments(), assets: [], profile, closing: closing(2025), generatedAt: '2026-06-01T12:00:00Z' });
    const before = report();
    await FinancialArchiveService.setYearArchived(2025, true);
    expect(report()).toEqual(before);
    expect(report().resultCents).toBe(-10_000);
    expect(report().paidCents).toBe(4000);
    expect(report().documents[0]).toMatchObject({ id: tx.id, proofDocumentId: `PROOF-${tx.id}` });
  });

  it('un avoir courant garde le lien avec son achat archivé et réduit la dette sans inventer un paiement', async () => {
    const tx = expense(); seed([tx]);
    await FinancialArchiveService.setYearArchived(2025, true);
    const refund = expense('AVOIR-2026', 2000, '01.06.2026');
    refund.finance = { ...refund.finance!, kind: 'refund', refundOfId: tx.id, refundDirection: 'in', refundApplication: 'offset', recordedAt: '2026-06-01T12:00:00Z' };
    expect(() => validateRefundTransaction(refund, StorageService.getTransactions(), [])).not.toThrow();
    memory.put('transactions', refund.id, refund);
    const transactions = StorageService.getTransactions();
    expect(visible().map(row => row.id)).toEqual([refund.id]);
    expect(refundLinkIssue(refund, transactions)).toBeNull();
    const state = paymentState(transactions.find(row => row.id === tx.id)!, [], transactions);
    expect(state).toMatchObject({ appliedCreditCents: 2000, remainingCents: 8000 });
    expect(summarizeLedger(transactions, [], profile, '2026-06-01').cashCents).toBe(100_000);
    const report = buildAnnualReport({ year: 2026, transactions, payments: [], assets: [], profile, closing: closing(2026) });
    expect(report.operatingExpensesCents).toBe(-2000);
    expect(report.resultCents).toBe(2000);
  });

  it('autorise une contre-écriture de paiement de la pièce archivée par son identifiant stable', async () => {
    const tx = expense(), paid = payment(tx.id);
    seed([{ ...tx, settlementBalanceCents: paid.amountCents, lastPaymentId: paid.id }], [paid]);
    await FinancialArchiveService.setYearArchived(2025, true);
    FinanceService.recordPayment({ ...paid, id: `CONTRE-${paid.id}`, reversalOfId: paid.id, direction: 'in', recordedAt: '2026-06-01T12:00:00Z' });
    const transactions = StorageService.getTransactions(), payments = FinanceService.getPayments();
    expect(transactions.find(row => row.id === tx.id)?.finance?.proofDocumentId).toBe(`PROOF-${tx.id}`);
    expect(payments).toHaveLength(2);
    expect(paymentState(transactions[0], payments, transactions)).toMatchObject({ paidCents: 0, remainingCents: 10_000, state: 'unpaid' });
    expect(summarizeLedger(transactions, payments, profile, '2026-06-01').cashCents).toBe(100_000);
    expect(visible()).toEqual([]);
  });

  it('conserve les factures archivées comme prix documentés et valeur du stock pour le prochain brassin', async () => {
    seed([expense('OLD-PRICE', 10_000, '01.10.2025'), expense('LATEST-PRICE', 5000, '01.12.2025')]);
    const recipe = { id: 'R', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, fermentables: [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'sèche' } } as Recipe;
    const stock = { id: 'MP-PILS', ref: 'MP-PILS', name: 'Pilsner', unit: 'kg', currentStock: 2, category: 'Malt', minStock: 0, reorder: false } as StockItem;
    const settings: BrewBudgetSettings = { costs: { energy: { enabled: false }, cleaning: { enabled: false }, packaging: { enabled: false }, beerTax: { enabled: false } }, includeFixed: false, includeDepreciation: false };
    const budget = () => estimateBrewBudget({ recipe, stockItems: [stock], batches: [], brewDate: '15.06.2026', settings, transactions: StorageService.getTransactions(), now: '2026-06-01T12:00:00Z' });
    const before = budget();
    await FinancialArchiveService.setYearArchived(2025, true);
    expect(visible()).toEqual([]);
    expect(budget()).toEqual(before);
    expect(budget()).toMatchObject({ complete: true, ingredientsCost: 12, purchasesTTC: 6 });
    expect(latestBrewPrices(StorageService.getTransactions())['MP-PILS']).toMatchObject({ amount: 50, quantity: 25, note: 'Malterie · LATEST-PRICE' });
  });

  it('la nouvelle facture antidatée reste courante jusqu’au prochain archivage explicite', async () => {
    const original = expense(); seed([original]);
    await FinancialArchiveService.setYearArchived(2025, true);
    const late = expense('RETRO-NEW', 3000, '15.11.2025');
    late.finance!.recordedAt = '2026-06-02T12:00:00Z';
    memory.put('transactions', late.id, late);
    expect(visible().map(row => row.id)).toEqual([late.id]);
    const invalidTimestamp = { ...late, id: 'NEEDS-REVIEW', finance: { ...late.finance!, recordedAt: 'invalide' } };
    const invalidDate = { ...original, id: 'INVALID-DATE', date: '31.02.2025' };
    const index = archiveIndex(FinancialArchiveService.getArchives());
    expect(isTransactionArchived(invalidTimestamp, index)).toBe(false);
    expect(isTransactionArchived(invalidDate, index)).toBe(false);
    vi.setSystemTime(new Date('2026-06-03T12:00:00Z'));
    await FinancialArchiveService.setYearArchived(2025, true);
    expect(visible()).toEqual([]);
    expect(StorageService.getTransactions().map(row => row.id)).toEqual([original.id, late.id]);
  });
});
