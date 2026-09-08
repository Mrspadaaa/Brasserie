/** Shared, dependency-free contracts. Analytical observations are never aroma predictions. */
export type HopConfidence = 'low' | 'medium' | 'high';
export type HopProductForm = 'pelletT90' | 'pelletT45' | 'cryo' | 'cone' | 'extract' | 'unknown';
export type HopSourceKind = 'coa' | 'manufacturer' | 'research' | 'review' | 'observation' | 'community' | 'judgment';
export interface HopSource {
  title: string;
  author: string;
  year: number | null;
  kind: HopSourceKind;
  /** URL, DOI, COA reference or dated personal observation; never an AI model name. */
  reference: string;
  locator?: string;
}
export interface HopRange { min: number; max: number }
export type HopAnalyte =
  | 'alpha' | 'beta' | 'totalOil' | 'myrcene' | 'linalool' | 'geraniol' | 'citronellol'
  | 'humulene' | 'caryophyllene' | '4mmpFree' | '4mmpCys' | '4mmpGsh'
  | '3mhFree' | '3mhCys' | '3mhGsh' | '3mhGluCys' | '3mhCysGly' | '3s4mpFree'
  | '3mhaFree' | '2methylbutylIsobutyrate' | 'gammaNonalactone' | 'hsi';
/** Equivalent-based assays are distinct quantities, even when their printed dimension matches. */
export type HopUnit = 'percentMass' | 'ml100g' | 'percentOil' | 'mg100g' | 'ugKg' | 'ngL' | 'ugL' | 'ugKgThiolEquivalent' | 'ugLInternalStandardEquivalent' | 'index' | 'unknown';
export interface HopMeasurement {
  analyte: HopAnalyte;
  unit: HopUnit;
  basis: 'asIs' | 'dryMatter' | 'oil' | 'beer' | 'unknown';
  kind: 'point' | 'range' | 'below' | 'unknown';
  value?: number;
  /** For a point, only the interval actually reported by the analyst. */
  range?: HopRange;
  /** Detection/quantification limit, not a measured concentration. */
  limit?: number;
  limitKind?: 'lod' | 'loq';
  source: HopSource;
  confidence: HopConfidence;
  method?: string;
  note?: string;
}
export interface HopDescription {
  text: string;
  context: 'rawHop' | 'infusion' | 'beer' | 'unspecified';
  source: HopSource;
}
export interface HopVariety {
  id: string;
  name: string;
  aliases: string[];
  origin?: string;
  form: HopProductForm;
  descriptions: HopDescription[];
  analysis: HopMeasurement[];
  archived?: boolean;
}
export interface HopLot {
  id: string;
  varietyId: string;
  name: string;
  lotNumber?: string;
  harvestYear?: number;
  growingRegion?: string;
  grower?: string;
  storageNotes?: string;
  /** Published sample for comparison; never an assertion that the brewery owns this lot. */
  referenceOnly?: boolean;
  form: HopProductForm;
  stockItemRef?: string;
  analysis: HopMeasurement[];
  notes?: string;
  archived?: boolean;
}

export const HOP_ANALYTES: readonly HopAnalyte[] = ['alpha', 'beta', 'totalOil', 'myrcene', 'linalool',
  'geraniol', 'citronellol', 'humulene', 'caryophyllene', '4mmpFree', '4mmpCys', '4mmpGsh',
  '3mhFree', '3mhCys', '3mhGsh', '3mhGluCys', '3mhCysGly', '3s4mpFree', '3mhaFree', '2methylbutylIsobutyrate', 'gammaNonalactone', 'hsi'];
export const HOP_FORMS: readonly HopProductForm[] = ['pelletT90', 'pelletT45', 'cryo', 'cone', 'extract', 'unknown'];
export const HOP_UNITS: readonly HopUnit[] = ['percentMass', 'ml100g', 'percentOil', 'mg100g', 'ugKg', 'ngL', 'ugL', 'ugKgThiolEquivalent', 'ugLInternalStandardEquivalent', 'index', 'unknown'];
const sourceKinds: readonly HopSourceKind[] = ['coa', 'manufacturer', 'research', 'review', 'observation', 'community', 'judgment'];
const confidences: readonly HopConfidence[] = ['low', 'medium', 'high'];
const plain = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const nonempty = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const idOk = (v: unknown) => nonempty(v) && !v.includes('/') && !/^\.{1,2}$|^__.*__$/.test(v);
const onlyKeys = (v: Record<string, unknown>, allowed: string[]) => Object.keys(v).every(key => allowed.includes(key));

export function validHopRange(v: unknown): v is HopRange {
  return plain(v) && finite(v.min) && finite(v.max) && v.min <= v.max;
}
export function hopSourceError(v: unknown, requireYear = false): string | null {
  if (!plain(v) || !nonempty(v.title) || !nonempty(v.author) || !nonempty(v.reference) || !sourceKinds.includes(v.kind)) {
    return 'Une provenance (titre, auteur, référence et nature) est obligatoire.';
  }
  if (!onlyKeys(v, ['title', 'author', 'year', 'kind', 'reference', 'locator'])) return 'Champ de source non reconnu.';
  if (v.year !== null && (!Number.isInteger(v.year) || v.year < 1)) return 'Année de source invalide.';
  if (requireYear && v.year === null) return 'L’année de la source est nécessaire au calcul.';
  if (v.locator != null && typeof v.locator !== 'string') return 'Emplacement de source invalide.';
  return null;
}
export function hopMeasurementError(v: unknown): string | null {
  if (!plain(v) || !HOP_ANALYTES.includes(v.analyte) || !HOP_UNITS.includes(v.unit) ||
    !['asIs', 'dryMatter', 'oil', 'beer', 'unknown'].includes(v.basis) || !confidences.includes(v.confidence)) return 'Mesure ou unité invalide.';
  const error = hopSourceError(v.source);
  if (error) return error;
  if (!onlyKeys(v, ['analyte', 'unit', 'basis', 'kind', 'value', 'range', 'limit', 'limitKind', 'source', 'confidence', 'method', 'note'])) return 'Champ analytique non reconnu.';
  if (!['point', 'range', 'below', 'unknown'].includes(v.kind)) return 'Nature de mesure invalide.';
  if (v.value != null && (!finite(v.value) || v.value < 0)) return 'Valeur analytique invalide.';
  if (v.range != null && (!validHopRange(v.range) || v.range.min < 0)) return 'Plage analytique invalide.';
  if (v.limit != null && (!finite(v.limit) || v.limit <= 0)) return 'Limite analytique invalide.';
  if (v.kind === 'point' && !finite(v.value)) return 'Valeur rapportée absente.';
  if (v.kind === 'range' && !validHopRange(v.range)) return 'Les deux bornes de la plage sont nécessaires.';
  if (v.kind !== 'point' && v.value != null) return 'Une valeur ponctuelle doit rester distincte d’une plage ou d’une censure.';
  if (v.kind !== 'point' && v.kind !== 'range' && v.range != null) return 'Une censure ne doit pas contenir de plage inventée.';
  if (v.kind !== 'below' && (v.limit != null || v.limitKind != null)) return 'Limite réservée aux valeurs non détectées/quantifiées.';
  if (v.limitKind != null && !['lod', 'loq'].includes(v.limitKind)) return 'Nature de limite invalide.';
  if (v.kind === 'point' && v.range && (v.value < v.range.min || v.value > v.range.max)) return 'Valeur rapportée hors de son incertitude.';
  if (v.unit === 'percentOil' && v.basis !== 'oil') return 'Un pourcentage d’huile exige la base « huile ».';
  if (v.unit === 'unknown' && v.basis !== 'unknown') return 'Une unité inconnue ne permet pas de supposer une base de mesure.';
  if (v.unit === 'ngL' && v.basis !== 'beer') return 'La concentration en ng/L exige la matrice bière.';
  if (v.unit === 'ugL' && v.basis !== 'beer') return 'La concentration absolue en µg/L exige la matrice bière.';
  if (v.unit === 'ugLInternalStandardEquivalent' && v.basis !== 'beer') return 'Les équivalents d’étalon en µg/L exigent la matrice bière.';
  if (v.unit === 'ugKgThiolEquivalent' && !['asIs', 'dryMatter', 'unknown'].includes(v.basis)) return 'Les équivalents de thiol en µg/kg portent sur le houblon.';
  if (v.unit === 'ugKgThiolEquivalent' && !['4mmpFree', '4mmpCys', '4mmpGsh', '3mhFree', '3mhCys', '3mhGsh', '3mhGluCys', '3mhCysGly', '3s4mpFree', '3mhaFree'].includes(v.analyte)) return 'Équivalents de thiol réservés aux thiols et à leurs précurseurs.';
  if ((v.unit === 'index') !== (v.analyte === 'hsi') && v.unit !== 'unknown') return 'Le HSI est un indice, pas une concentration.';
  if (['percentOil', 'percentMass'].includes(v.unit) && Math.max(v.value ?? 0, v.range?.max ?? 0, v.limit ?? 0) > 100) return 'Un pourcentage ne peut dépasser 100.';
  if ((v.method != null && typeof v.method !== 'string') || (v.note != null && typeof v.note !== 'string')) return 'Texte de mesure invalide.';
  return null;
}
export function assertHopDocument(collection: 'hopVarieties' | 'hopLots', value: unknown, id?: string): asserts value is HopVariety | HopLot {
  if (!plain(value) || !idOk(value.id) || (id != null && value.id !== id) || !nonempty(value.name)) throw Error('Identité de fiche houblon invalide.');
  const allowed = collection === 'hopVarieties' ? ['id', 'name', 'aliases', 'origin', 'form', 'descriptions', 'analysis', 'archived']
    : ['id', 'varietyId', 'name', 'lotNumber', 'harvestYear', 'growingRegion', 'grower', 'storageNotes', 'referenceOnly', 'form', 'stockItemRef', 'analysis', 'notes', 'archived'];
  if (!onlyKeys(value, allowed)) throw Error('Champ de fiche houblon non reconnu.');
  if (!HOP_FORMS.includes(value.form)) throw Error('Forme du houblon invalide.');
  if (!Array.isArray(value.analysis)) throw Error('Analyse de houblon invalide.');
  const keys = new Set<string>();
  for (const measurement of value.analysis) {
    const error = hopMeasurementError(measurement);
    if (error) throw Error(error);
    if (keys.has(measurement.analyte)) throw Error('Deux mesures du même analyte : choisir celle à retenir.');
    keys.add(measurement.analyte);
  }
  if (value.archived != null && typeof value.archived !== 'boolean') throw Error('État d’archivage invalide.');
  if (collection === 'hopVarieties') {
    if (!Array.isArray(value.aliases) || value.aliases.some((s: unknown) => !nonempty(s)) || !Array.isArray(value.descriptions)) throw Error('Description de variété invalide.');
    for (const description of value.descriptions) {
      if (!plain(description) || !nonempty(description.text) || !['rawHop', 'infusion', 'beer', 'unspecified'].includes(description.context)) throw Error('Description de variété invalide.');
      if (!onlyKeys(description, ['text', 'context', 'source'])) throw Error('Champ de description non reconnu.');
      const error = hopSourceError(description.source);
      if (error) throw Error(error);
    }
    if (value.origin != null && typeof value.origin !== 'string') throw Error('Origine invalide.');
  } else {
    if (!idOk(value.varietyId)) throw Error('Référence de variété absente.');
    if (value.referenceOnly != null && typeof value.referenceOnly !== 'boolean') throw Error('Statut de référence du lot invalide.');
    if (value.referenceOnly && value.stockItemRef) throw Error('Un lot documentaire ne peut pas représenter un article de stock.');
    if (value.harvestYear != null && (!Number.isInteger(value.harvestYear) || value.harvestYear < 1)) throw Error('Année de récolte invalide.');
    for (const key of ['lotNumber', 'growingRegion', 'grower', 'storageNotes', 'stockItemRef', 'notes']) if (value[key] != null && typeof value[key] !== 'string') throw Error('Information de lot invalide.');
  }
}
