import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { BrewingScenarioBranchRequest } from '../../domain/brewingScenario';
import type { HopAdviceDimension } from '../../domain/hopDecision/adviceSchema';
import type { HopDecisionResponse } from '../../domain/hopDecision/service';
import type { HopV55Intent } from './contracts';
import type { HopV55ProgramOperationV1 } from './decisionProgramPreparation';
import {
  hopV55QuestionNormalizedSpan,
  hopV55QuestionQualifierSource,
  hopV55QuestionSourceAt,
  readHopV55QuestionCoreV1,
  type HopV55CriterionDirection,
  type HopV55CriterionRequirement,
  type HopV55ParsedMentionV1,
  type HopV55QuestionCoreV1,
  type HopV55QuestionCriterionV1,
  type HopV55ReaderSpanV1,
  type HopV55TargetConventionV1,
} from './decision';
import {
  HOP_V55_SEMANTIC_QUALIFIER_SENSES,
  assertHopV55SemanticQuestionReadingV1,
  buildHopV55SemanticInterpretationV1,
  projectHopV55SemanticDecisionV1,
  type HopV55SemanticProjectionCoverageV1,
} from './decisionSemanticProjection';

/**
 * Semantic reading of a V5.5 question. Each annotation states what the wording
 * commits to — a qualitative target, a chosen change, a guard, an exclusion, a
 * reported observation, an investigation, an undecided change or a mere
 * mention — with the exact property, qualifier and frame sources. `required`
 * is the engagement of the request; it never means measured, computable or
 * projectable to the historical strategy service.
 */
export const HOP_V55_QUESTION_SEMANTIC_READING_V1_FORMAT = 'hop-v55-question-semantic-reading-v1' as const;

export type HopV55SemanticSenseV1 = 'qualitativeTarget' | 'directedChange' | 'guard' | 'exclusion'
  | 'reportedObservation' | 'investigation' | 'nonDecision' | 'mention';
export type HopV55SemanticSpanV1 = HopV55QuestionCriterionV1['source'];
/** `key` names the explicit lexicon topic (« bitterness », « sweetness »…) when the reader matched one or the brasseur chose it. */
export type HopV55SemanticLexiconV1 =
  | { status: 'lexicon'; key?: string }
  | { status: 'proposedAlias'; canonicalTerm: string; key?: string }
  | { status: 'outOfLexicon' }
  | { status: 'notAProperty' };

export interface HopV55SemanticAnnotationV1 {
  id: string;
  sense: HopV55SemanticSenseV1;
  /** Exact property mention in the verbatim question. */
  source: HopV55SemanticSpanV1;
  term: string;
  requirement: HopV55CriterionRequirement;
  /** Canonical direction of the sense; a qualitative target has none, whatever its projection convention. */
  direction: HopV55CriterionDirection | null;
  /** Exact qualifier. For a parser annotation it equals `qualifierSource.text`; a brasseur correction may reinterpret it. */
  qualification?: string;
  /**
   * Exact qualifier source (« faible », « très légère », « haut taux »). A parser
   * qualitative target keeps it, unless it is a wished profile anchored by its
   * frame. After an explicit brasseur requalification it stays as inherited provenance.
   */
  qualifierSource?: HopV55SemanticSpanV1;
  /** Reader note (constat, compensation, proposed alias…); never a qualifier and never a role. */
  note?: string;
  /**
   * Named convention of the historical strategy service only: an engaged high
   * level is sent as « À rechercher » (increase), a wished profile as « À
   * examiner » (investigate). It never decides the sense, the summary or the
   * PropertyV3 role; it states neither a change nor a current base.
   */
  primitiveConvention?: HopV55TargetConventionV1;
  /** Exact act cue or operator that carries the reading. */
  frameSource?: HopV55SemanticSpanV1;
  /** Guard kind: preservation, or a relative « ne pas augmenter / diminuer ». */
  guard?: 'preserve' | 'noIncrease' | 'noDecrease';
  inquiry?: 'question' | 'compensation' | 'characterization';
  /** A mention cited as a partner preference (« mon goût de banane ») or as a context note. */
  mentionKind?: 'partnerPreference' | 'contextNote';
  /** Subject of an observation or a characterization; the beer is the default sensory subject. */
  subject?: { kind: 'beer' | 'material' | 'unspecified'; source?: HopV55SemanticSpanV1 };
  /** Means named by a compensation lead, kept as text; it is not a chosen material. */
  instrumentSource?: HopV55SemanticSpanV1;
  familyId?: string;
  dimension?: HopAdviceDimension;
  reportedProblem?: string;
  lexicon: HopV55SemanticLexiconV1;
  /** Explicit pairing context; never read back from a decision response. */
  partner?: { kind: 'freeContext'; text: string };
  relatedAnnotationIds: string[];
  origin: 'parser' | 'brasseur';
}

export interface HopV55SemanticCorrectionV1 {
  sourceReadingReference: string;
  recordedAt: string;
  actor: { label: 'Brasseur' };
  changedAnnotationIds: string[];
  /** Explicit motive of the brasseur; required for every semantic correction. */
  reason: string;
}

export interface HopV55SemanticQuestionReadingV1 {
  format: typeof HOP_V55_QUESTION_SEMANTIC_READING_V1_FORMAT;
  /** Primitive projection only: the historical criteria the strategy service can express. */
  intent: HopV55Intent;
  annotations: HopV55SemanticAnnotationV1[];
  operationDrafts?: HopV55ProgramOperationV1[];
  projectionCoverage: HopV55SemanticProjectionCoverageV1;
  correction?: HopV55SemanticCorrectionV1;
  /** Canonical summary written from the annotations, never from the primitive projection. */
  interpretation: string;
  /** Primitive service response bound to exactly this projection, when it was computed. */
  response?: HopDecisionResponse;
  branches: BrewingScenarioBranchRequest[];
  unresolved: string[];
}

const MATERIAL_SUBJECT = /\b(?:houblons?|matieres?|echantillons?|lots?|cones?|pellets?|hops?)\b/u;
const MATERIAL_PHRASE = /\b(?:(?:mon|ma|mes|notre|nos|ton|ta|tes|votre|vos|son|sa|ses|un|une|des|du|le|la|les|l|ce|cet|cette|ces|my|our|your|a|an|the|this|that)\s+)?(?:houblons?|matieres?|echantillons?|lots?|cones?|pellets?|hops?)\b/gu;
const SENSORY_VERB = /\b(?:a|ont|has|have|presente|presentent|degager?|degagent|sent|smells?|tastes?)\s+(?:(?:un|une|des|the|an?)\s+)?(?:odeur|arome|aroma|gout|taste|flavor|flavour|note)(?:\s+(?:de|d))?\s*$/u;

type CoreText = Pick<HopV55QuestionCoreV1, 'originalQuestion' | 'normalized' | 'sourceRanges'>;

const plain = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr')
  .replace(/[’']/gu, ' ').replace(/\s+/gu, ' ').trim();

function exactSpan(core: CoreText, span: HopV55ReaderSpanV1 | undefined): HopV55SemanticSpanV1 | undefined {
  if (!span || span.end <= span.start) return undefined;
  const source = hopV55QuestionSourceAt(core.originalQuestion, core.sourceRanges, span.start, span.end);
  return source.text && core.originalQuestion.slice(source.start, source.end) === source.text ? source : undefined;
}

/** The act or basis read by the core decides the sense; the historical direction is only its projection. */
function senseOf(row: HopV55ParsedMentionV1): HopV55SemanticSenseV1 {
  const { draft, meta } = row;
  if (meta?.inquiry) return 'investigation';
  if (draft.requirement === 'required' && (meta?.targetConvention === 'targetAsIncrease' && draft.direction === 'increase'
    || meta?.targetConvention === 'targetAsInvestigation' && draft.direction === 'investigate')) return 'qualitativeTarget';
  if (draft.requirement === 'required' && draft.direction === null) return 'qualitativeTarget';
  if (draft.direction === null) {
    if (meta?.actKind === 'nonCommitment') return 'nonDecision';
    if (meta?.actKind === 'reportedPerception' || meta?.actKind === 'reportedEvaluation'
      || meta?.basis === 'materialObservation') return 'reportedObservation';
    return 'mention';
  }
  if (draft.direction === 'increase' || draft.direction === 'decrease') return 'directedChange';
  if (draft.direction === 'keep') return 'guard';
  if (draft.direction === 'exclude') return 'exclusion';
  return 'investigation';
}

/** « Mon houblon maison sans analyse a une odeur résineuse »: the material phrase before the sensory verb. */
function sensorySubject(core: CoreText, mention: HopV55ReaderSpanV1): HopV55ReaderSpanV1 | undefined {
  const clauseStart = Math.max(...['.', ';', '?', '!', '\n'].map(mark => core.normalized.lastIndexOf(mark, mention.start - 1))) + 1;
  const before = core.normalized.slice(clauseStart, mention.start);
  const verb = SENSORY_VERB.exec(before);
  if (!verb) return undefined;
  const phrase = [...before.slice(0, verb.index).matchAll(MATERIAL_PHRASE)].at(-1);
  if (!phrase) return undefined;
  const start = clauseStart + (phrase.index ?? 0);
  const end = clauseStart + before.slice(0, verb.index).trimEnd().length;
  return end > start ? { start, end } : undefined;
}

function subjectOf(core: CoreText, row: HopV55ParsedMentionV1, sense: HopV55SemanticSenseV1,
  mention: HopV55ReaderSpanV1 | undefined): HopV55SemanticAnnotationV1['subject'] {
  const meta = row.meta;
  if (meta?.inquiry === 'characterization') {
    const source = exactSpan(core, meta.subject);
    return { kind: 'material', ...(source ? { source } : {}) };
  }
  if (sense !== 'reportedObservation') return undefined;
  const span = meta?.subject ?? (meta?.basis === 'materialObservation' && mention ? sensorySubject(core, mention) : undefined);
  // « L’amertume est trop forte »: the evaluated phrase is the property itself, not a distinct subject.
  const ownsMention = !!span && !!mention && span.start <= mention.start && mention.end <= span.end;
  const source = ownsMention ? undefined : exactSpan(core, span);
  if (!source) return { kind: 'beer' };
  const text = core.normalized.slice(span!.start, span!.end);
  return { kind: MATERIAL_SUBJECT.test(text) ? 'material' : 'beer', source };
}

function lexiconOf(row: HopV55ParsedMentionV1): HopV55SemanticLexiconV1 {
  const key = row.meta?.lexiconKey;
  if (row.meta?.inquiry === 'compensation') return { status: 'notAProperty' };
  if (row.meta?.alias) return { status: 'proposedAlias', canonicalTerm: row.meta.alias, ...(key ? { key } : {}) };
  return row.draft.familyId || row.draft.dimension ? { status: 'lexicon', ...(key ? { key } : {}) } : { status: 'outOfLexicon' };
}

function guardOf(row: HopV55ParsedMentionV1): HopV55SemanticAnnotationV1['guard'] {
  const qualifier = 'qualifier' in row ? row.qualifier : undefined;
  return qualifier === 'Ne pas augmenter' ? 'noIncrease' : qualifier === 'Ne pas diminuer' ? 'noDecrease' : 'preserve';
}

/** Exact qualifier fragment: the act/operator cue when it is the level itself, else the closest exact occurrence. */
function qualifierSourceOf(core: CoreText, row: HopV55ParsedMentionV1, sense: HopV55SemanticSenseV1,
  mention: HopV55ReaderSpanV1 | undefined): HopV55SemanticSpanV1 | undefined {
  if (!mention || !HOP_V55_SEMANTIC_QUALIFIER_SENSES.includes(sense)) return undefined;
  const level = row.meta?.level ?? row.draft.qualification?.split(';')[0]?.trim();
  if (!level || level.length > 32) return undefined;
  const cue = exactSpan(core, row.meta?.cue);
  if (cue && plain(cue.text) === plain(level)) return cue;
  return hopV55QuestionQualifierSource(core, mention, level);
}

/** The exact qualifier and the reader note are two fields; a note never stands in for a qualifier. */
function splitQualification(text: string | undefined, qualifierSource: HopV55SemanticSpanV1 | undefined):
  { qualification?: string; note?: string } {
  if (!text) return {};
  if (!qualifierSource) return { note: text };
  const exact = qualifierSource.text;
  if (text === exact) return { qualification: exact };
  if (text.startsWith(`${exact}; `)) return { qualification: exact, note: text.slice(exact.length + 2) };
  return { note: text };
}

/** Builds typed annotations from the shared reading pass; no rule depends on a style, a material or a sentence. */
export function hopV55SemanticAnnotationsFromCoreV1(core: HopV55QuestionCoreV1): HopV55SemanticAnnotationV1[] {
  const byActId = new Map<string, string[]>();
  for (const row of core.mentions) if (row.meta?.actId) {
    byActId.set(row.meta.actId, [...(byActId.get(row.meta.actId) ?? []), row.draft.id]);
  }
  const senses = new Map(core.mentions.map(row => [row.draft.id, senseOf(row)]));
  return core.mentions.map(row => {
    const { draft, meta } = row;
    const sense = senses.get(draft.id)!;
    const mention = hopV55QuestionNormalizedSpan(core, draft.source);
    const anchoredQualifier = qualifierSourceOf(core, row, sense, mention);
    const { qualification, note } = splitQualification(draft.qualification, anchoredQualifier);
    const qualifierSource = qualification ? anchoredQualifier : undefined;
    const frameSource = exactSpan(core, meta?.cue);
    const subject = subjectOf(core, row, sense, mention);
    const instrumentSource = exactSpan(core, meta?.instrument);
    const partner = 'domainCriterion' in row && row.domainCriterion.partner?.kind === 'freeContext'
      ? { kind: 'freeContext' as const, text: row.domainCriterion.partner.text } : undefined;
    const related = meta?.inquiry === 'compensation'
      ? (meta.relatedActIds ?? []).flatMap(actId => byActId.get(actId) ?? [])
        .filter(id => id !== draft.id && senses.get(id) === 'reportedObservation')
      : meta?.partnerId && meta.partnerId !== draft.id && senses.has(meta.partnerId) ? [meta.partnerId] : [];
    const inquiry = meta?.inquiry ?? (sense === 'investigation' ? 'question' as const : undefined);
    const mentionKind = sense !== 'mention' ? undefined : meta?.basis === 'partnerContext' ? 'partnerPreference' as const
      : meta?.basis === 'contextNote' ? 'contextNote' as const : undefined;
    // Only a draft whose historical direction differs from the canonical null keeps a named convention.
    const convention = sense === 'qualitativeTarget' && draft.direction !== null ? meta?.targetConvention : undefined;
    return {
      id: draft.id, sense, source: structuredClone(draft.source), term: draft.term,
      requirement: meta?.inquiry ? 'required' as const : draft.requirement,
      direction: meta?.inquiry ? 'investigate' as const : sense === 'qualitativeTarget' ? null : draft.direction,
      ...(qualification ? { qualification } : {}),
      ...(qualifierSource ? { qualifierSource } : {}),
      ...(note ? { note } : {}),
      ...(convention ? { primitiveConvention: convention } : {}),
      ...(frameSource ? { frameSource } : {}),
      ...(sense === 'guard' ? { guard: guardOf(row) } : {}),
      ...(inquiry ? { inquiry } : {}),
      ...(mentionKind ? { mentionKind } : {}),
      ...(subject ? { subject } : {}),
      ...(instrumentSource ? { instrumentSource } : {}),
      ...(draft.familyId ? { familyId: draft.familyId } : {}),
      ...(draft.dimension ? { dimension: draft.dimension } : {}),
      ...(draft.reportedProblem ? { reportedProblem: draft.reportedProblem } : {}),
      lexicon: lexiconOf(row),
      ...(partner ? { partner } : {}),
      relatedAnnotationIds: [...new Set(related)],
      origin: draft.origin,
    };
  });
}

/**
 * Reads the question once and keeps every engagement typed. The primitive
 * projection carries only the historical criteria; the coverage names each
 * annotation that the strategy service does not receive, without dropping it.
 * The summary is written from the annotations.
 */
export function readHopV55QuestionSemanticV1(question: string, prepared: PreparedBrewingScenarioContext): HopV55SemanticQuestionReadingV1 {
  const core = readHopV55QuestionCoreV1(question, prepared);
  const annotations = hopV55SemanticAnnotationsFromCoreV1(core);
  const projection = projectHopV55SemanticDecisionV1(annotations);
  // Temporary compatibility check: the same pass must send the service the criteria it computed with.
  if (JSON.stringify(projection.criteria) !== JSON.stringify(core.reading.intent.criteria)) {
    throw new Error('La projection primitive diverge des critères lus; la lecture sémantique n’est pas produite.');
  }
  const { response, operationDrafts } = core.reading;
  const reading: HopV55SemanticQuestionReadingV1 = {
    format: HOP_V55_QUESTION_SEMANTIC_READING_V1_FORMAT,
    intent: { question: core.originalQuestion, criteria: projection.criteria },
    annotations,
    ...(operationDrafts?.length ? { operationDrafts: structuredClone(operationDrafts) } : {}),
    projectionCoverage: projection.coverage,
    interpretation: buildHopV55SemanticInterpretationV1(annotations, core.interpretationContext),
    ...(response ? { response: structuredClone(response) } : {}),
    branches: structuredClone(core.reading.branches),
    unresolved: [...core.reading.unresolved],
  };
  assertHopV55SemanticQuestionReadingV1(reading);
  return reading;
}

export function isHopV55SemanticQuestionReadingV1(value: unknown): value is HopV55SemanticQuestionReadingV1 {
  return !!value && typeof value === 'object' && (value as { format?: unknown }).format === HOP_V55_QUESTION_SEMANTIC_READING_V1_FORMAT;
}
