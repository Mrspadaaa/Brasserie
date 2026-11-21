import type { StockItem } from '../../types';
import type { BrewBudgetLine, BrewPrice } from './brewBudget';

/**
 * WF2-8 : un brassin planifié dont les ingrédients ont un prix au stock (`pricePerUnit`) restait « pas encore chiffré »,
 * parce que cet ancien prix ne dit pas s'il est HT ou TTC et que le budget exige de le confirmer, ligne par ligne.
 * Ici, UN geste propose de reprendre ces prix : une proposition (R1, R8), jamais posée seule. Chaque prix repris est
 * marqué estimé (origine « manual », note qui le dit), en TTC (le plus prudent pour un non-assujetti) ; le brasseur le corrige ligne par ligne.
 * Un article sans prix au stock n'est jamais repris, et un prix jamais compté 0.
 */
export const ANCIEN_PRIX_A_CONFIRMER = 'Ancien prix à confirmer (HT ou TTC)';
export const NOTE_PRIX_DU_STOCK = 'Prix du stock repris (HT ou TTC non précisé : TTC supposé) · estimé';

export function prixDuStockPropose(lines: BrewBudgetLine[], stockItems: StockItem[], aujourdhui: string): Record<string, BrewPrice> {
  const propose: Record<string, BrewPrice> = {};
  for (const line of lines) {
    if (line.price || !line.issues.includes(ANCIEN_PRIX_A_CONFIRMER)) continue;
    const item = stockItems.find(s => s.ref === line.stockItemRef);
    const prix = item?.pricePerUnit;
    if (!item || typeof prix !== 'number' || !Number.isFinite(prix) || prix <= 0) continue;
    propose[line.key] = { amount: prix, quantity: 1, unit: item.unit, basis: 'TTC', tvaRate: 0, source: 'manual', date: aujourdhui, note: NOTE_PRIX_DU_STOCK };
  }
  return propose;
}
