import type { CreativeItem } from '../../types';
import type { EquipmentUpgrade, FinanceTransaction, FinancialPayment, FinancialPlan } from './types';
import { isoDate, isActiveTransaction, paymentState, planInvoiceAllocation, refundLinkIssue, todayISO, transactionAmount, transactionDirection, transactionKind } from './ledger';

export const UPGRADE_TIMINGS = { soon: 'Bientôt', next: 'Ensuite', later: 'Plus tard' } as const;
export const UPGRADE_STAGES = { idea: 'Idée', research: 'À étudier', quote: 'Devis en cours', ready: 'Prêt à acheter' } as const;
export const isUpgradePlan = (plan: FinancialPlan) => plan.source === 'equipment';
export const upgradeDetails = (plan: FinancialPlan): EquipmentUpgrade => plan.upgrade ?? {
  version: 1, timing: 'later', stage: 'idea', budgetKnown: Number.isSafeInteger(plan.amountCents), datePrecision: 'day', estimateSource: 'estimate', purchaseCents: plan.amountCents,
};
export function upgradeBudget(parts: Pick<EquipmentUpgrade, 'purchaseCents' | 'deliveryCents' | 'installationCents'>): number | null {
  if (parts.purchaseCents == null) return null;
  const amounts = [parts.purchaseCents, parts.deliveryCents ?? 0, parts.installationCents ?? 0];
  if (amounts.some(n => !Number.isSafeInteger(n) || n < 0)) return null;
  const total = amounts.reduce((sum, n) => sum + n, 0);
  return Number.isSafeInteger(total) ? total : null;
}
export function upgradeReadiness(plan: FinancialPlan): string[] {
  const upgrade = upgradeDetails(plan), missing: string[] = [];
  if (upgrade.budgetKnown !== true || !Number.isSafeInteger(plan.amountCents) || plan.amountCents < 0 || plan.upgrade && upgradeBudget(upgrade) !== plan.amountCents) missing.push('Renseigne le budget TTC.');
  if (!isoDate(plan.date)) missing.push('Choisis le mois ou la date de paiement prévue.');
  return missing;
}
/** Read-through migration: old ideas remain intact; one deterministic financial record shadows each edited idea. */
export function mergeUpgradePlans(plans: FinancialPlan[], ideas: CreativeItem[] = []): FinancialPlan[] {
  const ids = new Set(plans.map(p => p.id));
  const migrated = new Set(plans.map(p => p.upgrade?.sourceCreativeItemId).filter(Boolean));
  const legacy = ideas.filter(item => item.type === 'equipment').flatMap(item => {
    const id = `UPGRADE-${encodeURIComponent(item.id)}`;
    if (ids.has(id) || migrated.has(item.id)) return [];
    const known = typeof item.estimatedCost === 'number' && Number.isFinite(item.estimatedCost) && item.estimatedCost >= 0 && Number.isSafeInteger(Math.round(item.estimatedCost * 100));
    return [{ id, title: item.title, notes: item.notes, date: isoDate(item.date) ?? '', amountCents: known ? Math.round(item.estimatedCost! * 100) : 0,
      direction: 'out', category: 'materiel', source: 'equipment', status: item.status === 'done' ? 'completed' : 'draft', createdAt: '1970-01-01T00:00:00.000Z',
      upgrade: { version: 1, sourceCreativeItemId: item.id, timing: 'later', stage: item.status === 'quote' ? 'quote' : item.status === 'research' ? 'research' : item.status === 'validated' ? 'ready' : 'idea',
        budgetKnown: known, purchaseCents: known ? Math.round(item.estimatedCost! * 100) : undefined, datePrecision: 'day', estimateSource: 'estimate', purpose: item.description },
    } satisfies FinancialPlan];
  });
  return [...plans, ...legacy];
}
export function validateUpgrade(plan: FinancialPlan): void {
  const detail = upgradeDetails(plan);
  if (plan.direction !== 'out' || plan.recurrence || !['materiel', 'renovation'].includes(plan.category)) throw Error('Un projet de matériel prévoit un achat ponctuel.');
  if (detail.version !== 1 || !['month', 'day'].includes(detail.datePrecision) || !['estimate', 'quote'].includes(detail.estimateSource) || typeof detail.budgetKnown !== 'boolean') throw Error('Les informations du projet sont invalides.');
  if (!Object.prototype.hasOwnProperty.call(UPGRADE_TIMINGS, detail.timing) || !Object.prototype.hasOwnProperty.call(UPGRADE_STAGES, detail.stage)) throw Error('Choisis un horizon et une étape valides.');
  if (plan.date && !isoDate(plan.date)) throw Error('La date du projet est invalide.');
  if ([detail.purchaseCents, detail.deliveryCents, detail.installationCents].some(value => value != null && (!Number.isSafeInteger(value) || value < 0))) throw Error('Les montants du projet doivent être positifs en centimes CHF.');
  if (plan.upgrade && detail.budgetKnown && upgradeBudget(detail) !== plan.amountCents) throw Error('Le budget doit réunir le prix, la livraison et l’installation.');
  if (plan.upgrade && !detail.budgetKnown && plan.amountCents !== 0) throw Error('Confirme le budget du projet.');
  if (plan.status === 'active' && upgradeReadiness(plan).length) throw Error(upgradeReadiness(plan).join(' '));
}

export function upgradeProgress(plan: FinancialPlan, transactions: FinanceTransaction[], payments: FinancialPayment[], asOf = todayISO()) {
  const purchases = transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'expense' && tx.finance?.planId === plan.id);
  const purchaseById = new Map(purchases.map(tx => [tx.id, tx]));
  const credits = transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'refund' && purchaseById.has(tx.finance?.refundOfId ?? '') && !refundLinkIssue(tx, transactions) && transactionDirection(tx, transactions) === 'in');
  const rows = purchases.map(tx => ({ tx, share: planInvoiceAllocation(tx).amountCents, payment: paymentState(tx, payments, transactions, asOf) }));
  const allocated = rows.reduce((sum, row) => sum + (row.share ?? 0), 0);
  // A credit on a partially allocated invoice cannot be attributed to this project automatically.
  const creditAllocations = credits.map(tx => {
    const original = purchaseById.get(tx.finance!.refundOfId!)!;
    return { tx, known: planInvoiceAllocation(original).amountCents === transactionAmount(original) };
  });
  const invoicedCents = allocated - creditAllocations.filter(row => row.known).reduce((sum, row) => sum + transactionAmount(row.tx), 0);
  const invoicedComplete = rows.every(row => row.share != null) && creditAllocations.every(row => row.known);
  const paidCents = rows.reduce((sum, { tx, share, payment }) => sum + (share === transactionAmount(tx) ? payment.paidCents : payment.paidCents === transactionAmount(tx) ? share ?? 0 : 0), 0)
    - creditAllocations.filter(row => row.known && row.tx.finance?.refundApplication !== 'offset').reduce((sum, row) => sum + paymentState(row.tx, payments, transactions, asOf).paidCents, 0);
  const paymentKnown = invoicedComplete && rows.every(({ tx, share, payment }) => payment.state !== 'unknown' && (share === transactionAmount(tx) || payment.paidCents === 0 || payment.paidCents === transactionAmount(tx)))
    && credits.every(tx => paymentState(tx, payments, transactions, asOf).state !== 'unknown');
  return { invoiceCount: purchases.length, invoicedCents, invoicedComplete, paidCents, paymentKnown, remainingBudgetCents: upgradeDetails(plan).budgetKnown ? Math.max(0, plan.amountCents - allocated) : null };
}
