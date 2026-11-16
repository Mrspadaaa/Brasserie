import type { RecipeStockComparison } from '../stockLevel';

/** Mot unique, partagé avec la recette (point 37, ab6c4327) : un stock négatif est une donnée fausse, signalée à part. */
export const MOT_STOCK_NEGATIF = 'stock négatif : à corriger';

export type ManqueRecette =
  | { genre: 'manque'; quantite: number }
  | { genre: 'couvert' }
  | { genre: 'stock-negatif' }
  | { genre: 'inconnu' };

/**
 * Point 37 (16.11) : ce qu'il manque pour UNE recette. `shortage` est le chiffre de « À commander » (besoin de cette recette + prévu
 * ailleurs − stock) et peut dépasser ce que la recette demande (« 49 kg » pour 5 kg). Même règle que la recette :
 * manque = min(shortage, besoin de la recette) ; un stock négatif ne gonfle jamais le manque, il se dit à part.
 * `quantity` et `shortage` sont dans l'unité de l'article.
 */
export function manqueRecette(c: Pick<RecipeStockComparison, 'match' | 'stockItem' | 'quantity' | 'shortage'>): ManqueRecette {
  const stock = c.stockItem?.currentStock;
  if (c.match === 'linked' && typeof stock === 'number' && Number.isFinite(stock) && stock < 0) return { genre: 'stock-negatif' };
  if (c.match !== 'linked' || c.shortage === null) return { genre: 'inconnu' };
  const manque = c.quantity !== null ? Math.min(c.shortage, c.quantity) : c.shortage;
  return manque > 0 ? { genre: 'manque', quantite: manque } : { genre: 'couvert' };
}
