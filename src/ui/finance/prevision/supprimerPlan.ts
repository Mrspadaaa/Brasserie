import { FirestoreRepo } from '../../../services/firestoreRepo';
import { StorageService } from '../../../services/storage';
import { FinanceService } from '../../../services/financeService';
import { isActiveTransaction } from '../../../domain/finance/ledger';

/**
 * u2, constats 21 et 27 (jeu en ligne du 16.11) : une prévision et un projet de matériel se suppriment ; une pièce (transaction) et un paiement, jamais (firestore.rules :
 * `financialPlans` est une collection métier supprimable, `transactions` non). Le geste passe par `FirestoreRepo.remove`, comme `StorageService` pour ses collections.
 *
 * Une pièce encore liée au plan (`finance.planId`) le garde : la retirer laisserait la pièce pointer dans le vide ; le message dit de passer l'état à « Annulée » (prévision) ou d'archiver (projet).
 * Un projet venu d'une ancienne idée (« UPGRADE-<id> », sans document `financialPlans`) se supprime à sa source, l'idée de matériel.
 */
export function supprimerPlan(id: string): void {
  const plan = FinanceService.getPlans().find(p => p.id === id);
  if (!plan) return;
  const projet = plan.source === 'equipment';
  if (StorageService.getTransactions().some(tx => isActiveTransaction(tx) && tx.finance?.planId === id))
    throw new Error(projet ? 'Des pièces sont liées à ce projet : archive-le plutôt.' : 'Des pièces sont liées à cette prévision : passe son état à « Annulée » plutôt.');
  const enBase = (FirestoreRepo.all('financialPlans') as Array<{ id?: string; __docId?: string }>).some(p => p.id === id || p.__docId === id);
  if (enBase) FirestoreRepo.remove('financialPlans', id);
  const idee = plan.upgrade?.sourceCreativeItemId;
  if (idee && !enBase) StorageService.deleteCreativeItem(idee);
}
