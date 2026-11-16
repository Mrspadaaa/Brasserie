import { FirestoreRepo } from '../../../services/firestoreRepo';
import { StorageService } from '../../../services/storage';
import { FinanceService } from '../../../services/financeService';
import { isActiveTransaction } from '../../../domain/finance/ledger';

/**
 * u2, constats 21 et 27 (jeu en ligne du 16.11) : une prévision et un projet de matériel se suppriment ; une pièce (transaction) et un paiement, jamais (firestore.rules :
 * `financialPlans` est une collection métier supprimable, `transactions` non). Le geste passe par `FirestoreRepo.remove`, comme `StorageService` pour ses collections.
 *
 * Projet de matériel (constats 8 et 27, fusion du 16.11) : une seule suppression, `StorageService.deleteUpgradePlan`. Le projet part même s'il a des achats liés :
 * ils restent dans les comptes (leur `finance.planId` ne pointe plus sur rien ; les lecteurs font `plan ? … : undefined`). Un refus laisserait coincé un projet archivé
 * qui a ses achats, le cas courant. L'idée de matériel d'origine part avec lui, sinon le projet « ombre » renaîtrait d'elle.
 *
 * Prévision : une pièce encore liée (`finance.planId`) la garde ; le message dit de passer son état à « Annulée ».
 */
export function supprimerPlan(id: string): void {
  const plan = FinanceService.getPlans().find(p => p.id === id);
  if (!plan) return;
  if (plan.source === 'equipment') { StorageService.deleteUpgradePlan(plan); return; }
  if (StorageService.getTransactions().some(tx => isActiveTransaction(tx) && tx.finance?.planId === id))
    throw new Error('Des pièces sont liées à cette prévision : passe son état à « Annulée » plutôt.');
  const enBase = (FirestoreRepo.all('financialPlans') as Array<{ id?: string; __docId?: string }>).some(p => p.id === id || p.__docId === id);
  if (enBase) FirestoreRepo.remove('financialPlans', id);
}
