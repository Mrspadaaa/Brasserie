import { describe, expect, it } from 'vitest';
import {
  BREWING_OBSERVED_STATE_INPUT_VERSION,
  assertBrewingObservedState,
  assessBrewingObservedStateApplicability,
  brewingObservedContactSource,
  brewingObservedFactSource,
  brewingObservedStateContentReference,
  resolveBrewingObservedState,
  type BrewingObservedContactV1,
  type BrewingObservedCoverageV1,
  type BrewingObservedFactV1,
  type BrewingObservedIdentityV1,
  type BrewingObservedSampleContinuityV1,
  type BrewingObservedStateInputV1,
  type BrewingObservedStateV1,
  type BrewingObservedSubjectV1,
} from '../../src/domain/brewingObservedState';

const ref = (id: string, version = '1'): BrewingObservedIdentityV1 => ({ id, version, contentReference: `fixture:${id}:${version}` });
const beer = ref('beer-4');
const sampleRef = ref('sample-17');
const hop = ref('hop-variety-1');
const lotA = ref('hop-lot-A');
const lotB = ref('hop-lot-B');
const source = (reference: string) => ({ kind: 'fixture', reference, description: `Source explicite ${reference}` });
const time = (effectiveAt: string, recordedAt = effectiveAt, reference = `${effectiveAt}:source`) => ({ effectiveAt, recordedAt, provenance: source(reference) });

const beerSubject: BrewingObservedSubjectV1 = { kind: 'beer', identity: beer };
const sampleSubject: BrewingObservedSubjectV1 = { kind: 'sample', identity: sampleRef, sourceBeer: beer,
  collection: time('2026-10-02T09:00:00.000Z', '2026-10-02T09:05:00.000Z', 'sample:draw') };

function addedFact(input: {
  id: string; version?: number; supersedesVersion?: number | null; dependencyId?: string;
  effectiveAt: string; recordedAt?: string; lot?: BrewingObservedIdentityV1; value?: number; unit?: string;
  epistemicStatus?: 'observed' | 'reported' | 'assumed' | 'conflicting'; subjectReference?: BrewingObservedIdentityV1; provenanceReference?: string;
}): BrewingObservedFactV1 {
  const version = input.version ?? 1;
  return { kind: 'materialAdded', id: input.id, version, supersedesVersion: input.supersedesVersion ?? (version === 1 ? null : version - 1),
    subjectReference: input.subjectReference ?? beer, dependencyId: input.dependencyId ?? 'hopMaterials', effectiveAt: input.effectiveAt,
    recordedAt: input.recordedAt ?? input.effectiveAt, epistemicStatus: input.epistemicStatus ?? 'observed',
    provenance: source(input.provenanceReference ?? `fact:${input.id}:v${version}`), material: { status: 'identified', reference: hop },
    lot: input.lot ? { status: 'identified', reference: input.lot } : { status: 'unresolved', label: 'lot', reason: 'Identité du lot non transcrite.' },
    quantity: input.value === undefined || input.unit === undefined ? { status: 'unknown', reason: 'Quantité/unité inconnue.' }
      : { status: 'known', value: input.value, unit: input.unit } };
}

function activeContact(input: {
  id?: string; dependencyId?: string; startedAt?: string; startedRecordedAt?: string; activeThrough?: string;
  activeThroughRecordedAt?: string; endedAt?: string; endedRecordedAt?: string;
} = {}): BrewingObservedContactV1 {
  const id = input.id ?? 'contact-c1';
  return { id, version: 1, supersedesVersion: null, subjectReference: beer, dependencyId: input.dependencyId ?? 'hopContact',
    material: { status: 'identified', reference: hop }, lot: { status: 'identified', reference: lotA },
    started: time(input.startedAt ?? '2026-10-02T06:00:00.000Z', input.startedRecordedAt ?? '2026-10-02T06:01:00.000Z', `${id}:start`),
    ...(input.endedAt ? { ended: time(input.endedAt, input.endedRecordedAt ?? input.endedAt, `${id}:end`) } : {}),
    ...(input.activeThrough ? { activeThrough: time(input.activeThrough, input.activeThroughRecordedAt ?? input.activeThrough, `${id}:active-through`) } : {}),
    epistemicStatus: 'observed' };
}

function completeCoverage(dependencyId: string, throughAt = '2026-10-02T12:00:00.000Z'): BrewingObservedCoverageV1 {
  return { id: `coverage-${dependencyId}`, version: 1, supersedesVersion: null, subjectReference: beer, dependencyId,
    fromAt: '2026-10-02T00:00:00.000Z', throughAt, status: 'complete', recordedAt: '2026-10-02T12:05:00.000Z',
    provenance: source(`coverage:${dependencyId}`) };
}

function stateInput(patch: Partial<BrewingObservedStateInputV1> = {}): BrewingObservedStateInputV1 {
  return { format: BREWING_OBSERVED_STATE_INPUT_VERSION, subject: beerSubject,
    asOf: '2026-10-02T09:00:00.000Z', knowledgeAsOf: '2026-10-02T12:30:00.000Z',
    knowledgeReference: ref('history-snapshot', 'v4'), facts: [], contacts: [], coverage: [], sampleContinuity: [], ...patch };
}

const dimension = { status: 'resolved' as const, id: 'fruit-facet', version: 'v1' };
const noteRef = ref('note-9', 'v1');

describe('état physique observé, versionné par fait et par coupure', () => {
  it('résout l’échantillon à son instant de prélèvement, garde le lot postérieur dehors et calcule seulement le contact attesté', () => {
    const continuity: BrewingObservedSampleContinuityV1 = { id: 'sample-preservation', version: 1, supersedesVersion: null, sampleReference: sampleRef,
      fromAt: '2026-10-02T09:00:00.000Z', throughAt: '2026-10-02T10:00:00.000Z', status: 'preserved',
      recordedAt: '2026-10-02T10:05:00.000Z', provenance: source('sample custody log') };
    const input = stateInput({ subject: sampleSubject, asOf: sampleSubject.collection.effectiveAt,
      facts: [
        addedFact({ id: 'hop-before-draw', effectiveAt: '2026-10-02T08:00:00.000Z', recordedAt: '2026-10-02T08:02:00.000Z', lot: lotA, value: 40, unit: 'g' }),
        addedFact({ id: 'hop-after-draw', effectiveAt: '2026-10-02T09:30:00.000Z', recordedAt: '2026-10-02T09:31:00.000Z', lot: lotB, value: 20, unit: 'g' }),
      ],
      contacts: [activeContact({ activeThrough: '2026-10-02T12:00:00.000Z', activeThroughRecordedAt: '2026-10-02T12:05:00.000Z' })],
      coverage: [completeCoverage('hopMaterials'), completeCoverage('hopContact')],
      sampleContinuity: [continuity],
    });
    const state = resolveBrewingObservedState(input);
    expect(state.subject).toEqual(sampleSubject);
    expect(state.facts).toEqual(input.facts);
    expect(state.factDispositions.map(row => [row.id, row.disposition])).toEqual([['hop-before-draw', 'effective'], ['hop-after-draw', 'afterCutoff']]);
    expect(state.contactStates).toHaveLength(1);
    expect(state.contactStates[0]).toMatchObject({ status: 'active', elapsedSeconds: 3 * 60 * 60, lot: { status: 'identified', reference: lotA } });
    expect(state.contactStates[0]).not.toHaveProperty('lowerBoundSeconds');
    expect(state.dependencies.find(row => row.id === 'hopMaterials')?.factReferences).toHaveLength(1);
    assertBrewingObservedState(state);
    const beerAfterLaterAddition = resolveBrewingObservedState({ ...input, subject: beerSubject, asOf: '2026-10-02T10:00:00.000Z', sampleContinuity: [] });
    const anchor = { observationReference: noteRef, observedAt: '2026-10-02T09:05:00.000Z', state, dimension };
    expect(assessBrewingObservedStateApplicability({ use: 'comparePrediction', anchor, evaluationState: beerAfterLaterAddition,
      requiredDependencyIds: ['hopMaterials'] }).status).toBe('historical');
  });

  it('ne somme pas des unités différentes et ne déduit pas un retrait absent', () => {
    const explicitRemoval: BrewingObservedFactV1 = { kind: 'materialRemoved', id: 'withdrawal', version: 1, supersedesVersion: null,
      subjectReference: beer, dependencyId: 'hopMaterials', effectiveAt: '2026-10-02T08:00:00.000Z', recordedAt: '2026-10-02T08:01:00.000Z',
      epistemicStatus: 'observed', provenance: source('fact:withdrawal'), material: { status: 'identified', reference: hop },
      lot: { status: 'identified', reference: lotA }, quantity: { status: 'known', value: 10, unit: 'g' } };
    const unitlessAmount: BrewingObservedFactV1 = { kind: 'materialAdded', id: 'unitless-amount', version: 1, supersedesVersion: null,
      subjectReference: beer, dependencyId: 'hopMaterials', effectiveAt: '2026-10-02T08:10:00.000Z', recordedAt: '2026-10-02T08:11:00.000Z',
      epistemicStatus: 'reported', provenance: source('fact:unitless'), material: { status: 'identified', reference: hop },
      lot: { status: 'identified', reference: lotB }, quantity: { status: 'unitUnknown', value: 7.5, rawUnit: 'unit field absent', reason: 'La source n’a pas fourni d’unité exploitable.' } };
    const input = stateInput({ facts: [
      addedFact({ id: 'grams', effectiveAt: '2026-10-02T07:00:00.000Z', recordedAt: '2026-10-02T07:01:00.000Z', value: 500, unit: 'g' }),
      addedFact({ id: 'kilograms', effectiveAt: '2026-10-02T07:30:00.000Z', recordedAt: '2026-10-02T07:31:00.000Z', lot: lotB, value: 0.5, unit: 'kg' }),
      explicitRemoval,
      unitlessAmount,
      addedFact({ id: 'amount-unknown', dependencyId: 'unquantifiedMaterial', effectiveAt: '2026-10-02T08:15:00.000Z', recordedAt: '2026-10-02T08:16:00.000Z' }),
    ], coverage: [completeCoverage('hopMaterials'), completeCoverage('unquantifiedMaterial')] });
    const state = resolveBrewingObservedState(input);
    expect(state.facts.map(row => row.kind)).toEqual(['materialAdded', 'materialAdded', 'materialRemoved', 'materialAdded', 'materialAdded']);
    expect(state.facts.slice(0, 3).map(row => row.kind === 'materialAdded' || row.kind === 'materialRemoved' ? row.quantity : null)).toEqual([
      { status: 'known', value: 500, unit: 'g' }, { status: 'known', value: 0.5, unit: 'kg' }, { status: 'known', value: 10, unit: 'g' },
    ]);
    expect(state.facts[3].kind === 'materialAdded' && state.facts[3].quantity).toMatchObject({ status: 'unitUnknown', value: 7.5, rawUnit: 'unit field absent' });
    expect(state.facts[4].kind === 'materialAdded' && state.facts[4].quantity).toMatchObject({ status: 'unknown' });
    expect(state.dependencies.find(row => row.id === 'hopMaterials')).toMatchObject({ status: 'partial' });
    expect(state.dependencies.find(row => row.id === 'hopMaterials')?.reasons.join(' ')).toMatch(/aucune conversion ou agrégation/);
    expect(state.facts.some(row => row.kind === 'materialRemoved')).toBe(true);
  });

  it('expose une borne basse sans plafonner un contact, et une fin observée fixe sa durée réelle', () => {
    const partial = resolveBrewingObservedState(stateInput({ contacts: [activeContact({ activeThrough: '2026-10-02T10:00:00.000Z' })],
      asOf: '2026-10-02T12:00:00.000Z', knowledgeAsOf: '2026-10-02T12:10:00.000Z', coverage: [completeCoverage('hopContact', '2026-10-02T12:00:00.000Z')] }));
    expect(partial.contactStates[0]).toMatchObject({ status: 'continuityUnknown', lowerBoundSeconds: 4 * 60 * 60 });
    expect(partial.contactStates[0]).not.toHaveProperty('elapsedSeconds');

    const ended = resolveBrewingObservedState(stateInput({ contacts: [activeContact({ endedAt: '2026-10-02T14:00:00.000Z', endedRecordedAt: '2026-10-02T14:05:00.000Z' })],
      asOf: '2026-10-02T12:00:00.000Z', knowledgeAsOf: '2026-10-02T14:30:00.000Z', coverage: [completeCoverage('hopContact', '2026-10-02T14:00:00.000Z')] }));
    expect(ended.contactStates[0]).toMatchObject({ status: 'active', elapsedSeconds: 6 * 60 * 60 });
  });

  it('conserve les faits dont les dates ou les bornes de contact sont contradictoires, sans les résoudre comme du réalisé', () => {
    const impossibleFact = addedFact({ id: 'future-recorded-as-past', effectiveAt: '2026-10-02T11:00:00.000Z', recordedAt: '2026-10-02T10:00:00.000Z', value: 30, unit: 'g' });
    const reversedContact = activeContact({ id: 'reversed-contact', startedAt: '2026-10-02T06:00:00.000Z', startedRecordedAt: '2026-10-02T06:01:00.000Z',
      endedAt: '2026-10-02T05:30:00.000Z', endedRecordedAt: '2026-10-02T06:02:00.000Z' });
    const reversedCoverage: BrewingObservedCoverageV1 = { ...completeCoverage('reversedScope'), id: 'reversed-coverage',
      fromAt: '2026-10-02T10:00:00.000Z', throughAt: '2026-10-02T08:00:00.000Z' };
    const state = resolveBrewingObservedState(stateInput({ facts: [impossibleFact], contacts: [reversedContact], coverage: [reversedCoverage] }));
    expect(state.facts).toEqual([impossibleFact]);
    expect(state.factDispositions[0].disposition).toBe('conflicting');
    expect(state.contactStates[0]).toMatchObject({ status: 'conflicting' });
    expect(state.coverageDispositions[0].disposition).toBe('conflicting');
    expect(state.status).toBe('conflicting');
    assertBrewingObservedState(state);
  });

  it('conserve une condition observée avec sa valeur et son unité sources, sans normaliser', () => {
    const condition: BrewingObservedFactV1 = { kind: 'condition', id: 'condition-1', version: 1, supersedesVersion: null,
      subjectReference: beer, dependencyId: 'fermentationTemperature', effectiveAt: '2026-10-02T08:00:00.000Z', recordedAt: '2026-10-02T08:05:00.000Z',
      epistemicStatus: 'reported', provenance: source('thermometer log'), property: 'condition:liquid-temperature',
      value: { status: 'known', value: 18, unit: '°C' } };
    const state = resolveBrewingObservedState(stateInput({ facts: [condition], coverage: [completeCoverage('fermentationTemperature')] }));
    expect(state.facts).toEqual([condition]);
    expect(state.factDispositions[0].disposition).toBe('effective');
    expect(state.dependencies.find(row => row.id === 'fermentationTemperature')).toMatchObject({ status: 'available' });
    assertBrewingObservedState(state);
  });

  it('rejoue une correction rétrospective selon la coupe de connaissance sans muter l’ancienne résolution', () => {
    const history = [
      addedFact({ id: 'corrected-addition', version: 1, supersedesVersion: null, effectiveAt: '2026-10-02T10:00:00.000Z', recordedAt: '2026-10-02T10:01:00.000Z', value: 50, unit: 'g' }),
      addedFact({ id: 'corrected-addition', version: 2, supersedesVersion: 1, effectiveAt: '2026-10-02T08:00:00.000Z', recordedAt: '2026-10-02T11:00:00.000Z', value: 50, unit: 'g' }),
    ];
    const earlyInput = stateInput({ asOf: '2026-10-02T09:00:00.000Z', knowledgeAsOf: '2026-10-02T10:30:00.000Z', facts: history,
      knowledgeReference: ref('history-snapshot', 'v1'), coverage: [completeCoverage('hopMaterials')] });
    const early = resolveBrewingObservedState(earlyInput);
    expect(early.factDispositions.map(row => row.disposition)).toEqual(['afterCutoff', 'notYetKnown']);
    const before = structuredClone(early);
    const corrected = resolveBrewingObservedState({ ...earlyInput, knowledgeAsOf: '2026-10-02T12:00:00.000Z', knowledgeReference: ref('history-snapshot', 'v2') });
    expect(corrected.factDispositions.map(row => row.disposition)).toEqual(['superseded', 'effective']);
    expect(corrected.physicalStateReference).not.toBe(early.physicalStateReference);
    expect(early).toEqual(before);
    assertBrewingObservedState(early);
  });

  it('ne périme pas une dimension sur l’empreinte globale; seule une dépendance requise modifiée rend la note historique', () => {
    const facts = [addedFact({ id: 'hop-mass', dependencyId: 'hopMaterials', effectiveAt: '2026-10-02T07:00:00.000Z', recordedAt: '2026-10-02T07:02:00.000Z', lot: lotA, value: 40, unit: 'g' })];
    const firstInput = stateInput({ asOf: '2026-10-02T09:00:00.000Z', facts, contacts: [activeContact({ activeThrough: '2026-10-02T12:00:00.000Z' })],
      coverage: [completeCoverage('hopMaterials'), completeCoverage('hopContact')] });
    const anchorState = resolveBrewingObservedState(firstInput);
    const metadataOnly = resolveBrewingObservedState({ ...firstInput, knowledgeReference: ref('history-snapshot', 'v5'),
      facts: firstInput.facts.map(fact => ({ ...fact, recordedAt: '2026-10-02T08:10:00.000Z', provenance: source('same physical event, later recorded metadata') })) });
    expect(metadataOnly.resolutionReference).not.toBe(anchorState.resolutionReference);
    expect(metadataOnly.physicalStateReference).toBe(anchorState.physicalStateReference);
    const anchor = { observationReference: noteRef, observedAt: '2026-10-02T09:05:00.000Z', state: anchorState, dimension };
    const samePhysical = assessBrewingObservedStateApplicability({ use: 'describeCurrent', anchor, evaluationState: metadataOnly, requiredDependencyIds: ['hopMaterials'] });
    expect(samePhysical.status).toBe('applicable');

    const sampleInput = stateInput({ subject: sampleSubject, asOf: sampleSubject.collection.effectiveAt,
      facts: [addedFact({ id: 'sample-hop-mass', dependencyId: 'hopMaterials', effectiveAt: '2026-10-02T08:00:00.000Z', recordedAt: '2026-10-02T08:02:00.000Z', lot: lotA, value: 40, unit: 'g' })],
      coverage: [completeCoverage('hopMaterials')] });
    const sampleStateA = resolveBrewingObservedState(sampleInput);
    const revisedSampleSubject: BrewingObservedSubjectV1 = { ...sampleSubject,
      collection: { ...sampleSubject.collection, recordedAt: '2026-10-02T09:10:00.000Z', provenance: source('collection date transcribed later') } };
    const sampleStateB = resolveBrewingObservedState({ ...sampleInput, subject: revisedSampleSubject, knowledgeReference: ref('sample-history', 'v2') });
    expect(sampleStateB.resolutionReference).not.toBe(sampleStateA.resolutionReference);
    expect(sampleStateB.physicalStateReference).toBe(sampleStateA.physicalStateReference);
    expect(assessBrewingObservedStateApplicability({ use: 'describeCurrent',
      anchor: { observationReference: noteRef, observedAt: sampleSubject.collection.effectiveAt, state: sampleStateA, dimension },
      evaluationState: sampleStateB, requiredDependencyIds: ['hopMaterials'] }).status).toBe('applicable');

    const laterState = resolveBrewingObservedState({ ...firstInput, asOf: '2026-10-02T10:00:00.000Z' });
    expect(laterState.physicalStateReference).not.toBe(anchorState.physicalStateReference);
    expect(assessBrewingObservedStateApplicability({ use: 'describeCurrent', anchor, evaluationState: laterState, requiredDependencyIds: ['hopMaterials'] }).status).toBe('applicable');
    expect(assessBrewingObservedStateApplicability({ use: 'describeCurrent', anchor, evaluationState: laterState, requiredDependencyIds: ['hopContact'] }).status).toBe('historical');
    expect(assessBrewingObservedStateApplicability({ use: 'comparePrediction', anchor, evaluationState: laterState, requiredDependencyIds: ['hopContact'] }).status).toBe('historical');
    expect(assessBrewingObservedStateApplicability({ use: 'projectFuture', anchor, evaluationState: laterState, requiredDependencyIds: ['hopMaterials'] }).status).toBe('applicable');
  });

  it('ne suppose pas la continuité d’un échantillon entre prélèvement et dégustation', () => {
    const input = stateInput({ subject: sampleSubject, asOf: sampleSubject.collection.effectiveAt, knowledgeAsOf: '2026-10-02T10:30:00.000Z',
      coverage: [completeCoverage('hopMaterials')] });
    const noContinuity = resolveBrewingObservedState(input);
    const anchor = { observationReference: noteRef, observedAt: '2026-10-02T10:00:00.000Z', state: noContinuity, dimension };
    expect(assessBrewingObservedStateApplicability({ use: 'projectFuture', anchor, requiredDependencyIds: [] }).status).toBe('continuityUnknown');

    const continuity: BrewingObservedSampleContinuityV1 = { id: 'sample-preservation', version: 1, supersedesVersion: null, sampleReference: sampleRef,
      fromAt: '2026-10-02T09:00:00.000Z', throughAt: '2026-10-02T10:00:00.000Z', status: 'preserved',
      recordedAt: '2026-10-02T10:05:00.000Z', provenance: source('sample custody log') };
    const continuityCorrection: BrewingObservedSampleContinuityV1 = { ...continuity, version: 2, supersedesVersion: 1,
      throughAt: '2026-10-02T09:30:00.000Z', status: 'changed', recordedAt: '2026-10-02T10:10:00.000Z', provenance: source('corrected sample custody record') };
    const preserved = resolveBrewingObservedState({ ...input, knowledgeAsOf: '2026-10-02T10:06:00.000Z', sampleContinuity: [continuity, continuityCorrection] });
    expect(preserved.physicalStateReference).toBe(noContinuity.physicalStateReference);
    expect(preserved.resolutionReference).not.toBe(noContinuity.resolutionReference);
    expect(assessBrewingObservedStateApplicability({ use: 'projectFuture', anchor: { ...anchor, state: preserved }, requiredDependencyIds: [] }).status).toBe('applicable');

    const changed = resolveBrewingObservedState({ ...input, sampleContinuity: [continuity, continuityCorrection] });
    expect(changed.physicalStateReference).toBe(noContinuity.physicalStateReference);
    expect(changed.resolutionReference).not.toBe(preserved.resolutionReference);
    expect(assessBrewingObservedStateApplicability({ use: 'projectFuture', anchor: { ...anchor, state: changed }, requiredDependencyIds: [] }).status).toBe('historical');
  });

  it('refuse les champs planifiés et des sujets similaires sans identité commune', () => {
    const input = stateInput({ facts: [addedFact({ id: 'actual-addition', effectiveAt: '2026-10-02T08:00:00.000Z', value: 30, unit: 'g' })], coverage: [completeCoverage('hopMaterials')] });
    expect(() => resolveBrewingObservedState({ ...input, facts: [{ ...input.facts[0], planned: true }] } as any)).toThrow(/champ non pris en charge/);
    expect(() => resolveBrewingObservedState({ ...input, targetDurationSeconds: 48 * 60 * 60 } as any)).toThrow(/champ non pris en charge/);
    const state = resolveBrewingObservedState(input);
    const otherBeer = resolveBrewingObservedState({ ...input, subject: { kind: 'beer', identity: ref('beer-similar-name') } });
    expect(assessBrewingObservedStateApplicability({ use: 'comparePrediction', anchor: { observationReference: noteRef, observedAt: input.asOf, state, dimension },
      evaluationState: otherBeer, requiredDependencyIds: ['hopMaterials'] }).status).toBe('differentSubject');
  });

  it('compare les instants ISO avec fuseau sans perdre les valeurs textuelles ni inventer la continuité', () => {
    const sameInstantStart = activeContact({ id: 'offset-start', startedAt: '2026-10-02T02:00:00.000+02:00',
      startedRecordedAt: '2026-10-02T00:00:00.000Z', activeThrough: '2026-10-02T06:00:00.000Z',
      activeThroughRecordedAt: '2026-10-02T06:00:00.000Z' });
    const sixHours = resolveBrewingObservedState(stateInput({ asOf: '2026-10-02T06:00:00.000Z',
      knowledgeAsOf: '2026-10-02T12:30:00.000Z', contacts: [sameInstantStart], coverage: [completeCoverage('hopContact', '2026-10-02T06:00:00.000Z')] }));
    expect(sixHours.contactStates[0]).toMatchObject({ status: 'active', elapsedSeconds: 6 * 60 * 60 });
    expect(sixHours.contactStates[0].startedAt).toBe('2026-10-02T02:00:00.000+02:00');
    assertBrewingObservedState(sixHours);

    const futureAttestation = activeContact({ id: 'offset-future-attestation', startedAt: '2026-10-02T00:00:00.000Z',
      startedRecordedAt: '2026-10-02T00:00:00.000Z', activeThrough: '2026-10-02T00:30:00.000-02:00',
      activeThroughRecordedAt: '2026-10-02T01:00:00.000Z' });
    const conflicting = resolveBrewingObservedState(stateInput({ asOf: '2026-10-02T01:00:00.000Z',
      knowledgeAsOf: '2026-10-02T12:30:00.000Z', contacts: [futureAttestation], coverage: [completeCoverage('hopContact', '2026-10-02T01:00:00.000Z')] }));
    expect(Date.parse(futureAttestation.activeThrough!.effectiveAt)).toBeGreaterThan(Date.parse(futureAttestation.activeThrough!.recordedAt));
    expect(conflicting.contactStates[0]).toMatchObject({ status: 'conflicting' });
    expect(conflicting.contactStates[0].reason).toMatch(/enregistrée avant son effet/);
    expect(conflicting.contacts[0].activeThrough?.effectiveAt).toBe('2026-10-02T00:30:00.000-02:00');

    const offsetSample: BrewingObservedSubjectV1 = { kind: 'sample', identity: sampleRef, sourceBeer: beer,
      collection: time('2026-10-02T08:00:00.000+02:00', '2026-10-02T06:00:00.000Z', 'sample:offset-draw') };
    const sampled = resolveBrewingObservedState(stateInput({ subject: offsetSample, asOf: '2026-10-02T06:00:00.000Z',
      facts: [addedFact({ id: 'sample-offset-hop', effectiveAt: '2026-10-02T05:00:00.000Z', recordedAt: '2026-10-02T05:01:00.000Z', value: 20, unit: 'g' })] }));
    expect(sampled.subject.kind === 'sample' && sampled.subject.collection.effectiveAt).toBe('2026-10-02T08:00:00.000+02:00');
    expect(assertBrewingObservedState(sampled)).toBeUndefined();
    const applicability = assessBrewingObservedStateApplicability({ use: 'projectFuture',
      anchor: { observationReference: noteRef, observedAt: '2026-10-02T07:00:00.000Z', state: sampled, dimension }, requiredDependencyIds: [] });
    expect(applicability.status).toBe('continuityUnknown');

    const offsetContinuity: BrewingObservedSampleContinuityV1 = { id: 'offset-continuity', version: 1, supersedesVersion: null,
      sampleReference: sampleRef, fromAt: '2026-10-02T06:00:00.000Z', throughAt: '2026-10-02T07:30:00.000Z', status: 'preserved',
      recordedAt: '2026-10-02T07:40:00.000Z', provenance: source('sample:offset-continuity') };
    const preservedSample = resolveBrewingObservedState({
      ...stateInput({ subject: offsetSample, asOf: '2026-10-02T06:00:00.000Z',
        facts: [addedFact({ id: 'sample-offset-hop', effectiveAt: '2026-10-02T05:00:00.000Z', recordedAt: '2026-10-02T05:01:00.000Z', value: 20, unit: 'g' })] }),
      sampleContinuity: [offsetContinuity],
    });
    expect(assessBrewingObservedStateApplicability({ use: 'projectFuture',
      anchor: { observationReference: noteRef, observedAt: '2026-10-02T07:00:00.000Z', state: preservedSample, dimension }, requiredDependencyIds: [] }).status).toBe('applicable');
  });

  it('isole les IDs locaux de faits, contacts et complétude par sujet et résout les sources par empreinte exacte', () => {
    const baseInput = stateInput({
      facts: [addedFact({ id: 'local-fact', effectiveAt: '2026-10-02T07:00:00.000Z', recordedAt: '2026-10-02T07:01:00.000Z', value: 20, unit: 'g' })],
      contacts: [activeContact({ id: 'local-contact', startedAt: '2026-10-02T06:00:00.000Z', startedRecordedAt: '2026-10-02T06:01:00.000Z', activeThrough: '2026-10-02T09:00:00.000Z' })],
      coverage: [completeCoverage('hopMaterials'), completeCoverage('hopContact')],
    });
    const baseline = resolveBrewingObservedState(baseInput);
    const otherSubject = ref('other-subject');
    const localFact = baseInput.facts[0] as BrewingObservedFactV1 & { kind: 'materialAdded' };
    const foreignFact: BrewingObservedFactV1 = { ...localFact, subjectReference: otherSubject,
      quantity: { status: 'known', value: 999, unit: 'kg' } };
    const localContact = baseInput.contacts[0];
    const foreignContact: BrewingObservedContactV1 = { ...localContact, subjectReference: otherSubject,
      started: time(localContact.started.effectiveAt, localContact.started.recordedAt, 'foreign-contact-start') };
    const localCoverage = baseInput.coverage[0];
    const foreignCoverage: BrewingObservedCoverageV1 = { ...localCoverage, subjectReference: otherSubject, status: 'conflicting' };
    const colliding = resolveBrewingObservedState({ ...baseInput, facts: [localFact, foreignFact],
      contacts: [foreignContact, localContact], coverage: [foreignCoverage, ...baseInput.coverage] });
    assertBrewingObservedState(colliding);
    expect(colliding.factDispositions.map(row => row.disposition)).toEqual(['effective', 'otherSubject']);
    expect(colliding.contactDispositions.map(row => row.disposition)).toEqual(['otherSubject', 'effective']);
    expect(colliding.coverageDispositions[0].disposition).toBe('otherSubject');
    expect(colliding.physicalStateReference).toBe(baseline.physicalStateReference);
    expect(colliding.dependencies).toEqual(baseline.dependencies);
    const differentId = resolveBrewingObservedState({ ...baseInput, facts: [localFact, { ...foreignFact, id: 'foreign-addition' }] });
    expect(differentId.factDispositions.map(row => row.disposition)).toEqual(['effective', 'otherSubject']);
    expect(differentId.physicalStateReference).toBe(baseline.physicalStateReference);

    const localFactReference = colliding.factDispositions.find(row => row.disposition === 'effective')!.reference;
    const foreignFactReference = colliding.factDispositions.find(row => row.disposition === 'otherSubject')!.reference;
    expect(brewingObservedFactSource(colliding, localFactReference)).toEqual(localFact);
    expect(brewingObservedFactSource(colliding, foreignFactReference)).toEqual(foreignFact);
    expect(brewingObservedFactSource(colliding, 'missing-fact-reference')).toBeNull();

    const localContactReference = colliding.contactDispositions.find(row => row.disposition === 'effective')!.reference;
    const foreignContactReference = colliding.contactDispositions.find(row => row.disposition === 'otherSubject')!.reference;
    expect(brewingObservedContactSource(colliding, localContactReference)).toEqual(localContact);
    expect(brewingObservedContactSource(colliding, foreignContactReference)).toEqual(foreignContact);
    expect(brewingObservedContactSource(colliding, 'missing-contact-reference')).toBeNull();
  });

  it('le validateur relit un snapshot archivé sans résolution et refuse son altération', () => {
    const state = resolveBrewingObservedState(stateInput({ facts: [addedFact({ id: 'stored', effectiveAt: '2026-10-02T08:00:00.000Z', value: 1, unit: 'kg' })],
      coverage: [completeCoverage('hopMaterials')] }));
    expect(brewingObservedStateContentReference(state)).toBe(state.resolutionReference);
    expect(() => assertBrewingObservedState({ ...state, physicalStateReference: 'changed' })).toThrow(/Identité du snapshot physique/);
    expect(() => assertBrewingObservedState({ ...state, resolutionReference: 'changed' })).toThrow(/Empreinte du snapshot/);
    expect(() => assertBrewingObservedState({ ...state, facts: [{ ...state.facts[0], effectiveAt: '2026-10-02T07:00:00.000Z' }] })).toThrow(/Disposition de fait sans snapshot source exact/);
    expect(assertBrewingObservedState(state)).toBeUndefined();
  });
});

