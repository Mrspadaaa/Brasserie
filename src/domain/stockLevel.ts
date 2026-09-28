import { Batch, Recipe, StockItem } from '../types';
import { Units } from '../services/units';
import { ingredientsOf, normalizeRecipe } from './recipeSnapshot';

/**
 * Niveau de stock exprimé en COUVERTURE DE BRASSINS.
 *
 * Pourquoi pas un simple seuil : « 2 kg » ne veut rien dire hors contexte.
 * Deux kilos de malt torréfié, c'est trois brassins d'avance ; deux kilos de
 * malt de base, c'est même pas un tiers de brassin. Un brasseur ne raisonne
 * jamais en valeur absolue, il raisonne en « est-ce que j'ai de quoi brasser ».
 *
 * Le besoin par brassin se déduit des données réelles, dans cet ordre :
 *   1. ce que consomment les brassins PLANIFIÉS (l'intention actuelle) ;
 *   2. à défaut, la consommation moyenne des brassins passés ;
 *   3. à défaut, `minStock` s'il est renseigné ;
 *   4. sinon, aucune couverture calculable — on l'affiche honnêtement.
 *
 * Rien n'est inventé : sans donnée, la jauge le dit au lieu de simuler un niveau.
 */

export type LevelBand = 'rupture' | 'juste' | 'correct' | 'fourni' | 'inconnu';

export interface StockLevel {
  band: LevelBand;
  /** Nombre de brassins couverts. `null` si non calculable. */
  coverage: number | null;
  /** Besoin d'un brassin pour cet article, dans l'unité de l'article. */
  perBatch: number | null;
  /** D'où vient l'estimation — affiché pour que le chiffre reste traçable. */
  source: 'planifie' | 'historique' | 'minStock' | 'aucune';
  label: string;
  /** Remplissage de la jauge, 0 à 100. */
  fillPercent: number;
  tone: 'alert' | 'straw' | 'hop' | 'muted';
}

const BAND_LABEL: Record<LevelBand, string> = {
  rupture: 'Rupture',
  juste: 'Juste',
  correct: 'Correct',
  fourni: 'Bien fourni',
  inconnu: 'Niveau inconnu'
};

const BAND_TONE: Record<LevelBand, StockLevel['tone']> = {
  rupture: 'alert',
  juste: 'straw',
  correct: 'hop',
  fourni: 'hop',
  inconnu: 'muted'
};

/** Un nom de recette correspond-il à cet article de stock ? */
function matches(item: StockItem, ingredientName: string, ref?: string, stockItems?: StockItem[]): boolean {
  if (ref) return item.ref === ref;
  const a = item.name.trim().toLowerCase();
  const b = ingredientName.trim().toLowerCase();
  if (!a || !b) return false;
  if (a !== b) return false;
  return !stockItems || stockItems.filter(s => s.name.trim().toLowerCase() === b).length === 1;
}

/**
 * Quantité de cet article consommée par un brassin, dans l'unité de l'article.
 * Renvoie 0 si le brassin ne l'utilise pas.
 */
function usageInBatch(item: StockItem, batch: Batch, stockItems?: StockItem[]): number {
  let total = 0;
  if (batch.stockConsumption?.items?.length) {
    return [...batch.stockConsumption.items, ...(batch.stockConsumption.pendingItems ?? [])]
      .filter(line => line.stockItemRef === item.ref)
      .reduce((sum, line) => sum + (Units.convert(line.quantity, line.unit, item.unit) ?? 0), 0);
  }

  /*
   * ⚠️ On passe par `ingredientsOf` et JAMAIS par `batch.malts`.
   *
   * Depuis que le brassin fige sa recette, les ingrédients vivent dans
   * `recipeSnapshot.fermentables` ; `malts` n'est plus renseigné. Lire le champ
   * hérité faisait voir zéro consommation à TOUS les brassins récents : la
   * jauge retombait sur « niveau inconnu » et le manque à commander s'affichait
   * à zéro alors qu'il manquait vraiment du malt.
   */
  const { fermentables, hops, yeast } = ingredientsOf(batch);

  fermentables.forEach((f) => {
    if (matches(item, f.name, f.stockItemRef, stockItems)) {
      total += Units.convert(f.weightKg, 'kg', item.unit) ?? 0;
    }
  });

  hops.forEach((h) => {
    if (matches(item, h.name, h.stockItemRef, stockItems)) {
      total += Units.convert(h.weightG, 'g', item.unit) ?? 0;
    }
  });

  // Les ajouts d'avant la refonte ; le nouveau modèle les range en fermentescibles.
  (batch.recipeSnapshot?.adjuncts ?? batch.adjuncts)?.forEach((a) => {
    if (matches(item, a.name, a.stockItemRef, stockItems)) {
      total += Units.convert(a.amount, a.unit, item.unit) ?? 0;
    }
  });

  if (yeast && matches(item, yeast.name, yeast.stockItemRef, stockItems)) {
    // A zero dose is intentional; an incompatible package cannot be treated as grams.
    total += Units.convert(yeast.qty ?? 1, yeast.unit || item.unit, item.unit) ?? 0;
  }

  return total;
}

/** Physical ingredients still earmarked for fermentation after the brew day. */
export function pendingStockQuantity(item: StockItem, batch: Batch): number {
  if (batch.status === 'annule' || batch.status === 'termine') return 0;
  return (batch.stockConsumption?.pendingItems ?? []).filter(line => line.stockItemRef === item.ref)
    .reduce((sum, line) => sum + (Units.convert(line.quantity, line.unit, item.unit) ?? 0), 0);
}

export interface PendingStockSummary {
  /** Total des lignes convertibles dans l'unité de l'article. */
  knownQuantity: number;
  /** Toute ligne incompatible ou invalide rend le total inconnu, pas nul. */
  unknownLines: number;
  known: boolean;
}

/** Ajouts restants explicitement réservés par les brassins actifs. */
export function pendingStockSummary(item: StockItem, batches: Batch[]): PendingStockSummary {
  let knownQuantity = 0;
  let unknownLines = 0;
  for (const batch of batches) {
    if (batch.status === 'annule' || batch.status === 'termine') continue;
    for (const line of batch.stockConsumption?.pendingItems ?? []) {
      if (line.stockItemRef !== item.ref) continue;
      const converted = Number.isFinite(line.quantity) && line.quantity >= 0
        ? Units.convert(line.quantity, line.unit, item.unit)
        : null;
      if (converted === null || !Number.isFinite(converted)) unknownLines++;
      else knownQuantity += converted;
    }
  }
  return { knownQuantity, unknownLines, known: unknownLines === 0 };
}

export interface RecipeStockComparison {
  key: string;
  label: string;
  ingredientNames: string[];
  stockItem: StockItem | null;
  match: 'linked' | 'not-found' | 'ambiguous';
  /** In the article's unit when linked; otherwise in the recipe ingredient's unit. */
  quantity: number | null;
  unit: string | null;
  sourceQuantities: Array<{ quantity: number | null; unit: string | null }>;
  physical: number | null;
  reserved: number | null;
  available: number | null;
  shortage: number | null;
  issue?: string;
  availabilityIssue?: string;
}

interface RecipeNeedLine {
  name: string;
  stockItemRef?: string;
  quantity: number | null;
  unit: string | null;
}

function recipeStockItem(
  line: RecipeNeedLine,
  stockItems: StockItem[]
): { stockItem: StockItem; match: 'linked' } | { stockItem: null; match: 'not-found' | 'ambiguous' } {
  if (line.stockItemRef) {
    const stockItem = stockItems.find(item => item.ref === line.stockItemRef);
    return stockItem ? { stockItem, match: 'linked' as const } : { stockItem: null, match: 'not-found' as const };
  }
  const matches = stockItems.filter(item => item.name.trim().toLowerCase() === line.name.trim().toLowerCase());
  if (matches.length === 1) return { stockItem: matches[0], match: 'linked' as const };
  return { stockItem: null, match: matches.length ? 'ambiguous' as const : 'not-found' as const };
}

/**
 * Compare une recette enregistrée à l'inventaire. Seuls les pendingItems sont
 * encore réservés physiquement ; les consommations sont déjà reflétées dans
 * currentStock. Les brassins planifiés et les commandes ne sont pas réservés.
 */
export function compareRecipeWithStock(
  recipe: Recipe,
  batches: Batch[],
  stockItems: StockItem[]
): RecipeStockComparison[] {
  const normalized = normalizeRecipe(recipe);
  const needs: RecipeNeedLine[] = [
    ...(normalized.fermentables ?? []).map(line => ({ name: line.name, stockItemRef: line.stockItemRef, quantity: line.weightKg, unit: 'kg' })),
    ...(normalized.hops ?? []).map(line => ({ name: line.name, stockItemRef: line.stockItemRef, quantity: line.weightG, unit: 'g' })),
    ...(normalized.adjuncts ?? []).map(line => ({ name: line.name, stockItemRef: line.stockItemRef, quantity: line.amount, unit: line.unit || null })),
    ...(normalized.yeast?.name?.trim() ? [{
      name: normalized.yeast.name,
      stockItemRef: normalized.yeast.stockItemRef,
      quantity: normalized.yeast.qty ?? null,
      // The catalogue deliberately allows an unknown yeast package unit.
      unit: normalized.yeast.unit?.trim() || null
    }] : [])
  ];

  const linked = new Map<string, { item: StockItem; lines: RecipeNeedLine[] }>();
  const unmatched: Array<{ line: RecipeNeedLine; match: 'not-found' | 'ambiguous'; index: number }> = [];
  needs.forEach((line, index) => {
    const resolved = recipeStockItem(line, stockItems);
    if (resolved.match !== 'linked') {
      unmatched.push({ line, match: resolved.match, index });
      return;
    }
    const group = linked.get(resolved.stockItem.ref) ?? { item: resolved.stockItem, lines: [] };
    group.lines.push(line);
    linked.set(resolved.stockItem.ref, group);
  });

  const linkedRows = [...linked.values()].map(({ item, lines }): RecipeStockComparison => {
    let quantity = 0;
    let issue: string | undefined;
    for (const line of lines) {
      if (line.quantity === null || !Number.isFinite(line.quantity) || line.quantity < 0) {
        issue ??= `Quantité de « ${line.name} » non renseignée ou invalide.`;
        continue;
      }
      if (!line.unit) {
        issue ??= `Unité de « ${line.name} » non renseignée.`;
        continue;
      }
      const converted = Units.convert(line.quantity, line.unit, item.unit);
      if (converted === null || !Number.isFinite(converted)) {
        issue ??= `Unité incompatible : ${line.unit} vers ${item.unit}.`;
        continue;
      }
      quantity += converted;
    }
    const required = issue ? null : quantity;
    const physical = Number.isFinite(item.currentStock) && item.currentStock >= 0 ? item.currentStock : null;
    const reservation = pendingStockSummary(item, batches);
    const reserved = reservation.known ? reservation.knownQuantity : null;
    const available = physical !== null && reserved !== null ? Math.max(0, physical - reserved) : null;
    const availabilityIssue = physical === null
      ? 'Stock physique non renseigné ou invalide.'
      : !reservation.known
        ? 'Réservation inconnue : une unité ne peut pas être convertie en unité de stock.'
        : reserved !== null && reserved > physical
          ? `Réservations supérieures au stock physique de ${Units.format(reserved - physical, item.unit)}.`
          : undefined;
    const shortage = required !== null && available !== null ? Math.max(0, required - available) : null;
    return {
      key: `stock:${item.ref}`,
      label: item.name,
      ingredientNames: [...new Set(lines.map(line => line.name))],
      stockItem: item,
      match: 'linked',
      quantity: required,
      unit: item.unit,
      sourceQuantities: lines.map(line => ({ quantity: line.quantity, unit: line.unit })),
      physical,
      reserved,
      available,
      shortage,
      issue,
      availabilityIssue
    };
  });

  const unmatchedRows = unmatched.map(({ line, match, index }): RecipeStockComparison => ({
    key: `ingredient:${index}:${line.name}`,
    label: line.name,
    ingredientNames: [line.name],
    stockItem: null,
    match,
    quantity: line.quantity !== null && Number.isFinite(line.quantity) && line.quantity >= 0 ? line.quantity : null,
    unit: line.unit,
    sourceQuantities: [{ quantity: line.quantity, unit: line.unit }],
    physical: null,
    reserved: null,
    available: null,
    shortage: null,
    issue: match === 'ambiguous'
      ? 'Plusieurs articles ont ce nom : stock inconnu sans référence explicite.'
      : line.stockItemRef
        ? 'La référence liée à la recette est absente du stock.'
        : 'Aucun article correspondant dans le stock.'
  }));

  return [...linkedRows, ...unmatchedRows];
}

function outstandingInBatch(item: StockItem, batch: Batch, stockItems?: StockItem[]): number {
  if (batch.stockConsumption?.appliedAt) return pendingStockQuantity(item, batch);
  return batch.status === 'planifie' ? usageInBatch(item, batch, stockItems) : 0;
}

/**
 * Besoin moyen par brassin pour cet article, déduit des données réelles.
 */
function perBatchNeed(
  item: StockItem,
  batches: Batch[],
  stockItems?: StockItem[]
): { need: number; source: StockLevel['source'] } {
  const planned = batches.filter((b) => b.status === 'planifie' && !b.stockConsumption?.appliedAt);
  const plannedUse = planned.map((b) => usageInBatch(item, b, stockItems)).filter((q) => q > 0);
  if (plannedUse.length > 0) {
    return {
      need: plannedUse.reduce((a, b) => a + b, 0) / plannedUse.length,
      source: 'planifie'
    };
  }

  const past = batches.filter((b) => b.status !== 'planifie' && b.status !== 'annule');
  const pastUse = past.map((b) => usageInBatch(item, b, stockItems)).filter((q) => q > 0);
  if (pastUse.length > 0) {
    return {
      need: pastUse.reduce((a, b) => a + b, 0) / pastUse.length,
      source: 'historique'
    };
  }

  if (item.minStock > 0) {
    return { need: item.minStock, source: 'minStock' };
  }

  return { need: 0, source: 'aucune' };
}

export function computeStockLevel(item: StockItem, batches: Batch[], stockItems?: StockItem[]): StockLevel {
  const physical = Number.isFinite(item.currentStock) && item.currentStock >= 0 ? item.currentStock : null;
  const reservations = pendingStockSummary(item, batches);
  const stock = physical !== null && reservations.known
    ? Math.max(0, physical - reservations.knownQuantity)
    : null;
  const { need, source } = perBatchNeed(item, batches, stockItems);

  // An incompatible reservation makes free stock unknowable, not zero.
  if (stock === null) {
    return {
      band: 'inconnu',
      coverage: null,
      perBatch: null,
      source: 'aucune',
      label: BAND_LABEL.inconnu,
      fillPercent: 0,
      tone: 'muted'
    };
  }

  // Rien pour estimer : on le dit, plutôt que de simuler une jauge pleine.
  if (need <= 0) {
    return {
      band: stock > 0 ? 'inconnu' : 'rupture',
      coverage: null,
      perBatch: null,
      source: 'aucune',
      label: stock > 0 ? BAND_LABEL.inconnu : BAND_LABEL.rupture,
      fillPercent: stock > 0 ? 100 : 0,
      tone: stock > 0 ? 'muted' : 'alert'
    };
  }

  const coverage = stock / need;

  let band: LevelBand;
  if (stock <= 0) band = 'rupture';
  else if (coverage < 1) band = 'juste';
  else if (coverage < 2) band = 'correct';
  else band = 'fourni';

  // 0.3 kg / 0.1 kg doit couvrir trois brassins malgré l'arrondi binaire.
  const wholeBatches = Math.floor(coverage + Number.EPSILON * Math.max(1, coverage) * 2);
  const label =
    band === 'rupture'
      ? BAND_LABEL.rupture
      : coverage < 1
        ? `Moins d’un brassin`
        : `${wholeBatches} brassin${wholeBatches > 1 ? 's' : ''} d’avance`;

  return {
    band,
    coverage: Math.round(coverage * 10) / 10,
    perBatch: Units.round(need, item.unit),
    source,
    label,
    // La jauge sature à trois brassins : au-delà, l'information n'apporte rien.
    fillPercent: Math.max(0, Math.min(100, (coverage / 3) * 100)),
    tone: BAND_TONE[band]
  };
}

/**
 * Manque à commander pour couvrir tous les brassins planifiés.
 * Renvoie 0 quand le stock suffit.
 */
export function shortfall(item: StockItem, batches: Batch[], stockItems?: StockItem[]): number {
  const needed = batches
    .reduce((sum, b) => sum + outstandingInBatch(item, b, stockItems), 0);
  const missing = needed - (item.currentStock ?? 0);
  return missing > 0 ? Units.round(missing, item.unit) : 0;
}

/** Les brassins planifiés qui consomment cet article, pour l'affichage des étiquettes. */
export function allocatedBatches(
  item: StockItem,
  batches: Batch[],
  stockItems?: StockItem[]
): Array<{ id: string; name: string; qty: number }> {
  return batches
    .map((b) => ({ id: b.id, name: b.name, qty: outstandingInBatch(item, b, stockItems) }))
    .filter((x) => x.qty > 0);
}
