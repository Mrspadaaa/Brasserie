import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import {
  assertHopPropertyAdviceRequestV3,
  type HopPropertyAdviceIntent,
  type HopPropertyAdviceIntentV3,
  type HopPropertyAdviceRequest,
  type HopPropertyAdviceRequestV3,
} from '../../domain/hopDecision/propertyAdviceSchema';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55QuestionReading } from './decision';
import {
  HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_FORMAT,
  assertHopV55PropertyAdviceRequestDraftV2,
  assertHopV55PropertyAdviceCandidatePolicy,
  assertHopV55PropertyAdviceAnnotationIdsPreserved,
  assertHopV55PropertyAdviceCurrentLinksRemainValid,
  assertHopV55PropertyAdviceIntentMaterialBindings,
  assertHopV55PropertyAdviceSourceSpans,
  assertHopV55PropertyAdviceAccessUpdates,
  assertHopV55PropertyAdviceRevisionMetadata,
  buildHopV55PropertyAdviceInterpretation,
  hopV55PropertyAdvicePreparedContent,
  hopV55PropertyAdvicePreparedReference,
  hopV55PropertyAdviceRequestDraftReference,
  isHopV55PropertyAdviceCompensationAnnotation,
  mapHopV55PropertyAdviceIntents,
  buildHopV55PropertyAdviceRequestContext,
  scopeHopV55PropertyAdviceMaterials,
  type HopV55PropertyAdviceAccessUpdateV2,
  type HopV55PropertyAdviceRecordReexaminationContextV2,
  type HopV55PropertyAdviceReexaminationInputV2,
  type HopV55PropertyAdviceReexaminationSourceV2,
  type HopV55PropertyAdviceRequestDraftV2,
  type HopV55PropertyAdviceRequestSnapshotSourceV2,
  type HopV55PropertyAdviceRevisionInputV2,
  type HopV55PropertyAdviceRevisionMetadataV2,
} from './propertyAdvicePreparation';

export const HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_V3_FORMAT = 'hop-v55-property-advice-request-draft-v3' as const;

/** V3 keeps the same envelope metadata shape while its body has a V3 request/hash. */
export type HopV55PropertyAdviceRevisionMetadataV3 = HopV55PropertyAdviceRevisionMetadataV2;
export type HopV55PropertyAdviceReexaminationSourceV3 = HopV55PropertyAdviceReexaminationSourceV2;
export type HopV55PropertyAdviceRecordReexaminationContextV3 = HopV55PropertyAdviceRecordReexaminationContextV2;
export type HopV55PropertyAdviceReexaminationInputV3 = HopV55PropertyAdviceReexaminationInputV2;
export type HopV55PropertyAdviceRevisionInputV3 = HopV55PropertyAdviceRevisionInputV2;
export type HopV55PropertyAdviceAccessUpdateV3 = HopV55PropertyAdviceAccessUpdateV2;

export interface HopV55PropertyAdviceRequestDraftV3 {
  format: typeof HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_V3_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparedReference: string;
  requestSnapshot: HopPropertyAdviceRequestV3;
  reference: string;
  /** Ephemeral handoff metadata; excluded from the complete V3 body reference. */
  revisionContext?: HopV55PropertyAdviceRevisionMetadataV3;
  /** Ephemeral source lineage; record reexaminationContext is stored separately. */
  reexaminationSource?: HopV55PropertyAdviceReexaminationSourceV3;
}

export interface HopV55PropertyAdviceRequestSnapshotSourceV3 {
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparedReference: string;
  requestDraftReference: string;
  requestSnapshot: HopPropertyAdviceRequestV3;
  reexaminationContext?: HopV55PropertyAdviceRecordReexaminationContextV3;
}

type DraftBodyV3 = Omit<HopV55PropertyAdviceRequestDraftV3, 'reference' | 'revisionContext' | 'reexaminationSource'>;
type SummaryInterpretation = HopPropertyAdviceRequest['interpretation'];

function assertText(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} est requis.`);
}

function assertInterpretation(value: SummaryInterpretation): void {
  assertText(value.id, 'interpretation.id'); assertText(value.version, 'interpretation.version'); assertText(value.text, 'interpretation.text');
  if (!['user', 'proposal'].includes(value.origin)) throw new Error('interpretation.origin doit rester user ou proposal.');
}

function requestDraftBodyV3(draft: HopV55PropertyAdviceRequestDraftV3 | DraftBodyV3): DraftBodyV3 {
  const { reference: _reference, revisionContext: _revisionContext, reexaminationSource: _reexaminationSource, ...body } =
    draft as HopV55PropertyAdviceRequestDraftV3;
  return body;
}

export function hopV55PropertyAdviceRequestDraftReferenceV3(
  draft: HopV55PropertyAdviceRequestDraftV3 | DraftBodyV3,
): string {
  return hopAdviceContentReference('hop-v55-property-advice-request-draft-v3', requestDraftBodyV3(draft));
}

export function hopV55PropertyAdvicePreparedReferenceV3(
  prepared: PreparedBrewingScenarioContext,
  request: Pick<HopPropertyAdviceRequestV3, 'candidatePolicy' | 'propertyIntents' | 'materials'>,
): string {
  return hopAdviceContentReference('hop-v55-property-advice-prepared-v3', {
    requestFormat: 'hop-documentary-request-v3',
    prepared: hopV55PropertyAdvicePreparedContent(prepared, request),
  });
}

export function assertHopV55PropertyAdviceRequestDraftV3(value: unknown): asserts value is HopV55PropertyAdviceRequestDraftV3 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Brouillon V3 de conseil par propriété illisible.');
  const draft = value as HopV55PropertyAdviceRequestDraftV3;
  if (draft.format !== HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_V3_FORMAT) throw new Error('Format de brouillon V3 inconnu.');
  assertText(draft.id, 'draftV3.id'); assertText(draft.ownerKey, 'draftV3.ownerKey'); assertText(draft.workspaceId, 'draftV3.workspaceId');
  assertText(draft.sourceReadingReference, 'draftV3.sourceReadingReference'); assertText(draft.preparedReference, 'draftV3.preparedReference');
  assertText(draft.reference, 'draftV3.reference');
  if (!draft.requestSnapshot || draft.requestSnapshot.format !== 'hop-documentary-request-v3'
    || draft.requestSnapshot.id !== draft.id || typeof draft.requestSnapshot.originalQuestion !== 'string'
    || !draft.requestSnapshot.originalQuestion.trim()) {
    throw new Error('Le brouillon doit conserver son requestSnapshot V3 exact.');
  }
  assertHopPropertyAdviceRequestV3(draft.requestSnapshot);
  if (draft.reexaminationSource) {
    assertText(draft.reexaminationSource.sourceRequestDraftReference, 'reexaminationSourceV3.sourceRequestDraftReference');
    assertText(draft.reexaminationSource.sourceReadingReference, 'reexaminationSourceV3.sourceReadingReference');
    assertText(draft.reexaminationSource.preparedReference, 'reexaminationSourceV3.preparedReference');
    assertText(draft.reexaminationSource.reason, 'reexaminationSourceV3.reason');
  }
  if (hopV55PropertyAdviceRequestDraftReferenceV3(draft) !== draft.reference) throw new Error('Le brouillon V3 a été altéré.');
}

/** Strict reader for a known V3 draft. Runtime answer-record readers keep future envelopes opaque. */
export function readHopV55PropertyAdviceRequestDraftV3(value: unknown): HopV55PropertyAdviceRequestDraftV3 {
  assertHopV55PropertyAdviceRequestDraftV3(value);
  return structuredClone(value);
}

function compensationInvestigationIntents(reading: HopV55QuestionReading,
  intents: readonly HopPropertyAdviceIntentV3[]): HopPropertyAdviceIntentV3[] {
  const drafts = new Map(reading.criterionDrafts.map(draft => [draft.id, draft]));
  const byId = new Map(intents.map(intent => [intent.id, intent]));
  return intents.map(intent => {
    const draft = drafts.get(intent.id);
    if (!draft || !isHopV55PropertyAdviceCompensationAnnotation(draft)
      || intent.interpretationOrigin !== 'proposal' || intent.role !== 'investigation' || intent.direction !== 'investigate') return structuredClone(intent);
    const linkedIds = intent.relatedIntentIds;
    if (!linkedIds.length) return structuredClone(intent);
    const observations = linkedIds.map(id => byId.get(id));
    const admissible = observations.every((observation): observation is HopPropertyAdviceIntentV3 => !!observation
      && observation.role === 'reportedObservation' && observation.metric === 'sensory' && observation.property === 'sweetness'
      && ['beer', 'unspecified'].includes(observation.subject.kind)
      && ['beer', 'unspecified'].includes(observation.subject.sensoryContext));
    if (!admissible) return structuredClone(intent);
    const referent = observations[0];
    return { ...structuredClone(intent), property: referent.property, metric: referent.metric,
      subject: structuredClone(referent.subject),
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [...linkedIds] } };
  });
}

function normalizeReadingActIntentsV3(reading: HopV55QuestionReading,
  intents: readonly HopPropertyAdviceIntentV3[]): HopPropertyAdviceIntentV3[] {
  const drafts = new Map(reading.criterionDrafts.map(draft => [draft.id, draft]));
  const normalizeTerm = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
  return intents.map(intent => {
    const draft = drafts.get(intent.id);
    if (!draft || intent.interpretationOrigin !== 'proposal') return structuredClone(intent);
    const term = normalizeTerm(draft.term);
    if (draft.dimension === 'other' && intent.role === 'reportedObservation' && intent.direction === null
      && ['doux', 'douce', 'douceur', 'sweet'].includes(term)) {
      return { ...structuredClone(intent), property: 'sweetness', metric: 'sensory',
        subject: { kind: 'beer' as const, label: 'Bière visée', materialId: null, sensoryContext: 'beer' as const },
        basis: 'Perception de douceur rapportée; ce constat n’est pas une demande de diminution.' };
    }
    if (draft.direction === null && draft.requirement === 'optional'
      && /aucune d[ée]cision d[’']augmentation|augmentation non d[ée]cid[ée]e/i.test(draft.qualification ?? '')
      && ['amertume', 'amertum', 'bitter', 'bitterness'].includes(term)) {
      return { ...structuredClone(intent), property: 'bitterness', role: 'investigation', direction: 'investigate',
        required: false, metric: 'sensory',
        subject: { kind: 'beer' as const, label: 'Bière visée', materialId: null, sensoryContext: 'beer' as const },
        basis: 'Aucune augmentation n’a été décidée; aucune cible ou mesure d’amertume n’est posée.' };
    }
    if (draft.dimension === 'documentation' && draft.direction === null && draft.requirement === 'optional'
      && /caract[ée]risation mati[eè]re demand[ée]e/i.test(draft.qualification ?? '')
      && /\b(?:houblon|mati[eè]re|lot|[ée]chantillon)\b/iu.test(draft.term)) {
      return { ...structuredClone(intent), property: 'materialCharacter', role: 'investigation', direction: 'investigate',
        required: true, metric: 'unspecified',
        subject: { kind: 'material' as const, label: draft.term, materialId: null, sensoryContext: 'unspecified' as const },
        basis: 'Caractérisation de la matière demandée avant son choix; aucune identité ni analyse n’est attribuée.' };
    }
    return structuredClone(intent);
  });
}

function buildDraftV3(input: {
  id: string; ownerKey: string; workspaceId: string; sourceReadingReference: string;
  requestSnapshot: HopPropertyAdviceRequestV3; prepared: PreparedBrewingScenarioContext;
  revisionContext?: HopV55PropertyAdviceRevisionMetadataV3;
  reexaminationSource?: HopV55PropertyAdviceReexaminationSourceV3;
}): HopV55PropertyAdviceRequestDraftV3 {
  const body: DraftBodyV3 = {
    format: HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_V3_FORMAT, id: input.id, ownerKey: input.ownerKey,
    workspaceId: input.workspaceId, sourceReadingReference: input.sourceReadingReference,
    preparedReference: hopV55PropertyAdvicePreparedReferenceV3(input.prepared, input.requestSnapshot),
    requestSnapshot: structuredClone(input.requestSnapshot),
  };
  return { ...body, reference: hopV55PropertyAdviceRequestDraftReferenceV3(body),
    ...(input.revisionContext ? { revisionContext: structuredClone(input.revisionContext) } : {}),
    ...(input.reexaminationSource ? { reexaminationSource: structuredClone(input.reexaminationSource) } : {}) };
}

export interface PrepareHopV55PropertyAdviceRequestDraftV3Input {
  reading: HopV55QuestionReading;
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  propertyIntents?: readonly HopPropertyAdviceIntentV3[];
  /** Explicit user-authored text. Omitted text is proposed from the typed roles. */
  interpretation?: SummaryInterpretation;
}

export function prepareHopV55PropertyAdviceRequestDraftV3(
  input: PrepareHopV55PropertyAdviceRequestDraftV3Input,
): HopV55PropertyAdviceRequestDraftV3 {
  assertText(input.requestId, 'requestIdV3'); assertText(input.ownerKey, 'ownerKey'); assertText(input.workspaceId, 'workspaceId');
  assertText(input.sourceReadingReference, 'sourceReadingReference');
  assertHopV55PropertyAdviceCandidatePolicy(input.candidatePolicy);
  const propertyIntents = input.propertyIntents ? [...structuredClone(input.propertyIntents)]
    : compensationInvestigationIntents(input.reading,
      normalizeReadingActIntentsV3(input.reading, mapHopV55PropertyAdviceIntents(input.reading, input.prepared)));
  return sealHopV55PropertyAdviceRequestDraftV3FromIntents({ question: input.reading.intent.question,
    sourceAnnotations: input.reading.criterionDrafts.map(draft => ({ id: draft.id, source: draft.source })),
    propertyIntents, prepared: input.prepared, requestId: input.requestId, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: input.sourceReadingReference, candidatePolicy: input.candidatePolicy,
    ...(input.interpretation ? { interpretation: input.interpretation } : {}) });
}

/**
 * Shared V3 sealing core: exact question, one intent per source annotation with
 * its exact span, typed policy/context/materials, domain validation and hash.
 * It never maps wording to roles; callers supply typed intents.
 */
export function sealHopV55PropertyAdviceRequestDraftV3FromIntents(input: {
  question: string;
  sourceAnnotations: ReadonlyArray<{ id: string; source: { start: number; end: number; text: string } }>;
  propertyIntents: readonly HopPropertyAdviceIntentV3[];
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  interpretation?: SummaryInterpretation;
}): HopV55PropertyAdviceRequestDraftV3 {
  assertText(input.requestId, 'requestIdV3'); assertText(input.ownerKey, 'ownerKey'); assertText(input.workspaceId, 'workspaceId');
  assertText(input.sourceReadingReference, 'sourceReadingReference');
  assertHopV55PropertyAdviceCandidatePolicy(input.candidatePolicy);
  const propertyIntents = [...structuredClone(input.propertyIntents)];
  assertHopV55PropertyAdviceSourceSpans(input.question, propertyIntents);
  assertHopV55PropertyAdviceAnnotationIdsPreserved(input.sourceAnnotations.map(row => ({ id: row.id, sourceSpans: [row.source] })), propertyIntents);
  if (!propertyIntents.length) throw new Error('Le request V3 doit conserver une intention ou un contexte non requis.');
  if (input.interpretation) assertInterpretation(input.interpretation);
  const requestSnapshot: HopPropertyAdviceRequestV3 = {
    format: 'hop-documentary-request-v3', id: input.requestId,
    originalQuestion: input.question,
    interpretation: input.interpretation ? structuredClone(input.interpretation) : {
      id: `interpretation-${input.requestId}`, version: 'hop-v55-property-advice-reading-v3',
      text: buildHopV55PropertyAdviceInterpretation(propertyIntents), origin: 'proposal',
    },
    propertyIntents, candidatePolicy: structuredClone(input.candidatePolicy),
    context: buildHopV55PropertyAdviceRequestContext(input.prepared), exclusions: [],
    materials: scopeHopV55PropertyAdviceMaterials(input.prepared, input.candidatePolicy, propertyIntents),
  };
  assertHopPropertyAdviceRequestV3(requestSnapshot);
  return buildDraftV3({ id: input.requestId, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: input.sourceReadingReference, requestSnapshot, prepared: input.prepared });
}

export interface ReviseHopV55PropertyAdviceRequestDraftV3Input {
  draft: HopV55PropertyAdviceRequestDraftV3;
  prepared: PreparedBrewingScenarioContext;
  propertyIntents?: readonly HopPropertyAdviceIntentV3[];
  candidatePolicy?: HopPropertyAdviceRequestV3['candidatePolicy'];
  interpretation?: SummaryInterpretation;
  revisionContext: HopV55PropertyAdviceRevisionInputV3;
  accessUpdates?: readonly HopV55PropertyAdviceAccessUpdateV3[];
}

export function reviseHopV55PropertyAdviceRequestDraftV3(
  input: ReviseHopV55PropertyAdviceRequestDraftV3Input,
): HopV55PropertyAdviceRequestDraftV3 {
  assertHopV55PropertyAdviceRequestDraftV3(input.draft);
  if (input.draft.preparedReference !== hopV55PropertyAdvicePreparedReferenceV3(input.prepared, input.draft.requestSnapshot)) {
    throw new Error('Le contexte préparé a changé; réexamine la demande V3 au lieu de remplacer silencieusement sa référence.');
  }
  const propertyIntents = input.propertyIntents ?? input.draft.requestSnapshot.propertyIntents;
  const candidatePolicy = input.candidatePolicy ?? input.draft.requestSnapshot.candidatePolicy;
  assertHopV55PropertyAdviceCandidatePolicy(candidatePolicy); assertHopV55PropertyAdviceRevisionMetadata(input.revisionContext);
  if (input.interpretation) assertInterpretation(input.interpretation);
  assertHopV55PropertyAdviceAnnotationIdsPreserved(input.draft.requestSnapshot.propertyIntents, propertyIntents);
  assertHopV55PropertyAdviceSourceSpans(input.draft.requestSnapshot.originalQuestion, propertyIntents);
  const accessUpdates = input.accessUpdates ?? [];
  assertHopV55PropertyAdviceAccessUpdates(input.draft.requestSnapshot, accessUpdates);
  const requestSnapshot: HopPropertyAdviceRequestV3 = structuredClone(input.draft.requestSnapshot);
  requestSnapshot.propertyIntents = [...structuredClone(propertyIntents)];
  requestSnapshot.candidatePolicy = structuredClone(candidatePolicy);
  if (input.interpretation) requestSnapshot.interpretation = structuredClone(input.interpretation);
  requestSnapshot.materials = scopeHopV55PropertyAdviceMaterials(input.prepared, candidatePolicy, propertyIntents);
  for (const update of accessUpdates) {
    requestSnapshot.context.assertions.push(...structuredClone(update.assertions));
    requestSnapshot.context.access[update.scope] = structuredClone(update.access);
  }
  assertHopPropertyAdviceRequestV3(requestSnapshot);
  const revisionContext: HopV55PropertyAdviceRevisionMetadataV3 = {
    sourceRequestDraftReference: input.draft.reference, ...structuredClone(input.revisionContext),
    changedAccessScopes: [...new Set(accessUpdates.map(update => update.scope))],
  };
  return buildDraftV3({ id: input.draft.id, ownerKey: input.draft.ownerKey, workspaceId: input.draft.workspaceId,
    sourceReadingReference: input.draft.sourceReadingReference, requestSnapshot, prepared: input.prepared, revisionContext,
    ...(input.draft.reexaminationSource ? { reexaminationSource: input.draft.reexaminationSource } : {}) });
}

export function resumeHopV55PropertyAdviceRequestDraftV3(input: {
  source: HopV55PropertyAdviceRequestSnapshotSourceV3;
  prepared: PreparedBrewingScenarioContext;
}): HopV55PropertyAdviceRequestDraftV3 {
  const source = input.source;
  assertText(source.ownerKey, 'sourceV3.ownerKey'); assertText(source.workspaceId, 'sourceV3.workspaceId');
  assertText(source.sourceReadingReference, 'sourceV3.sourceReadingReference'); assertText(source.preparedReference, 'sourceV3.preparedReference');
  assertText(source.requestDraftReference, 'sourceV3.requestDraftReference');
  const body: DraftBodyV3 = { format: HOP_V55_PROPERTY_ADVICE_REQUEST_DRAFT_V3_FORMAT, id: source.requestSnapshot.id,
    ownerKey: source.ownerKey, workspaceId: source.workspaceId, sourceReadingReference: source.sourceReadingReference,
    preparedReference: source.preparedReference, requestSnapshot: structuredClone(source.requestSnapshot) };
  if (hopV55PropertyAdviceRequestDraftReferenceV3(body) !== source.requestDraftReference) {
    throw new Error('Le requestSnapshot V3 sauvegardé ne correspond pas à sa référence exacte.');
  }
  const draft: HopV55PropertyAdviceRequestDraftV3 = { ...body, reference: source.requestDraftReference };
  assertHopV55PropertyAdviceRequestDraftV3(draft);
  if (draft.preparedReference !== hopV55PropertyAdvicePreparedReferenceV3(input.prepared, draft.requestSnapshot)) {
    throw new Error('Le contexte ou le périmètre préparé V3 a changé; réexamine explicitement la demande.');
  }
  assertHopV55PropertyAdviceSourceSpans(draft.requestSnapshot.originalQuestion, draft.requestSnapshot.propertyIntents);
  return structuredClone(draft);
}

export interface ReexamineHopV55PropertyAdviceRequestDraftV3Input {
  draft: HopV55PropertyAdviceRequestDraftV3;
  /** Only the exact question is consulted; a historical or a semantic reading both qualify. */
  reading: { intent: { question: string } };
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  sourceReadingReference: string;
  reexaminationContext: HopV55PropertyAdviceReexaminationInputV3;
}

export function reexamineHopV55PropertyAdviceRequestDraftV3(
  input: ReexamineHopV55PropertyAdviceRequestDraftV3Input,
): HopV55PropertyAdviceRequestDraftV3 {
  assertHopV55PropertyAdviceRequestDraftV3(input.draft);
  assertText(input.requestId, 'requestIdV3'); assertText(input.sourceReadingReference, 'sourceReadingReference');
  assertHopV55PropertyAdviceRevisionMetadata(input.reexaminationContext);
  if (input.requestId === input.draft.id || input.sourceReadingReference === input.draft.sourceReadingReference) {
    throw new Error('Un réexamen V3 exige un nouvel ID de demande et une nouvelle référence de lecture.');
  }
  const previous = input.draft.requestSnapshot;
  if (input.reading.intent.question !== previous.originalQuestion) {
    throw new Error('La nouvelle lecture V3 ne conserve pas la question exacte; réconcilie explicitement ses annotations.');
  }
  const context = buildHopV55PropertyAdviceRequestContext(input.prepared);
  assertHopV55PropertyAdviceCurrentLinksRemainValid(previous, context);
  const propertyIntents = structuredClone(previous.propertyIntents);
  const candidatePolicy = structuredClone(previous.candidatePolicy);
  const requestSnapshot: HopPropertyAdviceRequestV3 = { ...structuredClone(previous), id: input.requestId,
    propertyIntents, candidatePolicy, context,
    materials: scopeHopV55PropertyAdviceMaterials(input.prepared, candidatePolicy, propertyIntents) };
  assertHopV55PropertyAdviceSourceSpans(requestSnapshot.originalQuestion, requestSnapshot.propertyIntents);
  assertHopV55PropertyAdviceIntentMaterialBindings(requestSnapshot);
  assertHopPropertyAdviceRequestV3(requestSnapshot);
  const reexaminationSource: HopV55PropertyAdviceReexaminationSourceV3 = {
    sourceRequestDraftReference: input.draft.reference, sourceReadingReference: input.draft.sourceReadingReference,
    preparedReference: input.draft.preparedReference, ...structuredClone(input.reexaminationContext),
  };
  return buildDraftV3({ id: input.requestId, ownerKey: input.draft.ownerKey, workspaceId: input.draft.workspaceId,
    sourceReadingReference: input.sourceReadingReference, requestSnapshot, prepared: input.prepared, reexaminationSource });
}

export interface ReconcileHopV55PropertyAdviceRequestDraftV3Input extends ReexamineHopV55PropertyAdviceRequestDraftV3Input {
  propertyIntents: readonly HopPropertyAdviceIntentV3[];
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
  interpretation: SummaryInterpretation;
}

export function reconcileHopV55PropertyAdviceRequestDraftV3(
  input: ReconcileHopV55PropertyAdviceRequestDraftV3Input,
): HopV55PropertyAdviceRequestDraftV3 {
  assertHopV55PropertyAdviceRequestDraftV3(input.draft);
  assertText(input.requestId, 'requestIdV3'); assertText(input.sourceReadingReference, 'sourceReadingReference');
  assertHopV55PropertyAdviceCandidatePolicy(input.candidatePolicy); assertInterpretation(input.interpretation);
  assertHopV55PropertyAdviceRevisionMetadata(input.reexaminationContext);
  if (input.requestId === input.draft.id || input.sourceReadingReference === input.draft.sourceReadingReference) {
    throw new Error('Une réconciliation V3 exige un nouvel ID de demande et une nouvelle référence de lecture.');
  }
  const previous = input.draft.requestSnapshot;
  if (input.reading.intent.question !== previous.originalQuestion) {
    throw new Error('La nouvelle lecture V3 ne conserve pas la question exacte; corrige explicitement les fragments.');
  }
  if (input.interpretation.origin !== 'user' || input.reexaminationContext.recordedBy.origin !== 'user') {
    throw new Error('Une réconciliation V3 exige une interprétation et un motif confirmés par le brasseur.');
  }
  assertHopV55PropertyAdviceAnnotationIdsPreserved(previous.propertyIntents, input.propertyIntents);
  assertHopV55PropertyAdviceSourceSpans(previous.originalQuestion, input.propertyIntents);
  const oldById = new Map(previous.propertyIntents.map(intent => [intent.id, intent]));
  for (const intent of input.propertyIntents) {
    const old = oldById.get(intent.id);
    if ((!old || hopAdviceContentReference('hop-property-advice-reconcile-intent-v3', old)
      !== hopAdviceContentReference('hop-property-advice-reconcile-intent-v3', intent))
      && intent.interpretationOrigin !== 'user') {
      throw new Error(`L’intention ${intent.id} modifiée en V3 doit être explicitement confirmée par le brasseur.`);
    }
  }
  const context = buildHopV55PropertyAdviceRequestContext(input.prepared);
  assertHopV55PropertyAdviceCurrentLinksRemainValid({ ...previous, propertyIntents: [...input.propertyIntents] }, context);
  const propertyIntents = [...structuredClone(input.propertyIntents)];
  const requestSnapshot: HopPropertyAdviceRequestV3 = { ...structuredClone(previous), id: input.requestId,
    interpretation: structuredClone(input.interpretation), propertyIntents, candidatePolicy: structuredClone(input.candidatePolicy), context,
    materials: scopeHopV55PropertyAdviceMaterials(input.prepared, input.candidatePolicy, propertyIntents) };
  assertHopV55PropertyAdviceIntentMaterialBindings(requestSnapshot);
  assertHopPropertyAdviceRequestV3(requestSnapshot);
  const reexaminationSource: HopV55PropertyAdviceReexaminationSourceV3 = {
    sourceRequestDraftReference: input.draft.reference, sourceReadingReference: input.draft.sourceReadingReference,
    preparedReference: input.draft.preparedReference, ...structuredClone(input.reexaminationContext),
  };
  return buildDraftV3({ id: input.requestId, ownerKey: input.draft.ownerKey, workspaceId: input.draft.workspaceId,
    sourceReadingReference: input.sourceReadingReference, requestSnapshot, prepared: input.prepared, reexaminationSource });
}

export interface UpgradeHopV55PropertyAdviceRequestDraftV2ToV3Input {
  draft: HopV55PropertyAdviceRequestDraftV2;
  reading: HopV55QuestionReading;
  prepared: PreparedBrewingScenarioContext;
  requestId: string;
  /** Upgrade keeps the exact archived reading reference. */
  sourceReadingReference: string;
  revisionContext: HopV55PropertyAdviceRevisionInputV3;
  propertyIntents?: readonly HopPropertyAdviceIntentV3[];
  interpretation?: SummaryInterpretation;
}

/** Explicit V2→V3 step. It never mutates the V2 draft or revisits its raw text. */
export function upgradeHopV55PropertyAdviceRequestDraftV2ToV3(
  input: UpgradeHopV55PropertyAdviceRequestDraftV2ToV3Input,
): HopV55PropertyAdviceRequestDraftV3 {
  assertHopV55PropertyAdviceRequestDraftV2(input.draft);
  assertText(input.requestId, 'requestIdV3'); assertText(input.sourceReadingReference, 'sourceReadingReference');
  assertHopV55PropertyAdviceRevisionMetadata(input.revisionContext);
  if (input.revisionContext.recordedBy.origin !== 'user') throw new Error('Un upgrade V2→V3 exige un geste explicite du brasseur.');
  if (input.requestId === input.draft.id || input.sourceReadingReference !== input.draft.sourceReadingReference) {
    throw new Error('Un upgrade V2→V3 conserve la lecture exacte et crée un nouvel ID de demande.');
  }
  if (input.reading.intent.question !== input.draft.requestSnapshot.originalQuestion) {
    throw new Error('La lecture source V2 ne correspond pas à la question scellée.');
  }
  if (input.draft.preparedReference !== hopV55PropertyAdvicePreparedReference(input.prepared, input.draft.requestSnapshot)) {
    throw new Error('Le contexte préparé a changé depuis la réponse V2; relis la source avant l’upgrade explicite.');
  }
  assertHopV55PropertyAdviceCandidatePolicy(input.draft.requestSnapshot.candidatePolicy);
  const propertyIntents = input.propertyIntents ? [...structuredClone(input.propertyIntents)]
    : compensationInvestigationIntents(input.reading, structuredClone(input.draft.requestSnapshot.propertyIntents) as HopPropertyAdviceIntentV3[]);
  assertHopV55PropertyAdviceAnnotationIdsPreserved(input.draft.requestSnapshot.propertyIntents, propertyIntents);
  assertHopV55PropertyAdviceSourceSpans(input.draft.requestSnapshot.originalQuestion, propertyIntents);
  const candidatePolicy = structuredClone(input.draft.requestSnapshot.candidatePolicy);
  const interpretation = input.interpretation ? structuredClone(input.interpretation)
    : input.draft.requestSnapshot.interpretation.origin === 'user' ? structuredClone(input.draft.requestSnapshot.interpretation)
      : { id: `interpretation-${input.requestId}`, version: 'hop-v55-property-advice-reading-v3',
        text: buildHopV55PropertyAdviceInterpretation(propertyIntents), origin: 'proposal' as const };
  assertInterpretation(interpretation);
  const requestSnapshot: HopPropertyAdviceRequestV3 = {
    ...structuredClone(input.draft.requestSnapshot), format: 'hop-documentary-request-v3', id: input.requestId,
    interpretation, propertyIntents, candidatePolicy,
    materials: scopeHopV55PropertyAdviceMaterials(input.prepared, candidatePolicy, propertyIntents),
  };
  assertHopPropertyAdviceRequestV3(requestSnapshot);
  const revisionContext: HopV55PropertyAdviceRevisionMetadataV3 = {
    sourceRequestDraftReference: input.draft.reference, ...structuredClone(input.revisionContext), changedAccessScopes: [],
  };
  return buildDraftV3({ id: input.requestId, ownerKey: input.draft.ownerKey, workspaceId: input.draft.workspaceId,
    sourceReadingReference: input.sourceReadingReference, requestSnapshot, prepared: input.prepared, revisionContext });
}
