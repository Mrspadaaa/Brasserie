import { listHopIntentEvidenceFamilies, type HopIntentEvidenceCriterion } from '../../domain/hopDecision/intentEvidence';
import { answerHopDecision, type HopDecisionIntent, type HopDecisionResponse } from '../../domain/hopDecision/service';
import { HOP_COMMERCIAL_PRODUCTS } from '../../domain/hopDecision/products';
import type {
  HopAdviceAssertion,
  HopAdviceDimension,
  HopAdviceSituation,
} from '../../domain/hopDecision/adviceSchema';
import type { HopDecisionMaterial, HopUse } from '../../domain/hopDecision/types';
import type {
  BrewingScenarioBranchRequest,
  BrewingScenarioBeerFact,
  BrewingScenarioRuntimeCurrent,
} from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55Intent } from './contracts';
import type { HopV55ProgramOperationV1 } from './decisionProgramPreparation';
import {
  hopV55UnavailableCue,
  hopV55UnavailableSourceId,
  readHopV55ProgramOperationDrafts,
  tryHopV55DirectGesture,
  tryHopV55UnavailableReplacementPlanner,
  type HopV55DirectGestureKindV1 as GestureKind,
  type HopV55DirectGestureV1 as Gesture,
  type HopV55MaterialMentionV1 as MaterialMention,
} from './decisionOperations';
import {
  HOP_V55_QUESTION_ACTS_VERSION,
  isUndecidedChangeAt,
  questionActsGoverning,
  readHopV55QuestionActs,
  type QuestionActIssueV1,
  type QuestionActKindV1,
  type QuestionActReadingV1,
  type QuestionActV1,
} from './questionActs';

export interface HopV55QuestionReading {
  /** Verbatim input plus only the criteria that were read locally. */
  intent: HopV55Intent;
  /** Source-backed proposals kept separate from the subset sent to the decision service. */
  criterionDrafts: HopV55QuestionCriterionV1[];
  /** Exact, incomplete typed operation proposals; never a branch or an applied change. */
  operationDrafts?: HopV55ProgramOperationV1[];
  /** Present only on a new corrected reading; the source archive stays untouched. */
  correction?: HopV55DecisionCorrectionV1;
  interpretation: string;
  response?: HopDecisionResponse;
  /** Concrete scenario templates; never writes a recipe or a batch. */
  branches: BrewingScenarioBranchRequest[];
  unresolved: string[];
}

export const HOP_V55_DECISION_CRITERIA_VERSION = 'hop-v55-question-criteria-v1' as const;

export type HopV55CriterionDirection = HopV55Intent['criteria'][number]['direction'];
export type HopV55CriterionRequirement = 'required' | 'optional';

/** A correctionable local reading, not a domain criterion until it is required and directed. */
export interface HopV55QuestionCriterionV1 {
  id: string;
  /** Exact UTF-16 span and text within the verbatim intent question. */
  source: { start: number; end: number; text: string };
  /** Exact term the brasseur can keep or correct. */
  term: string;
  /** Optionality is metadata only; it never turns into an investigation criterion. */
  direction: HopV55CriterionDirection | null;
  qualification?: string;
  requirement: HopV55CriterionRequirement;
  familyId?: string;
  dimension?: HopAdviceDimension;
  reportedProblem?: string;
  origin: 'parser' | 'brasseur';
}

export interface HopV55DecisionCorrectionV1 {
  sourceReadingReference: string;
  recordedAt: string;
  actor: { label: 'Brasseur' };
  changedCriterionIds: string[];
}

type HopV55Direction = HopV55Intent['criteria'][number]['direction'];
type IntentCriterion = HopIntentEvidenceCriterion;

/**
 * Why the reader chose a mention's reading. It feeds the semantic reading only;
 * the historical V1–V3 drafts never carry it, so their archives stay unchanged.
 */
export type HopV55MentionBasisV1 = 'act' | 'materialObservation' | 'nonGuarantee' | 'partnerContext' | 'contextNote' | 'optional' | 'risk'
  | 'notRequired' | 'relativeGuard' | 'operator' | 'level' | 'fallback';

/** Normalized-offset reading metadata kept beside a draft; never archived in the V1–V3 formats. */
export interface HopV55MentionMetaV1 {
  basis: HopV55MentionBasisV1;
  actId?: string;
  actKind?: QuestionActKindV1;
  /** Governing act cue or operator, normalized offsets. */
  cue?: ReaderSpan;
  /** Absolute level text as read (« faible », « très légère »). */
  level?: string;
  inquiry?: 'compensation' | 'characterization';
  /** Material or evaluated subject phrase, normalized offsets. */
  subject?: ReaderSpan;
  /** Means named by a compensation lead (« avec mon houblon »), normalized offsets. */
  instrument?: ReaderSpan;
  relatedActIds?: string[];
  /** Canonical lexicon term of a near-spelling proposal. */
  alias?: string;
  /** Explicit dimension topic of the prepared lexicon (« bitterness », « sweetness », « acidity »…). */
  lexiconKey?: string;
  /** Partner context annotation linked by an explicit pairing relation. */
  partnerId?: string;
  /**
   * Engaged qualitative target kept under a historical draft convention. An
   * adjacent high level (« un haut taux d’amertume », « ultra juicy ») keeps
   * « À rechercher » (increase); a wished profile without operator (« je veux
   * une bière … sucrée ») keeps « À examiner » (investigate). The semantic
   * reading names the convention instead of reading a change or a question.
   */
  targetConvention?: HopV55TargetConventionV1;
}

/** Historical projection conventions of an engaged qualitative target; neither states a change. */
export type HopV55TargetConventionV1 = 'targetAsIncrease' | 'targetAsInvestigation';

interface CriterionReading {
  draft: HopV55QuestionCriterionV1;
  publicCriterion: HopV55Intent['criteria'][number];
  domainCriterion: IntentCriterion;
  dimension?: HopAdviceDimension;
  reportedProblem?: string;
  unresolved?: string;
  qualifier?: string;
  meta?: HopV55MentionMetaV1;
}

interface OptionalCriterionReading {
  draft: HopV55QuestionCriterionV1;
  unresolved?: string;
  meta?: HopV55MentionMetaV1;
}

type ParsedCriterionReading = CriterionReading | OptionalCriterionReading;
/** One parsed mention: its historical draft plus the reading metadata used by the semantic reader. */
export type HopV55ParsedMentionV1 = ParsedCriterionReading;

interface PhraseMatch { start: number; end: number; term: string; }
interface FamilyMatch extends PhraseMatch { familyId: string; }
export interface HopV55QuestionSourceRange { start: number; end: number; }
type SourceRange = HopV55QuestionSourceRange;
export interface HopV55NormalizedQuestionV1 { text: string; sourceRanges: SourceRange[]; }
type NormalizedQuestion = HopV55NormalizedQuestionV1;
/** Offsets in the normalized question text, never in the verbatim question. */
export interface HopV55ReaderSpanV1 { start: number; end: number; }
type ReaderSpan = HopV55ReaderSpanV1;
/** Clause/act reading plus the source-backed annotations it owns. */
interface QuestionActIndex {
  reading: QuestionActReadingV1;
  materialReadings: ParsedCriterionReading[];
  compensationReadings: ParsedCriterionReading[];
}

const FAMILY_ROWS = listHopIntentEvidenceFamilies();

const normalize = (value: string): string => value.normalize('NFKD')
  .replace(/\p{M}/gu, '')
  .toLocaleLowerCase('fr')
  .replace(/[’']/gu, ' ')
  .replace(/[‐‑–—-]/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim();

function normalizeQuestionWithSourceRanges(value: string): NormalizedQuestion {
  let text = '';
  const sourceRanges: SourceRange[] = [];
  let sourceOffset = 0;
  for (const originalCharacter of value) {
    const sourceStart = sourceOffset;
    sourceOffset += originalCharacter.length;
    const normalizedCharacter = originalCharacter.normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLocaleLowerCase('fr')
      .replace(/[’']/gu, ' ')
      .replace(/[‐‑–—-]/gu, ' ');
    for (const character of normalizedCharacter) {
      if (/\s/u.test(character)) {
        if (!text) continue;
        if (text.endsWith(' ')) {
          sourceRanges[sourceRanges.length - 1].end = sourceOffset;
          continue;
        }
        text += ' ';
        sourceRanges.push({ start: sourceStart, end: sourceOffset });
        continue;
      }
      text += character;
      for (let index = 0; index < character.length; index++) sourceRanges.push({ start: sourceStart, end: sourceOffset });
    }
  }
  if (text.endsWith(' ')) {
    text = text.slice(0, -1);
    sourceRanges.pop();
  }
  return { text, sourceRanges };
}

function originalPhraseAt(
  originalQuestion: string,
  sourceRanges: readonly SourceRange[],
  start: number,
  end: number,
  fallback: string,
): string {
  const first = sourceRanges[start];
  const last = sourceRanges[end - 1];
  return first && last ? originalQuestion.slice(first.start, last.end).trim() : fallback;
}

function originalSourceAt(
  originalQuestion: string,
  sourceRanges: readonly SourceRange[],
  start: number,
  end: number,
): HopV55QuestionCriterionV1['source'] {
  const first = sourceRanges[start], last = sourceRanges[end - 1];
  if (!first || !last || end <= start) return { start: 0, end: 0, text: '' };
  return { start: first.start, end: last.end, text: originalQuestion.slice(first.start, last.end) };
}

/** Shared source-range mapping for versioned reader sidecars; offsets are UTF-16. */
export function normalizeHopV55QuestionWithSourceRanges(value: string): HopV55NormalizedQuestionV1 {
  return normalizeQuestionWithSourceRanges(value);
}

export function hopV55QuestionSourceAt(question: string, ranges: readonly SourceRange[], start: number, end: number): HopV55QuestionCriterionV1['source'] {
  return originalSourceAt(question, ranges, start, end);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^\${}()|[\]\\]/gu, '\\$&');
}

function phraseMatches(text: string, value: string): PhraseMatch[] {
  const normalizedTerm = normalize(value);
  if (!normalizedTerm) return [];
  const pattern = escapeRegExp(normalizedTerm).replace(/\s+/gu, '\\s+');
  const expression = new RegExp('(^|[^\\p{L}\\p{N}])(' + pattern + ')(?=$|[^\\p{L}\\p{N}])', 'gu');
  const matches: PhraseMatch[] = [];
  for (const match of text.matchAll(expression)) {
    const prefix = match[1] ?? '';
    const matched = match[2] ?? '';
    const start = (match.index ?? 0) + prefix.length;
    matches.push({ start, end: start + matched.length, term: matched });
  }
  return matches;
}

function normalizedSpanForSource(originalQuestion: string, text: string, sourceRanges: readonly SourceRange[],
  source: HopV55QuestionCriterionV1['source']): ReaderSpan | undefined {
  return phraseMatches(text, source.text).find(match => {
    const restored = originalSourceAt(originalQuestion, sourceRanges, match.start, match.end);
    return restored.start === source.start && restored.end === source.end && restored.text === source.text;
  });
}

/** Directional vocabulary is shared by exact lexicon terms and unresolved user terms. */
const PRESERVATION_OPERATOR_TERMS = [
  'garder', 'garde', 'gardes', 'gardez', 'gardons', 'gardent', 'gardant', 'gardais', 'gardait', 'gardions', 'gardiez', 'gardaient',
  'garderai', 'garderas', 'gardera', 'garderons', 'garderez', 'garderont', 'garderais', 'garderait', 'garderaient', 'gardé', 'gardée', 'gardés', 'gardées',
  'conserver', 'conserve', 'conserves', 'conservez', 'conservons', 'conservent', 'conservant', 'conservais', 'conservait', 'conservions', 'conserviez', 'conservaient',
  'conservera', 'conserverait', 'conserveront', 'conserverais', 'conserveraient', 'conservé', 'conservée', 'conservés', 'conservées',
  'préserver', 'préserve', 'préserves', 'préservez', 'préservons', 'préservent', 'préservant', 'préservais', 'préservait', 'préservions', 'préserviez', 'préservaient',
  'préservera', 'préserverait', 'préserveront', 'préserverais', 'préserveraient', 'préservé', 'préservée', 'préservés', 'préservées',
  'maintenir', 'maintien', 'maintiens', 'maintient', 'maintenez', 'maintenons', 'maintiennent', 'maintenant', 'maintenais', 'maintenait', 'maintenions', 'mainteniez', 'maintenaient',
  'maintiendrai', 'maintiendras', 'maintiendra', 'maintiendrons', 'maintiendrez', 'maintiendront', 'maintenu', 'maintenue', 'maintenus', 'maintenues',
  'retenir', 'retiens', 'retient', 'retenez', 'retenons', 'retiennent', 'retenant', 'retenais', 'retenait', 'retenions', 'reteniez', 'retenaient',
  'retiendrai', 'retiendras', 'retiendra', 'retiendrons', 'retiendrez', 'retiendront', 'retenu', 'retenue', 'retenus', 'retenues',
  'preserve', 'preserves', 'preserved', 'preserving', 'maintain', 'maintains', 'maintained', 'maintaining',
  'keep', 'keeps', 'kept', 'keeping', 'retain', 'retains', 'retained', 'retaining',
];
const PRESERVATION_OPERATOR_PATTERN = new RegExp(
  '\\b(?:' + PRESERVATION_OPERATOR_TERMS.map(term => escapeRegExp(normalize(term))).join('|') + ')\\b', 'u',
);
const OPTIONALITY_PATTERN = /\b(?:sans\s+(?:forcement|necessairement)|sans\s+(?:chercher|rechercher|viser)\s+(?:forcement|necessairement)|pas\s+(?:forcement|necessairement|obligatoire)|not\s+necessarily|without\s+necessarily|non\s+(?:requis|requise|obligatoire|exclu|exclue)|not\s+(?:required|excluded|mandatory)|facultatif|facultative|optional)\b/u;

interface DirectionOperator { start: number; end: number; direction: HopV55Direction; term: string; }

function lastDirectionOperator(text: string): DirectionOperator | undefined {
  const groups: Array<{ direction: HopV55Direction; terms: string[] }> = [
    { direction: 'exclude', terms: ['eviter', 'avoid', 'exclure', 'exclude', 'sans', 'without', 'no', 'not', 'pas de', 'aucun', 'aucune'] },
    { direction: 'keep', terms: PRESERVATION_OPERATOR_TERMS },
    { direction: 'decrease', terms: ['moins de', 'moins', 'less', 'reduce', 'reduire', 'diminuer', 'baisser', 'lower', 'low', 'light', 'leger', 'legere', 'faible', 'basse', 'bas taux'] },
    { direction: 'increase', terms: ['plus de', 'plus', 'davantage de', 'davantage', 'more', 'increase', 'augmenter', 'renforcer', 'stronger',
      'chercher', 'rechercher', 'seek', 'haut taux', 'haut', 'haute', 'eleve', 'elevee', 'fort', 'forte', 'high', 'higher', 'strong',
      'ultra', 'hyper', 'tres', 'super', 'very', 'highly'] },
    { direction: 'investigate', terms: ['examiner', 'comparer', 'compare', 'comprendre', 'understand', 'expliquer', 'explain', 'explorer', 'investigate', 'pourquoi', 'why',
      'soutenir', 'soutient', 'soutiennent', 'soutenu', 'soutenue', 'support', 'supports', 'supporting',
      'se marie bien avec', 'se marie avec', 's accorde avec', 's associe avec', 'se combine avec', 'pair with', 'pairs with', 'goes well with'] },
  ];
  const matches: DirectionOperator[] = [];
  for (const group of groups) for (const term of group.terms) for (const match of phraseMatches(text, term)) {
    const prefix = text.slice(Math.max(0, match.start - 20), match.start);
    if (group.direction === 'exclude' && (term === 'sans' || term === 'without')
      && isContextualBeerAlcoholCue(text, match.start)) continue;
    if (group.direction === 'keep' && term === 'garde' && /\b(?:de|du|des|la|le)\s*$/u.test(prefix)) continue;
    if (group.direction === 'increase' && ['plus', 'plus de', 'more', 'davantage', 'davantage de'].includes(term)
      && /\b(?:pas|not|no)\s*$/u.test(prefix)) continue;
    if (group.direction === 'keep' && /\b(?:ne\s+pas|pas|not|no)\s*$/u.test(prefix)) {
      matches.push({ ...match, direction: 'exclude' as const, term });
      continue;
    }
    matches.push({ ...match, direction: group.direction, term });
  }
  return matches.sort((left, right) => left.start - right.start || (right.end - right.start) - (left.end - left.start)).at(-1);
}

function explicitQualification(before: string, after: string): string | undefined {
  const highRate = before.match(/\b(?:haut|haute)\s+taux(?:\s+d(?:e)?)?\s*$/u);
  if (highRate) return 'haut taux';
  const beforeMatch = before.match(/\b(?:ultra|hyper|tres|super|very|highly|eleve|elevee|fort|forte|high|higher|strong|leger|legere|light|faible|basse|bas|low)\s*$/u);
  if (beforeMatch) return beforeMatch[0].trim();
  const afterMatch = after.match(/^\s*(?:(?:est|reste|soit|remain|is)\s+)?(ultra|hyper|tres|super|very|highly|eleve|elevee|fort|forte|high|higher|strong|light|legere|leger|faible|basse|bas|low)\b/u);
  return afterMatch?.[1];
}

/**
 * Low-level adjectives state an absolute qualitative target (« une faible
 * amertume », « une amertume légère »): no current base, no reduction and no
 * value are implied. « réduire », « moins » or a comparative (« plus légère »)
 * remain relative requests. High-level wording keeps its historical
 * « À rechercher » reading, which does not presuppose a current base either.
 */
const LOW_LEVEL_OPERATOR_TERMS = new Set(['low', 'light', 'leger', 'legere', 'faible', 'basse', 'bas taux']);
const LEVEL_LINK_WORDS = new Set(['de', 'd', 'du', 'des', 'en', 'la', 'le', 'l', 'les', 'un', 'une', 'taux', 'niveau', 'note', 'notes',
  'touche', 'touches', 'pointe', 'pointes', 'nuance', 'nuances', 'soupcon', 'accent', 'of', 'in', 'a', 'an', 'the']);
const LEVEL_INTENSIFIER = /\b(?:tres|assez|plutot|vraiment|relativement|un\s+peu|very|quite|rather|fairly)\s+$/u;
const LEVEL_MORE_BEFORE = /\b(?:plus|davantage|more)\s+$/u;
const LEVEL_LESS_BEFORE = /\b(?:moins|less)\s+$/u;
const LOW_LEVEL_WORD = '(?:faibles?|legeres?|legers?|basses?|bas|low|light|discretes?|discrets?|subtiles?|peu\\s+marquee?s?)';
const POSTNOMINAL_LOW_LEVEL = new RegExp('^\\s+(?:(?:(?:doit|doivent|devrait|devraient)\\s+(?:etre|rester)|soit|soient|reste|restent)\\s+)?'
  + '((?:(?:tres|assez|plutot|vraiment|relativement|un\\s+peu|very|quite|rather|fairly)\\s+)?' + LOW_LEVEL_WORD + ')\\b', 'u');
const POSTNOMINAL_RELATIVE_DECREASE = new RegExp('^\\s+(?:(?:(?:doit|doivent|devrait|devraient)\\s+(?:etre|devenir)|soit|soient)\\s+)?'
  + '(?:(?:un\\s+peu|beaucoup|bien|nettement|encore)\\s+)?(?:plus\\s+' + LOW_LEVEL_WORD
  + '|moins\\s+(?:fortes?|forts?|intenses?|marquees?|marques?|prononcees?|prononces?|elevees?|eleves?|hautes?|presentes?|ameres?|amers?))\\b', 'u');

const PRENOMINAL_LITTLE = /(?:^|\s)(?<!\btrop\s)((?:(?:tres|assez|un)\s+)?peu)(?:\s+(?:de|d))?\s*$/u;
const LEVEL_DESCRIPTOR_LINKS = new Set([...LEVEL_LINK_WORDS, 'gout', 'arome', 'aroma', 'taste', 'flavor', 'flavour']);

type LowLevelReading = { kind: 'absolute'; qualification: string } | { kind: 'relativeDecrease' }
  | { kind: 'relativeIncrease' } | { kind: 'detached' };

function operatorIsAdjacent(directionalBefore: string, operator: DirectionOperator): boolean {
  const gap = directionalBefore.slice(operator.end).match(/[\p{L}\p{N}]+/gu) ?? [];
  return gap.every(word => LEVEL_LINK_WORDS.has(word));
}

function postnominalLevel(after: string): LowLevelReading | undefined {
  if (POSTNOMINAL_RELATIVE_DECREASE.test(after)) return { kind: 'relativeDecrease' };
  const absolute = POSTNOMINAL_LOW_LEVEL.exec(after);
  return absolute ? { kind: 'absolute', qualification: absolute[1] } : undefined;
}

function lowLevelReading(directionalBefore: string, after: string, operator?: DirectionOperator): LowLevelReading | undefined {
  if (operator?.direction === 'decrease' && LOW_LEVEL_OPERATOR_TERMS.has(operator.term)) {
    const head = directionalBefore.slice(0, operator.start);
    if (LEVEL_MORE_BEFORE.test(head)) return { kind: 'relativeDecrease' };
    if (LEVEL_LESS_BEFORE.test(head)) return { kind: 'relativeIncrease' };
    if (operatorIsAdjacent(directionalBefore, operator)) {
      const intensifier = LEVEL_INTENSIFIER.exec(head);
      return { kind: 'absolute', qualification: directionalBefore.slice(intensifier ? intensifier.index : operator.start, operator.end).trim() };
    }
    return postnominalLevel(after) ?? { kind: 'detached' };
  }
  // An adjacent operator (« réduire l’amertume ») owns the mention; a distant one leaves room for a local level.
  if (operator && operatorIsAdjacent(directionalBefore, operator)) return undefined;
  // « une bière peu amère », « un peu d’amertume »: a stated level, not a change.
  const little = PRENOMINAL_LITTLE.exec(directionalBefore);
  if (little) return { kind: 'absolute', qualification: little[1] };
  return postnominalLevel(after);
}

function isContextualBeerAlcoholCue(text: string, cueStart: number): boolean {
  const before = prefixForMention(text, cueStart);
  return /\b(?:dans|in)\s+(?:(?:ce|cet|cette|la|le|une|un|this|that|the|a|an)\s+)*(?:biere|beer)\s*$/u.test(before);
}

function isContextualBeerAlcoholMention(text: string, start: number, term: string): boolean {
  if (!['alcool', 'alcohol'].includes(normalize(term))) return false;
  const before = prefixForMention(text, start);
  const markers = [...before.matchAll(/\b(?:sans|without)\b/gu)];
  const marker = markers.at(-1);
  return !!marker && isContextualBeerAlcoholCue(text, lastBoundaryBefore(text, start) + (marker.index ?? 0));
}

function contextualSensoryRelation(before: string): string | undefined {
  if (/\b(?:mon|ma|mes|ton|ta|tes|my|your)\s+(?:gout|taste|preference)\s+(?:de|for)\s*$/u.test(before)) {
    return 'Préférence de partenaire rapportée; pas une cible de changement.';
  }
  if (/\b(?:accompagner|accompagne|accompagnent|accompany|accompanies)\s+(?:un|une|des|the|a|an)?\s*note\s+(?:de|of)\s*$/u.test(before)) {
    return 'Note de contexte citée; pas une cible sensorielle.';
  }
  return undefined;
}

function nonGuaranteeQualification(before: string): string | undefined {
  const matches = [...before.matchAll(/\b(?:sans|without|not|no)\s+(?:necessarily\s+)?(?:guarantee\w*|garant\w*|promise\w*|promess\w*|assur\w*|assum\w*|suppos\w*|infer\w*)\b/gu)];
  const match = matches.at(-1);
  if (!match) return undefined;
  const tail = before.slice((match.index ?? 0) + match[0].length);
  const allowed = new Set(['a', 'an', 'the', 'this', 'that', 'une', 'un', 'des', 'la', 'le', 'les', 'de', 'd', 'que', 'qu', 'its', 'son', 'sa']);
  const tailWords = (tail.match(/[\p{L}\p{N}]+/gu) ?? []).map(normalize);
  return tailWords.every(word => allowed.has(word)) ? match[0] : undefined;
}

function negativeCueIntroducesNonGuarantee(text: string, cueEnd: number): boolean {
  const following = (text.slice(cueEnd, cueEnd + 48).match(/[\p{L}\p{N}]+/gu) ?? []).map(normalize);
  for (const word of following) {
    if (/^(?:guarante|garant|promise|promess|promet|assur|assum|suppos|infer|deduc|invent|imagin|pretend|claim|affirmer|affirme|inventer)/u.test(word)) return true;
    if (OPERATIONAL_FILLER_TERMS.has(word) || word === 'necessarily' || word === 'forcement') continue;
    return false;
  }
  return false;
}

function isNonInventionNegationAt(text: string, start: number): boolean {
  const before = prefixForMention(text, start);
  const markers = [...before.matchAll(/\b(?:sans|without|not|no|pas)\b/gu)];
  const marker = markers.at(-1);
  if (!marker) return false;
  const scope = before.slice((marker.index ?? 0) + marker[0].length);
  return /\b(?:guarante\w*|garant\w*|promess\w*|promise\w*|assum\w*|suppos\w*|infer\w*|deduc\w*|invent\w*|imagin\w*|pretend\w*|claim\w*|affirmer|affirme)\b/u.test(scope);
}

function isHypotheticalRisk(text: string, start: number, end: number): boolean {
  const before = prefixForMention(text, start);
  const after = text.slice(end, end + 80);
  const local = `${before} ${after}`;
  const conditionalQuestion = /\b(?:si|if)\b[\s\S]{0,120}\b(?:est\s+ce\s+que|is\s+it|whether|could|would|might|may|will)\b/u.test(before);
  const hypothetical = /\b(?:si|if)\b[\s\S]{0,100}\b(?:serai|sera|serait|serons|seront|could|would|might|may|will|risque)\b/u.test(before)
    || /\b(?:serai|sera|serait|serons|seront|could|would|might|may|will)\b/u.test(before)
    || conditionalQuestion;
  const asked = /\b(?:est ce que|whether|could|would|might|may|will)\b/u.test(before)
    || /\b(?:ou|or|au contraire|rather)\b/u.test(after);
  return hypothetical && asked && /\b(?:trop|too|pas assez|not enough|manque|insufficient)\b/u.test(local);
}

const PROFILE_CONTEXT_QUALIFIERS = new Set([
  'particulier', 'particuliere', 'particuliers', 'particulieres', 'particular', 'particulars',
  'specifique', 'specifiques', 'specific', 'specifics', 'special', 'speciale', 'speciaux', 'speciales',
  'unique', 'uniques', 'atypique', 'atypiques', 'atypical', 'atypicals', 'complexe', 'complexes', 'complex',
]);

function isContextNominalModifier(text: string, start: number, end: number, knownTerms: readonly string[]): boolean {
  const before = prefixForMention(text, start);
  const after = text.slice(end).trimStart();
  const determiner = '(?:ma|mon|mes|une|un|ce|cet|cette|la|le|les|my|your|this|that|the|a|an)';
  const profileFrame = /\b(?:profil|profile|style|type)(?:\s+(?:de|d|of)(?:\s+(?:biere|beer))?)?\s*$/u.test(before);
  const contextualFrame = /\b(?:dans|pour|in|for)\s+(?:(?:ma|mon|mes|une|un|ce|cet|cette|la|le|les|my|your|this|that|the|a|an)\s+)*$/u.test(before)
    || new RegExp(`\\b(?:dans|pour|in|for)\\s+${determiner}$`, 'u').test(before)
    || profileFrame;
  if (!contextualFrame) return false;
  const nextIsKnownProperty = knownTerms.some(term => {
    const normalizedTerm = normalize(term);
    return after === normalizedTerm || after.startsWith(normalizedTerm + ' ');
  });
  if (nextIsKnownProperty) return false;
  if (!profileFrame) return true;
  const nextWord = after.match(/^[\p{L}\p{N}]+/u)?.[0];
  return profileFrame && !!nextWord && PROFILE_CONTEXT_QUALIFIERS.has(normalize(nextWord));
}

function hasLocalOptionality(before: string, after: string): boolean {
  const matches = [...before.matchAll(new RegExp(OPTIONALITY_PATTERN.source, 'gu'))];
  const lastOptional = matches.at(-1);
  const lastDirection = lastDirectionOperator(before);
  const optionalEnd = lastOptional ? (lastOptional.index ?? 0) + lastOptional[0].length : -1;
  const optionalBeforeTerm = !!lastOptional && (!lastDirection || lastDirection.start < optionalEnd);
  const optionalAfterTerm = /^\s*(?:(?:est|reste|soit|remain|is)\s+)?(?:non\s+(?:requis|requise|obligatoire|exclu|exclue)|not\s+(?:required|excluded|mandatory)|facultatif|facultative|optional)\b/u.test(after);
  return optionalBeforeTerm || optionalAfterTerm;
}

function restoreExactQualification(originalQuestion: string, sourceRanges: readonly SourceRange[], text: string,
  start: number, end: number, qualification?: string): string | undefined {
  if (!qualification) return undefined;
  const matches = phraseMatches(text, qualification);
  const closest = matches.filter(match => match.end <= start || match.start >= end)
    .sort((left, right) => Math.min(Math.abs(start - left.end), Math.abs(left.start - end))
      - Math.min(Math.abs(start - right.end), Math.abs(right.start - end)))[0];
  if (!closest || Math.min(Math.abs(start - closest.end), Math.abs(closest.start - end)) > 48) return qualification;
  return originalPhraseAt(originalQuestion, sourceRanges, closest.start, closest.end, qualification);
}

function sourceCriterionId(source: HopV55QuestionCriterionV1['source'], term: string): string {
  const slug = normalize(term).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/gu, '') || 'term';
  return `criterion-source-${source.start}-${source.end}-${slug}`;
}

function lastBoundaryBefore(text: string, start: number): number {
  const prefix = text.slice(0, start);
  const boundaries = [
    prefix.lastIndexOf(';'), prefix.lastIndexOf('.'),
    prefix.lastIndexOf('?'), prefix.lastIndexOf('!'), prefix.lastIndexOf('\n'),
  ];
  for (const token of [' mais ', ' but ', ' however ', ' sauf ', ' except ']) boundaries.push(prefix.lastIndexOf(token));
  return Math.max(...boundaries) + 1;
}

function prefixForMention(text: string, start: number): string {
  return text.slice(lastBoundaryBefore(text, start), start).trim();
}

/** A mention reading plus why it was chosen; `basis`, `act` and `cue` never enter the historical drafts. */
interface MentionReading {
  direction: HopV55Direction | null;
  requirement: HopV55CriterionRequirement;
  reportedProblem?: string;
  qualifier?: 'Ne pas augmenter' | 'Ne pas diminuer';
  qualification?: string;
  basis: HopV55MentionBasisV1;
  act?: QuestionActV1;
  cue?: ReaderSpan;
  level?: string;
  targetConvention?: HopV55TargetConventionV1;
}

/** Level adjectives and intensifiers of the increase group; verbs and comparatives stay changes. */
const HIGH_LEVEL_OPERATOR_TERMS = new Set(['haut taux', 'haut', 'haute', 'eleve', 'elevee', 'fort', 'forte', 'high', 'strong',
  'ultra', 'hyper', 'tres', 'super', 'very', 'highly']);
const LEVEL_NEGATED_BEFORE = /\b(?:pas|not|no|ne|non)\s+$/u;
const PROFILE_GOAL_FRAME = /\b(?:je veux|je voudrais|je cherche|je recherche|j aimerais|je souhaite|nous voulons|nous voudrions|nous cherchons|nous recherchons|i want|we want|i would like|i seek|we seek)\b/gu;
const PROFILE_GOAL_REFRAMED = /\b(?:savoir|comprendre|examiner|comparer|know|understand|examine|compare)\b/u;

/**
 * « Je veux une bière de Champagne, sucrée »: a property that no operator
 * governs, inside an explicit wish frame, is an engaged profile target. The
 * historical draft keeps its « À examiner » fallback; only the reading
 * metadata names the wish frame and its exact cue.
 */
function withProfileGoal(reading: MentionReading, directionalBefore: string, directionalStart: number): MentionReading {
  if (reading.direction !== 'investigate' || reading.basis !== 'fallback') return reading;
  const goal = [...directionalBefore.matchAll(PROFILE_GOAL_FRAME)].at(-1);
  if (!goal || PROFILE_GOAL_REFRAMED.test(directionalBefore.slice((goal.index ?? 0) + goal[0].length))) return reading;
  const start = directionalStart + (goal.index ?? 0);
  return { ...reading, cue: { start, end: start + goal[0].length }, targetConvention: 'targetAsInvestigation',
    ...(reading.qualification ? { level: reading.qualification } : {}) };
}

function classifyDirection(text: string, start: number, end: number, acts?: QuestionActIndex): MentionReading {
  const boundary = lastBoundaryBefore(text, start);
  const rawBefore = text.slice(boundary, start);
  const beforeStart = boundary + rawBefore.length - rawBefore.trimStart().length;
  const before = prefixForMention(text, start);
  const after = text.slice(end, end + 48);
  const local = before + ' ' + after;

  const actReading = acts?.reading ?? readActs(text);
  const undecided = actModalityForMention(text, start, actReading, REPORTED_ACT_KINDS);
  if (undecided) return undecided;

  // An adjective attached to a reported smell/taste describes the subject; it
  // does not, by itself, ask the advice service to remove that character.
  if (/\b(?:a|ont|has|have|presente|presentent|degager?|degagent|sent|smells?|tastes?)\s+(?:(?:un|une|des|the|an?)\s+)?(?:odeur|arome|aroma|gout|taste|flavor|flavour|note)(?:\s+(?:de|d))?\s*$/u.test(before)) {
    return { direction: null, requirement: 'optional', qualification: 'Observation déclarée; aucune direction de changement formulée.',
      basis: 'materialObservation' };
  }

  const nonGuarantee = nonGuaranteeQualification(before);
  if (nonGuarantee) return { direction: 'investigate', requirement: 'required', qualification: 'Absence de garantie formulée : ' + nonGuarantee,
    basis: 'nonGuarantee' };
  const contextualRelation = contextualSensoryRelation(before);
  if (contextualRelation) return { direction: null, requirement: 'optional', qualification: contextualRelation,
    basis: contextualRelation.startsWith('Préférence') ? 'partnerContext' : 'contextNote' };

  const optionality = hasLocalOptionality(before, after);
  if (optionality) return { direction: null, requirement: 'optional', basis: 'optional' };

  if (isHypotheticalRisk(text, start, end)) return {
    direction: 'investigate', requirement: 'required',
    qualification: 'Risque conditionnel demandé; ni excès ni manque n’est constaté.', basis: 'risk',
  };
  const asked = actModalityForMention(text, start, actReading, ['deliberation', 'hypothesis']);
  if (asked) return asked;

  if (/\b(?:pas forcement|pas necessairement|not necessarily|not specifically|pas obligatoire|not required|not needed|sans (?:chercher|rechercher|viser)(?:\s+forc[eé]ment)?|without (?:seeking|looking for|aiming))\b/u.test(before)
    || /\b(?:not required|not necessary|pas necessaire|pas obligatoire)\b/u.test(after)) return { direction: 'investigate', requirement: 'required', basis: 'notRequired' };
  if (/\b(?:pas trop|not too)\b/u.test(before)) {
    const reportedProblem = /\b(?:trop|too|pas assez|not enough|manque|insufficient)\b/u.test(local)
      ? 'Le brasseur rapporte un écart qualitatif à corriger.' : undefined;
    return { direction: 'decrease', requirement: 'required', ...(reportedProblem ? { reportedProblem } : {}), basis: 'operator' };
  }

  const negatedIncrease = /\b(?:pas\s+plus|pas\s+davantage|not\s+more|no\s+more|(?:ne\s+pas|pas|do\s+not|don\s+t|not|no|sans|without|eviter(?:\s+de)?|avoid(?:\s+to|ing)?)\s+(?:trop\s+)?(?:augmenter|augmente|increase|raise|renforcer|renforce|intensifier|intensify|plus|more|davantage))\b/gu;
  const negatedDecrease = /\b(?:ne\s+pas|pas|do\s+not|don\s+t|not|no|sans|without|eviter(?:\s+de)?|avoid(?:\s+to|ing)?)\s+(?:trop\s+)?(?:diminuer|diminue|reduire|reduce|decrease|baisser|baisse|lower|moins|less)\b/gu;
  const noIncreaseMatches = [...before.matchAll(negatedIncrease)];
  const noDecreaseMatches = [...before.matchAll(negatedDecrease)];
  const noIncrease = noIncreaseMatches.at(-1);
  const noDecrease = noDecreaseMatches.at(-1);
  const latestNoChange = !noIncrease ? noDecrease : !noDecrease ? noIncrease
    : (noIncrease.index ?? -1) > (noDecrease.index ?? -1) ? noIncrease : noDecrease;
  const noChangeRemainder = latestNoChange ? before.slice((latestNoChange.index ?? 0) + latestNoChange[0].length) : '';
  const laterDirectionalCue = !!latestNoChange && (PRESERVATION_OPERATOR_PATTERN.test(noChangeRemainder)
    || /\b(?:pas assez|not enough|augmenter|augmente|increase|raise|renforcer|renforce|intensifier|intensify|plus|more|davantage|fort|forte|intense|diminuer|diminue|reduire|reduce|decrease|baisser|baisse|lower|moins|less|trop|too|sans|without|no|not|pas de|aucun|aucune|eviter|avoid|exclure|exclude)\b/u.test(noChangeRemainder));
  if (latestNoChange && !laterDirectionalCue) {
    const isNoIncrease = latestNoChange === noIncrease;
    const cueStart = beforeStart + (latestNoChange.index ?? 0);
    return { direction: 'keep', requirement: 'required', qualifier: isNoIncrease ? 'Ne pas augmenter' : 'Ne pas diminuer',
      basis: 'relativeGuard', cue: { start: cueStart, end: cueStart + latestNoChange[0].length } };
  }

  const directionalStart = beforeStart + (latestNoChange && laterDirectionalCue ? (latestNoChange.index ?? 0) + latestNoChange[0].length : 0);
  const directionalBefore = latestNoChange && laterDirectionalCue ? noChangeRemainder : before;
  const lastOperator = lastDirectionOperator(directionalBefore);
  const qualification = explicitQualification(directionalBefore, after);
  const operatorCue = lastOperator ? { start: directionalStart + lastOperator.start, end: directionalStart + lastOperator.end } : undefined;
  const operated: Pick<MentionReading, 'basis' | 'cue'> = operatorCue ? { basis: 'operator', cue: operatorCue } : { basis: 'fallback' };
  if (lastOperator?.direction === 'keep') return { direction: 'keep', requirement: 'required', ...(qualification ? { qualification } : {}), ...operated };
  if (lastOperator?.direction === 'exclude') return { direction: 'exclude', requirement: 'required', ...operated };
  const level = lowLevelReading(directionalBefore, after, lastOperator);
  if (level?.kind === 'absolute') return { direction: null, requirement: 'required', qualification: level.qualification,
    level: level.qualification, basis: 'level', ...(lastOperator?.direction === 'decrease' && operatorCue ? { cue: operatorCue } : {}) };
  if (level?.kind === 'relativeIncrease') return { direction: 'increase', requirement: 'required', ...operated };
  if (level?.kind === 'relativeDecrease') {
    const reportedProblem = /\b(?:trop|too|pas assez|not enough|manque|insufficient)\b/u.test(local)
      ? 'Le brasseur rapporte un écart qualitatif à corriger.' : undefined;
    return { direction: 'decrease', requirement: 'required', ...(reportedProblem ? { reportedProblem } : {}), ...operated };
  }
  // A low adjective attached to another noun says nothing about this mention.
  if (level?.kind === 'detached') return withProfileGoal(undirectedFallback(directionalBefore, after, local), directionalBefore, directionalStart);
  if (lastOperator?.direction === 'decrease') {
    const reportedProblem = /\b(?:trop|too|pas assez|not enough|manque|insufficient)\b/u.test(local)
      ? 'Le brasseur rapporte un écart qualitatif à corriger.' : undefined;
    return { direction: 'decrease', requirement: 'required', ...(qualification ? { qualification } : {}), ...(reportedProblem ? { reportedProblem } : {}), ...operated };
  }
  if (lastOperator?.direction === 'increase') {
    const reportedProblem = /\b(?:pas assez|not enough|manque)\b/u.test(local)
      ? 'Le brasseur rapporte un caractère insuffisant.' : undefined;
    // « un haut taux d’amertume », « ultra juicy »: an adjacent high level, not « plus » or « renforcer ».
    const head = directionalBefore.slice(0, lastOperator.start);
    const levelTarget = !reportedProblem && !!qualification && HIGH_LEVEL_OPERATOR_TERMS.has(lastOperator.term)
      && operatorIsAdjacent(directionalBefore, lastOperator)
      && !LEVEL_MORE_BEFORE.test(head) && !LEVEL_LESS_BEFORE.test(head) && !LEVEL_NEGATED_BEFORE.test(head);
    return { direction: 'increase', requirement: 'required', ...(qualification ? { qualification } : {}), ...(reportedProblem ? { reportedProblem } : {}), ...operated,
      ...(levelTarget ? { level: qualification, targetConvention: 'targetAsIncrease' as const } : {}) };
  }
  return withProfileGoal(undirectedFallback(directionalBefore, after, local), directionalBefore, directionalStart);
}

/** Reading of a mention that no adjacent operator governs. */
function undirectedFallback(directionalBefore: string, after: string, local: string): MentionReading {
  const qualification = explicitQualification(directionalBefore, after);
  const negationMarker = /\b(?:sans|without|no|not|pas de|aucun|aucune|ni|eviter|avoid|exclure|exclude)\b/gu;
  const negativeMarkers = [...directionalBefore.matchAll(negationMarker)];
  const lastNegative = negativeMarkers.at(-1);
  if (lastNegative && directionalBefore.length - ((lastNegative.index ?? 0) + lastNegative[0].length) < 56) return { direction: 'exclude', requirement: 'required', basis: 'fallback' };
  if (/\b(?:trop|too|excessif|excessive|moins|less|reduire|reduce|diminuer|decrease|baisser|lower)\b/u.test(directionalBefore)) {
    const reportedProblem = /\b(?:trop|too|pas assez|not enough|manque|insufficient)\b/u.test(local)
      ? 'Le brasseur rapporte un écart qualitatif à corriger.' : undefined;
    return { direction: 'decrease', requirement: 'required', ...(qualification ? { qualification } : {}), ...(reportedProblem ? { reportedProblem } : {}), basis: 'fallback' };
  }
  if (/\b(?:pas assez|not enough|davantage|plus|more|increase|augmenter|renforcer|stronger|fort|forte|intense|intensifier)\b/u.test(directionalBefore)) {
    const reportedProblem = /\b(?:pas assez|not enough|manque)\b/u.test(local)
      ? 'Le brasseur rapporte un caractère insuffisant.' : undefined;
    return { direction: 'increase', requirement: 'required', ...(qualification ? { qualification } : {}), ...(reportedProblem ? { reportedProblem } : {}), basis: 'fallback' };
  }
  if (PRESERVATION_OPERATOR_PATTERN.test(directionalBefore)) return { direction: 'keep', requirement: 'required', ...(qualification ? { qualification } : {}), basis: 'fallback' };
  return { direction: 'investigate', requirement: 'required', ...(qualification ? { qualification } : {}), basis: 'fallback' };
}

function criterionRole(direction: HopV55Direction): IntentCriterion['role'] {
  if (direction === 'increase') return 'seek';
  if (direction === 'decrease' || direction === 'exclude') return 'avoid';
  if (direction === 'keep') return 'preserve';
  return 'observation';
}

function criterionLabel(direction: HopV55Direction, label: string, qualifier?: string, qualification?: string): string {
  const base = qualifier ? qualifier + ' : ' + label
    : direction === 'increase' ? 'À rechercher : ' + label
      : direction === 'decrease' ? 'À réduire : ' + label
        : direction === 'keep' ? 'À préserver : ' + label
          : direction === 'exclude' ? 'À exclure : ' + label : 'À examiner : ' + label;
  return qualification ? `${base} (${qualification})` : base;
}

function requiredCriterion(input: {
  originalQuestion: string; sourceRanges: readonly SourceRange[]; text: string; start: number; end: number; term: string;
  direction: HopV55Direction; requirement: 'required'; familyId?: string; dimension?: HopAdviceDimension;
  reportedProblem?: string; qualifier?: string; qualification?: string; unresolved?: string; meta?: HopV55MentionMetaV1;
}): CriterionReading {
  const source = originalSourceAt(input.originalQuestion, input.sourceRanges, input.start, input.end);
  const term = originalPhraseAt(input.originalQuestion, input.sourceRanges, input.start, input.end, input.term);
  const qualification = restoreExactQualification(input.originalQuestion, input.sourceRanges, input.text,
    input.start, input.end, input.qualification);
  const id = sourceCriterionId(source, term);
  const label = criterionLabel(input.direction, term, input.qualifier, qualification);
  const draft: HopV55QuestionCriterionV1 = {
    id, source, term, direction: input.direction, requirement: 'required', origin: 'parser',
    ...(qualification ? { qualification } : {}),
    ...(input.familyId ? { familyId: input.familyId } : {}),
    ...(input.dimension ? { dimension: input.dimension } : {}),
    ...(input.reportedProblem ? { reportedProblem: input.reportedProblem } : {}),
  };
  return {
    draft,
    publicCriterion: { id, label, direction: input.direction, ...(input.familyId ? { familyId: input.familyId } : {}) },
    domainCriterion: { id, description: label, role: criterionRole(input.direction), origin: 'user', ...(input.familyId ? { familyId: input.familyId } : {}) },
    ...(input.dimension ? { dimension: input.dimension } : {}),
    ...(input.reportedProblem ? { reportedProblem: input.reportedProblem } : {}),
    ...(input.unresolved ? { unresolved: input.unresolved } : {}),
    ...(input.qualifier ? { qualifier: input.qualifier } : {}),
    ...(input.meta ? { meta: input.meta } : {}),
  };
}

function optionalCriterion(input: {
  originalQuestion: string; sourceRanges: readonly SourceRange[]; start: number; end: number; term: string;
  familyId?: string; dimension?: HopAdviceDimension; qualification?: string; meta?: HopV55MentionMetaV1;
}): OptionalCriterionReading {
  const source = originalSourceAt(input.originalQuestion, input.sourceRanges, input.start, input.end);
  const term = originalPhraseAt(input.originalQuestion, input.sourceRanges, input.start, input.end, input.term);
  return { draft: {
    id: sourceCriterionId(source, term), source, term, direction: null, requirement: 'optional', origin: 'parser',
    ...(input.qualification ? { qualification: input.qualification } : {}),
    ...(input.familyId ? { familyId: input.familyId } : {}),
    ...(input.dimension ? { dimension: input.dimension } : {}),
  }, ...(input.meta ? { meta: input.meta } : {}) };
}

/**
 * Required but undirected: an absolute qualitative level (« faible amertume »).
 * It stays a reader draft with its exact qualifier and is not sent to the
 * strategy service, whose criteria are relative directions.
 */
function qualitativeTargetCriterion(input: {
  originalQuestion: string; sourceRanges: readonly SourceRange[]; text: string; start: number; end: number; term: string;
  familyId?: string; dimension?: HopAdviceDimension; qualification: string; unresolved?: string; meta?: HopV55MentionMetaV1;
}): OptionalCriterionReading {
  const source = originalSourceAt(input.originalQuestion, input.sourceRanges, input.start, input.end);
  const term = originalPhraseAt(input.originalQuestion, input.sourceRanges, input.start, input.end, input.term);
  const qualification = restoreExactQualification(input.originalQuestion, input.sourceRanges, input.text,
    input.start, input.end, input.qualification) ?? input.qualification;
  return {
    draft: {
      id: sourceCriterionId(source, term), source, term, direction: null, requirement: 'required', origin: 'parser', qualification,
      ...(input.familyId ? { familyId: input.familyId } : {}),
      ...(input.dimension ? { dimension: input.dimension } : {}),
    },
    ...(input.unresolved ? { unresolved: input.unresolved } : {}),
    ...(input.meta ? { meta: input.meta } : {}),
  };
}

/** A required draft without direction is an absolute qualitative target; V2/V3 archives cannot hold it. */
export function isHopV55QualitativeTargetDraft(draft: HopV55QuestionCriterionV1): boolean {
  return draft.direction === null && draft.requirement === 'required';
}
const isQualitativeTargetDraft = isHopV55QualitativeTargetDraft;

function mentionMeta(reading: MentionReading): HopV55MentionMetaV1 {
  return {
    basis: reading.basis,
    ...(reading.act ? { actId: reading.act.id, actKind: reading.act.kind } : {}),
    ...(reading.act?.subject ? { subject: { ...reading.act.subject } } : {}),
    ...(reading.cue ? { cue: { ...reading.cue } } : {}),
    ...(reading.level ? { level: reading.level } : {}),
    ...(reading.targetConvention ? { targetConvention: reading.targetConvention } : {}),
  };
}

function criterionFromClassification(input: {
  originalQuestion: string; sourceRanges: readonly SourceRange[]; text: string; start: number; end: number; term: string;
  familyId?: string; dimension?: HopAdviceDimension; reading: MentionReading; lexiconKey?: string;
}): ParsedCriterionReading {
  const { direction, requirement, reportedProblem, qualifier, qualification } = input.reading;
  const meta = { ...mentionMeta(input.reading), ...(input.lexiconKey ? { lexiconKey: input.lexiconKey } : {}) };
  const base = { originalQuestion: input.originalQuestion, sourceRanges: input.sourceRanges, start: input.start, end: input.end,
    term: input.term, ...(input.familyId ? { familyId: input.familyId } : {}), ...(input.dimension ? { dimension: input.dimension } : {}), meta };
  if (direction === null && requirement === 'required' && qualification) {
    return qualitativeTargetCriterion({ ...base, text: input.text, qualification });
  }
  if (direction === null || requirement === 'optional') return optionalCriterion({ ...base, qualification });
  return requiredCriterion({ ...base, text: input.text, direction, requirement, reportedProblem, qualifier, qualification });
}

function readFamilyCriteria(
  text: string,
  originalQuestion: string,
  sourceRanges: readonly SourceRange[],
  acts?: QuestionActIndex,
): ParsedCriterionReading[] {
  const rows: FamilyMatch[] = [];
  for (const family of FAMILY_ROWS) for (const term of family.terms) {
    for (const match of phraseMatches(text, term)) rows.push({ ...match, familyId: family.id });
  }
  rows.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const uniqueMentions: FamilyMatch[] = [];
  for (const row of rows) {
    if (uniqueMentions.some(existing => existing.familyId === row.familyId
      && row.start < existing.end && existing.start < row.end)) continue;
    uniqueMentions.push(row);
  }

  const criteria = new Map<string, ParsedCriterionReading>();
  for (const mention of uniqueMentions) {
    const reading = classifyDirection(text, mention.start, mention.end, acts);
    const key = mention.familyId + ':' + normalize(mention.term) + ':' + (reading.direction ?? reading.requirement);
    if (criteria.has(key)) continue;
    criteria.set(key, criterionFromClassification({ originalQuestion, sourceRanges, text, start: mention.start, end: mention.end,
      term: mention.term, familyId: mention.familyId, dimension: 'aroma', reading }));
  }
  return [...criteria.values()];
}

const EXPLICIT_DIMENSION_TERMS: Array<{
  key: string; label: string; dimension: HopAdviceDimension; terms: string[];
}> = [
  { key: 'acidity', label: 'Acidité', dimension: 'acidity', terms: ['acidité', 'acidulé', 'acidulée', 'acidule', 'acidic', 'sourness'] },
  { key: 'alcohol', label: 'Alcool', dimension: 'alcohol', terms: ['alcool', 'alcohol', 'abv', '% vol', 'degré alcool'] },
  { key: 'biotransformation', label: 'Interaction avec la fermentation', dimension: 'bioInteraction',
    terms: ['biotransformation', 'bio transformation', 'biotransformer', 'interaction', 'interagir', 'interagit', 'interagissent',
      'thiol', 'beta lyase', 'β lyase', 'levure', 'souche de levure'] },
  { key: 'aroma-expression', label: 'Expression aromatique', dimension: 'aroma', terms: ['expression aromatique', 'aromatic expression'] },
  { key: 'hop-creep', label: 'Hop creep', dimension: 'hopCreep', terms: ['hop creep', 'dextrine', 'dextrines'] },
  { key: 'transfer-loss', label: 'Transfert et pertes', dimension: 'matrixTransfer',
    terms: ['transfert', 'rétention', 'retention', 'pertes', 'perte aromatique', 'matrice'] },
  { key: 'process', label: 'Conduite du houblonnage', dimension: 'process',
    terms: ['dose', 'dosage', 'emploi', 'stade', 'contact', 'température', 'temperature', 'durée', 'duree', 'dry hop', 'houblonnage'] },
  { key: 'stock', label: 'Disponibilité', dimension: 'stock', terms: ['stock', 'disponible', 'indisponible', 'rupture'] },
  { key: 'documentation', label: 'Données et chimie', dimension: 'documentation',
    terms: ['analyse', 'analysis', 'mesure', 'chimie', 'alpha', 'cohumulone', 'huile totale', 'composé', 'composés'] },
  { key: 'bitterness', label: 'Amertume', dimension: 'other', terms: ['amertume', 'amère', 'amer', 'amers', 'amères', 'bitterness', 'bitter', 'ibu'] },
  { key: 'sweetness', label: 'Sucrosité', dimension: 'other', terms: ['sucré', 'sucrée', 'sucrés', 'sucrées', 'doux', 'douce', 'douceur', 'sweet', 'sweetness'] },
  { key: 'body', label: 'Corps', dimension: 'other', terms: ['corps', 'body', 'mouthfeel'] },
];

interface ProposedLexicalAlias {
  term: string;
  familyId?: string;
  dimension?: HopAdviceDimension;
  key: string;
}

function lexicalEditDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

/** Near spellings are proposals against the loaded sensory lexicon; the source term stays exact. */
function proposedLexicalAlias(term: string): ProposedLexicalAlias | undefined {
  const normalized = normalize(term);
  if (!/^[\p{L}]+$/u.test(normalized) || normalized.length < 5) return undefined;
  // The curated family source explicitly leaves generic "fruité/fruity" unassigned.
  if (['fruite', 'fruity'].includes(normalized)) return undefined;
  const targets: ProposedLexicalAlias[] = [
    ...FAMILY_ROWS.flatMap(family => family.terms.map(candidate => ({ term: candidate, familyId: family.id, key: `family:${family.id}` }))),
    ...EXPLICIT_DIMENSION_TERMS.filter(topic => ['acidity', 'alcohol', 'bitterness', 'sweetness', 'body'].includes(topic.key))
      .flatMap(topic => topic.terms.map(candidate => ({ term: candidate, dimension: topic.dimension, key: `dimension:${topic.key}` }))),
  ];
  const matches = targets.flatMap(target => {
    const canonical = normalize(target.term);
    if (!/^[\p{L}]+$/u.test(canonical)) return [];
    const distance = lexicalEditDistance(normalized, canonical);
    const minimumLength = Math.min(normalized.length, canonical.length);
    const maximumDistance = minimumLength >= 6 ? 2 : 1;
    if (distance === 0 || distance > maximumDistance) return [];
    if (distance === 2 && normalized.slice(0, 2) !== canonical.slice(0, 2)) return [];
    return [{ target, distance }];
  }).sort((left, right) => left.distance - right.distance || left.target.key.localeCompare(right.target.key)
    || left.target.term.localeCompare(right.target.term));
  if (!matches.length) return undefined;
  const bestDistance = matches[0].distance;
  const bestTargets = new Map(matches.filter(match => match.distance === bestDistance)
    .map(match => [match.target.key, match.target]));
  if (bestTargets.size !== 1) return undefined;
  return [...bestTargets.values()][0];
}

function proposeLexicalAliases(readings: ParsedCriterionReading[], text: string, originalQuestion: string,
  sourceRanges: readonly SourceRange[]): void {
  for (const row of readings) {
    // Directed criteria and absolute qualitative targets (« faible amertum ») both keep their exact term.
    const directed = 'domainCriterion' in row && row.draft.direction !== null;
    if (row.draft.origin !== 'parser' || row.draft.requirement !== 'required' || row.draft.familyId || row.draft.dimension
      || (!directed && !isQualitativeTargetDraft(row.draft))) continue;
    const alias = proposedLexicalAlias(row.draft.term);
    if (!alias) continue;
    const normalizedSpan = normalizedSpanForSource(originalQuestion, text, sourceRanges, row.draft.source);
    const nearbyMagnitude = normalizedSpan && directed
      ? explicitQualification(prefixForMention(text, normalizedSpan.start), text.slice(normalizedSpan.end, normalizedSpan.end + 48))
      : undefined;
    if (nearbyMagnitude && !normalize(row.draft.qualification ?? '').includes(normalize(nearbyMagnitude))) {
      const exactMagnitude = normalizedSpan
        ? restoreExactQualification(originalQuestion, sourceRanges, text, normalizedSpan.start, normalizedSpan.end, nearbyMagnitude)
        : nearbyMagnitude;
      row.draft.qualification = [exactMagnitude, row.draft.qualification].filter(Boolean).join('; ');
    }
    const note = `Graphie proche de « ${alias.term} »; rapprochement proposé, à confirmer.`;
    row.draft.qualification = row.draft.qualification ? `${row.draft.qualification}; ${note}` : note;
    if (alias.familyId) { row.draft.familyId = alias.familyId; row.draft.dimension = 'aroma'; }
    if (alias.dimension) row.draft.dimension = alias.dimension;
    row.unresolved = undefined;
    if (row.meta) {
      row.meta.alias = alias.term;
      if (alias.dimension) row.meta.lexiconKey = alias.key.replace(/^dimension:/u, '');
    }
    if (!('domainCriterion' in row) || row.draft.direction === null) continue;
    const label = criterionLabel(row.draft.direction, row.draft.term, row.qualifier, row.draft.qualification);
    row.publicCriterion = { ...row.publicCriterion, label, ...(alias.familyId ? { familyId: alias.familyId } : {}) };
    row.domainCriterion = { ...row.domainCriterion, description: label, ...(alias.familyId ? { familyId: alias.familyId } : {}) };
  }
}

function readDimensionCriteria(
  text: string,
  originalQuestion: string,
  sourceRanges: readonly SourceRange[],
  acts?: QuestionActIndex,
): ParsedCriterionReading[] {
  const criteria = new Map<string, ParsedCriterionReading>();
  for (const topic of EXPLICIT_DIMENSION_TERMS) {
    const matches = topic.terms.flatMap(term => phraseMatches(text, term))
      .sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const first = topic.key === 'biotransformation'
      ? matches.find(row => !isBareCultureContextTerm(row.term)) ?? matches[0]
      : matches[0];
    if (!first) continue;
    // A perceived, evaluated or undecided first mention does not hide a later, independently directed one.
    const isUndecided = (row: PhraseMatch) => !!acts && !!actModalityForMention(text, row.start, acts.reading, REPORTED_ACT_KINDS);
    const later = isUndecided(first) ? matches.find(row => row.start >= first.end && !isUndecided(row)) : undefined;
    for (const match of later ? [first, later] : [first]) {
      if (topic.key === 'biotransformation' && isBareCultureContextTerm(match.term)
        && !hasExplicitBiologicalEffectCue(text, match.start, match.end)) continue;
      // Availability describes a source/candidate state, not a sensory property.
      // Keep the exact wording in the question and in any typed replacement draft.
      if (topic.key === 'stock') continue;
      if (topic.key === 'documentation' && isMissingAnalysisMention(text, match.start, match.end, match.term)) continue;
      if (topic.key === 'documentation' && isNonInventionNegationAt(text, match.start)) continue;
      if (topic.key === 'alcohol' && isContextualBeerAlcoholMention(text, match.start, match.term)) continue;
      if (topic.dimension === 'process' && isNegatedOperationalFieldMention(text, match.start, match.term)) continue;
      if (topic.dimension === 'process' && isContextualFrameTerm(text, match.start, match.term)) continue;
      const reading = classifyDirection(text, match.start, match.end, acts);
      const term = originalPhraseAt(originalQuestion, sourceRanges, match.start, match.end, match.term);
      const key = `${topic.key}:${match.start}:${normalize(term)}:${reading.direction ?? reading.requirement}`;
      criteria.set(key, criterionFromClassification({ originalQuestion, sourceRanges, text, start: match.start, end: match.end,
        term: match.term, dimension: topic.dimension, reading, lexiconKey: topic.key }));
    }
  }
  return [...criteria.values()];
}

function isBareCultureContextTerm(value: string): boolean {
  return ['levure', 'souche de levure', 'culture', 'yeast', 'yeast strain', 'strain'].includes(normalize(value));
}

function hasExplicitBiologicalEffectCue(text: string, start: number, end: number): boolean {
  const clause = clauseBoundsAt(text, start);
  const local = text.slice(clause.start, clause.end);
  return /\b(?:biotransform\w*|bio\s+transform\w*|interaction|interagir|interagit|effet|impact|contribution|thiol\w*|beta\s+lyase|beta-lyase|am[ée]lior\w*)\b/iu.test(local)
    || /\b(?:biotransform\w*|bio\s+transform\w*|interaction|thiol\w*|beta\s+lyase|beta-lyase)\b/iu.test(text.slice(start, end));
}

/** Verbal or nominal compensation leads read as acts; the related constat stays a separate observation. */
function compensationReadingsFromActs(acts: QuestionActReadingV1, text: string, originalQuestion: string,
  sourceRanges: readonly SourceRange[]): ParsedCriterionReading[] {
  const result: ParsedCriterionReading[] = [];
  for (const act of acts.acts) {
    if (act.kind !== 'compensationInquiry') continue;
    const criterion = optionalCriterion({ originalQuestion, sourceRanges, start: act.cue.start, end: act.cue.end,
      term: text.slice(act.cue.start, act.cue.end),
      qualification: 'Demande de compensation; propriété touchée et levier restent à qualifier.',
      meta: { basis: 'act', actId: act.id, actKind: act.kind, cue: { ...act.cue }, inquiry: 'compensation',
        relatedActIds: [...act.relatedActIds], ...(act.instrument ? { instrument: { ...act.instrument } } : {}) } });
    if (result.some(row => row.draft.id === criterion.draft.id)) continue;
    result.push(criterion);
  }
  return result;
}

/** The characterized material keeps its naming phrase; an anaphor (« ce houblon ») points back to it. */
function characterizationReadingsFromActs(acts: QuestionActReadingV1, text: string, originalQuestion: string,
  sourceRanges: readonly SourceRange[]): ParsedCriterionReading[] {
  const result: ParsedCriterionReading[] = [];
  for (const act of acts.acts) {
    if (act.kind !== 'materialCharacterization' || !act.object) continue;
    const criterion = optionalCriterion({ originalQuestion, sourceRanges, start: act.object.start, end: act.object.end,
      term: text.slice(act.object.start, act.object.end), dimension: 'documentation',
      qualification: 'Caractérisation matière demandée avant le choix; identité, forme et analyses non fournies.',
      meta: { basis: 'act', actId: act.id, actKind: act.kind, cue: { ...act.cue }, inquiry: 'characterization',
        subject: { ...act.object } } });
    if (result.some(row => row.draft.id === criterion.draft.id)) continue;
    result.push(criterion);
  }
  return result;
}

const UNDECIDED_QUALIFICATIONS: Record<'increase' | 'decrease' | 'change', string> = {
  increase: 'Aucune décision d’augmentation n’est formulée; la propriété reste sans cible choisie.',
  decrease: 'Aucune décision de diminution n’est formulée; la propriété reste sans cible choisie.',
  change: 'Aucune décision de changement n’est formulée; la propriété reste sans cible choisie.',
};
const PERCEPTION_QUALIFICATION = 'Observation déclarée; perception rapportée sans demande de changement.';
const EVALUATION_GAP_QUALIFICATION = 'Observation déclarée; écart rapporté sans demande de changement.';
const EVALUATION_STATE_QUALIFICATION = 'Observation déclarée; constat rapporté sans demande de changement.';
const EVALUATION_QUESTION_QUALIFICATION = 'Constat posé en question ou en condition; aucun écart n’est affirmé ni aucun changement décidé.';
const PERCEPTION_BREAK = /\b(?:augmenter|renforcer|reduire|diminuer|baisser|eviter|exclure|sans|plus\s+de|moins\s+de|davantage|veux|voudrais|souhaite|aimerais|cherche|chercher|increase|reduce|decrease|avoid|without|more|less|want)\b/u;
const REPORTED_ACT_KINDS: readonly QuestionActKindV1[] = ['nonCommitment', 'reportedPerception', 'reportedEvaluation', 'evaluationQuestion'];

/**
 * Modality carried by a governing act. A negation of the decision is not the
 * inverse change; a reported perception or a declarative evaluation (« ma
 * bière est trop douce ») is not a target; a question or a hypothesis about a
 * change or a state asks to examine it without choosing it.
 */
function actModalityForMention(text: string, start: number, acts: QuestionActReadingV1,
  kinds: readonly QuestionActKindV1[]): MentionReading & { qualification: string } | undefined {
  for (const act of questionActsGoverning(acts, start, kinds)) {
    const governed = { basis: 'act' as const, act, cue: { ...act.cue } };
    if (act.kind === 'nonCommitment') {
      if (act.action && start >= act.action.start && start < act.action.end) continue;
      return { direction: null, requirement: 'optional', qualification: UNDECIDED_QUALIFICATIONS[act.flavor ?? 'change'], ...governed };
    }
    if (act.kind === 'reportedPerception' || act.kind === 'reportedEvaluation' || act.kind === 'evaluationQuestion') {
      // A mention inside the evaluated subject is read from the subject; a later one must not cross a decision.
      const between = start >= act.cue.end ? text.slice(act.cue.end, start) : text.slice(act.scope.start, start);
      if (PERCEPTION_BREAK.test(between) || PRESERVATION_OPERATOR_PATTERN.test(between)) continue;
      if (act.kind === 'evaluationQuestion') return { direction: 'investigate', requirement: 'required', qualification: EVALUATION_QUESTION_QUALIFICATION, ...governed };
      return { direction: null, requirement: 'optional', qualification: act.kind === 'reportedPerception' ? PERCEPTION_QUALIFICATION
        : act.evaluation === 'state' ? EVALUATION_STATE_QUALIFICATION : EVALUATION_GAP_QUALIFICATION, ...governed };
    }
    if ((act.kind === 'deliberation' || act.kind === 'hypothesis') && act.action && start >= act.action.end) {
      return { direction: 'investigate', requirement: 'required', qualification: act.kind === 'deliberation'
        ? 'Question posée sur un changement; aucune décision n’est formulée.'
        : 'Hypothèse conditionnelle posée; aucune décision n’est formulée.', ...governed };
    }
  }
  return undefined;
}

function attachExplicitPairing(readings: ParsedCriterionReading[], text: string,
  originalQuestion: string, sourceRanges: readonly SourceRange[]): void {
  const relationPatterns = [
    /\bse\s+marie\s+bien\s+avec\b/gu,
    /\bse\s+marie\s+avec\b/gu,
    /\bde\s+marie\s+bien\s+avec\b/gu,
    /\bs\s+accorde\s+avec\b/gu,
    /\bs\s+associe\s+avec\b/gu,
    /\bse\s+combine\s+avec\b/gu,
    /\bgoes\s+well\s+with\b/gu,
    /\bpairs?\s+with\b/gu,
  ];
  const relations = relationPatterns.flatMap(pattern => [...text.matchAll(pattern)].map(match => ({
    start: match.index ?? 0, end: (match.index ?? 0) + match[0].length,
  }))).sort((left, right) => left.start - right.start);

  for (const relation of relations) {
    const rawStart = sourceRanges[relation.start]?.start;
    const rawEnd = sourceRanges[relation.end - 1]?.end;
    if (rawStart === undefined || rawEnd === undefined) continue;
    const targets = readings.filter((row): row is CriterionReading => 'domainCriterion' in row
      && row.draft.origin === 'parser'
      && row.draft.requirement === 'required' && row.draft.direction !== null
      && (row.dimension === 'aroma' || !!row.draft.familyId)
      && row.draft.source.end <= rawStart
      && !/[.!?;]/u.test(originalQuestion.slice(row.draft.source.end, rawStart)));
    const partners = readings.filter(row => row.draft.origin === 'parser' && row.draft.requirement === 'optional'
      && /partenaire|note de contexte cit[ée]e/i.test(row.draft.qualification ?? '')
      && row.draft.source.start >= rawEnd
      && !/[.!?;]/u.test(originalQuestion.slice(rawEnd, row.draft.source.start)));
    if (targets.length !== 1 || partners.length !== 1) continue;

    const target = targets[0];
    const partnerDraft = partners[0].draft;
    const partnerEndIndex = sourceRanges.findIndex(range => range.end >= partnerDraft.source.end);
    if (partnerEndIndex < 0) continue;
    const exactPartnerContext = originalPhraseAt(originalQuestion, sourceRanges, relation.end, partnerEndIndex + 1, partnerDraft.source.text);
    target.domainCriterion = {
      ...target.domainCriterion,
      // The source criterion remains the brasseur's target/preservation request.
      // The relation is supplementary proposed context; consumers that need a
      // distinct pairWith criterion can retain it as a proposal of their own.
      partner: { kind: 'freeContext', text: exactPartnerContext },
    };
    target.meta = { ...(target.meta ?? { basis: 'operator' }), partnerId: partnerDraft.id };
  }
}

function isMissingAnalysisMention(text: string, start: number, end: number, term: string): boolean {
  if (!['analyse', 'analysis'].includes(normalize(term))) return false;
  const before = text.slice(Math.max(0, start - 32), start);
  const after = text.slice(end, end + 32);
  return /\b(?:sans|without|no|not|aucun|aucune|pas\s+d(?:e)?|pas)\s*$/u.test(before)
    || /^\s*(?:absente?|manquante?|non\s+disponible|missing|absent|unavailable)\b/u.test(after);
}

const OPERATIONAL_FIELD_TERMS = new Set([
  'dose', 'dosage', 'phase', 'stade', 'stage', 'emploi', 'use', 'contact', 'temperature', 'duree', 'duration', 'timing',
  'quantite', 'quantity', 'masse', 'mass', 'volume', 'mout', 'wort', 'condition', 'conditions', 'operation', 'operations', 'step', 'parameter',
]);
const OPERATIONAL_FILLER_TERMS = new Set([
  'a', 'an', 'any', 'the', 'un', 'une', 'de', 'du', 'des', 'd', 'la', 'le', 'les', 'some',
  'non', 'pas', 'not', 'never', 'encore', 'yet', 'decide', 'choisi', 'selected', 'specified', 'defined', 'set', 'known',
  'connu', 'available', 'disponible', 'provided', 'fourni', 'measured', 'mesure', 'recorded', 'renseigne', 'determine',
  'ajouter', 'ajoute', 'add', 'doser', 'dose', 'regler', 'precise', 'specifie', 'defini', 'fixer', 'fixe', 'fixee', 'fixing', 'fixed',
  'choisir', 'choisi', 'choose', 'chosen', 'choosing', 'determiner', 'determine', 'determined', 'decider', 'decide', 'decided',
  'specifier', 'specify', 'specified', 'definir', 'define', 'defined', 'set', 'setting', 'establish', 'established', 'avant', 'before',
]);

function isNegatedOperationalFieldMention(text: string, start: number, term: string): boolean {
  if (!OPERATIONAL_FIELD_TERMS.has(normalize(term))) return false;
  const before = prefixForMention(text, start);
  const markers = [...before.matchAll(/\b(?:sans|without|no|not|pas de|aucun|aucune)\b/gu)];
  const marker = markers.at(-1);
  if (!marker) return false;
  const following = before.slice((marker.index ?? 0) + marker[0].length).match(/[\p{L}\p{N}]+/gu) ?? [];
  for (let index = 0; index < following.length; index++) {
    const word = normalize(following[index]);
    if (OPERATIONAL_FIELD_TERMS.has(word)) return true;
    if (word === 'dry' && normalize(following[index + 1] ?? '') === 'hop') return true;
    if (OPERATIONAL_FILLER_TERMS.has(word) || /^(?:decid|chois|select|specif|defin|known|connu|avail|disponib|provid|fourni|measur|mesur|record|renseigne|determin)/u.test(word)) continue;
    return false;
  }
  return true;
}

/** A negative operator applied to a missing process field is not a sensory exclusion. */
function negativeCueIntroducesOperationalField(text: string, cueEnd: number): boolean {
  const following = (text.slice(cueEnd, cueEnd + 80).match(/[\p{L}\p{N}]+/gu) ?? []).map(normalize);
  for (let index = 0; index < following.length; index++) {
    const word = following[index];
    if (OPERATIONAL_FIELD_TERMS.has(word)) return true;
    if (word === 'dry' && following[index + 1] === 'hop') return true;
    if (OPERATIONAL_FILLER_TERMS.has(word) || /^(?:decid|chois|select|specif|defin|known|connu|avail|disponib|provid|fourni|measur|mesur|record|renseigne|determin)/u.test(word)) continue;
    return false;
  }
  return false;
}

function clauseBoundsAt(text: string, position: number): ReaderSpan {
  const start = lastBoundaryBefore(text, position);
  let end = text.length;
  const tail = text.slice(position);
  const punctuation = tail.search(/[.!?;\n]/u);
  if (punctuation >= 0) end = Math.min(end, position + punctuation);
  for (const boundary of [' mais ', ' but ', ' however ', ' sauf ', ' except ']) {
    const index = text.indexOf(boundary, position);
    if (index >= 0) end = Math.min(end, index);
  }
  return { start, end };
}

function spansOverlap(left: ReaderSpan, right: ReaderSpan): boolean {
  return left.start < right.end && right.start < left.end;
}

function embeddedQuestionParticle(text: string, start: number, term: string): boolean {
  const normalized = normalize(term);
  if (!['si', 'whether'].includes(normalized)) return false;
  const before = prefixForMention(text, start);
  return /\b(?:comprendre|savoir|understand|know|wonder)\s*$/u.test(before);
}

const SENSORY_DIMENSION_KEYS = new Set(['acidity', 'bitterness', 'sweetness', 'body', 'aroma-expression']);

/** Act reading with the prepared sensory lexicon as evaluative heads (« ma bière est sucrée »). */
function readActs(text: string): QuestionActReadingV1 {
  const starts = new Set<number>();
  const terms = [...FAMILY_ROWS.flatMap(family => family.terms),
    ...EXPLICIT_DIMENSION_TERMS.filter(topic => SENSORY_DIMENSION_KEYS.has(topic.key)).flatMap(topic => topic.terms)];
  for (const term of terms) for (const match of phraseMatches(text, term)) starts.add(match.start);
  return readHopV55QuestionActs(text, { isPropertyTermAt: position => starts.has(position) });
}

function readQuestionActIndex(text: string, originalQuestion: string,
  sourceRanges: readonly SourceRange[]): QuestionActIndex {
  const reading = readActs(text);
  return {
    reading,
    materialReadings: characterizationReadingsFromActs(reading, text, originalQuestion, sourceRanges),
    compensationReadings: compensationReadingsFromActs(reading, text, originalQuestion, sourceRanges),
  };
}

function isClaimedByAct(acts: QuestionActIndex | undefined, span: ReaderSpan): boolean {
  return !!acts?.reading.claimedSpans.some(claimed => spansOverlap(claimed, span));
}

function isContextualFrameTerm(text: string, start: number, term: string): boolean {
  if (!new Set(['stade', 'stage', 'moment', 'time', 'point', 'contexte', 'context']).has(normalize(term))) return false;
  const before = prefixForMention(text, start);
  return /\b(?:a|au|dans|en|at|in)(?:\s+(?:ce|cet|cette|le|la|l|the|this|that|current|present)){0,2}\s*$/u.test(before);
}

function unresolvedIntentCriteria(
  text: string,
  originalQuestion: string,
  sourceRanges: readonly SourceRange[],
  acts?: QuestionActIndex,
): ParsedCriterionReading[] {
  const directCues: Array<{ term: string; direction: HopV55Direction }> = [
    ...['sans', 'without', 'no', 'not', 'pas de', 'aucun', 'aucune', 'eviter', 'avoid', 'exclure', 'exclude']
      .map(term => ({ term, direction: 'exclude' as const })),
    ...['plus de', 'plus', 'davantage de', 'davantage', 'haut taux de', 'haut taux d', 'high level of', 'high rate of', 'elevated level of',
      'more', 'increase', 'augmenter', 'renforcer', 'chercher', 'rechercher', 'seek',
      'ultra', 'hyper', 'tres', 'super', 'very', 'highly']
      .map(term => ({ term, direction: 'increase' as const })),
    ...['moins de', 'moins', 'less', 'reduce', 'reduire', 'diminuer', 'baisser', 'low', 'light', 'leger', 'legere', 'faible', 'basse']
      .map(term => ({ term, direction: 'decrease' as const })),
    ...PRESERVATION_OPERATOR_TERMS.map(term => ({ term, direction: 'keep' as const })),
    ...['comparer', 'compare', 'comprendre', 'understand', 'expliquer', 'explain', 'explorer', 'investigate',
      'soutenir', 'soutient', 'soutiennent', 'soutenu', 'soutenue', 'support', 'supports', 'supporting',
      'accompagner', 'accompagne', 'accompagnent', 'accompany', 'accompanies',
      'se marie bien avec', 'se marie avec', 'de marie bien avec', 's accorde avec', 's associe avec', 'se combine avec', 'pair with', 'pairs with', 'goes well with']
      .map(term => ({ term, direction: 'investigate' as const })),
  ];
  const coordinatedCues = ['ni', 'nor', 'ou', 'or'].map(term => ({ term, direction: 'exclude' as const }));
  const knownTerms = [
    ...FAMILY_ROWS.flatMap(family => family.terms),
    ...EXPLICIT_DIMENSION_TERMS.flatMap(topic => topic.terms),
  ];
  const stopWords = new Set([
    'a', 'au', 'aux', 'de', 'des', 'du', 'd', 'la', 'le', 'les', 'l', 'un', 'une', 'dans', 'cote', 'source', 'information', 'info', 'analyse', 'analysis',
    'qu', 'que', 'qui', 'quel', 'quelle', 'quels', 'quelles', 'lequel', 'laquelle', 'lesquels', 'lesquelles',
    'elle', 'elles', 'il', 'ils', 'on', 'soit', 'est', 'sont', 'etre', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'their', 'my', 'your',
    'gout', 'taste', 'flavor', 'flavour', 'arome', 'aroma', 'note', 'notes',
    'chercher', 'rechercher', 'viser', 'vouloir', 'veut', 'cherche', 'recherche',
    'forcément', 'forcement', 'necessairement', 'necessarily', 'specifically',
    'pas', 'plus', 'trop', 'seeking', 'looking', 'for', 'with', 'any', 'the',
    'deplacer', 'deplace', 'moving', 'move', 'changing', 'change', 'modifier',
    'modifying', 'toucher', 'bouger', 'transporter', 'ajouter', 'ajoute', 'ajout', 'addition', 'add', 'doser',
    'fixer', 'fixe', 'fixee', 'fixing', 'fixed', 'choisir', 'choisi', 'choose', 'chosen', 'choosing', 'decider', 'decide', 'decided', 'setting',
    'dose', 'dosage', 'retirer', 'retire', 'remove', 'remplacer', 'remplace', 'replace', 'utiliser', 'use',
    'autre', 'autres', 'operation', 'operations', 'hop', 'hops', 'houblon', 'houblons',
    'en', 'et', 'and', 'of', 'in',
  ]);
  // A level adjective (« très légère », « plus faible ») qualifies a noun; it is never the requested property.
  const levelAdjective = /^(?:faibles?|legeres?|legers?|basses?|bas|fortes?|forts?|intenses?|elevee?s?|hautes?|haut|low|light|high|strong|discrete?s?|discrets|subtile?s?|marquee?s?|marques)$/u;
  const processWords = new Set([
    'ajout', 'addition', 'ajouter', 'ajoute', 'add', 'doser', 'dose', 'dosage', 'contact', 'duree', 'duration',
    'ebullition', 'fermentation', 'houblonnage', 'operation', 'operations', 'palier', 'stade', 'emploi', 'step',
    'minute', 'minutes', 'min', 'heure', 'heures', 'hour', 'hours', 'jour', 'jours', 'day', 'days',
  ]);
  const temporalLengthWords = new Set(['long', 'longue', 'longues', 'longs', 'court', 'courte', 'courtes', 'courts', 'prolonge', 'prolongee']);
  const cues = [
    ...directCues.flatMap(cue => phraseMatches(text, cue.term).map(match => ({ ...match, direct: true, direction: cue.direction }))),
    ...coordinatedCues.flatMap(cue => phraseMatches(text, cue.term).map(match => ({ ...match, direct: false, direction: cue.direction }))),
  ].sort((a, b) => a.start - b.start);
  const directionalOperations = directCues.filter(cue => cue.direction === 'increase' || cue.direction === 'decrease');
  const criteria = new Map<string, ParsedCriterionReading>();
  for (const cue of cues) {
    if (isClaimedByAct(acts, cue)) continue;
    const before = prefixForMention(text, cue.start);
    const immediatelyFollowing = text.slice(cue.end).trimStart();
    const negativeCueWrapsOperation = cue.direction === 'exclude' && directionalOperations.some(operation =>
      phraseMatches(immediatelyFollowing, operation.term).some(match => match.start === 0));
    if (negativeCueWrapsOperation) continue;
    if (cue.direction === 'exclude' && negativeCueIntroducesNonGuarantee(text, cue.end)) continue;
    if (cue.direction === 'exclude' && isNonInventionNegationAt(text, cue.start)) continue;
    if (cue.direction === 'exclude' && negativeCueIntroducesOperationalField(text, cue.end)) continue;
    if (cue.direction === 'exclude' && /^(?:sans|without|no|not|pas de|aucun|aucune)$/u.test(cue.term)) {
      const missingData = text.slice(cue.end).match(/^\s*(?:(?:aucun|aucune|de|d|any|the|available|disponible)\s+)*(analyse|analysis|information|donn(?:e|é)e?s?|measurement|mesure|source)\b/u);
      if (missingData) continue;
    }
    if (cue.direction === 'keep' && cue.term === 'garde' && /\b(?:de|du|des|la|le)\s*$/u.test(before)) continue;
    const hasNegativeScope = /\b(?:sans|without|no|not|pas de|aucun|aucune|eviter|avoid|exclure|exclude)\b/u.test(before);
    if (!cue.direct && !hasNegativeScope) continue;
    if (cue.direction !== 'exclude' && isContextNominalModifier(text, cue.start, cue.end, knownTerms)) continue;
    const cueOptionalityContext = before + ' ' + text.slice(cue.start, cue.end);
    const optionalityAtCue = OPTIONALITY_PATTERN.test(cueOptionalityContext)
      || /\b(?:not specifically|sans chercher|sans rechercher|without seeking|without looking for)\b/u.test(cueOptionalityContext);

    const tail = text.slice(cue.end).split(/[,.!?;]|\b(?:mais|but|ni|nor|ou|or)\b/u)[0] ?? '';
    const tokenExpression = /[\p{L}\p{N}]+/gu;
    const tokens = [...tail.matchAll(tokenExpression)];
    // « très légère note de coco »: the intensifier grades the level adjective, which owns the noun.
    if (cue.direction === 'increase' && tokens[0] && levelAdjective.test(normalize(tokens[0][0]))) continue;
    const descriptor = tokens.find(token => {
      const word = normalize(token[0]);
      if (stopWords.has(word) || OPERATIONAL_FIELD_TERMS.has(word) || word === cue.term || levelAdjective.test(word)) return false;
      if (!temporalLengthWords.has(word)) return true;
      const relativeStart = cue.end + (token.index ?? 0);
      const before = text.slice(Math.max(0, relativeStart - 32), relativeStart);
      const after = text.slice(relativeStart + token[0].length, relativeStart + token[0].length + 32);
      const nearbyTokens = (before + ' ' + after).match(/[\p{L}\p{N}]+/gu) ?? [];
      return !nearbyTokens.some(value => processWords.has(normalize(value)));
    });
    if (!descriptor) continue;
    const start = cue.end + (descriptor.index ?? 0);
    const end = start + descriptor[0].length;
    if (embeddedQuestionParticle(text, start, descriptor[0])) continue;
    const contextualRelation = contextualSensoryRelation(prefixForMention(text, start));
    const candidateText = text.slice(Math.max(0, start - 20), end + 32);
    const knownOverlap = knownTerms.filter(term => phraseMatches(candidateText, term)
      .some(match => match.start < end - Math.max(0, start - 20) && match.end > start - Math.max(0, start - 20)));
    if (knownOverlap.length) continue;
    const key = normalize(descriptor[0]);
    if (!key || stopWords.has(key)) continue;
    // A compensation noun, a characterized material or an undecided action belongs to its act.
    if (isClaimedByAct(acts, { start, end })) continue;
    const governed = acts && actModalityForMention(text, start, acts.reading,
      [...REPORTED_ACT_KINDS, 'deliberation', 'hypothesis']);
    if (governed && governed.direction === null) {
      const criterion = optionalCriterion({ originalQuestion, sourceRanges, start, end, term: descriptor[0], qualification: governed.qualification,
        meta: mentionMeta(governed) });
      criteria.set(criterion.draft.id, criterion);
      continue;
    }
    const optionalityAfterTerm = /^\s*(?:(?:est|reste|soit|remain|is)\s+)?(?:non\s+(?:requis|requise|obligatoire|exclu|exclue)|not\s+(?:required|excluded|mandatory)|facultatif|facultative|optional)\b/u
      .test(text.slice(end, end + 48));
    if (optionalityAtCue || optionalityAfterTerm) {
      const criterion = optionalCriterion({ originalQuestion, sourceRanges, start, end, term: descriptor[0], meta: { basis: 'optional' } });
      criteria.set(criterion.draft.id, criterion);
      continue;
    }
    if (contextualRelation) {
      const criterion = optionalCriterion({ originalQuestion, sourceRanges, start, end, term: descriptor[0], qualification: contextualRelation,
        meta: { basis: contextualRelation.startsWith('Préférence') ? 'partnerContext' : 'contextNote' } });
      criteria.set(criterion.draft.id, criterion);
      continue;
    }
    const requestedTerm = originalPhraseAt(originalQuestion, sourceRanges, start, end, descriptor[0]);
    const lexiconGap = 'Le terme « ' + requestedTerm + ' » est conservé comme critère, mais n’est rattaché à aucune famille ou dimension du lexique préparé.';
    const cueSpan = { start: cue.start, end: cue.end };
    // « une légère note de coco »: an absolute level for an out-of-lexicon term, not a reduction.
    const cuePrefix = text.slice(0, cue.start);
    if (cue.direction === 'decrease' && LOW_LEVEL_OPERATOR_TERMS.has(cue.term)
      && !LEVEL_MORE_BEFORE.test(cuePrefix) && !LEVEL_LESS_BEFORE.test(cuePrefix)) {
      // « une bière légère et florale »: the adjective qualifies another noun, not this term.
      const bridge = text.slice(cue.end, start).match(/[\p{L}\p{N}]+/gu) ?? [];
      if (!bridge.every(word => LEVEL_DESCRIPTOR_LINKS.has(word))) continue;
      const intensifier = LEVEL_INTENSIFIER.exec(cuePrefix);
      const level = text.slice(intensifier ? intensifier.index : cue.start, cue.end);
      const criterion = qualitativeTargetCriterion({ originalQuestion, sourceRanges, text, start, end, term: descriptor[0],
        qualification: level, unresolved: lexiconGap, meta: { basis: 'level', level, cue: cueSpan } });
      if (!criteria.has(criterion.draft.id)) criteria.set(criterion.draft.id, criterion);
      continue;
    }
    let direction = cue.direction;
    let qualifier: string | undefined;
    const cueContext = before + ' ' + text.slice(cue.start, cue.end);
    if (direction === 'increase' && (/\b(?:pas\s+plus|pas\s+davantage|not\s+more|no\s+more)\b/u.test(cueContext)
      || /\b(?:ne\s+pas|pas|do\s+not|don\s+t|not|no|sans|without|eviter(?:\s+de)?|avoid(?:\s+to|ing)?)\s+(?:trop\s+)?(?:augmenter|augmente|increase|raise|renforcer|renforce|intensifier|intensify|plus|more|davantage)\b/u.test(cueContext))) {
      direction = 'keep';
      qualifier = 'Ne pas augmenter';
    } else if (direction === 'decrease' && /\b(?:ne\s+pas|pas|do\s+not|don\s+t|not|no|sans|without|eviter(?:\s+de)?|avoid(?:\s+to|ing)?)\s+(?:trop\s+)?(?:diminuer|diminue|reduire|reduce|decrease|baisser|baisse|lower|moins|less)\b/u.test(cueContext)) {
      direction = 'keep';
      qualifier = 'Ne pas diminuer';
    } else if (direction === 'increase' && /\b(?:pas|not|no)\s*$/u.test(before)) direction = 'keep';
    if (governed?.direction === 'investigate') { direction = 'investigate'; qualifier = undefined; }
    const criterion = requiredCriterion({
      originalQuestion, sourceRanges, text, start, end, term: descriptor[0], direction, requirement: 'required', qualifier,
      ...(governed?.direction === 'investigate' ? { qualification: governed.qualification } : {}), unresolved: lexiconGap,
      meta: governed?.direction === 'investigate' ? mentionMeta(governed)
        : { basis: qualifier ? 'relativeGuard' : 'operator', cue: cueSpan },
    });
    const id = criterion.draft.id;
    if (criteria.has(id)) continue;
    criteria.set(id, criterion);
  }
  return [...criteria.values()];
}

function readCriteria(text: string, originalQuestion: string, sourceRanges: readonly SourceRange[],
  acts: QuestionActIndex = readQuestionActIndex(text, originalQuestion, sourceRanges)): ParsedCriterionReading[] {
  const byId = new Map<string, ParsedCriterionReading>();
  [...readFamilyCriteria(text, originalQuestion, sourceRanges, acts), ...readDimensionCriteria(text, originalQuestion, sourceRanges, acts),
    ...unresolvedIntentCriteria(text, originalQuestion, sourceRanges, acts), ...acts.compensationReadings, ...acts.materialReadings]
    .sort((left, right) => left.draft.source.start - right.draft.source.start)
    .forEach(row => byId.set(row.draft.id, row));
  const readings = [...byId.values()].sort((left, right) => left.draft.source.start - right.draft.source.start);
  proposeLexicalAliases(readings, text, originalQuestion, sourceRanges);
  attachExplicitPairing(readings, text, originalQuestion, sourceRanges);
  return readings;
}

function readMaterialMentions(text: string, materials: readonly HopDecisionMaterial[]): MaterialMention[] {
  const raw: MaterialMention[] = [];
  for (const material of materials) {
    const names = [
      material.name, material.variety?.name, material.lot?.name, material.product?.name,
      ...(material.variety?.aliases ?? []),
    ].filter((name): name is string => typeof name === 'string' && name.trim().length >= 2);
    for (const name of new Set(names)) for (const match of phraseMatches(text, name)) raw.push({
      ...match, materialIds: [material.id], label: name,
    });
  }
  raw.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const collapsed: MaterialMention[] = [];
  for (const row of raw) {
    const overlapping = collapsed.filter(existing => row.start < existing.end && existing.start < row.end);
    if (!overlapping.length) { collapsed.push(row); continue; }
    const longest = Math.max(row.end - row.start, ...overlapping.map(item => item.end - item.start));
    if (row.end - row.start < longest) continue;
    for (const existing of overlapping) {
      existing.materialIds = [...new Set([...existing.materialIds, ...row.materialIds])];
      if (row.end - row.start > existing.end - existing.start) existing.label = row.label;
      existing.start = Math.min(existing.start, row.start);
      existing.end = Math.max(existing.end, row.end);
    }
  }
  return collapsed.sort((a, b) => a.start - b.start);
}

function mentionsAreNegated(text: string, mention: PhraseMatch): boolean {
  if (classifyDirection(text, mention.start, mention.end).direction !== 'exclude') return false;
  const before = prefixForMention(text, mention.start);
  const markerExpression = /\b(?:sans|without|no|not|pas de|aucun|aucune|eviter|avoid|exclure|exclude)\b/gu;
  const markers = [...before.matchAll(markerExpression)];
  const lastMarker = markers.at(-1);
  if (!lastMarker) return false;
  const constrainedAction = before.slice((lastMarker.index ?? 0) + lastMarker[0].length);
  return !/\b(?:deplacer|transporter|bouger|changer|modifier|toucher|move|shift|change|modify|alter|ajouter|add|doser|dose|retirer|remove|replace|remplacer|utiliser|use|laisser|leave)\b/u.test(constrainedAction);
}

function readExplicitExclusions(text: string, mentions: readonly MaterialMention[]): HopAdviceSituation['exclusions'] {
  const exclusions = new Map<string, HopAdviceSituation['exclusions'][number]>();
  for (const mention of mentions) {
    if (!mentionsAreNegated(text, mention)) continue;
    for (const materialId of mention.materialIds) exclusions.set(materialId, {
      materialId, reason: 'Exclusion explicite formulée par le brasseur.', certainty: 'certain',
    });
  }
  return [...exclusions.values()];
}

function topicDimensionForField(field: string): HopAdviceDimension | undefined {
  const key = normalize(field);
  if (/\b(?:abv|alcohol|alcool)\b/u.test(key)) return 'alcohol';
  if (/\b(?:ph|acid|acidite|acidul|sour)\b/u.test(key)) return 'acidity';
  if (/\b(?:biotransform|thiol|yeast|levure|culture)\b/u.test(key)) return 'bioInteraction';
  if (/\b(?:hop.?creep|dextrin)\b/u.test(key)) return 'hopCreep';
  if (/\b(?:transfer|retention|loss|perte|transfert|matrice)\b/u.test(key)) return 'matrixTransfer';
  if (/\b(?:ibu|bitterness|amertume)\b/u.test(key)) return 'other';
  if (/\b(?:stock|available|availability|disponible)\b/u.test(key)) return 'stock';
  if (/\b(?:analysis|analyse|measurement|mesure|alpha|oil|huile)\b/u.test(key)) return 'documentation';
  if (/\b(?:stage|use|emploi|dose|contact|temperature|temps)\b/u.test(key)) return 'process';
  return undefined;
}

function assertionState(fact: BrewingScenarioBeerFact): HopAdviceAssertion['state'] {
  if (fact.status === 'observed') return 'measured';
  if (fact.status === 'unknown') return 'unknown';
  if (fact.status === 'reported') return 'reported';
  if (fact.status === 'selected' || fact.status === 'proposed' || fact.status === 'target') return 'planned';
  return 'unknown';
}

function contextAssertions(current: BrewingScenarioRuntimeCurrent | undefined): HopAdviceAssertion[] {
  if (!current) return [];
  const assertions: HopAdviceAssertion[] = [];
  if (current.culture) {
    const members = current.culture.members.map(member => [
      member.yeastId ?? member.name ?? 'Identité non résolue',
      ...(member.proportion ? ['proportion ' + member.proportion.min + '–' + member.proportion.max] : []),
    ].join(' · '));
    assertions.push({
      id: 'context-culture',
      subject: 'culture',
      statement: current.culture.explanation + (members.length ? ' Membres transmis : ' + members.join('; ') + '.' : ''),
      state: current.culture.state === 'unknown' ? 'unknown' : 'reported',
      value: members.length ? members.join('; ') : null,
      dimension: 'bioInteraction',
    });
  }
  for (const fact of current.beerContext?.facts ?? []) {
    const dimension = topicDimensionForField(fact.field);
    const rangeText = fact.range
      ? ' Plage préparée : ' + fact.range.min + '–' + fact.range.max + (fact.unit ? ' ' + fact.unit : '') + '.'
      : '';
    assertions.push({
      id: 'context-' + fact.id,
      subject: fact.field,
      statement: 'Fait typé transmis dans le contexte préparé (' + fact.status + ').' + rangeText,
      state: assertionState(fact),
      value: fact.value ?? null,
      ...(fact.unit ? { unit: fact.unit } : {}),
      ...(dimension ? { dimension } : {}),
      ...(fact.source ? { source: fact.source } : {}),
    });
  }
  for (const addition of current.program?.additions ?? []) assertions.push({
    id: 'program-' + addition.id,
    subject: addition.id,
    statement: 'Ajout de programme connu : ' + addition.materialId + ', ' + addition.use + ', ' + addition.status + '.',
    state: addition.status === 'performed' ? 'performed' : 'planned',
    value: addition.grams,
    ...(addition.grams !== null ? { unit: 'g' } : {}),
    dimension: 'process',
  });
  return assertions;
}

function makeSituation(
  current: BrewingScenarioRuntimeCurrent | undefined,
  criteria: CriterionReading[],
  exclusions: HopAdviceSituation['exclusions'],
): HopAdviceSituation {
  const criterionDimensions = criteria.flatMap(row => row.dimension ? [{
    criterionId: row.domainCriterion.id, dimension: row.dimension,
    ...(row.domainCriterion.familyId ? { familyId: row.domainCriterion.familyId } : {}),
  }] : []);
  const assertions = contextAssertions(current);
  for (const criterion of criteria) if (criterion.reportedProblem) assertions.push({
    id: 'reported-' + criterion.domainCriterion.id,
    subject: criterion.domainCriterion.id,
    statement: criterion.reportedProblem,
    state: 'reported',
    value: criterion.domainCriterion.description,
    ...(criterion.dimension ? { dimension: criterion.dimension } : {}),
  });
  return {
    stage: current?.program?.stage ?? 'planning',
    program: current?.program ? structuredClone(current.program) : null,
    assertions, criterionDimensions,
    exclusions: structuredClone(exclusions),
  };
}

function buildDecisionIntent(
  question: string,
  interpretation: string,
  criteria: CriterionReading[],
  assumptions: string[] = [],
): HopDecisionIntent {
  return {
    originalQuestion: question, interpretation,
    ...(assumptions.length ? { assumptions: structuredClone(assumptions) } : {}),
    criteria: criteria.map(row => structuredClone(row.domainCriterion)),
  };
}

function criterionReadingFromDraft(draft: HopV55QuestionCriterionV1): CriterionReading | undefined {
  if (draft.direction === null || draft.requirement !== 'required') return undefined;
  const label = criterionLabel(draft.direction, draft.term, undefined, draft.qualification);
  const domainCriterion: IntentCriterion = {
    id: draft.id, description: label, role: criterionRole(draft.direction), origin: 'user',
    ...(draft.familyId ? { familyId: draft.familyId } : {}),
  };
  return {
    draft: structuredClone(draft),
    publicCriterion: { id: draft.id, label, direction: draft.direction, ...(draft.familyId ? { familyId: draft.familyId } : {}) },
    domainCriterion,
    ...(draft.dimension ? { dimension: draft.dimension } : {}),
    ...(draft.reportedProblem ? { reportedProblem: draft.reportedProblem } : {}),
  };
}

function requiredReadingsFromDrafts(drafts: readonly HopV55QuestionCriterionV1[]): CriterionReading[] {
  return drafts.flatMap(draft => {
    const reading = criterionReadingFromDraft(draft);
    return reading ? [reading] : [];
  });
}

/** Builds domain intent only from explicitly required, directed criterion drafts. */
export function buildHopV55DecisionIntent(question: string, interpretation: string,
  drafts: readonly HopV55QuestionCriterionV1[], assumptions: string[] = []): HopDecisionIntent {
  return buildDecisionIntent(question, interpretation, requiredReadingsFromDrafts(drafts), assumptions);
}

export function buildHopV55DecisionCriteria(drafts: readonly HopV55QuestionCriterionV1[]): HopIntentEvidenceCriterion[] {
  return requiredReadingsFromDrafts(drafts).map(row => structuredClone(row.domainCriterion));
}

export function buildHopV55DecisionPublicCriteria(drafts: readonly HopV55QuestionCriterionV1[]): HopV55Intent['criteria'] {
  return requiredReadingsFromDrafts(drafts).map(row => structuredClone(row.publicCriterion));
}

export function buildHopV55DecisionSituation(current: BrewingScenarioRuntimeCurrent | undefined,
  drafts: readonly HopV55QuestionCriterionV1[], exclusions: HopAdviceSituation['exclusions'] = []): HopAdviceSituation {
  return makeSituation(current, requiredReadingsFromDrafts(drafts), exclusions);
}

export function buildHopV55DecisionInterpretation(drafts: readonly HopV55QuestionCriterionV1[],
  current: BrewingScenarioRuntimeCurrent | undefined): string {
  const required = requiredReadingsFromDrafts(drafts);
  const optional = drafts.filter(row => row.requirement === 'optional');
  const base = interpretationFor(required, null, optional, drafts.filter(isQualitativeTargetDraft));
  return base + (current?.program ? '' : ' Le stade opérationnel est inconnu; planning ne sert que de périmètre technique d’exploration.');
}

function hasPhysicalMoveOperand(text: string, end: number, materialMentions: readonly MaterialMention[]): boolean {
  const afterVerb = text.slice(end).trimStart();
  const withoutAdverb = afterVerb.replace(/^(?:(?:directement|physiquement|directly|physically)\s+)/u, '');
  const tokens = withoutAdverb.match(/[\p{L}\p{N}]+(?:[.,][\p{N}]+)?/gu) ?? [];
  if (/^\d+(?:[.,]\d+)?$/u.test(tokens[0] ?? '') && ['g', 'kg'].includes(normalize(tokens[1] ?? ''))) return true;

  const articles = new Set([
    'a', 'an', 'the', 'some', 'one', 'un', 'une', 'le', 'la', 'l', 'les', 'de', 'du', 'des',
    'ce', 'cet', 'cette', 'ces', 'this', 'that', 'these', 'those',
    'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'my', 'your', 'its',
  ]);
  const directObject = tokens.map(normalize).find(word => !articles.has(word));
  if (new Set([
    'ajout', 'ajouts', 'ligne', 'lignes', 'dose', 'doses', 'houblon', 'houblons',
    'addition', 'additions', 'hop', 'hops', 'pellet', 'pellets',
  ]).has(directObject ?? '')) return true;

  const mention = materialMentions.find(row => row.start >= end);
  if (!mention) return false;
  const bridge = text.slice(end, mention.start).trim();
  const bridgeWords = (bridge.match(/[\p{L}\p{N}]+/gu) ?? []).map(normalize);
  const directObjectConnectors = new Set([
    ...articles, 'directement', 'physiquement', 'directly', 'physically',
    'lot', 'variete', 'matiere', 'material', 'variety', 'exact', 'exacte', 'choisi', 'choisie',
  ]);
  return bridgeWords.length <= 8 && bridgeWords.every(word => directObjectConnectors.has(word));
}

function firstActiveGesture(text: string, materialMentions: readonly MaterialMention[],
  acts: QuestionActReadingV1 = readActs(text)): Gesture | null {
  const candidates: Array<{ kind: GestureKind; word: string }> = [
    { kind: 'replace', word: 'remplacer' }, { kind: 'replace', word: 'remplace' }, { kind: 'replace', word: 'replace' },
    { kind: 'move', word: 'déplacer' }, { kind: 'move', word: 'déplace' }, { kind: 'move', word: 'transférer' },
    { kind: 'move', word: 'transfère' }, { kind: 'move', word: 'move' },
    { kind: 'remove', word: 'retirer' }, { kind: 'remove', word: 'retire' }, { kind: 'remove', word: 'enlever' },
    { kind: 'remove', word: 'enlève' }, { kind: 'remove', word: 'supprimer' }, { kind: 'remove', word: 'supprime' }, { kind: 'remove', word: 'remove' },
    { kind: 'add', word: 'ajouter' }, { kind: 'add', word: 'ajoute' }, { kind: 'add', word: 'add' },
    { kind: 'dose', word: 'doser' }, { kind: 'dose', word: 'dose' }, { kind: 'dose', word: 'augmenter' },
    { kind: 'dose', word: 'augmente' }, { kind: 'dose', word: 'increase' }, { kind: 'dose', word: 'réduire' },
    { kind: 'dose', word: 'réduis' }, { kind: 'dose', word: 'reduce' }, { kind: 'dose', word: 'decrease' },
    { kind: 'dose', word: 'diminuer' }, { kind: 'dose', word: 'diminue' }, { kind: 'dose', word: 'baisser' },
    { kind: 'dose', word: 'baisse' }, { kind: 'dose', word: 'lower' },
  ];
  const active = candidates.flatMap(candidate => phraseMatches(text, candidate.word)
    .filter(match => {
      const before = prefixForMention(text, match.start), after = text.slice(match.end, match.end + 24);
      if (candidate.kind === 'move' && !hasPhysicalMoveOperand(text, match.end, materialMentions)) return false;
      // An undecided, deliberated or hypothetical change is not a command.
      if (isUndecidedChangeAt(acts, match.start)) return false;
      if (OPERATIONAL_FIELD_TERMS.has(normalize(candidate.word))
        && isNegatedOperationalFieldMention(text, match.start, candidate.word)) return false;
      return !/\b(?:sans|without|pas|not|no|ne)\s*$/u.test(before)
        && !(/^pas\b/u.test(after) && /\bne\s*$/u.test(before))
        && !/\b(?:ne|do)\b(?:\s+[\p{L}\p{N}]+){0,3}\s+(?:pas|not|never)\s*$/u.test(before);
    })
    .map(match => ({ ...match, kind: candidate.kind })))
    .sort((a, b) => a.start - b.start);
  if (!active.length) return null;
  const kinds = [...new Set(active.map(row => row.kind))];
  if (kinds.length > 1) return { kind: 'replace', verbStart: -1, verbEnd: -1 };
  return { kind: active[0].kind, verbStart: active[0].start, verbEnd: active[0].end };
}

function isModalOperationQuestion(text: string, gesture: Gesture | null): boolean {
  if (!gesture || gesture.verbStart < 0) return false;
  const before = prefixForMention(text, gesture.verbStart);
  return /\b(?:est\s+ce\s+que|je\s+peux|je\s+pourrais|je\s+voudrais|je\s+souhaiterais|j\s+aimerais|can\s+i|could\s+i|may\s+i|might\s+i|would\s+i|qu\s+est\s+ce\s+que\s+je\s+gagne|what\s+do\s+i\s+gain|comparer|compare)\b/u.test(before);
}

function gesturePhrase(kind: GestureKind): string {
  const phrases: Record<GestureKind, string> = {
    add: 'ajouter un houblon', dose: 'régler une dose', move: 'déplacer un ajout',
    remove: 'retirer un ajout', replace: 'remplacer un ajout',
  };
  return phrases[kind];
}

function qualitativeTargetLabel(draft: HopV55QuestionCriterionV1): string {
  return `Cible qualitative · ${draft.term} — ${draft.qualification ?? 'niveau à préciser'} (niveau visé, sans base actuelle ni valeur déduite)`;
}

function qualitativeTargetNote(draft: HopV55QuestionCriterionV1): string {
  return `La cible qualitative « ${draft.qualification ?? draft.term} » sur « ${draft.term} » est conservée sans direction relative : `
    + 'ni base actuelle, ni baisse, ni valeur n’est déduite; le service local de stratégies ne la reçoit pas comme critère dirigé.';
}

function interpretationFor(criteria: CriterionReading[], gesture: Gesture | null, optionalCriteria: readonly HopV55QuestionCriterionV1[] = [],
  qualitativeTargets: readonly HopV55QuestionCriterionV1[] = []): string {
  const parts = criteria.map(row => row.publicCriterion.label);
  parts.push(...qualitativeTargets.map(qualitativeTargetLabel));
  parts.push(...optionalCriteria.map(row => row.qualification
    ? `Mention à clarifier · ${row.term} — ${row.qualification}`
    : `Mention facultative · ${row.term} (non demandée comme critère).`));
  if (gesture && gesture.verbStart >= 0) parts.push('un geste demandé : « ' + gesturePhrase(gesture.kind) + ' »');
  if (!parts.length) return 'La question originale est conservée. Aucune cible numérique, famille ou opération supplémentaire n’est déduite.';
  return 'Lecture locale proposée : ' + parts.join(' ; ') + '. Les critères sont des intentions déclarées, pas des mesures ni des résultats sensoriels.';
}

function requestedCommercialProductIds(text: string): string[] {
  return HOP_COMMERCIAL_PRODUCTS.filter(product => {
    const names = [product.name.replace(/[®™]/gu, ''), product.id.replace(/-/gu, ' ')];
    return names.some(name => phraseMatches(text, name).length > 0);
  }).map(product => product.id);
}

function genericResponse(input: {
  question: string; interpretation: string; criteria: CriterionReading[];
  situation: HopAdviceSituation; materials: HopDecisionMaterial[];
}): HopDecisionResponse<'exploreStrategies'> {
  return answerHopDecision({
    intent: buildDecisionIntent(input.question, input.interpretation, input.criteria,
      input.situation.program === null
        ? ['Le contrat exige un stade de conseil : planning sert ici de périmètre d’exploration faute de programme, pas de stade réel de la bière.']
        : []),
    action: { kind: 'exploreStrategies', situation: input.situation },
    materials: structuredClone(input.materials),
  });
}

function interpretationWithAction(base: string, gesture: Gesture | null): string {
  return !gesture || gesture.verbStart < 0 ? base
    : base + ' La demande « ' + gesturePhrase(gesture.kind) + ' » attend un aperçu explicite avant toute modification.';
}

const ACT_ISSUE_MESSAGES: Record<QuestionActIssueV1['kind'], (text: string) => string> = {
  compensationWithoutFrame: text => `La compensation « ${text} » est citée sans question, piste ni demande lisible; préciser si elle est envisagée ou décidée.`,
  compensationRefused: text => `La compensation « ${text} » est écartée ou niée; aucune piste de compensation n’est préparée.`,
  compensationWithoutObservation: text => `La compensation « ${text} » ne se rattache à aucun constat rapporté dans la question; préciser l’impression à compenser.`,
  characterizationWithoutMaterial: text => `La caractérisation « ${text} » ne désigne aucune matière lisible; préciser le houblon ou l’échantillon à caractériser.`,
};

/** Structuring acts that the local lexicon cannot represent stay visible instead of disappearing. */
function questionActOmissions(acts: QuestionActReadingV1, text: string, originalQuestion: string,
  sourceRanges: readonly SourceRange[], drafts: readonly HopV55QuestionCriterionV1[],
  operations: readonly HopV55ProgramOperationV1[]): string[] {
  const exact = (span: ReaderSpan) => originalSourceAt(originalQuestion, sourceRanges, span.start, span.end);
  const messages = acts.issues.map(issue => ACT_ISSUE_MESSAGES[issue.kind](exact(issue.cue).text));
  const reported: ReaderSpan[] = [];
  for (const act of acts.acts) {
    if (!['reportedPerception', 'reportedEvaluation', 'evaluationQuestion', 'nonCommitment'].includes(act.kind)) continue;
    if (act.kind === 'reportedPerception'
      && !/\b(?:trop|pas\s+assez|manque\w*|too|not\s+enough)\b/u.test(text.slice(act.scope.start, act.scope.end))) continue;
    // A plain state (« ma bière est claire ») is not a structuring gap; an excess or a lack is.
    if ((act.kind === 'reportedEvaluation' || act.kind === 'evaluationQuestion') && act.evaluation === 'state') continue;
    if (reported.some(span => spansOverlap(span, act.scope))) continue;
    const scope = exact(act.scope);
    if (!scope.text) continue;
    const covered = drafts.some(row => row.source.start >= scope.start && row.source.end <= scope.end)
      || operations.some(row => !!row.sourceSpan && row.sourceSpan.start < scope.end && scope.start < row.sourceSpan.end);
    if (covered) continue;
    reported.push(act.scope);
    messages.push(act.kind === 'nonCommitment'
      ? `L’absence de choix « ${scope.text} » est conservée; aucune propriété du lexique préparé n’y est reconnue et rien n’est décidé.`
      : act.kind === 'evaluationQuestion'
        ? `La question « ${scope.text} » porte sur un écart hors du lexique préparé; préciser la propriété visée, rien n’est décidé.`
        : `Le constat « ${scope.text} » est conservé tel quel, mais aucune propriété du lexique préparé n’y est reconnue; préciser la propriété perçue.`);
  }
  return messages;
}

type QuestionSource = HopV55QuestionCriterionV1['source'];

/** Internal, versioned view of the clause/act reading with exact UTF-16 spans of the verbatim question. */
export interface HopV55QuestionActDiagnosticV1 {
  version: typeof HOP_V55_QUESTION_ACTS_VERSION;
  question: string;
  acts: Array<{
    id: string; kind: QuestionActKindV1; cue: QuestionSource; scope: QuestionSource;
    action?: QuestionSource; flavor?: QuestionActV1['flavor']; modality?: QuestionActV1['modality'];
    object?: QuestionSource; objectVia?: QuestionActV1['objectVia']; anaphor?: QuestionSource; instrument?: QuestionSource;
    subject?: QuestionSource; evaluation?: QuestionActV1['evaluation'];
    relatedActIds: string[];
  }>;
  issues: Array<{ kind: QuestionActIssueV1['kind']; cue: QuestionSource; message: string }>;
}

export function readHopV55QuestionActDiagnosticV1(question: string): HopV55QuestionActDiagnosticV1 {
  const originalQuestion = typeof question === 'string' ? question : '';
  const { text, sourceRanges } = normalizeQuestionWithSourceRanges(originalQuestion);
  const reading = readActs(text);
  const exact = (span: ReaderSpan) => originalSourceAt(originalQuestion, sourceRanges, span.start, span.end);
  const ids = new Map(reading.acts.map(act => {
    const cue = exact(act.cue);
    return [act.id, `question-act-${act.kind}-${cue.start}-${cue.end}`] as const;
  }));
  return {
    version: HOP_V55_QUESTION_ACTS_VERSION,
    question: originalQuestion,
    acts: reading.acts.map(act => ({
      id: ids.get(act.id)!, kind: act.kind, cue: exact(act.cue), scope: exact(act.scope),
      ...(act.action ? { action: exact(act.action) } : {}), ...(act.flavor ? { flavor: act.flavor } : {}),
      ...(act.modality ? { modality: act.modality } : {}), ...(act.object ? { object: exact(act.object) } : {}),
      ...(act.objectVia ? { objectVia: act.objectVia } : {}), ...(act.anaphor ? { anaphor: exact(act.anaphor) } : {}),
      ...(act.instrument ? { instrument: exact(act.instrument) } : {}),
      ...(act.subject ? { subject: exact(act.subject) } : {}), ...(act.evaluation ? { evaluation: act.evaluation } : {}),
      relatedActIds: act.relatedActIds.flatMap(id => ids.has(id) ? [ids.get(id)!] : []),
    })),
    issues: reading.issues.map(issue => {
      const cue = exact(issue.cue);
      return { kind: issue.kind, cue, message: ACT_ISSUE_MESSAGES[issue.kind](cue.text) };
    }),
  };
}

/** Parts of the proposed interpretation that do not come from property mentions. */
export interface HopV55QuestionInterpretationContextV1 {
  /** « un geste demandé : « … » », listed with the readings. */
  gesturePart?: string;
  /** Sentence that keeps a requested gesture behind an explicit preview. */
  gestureNote: string;
  /** Sentence stating that no operational stage is known. */
  stageNote: string;
}

/** One reading pass; the historical reading and the semantic reading are two views of the same mentions. */
export interface HopV55QuestionCoreV1 {
  originalQuestion: string;
  normalized: string;
  sourceRanges: HopV55QuestionSourceRange[];
  acts: QuestionActReadingV1;
  mentions: HopV55ParsedMentionV1[];
  reading: HopV55QuestionReading;
  interpretationContext: HopV55QuestionInterpretationContextV1;
}

/**
 * Historical façade. Its drafts can hold an engaged qualitative target
 * (`required` without direction) that no V2/V3 archive or historical mapper
 * accepts; check `hopV55HistoricalReadingCapabilityV1` before archiving it.
 * New readings go through `readHopV55QuestionSemanticV1` and DecisionReadingV4.
 */
export function readHopV55Question(
  question: string,
  prepared: PreparedBrewingScenarioContext,
): HopV55QuestionReading {
  return readHopV55QuestionCoreV1(question, prepared).reading;
}

export type HopV55HistoricalReadingCapabilityV1 =
  | { status: 'historical' }
  | { status: 'semanticRequired'; annotationIds: string[]; reason: string };

/** Explicit boundary of the historical façade: no downgrade is invented for an engaged target without direction. */
export function hopV55HistoricalReadingCapabilityV1(reading: Pick<HopV55QuestionReading, 'criterionDrafts'>): HopV55HistoricalReadingCapabilityV1 {
  const annotationIds = reading.criterionDrafts.filter(isHopV55QualitativeTargetDraft).map(draft => draft.id);
  return annotationIds.length ? { status: 'semanticRequired', annotationIds,
    reason: 'Cette lecture porte une cible qualitative engagée sans direction; seule la lecture sémantique V4 la conserve.' }
    : { status: 'historical' };
}

/** Explicit lexicon topics a brasseur can choose when correcting a term mapping. */
export function listHopV55LexiconTopicsV1(): Array<{ key: string; label: string; dimension: HopAdviceDimension }> {
  return EXPLICIT_DIMENSION_TERMS.map(topic => ({ key: topic.key, label: topic.label, dimension: topic.dimension }));
}

export function readHopV55QuestionCoreV1(
  question: string,
  prepared: PreparedBrewingScenarioContext,
): HopV55QuestionCoreV1 {
  const originalQuestion = typeof question === 'string' ? question : '';
  const normalizedQuestion = normalizeQuestionWithSourceRanges(originalQuestion);
  const normalized = normalizedQuestion.text;
  const materials = structuredClone(prepared.runtime.materials);
  const current = prepared.runtime.current;
  const materialMentions = readMaterialMentions(normalized, materials);
  const operationDrafts = readHopV55ProgramOperationDrafts({ question: originalQuestion, normalized,
    sourceRanges: normalizedQuestion.sourceRanges,
    materialMentions: materialMentions.map(({ start, end }) => ({ start, end })) });
  const actIndex = readQuestionActIndex(normalized, originalQuestion, normalizedQuestion.sourceRanges);
  const parsedCriteria = readCriteria(normalized, originalQuestion, normalizedQuestion.sourceRanges, actIndex);
  const criteria = parsedCriteria.filter((row): row is CriterionReading => row.draft.direction !== null && row.draft.requirement === 'required'
    && 'domainCriterion' in row);
  const criterionDrafts = parsedCriteria.map(row => structuredClone(row.draft));
  const optionalCriteria = criterionDrafts.filter(row => row.requirement === 'optional');
  const qualitativeTargets = parsedCriteria.filter(row => isQualitativeTargetDraft(row.draft));
  const exclusions = readExplicitExclusions(normalized, materialMentions);
  const gesture = firstActiveGesture(normalized, materialMentions, actIndex.reading);
  const baseInterpretation = interpretationFor(criteria, gesture, optionalCriteria, qualitativeTargets.map(row => row.draft));
  const stageNote = current?.program ? ''
    : ' Le stade opérationnel est inconnu; planning ne sert que de périmètre technique d’exploration.';
  const interpretation = interpretationWithAction(baseInterpretation, gesture) + stageNote;
  const intent: HopV55Intent = { question: originalQuestion, criteria: criteria.map(row => structuredClone(row.publicCriterion)) };
  const situation = makeSituation(current, criteria, exclusions);
  const unresolved: string[] = [
    ...criteria.flatMap(row => row.unresolved ? [row.unresolved] : []),
    ...qualitativeTargets.flatMap(row => [...(row.unresolved ? [row.unresolved] : []), qualitativeTargetNote(row.draft)]),
    ...questionActOmissions(actIndex.reading, normalized, originalQuestion, normalizedQuestion.sourceRanges,
      criterionDrafts, operationDrafts),
  ];
  let response: HopDecisionResponse | undefined;
  let branches: BrewingScenarioBranchRequest[] = [];
  const productIds = requestedCommercialProductIds(normalized);

  if (productIds.length) response = answerHopDecision({
    intent: buildDecisionIntent(originalQuestion, interpretation, criteria),
    action: { kind: 'understandProducts', productIds },
    materials,
    products: HOP_COMMERCIAL_PRODUCTS,
  });

  if (!response && current?.program && hopV55UnavailableCue(normalized)) {
    const sourceId = hopV55UnavailableSourceId(normalized, materialMentions);
    if (sourceId) {
      const planned = tryHopV55UnavailableReplacementPlanner({
        question: originalQuestion, intent: buildDecisionIntent(originalQuestion, interpretation, criteria), program: current.program,
        materials, sourceId, exclusions, mentions: materialMentions,
      });
      if (planned) {
        response = planned.response;
        branches = planned.branches;
        unresolved.push(...planned.unresolved);
      }
    } else unresolved.push('L’indisponibilité est mentionnée, mais aucune matière source unique du catalogue préparé ne peut lui être liée.');
  }
  if (!response) {
    const gestureResult = isModalOperationQuestion(normalized, gesture) ? { branches: [], unresolved: [] }
      : tryHopV55DirectGesture({ intent: buildDecisionIntent(originalQuestion, interpretation, criteria), normalized, gesture,
        current, materials, mentions: materialMentions });
    if (gestureResult.response) response = gestureResult.response;
    branches = gestureResult.branches;
    unresolved.push(...gestureResult.unresolved);
  }
  if (!response) response = genericResponse({
    question: originalQuestion, interpretation, criteria, situation, materials,
  });

  if (situation.program === null) unresolved.push(
    'Le programme reste null. Le contrat du conseil exige un stade : planning sert de périmètre d’exploration, sans décrire un stade réel ni une ligne à appliquer.',
  );
  if (hopV55UnavailableCue(normalized) && situation.program === null) {
    unresolved.push('La matière indisponible peut être explorée, mais aucun programme lié n’est fourni pour planifier une substitution.');
  }
  unresolved.push(...response.missingInformation);
  if (situation.program === null && response.actionKind === 'exploreStrategies') {
    const strategyResponse = response as HopDecisionResponse<'exploreStrategies'>;
    if (strategyResponse.result.limitations.some(row => row.includes('programme vaut null'))) {
      unresolved.push('Le moteur confirme que le programme vaut null dans cette entrée.');
    }
  }
  return {
    originalQuestion, normalized, sourceRanges: normalizedQuestion.sourceRanges, acts: actIndex.reading,
    mentions: parsedCriteria.map(row => structuredClone(row)),
    interpretationContext: {
      ...(gesture && gesture.verbStart >= 0 ? { gesturePart: 'un geste demandé : « ' + gesturePhrase(gesture.kind) + ' »' } : {}),
      gestureNote: interpretationWithAction('', gesture), stageNote,
    },
    reading: {
      intent: { ...intent, criteria: criteria.map(row => structuredClone(row.publicCriterion)) },
      criterionDrafts,
      ...(operationDrafts.length ? { operationDrafts: structuredClone(operationDrafts) } : {}),
      interpretation, response, branches,
      unresolved: [...new Set(unresolved.filter(value => value.trim()))],
    },
  };
}

/** Label and role shared with the semantic projection, so both views send the same historical criteria. */
export function hopV55CriterionLabel(direction: HopV55CriterionDirection, term: string, qualifier?: string, qualification?: string): string {
  return criterionLabel(direction, term, qualifier, qualification);
}

export function hopV55CriterionRole(direction: HopV55CriterionDirection): HopIntentEvidenceCriterion['role'] {
  return criterionRole(direction);
}

/** Closest exact occurrence of a qualifier near a mention, mapped back to the verbatim question. */
export function hopV55QuestionQualifierSource(core: Pick<HopV55QuestionCoreV1, 'originalQuestion' | 'normalized' | 'sourceRanges'>,
  mention: ReaderSpan, qualifier: string): HopV55QuestionCriterionV1['source'] | undefined {
  const closest = phraseMatches(core.normalized, qualifier).filter(match => match.end <= mention.start || match.start >= mention.end)
    .sort((left, right) => Math.min(Math.abs(mention.start - left.end), Math.abs(left.start - mention.end))
      - Math.min(Math.abs(mention.start - right.end), Math.abs(right.start - mention.end)))[0];
  if (!closest || Math.min(Math.abs(mention.start - closest.end), Math.abs(closest.start - mention.end)) > 48) return undefined;
  const source = originalSourceAt(core.originalQuestion, core.sourceRanges, closest.start, closest.end);
  return source.text ? source : undefined;
}

/** Normalized span of an exact draft source, when the verbatim text still maps to it. */
export function hopV55QuestionNormalizedSpan(core: Pick<HopV55QuestionCoreV1, 'originalQuestion' | 'normalized' | 'sourceRanges'>,
  source: HopV55QuestionCriterionV1['source']): ReaderSpan | undefined {
  return normalizedSpanForSource(core.originalQuestion, core.normalized, core.sourceRanges, source);
}
