import { describe, expect, it } from 'vitest';
import type { FinanceTransaction, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { buildForecast } from '../../src/domain/finance/forecast';
const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-06-01' };
const expense = (id: string, date: string): FinanceTransaction => ({ id, date, description: 'Électricité', category: 'chargesFixes', subcategory: 'Énergie', amountHT: 50, amountTTC: 50, tvaAmount: 0, tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents: 5000, lines: [], paymentStatus: 'unknown' } });
const plan = (patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'PLAN', date: '2026-09-15', title: 'Électricité', direction: 'out', amountCents: 5000, status: 'active', category: 'chargesFixes', source: 'recurring', recurrence: { frequency: 'monthly' }, createdAt: '2026-09-01T00:00:00Z', ...patch });
const history = () => ['2026-06-01', '2026-07-01', '2026-08-01'].map((date, i) => expense(`T${i}`, date));
describe('Rapprochement prudent des prévisions', () => {
  it('conserve une réserve quand la facture liée a un paiement inconnu', () => {
    const tx = expense('T1', '2026-09-01'); tx.finance!.planId = 'PLAN'; tx.finance!.dueDate = '2026-09-15';
    const result = buildForecast({ transactions: [tx], payments: [], plans: [plan({ source: 'manual', recurrence: undefined })], profile, asOf: '2026-09-09' });
    expect(result.months[0].expenseCents).toBe(5000);
    expect(result.items[0].label).toContain('paiement à confirmer');
  });
  it('complète la médiane par catégorie après une récurrence sans fournisseur', () => {
    const result = buildForecast({ transactions: history(), payments: [], plans: [plan()], profile, asOf: '2026-09-09' });
    expect(result.months[0].expenseCents).toBe(5000);
    expect(result.months[1].expenseCents).toBe(5000);
    expect(result.months[0].projectedCents).toBe(0);
  });
  it('un brouillon ne supprime pas les dépenses historiques de son fournisseur', () => {
    const txs = history(); txs.forEach(t => { t.finance!.vendor = 'EDF'; });
    const result = buildForecast({ transactions: txs, payments: [], plans: [plan({ status: 'draft', vendor: 'EDF' })], profile, asOf: '2026-09-09' });
    expect(result.months[0].expenseCents).toBe(5000);
    expect(result.months[0].projectedCents).toBe(5000);
  });
  it('ne réinvente pas la mensualité déjà payée et conserve celle échue sans pièce', () => {
    const current = expense('CURRENT', '2026-09-01'); current.finance!.planId = 'PLAN'; current.finance!.occurrenceId = 'PLAN:2026-09-01';
    const monthly = plan({ date: '2026-09-01' });
    const input = { transactions: [...history(), current], payments: [{ id: 'PAY', transactionId: current.id, date: '2026-09-02', amountCents: 5000, direction: 'out' as const, method: 'bank' as const, recordedAt: '2026-09-02T10:00:00Z' }], plans: [monthly], profile, asOf: '2026-09-09' };
    expect(buildForecast(input).months[0].expenseCents).toBe(0);
    const overdue = buildForecast({ ...input, transactions: history(), payments: [] });
    expect(overdue.months[0].expenseCents).toBe(5000);
    expect(overdue.months[0].items[0].date).toBe('2026-09-09');
  });
  it('une échéance historique ambiguë ne masque pas les mensualités suivantes', () => {
    const tx = expense('T1', '2026-08-15'); tx.finance!.planId = 'PLAN'; tx.finance!.dueDate = '2026-08-15'; tx.finance!.paymentStatus = 'unpaid';
    const result = buildForecast({ transactions: [tx], payments: [], plans: [plan({ date: '2026-08-15' })], profile, asOf: '2026-09-09' });
    expect(result.months[0].expenseCents).toBe(10000); // ancienne dette + nouvelle mensualité
    expect(result.months[1].expenseCents).toBe(5000);
    expect(result.warnings.join(' ')).toContain('rapprochement provisoire');
  });
  it('ne remplace que l’achat de malt affecté au plan dans une facture mixte', () => {
    const tx = expense('T1', '2026-09-01'); tx.amountHT = 100; tx.amountTTC = 100;
    tx.finance = { ...tx.finance!, amountCents: 10000, planId: 'PLAN', paymentStatus: 'unpaid', dueDate: '2026-09-15', lines: [{ id: 'malt', kind: 'ingredient', description: 'Malt', amountCents: 2000 }, { id: 'machine', kind: 'equipment', description: 'Machine', amountCents: 8000 }] };
    const input = { transactions: [tx], payments: [], plans: [plan({ amountCents: 6000, source: 'brew', recurrence: undefined })], profile, asOf: '2026-09-09' };
    const conservative = buildForecast(input);
    expect(conservative.months[0].expenseCents).toBe(16000);
    expect(conservative.warnings.join(' ')).toContain('Facture mixte');
    tx.finance.planAllocatedCents = 2000;
    expect(buildForecast(input).months[0].expenseCents).toBe(14000);
  });
});
