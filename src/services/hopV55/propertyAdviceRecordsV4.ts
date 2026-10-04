import {
  assertHopPropertyAdviceAnswerV3,
  assertHopPropertyAdviceDossierV3,
  createHopPropertyAdviceDossierV3,
  hopPropertyAdviceAnswerReferenceV3,
  hopPropertyAdviceDossierReferenceV3,
  readHopPropertyAdviceAnswerV3,
  readHopPropertyAdviceDossierV3,
  type CreateHopPropertyAdviceDossierV3Input,
  type HopPropertyAdviceAnswerV3,
  type HopPropertyAdviceDossierV3,
  type HopPropertyAdviceIntentV3,
} from '../../domain/hopDecision/propertyAdviceSchema';
import { assertHopDocumentaryRequest } from '../../domain/hopDecision/documentaryAnswerSchema';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopV55DecisionReadingSource } from './decisionArchive';
import { readHopV55AdoptedContextBinding,
  type HopV55AdoptedContextBindingV1 } from './adoptedContextResolution';
import { hopV55PropertyAdviceRequestDraftReferenceV3,
  type HopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3';
import { assertHopV55PropertyAdviceCandidatePolicy } from './propertyAdvicePreparation';

export const HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT = 'hop-v55-documentary-answer-record-v4' as const;
export const HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT = 'hop-v55-documentary-dossier-record-v4' as const;
export const HOP_V55_PROPERTY_ADVICE_ANNOTATION_LEDGER_V1_FORMAT = 'hop-v55-property-advice-annotation-ledger-v1' as const;

export type HopV55PropertyAdviceV4Actor = { origin: 'user' | 'proposal' | 'fixture'; label: string };
export type HopV55PropertyAdviceV4TransitionKind = 'create' | 'upgradeV3' | 'revise' | 'reexamine';
export interface HopV55PropertyAdviceV4Transition {
  actId: string;
  kind: HopV55PropertyAdviceV4TransitionKind;
  parentRecordReference?: string;
  parentReadingReference?: string;
  reason: string;
  actor: HopV55PropertyAdviceV4Actor;
  recordedAt: string;
}

export type HopV55PropertyAdviceLedgerDispositionV1 = 'active' | 'rejected';
export type HopV55PropertyAdviceLedgerDecisionKindV1 = 'initialize' | 'add' | 'revise' | 'reject' | 'restore';
export interface HopV55PropertyAdviceLedgerDecisionV1 {
  kind: HopV55PropertyAdviceLedgerDecisionKindV1;
  actId: string;
  reason: string;
  recordedAt: string;
  recordedBy: HopV55PropertyAdviceV4Actor;
  predecessorEntryReference?: string;
}

export interface HopV55PropertyAdviceLedgerEntryV1 {
  entryId: string;
  annotationId: string;
  /** The original annotation, immutable across later active/rejected projections. */
  sourceAnnotation: HopPropertyAdviceIntentV3;
  sourceKind: 'initial' | 'added';
  /** Required only for an explicit annotation addition; remains unchanged in later rows. */
  additionActId?: string;
  sourceQuestionReference?: string;
  disposition: HopV55PropertyAdviceLedgerDispositionV1;
  decision: HopV55PropertyAdviceLedgerDecisionV1;
  /** Present only while this exact annotation is active. */
  activeIntent?: HopPropertyAdviceIntentV3;
  reference: string;
}

export interface HopV55PropertyAdviceAnnotationLedgerV1 {
  format: typeof HOP_V55_PROPERTY_ADVICE_ANNOTATION_LEDGER_V1_FORMAT;
  /** Exact source set (plus additions recorded by an explicit V4 act), not the filtered request. */
  sourceAnnotations: HopPropertyAdviceIntentV3[];
  /** Full immutable history, grouped by annotationId through predecessorEntryReference. */
  entries: HopV55PropertyAdviceLedgerEntryV1[];
  reference: string;
}

export type HopV55PropertyAdviceOutcomeV4 =
  | { kind: 'domainAnswer'; requestDraftReference: string; answerSnapshot: HopPropertyAdviceAnswerV3; answerReference: string }
  | { kind: 'allRejected' };

export interface HopV55PropertyAdvicePreparationV4 {
  preparedReference: string;
  source: HopV55DecisionReadingSource;
  /** Exact adopted NR snapshot; omission is distinct from an adopted `notProvided` culture. */
  cultureBinding?: HopV55AdoptedContextBindingV1;
}

/** Reading provenance retained even when every annotation is rejected. */
export interface HopV55PropertyAdviceV4ReadingContext {
  interpretation: HopPropertyAdviceAnswerV3['requestSnapshot']['interpretation'];
  candidatePolicy: HopPropertyAdviceAnswerV3['requestSnapshot']['candidatePolicy'];
  context: HopPropertyAdviceAnswerV3['requestSnapshot']['context'];
  exclusions: HopPropertyAdviceAnswerV3['requestSnapshot']['exclusions'];
}

export interface HopV55PropertyAdviceAnswerRecordV4 {
  format: typeof HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  originalQuestion: string;
  transition: HopV55PropertyAdviceV4Transition;
  ledger: HopV55PropertyAdviceAnnotationLedgerV1;
  preparation: HopV55PropertyAdvicePreparationV4;
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  outcome: HopV55PropertyAdviceOutcomeV4;
  reference: string;
}

/** Intermediate emitted by V4 preparation. Records owns the final issue and envelope seal. */
export type HopV55PropertyAdviceCorrectionV4Draft = Omit<HopV55PropertyAdviceAnswerRecordV4, 'outcome' | 'reference'>;

export function assertHopV55PropertyAdviceV4ReadingContext(value: unknown, originalQuestion: string): asserts value is HopV55PropertyAdviceV4ReadingContext {
  if (!isRow(value)) throw new Error('readingContext V4 absent.');
  onlyKeys(value, ['interpretation', 'candidatePolicy', 'context', 'exclusions'], 'readingContext V4');
  if (!isRow(value.interpretation) || !isRow(value.context) || !Array.isArray(value.exclusions)) {
    throw new Error('readingContext V4 incomplet.');
  }
  assertHopV55PropertyAdviceCandidatePolicy(value.candidatePolicy as HopPropertyAdviceAnswerV3['requestSnapshot']['candidatePolicy']);
  if (value.interpretation.origin !== 'user' && value.interpretation.origin !== 'proposal') throw new Error('readingContext.interpretation.origin invalide.');
  const validationShell = {
    format: 'hop-documentary-request-v1', id: 'hop-v55-v4-reading-context-validation', originalQuestion,
    interpretation: clone(value.interpretation), criteria: [],
    needs: [{ id: 'hop-v55-v4-reading-context-validation', kind: 'unresolved', criterionIds: [], explanation: 'Validation structurelle temporaire du contexte.' }],
    context: clone(value.context), exclusions: [], materials: [],
  };
  assertHopDocumentaryRequest(validationShell);
  const exclusionIds = new Set<string>();
  for (const exclusion of value.exclusions) {
    if (!isRow(exclusion)) throw new Error('Exclusion de readingContext V4 illisible.');
    onlyKeys(exclusion, ['id', 'intervention', 'certainty', 'intentIds', 'reason'], 'Exclusion readingContext V4');
    if (!text(exclusion.id) || exclusionIds.has(exclusion.id)
      || !['changeBitterness', 'changeAroma', 'involveCulture'].includes(exclusion.intervention)
      || !['certain', 'possible', 'unknown'].includes(exclusion.certainty)
      || !Array.isArray(exclusion.intentIds) || exclusion.intentIds.some((id: unknown) => !text(id))
      || !text(exclusion.reason)) throw new Error('Exclusion de readingContext V4 invalide.');
    if (new Set(exclusion.intentIds).size !== exclusion.intentIds.length) throw new Error('Exclusion V4 avec références dupliquées.');
    exclusionIds.add(exclusion.id);
  }
}

export function createHopV55PropertyAdviceV4ReadingContext(value: HopV55PropertyAdviceV4ReadingContext,
  originalQuestion: string): HopV55PropertyAdviceV4ReadingContext {
  assertHopV55PropertyAdviceV4ReadingContext(value, originalQuestion);
  return clone(value);
}

export function readHopV55PropertyAdviceV4ReadingContext(value: unknown, originalQuestion: string):
  | { status: 'readOnly'; readingContext: HopV55PropertyAdviceV4ReadingContext }
  | { status: 'invalid'; reason: string } {
  try {
    assertHopV55PropertyAdviceV4ReadingContext(value, originalQuestion);
    return { status: 'readOnly', readingContext: clone(value as HopV55PropertyAdviceV4ReadingContext) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'readingContext V4 invalide.' };
  }
}

export interface HopV55PropertyAdviceDossierRecordV4 {
  format: typeof HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  answerRecordReference: string;
  answerReference: string;
  ledgerReference: string;
  strategyId: string;
  strategyReference: string;
  dossierSnapshot: HopPropertyAdviceDossierV3;
  dossierReference: string;
  reference: string;
}

export type HopV55PropertyAdviceRecordV4Read<T> =
  | { status: 'readOnly'; record: T }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

type Row = Record<string, any>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const clone = <T,>(value: T): T => structuredClone(value);
const isoInstant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));

function onlyKeys(value: Row, keys: readonly string[], name: string): void {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new Error(`${name} contient un champ non pris en charge.`);
}

function sameExact(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((row, index) => sameExact(row, right[index]));
  const a = left as Row, b = right as Row;
  const keysA = Object.keys(a).sort(), keysB = Object.keys(b).sort();
  return keysA.length === keysB.length && keysA.every((key, index) => key === keysB[index] && sameExact(a[key], b[key]));
}

function actor(value: unknown, label: string): asserts value is HopV55PropertyAdviceV4Actor {
  if (!isRow(value)) throw new Error(`${label} absent.`);
  onlyKeys(value, ['origin', 'label'], label);
  if (!['user', 'proposal', 'fixture'].includes(value.origin) || !text(value.label)) throw new Error(`${label} invalide.`);
}

function assertIntentShape(value: unknown, question: string): asserts value is HopPropertyAdviceIntentV3 {
  if (!isRow(value)) throw new Error('Annotation source V4 illisible.');
  const allowed = ['id', 'property', 'label', 'familyId', 'partner', 'role', 'direction', 'qualification', 'required',
    'comparisonBasis', 'metric', 'subject', 'sourceSpans', 'interpretationOrigin', 'basis', 'relatedIntentIds', 'investigation'];
  onlyKeys(value, allowed, 'Annotation source V4');
  if (!text(value.id) || !['aroma', 'bitterness', 'sweetness', 'acidity', 'bioContribution', 'materialCharacter', 'unresolved'].includes(value.property)
    || !text(value.label) || value.familyId !== undefined && !text(value.familyId)
    || !['target', 'reportedObservation', 'measurement', 'investigation', 'preference', 'constraint'].includes(value.role)
    || value.direction !== null && !['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(value.direction)
    || value.qualification !== null && typeof value.qualification !== 'string' || typeof value.required !== 'boolean'
    || !isRow(value.comparisonBasis) || !['qualitativeTarget', 'current', 'none'].includes(value.comparisonBasis.kind)
    || !Array.isArray(value.comparisonBasis.assertionIds) || value.comparisonBasis.assertionIds.some((id: unknown) => !text(id))
    || !['sensory', 'pH', 'titratableAcidity', 'analyticalBU', 'unspecified'].includes(value.metric)
    || !isRow(value.subject) || !['beer', 'material', 'culture', 'process', 'unspecified'].includes(value.subject.kind)
    || !text(value.subject.label) || value.subject.materialId !== null && !text(value.subject.materialId)
    || !['rawHop', 'infusion', 'beer', 'unspecified'].includes(value.subject.sensoryContext)
    || !Array.isArray(value.sourceSpans) || !['user', 'proposal', 'fixture'].includes(value.interpretationOrigin)
    || !text(value.basis) || !Array.isArray(value.relatedIntentIds) || value.relatedIntentIds.some((id: unknown) => !text(id))) {
    throw new Error(`Annotation source V4 invalide (${String(value.id ?? 'sans ID')}).`);
  }
  onlyKeys(value.comparisonBasis, ['kind', 'assertionIds'], `Annotation ${value.id} base de comparaison`);
  onlyKeys(value.subject, ['kind', 'label', 'materialId', 'sensoryContext'], `Annotation ${value.id} sujet`);
  if (value.sourceSpans.some((span: unknown) => !isRow(span) || Object.keys(span).some(key => !['start', 'end', 'text'].includes(key))
    || !Number.isSafeInteger((span as Row).start) || !Number.isSafeInteger((span as Row).end)
    || (span as Row).start < 0 || (span as Row).end < (span as Row).start || typeof (span as Row).text !== 'string'
    || question.slice((span as Row).start, (span as Row).end) !== (span as Row).text)) {
    throw new Error(`Les fragments source de l’annotation ${value.id} ne correspondent pas à la question exacte.`);
  }
  if (value.partner !== undefined) {
    if (!isRow(value.partner) || !['material', 'observation', 'freeContext'].includes(value.partner.kind)) throw new Error(`Partenaire de l’annotation ${value.id} invalide.`);
    if (value.partner.kind === 'material') {
      onlyKeys(value.partner, ['kind', 'id', 'additionId'], `Annotation ${value.id} partenaire matière`);
      if (!text(value.partner.id) || value.partner.additionId !== undefined && !text(value.partner.additionId)) throw new Error(`Partenaire matière de l’annotation ${value.id} incomplet.`);
    } else if (value.partner.kind === 'observation') {
      onlyKeys(value.partner, ['kind', 'id', 'descriptions'], `Annotation ${value.id} partenaire observation`);
      if (!text(value.partner.id) || value.partner.descriptions !== undefined && !Array.isArray(value.partner.descriptions)) throw new Error(`Partenaire observation de l’annotation ${value.id} incomplet.`);
    } else {
      onlyKeys(value.partner, ['kind', 'text', 'context', 'source'], `Annotation ${value.id} contexte partenaire`);
      if (!text(value.partner.text) || value.partner.context !== undefined && typeof value.partner.context !== 'string') throw new Error(`Contexte partenaire de l’annotation ${value.id} incomplet.`);
    }
  }
  if (value.investigation !== undefined) {
    if (!isRow(value.investigation)) throw new Error(`Investigation de l’annotation ${value.id} invalide.`);
    onlyKeys(value.investigation, ['kind', 'observationIntentIds'], `Annotation ${value.id} investigation`);
    if (value.investigation.kind !== 'comparePerceptualCompensation' || !Array.isArray(value.investigation.observationIntentIds)
      || value.investigation.observationIntentIds.some((id: unknown) => !text(id))) throw new Error(`Investigation de l’annotation ${value.id} invalide.`);
  }
}

export function hopV55PropertyAdviceLedgerEntryReferenceV1(value: Omit<HopV55PropertyAdviceLedgerEntryV1, 'reference'>
  | HopV55PropertyAdviceLedgerEntryV1): string {
  const { reference: _reference, ...body } = value as HopV55PropertyAdviceLedgerEntryV1;
  return hopAdviceContentReference('hop-v55-property-advice-annotation-ledger-entry-v1', body);
}

export function hopV55PropertyAdviceAnnotationLedgerReferenceV1(value: Omit<HopV55PropertyAdviceAnnotationLedgerV1, 'reference'>
  | HopV55PropertyAdviceAnnotationLedgerV1): string {
  const { reference: _reference, ...body } = value as HopV55PropertyAdviceAnnotationLedgerV1;
  return hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_ANNOTATION_LEDGER_V1_FORMAT, body);
}

export function sealHopV55PropertyAdviceLedgerEntryV1(input: Omit<HopV55PropertyAdviceLedgerEntryV1, 'reference'>): HopV55PropertyAdviceLedgerEntryV1 {
  const entry = { ...clone(input), reference: hopV55PropertyAdviceLedgerEntryReferenceV1(input) };
  return entry;
}

export function sealHopV55PropertyAdviceAnnotationLedgerV1(input: Omit<HopV55PropertyAdviceAnnotationLedgerV1, 'format' | 'reference'>
  & { originalQuestion: string }): HopV55PropertyAdviceAnnotationLedgerV1 {
  const { originalQuestion, ...body } = input;
  const ledger = { format: HOP_V55_PROPERTY_ADVICE_ANNOTATION_LEDGER_V1_FORMAT, ...clone(body), reference: '' };
  ledger.reference = hopV55PropertyAdviceAnnotationLedgerReferenceV1(ledger);
  assertHopV55PropertyAdviceAnnotationLedgerV1(ledger, originalQuestion);
  return clone(ledger);
}

export function readHopV55PropertyAdviceAnnotationLedgerV1(value: unknown, originalQuestion: string):
  | { status: 'readOnly'; ledger: HopV55PropertyAdviceAnnotationLedgerV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  if (isRow(value) && typeof value.format === 'string'
    && value.format.startsWith('hop-v55-property-advice-annotation-ledger-')
    && value.format !== HOP_V55_PROPERTY_ADVICE_ANNOTATION_LEDGER_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Version future du ledger V4 conservée sans conversion.' };
  }
  assertHopV55PropertyAdviceAnnotationLedgerV1(value, originalQuestion);
  return { status: 'readOnly', ledger: clone(value) };
}

function currentEntries(ledger: HopV55PropertyAdviceAnnotationLedgerV1): Map<string, HopV55PropertyAdviceLedgerEntryV1> {
  const latest = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  for (const entry of ledger.entries) latest.set(entry.annotationId, entry);
  return latest;
}

export function assertHopV55PropertyAdviceAnnotationLedgerV1(value: unknown, question: string): asserts value is HopV55PropertyAdviceAnnotationLedgerV1 {
  if (!isRow(value) || value.format !== HOP_V55_PROPERTY_ADVICE_ANNOTATION_LEDGER_V1_FORMAT || !text(value.reference)
    || !Array.isArray(value.sourceAnnotations) || !Array.isArray(value.entries) || !value.sourceAnnotations.length || !value.entries.length) {
    throw new Error('Ledger d’annotations V4 incomplet.');
  }
  onlyKeys(value, ['format', 'sourceAnnotations', 'entries', 'reference'], 'Ledger d’annotations V4');
  const sources = new Map<string, HopPropertyAdviceIntentV3>();
  for (const raw of value.sourceAnnotations) {
    assertIntentShape(raw, question);
    if (sources.has(raw.id)) throw new Error(`Annotation source V4 dupliquée : ${raw.id}.`);
    sources.set(raw.id, raw);
  }
  for (const source of sources.values()) {
    if (new Set(source.relatedIntentIds).size !== source.relatedIntentIds.length
      || source.relatedIntentIds.some(id => !sources.has(id))
      || (source.investigation?.observationIntentIds ?? []).some(id => !sources.has(id))) {
      throw new Error(`Les liens source de l’annotation ${source.id} sortent de l’ensemble source V4.`);
    }
  }
  const lastById = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  const firstById = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  const entryIds = new Set<string>(), entryReferences = new Set<string>();
  for (const raw of value.entries) {
    if (!isRow(raw) || !text(raw.entryId) || !text(raw.annotationId) || !text(raw.reference)
      || (raw.sourceKind !== 'initial' && raw.sourceKind !== 'added')
      || (raw.disposition !== 'active' && raw.disposition !== 'rejected')) {
      throw new Error('Entrée du ledger V4 incomplète.');
    }
    onlyKeys(raw, ['entryId', 'annotationId', 'sourceAnnotation', 'sourceKind', 'additionActId', 'sourceQuestionReference',
      'disposition', 'decision', 'activeIntent', 'reference'], 'Entrée du ledger V4');
    const source = sources.get(raw.annotationId);
    assertIntentShape(raw.sourceAnnotation, question);
    if (!source || raw.sourceAnnotation.id !== raw.annotationId || !sameExact(source, raw.sourceAnnotation)) {
      throw new Error(`Entrée ${raw.entryId} ne conserve pas l’annotation source exacte ${raw.annotationId}.`);
    }
    if (raw.sourceKind === 'initial') {
      if (raw.additionActId !== undefined || raw.sourceQuestionReference !== undefined) throw new Error('Une annotation initiale ne porte pas de filiation d’ajout.');
    } else if (!text(raw.additionActId) || !text(raw.sourceQuestionReference)) {
      throw new Error('Une annotation ajoutée doit référencer son acte et sa question exacte.');
    }
    if (!isRow(raw.decision)) throw new Error(`Décision de ledger absente pour ${raw.entryId}.`);
    onlyKeys(raw.decision, ['kind', 'actId', 'reason', 'recordedAt', 'recordedBy', 'predecessorEntryReference'], `Décision ${raw.entryId}`);
    if (!['initialize', 'add', 'revise', 'reject', 'restore'].includes(raw.decision.kind)
      || !text(raw.decision.actId) || !text(raw.decision.reason) || !isoInstant(raw.decision.recordedAt)) {
      throw new Error(`Décision de ledger invalide pour ${raw.entryId}.`);
    }
    actor(raw.decision.recordedBy, `decision.recordedBy ${raw.entryId}`);
    const prior = lastById.get(raw.annotationId);
    if (!prior) {
      if (raw.decision.predecessorEntryReference !== undefined) throw new Error(`Première entrée ${raw.entryId} ne peut pas avoir de prédécesseur.`);
      if (raw.sourceKind === 'added' && (raw.decision.kind !== 'add'
        || raw.decision.actId !== raw.additionActId || raw.sourceQuestionReference === ''
        || raw.disposition !== 'active' || !raw.activeIntent)) {
        throw new Error(`Ajout initial ${raw.entryId} non lié à son acte explicite.`);
      }
      if (raw.sourceKind === 'initial' && !['initialize', 'revise', 'reject'].includes(raw.decision.kind)) {
        throw new Error(`Annotation initiale ${raw.entryId} doit être initialisée explicitement.`);
      }
    } else {
      if (raw.decision.predecessorEntryReference !== prior.reference
        || raw.sourceKind !== prior.sourceKind || raw.additionActId !== prior.additionActId
        || raw.sourceQuestionReference !== prior.sourceQuestionReference) {
        throw new Error(`Filiation ou origine de l’entrée ${raw.entryId} différente de son prédécesseur exact.`);
      }
      if (raw.decision.kind === 'initialize' || raw.decision.kind === 'add') throw new Error(`L’entrée ${raw.entryId} réinitialise une annotation déjà présente.`);
    }
    if (raw.disposition === 'active') {
      if (!raw.activeIntent) throw new Error(`Projection active absente pour ${raw.entryId}.`);
      assertIntentShape(raw.activeIntent, question);
      if (raw.activeIntent.id !== raw.annotationId || !sameExact(raw.activeIntent.sourceSpans, raw.sourceAnnotation.sourceSpans)) {
        throw new Error(`Projection active ${raw.entryId} a perdu l’ID ou les fragments source exacts.`);
      }
      if (raw.decision.kind === 'reject') throw new Error(`Décision reject incompatible avec projection active ${raw.entryId}.`);
    } else {
      if (raw.activeIntent !== undefined || raw.decision.kind !== 'reject') {
        throw new Error(`Annotation rejetée ${raw.entryId} ne peut pas conserver une projection active.`);
      }
    }
    if (entryIds.has(raw.entryId) || entryReferences.has(raw.reference)
      || hopV55PropertyAdviceLedgerEntryReferenceV1(raw as HopV55PropertyAdviceLedgerEntryV1) !== raw.reference) {
      throw new Error(`ID ou référence d’entrée V4 dupliqué ou altéré : ${raw.entryId}.`);
    }
    entryIds.add(raw.entryId); entryReferences.add(raw.reference);
    if (!firstById.has(raw.annotationId)) firstById.set(raw.annotationId, raw as HopV55PropertyAdviceLedgerEntryV1);
    lastById.set(raw.annotationId, raw as HopV55PropertyAdviceLedgerEntryV1);
  }
  if (lastById.size !== sources.size || [...sources.keys()].some(id => !lastById.has(id))) {
    throw new Error('Les dispositions actives et rejetées ne couvrent pas exactement l’ensemble source du ledger.');
  }
  if (hopV55PropertyAdviceAnnotationLedgerReferenceV1(value as HopV55PropertyAdviceAnnotationLedgerV1) !== value.reference) throw new Error('Référence du ledger V4 altérée.');
  const activeIds = new Set([...lastById.values()].filter(entry => entry.disposition === 'active').map(entry => entry.annotationId));
  for (const entry of lastById.values()) {
    if (entry.disposition !== 'active' || !entry.activeIntent) continue;
    for (const relatedId of entry.activeIntent.relatedIntentIds) {
      if (!activeIds.has(relatedId)) throw new Error(`Lien actif ${entry.annotationId} vers une annotation rejetée ou absente (${relatedId}).`);
    }
    for (const observationId of entry.activeIntent.investigation?.observationIntentIds ?? []) {
      if (!activeIds.has(observationId)) throw new Error(`Compensation active ${entry.annotationId} vers un constat rejeté ou absent (${observationId}).`);
    }
    if (entry.activeIntent.partner?.kind === 'observation' && sources.has(entry.activeIntent.partner.id)
      && !activeIds.has(entry.activeIntent.partner.id)) {
      throw new Error(`Partenaire observation actif ${entry.annotationId} vers une annotation rejetée (${entry.activeIntent.partner.id}).`);
    }
  }
}

function activeProjection(ledger: HopV55PropertyAdviceAnnotationLedgerV1): HopPropertyAdviceIntentV3[] {
  const latest = currentEntries(ledger);
  return ledger.sourceAnnotations.flatMap(annotation => {
    const entry = latest.get(annotation.id);
    return entry?.disposition === 'active' && entry.activeIntent ? [clone(entry.activeIntent)] : [];
  });
}

function answerRecordReference(record: Omit<HopV55PropertyAdviceAnswerRecordV4, 'reference'>
  | HopV55PropertyAdviceAnswerRecordV4): string {
  const { reference: _reference, ...body } = record as HopV55PropertyAdviceAnswerRecordV4;
  return hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT, body);
}

function dossierRecordReference(record: Omit<HopV55PropertyAdviceDossierRecordV4, 'reference'>
  | HopV55PropertyAdviceDossierRecordV4): string {
  const { reference: _reference, ...body } = record as HopV55PropertyAdviceDossierRecordV4;
  return hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT, body);
}

function assertTransition(value: unknown, record: Pick<HopV55PropertyAdviceAnswerRecordV4, 'sourceReadingReference'>): asserts value is HopV55PropertyAdviceV4Transition {
  if (!isRow(value)) throw new Error('Transition V4 absente.');
  onlyKeys(value, ['actId', 'kind', 'parentRecordReference', 'parentReadingReference', 'reason', 'actor', 'recordedAt'], 'Transition V4');
  if (!text(value.actId) || !['create', 'upgradeV3', 'revise', 'reexamine'].includes(value.kind)
    || !text(value.reason) || !isoInstant(value.recordedAt)) throw new Error('Transition V4 incomplète.');
  actor(value.actor, 'Transition V4 actor');
  if (value.kind === 'create') {
    if (value.parentRecordReference !== undefined || value.parentReadingReference !== undefined) throw new Error('Transition create V4 ne peut pas référencer un parent.');
  } else {
    if (!text(value.parentRecordReference) || !text(value.parentReadingReference)) throw new Error('Transition V4 doit citer le record et la lecture parent exacts.');
    if (value.kind === 'reexamine' ? value.parentReadingReference === record.sourceReadingReference
      : value.parentReadingReference !== record.sourceReadingReference) {
      throw new Error('La transition V4 ne correspond pas à une révision même lecture ou à un réexamen distinct.');
    }
  }
}

function assertPreparation(value: unknown, record: Pick<HopV55PropertyAdviceAnswerRecordV4, 'ownerKey' | 'workspaceId'>): asserts value is HopV55PropertyAdvicePreparationV4 {
  if (!isRow(value)) throw new Error('Préparation V4 absente.');
  onlyKeys(value, ['preparedReference', 'source', 'cultureBinding'], 'Préparation V4');
  if (!text(value.preparedReference) || !isRow(value.source) || !text(value.source.kind)) throw new Error('Source ou preparedReference V4 absent.');
  const sourceKinds = ['recipe', 'batch', 'exploration', 'localRecipeCopy', 'localFutureDraft'];
  if (!sourceKinds.includes(value.source.kind)) throw new Error('Source exacte V4 inconnue.');
  if (value.source.kind === 'exploration') onlyKeys(value.source, ['kind'], 'Source exploration V4');
  else if (value.source.kind === 'recipe') {
    onlyKeys(value.source, ['kind', 'id'], 'Source recette V4'); if (!text(value.source.id)) throw new Error('recipeId source V4 absent.');
  } else if (value.source.kind === 'batch') {
    onlyKeys(value.source, ['kind', 'id'], 'Source brassin V4'); if (!text(value.source.id)) throw new Error('batchId source V4 absent.');
  } else if (value.source.kind === 'localRecipeCopy') {
    onlyKeys(value.source, ['kind', 'workspaceId', 'copyId', 'recipeId', 'recipeReference'], 'Source copie V4');
    if (!text(value.source.workspaceId) || !text(value.source.copyId) || !text(value.source.recipeId) || !text(value.source.recipeReference)) throw new Error('Source copie V4 incomplète.');
  } else {
    onlyKeys(value.source, ['kind', 'workspaceId', 'draftId', 'revision', 'contentReference'], 'Source brouillon V4');
    if (!text(value.source.workspaceId) || !text(value.source.draftId) || !Number.isSafeInteger(value.source.revision)
      || value.source.revision < 1 || !text(value.source.contentReference)) throw new Error('Source brouillon V4 incomplète.');
  }
  if (value.cultureBinding !== undefined) {
    const read = readHopV55AdoptedContextBinding(value.cultureBinding);
    if (read.status !== 'available' || read.binding.ownerKey !== record.ownerKey || read.binding.workspaceId !== record.workspaceId) {
      throw new Error(`Binding culturel adopté V4 invalide ou étranger : ${read.status === 'invalid' ? read.reason : 'owner/workspace différent'}.`);
    }
  }
}

function assertAnswerRecordV4Outer(record: HopV55PropertyAdviceAnswerRecordV4): 'domainAnswer' | 'allRejected' | 'unsupported' {
  if (record.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT || !text(record.id)
    || !text(record.ownerKey) || !text(record.workspaceId) || !text(record.sourceReadingReference)
    || typeof record.originalQuestion !== 'string' || !record.originalQuestion.trim() || !text(record.reference)) {
    throw new Error('Enveloppe de réponse V4 incomplète.');
  }
  onlyKeys(record, ['format', 'id', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'originalQuestion', 'transition',
    'ledger', 'preparation', 'readingContext', 'outcome', 'reference'], 'Enveloppe de réponse V4');
  assertTransition(record.transition, record);
  assertPreparation(record.preparation, record);
  const ledgerRead = readHopV55PropertyAdviceAnnotationLedgerV1(record.ledger, record.originalQuestion);
  const ledgerAvailable = ledgerRead.status === 'readOnly';
  assertHopV55PropertyAdviceV4ReadingContext(record.readingContext, record.originalQuestion);
  const firstById = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  for (const entry of record.ledger.entries) if (!firstById.has(entry.annotationId)) firstById.set(entry.annotationId, entry);
  if (!isRow(record.outcome) || !text(record.outcome.kind)) throw new Error('Issue de réponse V4 absente.');
  let kind: 'domainAnswer' | 'allRejected' | 'unsupported';
  if (record.outcome.kind === 'allRejected') {
    onlyKeys(record.outcome, ['kind'], 'Issue allRejected V4');
    if (ledgerAvailable && [...currentEntries(ledgerRead.ledger).values()].some(entry => entry.disposition === 'active')) {
      throw new Error('Une issue allRejected ne peut garder d’entrée active.');
    }
    kind = ledgerAvailable ? 'allRejected' : 'unsupported';
  } else if (record.outcome.kind === 'domainAnswer') {
    onlyKeys(record.outcome, ['kind', 'requestDraftReference', 'answerSnapshot', 'answerReference'], 'Issue domainAnswer V4');
    if (!text(record.outcome.requestDraftReference) || !text(record.outcome.answerReference) || !isRow(record.outcome.answerSnapshot)
      || !text(record.outcome.answerSnapshot.reference)) throw new Error('Réponse imbriquée V4 incomplète.');
    const active = ledgerAvailable ? activeProjection(ledgerRead.ledger) : null;
    if (ledgerAvailable && !active?.length) throw new Error('Une issue domainAnswer exige au moins une annotation active.');
    if (record.outcome.answerSnapshot.reference !== record.outcome.answerReference) throw new Error('answerReference V4 ne pointe pas le snapshot imbriqué exact.');
    if (isRow(record.outcome.answerSnapshot.requestSnapshot)
      && record.outcome.answerSnapshot.requestSnapshot.format === 'hop-documentary-request-v3') {
      const request = record.outcome.answerSnapshot.requestSnapshot;
      if (request.originalQuestion !== record.originalQuestion || active && !sameExact(request.propertyIntents, active)) {
        throw new Error('La request V3 ne correspond pas à la projection ledger active exacte.');
      }
      if (!sameExact(request.interpretation, record.readingContext.interpretation)
        || !sameExact(request.candidatePolicy, record.readingContext.candidatePolicy)
        || !sameExact(request.context, record.readingContext.context)
        || !sameExact(request.exclusions, record.readingContext.exclusions)) {
        throw new Error('La request V3 ne conserve pas le readingContext exact de l’enveloppe V4.');
      }
      const draft: HopV55PropertyAdviceRequestDraftV3 = {
        format: 'hop-v55-property-advice-request-draft-v3', id: request.id,
        ownerKey: record.ownerKey, workspaceId: record.workspaceId,
        sourceReadingReference: record.sourceReadingReference, preparedReference: record.preparation.preparedReference,
        requestSnapshot: request, reference: record.outcome.requestDraftReference,
      };
      if (hopV55PropertyAdviceRequestDraftReferenceV3(draft) !== record.outcome.requestDraftReference) {
        throw new Error('requestDraftReference V3 ne correspond pas à la requête active et à la préparation V4.');
      }
      kind = ledgerAvailable ? 'domainAnswer' : 'unsupported';
    } else kind = 'unsupported';
  } else kind = 'unsupported';
  for (const [annotationId, first] of firstById) {
    if (first.sourceKind === 'added' && first.additionActId !== first.decision.actId) {
      throw new Error(`Annotation ajoutée ${annotationId} non liée à son acte explicite.`);
    }
  }
  if (answerRecordReference(record) !== record.reference) throw new Error('Référence SHA de l’enveloppe V4 altérée.');
  if (kind !== 'domainAnswer' || record.outcome.kind !== 'domainAnswer') return kind;
  if (!ledgerAvailable) return 'unsupported';
  const domainOutcome = record.outcome;
  const nested = readHopPropertyAdviceAnswerV3(domainOutcome.answerSnapshot);
  if (nested.status === 'readOnly') {
    assertHopPropertyAdviceAnswerV3(domainOutcome.answerSnapshot);
    if (domainOutcome.answerReference !== hopPropertyAdviceAnswerReferenceV3(domainOutcome.answerSnapshot)
      || !sameExact(domainOutcome.answerSnapshot.requestSnapshot.propertyIntents, activeProjection(record.ledger))) {
      throw new Error('Réponse de domaine V3 et projection active ledger V4 divergentes.');
    }
    return 'domainAnswer';
  }
  return 'unsupported';
}

function assertAnswerRecordV4(record: HopV55PropertyAdviceAnswerRecordV4): void {
  const outcome = assertAnswerRecordV4Outer(record);
  if (outcome === 'unsupported') throw new Error('Issue ou snapshot domaine futur; aucun writer V4 ne peut le produire.');
}

export function createHopV55PropertyAdviceAnswerRecordV4(input: {
  draft: HopV55PropertyAdviceCorrectionV4Draft;
  outcome: HopV55PropertyAdviceOutcomeV4;
}): HopV55PropertyAdviceAnswerRecordV4 {
  if (!isRow(input.draft) || !isRow(input.outcome)) throw new Error('Draft V4 et issue explicite requis.');
  const record = { ...clone(input.draft), outcome: clone(input.outcome), reference: '' } as HopV55PropertyAdviceAnswerRecordV4;
  record.reference = answerRecordReference(record);
  assertAnswerRecordV4(record);
  return clone(record);
}

export function readHopV55PropertyAdviceAnswerRecordV4(value: unknown): HopV55PropertyAdviceRecordV4Read<HopV55PropertyAdviceAnswerRecordV4> {
  if (isRow(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-documentary-answer-record-')
    && value.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Enveloppe documentaire non V4 conservée telle quelle.' };
  }
  if (!isRow(value) || value.format !== HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT) throw new Error('Enveloppe de réponse V4 invalide.');
  const outcome = assertAnswerRecordV4Outer(value as unknown as HopV55PropertyAdviceAnswerRecordV4);
  if (outcome === 'unsupported') return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Issue ou snapshot domaine V4 futur conservé après vérification de l’enveloppe connue.' };
  if ((value as HopV55PropertyAdviceAnswerRecordV4).outcome.kind === 'allRejected') {
    return { status: 'readOnly', record: clone(value) as unknown as HopV55PropertyAdviceAnswerRecordV4 };
  }
  return { status: 'readOnly', record: clone(value) as unknown as HopV55PropertyAdviceAnswerRecordV4 };
}

function assertDossierRecordV4Outer(record: HopV55PropertyAdviceDossierRecordV4): void {
  if (record.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT || !text(record.id)
    || !text(record.ownerKey) || !text(record.workspaceId) || !text(record.sourceReadingReference)
    || !text(record.answerRecordReference) || !text(record.answerReference) || !text(record.ledgerReference)
    || !text(record.strategyId) || !text(record.strategyReference) || !text(record.dossierReference) || !text(record.reference)) {
    throw new Error('Enveloppe de dossier V4 incomplète.');
  }
  onlyKeys(record, ['format', 'id', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'answerRecordReference',
    'answerReference', 'ledgerReference', 'strategyId', 'strategyReference', 'dossierSnapshot', 'dossierReference', 'reference'],
  'Enveloppe de dossier V4');
  if (!isRow(record.dossierSnapshot) || record.dossierSnapshot.reference !== record.dossierReference
    || record.dossierSnapshot.id !== record.id || record.dossierSnapshot.answerReference !== record.answerReference
    || record.dossierSnapshot.strategyId !== record.strategyId || record.dossierSnapshot.strategyReference !== record.strategyReference) {
    throw new Error('Le dossier V4 doit référencer exactement son DTO V3 imbriqué.');
  }
  if (dossierRecordReference(record) !== record.reference) throw new Error('Référence SHA de l’enveloppe dossier V4 altérée.');
}

export function createHopV55PropertyAdviceDossierRecordV4(input: {
  answerRecord: HopV55PropertyAdviceAnswerRecordV4;
  dossierId: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
  createdAt: string;
  createdBy: CreateHopPropertyAdviceDossierV3Input['createdBy'];
}): HopV55PropertyAdviceDossierRecordV4 {
  assertAnswerRecordV4(input.answerRecord);
  if (input.answerRecord.outcome.kind !== 'domainAnswer') throw new Error('Aucun dossier stratégie ne peut être créé depuis allRejected.');
  assertHopPropertyAdviceAnswerV3(input.answerRecord.outcome.answerSnapshot);
  const dossierSnapshot = createHopPropertyAdviceDossierV3({ id: input.dossierId, answer: input.answerRecord.outcome.answerSnapshot,
    expectedAnswerReference: input.expectedAnswerReference, expectedInterpretationReference: input.expectedInterpretationReference,
    strategyId: input.strategyId, expectedStrategyReference: input.expectedStrategyReference,
    motive: input.motive, createdAt: input.createdAt, createdBy: clone(input.createdBy) });
  const body: Omit<HopV55PropertyAdviceDossierRecordV4, 'reference'> = {
    format: HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT, id: input.dossierId,
    ownerKey: input.answerRecord.ownerKey, workspaceId: input.answerRecord.workspaceId,
    sourceReadingReference: input.answerRecord.sourceReadingReference,
    answerRecordReference: input.answerRecord.reference, answerReference: input.answerRecord.outcome.answerReference,
    ledgerReference: input.answerRecord.ledger.reference, strategyId: input.strategyId, strategyReference: input.expectedStrategyReference,
    dossierSnapshot: clone(dossierSnapshot), dossierReference: dossierSnapshot.reference,
  };
  const record = { ...body, reference: dossierRecordReference(body) };
  assertDossierRecordV4Outer(record);
  return clone(record);
}

export function readHopV55PropertyAdviceDossierRecordV4(value: unknown): HopV55PropertyAdviceRecordV4Read<HopV55PropertyAdviceDossierRecordV4> {
  if (isRow(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-documentary-dossier-record-')
    && value.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Enveloppe de dossier documentaire non V4 conservée telle quelle.' };
  }
  if (!isRow(value) || value.format !== HOP_V55_PROPERTY_ADVICE_DOSSIER_RECORD_V4_FORMAT) throw new Error('Enveloppe de dossier V4 invalide.');
  const record = value as unknown as HopV55PropertyAdviceDossierRecordV4;
  assertDossierRecordV4Outer(record);
  const nested = readHopPropertyAdviceDossierV3(record.dossierSnapshot);
  if (nested.status !== 'readOnly') {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'DTO domaine V4 futur conservé après vérification des références et du sceau externe.' };
  }
  assertHopPropertyAdviceDossierV3(record.dossierSnapshot);
  if (record.dossierReference !== hopPropertyAdviceDossierReferenceV3(record.dossierSnapshot)
    || record.answerReference !== hopPropertyAdviceAnswerReferenceV3(record.dossierSnapshot.answerSnapshot)) {
    throw new Error('Référence canonique du dossier V3 ou de sa réponse V4 altérée.');
  }
  return { status: 'readOnly', record: clone(record) };
}
