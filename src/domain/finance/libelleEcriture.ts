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
  const kind = transactionKind(tx);
  if (kind === 'withdrawal') return 'Prélèvement privé';
  if (kind === 'income' && tx.subcategory === 'Autre recette') return 'Autre entrée';
  if (kind === 'expense' && /^imp[oô]t/i.test(tx.subcategory ?? '')) return 'Impôts';
  return parDefaut;
}
