import type { Transaction } from '../../../types';
import type { FinancialPayment } from '../../../domain/finance/types';
import { isActiveTransaction, paymentState } from '../../../domain/finance/ledger';

/**
 * FN-38 : de quelle pièce vient une créance « À récupérer » / « À rembourser » ? Son motif ne porte que le NOM de la pièce (« trop payé sur « <pièce> » ») : un doublon
 * du même nom (A2) se confondait avec l'original (A). Pur : aucun accès au stockage.
 *   1. exact : la correction écrit la créance, la contre-écriture et le paiement de complément au même instant (`ctx.maintenant`) : la pièce qui porte un paiement
 *      de cet instant est l'origine ;
 *   2. à défaut (écriture ancienne) : parmi les pièces de ce nom, la plus ancienne (instant de saisie, puis identifiant) qui porte un paiement vivant ;
 *      jamais une pièce sans paiement : un trop-payé suppose un paiement.
 * `null` : aucune pièce ne convient (la créance n'est montrée sur aucune fiche, elle reste dans Opérations).
 */
export function origineDeCreance(creance: Transaction, transactions: readonly Transaction[], payments: readonly FinancialPayment[]): Transaction | null {
  const m = /« (.+) »$/.exec(creance.description ?? '');
  if (!m) return null;
  const candidates = transactions.filter(t => t.id !== creance.id && isActiveTransaction(t) && t.description === m[1] && t.subcategory !== 'À récupérer' && t.subcategory !== 'À rembourser');
  const instant = creance.finance?.recordedAt;
  if (instant) {
    const exacte = candidates.find(t => payments.some(p => p.transactionId === t.id && p.recordedAt === instant));
    if (exacte) return exacte;
  }
  const payees = candidates.filter(t => payments.some(p => p.transactionId === t.id && !p.reversalOfId) && paymentState(t, payments as FinancialPayment[], transactions as Transaction[]).paidCents > 0);
  return payees.sort((a, b) => (a.finance?.recordedAt ?? '9999').localeCompare(b.finance?.recordedAt ?? '9999') || a.id.localeCompare(b.id))[0] ?? null;
}
