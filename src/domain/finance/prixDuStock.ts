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

/** Contenance d'une bouteille de 33 cl, en litres. */
export const LITRES_33CL = 0.33;
export interface Marge33cl {
  /** Prix HT du tarif 33 cl de cette bière ; `null` si aucun tarif (à poser). */
  prixHT: number | null;
  /** Coût d'une 33 cl : coût du litre tout compris × 0,33 (emballage et impôt moyennés sur le brassin : une approximation, dite « ≈ »). */
  cout: number | null;
  /** Prix − coût ; `null` dès qu'un des deux manque : jamais 0 inventé. */
  marge: number | null;
}
/** N6 (21.11) : la marge par 33 cl, au même endroit que le coût du litre. Coût du litre inconnu (litres nets, prix) : marge inconnue. */
export function margePar33cl(input: { litreComplet: number | null | undefined; prixHT: number | null | undefined }): Marge33cl {
  const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
  const prixHT = ok(input.prixHT) ? input.prixHT : null;
  const cout = ok(input.litreComplet) ? Math.round(input.litreComplet * LITRES_33CL * 100) / 100 : null;
  return { prixHT, cout, marge: prixHT !== null && cout !== null ? Math.round((prixHT - cout) * 100) / 100 : null };
}
