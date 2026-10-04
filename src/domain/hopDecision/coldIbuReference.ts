import { hopAdviceContentReference } from './adviceContentReference';
import { hopSourceError, type HopRange, type HopSource } from '../../../functions/src/hopIndexSchema';
import { coldDecimal, coldDecimalToNumber, coldDecimalSnapshot, compareColdDecimals, sumColdDecimalNumbers,
  addColdDecimals, subtractColdDecimals, multiplyColdDecimals, divideColdDecimals, type ColdDecimalFraction } from './coldIbuDecimal';

export const HOP_COLD_BU_CALIBRATION_FORMAT = 'cold-hop-bu-calibration-v1' as const;
export const HOP_COLD_BU_REFERENCE_FORMAT = 'cold-hop-bu-reference-result-v1' as const;
export const HOP_COLD_BU_REFERENCE_VERSION = 'hop-cold-bu-reference-v2' as const;

export interface ColdHopBuCalibrationPoint {
  doseGPerHL: number;
  valueBU: number;
}

/** A versioned reference calibration, not a model of every beer or hop. */
export interface ColdHopBuCalibration {
  format: typeof HOP_COLD_BU_CALIBRATION_FORMAT;
  calibrationId: string;
  version: string;
  output: { analyte: 'spectrophotometricBU'; unit: 'BU'; method: string };
  source: HopSource;
  sourceReadingLevel: 'primaryFullText';
  conditions: {
    hop: { variety: string; lotDescription: string; form: string; preparation: string };
    beer: {
      description: string;
      abvPct: number;
      filtered: boolean;
      yeastStatus: 'removedBeforeContact' | 'present' | 'unknown';
      preparedBaseBU: number | null;
      treatmentVolumeL: number;
      vesselCount: number;
      vesselVolumeL: number;
    };
    contact: {
      mode: string;
      durationHours: number;
      meanObservedTemperatureC: HopRange;
      temperatureSummaryOnly: true;
    };
  };
  control: { doseGPerHL: 0; valueBU: number };
  points: ColdHopBuCalibrationPoint[];
  uncertainty: 'notReported';
  limitations: string[];
}

export type ColdHopBuReferenceStatus = 'publishedObservation' | 'interpolation' | 'doseUnknown' | 'outOfDomain';

export interface ColdHopBuReferenceResult {
  format: typeof HOP_COLD_BU_REFERENCE_FORMAT;
  version: typeof HOP_COLD_BU_REFERENCE_VERSION;
  reference: string;
  calibrationSnapshot: ColdHopBuCalibration;
  calibrationReference: string;
  doseInput: { value: number | null; unit: 'g/hL' | 'g/L' };
  doseEffectiveGPerHL: number | null;
  /** Exact coordinate used for domain and node checks before the final numeric display. */
  doseExactGPerHL: { numerator: string; denominator: string } | null;
  arithmetic: 'exactDecimal-v1';
  domainGPerHL: HopRange;
  status: ColdHopBuReferenceStatus;
  valueBU: number | null;
  controlBU: number;
  contrastToControlBU: number | null;
  nodesUsed: ColdHopBuCalibrationPoint[];
  source: HopSource;
  method: string;
  algorithm: 'piecewiseLinearInterpolation';
  uncertainty: 'notReported';
  limitations: string[];
}

export interface InterpolateColdHopBuReferenceInput {
  /** Omission selects the published Lafontaine 2018 reference. An invalid provided calibration never falls back. */
  calibration?: ColdHopBuCalibration;
  dose: { value: number | null; unit: 'g/hL' | 'g/L' };
}

export class ColdHopBuReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ColdHopBuReferenceError';
  }
}

const source: HopSource = {
  title: 'Impact of static dry-hopping rate on the sensory and analytical profiles of beer',
  author: 'S. R. Lafontaine; Thomas H. Shellhammer',
  year: 2018,
  kind: 'research',
  reference: 'https://onlinelibrary.wiley.com/doi/full/10.1002/jib.517',
  locator: 'Methods: Experimental design; Table 5, dry-hop rate (g/hL) and beer BU.',
};

const lafontaine2018Calibration: ColdHopBuCalibration = {
  format: HOP_COLD_BU_CALIBRATION_FORMAT,
  calibrationId: 'static-dry-hop-bu-reference-lafontaine-2018',
  version: 'lafontaine-2018-table5-v1',
  output: { analyte: 'spectrophotometricBU', unit: 'BU', method: 'ASBC Beer 23A' },
  source,
  sourceReadingLevel: 'primaryFullText',
  conditions: {
    hop: { variety: 'Cascade', lotDescription: 'Lot de récolte 2015', form: 'whole-cone', preparation: 'Cônes entiers broyés et homogénéisés.' },
    beer: {
      description: 'Bière pâle filtrée; base préparée décrite à 19,8 BU.',
      abvPct: 4.75,
      filtered: true,
      yeastStatus: 'removedBeforeContact',
      preparedBaseBU: 19.8,
      treatmentVolumeL: 80,
      vesselCount: 2,
      vesselVolumeL: 40,
    },
    contact: {
      mode: 'static',
      durationHours: 24,
      meanObservedTemperatureC: { min: 13.3, max: 15 },
      temperatureSummaryOnly: true,
    },
  },
  control: { doseGPerHL: 0, valueBU: 17 },
  points: [
    { doseGPerHL: 0, valueBU: 17 },
    { doseGPerHL: 200, valueBU: 19.4 },
    { doseGPerHL: 386, valueBU: 21 },
    { doseGPerHL: 800, valueBU: 25 },
    { doseGPerHL: 1600, valueBU: 26 },
  ],
  uncertainty: 'notReported',
  limitations: [
    'Réponse BU observée pour ce protocole de houblonnage statique, ce lot Cascade et cette bière; ce n’est pas une calibration de la bière de l’utilisateur.',
    'La température 13,3–15 °C est la plage des moyennes observées; elle ne définit pas une loi de réponse à la température.',
    'Le protocole rapporte environ 19,8 BU pour la base préparée, tandis que le contrôle Table 5 vaut 17 BU; les références restent distinctes.',
    'La Table 5 ne rapporte pas d’intervalle prédictif BU. L’interpolation est une convention de référence linéaire par segments, non une équation ajustée par les auteurs.',
    'Les évaluations sensorielles de l’article portent sur l’arôme; aucun score d’intensité sensorielle d’amertume n’est estimé.',
  ],
};

const record = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
function invalid(message: string): never { throw new ColdHopBuReferenceError(message); }

function assertCalibration(value: unknown): asserts value is ColdHopBuCalibration {
  const calibrationKeys = ['format', 'calibrationId', 'version', 'output', 'source', 'sourceReadingLevel', 'conditions', 'control', 'points', 'uncertainty', 'limitations'];
  if (!record(value) || Object.keys(value).sort().join('|') !== [...calibrationKeys].sort().join('|')
    || value.format !== HOP_COLD_BU_CALIBRATION_FORMAT || !nonempty(value.calibrationId) || !nonempty(value.version)
    || !record(value.output) || Object.keys(value.output).sort().join('|') !== ['analyte', 'unit', 'method'].sort().join('|')
    || value.output.analyte !== 'spectrophotometricBU' || value.output.unit !== 'BU' || !nonempty(value.output.method)
    || hopSourceError(value.source) || !nonempty(value.source.locator) || value.sourceReadingLevel !== 'primaryFullText'
    || !record(value.conditions) || Object.keys(value.conditions).sort().join('|') !== ['hop', 'beer', 'contact'].sort().join('|')
    || !record(value.conditions.hop) || Object.keys(value.conditions.hop).sort().join('|') !== ['variety', 'lotDescription', 'form', 'preparation'].sort().join('|')
    || !nonempty(value.conditions.hop.variety) || !nonempty(value.conditions.hop.lotDescription)
    || !nonempty(value.conditions.hop.form) || !nonempty(value.conditions.hop.preparation)
    || !record(value.conditions.beer) || Object.keys(value.conditions.beer).sort().join('|') !== [
      'description', 'abvPct', 'filtered', 'yeastStatus', 'preparedBaseBU', 'treatmentVolumeL', 'vesselCount', 'vesselVolumeL',
    ].sort().join('|') || !nonempty(value.conditions.beer.description) || typeof value.conditions.beer.filtered !== 'boolean'
    || !finite(value.conditions.beer.abvPct) || value.conditions.beer.abvPct < 0 || value.conditions.beer.abvPct > 100
    || !['removedBeforeContact', 'present', 'unknown'].includes(value.conditions.beer.yeastStatus)
    || value.conditions.beer.preparedBaseBU !== null && (!finite(value.conditions.beer.preparedBaseBU) || value.conditions.beer.preparedBaseBU < 0)
    || !finite(value.conditions.beer.treatmentVolumeL) || value.conditions.beer.treatmentVolumeL <= 0
    || !Number.isSafeInteger(value.conditions.beer.vesselCount) || value.conditions.beer.vesselCount <= 0
    || !finite(value.conditions.beer.vesselVolumeL) || value.conditions.beer.vesselVolumeL <= 0
    || Math.abs(value.conditions.beer.treatmentVolumeL - value.conditions.beer.vesselCount * value.conditions.beer.vesselVolumeL) > 1e-9
    || !record(value.conditions.contact) || Object.keys(value.conditions.contact).sort().join('|') !== [
      'mode', 'durationHours', 'meanObservedTemperatureC', 'temperatureSummaryOnly',
    ].sort().join('|') || !nonempty(value.conditions.contact.mode) || !finite(value.conditions.contact.durationHours)
    || value.conditions.contact.durationHours <= 0 || value.conditions.contact.temperatureSummaryOnly !== true
    || !record(value.conditions.contact.meanObservedTemperatureC) || !finite(value.conditions.contact.meanObservedTemperatureC.min)
    || !finite(value.conditions.contact.meanObservedTemperatureC.max) || value.conditions.contact.meanObservedTemperatureC.min > value.conditions.contact.meanObservedTemperatureC.max
    || !record(value.control) || Object.keys(value.control).sort().join('|') !== ['doseGPerHL', 'valueBU'].sort().join('|')
    || value.control.doseGPerHL !== 0 || !finite(value.control.valueBU) || value.control.valueBU < 0
    || value.uncertainty !== 'notReported' || !Array.isArray(value.limitations) || !value.limitations.length || !value.limitations.every(nonempty)
    || !Array.isArray(value.points) || value.points.length < 2) {
    invalid('Calibration BU froide mal formée ou provenance/contexte incomplet.');
  }
  let priorDose = -Infinity;
  for (const point of value.points) {
    if (!record(point) || Object.keys(point).sort().join('|') !== ['doseGPerHL', 'valueBU'].sort().join('|')
      || !finite(point.doseGPerHL) || point.doseGPerHL < 0 || point.doseGPerHL <= priorDose
      || !finite(point.valueBU) || point.valueBU < 0) invalid('Les points BU doivent être finis, non négatifs et strictement ordonnés par dose.');
    priorDose = point.doseGPerHL;
  }
  if (value.points[0].doseGPerHL !== 0 || value.points[0].valueBU !== value.control.valueBU) {
    invalid('Le contrôle doit être le point dose zéro de la courbe et garder sa valeur publiée distincte.');
  }
}

export function getColdHopBuCalibration(): ColdHopBuCalibration {
  return structuredClone(lafontaine2018Calibration);
}

/** Content fingerprint only; it is not proof of authenticity or a transferable calibration. */
export function coldHopBuCalibrationReference(calibration: ColdHopBuCalibration): string {
  assertCalibration(calibration);
  return hopAdviceContentReference('cold-hop-bu-calibration-v1', calibration);
}

function assertDose(value: unknown): asserts value is InterpolateColdHopBuReferenceInput['dose'] {
  if (!record(value) || Object.keys(value).sort().join('|') !== ['value', 'unit'].sort().join('|')
    || !['g/hL', 'g/L'].includes(value.unit) || value.value !== null && (!finite(value.value) || value.value < 0)) {
    invalid('La dose doit être null ou un nombre fini non négatif, avec unité g/hL ou g/L.');
  }
}

function referenceResultContent(result: Omit<ColdHopBuReferenceResult, 'reference'>): Omit<ColdHopBuReferenceResult, 'reference'> {
  return result;
}

export function coldHopBuReferenceResultReference(result: ColdHopBuReferenceResult | Omit<ColdHopBuReferenceResult, 'reference'>): string {
  if (record(result) && Object.prototype.hasOwnProperty.call(result, 'reference')) {
    const { reference: _reference, ...content } = result as ColdHopBuReferenceResult;
    return hopAdviceContentReference('cold-hop-bu-reference-result-v1', content);
  }
  return hopAdviceContentReference('cold-hop-bu-reference-result-v1', result);
}

function finishReferenceResult(content: Omit<ColdHopBuReferenceResult, 'reference'>): ColdHopBuReferenceResult {
  const frozen = structuredClone(referenceResultContent(content));
  return { ...frozen, reference: coldHopBuReferenceResultReference(frozen) };
}

export function interpolateColdHopBuReference(input: InterpolateColdHopBuReferenceInput): ColdHopBuReferenceResult {
  if (!record(input) || Object.keys(input).some(key => !['calibration', 'dose'].includes(key))
    || !Object.prototype.hasOwnProperty.call(input, 'dose')) invalid('Demande d’interpolation froide mal formée.');
  assertDose(input.dose);
  const coordinate = input.dose.value === null ? null
    : multiplyColdDecimals(coldDecimal(input.dose.value), coldDecimal(input.dose.unit === 'g/L' ? 100 : 1));
  return referenceAtExactDose(input, coordinate);
}

/** Aggregate one explicitly selected contact without accumulating binary rounding errors. */
export function interpolateColdHopBuFromMass(input: {
  calibration?: ColdHopBuCalibration; massesGrams: readonly number[]; volumeL: number;
}): ColdHopBuReferenceResult {
  if (!record(input) || Object.keys(input).some(key => !['calibration', 'massesGrams', 'volumeL'].includes(key))
    || !Array.isArray(input.massesGrams) || input.massesGrams.some(value => !finite(value) || value < 0)
    || !finite(input.volumeL) || input.volumeL <= 0) invalid('Masses finies non négatives et volume positif requis.');
  const doseGL = divideColdDecimals(sumColdDecimalNumbers(input.massesGrams), coldDecimal(input.volumeL));
  const value = coldDecimalToNumber(doseGL);
  if (!Number.isFinite(value)) invalid('La dose issue du contact ne peut être représentée comme nombre fini.');
  return referenceAtExactDose({ calibration: input.calibration, dose: { value, unit: 'g/L' } }, multiplyColdDecimals(doseGL, coldDecimal(100)));
}

function referenceAtExactDose(input: InterpolateColdHopBuReferenceInput, coordinate: ColdDecimalFraction | null): ColdHopBuReferenceResult {
  const calibration = input.calibration === undefined ? getColdHopBuCalibration() : structuredClone(input.calibration);
  assertCalibration(calibration);
  const calibrationReference = coldHopBuCalibrationReference(calibration);
  const points = calibration.points;
  const domainGPerHL = { min: points[0].doseGPerHL, max: points[points.length - 1].doseGPerHL };
  const base = {
    format: HOP_COLD_BU_REFERENCE_FORMAT,
    version: HOP_COLD_BU_REFERENCE_VERSION,
    calibrationSnapshot: calibration,
    calibrationReference,
    doseInput: structuredClone(input.dose),
    doseExactGPerHL: coordinate === null ? null : coldDecimalSnapshot(coordinate),
    arithmetic: 'exactDecimal-v1' as const,
    domainGPerHL,
    controlBU: calibration.control.valueBU,
    source: structuredClone(calibration.source),
    method: calibration.output.method,
    algorithm: 'piecewiseLinearInterpolation' as const,
    uncertainty: 'notReported' as const,
    limitations: structuredClone(calibration.limitations),
  };

  if (coordinate === null) {
    return finishReferenceResult({ ...base, doseEffectiveGPerHL: null, status: 'doseUnknown', valueBU: null,
      contrastToControlBU: null, nodesUsed: [], limitations: [...base.limitations, 'Dose inconnue : la courbe et son domaine restent consultables, aucune BU n’est imputée.'] });
  }

  const doseEffectiveGPerHL = coldDecimalToNumber(coordinate);
  if (!Number.isFinite(doseEffectiveGPerHL)) invalid('La conversion de dose en g/hL n’est pas finie.');
  if (compareColdDecimals(coordinate, coldDecimal(domainGPerHL.min)) < 0 || compareColdDecimals(coordinate, coldDecimal(domainGPerHL.max)) > 0) {
    return finishReferenceResult({ ...base, doseEffectiveGPerHL, status: 'outOfDomain', valueBU: null,
      contrastToControlBU: null, nodesUsed: [], limitations: [...base.limitations, `Dose hors domaine publié ${domainGPerHL.min}–${domainGPerHL.max} g/hL : aucune extrapolation ou saturation appliquée.`] });
  }

  const exact = points.find(point => compareColdDecimals(coldDecimal(point.doseGPerHL), coordinate) === 0);
  if (exact) {
    return finishReferenceResult({ ...base, doseEffectiveGPerHL, status: 'publishedObservation', valueBU: exact.valueBU,
      contrastToControlBU: coldDecimalToNumber(subtractColdDecimals(coldDecimal(exact.valueBU), coldDecimal(calibration.control.valueBU))), nodesUsed: [structuredClone(exact)] });
  }
  const rightIndex = points.findIndex(point => compareColdDecimals(coldDecimal(point.doseGPerHL), coordinate) > 0);
  if (rightIndex <= 0) invalid('Aucune paire de points n’encadre la dose dans le domaine fermé.');
  const left = points[rightIndex - 1], right = points[rightIndex];
  const ratio = divideColdDecimals(subtractColdDecimals(coordinate, coldDecimal(left.doseGPerHL)),
    subtractColdDecimals(coldDecimal(right.doseGPerHL), coldDecimal(left.doseGPerHL)));
  const exactBU = addColdDecimals(coldDecimal(left.valueBU), multiplyColdDecimals(ratio, subtractColdDecimals(coldDecimal(right.valueBU), coldDecimal(left.valueBU))));
  const valueBU = coldDecimalToNumber(exactBU);
  if (!Number.isFinite(valueBU)) invalid('L’interpolation BU a produit une valeur non finie.');
  return finishReferenceResult({ ...base, doseEffectiveGPerHL, status: 'interpolation', valueBU,
    contrastToControlBU: coldDecimalToNumber(subtractColdDecimals(exactBU, coldDecimal(calibration.control.valueBU))), nodesUsed: [structuredClone(left), structuredClone(right)] });
}
