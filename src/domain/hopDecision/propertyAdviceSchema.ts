import { hopSourceError, type HopDescription, type HopSource } from '../../../functions/src/hopIndexSchema';
import { hopAdviceContentReference } from './adviceContentReference';
import type {
  HopDocumentaryCorpus,
  HopDocumentaryIntervention,
  HopDocumentaryPreparation,
  HopDocumentaryRequest,
  HopDocumentaryScope,
  HopDocumentaryAnswer,
  HopDocumentaryDossier,
} from './documentaryAnswerSchema';
import {
  HOP_DOCUMENTARY_ANSWER_VERSION,
  HOP_DOCUMENTARY_REQUEST_VERSION,
  assertHopDocumentaryCorpus,
  assertHopDocumentaryRequest as assertHopDocumentaryRequestV1,
  readHopDocumentaryAnswer,
  readHopDocumentaryDossier,
} from './documentaryAnswerSchema';
import type {
  HopIntentDescriptorEvidence,
  HopIntentEvidencePartner,
  HopIntentEvidenceStatus,
} from './intentEvidence';
import type { HopDecisionMaterial } from './types';

export const HOP_PROPERTY_ADVICE_REQUEST_VERSION = 'hop-documentary-request-v2' as const;
export const HOP_PROPERTY_ADVICE_ANSWER_VERSION = 'hop-documentary-answer-v2' as const;
export const HOP_PROPERTY_ADVICE_DOSSIER_VERSION = 'hop-documentary-dossier-v2' as const;
export const HOP_PROPERTY_ADVICE_VIEW_VERSION = 'hop-documentary-answer-view-v2' as const;
export const HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION = 'hop-documentary-request-v3' as const;
export const HOP_PROPERTY_ADVICE_ANSWER_V3_VERSION = 'hop-documentary-answer-v3' as const;
export const HOP_PROPERTY_ADVICE_DOSSIER_V3_VERSION = 'hop-documentary-dossier-v3' as const;
export const HOP_PROPERTY_ADVICE_VIEW_V3_VERSION = 'hop-documentary-answer-view-v3' as const;

export type HopPropertyAdviceProperty = 'aroma' | 'bitterness' | 'sweetness' | 'acidity'
  | 'bioContribution' | 'materialCharacter' | 'unresolved';
export type HopPropertyAdviceRole = 'target' | 'reportedObservation' | 'measurement'
  | 'investigation' | 'preference' | 'constraint';
export type HopPropertyAdviceDirection = 'increase' | 'decrease' | 'keep' | 'exclude' | 'investigate' | null;
export type HopPropertyAdviceMetric = 'sensory' | 'pH' | 'titratableAcidity' | 'analyticalBU' | 'unspecified';
export type HopPropertyAdviceSubjectKind = 'beer' | 'material' | 'culture' | 'process' | 'unspecified';
export type HopPropertyAdviceSensoryContext = HopDescription['context'];

export interface HopPropertyAdviceSourceSpan {
  start: number;
  end: number;
  text: string;
}

export interface HopPropertyAdviceIntent {
  id: string;
  property: HopPropertyAdviceProperty;
  /** Exact caller-supplied term; never reparsed by this schema. */
  label: string;
  familyId?: string;
  partner?: HopIntentEvidencePartner;
  role: HopPropertyAdviceRole;
  direction: HopPropertyAdviceDirection;
  /** Verbatim qualifier only; it is never interpreted as a measurement or intensity value. */
  qualification: string | null;
  required: boolean;
  comparisonBasis: { kind: 'qualitativeTarget' | 'current' | 'none'; assertionIds: string[] };
  metric: HopPropertyAdviceMetric;
  subject: {
    kind: HopPropertyAdviceSubjectKind;
    label: string;
    materialId: string | null;
    sensoryContext: HopPropertyAdviceSensoryContext;
  };
  sourceSpans: HopPropertyAdviceSourceSpan[];
  interpretationOrigin: 'user' | 'proposal' | 'fixture';
  basis: string;
  relatedIntentIds: string[];
}

export interface HopPropertyAdviceCandidatePolicy {
  kind: 'explicit' | 'discover';
  /** Exact requested scope; missing IDs remain assessments and never become material facts. */
  materialIds: string[];
  basis: string;
}

export interface HopPropertyAdviceExclusion {
  id: string;
  intervention: Exclude<HopDocumentaryIntervention, 'none'>;
  certainty: 'certain' | 'possible' | 'unknown';
  intentIds: string[];
  reason: string;
}

export interface HopPropertyAdviceRequest {
  format: typeof HOP_PROPERTY_ADVICE_REQUEST_VERSION;
  id: string;
  originalQuestion: string;
  interpretation: HopDocumentaryRequest['interpretation'];
  propertyIntents: HopPropertyAdviceIntent[];
  candidatePolicy: HopPropertyAdviceCandidatePolicy;
  context: HopDocumentaryRequest['context'];
  exclusions: HopPropertyAdviceExclusion[];
  materials: HopDecisionMaterial[];
}

export interface HopPropertyAdviceInvestigationV3 {
  kind: 'comparePerceptualCompensation';
  observationIntentIds: string[];
}

export interface HopPropertyAdviceIntentV3 extends HopPropertyAdviceIntent {
  investigation?: HopPropertyAdviceInvestigationV3;
}

type PropertyAdviceRequestData = Omit<HopPropertyAdviceRequest, 'format'>;

/** Persisted projection of a compatible intent-to-description evaluation. */
export interface HopPropertyAdviceCandidateEvaluation {
  intentId: string;
  partnerReference: HopIntentEvidencePartner | null;
  status: HopIntentEvidenceStatus;
  candidateDescriptions: HopDescription[];
  partnerDescriptions: HopDescription[];
  candidateEvidence: HopIntentDescriptorEvidence[];
  partnerEvidence: HopIntentDescriptorEvidence[];
  familyIds: string[];
  sharedFamilyIds: string[];
  missingInformation: string[];
  consequence: string;
  reason: string;
}

export interface HopPropertyAdviceCandidateAssessment {
  materialId: string;
  status: 'documented' | 'notLoaded' | 'unqualified';
  recordKeys: string[];
  reasons: string[];
  evaluations: HopPropertyAdviceCandidateEvaluation[];
}

export type HopPropertyAdviceArgumentKind = 'userTarget' | 'userQuestion' | 'userObservation'
  | 'userMeasurement' | 'userPreference' | 'userConstraint' | 'proposedReading'
  | 'documentaryFact' | 'adviceInference' | 'trialHypothesis';

export interface HopPropertyAdviceArgument {
  id: string;
  kind: HopPropertyAdviceArgumentKind;
  text: string;
  intentIds: string[];
  assertionIds: string[];
  claimIds: string[];
  materialEvidence: Array<{
    materialId: string;
    intentId: string;
    evaluation: HopPropertyAdviceCandidateEvaluation;
  }>;
}

export type HopPropertyAdviceEffectStatus = 'boundedSupport' | 'tension' | 'structuralGuard'
  | 'hypothesis' | 'unresolved' | 'notApplicable';

export interface HopPropertyAdviceEffect {
  intentId: string;
  status: HopPropertyAdviceEffectStatus;
  text: string;
  argumentIds: string[];
}

export interface HopPropertyAdviceTradeoff {
  text: string;
  intentIds: string[];
  argumentIds: string[];
}

export interface HopPropertyAdviceNextStep {
  kind: 'document' | 'compare' | 'qualify' | 'futurePlan';
  text: string;
  argumentIds: string[];
}

export interface HopPropertyAdviceCondition {
  id: string;
  state: 'met' | 'unmet' | 'unknown';
  description: string;
  assertionIds: string[];
  intentIds: string[];
}

export interface HopPropertyAdviceStrategy {
  id: string;
  /** Stable semantic strategy kind; it is not a score, rank, or permission. */
  kind: string;
  contribution: 'option' | 'investigation' | 'characterization';
  title: string;
  purpose: string;
  distinctiveReason: string;
  scope: HopDocumentaryScope;
  intervention: HopDocumentaryIntervention;
  argumentIds: string[];
  candidateIds: string[];
  documentaryProductRefs: Array<{ id: string; name: string; claimIds: string[] }>;
  effects: HopPropertyAdviceEffect[];
  tradeoffs: HopPropertyAdviceTradeoff[];
  nextSteps: HopPropertyAdviceNextStep[];
  applicability: {
    status: 'conditionsMet' | 'missingConditions' | 'incompatible' | 'notEvaluated';
    conditions: HopPropertyAdviceCondition[];
  };
  preparation: HopDocumentaryPreparation;
  reference: string;
}

export type HopPropertyAdviceCoverageStatus = 'answered' | 'partial' | 'outOfScope';
export type HopPropertyAdvicePointStatus = 'answered' | 'partial' | 'unresolved' | 'contextOnly';

export interface HopPropertyAdviceAnswer {
  format: typeof HOP_PROPERTY_ADVICE_ANSWER_VERSION;
  requestSnapshot: HopPropertyAdviceRequest;
  corpusSnapshot: HopDocumentaryCorpus;
  rulesVersion: string;
  inputReference: string;
  interpretationReference: string;
  coverage: {
    status: HopPropertyAdviceCoverageStatus;
    points: Array<{
      intentId: string;
      status: HopPropertyAdvicePointStatus;
      reason: string;
      argumentIds: string[];
      strategyIds: string[];
    }>;
  };
  body: Array<{ id: string; text: string; argumentIds: string[] }>;
  arguments: HopPropertyAdviceArgument[];
  candidateAssessments: HopPropertyAdviceCandidateAssessment[];
  strategies: HopPropertyAdviceStrategy[];
  limits: string[];
  reference: string;
}

export interface HopPropertyAdviceDossier {
  format: typeof HOP_PROPERTY_ADVICE_DOSSIER_VERSION;
  id: string;
  answerSnapshot: HopPropertyAdviceAnswer;
  answerReference: string;
  interpretationReference: string;
  strategyId: string;
  strategySnapshot: HopPropertyAdviceStrategy;
  strategyReference: string;
  motive: string;
  createdAt: string;
  createdBy: { origin: 'user' | 'proposal' | 'fixture'; label: string };
  preparation: HopDocumentaryPreparation;
  reference: string;
}

export interface CreateHopPropertyAdviceDossierInput {
  id: string;
  answer: HopPropertyAdviceAnswer;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
  createdAt: string;
  createdBy: HopPropertyAdviceDossier['createdBy'];
}

export type HopPropertyAdviceRequestV3 = Omit<HopPropertyAdviceRequest, 'format' | 'propertyIntents'> & {
  format: typeof HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION;
  propertyIntents: HopPropertyAdviceIntentV3[];
};

export type HopPropertyAdviceAnswerV3 = Omit<HopPropertyAdviceAnswer, 'format' | 'requestSnapshot'> & {
  format: typeof HOP_PROPERTY_ADVICE_ANSWER_V3_VERSION;
  requestSnapshot: HopPropertyAdviceRequestV3;
};

export type HopPropertyAdviceDossierV3 = Omit<HopPropertyAdviceDossier, 'format' | 'answerSnapshot'> & {
  format: typeof HOP_PROPERTY_ADVICE_DOSSIER_V3_VERSION;
  answerSnapshot: HopPropertyAdviceAnswerV3;
};

export interface CreateHopPropertyAdviceDossierV3Input extends Omit<CreateHopPropertyAdviceDossierInput, 'answer'> {
  answer: HopPropertyAdviceAnswerV3;
}

export type HopPropertyAdviceAnswerReadResult =
  | { status: 'readOnly'; answer: HopPropertyAdviceAnswer }
  | { status: 'legacyReadOnly'; answer: import('./documentaryAnswerSchema').HopDocumentaryAnswer }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };
export type HopPropertyAdviceDossierReadResult =
  | { status: 'readOnly'; dossier: HopPropertyAdviceDossier }
  | { status: 'legacyReadOnly'; dossier: import('./documentaryAnswerSchema').HopDocumentaryDossier }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export type HopPropertyAdviceAnswerV3ReadResult =
  | { status: 'readOnly'; answer: HopPropertyAdviceAnswerV3 }
  | { status: 'legacyReadOnly'; version: 'v2'; answer: HopPropertyAdviceAnswer }
  | { status: 'legacyReadOnly'; version: 'v1'; answer: import('./documentaryAnswerSchema').HopDocumentaryAnswer }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };
export type HopPropertyAdviceDossierV3ReadResult =
  | { status: 'readOnly'; dossier: HopPropertyAdviceDossierV3 }
  | { status: 'legacyReadOnly'; version: 'v2'; dossier: HopPropertyAdviceDossier }
  | { status: 'legacyReadOnly'; version: 'v1'; dossier: import('./documentaryAnswerSchema').HopDocumentaryDossier }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export interface HopPropertyAdviceAnswerViewModel extends Omit<HopPropertyAdviceAnswer, 'format' | 'reference'> {
  format: typeof HOP_PROPERTY_ADVICE_VIEW_VERSION;
  answerReference: string;
}
export interface HopPropertyAdviceAnswerViewModelV3 extends Omit<HopPropertyAdviceAnswerV3, 'format' | 'reference'> {
  format: typeof HOP_PROPERTY_ADVICE_VIEW_V3_VERSION;
  answerReference: string;
}

type Row = Record<string, any>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const propertyValues: readonly HopPropertyAdviceProperty[] = [
  'aroma', 'bitterness', 'sweetness', 'acidity', 'bioContribution', 'materialCharacter', 'unresolved',
];
const roleValues: readonly HopPropertyAdviceRole[] = [
  'target', 'reportedObservation', 'measurement', 'investigation', 'preference', 'constraint',
];
const directionValues: readonly Exclude<HopPropertyAdviceDirection, null>[] = [
  'increase', 'decrease', 'keep', 'exclude', 'investigate',
];
const metricValues: readonly HopPropertyAdviceMetric[] = ['sensory', 'pH', 'titratableAcidity', 'analyticalBU', 'unspecified'];
const contextValues: readonly HopPropertyAdviceSensoryContext[] = ['rawHop', 'infusion', 'beer', 'unspecified'];
const evidenceStatuses: readonly HopIntentEvidenceStatus[] = [
  'documentedSupport', 'documentedTension', 'documentedAgainst', 'documentedOverlap', 'candidateOnly', 'partnerOnly',
  'observationToPreserve', 'notDocumented', 'unknown', 'ambiguous', 'notApplicable',
];
const scopeValues: readonly HopDocumentaryScope[] = ['bulkBeer', 'sampling', 'separatePortion', 'futureBrew', 'documentation'];
const interventionValues: readonly HopDocumentaryIntervention[] = ['none', 'changeBitterness', 'changeAroma', 'involveCulture'];

function invalid(message: string): never { throw Error(message); }

class UnqualifiedMeasurementSnapshotError extends Error {
  constructor(message: string) { super(message); this.name = 'UnqualifiedMeasurementSnapshotError'; }
}

function unqualifiedMeasurement(message: string): never { throw new UnqualifiedMeasurementSnapshotError(message); }

class UnqualifiedPerceptualInvestigationMetricSnapshotError extends Error {
  constructor(message: string) { super(message); this.name = 'UnqualifiedPerceptualInvestigationMetricSnapshotError'; }
}

function unqualifiedPerceptualInvestigationMetric(message: string): never {
  throw new UnqualifiedPerceptualInvestigationMetricSnapshotError(message);
}

function onlyKeys(value: Row, allowed: readonly string[], label: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid(`${label}: champ non pris en charge.`);
}

function assertText(value: unknown, label: string): asserts value is string {
  if (!nonempty(value)) invalid(`${label} absent.`);
}

function assertStringArray(value: unknown, label: string, allowEmpty = true): asserts value is string[] {
  if (!Array.isArray(value) || value.some(item => !nonempty(item)) || new Set(value).size !== value.length
    || (!allowEmpty && value.length === 0)) invalid(`${label} invalide.`);
}

function assertUniqueBy<T>(rows: readonly T[], getId: (row: T) => string, label: string): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (!isRow(row)) invalid(`${label}: ligne invalide.`);
    const id = getId(row as T);
    if (!nonempty(id)) invalid(`${label}: identifiant absent.`);
    if (seen.has(id)) invalid(`${label}: identifiant répété.`);
    seen.add(id);
  }
}

function assertUniqueIds(rows: readonly { id: string }[], label: string): void {
  assertUniqueBy(rows, row => row.id, label);
}

function assertSet(actual: readonly string[], expected: ReadonlySet<string>, label: string): void {
  if (actual.length !== expected.size || new Set(actual).size !== actual.length || actual.some(id => !expected.has(id))) {
    invalid(`${label}: références absentes, répétées ou orphelines.`);
  }
}

function assertReferences(value: unknown, allowed: ReadonlySet<string>, label: string, allowEmpty = true): asserts value is string[] {
  assertStringArray(value, label, allowEmpty);
  if (value.some(id => !allowed.has(id))) invalid(`${label}: référence orpheline.`);
}

function assertSerializable(value: unknown, label: string, active = new WeakSet<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid(`${label}: nombre non fini.`);
    return;
  }
  if (typeof value !== 'object' || value === undefined) invalid(`${label}: valeur non JSON.`);
  if (active.has(value)) invalid(`${label}: cycle JSON.`);
  if (!Array.isArray(value)) {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) invalid(`${label}: objet non JSON.`);
    if (Object.getOwnPropertySymbols(value).length) invalid(`${label}: clé symbole non JSON.`);
  }
  active.add(value);
  if (Array.isArray(value)) value.forEach(child => assertSerializable(child, label, active));
  else for (const [key, child] of Object.entries(value)) {
    if (child === undefined) invalid(`${label}: propriété undefined.`);
    assertSerializable(child, label, active);
  }
  active.delete(value);
}

function sameJson(left: unknown, right: unknown): boolean {
  try {
    return hopAdviceContentReference('hop-property-advice-equality-v2', left)
      === hopAdviceContentReference('hop-property-advice-equality-v2', right);
  } catch {
    return false;
  }
}

function assertDescription(value: unknown, label: string): asserts value is HopDescription {
  if (!isRow(value)) invalid(`${label} invalide.`);
  onlyKeys(value, ['text', 'context', 'source'], label);
  assertText(value.text, `${label}.text`);
  if (!contextValues.includes(value.context)) invalid(`${label}.context inconnu.`);
  if (hopSourceError(value.source)) invalid(`${label}.source invalide.`);
}

function assertPartner(value: unknown, request: PropertyAdviceRequestData): asserts value is HopIntentEvidencePartner {
  if (!isRow(value)) invalid('Partenaire d’intention invalide.');
  if (value.kind === 'material') {
    onlyKeys(value, ['kind', 'id', 'additionId'], 'Partenaire matière');
    assertText(value.id, 'Partenaire matière.id');
    if (!request.materials.some(row => row.id === value.id) && !request.candidatePolicy.materialIds.includes(value.id)) {
      invalid('Partenaire matière non référencé dans le périmètre explicite.');
    }
    if (value.additionId !== undefined) assertText(value.additionId, 'Partenaire matière.additionId');
    return;
  }
  if (value.kind === 'observation') {
    onlyKeys(value, ['kind', 'id', 'descriptions'], 'Partenaire observation');
    assertText(value.id, 'Partenaire observation.id');
    if (value.descriptions !== undefined) {
      if (!Array.isArray(value.descriptions)) invalid('Partenaire observation.descriptions invalide.');
      value.descriptions.forEach((description: unknown) => assertDescription(description, 'Partenaire observation.description'));
    }
    return;
  }
  if (value.kind === 'freeContext') {
    onlyKeys(value, ['kind', 'text', 'context', 'source'], 'Partenaire libre');
    assertText(value.text, 'Partenaire libre.text');
    if (value.context !== undefined) assertText(value.context, 'Partenaire libre.context');
    if (value.source !== undefined && hopSourceError(value.source)) invalid('Partenaire libre.source invalide.');
    return;
  }
  invalid('Type de partenaire inconnu.');
}

function assertContextAndMaterials(request: PropertyAdviceRequestData): void {
  // Le snapshot v2 réutilise strictement les assertions, accès et matières communs déjà validés en v1.
  const sharedShape: HopDocumentaryRequest = {
    format: 'hop-documentary-request-v1', id: 'property-advice-validation',
    originalQuestion: request.originalQuestion, interpretation: request.interpretation,
    criteria: [], needs: [{ id: 'property-advice-validation-need', kind: 'unresolved', criterionIds: [], explanation: 'Validation structurelle commune.' }],
    context: request.context, exclusions: [], materials: request.materials,
  };
  assertHopDocumentaryRequestV1(sharedShape);
}

type PropertyAdviceAssertion = HopPropertyAdviceRequest['context']['assertions'][number];
type MeasurementValidationMode = 'strict' | 'legacyV2';

/** Conservative metric/unit check on one assertion; no unit conversion or value synthesis is performed. */
function measuredFactMatchesMetric(intent: HopPropertyAdviceIntent, assertion: PropertyAdviceAssertion): boolean {
  if (assertion.state !== 'measured' || !finite(assertion.value) || typeof assertion.unit !== 'string' || !assertion.unit.trim()) return false;
  if (intent.subject.kind !== 'beer') return false;
  switch (intent.metric) {
    case 'pH':
      return intent.property === 'acidity' && assertion.dimension === 'acidity' && assertion.unit === 'pH';
    case 'titratableAcidity':
      // V2 assertions have no typed analyte/basis field; a raw concentration cannot certify TA.
      return false;
    case 'analyticalBU':
      return intent.property === 'bitterness' && assertion.unit === 'BU'
        && (assertion.dimension === undefined || assertion.dimension === 'other');
    case 'sensory':
    case 'unspecified':
      return false;
  }
}

/** Structural measurement rules used only to inspect known V2 archives written before the metric guard. */
function assertLegacyV2MeasurementShape(value: Row, request: PropertyAdviceRequestData): void {
  if (value.metric === 'unspecified') invalid('Une ancienne mesure V2 doit déclarer sa métrique.');
  if (value.comparisonBasis.kind !== 'current') invalid('Une ancienne mesure V2 doit déclarer sa base current.');
  const assertions = request.context.assertions.filter(row => value.comparisonBasis.assertionIds.includes(row.id));
  if (!assertions.some(row => row.state === 'measured' && finite(row.value) && typeof row.unit === 'string' && !!row.unit.trim())) {
    invalid('Ancienne mesure V2 sans assertion mesurée, valeur finie et unité.');
  }
  if ((value.metric === 'pH' || value.metric === 'titratableAcidity') && !assertions.some(row => row.dimension === 'acidity')) {
    invalid('Ancienne mesure V2 d’acidité sans assertion de dimension acidity.');
  }
}

function assertPropertyIntent(value: unknown, request: PropertyAdviceRequestData, measurementMode: MeasurementValidationMode,
  extraAllowedKeys: readonly string[] = []): asserts value is HopPropertyAdviceIntent {
  if (!isRow(value)) invalid('Intention de propriété absente.');
  onlyKeys(value, ['id', 'property', 'label', 'familyId', 'partner', 'role', 'direction', 'qualification', 'required',
    'comparisonBasis', 'metric', 'subject', 'sourceSpans', 'interpretationOrigin', 'basis', 'relatedIntentIds', ...extraAllowedKeys], 'Intention de propriété');
  assertText(value.id, 'Intention.id');
  if (!propertyValues.includes(value.property)) invalid('Propriété inconnue.');
  assertText(value.label, 'Intention.label');
  if (value.familyId !== undefined) assertText(value.familyId, 'Intention.familyId');
  if (value.partner !== undefined) assertPartner(value.partner, request);
  if (!roleValues.includes(value.role)) invalid('Rôle d’intention inconnu.');
  if (value.direction !== null && !directionValues.includes(value.direction)) invalid('Direction d’intention inconnue.');
  if (value.qualification !== null && typeof value.qualification !== 'string') invalid('Qualification d’intention invalide.');
  if (typeof value.required !== 'boolean') invalid('Intention.required invalide.');
  if (!isRow(value.comparisonBasis)) invalid('Base de comparaison absente.');
  onlyKeys(value.comparisonBasis, ['kind', 'assertionIds'], 'Base de comparaison');
  if (!['qualitativeTarget', 'current', 'none'].includes(value.comparisonBasis.kind)) invalid('Type de base de comparaison inconnu.');
  const assertionIds = new Set<string>(request.context.assertions.map(row => row.id));
  assertReferences(value.comparisonBasis.assertionIds, assertionIds, 'Base de comparaison.assertionIds');
  if (value.comparisonBasis.kind !== 'current' && value.comparisonBasis.assertionIds.length) {
    invalid('Une cible qualitative ou une base none ne peut porter des assertions de baseline.');
  }
  if (['keep', 'decrease'].includes(value.direction) && value.comparisonBasis.kind !== 'current') {
    invalid('Une garde relative ou une baisse exige une base current explicite, qui peut rester inconnue sans assertion.');
  }
  if (!metricValues.includes(value.metric)) invalid('Métrique d’intention inconnue.');
  if (!isRow(value.subject)) invalid('Sujet d’intention absent.');
  onlyKeys(value.subject, ['kind', 'label', 'materialId', 'sensoryContext'], 'Sujet d’intention');
  if (!['beer', 'material', 'culture', 'process', 'unspecified'].includes(value.subject.kind)) invalid('Type de sujet inconnu.');
  assertText(value.subject.label, 'Sujet.label');
  if (value.subject.materialId !== null) {
    assertText(value.subject.materialId, 'Sujet.materialId');
    if (!request.materials.some(row => row.id === value.subject.materialId)
      && !request.candidatePolicy.materialIds.includes(value.subject.materialId)) invalid('Sujet matière absent du snapshot ou du périmètre explicite.');
  }
  if (!contextValues.includes(value.subject.sensoryContext)) invalid('Sujet.sensoryContext inconnu.');
  if (value.subject.kind !== 'material' && value.subject.materialId !== null) invalid('Un sujet non matière ne peut porter materialId.');
  if (!Array.isArray(value.sourceSpans)) invalid('Fragments sources absents.');
  for (const span of value.sourceSpans) {
    if (!isRow(span)) invalid('Fragment source invalide.');
    onlyKeys(span, ['start', 'end', 'text'], 'Fragment source');
    if (!Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end) || span.start < 0
      || span.end < span.start || typeof span.text !== 'string'
      || request.originalQuestion.slice(span.start, span.end) !== span.text) invalid('Fragment source différent de la question exacte.');
  }
  if (!['user', 'proposal', 'fixture'].includes(value.interpretationOrigin)) invalid('Origine d’interprétation inconnue.');
  assertText(value.basis, 'Intention.basis');
  assertStringArray(value.relatedIntentIds, 'Intention.relatedIntentIds');

  if (value.role === 'measurement') {
    if (measurementMode === 'legacyV2') {
      assertLegacyV2MeasurementShape(value, request);
    } else {
      if (value.metric === 'unspecified') unqualifiedMeasurement('Métrique unspecified : la mesure reste conservée comme fait brut mais n’est pas qualifiée.');
      if (value.comparisonBasis.kind !== 'current') unqualifiedMeasurement('Une mesure doit déclarer sa base current.');
      if (value.comparisonBasis.assertionIds.length !== 1) {
        unqualifiedMeasurement('Une mesure doit référencer une seule assertion mesurée compatible avec sa métrique et son unité.');
      }
      const assertion = request.context.assertions.find(row => row.id === value.comparisonBasis.assertionIds[0]);
      if (!assertion || !measuredFactMatchesMetric(value as unknown as HopPropertyAdviceIntent, assertion)) {
        if (value.metric === 'titratableAcidity') unqualifiedMeasurement('L’assertion V2 ne porte pas d’identité structurée de méthode/base pour qualifier l’acidité titrable; la valeur brute reste non qualifiée.');
        if (value.metric === 'sensory') unqualifiedMeasurement('Une mesure sensorielle exige une référence d’échelle/version absente du contrat V2.');
        if (value.metric === 'analyticalBU') unqualifiedMeasurement('Une mesure analyticalBU exige une assertion de propriété amertume portant l’unité BU exacte et sans dimension contradictoire.');
        if (value.metric === 'pH') unqualifiedMeasurement('La même assertion pH mesurée doit porter valeur finie, unité pH et dimension acidité.');
        unqualifiedMeasurement('Métrique de mesure non prise en charge sans assertion compatible.');
      }
    }
  }
  if (value.role === 'investigation' && value.direction !== 'investigate') invalid('Une investigation doit garder sa direction investigate.');
  if (['reportedObservation', 'measurement'].includes(value.role) && value.direction !== null) {
    invalid('Une observation ou mesure rapportée ne porte pas une direction d’objectif.');
  }
  if (value.role !== 'investigation' && value.direction === 'investigate') {
    invalid('Une direction investigate exige le rôle investigation; elle ne devient pas une observation.');
  }
}

function assertPropertyAdviceRequestStructure(value: unknown, expectedFormat: string, measurementMode: MeasurementValidationMode,
  validateIntent: (value: unknown, request: PropertyAdviceRequestData) => void): void {
  if (!isRow(value) || value.format !== expectedFormat) invalid('Format de demande de conseil par propriété invalide.');
  assertSerializable(value, 'Demande V2');
  onlyKeys(value, ['format', 'id', 'originalQuestion', 'interpretation', 'propertyIntents', 'candidatePolicy', 'context', 'exclusions', 'materials'], 'Demande V2');
  assertText(value.id, 'Demande.id'); assertText(value.originalQuestion, 'Demande.originalQuestion');
  if (!isRow(value.interpretation)) invalid('Interprétation V2 absente.');
  onlyKeys(value.interpretation, ['id', 'version', 'text', 'origin'], 'Interprétation V2');
  assertText(value.interpretation.id, 'Interprétation.id'); assertText(value.interpretation.version, 'Interprétation.version');
  assertText(value.interpretation.text, 'Interprétation.text');
  if (!['user', 'proposal'].includes(value.interpretation.origin)) invalid('Origine d’interprétation V2 inconnue.');

  if (!Array.isArray(value.propertyIntents) || value.propertyIntents.length === 0) invalid('La demande doit conserver une intention de propriété au minimum.');
  if (!isRow(value.candidatePolicy)) invalid('Politique de candidats absente.');
  onlyKeys(value.candidatePolicy, ['kind', 'materialIds', 'basis'], 'Politique de candidats');
  if (!['explicit', 'discover'].includes(value.candidatePolicy.kind)) invalid('Politique de candidats inconnue.');
  assertStringArray(value.candidatePolicy.materialIds, 'Politique.materialIds');
  assertText(value.candidatePolicy.basis, 'Politique.basis');
  if (value.candidatePolicy.kind === 'discover' && value.candidatePolicy.materialIds.length === 0) {
    invalid('La découverte doit nommer son périmètre; elle ne signifie jamais tout le catalogue.');
  }
  if (!isRow(value.context) || !Array.isArray(value.materials)) invalid('Contexte ou snapshot de matières absent.');
  if (!Array.isArray(value.exclusions)) invalid('Exclusions V2 absentes.');
  const request = value as unknown as PropertyAdviceRequestData;
  assertContextAndMaterials(request);
  value.propertyIntents.forEach((intent: unknown) => validateIntent(intent, request));
  assertUniqueIds(value.propertyIntents, 'Intentions');
  const intentIds = new Set<string>(value.propertyIntents.map((intent: HopPropertyAdviceIntent) => intent.id));
  for (const intent of value.propertyIntents as HopPropertyAdviceIntent[]) {
    assertReferences(intent.relatedIntentIds, intentIds, `Intention ${intent.id}.relatedIntentIds`);
    if (intent.relatedIntentIds.includes(intent.id)) invalid('Une intention ne peut se référencer elle-même.');
  }
  const materialIds = new Set<string>(value.materials.map((material: HopDecisionMaterial) => material.id));
  for (const intent of value.propertyIntents as HopPropertyAdviceIntent[]) {
    if (intent.subject.materialId && !materialIds.has(intent.subject.materialId)
      && !value.candidatePolicy.materialIds.includes(intent.subject.materialId)) invalid('Sujet matière non couvert par les matières ou le périmètre demandé.');
  }
  for (const exclusion of value.exclusions) {
    if (!isRow(exclusion)) invalid('Exclusion V2 invalide.');
    onlyKeys(exclusion, ['id', 'intervention', 'certainty', 'intentIds', 'reason'], 'Exclusion V2');
    assertText(exclusion.id, 'Exclusion.id'); assertText(exclusion.reason, 'Exclusion.reason');
    if (!interventionValues.includes(exclusion.intervention) || exclusion.intervention === 'none'
      || !['certain', 'possible', 'unknown'].includes(exclusion.certainty)) invalid('Intervention ou certitude d’exclusion invalide.');
    assertReferences(exclusion.intentIds, intentIds, 'Exclusion.intentIds', false);
  }
  assertUniqueIds(value.exclusions, 'Exclusions V2');
}

function assertHopPropertyAdviceRequestWithMode(value: unknown, measurementMode: MeasurementValidationMode): asserts value is HopPropertyAdviceRequest {
  assertPropertyAdviceRequestStructure(value, HOP_PROPERTY_ADVICE_REQUEST_VERSION, measurementMode,
    (intent, request) => assertPropertyIntent(intent, request, measurementMode));
}

export function assertHopPropertyAdviceRequest(value: unknown): asserts value is HopPropertyAdviceRequest {
  assertHopPropertyAdviceRequestWithMode(value, 'strict');
}

type PerceptualInvestigationMetricMode = 'strict' | 'capturedHistoricalV3';

function assertPropertyIntentV3(value: unknown, request: PropertyAdviceRequestData,
  metricMode: PerceptualInvestigationMetricMode = 'strict'): asserts value is HopPropertyAdviceIntentV3 {
  assertPropertyIntent(value, request, 'strict', ['investigation']);
  const intent = value as HopPropertyAdviceIntentV3;
  if (intent.investigation === undefined) return;
  if (!isRow(intent.investigation)) invalid('Investigation typée V3 absente ou invalide.');
  onlyKeys(intent.investigation, ['kind', 'observationIntentIds'], 'Investigation typée V3');
  if (intent.investigation.kind !== 'comparePerceptualCompensation') invalid('Type d’investigation V3 inconnu.');
  if (intent.role !== 'investigation' || intent.direction !== 'investigate') {
    invalid('comparePerceptualCompensation exige role investigation et direction investigate.');
  }
  if (metricMode === 'strict' && !['sensory', 'unspecified'].includes(intent.metric)) {
    unqualifiedPerceptualInvestigationMetric('Une investigation perceptive comparePerceptualCompensation ne peut utiliser qu’une métrique sensory ou unspecified.');
  }
  assertStringArray(intent.investigation.observationIntentIds, 'Investigation.observationIntentIds', false);
  const intents = new Map(request.propertyIntents.map(row => [row.id, row]));
  for (const observationId of intent.investigation.observationIntentIds) {
    const observation = intents.get(observationId);
    if (!observation || observation.role !== 'reportedObservation' || observation.metric !== 'sensory') {
      invalid('comparePerceptualCompensation doit référencer un constat reportedObservation/sensory présent.');
    }
    if (!intent.relatedIntentIds.includes(observationId)) {
      invalid('Chaque observation investiguée doit aussi être liée par relatedIntentIds.');
    }
  }
}

function assertHopPropertyAdviceRequestV3WithMode(value: unknown,
  metricMode: PerceptualInvestigationMetricMode): asserts value is HopPropertyAdviceRequestV3 {
  assertPropertyAdviceRequestStructure(value, HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION, 'strict',
    (intent, request) => assertPropertyIntentV3(intent, request, metricMode));
}

export function assertHopPropertyAdviceRequestV3(value: unknown): asserts value is HopPropertyAdviceRequestV3 {
  assertHopPropertyAdviceRequestV3WithMode(value, 'strict');
}

function rawHopPropertyAdviceInputReference(request: HopPropertyAdviceRequest, corpus: HopDocumentaryCorpus): string {
  return hopAdviceContentReference('hop-property-advice-input-v2', { request, corpus });
}

function rawHopPropertyAdviceInterpretationReference(request: HopPropertyAdviceRequest): string {
  return hopAdviceContentReference('hop-property-advice-interpretation-v2', {
    originalQuestion: request.originalQuestion, interpretation: request.interpretation,
    propertyIntents: request.propertyIntents, exclusions: request.exclusions,
  });
}

export function hopPropertyAdviceInputReference(request: HopPropertyAdviceRequest, corpus: HopDocumentaryCorpus): string {
  assertHopPropertyAdviceRequest(request);
  assertHopDocumentaryCorpus(corpus);
  return rawHopPropertyAdviceInputReference(request, corpus);
}

export function hopPropertyAdviceInterpretationReference(request: HopPropertyAdviceRequest): string {
  assertHopPropertyAdviceRequest(request);
  return rawHopPropertyAdviceInterpretationReference(request);
}

export function hopPropertyAdviceStrategyReference(inputReference: string,
  strategy: Omit<HopPropertyAdviceStrategy, 'reference'> | HopPropertyAdviceStrategy): string {
  assertText(inputReference, 'Strategy.inputReference');
  const { reference: _reference, ...body } = strategy as HopPropertyAdviceStrategy;
  assertSerializable(body, 'Stratégie');
  return hopAdviceContentReference('hop-property-advice-strategy-v2', { inputReference, strategy: body });
}

export function hopPropertyAdviceAnswerReference(answer: Omit<HopPropertyAdviceAnswer, 'reference'> | HopPropertyAdviceAnswer): string {
  const { reference: _reference, ...body } = answer as HopPropertyAdviceAnswer;
  assertSerializable(body, 'Réponse V2');
  return hopAdviceContentReference('hop-property-advice-answer-v2', body);
}

export function hopPropertyAdviceDossierReference(dossier: Omit<HopPropertyAdviceDossier, 'reference'> | HopPropertyAdviceDossier): string {
  const { reference: _reference, ...body } = dossier as HopPropertyAdviceDossier;
  assertSerializable(body, 'Dossier V2');
  return hopAdviceContentReference('hop-documentary-dossier-v2', body);
}

function rawHopPropertyAdviceInputReferenceV3(request: HopPropertyAdviceRequestV3, corpus: HopDocumentaryCorpus): string {
  return hopAdviceContentReference('hop-property-advice-input-v3', { request, corpus });
}

function rawHopPropertyAdviceInterpretationReferenceV3(request: HopPropertyAdviceRequestV3): string {
  return hopAdviceContentReference('hop-property-advice-interpretation-v3', {
    originalQuestion: request.originalQuestion, interpretation: request.interpretation,
    propertyIntents: request.propertyIntents, exclusions: request.exclusions,
  });
}

export function hopPropertyAdviceInputReferenceV3(request: HopPropertyAdviceRequestV3, corpus: HopDocumentaryCorpus): string {
  assertHopPropertyAdviceRequestV3(request);
  assertHopDocumentaryCorpus(corpus);
  return rawHopPropertyAdviceInputReferenceV3(request, corpus);
}

export function hopPropertyAdviceInterpretationReferenceV3(request: HopPropertyAdviceRequestV3): string {
  assertHopPropertyAdviceRequestV3(request);
  return rawHopPropertyAdviceInterpretationReferenceV3(request);
}

export function hopPropertyAdviceStrategyReferenceV3(inputReference: string,
  strategy: Omit<HopPropertyAdviceStrategy, 'reference'> | HopPropertyAdviceStrategy): string {
  assertText(inputReference, 'StrategyV3.inputReference');
  const { reference: _reference, ...body } = strategy as HopPropertyAdviceStrategy;
  assertSerializable(body, 'Stratégie V3');
  return hopAdviceContentReference('hop-property-advice-strategy-v3', { inputReference, strategy: body });
}

export function hopPropertyAdviceAnswerReferenceV3(answer: Omit<HopPropertyAdviceAnswerV3, 'reference'> | HopPropertyAdviceAnswerV3): string {
  const { reference: _reference, ...body } = answer as HopPropertyAdviceAnswerV3;
  assertSerializable(body, 'Réponse V3');
  return hopAdviceContentReference('hop-property-advice-answer-v3', body);
}

export function hopPropertyAdviceDossierReferenceV3(dossier: Omit<HopPropertyAdviceDossierV3, 'reference'> | HopPropertyAdviceDossierV3): string {
  const { reference: _reference, ...body } = dossier as HopPropertyAdviceDossierV3;
  assertSerializable(body, 'Dossier V3');
  return hopAdviceContentReference('hop-documentary-dossier-v3', body);
}

function assertPreparation(value: unknown): asserts value is HopDocumentaryPreparation {
  if (!isRow(value)) invalid('Préparation de stratégie absente.');
  onlyKeys(value, ['documentaryDossier', 'operational', 'missingRequirements', 'refusalReasons'], 'Préparation V2');
  if (!isRow(value.documentaryDossier)) invalid('Dossier documentaire de stratégie absent.');
  onlyKeys(value.documentaryDossier, ['status', 'kind', 'label'], 'Dossier de stratégie');
  if (value.documentaryDossier.status !== 'available'
    || !['choice', 'trialToQualify', 'futureStudy'].includes(value.documentaryDossier.kind)) invalid('Type de dossier documentaire inconnu.');
  assertText(value.documentaryDossier.label, 'Préparation.documentaryDossier.label');
  if (!isRow(value.operational)) invalid('Statut opérationnel absent.');
  onlyKeys(value.operational, ['status', 'adapterId', 'reason'], 'Préparation opérationnelle');
  if (value.operational.status !== 'notProvided' || value.operational.adapterId !== null) {
    invalid('Une synthèse V2 ne peut promouvoir une stratégie en opération prête ou reçue.');
  }
  assertText(value.operational.reason, 'Préparation.operational.reason');
  assertStringArray(value.missingRequirements, 'Préparation.missingRequirements');
  assertStringArray(value.refusalReasons, 'Préparation.refusalReasons');
}

function containsCorpusSource(source: HopSource, corpus: HopDocumentaryCorpus): boolean {
  return corpus.sources.some(row => sameJson(row.source, source));
}

function lexicalIntentCompatible(intent: HopPropertyAdviceIntent): boolean {
  if (intent.metric !== 'sensory' || intent.property !== 'aroma') return false;
  if (intent.role === 'target' || intent.role === 'preference') {
    return intent.direction !== 'investigate';
  }
  if (intent.role === 'constraint') return intent.direction === 'keep' || intent.direction === 'exclude' || intent.direction === 'decrease';
  return false;
}

function assertEvidenceDescriptor(value: unknown, side: 'candidate' | 'partner', descriptions: readonly HopDescription[], corpus: HopDocumentaryCorpus): asserts value is HopIntentDescriptorEvidence {
  if (!isRow(value)) invalid('Descripteur candidat invalide.');
  onlyKeys(value, ['side', 'familyId', 'familyName', 'term', 'quote', 'context', 'polarity', 'source', 'mappingSource'], 'Descripteur candidat');
  if (value.side !== side) invalid('Côté de descripteur différent de son évaluation.');
  assertText(value.familyId, 'Descripteur.familyId'); assertText(value.familyName, 'Descripteur.familyName');
  assertText(value.term, 'Descripteur.term'); assertText(value.quote, 'Descripteur.quote');
  if (!contextValues.includes(value.context) || !['positiveMention', 'explicitNegation', 'ambiguousMention'].includes(value.polarity)) {
    invalid('Polarité ou contexte de descripteur inconnu.');
  }
  if (hopSourceError(value.source) || hopSourceError(value.mappingSource)) invalid('Source de descripteur invalide.');
  if (!descriptions.some(description => description.text === value.quote && description.context === value.context
    && sameJson(description.source, value.source))) invalid('Citation de descripteur absente de sa description source exacte.');
  if (!containsCorpusSource(value.mappingSource, corpus)) invalid('Mapping du descripteur absent du corpus exact.');
}

function assertCandidateEvaluation(value: unknown, intent: HopPropertyAdviceIntent, material: HopDecisionMaterial,
  request: PropertyAdviceRequestData, corpus: HopDocumentaryCorpus): asserts value is HopPropertyAdviceCandidateEvaluation {
  if (!isRow(value)) invalid('Évaluation documentaire de candidat absente.');
  onlyKeys(value, ['intentId', 'partnerReference', 'status', 'candidateDescriptions', 'partnerDescriptions', 'candidateEvidence',
    'partnerEvidence', 'familyIds', 'sharedFamilyIds', 'missingInformation', 'consequence', 'reason'], 'Évaluation de candidat');
  if (value.intentId !== intent.id || !evidenceStatuses.includes(value.status)) invalid('Évaluation liée à une autre intention ou statut inconnu.');
  if (!sameJson(value.partnerReference, intent.partner ?? null)) invalid('Partenaire de l’évaluation différent du snapshot d’intention.');
  const candidateDescriptions = material.variety?.descriptions ?? [];
  let allowedPartnerDescriptions: HopDescription[] = [];
  const partner = intent.partner;
  if (partner?.kind === 'material') {
    const partnerMaterial = request.materials.find(row => row.id === partner.id);
    allowedPartnerDescriptions = partnerMaterial?.variety?.descriptions ?? [];
  } else if (partner?.kind === 'observation') {
    allowedPartnerDescriptions = [...(partner.descriptions ?? [])];
  }
  if (!Array.isArray(value.candidateDescriptions) || !Array.isArray(value.partnerDescriptions)
    || !Array.isArray(value.candidateEvidence) || !Array.isArray(value.partnerEvidence)) invalid('Évaluations de descriptions absentes.');
  value.candidateDescriptions.forEach((description: unknown) => {
    assertDescription(description, 'Évaluation.description candidate');
    if (!candidateDescriptions.some(source => sameJson(source, description))) invalid('Description candidate hors du snapshot exact de matière.');
  });
  value.partnerDescriptions.forEach((description: unknown) => {
    assertDescription(description, 'Évaluation.description partenaire');
    if (!allowedPartnerDescriptions.some(source => sameJson(source, description))) invalid('Description partenaire hors du snapshot exact.');
  });
  value.candidateEvidence.forEach((row: unknown) => assertEvidenceDescriptor(row, 'candidate', value.candidateDescriptions, corpus));
  value.partnerEvidence.forEach((row: unknown) => assertEvidenceDescriptor(row, 'partner', value.partnerDescriptions, corpus));
  assertStringArray(value.familyIds, 'Évaluation.familyIds'); assertStringArray(value.sharedFamilyIds, 'Évaluation.sharedFamilyIds');
  if (value.sharedFamilyIds.some((id: string) => !value.familyIds.includes(id))) invalid('Famille partagée absente des familles évaluées.');
  if ([...value.candidateEvidence, ...value.partnerEvidence].some((row: HopIntentDescriptorEvidence) => !value.familyIds.includes(row.familyId))) {
    invalid('Famille de descripteur absente des familles évaluées.');
  }
  if (value.sharedFamilyIds.some((id: string) => !value.candidateEvidence.some((row: HopIntentDescriptorEvidence) => row.familyId === id)
    || !value.partnerEvidence.some((row: HopIntentDescriptorEvidence) => row.familyId === id))) {
    invalid('Famille partagée sans descripteur des deux côtés.');
  }
  assertStringArray(value.missingInformation, 'Évaluation.missingInformation');
  assertText(value.consequence, 'Évaluation.consequence'); assertText(value.reason, 'Évaluation.reason');
  const hasMappedDescriptors = value.candidateEvidence.length > 0 || value.partnerEvidence.length > 0;
  if (hasMappedDescriptors && !lexicalIntentCompatible(intent)) {
    invalid('Évaluation lexicale V1 utilisée pour une intention V2 sémantiquement incompatible.');
  }
  if (hasMappedDescriptors && !intent.familyId) invalid('Un mapping lexical exige une famille explicitement résolue.');
  if (!intent.familyId && !hasMappedDescriptors && !['unknown', 'notApplicable'].includes(value.status)) {
    invalid('Sans famille résolue, une évaluation de description reste inconnue ou non applicable.');
  }
  if (hasMappedDescriptors && [...value.candidateEvidence, ...value.partnerEvidence].some((row: HopIntentDescriptorEvidence) => row.familyId !== intent.familyId)) {
    invalid('Évaluation lexicale liée à une famille différente de l’intention exacte.');
  }
}

function assertCandidateAssessments(value: unknown, request: PropertyAdviceRequestData, corpus: HopDocumentaryCorpus): asserts value is HopPropertyAdviceCandidateAssessment[] {
  if (!Array.isArray(value)) invalid('Évaluations de candidats absentes.');
  const assessments = value as HopPropertyAdviceCandidateAssessment[];
  assertUniqueBy(assessments, row => row.materialId, 'Évaluations de candidats');
  assertSet(assessments.map(row => row.materialId), new Set(request.candidatePolicy.materialIds), 'Périmètre candidat');
  for (const assessment of assessments) {
    if (!isRow(assessment)) invalid('Évaluation de candidat invalide.');
    onlyKeys(assessment, ['materialId', 'status', 'recordKeys', 'reasons', 'evaluations'], 'Évaluation de candidat');
    assertText(assessment.materialId, 'Évaluation.materialId');
    if (!['documented', 'notLoaded', 'unqualified'].includes(assessment.status)) invalid('Statut de candidat inconnu.');
    assertStringArray(assessment.recordKeys, 'Évaluation.recordKeys'); assertStringArray(assessment.reasons, 'Évaluation.reasons');
    if (!Array.isArray(assessment.evaluations)) invalid('Évaluations par intention absentes.');
    const material = request.materials.find(row => row.id === assessment.materialId);
    if (!material) {
      if (assessment.status !== 'notLoaded' || assessment.evaluations.length || assessment.reasons.length === 0) {
        invalid('Une matière non chargée garde une lacune locale et ne reçoit ni preuve ni évaluation.');
      }
      continue;
    }
    if (assessment.status === 'notLoaded') invalid('Une matière du snapshot ne peut être marquée non chargée.');
    assertUniqueBy(assessment.evaluations, row => row.intentId, 'Évaluations par intention');
    const compatibleIntentIds = new Set(request.propertyIntents.filter(lexicalIntentCompatible).map(row => row.id));
    assertSet(assessment.evaluations.map(row => row.intentId), compatibleIntentIds, 'Évaluations lexicales par intention compatible');
    for (const evaluation of assessment.evaluations) {
      const intent = request.propertyIntents.find(row => row.id === evaluation.intentId)!;
      assertCandidateEvaluation(evaluation, intent, material, request, corpus);
    }
    if (assessment.status === 'documented'
      && !assessment.evaluations.some(row => row.candidateEvidence.length > 0 || row.candidateDescriptions.length > 0)) {
      invalid('Le statut documented exige une description source réellement archivée.');
    }
  }
}

function assertArgument(value: unknown, request: PropertyAdviceRequestData, corpus: HopDocumentaryCorpus,
  assessments: readonly HopPropertyAdviceCandidateAssessment[]): asserts value is HopPropertyAdviceArgument {
  if (!isRow(value)) invalid('Argument V2 absent.');
  onlyKeys(value, ['id', 'kind', 'text', 'intentIds', 'assertionIds', 'claimIds', 'materialEvidence'], 'Argument V2');
  assertText(value.id, 'Argument.id'); assertText(value.text, 'Argument.text');
  const kinds: readonly HopPropertyAdviceArgumentKind[] = ['userTarget', 'userQuestion', 'userObservation', 'userMeasurement',
    'userPreference', 'userConstraint', 'proposedReading', 'documentaryFact', 'adviceInference', 'trialHypothesis'];
  if (!kinds.includes(value.kind)) invalid('Type d’argument inconnu.');
  const intentIds = new Set<string>(request.propertyIntents.map(row => row.id));
  const assertionIds = new Set<string>(request.context.assertions.map(row => row.id));
  const claimIds = new Set<string>(corpus.claims.map(row => row.id));
  assertReferences(value.intentIds, intentIds, 'Argument.intentIds', false);
  assertReferences(value.assertionIds, assertionIds, 'Argument.assertionIds');
  assertReferences(value.claimIds, claimIds, 'Argument.claimIds');
  if (!Array.isArray(value.materialEvidence)) invalid('Argument.materialEvidence absent.');
  const expectedRole: Partial<Record<HopPropertyAdviceArgumentKind, HopPropertyAdviceRole>> = {
    userTarget: 'target', userQuestion: 'investigation', userObservation: 'reportedObservation',
    userMeasurement: 'measurement', userPreference: 'preference', userConstraint: 'constraint',
  };
  const linkedIntents = request.propertyIntents.filter(intent => value.intentIds.includes(intent.id));
  if (expectedRole[value.kind] && linkedIntents.some(intent => intent.role !== expectedRole[value.kind])) {
    invalid(`Argument ${value.kind} relié à un rôle d’intention différent.`);
  }
  if (value.kind === 'userMeasurement') {
    const expectedMeasurementIds = linkedIntents.filter(intent => intent.role === 'measurement')
      .flatMap(intent => intent.comparisonBasis.assertionIds);
    if (!expectedMeasurementIds.length || new Set(expectedMeasurementIds).size !== expectedMeasurementIds.length
      || value.assertionIds.length !== expectedMeasurementIds.length
      || expectedMeasurementIds.some(id => !value.assertionIds.includes(id))) {
      invalid('Argument userMeasurement doit référencer exactement les faits mesurés de ses intentions.');
    }
  }
  if (value.kind === 'proposedReading' && !linkedIntents.some(intent => intent.interpretationOrigin === 'proposal')) {
    invalid('Une proposition d’interprétation doit référencer une intention explicitement proposée.');
  }
  if (value.kind === 'documentaryFact' && value.claimIds.length === 0 && value.materialEvidence.length === 0) {
    invalid('Un argument documentaire exige un claim ou une preuve de candidat.');
  }
  if (value.kind === 'trialHypothesis' && value.claimIds.length === 0 && value.assertionIds.length === 0 && value.materialEvidence.length === 0) {
    invalid('Une hypothèse d’essai doit référencer ses prémisses.');
  }
  for (const evidence of value.materialEvidence) {
    if (!isRow(evidence)) invalid('Preuve matière d’argument invalide.');
    onlyKeys(evidence, ['materialId', 'intentId', 'evaluation'], 'Preuve matière d’argument');
    assertText(evidence.materialId, 'Preuve.materialId'); assertText(evidence.intentId, 'Preuve.intentId');
    if (!value.intentIds.includes(evidence.intentId)) invalid('Preuve matière liée à une intention absente de l’argument.');
    const assessment = assessments.find(row => row.materialId === evidence.materialId);
    const saved = assessment?.evaluations.find(row => row.intentId === evidence.intentId);
    if (!saved || !sameJson(evidence.evaluation, saved)) invalid('Preuve matière différente de son assessment archivé.');
  }
}

function assertStrategy(value: unknown, request: PropertyAdviceRequestData, corpus: HopDocumentaryCorpus,
  inputReference: string, argumentIds: ReadonlySet<string>, candidateIds: ReadonlySet<string>,
  strategyReference: (inputReference: string, strategy: Omit<HopPropertyAdviceStrategy, 'reference'> | HopPropertyAdviceStrategy) => string): asserts value is HopPropertyAdviceStrategy {
  if (!isRow(value) || !nonempty(value.reference)) invalid('Stratégie sans snapshot ou référence.');
  onlyKeys(value, ['id', 'kind', 'contribution', 'title', 'purpose', 'distinctiveReason', 'scope', 'intervention', 'argumentIds',
    'candidateIds', 'documentaryProductRefs', 'effects', 'tradeoffs', 'nextSteps', 'applicability', 'preparation', 'reference'], 'Stratégie V2');
  assertText(value.id, 'Stratégie.id'); assertText(value.kind, 'Stratégie.kind');
  if (!['option', 'investigation', 'characterization'].includes(value.contribution)) invalid('Contribution stratégique inconnue.');
  assertText(value.title, 'Stratégie.title'); assertText(value.purpose, 'Stratégie.purpose'); assertText(value.distinctiveReason, 'Stratégie.distinctiveReason');
  if (!scopeValues.includes(value.scope) || !interventionValues.includes(value.intervention)) invalid('Portée ou intervention stratégique inconnue.');
  assertReferences(value.argumentIds, argumentIds, 'Stratégie.argumentIds', false);
  assertReferences(value.candidateIds, candidateIds, 'Stratégie.candidateIds');
  if (!Array.isArray(value.documentaryProductRefs)) invalid('Références documentaires de stratégie absentes.');
  for (const product of value.documentaryProductRefs) {
    if (!isRow(product)) invalid('Produit documentaire stratégique invalide.');
    onlyKeys(product, ['id', 'name', 'claimIds'], 'Produit documentaire stratégique');
    assertText(product.id, 'Produit.id'); assertText(product.name, 'Produit.name');
    assertReferences(product.claimIds, new Set(corpus.claims.map(row => row.id)), 'Produit.claimIds', false);
  }
  assertUniqueIds(value.documentaryProductRefs, 'Produits documentaires de stratégie');

  const intentIds = new Set<string>(request.propertyIntents.map(row => row.id));
  if (!Array.isArray(value.effects)) invalid('Effets de stratégie absents.');
  assertUniqueBy(value.effects, (row: { intentId: string }) => row.intentId, 'Effets de stratégie');
  assertSet(value.effects.map((row: HopPropertyAdviceEffect) => row.intentId), intentIds, 'Effets par intention');
  const effectStatuses: readonly HopPropertyAdviceEffectStatus[] = ['boundedSupport', 'tension', 'structuralGuard', 'hypothesis', 'unresolved', 'notApplicable'];
  for (const effect of value.effects) {
    if (!isRow(effect)) invalid('Effet de stratégie invalide.');
    onlyKeys(effect, ['intentId', 'status', 'text', 'argumentIds'], 'Effet de stratégie');
    assertText(effect.text, 'Effet.text');
    if (!effectStatuses.includes(effect.status)) invalid('Statut d’effet inconnu.');
    assertReferences(effect.argumentIds, argumentIds, 'Effet.argumentIds', false);
  }
  if (!Array.isArray(value.tradeoffs)) invalid('Compromis de stratégie absents.');
  for (const tradeoff of value.tradeoffs) {
    if (!isRow(tradeoff)) invalid('Compromis invalide.');
    onlyKeys(tradeoff, ['text', 'intentIds', 'argumentIds'], 'Compromis');
    assertText(tradeoff.text, 'Compromis.text'); assertReferences(tradeoff.intentIds, intentIds, 'Compromis.intentIds', false);
    assertReferences(tradeoff.argumentIds, argumentIds, 'Compromis.argumentIds', false);
  }
  if (!Array.isArray(value.nextSteps)) invalid('Prochaines étapes absentes.');
  for (const step of value.nextSteps) {
    if (!isRow(step)) invalid('Étape suivante invalide.');
    onlyKeys(step, ['kind', 'text', 'argumentIds'], 'Étape suivante');
    if (!['document', 'compare', 'qualify', 'futurePlan'].includes(step.kind)) invalid('Type d’étape suivante inconnu.');
    assertText(step.text, 'Étape.text'); assertReferences(step.argumentIds, argumentIds, 'Étape.argumentIds', false);
  }

  if (!isRow(value.applicability)) invalid('Applicabilité de stratégie absente.');
  onlyKeys(value.applicability, ['status', 'conditions'], 'Applicabilité');
  if (!['conditionsMet', 'missingConditions', 'incompatible', 'notEvaluated'].includes(value.applicability.status)
    || !Array.isArray(value.applicability.conditions)) invalid('Applicabilité ou conditions inconnues.');
  const assertionIds = new Set<string>(request.context.assertions.map(row => row.id));
  assertUniqueIds(value.applicability.conditions, 'Conditions de stratégie');
  for (const condition of value.applicability.conditions) {
    if (!isRow(condition)) invalid('Condition de stratégie invalide.');
    onlyKeys(condition, ['id', 'state', 'description', 'assertionIds', 'intentIds'], 'Condition');
    assertText(condition.id, 'Condition.id'); assertText(condition.description, 'Condition.description');
    if (!['met', 'unmet', 'unknown'].includes(condition.state)) invalid('État de condition inconnu.');
    assertReferences(condition.assertionIds, assertionIds, 'Condition.assertionIds');
    assertReferences(condition.intentIds, intentIds, 'Condition.intentIds');
  }
  const states = value.applicability.conditions.map((row: HopPropertyAdviceCondition) => row.state);
  if (value.applicability.status === 'conditionsMet' && (!states.length || states.some((state: string) => state !== 'met'))
    || value.applicability.status === 'incompatible' && !states.includes('unmet')
    || value.applicability.status === 'missingConditions' && (!states.includes('unknown') || states.includes('unmet'))
    || value.applicability.status === 'notEvaluated' && states.length > 0) invalid('Statut d’applicabilité incohérent avec ses conditions.');
  assertPreparation(value.preparation);
  if (strategyReference(inputReference, value as HopPropertyAdviceStrategy) !== value.reference) {
    invalid('Référence de stratégie périmée ou altérée.');
  }
}

interface PropertyAdviceAnswerValidation {
  format: string;
  label: string;
  assertRequest: (value: unknown) => void;
  inputReference: (request: PropertyAdviceRequestData, corpus: HopDocumentaryCorpus) => string;
  interpretationReference: (request: PropertyAdviceRequestData) => string;
  strategyReference: (inputReference: string, strategy: Omit<HopPropertyAdviceStrategy, 'reference'> | HopPropertyAdviceStrategy) => string;
  answerReference: (answer: unknown) => string;
}

function assertPropertyAdviceAnswerStructure(value: unknown, contract: PropertyAdviceAnswerValidation): void {
  if (!isRow(value) || value.format !== contract.format || !nonempty(value.reference)) invalid(`Réponse ${contract.label} ou référence absente.`);
  assertSerializable(value, `Réponse ${contract.label}`);
  onlyKeys(value, ['format', 'requestSnapshot', 'corpusSnapshot', 'rulesVersion', 'inputReference', 'interpretationReference',
    'coverage', 'body', 'arguments', 'candidateAssessments', 'strategies', 'limits', 'reference'], 'Réponse V2');
  contract.assertRequest(value.requestSnapshot);
  assertHopDocumentaryCorpus(value.corpusSnapshot);
  assertText(value.rulesVersion, 'Réponse.rulesVersion');
  const request = value.requestSnapshot as PropertyAdviceRequestData;
  const corpus = value.corpusSnapshot as HopDocumentaryCorpus;
  const inputReference = contract.inputReference(request, corpus);
  if (value.inputReference !== inputReference) invalid('Réponse liée à un autre snapshot de requête ou corpus.');
  const interpretationReference = contract.interpretationReference(request);
  if (value.interpretationReference !== interpretationReference) invalid('Réponse liée à une autre interprétation.');

  if (!isRow(value.coverage)) invalid('Couverture V2 absente.');
  onlyKeys(value.coverage, ['status', 'points'], 'Couverture V2');
  if (!['answered', 'partial', 'outOfScope'].includes(value.coverage.status) || !Array.isArray(value.coverage.points)) invalid('Statut ou points de couverture inconnus.');
  const intentIds = new Set<string>(request.propertyIntents.map(row => row.id));
  assertUniqueBy(value.coverage.points, (row: { intentId: string }) => row.intentId, 'Points de couverture');
  assertSet(value.coverage.points.map((row: { intentId: string }) => row.intentId), intentIds, 'Points par intention');
  if (!Array.isArray(value.arguments) || !Array.isArray(value.body) || !Array.isArray(value.strategies)) invalid('Corps, arguments ou stratégies absents.');
  assertCandidateAssessments(value.candidateAssessments, request, corpus);
  const assessments = value.candidateAssessments as HopPropertyAdviceCandidateAssessment[];
  value.arguments.forEach((argument: unknown) => assertArgument(argument, request, corpus, assessments));
  assertUniqueIds(value.arguments, 'Arguments V2');
  const argumentIds = new Set<string>(value.arguments.map((argument: HopPropertyAdviceArgument) => argument.id));
  const candidateIds = new Set<string>(request.candidatePolicy.materialIds);
  value.strategies.forEach((strategy: unknown) => assertStrategy(strategy, request, corpus, inputReference, argumentIds, candidateIds, contract.strategyReference));
  assertUniqueIds(value.strategies, 'Stratégies V2');
  const strategyIds = new Set<string>(value.strategies.map((strategy: HopPropertyAdviceStrategy) => strategy.id));
  for (const point of value.coverage.points) {
    if (!isRow(point)) invalid('Point de couverture invalide.');
    onlyKeys(point, ['intentId', 'status', 'reason', 'argumentIds', 'strategyIds'], 'Point de couverture');
    assertText(point.intentId, 'Point.intentId'); assertText(point.reason, 'Point.reason');
    if (!['answered', 'partial', 'unresolved', 'contextOnly'].includes(point.status)) invalid('Statut de point de couverture inconnu.');
    assertReferences(point.argumentIds, argumentIds, 'Point.argumentIds');
    assertReferences(point.strategyIds, strategyIds, 'Point.strategyIds');
    const intent = request.propertyIntents.find(row => row.id === point.intentId)!;
    if (point.status === 'contextOnly' && !['reportedObservation', 'measurement'].includes(intent.role)) {
      invalid('Seule une observation/mesure de contexte peut rester contextOnly.');
    }
    if (['reportedObservation', 'measurement'].includes(intent.role) && point.status !== 'contextOnly') {
      invalid('Une observation/mesure rapportée reste contextOnly; une question qui la concerne doit avoir sa propre intention.');
    }
    if (['answered', 'partial'].includes(point.status) && point.argumentIds.length === 0) {
      invalid('Un point substantiel exige un argument direct.');
    }
    for (const strategyId of point.strategyIds) {
      const strategy = value.strategies.find((row: HopPropertyAdviceStrategy) => row.id === strategyId)!;
      if (!strategy.effects.some((effect: HopPropertyAdviceEffect) => effect.intentId === point.intentId)) invalid('Stratégie reliée à un point sans effet correspondant.');
    }
  }
  const substantive = value.coverage.points.some((point: { status: HopPropertyAdvicePointStatus }) => point.status === 'answered' || point.status === 'partial');
  const requiredIntents = request.propertyIntents.filter(row => row.required
    && !['reportedObservation', 'measurement'].includes(row.role));
  const pointByIntent = new Map<string, { status: HopPropertyAdvicePointStatus }>(value.coverage.points.map((row: { intentId: string; status: HopPropertyAdvicePointStatus }) => [row.intentId, row]));
  const requiredGap = requiredIntents.some(intent => pointByIntent.get(intent.id)?.status !== 'answered');
  if (value.coverage.status === 'outOfScope' && substantive) invalid('outOfScope malgré une intention substantiellement traitée.');
  if (value.coverage.status === 'partial' && (!substantive || !requiredGap)) invalid('partial exige une réponse substantielle et une intention requise incomplète.');
  if (value.coverage.status === 'answered' && (!substantive || requiredGap)) invalid('answered malgré une intention requise non répondue.');

  for (const block of value.body) {
    if (!isRow(block)) invalid('Bloc de réponse invalide.');
    onlyKeys(block, ['id', 'text', 'argumentIds'], 'Bloc de réponse');
    assertText(block.id, 'Bloc.id'); assertText(block.text, 'Bloc.text');
    assertReferences(block.argumentIds, argumentIds, 'Bloc.argumentIds');
  }
  assertUniqueIds(value.body, 'Blocs de réponse');
  if (!value.body.length) invalid('La réponse V2 doit conserver un corps utile ou explicatif.');
  assertStringArray(value.limits, 'Limites V2');
  const referencedArguments = new Set<string>([
    ...value.body.flatMap((block: { argumentIds: string[] }) => block.argumentIds),
    ...value.coverage.points.flatMap((point: { argumentIds: string[] }) => point.argumentIds),
    ...value.strategies.flatMap((strategy: HopPropertyAdviceStrategy) => [
      ...strategy.argumentIds, ...strategy.effects.flatMap(effect => effect.argumentIds),
      ...strategy.tradeoffs.flatMap(row => row.argumentIds), ...strategy.nextSteps.flatMap(row => row.argumentIds),
    ]),
  ]);
  if (value.arguments.some((argument: HopPropertyAdviceArgument) => !referencedArguments.has(argument.id))) invalid('Argument orphelin dans la réponse V2.');
  if (value.strategies.some((strategy: HopPropertyAdviceStrategy) => !value.coverage.points.some((point: { strategyIds: string[] }) => point.strategyIds.includes(strategy.id)))) {
    invalid('Stratégie orpheline de toute intention.');
  }
  if (contract.answerReference(value) !== value.reference) invalid(`Référence de réponse ${contract.label} altérée.`);
}

function assertHopPropertyAdviceAnswerWithMode(value: unknown, measurementMode: MeasurementValidationMode): asserts value is HopPropertyAdviceAnswer {
  assertPropertyAdviceAnswerStructure(value, {
    format: HOP_PROPERTY_ADVICE_ANSWER_VERSION, label: 'V2',
    assertRequest: request => assertHopPropertyAdviceRequestWithMode(request, measurementMode),
    inputReference: (request, corpus) => rawHopPropertyAdviceInputReference(request as HopPropertyAdviceRequest, corpus),
    interpretationReference: request => rawHopPropertyAdviceInterpretationReference(request as HopPropertyAdviceRequest),
    strategyReference: hopPropertyAdviceStrategyReference,
    answerReference: answer => hopPropertyAdviceAnswerReference(answer as HopPropertyAdviceAnswer),
  });
}

export function assertHopPropertyAdviceAnswer(value: unknown): asserts value is HopPropertyAdviceAnswer {
  assertHopPropertyAdviceAnswerWithMode(value, 'strict');
}

function assertHopPropertyAdviceAnswerV3WithMode(value: unknown,
  metricMode: PerceptualInvestigationMetricMode): asserts value is HopPropertyAdviceAnswerV3 {
  assertPropertyAdviceAnswerStructure(value, {
    format: HOP_PROPERTY_ADVICE_ANSWER_V3_VERSION, label: 'V3',
    assertRequest: request => assertHopPropertyAdviceRequestV3WithMode(request, metricMode),
    inputReference: (request, corpus) => rawHopPropertyAdviceInputReferenceV3(request as HopPropertyAdviceRequestV3, corpus),
    interpretationReference: request => rawHopPropertyAdviceInterpretationReferenceV3(request as HopPropertyAdviceRequestV3),
    strategyReference: hopPropertyAdviceStrategyReferenceV3,
    answerReference: answer => hopPropertyAdviceAnswerReferenceV3(answer as HopPropertyAdviceAnswerV3),
  });
}

export function assertHopPropertyAdviceAnswerV3(value: unknown): asserts value is HopPropertyAdviceAnswerV3 {
  assertHopPropertyAdviceAnswerV3WithMode(value, 'strict');
}

function validInstant(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

interface PropertyAdviceDossierValidation {
  format: string;
  label: string;
  assertAnswer: (value: unknown) => void;
  strategyReference: (inputReference: string, strategy: Omit<HopPropertyAdviceStrategy, 'reference'> | HopPropertyAdviceStrategy) => string;
  dossierReference: (dossier: unknown) => string;
}

function assertPropertyAdviceDossierStructure(value: unknown, contract: PropertyAdviceDossierValidation): void {
  if (!isRow(value) || value.format !== contract.format || !nonempty(value.reference)) invalid(`Dossier ${contract.label} invalide.`);
  assertSerializable(value, `Dossier ${contract.label}`);
  onlyKeys(value, ['format', 'id', 'answerSnapshot', 'answerReference', 'interpretationReference', 'strategyId', 'strategySnapshot',
    'strategyReference', 'motive', 'createdAt', 'createdBy', 'preparation', 'reference'], 'Dossier V2');
  assertText(value.id, 'Dossier.id'); contract.assertAnswer(value.answerSnapshot);
  if (value.answerReference !== value.answerSnapshot.reference || value.interpretationReference !== value.answerSnapshot.interpretationReference) {
    invalid('Dossier lié à une réponse ou interprétation différente.');
  }
  assertText(value.strategyId, 'Dossier.strategyId'); assertText(value.strategyReference, 'Dossier.strategyReference');
  const strategy = value.answerSnapshot.strategies.find((row: HopPropertyAdviceStrategy) => row.id === value.strategyId);
  if (!strategy || strategy.reference !== value.strategyReference || !sameJson(strategy, value.strategySnapshot)) invalid('Dossier lié à une stratégie absente ou modifiée.');
  if (contract.strategyReference(value.answerSnapshot.inputReference, value.strategySnapshot) !== value.strategyReference) {
    invalid('Référence de stratégie du dossier altérée.');
  }
  assertText(value.motive, 'Dossier.motive');
  if (!validInstant(value.createdAt)) invalid('Dossier.createdAt invalide.');
  if (!isRow(value.createdBy)) invalid('Dossier.createdBy absent.');
  onlyKeys(value.createdBy, ['origin', 'label'], 'Dossier.createdBy');
  if (!['user', 'proposal', 'fixture'].includes(value.createdBy.origin)) invalid('Origine d’auteur du dossier inconnue.');
  assertText(value.createdBy.label, 'Dossier.createdBy.label');
  assertPreparation(value.preparation);
  if (!sameJson(value.preparation, strategy.preparation)) invalid('Préparation du dossier différente de la stratégie sélectionnée.');
  if (contract.dossierReference(value) !== value.reference) invalid(`Référence de dossier ${contract.label} altérée.`);
}

function assertHopPropertyAdviceDossierWithMode(value: unknown, measurementMode: MeasurementValidationMode): asserts value is HopPropertyAdviceDossier {
  assertPropertyAdviceDossierStructure(value, {
    format: HOP_PROPERTY_ADVICE_DOSSIER_VERSION, label: 'V2',
    assertAnswer: answer => assertHopPropertyAdviceAnswerWithMode(answer, measurementMode),
    strategyReference: hopPropertyAdviceStrategyReference,
    dossierReference: dossier => hopPropertyAdviceDossierReference(dossier as HopPropertyAdviceDossier),
  });
}

export function assertHopPropertyAdviceDossier(value: unknown): asserts value is HopPropertyAdviceDossier {
  assertHopPropertyAdviceDossierWithMode(value, 'strict');
}

function assertHopPropertyAdviceDossierV3WithMode(value: unknown,
  metricMode: PerceptualInvestigationMetricMode): asserts value is HopPropertyAdviceDossierV3 {
  assertPropertyAdviceDossierStructure(value, {
    format: HOP_PROPERTY_ADVICE_DOSSIER_V3_VERSION, label: 'V3',
    assertAnswer: answer => assertHopPropertyAdviceAnswerV3WithMode(answer, metricMode),
    strategyReference: hopPropertyAdviceStrategyReferenceV3,
    dossierReference: dossier => hopPropertyAdviceDossierReferenceV3(dossier as HopPropertyAdviceDossierV3),
  });
}

export function assertHopPropertyAdviceDossierV3(value: unknown): asserts value is HopPropertyAdviceDossierV3 {
  assertHopPropertyAdviceDossierV3WithMode(value, 'strict');
}

export function createHopPropertyAdviceDossier(input: CreateHopPropertyAdviceDossierInput): HopPropertyAdviceDossier {
  assertHopPropertyAdviceAnswer(input.answer);
  assertText(input.id, 'Dossier.id'); assertText(input.motive, 'Dossier.motive');
  if (input.expectedAnswerReference !== input.answer.reference) invalid('La réponse a changé; le choix du dossier est périmé.');
  if (input.expectedInterpretationReference !== input.answer.interpretationReference) invalid('L’interprétation du dossier est périmée.');
  const strategy = input.answer.strategies.find(row => row.id === input.strategyId);
  if (!strategy || strategy.reference !== input.expectedStrategyReference) invalid('La stratégie sélectionnée est absente ou périmée.');
  if (!validInstant(input.createdAt)) invalid('Dossier.createdAt invalide.');
  if (!input.createdBy || !['user', 'proposal', 'fixture'].includes(input.createdBy.origin)) invalid('Origine d’auteur du dossier inconnue.');
  assertText(input.createdBy.label, 'Dossier.createdBy.label');
  const body: Omit<HopPropertyAdviceDossier, 'reference'> = {
    format: HOP_PROPERTY_ADVICE_DOSSIER_VERSION, id: input.id,
    answerSnapshot: structuredClone(input.answer), answerReference: input.answer.reference,
    interpretationReference: input.answer.interpretationReference,
    strategyId: strategy.id, strategySnapshot: structuredClone(strategy), strategyReference: strategy.reference,
    motive: input.motive, createdAt: input.createdAt, createdBy: structuredClone(input.createdBy),
    preparation: structuredClone(strategy.preparation),
  };
  const dossier = { ...body, reference: hopPropertyAdviceDossierReference(body) };
  assertHopPropertyAdviceDossier(dossier);
  return structuredClone(dossier);
}

export function createHopPropertyAdviceDossierV3(input: CreateHopPropertyAdviceDossierV3Input): HopPropertyAdviceDossierV3 {
  assertHopPropertyAdviceAnswerV3(input.answer);
  assertText(input.id, 'DossierV3.id'); assertText(input.motive, 'DossierV3.motive');
  if (input.expectedAnswerReference !== input.answer.reference) invalid('La réponse V3 a changé; le choix du dossier est périmé.');
  if (input.expectedInterpretationReference !== input.answer.interpretationReference) invalid('L’interprétation V3 du dossier est périmée.');
  const strategy = input.answer.strategies.find(row => row.id === input.strategyId);
  if (!strategy || strategy.reference !== input.expectedStrategyReference) invalid('La stratégie V3 sélectionnée est absente ou périmée.');
  if (!validInstant(input.createdAt)) invalid('DossierV3.createdAt invalide.');
  if (!input.createdBy || !['user', 'proposal', 'fixture'].includes(input.createdBy.origin)) invalid('Origine d’auteur du dossier V3 inconnue.');
  assertText(input.createdBy.label, 'DossierV3.createdBy.label');
  const body: Omit<HopPropertyAdviceDossierV3, 'reference'> = {
    format: HOP_PROPERTY_ADVICE_DOSSIER_V3_VERSION, id: input.id,
    answerSnapshot: structuredClone(input.answer), answerReference: input.answer.reference,
    interpretationReference: input.answer.interpretationReference,
    strategyId: strategy.id, strategySnapshot: structuredClone(strategy), strategyReference: strategy.reference,
    motive: input.motive, createdAt: input.createdAt, createdBy: structuredClone(input.createdBy),
    preparation: structuredClone(strategy.preparation),
  };
  const dossier: HopPropertyAdviceDossierV3 = { ...body, reference: hopPropertyAdviceDossierReferenceV3(body) };
  assertHopPropertyAdviceDossierV3(dossier);
  return structuredClone(dossier);
}

export function readHopPropertyAdviceAnswer(value: unknown): HopPropertyAdviceAnswerReadResult {
  if (isRow(value) && value.format === HOP_PROPERTY_ADVICE_ANSWER_VERSION) {
    const requestFormat = value.requestSnapshot?.format;
    if (typeof requestFormat === 'string' && requestFormat.startsWith('hop-documentary-request-')
      && requestFormat !== HOP_PROPERTY_ADVICE_REQUEST_VERSION) {
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format de requête imbriquée futur conservé sans recalcul.' };
    }
    const corpusFormat = value.corpusSnapshot?.format;
    if (typeof corpusFormat === 'string' && corpusFormat.startsWith('hop-documentary-corpus-')
      && corpusFormat !== 'hop-documentary-corpus-v1') {
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format de corpus imbriqué futur conservé sans recalcul.' };
    }
    try {
      assertHopPropertyAdviceAnswer(value);
    } catch (error) {
      if (error instanceof UnqualifiedMeasurementSnapshotError) {
        // Suspend only the new metric/unit predicate for known V2 archives; all old structural checks and hashes still run.
        assertHopPropertyAdviceAnswerWithMode(value, 'legacyV2');
        return { status: 'unsupportedReadOnly', snapshot: structuredClone(value),
          reason: `Snapshot V2 conservé sans interprétation : ${error.message}` };
      }
      throw error;
    }
    return { status: 'readOnly', answer: structuredClone(value) };
  }
  const legacy = readHopDocumentaryAnswer(value);
  return legacy.status === 'readOnly'
    ? { status: 'legacyReadOnly', answer: legacy.answer }
    : { status: 'unsupportedReadOnly', snapshot: structuredClone(legacy.snapshot), reason: legacy.reason };
}

export function readHopPropertyAdviceDossier(value: unknown): HopPropertyAdviceDossierReadResult {
  if (isRow(value) && value.format === HOP_PROPERTY_ADVICE_DOSSIER_VERSION) {
    const answerFormat = value.answerSnapshot?.format;
    if (typeof answerFormat === 'string' && answerFormat.startsWith('hop-documentary-answer-')
      && answerFormat !== HOP_PROPERTY_ADVICE_ANSWER_VERSION) {
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Réponse imbriquée future conservée sans recalcul.' };
    }
    try {
      assertHopPropertyAdviceDossier(value);
    } catch (error) {
      if (error instanceof UnqualifiedMeasurementSnapshotError) {
        // Validate the old measurement shape and the complete answer/dossier bindings before returning raw RO.
        assertHopPropertyAdviceDossierWithMode(value, 'legacyV2');
        return { status: 'unsupportedReadOnly', snapshot: structuredClone(value),
          reason: `Dossier V2 conservé sans interprétation : ${error.message}` };
      }
      throw error;
    }
    return { status: 'readOnly', dossier: structuredClone(value) };
  }
  const legacy = readHopDocumentaryDossier(value);
  return legacy.status === 'readOnly'
    ? { status: 'legacyReadOnly', dossier: legacy.dossier }
    : { status: 'unsupportedReadOnly', snapshot: structuredClone(legacy.snapshot), reason: legacy.reason };
}

export function readHopPropertyAdviceAnswerV3(value: unknown): HopPropertyAdviceAnswerV3ReadResult {
  if (isRow(value) && value.format === HOP_PROPERTY_ADVICE_ANSWER_V3_VERSION) {
    const requestFormat = value.requestSnapshot?.format;
    const knownRequestFormats = [HOP_DOCUMENTARY_REQUEST_VERSION, HOP_PROPERTY_ADVICE_REQUEST_VERSION, HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION];
    if (typeof requestFormat === 'string' && requestFormat.startsWith('hop-documentary-request-')
      && !knownRequestFormats.includes(requestFormat as typeof knownRequestFormats[number])) {
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format futur de requête imbriquée conservé sans recalcul.' };
    }
    if (requestFormat !== HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION) {
      invalid('Une réponse V3 doit contenir une requête V3; les versions V1/V2 imbriquées sont incompatibles.');
    }
    const corpusFormat = value.corpusSnapshot?.format;
    if (typeof corpusFormat === 'string' && corpusFormat.startsWith('hop-documentary-corpus-')
      && corpusFormat !== 'hop-documentary-corpus-v1') {
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format de corpus imbriqué futur conservé sans recalcul.' };
    }
    try {
      assertHopPropertyAdviceAnswerV3(value);
    } catch (error) {
      if (!(error instanceof UnqualifiedPerceptualInvestigationMetricSnapshotError)) throw error;
      // Revalidate every known V3 structure, relation, corpus and hash. Only the added investigation metric predicate is suspended.
      assertHopPropertyAdviceAnswerV3WithMode(value, 'capturedHistoricalV3');
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value),
        reason: `Réponse V3 historique conservée sans interprétation : ${error.message}` };
    }
    return { status: 'readOnly', answer: structuredClone(value) };
  }
  const legacy = readHopPropertyAdviceAnswer(value);
  if (legacy.status === 'unsupportedReadOnly') return legacy;
  return legacy.status === 'legacyReadOnly'
    ? { status: 'legacyReadOnly', version: 'v1', answer: legacy.answer }
    : { status: 'legacyReadOnly', version: 'v2', answer: legacy.answer };
}

export function readHopPropertyAdviceDossierV3(value: unknown): HopPropertyAdviceDossierV3ReadResult {
  if (isRow(value) && value.format === HOP_PROPERTY_ADVICE_DOSSIER_V3_VERSION) {
    const answerFormat = value.answerSnapshot?.format;
    const knownAnswerFormats = [HOP_DOCUMENTARY_ANSWER_VERSION, HOP_PROPERTY_ADVICE_ANSWER_VERSION, HOP_PROPERTY_ADVICE_ANSWER_V3_VERSION];
    if (typeof answerFormat === 'string' && answerFormat.startsWith('hop-documentary-answer-')
      && !knownAnswerFormats.includes(answerFormat as typeof knownAnswerFormats[number])) {
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format futur de réponse imbriquée conservé sans recalcul.' };
    }
    if (answerFormat !== HOP_PROPERTY_ADVICE_ANSWER_V3_VERSION) {
      invalid('Un dossier V3 doit contenir une réponse V3; les versions V1/V2 imbriquées sont incompatibles.');
    }
    const nestedRequestFormat = value.answerSnapshot?.requestSnapshot?.format;
    const knownRequestFormats = [HOP_DOCUMENTARY_REQUEST_VERSION, HOP_PROPERTY_ADVICE_REQUEST_VERSION, HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION];
    if (typeof nestedRequestFormat === 'string' && nestedRequestFormat.startsWith('hop-documentary-request-')
      && !knownRequestFormats.includes(nestedRequestFormat as typeof knownRequestFormats[number])) {
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format futur de requête dans la réponse imbriquée conservé sans recalcul.' };
    }
    if (nestedRequestFormat !== HOP_PROPERTY_ADVICE_REQUEST_V3_VERSION) {
      invalid('Une réponse/dossier V3 ne peut lier une requête V1/V2 connue.');
    }
    const nestedCorpusFormat = value.answerSnapshot?.corpusSnapshot?.format;
    if (typeof nestedCorpusFormat === 'string' && nestedCorpusFormat.startsWith('hop-documentary-corpus-')
      && nestedCorpusFormat !== 'hop-documentary-corpus-v1') {
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format futur de corpus dans la réponse imbriquée conservé sans recalcul.' };
    }
    try {
      assertHopPropertyAdviceDossierV3(value);
    } catch (error) {
      if (!(error instanceof UnqualifiedPerceptualInvestigationMetricSnapshotError)) throw error;
      // Validate the complete answer and dossier binding with only this new V3 metric predicate suspended.
      assertHopPropertyAdviceDossierV3WithMode(value, 'capturedHistoricalV3');
      return { status: 'unsupportedReadOnly', snapshot: structuredClone(value),
        reason: `Dossier V3 historique conservé sans interprétation : ${error.message}` };
    }
    return { status: 'readOnly', dossier: structuredClone(value) };
  }
  const legacy = readHopPropertyAdviceDossier(value);
  if (legacy.status === 'unsupportedReadOnly') return legacy;
  return legacy.status === 'legacyReadOnly'
    ? { status: 'legacyReadOnly', version: 'v1', dossier: legacy.dossier }
    : { status: 'legacyReadOnly', version: 'v2', dossier: legacy.dossier };
}
