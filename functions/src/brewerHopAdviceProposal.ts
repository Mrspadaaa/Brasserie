/**
 * Lecture assistée du conseil houblon : une proposition corrigible du modèle, jamais une adoption.
 * Module partagé, sans Firebase ni Node : le navigateur rejoue les mêmes contrôles et requalifie
 * les mêmes preuves d'outil avant toute préparation V3. Aucun null n'est stocké : une absence
 * reste une clé omise, une direction absente vaut 'none' (convertie en null côté V3).
 */
import { assertHopDocument } from './hopIndexSchema.js';
import { compareBrewerHopAdviceContextBindings, isBrewerHopAdviceContextLaunchClaim, projectBrewerHopAdviceToolDependencies,
  type BrewerHopAdviceContextLaunchClaimV1, type BrewerHopAdviceContextProjectionV1, type BrewerHopAdviceEvidenceDependencyV2 } from './brewerHopAdviceContextBinding.js';
import type { BrewerAdvice, BrewerEvidence } from './companionTypes.js';
import {
  assertBrewerHopAdvicePredictionSnapshot,
  resolveBrewerHopAdvicePredictionContribution,
  tryCreateBrewerHopAdvicePredictionSnapshot,
  type BrewerHopAdvicePredictionSelection,
  type BrewerHopAdvicePredictionSelectionInput,
  type BrewerHopAdvicePredictionSnapshotV1,
} from './brewerHopAdvicePredictionEvidence.js';

export const BREWER_HOP_ADVICE_REQUEST_FORMAT = 'brewer-hop-advice-request-v2' as const;
export const BREWER_HOP_ADVICE_PROPOSAL_FORMAT = 'brewer-hop-advice-proposal-v4' as const;
export const BREWER_HOP_ADVICE_FINISH_TOOL = 'finish_hop_advice_proposal' as const;

const PROPERTIES = ['aroma', 'bitterness', 'sweetness', 'acidity', 'bioContribution', 'materialCharacter', 'unresolved'] as const;
const ROLES = ['target', 'reportedObservation', 'investigation', 'preference', 'constraint'] as const;
const DIRECTIONS = ['increase', 'decrease', 'keep', 'exclude', 'investigate', 'none'] as const;
const BASES = ['qualitativeTarget', 'current', 'none'] as const;
const METRICS = ['sensory', 'unspecified', 'pH', 'analyticalBU', 'titratableAcidity'] as const;
const SUBJECTS = ['beer', 'material', 'culture', 'process', 'unspecified'] as const;
const SENSORY_CONTEXTS = ['beer', 'rawHop', 'infusion', 'unspecified'] as const;
const SCOPE_KINDS = ['employmentTiming', 'materialSelection'] as const;
const OPEN_KINDS = ['conditionalRisk', 'alternativeAddition', 'fermentationInteraction', 'processChoice', 'cause', 'other'] as const;
const OPTION_KINDS = ['intervention', 'characterization', 'investigation', 'alternative'] as const;
const VERDICTS = ['consistent', 'revise', 'dispute'] as const;
const IDENTITIES = ['unconfirmed', 'personalUnidentified'] as const;
const PROGRAM_KINDS = ['none', 'preparedRequest', 'scenarioBranch'] as const;
const PROVENANCES = ['modelExplanation', 'documentaryReference', 'toolExploration', 'toolComputed'] as const;
const QUALIFICATIONS = ['none', 'preparedRequest', 'computedResult', 'programPreview'] as const;
const APPLICABILITIES = ['available', 'conditional', 'unavailable', 'hypotheticalOnly'] as const;
const IDENTITY_LEVELS = ['catalogueRecord', 'indexRecord', 'unvalidatedRecord'] as const;

export type BrewerHopAdviceProperty = typeof PROPERTIES[number];
export type BrewerHopAdviceRole = typeof ROLES[number];
export type BrewerHopAdviceDirection = typeof DIRECTIONS[number];
export type BrewerHopAdviceMetric = typeof METRICS[number];
export type BrewerHopAdviceScopeKind = typeof SCOPE_KINDS[number];
export type BrewerHopAdviceOpenQuestionKind = typeof OPEN_KINDS[number];
export type BrewerHopAdviceOptionKind = typeof OPTION_KINDS[number];
export type BrewerHopAdviceProgramQualification = typeof QUALIFICATIONS[number];

/** Exact UTF-16 fragment of the question. */
export interface BrewerHopAdviceSpan { start: number; end: number; text: string }

/** Local reader annotation as the client declares it. The server cannot verify it; the browser adapter does. */
export interface BrewerHopAdviceReaderAnnotation {
  id: string;
  span: BrewerHopAdviceSpan;
  term: string;
  direction: BrewerHopAdviceDirection;
  requirement: 'required' | 'optional';
  qualification?: string;
  familyId?: string;
  dimension?: string;
  origin: 'parser' | 'brasseur';
}

export interface BrewerHopAdviceReaderScope {
  id: string;
  kind: BrewerHopAdviceScopeKind;
  span: BrewerHopAdviceSpan;
  focusSpan?: BrewerHopAdviceSpan;
}

/** Typed handoff of the archived local reading. It cites that archive; it neither proves nor replaces it. */
export interface BrewerHopAdviceRequest {
  format: typeof BREWER_HOP_ADVICE_REQUEST_FORMAT;
  question: string;
  sourceReadingReference: string;
  /** Client launch claim checked before generation against the local reading reference and scope. */
  contextLaunch: BrewerHopAdviceContextLaunchClaimV1;
  readerAnnotations: BrewerHopAdviceReaderAnnotation[];
  readerScopes: BrewerHopAdviceReaderScope[];
}

/** One proposed reading of a fragment. Qualifiers stay verbatim; no measure, intensity or material identity. */
export interface BrewerHopAdviceReading {
  property: BrewerHopAdviceProperty;
  role: BrewerHopAdviceRole;
  direction: BrewerHopAdviceDirection;
  qualifier?: string;
  required: boolean;
  basis: typeof BASES[number];
  metric: BrewerHopAdviceMetric;
  subject: { kind: typeof SUBJECTS[number]; label: string; sensoryContext: typeof SENSORY_CONTEXTS[number] };
  /** Exact relation partner quoted from the question (free context only). */
  partner?: BrewerHopAdviceSpan;
  /** Hint only: the local adapter keeps it when that family is known there. */
  familyId?: string;
  relatedIds: string[];
  /** Reported observations this investigation seeks to compensate. */
  compensates: string[];
  reason: string;
}

export interface BrewerHopAdviceAnnotation { id: string; spans: BrewerHopAdviceSpan[]; reading: BrewerHopAdviceReading }
export interface BrewerHopAdviceReaderReview {
  annotationId: string;
  verdict: typeof VERDICTS[number];
  reason: string;
  revision?: BrewerHopAdviceReading;
}
export interface BrewerHopAdviceScope {
  id: string;
  kind: BrewerHopAdviceScopeKind;
  span: BrewerHopAdviceSpan;
  focusSpan?: BrewerHopAdviceSpan;
  contextSpans: BrewerHopAdviceSpan[];
  relatedIds: string[];
  reason: string;
}
/** A useful question kept as asked when no canonical intent or action expresses it yet. */
export interface BrewerHopAdviceOpenQuestion {
  id: string;
  kind: BrewerHopAdviceOpenQuestionKind;
  spans: BrewerHopAdviceSpan[];
  restatement: string;
  whyOpen: string;
  relatedIds: string[];
}
/** A named material whose identity is never asserted by the model; candidates come from a retained identity record. */
export interface BrewerHopAdviceMaterialMention {
  id: string;
  span: BrewerHopAdviceSpan;
  identity: typeof IDENTITIES[number];
  candidates: Array<{ materialId: string; evidenceId: string }>;
  note: string;
}
/** Stored link to one exact contribution, never a model-written value or explanation. */
export type BrewerHopAdviceComputedLink =
  | { evidenceId: string; branchId: string }
  | { evidenceId: string; predictionSelection: BrewerHopAdvicePredictionSelection };
export interface BrewerHopAdviceToolExplorationLink {
  evidenceId: string;
  reason: 'payloadUnqualified' | 'contributionUnqualified';
  note: string;
}
export interface BrewerHopAdviceOption {
  id: string;
  kind: BrewerHopAdviceOptionKind;
  title: string;
  rationale: string;
  conditions: string[];
  tradeoffs: string[];
  relatedIds: string[];
  /** Documentary or context references. They never qualify a figure written in the prose. */
  evidenceIds: string[];
  computed?: BrewerHopAdviceComputedLink;
  /** Derived tool-only prediction kept for exploration, never as a fact or documentary citation. */
  exploration?: BrewerHopAdviceToolExplorationLink[];
  /** `toolComputed` denotes only the selected contribution, never the truth of the option's prose. */
  provenance: typeof PROVENANCES[number];
}
export interface BrewerHopAdviceUnknown { id: string; question: string; changesChoice: string; relatedIds: string[] }
export interface BrewerHopAdviceProgram {
  kind: typeof PROGRAM_KINDS[number];
  evidenceId?: string;
  branchId?: string;
  note: string;
  /** Derived from the retained record of the exact branch; never from a tool name. */
  qualification: BrewerHopAdviceProgramQualification;
  /** No profile result is an operation: application needs the existing preview, validation and brewer gesture. */
  operational: 'notProvided';
}
export interface BrewerHopAdviceAnswer {
  summary: string;
  readingNote: string;
  options: BrewerHopAdviceOption[];
  unknowns: BrewerHopAdviceUnknown[];
  program: BrewerHopAdviceProgram;
  refusals: Array<{ text: string; relatedIds: string[] }>;
}
export interface BrewerHopAdviceProposal {
  readerReview: BrewerHopAdviceReaderReview[];
  annotations: BrewerHopAdviceAnnotation[];
  scopes: BrewerHopAdviceScope[];
  openQuestions: BrewerHopAdviceOpenQuestion[];
  materials: BrewerHopAdviceMaterialMention[];
  answer: BrewerHopAdviceAnswer;
}

// ---------------------------------------------------------------------------------------------
// Qualified evidence: only what a tool payload structurally establishes, retained for exact re-reading.

export interface BrewerHopAdviceIdentity {
  materialId: string;
  name: string;
  aliases?: string[];
  level: typeof IDENTITY_LEVELS[number];
  varietyId?: string;
  revision?: number;
  fingerprint?: string;
  origin?: string;
}
export interface BrewerHopAdviceScenarioBranch {
  id: string;
  reference: string;
  label: string;
  applicability: typeof APPLICABILITIES[number];
  proposal?: { baseline: string; applicability: 'available' | 'conditional' | 'unavailable'; changes: number; matchesRequestBaseline: boolean };
  limitations: string[];
}
interface RecordBase { id: string; tool: string; label: string }
export type BrewerHopAdviceEvidenceRecord =
  | RecordBase & { kind: 'reference' }
  | RecordBase & { kind: 'hopIdentity'; identities: BrewerHopAdviceIdentity[]; truncated: boolean }
  | RecordBase & { kind: 'scenarioRequest'; prepared: boolean; scenarioId?: string; baselineKind?: 'recipe' | 'hypothetical' }
  | RecordBase & { kind: 'scenarioResult'; scenarioId: string; revision: number; resultReference: string; resultStatus: string;
      baselineKind: 'recipe' | 'hypothetical'; baselineProgramReference?: string; branches: BrewerHopAdviceScenarioBranch[]; limitations: string[] }
  | RecordBase & { kind: 'prediction'; snapshot: BrewerHopAdvicePredictionSnapshotV1 };

/** Preserve the whole same-turn result; displayed fields are evidence too, not disposable decoration. */
export type BrewerHopAdviceEvidenceSource = Pick<BrewerEvidence, 'id' | 'name'> & Partial<Omit<BrewerEvidence, 'id' | 'name'>>;
export interface BrewerHopAdviceEvidenceReaders {
  /** readBrewingScenarioEvidence (server bundle or browser module); without it a simulation stays a reference. */
  readScenario?: (value: unknown, resolve?: (id: string) => unknown) => { result: any };
  /** Resolves an archiveReference to the original evidence payload of the same turn. */
  resolveEvidence?: (id: string) => unknown;
}

/** Tool evidence of one turn, shared by every closed answer format. */
export interface BrewerHopAdviceAnswerEvidence {
  /** Every tool that ran during this proposal. */
  tools: Array<{ id: string; name: string; label: string }>;
  /** Exact dependencies for every tool result received this turn, cited or not. */
  dependencies: BrewerHopAdviceEvidenceDependencyV2[];
  /** Qualified records of the cited evidence only, re-derivable from the turn payloads. */
  records: BrewerHopAdviceEvidenceRecord[];
}
/** Built by the server from the context it reloaded by scope, never copied from the caller. */
export interface BrewerHopAdviceAnswerServerContext { phase: string; provenance: string[]; loadedAt: number; binding: BrewerHopAdviceContextProjectionV1 }

/**
 * Neutral source of an answer. Each closed request version derives it from its own validated
 * snapshot; the shared answer rules never receive, rebuild or fake a versioned request.
 */
export interface BrewerHopAdviceAnswerSourceV1 {
  /** Exact question that every quote and span must match. */
  question: string;
  /** Source items an answer may relate to, besides its own open questions and materials. */
  relatedSourceIds: readonly string[];
  /** Source items that only guard: an intervention or alternative must also serve something else. */
  guardIds: readonly string[];
  /** Scope sealed at launch; the server-loaded binding must carry exactly this scope. */
  launchScope: unknown;
}
export interface BrewerHopAdviceAnswerSections {
  openQuestions: BrewerHopAdviceOpenQuestion[];
  materials: BrewerHopAdviceMaterialMention[];
  answer: BrewerHopAdviceAnswer;
}
export interface BrewerHopAdviceSealedAnswer extends BrewerHopAdviceAnswerSections {
  evidence: BrewerHopAdviceAnswerEvidence;
  serverContext: BrewerHopAdviceAnswerServerContext;
}

export interface BrewerHopAdviceProposalEnvelope {
  format: typeof BREWER_HOP_ADVICE_PROPOSAL_FORMAT;
  /** Never adopted here: only a brewer gesture in the local V4 path can retain an annotation. */
  status: 'proposal';
  /** Client declaration (unverified server-side); the browser adapter compares it with the current archive. */
  request: BrewerHopAdviceRequest;
  proposal: BrewerHopAdviceProposal;
  evidence: BrewerHopAdviceAnswerEvidence;
  serverContext: BrewerHopAdviceAnswerServerContext;
}

type Row = Record<string, unknown>;
/** What a proposal is checked against: the exact request, the tools that ran, and the retained qualified records. */
export interface BrewerHopAdviceProposalChecks {
  request: BrewerHopAdviceRequest;
  tools: ReadonlyArray<{ id: string; name: string }>;
  records: ReadonlyMap<string, BrewerHopAdviceEvidenceRecord>;
}
type Checks = BrewerHopAdviceProposalChecks;

const ID = /^assist-[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const unique = <T>(rows: readonly T[]) => [...new Set(rows)];
const clip = (value: unknown, max: number) => String(value ?? '').slice(0, max);
function fail(message: string): never { throw new Error(message); }

function onlyKeys(value: Row, allowed: readonly string[], label: string): void {
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extra.length) fail(`${label} : champ non pris en charge (${extra.slice(0, 3).join(', ')}). Aucun acteur, origine, source, claim ou mesure n’est accepté ici.`);
}
function row(value: unknown, label: string): Row {
  if (!isRow(value)) fail(`${label} : objet attendu.`);
  return value;
}
function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${label} : texte requis (${max} caractères maximum).`);
  return value;
}
/** Gemini often fills optional strings with ''; an empty string stays absent. */
function optionalText(value: unknown, label: string, max: number): string | undefined {
  if (value === undefined || value === '') return undefined;
  return text(value, label, max);
}
function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !(values as readonly string[]).includes(value)) fail(`${label} inconnu (${values.join(', ')}).`);
  return value as T;
}
function list<T>(value: unknown, label: string, max: number, read: (item: unknown, index: number) => T, min = 0): T[] {
  const rows = value === undefined ? [] : value;
  if (!Array.isArray(rows) || rows.length > max || rows.length < min) fail(`${label} : ${min} à ${max} éléments attendus.`);
  return rows.map(read);
}
function strings(value: unknown, label: string, max = 12, size = 160): string[] {
  const rows = list(value, label, max, (item, index) => text(item, `${label}[${index}]`, size));
  if (new Set(rows).size !== rows.length) fail(`${label} : identifiant répété.`);
  return rows;
}
function bool(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') fail(`${label} : booléen requis.`);
  return value;
}
function integer(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) fail(`${label} : entier positif requis.`);
  return value;
}

/** Canonical JSON (sorted keys): Firestore does not preserve map key order. */
export function stableBrewerHopAdviceJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableBrewerHopAdviceJson).join(',')}]`;
  const entries = Object.keys(value).sort().filter((key) => (value as Row)[key] !== undefined);
  return `{${entries.map((key) => `${JSON.stringify(key)}:${stableBrewerHopAdviceJson((value as Row)[key])}`).join(',')}}`;
}

const TOOL_DEPENDENCY_REFERENCE = /^brewer-hop-advice-tool-evidence-v2:sha256:[0-9a-f]{64}$/;

function projectEvidenceDependencies(evidence: readonly BrewerHopAdviceEvidenceSource[]): BrewerHopAdviceEvidenceDependencyV2[] {
  evidence.forEach((entry, index) => {
    text(entry.id, `Dépendance ${index + 1}.id`, 80);
    text(entry.name, `Dépendance ${index + 1}.name`, 80);
  });
  try {
    // Hash the original entry, including its display text/links and future JSON fields.
    // Reconstructing a smaller row here would hide mutations from the offline reader.
    return projectBrewerHopAdviceToolDependencies(evidence);
  } catch (error) {
    fail(`Dépendances d’outil impossibles à sceller : ${error instanceof Error ? error.message : 'résultat illisible'}`);
  }
}

function validateEvidenceDependencies(value: unknown, tools: readonly { id: string; name: string; label: string }[]): BrewerHopAdviceEvidenceDependencyV2[] {
  if (!Array.isArray(value)) fail('evidence.dependencies absent : toutes les sorties d’outil doivent être liées au tour.');
  const dependencies = list(value, 'evidence.dependencies', 40, (item, index) => {
    const dependency = row(item, `evidence.dependencies[${index}]`);
    onlyKeys(dependency, ['evidenceId', 'toolName', 'contentReference'], `evidence.dependencies[${index}]`);
    const contentReference = text(dependency.contentReference, `evidence.dependencies[${index}].contentReference`, 120);
    if (!TOOL_DEPENDENCY_REFERENCE.test(contentReference)) fail(`Dépendance ${String(dependency.evidenceId)} : référence de contenu inconnue.`);
    return { evidenceId: text(dependency.evidenceId, `evidence.dependencies[${index}].evidenceId`, 80),
      toolName: text(dependency.toolName, `evidence.dependencies[${index}].toolName`, 80), contentReference };
  });
  if (dependencies.length !== tools.length) fail('evidence.dependencies ne couvre pas chaque sortie d’outil reçue.');
  const ids = new Set<string>();
  dependencies.forEach((dependency, index) => {
    if (ids.has(dependency.evidenceId) || tools[index].id !== dependency.evidenceId || tools[index].name !== dependency.toolName) {
      fail(`Dépendance ${dependency.evidenceId} sans résultat d’outil exact, unique et dans l’ordre du tour.`);
    }
    ids.add(dependency.evidenceId);
  });
  return dependencies;
}

/** `launch` null only for the opaque launch of a future request: the binding structure is still checked. */
function serverContextBinding(value: unknown, launch: { scope: unknown } | null): BrewerHopAdviceContextProjectionV1 {
  const compared = compareBrewerHopAdviceContextBindings(value, value);
  if (compared.status !== 'matched') fail(`Liaison serveur de contexte absente ou invalide : ${compared.status === 'invalid' ? compared.reason : 'conflit interne'}`);
  const binding = value as BrewerHopAdviceContextProjectionV1;
  if (launch && stableBrewerHopAdviceJson(binding.scope) !== stableBrewerHopAdviceJson(launch.scope)) {
    fail('Le scope du contexte chargé côté serveur diffère du scope scellé au lancement.');
  }
  return structuredClone(binding);
}

/** Exact span check; offsets and text must both match the question. */
function exactSpan(question: string, value: unknown, label: string, trimmed = false): BrewerHopAdviceSpan {
  const span = row(value, label);
  onlyKeys(span, ['start', 'end', 'text'], label);
  const { start, end, text: quote } = span;
  if (typeof start !== 'number' || typeof end !== 'number' || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)
    || start < 0 || end <= start || typeof quote !== 'string' || question.slice(start, end) !== quote
    || (trimmed && quote.trim() !== quote)) fail(`${label} : fragment différent de la question exacte.`);
  return { start, end, text: quote };
}

/** The model quotes; the server computes offsets. A repeated quote needs its explicit occurrence. */
function resolveQuote(question: string, value: unknown, label: string): BrewerHopAdviceSpan {
  const raw = row(value, label);
  onlyKeys(raw, ['text', 'occurrence'], label);
  const quote = raw.text;
  if (typeof quote !== 'string' || !quote.trim() || quote.trim() !== quote || quote.length > 300) {
    fail(`${label} : citation exacte, sans espace de bord, requise.`);
  }
  const starts: number[] = [];
  for (let at = question.indexOf(quote); at >= 0; at = question.indexOf(quote, at + 1)) starts.push(at);
  if (!starts.length) fail(`${label} : « ${quote.slice(0, 60)} » est absent de la question exacte. Copie le texte caractère pour caractère.`);
  const occurrence = raw.occurrence === undefined || raw.occurrence === 0 ? undefined : raw.occurrence;
  if (occurrence !== undefined && (typeof occurrence !== 'number' || !Number.isSafeInteger(occurrence) || occurrence < 1 || occurrence > starts.length)) {
    fail(`${label} : occurrence ${String(occurrence)} hors des ${starts.length} apparitions de « ${quote.slice(0, 60)} ».`);
  }
  if (occurrence === undefined && starts.length > 1) fail(`${label} : « ${quote.slice(0, 60)} » apparaît ${starts.length} fois ; précise occurrence.`);
  const start = starts[(typeof occurrence === 'number' ? occurrence : 1) - 1];
  return { start, end: start + quote.length, text: quote };
}

// ---------------------------------------------------------------------------------------------
// Fragment context. These cues are deliberately narrow: they refuse or flag a reading, never create one.

const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’`]/g, '\'');
const MARKS = ['.', '!', '?', ';', '\n'];
/** Raw sentence containing a fragment (for verbatim qualifiers). */
function sentenceAround(question: string, span: BrewerHopAdviceSpan): string {
  const left = Math.max(...MARKS.map((mark) => question.lastIndexOf(mark, span.start - 1))) + 1;
  const ends = MARKS.map((mark) => question.indexOf(mark, span.end)).filter((index) => index >= 0);
  return question.slice(left, ends.length ? Math.min(...ends) : question.length);
}
const overlaps = (left: BrewerHopAdviceSpan, right: BrewerHopAdviceSpan) => left.start < right.end && right.start < left.end;
function editDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}
/** An approximate name may point to a candidate only if one of its words is close to the candidate's name or aliases. */
function quoteNamesIdentity(quote: string, identity: BrewerHopAdviceIdentity): boolean {
  const words = (value: string) => fold(value).split(/[^a-z0-9]+/).filter((word) => word.length >= 3);
  const names = [identity.name, ...(identity.aliases ?? [])].flatMap(words);
  return words(quote).some((word) => names.some((name) => name.includes(word) || word.includes(name)
    || editDistance(word, name) <= (Math.min(word.length, name.length) > 5 ? 2 : 1)));
}
function sentenceBefore(question: string, start: number): string {
  const before = question.slice(0, start);
  const cut = Math.max(...['.', '!', '?', ';', '\n'].map((mark) => before.lastIndexOf(mark)));
  return fold(before.slice(cut + 1));
}
function clauseBefore(question: string, start: number): string {
  const sentence = ` ${sentenceBefore(question, start)}`;
  const cut = Math.max(...[',', ' mais ', ' et ', ' but ', ' or ', ' tout en ', ' cependant ', ' pourtant '].map((mark) => {
    const index = sentence.lastIndexOf(mark);
    return index < 0 ? -1 : index + mark.length;
  }));
  return sentence.slice(Math.max(cut, 0));
}
// « ne… pas » counts after a verb of intention (colloquially « je veux pas », but never « je voudrais plus de » = more),
// or after an auxiliary with « ne » but not before « assez » : « je ne sais pas comment augmenter » and
// « n’a pas assez d’amertume » are not negated objectives.
const INTENT_VERBS = 'veux|veut|voulons|voulez|voudrais|souhaite|souhaitons|cherche|cherchons|choisis|choisit|choisissons|decide|decidons|compte|comptons|vais|allons|pense|desire|tiens|prevois|prevoyons|envisage|envisageons';
const NEGATION = new RegExp('(?:^|[^a-z])(?:'
  + `(?:sans|aucune?|without|not|never|don't|doesn't|instead\\s+of|rather\\s+than|plutot\\s+que|pas\\s+question|pas\\s+(?:de|plus)`
  + `|(?:ne\\s+(?:(?:le|la|les|en|y)\\s+|l')?|n')(?:${INTENT_VERBS})\\s+(?:pas|plus|jamais)|(?:${INTENT_VERBS})\\s+(?:pas|jamais)`
  + `|(?:ne\\s+|n')(?:suis|ai|avons|a)\\s+(?:pas|jamais)(?!\\s+assez))(?=$|[^a-z])`
  + `|pas\\s+d'|au\\s+lieu\\s+d)`);
const HYPOTHESIS = /(?:^|[^a-z])(?:si\s+(?:(?:je|tu|on|nous|vous|il|elle|ils|elles|ma|mon|mes|ta|ton|tes|la|le|les|ca|cette|ce|ces)(?=$|[^a-z])|[jtlc]')|est[- ]ce\s+qu|serai[st]?(?=$|[^a-z])|serait|serions|seraient|sera(?:s|it)?(?=$|[^a-z])|seront|pourrai[st]?(?=$|[^a-z])|pourrait|risque|if(?=$|[^a-z])|would|could)/;
/** « sans décider d’augmenter… », « je ne choisis pas encore de renforcer… » : negation in the fragment's clause. */
export const brewerHopAdviceNegated = (question: string, span: BrewerHopAdviceSpan) => NEGATION.test(clauseBefore(question, span.start));
/** « si j’amérise…, est-ce que je suis trop… » : a conditional or a question, not a reported fact. */
export const brewerHopAdviceHypothetical = (question: string, span: BrewerHopAdviceSpan) => HYPOTHESIS.test(sentenceBefore(question, span.start));

/** Cues shown to the model (and to the brewer) on a local reading that may be wrong. They never correct it. */
export function brewerHopAdviceReaderCues(request: BrewerHopAdviceRequest): Array<{ id: string; negatedObjective: boolean; hypotheticalContext: boolean }> {
  return request.readerAnnotations.map((entry) => ({
    id: entry.id,
    negatedObjective: (entry.direction === 'increase' || entry.direction === 'decrease') && brewerHopAdviceNegated(request.question, entry.span),
    hypotheticalContext: brewerHopAdviceHypothetical(request.question, entry.span),
  }));
}

const QUANTITY = /\d+(?:[.,]\d+)?\s*(?:%|°\s*[CFP]?|g\s*\/\s*h?l|mg\s*\/\s*l|kg|grammes?|grams?|g|ppm|ibu|bu|ebc|ml|cl|hl|litres?|liters?|l|heures?|hours?|h|minutes?|min|jours?|days?|semaines?|weeks?|bars?)(?![\p{L}])/giu;
const LABELLED_NUMBER = /\b(?:ph|ibu|ebc|abv|alpha)\s*[:=]?\s*\d/giu;
const URL = /(?:https?:\/\/|www\.)/i;

/**
 * Coarse refusal guard, not a certification of prose: a figure with a unit that the brewer did not write
 * is refused in every model text. Computed values are displayed from the linked tool record instead.
 */
function assertPlainText(value: string, question: string, label: string): void {
  if (URL.test(value)) fail(`${label} : aucune URL ni source inventée ; les sources viennent des outils ou du corpus local.`);
  for (const pattern of [QUANTITY, LABELLED_NUMBER]) {
    for (const match of value.matchAll(pattern)) {
      if (!question.includes(match[0])) {
        fail(`${label} : « ${match[0]} » est un chiffre écrit par le modèle. Retire-le ; une valeur calculée se lie par computed à la preuve exacte et s’affiche depuis elle.`);
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Request (client → server). The question and every span stay exact.

export function validateBrewerHopAdviceRequest(value: unknown, question?: string): BrewerHopAdviceRequest {
  const request = row(value, 'Lecture assistée');
  onlyKeys(request, ['format', 'question', 'sourceReadingReference', 'contextLaunch', 'readerAnnotations', 'readerScopes'], 'Lecture assistée');
  if (request.format !== BREWER_HOP_ADVICE_REQUEST_FORMAT) fail('Format de lecture assistée inconnu.');
  const exact = text(request.question, 'Question exacte', 4000);
  if (question !== undefined && question !== exact) {
    fail('La question envoyée diffère de la question lue localement : la lecture assistée exige le texte exact, sans normalisation.');
  }
  const sourceReadingReference = text(request.sourceReadingReference, 'Référence de lecture', 300);
  if (!isBrewerHopAdviceContextLaunchClaim(request.contextLaunch)) {
    fail('Lancement de contexte absent ou hors contrat strict. Reprends la lecture exacte depuis la source courante.');
  }
  if (request.contextLaunch.sourceReadingReference !== sourceReadingReference) {
    fail('La référence de lecture diffère de celle scellée au lancement de contexte.');
  }
  const contextLaunch = structuredClone(request.contextLaunch);
  const readerAnnotations = list(request.readerAnnotations, 'Annotations locales', 40, (item, index) => {
    const label = `Annotation locale ${index + 1}`;
    const annotation = row(item, label);
    onlyKeys(annotation, ['id', 'span', 'term', 'direction', 'requirement', 'qualification', 'familyId', 'dimension', 'origin'], label);
    const qualification = optionalText(annotation.qualification, `${label}.qualification`, 400);
    const familyId = optionalText(annotation.familyId, `${label}.familyId`, 60);
    const dimension = optionalText(annotation.dimension, `${label}.dimension`, 40);
    return {
      id: text(annotation.id, `${label}.id`, 160), span: exactSpan(exact, annotation.span, `${label}.span`),
      term: text(annotation.term, `${label}.term`, 200), direction: oneOf(annotation.direction, DIRECTIONS, `${label}.direction`),
      requirement: oneOf(annotation.requirement, ['required', 'optional'] as const, `${label}.requirement`),
      ...(qualification ? { qualification } : {}), ...(familyId ? { familyId } : {}), ...(dimension ? { dimension } : {}),
      origin: oneOf(annotation.origin, ['parser', 'brasseur'] as const, `${label}.origin`),
    };
  });
  const readerScopes = list(request.readerScopes, 'Portées locales', 12, (item, index) => {
    const label = `Portée locale ${index + 1}`;
    const scope = row(item, label);
    onlyKeys(scope, ['id', 'kind', 'span', 'focusSpan'], label);
    return {
      id: text(scope.id, `${label}.id`, 160), kind: oneOf(scope.kind, SCOPE_KINDS, `${label}.kind`),
      span: exactSpan(exact, scope.span, `${label}.span`, true),
      ...(scope.focusSpan !== undefined ? { focusSpan: exactSpan(exact, scope.focusSpan, `${label}.focusSpan`, true) } : {}),
    };
  });
  const ids = [...readerAnnotations.map((entry) => entry.id), ...readerScopes.map((entry) => entry.id)];
  if (new Set(ids).size !== ids.length) fail('Identifiant de lecture locale répété.');
  return { format: BREWER_HOP_ADVICE_REQUEST_FORMAT, question: exact, sourceReadingReference, contextLaunch, readerAnnotations, readerScopes };
}

// ---------------------------------------------------------------------------------------------
// Evidence qualification from real payloads. Paths are tool-specific; a free string never qualifies.

function hopDocumentChecked(collection: 'hopVarieties' | 'hopLots', value: Row): boolean {
  try {
    assertHopDocument(collection, value, String(value.id));
    return true;
  } catch {
    return false;
  }
}

const aliasesOf = (value: unknown) => {
  const aliases = (Array.isArray(value) ? value : []).filter((entry): entry is string => typeof entry === 'string' && !!entry.trim()).slice(0, 6).map((entry) => clip(entry, 80));
  return aliases.length ? { aliases } : {};
};

function hopIdentities(data: unknown): { identities: BrewerHopAdviceIdentity[]; truncated: boolean } | undefined {
  if (!isRow(data) || !Array.isArray(data.varieties) || !Array.isArray(data.lots)) return undefined;
  const identities: BrewerHopAdviceIdentity[] = [];
  for (const variety of data.varieties) {
    if (!isRow(variety) || typeof variety.id !== 'string' || !variety.id || typeof variety.name !== 'string') continue;
    const meta = isRow(variety.catalogueMeta) ? variety.catalogueMeta : undefined;
    identities.push({ materialId: `variety:${variety.id}`, name: clip(variety.name, 120), ...aliasesOf(variety.aliases),
      level: hopDocumentChecked('hopVarieties', variety) ? 'indexRecord' : 'unvalidatedRecord',
      ...(meta && Number.isSafeInteger(meta.revision) ? { revision: meta.revision as number } : {}),
      ...(meta && typeof meta.fingerprint === 'string' ? { fingerprint: clip(meta.fingerprint, 128) } : {}) });
  }
  for (const lot of data.lots) {
    if (!isRow(lot) || typeof lot.id !== 'string' || !lot.id || typeof lot.name !== 'string') continue;
    identities.push({ materialId: `lot:${lot.id}`, name: clip(lot.name, 120),
      level: hopDocumentChecked('hopLots', lot) ? 'indexRecord' : 'unvalidatedRecord',
      ...(typeof lot.varietyId === 'string' ? { varietyId: clip(lot.varietyId, 160) } : {}) });
  }
  const truncated = (typeof data.totalMatches === 'number' && data.totalMatches > data.varieties.length)
    || (typeof data.totalLots === 'number' && data.totalLots > data.lots.length);
  return { identities: identities.slice(0, 40), truncated: truncated || identities.length > 40 };
}

function catalogueIdentities(data: unknown): { identities: BrewerHopAdviceIdentity[]; truncated: boolean } | undefined {
  if (!isRow(data) || !Array.isArray(data.records)) return undefined;
  const identities: BrewerHopAdviceIdentity[] = [];
  // Only hopVariety records designate a hop; yeast strains and styles never do, and the catalogue has no lots.
  for (const entry of data.records) {
    if (!isRow(entry) || entry.kind !== 'hopVariety' || typeof entry.id !== 'string' || !isRow(entry.record)
      || entry.record.id !== entry.id || typeof entry.record.name !== 'string') continue;
    identities.push({ materialId: `variety:${entry.id}`, name: clip(entry.record.name, 120), ...aliasesOf(entry.record.aliases),
      level: hopDocumentChecked('hopVarieties', entry.record) ? 'catalogueRecord' : 'unvalidatedRecord',
      ...(Number.isSafeInteger(entry.revision) ? { revision: entry.revision as number } : {}),
      ...(typeof entry.fingerprint === 'string' ? { fingerprint: clip(entry.fingerprint, 128) } : {}),
      ...(typeof entry.origin === 'string' ? { origin: clip(entry.origin, 40) } : {}) });
  }
  return { identities: identities.slice(0, 40), truncated: data.truncated === true || identities.length > 40 };
}

function scenarioRecord(base: RecordBase, result: any): BrewerHopAdviceEvidenceRecord {
  const baseline = result?.requestSnapshot?.baseline;
  if (!isRow(result) || typeof result.reference !== 'string' || typeof result.scenarioId !== 'string' || !isRow(baseline)
    || !['recipe', 'hypothetical'].includes(String(baseline.kind)) || !isRow(result.baseline) || !Array.isArray(result.branches)) {
    return { ...base, kind: 'reference' };
  }
  const programReference = baseline.kind === 'recipe' && typeof baseline.programReference === 'string' ? baseline.programReference : undefined;
  const branches = [result.baseline, ...result.branches].filter(isRow).map((branch): BrewerHopAdviceScenarioBranch => {
    const proposal = isRow(branch.programProposal) ? branch.programProposal : undefined;
    return {
      id: clip(branch.id, 120), reference: clip(branch.reference, 200), label: clip(branch.label, 120),
      applicability: (APPLICABILITIES as readonly string[]).includes(String(branch.applicability)) ? branch.applicability as BrewerHopAdviceScenarioBranch['applicability'] : 'unavailable',
      ...(proposal && typeof proposal.baseline === 'string' ? { proposal: {
        baseline: clip(proposal.baseline, 200),
        applicability: ['available', 'conditional'].includes(String(proposal.applicability)) ? proposal.applicability as 'available' | 'conditional' : 'unavailable',
        changes: Array.isArray(proposal.changes) ? proposal.changes.length : 0,
        // The proposal must start from the very programme of the request; another base is only a comparison.
        matchesRequestBaseline: !!programReference && proposal.baseline === programReference,
      } } : {}),
      limitations: (Array.isArray(branch.limitations) ? branch.limitations : []).slice(0, 6).map((entry: unknown) => clip(entry, 300)),
    };
  });
  return { ...base, kind: 'scenarioResult', scenarioId: clip(result.scenarioId, 120), revision: Number.isSafeInteger(result.revision) ? result.revision as number : 0,
    resultReference: clip(result.reference, 200), resultStatus: clip(result.status, 40), baselineKind: baseline.kind as 'recipe' | 'hypothetical',
    ...(programReference ? { baselineProgramReference: clip(programReference, 200) } : {}), branches: branches.slice(0, 12),
    limitations: (Array.isArray(result.limitations) ? result.limitations : []).slice(0, 8).map((entry: unknown) => clip(entry, 300)) };
}

/** Same function on server and browser: what a payload establishes, and nothing more. */
export function qualifyBrewerHopAdviceEvidence(entry: BrewerHopAdviceEvidenceSource, readers: BrewerHopAdviceEvidenceReaders = {}): BrewerHopAdviceEvidenceRecord {
  const base: RecordBase = { id: clip(entry.id, 80), tool: clip(entry.name, 80), label: clip(entry.label ?? entry.name, 200) };
  const data = entry.data;
  if (entry.name === 'lookup_hop_reference') {
    const found = hopIdentities(data);
    return found ? { ...base, kind: 'hopIdentity', ...found } : { ...base, kind: 'reference' };
  }
  if (entry.name === 'lookup_brewing_catalogue') {
    const found = catalogueIdentities(data);
    return found ? { ...base, kind: 'hopIdentity', ...found } : { ...base, kind: 'reference' };
  }
  if (entry.name === 'prepare_brewing_scenario') {
    if (!isRow(data) || !('request' in data)) return { ...base, kind: 'reference' };
    const request = data.request;
    if (request === null) return { ...base, kind: 'scenarioRequest', prepared: false };
    if (!isRow(request) || typeof request.scenarioId !== 'string' || !isRow(request.baseline)
      || !['recipe', 'hypothetical'].includes(String(request.baseline.kind))) return { ...base, kind: 'reference' };
    return { ...base, kind: 'scenarioRequest', prepared: true, scenarioId: clip(request.scenarioId, 120),
      baselineKind: request.baseline.kind as 'recipe' | 'hypothetical' };
  }
  if (entry.name === 'simulate_brewing_scenarios') {
    if (!readers.readScenario) return { ...base, kind: 'reference' };
    try {
      return scenarioRecord(base, readers.readScenario(data, readers.resolveEvidence).result);
    } catch {
      return { ...base, kind: 'reference' };
    }
  }
  if (entry.name === 'predict_hop_aroma') {
    const snapshot = tryCreateBrewerHopAdvicePredictionSnapshot(data);
    if (snapshot) return { ...base, kind: 'prediction', snapshot };
    return { ...base, kind: 'reference' };
  }
  return { ...base, kind: 'reference' };
}

function readRecord(value: unknown, label: string): BrewerHopAdviceEvidenceRecord {
  const record = row(value, label);
  const base: RecordBase = { id: text(record.id, `${label}.id`, 80), tool: text(record.tool, `${label}.tool`, 80), label: text(record.label, `${label}.label`, 200) };
  const kind = oneOf(record.kind, ['reference', 'hopIdentity', 'scenarioRequest', 'scenarioResult', 'prediction'] as const, `${label}.kind`);
  const limitations = (value: unknown, max: number) => list(value, `${label}.limitations`, max, (entry) => text(entry, 'limitation', 300));
  if (kind === 'reference') {
    onlyKeys(record, ['id', 'tool', 'label', 'kind'], label);
    return { ...base, kind };
  }
  if (kind === 'hopIdentity') {
    onlyKeys(record, ['id', 'tool', 'label', 'kind', 'identities', 'truncated'], label);
    if (!['lookup_hop_reference', 'lookup_brewing_catalogue'].includes(base.tool)) fail(`${label} : seul un outil d’identité houblon établit une identité.`);
    return { ...base, kind, truncated: bool(record.truncated, `${label}.truncated`), identities: list(record.identities, `${label}.identities`, 40, (item, index) => {
      const identity = row(item, `${label}.identities[${index}]`);
      onlyKeys(identity, ['materialId', 'name', 'aliases', 'level', 'varietyId', 'revision', 'fingerprint', 'origin'], `${label}.identities[${index}]`);
      const materialId = text(identity.materialId, 'materialId', 200);
      if (!/^(?:variety|lot):[^:\s]+$/.test(materialId) || (base.tool === 'lookup_brewing_catalogue' && !materialId.startsWith('variety:'))) {
        fail(`${label} : identité ${materialId} hors du namespace de cet outil.`);
      }
      const varietyId = optionalText(identity.varietyId, 'varietyId', 160);
      const fingerprint = optionalText(identity.fingerprint, 'fingerprint', 128);
      const origin = optionalText(identity.origin, 'origin', 40);
      const aliases = identity.aliases === undefined ? undefined : list(identity.aliases, 'aliases', 6, (entry) => text(entry, 'alias', 80), 1);
      return { materialId, name: text(identity.name, 'name', 120), ...(aliases ? { aliases } : {}), level: oneOf(identity.level, IDENTITY_LEVELS, 'level'),
        ...(varietyId ? { varietyId } : {}), ...(identity.revision !== undefined ? { revision: integer(identity.revision, 'revision') } : {}),
        ...(fingerprint ? { fingerprint } : {}), ...(origin ? { origin } : {}) };
    }) };
  }
  if (kind === 'scenarioRequest') {
    onlyKeys(record, ['id', 'tool', 'label', 'kind', 'prepared', 'scenarioId', 'baselineKind'], label);
    if (base.tool !== 'prepare_brewing_scenario') fail(`${label} : une requête préparée vient de prepare_brewing_scenario.`);
    const scenarioId = optionalText(record.scenarioId, 'scenarioId', 120);
    return { ...base, kind, prepared: bool(record.prepared, 'prepared'), ...(scenarioId ? { scenarioId } : {}),
      ...(record.baselineKind !== undefined ? { baselineKind: oneOf(record.baselineKind, ['recipe', 'hypothetical'] as const, 'baselineKind') } : {}) };
  }
  if (kind === 'scenarioResult') {
    onlyKeys(record, ['id', 'tool', 'label', 'kind', 'scenarioId', 'revision', 'resultReference', 'resultStatus', 'baselineKind',
      'baselineProgramReference', 'branches', 'limitations'], label);
    if (base.tool !== 'simulate_brewing_scenarios') fail(`${label} : un résultat de scénario vient de simulate_brewing_scenarios.`);
    const baselineProgramReference = optionalText(record.baselineProgramReference, 'baselineProgramReference', 200);
    const branches = list(record.branches, `${label}.branches`, 12, (item, index) => {
      const branch = row(item, `${label}.branches[${index}]`);
      onlyKeys(branch, ['id', 'reference', 'label', 'applicability', 'proposal', 'limitations'], `${label}.branches[${index}]`);
      let proposal: BrewerHopAdviceScenarioBranch['proposal'];
      if (branch.proposal !== undefined) {
        const raw = row(branch.proposal, 'proposal');
        onlyKeys(raw, ['baseline', 'applicability', 'changes', 'matchesRequestBaseline'], 'proposal');
        proposal = { baseline: text(raw.baseline, 'proposal.baseline', 200), applicability: oneOf(raw.applicability, ['available', 'conditional', 'unavailable'] as const, 'proposal.applicability'),
          changes: integer(raw.changes, 'proposal.changes'), matchesRequestBaseline: bool(raw.matchesRequestBaseline, 'proposal.matchesRequestBaseline') };
        if (proposal.matchesRequestBaseline !== (!!baselineProgramReference && proposal.baseline === baselineProgramReference)) {
          fail(`${label} : filiation de programme incohérente avec la base de la requête.`);
        }
      }
      return { id: text(branch.id, 'id', 120), reference: text(branch.reference, 'reference', 200), label: text(branch.label, 'label', 120),
        applicability: oneOf(branch.applicability, APPLICABILITIES, 'applicability'), ...(proposal ? { proposal } : {}), limitations: limitations(branch.limitations, 6) };
    });
    if (new Set(branches.map((branch) => branch.id)).size !== branches.length) fail(`${label} : branche répétée.`);
    return { ...base, kind, scenarioId: text(record.scenarioId, 'scenarioId', 120), revision: integer(record.revision, 'revision'),
      resultReference: text(record.resultReference, 'resultReference', 200), resultStatus: text(record.resultStatus, 'resultStatus', 40),
      baselineKind: oneOf(record.baselineKind, ['recipe', 'hypothetical'] as const, 'baselineKind'),
      ...(baselineProgramReference ? { baselineProgramReference } : {}), branches, limitations: limitations(record.limitations, 8) };
  }
  onlyKeys(record, ['id', 'tool', 'label', 'kind', 'snapshot'], label);
  if (base.tool !== 'predict_hop_aroma') fail(`${label} : une prédiction vient de predict_hop_aroma.`);
  assertBrewerHopAdvicePredictionSnapshot(record.snapshot);
  return { ...base, kind: 'prediction', snapshot: record.snapshot as BrewerHopAdvicePredictionSnapshotV1 };
}

/** A branch is a program preview only with its own proposal, from the request's programme, and applicable as a branch. */
export function qualifyBrewerHopAdviceBranch(branch: BrewerHopAdviceScenarioBranch): BrewerHopAdviceProgramQualification {
  return branch.proposal && branch.proposal.matchesRequestBaseline && branch.proposal.changes > 0
    && (branch.applicability === 'available' || branch.applicability === 'conditional')
    && (branch.proposal.applicability === 'available' || branch.proposal.applicability === 'conditional')
    ? 'programPreview' : 'computedResult';
}

function programQualification(program: Omit<BrewerHopAdviceProgram, 'qualification' | 'operational'>, records: ReadonlyMap<string, BrewerHopAdviceEvidenceRecord>): BrewerHopAdviceProgramQualification {
  if (program.kind === 'none') {
    if (program.evidenceId !== undefined || program.branchId !== undefined) fail('Programme none : aucune preuve ni branche à citer.');
    return 'none';
  }
  const record = program.evidenceId ? records.get(program.evidenceId) : undefined;
  if (program.kind === 'preparedRequest') {
    if (!record || record.kind !== 'scenarioRequest' || !record.prepared || program.branchId !== undefined) {
      fail('Programme preparedRequest : il faut une requête réellement préparée par prepare_brewing_scenario (request non nulle), sans branche.');
    }
    return 'preparedRequest';
  }
  if (!record || record.kind !== 'scenarioResult') fail('Programme scenarioBranch : il faut un résultat simulate_brewing_scenarios retenu ; un nom d’outil ou une prédiction ne prépare pas de programme.');
  const branch = record.branches.find((entry) => entry.id === program.branchId);
  if (!branch) fail(`Programme scenarioBranch : branche ${String(program.branchId)} absente du résultat ${record.resultReference}.`);
  return qualifyBrewerHopAdviceBranch(branch);
}

// ---------------------------------------------------------------------------------------------
// Model arguments → typed proposal.

const READING_RAW_KEYS = ['property', 'role', 'direction', 'qualifier', 'required', 'basis', 'metric', 'subject', 'subjectLabel',
  'sensoryContext', 'partner', 'familyId', 'related', 'compensates', 'reason'];

function rawReading(raw: Row, question: string, label: string): BrewerHopAdviceReading {
  const qualifier = optionalText(raw.qualifier, `${label}.qualifier`, 120);
  const familyId = optionalText(raw.familyId, `${label}.familyId`, 60);
  return {
    property: oneOf(raw.property, PROPERTIES, `${label}.property`),
    role: oneOf(raw.role, ROLES, `${label}.role`),
    direction: oneOf(raw.direction, DIRECTIONS, `${label}.direction`),
    ...(qualifier ? { qualifier } : {}),
    required: bool(raw.required, `${label}.required`),
    basis: oneOf(raw.basis, BASES, `${label}.basis`),
    metric: oneOf(raw.metric, METRICS, `${label}.metric`),
    subject: { kind: oneOf(raw.subject, SUBJECTS, `${label}.subject`), label: text(raw.subjectLabel, `${label}.subjectLabel`, 120),
      sensoryContext: oneOf(raw.sensoryContext, SENSORY_CONTEXTS, `${label}.sensoryContext`) },
    ...(raw.partner !== undefined && raw.partner !== null ? { partner: resolveQuote(question, raw.partner, `${label}.partner`) } : {}),
    ...(familyId ? { familyId } : {}),
    relatedIds: strings(raw.related, `${label}.related`),
    compensates: strings(raw.compensates, `${label}.compensates`, 4),
    reason: text(raw.reason, `${label}.reason`, 300),
  };
}

interface BrewerHopAdviceComputedInput { evidenceId: string; branchId?: string; predictionSelection?: BrewerHopAdvicePredictionSelectionInput; predictionSelectionPresent: boolean }
interface BoundComputedInput {
  computed?: BrewerHopAdviceComputedLink;
  fallbackEvidenceId?: string;
  fallbackReason?: BrewerHopAdviceToolExplorationLink['reason'];
}

function rawPredictionSelection(value: unknown, label: string): BrewerHopAdvicePredictionSelectionInput | undefined {
  const raw = row(value, label);
  const kind = oneOf(raw.kind, ['alternative', 'recipeOverall', 'recipeAddition'] as const, `${label}.kind`);
  if (kind === 'alternative') {
    onlyKeys(raw, ['kind', 'index'], label);
    if (typeof raw.index !== 'number' || !Number.isSafeInteger(raw.index) || raw.index < 0) return undefined;
    return { kind, index: raw.index };
  }
  if (kind === 'recipeOverall') {
    onlyKeys(raw, ['kind'], label);
    return { kind };
  }
  onlyKeys(raw, ['kind', 'additionId'], label);
  const additionId = optionalText(raw.additionId, `${label}.additionId`, 120);
  return additionId ? { kind, additionId } : undefined;
}

function rawComputedInput(value: unknown, label: string): BrewerHopAdviceComputedInput | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = row(value, label);
  onlyKeys(raw, ['evidenceId', 'branchId', 'predictionSelection'], label);
  const branchId = optionalText(raw.branchId, `${label}.branchId`, 120);
  const hasPredictionSelection = raw.predictionSelection !== undefined && raw.predictionSelection !== null;
  const predictionSelection = hasPredictionSelection ? rawPredictionSelection(raw.predictionSelection, `${label}.predictionSelection`) : undefined;
  if (branchId && hasPredictionSelection) fail(`${label} : choisis une branche ou une contribution prédite, pas les deux.`);
  return { evidenceId: text(raw.evidenceId, `${label}.evidenceId`, 80), ...(branchId ? { branchId } : {}),
    ...(predictionSelection ? { predictionSelection } : {}), predictionSelectionPresent: hasPredictionSelection };
}

function storedPredictionSelection(value: unknown, label: string): BrewerHopAdvicePredictionSelection {
  const raw = row(value, label);
  const input = rawPredictionSelection(Object.fromEntries(Object.entries(raw).filter(([key]) => key !== 'reference')), label);
  if (!input) fail(`${label} incomplet.`);
  onlyKeys(raw, ['kind', 'index', 'additionId', 'reference'], label);
  return { ...input, reference: text(raw.reference, `${label}.reference`, 160) } as BrewerHopAdvicePredictionSelection;
}

function readStoredComputed(value: unknown, label: string): BrewerHopAdviceComputedLink | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = row(value, label);
  onlyKeys(raw, ['evidenceId', 'branchId', 'predictionSelection'], label);
  const evidenceId = text(raw.evidenceId, `${label}.evidenceId`, 80);
  if (raw.branchId !== undefined) {
    if (raw.predictionSelection !== undefined) fail(`${label} : deux contributions concurrentes.`);
    return { evidenceId, branchId: text(raw.branchId, `${label}.branchId`, 120) };
  }
  if (raw.predictionSelection === undefined) fail(`${label} : un sélecteur est requis.`);
  return { evidenceId, predictionSelection: storedPredictionSelection(raw.predictionSelection, `${label}.predictionSelection`) };
}

function bindComputed(value: unknown, records: ReadonlyMap<string, BrewerHopAdviceEvidenceRecord>, label: string): BoundComputedInput {
  const input = rawComputedInput(value, label);
  if (!input) return {};
  const evidence = records.get(input.evidenceId);
  if (input.predictionSelectionPresent) {
    if (evidence?.kind !== 'prediction') {
      if (evidence?.tool === 'predict_hop_aroma') {
        return { fallbackEvidenceId: input.evidenceId,
          fallbackReason: evidence.kind === 'reference' ? 'payloadUnqualified' : 'contributionUnqualified' };
      }
      fail(`${label} : une contribution predict_hop_aroma ne peut pas viser cet enregistrement.`);
    }
    if (!input.predictionSelection) return { fallbackEvidenceId: input.evidenceId, fallbackReason: 'contributionUnqualified' };
    const predictionSelection = { ...input.predictionSelection, reference: evidence.snapshot.reference } as BrewerHopAdvicePredictionSelection;
    try {
      resolveBrewerHopAdvicePredictionContribution(evidence.snapshot, predictionSelection);
      return { computed: { evidenceId: input.evidenceId, predictionSelection } };
    } catch {
      // Preserve the answer and evidence as a citation; only the calculated attribution is dropped.
      return { fallbackEvidenceId: input.evidenceId, fallbackReason: 'contributionUnqualified' };
    }
  }
  if (input.branchId !== undefined) return { computed: { evidenceId: input.evidenceId, branchId: input.branchId } };
  if (evidence?.kind === 'prediction') return { fallbackEvidenceId: input.evidenceId, fallbackReason: 'contributionUnqualified' };
  if (evidence?.tool === 'predict_hop_aroma') return { fallbackEvidenceId: input.evidenceId, fallbackReason: 'payloadUnqualified' };
  fail(`${label} : computed exige une branche de scénario ou un sélecteur de contribution.`);
}

function explorationNote(reason: BrewerHopAdviceToolExplorationLink['reason']): string {
  return reason === 'payloadUnqualified'
    ? 'Résultat predict_hop_aroma conservé comme exploration : sa structure ne permet pas de qualifier une contribution calculée.'
    : 'Résultat predict_hop_aroma conservé comme exploration : aucune contribution exacte ne peut être reliée à cette option.';
}

function createExplorationLink(evidenceId: string, reason: BrewerHopAdviceToolExplorationLink['reason']): BrewerHopAdviceToolExplorationLink {
  return { evidenceId, reason, note: explorationNote(reason) };
}

function readStoredExploration(value: unknown, label: string): BrewerHopAdviceToolExplorationLink {
  const raw = row(value, label);
  onlyKeys(raw, ['evidenceId', 'reason', 'note'], label);
  const reason = oneOf(raw.reason, ['payloadUnqualified', 'contributionUnqualified'] as const, `${label}.reason`);
  const note = text(raw.note, `${label}.note`, 300);
  if (note !== explorationNote(reason)) fail(`${label}.note ne correspond pas au motif serveur.`);
  return { evidenceId: text(raw.evidenceId, `${label}.evidenceId`, 80), reason, note };
}

function optionProvenance(option: Pick<BrewerHopAdviceOption, 'computed' | 'exploration' | 'evidenceIds'>): BrewerHopAdviceOption['provenance'] {
  return option.computed ? 'toolComputed' : option.exploration?.length ? 'toolExploration'
    : option.evidenceIds.length ? 'documentaryReference' : 'modelExplanation';
}

/** Converts and validates the arguments of finish_hop_advice_proposal. Throws a message the model can act on. */
export function normalizeBrewerHopAdviceProposal(value: unknown, checks: Checks): BrewerHopAdviceProposal {
  const question = checks.request.question;
  const raw = row(value, 'Proposition');
  onlyKeys(raw, ['readerReview', 'annotations', 'scopes', 'openQuestions', 'materials', 'answer'], 'Proposition');
  const readerReview = list(raw.readerReview, 'readerReview', 40, (item, index) => {
    const label = `readerReview[${index}]`;
    const review = row(item, label);
    onlyKeys(review, ['annotationId', 'verdict', 'reason', 'revision'], label);
    let revision: BrewerHopAdviceReading | undefined;
    if (review.revision !== undefined && review.revision !== null) {
      const rawRevision = row(review.revision, `${label}.revision`);
      onlyKeys(rawRevision, READING_RAW_KEYS, `${label}.revision`);
      revision = rawReading(rawRevision, question, `${label}.revision`);
    }
    return { annotationId: text(review.annotationId, `${label}.annotationId`, 160), verdict: oneOf(review.verdict, VERDICTS, `${label}.verdict`),
      reason: text(review.reason, `${label}.reason`, 300), ...(revision ? { revision } : {}) };
  });
  const annotations = list(raw.annotations, 'annotations', 12, (item, index) => {
    const label = `annotations[${index}]`;
    const annotation = row(item, label);
    onlyKeys(annotation, ['id', 'quotes', ...READING_RAW_KEYS], label);
    return { id: text(annotation.id, `${label}.id`, 60),
      spans: list(annotation.quotes, `${label}.quotes`, 3, (quote, at) => resolveQuote(question, quote, `${label}.quotes[${at}]`), 1),
      reading: rawReading(annotation, question, label) };
  });
  const scopes = list(raw.scopes, 'scopes', 6, (item, index) => {
    const label = `scopes[${index}]`;
    const scope = row(item, label);
    onlyKeys(scope, ['id', 'kind', 'quote', 'focus', 'context', 'related', 'reason'], label);
    return { id: text(scope.id, `${label}.id`, 60), kind: oneOf(scope.kind, SCOPE_KINDS, `${label}.kind`),
      span: resolveQuote(question, scope.quote, `${label}.quote`),
      ...(scope.focus !== undefined && scope.focus !== null ? { focusSpan: resolveQuote(question, scope.focus, `${label}.focus`) } : {}),
      contextSpans: list(scope.context, `${label}.context`, 4, (quote, at) => resolveQuote(question, quote, `${label}.context[${at}]`)),
      relatedIds: strings(scope.related, `${label}.related`), reason: text(scope.reason, `${label}.reason`, 300) };
  });
  const proposal: BrewerHopAdviceProposal = {
    readerReview, annotations, scopes, ...normalizeAnswerSections(raw, question, checks.records, 'related'),
  };
  assertProposalSemantics(proposal, checks);
  return proposal;
}

/** Model arguments → open questions, materials and answer. `relationKey` is the raw name of each relation list. */
function normalizeAnswerSections(raw: Row, question: string, records: ReadonlyMap<string, BrewerHopAdviceEvidenceRecord>,
  relationKey: 'related' | 'relatedIds'): BrewerHopAdviceAnswerSections {
  const openQuestions = list(raw.openQuestions, 'openQuestions', 6, (item, index) => {
    const label = `openQuestions[${index}]`;
    const open = row(item, label);
    onlyKeys(open, ['id', 'kind', 'quotes', 'restatement', 'whyOpen', relationKey], label);
    return { id: text(open.id, `${label}.id`, 60), kind: oneOf(open.kind, OPEN_KINDS, `${label}.kind`),
      spans: list(open.quotes, `${label}.quotes`, 3, (quote, at) => resolveQuote(question, quote, `${label}.quotes[${at}]`), 1),
      restatement: text(open.restatement, `${label}.restatement`, 300), whyOpen: text(open.whyOpen, `${label}.whyOpen`, 300),
      relatedIds: strings(open[relationKey], `${label}.${relationKey}`) };
  });
  const materials = list(raw.materials, 'materials', 6, (item, index) => {
    const label = `materials[${index}]`;
    const material = row(item, label);
    onlyKeys(material, ['id', 'quote', 'identity', 'candidates', 'note'], label);
    return { id: text(material.id, `${label}.id`, 60), span: resolveQuote(question, material.quote, `${label}.quote`),
      identity: oneOf(material.identity, IDENTITIES, `${label}.identity`),
      candidates: list(material.candidates, `${label}.candidates`, 4, (entry, at) => {
        const candidate = row(entry, `${label}.candidates[${at}]`);
        onlyKeys(candidate, ['materialId', 'evidenceId'], `${label}.candidates[${at}]`);
        return { materialId: text(candidate.materialId, 'materialId', 200), evidenceId: text(candidate.evidenceId, 'evidenceId', 80) };
      }),
      note: text(material.note, `${label}.note`, 300) };
  });
  const answer = row(raw.answer, 'answer');
  onlyKeys(answer, ['summary', 'readingNote', 'options', 'unknowns', 'program', 'refusals'], 'answer');
  const program = row(answer.program, 'answer.program');
  onlyKeys(program, ['kind', 'evidenceId', 'branchId', 'note'], 'answer.program');
  const programBody = { kind: oneOf(program.kind, PROGRAM_KINDS, 'answer.program.kind'),
    ...(optionalText(program.evidenceId, 'answer.program.evidenceId', 80) ? { evidenceId: program.evidenceId as string } : {}),
    ...(optionalText(program.branchId, 'answer.program.branchId', 120) ? { branchId: program.branchId as string } : {}),
    note: text(program.note, 'answer.program.note', 300) };
  return {
    openQuestions, materials,
    answer: {
      summary: text(answer.summary, 'answer.summary', 250),
      readingNote: text(answer.readingNote, 'answer.readingNote', 500),
      options: list(answer.options, 'answer.options', 5, (item, index) => {
        const label = `answer.options[${index}]`;
        const option = row(item, label);
        onlyKeys(option, ['id', 'kind', 'title', 'rationale', 'conditions', 'tradeoffs', relationKey, 'evidenceIds', 'computed'], label);
        const declaredEvidenceIds = strings(option.evidenceIds, `${label}.evidenceIds`, 6);
        const boundComputed = bindComputed(option.computed, records, `${label}.computed`);
        const evidenceCandidates = unique([...declaredEvidenceIds, ...(boundComputed.fallbackEvidenceId ? [boundComputed.fallbackEvidenceId] : [])]);
        const isPredictionEvidence = (id: string) => {
          const retained = records.get(id);
          return retained?.kind === 'prediction' || retained?.tool === 'predict_hop_aroma';
        };
        const computedPredictionId = boundComputed.computed && 'predictionSelection' in boundComputed.computed
          ? boundComputed.computed.evidenceId : undefined;
        const exploration = evidenceCandidates.flatMap((id) => {
          if (!isPredictionEvidence(id) || id === computedPredictionId) return [];
          const retained = records.get(id);
          const reason = retained?.kind === 'reference' ? 'payloadUnqualified' as const
            : id === boundComputed.fallbackEvidenceId && boundComputed.fallbackReason
              ? boundComputed.fallbackReason : 'contributionUnqualified' as const;
          return [createExplorationLink(id, reason)];
        });
        const evidenceIds = evidenceCandidates.filter((id) => !isPredictionEvidence(id));
        const computed = boundComputed.computed;
        return { id: text(option.id, `${label}.id`, 60), kind: oneOf(option.kind, OPTION_KINDS, `${label}.kind`),
          title: text(option.title, `${label}.title`, 120), rationale: text(option.rationale, `${label}.rationale`, 600),
          conditions: list(option.conditions, `${label}.conditions`, 3, (entry, at) => text(entry, `${label}.conditions[${at}]`, 200)),
          tradeoffs: list(option.tradeoffs, `${label}.tradeoffs`, 3, (entry, at) => text(entry, `${label}.tradeoffs[${at}]`, 200)),
          relatedIds: strings(option[relationKey], `${label}.${relationKey}`), evidenceIds, ...(computed ? { computed } : {}),
          ...(exploration.length ? { exploration } : {}), provenance: optionProvenance({ evidenceIds, computed, exploration }) };
      }, 1),
      unknowns: list(answer.unknowns, 'answer.unknowns', 3, (item, index) => {
        const label = `answer.unknowns[${index}]`;
        const unknown = row(item, label);
        onlyKeys(unknown, ['id', 'question', 'changesChoice', relationKey], label);
        return { id: text(unknown.id, `${label}.id`, 60), question: text(unknown.question, `${label}.question`, 300),
          changesChoice: text(unknown.changesChoice, `${label}.changesChoice`, 300), relatedIds: strings(unknown[relationKey], `${label}.${relationKey}`) };
      }),
      program: { ...programBody, qualification: programQualification(programBody, records), operational: 'notProvided' },
      refusals: list(answer.refusals, 'answer.refusals', 4, (item, index) => {
        const label = `answer.refusals[${index}]`;
        const refusal = row(item, label);
        onlyKeys(refusal, ['text', relationKey], label);
        return { text: text(refusal.text, `${label}.text`, 240), relatedIds: strings(refusal[relationKey], `${label}.${relationKey}`) };
      }),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Stored proposal → same typed shape, re-read strictly (browser and archive readers).

const READING_KEYS = ['property', 'role', 'direction', 'qualifier', 'required', 'basis', 'metric', 'subject', 'partner', 'familyId',
  'relatedIds', 'compensates', 'reason'];

function storedReading(value: unknown, question: string, label: string): BrewerHopAdviceReading {
  const reading = row(value, label);
  onlyKeys(reading, READING_KEYS, label);
  const subject = row(reading.subject, `${label}.subject`);
  onlyKeys(subject, ['kind', 'label', 'sensoryContext'], `${label}.subject`);
  const qualifier = optionalText(reading.qualifier, `${label}.qualifier`, 120);
  const familyId = optionalText(reading.familyId, `${label}.familyId`, 60);
  return {
    property: oneOf(reading.property, PROPERTIES, `${label}.property`), role: oneOf(reading.role, ROLES, `${label}.role`),
    direction: oneOf(reading.direction, DIRECTIONS, `${label}.direction`), ...(qualifier ? { qualifier } : {}),
    required: bool(reading.required, `${label}.required`), basis: oneOf(reading.basis, BASES, `${label}.basis`),
    metric: oneOf(reading.metric, METRICS, `${label}.metric`),
    subject: { kind: oneOf(subject.kind, SUBJECTS, `${label}.subject.kind`), label: text(subject.label, `${label}.subject.label`, 120),
      sensoryContext: oneOf(subject.sensoryContext, SENSORY_CONTEXTS, `${label}.subject.sensoryContext`) },
    ...(reading.partner !== undefined ? { partner: exactSpan(question, reading.partner, `${label}.partner`, true) } : {}),
    ...(familyId ? { familyId } : {}),
    relatedIds: strings(reading.relatedIds, `${label}.relatedIds`), compensates: strings(reading.compensates, `${label}.compensates`, 4),
    reason: text(reading.reason, `${label}.reason`, 300),
  };
}

function readStoredProposal(value: unknown, checks: Checks): BrewerHopAdviceProposal {
  const question = checks.request.question;
  const proposal = row(value, 'Proposition archivée');
  onlyKeys(proposal, ['readerReview', 'annotations', 'scopes', 'openQuestions', 'materials', 'answer'], 'Proposition archivée');
  const span = (item: unknown, label: string) => exactSpan(question, item, label, true);
  const answer = row(proposal.answer, 'answer');
  onlyKeys(answer, ['summary', 'readingNote', 'options', 'unknowns', 'program', 'refusals'], 'answer');
  const program = readStoredProgram(answer, checks.records);
  const typed: BrewerHopAdviceProposal = {
    readerReview: list(proposal.readerReview, 'readerReview', 40, (item, index) => {
      const review = row(item, `readerReview[${index}]`);
      onlyKeys(review, ['annotationId', 'verdict', 'reason', 'revision'], `readerReview[${index}]`);
      return { annotationId: text(review.annotationId, 'annotationId', 160), verdict: oneOf(review.verdict, VERDICTS, 'verdict'),
        reason: text(review.reason, 'reason', 300),
        ...(review.revision !== undefined ? { revision: storedReading(review.revision, question, `readerReview[${index}].revision`) } : {}) };
    }),
    annotations: list(proposal.annotations, 'annotations', 12, (item, index) => {
      const annotation = row(item, `annotations[${index}]`);
      onlyKeys(annotation, ['id', 'spans', 'reading'], `annotations[${index}]`);
      return { id: text(annotation.id, 'id', 60), spans: list(annotation.spans, 'spans', 3, (entry, at) => span(entry, `annotations[${index}].spans[${at}]`), 1),
        reading: storedReading(annotation.reading, question, `annotations[${index}].reading`) };
    }),
    scopes: list(proposal.scopes, 'scopes', 6, (item, index) => {
      const scope = row(item, `scopes[${index}]`);
      onlyKeys(scope, ['id', 'kind', 'span', 'focusSpan', 'contextSpans', 'relatedIds', 'reason'], `scopes[${index}]`);
      return { id: text(scope.id, 'id', 60), kind: oneOf(scope.kind, SCOPE_KINDS, 'kind'), span: span(scope.span, `scopes[${index}].span`),
        ...(scope.focusSpan !== undefined ? { focusSpan: span(scope.focusSpan, `scopes[${index}].focusSpan`) } : {}),
        contextSpans: list(scope.contextSpans, 'contextSpans', 4, (entry, at) => span(entry, `scopes[${index}].contextSpans[${at}]`)),
        relatedIds: strings(scope.relatedIds, 'relatedIds'), reason: text(scope.reason, 'reason', 300) };
    }),
    ...readStoredAnswerSections(proposal.openQuestions, proposal.materials, answer, program, question),
  };
  assertProposalSemantics(typed, checks);
  return typed;
}

function readStoredProgram(answer: Row, records: ReadonlyMap<string, BrewerHopAdviceEvidenceRecord>): BrewerHopAdviceProgram {
  const program = row(answer.program, 'answer.program');
  onlyKeys(program, ['kind', 'evidenceId', 'branchId', 'note', 'qualification', 'operational'], 'answer.program');
  if (program.operational !== 'notProvided') fail('Programme archivé : aucune opération n’est fournie par une lecture assistée.');
  const programBody = { kind: oneOf(program.kind, PROGRAM_KINDS, 'program.kind'),
    ...(program.evidenceId !== undefined ? { evidenceId: text(program.evidenceId, 'program.evidenceId', 80) } : {}),
    ...(program.branchId !== undefined ? { branchId: text(program.branchId, 'program.branchId', 120) } : {}),
    note: text(program.note, 'program.note', 300) };
  const qualification = programQualification(programBody, records);
  if (program.qualification !== qualification) fail('Programme archivé : qualification différente de la branche retenue.');
  return { ...programBody, qualification, operational: 'notProvided' };
}

function readStoredAnswerSections(openQuestions: unknown, materials: unknown, answer: Row, program: BrewerHopAdviceProgram,
  question: string): BrewerHopAdviceAnswerSections {
  const span = (item: unknown, label: string) => exactSpan(question, item, label, true);
  return {
    openQuestions: list(openQuestions, 'openQuestions', 6, (item, index) => {
      const open = row(item, `openQuestions[${index}]`);
      onlyKeys(open, ['id', 'kind', 'spans', 'restatement', 'whyOpen', 'relatedIds'], `openQuestions[${index}]`);
      return { id: text(open.id, 'id', 60), kind: oneOf(open.kind, OPEN_KINDS, 'kind'),
        spans: list(open.spans, 'spans', 3, (entry, at) => span(entry, `openQuestions[${index}].spans[${at}]`), 1),
        restatement: text(open.restatement, 'restatement', 300), whyOpen: text(open.whyOpen, 'whyOpen', 300), relatedIds: strings(open.relatedIds, 'relatedIds') };
    }),
    materials: list(materials, 'materials', 6, (item, index) => {
      const material = row(item, `materials[${index}]`);
      onlyKeys(material, ['id', 'span', 'identity', 'candidates', 'note'], `materials[${index}]`);
      return { id: text(material.id, 'id', 60), span: span(material.span, `materials[${index}].span`), identity: oneOf(material.identity, IDENTITIES, 'identity'),
        candidates: list(material.candidates, 'candidates', 4, (entry) => {
          const candidate = row(entry, 'candidate');
          onlyKeys(candidate, ['materialId', 'evidenceId'], 'candidate');
          return { materialId: text(candidate.materialId, 'materialId', 200), evidenceId: text(candidate.evidenceId, 'evidenceId', 80) };
        }),
        note: text(material.note, 'note', 300) };
    }),
    answer: {
      summary: text(answer.summary, 'answer.summary', 250), readingNote: text(answer.readingNote, 'answer.readingNote', 500),
      options: list(answer.options, 'answer.options', 5, (item, index) => {
        const option = row(item, `answer.options[${index}]`);
        onlyKeys(option, ['id', 'kind', 'title', 'rationale', 'conditions', 'tradeoffs', 'relatedIds', 'evidenceIds', 'computed', 'exploration', 'provenance'], `answer.options[${index}]`);
        const evidenceIds = strings(option.evidenceIds, 'evidenceIds', 7);
        const computed = readStoredComputed(option.computed, `answer.options[${index}].computed`);
        const exploration = list(option.exploration, `answer.options[${index}].exploration`, 6,
          (entry, at) => readStoredExploration(entry, `answer.options[${index}].exploration[${at}]`));
        if (new Set(exploration.map((entry) => entry.evidenceId)).size !== exploration.length) fail(`Option ${String(option.id)} : lien exploratoire répété.`);
        const provenance = oneOf(option.provenance, PROVENANCES, 'provenance');
        if (provenance !== optionProvenance({ evidenceIds, computed, exploration })) fail(`Option ${String(option.id)} : provenance différente des liens de preuve retenus.`);
        return { id: text(option.id, 'id', 60), kind: oneOf(option.kind, OPTION_KINDS, 'kind'), title: text(option.title, 'title', 120),
          rationale: text(option.rationale, 'rationale', 600),
          conditions: list(option.conditions, 'conditions', 3, (entry) => text(entry, 'condition', 200)),
          tradeoffs: list(option.tradeoffs, 'tradeoffs', 3, (entry) => text(entry, 'tradeoff', 200)),
          relatedIds: strings(option.relatedIds, 'relatedIds'), evidenceIds, ...(computed ? { computed } : {}),
          ...(exploration.length ? { exploration } : {}), provenance };
      }, 1),
      unknowns: list(answer.unknowns, 'answer.unknowns', 3, (item, index) => {
        const unknown = row(item, `answer.unknowns[${index}]`);
        onlyKeys(unknown, ['id', 'question', 'changesChoice', 'relatedIds'], `answer.unknowns[${index}]`);
        return { id: text(unknown.id, 'id', 60), question: text(unknown.question, 'question', 300),
          changesChoice: text(unknown.changesChoice, 'changesChoice', 300), relatedIds: strings(unknown.relatedIds, 'relatedIds') };
      }),
      program,
      refusals: list(answer.refusals, 'answer.refusals', 4, (item, index) => {
        const refusal = row(item, `answer.refusals[${index}]`);
        onlyKeys(refusal, ['text', 'relatedIds'], `answer.refusals[${index}]`);
        return { text: text(refusal.text, 'text', 240), relatedIds: strings(refusal.relatedIds, 'relatedIds') };
      }),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Semantic guards shared by both readers.

const isGuardDirection = (direction: BrewerHopAdviceDirection) => direction === 'keep' || direction === 'exclude';
const isGuardReading = (reading: BrewerHopAdviceReading) => reading.role === 'constraint' || isGuardDirection(reading.direction);

function assertReading(reading: BrewerHopAdviceReading, spans: readonly BrewerHopAdviceSpan[], selfId: string, label: string,
  question: string, annotationIds: ReadonlySet<string>): void {
  if ((reading.role === 'investigation') !== (reading.direction === 'investigate')) {
    fail(`${label} : une investigation porte la direction investigate, et seule elle.`);
  }
  if (reading.role === 'reportedObservation' && reading.direction !== 'none') {
    fail(`${label} : un constat rapporté ne porte aucune direction ; ce n’est pas une demande de baisse.`);
  }
  if ((reading.direction === 'keep' || reading.direction === 'decrease') && reading.basis !== 'current') {
    fail(`${label} : une garde ou une baisse se rapporte à l’état actuel (basis current, qui peut rester inconnu).`);
  }
  const spanText = fold(spans.map((span) => span.text).join(' '));
  if (reading.metric === 'pH' && !/(?:^|[^a-z])ph(?:$|[^a-z])/.test(spanText)) fail(`${label} : pH seulement si le brasseur l’écrit ; « sour » ou « acide » reste sensory.`);
  if (reading.metric === 'analyticalBU' && !/(?:^|[^a-z])i?bu(?:$|[^a-z])/.test(spanText)) fail(`${label} : une amertume analytique (BU) exige que le brasseur l’ait écrite.`);
  if (reading.metric === 'titratableAcidity' && !/acidite titrable|titratable/.test(spanText)) fail(`${label} : l’acidité titrable exige que le brasseur l’ait écrite.`);
  if (reading.qualifier !== undefined && !spans.some((span) => sentenceAround(question, span).includes(reading.qualifier!))) {
    fail(`${label} : qualifier se copie tel quel depuis la phrase du fragment ; il ne devient jamais une intensité.`);
  }
  for (const id of reading.relatedIds) {
    if (id === selfId) fail(`${label} : une annotation ne se relie pas à elle-même.`);
    if (!annotationIds.has(id)) fail(`${label} : relation vers une annotation inconnue (${id}).`);
  }
  if (reading.compensates.length && reading.role !== 'investigation') fail(`${label} : seule une investigation porte une compensation.`);
  if (reading.compensates.some((id) => !reading.relatedIds.includes(id))) fail(`${label} : chaque constat compensé figure aussi dans related.`);
  if (reading.role === 'target' && (reading.direction === 'increase' || reading.direction === 'decrease')) {
    const negated = spans.find((span) => brewerHopAdviceNegated(question, span));
    if (negated) {
      fail(`${label} : « ${negated.text} » est sous une négation (« sans… », « ne… pas ») : pas d’objectif ${reading.direction === 'increase' ? 'd’augmentation' : 'de baisse'}. Utilise constraint, investigation ou une question ouverte.`);
    }
  }
  if (reading.role === 'reportedObservation') {
    const hypothetical = spans.find((span) => brewerHopAdviceHypothetical(question, span));
    if (hypothetical) {
      fail(`${label} : « ${hypothetical.text} » est dans une hypothèse ou une question (« si… », « est-ce que… ») : ni excès ni manque n’est constaté. Utilise investigation ou une question ouverte conditionalRisk.`);
    }
  }
  assertPlainText(reading.reason, question, `${label}.reason`);
  assertPlainText(reading.subject.label, question, `${label}.subject`);
}

function assertProposalSemantics(proposal: BrewerHopAdviceProposal, checks: Checks): void {
  const { request, records } = checks;
  const question = request.question;
  const reader = new Map(request.readerAnnotations.map((entry) => [entry.id, entry]));
  const toolIds = new Set(checks.tools.map((entry) => entry.id));
  assertAssistIds([...proposal.annotations, ...proposal.scopes, ...proposal.openQuestions, ...proposal.materials,
    ...proposal.answer.options, ...proposal.answer.unknowns].map((entry) => entry.id));
  const annotationIds = new Set([...reader.keys(), ...proposal.annotations.map((entry) => entry.id)]);
  const universe = new Set([...annotationIds, ...request.readerScopes.map((entry) => entry.id), ...proposal.scopes.map((entry) => entry.id),
    ...proposal.openQuestions.map((entry) => entry.id), ...proposal.materials.map((entry) => entry.id)]);

  const reviewed = new Map<string, BrewerHopAdviceReaderReview>();
  const revisedReadings = new Map<string, BrewerHopAdviceReading>();
  for (const review of proposal.readerReview) {
    const source = reader.get(review.annotationId);
    if (!source) fail(`readerReview : annotation locale inconnue (${review.annotationId}).`);
    if (reviewed.has(source.id)) fail(`readerReview : ${source.id} est revu deux fois.`);
    reviewed.set(source.id, review);
    if ((review.verdict === 'revise') !== (review.revision !== undefined)) fail(`readerReview ${source.id} : revise exige revision ; consistent et dispute n’en portent pas.`);
    assertPlainText(review.reason, question, `readerReview ${source.id}`);
    if (!review.revision) continue;
    assertReading(review.revision, [source.span], source.id, `Révision ${source.id}`, question, annotationIds);
    if (isGuardDirection(source.direction) && review.revision.direction !== source.direction) {
      fail(`Révision ${source.id} : « ${source.span.text} » est une garde (${source.direction}) ; elle ne devient ni objectif ni apport.`);
    }
    revisedReadings.set(source.id, review.revision);
  }
  // A fallible local reading: an objective read under a negation must be addressed, not silently kept.
  for (const cue of brewerHopAdviceReaderCues(request)) {
    const verdict = reviewed.get(cue.id)?.verdict;
    if (cue.negatedObjective && verdict !== 'revise' && verdict !== 'dispute') {
      fail(`Annotation locale ${cue.id} : lue comme objectif alors que « ${reader.get(cue.id)!.span.text} » est sous une négation ; revise-la ou conteste-la.`);
    }
  }

  const newReadings = new Map(proposal.annotations.map((entry) => [entry.id, entry.reading]));
  for (const annotation of proposal.annotations) {
    assertReading(annotation.reading, annotation.spans, annotation.id, `Annotation ${annotation.id}`, question, annotationIds);
    // An overlapping citation cannot sidestep readerReview (and with it the guard rules): one fragment, one line.
    const existing = request.readerAnnotations.find((entry) => annotation.spans.some((span) => overlaps(span, entry.span)));
    if (existing) fail(`Annotation ${annotation.id} : chevauche « ${existing.span.text} », déjà annoté localement (${existing.id}) ; utilise readerReview.`);
  }
  for (const reading of [...newReadings.values(), ...revisedReadings.values()]) {
    for (const id of reading.compensates) {
      const target = newReadings.get(id) ?? revisedReadings.get(id);
      if (target && target.role !== 'reportedObservation') fail(`Compensation : ${id} n’est pas un constat rapporté.`);
    }
  }

  for (const scope of proposal.scopes) {
    for (const id of scope.relatedIds) if (!annotationIds.has(id)) fail(`Portée ${scope.id} : annotation inconnue (${id}).`);
    assertPlainText(scope.reason, question, `Portée ${scope.id}`);
  }
  const guards = new Set<string>();
  for (const entry of request.readerAnnotations) if (isGuardDirection(entry.direction)) guards.add(entry.id);
  for (const [id, reading] of newReadings) if (isGuardReading(reading)) guards.add(id);
  assertAnswerSectionSemantics(proposal, { question, universe, guards, toolIds, records });
}

/** What the shared answer rules check against; no versioned request is needed or rebuilt. */
interface AnswerSemanticContext {
  question: string;
  /** IDs a relation may target. */
  universe: ReadonlySet<string>;
  /** IDs that only guard; an intervention or alternative must also serve another ID. */
  guards: ReadonlySet<string>;
  toolIds: ReadonlySet<string>;
  records: ReadonlyMap<string, BrewerHopAdviceEvidenceRecord>;
}

function assertAssistIds(ids: readonly string[]): void {
  for (const id of ids) if (!ID.test(id)) fail(`Identifiant ${id} : utilise assist-… (minuscules, chiffres, tirets).`);
  if (new Set(ids).size !== ids.length) fail('Identifiant assist-… répété dans la proposition.');
}

function assertAnswerSectionSemantics(sections: BrewerHopAdviceAnswerSections, context: AnswerSemanticContext): void {
  const { question, universe, guards, toolIds, records } = context;
  const retained = (id: string, label: string) => {
    if (!toolIds.has(id) || !records.has(id)) fail(`${label} : preuve d’outil inconnue ou non retenue (${id}). Cite seulement les IDs reçus dans ce tour.`);
    return records.get(id)!;
  };
  const related = (ids: readonly string[], label: string) => {
    for (const id of ids) if (!universe.has(id)) fail(`${label} : référence inconnue (${id}).`);
  };
  for (const open of sections.openQuestions) {
    related(open.relatedIds, `Question ouverte ${open.id}`);
    assertPlainText(open.restatement, question, `Question ouverte ${open.id}`);
    assertPlainText(open.whyOpen, question, `Question ouverte ${open.id}`);
  }
  for (const material of sections.materials) {
    assertPlainText(material.note, question, `Matière ${material.id}`);
    if (material.identity === 'personalUnidentified' && material.candidates.length) {
      fail(`Matière ${material.id} : une matière personnelle non identifiée n’a pas de candidat catalogue.`);
    }
    for (const candidate of material.candidates) {
      const record = retained(candidate.evidenceId, `Matière ${material.id}`);
      const identity = record.kind === 'hopIdentity' ? record.identities.find((entry) => entry.materialId === candidate.materialId) : undefined;
      if (!identity) {
        fail(`Matière ${material.id} : ${candidate.materialId} n’est pas une identité houblon retournée structurellement par ${candidate.evidenceId} ; un nom approximatif, une levure ou un texte libre n’en fournit aucune.`);
      }
      if (!quoteNamesIdentity(material.span.text, identity)) {
        fail(`Matière ${material.id} : « ${material.span.text} » ne nomme pas ${identity.name} ; un candidat doit répondre au nom cité, même approximatif.`);
      }
    }
  }

  const answer = sections.answer;
  assertPlainText(answer.summary, question, 'answer.summary');
  assertPlainText(answer.readingNote, question, 'answer.readingNote');
  for (const option of answer.options) {
    const label = `Option ${option.id}`;
    related(option.relatedIds, label);
    for (const id of option.evidenceIds) {
      const record = retained(id, label);
      if (record.kind === 'prediction' || record.tool === 'predict_hop_aroma') {
        fail(`${label} : une prédiction predict_hop_aroma doit rester une exploration explicite ou porter un sélecteur calculé exact, pas une citation documentaire.`);
      }
    }
    const explorationIds = new Set<string>();
    for (const exploration of option.exploration ?? []) {
      const record = retained(exploration.evidenceId, label);
      if (record.tool !== 'predict_hop_aroma' || record.kind === 'scenarioResult' || record.kind === 'scenarioRequest'
        || explorationIds.has(exploration.evidenceId) || option.evidenceIds.includes(exploration.evidenceId)) {
        fail(`${label} : lien exploratoire sans prédiction exacte ou répété.`);
      }
      const expectedReason = record.kind === 'reference' ? 'payloadUnqualified' : 'contributionUnqualified';
      if (exploration.reason !== expectedReason || exploration.note !== explorationNote(expectedReason)) {
        fail(`${label} : motif de prédiction exploratoire différent du résultat retenu.`);
      }
      if (option.computed && 'predictionSelection' in option.computed && option.computed.evidenceId === exploration.evidenceId) {
        fail(`${label} : la même prédiction ne peut être calculée et exploratoire à la fois.`);
      }
      explorationIds.add(exploration.evidenceId);
    }
    if (option.computed) {
      const computed = option.computed;
      const record = retained(computed.evidenceId, label);
      let valid = false;
      if (record.kind === 'scenarioResult' && 'branchId' in computed) {
        valid = record.branches.some((branch) => branch.id === computed.branchId);
      } else if (record.kind === 'prediction' && 'predictionSelection' in computed) {
        try {
          resolveBrewerHopAdvicePredictionContribution(record.snapshot, computed.predictionSelection);
          valid = true;
        } catch (error) {
          fail(`${label} : sélecteur de prédiction invalide (${error instanceof Error ? error.message : 'cause inconnue'}).`);
        }
      }
      if (!valid) fail(`${label} : computed doit viser une branche de scénario exacte ou une contribution de prédiction sélectionnée et référencée.`);
    }
    for (const value of [option.title, option.rationale, ...option.conditions, ...option.tradeoffs]) assertPlainText(value, question, label);
    if ((option.kind === 'intervention' || option.kind === 'alternative') && !option.relatedIds.some((id) => !guards.has(id))) {
      fail(`${label} : une ${option.kind === 'intervention' ? 'intervention' : 'alternative'} sert un objectif, une question ou une compensation, pas seulement une garde (garder n’est pas ajouter).`);
    }
    if (option.kind === 'intervention' && !option.computed && !option.conditions.length) {
      fail(`${label} : une intervention non calculée reste conditionnelle ; nomme au moins une condition.`);
    }
  }
  for (const unknown of answer.unknowns) {
    related(unknown.relatedIds, `Donnée manquante ${unknown.id}`);
    assertPlainText(unknown.question, question, `Donnée manquante ${unknown.id}`);
    assertPlainText(unknown.changesChoice, question, `Donnée manquante ${unknown.id}`);
  }
  for (const refusal of answer.refusals) {
    related(refusal.relatedIds, 'Refus');
    assertPlainText(refusal.text, question, 'Refus');
  }
  if (answer.program.evidenceId) retained(answer.program.evidenceId, 'Programme');
  assertPlainText(answer.program.note, question, 'Programme');
}

// ---------------------------------------------------------------------------------------------
// Envelope, exact re-reading and displayed advice.

function citedEvidenceIds(raw: unknown): string[] {
  if (!isRow(raw)) return [];
  const answer = isRow(raw.answer) ? raw.answer : {};
  const options = Array.isArray(answer.options) ? answer.options.filter(isRow) : [];
  const materials = Array.isArray(raw.materials) ? raw.materials.filter(isRow) : [];
  const ids = [
    ...options.flatMap((option) => [...(Array.isArray(option.evidenceIds) ? option.evidenceIds : []),
      ...(isRow(option.computed) ? [option.computed.evidenceId] : [])]),
    ...materials.flatMap((material) => (Array.isArray(material.candidates) ? material.candidates.filter(isRow) : []).map((candidate) => candidate.evidenceId)),
    ...(isRow(answer.program) ? [answer.program.evidenceId] : []),
  ];
  return unique(ids.filter((id): id is string => typeof id === 'string' && !!id));
}

export function createBrewerHopAdviceProposalEnvelope(input: {
  request: BrewerHopAdviceRequest;
  raw: unknown;
  evidence: readonly BrewerHopAdviceEvidenceSource[];
  readers: BrewerHopAdviceEvidenceReaders;
  serverContext: BrewerHopAdviceProposalEnvelope['serverContext'];
}): BrewerHopAdviceProposalEnvelope {
  const request = validateBrewerHopAdviceRequest(input.request, input.request.question);
  const { tools, dependencies, records } = sealTurnEvidence(input.raw, input.evidence, input.readers);
  const binding = serverContextBinding(input.serverContext.binding, { scope: request.contextLaunch.expected.scope });
  const proposal = normalizeBrewerHopAdviceProposal(input.raw, { request, tools, records: new Map(records.map((record) => [record.id, record])) });
  const envelope: BrewerHopAdviceProposalEnvelope = {
    format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT, status: 'proposal', request, proposal, evidence: { tools, dependencies, records },
    serverContext: serverContextRecord(input.serverContext, binding),
  };
  assertBrewerHopAdviceProposalEnvelope(envelope);
  return envelope;
}

export function assertBrewerHopAdviceProposalEnvelope(value: unknown): asserts value is BrewerHopAdviceProposalEnvelope {
  const envelope = row(value, 'Lecture assistée archivée');
  onlyKeys(envelope, ['format', 'status', 'request', 'proposal', 'evidence', 'serverContext'], 'Lecture assistée archivée');
  if (envelope.format !== BREWER_HOP_ADVICE_PROPOSAL_FORMAT) fail('Format de lecture assistée inconnu : conservée sans interprétation.');
  if (envelope.status !== 'proposal') fail('Une lecture assistée reste une proposition ; aucune adoption n’est portée par ce format.');
  const request = validateBrewerHopAdviceRequest(envelope.request);
  const { tools, records } = readStoredTurnEvidence(envelope.evidence);
  assertStoredServerContext(envelope.serverContext, { scope: request.contextLaunch.expected.scope });
  readStoredProposal(envelope.proposal, { request, tools, records });
}

/** Re-read every same-turn tool dependency, then rederive each qualifying record from its exact payload. */
export function verifyBrewerHopAdviceEvidence(envelope: BrewerHopAdviceProposalEnvelope, turnEvidence: readonly BrewerHopAdviceEvidenceSource[],
  readers: Omit<BrewerHopAdviceEvidenceReaders, 'resolveEvidence'> = {}): void {
  assertBrewerHopAdviceProposalEnvelope(envelope);
  verifyTurnEvidence(envelope.evidence, turnEvidence, readers);
}

// ---------------------------------------------------------------------------------------------
// Neutral answer/evidence blocks. Every closed format calls them with its own validated source; none
// receives a request or an envelope, so no older or newer version is rebuilt to pass a validator.

function sealTurnEvidence(raw: unknown, evidence: readonly BrewerHopAdviceEvidenceSource[],
  readers: BrewerHopAdviceEvidenceReaders): BrewerHopAdviceAnswerEvidence {
  if (evidence.length > 40) fail('Trop de résultats d’outil pour une liaison de tour exacte.');
  const tools = evidence.map((entry, index) => ({ id: text(entry.id, `Outil ${index + 1}.id`, 80),
    name: text(entry.name, `Outil ${index + 1}.name`, 80), label: clip(entry.label ?? entry.name, 200) }));
  const dependencies = projectEvidenceDependencies(evidence);
  const byId = new Map(evidence.map((entry) => [entry.id, entry]));
  const records = citedEvidenceIds(raw).flatMap((id) => {
    const entry = byId.get(id);
    return entry ? [qualifyBrewerHopAdviceEvidence(entry, readers)] : [];
  });
  return { tools, dependencies, records };
}

function serverContextRecord(input: BrewerHopAdviceAnswerServerContext, binding: BrewerHopAdviceContextProjectionV1): BrewerHopAdviceAnswerServerContext {
  return { phase: clip(input.phase, 200) || 'inconnue',
    provenance: input.provenance.slice(0, 12).map((entry) => clip(entry, 400)),
    loadedAt: input.loadedAt, binding };
}

function readStoredTurnEvidence(value: unknown): { tools: BrewerHopAdviceAnswerEvidence['tools']; records: Map<string, BrewerHopAdviceEvidenceRecord> } {
  const evidence = row(value, 'evidence');
  onlyKeys(evidence, ['tools', 'dependencies', 'records'], 'evidence');
  if (!Array.isArray(evidence.tools) || !Array.isArray(evidence.records)) fail('evidence.tools et evidence.records sont requis.');
  const tools = list(evidence.tools, 'evidence.tools', 40, (item, index) => {
    const entry = row(item, `evidence.tools[${index}]`);
    onlyKeys(entry, ['id', 'name', 'label'], `evidence.tools[${index}]`);
    return { id: text(entry.id, 'id', 80), name: text(entry.name, 'name', 80), label: text(entry.label, 'label', 200) };
  });
  if (new Set(tools.map((entry) => entry.id)).size !== tools.length) fail('evidence.tools : identifiant répété.');
  const dependencies = validateEvidenceDependencies(evidence.dependencies, tools);
  const records = list(evidence.records, 'evidence.records', 24, (item, index) => readRecord(item, `evidence.records[${index}]`));
  const byId = new Map<string, BrewerHopAdviceEvidenceRecord>();
  for (const record of records) {
    const dependency = dependencies.find((entry) => entry.evidenceId === record.id);
    if (!dependency || dependency.toolName !== record.tool || byId.has(record.id)) fail(`Preuve retenue ${record.id} sans dépendance d’outil exacte ou répétée.`);
    byId.set(record.id, record);
  }
  return { tools, records: byId };
}

function assertStoredServerContext(value: unknown, launch: { scope: unknown } | null): void {
  const context = row(value, 'serverContext');
  onlyKeys(context, ['phase', 'provenance', 'loadedAt', 'binding'], 'serverContext');
  text(context.phase, 'serverContext.phase', 200);
  list(context.provenance, 'serverContext.provenance', 12, (entry) => text(entry, 'provenance', 400));
  if (typeof context.loadedAt !== 'number' || !Number.isFinite(context.loadedAt)) fail('serverContext.loadedAt invalide.');
  serverContextBinding(context.binding, launch);
}

function verifyTurnEvidence(stored: BrewerHopAdviceAnswerEvidence, turnEvidence: readonly BrewerHopAdviceEvidenceSource[],
  readers: Omit<BrewerHopAdviceEvidenceReaders, 'resolveEvidence'>): void {
  if (turnEvidence.length > 40) fail('Trop de dépendances d’outil pour une relecture exacte du tour.');
  const tools = turnEvidence.map((entry, index) => ({ id: text(entry.id, `Outil relu ${index + 1}.id`, 80),
    name: text(entry.name, `Outil relu ${index + 1}.name`, 80), label: clip(entry.label ?? entry.name, 200) }));
  const dependencies = projectEvidenceDependencies(turnEvidence);
  if (stableBrewerHopAdviceJson(tools) !== stableBrewerHopAdviceJson(stored.tools)) {
    fail('La liste des outils du tour diffère de celle conservée dans la proposition.');
  }
  if (stableBrewerHopAdviceJson(dependencies) !== stableBrewerHopAdviceJson(stored.dependencies)) {
    fail('Une dépendance d’outil du tour manque ou son contenu a changé, même si le modèle ne l’a pas citée.');
  }
  const byId = new Map(turnEvidence.map((entry) => [entry.id, entry]));
  for (const record of stored.records) {
    const source = byId.get(record.id);
    if (!source && record.kind === 'reference') continue;
    if (!source || source.name !== record.tool) fail(`Preuve ${record.id} absente du tour : relecture exacte impossible.`);
    const again = qualifyBrewerHopAdviceEvidence(source, { ...readers, resolveEvidence: (id) => byId.get(id)?.data });
    if (stableBrewerHopAdviceJson(again) !== stableBrewerHopAdviceJson(record)) fail(`Preuve ${record.id} : la qualification retenue ne correspond plus au résultat d’outil exact.`);
  }
}

function answerSource(value: BrewerHopAdviceAnswerSourceV1): BrewerHopAdviceAnswerSourceV1 {
  const source = row(value, 'Source de réponse');
  onlyKeys(source, ['question', 'relatedSourceIds', 'guardIds', 'launchScope'], 'Source de réponse');
  const question = text(source.question, 'Source de réponse.question', 12000);
  if (!Array.isArray(source.relatedSourceIds) || !Array.isArray(source.guardIds)
    || [...source.relatedSourceIds, ...source.guardIds].some((id) => typeof id !== 'string' || !id)) fail('Source de réponse : IDs source invalides.');
  const relatedSourceIds = [...source.relatedSourceIds] as string[];
  const guardIds = [...source.guardIds] as string[];
  if (new Set(relatedSourceIds).size !== relatedSourceIds.length || guardIds.some((id) => !relatedSourceIds.includes(id))) {
    fail('Source de réponse : IDs source répétés ou garde hors de la source.');
  }
  if (source.launchScope === undefined) fail('Source de réponse : scope de lancement absent.');
  return { question, relatedSourceIds, guardIds, launchScope: source.launchScope };
}

function assertSourceAnswerSections(sections: BrewerHopAdviceAnswerSections, source: BrewerHopAdviceAnswerSourceV1,
  tools: ReadonlyArray<{ id: string }>, records: ReadonlyMap<string, BrewerHopAdviceEvidenceRecord>): void {
  assertAssistIds([...sections.openQuestions, ...sections.materials, ...sections.answer.options, ...sections.answer.unknowns].map((entry) => entry.id));
  assertAnswerSectionSemantics(sections, {
    question: source.question,
    universe: new Set([...source.relatedSourceIds, ...sections.openQuestions.map((entry) => entry.id), ...sections.materials.map((entry) => entry.id)]),
    guards: new Set(source.guardIds),
    toolIds: new Set(tools.map((entry) => entry.id)),
    records,
  });
}

/**
 * Model arguments → open questions, materials, answer, sealed turn evidence and server context,
 * checked against a neutral source. `relationKey` names the raw relation lists of the caller's finish schema.
 */
export function createBrewerHopAdviceAnswer(input: {
  source: BrewerHopAdviceAnswerSourceV1;
  raw: unknown;
  relationKey: 'related' | 'relatedIds';
  evidence: readonly BrewerHopAdviceEvidenceSource[];
  readers: BrewerHopAdviceEvidenceReaders;
  serverContext: BrewerHopAdviceAnswerServerContext;
}): BrewerHopAdviceSealedAnswer {
  const source = answerSource(input.source);
  const evidence = sealTurnEvidence(input.raw, input.evidence, input.readers);
  const binding = serverContextBinding(input.serverContext.binding, { scope: source.launchScope });
  const records = new Map(evidence.records.map((record) => [record.id, record]));
  const sections = normalizeAnswerSections(row(input.raw, 'Proposition'), source.question, records, input.relationKey);
  assertSourceAnswerSections(sections, source, evidence.tools, records);
  return { ...sections, evidence, serverContext: serverContextRecord(input.serverContext, binding) };
}

/** Stored open questions, materials, answer, evidence and server context, re-read strictly against a neutral source. */
export function assertBrewerHopAdviceStoredAnswer(value: {
  openQuestions: unknown; materials: unknown; answer: unknown; evidence: unknown; serverContext: unknown;
}, sourceValue: BrewerHopAdviceAnswerSourceV1): void {
  const source = answerSource(sourceValue);
  const { tools, records } = readStoredTurnEvidence(value.evidence);
  assertStoredServerContext(value.serverContext, { scope: source.launchScope });
  const answer = row(value.answer, 'answer');
  onlyKeys(answer, ['summary', 'readingNote', 'options', 'unknowns', 'program', 'refusals'], 'answer');
  const program = readStoredProgram(answer, records);
  assertSourceAnswerSections(readStoredAnswerSections(value.openQuestions, value.materials, answer, program, source.question),
    source, tools, records);
}

/**
 * Stored evidence and server context of an envelope whose request is an opaque future child. The launch
 * scope is compared when the caller still knows it; the payload of the future request is never interpreted.
 */
export function assertBrewerHopAdviceStoredEvidenceContext(value: { evidence: unknown; serverContext: unknown },
  launch: { scope: unknown } | null): void {
  readStoredTurnEvidence(value.evidence);
  assertStoredServerContext(value.serverContext, launch);
}

/** Re-read the stored turn evidence, then rederive each qualifying record from the exact same-turn payloads. */
export function verifyBrewerHopAdviceAnswerEvidence(stored: unknown, turnEvidence: readonly BrewerHopAdviceEvidenceSource[],
  readers: Omit<BrewerHopAdviceEvidenceReaders, 'resolveEvidence'> = {}): void {
  readStoredTurnEvidence(stored);
  verifyTurnEvidence(stored as BrewerHopAdviceAnswerEvidence, turnEvidence, readers);
}

const OPTION_LABELS: Record<BrewerHopAdviceOptionKind, string> = {
  intervention: 'Intervention', characterization: 'Caractérisation', investigation: 'Enquête', alternative: 'Alternative',
};

/** The chat shows a plain projection; the typed proposal stays the source for the local V3/V4 path. */
export function brewerAdviceFromHopProposal(proposal: BrewerHopAdviceProposal): BrewerAdvice {
  const answer = proposal.answer;
  const fit = (lines: readonly string[], max = 1500) => {
    const kept: string[] = [];
    for (const line of lines.filter(Boolean)) {
      if ([...kept, line].join('\n').length > max) break;
      kept.push(line);
    }
    return kept.join('\n');
  };
  const action = fit(answer.options.map((option, index) => `${index + 1}. ${OPTION_LABELS[option.kind]} — ${option.title} : ${option.rationale}`
    + (option.conditions.length ? ` Si : ${option.conditions.join(' ; ')}.` : '')));
  const tradeoffs = answer.options.flatMap((option) => option.tradeoffs.map((entry) => `• ${option.title} : ${entry}`));
  const explorations = answer.options.flatMap((option) => (option.exploration ?? []).map((entry) => `• ${entry.note}`));
  return {
    level: 'info',
    summary: answer.summary,
    action: action || answer.options[0].title,
    why: fit([answer.readingNote, ...(explorations.length ? ['Résultats d’outil exploratoires :', ...explorations] : []),
      ...(tradeoffs.length ? ['Contreparties :', ...tradeoffs] : [])]),
    watch: fit([...answer.unknowns.map((unknown) => `• ${unknown.question} — ${unknown.changesChoice}`),
      ...answer.refusals.map((refusal) => `• ${refusal.text}`)]),
    question: answer.unknowns[0]?.question ?? '',
    evidenceIds: unique([...answer.options.flatMap((option) => [...option.evidenceIds,
      ...(option.computed ? [option.computed.evidenceId] : []), ...(option.exploration ?? []).map((entry) => entry.evidenceId)]),
      ...proposal.materials.flatMap((material) => material.candidates.map((candidate) => candidate.evidenceId)),
      ...(answer.program.evidenceId ? [answer.program.evidenceId] : [])]).slice(0, 12),
  };
}

// ---------------------------------------------------------------------------------------------
// Gemini declaration of the final call.

const str = (description: string) => ({ type: 'STRING', description });
const idList = (description: string) => ({ type: 'ARRAY', items: { type: 'STRING' }, description });
const quote = {
  type: 'OBJECT',
  description: 'Citation EXACTE de la question, copiée caractère pour caractère, sans espace de bord.',
  properties: {
    text: str('Texte exact.'),
    occurrence: { type: 'INTEGER', description: 'Rang 1, 2… seulement si ce texte apparaît plusieurs fois.' }
  },
  required: ['text']
};
const readingProperties = {
  property: { type: 'STRING', enum: [...PROPERTIES], description: 'Propriété lue. unresolved si aucune ne convient.' },
  role: { type: 'STRING', enum: [...ROLES], description: 'reportedObservation = ce que le brasseur constate ; target = objectif positif ; constraint = garde ; investigation = question à examiner ; preference = souhait non requis.' },
  direction: { type: 'STRING', enum: [...DIRECTIONS], description: 'none pour un constat ou un souhait sans direction ; investigate pour une investigation.' },
  qualifier: str('Qualificatif copié tel quel (« légèrement »), sinon vide. Jamais une intensité.'),
  required: { type: 'BOOLEAN', description: 'true si la réponse doit traiter ce point.' },
  basis: { type: 'STRING', enum: [...BASES], description: 'current pour une garde ou une baisse (l’état actuel peut rester inconnu).' },
  metric: { type: 'STRING', enum: [...METRICS], description: 'sensory par défaut ; pH, analyticalBU ou titratableAcidity seulement si le brasseur les écrit.' },
  subject: { type: 'STRING', enum: [...SUBJECTS] },
  subjectLabel: str('Sujet en mots courts (« Ma bière », « mon houblon de jardin »).'),
  sensoryContext: { type: 'STRING', enum: [...SENSORY_CONTEXTS] },
  partner: { ...quote, description: 'Partenaire d’accord cité exactement (« mon goût de banane »), sinon omis.' },
  familyId: str('Famille aromatique déjà fournie par la lecture locale, sinon vide.'),
  related: idList('IDs d’annotations liées (lecture locale ou assist-…).'),
  compensates: idList('IDs des constats que cette investigation cherche à compenser.'),
  reason: str('Pourquoi cette lecture, en une phrase.')
};
const readingRequired = ['property', 'role', 'direction', 'required', 'basis', 'metric', 'subject', 'subjectLabel', 'sensoryContext', 'reason'];
const computedLink = { type: 'OBJECT', description: 'Seulement pour une contribution réellement calculée : branche exacte de simulate_brewing_scenarios ou sélecteur précis de predict_hop_aroma. Ce lien ne qualifie ni la prose de l’option ni sa pertinence. Pour une prédiction, choisis la contribution ; le serveur ajoute la référence de contenu après validation. Ne fournis jamais une empreinte.',
  properties: {
    evidenceId: str('ID E… exact de l’outil de ce tour.'),
    branchId: str('ID exact de la branche du scénario ; omis si une prédiction est sélectionnée.'),
    predictionSelection: { type: 'OBJECT', description: 'Choix d’une seule contribution du résultat complet. alternative.index est un index zéro-based lié par le serveur à tout le tableau ordonné.',
      properties: {
        kind: { type: 'STRING', enum: ['alternative', 'recipeOverall', 'recipeAddition'] },
        index: { type: 'INTEGER', description: 'Index zéro-based, uniquement pour kind alternative.' },
        additionId: str('ID d’ajout exact de input.additions, uniquement pour recipeAddition.'),
      }, required: ['kind'] },
  }, required: ['evidenceId'] };

export const brewerHopAdviceFinishDeclaration = {
  name: BREWER_HOP_ADVICE_FINISH_TOOL,
  description: 'Terminer la lecture assistée : lecture corrigible de la question exacte et réponse conditionnelle utile. Aucune écriture, adoption, source, mesure, dose, chiffre ou identité inventés. Les citations sont copiées exactement ; le serveur calcule les positions et qualifie lui-même les preuves.',
  parameters: {
    type: 'OBJECT',
    properties: {
      readerReview: { type: 'ARRAY', maxItems: 40, description: 'Avis sur les annotations locales (omises = conservées). Une annotation signalée negatedObjective doit être revue.', items: {
        type: 'OBJECT', properties: {
          annotationId: str('ID exact de readerAnnotations.'),
          verdict: { type: 'STRING', enum: [...VERDICTS], description: 'consistent ; revise (même fragment, autre lecture) ; dispute (lecture fausse, gardée non requise).' },
          reason: str('Motif court.'),
          revision: { type: 'OBJECT', properties: readingProperties, required: readingRequired, description: 'Seulement pour revise.' }
        }, required: ['annotationId', 'verdict', 'reason'] } },
      annotations: { type: 'ARRAY', maxItems: 12, description: 'Fragments que la lecture locale a manqués.', items: {
        type: 'OBJECT', properties: { id: str('assist-… unique.'), quotes: { type: 'ARRAY', items: quote, minItems: 1, maxItems: 3 }, ...readingProperties },
        required: ['id', 'quotes', ...readingRequired] } },
      scopes: { type: 'ARRAY', maxItems: 6, description: 'Portées « quand » (employmentTiming) ou « lesquels » (materialSelection) manquées.', items: {
        type: 'OBJECT', properties: { id: str('assist-…'), kind: { type: 'STRING', enum: [...SCOPE_KINDS] }, quote, focus: quote,
          context: { type: 'ARRAY', items: quote, maxItems: 4 }, related: idList('Annotations liées.'), reason: str('Motif.') },
        required: ['id', 'kind', 'quote', 'reason'] } },
      openQuestions: { type: 'ARRAY', maxItems: 6, description: 'Questions utiles sans forme canonique (risque conditionnel, autre ajout, interaction levure…).', items: {
        type: 'OBJECT', properties: { id: str('assist-…'), kind: { type: 'STRING', enum: [...OPEN_KINDS] },
          quotes: { type: 'ARRAY', items: quote, minItems: 1, maxItems: 3 }, restatement: str('La question reformulée fidèlement.'),
          whyOpen: str('Pourquoi elle reste ouverte.'), related: idList('IDs liés.') },
        required: ['id', 'kind', 'quotes', 'restatement', 'whyOpen'] } },
      materials: { type: 'ARRAY', maxItems: 6, description: 'Matières nommées. Identité jamais confirmée par toi.', items: {
        type: 'OBJECT', properties: { id: str('assist-…'), quote, identity: { type: 'STRING', enum: [...IDENTITIES] },
          candidates: { type: 'ARRAY', maxItems: 4, description: 'Seulement des variety:/lot: retournés par lookup_hop_reference ou lookup_brewing_catalogue de ce tour.', items: {
            type: 'OBJECT', properties: { materialId: str('variety:… ou lot:…'), evidenceId: str('ID E… de la recherche.') }, required: ['materialId', 'evidenceId'] } },
          note: str('Ce qui reste à confirmer.') },
        required: ['id', 'quote', 'identity', 'note'] } },
      answer: { type: 'OBJECT', properties: {
        summary: str('Une phrase qui répond vraiment (250 caractères maximum).'),
        readingNote: str('Ce que tu as compris de la demande, sans la déformer.'),
        options: { type: 'ARRAY', minItems: 1, maxItems: 5, items: { type: 'OBJECT', properties: {
          id: str('assist-…'), kind: { type: 'STRING', enum: [...OPTION_KINDS] }, title: str('Titre court.'),
          rationale: str('Pourquoi dans CETTE bière : mécanisme et effet attendu, conditionnel, sans chiffre.'),
          conditions: { type: 'ARRAY', items: { type: 'STRING' }, maxItems: 3 }, tradeoffs: { type: 'ARRAY', items: { type: 'STRING' }, maxItems: 3 },
          related: idList('Objectifs, questions ou compensations servis.'), evidenceIds: idList('Références d’outil consultées (fiches, recherches) ; elles ne valident aucun chiffre.'),
          computed: computedLink },
          required: ['id', 'kind', 'title', 'rationale', 'related'] } },
        unknowns: { type: 'ARRAY', maxItems: 3, items: { type: 'OBJECT', properties: {
          id: str('assist-…'), question: str('Question au brasseur.'), changesChoice: str('Comment la réponse change le choix.'), related: idList('IDs liés.') },
          required: ['id', 'question', 'changesChoice'] } },
        program: { type: 'OBJECT', description: 'none sauf requête réellement préparée (preparedRequest) ou branche d’un résultat simulé (scenarioBranch) ; le serveur qualifie la branche.',
          properties: { kind: { type: 'STRING', enum: [...PROGRAM_KINDS] }, evidenceId: str('ID E… exact, sinon vide.'),
            branchId: str('ID exact de branche pour scenarioBranch, sinon vide.'), note: str('Ce que l’outil a préparé, ou pourquoi rien.') },
          required: ['kind', 'note'] },
        refusals: { type: 'ARRAY', maxItems: 4, items: { type: 'OBJECT', properties: { text: str('Refus bref et localisé.'), related: idList('IDs liés.') }, required: ['text'] } }
      }, required: ['summary', 'readingNote', 'options', 'program'] }
    },
    required: ['answer']
  }
};
