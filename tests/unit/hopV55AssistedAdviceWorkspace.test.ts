import { describe, expect, it, vi } from 'vitest';
import type { BrewerChatInput, BrewerTurn } from '../../functions/src/companionTypes';
import type { BrewerEvidence } from '../../functions/src/companionTypes';
import { HOP_ADVICE_PROTOCOL_V1, HOP_ADVICE_V1_FUNCTIONS } from '../../functions/src/brewerHopAdviceTransportV1';
import { BREWER_HOP_ADVICE_PROPOSAL_FORMAT, createBrewerHopAdviceProposalEnvelope } from '../../functions/src/brewerHopAdviceProposal';
import { brewerAdviceFromHopProposal } from '../../functions/src/brewerHopAdviceProposal';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { readAssistedColdContactEvidence } from '../../src/services/hopV55/assistedColdContactEvidence';
import { createHopV55FixtureServices, makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createHopV55Services } from '../../src/services/hopV55/runtime';
import { createHopV55DecisionReadingArchiveV3 } from '../../src/services/hopV55/decisionArchive';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionScopeDraftsV1 } from '../../src/services/hopV55/questionScopeReading';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import {
  createHopV55AssistedAdviceBackendContractV1,
  createHopV55AssistedAdviceWorkspaceClient,
} from '../../src/services/hopV55/assistedAdviceWorkspace';
import { createHopV55AssistedAdviceRecordV1, readHopV55AssistedAdviceRecordV1,
  HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT } from '../../src/services/hopV55/assistedAdviceArchive';
import { createBrewerHopAdviceApiV1, type BrewerHopAdviceV1CallableName, type BrewerHopAdviceV1CallableTransport } from '../../src/services/brewerHopAdviceApi';
import { createBrewerHopAdviceApiRuntime } from '../../src/services/brewerHopAdviceRuntimeAdapter';
import {
  beforeSubmitHopV55AssistedAdvice,
  captureHopV55AssistedAdviceTicketV1,
  prepareHopV55AssistedAdviceLaunchV1,
  receiveHopV55AssistedAdvice,
} from '../../src/services/hopV55/assistedAdviceController';
import {
  createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable,
} from '../../src/services/hopV55/workspaceRepository';

const ownerKey = 'owner:assisted-workspace-test';
const workspaceId = 'workspace:assisted-workspace-test';
const recordedAt = '2026-10-04T11:00:00.000Z';
const question = 'Je veux plus de poire et plus de floral. Quand utiliser mes houblons et lesquels pour cette bière d’été ?';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie dans cette fixture.' };

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string {
    return Array.isArray(value) ? JSON.stringify(value)
      : JSON.stringify([(value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('Duplicate key');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
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
      const before = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows = before; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* Test adapter has no open handle. */ }
}

function setup(identity: { ownerKey: string; workspaceId: string; operationId: string } = {
  ownerKey, workspaceId, operationId: 'operation:assist-1',
}, evidenceSource: 'fixture' | 'cold' = 'fixture') {
  const scopedOwnerKey = identity.ownerKey;
  const scopedWorkspaceId = identity.workspaceId;
  const operationId = identity.operationId;
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(question, prepared);
  const scopeDrafts = readHopV55QuestionScopeDraftsV1({ question, reading });
  const scopeTransition = { actId: 'scope:create:assisted-workspace', kind: 'create' as const,
    reason: 'Portées de la question conservées dans la fixture.', recordedAt,
    actor: { origin: 'user' as const, label: 'Brasseur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading, scopeDrafts, transition: scopeTransition });
  const recipeId = context.recipe?.id;
  if (!recipeId) throw new Error('La recette synthétique doit porter un ID source.');
  const archive = createHopV55DecisionReadingArchiveV3({
    id: 'reading:assisted-workspace', ownerKey: scopedOwnerKey, workspaceId: scopedWorkspaceId, recordedAt, reading,
    source: { kind: 'recipe', id: recipeId }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime),
    scopeLedger, transition: scopeTransition,
  });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: scopedWorkspaceId, ownerKey: scopedOwnerKey, revision: 0, title: 'Fixture locale de réception assistée',
    intent: { question, criteria: [] }, sourceRecipeId: recipeId, decisionReadings: [archive], scenarioIds: [],
    referenceHypotheses: [], copies: [], updatedAt: recordedAt,
  };
  const launch = prepareHopV55AssistedAdviceLaunchV1({ archive, workspace, ownerKey: scopedOwnerKey,
    workspaceId: scopedWorkspaceId, context, candidatePolicy });
  if (launch.status !== 'ready') throw new Error(`Préparation du ticket refusée : ${launch.reason}`);
  const captured = captureHopV55AssistedAdviceTicketV1({ id: `ticket:${operationId}`, operationId,
    createdAt: recordedAt, launch: launch.launch });
  if (captured.status !== 'ready') throw new Error(`Capture du ticket refusée : ${captured.reason}`);
  const scope = captured.ticket.request.contextLaunch.scope;
  const chatInput: BrewerChatInput = { scope, operationId: captured.ticket.operationId, question, hopAdvice: captured.ticket.request };
  const submitted = beforeSubmitHopV55AssistedAdvice({ ticket: captured.ticket,
    current: { archive, workspace, ownerKey: scopedOwnerKey, workspaceId: scopedWorkspaceId, scopeAtPageLaunch: scope, context }, input: chatInput });
  if (submitted.status !== 'ready') throw new Error(`Ticket non soumis : ${submitted.reason}`);
  const coldResult = evidenceSource === 'cold'
    ? runBrewerTool('cold_contact_bitterness_reference', { doseGL: 3.86 }, {} as Parameters<typeof runBrewerTool>[2]) : undefined;
  const evidence: BrewerEvidence[] = coldResult
    ? [{ id: 'E-cold-api-runtime', ...coldResult }]
    : [{ id: 'tool:fixture:one', name: 'fixture_read_only_tool', label: 'Lecture fixture',
      facts: ['Fait fixture affiché.'], limits: ['Limite fixture conservée.'], data: { fixture: true },
      sources: [{ title: 'Source synthétique', url: 'https://fixture.invalid/source' }] }];
  const envelope = createBrewerHopAdviceProposalEnvelope({ request: captured.ticket.request,
    raw: { readerReview: [], answer: { summary: 'Proposition fixture.', readingNote: 'Aucune adoption.',
      options: [{ id: 'assist-fixture', kind: 'investigation', title: 'Examiner la lecture', rationale: 'Option non adoptée.',
        conditions: [], tradeoffs: [], related: [], evidenceIds: [] }], unknowns: [],
      program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [] } },
    evidence, readers: {}, serverContext: { phase: 'planning fixture', provenance: ['Fixture synthétique uniquement.'],
      loadedAt: 1, binding: captured.ticket.request.contextLaunch.expected } });
  const turn: BrewerTurn = { id: `turn:${operationId}`, operationId: captured.ticket.operationId, question,
    advice: brewerAdviceFromHopProposal(envelope.proposal),
    evidence, createdAt: Date.parse(recordedAt), model: 'fixture-model', reviewed: true, contextLabel: 'Fixture locale',
    hopAdviceProposal: envelope, protocol: 'hopAdviceReadonlyV1' };
  const contextAtReception = structuredClone(context);
  contextAtReception.recipe!.name = `${contextAtReception.recipe!.name} — contexte B`;
  const received = receiveHopV55AssistedAdvice({ ticket: captured.ticket, input: submitted.input,
    job: { operationId: captured.ticket.operationId, input: submitted.input }, turn, envelope, evidence,
    current: { archive, workspace, ownerKey: scopedOwnerKey, workspaceId: scopedWorkspaceId, scopeAtPageLaunch: scope, context: contextAtReception }, receivedAt: recordedAt });
  if (received.status !== 'ready') throw new Error(`Réception fixture refusée : ${received.reason}`);
  const contract = createHopV55AssistedAdviceBackendContractV1();
  const receipt = createHopV55AssistedAdviceRecordV1({ id: `receipt:${operationId}`, ticket: captured.ticket,
    job: { id: `job:${operationId}`, operationId: captured.ticket.operationId, generation: 1, scope, question },
    turn, payload: received.payload }, contract);
  return { ownerKey: scopedOwnerKey, workspaceId: scopedWorkspaceId, context, contextAtReception, prepared, archive, workspace,
    ticket: captured.ticket, launch: launch.launch,
    input: submitted.input, envelope, turn, receipt, contract };
}

function resealMutatedEvidence(record: ReturnType<typeof setup>['receipt'], field: 'facts' | 'limits' | 'sources') {
  const copy = structuredClone(record);
  const row = copy.turn.evidence[0] as unknown as Record<string, unknown>;
  const payloadRow = copy.payload.turnEvidence[0] as unknown as Record<string, unknown>;
  if (field === 'sources') {
    row.sources = [...(row.sources as Array<{ title: string; url: string }>), { title: 'Source modifiée', url: 'https://fixture.invalid/changed' }];
    payloadRow.sources = structuredClone(row.sources);
  } else {
    row[field] = [...(row[field] as string[]), `Mutation ${field}.`];
    payloadRow[field] = structuredClone(row[field]);
  }
  copy.references.turnReference = hopAdviceContentReference('hop-v55-assisted-turn-snapshot-v1', copy.turn);
  copy.references.turnEvidenceReference = hopAdviceContentReference('hop-v55-assisted-turn-evidence-v1', copy.turn.evidence);
  copy.references.receptionPayloadReference = hopAdviceContentReference('hop-v55-assisted-reception-payload-v1', copy.payload);
  const { reference: _reference, ...body } = copy;
  copy.reference = hopAdviceContentReference(HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT, body);
  return copy;
}

function resealTurnMutation(record: ReturnType<typeof setup>['receipt'], mutate: (turn: Record<string, unknown>) => void) {
  const copy = structuredClone(record);
  mutate(copy.turn as unknown as Record<string, unknown>);
  copy.references.turnReference = hopAdviceContentReference('hop-v55-assisted-turn-snapshot-v1', copy.turn);
  const { reference: _reference, ...body } = copy;
  copy.reference = hopAdviceContentReference(HOP_V55_ASSISTED_ADVICE_RECORD_FORMAT, body);
  return copy;
}

function configuredRepository(database = new MemoryDatabase()) {
  const contract = createHopV55AssistedAdviceBackendContractV1();
  const repository = createHopV55WorkspaceRepository({ ownerKey, database, assistedAdviceContract: contract });
  const client = createHopV55AssistedAdviceWorkspaceClient({ ownerKey, workspaces: repository, contract });
  return { database, contract, repository, client };
}

describe('persistance locale des tickets et receipts de conseil assisté', () => {
  it('persiste le ticket avant le tour, puis rattache le receipt dans un CAS ultérieur et relit le même archive', async () => {
    const f = setup();
    expect(f.contract.proposalFormat).toBe(BREWER_HOP_ADVICE_PROPOSAL_FORMAT);
    expect(f.envelope.evidence.dependencies[0].contentReference).toMatch(/^brewer-hop-advice-tool-evidence-v2:sha256:/u);
    const { repository, client, contract } = configuredRepository();
    await expect(repository.save({ ...f.workspace, assistedAdviceTickets: [f.ticket], assistedAdviceRecords: [f.receipt] }, null))
      .rejects.toMatchObject({ code: 'invalidInput' });
    const first = await repository.save(f.workspace, null);
    expect(first.revision).toBe(1);
    const savedTicket = await client.appendTicket(workspaceId, f.ticket, first.revision);
    expect(savedTicket.status).toBe('appended');
    expect(savedTicket.workspace.revision).toBe(2);
    expect((await client.appendTicket(workspaceId, f.ticket, first.revision)).status).toBe('duplicate');
    expect(await client.readTicketByOperationId(workspaceId, f.ticket.operationId)).toMatchObject({
      status: 'available', value: { reference: f.ticket.reference }, revision: 2,
    });
    await expect(client.appendRecord(workspaceId, f.receipt, first.revision)).rejects.toMatchObject({ code: 'staleRevision' });
    const sealedByInjectedClient = client.createRecord({ id: f.receipt.id, ticket: f.ticket, job: f.receipt.job,
      turn: f.turn, payload: f.receipt.payload });
    expect(sealedByInjectedClient).toEqual(f.receipt);
    const savedReceipt = await client.appendRecord(workspaceId, sealedByInjectedClient, savedTicket.workspace.revision);
    expect(savedReceipt.status).toBe('appended');
    expect(savedReceipt.workspace.revision).toBe(3);
    const archive = await client.readArchiveByOperationId(workspaceId, f.ticket.operationId);
    expect(archive).toMatchObject({ status: 'available', value: {
      ticket: { reference: f.ticket.reference }, record: { reference: f.receipt.reference, envelope: f.envelope },
    } });
    if (archive.status === 'available') expect(archive.value.record.payload)
      .toMatchObject({ clientResult: { status: 'ready' }, contextCheckAtReception: { applicability: { status: 'stale' } } });
    const retry = await client.appendRecord(workspaceId, f.receipt, savedReceipt.workspace.revision);
    expect(retry.status).toBe('duplicate');
    expect(retry.workspace.revision).toBe(3);
    expect((await client.appendRecord(workspaceId, f.receipt, savedTicket.workspace.revision)).status).toBe('duplicate');
    const alteredPayload = { ...f.receipt.payload, receivedAt: '2026-10-04T11:00:01.000Z' };
    const changedReceipt = client.createRecord({ id: f.receipt.id, ticket: f.ticket, job: f.receipt.job,
      turn: f.turn, payload: alteredPayload });
    await expect(client.appendRecord(workspaceId, changedReceipt, savedReceipt.workspace.revision))
      .rejects.toMatchObject({ code: 'conflict' });
    expect(readHopV55AssistedAdviceRecordV1(f.receipt, f.ticket, contract).status).toBe('available');
    expect(f.receipt.turn.protocol).toBe('hopAdviceReadonlyV1');
    expect(readHopV55AssistedAdviceRecordV1(f.receipt, f.ticket, contract)).toMatchObject({
      status: 'available', record: { turn: { protocol: 'hopAdviceReadonlyV1' } },
    });
    const withoutMarker = structuredClone(f.turn) as BrewerTurn;
    delete withoutMarker.protocol;
    expect(() => createHopV55AssistedAdviceRecordV1({ id: 'receipt:unmarked', ticket: f.ticket,
      job: f.receipt.job, turn: withoutMarker, payload: f.receipt.payload }, contract)).toThrow(/marqueur de tour/i);
  });

  it('garde le tour API validé exact à travers le callback de réception puis le codec de receipt', async () => {
    const f = setup({ ownerKey, workspaceId, operationId: 'operation:cold-api-known-turn' }, 'cold');
    expect(readAssistedColdContactEvidence(f.turn.evidence[0])).toMatchObject({ status: 'ready', evidenceId: 'E-cold-api-runtime' });
    expect(f.turn.advice.watch).toBe('');
    const runtimeInput: BrewerChatInput = { ...f.input, mode: 'deep', generation: 1 };
    const apiTurn = structuredClone(f.turn);
    const apiJob = { protocol: HOP_ADVICE_PROTOCOL_V1.name, id: 'job:api-known-turn', operationId: f.ticket.operationId,
      scope: structuredClone(f.ticket.request.contextLaunch.scope), generation: 1, question: f.ticket.request.question,
      label: 'Conseil assisté', status: 'done' as const, stage: 'review' as const, createdAt: Date.parse(recordedAt),
      updatedAt: Date.parse(recordedAt), finishedAt: Date.parse(recordedAt), attempt: 1 };
    const calls: string[] = [];
    const transport: BrewerHopAdviceV1CallableTransport = {
      currentUserKey: vi.fn(async () => ownerKey),
      invoke: vi.fn(async (name: BrewerHopAdviceV1CallableName) => {
        calls.push(name);
        if (name === HOP_ADVICE_V1_FUNCTIONS.ask) return { protocol: HOP_ADVICE_PROTOCOL_V1.name, job: apiJob };
        if (name === HOP_ADVICE_V1_FUNCTIONS.conversation) return { protocol: HOP_ADVICE_PROTOCOL_V1.name, turn: apiTurn };
        if (name === HOP_ADVICE_V1_FUNCTIONS.activity) return { protocol: HOP_ADVICE_PROTOCOL_V1.name, jobs: [] };
        throw new Error(`Callable inattendu dans le test : ${name}`);
      }),
    };
    const api = createBrewerHopAdviceApiV1({ ownerKey, transport });
    const runtime = createBrewerHopAdviceApiRuntime({ ownerKey,
      scope: f.ticket.request.contextLaunch.scope, api });
    try {
      await runtime.jobs.start();
      runtime.jobs.submit(runtimeInput, 'Question assistée');
      await vi.waitFor(() => expect(runtime.jobs.snapshot().jobs.find(job => job.operationId === f.ticket.operationId)?.turn).toBeDefined());
      const clientJob = runtime.jobs.snapshot().jobs.find(job => job.operationId === f.ticket.operationId);
      if (!clientJob?.turn) throw new Error('Le tour exact de l’API doit avoir été relu dans le store.');
      expect(clientJob.turn).toMatchObject({ id: apiTurn.id, operationId: apiTurn.operationId,
        protocol: HOP_ADVICE_PROTOCOL_V1.name, hopAdviceProposal: f.envelope });
      expect(clientJob.turn.advice.watch).toBe('');
      const received = receiveHopV55AssistedAdvice({ ticket: f.ticket, input: runtimeInput,
        job: { operationId: f.ticket.operationId, input: runtimeInput }, turn: clientJob.turn,
        envelope: clientJob.turn.hopAdviceProposal, evidence: clientJob.turn.evidence,
        current: { archive: f.archive, workspace: f.workspace, ownerKey: f.ownerKey, workspaceId: f.workspaceId,
          scopeAtPageLaunch: f.ticket.request.contextLaunch.scope, context: f.contextAtReception }, receivedAt: recordedAt });
      expect(received.status).toBe('ready');
      if (received.status !== 'ready') throw new Error(`Callback de réception refusé : ${received.reason}`);
      const clientJobReference = { id: clientJob.id, operationId: clientJob.operationId,
        generation: clientJob.generation, scope: clientJob.scope, question: clientJob.question };
      const record = createHopV55AssistedAdviceRecordV1({ id: 'receipt:api-known-turn', ticket: f.ticket,
        job: clientJobReference, turn: clientJob.turn, payload: received.payload }, f.contract);
      expect(record.turn).toEqual(clientJob.turn);
      expect(record.turn.protocol).toBe(HOP_ADVICE_PROTOCOL_V1.name);
      expect(readHopV55AssistedAdviceRecordV1(record, f.ticket, f.contract)).toMatchObject({
        status: 'available', record: { turn: { id: apiTurn.id, protocol: HOP_ADVICE_PROTOCOL_V1.name,
          hopAdviceProposal: f.envelope } },
      });
      const malformedTurn = { ...clientJob.turn,
        advice: { ...clientJob.turn.advice, watch: 17 } } as unknown as BrewerTurn;
      expect(() => createHopV55AssistedAdviceRecordV1({ id: 'receipt:bad-watch', ticket: f.ticket,
        job: clientJobReference, turn: malformedTurn, payload: received.payload }, f.contract)).toThrow(/turn\.advice invalide/i);
      expect(calls).toEqual([HOP_ADVICE_V1_FUNCTIONS.activity, HOP_ADVICE_V1_FUNCTIONS.ask,
        HOP_ADVICE_V1_FUNCTIONS.activity, HOP_ADVICE_V1_FUNCTIONS.conversation]);
    } finally { runtime.dispose(); }
  });

  it('injecte le contract v4 dans les services local et fixture sans créer de receipt au montage', async () => {
    const cases = [
      { ownerKey: 'owner:assisted-runtime-local', workspaceId: 'workspace:assisted-runtime-local',
        services: createHopV55Services({ ownerKey: 'owner:assisted-runtime-local', context: makeHopV55FixtureContext('planning'),
          databasePrefix: 'assisted-runtime-contract-test-local', workspaceDatabase: new MemoryDatabase() }) },
      { ownerKey: 'fixture:assisted-runtime-fixture-planning', workspaceId: 'workspace:assisted-runtime-fixture',
        services: createHopV55FixtureServices('assisted-runtime-contract-test', { workspaceDatabase: new MemoryDatabase() }) },
    ];
    try {
      for (const entry of cases) {
        const f = setup({ ownerKey: entry.services.ownerKey, workspaceId: entry.workspaceId, operationId: `operation:${entry.workspaceId}` });
        const first = await entry.services.workspaces.save(f.workspace, null);
        expect((await entry.services.assistedAdvice.readWorkspace(entry.workspaceId))?.revision).toBe(first.revision);
        expect(await entry.services.assistedAdvice.readTicketByOperationId(entry.workspaceId, f.ticket.operationId))
          .toMatchObject({ status: 'absent', revision: first.revision });
        const ticket = await entry.services.assistedAdvice.appendTicket(entry.workspaceId, f.ticket, first.revision);
        expect(ticket.status).toBe('appended');
        expect(await entry.services.assistedAdvice.readTicketByOperationId(entry.workspaceId, f.ticket.operationId))
          .toMatchObject({ status: 'available', value: { reference: f.ticket.reference } });
      }
    } finally { for (const entry of cases) entry.services.close(); }
  });

  it('refuse une seconde capture au même operationId si elle change le ticket, et protège les collections append-only', async () => {
    const f = setup();
    const { repository, client } = configuredRepository();
    const first = await repository.save(f.workspace, null);
    const appended = await client.appendTicket(workspaceId, f.ticket, first.revision);
    const changedCapture = captureHopV55AssistedAdviceTicketV1({ id: 'ticket:changed', operationId: f.ticket.operationId,
      createdAt: '2026-10-04T11:00:01.000Z', launch: f.launch });
    expect(changedCapture.status).toBe('ready');
    if (changedCapture.status !== 'ready') return;
    await expect(client.appendTicket(workspaceId, changedCapture.ticket, appended.workspace.revision))
      .rejects.toMatchObject({ code: 'conflict' });
    await expect(repository.save({ ...appended.workspace, assistedAdviceTickets: [] }, appended.workspace.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });
  });

  it('refuse un ticket étranger et un tour rattaché à un autre ticket source', async () => {
    const f = setup();
    const foreign = setup({ ownerKey: 'owner:foreign-assist', workspaceId: 'workspace:foreign-assist', operationId: f.ticket.operationId });
    const { repository, client, contract } = configuredRepository();
    const saved = await repository.save(f.workspace, null);
    await expect(client.appendTicket(workspaceId, foreign.ticket, saved.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    expect(() => createHopV55AssistedAdviceRecordV1({ id: 'receipt:crossed-source', ticket: foreign.ticket,
      job: f.receipt.job, turn: f.turn, payload: f.receipt.payload }, contract)).toThrow();
    expect((await repository.read(ownerKey, workspaceId))?.assistedAdviceTickets).toBeUndefined();
  });

  it.each(['facts', 'limits', 'sources'] as const)('le vérificateur v4 refuse une mutation scellée de turn.evidence.%s', (field) => {
    const f = setup();
    const mutated = resealMutatedEvidence(f.receipt, field);
    const read = readHopV55AssistedAdviceRecordV1(mutated, f.ticket, f.contract);
    expect(read.status).toBe('invalid');
    if (read.status === 'invalid') expect(read.reason).toMatch(/dépendance|diffère|contenu.*chang|relecture exacte/iu);
  });

  it('lit les anciens tours sans marqueur et conserve les protocoles futurs en lecture seule', () => {
    const f = setup();
    const oldTurn = resealTurnMutation(f.receipt, turn => { delete turn.protocol; });
    expect(readHopV55AssistedAdviceRecordV1(oldTurn, f.ticket, f.contract)).toMatchObject({ status: 'available', record: {
      turn: { id: f.turn.id, hopAdviceProposal: f.envelope },
    } });
    const futureTurn = resealTurnMutation(f.receipt, turn => { turn.protocol = 'hopAdviceReadonlyV2'; });
    expect(readHopV55AssistedAdviceRecordV1(futureTurn, f.ticket, f.contract)).toMatchObject({
      status: 'unsupportedReadOnly', snapshot: futureTurn,
    });
  });

  it('préserve le format futur en lecture seule et laisse les workspaces sans archives assistées inchangés', async () => {
    const f = setup();
    const database = new MemoryDatabase();
    const legacyRepository = createHopV55WorkspaceRepository({ ownerKey, database });
    const base = await legacyRepository.save(f.workspace, null);
    expect((await legacyRepository.read(ownerKey, workspaceId))?.assistedAdviceTickets).toBeUndefined();

    const contract = createHopV55AssistedAdviceBackendContractV1();
    const currentRepository = createHopV55WorkspaceRepository({ ownerKey, database, assistedAdviceContract: contract });
    const currentClient = createHopV55AssistedAdviceWorkspaceClient({ ownerKey, workspaces: currentRepository, contract });
    const savedTicket = await currentClient.appendTicket(workspaceId, f.ticket, base.revision);
    const opaqueTicket = { format: 'hop-v55-assisted-advice-ticket-v99', id: 'ticket:future', ownerKey, workspaceId,
      operationId: 'operation:future', reference: 'opaque-reference-v99' };
    const rawRow = await database.workspaces.get([ownerKey, workspaceId]);
    if (!rawRow) throw new Error('La ligne fixture persistée est absente.');
    rawRow.workspace.assistedAdviceTickets = [...(rawRow.workspace.assistedAdviceTickets ?? []), opaqueTicket];
    await database.workspaces.put(rawRow);
    const readOnly = await currentClient.readTicketByOperationId(workspaceId, 'operation:future');
    expect(readOnly.status).toBe('unsupportedReadOnly');
    const futureRetry = captureHopV55AssistedAdviceTicketV1({ id: 'ticket:future-retry', operationId: 'operation:future',
      createdAt: '2026-10-04T11:00:02.000Z', launch: f.launch });
    expect(futureRetry.status).toBe('ready');
    if (futureRetry.status !== 'ready') return;
    await expect(currentClient.appendTicket(workspaceId, futureRetry.ticket, savedTicket.workspace.revision))
      .rejects.toMatchObject({ code: 'unsupportedFormat' });

    const unconfiguredClient = createHopV55AssistedAdviceWorkspaceClient({ ownerKey, workspaces: legacyRepository });
    expect(await unconfiguredClient.readTicketByOperationId(workspaceId, 'operation:assist-1')).toMatchObject({ status: 'unsupportedReadOnly' });
    await expect(unconfiguredClient.appendTicket(workspaceId, f.ticket, savedTicket.workspace.revision))
      .rejects.toMatchObject({ code: 'unsupportedFormat' });
    expect(() => unconfiguredClient.createRecord({ id: f.receipt.id, ticket: f.ticket, job: f.receipt.job,
      turn: f.turn, payload: f.receipt.payload })).toThrowError(/contrat assisté absent/i);
    const ordinary = await legacyRepository.save({ ...(await legacyRepository.read(ownerKey, workspaceId))!, title: 'Titre ordinaire modifié' },
      savedTicket.workspace.revision);
    expect(ordinary.title).toBe('Titre ordinaire modifié');
    expect(ordinary.assistedAdviceTickets).toHaveLength(2);
  });
});
