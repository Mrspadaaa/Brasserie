import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { createHopDecisionDossierV2, type CreateHopDecisionDossierV2Input,
  type HopDecisionDossierRead, type HopDecisionEventRead } from '../../src/domain/hopDecision/dossier';
import * as qualifiedDecision from '../../src/domain/hopDecision/qualifiedDecision';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import type { HopDecisionLocalRepository } from '../../src/services/hopDecisionLocalRepository';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import * as decisionService from '../../src/services/hopV55/decision';
import { readHopV55QualifiedStudyLink, readHopV55QualifiedStudyPreparation } from '../../src/services/hopV55/qualifiedStudyWorkspace';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';

// Keep the real Page, parser, qualified-study controller, archive readers and
// QualifiedStudyPanel. Only unrelated visual panels are isolated.
vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/Comparison', () => ({ HopV55Comparison: () => null }));
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()), HopV55ProgramEditor: () => null,
}));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/Explorer', () => ({ HopV55Explorer: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));

import { HopV55Page } from '../../src/ui/hopV55/Page';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ownerKey = 'fixture:page-qualified-product-study';
const recipeWorkspaceId = 'workspace:page-qualified-product-study:recipe';
const batchWorkspaceId = 'workspace:page-qualified-product-study:batch';
const question = 'Hyperboost, cryo hops...';

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
      catch (error) {
        this.workspaces.rows.clear();
        for (const [key, row] of snapshot) this.workspaces.rows.set(key, row);
        throw error;
      }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory-only adapter; no IndexedDB or fixture data is cleared. */ }
}

/** The adapter stores genuine domain dossiers/events from createHopDecisionDossierV2. */
class MemoryQualifiedStudies implements HopDecisionLocalRepository {
  readonly dossiers = new Map<string, HopDecisionDossierRead>();
  readonly events = new Map<string, HopDecisionEventRead[]>();
  readonly createInputs: CreateHopDecisionDossierV2Input[] = [];
  createCalls = 0;
  successfulCreates = 0;
  failNextCreate = false;
  readCalls = 0;
  readEventCalls = 0;
  private key(owner: string, dossierId: string) { return `${owner}\0${dossierId}`; }
  async create(input: Parameters<HopDecisionLocalRepository['create']>[0]) {
    this.createCalls++;
    if (!('formatVersion' in input.study) || input.study.formatVersion !== 2 || input.study.actionKind !== 'understandProducts') {
      throw new Error('Cette fixture DAO n’accepte que l’étude produit V2 réelle.');
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
    return { status: 'created' as const, dossier: created.dossier, event: created.event };
  }
  async append(): Promise<never> { throw new Error('L’append de préférence est hors de ce parcours produit.'); }
  async read(owner: string, dossierId: string) {
    this.readCalls++;
    const row = this.dossiers.get(this.key(owner, dossierId));
    return row ? structuredClone(row) : null;
  }
  async list(owner: string) { return [...this.dossiers.values()].filter(row => row.ownerKey === owner).map(row => structuredClone(row)); }
  async readEvents(owner: string, dossierId: string) {
    this.readEventCalls++;
    return structuredClone(this.events.get(this.key(owner, dossierId)) ?? []);
  }
  close() { /* Memory-only adapter. */ }
}

function makeContext(kind: 'recipe' | 'batch', missingBatchJournal = false): BrewerContext {
  const context = makeHopV55FixtureContext(kind === 'recipe' ? 'planning' : 'fermenting');
  if (kind === 'batch') {
    const journal = { revision: 11, startedAt: Date.parse('2026-10-01T09:00:00.000Z'), currentIndex: 0,
      steps: [], readings: [] };
    if (missingBatchJournal) {
      delete context.journal;
      if (context.batch) delete context.batch.brewDay;
    } else {
      context.journal = structuredClone(journal);
      if (context.batch) context.batch.brewDay = structuredClone(journal);
    }
  }
  return context;
}

async function pageHarness(kind: 'recipe' | 'batch', options: { missingBatchJournal?: boolean } = {}) {
  const context = makeContext(kind, options.missingBatchJournal);
  if (kind === 'recipe' && !context.recipe?.id) throw new Error('La fixture recette exacte est requise.');
  if (kind === 'batch' && !context.batch?.id) throw new Error('La fixture de brassin exacte est requise.');
  const prepared = prepareBrewingScenarioContext(context);
  const workspaceId = kind === 'recipe' ? recipeWorkspaceId : batchWorkspaceId;
  const base: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: kind === 'recipe' ? 'Étude produit · recette fixture' : 'Étude produit · brassin fixture',
    intent: { question: '', criteria: [] },
    ...(kind === 'recipe' ? { sourceRecipeId: context.recipe!.id } : { sourceBatchId: context.batch!.id }),
    scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-10-03T10:00:00.000Z',
  };
  const initial = ensureHopV55ReferenceJournal(base, context, prepared);
  const database = new MemoryWorkspaceDatabase();
  const repository = createHopV55WorkspaceRepository({ ownerKey, database });
  await repository.save(initial, null);
  const save = vi.fn((next: HopV55Workspace, expectedRevision: number | null) => repository.save(next, expectedRevision));
  const qualifiedStudies = new MemoryQualifiedStudies();
  const loadContext = vi.fn(async (_recipe?: unknown, _source?: unknown) => structuredClone(context));
  const services = {
    scope: 'fixture' as const, ownerKey, loadContext,
    workspaces: { list: repository.list, read: repository.read, save, close: repository.close },
    scenarios: { list: vi.fn(async () => []) },
    qualifiedStudies,
  } as unknown as HopV55Services;
  return { context, prepared, services, repository, save, qualifiedStudies, workspaceId };
}

async function readQ03() {
  fireEvent.change(await screen.findByRole('textbox', { name: 'Question au brasseur' }), { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: 'Lire ma question' }));
  return screen.findByRole('button', { name: 'Préparer une étude de ces fiches produit' });
}

async function waitForStudyLink(harness: Awaited<ReturnType<typeof pageHarness>>, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const workspace = await harness.repository.read(ownerKey, harness.workspaceId);
    if (workspace?.qualifiedStudyLinks?.length) return workspace;
    const alerts = screen.queryAllByRole('alert').map(row => row.textContent?.trim()).filter(Boolean);
    if (alerts.length) throw new Error(`La sauvegarde a échoué après la réponse du DAO : ${alerts.join(' | ')}`);
    if (Date.now() >= deadline) {
      const statuses = screen.queryAllByRole('status').map(row => row.textContent?.trim()).filter(Boolean);
      throw new Error(`Lien non rattaché après ${timeoutMs} ms; create=${harness.qualifiedStudies.createCalls}, `
        + `successful=${harness.qualifiedStudies.successfulCreates}; status=${statuses.join(' | ') || 'aucun'}`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Parent owns the production activation. Keep these real-Page scenarios staged,
// not bypassed, until the feature gate and its typecheck are received.
describe('Page V5.5 — étude produit qualifiée Q03', () => {
  it('prépare depuis une lecture recette, reprend une erreur DAO, puis relit l’archive sans recalcul ni écriture', async () => {
    const harness = await pageHarness('recipe');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(qualifiedDecision, 'answerQualifiedHopDecision');
    render(<HopV55Page services={harness.services} />);

    fireEvent.click(await readQ03());
    const active = await harness.repository.read(ownerKey, harness.workspaceId);
    const archiveRead = active?.decisionReadings?.[0] && readHopV55DecisionReadingArchive(active.decisionReadings[0]);
    expect(archiveRead?.status).toBe('available');
    if (!archiveRead || archiveRead.status !== 'available') throw new Error('Archive Q03 active et lisible attendue.');
    const response = archiveRead.archive.reading.response;
    if (!response || response.actionKind !== 'understandProducts') throw new Error('Réponse Q03 de fiches produit attendue.');
    expect(archiveRead.archive.source).toEqual({ kind: 'recipe', id: harness.context.recipe!.id });
    expect(parser).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Préparer une étude de ces fiches produit' }));
    await screen.findByText('Nouvelle étude qualifiée préparée pour ces fiches. La lecture précédente reste intacte.');
    await screen.findByRole('heading', { name: 'Comprendre les produits examinés' });
    let workspace = await harness.repository.read(ownerKey, harness.workspaceId);
    expect(workspace?.qualifiedStudyPreparations).toHaveLength(1);
    const prepRead = readHopV55QualifiedStudyPreparation(workspace!.qualifiedStudyPreparations![0]);
    expect(prepRead.status).toBe('available');
    if (prepRead.status !== 'available' || prepRead.preparation.kind !== 'products') throw new Error('Préparation Q03 disponible attendue.');
    const preparation = prepRead.preparation;
    expect(preparation.sourceReadingReference).toBe(archiveRead.archive.contentReference);

    await screen.findByText('Étude préparée', {}, { timeout: 15000 });
    expect(workspace?.qualifiedStudyLinks).toBeUndefined();
    expect(harness.qualifiedStudies.createCalls).toBe(0);
    expect(preparation.createCommand.study.kind).toBe('calculated');
    if (preparation.createCommand.study.kind !== 'calculated') throw new Error('Étude calculée attendue pour les fiches affichées sans collision.');
    expect(preparation.createCommand.study.context).toEqual({ kind: 'recipe', recipeId: harness.context.recipe!.id,
      recipeReference: hopDecisionReference(harness.context.recipe) });
    expect(preparation.createCommand.study.request.action).toEqual({ kind: 'understandProducts',
      productIds: response.result.products.map(product => product.id) });
    expect(builder).toHaveBeenCalledTimes(1);

    harness.qualifiedStudies.failNextCreate = true;
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude produit' }));
    const repositoryErrors = await screen.findAllByText('Échec transitoire du dépôt local de dossiers.', {}, { timeout: 15000 });
    expect(repositoryErrors.length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Conserver cette étude produit' })).toBeEnabled());
    workspace = await harness.repository.read(ownerKey, harness.workspaceId);
    expect(workspace?.qualifiedStudyPreparations).toEqual([preparation]);
    expect(workspace?.qualifiedStudyLinks).toBeUndefined();
    expect(harness.qualifiedStudies.successfulCreates).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude produit' }));
    await waitFor(() => expect(harness.qualifiedStudies.createCalls).toBe(2), { timeout: 10000 });
    await waitFor(() => expect(harness.qualifiedStudies.successfulCreates).toBe(1), { timeout: 15000 });
    workspace = await waitForStudyLink(harness);
    await screen.findByText('Étude produit conservée avec ses fiches et sources exactes.', {}, { timeout: 10000 });
    workspace = await harness.repository.read(ownerKey, harness.workspaceId);
    expect(workspace?.qualifiedStudyPreparations).toEqual([preparation]);
    expect(workspace?.qualifiedStudyLinks).toHaveLength(1);
    const linkRead = readHopV55QualifiedStudyLink(workspace!.qualifiedStudyLinks![0]);
    expect(linkRead.status).toBe('available');
    if (linkRead.status !== 'available') throw new Error('Lien qualifié conservé attendu.');
    expect(linkRead.link).toMatchObject({ sourceReadingReference: archiveRead.archive.contentReference,
      preparationReference: preparation.reference, dossierId: preparation.dossierId, eventId: preparation.eventId,
      studyReference: preparation.studyReference });
    expect(harness.qualifiedStudies.createCalls).toBe(2);
    expect(harness.qualifiedStudies.successfulCreates).toBe(1);
    expect(harness.qualifiedStudies.createInputs[0]).toEqual(harness.qualifiedStudies.createInputs[1]);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).toHaveBeenCalledTimes(1);

    const writesBeforeReload = harness.save.mock.calls.length;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(await screen.findByText(/Études produit et conseils qualifiés · 1/u));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette étude exacte' }));
    await screen.findByText('Étude archivée');
    expect(screen.getByRole('heading', { name: 'Comprendre les produits examinés' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Conserver cette étude produit' })).not.toBeInTheDocument();
    expect(harness.qualifiedStudies.readCalls).toBeGreaterThan(0);
    expect(harness.qualifiedStudies.readEventCalls).toBeGreaterThan(0);
    expect(harness.save).toHaveBeenCalledTimes(writesBeforeReload);
    expect(parser).toHaveBeenCalledTimes(1);
    expect(builder).toHaveBeenCalledTimes(1);
    expect((await harness.repository.read(ownerKey, harness.workspaceId))?.decisionReadings?.[0]).toEqual(active!.decisionReadings![0]);
  }, 60000);

  it('scelle le numéro de révision réel du journal du brassin dans la préparation produit', async () => {
    const harness = await pageHarness('batch');
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(qualifiedDecision, 'answerQualifiedHopDecision');
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await readQ03());
    fireEvent.click(screen.getByRole('button', { name: 'Préparer une étude de ces fiches produit' }));
    await screen.findByText('Étude préparée');

    const workspace = await harness.repository.read(ownerKey, harness.workspaceId);
    const archive = readHopV55DecisionReadingArchive(workspace!.decisionReadings![0]);
    if (archive.status !== 'available') throw new Error('Lecture du brassin archivée attendue.');
    const stored = readHopV55QualifiedStudyPreparation(workspace!.qualifiedStudyPreparations![0]);
    if (stored.status !== 'available' || stored.preparation.kind !== 'products') throw new Error('Préparation produit liée au brassin attendue.');
    const program = harness.prepared.runtime.current?.program;
    if (!program) throw new Error('Programme de référence du brassin exact attendu.');
    expect(archive.archive.source).toEqual({ kind: 'batch', id: harness.context.batch!.id });
    expect(stored.preparation.createCommand.study.context).toMatchObject({ kind: 'batch', batchId: harness.context.batch!.id,
      brewDayRevision: 11, recipeSnapshotReference: hopDecisionReference(harness.context.batch!.recipeSnapshot),
      programFingerprint: programFingerprint(program), stage: program.stage });
    expect(harness.qualifiedStudies.createCalls).toBe(0);
    expect(parser).toHaveBeenCalledTimes(1);
    expect(builder).toHaveBeenCalledTimes(1);
  }, 30000);

  it('refuse un brassin sans révision de journal au lieu d’en créer une valeur zéro', async () => {
    const harness = await pageHarness('batch', { missingBatchJournal: true });
    const parser = vi.spyOn(decisionService, 'readHopV55Question');
    const builder = vi.spyOn(qualifiedDecision, 'answerQualifiedHopDecision');
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await readQ03());
    fireEvent.click(screen.getByRole('button', { name: 'Préparer une étude de ces fiches produit' }));
    await screen.findByText(/Le lien au brassin manque de sa révision exacte du jour de brassage/u);

    const workspace = await harness.repository.read(ownerKey, harness.workspaceId);
    const archive = readHopV55DecisionReadingArchive(workspace!.decisionReadings![0]);
    expect(archive.status).toBe('available');
    if (archive.status !== 'available') throw new Error('La lecture Q03 reste archivée même si la préparation est refusée.');
    expect(archive.archive.source).toEqual({ kind: 'batch', id: harness.context.batch!.id });
    expect(workspace?.qualifiedStudyPreparations).toBeUndefined();
    expect(workspace?.qualifiedStudyLinks).toBeUndefined();
    expect(harness.qualifiedStudies.createCalls).toBe(0);
    expect(parser).toHaveBeenCalledTimes(1);
    expect(builder).not.toHaveBeenCalled();
  }, 30000);
});
