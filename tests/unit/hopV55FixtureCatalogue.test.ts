import { describe, expect, it } from 'vitest';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  canonicalBrewerCatalogueFingerprintInput,
} from '../../functions/src/brewerCatalogueCore';
import type { BrewerCatalogueCommand } from '../../functions/src/brewerCatalogueSchema';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { brewingScenarioCurrentReference, buildBrewingScenarioRequest, simulateBrewingScenario } from '../../src/domain/brewingScenario';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import {
  createHopV55FixtureCatalogueClientForTests,
  createHopV55FixtureServices,
  makeHopV55FixtureContext,
  makeHopV55FixtureReferences,
  type HopV55FixtureCatalogueDatabaseAdapter,
  type HopV55FixtureReferences,
} from '../../src/services/hopV55/fixtureRuntime';
import {
  createHopCommand,
  createStyleCommand,
  createYeastCommand,
  enrichHopCommand,
  fixtureReferencesWithHop,
} from '../fixtures/hopV55';

type RecordRow = Parameters<HopV55FixtureCatalogueDatabaseAdapter['records']['add']>[0];
type OperationRow = Parameters<HopV55FixtureCatalogueDatabaseAdapter['operations']['add']>[0];

class MemoryCatalogueDatabase implements HopV55FixtureCatalogueDatabaseAdapter {
  private recordRows = new Map<string, RecordRow>();
  private operationRows = new Map<string, OperationRow>();
  records = {
    get: async (key: unknown) => {
      const row = this.recordRows.get(JSON.stringify(key));
      return row && structuredClone(row);
    },
    add: async (row: RecordRow) => {
      const key = JSON.stringify([row.kind, row.id]);
      if (this.recordRows.has(key)) throw new Error('ConstraintError');
      this.recordRows.set(key, structuredClone(row));
    },
    put: async (row: RecordRow) => { this.recordRows.set(JSON.stringify([row.kind, row.id]), structuredClone(row)); },
    toArray: async () => [...this.recordRows.values()].map(row => structuredClone(row)),
  };
  operations = {
    get: async (key: unknown) => {
      const row = this.operationRows.get(String(key));
      return row && structuredClone(row);
    },
    add: async (row: OperationRow) => {
      if (this.operationRows.has(row.operationId)) throw new Error('ConstraintError');
      this.operationRows.set(row.operationId, structuredClone(row));
    },
  };
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const records = new Map([...this.recordRows].map(([key, value]) => [key, structuredClone(value)]));
      const operations = new Map([...this.operationRows].map(([key, value]) => [key, structuredClone(value)]));
      try { return await work(); }
      catch (error) { this.recordRows = records; this.operationRows = operations; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory fixture has no open handle. */ }
}

const hex = (value: Uint8Array) => Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('');
const client = (database: MemoryCatalogueDatabase, references: HopV55FixtureReferences = { varieties: [], knowledge: [] }) =>
  createHopV55FixtureCatalogueClientForTests({ namespace: 'catalogue-test', database,
    loadReferences: async () => structuredClone(references) });
const applied = (result: Awaited<ReturnType<ReturnType<typeof client>['write']>>) => {
  if (result.status !== 'applied') throw new Error(`Écriture attendue, reçu ${result.status}.`);
  return result;
};

describe('Catalogue fixture V5.5', () => {
  it('crée les identités houblon, levure et style dans la fixture isolée et les relit avec un SHA-256 réel', async () => {
    const database = new MemoryCatalogueDatabase();
    const catalogue = client(database);
    const hop = applied(await catalogue.write(createHopCommand('fixture-create-hop', 'Identité fixture nouvelle')));
    const yeast = applied(await catalogue.write(createYeastCommand('fixture-create-yeast', 'Souche fictive nouvelle')));
    const style = applied(await catalogue.write(createStyleCommand('fixture-create-style', 'Guide fictif nouveau')));

    expect([hop.scope, yeast.scope, style.scope]).toEqual(['fixture', 'fixture', 'fixture']);
    expect(hop.receipt).toMatchObject({ namespace: 'catalogue-test', status: 'committed', targetId: hop.id });
    expect(hop.record.catalogueMeta?.fingerprint).toBe(hop.fingerprint);
    expect(hop.fingerprint).toBe(hex(sha256(new TextEncoder().encode(canonicalBrewerCatalogueFingerprintInput(hop.record)))));
    await expect(catalogue.lookup('hopVariety', 'Identité fixture nouvelle'))
      .resolves.toMatchObject({ truncated: false, records: [{ id: hop.id, revision: 1, origin: 'persisted' }] });
    await expect(catalogue.lookup('yeastStrain', 'Souche fictive nouvelle'))
      .resolves.toMatchObject({ records: [{ id: yeast.id, record: { kind: 'yeast', name: 'Souche fictive nouvelle' } }] });
    await expect(catalogue.lookup('brewingStyle', 'Guide fictif nouveau'))
      .resolves.toMatchObject({ records: [{ id: style.id, record: { kind: 'styleGuide', name: 'Guide fictif nouveau' } }] });
    expect(await catalogue.loadOverlay()).toHaveLength(3);
    catalogue.close();
  });

  it('scanne les références, rejoue le même contenu une seule fois et refuse un retry différent', async () => {
    const reference: HopVariety = { id: 'hop-reference-v55', name: 'Identité de référence', aliases: [], form: 'unknown', descriptions: [], analysis: [] };
    const database = new MemoryCatalogueDatabase();
    const catalogue = client(database, fixtureReferencesWithHop(reference));
    const collision = await catalogue.write(createHopCommand('create-reference-conflict', reference.name));
    expect(collision).toMatchObject({ status: 'conflict', scope: 'fixture', identityCandidates: [{ id: reference.id, kind: 'hopVariety' }] });

    const command = createHopCommand('fixture-retry-stable', 'Identité retry stable');
    const first = applied(await catalogue.write(command));
    const replay = await catalogue.write(command);
    expect(replay).toMatchObject({ status: 'duplicate', scope: 'fixture', id: first.id, record: { id: first.id } });
    expect(await catalogue.write(createHopCommand(command.operationId, 'Contenu différent')))
      .toMatchObject({ status: 'conflict', scope: 'fixture', reason: expect.stringContaining('contenu différent') });
    expect(await catalogue.write(createHopCommand('fixture-second-identity', 'Identité retry stable')))
      .toMatchObject({ status: 'conflict', scope: 'fixture' });
    catalogue.close();
  });

  it('fournit des contextes de démonstration explicites sans transformer l’inconnu en fait', () => {
    const planning = makeHopV55FixtureContext('planning');
    const preparedPlanning = prepareBrewingScenarioContext(planning);
    const fermenting = makeHopV55FixtureContext('fermenting');
    const unknown = makeHopV55FixtureContext('unknown');
    const nolo = makeHopV55FixtureContext('nolo');
    const sour = makeHopV55FixtureContext('sour');
    const unknownCulture = makeHopV55FixtureContext('unknownCulture');
    const references = makeHopV55FixtureReferences();

    expect(planning.recipe).toMatchObject({ name: 'Recette synthétique avant brassage', ogTarget: null, fgTarget: null, abvTarget: null });
    expect(planning.batch).toBeUndefined();
    expect(preparedPlanning.binding?.program.stage).toBe('planning');
    expect(preparedPlanning.runtime.current?.program?.additions).toHaveLength(2);
    expect(fermenting.batch).toMatchObject({ status: 'fermentation', recipeSnapshot: { sourceRecipeId: 'hop-v55-fixture-recipe-fermenting' } });
    expect(fermenting.journal?.additions).toMatchObject({ 'hop-0': { amount: 40, unit: 'g', doneAt: expect.any(Number) } });
    expect(fermenting.journal?.additions?.['hop-1']).toBeUndefined();
    expect(unknown.recipe).toBeUndefined();
    expect(unknown.batch).toBeUndefined();
    expect(unknown.journal).toBeUndefined();
    expect(nolo.recipe?.nolo?.enabled).toBe(true);
    expect(sour.recipe?.style).toContain('acide');
    expect(planning.recipe?.yeast).toMatchObject({ hopIndexId: 'hop-v55-fixture-culture-neutral', name: 'Culture fictive neutre' });
    expect(planning.hopIndex?.knowledge.find(row => row.id === 'hop-v55-fixture-culture-neutral'))
      .toMatchObject({ kind: 'yeast', betaLyase: 'unknown' });
    expect(unknownCulture.recipe?.yeast).toMatchObject({ name: 'Culture inconnue pour la fixture' });
    expect(unknownCulture.recipe?.yeast.hopIndexId).toBeUndefined();
    expect(references.varieties).toHaveLength(3);
    expect(references.varieties.every(row => row.analysis.length === 0 && row.name.startsWith('Identité fictive'))).toBe(true);
    expect(references.knowledge).toHaveLength(1);
    expect(() => createHopV55FixtureServices('   ')).toThrow('namespace');
  });

  it('relit la recette copiée dans le contexte planning et bloque tout override après le lancement', async () => {
    const loadReferences = async () => ({ varieties: [], knowledge: [] });
    const database = new MemoryCatalogueDatabase();
    const planning = createHopV55FixtureServices('copy-reload-test', { mode: 'planning', catalogueDatabase: database, loadReferences });
    const copy = structuredClone(makeHopV55FixtureContext('planning').recipe!);
    copy.id = 'copy-recipe-12-25';
    copy.hops[0].weightG = 12.25;
    copy.hops[1].weightG = 25;
    const reloaded = await planning.loadContext(copy);
    expect(reloaded.recipe?.hops.map(hop => hop.weightG)).toEqual([12.25, 25]);
    expect(reloaded.recipe?.id).toBe('copy-recipe-12-25');
    planning.close();

    const fermenting = createHopV55FixtureServices('launched-copy-test', {
      mode: 'fermenting', catalogueDatabase: new MemoryCatalogueDatabase(), loadReferences,
    });
    await expect(fermenting.loadContext(copy)).rejects.toThrow('brassin déjà commencé');
    fermenting.close();
  });

  it('lie la recette planning à une culture synthétique non qualifiée et garde le cas sans culture séparé', async () => {
    const planning = makeHopV55FixtureContext('planning');
    const references = await loadBrewingCatalogueReferences();
    const knowledge = new Map(references.knowledge.map(row => [row.id, structuredClone(row)]));
    for (const row of planning.hopIndex?.knowledge ?? []) knowledge.set(row.id, structuredClone(row));
    planning.hopIndex = {
      ...planning.hopIndex!,
      varieties: [...references.varieties, ...(planning.hopIndex?.varieties ?? [])],
      knowledge: [...knowledge.values()],
    };
    const prepared = prepareBrewingScenarioContext(planning);
    expect(prepared.runtime.current?.input.yeastId).toBe('hop-v55-fixture-culture-neutral');
    expect(prepared.runtime.engineData.knowledge.find(row => row.id === 'hop-v55-fixture-culture-neutral'))
      .toMatchObject({ kind: 'yeast', betaLyase: 'unknown', name: 'Culture fictive neutre' });
    const current = prepared.runtime.current!;
    const request = buildBrewingScenarioRequest({ scenarioId: 'fixture-culture-linked', revision: 0,
      baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
        program: current.program, contextReference: brewingScenarioCurrentReference(current) } });
    const result = simulateBrewingScenario(request, prepared.runtime);
    const profile = Object.values(result.baseline.hopPrediction.overall.profile);
    expect(result.baseline.hopPrediction.input.yeastId).toBe('hop-v55-fixture-culture-neutral');
    expect(profile.some(value => value.range !== null)).toBe(true);
    expect(profile.some(value => value.range === null)).toBe(true);

    const unknownCulture = makeHopV55FixtureContext('unknownCulture');
    const unknownPrepared = prepareBrewingScenarioContext(unknownCulture);
    expect(unknownPrepared.runtime.current?.input.yeastId).toBeNull();
  });

  it('enrichit sans écraser deux assertions contradictoires et refuse les révisions/empreintes périmées', async () => {
    const catalogue = client(new MemoryCatalogueDatabase());
    const created = applied(await catalogue.write(createHopCommand('fixture-alpha-create', 'Identité alpha conflictuelle')));
    const first = applied(await catalogue.write(enrichHopCommand('fixture-alpha-enrich-a', {
      kind: 'hopVariety', id: created.id, expectedRevision: created.revision, expectedFingerprint: created.fingerprint,
    }, 'claim-alpha-a', '12 % masse déclarés', 12)));
    const second = applied(await catalogue.write(enrichHopCommand('fixture-alpha-enrich-b', {
      kind: 'hopVariety', id: first.id, expectedRevision: first.revision, expectedFingerprint: first.fingerprint,
    }, 'claim-alpha-b', '9 % masse déclarés', 9)));

    expect(first.revision).toBe(2);
    expect(second.revision).toBe(3);
    expect(second.record.catalogueMeta?.claims.map(claim => claim.normalized && 'value' in claim.normalized ? claim.normalized.value : null))
      .toEqual([12, 9]);
    expect((second.record as HopVariety).analysis).toEqual([]);
    await expect(catalogue.lookup('hopVariety', created.id)).resolves.toMatchObject({ records: [{
      id: created.id, revision: 3, record: { catalogueMeta: { claims: [{ id: 'claim-alpha-a' }, { id: 'claim-alpha-b' }] } },
    }] });

    const stale = await catalogue.write(enrichHopCommand('fixture-alpha-stale', {
      kind: 'hopVariety', id: created.id, expectedRevision: 1, expectedFingerprint: created.fingerprint,
    }, 'claim-alpha-stale', '8 % masse périmés', 8));
    expect(stale).toMatchObject({ status: 'conflict', scope: 'fixture' });
    const invalid = await catalogue.write({ schemaVersion: 1, operationId: '', operation: 'create', entity: { kind: 'hopVariety', value: {} }, claims: [], unmapped: [], projectionChoices: [] } as unknown as BrewerCatalogueCommand);
    expect(invalid).toMatchObject({ status: 'invalid', scope: 'fixture' });
    catalogue.close();
  });
});
