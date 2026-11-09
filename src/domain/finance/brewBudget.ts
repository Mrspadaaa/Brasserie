import { batchDisplayDate } from '../batchSchedule';
import type { Batch, Recipe, RecipeSnapshot, StockItem } from '../../types';
import { Units } from '../../services/units';
import { normalizeRecipe, ingredientsOf } from '../recipeSnapshot';
import { SALTS, ACIDS } from '../water/substances';
import type { FinanceTransaction, FinancialPlan } from './types';
import { beerTaxForVolume } from './swissBeerTax';

export interface BrewPrice {
  /** Price for quantity of unit, not necessarily the stock unit. */
  amount: number;
  quantity: number;
  unit: string;
  basis: 'HT' | 'TTC';
  tvaRate: number;
  source: 'manual' | 'invoice' | 'quote';
  date: string;
  note?: string;
  /** Only purchase in whole packs. Absent means quantities may be bought loose. */
  packQuantity?: number;
}
export interface BrewBudgetDemand {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  kind: 'ingredient' | 'water' | 'treatment';
  stockItemRef?: string;
}
export type BrewCostKey = 'energy' | 'cleaning' | 'packaging' | 'beerTax';
export type BrewCashTreatment = 'additional' | 'included-in-recurring';
export const BREW_COST_LABELS: Record<BrewCostKey, string> = {
  energy: 'Énergie', cleaning: 'Nettoyage', packaging: 'Conditionnement', beerTax: 'Impôt sur la bière'
};
export interface BrewBudgetSettings {
  costs?: Partial<Record<BrewCostKey, { enabled: boolean; amountTTC?: number; tvaRate?: number; cashTreatment?: BrewCashTreatment }>>;
  annualVolumeL?: number;
  annualFixedCHF?: number;
  annualDepreciationCHF?: number;
  includeFixed?: boolean;
  includeDepreciation?: boolean;
  /** Cash already appears in the recurring expense planner. Never add these allocations to purchases. */
}
export interface BrewBudgetLine extends BrewBudgetDemand {
  stockItemRef?: string;
  available: number;
  reserved: number;
  missing: number;
  purchaseQuantity: number;
  price?: BrewPrice;
  inventoryPrice?: BrewPrice;
  cashTreatment: BrewCashTreatment;
  consumedCost: number | null;
  /** Part de `consumedCost` déjà payée : le stock en main, à sa valeur pondérée. null si le prix manque. */
  stockCost?: number | null;
  /** Part de `consumedCost` à acheter (manque × prix, sans l'arrondi au sac). `stockCost + purchaseCost = consumedCost`. */
  purchaseCost?: number | null;
  purchaseTTC: number | null;
  issues: string[];
}
export interface BrewBudgetSnapshot {
  id: string;
  createdAt: string;
  recipeId?: string;
  batchId?: string;
  title: string;
  brewDate: string;
  volumeL: number;
  netVolumeL: number;
  recipeSnapshot: RecipeSnapshot;
  bindings: Record<string, string>;
  prices: Record<string, BrewPrice>;
  cashTreatments: Record<string, BrewCashTreatment>;
  settings: BrewBudgetSettings;
  lines: BrewBudgetLine[];
  ingredientsCost: number;
  purchasesTTC: number;
  operatingCashTTC: number;
  operatingCost: number;
  cashRequiredTTC: number;
  fixedAllocation: number;
  depreciationAllocation: number;
  totalCost: number;
  costPerL: number | null;
  complete: boolean;
  issues: string[];
  /**
   * Trois notions du coût (d1, 09.11), côté COÛT et non côté caisse : `dejaPaye + aPayer + annee = totalCost` au centime. Facultatives : un instantané
   * enregistré avant n'en a pas (`troisNotions` rend alors null). `aPayer` n'est pas l'argent à sortir : un frais « inclus dans le récurrent » y reste,
   * un assujetti le lit en HT, un sac entier le sous-estime. L'argent à sortir est `cashRequiredTTC`.
   */
  dejaPaye?: number;
  aPayer?: number;
  annee?: number;
  /** Argent sorti pour un sac entier mais non consommé (achats TTC − coût des achats). 0 si aucun écart ; null quand la TVA ou un frais récurrent brouille la lecture. */
  resteEnStock?: number | null;
  /** Frais d'emballage du brassin, dans la base du coût (HT si assujetti) ; 0 si le poste est désactivé ; null si inconnu. */
  packagingCost?: number | null;
  /** Impôt sur la bière du brassin ; 0 si désactivé ou exonéré ; null si inconnu. */
  beerTaxCost?: number | null;
  beerTaxSource?: 'calcule' | 'manuel' | 'inconnu';
  beerTaxExonere?: boolean;
  /** 'saisi' : litres nets donnés. 'volume-a-brasser' : repli sur le volume de la recette, un estimé : `troisNotions` le déclare incomplet. */
  netVolumeSource?: 'saisi' | 'volume-a-brasser';
}
export interface EstimateBrewBudgetInput {
  recipe: Recipe;
  stockItems: StockItem[];
  batches: Batch[];
  brewDate: string;
  batchId?: string;
  netVolumeL?: number;
  /** Densité initiale du brassin (impôt calculé). Absente : le montant manuel garde son chemin. */
  og?: string | number;
  /** Alcool en % vol. : 0,5 ou moins, impôt nul. */
  abv?: string | number;
  /** Réduction petit brasseur confirmée pour l'année du brassin ; absente, le coût du litre est au taux plein (prudent). */
  beerTaxReductionPct?: number;
  bindings?: Record<string, string>;
  prices?: Record<string, BrewPrice>;
  cashTreatments?: Record<string, BrewCashTreatment>;
  settings?: BrewBudgetSettings;
  isTvaRegistered?: boolean;
  now?: string;
  transactions?: FinanceTransaction[];
  savedEstimates?: BrewBudgetSnapshot[];
}
const finite = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const money = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const nameKey = (s: string) => s.trim().toLocaleLowerCase('fr-CH');
export const demandKey = (name: string, unit: string, stockItemRef?: string) => `${nameKey(name)}|${unit.trim().toLowerCase()}${stockItemRef ? `|ref:${stockItemRef}` : ''}`;

/** Whole-recipe requirements, including additions after the brew day. */
export function brewBudgetDemands(source: Recipe | RecipeSnapshot): BrewBudgetDemand[] {
  const recipe = normalizeRecipe(source as Recipe);
  const demands = new Map<string, BrewBudgetDemand>();
  const add = (name: string, quantity: number, unit: string, kind: BrewBudgetDemand['kind'], ref?: string) => {
    if (!name.trim() || !finite(quantity) || quantity === 0) return;
    const key = demandKey(name, unit, ref);
    const previous = demands.get(key);
    if (previous) previous.quantity += quantity;
    else demands.set(key, { key, name, quantity, unit, kind, ...(ref ? { stockItemRef: ref } : {}) });
  };
  recipe.fermentables.forEach(f => {
    // Recovered mash grain belongs to the source brew, not a new purchase.
    if (recipe.nolo?.enabled && recipe.nolo.process === 'secondRunnings' && f.kind === 'grain' && (f.use ?? 'empatage') === 'empatage') return;
    add(f.name, f.weightKg, 'kg', 'ingredient', (f as { stockItemRef?: string }).stockItemRef);
  });
  recipe.hops.forEach(h => add(h.name, h.weightG, 'g', 'ingredient', (h as { stockItemRef?: string }).stockItemRef));
  if (recipe.yeast) add(recipe.yeast.name, recipe.yeast.qty, recipe.yeast.unit, 'ingredient', (recipe.yeast as { stockItemRef?: string }).stockItemRef);
  recipe.adjuncts?.forEach(a => add(a.name, a.amount, a.unit, 'ingredient', (a as { stockItemRef?: string }).stockItemRef));
  const plan = recipe.waterPlan;
  if (plan) {
    const mashRO = plan.mashWaterL * plan.diRatioPct / 100;
    const spargeRO = plan.spargeWaterL * (plan.spargeDiRatioPct ?? plan.diRatioPct) / 100;
    add('Eau osmosée', mashRO + spargeRO, 'L', 'water');
    add('Eau du réseau', plan.mashWaterL + plan.spargeWaterL - mashRO - spargeRO, 'L', 'water');
    for (const id of Object.keys(SALTS) as Array<keyof typeof SALTS>) {
      add(SALTS[id].name, (plan.mash?.[id] ?? 0) + (plan.sparge?.[id] ?? 0), 'g', 'treatment');
    }
    if (plan.acid) add(ACIDS[plan.acid.id].name, plan.acid.mash + plan.acid.sparge, ACIDS[plan.acid.id].unit, 'treatment');
  }
  return [...demands.values()];
}

/** A stale explicit binding must never silently switch to another product. */
export function resolveBudgetStock(demand: BrewBudgetDemand, stock: StockItem[], binding?: string): { item?: StockItem; issue?: string } {
  if (binding === '') return { issue: 'Article à associer ou prix à renseigner' };
  const ref = binding ?? demand.stockItemRef;
  if (ref) {
    const item = stock.find(s => s.ref === ref);
    return item ? { item } : { issue: 'Article associé introuvable' };
  }
  const matches = stock.filter(s => nameKey(s.name) === nameKey(demand.name));
  return matches.length === 1 ? { item: matches[0] } : { issue: matches.length ? 'Plusieurs articles portent ce nom : choisir le bon' : 'Article à associer ou prix à renseigner' };
}

/** Strict calendar comparison; invalid dates are treated as prior commitments, and surfaced. */
export function brewBudgetDateKey(value: string): string | null {
  const swiss = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value ?? '');
  const iso = swiss ? `${swiss[3]}-${swiss[2]}-${swiss[1]}` : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '')) return null;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

function recipeForBatch(batch: Batch): Recipe {
  if (batch.recipeSnapshot) return { ...batch.recipeSnapshot, id: batch.recipeSnapshot.sourceRecipeId ?? batch.recipeRef ?? batch.id } as Recipe;
  const old = ingredientsOf(batch);
  return { ...old, adjuncts: batch.adjuncts, id: batch.id, name: batch.name, style: batch.style } as unknown as Recipe;
}

/** A recipe intention can describe the new batch, but matching alone never authorizes retiring it. */
export function matchingRecipeBrewPlans(plans: FinancialPlan[], snapshot: BrewBudgetSnapshot): FinancialPlan[] {
  if (!snapshot.batchId) return [];
  const recipeId = snapshot.recipeSnapshot.sourceRecipeId ?? snapshot.recipeId;
  const date = brewBudgetDateKey(snapshot.brewDate);
  return plans.filter(plan => {
    if (plan.source !== 'brew' || plan.status !== 'active' || !plan.brewEstimate || !date) return false;
    const prior = plan.brewEstimate as BrewBudgetSnapshot;
    return !prior.batchId && !plan.batchId && (prior.recipeSnapshot?.sourceRecipeId ?? prior.recipeId) === recipeId
      && brewBudgetDateKey(prior.brewDate) === date && Math.abs(prior.volumeL - snapshot.volumeL) < 1e-6;
  });
}

/** Annual overhead excludes energy/water already assigned to individual brews. */
export function annualBrewFixedCosts(plans: FinancialPlan[]): { amountCHF: number | undefined; warnings: string[] } {
  const recurring = plans.filter(plan => plan.status === 'active' && plan.direction === 'out' && plan.recurrence);
  if (!recurring.length) return { amountCHF: undefined, warnings: [] };
  const unknown = recurring.filter(plan => !plan.costAllocation || !Number.isSafeInteger(plan.amountCents) || plan.amountCents < 0);
  if (unknown.length) return { amountCHF: undefined, warnings: [`Classez les charges récurrentes « ${unknown.map(plan => plan.title).join(' », « ')} » dans le planning, ou renseignez ici un montant annuel hors énergie, eau et frais déjà comptés par brassin.`] };
  return { amountCHF: money(recurring.filter(plan => plan.costAllocation === 'fixed').reduce((sum, plan) => sum + plan.amountCents * (plan.recurrence!.frequency === 'monthly' ? 12 : plan.recurrence!.frequency === 'quarterly' ? 4 : 1) / 100, 0)), warnings: [] };
}

type PricedLine = NonNullable<FinanceTransaction['finance']>['lines'][number];
/**
 * Coût d'une ligne liée à un article : son montant, plus celui des lignes de service qui lui sont rattachées (la mouture),
 * à condition que le lien tienne (service, montant positif, même quantité, même unité). Un lien qui ne tient pas est ignoré :
 * aucun prix n'est inventé. Une ligne sans rattachement garde son montant seul (dépenses écrites avant cette règle comprises).
 */
function linkedLineCost(lines: PricedLine[], line: PricedLine): { cents: number; surcharges: number } {
  const unit = (value?: string) => (value ?? '').trim().toLowerCase();
  const attached = lines.filter(other => other.surchargeOfLineId === line.id && other.id !== line.id && other.kind === 'service'
    && Number.isSafeInteger(other.amountCents) && other.amountCents > 0 && other.quantity === line.quantity && unit(other.unit) === unit(line.unit));
  return { cents: line.amountCents + attached.reduce((sum, other) => sum + other.amountCents, 0), surcharges: attached.length };
}

/** Only explicit, priced invoice lines can establish a product price. A mixed legacy invoice cannot. */
export function latestBrewPrices(transactions: FinanceTransaction[], beforeDate?: string): Record<string, BrewPrice> {
  const catalog: Record<string, BrewPrice> = {};
  const sorted = transactions.filter(tx => tx.finance?.kind === 'expense' && !tx.finance.voidedAt && brewBudgetDateKey(tx.date))
    .filter(tx => !beforeDate || (brewBudgetDateKey(tx.date) ?? '') <= beforeDate)
    .sort((a, b) => (brewBudgetDateKey(a.date) ?? '').localeCompare(brewBudgetDateKey(b.date) ?? '') || a.id.localeCompare(b.id));
  for (const tx of sorted) for (const line of tx.finance.lines) {
    if (!line.stockItemRef || !(line.quantity > 0) || !line.unit || !finite(line.amountCents) || !Number.isSafeInteger(line.amountCents)) continue;
    const cost = linkedLineCost(tx.finance.lines, line);
    catalog[line.stockItemRef] = { amount: cost.cents / 100, quantity: line.quantity, unit: line.unit, basis: 'TTC', tvaRate: tx.tvaRate ?? 0,
      source: 'invoice', date: tx.date, note: [tx.finance.vendor, tx.finance.invoiceNumber ?? tx.id, cost.surcharges ? 'mouture comprise' : ''].filter(Boolean).join(' · ') };
  }
  return catalog;
}

/** A purchase line the weighted average could not use: its unit does not convert to the stock unit (CF-8, 08.11). */
export interface IgnoredPurchaseLine { stockRef: string; name: string; unit: string; stockUnit: string; description: string; date: string }

/** Documentary valuation estimate: weighted known purchases, never presented as a certified opening stock value. */
export function weightedBrewPrices(transactions: FinanceTransaction[], stock: StockItem[], beforeDate?: string): Record<string, BrewPrice> {
  return weightedPurchases(transactions, stock, beforeDate).prices;
}

/** The linked purchase lines the weighted average of `weightedBrewPrices` leaves out because their unit cannot become the stock unit. */
export function ignoredPurchaseLines(transactions: FinanceTransaction[], stock: StockItem[], beforeDate?: string): IgnoredPurchaseLine[] {
  return weightedPurchases(transactions, stock, beforeDate).ignored;
}

function weightedPurchases(transactions: FinanceTransaction[], stock: StockItem[], beforeDate?: string): { prices: Record<string, BrewPrice>; ignored: IgnoredPurchaseLine[] } {
  const totals = new Map<string, { cost: number; quantity: number; unit: string; count: number; date: string; netCost: number }>();
  const ignored: IgnoredPurchaseLine[] = [];
  for (const tx of transactions) {
    const date = brewBudgetDateKey(tx.date);
    if (tx.finance?.kind !== 'expense' || tx.finance.voidedAt || !date || (beforeDate && date > beforeDate)) continue;
    for (const line of tx.finance.lines) {
      const item = stock.find(s => s.ref === line.stockItemRef);
      if (!item || !(line.quantity > 0) || !line.unit || !finite(line.amountCents)) continue;
      const qty = Units.convert(line.quantity, line.unit, item.unit);
      if (qty === null) { ignored.push({ stockRef: item.ref, name: item.name, unit: line.unit, stockUnit: item.unit, description: line.description, date }); continue; }
      if (!(qty > 0)) continue;
      const prior = totals.get(item.ref) ?? { cost: 0, quantity: 0, unit: item.unit, count: 0, date, netCost: 0 };
      const cents = linkedLineCost(tx.finance.lines, line).cents;
      prior.cost += cents / 100; prior.quantity += qty; prior.count++; prior.date = prior.date > date ? prior.date : date;
      prior.netCost += cents / 100 / (1 + (tx.tvaRate ?? 0));
      totals.set(item.ref, prior);
    }
  }
  const prices = Object.fromEntries([...totals].map(([ref, value]) => {
    const skipped = ignored.filter(line => line.stockRef === ref).length;
    return [ref, { amount: money(value.cost), quantity: value.quantity, unit: value.unit, basis: 'TTC',
      tvaRate: value.netCost > 0 ? value.cost / value.netCost - 1 : 0, source: 'invoice', date: value.date,
      note: `Moyenne pondérée de ${value.count} achat${value.count > 1 ? 's' : ''} renseigné${value.count > 1 ? 's' : ''} · valeur de stock estimée`
        + (skipped ? ` · ${skipped} achat${skipped > 1 ? 's' : ''} en unité non convertible ignoré${skipped > 1 ? 's' : ''}` : '') } as BrewPrice];
  }));
  return { prices, ignored };
}

export function estimateBrewBudget(input: EstimateBrewBudgetInput): BrewBudgetSnapshot {
  const { recipe, stockItems, batchId, brewDate, isTvaRegistered = false } = input;
  const prices = input.prices ?? {}, bindings = input.bindings ?? {}, settings = input.settings ?? {};
  const issues: string[] = [];
  const dateKey = brewBudgetDateKey(brewDate);
  const catalog = latestBrewPrices(input.transactions ?? [], dateKey ?? undefined);
  const { prices: inventoryCatalog, ignored: ignoredPurchases } = weightedPurchases(input.transactions ?? [], stockItems, dateKey ?? undefined);
  if (!dateKey) issues.push('Date de brassage à corriger');
  if (!(recipe.volumeL > 0) || !Number.isFinite(recipe.volumeL)) issues.push('Volume à brasser invalide');
  const normalized = normalizeRecipe(recipe);
  for (const entry of [...normalized.fermentables.map(f => ({ name: f.name, quantity: f.weightKg })), ...normalized.hops.map(h => ({ name: h.name, quantity: h.weightG })), ...(normalized.adjuncts ?? []).map(a => ({ name: a.name, quantity: a.amount })), ...(normalized.yeast?.name ? [{ name: normalized.yeast.name, quantity: normalized.yeast.qty }] : [])]) {
    if (!finite(entry.quantity)) issues.push(`${entry.name} : quantité invalide`);
  }
  if (!brewBudgetDemands(recipe).some(d => d.kind === 'ingredient')) issues.push('Renseigner les ingrédients de la recette');
  const available = new Map(stockItems.map(s => [s.ref, finite(s.currentStock) ? s.currentStock : 0]));
  const reserved = new Map<string, number>();
  for (const batch of input.batches.filter(b => b.id !== batchId && b.status !== 'annule' && b.status !== 'termine')) {
    const pending = (batch as Batch & { stockConsumption?: { pendingItems?: Array<{ stockItemRef: string; quantity: number; unit: string }> } }).stockConsumption?.pendingItems ?? [];
    for (const line of pending) {
      const item = stockItems.find(s => s.ref === line.stockItemRef);
      const qty = item ? Units.convert(line.quantity, line.unit, item.unit) : null;
      if (!item || qty === null) { issues.push(`${batch.name} : réservation de fermentation à vérifier`); continue; }
      const used = Math.min(available.get(item.ref) ?? 0, qty);
      available.set(item.ref, Math.max(0, (available.get(item.ref) ?? 0) - used));
      reserved.set(item.ref, (reserved.get(item.ref) ?? 0) + used);
    }
  }
  const earlier = input.batches.filter(b => b.status === 'planifie' && b.id !== batchId).filter(b => {
    const key = brewBudgetDateKey(batchDisplayDate(b) ?? '');
    if (!key) { issues.push(`${b.name} : date inconnue, stock réservé en priorité`); return true; }
    return !dateKey || key < dateKey || (key === dateKey && (!batchId || b.id < batchId));
  }).sort((a, b) => (brewBudgetDateKey(batchDisplayDate(a) ?? '') ?? '').localeCompare(brewBudgetDateKey(batchDisplayDate(b) ?? '') ?? '') || a.id.localeCompare(b.id));
  for (const batch of earlier) {
    // Some legacy quick actions deducted at planning. Explicit markers prevent reserving them twice.
    if ((batch as Batch & { stockConsumption?: { appliedAt: string } }).stockConsumption?.appliedAt) continue;
    if (batch.stockAccountingVersion !== 1) issues.push(`${batch.name} : historique du stock à confirmer dans le dossier du brassin`);
    const previousEstimate = [...(input.savedEstimates ?? [])].filter(e => e.batchId === batch.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    for (const demand of brewBudgetDemands(recipeForBatch(batch))) {
      const result = resolveBudgetStock(demand, stockItems, previousEstimate?.bindings[demand.key]);
      if (!result.item) { issues.push(`${batch.name} : ${demand.name}, réservation à vérifier`); continue; }
      const qty = Units.convert(demand.quantity, demand.unit, result.item.unit);
      if (qty === null) { issues.push(`${batch.name} : unité de ${demand.name} incompatible`); continue; }
      const used = Math.min(available.get(result.item.ref) ?? 0, qty);
      available.set(result.item.ref, Math.max(0, (available.get(result.item.ref) ?? 0) - used));
      reserved.set(result.item.ref, (reserved.get(result.item.ref) ?? 0) + used);
    }
  }
  const lines: BrewBudgetLine[] = brewBudgetDemands(recipe).map(demand => {
    const match = resolveBudgetStock(demand, stockItems, bindings[demand.key]);
    const item = match.item;
    const lineIssues: string[] = [];
    const inDemandUnit = item ? Units.convert(available.get(item.ref) ?? 0, item.unit, demand.unit) : 0;
    if (inDemandUnit === null) lineIssues.push('Unité de stock incompatible');
    if (!item && match.issue && (!prices[demand.key] || match.issue !== 'Article à associer ou prix à renseigner')) lineIssues.push(match.issue);
    const have = Math.max(0, inDemandUnit ?? 0);
    const used = Math.min(have, demand.quantity);
    const missing = Math.max(0, demand.quantity - used);
    if (item && inDemandUnit !== null) available.set(item.ref, Math.max(0, (available.get(item.ref) ?? 0) - (Units.convert(used, demand.unit, item.unit) ?? 0)));
    const price = prices[demand.key] ?? (item ? catalog[item.ref] : undefined);
    const inventoryPrice = item ? inventoryCatalog[item.ref] : undefined;
    const skippedPurchases = item ? ignoredPurchases.filter(line => line.stockRef === item.ref).length : 0;
    if (skippedPurchases) lineIssues.push(`${skippedPurchases} achat${skippedPurchases > 1 ? 's' : ''} en unité non convertible ignoré${skippedPurchases > 1 ? 's' : ''} du prix moyen du stock`);
    // Even network water has a bill. Only an explicit confirmation may move its cash into a recurring plan.
    const cashTreatment = input.cashTreatments?.[demand.key] ?? 'additional';
    let consumedCost: number | null = null, purchaseTTC: number | null = missing === 0 ? 0 : null, purchaseQuantity = missing;
    let stockCost: number | null = null, purchaseCost: number | null = null;
    if (!price) lineIssues.push(item?.pricePerUnit != null ? 'Ancien prix à confirmer (HT ou TTC)' : 'Prix à renseigner');
    else {
      const quantityInPriceUnit = Units.convert(demand.quantity, demand.unit, price.unit);
      const missingInPriceUnit = Units.convert(missing, demand.unit, price.unit);
      if (quantityInPriceUnit === null || missingInPriceUnit === null) lineIssues.push('Unité de prix incompatible');
      else if (!finite(price.amount) || !(price.quantity > 0) || !Number.isFinite(price.quantity) || !finite(price.tvaRate) || price.tvaRate > 1 || (price.packQuantity !== undefined && (!(price.packQuantity > 0) || !Number.isFinite(price.packQuantity)))) lineIssues.push('Prix ou conditionnement invalide');
      else {
        const perUnitTTC = price.amount / price.quantity * (price.basis === 'HT' ? 1 + price.tvaRate : 1);
        const perUnitCost = isTvaRegistered ? perUnitTTC / (1 + price.tvaRate) : perUnitTTC;
        const toBuy = price.packQuantity ? Math.ceil((missingInPriceUnit - 1e-9) / price.packQuantity) * price.packQuantity : missingInPriceUnit;
        consumedCost = money(quantityInPriceUnit * perUnitCost);
        if (inventoryPrice && used > 0) {
          const inventoryQty = Units.convert(used, demand.unit, inventoryPrice.unit);
          if (inventoryQty !== null) {
            const historicalCost = inventoryPrice.amount / inventoryPrice.quantity / (isTvaRegistered ? 1 + inventoryPrice.tvaRate : 1);
            consumedCost = money(inventoryQty * historicalCost + missingInPriceUnit * perUnitCost);
          }
        }
        purchaseCost = money(missingInPriceUnit * perUnitCost);
        stockCost = money(consumedCost - purchaseCost);
        purchaseTTC = money(Math.max(0, toBuy) * perUnitTTC);
        purchaseQuantity = Units.convert(Math.max(0, toBuy), price.unit, demand.unit) ?? missing;
      }
    }
    return { ...demand, ...(item ? { stockItemRef: item.ref } : {}), available: have, reserved: item ? Units.convert(reserved.get(item.ref) ?? 0, item.unit, demand.unit) ?? 0 : 0, missing, purchaseQuantity, ...(price ? { price } : {}), ...(inventoryPrice ? { inventoryPrice } : {}), cashTreatment, consumedCost, stockCost, purchaseCost, purchaseTTC: cashTreatment === 'included-in-recurring' ? 0 : purchaseTTC, issues: lineIssues };
  });
  // Aliases bound to the same article share one pack purchase. Differing quotes remain separate.
  const packGroups = new Map<string, { lines: BrewBudgetLine[]; unit: string; pack: number; perUnitTTC: number }>();
  for (const line of lines) {
    const item = stockItems.find(stock => stock.ref === line.stockItemRef), price = line.price;
    if (!item || !price?.packQuantity || line.issues.length || !line.missing) continue;
    const pack = Units.convert(price.packQuantity, price.unit, item.unit), priceQuantity = Units.convert(price.quantity, price.unit, item.unit);
    if (!(pack > 0) || !(priceQuantity > 0)) continue;
    const perUnitTTC = price.amount * (price.basis === 'HT' ? 1 + price.tvaRate : 1) / priceQuantity;
    const key = `${item.ref}|${line.cashTreatment}|${pack.toPrecision(12)}|${perUnitTTC.toPrecision(12)}`;
    const group = packGroups.get(key) ?? { lines: [], unit: item.unit, pack, perUnitTTC };
    group.lines.push(line); packGroups.set(key, group);
  }
  for (const group of packGroups.values()) {
    if (group.lines.length < 2) continue;
    const missing = group.lines.reduce((sum, line) => sum + (Units.convert(line.missing, line.unit, group.unit) ?? 0), 0);
    const toBuy = Math.ceil((missing - 1e-9) / group.pack) * group.pack;
    group.lines.forEach((line, index) => {
      line.purchaseQuantity = index ? 0 : Units.convert(toBuy, group.unit, line.unit) ?? 0;
      line.purchaseTTC = index || line.cashTreatment === 'included-in-recurring' ? 0 : money(toBuy * group.perUnitTTC);
    });
  }
  const ingredientsCost = money(lines.reduce((sum, line) => sum + (line.consumedCost ?? 0), 0));
  const purchasesTTC = money(lines.reduce((sum, line) => sum + (line.purchaseTTC ?? 0), 0));
  // Litres nets d'abord : l'impôt calculé en dépend. Un repli sur le volume à brasser est un estimé, dit et jamais « complet ».
  const netVolumeL = input.netVolumeL ?? recipe.volumeL;
  const netVolumeSource: 'saisi' | 'volume-a-brasser' = input.netVolumeL === undefined ? 'volume-a-brasser' : 'saisi';
  // Pas d'issue ici : `complete` resterait faux pour tout appelant qui ne passe pas les litres nets (financeArchiveContinuity). `troisNotions` lit `netVolumeSource` et refuse alors le coût du litre.
  if (!(netVolumeL > 0) || !Number.isFinite(netVolumeL)) issues.push('Volume net attendu à renseigner');
  let operatingCashTTC = 0, operatingCost = 0;
  let packagingCost: number | null = 0, beerTaxCost: number | null = 0, beerTaxExonere = false;
  let beerTaxSource: BrewBudgetSnapshot['beerTaxSource'];
  for (const key of Object.keys(BREW_COST_LABELS) as BrewCostKey[]) {
    const option = settings.costs?.[key];
    if (option?.enabled === false) continue;
    // Impôt : calculé dès que l'OG est connue (le montant saisi est alors ignoré) ; sinon le montant manuel garde son chemin.
    const calculated = key === 'beerTax' && input.og != null && input.og !== ''
      ? beerTaxForVolume({ og: input.og, abv: input.abv, litres: netVolumeL, reductionPct: input.beerTaxReductionPct }) : null;
    if (calculated && calculated.montant != null) {
      const amount = money(calculated.montant);
      operatingCashTTC += amount; operatingCost += amount;
      beerTaxCost = amount; beerTaxSource = 'calcule'; beerTaxExonere = calculated.exonere;
      continue;
    }
    if (!finite(option?.amountTTC)) {
      issues.push(`${BREW_COST_LABELS[key]} : montant à estimer ou poste à désactiver`);
      if (key === 'packaging') packagingCost = null;
      if (key === 'beerTax') { beerTaxCost = null; beerTaxSource = 'inconnu'; }
    } else {
      if (option.cashTreatment !== 'included-in-recurring') operatingCashTTC += option.amountTTC;
      const rate = key === 'beerTax' ? 0 : option.tvaRate;
      if (isTvaRegistered && (!finite(rate) || rate > 1)) issues.push(`${BREW_COST_LABELS[key]} : TVA à confirmer`);
      const cost = option.amountTTC / (isTvaRegistered && finite(rate) && rate <= 1 ? 1 + rate : 1);
      operatingCost += cost;
      if (key === 'packaging') packagingCost = money(cost);
      if (key === 'beerTax') { beerTaxCost = money(cost); beerTaxSource = 'manuel'; }
    }
  }
  const allocation = (enabled: boolean | undefined, annual: number | undefined, label: string) => {
    if (enabled === false) return 0;
    if (!finite(annual)) { issues.push(`${label} : montant annuel à renseigner ou poste à désactiver`); return 0; }
    if (annual === 0) return 0;
    if (!(settings.annualVolumeL > 0) || !Number.isFinite(settings.annualVolumeL)) { issues.push('Volume annuel nécessaire pour répartir les charges'); return 0; }
    return money(annual / settings.annualVolumeL * (finite(netVolumeL) ? netVolumeL : 0));
  };
  const fixedAllocation = allocation(settings.includeFixed, settings.annualFixedCHF, 'Charges fixes');
  const depreciationAllocation = allocation(settings.includeDepreciation, settings.annualDepreciationCHF, 'Amortissement');
  const totalCost = money(ingredientsCost + operatingCost + fixedAllocation + depreciationAllocation);
  // Trois notions, en centimes entiers : `aPayer` est le reste, donc la somme est exacte (le brut de `operatingCost` n'est pas arrondi poste par poste).
  const cents = (n: number) => Math.round(n * 100);
  const dejaPaye = money(lines.reduce((sum, line) => sum + (line.stockCost ?? 0), 0));
  const annee = money(fixedAllocation + depreciationAllocation);
  const aPayer = (cents(totalCost) - cents(dejaPaye) - cents(annee)) / 100;
  const ambiguousCash = isTvaRegistered || lines.some(line => line.purchaseCost === null || (line.cashTreatment === 'included-in-recurring' && line.missing > 0));
  const resteEnStock = ambiguousCash ? null : Math.max(0, money(purchasesTTC - lines.reduce((sum, line) => sum + (line.purchaseCost ?? 0), 0)));
  const now = input.now ?? new Date().toISOString();
  const { id, favorite, archivedAt, batchRef, ...recipeContent } = normalizeRecipe(recipe);
  return {
    id: `BREW-BUDGET-${batchId ?? id}-${now}`, createdAt: now, recipeId: id, ...(batchId ? { batchId } : {}), title: recipe.name,
    brewDate, volumeL: recipe.volumeL, netVolumeL, recipeSnapshot: structuredClone({ ...recipeContent, sourceRecipeId: id, capturedAt: now }),
    bindings: structuredClone(bindings), prices: structuredClone(prices), cashTreatments: structuredClone(input.cashTreatments ?? {}), settings: structuredClone(settings), lines,
    ingredientsCost, purchasesTTC, operatingCost: money(operatingCost), operatingCashTTC: money(operatingCashTTC), cashRequiredTTC: money(purchasesTTC + operatingCashTTC),
    fixedAllocation, depreciationAllocation, totalCost, costPerL: netVolumeL > 0 && Number.isFinite(netVolumeL) ? money(totalCost / netVolumeL) : null,
    complete: issues.length === 0 && lines.every(l => l.issues.length === 0), issues: [...new Set(issues)],
    dejaPaye, aPayer, annee, resteEnStock, packagingCost, beerTaxCost, ...(beerTaxSource ? { beerTaxSource } : {}), beerTaxExonere, netVolumeSource
  };
}
