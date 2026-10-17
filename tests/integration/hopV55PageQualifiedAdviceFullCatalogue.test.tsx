import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import { applyHopAdviceEvent, createHopAdviceDossier, hopAdviceEventContentReference, readHopAdviceEvent,
  type CreateHopAdviceDossierInput, type HopAdviceDossierV3, type HopAdviceEventRead, type HopAdviceEventV3 } from '../../src/domain/hopDecision/adviceDossier';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { buildHopV55DecisionSituation } from '../../src/services/hopV55/decision';
import * as decisionService from '../../src/services/hopV55/decision';
import { hopV55DecisionReadingMaterialExclusions } from '../../src/services/hopV55/decisionCorrection';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import * as qualifiedAdviceDomain from '../../src/domain/hopDecision/qualifiedAdvice';
import * as catalogueLoader from '../../src/domain/hopDecision/catalogueLoader';
import * as advicePreferenceAdapter from '../../src/domain/hopDecision/adviceProgramAdapter';
import * as adviceDossierDomain from '../../src/domain/hopDecision/adviceDossier';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createHopV55FixtureCatalogueClientForTests, makeHopV55FixtureContext,
  type HopV55FixtureCatalogueDatabaseAdapter, type HopV55FixtureReferences } from '../../src/services/hopV55/fixtureRuntime';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { createHopV55DecisionReadingArchiveV3, readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchiveV3 } from '../../src/services/hopV55/decisionArchive';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1 } from '../../src/services/hopV55/questionScopeReading';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { readHopV55QualifiedStudyLink, type HopV55QualifiedStudyPreparationV1 } from '../../src/services/hopV55/qualifiedStudyWorkspace';
import { readHopV55QualifiedStudyPreferenceCommand } from '../../src/services/hopV55/qualifiedStudyPreference';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';
import type { HopDecisionLocalRepository } from '../../src/services/hopDecisionLocalRepository';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';

// Keep the Page, Q09 parser, scope panel, advice controls, qualified-study panel,
// host controllers, domain builders, archive readers and memory repositories real.
// Only unrelated visual panels are isolated.
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

const ownerKey = 'fixture:page-q09-qualified-advice';
const q09Question = 'Quand avec ma levure, utiliser au mieux mes houblons et lesquels ?';
const recordedAt = '2026-10-03T21:30:00.000Z';
const q09CandidateId = 'variety:fixture-q09-candidate';

function q09CandidateVariety(): HopVariety {
  const source: HopSource = {
    title: 'Description synthétique du comparateur Q09',
    author: 'Fixture locale Q09',
    year: 2026,
    kind: 'observation',
    reference: 'fixture:q09:raw-hop-description',
    locator: 'Description de test uniquement; aucune mesure, identité commerciale ou bière finie.',
  };
  return {
    id: 'fixture-q09-candidate',
    name: 'Houblon de comparaison Q09',
    aliases: [],
    form: 'pelletT90',
    descriptions: [{ text: 'citrus citronné', context: 'rawHop', source }],
    analysis: [],
  };
}

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  beforeWrite?: (key: string, previous: HopV55WorkspaceEnvelopeV1 | undefined) => void;
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [
      (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
    ]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.beforeWrite?.(key, undefined);
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    this.beforeWrite?.(key, this.rows.get(key));
    this.rows.set(key, structuredClone(row));
  }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  readonly workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  private activeRollback: Map<string, HopV55WorkspaceEnvelopeV1 | null> | undefined;
  constructor() {
    this.workspaces.beforeWrite = (key, previous) => {
      if (this.activeRollback && !this.activeRollback.has(key)) this.activeRollback.set(key, previous ?? null);
    };
  }
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const rollback = new Map<string, HopV55WorkspaceEnvelopeV1 | null>();
      this.activeRollback = rollback;
      try { return await work(); }
      catch (error) {
        for (const [key, previous] of rollback) {
          if (previous === null) this.workspaces.rows.delete(key);
          else this.workspaces.rows.set(key, previous);
        }
        throw error;
      } finally {
        this.activeRollback = undefined;
      }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Memory-only adapter; no IndexedDB or fixture data is cleared. */ }
}

type CatalogueRecordRow = Parameters<HopV55FixtureCatalogueDatabaseAdapter['records']['add']>[0];
type CatalogueOperationRow = Parameters<HopV55FixtureCatalogueDatabaseAdapter['operations']['add']>[0];

class MemoryCatalogueDatabase implements HopV55FixtureCatalogueDatabaseAdapter {
  private recordRows = new Map<string, CatalogueRecordRow>();
  private operationRows = new Map<string, CatalogueOperationRow>();
  records = {
    get: async (key: unknown) => { const row = this.recordRows.get(JSON.stringify(key)); return row && structuredClone(row); },
    add: async (row: CatalogueRecordRow) => {
      const key = JSON.stringify([row.kind, row.id]);
      if (this.recordRows.has(key)) throw new Error('ConstraintError');
      this.recordRows.set(key, structuredClone(row));
    },
    put: async (row: CatalogueRecordRow) => { this.recordRows.set(JSON.stringify([row.kind, row.id]), structuredClone(row)); },
    toArray: async () => [...this.recordRows.values()].map(row => structuredClone(row)),
  };
  operations = {
    get: async (key: unknown) => { const row = this.operationRows.get(String(key)); return row && structuredClone(row); },
    add: async (row: CatalogueOperationRow) => {
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
      catch (error) {
        this.recordRows = records;
        this.operationRows = operations;
        throw error;
      }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Catalogue is isolated in memory for this test. */ }
}

function mergeCatalogueRows<T extends { id: string }>(...groups: readonly (readonly T[])[]): T[] {
  const rows = new Map<string, T>();
  for (const group of groups) for (const row of group) {
    const previous = rows.get(row.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(row)) {
      throw new Error('Identité locale dupliquée avec un contenu divergent : ' + row.id);
    }
    if (!previous) rows.set(row.id, structuredClone(row));
  }
  return [...rows.values()];
}
class MemoryAdviceRepository implements HopDecisionLocalRepository {
  readonly dossiers = new Map<string, HopAdviceDossierV3>();
  readonly events = new Map<string, HopAdviceEventV3[]>();
  readonly createInputs: CreateHopAdviceDossierInput[] = [];
  createCalls = 0;
  successfulCreates = 0;
  appendCalls = 0;
  failCreateOnce = false;
  private key(owner: string, dossierId: string) { return JSON.stringify([owner, dossierId]); }
  async create(input: Parameters<HopDecisionLocalRepository['create']>[0]) {
    this.createCalls++;
    const attempt = this.createCalls;
    const started = performance.now();
    console.info('Q09_DAO_CREATE_BEGIN ' + attempt);
    if (input.study.formatVersion !== 3 || input.study.kind !== 'advice') {
      throw new Error('Cette fixture mémoire accepte uniquement une étude de conseil V3 réelle.');
    }
    const cloneStarted = performance.now();
    const command = structuredClone(input as CreateHopAdviceDossierInput);
    console.info('Q09_DAO_CREATE_CLONE ' + attempt + ' ' + Math.round(performance.now() - cloneStarted) + 'ms');
    this.createInputs.push(command);
    if (this.failCreateOnce) { this.failCreateOnce = false; console.info('Q09_DAO_CREATE_FAIL ' + attempt + ' ' + Math.round(performance.now() - started) + 'ms'); throw new Error('Échec transitoire du DAO advice fixture.'); }
    const key = this.key(command.ownerKey, command.dossierId);
    const existing = this.dossiers.get(key);
    const firstEvent = this.events.get(key)?.[0];
    if (existing && firstEvent) return { status: 'duplicate' as const, dossier: structuredClone(existing), event: structuredClone(firstEvent) };
    const validationStarted = performance.now();
    const created = createHopAdviceDossier(command);
    console.info('Q09_DAO_CREATE_VALIDATE ' + attempt + ' ' + Math.round(performance.now() - validationStarted) + 'ms');
    this.dossiers.set(key, structuredClone(created.dossier));
    this.events.set(key, [structuredClone(created.event)]);
    this.successfulCreates++;
    console.info('Q09_DAO_CREATE_DONE ' + attempt + ' ' + Math.round(performance.now() - started) + 'ms');
    return { status: 'created' as const, dossier: structuredClone(created.dossier), event: structuredClone(created.event) };
  }
  async append(input: Parameters<HopDecisionLocalRepository['append']>[0]) {
    this.appendCalls++;
    const decoded = readHopAdviceEvent(input.event);
    if ('status' in decoded) throw new Error('Cette fixture mémoire accepte uniquement les événements advice V3 connus.');
    const key = this.key(input.ownerKey, input.dossierId);
    const current = this.dossiers.get(key), prior = this.events.get(key);
    if (!current || !prior) throw Object.assign(new Error('Dossier advice absent.'), { code: 'notFound' });
    const found = prior.find(event => event.eventId === decoded.eventId);
    if (found) {
      if (hopAdviceEventContentReference(found) !== hopAdviceEventContentReference(decoded)) {
        throw Object.assign(new Error('EventId advice conflict.'), { code: 'eventIdConflict' });
      }
      return { status: 'duplicate' as const, dossier: structuredClone(current), event: structuredClone(found) };
    }
    const next = applyHopAdviceEvent(current, decoded, prior);
    prior.push(structuredClone(decoded));
    this.dossiers.set(key, structuredClone(next));
    return { status: 'appended' as const, dossier: structuredClone(next), event: structuredClone(decoded) };
  }
  async read(owner: string, dossierId: string) {
    const started = performance.now();
    const value = this.dossiers.get(this.key(owner, dossierId));
    const result = value ? structuredClone(value) : null;
    console.info('Q09_DAO_READ ' + Math.round(performance.now() - started) + 'ms');
    return result;
  }
  async list(owner: string) {
    return [...this.dossiers.values()].filter(row => row.ownerKey === owner).map(row => structuredClone(row));
  }
  async readEvents(owner: string, dossierId: string): Promise<HopAdviceEventRead[]> {
    const started = performance.now();
    const result = structuredClone(this.events.get(this.key(owner, dossierId)) ?? []);
    console.info('Q09_DAO_READ_EVENTS ' + Math.round(performance.now() - started) + 'ms');
    return result;
  }
  close() { /* Memory-only adapter. */ }
}

interface PageHarnessOptions {
  source?: 'recipe' | 'batch' | 'exploration';
  addQ09Candidate?: boolean;
}

async function pageHarness(options: PageHarnessOptions = {}) {
  const source = options.source ?? 'recipe';
  const mode = source === 'recipe' ? 'planning' : source === 'batch' ? 'fermenting' : 'unknown';
  const context = makeHopV55FixtureContext(mode);
  const catalogueReferences = await loadBrewingCatalogueReferences();
  const fixtureIndex = context.hopIndex;
  if (!fixtureIndex) throw new Error('Index fixture V5.5 attendu.');
  const additionalCandidate = options.addQ09Candidate ? [q09CandidateVariety()] : [];
  const fullVarieties = mergeCatalogueRows(catalogueReferences.varieties, fixtureIndex.varieties, additionalCandidate);
  const fullKnowledge = mergeCatalogueRows(catalogueReferences.knowledge, fixtureIndex.knowledge);
  const fullReferences: HopV55FixtureReferences = { varieties: fullVarieties, knowledge: fullKnowledge };
  context.hopIndex = { ...fixtureIndex, varieties: structuredClone(fullVarieties), knowledge: structuredClone(fullKnowledge) };
  const catalogue = createHopV55FixtureCatalogueClientForTests({ namespace: 'q09-full-' + source,
    database: new MemoryCatalogueDatabase(), loadReferences: async () => structuredClone(fullReferences) });
  const catalogueSummary = {
    referenceVarieties: catalogueReferences.varieties.length,
    referenceKnowledge: catalogueReferences.knowledge.length,
    contextVarieties: fullVarieties.length,
    contextKnowledge: fullKnowledge.length,
    fixtureVarieties: fixtureIndex.varieties.length,
    fixtureKnowledge: fixtureIndex.knowledge.length,
    firstReferenceVarietyId: catalogueReferences.varieties[0]?.id,
    firstReferenceVarietyName: catalogueReferences.varieties[0]?.name,
  };
  if (source === 'batch') {
    if (!context.batch) throw new Error('Brassin synthétique exact attendu.');
    const journal = { revision: 11, startedAt: Date.parse('2026-10-01T09:00:00.000Z'), currentIndex: 0,
      steps: [], readings: [] };
    context.journal = structuredClone(journal);
    context.batch.brewDay = structuredClone(journal);
  }
  const prepared = prepareBrewingScenarioContext(context);
  const workspaceId = 'workspace:page-q09-' + source;
  const base: HopV55Workspace = {
    format: 'hop-v55-workspace-v1',
    id: workspaceId,
    ownerKey,
    revision: 0,
    title: 'Q09 · étude de fixture',
    intent: { question: '', criteria: [] },
    ...(source === 'recipe' && context.recipe?.id ? { sourceRecipeId: context.recipe.id } : {}),
    ...(source === 'batch' && context.batch?.id ? { sourceBatchId: context.batch.id } : {}),
    scenarioIds: [],
    referenceHypotheses: [],
    copies: [],
    updatedAt: recordedAt,
  };
  const initial = ensureHopV55ReferenceJournal(base, context, prepared);
  // This suite receives the legacy V3 scope contract from an existing archive.
  // New Page submissions intentionally use semantic V4 and are covered elsewhere.
  const seededScopes = readHopV55QuestionWithScopesV1(q09Question, prepared);
  const scopeTransition = { actId: `fixture:q09:${source}:scope-create`, kind: 'create' as const,
    reason: 'Portées source conservées dans la fixture historique Q09.', recordedAt,
    actor: { origin: 'fixture' as const, label: 'Archive V3 de fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question: q09Question,
    reading: seededScopes.reading, scopeDrafts: seededScopes.scopeDrafts, transition: scopeTransition });
  const readingSource = source === 'recipe' && context.recipe?.id ? { kind: 'recipe' as const, id: context.recipe.id }
    : source === 'batch' && context.batch?.id ? { kind: 'batch' as const, id: context.batch.id } : { kind: 'exploration' as const };
  const legacyArchive = createHopV55DecisionReadingArchiveV3({ id: `reading:q09-seed:${source}`, ownerKey,
    workspaceId, recordedAt, reading: seededScopes.reading, source: readingSource,
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime), scopeLedger, transition: scopeTransition });
  const seededWorkspace = ensureHopV55ReferenceJournal({ ...initial, intent: seededScopes.reading.intent,
    decisionReadings: [legacyArchive] }, context, prepared);
  const database = new MemoryWorkspaceDatabase();
  const rawRepository = createHopV55WorkspaceRepository({ ownerKey, database });
  await rawRepository.save(seededWorkspace, null);
  let failWorkspaceSaveOnce = false;
  let lastSavedWorkspace: HopV55Workspace | undefined;
  const save = vi.fn(async (next: HopV55Workspace, expectedRevision: number | null) => {
    if (failWorkspaceSaveOnce) {
      failWorkspaceSaveOnce = false;
      throw new Error('Échec transitoire du CAS workspace fixture.');
    }
    const casStarted = performance.now();
    const saved = await rawRepository.save(next, expectedRevision);
    console.info('Q09_REPOSITORY_CAS_SAVE ' + Math.round(performance.now() - casStarted) + 'ms revision ' + saved.revision
      + ' preparations ' + (saved.qualifiedStudyPreparations?.length ?? 0));
    lastSavedWorkspace = saved;
    return saved;
  });
  const workspaceRepository = {
    list: rawRepository.list,
    async read(key: string, id: string) {
      const started = performance.now();
      const result = await rawRepository.read(key, id);
      console.info('Q09_REPOSITORY_READ ' + Math.round(performance.now() - started) + 'ms revision ' + (result?.revision ?? 'none')
        + ' preparations ' + (result?.qualifiedStudyPreparations?.length ?? 0));
      return result;
    },
    save,
    close: rawRepository.close,
  };
  const qualifiedStudies = new MemoryAdviceRepository();
  const services = {
    scope: 'fixture' as const,
    ownerKey,
    loadContext: vi.fn(async () => structuredClone(context)),
    loadFutureDraft: vi.fn(async () => { throw new Error('Aucun brouillon futur ne fait partie de cette fixture.'); }),
    workspaces: workspaceRepository,
    scenarios: { list: vi.fn(async () => []) },
    catalogue,
    qualifiedStudies,
    close: vi.fn(() => catalogue.close()),
  } as unknown as HopV55Services;
  return {
    source, context, prepared, workspaceId, services, rawRepository, save, qualifiedStudies, catalogue, catalogueSummary,
    candidate: prepared.runtime.materials.find(material => material.id === q09CandidateId),
    failNextWorkspaceSave() { failWorkspaceSaveOnce = true; },
    lastSaved() {
      if (!lastSavedWorkspace) throw new Error('Aucun résultat CAS de fixture n’a été conservé.');
      return lastSavedWorkspace;
    },
    async stored() {
      const workspace = await rawRepository.read(ownerKey, workspaceId);
      if (!workspace) throw new Error('Workspace fixture absent.');
      return workspace;
    },
  };
}

function activeArchive(workspace: HopV55Workspace): HopV55DecisionReadingArchiveV3 {
  const raw = workspace.decisionReadings?.at(-1);
  const read = raw && readHopV55DecisionReadingArchive(raw);
  if (!read || read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v3') {
    throw new Error('Archive V3 Q09 exacte attendue.');
  }
  return read.archive;
}

async function readQ09(harness: Awaited<ReturnType<typeof pageHarness>>) {
  await screen.findByRole('textbox', { name: 'Question au brasseur' });
  fireEvent.click(screen.getByRole('button', { name: 'Historique', exact: true }));
  fireEvent.click(screen.getByText(/Lectures et préparations de question/));
  const row = screen.getByText(q09Question, { exact: true }).closest('article');
  if (!row) throw new Error('Archive V3 Q09 attendue dans l’historique fixture.');
  fireEvent.click(within(row).getByRole('button', { name: 'Relire cette lecture' }));
  await screen.findByRole('button', { name: 'Relire cette demande dans le contexte actif' });
  fireEvent.click(screen.getByRole('button', { name: 'Relire cette demande dans le contexte actif' }));
  await screen.findByRole('heading', { name: 'Portées de la question' });
  await screen.findByRole('heading', { name: 'Choisir le contexte à examiner' });
  const workspace = await waitFor(async () => {
    const current = await harness.stored();
    expect(current.decisionReadings).toHaveLength(2);
    return current;
  });
  return activeArchive(workspace);
}

async function retainQ09Scopes(harness: Awaited<ReturnType<typeof pageHarness>>, archive: HopV55DecisionReadingArchiveV3) {
  expect(archive.scopeLedger.sourceScopes).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Garder la portée «Quand l’employer»' }));
  fireEvent.click(screen.getByRole('button', { name: 'Garder la portée «Quelles matières examiner»' }));
  fireEvent.change(screen.getByLabelText('Motif de la disposition'), {
    target: { value: 'Conserver distinctement les questions de moment et de choix de matière.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));
  const workspace = await waitFor(async () => {
    const current = await harness.stored();
    expect(current.decisionReadings).toHaveLength(3);
    return current;
  });
  return activeArchive(workspace);
}

function latestAdvicePreparation(workspace: HopV55Workspace): HopV55QualifiedStudyPreparationV1 {
  // The harness receives the successful workspace CAS result, already strictly validated by the repository.
  // The history gesture later exercises a fresh decoder read without recalculation.
  const raw = workspace.qualifiedStudyPreparations?.at(-1);
  if (!raw || !('createCommand' in raw) || raw.kind !== 'advice' || raw.createCommand.kind !== 'advice') {
    throw new Error('Préparation advice V3 exacte attendue.');
  }
  return raw as HopV55QualifiedStudyPreparationV1;
}

function spyPageAndAdviceBuilders() {
  const originalStudyReference = adviceDossierDomain.hopAdviceStudyReference;
  const studyReference = vi.spyOn(adviceDossierDomain, 'hopAdviceStudyReference').mockImplementation(study => {
    const started = performance.now();
    const result = originalStudyReference(study);
    const elapsed = Math.round(performance.now() - started);
    if (elapsed > 50) console.info('Q09_STUDY_REFERENCE ' + elapsed + 'ms');
    return result;
  });
  const originalAdviceBuilder = qualifiedAdviceDomain.answerQualifiedHopAdvice;
  const adviceBuilder = vi.spyOn(qualifiedAdviceDomain, 'answerQualifiedHopAdvice').mockImplementation(input => {
    const started = performance.now();
    const result = originalAdviceBuilder(input);
    console.info('Q09_ADVICE_BUILD ' + Math.round(performance.now() - started) + 'ms variants '
      + input.qualificationInput.variants.length);
    return result;
  });
  const originalCatalogueLoader = catalogueLoader.loadHopCatalogueQualificationInput;
  const loader = vi.spyOn(catalogueLoader, 'loadHopCatalogueQualificationInput').mockImplementation(async input => {
    const started = performance.now();
    const result = await originalCatalogueLoader(input);
    console.info('Q09_CATALOGUE_LOAD ' + Math.round(performance.now() - started) + 'ms saved '
      + (input.saved?.varieties?.length ?? 0) + ' varieties/' + (input.saved?.lots?.length ?? 0) + ' lots variants '
      + result.variants.length + ' evidence ' + result.basisEvidence.length);
    return result;
  });
  return {
    parser: vi.spyOn(decisionService, 'readHopV55Question'),
    propertyBuilder: vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'),
    adviceBuilder,
    studyReference,
    loader,
    preferenceCapture: vi.spyOn(advicePreferenceAdapter, 'captureHopAdvicePreference'),
  };
}

describe('adaptateur mémoire de transaction — journal et isolement', () => {
  it('restaure les clés écrites après échec et n’expose ni la ligne passée ni la ligne lue', async () => {
    const database = new MemoryWorkspaceDatabase();
    const ownerKey = 'fixture:memory-journal';
    const workspaceId = 'workspace:memory-journal';
    const key = JSON.stringify([ownerKey, workspaceId]);
    const original: HopV55WorkspaceEnvelopeV1 = {
      format: 'hop-v55-workspace-envelope-v1', ownerKey, workspaceId, revision: 1,
      workspace: { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
        title: 'Version conservée', intent: { question: '', criteria: [] }, scenarioIds: [],
        referenceHypotheses: [], copies: [], updatedAt: '2026-10-04T12:00:00.000Z' },
    };
    await database.workspaces.add(original);
    original.workspace.title = 'Mutation de l’argument';
    const storedOriginal = database.workspaces.rows.get(key);
    if (!storedOriginal) throw new Error('Ligne mémoire initiale attendue.');
    const read = await database.workspaces.get([ownerKey, workspaceId]);
    if (!read) throw new Error('Lecture mémoire initiale attendue.');
    read.workspace.title = 'Mutation de la copie de lecture';
    expect(database.workspaces.rows.get(key)).toBe(storedOriginal);
    expect(database.workspaces.rows.get(key)?.workspace.title).toBe('Version conservée');

    const changed = { ...storedOriginal, revision: 2, workspace: { ...storedOriginal.workspace, revision: 2, title: 'Remplacement' } };
    await expect(database.transaction('rw', database.workspaces, async () => {
      await database.workspaces.put(changed);
      throw new Error('panne après write');
    })).rejects.toThrow('panne après write');
    expect(database.workspaces.rows.get(key)).toBe(storedOriginal);
    expect(database.workspaces.rows.get(key)).toEqual(storedOriginal);

    const newId = 'workspace:memory-journal-add';
    const newKey = JSON.stringify([ownerKey, newId]);
    const added = { ...original, workspaceId: newId, workspace: { ...original.workspace, id: newId } };
    await expect(database.transaction('rw', database.workspaces, async () => {
      await database.workspaces.add(added);
      throw new Error('panne après add');
    })).rejects.toThrow('panne après add');
    expect(database.workspaces.rows.has(newKey)).toBe(false);
  });
});
describe('Page V5.5 — Q09 avec catalogue local complet', () => {
  it('compare les copies plaines détachées dans le runtime Page', async () => {
    const { sameCanonicalData } = await import('../../src/services/hopV55/operationScopedQualifiedValidation');
    const plain = { id: 'q09', rows: [{ value: 1, absent: undefined }] };
    expect(sameCanonicalData(plain, structuredClone(plain))).toBe(true);
  });
  it('parcourt la lecture Q09, l’étude, la préférence et la relecture avec le catalogue complet local', async () => {
    const started = performance.now();
    const mark = (phase: string) => console.info('Q09_FULL_PHASE ' + phase + ' ' + Math.round(performance.now() - started) + 'ms');
    const harness = await pageHarness({ source: 'recipe', addQ09Candidate: true });
    mark('fixture-ready');
    expect(harness.catalogueSummary.referenceVarieties).toBeGreaterThanOrEqual(136);
    expect(harness.catalogueSummary.referenceKnowledge).toBeGreaterThanOrEqual(1779);
    expect(harness.catalogueSummary.contextVarieties).toBeGreaterThan(harness.catalogueSummary.referenceVarieties);
    const bundledLookup = await harness.catalogue.lookup('hopVariety', harness.catalogueSummary.firstReferenceVarietyName!);
    expect(bundledLookup.records.some(row => row.id === harness.catalogueSummary.firstReferenceVarietyId && row.origin === 'bundled')).toBe(true);
    const spies = spyPageAndAdviceBuilders();
    render(<HopV55Page services={harness.services} />);

    const originalArchive = await readQ09(harness);
    mark('active-reading');
    expect(originalArchive.source).toEqual({ kind: 'recipe', id: harness.context.recipe!.id });
    expect(originalArchive.reading.intent.question).toBe(q09Question);
    expect(originalArchive.scopeLedger.sourceScopes.map(row => row.kind)).toEqual(['employmentTiming', 'materialSelection']);
    const timingSource = originalArchive.scopeLedger.sourceScopes.find(row => row.kind === 'employmentTiming')!;
    const materialSource = originalArchive.scopeLedger.sourceScopes.find(row => row.kind === 'materialSelection')!;
    expect(timingSource.sourceSpan.text).toBe('Quand avec ma levure, utiliser au mieux mes houblons');
    expect(materialSource.sourceSpan.text).toBe('lesquels');
    expect(screen.getByText(timingSource.sourceSpan.text, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(materialSource.sourceSpan.text, { exact: true })).toBeInTheDocument();
    expect(spies.parser).not.toHaveBeenCalled();

    const retainedArchive = await retainQ09Scopes(harness, originalArchive);
    mark('scopes-retained');
    expect(retainedArchive.contentReference).not.toBe(originalArchive.contentReference);
    expect(retainedArchive.reading).toEqual(originalArchive.reading);
    expect(retainedArchive.scopeLedger.entries.slice(0, originalArchive.scopeLedger.entries.length))
      .toEqual(originalArchive.scopeLedger.entries);
    expect(retainedArchive.scopeLedger.entries.slice(-2).map(row => row.status)).toEqual(['retained', 'retained']);
    expect(spies.parser).not.toHaveBeenCalled();
    expect(screen.getByText('Aucune matière n’est incluse par défaut.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' })).toBeEnabled();

    if (!harness.candidate) throw new Error('La matière synthétique exacte doit avoir été chargée par le contexte fixture.');
    fireEvent.click(screen.getByRole('button', { name: /Explorer les fiches chargées/u }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans les fiches chargées' }),
      { target: { value: 'Houblon de comparaison Q09' } });
    const candidateCheck = screen.getByRole('checkbox', { name: /Houblon de comparaison Q09/u });
    expect(candidateCheck).not.toBeChecked();
    fireEvent.click(candidateCheck);
    expect(candidateCheck).toBeChecked();

    harness.failNextWorkspaceSave();
    const writesBeforePreparation = harness.save.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    await waitFor(() => expect(harness.save).toHaveBeenCalledTimes(writesBeforePreparation + 1), { timeout: 15000 });
    await screen.findByText('Échec transitoire du CAS workspace fixture.', {}, { timeout: 15000 });
    const failedWorkspace = await harness.stored();
    expect(failedWorkspace.qualifiedStudyPreparations).toBeUndefined();
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);
    expect(spies.parser).not.toHaveBeenCalled();
    const retryPreparation = screen.getByRole('button', { name: 'Réessayer la même demande' });
    await waitFor(() => expect(retryPreparation).toBeEnabled());
    fireEvent.click(retryPreparation);
    await screen.findByRole('heading', { name: 'Comparer les voies pour cette question' }, { timeout: 15000 });
    mark('study-visible-after-CAS-retry');

    const preparedWorkspace = harness.lastSaved();
    expect(preparedWorkspace.qualifiedStudyPreparations).toHaveLength(1);
    const preparation = latestAdvicePreparation(preparedWorkspace);
    const sourceArchive = activeArchive(preparedWorkspace);
    const expectedContext = { kind: 'recipe', recipeId: harness.context.recipe!.id,
      recipeReference: hopDecisionReference(harness.context.recipe) };
    expect(sourceArchive.contentReference).toBe(preparation.sourceReadingReference);
    expect(preparation).toMatchObject({ kind: 'advice', sourceReadingReference: retainedArchive.contentReference });
    if (preparation.createCommand.kind !== 'advice') throw new Error('Commande advice V3 attendue.');
    const study = preparation.createCommand.study;
    expect(study.requestSnapshot.intent).toEqual(sourceArchive.reading.response?.intent);
    expect(study.requestSnapshot.intent.originalQuestion).toBe(q09Question);
    expect(study.requestSnapshot.action.kind).toBe('exploreStrategies');
    if (study.requestSnapshot.action.kind !== 'exploreStrategies') throw new Error('Action exploreStrategies attendue.');
    const situation = study.requestSnapshot.action.situation;
    const sourceCurrent = harness.prepared.runtime.current;
    const baseSituation = buildHopV55DecisionSituation(sourceCurrent, sourceArchive.reading.criterionDrafts,
      hopV55DecisionReadingMaterialExclusions(sourceArchive.reading));
    expect(situation).toMatchObject({ ...baseSituation, materialIds: [harness.candidate.id] });
    expect(situation.program).toEqual(harness.prepared.runtime.current?.program);
    expect(situation.materialIds).toEqual([harness.candidate.id]);
    expect(study.context).toEqual(expectedContext);
    expect(study.responseSnapshot.result.options.length).toBeGreaterThan(0);
    const qualification = study.requestSnapshot.qualificationInput;
    const savedSource = qualification.assembly.sources.find(row => row.key === 'saved:caller');
    expect(savedSource).toMatchObject({ varieties: harness.catalogueSummary.contextVarieties, lots: 0 });
    expect(qualification.variants.length).toBeGreaterThan(162);
    expect(qualification.basisEvidence).toHaveLength(0);
    console.info('Q09_FULL_CATALOGUE_RESULT ' + JSON.stringify({
      referenceVarieties: harness.catalogueSummary.referenceVarieties,
      referenceKnowledge: harness.catalogueSummary.referenceKnowledge,
      fixtureVarieties: harness.catalogueSummary.fixtureVarieties,
      savedVarieties: savedSource?.varieties,
      assembledVariants: qualification.variants.length,
      basisEvidence: qualification.basisEvidence.length,
      oldDiagnostic: { sourceReadingReference: 'hop-v55-decision-reading-v3:sha256:02e43d3cef4bb942069fcbf094263396d5aa7a2798205251b5a07df8594551b2',
        assembledVariants: 162, savedVarieties: 4, savedLots: 0, basisEvidence: 0 },
      currentSourceReadingReference: retainedArchive.contentReference,
      candidateIds: situation.materialIds,
      studyReference: preparation.studyReference,
      optionCount: study.responseSnapshot.result.options.length,
    }));
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);
    expect(spies.parser).not.toHaveBeenCalled();
    expect(spies.propertyBuilder).not.toHaveBeenCalled();

    const createButtons = screen.getAllByRole('button', { name: 'Conserver cette étude de conseil' });
    expect(createButtons).toHaveLength(1);
    harness.qualifiedStudies.failCreateOnce = true;
    mark('before-create-button-wait');
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Conserver cette étude de conseil' })[0]).toBeEnabled());
    mark('create-button-enabled');
    fireEvent.click(screen.getAllByRole('button', { name: 'Conserver cette étude de conseil' })[0]);
    await screen.findByText('Échec transitoire du DAO advice fixture.', {}, { timeout: 15000 });
    mark('dao-retry-ready');
    expect(harness.qualifiedStudies.successfulCreates).toBe(0);
    const retryStudy = screen.getByRole('button', { name: 'Conserver cette étude de conseil' });
    mark('before-DAO-retry-button-wait');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Conserver cette étude de conseil' })).toBeEnabled());
    mark('DAO-retry-button-enabled');
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude de conseil' }));
    mark('dao-retry-clicked');
    await screen.findByText('Étude des emplois et matières conservée avec ses sources exactes.', {}, { timeout: 15000 });
    mark('study-saved-after-DAO-retry');
    expect(harness.qualifiedStudies.createCalls).toBe(2);
    expect(harness.qualifiedStudies.successfulCreates).toBe(1);
    expect(harness.qualifiedStudies.createInputs[0]).toEqual(harness.qualifiedStudies.createInputs[1]);
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);

    const linkedWorkspace = harness.lastSaved();
    const linkRead = readHopV55QualifiedStudyLink(linkedWorkspace.qualifiedStudyLinks?.[0]);
    expect(linkRead.status).toBe('available');
    if (linkRead.status !== 'available') throw new Error('Lien exact de l’étude Q09 attendu.');
    expect(linkRead.link).toMatchObject({ kind: 'advice', sourceReadingReference: retainedArchive.contentReference,
      preparationReference: preparation.reference, studyReference: preparation.studyReference });
    const option = study.responseSnapshot.result.options[0];
    mark('before-preference-choice');
    fireEvent.click(screen.getAllByRole('button', { name: 'Choisir cette voie' })[0]);
    mark('preference-choice-selected');
    fireEvent.change(screen.getByRole('textbox', { name: 'Pourquoi cette voie vous intéresse-t-elle ?' }),
      { target: { value: 'Je préfère conserver cette voie comme hypothèse de travail, sans dose ni changement du programme.' } });
    mark('before-preference-submit');
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette préférence' }));
    mark('preference-submit-clicked');
    await screen.findByText('Choix documentaire conservé dans l’étude exacte.', {}, { timeout: 15000 });
    mark('preference-appended');
    expect(spies.preferenceCapture).toHaveBeenCalledTimes(1);

    const preferredWorkspace = harness.lastSaved();
    expect(preferredWorkspace.qualifiedStudyPreferenceCommands).toHaveLength(1);
    const commandRead = readHopV55QualifiedStudyPreferenceCommand(preferredWorkspace.qualifiedStudyPreferenceCommands![0]);
    expect(commandRead.status).toBe('available');
    if (commandRead.status !== 'available') throw new Error('Commande de préférence exacte attendue.');
    expect(commandRead.command).toMatchObject({ sourceReadingReference: retainedArchive.contentReference,
      preparationReference: preparation.reference, dossierId: preparation.dossierId, studyReference: preparation.studyReference,
      event: { kind: 'strategyPreferred', payload: { optionId: option.id, optionReference: option.reference,
        reason: 'Je préfère conserver cette voie comme hypothèse de travail, sans dose ni changement du programme.' } } });
    const storedEvents = await harness.qualifiedStudies.readEvents(ownerKey, preparation.dossierId);
    expect(storedEvents.map(event => event.kind)).toEqual(['studySaved', 'strategyPreferred']);
    expect(storedEvents[1]).toMatchObject({ kind: 'strategyPreferred',
      payload: { studyReference: preparation.studyReference, optionId: option.id, optionReference: option.reference,
        reason: 'Je préfère conserver cette voie comme hypothèse de travail, sans dose ni changement du programme.' } });

    const writesBeforeHistoricalRead = harness.save.mock.calls.length;
    const createsBeforeHistoricalRead = harness.qualifiedStudies.createCalls;
    const appendsBeforeHistoricalRead = harness.qualifiedStudies.appendCalls;
    const parserCallsBeforeHistoricalRead = spies.parser.mock.calls.length;
    const propertyBuilderCallsBeforeHistoricalRead = spies.propertyBuilder.mock.calls.length;
    const adviceBuilderCallsBeforeHistoricalRead = spies.adviceBuilder.mock.calls.length;
    const preferenceCapturesBeforeHistoricalRead = spies.preferenceCapture.mock.calls.length;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(await screen.findByText(/Études produit et conseils qualifiés · 1/u));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette étude exacte' }));
    await screen.findByRole('heading', { name: 'Comparer les voies pour cette question' }, { timeout: 15000 });
    mark('history-reloaded');
    expect(screen.getByText('Étude archivée')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Historique de conservation'));
    fireEvent.click(screen.getByText(/Préférences de stratégie enregistrées · 1/u));
    expect(screen.getByText('Je préfère conserver cette voie comme hypothèse de travail, sans dose ni changement du programme.')).toBeInTheDocument();
    expect(spies.parser).toHaveBeenCalledTimes(parserCallsBeforeHistoricalRead);
    expect(spies.propertyBuilder).toHaveBeenCalledTimes(propertyBuilderCallsBeforeHistoricalRead);
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(adviceBuilderCallsBeforeHistoricalRead);
    expect(spies.preferenceCapture).toHaveBeenCalledTimes(preferenceCapturesBeforeHistoricalRead);
    expect(harness.save).toHaveBeenCalledTimes(writesBeforeHistoricalRead);
    expect(harness.qualifiedStudies.createCalls).toBe(createsBeforeHistoricalRead);
    expect(harness.qualifiedStudies.appendCalls).toBe(appendsBeforeHistoricalRead);
    expect(harness.lastSaved()).toEqual(preferredWorkspace);
    mark('complete');
  }, 60000);

});
