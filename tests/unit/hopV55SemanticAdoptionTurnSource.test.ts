import { describe, expect, it, vi } from 'vitest';
import source4Fixture from '../fixtures/source4-contract-fixture.json';
import type { BrewerEvidence } from '../../functions/src/companionTypes';
import { HOP_ADVICE_PROTOCOL_V1, buildHopAdviceV1WireV3, type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn } from '../../functions/src/brewerHopAdviceTransportV1';
import { brewerAdviceFromSemanticProposalV5 } from '../../functions/src/brewerHopAdviceSemanticAdapter';
import { createBrewerHopAdviceProposalEnvelopeV5 } from '../../functions/src/brewerHopAdviceSemanticV3';
import { createBrewerHopAdviceProposalEnvelopeV6 } from '../../functions/src/brewerHopAdviceSemanticV6';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import type { HopV55Workspace, HopV55WorkspaceRepository } from '../../src/services/hopV55/contracts';
import { createHopV55DecisionReadingArchiveV4, readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import { prepareHopV55SemanticAssistedAdviceLaunchV1 } from '../../src/services/hopV55/assistedSemanticAdviceContextV4';
import type { HopV55SemanticAdoptionPrincipalV1 } from '../../src/services/hopV55/assistedSemanticAdviceAdoptionV6';
import {
  createHopV55AssistedAdviceRecordV2,
  createHopV55AssistedAdviceTicketV2,
  createHopV55AssistedAdviceTicketV3,
  hopV55AssistedAdviceRecordV2Reference,
  type HopV55AssistedAdviceSemanticTicket,
} from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';
import {
  assertHopV55SemanticAdviceArchiveAppendOnlyV1,
  assertHopV55SemanticAdviceArchiveCollectionsV1,
  createHopV55SemanticAdoptionTurnSourceV1,
  readHopV55SemanticAdoptionTurnClosureV1,
  type HopV55SemanticAdviceArchiveWorkspaceV1,
} from '../../src/services/hopV55/semanticAdoptionTurnSource';

const QUESTION = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const OWNER = 'owner:semantic-turn-source-fixture';
const WORKSPACE = 'workspace:semantic-turn-source-fixture';
const CREATED_AT = '2026-10-04T12:00:00.000Z';
const TICKET_ID = 'ticket:semantic-turn-source-01';
const OPERATION_ID = 'operation-semantic-turn-source-01';
const POLICY = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie : choix local explicite du brasseur avant envoi.' };
const evidence: BrewerEvidence[] = [{ id: 'E1', name: 'lookup_style_reference', label: 'Fiche de style fixture',
  facts: ['Référence locale du tour.'], limits: ['Pas une mesure de bière.'], data: { styleId: 'fixture-style' } }];
const withoutReference = (value: Record<string, unknown>) => { const { reference: _reference, ...body } = value; return body; };

type Proposal = 'v6' | 'v5' | 'future' | 'missing';

/** Synthetic sources only: the archive, the turn and its evidence are fixtures, not brewing facts. */
function durableClosure(options: { policy?: unknown | null; proposal?: Proposal; largeResponse?: boolean } = {}) {
  const context = makeHopV55FixtureContext('unknown');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55QuestionSemanticV1(QUESTION, prepared);
  if (options.largeResponse) {
    const source = structuredClone((source4Fixture as any).sourceReadingArchive.reading.response);
    if (!source || typeof source.answer !== 'string') throw new Error('La fixture source4 doit contenir une réponse locale connue.');
    source.answer = source.answer.repeat(8000);
    reading.response = source;
  }
  const sourceArchive = createHopV55DecisionReadingArchiveV4({ id: 'reading:semantic-turn-source', ownerKey: OWNER, workspaceId: WORKSPACE,
    recordedAt: CREATED_AT, reading, source: { kind: 'exploration' }, runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
  const base: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: WORKSPACE, ownerKey: OWNER, revision: 3,
    title: 'Fixture fermeture sémantique', intent: { question: QUESTION, criteria: [] },
    decisionReadings: [sourceArchive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: CREATED_AT };
  const launch = prepareHopV55SemanticAssistedAdviceLaunchV1({ archive: sourceArchive, workspace: base, ownerKey: OWNER,
    workspaceId: WORKSPACE, scopeAtPageLaunch: { kind: 'app', id: 'stocks-hops' }, context });
  if (launch.status !== 'ready') throw new Error(`Launch source4 fixture invalide : ${JSON.stringify(launch)}`);
  const request = launch.request;
  const wire = buildHopAdviceV1WireV3({ operationId: OPERATION_ID, question: request.question, scope: request.contextLaunch.scope,
    analysisMode: 'auto', generation: 4, hopAdvice: request });
  const principal: HopV55SemanticAdoptionPrincipalV1 = { principalId: 'principal:host-fixture', ownerKey: OWNER,
    workspaceId: WORKSPACE, scope: structuredClone(wire.scope), label: 'Brasseur fixture' };
  const capture = { id: TICKET_ID, createdAt: CREATED_AT, principal, sourceArchive, wire };
  const created = options.policy === null ? createHopV55AssistedAdviceTicketV2(capture)
    : createHopV55AssistedAdviceTicketV3({ ...capture, candidatePolicy: options.policy ?? POLICY });
  if (created.status !== 'ready') throw new Error(`Ticket fixture refusé : ${JSON.stringify(created)}`);
  const ticket: HopV55AssistedAdviceSemanticTicket = created.ticket;

  const raw = {
    annotationReviews: [], semanticRevisionProposals: [], propertyIntentProposals: [], openQuestions: [], materials: [],
    answer: { summary: 'La lecture reste à confirmer par les éléments disponibles.',
      readingNote: 'Le constat rapporté est conservé sans le transformer en mesure.',
      options: [{ id: 'assist-option-v6-investigation', kind: 'investigation', title: 'Comparer la fiche consultée',
        rationale: 'Cette piste conserve sa provenance documentaire.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: ['E1'] }],
      unknowns: [], program: { kind: 'none', note: 'Aucun programme n’est préparé par cette lecture.' }, refusals: [] },
    optionProposalLinks: [],
  };
  const serverContext = { phase: context.phase, provenance: [...context.provenance], loadedAt: context.now,
    binding: request.contextLaunch.expected };
  const v6 = createBrewerHopAdviceProposalEnvelopeV6({ request, prepared, raw, evidence, serverContext });
  const { optionProposalLinks: _links, ...rawV5 } = structuredClone(raw);
  const proposal = options.proposal ?? 'v6';
  const envelope = proposal === 'v5' ? createBrewerHopAdviceProposalEnvelopeV5({ request, prepared, raw: rawV5, evidence, serverContext })
    : proposal === 'future' ? { format: 'brewer-hop-advice-proposal-v99', opaque: { kept: ['raw', 'V99'] } } : v6;
  const job: HopAdviceV1PublicJob = { id: `job:${OPERATION_ID}`, operationId: OPERATION_ID, scope: structuredClone(wire.scope),
    generation: 4, question: wire.question, label: 'Écran de fixture', status: 'done', stage: 'saving',
    createdAt: Date.parse(CREATED_AT), updatedAt: Date.parse(CREATED_AT), finishedAt: Date.parse(CREATED_AT), attempt: 1,
    protocol: HOP_ADVICE_PROTOCOL_V1.name };
  const turn = { id: job.id, operationId: OPERATION_ID, question: wire.question,
    advice: brewerAdviceFromSemanticProposalV5(proposal === 'v5' ? (envelope as any).proposal : v6.proposal),
    evidence: structuredClone(evidence), createdAt: Date.parse(CREATED_AT), model: 'gemini-3.8-flash', reviewed: true,
    reviewModel: 'gemini-2.5-flash', reviewReason: 'fast', mode: 'auto', contextLabel: 'Fixture · exploration',
    protocol: HOP_ADVICE_PROTOCOL_V1.name, ...(proposal === 'missing' ? {} : { hopAdviceProposal: envelope }) } as unknown as HopAdviceV1PublicTurn;
  const record = createHopV55AssistedAdviceRecordV2({ id: 'record:semantic-turn-source-01', recordedAt: CREATED_AT, principal,
    ticket, persistedTickets: [ticket], job, turn, fullEvidence: evidence });
  const workspace: HopV55SemanticAdviceArchiveWorkspaceV1 = { ...base, assistedSemanticAdviceTickets: [ticket],
    assistedSemanticAdviceRecords: [record] };
  return { base, workspace, ticket, record, request, wire, sourceArchive, envelope, v6, principal, job, turn };
}

const read = (workspace: HopV55Workspace) => readHopV55SemanticAdoptionTurnClosureV1({ workspace, ownerKey: OWNER,
  workspaceId: WORKSPACE, ticketId: TICKET_ID, operationId: OPERATION_ID });

describe('source durable de la fermeture d’adoption V6', () => {
  it('relit sans perte la fermeture V3/V2 complète, archive4 locale au-delà du wire comprise, après un aller-retour JSON', () => {
    const f = durableClosure({ largeResponse: true });
    expect(new TextEncoder().encode(JSON.stringify(f.sourceArchive)).byteLength).toBeGreaterThan(1_700_000);
    expect(new TextEncoder().encode(JSON.stringify(f.wire)).byteLength).toBeLessThan(100_000);
    const reloaded = JSON.parse(JSON.stringify(f.workspace)) as HopV55Workspace;
    const result = read(reloaded);
    if (result.status !== 'available') throw new Error(`Fermeture attendue : ${JSON.stringify(result)}`);
    const closure = result.closure;
    expect(closure.sourceTicketReference).toBe(f.ticket.reference);
    expect(closure.sourceRecordReference).toBe(f.record.reference);
    expect(closure.wireReference).toBe(f.ticket.references.wireReference);
    expect(closure.ticket).toEqual({ ticketId: TICKET_ID, operationId: OPERATION_ID, generation: 4, ownerKey: OWNER,
      workspaceId: WORKSPACE, scope: f.ticket.scope, requestReference: f.ticket.references.requestReference });
    expect(closure.request).toEqual(f.ticket.request);
    expect(closure.request).not.toHaveProperty('candidatePolicy');
    expect(closure.sourceArchive).toEqual(f.sourceArchive);
    expect(closure.envelope).toEqual(f.v6);
    expect(closure.turnEvidence).toEqual(evidence);
    expect(closure.candidatePolicy).toEqual(POLICY);
  });

  it('ne déduit ni ne complète la politique d’un ticket V2 : lisible, préservé, jamais adoptable', () => {
    const f = durableClosure({ policy: null });
    expect(f.ticket.format).toBe('hop-v55-assisted-advice-ticket-v2');
    const result = read(f.workspace);
    expect(result).toMatchObject({ status: 'unsupportedReadOnly', raw: f.ticket });
    expect(result).not.toHaveProperty('closure');
    expect((f.workspace.assistedSemanticAdviceTickets ?? [])[0]).toEqual(f.ticket);
  });

  it.each(['v5', 'future', 'missing'] as const)('garde opaque un tour %s exact sans fabriquer ni adapter de V6', proposal => {
    const f = durableClosure({ proposal });
    expect(f.record.semantic.kind).toBe('opaqueReadOnly');
    const result = read(f.workspace);
    expect(result).toMatchObject({ status: 'unsupportedReadOnly', raw: { reference: f.record.reference, turn: f.turn } });
    expect(result).not.toHaveProperty('closure');
  });

  it('distingue absence, ambiguïté, altération et ticket V1 sans substituer une autre fermeture', () => {
    const f = durableClosure();
    expect(readHopV55SemanticAdoptionTurnClosureV1({ workspace: f.workspace, ownerKey: OWNER, workspaceId: WORKSPACE,
      ticketId: 'ticket:other', operationId: 'operation:other' })).toMatchObject({ status: 'absent' });
    expect(read({ ...f.workspace, assistedSemanticAdviceRecords: [] } as HopV55Workspace)).toMatchObject({ status: 'absent' });
    expect(readHopV55SemanticAdoptionTurnClosureV1({ workspace: f.workspace, ownerKey: OWNER, workspaceId: WORKSPACE,
      ticketId: TICKET_ID, operationId: 'operation:other' })).toMatchObject({ status: 'invalid' });
    expect(readHopV55SemanticAdoptionTurnClosureV1({ workspace: f.workspace, ownerKey: 'owner:other', workspaceId: WORKSPACE,
      ticketId: TICKET_ID, operationId: OPERATION_ID })).toMatchObject({ status: 'invalid' });

    const tampered = structuredClone(f.record) as any;
    tampered.fullEvidence[0].facts = ['Fait réécrit après réception.'];
    expect(read({ ...f.workspace, assistedSemanticAdviceRecords: [tampered] } as HopV55Workspace)).toMatchObject({ status: 'invalid' });

    const second = structuredClone(f.record) as any;
    second.id = 'record:semantic-turn-source-duplicate';
    second.reference = hopV55AssistedAdviceRecordV2Reference(withoutReference(second));
    expect(read({ ...f.workspace, assistedSemanticAdviceRecords: [f.record, second] } as HopV55Workspace)).toMatchObject({ status: 'invalid' });

    const legacy = { format: 'hop-v55-assisted-advice-ticket-v1', id: 'ticket:v1', operationId: OPERATION_ID, ownerKey: OWNER, workspaceId: WORKSPACE };
    expect(read({ ...f.workspace, assistedAdviceTickets: [legacy] } as HopV55Workspace)).toMatchObject({ status: 'unsupportedReadOnly' });
  });

  it('relit le dépôt à chaque appel, sans mémoire entre deux lectures', async () => {
    const f = durableClosure();
    let current: HopV55Workspace | null = f.workspace;
    const repository: HopV55WorkspaceRepository = { list: async () => (current ? [current] : []),
      read: vi.fn(async () => current && structuredClone(current)), save: vi.fn(async () => { throw new Error('Aucune écriture.'); }),
      close: () => undefined };
    const source = createHopV55SemanticAdoptionTurnSourceV1({ workspaces: repository });
    const request = { ownerKey: OWNER, workspaceId: WORKSPACE, ticketId: TICKET_ID, operationId: OPERATION_ID };
    expect(await source.read(request)).toMatchObject({ status: 'available' });
    current = { ...f.workspace, assistedSemanticAdviceRecords: [] } as HopV55Workspace;
    expect(await source.read(request)).toMatchObject({ status: 'absent' });
    current = null;
    expect(await source.read(request)).toMatchObject({ status: 'absent' });
    expect(repository.read).toHaveBeenCalledTimes(3);
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('validateurs de collections sémantiques proposés au dépôt (#67)', () => {
  const collections = (workspace: HopV55SemanticAdviceArchiveWorkspaceV1) => ({ ownerKey: OWNER, workspaceId: WORKSPACE,
    tickets: workspace.assistedSemanticAdviceTickets, records: workspace.assistedSemanticAdviceRecords,
    legacyTickets: workspace.assistedAdviceTickets, decisionReadings: workspace.decisionReadings });

  it('accepte une fermeture exacte et refuse ticket V1 réemployé, record orphelin, archive absente ou doublon', () => {
    const f = durableClosure();
    expect(() => assertHopV55SemanticAdviceArchiveCollectionsV1(collections(f.workspace))).not.toThrow();
    const future = { format: 'hop-v55-assisted-advice-ticket-v99', id: 'ticket:future', ownerKey: OWNER, workspaceId: WORKSPACE, raw: ['V99'] };
    expect(() => assertHopV55SemanticAdviceArchiveCollectionsV1(collections({ ...f.workspace,
      assistedSemanticAdviceTickets: [f.ticket, future] }))).not.toThrow();
    expect(() => assertHopV55SemanticAdviceArchiveCollectionsV1(collections({ ...f.workspace,
      assistedAdviceTickets: [{ format: 'hop-v55-assisted-advice-ticket-v1', id: 'ticket:v1', operationId: OPERATION_ID, ownerKey: OWNER }] })))
      .toThrow(/V1/);
    expect(() => assertHopV55SemanticAdviceArchiveCollectionsV1(collections({ ...f.workspace, assistedSemanticAdviceTickets: [] })))
      .toThrow(/ticket durable/);
    expect(() => assertHopV55SemanticAdviceArchiveCollectionsV1(collections({ ...f.workspace, decisionReadings: [] })))
      .toThrow(/archive4/);
    expect(() => assertHopV55SemanticAdviceArchiveCollectionsV1(collections({ ...f.workspace,
      assistedSemanticAdviceTickets: [f.ticket, f.ticket] }))).toThrow(/dupliqu/);
  });

  it('n’ajoute qu’un ticket V3 après son archive et un record après son ticket, sans réécrire l’historique', () => {
    const f = durableClosure();
    const empty = f.base as HopV55SemanticAdviceArchiveWorkspaceV1;
    const withTicket = { ...f.base, assistedSemanticAdviceTickets: [f.ticket] } as HopV55SemanticAdviceArchiveWorkspaceV1;
    expect(() => assertHopV55SemanticAdviceArchiveAppendOnlyV1({ previous: empty, next: withTicket })).not.toThrow();
    expect(() => assertHopV55SemanticAdviceArchiveAppendOnlyV1({ previous: withTicket, next: f.workspace })).not.toThrow();
    expect(() => assertHopV55SemanticAdviceArchiveAppendOnlyV1({ previous: empty, next: f.workspace }))
      .toThrow(/CAS antérieur/);
    expect(() => assertHopV55SemanticAdviceArchiveAppendOnlyV1({ previous: { ...empty, decisionReadings: [] }, next: withTicket }))
      .toThrow(/archive4/);
    const v2 = durableClosure({ policy: null });
    expect(() => assertHopV55SemanticAdviceArchiveAppendOnlyV1({ previous: v2.base,
      next: { ...v2.base, assistedSemanticAdviceTickets: [v2.ticket] } as HopV55Workspace })).toThrow(/V3/);
    const rewritten = structuredClone(f.workspace) as any;
    rewritten.assistedSemanticAdviceRecords[0].recordedAt = '2026-10-05T12:00:00.000Z';
    expect(() => assertHopV55SemanticAdviceArchiveAppendOnlyV1({ previous: f.workspace, next: rewritten })).toThrow(/append-only/);
  });
});
