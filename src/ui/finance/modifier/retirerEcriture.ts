import type { FinancialPayment } from '../../../domain/finance/types';
import { planRetrait } from '../../../domain/finance/correctionMontant';
import { isActiveTransaction } from '../../../domain/finance/ledger';
import { planApresRetrait } from '../../../domain/finance/upgradeRing';
import { planApresRetraitRecurrent } from '../../../domain/finance/retraitEcriture';
import { FinanceService } from '../../../services/financeService';
import { StorageService } from '../../../services/storage';
import { executerPlan, type ContexteExecution } from './executerCorrection';

/**
 * « Retirer cette écriture » (u1, constat 20). Les règles Firestore interdisent de supprimer une pièce et un paiement : on ne supprime donc rien.
 * Une pièce payée se retire en deux temps, que le brasseur n'a plus à enchaîner lui-même : le contre-paiement de chaque paiement en vigueur
 * (un lot par étape, `executerPlan`), puis l'annulation de l'écriture (`StorageService.revertTransaction`, qui exige un réglé nul).
 * L'écriture annulée sort de la liste par défaut ; « Écritures annulées uniquement » la montre.
 */
export { planRetrait };

/** Ce que l'annulation refuserait de toute façon : dit AVANT le premier contre-paiement, pour ne laisser aucune écriture à moitié faite. */
export function obstacleAuRetrait(pieceId: string): string | null {
  return StorageService.getTransactions().some(t => isActiveTransaction(t) && t.finance?.refundOfId === pieceId)
    ? 'Un avoir est lié à cette pièce. Corrige d’abord cet avoir pour conserver des comptes cohérents.' : null;
}

export async function retirerEcriture(pieceId: string, paiements: FinancialPayment[], ctx: ContexteExecution): Promise<void> {
  const piece = StorageService.getTransactions().find(t => t.id === pieceId);
  if (!piece) throw new Error('Écriture introuvable.');
  const obstacle = obstacleAuRetrait(pieceId);
  if (obstacle) throw new Error(obstacle);
  const etapes = planRetrait(piece, paiements);
  if (etapes.length) await executerPlan(etapes, pieceId, ctx, vivante => vivante);
  const resultat = StorageService.revertTransaction(pieceId);
  if (!resultat.success) {
    throw new Error(etapes.length ? `${resultat.message} Déjà écrit : ${etapes.length > 1 ? 'paiements inversés' : 'paiement inversé'}. Vérifie l’opération dans la liste.` : resultat.message);
  }
  // L-37 : la pièce soldait un prévu (achat prévu, projet de matériel : `soldeLeVuPlan`) ; retirée, le prévu revient s'il n'est plus couvert.
  const planId = piece.finance?.planId;
  const plan = planId ? FinanceService.getPlans().find(p => p.id === planId) : undefined;
  // Le retrait est déjà écrit : un refus du prévu (plan ancien invalide) ne le fait pas passer pour raté ; le prévu se rouvre alors à la main.
  if (plan) try {
    // E35-1 : la prévision que la saisie a écrite avec la pièce (Salaire, Abonnement, Loyer qui reviennent) s'annule avec elle.
    const apres = planApresRetraitRecurrent(planApresRetrait(plan, StorageService.getTransactions(), ctx.maintenant), piece, StorageService.getTransactions(), ctx.maintenant);
    if (apres !== plan) FinanceService.savePlan(apres);
  } catch { /* prévu laissé tel quel */ }
}
