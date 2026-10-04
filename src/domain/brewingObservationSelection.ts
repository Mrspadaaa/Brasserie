import type { HopRange } from '../../functions/src/hopIndexSchema';
import {
  assertBrewingObservationAnchor,
  type BrewingObservationAnchor,
} from './brewingObservationAnchor';
import {
  assessBrewingObservedStateApplicability,
  assertBrewingObservedState,
  type BrewingObservedStateApplicabilityV1,
  type BrewingObservedStateV1,
} from './brewingObservedState';
import { brewingObservationFactReference } from './brewingObservationNumerics';
import { assertBrewingSensoryDefinitionReference } from './brewingSensory';
import {
  assertBrewingReferenceObservation,
  readBrewingReferenceRecord,
  type BrewingReferenceActorV1,
  type BrewingReferenceCommandInput,
  type BrewingReferenceEvent,
  type BrewingReferenceObservationDimensionV1,
  type BrewingReferenceObservationV1,
  type BrewingReferenceRecordReadV1,
} from './brewingReference';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

export const BREWING_OBSERVATION_SELECTION_VERSION = 'brewing-observation-selection-v1' as const;

export interface BrewingObservationVersionReferenceV1 {
  id: string;
  version: number;
  contentReference: string;
}

export type BrewingObservationSelectionCandidateStatusV1 =
  | 'applicable'
  | 'noAnchor'
  | 'ambiguousAnchor'
  | 'invalidCorrectionLineage'
  | 'futureObservation'
  | 'unresolvedSubject'
  | 'unresolvedDimension'
  | 'dimensionMismatch'
  | 'differentSubject'
  | 'continuityUnknown'
  | 'historical'
  | 'partial'
  | 'unknown'
  | 'conflicting';

export interface BrewingObservationSelectionCandidateV1 {
  /** Latest note value/text for this observation id, including any correction. */
  observation: BrewingReferenceObservationV1;
  /** Version-one snapshot used to establish the original physical anchor and sort rank. */
  originalObservation: BrewingReferenceObservationV1;
  observationReference: BrewingObservationVersionReferenceV1;
  originalObservationReference: BrewingObservationVersionReferenceV1;
  /** Zero-based position of the first observationRecorded event in the validated journal. */
  firstRecordedOrder: number;
  anchor: BrewingObservationAnchor | null;
  originalAnchor: BrewingObservationAnchor | null;
  anchorReferences: string[];
  originalAnchorReferences: string[];
  applicability: BrewingObservedStateApplicabilityV1 | null;
  dimensionStatus: 'exact' | 'unresolved' | 'mismatch' | 'requestedUnresolved';
  scaleStatus: 'known' | 'unknown';
  status: BrewingObservationSelectionCandidateStatusV1;
  reasons: string[];
}

export interface BrewingObservationSelectionV1 {
  format: typeof BREWING_OBSERVATION_SELECTION_VERSION;
  selected: BrewingObservationSelectionCandidateV1 | null;
  /** Includes unresolved, non-comparable, unanchored and non-current candidates. */
  candidates: BrewingObservationSelectionCandidateV1[];
  reasons: string[];
}

export interface ResolveCurrentBrewingObservationInputV1 {
  journal: BrewingReferenceRecordReadV1;
  anchors: readonly BrewingObservationAnchor[];
  currentState: BrewingObservedStateV1;
  requestedDimension: BrewingReferenceObservationDimensionV1;
  requiredDependencyIds: string[];
}

export interface CreateBrewingReferenceObservationCorrectionCommandInputV1 {
  journal: BrewingReferenceRecordReadV1;
  /** Exact latest source version the caller intends to correct. */
  expectedObservation: BrewingObservationVersionReferenceV1;
  commandId: string;
  recordedAt: string;
  correctedBy: BrewingReferenceActorV1;
  reason: string;
  changes: {
    originalText?: string;
    value?: number | HopRange;
  };
}

export class BrewingObservationSelectionError extends Error {
  constructor(readonly code: 'invalidInput' | 'staleObservation' | 'unsupportedFormat', message: string) {
    super(message);
    this.name = 'BrewingObservationSelectionError';
  }
}

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isoDate = (value: unknown): value is string => text(value)
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value));
const clone = <T>(value: T): T => structuredClone(value);
function invalid(message: string): never { throw new BrewingObservationSelectionError('invalidInput', message); }
function stale(message: string): never { throw new BrewingObservationSelectionError('staleObservation', message); }
function unsupported(message: string): never { throw new BrewingObservationSelectionError('unsupportedFormat', message); }

function sameJson(a: unknown, b: unknown): boolean {
  return hopAdviceContentReference('brewing-observation-selection-equality-v1', a)
    === hopAdviceContentReference('brewing-observation-selection-equality-v1', b);
}

function observationReference(observation: BrewingReferenceObservationV1): BrewingObservationVersionReferenceV1 {
  return {
    id: observation.id,
    version: observation.version,
    contentReference: brewingObservationFactReference(observation),
  };
}

function referenceMatches(a: BrewingObservationVersionReferenceV1, b: BrewingObservationVersionReferenceV1): boolean {
  return a.id === b.id && a.version === b.version && a.contentReference === b.contentReference;
}

function protectedObservationContent(observation: BrewingReferenceObservationV1): unknown {
  const sense = observation.sense.kind === 'qualitative'
    ? { kind: observation.sense.kind }
    : observation.sense.kind === 'sensoryRating'
      ? { kind: observation.sense.kind }
      : { kind: observation.sense.kind, unit: observation.sense.unit, basis: observation.sense.basis, method: observation.sense.method };
  return {
    id: observation.id,
    observedAt: observation.observedAt,
    subject: observation.subject,
    dimension: observation.dimension,
    scale: observation.scale,
    sense,
    comparison: observation.comparison,
    context: observation.context,
  };
}

function sameCorrectionLineage(previous: BrewingReferenceObservationV1, next: BrewingReferenceObservationV1): boolean {
  return next.id === previous.id && next.version === previous.version + 1
    && sameJson(protectedObservationContent(previous), protectedObservationContent(next));
}

function validatedJournal(read: BrewingReferenceRecordReadV1): BrewingReferenceRecordReadV1 {
  if (!object(read) || !object(read.record) || !Array.isArray(read.events)) invalid('Relecture validée du journal de référence requise.');
  const result = readBrewingReferenceRecord(read.record, read.events);
  if ('status' in result) unsupported('Journal NR dans un format futur; aucune sélection ni correction ne peut être créée.');
  return result;
}

interface ObservationHistory {
  original: BrewingReferenceObservationV1;
  latest: BrewingReferenceObservationV1;
  firstRecordedOrder: number;
  lineageValid: boolean;
}

function historiesFromEvents(events: readonly BrewingReferenceEvent[]): Map<string, ObservationHistory> {
  const histories = new Map<string, ObservationHistory>();
  events.forEach((event, index) => {
    if (event.kind === 'observationRecorded') {
      const observation = event.payload.observation;
      if (!histories.has(observation.id)) histories.set(observation.id, {
        original: clone(observation), latest: clone(observation), firstRecordedOrder: index,
        lineageValid: observation.version === 1,
      });
      return;
    }
    if (event.kind !== 'observationCorrected') return;
    const observation = event.payload.observation;
    const history = histories.get(observation.id);
    if (!history) return; // The NR journal reader will reject this transition.
    if (!sameCorrectionLineage(history.latest, observation)) history.lineageValid = false;
    history.latest = clone(observation);
  });
  return histories;
}

function definitionDimensionIdentity(dimension: BrewingReferenceObservationDimensionV1): string | null {
  return dimension.status === 'resolved' ? dimension.definition.dimensionReference : null;
}

function observedDimension(dimension: BrewingReferenceObservationDimensionV1): { status: 'resolved'; id: string; version: string } | { status: 'unresolved'; label: string } {
  return dimension.status === 'resolved'
    ? { status: 'resolved', id: dimension.definition.dimension.id, version: dimension.definition.dimension.version }
    : { status: 'unresolved', label: dimension.label };
}

function sortRank(a: BrewingObservationSelectionCandidateV1, b: BrewingObservationSelectionCandidateV1): number {
  const observedDifference = Date.parse(b.originalObservation.observedAt) - Date.parse(a.originalObservation.observedAt);
  return observedDifference || b.firstRecordedOrder - a.firstRecordedOrder;
}

function isAfterCurrentCutoff(observation: BrewingReferenceObservationV1, currentState: BrewingObservedStateV1): boolean {
  return currentState.subject.kind === 'beer' && Date.parse(observation.observedAt) > Date.parse(currentState.asOf);
}

/** Resolves the newest physically current observation while preserving every unresolved candidate and reason. */
export function resolveCurrentBrewingObservation(input: ResolveCurrentBrewingObservationInputV1): BrewingObservationSelectionV1 {
  if (!object(input) || !Array.isArray(input.anchors) || !Array.isArray(input.requiredDependencyIds)
    || !object(input.requestedDimension)
    || input.requiredDependencyIds.some(id => !text(id))
    || new Set(input.requiredDependencyIds).size !== input.requiredDependencyIds.length) invalid('Entrée de sélection d’observation incomplète.');
  const journal = validatedJournal(input.journal);
  assertBrewingObservedState(input.currentState);
  if (input.requestedDimension.status === 'resolved') {
    if (Object.keys(input.requestedDimension).some(key => !['status', 'definition'].includes(key))) invalid('Dimension demandée hors contrat.');
    assertBrewingSensoryDefinitionReference(input.requestedDimension.definition);
  } else if (input.requestedDimension.status !== 'unresolved' || !text(input.requestedDimension.label)
    || Object.keys(input.requestedDimension).some(key => !['status', 'label'].includes(key))) invalid('Dimension demandée sans identité ni libellé.');
  for (const anchor of input.anchors) assertBrewingObservationAnchor(anchor);

  const histories = historiesFromEvents(journal.events);
  const candidates: BrewingObservationSelectionCandidateV1[] = [];
  for (const history of histories.values()) {
    const { original, latest, firstRecordedOrder } = history;
    const originalRef = observationReference(original);
    const latestRef = observationReference(latest);
    const originalAnchors = input.anchors.filter(anchor => anchor.observationReference === originalRef.contentReference
      && referenceMatches(observationReference(anchor.observation), originalRef));
    const exactAnchors = input.anchors.filter(anchor => anchor.observationReference === latestRef.contentReference
      && referenceMatches(observationReference(anchor.observation), latestRef));
    const canReuseOriginalAnchor = history.lineageValid;
    const candidateAnchors = exactAnchors.length ? exactAnchors : canReuseOriginalAnchor ? originalAnchors : [];
    const reasons: string[] = [];
    let applicability: BrewingObservedStateApplicabilityV1 | null = null;
    const anchor = candidateAnchors.length === 1 ? clone(candidateAnchors[0]) : null;
    const originalAnchor = originalAnchors.length === 1 ? clone(originalAnchors[0]) : null;
    let dimensionStatus: BrewingObservationSelectionCandidateV1['dimensionStatus'];
    const requestedDimensionId = definitionDimensionIdentity(input.requestedDimension);
    const noteDimensionId = definitionDimensionIdentity(latest.dimension);
    if (requestedDimensionId === null) {
      dimensionStatus = 'requestedUnresolved';
      reasons.push('La dimension demandée n’est pas résolue; aucun rapprochement par libellé ou famille n’est effectué.');
    } else if (noteDimensionId === null) {
      dimensionStatus = 'unresolved';
      reasons.push('La dimension de cette observation reste non résolue.');
    } else if (requestedDimensionId !== noteDimensionId) {
      dimensionStatus = 'mismatch';
      reasons.push('La définition exacte de la dimension diffère de celle demandée.');
    } else dimensionStatus = 'exact';
    const scaleStatus = latest.scale.status;
    if (scaleStatus === 'unknown') reasons.push('Échelle inconnue conservée; cela interdit une qualification numérique mais pas l’affichage de la note pertinente.');
    if (!history.lineageValid && exactAnchors.length === 0) reasons.push('Une correction générale a changé un champ physique protégé; sans ancre exacte de cette version, son état reste inconnu.');
    if (!anchor && candidateAnchors.length === 0 && originalAnchors.length === 0 && exactAnchors.length === 0) reasons.push('Aucune ancre ne porte l’empreinte exacte de la note courante ou de sa première observation enregistrée.');
    if (!anchor && candidateAnchors.length === 0 && originalAnchors.length > 0 && !canReuseOriginalAnchor && exactAnchors.length === 0) reasons.push('L’ancre initiale ne peut pas être transférée à une correction qui a déplacé le contexte physique.');
    if (candidateAnchors.length > 1) reasons.push('Plusieurs ancres exactes existent pour cette observation; le choix d’état doit être explicite.');
    if (anchor) {
      if (anchor.subjectRelation === 'analogy') reasons.push('L’observation provient d’un sujet analogue et ne décrit pas le sujet courant.');
      if (anchor.subjectRelation === 'unresolved') reasons.push('L’identité du sujet observé n’est pas établie.');
      if (isAfterCurrentCutoff(latest, input.currentState)) reasons.push('L’observation est postérieure à la coupure de l’état courant.');
      if (history.lineageValid || exactAnchors.length === 1) {
        applicability = assessBrewingObservedStateApplicability({
          use: 'describeCurrent',
          anchor: {
            observationReference: { id: latest.id, version: String(latest.version), contentReference: latestRef.contentReference },
            observedAt: anchor.observation.observedAt,
            state: anchor.observedState,
            dimension: observedDimension(latest.dimension),
          },
          evaluationState: input.currentState,
          requiredDependencyIds: input.requiredDependencyIds,
        });
        reasons.push(...applicability.reasons);
        for (const dependency of applicability.dependencies) reasons.push(...dependency.reasons);
      }
    }

    let status: BrewingObservationSelectionCandidateStatusV1;
    if (!anchor && !history.lineageValid && exactAnchors.length === 0) status = 'invalidCorrectionLineage';
    else if (!anchor && originalAnchors.length === 0 && exactAnchors.length === 0) status = 'noAnchor';
    else if (!anchor && candidateAnchors.length > 1) status = 'ambiguousAnchor';
    else if (anchor?.subjectRelation === 'unresolved') status = 'unresolvedSubject';
    else if (anchor?.subjectRelation === 'analogy') status = 'differentSubject';
    else if (isAfterCurrentCutoff(latest, input.currentState)) status = 'futureObservation';
    else if (dimensionStatus !== 'exact') status = dimensionStatus === 'mismatch' ? 'dimensionMismatch' : 'unresolvedDimension';
    else if (applicability?.status === 'applicable') status = 'applicable';
    else if (applicability) status = applicability.status;
    else status = 'unknown';

    candidates.push({
      observation: clone(latest), originalObservation: clone(original), observationReference: latestRef,
      originalObservationReference: originalRef, firstRecordedOrder, anchor, originalAnchor,
      anchorReferences: candidateAnchors.map(row => row.reference), originalAnchorReferences: originalAnchors.map(row => row.reference),
      applicability, dimensionStatus, scaleStatus, status, reasons: [...new Set(reasons)],
    });
  }
  candidates.sort(sortRank);
  const selected = candidates.find(candidate => candidate.status === 'applicable') ?? null;
  return {
    format: BREWING_OBSERVATION_SELECTION_VERSION,
    selected: selected ? clone(selected) : null,
    candidates: clone(candidates),
    reasons: selected ? [] : [...new Set(candidates.flatMap(candidate => candidate.reasons))],
  };
}

/** Builds a bounded retrospective correction; the reducer remains responsible for CAS and idempotency. */
export function createBrewingReferenceObservationCorrectionCommand(
  input: CreateBrewingReferenceObservationCorrectionCommandInputV1,
): BrewingReferenceCommandInput<'observationCorrected'> {
  if (!object(input) || !object(input.expectedObservation) || !text(input.expectedObservation.id)
    || !Number.isSafeInteger(input.expectedObservation.version) || input.expectedObservation.version < 1
    || !text(input.expectedObservation.contentReference) || !text(input.commandId) || !isoDate(input.recordedAt)
    || !object(input.correctedBy) || !text(input.correctedBy.label) || (input.correctedBy.id !== undefined && !text(input.correctedBy.id))
    || !text(input.reason) || !object(input.changes)) invalid('Commande de correction rétrospective incomplète.');
  if (Object.keys(input.expectedObservation).some(key => !['id', 'version', 'contentReference'].includes(key))) invalid('Identité de l’observation attendue hors contrat.');
  if (Object.keys(input.correctedBy).some(key => !['id', 'label'].includes(key))) invalid('Auteur de correction hors contrat.');
  if (Object.keys(input.changes).some(key => !['originalText', 'value'].includes(key))) invalid('Une correction rétrospective ne peut changer que le texte ou la valeur.');
  const hasText = Object.prototype.hasOwnProperty.call(input.changes, 'originalText');
  const hasValue = Object.prototype.hasOwnProperty.call(input.changes, 'value');
  if (!hasText && !hasValue) invalid('La correction doit changer le texte original ou la valeur.');
  if (hasText && !text(input.changes.originalText)) invalid('Le texte corrigé doit rester explicite.');

  const journal = validatedJournal(input.journal);
  const history = historiesFromEvents(journal.events).get(input.expectedObservation.id);
  if (!history) stale('L’observation attendue n’existe pas dans le journal.');
  const current = history.latest;
  if (current.version !== input.expectedObservation.version || !referenceMatches(observationReference(current), input.expectedObservation)) {
    stale('La version ou l’empreinte de l’observation a changé depuis sa sélection.');
  }
  if (!history.lineageValid) stale('La filiation contient déjà une correction qui a déplacé l’état physique; une correction sûre ne peut pas être construite.');
  if (hasValue && current.sense.kind === 'qualitative') invalid('Une observation qualitative ne possède pas de valeur numérique à corriger.');

  const next = clone(current);
  next.version = current.version + 1;
  next.author = clone(input.correctedBy);
  // The fact's origin stays unchanged. The canonical correction event carries
  // correctsVersion and reason; this version's author identifies its corrector.
  if (hasText) next.originalText = input.changes.originalText!;
  if (hasValue && next.sense.kind !== 'qualitative') next.sense.value = clone(input.changes.value!);
  const currentValue = current.sense.kind === 'qualitative' ? undefined : current.sense.value;
  const nextValue = next.sense.kind === 'qualitative' ? undefined : next.sense.value;
  const valueChanged = hasValue && currentValue !== undefined && !sameJson(currentValue, nextValue);
  const textChanged = hasText && current.originalText !== next.originalText;
  if (!valueChanged && !textChanged) invalid('La correction ne modifie ni le texte ni la valeur.');
  assertBrewingReferenceObservation(next);

  return {
    ownerKey: journal.record.ownerKey,
    contextId: journal.record.contextId,
    commandId: input.commandId,
    expectedRevision: journal.record.revision,
    recordedAt: input.recordedAt,
    kind: 'observationCorrected',
    payload: { observation: next, correctsVersion: current.version, reason: input.reason },
  };
}
