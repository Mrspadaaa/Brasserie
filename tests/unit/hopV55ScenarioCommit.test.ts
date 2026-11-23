import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyBrewingReferenceCommand,
  brewingReferenceVersionContentReference,
  getBrewingReferenceProjection,
  openBrewingReferenceContext,
  type BrewingReferenceEvent,
  type BrewingReferenceIdentityV1,
  type BrewingReferenceRecordV1,
  type BrewingReferenceVersionV1,
  type JsonValue,
} from '../../src/domain/brewingReference';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { simulateBrewingScenario } from '../../src/domain/brewingScenario';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';
import { hopV55ReferenceContextId, readHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';
import { resolveHopV55AdoptedContext, type HopV55AdoptedContextBindingV1 } from '../../src/services/hopV55/adoptedContextResolution';
import type { HopV55Workspace, HopV55WorkspaceRepository } from '../../src/services/hopV55/contracts';
import {
  HOP_V55_SCENARIO_PREPARATION_HASH_KIND,
  commitHopV55Scenario,
  hopV55ScenarioRuntimeReference,
  prepareHopV55ScenarioCommit,
  readHopV55ScenarioPreparation,
  resumeHopV55ScenarioCommit,
  type HopV55ScenarioCommitServices,
} from '../../src/services/hopV55/scenarioCommit';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55Workspace } from '../fixtures/hopV55';

const ownerKey = 'commit-test-owner';
const workspaceId = 'commit-test-workspace';
const at = '2026-10-02T10:00:00.000Z';

class MemoryTable<Row extends Record<string, any>> implements HopV55WorkspaceTable<Row>, BrewingScenarioLocalTable<Row> {
  rows = new Map<string, Row>();
  constructor(private readonly primaryFields: string[]) {}
  private key(value: unknown): string {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as Row;
    return JSON.stringify(this.primaryFields.map(field => row[field]));
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row ? structuredClone(row) : undefined; }
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

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable<HopV55WorkspaceEnvelopeV1>(['ownerKey', 'workspaceId']);
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
  close() { /* Mémoire de test uniquement. */ }
}

class MemoryScenarioDatabase {
  dossiers = new MemoryTable<Record<string, any>>(['ownerKey', 'scenarioId']);
  events = new MemoryTable<Record<string, any>>(['ownerKey', 'eventId']);
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

function emptyScenarioWorkspace(): HopV55Workspace {
  const workspace = hopV55Workspace(ownerKey, workspaceId);
  workspace.scenarioIds = ['scenario-v1'];
  workspace.activeScenarioId = 'scenario-v1';
  workspace.selected = { scenarioId: 'scenario-v1', snapshotReference: 'snapshot-reference-v1', branchId: 'baseline', branchReference: 'branch-v1' };
  workspace.sourceBatchId = 'batch-source-v1';
  workspace.updatedAt = at;
  return workspace;
}

function fixtureRuntime() {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const addition = prepared.runtime.current!.program!.additions[0];
  const branch = { id: 'option-a', label: 'Option A conservée', assumptions: [], programChanges: [
    { kind: 'replace' as const, additionId: addition.id, additions: [{ ...addition, grams: 17.25 }] },
  ] };
  const intent = { question: 'Régler ce programme sans changer les candidats conservés.', criteria: [
    { id: 'criterion-1', label: 'Garder les mêmes opérations', direction: 'keep' as const },
  ] };
  const request = (scenarioId: string, revision: number) => createHopV55ScenarioRequest({ prepared, scenarioId, revision,
    branches: [structuredClone(branch)], intent });
  return { context, prepared, intent, source: { kind: 'batch' as const, batchId: 'batch-source-v1' }, request, branch };
}

function referenceBody(version: string, predecessor: BrewingReferenceIdentityV1 | null, baseline: unknown): BrewingReferenceVersionV1 {
  const body = {
    id: 'adopted-reference-fixture', version,
    origin: { kind: 'userDeclaration', description: `Référence de test ${version}.` },
    hypotheses: [`Déclaration explicite ${version}.`], context: {}, author: { id: ownerKey, label: 'Fixture transaction' },
    createdAt: at, predecessor, sensoryDefinitions: [],
    content: JSON.parse(JSON.stringify({ label: `Référence ${version}`, baseline })) as Record<string, JsonValue>,
  };
  return { ...body, contentReference: brewingReferenceVersionContentReference(body) };
}

function appendReferenceVersion(input: {
  journal: NonNullable<HopV55Workspace['referenceJournal']>;
  version: BrewingReferenceVersionV1;
  previous: BrewingReferenceIdentityV1 | null;
  recordedAt?: string;
}): NonNullable<HopV55Workspace['referenceJournal']> {
  let record: BrewingReferenceRecordV1 = structuredClone(input.journal.record);
  const events: BrewingReferenceEvent[] = structuredClone(input.journal.events);
  const identity = { id: input.version.id, version: input.version.version, contentReference: input.version.contentReference };
  const append = (kind: 'referenceProposed' | 'referenceAdopted', payload: any, commandId: string) => {
    const applied = applyBrewingReferenceCommand(record, { ownerKey: record.ownerKey, contextId: record.contextId, commandId,
      expectedRevision: record.revision, recordedAt: input.recordedAt ?? at, kind, payload } as any, events);
    record = applied.record;
    if (!applied.duplicate) events.push(applied.event);
  };
  append('referenceProposed', { reference: input.version }, `proposal-${input.version.version}`);
  append('referenceAdopted', { reference: identity, adoptedBy: { id: ownerKey, label: 'Fixture transaction' } }, `adoption-${input.version.version}`);
  return { record, events };
}

function journalWithReference(workspace: HopV55Workspace, reference: BrewingReferenceVersionV1) {
  const opened = openBrewingReferenceContext({ ownerKey: workspace.ownerKey, contextId: hopV55ReferenceContextId(workspace.id), commandId: `context-${workspace.id}`,
    recordedAt: at, context: { programReference: null, past: { status: 'unknown' }, details: { fixture: 'scenario-commit' } } });
  return appendReferenceVersion({ journal: { record: opened.record, events: [opened.event] }, version: reference, previous: null });
}

function adoptedBinding(workspace: HopV55Workspace, reference: BrewingReferenceIdentityV1): HopV55AdoptedContextBindingV1 {
  const resolved = resolveHopV55AdoptedContext({ workspace: { id: workspace.id, ownerKey: workspace.ownerKey,
    referenceJournal: workspace.referenceJournal }, expected: reference });
  if (resolved.status !== 'resolved') throw new Error(`Binding fixture non résolu : ${resolved.status}.`);
  return resolved.binding;
}

function staleRevision() {
  return Object.assign(new Error('staleRevision test fixture'), { code: 'staleRevision' });
}

function repositories(initialWorkspace: HopV55Workspace, hooks: {
  shouldFailFinalization?: (candidate: HopV55Workspace) => boolean;
  onFirstFinalizationConflict?: (latest: HopV55Workspace) => Promise<HopV55Workspace>;
} = {}) {
  const scenarioDb = new MemoryScenarioDatabase();
  const scenarios = createBrewingScenarioLocalRepository({ database: scenarioDb as unknown as BrewingScenarioLocalDatabaseAdapter });
  const workspaceDb = new MemoryWorkspaceDatabase();
  const baseWorkspaces = createHopV55WorkspaceRepository({ ownerKey, database: workspaceDb });
  let injected = false;
  const workspaces: HopV55WorkspaceRepository = {
    list: owner => baseWorkspaces.list(owner),
    read: (owner, id) => baseWorkspaces.read(owner, id),
    close: () => baseWorkspaces.close(),
    save: async (candidate, expectedRevision) => {
      if (hooks.shouldFailFinalization?.(candidate)) {
        if (!injected && hooks.onFirstFinalizationConflict) {
          injected = true;
          const latest = await baseWorkspaces.read(ownerKey, workspaceId);
          if (latest) await baseWorkspaces.save(await hooks.onFirstFinalizationConflict(latest), latest.revision);
        }
        throw staleRevision();
      }
      return baseWorkspaces.save(candidate, expectedRevision);
    },
  };
  return { services: { ownerKey, scenarios, workspaces } satisfies HopV55ScenarioCommitServices, baseWorkspaces, scenarios };
}

afterEach(() => vi.restoreAllMocks());

describe('Commit idempotent des scénarios V5.5', () => {
  it('reprend le reçu exact après trois CAS, garde R1 malgré R2 et ne recalcule pas un snapshot plus récent', async () => {
    const fx = fixtureRuntime();
    const workspace = emptyScenarioWorkspace();
    const request = fx.request('scenario-commit-r1', 1);
    const reference1 = referenceBody('1', null, request.baseline);
    workspace.referenceJournal = journalWithReference(workspace, reference1);
    const ref1 = { id: reference1.id, version: reference1.version, contentReference: reference1.contentReference };
    const binding1 = adoptedBinding(workspace, ref1);
    const reference2 = referenceBody('2', ref1, request.baseline);
    let finalAttempts = 0;
    let failFinalization = true;
    const { services, scenarios, baseWorkspaces } = repositories(workspace, {
      shouldFailFinalization: candidate => {
        const isFinal = failFinalization && !!candidate.snapshotIntents?.some(row => row.scenarioId === request.scenarioId);
        if (isFinal) finalAttempts++;
        return isFinal;
      },
      onFirstFinalizationConflict: async latest => {
        const concurrent = structuredClone(latest);
        concurrent.title = 'Titre modifié pendant le commit';
        concurrent.selected = { scenarioId: 'scenario-v1', snapshotReference: 'snapshot-reference-v1', branchId: 'choix-concurrent', branchReference: 'pref-concurrente' };
        concurrent.referenceJournal = appendReferenceVersion({ journal: concurrent.referenceJournal!, version: reference2, previous: ref1,
          recordedAt: '2026-10-02T10:00:35.000Z' });
        concurrent.updatedAt = '2026-10-02T10:00:35.000Z';
        return concurrent;
      },
    });
    const savedWorkspace = await baseWorkspaces.save(workspace, null);
    const compute = vi.fn(async (preparedRequest: typeof request) => {
      expect(preparedRequest).toEqual(request);
      const beforeJ5 = await baseWorkspaces.read(ownerKey, workspaceId);
      expect(beforeJ5?.scenarioPreparations?.map(preparation => preparation.eventId)).toContain('save-r1-exact');
      expect(beforeJ5?.scenarioIds).not.toContain(request.scenarioId);
      return simulateBrewingScenario(preparedRequest, fx.prepared.runtime);
    });
    let clockIndex = 0;
    const clock = ['2026-10-02T10:00:05.000Z', '2026-10-02T10:00:30.000Z', '2026-10-02T10:00:40.000Z'];
    await expect(commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: savedWorkspace,
      id: 'prep-r1', eventId: 'save-r1-exact', scenarioId: request.scenarioId, operation: 'create', request,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: ref1,
      cultureBinding: binding1, source: fx.source, now: () => clock[Math.min(clockIndex++, clock.length - 1)], compute }))
      .rejects.toMatchObject({ code: 'workspaceConflict' });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(finalAttempts).toBe(3);

    const afterFailure = await baseWorkspaces.read(ownerKey, workspaceId);
    expect(afterFailure?.scenarioPreparations).toHaveLength(1);
    expect(afterFailure?.scenarioPreparations?.[0].cultureBinding).toEqual(binding1);
    const tamperedBinding = structuredClone(afterFailure!.scenarioPreparations![0]);
    tamperedBinding.cultureBinding!.bindingReference = 'tampered-binding-reference';
    expect(readHopV55ScenarioPreparation(tamperedBinding).status).toBe('invalid');
    const binding2 = adoptedBinding(afterFailure!, { id: reference2.id, version: reference2.version,
      contentReference: reference2.contentReference });
    const wrongReference = structuredClone(afterFailure!.scenarioPreparations![0]);
    wrongReference.cultureBinding = binding2;
    expect(readHopV55ScenarioPreparation(wrongReference).status).toBe('invalid');
    const foreignWorkspace = emptyScenarioWorkspace();
    foreignWorkspace.ownerKey = 'foreign-culture-owner'; foreignWorkspace.id = 'foreign-culture-workspace';
    foreignWorkspace.referenceJournal = journalWithReference(foreignWorkspace, reference1);
    const foreignBinding = adoptedBinding(foreignWorkspace, ref1);
    const wrongOwner = structuredClone(afterFailure!.scenarioPreparations![0]);
    wrongOwner.cultureBinding = foreignBinding;
    expect(readHopV55ScenarioPreparation(wrongOwner).status).toBe('invalid');
    expect(afterFailure?.scenarioIds).not.toContain(request.scenarioId);
    expect(afterFailure?.referenceJournal?.record.currentReference).toEqual({ id: reference2.id, version: reference2.version, contentReference: reference2.contentReference });
    expect(afterFailure?.title).toBe('Titre modifié pendant le commit');
    const firstEvent = (await scenarios.read(ownerKey, request.scenarioId))?.status === 'available'
      ? (await scenarios.read(ownerKey, request.scenarioId) as Extract<Awaited<ReturnType<typeof scenarios.read>>, { status: 'available' }>).record.events.find(event => event.eventId === 'save-r1-exact')
      : undefined;
    if (firstEvent?.kind !== 'resultSaved') throw new Error('Le reçu resultSaved exact doit être retrouvé dans l’historique.');

    // A later explicit result may become the J5 head while the workspace receipt is pending.
    const laterRequest = fx.request(request.scenarioId, 2);
    const laterResult = simulateBrewingScenario(laterRequest, fx.prepared.runtime);
    await scenarios.reviseResult({ ownerKey, scenarioId: request.scenarioId, eventId: 'later-j5-r2', expectedRevision: 1,
      recordedAt: '2026-10-02T10:01:00.000Z', previousSnapshotReference: firstEvent.payload.snapshot.reference,
      reason: 'Révision ultérieure explicite du test.', result: laterResult });

    failFinalization = false;
    const recovered = await resumeHopV55ScenarioCommit({ services, ownerKey, workspaceId, preparationId: 'prep-r1', now: () => '2026-10-02T10:01:10.000Z' });
    expect(recovered.computed).toBe(false);
    expect(compute).toHaveBeenCalledTimes(1);
    expect(recovered.event.eventId).toBe('save-r1-exact');
    expect(recovered.snapshot.result.revision).toBe(1);
    expect(recovered.record.currentSnapshot.result.revision).toBe(2);
    expect(recovered.record.currentSnapshot.reference).not.toBe(recovered.snapshot.reference);
    expect(recovered.workspace.scenarioIds).toContain(request.scenarioId);
    expect(recovered.workspace.title).toBe('Titre modifié pendant le commit');
    expect(recovered.workspace.selected).toEqual({ scenarioId: 'scenario-v1', snapshotReference: 'snapshot-reference-v1', branchId: 'choix-concurrent', branchReference: 'pref-concurrente' });
    expect(recovered.workspace.copies).toEqual(workspace.copies);
    const projection = getHopV55ReferenceProjectionForTest(recovered.workspace);
    expect(projection.currentReference).toEqual({ id: reference2.id, version: reference2.version, contentReference: reference2.contentReference });
    expect(projection.j5ResultLinks).toContainEqual(expect.objectContaining({
      reference: ref1,
      result: expect.objectContaining({ snapshotReference: recovered.snapshot.reference, resultRevision: 1 }),
      receipt: expect.objectContaining({ receiptId: 'save-r1-exact' }),
    }));
    expect(projection.j5ResultLinks.some(link => link.id === 'result-link:save-r1-exact' && link.reference.version === '2')).toBe(false);
    expect(recovered.workspace.snapshotIntents?.find(row => row.snapshotReference === recovered.snapshot.reference)?.intent).toEqual(fx.intent);
  });

  it('refuse une reprise sans résultat si source/requête/runtime ont changé, puis accepte le contexte exact explicite', async () => {
    const fx = fixtureRuntime();
    const workspace = emptyScenarioWorkspace();
    const request = fx.request('scenario-resume-fresh', 1);
    const { services, baseWorkspaces, scenarios } = repositories(workspace);
    const savedWorkspace = await baseWorkspaces.save(workspace, null);
    const prepared = await prepareHopV55ScenarioCommit({ services, ownerKey, workspaceId, workspace: savedWorkspace,
      id: 'prep-fresh', eventId: 'save-fresh', scenarioId: request.scenarioId, operation: 'create', request,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: null, source: fx.source, createdAt: at });
    expect(readHopV55ScenarioPreparation(prepared.preparation).status).toBe('available');
    expect(await scenarios.read(ownerKey, request.scenarioId)).toBeNull();
    const compute = vi.fn((fresh: typeof request) => simulateBrewingScenario(fresh, fx.prepared.runtime));
    await expect(resumeHopV55ScenarioCommit({ services, ownerKey, workspaceId, preparationId: 'prep-fresh', compute,
      freshRequest: request, freshSource: { kind: 'recipe', recipeId: 'recipe-other' },
      freshRuntimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), freshCultureBinding: null })).rejects.toMatchObject({ code: 'sourceMismatch' });
    expect(compute).not.toHaveBeenCalled();
    await expect(resumeHopV55ScenarioCommit({ services, ownerKey, workspaceId, preparationId: 'prep-fresh', compute,
      freshRequest: request, freshSource: fx.source, freshRuntimeReference: 'runtime-changed', freshCultureBinding: null })).rejects.toMatchObject({ code: 'sourceMismatch' });
    expect(compute).not.toHaveBeenCalled();

    const resumed = await resumeHopV55ScenarioCommit({ services, ownerKey, workspaceId, preparationId: 'prep-fresh', compute,
      freshRequest: request, freshSource: fx.source, freshRuntimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime),
      freshCultureBinding: null, now: () => '2026-10-02T10:01:00.000Z' });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(resumed.computed).toBe(true);
    expect(resumed.event.eventId).toBe('save-fresh');
    expect(resumed.snapshot.result.requestSnapshot).toEqual(request);
    const altered = { ...prepared.preparation, runtimeReference: 'changed-runtime' };
    expect(readHopV55ScenarioPreparation(altered).status).toBe('invalid');
    expect(prepared.preparation).not.toHaveProperty('cultureBinding');
    const { contentReference, ...legacyBody } = prepared.preparation;
    expect(contentReference).toBe(hopAdviceContentReference(HOP_V55_SCENARIO_PREPARATION_HASH_KIND, legacyBody));
    expect(readHopV55ScenarioPreparation({ ...prepared.preparation, version: 'hop-v55-scenario-preparation-v2' }).status).toBe('unsupportedFormat');
  });

  it('refuse de calculer une préparation A sans reçu quand l’adoption B est devenue courante', async () => {
    const fx = fixtureRuntime();
    const workspace = emptyScenarioWorkspace();
    const request = fx.request('scenario-culture-a-to-b', 1);
    const reference1 = referenceBody('1', null, request.baseline);
    workspace.referenceJournal = journalWithReference(workspace, reference1);
    const ref1 = { id: reference1.id, version: reference1.version, contentReference: reference1.contentReference };
    const binding1 = adoptedBinding(workspace, ref1);
    const { services, baseWorkspaces, scenarios } = repositories(workspace);
    const savedWorkspace = await baseWorkspaces.save(workspace, null);
    const staged = await prepareHopV55ScenarioCommit({ services, ownerKey, workspaceId, workspace: savedWorkspace,
      id: 'prep-culture-a-to-b', eventId: 'event-culture-a-to-b', scenarioId: request.scenarioId, operation: 'create', request,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: ref1,
      cultureBinding: binding1, source: fx.source, createdAt: at });
    expect(staged.preparation.cultureBinding).toEqual(binding1);

    const reference2 = referenceBody('2', ref1, request.baseline);
    const latest = await baseWorkspaces.read(ownerKey, workspaceId);
    if (!latest) throw new Error('Workspace avec préparation NR A attendu.');
    const workspaceB = await baseWorkspaces.save({ ...latest,
      referenceJournal: appendReferenceVersion({ journal: latest.referenceJournal!, version: reference2, previous: ref1,
        recordedAt: '2026-10-02T10:00:30.000Z' }) }, latest.revision);
    const ref2 = { id: reference2.id, version: reference2.version, contentReference: reference2.contentReference };
    const binding2 = adoptedBinding(workspaceB, ref2);
    const compute = vi.fn((preparedRequest: typeof request) => simulateBrewingScenario(preparedRequest, fx.prepared.runtime));

    const newRequestUnderA = fx.request('scenario-new-command-a-under-b', 1);
    const newComputeUnderA = vi.fn((preparedRequest: typeof newRequestUnderA) => simulateBrewingScenario(preparedRequest, fx.prepared.runtime));
    await expect(commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: workspaceB,
      id: 'prep-new-a-under-b', eventId: 'event-new-a-under-b', scenarioId: newRequestUnderA.scenarioId,
      operation: 'create', request: newRequestUnderA, runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime),
      intent: fx.intent, reference: ref1, cultureBinding: binding1, source: fx.source, compute: newComputeUnderA }))
      .rejects.toMatchObject({ code: 'referenceMismatch' });
    expect(newComputeUnderA).not.toHaveBeenCalled();

    await expect(resumeHopV55ScenarioCommit({ services, ownerKey, workspaceId, preparationId: staged.preparation.id, compute,
      freshRequest: request, freshSource: fx.source, freshRuntimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime),
      freshCultureBinding: binding2 })).rejects.toMatchObject({ code: 'referenceMismatch' });
    expect(compute).not.toHaveBeenCalled();
    expect(await scenarios.read(ownerKey, request.scenarioId)).toBeNull();
    expect((await baseWorkspaces.read(ownerKey, workspaceId))?.scenarioIds).not.toContain(request.scenarioId);
  });

  it('reprend un événement V1 sans binding sous une adoption ultérieure sans recalcul', async () => {
    const fx = fixtureRuntime();
    const workspace = emptyScenarioWorkspace();
    const request = fx.request('scenario-legacy-prep-under-adoption', 1);
    const { services, baseWorkspaces, scenarios } = repositories(workspace);
    const savedWorkspace = await baseWorkspaces.save(workspace, null);
    const compute = vi.fn((preparedRequest: typeof request) => simulateBrewingScenario(preparedRequest, fx.prepared.runtime));
    const committed = await commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: savedWorkspace,
      id: 'prep-legacy-no-binding', eventId: 'event-legacy-no-binding', scenarioId: request.scenarioId, operation: 'create', request,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: null,
      source: fx.source, createdAt: at, compute });
    expect(committed.preparation).not.toHaveProperty('cultureBinding');
    expect(compute).toHaveBeenCalledTimes(1);

    const reference = referenceBody('1', null, request.baseline);
    const current = await baseWorkspaces.read(ownerKey, workspaceId);
    if (!current) throw new Error('Workspace avec événement J5 durable attendu.');
    const adopted = await baseWorkspaces.save({ ...current, referenceJournal: journalWithReference(current, reference) }, current.revision);
    const currentIdentity = { id: reference.id, version: reference.version, contentReference: reference.contentReference };
    expect(adopted.referenceJournal?.record.currentReference).toEqual(currentIdentity);

    const recovered = await resumeHopV55ScenarioCommit({ services, ownerKey, workspaceId,
      preparationId: committed.preparation.id });
    expect(recovered.computed).toBe(false);
    expect(recovered.event.eventId).toBe(committed.event.eventId);
    expect(recovered.snapshot.reference).toBe(committed.snapshot.reference);
    expect(recovered.workspace.referenceJournal?.record.currentReference).toEqual(currentIdentity);
    expect(compute).toHaveBeenCalledTimes(1);
    expect((await scenarios.read(ownerKey, request.scenarioId))?.status).toBe('available');
  });

  it('refuse une commande sans référence si une adoption NR est déjà courante', async () => {
    const fx = fixtureRuntime();
    const workspace = emptyScenarioWorkspace();
    const request = fx.request('scenario-null-with-adoption', 1);
    const reference = referenceBody('1', null, request.baseline);
    workspace.referenceJournal = journalWithReference(workspace, reference);
    const { services, baseWorkspaces } = repositories(workspace);
    const savedWorkspace = await baseWorkspaces.save(workspace, null);
    const compute = vi.fn((preparedRequest: typeof request) => simulateBrewingScenario(preparedRequest, fx.prepared.runtime));

    await expect(commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: savedWorkspace,
      id: 'prep-null-with-adoption', eventId: 'event-null-with-adoption', scenarioId: request.scenarioId, operation: 'create', request,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: null,
      source: fx.source, createdAt: at, compute })).rejects.toMatchObject({ code: 'referenceMismatch' });
    expect(compute).not.toHaveBeenCalled();
    expect((await baseWorkspaces.read(ownerKey, workspaceId))?.scenarioPreparations).toBeUndefined();
  });

  it('réévalue le prior exact, conserve la branche et ne remplace ni sélection ni copie appliquée', async () => {
    const fx = fixtureRuntime();
    const workspace = emptyScenarioWorkspace();
    const previousRequest = fx.request('scenario-v1', 1);
    const previous = simulateBrewingScenario(previousRequest, fx.prepared.runtime);
    const { services, baseWorkspaces, scenarios } = repositories(workspace);
    const savedWorkspace = await baseWorkspaces.save(workspace, null);
    await scenarios.saveResult({ ownerKey, scenarioId: previous.scenarioId, eventId: 'save-previous', recordedAt: at, result: previous });
    const nextRequest = fx.request('scenario-v1', 2);
    const compute = vi.fn((request: typeof nextRequest) => simulateBrewingScenario(request, fx.prepared.runtime));
    const reevaluated = await commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: savedWorkspace,
      id: 'prep-reevaluate', eventId: 'revise-v2-exact', scenarioId: nextRequest.scenarioId, operation: 'reevaluate', request: nextRequest,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: null, source: fx.source,
      prior: { scenarioId: previous.scenarioId, snapshotReference: previous.reference, resultRevision: previous.revision, dossierRevision: 1 },
      now: () => '2026-10-02T10:02:00.000Z', compute });

    expect(compute).toHaveBeenCalledTimes(1);
    if (reevaluated.event.kind !== 'resultRevised') throw new Error('La réévaluation doit conserver son événement resultRevised.');
    expect(reevaluated.event.payload.previousSnapshotReference).toBe(previous.reference);
    expect(reevaluated.snapshot.result.requestSnapshot).toEqual(nextRequest);
    expect(reevaluated.snapshot.result.branches.map(branch => branch.id)).toEqual(previous.branches.map(branch => branch.id));
    expect(reevaluated.snapshot.result.branches[0].program?.additions[0].grams).toBe(previous.branches[0].program?.additions[0].grams);
    expect(reevaluated.workspace.scenarioIds.filter(id => id === 'scenario-v1')).toHaveLength(1);
    expect(reevaluated.workspace.selected).toEqual(workspace.selected);
    expect(reevaluated.workspace.copies).toEqual(workspace.copies);
    expect(reevaluated.workspace.snapshotIntents?.at(-1)).toEqual({ scenarioId: 'scenario-v1', snapshotReference: reevaluated.snapshot.reference, intent: fx.intent });
  });

  it('garde unique une réservation de création et son eventId, tout en rendant la même préparation idempotente', async () => {
    const fx = fixtureRuntime();
    const workspace = emptyScenarioWorkspace();
    const firstRequest = fx.request('scenario-create-reservation', 1);
    const { services, baseWorkspaces } = repositories(workspace);
    const savedWorkspace = await baseWorkspaces.save(workspace, null);
    const firstInput = { services, ownerKey, workspaceId, workspace: savedWorkspace, id: 'prep-create-reservation',
      eventId: 'event-create-reservation', scenarioId: firstRequest.scenarioId, operation: 'create' as const,
      request: firstRequest, runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent,
      reference: null, source: fx.source, createdAt: at };
    const first = await prepareHopV55ScenarioCommit(firstInput);
    const retry = await prepareHopV55ScenarioCommit({ ...firstInput, createdAt: '2026-10-02T10:04:00.000Z' });
    expect(retry.preparation).toEqual(first.preparation);
    expect(retry.workspace.scenarioPreparations).toHaveLength(1);

    await expect(prepareHopV55ScenarioCommit({ ...firstInput, id: 'prep-create-duplicate', eventId: 'event-create-duplicate' }))
      .rejects.toMatchObject({ code: 'preparationConflict' });
    const secondScenarioRequest = fx.request('scenario-create-reservation-other', 1);
    await expect(prepareHopV55ScenarioCommit({ ...firstInput, id: 'prep-other-scenario-same-event', scenarioId: secondScenarioRequest.scenarioId,
      request: secondScenarioRequest })) .rejects.toMatchObject({ code: 'preparationConflict' });
  });

  it('autorise la réévaluation du même scénario après sa préparation de création et préserve sa préférence', async () => {
    const fx = fixtureRuntime();
    const workspace = emptyScenarioWorkspace();
    const scenarioId = 'scenario-create-then-revise';
    const request1 = fx.request(scenarioId, 1);
    const { services, baseWorkspaces, scenarios } = repositories(workspace);
    const savedWorkspace = await baseWorkspaces.save(workspace, null);
    const created = await commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: savedWorkspace,
      id: 'prep-create-then-revise', eventId: 'save-create-then-revise', scenarioId, operation: 'create', request: request1,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: null, source: fx.source,
      now: () => '2026-10-02T10:03:00.000Z', compute: request => simulateBrewingScenario(request, fx.prepared.runtime) });
    const branch = created.snapshot.result.branches[0];
    const preferred = await scenarios.preferBranch({ ownerKey, scenarioId, eventId: 'prefer-before-revision', expectedRevision: 1,
      recordedAt: '2026-10-02T10:03:10.000Z', preferenceId: 'preferred-before-revision', snapshotReference: created.snapshot.reference,
      branchId: branch.id, branchReference: branch.reference, reason: 'Préférence conservée avant la réévaluation.' });
    const preferredBranch = preferred.dossier.preferredBranch;
    const request2 = fx.request(scenarioId, 2);
    const staleCompute = vi.fn((request: typeof request2) => simulateBrewingScenario(request, fx.prepared.runtime));
    await expect(commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: created.workspace,
      id: 'prep-stale-prior', eventId: 'revise-stale-prior', scenarioId, operation: 'reevaluate', request: request2,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: null, source: fx.source,
      prior: { scenarioId, snapshotReference: created.snapshot.reference, resultRevision: 1, dossierRevision: 1 }, compute: staleCompute }))
      .rejects.toMatchObject({ code: 'staleScenario' });
    expect(staleCompute).not.toHaveBeenCalled();

    const compute = vi.fn((request: typeof request2) => simulateBrewingScenario(request, fx.prepared.runtime));

    const reevaluated = await commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: created.workspace,
      id: 'prep-revision-after-create', eventId: 'revise-after-create', scenarioId, operation: 'reevaluate', request: request2,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: null, source: fx.source,
      prior: { scenarioId, snapshotReference: created.snapshot.reference, resultRevision: 1, dossierRevision: preferred.dossier.revision },
      now: () => '2026-10-02T10:03:20.000Z', compute });

    expect(compute).toHaveBeenCalledTimes(1);
    if (reevaluated.event.kind !== 'resultRevised') throw new Error('La seconde écriture doit append une révision J5.');
    expect(reevaluated.event.payload.previousSnapshotReference).toBe(created.snapshot.reference);
    expect(reevaluated.record.snapshots).toHaveLength(2);
    expect(reevaluated.record.snapshots[0]).toEqual(created.snapshot);
    expect(reevaluated.record.dossier.preferredBranch).toEqual(preferredBranch);
    expect(reevaluated.record.events.filter(event => event.kind === 'branchPreferred')).toEqual([preferred.event]);
    expect(reevaluated.workspace.scenarioPreparations?.map(row => row.operation)).toEqual(['create', 'reevaluate']);
    expect(reevaluated.workspace.scenarioPreparations?.map(row => row.eventId)).toEqual(['save-create-then-revise', 'revise-after-create']);

    const otherRequest = structuredClone(request2);
    const changed = otherRequest.branches[0].programChanges![0];
    if (changed.kind !== 'replace') throw new Error('Fixture de branche à remplacer attendue.');
    changed.additions[0].grams += 1;
    const otherCompute = vi.fn((request: typeof request2) => simulateBrewingScenario(request, fx.prepared.runtime));
    await expect(commitHopV55Scenario({ services, ownerKey, workspaceId, workspace: reevaluated.workspace,
      id: 'prep-revision-after-create', eventId: 'revise-after-create', scenarioId, operation: 'reevaluate', request: otherRequest,
      runtimeReference: hopV55ScenarioRuntimeReference(fx.prepared.runtime), intent: fx.intent, reference: null, source: fx.source,
      prior: { scenarioId, snapshotReference: created.snapshot.reference, resultRevision: 1, dossierRevision: preferred.dossier.revision },
      compute: otherCompute })).rejects.toMatchObject({ code: 'preparationConflict' });
    expect(otherCompute).not.toHaveBeenCalled();
  });
});

function getHopV55ReferenceProjectionForTest(workspace: HopV55Workspace) {
  const read = workspace.referenceJournal;
  if (!read) throw new Error('Fixture NR absente.');
  const parsed = readHopV55ReferenceJournal(workspace);
  if (parsed.status !== 'available') throw new Error('Fixture NR non relisible.');
  return getBrewingReferenceProjection(parsed.read);
}
