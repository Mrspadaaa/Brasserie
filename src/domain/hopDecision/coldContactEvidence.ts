import { hopSourceError, type HopSource } from '../../../functions/src/hopIndexSchema';
import {
  HOP_COLD_BU_REFERENCE_FORMAT,
  HOP_COLD_BU_REFERENCE_VERSION,
  coldHopBuCalibrationReference,
  coldHopBuReferenceResultReference,
  getColdHopBuCalibration,
  type ColdHopBuReferenceResult,
} from './coldIbuReference';
import {
  addColdDecimals,
  coldDecimal,
  coldDecimalToNumber,
  compareColdDecimals,
  divideColdDecimals,
  multiplyColdDecimals,
  subtractColdDecimals,
  type ColdDecimalFraction,
} from './coldIbuDecimal';
import {
  HOP_COLD_CONTACT_ASSESSMENT_FORMAT,
  HOP_COLD_CONTACT_BINDING_FORMAT,
  coldHopContactBindingReference,
  type HopColdContactAssessment,
} from './coldIbuContact';
import { hopAdviceContentReference } from './adviceContentReference';
import { programFingerprint } from './programs';
import type { HopDecisionProgram } from './types';
import type { HopQualifiedAssemblyInput } from './qualifiedDecision';
import type { HopColdBeerContext } from './coldIbuContact';

export const COLD_BU_PROTOCOL_SUPPLEMENT_FORMAT = 'cold-bu-protocol-supplement-v1' as const;
export const HOP_COLD_CONTACT_EVIDENCE_FORMAT = 'hop-cold-contact-evidence-v1' as const;
const HOP_COLD_CONTACT_EVIDENCE_PREFIX = 'hop-cold-contact-evidence-';
const COLD_BU_PROTOCOL_SUPPLEMENT_PREFIX = 'cold-bu-protocol-supplement-';
const PROTOCOL_SUPPLEMENT_LIMITATIONS = [
  'Le stockage sous azote à −20 °C concerne le houblon ; la durée de stockage n’est pas rapportée ici.',
  'Le seuil d’oxygène dissous concerne la bière filtrée avant prélèvement ; ce n’est pas une mesure de la bière cible ni une garantie sur toute la durée du contact.',
  'Ces conditions complètent la référence publiée sans modifier ni la calibration BU historique ni son empreinte.',
];

type Row = Record<string, unknown>;
const isRecord = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const exactKeys = (value: Row, keys: readonly string[]) => Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const same = (left: unknown, right: unknown): boolean => hopAdviceContentReference('cold-contact-evidence-equality-v1', left)
  === hopAdviceContentReference('cold-contact-evidence-equality-v1', right);

export type ColdHopBuReferenceResultV2Read =
  | { status: 'recognized'; result: ColdHopBuReferenceResult }
  | { status: 'unsupportedFormat'; format: unknown; version: unknown; raw: unknown }
  | { status: 'invalid'; reason: string; raw: unknown };

const COLD_BU_RESULT_KEYS = [
  'format', 'version', 'reference', 'calibrationSnapshot', 'calibrationReference', 'doseInput',
  'doseEffectiveGPerHL', 'doseExactGPerHL', 'arithmetic', 'domainGPerHL', 'status', 'valueBU',
  'controlBU', 'contrastToControlBU', 'nodesUsed', 'source', 'method', 'algorithm', 'uncertainty', 'limitations',
].sort();

function validColdNode(value: unknown): value is { doseGPerHL: number; valueBU: number } {
  return isRecord(value) && exactKeys(value, ['doseGPerHL', 'valueBU'])
    && isFiniteNumber(value.doseGPerHL) && value.doseGPerHL >= 0
    && isFiniteNumber(value.valueBU) && value.valueBU >= 0;
}

function exactReferenceNumberMismatch(result: ColdHopBuReferenceResult, exactValueBU: ColdDecimalFraction): string | undefined {
  if (result.valueBU !== coldDecimalToNumber(exactValueBU)) {
    return 'Valeur BU incohérente avec la dose exacte et les nœuds archivés.';
  }
  const exactContrast = subtractColdDecimals(exactValueBU, coldDecimal(result.controlBU));
  if (result.contrastToControlBU !== coldDecimalToNumber(exactContrast)) {
    return 'Contraste au témoin incohérent avec la valeur BU exacte.';
  }
  return undefined;
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

function validateKnownColdHopBuReferenceV2(value: unknown): ColdHopBuReferenceResult | string {
  if (!isRecord(value) || !exactKeys(value, COLD_BU_RESULT_KEYS)) return 'Structure du résultat froid incomplète ou étendue.';
  if (value.format !== HOP_COLD_BU_REFERENCE_FORMAT || value.version !== HOP_COLD_BU_REFERENCE_VERSION) {
    return 'Format froid non pris en charge.';
  }

  const result = value as unknown as ColdHopBuReferenceResult;
  if (!isRecord(result.doseInput) || !exactKeys(result.doseInput as unknown as Row, ['value', 'unit'])
    || !['g/L', 'g/hL'].includes(result.doseInput.unit)
    || result.doseInput.value !== null && (!isFiniteNumber(result.doseInput.value) || result.doseInput.value < 0)) {
    return 'Dose d’entrée froide invalide.';
  }
  if (!isRecord(result.domainGPerHL) || !exactKeys(result.domainGPerHL as unknown as Row, ['min', 'max'])
    || !isFiniteNumber(result.domainGPerHL.min) || !isFiniteNumber(result.domainGPerHL.max)
    || result.domainGPerHL.min < 0 || result.domainGPerHL.min > result.domainGPerHL.max) {
    return 'Domaine froid invalide.';
  }
  if (result.arithmetic !== 'exactDecimal-v1' || result.algorithm !== 'piecewiseLinearInterpolation'
    || result.uncertainty !== 'notReported' || typeof result.method !== 'string' || !result.method.trim()
    || typeof result.reference !== 'string' || !result.reference.trim()
    || typeof result.calibrationReference !== 'string' || !result.calibrationReference.trim()
    || !isFiniteNumber(result.controlBU) || result.controlBU < 0
    || !Array.isArray(result.nodesUsed) || !result.nodesUsed.every(validColdNode)
    || !Array.isArray(result.limitations) || result.limitations.some(entry => typeof entry !== 'string' || !entry.trim())) {
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
    if (!exactCoordinate || !isFiniteNumber(result.doseEffectiveGPerHL) || result.doseEffectiveGPerHL < 0) {
      return 'Coordonnée exacte ou dose effective invalide.';
    }
    try {
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
      if (result.status === 'publishedObservation') {
        const pointIndex = points.findIndex(point => compareColdDecimals(coldDecimal(point.doseGPerHL), coordinate) === 0);
        if (pointIndex < 0 || result.nodesUsed.length !== 1 || !same(result.nodesUsed[0], points[pointIndex])
          || result.valueBU !== points[pointIndex].valueBU) return 'Observation publiée sans nœud exact correspondant.';
        const mismatch = exactReferenceNumberMismatch(result, coldDecimal(points[pointIndex].valueBU));
        if (mismatch) return mismatch;
      } else {
        if (points.some(point => compareColdDecimals(coldDecimal(point.doseGPerHL), coordinate) === 0) || result.nodesUsed.length !== 2) {
          return 'Interpolation froide sans deux nœuds intérieurs.';
        }
        const leftIndex = points.findIndex(point => same(point, result.nodesUsed[0]));
        const rightIndex = points.findIndex(point => same(point, result.nodesUsed[1]));
        if (leftIndex < 0 || rightIndex !== leftIndex + 1
          || compareColdDecimals(coldDecimal(result.nodesUsed[0].doseGPerHL), coordinate) >= 0
          || compareColdDecimals(coordinate, coldDecimal(result.nodesUsed[1].doseGPerHL)) >= 0) {
          return 'Nœuds d’interpolation non adjacents ou ne cadrant pas la dose.';
        }
        const left = result.nodesUsed[0], right = result.nodesUsed[1];
        const ratio = divideColdDecimals(subtractColdDecimals(coordinate, coldDecimal(left.doseGPerHL)),
          subtractColdDecimals(coldDecimal(right.doseGPerHL), coldDecimal(left.doseGPerHL)));
        const exactValueBU = addColdDecimals(coldDecimal(left.valueBU), multiplyColdDecimals(ratio,
          subtractColdDecimals(coldDecimal(right.valueBU), coldDecimal(left.valueBU))));
        const mismatch = exactReferenceNumberMismatch(result, exactValueBU);
        if (mismatch) return mismatch;
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

/** Re-reads the v2 result without re-running the interpolator or consulting current catalogue state. */
export function readColdHopBuReferenceResultV2(value: unknown): ColdHopBuReferenceResultV2Read {
  if (!isRecord(value)) return { status: 'invalid', reason: 'Payload froid absent ou non structuré.', raw: value };
  const recognizedFormatPrefix = typeof value.format === 'string' && value.format.startsWith('cold-hop-bu-reference-result-');
  if (recognizedFormatPrefix && value.format !== HOP_COLD_BU_REFERENCE_FORMAT) {
    try {
      return { status: 'unsupportedFormat', format: value.format, version: value.version, raw: structuredClone(value) };
    } catch {
      return { status: 'invalid', reason: 'Payload futur impossible à préserver comme snapshot.', raw: value };
    }
  }
  if (value.format !== HOP_COLD_BU_REFERENCE_FORMAT) {
    return { status: 'invalid', reason: 'Format de payload inattendu pour l’outil froid.', raw: value };
  }
  if (value.version !== HOP_COLD_BU_REFERENCE_VERSION) {
    if (typeof value.version !== 'string' || !value.version.trim()) {
      return { status: 'invalid', reason: 'Version du résultat froid absente.', raw: value };
    }
    try {
      return { status: 'unsupportedFormat', format: value.format, version: value.version, raw: structuredClone(value) };
    } catch {
      return { status: 'invalid', reason: 'Version froide non prise en charge et payload impossible à préserver.', raw: value };
    }
  }

  const validated = validateKnownColdHopBuReferenceV2(value);
  if (typeof validated === 'string') return { status: 'invalid', reason: validated, raw: value };
  try {
    return { status: 'recognized', result: structuredClone(validated) };
  } catch {
    return { status: 'invalid', reason: 'Snapshot froid impossible à cloner.', raw: value };
  }
}

export interface ColdBuProtocolSupplementV1 {
  format: typeof COLD_BU_PROTOCOL_SUPPLEMENT_FORMAT;
  reference: string;
  calibrationReference: string;
  source: HopSource;
  sourceReadingLevel: 'primaryFullText';
  hopStorage: {
    subject: 'hops';
    atmosphere: 'nitrogen';
    temperatureC: -20;
    durationHours: null;
  };
  beerSampling: {
    subject: 'filteredBeer';
    stage: 'beforeSampling';
    dissolvedOxygen: { relation: 'lessThan'; value: 110; unit: 'µg/L' };
  };
  limitations: string[];
}

export interface HopColdContactEvidenceSourceBindingV1 {
  ownerKey: string;
  scopeReference: string;
  programReference: string;
  qualificationReference: string;
  contextReference: string;
  contactReference: string;
}

export interface HopColdContactEvidenceV1 {
  format: typeof HOP_COLD_CONTACT_EVIDENCE_FORMAT;
  sourceBinding: HopColdContactEvidenceSourceBindingV1;
  assessment: HopColdContactAssessment;
  /** Conditions published with the Lafontaine 2018 calibration only; null for any other calibration. */
  protocolSupplement: ColdBuProtocolSupplementV1 | null;
  reference: string;
}

export type HopColdContactEvidenceReadV1 =
  | { status: 'valid'; evidence: HopColdContactEvidenceV1 }
  | { status: 'unsupportedFormat'; format?: unknown; raw: unknown; reason: string }
  | { status: 'invalid'; reason: string; raw: unknown };

export interface HopColdContactEvidenceExpectedSourceV1 {
  ownerKey: string;
  scopeReference: string;
  programReference: string;
  qualificationReference: string;
  contextReference: string;
  contactReference: string;
}

export type HopColdContactEvidenceSourceMatchV1 = { status: 'matched' } | { status: 'stale'; mismatches: Array<keyof HopColdContactEvidenceExpectedSourceV1> };

type ColdBuProtocolSupplementReadV1 =
  | { status: 'valid'; supplement: ColdBuProtocolSupplementV1 }
  | { status: 'unsupportedFormat'; format?: unknown; raw: unknown; reason: string }
  | { status: 'invalid'; reason: string; raw: unknown };

export function coldContactQualificationReference(input: HopQualifiedAssemblyInput): string {
  return hopAdviceContentReference('hop-cold-contact-qualification-input-v1', input);
}

export function coldContactBeerContextReference(context: HopColdBeerContext | null | undefined): string {
  return hopAdviceContentReference('hop-cold-contact-beer-context-v1', context ?? null);
}

let supplementedCalibrationReference: string | undefined;
/**
 * The hop storage and dissolved-oxygen conditions come from the Lafontaine and Shellhammer (2018) protocol: they
 * describe that exact calibration and are never attached to another one.
 */
function calibrationCarriesProtocolSupplement(result: ColdHopBuReferenceResult): boolean {
  supplementedCalibrationReference ??= coldHopBuCalibrationReference(getColdHopBuCalibration());
  return result.calibrationReference === supplementedCalibrationReference;
}

function protocolSupplementBody(result: ColdHopBuReferenceResult): Omit<ColdBuProtocolSupplementV1, 'reference'> {
  if (!calibrationCarriesProtocolSupplement(result)) {
    throw new Error('Le supplément de protocole publié ne concerne que la calibration Lafontaine 2018.');
  }
  return {
    format: COLD_BU_PROTOCOL_SUPPLEMENT_FORMAT,
    calibrationReference: result.calibrationReference,
    source: structuredClone(result.source),
    sourceReadingLevel: result.calibrationSnapshot.sourceReadingLevel,
    hopStorage: { subject: 'hops', atmosphere: 'nitrogen', temperatureC: -20, durationHours: null },
    beerSampling: { subject: 'filteredBeer', stage: 'beforeSampling', dissolvedOxygen: { relation: 'lessThan', value: 110, unit: 'µg/L' } },
    limitations: [...PROTOCOL_SUPPLEMENT_LIMITATIONS],
  };
}

export function createColdBuProtocolSupplementV1(result: ColdHopBuReferenceResult): ColdBuProtocolSupplementV1 {
  const body = protocolSupplementBody(result);
  return { ...body, reference: hopAdviceContentReference(COLD_BU_PROTOCOL_SUPPLEMENT_FORMAT, body) };
}

export function hopColdContactEvidenceSourceBindingV1(input: {
  ownerKey: string;
  scopeReference: string;
  assessment: HopColdContactAssessment;
}): HopColdContactEvidenceSourceBindingV1 {
  return {
    ownerKey: input.ownerKey,
    scopeReference: input.scopeReference,
    programReference: programFingerprint(input.assessment.inputSnapshot.program),
    qualificationReference: coldContactQualificationReference(input.assessment.inputSnapshot.qualificationInput),
    contextReference: coldContactBeerContextReference(input.assessment.inputSnapshot.context),
    contactReference: input.assessment.inputSnapshot.contact.reference,
  };
}

function assessmentError(value: unknown): string | undefined {
  if (!isRecord(value) || !exactKeys(value, ['format', 'reference', 'inputSnapshot', 'qualificationSnapshot', 'referenceResult',
    'programBinding', 'domainComparisons', 'targetAssessment', 'limitations'])) return 'L’évaluation froide connue est incomplète ou étendue.';
  if (value.format !== HOP_COLD_CONTACT_ASSESSMENT_FORMAT || !isText(value.reference)) return 'Format ou référence de l’évaluation froide invalide.';
  const { reference: _reference, ...body } = value;
  try {
    if (hopAdviceContentReference(HOP_COLD_CONTACT_ASSESSMENT_FORMAT, body) !== value.reference) return 'Empreinte de l’évaluation froide invalide.';
  } catch {
    return 'Évaluation froide non sérialisable.';
  }
  if (!isRecord(value.inputSnapshot) || !exactKeys(value.inputSnapshot, ['program', 'contact', 'qualificationInput', 'context'])
    || !isRecord(value.programBinding) || !Array.isArray(value.domainComparisons) || !Array.isArray(value.limitations)
    || value.limitations.some(entry => !isText(entry)) || !isRecord(value.qualificationSnapshot)
    || !isRecord(value.referenceResult) || !isText(value.referenceResult.format)
    || !isRecord(value.targetAssessment) || value.targetAssessment.quantity !== 'spectrophotometricBU'
    || value.targetAssessment.unit !== 'BU' || value.targetAssessment.valueBU !== null) {
    return 'Snapshots, transferts ou limites de l’évaluation froide sont invalides.';
  }
  const program = value.inputSnapshot.program as unknown as HopDecisionProgram;
  const contact = value.inputSnapshot.contact as unknown as HopColdContactAssessment['inputSnapshot']['contact'];
  const qualificationInput = value.inputSnapshot.qualificationInput as unknown as HopQualifiedAssemblyInput;
  if (!isRecord(program) || !Array.isArray((program as HopDecisionProgram).additions)
    || !isRecord(contact) || contact.format !== HOP_COLD_CONTACT_BINDING_FORMAT || !isText(contact.reference)
    || !isRecord(qualificationInput) || !Array.isArray(qualificationInput.variants)
    || value.inputSnapshot.context !== null && !isRecord(value.inputSnapshot.context)) {
    return 'Source canonique ou liaison du contact froid invalide.';
  }
  let programReference: string;
  let contactReference: string;
  try {
    programReference = programFingerprint(program);
    contactReference = coldHopContactBindingReference(contact);
  } catch {
    return 'Programme ou liaison du contact froid illisible.';
  }
  if (contactReference !== contact.reference || contact.programReference !== programReference
    || contact.programId !== program.id || contact.programRevision !== program.revision) {
    return 'La liaison du contact ne correspond pas au programme figé.';
  }
  if (!same(value.programBinding.contact, contact)) return 'Le binding de programme diffère de la liaison du snapshot.';
  if (!Array.isArray(contact.additionIds) || contact.additionIds.length === 0) return 'Sélection du contact vide ou invalide.';
  const selected = contact.additionIds.map(id => program.additions.find(addition => addition.id === id));
  if (selected.some(addition => !addition)
    || !same(value.programBinding.selectedAdditions, selected)) return 'Les ajouts sélectionnés ne correspondent pas au contact lié.';

  if (value.targetAssessment.valueBU !== null) return 'L’évaluation froide ne peut fournir une BU cible.';
  return undefined;
}

function readSupplement(value: unknown, expectedResult?: ColdHopBuReferenceResult): ColdBuProtocolSupplementReadV1 {
  if (!isRecord(value)) return { status: 'invalid', reason: 'Supplément de protocole absent ou illisible.', raw: value };
  const futureFormat = typeof value.format === 'string' && value.format.startsWith(COLD_BU_PROTOCOL_SUPPLEMENT_PREFIX)
    && value.format !== COLD_BU_PROTOCOL_SUPPLEMENT_FORMAT;
  if (futureFormat) return { status: 'unsupportedFormat', format: value.format, raw: value, reason: 'Format de supplément de protocole futur conservé sans interprétation.' };
  if (value.format !== COLD_BU_PROTOCOL_SUPPLEMENT_FORMAT) return { status: 'invalid', reason: 'Format de supplément de protocole inconnu.', raw: value };
  if (!exactKeys(value, ['format', 'reference', 'calibrationReference', 'source', 'sourceReadingLevel', 'hopStorage', 'beerSampling', 'limitations'])
    || !isText(value.reference) || !isText(value.calibrationReference) || !isRecord(value.source) || hopSourceError(value.source as unknown as HopSource)
    || value.sourceReadingLevel !== 'primaryFullText'
    || !same(value.hopStorage, { subject: 'hops', atmosphere: 'nitrogen', temperatureC: -20, durationHours: null })
    || !same(value.beerSampling, { subject: 'filteredBeer', stage: 'beforeSampling', dissolvedOxygen: { relation: 'lessThan', value: 110, unit: 'µg/L' } })
    || !same(value.limitations, PROTOCOL_SUPPLEMENT_LIMITATIONS)) {
    return { status: 'invalid', reason: 'Structure ou métadonnées connues du supplément de protocole invalides.', raw: value };
  }
  const { reference: _reference, ...body } = value;
  try {
    if (hopAdviceContentReference(COLD_BU_PROTOCOL_SUPPLEMENT_FORMAT, body) !== value.reference) {
      return { status: 'invalid', reason: 'Empreinte du supplément de protocole invalide.', raw: value };
    }
  } catch {
    return { status: 'invalid', reason: 'Supplément de protocole non sérialisable.', raw: value };
  }
  if (expectedResult && (value.calibrationReference !== expectedResult.calibrationReference || !same(value.source, expectedResult.source))) {
    return { status: 'invalid', reason: 'Supplément et résultat BU ne partagent pas la même calibration/source.', raw: value };
  }
  if (expectedResult && !calibrationCarriesProtocolSupplement(expectedResult)) {
    return { status: 'invalid', reason: 'Ce supplément de protocole Lafontaine est rattaché à une autre calibration.', raw: value };
  }
  return { status: 'valid', supplement: structuredClone(value as unknown as ColdBuProtocolSupplementV1) };
}

function exactSourceBinding(value: unknown): value is HopColdContactEvidenceSourceBindingV1 {
  return isRecord(value) && exactKeys(value, ['ownerKey', 'scopeReference', 'programReference', 'qualificationReference', 'contextReference', 'contactReference'])
    && Object.values(value).every(isText);
}

function evidenceBody(evidence: Omit<HopColdContactEvidenceV1, 'reference'> | HopColdContactEvidenceV1) {
  const { reference: _reference, ...body } = evidence as HopColdContactEvidenceV1;
  return body;
}

export function createHopColdContactEvidenceV1(input: {
  assessment: HopColdContactAssessment;
  ownerKey: string;
  scopeReference: string;
}): HopColdContactEvidenceV1 {
  if (!isText(input.ownerKey) || !isText(input.scopeReference)) throw new Error('Profil et référence de portée requis pour sceller la preuve froide.');
  const sourceBinding = hopColdContactEvidenceSourceBindingV1(input);
  const protocolSupplement = calibrationCarriesProtocolSupplement(input.assessment.referenceResult)
    ? createColdBuProtocolSupplementV1(input.assessment.referenceResult) : null;
  const body: Omit<HopColdContactEvidenceV1, 'reference'> = {
    format: HOP_COLD_CONTACT_EVIDENCE_FORMAT,
    sourceBinding,
    assessment: structuredClone(input.assessment),
    protocolSupplement,
  };
  const evidence = { ...body, reference: hopAdviceContentReference(HOP_COLD_CONTACT_EVIDENCE_FORMAT, body) };
  const read = readHopColdContactEvidenceV1(evidence);
  if (read.status !== 'valid') throw new Error(read.status === 'invalid' ? read.reason : 'La preuve froide a produit un format futur inattendu.');
  return read.evidence;
}

/** Integrity reader only: it never recalculates the assessment or declares its source current. */
export function readHopColdContactEvidenceV1(value: unknown): HopColdContactEvidenceReadV1 {
  if (!isRecord(value)) return { status: 'invalid', reason: 'Preuve froide illisible.', raw: value };
  if (typeof value.format === 'string' && value.format.startsWith(HOP_COLD_CONTACT_EVIDENCE_PREFIX)
    && value.format !== HOP_COLD_CONTACT_EVIDENCE_FORMAT) {
    try { return { status: 'unsupportedFormat', format: value.format, raw: structuredClone(value), reason: 'Format de preuve froide futur conservé en lecture seule.' }; }
    catch { return { status: 'invalid', reason: 'Preuve froide future impossible à conserver.', raw: value }; }
  }
  if (value.format !== HOP_COLD_CONTACT_EVIDENCE_FORMAT) return { status: 'invalid', reason: 'Format de preuve froide inconnu.', raw: value };
  if (!exactKeys(value, ['format', 'sourceBinding', 'assessment', 'protocolSupplement', 'reference']) || !isText(value.reference)
    || !exactSourceBinding(value.sourceBinding)) return { status: 'invalid', reason: 'Enveloppe froide connue incomplète ou étendue.', raw: value };

  try {
    const nestedAssessmentError = assessmentError(value.assessment);
    if (nestedAssessmentError) return { status: 'invalid', reason: nestedAssessmentError, raw: value };
    const assessment = value.assessment as unknown as HopColdContactAssessment;
    const expectedSourceBinding = hopColdContactEvidenceSourceBindingV1({
      ownerKey: value.sourceBinding.ownerKey,
      scopeReference: value.sourceBinding.scopeReference,
      assessment,
    });
    if (!same(value.sourceBinding, expectedSourceBinding)) return { status: 'invalid', reason: 'Références de source détachées des snapshots froids.', raw: value };

    // A known V1 envelope must prove its own sealed content before any child is treated as opaque future data.
    const { reference: _reference, ...body } = value as unknown as HopColdContactEvidenceV1;
    if (hopAdviceContentReference(HOP_COLD_CONTACT_EVIDENCE_FORMAT, body) !== value.reference) {
      return { status: 'invalid', reason: 'Empreinte de la preuve froide invalide.', raw: value };
    }

    const v2Result = readColdHopBuReferenceResultV2(assessment.referenceResult);
    if (v2Result.status === 'invalid') return { status: 'invalid', reason: `Résultat BU imbriqué invalide : ${v2Result.reason}`, raw: value };
    const knownResult = v2Result.status === 'recognized' ? v2Result.result : undefined;
    // A known calibration decides whether the envelope carries its published protocol; a future result keeps either form opaque.
    const supplementRead: ColdBuProtocolSupplementReadV1 | { status: 'absent' } = value.protocolSupplement === null
      ? knownResult && calibrationCarriesProtocolSupplement(knownResult)
        ? { status: 'invalid', reason: 'Supplément de protocole absent pour la calibration qui le publie.', raw: value }
        : { status: 'absent' }
      : readSupplement(value.protocolSupplement, knownResult);
    if (supplementRead.status === 'invalid') return { status: 'invalid', reason: supplementRead.reason, raw: value };
    if (v2Result.status === 'unsupportedFormat') {
      try {
        return { status: 'unsupportedFormat', format: v2Result.format, raw: structuredClone(value),
          reason: 'Résultat BU imbriqué futur conservé sans interprétation.' };
      } catch {
        return { status: 'invalid', reason: 'Enveloppe contenant un enfant futur impossible à préserver.', raw: value };
      }
    }
    if (supplementRead.status === 'unsupportedFormat') {
      try { return { ...supplementRead, raw: structuredClone(value) }; }
      catch { return { status: 'invalid', reason: 'Enveloppe contenant un enfant futur impossible à préserver.', raw: value }; }
    }
    return { status: 'valid', evidence: structuredClone(value as unknown as HopColdContactEvidenceV1) };
  } catch {
    return { status: 'invalid', reason: 'Preuve froide non sérialisable ou impossible à cloner.', raw: value };
  }
}

/** Compares a historically read source binding to a fresh host binding without re-running the cold model. */
export function compareHopColdContactEvidenceSourceV1(evidence: HopColdContactEvidenceV1,
  current: HopColdContactEvidenceExpectedSourceV1): HopColdContactEvidenceSourceMatchV1 {
  const keys: Array<keyof HopColdContactEvidenceExpectedSourceV1> = [
    'ownerKey', 'scopeReference', 'programReference', 'qualificationReference', 'contextReference', 'contactReference',
  ];
  const mismatches = keys.filter(key => evidence.sourceBinding[key] !== current[key]);
  return mismatches.length ? { status: 'stale', mismatches } : { status: 'matched' };
}
