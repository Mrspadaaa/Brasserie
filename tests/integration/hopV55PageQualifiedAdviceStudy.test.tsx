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
import * as advicePreferenceAdapter from '../../src/domain/hopDecision/adviceProgramAdapter';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55DecisionReadingArchiveV3, readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchiveV3 } from '../../src/services/hopV55/decisionArchive';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1 } from '../../src/services/hopV55/questionScopeReading';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { readHopV55QualifiedStudyLink, readHopV55QualifiedStudyPreparation } from '../../src/services/hopV55/qualifiedStudyWorkspace';
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
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
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
    if (input.study.formatVersion !== 3 || input.study.kind !== 'advice') {
      throw new Error('Cette fixture mémoire accepte uniquement une étude de conseil V3 réelle.');
    }
    const command = structuredClone(input as CreateHopAdviceDossierInput);
    this.createInputs.push(command);
    if (this.failCreateOnce) { this.failCreateOnce = false; throw new Error('Échec transitoire du DAO advice fixture.'); }
    const key = this.key(command.ownerKey, command.dossierId);
    const existing = this.dossiers.get(key);
    const firstEvent = this.events.get(key)?.[0];
    if (existing && firstEvent) return { status: 'duplicate' as const, dossier: structuredClone(existing), event: structuredClone(firstEvent) };
    const created = createHopAdviceDossier(command);
    this.dossiers.set(key, structuredClone(created.dossier));
    this.events.set(key, [structuredClone(created.event)]);
    this.successfulCreates++;
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
    const value = this.dossiers.get(this.key(owner, dossierId));
    return value ? structuredClone(value) : null;
  }
  async list(owner: string) {
    return [...this.dossiers.values()].filter(row => row.ownerKey === owner).map(row => structuredClone(row));
  }
  async readEvents(owner: string, dossierId: string): Promise<HopAdviceEventRead[]> {
    return structuredClone(this.events.get(this.key(owner, dossierId)) ?? []);
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
  if (options.addQ09Candidate) context.hopIndex?.varieties.push(q09CandidateVariety());
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
  const save = vi.fn(async (next: HopV55Workspace, expectedRevision: number | null) => {
    if (failWorkspaceSaveOnce) {
      failWorkspaceSaveOnce = false;
      throw new Error('Échec transitoire du CAS workspace fixture.');
    }
    return rawRepository.save(next, expectedRevision);
  });
  const workspaceRepository = {
    list: rawRepository.list,
    read: rawRepository.read,
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
    catalogue: { scope: 'fixture', lookup: vi.fn(async () => ({ records: [], truncated: false })),
      write: vi.fn(async () => { throw new Error('Aucune écriture catalogue dans cette fixture.'); }) },
    qualifiedStudies,
    close: vi.fn(),
  } as unknown as HopV55Services;
  return {
    source, context, prepared, workspaceId, services, rawRepository, save, qualifiedStudies,
    candidate: prepared.runtime.materials.find(material => material.id === q09CandidateId),
    failNextWorkspaceSave() { failWorkspaceSaveOnce = true; },
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
  await waitFor(async () => expect((await harness.stored()).decisionReadings).toHaveLength(2));
  await screen.findByRole('heading', { name: 'Portées de la question' });
  await screen.findByRole('heading', { name: 'Choisir le contexte à examiner' });
  const workspace = await waitFor(async () => {
    const current = await harness.stored();
    expect(current.decisionReadings).toHaveLength(2);
    return current;
  });
  return activeArchive(workspace);
}

async function retainQ09Scopes(harness: Awaited<ReturnType<typeof pageHarness>>) {
  const archive = activeArchive(await harness.stored());
  expect(archive.scopeLedger.sourceScopes).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Garder la portée «Quand l’employer»' }));
  fireEvent.click(screen.getByRole('button', { name: 'Garder la portée «Quelles matières examiner»' }));
  fireEvent.change(screen.getByLabelText('Motif de la disposition'), {
    target: { value: 'Conserver distinctement les questions de moment et de choix de matière.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));
  await waitFor(async () => expect((await harness.stored()).decisionReadings).toHaveLength(3));
  return activeArchive(await harness.stored());
}

function latestAdvicePreparation(workspace: HopV55Workspace) {
  const raw = workspace.qualifiedStudyPreparations?.at(-1);
  const read = raw && readHopV55QualifiedStudyPreparation(raw);
  if (!read || read.status !== 'available' || read.preparation.kind !== 'advice'
    || read.preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice V3 exacte attendue.');
  return read.preparation;
}

function spyPageAndAdviceBuilders() {
  return {
    parser: vi.spyOn(decisionService, 'readHopV55Question'),
    propertyBuilder: vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'),
    adviceBuilder: vi.spyOn(qualifiedAdviceDomain, 'answerQualifiedHopAdvice'),
    preferenceCapture: vi.spyOn(advicePreferenceAdapter, 'captureHopAdvicePreference'),
  };
}

describe('Page V5.5 — étude qualifiée Q09 avec portées V3', () => {
  it('garde les deux portées, sélectionne un ID chargé, reprend le CAS, sauve l’étude et la préférence, puis relit sans recalcul', async () => {
    const harness = await pageHarness({ source: 'recipe', addQ09Candidate: true });
    const spies = spyPageAndAdviceBuilders();
    render(<HopV55Page services={harness.services} />);

    const originalArchive = await readQ09(harness);
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

    const retainedArchive = await retainQ09Scopes(harness);
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

    const preparedWorkspace = await harness.stored();
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
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);
    expect(spies.parser).not.toHaveBeenCalled();
    expect(spies.propertyBuilder).not.toHaveBeenCalled();

    const createButtons = screen.getAllByRole('button', { name: 'Conserver cette étude de conseil' });
    expect(createButtons).toHaveLength(1);
    harness.qualifiedStudies.failCreateOnce = true;
    await waitFor(() => expect(createButtons[0]).toBeEnabled());
    fireEvent.click(createButtons[0]);
    await screen.findByText('Échec transitoire du DAO advice fixture.', {}, { timeout: 15000 });
    expect(harness.qualifiedStudies.successfulCreates).toBe(0);
    const retryStudy = screen.getByRole('button', { name: 'Conserver cette étude de conseil' });
    await waitFor(() => expect(retryStudy).toBeEnabled());
    fireEvent.click(retryStudy);
    await screen.findByText('Étude des emplois et matières conservée avec ses sources exactes.', {}, { timeout: 15000 });
    expect(harness.qualifiedStudies.createCalls).toBe(2);
    expect(harness.qualifiedStudies.successfulCreates).toBe(1);
    expect(harness.qualifiedStudies.createInputs[0]).toEqual(harness.qualifiedStudies.createInputs[1]);
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);

    const linkedWorkspace = await harness.stored();
    const linkRead = readHopV55QualifiedStudyLink(linkedWorkspace.qualifiedStudyLinks?.[0]);
    expect(linkRead.status).toBe('available');
    if (linkRead.status !== 'available') throw new Error('Lien exact de l’étude Q09 attendu.');
    expect(linkRead.link).toMatchObject({ kind: 'advice', sourceReadingReference: retainedArchive.contentReference,
      preparationReference: preparation.reference, studyReference: preparation.studyReference });
    const option = study.responseSnapshot.result.options[0];
    fireEvent.click(screen.getAllByRole('button', { name: 'Choisir cette voie' })[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Pourquoi cette voie vous intéresse-t-elle ?' }),
      { target: { value: 'Je préfère conserver cette voie comme hypothèse de travail, sans dose ni changement du programme.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette préférence' }));
    await screen.findByText('Choix documentaire conservé dans l’étude exacte.', {}, { timeout: 15000 });
    expect(spies.preferenceCapture).toHaveBeenCalledTimes(1);

    const preferredWorkspace = await harness.stored();
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
    expect(await harness.stored()).toEqual(preferredWorkspace);
  }, 60000);

  it('ne propose pas d’étude lorsque les deux portées Q09 sont explicitement écartées', async () => {
    const harness = await pageHarness({ source: 'recipe' });
    const spies = spyPageAndAdviceBuilders();
    render(<HopV55Page services={harness.services} />);
    const initial = await readQ09(harness);
    expect(initial.scopeLedger.sourceScopes).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Écarter la portée «Quelles matières examiner»' }));
    fireEvent.change(screen.getByLabelText('Motif de la disposition'), { target: { value: 'Écarter ce périmètre de sélection.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));
    await waitFor(async () => expect((await harness.stored()).decisionReadings).toHaveLength(3));

    fireEvent.click(screen.getByRole('button', { name: 'Écarter la portée «Quand l’employer»' }));
    fireEvent.change(screen.getByLabelText('Motif de la disposition'), { target: { value: 'Écarter aussi la question de moment.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les dispositions' }));
    await waitFor(async () => expect((await harness.stored()).decisionReadings).toHaveLength(4));

    const current = activeArchive(await harness.stored());
    expect(current.scopeLedger.sourceScopes).toHaveLength(2);
    expect(current.scopeLedger.entries.at(-2)?.status).toBe('excluded');
    expect(current.scopeLedger.entries.at(-1)?.status).toBe('excluded');
    expect(screen.queryByRole('button', { name: 'Préparer l’étude qualifiée' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Choisir le contexte à examiner' })).not.toBeInTheDocument();
    expect((await harness.stored()).qualifiedStudyPreparations).toBeUndefined();
    expect(spies.adviceBuilder).not.toHaveBeenCalled();
  }, 30000);

  it('exige un stade et un motif pour la source exploration et relit ces valeurs sans reparsing', async () => {
    const harness = await pageHarness({ source: 'exploration' });
    const spies = spyPageAndAdviceBuilders();
    render(<HopV55Page services={harness.services} />);
    const archive = await readQ09(harness);
    expect(archive.source).toEqual({ kind: 'exploration' });
    expect(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Stade envisagé pour cette étude' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Stade envisagé pour cette étude' }),
      { target: { value: 'conditioning' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif du stade futur' }),
      { target: { value: 'Comparer explicitement une future période de garde; ce n’est pas un fait du brassin.' } });
    expect(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    await screen.findByRole('heading', { name: 'Comparer les voies pour cette question' }, { timeout: 15000 });

    const preparedWorkspace = await harness.stored();
    const preparation = latestAdvicePreparation(preparedWorkspace);
    expect(preparation.advicePreparationContext?.explicitFutureStage).toEqual({ kind: 'futureExploration',
      stage: 'conditioning', basis: 'Comparer explicitement une future période de garde; ce n’est pas un fait du brassin.' });
    if (preparation.createCommand.kind !== 'advice') throw new Error('Commande advice attendue.');
    const situation = preparation.createCommand.study.requestSnapshot.action.situation;
    expect(situation).toMatchObject({ stage: 'conditioning', program: null, materialIds: [] });
    expect(preparation.createCommand.study.context).toBeNull();
    expect(preparation.createCommand.study.requestSnapshot.intent.originalQuestion).toBe(q09Question);
    expect(spies.parser).not.toHaveBeenCalled();
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);

    const writesBeforeReload = harness.save.mock.calls.length;
    const parserCallsBeforeReload = spies.parser.mock.calls.length;
    const propertyBuilderCallsBeforeReload = spies.propertyBuilder.mock.calls.length;
    const adviceBuilderCallsBeforeReload = spies.adviceBuilder.mock.calls.length;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique', exact: true }));
    fireEvent.click(await screen.findByText(/Études produit et conseils qualifiés · 1/u));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette étude exacte' }));
    await screen.findByRole('heading', { name: 'Comparer les voies pour cette question' }, { timeout: 15000 });
    expect(spies.parser).toHaveBeenCalledTimes(parserCallsBeforeReload);
    expect(spies.propertyBuilder).toHaveBeenCalledTimes(propertyBuilderCallsBeforeReload);
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(adviceBuilderCallsBeforeReload);
    expect(harness.save).toHaveBeenCalledTimes(writesBeforeReload);
    const reopened = latestAdvicePreparation(await harness.stored());
    expect(reopened.reference).toBe(preparation.reference);
    expect(reopened.advicePreparationContext?.explicitFutureStage).toEqual(preparation.advicePreparationContext?.explicitFutureStage);
    expect(reopened.createCommand.kind === 'advice' && reopened.createCommand.study.requestSnapshot.action.situation.stage)
      .toBe('conditioning');
  }, 45000);

  it('garde le stade exact du batch sans guide et ne le renomme pas en planning ou exploration future', async () => {
    const harness = await pageHarness({ source: 'batch' });
    const spies = spyPageAndAdviceBuilders();
    if (!harness.context.batch || !harness.prepared.runtime.current?.program) throw new Error('Programme de batch fixture attendu.');
    expect(harness.context.batch.recipeSnapshot?.styleRef).toBeUndefined();
    expect(harness.prepared.runtime.current.program.stage).toBe('fermenting');
    render(<HopV55Page services={harness.services} />);
    const archive = await readQ09(harness);
    expect(archive.source).toEqual({ kind: 'batch', id: harness.context.batch.id });
    if (!screen.queryByText('Stade réel du brassin')) {
      throw new Error('Bloc de stade réel absent pour le batch. ' + JSON.stringify({
        notices: [...document.querySelectorAll('.hv-property-context-notice')].map(row => row.textContent),
        alerts: screen.queryAllByRole('alert').map(row => row.textContent),
        statuses: screen.queryAllByRole('status').map(row => row.textContent),
        headings: [...document.querySelectorAll('h2,h3')].map(row => row.textContent),
        batchStatus: harness.context.batch.status,
        preparedStage: harness.prepared.runtime.current?.program?.stage ?? null,
        journalRevision: harness.context.journal?.revision ?? null,
        brewDayRevision: harness.context.batch.brewDay?.revision ?? null,
      }));
    }
    expect(screen.getByText('Stade réel du brassin')).toBeInTheDocument();
    expect(screen.getByText('Fermentation')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Stade envisagé pour cette étude' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    await screen.findByRole('heading', { name: 'Comparer les voies pour cette question' }, { timeout: 15000 });

    const preparation = latestAdvicePreparation(await harness.stored());
    expect(preparation.explicitFutureStage).toBeUndefined();
    expect(preparation.advicePreparationContext?.explicitFutureStage).toBeUndefined();
    if (preparation.createCommand.kind !== 'advice') throw new Error('Commande advice de batch attendue.');
    expect(preparation.createCommand.study.requestSnapshot.action.situation).toMatchObject({
      stage: 'fermenting', program: harness.prepared.runtime.current.program, materialIds: [],
    });
    expect(preparation.createCommand.study.context).toMatchObject({ kind: 'batch', batchId: harness.context.batch.id,
      brewDayRevision: 11, recipeSnapshotReference: hopDecisionReference(harness.context.batch.recipeSnapshot),
      programFingerprint: programFingerprint(harness.prepared.runtime.current.program), stage: 'fermenting' });
    expect(preparation.createCommand.study.requestSnapshot.intent.originalQuestion).toBe(q09Question);
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);
  }, 45000);
});
