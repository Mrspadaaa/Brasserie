import { hopSourceError } from '../../../functions/src/hopIndexSchema';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopAdviceAssertion, HopAdviceDimension } from '../../domain/hopDecision/adviceSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import type {
  HopPropertyAdviceCandidatePolicy,
  HopPropertyAdviceIntent,
  HopPropertyAdviceRequest,
  HopPropertyAdviceRole,
} from '../../domain/hopDecision/propertyAdviceSchema';
import type { BrewingScenarioBeerFact } from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55QuestionCriterionV1, HopV55QuestionReading } from './decision';

export const HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_FORMAT = 'hop-v55-property-advice-request-draft-v2' as const;

export interface HopV55PropertyAdviceRevisionMetadataV2 {
  sourceRequestDraftReference: string;
  reason: string;
  recordedAt: string;
  recordedBy: { origin: 'user' | 'proposal' | 'fixture'; label: string };
  changedAccessScopes: Array<keyof HopPropertyAdviceRequest['context']['access']>;
}

export interface HopV55PropertyAdviceReexaminationSourceV2 {
  sourceRequestDraftReference: string;
  sourceReadingReference: string;
  preparedReference: string;
  reason: string;
  recordedAt: string;
  recordedBy: { origin: 'user' | 'proposal' | 'fixture'; label: string };
}

export interface HopV55PropertyAdviceRecordReexaminationContextV2 {
  sourceAnswerRecordReference: string;
  sourceAnswerReference: string;
  sourceReadingReference: string;
  reason: string;
  recordedAt: string;
  recordedBy: { origin: 'user' | 'proposal' | 'fixture'; label: string };
}

export type HopV55PropertyAdviceReexaminationInputV2 = Pick<HopV55PropertyAdviceReexaminationSourceV2,
  'reason' | 'recordedAt' | 'recordedBy'>;

export interface HopV55PropertyAdviceRequestDraftV2 {
  format: typeof HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparedReference: string;
  requestSnapshot: HopPropertyAdviceRequest;
  reference: string;
  /** Ephemeral handoff metadata; never added to the strict domain request snapshot. */
  revisionContext?: HopV55PropertyAdviceRevisionMetadataV2;
  /** Ephemeral source lineage; answer-record reexaminationContext is a separate envelope field. */
  reexaminationSource?: HopV55PropertyAdviceReexaminationSourceV2;
}

/** Structural source shape a persisted answer record can pass back to resume. */
export interface HopV55PropertyAdviceRequestSnapshotSourceV2 {
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparedReference: string;
  requestDraftReference: string;
  requestSnapshot: HopPropertyAdviceRequest;
  reexaminationContext?: HopV55PropertyAdviceRecordReexaminationContextV2;
}

export interface HopV55PropertyAdviceAccessUpdateV2 {
  scope: keyof HopPropertyAdviceRequest['context']['access'];
  access: HopPropertyAdviceRequest['context']['access'][keyof HopPropertyAdviceRequest['context']['access']];
  assertions: HopAdviceAssertion[];
}

export interface HopV55PropertyAdviceRevisionInputV2 {
  reason: string;
  recordedAt: string;
  recordedBy: HopV55PropertyAdviceRevisionMetadataV2['recordedBy'];
}

type DraftBody = Omit<HopV55PropertyAdviceRequestDraftV2, 'reference' | 'revisionContext' | 'reexaminationSource'>;
type Property = HopPropertyAdviceIntent['property'];
type RoleDirection = {
  role: HopPropertyAdviceRole;
  direction: HopPropertyAdviceIntent['direction'];
  required: boolean;
  basisKind: HopPropertyAdviceIntent['comparisonBasis']['kind'];
};

function normalize(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr')
    .replace(/[’']/gu, ' ').replace(/[‐‑–—-]/gu, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function assertText(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} est requis.`);
}

function assertUniqueStrings(values: readonly string[], label: string): void {
  if (values.some(value => !value.trim()) || new Set(values).size !== values.length) {
    throw new Error(`${label} invalide ou dupliqué.`);
  }
}

function assertCandidatePolicy(policy: HopPropertyAdviceCandidatePolicy): void {
  if (!policy || !['explicit', 'discover'].includes(policy.kind)) throw new Error('candidatePolicy.kind doit être explicite.');
  assertText(policy.basis, 'candidatePolicy.basis');
  assertUniqueStrings(policy.materialIds, 'candidatePolicy.materialIds');
  if (policy.kind === 'discover' && policy.materialIds.length === 0) {
    throw new Error('Une recherche discover doit nommer un périmètre de matières exact.');
  }
}

function assertInterpretation(value: HopPropertyAdviceRequest['interpretation']): void {
  assertText(value.id, 'interpretation.id'); assertText(value.version, 'interpretation.version'); assertText(value.text, 'interpretation.text');
  if (!['user', 'proposal'].includes(value.origin)) throw new Error('interpretation.origin doit rester user ou proposal.');
}

function draftBody(draft: HopV55PropertyAdviceRequestDraftV2 | DraftBody): DraftBody {
  // Revision metadata is consumed by the record writer but is not part of the
  // request-draft reference: the saved answer already seals requestSnapshot.
  const { reference: _reference, revisionContext: _revisionContext, reexaminationSource: _reexaminationSource, ...body } = draft as HopV55PropertyAdviceRequestDraftV2;
  return body;
}

export function hopV55PropertyAdviceRequestDraftReference(draft: HopV55PropertyAdviceRequestDraftV2 | DraftBody): string {
  return hopAdviceContentReference('hop-v55-property-advice-request-draft-v2', draftBody(draft));
}

export function assertHopV55PropertyAdviceRequestDraftV2(value: unknown): asserts value is HopV55PropertyAdviceRequestDraftV2 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Brouillon V2 de conseil par propriété illisible.');
  const draft = value as HopV55PropertyAdviceRequestDraftV2;
  if (draft.format !== HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_FORMAT) throw new Error('Format de brouillon V2 inconnu.');
  assertText(draft.id, 'draft.id'); assertText(draft.ownerKey, 'draft.ownerKey'); assertText(draft.workspaceId, 'draft.workspaceId');
  assertText(draft.sourceReadingReference, 'draft.sourceReadingReference'); assertText(draft.preparedReference, 'draft.preparedReference');
  assertText(draft.reference, 'draft.reference');
  if (!draft.requestSnapshot || draft.requestSnapshot.format !== 'hop-documentary-request-v2'
    || draft.requestSnapshot.id !== draft.id || !draft.requestSnapshot.originalQuestion.trim()) {
    throw new Error('Le brouillon doit conserver son requestSnapshot V2 exact.');
  }
  if (draft.reexaminationSource) {
    assertText(draft.reexaminationSource.sourceRequestDraftReference, 'reexaminationSource.sourceRequestDraftReference');
    assertText(draft.reexaminationSource.sourceReadingReference, 'reexaminationSource.sourceReadingReference');
    assertText(draft.reexaminationSource.preparedReference, 'reexaminationSource.preparedReference');
    assertText(draft.reexaminationSource.reason, 'reexaminationSource.reason');
  }
  if (hopV55PropertyAdviceRequestDraftReference(draft) !== draft.reference) throw new Error('Le brouillon a été altéré.');
}

function materialNames(material: HopDecisionMaterial): string[] {
  return [material.name, material.variety?.name, material.lot?.name, material.product?.name,
    ...(material.variety?.aliases ?? [])].filter((name): name is string => typeof name === 'string' && !!name.trim());
}

/** Snapshot JSON semantics at the request boundary: absent object fields stay absent, never null or zero. */
function cloneMaterialForRequest<T>(value: T, active = new WeakSet<object>()): T {
  if (!value || typeof value !== 'object') return value;
  if (active.has(value)) throw new Error('Une matière catalogue contient un cycle; le snapshot JSON est refusé.');
  active.add(value);
  try {
    if (Array.isArray(value)) return value.map(row => cloneMaterialForRequest(row, active)) as T;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('Une matière catalogue contient un objet non JSON.');
    if (Object.getOwnPropertySymbols(value).length) throw new Error('Une matière catalogue contient une clé symbole non JSON.');
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => [key, cloneMaterialForRequest(child, active)] as const);
    return Object.fromEntries(entries) as T;
  } finally {
    active.delete(value);
  }
}

function scopedMaterials(prepared: PreparedBrewingScenarioContext, policy: HopPropertyAdviceCandidatePolicy,
  intents: readonly HopPropertyAdviceIntent[]): HopDecisionMaterial[] {
  const ids = new Set(policy.materialIds);
  for (const intent of intents) {
    if (intent.subject.materialId) ids.add(intent.subject.materialId);
    if (intent.partner?.kind === 'material') ids.add(intent.partner.id);
  }
  return prepared.runtime.materials.filter(material => ids.has(material.id)).map(material => cloneMaterialForRequest(material));
}

/** Exact context plus exact requested/linked materials; unrelated cache changes do not widen the scope. */
export function hopV55PropertyAdvicePreparedReference(
  prepared: PreparedBrewingScenarioContext,
  request: Pick<HopPropertyAdviceRequest, 'candidatePolicy' | 'propertyIntents' | 'materials'>,
): string {
  return hopAdviceContentReference('hop-v55-property-advice-prepared-v2', hopV55PropertyAdvicePreparedContent(prepared, request));
}

/** Internal shared payload for versioned prepared-context fingerprints. */
export function hopV55PropertyAdvicePreparedContent(
  prepared: PreparedBrewingScenarioContext,
  request: Pick<HopPropertyAdviceRequest, 'candidatePolicy' | 'propertyIntents' | 'materials'>,
): Record<string, unknown> {
  const expectedMaterials = scopedMaterials(prepared, request.candidatePolicy, request.propertyIntents);
  return {
    preparedVersion: prepared.version,
    dataRevision: prepared.runtime.dataRevision ?? null,
    current: structuredClone(prepared.runtime.current ?? null),
    candidatePolicy: structuredClone(request.candidatePolicy),
    subjectMaterialIds: request.propertyIntents.flatMap(intent => [
      ...(intent.subject.materialId ? [intent.subject.materialId] : []),
      ...(intent.partner?.kind === 'material' ? [intent.partner.id] : []),
    ]),
    expectedMaterials,
    requestMaterials: cloneMaterialForRequest(request.materials),
  };
}

function factDimension(field: string): HopAdviceDimension | undefined {
  const key = normalize(field);
  if (/\b(?:ph|acid|acidite|acidul|sour)\b/u.test(key)) return 'acidity';
  if (/\b(?:abv|alcohol|alcool|ethanol)\b/u.test(key)) return 'alcohol';
  if (/\b(?:biotransform|thiol|yeast|levure|culture)\b/u.test(key)) return 'bioInteraction';
  if (/\b(?:hop creep|dextrin)\b/u.test(key)) return 'hopCreep';
  if (/\b(?:transfer|retention|loss|perte|transfert|matrice)\b/u.test(key)) return 'matrixTransfer';
  if (/\b(?:ibu|bitterness|amertume)\b/u.test(key)) return 'other';
  if (/\b(?:stock|available|availability|disponible)\b/u.test(key)) return 'stock';
  if (/\b(?:analysis|analyse|measurement|mesure|alpha|oil|huile)\b/u.test(key)) return 'documentation';
  if (/\b(?:stage|use|emploi|dose|contact|temperature|temps|program|programme)\b/u.test(key)) return 'process';
  return undefined;
}

function factState(fact: BrewingScenarioBeerFact): HopAdviceAssertion['state'] {
  if (fact.status === 'observed') return 'measured';
  if (fact.status === 'unknown') return 'unknown';
  if (fact.status === 'reported') return 'reported';
  return 'planned';
}

function preparedAssertions(prepared: PreparedBrewingScenarioContext): HopAdviceAssertion[] {
  const current = prepared.runtime.current;
  if (!current) return [];
  const assertions: HopAdviceAssertion[] = [];
  if (current.culture) {
    const members = current.culture.members.map(member => [member.yeastId ?? member.name ?? 'Identité non résolue',
      ...(member.proportion ? [`proportion ${member.proportion.min}–${member.proportion.max}`] : [])].join(' · '));
    assertions.push({ id: 'context-culture', subject: 'culture',
      statement: current.culture.explanation ?? 'Culture transmise dans le contexte préparé.',
      state: current.culture.state === 'unknown' ? 'unknown' : 'reported',
      value: members.length ? members.join('; ') : null, dimension: 'bioInteraction' });
  }
  if (current.input.aromaDomain === 'nolo') assertions.push({
    id: 'context-aroma-domain-nolo', subject: 'input.aromaDomain',
    statement: 'Le domaine aromatique nolo est explicitement transmis; il ne déclare ni arôme cible ni résultat sensoriel.',
    state: 'reported', value: 'nolo',
  });
  for (const fact of current.beerContext?.facts ?? []) assertions.push({
    id: `context-${fact.id}`, subject: fact.field,
    statement: `Fait typé du contexte préparé (${fact.status}, origine ${fact.origin}).`,
    state: factState(fact), value: fact.value ?? null,
    ...(fact.unit ? { unit: fact.unit } : {}), ...(factDimension(fact.field) ? { dimension: factDimension(fact.field) } : {}),
    ...(fact.source ? { source: fact.source } : {}),
  });
  for (const addition of current.program?.additions ?? []) assertions.push({
    id: `program-${addition.id}`, subject: addition.id,
    statement: `Ajout de programme transmis: ${addition.materialId}, ${addition.use}, ${addition.status}.`,
    state: addition.status === 'performed' ? 'performed' : 'planned', value: addition.grams,
    ...(addition.grams !== null ? { unit: 'g' } : {}), dimension: 'process',
  });
  return assertions;
}

function unknownAccess(basis: string): HopPropertyAdviceRequest['context']['access'] {
  const unknown = () => ({ state: 'unknown' as const, basis, assertionIds: [] as string[] });
  return { bulkBeer: unknown(), sampling: unknown(), separatePortion: unknown() };
}

function requestContext(prepared: PreparedBrewingScenarioContext): HopPropertyAdviceRequest['context'] {
  const program = prepared.runtime.current?.program;
  return {
    stage: program?.stage ?? 'unknown',
    stageBasis: program
      ? 'Stade exact du programme lié au contexte préparé; aucun stade ne vient d’un nom de recette ou d’un scénario futur.'
      : 'Aucun stade de programme physique lié au contexte préparé; le stade reste unknown.',
    assertions: preparedAssertions(prepared),
    access: unknownAccess('Accès non déclaré; il n’est pas déduit du stade, de la recette ou du programme.'),
  };
}

function clauseRange(question: string, start: number, end: number): { start: number; end: number } {
  const before = question.slice(0, start);
  const after = question.slice(end);
  const boundaries = ['.', ';', '?', '!', '\n'];
  const left = Math.max(-1, ...boundaries.map(character => before.lastIndexOf(character))) + 1;
  const right = Math.min(...boundaries.map(character => {
    const index = after.indexOf(character);
    return index < 0 ? question.length : end + index;
  }));
  return { start: left, end: right };
}

function clauseForSpan(question: string, span: HopV55QuestionCriterionV1['source']): string {
  const range = clauseRange(question, span.start, span.end);
  return question.slice(range.start, range.end);
}

function prefixForSpan(question: string, span: HopV55QuestionCriterionV1['source']): string {
  const range = clauseRange(question, span.start, span.end);
  return question.slice(range.start, span.start);
}

function sourceHas(question: string, span: HopV55QuestionCriterionV1['source'], pattern: RegExp): boolean {
  return pattern.test(clauseForSpan(question, span));
}

function exactMentionedMaterials(question: string, draft: HopV55QuestionCriterionV1,
  prepared: PreparedBrewingScenarioContext): HopDecisionMaterial[] {
  return materialsMentionedNearSpan(question, draft.source, prepared);
}

/** Prepared materials whose exact names occur in the clause of a source span; zero or several stay unlinked. */
function materialsMentionedNearSpan(question: string, span: HopV55QuestionCriterionV1['source'],
  prepared: PreparedBrewingScenarioContext): HopDecisionMaterial[] {
  const clause = normalize(clauseForSpan(question, span));
  const hits = prepared.runtime.materials.filter(material => materialNames(material).some(name => {
    const normalized = normalize(name);
    return normalized.length > 0 && (` ${clause} `).includes(` ${normalized} `);
  }));
  return [...new Map(hits.map(material => [material.id, material])).values()];
}

/**
 * Prepared materials whose exact name occurs inside one already attached
 * subject fragment. Nothing outside that fragment is read: a material named
 * elsewhere in the clause never becomes the identity of this subject.
 */
function materialsNamedInSpan(span: HopV55QuestionCriterionV1['source'], prepared: PreparedBrewingScenarioContext): HopDecisionMaterial[] {
  const subject = ` ${normalize(span.text)} `;
  const hits = prepared.runtime.materials.filter(material => materialNames(material).some(name => {
    const normalized = normalize(name);
    return normalized.length > 0 && subject.includes(` ${normalized} `);
  }));
  return [...new Map(hits.map(material => [material.id, material])).values()];
}

function materialSubjectLabel(question: string, span: HopV55QuestionCriterionV1['source']): string {
  const prefix = prefixForSpan(question, span);
  const matches = [...prefix.matchAll(/\b(?:houblon|mati[eè]re|[ée]chantillon|lot|ingr[ée]dient|hop)\b(?:\s+(?:maison|local|t[eé]moin|raw|hop|de|du|des))?(?:\s+[\p{L}\p{N}’'-]+)?/giu)];
  return matches.at(-1)?.[0]?.trim() || 'Matière citée; identité non liée à une matière chargée.';
}

function isMaterialObservation(question: string, draft: HopV55QuestionCriterionV1): boolean {
  return draft.direction === null && draft.requirement === 'optional'
    && sourceHas(question, draft.source, /\b(?:houblon|mati[eè]re|[ée]chantillon|lot|raw hop)\b[\s\S]{0,80}\b(?:odeur|ar[oô]me|g[oû]ut|note|smell|aroma|taste)\b/u)
    && (/observation/i.test(draft.qualification ?? '') || sourceHas(question, draft.source, /\b(?:odeur|ar[oô]me|g[oû]ut|note|smell|aroma|taste)\b/u));
}

function isSensoryPreference(draft: HopV55QuestionCriterionV1): boolean {
  return draft.requirement === 'optional' && draft.direction === null
    && /préférence de partenaire/i.test(draft.qualification ?? '');
}

function explicitGoalBeforeSpan(question: string, draft: HopV55QuestionCriterionV1): boolean {
  const before = normalize(prefixForSpan(question, draft.source));
  return /\b(?:je veux|je voudrais|je cherche|je recherche|nous voulons|nous cherchons|nous recherchons|i want|we want|i would like|i seek|we seek)\b/u.test(before)
    && !/\b(?:savoir|comprendre|examiner|comparer|know|understand|examine|compare)\b/u.test(before);
}

function isReportedDescription(question: string, draft: HopV55QuestionCriterionV1): boolean {
  // An explicit, directed target belongs to its own local request frame even
  // when an earlier coordinated clause reports the beer's current condition.
  // A corrected active criterion is authoritative over parser-level context cues.
  const directedTarget = draft.requirement === 'required' && draft.direction !== null;
  if (directedTarget && (draft.origin === 'brasseur' || explicitGoalBeforeSpan(question, draft))) return false;
  return !!draft.reportedProblem || /observation d[ée]clar[ée]e|note de contexte cit[ée]e/i.test(draft.qualification ?? '')
    || sourceHas(question, draft.source, /\b(?:ma|mon|my|this|the)\s+(?:bi[eè]re|beer)\b[\s\S]{0,48}\b(?:a|est|pr[eé]sente|has|shows?)\b/iu);
}

function isDesiredProfile(question: string, draft: HopV55QuestionCriterionV1): boolean {
  if (explicitGoalBeforeSpan(question, draft)) return true;
  const before = normalize(prefixForSpan(question, draft.source));
  return /\b(?:avec|with)\s+(?:(?:un|une|du|de la|a|an|some)\s+)?(?:legere|leger|faible|basse|bas|light|low)\s*$/u.test(before)
    && !isReportedDescription(question, draft);
}

function currentAssertionIds(prepared: PreparedBrewingScenarioContext, property: Property): string[] {
  const patterns: Partial<Record<Property, RegExp>> = {
    aroma: /\b(?:aroma|aromatique|floral|fruit|hop|arome)\b/u,
    bitterness: /\b(?:bitterness|amertume|ibu|bitter)\b/u,
    sweetness: /\b(?:sweet|sucr|sucros)\b/u,
    acidity: /\b(?:acid|ph|sour|acidit)\b/u,
  };
  const pattern = patterns[property];
  if (!pattern) return [];
  const dimension = property === 'acidity' ? 'acidity' : property === 'aroma' ? undefined : 'other';
  return (prepared.runtime.current?.beerContext?.facts ?? [])
    .filter(fact => (fact.status === 'observed' || fact.status === 'reported') && pattern.test(normalize(fact.field))
      && (dimension === undefined || factDimension(fact.field) === dimension))
    .map(fact => `context-${fact.id}`);
}

function propertyFor(draft: HopV55QuestionCriterionV1, materialObservation: boolean): Property {
  if (materialObservation) return 'materialCharacter';
  if (isSensoryPreference(draft)) return 'aroma';
  if (draft.dimension === 'bioInteraction') return 'bioContribution';
  if (draft.dimension === 'acidity') return 'acidity';
  if (draft.familyId || draft.dimension === 'aroma') return 'aroma';
  const term = normalize(draft.term);
  const aliasTarget = draft.dimension === 'other'
    ? /graphie proche de «\s*([^»]+)\s*»; rapprochement proposé, à confirmer\./iu.exec(draft.qualification ?? '')?.[1]
    : undefined;
  if (aliasTarget && /^(?:amertume|amer|amere|bitterness|bitter|ibu)$/u.test(normalize(aliasTarget))) return 'bitterness';
  if (draft.dimension === 'other' && /^(?:amertume|amer|amere|bitterness|bitter|ibu)$/.test(term)) return 'bitterness';
  if (draft.dimension === 'other' && /^(?:sucre|sucree|sucrosite|sweet|sweetness)$/.test(term)) return 'sweetness';
  if (/^aromatis/.test(term)) return 'aroma';
  return 'unresolved';
}

function isRelativeGuard(question: string, draft: HopV55QuestionCriterionV1): boolean {
  const before = normalize(prefixForSpan(question, draft.source));
  return /\b(?:ne pas augmenter|pas plus|ne pas diminuer|do not increase|not more|without increasing|without decreasing)\b/u.test(before);
}

function roleDirection(question: string, draft: HopV55QuestionCriterionV1, materialObservation: boolean): RoleDirection {
  if (materialObservation || isReportedDescription(question, draft)) {
    return { role: 'reportedObservation', direction: null, required: false, basisKind: 'current' };
  }
  if (draft.direction === 'investigate') {
    return isDesiredProfile(question, draft)
      ? { role: 'target', direction: null, required: true, basisKind: 'qualitativeTarget' }
      : { role: 'investigation', direction: 'investigate', required: draft.requirement === 'required', basisKind: 'none' };
  }
  if (draft.direction === 'exclude') return { role: 'constraint', direction: 'exclude', required: draft.requirement === 'required', basisKind: 'none' };
  if (draft.direction === 'keep') return {
    role: isRelativeGuard(question, draft) ? 'constraint' : 'target', direction: 'keep',
    required: draft.requirement === 'required', basisKind: 'current',
  };
  if (draft.direction === 'decrease' && isDesiredProfile(question, draft)
    && /^(?:legere|leger|faible|basse|bas|light|low)$/.test(normalize(draft.qualification ?? ''))) {
    return { role: 'target', direction: null, required: draft.requirement === 'required', basisKind: 'qualitativeTarget' };
  }
  if (draft.direction === 'decrease') return { role: 'target', direction: 'decrease', required: draft.requirement === 'required', basisKind: 'current' };
  if (draft.direction === 'increase') return { role: 'target', direction: 'increase', required: draft.requirement === 'required', basisKind: 'qualitativeTarget' };
  if (draft.requirement === 'optional') return { role: 'preference', direction: null, required: false, basisKind: 'none' };
  return { role: 'investigation', direction: 'investigate', required: true, basisKind: 'none' };
}

function metricFor(property: Property, draft: HopV55QuestionCriterionV1): HopPropertyAdviceIntent['metric'] {
  return metricForTerm(property, draft.term);
}

function metricForTerm(property: Property, value: string): HopPropertyAdviceIntent['metric'] {
  const term = normalize(value);
  if (property === 'acidity' && term === 'ph') return 'pH';
  if (property === 'acidity' && /^(?:acidite titrable|titratable acidity)$/.test(term)) return 'titratableAcidity';
  if (property === 'bitterness' && term === 'ibu') return 'analyticalBU';
  return property === 'unresolved' || property === 'bioContribution' ? 'unspecified' : 'sensory';
}

function buildIntent(input: { reading: HopV55QuestionReading; prepared: PreparedBrewingScenarioContext;
  draft: HopV55QuestionCriterionV1 }): HopPropertyAdviceIntent {
  const { reading, prepared, draft } = input;
  const question = reading.intent.question;
  if (question.slice(draft.source.start, draft.source.end) !== draft.source.text) {
    throw new Error(`Le fragment ${draft.id} diffère de la question exacte.`);
  }
  const materialObservation = isMaterialObservation(question, draft);
  const matchingMaterials = materialObservation ? exactMentionedMaterials(question, draft, prepared) : [];
  const property = propertyFor(draft, materialObservation);
  const role = roleDirection(question, draft, materialObservation);
  const subject = materialObservation
    ? { kind: 'material' as const,
      label: matchingMaterials.length === 1 ? matchingMaterials[0].name : materialSubjectLabel(question, draft.source),
      materialId: matchingMaterials.length === 1 ? matchingMaterials[0].id : null,
      sensoryContext: sourceHas(question, draft.source, /\b(?:houblon|raw hop)\b/u) ? 'rawHop' as const : 'unspecified' as const }
    : property === 'bioContribution'
      ? { kind: 'culture' as const, label: prepared.runtime.current?.culture
        ? 'Culture de fermentation du contexte préparé' : 'Culture de fermentation citée; identité non résolue',
        materialId: null, sensoryContext: 'unspecified' as const }
      : property === 'unresolved' && ['target', 'preference', 'constraint', 'reportedObservation'].includes(role.role)
        ? { kind: 'beer' as const, label: 'Bière visée; propriété à préciser.', materialId: null, sensoryContext: 'beer' as const }
      : property === 'unresolved'
        ? { kind: 'unspecified' as const, label: 'Sujet à qualifier depuis la question; aucune bière ou matière assignée.',
          materialId: null, sensoryContext: 'unspecified' as const }
        : { kind: 'beer' as const, label: 'Bière visée', materialId: null, sensoryContext: 'beer' as const };
  const partner = reading.response?.intent.criteria?.find(row => row.id === draft.id)?.partner;
  return {
    id: draft.id, property, label: draft.term,
    ...(draft.familyId ? { familyId: draft.familyId } : {}), ...(partner ? { partner: structuredClone(partner) } : {}),
    role: role.role, direction: role.direction, qualification: draft.qualification ?? null, required: role.required,
    comparisonBasis: { kind: role.basisKind, assertionIds: role.basisKind === 'current' ? currentAssertionIds(prepared, property) : [] },
    metric: metricFor(property, draft), subject, sourceSpans: [structuredClone(draft.source)],
    interpretationOrigin: draft.origin === 'brasseur' ? 'user' : 'proposal',
    basis: draft.origin === 'brasseur'
      ? 'Annotation corrigée par le brasseur; source et qualificatif exacts sont conservés.'
      : role.role === 'investigation'
        ? 'Question d’investigation conservée; elle ne devient pas une observation ni un effet.'
        : materialObservation
          ? 'Observation de matière conservée dans son contexte; aucune cible de bière, intensité ou identité non liée n’est déduite.'
          : role.basisKind === 'qualitativeTarget'
            ? 'Cible qualitative proposée depuis une direction ou un cadre de souhait; aucune valeur actuelle ou échelle n’est inventée.'
            : 'Interprétation proposée depuis la lecture structurée; la propriété et le rôle restent corrigibles.',
    relatedIntentIds: [],
  };
}

function isCompensationAnnotation(draft: HopV55QuestionCriterionV1): boolean {
  return draft.origin === 'parser' && draft.direction === null && draft.requirement === 'optional'
    && /demande de compensation/i.test(draft.qualification ?? '');
}

function buildCompensationIntent(draft: HopV55QuestionCriterionV1,
  priorIntents: readonly HopPropertyAdviceIntent[]): HopPropertyAdviceIntent {
  const related = priorIntents.filter(intent => intent.role === 'reportedObservation' && intent.subject.kind === 'beer'
    && intent.sourceSpans.some(span => span.end <= draft.source.start));
  const referent = related.length === 1 ? related[0] : undefined;
  return {
    id: draft.id, property: referent?.property ?? 'unresolved', label: draft.term,
    role: 'investigation', direction: 'investigate', qualification: null, required: true,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: referent?.metric ?? 'unspecified',
    subject: referent ? structuredClone(referent.subject) : {
      kind: 'unspecified', label: 'Objet de la compensation à préciser depuis la demande exacte.',
      materialId: null, sensoryContext: 'unspecified',
    },
    sourceSpans: [structuredClone(draft.source)], interpretationOrigin: 'proposal',
    basis: referent
      ? 'La demande de compensation reste une investigation reliée au constat source; aucun levier ni résultat de goût n’est choisi.'
      : 'La demande de compensation reste une investigation; son objet et son levier demeurent à qualifier.',
    relatedIntentIds: referent ? [referent.id] : [],
  };
}

function mapReading(reading: HopV55QuestionReading, prepared: PreparedBrewingScenarioContext): HopPropertyAdviceIntent[] {
  // A strict V2/V3 archive never holds an engaged target without direction; refusing it keeps the historical mapper
  // from turning that target into an investigation. The semantic adapter receives it instead.
  const qualitativeTargets = reading.criterionDrafts.filter(draft => draft.requirement === 'required' && draft.direction === null);
  if (qualitativeTargets.length) {
    throw new Error(`Cible qualitative engagée sans direction (${qualitativeTargets.map(draft => `« ${draft.term} »`).join(', ')}) : `
      + 'la lecture sémantique V4 et son adaptateur PropertyV3 sont requis; aucune investigation de substitution n’est produite.');
  }
  const intents: HopPropertyAdviceIntent[] = [];
  for (const draft of reading.criterionDrafts) {
    const intent = isCompensationAnnotation(draft)
      ? buildCompensationIntent(draft, intents)
      : buildIntent({ reading, prepared, draft });
    const partnerText = intent.partner?.kind === 'freeContext' ? normalize(intent.partner.text) : '';
    if (partnerText) {
      const linkedContext = reading.criterionDrafts.find(candidate => candidate.id !== draft.id
        && partnerText.includes(normalize(candidate.source.text)));
      if (linkedContext) intent.relatedIntentIds = [linkedContext.id];
      const relation = linkedContext && reading.intent.question.slice(draft.source.end, linkedContext.source.start).trim();
      if (relation) intent.basis = `Relation d’accord source « ${relation} » conservée avec le contexte exact « ${intent.partner?.kind === 'freeContext' ? intent.partner.text : ''} ».`;
    }
    intents.push(intent);
  }
  return intents;
}

function assertSourceSpans(question: string, intents: readonly HopPropertyAdviceIntent[]): void {
  for (const intent of intents) for (const span of intent.sourceSpans) {
    if (!Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end) || span.start < 0 || span.end < span.start
      || question.slice(span.start, span.end) !== span.text) throw new Error(`Le fragment de l’intention ${intent.id} diffère de la question exacte.`);
  }
}

type IntentSourceIdentity = Pick<HopPropertyAdviceIntent, 'id' | 'sourceSpans'>;

function assertAnnotationIdsPreserved(previous: readonly IntentSourceIdentity[], next: readonly HopPropertyAdviceIntent[]): void {
  assertUniqueStrings(next.map(intent => intent.id), 'propertyIntents.id');
  const nextIds = new Set(next.map(intent => intent.id));
  if (previous.some(intent => !nextIds.has(intent.id))) {
    throw new Error('Une révision conserve chaque intention source; transforme une ligne en contexte non requis au lieu de l’effacer.');
  }
  const nextById = new Map(next.map(intent => [intent.id, intent]));
  for (const intent of previous) {
    const edited = nextById.get(intent.id)!;
    if (JSON.stringify(edited.sourceSpans) !== JSON.stringify(intent.sourceSpans)) {
      throw new Error('Une correction conserve les fragments source et leurs identifiants exacts.');
    }
  }
}

function checkRevisionMetadata(value: HopV55PropertyAdviceRevisionInputV2): void {
  assertText(value.reason, 'revisionContext.reason'); assertText(value.recordedBy.label, 'revisionContext.recordedBy.label');
  if (!['user', 'proposal', 'fixture'].includes(value.recordedBy.origin)
    || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value.recordedAt)
    || !Number.isFinite(Date.parse(value.recordedAt))) throw new Error('revisionContext acteur/date invalide.');
}

function checkAccessUpdates(request: Pick<HopPropertyAdviceRequest, 'context'>, updates: readonly HopV55PropertyAdviceAccessUpdateV2[]): void {
  const existing = new Set(request.context.assertions.map(assertion => assertion.id));
  const added = new Set<string>();
  for (const update of updates) {
    if (!['bulkBeer', 'sampling', 'separatePortion'].includes(update.scope)) throw new Error('Portée d’accès inconnue.');
    assertText(update.access.basis, `Accès.${update.scope}.basis`);
    assertUniqueStrings(update.access.assertionIds, `Accès.${update.scope}.assertionIds`);
    for (const assertion of update.assertions) {
      assertText(assertion.id, 'assertion.id'); assertText(assertion.statement, 'assertion.statement');
      if (existing.has(assertion.id) || added.has(assertion.id)) throw new Error('Une assertion conservée ne peut pas être réécrite; crée un ID nouveau.');
      const expectedValue = update.access.state === 'yes' ? true : update.access.state === 'no' ? false : undefined;
      if (assertion.subject !== update.scope || assertion.state !== 'reported' || assertion.dimension !== 'process'
        || typeof assertion.value !== 'boolean' || expectedValue === undefined || assertion.value !== expectedValue) {
        throw new Error('Une attestation d’accès doit être sourcée, booléenne et correspondre à sa portée/state.');
      }
      if (!assertion.source || hopSourceError(assertion.source)) throw new Error('Une attestation utilisateur d’accès exige sa source explicite.');
      added.add(assertion.id);
    }
    if (update.access.state === 'unknown') {
      if (update.assertions.length || update.access.assertionIds.length) throw new Error('Un accès unknown ne cite aucune ancienne attestation.');
    } else if (update.assertions.length === 0 || update.access.assertionIds.length !== update.assertions.length
      || update.access.assertionIds.some(id => !update.assertions.some(assertion => assertion.id === id))) {
      throw new Error('Un accès yes/no doit lier exactement ses nouvelles assertions.');
    }
  }
}

function buildDraft(input: { id: string; ownerKey: string; workspaceId: string; sourceReadingReference: string;
  requestSnapshot: HopPropertyAdviceRequest; prepared: PreparedBrewingScenarioContext;
  revisionContext?: HopV55PropertyAdviceRevisionMetadataV2;
  reexaminationSource?: HopV55PropertyAdviceReexaminationSourceV2 }): HopV55PropertyAdviceRequestDraftV2 {
  const body: DraftBody = {
    format: HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_FORMAT, id: input.id, ownerKey: input.ownerKey,
    workspaceId: input.workspaceId, sourceReadingReference: input.sourceReadingReference,
    preparedReference: hopV55PropertyAdvicePreparedReference(input.prepared, input.requestSnapshot),
    requestSnapshot: structuredClone(input.requestSnapshot),
  };
  return { ...body, reference: hopV55PropertyAdviceRequestDraftReference(body),
    ...(input.revisionContext ? { revisionContext: structuredClone(input.revisionContext) } : {}),
    ...(input.reexaminationSource ? { reexaminationSource: structuredClone(input.reexaminationSource) } : {}) };
}

function advicePartnerSummary(intent: HopPropertyAdviceIntent): string | undefined {
  const partner = intent.partner;
  if (!partner) return undefined;
  if (partner.kind === 'freeContext') return `contexte lié « ${partner.text} »`;
  if (partner.kind === 'observation') return `observation liée « ${partner.id} »`;
  return `matière liée « ${partner.id} »`;
}

/** Proposes a first reading from typed intent roles; never upgrades a report to a target. */
export function buildHopV55PropertyAdviceInterpretation(intents: readonly HopPropertyAdviceIntent[]): string {
  const byId = new Map(intents.map(intent => [intent.id, intent]));
  const summarize = (intent: HopPropertyAdviceIntent): string => {
    const subject = `${intent.label}${intent.qualification ? ` (${intent.qualification})` : ''}`;
    let line: string;
    switch (intent.role) {
      case 'reportedObservation': line = `Constat rapporté : ${subject}`; break;
      case 'measurement': line = `Mesure déclarée : ${subject}`; break;
      case 'target':
        line = intent.direction === 'increase' ? `Cible : plus de ${subject}`
          : intent.direction === 'decrease' ? `Cible : moins de ${subject}`
            : intent.direction === 'keep' ? `Cible à préserver : ${subject}`
              : intent.direction === 'exclude' ? `Cible à éviter : ${subject}`
                : `Cible qualitative : ${subject}`;
        break;
      case 'investigation': line = `Question à examiner : ${subject}`; break;
      case 'preference': line = `Préférence facultative : ${subject}`; break;
      case 'constraint': line = `Garde : ${intent.direction === 'exclude' ? 'éviter' : intent.direction === 'keep' ? 'préserver' : 'conserver'} ${subject}`; break;
    }
    const related = intent.relatedIntentIds.map(id => byId.get(id)).filter((row): row is HopPropertyAdviceIntent => !!row);
    if (related.length) {
      const linked = related.map(row => row.role === 'reportedObservation'
        ? `au constat rapporté « ${row.label} »` : `à l’intention « ${row.label} »`);
      line += `, reliée ${linked.join(' et ')}`;
    }
    const partner = advicePartnerSummary(intent);
    if (partner) line += `, en relation avec ${partner}`;
    return line;
  };
  return intents.length
    ? `Lecture proposée : ${intents.map(summarize).join('; ')}.`
    : 'Lecture proposée : aucune intention de propriété qualifiée.';
}

export interface PrepareHopV55PropertyAdviceRequestDraftInput {
  reading: HopV55QuestionReading;
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  candidatePolicy: HopPropertyAdviceCandidatePolicy;
  propertyIntents?: readonly HopPropertyAdviceIntent[];
}

export function prepareHopV55PropertyAdviceRequestDraft(
  input: PrepareHopV55PropertyAdviceRequestDraftInput,
): HopV55PropertyAdviceRequestDraftV2 {
  assertText(input.requestId, 'requestId'); assertText(input.ownerKey, 'ownerKey'); assertText(input.workspaceId, 'workspaceId');
  assertText(input.sourceReadingReference, 'sourceReadingReference'); assertCandidatePolicy(input.candidatePolicy);
  const intents = input.propertyIntents ? [...structuredClone(input.propertyIntents)] : mapReading(input.reading, input.prepared);
  assertSourceSpans(input.reading.intent.question, intents);
  assertAnnotationIdsPreserved(input.reading.criterionDrafts.map(draft => ({ id: draft.id, sourceSpans: [draft.source] })), intents);
  if (!intents.length) throw new Error('Le request V2 doit conserver une intention ou un contexte non requis.');
  const requestSnapshot: HopPropertyAdviceRequest = {
    format: 'hop-documentary-request-v2', id: input.requestId,
    originalQuestion: input.reading.intent.question,
    interpretation: { id: `interpretation-${input.requestId}`, version: 'hop-v55-property-advice-reading-v2',
      // The legacy prose can echo a parser direction even when the typed role
      // is a report. This first-pass text is a proposal derived from roles.
      // Explicit user interpretations are sealed in requestSnapshot and are
      // carried unchanged by resume/revise/reexamine below.
      text: buildHopV55PropertyAdviceInterpretation(intents), origin: 'proposal' },
    propertyIntents: intents, candidatePolicy: structuredClone(input.candidatePolicy),
    context: requestContext(input.prepared), exclusions: [],
    materials: scopedMaterials(input.prepared, input.candidatePolicy, intents),
  };
  return buildDraft({ id: input.requestId, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: input.sourceReadingReference, requestSnapshot, prepared: input.prepared });
}

export interface ReviseHopV55PropertyAdviceRequestDraftInputV2 {
  draft: HopV55PropertyAdviceRequestDraftV2;
  prepared: PreparedBrewingScenarioContext;
  propertyIntents?: readonly HopPropertyAdviceIntent[];
  candidatePolicy?: HopPropertyAdviceCandidatePolicy;
  /** A renderer may correct the structured interpretation independently of all intents. */
  interpretation?: HopPropertyAdviceRequest['interpretation'];
  revisionContext: HopV55PropertyAdviceRevisionInputV2;
  accessUpdates?: readonly HopV55PropertyAdviceAccessUpdateV2[];
}

export function reviseHopV55PropertyAdviceRequestDraft(
  input: ReviseHopV55PropertyAdviceRequestDraftInputV2,
): HopV55PropertyAdviceRequestDraftV2 {
  assertHopV55PropertyAdviceRequestDraftV2(input.draft);
  if (input.draft.preparedReference !== hopV55PropertyAdvicePreparedReference(input.prepared, input.draft.requestSnapshot)) {
    throw new Error('Le contexte préparé a changé; réexamine la demande au lieu de remplacer silencieusement sa référence.');
  }
  const propertyIntents = input.propertyIntents ?? input.draft.requestSnapshot.propertyIntents;
  const candidatePolicy = input.candidatePolicy ?? input.draft.requestSnapshot.candidatePolicy;
  assertCandidatePolicy(candidatePolicy); checkRevisionMetadata(input.revisionContext);
  if (input.interpretation) assertInterpretation(input.interpretation);
  assertAnnotationIdsPreserved(input.draft.requestSnapshot.propertyIntents, propertyIntents);
  assertSourceSpans(input.draft.requestSnapshot.originalQuestion, propertyIntents);
  const accessUpdates = input.accessUpdates ?? [];
  checkAccessUpdates(input.draft.requestSnapshot, accessUpdates);
  const requestSnapshot = structuredClone(input.draft.requestSnapshot);
  requestSnapshot.propertyIntents = [...structuredClone(propertyIntents)];
  requestSnapshot.candidatePolicy = structuredClone(candidatePolicy);
  if (input.interpretation) requestSnapshot.interpretation = structuredClone(input.interpretation);
  requestSnapshot.materials = scopedMaterials(input.prepared, candidatePolicy, propertyIntents);
  for (const update of accessUpdates) {
    requestSnapshot.context.assertions.push(...structuredClone(update.assertions));
    requestSnapshot.context.access[update.scope] = structuredClone(update.access);
  }
  const revisionContext: HopV55PropertyAdviceRevisionMetadataV2 = {
    sourceRequestDraftReference: input.draft.reference,
    ...structuredClone(input.revisionContext),
    changedAccessScopes: [...new Set(accessUpdates.map(update => update.scope))],
  };
  return buildDraft({ id: input.draft.id, ownerKey: input.draft.ownerKey, workspaceId: input.draft.workspaceId,
    sourceReadingReference: input.draft.sourceReadingReference, requestSnapshot, prepared: input.prepared, revisionContext,
    ...(input.draft.reexaminationSource ? { reexaminationSource: input.draft.reexaminationSource } : {}) });
}

export function resumeHopV55PropertyAdviceRequestDraft(input: {
  source: HopV55PropertyAdviceRequestSnapshotSourceV2;
  prepared: PreparedBrewingScenarioContext;
}): HopV55PropertyAdviceRequestDraftV2 {
  const source = input.source;
  assertText(source.ownerKey, 'source.ownerKey'); assertText(source.workspaceId, 'source.workspaceId');
  assertText(source.sourceReadingReference, 'source.sourceReadingReference'); assertText(source.preparedReference, 'source.preparedReference');
  assertText(source.requestDraftReference, 'source.requestDraftReference');
  const id = source.requestSnapshot.id;
  const body: DraftBody = { format: HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_FORMAT, id, ownerKey: source.ownerKey,
    workspaceId: source.workspaceId, sourceReadingReference: source.sourceReadingReference,
    preparedReference: source.preparedReference, requestSnapshot: structuredClone(source.requestSnapshot) };
  if (hopV55PropertyAdviceRequestDraftReference(body) !== source.requestDraftReference) {
    throw new Error('Le requestSnapshot sauvegardé ne correspond pas à sa référence de brouillon.');
  }
  const draft: HopV55PropertyAdviceRequestDraftV2 = { ...body, reference: source.requestDraftReference };
  if (draft.preparedReference !== hopV55PropertyAdvicePreparedReference(input.prepared, draft.requestSnapshot)) {
    throw new Error('Le contexte ou le périmètre préparé a changé; le requestSnapshot doit être réexaminé explicitement.');
  }
  assertSourceSpans(draft.requestSnapshot.originalQuestion, draft.requestSnapshot.propertyIntents);
  return structuredClone(draft);
}

export interface ReexamineHopV55PropertyAdviceRequestDraftInputV2 {
  draft: HopV55PropertyAdviceRequestDraftV2;
  /** A newly archived reading; only its verbatim question is consulted. */
  reading: HopV55QuestionReading;
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  sourceReadingReference: string;
  reexaminationContext: HopV55PropertyAdviceReexaminationInputV2;
}

function assertCurrentLinksRemainValid(previous: Pick<HopPropertyAdviceRequest, 'context' | 'propertyIntents'>,
  nextContext: HopPropertyAdviceRequest['context']): void {
  const previousAssertions = new Map(previous.context.assertions.map(assertion => [assertion.id, assertion]));
  const nextAssertions = new Map(nextContext.assertions.map(assertion => [assertion.id, assertion]));
  for (const intent of previous.propertyIntents) {
    if (intent.comparisonBasis.kind !== 'current') continue;
    for (const assertionId of intent.comparisonBasis.assertionIds) {
      const oldAssertion = previousAssertions.get(assertionId);
      const newAssertion = nextAssertions.get(assertionId);
      if (!oldAssertion || !newAssertion
        || hopAdviceContentReference('hop-property-advice-reexamination-assertion-v2', oldAssertion)
          !== hopAdviceContentReference('hop-property-advice-reexamination-assertion-v2', newAssertion)) {
        throw new Error(`Le lien de baseline ${assertionId} de l’intention ${intent.id} est périmé; corrige explicitement la base avant réexamen.`);
      }
    }
  }
}

function assertIntentMaterialBindings(request: Pick<HopPropertyAdviceRequest, 'candidatePolicy' | 'materials' | 'propertyIntents'>): void {
  const scope = new Set([...request.candidatePolicy.materialIds, ...request.materials.map(material => material.id)]);
  for (const intent of request.propertyIntents) {
    if (intent.subject.materialId && !scope.has(intent.subject.materialId)) {
      throw new Error(`Le sujet matière ${intent.subject.materialId} n’est plus chargé; corrige explicitement son lien avant réexamen.`);
    }
    if (intent.partner?.kind === 'material' && !scope.has(intent.partner.id)) {
      throw new Error(`Le partenaire matière ${intent.partner.id} n’est plus chargé; corrige explicitement son lien avant réexamen.`);
    }
  }
}

/** Starts a distinct source/context lineage from the saved property snapshot without reparsing it. */
export function reexamineHopV55PropertyAdviceRequestDraft(
  input: ReexamineHopV55PropertyAdviceRequestDraftInputV2,
): HopV55PropertyAdviceRequestDraftV2 {
  assertHopV55PropertyAdviceRequestDraftV2(input.draft);
  assertText(input.requestId, 'requestId'); assertText(input.sourceReadingReference, 'sourceReadingReference');
  checkRevisionMetadata(input.reexaminationContext);
  if (input.requestId === input.draft.id || input.sourceReadingReference === input.draft.sourceReadingReference) {
    throw new Error('Un réexamen exige un nouvel ID de demande et une nouvelle référence de lecture.');
  }
  const previous = input.draft.requestSnapshot;
  if (input.reading.intent.question !== previous.originalQuestion) {
    throw new Error('La nouvelle lecture ne conserve pas la question d’origine exacte; réconcilie explicitement ses intentions.');
  }
  const context = requestContext(input.prepared);
  assertCurrentLinksRemainValid(previous, context);
  const propertyIntents = structuredClone(previous.propertyIntents);
  const candidatePolicy = structuredClone(previous.candidatePolicy);
  const requestSnapshot: HopPropertyAdviceRequest = {
    ...structuredClone(previous),
    id: input.requestId,
    propertyIntents,
    candidatePolicy,
    context,
    materials: scopedMaterials(input.prepared, candidatePolicy, propertyIntents),
  };
  assertSourceSpans(requestSnapshot.originalQuestion, requestSnapshot.propertyIntents);
  assertIntentMaterialBindings(requestSnapshot);
  const reexaminationSource: HopV55PropertyAdviceReexaminationSourceV2 = {
    sourceRequestDraftReference: input.draft.reference,
    sourceReadingReference: input.draft.sourceReadingReference,
    preparedReference: input.draft.preparedReference,
    ...structuredClone(input.reexaminationContext),
  };
  return buildDraft({ id: input.requestId, ownerKey: input.draft.ownerKey, workspaceId: input.draft.workspaceId,
    sourceReadingReference: input.sourceReadingReference, requestSnapshot, prepared: input.prepared, reexaminationSource });
}

export interface ReconcileHopV55PropertyAdviceRequestDraftInputV2 {
  draft: HopV55PropertyAdviceRequestDraftV2;
  /** A new archived source, with the same verbatim question; no parser call occurs here. */
  reading: HopV55QuestionReading;
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  sourceReadingReference: string;
  /** Full brasseur-reviewed snapshot. Unchanged IDs/spans remain mandatory. */
  propertyIntents: readonly HopPropertyAdviceIntent[];
  candidatePolicy: HopPropertyAdviceCandidatePolicy;
  interpretation: HopPropertyAdviceRequest['interpretation'];
  reexaminationContext: HopV55PropertyAdviceReexaminationInputV2;
}

/** Explicitly reconciles selected V2 annotations against a new source/context. Ordinary revise/reexamine stay strict. */
export function reconcileHopV55PropertyAdviceRequestDraft(
  input: ReconcileHopV55PropertyAdviceRequestDraftInputV2,
): HopV55PropertyAdviceRequestDraftV2 {
  assertHopV55PropertyAdviceRequestDraftV2(input.draft);
  assertText(input.requestId, 'requestId'); assertText(input.sourceReadingReference, 'sourceReadingReference');
  if (input.requestId === input.draft.id || input.sourceReadingReference === input.draft.sourceReadingReference) {
    throw new Error('Une réconciliation exige un nouvel ID de demande et une nouvelle référence de lecture.');
  }
  const previous = input.draft.requestSnapshot;
  if (input.reading.intent.question !== previous.originalQuestion) {
    throw new Error('La nouvelle lecture ne conserve pas la question d’origine exacte; réconcilie explicitement les fragments.');
  }
  assertCandidatePolicy(input.candidatePolicy);
  assertInterpretation(input.interpretation);
  checkRevisionMetadata(input.reexaminationContext);
  if (input.interpretation.origin !== 'user' || input.reexaminationContext.recordedBy.origin !== 'user') {
    throw new Error('Une réconciliation de contexte exige une interprétation et un motif confirmés par le brasseur.');
  }
  assertAnnotationIdsPreserved(previous.propertyIntents, input.propertyIntents);
  assertSourceSpans(previous.originalQuestion, input.propertyIntents);
  const oldById = new Map(previous.propertyIntents.map(intent => [intent.id, intent]));
  for (const intent of input.propertyIntents) {
    const old = oldById.get(intent.id);
    if ((!old || hopAdviceContentReference('hop-property-advice-reconcile-intent-v2', old)
      !== hopAdviceContentReference('hop-property-advice-reconcile-intent-v2', intent))
      && intent.interpretationOrigin !== 'user') {
      throw new Error(`L’intention ${intent.id} modifiée pendant une réconciliation doit être explicitement confirmée par le brasseur.`);
    }
  }

  const context = requestContext(input.prepared);
  assertCurrentLinksRemainValid({ ...previous, propertyIntents: [...input.propertyIntents] }, context);
  const propertyIntents = [...structuredClone(input.propertyIntents)];
  const candidatePolicy = structuredClone(input.candidatePolicy);
  const requestSnapshot: HopPropertyAdviceRequest = {
    ...structuredClone(previous), id: input.requestId,
    interpretation: structuredClone(input.interpretation),
    propertyIntents, candidatePolicy, context,
    materials: scopedMaterials(input.prepared, candidatePolicy, propertyIntents),
  };
  assertIntentMaterialBindings(requestSnapshot);
  const reexaminationSource: HopV55PropertyAdviceReexaminationSourceV2 = {
    sourceRequestDraftReference: input.draft.reference,
    sourceReadingReference: input.draft.sourceReadingReference,
    preparedReference: input.draft.preparedReference,
    ...structuredClone(input.reexaminationContext),
  };
  return buildDraft({ id: input.requestId, ownerKey: input.draft.ownerKey, workspaceId: input.draft.workspaceId,
    sourceReadingReference: input.sourceReadingReference, requestSnapshot, prepared: input.prepared, reexaminationSource });
}

// Small read/validation primitives shared with the additive V3 adapter. These
// do not convert either request format and never invoke a domain builder.
export {
  assertCandidatePolicy as assertHopV55PropertyAdviceCandidatePolicy,
  assertAnnotationIdsPreserved as assertHopV55PropertyAdviceAnnotationIdsPreserved,
  assertCurrentLinksRemainValid as assertHopV55PropertyAdviceCurrentLinksRemainValid,
  assertIntentMaterialBindings as assertHopV55PropertyAdviceIntentMaterialBindings,
  assertSourceSpans as assertHopV55PropertyAdviceSourceSpans,
  checkAccessUpdates as assertHopV55PropertyAdviceAccessUpdates,
  checkRevisionMetadata as assertHopV55PropertyAdviceRevisionMetadata,
  isCompensationAnnotation as isHopV55PropertyAdviceCompensationAnnotation,
  mapReading as mapHopV55PropertyAdviceIntents,
  requestContext as buildHopV55PropertyAdviceRequestContext,
  scopedMaterials as scopeHopV55PropertyAdviceMaterials,
  // Context-binding helpers reused by the semantic adapter; they never decide a role from wording.
  currentAssertionIds as hopV55PropertyAdviceCurrentAssertionIds,
  materialsMentionedNearSpan as hopV55PropertyAdviceMaterialsNearSpan,
  materialsNamedInSpan as hopV55PropertyAdviceMaterialsNamedInSpan,
  materialSubjectLabel as hopV55PropertyAdviceMaterialSubjectLabel,
  metricForTerm as hopV55PropertyAdviceMetricForTerm,
};

