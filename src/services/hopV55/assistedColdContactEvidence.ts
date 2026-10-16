import type { ColdHopBuReferenceResult } from '../../domain/hopDecision/coldIbuReference';
import {
  coldDecimal,
  coldDecimalToNumber,
  compareColdDecimals,
  divideColdDecimals,
  type ColdDecimalFraction,
} from '../../domain/hopDecision/coldIbuDecimal';
import { readColdHopBuReferenceResultV2 } from '../../domain/hopDecision/coldContactEvidence';

const COLD_CONTACT_TOOL = 'cold_contact_bitterness_reference';
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

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const isNonemptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const exactKeys = (value: RecordValue, keys: readonly string[]) => Object.keys(value).sort().join('|') === [...keys].sort().join('|');

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

  const read = readColdHopBuReferenceResultV2(input.data);
  if (read.status === 'unsupportedFormat') return { status: 'unsupportedFormat', evidenceId, format: read.format, version: read.version, raw: read.raw };
  if (read.status === 'invalid') return { status: 'invalid', evidenceId, reason: read.reason };
  const snapshot = read.result;
  const display = factsFor(snapshot);
  if (snapshot.status === 'doseUnknown' || snapshot.status === 'outOfDomain') {
    return {
      status: 'missing', evidenceId, resultReference: snapshot.reference,
      reason: snapshot.status, snapshot, ...display,
    };
  }
  return { status: 'ready', evidenceId, resultReference: snapshot.reference, snapshot, ...display };
}
