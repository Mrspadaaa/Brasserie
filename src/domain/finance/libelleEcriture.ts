import type { FinanceTransaction } from './types';
import { transactionKind } from './ledger';

/**
 * E35-3, E35-15, E35-16 (23.11 soir) : le mot que la ligne et la fiche d'une écriture disent après son nom. Il vient de ce que l'écriture EST, pas
 * seulement de sa catégorie de rangement : un prélèvement privé (« Pour moi ») rangé en `apports` se lisait « Apports privés », l'impôt sur la bière
 * rangé en `divers` se lisait « Autres frais », et une autre entrée rangée en `recettes` se lisait « Ventes ».
 *
 * `parDefaut` : le libellé de la catégorie (`CATEGORY_LABELS`), gardé pour tout le reste ; le domaine n'importe pas l'interface.
 */
export function libelleEcriture(tx: FinanceTransaction, parDefaut: string): string {
  if (transactionKind(tx) === 'withdrawal') return 'Prélèvement privé';
  if (estAutreEntree(tx)) return 'Autre entrée';
  if (estImpot(tx)) return 'Impôts';
  return parDefaut;
}

/** « Autre recette » : la rentrée qui n'est ni une vente ni un apport (`GENRES.autrei`). E38-2 : une règle, lue par la ligne, les groupes, la Synthèse, les piles et le Calendrier. */
export const estAutreEntree = (tx: FinanceTransaction): boolean => transactionKind(tx) === 'income' && tx.subcategory === 'Autre recette';

/** L'impôt sur la bière et les impôts de l'entreprise : une charge dont la précision commence par « Impôt ». E38-7 : un groupe, un poste de pile, un mot (« Impôts »). */
export const estImpot = (tx: FinanceTransaction): boolean => transactionKind(tx) === 'expense' && /^imp[oô]t/i.test(tx.subcategory ?? '');
