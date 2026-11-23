import { describe, expect, it, vi } from 'vitest';
import * as hopRecipeEngine from '../../functions/src/hopRecipePrediction';
import { brewingObservationFactReference } from '../../src/domain/brewingObservationNumerics';
import { createHopV55FixtureServices, HOP_V55_CANONICAL_OBSERVATION_SEED_WORKSPACE_ID,
  type HopV55FixtureCatalogueDatabaseAdapter } from '../../src/services/hopV55/fixtureRuntime';
import { type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import type { BrewingScenarioLocalDatabaseAdapter } from '../../src/services/brewingScenarioLocalRepository';
import type { HopV55FixtureReferences } from '../../src/services/hopV55/fixtureRuntime';
import { loadHopV55CanonicalObservationFixture, HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS } from '../../src/services/hopV55/canonicalObservationFixture';
import { readHopV55ObservationAnchorRecord, resolveHopV55CurrentObservation } from '../../src/services/hopV55/observationSession';
import { resolveHopV55ObservationSupport } from '../../src/services/hopV55/observationSupport';

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string { return JSON.stringify(Array.isArray(value) ? value : [(value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) { const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryWorkspaceTable();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> { return (tablesAndWork.at(-1) as () => Promise<T>)(); }
  close() { /* Memory-only fixture. */ }
}

function memoryCatalogueDatabase(): HopV55FixtureCatalogueDatabaseAdapter {
  return { records: { get: async () => undefined, add: async () => undefined, put: async () => undefined, toArray: async () => [] },
    operations: { get: async () => undefined, add: async () => undefined },
    transaction: async <T,>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]) => (tablesAndWork.at(-1) as () => Promise<T>)(),
    close() { /* Memory-only fixture. */ } };
}

function memoryScenarioDatabase(): BrewingScenarioLocalDatabaseAdapter {
  const emptyTable = { get: async () => undefined, add: async () => undefined, put: async () => undefined,
    where: () => ({ equals: () => ({ toArray: async () => [] }) }) };
  return { dossiers: emptyTable, events: emptyTable,
    transaction: async <T,>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]) => (tablesAndWork.at(-1) as () => Promise<T>)(),
    close() { /* Memory-only fixture. */ } } as unknown as BrewingScenarioLocalDatabaseAdapter;
}

const emptyFixtureReferences: HopV55FixtureReferences = { varieties: [], knowledge: [] };
const createServices = (namespace: string, workspaceDatabase: MemoryWorkspaceDatabase, seed?: 'canonicalObservation' | 'canonicalContextOnly') =>
  createHopV55FixtureServices(namespace, { mode: 'fermenting', ...(seed ? { seed } : {}),
    catalogueDatabase: memoryCatalogueDatabase(), scenarioDatabase: memoryScenarioDatabase(), workspaceDatabase,
    loadReferences: async () => structuredClone(emptyFixtureReferences) });

describe('Fixture canonique d’observation V5.5', () => {
  it('reprend l’état BrewerContext positif sans emprunter la recette mutable ni construire une projection', async () => {
    const project = vi.spyOn(await import('../../src/domain/brewingObservationProjection'), 'projectBrewingObservation');
    const predict = vi.spyOn(hopRecipeEngine, 'predictHopRecipe');
    try {
      const fixture = await loadHopV55CanonicalObservationFixture();
      const snapshot = fixture.context.batch!.recipeSnapshot!;
      expect(fixture.context.batch?.id).toBe(HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId);
      expect(fixture.context.recipe?.volumeL).toBe(999);
      expect(fixture.context.recipe?.hops[0]?.weightG).toBe(999);
      expect(snapshot.volumeL).toBe(20);
      expect(snapshot.hops[0]).toMatchObject({ hopVarietyId: 'hopsteiner-eld', weightG: 200,
        aromaTiming: 'postFermentation', aromaContactHours: 48, aromaTemperatureC: 15 });
      expect(snapshot.yeast.hopIndexId).toBe('wyeast-1728');
      expect(fixture.context.journal?.additions?.['hop-0']).toMatchObject({ amount: 80, unit: 'g' });
      expect(fixture.prepared.state?.asOf).toBe(fixture.options.asOf);
      expect(fixture.prepared.state?.knowledgeAsOf).toBe(fixture.options.knowledgeAsOf);
      expect(fixture.prepared.observedHopInput?.input).toMatchObject({ volumeL: 20, yeastId: 'wyeast-1728',
        additions: [{ triplet: { doseGL: 4, contactHours: 6, temperatureC: 15 } }] });
      expect(fixture.note).toMatchObject({ id: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.noteId,
        sense: { kind: 'sensoryRating', value: 37 }, scale: { status: 'known', metric: { kind: 'ordinalNote' }, scale: { domain: { min: 0, max: 100 } } } });
      expect(fixture.noteDefinition.metric).toMatchObject({ kind: 'ordinalNote', unit: null });
      expect(fixture.plan.status).toBe('adopted');
      expect(fixture.plan.definitions[0].metric?.kind).toBe('modelIndex');
      expect(fixture.plan.sourceModel.id).toBe(HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.modelId);
      expect(fixture.data.knowledge.find(row => row.kind === 'axis' && row.id === fixture.plan.doseAxis.id
        && row.version === fixture.plan.doseAxis.version)).toEqual(fixture.plan.doseAxis);
      expect(fixture.note.dimension).toMatchObject({ status: 'resolved', definition: { contentReference: fixture.noteDefinition.contentReference } });
      expect(fixture.arithmetic.definition.contentReference).toBe(fixture.plan.definitions[0].contentReference);
      expect(fixture.anchor.observationReference).toBe(brewingObservationFactReference(fixture.note));
      expect(fixture.arithmetic).toMatchObject({ operation: 'ordinalWorkingHypothesis', basis: null,
        unitBridge: { rule: 'unitCorrespondence', domain: { min: 0, max: 100 } } });
      expect(fixture.arithmetic.unitBridge?.sourceDefinition.contentReference).toBe(fixture.noteDefinition.contentReference);
      expect(fixture.restStability.status).toBe('adopted');
      expect(fixture.anchor.observedState.resolutionReference).toBe(fixture.prepared.state?.resolutionReference);
      expect(fixture.target).toMatchObject({ future: [], contactTargets: [{ contactHours: 24 }], horizon: { kind: 'instant' } });
      expect(fixture.target.horizon.kind === 'instant' && fixture.target.horizon.at).toBe('2026-10-03T00:00:00.000Z');
      expect(fixture).not.toHaveProperty('projection');
      expect(project).not.toHaveBeenCalled();
      expect(predict).not.toHaveBeenCalled();
    } finally { project.mockRestore(); predict.mockRestore(); }
  });

  it('ne crée pas de dossier hors seed explicite et réouvre une ancre synthétique identique après reload', async () => {
    const namespace = `canonical-observation-seed-${crypto.randomUUID()}`;
    const canonical = await loadHopV55CanonicalObservationFixture();
    const ordinary = createServices(`${namespace}-ordinary`, new MemoryWorkspaceDatabase());
    await expect(ordinary.workspaces.list(ordinary.ownerKey)).resolves.toEqual([]);
    ordinary.close();
    expect(() => createHopV55FixtureServices(`${namespace}-wrong-mode`, { mode: 'unknown', seed: 'canonicalObservation' }))
      .toThrow(/mode de brassin en fermentation/i);

    const workspaceDatabase = new MemoryWorkspaceDatabase();
    const seeded = createServices(namespace, workspaceDatabase, 'canonicalObservation');
    try {
      const rows = await seeded.workspaces.list(seeded.ownerKey);
      expect(rows).toHaveLength(1);
      const workspace = rows[0];
      expect(workspace).toMatchObject({ id: HOP_V55_CANONICAL_OBSERVATION_SEED_WORKSPACE_ID, sourceBatchId: 'fixture-canonical-batch',
        scenarioIds: [], referenceHypotheses: [], copies: [] });
      expect(workspace.sourceRecipeId).toBeUndefined();
      expect(workspace.referenceJournal?.events.map(event => event.kind)).toEqual(['contextOpened', 'observationRecorded']);
      expect(workspace.referenceJournal?.events[1]).toMatchObject({ payload: { observation: canonical.note } });
      expect(workspace.nuancePlans?.[0].reference).toBe(canonical.plan.reference);
      expect(workspace.observationAnchors).toHaveLength(2);
      const current = workspace.observationAnchors!.map(readHopV55ObservationAnchorRecord)
        .find(row => row.status === 'readOnly' && row.record.recordKind === 'currentPreparation');
      const anchor = workspace.observationAnchors!.map(readHopV55ObservationAnchorRecord)
        .find(row => row.status === 'readOnly' && row.record.anchor?.reference === canonical.anchor.reference);
      expect(current?.status).toBe('readOnly');
      expect(current && current.status === 'readOnly' ? current.record : undefined).toMatchObject({
        recordKind: 'currentPreparation', anchor: null, observationReference: null,
        preparation: { reference: canonical.prepared.reference, observedHopInput: { used: [{ grams: 80, elapsedHours: 6 }] } },
      });
      expect(anchor && anchor.status === 'readOnly' ? anchor.record : undefined).toMatchObject({
        preparation: { reference: canonical.prepared.reference }, observationReference: { id: canonical.note.id, version: canonical.note.version },
      });
      const resolved = resolveHopV55CurrentObservation({ workspace, requestedDimension: canonical.note.dimension,
        requiredDependencyIds: canonical.options.hopScope!.dependencyIds, currentPreparationRecordId: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.currentPreparationId });
      expect(resolved.status).toBe('selected');
      if (resolved.status === 'selected') expect(resolved.selection.selected?.observation).toEqual(canonical.note);
      expect(workspace.observationProjections ?? []).toEqual([]);
      expect(workspace.scenarioPreparations ?? []).toEqual([]);
      expect(workspace.observationSupportRecords?.map(row => row.recordKind)).toEqual(['protocolNote', 'hopScope', 'arithmetic']);
      expect(workspace.observationSupportSelections).toHaveLength(1);
      const support = resolveHopV55ObservationSupport({ workspace });
      expect(support.status).toBe('ready');
      if (support.status === 'ready') {
        expect(support.selection.dimensionReference).toBe(canonical.noteDefinition.contentReference);
        expect(support.selection.hopScopeReference).toBe(workspace.observationSupportRecords?.find(row => row.recordKind === 'hopScope')?.reference);
        expect(support.selection.frameReferences).toEqual([canonical.plan.reference]);
        expect(support.selection.arithmeticReference).toBe(workspace.observationSupportRecords?.find(row => row.recordKind === 'arithmetic')?.reference);
        expect(support.support.stabilityProposals).toEqual([]);
        expect(support.support.observationDefinitions).toContainEqual(canonical.noteDefinition);
      }
      expect(await seeded.scenarios.list(seeded.ownerKey)).toEqual([]);

      const noSourceContext = await seeded.loadContext();
      const batchContext = await seeded.loadContext(undefined, { kind: 'batch', batchId: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId });
      expect(noSourceContext.batch?.id).toBe(HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId);
      expect(noSourceContext.recipe?.volumeL).toBe(20);
      expect(noSourceContext.recipe?.hops[0]?.weightG).toBe(200);
      expect(noSourceContext.journal?.additions?.['hop-0']).toMatchObject({ amount: 80, unit: 'g' });
      expect(batchContext.recipe?.hops[0]?.weightG).toBe(200);
      await expect(seeded.loadContext({ ...noSourceContext.recipe!, volumeL: 999 })).rejects.toThrow(/recette mutable/i);

      const reference = anchor && anchor.status === 'readOnly' ? anchor.record.reference : '';
      const currentReference = current && current.status === 'readOnly' ? current.record.reference : '';
      const edited = structuredClone(workspace);
      edited.title = 'Note canonique relue, contenu de fixture conservé';
      await seeded.workspaces.save(edited, workspace.revision);
      seeded.close();

      const reloaded = createServices(namespace, workspaceDatabase, 'canonicalObservation');
      try {
        const reopened = await reloaded.workspaces.list(reloaded.ownerKey);
        expect(reopened).toHaveLength(1);
        expect(reopened[0].title).toBe('Note canonique relue, contenu de fixture conservé');
        expect(reopened[0].observationAnchors?.find(row => row.recordKind === 'observationAnchor')?.reference).toBe(reference);
        expect(reopened[0].observationAnchors?.find(row => row.recordKind === 'currentPreparation')?.reference).toBe(currentReference);
        expect(reopened[0].referenceJournal?.events.map(event => event.kind)).toEqual(['contextOpened', 'observationRecorded']);
        await expect(reloaded.scenarios.list(reloaded.ownerKey)).resolves.toEqual([]);
      } finally { reloaded.close(); }
    } catch (error) {
      seeded.close();
      throw error;
    }
  });

  it('expose le contexte canonique sans créer de dossier ni préadopter de support', async () => {
    const namespace = `canonical-context-only-${crypto.randomUUID()}`;
    const workspaceDatabase = new MemoryWorkspaceDatabase();
    const fixture = await loadHopV55CanonicalObservationFixture();
    const project = vi.spyOn(await import('../../src/domain/brewingObservationProjection'), 'projectBrewingObservation');
    const predict = vi.spyOn(hopRecipeEngine, 'predictHopRecipe');
    const simulate = vi.spyOn(await import('../../src/domain/brewingScenario'), 'simulateBrewingScenario');
    const services = createHopV55FixtureServices(namespace, { mode: 'fermenting', seed: 'canonicalContextOnly',
      catalogueDatabase: memoryCatalogueDatabase(), scenarioDatabase: memoryScenarioDatabase(), workspaceDatabase,
      loadReferences: async () => structuredClone(emptyFixtureReferences) });
    try {
      await expect(services.workspaces.list(services.ownerKey)).resolves.toEqual([]);
      const implicit = await services.loadContext();
      const exact = await services.loadContext(undefined, { kind: 'batch', batchId: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId });
      await expect(services.loadContext({ ...implicit.recipe!, volumeL: 999 })).rejects.toThrow(/recette mutable/i);
      await expect(services.loadContext(undefined, { kind: 'batch', batchId: 'foreign-fixture-batch' }))
        .rejects.toThrow(/identifiant de brassin fixture exact/i);
      expect(implicit.batch?.id).toBe(HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId);
      expect(implicit.recipe).toEqual(fixture.context.batch?.recipeSnapshot);
      expect(exact.recipe).toEqual(implicit.recipe);
      expect(implicit.recipe).toMatchObject({ volumeL: 20, yeast: { hopIndexId: 'wyeast-1728' },
        hops: [{ hopVarietyId: 'hopsteiner-eld', weightG: 200, aromaContactHours: 48, aromaTemperatureC: 15 }] });
      expect(implicit.journal?.additions?.['hop-0']).toMatchObject({ amount: 80, unit: 'g' });
      expect(implicit.recipe?.hops[0]?.weightG).not.toBe(999);
      expect(await services.workspaces.list(services.ownerKey)).toEqual([]);
      expect(workspaceDatabase.workspaces.rows.size).toBe(0);
      await expect(services.scenarios.list(services.ownerKey)).resolves.toEqual([]);
      expect(project).not.toHaveBeenCalled();
      expect(predict).not.toHaveBeenCalled();
      expect(simulate).not.toHaveBeenCalled();
    } finally {
      services.close();
      project.mockRestore();
      predict.mockRestore();
      simulate.mockRestore();
    }

    expect(() => createHopV55FixtureServices(`${namespace}-wrong-mode`, { mode: 'unknown', seed: 'canonicalContextOnly' }))
      .toThrow(/mode de brassin en fermentation/i);

    const reopened = createHopV55FixtureServices(namespace, { mode: 'fermenting', seed: 'canonicalContextOnly',
      catalogueDatabase: memoryCatalogueDatabase(), scenarioDatabase: memoryScenarioDatabase(), workspaceDatabase,
      loadReferences: async () => structuredClone(emptyFixtureReferences) });
    try {
      await expect(reopened.workspaces.list(reopened.ownerKey)).resolves.toEqual([]);
      const context = await reopened.loadContext(undefined, { kind: 'batch', batchId: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId });
      expect(context.recipe).toEqual(fixture.context.batch?.recipeSnapshot);
      expect(workspaceDatabase.workspaces.rows.size).toBe(0);
    } finally { reopened.close(); }

    const ordinary = createHopV55FixtureServices(`${namespace}-ordinary`, { mode: 'fermenting',
      catalogueDatabase: memoryCatalogueDatabase(), scenarioDatabase: memoryScenarioDatabase(),
      workspaceDatabase: new MemoryWorkspaceDatabase(), loadReferences: async () => structuredClone(emptyFixtureReferences) });
    try {
      const legacy = await ordinary.loadContext();
      expect(legacy.batch?.id).toBe('hop-v55-fixture-batch-fermenting');
      expect(legacy.batch?.id).not.toBe(HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId);
    } finally { ordinary.close(); }
  });
});
