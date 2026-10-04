/**
 * Offline clause and act reading for V5.5 questions.
 *
 * The reader works on the normalized question text (NFKD without marks, lower
 * case, apostrophes and dashes as spaces). Every span is a normalized offset;
 * callers map it back to the verbatim UTF-16 source through their source ranges.
 * An act only states what the wording commits to — reported perception,
 * declarative evaluation of a subject, asked or envisaged lead, hypothesis,
 * explicit absence of choice, characterization of a material. It never adds a
 * property target, an operation, a material identity, a dose or a measurement.
 *
 * v2 adds the declarative evaluation (« ma bière est trop douce ») and the same
 * evaluation asked or put as a condition (« est-ce que ma bière est trop douce ? »).
 */

export const HOP_V55_QUESTION_ACTS_VERSION = 'hop-v55-question-acts-v2' as const;

export interface QuestionTextSpan { start: number; end: number; }
export type QuestionSentenceMood = 'declarative' | 'interrogative';
export interface QuestionClauseV1 { span: QuestionTextSpan; sentence: QuestionTextSpan; mood: QuestionSentenceMood; }

export type QuestionActKindV1 = 'reportedPerception' | 'reportedEvaluation' | 'evaluationQuestion'
  | 'nonCommitment' | 'deliberation' | 'hypothesis' | 'compensationInquiry' | 'materialCharacterization';
export type QuestionChangeFlavorV1 = 'increase' | 'decrease' | 'change';
export type QuestionInquiryModalityV1 = 'asked' | 'envisaged' | 'possibility' | 'wanted';
/** Degree carried by an evaluation: an excess or a lack is a reported gap, never a chosen change. */
export type QuestionEvaluationV1 = 'excess' | 'lack' | 'state';

export interface QuestionActV1 {
  id: string;
  kind: QuestionActKindV1;
  clause: QuestionTextSpan;
  cue: QuestionTextSpan;
  /** Normalized range whose property mentions take this act's modality. */
  scope: QuestionTextSpan;
  /** Changed verb or action noun governed by an undecided act. */
  action?: QuestionTextSpan;
  flavor?: QuestionChangeFlavorV1;
  modality?: QuestionInquiryModalityV1;
  /** Characterized material phrase; an anaphor keeps its antecedent here. */
  object?: QuestionTextSpan;
  objectVia?: 'direct' | 'anaphora' | 'pronoun';
  anaphor?: QuestionTextSpan;
  /** Material phrase introduced by « avec/with » for a compensation lead. */
  instrument?: QuestionTextSpan;
  /** Evaluated subject (« ma pastry stout », « l’amertume », « elle ») and the gap it reports. */
  subject?: QuestionTextSpan;
  evaluation?: QuestionEvaluationV1;
  relatedActIds: string[];
}

export type QuestionActIssueKindV1 = 'compensationWithoutFrame' | 'compensationRefused'
  | 'compensationWithoutObservation' | 'characterizationWithoutMaterial';
export interface QuestionActIssueV1 { kind: QuestionActIssueKindV1; cue: QuestionTextSpan; }

export interface QuestionActReadingV1 {
  version: typeof HOP_V55_QUESTION_ACTS_VERSION;
  clauses: QuestionClauseV1[];
  acts: QuestionActV1[];
  issues: QuestionActIssueV1[];
  /** Cue, action and object ranges owned by an act; generic descriptor readers must not reuse them. */
  claimedSpans: QuestionTextSpan[];
}

const INTERROGATIVE_OPENING = /^(?:comment|pourquoi|quand|quel|quelle|quels|quelles|lequel|laquelle|lesquels|lesquelles|combien|est\s+ce\s+qu|qu\s+est\s+ce|que\s+faire|faut\s+il|faudrait\s+il|dois\s+je|devrais\s+je|puis\s+je|peut\s+on|vaut\s+il|how|why|what|which|when|should|could|can|do|does|is|are)\b/u;
const EMBEDDED_QUESTION = /\b(?:est\s+ce\s+qu|qu\s+est\s+ce|comment|pourquoi|je\s+me\s+demande|i\s+wonder|whether)\b/u;
const GERUND_GUARD = '(?:gardant|conservant|preservant|maintenant|retenant|evitant|ajoutant|retirant|augmentant|renforcant|reduisant|diminuant|cherchant|visant|utilisant)';
const CLAUSE_BREAK = new RegExp([
  '\\s*,\\s*(?=(?:je|j|on|nous|il|ils|elle|elles|tout\\s+en|en\\s+' + GERUND_GUARD + '|sans|mais|car|donc|puis|et\\s+(?:je|j|on|nous|il))\\b)',
  '\\s+(?=(?:mais|but|car|parce\\s+que|puisque|however|sauf|except|tout\\s+en)\\b)',
  '\\s+(?=et\\s+(?:je|j|on|nous|il\\s+faut)\\b)',
  '(?<!\\btout)\\s+(?=en\\s+' + GERUND_GUARD + '\\b)',
].join('|'), 'gu');

const INCREASE_WORD = /^(?:augment\w*|renforc\w*|accentu\w*|intensifi\w*|rehauss\w*|relev\w*|boost\w*|amplifi\w*|hausse|increas\w*|raise|raising|raised|strengthen\w*)$/u;
const DECREASE_WORD = /^(?:diminu\w*|redui\w*|reduis\w*|reduction|baiss\w*|attenu\w*|adouci\w*|abaiss\w*|limit\w*|decreas\w*|reduc\w*|lower\w*)$/u;
const CHANGE_WORD = /^(?:ajout\w*|retir\w*|retrait|enlev\w*|supprim\w*|remplac\w*|deplac\w*|modifi\w*|chang\w*|corrig\w*|correction|compens\w*|add|adding|remov\w*|replac\w*|mov\w*)$/u;
const ACTION_NOUN = /\b(?:augmentation|hausse|renforcement|intensification|baisse|diminution|reduction|attenuation|ajout|retrait|changement|modification|correction|compensation|increase|decrease|addition|removal|change)\b/u;
const GUARD_VERB = /\b(?:garder|garde|gardant|conserver|conserve|conservant|preserver|preserve|preservant|maintenir|maintiens|eviter|evite|evitant|exclure|keep|keeping|avoid|avoiding|preserving|maintain)\b/u;

const NON_COMMITMENT_CUES: readonly RegExp[] = [
  /\bn\s+(?:ai|as|a|avons|avez|ont)\s+(?:pas|jamais|toujours\s+pas)\s+(?:(?:encore|vraiment|definitivement|formellement)\s+)?(?:choisi|decide|tranche|opte|arrete|fixe|retenu|acte|valide)\b/gu,
  /\b(?:ne|n)\s+(?:choisis|choisit|choisissons|choisissez|decide|decides|decidons|decidez|tranche|tranches|tranchons|opte|optes|optons|m\s+engage|nous\s+engageons)\s+(?:pas|toujours\s+pas|jamais)\b/gu,
  /\b(?:sans|avant\s+de|avant\s+d)\s+(?:avoir\s+)?(?:decider|decide|choisir|choisi|trancher|tranche|opter|opte|m\s+engager|nous\s+engager|s\s+engager)\b/gu,
  /\b(?:je\s+ne\s+sais|je\s+sais|on\s+ne\s+sait|nous\s+ne\s+savons)\s+pas\b|\b(?:j|je|on|nous)\s+(?:hesite|hesitons)\b/gu,
  /\b(?:not|without|before|haven\s+t|have\s+not|don\s+t|do\s+not)\s+(?:yet\s+)?(?:decided|decide|deciding|chosen|chose|choose|choosing|committed|committing|commit)\b/gu,
  /\bpas\s+encore\s+(?:choisi|decide|tranche|opte|fixe|arrete)\b/gu,
];
const PASSIVE_NON_COMMITMENT = /\b(?:(?:n\s+est|ne\s+sont|n\s+etait|ne\s+sera|n\s+a\s+pas\s+ete)\s+(?:(?:pas|toujours\s+pas|jamais)\s+)?(?:encore\s+)?|(?:is|are)\s+not\s+(?:yet\s+)?|not\s+yet\s+)(?:decidee?s?|choisie?s?|tranchee?s?|actee?s?|arretee?s?|fixee?s?|validee?s?|retenue?s?|decided|chosen|settled)\b/gu;
const COMPLEMENT = /^\s*(?:(?:encore|vraiment|definitivement|tout\s+de\s+suite|yet|still)\s+)*(?:de|d|si|s|a|entre|to|whether|if|on)\s+(?:(?:je|j|on|nous|il|i|we)\s+(?:(?:vais|va|dois|doit|devrais|faut|veux|should|will)\s+)?)?(?:(?:ne\s+pas|not)\s+)?/u;
const DELIBERATION_CUE = /\b(?:est\s+ce\s+qu\s*(?:il\s+faut|il\s+faudrait|on\s+doit|on\s+devrait)|est\s+ce\s+que\s+(?:je|j|on|nous)\s+(?:dois|devrais|devrait|devons|devrions|aurais\s+interet\s+a|ferais\s+mieux\s+de)|faut\s+il|faudrait\s+il|dois\s+je|devrais\s+je|vaut\s+il\s+mieux|should\s+i|should\s+we|do\s+i\s+need\s+to|must\s+i)\b/gu;
const HYPOTHESIS_CUE = /\b(?:si|s|if)\s+(?:je|j|on|nous|i|we)\s+/gu;

const PERCEPTION_CUE = /\b(?:me\s+(?:parait|paraissait|semble|semblait)|parait|semble|seems?|appears?|feels?|tastes?|(?:je|j|on|nous)\s+(?:(?:la|le|les|l)\s+)?(?:trouve|trouvons|trouvais|trouvait)|(?:je|j|on|nous)\s+(?:(?:la|le|les|l)\s+)?(?:percois|percevons|ressens|ressentons|sens|sentons)|j\s+ai\s+l\s+impression|a\s+mon\s+gout|i\s+find|we\s+find)\b/gu;
const EVALUATIVE = /\b(?:trop|pas\s+assez|peu|assez|tres|plutot|vraiment|legerement|franchement|bien|excessi\w*|faible\w*|fort\w*|marque\w*|plat\w*|lourd\w*|ecoeur\w*|manque\w*|que|qu|too|quite|rather|very|not\s+enough)\b/u;

// Declarative evaluation: a subject, a copula (or « a un goût », « manque de »), then an evaluative predicate.
const EVALUATION_COPULA = /\b(?:n\s+)?(?:est|sont|reste|restent|etait|etaient|devient|deviennent|is|are|was|were|remains?)\b/gu;
const EVALUATION_TASTE = /\ba\s+(?:un|une)\s+(?:gout|arome|odeur|finale|note|bouche|attaque)\b(?=(?:\s+(?:un\s+peu|beaucoup|bien|vraiment|nettement|franchement|legerement))*\s+(?:trop|pas\s+assez)\b)/gu;
const EVALUATION_LACK = /\b(?:manque|manquent|manquait|lacks?)\b(?=\s+(?:de|d|du|des|of)\b)/gu;
// « il y a trop d’amertume »: an existential report needs an explicit degree.
const EVALUATION_EXISTENTIAL = /\b(?:il\s+y\s+a|il\s+y\s+avait|there\s+is|there\s+are)\b/gu;
const EXISTENTIAL_DEGREE = /^(?:\s+(?:vraiment|franchement|clairement|beaucoup|bien|un\s+peu|really|way|far))*\s+(trop\s+peu|pas\s+assez|trop|peu|too\s+little|too\s+much|too\s+many|not\s+enough|little)\b/u;
const EVALUATION_INVERSION = /^\s+(?:t\s+)?(?:elle|il|elles|ils|on)\b/u;
const EVALUATION_ASKED_BEFORE = /(?:\b(?:est\s+ce\s+que?|est\s+ce\s+qu|si|whether|if|quand|lorsque|lorsqu|when)|(?:^|\s)s)\s*$/u;
const EVALUATION_BELIEF_BEFORE = /\b(?:trouve|trouvons|pense|pensons|crois|croyons|impression|semble|sais|savons|constate|constatons|remarque|remarquons|vois|voyons|find|think|feel|seems?)\s+(?:que|qu|that)\s*$/u;
const EVALUATION_SUBORDINATE_BEFORE = /\b(?:que|qu|that)\s*$/u;
const EVALUATION_SCOPE_END = /,|\b(?:comment|pourquoi|quels?|quelles?|que|qu|si|mais|car|donc|alors|je|j|on|nous|il\s+faut|pour|afin|how|why|what|which|but|so|i|we)\b/u;
const SUBJECT_DETERMINER = new Set(['ma', 'mon', 'mes', 'ta', 'ton', 'tes', 'sa', 'son', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  'la', 'le', 'les', 'l', 'cette', 'ce', 'cet', 'ces', 'une', 'un', 'my', 'our', 'your', 'the', 'this', 'that', 'its']);
const SUBJECT_PRONOUN = new Set(['elle', 'il', 'elles', 'ils', 'c', 'ca', 'cela', 'ceci', 'it']);
// Goal, problem or relative words make the copula describe a wish or a frame, not the beer or a material.
const SUBJECT_BARRIER = new Set(['que', 'qu', 'qui', 'quoi', 'dont', 'je', 'j', 'tu', 'on', 'nous', 'vous', 'me', 'te', 'se', 's',
  'but', 'objectif', 'idee', 'envie', 'souhait', 'projet', 'intention', 'cible', 'plan', 'question', 'demande', 'priorite',
  'probleme', 'souci', 'goal', 'aim', 'target', 'idea', 'wish', 'problem', 'i', 'we', 'you']);
// Degree words make any predicate evaluative; without them the head must itself be evaluative.
const EVALUATION_GRADED = new Set(['trop', 'peu', 'assez', 'tres', 'plutot', 'vraiment', 'si', 'tellement', 'franchement',
  'nettement', 'legerement', 'too', 'very', 'quite', 'rather', 'so', 'fairly']);
const EVALUATIVE_HEAD = /^(?:faibles?|legers?|legeres?|bas|basses?|forts?|fortes?|intenses?|marquee?s?|discrete?s?|discrets|subtile?s?|elevee?s?|hautes?|presente?s?|absente?s?|dominante?s?|plate?s?|fades?|lourde?s?|ronde?s?|secs?|seches?|ecoeurante?s?|agressi\w*|excessi\w*|insuffisante?s?|desequilibree?s?|neutres?|low|light|strong|weak|flat|heavy|harsh|cloying|dominant|subtle|intense)$/u;

export interface QuestionActReadingOptions {
  /** Lexicon hook from the caller: a known property term starts at this normalized position. */
  isPropertyTermAt?: (position: number) => boolean;
}

const EVALUATION_ADVERB = new Set(['un', 'peu', 'beaucoup', 'bien', 'vraiment', 'franchement', 'clairement', 'nettement', 'legerement',
  'largement', 'encore', 'toujours', 'deja', 'assez', 'tres', 'plutot', 'super', 'hyper', 'si', 'tellement', 'plus', 'moins', 'pas',
  'jamais', 'devenu', 'devenue', 'devenus', 'devenues', 'restee', 'really', 'quite', 'very', 'rather', 'fairly', 'still', 'already',
  'clearly', 'much', 'way', 'far', 'so', 'not', 'a', 'bit', 'become', 'became']);
// Predicates that state a plan, a requirement, availability or a frame rather than an evaluation.
const EVALUATION_NON_PREDICATE = new Set(['de', 'd', 'du', 'des', 'au', 'aux', 'en', 'dans', 'sur', 'pour', 'par', 'avec', 'sans', 'une',
  'un', 'le', 'la', 'les', 'l', 'ce', 'cet', 'cette', 'que', 'qu', 'qui', 'ou', 'et', 'the', 'an', 'to', 'for', 'of', 'in', 'with',
  'without', 'on', 'at', 'possible', 'impossible', 'important', 'importante', 'essentiel', 'essentielle', 'necessaire', 'utile',
  'prevu', 'prevue', 'decide', 'decidee', 'choisi', 'choisie', 'envisage', 'envisagee', 'souhaite', 'souhaitee', 'voulu', 'voulue',
  'vise', 'visee', 'demande', 'demandee', 'recommande', 'recommandee', 'conseille', 'conseillee', 'prefere', 'preferee', 'preferable',
  'interdit', 'interdite', 'exclu', 'exclue', 'requis', 'requise', 'obligatoire', 'facultatif', 'facultative', 'optionnel',
  'optionnelle', 'disponible', 'indisponible', 'inconnu', 'inconnue', 'connu', 'connue', 'fourni', 'fournie', 'cense', 'censee',
  'suppose', 'supposee', 'temps', 'mieux', 'dire', 'judicieux', 'souhaitable', 'pertinent', 'logique', 'normal', 'facile', 'difficile',
  'decided', 'chosen', 'planned', 'needed', 'required', 'important', 'available', 'unknown', 'going', 'about', 'likely']);

const COMPENSATION_CUE = /\b(?:compens(?:er|e|es|ent|ons|ez|ant|ait|erait|eraient|era|eront|ation|ations|atoire|atoires)|contrebalanc(?:er|e|es|ent|ant|erait)|contrepoids|(?:re)?equilibr(?:er|ent|ant|age|ages|erait|eraient)|compensat(?:e|es|ed|ing|ion)|counterbalanc(?:e|es|ed|ing))\b/gu;
const INQUIRY_VERB = /\b(?:cherch\w*|recherch\w*|envisag\w*|explor\w*|comprendre|savoir|examin\w*|etudi\w*|voir|evalu\w*|test\w*|essay\w*|pistes?|seek\w*|looking|consider\w*|understand|wonder\w*|me\s+demande)\b/u;
const POSSIBILITY = /\b(?:pourrai\w*|pourr\w*|peut|peuvent|could|might|may|can)\b/u;
const VOLITION = /\b(?:veux|voudrais|souhaite\w*|aimerais|vise\w*|want\w*|would\s+like|il\s+faut|il\s+faudrait|need)\b/u;
const REFUSAL_BEFORE = /\b(?:sans|pas|eviter\s+de|eviter\s+d|not|without|avoid)\s+(?:[\p{L}]+\s+){0,2}$/u;

const CHARACTERIZATION_CUE = /\b(?:caracteris(?:er|e|es|ent|ons|ez|ant|ation|ations)|characteri[sz](?:e|es|ed|ing|ation))\b/gu;
const MATERIAL_DETERMINER = '(?:mon|ma|mes|notre|nos|ton|ta|tes|votre|vos|son|sa|ses|un|une|des|du|le|la|les|l|ce|cet|cette|ces|my|our|your|a|an|the|this|that|these|those)';
const MATERIAL_QUALIFIER = '(?:\\s+(?:de|du|des|d)\\s+(?:(?:mon|ma|mes|notre|nos)\\s+)?(?:jardin|maison|potager|recolte|culture|production|garden|home|backyard|voisin|ferme)|\\s+(?:maison|perso|sauvage|local|locaux|cultive|cultives|homegrown))';
const MATERIAL_PHRASE = new RegExp('\\b(?:' + MATERIAL_DETERMINER + '\\s+)?(?:(?:garden|homegrown|backyard)\\s+)?'
  + '(?:houblons?|matieres?|echantillons?|lots?|recoltes?|cones?|hops?|pellets?)\\b(' + MATERIAL_QUALIFIER + ')?', 'gu');
const ANAPHORIC_DETERMINER = /^(?:ce|cet|cette|ces|le|la|les|l|this|that|these|those|the)\s/u;

interface MaterialPhrase extends QuestionTextSpan { anaphoric: boolean; }

function trimmed(text: string, start: number, end: number): QuestionTextSpan | undefined {
  while (start < end && /[\s,]/u.test(text[start])) start++;
  while (end > start && /\s/u.test(text[end - 1])) end--;
  return end > start ? { start, end } : undefined;
}

function contains(span: QuestionTextSpan, position: number): boolean {
  return span.start <= position && position < span.end;
}

function readSentences(text: string): Array<{ span: QuestionTextSpan; mood: QuestionSentenceMood }> {
  const rows: Array<{ span: QuestionTextSpan; mood: QuestionSentenceMood }> = [];
  let start = 0;
  for (let index = 0; index <= text.length; index++) {
    const character = text[index];
    if (index < text.length && !'.!?;\n'.includes(character)) continue;
    if (character === '.' && /\d/u.test(text[index - 1] ?? '') && /\d/u.test(text[index + 1] ?? '')) continue;
    const span = trimmed(text, start, index);
    if (span) {
      const body = text.slice(span.start, span.end);
      const asked = character === '?' || INTERROGATIVE_OPENING.test(body) || EMBEDDED_QUESTION.test(body);
      rows.push({ span, mood: asked ? 'interrogative' : 'declarative' });
    }
    start = index + 1;
  }
  return rows;
}

function readClauses(text: string): QuestionClauseV1[] {
  const clauses: QuestionClauseV1[] = [];
  for (const sentence of readSentences(text)) {
    const body = text.slice(sentence.span.start, sentence.span.end);
    let cursor = 0;
    const push = (from: number, to: number) => {
      const span = trimmed(text, sentence.span.start + from, sentence.span.start + to);
      if (span) clauses.push({ span, sentence: sentence.span, mood: sentence.mood });
    };
    for (const match of body.matchAll(CLAUSE_BREAK)) {
      const at = match.index ?? 0;
      if (at > cursor) push(cursor, at);
      cursor = Math.max(cursor, at + match[0].length);
    }
    push(cursor, body.length);
  }
  return clauses;
}

function clauseAt(clauses: readonly QuestionClauseV1[], position: number): QuestionClauseV1 | undefined {
  return clauses.find(row => contains(row.span, position))
    ?? clauses.find(row => row.sentence.start <= position && position <= row.sentence.end);
}

function wordAt(text: string, start: number): QuestionTextSpan | undefined {
  const match = /^[\p{L}]+/u.exec(text.slice(start));
  return match ? { start, end: start + match[0].length } : undefined;
}

export function questionChangeFlavor(word: string): QuestionChangeFlavorV1 | undefined {
  if (INCREASE_WORD.test(word)) return 'increase';
  if (DECREASE_WORD.test(word)) return 'decrease';
  if (CHANGE_WORD.test(word)) return 'change';
  return undefined;
}

/** A complement scope stops before a later guard verb, which owns its own object. */
function complementScope(text: string, start: number, clause: QuestionClauseV1): QuestionTextSpan {
  const tail = text.slice(start, clause.span.end);
  const guard = GUARD_VERB.exec(tail.slice(1));
  return { start, end: guard ? start + 1 + guard.index : clause.span.end };
}

function actId(kind: QuestionActKindV1, cue: QuestionTextSpan): string {
  return `act-${kind}-${cue.start}-${cue.end}`;
}

function readMaterialPhrases(text: string): MaterialPhrase[] {
  return [...text.matchAll(MATERIAL_PHRASE)].map(match => {
    const start = match.index ?? 0;
    const qualified = !!match[1] || /\b(?:garden|homegrown|backyard)\b/u.test(match[0]);
    return { start, end: start + match[0].length, anaphoric: !qualified && ANAPHORIC_DETERMINER.test(match[0] + ' ') };
  });
}

function readPerceptions(text: string, clauses: readonly QuestionClauseV1[]): QuestionActV1[] {
  const acts: QuestionActV1[] = [];
  for (const match of text.matchAll(PERCEPTION_CUE)) {
    const cue = { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length };
    const clause = clauseAt(clauses, cue.start);
    if (!clause) continue;
    // « Je trouve » only reports a perception when an evaluation follows it.
    if (/\btrouv/u.test(match[0]) && !EVALUATIVE.test(text.slice(cue.end, clause.span.end))) continue;
    acts.push({ id: actId('reportedPerception', cue), kind: 'reportedPerception', clause: clause.span, cue,
      scope: clause.span, relatedActIds: [] });
  }
  return acts;
}

/** Nearest determiner phrase or subject pronoun before the verb, inside the clause. */
function evaluationSubject(text: string, clauseStart: number, verbStart: number): QuestionTextSpan | undefined {
  const words = [...text.slice(clauseStart, verbStart).matchAll(/[\p{L}\p{N}]+/gu)].map(match => {
    const start = clauseStart + (match.index ?? 0);
    return { word: match[0], start, end: start + match[0].length };
  });
  const last = words.at(-1);
  if (!last) return undefined;
  if (SUBJECT_PRONOUN.has(last.word)) return { start: last.start, end: last.end };
  for (let index = words.length - 1; index >= Math.max(0, words.length - 6); index--) {
    const row = words[index];
    if (SUBJECT_BARRIER.has(row.word) || SUBJECT_PRONOUN.has(row.word)) return undefined;
    // A bare determiner (« le manque de ») has no evaluated noun.
    if (SUBJECT_DETERMINER.has(row.word)) return index < words.length - 1 ? { start: row.start, end: last.end } : undefined;
  }
  return undefined;
}

/**
 * Degree words then an evaluative head; plans, requirements, passives (« est
 * cité ») and frames are not evaluations.
 */
function evaluationPredicate(text: string, from: number, limit: number, options: QuestionActReadingOptions):
  { evaluation: QuestionEvaluationV1; cueEnd: number; headStart: number } | undefined {
  const words = [...text.slice(from, limit).matchAll(/[\p{L}\p{N}]+/gu)];
  let evaluation: QuestionEvaluationV1 = 'state';
  let cueEnd = from, index = 0, negated = false, graded = false;
  const endOf = (position: number) => from + (words[position].index ?? 0) + words[position][0].length;
  while (index < words.length) {
    const word = words[index][0], next = words[index + 1]?.[0];
    if (['pas', 'plus', 'not', 'no'].includes(word) && (next === 'assez' || next === 'enough')) {
      evaluation = 'lack'; graded = true; cueEnd = endOf(index + 1); index += 2; continue;
    }
    // « n’est pas trop amère » reports a state without a gap.
    if (word === 'trop' || word === 'too') { evaluation = negated ? 'state' : 'excess'; graded = true; cueEnd = endOf(index); index++; continue; }
    if (!EVALUATION_ADVERB.has(word)) break;
    if (['pas', 'jamais', 'not'].includes(word)) negated = true;
    if (EVALUATION_GRADED.has(word)) graded = true;
    index++;
  }
  const head = words[index];
  if (!head || !/^\p{L}/u.test(head[0]) || EVALUATION_NON_PREDICATE.has(head[0])) return undefined;
  const headStart = from + (head.index ?? 0);
  if (!graded && !EVALUATIVE_HEAD.test(head[0]) && !options.isPropertyTermAt?.(headStart)) return undefined;
  return { evaluation, cueEnd, headStart };
}

/**
 * « Ma bière est trop douce », « l’amertume est faible », « elle manque de corps »:
 * the subject's current state as reported, not a decision to change it. The same
 * wording after « est-ce que », « si », or with an inversion asks or supposes it.
 */
function readEvaluations(text: string, clauses: readonly QuestionClauseV1[],
  nonCommitments: readonly QuestionActV1[], options: QuestionActReadingOptions): QuestionActV1[] {
  const acts: QuestionActV1[] = [];
  const candidates = [
    ...[...text.matchAll(EVALUATION_COPULA)].map(match => ({ match, form: 'copula' as const })),
    ...[...text.matchAll(EVALUATION_TASTE)].map(match => ({ match, form: 'taste' as const })),
    ...[...text.matchAll(EVALUATION_LACK)].map(match => ({ match, form: 'lack' as const })),
    ...[...text.matchAll(EVALUATION_EXISTENTIAL)].map(match => ({ match, form: 'existential' as const })),
  ].sort((left, right) => (left.match.index ?? 0) - (right.match.index ?? 0));
  for (const { match, form } of candidates) {
    const verb = { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length };
    const clause = clauseAt(clauses, verb.start);
    if (!clause) continue;
    const overlaps = (act: QuestionActV1) => act.cue.start < verb.end && verb.start < act.cue.end;
    if (nonCommitments.some(overlaps) || acts.some(overlaps)) continue;
    if (form === 'existential') {
      const degree = EXISTENTIAL_DEGREE.exec(text.slice(verb.end, clause.span.end));
      if (!degree) continue;
      const cue = { start: verb.start, end: verb.end + degree[0].length };
      const stop = EVALUATION_SCOPE_END.exec(text.slice(cue.end, clause.span.end));
      const asked = EVALUATION_ASKED_BEFORE.test(text.slice(clause.span.start, verb.start));
      const kind = asked ? 'evaluationQuestion' as const : 'reportedEvaluation' as const;
      acts.push({ id: actId(kind, cue), kind, clause: clause.span, cue,
        scope: { start: verb.start, end: stop ? cue.end + stop.index : clause.span.end },
        evaluation: /^(?:trop|too)\s+(?:peu|little)$|^(?:pas\s+assez|not\s+enough)$/u.test(degree[1]) ? 'lack'
          : /^(?:peu|little)$/u.test(degree[1]) ? 'state' : 'excess',
        relatedActIds: [] });
      continue;
    }
    const subject = evaluationSubject(text, clause.span.start, verb.start);
    if (!subject) continue;
    const beforeSubject = text.slice(clause.span.start, subject.start);
    let asked = EVALUATION_ASKED_BEFORE.test(beforeSubject);
    // « je veux que la bière reste peu amère » is a wish; « je trouve que… » stays a report.
    if (!asked && EVALUATION_SUBORDINATE_BEFORE.test(beforeSubject) && !EVALUATION_BELIEF_BEFORE.test(beforeSubject)) continue;
    let predicateFrom = verb.end;
    if (form === 'copula') {
      const inversion = EVALUATION_INVERSION.exec(text.slice(verb.end));
      if (inversion) { asked = true; predicateFrom = verb.end + inversion[0].length; }
    }
    const predicate = form === 'lack' ? { evaluation: 'lack' as const, cueEnd: verb.end, headStart: verb.end }
      : evaluationPredicate(text, predicateFrom, clause.span.end, options);
    if (!predicate) continue;
    const cue = { start: verb.start, end: Math.max(verb.end, predicate.cueEnd) };
    const stop = EVALUATION_SCOPE_END.exec(text.slice(predicate.headStart, clause.span.end));
    const end = Math.max(cue.end, stop ? predicate.headStart + stop.index : clause.span.end);
    const kind = asked ? 'evaluationQuestion' as const : 'reportedEvaluation' as const;
    acts.push({ id: actId(kind, cue), kind, clause: clause.span, cue, scope: { start: subject.start, end },
      subject, evaluation: predicate.evaluation, relatedActIds: [] });
  }
  return acts;
}

function readNonCommitments(text: string, clauses: readonly QuestionClauseV1[]): QuestionActV1[] {
  const acts: QuestionActV1[] = [];
  const cues = NON_COMMITMENT_CUES.flatMap(pattern => [...text.matchAll(pattern)])
    .map(match => ({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }))
    .sort((left, right) => left.start - right.start || right.end - left.end);
  for (const cue of cues) {
    if (acts.some(act => act.cue.start < cue.end && cue.start < act.cue.end)) continue;
    const clause = clauseAt(clauses, cue.start);
    const complement = COMPLEMENT.exec(text.slice(cue.end));
    if (!clause || !complement) continue;
    const action = wordAt(text, cue.end + complement[0].length);
    if (!action || action.start >= clause.span.end) continue;
    acts.push({ id: actId('nonCommitment', cue), kind: 'nonCommitment', clause: clause.span, cue,
      scope: complementScope(text, action.start, clause), action,
      flavor: questionChangeFlavor(text.slice(action.start, action.end)) ?? 'change', relatedActIds: [] });
  }
  for (const match of text.matchAll(PASSIVE_NON_COMMITMENT)) {
    const cue = { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length };
    if (acts.some(act => act.cue.start < cue.end && cue.start < act.cue.end)) continue;
    const clause = clauseAt(clauses, cue.start);
    if (!clause || cue.start <= clause.span.start) continue;
    const subject = text.slice(clause.span.start, cue.start);
    const noun = ACTION_NOUN.exec(subject);
    const action = noun ? { start: clause.span.start + noun.index, end: clause.span.start + noun.index + noun[0].length } : undefined;
    acts.push({ id: actId('nonCommitment', cue), kind: 'nonCommitment', clause: clause.span, cue,
      scope: { start: clause.span.start, end: cue.start }, ...(action ? { action } : {}),
      flavor: noun ? questionChangeFlavor(noun[0]) ?? 'change' : 'change', relatedActIds: [] });
  }
  return acts;
}

function readDeliberations(text: string, clauses: readonly QuestionClauseV1[]): QuestionActV1[] {
  const acts: QuestionActV1[] = [];
  for (const match of text.matchAll(DELIBERATION_CUE)) {
    const cue = { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length };
    const clause = clauseAt(clauses, cue.start);
    if (!clause || clause.mood !== 'interrogative') continue;
    const lead = /^\s*(?:(?:plutot|vraiment|encore|aussi|alors|d\s+abord|rather|really|also)\s+)*(?:(?:de|d|to)\s+)?/u.exec(text.slice(cue.end));
    const action = wordAt(text, cue.end + (lead?.[0].length ?? 0));
    const flavor = action ? questionChangeFlavor(text.slice(action.start, action.end)) : undefined;
    if (!action || !flavor || action.start >= clause.span.end) continue;
    acts.push({ id: actId('deliberation', cue), kind: 'deliberation', clause: clause.span, cue,
      scope: complementScope(text, action.start, clause), action, flavor, relatedActIds: [] });
  }
  return acts;
}

function readHypotheses(text: string, clauses: readonly QuestionClauseV1[]): QuestionActV1[] {
  const acts: QuestionActV1[] = [];
  for (const match of text.matchAll(HYPOTHESIS_CUE)) {
    const cue = { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length };
    const clause = clauseAt(clauses, cue.start);
    if (!clause || clause.mood !== 'interrogative') continue;
    const action = wordAt(text, cue.end);
    const flavor = action ? questionChangeFlavor(text.slice(action.start, action.end)) : undefined;
    if (!action || !flavor) continue;
    const tail = text.slice(action.end, clause.sentence.end);
    const stop = /,|\b(?:est\s+ce\s+qu|qu\s+est\s+ce|alors|then|will|would)\b/u.exec(tail);
    const end = Math.min(stop ? action.end + stop.index : clause.sentence.end, clause.span.end);
    acts.push({ id: actId('hypothesis', cue), kind: 'hypothesis', clause: clause.span, cue,
      scope: { start: action.start, end }, action, flavor, relatedActIds: [] });
  }
  return acts;
}

function readCompensations(text: string, clauses: readonly QuestionClauseV1[], perceptions: readonly QuestionActV1[],
  undecided: readonly QuestionActV1[], materials: readonly MaterialPhrase[], issues: QuestionActIssueV1[]): QuestionActV1[] {
  const acts: QuestionActV1[] = [];
  for (const match of text.matchAll(COMPENSATION_CUE)) {
    const cue = { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length };
    const clause = clauseAt(clauses, cue.start);
    if (!clause) continue;
    // « Je ne choisis pas encore de compenser » keeps the lead open; it is not a refusal.
    const notYetChosen = undecided.some(act => contains(act.scope, cue.start));
    const clausePrefix = text.slice(clause.span.start, cue.start);
    if (!notYetChosen && REFUSAL_BEFORE.test(clausePrefix)) { issues.push({ kind: 'compensationRefused', cue }); continue; }
    const sentencePrefix = text.slice(clause.sentence.start, cue.start);
    const modality: QuestionInquiryModalityV1 | undefined = notYetChosen ? 'envisaged' : clause.mood === 'interrogative' ? 'asked'
      : INQUIRY_VERB.test(sentencePrefix) ? 'envisaged'
        : POSSIBILITY.test(sentencePrefix) ? 'possibility'
          : VOLITION.test(sentencePrefix) ? 'wanted' : undefined;
    if (!modality) { issues.push({ kind: 'compensationWithoutFrame', cue }); continue; }
    const related = perceptions.filter(act => act.cue.start < cue.start).map(act => act.id);
    const constat = /\b(?:trop|pas\s+assez|manque\s+de|manque\s+d|too|not\s+enough)\b/u.test(text.slice(0, cue.start));
    if (!related.length && !constat) issues.push({ kind: 'compensationWithoutObservation', cue });
    // « compenser ça avec le houblon »: a short object may sit between the lead and its means.
    const instrumentLead = /^(?:\s+[\p{L}]+){0,2}?\s+(?:avec|with|par|by)\s+/u.exec(text.slice(cue.end, clause.span.end));
    const instrument = instrumentLead ? materials.find(row => row.start === cue.end + instrumentLead[0].length) : undefined;
    acts.push({ id: actId('compensationInquiry', cue), kind: 'compensationInquiry', clause: clause.span, cue, scope: cue,
      modality, ...(instrument ? { instrument: { start: instrument.start, end: instrument.end } } : {}), relatedActIds: related });
  }
  return acts;
}

function readCharacterizations(text: string, clauses: readonly QuestionClauseV1[], materials: readonly MaterialPhrase[],
  issues: QuestionActIssueV1[]): QuestionActV1[] {
  const acts: QuestionActV1[] = [];
  const antecedentBefore = (position: number) => materials.filter(row => row.end <= position && !row.anaphoric).at(-1);
  for (const match of text.matchAll(CHARACTERIZATION_CUE)) {
    const cue = { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length };
    const clause = clauseAt(clauses, cue.start);
    if (!clause) continue;
    const following = materials.find(row => row.start >= cue.end && row.start < clause.span.end);
    const pronoun = /\b(?:le|la|les|l)\s*$/u.test(text.slice(clause.span.start, cue.start));
    let object: QuestionTextSpan | undefined, anaphor: QuestionTextSpan | undefined;
    let objectVia: QuestionActV1['objectVia'];
    if (following) {
      const antecedent = following.anaphoric ? antecedentBefore(following.start) : undefined;
      object = antecedent ? { start: antecedent.start, end: antecedent.end } : { start: following.start, end: following.end };
      objectVia = antecedent ? 'anaphora' : 'direct';
      if (antecedent) anaphor = { start: following.start, end: following.end };
    } else if (pronoun) {
      const antecedent = antecedentBefore(cue.start) ?? materials.filter(row => row.end <= cue.start).at(-1);
      if (antecedent) { object = { start: antecedent.start, end: antecedent.end }; objectVia = 'pronoun'; }
    }
    if (!object) { issues.push({ kind: 'characterizationWithoutMaterial', cue }); continue; }
    acts.push({ id: actId('materialCharacterization', cue), kind: 'materialCharacterization', clause: clause.span, cue,
      scope: cue, object, ...(objectVia ? { objectVia } : {}), ...(anaphor ? { anaphor } : {}), relatedActIds: [] });
  }
  return acts;
}

/** Reads clauses and acts from normalized text. Pure, offline and deterministic. */
export function readHopV55QuestionActs(text: string, options: QuestionActReadingOptions = {}): QuestionActReadingV1 {
  const clauses = readClauses(text);
  const materials = readMaterialPhrases(text);
  const issues: QuestionActIssueV1[] = [];
  const perceptions = readPerceptions(text, clauses);
  const nonCommitments = readNonCommitments(text, clauses);
  const evaluations = readEvaluations(text, clauses, nonCommitments, options);
  const undecided = [...nonCommitments, ...readDeliberations(text, clauses), ...readHypotheses(text, clauses)];
  const acts = [
    ...perceptions,
    ...evaluations,
    ...undecided,
    ...readCompensations(text, clauses, [...perceptions, ...evaluations], undecided, materials, issues),
    ...readCharacterizations(text, clauses, materials, issues),
  ].sort((left, right) => left.cue.start - right.cue.start || left.id.localeCompare(right.id));
  const claimedSpans = acts.flatMap(act => [act.cue, ...(act.action ? [act.action] : []),
    ...(act.kind === 'materialCharacterization' && act.object ? [act.object] : []), ...(act.anaphor ? [act.anaphor] : [])]);
  return { version: HOP_V55_QUESTION_ACTS_VERSION, clauses, acts,
    issues: issues.sort((left, right) => left.cue.start - right.cue.start), claimedSpans };
}

/** Acts of the given kinds whose modality scope covers a normalized position. */
export function questionActsGoverning(reading: QuestionActReadingV1, position: number,
  kinds: readonly QuestionActKindV1[]): QuestionActV1[] {
  return reading.acts.filter(act => kinds.includes(act.kind) && contains(act.scope, position));
}

/** True when a changed verb at this position sits under an explicit absence of choice, a question or a hypothesis. */
export function isUndecidedChangeAt(reading: QuestionActReadingV1, position: number): boolean {
  return reading.acts.some(act => ['nonCommitment', 'deliberation', 'hypothesis'].includes(act.kind)
    && (contains(act.scope, position) || (!!act.action && contains(act.action, position))));
}
