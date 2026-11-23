import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopDecisionDossierV2, type CreateHopDecisionDossierV2Input,
  type HopDecisionDossierRead, type HopDecisionEventRead } from '../../src/domain/hopDecision/dossier';
import * as qualifiedDecision from '../../src/domain/hopDecision/qualifiedDecision';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import type { HopDecisionContext } from '../../src/domain/hopDecision/dossier';
import type { HopCatalogueLoaderInput } from '../../src/domain/hopDecision/catalogueLoader';
import type { HopDecisionLocalRepository } from '../../src/services/hopDecisionLocalRepository';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import * as decisionReader from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchiveV2, type HopV55DecisionReadingSource } from '../../src/services/hopV55/decisionArchive';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import type { HopV55Services, HopV55Workspace, HopV55WorkspaceRepository } from '../../src/services/hopV55/contracts';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createHopV55QualifiedStudyController, type HopV55QualifiedProductStudySaveRequest,
  type HopV55QualifiedStudyHost } from '../../src/services/hopV55/qualifiedStudyController';
import { readHopV55QualifiedStudyLink, readHopV55QualifiedStudyPreparation,
  type HopV55QualifiedStudyPreparationV1 } from '../../src/services/hopV55/qualifiedStudyWorkspace';

const ownerKey = 'fixture:q03-qualified-study-controller';
const workspaceId = 'workspace:q03-qualified-study-controller';
const productQuestion = 'Quelles sont les sources, les emplois et les limites de dose pour HyperBoost, Cryo Hops et SPECTRUM ?';

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [
      (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
    ]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  readonly workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const snapshot = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows.clear(); for (const [key, row] of snapshot) this.workspaces.rows.set(key, row); throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory-only adapter; no IndexedDB or fixture data is cleared. */ }
}

/** The test adapter stores real domain dossiers/events created by createHopDecisionDossierV2. */
class MemoryQualifiedStudies implements HopDecisionLocalRepository {
  readonly dossiers = new Map<string, HopDecisionDossierRead>();
  readonly events = new Map<string, HopDecisionEventRead[]>();
  readonly createInputs: CreateHopDecisionDossierV2Input[] = [];
  createCalls = 0;
  successfulCreates = 0;
  failNextCreate = false;
  afterCreated?: () => void;
  private key(owner: string, dossierId: string) { return `${owner}\0${dossierId}`; }
  async create(input: Parameters<HopDecisionLocalRepository['create']>[0]) {
    this.createCalls++;
    if (!('formatVersion' in input.study) || input.study.formatVersion !== 2 || input.study.actionKind !== 'understandProducts') {
      throw new Error('La fixture DAO n’accepte que le create command produit V2 réel.');
    }
    const command = structuredClone(input as CreateHopDecisionDossierV2Input);
    this.createInputs.push(command);
    if (this.failNextCreate) { this.failNextCreate = false; throw new Error('Échec transitoire du dépôt local de dossiers.'); }
    const key = this.key(command.ownerKey, command.dossierId);
    const priorDossier = this.dossiers.get(key);
    const priorEvent = this.events.get(key)?.[0];
    if (priorDossier && priorEvent) return { status: 'duplicate' as const, dossier: priorDossier, event: priorEvent };
    const created = createHopDecisionDossierV2(command);
    this.dossiers.set(key, created.dossier);
    this.events.set(key, [created.event]);
    this.successfulCreates++;
    this.afterCreated?.();
    return { status: 'created' as const, dossier: created.dossier, event: created.event };
  }
  async append(): Promise<never> { throw new Error('L’append d’événement est hors de cette préparation produit.'); }
  async read(owner: string, dossierId: string) { return this.dossiers.get(this.key(owner, dossierId)) ?? null; }
  async list(owner: string) { return [...this.dossiers.values()].filter(row => row.ownerKey === owner); }
  async readEvents(owner: string, dossierId: string) { return structuredClone(this.events.get(this.key(owner, dossierId)) ?? []); }
  close() { /* Memory-only adapter. */ }
}

function makeQ03Journey() {
  const context = makeHopV55FixtureContext('planning');
  if (!context.recipe?.id) throw new Error('La fixture planning doit avoir une recette exacte.');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(productQuestion, prepared);
  if (reading.response?.actionKind !== 'understandProducts' || reading.branches.length) {
    throw new Error('Q03 doit parser en lecture produits documentaire sans branche J5.');
  }
  const source: HopV55DecisionReadingSource = { kind: 'recipe', id: context.recipe.id };
  const runtimeReference = hopV55ScenarioRuntimeReference(prepared.runtime);
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading:q03-source', ownerKey, workspaceId,
    recordedAt: '2026-10-03T10:00:00.000Z', reading, source, runtimeReference });
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Q03 · étude produit fixture', intent: structuredClone(reading.intent), sourceRecipeId: context.recipe.id,
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-10-03T10:00:00.000Z' };
  const productIds = reading.response.result.products.map(product => product.id);
  return { context, prepared, reading, source, runtimeReference, archive, workspace, productIds };
}

function laterArchive(journey: ReturnType<typeof makeQ03Journey>, id = 'reading:q03-later'): HopV55DecisionReadingArchiveV2 {
  return createHopV55DecisionReadingArchiveV2({ id, ownerKey, workspaceId, recordedAt: '2026-10-03T10:01:00.000Z',
    reading: journey.reading, source: journey.source, runtimeReference: journey.runtimeReference });
}

async function makeHarness(options: { staleWorkspaceSave?: boolean; secondArchive?: boolean } = {}) {
  const journey = makeQ03Journey();
  const database = new MemoryWorkspaceDatabase();
  const repository = createHopV55WorkspaceRepository({ ownerKey, database });
  const second = options.secondArchive ? laterArchive(journey) : undefined;
  const workspace = { ...journey.workspace, decisionReadings: [journey.archive, ...(second ? [second] : [])] };
  await repository.save(workspace, null);
  let currentContext: BrewerContext = structuredClone(journey.context);
  let currentReading: HopV55DecisionReadingArchiveV2 = journey.archive;
  let historical = false;
  let staleNextSave = !!options.staleWorkspaceSave;
  let changeReadingFromCatalogueInput: HopV55DecisionReadingArchiveV2 | undefined;
  const saveAttempts: Array<{ revision: number; workspace: HopV55Workspace }> = [];
  const saveWorkspace = vi.fn(async (next: HopV55Workspace, expectedRevision: number) => {
    saveAttempts.push({ revision: expectedRevision, workspace: structuredClone(next) });
    if (staleNextSave) {
      staleNextSave = false;
      const current = await repository.read(ownerKey, workspaceId);
      if (!current) throw new Error('Workspace concurrent absent.');
      await repository.save({ ...current, title: 'Écriture concurrente conservée', updatedAt: '2026-10-03T10:00:30.000Z' }, current.revision);
    }
    return repository.save(next, expectedRevision);
  });
  const repositoryFacade: HopV55WorkspaceRepository = {
    list: owner => repository.list(owner),
    read: (owner, id) => repository.read(owner, id),
    save: saveWorkspace,
    close: () => repository.close(),
  };
  const qualifiedStudies = new MemoryQualifiedStudies();
  const selected = vi.fn();
  const received = vi.fn();
  const sourceFor = (currentWorkspace: HopV55Workspace): HopV55DecisionReadingSource => currentWorkspace.sourceBatchId
    ? { kind: 'batch', id: currentWorkspace.sourceBatchId }
    : currentWorkspace.sourceRecipeId ? { kind: 'recipe', id: currentWorkspace.sourceRecipeId } : { kind: 'exploration' };
  const sourceContextFor = (context: BrewerContext): HopDecisionContext | null => context.recipe
    ? { kind: 'recipe', recipeId: context.recipe.id, recipeReference: hopDecisionReference(context.recipe) } : null;
  const catalogueInput = vi.fn((_context: BrewerContext): HopCatalogueLoaderInput => {
    if (changeReadingFromCatalogueInput) currentReading = changeReadingFromCatalogueInput;
    return {};
  });
  const services = { scope: 'fixture' as const, ownerKey, workspaces: repositoryFacade, qualifiedStudies,
  } as unknown as Pick<HopV55Services, 'scope' | 'ownerKey' | 'workspaces' | 'qualifiedStudies'>;
  const host: HopV55QualifiedStudyHost = {
    services,
    enabled: () => true,
    historical: () => historical,
    reading: () => structuredClone(currentReading),
    context: async () => structuredClone(currentContext),
    workspace: async () => {
      const value = await repository.read(ownerKey, workspaceId);
      if (!value) throw new Error('Workspace fixture absent.');
      return value;
    },
    save: next => saveWorkspace(next, next.revision),
    source: sourceFor,
    runtimeReference: value => hopV55ScenarioRuntimeReference(value.runtime),
    sourceContext: context => sourceContextFor(context),
    catalogueInput,
    selected,
    received,
  };
  return {
    ...journey, repository, qualifiedStudies, saveAttempts,
    selected, received, catalogueInput, host,
    setContext(value: BrewerContext) { currentContext = structuredClone(value); },
    changeReadingWhenCatalogueLoads(value: HopV55DecisionReadingArchiveV2) { changeReadingFromCatalogueInput = value; },
  };
}

function requestedProducts(productIds: string[]): string[] {
  const selected = productIds.filter(id => id === 'ych-hyperboost' || id === 'ych-cryo-hops');
  if (selected.length !== 2) throw new Error('Les cartes exactes HyperBoost et Cryo Hops doivent être visibles dans Q03.');
  return selected;
}

function saveRequest(preparation: HopV55QualifiedStudyPreparationV1): HopV55QualifiedProductStudySaveRequest {
  if (preparation.kind !== 'products' || preparation.createCommand.kind !== 'products') throw new Error('Préparation produit attendue.');
  return { kind: 'products', study: preparation.createCommand.study, sourceReadingReference: preparation.sourceReadingReference,
    studyReference: preparation.studyReference, expectedStudyReference: preparation.studyReference };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('Contrôleur d’étude produit qualifiée Q03', () => {
  it('reprend un conflit CAS de préparation avec les mêmes IDs sans recréer le domaine', async () => {
    const harness = await makeHarness({ staleWorkspaceSave: true });
    const parser = vi.spyOn(decisionReader, 'readHopV55Question');
    const builder = vi.spyOn(qualifiedDecision, 'answerQualifiedHopDecision');
    const controller = createHopV55QualifiedStudyController(harness.host);
    const requestedProductIds = requestedProducts(harness.productIds);
    const preparation = await controller.prepareProducts(requestedProductIds);

    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(1);
    expect(harness.saveAttempts).toHaveLength(2);
    expect(harness.saveAttempts[0].workspace.qualifiedStudyPreparations?.[0]).toEqual(harness.saveAttempts[1].workspace.qualifiedStudyPreparations?.[0]);
    expect(harness.selected).toHaveBeenCalledTimes(1);
    expect(harness.reading.response?.actionKind).toBe('understandProducts');
    expect(new Set(harness.reading.response?.result.products.map(product => product.id)))
      .toEqual(new Set(['ych-hyperboost', 'ych-cryo-hops', 'hpa-spectrum']));
    expect(preparation.createCommand.study.request.action).toMatchObject({ kind: 'understandProducts', productIds: requestedProductIds });
    expect(preparation.createCommand.study.kind).toBe('calculated');
    if (preparation.createCommand.study.kind !== 'calculated') throw new Error('Étude produit calculée V2 attendue.');
    expect(preparation.createCommand.study.responseSnapshot.result.products.map(product => product.id)).toEqual(requestedProductIds);
    expect(harness.qualifiedStudies.createCalls).toBe(0);

    const preparedWorkspace = await harness.repository.read(ownerKey, workspaceId);
    expect(preparedWorkspace?.qualifiedStudyPreparations).toEqual([preparation]);
    expect(preparedWorkspace?.qualifiedStudyLinks).toBeUndefined();
    const archivedReading = readHopV55DecisionReadingArchive(preparedWorkspace!.decisionReadings![0]);
    const archivedPreparation = readHopV55QualifiedStudyPreparation(preparedWorkspace!.qualifiedStudyPreparations![0]);
    expect(archivedReading.status).toBe('available');
    expect(archivedPreparation).toMatchObject({ status: 'available', preparation });
    expect(parser).not.toHaveBeenCalled();
    expect(builder).toHaveBeenCalledTimes(1);
    expect(harness.qualifiedStudies.createCalls).toBe(0);
  });

  it('archive avant le dépôt, refuse une préparation périmée et reprend le même dépôt après une erreur locale', async () => {
    const harness = await makeHarness();
    const parser = vi.spyOn(decisionReader, 'readHopV55Question');
    const builder = vi.spyOn(qualifiedDecision, 'answerQualifiedHopDecision');
    const controller = createHopV55QualifiedStudyController(harness.host);
    const preparation = await controller.prepareProducts(requestedProducts(harness.productIds));
    expect(builder).toHaveBeenCalledTimes(1);

    const preparedWorkspace = await harness.repository.read(ownerKey, workspaceId);
    expect(preparedWorkspace?.qualifiedStudyPreparations).toEqual([preparation]);
    expect(preparedWorkspace?.qualifiedStudyLinks).toBeUndefined();
    expect(harness.qualifiedStudies.createCalls).toBe(0);

    const exactRequest = saveRequest(preparation);
    await expect(controller.saveProducts(preparation.reference, { ...exactRequest, expectedStudyReference: 'stale-study-ref' }))
      .rejects.toThrow(/autre lecture ou étude/u);
    expect(harness.qualifiedStudies.createCalls).toBe(0);

    harness.qualifiedStudies.failNextCreate = true;
    await expect(controller.saveProducts(preparation.reference, exactRequest)).rejects.toThrow('Échec transitoire du dépôt local de dossiers.');
    const pendingWorkspace = await harness.repository.read(ownerKey, workspaceId);
    expect(pendingWorkspace?.qualifiedStudyPreparations).toEqual([preparation]);
    expect(pendingWorkspace?.qualifiedStudyLinks).toBeUndefined();
    await expect(harness.qualifiedStudies.read(ownerKey, preparation.dossierId)).resolves.toBeNull();

    const linked = await controller.saveProducts(preparation.reference, exactRequest);
    expect(linked.status).toBe('linked');
    expect(linked.repositoryStatus).toBe('created');
    expect(linked.preparation).toEqual(preparation);
    expect(linked.link).toMatchObject({ sourceReadingReference: harness.archive.contentReference,
      preparationReference: preparation.reference, dossierId: preparation.dossierId, eventId: preparation.eventId,
      studyReference: preparation.studyReference });
    expect(harness.qualifiedStudies.createCalls).toBe(2);
    expect(harness.qualifiedStudies.successfulCreates).toBe(1);
    expect(harness.qualifiedStudies.createInputs[0]).toEqual(harness.qualifiedStudies.createInputs[1]);
    expect(harness.qualifiedStudies.createInputs[1]).toMatchObject({ dossierId: preparation.dossierId, eventId: preparation.eventId,
      study: preparation.createCommand.study });
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();

    const finalWorkspace = await harness.repository.read(ownerKey, workspaceId);
    expect(finalWorkspace?.qualifiedStudyPreparations).toEqual([preparation]);
    expect(finalWorkspace?.qualifiedStudyLinks).toEqual([linked.link]);
    expect(readHopV55QualifiedStudyLink(finalWorkspace!.qualifiedStudyLinks![0])).toMatchObject({ status: 'available', link: linked.link });
    await expect(harness.qualifiedStudies.read(ownerKey, preparation.dossierId)).resolves.toMatchObject({ ownerKey, dossierId: preparation.dossierId,
      state: 'studySaved', study: preparation.createCommand.study });
    await expect(harness.qualifiedStudies.readEvents(ownerKey, preparation.dossierId)).resolves.toHaveLength(1);
    // Archive, workspace and repository readers are projections; none calls the parser or the qualified builder.
    expect(readHopV55DecisionReadingArchive(finalWorkspace!.decisionReadings![0]).status).toBe('available');
    expect(readHopV55QualifiedStudyPreparation(finalWorkspace!.qualifiedStudyPreparations![0]).status).toBe('available');
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
  });

  it('refuse une nouvelle lecture arrivée pendant la qualification sans archiver la préparation ni créer le domaine', async () => {
    const harness = await makeHarness({ secondArchive: true });
    const parser = vi.spyOn(decisionReader, 'readHopV55Question');
    const builder = vi.spyOn(qualifiedDecision, 'answerQualifiedHopDecision');
    const controller = createHopV55QualifiedStudyController(harness.host);
    const requestedProductIds = requestedProducts(harness.productIds);
    const latestArchive = laterArchive(harness);
    harness.changeReadingWhenCatalogueLoads(latestArchive);

    await expect(controller.prepareProducts(requestedProductIds)).rejects.toThrow(/lecture ou la source active a changé/u);

    expect(harness.catalogueInput).toHaveBeenCalledTimes(1);
    expect(harness.selected).not.toHaveBeenCalled();
    expect(harness.saveAttempts).toHaveLength(0);
    expect(harness.qualifiedStudies.createCalls).toBe(0);
    const workspace = await harness.repository.read(ownerKey, workspaceId);
    expect(workspace?.decisionReadings).toEqual([harness.archive, latestArchive]);
    expect(workspace?.qualifiedStudyPreparations).toBeUndefined();
    expect(workspace?.qualifiedStudyLinks).toBeUndefined();
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
  });

  it('lie un domaine déjà créé en archive historique si le contexte change, sans reconstruire ni requalifier', async () => {
    const harness = await makeHarness();
    const parser = vi.spyOn(decisionReader, 'readHopV55Question');
    const builder = vi.spyOn(qualifiedDecision, 'answerQualifiedHopDecision');
    const controller = createHopV55QualifiedStudyController(harness.host);
    const preparation = await controller.prepareProducts(requestedProducts(harness.productIds));
    expect(builder).toHaveBeenCalledTimes(1);
    harness.qualifiedStudies.afterCreated = () => harness.setContext(makeHopV55FixtureContext('unknown'));

    const result = await controller.saveProducts(preparation.reference, saveRequest(preparation));

    expect(result.status).toBe('recoveredHistorical');
    expect(result.repositoryStatus).toBe('created');
    expect(result.freshContext.status).toBe('historical');
    expect(result.freshContext.reason).toMatch(/runtime|contexte|source/u);
    expect(result.preparation).toEqual(preparation);
    expect(result.link).toMatchObject({ preparationReference: preparation.reference, sourceReadingReference: harness.archive.contentReference,
      dossierId: preparation.dossierId, eventId: preparation.eventId, studyReference: preparation.studyReference });
    expect(result.workspace.qualifiedStudyPreparations).toEqual([preparation]);
    expect(result.workspace.qualifiedStudyLinks).toEqual([result.link]);
    expect(harness.qualifiedStudies.createCalls).toBe(1);
    expect(harness.qualifiedStudies.successfulCreates).toBe(1);
    expect(harness.received).toHaveBeenCalledTimes(1);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
  });
});
