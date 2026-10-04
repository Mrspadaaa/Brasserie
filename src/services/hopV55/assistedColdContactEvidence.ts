import {
  HOP_COLD_BU_REFERENCE_FORMAT,
  HOP_COLD_BU_REFERENCE_VERSION,
  coldHopBuCalibrationReference,
  coldHopBuReferenceResultReference,
  type ColdHopBuReferenceResult,
} from '../../domain/hopDecision/coldIbuReference';
import {
  coldDecimal,
  coldDecimalToNumber,
  compareColdDecimals,
  divideColdDecimals,
  subtractColdDecimals,
  type ColdDecimalFraction,
} from '../../domain/hopDecision/coldIbuDecimal';

const COLD_CONTACT_TOOL = 'cold_contact_bitterness_reference';
const RESULT_KEYS = [
  'format', 'version', 'reference', 'calibrationSnapshot', 'calibrationReference', 'doseInput',
  'doseEffectiveGPerHL', 'doseExactGPerHL', 'arithmetic', 'domainGPerHL', 'status', 'valueBU',
  'controlBU', 'contrastToControlBU', 'nodesUsed', 'source', 'method', 'algorithm', 'uncertainty', 'limitations',
].sort();

export type AssistedColdContactEvidence =
  | {
      status: 'ready';
      evidenceId: string;
      resultReference: string;
      snapshot: ColdHopBuReferenceResult;
      facts: string[];
      sources: Array<{ title: string; url: string }>;
      limits: string[];
    }
  | {
      status: 'missing';
      evidenceId: string;
      resultReference: string;
      reason: 'doseUnknown' | 'outOfDomain';
      snapshot: ColdHopBuReferenceResult;
      facts: string[];
      sources: Array<{ title: string; url: string }>;
      limits: string[];
    }
  | { status: 'unsupportedTool'; evidenceId?: string; toolName?: string }
  | { status: 'unsupportedFormat'; evidenceId: string; format: unknown; version: unknown; raw: unknown }
  | { status: 'invalid'; evidenceId?: string; reason: string };

type ColdEvidenceInput = { id: string; name: string; data: unknown };
type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNonemptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const exactKeys = (value: RecordValue, keys: readonly string[]) => Object.keys(value).sort().join('|') === [...keys].sort().join('|');

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'undefined';
}

function same(left: unknown, right: unknown): boolean {
  return stableJson(left) === stableJson(right);
}

function validNode(value: unknown): value is { doseGPerHL: number; valueBU: number } {
  return isRecord(value) && exactKeys(value, ['doseGPerHL', 'valueBU'])
    && isFiniteNumber(value.doseGPerHL) && value.doseGPerHL >= 0
    && isFiniteNumber(value.valueBU) && value.valueBU >= 0;
}

function withinOneUlp(left: number, right: number): boolean {
  const tolerance = Math.max(Number.MIN_VALUE, Number.EPSILON * Math.max(Math.abs(left), Math.abs(right)));
  return Object.is(left, right) || Math.abs(left - right) <= tolerance;
}

function exactDoseCoordinate(value: unknown): ColdDecimalFraction | undefined {
  if (!isRecord(value) || !exactKeys(value, ['numerator', 'denominator'])
    || typeof value.numerator !== 'string' || !/^(0|[1-9]\d*)$/.test(value.numerator)
    || typeof value.denominator !== 'string' || !/^[1-9]\d*$/.test(value.denominator)) return undefined;
  const numerator = BigInt(value.numerator);
  const denominator = BigInt(value.denominator);
  let left = numerator, right = denominator;
  while (right !== 0n) { const remainder = left % right; left = right; right = remainder; }
  const divisor = left || 1n;
  if (numerator / divisor !== numerator || denominator / divisor !== denominator) return undefined;
  return { numerator, denominator };
}

function validateKnownResult(value: unknown): ColdHopBuReferenceResult | string {
  if (!isRecord(value) || !exactKeys(value, RESULT_KEYS)) return 'Structure du résultat froid incomplète ou étendue.';
  if (value.format !== HOP_COLD_BU_REFERENCE_FORMAT || value.version !== HOP_COLD_BU_REFERENCE_VERSION) {
    return 'Format froid non pris en charge.';
  }

  const result = value as unknown as ColdHopBuReferenceResult;
  if (!isRecord(result.doseInput) || !exactKeys(result.doseInput as unknown as RecordValue, ['value', 'unit'])
    || !['g/L', 'g/hL'].includes(result.doseInput.unit)
    || result.doseInput.value !== null && (!isFiniteNumber(result.doseInput.value) || result.doseInput.value < 0)) {
    return 'Dose d’entrée froide invalide.';
  }
  if (!isRecord(result.domainGPerHL) || !exactKeys(result.domainGPerHL as unknown as RecordValue, ['min', 'max'])
    || !isFiniteNumber(result.domainGPerHL.min) || !isFiniteNumber(result.domainGPerHL.max)
    || result.domainGPerHL.min < 0 || result.domainGPerHL.min > result.domainGPerHL.max) {
    return 'Domaine froid invalide.';
  }
  if (result.arithmetic !== 'exactDecimal-v1' || result.algorithm !== 'piecewiseLinearInterpolation'
    || result.uncertainty !== 'notReported' || !isNonemptyString(result.method)
    || !isNonemptyString(result.reference) || !isNonemptyString(result.calibrationReference)
    || !isFiniteNumber(result.controlBU) || result.controlBU < 0
    || !Array.isArray(result.nodesUsed) || !result.nodesUsed.every(validNode)
    || !Array.isArray(result.limitations) || result.limitations.some((entry) => !isNonemptyString(entry))) {
    return 'Métadonnées, nombres ou unités du résultat froid invalides.';
  }

  let calibrationReference: string;
  try {
    calibrationReference = coldHopBuCalibrationReference(result.calibrationSnapshot);
  } catch {
    return 'Snapshot de calibration froide invalide.';
  }
  const calibration = result.calibrationSnapshot;
  const points = calibration.points;
  if (calibrationReference !== result.calibrationReference
    || !same(result.source, calibration.source)
    || result.method !== calibration.output.method
    || result.controlBU !== calibration.control.valueBU
    || result.domainGPerHL.min !== points[0].doseGPerHL
    || result.domainGPerHL.max !== points[points.length - 1].doseGPerHL) {
    return 'Calibration, source, méthode, témoin ou domaine incohérent.';
  }

  const unknownDose = result.doseInput.value === null;
  let exactCoordinate: ColdDecimalFraction | null = null;
  if (unknownDose) {
    if (result.doseExactGPerHL !== null || result.doseEffectiveGPerHL !== null) return 'Dose inconnue avec coordonnée renseignée.';
  } else {
    exactCoordinate = exactDoseCoordinate(result.doseExactGPerHL) ?? null;
    if (!exactCoordinate
      || !isFiniteNumber(result.doseEffectiveGPerHL) || result.doseEffectiveGPerHL < 0) {
      return 'Coordonnée exacte ou dose effective invalide.';
    }
    try {
      // Check displayed numbers against the exact coordinate; never rebuild the coordinate from rounded input.
      const displayedEffective = coldDecimalToNumber(exactCoordinate);
      const displayedInput = coldDecimalToNumber(result.doseInput.unit === 'g/L'
        ? divideColdDecimals(exactCoordinate, coldDecimal(100)) : exactCoordinate);
      if (result.doseEffectiveGPerHL !== displayedEffective || result.doseInput.value !== displayedInput) {
        return 'Dose affichée et coordonnée exacte ne correspondent pas.';
      }
    } catch {
      return 'Vérification de dose froide invalide.';
    }
  }

  if (unknownDose) {
    if (result.status !== 'doseUnknown' || result.valueBU !== null || result.contrastToControlBU !== null || result.nodesUsed.length !== 0) {
      return 'Une dose inconnue ne peut produire de BU, de contraste ou de nœud.';
    }
    const expectedLimits = [...calibration.limitations, 'Dose inconnue : la courbe et son domaine restent consultables, aucune BU n’est imputée.'];
    if (!same(result.limitations, expectedLimits)) return 'Limites de dose inconnue incohérentes.';
  } else {
    const coordinate = exactCoordinate!;
    const min = coldDecimal(result.domainGPerHL.min);
    const max = coldDecimal(result.domainGPerHL.max);
    const comparisonToMin = compareColdDecimals(coordinate, min);
    const comparisonToMax = compareColdDecimals(coordinate, max);

    if (result.status === 'outOfDomain') {
      const expectedLimit = `Dose hors domaine publié ${result.domainGPerHL.min}–${result.domainGPerHL.max} g/hL : aucune extrapolation ou saturation appliquée.`;
      if (comparisonToMin >= 0 && comparisonToMax <= 0 || result.valueBU !== null || result.contrastToControlBU !== null
        || result.nodesUsed.length !== 0 || !same(result.limitations, [...calibration.limitations, expectedLimit])) {
        return 'Résultat hors domaine incohérent ou extrapolé.';
      }
    } else if (result.status === 'publishedObservation' || result.status === 'interpolation') {
      if (comparisonToMin < 0 || comparisonToMax > 0 || !isFiniteNumber(result.valueBU) || result.valueBU < 0
        || !isFiniteNumber(result.contrastToControlBU) || !same(result.limitations, calibration.limitations)) {
        return 'Résultat numérique hors domaine ou non fini.';
      }
      const contrastFromDisplayedValue = coldDecimalToNumber(subtractColdDecimals(coldDecimal(result.valueBU), coldDecimal(result.controlBU)));
      if (!withinOneUlp(result.contrastToControlBU, contrastFromDisplayedValue)) return 'Contraste au témoin incohérent avec la valeur BU.';

      if (result.status === 'publishedObservation') {
        const pointIndex = points.findIndex((point) => compareColdDecimals(coldDecimal(point.doseGPerHL), coordinate) === 0);
        if (pointIndex < 0 || result.nodesUsed.length !== 1 || !same(result.nodesUsed[0], points[pointIndex])
          || result.valueBU !== points[pointIndex].valueBU) return 'Observation publiée sans nœud exact correspondant.';
      } else {
        if (points.some((point) => compareColdDecimals(coldDecimal(point.doseGPerHL), coordinate) === 0)
          || result.nodesUsed.length !== 2) return 'Interpolation froide sans deux nœuds intérieurs.';
        const leftIndex = points.findIndex((point) => same(point, result.nodesUsed[0]));
        const rightIndex = points.findIndex((point) => same(point, result.nodesUsed[1]));
        if (leftIndex < 0 || rightIndex !== leftIndex + 1
          || compareColdDecimals(coldDecimal(result.nodesUsed[0].doseGPerHL), coordinate) >= 0
          || compareColdDecimals(coordinate, coldDecimal(result.nodesUsed[1].doseGPerHL)) >= 0) {
          return 'Nœuds d’interpolation non adjacents ou ne cadrant pas la dose.';
        }
      }
    } else {
      return 'Statut de résultat froid inconnu.';
    }
  }

  try {
    if (coldHopBuReferenceResultReference(result) !== result.reference) return 'Empreinte du résultat froid invalide.';
  } catch {
    return 'Empreinte du résultat froid invalide.';
  }
  return result;
}

function numberFr(value: number): string {
  return String(value).replace('.', ',');
}

function hasRoundedDoseDisplay(result: ColdHopBuReferenceResult): boolean {
  if (result.doseExactGPerHL === null || result.doseInput.value === null || result.doseEffectiveGPerHL === null) return false;
  const exact = exactDoseCoordinate(result.doseExactGPerHL);
  if (!exact) return false;
  try {
    const inputCoordinate = result.doseInput.unit === 'g/L'
      ? divideColdDecimals(exact, coldDecimal(100)) : exact;
    return compareColdDecimals(exact, coldDecimal(result.doseEffectiveGPerHL)) !== 0
      || compareColdDecimals(inputCoordinate, coldDecimal(result.doseInput.value)) !== 0;
  } catch {
    return true;
  }
}

function httpUrl(reference: string): string | undefined {
  if (!/^https?:\/\//i.test(reference)) return undefined;
  try {
    const parsed = new URL(reference);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname ? reference : undefined;
  } catch {
    return undefined;
  }
}

function factsFor(result: ColdHopBuReferenceResult): { facts: string[]; limits: string[]; sources: Array<{ title: string; url: string }> } {
  const { calibrationSnapshot: calibration } = result;
  const { hop, beer, contact } = calibration.conditions;
  const facts: string[] = [];
  if (result.doseInput.value === null) {
    facts.push('Dose du contact inconnue : aucune valeur BU n’est attribuée.');
  } else {
    facts.push(`Dose fournie : ${numberFr(result.doseInput.value)} ${result.doseInput.unit}; dose effective ${numberFr(result.doseEffectiveGPerHL!)} g/hL.`);
  }
  facts.push(`Domaine de cette courbe : ${numberFr(result.domainGPerHL.min)}–${numberFr(result.domainGPerHL.max)} g/hL.`);
  facts.push(`Témoin publié à 0 g/hL : ${numberFr(result.controlBU)} ${result.calibrationSnapshot.output.unit}; la base préparée décrite dans l’étude est ${beer.preparedBaseBU === null ? 'non renseignée' : `${numberFr(beer.preparedBaseBU)} BU`}. Ces deux références restent distinctes.`);
  if (result.status === 'publishedObservation') {
    facts.push(`Observation publiée : ${numberFr(result.valueBU!)} ${result.calibrationSnapshot.output.unit} spectrophotométriques.`);
  } else if (result.status === 'interpolation') {
    facts.push(`Interpolation linéaire de référence : ${numberFr(result.valueBU!)} ${result.calibrationSnapshot.output.unit} spectrophotométriques.`);
  } else {
    facts.push('Aucun résultat BU disponible pour cette dose.');
  }
  facts.push(result.contrastToControlBU === null
    ? 'Aucun contraste au témoin n’est calculé.'
    : `Contraste au témoin : ${result.contrastToControlBU > 0 ? '+' : ''}${numberFr(result.contrastToControlBU)} BU.`);
  if (hasRoundedDoseDisplay(result)) {
    facts.push('La coordonnée exacte conservée dans la preuve gouverne le domaine; la dose affichée est arrondie.');
  }
  facts.push(`Calibration observée : ${hop.variety}, ${hop.lotDescription}, ${hop.form}; ${hop.preparation}`);
  const yeastStatus = beer.yeastStatus === 'removedBeforeContact' ? 'retirée avant le contact'
    : beer.yeastStatus === 'present' ? 'présente' : 'inconnu';
  facts.push(`Bière de l’étude : ${beer.description} ABV ${numberFr(beer.abvPct)} %; levure ${yeastStatus}; volume traité ${numberFr(beer.treatmentVolumeL)} L.`);
  facts.push(`Contact : ${contact.mode}, ${numberFr(contact.durationHours)} h; plage des moyennes observées ${numberFr(contact.meanObservedTemperatureC.min)}–${numberFr(contact.meanObservedTemperatureC.max)} °C (résumé, pas une loi de réponse à la température).`);
  const sourceLocation = result.source.locator ?? result.source.title;
  facts.push(`Mesure : BU spectrophotométriques, ${result.method}; source ${result.source.author} (${result.source.year ?? 's. d.'}), ${sourceLocation}${/[.!?]$/.test(sourceLocation) ? '' : '.'}`);
  const sourceUrl = httpUrl(result.source.reference);
  if (!sourceUrl) facts.push(`Référence de source : ${result.source.reference}.`);

  const limits = [
    ...result.limitations,
    'Cette référence BU décrit le protocole publié; elle ne prédit pas l’IBU de la bière cible.',
    'Le contraste au témoin ne s’ajoute pas automatiquement aux IBU calculés par Tinseth.',
  ];
  const sources = sourceUrl ? [{ title: result.source.title, url: sourceUrl }] : [];
  return { facts, limits, sources };
}

/**
 * Re-read one tool record without recalculating cold-contact BU. The result
 * reference binds the exact snapshot; all displayed facts come from that
 * snapshot, never from model prose.
 */
export function readAssistedColdContactEvidence(input: unknown): AssistedColdContactEvidence {
  if (!isRecord(input)) return { status: 'invalid', reason: 'Preuve de tour mal formée.' };
  const evidenceId = isNonemptyString(input.id) ? input.id : undefined;
  if (input.name !== COLD_CONTACT_TOOL) {
    return { status: 'unsupportedTool', ...(evidenceId ? { evidenceId } : {}), ...(typeof input.name === 'string' ? { toolName: input.name } : {}) };
  }
  if (!evidenceId) return { status: 'invalid', reason: 'Identifiant de preuve manquant.' };
  if (!isRecord(input.data)) return { status: 'invalid', evidenceId, reason: 'Payload froid absent ou non structuré.' };

  const raw = input.data;
  const recognizedFormatPrefix = typeof raw.format === 'string' && raw.format.startsWith('cold-hop-bu-reference-result-');
  if (recognizedFormatPrefix && raw.format !== HOP_COLD_BU_REFERENCE_FORMAT) {
    try {
      return { status: 'unsupportedFormat', evidenceId, format: raw.format, version: raw.version, raw: structuredClone(raw) };
    } catch {
      return { status: 'invalid', evidenceId, reason: 'Payload futur impossible à préserver comme snapshot.' };
    }
  }
  if (raw.format !== HOP_COLD_BU_REFERENCE_FORMAT) return { status: 'invalid', evidenceId, reason: 'Format de payload inattendu pour l’outil froid.' };
  if (raw.version !== HOP_COLD_BU_REFERENCE_VERSION) {
    if (!isNonemptyString(raw.version)) return { status: 'invalid', evidenceId, reason: 'Version du résultat froid absente.' };
    try {
      return { status: 'unsupportedFormat', evidenceId, format: raw.format, version: raw.version, raw: structuredClone(raw) };
    } catch {
      return { status: 'invalid', evidenceId, reason: 'Version froide non prise en charge et payload impossible à préserver.' };
    }
  }

  const validated = validateKnownResult(raw);
  if (typeof validated === 'string') return { status: 'invalid', evidenceId, reason: validated };
  let snapshot: ColdHopBuReferenceResult;
  try {
    snapshot = structuredClone(validated);
  } catch {
    return { status: 'invalid', evidenceId, reason: 'Snapshot froid impossible à cloner.' };
  }
  const display = factsFor(snapshot);
  if (snapshot.status === 'doseUnknown' || snapshot.status === 'outOfDomain') {
    return {
      status: 'missing', evidenceId, resultReference: snapshot.reference,
      reason: snapshot.status, snapshot, ...display,
    };
  }
  return { status: 'ready', evidenceId, resultReference: snapshot.reference, snapshot, ...display };
}
