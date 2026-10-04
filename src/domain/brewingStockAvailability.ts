import type { Batch, StockItem } from '../types';
import type { HopDecisionMaterial, HopDecisionProgram } from './hopDecision/types';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';
import { pendingStockSummary } from './stockLevel';
import { Units } from '../services/units';

export interface BrewingStockReservations { complete: boolean; batches: unknown[]; source?: 'firestoreReadOnlyTransaction' | 'localCache' }
export interface BrewingStockAvailabilityRow {
  materialIds: string[];
  stockItemRef: string;
  physicalGrams: number | null;
  reservedOtherGrams: number | null;
  reservedOwnGrams: number | null;
  reusableOwnGrams: number | null;
  nonReusableOwnGrams: number | null;
  freeGrams: number | null;
  overReservedGrams: number | null;
  availableGrams: number | null;
  basis: 'mobilisableForRemainingProgram' | 'physicalZero' | 'unknown';
  ownAllocation: 'none' | 'verifiedRemainingHops' | 'unresolved';
  allocationArithmetic: { method: 'producerNativeUnit-v1'; unit: string; expectedQuantity: number; reservedQuantity: number } | null;
  reasons: string[];
  inventorySnapshots: unknown[];
  reservationSnapshots: unknown[];
  allocationSnapshot: unknown | null;
}
export interface BrewingStockAvailability {
  version: 'brewing-stock-availability-v1'; reference: string;
  readBasis: 'firestoreReadOnlyTransaction' | 'localCache' | 'unspecified';
  materials: HopDecisionMaterial[]; rows: BrewingStockAvailabilityRow[]; limitations: string[];
}
type Row = Record<string, any>;
const object = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const quantity = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const proof = (value: unknown): any => JSON.parse(JSON.stringify(value, (_key, v) => typeof v === 'number' && !Number.isFinite(v) ? { invalidNumber: String(v) } : v));
const grams = (value: unknown, unit: unknown): number | null => {
  if (!quantity(value) || !text(unit)) return null;
  const converted = Units.convert(value, unit, 'g');
  if (value > 0 && converted === 0) return null;
  return quantity(converted) ? converted : null;
};
const active = (batch: Row) => batch.status !== 'annule' && batch.status !== 'termine';
const completed = (ledger: unknown, stage: 'brewday' | 'remaining'): boolean => object(ledger)
  && Array.isArray(ledger.completedStages) && ledger.completedStages.every((value: unknown) => value === 'brewday' || value === 'remaining')
  && ledger.completedStages.includes(stage);

/** A formal pending balance has no addition IDs. Release it for this program
 * only when the frozen recipe and remaining hop identities explain it fully. */
function ownsRemainingHops(ref: string, batch: Row,
  program: HopDecisionProgram | null | undefined, materials: HopDecisionMaterial[]): BrewingStockAvailabilityRow['allocationArithmetic'] {
  const ledger = batch.stockConsumption;
  if (!completed(ledger, 'brewday') || completed(ledger, 'remaining')
    || !program || program.id !== batch.id || !object(batch.recipeSnapshot)) return null;
  const source = batch.recipeSnapshot;
  if (!Array.isArray(source.hops) || !Array.isArray(source.fermentables) || !Array.isArray(source.adjuncts ?? [])) return null;
  if (!source.hops.every(object) || !source.fermentables.every(object) || !(source.adjuncts ?? []).every(object)) return null;
  if (source.fermentables.some((row: Row) => row.stockItemRef === ref && row.use === 'fermentation')
    || (source.adjuncts ?? []).some((row: Row) => row.stockItemRef === ref && /ferment/i.test(row.step ?? ''))) return null;
  const expected = source.hops.flatMap((hop: Row, index: number) => hop.stage === 'dryHop' && hop.stockItemRef === ref ? [{ hop, index }] : []);
  if (!expected.length || expected.some((row: Row) => !quantity(row.hop.weightG))) return null;
  const pending = ledger.pendingItems.filter((line: Row) => line.stockItemRef === ref);
  const unit = pending[0]?.unit;
  const factor = text(unit) ? Units.convert(1, unit, 'g') : null;
  if (!quantity(factor) || factor === 0 || pending.some((line: Row) => !quantity(line.quantity)
    || !text(line.unit) || Units.convert(1, line.unit, 'g') !== factor)) return null;
  // The producer converts EACH source mass to the ledger's native unit BEFORE
  // aggregating. Replaying that operation avoids an unrelated g→kg→g roundtrip.
  // No epsilon, rounding, or tolerance of a real quantity discrepancy is used.
  const parts = expected.map((row: Row) => Units.convert(row.hop.weightG, 'g', unit));
  if (parts.some((value: unknown) => !quantity(value))) return null;
  const expectedQuantity = parts.reduce((sum: number, value: number) => sum + value, 0);
  const reservedQuantity = pending.reduce((sum: number, line: Row) => sum + line.quantity, 0);
  if (!quantity(expectedQuantity) || !quantity(reservedQuantity) || expectedQuantity !== reservedQuantity) return null;
  const linked = expected.every(({ index }: { index: number }) => {
    const addition = program.additions.find(row => row.id === `recipe-hop:${index}`);
    const material = materials.find(row => row.id === addition?.materialId);
    return addition?.status === 'planned' && quantity(addition.grams)
      && (addition.use === 'postFermentation' || addition.use === 'fermentation' && !['conditioning', 'packaged'].includes(program.stage))
      && program.stage !== 'packaged' && (material?.stockItemRef ?? material?.lot?.stockItemRef) === ref;
  });
  return linked ? { method: 'producerNativeUnit-v1', unit, expectedQuantity, reservedQuantity } : null;
}

/** Pure read model. Neither planned purchases nor recipe names prove stock.
 * A caller must explicitly qualify completeness of the formal reservation set. */
export function prepareBrewingStockAvailability(input: {
  materials: HopDecisionMaterial[]; inventory: unknown[]; reservations?: BrewingStockReservations;
  batch?: any; program?: HopDecisionProgram | null; recipe?: any; journal?: any;
}): BrewingStockAvailability {
  const materials = structuredClone(input.materials);
  const groups = new Map<string, HopDecisionMaterial[]>();
  const limitations: string[] = ['Disponibilité calculée sur l’état chargé ; aucune réservation atomique ni achat. Relire le stock et les réservations au point d’application.'];
  const readBasis = input.reservations?.source ?? 'unspecified';
  if (readBasis !== 'firestoreReadOnlyTransaction') limitations.push('La cohérence temporelle entre inventaire et réservations de cette lecture locale n’est pas attestée par une transaction serveur.');
  for (const material of materials) {
    const ref = material.stockItemRef ?? material.lot?.stockItemRef;
    if (material.lot?.referenceOnly) { material.availableGrams = null; continue; }
    if (!text(ref)) continue;
    groups.set(ref, [...groups.get(ref) ?? [], material]);
  }
  const scope = input.reservations;
  const batches = Array.isArray(scope?.batches) ? scope.batches : [];
  const structurallyKnown = batches.every(batch => object(batch) && text(batch.id)
    && ['planifie', 'fermentation', 'garde', 'conditionne', 'termine', 'annule'].includes(batch.status)
    && (!active(batch) || Object.prototype.hasOwnProperty.call(batch, 'stockConsumption')
      && (batch.stockConsumption === null || object(batch.stockConsumption)
      && Array.isArray(batch.stockConsumption.pendingItems) && batch.stockConsumption.pendingItems.every((line: unknown) => object(line) && text(line.stockItemRef) && typeof line.unit === 'string'))));
  const uniqueBatches = new Set(batches.filter(object).map(batch => batch.id)).size === batches.length;
  const complete = scope?.complete === true && structurallyKnown && uniqueBatches;
  const rows: BrewingStockAvailabilityRow[] = [];
  for (const [stockItemRef, aliases] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const stocks = (Array.isArray(input.inventory) ? input.inventory : []).filter(item => object(item) && item.ref === stockItemRef) as Row[];
    const relevant = structurallyKnown ? batches.filter(object).filter(batch => active(batch)
      && batch.stockConsumption?.pendingItems?.some((line: Row) => line.stockItemRef === stockItemRef)) : [];
    const own = text(input.batch?.id) ? batches.filter(object).find(batch => batch.id === input.batch.id) : undefined;
    const hasSnapshot = (value: unknown): value is Row => object(value)
      && Object.prototype.hasOwnProperty.call(value, 'recipeSnapshot') && value.recipeSnapshot !== undefined;
    const hasScopedSnapshot = hasSnapshot(own), hasContextSnapshot = hasSnapshot(input.batch);
    const selectedSnapshot = hasScopedSnapshot ? own.recipeSnapshot : hasContextSnapshot ? input.batch.recipeSnapshot : undefined;
    const sourceMatches = !hasScopedSnapshot || !hasContextSnapshot
      || hopAdviceContentReference('stock-recipe-v1', proof(own.recipeSnapshot)) === hopAdviceContentReference('stock-recipe-v1', proof(input.batch.recipeSnapshot));
    const row: BrewingStockAvailabilityRow = { materialIds: aliases.map(material => material.id).sort(), stockItemRef,
      physicalGrams: null, reservedOtherGrams: null, reservedOwnGrams: null, reusableOwnGrams: null, nonReusableOwnGrams: null,
      freeGrams: null, overReservedGrams: null, availableGrams: null,
      basis: 'unknown', ownAllocation: 'unresolved', allocationArithmetic: null, reasons: [], inventorySnapshots: proof(stocks),
      reservationSnapshots: proof(relevant.map(batch => ({ id: batch.id, status: batch.status, stockConsumption: batch.stockConsumption }))),
      allocationSnapshot: input.batch ? proof({ batchId: input.batch.id ?? null,
        recipeSnapshot: selectedSnapshot ?? null, snapshotFrom: hasScopedSnapshot ? 'reservationBatch' : hasContextSnapshot ? 'contextBatch' : 'absent',
        reservationRecipeSnapshot: hasScopedSnapshot ? own.recipeSnapshot : null, contextRecipeSnapshot: hasContextSnapshot ? input.batch.recipeSnapshot : null,
        currentRecipe: input.recipe ?? null,
        ledger: input.batch.stockConsumption ?? null, journal: input.journal ?? input.batch.brewDay ?? null, program: input.program ?? null }) : null };
    const conflict = aliases.some(material => material.stockItemRef && material.lot?.stockItemRef && material.stockItemRef !== material.lot.stockItemRef);
    if (conflict) row.reasons.push('Liens de stock contradictoires entre matière et lot.');
    else if (stocks.length !== 1) row.reasons.push(stocks.length ? 'Référence de stock dupliquée ; aucun solde choisi arbitrairement.' : 'Article de stock absent de la lecture ; aucune correspondance par nom ou id.');
    else {
      const stock = stocks[0]; row.physicalGrams = grams(stock.currentStock, stock.unit);
      if (row.physicalGrams === null) row.reasons.push('Quantité physique ou unité de masse non qualifiée.');
      else if (!complete) {
        row.reasons.push('Périmètre des réservations formelles absent, incomplet ou incohérent.');
      } else {
        const others = batches.filter(object).filter(batch => batch.id !== own?.id) as Batch[];
        const otherSummary = pendingStockSummary(stock as StockItem, others);
        const ownSummary = pendingStockSummary(stock as StockItem, own ? [own as Batch] : []);
        row.reservedOtherGrams = otherSummary.known ? grams(otherSummary.knownQuantity, stock.unit) : null;
        row.reservedOwnGrams = ownSummary.known ? grams(ownSummary.knownQuantity, stock.unit) : null;
        if (row.reservedOtherGrams === null || row.reservedOwnGrams === null) row.reasons.push('Une réservation est invalide ou dans une unité incompatible.');
        else {
          row.freeGrams = Math.max(0, row.physicalGrams - row.reservedOtherGrams - row.reservedOwnGrams);
          row.overReservedGrams = Math.max(0, row.reservedOtherGrams + row.reservedOwnGrams - row.physicalGrams);
          const currentLedger = input.batch?.stockConsumption;
          const ledgerMatches = !currentLedger || own && hopAdviceContentReference('stock-ledger-v1', proof(own.stockConsumption ?? null)) === hopAdviceContentReference('stock-ledger-v1', proof(currentLedger));
          const performed = input.program?.additions.filter(addition => addition.status === 'performed'
            && aliases.some(material => material.id === addition.materialId)) ?? [];
          const performedAccounted = performed.every(addition => (addition.use === 'fermentation' || addition.use === 'postFermentation')
            ? completed(currentLedger, 'remaining') : completed(currentLedger, 'brewday'));
          const sourceHops = selectedSnapshot?.hops;
          const closedButStillPlanned = completed(currentLedger, 'remaining') && Array.isArray(sourceHops)
            && input.program?.additions.some(addition => addition.status === 'planned'
              && aliases.some(material => material.id === addition.materialId)
              && /^recipe-hop:\d+$/.test(addition.id)
              && sourceHops[Number(addition.id.slice(11))]?.stage === 'dryHop');
          const allocation = row.reservedOwnGrams > 0 && own ? ownsRemainingHops(stockItemRef, { ...own, recipeSnapshot: selectedSnapshot }, input.program, materials) : null;
          if (!ledgerMatches || !sourceMatches || !performedAccounted || closedButStillPlanned) row.reasons.push('Journal réalisé, version de recette et déstockage confirmé non réconciliés ; solde mobilisable inconnu.');
          else if (row.reservedOwnGrams > 0 && !allocation) {
            row.reasons.push('Réservation du brassin courant non attribuable avec certitude aux seuls ajouts restants de ce programme.');
          } else {
            row.ownAllocation = row.reservedOwnGrams > 0 ? 'verifiedRemainingHops' : 'none';
            row.allocationArithmetic = row.reservedOwnGrams > 0 ? allocation : null;
            row.reusableOwnGrams = row.reservedOwnGrams;
            row.nonReusableOwnGrams = 0;
            row.availableGrams = Math.max(0, row.physicalGrams - row.reservedOtherGrams);
            row.basis = 'mobilisableForRemainingProgram';
          }
        }
      }
    }
    // Reservations and unresolved attribution can never make an identified,
    // convertible physical zero positive. Preserve the reasons and raw bases.
    if (row.physicalGrams === 0) { row.availableGrams = 0; row.basis = 'physicalZero'; }
    for (const alias of aliases) alias.availableGrams = row.availableGrams;
    limitations.push(...row.reasons.map(reason => `${stockItemRef} : ${reason}`)); rows.push(row);
  }
  const reference = hopAdviceContentReference('brewing-stock-availability-v1', { complete, readBasis,
    batchId: input.batch?.id ?? null, program: input.program ?? null, rows });
  return { version: 'brewing-stock-availability-v1', reference, readBasis, materials, rows, limitations };
}
