import type { Fermentable, HopIngredient, StockItem, YeastSpec } from '../types';
import { applyMaltFacts, applyHopFacts, applyYeastFacts, factsForRecipeStockItem } from './ingredientFacts';

/**
 * Complete facts that are already present in the brewer's stock. This path is
 * intentionally independent from the bundled yeast catalogue so recipe
 * editors can apply local stock data without downloading the large library.
 */
export function completeFromStockReferences(
  fermentables: Fermentable[],
  hops: HopIngredient[],
  yeast: YeastSpec,
  stock: StockItem[]
) {
  const malt = fermentables.map(f => {
    const facts = factsForRecipeStockItem('malt', f, stock);
    return facts ? applyMaltFacts(f, facts) : f;
  });
  const hop = hops.map(h => {
    const facts = factsForRecipeStockItem('houblon', h, stock);
    return facts ? applyHopFacts(h, facts) : h;
  });
  const stockYeast = factsForRecipeStockItem('levure', yeast, stock);
  return {
    fermentables: malt,
    hops: hop,
    yeast: stockYeast ? applyYeastFacts(yeast, stockYeast) : yeast
  };
}
