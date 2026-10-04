import { describe, expect, it } from 'vitest';
import {
  BREWING_OBSERVED_STATE_INPUT_VERSION,
  resolveBrewingObservedState,
  type BrewingObservedCoverageV1,
  type BrewingObservedFactV1,
  type BrewingObservedIdentityV1,
  type BrewingObservedStateInputV1,
  type BrewingObservedSubjectV1,
} from '../../src/domain/brewingObservedState';
import { createBrewingObservationAnchor, type BrewingObservationAnchor } from '../../src/domain/brewingObservationAnchor';
import { brewingObservationFactReference } from '../../src/domain/brewingObservationNumerics';
import {
  createBrewingReferenceObservationCorrectionCommand,
  resolveCurrentBrewingObservation,
} from '../../src/domain/brewingObservationSelection';
import {
  applyBrewingReferenceCommand,
  openBrewingReferenceContext,
  readBrewingReferenceRecord,
  type BrewingReferenceActorV1,
  type BrewingReferenceCommandInput,
  type BrewingReferenceEvent,
  type BrewingReferenceObservationDimensionV1,
  type BrewingReferenceObservationV1,
  type BrewingReferenceRecordReadV1,
} from '../../src/domain/brewingReference';
import {
  createBrewingSensoryDefinitionReference,
  type BrewingSensoryDefinitionReference,
  type BrewingSensoryDimension,
  type BrewingSensoryMetric,
  type BrewingSensoryScale,
} from '../../src/domain/brewingSensory';

const actor: BrewingReferenceActorV1 = { id: 'brewer-1', label: 'Brasseuse témoin' };
const correctedBy: BrewingReferenceActorV1 = { id: 'transcriber-2', label: 'Correcteur témoin' };
const source = (reference: string) => ({ kind: 'fixture', reference, description: `Source ${reference}` });
const sensorySource = (reference: string) => ({ title: reference, author: 'Témoin', year: 2026, kind: 'judgment' as const, reference });
const identity = (id: string, version = '1'): BrewingObservedIdentityV1 => ({ id, version, contentReference: `fixture:${id}:${version}` });
const beerIdentity = identity('beer-1');
const beerSubject: BrewingObservedSubjectV1 = { kind: 'beer', identity: beerIdentity };
const hop = identity('hop-alpha');
const lot = identity('lot-1');

function definition(id = 'fruit', version = '1'): BrewingSensoryDefinitionReference {
  const dimension: BrewingSensoryDimension = { id, version, name: id === 'fruit' ? 'Poire' : 'Torréfaction',
    definition: id === 'fruit' ? 'Nuance fruitée.' : 'Nuance torréfiée.', sourceRefs: [sensorySource(`dimension:${id}:${version}`)] };
  const metric: BrewingSensoryMetric = { id: 'declared-note', version: '1', kind: 'ordinalNote', name: 'Note déclarée',
    meaning: 'Intensité déclarée par dégustation.', unit: null, sourceRefs: [sensorySource('metric:declared-note')] };
  const scale: BrewingSensoryScale = { id: 'five-point-scale', version: '1', metricRef: { id: metric.id, version: metric.version },
    domain: { min: 1, max: 5 }, labels: [{ value: 1, label: 'Faible' }, { value: 5, label: 'Fort' }], sourceRefs: [sensorySource('scale:five-point')] };
  return createBrewingSensoryDefinitionReference(dimension, metric, scale);
}

function documentaryDefinition(id = 'fruit', version = '1'): BrewingSensoryDefinitionReference {
  const dimension: BrewingSensoryDimension = { id, version, name: id === 'fruit' ? 'Poire' : 'Torréfaction',
    definition: id === 'fruit' ? 'Nuance fruitée.' : 'Nuance torréfiée.', sourceRefs: [sensorySource(`dimension:${id}:${version}`)] };
  return createBrewingSensoryDefinitionReference(dimension, null, null);
}

const fruitDefinition = definition();
const fruitDocumentaryDefinition = documentaryDefinition();
const roastDefinition = definition('roast');
type LocalCommand = { [K in BrewingReferenceCommandInput['kind']]: Omit<BrewingReferenceCommandInput<K>, 'ownerKey' | 'contextId'> }[BrewingReferenceCommandInput['kind']];

function addition(id: string, effectiveAt: string, grams: number): BrewingObservedFactV1 {
  return { kind: 'materialAdded', id, version: 1, supersedesVersion: null, subjectReference: beerIdentity,
    dependencyId: 'hopMaterials', effectiveAt, recordedAt: effectiveAt, epistemicStatus: 'observed',
    provenance: source(`fact:${id}`), material: { status: 'identified', reference: hop }, lot: { status: 'identified', reference: lot },
    quantity: { status: 'known', value: grams, unit: 'g' } };
}

function coverage(subject: BrewingObservedSubjectV1): BrewingObservedCoverageV1 {
  return { id: `coverage-${subject.identity.id}`, version: 1, supersedesVersion: null, subjectReference: subject.identity,
    dependencyId: 'hopMaterials', fromAt: '2026-10-01T00:00:00.000Z', throughAt: '2026-10-10T00:00:00.000Z',
    status: 'complete', recordedAt: '2026-10-10T00:05:00.000Z', provenance: source('coverage:hopMaterials') };
}

function stateAt(asOf: string, facts: BrewingObservedFactV1[] = [addition('base-hop', '2026-10-02T08:00:00.000Z', 40)], subject = beerSubject) {
  const input: BrewingObservedStateInputV1 = { format: BREWING_OBSERVED_STATE_INPUT_VERSION, subject,
    asOf: subject.kind === 'sample' ? subject.collection.effectiveAt : asOf, knowledgeAsOf: '2026-10-10T01:00:00.000Z',
    knowledgeReference: identity('fixture-knowledge', 'v1'), facts, contacts: [], coverage: [coverage(subject)], sampleContinuity: [] };
  return resolveBrewingObservedState(input);
}

function note(input: {
  id: string; observedAt: string; value?: number; text?: string; dimension?: BrewingReferenceObservationDimensionV1;
  scaleUnknown?: boolean; qualitative?: boolean; subjectId?: string; context?: BrewingReferenceObservationV1['context'];
}): BrewingReferenceObservationV1 {
  const defaultDefinition = input.scaleUnknown ? fruitDocumentaryDefinition : fruitDefinition;
  const selectedDefinition = input.dimension?.status === 'resolved' ? input.dimension.definition : defaultDefinition;
  return { id: input.id, version: 1,
    subject: { kind: 'biere', id: input.subjectId ?? beerIdentity.id, label: input.subjectId ?? 'Brassin témoin' },
    observedAt: input.observedAt, author: actor, origin: { kind: 'brasseur', description: 'Saisie de dégustation' },
    originalText: input.text ?? `Note ${input.value ?? 3}/5`,
    dimension: input.dimension ?? { status: 'resolved', definition: defaultDefinition },
    scale: input.scaleUnknown ? { status: 'unknown' } : { status: 'known', metric: selectedDefinition.metric!, scale: selectedDefinition.scale! },
    sense: input.qualitative ? { kind: 'qualitative' } : { kind: 'sensoryRating', value: input.value ?? 3 },
    comparison: { kind: 'absolute' }, context: input.context ?? { beerLot: 'batch-1', tastingTemperatureC: 12 } };
}

function anchorFor(observation: BrewingReferenceObservationV1, state: ReturnType<typeof stateAt>, relation: 'sameSubject' | 'analogy' | 'unresolved' = 'sameSubject'): BrewingObservationAnchor {
  return createBrewingObservationAnchor({ id: `anchor-${observation.id}-v${observation.version}`, observation, observedState: state,
    subjectRelation: relation, explanation: 'Association explicite pour le test.', createdAt: '2026-10-10T02:00:00.000Z',
    createdBy: { origin: 'user', name: actor.label } });
}

const initialContext = { programReference: null, past: { status: 'unknown' as const }, details: { beer: 'Brassin témoin' } };

function makeHarness() {
  const opened = openBrewingReferenceContext({ ownerKey: 'user-1', contextId: 'tasting-history-1', commandId: 'open-1',
    recordedAt: '2026-10-01T08:00:00.000Z', context: initialContext });
  let record = opened.record;
  const events: BrewingReferenceEvent[] = [opened.event];
  const apply = (command: LocalCommand) => {
    const result = applyBrewingReferenceCommand(record, { ...command, ownerKey: 'user-1', contextId: 'tasting-history-1' } as BrewingReferenceCommandInput, events);
    if (!result.duplicate) { record = result.record; events.push(result.event); }
    return result;
  };
  const recordObservation = (observation: BrewingReferenceObservationV1, commandId = `record-${observation.id}`) => apply({
    commandId, expectedRevision: record.revision, recordedAt: '2026-10-10T03:00:00.000Z', kind: 'observationRecorded', payload: { observation },
  });
  return { apply, recordObservation, events, get record() { return record; } };
}

function readJournal(h: ReturnType<typeof makeHarness>): BrewingReferenceRecordReadV1 {
  const read = readBrewingReferenceRecord(h.record, h.events);
  if ('status' in read) throw Error('Format NR inattendu pour le test.');
  return read;
}

function resolve(h: ReturnType<typeof makeHarness>, anchors: readonly BrewingObservationAnchor[], currentState: ReturnType<typeof stateAt>, requestedDimension: BrewingReferenceObservationDimensionV1 = { status: 'resolved', definition: fruitDefinition }) {
  return resolveCurrentBrewingObservation({ journal: readJournal(h), anchors, currentState, requestedDimension, requiredDependencyIds: ['hopMaterials'] });
}

describe('sélection courante et correction rétrospective de note', () => {
  it('choisit la nouvelle note au même instant par son premier événement, sans réécrire la question figée ni exiger une échelle', () => {
    const h = makeHarness();
    const state = stateAt('2026-10-04T09:00:00.000Z');
    const note3 = note({ id: 'note-3', observedAt: '2026-10-04T09:00:00.000Z', value: 3 });
    const anchor3 = anchorFor(note3, state);
    h.recordObservation(note3);
    const frozenQuestion3 = structuredClone({ observation: note3, anchor: anchor3 });

    const note4 = note({ id: 'note-4', observedAt: note3.observedAt, value: 4, scaleUnknown: true });
    const anchor4 = anchorFor(note4, state);
    h.recordObservation(note4);
    const selection = resolve(h, [anchor3, anchor4], state);

    expect(selection.selected?.observation.id).toBe('note-4');
    expect(selection.selected?.observation.sense).toEqual({ kind: 'sensoryRating', value: 4 });
    expect(selection.selected?.status).toBe('applicable');
    expect(selection.selected?.scaleStatus).toBe('unknown');
    expect(selection.selected?.reasons.join(' ')).toMatch(/pas l’affichage/);
    expect(selection.candidates.map(row => row.observation.id)).toEqual(['note-4', 'note-3']);
    expect(frozenQuestion3).toEqual({ observation: note3, anchor: anchor3 });

    const correction = createBrewingReferenceObservationCorrectionCommand({ journal: readJournal(h),
      expectedObservation: { id: note3.id, version: 1, contentReference: brewingObservationFactReference(note3) },
      commandId: 'correct-note-3', recordedAt: '2026-10-10T04:00:00.000Z', correctedBy, reason: 'Correction du chiffre transcrit.',
      changes: { value: 2, originalText: 'Correction rétrospective : note 2/5.' } });
    h.apply(correction);
    const afterCorrection = resolve(h, [anchor3, anchor4], state);
    expect(afterCorrection.selected?.observation.id).toBe('note-4');
    expect(afterCorrection.candidates.find(row => row.observation.id === 'note-3')?.observation.version).toBe(2);
    expect(afterCorrection.candidates.find(row => row.observation.id === 'note-3')?.firstRecordedOrder)
      .toBe(selection.candidates.find(row => row.observation.id === 'note-3')?.firstRecordedOrder);
    expect(frozenQuestion3).toEqual({ observation: note3, anchor: anchor3 });
  });

  it('trie par instant observé avant le rang de saisie, sans attribuer la priorité à recordedAt', () => {
    const h = makeHarness();
    const state4 = stateAt('2026-10-04T09:00:00.000Z');
    const state5 = stateAt('2026-10-05T09:00:00.000Z');
    const laterNote = note({ id: 'observed-day-5', observedAt: '2026-10-05T09:00:00.000Z', value: 4 });
    const laterAnchor = anchorFor(laterNote, state5);
    h.recordObservation(laterNote, 'record-day-5-first');
    const earlierNote = note({ id: 'observed-day-4', observedAt: '2026-10-04T09:00:00.000Z', value: 3 });
    const earlierAnchor = anchorFor(earlierNote, state4);
    h.recordObservation(earlierNote, 'record-day-4-later');

    const selection = resolve(h, [laterAnchor, earlierAnchor], state5);
    expect(selection.selected?.observation.id).toBe('observed-day-5');
    expect(selection.candidates.map(row => row.observation.id)).toEqual(['observed-day-5', 'observed-day-4']);
    expect(selection.candidates[0].firstRecordedOrder).toBeLessThan(selection.candidates[1].firstRecordedOrder);
  });

  it('corrige une note de quatre jours sous son état original et laisse la note de cinq jours courante', () => {
    const h = makeHarness();
    const factAtFourDays = addition('hop-before-note', '2026-10-04T08:00:00.000Z', 40);
    const state4 = stateAt('2026-10-04T09:00:00.000Z', [factAtFourDays]);
    const note4 = note({ id: 'note-four-days', observedAt: state4.asOf, value: 3, text: 'Transcription 3/5 à quatre jours.' });
    const anchor4 = anchorFor(note4, state4);
    h.recordObservation(note4);

    const factAtFiveDays = addition('hop-after-note', '2026-10-05T08:30:00.000Z', 10);
    const state5 = stateAt('2026-10-05T09:00:00.000Z', [factAtFourDays, factAtFiveDays]);
    const note5 = note({ id: 'note-five-days', observedAt: state5.asOf, value: 5, text: 'Note 5/5 à cinq jours.' });
    const anchor5 = anchorFor(note5, state5);
    h.recordObservation(note5);
    const originalEvent = structuredClone(h.events.find(event => event.kind === 'observationRecorded' && event.payload.observation.id === note4.id));

    const command = createBrewingReferenceObservationCorrectionCommand({ journal: readJournal(h),
      expectedObservation: { id: note4.id, version: 1, contentReference: brewingObservationFactReference(note4) },
      commandId: 'retro-correct-day-4', recordedAt: '2026-10-06T09:00:00.000Z', correctedBy,
      reason: 'Le relevé manuscrit lisait 4 et non 3.', changes: { value: 4, originalText: 'Correction : note 4/5 à quatre jours.' } });
    const applied = h.apply(command);
    const corrected = (applied.event as Extract<BrewingReferenceEvent, { kind: 'observationCorrected' }>).payload.observation;
    expect(corrected.version).toBe(2);
    expect(corrected.author).toEqual(correctedBy);
    expect(corrected.origin).toEqual(note4.origin);
    expect(applied.event).toMatchObject({ kind: 'observationCorrected', payload: { correctsVersion: 1, reason: 'Le relevé manuscrit lisait 4 et non 3.' } });
    expect(corrected.sense).toEqual({ kind: 'sensoryRating', value: 4 });
    expect(corrected.observedAt).toBe(note4.observedAt);
    expect(corrected.subject).toEqual(note4.subject);
    expect(corrected.context).toEqual(note4.context);
    expect(corrected.dimension).toEqual(note4.dimension);
    expect(corrected.scale).toEqual(note4.scale);
    expect(corrected.comparison).toEqual(note4.comparison);
    expect(h.events.find(event => event.kind === 'observationRecorded' && event.payload.observation.id === note4.id)).toEqual(originalEvent);

    const after = resolve(h, [anchor4, anchor5], state5);
    expect(after.selected?.observation.id).toBe('note-five-days');
    expect(after.candidates.find(row => row.observation.id === note4.id)).toMatchObject({
      observation: { version: 2, observedAt: note4.observedAt, sense: { value: 4 } },
      originalObservation: { version: 1, observedAt: note4.observedAt, sense: { value: 3 } },
      anchor: { reference: anchor4.reference }, originalAnchor: { reference: anchor4.reference }, status: 'historical',
    });

    const retry = applyBrewingReferenceCommand(h.record, command, h.events);
    expect(retry.duplicate).toBe(true);
    expect(retry.event).toEqual(applied.event);
    expect(h.events.filter(event => event.kind === 'observationCorrected')).toHaveLength(1);
    expect(() => createBrewingReferenceObservationCorrectionCommand({ journal: readJournal(h),
      expectedObservation: { id: note4.id, version: 1, contentReference: brewingObservationFactReference(note4) },
      commandId: 'stale-original-version', recordedAt: '2026-10-06T09:10:00.000Z', correctedBy, reason: 'Tentative périmée.',
      changes: { value: 2 } })).toThrow(/version ou l’empreinte/);

    const staleCasCommand = createBrewingReferenceObservationCorrectionCommand({ journal: readJournal(h),
      expectedObservation: { id: note5.id, version: 1, contentReference: brewingObservationFactReference(note5) },
      commandId: 'cas-race-correction', recordedAt: '2026-10-06T09:20:00.000Z', correctedBy, reason: 'Correction concurrente.', changes: { value: 4 } });
    h.recordObservation(note({ id: 'note-newer-entry', observedAt: state5.asOf, value: 2 }));
    expect(() => applyBrewingReferenceCommand(h.record, staleCasCommand, h.events)).toThrow(/périmée/);
  });

  it('garde les candidats de dimension, sujet et continuité inconnus sans rapprochement par nom', () => {
    const h = makeHarness();
    const currentState = stateAt('2026-10-04T09:00:00.000Z');
    const requested: BrewingReferenceObservationDimensionV1 = { status: 'resolved', definition: fruitDefinition };

    const scaleUnknown = note({ id: 'scale-unknown', observedAt: currentState.asOf, value: 3, scaleUnknown: true });
    const scaleUnknownAnchor = anchorFor(scaleUnknown, currentState);
    h.recordObservation(scaleUnknown);

    const unresolved = note({ id: 'same-label-unresolved', observedAt: currentState.asOf, dimension: { status: 'unresolved', label: 'Poire' }, qualitative: true, scaleUnknown: true });
    const unresolvedAnchor = anchorFor(unresolved, currentState);
    h.recordObservation(unresolved);

    const mismatch = note({ id: 'different-dimension', observedAt: currentState.asOf, dimension: { status: 'resolved', definition: roastDefinition } });
    const mismatchAnchor = anchorFor(mismatch, currentState);
    h.recordObservation(mismatch);

    const analogy = note({ id: 'analogy-only', observedAt: currentState.asOf, subjectId: 'beer-other', value: 5 });
    const analogyAnchor = anchorFor(analogy, currentState, 'analogy');
    h.recordObservation(analogy);

    const subjectUnknown = note({ id: 'subject-unresolved', observedAt: currentState.asOf, subjectId: 'beer-unknown', value: 3 });
    const subjectUnknownAnchor = anchorFor(subjectUnknown, currentState, 'unresolved');
    h.recordObservation(subjectUnknown);

    const ambiguous = note({ id: 'multiple-anchor-options', observedAt: currentState.asOf, value: 2 });
    const ambiguousAnchorA = anchorFor(ambiguous, currentState);
    const ambiguousAnchorB = createBrewingObservationAnchor({ id: 'alternate-anchor-same-note', observation: ambiguous, observedState: currentState,
      subjectRelation: 'sameSubject', explanation: 'Autre association explicite.', createdAt: '2026-10-10T02:01:00.000Z',
      createdBy: { origin: 'user', name: actor.label } });
    h.recordObservation(ambiguous);

    const unanchored = note({ id: 'anchor-not-supplied', observedAt: currentState.asOf, value: 1 });
    h.recordObservation(unanchored);

    const selection = resolve(h, [scaleUnknownAnchor, unresolvedAnchor, mismatchAnchor, analogyAnchor, subjectUnknownAnchor,
      ambiguousAnchorA, ambiguousAnchorB], currentState, requested);
    expect(selection.selected?.observation.id).toBe('scale-unknown');
    expect(selection.candidates.find(row => row.observation.id === 'scale-unknown')).toMatchObject({ status: 'applicable', scaleStatus: 'unknown' });
    expect(selection.candidates.find(row => row.observation.id === 'same-label-unresolved')).toMatchObject({ status: 'unresolvedDimension', dimensionStatus: 'unresolved' });
    expect(selection.candidates.find(row => row.observation.id === 'different-dimension')).toMatchObject({ status: 'dimensionMismatch', dimensionStatus: 'mismatch' });
    expect(selection.candidates.find(row => row.observation.id === 'analogy-only')).toMatchObject({ status: 'differentSubject' });
    expect(selection.candidates.find(row => row.observation.id === 'subject-unresolved')).toMatchObject({ status: 'unresolvedSubject' });
    expect(selection.candidates.find(row => row.observation.id === 'multiple-anchor-options')).toMatchObject({ status: 'ambiguousAnchor' });
    expect(selection.candidates.find(row => row.observation.id === 'anchor-not-supplied')).toMatchObject({ status: 'noAnchor', anchor: null });
    expect(selection.candidates.find(row => row.observation.id === 'same-label-unresolved')?.reasons.join(' ')).toMatch(/non résolue/);

    const sampleId = identity('sample-4');
    const sampleSubject: BrewingObservedSubjectV1 = { kind: 'sample', identity: sampleId, sourceBeer: beerIdentity,
      collection: { effectiveAt: '2026-10-04T08:00:00.000Z', recordedAt: '2026-10-04T08:01:00.000Z', provenance: source('sample:draw') } };
    const sampleState = stateAt(sampleSubject.collection.effectiveAt, [], sampleSubject);
    const sampleNote = note({ id: 'sample-after-draw', observedAt: '2026-10-04T09:00:00.000Z', value: 3, subjectId: sampleId.id });
    const sampleAnchor = anchorFor(sampleNote, sampleState);
    h.recordObservation(sampleNote);
    const withSample = resolve(h, [scaleUnknownAnchor, unresolvedAnchor, mismatchAnchor, analogyAnchor, sampleAnchor], currentState, requested);
    expect(withSample.candidates.find(row => row.observation.id === sampleNote.id)).toMatchObject({ status: 'continuityUnknown' });
    expect(withSample.candidates.find(row => row.observation.id === sampleNote.id)?.reasons.join(' ')).toMatch(/continuité/);
  });

  it('ne transfère pas une ancre à une ancienne correction générale qui a déplacé le contexte', () => {
    const h = makeHarness();
    const state = stateAt('2026-10-04T09:00:00.000Z');
    const original = note({ id: 'legacy-corrected-note', observedAt: state.asOf, value: 3 });
    const anchor = anchorFor(original, state);
    h.recordObservation(original);
    const displaced = { ...original, version: 2, context: { ...original.context, tastingTemperatureC: 18 },
      originalText: 'Ancienne correction générale.' };
    h.apply({ commandId: 'legacy-general-correction', expectedRevision: h.record.revision, recordedAt: '2026-10-05T09:00:00.000Z',
      kind: 'observationCorrected', payload: { observation: displaced, correctsVersion: 1, reason: 'Correction générale antérieure.' } });

    const unresolved = resolve(h, [anchor], state);
    expect(unresolved.selected).toBeNull();
    expect(unresolved.candidates[0]).toMatchObject({ status: 'invalidCorrectionLineage', originalAnchor: { reference: anchor.reference }, anchor: null });
    expect(unresolved.candidates[0].reasons.join(' ')).toMatch(/sans ancre exacte/);

    const exactNewAnchor = anchorFor(displaced, state);
    const resolved = resolve(h, [anchor, exactNewAnchor], state);
    expect(resolved.selected?.observation.version).toBe(2);
    expect(resolved.selected?.anchor?.reference).toBe(exactNewAnchor.reference);
    expect(resolved.selected?.originalAnchor?.reference).toBe(anchor.reference);
    expect(() => createBrewingReferenceObservationCorrectionCommand({ journal: readJournal(h),
      expectedObservation: { id: displaced.id, version: displaced.version, contentReference: brewingObservationFactReference(displaced) },
      commandId: 'refuse-displaced-lineage', recordedAt: '2026-10-06T09:00:00.000Z', correctedBy, reason: 'Correction ciblée.', changes: { value: 4 } }))
      .toThrow(/filiation contient déjà/);
  });
});
