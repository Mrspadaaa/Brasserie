import type { FinanceKind, FinanceTransaction, FinancialPayment, FinancialProfile } from './types';
import { compte } from '../../services/plural';

export const toCents = (value: number): number => Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) : 0;
export const fromCents = (value: number): number => value / 100;
export const formatCHF = (value: number): string => new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(value / 100);
export function isoDate(value?: string): string | null {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const local = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  if (!iso && !local) return null;
  const [y, m, d] = iso ? iso.slice(1).map(Number) : [Number(local![3]), Number(local![2]), Number(local![1])];
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 1900 && y <= 2200 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
}
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function transactionKind(tx: FinanceTransaction): FinanceKind {
  return tx.finance?.kind ?? (tx.category === 'recettes' ? 'income' : tx.category === 'apports' ? 'contribution' : 'expense');
}
export function transactionAmount(tx: FinanceTransaction): number {
  return tx.finance?.version === 1 && Number.isSafeInteger(tx.finance.amountCents)
    ? tx.finance.amountCents : toCents(tx.amountTTC ?? tx.amountHT);
}
export function transactionDirection(tx: FinanceTransaction, transactions: FinanceTransaction[] = []): 'in' | 'out' {
  const kind = transactionKind(tx);
  if (kind === 'refund') {
    if (tx.finance?.refundDirection) return tx.finance.refundDirection;
    const original = transactions.find(t => t.id === tx.finance?.refundOfId);
    return original && transactionKind(original) === 'income' ? 'out' : 'in';
  }
  return kind === 'income' || kind === 'contribution' ? 'in' : 'out';
}
export function isActiveTransaction(tx: FinanceTransaction): boolean { return !tx.finance?.voidedAt; }
export const isOffsetRefund = (tx: FinanceTransaction): boolean => transactionKind(tx) === 'refund' && tx.finance?.refundApplication === 'offset';
/** The invoice replaces a plan only for its identified share; mixed purchases need an explicit allocation. */
export function planInvoiceAllocation(tx: FinanceTransaction): { amountCents: number | null; issue?: 'allocation' | 'mixed' } {
  const allocated = tx.finance?.planAllocatedCents;
  if (allocated != null) return Number.isSafeInteger(allocated) && allocated >= 0 && allocated <= transactionAmount(tx) ? { amountCents: allocated } : { amountCents: null, issue: 'allocation' };
  const kinds = new Set(tx.finance?.lines.filter(line => line.amountCents > 0 && !['shipping', 'discount'].includes(line.kind)).map(line => line.kind));
  return kinds.size > 1 ? { amountCents: null, issue: 'mixed' } : { amountCents: transactionAmount(tx) };
}
export function refundLinkIssue(tx: FinanceTransaction, transactions: FinanceTransaction[]): string | null {
  if (transactionKind(tx) !== 'refund') return null;
  const original = transactions.find(t => t.id === tx.finance?.refundOfId);
  if (!original || !isActiveTransaction(original) || !['income', 'expense'].includes(transactionKind(original))) return `${tx.id} : l’avoir doit être lié à une facture existante et active.`;
  if (!isoDate(original.date) || !isoDate(tx.date) || isoDate(tx.date)! < isoDate(original.date)!) return `${tx.id} : la date de l’avoir doit suivre celle de la facture d’origine.`;
  if (transactionDirection(tx, transactions) === transactionDirection(original, transactions)) return `${tx.id} : le sens de l’avoir ne correspond pas à sa facture.`;
  return null;
}
export function isExpense(tx: FinanceTransaction): boolean { return transactionKind(tx) === 'expense'; }
export function transactionVendor(tx: FinanceTransaction): string {
  return tx.finance?.vendor ?? (tx.proofNotes?.replace(/^(Fournisseur|Client):\s*/i, '').split('·')[0].trim() || '');
}
export function validPayment(payment: FinancialPayment): boolean {
  return !!isoDate(payment.date) && Number.isSafeInteger(payment.amountCents) && payment.amountCents > 0 && ['in', 'out'].includes(payment.direction);
}
export function paidForTransaction(tx: FinanceTransaction, payments: FinancialPayment[], transactions: FinanceTransaction[] = [], asOf = '2200-12-31'): number {
  const direction = transactionDirection(tx, transactions);
  return payments.filter(p => p.transactionId === tx.id && validPayment(p) && isoDate(p.date)! <= asOf)
    .reduce((sum, p) => sum + (p.direction === direction ? p.amountCents : -p.amountCents), 0);
}
export function paymentState(tx: FinanceTransaction, payments: FinancialPayment[], transactions: FinanceTransaction[] = [], asOf = '2200-12-31') {
  const events = payments.filter(p => p.transactionId === tx.id && validPayment(p) && isoDate(p.date)! <= asOf);
  const paidCents = paidForTransaction(tx, payments, transactions, asOf);
  const amountCents = transactionAmount(tx);
  const appliedCreditCents = transactions.filter(t => t.finance?.refundOfId === tx.id && isActiveTransaction(t) && isOffsetRefund(t) && !refundLinkIssue(t, transactions) && isoDate(t.date)! <= asOf)
    .reduce((sum, t) => sum + Math.max(0, transactionAmount(t)), 0);
  if (isOffsetRefund(tx) && isActiveTransaction(tx) && !refundLinkIssue(tx, transactions) && isoDate(tx.date)! <= asOf) {
    return { state: 'paid' as const, paidCents, remainingCents: 0, overpaidCents: Math.abs(paidCents), appliedCreditCents: amountCents };
  }
  const hasFuturePayment = payments.some(p => p.transactionId === tx.id && validPayment(p) && isoDate(p.date)! > asOf);
  // An explicit unpaid state or a settlement event proves this is a tracked payable.
  // A legacy entry or a bare "paid" label cannot invent a payment date.
  const known = events.length > 0 || hasFuturePayment || appliedCreditCents > 0 || tx.finance?.paymentStatus === 'unpaid';
  const remainingCents = Math.max(0, amountCents - paidCents - appliedCreditCents);
  const state = !known ? 'unknown' : remainingCents === 0 ? 'paid' : paidCents > 0 || appliedCreditCents > 0 ? 'partial' : 'unpaid';
  return { state: state as 'unknown' | 'paid' | 'partial' | 'unpaid', paidCents, remainingCents, overpaidCents: Math.max(0, paidCents + appliedCreditCents - amountCents), appliedCreditCents };
}
export interface OutstandingEntry {
  id: string; description: string; date: string | null; dueDate: string | null;
  amountCents: number; paidCents: number; remainingCents: number; direction: 'in' | 'out'; state: string;
}
export interface LedgerSummary {
  incomeCents: number; expenseCents: number; contributionCents: number; withdrawalCents: number;
  cashCents: number | null; cashComplete: boolean; unknownPaymentCount: number;
  receivablesCents: number; payablesCents: number; missingProofCount: number;
  outstanding: OutstandingEntry[]; warnings: string[];
}
export function summarizeLedger(transactions: FinanceTransaction[], payments: FinancialPayment[], profile: FinancialProfile, asOf = todayISO()): LedgerSummary {
  const warnings: string[] = [];
  const result: LedgerSummary = { incomeCents: 0, expenseCents: 0, contributionCents: 0, withdrawalCents: 0,
    cashCents: null, cashComplete: false, unknownPaymentCount: 0, receivablesCents: 0, payablesCents: 0, missingProofCount: 0, outstanding: [], warnings };
  const opening = profile.openingCash;
  if (opening?.confirmed && isoDate(opening.date) && isoDate(opening.date)! <= asOf && Number.isSafeInteger(opening.amountCents)) {
    result.cashCents = opening.amountCents + payments.filter(p => validPayment(p) && isoDate(p.date)! >= isoDate(opening.date)! && isoDate(p.date)! <= asOf)
      .reduce((sum, p) => sum + (p.direction === 'in' ? p.amountCents : -p.amountCents), 0);
    result.cashComplete = true;
  } else warnings.push('Solde de trésorerie initial à confirmer.');
  transactions.filter(isActiveTransaction).forEach(tx => {
    if (tx.settlementBalanceCents !== undefined && tx.settlementBalanceCents !== paidForTransaction(tx, payments, transactions)) {
      warnings.push(`${tx.id} : registre de paiements en cours de synchronisation ou restauration.`);
      result.cashComplete = false;
    }
    const date = isoDate(tx.date);
    if (!date) { warnings.push(`Date à corriger : ${tx.description || tx.id}.`); return; }
    if (date > asOf) return;
    const amount = transactionAmount(tx);
    if (!Number.isSafeInteger(amount) || amount < 0) { warnings.push(`Montant à vérifier : ${tx.id}.`); return; }
    const kind = transactionKind(tx), direction = transactionDirection(tx, transactions);
    const refundIssue = refundLinkIssue(tx, transactions);
    if (refundIssue) { warnings.push(refundIssue); result.cashComplete = false; return; }
    if (kind === 'income') result.incomeCents += amount;
    if (kind === 'expense') result.expenseCents += amount;
    if (kind === 'contribution') result.contributionCents += amount;
    if (kind === 'withdrawal') result.withdrawalCents += amount;
    if (kind === 'refund') direction === 'in' ? result.expenseCents -= amount : result.incomeCents -= amount;
    if ((kind === 'expense' || kind === 'income') && !tx.proofUrl && !tx.finance?.proofDocumentId) result.missingProofCount++;
    const state = paymentState(tx, payments, transactions, asOf);
    if (state.state === 'unknown') {
      result.unknownPaymentCount++;
      if (opening && date >= (isoDate(opening.date) ?? '')) result.cashComplete = false;
    } else if (state.remainingCents > 0) {
      result.outstanding.push({ id: tx.id, description: tx.description, date, dueDate: isoDate(tx.finance?.dueDate),
        amountCents: amount, paidCents: state.paidCents, remainingCents: state.remainingCents, direction, state: state.state });
      if (direction === 'in') result.receivablesCents += state.remainingCents; else result.payablesCents += state.remainingCents;
    }
    if (state.overpaidCents > 0) warnings.push(`Paiement supérieur à la pièce ${tx.id} : ${formatCHF(state.overpaidCents)}.`);
  });
  if (result.unknownPaymentCount) warnings.push(`${compte(result.unknownPaymentCount, 'paiement historique', 'paiements historiques')} à confirmer ; exclus des échéances.`);
  if (payments.some(p => !validPayment(p))) { warnings.push('Des paiements ont une date ou un montant invalide.'); result.cashComplete = false; }
  result.outstanding.sort((a, b) => (a.dueDate ?? a.date ?? '').localeCompare(b.dueDate ?? b.date ?? ''));
  return result;
}

export function validateFinanceTransaction(tx: FinanceTransaction): void {
  if (!isoDate(tx.date)) throw new Error('Date comptable invalide.');
  const finance = tx.finance;
  if (!finance || finance.version !== 1 || !Number.isSafeInteger(finance.amountCents) || finance.amountCents <= 0) throw new Error('Montant CHF invalide.');
  if (!Number.isFinite(tx.amountTTC) || toCents(tx.amountTTC) !== finance.amountCents) throw new Error('Le total TTC ne correspond pas au montant comptable.');
  if (!tx.description.trim()) throw new Error('Description requise.');
  if (finance.lines.some(l => !Number.isSafeInteger(l.amountCents) || !l.description.trim())) throw new Error('Une ligne est incomplète.');
  if (finance.lines.length && finance.lines.reduce((sum, l) => sum + l.amountCents, 0) !== finance.amountCents) throw new Error('Le total des lignes ne correspond pas au montant de la pièce.');
  if (finance.dueDate && !isoDate(finance.dueDate)) throw new Error('Échéance invalide.');
  if (finance.planAllocatedCents != null && (!finance.planId || !Number.isSafeInteger(finance.planAllocatedCents) || finance.planAllocatedCents < 0 || finance.planAllocatedCents > finance.amountCents)) throw new Error('Le montant affecté à la prévision doit être compris entre zéro et le total de la pièce.');
  if (finance.businessUsePct != null && (!Number.isFinite(finance.businessUsePct) || finance.businessUsePct < 0 || finance.businessUsePct > 100)) throw new Error('Part professionnelle invalide.');
}
