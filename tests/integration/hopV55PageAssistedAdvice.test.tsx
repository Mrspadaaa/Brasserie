import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerChatInput, BrewerTurn } from '../../functions/src/companionTypes';
import { createBrewerHopAdviceProposalEnvelope } from '../../functions/src/brewerHopAdviceProposal';
import { projectBrewerHopAdviceToolDependencies } from '../../functions/src/brewerHopAdviceContextBinding';
import { HOP_ADVICE_PROTOCOL_V1 } from '../../functions/src/brewerHopAdviceTransportV1';
import type { HopV55Services, HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { ensureHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createHopV55AssistedAdviceBackendContractV1, createHopV55AssistedAdviceWorkspaceClient } from '../../src/services/hopV55/assistedAdviceWorkspace';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV3,
  readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1 } from '../../src/services/hopV55/questionScopeReading';
import { readHopV55DocumentaryAnswerRecord } from '../../src/services/hopV55/documentaryRecords';
import type { HopV55AssistedAdviceTicketV1 } from '../../src/services/hopV55/assistedAdviceController';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import * as decisionModule from '../../src/services/hopV55/decision';
import * as adviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import type { HopV55AssistedCompanionSession } from '../../src/ui/hopV55/assistedAdviceUiContracts';
import { createHopV55FixtureServices } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55AssistedAdviceFixtureRuntime } from '../../src/services/hopV55/assistedAdviceFixtureRuntime';
import type { HopV55FixtureCatalogueDatabaseAdapter } from '../../src/services/hopV55/fixtureRuntime';
import type { BrewingScenarioLocalDatabaseAdapter } from '../../src/services/brewingScenarioLocalRepository';
import type { ClientBrewerJob } from '../../src/services/brewerJobs';
import type { HopV55AssistedCompanionTurn } from '../../src/ui/hopV55/assistedAdviceUiContracts';

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

function ColdFixtureHarness({ namespace, onReady, onSession }: {
  namespace: string;
  onReady(services: HopV55Services, runtime: ReturnType<typeof createHopV55AssistedAdviceFixtureRuntime>): void;
  onSession(session: HopV55AssistedCompanionSession): void;
}) {
  const runtime = React.useMemo(() => createHopV55AssistedAdviceFixtureRuntime({ namespace, delay: 'manual' }), [namespace]);
  const [services, setServices] = React.useState<HopV55Services>();
  React.useEffect(() => {
    let cancelled = false;
    let created: HopV55Services | undefined;
    void (async () => {
      created = createHopV55FixtureServices(namespace, { mode: 'planning', workspaceDatabase: new MemoryWorkspaceDatabase(),
        scenarioDatabase: new MemoryScenarioDatabase() as unknown as BrewingScenarioLocalDatabaseAdapter,
        catalogueDatabase: new MemoryCatalogueDatabase() as unknown as HopV55FixtureCatalogueDatabaseAdapter });
      const context = await created.loadContext();
      const prepared = prepareBrewingScenarioContext(context);
      const sourceWorkspaceId = `workspace:${namespace}`;
      const seeded = [questionA, questionB].map((question, index) => seedHistoricalArchive({ question,
        ownerKey: created!.ownerKey, workspaceId: sourceWorkspaceId, context, prepared,
        id: `reading:assisted-cold-seed:${index}` }));
      const initial = ensureHopV55ReferenceJournal({ format: 'hop-v55-workspace-v1', id: sourceWorkspaceId,
        ownerKey: created.ownerKey, revision: 0, title: 'Brassin synthétique · lecture assistée historique',
        intent: seeded[0].reading.intent, sourceRecipeId: context.recipe?.id,
        decisionReadings: seeded.map(row => row.archive), scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: createdAt,
      }, context, prepared);
      await created.workspaces.save(initial, null);
      if (cancelled) created.close(); else { setServices(created); onReady(created, runtime); }
    })().catch(error => { if (!cancelled) throw error; });
    return () => { cancelled = true; created?.close(); };
  }, [namespace, onReady, runtime]);
  const open = (source: HopV55AssistedCompanionSession) => {
    runtime.setSession(source);
    onSession(source);
  };
  return <>
    {services ? <HopV55Page services={services} onOpenAssistedCompanion={open} /> : <p role="status">Préparation fixture runtime…</p>}
    <button type="button" onClick={() => void runtime.releaseNext()}>Libérer la réponse froide fixture</button>
  </>;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ownerKey = 'fixture:assisted-page-owner';
const workspaceId = 'workspace:assisted-page-A';
const questionA = 'Je veux plus de poire et plus de floral. Quand utiliser mes houblons et lesquels pour cette bière d’été ?';
const questionB = 'Je veux mieux comprendre le caractère épicé de cette bière sans modifier son amertume.';
const createdAt = '2026-10-04T11:00:00.000Z';

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
    const operation = this.tail.then(work);
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Fixture database only. */ }
}

class MemoryRowTable<Row extends Record<string, unknown>> {
  readonly rows = new Map<string, Row>();
  private key(value: unknown): string {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (!value || typeof value !== 'object') return String(value);
    const row = value as Record<string, unknown>;
    if (row.ownerKey && row.scenarioId) return JSON.stringify([row.ownerKey, row.scenarioId]);
    if (row.ownerKey && row.eventId) return JSON.stringify([row.ownerKey, row.eventId]);
    if (row.operationId) return String(row.operationId);
    if (row.id) return String(row.id);
    return JSON.stringify(value);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: Row) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: Row) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => row[index] === key).map(row => structuredClone(row)) }) }; }
}

class MemoryScenarioDatabase {
  readonly dossiers = new MemoryRowTable<Record<string, unknown>>();
  readonly events = new MemoryRowTable<Record<string, unknown>>();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(work);
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Fixture memory adapter. */ }
}

class MemoryCatalogueDatabase {
  readonly recordRows = new Map<string, Record<string, unknown>>();
  readonly operationRows = new Map<string, Record<string, unknown>>();
  readonly records = {
    get: async (key: unknown) => { const row = this.recordRows.get(JSON.stringify(key)); return row && structuredClone(row); },
    add: async (row: Record<string, unknown>) => { const key = JSON.stringify([row.kind, row.id]);
      if (this.recordRows.has(key)) throw new Error('ConstraintError'); this.recordRows.set(key, structuredClone(row)); },
    put: async (row: Record<string, unknown>) => { this.recordRows.set(JSON.stringify([row.kind, row.id]), structuredClone(row)); },
    toArray: async () => [...this.recordRows.values()].map(row => structuredClone(row)),
  };
  readonly operations = {
    get: async (key: unknown) => { const row = this.operationRows.get(String(key)); return row && structuredClone(row); },
    add: async (row: Record<string, unknown>) => { const key = String(row.operationId);
      if (this.operationRows.has(key)) throw new Error('ConstraintError'); this.operationRows.set(key, structuredClone(row)); },
  };
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(work);
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Fixture memory adapter. */ }
}

function seedHistoricalArchive(input: { question: string; ownerKey: string; workspaceId: string; context: ReturnType<typeof makeHopV55FixtureContext>;
  prepared: ReturnType<typeof prepareBrewingScenarioContext>; id: string }) {
  const seeded = readHopV55QuestionWithScopesV1(input.question, input.prepared);
  const scopeTransition = { actId: `scope:create:${input.id}`, kind: 'create' as const,
    reason: 'Portées initiales de la fixture V3 archivées.', recordedAt: createdAt,
    actor: { origin: 'proposal' as const, label: 'Lecture proposée' } };
  const sourceRecipeId = input.context.recipe?.id;
  if (!sourceRecipeId) throw new Error('Archive V3 de fixture exige une recette source exacte.');
  if (!seeded.scopeDrafts.length) {
    const reading = decisionModule.readHopV55Question(input.question, input.prepared);
    const archive = createHopV55DecisionReadingArchiveV2({ id: input.id, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
      recordedAt: createdAt, reading, source: { kind: 'recipe', id: sourceRecipeId },
      runtimeReference: hopV55ScenarioRuntimeReference(input.prepared.runtime) });
    return { archive, reading };
  }
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question: input.question,
    reading: seeded.reading, scopeDrafts: seeded.scopeDrafts, transition: scopeTransition });
  const archive = createHopV55DecisionReadingArchiveV3({ id: input.id, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    recordedAt: createdAt, reading: seeded.reading, source: { kind: 'recipe', id: sourceRecipeId },
    runtimeReference: hopV55ScenarioRuntimeReference(input.prepared.runtime), transition: scopeTransition, scopeLedger });
  return { archive, reading: seeded.reading };
}

async function pageHarness(options: { seedQuestion?: string; additionalSeedQuestions?: string[]; seedFutureTicket?: boolean } = {}) {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const questions = [options.seedQuestion, ...(options.additionalSeedQuestions ?? [])].filter((value): value is string => !!value);
  const seeded = questions.map((question, index) => seedHistoricalArchive({ question, ownerKey, workspaceId, context, prepared,
    id: `reading:assisted-seed:${index}` }));
  const primary = seeded.find(row => row.reading.intent.question === options.seedQuestion) ?? seeded[0];
  const contract = createHopV55AssistedAdviceBackendContractV1();
  const repository = createHopV55WorkspaceRepository({ ownerKey, database: new MemoryWorkspaceDatabase(), assistedAdviceContract: contract });
  const initial: HopV55Workspace = ensureHopV55ReferenceJournal({
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0, title: 'Dossier houblon assisté',
    intent: primary?.reading.intent ?? { question: '', criteria: [] }, sourceRecipeId: context.recipe!.id,
    ...(seeded.length ? { decisionReadings: seeded.map(row => row.archive) } : {}), scenarioIds: [], referenceHypotheses: [],
    ...(options.seedFutureTicket ? { assistedAdviceTickets: [{ format: 'hop-v55-assisted-advice-ticket-v99',
      id: 'ticket:future-r23', reference: 'ticket-ref:future-r23', operationId: 'operation:future-r23', ownerKey, workspaceId,
      request: { question: 'Cette question future ne doit pas être devinée.' } }] } : {}),
    copies: [], updatedAt: createdAt,
  }, context, prepared);
  await repository.save(initial, null);
  let failNextAssistedCorrection = false;
  const repositorySave = repository.save.bind(repository);
  repository.save = async (next, expectedRevision) => {
    const last = next.documentaryAnswers?.at(-1) as { format?: string; transition?: { kind?: string } } | undefined;
    if (failNextAssistedCorrection && last?.format === 'hop-v55-documentary-answer-record-v4'
      && last.transition?.kind === 'revise' && (next.documentaryAnswers?.length ?? 0) >= 3) {
      failNextAssistedCorrection = false;
      throw new Error('Échec transitoire fixture après la reprise V4.');
    }
    return repositorySave(next, expectedRevision);
  };
  const assistedAdvice = createHopV55AssistedAdviceWorkspaceClient({ ownerKey, workspaces: repository, contract });
  const services = {
    scope: 'fixture' as const, ownerKey,
    loadContext: vi.fn(async () => structuredClone(context)),
    loadFutureDraft: vi.fn(async () => { throw new Error('Aucun brouillon futur attendu dans ce parcours.'); }),
    workspaces: repository, assistedAdvice,
    scenarios: { list: vi.fn(async () => []) },
    catalogue: { scope: 'fixture' as const, lookup: vi.fn(async () => ({ records: [], truncated: false })), write: vi.fn() },
    qualifiedStudies: { list: vi.fn(async () => []) }, close: vi.fn(),
  } as unknown as HopV55Services;
  return { context, repository, services, assistedAdvice,
    failNextAssistedCorrectionSave() { failNextAssistedCorrection = true; },
    async stored() { return repository.read(ownerKey, workspaceId); } };
}

/** Build a real local V3 parent answer from the V2/V3 archive already saved in the fixture workspace. */
async function ensureCurrentV3Answer(services: HopV55Services, question: string, workspaceId?: string) {
  let workspace = workspaceId ? await services.workspaces.read(services.ownerKey, workspaceId) : undefined;
  if (!workspace) {
    const rows = await services.workspaces.list(services.ownerKey);
    workspace = rows.find(row => row.intent.question === question || row.decisionReadings?.some(archive => archive.reading.intent.question === question));
    if (!workspace) throw new Error(`Workspace fixture exact attendu pour la réponse V3. Dossiers lus : ${rows.map(row => `${row.id}:${row.intent.question}`).join(' | ')}`);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = [...(workspace.decisionReadings ?? [])].reverse().find(row => row.reading.intent.question === question);
    const archiveRead = raw && readHopV55DecisionReadingArchive(raw);
    if (!archiveRead || archiveRead.status !== 'available'
      || archiveRead.archive.format !== 'hop-v55-decision-reading-v2' && archiveRead.archive.format !== 'hop-v55-decision-reading-v3') {
      throw new Error('La réponse fixture doit partir d’une archive V2/V3 relue, jamais d’une archive V4 rétrogradée.');
    }
    if ((workspace.documentaryAnswers ?? []).some(row => row.sourceReadingReference === archiveRead.archive.contentReference)) return;
    const context = await services.loadContext();
    const prepared = prepareBrewingScenarioContext(context);
    const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: archiveRead.archive.reading, prepared,
      requestId: `request:legacy-assisted-fixture:${archiveRead.archive.id}`, ownerKey: services.ownerKey,
      workspaceId: workspace.id, sourceReadingReference: archiveRead.archive.contentReference,
      candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Fixture historique : aucune matière choisie explicitement.' } });
    const answerSnapshot = adviceDomain.buildHopPropertyAdviceV3(draft.requestSnapshot);
    const answerRecord = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot,
      answerRecordId: `answer:legacy-assisted-fixture:${archiveRead.archive.id}` });
    try {
      await services.workspaces.save({ ...workspace, documentaryAnswers: [...(workspace.documentaryAnswers ?? []), answerRecord], updatedAt: createdAt }, workspace.revision);
      return;
    } catch (error) {
      if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error;
      workspace = await services.workspaces.read(services.ownerKey, workspace.id);
      if (!workspace) throw new Error('Workspace fixture disparu pendant le CAS de la réponse V3.');
    }
  }
}

async function selectArchivedQuestion(question: string) {
  await screen.findByTestId('hop-v55', {}, { timeout: 30_000 });
  fireEvent.click(await screen.findByRole('button', { name: /^Historique$/ }));
  fireEvent.click(screen.getByText(/Lectures et préparations de question/));
  const row = screen.getByText(question).closest('article');
  if (!row) throw new Error(`Lecture V3 source absente de l’historique : ${question}`);
  fireEvent.click(within(row).getByRole('button', { name: 'Relire cette lecture' }));
  await screen.findByRole('button', { name: 'Relire cette demande dans le contexte actif' });
}

async function rereadArchivedQuestion(question: string, options: { harness?: Awaited<ReturnType<typeof pageHarness>>; services?: HopV55Services;
  workspaceId?: string } = {}) {
  await selectArchivedQuestion(question);
  const before = options.harness ? (await options.harness.stored())?.decisionReadings?.length ?? 0 : 0;
  fireEvent.click(screen.getByRole('button', { name: 'Relire cette demande dans le contexte actif' }));
  if (options.harness) await waitFor(async () => expect((await options.harness!.stored())?.decisionReadings?.length).toBe(before + 1));
  if (options.services) await act(async () => { await ensureCurrentV3Answer(options.services!, question, options.workspaceId); });
}

async function readQuestionA(harness: Awaited<ReturnType<typeof pageHarness>>, onOpen: (session: HopV55AssistedCompanionSession) => void) {
  const initial = await harness.stored();
  const sourceRaw = initial?.decisionReadings?.find(row => row.reading.intent.question === questionA);
  const sourceRead = sourceRaw && readHopV55DecisionReadingArchive(sourceRaw);
  expect(sourceRead?.status).toBe('available');
  if (sourceRead?.status !== 'available'
    || sourceRead.archive.format !== 'hop-v55-decision-reading-v2' && sourceRead.archive.format !== 'hop-v55-decision-reading-v3') {
    throw new Error('Le point de départ doit être une archive V2/V3 immuable déjà présente dans le workspace.');
  }
  const sourceArchiveRaw = structuredClone(sourceRaw);
  render(<HopV55Page services={harness.services} onOpenAssistedCompanion={onOpen} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Décider' }));
  await screen.findByRole('button', { name: 'Relire cette demande dans le contexte actif' });
  const before = (await harness.stored())?.decisionReadings?.length ?? 0;
  fireEvent.click(screen.getByRole('button', { name: 'Relire cette demande dans le contexte actif' }));
  await waitFor(async () => expect((await harness.stored())?.decisionReadings?.length).toBe(before + 1));
  await act(async () => { await ensureCurrentV3Answer(harness.services, questionA); });
  expect((await harness.stored())?.decisionReadings?.find(row => row.contentReference === sourceRead.archive.contentReference))
    .toEqual(sourceArchiveRaw);
  const refreshed = (await harness.stored())!.decisionReadings!.at(-1)!;
  expect(readHopV55DecisionReadingArchive(refreshed)).toMatchObject({ status: 'available', archive: {
    format: sourceRead.archive.format,
  } });
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le compagnon pour cette lecture' }));
  await waitFor(() => expect(onOpen).toHaveBeenCalledOnce());
}

function assistedTurn(session: HopV55AssistedCompanionSession, ticket: HopV55AssistedAdviceTicketV1, operationId: string) {
  const input: BrewerChatInput = { scope: session.request.contextLaunch.scope, operationId, question: session.request.question,
    mode: 'auto', generation: 1, hopAdvice: structuredClone(session.request) };
  const reading = ticket.launchSnapshot.reading;
  const candidate = reading.criterionDrafts.find(row => row.source.text.toLocaleLowerCase('fr').includes('floral'))
    ?? reading.criterionDrafts.find(row => row.direction !== null);
  if (!candidate) throw new Error('La fixture doit exposer un critère source exact pour la suggestion assistée.');
  const envelope = createBrewerHopAdviceProposalEnvelope({ request: session.request,
    raw: { readerReview: [{ annotationId: candidate.id, verdict: 'revise', reason: 'Essai assisté, soumis à confirmation.',
      revision: { property: 'aroma', role: 'target', direction: 'decrease', required: true, basis: 'current', metric: 'sensory',
        subject: 'beer', subjectLabel: 'Ma bière', sensoryContext: 'beer', reason: 'Réviser cette lecture après accord du brasseur.' } }],
      answer: { summary: 'Piste à examiner avec le brasseur.', readingNote: 'Cette réponse reste une proposition, pas une adoption.',
        options: [{ id: 'assist-option', kind: 'investigation', title: 'Comparer la lecture', rationale: 'La piste est attachée à la question d’origine.',
          conditions: [], tradeoffs: [], related: [candidate.id], evidenceIds: [] }], unknowns: [],
        program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [] } },
    evidence: [], readers: {}, serverContext: { phase: 'planning', provenance: ['Fixture locale explicite.'], loadedAt: 1,
      binding: session.request.contextLaunch.expected } });
  const turn: BrewerTurn = { id: `turn:${operationId}`, operationId, question: input.question,
    advice: { level: 'info', summary: 'Lecture assistée fixture.', action: 'Examiner la piste.', why: 'Le retour reste lié à A.',
      watch: 'Aucune action avant confirmation.', question: input.question, evidenceIds: [] }, evidence: [], createdAt: Date.parse(createdAt),
    model: 'fixture', reviewed: true, contextLabel: 'Fixture locale', hopAdviceProposal: envelope, protocol: HOP_ADVICE_PROTOCOL_V1.name };
  const job = { id: `job:${operationId}`, operationId, generation: 1, scope: input.scope, question: input.question } as never;
  return { input, job, turn, envelope, evidence: [] };
}

async function openSessionAndTicket(harness: Awaited<ReturnType<typeof pageHarness>>) {
  let session!: HopV55AssistedCompanionSession;
  const onOpen = vi.fn((value: HopV55AssistedCompanionSession) => { session = value; });
  await readQuestionA(harness, onOpen);
  expect(screen.getByText(/Aucune matière choisie/)).toBeInTheDocument();
  const input: BrewerChatInput = { scope: session.request.contextLaunch.scope, operationId: 'operation:assisted-A', question: questionA,
    mode: 'auto', generation: 1, hopAdvice: structuredClone(session.request) };
  return { session, input, onOpen };
}

describe('Page V5.5 — lancement et archive du compagnon assisté', () => {
  it('refuse une question éditée, puis conserve un ticket exact avant l’envoi; un retry relit ce ticket', async () => {
    const harness = await pageHarness({ seedQuestion: questionA });
    const { session, input } = await openSessionAndTicket(harness);
    fireEvent.change(screen.getByRole('textbox', { name: 'Question au brasseur' }), { target: { value: `${questionA} modifiée` } });
    await expect(session.onBeforeSend(input)).rejects.toThrow(/texte de la question a changé/i);
    expect(await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId)).toMatchObject({ status: 'absent' });

    fireEvent.change(screen.getByRole('textbox', { name: 'Question au brasseur' }), { target: { value: questionA } });
    const wrongScope = { ...input, scope: { ...input.scope, id: `${input.scope.id}:autre` } };
    await act(async () => { await expect(session.onBeforeSend(wrongScope)).rejects.toThrow(/input|scope|requête assistée/i); });
    expect(await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId)).toMatchObject({ status: 'absent' });
    await act(async () => { await session.onBeforeSend(input); });
    const first = await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
    expect(first.status).toBe('available');
    if (first.status !== 'available') throw new Error('Ticket exact attendu après le CAS avant envoi.');
    await act(async () => { await session.onBeforeSend(input); });
    const retry = await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
    expect(retry).toMatchObject({ status: 'available', value: { reference: first.value.reference, createdAt: first.value.createdAt } });
    expect((await harness.stored())?.assistedAdviceTickets).toHaveLength(1);
    expect(input).not.toHaveProperty('ticket');
    expect(input).not.toHaveProperty('launchSnapshot');
    expect(first.value.request).toEqual(session.request);
  });

  it('explique le blocage quand aucune base documentaire V3/V4 n’a été capturée', async () => {
    const harness = await pageHarness({ seedQuestion: questionA });
    let session!: HopV55AssistedCompanionSession;
    render(<HopV55Page services={harness.services} onOpenAssistedCompanion={value => { session = value; }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le compagnon pour cette lecture' }));
    await waitFor(() => expect(session).toBeDefined());
    expect(screen.getByText(/Aucune matière choisie/)).toBeInTheDocument();
    const input: BrewerChatInput = { scope: session.request.contextLaunch.scope, operationId: 'operation:no-parent',
      question: questionA, mode: 'auto', generation: 1, hopAdvice: session.request };
    await act(async () => { await session.onBeforeSend(input); });
    const ticket = await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
    if (ticket.status !== 'available') throw new Error('Ticket sans parent attendu.');
    const response = assistedTurn(session, ticket.value, input.operationId);
    await act(async () => { await session.onAssistedTurn(response); });
    expect(await screen.findByText(/Aucun record documentaire V3\/V4 exact/)).toBeInTheDocument();
    expect(await screen.findByText(/Aucune commande de confirmation n’est disponible/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réviser ce terme' })).toBeNull();
  });

  it('archive le retour tardif A sous sa lecture, le marque périmé sous B puis relit l’archive sans parser ni reconstruire', async () => {
    const harness = await pageHarness({ seedQuestion: questionA, additionalSeedQuestions: [questionB] });
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    const builder = vi.spyOn(adviceDomain, 'buildHopPropertyAdviceV3');
    const { session, input } = await openSessionAndTicket(harness);
    await act(async () => { await session.onBeforeSend(input); });
    const ticketRead = await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
    if (ticketRead.status !== 'available') throw new Error('Ticket A exact attendu.');
    const response = assistedTurn(session, ticketRead.value, input.operationId);

    await selectArchivedQuestion(questionB);
    const beforeLateReturn = await harness.stored();
    const archiveB = readHopV55DecisionReadingArchive(beforeLateReturn!.decisionReadings!.find(row => row.reading.intent.question === questionB));
    if (archiveB.status !== 'available') throw new Error('Lecture B exacte attendue.');

    await act(async () => { await session.onAssistedTurn(response); });
    const stored = await harness.stored();
    expect(stored?.decisionReadings?.[1].contentReference).toBe(archiveB.archive.contentReference);
    expect(stored?.assistedAdviceTickets).toHaveLength(1);
    expect(stored?.assistedAdviceRecords).toHaveLength(1);
    const receipt = await harness.assistedAdvice.readArchiveByOperationId(workspaceId, input.operationId);
    expect(receipt.status).toBe('available');
    if (receipt.status !== 'available') throw new Error('Archive assistée A attendue.');
    expect(receipt.value.record.sourceReadingReference).toBe(ticketRead.value.sourceReadingReference);
    expect(receipt.value.record.payload.contextCheckAtReception).toMatchObject({
      historicalSourceReadingReference: ticketRead.value.sourceReadingReference, applicability: { status: 'stale' },
    });
    expect(screen.queryByRole('heading', { name: 'Proposition à examiner' })).toBeNull();

    const parserCount = parser.mock.calls.length;
    const builderCount = builder.mock.calls.length;
    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: /^Historique$/ }));
    fireEvent.click(screen.getByText(/Réponses assistées conservées/));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette réponse exacte' }));
    await screen.findByRole('heading', { name: 'Proposition à examiner' });
    expect(parser).toHaveBeenCalledTimes(parserCount);
    expect(builder).toHaveBeenCalledTimes(builderCount);
    expect(screen.getByText(/Lecture seule/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réviser ce terme' })).toBeNull();
    expect(screen.getByText(/Aucune commande de confirmation n’est disponible/)).toBeInTheDocument();
    expect((await harness.stored())?.assistedAdviceRecords?.[0]).toEqual(stored?.assistedAdviceRecords?.[0]);
  });

  it('rattache un ticket A après rechargement sans onBeforeSend, parsing ni capture neuve, même si B est affichée', async () => {
    const harness = await pageHarness({ seedQuestion: questionA, additionalSeedQuestions: [questionB] });
    const { session, input } = await openSessionAndTicket(harness);
    await act(async () => { await session.onBeforeSend(input); });
    const ticketRead = await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
    if (ticketRead.status !== 'available') throw new Error('Ticket A archivé avant la coupure attendue.');

    await rereadArchivedQuestion(questionB, { harness, services: harness.services });
    cleanup();

    let recovered!: HopV55AssistedCompanionSession;
    render(<HopV55Page services={harness.services} onOpenAssistedCompanion={value => { recovered = value; }} />);
    const parser = vi.spyOn(decisionModule, 'readHopV55Question');
    const builder = vi.spyOn(adviceDomain, 'buildHopPropertyAdviceV3');
    fireEvent.click(await screen.findByRole('button', { name: /^Historique$/ }));
    fireEvent.click(screen.getByText(/Tickets assistés sans réponse archivée/));
    const parsesBeforeAttach = parser.mock.calls.length;
    const buildsBeforeAttach = builder.mock.calls.length;
    fireEvent.click(await screen.findByRole('button', { name: 'Rattacher cette réponse assistée' }));
    await waitFor(() => expect(recovered).toBeDefined());
    expect(recovered.request).toEqual(ticketRead.value.request);
    expect(recovered.context).toEqual(ticketRead.value.launchSnapshot.context);
    expect(recovered.label).toContain(questionA);
    expect(parser).toHaveBeenCalledTimes(parsesBeforeAttach);
    expect(builder).toHaveBeenCalledTimes(buildsBeforeAttach);

    const response = assistedTurn(recovered, ticketRead.value, input.operationId);
    await act(async () => { await recovered.onAssistedTurn(response); });
    const receipt = await harness.assistedAdvice.readArchiveByOperationId(workspaceId, input.operationId);
    expect(receipt.status).toBe('available');
    if (receipt.status !== 'available') throw new Error('Réponse A rattachée au ticket attendu.');
    expect(receipt.value.ticket.reference).toBe(ticketRead.value.reference);
    expect(receipt.value.record.sourceReadingReference).toBe(ticketRead.value.sourceReadingReference);
    expect(receipt.value.record.payload.contextCheckAtReception.applicability.status).toBe('stale');
    expect((await harness.stored())?.assistedAdviceTickets).toHaveLength(1);
    expect((await harness.stored())?.assistedAdviceRecords).toHaveLength(1);
    expect(screen.getAllByText(questionB).length).toBeGreaterThan(0);
    expect(parser).toHaveBeenCalledTimes(parsesBeforeAttach);
    expect(builder).toHaveBeenCalledTimes(buildsBeforeAttach);
  });

  it('confirme une suggestion fraîche via la transition V3→V4, conserve la réponse source et relit le receipt en lecture seule', async () => {
    const harness = await pageHarness({ seedQuestion: questionA });
    const { session, input } = await openSessionAndTicket(harness);
    await act(async () => { await session.onBeforeSend(input); });
    const ticketRead = await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
    if (ticketRead.status !== 'available') throw new Error('Ticket exact attendu avant la réponse.');
    const response = assistedTurn(session, ticketRead.value, input.operationId);
    await act(async () => { await session.onAssistedTurn(response); });

    expect(await screen.findByRole('heading', { name: 'Proposition à examiner' })).toBeInTheDocument();
    expect(screen.getByText(/La confirmation conserve d’abord la reprise V4 exacte/)).toBeInTheDocument();
    const reason = screen.getByRole('textbox', { name: /^Motif de confirmation/ });
    fireEvent.change(reason, { target: { value: 'Je confirme cette correction après relecture du terme source.' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /^Confirmer explicitement/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Réviser ce terme' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(3));
    await screen.findByText('Suggestion assistée confirmée et conservée dans une nouvelle version.');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Proposition à examiner' })).toBeNull());
    const stored = await harness.stored();
    const original = readHopV55DocumentaryAnswerRecord(stored!.documentaryAnswers![0]);
    const upgrade = readHopV55DocumentaryAnswerRecord(stored!.documentaryAnswers![1]);
    const corrected = readHopV55DocumentaryAnswerRecord(stored!.documentaryAnswers![2]);
    expect(original.status).toBe('readOnly');
    if (original.status !== 'readOnly' || original.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Le parent V3 exact doit rester archivé.');
    }
    expect(upgrade.status).toBe('readOnly');
    if (upgrade.status !== 'readOnly' || upgrade.record.format !== 'hop-v55-documentary-answer-record-v4') {
      throw new Error('L’étape de reprise V4 exacte doit être conservée.');
    }
    expect(corrected.status).toBe('readOnly');
    if (corrected.status !== 'readOnly' || corrected.record.format !== 'hop-v55-documentary-answer-record-v4') {
      throw new Error('La correction assistée V4 doit être conservée.');
    }
    expect(upgrade.record.transition).toMatchObject({ kind: 'upgradeV3', parentRecordReference: original.record.reference });
    expect(corrected.record.transition).toMatchObject({ kind: 'revise', parentRecordReference: upgrade.record.reference,
      reason: 'Je confirme cette correction après relecture du terme source.', actor: { origin: 'user', label: 'Brasseur' } });
    expect(stored!.documentaryAnswers![0]).toEqual(original.record);
    expect((await harness.assistedAdvice.readArchiveByOperationId(workspaceId, input.operationId)).status).toBe('available');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Proposition à examiner' })).toBeNull());

    cleanup();
    render(<HopV55Page services={harness.services} />);
    fireEvent.click(await screen.findByRole('button', { name: /^Historique$/ }));
    fireEvent.click(screen.getByText(/Réponses assistées conservées/));
    fireEvent.click(await screen.findByRole('button', { name: 'Relire cette réponse exacte' }));
    await screen.findByRole('heading', { name: 'Proposition à examiner' });
    expect(screen.queryByRole('button', { name: 'Réviser ce terme' })).toBeNull();
    expect(screen.getByText(/Aucune commande de confirmation n’est disponible/)).toBeInTheDocument();
  });

  it('reprend la même correction après échec post-upgrade, sans nouvel upgrade ni reconstruction', async () => {
    const harness = await pageHarness({ seedQuestion: questionA });
    const build = vi.spyOn(adviceDomain, 'buildHopPropertyAdviceV3');
    const { session, input } = await openSessionAndTicket(harness);
    await act(async () => { await session.onBeforeSend(input); });
    const ticketRead = await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
    if (ticketRead.status !== 'available') throw new Error('Ticket exact attendu.');
    const response = assistedTurn(session, ticketRead.value, input.operationId);
    await act(async () => { await session.onAssistedTurn(response); });
    await screen.findByRole('heading', { name: 'Proposition à examiner' });
    fireEvent.change(screen.getByRole('textbox', { name: /^Motif de confirmation/ }), {
      target: { value: 'Je confirme la même correction après reprise locale.' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /^Confirmer explicitement/ }));
    harness.failNextAssistedCorrectionSave();
    fireEvent.click(screen.getByRole('button', { name: 'Réviser ce terme' }));
    await screen.findByText(/Échec transitoire fixture après la reprise V4/);
    const afterFailure = await harness.stored();
    expect(afterFailure?.documentaryAnswers).toHaveLength(2);
    const upgrade = readHopV55DocumentaryAnswerRecord(afterFailure!.documentaryAnswers![1]);
    expect(upgrade.status).toBe('readOnly');
    if (upgrade.status !== 'readOnly' || upgrade.record.format !== 'hop-v55-documentary-answer-record-v4') {
      throw new Error('L’étape V4 doit rester archivée après l’échec de la correction.');
    }
    expect(upgrade.record.transition.kind).toBe('upgradeV3');
    const buildsAfterFailure = build.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer la même confirmation' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(3));
    await screen.findByText('Suggestion assistée confirmée et conservée dans une nouvelle version.');
    const afterRetry = await harness.stored();
    const resumed = readHopV55DocumentaryAnswerRecord(afterRetry!.documentaryAnswers![2]);
    expect(resumed.status).toBe('readOnly');
    if (resumed.status !== 'readOnly' || resumed.record.format !== 'hop-v55-documentary-answer-record-v4') {
      throw new Error('La correction exacte doit être archivée après la reprise.');
    }
    expect(resumed.record.transition).toMatchObject({ kind: 'revise', parentRecordReference: upgrade.record.reference,
      reason: 'Je confirme la même correction après reprise locale.' });
    expect(afterRetry!.documentaryAnswers![1]).toEqual(afterFailure!.documentaryAnswers![1]);
    expect(build).toHaveBeenCalledTimes(buildsAfterFailure);
    expect(screen.queryByRole('heading', { name: 'Proposition à examiner' })).toBeNull();
  });

  it('refuse la suggestion si une autre version V4 de la même lecture est affichée', async () => {
    const harness = await pageHarness({ seedQuestion: questionA });
    let session!: HopV55AssistedCompanionSession;
    const onOpen = vi.fn((value: HopV55AssistedCompanionSession) => { session = value; });
    await readQuestionA(harness, onOpen);
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre les termes proposés et leurs décisions' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(2));

    const reject = await screen.findByRole('button', { name: 'Écarter « floral »' });
    fireEvent.click(reject);
    fireEvent.change(await screen.findByRole('textbox', { name: /Précision du motif/ }), {
      target: { value: 'Hypothèse de relecture fixture pour produire une seconde version.' },
    });
    const rejectGroup = screen.getByRole('group', { name: 'Écarter « floral »' });
    fireEvent.click(within(rejectGroup).getByRole('button', { name: 'Écarter ce terme' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmer la nouvelle lecture' }));
    await waitFor(async () => expect((await harness.stored())?.documentaryAnswers).toHaveLength(3));
    const previousVersion = await screen.findByRole('button', { name: 'Relire cette version' });
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le compagnon pour cette lecture' }));
    await waitFor(() => expect(session).toBeDefined());
    const input: BrewerChatInput = { scope: session.request.contextLaunch.scope, operationId: 'operation:assisted-head-change',
      question: questionA, mode: 'auto', generation: 1, hopAdvice: session.request };
    await act(async () => { await session.onBeforeSend(input); });
    const ticket = await harness.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
    if (ticket.status !== 'available') throw new Error('Ticket exact lié à la tête V4 attendu.');
    const response = assistedTurn(session, ticket.value, input.operationId);
    await act(async () => { await session.onAssistedTurn(response); });

    fireEvent.click(previousVersion);
    fireEvent.change(await screen.findByRole('textbox', { name: /^Motif de confirmation/ }), {
      target: { value: 'Je confirme après avoir changé la version affichée.' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /^Confirmer explicitement/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Réviser ce terme' }));
    expect(await screen.findByText(/version V4 affichée ou son registre a changé/)).toBeInTheDocument();
    expect((await harness.stored())?.documentaryAnswers).toHaveLength(3);
    expect((await harness.assistedAdvice.readArchiveByOperationId(workspaceId, input.operationId)).status).toBe('available');
    expect(screen.queryByText('Confirmation transmise pour cette annotation.')).toBeNull();
  });

  it('archive le receipt frais du vrai tour froid sans changer les preuves du Runtime fixture', async () => {
    const namespace = `assisted-cold-fresh-${crypto.randomUUID()}`;
    let services!: HopV55Services;
    let runtime!: ReturnType<typeof createHopV55AssistedAdviceFixtureRuntime>;
    let session!: HopV55AssistedCompanionSession;
    const onReady = vi.fn((nextServices: HopV55Services, nextRuntime: ReturnType<typeof createHopV55AssistedAdviceFixtureRuntime>) => {
      services = nextServices; runtime = nextRuntime;
    });
    const onSession = vi.fn((value: HopV55AssistedCompanionSession) => { session = value; });
    render(<ColdFixtureHarness namespace={namespace} onReady={onReady} onSession={onSession} />);
    await rereadArchivedQuestion(questionA, { services });
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le compagnon pour cette lecture' }));
    await waitFor(() => expect(session).toBeDefined());
    const input: BrewerChatInput = { scope: session.request.contextLaunch.scope, operationId: 'operation:cold-fresh-A',
      question: questionA, mode: 'auto', generation: 0, hopAdvice: structuredClone(session.request) };
    await act(async () => { await session.onBeforeSend(input); });
    act(() => { runtime.runtime.jobs.submit(input, session.label); });
    await waitFor(() => expect(runtime.pending()).toHaveLength(1));
    const operationId = input.operationId;
    const workspace = (await services.workspaces.list(services.ownerKey)).find(row => row.intent.question === questionA);
    if (!workspace) throw new Error('Dossier fixture A persistant attendu.');
    const ticket = await services.assistedAdvice.readTicketByOperationId(workspace.id, operationId);
    expect(ticket.status).toBe('available');
    if (ticket.status !== 'available') throw new Error('Ticket avant transport fixture attendu.');

    await act(async () => { await runtime.releaseNext(); });
    await waitFor(() => expect(runtime.runtime.jobs.snapshot().jobs.find(job => job.operationId === operationId)?.status).toBe('done'));
    const job = runtime.runtime.jobs.snapshot().jobs.find(row => row.operationId === operationId);
    expect(job?.turn?.evidence.some(item => item.name === 'cold_contact_bitterness_reference')).toBe(true);
    if (!job?.turn?.hopAdviceProposal || !job.input) throw new Error('Tour froid exact du Runtime fixture attendu.');
    const completeEvidence = job.turn.evidence;
    const projectedEvidence = completeEvidence.map(({ id, name, label, data }) => ({ id, name, label, data }));
    const sealedDependencies = job.turn.hopAdviceProposal.evidence.dependencies;
    expect(projectBrewerHopAdviceToolDependencies(completeEvidence)).toEqual(sealedDependencies);
    expect(projectBrewerHopAdviceToolDependencies(projectedEvidence)).not.toEqual(sealedDependencies);
    await act(async () => { await session.onAssistedTurn({ input, job, turn: job.turn!, envelope: job.turn!.hopAdviceProposal!, evidence: job.turn!.evidence }); });
    expect((await services.assistedAdvice.readTicketByOperationId(workspace.id, operationId)).status).toBe('available');
    const freshReceipt = await services.assistedAdvice.readArchiveByOperationId(workspace.id, operationId);
    expect(freshReceipt.status).toBe('available');
    if (freshReceipt.status !== 'available') throw new Error('Receipt du tour froid reçu sous A attendu.');
    expect(freshReceipt.value.ticket.reference).toBe(ticket.value.reference);
    expect(freshReceipt.value.record.payload.turnEvidence).toEqual(completeEvidence);
    expect(freshReceipt.value.record.payload.contextCheckAtReception.applicability.status).toBe('current');
  }, 60_000);

  it('rattache le ticket et le tour froid A sous B sans déplacer son receipt ni son contexte', async () => {
    const namespace = `assisted-cold-recovery-${crypto.randomUUID()}`;
    let services!: HopV55Services;
    let runtime!: ReturnType<typeof createHopV55AssistedAdviceFixtureRuntime>;
    let sessionA!: HopV55AssistedCompanionSession;
    let recoveredA!: HopV55AssistedCompanionSession;
    const onReady = vi.fn((nextServices: HopV55Services, nextRuntime: ReturnType<typeof createHopV55AssistedAdviceFixtureRuntime>) => {
      services = nextServices; runtime = nextRuntime;
    });
    const onSession = vi.fn((value: HopV55AssistedCompanionSession) => {
      if (value.request.question === questionA) { sessionA = value; if (value.label.startsWith('Reprise du ticket')) recoveredA = value; }
    });
    render(<ColdFixtureHarness namespace={namespace} onReady={onReady} onSession={onSession} />);
    await rereadArchivedQuestion(questionA, { services });
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le compagnon pour cette lecture' }));
    await waitFor(() => expect(sessionA).toBeDefined());
    const inputA: BrewerChatInput = { scope: sessionA.request.contextLaunch.scope, operationId: 'operation:cold-recovery-A',
      question: questionA, mode: 'auto', generation: 0, hopAdvice: structuredClone(sessionA.request) };
    await act(async () => { await sessionA.onBeforeSend(inputA); });
    act(() => { runtime.runtime.jobs.submit(inputA, sessionA.label); });
    await waitFor(() => expect(runtime.pending()).toHaveLength(1));
    const operationId = inputA.operationId;
    const workspaceA = (await services.workspaces.list(services.ownerKey)).find(row => row.intent.question === questionA);
    if (!workspaceA) throw new Error('Dossier fixture A persistant attendu.');
    const archiveBRead = readHopV55DecisionReadingArchive(workspaceA.decisionReadings?.find(row => row.reading.intent.question === questionB));
    if (archiveBRead.status !== 'available') throw new Error('Archive historique B exacte requise avant le rattachement A sous B.');
    const archiveBReference = archiveBRead.archive.contentReference;
    const ticketA = await services.assistedAdvice.readTicketByOperationId(workspaceA.id, operationId);
    if (ticketA.status !== 'available') throw new Error('Ticket fixture A exact attendu.');

    await selectArchivedQuestion(questionB);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Question au brasseur' }), { target: { value: questionB } });
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le compagnon pour cette lecture' }));
    await waitFor(() => expect(onSession).toHaveBeenCalledTimes(2));
    await act(async () => { await runtime.releaseNext(); });
    await waitFor(() => expect(runtime.runtime.jobs.snapshot().jobs.find(job => job.operationId === operationId)?.status).toBe('done'));
    const doneA = runtime.runtime.jobs.snapshot().jobs.find(row => row.operationId === operationId)!;
    expect(doneA.turn?.evidence.some(item => item.name === 'cold_contact_bitterness_reference')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /^Historique$/ }));
    fireEvent.click(screen.getByText(/Tickets assistés sans réponse archivée/));
    fireEvent.click(await screen.findByRole('button', { name: 'Rattacher cette réponse assistée' }));
    await waitFor(() => expect(recoveredA).toBeDefined());
    if (!doneA.input || !doneA.turn?.hopAdviceProposal) throw new Error('Job DONE fixture A incomplet.');
    const turn: HopV55AssistedCompanionTurn = { input: doneA.input, job: doneA, turn: doneA.turn,
      envelope: doneA.turn.hopAdviceProposal, evidence: doneA.turn.evidence };
    await act(async () => { await recoveredA.onAssistedTurn(turn); });

    const receipt = await services.assistedAdvice.readRecordByOperationId(workspaceA.id, operationId);
    expect(receipt.status).toBe('available');
    if (receipt.status !== 'available') throw new Error('Receipt froid A attaché depuis le ticket exact attendu.');
    expect(receipt.value.ticketReference).toBe(ticketA.value.reference);
    expect(receipt.value.payload.turnEvidence).toEqual(doneA.turn!.evidence);
    expect(receipt.value.payload.contextCheckAtReception.applicability.status).toBe('stale');
    expect(receipt.value.payload.contextCheckAtReception.currentSourceReadingReference).toBe(archiveBReference);
    expect(doneA.turn?.evidence[0].name).toBe('cold_contact_bitterness_reference');
    expect((await services.assistedAdvice.readTicketByOperationId(workspaceA.id, operationId)).status).toBe('available');
    expect(await services.assistedAdvice.readRecordByOperationId(workspaceA.id, operationId)).toMatchObject({ status: 'available' });
    expect((await services.workspaces.read(services.ownerKey, workspaceA.id))?.intent.question).toBe(questionA);
  }, 120_000);
});

describe('R23-1 — identification des reprises avant ouverture', () => {
  it('laisse un ticket futur consultable en brut sans geste de rattachement', async () => {
    const harness = await pageHarness({ seedFutureTicket: true });
    render(<HopV55Page services={harness.services} onOpenAssistedCompanion={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /^Historique$/ }));
    const section = screen.getByText(/Tickets assistés sans réponse archivée/).closest('details');
    if (!section) throw new Error('La liste des tickets futurs doit rester accessible.');
    fireEvent.click(within(section).getByText(/Tickets assistés sans réponse archivée/));
    const row = within(section).getByText('Ticket assisté conservé · format futur').closest('article');
    if (!row) throw new Error('Le ticket futur doit rester identifiable par son état.');
    const rawDetails = within(row).getByText('Données conservées').closest('details');
    if (!rawDetails) throw new Error('Le snapshot futur doit rester accessible dans ses données brutes.');
    expect(rawDetails).not.toHaveAttribute('open');
    expect(rawDetails.querySelector('pre')).toHaveTextContent('Cette question future ne doit pas être devinée.');
    expect(within(row).queryByRole('button', { name: 'Rattacher cette réponse assistée' })).not.toBeInTheDocument();
    fireEvent.click(within(row).getByText('Données conservées'));
    expect(rawDetails).toHaveAttribute('open');
    expect(within(row).getByText(/Cette question future ne doit pas être devinée/)).toBeVisible();
  });

  it('distingue le reçu A du ticket B par question, date et contexte avant ouverture', async () => {
    const harness = await pageHarness({ seedQuestion: questionA, additionalSeedQuestions: [questionB] });
    const sessions: HopV55AssistedCompanionSession[] = [];
    const onOpen = vi.fn((session: HopV55AssistedCompanionSession) => { sessions.push(session); });
    await readQuestionA(harness, onOpen);
    const sessionA = sessions[0];
    const inputA: BrewerChatInput = { scope: sessionA.request.contextLaunch.scope, operationId: 'operation:history-choice-A',
      question: questionA, mode: 'auto', generation: 1, hopAdvice: structuredClone(sessionA.request) };
    await act(async () => { await sessionA.onBeforeSend(inputA); });
    const ticketA = await harness.assistedAdvice.readTicketByOperationId(workspaceId, inputA.operationId);
    if (ticketA.status !== 'available') throw new Error('Ticket A canonique attendu avant sa réponse.');
    await act(async () => { await sessionA.onAssistedTurn(assistedTurn(sessionA, ticketA.value, inputA.operationId)); });
    const receiptA = await harness.assistedAdvice.readArchiveByOperationId(workspaceId, inputA.operationId);
    if (receiptA.status !== 'available') throw new Error('Reçu A canonique attendu avant l’affichage de B.');

    await rereadArchivedQuestion(questionB, { harness, services: harness.services });
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir le compagnon pour cette lecture' }));
    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(2));
    const sessionB = sessions[1];
    const inputB: BrewerChatInput = { scope: sessionB.request.contextLaunch.scope, operationId: 'operation:history-choice-B',
      question: questionB, mode: 'auto', generation: 1, hopAdvice: structuredClone(sessionB.request) };
    await act(async () => { await sessionB.onBeforeSend(inputB); });
    const ticketB = await harness.assistedAdvice.readTicketByOperationId(workspaceId, inputB.operationId);
    if (ticketB.status !== 'available') throw new Error('Ticket B canonique attendu.');

    fireEvent.click(screen.getByRole('button', { name: /^Historique$/ }));
    const receiptsSection = screen.getByText(/Réponses assistées conservées/).closest('details');
    if (!receiptsSection) throw new Error('Liste des reçus assistés attendue.');
    fireEvent.click(within(receiptsSection).getByText(/Réponses assistées conservées/));
    const receiptRowA = within(receiptsSection).getByText(questionA).closest('article');
    if (!receiptRowA) throw new Error('Le reçu doit rester reconnaissable par la question A.');
    expect(receiptRowA).toHaveTextContent(questionA);
    expect(receiptRowA).toHaveTextContent(new Date(receiptA.value.record.turn.createdAt).toLocaleString('fr-CH', {
      timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' }));
    expect(receiptRowA).toHaveTextContent(harness.context.recipe!.name);

    const ticketsSection = screen.getByText(/Tickets assistés sans réponse archivée/).closest('details');
    if (!ticketsSection) throw new Error('Liste des tickets assistés attendue.');
    fireEvent.click(within(ticketsSection).getByText(/Tickets assistés sans réponse archivée/));
    const rowB = within(ticketsSection).getByText(questionB).closest('article');
    if (!rowB) throw new Error('La question B du ticket doit rester identifiable avant son ouverture.');
    expect(rowB).toHaveTextContent(new Date(ticketB.value.createdAt).toLocaleString('fr-CH', {
      timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' }));
    expect(rowB).toHaveTextContent(harness.context.recipe!.name);
    fireEvent.click(within(receiptRowA).getByText('Identités et références exactes'));
    expect(receiptRowA).toHaveTextContent(ticketA.value.operationId);
    expect(within(receiptRowA).getByText(ticketA.value.reference)).toBeInTheDocument();
    fireEvent.click(within(rowB).getByText('Identités et références exactes'));
    expect(rowB).toHaveTextContent(ticketB.value.operationId);
    expect(within(rowB).getByText(ticketB.value.reference)).toBeInTheDocument();
  }, 60_000);
});
