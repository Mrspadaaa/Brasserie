import type { Batch, StockItem } from '../../types';
import { brewIngredients, actualAmount } from '../brewCompanion';
import { Units } from '../../services/units';
import { demandKey, resolveBudgetStock, type BrewBudgetDemand } from './brewBudget';

export interface BrewStockConsumptionItem { stockItemRef: string; quantity: number; unit: string }
export interface BrewStockConsumption {
  historicalConfirmation?: { choice: 'already-consumed'; confirmedAt: string };
  appliedAt: string;
  eventId: string;
  items: BrewStockConsumptionItem[];
  pendingItems: BrewStockConsumptionItem[];
  completedStages: Array<'brewday' | 'remaining'>;
}
export interface BrewStockMovement {
  id: string;
  batchId: string;
  stockItemRef: string;
  itemRef: string;
  unit: string;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
}
export interface BrewConsumptionPlan {
  status: 'ready' | 'already-applied' | 'needs-review';
  batch: Batch & { stockConsumption?: BrewStockConsumption };
  stockUpdates: StockItem[];
  movements: BrewStockMovement[];
  issues: string[];
}

/** Pure, atomic write proposal. The caller persists all returned writes together, after checking status. */
export function prepareBrewStockConsumption(batch: Batch & { stockConsumption?: BrewStockConsumption }, stocks: StockItem[], options: {
  now?: string;
  stage?: 'brewday' | 'remaining';
  bindings?: Record<string, string>;
} = {}): BrewConsumptionPlan {
  const stage = options.stage ?? 'brewday';
  const empty = (status: BrewConsumptionPlan['status'], issues: string[] = []): BrewConsumptionPlan => ({ status, batch, stockUpdates: [], movements: [], issues });
  const previous = batch.stockConsumption;
  if (previous?.completedStages?.includes(stage)) return empty('already-applied');
  if (stage === 'brewday' && previous?.appliedAt) return empty('already-applied');
  if (!batch.recipeSnapshot) return empty('needs-review', ['Recette figée absente : vérifier les ingrédients avant de déstocker ce brassin historique.']);
  if (stage === 'remaining' && !previous) return empty('needs-review', ['La consommation du jour de brassage doit être vérifiée avant les ajouts restants.']);
  const now = options.now ?? new Date().toISOString();
  const eventId = `BREW-STOCK-${batch.id}-${stage}`;
  const issues: string[] = [];
  const consumed = new Map<string, BrewStockConsumptionItem>();
  const pending = new Map<string, BrewStockConsumptionItem>();
  const append = (target: Map<string, BrewStockConsumptionItem>, item: BrewStockConsumptionItem) => {
    const old = target.get(item.stockItemRef);
    target.set(item.stockItemRef, old ? { ...old, quantity: old.quantity + item.quantity } : { ...item });
  };
  const assign = (target: Map<string, BrewStockConsumptionItem>, demand: BrewBudgetDemand) => {
    if (!Number.isFinite(demand.quantity) || demand.quantity < 0) { issues.push(`${demand.name} : quantité consommée invalide`); return; }
    if (!(demand.quantity > 0)) return;
    const { item, issue } = resolveBudgetStock(demand, stocks, options.bindings?.[demand.key]);
    if (!item) {
      // Network water and water treatments without inventory records are expenses, not stock movements.
      if (demand.kind === 'ingredient') issues.push(`${demand.name} : ${issue}`);
      return;
    }
    const qty = Units.convert(demand.quantity, demand.unit, item.unit);
    if (qty === null) { issues.push(`${demand.name} : ${demand.unit} incompatible avec ${item.unit}`); return; }
    append(target, { stockItemRef: item.ref, quantity: qty, unit: item.unit });
  };
  if (stage === 'remaining') {
    for (const line of previous.pendingItems ?? []) append(consumed, line);
  } else {
    const recipe = batch.recipeSnapshot;
    const state = batch.brewDay ?? { steps: [], currentIndex: 0 };
    for (const ingredient of brewIngredients(recipe)) {
      if (ingredient.kind === 'water') continue;
      const replacement = state.additions?.[ingredient.id]?.replacement;
      const name = replacement?.name ?? ingredient.name;
      const quantity = actualAmount(ingredient, state);
      const adjunct = ingredient.id.startsWith('adjunct-') ? recipe.adjuncts?.[Number(ingredient.id.slice(8))] : undefined;
      const source = ingredient.fermentableIndex != null ? recipe.fermentables[ingredient.fermentableIndex] : ingredient.hopIndex != null ? recipe.hops[ingredient.hopIndex] : ingredient.id === 'yeast' ? recipe.yeast : adjunct;
      const kind = ingredient.kind === 'salt' || ingredient.kind === 'acid' ? 'treatment' : 'ingredient';
      const stockItemRef = !replacement && source ? (source as { stockItemRef?: string }).stockItemRef : undefined;
      assign(adjunct && /ferment/i.test(adjunct.step) ? pending : consumed, { key: demandKey(name, ingredient.unit, stockItemRef), name, quantity, unit: ingredient.unit, kind, stockItemRef });
    }
    for (const f of recipe.fermentables.filter(f => f.use === 'fermentation')) assign(pending, { key: demandKey(f.name, 'kg', f.stockItemRef), name: f.name, quantity: f.weightKg, unit: 'kg', kind: 'ingredient', stockItemRef: f.stockItemRef });
    for (const h of recipe.hops.filter(h => h.stage === 'dryHop')) assign(pending, { key: demandKey(h.name, 'g', h.stockItemRef), name: h.name, quantity: h.weightG, unit: 'g', kind: 'ingredient', stockItemRef: h.stockItemRef });
  }
  const stockUpdates: StockItem[] = [];
  const movements: BrewStockMovement[] = [];
  for (const line of consumed.values()) {
    const item = stocks.find(s => s.ref === line.stockItemRef);
    if (!item || !Units.areCompatible(line.unit, item.unit)) { issues.push(`${line.stockItemRef} : article ou unité à vérifier`); continue; }
    const quantity = Units.convert(line.quantity, line.unit, item.unit)!;
    if (!Number.isFinite(item.currentStock) || item.currentStock + 1e-8 < quantity) { issues.push(`${item.name} : ${Units.format(quantity, item.unit)} consommés, ${Units.format(item.currentStock, item.unit)} en stock. Corriger l’inventaire.`); continue; }
    const newStock = Units.round(Math.max(0, item.currentStock - quantity), item.unit);
    stockUpdates.push({ ...item, currentStock: newStock, reorder: newStock <= item.minStock });
    movements.push({ id: `${eventId}-${item.ref}`, batchId: batch.id, stockItemRef: item.ref, itemRef: item.ref, unit: item.unit, delta: -quantity, previousStock: item.currentStock, newStock, reason: stage === 'brewday' ? 'Brassage terminé' : 'Ajouts de fermentation terminés', timestamp: now });
  }
  if (issues.length) return empty('needs-review', issues);
  return { status: 'ready', batch: { ...batch, stockConsumption: {
    appliedAt: previous?.appliedAt ?? now, eventId, completedStages: [...(previous?.completedStages ?? []), stage],
    items: [...(previous?.items ?? []), ...consumed.values()], pendingItems: [...pending.values()]
  } }, stockUpdates, movements, issues: [] };
}
