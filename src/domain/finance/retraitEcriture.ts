import type { FinanceTransaction, FinancialPlan } from './types';
import { isActiveTransaction } from './ledger';

/**
 * E35-1 (23.11 soir) : retirer une écriture qui revient (Salaire, Abonnement, Loyer saisis à la main) retirait la pièce, mais pas sa prévision :
 * « Salaire −5 / mois » restait au Calendrier, comptée dans « à dépenser », et l'ouvrir menait à une pièce disparue.
 *
 * La saisie à la main écrit la pièce ET sa prévision (`PLAN-<id de la pièce>`, `source: 'recurring'`, `preparer`). La prévision née de cette pièce
 * s'annule avec elle, tant qu'aucune AUTRE pièce active ne s'y rattache (une échéance déjà payée à part : la prévision reste, c'est elle qui les porte).
 * Une prévision écrite ailleurs (Finances › Prévisions) ou soldée par une pièce parmi d'autres n'est jamais touchée : « Retirer » défait ce que la saisie a fait.
 * Le plan annulé n'est pas supprimé (les règles interdisent de perdre une trace) : état « Annulée », comme `FinanceService.cancelPlan`.
 *
 * Rend le plan à écrire, ou `plan` lui-même (identité) quand il n'y a rien à changer.
 */
export function planApresRetraitRecurrent(plan: FinancialPlan, piece: FinanceTransaction, transactions: readonly FinanceTransaction[], maintenant: string): FinancialPlan {
  if (plan.source !== 'recurring' || plan.status !== 'active' || plan.id !== `PLAN-${piece.id}`) return plan;
  const autres = transactions.some(t => t.id !== piece.id && t.finance?.planId === plan.id && isActiveTransaction(t));
  return autres ? plan : { ...plan, status: 'cancelled', updatedAt: maintenant };
}
