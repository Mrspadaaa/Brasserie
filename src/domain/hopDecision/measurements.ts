import { HOP_ANALYTES, hopMeasurementError, type HopAnalyte, type HopMeasurement, type HopRange, type HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopAnalyticalReading, HopDecisionMaterial, HopMaterialComparison, HopNumericResult } from './types';

export function unknownResult(unit: string, reason: string, sources: HopSource[] = []): HopNumericResult {
  return { status: 'unknown', unit, value: null, range: null, uncertainty: 'unknown', sources, reasons: [reason] };
}

export function nominalResult(value: number, unit: string, reason: string, sources: HopSource[] = []): HopNumericResult {
  return Number.isFinite(value)
    ? { status: 'nominal', unit, value, range: null, uncertainty: 'notReported', sources, reasons: [reason] }
    : unknownResult(unit, 'Résultat non fini ; entrées à vérifier.', sources);
}

export function numericBounds(value: HopNumericResult): HopRange | null {
  if (value.status === 'range' && value.range) return value.range;
  return value.status === 'nominal' && value.value !== null ? { min: value.value, max: value.value } : null;
}

export function combineNumeric(inputs: HopNumericResult[], unit: string, calculate: (bounds: HopRange[]) => HopRange, reason: string): HopNumericResult {
  const sources = inputs.flatMap(v => v.sources);
  if (inputs.some(v => v.status === 'conflict')) return { ...unknownResult(unit, 'Sources contradictoires : sélectionner une analyse justifiée avant le calcul.', sources), status: 'conflict' };
  const bounds = inputs.map(numericBounds);
  if (bounds.some(v => !v)) return unknownResult(unit, reason, sources);
  const range = calculate(bounds as HopRange[]);
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) return unknownResult(unit, 'Résultat non fini ou domaine de calcul invalide.', sources);
  if (inputs.every(v => v.status === 'nominal')) return nominalResult(range.min, unit, reason, sources);
  return { status: 'range', unit, value: null, range, uncertainty: inputs.some(v => v.status === 'nominal' || v.uncertainty !== 'reportedBounds') ? 'partial' : 'reportedBounds', sources, reasons: [reason] };
}

function conversion(m: HopMeasurement): { factor: number; unit: string } | null {
  if (m.basis !== 'asIs') return null;
  if (m.analyte === 'totalOil' && m.unit === 'ml100g') return { factor: 1, unit: 'mL/100g' };
  if (m.unit === 'percentMass') return { factor: 1, unit: '% massique' };
  if (m.unit === 'mg100g') return { factor: 0.001, unit: '% massique' };
  if (m.unit === 'ugKg') return { factor: 1e-7, unit: '% massique' };
  return null;
}

function measurementResult(m: HopMeasurement, documentary = false): HopNumericResult {
  const c = conversion(m) ?? (documentary && m.unit === 'percentOil' && m.basis === 'oil' ? { factor: 1, unit: '% huile' }
    : documentary && m.unit === 'percentMass' && m.basis === 'dryMatter' ? { factor: 1, unit: '% matière sèche' }
    : documentary && m.basis === 'beer' && ['ngL', 'ugL'].includes(m.unit) ? { factor: m.unit === 'ngL' ? 0.001 : 1, unit: 'µg/L bière' }
    : documentary && m.unit === 'index' ? { factor: 1, unit: 'index documentaire' }
    : null);
  if (!c) return unknownResult(m.unit, 'Base analytique non convertible en charge de produit tel quel ; mesure conservée pour lecture.', [m.source]);
  if (m.kind === 'unknown') return unknownResult(c.unit, 'Analyse non renseignée.', [m.source]);
  const range = m.kind === 'below' && m.limit !== undefined ? { min: 0, max: m.limit }
    : m.range ?? null;
  const upper = range?.max ?? (m.kind === 'point' ? m.value : undefined);
  if (upper !== undefined && ['% massique', '% huile', '% matière sèche'].includes(c.unit) && upper * c.factor > 100) return unknownResult(c.unit, 'Concentration convertie supérieure à 100 % ; analyse physiquement incohérente.', [m.source]);
  if (range) return { status: 'range', value: null, range: { min: range.min * c.factor, max: range.max * c.factor }, unit: c.unit,
    uncertainty: 'reportedBounds', sources: [m.source], reasons: [m.kind === 'below' ? 'Borne de non-détection ; aucune concentration nulle supposée.' : 'Plage rapportée, sans niveau de couverture statistique supposé.'] };
  if (m.kind === 'point' && m.value !== undefined) return nominalResult(m.value * c.factor, c.unit, 'Valeur rapportée ; incertitude analytique non fournie.', [m.source]);
  return unknownResult(c.unit, 'Non-détection sans limite analytique ; impossible de calculer une borne.', [m.source]);
}

/** Preserve competing observations instead of averaging or taking the first record. */
export function readHopAnalysis(material: HopDecisionMaterial, analyte: HopAnalyte, purpose: 'charge' | 'documentary' = 'charge'): HopAnalyticalReading {
  const unit = analyte === 'totalOil' ? 'mL/100g' : '% massique';
  const empty = (reason: string): HopAnalyticalReading => ({ ...unknownResult(unit, reason), analyte, scope: 'unknown', measurements: [] });
  if (material.lot && material.variety && material.lot.varietyId !== material.variety.id) return empty('Le lot ne correspond pas à la variété sélectionnée.');
  if (material.lot && material.lot.form !== 'unknown' && material.lot.form !== material.form) return empty('La forme du lot contredit celle de la matière choisie.');
  if (material.lot?.archived || material.variety?.archived) return empty('Référence archivée : sélectionner une matière active.');
  const own = (material.lot?.analysis ?? []).filter(m => m.analyte === analyte);
  const validOwn = own.filter(m => !hopMeasurementError(m));
  if (own.length !== validOwn.length) return empty('Analyse du lot invalide ; aucune substitution silencieuse par une valeur variétale.');
  const declared = (material.declaredAnalysis ?? []).filter(m => m.analyte === analyte);
  if (declared.length && validOwn.some(m => m.kind !== 'unknown')) {
    const both = [...declared, ...validOwn.filter(m => m.kind !== 'unknown')];
    const signatures = both.map(m => { const r = measurementResult(m, purpose === 'documentary'); return JSON.stringify([r.status, r.unit, r.value, r.range]); });
    if (new Set(signatures).size > 1) return { ...unknownResult(unit, 'La valeur saisie et l’analyse du lot diffèrent ; choisir et justifier la référence avant de calculer.', both.map(m => m.source)), status: 'conflict', analyte, scope: 'declaration', measurements: both };
  }
  const fromDeclaration = declared.length > 0;
  const fromLot = !fromDeclaration && validOwn.some(m => m.kind !== 'unknown');
  const observations = fromDeclaration ? declared : fromLot ? validOwn.filter(m => m.kind !== 'unknown') : (material.variety?.analysis ?? []).filter(m => m.analyte === analyte);
  if (!observations.length) return empty('Aucune analyse disponible pour ce champ.');
  if (observations.some(m => hopMeasurementError(m))) return empty('Analyse invalide ; les données sources doivent être corrigées.');
  const scope = fromDeclaration ? 'declaration' : fromLot ? 'lot' : 'variety';
  const form = fromDeclaration ? material.form : fromLot ? material.lot!.form : material.variety!.form;
  const readings = observations.map(m => measurementResult(m, purpose === 'documentary'));
  const sources = observations.map(m => m.source);
  const formMismatch = form !== material.form && form !== 'unknown';
  if (formMismatch) return { ...unknownResult(unit, 'La forme analysée diffère de la matière choisie ; valeur documentaire uniquement.', sources), analyte, scope, measurements: observations };
  const signature = (r: HopNumericResult) => JSON.stringify([r.status, r.unit, r.value, r.range]);
  if (new Set(readings.map(signature)).size > 1) return { ...unknownResult(unit, 'Plusieurs valeurs ou bases distinctes ; analyses conservées sans moyenne ni choix implicite.', sources), status: 'conflict', analyte, scope, measurements: observations };
  const result = readings[0];
  return { ...result, sources, analyte, scope, measurements: observations, reasons: [...result.reasons,
    ...(scope === 'variety' ? ['Référence variétale ; aucune analyse du lot disponible.'] : []),
    ...(scope === 'declaration' ? ['Valeur saisie pour cette décision ; ce n’est pas une analyse de lot attestée.'] : []),
    ...(form === 'unknown' ? ['Forme de la référence non précisée ; le calcul reste documentaire et conditionnel.'] : [])] };
}

/** Deterministic content reference for stale decisions; not a security token. */
export function hopDecisionReference(value: unknown): string {
  const canonical = (v: any): any => Array.isArray(v) ? v.map(canonical)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => [k, canonical(v[k])])) : v;
  return JSON.stringify(canonical(value));
}

export function compareHopMaterials(left: HopDecisionMaterial, right: HopDecisionMaterial): HopMaterialComparison {
  return {
    leftId: left.id, rightId: right.id,
    analytical: HOP_ANALYTES.map(analyte => {
      const a = readHopAnalysis(left, analyte, 'documentary'), b = readHopAnalysis(right, analyte, 'documentary');
      const indexMethods = [...a.measurements, ...b.measurements].map(m => m.method);
      const comparableIndex = analyte !== 'hsi' || indexMethods.length > 1 && indexMethods.every(m => !!m) && new Set(indexMethods).size === 1;
      const difference = a.unit === b.unit && comparableIndex
        ? combineNumeric([a, b], a.unit, ([x, y]) => ({ min: y.min - x.max, max: y.max - x.min }), 'Différence analytique droite − gauche ; aucune différence de goût déduite.')
        : unknownResult(a.unit, 'Unités, bases ou méthodes non comparables ; les valeurs documentaires restent lisibles.');
      return { analyte, left: a, right: b, difference };
    }),
    descriptions: (['rawHop', 'infusion', 'beer', 'unspecified'] as const).map(context => ({ context,
      left: (left.variety?.descriptions ?? []).filter(d => d.context === context),
      right: (right.variety?.descriptions ?? []).filter(d => d.context === context) })),
    limits: ['Descripteurs du houblon brut, infusion et bière conservés séparément.', 'Les plages variétales et les analyses de lots n’ont pas la même portée.', 'Une proximité de matière ne garantit ni même dose, ni même bière.']
  };
}
