import type { FinanceTransaction, FinancialPlan } from './types';
import { formatCHF, isActiveTransaction, transactionAmount } from './ledger';

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

/**
 * E41-1 / E44-2 : les écritures liées encore en vigueur (avoirs, `refundOfId`) qu'un retrait emporte avec la pièce, les plus éloignées d'abord
 * (un avoir d'un avoir se retire avant son avoir). UNE règle pour ce que le retrait fait (`retirerEcriture`) et ce que la fiche en dit (`phraseDuRetrait`) :
 * la fiche l'annonçait avec la liste affichée, qui ne montre pas les avoirs, et se taisait alors que le retrait les annulait aussi.
 */
export function ecrituresLieesDans(pieceId: string, toutes: readonly FinanceTransaction[]): FinanceTransaction[] {
  const sortie: FinanceTransaction[] = [];
  const vues = new Set([pieceId]);
  const descendre = (id: string) => {
    for (const t of toutes) {
      if (!isActiveTransaction(t) || t.finance?.refundOfId !== id || vues.has(t.id)) continue;
      vues.add(t.id); descendre(t.id); sortie.push(t);
    }
  };
  descendre(pieceId);
  return sortie;
}

/** Le texte de confirmation d'un retrait : le paiement inversé, les remboursements liés retirés avec elle, et ce qu'il reste (une écriture ne se supprime jamais). */
export function phraseDuRetrait(paiementEnVigueurCents: number, liees: readonly FinanceTransaction[]): string {
  const paiement = paiementEnVigueurCents > 0
    ? `Son paiement de ${formatCHF(paiementEnVigueurCents)} est d’abord inversé, puis l’écriture est annulée. `
    : 'Aucun paiement n’est noté : rien à inverser. ';
  const avoirs = liees.length
    ? `${liees.length > 1 ? 'Ses remboursements liés' : 'Son remboursement lié'} (${liees.map(l => `${l.description} ${formatCHF(transactionAmount(l))}`).join(', ')}) ${liees.length > 1 ? 'sont retirés avec elle' : 'est retiré avec elle'}, paiement inversé compris. `
    : '';
  return `Retirer cette écriture ? ${paiement}${avoirs}Une écriture ne se supprime jamais : elle sort de la liste, et « Écritures annulées uniquement » la montre.`;
}
