import {
  HOP_ANALYTES, HopAnalyte, HopConfidence, HopLot, HopMeasurement, HopRange, HopVariety,
  hopMeasurementError
} from './hopIndexSchema.js';

export interface ResolvedHopFact {
  analyte: HopAnalyte;
  origin: 'lot' | 'variety' | 'unknown';
  measurement?: HopMeasurement;
  /** A sourced but unquantified entry remains readable without becoming an engine input. */
  documentary?: HopMeasurement;
  /** Only a reported interval/bound; never invented around a point estimate. */
  range: HopRange | null;
  confidence: HopConfidence;
  compatible: boolean;
  reasons: string[];
}

export function reportedHopRange(m: HopMeasurement): HopRange | null {
  if (hopMeasurementError(m)) return null;
  if (m.kind === 'range' || m.kind === 'point') return m.range ? { ...m.range } : null;
  // A nonnegative concentration known to be below an analytical limit is bounded, not zero.
  if (m.kind === 'below' && m.limit != null) return { min: 0, max: m.limit };
  return null;
}

/** No I/O or mutation. Bad imported fields degrade independently; missing is never zero. */
export function resolveHopFacts(lot?: HopLot | null, variety?: HopVariety | null): ResolvedHopFact[] {
  return HOP_ANALYTES.map(analyte => {
    const reasons: string[] = [];
    const own = Array.isArray(lot?.analysis) ? lot.analysis.find(m => m?.analyte === analyte) : undefined;
    const linked = !lot || variety?.id === lot.varietyId;
    const typical = linked && Array.isArray(variety?.analysis) ? variety.analysis.find(m => m?.analyte === analyte) : undefined;
    const validOwn = own && !hopMeasurementError(own);
    if (own && !validOwn) reasons.push('Mesure du lot inexploitable ; référence variétale éventuelle.');
    if (lot && !linked) reasons.push('Référence de variété indisponible.');
    // An explicit nondetection survives. An explicit "not analysed" permits a labelled fallback.
    const fromLot = validOwn && own.kind !== 'unknown';
    const measurement = fromLot ? own : typical && !hopMeasurementError(typical) && typical.kind !== 'unknown' ? typical : undefined;
    if (!measurement) return { analyte, origin: 'unknown', range: null, confidence: 'low', compatible: false,
      ...(validOwn ? { documentary: own } : typical && !hopMeasurementError(typical) ? { documentary: typical } : {}),
      reasons: [...reasons, 'Aucune mesure exploitable pour ce champ.'] };
    const origin = fromLot ? 'lot' : 'variety';
    const matchingForm = fromLot ? lot?.form !== 'unknown' : !!variety && variety.form !== 'unknown' && (!lot || lot.form === variety.form);
    const compatible = matchingForm && measurement.unit !== 'unknown' && measurement.unit !== 'ugLInternalStandardEquivalent' && measurement.basis !== 'unknown';
    if (!matchingForm) reasons.push('Forme du produit inconnue ou différente de la référence ; valeur documentaire.');
    if (measurement.basis === 'unknown') reasons.push('Base de mesure inconnue.');
    if (measurement.unit === 'ugLInternalStandardEquivalent') reasons.push('Équivalents d’étalon interne : mesure semi-quantitative documentaire, sans réponse analytique transférable établie.');
    if (measurement.source.year === null) reasons.push('Année de la source inconnue.');
    if (!fromLot) reasons.push('Plage ou valeur de variété ; le lot n’a pas été mesuré sur ce champ.');
    const range = reportedHopRange(measurement);
    if (!range) reasons.push(measurement.kind === 'below' ? 'Limite de détection non fournie.' : 'Incertitude analytique non fournie.');
    if (fromLot && typical && !hopMeasurementError(typical) && typical.unit === own.unit && typical.basis === own.basis) {
      const typicalRange = reportedHopRange(typical);
      const actual = range ?? (own.kind === 'point' ? { min: own.value!, max: own.value! } : null);
      if (typicalRange && actual && (actual.max < typicalRange.min || actual.min > typicalRange.max)) reasons.push('La mesure du lot est hors de la plage variétale ; elle est conservée.');
    }
    return { analyte, origin, measurement, range, compatible,
      confidence: compatible && range && measurement.source.year !== null ? measurement.confidence : 'low', reasons } as ResolvedHopFact;
  });
}

export function searchHopVarieties(varieties: HopVariety[], query: string, includeArchived = false): HopVariety[] {
  const fold = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const terms = fold(query).trim().split(/\s+/).filter(Boolean);
  return varieties.filter(v => (includeArchived || !v.archived) && terms.every(term => fold([v.name, ...(Array.isArray(v.aliases) ? v.aliases : []), v.origin ?? '',
    ...(Array.isArray(v.descriptions) ? v.descriptions.map(d => d?.text ?? '') : [])].join(' ')).includes(term))).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'fr'));
}
