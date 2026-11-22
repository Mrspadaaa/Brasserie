// Ce que l'écran fait d'une ligne lue : `groupeDe(contexteDe(ligne), kind, nom, stockCategory, categorieArticle, categorieDeLaDepense)` (ExpenseSheet.tsx `groupeDeLigne`).
import { contexteDe } from '../../../../src/services/stockLineMatching';
import { groupeDe, type GroupeCle } from '../../../../src/ui/depense/groupes';

/** Le `kind` de la lecture passé par `scanKind` de l'écran (stock → ingredient, unknown → other). */
export const scanKind = (kind: string) => (kind === 'stock' ? 'ingredient' : kind === 'unknown' ? 'other' : kind);
/** `categorie` (D306) : la catégorie de la dépense (« Pour quoi ? »), absente pour les tests d'avant la Rénovation. */
export const famille = (nom: string, kind = 'stock', stockCategory = '', reference = '', categorieArticle?: string, categorie?: string): GroupeCle =>
  groupeDe(contexteDe({ description: nom, kind: scanKind(kind), reference, stockCategory } as any), scanKind(kind), nom, stockCategory, categorieArticle, categorie);
