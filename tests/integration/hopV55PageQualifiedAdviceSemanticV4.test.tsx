import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import { applyHopAdviceEvent, createHopAdviceDossier, hopAdviceEventContentReference, readHopAdviceEvent,
  type CreateHopAdviceDossierInput, type HopAdviceDossierV3, type HopAdviceEventRead, type HopAdviceEventV3 } from '../../src/domain/hopDecision/adviceDossier';
import { hopDecisionReference } from '../../src/domain/hopDecision/measurements';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { buildHopV55DecisionSituation } from '../../src/services/hopV55/decision';
import * as decisionService from '../../src/services/hopV55/decision';
import { hopV55DecisionReadingMaterialExclusions } from '../../src/services/hopV55/decisionCorrection';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import * as qualifiedAdviceDomain from '../../src/domain/hopDecision/qualifiedAdvice';
import * as advicePreferenceAdapter from '../../src/domain/hopDecision/adviceProgramAdapter';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55DecisionReadingArchiveV4, readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchiveV4 } from '../../src/services/hopV55/decisionArchive';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55QualifiedStudyPreparationV2, readHopV55QualifiedStudyLink,
  readHopV55QualifiedStudyPreparation } from '../../src/services/hopV55/qualifiedStudyWorkspace';
import { HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V2_FORMAT } from '../../src/services/hopV55/qualifiedStudyPreparation';
import { readHopV55QualifiedStudyPreferenceCommand } from '../../src/services/hopV55/qualifiedStudyPreference';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';
import type { HopDecisionLocalRepository } from '../../src/services/hopDecisionLocalRepository';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import * as questionScopeReading from '../../src/services/hopV55/questionScopeReading';
import { reviseHopV55QuestionScopeLedgerV1 } from '../../src/services/hopV55/questionScopeReading';
import { projectHopV55SemanticDecisionV1 } from '../../src/services/hopV55/decisionSemanticProjection';

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
    if (!('kind' in input.study) || input.study.kind !== 'advice' || input.study.formatVersion !== 3) {
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
  const database = new MemoryWorkspaceDatabase();
  const rawRepository = createHopV55WorkspaceRepository({ ownerKey, database });
  await rawRepository.save(initial, null);
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

function activeArchive(workspace: HopV55Workspace): HopV55DecisionReadingArchiveV4 {
  const raw = workspace.decisionReadings?.at(-1);
  const read = raw && readHopV55DecisionReadingArchive(raw);
  if (!read || read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v4') {
    throw new Error('Archive V4 Q09 exacte attendue.');
  }
  return read.archive;
}

async function readQ09(harness: Awaited<ReturnType<typeof pageHarness>>) {
  fireEvent.change(await screen.findByRole('textbox', { name: 'Question au brasseur' }), { target: { value: q09Question } });
  fireEvent.click(screen.getByRole('button', { name: 'Lire ma question' }));
  await screen.findByTestId('hop-v55-semantic-scopes');
  await screen.findByRole('heading', { name: 'Choisir le contexte à examiner' });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' })).toBeEnabled());
  const workspace = await waitFor(async () => {
    const current = await harness.stored();
    expect(current.decisionReadings).toHaveLength(1);
    return current;
  });
  return activeArchive(workspace);
}

async function retainQ09Scopes(harness: Awaited<ReturnType<typeof pageHarness>>) {
  const archive = activeArchive(await harness.stored());
  if (!archive.scopeLedger) throw new Error('Ledger V4 Q09 exact attendu.');
  expect(archive.scopeLedger.sourceScopes).toHaveLength(2);
  const panel = screen.getByTestId('hop-v55-semantic-scopes');
  fireEvent.click(within(panel).getByText(/Portées de la question · V4 · 2/u));
  for (const scope of archive.scopeLedger.sourceScopes) {
    fireEvent.change(within(panel).getByRole('combobox', { name: `Disposition de ${scope.sourceSpan.text}` }), { target: { value: 'retained' } });
  }
  fireEvent.change(within(panel).getByRole('textbox', { name: 'Motif des dispositions V4' }), {
    target: { value: 'Conserver distinctement les questions de moment et de choix de matière.' },
  });
  fireEvent.click(within(panel).getByRole('button', { name: 'Conserver les dispositions V4' }));
  await waitFor(async () => expect((await harness.stored()).decisionReadings).toHaveLength(2));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' })).toBeEnabled());
  return activeArchive(await harness.stored());
}

function latestAdvicePreparation(workspace: HopV55Workspace) {
  const raw = workspace.qualifiedStudyPreparations?.at(-1);
  const read = raw && readHopV55QualifiedStudyPreparation(raw);
  if (!read || read.status !== 'available' || read.preparation.kind !== 'advice'
    || read.preparation.createCommand.kind !== 'advice') throw new Error('Préparation advice exacte attendue.');
  return read.preparation;
}

function spyPageAndAdviceBuilders() {
  const projectCoverage = questionScopeReading.projectHopV55QuestionScopeCoverageV1;
  const scopeCoverageCalls = { count: 0 };
  const scopeCoverageProjection = vi.spyOn(questionScopeReading, 'projectHopV55QuestionScopeCoverageV1').mockImplementation(input => {
    scopeCoverageCalls.count++;
    return projectCoverage(input);
  });
  return {
    parser: vi.spyOn(questionScopeReading, 'readHopV55QuestionSemanticWithScopesV1'),
    scopeCoverageProjection,
    scopeCoverageCalls,
    propertyBuilder: vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'),
    adviceBuilder: vi.spyOn(qualifiedAdviceDomain, 'answerQualifiedHopAdvice'),
    preferenceCapture: vi.spyOn(advicePreferenceAdapter, 'captureHopAdvicePreference'),
  };
}

describe('Page V5.5 — étude qualifiée depuis une lecture sémantique V4', () => {
  it('prépare et conserve Q09 avec les critères projetés, les portées et la source recette exacts, puis relit sans recalcul', async () => {
    const harness = await pageHarness({ source: 'recipe', addQ09Candidate: true });
    const spies = spyPageAndAdviceBuilders();
    render(<HopV55Page services={harness.services} />);
    const initial = await readQ09(harness);
    expect(initial.format).toBe('hop-v55-decision-reading-v4');
    expect(initial.reading.intent.question).toBe(q09Question);
    expect(initial.scopeLedger?.sourceScopes.map(row => row.kind)).toEqual(['employmentTiming', 'materialSelection']);
    const timing = initial.scopeLedger?.sourceScopes.find(row => row.kind === 'employmentTiming');
    expect(timing?.contextSpans.map(row => row.text)).toContain('avec ma levure');
    expect(spies.parser).toHaveBeenCalledTimes(1);

    const retained = await retainQ09Scopes(harness);
    expect(retained.contentReference).not.toBe(initial.contentReference);
    expect(retained.reading).toEqual(initial.reading);
    expect(retained.scopeLedger?.entries.slice(0, initial.scopeLedger!.entries.length)).toEqual(initial.scopeLedger!.entries);
    expect(retained.scopeLedger?.entries.slice(-2).map(row => row.status)).toEqual(['retained', 'retained']);
    expect(spies.parser).toHaveBeenCalledTimes(1);

    if (!harness.candidate) throw new Error('La matière synthétique exacte doit avoir été chargée par la fixture.');
    const controls = screen.getByRole('heading', { name: 'Choisir le contexte à examiner' }).closest('.hv-qualified-advice-prepare') as HTMLElement | null;
    if (!controls) throw new Error('Contrôle de préparation qualifiée absent.');
    fireEvent.click(within(controls).getByText(/Critères, faits et exclusions repris/u));
    const semanticEvidence = within(controls).getByRole('region', { name: 'Annotations sémantiques V4 de la lecture' });
    for (const annotation of retained.reading.annotations) {
      expect(semanticEvidence).toHaveTextContent(annotation.term);
      expect(semanticEvidence).toHaveTextContent(annotation.source.text);
    }
    const scopeEvidence = within(controls).getByRole('region', { name: 'Portées V4 de la lecture' });
    expect(scopeEvidence).toHaveTextContent(retained.scopeLedger!.reference);
    expect(scopeEvidence).toHaveTextContent('retenue');

    fireEvent.click(within(controls).getByRole('button', { name: /Explorer les fiches chargées/u }));
    fireEvent.change(within(controls).getByRole('searchbox', { name: 'Rechercher dans les fiches chargées' }), {
      target: { value: 'Houblon de comparaison Q09' },
    });
    const candidateCheckbox = within(controls).getByRole('checkbox', {
      name: `Inclure Houblon de comparaison Q09 · ID exact ${harness.candidate.id}`,
    });
    fireEvent.click(candidateCheckbox);
    expect(candidateCheckbox).toBeChecked();
    await waitFor(() => expect(within(controls).getByRole('button', { name: 'Préparer l’étude qualifiée' })).toBeEnabled());

    harness.failNextWorkspaceSave();
    const writesBeforePreparation = harness.save.mock.calls.length;
    fireEvent.click(within(controls).getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    const preparationError = await within(controls).findByRole('alert', {}, { timeout: 15000 });
    expect(preparationError.textContent).toBe('Échec transitoire du CAS workspace fixture.');
    await waitFor(() => expect(harness.save).toHaveBeenCalledTimes(writesBeforePreparation + 1), { timeout: 15000 });
    expect((await harness.stored()).qualifiedStudyPreparations).toBeUndefined();
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);
    fireEvent.click(within(controls).getByRole('button', { name: 'Réessayer la même demande' }));
    await screen.findByRole('heading', { name: 'Comparer les voies pour cette question' }, { timeout: 15000 });

    const preparedWorkspace = await harness.stored();
    const preparation = latestAdvicePreparation(preparedWorkspace);
    expect(preparation).toMatchObject({ format: 'hop-v55-qualified-study-preparation-v2', kind: 'advice',
      sourceReadingReference: retained.contentReference, scopeLedgerReference: retained.scopeLedger?.reference });
    if (preparation.format !== 'hop-v55-qualified-study-preparation-v2') throw new Error('Wrapper workspace V2 exact attendu.');
    expect(preparation.qualifiedPreparation).toMatchObject({ sourceRuntimeReference: retained.runtimeReference,
      scopeLedgerReference: retained.scopeLedger?.reference, scopeCoverage: preparation.scopeCoverage });
    const embeddedLegacyPreparation = preparation.qualifiedPreparation.preparation;
    const legacyRead = readHopV55QualifiedStudyPreparation(embeddedLegacyPreparation);
    expect(embeddedLegacyPreparation.format).toBe('hop-v55-qualified-study-preparation-v1');
    expect(legacyRead).toMatchObject({ status: 'available', preparation: embeddedLegacyPreparation });
    if (preparation.createCommand.kind !== 'advice') throw new Error('Commande advice V3 attendue.');
    const study = preparation.createCommand.study;
    expect(study.requestSnapshot.intent).toEqual(retained.reading.response?.intent);
    expect(study.requestSnapshot.intent.originalQuestion).toBe(q09Question);
    expect(study.requestSnapshot.action.kind).toBe('exploreStrategies');
    if (study.requestSnapshot.action.kind !== 'exploreStrategies') throw new Error('Action exploreStrategies attendue.');
    const semanticDrafts = projectHopV55SemanticDecisionV1(retained.reading.annotations).drafts;
    const expectedSituation = buildHopV55DecisionSituation(harness.prepared.runtime.current, semanticDrafts,
      hopV55DecisionReadingMaterialExclusions({ response: retained.reading.response }));
    expect(study.requestSnapshot.action.situation).toMatchObject({ ...expectedSituation,
      materialIds: [harness.candidate.id], program: harness.prepared.runtime.current?.program });
    expect(study.context).toMatchObject({ kind: 'recipe', recipeId: harness.context.recipe!.id,
      recipeReference: hopDecisionReference(harness.context.recipe) });
    if (!('scopeCoverage' in preparation)) throw new Error('Couverture des portées V4 attendue dans la préparation.');
    const scopeCoverage = preparation.scopeCoverage;
    expect(scopeCoverage.map(row => row.scopeId).sort())
      .toEqual(retained.scopeLedger!.sourceScopes.map(row => row.id).sort());
    expect(scopeCoverage.every(row => row.disposition === 'retained')).toBe(true);
    expect(spies.scopeCoverageCalls.count).toBe(1);

    const changedCoverage = structuredClone(preparation);
    changedCoverage.scopeCoverage[0].reason += ' altérée';
    expect(() => readHopV55QualifiedStudyPreparation(changedCoverage)).toThrow(/diverge de sa couverture/u);
    const changedRuntime = structuredClone(preparation);
    changedRuntime.qualifiedPreparation.sourceRuntimeReference += ':changed';
    expect(() => readHopV55QualifiedStudyPreparation(changedRuntime)).toThrow(/références ou de la commande/u);
    const changedLedger = structuredClone(preparation);
    changedLedger.scopeLedgerReference += ':changed';
    expect(() => readHopV55QualifiedStudyPreparation(changedLedger)).toThrow(/références ou de la commande/u);
    const future = { format: 'hop-v55-qualified-study-preparation-v3', raw: 'future fixture' };
    const futureRead = readHopV55QualifiedStudyPreparation(future);
    expect(futureRead).toMatchObject({ status: 'unsupportedReadOnly', snapshot: future });
    const sealQualifiedV2 = (draft: typeof preparation.qualifiedPreparation) => {
      const { reference: _reference, ...body } = draft;
      return { ...body, reference: hopAdviceContentReference(HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V2_FORMAT, body) };
    };
    const internallyConsistentWrongLedger = createHopV55QualifiedStudyPreparationV2({
      qualifiedPreparation: sealQualifiedV2({ ...structuredClone(preparation.qualifiedPreparation),
        scopeLedgerReference: `${preparation.scopeLedgerReference}:other` }),
    });
    await expect(harness.rawRepository.save({ ...preparedWorkspace,
      qualifiedStudyPreparations: [internallyConsistentWrongLedger] }, preparedWorkspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const internallyConsistentWrongRuntime = createHopV55QualifiedStudyPreparationV2({
      qualifiedPreparation: sealQualifiedV2({ ...structuredClone(preparation.qualifiedPreparation),
        sourceRuntimeReference: `${retained.runtimeReference}:other` }),
    });
    await expect(harness.rawRepository.save({ ...preparedWorkspace,
      qualifiedStudyPreparations: [internallyConsistentWrongRuntime] }, preparedWorkspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);
    expect(spies.parser).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette étude de conseil' }));
    await screen.findByText('Étude des emplois et matières conservée avec ses sources exactes.', {}, { timeout: 15000 });
    const linkedWorkspace = await harness.stored();
    const linkRead = readHopV55QualifiedStudyLink(linkedWorkspace.qualifiedStudyLinks?.[0]);
    expect(linkRead.status).toBe('available');
    if (linkRead.status !== 'available') throw new Error('Lien exact de l’étude V4 attendu.');
    expect(linkRead.link).toMatchObject({ sourceReadingReference: retained.contentReference,
      preparationReference: preparation.reference, studyReference: preparation.studyReference });
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(1);

    const workspaceBeforeHistory = await harness.stored();
    const parserCalls = spies.parser.mock.calls.length;
    const adviceCalls = spies.adviceBuilder.mock.calls.length;
    const coverageCalls = spies.scopeCoverageCalls.count;
    const createCalls = harness.qualifiedStudies.createCalls;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique' }));
    fireEvent.click(await screen.findByText(/Études produit et conseils qualifiés · 1/u));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette étude exacte' }));
    await screen.findByRole('heading', { name: 'Comparer les voies pour cette question' }, { timeout: 15000 });
    expect(screen.getByText('Étude archivée')).toBeInTheDocument();
    const archivedCoverage = await screen.findByRole('region', { name: 'Couverture archivée de cette étude' });
    expect(archivedCoverage).toHaveTextContent('Quand avec ma levure, utiliser au mieux mes houblons');
    expect(archivedCoverage).toHaveTextContent('lesquels');
    expect(spies.parser).toHaveBeenCalledTimes(parserCalls);
    expect(spies.adviceBuilder).toHaveBeenCalledTimes(adviceCalls);
    expect(spies.scopeCoverageCalls.count).toBe(coverageCalls);
    expect(harness.qualifiedStudies.createCalls).toBe(createCalls);
    expect(await harness.stored()).toEqual(workspaceBeforeHistory);
  }, 60000);

  it.each([
    ['source', 'La recette exacte de cette étude n’est plus disponible'],
    ['ledger', 'Une disposition de portée a été archivée après cette lecture'],
    ['runtime', 'La référence runtime archivée diffère du runtime courant'],
  ] as const)('refuse une préparation V4 quand la %s a changé avant la confirmation', async (stalePart, expectedError) => {
    const harness = await pageHarness({ source: 'recipe' });
    const spies = spyPageAndAdviceBuilders();
    render(<HopV55Page services={harness.services} />);
    await readQ09(harness);
    const active = activeArchive(await harness.stored());

    if (stalePart === 'source') {
      harness.context.recipe!.id = 'recipe:changed-outside-page';
    } else if (stalePart === 'runtime') {
      harness.context.recipe!.volumeL += 1;
    } else {
      const current = await harness.stored();
      if (!active.scopeLedger) throw new Error('Ledger V4 de la lecture Q09 attendu.');
      const scope = active.scopeLedger.sourceScopes[0];
      const transition = { actId: 'external-ledger-change', kind: 'reviseScopes' as const,
        parentReadingReference: active.contentReference, reason: 'Disposition concurrente pour le témoin.',
        recordedAt: '2026-10-04T09:00:00.000Z', actor: { origin: 'user' as const, label: 'Brasseur fixture' } };
      const scopeLedger = reviseHopV55QuestionScopeLedgerV1({ ledger: active.scopeLedger, question: q09Question,
        reading: active.reading, transition, expectedParentReadingReference: active.contentReference,
        actions: [{ scopeId: scope.id, status: 'retained', activeScope: structuredClone(scope), reason: transition.reason }] });
      const child = createHopV55DecisionReadingArchiveV4({ id: 'reading:q09-concurrent-scope', ownerKey, workspaceId: current.id,
        recordedAt: transition.recordedAt, reading: active.reading, source: active.source, runtimeReference: active.runtimeReference,
        scopeLedger, transition });
      await harness.rawRepository.save({ ...current, decisionReadings: [...(current.decisionReadings ?? []), child] }, current.revision);
    }

    fireEvent.click(screen.getByRole('button', { name: 'Préparer l’étude qualifiée' }));
    await waitFor(() => expect(screen.getByTestId('hop-v55').textContent).toContain(expectedError), { timeout: 15000 });
    expect(spies.adviceBuilder).not.toHaveBeenCalled();
    expect((await harness.stored()).qualifiedStudyPreparations).toBeUndefined();
  }, 45000);
});

