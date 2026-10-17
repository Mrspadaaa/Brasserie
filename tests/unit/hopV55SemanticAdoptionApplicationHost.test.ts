// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { BrewerContext, BrewerEvidence } from '../../functions/src/companionTypes';
import {
  HOP_ADVICE_PROTOCOL_V1, buildHopAdviceV1WireV3,
  HOP_ADVICE_V1_FUNCTIONS,
  type HopAdviceV1ClientEntryV3, type HopAdviceV1PublicJob, type HopAdviceV1PublicTurn,
  type HopAdviceV1WireInputV3,
} from '../../functions/src/brewerHopAdviceTransportV1';
import { mapBrewerHopAdviceLaunchSourceToScopeV1 } from '../../functions/src/brewerHopAdviceContextBinding';
import { createBrewerHopAdviceProposalEnvelopeV6 } from '../../functions/src/brewerHopAdviceSemanticV6';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { HopPropertyAdviceCandidatePolicy } from '../../src/domain/hopDecision/propertyAdviceSchema';
import type { HopV55Workspace, HopV55WorkspaceRepository } from '../../src/services/hopV55/contracts';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { createHopV55DecisionReadingArchiveV4, readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import { createHopV55AssistedAdviceTicketV2, readHopV55AssistedAdviceTicketV2 } from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';
import { brewerAdviceFromSemanticProposalV5 } from '../../functions/src/brewerHopAdviceSemanticAdapter';
import { createBrewerHopAdviceApiV3, type BrewerHopAdviceApiV3 } from '../../src/services/brewerHopAdviceApi';
import { createBrewerHopAdviceApiRuntimeV3 } from '../../src/services/brewerHopAdviceRuntimeAdapter';
import { createHopV55SemanticJobStoreV3, type HopV55SemanticJobSendInputV3, brewerJobs } from '../../src/services/brewerJobs';
import { createBrewerHopAdviceSemanticRuntimeV3, hopAdviceSemanticV3ClientPartitionKey } from '../../src/services/brewerHopAdviceRuntime';
import { BrewerChat } from '../../src/ui/BrewerChat';
import {
  createHopV55SemanticAdoptionApplicationHostV1,
  HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT,
  type HopV55SemanticAdoptionApplicationHostV1,
  type HopV55SemanticActorV1,
  type HopV55SemanticJobSnapshotV3,
  type HopV55SemanticJobStoreV3,
  type HopV55SemanticWorkspaceAuthorityV1,
} from '../../src/services/hopV55/semanticAdoptionApplicationHost';

// This map-backed database adapter exercises the real #67 repository validators/CAS code.
// It is intentionally not Dexie and is not reported as the real IndexedDB proof.
class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as HopV55WorkspaceEnvelopeV1;
    return JSON.stringify([row.ownerKey, row.workspaceId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('Duplicate workspace fixture key');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
}
class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const next = this.tail.then(async () => {
      const before = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows = before; throw error; }
    });
    this.tail = next.then(() => undefined, () => undefined);
    return next;
  }
  close() { /* The adapter is memory-only; Dexie/reopen was independently received under #67. */ }
}

const OWNER = 'owner:semantic-host-68-fixture';
const WORKSPACE = 'workspace:semantic-host-68-fixture';
const RECORDED_AT = '2026-10-05T10:00:00.000Z';
const QUESTION = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const POLICY: HopPropertyAdviceCandidatePolicy = {
  kind: 'explicit', materialIds: [], basis: 'Aucune matière choisie explicitement dans la fixture V3.',
};
const evidence: BrewerEvidence = {
  id: 'E1', name: 'lookup_style_reference', label: 'Source fixture locale',
  facts: ['Document fixture de test.'], limits: ['Ne prouve aucun fait de brassin.'], data: { origin: 'test-fixture' },
};
afterEach(() => cleanup());

interface ScenarioFixture {
  context: BrewerContext;
  archive: ReturnType<typeof createHopV55DecisionReadingArchiveV4>;
  workspace: HopV55Workspace;
  scope: ReturnType<typeof mapBrewerHopAdviceLaunchSourceToScopeV1>;
}
function makeScenarioFixture(): ScenarioFixture {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const recipeId = context.recipe?.id;
  if (!recipeId) throw new Error('La fixture doit contenir une Recipe source.');
  const reading = readHopV55QuestionSemanticV1(QUESTION, prepared);
  const archive = createHopV55DecisionReadingArchiveV4({
    id: 'reading:semantic-host-68-fixture', ownerKey: OWNER, workspaceId: WORKSPACE,
    recordedAt: RECORDED_AT, reading, source: { kind: 'recipe', id: recipeId },
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
  });
  const scope = mapBrewerHopAdviceLaunchSourceToScopeV1(OWNER, WORKSPACE, archive.source);
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: WORKSPACE, ownerKey: OWNER, revision: 0,
    title: 'Fixture locale #68', intent: { question: QUESTION, criteria: [] }, sourceRecipeId: recipeId,
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: RECORDED_AT,
  };
  return { context, archive, workspace, scope };
}

interface TestRepository {
  repository: HopV55WorkspaceRepository;
  database: MemoryWorkspaceDatabase;
  saves: { count: number; rejectTicketAppend: boolean };
}
async function makeRepository(workspace: HopV55Workspace): Promise<TestRepository> {
  const database = new MemoryWorkspaceDatabase();
  const base = createHopV55WorkspaceRepository({ ownerKey: workspace.ownerKey, database });
  await base.save({ ...structuredClone(workspace), revision: 0 }, null);
  const saves = { count: 0, rejectTicketAppend: false };
  const repository: HopV55WorkspaceRepository = {
    list: ownerKey => base.list(ownerKey),
    read: (ownerKey, id) => base.read(ownerKey, id),
    save: async (next, expectedRevision) => {
      saves.count++;
      if (saves.rejectTicketAppend && (next.assistedSemanticAdviceTickets?.length ?? 0) > 0) {
        throw new Error('fixture-ticket-cas-refused');
      }
      return base.save(next, expectedRevision);
    },
    close: () => base.close(),
  };
  saves.count = 0;
  return { repository, database, saves };
}

interface MutableHostState {
  actor: HopV55SemanticActorV1 | null;
  context: BrewerContext;
  contextReads: number;
  nowMs: number;
  onContextRead?: (count: number) => void;
}
function createHost(f: ScenarioFixture, state: MutableHostState, repository: HopV55WorkspaceRepository): HopV55SemanticAdoptionApplicationHostV1 {
  let id = 0;
  return createHopV55SemanticAdoptionApplicationHostV1({
    services: { ownerKey: OWNER, workspaces: repository },
    readActor: () => state.actor && structuredClone(state.actor),
    readCurrentContext: async () => { state.contextReads++; state.onContextRead?.(state.contextReads); return structuredClone(state.context); },
    now: () => new Date(++state.nowMs).toISOString(),
    makeId: (kind, operationId) => kind + ':' + (operationId ?? 'host') + ':' + (++id),
  });
}
async function openSession(host: HopV55SemanticAdoptionApplicationHostV1, f: ScenarioFixture) {
  const opened = await host.openSession({ workspaceId: WORKSPACE, sourceReadingReference: f.archive.contentReference,
    scopeAtPageLaunch: f.scope, candidatePolicy: POLICY });
  if (opened.status !== 'ready') throw new Error('Session V3 attendue : ' + opened.status + ' ' + opened.reason);
  return opened.session;
}
function clientEntry(session: Awaited<ReturnType<typeof openSession>>, operationId = 'operation-semantic-host-6801'): HopAdviceV1ClientEntryV3 {
  return { operationId, question: session.request.question, scope: session.scope, generation: 3,
    analysisMode: 'auto', hopAdvice: session.request };
}
function fixtureIntent(fragment: string, id: string) {
  const start = QUESTION.indexOf(fragment);
  if (start < 0) throw new Error('Fragment V6 fixture absent de la question exacte.');
  return { id, property: 'aroma' as const, label: fragment, role: 'preference' as const, direction: null,
    qualification: null, required: false, comparisonBasis: { kind: 'none' as const, assertionIds: [] as string[] },
    metric: 'sensory' as const, subject: { kind: 'beer' as const, label: 'Bière fixture', materialId: null, sensoryContext: 'beer' as const },
    sourceSpans: [{ start, end: start + fragment.length, text: fragment }], basis: 'Proposition V6 synthétique de test.', relatedIntentIds: [] as string[] };
}

function fixturePublicTurn(f: ScenarioFixture, wire: HopAdviceV1WireInputV3): { job: HopAdviceV1PublicJob; turn: HopAdviceV1PublicTurn } {
  const prepared = prepareBrewingScenarioContext(f.context);
  const raw = {
    annotationReviews: [],
    propertyIntentProposals: [{ proposalId: 'assist-proposal-resin-note', kind: 'add', sourceAnnotationIds: [],
      intent: fixtureIntent('odeur résineuse', 'assist-intent-resin-note'), motive: 'Piste fixture explicite, à confirmer.' }],
    semanticRevisionProposals: [], openQuestions: [], materials: [],
    answer: { summary: 'Piste de démonstration locale.', readingNote: 'Fixture V6; aucune conclusion brassicole réelle.',
      options: [{ id: 'assist-option-document', kind: 'investigation', title: 'Documenter la piste',
        rationale: 'Source de test sans affirmation physique.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [evidence.id] }],
      unknowns: [], program: { kind: 'none', note: 'Aucun programme appliqué par cette fixture.' }, refusals: [] },
    optionProposalLinks: [{ optionId: 'assist-option-document', proposalId: 'assist-proposal-resin-note', evidenceIds: [evidence.id] }],
  };
  const serverContext = { phase: f.context.phase, provenance: [...(f.context.provenance ?? [])], loadedAt: f.context.now,
    binding: structuredClone(wire.hopAdvice.contextLaunch.expected) };
  const envelope = createBrewerHopAdviceProposalEnvelopeV6({ request: wire.hopAdvice, prepared, raw, evidence: [evidence], serverContext });
  const job: HopAdviceV1PublicJob = { id: 'job:' + wire.operationId, operationId: wire.operationId,
    scope: structuredClone(wire.scope), generation: wire.generation ?? 0, question: wire.question,
    label: 'Fixture V6 locale', status: 'done', stage: 'saving', createdAt: Date.parse(RECORDED_AT),
    updatedAt: Date.parse(RECORDED_AT), finishedAt: Date.parse(RECORDED_AT), attempt: 1,
    protocol: HOP_ADVICE_PROTOCOL_V1.name };
  const turn: HopAdviceV1PublicTurn = { id: job.id, operationId: job.operationId, question: job.question,
    advice: brewerAdviceFromSemanticProposalV5(envelope.proposal), evidence: [structuredClone(evidence)],
    createdAt: Date.parse(RECORDED_AT), model: 'V6 fixture locale', reviewed: true, mode: wire.analysisMode,
    contextLabel: 'Fixture · V6 sémantique', protocol: HOP_ADVICE_PROTOCOL_V1.name, hopAdviceProposal: envelope };
  return { job, turn };
}

function makeFixtureJobStore(f: ScenarioFixture, workspaces: HopV55WorkspaceRepository, options: {
  afterFirstEmission?: () => void; repeatGuard?: boolean;
} = {}) {
  const counters = { submitCalls: 0, retryCalls: 0, readCalls: 0, guardCalls: 0, emissions: [] as HopAdviceV1WireInputV3[] };
  const snapshots = new Map<string, HopV55SemanticJobSnapshotV3>();
  const makeSnapshot = async (input: { operationId: string; generation: number; ticketReference: string; wireReference: string; wire: HopAdviceV1WireInputV3 },
    status: HopV55SemanticJobSnapshotV3['status'], job?: HopAdviceV1PublicJob, turn?: HopAdviceV1PublicTurn, reason?: string) => {
    const ws = await workspaces.read(OWNER, WORKSPACE);
    const raw = (ws?.assistedSemanticAdviceTickets ?? []).find(row => !!row && typeof row === 'object'
      && (row as { reference?: string }).reference === input.ticketReference);
    const ticket = raw && readHopV55AssistedAdviceTicketV2(raw);
    const wireReference = ticket?.status === 'readOnly' ? ticket.ticket.references.wireReference : 'invalid-ticket-ref';
    if (wireReference !== input.wireReference) throw new Error('Fixture store received an unbound wire reference.');
    return { format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT, operationId: input.operationId,
      generation: input.generation, ticketReference: input.ticketReference, wireReference, status, ...(job ? { job } : {}),
      ...(turn ? { turn } : {}), ...(reason ? { reason } : {}) } satisfies HopV55SemanticJobSnapshotV3;
  };
  const send = async (input: { operationId: string; generation: number; ticketReference: string; wireReference: string; wire: HopAdviceV1WireInputV3;
    authorizeBeforeEachEmission(): Promise<import('../../src/services/hopV55/semanticAdoptionApplicationHost').HopV55SemanticWireAuthorizationResultV3> }) => {
    const persisted = await workspaces.read(OWNER, WORKSPACE);
    const rawTicket = (persisted?.assistedSemanticAdviceTickets ?? []).find(row => !!row && typeof row === 'object'
      && (row as { reference?: string }).reference === input.ticketReference);
    const ticketRead = rawTicket && readHopV55AssistedAdviceTicketV2(rawTicket);
    if (ticketRead?.status !== 'readOnly' || ticketRead.ticket.format !== 'hop-v55-assisted-advice-ticket-v3'
      || ticketRead.ticket.references.wireReference !== input.wireReference
      || JSON.stringify(ticketRead.ticket.wire) !== JSON.stringify(input.wire)) {
      throw new Error('Fixture provider refused: exact V3 ticket/wire was not durable before submit.');
    }
    const first = await input.authorizeBeforeEachEmission(); counters.guardCalls++;
    if (first.status !== 'authorized') return makeSnapshot(input, 'failed', undefined, undefined, first.reason);
    if (first.ticketReference !== input.ticketReference || JSON.stringify(first.wire) !== JSON.stringify(input.wire)) {
      throw new Error('Fixture provider refused a non-identical emission authorization.');
    }
    counters.emissions.push(structuredClone(first.wire));
    options.afterFirstEmission?.();
    if (options.repeatGuard) {
      const retryGate = await input.authorizeBeforeEachEmission(); counters.guardCalls++;
      if (retryGate.status !== 'authorized') {
        const pending = await makeSnapshot(input, 'pending', { id: 'job:' + input.operationId,
          operationId: input.operationId, scope: structuredClone(input.wire.scope), generation: input.generation,
          question: input.wire.question, label: 'Fixture V6 locale', status: 'running', stage: 'retry',
          createdAt: Date.parse(RECORDED_AT), updatedAt: Date.parse(RECORDED_AT), attempt: 1,
          protocol: HOP_ADVICE_PROTOCOL_V1.name }, undefined, retryGate.reason);
        snapshots.set(input.operationId, pending);
        return pending;
      }
      if (retryGate.ticketReference !== input.ticketReference || JSON.stringify(retryGate.wire) !== JSON.stringify(input.wire)) {
        throw new Error('Fixture provider refused a re-anchored V3 retry.');
      }
      counters.emissions.push(structuredClone(retryGate.wire));
    }
    const generated = fixturePublicTurn(f, input.wire);
    const result = await makeSnapshot(input, 'received', generated.job, generated.turn);
    snapshots.set(input.operationId, result);
    return result;
  };
  const store: HopV55SemanticJobStoreV3 = {
    kind: 'hopAdviceRequest3', providerKind: 'fixture',
    async submit(input) { counters.submitCalls++; return send(input); },
    async retry(input) { counters.retryCalls++; return send(input); },
    async read(input) {
      counters.readCalls++;
      const snapshot = snapshots.get(input.operationId);
      return snapshot?.ticketReference === input.ticketReference && snapshot.wireReference === input.wireReference
        && snapshot.generation === input.generation && snapshot.job?.question === input.question ? structuredClone(snapshot) : null;
    },
  };
  return { store, counters, snapshots };
}

async function seedV2WithoutPolicy(f: ScenarioFixture, repository: HopV55WorkspaceRepository,
  session: Awaited<ReturnType<typeof openSession>>, entry: HopAdviceV1ClientEntryV3) {
  const wire = buildHopAdviceV1WireV3(entry);
  const principal = { principalId: OWNER, ownerKey: OWNER, workspaceId: WORKSPACE, scope: f.scope, label: 'Owner fixture' };
  const result = createHopV55AssistedAdviceTicketV2({ id: 'ticket:legacy-v2-fixture', createdAt: RECORDED_AT,
    principal, sourceArchive: f.archive, wire });
  if (result.status !== 'ready') throw new Error('La fixture V2 sans policy doit se créer avant son refus de reprise.');
  const ws = await repository.read(OWNER, WORKSPACE);
  if (!ws) throw new Error('Workspace fixture absent.');
  await repository.save({ ...ws, assistedSemanticAdviceTickets: [ ...(ws.assistedSemanticAdviceTickets ?? []), result.ticket ] }, ws.revision);
  return result.ticket;
}
describe('hôte sémantique V6 local sur wire Request3', () => {
  it('persiste ticket V3 avant la fixture, archive V6, confirme V4 sans toucher la recette et relit/rejoue après recreation', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:00:00.000Z') };
    const beforeRecipe = structuredClone(state.context.recipe);
    const host = createHost(f, state, env.repository);
    const session = await openSession(host, f);
    const entry = clientEntry(session);
    const fixtureStore = makeFixtureJobStore(f, env.repository);

    const sent = await session.submit({ entry, store: fixtureStore.store });
    expect(sent.status).toBe('received');
    expect(fixtureStore.counters.submitCalls).toBe(1);
    expect(fixtureStore.counters.emissions).toHaveLength(1);
    expect(fixtureStore.counters.emissions[0].mode).toBe(HOP_ADVICE_PROTOCOL_V1.name);
    expect(fixtureStore.counters.emissions[0].hopAdvice).toEqual(session.request);
    expect(fixtureStore.counters.emissions[0].hopAdvice).not.toHaveProperty('candidatePolicy');
    expect(sent.ticket.format).toBe('hop-v55-assisted-advice-ticket-v3');
    expect(sent.ticket.candidatePolicy).toEqual(POLICY);
    expect(sent.record.semantic).toEqual({ kind: 'verifiedV6', format: 'brewer-hop-advice-proposal-v6' });

    const afterTurn = await env.repository.read(OWNER, WORKSPACE);
    expect(afterTurn?.assistedSemanticAdviceTickets).toHaveLength(1);
    expect(afterTurn?.assistedSemanticAdviceRecords).toHaveLength(1);
    expect(afterTurn?.documentaryAnswers ?? []).toEqual([]);
    expect(state.context.recipe).toEqual(beforeRecipe);

    const preview = await session.preview({ operationId: entry.operationId, commandId: 'command:host68-v6-001',
      recordId: 'answer:host68-v6-001', requestId: 'request:host68-v6-001', reason: 'Confirmation explicite du choix fixture.',
      selection: [{ optionId: 'assist-option-document', proposalId: 'assist-proposal-resin-note',
        reason: 'Je confirme cette piste synthétique.' }] });
    expect(preview.status).toBe('ready');
    if (preview.status !== 'ready') throw new Error('Preview V6 attendue.');
    const committed = await session.confirm(preview.plan);
    expect(committed).toMatchObject({ status: 'committed', recipeEffect: 'none' });
    if (committed.status !== 'committed') throw new Error('Commit V6 attendu.');
    const savedAfterCommit = env.saves.count;
    const afterCommit = await env.repository.read(OWNER, WORKSPACE);
    expect(afterCommit?.documentaryAnswers).toHaveLength(1);
    expect(afterCommit?.semanticAdoptionCommits).toHaveLength(1);
    expect(afterCommit?.copies).toEqual(f.workspace.copies);
    expect(afterCommit?.recipeSaveReceipts ?? []).toEqual([]);
    expect(state.context.recipe).toEqual(beforeRecipe);

    // Recreate the host over the same repository; history/replay read the durable closure and do not rebuild it.
    const reloadedHost = createHost(f, state, env.repository);
    const resumed = await reloadedHost.resumeSession({ workspaceId: WORKSPACE, operationId: entry.operationId });
    expect(resumed.status).toBe('ready');
    if (resumed.status !== 'ready') throw new Error('Ticket V3 exact attendu à la reprise.');
    expect(resumed.session.resumedRecord?.reference).toBe(sent.record.reference);
    const history = await resumed.session.readHistory('command:host68-v6-001');
    expect(history).toMatchObject({ status: 'readOnly', commit: { receipt: committed.receipt } });
    const replay = await resumed.session.confirm(preview.plan);
    expect(replay).toEqual({ status: 'replay', receipt: committed.receipt, recipeEffect: 'none', workspaceRevision: committed.workspaceRevision });
    expect(env.saves.count).toBe(savedAfterCommit);
    expect(fixtureStore.counters.submitCalls).toBe(1);
  });

  it('une erreur du CAS du ticket V3 produit zéro invocation du provider fixture', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:10:00.000Z') };
    const host = createHost(f, state, env.repository);
    const session = await openSession(host, f);
    const fixtureStore = makeFixtureJobStore(f, env.repository);
    env.saves.rejectTicketAppend = true;

    const result = await session.submit({ entry: clientEntry(session, 'operation-semantic-host-6802'), store: fixtureStore.store });
    expect(result.status).toBe('invalid');
    expect(fixtureStore.counters.submitCalls).toBe(0);
    expect(fixtureStore.counters.emissions).toHaveLength(0);
    const persisted = await env.repository.read(OWNER, WORKSPACE);
    expect(persisted?.assistedSemanticAdviceTickets ?? []).toEqual([]);
    expect(persisted?.assistedSemanticAdviceRecords ?? []).toEqual([]);
  });

  it('refuse le ticket avant CAS si l’acteur change pendant la lecture du contexte courant', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:20:00.000Z') };
    const host = createHost(f, state, env.repository);
    const session = await openSession(host, f);
    const fixtureStore = makeFixtureJobStore(f, env.repository);
    state.onContextRead = count => { if (count === 2) state.actor = { uid: 'principal:other-session', displayName: 'Autre session' }; };

    const result = await session.submit({ entry: clientEntry(session, 'operation-semantic-host-6803'), store: fixtureStore.store });
    expect(result.status).toBe('unavailable');
    expect(fixtureStore.counters.submitCalls).toBe(0);
    expect(fixtureStore.counters.emissions).toHaveLength(0);
    expect((await env.repository.read(OWNER, WORKSPACE))?.assistedSemanticAdviceTickets ?? []).toEqual([]);
  });

  it('le provider revalide avant chaque retry autonome et n’émet pas le second wire après source A→B', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:30:00.000Z') };
    const host = createHost(f, state, env.repository);
    const session = await openSession(host, f);
    const fixtureStore = makeFixtureJobStore(f, env.repository, { repeatGuard: true, afterFirstEmission: () => {
      const recipe = state.context.recipe;
      if (!recipe || typeof recipe.volumeL !== 'number') throw new Error('Volume de fixture nécessaire au témoin A→B.');
      state.context = structuredClone(state.context);
      state.context.recipe.volumeL = recipe.volumeL + 1;
    } });

    const result = await session.submit({ entry: clientEntry(session, 'operation-semantic-host-6804'), store: fixtureStore.store });
    expect(result.status).toBe('pending');
    expect(fixtureStore.counters.submitCalls).toBe(1);
    expect(fixtureStore.counters.guardCalls).toBe(2);
    expect(fixtureStore.counters.emissions).toHaveLength(1);
    expect((await env.repository.read(OWNER, WORKSPACE))?.assistedSemanticAdviceTickets).toHaveLength(1);
    expect((await env.repository.read(OWNER, WORKSPACE))?.assistedSemanticAdviceRecords ?? []).toEqual([]);
  });

  it('le client Request3 transmet les mêmes octets au callable V1 existant sans exposer askWire legacy', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:35:00.000Z') };
    const session = await openSession(createHost(f, state, env.repository), f);
    const wire = buildHopAdviceV1WireV3(clientEntry(session, 'operation-semantic-host-6806'));
    const generated = fixturePublicTurn(f, wire);
    const calls: Array<{ name: string; payload: unknown }> = [];
    const api = createBrewerHopAdviceApiV3({ ownerKey: OWNER, transport: {
      async currentUserKey() { return OWNER; },
      async invoke(name, payload) { calls.push({ name, payload }); return { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: generated.job }; },
    } });

    const received = await api.askWireV3(wire);
    expect(received.status).toBe('available');
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe(HOP_ADVICE_V1_FUNCTIONS.ask);
    expect(calls[0].payload).toBe(wire);
    expect(api).not.toHaveProperty('askWire');
    expect(api).not.toHaveProperty('ask');
  });

  it('le broker V3 revalide juste avant son transport et n’émet rien si le ticket est stale', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:37:00.000Z') };
    const session = await openSession(createHost(f, state, env.repository), f);
    const entry = clientEntry(session, 'operation-semantic-host-6807');
    const ticket = await session.persistTicketBeforeSend(entry);
    const submit = vi.fn(async (input: HopV55SemanticJobSendInputV3) => ({
      format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT, operationId: input.operationId, generation: input.generation,
      ticketReference: input.ticketReference, wireReference: input.wireReference, status: 'pending' as const,
    }));
    const retry = vi.fn(async (input: HopV55SemanticJobSendInputV3) => ({
      format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT, operationId: input.operationId, generation: input.generation,
      ticketReference: input.ticketReference, wireReference: input.wireReference, status: 'pending' as const,
    }));
    const read = vi.fn(async () => null);
    const store = createHopV55SemanticJobStoreV3({ ownerKey: OWNER, workspaceId: WORKSPACE, scope: f.scope,
      storeNamespace: hopAdviceSemanticV3ClientPartitionKey(OWNER, WORKSPACE, f.scope), providerKind: 'fixture',
      transport: { submit, retry, read } });

    const blocked = await store.submit({ operationId: ticket.operationId, generation: ticket.generation,
      ticketReference: ticket.reference, wireReference: ticket.references.wireReference, wire: ticket.wire,
      authorizeBeforeEachEmission: async () => ({ status: 'stale', reason: 'La source a changé avant émission.' }) });

    expect(blocked).toMatchObject({ status: 'failed', ticketReference: ticket.reference,
      wireReference: ticket.references.wireReference, reason: 'La source a changé avant émission.' });
    expect(submit).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
    expect((await env.repository.read(OWNER, WORKSPACE))?.assistedSemanticAdviceTickets).toEqual([ticket]);
    expect((await env.repository.read(OWNER, WORKSPACE))?.assistedSemanticAdviceRecords ?? []).toEqual([]);
  });

  it('le même BrewerChat en Request3 garde la question fixe et n’appelle jamais le store standard', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:38:00.000Z') };
    const session = await openSession(createHost(f, state, env.repository), f);
    const normalJobsBefore = brewerJobs.snapshot().jobs.length;
    const fixtureSubmit = vi.fn(async (input: HopV55SemanticJobSendInputV3) => {
      const workspace = await env.repository.read(OWNER, WORKSPACE);
      const raw = workspace?.assistedSemanticAdviceTickets?.find(row => !!row && typeof row === 'object'
        && (row as { reference?: string }).reference === input.ticketReference);
      const ticket = raw && readHopV55AssistedAdviceTicketV2(raw);
      if (!ticket || ticket.status !== 'readOnly' || ticket.ticket.format !== 'hop-v55-assisted-advice-ticket-v3') {
        throw new Error('Le ticket V3 doit être durable avant le transport fixture.');
      }
      expect(ticket.ticket.references.wireReference).toBe(input.wireReference);
      expect(ticket.ticket.wire).toEqual(input.wire);
      return { format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT, operationId: input.operationId,
        generation: input.generation, ticketReference: input.ticketReference, wireReference: input.wireReference,
        status: 'pending' as const };
    });
    const runtime = createBrewerHopAdviceSemanticRuntimeV3({ ownerKey: OWNER, workspaceId: WORKSPACE, scope: f.scope,
      providerKind: 'fixture', readGeneration: async () => 1, transport: { submit: fixtureSubmit,
        async retry(input) { return { format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT, operationId: input.operationId,
          generation: input.generation, ticketReference: input.ticketReference, wireReference: input.wireReference,
          status: 'pending' as const }; }, async read() { return null; } } });
    const view = render(createElement(BrewerChat, { protocol: 'hopAdviceRequest3', scope: session.scope, label: 'Lecture fixture',
      phase: session.context?.phase, draft: session.context?.recipe, semanticSession: session, semanticRuntime: runtime, initialOpen: true }));
    try {
      expect(screen.getByDisplayValue(QUESTION)).toHaveAttribute('readonly');
      fireEvent.click(screen.getByRole('radio', { name: /Rapide/ }));
      // Product label of the Request3 send button (BrewerChat); the protocol stays asserted by the submitted wire below.
      fireEvent.click(screen.getByRole('button', { name: 'Envoyer la lecture assistée' }));
      await waitFor(() => expect(fixtureSubmit).toHaveBeenCalledTimes(1));
      expect(fixtureSubmit.mock.calls[0][0].wire.question).toBe(QUESTION);
      expect(fixtureSubmit.mock.calls[0][0].generation).toBe(1);
      expect(fixtureSubmit.mock.calls[0][0].wire.analysisMode).toBe('fast');
      expect(brewerJobs.snapshot().jobs).toHaveLength(normalJobsBefore);
      const saved = await env.repository.read(OWNER, WORKSPACE);
      expect(saved?.assistedSemanticAdviceTickets).toHaveLength(1);
      expect(saved?.assistedSemanticAdviceTickets?.[0]).toMatchObject({ format: 'hop-v55-assisted-advice-ticket-v3' });
      expect(saved?.assistedSemanticAdviceRecords ?? []).toEqual([]);
      expect(screen.getByText('Question conservée sous son ticket exact; traitement en cours.')).toBeInTheDocument();
    } finally {
      view.unmount(); runtime.dispose();
    }
  });

  it('n’émet pas une entrée génération 0 quand le serveur est à la génération 1', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:39:30.000Z') };
    const session = await openSession(createHost(f, state, env.repository), f);
    const entry = { ...clientEntry(session, 'operation-semantic-host-6810'), generation: 0 };
    const ticket = await session.persistTicketBeforeSend(entry);
    const askWireV3 = vi.fn(async () => ({ status: 'invalid' as const, reason: 'must-not-emit' }));
    const history = vi.fn(async () => ({ status: 'available' as const, value: {
      protocol: HOP_ADVICE_PROTOCOL_V1.name, turns: [], generation: 1,
    } }));
    const invalidRead = { status: 'invalid' as const, reason: 'unused-in-generation-test' };
    const retry = vi.fn(async () => invalidRead);
    const api: BrewerHopAdviceApiV3 = {
      ownerKey: OWNER,
      protocol: 'hopAdviceRequest3',
      async userKey() { return OWNER; },
      async askWireV3(input) { return askWireV3(input); },
      retry,
      history,
      async status() { return invalidRead; },
      async reset() { return invalidRead; },
      async activity() { return invalidRead; },
      async markRead() { return invalidRead; },
    };
    const runtime = createBrewerHopAdviceApiRuntimeV3({ ownerKey: OWNER, workspaceId: WORKSPACE, scope: f.scope,
      providerKind: 'fixture', api });
    expect(await runtime.readGeneration(f.scope)).toBe(1);
    const staleSend = { operationId: ticket.operationId, generation: ticket.generation,
      ticketReference: ticket.reference, wireReference: ticket.references.wireReference, wire: ticket.wire,
      authorizeBeforeEachEmission: () => session.authorizeBeforeEmission({ operationId: ticket.operationId, generation: ticket.generation }) };
    await expect(runtime.jobs.submit(staleSend)).rejects.toThrow('génération 1');
    await expect(runtime.jobs.retry(staleSend)).rejects.toThrow('génération 1');
    expect(history).toHaveBeenCalled();
    expect(askWireV3).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
    expect((await env.repository.read(OWNER, WORKSPACE))?.assistedSemanticAdviceTickets).toEqual([ticket]);
    runtime.dispose();
  });

  it('une reprise après recreation réémet seulement le wire durable du ticket, sans nouvelle capture', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:39:00.000Z') };
    const session = await openSession(createHost(f, state, env.repository), f);
    const entry = clientEntry(session, 'operation-semantic-host-6808');
    const ticket = await session.persistTicketBeforeSend(entry);
    const savesBeforeResubmit = env.saves.count;
    const resumed = await createHost(f, state, env.repository).resumeSession({ workspaceId: WORKSPACE, operationId: ticket.operationId });
    expect(resumed.status).toBe('ready');
    if (resumed.status !== 'ready') throw new Error('Reprise depuis le ticket durable attendue.');
    expect(resumed.session.resumedOperationId).toBe(ticket.operationId);
    const fixtureStore = makeFixtureJobStore(f, env.repository);

    const sent = await resumed.session.resubmit({ operationId: ticket.operationId, store: fixtureStore.store });

    expect(sent.status).toBe('received');
    expect(fixtureStore.counters.submitCalls).toBe(1);
    expect(fixtureStore.counters.emissions).toEqual([ticket.wire]);
    const persisted = await env.repository.read(OWNER, WORKSPACE);
    expect(persisted?.assistedSemanticAdviceTickets).toHaveLength(1);
    expect(persisted?.assistedSemanticAdviceRecords).toHaveLength(1);
    expect(env.saves.count).toBe(savesBeforeResubmit + 1); // Only the response record is appended; the ticket is not recaptured.
  });

  it('un ticket V2 sans politique est conservé en lecture seule après reload, sans Request3 rebâtie ni provider', async () => {
    const f = makeScenarioFixture();
    const env = await makeRepository(f.workspace);
    const state: MutableHostState = { actor: { uid: OWNER, displayName: 'Owner fixture' }, context: structuredClone(f.context), contextReads: 0,
      nowMs: Date.parse('2026-10-05T10:40:00.000Z') };
    const host = createHost(f, state, env.repository);
    const session = await openSession(host, f);
    const entry = clientEntry(session, 'operation-semantic-host-6805');
    const wire = buildHopAdviceV1WireV3(entry);
    const legacy = createHopV55AssistedAdviceTicketV2({ id: 'ticket:legacy-no-policy', createdAt: RECORDED_AT,
      principal: { principalId: OWNER, ownerKey: OWNER, workspaceId: WORKSPACE, scope: f.scope, label: 'Owner fixture' },
      sourceArchive: f.archive, wire });
    if (legacy.status !== 'ready') throw new Error('Ticket V2 de témoin attendu.');
    const ws = await env.repository.read(OWNER, WORKSPACE);
    if (!ws) throw new Error('Workspace V2 fixture absent.');
    // Seed a pre-existing historical V2 row directly in the test adapter. #67 correctly forbids adding V2 as a new CAS append.
    const historicalRevision = ws.revision + 1;
    const historicalWorkspace: HopV55Workspace = { ...ws, revision: historicalRevision, updatedAt: RECORDED_AT,
      assistedSemanticAdviceTickets: [legacy.ticket] };
    await env.database.workspaces.put({ format: 'hop-v55-workspace-envelope-v1', ownerKey: OWNER, workspaceId: WORKSPACE,
      revision: historicalRevision, workspace: historicalWorkspace });
    const reloaded = await createHost(f, state, env.repository).resumeSession({ workspaceId: WORKSPACE, operationId: entry.operationId });
    expect(reloaded.status).toBe('unsupportedReadOnly');
  });
});
