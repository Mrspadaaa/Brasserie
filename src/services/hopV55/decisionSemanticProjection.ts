import type { HopIntentEvidenceCriterion } from '../../domain/hopDecision/intentEvidence';
import type { HopV55Intent } from './contracts';
import {
  hopV55CriterionLabel,
  hopV55CriterionRole,
  listHopV55LexiconTopicsV1,
  type HopV55CriterionDirection,
  type HopV55CriterionRequirement,
  type HopV55QuestionCriterionV1,
} from './decision';
import type {
  HopV55SemanticAnnotationV1,
  HopV55SemanticQuestionReadingV1,
  HopV55SemanticSenseV1,
} from './questionSemanticReading';

/**
 * Primitive projection of a semantic reading. The historical strategy service
 * receives only directed criteria it can express, plus engaged level targets
 * under their named « À rechercher » convention; every other annotation is
 * listed as not projected with its reason. The coverage is exhaustive and
 * disjoint, and it never claims that the service covered a target it did not
 * receive.
 */
export const HOP_V55_SEMANTIC_PROJECTION_COVERAGE_V1 = 'hop-v55-semantic-projection-coverage-v1' as const;

export type HopV55SemanticProjectionReasonV1 = 'qualitativeTargetWithoutDirection' | 'reportedObservation' | 'nonDecision'
  | 'optionalMention' | 'linkedInquiry';

export interface HopV55SemanticProjectionCoverageV1 {
  version: typeof HOP_V55_SEMANTIC_PROJECTION_COVERAGE_V1;
  /** Annotation IDs sent as historical criteria; the criterion keeps the same ID. */
  included: string[];
  notProjected: Array<{ annotationId: string; reason: HopV55SemanticProjectionReasonV1 }>;
}

export interface HopV55SemanticProjectionV1 {
  criteria: HopV55Intent['criteria'];
  domainCriteria: HopIntentEvidenceCriterion[];
  /** Historical-shape drafts of the included annotations, for the strategy situation only. */
  drafts: HopV55QuestionCriterionV1[];
  coverage: HopV55SemanticProjectionCoverageV1;
}

export const HOP_V55_SEMANTIC_SENSE_RULES: Record<HopV55SemanticSenseV1, {
  requirement: readonly HopV55CriterionRequirement[]; directions: ReadonlyArray<HopV55CriterionDirection | null>;
}> = {
  qualitativeTarget: { requirement: ['required'], directions: [null] },
  directedChange: { requirement: ['required'], directions: ['increase', 'decrease'] },
  guard: { requirement: ['required'], directions: ['keep'] },
  exclusion: { requirement: ['required'], directions: ['exclude'] },
  reportedObservation: { requirement: ['optional'], directions: [null] },
  investigation: { requirement: ['required'], directions: ['investigate'] },
  nonDecision: { requirement: ['optional'], directions: [null] },
  mention: { requirement: ['optional'], directions: [null] },
};

/** Senses whose qualifier is an exact source fragment (« faible », « haut taux », « forte »). */
export const HOP_V55_SEMANTIC_QUALIFIER_SENSES: readonly HopV55SemanticSenseV1[] = ['qualitativeTarget', 'directedChange', 'guard', 'exclusion'];

/** Unknown-stage sentence shared with the core reader; kept verbatim so both summaries agree. */
export const HOP_V55_SEMANTIC_UNKNOWN_STAGE_NOTE = ' Le stade opérationnel est inconnu; planning ne sert que de périmètre technique d’exploration.';

function projectionReason(annotation: HopV55SemanticAnnotationV1): HopV55SemanticProjectionReasonV1 | undefined {
  switch (annotation.sense) {
    case 'qualitativeTarget': return annotation.primitiveConvention ? undefined : 'qualitativeTargetWithoutDirection';
    case 'reportedObservation': return 'reportedObservation';
    case 'nonDecision': return 'nonDecision';
    case 'mention': return 'optionalMention';
    case 'investigation':
      return annotation.inquiry === 'compensation' || annotation.inquiry === 'characterization' ? 'linkedInquiry' : undefined;
    default: return undefined;
  }
}

/** Direction under which the historical service receives an annotation; the named conventions are the only non-identity cases. */
function primitiveDirection(annotation: HopV55SemanticAnnotationV1): HopV55CriterionDirection | null {
  if (annotation.sense !== 'qualitativeTarget') return annotation.direction;
  return annotation.primitiveConvention === 'targetAsIncrease' ? 'increase'
    : annotation.primitiveConvention === 'targetAsInvestigation' ? 'investigate' : null;
}

/** Historical qualification text: the exact qualifier followed by the reader note, as the core reader wrote it. */
function historicalQualification(annotation: HopV55SemanticAnnotationV1): string | undefined {
  const text = [annotation.qualification, annotation.note].filter((part): part is string => !!part).join('; ');
  return text || undefined;
}

function guardQualifier(annotation: HopV55SemanticAnnotationV1): string | undefined {
  return annotation.guard === 'noIncrease' ? 'Ne pas augmenter' : annotation.guard === 'noDecrease' ? 'Ne pas diminuer' : undefined;
}

/** Historical-shape view of every annotation, used for the strategy situation; never archived in a V1–V3 format. */
export function hopV55SemanticHistoricalDraftsV1(annotations: readonly HopV55SemanticAnnotationV1[]): HopV55QuestionCriterionV1[] {
  return annotations.map(annotation => {
    const projected = !projectionReason(annotation) && annotation.requirement === 'required' && primitiveDirection(annotation) !== null;
    const qualification = historicalQualification(annotation);
    return {
      id: annotation.id, source: structuredClone(annotation.source), term: annotation.term,
      direction: projected ? primitiveDirection(annotation) : null,
      requirement: projected ? 'required' : 'optional', origin: annotation.origin,
      ...(qualification ? { qualification } : {}),
      ...(annotation.familyId ? { familyId: annotation.familyId } : {}),
      ...(annotation.dimension ? { dimension: annotation.dimension } : {}),
      ...(annotation.reportedProblem ? { reportedProblem: annotation.reportedProblem } : {}),
    };
  });
}

export function projectHopV55SemanticDecisionV1(annotations: readonly HopV55SemanticAnnotationV1[]): HopV55SemanticProjectionV1 {
  const criteria: HopV55Intent['criteria'] = [];
  const domainCriteria: HopIntentEvidenceCriterion[] = [];
  const drafts: HopV55QuestionCriterionV1[] = [];
  const coverage: HopV55SemanticProjectionCoverageV1 = { version: HOP_V55_SEMANTIC_PROJECTION_COVERAGE_V1, included: [], notProjected: [] };
  const historical = new Map(hopV55SemanticHistoricalDraftsV1(annotations).map(draft => [draft.id, draft]));
  for (const annotation of annotations) {
    const reason = projectionReason(annotation);
    const direction = primitiveDirection(annotation);
    if (reason || annotation.requirement !== 'required' || direction === null) {
      coverage.notProjected.push({ annotationId: annotation.id, reason: reason ?? 'optionalMention' });
      continue;
    }
    const label = hopV55CriterionLabel(direction, annotation.term, guardQualifier(annotation), historicalQualification(annotation));
    criteria.push({ id: annotation.id, label, direction, ...(annotation.familyId ? { familyId: annotation.familyId } : {}) });
    domainCriteria.push({ id: annotation.id, description: label, role: hopV55CriterionRole(direction), origin: 'user',
      ...(annotation.familyId ? { familyId: annotation.familyId } : {}),
      ...(annotation.partner ? { partner: { kind: 'freeContext', text: annotation.partner.text } } : {}) });
    drafts.push(historical.get(annotation.id)!);
    coverage.included.push(annotation.id);
  }
  return { criteria, domainCriteria, drafts, coverage };
}

/*
 * Canonical summary. It is written from the typed senses, at the first reading
 * as after a correction or a reevaluation; the primitive projection never
 * decides how an annotation is described.
 */

export interface HopV55SemanticInterpretationContextV1 {
  gesturePart?: string;
  gestureNote?: string;
  stageNote?: string;
}

const GUARD_LABELS: Record<NonNullable<HopV55SemanticAnnotationV1['guard']>, string> = {
  preserve: 'À préserver', noIncrease: 'Ne pas augmenter', noDecrease: 'Ne pas diminuer',
};

function semanticSummaryLine(annotation: HopV55SemanticAnnotationV1, byId: ReadonlyMap<string, HopV55SemanticAnnotationV1>): string {
  const qualifier = annotation.qualification ? ` — ${annotation.qualification}` : '';
  const term = annotation.term;
  switch (annotation.sense) {
    // The sense alone decides the line; the projection convention never turns a level into « plus de ».
    case 'qualitativeTarget':
      return `Cible qualitative · ${term}${qualifier} (niveau visé, sans base actuelle, changement ni valeur déduits)`;
    case 'directedChange':
      return `${annotation.direction === 'increase' ? 'Hausse choisie' : 'Baisse choisie'} · ${term}${qualifier}`;
    case 'guard': return `Garde · ${GUARD_LABELS[annotation.guard ?? 'preserve']} : ${term}${qualifier}`;
    case 'exclusion': return `Exclusion · ${term}${qualifier}`;
    case 'reportedObservation': {
      const subject = annotation.subject?.source?.text;
      return `Constat rapporté · ${term}${subject ? ` (sujet : ${subject})` : ''} — aucun changement demandé`;
    }
    case 'nonDecision': return `Non-décision · ${term} — aucun changement choisi`;
    case 'mention':
      return annotation.mentionKind === 'partnerPreference' ? `Préférence de partenaire · ${term}`
        : annotation.mentionKind === 'contextNote' ? `Note de contexte · ${term}` : `Mention facultative · ${term}`;
    case 'investigation': {
      if (annotation.inquiry === 'compensation') {
        const linked = annotation.relatedAnnotationIds.map(id => byId.get(id)?.term).filter((row): row is string => !!row);
        return `Enquête de compensation · ${term}${linked.length ? `, reliée au constat « ${linked.join(' », « ')} »` : ', constat à préciser'}`;
      }
      if (annotation.inquiry === 'characterization') return `Caractérisation demandée · ${annotation.subject?.source?.text ?? term}`;
      return `Question à examiner · ${term}${annotation.note ? ` — ${annotation.note}` : ''}`;
    }
  }
}

export function buildHopV55SemanticInterpretationV1(annotations: readonly HopV55SemanticAnnotationV1[],
  context: HopV55SemanticInterpretationContextV1 = {}): string {
  const byId = new Map(annotations.map(row => [row.id, row]));
  const parts = annotations.map(row => semanticSummaryLine(row, byId));
  if (context.gesturePart) parts.push(context.gesturePart);
  const base = parts.length
    ? `Lecture sémantique proposée : ${parts.join(' ; ')}. Les annotations sont des intentions déclarées, pas des mesures ni des résultats sensoriels.`
    : 'La question originale est conservée. Aucune cible, famille ou opération supplémentaire n’est déduite.';
  return base + (context.gestureNote ?? '') + (context.stageNote ?? '');
}

/* Strict validation of the semantic reading. */

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype;
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const onlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));
const DIMENSIONS = ['aroma', 'acidity', 'alcohol', 'bioInteraction', 'hopCreep', 'matrixTransfer', 'process', 'stock', 'documentation', 'other'];
const ANNOTATION_KEYS = ['id', 'sense', 'source', 'term', 'requirement', 'direction', 'qualification', 'qualifierSource', 'note',
  'primitiveConvention', 'frameSource', 'guard', 'inquiry', 'mentionKind', 'subject', 'instrumentSource', 'familyId', 'dimension',
  'reportedProblem', 'lexicon', 'partner', 'relatedAnnotationIds', 'origin'];
let lexiconKeys: ReadonlySet<string> | undefined;
const knownLexiconKey = (key: string) => (lexiconKeys ??= new Set(listHopV55LexiconTopicsV1().map(topic => topic.key))).has(key);

function invalid(message: string): never { throw new Error(`Lecture sémantique V1 invalide : ${message}`); }

function assertSpan(value: unknown, question: string, label: string): void {
  if (!isRecord(value) || !onlyKeys(value, ['start', 'end', 'text']) || !Number.isSafeInteger(value.start) || !Number.isSafeInteger(value.end)
    || (value.start as number) < 0 || (value.end as number) <= (value.start as number) || !isText(value.text)
    || question.slice(value.start as number, value.end as number) !== value.text) invalid(`${label} doit garder un span UTF-16 exact.`);
}

function assertAnnotation(value: unknown, question: string): asserts value is HopV55SemanticAnnotationV1 {
  if (!isRecord(value) || !onlyKeys(value, ANNOTATION_KEYS) || !isText(value.id) || !isText(value.term)) invalid('annotation illisible ou champ inconnu.');
  const id = value.id as string;
  const rules = HOP_V55_SEMANTIC_SENSE_RULES[value.sense as HopV55SemanticSenseV1];
  if (!rules) invalid(`sens inconnu pour ${id}.`);
  if (!rules.requirement.includes(value.requirement as HopV55CriterionRequirement)
    || !rules.directions.includes(value.direction as HopV55CriterionDirection | null)) {
    invalid(`engagement ou direction incompatible avec le sens ${String(value.sense)} pour ${id}.`);
  }
  if (!['parser', 'brasseur'].includes(String(value.origin))) invalid(`origine de ${id} inconnue.`);
  assertSpan(value.source, question, `${id}.source`);
  for (const key of ['qualifierSource', 'frameSource', 'instrumentSource'] as const) {
    if (value[key] !== undefined) assertSpan(value[key], question, `${id}.${key}`);
  }
  if (value.qualification !== undefined && !isText(value.qualification)) invalid(`qualificatif de ${id} invalide.`);
  if (value.note !== undefined && !isText(value.note)) invalid(`note de lecture de ${id} invalide.`);
  // The parser anchors a qualifier only on a qualifier-bearing sense. After an explicit brasseur requalification
  // (target → constat or enquête), the inherited anchor stays as provenance of the first reading; it is never moved or erased.
  if (value.qualifierSource !== undefined && !HOP_V55_SEMANTIC_QUALIFIER_SENSES.includes(value.sense as HopV55SemanticSenseV1)
    && value.origin !== 'brasseur') {
    invalid(`source de qualificatif inattendue pour le sens ${String(value.sense)} de ${id}.`);
  }
  // A parser qualifier is exactly its source fragment; only an explicit brasseur correction may reinterpret it.
  if (value.origin === 'parser' && value.qualifierSource !== undefined
    && value.qualification !== (value.qualifierSource as { text: string }).text) {
    invalid(`le qualificatif de ${id} diverge de sa source exacte.`);
  }
  if (value.origin === 'parser' && value.qualification !== undefined && value.qualifierSource === undefined) {
    invalid(`le qualificatif de ${id} n’est ancré à aucune source exacte.`);
  }
  if (value.primitiveConvention !== undefined && (!['targetAsIncrease', 'targetAsInvestigation'].includes(String(value.primitiveConvention))
    || value.sense !== 'qualitativeTarget')) {
    invalid(`convention de projection de ${id} réservée à une cible qualitative.`);
  }
  if (value.sense === 'qualitativeTarget') {
    // Parser: an exact qualifier, or a wished profile anchored by its exact frame. Brasseur: an explicit qualifier or convention.
    const wishedProfile = value.primitiveConvention === 'targetAsInvestigation' && value.frameSource !== undefined;
    if (value.origin === 'parser' && value.qualifierSource === undefined && !wishedProfile) {
      invalid(`la cible qualitative ${id} doit garder la source de son qualificatif ou de son cadre de souhait.`);
    }
    if (value.origin === 'brasseur' && !isText(value.qualification) && value.primitiveConvention === undefined) {
      invalid(`la cible qualitative ${id} doit garder un qualificatif ou une convention explicite.`);
    }
  }
  if ((value.sense === 'guard') !== (value.guard !== undefined)
    || value.guard !== undefined && !['preserve', 'noIncrease', 'noDecrease'].includes(String(value.guard))) invalid(`garde de ${id} incohérente.`);
  if ((value.sense === 'investigation') !== (value.inquiry !== undefined)
    || value.inquiry !== undefined && !['question', 'compensation', 'characterization'].includes(String(value.inquiry))) invalid(`enquête de ${id} incohérente.`);
  if (value.mentionKind !== undefined && (value.sense !== 'mention'
    || !['partnerPreference', 'contextNote'].includes(String(value.mentionKind)))) invalid(`nature de mention de ${id} invalide.`);
  if (value.subject !== undefined) {
    const subject = value.subject;
    if (!isRecord(subject) || !onlyKeys(subject, ['kind', 'source']) || !['beer', 'material', 'unspecified'].includes(String(subject.kind))
      || !['reportedObservation', 'investigation'].includes(String(value.sense))) invalid(`sujet de ${id} invalide.`);
    if (subject.source !== undefined) assertSpan(subject.source, question, `${id}.subject.source`);
  }
  if (value.familyId !== undefined && !isText(value.familyId)) invalid(`famille de ${id} invalide.`);
  if (value.dimension !== undefined && !DIMENSIONS.includes(String(value.dimension))) invalid(`dimension de ${id} inconnue.`);
  if (value.reportedProblem !== undefined && typeof value.reportedProblem !== 'string') invalid(`écart rapporté de ${id} invalide.`);
  const lexicon = value.lexicon;
  if (!isRecord(lexicon) || !['lexicon', 'proposedAlias', 'outOfLexicon', 'notAProperty'].includes(String(lexicon.status))
    || (lexicon.status === 'proposedAlias' ? !onlyKeys(lexicon, ['status', 'canonicalTerm', 'key']) || !isText(lexicon.canonicalTerm)
      : lexicon.status === 'lexicon' ? !onlyKeys(lexicon, ['status', 'key']) : !onlyKeys(lexicon, ['status']))
    || lexicon.key !== undefined && (!isText(lexicon.key) || !knownLexiconKey(lexicon.key))) invalid(`statut lexical de ${id} invalide.`);
  if (value.partner !== undefined && (!isRecord(value.partner) || !onlyKeys(value.partner, ['kind', 'text'])
    || value.partner.kind !== 'freeContext' || !isText(value.partner.text))) invalid(`partenaire de ${id} invalide.`);
  if (!Array.isArray(value.relatedAnnotationIds) || !value.relatedAnnotationIds.every(isText)
    || new Set(value.relatedAnnotationIds).size !== value.relatedAnnotationIds.length || value.relatedAnnotationIds.includes(id)) {
    invalid(`relations de ${id} invalides.`);
  }
}

/** Checks one annotation list against the verbatim question; relations stay inside the list. */
export function assertHopV55SemanticAnnotationsV1(value: unknown, question: string): asserts value is HopV55SemanticAnnotationV1[] {
  if (!Array.isArray(value)) invalid('annotations absentes.');
  const ids = new Set<string>();
  for (const row of value) {
    assertAnnotation(row, question);
    if (ids.has(row.id)) invalid(`identifiant d’annotation répété : ${row.id}.`);
    ids.add(row.id);
  }
  const byId = new Map((value as HopV55SemanticAnnotationV1[]).map(row => [row.id, row]));
  for (const row of value as HopV55SemanticAnnotationV1[]) {
    for (const related of row.relatedAnnotationIds) {
      const target = byId.get(related);
      if (!target) invalid(`relation orpheline de ${row.id} vers ${related}.`);
      if (row.inquiry === 'compensation' && target.sense !== 'reportedObservation') {
        invalid(`la compensation ${row.id} ne peut se relier qu’à un constat rapporté.`);
      }
    }
  }
}

/**
 * A primitive response belongs to the projection that produced it: same
 * question and exactly the projected criteria (ID, label, role, origin,
 * family and the allowed partner fields). A response of another projection
 * is refused, not resealed.
 */
export function assertHopV55SemanticResponseBindingV1(response: unknown, question: string, projection: HopV55SemanticProjectionV1): void {
  if (!isRecord(response) || !isRecord(response.intent) || response.intent.originalQuestion !== question
    || !Array.isArray(response.intent.criteria)) invalid('réponse primitive illisible ou liée à une autre question.');
  const received = response.intent.criteria as unknown[];
  if (received.length !== projection.domainCriteria.length) invalid('la réponse primitive ne provient pas de cette projection.');
  const expected = new Map(projection.domainCriteria.map(row => [row.id, row]));
  const seen = new Set<string>();
  for (const raw of received) {
    if (!isRecord(raw) || !isText(raw.id) || seen.has(raw.id)) invalid('critère de réponse primitive illisible ou répété.');
    seen.add(raw.id);
    const criterion = expected.get(raw.id);
    const partner = raw.partner;
    const partnerMatches = criterion?.partner?.kind === 'freeContext'
      ? isRecord(partner) && onlyKeys(partner, ['kind', 'text']) && partner.kind === 'freeContext' && partner.text === criterion.partner.text
      : partner === undefined;
    if (!criterion || raw.description !== criterion.description || raw.role !== criterion.role || raw.origin !== criterion.origin
      || (raw.familyId ?? null) !== (criterion.familyId ?? null) || !partnerMatches) {
      invalid(`le critère ${raw.id} de la réponse primitive diverge de la projection.`);
    }
  }
}

/** Strict reader-side check of a semantic reading; the archive adds response schema, operation and seal checks. */
export function assertHopV55SemanticQuestionReadingV1(value: unknown): asserts value is HopV55SemanticQuestionReadingV1 {
  if (!isRecord(value) || value.format !== 'hop-v55-question-semantic-reading-v1'
    || !onlyKeys(value, ['format', 'intent', 'annotations', 'operationDrafts', 'projectionCoverage', 'correction', 'interpretation',
      'response', 'branches', 'unresolved'])) invalid('format ou champ inconnu.');
  const intent = value.intent;
  if (!isRecord(intent) || !onlyKeys(intent, ['question', 'criteria']) || !isText(intent.question) || !Array.isArray(intent.criteria)) {
    invalid('intention primitive illisible.');
  }
  const question = intent.question as string;
  assertHopV55SemanticAnnotationsV1(value.annotations, question);
  const annotations = value.annotations as HopV55SemanticAnnotationV1[];
  const projection = projectHopV55SemanticDecisionV1(annotations);
  if (JSON.stringify(projection.criteria) !== JSON.stringify(intent.criteria)) invalid('les critères primitifs ne correspondent pas aux annotations admissibles.');
  if (JSON.stringify(projection.coverage) !== JSON.stringify(value.projectionCoverage)) invalid('couverture de projection altérée ou incomplète.');
  if (value.operationDrafts !== undefined && !Array.isArray(value.operationDrafts)) invalid('opérations illisibles.');
  if (value.correction !== undefined) {
    const correction = value.correction;
    if (!isRecord(correction) || !onlyKeys(correction, ['sourceReadingReference', 'recordedAt', 'actor', 'changedAnnotationIds', 'reason'])
      || !isText(correction.sourceReadingReference) || !isText(correction.recordedAt) || !Number.isFinite(Date.parse(correction.recordedAt))
      || !isText(correction.reason)
      || !isRecord(correction.actor) || !onlyKeys(correction.actor, ['label']) || correction.actor.label !== 'Brasseur'
      || !Array.isArray(correction.changedAnnotationIds) || !correction.changedAnnotationIds.length
      || !correction.changedAnnotationIds.every(id => isText(id) && annotations.some(row => row.id === id))
      || new Set(correction.changedAnnotationIds).size !== correction.changedAnnotationIds.length) invalid('correction illisible.');
    // Every changed annotation carries the brasseur origin; an unchanged one cannot claim it silently.
    const changed = new Set(correction.changedAnnotationIds as string[]);
    if (annotations.some(row => changed.has(row.id) && row.origin !== 'brasseur')) invalid('une annotation corrigée doit porter l’origine brasseur.');
  }
  if (value.response !== undefined) assertHopV55SemanticResponseBindingV1(value.response, question, projection);
  if (typeof value.interpretation !== 'string' || !Array.isArray(value.branches)
    || !Array.isArray(value.unresolved) || !value.unresolved.every(row => typeof row === 'string')) invalid('interprétation, branches ou limites illisibles.');
}
