import type { Batch, StockItem } from '../../types';
import { brewIngredients, actualAmount } from '../brewCompanion';
import { Units } from '../../services/units';
import { demandKey, resolveBudgetStock, type BrewBudgetDemand } from './brewBudget';
import { yeastQuantityInStockUnit } from '../yeastPitching';

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
    const assignYeast = (name: string, quantity: number, unit: string, stockItemRef: string) => {
      const linked = stocks.find(item => item.ref === stockItemRef);
      const yeast = recipe.yeast;
      const product = yeast?.pitching?.product;
      const recipeLotProductId = yeast?.pitching?.lot?.productId;
      const stockLotProductId = linked?.yeastLot?.productId;
      if (product && linked && (stockLotProductId && stockLotProductId !== product.id || recipeLotProductId && recipeLotProductId !== product.id)) {
        issues.push(`${name} : le produit associé au lot de stock contredit le format choisi dans la recette.`);
        return;
      }
      if (linked && Units.convert(quantity, unit, linked.unit) === null) {
        const formatProductId = stockLotProductId ?? recipeLotProductId;
        if (!product?.format || product.referenceId !== yeast?.hopIndexId || formatProductId !== product.id) {
          issues.push(`${name} : conversion de conditionnement impossible sans format exact et lot associé.`);
          return;
        }
        const converted = yeastQuantityInStockUnit(quantity, unit, product, linked.unit);
        if (converted === undefined) {
          issues.push(`${name} : unités incompatibles, conversion de conditionnement impossible.`);
          return;
        }
        assign(consumed, { key: demandKey(name, linked.unit, linked.ref), name, quantity: converted, unit: linked.unit, kind: 'ingredient', stockItemRef: linked.ref });
        return;
      }
      assign(consumed, { key: demandKey(name, unit, stockItemRef), name, quantity, unit, kind: 'ingredient', stockItemRef });
    };
    for (const ingredient of brewIngredients(recipe)) {
      if (ingredient.kind === 'water') continue;
      const replacement = state.additions?.[ingredient.id]?.replacement;
      const name = replacement?.name ?? ingredient.name;
      if (ingredient.id === 'yeast') {
        const addition = state.additions?.yeast;
        const preparation = batch.yeastPreparation;
        const starterMayHaveConsumedInoculum = !!preparation &&
          (preparation.status === 'started' || preparation.status === 'ready' || preparation.status === 'transferred' || preparation.status === 'cancelled' && preparation.steps.length > 0);
        if (starterMayHaveConsumedInoculum) {
          const inoculum = preparation!.inoculumUsed;
          const inoculumAdjusted = !!inoculum?.inventoryAdjustedAt || (preparation!.stockRegularization ?? []).some(entry => entry.kind === 'inoculum');
          const mediumAdjusted = (preparation!.stockRegularization ?? []).some(entry => entry.kind === 'medium');
          if (!inoculumAdjusted) {
            if (!inoculum || !Number.isFinite(inoculum.amount) || inoculum.amount <= 0 || !inoculum.unit.trim())
              issues.push('Inoculum du starter : quantité non consignée ; consommation à régulariser par comptage.');
            else if (!inoculum.stockItemRef)
              issues.push('Inoculum du starter : article de stock à associer pour régulariser la consommation.');
            else assignYeast('Inoculum de levure', inoculum.amount, inoculum.unit, inoculum.stockItemRef);
          }
          if (!mediumAdjusted) issues.push('Milieu du starter : stock à régulariser par comptage avant la clôture.');
        }
        if (state.pitchQuantityConfirmation === 'starter-transferred') {
          if (!preparation || preparation.status !== 'transferred')
            issues.push('Starter transféré : son exécution au brassin doit être consignée avant la clôture du stock.');
          continue;
        }
        if (state.pitchedAt == null) {
          issues.push('Levure : l’ajout réel doit être confirmé avant de déstocker la dose prévue.');
          continue;
        }
        if ((state.pitchQuantityConfirmation !== 'measured' && state.pitchQuantityConfirmation !== 'planned') || !addition ||
          !Number.isFinite(addition.amount) || addition.amount <= 0 || !(addition.unit ?? ingredient.unit)?.trim()) {
          issues.push('Levure : quantité réelle non renseignée ; consommation à régulariser, sans reprendre la dose prévue.');
          continue;
        }
        const unit = addition.unit ?? ingredient.unit;
        const yeast = recipe.yeast;
        const yeastStockItemRef = replacement ? undefined : yeast?.stockItemRef;
        if (!yeastStockItemRef) {
          issues.push(`${name} : article ou lot de levure à associer explicitement avant le déstockage.`);
          continue;
        }
        assignYeast(name, addition.amount, unit, yeastStockItemRef);
        continue;
      }
      const quantity = actualAmount(ingredient, state) ?? ingredient.planned;
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
