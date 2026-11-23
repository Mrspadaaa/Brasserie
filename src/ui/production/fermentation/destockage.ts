import type { Batch, HopIngredient, StockItem } from '../../../types';
import { Units } from '../../../services/units';
import { demandKey, resolveBudgetStock } from '../../../domain/finance/brewBudget';
import { prepareBrewStockConsumption, type BrewStockConsumption, type BrewStockMovement } from '../../../domain/finance/brewStockConsumption';

/**
 * gfc n° 3 : « Ajouté auj. » déstocke UN houblon, pas tous. `StorageService.completeBrewStock(…, 'remaining')` consomme toutes les lignes
 * réservées d'un coup et marque l'étape faite ; ici, la ligne du houblon touché sort seule du stock, les autres restent réservées.
 * Fonction pure : l'appelant persiste (stock, mouvement, brassin).
 */

type LigneStock = BrewStockConsumption['pendingItems'][number];
type Bindings = Record<string, string> | undefined;

/** Le houblon de la ligne dry hop du brassin : celui que la ligne réservée porte (association de stock explicite, sinon nom unique). */
export function refDuHoublon(h: Pick<HopIngredient, 'name' | 'weightG' | 'stockItemRef'>, stocks: StockItem[], bindings?: Bindings): string | null {
  const cle = demandKey(h.name, 'g', h.stockItemRef);
  const { item } = resolveBudgetStock({ key: cle, name: h.name, quantity: h.weightG, unit: 'g', kind: 'ingredient', stockItemRef: h.stockItemRef }, stocks, bindings?.[cle]);
  return item?.ref ?? null;
}

export interface PlanDestockage {
  ok: boolean;
  /** Le brassin à enregistrer (étape `remaining` complétée seulement quand plus rien n'attend). */
  batch: Batch | null;
  mouvements: BrewStockMovement[];
  stockUpdates: StockItem[];
  issues: string[];
}

/** Sortie du stock d'un seul houblon réservé. Rien n'est écrit : le plan rend les mouvements et le brassin corrigé. */
export function planDestockageHoublon(batch: Batch, houblon: Pick<HopIngredient, 'name' | 'weightG' | 'stockItemRef'>, stocks: StockItem[], bindings?: Bindings, now?: string): PlanDestockage {
  const refus = (issues: string[]): PlanDestockage => ({ ok: false, batch: null, mouvements: [], stockUpdates: [], issues });
  const sc = batch.stockConsumption;
  if (!sc) return refus(['La consommation du jour de brassage doit être vérifiée avant les ajouts restants.']);
  const ref = refDuHoublon(houblon, stocks, bindings);
  if (!ref) return refus([`${houblon.name} : article de stock à associer avant le déstockage.`]);
  const ligne = (sc.pendingItems ?? []).find(l => l.stockItemRef === ref);
  if (!ligne) return refus([`${houblon.name} : rien de réservé au stock pour ce houblon.`]);
  const item = stocks.find(s => s.ref === ref);
  const dose = item ? Units.convert(houblon.weightG, 'g', ligne.unit) : null;
  // Une ligne partagée par deux ajouts du même article (même référence) : seule la dose de ce houblon sort.
  const sortie: LigneStock = { ...ligne, quantity: dose !== null && dose > 0 ? Math.min(ligne.quantity, dose) : ligne.quantity };
  const reste = ligne.quantity - sortie.quantity;
  const autres = (sc.pendingItems ?? []).filter(l => l !== ligne);
  const seul = { ...batch, stockConsumption: { ...sc, pendingItems: [sortie] } } as Batch & { stockConsumption: BrewStockConsumption };
  const plan = prepareBrewStockConsumption(seul, stocks, { stage: 'remaining', bindings, now });
  if (plan.status !== 'ready') return refus(plan.issues.length ? plan.issues : ['Déstockage impossible pour ce houblon.']);
  const pendingItems = reste > 1e-9 ? [...autres, { ...ligne, quantity: reste }] : autres;
  const ref2 = plan.batch.stockConsumption as BrewStockConsumption;
  const completedStages = pendingItems.length ? (sc.completedStages ?? []) : ref2.completedStages;
  return {
    ok: true, mouvements: plan.movements, stockUpdates: plan.stockUpdates, issues: [],
    batch: { ...batch, stockConsumption: { ...ref2, pendingItems, completedStages } } as Batch
  };
}
