/** Commercial observations and operations are separate from documentary strain facts. */
export interface YeastSupplySource {
  url: string;
  title: string;
  checkedAt: string;
  origin?: 'manufacturer' | 'merchant' | 'ai' | 'manual';
  /** A link correction preserves the original fact's origin and original URL. */
  linkCorrection?: { originalUrl: string; correctedAt: string };
}
export interface YeastQuantityRange { min: number; max: number }
/** Strict bounds remain distinct from inclusive lower/upper limits. */
export type YeastDoseQualifier = 'point' | 'range' | 'approximate' | 'lower-bound' | 'upper-bound' | 'strict-lower-bound' | 'strict-upper-bound';
export interface YeastProduct {
  id: string;
  referenceId: string;
  label: string;
  manufacturer: string;
  form: 'sèche' | 'liquide' | 'levain';
  /** This exact commercial variant, never a mass inferred from a strain name. */
  format?: { amount: number; unit: 'g' | 'mL'; label: string; source: YeastSupplySource };
  source: YeastSupplySource;
  dose?: { range: YeastQuantityRange; qualifier?: YeastDoseQualifier; unit: 'g/hL'; conditions: string; source: YeastSupplySource };
  cellsPerPack?: { range: YeastQuantityRange; kind: 'viable' | 'total'; qualifier: 'point' | 'range' | 'approximate' | 'lower-bound' | 'upper-bound'; conditions: string; source: YeastSupplySource };
  directPitch?: { maxVolumeL: number; maxSg: number; minTemperatureC: number; maxTemperatureC: number; conditions: string; source: YeastSupplySource };
  starter?: YeastStarterProtocol;
}
export interface YeastStarterProtocol {
  id: string;
  label: string;
  source: YeastSupplySource;
  method: string;
  medium: 'malt-extract';
  targetSg: number;
  conditions: string;
  /** Scheduled lead time, not a promise of biological completion or cell growth. */
  leadHours: YeastQuantityRange;
  leadHoursMeaning?: 'culture' | 'total-preparation';
  steps: string[];
}
export interface YeastOffer {
  id: string;
  productId: string;
  seller: string;
  sellerCountry?: string;
  sellerSource?: YeastSupplySource;
  region?: 'Europe' | 'other';
  url: string;
  sku?: string;
  stock: { status: 'in-stock' | 'out-of-stock' | 'unknown'; source: YeastSupplySource; text: string };
  shipping?: { destination: 'CH'; status: 'yes' | 'no' | 'unknown'; conditions: string; source: YeastSupplySource };
  price?: { amount: number; currency: 'CHF' | 'EUR'; packs: number; source: YeastSupplySource };
  revision?: number;
}
export interface YeastSupply { version: 1; products: YeastProduct[]; offers: YeastOffer[] }
/** One canonical document per exact product/variant, using existing sync/backup infrastructure. */
export interface YeastProductDocument { id: string; version: 1; revision: number; product: YeastProduct; offers: YeastOffer[] }
export interface YeastLotDetails {
  productId?: string;
  lotNumber?: string;
  manufacturedOn?: string;
  expiresOn?: string;
  storage?: string;
  viableCellsBillion?: number;
  cellsBasis?: 'measured' | 'declared';
  cellsSource?: YeastSupplySource;
  cellMeasurement?: { at: string; method: string; note?: string };
  notes?: string;
}
export interface YeastPitchingWort {
  volumeL?: number;
  sg?: number;
  basis: 'measured' | 'recipe-estimate' | 'hypothesis';
  volumeBasis?: 'measured' | 'recipe-estimate' | 'hypothesis';
  sgBasis?: 'measured' | 'recipe-estimate' | 'hypothesis';
  /** Starter contribution is explicit, never automatically added to these inputs. */
  starterContribution?: 'included' | 'decanted' | 'unknown';
  /** Fermenter additions whose moment relative to pitching has been explicitly qualified. */
  additionTiming?: Record<string, 'before' | 'after'>;
  note?: string;
  /** An estimate can be refused when its original recipe inputs change. */
  recipeBasis?: string;
}
export interface YeastPreparationPlan {
  id: string;
  revision: number;
  productId: string;
  stockItemRef?: string;
  context: string;
  protocol: YeastStarterProtocol;
  volumeL: number;
  inoculum: string;
  targetPitchAt: string;
  startAt: string;
  startBasis?: 'culture-window' | 'manual';
  equipment: string;
  steps: { id: string; label: string; dueAt?: string }[];
  status: 'planned' | 'cancelled';
  note?: string;
}
export interface YeastPitchingPlan {
  version: 1;
  /** Copies freeze the choice in a recipe and subsequently in the batch snapshot. */
  product?: YeastProduct;
  offer?: YeastOffer;
  lot?: YeastLotDetails;
  wort?: YeastPitchingWort;
  /** Fixed dimension. Existing v1 records omit the unit; an explicit unit must match it. */
  rate?: { value: number; unit?: 'M/mL/°P'; source: YeastSupplySource; conditions: string };
  preparation?: YeastPreparationPlan;
}
/** Actual preparation belongs to a planned batch, before a BrewDayState exists. */
export interface YeastPreparationExecution {
  plan: YeastPreparationPlan;
  status: 'started' | 'ready' | 'cancelled' | 'transferred';
  startedAt: number;
  steps: { id: string; at: number }[];
  /** Pack/culture inoculum and transferred starter are different physical quantities. */
  inoculumUsed?: { amount: number; unit: string; stockItemRef?: string; inventoryAdjustedAt?: number };
  stockRegularization?: { kind: 'inoculum' | 'medium'; stockItemRef: string; at: number }[];
  cultureVolumeL?: number;
  note?: string;
}

const record = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 5000;
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const date = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
/** A date without a time is a Swiss calendar day, not midnight UTC. Full timestamps remain instants. */
export function yeastSourceDateIsFuture(value: string, now = Date.now()): boolean {
  const instant = Date.parse(value);
  if (!Number.isFinite(instant) || !Number.isFinite(now)) return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (new Date(instant).toISOString().slice(0, 10) !== value) return true;
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date(now));
    const part = (kind: string) => parts.find(item => item.type === kind)?.value ?? '';
    return value > `${part('year')}-${part('month')}-${part('day')}`;
  }
  return instant > now + 60_000;
}
const source = (v: unknown): v is YeastSupplySource => record(v) && text(v.title) && date(v.checkedAt) &&
  typeof v.url === 'string' && /^https:\/\/[^\s/]+\/\S+$/i.test(v.url) &&
  (v.origin === undefined || ['manufacturer', 'merchant', 'ai', 'manual'].includes(v.origin)) &&
  (v.linkCorrection === undefined || record(v.linkCorrection) && text(v.linkCorrection.originalUrl) && date(v.linkCorrection.correctedAt));
const range = (v: unknown): v is YeastQuantityRange => record(v) && positive(v.min) && positive(v.max) && v.max >= v.min;
export const validYeastStarterProtocol = (v: unknown): v is YeastStarterProtocol => record(v) && text(v.id) && text(v.label) && source(v.source) &&
  text(v.method) && v.medium === 'malt-extract' && positive(v.targetSg) && v.targetSg > 1 && v.targetSg <= 1.1 &&
  text(v.conditions) && range(v.leadHours) &&
  (v.leadHoursMeaning === undefined || ['culture', 'total-preparation'].includes(v.leadHoursMeaning)) &&
  Array.isArray(v.steps) && v.steps.length > 0 && v.steps.length <= 20 && v.steps.every(text);
export const validYeastProduct = (v: unknown): v is YeastProduct => record(v) && text(v.id) && text(v.referenceId) && text(v.label) && text(v.manufacturer) &&
  ['sèche', 'liquide', 'levain'].includes(v.form) && source(v.source) &&
  (v.format === undefined || record(v.format) && positive(v.format.amount) && ['g', 'mL'].includes(v.format.unit) && text(v.format.label) && source(v.format.source)) &&
  (v.dose === undefined || record(v.dose) && range(v.dose.range) && v.dose.unit === 'g/hL' &&
    (v.dose.qualifier === undefined || ['point', 'range', 'approximate', 'lower-bound', 'upper-bound', 'strict-lower-bound', 'strict-upper-bound'].includes(v.dose.qualifier)) &&
    (!['point', 'lower-bound', 'upper-bound', 'strict-lower-bound', 'strict-upper-bound'].includes(v.dose.qualifier) || v.dose.range.min === v.dose.range.max) && text(v.dose.conditions) && source(v.dose.source)) &&
  (v.cellsPerPack === undefined || record(v.cellsPerPack) && range(v.cellsPerPack.range) && ['viable', 'total'].includes(v.cellsPerPack.kind) &&
    ['point', 'range', 'approximate', 'lower-bound', 'upper-bound'].includes(v.cellsPerPack.qualifier) &&
    (!['point', 'lower-bound', 'upper-bound'].includes(v.cellsPerPack.qualifier) || v.cellsPerPack.range.min === v.cellsPerPack.range.max) && text(v.cellsPerPack.conditions) && source(v.cellsPerPack.source)) &&
  (v.directPitch === undefined || record(v.directPitch) && positive(v.directPitch.maxVolumeL) && v.directPitch.maxSg > 1 && v.directPitch.maxSg <= 1.25 &&
    Number.isFinite(v.directPitch.minTemperatureC) && Number.isFinite(v.directPitch.maxTemperatureC) && v.directPitch.maxTemperatureC >= v.directPitch.minTemperatureC && text(v.directPitch.conditions) && source(v.directPitch.source)) &&
  (v.starter === undefined || v.form !== 'sèche' && validYeastStarterProtocol(v.starter));
export const validYeastOffer = (v: unknown): v is YeastOffer => record(v) && text(v.id) && text(v.productId) && text(v.seller) &&
  typeof v.url === 'string' && /^https:\/\/[^\s/]+\/\S+$/i.test(v.url) &&
  (v.sellerCountry === undefined || text(v.sellerCountry) && source(v.sellerSource)) &&
  record(v.stock) && ['in-stock', 'out-of-stock', 'unknown'].includes(v.stock.status) && source(v.stock.source) && text(v.stock.text) &&
  (v.shipping === undefined || record(v.shipping) && v.shipping.destination === 'CH' && ['yes', 'no', 'unknown'].includes(v.shipping.status) && text(v.shipping.conditions) && source(v.shipping.source)) &&
  (v.price === undefined || record(v.price) && Number.isFinite(v.price.amount) && v.price.amount >= 0 && ['CHF', 'EUR'].includes(v.price.currency) && positive(v.price.packs) && source(v.price.source)) &&
  (v.revision === undefined || Number.isSafeInteger(v.revision) && v.revision >= 0);
export function readYeastSupply(v: unknown): YeastSupply | undefined {
  if (!record(v) || v.version !== 1 || !Array.isArray(v.products) || !Array.isArray(v.offers) ||
    !v.products.every(validYeastProduct) || !v.offers.every(validYeastOffer)) return;
  const ids = new Set(v.products.map((p: YeastProduct) => p.id));
  if (ids.size !== v.products.length || new Set(v.offers.map((o: YeastOffer) => o.id)).size !== v.offers.length || v.offers.some((o: YeastOffer) => !ids.has(o.productId))) return;
  return structuredClone(v) as YeastSupply;
}
export function readYeastPitchingPlan(v: unknown): YeastPitchingPlan | undefined {
  if (!record(v) || v.version !== 1 || v.product !== undefined && !validYeastProduct(v.product) || v.offer !== undefined && !validYeastOffer(v.offer)) return;
  if (v.offer && (!v.product || v.offer.productId !== v.product.id)) return;
  if (v.wort !== undefined && (!record(v.wort) || !['measured', 'recipe-estimate', 'hypothesis'].includes(v.wort.basis) ||
    v.wort.volumeBasis !== undefined && !['measured', 'recipe-estimate', 'hypothesis'].includes(v.wort.volumeBasis) ||
    v.wort.sgBasis !== undefined && !['measured', 'recipe-estimate', 'hypothesis'].includes(v.wort.sgBasis) ||
    v.wort.starterContribution !== undefined && !['included', 'decanted', 'unknown'].includes(v.wort.starterContribution) ||
    v.wort.volumeL !== undefined && !positive(v.wort.volumeL) || v.wort.sg !== undefined && (!Number.isFinite(v.wort.sg) || v.wort.sg < 1 || v.wort.sg > 1.25))) return;
  if (v.rate !== undefined && (!record(v.rate) || v.rate.unit !== undefined && v.rate.unit !== 'M/mL/°P' || !positive(v.rate.value) || !source(v.rate.source) || !text(v.rate.conditions))) return;
  if (v.lot !== undefined && (!record(v.lot) || v.lot.viableCellsBillion !== undefined &&
    (!Number.isFinite(v.lot.viableCellsBillion) || v.lot.viableCellsBillion < 0 || !['measured', 'declared'].includes(v.lot.cellsBasis) ||
      !(source(v.lot.cellsSource) || v.lot.cellsBasis === 'measured' && record(v.lot.cellMeasurement) && date(v.lot.cellMeasurement.at) && text(v.lot.cellMeasurement.method))))) return;
  const p = v.preparation;
  if (p !== undefined && (!record(p) || !text(p.id) || !Number.isSafeInteger(p.revision) || p.revision < 1 || !text(p.productId) ||
    !text(p.context) || !validYeastStarterProtocol(p.protocol) || !positive(p.volumeL) || !text(p.inoculum) || !date(p.targetPitchAt) || !date(p.startAt) ||
    Date.parse(p.startAt) >= Date.parse(p.targetPitchAt) || p.startBasis !== undefined && !['culture-window', 'manual'].includes(p.startBasis) ||
    !text(p.equipment) || !['planned', 'cancelled'].includes(p.status) ||
    !Array.isArray(p.steps) || !p.steps.length || p.steps.some((s: any) => !record(s) || !text(s.id) || !text(s.label) || s.dueAt !== undefined && !date(s.dueAt)))) return;
  return structuredClone(v) as YeastPitchingPlan;
}
export function readYeastProductDocument(v: unknown): YeastProductDocument | undefined {
  if (!record(v) || v.version !== 1 || !text(v.id) || !Number.isSafeInteger(v.revision) || v.revision < 0 ||
    !validYeastProduct(v.product) || v.product.id !== v.id || !Array.isArray(v.offers) ||
    !v.offers.every((o: unknown) => validYeastOffer(o) && o.productId === v.id) ||
    new Set(v.offers.map((o: YeastOffer) => o.id)).size !== v.offers.length) return;
  return structuredClone(v) as YeastProductDocument;
}
