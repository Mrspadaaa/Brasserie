import type { Transaction } from '../../../types';
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

/**
 * E41-1 (24.11) : un achat qui a un remboursement lié (avoir, `refundOfId`) ne se retirait pas : « Confirmer le retrait » ne faisait rien de visible
 * (le refus s'écrivait en haut de la fiche, hors de l'écran). Retirer l'achat retire maintenant ses remboursements avec lui, la confirmation le dit avant.
 * Rend les écritures liées encore en vigueur, les plus éloignées d'abord (un avoir d'un avoir se retire avant son avoir).
 */
export function ecrituresLiees(pieceId: string): Transaction[] {
  const toutes = StorageService.getTransactions();
  const sortie: Transaction[] = [];
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

/** Retire une écriture : contre-paiement de chaque paiement en vigueur, puis annulation (refuse, avec sa raison, ce que `revertTransaction` refuse). */
async function retirerUne(piece: Transaction, paiements: FinancialPayment[], ctx: ContexteExecution): Promise<number> {
  const etapes = planRetrait(piece, paiements);
  if (etapes.length) await executerPlan(etapes, piece.id, ctx, vivante => vivante);
  const resultat = StorageService.revertTransaction(piece.id);
  if (!resultat.success) {
    throw new Error(etapes.length ? `${resultat.message} Déjà écrit : ${etapes.length > 1 ? 'paiements inversés' : 'paiement inversé'}. Vérifie l’opération dans la liste.` : resultat.message);
  }
  return etapes.length;
}

export async function retirerEcriture(pieceId: string, paiements: FinancialPayment[], ctx: ContexteExecution): Promise<void> {
  const piece = StorageService.getTransactions().find(t => t.id === pieceId);
  if (!piece) throw new Error('Écriture introuvable.');
  // Les remboursements liés d'abord : le registre refuse d'annuler une pièce qui a encore un avoir en vigueur.
  const retires: string[] = [];
  for (const liee of ecrituresLiees(pieceId)) {
    try { await retirerUne(liee, FinanceService.getPayments(), ctx); retires.push(liee.description); }
    catch (e) { throw new Error(`Le remboursement « ${liee.description} » lié à cette pièce ne se retire pas : ${e instanceof Error ? e.message : 'écriture impossible'}${retires.length ? ` Déjà retiré : ${retires.join(', ')}.` : ''}`); }
  }
  try { await retirerUne(piece, paiements, ctx); }
  catch (e) { throw new Error(`${e instanceof Error ? e.message : 'Retrait impossible.'}${retires.length ? ` Déjà retiré avant ce refus : ${retires.join(', ')}.` : ''}`); }
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
