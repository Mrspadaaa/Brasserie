import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { assertHopStrategyAdviceResult } from '../../domain/hopDecision/adviceSchema';
import { HOP_DECISION_VERSION, type HopCommercialProduct, type HopDecisionMaterial, type HopDecisionProgram, type HopProgramAddition, type HopProgramChange, type HopReplacementBasis, type HopUse } from '../../domain/hopDecision/types';
import type { HopIntentEvidenceCriterion } from '../../domain/hopDecision/intentEvidence';
import type { HopAdviceDimension } from '../../domain/hopDecision/adviceSchema';
import type { HopProductForm, HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopV55QuestionReading, HopV55QuestionCriterionV1, HopV55DecisionCorrectionV1 } from './decision';
import type { HopV55ProgramOperationV1, HopV55ProgramScopeV1, HopV55DecisionProgramPreparationV1, PrepareHopV55DecisionProgramInput } from './decisionProgramPreparation';
import { assertHopV55QuestionScopeLedgerV1,
  type HopV55QuestionScopeLedgerV1, type HopV55QuestionScopeTransitionV1 } from './questionScopeReading';
import { assertHopV55SemanticQuestionReadingV1 } from './decisionSemanticProjection';
import type { HopV55SemanticQuestionReadingV1 } from './questionSemanticReading';

export const HOP_V55_DECISION_READING_FORMAT = 'hop-v55-decision-reading-v1' as const;
export const HOP_V55_DECISION_READING_FORMAT_V2 = 'hop-v55-decision-reading-v2' as const;
export const HOP_V55_DECISION_READING_FORMAT_V3 = 'hop-v55-decision-reading-v3' as const;
/** V4 seals a semantic reading; V1–V3 keep their closed readers and bytes. */
export const HOP_V55_DECISION_READING_FORMAT_V4 = 'hop-v55-decision-reading-v4' as const;

/** Shape accepted by the original strict V1 reader. No criterion drafts are admitted. */
export type HopV55QuestionReadingV1 = Pick<HopV55QuestionReading, 'intent' | 'interpretation' | 'response' | 'branches' | 'unresolved'>;

export type HopV55DecisionReadingSource =
  | { kind: 'recipe'; id: string }
  | { kind: 'batch'; id: string }
  | { kind: 'exploration' }
  | { kind: 'localRecipeCopy'; workspaceId: string; copyId: string; recipeId: string; recipeReference: string }
  | { kind: 'localFutureDraft'; workspaceId: string; draftId: string; revision: number; contentReference: string };

export interface HopV55DecisionReadingArchiveV1 {
  format: typeof HOP_V55_DECISION_READING_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55QuestionReadingV1;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  contentReference: string;
}

export interface HopV55ArchivedDecisionProgramPreparationV1 {
  input: PrepareHopV55DecisionProgramInput;
  result: HopV55DecisionProgramPreparationV1;
}

export interface HopV55DecisionReadingArchiveV2 {
  format: typeof HOP_V55_DECISION_READING_FORMAT_V2;
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55QuestionReading;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  /** Exact operation inputs and service result; archive reads never call the service again. */
  programPreparation?: HopV55ArchivedDecisionProgramPreparationV1;
  contentReference: string;
}

/** V3 keeps the V2 reading exact and adds a separately versioned scope ledger. */
export interface HopV55DecisionReadingArchiveV3 {
  format: typeof HOP_V55_DECISION_READING_FORMAT_V3;
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55QuestionReading;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  scopeLedger: HopV55QuestionScopeLedgerV1;
  transition: HopV55QuestionScopeTransitionV1;
  programPreparation?: HopV55ArchivedDecisionProgramPreparationV1;
  contentReference: string;
}

/** Explicit reinterpretation of an older reading; the parent bytes and their dossiers stay untouched. */
export interface HopV55DecisionReadingLineageV1 {
  kind: 'reinterpretation';
  parentReadingReference: string;
  parentReadingFormat: typeof HOP_V55_DECISION_READING_FORMAT | typeof HOP_V55_DECISION_READING_FORMAT_V2
    | typeof HOP_V55_DECISION_READING_FORMAT_V3 | typeof HOP_V55_DECISION_READING_FORMAT_V4;
  reason: string;
  recordedAt: string;
  actor: { origin: 'user'; label: string };
}

/** V4 seals a semantic reading, optional V1 scopes with their transition, and an optional lineage. */
export interface HopV55DecisionReadingArchiveV4 {
  format: typeof HOP_V55_DECISION_READING_FORMAT_V4;
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55SemanticQuestionReadingV1;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  /** Present together with `transition`, or both absent. */
  scopeLedger?: HopV55QuestionScopeLedgerV1;
  transition?: HopV55QuestionScopeTransitionV1;
  lineage?: HopV55DecisionReadingLineageV1;
  programPreparation?: HopV55ArchivedDecisionProgramPreparationV1;
  contentReference: string;
}

/** Declared archive identity carried by API-06 SourceView; it is not the absent archive body. */
export interface HopV55DecisionReadingArchiveV4MetadataIdentityV1 {
  archiveFormat: typeof HOP_V55_DECISION_READING_FORMAT_V4;
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  contentReference: string;
}

/** The exact semantic reading fields sent by SourceView, with response omitted and format renamed. */
export type HopV55DecisionReadingArchiveV4SemanticMetadataV1 =
  Omit<HopV55SemanticQuestionReadingV1, 'format' | 'response'> & {
    sourceFormat: 'hop-v55-question-semantic-reading-v1';
  };

/** Metadata-only input shared with the API-06 SourceView. No synthetic reading/response is accepted. */
export interface HopV55DecisionReadingArchiveV4MetadataV1 {
  archiveIdentity: HopV55DecisionReadingArchiveV4MetadataIdentityV1;
  semantic: HopV55DecisionReadingArchiveV4SemanticMetadataV1;
  scopeLedger?: HopV55QuestionScopeLedgerV1;
  transition?: HopV55QuestionScopeTransitionV1;
  lineage?: HopV55DecisionReadingLineageV1;
  programPreparation?: HopV55ArchivedDecisionProgramPreparationV1;
}

export type HopV55DecisionReadingArchiveV4MetadataReadV1 =
  | { status: 'readOnly'; metadata: HopV55DecisionReadingArchiveV4MetadataV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type HopV55DecisionReadingArchive = HopV55DecisionReadingArchiveV1 | HopV55DecisionReadingArchiveV2 | HopV55DecisionReadingArchiveV3
  | HopV55DecisionReadingArchiveV4;

export type HopV55DecisionReadingRead =
  | { status: 'available'; archive: HopV55DecisionReadingArchive }
  | { status: 'unsupportedFormat'; format: string; raw: unknown }
  | { status: 'invalidRecord'; reason: string };

type DecisionReadingContentV1 = Omit<HopV55DecisionReadingArchiveV1, 'contentReference'>;
type DecisionReadingContentV2 = Omit<HopV55DecisionReadingArchiveV2, 'contentReference'>;
type DecisionReadingContentV3 = Omit<HopV55DecisionReadingArchiveV3, 'contentReference'>;
type DecisionReadingContentV4 = Omit<HopV55DecisionReadingArchiveV4, 'contentReference'>;

const contentReferenceV1 = (content: DecisionReadingContentV1) =>
  hopAdviceContentReference(HOP_V55_DECISION_READING_FORMAT, content);
const contentReferenceV2 = (content: DecisionReadingContentV2) =>
  hopAdviceContentReference(HOP_V55_DECISION_READING_FORMAT_V2, content);
const contentReferenceV3 = (content: DecisionReadingContentV3) =>
  hopAdviceContentReference(HOP_V55_DECISION_READING_FORMAT_V3, content);
const contentReferenceV4 = (content: DecisionReadingContentV4) =>
  hopAdviceContentReference(HOP_V55_DECISION_READING_FORMAT_V4, content);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key));
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

const uses: readonly HopUse[] = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];
const forms: readonly HopProductForm[] = ['pelletT90', 'pelletT45', 'cryo', 'cone', 'extract', 'unknown'];
const dimensions: readonly HopAdviceDimension[] = ['aroma', 'acidity', 'alcohol', 'bioInteraction', 'hopCreep', 'matrixTransfer', 'process', 'stock', 'documentation', 'other'];
const replacementBases: readonly HopReplacementBasis[] = ['alphaLoad', 'totalOil', 'sameMass', 'manufacturer'];
const plannerBases = [...replacementBases, 'tinsethIbu'] as const;

function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function optionalNumberAtLeast(value: unknown, minimum: number): boolean { return value === undefined || value === null || finite(value) && value >= minimum; }
function optionalNumberAbove(value: unknown, minimum: number): boolean { return value === undefined || value === null || finite(value) && value > minimum; }
function serializableData(value: unknown, depth = 0): boolean {
  if (depth > 30) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(row => serializableData(row, depth + 1));
  if (!isRecord(value)) return false;
  return Object.values(value).every(row => row === undefined || serializableData(row, depth + 1));
}

function validateSourceDocument(value: unknown): value is HopSource {
  return isRecord(value) && isText(value.title) && isText(value.author)
    && (value.year === null || Number.isSafeInteger(value.year)) && isText(value.kind)
    && (value.reference === undefined || typeof value.reference === 'string')
    && (value.locator === undefined || typeof value.locator === 'string')
    && serializableData(value);
}

function validateProduct(value: unknown): value is HopCommercialProduct {
  if (!isRecord(value) || !onlyKeys(value, ['id', 'name', 'manufacturer', 'form', 'supportedUses', 'source', 'reviewedOn', 'cautions', 'replacement'])) return false;
  if (!isText(value.id) || !isText(value.name) || !isText(value.manufacturer) || !forms.includes(value.form as HopProductForm)
    || !Array.isArray(value.supportedUses) || !value.supportedUses.every(row => uses.includes(row as HopUse))
    || !validateSourceDocument(value.source) || !isText(value.reviewedOn) || !isStringList(value.cautions)) return false;
  if (value.replacement === undefined) return true;
  const row = value.replacement;
  return isRecord(row) && onlyKeys(row, ['referenceForm', 'uses', 'basis', 'gramsPerGram', 'source', 'limitations', 'maxEquivalentFraction', 'maxDoseGL'])
    && forms.includes(row.referenceForm as HopProductForm) && Array.isArray(row.uses) && row.uses.every(item => uses.includes(item as HopUse))
    && row.basis === 'manufacturerMassRatio' && isRecord(row.gramsPerGram)
    && finite(row.gramsPerGram.min) && finite(row.gramsPerGram.max) && row.gramsPerGram.min >= 0 && row.gramsPerGram.max >= row.gramsPerGram.min
    && validateSourceDocument(row.source) && isStringList(row.limitations)
    && (row.maxEquivalentFraction === undefined || finite(row.maxEquivalentFraction) && row.maxEquivalentFraction >= 0 && row.maxEquivalentFraction <= 1)
    && (row.maxDoseGL === undefined || finite(row.maxDoseGL) && row.maxDoseGL >= 0)
    && serializableData(row);
}

function validateDecisionResponse(value: unknown, question: string): boolean {
  if (!isRecord(value) || value.version !== HOP_DECISION_VERSION
    || typeof value.actionKind !== 'string' || !['compareMaterials', 'substitute', 'comparePrograms', 'assessProgram', 'changeUse', 'blend',
      'replaceRemaining', 'planReplacement', 'understandProducts', 'biotransformation', 'exploreStrategies'].includes(value.actionKind)
    || !['answered', 'conditional', 'noApplicableOption'].includes(String(value.status))
    || typeof value.answer !== 'string' || !isRecord(value.intent) || value.intent.originalQuestion !== question
    || !isRecord(value.result) || !Array.isArray(value.criteria) || !isStringList(value.missingInformation)
    || !Array.isArray(value.sources) || !isRecord(value.boundaries)
    || !onlyKeys(value.boundaries, ['offline', 'writesRecipe', 'writesBatch', 'sensoryValidation'])
    || value.boundaries.offline !== true || value.boundaries.writesRecipe !== false
    || value.boundaries.writesBatch !== false || value.boundaries.sensoryValidation !== 'notEstablished'
    || !serializableData(value)) return false;
  if (value.actionKind === 'exploreStrategies') {
    try { assertHopStrategyAdviceResult(value.result); } catch { return false; }
  }
  if (value.actionKind === 'understandProducts') {
    if (!onlyKeys(value.result, ['products']) || !Array.isArray(value.result.products) || !value.result.products.every(validateProduct)) return false;
  }
  return true;
}

function validateCriterionDraft(value: unknown, question: string): value is HopV55QuestionCriterionV1 {
  if (!isRecord(value) || !onlyKeys(value, ['id', 'source', 'term', 'direction', 'qualification', 'requirement', 'familyId', 'dimension', 'reportedProblem', 'origin'])
    || !isText(value.id) || !isRecord(value.source) || !onlyKeys(value.source, ['start', 'end', 'text'])
    || !Number.isSafeInteger(value.source.start) || !Number.isSafeInteger(value.source.end)
    || (value.source.start as number) < 0 || (value.source.end as number) < (value.source.start as number)
    || !isText(value.source.text) || question.slice(value.source.start as number, value.source.end as number) !== value.source.text
    || !isText(value.term) || !['required', 'optional'].includes(String(value.requirement))
    || !['parser', 'brasseur'].includes(String(value.origin))) return false;
  const direction = value.direction;
  const knownDirection = ['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(String(direction));
  if (value.requirement === 'optional' ? direction !== null : !knownDirection) return false;
  return (value.qualification === undefined || typeof value.qualification === 'string')
    && (value.familyId === undefined || isText(value.familyId))
    && (value.dimension === undefined || dimensions.includes(value.dimension as HopAdviceDimension))
    && (value.reportedProblem === undefined || typeof value.reportedProblem === 'string')
    && serializableData(value);
}

function validatePublicIntent(value: unknown): boolean {
  if (!isRecord(value) || !onlyKeys(value, ['question', 'criteria']) || !isText(value.question) || !Array.isArray(value.criteria)) return false;
  return value.criteria.every(item => isRecord(item) && onlyKeys(item, ['id', 'label', 'direction', 'axisId', 'familyId'])
    && isText(item.id) && isText(item.label)
    && ['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(String(item.direction))
    && (item.axisId === undefined || isText(item.axisId)) && (item.familyId === undefined || isText(item.familyId)));
}

function validateV2Reading(value: unknown): value is HopV55QuestionReading {
  if (!isRecord(value) || !onlyKeys(value, ['intent', 'criterionDrafts', 'operationDrafts', 'correction', 'interpretation', 'response', 'branches', 'unresolved'])
    || !validatePublicIntent(value.intent) || !Array.isArray(value.criterionDrafts)
    || !value.criterionDrafts.every(row => validateCriterionDraft(row, String((value.intent as Record<string, unknown>).question)))
    || value.operationDrafts !== undefined && (!Array.isArray(value.operationDrafts)
      || !value.operationDrafts.every(row => validateOperation(row, String((value.intent as Record<string, unknown>).question)))
      || new Set(value.operationDrafts.map(row => (row as { id: string }).id)).size !== value.operationDrafts.length)
    || typeof value.interpretation !== 'string' || !Array.isArray(value.branches) || !isStringList(value.unresolved)) return false;
  const drafts = value.criterionDrafts as HopV55QuestionCriterionV1[];
  const required = drafts.filter(row => row.requirement === 'required');
  const criteria = (value.intent as { criteria: HopV55QuestionCriterionV1[] }).criteria;
  if (required.length !== criteria.length || required.some(draft => !criteria.some(criterion => criterion.id === draft.id && criterion.direction === draft.direction))) return false;
  if (value.correction !== undefined) {
    const correction = value.correction;
    if (!isRecord(correction) || !onlyKeys(correction, ['sourceReadingReference', 'recordedAt', 'actor', 'changedCriterionIds'])
      || !isText(correction.sourceReadingReference) || !isText(correction.recordedAt) || !Number.isFinite(Date.parse(correction.recordedAt))
      || !isRecord(correction.actor) || !onlyKeys(correction.actor, ['label']) || correction.actor.label !== 'Brasseur'
      || !isStringList(correction.changedCriterionIds) || new Set(correction.changedCriterionIds).size !== correction.changedCriterionIds.length) return false;
  }
  return value.response === undefined || validateDecisionResponse(value.response, String((value.intent as Record<string, unknown>).question));
}

function validateHopProgramAddition(value: unknown): value is HopProgramAddition {
  return isRecord(value) && onlyKeys(value, ['id', 'materialId', 'grams', 'use', 'status', 'boilMinutes', 'contactHours', 'temperatureC', 'dayOffset', 'alphaForModel'])
    && isText(value.id) && isText(value.materialId) && (value.grams === null || finite(value.grams) && value.grams >= 0)
    && uses.includes(value.use as HopUse) && ['planned', 'performed'].includes(String(value.status))
    && optionalNumberAtLeast(value.boilMinutes, 0)
    && optionalNumberAtLeast(value.contactHours, 0)
    && optionalNumberAtLeast(value.dayOffset, 0)
    && optionalNumberAtLeast(value.temperatureC, -273.15)
    && (value.alphaForModel === undefined || serializableData(value.alphaForModel))
    && serializableData(value);
}

function validateProgram(value: unknown): value is HopDecisionProgram {
  if (!isRecord(value) || !onlyKeys(value, ['id', 'revision', 'stage', 'volumeL', 'wortGravity', 'ibuModelContext', 'additions'])
    || !isText(value.id) || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0
    || !['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'].includes(String(value.stage))
    || !(value.volumeL === null || finite(value.volumeL) && value.volumeL > 0)
    || !(value.wortGravity === null || finite(value.wortGravity)) || !Array.isArray(value.additions)
    || !value.additions.every(validateHopProgramAddition) || new Set((value.additions as HopProgramAddition[]).map(row => row.id)).size !== value.additions.length) return false;
  return (value.ibuModelContext === undefined || serializableData(value.ibuModelContext)) && serializableData(value);
}

function validateProgramChange(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.kind === 'remove') return onlyKeys(value, ['kind', 'additionId']) && isText(value.additionId);
  if (value.kind === 'append') return onlyKeys(value, ['kind', 'addition']) && validateHopProgramAddition(value.addition);
  if (value.kind === 'replace') return onlyKeys(value, ['kind', 'additionId', 'additions']) && isText(value.additionId)
    && Array.isArray(value.additions) && value.additions.every(validateHopProgramAddition);
  return false;
}

function validateOperation(value: unknown, question: string): value is HopV55ProgramOperationV1 {
  if (!isRecord(value) || !isText(value.id) || !isText(value.label) || !isText(value.kind)) return false;
  const common = ['id', 'label', 'kind', 'sourceSpan'];
  if (value.sourceSpan !== undefined) {
    const span = value.sourceSpan;
    if (!isRecord(span) || !onlyKeys(span, ['start', 'end', 'text']) || !Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end)
      || (span.start as number) < 0 || (span.end as number) < (span.start as number) || !isText(span.text)
      || question.slice(span.start as number, span.end as number) !== span.text) return false;
  }
  const optionalIds = (row: Record<string, unknown>, keys: string[]) => keys.every(key => row[key] === undefined || isText(row[key]));
  const validScope = (scope: unknown): scope is HopV55ProgramScopeV1 | undefined => scope === undefined || scope === 'hotSide' || scope === 'coldSide';
  const conditions = (row: unknown) => row === undefined || isRecord(row) && onlyKeys(row, ['boilMinutes', 'contactHours', 'temperatureC', 'dayOffset'])
    && ['boilMinutes', 'contactHours', 'temperatureC', 'dayOffset'].every(key => row[key] === undefined || row[key] === null || finite(row[key])) && serializableData(row);
  const quantity = (row: unknown) => {
    if (row === undefined) return true;
    if (!isRecord(row)) return false;
    if (row.kind === 'entire') return onlyKeys(row, ['kind']);
    return row.kind === 'partial' && onlyKeys(row, ['kind', 'grams'])
      && optionalNumberAbove(row.grams, 0);
  };
  if (value.kind === 'add') {
    return onlyKeys(value, [...common, 'additionId', 'materialId', 'grams', 'use', 'targetScope', 'conditions'])
      && isText(value.additionId) && optionalIds(value, ['materialId']) && optionalNumberAtLeast(value.grams, 0)
      && (value.use === undefined || uses.includes(value.use as HopUse)) && validScope(value.targetScope) && conditions(value.conditions);
  }
  if (value.kind === 'remove') {
    return onlyKeys(value, [...common, 'additionId', 'sourceMaterialId', 'sourceUse', 'sourceScope', 'quantity'])
      && optionalIds(value, ['additionId', 'sourceMaterialId']) && (value.sourceUse === undefined || uses.includes(value.sourceUse as HopUse)) && validScope(value.sourceScope)
      && quantity(value.quantity);
  }
  if (value.kind === 'setDose') {
    if (!onlyKeys(value, [...common, 'additionId', 'sourceMaterialId', 'sourceUse', 'sourceScope', 'quantity'])
      || !optionalIds(value, ['additionId', 'sourceMaterialId']) || value.sourceUse !== undefined && !uses.includes(value.sourceUse as HopUse) || !validScope(value.sourceScope)) return false;
    if (value.quantity === undefined) return true;
    const row = value.quantity;
    if (!isRecord(row)) return false;
    if (row.kind === 'target') return onlyKeys(row, ['kind', 'grams']) && optionalNumberAtLeast(row.grams, 0);
    return row.kind === 'delta' && onlyKeys(row, ['kind', 'grams', 'direction']) && ['increase', 'decrease'].includes(String(row.direction))
      && optionalNumberAtLeast(row.grams, 0);
  }
  if (value.kind === 'move') {
    return onlyKeys(value, [...common, 'additionId', 'sourceMaterialId', 'sourceUse', 'sourceScope', 'use', 'conditions', 'quantity', 'newAdditionId'])
      && optionalIds(value, ['additionId', 'sourceMaterialId', 'newAdditionId']) && (value.sourceUse === undefined || uses.includes(value.sourceUse as HopUse)) && validScope(value.sourceScope)
      && (value.use === undefined || uses.includes(value.use as HopUse)) && conditions(value.conditions)
      && quantity(value.quantity);
  }
  if (value.kind === 'replace') {
    if (!onlyKeys(value, [...common, 'additionId', 'sourceMaterialId', 'sourceUse', 'sourceScope', 'materialId', 'dose'])
      || !optionalIds(value, ['additionId', 'sourceMaterialId', 'materialId']) || value.sourceUse !== undefined && !uses.includes(value.sourceUse as HopUse) || !validScope(value.sourceScope)) return false;
    if (value.dose === undefined) return true;
    const dose = value.dose;
    if (!isRecord(dose)) return false;
    if (dose.kind === 'explicit') return onlyKeys(dose, ['kind', 'grams']) && optionalNumberAtLeast(dose.grams, 0);
    return dose.kind === 'basis' && onlyKeys(dose, ['kind', 'basis', 'fraction', 'chosenGrams'])
      && replacementBases.includes(dose.basis as HopReplacementBasis)
      && (dose.fraction === undefined || finite(dose.fraction) && dose.fraction > 0 && dose.fraction <= 1)
      && (dose.chosenGrams === undefined || finite(dose.chosenGrams) && dose.chosenGrams >= 0);
  }
  if (value.kind === 'replaceUnavailable') {
    if (!onlyKeys(value, [...common, 'sourceMaterialId', 'coverage', 'candidateMaterialIds', 'basisByUse', 'reason', 'selection'])
      || !optionalIds(value, ['sourceMaterialId']) || !(value.reason === undefined || typeof value.reason === 'string')
      || !(value.coverage === undefined || isRecord(value.coverage) && (value.coverage.kind === 'allFuture' && onlyKeys(value.coverage, ['kind'])
        || value.coverage.kind === 'selectedLines' && onlyKeys(value.coverage, ['kind', 'additionIds']) && isStringList(value.coverage.additionIds)))
      || !(value.candidateMaterialIds === undefined || isStringList(value.candidateMaterialIds))) return false;
    if (value.basisByUse !== undefined && (!isRecord(value.basisByUse) || Object.keys(value.basisByUse).some(key => !uses.includes(key as HopUse))
      || Object.values(value.basisByUse).some(row => !plannerBases.includes(row as typeof plannerBases[number])))) return false;
    if (value.selection !== undefined && (!isRecord(value.selection) || !onlyKeys(value.selection, ['pathId', 'dosesByAdditionId']) || !isText(value.selection.pathId)
      || value.selection.dosesByAdditionId !== undefined && (!isRecord(value.selection.dosesByAdditionId) || Object.values(value.selection.dosesByAdditionId).some(row => !finite(row) || row < 0)))) return false;
    return true;
  }
  return false;
}

function validateProgramPreparation(value: unknown, question: string): value is HopV55ArchivedDecisionProgramPreparationV1 {
  if (!isRecord(value) || !onlyKeys(value, ['input', 'result']) || !isRecord(value.input) || !isRecord(value.result)) return false;
  const input = value.input;
  const result = value.result;
  if (!onlyKeys(input, ['branch', 'program', 'materials', 'intent', 'operations', 'expectedProgramReference'])
    || !isRecord(input.branch) || !onlyKeys(input.branch, ['id', 'label']) || !isText(input.branch.id) || !isText(input.branch.label)
    || !validateProgram(input.program) || !Array.isArray(input.materials) || !input.materials.every(row => isRecord(row)
      && isText(row.id) && isText(row.name) && forms.includes(row.form as HopProductForm) && serializableData(row))
    || !isRecord(input.intent) || !onlyKeys(input.intent, ['question', 'interpretation', 'criteria']) || input.intent.question !== question
    || typeof input.intent.interpretation !== 'string' || !Array.isArray(input.intent.criteria) || !serializableData(input.intent.criteria)
    || !Array.isArray(input.operations) || !input.operations.every(row => validateOperation(row, question))
    || new Set(input.operations.map(row => (row as { id: string }).id)).size !== input.operations.length
    || input.expectedProgramReference !== undefined && !isText(input.expectedProgramReference)) return false;
  if (!onlyKeys(result, ['version', 'status', 'programReference', 'operations', 'evaluations', 'needs', 'reasons', 'changes', 'proposal', 'branch'])
    || result.version !== 'hop-v55-program-preparation-v1' || !['ready', 'needsInput', 'blocked'].includes(String(result.status))
    || !isText(result.programReference) || !Array.isArray(result.operations) || !serializableData(result.operations)
    || JSON.stringify(result.operations) !== JSON.stringify(input.operations)
    || !Array.isArray(result.evaluations) || !isStringList(result.reasons) || !Array.isArray(result.needs) || !serializableData(result.needs)) return false;
  if (result.status === 'ready') {
    if (!Array.isArray(result.changes) || !result.changes.every(validateProgramChange) || !isRecord(result.proposal)
      || !isRecord(result.branch) || !isText(result.branch.id) || !isText(result.branch.label)
      || !Array.isArray(result.branch.assumptions) || !Array.isArray(result.branch.programChanges)
      || !result.branch.programChanges.every(validateProgramChange) || result.branch.programChanges.length !== result.changes.length) return false;
  } else if (result.branch !== undefined) return false;
  return result.evaluations.every((row: unknown) => isRecord(row) && isText(row.operationId)
    && ['ready', 'needsInput', 'blocked'].includes(String(row.status)) && Array.isArray(row.needs) && isStringList(row.reasons)
    && Array.isArray(row.sourceCandidates) && Array.isArray(row.materialCandidates) && Array.isArray(row.changes)
    && row.changes.every(validateProgramChange) && serializableData(row)) && serializableData(value);
}

function validateSource(value: unknown): value is HopV55DecisionReadingSource {
  if (!isRecord(value) || !isText(value.kind)) return false;
  if (value.kind === 'recipe' || value.kind === 'batch') {
    return onlyKeys(value, ['kind', 'id']) && isText(value.id);
  }
  if (value.kind === 'localFutureDraft') {
    return onlyKeys(value, ['kind', 'workspaceId', 'draftId', 'revision', 'contentReference'])
      && isText(value.workspaceId) && isText(value.draftId) && Number.isSafeInteger(value.revision)
      && (value.revision as number) >= 1 && isText(value.contentReference);
  }
  if (value.kind === 'localRecipeCopy') {
    return onlyKeys(value, ['kind', 'workspaceId', 'copyId', 'recipeId', 'recipeReference'])
      && isText(value.workspaceId) && isText(value.copyId) && isText(value.recipeId) && isText(value.recipeReference);
  }
  return value.kind === 'exploration' && onlyKeys(value, ['kind']);
}

function validateReadingV1(value: unknown): value is HopV55QuestionReadingV1 {
  if (!isRecord(value) || !onlyKeys(value, ['intent', 'interpretation', 'response', 'branches', 'unresolved'])
    || !isRecord(value.intent) || !onlyKeys(value.intent, ['question', 'criteria'])
    || !isText(value.intent.question) || !Array.isArray(value.intent.criteria)
    || typeof value.interpretation !== 'string' || !Array.isArray(value.branches) || !isStringList(value.unresolved)) return false;
  if (!value.intent.criteria.every(item => isRecord(item)
    && onlyKeys(item, ['id', 'label', 'direction', 'axisId', 'familyId'])
    && isText(item.id) && isText(item.label)
    && ['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(String(item.direction))
    && (item.axisId === undefined || isText(item.axisId))
    && (item.familyId === undefined || isText(item.familyId)))) return false;
  if (value.response !== undefined) {
    const actions = ['compareMaterials', 'substitute', 'comparePrograms', 'assessProgram', 'changeUse', 'blend', 'replaceRemaining',
      'planReplacement', 'understandProducts', 'biotransformation', 'exploreStrategies'];
    if (!isRecord(value.response) || value.response.version !== HOP_DECISION_VERSION
      || typeof value.response.actionKind !== 'string' || !actions.includes(value.response.actionKind)
      || !['answered', 'conditional', 'noApplicableOption'].includes(String(value.response.status))
      || typeof value.response.answer !== 'string' || !isRecord(value.response.intent)
      || value.response.intent.originalQuestion !== value.intent.question || !isRecord(value.response.result)
      || !Array.isArray(value.response.criteria) || !isStringList(value.response.missingInformation)
      || !Array.isArray(value.response.sources) || !isRecord(value.response.boundaries)
      || !onlyKeys(value.response.boundaries, ['offline', 'writesRecipe', 'writesBatch', 'sensoryValidation'])
      || value.response.boundaries.offline !== true || value.response.boundaries.writesRecipe !== false
      || value.response.boundaries.writesBatch !== false || value.response.boundaries.sensoryValidation !== 'notEstablished') return false;
    if (value.response.actionKind === 'exploreStrategies') {
      try { assertHopStrategyAdviceResult(value.response.result); } catch { return false; }
    }
  }
  return true;
}

function validateContentV1(value: unknown): value is DecisionReadingContentV1 {
  return isRecord(value) && onlyKeys(value, ['format', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'reading', 'source', 'runtimeReference'])
    && value.format === HOP_V55_DECISION_READING_FORMAT
    && isText(value.id) && isText(value.ownerKey) && isText(value.workspaceId)
    && isText(value.recordedAt) && Number.isFinite(Date.parse(value.recordedAt))
    && validateReadingV1(value.reading) && validateSource(value.source) && isText(value.runtimeReference);
}

function validateContentV2(value: unknown): value is DecisionReadingContentV2 {
  return isRecord(value) && onlyKeys(value, ['format', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'reading', 'source', 'runtimeReference', 'programPreparation'])
    && value.format === HOP_V55_DECISION_READING_FORMAT_V2
    && isText(value.id) && isText(value.ownerKey) && isText(value.workspaceId)
    && isText(value.recordedAt) && Number.isFinite(Date.parse(value.recordedAt))
    && validateV2Reading(value.reading) && validateSource(value.source) && isText(value.runtimeReference)
    && (value.programPreparation === undefined || validateProgramPreparation(value.programPreparation, value.reading.intent.question));
}

function validateScopeTransition(value: unknown): value is HopV55QuestionScopeTransitionV1 {
  if (!isRecord(value) || !onlyKeys(value, ['actId', 'kind', 'parentReadingReference', 'reason', 'recordedAt', 'actor'])
    || !isText(value.actId) || !['create', 'reviseScopes'].includes(String(value.kind))
    || !isText(value.reason) || !isText(value.recordedAt) || !Number.isFinite(Date.parse(value.recordedAt))
    || !isRecord(value.actor) || !onlyKeys(value.actor, ['origin', 'label'])
    || !['user', 'proposal', 'fixture'].includes(String(value.actor.origin)) || !isText(value.actor.label)) return false;
  if (value.kind === 'create') return value.parentReadingReference === undefined;
  return isText(value.parentReadingReference);
}

function validateContentV3(value: unknown): value is DecisionReadingContentV3 {
  if (!isRecord(value) || !onlyKeys(value, ['format', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'reading', 'source',
    'runtimeReference', 'scopeLedger', 'transition', 'programPreparation'])
    || value.format !== HOP_V55_DECISION_READING_FORMAT_V3
    || !isText(value.id) || !isText(value.ownerKey) || !isText(value.workspaceId)
    || !isText(value.recordedAt) || !Number.isFinite(Date.parse(value.recordedAt))
    || !validateV2Reading(value.reading) || !validateSource(value.source) || !isText(value.runtimeReference)
    || !validateScopeTransition(value.transition)
    || value.transition.kind === 'create' && value.transition.parentReadingReference !== undefined
    || value.programPreparation !== undefined && !validateProgramPreparation(value.programPreparation, value.reading.intent.question)) return false;
  try {
    assertHopV55QuestionScopeLedgerV1(value.scopeLedger, value.reading.intent.question, value.reading);
    return scopeLedgerMatchesTransition(value.scopeLedger as HopV55QuestionScopeLedgerV1, value.transition as HopV55QuestionScopeTransitionV1);
  }
  catch { return false; }
}

/** Entries of the current act must carry exactly this transition (shared by V3 and V4). */
function scopeLedgerMatchesTransition(ledger: HopV55QuestionScopeLedgerV1, transition: HopV55QuestionScopeTransitionV1): boolean {
  const currentEntries = ledger.entries.filter(entry => entry.decision.actId === transition.actId);
  if (!currentEntries.length || currentEntries.some(entry => entry.decision.recordedAt !== transition.recordedAt
    || !sameScopeActor(entry.decision.recordedBy, transition.actor))) return false;
  if (transition.kind === 'create') {
    if (currentEntries.length !== ledger.sourceScopes.length || currentEntries.some(entry => entry.decision.kind !== 'initialize'
      || entry.status !== 'open')) return false;
  } else {
    const latest = new Map<string, typeof ledger.entries[number]>();
    for (const entry of ledger.entries) latest.set(entry.scopeId, entry);
    if (currentEntries.some(entry => latest.get(entry.scopeId)?.reference !== entry.reference
      || entry.decision.kind === 'initialize')) return false;
  }
  return true;
}

const READING_FORMATS = [HOP_V55_DECISION_READING_FORMAT, HOP_V55_DECISION_READING_FORMAT_V2,
  HOP_V55_DECISION_READING_FORMAT_V3, HOP_V55_DECISION_READING_FORMAT_V4] as const;

function validateLineage(value: unknown, ownReference?: string): boolean {
  return isRecord(value) && onlyKeys(value, ['kind', 'parentReadingReference', 'parentReadingFormat', 'reason', 'recordedAt', 'actor'])
    && value.kind === 'reinterpretation' && isText(value.parentReadingReference) && value.parentReadingReference !== ownReference
    && READING_FORMATS.includes(value.parentReadingFormat as typeof READING_FORMATS[number])
    && isText(value.reason) && isText(value.recordedAt) && Number.isFinite(Date.parse(value.recordedAt))
    && isRecord(value.actor) && onlyKeys(value.actor, ['origin', 'label']) && value.actor.origin === 'user' && isText(value.actor.label);
}

/**
 * Known V4 envelope: identities, date, source, runtime, lineage, transition and
 * the scopes/transition pairing. It is checked before any nested future format
 * is classified, so a malformed known wrapper never hides behind a future body.
 */
function validateEnvelopeV4MetadataFields(identity: Record<string, unknown>,
  metadata: { scopeLedger?: unknown; transition?: unknown; lineage?: unknown }): boolean {
  if (identity.format !== HOP_V55_DECISION_READING_FORMAT_V4
    || !isText(identity.id) || !isText(identity.ownerKey) || !isText(identity.workspaceId)
    || !isText(identity.recordedAt) || !Number.isFinite(Date.parse(identity.recordedAt))
    || !validateSource(identity.source) || !isText(identity.runtimeReference)) return false;
  if (metadata.lineage !== undefined && !validateLineage(metadata.lineage)) return false;
  if ((metadata.scopeLedger === undefined) !== (metadata.transition === undefined)) return false;
  if (metadata.transition !== undefined && !validateScopeTransition(metadata.transition)) return false;
  return metadata.scopeLedger === undefined || isRecord(metadata.scopeLedger);
}

function validateEnvelopeV4(value: unknown): value is DecisionReadingContentV4 {
  if (!isRecord(value) || !onlyKeys(value, ['format', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'reading', 'source',
    'runtimeReference', 'scopeLedger', 'transition', 'lineage', 'programPreparation']) || !isRecord(value.reading)) return false;
  return validateEnvelopeV4MetadataFields(value, value);
}

function validateV4SemanticReading(reading: unknown): reading is HopV55SemanticQuestionReadingV1 {
  try { assertHopV55SemanticQuestionReadingV1(reading); } catch { return false; }
  if (!serializableData((reading as unknown as Record<string, unknown>).annotations)) return false;
  const question = reading.intent.question;
  if (reading.operationDrafts !== undefined && (!reading.operationDrafts.every(row => validateOperation(row, question))
    || new Set(reading.operationDrafts.map(row => row.id)).size !== reading.operationDrafts.length)) return false;
  return reading.response === undefined || validateDecisionResponse(reading.response, question);
}

function validateV4NonScopeMetadata(metadata: { lineage?: unknown; programPreparation?: unknown }, question: string,
  ownReference?: string): boolean {
  if (metadata.lineage !== undefined && !validateLineage(metadata.lineage, ownReference)) return false;
  return metadata.programPreparation === undefined || validateProgramPreparation(metadata.programPreparation, question);
}

function validateV4ScopeMetadata(metadata: { scopeLedger?: unknown; transition?: unknown }, question: string,
  reading: HopV55SemanticQuestionReadingV1): boolean {
  if (metadata.scopeLedger === undefined) return metadata.transition === undefined;
  try {
    assertHopV55QuestionScopeLedgerV1(metadata.scopeLedger, question, reading);
    return scopeLedgerMatchesTransition(metadata.scopeLedger as HopV55QuestionScopeLedgerV1,
      metadata.transition as HopV55QuestionScopeTransitionV1);
  }
  catch { return false; }
}

/** Strict V4 content: semantic annotations, primitive projection/coverage bound to its response, operations, scopes and lineage. */
function validateContentV4(value: unknown): value is DecisionReadingContentV4 {
  if (!validateEnvelopeV4(value) || !validateV4SemanticReading(value.reading)) return false;
  const question = value.reading.intent.question;
  return validateV4NonScopeMetadata(value, question)
    && validateV4ScopeMetadata(value, question, value.reading);
}

/**
 * Validate the API-06 SourceView metadata subset without inventing a V4 archive
 * or a response. This checks declared metadata schemas and links only; the
 * omitted response means the full archive contentReference cannot be recomputed.
 */
export function readHopV55DecisionReadingArchiveV4MetadataV1(value: unknown): HopV55DecisionReadingArchiveV4MetadataReadV1 {
  const invalid = (reason: string): HopV55DecisionReadingArchiveV4MetadataReadV1 => ({ status: 'invalid', reason });
  const unsupported = (reason: string): HopV55DecisionReadingArchiveV4MetadataReadV1 => ({
    status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason,
  });
  if (!isRecord(value) || !onlyKeys(value, ['archiveIdentity', 'semantic', 'scopeLedger', 'transition', 'lineage', 'programPreparation'])
    || !isRecord(value.archiveIdentity)) return invalid('Métadonnées SourceView V4 incomplètes ou avec des champs inconnus.');

  const identity = value.archiveIdentity;
  if (!onlyKeys(identity, ['archiveFormat', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'source', 'runtimeReference', 'contentReference'])
    || !isText(identity.archiveFormat) || !isText(identity.id) || !isText(identity.ownerKey) || !isText(identity.workspaceId)
    || !isText(identity.recordedAt) || !isText(identity.runtimeReference) || !isText(identity.contentReference)) {
    return invalid('Identité déclarée de l’archive V4 invalide.');
  }
  if (identity.archiveFormat.startsWith('hop-v55-decision-reading-')
    && identity.archiveFormat !== HOP_V55_DECISION_READING_FORMAT_V4) {
    if (READING_FORMATS.includes(identity.archiveFormat as typeof READING_FORMATS[number])) {
      return invalid('Cette vue de métadonnées exige une identité d’archive V4; les archives historiques restent dans leur lecteur strict.');
    }
    return unsupported(`Format d’archive déclaré non pris en charge : ${identity.archiveFormat}.`);
  }

  const semantic = value.semantic;
  if (!isRecord(semantic) || Object.prototype.hasOwnProperty.call(semantic, 'format')
    || Object.prototype.hasOwnProperty.call(semantic, 'response') || !isText(semantic.sourceFormat)) {
    return invalid('Lecture sémantique SourceView invalide ou response/format interdit dans la projection.');
  }
  // This is a metadata descriptor assembled from the declared identity, not an archive body.
  const identityFields = {
    format: identity.archiveFormat,
    id: identity.id,
    ownerKey: identity.ownerKey,
    workspaceId: identity.workspaceId,
    recordedAt: identity.recordedAt,
    source: identity.source,
    runtimeReference: identity.runtimeReference,
  };
  const metadata = {
    ...(Object.prototype.hasOwnProperty.call(value, 'scopeLedger') ? { scopeLedger: value.scopeLedger } : {}),
    ...(Object.prototype.hasOwnProperty.call(value, 'transition') ? { transition: value.transition } : {}),
    ...(Object.prototype.hasOwnProperty.call(value, 'lineage') ? { lineage: value.lineage } : {}),
    ...(Object.prototype.hasOwnProperty.call(value, 'programPreparation') ? { programPreparation: value.programPreparation } : {}),
  };
  if (!validateEnvelopeV4MetadataFields(identityFields, metadata)) {
    return invalid('Métadonnées V4 connues invalides : identité, source, filiation, transition ou association des portées.');
  }
  if (semantic.sourceFormat.startsWith('hop-v55-question-semantic-reading-')
    && semantic.sourceFormat !== 'hop-v55-question-semantic-reading-v1') {
    return unsupported(`Format sémantique déclaré non pris en charge : ${semantic.sourceFormat}.`);
  }
  if (semantic.sourceFormat !== 'hop-v55-question-semantic-reading-v1') {
    return invalid('La source sémantique ne déclare pas le format V1 attendu.');
  }

  const { sourceFormat, ...semanticBody } = semantic;
  const semanticReading = { ...semanticBody, format: sourceFormat };
  if (!validateV4SemanticReading(semanticReading)) return invalid('Lecture sémantique V1 ou ses spans, relations et projections invalides.');
  const question = semanticReading.intent.question;
  if (!validateV4NonScopeMetadata(metadata, question, identity.contentReference)) {
    return invalid('Filiation ou préparation de programme V4 invalide pour la question source.');
  }

  if (isRecord(metadata.scopeLedger) && isText(metadata.scopeLedger.format)
    && metadata.scopeLedger.format.startsWith('hop-v55-question-scope-ledger-')
    && metadata.scopeLedger.format !== 'hop-v55-question-scope-ledger-v1') {
    return unsupported(`Format de ledger de portées non pris en charge : ${metadata.scopeLedger.format}.`);
  }
  if (!validateV4ScopeMetadata(metadata, question, semanticReading)) {
    return invalid('Ledger de portées, ses références ou sa transition ne correspondent pas à la lecture sémantique.');
  }
  return { status: 'readOnly', metadata: structuredClone(value) as unknown as HopV55DecisionReadingArchiveV4MetadataV1 };
}

function sameScopeActor(left: unknown, right: unknown): boolean {
  return isRecord(left) && isRecord(right) && left.origin === right.origin && left.label === right.label;
}

/**
 * Seal the exact local decision reading and its source/runtime scope. This is
 * an integrity fingerprint for accidental divergence, not an authenticity
 * proof and not a new decision or brewing calculation.
 */
export function createHopV55DecisionReadingArchive(input: {
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55QuestionReadingV1;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
}): HopV55DecisionReadingArchiveV1 {
  const content: DecisionReadingContentV1 = {
    format: HOP_V55_DECISION_READING_FORMAT,
    id: input.id,
    ownerKey: input.ownerKey,
    workspaceId: input.workspaceId,
    recordedAt: input.recordedAt,
    reading: structuredClone(input.reading),
    source: structuredClone(input.source),
    runtimeReference: input.runtimeReference,
  };
  if (!validateContentV1(content)) throw Error('Lecture de décision incomplète ou portée source invalide.');
  return { ...content, contentReference: contentReferenceV1(content) };
}

export function createHopV55DecisionReadingArchiveV2(input: {
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55QuestionReading;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  programPreparation?: HopV55ArchivedDecisionProgramPreparationV1;
}): HopV55DecisionReadingArchiveV2 {
  const content: DecisionReadingContentV2 = {
    format: HOP_V55_DECISION_READING_FORMAT_V2,
    id: input.id,
    ownerKey: input.ownerKey,
    workspaceId: input.workspaceId,
    recordedAt: input.recordedAt,
    reading: structuredClone(input.reading),
    source: structuredClone(input.source),
    runtimeReference: input.runtimeReference,
    ...(input.programPreparation ? { programPreparation: structuredClone(input.programPreparation) } : {}),
  };
  if (!validateContentV2(content)) throw Error('Lecture de décision V2 incomplète ou préparation de programme invalide.');
  return { ...content, contentReference: contentReferenceV2(content) };
}

/** V3 preserves the complete V2 reading and binds non-sensory query scopes separately. */
export function createHopV55DecisionReadingArchiveV3(input: {
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55QuestionReading;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  scopeLedger: HopV55QuestionScopeLedgerV1;
  transition: HopV55QuestionScopeTransitionV1;
  programPreparation?: HopV55ArchivedDecisionProgramPreparationV1;
}): HopV55DecisionReadingArchiveV3 {
  const content: DecisionReadingContentV3 = {
    format: HOP_V55_DECISION_READING_FORMAT_V3,
    id: input.id, ownerKey: input.ownerKey, workspaceId: input.workspaceId, recordedAt: input.recordedAt,
    reading: structuredClone(input.reading), source: structuredClone(input.source), runtimeReference: input.runtimeReference,
    scopeLedger: structuredClone(input.scopeLedger), transition: structuredClone(input.transition),
    ...(input.programPreparation ? { programPreparation: structuredClone(input.programPreparation) } : {}),
  };
  if (!validateContentV3(content)) throw Error('Lecture de décision V3 ou ledger de portées incomplet.');
  const contentReference = contentReferenceV3(content);
  if (content.transition.kind === 'reviseScopes' && content.transition.parentReadingReference === contentReference) {
    throw Error('Une correction scope V3 ne peut pas être son propre parent.');
  }
  return { ...content, contentReference };
}

/**
 * Seals a semantic reading. A qualitative target keeps `required` without
 * direction here; it is never rewritten to pass the V2/V3 readers.
 */
export function createHopV55DecisionReadingArchiveV4(input: {
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55SemanticQuestionReadingV1;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  scopeLedger?: HopV55QuestionScopeLedgerV1;
  transition?: HopV55QuestionScopeTransitionV1;
  lineage?: HopV55DecisionReadingLineageV1;
  programPreparation?: HopV55ArchivedDecisionProgramPreparationV1;
}): HopV55DecisionReadingArchiveV4 {
  const content: DecisionReadingContentV4 = {
    format: HOP_V55_DECISION_READING_FORMAT_V4,
    id: input.id, ownerKey: input.ownerKey, workspaceId: input.workspaceId, recordedAt: input.recordedAt,
    reading: structuredClone(input.reading), source: structuredClone(input.source), runtimeReference: input.runtimeReference,
    ...(input.scopeLedger ? { scopeLedger: structuredClone(input.scopeLedger) } : {}),
    ...(input.transition ? { transition: structuredClone(input.transition) } : {}),
    ...(input.lineage ? { lineage: structuredClone(input.lineage) } : {}),
    ...(input.programPreparation ? { programPreparation: structuredClone(input.programPreparation) } : {}),
  };
  if (!validateContentV4(content)) throw Error('Lecture sémantique V4, portées, filiation ou préparation invalide.');
  const contentReference = contentReferenceV4(content);
  if (content.lineage?.parentReadingReference === contentReference
    || content.transition?.kind === 'reviseScopes' && content.transition.parentReadingReference === contentReference) {
    throw Error('Une lecture V4 ne peut pas être son propre parent.');
  }
  return { ...content, contentReference };
}

function invalidArchive(reason: string): HopV55DecisionReadingRead {
  return { status: 'invalidRecord', reason };
}

function readV1(value: Record<string, unknown>): HopV55DecisionReadingRead {
  if (!onlyKeys(value, ['format', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'reading', 'source', 'runtimeReference', 'contentReference'])
    || !isText(value.contentReference)) return invalidArchive('Archive de décision V1 incomplète ou contenant des champs inconnus.');
  const { contentReference: suppliedReference, ...content } = value;
  if (!validateContentV1(content)) return invalidArchive('Lecture V1, source ou référence runtime invalide.');
  try {
    if (contentReferenceV1(content) !== suppliedReference) return invalidArchive('Le contenu V1 ne correspond plus à sa référence immuable.');
  } catch { return invalidArchive('Le contenu de l’archive V1 ne peut pas être relu exactement.'); }
  return { status: 'available', archive: structuredClone({ ...content, contentReference: suppliedReference }) as HopV55DecisionReadingArchiveV1 };
}

function readV2(value: Record<string, unknown>): HopV55DecisionReadingRead {
  if (!onlyKeys(value, ['format', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'reading', 'source', 'runtimeReference', 'programPreparation', 'contentReference'])
    || !isText(value.contentReference)) return invalidArchive('Archive de décision V2 incomplète ou contenant des champs inconnus.');
  const { contentReference: suppliedReference, ...content } = value;
  if (!validateContentV2(content)) return invalidArchive('Lecture V2, corrections, source ou préparation scellée invalide.');
  try {
    if (contentReferenceV2(content) !== suppliedReference) return invalidArchive('Le contenu V2 ne correspond plus à sa référence immuable.');
  } catch { return invalidArchive('Le contenu de l’archive V2 ne peut pas être relu exactement.'); }
  return { status: 'available', archive: structuredClone({ ...content, contentReference: suppliedReference }) as HopV55DecisionReadingArchiveV2 };
}

function readV3(value: Record<string, unknown>): HopV55DecisionReadingRead {
  if (!onlyKeys(value, ['format', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'reading', 'source', 'runtimeReference',
    'scopeLedger', 'transition', 'programPreparation', 'contentReference']) || !isText(value.contentReference)) {
    return invalidArchive('Archive de décision V3 incomplète ou contenant des champs inconnus.');
  }
  const { contentReference: suppliedReference, ...content } = value;
  try {
    if (contentReferenceV3(content as unknown as DecisionReadingContentV3) !== suppliedReference) return invalidArchive('Le contenu V3 ne correspond plus à sa référence immuable.');
    if (isRecord(content.transition) && content.transition.kind === 'reviseScopes'
      && content.transition.parentReadingReference === suppliedReference) {
      return invalidArchive('Une correction scope V3 ne peut pas se référencer elle-même.');
    }
  } catch { return invalidArchive('Le contenu de l’archive V3 ne peut pas être relu exactement.'); }
  if (isRecord(content.scopeLedger) && isText(content.scopeLedger.format)
    && content.scopeLedger.format.startsWith('hop-v55-question-scope-ledger-')
    && content.scopeLedger.format !== 'hop-v55-question-scope-ledger-v1') {
    return { status: 'unsupportedFormat', format: content.scopeLedger.format, raw: structuredClone(value) };
  }
  if (isRecord(content.transition) && typeof content.transition.kind === 'string'
    && !['create', 'reviseScopes'].includes(content.transition.kind)) {
    return { status: 'unsupportedFormat', format: `scope-transition:${content.transition.kind}`, raw: structuredClone(value) };
  }
  if (!validateContentV3(content)) return invalidArchive('Lecture V3, spans/liens du scope, source ou préparation invalide.');
  return { status: 'available', archive: structuredClone({ ...(content as unknown as DecisionReadingContentV3), contentReference: suppliedReference }) as HopV55DecisionReadingArchiveV3 };
}

function readV4(value: Record<string, unknown>): HopV55DecisionReadingRead {
  if (!onlyKeys(value, ['format', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'reading', 'source', 'runtimeReference',
    'scopeLedger', 'transition', 'lineage', 'programPreparation', 'contentReference']) || !isText(value.contentReference)) {
    return invalidArchive('Archive de décision V4 incomplète ou contenant des champs inconnus.');
  }
  const { contentReference: suppliedReference, ...content } = value;
  try {
    if (contentReferenceV4(content as unknown as DecisionReadingContentV4) !== suppliedReference) {
      return invalidArchive('Le contenu V4 ne correspond plus à sa référence immuable.');
    }
  } catch { return invalidArchive('Le contenu de l’archive V4 ne peut pas être relu exactement.'); }
  // The known envelope is validated first; only then can a nested body be classified as future.
  if (!validateEnvelopeV4(content)) {
    return invalidArchive('Enveloppe V4 connue invalide : identités, date, source, runtime, filiation ou portées mal formées.');
  }
  if (isRecord(content.reading) && typeof content.reading.format === 'string'
    && content.reading.format.startsWith('hop-v55-question-semantic-reading-')
    && content.reading.format !== 'hop-v55-question-semantic-reading-v1') {
    return { status: 'unsupportedFormat', format: content.reading.format, raw: structuredClone(value) };
  }
  if (isRecord(content.scopeLedger) && isText(content.scopeLedger.format)
    && content.scopeLedger.format.startsWith('hop-v55-question-scope-ledger-')
    && content.scopeLedger.format !== 'hop-v55-question-scope-ledger-v1') {
    return { status: 'unsupportedFormat', format: content.scopeLedger.format, raw: structuredClone(value) };
  }
  if (!validateContentV4(content)) {
    return invalidArchive('Lecture sémantique V4, projection/couverture, spans, relations, portées, filiation ou préparation invalide.');
  }
  const lineage = (content as unknown as DecisionReadingContentV4).lineage;
  const transition = (content as unknown as DecisionReadingContentV4).transition;
  if (lineage?.parentReadingReference === suppliedReference
    || transition?.kind === 'reviseScopes' && transition.parentReadingReference === suppliedReference) {
    return invalidArchive('Une lecture V4 ne peut pas se référencer elle-même.');
  }
  return { status: 'available', archive: structuredClone({ ...(content as unknown as DecisionReadingContentV4), contentReference: suppliedReference }) as HopV55DecisionReadingArchiveV4 };
}

/**
 * Adapt a strict historical archive for display only; this adds no parsed or
 * guessed criteria. A semantic V4 reading is not downgraded to this shape:
 * callers use its typed annotations (see decisionReadingAccessors).
 */
export function hopV55DecisionReadingForDisplay(archive: HopV55DecisionReadingArchive): HopV55QuestionReading {
  if (archive.format === HOP_V55_DECISION_READING_FORMAT_V4) {
    throw new Error('Une lecture sémantique V4 ne se réduit pas à la lecture historique; utiliser ses annotations typées.');
  }
  if (archive.format !== HOP_V55_DECISION_READING_FORMAT) return structuredClone(archive.reading);
  return { ...structuredClone(archive.reading), criterionDrafts: [] };
}

/** Read and verify the saved record only; this function never calls a reader or brewing engine. */
export function readHopV55DecisionReadingArchive(value: unknown): HopV55DecisionReadingRead {
  if (!isRecord(value)) return { status: 'invalidRecord', reason: 'Archive de décision illisible.' };
  if (value.format === HOP_V55_DECISION_READING_FORMAT) return readV1(value);
  if (value.format === HOP_V55_DECISION_READING_FORMAT_V2) return readV2(value);
  if (value.format === HOP_V55_DECISION_READING_FORMAT_V3) return readV3(value);
  if (value.format === HOP_V55_DECISION_READING_FORMAT_V4) return readV4(value);
  const raw = (() => { try { return structuredClone(value); } catch { return value; } })();
  return { status: 'unsupportedFormat', format: typeof value.format === 'string' ? value.format : 'inconnu', raw };
}
