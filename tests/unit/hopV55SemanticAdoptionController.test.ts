// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { BrewerEvidence } from '../../functions/src/companionTypes';
import { HOP_ADVICE_PROTOCOL_V1, buildHopAdviceV1WireV3, type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn } from '../../functions/src/brewerHopAdviceTransportV1';
import { brewerAdviceFromSemanticProposalV5 } from '../../functions/src/brewerHopAdviceSemanticAdapter';
import { brewerHopAdviceRequestV3Reference, createBrewerHopAdviceProposalEnvelopeV5 } from '../../functions/src/brewerHopAdviceSemanticV3';
import { createBrewerHopAdviceProposalEnvelopeV6 } from '../../functions/src/brewerHopAdviceSemanticV6';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { HopV55Workspace, HopV55WorkspaceRepository } from '../../src/services/hopV55/contracts';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { prepareHopV55SemanticAssistedAdviceLaunchV1 } from '../../src/services/hopV55/assistedSemanticAdviceContextV4';
import { prepareHopV55SemanticAdoptionPlanV1, confirmHopV55SemanticAdoptionV1,
  type HopV55SemanticAdoptionPrincipalV1, type HopV55SemanticAdoptionTicketV1 } from '../../src/services/hopV55/assistedSemanticAdviceAdoptionV6';
import * as semanticAdoptionCore from '../../src/services/hopV55/assistedSemanticAdviceAdoptionV6';
import { createHopV55DecisionReadingArchiveV4, readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import { createHopV55AssistedAdviceRecordV2, createHopV55AssistedAdviceTicketV2,
  createHopV55AssistedAdviceTicketV3 } from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';
import { assertHopV55SemanticAdviceArchiveAppendOnlyV1, assertHopV55SemanticAdviceArchiveCollectionsV1,
  readHopV55SemanticAdoptionTurnClosureV1, type HopV55SemanticAdviceArchiveWorkspaceV1 } from '../../src/services/hopV55/semanticAdoptionTurnSource';
import { createHopV55SemanticAdoptionController, createHopV55SemanticAdoptionCommitV1,
  readHopV55SemanticAdoptionCommitV1, assertHopV55SemanticAdoptionCommitHistoryV1,
  assertHopV55SemanticAdoptionCommitAppendOnlyV1 } from '../../src/services/hopV55/semanticAdoptionController';

/** Adapter is only a test seam for the canonical repository's validator/CAS code, not a disk-durability proof. */
class CandidateWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
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
class CandidateWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new CandidateWorkspaceTable();
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
  close() { /* Only the repository contract is exercised in this local test seam. */ }
}

type SemanticWorkspace = HopV55SemanticAdviceArchiveWorkspaceV1 & { semanticAdoptionCommits?: unknown[] };

const ownerKey = 'owner:semantic-adoption-controller-fixture';
const workspaceId = 'workspace:semantic-adoption-controller-fixture';
const question = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière sélectionnée dans cette fixture.' };
const evidence: BrewerEvidence = { id: 'E1', name: 'lookup_style_reference', label: 'Fiche de style', facts: ['Référence documentaire fixture.'],
  limits: ['Ne prouve aucun fait de brassin.'], data: { source: 'fixture' } };
const TICKET_ID = 'ticket:v6-fixture';
const OPERATION_ID = 'operation:v6-fixture';

function addIntent(text: string, id: string, sourceQuestion: string) {
  const start = sourceQuestion.indexOf(text);
  if (start < 0) throw new Error(`Fragment absent de la question fixture: ${text}`);
  return { id, property: 'aroma', label: text, role: 'preference', direction: null, qualification: null, required: false,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [{ start, end: start + text.length, text }], basis: 'Piste V6 de fixture, à confirmer.', relatedIntentIds: [] };
}

/**
 * Durable closure exactly as the host persists it: archive4 in decisionReadings, ticket V3 (or a policy-less
 * V2) and the V2 record of the real public turn. Sources are synthetic, not brewing facts.
 */
function fixture(options: { policy?: unknown | null; proposal?: 'v6' | 'v5' } = {}) {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const recipeId = context.recipe?.id;
  if (!recipeId) throw new Error('La fixture doit avoir une recette source.');
  const reading = readHopV55QuestionSemanticV1(question, prepared);
  const sourceArchive = createHopV55DecisionReadingArchiveV4({ id: 'reading:semantic-adoption-controller', ownerKey, workspaceId,
    recordedAt: '2026-10-04T13:10:00.000Z', reading, source: { kind: 'recipe', id: recipeId },
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
  const scope = { kind: 'recipe' as const, id: recipeId };
  const base: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 1,
    title: 'Fixture adoption atomique', intent: { question, criteria: [] }, sourceRecipeId: recipeId,
    decisionReadings: [sourceArchive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-10-04T13:10:00.000Z' };
  const page = { archive: sourceArchive, workspace: base, ownerKey, workspaceId, scopeAtPageLaunch: scope, context };
  const launched = prepareHopV55SemanticAssistedAdviceLaunchV1(page);
  if (launched.status !== 'ready') throw new Error(`Request V3 fixture refusée: ${JSON.stringify(launched)}`);
  const request = launched.request;
  if (!request.sourceView.semantic.annotations[0]) throw new Error('Archive4 fixture doit avoir une annotation source.');
  const raw = {
    annotationReviews: [],
    propertyIntentProposals: [{ proposalId: 'assist-proposal-aroma-home', kind: 'add', sourceAnnotationIds: [],
      intent: addIntent('odeur résineuse', 'assist-added-aroma-home', question), motive: 'Complément proposé à confirmer.' }],
    semanticRevisionProposals: [], openQuestions: [], materials: [],
    answer: { summary: 'Piste documentaire locale.', readingNote: 'La lecture V6 reste une proposition.',
      options: [{ id: 'assist-option-explore', kind: 'investigation', title: 'Documenter la piste', rationale: 'Source exacte fixture.',
        conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: ['E1'] }], unknowns: [],
      program: { kind: 'none', note: 'Aucun programme appliqué.' }, refusals: [] },
    optionProposalLinks: [{ optionId: 'assist-option-explore', proposalId: 'assist-proposal-aroma-home', evidenceIds: ['E1'] }],
  };
  const serverContext = { phase: context.phase, provenance: [...context.provenance], loadedAt: context.now,
    binding: structuredClone(request.contextLaunch.expected) };
  const envelope = createBrewerHopAdviceProposalEnvelopeV6({ request, prepared, raw, evidence: [evidence], serverContext });
  const { optionProposalLinks: _links, ...rawV5 } = structuredClone(raw);
  const turnProposal = options.proposal === 'v5'
    ? createBrewerHopAdviceProposalEnvelopeV5({ request, prepared, raw: rawV5, evidence: [evidence], serverContext }) : envelope;
  const principal: HopV55SemanticAdoptionPrincipalV1 = { principalId: 'principal:fixture', ownerKey, workspaceId, scope, label: 'Brasseur fixture' };
  const wire = buildHopAdviceV1WireV3({ operationId: OPERATION_ID, question: request.question, scope: request.contextLaunch.scope,
    analysisMode: 'auto', generation: 2, hopAdvice: request });
  const capture = { id: TICKET_ID, createdAt: '2026-10-04T13:10:30.000Z', principal, sourceArchive, wire };
  const created = options.policy === null ? createHopV55AssistedAdviceTicketV2(capture)
    : createHopV55AssistedAdviceTicketV3({ ...capture, candidatePolicy: options.policy ?? candidatePolicy });
  if (created.status !== 'ready') throw new Error(`Ticket durable fixture refusé: ${JSON.stringify(created)}`);
  const ticketRow = created.ticket;
  const job: HopAdviceV1PublicJob = { id: `job:${OPERATION_ID}`, operationId: OPERATION_ID, scope: structuredClone(wire.scope), generation: 2,
    question: wire.question, label: 'Recette fixture', status: 'done', stage: 'saving', createdAt: Date.parse('2026-10-04T13:10:40.000Z'),
    updatedAt: Date.parse('2026-10-04T13:10:40.000Z'), finishedAt: Date.parse('2026-10-04T13:10:40.000Z'), attempt: 1,
    protocol: HOP_ADVICE_PROTOCOL_V1.name };
  const turn = { id: job.id, operationId: OPERATION_ID, question: wire.question,
    advice: brewerAdviceFromSemanticProposalV5((turnProposal as { proposal: any }).proposal), evidence: [structuredClone(evidence)],
    createdAt: Date.parse('2026-10-04T13:10:40.000Z'), model: 'gemini-3.8-flash', reviewed: true, mode: 'auto',
    contextLabel: 'Fixture · recette', protocol: HOP_ADVICE_PROTOCOL_V1.name, hopAdviceProposal: turnProposal } as unknown as HopAdviceV1PublicTurn;
  const record = createHopV55AssistedAdviceRecordV2({ id: 'record:v6-fixture', recordedAt: '2026-10-04T13:10:45.000Z', principal,
    ticket: ticketRow, persistedTickets: [ticketRow], job, turn, fullEvidence: [evidence] });
  const workspace: SemanticWorkspace = { ...base, assistedSemanticAdviceTickets: [ticketRow], assistedSemanticAdviceRecords: [record] };
  const ticket: HopV55SemanticAdoptionTicketV1 = { ticketId: TICKET_ID, operationId: OPERATION_ID, generation: 2, ownerKey, workspaceId,
    scope, requestReference: brewerHopAdviceRequestV3Reference(request) };
  const read = readHopV55SemanticAdoptionTurnClosureV1({ workspace, ownerKey, workspaceId, ticketId: TICKET_ID, operationId: OPERATION_ID });
  const planInput = { envelope, request, sourceArchive, turnEvidence: [evidence], ticket, current: page, principal,
    selection: [{ optionId: 'assist-option-explore', proposalId: 'assist-proposal-aroma-home', reason: 'Je confirme cette seule piste.' }],
    head: { kind: 'none' as const }, commandId: 'command:semantic-adoption-fixture', recordId: 'answer:v4:semantic-adoption-fixture',
    requestId: 'request:v3:semantic-adoption-fixture', reason: 'Confirmation explicite de fixture.',
    candidatePolicy: (options.policy ?? candidatePolicy) as typeof candidatePolicy, cultureBinding: null, previewedAt: '2026-10-04T13:11:00.000Z' };
  const baseRepository: HopV55WorkspaceRepository = {
    list: async () => [workspace], read: async () => workspace,
    save: async () => { throw new Error('Ce test de preview ne doit jamais écrire.'); }, close: () => undefined,
  };
  // No `turns`: the controller reads the durable closure itself through `workspaces`.
  const host = {
    workspaces: baseRepository,
    readCurrent: async () => page,
    readPrincipal: async () => principal,
    readCultureBinding: async () => null,
    now: () => '2026-10-04T13:12:00.000Z',
  };
  return { context, prepared, sourceArchive, reading, request, base, workspace, page, scope, ticket, ticketRow, record, read,
    principal, envelope, planInput, host };
}

const previewCommand = (f: ReturnType<typeof fixture>) => ({ ownerKey, workspaceId, ticketId: f.ticket.ticketId,
  operationId: f.ticket.operationId, commandId: f.planInput.commandId, recordId: f.planInput.recordId,
  requestId: f.planInput.requestId, reason: f.planInput.reason, selection: f.planInput.selection });

function confirmed(f: ReturnType<typeof fixture>) {
  const preview = prepareHopV55SemanticAdoptionPlanV1(f.planInput);
  if (preview.status !== 'ready') throw new Error(`Plan V6 attendu: ${JSON.stringify(preview)}`);
  const result = confirmHopV55SemanticAdoptionV1({ ...f.planInput, plan: preview.plan, effectiveAt: '2026-10-04T13:13:00.000Z' });
  if (result.status !== 'ready') throw new Error(`Confirmation V6 attendue: ${JSON.stringify(result)}`);
  return { plan: preview.plan, record: result.record, receipt: result.receipt };
}

const closureRows = (workspace: SemanticWorkspace) => ({ tickets: workspace.assistedSemanticAdviceTickets ?? [],
  records: workspace.assistedSemanticAdviceRecords ?? [] });

/**
 * Contract double of the proposed #67 repository patch: CAS on the revision plus the delivered semantic
 * validators. It is not Dexie and not the real repository (see the `[#67]` test below for that).
 */
function contractRepository(initial: SemanticWorkspace) {
  let stored: SemanticWorkspace = structuredClone(initial);
  const state = { saves: 0, loseNextResponse: false };
  const repository: HopV55WorkspaceRepository = {
    list: async () => [structuredClone(stored)],
    read: async (requestedOwner, id) => (requestedOwner === ownerKey && id === stored.id ? structuredClone(stored) : null),
    async save(workspace, expectedRevision) {
      state.saves += 1;
      const next = structuredClone(workspace) as SemanticWorkspace;
      if (expectedRevision !== stored.revision || next.revision !== stored.revision) {
        throw Object.assign(new Error('Le workspace a changé depuis sa lecture.'), { code: 'staleRevision' });
      }
      assertHopV55SemanticAdviceArchiveCollectionsV1({ ownerKey, workspaceId, tickets: next.assistedSemanticAdviceTickets,
        records: next.assistedSemanticAdviceRecords, legacyTickets: next.assistedAdviceTickets, decisionReadings: next.decisionReadings });
      assertHopV55SemanticAdviceArchiveAppendOnlyV1({ previous: stored, next });
      assertHopV55SemanticAdoptionCommitAppendOnlyV1({ previous: stored.semanticAdoptionCommits, next: next.semanticAdoptionCommits,
        previousAnswers: stored.documentaryAnswers ?? [], nextAnswers: next.documentaryAnswers ?? [], ownerKey, workspaceId,
        previousClosures: closureRows(stored), closures: closureRows(next) });
      stored = { ...next, revision: stored.revision + 1 };
      if (state.loseNextResponse) { state.loseNextResponse = false; throw new Error('Réponse perdue après l’écriture.'); }
      return structuredClone(stored);
    },
    close: () => undefined,
  };
  return { repository, state, stored: () => structuredClone(stored),
    concurrentWrite: () => { stored = { ...stored, revision: stored.revision + 1 }; } };
}

/** Each call is one minute later: a replay must return the first effectiveAt, never a new instant. */
function steppingClock() {
  let tick = 0;
  return () => new Date(Date.parse('2026-10-04T13:12:00.000Z') + (tick++) * 60_000).toISOString();
}

describe('contrôleur d’adoption sémantique V6 sur la fermeture durable V2', () => {
  it('relit la fermeture durable (ticket V3 + record V2) et prépare un aperçu sans appeler le workspace writer', async () => {
    const f = fixture();
    expect(f.read.status).toBe('available');
    const save = vi.spyOn(f.host.workspaces, 'save');
    const result = await createHopV55SemanticAdoptionController(f.host).preview(previewCommand(f));
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.plan.ticket).toEqual(f.ticket);
      expect(result.plan.candidatePolicy).toEqual(candidatePolicy);
      expect(result.plan.requestReference).toBe(brewerHopAdviceRequestV3Reference(f.request));
      expect(result.plan.sourceReadingReference).toBe(f.sourceArchive.contentReference);
      expect(result.plan.expectedHead).toEqual({ kind: 'none' });
      expect(result.preview.record.outcome.kind).toBe('domainAnswer');
    }
    expect(save).not.toHaveBeenCalled();
  });

  it('garde la closure A lisible sous B et refuse son adoption sans réancrage', async () => {
    const f = fixture();
    const b = fixture();
    const contextB = structuredClone(b.context);
    if (!contextB.recipe) throw new Error('La fixture B attend une recette pour distinguer son contexte courant.');
    contextB.recipe.volumeL += 3;
    contextB.provenance.push('Contexte synthétique B avec volume différent.');
    const pageB = { ...b.page, context: contextB, workspace: { ...b.base, revision: b.base.revision + 1 } };
    const host = { ...f.host, readCurrent: async () => pageB };
    const result = await createHopV55SemanticAdoptionController(host).preview(previewCommand(f));
    expect(result).toMatchObject({ status: 'stale', historical: { sourceArchive: { contentReference: f.sourceArchive.contentReference } } });
  });

  it('scelle plan, reçu et answer V4 exacts liés à la fermeture durable; refuse liaison orpheline, append séparé ou fermeture absente', () => {
    const f = fixture();
    if (f.read.status !== 'available') throw new Error('Fermeture durable attendue.');
    const { plan, record, receipt } = confirmed(f);
    const commit = createHopV55SemanticAdoptionCommitV1({ plan, record, receipt, sourceTicketReference: f.read.closure.sourceTicketReference,
      sourceRecordReference: f.read.closure.sourceRecordReference, wireReference: f.read.closure.wireReference });
    expect(commit).toMatchObject({ sourceTicketReference: f.ticketRow.reference, sourceRecordReference: f.record.reference,
      wireReference: f.ticketRow.references.wireReference });
    expect(readHopV55SemanticAdoptionCommitV1(commit)).toMatchObject({ status: 'readOnly', commit });
    const closures = closureRows(f.workspace);
    expect(() => assertHopV55SemanticAdoptionCommitHistoryV1({ commits: [commit], documentaryAnswers: [record], ownerKey, workspaceId, closures })).not.toThrow();
    expect(() => assertHopV55SemanticAdoptionCommitHistoryV1({ commits: [commit], documentaryAnswers: [], ownerKey, workspaceId })).toThrow(/orphelin/u);
    expect(() => assertHopV55SemanticAdoptionCommitHistoryV1({ commits: [commit], documentaryAnswers: [record], ownerKey, workspaceId,
      closures: { tickets: [], records: closures.records } })).toThrow(/fermeture durable/u);
    expect(() => assertHopV55SemanticAdoptionCommitHistoryV1({ commits: [commit], documentaryAnswers: [record], ownerKey, workspaceId,
      closures: { tickets: closures.tickets, records: [] } })).toThrow(/fermeture durable/u);
    expect(() => assertHopV55SemanticAdoptionCommitAppendOnlyV1({ previous: [], next: [commit], previousAnswers: [], nextAnswers: [], ownerKey, workspaceId }))
      .toThrow(/même CAS/u);
    expect(() => assertHopV55SemanticAdoptionCommitAppendOnlyV1({ previous: [], next: [commit], previousAnswers: [], nextAnswers: [record],
      ownerKey, workspaceId, previousClosures: { tickets: [], records: [] }, closures })).toThrow(/fermeture durable/u);
    expect(() => assertHopV55SemanticAdoptionCommitAppendOnlyV1({ previous: [], next: [commit], previousAnswers: [], nextAnswers: [record],
      ownerKey, workspaceId, previousClosures: closures, closures })).not.toThrow();
  });

  it('préserve un format futur en lecture seule et rejette un commit connu altéré', () => {
    const f = fixture();
    if (f.read.status !== 'available') throw new Error('Fermeture durable attendue.');
    const { plan, record, receipt } = confirmed(f);
    const commit = createHopV55SemanticAdoptionCommitV1({ plan, record, receipt, sourceTicketReference: f.read.closure.sourceTicketReference,
      sourceRecordReference: f.read.closure.sourceRecordReference, wireReference: f.read.closure.wireReference });
    const future = { ...commit, format: 'hop-v55-semantic-adoption-commit-v99', future: { retained: true } };
    expect(readHopV55SemanticAdoptionCommitV1(future)).toMatchObject({ status: 'unsupportedReadOnly', raw: future });
    const altered = { ...commit, recordReference: 'answer:v4:foreign' };
    expect(readHopV55SemanticAdoptionCommitV1(altered)).toMatchObject({ status: 'invalid' });
  });

  it('refuse une création attendue sans head si une réponse V4 apparaît avant confirmation', async () => {
    const f = fixture();
    const preview = await createHopV55SemanticAdoptionController(f.host).preview(previewCommand(f));
    if (preview.status !== 'ready') throw new Error(`Preview V6 attendue: ${JSON.stringify(preview)}`);
    const competing = { ...f.planInput, commandId: 'command:other-head', recordId: 'answer:v4:other-head',
      requestId: 'request:v3:other-head', reason: 'Une autre commande crée la tête.' };
    const anotherPlan = prepareHopV55SemanticAdoptionPlanV1(competing);
    if (anotherPlan.status !== 'ready') throw new Error(`Plan de course attendu: ${JSON.stringify(anotherPlan)}`);
    const competingCommit = confirmHopV55SemanticAdoptionV1({ ...competing, plan: anotherPlan.plan, effectiveAt: '2026-10-04T13:14:00.000Z' });
    if (competingCommit.status !== 'ready') throw new Error(`Tête concurrente attendue: ${JSON.stringify(competingCommit)}`);
    const changedWorkspace = { ...f.workspace, documentaryAnswers: [competingCommit.record] };
    const save = vi.fn(async () => { throw new Error('Le writer ne doit pas être appelé après le conflit de tête.'); });
    const host = { ...f.host, workspaces: { ...f.host.workspaces, read: async () => changedWorkspace, save } };
    const refused = await createHopV55SemanticAdoptionController(host).confirm({ ownerKey, workspaceId, plan: preview.plan });
    expect(refused).toMatchObject({ status: 'stale' });
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    { action: 'preview', awaitAt: 'readCurrent', change: 'principal' },
    { action: 'preview', awaitAt: 'readCurrent', change: 'scope' },
    { action: 'preview', awaitAt: 'readCultureBinding', change: 'principal' },
    { action: 'preview', awaitAt: 'readCultureBinding', change: 'scope' },
    { action: 'confirm', awaitAt: 'readCurrent', change: 'principal' },
    { action: 'confirm', awaitAt: 'readCurrent', change: 'scope' },
    { action: 'confirm', awaitAt: 'readCultureBinding', change: 'principal' },
    { action: 'confirm', awaitAt: 'readCultureBinding', change: 'scope' },
  ] as const)('revalide l’autorité après $awaitAt ($change) avant $action', async ({ action, awaitAt, change }) => {
    const f = fixture();
    const stablePreview = await createHopV55SemanticAdoptionController(f.host).preview(previewCommand(f));
    if (stablePreview.status !== 'ready') throw new Error(`Preview V6 attendue: ${JSON.stringify(stablePreview)}`);

    let changed = false;
    const changedPrincipal = change === 'principal'
      ? { ...f.principal, principalId: 'principal:switched-during-await' }
      : { ...f.principal, scope: { ...f.principal.scope, id: 'recipe:switched-during-await' } };
    const readPrincipal = vi.fn(async () => changed ? changedPrincipal : f.principal);
    const readCurrent = vi.fn(async () => { if (awaitAt === 'readCurrent') changed = true; return f.page; });
    const readCultureBinding = vi.fn(async () => { if (awaitAt === 'readCultureBinding') changed = true; return null; });
    const save = vi.fn(async () => { throw new Error('Aucun save ne doit suivre un changement d’autorité.'); });
    const host = { ...f.host, readPrincipal, readCurrent, readCultureBinding, workspaces: { ...f.host.workspaces, save } };
    const prepare = vi.spyOn(semanticAdoptionCore, 'prepareHopV55SemanticAdoptionPlanV1');
    const confirm = vi.spyOn(semanticAdoptionCore, 'confirmHopV55SemanticAdoptionV1');
    prepare.mockClear(); confirm.mockClear();
    const controller = createHopV55SemanticAdoptionController(host);
    const result = action === 'preview'
      ? await controller.preview(previewCommand(f))
      : await controller.confirm({ ownerKey, workspaceId, plan: stablePreview.plan });
    expect(result).toMatchObject({ status: 'stale' });
    expect(readPrincipal).toHaveBeenCalledTimes(2);
    expect(prepare).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    prepare.mockRestore(); confirm.mockRestore();
  });
});

describe('politique de candidats : seule celle scellée dans le ticket durable', () => {
  it('n’adopte jamais depuis un ticket V2 sans politique, même avec un tour V6 vérifié', async () => {
    const f = fixture({ policy: null });
    const prepare = vi.spyOn(semanticAdoptionCore, 'prepareHopV55SemanticAdoptionPlanV1');
    prepare.mockClear();
    const result = await createHopV55SemanticAdoptionController(f.host).preview(previewCommand(f));
    expect(result).toMatchObject({ status: 'unsupported' });
    expect(prepare).not.toHaveBeenCalled();
    prepare.mockRestore();
  });

  it('refuse la confirmation quand la politique durable diffère de celle scellée dans le plan', async () => {
    const a = fixture();
    const preview = await createHopV55SemanticAdoptionController(a.host).preview(previewCommand(a));
    if (preview.status !== 'ready') throw new Error(`Preview V6 attendue: ${JSON.stringify(preview)}`);
    const b = fixture({ policy: { kind: 'explicit', materialIds: [], basis: 'Autre choix local explicite, différent du plan.' } });
    expect(b.ticketRow.reference).not.toBe(a.ticketRow.reference);
    const save = vi.fn(async () => { throw new Error('Aucune écriture.'); });
    const confirm = vi.spyOn(semanticAdoptionCore, 'confirmHopV55SemanticAdoptionV1');
    confirm.mockClear();
    const host = { ...b.host, workspaces: { ...b.host.workspaces, save } };
    const result = await createHopV55SemanticAdoptionController(host).confirm({ ownerKey, workspaceId, plan: preview.plan });
    expect(result).toMatchObject({ status: 'stale', reason: expect.stringMatching(/politique/u) });
    expect(confirm).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('refuse une politique absente même si un lecteur injecté la perd, à l’aperçu comme à la confirmation', async () => {
    const f = fixture();
    if (f.read.status !== 'available') throw new Error('Fermeture durable attendue.');
    const preview = await createHopV55SemanticAdoptionController(f.host).preview(previewCommand(f));
    if (preview.status !== 'ready') throw new Error('Preview V6 attendue.');
    const { candidatePolicy: _policy, ...withoutPolicy } = f.read.closure;
    const save = vi.fn(async () => { throw new Error('Aucune écriture.'); });
    const host = { ...f.host, workspaces: { ...f.host.workspaces, save },
      turns: { read: async () => ({ status: 'available' as const, closure: withoutPolicy as any }) } };
    const controller = createHopV55SemanticAdoptionController(host);
    expect(await controller.preview(previewCommand(f))).toMatchObject({ status: 'unsupported' });
    expect(await controller.confirm({ ownerKey, workspaceId, plan: preview.plan })).toMatchObject({ status: 'unsupported' });
    expect(save).not.toHaveBeenCalled();
  });

  it('garde un tour V5 opaque : aucun plan, aucune V6 fabriquée', async () => {
    const f = fixture({ proposal: 'v5' });
    expect(f.record.semantic).toMatchObject({ kind: 'opaqueReadOnly', status: 'legacyReadOnly' });
    const prepare = vi.spyOn(semanticAdoptionCore, 'prepareHopV55SemanticAdoptionPlanV1');
    prepare.mockClear();
    expect(await createHopV55SemanticAdoptionController(f.host).preview(previewCommand(f))).toMatchObject({ status: 'unsupported' });
    expect(prepare).not.toHaveBeenCalled();
    prepare.mockRestore();
  });
});

describe('[contrat #67 simulé] CAS atomique et rejeu — double de contrat, pas Dexie ni le dépôt réel', () => {
  it('un seul CAS ajoute record V4 et commit; recréé, le contrôleur rend le reçu original; autre empreinte = conflit', async () => {
    const f = fixture();
    const repo = contractRepository(f.workspace);
    const host = { ...f.host, workspaces: repo.repository, now: steppingClock() };
    const preview = await createHopV55SemanticAdoptionController(host).preview(previewCommand(f));
    if (preview.status !== 'ready') throw new Error(`Preview V6 attendue: ${JSON.stringify(preview)}`);
    const result = await createHopV55SemanticAdoptionController(host).confirm({ ownerKey, workspaceId, plan: preview.plan });
    if (result.status !== 'committed') throw new Error(`Commit attendu: ${JSON.stringify(result)}`);
    expect(result).toMatchObject({ recipeEffect: 'none', workspaceRevision: f.workspace.revision + 1 });
    expect(repo.state.saves).toBe(1);
    const stored = repo.stored();
    expect(stored.documentaryAnswers).toHaveLength(1);
    expect(stored.semanticAdoptionCommits).toHaveLength(1);
    expect(stored.assistedSemanticAdviceTickets).toEqual(f.workspace.assistedSemanticAdviceTickets);
    expect(stored.assistedSemanticAdviceRecords).toEqual(f.workspace.assistedSemanticAdviceRecords);
    const commit = readHopV55SemanticAdoptionCommitV1(stored.semanticAdoptionCommits![0]);
    expect(commit).toMatchObject({ status: 'readOnly', commit: { sourceTicketReference: f.ticketRow.reference,
      sourceRecordReference: f.record.reference, wireReference: f.ticketRow.references.wireReference,
      recordReference: result.record.reference, receipt: result.receipt } });

    const reopened = createHopV55SemanticAdoptionController({ ...host });
    expect(await reopened.readHistory({ ownerKey, workspaceId, commandId: f.planInput.commandId }))
      .toMatchObject({ status: 'readOnly', commit: { receipt: result.receipt }, record: { reference: result.record.reference } });
    const replay = await reopened.confirm({ ownerKey, workspaceId, plan: preview.plan });
    expect(replay).toEqual({ status: 'replay', receipt: result.receipt, recipeEffect: 'none', workspaceRevision: f.workspace.revision + 1 });
    expect(repo.state.saves).toBe(1);
    const changedCommand = prepareHopV55SemanticAdoptionPlanV1({ ...f.planInput, reason: 'Autre fingerprint sous le même commandId.' });
    if (changedCommand.status !== 'ready') throw new Error(`Plan concurrent fixture refusé: ${JSON.stringify(changedCommand)}`);
    expect(await reopened.confirm({ ownerKey, workspaceId, plan: changedCommand.plan })).toMatchObject({ status: 'conflict' });
    expect(repo.state.saves).toBe(1);
  });

  it('après une réponse perdue, le même commandId rend le reçu et l’effectiveAt originaux sans second effet', async () => {
    const f = fixture();
    const repo = contractRepository(f.workspace);
    const host = { ...f.host, workspaces: repo.repository, now: steppingClock() };
    const preview = await createHopV55SemanticAdoptionController(host).preview(previewCommand(f));
    if (preview.status !== 'ready') throw new Error('Preview V6 attendue.');
    repo.state.loseNextResponse = true;
    const first = await createHopV55SemanticAdoptionController(host).confirm({ ownerKey, workspaceId, plan: preview.plan });
    if (first.status !== 'replay') throw new Error(`Rejeu durable attendu après perte de réponse: ${JSON.stringify(first)}`);
    const again = await createHopV55SemanticAdoptionController(host).confirm({ ownerKey, workspaceId, plan: preview.plan });
    expect(again).toEqual(first);
    expect(repo.state.saves).toBe(1);
    expect(repo.stored().semanticAdoptionCommits).toHaveLength(1);
    const storedRecord = repo.stored().documentaryAnswers?.[0] as { transition?: { recordedAt?: string } } | undefined;
    expect(storedRecord?.transition?.recordedAt).toBe(first.receipt.effectiveAt);
  });

  it('refuse sans autorebase quand une autre écriture change la révision pendant la confirmation', async () => {
    const f = fixture();
    const repo = contractRepository(f.workspace);
    let confirming = false;
    const host = { ...f.host, workspaces: repo.repository, now: steppingClock(),
      readCultureBinding: async () => { if (confirming) repo.concurrentWrite(); return null; } };
    const preview = await createHopV55SemanticAdoptionController(host).preview(previewCommand(f));
    if (preview.status !== 'ready') throw new Error('Preview V6 attendue.');
    confirming = true;
    const result = await createHopV55SemanticAdoptionController(host).confirm({ ownerKey, workspaceId, plan: preview.plan });
    expect(result).toMatchObject({ status: 'stale' });
    expect(repo.state.saves).toBe(1);
    expect(repo.stored().semanticAdoptionCommits).toBeUndefined();
    expect(repo.stored().documentaryAnswers ?? []).toEqual([]);
  });
});

describe('[#67] dépôt réel — exige l’intégration du patch propriétaire, jamais vert sur l’absence du champ', () => {
  it('stocke la fermeture, confirme en un CAS et rejoue après recréation sur createHopV55WorkspaceRepository', async () => {
    const f = fixture();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database: new CandidateWorkspaceDatabase() });
    const { assistedSemanticAdviceTickets, assistedSemanticAdviceRecords, ...plain } = f.workspace;
    const seeded = await repository.save({ ...plain, revision: 0 }, null);
    // This now fails if #67 is absent; an unsupported field is never a green skip.
    const withTicket = await repository.save({ ...seeded, assistedSemanticAdviceTickets } as HopV55Workspace, seeded.revision);
    const withClosure = await repository.save({ ...withTicket, assistedSemanticAdviceRecords } as HopV55Workspace, withTicket.revision);
    const host = { ...f.host, workspaces: repository, now: steppingClock() };
    const preview = await createHopV55SemanticAdoptionController(host).preview(previewCommand(f));
    if (preview.status !== 'ready') throw new Error(`Preview V6 attendue: ${JSON.stringify(preview)}`);
    const save = vi.spyOn(repository, 'save');
    const result = await createHopV55SemanticAdoptionController(host).confirm({ ownerKey, workspaceId, plan: preview.plan });
    expect(result).toMatchObject({ status: 'committed', recipeEffect: 'none', workspaceRevision: withClosure.revision + 1 });
    expect(save).toHaveBeenCalledTimes(1);
    if (result.status !== 'committed') return;
    const replay = await createHopV55SemanticAdoptionController({ ...host }).confirm({ ownerKey, workspaceId, plan: preview.plan });
    expect(replay).toEqual({ status: 'replay', receipt: result.receipt, recipeEffect: 'none', workspaceRevision: withClosure.revision + 1 });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('refuse un record sans ticket antérieur et refuse les collections mal formées ou hors owner', async () => {
    const f = fixture();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database: new CandidateWorkspaceDatabase() });
    const { assistedSemanticAdviceTickets, assistedSemanticAdviceRecords, ...plain } = f.workspace;
    const seeded = await repository.save({ ...plain, revision: 0 }, null);
    await expect(repository.save({ ...seeded, assistedSemanticAdviceRecords }, seeded.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    await expect(repository.save({ ...seeded, assistedSemanticAdviceTickets, assistedSemanticAdviceRecords }, seeded.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    for (const field of ['assistedSemanticAdviceTickets', 'assistedSemanticAdviceRecords', 'semanticAdoptionCommits']) {
      await expect(repository.save({ ...seeded, [field]: {} }, seeded.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    }
    const wrong = structuredClone(assistedSemanticAdviceTickets);
    (wrong![0] as any).ownerKey = 'owner:foreign-semantic-fixture';
    await expect(repository.save({ ...seeded, assistedSemanticAdviceTickets: wrong }, seeded.revision)).rejects.toMatchObject({ code: 'invalidInput' });
    const stored = await repository.read(ownerKey, workspaceId);
    expect(stored?.revision).toBe(seeded.revision);
    expect(stored?.documentaryAnswers ?? []).toEqual([]);
    expect(stored?.semanticAdoptionCommits).toBeUndefined();
  });

  it('annule le record et le reçu quand le put transactionnel échoue après écriture', async () => {
    const f = fixture();
    const database = new CandidateWorkspaceDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const { assistedSemanticAdviceTickets, assistedSemanticAdviceRecords, ...plain } = f.workspace;
    const seeded = await repository.save({ ...plain, revision: 0 }, null);
    const withTicket = await repository.save({ ...seeded, assistedSemanticAdviceTickets }, seeded.revision);
    const ready = await repository.save({ ...withTicket, assistedSemanticAdviceRecords }, withTicket.revision);
    const controller = createHopV55SemanticAdoptionController({ ...f.host, workspaces: repository });
    const preview = await controller.preview(previewCommand(f));
    if (preview.status !== 'ready') throw new Error('Preview réelle attendue.');
    const put = database.workspaces.put.bind(database.workspaces);
    let written = false;
    database.workspaces.put = async row => { await put(row); written = true; throw new Error('Échec fixture après put.'); };
    const failed = await controller.confirm({ ownerKey, workspaceId, plan: preview.plan });
    expect(written).toBe(true);
    expect(failed.status).toBe('invalid');
    database.workspaces.put = put;
    const after = await repository.read(ownerKey, workspaceId);
    expect(after?.revision).toBe(ready.revision);
    expect(after?.documentaryAnswers ?? []).toEqual([]);
    expect(after?.semanticAdoptionCommits ?? []).toEqual([]);
  });

  it('garde une seule tête pour deux confirmations concurrentes sur la même révision', async () => {
    const f = fixture();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database: new CandidateWorkspaceDatabase() });
    const { assistedSemanticAdviceTickets, assistedSemanticAdviceRecords, ...plain } = f.workspace;
    const seeded = await repository.save({ ...plain, revision: 0 }, null);
    const withTicket = await repository.save({ ...seeded, assistedSemanticAdviceTickets }, seeded.revision);
    const ready = await repository.save({ ...withTicket, assistedSemanticAdviceRecords }, withTicket.revision);
    const a = createHopV55SemanticAdoptionController({ ...f.host, workspaces: repository });
    const b = createHopV55SemanticAdoptionController({ ...f.host, workspaces: repository });
    const [pa, pb] = await Promise.all([
      a.preview({ ...previewCommand(f), commandId: 'race:command-a', recordId: 'race:record-a', requestId: 'race:request-a' }),
      b.preview({ ...previewCommand(f), commandId: 'race:command-b', recordId: 'race:record-b', requestId: 'race:request-b' }),
    ]);
    if (pa.status !== 'ready' || pb.status !== 'ready') throw new Error('Deux previews réelles attendues.');
    const values = await Promise.all([a.confirm({ ownerKey, workspaceId, plan: pa.plan }), b.confirm({ ownerKey, workspaceId, plan: pb.plan })]);
    expect(values.map(value => value.status).sort()).toEqual(['committed', 'stale']);
    const stored = await repository.read(ownerKey, workspaceId);
    expect(stored?.revision).toBe(ready.revision + 1);
    expect(stored?.documentaryAnswers).toHaveLength(1);
    expect(stored?.semanticAdoptionCommits).toHaveLength(1);
  });
});
