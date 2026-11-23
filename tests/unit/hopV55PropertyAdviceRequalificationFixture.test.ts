import { afterEach, describe, expect, it, vi } from 'vitest';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import type { HopV55WorkspaceEnvelopeV1, HopV55WorkspaceTable, HopV55WorkspaceDatabaseAdapter } from '../../src/services/hopV55/workspaceRepository';
import type { HopV55FixtureCatalogueDatabaseAdapter, HopV55FixtureReferences } from '../../src/services/hopV55/fixtureRuntime';
import type { BrewingScenarioLocalDatabaseAdapter } from '../../src/services/brewingScenarioLocalRepository';
import { createHopV55FixtureServices } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import * as decisionModule from '../../src/services/hopV55/decision';
import {
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_CURRENT_VALUE,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_VALUE,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_TITLE,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID,
  seedHopV55PropertyAdviceRequalificationFixture,
} from '../../src/services/hopV55/propertyAdviceRequalificationFixture';
import { readHopV55DocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import { readHopV55PropertyAdviceAnswerRecordV4 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { pageHarness } from '../fixtures/hopV55PropertyAdvicePageHarness';

afterEach(() => vi.restoreAllMocks());

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown) { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryWorkspaceTable();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    return (tablesAndWork.at(-1) as () => Promise<T>)();
  }
  close() { /* Memory-only repository adapter. */ }
}

function memoryCatalogueDatabase(): HopV55FixtureCatalogueDatabaseAdapter {
  return { records: { get: async () => undefined, add: async () => undefined, put: async () => undefined, toArray: async () => [] },
    operations: { get: async () => undefined, add: async () => undefined },
    transaction: async <T,>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]) => (tablesAndWork.at(-1) as () => Promise<T>)(),
    close() { /* Memory-only fixture adapter. */ } };
}

function memoryScenarioDatabase(): BrewingScenarioLocalDatabaseAdapter {
  const table = { get: async () => undefined, add: async () => undefined, put: async () => undefined,
    where: () => ({ equals: () => ({ toArray: async () => [] }) }) };
  return { dossiers: table, events: table,
    transaction: async <T,>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]) => (tablesAndWork.at(-1) as () => Promise<T>)(),
    close() { /* Memory-only fixture adapter. */ } } as unknown as BrewingScenarioLocalDatabaseAdapter;
}

const emptyReferences: HopV55FixtureReferences = { varieties: [], knowledge: [] };

describe('fixture locale de requalification V4', () => {
  it('scelle un parent historique à 2,5 et garde la même Recipe source actuelle à 3,25', async () => {
    const ownerKey = 'fixture:requalification-seed-test';
    const harness = pageHarness({ ownerKey, workspaceId: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID,
      mode: 'planning' });
    await harness.initialize();
    expect(harness.context.recipe?.id).toBe(HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID);
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');

    const seeded = await seedHopV55PropertyAdviceRequalificationFixture({ ownerKey,
      workspaces: harness.repository, baseContext: harness.context });
    const stored = await harness.stored();
    if (!stored) throw new Error('Le workspace synthétique doit être conservé par le repository fixture.');
    expect(seeded.created).toBe(true);
    expect(seeded.sourceRecipeId).toBe(harness.context.recipe?.id);
    expect(seeded.workspace).toEqual(stored);
    expect(stored.title).toBe(HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_TITLE);
    expect(stored.sourceRecipeId).toBe(HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID);
    expect(stored.decisionReadings).toHaveLength(1);
    expect(stored.documentaryAnswers).toHaveLength(2);

    const archiveRead = readHopV55DecisionReadingArchive(stored.decisionReadings?.[0]);
    expect(archiveRead.status).toBe('available');
    if (archiveRead.status !== 'available') throw new Error('Archive parent de fixture attendue.');
    expect(archiveRead.archive.source).toEqual({ kind: 'recipe', id: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID });
    expect(archiveRead.archive.reading.intent.question)
      .toBe('Ma bière est trop sucrée, comment compenser ça avec le houblon ?');

    const sourceRead = readHopV55DocumentaryAnswerRecord(stored.documentaryAnswers?.[0]);
    expect(sourceRead.status).toBe('readOnly');
    if (sourceRead.status !== 'readOnly') throw new Error('Réponse V3 source de fixture attendue.');
    const parentRead = readHopV55PropertyAdviceAnswerRecordV4(stored.documentaryAnswers?.[1]);
    expect(parentRead.status).toBe('readOnly');
    if (parentRead.status !== 'readOnly') throw new Error('Parent V4 de fixture attendu.');
    expect(parentRead.record.sourceReadingReference).toBe(archiveRead.archive.contentReference);
    expect(parentRead.record.transition.parentRecordReference).toBe(sourceRead.record.reference);
    if (parentRead.record.outcome.kind !== 'domainAnswer') throw new Error('Le parent V4 doit avoir sa réponse historique.');
    const observation = parentRead.record.outcome.answerSnapshot.requestSnapshot.propertyIntents
      .find(intent => intent.property === 'sweetness' && intent.role === 'reportedObservation');
    expect(observation?.comparisonBasis).toEqual({ kind: 'current', assertionIds: ['context-reading-0'] });
    expect(parentRead.record.outcome.answerSnapshot.requestSnapshot.context.assertions.find(row => row.id === 'context-reading-0'))
      .toMatchObject({ value: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_VALUE,
        unit: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT });

    expect(seeded.currentContext.recipe?.id).toBe(HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID);
    expect(seeded.currentContext.journal?.revision).toBe(2);
    expect(seeded.currentContext.journal?.readings).toEqual([{ kind: 'sweetness',
      value: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_CURRENT_VALUE, unit: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT }]);
    expect(parser).toHaveBeenCalledTimes(1);
    expect(builder).toHaveBeenCalledTimes(2);

    const parserCallsAfterSeed = parser.mock.calls.length;
    const builderCallsAfterSeed = builder.mock.calls.length;
    const reload = await seedHopV55PropertyAdviceRequalificationFixture({ ownerKey,
      workspaces: harness.repository, baseContext: harness.context });
    expect(reload.created).toBe(false);
    expect(reload.workspace).toEqual(stored);
    expect(reload.currentContext).toEqual(seeded.currentContext);
    expect(parser).toHaveBeenCalledTimes(parserCallsAfterSeed);
    expect(builder).toHaveBeenCalledTimes(builderCallsAfterSeed);
    expect(await harness.stored()).toEqual(stored);
  });

  it('refuse de substituer une autre Recipe et préserve le workspace', async () => {
    const ownerKey = 'fixture:requalification-wrong-source-test';
    const harness = pageHarness({ ownerKey, workspaceId: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID,
      mode: 'planning' });
    await harness.initialize();
    const wrongContext = structuredClone(harness.context);
    wrongContext.recipe!.id = 'recipe:some-other-fixture';
    const before = await harness.stored();
    await expect(seedHopV55PropertyAdviceRequalificationFixture({ ownerKey,
      workspaces: harness.repository, baseContext: wrongContext })).rejects.toThrow(/Recipe fixture exacte|substitue jamais/iu);
    expect(await harness.stored()).toEqual(before);
  });

  it('branche le seed explicite planning sur le repository fixture et recharge la valeur courante sans rebâtir', async () => {
    const namespace = `requalification-context-${crypto.randomUUID()}`;
    const workspaceDatabase = new MemoryWorkspaceDatabase();
    const options = { mode: 'planning' as const, seed: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED,
      workspaceDatabase, catalogueDatabase: memoryCatalogueDatabase(), scenarioDatabase: memoryScenarioDatabase(),
      loadReferences: async () => structuredClone(emptyReferences) };
    const first = createHopV55FixtureServices(namespace, options);
    const ownerKey = first.ownerKey;
    try {
      const workspaces = await first.workspaces.list(ownerKey);
      expect(workspaces).toHaveLength(1);
      expect(workspaces[0]).toMatchObject({ id: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID,
        sourceRecipeId: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID,
        title: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_TITLE });
      const current = await first.loadContext();
      expect(current.recipe?.id).toBe(HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID);
      expect(current.journal?.readings).toEqual([{ kind: 'sweetness', value: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_CURRENT_VALUE,
        unit: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT }]);
      const exactRecipeSource = await first.loadContext(current.recipe, { kind: 'recipe',
        recipeId: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID });
      expect(exactRecipeSource.recipe?.id).toBe(HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID);
      expect(exactRecipeSource.journal?.readings).toEqual(current.journal?.readings);
      expect(() => createHopV55FixtureServices(`${namespace}-wrong-mode`, { ...options, mode: 'unknown' }))
        .toThrow(/mode Recipe avant brassage/i);

      const before = await first.workspaces.read(ownerKey, HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID);
      first.close();
      const parser = vi.spyOn(decisionModule, 'readHopV55Question');
      const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3');
      const reloaded = createHopV55FixtureServices(namespace, options);
      try {
        const rows = await reloaded.workspaces.list(ownerKey);
        const context = await reloaded.loadContext();
        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual(before);
        expect(context.journal?.readings).toEqual(current.journal?.readings);
        expect(parser).not.toHaveBeenCalled();
        expect(builder).not.toHaveBeenCalled();
      } finally { reloaded.close(); }
    } finally { first.close(); }
  });
});
