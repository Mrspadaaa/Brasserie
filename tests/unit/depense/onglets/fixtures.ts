// Données d'essai de la voie t1-onglets (aucune donnée réelle). Dates fixes : asOf = 2026-10-31.
import type { FinanceTransaction, FinancialPayment, FinancialPlan, FinancialProfile } from '../../../../src/domain/finance/types';

export const ASOF = '2026-10-31';
export const profile = { id: 'current', openingCash: { amountCents: 100000, date: '2026-01-01', confirmed: true }, historyCompleteFrom: '2026-01-01' } as unknown as FinancialProfile;

/** Une pièce : `kind` 'expense' par défaut, 'income' pour une vente. `extra` complète `finance`. */
export function tx(id: string, date: string, cents: number, extra: Record<string, unknown> = {}, kind: 'expense' | 'income' | 'contribution' | 'refund' = 'expense', category?: string): FinanceTransaction {
  return {
    id, date, description: id, category: category ?? (kind === 'income' ? 'recettes' : 'brassage'), subcategory: '',
    amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind, amountCents: cents, lines: [], recordedAt: '2026-10-01T00:00:00Z', ...extra },
  } as unknown as FinanceTransaction;
}
export function pay(id: string, transactionId: string, date: string, cents: number, direction: 'in' | 'out' = 'out'): FinancialPayment {
  return { id, transactionId, date, amountCents: cents, direction, method: 'bank', recordedAt: date } as unknown as FinancialPayment;
}
export function plan(patch: Partial<FinancialPlan> = {}): FinancialPlan {
  return { id: 'PLAN', date: '2026-11-15', title: 'Plan', direction: 'out', amountCents: 5000, status: 'active', category: 'chargesFixes', source: 'manual', createdAt: '2026-10-01T00:00:00Z', ...patch } as FinancialPlan;
}
