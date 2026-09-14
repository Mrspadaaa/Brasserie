import type { Fermentable, HopIngredient, StockItem, YeastSpec } from '../types';
import { applyMaltFacts, applyHopFacts, applyYeastFacts, factsFromStock, ingredientKey } from './ingredientFacts';

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
  const cached = (kind: 'malt' | 'houblon' | 'levure', name: string) => {
    const rows = stock.filter(s => ingredientKey(kind, s.name) === ingredientKey(kind, name) &&
      s.category.toLocaleLowerCase('fr') === kind && s.technicalSource?.trim());
    return rows.length === 1 ? factsFromStock(rows[0]) : undefined;
  };
  const malt = fermentables.map(f => {
    const facts = cached('malt', f.name);
    return facts ? applyMaltFacts(f, facts) : f;
  });
  const hop = hops.map(h => {
    const facts = cached('houblon', h.name);
    return facts ? applyHopFacts(h, facts) : h;
  });
  const stockYeast = cached('levure', yeast.name);
  return {
    fermentables: malt,
    hops: hop,
    yeast: stockYeast ? applyYeastFacts(yeast, stockYeast) : yeast
  };
}
