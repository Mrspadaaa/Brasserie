import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FinanceTransaction, FinancialAsset, FinancialPayment } from '../../src/domain/finance/types';
const state = vi.hoisted(() => ({ collections: new Map<string, any[]>(), transactions: [] as any[], writes: [] as any[] }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => state.collections.get(name) ?? [],
  put: (name: string, id: string, value: any) => {
    state.writes.push([name, id, value]);
    state.collections.set(name, [...(state.collections.get(name) ?? []).filter(p => p.id !== id), value]);
  },
  adjustNumber: (name: string, id: string, field: string, delta: number, extra: any) => {
    state.writes.push([name, id, { increment: delta, ...extra }]);
    const current = state.transactions.find(t => t.id === id);
    if (current) Object.assign(current, { [field]: (current[field] ?? 0) + delta, ...extra });
  }
} }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => state.transactions, addTransaction: (tx: any) => { state.transactions.push(tx); state.writes.push(['transactions', tx.id, tx]); } } }));
import { FinanceService } from '../../src/services/financeService';
const tx = (): FinanceTransaction => ({ id: 'T1', date: '2026-01-01', description: 'Malt', category: 'brassage', subcategory: 'Malt', amountHT: 100, amountTTC: 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents: 10_000, paymentStatus: 'unpaid', lines: [] } });
const payment = (overrides: Partial<FinancialPayment> = {}): FinancialPayment => ({ id: 'P1', transactionId: 'T1', date: '2026-01-02', amountCents: 4_000, direction: 'out', method: 'bank', recordedAt: '2026-01-02T12:00:00Z', ...overrides });
beforeEach(() => { state.collections.clear(); state.transactions = [tx()]; state.writes = []; });
describe('Contrôles des règlements avant écriture', () => {
  it('refuse un surpaiement après un acompte sans écrire', () => {
    FinanceService.recordPayment(payment());
    expect(() => FinanceService.recordPayment(payment({ id: 'P2', amountCents: 6_001 }))).toThrow('restant dû');
    expect(state.writes).toHaveLength(2);
    expect(state.transactions[0]).toMatchObject({ settlementBalanceCents: 4000, lastPaymentId: 'P1' });
    FinanceService.recordPayment(payment({ id: 'P2', amountCents: 6_000 }));
    expect(state.writes).toHaveLength(4);
    expect(state.transactions[0].settlementBalanceCents).toBe(10000);
  });
  it('refuse une pièce absente, annulée ou un sens de paiement erroné', () => {
    expect(() => FinanceService.recordPayment(payment({ transactionId: 'absent' }))).toThrow('existante et active');
    expect(() => FinanceService.recordPayment(payment({ direction: 'in' }))).toThrow('sens');
    state.transactions[0].finance.voidedAt = '2026-01-03T10:00:00Z';
    expect(() => FinanceService.recordPayment(payment())).toThrow('existante et active');
    expect(state.writes).toHaveLength(0);
  });
  it('conserve une seule écriture par identifiant et exige une contre-écriture exacte', () => {
    FinanceService.recordPayment(payment()); FinanceService.recordPayment(payment());
    expect(state.writes).toHaveLength(2);
    expect(() => FinanceService.recordPayment(payment({ amountCents: 5_000 }))).toThrow('déjà enregistré');
    FinanceService.recordPayment(payment({ id: 'CONTRE-P1', direction: 'in', reversalOfId: 'P1' }));
    expect(state.transactions[0].settlementBalanceCents).toBe(0);
    expect(() => FinanceService.recordPayment(payment({ id: 'REV2', direction: 'in', reversalOfId: 'P1' }))).toThrow('identifiant unique');
    FinanceService.recordPayment(payment({ id: 'P2', amountCents: 10_000 }));
    expect(state.writes).toHaveLength(6);
  });
  it('enregistre une nouvelle pièce et son verrou dans le même lot que son paiement', () => {
    state.transactions = [];
    const saved = FinanceService.stageNewTransactionPayment(tx(), payment());
    expect(saved).toMatchObject({ settlementBalanceCents: 4000, lastPaymentId: 'P1' });
    expect(state.writes.map(w => w[0])).toEqual(['transactions', 'financialPayments']);
    expect(state.collections.get('financialPayments')?.[0].transactionId).toBe(saved.id);
  });
  it('refuse de relier une cession à une vente annulée ou insuffisante', () => {
    const asset: FinancialAsset = { id: 'A1', name: 'Cuve', acquisitionDate: '2020-01-01', inServiceDate: '2020-01-01', acquisitionCents: 100_000, openingValueCents: 20_000, openingYear: 2026, openingConfirmed: true, businessUsePct: 100, firstYearFraction: 1, method: 'declining', category: 'tanks', ratePct: 20, disposedDate: '2026-01-01', disposalProceedsCents: 10_000, disposalTransactionId: 'T1' };
    expect(() => FinanceService.saveAsset(asset)).toThrow('vente existante');
    state.transactions[0].finance.kind = 'income';
    expect(() => FinanceService.saveAsset({ ...asset, disposalProceedsCents: 10_001 })).toThrow('dépassent');
    FinanceService.saveAsset(asset);
    expect(state.writes).toHaveLength(1);
  });
});
