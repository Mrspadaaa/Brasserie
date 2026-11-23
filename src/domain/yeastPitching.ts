import type { Recipe, StockItem, YeastSpec } from '../types';
import type { YeastOffer, YeastPitchingPlan, YeastPreparationPlan, YeastProduct, YeastProductDocument, YeastQuantityRange, YeastSupply } from '../../functions/src/yeastSupplySchema';
import { Units } from '../services/units';
import { BrewingMath } from '../services/brewingMath';
import { yeastRecipeComputedOg } from './yeastProjection';

const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const contextKey = (value: unknown): string => JSON.stringify(value, (_key, entry) =>
  entry && typeof entry === 'object' && !Array.isArray(entry)
    ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry);
export const pitchingRecipeBasis = (recipe: Pick<Recipe, 'volumeL' | 'fermentables' | 'efficiencyPct'>) =>
  contextKey([recipe.volumeL, recipe.fermentables.map(({ name, kind, use, weightKg, potentialPpg, dayOffset }) => ({ name, kind, use, weightKg, potentialPpg, dayOffset })),
    recipe.fermentables.some(f => (f.kind ?? 'grain') === 'grain' && f.weightKg !== 0) ? recipe.efficiencyPct : undefined]);
export const pitchingAdditionId = (index: number, name: string) => `${index}:${name}`;
/** Market changes do not invalidate a biological/preparation calculation. */
export const pitchingContext = (yeast: YeastSpec) => contextKey([yeast.hopIndexId, yeast.form, yeast.stockItemRef,
  yeast.pitching?.product, yeast.pitching?.lot, yeast.pitching?.wort, yeast.pitching?.rate]);
export function mergeYeastSupply(bootstrap: YeastSupply, documents: YeastProductDocument[]): YeastSupply {
  const products = new Map(bootstrap.products.map(p => [p.id, p]));
  const offers = new Map(bootstrap.offers.map(o => [o.id, o]));
  for (const document of documents) {
    products.set(document.id, document.product);
    for (const [id, offer] of offers) if (offer.productId === document.id) offers.delete(id);
    for (const offer of document.offers) offers.set(offer.id, offer);
  }
  return { version: 1, products: [...products.values()], offers: [...offers.values()] };
}
const age = (date: string, now: number) => now - Date.parse(date);
/** Same 24h stock policy as supplier cards; shipment terms are dated independently. */
export function yeastOfferState(offer: YeastOffer, now = Date.now()) {
  const stockAge = age(offer.stock.source.checkedAt, now);
  const fresh = Number.isFinite(stockAge) && stockAge >= 0 && stockAge <= 86400000;
  const shippingAge = offer.shipping ? age(offer.shipping.source.checkedAt, now) : NaN;
  const shippingFresh = Number.isFinite(shippingAge) && shippingAge >= 0 && shippingAge <= 30 * 86400000;
  const priceAge = offer.price ? age(offer.price.source.checkedAt, now) : NaN;
  const priceFresh = Number.isFinite(priceAge) && priceAge >= 0 && priceAge <= 86400000;
  const status = !fresh ? 'stale' : offer.stock.status;
  const shipping = offer.shipping?.status ?? 'unknown';
  const buyable = status === 'in-stock' && shipping === 'yes' && shippingFresh;
  return { status, shipping, buyable, fresh, shippingFresh, priceFresh, priceLabel: priceFresh ? 'Prix observé' : 'Prix à revérifier',
    label: !fresh ? 'Stock à revérifier' : status === 'in-stock' ? 'Stock annoncé' : status === 'out-of-stock' ? 'Hors stock' : 'Stock inconnu',
    shippingLabel: shipping === 'no' ? 'Pas de livraison directe CH' : !shippingFresh ? 'Livraison CH à revérifier' : shipping === 'yes' ? 'Livraison CH documentée' : 'Livraison CH inconnue' };
}
/** The laboratory's country and a merchant domain never appear in this priority. */
export function rankYeastOffers(offers: YeastOffer[], now = Date.now()): YeastOffer[] {
  const region = (o: YeastOffer) => !o.sellerSource ? 4 : o.sellerCountry === 'CH' ? 0 : ['FR', 'DE'].includes(o.sellerCountry ?? '') ? 1 : o.region === 'Europe' ? 2 : 3;
  return [...offers].sort((a, b) => region(a) - region(b) || Number(yeastOfferState(b, now).buyable) - Number(yeastOfferState(a, now).buyable) || a.seller.localeCompare(b.seller, 'fr'));
}
export function estimatePitchingWort(recipe: Pick<Recipe, 'volumeL' | 'fermentables' | 'efficiencyPct'>, timing: Record<string, 'before' | 'after'> = {}) {
  const missing = recipe.fermentables.flatMap((f, i) => f.weightKg !== 0 && f.use === 'fermentation' && !timing[pitchingAdditionId(i, f.name)] ? [pitchingAdditionId(i, f.name)] : []);
  if (missing.length) return { missing, reasons: ['Précise les ajouts de fermentation présents avant la levure ; J0 ne suffit pas à établir leur ordre.'] };
  const present = recipe.fermentables.filter((f, i) => f.use !== 'fermentation' || timing[pitchingAdditionId(i, f.name)] === 'before');
  const sg = yeastRecipeComputedOg({ ...recipe, fermentables: present });
  if (!positive(recipe.volumeL) || sg === null) return { missing: [], reasons: ['Volume, ingrédients, potentiels ou rendement incomplets : le moût à ensemencer ne peut pas être estimé.'] };
  return { missing: [], reasons: ['Estimation au volume de recette, à partir des seuls ingrédients présents avant la levure ; aucun apport du starter ajouté automatiquement.'],
    wort: { volumeL: recipe.volumeL, sg, basis: 'recipe-estimate' as const, volumeBasis: 'recipe-estimate' as const, sgBasis: 'recipe-estimate' as const,
      recipeBasis: pitchingRecipeBasis(recipe), additionTiming: { ...timing }, starterContribution: 'unknown' as const } };
}
/** Pack units are convertible only through an exact selected variant. */
export function yeastPlannedInFormat(yeast: Pick<YeastSpec, 'qty' | 'unit'>, product?: YeastProduct): number | undefined {
  if (!positive(yeast.qty) || !yeast.unit || !product?.format) return;
  if (/^(sachets?|packs?|flacons?|paquets?)$/i.test(yeast.unit)) return yeast.qty * product.format.amount;
  return Units.convert(yeast.qty, yeast.unit, product.format.unit) ?? undefined;
}
/** Convert a measured dose to the exact linked item's unit, only through the chosen product format. */
export function yeastQuantityInStockUnit(quantity: number, unit: string, product: YeastProduct | undefined, stockUnit: string): number | undefined {
  const format = product?.format;
  if (!positive(quantity) || !unit.trim() || !stockUnit.trim() || !format || !positive(format.amount)) return;
  const isPackage = (value: string) => /^(sachets?|packs?|flacons?|paquets?)$/i.test(value.trim());
  const quantityIsPackage = isPackage(unit), stockIsPackage = isPackage(stockUnit);
  if (quantityIsPackage && stockIsPackage) return quantity;
  const inFormat = quantityIsPackage ? quantity * format.amount : Units.convert(quantity, unit, format.unit);
  if (inFormat === null || !Number.isFinite(inFormat)) return;
  if (stockIsPackage) return inFormat / format.amount;
  return Units.convert(inFormat, format.unit, stockUnit) ?? undefined;
}
export interface YeastPitchingAdvice {
  method: 'manufacturer-mass' | 'viable-cells' | 'unknown';
  context: string;
  range?: YeastQuantityRange;
  bound?: { operator: '>' | '>=' | '<' | '<='; value: number };
  unit?: 'g' | 'milliards de cellules viables';
  packs?: YeastQuantityRange;
  /** Remaining amount at each documented endpoint, not a fictitious continuous range. */
  surplus?: { lowDose: number; highDose: number };
  planned?: number;
  plannedPacks?: number;
  availableCellsBillion?: number;
  balanceCellsBillion?: number;
  packsToBuy?: YeastQuantityRange;
  conditions?: string;
  source?: YeastProduct['source'];
  reasons: string[];
  stale: boolean;
}
export function evaluateYeastPitching(recipe: Pick<Recipe, 'yeast' | 'volumeL' | 'fermentables' | 'efficiencyPct'>, stock: StockItem[] = []): YeastPitchingAdvice {
  const yeast = recipe.yeast, plan = yeast.pitching, product = plan?.product, wort = plan?.wort;
  const result: YeastPitchingAdvice = { method: 'unknown', context: pitchingContext(yeast), reasons: [], stale: false };
  if (!product) { result.reasons.push('Choisis un produit et son conditionnement exact pour calculer des packs.'); return result; }
  if (product.referenceId !== yeast.hopIndexId || product.form !== yeast.form) { result.reasons.push('Produit incompatible avec la référence ou forme choisie : à revalider.'); result.stale = true; return result; }
  const estimated = wort?.volumeBasis === 'recipe-estimate' || wort?.sgBasis === 'recipe-estimate' || wort?.basis === 'recipe-estimate';
  if (estimated && wort?.recipeBasis !== pitchingRecipeBasis(recipe)) { result.reasons.push('Le moût estimé appartient à une ancienne version des ingrédients ou du volume. Recalcule-le ou renseigne une mesure.'); result.stale = true; return result; }
  if (!positive(wort?.volumeL)) { result.reasons.push('Volume du moût à ensemencer manquant.'); return result; }
  result.planned = yeastPlannedInFormat(yeast, product);
  result.plannedPacks = result.planned !== undefined && product.format ? result.planned / product.format.amount : undefined;
  if (product.dose && product.form === 'sèche') {
    result.method = 'manufacturer-mass';
    result.unit = 'g'; result.conditions = product.dose.conditions; result.source = product.dose.source;
    if (!['point', 'range'].includes(product.dose.qualifier ?? '')) {
      if (['lower-bound', 'upper-bound', 'strict-lower-bound', 'strict-upper-bound'].includes(product.dose.qualifier ?? ''))
        result.bound = { operator: product.dose.qualifier === 'strict-lower-bound' ? '>' : product.dose.qualifier === 'lower-bound' ? '>='
          : product.dose.qualifier === 'strict-upper-bound' ? '<' : '<=', value: product.dose.range.min * wort.volumeL / 100 };
      result.reasons.push('Dose bornée, approximative ou non qualifiée : aucun nombre exact de packs ni milieu automatique.');
      return result;
    }
    result.range = { min: product.dose.range.min * wort.volumeL / 100, max: product.dose.range.max * wort.volumeL / 100 };
    result.reasons.push('Repère fabricant conditionnel, pas une garantie pour toutes les densités ou températures. La plage reste une plage.');
    if (product.format?.unit === 'g') {
      result.packs = { min: Math.ceil(result.range.min / product.format.amount), max: Math.ceil(result.range.max / product.format.amount) };
      result.surplus = { lowDose: result.packs.min * product.format.amount - result.range.min, highDose: result.packs.max * product.format.amount - result.range.max };
    } else result.reasons.push('Masse de ce format inconnue : nombre de sachets et surplus inconnus.');
  } else {
    const available = plan?.lot?.viableCellsBillion;
    if (typeof available === 'number' && Number.isFinite(available) && available >= 0 &&
        (!plan?.lot?.productId || plan.lot.productId === product.id)) result.availableCellsBillion = available;
    if (!positive(wort.sg) || wort.sg <= 1 || wort.sg > 1.25 || !positive(plan?.rate?.value)) { result.reasons.push('Densité du moût entre 1,000 et 1,250 SG et taux cellulaire justifié requis ; aucun taux universel n’est présumé.'); return result; }
    const plato = BrewingMath.sgToPlato(wort.sg);
    if (!positive(plato)) { result.reasons.push('Densité hors de la résolution de conversion en °P.'); return result; }
    const required = plan!.rate!.value * wort.volumeL * plato;
    if (result.availableCellsBillion !== undefined) result.balanceCellsBillion = result.availableCellsBillion - required;
    result.method = 'viable-cells'; result.range = { min: required, max: required }; result.unit = 'milliards de cellules viables';
    result.source = plan!.rate!.source; result.conditions = plan!.rate!.conditions;
    result.reasons.push('Besoin = taux en M cellules viables/mL/°P × volume en L × °P. Le taux est une hypothèse sourcée, pas une mesure.');
    // Cells declared as total are not silently viable; no ageing curve is invented.
    const cells = product.cellsPerPack;
    if (cells?.kind === 'viable' && ['point', 'range'].includes(cells.qualifier)) {
      result.packs = { min: Math.ceil(required / cells.range.max), max: Math.ceil(required / cells.range.min) };
      result.surplus = { lowDose: result.packs.min * cells.range.max - required, highDose: result.packs.max * cells.range.min - required };
      result.reasons.push(cells.conditions);
    } else result.reasons.push('Cellules viables par pack inconnues : cellules totales, mL, âge et grammes ne permettent pas de les inventer.');
    if (result.availableCellsBillion !== undefined) result.reasons.push(`Lot : ${result.availableCellsBillion} milliards viables ${plan!.lot!.cellsBasis === 'measured' ? 'mesurés' : 'déclarés'}, sans extrapolation au starter.`);
  }
  if (result.packs) {
    const linked = yeast.stockItemRef ? stock.find(s => s.ref === yeast.stockItemRef) : undefined;
    // The stock's documented variant must match. An unassociated homonym never covers demand.
    const linkedProduct = linked?.yeastLot?.productId ?? (linked ? plan?.lot?.productId : undefined);
    const formatAmount = product.format && linked && linkedProduct === product.id && Number.isFinite(linked.currentStock) && linked.currentStock >= 0
      ? linked.currentStock === 0 ? 0 : yeastPlannedInFormat({ qty: linked.currentStock, unit: linked.unit }, product) : undefined;
    const ownedPacks = linked && linkedProduct === product.id && /^(sachets?|packs?|flacons?|paquets?)$/i.test(linked.unit) && linked.currentStock >= 0
      ? linked.currentStock : formatAmount !== undefined && product.format ? formatAmount / product.format.amount : undefined;
    if (result.method === 'manufacturer-mass' && formatAmount !== undefined && product.format?.unit === 'g' && result.range) {
      result.packsToBuy = { min: Math.max(0, Math.ceil((result.range.min - formatAmount) / product.format.amount)), max: Math.max(0, Math.ceil((result.range.max - formatAmount) / product.format.amount)) };
    } else if (result.method === 'viable-cells' && linked && linkedProduct === product.id && result.availableCellsBillion !== undefined && product.cellsPerPack?.kind === 'viable' && result.range) {
      const deficit = Math.max(0, result.range.min - result.availableCellsBillion);
      result.packsToBuy = { min: Math.ceil(deficit / product.cellsPerPack.range.max), max: Math.ceil(deficit / product.cellsPerPack.range.min) };
    } else if (result.method !== 'viable-cells' && ownedPacks !== undefined && Number.isInteger(ownedPacks)) result.packsToBuy = { min: Math.max(0, Math.ceil(result.packs.min - ownedPacks)), max: Math.max(0, Math.ceil(result.packs.max - ownedPacks)) };
    else result.reasons.push('Packs à acheter inconnus tant que l’article, son format et le stock utilisable ne sont pas associés.');
  }
  return result;
}
/** Explicit adoption only; a range never chooses its midpoint or replaces a manual quantity silently. */
export function applyYeastPitchingAdvice(yeast: YeastSpec, advice: YeastPitchingAdvice, packs: number): YeastSpec {
  if (advice.stale || advice.context !== pitchingContext(yeast) || !advice.packs || !Number.isSafeInteger(packs) || packs < advice.packs.min || packs > advice.packs.max) throw Error('Conseil périmé ou nombre de packs hors de la plage : recalcule et choisis une valeur.');
  return { ...yeast, qty: packs, unit: yeast.pitching?.product?.form === 'sèche' ? 'sachet' : 'pack' };
}
export function selectYeastProduct(yeast: YeastSpec, product: YeastProduct, offer?: YeastOffer): YeastSpec {
  if (product.referenceId !== yeast.hopIndexId || offer && offer.productId !== product.id) throw Error('Ce produit ou cette offre appartient à une autre référence.');
  const sameProduct = yeast.pitching?.product?.id === product.id || yeast.pitching?.lot?.productId === product.id;
  return { ...yeast, stockItemRef: sameProduct ? yeast.stockItemRef : undefined, form: product.form, pitching: { version: 1, product: structuredClone(product), ...(offer ? { offer: structuredClone(offer) } : {}),
    ...(yeast.pitching?.wort ? { wort: yeast.pitching.wort } : {}),
    ...(yeast.pitching?.product?.id === product.id ? { lot: yeast.pitching.lot, rate: yeast.pitching.rate, preparation: yeast.pitching.preparation } : {}) } };
}
export function createYeastPreparation(yeast: YeastSpec, options: { targetPitchAt: string; volumeL: number; equipment: string; inoculum: string; startAt?: string; now?: number }): YeastPreparationPlan {
  const product = yeast.pitching?.product, protocol = product?.starter;
  if (!product || !protocol || product.form === 'sèche' || product.referenceId !== yeast.hopIndexId) throw Error('Aucune méthode de starter applicable documentée pour ce produit.');
  const pitchAt = Date.parse(options.targetPitchAt), cultureStart = pitchAt - protocol.leadHours.max * 3600000;
  const startAt = options.startAt ? Date.parse(options.startAt) : cultureStart;
  if (!Number.isFinite(pitchAt) || !Number.isFinite(startAt) || startAt > cultureStart || startAt <= (options.now ?? Date.now())) throw Error('Échéance trop proche : prévois le début avant la fenêtre de culture, avec une marge pour activation et refroidissement.');
  if (!positive(options.volumeL) || !options.equipment.trim() || !options.inoculum.trim()) throw Error('Renseigne volume de starter, inoculum et matériel selon la notice. Aucun dimensionnement de croissance n’est supposé.');
  return { id: crypto.randomUUID(), revision: (yeast.pitching?.preparation?.revision ?? 0) + 1, productId: product.id, stockItemRef: yeast.stockItemRef,
    context: pitchingContext(yeast), protocol: structuredClone(protocol), volumeL: options.volumeL, inoculum: options.inoculum, equipment: options.equipment,
    targetPitchAt: new Date(pitchAt).toISOString(), startAt: new Date(startAt).toISOString(), startBasis: options.startAt ? 'manual' : 'culture-window', status: 'planned',
    note: 'Repère depuis la fenêtre de culture publiée ; activation, préparation du milieu et refroidissement demandent une marge à prévoir. Les étapes suivent la notice et les contrôles réels, sans horaire biologique intermédiaire garanti.',
    steps: protocol.steps.map((label, i) => ({ id: `step-${i}`, label, ...(i === protocol.steps.length - 1 ? { dueAt: new Date(pitchAt).toISOString() } : {}) })) };
}
export function yeastPreparationState(yeast: YeastSpec, brewDate?: string, now = Date.now()) {
  const plan = yeast.pitching?.preparation;
  if (!plan) return 'missing';
  if (plan.status === 'cancelled') return 'cancelled';
  const pitchDate = new Date(plan.targetPitchAt);
  const pitchAt = pitchDate.getTime();
  const localDate = `${pitchDate.getFullYear()}-${String(pitchDate.getMonth() + 1).padStart(2, '0')}-${String(pitchDate.getDate()).padStart(2, '0')}`;
  if (plan.context !== pitchingContext(yeast) || brewDate && brewDate.slice(0, 10) !== localDate) return 'stale';
  if (!Number.isFinite(pitchAt)) return 'stale';
  if (pitchAt - now < plan.protocol.leadHours.min * 3600000) return 'too-late';
  return Date.parse(plan.startAt) <= now ? 'due' : 'planned';
}
/** Physical wort corrections are independent of an Undo of the strain/product choice. */
export function keepIndependentPitchingWort(restored: YeastSpec, current: YeastSpec): YeastSpec {
  const pitching = { ...restored.pitching, version: 1 as const };
  if (current.pitching?.wort) pitching.wort = current.pitching.wort;
  else delete pitching.wort;
  const next = { ...restored };
  if (Object.keys(pitching).some(key => key !== 'version')) next.pitching = pitching;
  else delete next.pitching;
  return next;
}
