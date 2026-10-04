import { describe, expect, it } from 'vitest';
import {
  buildBrewingScenarioRequest,
  simulateBrewingScenario,
  type BrewingScenarioRequest,
  type BrewingScenarioResult,
  type BrewingScenarioRuntime,
} from '../../src/domain/brewingScenario';
import {
  applyBrewingScenarioEvent,
  assertBrewingScenarioSizeLimit,
  createBrewingScenarioBranchPreferenceEvent,
  createBrewingScenarioDossier,
  createBrewingScenarioObservationEvent,
  createBrewingScenarioResultRevisionEvent,
  readBrewingScenarioEvent,
  readBrewingScenarioRecord,
  BrewingScenarioDossierError,
  type BrewingScenarioEventV1,
} from '../../src/domain/brewingScenarioDossier';
import { testHopData, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';

const recipe = (): HopRecipeInput => ({
  volumeL: 24,
  yeastId: testHopYeast.id,
  additions: [{ id: 'hop-1', name: 'Lot témoin', triplet: structuredClone(testHopTriplet) }],
  fermentation: [{ kind: 'primaire', tempC: 20, days: 7 }],
});

const runtime: BrewingScenarioRuntime = { engineData: testHopData(), materials: [] };

function run(revision: number): BrewingScenarioResult {
  const request: BrewingScenarioRequest = buildBrewingScenarioRequest({
    scenarioId: 'scenario-test', revision,
    baseline: { kind: 'hypothetical', label: 'Base', input: recipe() },
  });
  return simulateBrewingScenario(request, structuredClone(runtime));
}

describe('Dossier de scénario brassicole', () => {
  it('archive la requête, le résultat complet et ses dépendances sans rejouer le moteur à la relecture', () => {
    const result = run(1);
    const created = createBrewingScenarioDossier({ ownerKey: 'compte-a', scenarioId: result.scenarioId,
      eventId: 'event-initial', recordedAt: '2026-10-01T10:00:00.000Z', result });
    const read = readBrewingScenarioRecord(created.dossier, [created.event]);

    expect(created.dossier.currentSnapshotReference).toBe(result.reference);
    expect(created.event.payload.snapshot.result.requestSnapshot).toEqual(result.requestSnapshot);
    const dependencies = created.event.payload.snapshot.result.baseline.dependencySnapshot;
    expect(dependencies.engineData.varieties).toContainEqual(runtime.engineData.varieties[0]);
    expect(dependencies.engineData.knowledge).toContainEqual(testHopYeast);
    expect(dependencies.engineData.knowledge.some(row => row.kind === 'model')).toBe(true);
    expect(dependencies.engineData.lots).toEqual([]);
    expect(dependencies.reference).toContain('brewing-scenario-dependencies-v1:sha256:');
    expect(read).toMatchObject({ dossier: created.dossier, currentSnapshot: created.event.payload.snapshot });
    if ('status' in read) throw new Error('Le dossier créé doit être lisible.');
    expect(read.currentSnapshot.result).toEqual(result);
  });

  it('garde préférence et observations qualitatives contradictoires séparées du résultat, puis conserve chaque révision', () => {
    const first = run(1);
    const created = createBrewingScenarioDossier({ ownerKey: 'compte-a', scenarioId: first.scenarioId,
      eventId: 'event-initial', recordedAt: '2026-10-01T10:00:00.000Z', result: first });
    const events: BrewingScenarioEventV1[] = [created.event];
    let dossier = created.dossier;
    const baseline = first.baseline;

    const preference = createBrewingScenarioBranchPreferenceEvent({ ownerKey: 'compte-a', scenarioId: first.scenarioId,
      eventId: 'event-pref', expectedRevision: 1, recordedAt: '2026-10-01T10:01:00.000Z', preferenceId: 'pref-1',
      snapshotReference: first.reference, branchId: baseline.id, branchReference: baseline.reference, reason: 'Comparer la base.' });
    dossier = applyBrewingScenarioEvent(dossier, preference, events); events.push(preference);

    const favorable = createBrewingScenarioObservationEvent({ ownerKey: 'compte-a', scenarioId: first.scenarioId,
      eventId: 'event-observation-1', expectedRevision: 2, recordedAt: '2026-10-01T11:00:00.000Z',
      observationId: 'observation-1', observedAt: '2026-10-01T11:00:00.000Z', snapshotReference: first.reference,
      branchId: baseline.id, observation: { kind: 'qualitative', dimension: 'arôme', reported: 'fruité en bouche', method: 'dégustation' } });
    dossier = applyBrewingScenarioEvent(dossier, favorable, events); events.push(favorable);

    const contradictory = createBrewingScenarioObservationEvent({ ownerKey: 'compte-a', scenarioId: first.scenarioId,
      eventId: 'event-observation-2', expectedRevision: 3, recordedAt: '2026-10-01T12:00:00.000Z',
      observationId: 'observation-2', observedAt: '2026-10-01T12:00:00.000Z', snapshotReference: first.reference,
      branchId: baseline.id, observation: { kind: 'qualitative', dimension: 'arôme', reported: 'aucun fruité perceptible', method: 'dégustation' } });
    dossier = applyBrewingScenarioEvent(dossier, contradictory, events); events.push(contradictory);
    expect(dossier.currentSnapshotReference).toBe(first.reference);

    const second = run(2);
    const wrongPredecessor = createBrewingScenarioResultRevisionEvent({ ownerKey: 'compte-a', scenarioId: first.scenarioId,
      eventId: 'event-revision-wrong', expectedRevision: 4, recordedAt: '2026-10-02T09:59:00.000Z',
      previousSnapshotReference: 'un-snapshot-different', reason: 'Référence volontairement périmée.', result: second });
    expect(() => applyBrewingScenarioEvent(dossier, wrongPredecessor, events)).toThrow(BrewingScenarioDossierError);
    const revision = createBrewingScenarioResultRevisionEvent({ ownerKey: 'compte-a', scenarioId: first.scenarioId,
      eventId: 'event-revision', expectedRevision: 4, recordedAt: '2026-10-02T10:00:00.000Z',
      previousSnapshotReference: first.reference, reason: 'Nouvelle projection de scénario.', result: second });
    dossier = applyBrewingScenarioEvent(dossier, revision, events); events.push(revision);
    const read = readBrewingScenarioRecord(dossier, events);

    expect(dossier.currentSnapshotReference).toBe(second.reference);
    expect(dossier.preferredBranch?.snapshotReference).toBe(first.reference);
    expect(dossier.preferredBranch?.branchId).toBe('baseline');
    expect(read).toMatchObject({ snapshots: [{ result: { revision: 1 } }, { result: { revision: 2 } }] });
    if ('status' in read) throw new Error('Le dossier révisé doit être lisible.');
    expect(read.events.filter(event => event.kind === 'observationAppended')).toHaveLength(2);
    expect(read.snapshots[0].result).toEqual(first);
    expect(read.currentSnapshot.result).toEqual(second);
  });

  it('ne réinterprète pas les formats futurs et refuse de tronquer un snapshot trop volumineux', () => {
    const result = run(1);
    const created = createBrewingScenarioDossier({ ownerKey: 'compte-a', scenarioId: result.scenarioId,
      eventId: 'event-initial', recordedAt: '2026-10-01T10:00:00.000Z', result });
    const futureEvent = structuredClone(created.event) as any;
    futureEvent.payload.snapshot.result.version = 'brewing-scenario-vNext';
    const unsupported = readBrewingScenarioRecord(created.dossier, [futureEvent]);
    expect(unsupported).toMatchObject({ status: 'unsupportedFormat', reason: 'resultVersion', raw: { events: [futureEvent] } });
    expect(readBrewingScenarioEvent(futureEvent)).toMatchObject({ status: 'unsupportedEventFormat', reason: 'resultVersion', raw: futureEvent });

    expect(() => assertBrewingScenarioSizeLimit(created.event, 64)).toThrow(BrewingScenarioDossierError);
    try { assertBrewingScenarioSizeLimit(created.event, 64); }
    catch (error) { expect(error).toMatchObject({ code: 'sizeLimit' }); }
  });

  it('refuse les timestamps non ISO et les fausses provenances d’observation', () => {
    const result = run(1);
    const common = { ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'observation', expectedRevision: 1,
      recordedAt: '2026-10-01T10:00:00.000Z', observationId: 'observation-1', observedAt: '2026-10-01T10:00:00.000Z',
      snapshotReference: result.reference, branchId: result.baseline.id };
    expect(() => createBrewingScenarioObservationEvent({ ...common, recordedAt: '2026-10-01',
      observation: { kind: 'qualitative', dimension: 'arôme', reported: 'fruité' } })).toThrow(BrewingScenarioDossierError);
    expect(() => createBrewingScenarioObservationEvent({ ...common,
      observation: { kind: 'qualitative', dimension: 'arôme', reported: 'fruité', source: { title: 'Fausse source' } as any } }))
      .toThrow(BrewingScenarioDossierError);
  });
});
