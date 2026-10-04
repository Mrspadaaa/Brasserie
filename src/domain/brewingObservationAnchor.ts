import { assertBrewingReferenceObservation, type BrewingReferenceObservationV1 } from './brewingReference';
import { assertBrewingObservedState, type BrewingObservedStateV1 } from './brewingObservedState';
import { brewingObservationFactReference } from './brewingObservationNumerics';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

export interface BrewingObservationAnchor {
  format: 'brewing-observation-anchor-v1';
  id: string;
  observation: BrewingReferenceObservationV1;
  observationReference: string;
  observedState: BrewingObservedStateV1;
  /** An explicit subject link, not a verdict about current physical applicability. */
  subjectRelation: 'sameSubject' | 'analogy' | 'unresolved';
  explanation: string;
  createdAt: string;
  createdBy: { origin: 'user' | 'assistant' | 'model'; name: string };
  previousAnchorReference?: string;
  reference: string;
}

export interface CreateBrewingObservationAnchorInput {
  id: string;
  observation: BrewingReferenceObservationV1;
  observedState: BrewingObservedStateV1;
  subjectRelation: BrewingObservationAnchor['subjectRelation'];
  explanation: string;
  createdAt: string;
  createdBy: BrewingObservationAnchor['createdBy'];
  previousAnchorReference?: string;
}

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const keys = (value: Record<string, any>, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));
const instant = (value: unknown) => text(value) && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));

export function brewingObservationAnchorReference(value: Omit<BrewingObservationAnchor, 'reference'> | BrewingObservationAnchor): string {
  const { reference: _reference, ...body } = value as BrewingObservationAnchor;
  return hopAdviceContentReference('brewing-observation-anchor-content-v1', body);
}

function assertAnchorBody(value: unknown): asserts value is BrewingObservationAnchor {
  if (!object(value) || !keys(value, ['format', 'id', 'observation', 'observationReference', 'observedState',
    'subjectRelation', 'explanation', 'createdAt', 'createdBy', 'previousAnchorReference', 'reference'])
    || value.format !== 'brewing-observation-anchor-v1' || !text(value.id) || !text(value.observationReference)
    || !['sameSubject', 'analogy', 'unresolved'].includes(value.subjectRelation) || !text(value.explanation)
    || !instant(value.createdAt) || !object(value.createdBy) || !keys(value.createdBy, ['origin', 'name'])
    || !['user', 'assistant', 'model'].includes(value.createdBy.origin) || !text(value.createdBy.name)
    || value.previousAnchorReference !== undefined && !text(value.previousAnchorReference)) {
    throw Error('Ancre d’observation incomplète ou hors contrat.');
  }
  assertBrewingReferenceObservation(value.observation);
  assertBrewingObservedState(value.observedState);
  if (value.observationReference !== brewingObservationFactReference(value.observation)) throw Error('La note ne correspond pas à sa référence figée.');
  if (value.subjectRelation === 'sameSubject' && (!value.observation.subject.id
    || value.observation.subject.id !== value.observedState.subject.identity.id)) {
    throw Error('L’identité du sujet observé ne correspond pas à l’état ; un nom ou une analogie ne suffit pas.');
  }
  const observedAt = Date.parse(value.observation.observedAt);
  const stateAt = Date.parse(value.observedState.asOf);
  if (value.observedState.subject.kind === 'beer' && observedAt !== stateAt) {
    throw Error('L’état de bière ancré doit être résolu à l’instant observé, pas à la durée cible.');
  }
  if (value.observedState.subject.kind === 'sample' && observedAt < stateAt) {
    throw Error('La dégustation ne peut pas précéder le prélèvement de son échantillon.');
  }
}

export function assertBrewingObservationAnchor(value: unknown): asserts value is BrewingObservationAnchor {
  assertAnchorBody(value);
  if (!text(value.reference) || value.reference !== brewingObservationAnchorReference(value)) {
    throw Error('L’ancre ne correspond plus à son contenu figé.');
  }
}

export function createBrewingObservationAnchor(input: CreateBrewingObservationAnchorInput): BrewingObservationAnchor {
  if (!object(input) || !keys(input, ['id', 'observation', 'observedState', 'subjectRelation', 'explanation', 'createdAt', 'createdBy', 'previousAnchorReference'])) {
    throw Error('Entrée d’ancrage hors contrat.');
  }
  const anchor: BrewingObservationAnchor = {
    format: 'brewing-observation-anchor-v1', ...structuredClone(input),
    observationReference: brewingObservationFactReference(input.observation), reference: '',
  };
  assertAnchorBody(anchor);
  anchor.reference = brewingObservationAnchorReference(anchor);
  assertBrewingObservationAnchor(anchor);
  return anchor;
}

/** Snapshot reader only: no present-time resolution, model call or archive upgrade. */
export function readBrewingObservationAnchor(value: unknown):
  | { status: 'readOnly'; anchor: BrewingObservationAnchor }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  if (object(value) && text(value.format) && value.format.startsWith('brewing-observation-anchor-') && value.format !== 'brewing-observation-anchor-v1') {
    return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Version d’ancre non prise en charge ; contenu conservé sans recalcul.' };
  }
  assertBrewingObservationAnchor(value);
  return { status: 'readOnly', anchor: structuredClone(value) };
}
