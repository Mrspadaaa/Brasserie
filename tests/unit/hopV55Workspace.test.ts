import { describe, expect, it } from 'vitest';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import type { HopV55WorkspaceEnvelopeV1 } from '../../src/services/hopV55/workspaceRepository';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { hopV55FixtureRecipe, hopV55Workspace } from '../fixtures/hopV55';
import { createHopV55Services } from '../../src/services/hopV55/runtime';
import { createHopV55FixtureServices, makeHopV55FixtureContext,
  HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS, HOP_V55_UNKNOWN_MASS_FUTURE_SEED_REFERENCE_ID,
  HOP_V55_UNKNOWN_MASS_FUTURE_SEED_WORKSPACE_ID,
  type HopV55FixtureCatalogueDatabaseAdapter } from '../../src/services/hopV55/fixtureRuntime';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopAxis, HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopProgramChange } from '../../src/domain/hopDecision/types';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { buildBrewingScenarioRequest, brewingScenarioCurrentReference, simulateBrewingScenario } from '../../src/domain/brewingScenario';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { createBrewingScenarioDossier, readBrewingScenarioRecord } from '../../src/domain/brewingScenarioDossier';
import { adoptHopV55ReferenceHypothesis, ensureHopV55ReferenceJournal, getHopV55AdoptedBaseline,
  getHopV55ReferenceHypotheses, getHopV55ReferenceProjection } from '../../src/services/hopV55/referenceWorkspace';
import { prepareHopV55AdoptedContext } from '../../src/services/hopV55/adoptedContextPreparation';
import { createHopV55ReferenceComparison, readHopV55ReferenceComparison } from '../../src/services/hopV55/referenceComparison';
import { commitHopV55Scenario, hopV55ScenarioRuntimeReference, prepareHopV55ScenarioCommit, readHopV55ScenarioPreparation,
  HOP_V55_SCENARIO_PREPARATION_HASH_KIND } from '../../src/services/hopV55/scenarioCommit';
import { createHopV55DecisionReadingArchive, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import {
  applyHopV55FullRecipeCopy,
  HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT,
  previewHopV55FullRecipeCopy,
  readHopV55FullRecipeCopyReceipt,
  HOP_V55_FULL_RECIPE_COPY_LEGACY_FORMAT,
  type HopV55FullRecipeCopyReceipt,
  type HopV55FullRecipeCopyReceiptV1,
} from '../../src/services/hopV55/fullRecipeCopy';
import { HOP_V55_FULL_RECIPE_COPY_RECOMPUTE_FORMAT, prepareHopV55FullRecipeCopyRecompute,
  readHopV55FullRecipeCopyRecomputePayload } from '../../src/services/hopV55/candidateScenario';
import { HOP_V55_FUTURE_RECIPE_DRAFT_FORMAT, materializeHopV55FutureRecipe, reviseHopV55FutureRecipeDraft } from '../../src/services/hopV55/futureRecipeDraft';
import { makeHopV55FutureRecipeDraftFixture } from '../fixtures/hopV55FutureRecipeDraft';
import knowledgeBootstrap from '../../src/data/hopKnowledgeBootstrap.json';

type Row = HopV55WorkspaceEnvelopeV1;

class MemoryTable implements HopV55WorkspaceTable<Row> {
  rows = new Map<string, Row>();
  private key(rowOrKey: unknown): string {
    if (Array.isArray(rowOrKey)) return JSON.stringify(rowOrKey);
    const row = rowOrKey as Row;
    return JSON.stringify([row.ownerKey, row.workspaceId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: Row) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: Row) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
}

class MemoryDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const snapshot = new Map([...this.workspaces.rows].map(([key, value]) => [key, structuredClone(value)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows = snapshot; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory fixture has no open handle. */ }
}

type ScenarioDossierRow = { ownerKey: string; scenarioId: string; formatVersion: number; [key: string]: unknown };
type ScenarioEventRow = { ownerKey: string; scenarioId: string; eventId: string; eventFormatVersion: number; resultingRevision: number; [key: string]: unknown };

class ScenarioMemoryTable<Row extends Record<string, unknown>> implements BrewingScenarioLocalTable<Row> {
  rows = new Map<string, Row>();
  constructor(private readonly primaryFields: string[]) {}
  private key(value: unknown): string {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as Row;
    return JSON.stringify(this.primaryFields.map(field => row[field]));
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: Row) {
    const key = this.key(row);
    if (this.rows.has(key)) throw Object.assign(new Error('Duplicate key'), { name: 'ConstraintError' });
    this.rows.set(key, structuredClone(row));
  }
  async put(row: Row) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => {
      const fields = index.startsWith('[') ? index.slice(1, -1).split('+') : [index];
      const values = Array.isArray(key) ? key : [key];
      return [...this.rows.values()].filter(row => fields.every((field, index) => row[field] === values[index])).map(row => structuredClone(row));
    } }) };
  }
}

class ScenarioMemoryDatabase implements BrewingScenarioLocalDatabaseAdapter {
  dossiers = new ScenarioMemoryTable<ScenarioDossierRow>(['ownerKey', 'scenarioId']);
  events = new ScenarioMemoryTable<ScenarioEventRow>(['ownerKey', 'eventId']);
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const dossiers = new Map([...this.dossiers.rows].map(([key, value]) => [key, structuredClone(value)]));
      const events = new Map([...this.events.rows].map(([key, value]) => [key, structuredClone(value)]));
      try { return await work(); }
      catch (error) { this.dossiers.rows = dossiers; this.events.rows = events; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Mémoire de test uniquement. */ }
}

function emptyFixtureCatalogueDatabase(): HopV55FixtureCatalogueDatabaseAdapter {
  return {
    records: { get: async () => undefined, add: async () => undefined, put: async () => undefined, toArray: async () => [] },
    operations: { get: async () => undefined, add: async () => undefined },
    transaction: async <T,>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]) => (tablesAndWork.at(-1) as () => Promise<T>)(),
    close() { /* Catalogue de fixture uniquement. */ },
  };
}

async function comparisonWorkspace(ownerKey = 'owner-v55-comparison') {
  const context = makeHopV55FixtureContext('planning');
  const axes = (knowledgeBootstrap as HopKnowledge[]).filter((row): row is HopAxis => row.kind === 'axis');
  context.hopIndex!.knowledge.push(...structuredClone(axes));
  const prepared = prepareBrewingScenarioContext(context);
  const workspace = hopV55Workspace(ownerKey, 'workspace-v55-comparison');
  workspace.scenarioIds = []; workspace.activeScenarioId = undefined; workspace.selected = undefined;
  workspace.snapshotIntents = []; workspace.copies = []; workspace.recipeSaveReceipts = []; workspace.activeCopyId = undefined;
  const current = prepared.runtime.current;
  if (!current) throw new Error('La fixture doit lier une source J5 exacte.');
  const scenarioId = 'scenario-v55-comparison-workspace';
  const request = buildBrewingScenarioRequest({ scenarioId, revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
    contextReference: brewingScenarioCurrentReference(current),
  } });
  // This repository fixture exercises the exact-binding gate. Its adopted NR
  // version therefore points at the same immutable recipe baseline as J5; a
  // hypothetical comparison baseline beside a recipe J5 request is a separate
  // product scenario and must not be conflated in this persistence test.
  const legacyReference = workspace.referenceHypotheses[0];
  if (!legacyReference) throw new Error('La fixture doit fournir une référence explicite à migrer.');
  legacyReference.baseline = structuredClone(request.baseline);
  const opened = ensureHopV55ReferenceJournal(workspace, context, prepared);
  const reference = getHopV55ReferenceProjection(opened)?.currentReference;
  if (!reference || !opened.referenceJournal) throw new Error('La fixture doit fournir une référence explicitement adoptée.');
  const result = simulateBrewingScenario(request, prepared.runtime);
  const created = createBrewingScenarioDossier({ ownerKey, scenarioId, eventId: 'event-v55-comparison-workspace',
    recordedAt: '2026-10-02T09:30:00.000Z', result });
  const scenarioRecord = readBrewingScenarioRecord(created.dossier, [created.event]);
  if ('status' in scenarioRecord) throw new Error('Le snapshot J5 de fixture doit être relisible.');
  const input = { scenarioRecord, snapshotReference: scenarioRecord.currentSnapshot.reference,
    referenceJournal: opened.referenceJournal, adoptedReference: reference,
    selection: { candidateIds: ['baseline', 'adopted-reference'], dimensionIds: axes.map(axis => axis.id) } };
  const comparison = createHopV55ReferenceComparison(input);
  const baseline = scenarioRecord.currentSnapshot.result.baseline;
  const ready: HopV55Workspace = { ...opened, scenarioIds: [scenarioId], activeScenarioId: scenarioId,
    selected: { scenarioId, snapshotReference: scenarioRecord.currentSnapshot.reference, branchId: baseline.id,
      branchReference: baseline.reference }, referenceComparisons: [comparison] };
  ready.sourceRecipeId = context.recipe!.id;
  ready.sourceBatchId = undefined;
  return { workspace: ready, input, comparison, prepared, context, scenarioRecord };
}

async function appliedFullCopy(copyId: string): Promise<{ copy: HopV55Workspace['copies'][number]; receipt: HopV55FullRecipeCopyReceipt }> {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const current = prepared.runtime.current;
  const program = current?.program;
  if (!current || !program) throw new Error('La fixture de recette doit préparer son vrai programme J1.');
  const planned = program.additions.find(row => row.status === 'planned');
  if (!planned || planned.grams === null) throw new Error('La copie fixture exige une dose future explicite.');
  const scenarioId = `scenario-${copyId}`;
  const branchId = `branch-${copyId}`;
  const change: HopProgramChange = { kind: 'replace', additionId: planned.id,
    additions: [{ ...structuredClone(planned), grams: planned.grams + 2 }] };
  const request = buildBrewingScenarioRequest({ scenarioId, revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program,
    contextReference: brewingScenarioCurrentReference(current),
  } });
  request.branches.push({ id: branchId, label: 'Copie v2 workspace', assumptions: [{ id: `dose-${copyId}`, path: 'program.changes',
    label: 'Dose future', status: 'selected', origin: 'userHypothesis', explanation: 'Masse future explicitement choisie.', value: planned.id }],
    programChanges: [change] });
  const result = simulateBrewingScenario(request, prepared.runtime);
  const branch = result.branches.find(row => row.id === branchId);
  if (!branch?.programProposal) throw new Error('La branche fixture doit fournir une proposition J1.');
  const finalHopMasses = branch.programProposal.program.additions.map(row => {
    if (row.grams === null) throw new Error(`Dose finale inconnue pour ${row.id}.`);
    return { additionId: row.id, grams: row.grams };
  });
  const preview = previewHopV55FullRecipeCopy({ result, branchId, context, plan: {
    format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId, adoptHopProgram: true, finalHopMasses,
  }, alphaChoices: Object.fromEntries(current.input.additions.map(row => [row.id, {
    value: 6, reason: 'Sélection explicite de fixture, distincte d’une mesure.',
  }])) });
  if (preview.status !== 'ready') throw new Error(preview.status === 'blocked' ? preview.reason : `Aperçu V2 inattendu : ${preview.status}.`);
  const applied = applyHopV55FullRecipeCopy({ preview: preview.preview, context, copyId,
    createdAt: '2026-10-02T10:00:00.000Z' });
  if (applied.status !== 'ready') throw new Error(applied.status === 'blocked' ? applied.reason : `Application V2 inattendue : ${applied.status}.`);
  return { copy: applied.copy, receipt: applied.receipt };
}

function historicalV1Receipt(receipt: HopV55FullRecipeCopyReceipt): HopV55FullRecipeCopyReceiptV1 {
  const { format: _format, candidatePredictionScope: _candidatePredictionScope, candidateProgramAnnex: _candidateProgramAnnex,
    originAnnex: _originAnnex, previewReference: _previewReference, finalRecipe: _finalRecipe,
    finalRecipeReference: _finalRecipeReference, integritySeal: _integritySeal, ...body } = receipt;
  return { ...body, format: HOP_V55_FULL_RECIPE_COPY_LEGACY_FORMAT };
}

function workspaceWithFullCopy(copy: HopV55Workspace['copies'][number], receipt: HopV55FullRecipeCopyReceipt | HopV55FullRecipeCopyReceiptV1,
  ownerKey: string, id: string): HopV55Workspace {
  const workspace = hopV55Workspace(ownerKey, id);
  workspace.sourceRecipeId = copy.sourceRecipeId; workspace.sourceBatchId = undefined;
  workspace.scenarioIds = [copy.scenarioId]; workspace.activeScenarioId = copy.scenarioId;
  workspace.selected = { scenarioId: copy.scenarioId, snapshotReference: copy.snapshotReference,
    branchId: copy.branchId, branchReference: copy.branchReference };
  workspace.snapshotIntents = []; workspace.copies = [structuredClone(copy)]; workspace.activeCopyId = copy.id;
  workspace.recipeSaveReceipts = [];
  workspace.fullCopyReceipts = [structuredClone(receipt)];
  return workspace;
}

describe('Dépôt workspace V5.5', () => {
  it('stocke une enveloppe v1, clone dans les deux sens et conserve les IDs de copie/snapshot', async () => {
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-a', database });
    const input = hopV55Workspace();
    const created = await repository.save(input, null);

    expect(created).toMatchObject({ revision: 1, id: 'workspace-v55-a', ownerKey: 'owner-v55-a' });
    expect(database.workspaces.rows.get(JSON.stringify(['owner-v55-a', 'workspace-v55-a']))).toMatchObject({
      format: 'hop-v55-workspace-envelope-v1', ownerKey: 'owner-v55-a', workspaceId: 'workspace-v55-a', revision: 1,
    });
    expect(input.revision).toBe(0);
    input.copies[0].recipe.hops[0].name = 'Mutation après écriture';
    created.copies[0].recipe.hops[0].name = 'Mutation du résultat rendu';
    created.copies[0].snapshotReference = 'altéré';

    const read = await repository.read('owner-v55-a', 'workspace-v55-a');
    expect(read?.copies[0]).toMatchObject({ id: 'copy-v1', snapshotReference: 'snapshot-reference-v1', branchReference: 'branch-reference-v1' });
    expect(read?.copies[0].recipe.hops[0].name).toBe('Identité fictive A');
    expect(read?.selected?.snapshotReference).toBe('snapshot-reference-v1');
    expect(read?.snapshotIntents?.[0].intent.criteria[0]).toMatchObject({ axisId: 'axis-citrus', familyId: 'family-aroma' });
    expect(read?.recipeSaveReceipts).toEqual([{ copyId: 'copy-v1', recipeId: 'copy-recipe-v1', confirmedAt: '2026-10-02T08:01:00.000Z' }]);
    expect((await repository.list('owner-v55-a')).map(row => row.id)).toEqual(['workspace-v55-a']);
    repository.close();
  });

  it('persiste une hypothèse adoptée avant calcul sans question inventée, avec CAS et références intactes', async () => {
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-no-question', database });
    const draft = hopV55Workspace('owner-v55-no-question', 'workspace-v55-no-question');
    const source = { title: 'Source explicite de fixture', author: 'Fixture', year: 2026,
      kind: 'observation' as const, reference: 'fixture://hop-v55/no-question-source' };
    draft.referenceHypotheses[0].label = 'Hypothèse adoptée avant calcul';
    draft.referenceHypotheses[0].baseline = {
      kind: 'hypothetical', label: 'Hypothèse explicite',
      input: { volumeL: 20, yeastId: null, additions: [], fermentation: [],
        yeastTemperature: { range: { min: 18, max: 20 }, source } },
    };
    const adoptedBaseline = structuredClone(draft.referenceHypotheses[0].baseline);
    draft.intent = { question: '', criteria: [] };
    draft.scenarioIds = [];
    draft.activeScenarioId = undefined;
    draft.selected = undefined;
    draft.snapshotIntents = [];
    draft.copies = [];
    draft.activeCopyId = undefined;
    draft.recipeSaveReceipts = [];

    const created = await repository.save(draft, null);
    const next = structuredClone(created);
    next.title = 'Hypothèse conservée avant calcul';
    const updated = await repository.save(next, created.revision);
    const reloaded = await repository.read('owner-v55-no-question', created.id);

    expect(updated.revision).toBe(2);
    expect(reloaded).toMatchObject({
      revision: 2,
      intent: { question: '', criteria: [] },
      scenarioIds: [],
      referenceHypotheses: [{ id: 'hypothesis-v1', version: 1, label: 'Hypothèse adoptée avant calcul', baseline: adoptedBaseline }],
    });
    expect(reloaded?.referenceHypotheses[0].baseline).toMatchObject({ input: { yeastTemperature: { source } } });
    repository.close();
  });

  it('fusionne le contexte par identité et laisse ses versions gagner sur les références bundlées', async () => {
    const references = await loadBrewingCatalogueReferences();
    const referenceHop = references.varieties[0];
    const referenceKnowledge = references.knowledge.find(row => 'name' in row && typeof row.name === 'string');
    if (!referenceHop || !referenceKnowledge) throw new Error('Références locales attendues pour ce contrôle.');
    const contextHop = { ...structuredClone(referenceHop), name: 'Nom du contexte courant' };
    const contextKnowledge = { ...structuredClone(referenceKnowledge), name: 'Connaissance du contexte courant' };
    const context: BrewerContext = {
      hopIndex: { varieties: [contextHop], lots: [], knowledge: [contextKnowledge], predictions: [], tastings: [], truncated: [] },
      inventory: [], material: [], waterSources: [], phase: 'Test', now: 1, provenance: [],
    };
    const services = createHopV55Services({ ownerKey: 'owner-v55-local-context', context, databasePrefix: 'hop-v55-context-test' });
    const loaded = await services.loadContext();
    expect(services.scope).toBe('local');
    expect(services.catalogue.scope).toBe('server');
    expect(loaded.hopIndex?.varieties.find(row => row.id === referenceHop.id)?.name).toBe('Nom du contexte courant');
    expect(loaded.hopIndex?.knowledge.find(row => row.id === referenceKnowledge.id)).toMatchObject({ name: 'Connaissance du contexte courant' });
    expect(contextHop.name).toBe('Nom du contexte courant');
    services.close();

    const launchedContext = structuredClone(context);
    launchedContext.batch = { id: 'batch-v55-launched', status: 'fermentation' };
    const launched = createHopV55Services({ ownerKey: 'owner-v55-launched', context: launchedContext,
      databasePrefix: 'hop-v55-launched-test' });
    await expect(launched.loadContext(hopV55Workspace().copies[0].recipe)).rejects.toThrow('déjà commencé');
    launched.close();
  });

  it('refuse le mauvais owner, une révision périmée et une copie structurellement cassée', async () => {
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-a', database });
    const first = await repository.save(hopV55Workspace(), null);
    const update: HopV55Workspace = structuredClone(first);
    update.title = 'Version courante';
    const second = await repository.save(update, 1);
    expect(second.revision).toBe(2);

    const stale = structuredClone(first);
    stale.title = 'Écriture périmée';
    await expect(repository.save(stale, 1)).rejects.toMatchObject({ code: 'staleRevision' });
    await expect(repository.read('owner-v55-b', first.id)).rejects.toMatchObject({ code: 'ownerMismatch' });
    await expect(repository.list('owner-v55-b')).rejects.toMatchObject({ code: 'ownerMismatch' });
    await expect(repository.save({ ...hopV55Workspace(), ownerKey: 'owner-v55-b' }, null))
      .rejects.toMatchObject({ code: 'ownerMismatch' });

    const broken = structuredClone(second);
    broken.activeCopyId = 'missing-copy';
    await expect(repository.save(broken, 2)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read('owner-v55-a', first.id)).resolves.toMatchObject({ title: 'Version courante', revision: 2 });
    repository.close();
  });

  it('garde referenceHypotheses comme source legacy en lecture seule après la migration', async () => {
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-legacy', database: new MemoryDatabase() });
    const first = await repository.save(hopV55Workspace('owner-v55-legacy', 'workspace-v55-legacy'), null);
    const attemptedAppend = structuredClone(first);
    attemptedAppend.referenceHypotheses.push({ ...structuredClone(first.referenceHypotheses[0]),
      id: 'new-legacy-write', version: 2, label: 'Nouvelle entrée dans le champ historique' });
    await expect(repository.save(attemptedAppend, first.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read('owner-v55-legacy', first.id))
      .resolves.toMatchObject({ revision: 1, referenceHypotheses: [{ id: 'hypothesis-v1' }] });
    repository.close();
  });

  it('conserve uniquement les reçus serveur explicitement fournis, structurés et liés au snapshot', async () => {
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-receipts', database: new MemoryDatabase() });
    const draft = hopV55Workspace('owner-v55-receipts', 'workspace-v55-receipts');
    const receipt = {
      scenarioId: 'scenario-v1', snapshotReference: 'snapshot-server-v1', operationId: 'operation-server-v1',
      revision: 4, reference: 'server-reference-v1', committedAt: '2026-10-02T09:00:00.000Z', scope: 'serverConfirmed' as const,
    };
    const expected = structuredClone(receipt);
    draft.serverScenarioReceipts = [receipt];

    const created = await repository.save(draft, null);
    draft.serverScenarioReceipts[0].reference = 'mutated input';
    created.serverScenarioReceipts![0].reference = 'mutated returned value';
    const reopened = await repository.read('owner-v55-receipts', created.id);

    expect(created.serverScenarioReceipts?.[0].reference).toBe('mutated returned value');
    expect(reopened?.serverScenarioReceipts).toEqual([expected]);
    repository.close();
  });

  it('refuse un faux reçu local, un rattachement absent, une identité dupliquée ou un reçu altéré', async () => {
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-invalid-receipts', database: new MemoryDatabase() });
    const draft = hopV55Workspace('owner-v55-invalid-receipts', 'workspace-v55-invalid-receipts');
    const valid = {
      scenarioId: 'scenario-v1', snapshotReference: 'snapshot-server-v1', operationId: 'operation-server-v1',
      revision: 4, reference: 'server-reference-v1', committedAt: '2026-10-02T09:00:00.000Z', scope: 'serverConfirmed' as const,
    };
    const invalidRows: unknown[][] = [
      [{ ...valid, scope: 'local' }],
      [{ ...valid, scenarioId: 'scenario-absent' }],
      [valid, { ...valid, snapshotReference: 'snapshot-server-v2' }],
      [{ ...valid, reference: '' }],
      [{ ...valid, committedAt: 'date inconnue' }],
      [{ ...valid, serverClaim: true }],
    ];
    for (const receipts of invalidRows) {
      await expect(repository.save({ ...structuredClone(draft), serverScenarioReceipts: receipts as never }, null))
        .rejects.toMatchObject({ code: 'invalidInput' });
    }
    repository.close();
  });

  it('autorise l’ajout CAS d’un reçu serveur mais protège le préfixe historique contre modification et retrait', async () => {
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-receipt-prefix', database: new MemoryDatabase() });
    const draft = hopV55Workspace('owner-v55-receipt-prefix', 'workspace-v55-receipt-prefix');
    const firstReceipt = {
      scenarioId: 'scenario-v1', snapshotReference: 'snapshot-server-v1', operationId: 'operation-server-v1',
      revision: 4, reference: 'server-reference-v1', committedAt: '2026-10-02T09:00:00.000Z', scope: 'serverConfirmed' as const,
    };
    draft.serverScenarioReceipts = [firstReceipt];
    const created = await repository.save(draft, null);
    const appended = structuredClone(created);
    appended.updatedAt = '2026-10-02T09:05:00.000Z';
    appended.serverScenarioReceipts!.push({ ...firstReceipt, snapshotReference: 'snapshot-server-v2', operationId: 'operation-server-v2',
      revision: 5, reference: 'server-reference-v2', committedAt: '2026-10-02T09:05:00.000Z' });
    const saved = await repository.save(appended, created.revision);
    expect(saved.serverScenarioReceipts).toHaveLength(2);
    expect((await repository.read('owner-v55-receipt-prefix', created.id))?.serverScenarioReceipts).toEqual(appended.serverScenarioReceipts);

    const tampered = structuredClone(saved);
    tampered.serverScenarioReceipts![0].reference = 'rewritten-reference';
    await expect(repository.save(tampered, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const removed = structuredClone(saved);
    removed.serverScenarioReceipts!.shift();
    await expect(repository.save(removed, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read('owner-v55-receipt-prefix', created.id)).resolves.toMatchObject({
      revision: 2, serverScenarioReceipts: [{ operationId: 'operation-server-v1' }, { operationId: 'operation-server-v2' }],
    });
    repository.close();
  });

  it('refuse de réécrire une recette de copie après conservation, même si son reçu recette existe', async () => {
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-copy-immutability', database: new MemoryDatabase() });
    const draft = hopV55Workspace('owner-v55-copy-immutability', 'workspace-v55-copy-immutability');
    draft.copies[0].recipe.hops[0].weightG = 18;
    const created = await repository.save(draft, null);
    const attempted = structuredClone(created);
    attempted.updatedAt = '2026-10-02T09:10:00.000Z';
    attempted.copies[0].recipe.hops[0].weightG = 999;

    await expect(repository.save(attempted, created.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const reloaded = await repository.read('owner-v55-copy-immutability', created.id);
    expect(reloaded?.revision).toBe(created.revision);
    expect(reloaded?.copies[0].recipe.hops[0].weightG).toBe(18);
    expect(reloaded?.recipeSaveReceipts).toEqual(created.recipeSaveReceipts);
    repository.close();
  });

  it('conserve les reçus V1 historiques en lecture seule et exige les sceaux V2 pour toute nouvelle copie', async () => {
    const first = await appliedFullCopy('full-copy-v2-workspace-first');
    const second = await appliedFullCopy('full-copy-v2-workspace-second');
    const legacyReceipt = historicalV1Receipt(first.receipt);
    expect(readHopV55FullRecipeCopyReceipt(legacyReceipt)).toMatchObject({ status: 'legacyReadOnly', qualification: 'unsealedHistoricalV1' });

    const freshV1Repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-v1-fresh', database: new MemoryDatabase() });
    const freshV1Workspace = workspaceWithFullCopy(first.copy, legacyReceipt, 'owner-v55-v1-fresh', 'workspace-v55-v1-fresh');
    await expect(freshV1Repository.save(freshV1Workspace, null)).rejects.toMatchObject({ code: 'invalidInput' });
    freshV1Repository.close();

    // Simulate an envelope persisted by the pre-upgrade writer; normal v1 creation is refused above.
    const legacyOwner = 'owner-v55-v1-upgrade';
    const legacyDatabase = new MemoryDatabase();
    const legacyWorkspace = workspaceWithFullCopy(first.copy, legacyReceipt, legacyOwner, 'workspace-v55-v1-upgrade');
    legacyWorkspace.revision = 1;
    await legacyDatabase.workspaces.add({ format: 'hop-v55-workspace-envelope-v1', ownerKey: legacyOwner,
      workspaceId: legacyWorkspace.id, revision: 1, workspace: structuredClone(legacyWorkspace) } as HopV55WorkspaceEnvelopeV1);
    const repository = createHopV55WorkspaceRepository({ ownerKey: legacyOwner, database: legacyDatabase });
    const opened = await repository.read(legacyOwner, legacyWorkspace.id);
    expect(readHopV55FullRecipeCopyReceipt(opened!.fullCopyReceipts![0])).toMatchObject({ status: 'legacyReadOnly' });

    const refreshed = structuredClone(opened!); refreshed.title = 'V1 historique relu';
    const savedLegacy = await repository.save(refreshed, opened!.revision);
    expect(savedLegacy.fullCopyReceipts).toEqual([legacyReceipt]);

    const v1Append = structuredClone(savedLegacy);
    v1Append.scenarioIds.push(second.copy.scenarioId); v1Append.activeScenarioId = second.copy.scenarioId;
    v1Append.selected = { scenarioId: second.copy.scenarioId, snapshotReference: second.copy.snapshotReference,
      branchId: second.copy.branchId, branchReference: second.copy.branchReference };
    v1Append.copies.push(structuredClone(second.copy));
    v1Append.fullCopyReceipts!.push(historicalV1Receipt(second.receipt));
    await expect(repository.save(v1Append, savedLegacy.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const v2Append = structuredClone(savedLegacy);
    v2Append.updatedAt = '2026-10-02T10:05:00.000Z';
    v2Append.scenarioIds.push(second.copy.scenarioId); v2Append.activeScenarioId = second.copy.scenarioId;
    v2Append.selected = { scenarioId: second.copy.scenarioId, snapshotReference: second.copy.snapshotReference,
      branchId: second.copy.branchId, branchReference: second.copy.branchReference };
    v2Append.copies.push(structuredClone(second.copy));
    v2Append.fullCopyReceipts!.push(structuredClone(second.receipt));
    const v2Saved = await repository.save(v2Append, savedLegacy.revision);
    expect(readHopV55FullRecipeCopyReceipt(v2Saved.fullCopyReceipts![1])).toMatchObject({ status: 'available', receipt: {
      finalRecipeReference: second.receipt.finalRecipeReference, finalRecipe: second.copy.recipe,
    } });

    const changedCopy = structuredClone(v2Saved);
    changedCopy.copies[1].recipe.hops[0].weightG += 1;
    await expect(repository.save(changedCopy, v2Saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const changedPlan = structuredClone(v2Saved);
    (changedPlan.fullCopyReceipts![1] as HopV55FullRecipeCopyReceipt).plan.finalHopMasses![0].grams = 999;
    await expect(repository.save(changedPlan, v2Saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read(legacyOwner, legacyWorkspace.id)).resolves.toMatchObject({
      revision: v2Saved.revision,
      fullCopyReceipts: [{ format: HOP_V55_FULL_RECIPE_COPY_LEGACY_FORMAT }, { format: first.receipt.format }],
      copies: [{ id: first.copy.id, recipe: first.copy.recipe }, { id: second.copy.id, recipe: second.copy.recipe }],
    });
    repository.close();
  });

  it('fige les sources à la création et garde IDs scénario et snapshot intentions append-only', async () => {
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-source-immutability', database: new MemoryDatabase() });
    const draft = hopV55Workspace('owner-v55-source-immutability', 'workspace-v55-source-immutability');
    const created = await repository.save(draft, null);
    const appended = structuredClone(created);
    appended.updatedAt = '2026-10-02T09:11:00.000Z';
    appended.scenarioIds.push('scenario-v2');
    appended.snapshotIntents!.push({ scenarioId: 'scenario-v2', snapshotReference: 'snapshot-reference-v2',
      intent: { question: '', criteria: [] } });
    const saved = await repository.save(appended, created.revision);

    const changedRecipe = structuredClone(saved); changedRecipe.sourceRecipeId = 'recipe-posthoc';
    await expect(repository.save(changedRecipe, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const changedBatch = structuredClone(saved); changedBatch.sourceBatchId = undefined;
    await expect(repository.save(changedBatch, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const removedScenario = structuredClone(saved); removedScenario.scenarioIds.shift();
    await expect(repository.save(removedScenario, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const rewrittenIntent = structuredClone(saved); rewrittenIntent.snapshotIntents![0].intent.question = 'Remplacement après coup';
    await expect(repository.save(rewrittenIntent, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const noSourceRepository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-no-source', database: new MemoryDatabase() });
    const noSource = hopV55Workspace('owner-v55-no-source', 'workspace-v55-no-source');
    noSource.sourceRecipeId = undefined; noSource.sourceBatchId = undefined;
    const empty = await noSourceRepository.save(noSource, null);
    const continued = await noSourceRepository.save({ ...empty, intent: { question: 'Nouvelle question sans changer de source.', criteria: [] } }, empty.revision);
    expect(continued.revision).toBe(2);
    const postHocSource = structuredClone(continued); postHocSource.sourceRecipeId = 'recipe-added-after-creation';
    await expect(noSourceRepository.save(postHocSource, continued.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await noSourceRepository.read('owner-v55-no-source', empty.id).then(row => expect(row?.sourceRecipeId).toBeUndefined());
    for (const source of [{ recipeId: 'recipe-only' }, { batchId: 'batch-only' }]) {
      const single = structuredClone(noSource); single.id = 'recipeId' in source ? 'recipe-only-workspace' : 'batch-only-workspace';
      if ('recipeId' in source) single.sourceRecipeId = source.recipeId;
      else single.sourceBatchId = source.batchId;
      const initial = await noSourceRepository.save(single, null);
      const withJournal = ensureHopV55ReferenceJournal(initial, makeHopV55FixtureContext('planning'), prepareBrewingScenarioContext(makeHopV55FixtureContext('planning')));
      await expect(noSourceRepository.save(withJournal, initial.revision)).resolves.toMatchObject({ revision: 2, referenceJournal: withJournal.referenceJournal });
    }
    repository.close(); noSourceRepository.close();
  });

  it('relit les comparaisons strictes et les lie à leur scénario exact dans un préfixe CAS', async () => {
    const seed = await comparisonWorkspace('owner-v55-comparison');
    expect(readHopV55ReferenceComparison(seed.comparison).status).toBe('available');
    const repository = createHopV55WorkspaceRepository({ ownerKey: seed.workspace.ownerKey, database: new MemoryDatabase() });
    const created = await repository.save(seed.workspace, null);
    await expect(repository.read(created.ownerKey, created.id)).resolves.toMatchObject({ referenceComparisons: [seed.comparison] });

    const secondDto = createHopV55ReferenceComparison({ ...seed.input,
      selection: { ...seed.input.selection, preferredCandidateId: 'baseline' } });
    const appended = structuredClone(created);
    appended.updatedAt = '2026-10-02T09:40:00.000Z';
    appended.referenceComparisons!.push(secondDto);
    const saved = await repository.save(appended, created.revision);
    const rewritten = structuredClone(saved);
    rewritten.referenceComparisons![0] = secondDto;
    await expect(repository.save(rewritten, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const orphaned = structuredClone(seed.workspace);
    orphaned.id = 'workspace-v55-comparison-orphan'; orphaned.scenarioIds = []; orphaned.activeScenarioId = undefined; orphaned.selected = undefined;
    await expect(repository.save(orphaned, null)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read(created.ownerKey, created.id)).resolves.toMatchObject({ revision: 2, referenceComparisons: appended.referenceComparisons });
    repository.close();
  });

  it('prépare avant le premier J5, fige R1 et refuse la réécriture de la préparation', async () => {
    const seed = await comparisonWorkspace('owner-v55-preparation');
    const repository = createHopV55WorkspaceRepository({ ownerKey: seed.workspace.ownerKey, database: new MemoryDatabase() });
    const createdWorkspace = await repository.save(seed.workspace, null);
    const current = seed.prepared.runtime.current!;
    const scenarioId = 'scenario-prepared-before-first-result';
    const request = buildBrewingScenarioRequest({ scenarioId, revision: 1, baseline: {
      kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
      contextReference: brewingScenarioCurrentReference(current),
    } });
    const resolvedR1 = prepareHopV55AdoptedContext({ context: seed.context, workspace: createdWorkspace,
      expected: seed.input.adoptedReference });
    if (resolvedR1.resolution.status !== 'resolved') throw new Error('La fixture doit relire le binding NR A exact.');
    const committed = await prepareHopV55ScenarioCommit({
      services: { ownerKey: seed.workspace.ownerKey, scenarios: { read: async () => null } as any, workspaces: repository },
      workspace: { id: seed.workspace.id, ownerKey: seed.workspace.ownerKey },
      id: 'preparation-before-first-result', ownerKey: seed.workspace.ownerKey, workspaceId: seed.workspace.id,
      eventId: 'j5-event-before-first-result', scenarioId, operation: 'create', request,
      runtimeReference: hopV55ScenarioRuntimeReference(seed.prepared.runtime), intent: seed.workspace.intent,
      reference: seed.input.adoptedReference, source: { kind: 'recipe', recipeId: seed.workspace.sourceRecipeId! },
      cultureBinding: resolvedR1.cultureBinding,
      createdAt: '2026-10-02T09:45:00.000Z',
    });
    const preparation = committed.preparation;
    expect(committed.workspace.revision).toBe(createdWorkspace.revision + 1);
    expect(committed.workspace.scenarioIds).not.toContain(scenarioId);
    expect(readHopV55ScenarioPreparation(committed.workspace.scenarioPreparations![0])).toMatchObject({
      status: 'available', preparation: { id: preparation.id, eventId: preparation.eventId, requestReference: preparation.requestReference,
        runtimeReference: preparation.runtimeReference, reference: seed.input.adoptedReference },
    });

    const nextReference = { ...structuredClone(seed.workspace.referenceHypotheses[0]), version: 2,
      label: 'R2 adoptée après la préparation R1', recordedAt: '2026-10-02T09:50:00.000Z' };
    const adoptedR2 = adoptHopV55ReferenceHypothesis(committed.workspace, nextReference, seed.context, seed.prepared);
    const savedR2 = await repository.save(adoptedR2, committed.workspace.revision);
    expect(getHopV55ReferenceProjection(savedR2)?.currentReference?.version).toBe('2');
    expect(readHopV55ScenarioPreparation(savedR2.scenarioPreparations![0])).toMatchObject({
      status: 'available', preparation: { reference: seed.input.adoptedReference },
    });

    const reevaluationRequest = buildBrewingScenarioRequest({ scenarioId: seed.scenarioRecord.dossier.scenarioId, revision: 2,
      baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
        contextReference: brewingScenarioCurrentReference(current) } });
    const referenceR2 = getHopV55ReferenceProjection(savedR2)?.currentReference;
    if (!referenceR2) throw new Error('La fixture doit relire la référence R2 après son adoption.');
    const resolvedR2 = prepareHopV55AdoptedContext({ context: seed.context, workspace: savedR2, expected: referenceR2 });
    if (resolvedR2.resolution.status !== 'resolved') throw new Error('La fixture doit relire le binding NR B exact.');
    const reevaluation = await prepareHopV55ScenarioCommit({
      services: { ownerKey: seed.workspace.ownerKey, scenarios: { read: async () => ({ status: 'available', record: seed.scenarioRecord }) } as any,
        workspaces: repository },
      workspace: { id: savedR2.id, ownerKey: savedR2.ownerKey }, id: 'reevaluation-preparation-r1', ownerKey: savedR2.ownerKey,
      workspaceId: savedR2.id, eventId: 'reevaluation-event-r1', scenarioId: seed.scenarioRecord.dossier.scenarioId,
      operation: 'reevaluate', request: reevaluationRequest,
      runtimeReference: hopV55ScenarioRuntimeReference(seed.prepared.runtime), intent: savedR2.intent,
      reference: referenceR2, cultureBinding: resolvedR2.cultureBinding, source: { kind: 'recipe', recipeId: savedR2.sourceRecipeId! },
      prior: { scenarioId: seed.scenarioRecord.dossier.scenarioId, snapshotReference: seed.scenarioRecord.currentSnapshot.reference,
        resultRevision: seed.scenarioRecord.dossier.currentResultRevision, dossierRevision: seed.scenarioRecord.dossier.revision },
      createdAt: '2026-10-02T09:52:00.000Z',
    });
    expect(reevaluation.preparation.operation).toBe('reevaluate');
    expect(reevaluation.preparation.prior?.scenarioId).toBe(seed.scenarioRecord.dossier.scenarioId);
    expect(reevaluation.preparation.reference).toEqual(referenceR2);
    expect(readHopV55ScenarioPreparation(reevaluation.workspace.scenarioPreparations![1]).status).toBe('available');

    const currentWorkspace = reevaluation.workspace;
    const tampered = structuredClone(currentWorkspace);
    const priorPreparation = tampered.scenarioPreparations![0];
    priorPreparation.intent.question = 'Raison remplacée après la préparation';
    const { contentReference: _contentReference, ...body } = priorPreparation;
    priorPreparation.contentReference = hopAdviceContentReference(HOP_V55_SCENARIO_PREPARATION_HASH_KIND, body);
    await expect(repository.save(tampered, currentWorkspace.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const wrongSourceBody = { ...preparation, source: { kind: 'exploration' as const } };
    const { contentReference: _wrongContentReference, ...wrongSourceWithoutHash } = wrongSourceBody;
    const wrongSource = { ...wrongSourceWithoutHash,
      contentReference: hopAdviceContentReference(HOP_V55_SCENARIO_PREPARATION_HASH_KIND, wrongSourceWithoutHash) };
    const sourceAttempt = { ...currentWorkspace, scenarioPreparations: [wrongSource] };
    await expect(repository.save(sourceAttempt, currentWorkspace.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const finalized = structuredClone(currentWorkspace);
    finalized.updatedAt = '2026-10-02T09:55:00.000Z';
    finalized.scenarioIds.push(preparation.scenarioId);
    finalized.activeScenarioId = preparation.scenarioId;
    finalized.snapshotIntents!.push({ scenarioId: preparation.scenarioId, snapshotReference: 'snapshot-received-after-preparation',
      intent: structuredClone(preparation.intent) });
    const finalizedWorkspace = await repository.save(finalized, currentWorkspace.revision);
    expect(finalizedWorkspace.scenarioIds).toContain(preparation.scenarioId);
    expect(finalizedWorkspace.scenarioPreparations).toEqual(currentWorkspace.scenarioPreparations);

    const newCreateForExisting = structuredClone(preparation);
    newCreateForExisting.id = 'different-create-for-attached-scenario';
    newCreateForExisting.eventId = 'different-event-for-attached-scenario';
    const { contentReference: _oldReference, ...newCreateBody } = newCreateForExisting;
    newCreateForExisting.contentReference = hopAdviceContentReference(HOP_V55_SCENARIO_PREPARATION_HASH_KIND, newCreateBody);
    const attemptedLateCreate = structuredClone(finalizedWorkspace);
    attemptedLateCreate.scenarioPreparations!.push(newCreateForExisting);
    await expect(repository.save(attemptedLateCreate, finalizedWorkspace.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.read(finalizedWorkspace.ownerKey, finalizedWorkspace.id)).resolves.toMatchObject({
      revision: finalizedWorkspace.revision, scenarioPreparations: finalizedWorkspace.scenarioPreparations,
    });
    repository.close();
  });

  it('persiste une reprise scellée avant J5, refuse doublons/tampering et la garde après rattachement du scénario', async () => {
    const context = makeHopV55FixtureContext('planning');
    const prepared = prepareBrewingScenarioContext(context);
    const current = prepared.runtime.current;
    if (!current) throw new Error('La fixture planning doit fournir une recette source exacte.');
    const originalRequest = buildBrewingScenarioRequest({ scenarioId: 'source-candidate-recompute', revision: 1,
      baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
        ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current) } });
    originalRequest.branches.push({ id: 'candidate-recompute-branch', label: 'Branche source', assumptions: [] });
    const originalResult = simulateBrewingScenario(originalRequest, prepared.runtime);
    const recomputed = prepareHopV55FullRecipeCopyRecompute({ context, result: originalResult,
      branchId: 'candidate-recompute-branch', candidate: structuredClone(context.recipe!),
      plan: { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: 'candidate-recompute-branch' },
      alphaChoices: {}, identity: { scenarioId: 'scenario-copy-recompute-pending', revision: 1 },
      reasons: ['Reprise locale de fixture, sans écriture de recette.'] });
    expect(recomputed.status).toBe('ready');
    if (recomputed.status !== 'ready') throw new Error(recomputed.reason);
    const payload = recomputed.payload;
    expect(readHopV55FullRecipeCopyRecomputePayload(payload)).toMatchObject({ status: 'available', payload: {
      format: HOP_V55_FULL_RECIPE_COPY_RECOMPUTE_FORMAT, scenarioId: 'scenario-copy-recompute-pending',
      snapshotReference: payload.result.reference, branchReference: payload.result.branches[0].reference,
    } });
    expect(readHopV55FullRecipeCopyRecomputePayload({ ...payload, snapshotReference: 'snapshot-tampered' }).status).toBe('invalid');

    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey: 'owner-v55-copy-recompute', database });
    const draft = hopV55Workspace('owner-v55-copy-recompute', 'workspace-v55-copy-recompute');
    draft.sourceRecipeId = context.recipe!.id;
    draft.sourceBatchId = undefined;
    draft.scenarioIds = [];
    draft.activeScenarioId = undefined;
    draft.selected = undefined;
    draft.snapshotIntents = [];
    draft.copies = [];
    draft.recipeSaveReceipts = [];
    draft.fullCopyReceipts = [];
    draft.activeCopyId = undefined;
    draft.copyRecomputations = [payload];
    const saved = await repository.save(draft, null);
    expect(saved.copyRecomputations).toEqual([payload]);
    expect(saved.scenarioIds).not.toContain(payload.scenarioId);
    await expect(repository.read(saved.ownerKey, saved.id)).resolves.toMatchObject({ copyRecomputations: [payload] });

    const duplicate = structuredClone(saved);
    duplicate.copyRecomputations!.push(structuredClone(payload));
    await expect(repository.save(duplicate, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const changedHistory = structuredClone(saved);
    const historical = changedHistory.copyRecomputations![0];
    const { contentReference: _priorContentReference, ...historicalBody } = historical;
    const changedBody = { ...historicalBody, reasons: ['Raison historique remplacée'] };
    changedHistory.copyRecomputations![0] = { ...changedBody,
      contentReference: hopAdviceContentReference(HOP_V55_FULL_RECIPE_COPY_RECOMPUTE_FORMAT, changedBody) };
    await expect(repository.save(changedHistory, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const attached = structuredClone(saved);
    attached.scenarioIds.push(payload.scenarioId);
    attached.activeScenarioId = payload.scenarioId;
    attached.selected = { scenarioId: payload.scenarioId, snapshotReference: payload.snapshotReference,
      branchId: payload.branchId, branchReference: payload.branchReference };
    const afterJ5 = await repository.save(attached, saved.revision);
    expect(afterJ5.copyRecomputations).toEqual(saved.copyRecomputations);
    expect(afterJ5.scenarioIds).toContain(payload.scenarioId);
    await expect(repository.read(afterJ5.ownerKey, afterJ5.id)).resolves.toMatchObject({
      scenarioIds: [payload.scenarioId], copyRecomputations: [payload],
    });
    repository.close();
  });

  it('persiste la lecture exacte avant J5 et conserve sa référence scellée sur le snapshot après reload', async () => {
    const ownerKey = 'owner-v55-decision-reading';
    const workspaceId = 'workspace-v55-decision-reading';
    const context = makeHopV55FixtureContext('planning');
    const sourceRecipeId = context.recipe!.id;
    const workspaceRepository = createHopV55WorkspaceRepository({ ownerKey, database: new MemoryDatabase() });
    const scenarioRepository = createBrewingScenarioLocalRepository({ ownerKey, database: new ScenarioMemoryDatabase() });
    const draft = hopV55Workspace(ownerKey, workspaceId);
    draft.sourceRecipeId = sourceRecipeId;
    draft.sourceBatchId = undefined;
    draft.scenarioIds = [];
    draft.activeScenarioId = undefined;
    draft.selected = undefined;
    draft.snapshotIntents = [];
    draft.copies = [];
    draft.recipeSaveReceipts = [];
    draft.fullCopyReceipts = [];
    draft.activeCopyId = undefined;
    const reading = { intent: structuredClone(draft.intent), interpretation: 'Lecture locale archivée avant la simulation.',
      branches: [], unresolved: [] };
    const archive = createHopV55DecisionReadingArchive({ id: 'reading-before-j5', ownerKey, workspaceId,
      recordedAt: '2026-10-02T15:00:00.000Z', reading, source: { kind: 'recipe', id: sourceRecipeId },
      runtimeReference: 'runtime-at-reading-before-refresh' });
    draft.decisionReadings = [archive];
    const opened = await workspaceRepository.save(draft, null);
    expect(opened.scenarioIds).toEqual([]);
    expect(readHopV55DecisionReadingArchive(opened.decisionReadings![0])).toMatchObject({
      status: 'available', archive: { contentReference: archive.contentReference, runtimeReference: 'runtime-at-reading-before-refresh' },
    });

    const tamperedPrefix = structuredClone(opened);
    const changed = { ...tamperedPrefix.decisionReadings![0], reading: { ...reading,
      interpretation: 'Interprétation remplacée après sauvegarde.' } };
    const { contentReference: _oldReference, ...changedBody } = changed;
    const alteredArchive = createHopV55DecisionReadingArchive({ ...changedBody,
      reading: changedBody.reading, source: changedBody.source, runtimeReference: changedBody.runtimeReference });
    tamperedPrefix.decisionReadings![0] = alteredArchive;
    await expect(workspaceRepository.save(tamperedPrefix, opened.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const wrongSourceWorkspaceId = 'workspace-v55-wrong-reading-source';
    const wrongSource = createHopV55DecisionReadingArchive({ id: 'reading-wrong-source', ownerKey, workspaceId: wrongSourceWorkspaceId,
      recordedAt: '2026-10-02T15:01:00.000Z', reading, source: { kind: 'recipe', id: 'recipe-from-another-workspace' },
      runtimeReference: 'runtime-stamped-with-that-reading' });
    await expect(workspaceRepository.save({ ...draft, id: wrongSourceWorkspaceId, decisionReadings: [wrongSource] }, null))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const wrongOwner = createHopV55DecisionReadingArchive({ id: 'reading-wrong-owner', ownerKey: 'other-owner', workspaceId,
      recordedAt: '2026-10-02T15:01:30.000Z', reading, source: { kind: 'recipe', id: sourceRecipeId },
      runtimeReference: 'runtime-stamped-under-other-owner' });
    await expect(workspaceRepository.save({ ...opened, decisionReadings: [...opened.decisionReadings!, wrongOwner] }, opened.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const prepared = prepareBrewingScenarioContext(context);
    const current = prepared.runtime.current!;
    const scenarioId = 'scenario-v55-decision-reading';
    const request = buildBrewingScenarioRequest({ scenarioId, revision: 1, baseline: {
      kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
      ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current),
    } });
    let calls = 0;
    const committed = await commitHopV55Scenario({
      services: { ownerKey, workspaces: workspaceRepository, scenarios: scenarioRepository },
      workspace: { id: workspaceId, ownerKey }, id: 'prepare-decision-reading-before-j5', ownerKey, workspaceId,
      eventId: 'event-decision-reading-before-j5', scenarioId, operation: 'create', request,
      runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime), intent: reading.intent, reference: null,
      decisionReadingReference: archive.contentReference, source: { kind: 'recipe', recipeId: sourceRecipeId },
      createdAt: '2026-10-02T15:02:00.000Z', now: () => '2026-10-02T15:03:00.000Z',
      compute: async freshRequest => {
        calls += 1;
        const beforeJ5 = await workspaceRepository.read(ownerKey, workspaceId);
        expect(beforeJ5?.decisionReadings).toEqual([archive]);
        const preparation = readHopV55ScenarioPreparation(beforeJ5?.scenarioPreparations?.[0]);
        expect(preparation).toMatchObject({ status: 'available', preparation: { decisionReadingReference: archive.contentReference } });
        // The original reading stamp is intentionally retained; it need not equal this compute's runtime stamp.
        expect(beforeJ5?.decisionReadings?.[0].runtimeReference).not.toBe(hopV55ScenarioRuntimeReference(prepared.runtime));
        return simulateBrewingScenario(freshRequest, prepared.runtime);
      },
    });
    expect(calls).toBe(1);
    expect(committed.preparation.decisionReadingReference).toBe(archive.contentReference);
    expect(committed.workspace.snapshotIntents).toContainEqual({ scenarioId, snapshotReference: committed.snapshot.reference,
      intent: reading.intent, decisionReadingReference: archive.contentReference });
    const wrongIntentLink = structuredClone(committed.workspace);
    wrongIntentLink.snapshotIntents![0].intent.question = 'Question remplacée après lecture archivée.';
    await expect(workspaceRepository.save(wrongIntentLink, committed.workspace.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const resumed = await commitHopV55Scenario({
      services: { ownerKey, workspaces: workspaceRepository, scenarios: scenarioRepository },
      workspace: { id: workspaceId, ownerKey }, id: 'prepare-decision-reading-before-j5', ownerKey, workspaceId,
      eventId: 'event-decision-reading-before-j5', scenarioId, operation: 'create', request,
      runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime), intent: reading.intent, reference: null,
      decisionReadingReference: archive.contentReference, source: { kind: 'recipe', recipeId: sourceRecipeId },
      compute: () => { calls += 1; throw new Error('Une reprise au reçu exact ne doit pas recalculer.'); },
    });
    expect(calls).toBe(1);
    expect(resumed.snapshot.reference).toBe(committed.snapshot.reference);
    const reloaded = await workspaceRepository.read(ownerKey, workspaceId);
    expect(reloaded?.decisionReadings).toEqual([archive]);
    expect(reloaded?.snapshotIntents?.[0].decisionReadingReference).toBe(archive.contentReference);
    workspaceRepository.close();
    scenarioRepository.close();
  });

  it('valide les lectures futures sur une révision historique exacte et garde un seul pointeur actif', async () => {
    const fixture = makeHopV55FutureRecipeDraftFixture();
    const revised = reviseHopV55FutureRecipeDraft(fixture.draft, { revision: 2, declaredFields: { name: 'Brouillon futur · révision 2' } });
    expect(revised.status).toBe('ready');
    if (revised.status !== 'ready') throw new Error(revised.reason);
    const draftV1 = fixture.draft;
    const draftV2 = revised.draft;
    const namespace = 'future-draft-history-load';
    const services = createHopV55FixtureServices(namespace, { catalogueDatabase: emptyFixtureCatalogueDatabase(),
      workspaceDatabase: new MemoryDatabase(), loadReferences: async () => ({ varieties: [], knowledge: [] }) });
    const ownerKey = services.ownerKey;
    const workspaceId = 'workspace-with-future-draft';
    const activeFutureDraftSource = { kind: 'localFutureDraft' as const, workspaceId, draftId: draftV2.draftId,
      revision: draftV2.revision, contentReference: draftV2.contentReference };
    const historicalSource = { kind: 'localFutureDraft' as const, workspaceId, draftId: draftV1.draftId,
      revision: draftV1.revision, contentReference: draftV1.contentReference };
    const reading = { intent: structuredClone(draftV1.origin.intent), interpretation: 'Lecture capturée avant rafraîchissement du runtime.',
      branches: structuredClone(draftV1.origin.request.branches), unresolved: [] };
    const archive = createHopV55DecisionReadingArchive({ id: 'reading-of-future-draft-v1', ownerKey, workspaceId,
      recordedAt: '2026-10-02T15:20:00.000Z', reading, source: historicalSource,
      runtimeReference: 'runtime-stamped-when-v1-was-read' });

    const repository = services.workspaces;
    const workspace = hopV55Workspace(ownerKey, workspaceId);
    workspace.intent = structuredClone(draftV1.origin.intent);
    workspace.sourceRecipeId = undefined;
    workspace.sourceBatchId = undefined;
    workspace.scenarioIds = [draftV1.origin.scenarioId];
    workspace.activeScenarioId = draftV1.origin.scenarioId;
    workspace.selected = { scenarioId: draftV1.origin.scenarioId, snapshotReference: draftV1.origin.snapshotReference,
      branchId: draftV1.origin.branchId, branchReference: draftV1.origin.branchReference };
    workspace.referenceHypotheses = [];
    workspace.snapshotIntents = [{ scenarioId: draftV1.origin.scenarioId, snapshotReference: draftV1.origin.snapshotReference,
      intent: structuredClone(draftV1.origin.intent), decisionReadingReference: archive.contentReference }];
    workspace.decisionReadings = [archive];
    workspace.futureDrafts = [draftV1, draftV2];
    workspace.activeFutureDraftSource = activeFutureDraftSource;
    workspace.copies = [];
    workspace.recipeSaveReceipts = [];
    workspace.fullCopyReceipts = [];
    workspace.activeCopyId = undefined;
    workspace.activeProgramCopyId = undefined;
    const created = await repository.save(workspace, null);
    expect(created.futureDrafts).toEqual([draftV1, draftV2]);

    const historicalDraft = await services.loadFutureDraft(historicalSource);
    expect(historicalDraft).toEqual(draftV1);
    expect(created.activeFutureDraftSource).toEqual(activeFutureDraftSource);
    const futureContext = await services.loadContext(undefined, historicalSource);
    expect(futureContext.recipe).toBeUndefined();
    expect(futureContext.batch).toBeUndefined();
    expect(futureContext.journal).toBeUndefined();
    expect(futureContext.phase).toContain('brouillon futur hypothétique');
    expect(futureContext.provenance.join(' ')).toContain(draftV1.draftId);

    const newRequest = structuredClone(draftV1.origin.request);
    newRequest.scenarioId = 'scenario-from-historical-future-draft';
    newRequest.revision = 1;
    const prepared = await prepareHopV55ScenarioCommit({
      services: { ownerKey: services.ownerKey, workspaces: repository, scenarios: { read: async () => null } as any },
      workspace: { id: workspaceId, ownerKey: services.ownerKey }, id: 'prep-from-historical-future-draft',
      ownerKey: services.ownerKey, workspaceId, eventId: 'event-from-historical-future-draft',
      scenarioId: newRequest.scenarioId, operation: 'create', request: newRequest,
      runtimeReference: 'fresh-runtime-after-the-reading', intent: draftV1.origin.intent, reference: null,
      decisionReadingReference: archive.contentReference, source: historicalSource,
      createdAt: '2026-10-02T15:21:00.000Z',
    });
    expect(prepared.preparation.source).toEqual(historicalSource);
    expect(prepared.preparation.decisionReadingReference).toBe(archive.contentReference);
    expect(prepared.workspace.activeFutureDraftSource).toEqual(activeFutureDraftSource);

    const changedArchive = createHopV55DecisionReadingArchive({ id: 'reading-unpersisted-future-draft', ownerKey: services.ownerKey, workspaceId,
      recordedAt: '2026-10-02T15:22:00.000Z', reading, source: { ...historicalSource, contentReference: 'unknown-future-draft-content' },
      runtimeReference: 'runtime-stamp-from-unpersisted-draft' });
    await expect(repository.save({ ...prepared.workspace, decisionReadings: [...prepared.workspace.decisionReadings!, changedArchive] }, prepared.workspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const rewrittenHistory = structuredClone(created);
    const rewrittenDraft = structuredClone(rewrittenHistory.futureDrafts![0]);
    rewrittenDraft.declaredFields.name = 'Réécriture de la version 1';
    const { contentReference: _oldDraftReference, ...rewrittenBody } = rewrittenDraft;
    rewrittenDraft.contentReference = hopAdviceContentReference(HOP_V55_FUTURE_RECIPE_DRAFT_FORMAT, rewrittenBody);
    rewrittenHistory.futureDrafts![0] = rewrittenDraft;
    await expect(repository.save(rewrittenHistory, created.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const conflictingActiveSources = structuredClone(created);
    const existingCopy = hopV55Workspace('temporary-owner', 'temporary-workspace').copies[0];
    conflictingActiveSources.scenarioIds.push(existingCopy.scenarioId);
    conflictingActiveSources.copies.push(existingCopy);
    conflictingActiveSources.activeCopyId = existingCopy.id;
    await expect(repository.save(conflictingActiveSources, created.revision)).rejects.toMatchObject({ code: 'invalidInput' });

    const localNamespace = 'local-future-draft-exact-load';
    const hostContext = makeHopV55FixtureContext('planning');
    hostContext.recipe!.id = 'unrelated-host-recipe-a';
    const localServices = createHopV55Services({ ownerKey: 'owner-local-future-source', databasePrefix: localNamespace,
      context: hostContext, workspaceDatabase: new MemoryDatabase() });
    try {
      const localWorkspaceId = 'workspace-local-future-source';
      const localSource = { ...historicalSource, workspaceId: localWorkspaceId };
      const localArchive = createHopV55DecisionReadingArchive({ id: 'reading-local-future-draft-v1', ownerKey: localServices.ownerKey,
        workspaceId: localWorkspaceId, recordedAt: '2026-10-02T15:23:00.000Z', reading,
        source: localSource, runtimeReference: 'stamped-before-local-reload' });
      const localWorkspace = structuredClone(workspace);
      localWorkspace.id = localWorkspaceId;
      localWorkspace.ownerKey = localServices.ownerKey;
      localWorkspace.decisionReadings = [localArchive];
      localWorkspace.snapshotIntents = [{ scenarioId: draftV1.origin.scenarioId, snapshotReference: draftV1.origin.snapshotReference,
        intent: structuredClone(draftV1.origin.intent), decisionReadingReference: localArchive.contentReference }];
      localWorkspace.activeFutureDraftSource = { ...activeFutureDraftSource, workspaceId: localWorkspaceId };
      await localServices.workspaces.save(localWorkspace, null);
      await expect(localServices.loadFutureDraft(localSource)).resolves.toEqual(draftV1);
      const loadedFutureContext = await localServices.loadContext(undefined, localSource);
      expect(loadedFutureContext.recipe).toBeUndefined();
      expect(loadedFutureContext.batch).toBeUndefined();
      expect(loadedFutureContext.provenance.join(' ')).toContain(draftV1.draftId);
      expect(loadedFutureContext.provenance.join(' ')).not.toContain('unrelated-host-recipe-a');
      await expect(localServices.loadFutureDraft({ ...localSource, contentReference: 'wrong-content-ref' })).rejects.toThrow(/absente ou illisible/i);
      await expect(localServices.loadContext(hostContext.recipe, localSource)).rejects.toThrow(/ne peut pas remplacer un brouillon futur/i);
    } finally { localServices.close(); }

    const otherNamespace = createHopV55FixtureServices(`${namespace}-other`, { catalogueDatabase: emptyFixtureCatalogueDatabase(),
      workspaceDatabase: new MemoryDatabase(), loadReferences: async () => ({ varieties: [], knowledge: [] }) });
    try { await expect(otherNamespace.loadFutureDraft(historicalSource)).rejects.toThrow(/indisponible/i); }
    finally { otherNamespace.close(); services.close(); }
  });

  it('lie une lecture et une préparation à la copie locale effective C, pas à la recette origine A', async () => {
    const ownerKey = 'owner-v55-local-recipe-copy-source';
    const workspaceId = 'workspace-v55-local-recipe-copy-source';
    const sourceRecipeId = 'recipe-physical-origin-a';
    const copyId = 'copy-local-effective-c';
    const copyRecipe = hopV55FixtureRecipe('recipe-effective-c');
    const copy = { id: copyId, recipe: copyRecipe, sourceRecipeId, previewReference: 'preview-copy-effective-c',
      scenarioId: 'scenario-v1', snapshotReference: 'snapshot-copy-effective-c', branchId: 'baseline',
      branchReference: 'branch-copy-effective-c', createdAt: '2026-10-02T15:30:00.000Z', scope: 'local' as const };
    const source = { kind: 'localRecipeCopy' as const, workspaceId, copyId, recipeId: copyRecipe.id,
      recipeReference: hopDecisionReference(copyRecipe) };
    const workspace = hopV55Workspace(ownerKey, workspaceId);
    workspace.title = 'Source locale C, origine A';
    workspace.sourceRecipeId = sourceRecipeId;
    workspace.sourceBatchId = undefined;
    workspace.scenarioIds = ['scenario-v1'];
    workspace.activeScenarioId = 'scenario-v1';
    workspace.selected = { scenarioId: 'scenario-v1', snapshotReference: copy.snapshotReference,
      branchId: copy.branchId, branchReference: copy.branchReference };
    workspace.referenceHypotheses = [];
    workspace.snapshotIntents = [{ scenarioId: 'scenario-v1', snapshotReference: copy.snapshotReference, intent: workspace.intent }];
    workspace.copies = [copy];
    workspace.activeCopyId = copy.id;
    workspace.activeProgramCopyId = undefined;
    workspace.fullCopyReceipts = [];
    workspace.recipeSaveReceipts = [];
    const reading = { intent: structuredClone(workspace.intent), interpretation: 'Lecture sur la copie locale effective C.',
      branches: [], unresolved: [] };
    const archive = createHopV55DecisionReadingArchive({ id: 'reading-local-copy-effective-c', ownerKey, workspaceId,
      recordedAt: '2026-10-02T15:30:30.000Z', reading, source,
      runtimeReference: 'runtime-from-copy-c-not-origin-a' });
    workspace.decisionReadings = [archive];
    workspace.snapshotIntents![0].decisionReadingReference = archive.contentReference;

    const hostContext = makeHopV55FixtureContext('planning');
    hostContext.recipe!.id = sourceRecipeId;
    const services = createHopV55Services({ ownerKey, databasePrefix: 'local-copy-c-effective-runtime', context: hostContext,
      workspaceDatabase: new MemoryDatabase() });
    try {
      await services.workspaces.save(workspace, null);
      const contextFromStoredCopy = await services.loadContext(undefined, source);
      expect(contextFromStoredCopy.recipe).toEqual(copyRecipe);
      expect(contextFromStoredCopy.batch).toBeUndefined();
      expect(contextFromStoredCopy.journal).toBeUndefined();
      expect(contextFromStoredCopy.provenance.join(' ')).toContain(copyId);
      expect(contextFromStoredCopy.provenance.join(' ')).not.toContain(sourceRecipeId);
      expect((await services.loadContext(copyRecipe, source)).recipe).toEqual(copyRecipe);
      const changedRecipe = structuredClone(copyRecipe); changedRecipe.name = 'Recette A substituée';
      await expect(services.loadContext(changedRecipe, source)).rejects.toThrow(/ne correspond pas exactement/i);
      await expect(services.loadContext(undefined, { ...source, recipeReference: 'other-copy-body' }))
        .rejects.toThrow(/ne correspond plus à sa référence/i);
      const withInactiveCopy = await services.workspaces.read(ownerKey, workspaceId);
      const inactiveCopy = structuredClone(withInactiveCopy!);
      inactiveCopy.activeCopyId = undefined;
      await services.workspaces.save(inactiveCopy, withInactiveCopy!.revision);
      expect((await services.loadContext(undefined, source)).recipe).toEqual(copyRecipe);

      const preparedContext = prepareBrewingScenarioContext({ ...hostContext, recipe: copyRecipe });
      const current = preparedContext.runtime.current!;
      const request = buildBrewingScenarioRequest({ scenarioId: 'scenario-new-from-copy-c', revision: 1, baseline: {
        kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
        ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current),
      } });
      const prepared = await prepareHopV55ScenarioCommit({
        services: { ownerKey, workspaces: services.workspaces, scenarios: { read: async () => null } as any },
        workspace: { id: workspaceId, ownerKey }, id: 'preparation-from-copy-c', ownerKey, workspaceId,
        eventId: 'event-from-copy-c', scenarioId: request.scenarioId, operation: 'create', request,
        runtimeReference: hopV55ScenarioRuntimeReference(preparedContext.runtime), intent: reading.intent, reference: null,
        decisionReadingReference: archive.contentReference, source,
        createdAt: '2026-10-02T15:31:00.000Z',
      });
      expect(prepared.preparation.source).toEqual(source);
      expect(prepared.preparation.decisionReadingReference).toBe(archive.contentReference);
      expect(prepared.workspace.sourceRecipeId).toBe(sourceRecipeId);

      const fixtureNamespace = 'fixture-local-copy-c-effective';
      const fixtureServices = createHopV55FixtureServices(fixtureNamespace, { catalogueDatabase: emptyFixtureCatalogueDatabase(),
        workspaceDatabase: new MemoryDatabase(), loadReferences: async () => ({ varieties: [], knowledge: [] }) });
      try {
        const fixtureWorkspaceId = 'workspace-fixture-copy-c';
        const fixtureSource = { ...source, workspaceId: fixtureWorkspaceId };
        const fixtureArchive = createHopV55DecisionReadingArchive({ id: 'reading-fixture-local-copy-c', ownerKey: fixtureServices.ownerKey,
          workspaceId: fixtureWorkspaceId, recordedAt: '2026-10-02T15:32:00.000Z', reading, source: fixtureSource,
          runtimeReference: 'runtime-fixture-copy-c' });
        const fixtureWorkspace = structuredClone(workspace);
        fixtureWorkspace.id = fixtureWorkspaceId;
        fixtureWorkspace.ownerKey = fixtureServices.ownerKey;
        fixtureWorkspace.decisionReadings = [fixtureArchive];
        fixtureWorkspace.snapshotIntents = [{ scenarioId: copy.scenarioId, snapshotReference: copy.snapshotReference,
          intent: structuredClone(reading.intent), decisionReadingReference: fixtureArchive.contentReference }];
        await fixtureServices.workspaces.save(fixtureWorkspace, null);
        const contextFromFixtureCopy = await fixtureServices.loadContext(undefined, fixtureSource);
        expect(contextFromFixtureCopy.recipe).toEqual(copyRecipe);
        expect(contextFromFixtureCopy.batch).toBeUndefined();
        expect(contextFromFixtureCopy.journal).toBeUndefined();
        expect(contextFromFixtureCopy.phase).toContain('copie locale proposée');
      } finally { fixtureServices.close(); }
    } finally { services.close(); }
  });

  it('conserve Recipe matérialisée et reçu avant la confirmation de sauvegarde, sans la requalifier en copie', async () => {
    const fixture = makeHopV55FutureRecipeDraftFixture();
    const alphaChoices = Object.fromEntries(fixture.draft.additions.map(row => [row.additionId,
      { value: 7.5, reason: 'Valeur de travail déclarée pour cette recette fixture, pas une analyse du lot.' }]));
    const selections = { name: 'Bière future déclarée', style: 'Style déclaré explicitement', volumeL: 8,
      boilMin: 60, fermentables: [{ name: 'Malt déclaré', weightKg: 1.5, kind: 'grain' as const, use: 'empatage' as const }],
      yeast: { name: 'Levure déclarée sans identité résolue' }, alphaChoices };
    let allocatedRecipeIds = 0;
    const incomplete = materializeHopV55FutureRecipe(fixture.draft, { ...selections, alphaChoices: {} }, fixture.currentRefs, {
      createRecipeId: () => { allocatedRecipeIds += 1; return 'recipe-should-not-exist-without-alpha'; },
      createReceiptId: () => 'receipt-not-allocated-without-alpha', createdAt: '2026-10-02T15:40:00.000Z',
    });
    expect(incomplete.status).toBe('needsCompletion');
    expect(allocatedRecipeIds).toBe(0);

    const materialized = materializeHopV55FutureRecipe(fixture.draft, selections, fixture.currentRefs, {
      createRecipeId: () => { allocatedRecipeIds += 1; return 'recipe-future-materialized'; },
      createReceiptId: () => 'receipt-future-materialized', createdAt: '2026-10-02T15:41:00.000Z',
    });
    expect(materialized.status).toBe('ready');
    if (materialized.status !== 'ready') throw new Error(materialized.reason ?? 'Matérialisation fixture attendue.');
    expect(allocatedRecipeIds).toBe(1);
    expect(materialized.receipt.recipeId).toBe(materialized.recipe.id);
    expect(materialized.receipt.recipeReference).toBe(hopDecisionReference(materialized.recipe));
    expect(materialized.receipt.draftId).toBe(fixture.draft.draftId);
    expect(materialized.receipt.draftReference).toBe(fixture.draft.contentReference);
    expect(materialized.recipe).not.toHaveProperty('sourceRecipeId');

    const ownerKey = 'owner-v55-future-materialization';
    const workspaceId = 'workspace-v55-future-materialization';
    const workspace = hopV55Workspace(ownerKey, workspaceId);
    workspace.intent = structuredClone(fixture.draft.origin.intent);
    workspace.sourceRecipeId = undefined;
    workspace.sourceBatchId = undefined;
    workspace.scenarioIds = [fixture.draft.origin.scenarioId];
    workspace.activeScenarioId = fixture.draft.origin.scenarioId;
    workspace.selected = { scenarioId: fixture.draft.origin.scenarioId, snapshotReference: fixture.draft.origin.snapshotReference,
      branchId: fixture.draft.origin.branchId, branchReference: fixture.draft.origin.branchReference };
    workspace.referenceHypotheses = [];
    workspace.snapshotIntents = [{ scenarioId: fixture.draft.origin.scenarioId,
      snapshotReference: fixture.draft.origin.snapshotReference, intent: structuredClone(fixture.draft.origin.intent) }];
    workspace.futureDrafts = [fixture.draft];
    workspace.activeFutureDraftSource = { kind: 'localFutureDraft', workspaceId, draftId: fixture.draft.draftId,
      revision: fixture.draft.revision, contentReference: fixture.draft.contentReference };
    workspace.copies = [];
    workspace.activeCopyId = undefined;
    workspace.activeProgramCopyId = undefined;
    workspace.recipeSaveReceipts = [];
    workspace.fullCopyReceipts = [];
    workspace.futureRecipeMaterializations = [];
    workspace.futureRecipeSaveReceipts = [];
    const repository = createHopV55WorkspaceRepository({ ownerKey, database: new MemoryDatabase() });
    try {
      const created = await repository.save(workspace, null);
      const earlyConfirmation = structuredClone(created);
      earlyConfirmation.futureRecipeSaveReceipts!.push({ recipeId: materialized.recipe.id,
        receiptReference: materialized.receipt.contentReference, confirmedAt: '2026-10-02T15:42:00.000Z' });
      await expect(repository.save(earlyConfirmation, created.revision)).rejects.toMatchObject({ code: 'invalidInput' });

      const beforeHostSave = structuredClone(created);
      beforeHostSave.futureRecipeMaterializations!.push({ recipe: materialized.recipe, receipt: materialized.receipt });
      const storedCandidate = await repository.save(beforeHostSave, created.revision);
      expect(storedCandidate.futureRecipeMaterializations).toEqual([{ recipe: materialized.recipe, receipt: materialized.receipt }]);
      expect(storedCandidate.futureRecipeSaveReceipts).toEqual([]);
      expect(storedCandidate.activeFutureDraftSource).toEqual(created.activeFutureDraftSource);
      expect(storedCandidate.sourceRecipeId).toBeUndefined();
      expect(storedCandidate.copies).toEqual([]);
      await expect(repository.read(ownerKey, workspaceId)).resolves.toMatchObject({
        futureRecipeMaterializations: [{ recipe: materialized.recipe, receipt: materialized.receipt }],
        futureRecipeSaveReceipts: [], activeFutureDraftSource: created.activeFutureDraftSource,
      });

      const unpersistedDraftV2 = reviseHopV55FutureRecipeDraft(fixture.draft, {
        revision: 2, declaredFields: { name: 'Draft v2 pas encore persisté' },
      });
      expect(unpersistedDraftV2.status).toBe('ready');
      if (unpersistedDraftV2.status !== 'ready') throw new Error(unpersistedDraftV2.reason);
      const receiptForUnpersistedDraft = materializeHopV55FutureRecipe(unpersistedDraftV2.draft,
        { ...selections, name: 'Recette issue du draft v2 absent' }, fixture.currentRefs,
        { createRecipeId: () => 'recipe-unpersisted-draft-v2', createReceiptId: () => 'receipt-unpersisted-draft-v2',
          createdAt: '2026-10-02T15:42:30.000Z' });
      expect(receiptForUnpersistedDraft.status).toBe('ready');
      if (receiptForUnpersistedDraft.status !== 'ready') throw new Error(receiptForUnpersistedDraft.reason ?? 'Receipt draft v2 attendu.');
      const noSourceDraftHistory = structuredClone(storedCandidate);
      noSourceDraftHistory.futureRecipeMaterializations!.push({ recipe: receiptForUnpersistedDraft.recipe,
        receipt: receiptForUnpersistedDraft.receipt });
      await expect(repository.save(noSourceDraftHistory, storedCandidate.revision)).rejects.toMatchObject({ code: 'invalidInput' });

      const mismatchedPair = structuredClone(storedCandidate);
      mismatchedPair.futureRecipeMaterializations![0].recipe.name = 'Recipe non lié au reçu';
      await expect(repository.save(mismatchedPair, storedCandidate.revision)).rejects.toMatchObject({ code: 'invalidInput' });
      const duplicatePair = structuredClone(storedCandidate);
      duplicatePair.futureRecipeMaterializations!.push(structuredClone(duplicatePair.futureRecipeMaterializations![0]));
      await expect(repository.save(duplicatePair, storedCandidate.revision)).rejects.toMatchObject({ code: 'invalidInput' });

      const alternative = materializeHopV55FutureRecipe(fixture.draft, { ...selections, name: 'Autre matérialisation' },
        fixture.currentRefs, { createRecipeId: () => 'recipe-future-alternative', createReceiptId: () => 'receipt-future-alternative',
          createdAt: '2026-10-02T15:43:00.000Z' });
      expect(alternative.status).toBe('ready');
      if (alternative.status !== 'ready') throw new Error(alternative.reason ?? 'Autre reçu de fixture attendu.');
      const rewrittenPrefix = structuredClone(storedCandidate);
      rewrittenPrefix.futureRecipeMaterializations![0] = { recipe: alternative.recipe, receipt: alternative.receipt };
      await expect(repository.save(rewrittenPrefix, storedCandidate.revision)).rejects.toMatchObject({ code: 'invalidInput' });

      const confirmed = structuredClone(storedCandidate);
      confirmed.futureRecipeSaveReceipts!.push({ recipeId: materialized.recipe.id,
        receiptReference: materialized.receipt.contentReference, confirmedAt: '2026-10-02T15:44:00.000Z' });
      const afterHostConfirmation = await repository.save(confirmed, storedCandidate.revision);
      expect(afterHostConfirmation.futureRecipeSaveReceipts).toEqual([{ recipeId: materialized.recipe.id,
        receiptReference: materialized.receipt.contentReference, confirmedAt: '2026-10-02T15:44:00.000Z' }]);
      expect(afterHostConfirmation.activeFutureDraftSource).toEqual(created.activeFutureDraftSource);
      expect(afterHostConfirmation.sourceRecipeId).toBeUndefined();
      const wrongConfirmation = structuredClone(afterHostConfirmation);
      wrongConfirmation.futureRecipeSaveReceipts![0].receiptReference = 'other-receipt';
      await expect(repository.save(wrongConfirmation, afterHostConfirmation.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    } finally { repository.close(); }
  });

  it('seed unknownMassFuture crée une seule référence NR hypothétique durable, sans J5 ni source Recipe', async () => {
    const namespace = 'm01-unknown-mass-future-seed';
    const workspaceDatabase = new MemoryDatabase();
    const scenarioDatabase = new ScenarioMemoryDatabase();
    const loadReferences = async () => ({ varieties: [], knowledge: [] });
    const ordinary = createHopV55FixtureServices(`${namespace}-ordinary`, { mode: 'unknown',
      catalogueDatabase: emptyFixtureCatalogueDatabase(), workspaceDatabase: new MemoryDatabase(), scenarioDatabase: new ScenarioMemoryDatabase(), loadReferences });
    const ordinaryPlanning = createHopV55FixtureServices(`${namespace}-planning`, { mode: 'planning',
      catalogueDatabase: emptyFixtureCatalogueDatabase(), workspaceDatabase: new MemoryDatabase(), scenarioDatabase: new ScenarioMemoryDatabase(), loadReferences });
    const seeded = createHopV55FixtureServices(namespace, { mode: 'unknown', seed: 'unknownMassFuture',
      catalogueDatabase: emptyFixtureCatalogueDatabase(), workspaceDatabase, scenarioDatabase, loadReferences });
    try {
      await expect(ordinary.workspaces.list(ordinary.ownerKey)).resolves.toEqual([]);
      await expect(ordinaryPlanning.workspaces.list(ordinaryPlanning.ownerKey)).resolves.toEqual([]);
      await expect(ordinary.scenarios.list(ordinary.ownerKey)).resolves.toEqual([]);
      await expect(ordinaryPlanning.scenarios.list(ordinaryPlanning.ownerKey)).resolves.toEqual([]);
      expect(() => createHopV55FixtureServices(`${namespace}-wrong-mode`, { mode: 'planning', seed: 'unknownMassFuture' }))
        .toThrow(/mode sans recette/i);
      const seededRows = await seeded.workspaces.list(seeded.ownerKey);
      expect(seededRows).toHaveLength(1);
      const workspace = seededRows[0];
      expect(workspace).toMatchObject({ id: HOP_V55_UNKNOWN_MASS_FUTURE_SEED_WORKSPACE_ID, ownerKey: seeded.ownerKey,
        scenarioIds: [], referenceHypotheses: [], copies: [] });
      expect(workspace.sourceRecipeId).toBeUndefined();
      expect(workspace.sourceBatchId).toBeUndefined();
      expect(workspace.scenarioPreparations).toBeUndefined();
      expect(workspace.snapshotIntents).toBeUndefined();
      expect(workspace.activeScenarioId).toBeUndefined();
      await expect(seeded.scenarios.list(seeded.ownerKey)).resolves.toEqual([]);
      expect(workspace.referenceJournal?.events.map(event => event.kind)).toEqual(['contextOpened', 'referenceProposed', 'referenceAdopted']);

      const hypotheses = getHopV55ReferenceHypotheses(workspace);
      expect(hypotheses).toHaveLength(1);
      expect(hypotheses[0]).toMatchObject({ id: HOP_V55_UNKNOWN_MASS_FUTURE_SEED_REFERENCE_ID, version: 1 });
      expect(workspace.referenceHypotheses).toEqual([]);
      expect(getHopV55ReferenceProjection(workspace)?.currentReference).toMatchObject({
        id: HOP_V55_UNKNOWN_MASS_FUTURE_SEED_REFERENCE_ID, version: '1',
      });
      const baseline = getHopV55AdoptedBaseline(workspace);
      expect(baseline?.kind).toBe('hypothetical');
      if (baseline?.kind !== 'hypothetical') throw new Error('Le seed doit adopter une référence hypothétique explicite.');
      expect(baseline.program?.id).toBe('program:m01-unknown-mass-future');
      expect(baseline.program?.volumeL).toBe(8);
      expect(baseline.input.volumeL).toBe(8);
      expect(baseline.program?.additions.map(row => [row.id, row.grams, row.use, row.temperatureC, row.contactHours]))
        .toEqual([[HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS[0], null, 'fermentation', 14, 36],
          [HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS[1], 3.75, 'fermentation', 14, 36]]);
      expect(baseline.input.additions.map(row => [row.id, row.triplet.doseGL, row.triplet.temperatureC, row.triplet.contactHours]))
        .toEqual([[HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS[0], null, 14, 36],
          [HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS[1], 3.75 / 8, 14, 36]]);
      expect(baseline.materials.hops.map(row => row.variety?.id)).toEqual([
        'hop-v55-fixture-identity-a', 'hop-v55-fixture-identity-b',
      ]);
      expect(baseline.materials.hops.every(row => row.variety?.analysis.length === 0)).toBe(true);
      expect(baseline.program?.additions.every(row => !Object.prototype.hasOwnProperty.call(row, 'alphaForModel'))).toBe(true);
      const context = await seeded.loadContext();
      expect(context.recipe).toBeUndefined();
      expect(context.batch).toBeUndefined();
      expect(context.journal).toBeUndefined();

      const edited = structuredClone(workspace);
      edited.title = 'M01 · seed relu avec données utilisateur conservées';
      edited.updatedAt = '2026-10-02T16:10:00.000Z';
      await seeded.workspaces.save(edited, workspace.revision);
      const reloaded = createHopV55FixtureServices(namespace, { mode: 'unknown', seed: 'unknownMassFuture',
        catalogueDatabase: emptyFixtureCatalogueDatabase(), workspaceDatabase, scenarioDatabase, loadReferences });
      try {
        const rows = await reloaded.workspaces.list(reloaded.ownerKey);
        expect(rows).toHaveLength(1);
        expect(rows[0].revision).toBe(workspace.revision + 1);
        expect(rows[0].title).toBe('M01 · seed relu avec données utilisateur conservées');
        expect(rows[0].referenceJournal?.events.map(event => event.kind)).toEqual(['contextOpened', 'referenceProposed', 'referenceAdopted']);
        expect(rows[0].scenarioIds).toEqual([]);
        await expect(reloaded.scenarios.list(reloaded.ownerKey)).resolves.toEqual([]);
      } finally { reloaded.close(); }
    } finally { ordinary.close(); ordinaryPlanning.close(); seeded.close(); }
  });
});
