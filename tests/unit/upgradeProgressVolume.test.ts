/**
 * Constat 9 du jeu en ligne 16.11 (« ouvrir un projet archivé gèle la page ~30 s ») : cause trouvée par la mesure.
 * `upgradeProgress` relisait TOUTES les écritures et TOUS les paiements pour chaque projet (Archives : 200 projets × 3 000 écritures),
 * et chaque rendu de l'atelier le rejouait (la liste `visible` change de référence à chaque rendu). Le coût croissait avec le volume × le nombre de projets.
 * Correction : un index (par projet, par écriture, par avoir) construit une fois par jeu de données ; le coût d'un projet ne dépend plus que de ses achats.
 * Ce test (a) garde le résultat identique à l'ancienne méthode, (b) chronomètre le volume de production (fixtures ZZ, aucune donnée réelle).
 */
import { describe, expect, it } from 'vitest';
import { upgradeProgress, upgradeDetails } from '../../src/domain/finance/upgrades';
import { isActiveTransaction, paymentState, planInvoiceAllocation, refundLinkIssue, transactionAmount, transactionDirection, transactionKind } from '../../src/domain/finance/ledger';
import type { FinanceTransaction, FinancialPayment, FinancialPlan } from '../../src/domain/finance/types';

/** L'ancienne méthode, mot pour mot : la référence du résultat. */
function upgradeProgressNaif(plan: FinancialPlan, transactions: FinanceTransaction[], payments: FinancialPayment[], asOf: string) {
  const purchases = transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'expense' && tx.finance?.planId === plan.id);
  const purchaseById = new Map(purchases.map(tx => [tx.id, tx]));
  const credits = transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'refund' && purchaseById.has(tx.finance?.refundOfId ?? '') && !refundLinkIssue(tx, transactions) && transactionDirection(tx, transactions) === 'in');
  const rows = purchases.map(tx => ({ tx, share: planInvoiceAllocation(tx).amountCents, payment: paymentState(tx, payments, transactions, asOf) }));
  const allocated = rows.reduce((sum, row) => sum + (row.share ?? 0), 0);
  const creditAllocations = credits.map(tx => { const original = purchaseById.get(tx.finance!.refundOfId!)!; return { tx, known: planInvoiceAllocation(original).amountCents === transactionAmount(original) }; });
  const invoicedCents = allocated - creditAllocations.filter(row => row.known).reduce((sum, row) => sum + transactionAmount(row.tx), 0);
  const invoicedComplete = rows.every(row => row.share != null) && creditAllocations.every(row => row.known);
  const paidCents = rows.reduce((sum, { tx, share, payment }) => sum + (share === transactionAmount(tx) ? payment.paidCents : payment.paidCents === transactionAmount(tx) ? share ?? 0 : 0), 0)
    - creditAllocations.filter(row => row.known && row.tx.finance?.refundApplication !== 'offset').reduce((sum, row) => sum + paymentState(row.tx, payments, transactions, asOf).paidCents, 0);
  const paymentKnown = invoicedComplete && rows.every(({ tx, share, payment }) => payment.state !== 'unknown' && (share === transactionAmount(tx) || payment.paidCents === 0 || payment.paidCents === transactionAmount(tx)))
    && credits.every(tx => paymentState(tx, payments, transactions, asOf).state !== 'unknown');
  return { invoiceCount: purchases.length, invoicedCents, invoicedComplete, paidCents, paymentKnown, remainingBudgetCents: upgradeDetails(plan).budgetKnown ? Math.max(0, plan.amountCents - allocated) : null };
}

const NB_PROJETS = 200, NB_TX = 3000, NB_LIES = 1500, ASOF = '2026-11-16';
const jour = (i: number) => new Date(Date.UTC(2024, 0, 1 + (i % 700))).toISOString().slice(0, 10);
function fixture() {
  const plans: FinancialPlan[] = Array.from({ length: NB_PROJETS }, (_, p) => ({ id: `ZZ-P${p}`, title: `ZZ Projet ${p}`, date: '2026-03-01', amountCents: 20000 + p * 3700, direction: 'out', category: 'materiel', source: 'equipment', status: 'cancelled', createdAt: '2026-01-01T10:00:00.000Z',
    upgrade: { version: 1, timing: 'later', stage: 'research', budgetKnown: true, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: 20000 + p * 3700 } }));
  const transactions: FinanceTransaction[] = [], payments: FinancialPayment[] = [];
  for (let i = 0; i < NB_TX; i++) {
    const lie = i < NB_LIES, avoir = lie && i % 10 === 9, annule = lie && i % 37 === 0, mixte = lie && i % 41 === 0, compense = avoir && i % 20 === 9;
    transactions.push({ id: `ZZ-T${i}`, description: `ZZ ${i}`, date: jour(i), category: 'materiel', subcategory: '', amountHT: 10, amountTTC: 10, tvaRate: 0, tvaAmount: 0,
      finance: { version: 1, kind: avoir ? 'refund' : 'expense', amountCents: 1000, paymentStatus: i % 5 === 0 ? 'unpaid' : 'paid', ...(lie ? { planId: `ZZ-P${i % NB_PROJETS}` } : {}), ...(annule ? { voidedAt: '2026-02-01T10:00:00.000Z' } : {}),
        ...(avoir ? { refundOfId: `ZZ-T${i - 1}`, refundDirection: 'in', ...(compense ? { refundApplication: 'offset' } : {}) } : {}),
        lines: mixte ? [{ id: 'a', description: 'x', kind: 'equipment', quantity: 1, amountCents: 500 }, { id: 'b', description: 'y', kind: 'raw_material', quantity: 1, amountCents: 500 }] : [{ id: 'a', description: 'x', kind: 'equipment', quantity: 1, amountCents: 1000 }] } } as unknown as FinanceTransaction);
    if (lie) payments.push({ id: `ZZ-ACPT${i}`, transactionId: `ZZ-T${i}`, date: jour(i + 3), amountCents: 100, direction: avoir ? 'in' : 'out', method: 'bank' } as unknown as FinancialPayment);
    if (i % 5 !== 0) payments.push({ id: `ZZ-PAY${i}`, transactionId: `ZZ-T${i}`, date: jour(i), amountCents: i % 7 === 0 ? 400 : 1000, direction: avoir ? 'in' : 'out', method: 'bank' } as unknown as FinancialPayment);
  }
  return { plans, transactions, payments };
}

describe('upgradeProgress à volume de production', () => {
  const { plans, transactions, payments } = fixture();
  it('donne exactement le résultat de l’ancienne méthode, projet par projet', () => {
    for (const plan of plans) expect(upgradeProgress(plan, transactions, payments, ASOF)).toEqual(upgradeProgressNaif(plan, transactions, payments, ASOF));
  });
  it('200 projets sur 3 000 écritures et 4 000 paiements : moins de 60 ms (la base : 185 ms ici, 550 ms au rendu jsdom)', () => {
    const t0 = performance.now();
    for (const plan of plans) upgradeProgress(plan, transactions, payments, ASOF);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(60);
  });
  it('un nouveau jeu de données est relu (l’index suit la référence du tableau, jamais figé)', () => {
    const plan = plans[3], avant = upgradeProgress(plan, transactions, payments, ASOF);
    const plus = [...transactions, { ...transactions[3], id: 'ZZ-NEUF' } as FinanceTransaction];
    expect(upgradeProgress(plan, plus, payments, ASOF).invoiceCount).toBe(avant.invoiceCount + 1);
    expect(upgradeProgress(plan, transactions, payments, ASOF)).toEqual(avant);
  });
});
