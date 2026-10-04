import { describe, expect, it } from 'vitest';
import {
  buildBrewingScenarioRequest,
  simulateBrewingScenario,
  type BrewingScenarioRequest,
  type BrewingScenarioResult,
  type BrewingScenarioRuntime,
} from '../../src/domain/brewingScenario';
import {
  DEFAULT_BREWING_SCENARIO_SNAPSHOT_MAX_BYTES,
  createBrewingScenarioLocalRepository,
  BrewingScenarioLocalRepositoryError,
  type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable,
} from '../../src/services/brewingScenarioLocalRepository';
import { testHopData, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';

type Row = Record<string, any>;

class MemoryTable implements BrewingScenarioLocalTable<Row> {
  rows = new Map<string, Row>();

  constructor(private readonly kind: 'dossiers' | 'events') {}

  private key(rowOrKey: Row | unknown): string {
    if (Array.isArray(rowOrKey)) return JSON.stringify(rowOrKey);
    const row = rowOrKey as Row;
    return JSON.stringify(this.kind === 'dossiers' ? [row.ownerKey, row.scenarioId] : [row.ownerKey, row.eventId]);
  }

  async get(key: unknown): Promise<Row | undefined> {
    const row = this.rows.get(this.key(key));
    return row && structuredClone(row);
  }

  async add(row: Row): Promise<void> {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    if (this.kind === 'events' && [...this.rows.values()].some(existing => existing.ownerKey === row.ownerKey
      && existing.scenarioId === row.scenarioId && existing.resultingRevision === row.resultingRevision)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }

  async put(row: Row): Promise<void> { this.rows.set(this.key(row), structuredClone(row)); }

  where(index: string) {
    return {
      equals: (query: unknown) => ({
        toArray: async () => [...this.rows.values()].filter(row => {
          const actual = index === 'ownerKey' ? row.ownerKey
            : index === '[ownerKey+scenarioId]' ? [row.ownerKey, row.scenarioId]
              : index === '[ownerKey+eventId]' ? [row.ownerKey, row.eventId] : undefined;
          return JSON.stringify(actual) === JSON.stringify(query);
        }).map(row => structuredClone(row)),
      }),
    };
  }
}

class MemoryDatabase {
  dossiers = new MemoryTable('dossiers');
  events = new MemoryTable('events');
  private transactionTail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.transactionTail.then(async () => {
      const dossiers = new Map([...this.dossiers.rows].map(([key, row]) => [key, structuredClone(row)]));
      const events = new Map([...this.events.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); }
      catch (error) { this.dossiers.rows = dossiers; this.events.rows = events; throw error; }
    });
    this.transactionTail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close(): void { /* In-memory test adapter has no open handle. */ }
}

const recipe = (): HopRecipeInput => ({
  volumeL: 24,
  yeastId: testHopYeast.id,
  additions: [{ id: 'hop-1', name: 'Lot témoin', triplet: structuredClone(testHopTriplet) }],
  fermentation: [{ kind: 'primaire', tempC: 20, days: 7 }],
});
const runtime: BrewingScenarioRuntime = { engineData: testHopData(), materials: [] };

function run(revision: number): BrewingScenarioResult {
  const request: BrewingScenarioRequest = buildBrewingScenarioRequest({
    scenarioId: 'scenario-local', revision,
    baseline: { kind: 'hypothetical', label: 'Base', input: recipe() },
  });
  return simulateBrewingScenario(request, structuredClone(runtime));
}

function makeRepository(options: { maxSnapshotBytes?: number } = {}) {
  const database = new MemoryDatabase();
  const repository = createBrewingScenarioLocalRepository({ ...options, database: database as unknown as BrewingScenarioLocalDatabaseAdapter });
  return { database, repository };
}

describe('Dépôt local de scénarios brassicoles', () => {
  it('sépare le scope local, partitionne par ownerKey et rend la création idempotente par contenu exact', async () => {
    const { repository } = makeRepository();
    const result = run(1);
    const input = { ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'save-1',
      recordedAt: '2026-10-01T10:00:00.000Z', result };

    const first = await repository.saveResult(input);
    const replay = await repository.saveResult(input);
    await repository.saveResult({ ...input, ownerKey: 'compte-b' });
    const localRead = await repository.read('compte-a', result.scenarioId);
    const otherOwner = await repository.read('compte-x', result.scenarioId);

    expect(first).toMatchObject({ scope: 'local', status: 'created' });
    expect(replay).toMatchObject({ scope: 'local', status: 'duplicate', event: { eventId: 'save-1' } });
    expect(localRead).toMatchObject({ scope: 'local', status: 'available', record: { currentSnapshot: { result } } });
    expect(otherOwner).toBeNull();
    expect((await repository.list('compte-a')).map(row => row.scenarioId)).toEqual([result.scenarioId]);
    expect((await repository.list('compte-b')).map(row => row.scenarioId)).toEqual([result.scenarioId]);

    await expect(repository.saveResult({ ...input, result: run(2) })).rejects.toMatchObject({ code: 'eventIdConflict' });
    repository.close();
  });

  it('applique le CAS, déduplique les événements par format et contenu, et conserve l’estimation malgré les observations', async () => {
    const { repository } = makeRepository();
    const result = run(1);
    await repository.saveResult({ ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'save-1',
      recordedAt: '2026-10-01T10:00:00.000Z', result });
    const preference = {
      ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'pref-1', expectedRevision: 1,
      recordedAt: '2026-10-01T10:01:00.000Z', preferenceId: 'preference-1', snapshotReference: result.reference,
      branchId: result.baseline.id, branchReference: result.baseline.reference, reason: 'Comparer la base.',
    };
    const preferred = await repository.preferBranch(preference);
    const duplicate = await repository.preferBranch(preference);
    expect(preferred).toMatchObject({ scope: 'local', status: 'appended', dossier: { revision: 2 } });
    expect(duplicate).toMatchObject({ scope: 'local', status: 'duplicate', dossier: { revision: 2 } });
    await expect(repository.preferBranch({ ...preference, interpretation: 'modifier le même eventId' }))
      .rejects.toMatchObject({ code: 'eventIdConflict' });

    await expect(repository.appendObservation({ ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'stale',
      expectedRevision: 1, recordedAt: '2026-10-01T10:02:00.000Z', observationId: 'stale-observation',
      observedAt: '2026-10-01T10:02:00.000Z', snapshotReference: result.reference,
      observation: { kind: 'qualitative', dimension: 'arôme', reported: 'contradictoire' } }))
      .rejects.toMatchObject({ code: 'staleRevision' });

    const observation = { ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'taste-1', expectedRevision: 2,
      recordedAt: '2026-10-01T11:00:00.000Z', observationId: 'taste-note', observedAt: '2026-10-01T11:00:00.000Z',
      snapshotReference: result.reference, branchId: result.baseline.id,
      observation: { kind: 'qualitative' as const, dimension: 'arôme', reported: 'aucun fruité perceptible', method: 'dégustation' } };
    await repository.appendObservation(observation);
    const read = await repository.read('compte-a', result.scenarioId);
    const events = await repository.readEvents('compte-a', result.scenarioId);
    expect(read).toMatchObject({ scope: 'local', status: 'available', record: {
      currentSnapshot: { reference: result.reference, result },
      dossier: { preferredBranch: { snapshotReference: result.reference, branchId: 'baseline' } },
    } });
    expect(events.filter(event => !('status' in event) && event.kind === 'observationAppended')).toHaveLength(1);
    expect(events.map(event => 'status' in event ? '' : event.kind)).toEqual(['resultSaved', 'branchPreferred', 'observationAppended']);
    repository.close();
  });

  it('expose un journal de format futur en lecture seule et conserve ses octets bruts', async () => {
    const { database, repository } = makeRepository();
    const result = run(1);
    await repository.saveResult({ ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'save-1',
      recordedAt: '2026-10-01T10:00:00.000Z', result });
    const stored = await database.events.get(['compte-a', 'save-1']);
    if (!stored) throw new Error('Événement initial attendu dans le faux stockage.');
    const future = { ...stored, eventFormatVersion: 2, extension: { preserved: true } };
    await database.events.put(future);

    const read = await repository.read('compte-a', result.scenarioId);
    const events = await repository.readEvents('compte-a', result.scenarioId);
    expect(read).toMatchObject({ scope: 'local', status: 'unsupportedFormat', record: {
      reason: 'history', raw: { events: [future] },
    } });
    expect(events).toMatchObject([{ status: 'unsupportedEventFormat', reason: 'eventFormat', raw: future }]);
    await expect(repository.appendObservation({ ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'new-event',
      expectedRevision: 1, recordedAt: '2026-10-01T12:00:00.000Z', observationId: 'note',
      observedAt: '2026-10-01T12:00:00.000Z', snapshotReference: result.reference,
      observation: { kind: 'qualitative', dimension: 'arôme', reported: 'test' } }))
      .rejects.toMatchObject({ code: 'unsupportedFormat' });
    expect(await database.events.get(['compte-a', 'save-1'])).toEqual(future);
    repository.close();
  });

  it('sérialise deux écritures concurrentes portant la même révision CAS', async () => {
    const { repository } = makeRepository();
    const result = run(1);
    await repository.saveResult({ ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'save-1',
      recordedAt: '2026-10-01T10:00:00.000Z', result });
    const append = (suffix: string) => repository.appendObservation({ ownerKey: 'compte-a', scenarioId: result.scenarioId,
      eventId: `concurrent-${suffix}`, expectedRevision: 1, recordedAt: '2026-10-01T11:00:00.000Z',
      observationId: `observation-${suffix}`, observedAt: '2026-10-01T11:00:00.000Z', snapshotReference: result.reference,
      observation: { kind: 'qualitative', dimension: 'arôme', reported: suffix } });
    const outcomes = await Promise.allSettled([append('a'), append('b')]);
    expect(outcomes.filter(outcome => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter(outcome => outcome.status === 'rejected')).toHaveLength(1);
    const rejection = outcomes.find(outcome => outcome.status === 'rejected') as PromiseRejectedResult;
    expect(rejection.reason).toMatchObject({ code: 'staleRevision' });
    const events = await repository.readEvents('compte-a', result.scenarioId);
    expect(events).toHaveLength(2);
    repository.close();
  });

  it('conserve les anciennes révisions et refuse un snapshot trop volumineux sans mutation partielle', async () => {
    const { database, repository } = makeRepository({ maxSnapshotBytes: 64 });
    const result = run(1);
    await expect(repository.saveResult({ ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'too-large',
      recordedAt: '2026-10-01T10:00:00.000Z', result })).rejects.toMatchObject({ code: 'sizeLimit' });
    expect(database.dossiers.rows.size).toBe(0);
    expect(database.events.rows.size).toBe(0);
    expect(DEFAULT_BREWING_SCENARIO_SNAPSHOT_MAX_BYTES).toBeGreaterThan(64);

    const actual = makeRepository();
    await actual.repository.saveResult({ ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'save-1',
      recordedAt: '2026-10-01T10:00:00.000Z', result });
    const second = run(2);
    await actual.repository.reviseResult({ ownerKey: 'compte-a', scenarioId: result.scenarioId, eventId: 'revise-1',
      expectedRevision: 1, recordedAt: '2026-10-02T10:00:00.000Z', previousSnapshotReference: result.reference,
      reason: 'Révision explicite.', result: second });
    const read = await actual.repository.read('compte-a', result.scenarioId);
    expect(read).toMatchObject({ scope: 'local', status: 'available', record: { snapshots: [
      { result: { revision: 1 } }, { result: { revision: 2 } },
    ], currentSnapshot: { result: { reference: second.reference } } } });
    actual.repository.close(); repository.close();
  });
});
