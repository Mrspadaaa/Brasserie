import { HOP_COMMERCIAL_PRODUCTS } from '../../domain/hopDecision/products';
import { answerHopDecision, type HopDecisionResponse } from '../../domain/hopDecision/service';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopAdviceSituation } from '../../domain/hopDecision/adviceSchema';
import type { HopDecisionProgram } from '../../domain/hopDecision/types';
import {
  buildHopV55DecisionIntent,
  buildHopV55DecisionInterpretation,
  buildHopV55DecisionPublicCriteria,
  buildHopV55DecisionSituation,
  type HopV55DecisionCorrectionV1,
  type HopV55QuestionCriterionV1,
  type HopV55QuestionReading,
} from './decision';
import {
  HOP_V55_SEMANTIC_SENSE_RULES,
  HOP_V55_SEMANTIC_UNKNOWN_STAGE_NOTE,
  assertHopV55SemanticAnnotationsV1,
  assertHopV55SemanticQuestionReadingV1,
  buildHopV55SemanticInterpretationV1,
  projectHopV55SemanticDecisionV1,
} from './decisionSemanticProjection';
import type { HopV55SemanticAnnotationV1, HopV55SemanticCorrectionV1, HopV55SemanticQuestionReadingV1 } from './questionSemanticReading';

function sameSource(left: HopV55QuestionCriterionV1['source'], right: HopV55QuestionCriterionV1['source']): boolean {
  return left.start === right.start && left.end === right.end && left.text === right.text;
}

function criterionFieldsEqual(left: HopV55QuestionCriterionV1, right: HopV55QuestionCriterionV1): boolean {
  return left.term === right.term && left.direction === right.direction && left.qualification === right.qualification
    && left.requirement === right.requirement && left.familyId === right.familyId;
}

function normalizedCorrection(
  previous: HopV55QuestionCriterionV1,
  submitted: HopV55QuestionCriterionV1,
  question: string,
): HopV55QuestionCriterionV1 {
  if (submitted.id !== previous.id || !sameSource(submitted.source, previous.source)) {
    throw new Error('Une correction garde l’ID et le fragment source exacts de la lecture précédente.');
  }
  if (!Number.isSafeInteger(submitted.source.start) || !Number.isSafeInteger(submitted.source.end)
    || submitted.source.start < 0 || submitted.source.end < submitted.source.start
    || question.slice(submitted.source.start, submitted.source.end) !== submitted.source.text) {
    throw new Error('Le fragment proposé ne correspond plus à la question originale.');
  }
  const term = submitted.term.trim();
  if (!term) throw new Error('Un critère corrigé exige un terme lisible.');
  if (submitted.requirement === 'optional') {
    if (submitted.direction !== null) throw new Error('Un critère facultatif reste une annotation sans relation demandée.');
  } else if (submitted.requirement !== 'required' || !submitted.direction) {
    throw new Error('Un critère demandé exige une relation explicite.');
  }
  const termChanged = term !== previous.term;
  const corrected: HopV55QuestionCriterionV1 = {
    ...structuredClone(submitted),
    term,
    origin: 'parser',
    ...(submitted.qualification?.trim() ? { qualification: submitted.qualification.trim() } : { qualification: undefined }),
    ...(termChanged ? { familyId: undefined, dimension: undefined, reportedProblem: undefined } : {}),
  };
  if (!criterionFieldsEqual(previous, corrected)) corrected.origin = 'brasseur';
  else corrected.origin = previous.origin;
  return corrected;
}

type ResponseView = { response?: HopDecisionResponse; unresolved: string[] };

function nonResponseUnresolved(reading: ResponseView): string[] {
  const responseMessages = new Set(reading.response?.missingInformation ?? []);
  return reading.unresolved.filter(message => !responseMessages.has(message));
}

function reevaluationBaseUnresolved(reading: ResponseView): string[] {
  const contextMessages = new Set([
    'Le programme reste null. Le contrat du conseil exige un stade : planning sert de périmètre d’exploration, sans décrire un stade réel ni une ligne à appliquer.',
    'Le moteur confirme que le programme vaut null dans cette entrée.',
  ]);
  return nonResponseUnresolved(reading).filter(message => !contextMessages.has(message));
}

const V2_ARCHIVE_FORMAT = 'hop-v55-decision-reading-v2' as const;
const NO_PROGRAM_ASSUMPTION = 'Le contrat exige un stade de conseil : planning sert ici de périmètre d’exploration faute de programme, pas de stade réel de la bière.';

function strategyExclusions(reading: Pick<ResponseView, 'response'>, requireSnapshot = true): HopAdviceSituation['exclusions'] {
  if (reading.response?.actionKind !== 'exploreStrategies') return [];
  const response = reading.response as HopDecisionResponse<'exploreStrategies'>;
  const options = response.result.options;
  if (!options.length) {
    if (!requireSnapshot) return [];
    throw new Error('Cette archive ne conserve pas de portée d’options permettant de restaurer sûrement ses exclusions de matières.');
  }
  const canonical = (rows: typeof options[number]['exclusions']) => JSON.stringify([...rows]
    .map(row => ({ materialId: row.materialId, status: row.status, reason: row.reason }))
    .sort((left, right) => left.materialId.localeCompare(right.materialId)));
  const exclusions = options[0].exclusions;
  if (!options.every(option => canonical(option.exclusions) === canonical(exclusions))) {
    throw new Error('Les options archivées ne portent pas une liste cohérente d’exclusions de matières; la relecture est refusée.');
  }
  const restored = new Map<string, HopAdviceSituation['exclusions'][number]>();
  for (const row of exclusions) {
    if (row.status === 'retained') continue;
    const certainty: HopAdviceSituation['exclusions'][number]['certainty'] = row.status === 'excluded' ? 'certain' : row.status;
    const restoredRow: HopAdviceSituation['exclusions'][number] = { materialId: row.materialId, certainty, reason: row.reason };
    const previous = restored.get(row.materialId);
    if (previous && (previous.certainty !== restoredRow.certainty || previous.reason !== restoredRow.reason)) {
      throw new Error('Une exclusion matière archivée a des portées contradictoires.');
    }
    restored.set(row.materialId, restoredRow);
  }
  return [...restored.values()];
}

/** Recover only a consistent, typed archived exclusion scope; never infer it from prose. */
export function hopV55DecisionReadingMaterialExclusions(reading: Pick<ResponseView, 'response'>): HopAdviceSituation['exclusions'] {
  return strategyExclusions(reading);
}

function validateReevaluationReading(reading: HopV55QuestionReading, archiveFormat: string): void {
  if (archiveFormat !== V2_ARCHIVE_FORMAT && archiveFormat !== 'hop-v55-decision-reading-v3') {
    throw new Error('Une lecture structurée V2 ou V3 est requise; relis explicitement le texte d’une archive V1.');
  }
  if (!reading || !Array.isArray(reading.criterionDrafts) || !Array.isArray(reading.branches)
    || !reading.intent || typeof reading.intent.question !== 'string') {
    throw new Error('La lecture ne contient pas le contrat V2 nécessaire à une réévaluation sans parseur.');
  }
  if (reading.branches.length) throw new Error('Une lecture avec branche concrète exige une nouvelle préparation typée, pas une réévaluation conseil.');
  if (!reading.response || !['exploreStrategies', 'understandProducts'].includes(reading.response.actionKind)) {
    throw new Error('Cette action archivée n’est pas une lecture conseil réévaluable.');
  }
  if (reading.response.intent.originalQuestion !== reading.intent.question) {
    throw new Error('La réponse archivée ne référence pas exactement la question de cette lecture.');
  }
  const seen = new Set<string>();
  for (const draft of reading.criterionDrafts) {
    if (!draft.id || seen.has(draft.id)) throw new Error('La lecture V2 contient un identifiant de critère vide ou répété.');
    seen.add(draft.id);
    if (!Number.isSafeInteger(draft.source.start) || !Number.isSafeInteger(draft.source.end)
      || draft.source.start < 0 || draft.source.end < draft.source.start
      || reading.intent.question.slice(draft.source.start, draft.source.end) !== draft.source.text) {
      throw new Error('Un fragment de critère ne correspond plus à la question originale.');
    }
    if (draft.requirement === 'optional' ? draft.direction !== null
      : draft.requirement !== 'required' || !draft.direction) {
      throw new Error('La relation ou l’optionalité d’un critère archivé est incohérente.');
    }
  }
  const expected = buildHopV55DecisionPublicCriteria(reading.criterionDrafts);
  if (JSON.stringify(expected) !== JSON.stringify(reading.intent.criteria)) {
    throw new Error('Les critères publics ne correspondent pas aux drafts V2 archivés.');
  }
}

/** Re-evaluates a V2 advisory reading in current context without reparsing its question. */
export function reevaluateHopV55DecisionReading(input: {
  reading: HopV55QuestionReading;
  prepared: PreparedBrewingScenarioContext;
  archiveFormat: 'hop-v55-decision-reading-v1' | 'hop-v55-decision-reading-v2' | 'hop-v55-decision-reading-v3';
  /** Parent-selected active/copy/hypothetical program; it never becomes a physical current fact. */
  program?: HopDecisionProgram;
}): HopV55QuestionReading {
  const { reading, prepared } = input;
  validateReevaluationReading(reading, input.archiveFormat);
  const drafts = structuredClone(reading.criterionDrafts);
  const current = prepared.runtime.current;
  const interpretation = buildHopV55DecisionInterpretation(drafts, current);
  const effectiveProgram = input.program ?? current?.program ?? null;
  const previousAssumptions = (reading.response?.intent.assumptions ?? []).filter(value => value !== NO_PROGRAM_ASSUMPTION);
  const materials = structuredClone(prepared.runtime.materials);
  let response: HopDecisionResponse;

  if (reading.response!.actionKind === 'understandProducts') {
    const productResponse = reading.response as HopDecisionResponse<'understandProducts'>;
    const productIds = productResponse.result.products.map(product => product.id);
    const intent = buildHopV55DecisionIntent(reading.intent.question, interpretation, drafts, previousAssumptions);
    response = answerHopDecision({ intent,
      action: { kind: 'understandProducts', productIds }, materials, products: HOP_COMMERCIAL_PRODUCTS });
  } else {
    const exclusions = strategyExclusions(reading);
    const situation = buildHopV55DecisionSituation(current, drafts, exclusions);
    if (input.program) {
      situation.program = structuredClone(input.program);
      situation.stage = input.program.stage;
    }
    const assumptions = [...previousAssumptions];
    if (!situation.program) assumptions.push(NO_PROGRAM_ASSUMPTION);
    const intent = buildHopV55DecisionIntent(reading.intent.question, interpretation, drafts, assumptions);
    response = answerHopDecision({ intent,
      action: { kind: 'exploreStrategies', situation }, materials });
  }

  const unresolved = reevaluationBaseUnresolved(reading);
  if (!effectiveProgram) unresolved.push(
    'Le programme reste null. Le contrat du conseil exige un stade : planning sert de périmètre d’exploration, sans décrire un stade réel ni une ligne à appliquer.',
  );
  if (response.actionKind === 'exploreStrategies'
    && (response as HopDecisionResponse<'exploreStrategies'>).result.limitations.some(message => message.includes('programme vaut null'))) {
    unresolved.push('Le moteur confirme que le programme vaut null dans cette entrée.');
  }
  unresolved.push(...response.missingInformation);
  return {
    ...structuredClone(reading),
    intent: { question: reading.intent.question, criteria: buildHopV55DecisionPublicCriteria(drafts) },
    criterionDrafts: drafts,
    interpretation,
    response,
    unresolved: [...new Set(unresolved.filter(value => value.trim()))],
  };
}

/**
 * Applies explicit brasseur edits to a proposed reading and recalculates the
 * supported decision response. It never tokenizes or reparses the raw question.
 * The caller archives the returned reading as a new immutable record.
 */
export function applyHopV55DecisionCriteriaCorrection(input: {
  reading: HopV55QuestionReading;
  criterionDrafts: readonly HopV55QuestionCriterionV1[];
  prepared: PreparedBrewingScenarioContext;
  sourceReadingReference: string;
  recordedAt: string;
}): HopV55QuestionReading {
  const { reading } = input;
  if (!input.sourceReadingReference.trim() || !Number.isFinite(Date.parse(input.recordedAt))) {
    throw new Error('La correction doit référencer la lecture précédente et une date d’enregistrement valide.');
  }
  if (reading.branches.length) throw new Error('Corrige d’abord l’intention; les opérations de programme restent dans leur préparation typée.');
  if (!reading.response || !['exploreStrategies', 'understandProducts'].includes(reading.response.actionKind)) {
    throw new Error('Cette lecture exige une préparation d’action séparée avant de recalculer ses critères.');
  }
  if (input.criterionDrafts.length !== reading.criterionDrafts.length) {
    throw new Error('La correction conserve chaque fragment proposé; aucune ligne n’est ajoutée ou supprimée par ce geste.');
  }

  const previousById = new Map(reading.criterionDrafts.map(row => [row.id, row]));
  if (previousById.size !== reading.criterionDrafts.length) throw new Error('Identifiants de critères répétés dans la lecture source.');
  const corrected = input.criterionDrafts.map(row => {
    const previous = previousById.get(row.id);
    if (!previous) throw new Error('Une correction ne remplace pas l’identité du fragment source.');
    return normalizedCorrection(previous, row, reading.intent.question);
  });
  const changedCriterionIds = corrected.filter(row => !criterionFieldsEqual(previousById.get(row.id)!, row)).map(row => row.id);
  if (!changedCriterionIds.length) throw new Error('Aucune correction explicite n’a été apportée aux critères.');

  const interpretation = buildHopV55DecisionInterpretation(corrected, input.prepared.runtime.current);
  const intent = buildHopV55DecisionIntent(reading.intent.question, interpretation, corrected,
    reading.response.intent.assumptions ?? []);
  const materials = structuredClone(input.prepared.runtime.materials);
  let response: HopDecisionResponse;
  if (reading.response.actionKind === 'understandProducts') {
    const productResponse = reading.response as HopDecisionResponse<'understandProducts'>;
    const productIds = productResponse.result.products.map(product => product.id);
    response = answerHopDecision({ intent,
      action: { kind: 'understandProducts', productIds }, materials, products: HOP_COMMERCIAL_PRODUCTS });
  } else {
    const exclusions = strategyExclusions(reading, false);
    response = answerHopDecision({ intent,
      action: { kind: 'exploreStrategies', situation: buildHopV55DecisionSituation(input.prepared.runtime.current, corrected, exclusions) },
      materials });
  }
  const correction: HopV55DecisionCorrectionV1 = {
    sourceReadingReference: input.sourceReadingReference,
    recordedAt: input.recordedAt,
    actor: { label: 'Brasseur' },
    changedCriterionIds,
  };
  return {
    ...structuredClone(reading),
    intent: { question: reading.intent.question, criteria: buildHopV55DecisionPublicCriteria(corrected) },
    criterionDrafts: corrected,
    correction,
    interpretation,
    response,
    unresolved: [...new Set([...nonResponseUnresolved(reading), ...response.missingInformation])],
  };
}

/*
 * Semantic V4 corrections. They keep annotation IDs and every source anchor,
 * accept an engaged qualitative target without direction, and recompute only
 * the primitive projection and the historical service response. The question
 * is never tokenized again, and this entry never falls back to the V2/V3 one.
 */

/**
 * Fields a brasseur may explicitly correct. Each difference counts in
 * `changedAnnotationIds` and switches the origin to `brasseur`; the lexicon
 * mapping is one of them, so it can never change behind another edit.
 */
const SEMANTIC_EDITABLE_KEYS = ['term', 'sense', 'requirement', 'direction', 'qualification', 'primitiveConvention', 'guard', 'inquiry',
  'mentionKind', 'subject', 'familyId', 'dimension', 'reportedProblem', 'lexicon', 'partner', 'relatedAnnotationIds'] as const;

function semanticFieldsEqual(left: HopV55SemanticAnnotationV1, right: HopV55SemanticAnnotationV1): boolean {
  return SEMANTIC_EDITABLE_KEYS.every(key => JSON.stringify(left[key] ?? null) === JSON.stringify(right[key] ?? null));
}

function normalizedSemanticCorrection(previous: HopV55SemanticAnnotationV1, submitted: HopV55SemanticAnnotationV1,
  question: string): HopV55SemanticAnnotationV1 {
  if (submitted.id !== previous.id || !sameSource(submitted.source, previous.source)) {
    throw new Error('Une correction garde l’ID et le fragment source exacts de la lecture précédente.');
  }
  if (question.slice(submitted.source.start, submitted.source.end) !== submitted.source.text) {
    throw new Error('Le fragment proposé ne correspond plus à la question originale.');
  }
  for (const anchor of ['qualifierSource', 'frameSource', 'instrumentSource'] as const) {
    if (JSON.stringify(submitted[anchor] ?? null) !== JSON.stringify(previous[anchor] ?? null)) {
      throw new Error('Les sources du qualificatif, du cadre et du moyen restent ancrées; seule l’interprétation se corrige.');
    }
  }
  if (JSON.stringify(submitted.subject?.source ?? null) !== JSON.stringify(previous.subject?.source ?? null)) {
    throw new Error('La source du sujet reste ancrée à la lecture précédente.');
  }
  if (submitted.note !== undefined && submitted.note !== previous.note) {
    throw new Error('La note de lecture n’est pas éditable; corrige le sens, le qualificatif ou le rattachement.');
  }
  const term = submitted.term.trim();
  if (!term) throw new Error('Une annotation corrigée exige un terme lisible.');
  const rules = HOP_V55_SEMANTIC_SENSE_RULES[submitted.sense];
  if (!rules || !rules.requirement.includes(submitted.requirement) || !rules.directions.includes(submitted.direction)) {
    throw new Error('Le sens, l’engagement et la direction corrigés sont incohérents; une cible qualitative reste requise sans direction.');
  }
  if (submitted.primitiveConvention !== undefined && submitted.sense !== 'qualitativeTarget') {
    throw new Error('La convention « À rechercher » ne s’applique qu’à une cible qualitative.');
  }
  const termChanged = term !== previous.term;
  const senseChanged = submitted.sense !== previous.sense;
  const qualification = submitted.qualification?.trim();
  // Unchanged term and unchanged submitted mapping keep the parent mapping; a new term without an explicit choice becomes unknown.
  const lexiconChanged = JSON.stringify(submitted.lexicon) !== JSON.stringify(previous.lexicon);
  const lexicon = lexiconChanged ? structuredClone(submitted.lexicon)
    : termChanged ? { status: 'outOfLexicon' as const } : structuredClone(previous.lexicon);
  const { guard: _guard, inquiry: _inquiry, mentionKind: _mentionKind, subject: _subject, qualification: _qualification,
    familyId: _familyId, dimension: _dimension, reportedProblem: _reportedProblem, note: _note, primitiveConvention: _convention,
    lexicon: _lexicon, ...rest } = structuredClone(submitted);
  const corrected: HopV55SemanticAnnotationV1 = {
    ...rest, term,
    ...(qualification ? { qualification } : {}),
    // The reader note describes the parser sense; it does not survive a change of sense.
    ...(!senseChanged && previous.note ? { note: previous.note } : {}),
    ...(submitted.sense === 'qualitativeTarget' && submitted.primitiveConvention ? { primitiveConvention: submitted.primitiveConvention } : {}),
    ...(submitted.sense === 'guard' ? { guard: submitted.guard ?? 'preserve' } : {}),
    ...(submitted.sense === 'investigation' ? { inquiry: submitted.inquiry ?? 'question' } : {}),
    ...(submitted.sense === 'mention' && submitted.mentionKind ? { mentionKind: submitted.mentionKind } : {}),
    ...(['reportedObservation', 'investigation'].includes(submitted.sense) && submitted.subject ? { subject: structuredClone(submitted.subject) } : {}),
    ...(!termChanged && submitted.familyId ? { familyId: submitted.familyId } : {}),
    ...(!termChanged && submitted.dimension ? { dimension: submitted.dimension } : {}),
    ...(!termChanged && submitted.reportedProblem ? { reportedProblem: submitted.reportedProblem } : {}),
    lexicon,
    origin: 'parser',
  };
  corrected.origin = semanticFieldsEqual(previous, corrected) ? previous.origin : 'brasseur';
  return corrected;
}

function semanticStageNote(prepared: PreparedBrewingScenarioContext, program?: HopDecisionProgram): string {
  return program ?? prepared.runtime.current?.program ? '' : HOP_V55_SEMANTIC_UNKNOWN_STAGE_NOTE;
}

/** Recomputes projection, canonical summary and the historical service response from typed annotations. */
function semanticResponse(input: { question: string; annotations: readonly HopV55SemanticAnnotationV1[];
  previousResponse: HopDecisionResponse; prepared: PreparedBrewingScenarioContext; assumptions: string[];
  program?: HopDecisionProgram; requireExclusionSnapshot: boolean }) {
  const projection = projectHopV55SemanticDecisionV1(input.annotations);
  const current = input.prepared.runtime.current;
  const interpretation = buildHopV55SemanticInterpretationV1(input.annotations,
    { stageNote: semanticStageNote(input.prepared, input.program) });
  const materials = structuredClone(input.prepared.runtime.materials);
  let response: HopDecisionResponse;
  if (input.previousResponse.actionKind === 'understandProducts') {
    const productIds = (input.previousResponse as HopDecisionResponse<'understandProducts'>).result.products.map(product => product.id);
    response = answerHopDecision({ intent: { originalQuestion: input.question, interpretation,
      ...(input.assumptions.length ? { assumptions: [...input.assumptions] } : {}), criteria: structuredClone(projection.domainCriteria) },
    action: { kind: 'understandProducts', productIds }, materials, products: HOP_COMMERCIAL_PRODUCTS });
  } else {
    const situation = buildHopV55DecisionSituation(current, projection.drafts,
      strategyExclusions({ response: input.previousResponse }, input.requireExclusionSnapshot));
    if (input.program) { situation.program = structuredClone(input.program); situation.stage = input.program.stage; }
    const assumptions = [...input.assumptions];
    if (input.program === undefined && !situation.program && !input.requireExclusionSnapshot) {
      // Correction keeps the archived assumptions exactly.
    } else if (!situation.program && !assumptions.includes(NO_PROGRAM_ASSUMPTION)) assumptions.push(NO_PROGRAM_ASSUMPTION);
    response = answerHopDecision({ intent: { originalQuestion: input.question, interpretation,
      ...(assumptions.length ? { assumptions } : {}), criteria: structuredClone(projection.domainCriteria) },
    action: { kind: 'exploreStrategies', situation }, materials });
  }
  return { projection, interpretation, response };
}

function assertSemanticAdviceReading(reading: HopV55SemanticQuestionReadingV1): asserts reading is HopV55SemanticQuestionReadingV1 & { response: HopDecisionResponse } {
  assertHopV55SemanticQuestionReadingV1(reading);
  if (reading.branches.length) throw new Error('Corrige d’abord l’intention; les opérations de programme restent dans leur préparation typée.');
  if (!reading.response || !['exploreStrategies', 'understandProducts'].includes(reading.response.actionKind)) {
    throw new Error('Cette lecture exige une préparation d’action séparée avant de recalculer ses critères.');
  }
  if (reading.response.intent.originalQuestion !== reading.intent.question) {
    throw new Error('La réponse archivée ne référence pas exactement la question de cette lecture.');
  }
}

/**
 * Applies explicit brasseur edits to a semantic reading. The caller archives
 * the result as a new V4 successor; the source archive stays untouched.
 */
export function applyHopV55SemanticCorrectionV1(input: {
  reading: HopV55SemanticQuestionReadingV1;
  annotations: readonly HopV55SemanticAnnotationV1[];
  prepared: PreparedBrewingScenarioContext;
  sourceReadingReference: string;
  recordedAt: string;
  /** Explicit motive shown with the correction trace. */
  reason: string;
}): HopV55SemanticQuestionReadingV1 {
  const { reading } = input;
  if (!input.sourceReadingReference.trim() || !Number.isFinite(Date.parse(input.recordedAt))) {
    throw new Error('La correction doit référencer la lecture précédente et une date d’enregistrement valide.');
  }
  if (typeof input.reason !== 'string' || !input.reason.trim()) throw new Error('Une correction sémantique exige un motif explicite.');
  assertSemanticAdviceReading(reading);
  if (input.annotations.length !== reading.annotations.length) {
    throw new Error('La correction conserve chaque fragment proposé; aucune ligne n’est ajoutée ou supprimée par ce geste.');
  }
  const previousById = new Map(reading.annotations.map(row => [row.id, row]));
  const corrected = input.annotations.map(row => {
    const previous = previousById.get(row.id);
    if (!previous) throw new Error('Une correction ne remplace pas l’identité du fragment source.');
    return normalizedSemanticCorrection(previous, row, reading.intent.question);
  });
  if (new Set(corrected.map(row => row.id)).size !== corrected.length) throw new Error('Identifiants d’annotations répétés dans la correction.');
  assertHopV55SemanticAnnotationsV1(corrected, reading.intent.question);
  const changedAnnotationIds = corrected.filter(row => !semanticFieldsEqual(previousById.get(row.id)!, row)).map(row => row.id);
  if (!changedAnnotationIds.length) throw new Error('Aucune correction explicite n’a été apportée aux annotations.');
  const { projection, interpretation, response } = semanticResponse({ question: reading.intent.question, annotations: corrected,
    previousResponse: reading.response, prepared: input.prepared, assumptions: reading.response.intent.assumptions ?? [],
    requireExclusionSnapshot: false });
  const correction: HopV55SemanticCorrectionV1 = { sourceReadingReference: input.sourceReadingReference, recordedAt: input.recordedAt,
    actor: { label: 'Brasseur' }, changedAnnotationIds, reason: input.reason.trim() };
  const next: HopV55SemanticQuestionReadingV1 = {
    ...structuredClone(reading),
    intent: { question: reading.intent.question, criteria: projection.criteria },
    annotations: corrected, projectionCoverage: projection.coverage, correction, interpretation, response,
    unresolved: [...new Set([...nonResponseUnresolved(reading), ...response.missingInformation])],
  };
  assertHopV55SemanticQuestionReadingV1(next);
  return next;
}

/** Re-evaluates a semantic advisory reading in the current context, without reparsing its question. */
export function reevaluateHopV55SemanticReadingV1(input: {
  reading: HopV55SemanticQuestionReadingV1;
  prepared: PreparedBrewingScenarioContext;
  /** Parent-selected active/copy/hypothetical program; it never becomes a physical current fact. */
  program?: HopDecisionProgram;
}): HopV55SemanticQuestionReadingV1 {
  const { reading } = input;
  assertSemanticAdviceReading(reading);
  const previousAssumptions = (reading.response.intent.assumptions ?? []).filter(value => value !== NO_PROGRAM_ASSUMPTION);
  const { projection, interpretation, response } = semanticResponse({ question: reading.intent.question,
    annotations: reading.annotations, previousResponse: reading.response, prepared: input.prepared,
    assumptions: previousAssumptions, ...(input.program ? { program: input.program } : {}), requireExclusionSnapshot: true });
  const effectiveProgram = input.program ?? input.prepared.runtime.current?.program ?? null;
  const unresolved = reevaluationBaseUnresolved(reading);
  if (!effectiveProgram) unresolved.push(
    'Le programme reste null. Le contrat du conseil exige un stade : planning sert de périmètre d’exploration, sans décrire un stade réel ni une ligne à appliquer.',
  );
  if (response.actionKind === 'exploreStrategies'
    && (response as HopDecisionResponse<'exploreStrategies'>).result.limitations.some(message => message.includes('programme vaut null'))) {
    unresolved.push('Le moteur confirme que le programme vaut null dans cette entrée.');
  }
  unresolved.push(...response.missingInformation);
  const next: HopV55SemanticQuestionReadingV1 = {
    ...structuredClone(reading),
    intent: { question: reading.intent.question, criteria: projection.criteria },
    projectionCoverage: projection.coverage, interpretation, response,
    unresolved: [...new Set(unresolved.filter(value => value.trim()))],
  };
  assertHopV55SemanticQuestionReadingV1(next);
  return next;
}
