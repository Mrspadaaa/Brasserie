import type { HopAdviceAssertion, HopAdviceDimension } from '../../domain/hopDecision/adviceSchema';
import { buildHopDocumentaryAnswer } from '../../domain/hopDecision/documentaryAnswer';
import { getHopDocumentaryCorpus } from '../../domain/hopDecision/documentaryEvidence';
import {
  assertHopDocumentaryAnswer,
  assertHopDocumentaryDossier,
  assertHopDocumentaryRequest,
  createHopDocumentaryDossier,
  readHopDocumentaryAnswer,
  readHopDocumentaryDossier,
  type HopDocumentaryAnswer,
  type HopDocumentaryDossier,
  type HopDocumentaryRequest,
} from '../../domain/hopDecision/documentaryAnswerSchema';
import type { HopIntentEvidenceCriterion } from '../../domain/hopDecision/intentEvidence';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { BrewingScenarioBeerFact } from '../../domain/brewingScenario';
import type { HopV55QuestionReading } from './decision';

const REQUEST_DRAFT_FORMAT = 'hop-v55-documentary-request-draft-v1' as const;
const ANSWER_RECORD_FORMAT = 'hop-v55-documentary-answer-record-v1' as const;
const DOSSIER_RECORD_FORMAT = 'hop-v55-documentary-dossier-record-v1' as const;

export interface HopV55DocumentaryRequestDraftV1 {
  format: typeof REQUEST_DRAFT_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  /** Fingerprint of the prepared facts and candidate identities; stale builds are refused. */
  preparedReference: string;
  request: HopDocumentaryRequest;
  reference: string;
}

export interface HopV55DocumentaryAnswerRecordV1 {
  format: typeof ANSWER_RECORD_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  requestDraftReference: string;
  preparedReference: string;
  answerSnapshot: HopDocumentaryAnswer;
  answerReference: string;
  /** User-facing reinterpretation lineage; never part of the documentary request or physical assertions. */
  revisionContext?: HopV55DocumentaryRevisionContextV1;
  reference: string;
}

export interface HopV55DocumentaryRevisionContextV1 {
  sourceAnswerRecordReference: string;
  sourceAnswerReference: string;
  reason: string;
  recordedAt: string;
  recordedBy: HopDocumentaryDossier['createdBy'];
}

export interface HopV55DocumentaryDossierRecordV1 {
  format: typeof DOSSIER_RECORD_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  answerRecordReference: string;
  answerReference: string;
  dossierSnapshot: HopDocumentaryDossier;
  dossierReference: string;
  reference: string;
}

export type HopV55DocumentaryRecordRead<T> =
  | { status: 'readOnly'; record: T }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export interface HopV55DocumentaryRequestOverrides {
  interpretation?: HopDocumentaryRequest['interpretation'];
  needs?: HopDocumentaryRequest['needs'];
  exclusions?: HopDocumentaryRequest['exclusions'];
  /** Extra human-declared facts can support explicit access choices; they never overwrite prepared assertions. */
  assertions?: HopAdviceAssertion[];
  access?: Partial<HopDocumentaryRequest['context']['access']>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function jsonSafeClone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(row => jsonSafeClone(row)) as T;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => [key, jsonSafeClone(child)] as const);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

function assertText(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} est requis.`);
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[], name: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error(`${name} contient un champ non pris en charge.`);
}

function assertRevisionContext(value: unknown): asserts value is HopV55DocumentaryRevisionContextV1 {
  if (!isRecord(value)) throw new Error('revisionContext doit être un objet.');
  onlyKeys(value, ['sourceAnswerRecordReference', 'sourceAnswerReference', 'reason', 'recordedAt', 'recordedBy'], 'revisionContext');
  assertText(value.sourceAnswerRecordReference, 'revisionContext.sourceAnswerRecordReference');
  assertText(value.sourceAnswerReference, 'revisionContext.sourceAnswerReference');
  assertText(value.reason, 'revisionContext.reason');
  if (typeof value.recordedAt !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value.recordedAt)
    || !Number.isFinite(Date.parse(value.recordedAt))) {
    throw new Error('revisionContext.recordedAt doit être un instant ISO explicite.');
  }
  if (!isRecord(value.recordedBy)) throw new Error('revisionContext.recordedBy est requis.');
  onlyKeys(value.recordedBy, ['origin', 'label'], 'revisionContext.recordedBy');
  if (!['user', 'proposal', 'fixture'].includes(String(value.recordedBy.origin))) throw new Error('revisionContext.recordedBy.origin invalide.');
  assertText(value.recordedBy.label, 'revisionContext.recordedBy.label');
}

function canonicalReference(kind: string, value: unknown): string {
  return hopAdviceContentReference(`hop-v55-documentary-${kind}-v1`, value);
}

function preparedReference(prepared: PreparedBrewingScenarioContext): string {
  return canonicalReference('prepared', {
    current: jsonSafeClone(prepared.runtime.current ?? null),
    materials: jsonSafeClone(prepared.runtime.materials),
  });
}

function assertionDimension(field: string): HopAdviceDimension | undefined {
  const key = field.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  if (/\b(?:ph|acid|acidite|acidul|sour)\b/u.test(key)) return 'acidity';
  if (/\b(?:abv|alcohol|alcool|ethanol)\b/u.test(key)) return 'alcohol';
  if (/\b(?:biotransform|thiol|yeast|levure|culture)\b/u.test(key)) return 'bioInteraction';
  if (/\b(?:hop.?creep|dextrin)\b/u.test(key)) return 'hopCreep';
  if (/\b(?:transfer|retention|loss|perte|transfert|matrice)\b/u.test(key)) return 'matrixTransfer';
  if (/\b(?:ibu|bitterness|amertume)\b/u.test(key)) return 'other';
  if (/\b(?:stock|available|availability|disponible)\b/u.test(key)) return 'stock';
  if (/\b(?:analysis|analyse|measurement|mesure|alpha|oil|huile)\b/u.test(key)) return 'documentation';
  if (/\b(?:stage|use|emploi|dose|contact|temperature|temps|program|programme)\b/u.test(key)) return 'process';
  return undefined;
}

function beerFactState(fact: BrewingScenarioBeerFact): HopAdviceAssertion['state'] {
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
    const members = current.culture.members.map(member => [
      member.yeastId ?? member.name ?? 'Identité non résolue',
      ...(member.proportion ? [`proportion ${member.proportion.min}–${member.proportion.max}`] : []),
    ].join(' · '));
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
    state: beerFactState(fact), value: fact.value ?? null,
    ...(fact.unit ? { unit: fact.unit } : {}), ...(assertionDimension(fact.field) ? { dimension: assertionDimension(fact.field) } : {}),
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

function normalize(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

function stableNeedId(kind: HopDocumentaryRequest['needs'][number]['kind'], criterionIds: string[], requestId: string): string {
  return `need-${kind}-${canonicalReference('need-id', { kind, criterionIds, requestId }).slice(-20)}`;
}

function criterionText(criterion: HopIntentEvidenceCriterion, drafts: Map<string, HopV55QuestionReading['criterionDrafts'][number]>): string {
  const draft = drafts.get(criterion.id);
  const source = draft?.source.text;
  return source ? `${criterion.description} (fragment exact: « ${source} »; rôle ${criterion.role})`
    : `${criterion.description} (rôle ${criterion.role})`;
}

function proposeNeeds(input: {
  requestId: string;
  criteria: HopIntentEvidenceCriterion[];
  drafts: Map<string, HopV55QuestionReading['criterionDrafts'][number]>;
  explicitNolo: boolean;
  pairings?: Array<{ sourceCriterionId: string; relationCriterionId: string }>;
}): HopDocumentaryRequest['needs'] {
  const groups = new Map<HopDocumentaryRequest['needs'][number]['kind'], HopIntentEvidenceCriterion[]>([
    ['balancePerceivedSweetness', []], ['aromaPairing', []], ['lowAlcoholCharacter', []], ['unresolved', []],
  ]);
  const recognized = new Set<string>();
  for (const pairing of input.pairings ?? []) {
    const source = input.criteria.find(criterion => criterion.id === pairing.sourceCriterionId);
    const relation = input.criteria.find(criterion => criterion.id === pairing.relationCriterionId);
    if (!source || !relation) continue;
    groups.get('aromaPairing')!.push(source, relation);
    recognized.add(source.id); recognized.add(relation.id);
  }
  for (const criterion of input.criteria) {
    const draft = input.drafts.get(criterion.id);
    const text = normalize(`${criterion.description} ${draft?.term ?? ''} ${draft?.qualification ?? ''}`);
    if (/\b(?:sucre|sucree|sucrosite|sweet|sweetness)\b/u.test(text)) {
      groups.get('balancePerceivedSweetness')!.push(criterion); recognized.add(criterion.id);
    }
    if (criterion.role === 'pairWith' && criterion.partner && !recognized.has(criterion.id)) {
      groups.get('aromaPairing')!.push(criterion); recognized.add(criterion.id);
    }
    if (input.explicitNolo && draft?.dimension === 'bioInteraction') {
      groups.get('lowAlcoholCharacter')!.push(criterion); recognized.add(criterion.id);
    }
    if (/\b(?:faible alcool|low alcohol|low abv|sans alcool|alcohol free|abv)\b/u.test(text)) {
      groups.get('lowAlcoholCharacter')!.push(criterion); recognized.add(criterion.id);
    }
  }
  const contextualLowAlcoholProposal = input.explicitNolo && groups.get('lowAlcoholCharacter')!.length === 0;
  for (const criterion of input.criteria) if (!recognized.has(criterion.id)) groups.get('unresolved')!.push(criterion);

  const needs: HopDocumentaryRequest['needs'] = [];
  for (const [kind, rows] of groups) {
    if (!rows.length && !(kind === 'unresolved' && input.criteria.length === 0 && !input.explicitNolo)
      && !(kind === 'lowAlcoholCharacter' && contextualLowAlcoholProposal)) continue;
    const criterionIds = [...new Set(rows.map(row => row.id))];
    const details = rows.map(row => criterionText(row, input.drafts));
    const explanation = kind === 'lowAlcoholCharacter' && contextualLowAlcoholProposal && !rows.length
      ? 'Proposition contextuelle: le domaine aromatique nolo est explicitement transmis; confirmer ou retirer ce besoin, sans en déduire une cible sensorielle.'
      : kind === 'unresolved' && rows.length === 0
        ? 'Aucun besoin de la synthèse n’est établi par la lecture structurée; conserver la question et préciser ce qui doit être examiné.'
        : `Proposition depuis les critères et fragments conservés: ${details.join(' ; ')}.`;
    needs.push({ id: stableNeedId(kind, criterionIds, input.requestId), kind, criterionIds, explanation,
      ...(kind === 'aromaPairing' ? { candidateIds: [] } : {}) });
  }
  if (!needs.length) needs.push({ id: stableNeedId('unresolved', [], input.requestId), kind: 'unresolved', criterionIds: [],
    explanation: 'Aucun besoin de la synthèse n’est établi par la lecture structurée; conserver la question et préciser ce qui doit être examiné.' });
  return needs;
}

function documentCriteria(reading: HopV55QuestionReading): HopIntentEvidenceCriterion[] {
  const response = reading.response;
  if (!response) throw new Error('La lecture ne contient pas de réponse structurée à transmettre au service documentaire.');
  if (response.intent.originalQuestion !== reading.intent.question) throw new Error('La réponse et la question originale ne correspondent pas.');
  const criteria = structuredClone(response.intent.criteria ?? []);
  const publicIds = reading.intent.criteria.map(row => row.id);
  const domainIds = criteria.map(row => row.id);
  if (new Set(domainIds).size !== domainIds.length || JSON.stringify([...publicIds].sort()) !== JSON.stringify([...domainIds].sort())) {
    throw new Error('Les critères de la lecture et ceux transmis à la réponse ne correspondent pas.');
  }
  const drafts = reading.criterionDrafts ?? [];
  for (const draft of drafts) {
    if (!Number.isSafeInteger(draft.source.start) || !Number.isSafeInteger(draft.source.end)
      || draft.source.start < 0 || draft.source.end < draft.source.start
      || reading.intent.question.slice(draft.source.start, draft.source.end) !== draft.source.text) {
      throw new Error('Un fragment de lecture ne correspond plus à la question originale.');
    }
  }
  return criteria;
}

function proposeExplicitPairings(reading: HopV55QuestionReading, requestId: string): {
  criteria: HopIntentEvidenceCriterion[];
  links: Array<{ sourceCriterionId: string; relationCriterionId: string }>;
} {
  const question = reading.intent.question;
  const responseCriteria = reading.response?.intent.criteria ?? [];
  const proposals: HopIntentEvidenceCriterion[] = [];
  const links: Array<{ sourceCriterionId: string; relationCriterionId: string }> = [];
  const relationPattern = /\b(?:se\s+marie(?:\s+bien)?\s+avec|s[’']accorde\s+avec|s[’']associe\s+avec|se\s+combine\s+avec|pairs?\s+(?:well\s+)?with|goes?\s+well\s+with)\b/giu;

  for (const match of question.matchAll(relationPattern)) {
    const relationStart = match.index ?? -1;
    const relationEnd = relationStart + match[0].length;
    const left = [...reading.criterionDrafts]
      .filter(row => row.source.end <= relationStart && row.familyId && row.requirement === 'required'
        && (row.direction === 'increase' || row.direction === 'keep'))
      .sort((a, b) => b.source.end - a.source.end)[0];
    const sourceCriterion = left && responseCriteria.find(row => row.id === left.id && row.familyId === left.familyId);
    const right = reading.criterionDrafts
      .filter(row => row.source.start >= relationEnd && row.requirement === 'optional' && row.direction === null
        && /préférence de partenaire|note de contexte/i.test(row.qualification ?? ''))
      .sort((a, b) => a.source.start - b.source.start)[0];
    if (!left || !sourceCriterion || !right) continue;

    const partnerText = question.slice(relationEnd, right.source.end).trim();
    if (!partnerText) continue;
    const id = 'criterion-pair-proposal-' + canonicalReference('pairing-proposal', {
      requestId, question, sourceCriterionId: sourceCriterion.id, sourceSpan: left.source,
      relationSpan: { start: relationStart, end: relationEnd, text: match[0] }, partnerSpan: right.source,
    }).slice(-20);
    proposals.push({
      id,
      description: question.slice(left.source.start, right.source.end).trim(),
      role: 'pairWith', origin: 'proposal', familyId: left.familyId,
      partner: { kind: 'freeContext', text: partnerText },
    });
    links.push({ sourceCriterionId: sourceCriterion.id, relationCriterionId: id });
  }
  return { criteria: proposals, links };
}

function accessUnknown(basis: string): HopDocumentaryRequest['context']['access'] {
  const unknown = () => ({ state: 'unknown' as const, basis, assertionIds: [] as string[] });
  return { bulkBeer: unknown(), sampling: unknown(), separatePortion: unknown() };
}

function keepPairingCandidatesExplicit(needs: HopDocumentaryRequest['needs']): HopDocumentaryRequest['needs'] {
  return needs.map(need => need.kind === 'aromaPairing' && need.candidateIds === undefined
    ? { ...need, candidateIds: [] }
    : need);
}

function requestDraftReference(draft: Omit<HopV55DocumentaryRequestDraftV1, 'reference'> | HopV55DocumentaryRequestDraftV1): string {
  const { reference: _reference, ...body } = draft as HopV55DocumentaryRequestDraftV1;
  return canonicalReference('request-draft', body);
}

function answerRecordReference(record: Omit<HopV55DocumentaryAnswerRecordV1, 'reference'> | HopV55DocumentaryAnswerRecordV1): string {
  const { reference: _reference, ...body } = record as HopV55DocumentaryAnswerRecordV1;
  return canonicalReference('answer-record', body);
}

function dossierRecordReference(record: Omit<HopV55DocumentaryDossierRecordV1, 'reference'> | HopV55DocumentaryDossierRecordV1): string {
  const { reference: _reference, ...body } = record as HopV55DocumentaryDossierRecordV1;
  return canonicalReference('dossier-record', body);
}

function assertRequestDraft(draft: HopV55DocumentaryRequestDraftV1): void {
  if (draft.format !== REQUEST_DRAFT_FORMAT) throw new Error('Format de demande documentaire non pris en charge.');
  assertText(draft.id, 'requestId'); assertText(draft.ownerKey, 'ownerKey'); assertText(draft.workspaceId, 'workspaceId');
  assertText(draft.sourceReadingReference, 'sourceReadingReference'); assertText(draft.preparedReference, 'preparedReference');
  assertHopDocumentaryRequest(draft.request);
  if (requestDraftReference(draft) !== draft.reference) throw new Error('Le brouillon documentaire a changé; il doit être révisé à nouveau.');
}

function assertAnswerRecord(record: HopV55DocumentaryAnswerRecordV1): void {
  if (record.format !== ANSWER_RECORD_FORMAT) throw new Error('Format de réponse documentaire non pris en charge.');
  onlyKeys(record as unknown as Record<string, unknown>, ['format', 'id', 'ownerKey', 'workspaceId', 'sourceReadingReference',
    'requestDraftReference', 'preparedReference', 'answerSnapshot', 'answerReference', 'revisionContext', 'reference'], 'Answer record');
  assertText(record.id, 'answerRecordId'); assertText(record.ownerKey, 'ownerKey'); assertText(record.workspaceId, 'workspaceId');
  assertText(record.sourceReadingReference, 'sourceReadingReference'); assertText(record.requestDraftReference, 'requestDraftReference');
  assertText(record.preparedReference, 'preparedReference'); assertHopDocumentaryAnswer(record.answerSnapshot);
  if (record.revisionContext !== undefined) assertRevisionContext(record.revisionContext);
  if (record.answerReference !== record.answerSnapshot.reference || answerRecordReference(record) !== record.reference) {
    throw new Error('La réponse documentaire ou son envelope a été altéré.');
  }
}

function assertDossierRecord(record: HopV55DocumentaryDossierRecordV1): void {
  if (record.format !== DOSSIER_RECORD_FORMAT) throw new Error('Format de dossier documentaire non pris en charge.');
  assertText(record.id, 'dossierRecordId'); assertText(record.ownerKey, 'ownerKey'); assertText(record.workspaceId, 'workspaceId');
  assertText(record.sourceReadingReference, 'sourceReadingReference'); assertText(record.answerRecordReference, 'answerRecordReference');
  assertText(record.answerReference, 'answerReference'); assertHopDocumentaryDossier(record.dossierSnapshot);
  if (record.dossierReference !== record.dossierSnapshot.reference
    || record.answerReference !== record.dossierSnapshot.answerReference
    || dossierRecordReference(record) !== record.reference) throw new Error('Le dossier ou son envelope a été altéré.');
}

/** Rehydrates the editable request envelope from a stored answer without reparsing or rebuilding it. */
export function resumeHopV55DocumentaryRequestDraft(answerRecord: HopV55DocumentaryAnswerRecordV1): HopV55DocumentaryRequestDraftV1 {
  assertAnswerRecord(answerRecord);
  const draftBody: Omit<HopV55DocumentaryRequestDraftV1, 'reference'> = {
    format: REQUEST_DRAFT_FORMAT, id: answerRecord.answerSnapshot.requestSnapshot.id,
    ownerKey: answerRecord.ownerKey, workspaceId: answerRecord.workspaceId,
    sourceReadingReference: answerRecord.sourceReadingReference, preparedReference: answerRecord.preparedReference,
    request: structuredClone(answerRecord.answerSnapshot.requestSnapshot),
  };
  const draft = { ...draftBody, reference: requestDraftReference(draftBody) };
  if (draft.reference !== answerRecord.requestDraftReference) throw new Error('La requête archivée ne correspond plus à son brouillon source.');
  return draft;
}

/** Proposes a typed documentary request from the archived reading and exact Prepared runtime. */
export function prepareHopV55DocumentaryRequest(input: {
  reading: HopV55QuestionReading;
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  overrides?: HopV55DocumentaryRequestOverrides;
}): HopV55DocumentaryRequestDraftV1 {
  assertText(input.requestId, 'requestId'); assertText(input.ownerKey, 'ownerKey'); assertText(input.workspaceId, 'workspaceId');
  assertText(input.sourceReadingReference, 'sourceReadingReference');
  const criteria = documentCriteria(input.reading);
  const pairingProposals = proposeExplicitPairings(input.reading, input.requestId);
  const requestCriteria = [...criteria, ...pairingProposals.criteria];
  const drafts = new Map((input.reading.criterionDrafts ?? []).map(row => [row.id, row]));
  const current = input.prepared.runtime.current;
  const baseAssertions = preparedAssertions(input.prepared);
  const explicitNolo = current?.input.aromaDomain === 'nolo';
  const request: HopDocumentaryRequest = {
    format: 'hop-documentary-request-v1', id: input.requestId,
    originalQuestion: input.reading.intent.question,
    interpretation: structuredClone(input.overrides?.interpretation ?? {
      id: `interpretation-${input.requestId}`, version: 'hop-v55-documentary-reading-v1', text: input.reading.interpretation,
      origin: input.reading.correction || input.reading.criterionDrafts?.some(row => row.origin === 'brasseur') ? 'user' : 'proposal',
    }),
    criteria: requestCriteria,
    needs: keepPairingCandidatesExplicit(jsonSafeClone(input.overrides?.needs
      ?? proposeNeeds({ requestId: input.requestId, criteria: requestCriteria, drafts, explicitNolo, pairings: pairingProposals.links }))),
    context: {
      stage: current?.program?.stage ?? 'unknown',
      stageBasis: current?.program
        ? 'Stade exact du programme lié au contexte préparé; aucun stade ne vient du champ phase ou du nom de recette.'
        : 'Aucun stade de programme physique lié dans le contexte préparé; le stade reste unknown.',
      assertions: [...baseAssertions, ...jsonSafeClone(input.overrides?.assertions ?? [])],
      access: { ...accessUnknown('Accès non déclaré; il n’est pas déduit du stade, de la recette ou du programme.'),
        ...jsonSafeClone(input.overrides?.access ?? {}) },
    },
    exclusions: jsonSafeClone(input.overrides?.exclusions ?? []),
    materials: jsonSafeClone(input.prepared.runtime.materials),
  };
  const serializableRequest = jsonSafeClone(request);
  assertHopDocumentaryRequest(serializableRequest);
  const draftBody: Omit<HopV55DocumentaryRequestDraftV1, 'reference'> = {
    format: REQUEST_DRAFT_FORMAT, id: request.id, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: input.sourceReadingReference, preparedReference: preparedReference(input.prepared), request: serializableRequest,
  };
  return { ...draftBody, reference: requestDraftReference(draftBody) };
}

/** Applies only explicit request edits; question, criteria, current materials and captured stage remain exact. */
export function reviseHopV55DocumentaryRequest(input: {
  draft: HopV55DocumentaryRequestDraftV1;
  request: HopDocumentaryRequest;
}): HopV55DocumentaryRequestDraftV1 {
  assertRequestDraft(input.draft);
  const request = jsonSafeClone(input.request);
  request.needs = keepPairingCandidatesExplicit(request.needs);
  assertHopDocumentaryRequest(request);
  const { request: previous } = input.draft;
  if (request.id !== previous.id || request.originalQuestion !== previous.originalQuestion
    || JSON.stringify(request.criteria) !== JSON.stringify(previous.criteria)
    || JSON.stringify(request.materials) !== JSON.stringify(previous.materials)
    || request.context.stage !== previous.context.stage || request.context.stageBasis !== previous.context.stageBasis) {
    throw new Error('La révision peut corriger lecture, besoins, accès et exclusions, mais conserve la question, les critères, les candidats chargés et le stade source.');
  }
  const appendedAssertions = request.context.assertions.filter(row => !previous.context.assertions.some(prior => prior.id === row.id));
  const unchangedPreparedAssertions = previous.context.assertions.every(prior => {
    const candidate = request.context.assertions.find(row => row.id === prior.id);
    return candidate && JSON.stringify(candidate) === JSON.stringify(prior);
  });
  if (!unchangedPreparedAssertions || appendedAssertions.some(row => previous.context.assertions.some(prior => prior.id === row.id))) {
    throw new Error('Les assertions préparées restent intactes; une correction ajoute un nouvel ID d’assertion.');
  }
  const draftBody: Omit<HopV55DocumentaryRequestDraftV1, 'reference'> = { ...structuredClone(input.draft), request };
  return { ...draftBody, reference: requestDraftReference(draftBody) };
}

/** Builds one canonical documentary answer and a workspace envelope; it never runs an operational adapter. */
export function buildHopV55DocumentaryAnswerRecord(input: {
  draft: HopV55DocumentaryRequestDraftV1;
  prepared: PreparedBrewingScenarioContext;
  answerRecordId: string;
  corpus?: Parameters<typeof buildHopDocumentaryAnswer>[1];
  revisionContext?: HopV55DocumentaryRevisionContextV1;
}): HopV55DocumentaryAnswerRecordV1 {
  assertRequestDraft(input.draft); assertText(input.answerRecordId, 'answerRecordId');
  if (input.revisionContext !== undefined) assertRevisionContext(input.revisionContext);
  if (preparedReference(input.prepared) !== input.draft.preparedReference) {
    throw new Error('Le contexte préparé a changé; réinterprète la demande avant de calculer une nouvelle réponse.');
  }
  if (canonicalReference('materials', jsonSafeClone(input.prepared.runtime.materials))
    !== canonicalReference('materials', input.draft.request.materials)) {
    throw new Error('Les candidats documentaires ne correspondent plus aux matières exactes du runtime.');
  }
  const corpus = input.corpus ?? getHopDocumentaryCorpus();
  const answer = buildHopDocumentaryAnswer(input.draft.request, corpus);
  const recordBody: Omit<HopV55DocumentaryAnswerRecordV1, 'reference'> = {
    format: ANSWER_RECORD_FORMAT, id: input.answerRecordId, ownerKey: input.draft.ownerKey, workspaceId: input.draft.workspaceId,
    sourceReadingReference: input.draft.sourceReadingReference, requestDraftReference: input.draft.reference,
    preparedReference: input.draft.preparedReference, answerSnapshot: answer, answerReference: answer.reference,
    ...(input.revisionContext ? { revisionContext: jsonSafeClone(input.revisionContext) } : {}),
  };
  return { ...recordBody, reference: answerRecordReference(recordBody) };
}

/** Creates an immutable workspace link around the domain dossier after all exact references are checked. */
export function createHopV55DocumentaryDossierRecord(input: {
  answerRecord: HopV55DocumentaryAnswerRecordV1;
  dossierId: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  routeId: string;
  expectedRouteReference: string;
  motive: string;
  createdAt: string;
  createdBy: HopDocumentaryDossier['createdBy'];
}): HopV55DocumentaryDossierRecordV1 {
  assertAnswerRecord(input.answerRecord); assertText(input.dossierId, 'dossierId');
  const dossier = createHopDocumentaryDossier({ id: input.dossierId, answer: input.answerRecord.answerSnapshot,
    expectedAnswerReference: input.expectedAnswerReference, expectedInterpretationReference: input.expectedInterpretationReference,
    routeId: input.routeId, expectedRouteReference: input.expectedRouteReference, motive: input.motive,
    createdAt: input.createdAt, createdBy: input.createdBy });
  const recordBody: Omit<HopV55DocumentaryDossierRecordV1, 'reference'> = {
    format: DOSSIER_RECORD_FORMAT, id: input.dossierId, ownerKey: input.answerRecord.ownerKey,
    workspaceId: input.answerRecord.workspaceId, sourceReadingReference: input.answerRecord.sourceReadingReference,
    answerRecordReference: input.answerRecord.reference, answerReference: input.answerRecord.answerReference,
    dossierSnapshot: dossier, dossierReference: dossier.reference,
  };
  return { ...recordBody, reference: dossierRecordReference(recordBody) };
}

export function readHopV55DocumentaryAnswerRecord(value: unknown): HopV55DocumentaryRecordRead<HopV55DocumentaryAnswerRecordV1> {
  if (isRecord(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-documentary-answer-record-')
    && value.format !== ANSWER_RECORD_FORMAT) return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format futur conservé sans recalcul.' };
  if (!isRecord(value) || value.format !== ANSWER_RECORD_FORMAT) throw new Error('Record de réponse documentaire invalide.');
  const nested = readHopDocumentaryAnswer(value.answerSnapshot);
  if (nested.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: nested.reason };
  assertAnswerRecord(value as unknown as HopV55DocumentaryAnswerRecordV1);
  return { status: 'readOnly', record: structuredClone(value) as unknown as HopV55DocumentaryAnswerRecordV1 };
}

export function readHopV55DocumentaryDossierRecord(value: unknown): HopV55DocumentaryRecordRead<HopV55DocumentaryDossierRecordV1> {
  if (isRecord(value) && typeof value.format === 'string' && value.format.startsWith('hop-v55-documentary-dossier-record-')
    && value.format !== DOSSIER_RECORD_FORMAT) return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format futur conservé sans recalcul.' };
  if (!isRecord(value) || value.format !== DOSSIER_RECORD_FORMAT) throw new Error('Record de dossier documentaire invalide.');
  const nested = readHopDocumentaryDossier(value.dossierSnapshot);
  if (nested.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: nested.reason };
  assertDossierRecord(value as unknown as HopV55DocumentaryDossierRecordV1);
  return { status: 'readOnly', record: structuredClone(value) as unknown as HopV55DocumentaryDossierRecordV1 };
}

