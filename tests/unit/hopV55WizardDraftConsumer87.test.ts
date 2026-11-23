import { describe, expect, it, vi } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { hopPropertyAdviceAnswerReferenceV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import * as semanticReading from '../../src/services/hopV55/questionSemanticReading';
import { canonicalizeHopV55RecipeDraft } from '../../src/services/hopV55/recipeStepContext';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { prepareHopV55SemanticAssistedAdviceLaunchForWizardV1 } from '../../src/services/hopV55/assistedSemanticAdviceContextV4';
import {
  prepareCorrectionV4ForWizardV1,
  prepareInitialPropertyAdviceV4ForWizardV1,
  resumeV4ForWizardV1,
} from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { buildHopV55AssistedSemanticAdviceRequestForWizardV1 } from '../../src/services/hopV55/assistedSemanticAdviceRequestV3';
import {
  createHopV55DecisionReadingArchiveV4ForWizardV1,
} from '../../src/services/hopV55/decisionArchive';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { readHopV55DocumentaryAnswerRecord,
  readHopV55DocumentaryAnswerRecordWithWizardV1 } from '../../src/services/hopV55/documentaryRecords';
import { createHopV55WizardSourceSnapshotV1, createHopV55WizardWorkspaceOriginV1 } from '../../src/services/hopV55/workspaceRepository';
import {
  createHopV55PropertyAdviceAnswerRecordV4ForWizardV1,
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT,
  readHopV55PropertyAdviceAnswerRecordV4,
  readHopV55PropertyAdviceAnswerRecordV4ForWizardV1,
} from '../../src/services/hopV55/propertyAdviceRecordsV4';
import {
  createHopV55AssistedAdviceWizardTicketV1,
  createHopV55AssistedAdviceWizardRecordV1,
  readHopV55AssistedAdviceArchiveV2,
  readHopV55AssistedAdviceTicketV2,
  readHopV55AssistedAdviceWizardArchiveV1,
  readHopV55AssistedAdviceWizardTicketV1,
} from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';
import { createBrewerHopAdviceProposalEnvelopeV6ForWizardV1 } from '../../functions/src/brewerHopAdviceSemanticV6';
import { HOP_ADVICE_PROTOCOL_V1, HOP_ADVICE_V1_FUNCTIONS, type HopAdviceV1PublicJob, type HopAdviceV1PublicTurn,
  type HopAdviceV1WizardWireInputV1 } from '../../functions/src/brewerHopAdviceTransportV1';
import type { HopV55SemanticAdoptionPrincipalV1 } from '../../src/services/hopV55/assistedSemanticAdviceAdoptionV6';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createHopV55SemanticAdoptionApplicationHostV1, type HopV55SemanticAdoptionApplicationHostV1,
  type HopV55SemanticActorV1, type HopV55SemanticWizardJobStoreV1, type HopV55SemanticWizardJobSnapshotV1 } from '../../src/services/hopV55/semanticAdoptionApplicationHost';
import { createBrewerHopAdviceApiForWizardV1, type BrewerHopAdviceV1CallableName,
  type BrewerHopAdviceV1CallableTransport } from '../../src/services/brewerHopAdviceApi';
import { createBrewerHopAdviceApiRuntimeWizardV1 } from '../../src/services/brewerHopAdviceRuntimeAdapter';
import { createBrewerHopAdviceSemanticRuntimeWizardV1 } from '../../src/services/brewerHopAdviceRuntime';
import { createHopV55SemanticWizardJobStoreV1 } from '../../src/services/brewerJobs';
import {
  createBrewerHopAdviceWizardSourceV1,
  mapBrewerHopAdviceWizardSourceToScopeV1,
} from '../../functions/src/brewerHopAdviceWizardSourceV1';
import { hopV55FixtureRecipe } from '../fixtures/hopV55';

const ownerKey = 'owner:wizard-consumer-87';
const workspaceId = 'workspace:wizard-consumer-87';
const draftId = 'draft:same-recipe-id';
const question = 'Ma bière est trop sucrée. Comment compenser avec mon houblon de jardin, tout en gardant la poire ?';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière sélectionnée.' };
const recordedAt = '2026-10-05T12:00:00.000Z';

function createWizardJourney(draftName = 'Wizard B non enregistré', draftVolume = 24) {
  const origin = { ownerKey, workspaceId, draftId };
  const savedRecipeA = hopV55FixtureRecipe(draftId);
  savedRecipeA.name = 'Recipe A déjà enregistrée';
  savedRecipeA.volumeL = 20;
  const snapshotA = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: savedRecipeA });
  const draftB = hopV55FixtureRecipe(draftId);
  draftB.name = draftName;
  draftB.volumeL = draftVolume;
  draftB.totalGristKg = Number.NaN;
  draftB.ogTarget = 0;
  const snapshotB = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: draftB });
  expect(snapshotB.recipe.totalGristKg).toBeNull();
  expect(snapshotB.recipe.ogTarget).toBe(0);
  const sourceA = createBrewerHopAdviceWizardSourceV1({ origin, snapshot: snapshotA });
  const sourceB = createBrewerHopAdviceWizardSourceV1({ origin, snapshot: snapshotB });
  const sourceContext = makeHopV55FixtureContext('planning');
  sourceContext.recipe = structuredClone(snapshotB.recipe) as typeof sourceContext.recipe;
  expect(sourceContext.recipe).toEqual(snapshotB.recipe);
  const prepared = prepareBrewingScenarioContext(sourceContext);
  const savedContext = makeHopV55FixtureContext('planning');
  savedContext.recipe = structuredClone(snapshotA.recipe) as typeof savedContext.recipe;
  const preparedFromSavedRecipeA = prepareBrewingScenarioContext(savedContext);
  expect(prepared.binding?.recipeReference).toBeTruthy();
  expect(prepared.binding?.recipeReference).not.toBe(preparedFromSavedRecipeA.binding?.recipeReference);
  const reading = semanticReading.readHopV55QuestionSemanticV1(question, prepared);
  const archiveB = createHopV55DecisionReadingArchiveV4ForWizardV1({
    id: 'reading:wizard-b', ownerKey, workspaceId, recordedAt, reading, source: sourceB,
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  });
  const workspaceOrigin = createHopV55WizardWorkspaceOriginV1(origin);
  const storedSnapshot = createHopV55WizardSourceSnapshotV1({ origin: workspaceOrigin, snapshot: snapshotB });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Atelier Wizard fixture', intent: { question, criteria: [] },
    wizardOrigin: workspaceOrigin, wizardSourceSnapshots: [storedSnapshot], decisionReadings: [archiveB],
    scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt,
  };
  const preparedResult = prepareInitialPropertyAdviceV4ForWizardV1({
    sourceReadingArchive: archiveB, origin, snapshot: snapshotB, ownerKey, workspaceId, prepared,
    recordId: 'answer:wizard-b', requestId: 'request:wizard-b', candidatePolicy, cultureBinding: null,
    transition: { actId: 'act:wizard-b-create', kind: 'create', reason: 'Préparer cette lecture du brouillon.',
      actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt },
    additions: [],
  });
  if (preparedResult.status !== 'ready') throw new Error(`Fixture Wizard non préparée : ${preparedResult.status}.`);
  const answerSnapshot = buildHopPropertyAdviceV3(preparedResult.requestDraftV3.requestSnapshot);
  const answerReference = hopPropertyAdviceAnswerReferenceV3(answerSnapshot);
  const record = createHopV55PropertyAdviceAnswerRecordV4ForWizardV1({
    draft: preparedResult.recordDraft,
    outcome: { kind: 'domainAnswer', requestDraftReference: preparedResult.requestDraftV3.reference,
      answerSnapshot, answerReference },
  });
  return { origin, snapshotA, snapshotB, sourceA, sourceB, context: sourceContext, prepared, archiveB, workspace,
    requestDraft: preparedResult.requestDraftV3, record };
}

function resealRecord(value: Record<string, unknown>): Record<string, unknown> {
  const { reference: _reference, ...body } = value;
  return { ...body, reference: hopAdviceContentReference(HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT, body) };
}

function wizardFixtureIntent(id: string): Omit<HopPropertyAdviceIntentV3, 'interpretationOrigin'> {
  const fragment = 'gardant la poire';
  const start = question.indexOf(fragment);
  if (start < 0) throw new Error('Le fragment de préférence doit rester dans la question exacte.');
  return { id, property: 'aroma', label: fragment, role: 'preference', direction: null, qualification: null,
    required: false, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière fixture', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [{ start, end: start + fragment.length, text: fragment }], basis: 'Suggestion déterministe de test, non adoptée.',
    relatedIntentIds: [] };
}

function wizardFixtureTurn(journey: ReturnType<typeof createWizardJourney>, request: {
  request: import('../../functions/src/brewerHopAdviceSemanticV3').BrewerHopAdviceWizardRequestV3;
  wire: import('../../functions/src/brewerHopAdviceTransportV1').HopAdviceV1WizardWireInputV1;
}) {
  const evidence = { id: 'E-wizard-fixture', name: 'lookup_style_reference', label: 'Source fixture locale',
    facts: ['Référence de test synthétique.'], limits: ['Aucun fait de brassin réel.'], data: { origin: 'consumer87-fixture' } };
  const intent = wizardFixtureIntent('assist-intent-poire');
  const raw = {
    annotationReviews: [],
    propertyIntentProposals: [{ proposalId: 'assist-proposal-poire', kind: 'add', sourceAnnotationIds: [],
      intent, motive: 'Piste de test liée au fragment exact.' }],
    semanticRevisionProposals: [], openQuestions: [], materials: [],
    answer: { summary: 'Piste locale à relire.', readingNote: 'Fixture V6 uniquement.',
      options: [{ id: 'assist-option-document', kind: 'investigation', title: 'Examiner la préférence',
        rationale: 'Suggestion de test non appliquée.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [evidence.id] }],
      unknowns: [], program: { kind: 'none', note: 'Aucun programme appliqué.' }, refusals: [] },
    optionProposalLinks: [{ optionId: 'assist-option-document', proposalId: 'assist-proposal-poire', evidenceIds: [evidence.id] }],
  };
  const serverContext = { phase: 'planning', provenance: ['consumer87 fixture'], loadedAt: journey.context.now,
    binding: structuredClone(request.request.contextLaunch.expected) };
  const envelope = createBrewerHopAdviceProposalEnvelopeV6ForWizardV1({ request: request.request,
    prepared: journey.prepared, raw, evidence: [evidence], serverContext });
  const job: HopAdviceV1PublicJob = { protocol: HOP_ADVICE_PROTOCOL_V1.name, id: 'job:' + request.wire.operationId,
    operationId: request.wire.operationId, scope: structuredClone(request.wire.scope), generation: request.wire.generation,
    question: request.wire.question, label: 'Fixture Wizard V6', status: 'done', stage: 'saving',
    createdAt: Date.parse(recordedAt), updatedAt: Date.parse(recordedAt), finishedAt: Date.parse(recordedAt), attempt: 1 };
  const turn: HopAdviceV1PublicTurn = { protocol: HOP_ADVICE_PROTOCOL_V1.name, id: job.id,
    operationId: job.operationId, question: job.question, advice: { level: 'info', summary: 'Fixture V6', action: '',
      why: '', watch: '', question: '', evidenceIds: [evidence.id] }, evidence: [evidence], createdAt: Date.parse(recordedAt),
    model: 'V6 deterministic fixture', reviewed: true, contextLabel: 'Wizard fixture', mode: request.wire.analysisMode,
    hopAdviceProposal: envelope };
  return { job, turn, evidence, envelope };
}

class Consumer87WorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as HopV55WorkspaceEnvelopeV1;
    return JSON.stringify([row.ownerKey, row.workspaceId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('Duplicate workspace fixture key.');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
}

class Consumer87WorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new Consumer87WorkspaceTable();
  /** Fixture fault: abort the transaction after the repository's put, so only a real rollback avoids a partial effect. */
  failAfterWrite = false;
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const next = this.tail.then(async () => {
      const before = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
      try {
        const result = await work();
        if (this.failAfterWrite) throw new Error('fixture-transaction-abort-after-write');
        return result;
      }
      catch (error) { this.workspaces.rows = before; throw error; }
    });
    this.tail = next.then(() => undefined, () => undefined);
    return next;
  }
  close() { /* The root #67 Dexie proof covers IndexedDB/reopen; this test only isolates the consumer boundary. */ }
}

async function createConsumer87Repository(workspace: HopV55Workspace) {
  const database = new Consumer87WorkspaceDatabase();
  const base = createHopV55WorkspaceRepository({ ownerKey: workspace.ownerKey, database });
  await base.save({ ...structuredClone(workspace), revision: 0 }, null);
  const counters = { saves: 0, rejectTicketWrite: false };
  const repository = {
    list: (owner: string) => base.list(owner),
    read: (owner: string, id: string) => base.read(owner, id),
    save: async (next: HopV55Workspace, expectedRevision: number | null) => {
      counters.saves++;
      if (counters.rejectTicketWrite && (next.assistedSemanticAdviceTickets?.length ?? 0) > 0) throw new Error('fixture-ticket-cas-refused');
      return base.save(next, expectedRevision);
    },
    close: () => base.close(),
  };
  counters.saves = 0;
  return { repository, database, counters };
}

function createWizardHost(journey: ReturnType<typeof createWizardJourney>, repository: Awaited<ReturnType<typeof createConsumer87Repository>>['repository'],
  state: { actor: HopV55SemanticActorV1 | null; context: import('../../functions/src/companionTypes').BrewerContext;
    nowMs: number; currentReads: number; afterCurrentRead?: (count: number) => void }): HopV55SemanticAdoptionApplicationHostV1 {
  let id = 0;
  return createHopV55SemanticAdoptionApplicationHostV1({
    services: { ownerKey, workspaces: repository },
    readActor: () => state.actor && structuredClone(state.actor),
    readCurrentContext: async () => structuredClone(state.context),
    readCurrentWizardContext: async ({ origin }) => {
      state.currentReads++;
      state.afterCurrentRead?.(state.currentReads);
      const context = structuredClone(state.context);
      if (!context.recipe) throw new Error('La fixture live doit fournir le brouillon Wizard courant.');
      return { snapshot: canonicalizeHopV55RecipeDraft({ ownerKey: origin.ownerKey, draftId: origin.draftId, draft: context.recipe }),
        context, livePrepared: prepareBrewingScenarioContext(context) };
    },
    now: () => new Date(++state.nowMs).toISOString(),
    makeId: (kind, operationId) => `${kind}:${operationId ?? 'fixture'}:${++id}`,
  });
}

function createWizardFixtureRuntime(journey: ReturnType<typeof createWizardJourney>, repository: Awaited<ReturnType<typeof createConsumer87Repository>>['repository']) {
  const counters = { askCalls: 0, retryCalls: 0, statusCalls: 0, activityCalls: 0, ticketWasDurableBeforeAsk: false,
    wires: [] as HopAdviceV1WizardWireInputV1[] };
  let serverTurn: ReturnType<typeof wizardFixtureTurn> | undefined;
  let errorJob: HopAdviceV1PublicJob | undefined;
  let retried = false;
  const transport: BrewerHopAdviceV1CallableTransport = {
    async currentUserKey() { return ownerKey; },
    async invoke(name: BrewerHopAdviceV1CallableName, payload: unknown): Promise<unknown> {
      if (name === HOP_ADVICE_V1_FUNCTIONS.ask) {
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Fixture callable exige un wire objet.');
        const wire = payload as HopAdviceV1WizardWireInputV1;
        const workspace = await repository.read(ownerKey, workspaceId);
        const raw = workspace?.assistedSemanticAdviceTickets?.find(row => !!row && typeof row === 'object'
          && (row as { operationId?: unknown }).operationId === wire.operationId);
        const read = raw && readHopV55AssistedAdviceWizardTicketV1(raw);
        if (!read || read.status !== 'readOnly' || JSON.stringify(read.ticket.wire) !== JSON.stringify(wire)) {
          throw new Error('Fixture provider refused: exact Wizard ticket/wire was not durable before emission.');
        }
        counters.ticketWasDurableBeforeAsk = true;
        counters.askCalls++;
        counters.wires.push(structuredClone(wire));
        serverTurn = wizardFixtureTurn(journey, { request: read.ticket.request, wire: read.ticket.wire });
        errorJob = { ...serverTurn.job, status: 'error', stage: 'retry',
          error: { code: 'fixture-retry', message: 'Réessai déterministe du provider fixture.', retryable: true } };
        return { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: errorJob };
      }
      if (name === HOP_ADVICE_V1_FUNCTIONS.retry) {
        if (!serverTurn || !errorJob) throw new Error('Fixture retry sans job initial.');
        const request = payload as { jobId?: unknown; operationId?: unknown; generation?: unknown };
        if (request.operationId !== serverTurn.job.operationId || request.jobId !== errorJob.id
          || request.generation !== serverTurn.job.generation) throw new Error('Fixture retry différent du job Wizard exact.');
        counters.retryCalls++;
        retried = true;
        return { protocol: HOP_ADVICE_PROTOCOL_V1.name, turn: serverTurn.turn };
      }
      if (name === HOP_ADVICE_V1_FUNCTIONS.activity) {
        counters.activityCalls++;
        if (!serverTurn || !errorJob) return { protocol: HOP_ADVICE_PROTOCOL_V1.name, jobs: [] };
        const job = retried ? serverTurn.job : errorJob;
        return { protocol: HOP_ADVICE_PROTOCOL_V1.name, jobs: [job] };
      }
      if (name === HOP_ADVICE_V1_FUNCTIONS.conversation) {
        const request = payload as Record<string, unknown>;
        if (typeof request.operationId === 'string') {
          counters.statusCalls++;
          if (!serverTurn || !errorJob) return { protocol: HOP_ADVICE_PROTOCOL_V1.name };
          return retried ? { protocol: HOP_ADVICE_PROTOCOL_V1.name, turn: serverTurn.turn }
            : { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: errorJob };
        }
        return { protocol: HOP_ADVICE_PROTOCOL_V1.name, turns: serverTurn && retried ? [serverTurn.turn] : [], generation: 3,
          draft: journey.snapshotB.recipe };
      }
      throw new Error(`Callable inattendue dans la fixture Wizard: ${name}`);
    },
  };
  const api = createBrewerHopAdviceApiForWizardV1({ ownerKey, transport });
  const runtime = createBrewerHopAdviceApiRuntimeWizardV1({ ownerKey, workspaceId,
    scope: mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB), providerKind: 'fixture', api,
    readGeneration: async scope => scope.kind === 'draft' ? 3 : -1 });
  return { runtime, counters };
}

const adoptionSelection = [{ optionId: 'assist-option-document', proposalId: 'assist-proposal-poire', reason: 'Relire cette piste.' }];

/** Real host path up to sealed V6 plans: durable ticket before ask, retried turn received; previews write nothing. */
async function reachWizardPreviews(operationId: string, commandIds: readonly string[]) {
  const journey = createWizardJourney();
  const repo = await createConsumer87Repository(journey.workspace);
  const state: Parameters<typeof createWizardHost>[2] = { actor: { uid: ownerKey, displayName: 'Brasseur fixture' },
    context: structuredClone(journey.context), nowMs: Date.parse(recordedAt), currentReads: 0 };
  const host = createWizardHost(journey, repo.repository, state);
  const opened = await host.openWizardSession({ workspaceId, sourceReadingReference: journey.archiveB.contentReference,
    scopeAtPageLaunch: mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB), candidatePolicy });
  if (opened.status !== 'ready') throw new Error(`Session Wizard attendue : ${opened.status} ${opened.reason}`);
  const session = opened.session;
  const apiFixture = createWizardFixtureRuntime(journey, repo.repository);
  const entry = { operationId, question: session.request.question, scope: session.scope, generation: 3,
    analysisMode: 'auto' as const, hopAdvice: session.request, draft: session.snapshot.recipe };
  await session.submit({ entry, store: apiFixture.runtime.jobs });
  const received = await session.retry({ operationId, generation: entry.generation, store: apiFixture.runtime.jobs });
  if (received.status !== 'received' || apiFixture.counters.askCalls !== 1 || apiFixture.counters.retryCalls !== 1) {
    throw new Error(`Tour V6 Wizard attendu : ${received.status}; ask=${apiFixture.counters.askCalls}`);
  }
  const plans: unknown[] = [];
  for (const commandId of commandIds) {
    const preview = await session.preview({ operationId, commandId, recordId: `answer:${commandId}`,
      requestId: `request:${commandId}`, reason: 'Confirmer cette piste de test.', selection: adoptionSelection });
    if (preview.status !== 'ready') throw new Error(`Preview V6 Wizard refusé : ${preview.status} ${preview.reason}`);
    plans.push(preview.plan);
  }
  return { journey, repo, state, session, apiFixture, plans };
}

describe('consumer Wizard V1 → préparation et record Application V4', () => {
  it('utilise le brouillon B courant (même ID que Recipe A) et sépare origine, contenu et archive', () => {
    const journey = createWizardJourney();
    expect(mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceA))
      .toEqual(mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB));
    expect(journey.sourceA.contentReference).not.toBe(journey.sourceB.contentReference);
    expect(journey.sourceB.contentReference).toBe(journey.snapshotB.reference);
    expect(() => prepareInitialPropertyAdviceV4ForWizardV1({
      sourceReadingArchive: journey.archiveB, origin: journey.origin, snapshot: journey.snapshotA,
      ownerKey, workspaceId, prepared: journey.prepared,
      recordId: 'answer:wizard-wrong-snapshot', requestId: 'request:wizard-wrong-snapshot', candidatePolicy,
      cultureBinding: null,
      transition: { actId: 'act:wizard-wrong-snapshot', kind: 'create', reason: 'Contre-épreuve de lien source.',
        actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt },
      additions: [],
    })).toThrow();
    expect(journey.prepared.binding?.recipeReference).toBeTruthy();
    expect(journey.requestDraft.sourceReadingReference).toBe(journey.archiveB.contentReference);
    expect(journey.requestDraft.sourceReadingReference).not.toBe(journey.sourceB.contentReference);
    expect(journey.record.preparation.source).toEqual(journey.sourceB);
    expect(journey.record.sourceReadingReference).toBe(journey.archiveB.contentReference);
    expect(journey.record.originalQuestion).toBe(question);
  });

  it('scelle le source six champs dans le même format V4; le lecteur classique ne le promeut pas', () => {
    const { record } = createWizardJourney();
    expect(record.format).toBe(HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT);
    expect(Object.keys(record.preparation.source).sort()).toEqual(
      ['contentReference', 'draftId', 'format', 'kind', 'ownerKey', 'workspaceId']);
    expect(readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(record)).toMatchObject({ status: 'readOnly' });
    expect(readHopV55PropertyAdviceAnswerRecordV4(record)).toMatchObject({ status: 'unsupportedReadOnly' });
  });

  it('construit contextLaunch et Request3 depuis l’archive durable, le snapshot canonique et le Prepared live B', () => {
    const journey = createWizardJourney();
    const scope = mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB);
    const launch = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1({
      archiveWizard: journey.archiveB, workspace: journey.workspace, origin: journey.origin,
      snapshot: journey.snapshotB, scopeAtPageLaunch: scope, context: journey.context, livePrepared: journey.prepared,
    });
    if (launch.status !== 'ready') throw new Error(`Wizard launch refusé : ${launch.reason}`);
    expect(launch.status).toBe('ready');
    expect(launch.request.question).toBe(question);
    expect(launch.request.sourceReadingReference).toBe(journey.archiveB.contentReference);
    expect(launch.request.contextLaunch.scope).toEqual(scope);
    expect(launch.request.contextLaunch.source).toEqual(journey.sourceB);
    expect(launch.request.sourceView.archiveIdentity.source).toEqual(journey.sourceB);

    const built = buildHopV55AssistedSemanticAdviceRequestForWizardV1({
      current: { archiveWizard: journey.archiveB, workspace: journey.workspace, origin: journey.origin,
        snapshot: journey.snapshotB, scopeAtPageLaunch: scope, context: journey.context, livePrepared: journey.prepared },
      operationId: 'operation:wizard-b', generation: 0, analysisMode: 'auto',
    });
    expect(built.status).toBe('ready');
    if (built.status !== 'ready') return;
    expect(built.wire.hopAdvice).toEqual(built.request);
    expect(built.wire.scope).toEqual(scope);
    expect(built.wire.draft).toEqual(journey.snapshotB.recipe);
    expect(built.wire.draft).not.toEqual(journey.snapshotA.recipe);

    const journeyA = createWizardJourney('Recipe A déjà enregistrée', 20);
    const staleLive = prepareHopV55SemanticAssistedAdviceLaunchForWizardV1({
      archiveWizard: journeyA.archiveB, workspace: journeyA.workspace, origin: journeyA.origin,
      snapshot: journeyA.snapshotB, scopeAtPageLaunch: mapBrewerHopAdviceWizardSourceToScopeV1(journeyA.sourceB),
      context: journey.context, livePrepared: journey.prepared,
    });
    expect(staleLive.status).toBe('stale');
  });

  it('scelle le wire Wizard local avant envoi et relit un tour V6 exact sans conversion classic', () => {
    const journey = createWizardJourney();
    const scope = mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB);
    const current = { archiveWizard: journey.archiveB, workspace: journey.workspace, origin: journey.origin,
      snapshot: journey.snapshotB, scopeAtPageLaunch: scope, context: journey.context, livePrepared: journey.prepared };
    const built = buildHopV55AssistedSemanticAdviceRequestForWizardV1({ current, operationId: 'operation:wizard-ticket',
      generation: 3, analysisMode: 'auto' });
    if (built.status !== 'ready') throw new Error(`Request Wizard attendue : ${built.status}`);
    const principal: HopV55SemanticAdoptionPrincipalV1 = { principalId: ownerKey, ownerKey, workspaceId, scope,
      label: 'Brasseur fixture' };
    const captured = createHopV55AssistedAdviceWizardTicketV1({ id: 'ticket:wizard-request3', createdAt: recordedAt,
      principal, sourceArchive: built.sourceArchive, request: built.request, wire: built.wire, candidatePolicy });
    if (captured.status !== 'ready') throw new Error(`Ticket Wizard refusé : ${captured.status} ${'reason' in captured ? captured.reason : ''}`);
    const ticket = captured.ticket;
    expect(ticket.request).toEqual(built.request);
    expect(ticket.wire).toEqual(built.wire);
    expect(ticket.candidatePolicy).toEqual(candidatePolicy);
    expect(ticket.references.sourceArchiveReference).toBe(journey.archiveB.contentReference);
    expect(readHopV55AssistedAdviceWizardTicketV1(ticket)).toMatchObject({ status: 'readOnly' });
    expect(readHopV55AssistedAdviceTicketV2(ticket)).toMatchObject({ status: 'unsupportedReadOnly' });

    const wrongWire = structuredClone(built.wire);
    wrongWire.draft = journey.snapshotA.recipe;
    expect(createHopV55AssistedAdviceWizardTicketV1({ id: 'ticket:wizard-wrong-recipe', createdAt: recordedAt,
      principal, sourceArchive: built.sourceArchive, request: built.request, wire: wrongWire, candidatePolicy }).status).toBe('invalid');

    const response = wizardFixtureTurn(journey, built);
    expect(() => createHopV55AssistedAdviceWizardRecordV1({ id: 'record:wizard-before-ticket', recordedAt,
      principal, ticket, persistedTickets: [], job: response.job, turn: response.turn, fullEvidence: [response.evidence] })).toThrow();
    const record = createHopV55AssistedAdviceWizardRecordV1({ id: 'record:wizard-v6', recordedAt, principal,
      ticket, persistedTickets: [ticket], job: response.job, turn: response.turn, fullEvidence: [response.evidence] });
    const pair = readHopV55AssistedAdviceWizardArchiveV1({ ticket, record });
    expect(pair).toMatchObject({ status: 'readOnly', record: { semantic: { kind: 'verifiedV6' } } });
    expect(readHopV55AssistedAdviceArchiveV2({ ticket, record })).toMatchObject({ status: 'unsupportedReadOnly' });
  });

  it('persiste le ticket avant le provider fixture, réessaie le wire exact puis reprend le record sans second envoi', async () => {
    const journey = createWizardJourney();
    const repo = await createConsumer87Repository(journey.workspace);
    const state = { actor: { uid: ownerKey, displayName: 'Brasseur fixture' } as HopV55SemanticActorV1 | null,
      context: journey.context, nowMs: Date.parse(recordedAt), currentReads: 0 };
    const host = createWizardHost(journey, repo.repository, state);
    const opened = await host.openWizardSession({ workspaceId, sourceReadingReference: journey.archiveB.contentReference,
      scopeAtPageLaunch: mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB), candidatePolicy });
    if (opened.status !== 'ready') throw new Error(`Session Wizard attendue : ${opened.status} ${opened.reason}`);
    const session = opened.session;
    const apiFixture = createWizardFixtureRuntime(journey, repo.repository);
    const entry = { operationId: 'operation:wizard-retry', question: session.request.question, scope: session.scope,
      generation: 3, phase: 'advice', analysisMode: 'auto' as const, hopAdvice: session.request, draft: session.snapshot.recipe };

    repo.counters.rejectTicketWrite = true;
    const refusedBeforeSend = await session.submit({ entry, store: apiFixture.runtime.jobs });
    expect(refusedBeforeSend.status).toBe('invalid');
    expect(apiFixture.counters.askCalls).toBe(0);
    expect((await repo.repository.read(ownerKey, workspaceId))?.assistedSemanticAdviceTickets ?? []).toHaveLength(0);

    repo.counters.rejectTicketWrite = false;
    const first = await session.submit({ entry, store: apiFixture.runtime.jobs });
    if (first.status !== 'invalid' || apiFixture.counters.askCalls !== 1) {
      throw new Error(`Émission Wizard fixture attendue après ticket durable : ${first.status} ${'reason' in first ? first.reason : ''}; ask=${apiFixture.counters.askCalls}`);
    }
    expect(apiFixture.counters.ticketWasDurableBeforeAsk).toBe(true);
    expect(apiFixture.counters.wires).toHaveLength(1);
    const afterFirstSend = await repo.repository.read(ownerKey, workspaceId);
    expect(afterFirstSend?.assistedSemanticAdviceTickets).toHaveLength(1);
    const durableTicketRead = readHopV55AssistedAdviceWizardTicketV1(afterFirstSend!.assistedSemanticAdviceTickets![0]);
    expect(durableTicketRead).toMatchObject({ status: 'readOnly' });

    const retried = await session.retry({ operationId: entry.operationId, generation: entry.generation, store: apiFixture.runtime.jobs });
    expect(retried.status).toBe('received');
    if (retried.status !== 'received') throw new Error(`Réponse Wizard attendue après retry : ${retried.status}`);
    expect(retried.record.semantic).toMatchObject({ kind: 'verifiedV6' });
    expect(apiFixture.counters.retryCalls).toBe(1);
    expect(apiFixture.counters.wires).toHaveLength(1);
    expect(apiFixture.counters.wires[0]).toEqual(durableTicketRead.status === 'readOnly' ? durableTicketRead.ticket.wire : undefined);
    const afterRetry = await repo.repository.read(ownerKey, workspaceId);
    expect(afterRetry?.assistedSemanticAdviceRecords).toHaveLength(1);

    const resumedHost = createWizardHost(journey, repo.repository, state);
    const resumed = await resumedHost.resumeWizardSession({ workspaceId, operationId: entry.operationId });
    if (resumed.status !== 'ready') throw new Error(`Reprise Wizard attendue : ${resumed.status} ${resumed.reason}`);
    expect(resumed.session.resumedRecord?.reference).toBe(retried.record.reference);
    const recovered = await resumed.session.recover({ operationId: entry.operationId, store: apiFixture.runtime.jobs });
    expect(recovered.status).toBe('received');
    expect(apiFixture.counters.askCalls).toBe(1);
    expect(apiFixture.counters.retryCalls).toBe(1);
    expect((await repo.repository.read(ownerKey, workspaceId))?.assistedSemanticAdviceRecords).toHaveLength(1);

    const preview = await resumed.session.preview({ operationId: entry.operationId, commandId: 'command:wizard-preview',
      recordId: 'answer:wizard-preview', requestId: 'request:wizard-preview', reason: 'Confirmer cette piste de test.',
      selection: [{ optionId: 'assist-option-document', proposalId: 'assist-proposal-poire', reason: 'Relire cette piste.' }] });
    if (preview.status !== 'ready') throw new Error(`Preview V6 Wizard refusé : ${preview.status} ${preview.reason}`);
    expect(preview.preview.record.preparation.source).toEqual(journey.sourceB);
    expect(repo.counters.saves).toBe(3); // failed ticket CAS, successful ticket CAS, received record CAS; preview writes nothing.
    const committed = await resumed.session.confirm(preview.plan);
    if (committed.status !== 'committed') throw new Error(`Commit V6 Wizard refusé : ${committed.status} ${'reason' in committed ? committed.reason : ''}`);
    expect(committed.recipeEffect).toBe('none');
    const history = await resumed.session.readHistory(preview.plan.commandId);
    expect(history).toMatchObject({ status: 'readOnly', commit: { plan: { profile: 'wizardV1' } } });
    const replay = await resumed.session.confirm(preview.plan);
    expect(replay.status).toBe('replay');
    if (replay.status === 'replay') expect(replay.receipt.effectiveAt).toBe(committed.receipt.effectiveAt);
    expect(repo.counters.saves).toBe(4);
    expect(apiFixture.counters.askCalls).toBe(1);
    expect(apiFixture.counters.retryCalls).toBe(1);
  });

  it('refuse le ticket si le brouillon change entre les lectures pré-CAS', async () => {
    const journey = createWizardJourney();
    const repo = await createConsumer87Repository(journey.workspace);
    const state = { actor: { uid: ownerKey, displayName: 'Brasseur fixture' } as HopV55SemanticActorV1 | null,
      context: structuredClone(journey.context), nowMs: Date.parse(recordedAt), currentReads: 0,
      afterCurrentRead: (count: number) => {
        if (count === 3 && state.context.recipe) state.context.recipe.volumeL += 1;
      } };
    const host = createWizardHost(journey, repo.repository, state);
    const opened = await host.openWizardSession({ workspaceId, sourceReadingReference: journey.archiveB.contentReference,
      scopeAtPageLaunch: mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB), candidatePolicy });
    if (opened.status !== 'ready') throw new Error(`Session Wizard attendue : ${opened.status} ${opened.reason}`);
    const apiFixture = createWizardFixtureRuntime(journey, repo.repository);
    const entry = { operationId: 'operation:wizard-stale-source', question: opened.session.request.question,
      scope: opened.session.scope, generation: 3, analysisMode: 'auto' as const,
      hopAdvice: opened.session.request, draft: opened.session.snapshot.recipe };
    const refused = await opened.session.submit({ entry, store: apiFixture.runtime.jobs });
    expect(refused.status).toBe('stale');
    expect(apiFixture.counters.askCalls).toBe(0);
    expect((await repo.repository.read(ownerKey, workspaceId))?.assistedSemanticAdviceTickets ?? []).toHaveLength(0);
    expect(repo.counters.saves).toBe(0);
  });

  it('refuse ticket et émission si l’acteur change pendant la lecture live Wizard', async () => {
    const journey = createWizardJourney();
    const repo = await createConsumer87Repository(journey.workspace);
    const state = { actor: { uid: ownerKey, displayName: 'Brasseur fixture' } as HopV55SemanticActorV1 | null,
      context: journey.context, nowMs: Date.parse(recordedAt), currentReads: 0,
      afterCurrentRead: (count: number) => { if (count === 2) state.actor = { uid: 'owner:autre-acteur' }; } };
    const host = createWizardHost(journey, repo.repository, state);
    const opened = await host.openWizardSession({ workspaceId, sourceReadingReference: journey.archiveB.contentReference,
      scopeAtPageLaunch: mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB), candidatePolicy });
    if (opened.status !== 'ready') throw new Error(`Session Wizard attendue : ${opened.status} ${opened.reason}`);
    const apiFixture = createWizardFixtureRuntime(journey, repo.repository);
    const entry = { operationId: 'operation:wizard-actor-change', question: opened.session.request.question,
      scope: opened.session.scope, generation: 3, analysisMode: 'auto' as const,
      hopAdvice: opened.session.request, draft: opened.session.snapshot.recipe };
    const refused = await opened.session.submit({ entry, store: apiFixture.runtime.jobs });
    expect(refused.status).toBe('unavailable');
    expect(apiFixture.counters.askCalls).toBe(0);
    expect((await repo.repository.read(ownerKey, workspaceId))?.assistedSemanticAdviceTickets ?? []).toHaveLength(0);
    expect(repo.counters.saves).toBe(0);
  });

  it('refuse une source V1 connue corrompue même si le record a été rescellé', () => {
    const { record } = createWizardJourney();
    const tampered = structuredClone(record) as unknown as Record<string, unknown>;
    const preparation = tampered.preparation as Record<string, unknown>;
    const source = preparation.source as Record<string, unknown>;
    source.contentReference = 'not-a-canonical-recipe-reference';
    expect(() => readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(resealRecord(tampered))).toThrow();
  });

  it('révise le record V4 exact et garde l’archive A historique sous le Prepared courant B', () => {
    const journeyB = createWizardJourney();
    const parentSnapshot = structuredClone(journeyB.record);
    const revised = prepareCorrectionV4ForWizardV1({
      sourceRecord: journeyB.record,
      sourceReadingArchive: journeyB.archiveB,
      origin: journeyB.origin,
      snapshot: journeyB.snapshotB,
      prepared: journeyB.prepared,
      recordId: 'answer:wizard-b-revision',
      requestId: 'request:wizard-b-revision',
      transition: { actId: 'act:wizard-b-revision', kind: 'revise',
        parentRecordReference: journeyB.record.reference, parentReadingReference: journeyB.archiveB.contentReference,
        reason: 'Révision explicite de cette lecture.', actor: { origin: 'user', label: 'Brasseur fixture' },
        recordedAt: '2026-10-05T12:05:00.000Z' },
      actions: [],
    });
    expect(revised.status).toBe('ready');
    if (revised.status !== 'ready') return;
    expect(revised.recordDraft.preparation.source).toEqual(journeyB.sourceB);

    const journeyA = createWizardJourney('Recipe A déjà enregistrée', 20);
    const historicalA = structuredClone(journeyA.record);
    const parser = vi.spyOn(semanticReading, 'readHopV55QuestionSemanticV1');
    const readAUnderB = resumeV4ForWizardV1({ record: journeyA.record, sourceReadingArchive: journeyA.archiveB,
      origin: journeyA.origin, snapshot: journeyA.snapshotB, prepared: journeyB.prepared });
    expect(readAUnderB.status).toBe('stale');
    expect(readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(journeyA.record)).toMatchObject({ status: 'readOnly' });
    expect(journeyA.record).toEqual(historicalA);
    expect(parser).not.toHaveBeenCalled();
    parser.mockRestore();
    expect(journeyB.record).toEqual(parentSnapshot);
  });

  it('préserve un enfant Wizard futur après validation du sceau, sans le rendre adoptable', () => {
    const { record } = createWizardJourney();
    const future = structuredClone(record) as unknown as Record<string, unknown>;
    const preparation = future.preparation as Record<string, unknown>;
    const source = preparation.source as Record<string, unknown>;
    source.format = 'hop-v55-wizard-source-v2';
    const resealed = resealRecord(future);
    expect(readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(resealed)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: { format: HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT },
    });
    expect(readHopV55PropertyAdviceAnswerRecordV4(resealed)).toMatchObject({ status: 'unsupportedReadOnly' });
  });

  it('admet le V4 Wizard par le dispatcher documentaire moderne strict; le dispatcher classique reste épinglé', () => {
    const { record } = createWizardJourney();
    expect(readHopV55DocumentaryAnswerRecordWithWizardV1(record)).toMatchObject({
      status: 'readOnly', version: 'v4', profile: 'wizardV1', record: { reference: record.reference } });
    expect(readHopV55DocumentaryAnswerRecord(record)).toMatchObject({ status: 'unsupportedReadOnly' });
    const corrupt = structuredClone(record) as unknown as Record<string, unknown>;
    ((corrupt.preparation as Record<string, unknown>).source as Record<string, unknown>).contentReference = 'not-a-canonical-recipe-reference';
    expect(() => readHopV55DocumentaryAnswerRecordWithWizardV1(resealRecord(corrupt))).toThrow();
    const future = structuredClone(record) as unknown as Record<string, unknown>;
    ((future.preparation as Record<string, unknown>).source as Record<string, unknown>).format = 'hop-v55-wizard-source-v2';
    expect(readHopV55DocumentaryAnswerRecordWithWizardV1(resealRecord(future))).toMatchObject({ status: 'unsupportedReadOnly' });
    expect(readHopV55DocumentaryAnswerRecord(resealRecord(future))).toMatchObject({ status: 'unsupportedReadOnly' });
  });

  it('ajoute la réponse V4 Wizard stricte par CAS du dépôt, refuse le corrompu sans écriture et garde le futur opaque non remplaçable', async () => {
    const journey = createWizardJourney();
    const repo = await createConsumer87Repository(journey.workspace);
    const stored = await repo.repository.read(ownerKey, workspaceId);
    if (!stored) throw new Error('Workspace Wizard fixture absent.');
    const corrupt = structuredClone(journey.record) as unknown as Record<string, unknown>;
    ((corrupt.preparation as Record<string, unknown>).source as Record<string, unknown>).contentReference = 'not-a-canonical-recipe-reference';
    const corruptRow = resealRecord(corrupt) as { format: string; [key: string]: unknown };
    await expect(repo.repository.save({ ...stored, documentaryAnswers: [corruptRow] }, stored.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
    expect((await repo.repository.read(ownerKey, workspaceId))?.revision).toBe(stored.revision);

    const saved = await repo.repository.save({ ...stored, documentaryAnswers: [journey.record] }, stored.revision);
    expect(saved.revision).toBe(stored.revision + 1);
    const reread = await repo.repository.read(ownerKey, workspaceId);
    expect(reread?.documentaryAnswers).toEqual([journey.record]);
    expect(reread?.copies).toEqual([]);
    expect(reread?.sourceRecipeId).toBeUndefined();
    expect(reread?.wizardSourceSnapshots).toEqual(stored.wizardSourceSnapshots);

    const future = structuredClone(journey.record) as unknown as Record<string, unknown>;
    ((future.preparation as Record<string, unknown>).source as Record<string, unknown>).format = 'hop-v55-wizard-source-v2';
    const futureRow = resealRecord(future) as { format: string; [key: string]: unknown };
    const futureRepo = await createConsumer87Repository({ ...journey.workspace, documentaryAnswers: [futureRow] });
    const futureStored = await futureRepo.repository.read(ownerKey, workspaceId);
    if (!futureStored) throw new Error('Workspace Wizard futur absent.');
    expect(futureStored.documentaryAnswers).toEqual([futureRow]);
    await expect(futureRepo.repository.save({ ...futureStored, documentaryAnswers: [futureRow, journey.record] },
      futureStored.revision)).rejects.toMatchObject({ code: 'unsupportedFormat' });
    expect((await futureRepo.repository.read(ownerKey, workspaceId))?.documentaryAnswers).toEqual([futureRow]);
  });

  it('confirme atomiquement après refus frais et panne, relit et rejoue le reçu exact sous un brouillon modifié, refuse une tête périmée', async () => {
    const { journey, repo, state, session, apiFixture, plans } = await reachWizardPreviews('operation:wizard-commit',
      ['command:wizard-first', 'command:wizard-second']);
    const [firstPlan, secondPlan] = plans;
    const before = await repo.repository.read(ownerKey, workspaceId);
    if (!before) throw new Error('Workspace Wizard absent après réception.');
    const expectNoEffect = async () => {
      const current = await repo.repository.read(ownerKey, workspaceId);
      expect(current?.revision).toBe(before.revision);
      expect(current?.documentaryAnswers ?? []).toHaveLength(0);
      expect(current?.semanticAdoptionCommits ?? []).toHaveLength(0);
    };

    // Live Wizard B changes after the preview: the first adoption is stale and writes nothing.
    state.context.recipe!.volumeL += 1;
    expect((await session.confirm(firstPlan)).status).toBe('stale');
    state.context.recipe!.volumeL -= 1;
    await expectNoEffect();

    // The actor changes during the fresh live read: no answer, commit or receipt.
    state.afterCurrentRead = () => { state.actor = { uid: 'owner:autre-acteur' }; };
    const actorChanged = await session.confirm(firstPlan);
    expect(['committed', 'replay']).not.toContain(actorChanged.status);
    state.afterCurrentRead = undefined;
    state.actor = { uid: ownerKey, displayName: 'Brasseur fixture' };
    await expectNoEffect();

    // Transaction abort after the put: the answer and its commit roll back together.
    repo.database.failAfterWrite = true;
    const faulted = await session.confirm(firstPlan);
    repo.database.failAfterWrite = false;
    expect(faulted.status).toBe('invalid');
    await expectNoEffect();

    const committed = await session.confirm(firstPlan);
    if (committed.status !== 'committed') throw new Error(`Commit V6 Wizard refusé : ${committed.status} ${'reason' in committed ? committed.reason : ''}`);
    expect(committed.recipeEffect).toBe('none');
    expect(committed.record.preparation.source).toEqual(journey.sourceB);
    const durable = await repo.repository.read(ownerKey, workspaceId);
    expect(durable?.revision).toBe(before.revision + 1);
    expect(durable?.documentaryAnswers).toEqual([committed.record]);
    expect(durable?.semanticAdoptionCommits).toHaveLength(1);
    expect(durable?.copies).toEqual([]);
    expect(durable?.sourceRecipeId).toBeUndefined();
    expect(durable?.wizardSourceSnapshots).toEqual(before.wizardSourceSnapshots);

    // History and replay stay those of the committed command, even under a modified live draft.
    state.context.recipe!.volumeL += 1;
    const liveReads = state.currentReads;
    const saves = repo.counters.saves;
    const history = await session.readHistory('command:wizard-first');
    expect(history).toMatchObject({ status: 'readOnly', record: { reference: committed.record.reference },
      commit: { plan: { profile: 'wizardV1' }, receipt: { effectiveAt: committed.receipt.effectiveAt } } });
    const replay = await session.confirm(firstPlan);
    if (replay.status !== 'replay') throw new Error(`Replay Wizard attendu : ${replay.status}`);
    expect(replay.receipt).toEqual(committed.receipt);
    expect(state.currentReads).toBe(liveReads);
    expect(repo.counters.saves).toBe(saves);
    state.context.recipe!.volumeL -= 1;

    // A second plan sealed on the empty head is refused once that head exists: no rebase, no second effect.
    expect((await session.confirm(secondPlan)).status).toBe('stale');
    const final = await repo.repository.read(ownerKey, workspaceId);
    expect(final?.revision).toBe(durable?.revision);
    expect(final?.documentaryAnswers).toEqual([committed.record]);
    expect(final?.semanticAdoptionCommits).toHaveLength(1);
    expect(apiFixture.counters.askCalls).toBe(1);
    expect(apiFixture.counters.retryCalls).toBe(1);
  });
});

describe('validation de l’imbrication V3 avant préservation Wizard future', () => {
  it('refuse une réponse V3 connue corrompue sous une source Wizard future, tout en gardant le futur intact en lecture seule', () => {
    const { record } = createWizardJourney();

    const intactFuture = structuredClone(record) as unknown as Record<string, unknown>;
    const intactPreparation = intactFuture.preparation as Record<string, unknown>;
    const intactSource = intactPreparation.source as Record<string, unknown>;
    intactSource.format = 'hop-v55-wizard-source-v2';
    const intactFutureRecord = resealRecord(intactFuture);
    const preserved = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(intactFutureRecord);
    expect(preserved).toMatchObject({ status: 'unsupportedReadOnly', snapshot: intactFutureRecord });
    if (preserved.status !== 'unsupportedReadOnly') throw new Error('Le profil futur doit rester opaque et conservé.');
    expect(preserved.snapshot).toEqual(intactFutureRecord);

    const malformedFuture = structuredClone(record) as unknown as Record<string, unknown>;
    const preparation = malformedFuture.preparation as Record<string, unknown>;
    const source = preparation.source as Record<string, unknown>;
    source.format = 'hop-v55-wizard-source-v2';
    const outcome = malformedFuture.outcome as Record<string, unknown>;
    const answer = outcome.answerSnapshot as Record<string, unknown>;
    const coverage = answer.coverage as Record<string, unknown>;
    coverage.status = 'invalid-known-v3-status';
    const answerReference = hopPropertyAdviceAnswerReferenceV3(
      answer as unknown as Parameters<typeof hopPropertyAdviceAnswerReferenceV3>[0],
    );
    answer.reference = answerReference;
    outcome.answerReference = answerReference;
    const malformedFutureRecord = resealRecord(malformedFuture);

    expect(() => readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(malformedFutureRecord))
      .toThrow(/Statut ou points de couverture inconnus/u);
    expect(() => readHopV55DocumentaryAnswerRecordWithWizardV1(malformedFutureRecord))
      .toThrow(/Statut ou points de couverture inconnus/u);
  });
});
describe('ledger V4 future et snapshot de domaine connu', () => {
  it('rejette un V3 connu corrompu avant le ledger futur et conserve le V3 intact en opaque', () => {
    const { record } = createWizardJourney();
    const corruptFuture = structuredClone(record) as unknown as Record<string, unknown>;
    const ledger = corruptFuture.ledger as Record<string, unknown>;
    ledger.format = 'hop-v55-property-advice-annotation-ledger-v2';
    const outcome = corruptFuture.outcome as Record<string, unknown>;
    const answer = outcome.answerSnapshot as Record<string, unknown>;
    const coverage = answer.coverage as Record<string, unknown>;
    coverage.status = 'invalid-known-v3-status';
    const answerReference = hopPropertyAdviceAnswerReferenceV3(
      answer as unknown as Parameters<typeof hopPropertyAdviceAnswerReferenceV3>[0],
    );
    answer.reference = answerReference;
    outcome.answerReference = answerReference;
    const corruptRow = resealRecord(corruptFuture);
    expect(() => readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(corruptRow))
      .toThrow(/Statut ou points de couverture inconnus/u);
    expect(() => readHopV55DocumentaryAnswerRecordWithWizardV1(corruptRow))
      .toThrow(/Statut ou points de couverture inconnus/u);

    const intactFuture = structuredClone(record) as unknown as Record<string, unknown>;
    (intactFuture.ledger as Record<string, unknown>).format = 'hop-v55-property-advice-annotation-ledger-v2';
    const intactRow = resealRecord(intactFuture);
    const preserved = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(intactRow);
    expect(preserved).toMatchObject({ status: 'unsupportedReadOnly', snapshot: intactRow });
    if (preserved.status !== 'unsupportedReadOnly') throw new Error('Le ledger V4 futur doit rester opaque.');
    expect(preserved.snapshot).toEqual(intactRow);
    expect(readHopV55DocumentaryAnswerRecordWithWizardV1(intactRow))
      .toMatchObject({ status: 'unsupportedReadOnly', snapshot: intactRow });
  });

  it('préserve un ledger futur sans tableau entries sans l’itérer', () => {
    const { record } = createWizardJourney();
    const future = structuredClone(record) as unknown as Record<string, unknown>;
    const ledger = future.ledger as Record<string, unknown>;
    ledger.format = 'hop-v55-property-advice-annotation-ledger-v2';
    delete ledger.entries;
    const futureRow = resealRecord(future);
    const preserved = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(futureRow);
    expect(preserved).toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureRow });
    if (preserved.status !== 'unsupportedReadOnly') throw new Error('Le ledger futur incomplet doit rester opaque.');
    expect(preserved.snapshot).toEqual(futureRow);
    expect(readHopV55DocumentaryAnswerRecordWithWizardV1(futureRow))
      .toMatchObject({ status: 'unsupportedReadOnly', snapshot: futureRow });
  });
});

describe('contrôle de tête après une révision Wizard V4', () => {
  it('confirme une révision sur la tête V4 exacte puis refuse un second plan devenu périmé', async () => {
    const journey = createWizardJourney();
    journey.workspace.documentaryAnswers = [journey.record];
    const repo = await createConsumer87Repository(journey.workspace);
    const state: Parameters<typeof createWizardHost>[2] = {
      actor: { uid: ownerKey, displayName: 'Brasseur fixture' },
      context: structuredClone(journey.context), nowMs: Date.parse(recordedAt), currentReads: 0,
    };
    const host = createWizardHost(journey, repo.repository, state);
    const scope = mapBrewerHopAdviceWizardSourceToScopeV1(journey.sourceB);
    const opened = await host.openWizardSession({ workspaceId,
      sourceReadingReference: journey.archiveB.contentReference, scopeAtPageLaunch: scope, candidatePolicy });
    if (opened.status !== 'ready') throw new Error(`Session Wizard V4 attendue : ${opened.status} ${opened.reason}`);
    const session = opened.session;
    const apiFixture = createWizardFixtureRuntime(journey, repo.repository);
    const entry = { operationId: 'operation:wizard-revision-head', question: session.request.question, scope,
      generation: 3, analysisMode: 'auto' as const, hopAdvice: session.request, draft: session.snapshot.recipe };
    await session.submit({ entry, store: apiFixture.runtime.jobs });
    const received = await session.retry({ operationId: entry.operationId, generation: entry.generation, store: apiFixture.runtime.jobs });
    if (received.status !== 'received') throw new Error(`Tour V6 attendu : ${received.status}`);

    const firstPreview = await session.preview({ operationId: entry.operationId, commandId: 'command:revision-head-first',
      recordId: 'answer:revision-head-first', requestId: 'request:revision-head-first',
      reason: 'Réviser le dossier Wizard exact.', selection: adoptionSelection });
    const secondPreview = await session.preview({ operationId: entry.operationId, commandId: 'command:revision-head-second',
      recordId: 'answer:revision-head-second', requestId: 'request:revision-head-second',
      reason: 'Contre-épreuve de tête périmée.', selection: adoptionSelection });
    if (firstPreview.status !== 'ready' || secondPreview.status !== 'ready') {
      throw new Error(`Deux previews V4 attendues : ${firstPreview.status}/${secondPreview.status}`);
    }
    const canonicalHead = { kind: 'recordV4', reference: journey.record.reference,
      ledgerReference: journey.record.ledger.reference };
    expect(firstPreview.plan.expectedHead).toEqual(canonicalHead);
    expect(secondPreview.plan.expectedHead).toEqual(canonicalHead);
    expect(firstPreview.plan.expectedHead).not.toHaveProperty('record');

    const savesBeforeFirstConfirm = repo.counters.saves;
    const committed = await session.confirm(firstPreview.plan);
    if (committed.status !== 'committed') {
      const unchanged = await repo.repository.read(ownerKey, workspaceId);
      expect(unchanged?.documentaryAnswers).toEqual([journey.record]);
      expect(unchanged?.semanticAdoptionCommits ?? []).toHaveLength(0);
      expect(repo.counters.saves).toBe(savesBeforeFirstConfirm);
      throw new Error(`Révision V4 de la tête courante refusée : ${committed.status} ${'reason' in committed ? committed.reason : ''}`);
    }
    expect(committed.record.transition).toMatchObject({ kind: 'revise',
      parentRecordReference: journey.record.reference, parentReadingReference: journey.archiveB.contentReference });
    const revised = await repo.repository.read(ownerKey, workspaceId);
    expect(revised?.revision).toBeGreaterThan(0);
    expect(revised?.documentaryAnswers).toEqual([journey.record, committed.record]);
    expect(revised?.semanticAdoptionCommits).toHaveLength(1);
    expect(committed.recipeEffect).toBe('none');

    const savesBeforeStale = repo.counters.saves;
    const stale = await session.confirm(secondPreview.plan);
    expect(stale.status).toBe('stale');
    const afterStale = await repo.repository.read(ownerKey, workspaceId);
    expect(afterStale?.revision).toBe(revised?.revision);
    expect(afterStale?.documentaryAnswers).toEqual([journey.record, committed.record]);
    expect(afterStale?.semanticAdoptionCommits).toHaveLength(1);
    expect(repo.counters.saves).toBe(savesBeforeStale);
    expect(apiFixture.counters.askCalls).toBe(1);
    expect(apiFixture.counters.retryCalls).toBe(1);
  });
});