import type { FinanceTransaction, FinancialPayment, FinancialPlan, FinancialProfile } from './types';
import { isoDate, isActiveTransaction, paymentState, planInvoiceAllocation, summarizeLedger, todayISO, transactionAmount, transactionDirection, transactionKind } from './ledger';
import { isUpgradePlan, upgradeReadiness } from './upgrades';

export interface ForecastItem { id: string; date: string; label: string; amountCents: number; direction: 'in' | 'out'; source: 'invoice' | 'plan' | 'recurring' | 'brew' | 'trend' | 'equipment'; category: string; planId?: string; occurrenceId?: string }
export interface ForecastMonth { month: string; incomeCents: number; expenseCents: number; committedCents: number; projectedCents: number; balanceCents: number | null; items: ForecastItem[] }
export interface FinanceForecast { months: ForecastMonth[]; items: ForecastItem[]; warnings: string[]; cashComplete: boolean; trendMonths: string[]; openingCashCents: number | null }
const monthKey = (date: string) => date.slice(0, 7);
function shiftMonth(month: string, offset: number): string {
  const date = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}
function anchoredDate(start: string, offset: number): string {
  const month = shiftMonth(monthKey(start), offset);
  const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  return `${month}-${String(Math.min(Number(start.slice(8)), lastDay)).padStart(2, '0')}`;
}
/** End is exclusive. 365 means twelve calendar months, not 365 elapsed days. */
export function forecastHorizonEnd(asOf: string, horizon: 30 | 90 | 365): string {
  const start = isoDate(asOf);
  if (!start) throw new Error('Date de départ de prévision invalide.');
  if (horizon === 365) return anchoredDate(start, 12);
  if (horizon !== 30 && horizon !== 90) throw new Error('Horizon de prévision invalide.');
  const date = new Date(`${start}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + horizon);
  return date.toISOString().slice(0, 10);
}
export function planOccurrences(plan: FinancialPlan, from: string, to: string): Array<{ id: string; date: string }> {
  const start = isoDate(plan.date);
  if (!start || plan.status !== 'active') return [];
  if (!plan.recurrence) return start <= to ? [{ id: `${plan.id}:${start}`, date: start < from ? from : start }] : [];
  const step = plan.recurrence.frequency === 'yearly' ? 12 : plan.recurrence.frequency === 'quarterly' ? 3 : 1;
  const end = isoDate(plan.recurrence.endDate) ?? to;
  const delta = (Number(from.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(from.slice(5, 7)) - Number(start.slice(5, 7));
  const first = Math.max(0, Math.floor(delta / step) * step);
  const result: Array<{ id: string; date: string }> = [];
  for (let offset = first; offset <= first + 240; offset += step) {
    const date = anchoredDate(start, offset);
    if (date > to || date > end) break;
    if (date >= from) result.push({ id: `${plan.id}:${date}`, date });
  }
  return result;
}
const median = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b), i = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[i] : Math.round((sorted[i - 1] + sorted[i]) / 2); };
export function isResidualExpense(tx: FinanceTransaction): boolean {
  return isActiveTransaction(tx) && transactionKind(tx) === 'expense' && !tx.finance?.planId && !tx.finance?.batchId && !tx.finance?.excludedFromTrend
    && !['materiel', 'renovation'].includes(tx.category) && !tx.finance?.lines.some(l => l.kind === 'equipment');
}
export function buildForecast(input: { transactions: FinanceTransaction[]; payments: FinancialPayment[]; plans: FinancialPlan[]; profile: FinancialProfile; asOf?: string; months?: number; includeEquipmentProjects?: boolean }): FinanceForecast {
  const { transactions, payments, plans, profile } = input, asOf = isoDate(input.asOf) ?? todayISO();
  const count = Math.min(24, Math.max(1, input.months ?? 12)), currentMonth = monthKey(asOf);
  const monthKeys = Array.from({ length: count }, (_, i) => shiftMonth(currentMonth, i));
  const end = anchoredDate(`${monthKeys[count - 1]}-31`, 0);
  const ledger = summarizeLedger(transactions, payments, profile, asOf), warnings = [...ledger.warnings], items: ForecastItem[] = [];
  const active = transactions.filter(isActiveTransaction);
  for (const tx of active) {
    const state = paymentState(tx, payments, transactions, asOf);
    const linkedPlan = plans.find(p => p.id === tx.finance?.planId && (p.status === 'active' || isUpgradePlan(p)));
    if (!state.remainingCents || state.state === 'unknown' && !linkedPlan) continue;
    if (state.state === 'unknown') warnings.push(`Paiement à confirmer : ${tx.description}. Le montant lié à la prévision reste réservé.`);
    const due = isoDate(tx.finance?.dueDate), date = due && due > asOf ? due : asOf;
    if (!due) warnings.push(`Échéance à préciser : ${tx.description}. Montant placé aujourd’hui.`);
    if (date <= end) items.push({ id: `invoice:${tx.id}`, date, label: state.state === 'unknown' ? `${tx.description} · paiement à confirmer` : tx.description, amountCents: state.remainingCents, direction: transactionDirection(tx, transactions), source: 'invoice', category: tx.category, planId: tx.finance?.planId, occurrenceId: tx.finance?.occurrenceId });
  }
  for (const plan of plans) {
    if (plan.status !== 'active') continue;
    if (isUpgradePlan(plan) && input.includeEquipmentProjects === false) continue;
    if (isUpgradePlan(plan) && upgradeReadiness(plan).length) { warnings.push(`Projet à compléter : ${plan.title}.`); continue; }
    if (!Number.isSafeInteger(plan.amountCents) || plan.amountCents < 0 || !isoDate(plan.date)) { warnings.push(`Prévision invalide : ${plan.title}.`); continue; }
    const linked = active.filter(t => t.finance?.planId === plan.id && transactionKind(t) === (plan.direction === 'out' ? 'expense' : 'income'));
    if (plan.recurrence && linked.some(t => !t.finance?.occurrenceId)) {
      warnings.push(`Récurrence « ${plan.title} » : confirmer l’échéance des factures liées. Leur mois sert au rapprochement provisoire ; les échéances suivantes restent prévues.`);
    }
    for (const occurrence of planOccurrences(plan, plan.recurrence ? `${currentMonth}-01` : asOf, end)) {
      // A documented invoice replaces the intention, whether paid or still payable.
      const invoiced = linked.filter(t => !plan.recurrence || t.finance?.occurrenceId === occurrence.id || !t.finance?.occurrenceId && monthKey(isoDate(t.finance?.dueDate) ?? isoDate(t.date) ?? '') === monthKey(occurrence.date)).reduce((sum, t) => {
        const allocation = planInvoiceAllocation(t);
        if (allocation.issue === 'allocation') {
          warnings.push(`Montant lié à corriger : ${t.description}. La prévision reste réservée.`); return sum;
        }
        if (allocation.issue === 'mixed') { warnings.push(`Facture mixte « ${t.description} » : préciser le montant affecté à « ${plan.title} ». La prévision reste réservée.`); return sum; }
        return sum + allocation.amountCents!;
      }, 0);
      const remaining = Math.max(0, plan.amountCents - invoiced);
      if (!remaining) continue;
      if (occurrence.date < asOf) warnings.push(`Échéance passée « ${plan.title} » : montant encore prévu aujourd’hui, à rapprocher d’une facture ou à confirmer.`);
      items.push({ id: occurrence.id, occurrenceId: occurrence.id, planId: plan.id, date: occurrence.date < asOf ? asOf : occurrence.date, label: plan.title, amountCents: remaining,
        direction: plan.direction, source: plan.source === 'brew' ? 'brew' : isUpgradePlan(plan) ? 'equipment' : plan.recurrence ? 'recurring' : 'plan', category: plan.category });
    }
  }
  const completeFrom = isoDate(profile.historyCompleteFrom);
  const trendMonths = Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth, i - 6)).filter(month => !!completeFrom && `${month}-01` >= completeFrom!);
  // Confirmed recurrence vendors are removed from the historical residual even before a manual link.
  const vendorKey = (value?: string) => (value ?? '').trim().toLocaleLowerCase('fr');
  const txVendor = (tx: FinanceTransaction) => vendorKey(tx.finance?.vendor ?? tx.proofNotes?.replace(/^Fournisseur:\s*/i, '').split('·')[0]);
  const recurringVendors = new Set(plans.filter(p => p.status === 'active' && p.direction === 'out' && p.recurrence && p.vendor?.trim()).map(p => vendorKey(p.vendor)));
  const residual = active.filter(isResidualExpense).filter(tx => !recurringVendors.has(txVendor(tx)));
  if (trendMonths.length < 3) warnings.push('Tendance non calculée : confirmer au moins trois mois complets d’historique. Les engagements restent affichés.');
  else {
    const categories = [...new Set(residual.filter(tx => trendMonths.includes(monthKey(isoDate(tx.date) ?? ''))).map(tx => tx.category))];
    for (const category of categories) {
      const relevant = residual.filter(tx => tx.category === category);
      const historicalVendors = new Set(relevant.filter(tx => trendMonths.includes(monthKey(isoDate(tx.date) ?? ''))).map(txVendor));
      const baseline = median(trendMonths.map(month => relevant.filter(tx => monthKey(isoDate(tx.date) ?? '') === month).reduce((sum, tx) => sum + transactionAmount(tx), 0)));
      for (const month of monthKeys) {
        const alreadySpent = month === currentMonth ? relevant.filter(tx => monthKey(isoDate(tx.date) ?? '') === month && isoDate(tx.date)! <= asOf).reduce((sum, tx) => sum + transactionAmount(tx), 0) : 0;
        // The trend fills the category's historical envelope. A new recurring bill
        // without a vendor must not be added a second time to its own old median.
        // Named recurring vendors were already removed from the historical base.
        const coveredByPlans = plans.filter(plan => plan.status === 'active' && plan.direction === 'out' && plan.category === category && ['manual', 'recurring'].includes(plan.source)).filter(plan => {
          const vendor = vendorKey(plan.vendor);
          return !vendor || !recurringVendors.has(vendor) && historicalVendors.has(vendor);
        }).reduce((n, plan) => {
          if (!plan.recurrence && monthKey(isoDate(plan.date) ?? '') !== month) return n;
          // Keep the original occurrence amount even when its invoice is already
          // paid: the historical monthly cost has then already been covered.
          return n + planOccurrences(plan, `${month}-01`, anchoredDate(`${month}-31`, 0)).length * plan.amountCents;
        }, 0);
        const amountCents = Math.max(0, baseline - alreadySpent - coveredByPlans);
        if (amountCents) items.push({ id: `trend:${month}:${category}`, date: month === currentMonth ? asOf : `${month}-01`, label: `Autres dépenses · ${category}`, amountCents, direction: 'out', source: 'trend', category });
      }
    }
  }
  items.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  let balance = ledger.cashCents;
  const months = monthKeys.map(month => {
    const rows = items.filter(item => monthKey(item.date) === month);
    const incomeCents = rows.filter(i => i.direction === 'in').reduce((sum, i) => sum + i.amountCents, 0);
    const expenseCents = rows.filter(i => i.direction === 'out').reduce((sum, i) => sum + i.amountCents, 0);
    if (balance != null) balance += incomeCents - expenseCents;
    return { month, incomeCents, expenseCents, balanceCents: balance,
      committedCents: rows.filter(i => i.direction === 'out' && i.source !== 'trend').reduce((sum, i) => sum + i.amountCents, 0),
      projectedCents: rows.filter(i => i.source === 'trend').reduce((sum, i) => sum + i.amountCents, 0), items: rows };
  });
  return { months, items, warnings: [...new Set(warnings)], cashComplete: ledger.cashComplete, trendMonths, openingCashCents: ledger.cashCents };
}
