// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerChatInput, BrewerJob, BrewerScope } from '../../functions/src/companionTypes';
import {
  HOP_ADVICE_PROTOCOL_V1,
  HOP_ADVICE_V1_FUNCTIONS,
  type HopAdviceV1Scope,
} from '../../functions/src/brewerHopAdviceTransportV1';
import {
  BREWER_HOP_ADVICE_REQUEST_FORMAT,
  createBrewerHopAdviceProposalEnvelope,
  validateBrewerHopAdviceRequest,
  type BrewerHopAdviceRequest,
} from '../../functions/src/brewerHopAdviceProposal';
import { projectBrewerHopAdviceContext } from '../../functions/src/brewerHopAdviceContextBinding';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { createBrewerHopAdviceApiV1, type BrewerHopAdviceV1CallableName, type BrewerHopAdviceV1CallableTransport } from '../../src/services/brewerHopAdviceApi';
import { createBrewerHopAdviceApiRuntime, createBrewerHopAdviceApiRuntimeFactory } from '../../src/services/brewerHopAdviceRuntimeAdapter';
import type { HopV55AssistedRuntimeFactory } from '../../src/ui/hopV55/Host';

const ownerKey = 'owner:runtime-adapter-fixture';
const question = 'Garde la poire, examine le houblon 🍐 — sans inventer de mesure.';
const createdAt = Date.parse('2026-10-04T10:00:00.000Z');
const runtimes: Array<ReturnType<typeof createBrewerHopAdviceApiRuntime>> = [];

function setup(scopeOverride?: HopAdviceV1Scope) {
  const context = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(context);
  const defaultScope: HopAdviceV1Scope = { kind: 'recipe', id: context.recipe!.id! };
  const scope = scopeOverride ?? defaultScope;
  const projection = projectBrewerHopAdviceContext({ scope, context, runtime: prepared.runtime });
  if (projection.status !== 'ready') throw new Error(`Projection fixture refusée : ${JSON.stringify(projection)}`);
  const sourceReadingReference = 'reading:adapter-fixture';
  const contextLaunch = { format: 'brewer-hop-advice-context-launch-v1' as const, ownerKey,
    workspaceId: 'workspace:adapter-fixture', sourceReadingReference,
    source: scope.kind === 'recipe' ? { kind: 'recipe' as const, id: scope.id }
      : scope.kind === 'batch' ? { kind: 'batch' as const, id: scope.id }
        : { kind: 'exploration' as const },
    sourceRuntimeReference: 'runtime:adapter-fixture', scope, expected: projection.projection };
  const request: BrewerHopAdviceRequest = validateBrewerHopAdviceRequest({ format: BREWER_HOP_ADVICE_REQUEST_FORMAT,
    question, sourceReadingReference, contextLaunch, readerAnnotations: [], readerScopes: [] }, question);
  const envelope = createBrewerHopAdviceProposalEnvelope({ request, evidence: [], readers: {},
    serverContext: { phase: 'planning', provenance: ['Fixture synthétique de test.'], loadedAt: createdAt,
      binding: projection.projection },
    raw: {
      readerReview: [], annotations: [], scopes: [], openQuestions: [], materials: [],
      answer: {
        summary: 'Une piste à examiner.', readingNote: 'Lecture conservée comme proposition.',
        options: [{ id: 'assist-option', kind: 'investigation', title: 'Examiner avant de choisir',
          rationale: 'Une observation séparée précède tout changement.', conditions: [], tradeoffs: [], related: [], evidenceIds: [] }],
        unknowns: [], program: { kind: 'none', note: 'Aucun programme préparé.' }, refusals: [],
      },
    } });
  const input: BrewerChatInput = { scope, operationId: 'op:adapter-fixture', question, generation: 2,
    mode: 'deep', hopAdvice: request };
  return { context, prepared, scope, request, envelope, input };
}

function turnPayload(f: ReturnType<typeof setup>, proposal: unknown = f.envelope) {
  return { protocol: HOP_ADVICE_PROTOCOL_V1.name,
    turn: { protocol: HOP_ADVICE_PROTOCOL_V1.name, id: 'turn:adapter-fixture', operationId: f.input.operationId,
      question, advice: { level: 'info', summary: 'Piste locale.', action: 'Examiner.', why: 'Fixture.', watch: '',
        question: '', evidenceIds: [] }, evidence: [], createdAt, model: 'fixture', reviewed: true,
      contextLabel: 'Fixture hopAdvice', hopAdviceProposal: structuredClone(proposal) } };
}

function fixtureJob(input: BrewerChatInput): BrewerJob {
  return { id: input.operationId, operationId: input.operationId, scope: structuredClone(input.scope),
    generation: input.generation ?? 0, question: input.question, label: 'Question fixture', status: 'queued', stage: 'queued',
    createdAt, updatedAt: createdAt, attempt: 0 };
}

function apiFor(input: ReturnType<typeof setup>, respond: (name: HopAdviceV1CallableName, payload: unknown) => unknown) {
  const calls: Array<{ name: HopAdviceV1CallableName; payload: unknown }> = [];
  const transport: BrewerHopAdviceV1CallableTransport = {
    currentUserKey: vi.fn(async () => ownerKey),
    invoke: vi.fn(async (name, payload) => {
      calls.push({ name, payload: structuredClone(payload) });
      return respond(name, payload);
    }),
  };
  const api = createBrewerHopAdviceApiV1({ ownerKey, transport });
  const runtime = createBrewerHopAdviceApiRuntime({ ownerKey, scope: input.scope, api });
  runtimes.push(runtime);
  return { runtime, transport, calls };
}

function activityEmpty() { return { protocol: HOP_ADVICE_PROTOCOL_V1.name, jobs: [] }; }

afterEach(() => {
  for (const runtime of runtimes.splice(0)) runtime.dispose();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('adaptateur API Hop Advice vers le store client', () => {
  it('ne convertit un tour connu qu’après validation du v4 canonique et des preuves du même tour', async () => {
    const f = setup();
    const { runtime, calls } = apiFor(f, (name) => name === HOP_ADVICE_V1_FUNCTIONS.ask
      ? turnPayload(f) : name === HOP_ADVICE_V1_FUNCTIONS.activity ? activityEmpty() : undefined);
    await runtime.jobs.start();
    runtime.jobs.submit(f.input, 'Lecture assistée');
    await vi.waitFor(() => expect(runtime.jobs.snapshot().jobs[0]?.turn?.hopAdviceProposal).toEqual(f.envelope));
    const job = runtime.jobs.snapshot().jobs[0];
    expect(job.turn?.protocol).toBe(HOP_ADVICE_PROTOCOL_V1.name);
    expect(job.input).toEqual(f.input);
    expect(job.unsupportedReadOnly).toBeUndefined();
    expect(calls.map((call) => call.name)).toContain(HOP_ADVICE_V1_FUNCTIONS.ask);
    expect(calls.map((call) => call.name)).not.toContain('askBrewer');
    expect(runtime.unsupportedReadOnly()).toEqual([]);
  });

  it('expose une factory synchronisée Host avec partition owner/scope canonique et dispose', () => {
    const f = setup();
    const api = createBrewerHopAdviceApiV1({ ownerKey, transport: {
      currentUserKey: vi.fn(async () => ownerKey), invoke: vi.fn(async () => activityEmpty()),
    } });
    const hostFactory: HopV55AssistedRuntimeFactory = createBrewerHopAdviceApiRuntimeFactory(() => api);
    const runtime = hostFactory({ ownerKey, scope: f.scope });
    runtimes.push(runtime);
    expect(runtime.storeNamespace).toContain(ownerKey);
    expect(runtime.mode).toBe(HOP_ADVICE_PROTOCOL_V1.name);
    expect(typeof runtime.dispose).toBe('function');
  });

  it('garde une proposition future intacte et bloque retry/markRead tout en gardant input', async () => {
    const f = setup();
    const futureProposal = { format: 'brewer-hop-advice-proposal-v99', extension: { title: 'Étoile 🟣', evidence: [1, 2] } };
    const rawTurn = turnPayload(f, futureProposal);
    const { runtime, calls } = apiFor(f, (name) => name === HOP_ADVICE_V1_FUNCTIONS.ask
      ? rawTurn : name === HOP_ADVICE_V1_FUNCTIONS.activity ? activityEmpty() : undefined);
    await runtime.jobs.start();
    runtime.jobs.submit(f.input, 'Question avec extension inconnue');
    await vi.waitFor(() => expect(runtime.jobs.snapshot().jobs[0]?.unsupportedReadOnly).toBeDefined());
    const job = runtime.jobs.snapshot().jobs[0];
    expect(job.turn).toBeUndefined();
    expect(job.input).toEqual(f.input);
    expect(job.unsupportedReadOnly).toMatchObject({ source: 'submit', reason: expect.stringContaining('v99'), snapshot: rawTurn.turn });
    expect(runtime.unsupportedReadOnly()).toHaveLength(1);
    runtime.jobs.retry(job);
    runtime.jobs.markRead(job);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(job.input).toEqual(f.input);
    expect(calls.filter((call) => call.name === HOP_ADVICE_V1_FUNCTIONS.ask)).toHaveLength(1);
    expect(calls.some((call) => call.name === HOP_ADVICE_V1_FUNCTIONS.markRead)).toBe(false);
  });

  it('refuse un envelope v4 mal formé ou une source scellée différente sans produire de BrewerTurn', async () => {
    const f = setup();
    const malformed = structuredClone(f.envelope) as Record<string, unknown>;
    malformed.status = 'adopted';
    const differentOwner = structuredClone(f.envelope) as any;
    differentOwner.request.contextLaunch.ownerKey = 'owner:other-session';
    for (const [bad, expectedReason] of [[malformed, /refusée par les contrôles canoniques/i],
      [differentOwner, /autre ownerKey/i]] as const) {
      localStorage.clear();
      const { runtime } = apiFor(f, (name) => name === HOP_ADVICE_V1_FUNCTIONS.ask
        ? turnPayload(f, bad) : name === HOP_ADVICE_V1_FUNCTIONS.activity ? activityEmpty() : undefined);
      await runtime.jobs.start();
      runtime.jobs.submit(f.input, 'Réponse à valider');
      await vi.waitFor(() => expect(runtime.jobs.snapshot().jobs[0]?.unsupportedReadOnly).toBeDefined());
      expect(runtime.jobs.snapshot().jobs[0]?.turn).toBeUndefined();
      expect(runtime.jobs.snapshot().jobs[0]?.input).toEqual(f.input);
      expect(runtime.jobs.snapshot().jobs[0]?.unsupportedReadOnly?.reason).toMatch(expectedReason);
      runtime.dispose();
      runtimes.splice(runtimes.indexOf(runtime), 1);
    }
  });

  it('rend visible le snapshot futur de l’historique au lieu de filtrer silencieusement sa ligne', async () => {
    const f = setup();
    const future = turnPayload(f, { format: 'brewer-hop-advice-proposal-v8', retained: 'raw-value' }).turn;
    const { runtime } = apiFor(f, (name) => name === HOP_ADVICE_V1_FUNCTIONS.conversation
      ? { protocol: HOP_ADVICE_PROTOCOL_V1.name, generation: 2, turns: [future] }
      : name === HOP_ADVICE_V1_FUNCTIONS.activity ? activityEmpty() : undefined);
    let refusal: unknown;
    try { await runtime.history(f.scope as BrewerScope); } catch (error) { refusal = error; }
    expect(refusal).toMatchObject({ unsupportedReadOnly: {
      source: 'history.turns', reason: expect.stringContaining('aucun historique partiel'),
      snapshot: [expect.objectContaining({
      source: 'history.turn', snapshot: future, reason: expect.stringContaining('v8'),
      })],
    } });
    expect(runtime.unsupportedReadOnly()).toEqual([expect.objectContaining({ source: 'history.turn', snapshot: future })]);
  });

  it('refuse de joindre un BrewerProposal ordinaire à un tour assisté', async () => {
    const f = setup();
    const reply = turnPayload(f) as any;
    reply.turn.proposal = { target: 'recipe', title: 'Proposal hors lecture', changes: [] };
    const { runtime, calls } = apiFor(f, (name) => name === HOP_ADVICE_V1_FUNCTIONS.ask
      ? reply : name === HOP_ADVICE_V1_FUNCTIONS.activity ? activityEmpty() : undefined);
    await runtime.jobs.start();
    runtime.jobs.submit(f.input, 'Question assistée');
    await vi.waitFor(() => expect(runtime.jobs.snapshot().jobs[0]?.unsupportedReadOnly).toBeDefined());
    expect(runtime.jobs.snapshot().jobs[0]?.turn).toBeUndefined();
    expect(runtime.jobs.snapshot().jobs[0]?.input).toEqual(f.input);
    expect(runtime.jobs.snapshot().jobs[0]?.unsupportedReadOnly?.reason).toMatch(/BrewerProposal ordinaire/i);
    expect(calls.some((call) => call.name === HOP_ADVICE_V1_FUNCTIONS.markRead)).toBe(false);
  });

  it('recharge un input non confirmé sous activité future en état lecture seule sans nouvel envoi', async () => {
    const f = setup();
    const { runtime, calls } = apiFor(f, (name) => name === HOP_ADVICE_V1_FUNCTIONS.activity
      ? { protocol: 'hopAdviceReadonlyV8', jobs: [{ operationId: f.input.operationId }] } : undefined);
    localStorage.setItem(runtime.storeNamespace, JSON.stringify([{
      ...fixtureJob(f.input), input: f.input,
    }]));
    await runtime.jobs.start();
    await vi.waitFor(() => expect(runtime.jobs.snapshot().jobs[0]?.unsupportedReadOnly).toBeDefined());
    const job = runtime.jobs.snapshot().jobs[0];
    expect(job.input).toEqual(f.input);
    expect(job.turn).toBeUndefined();
    expect(job.unsupportedReadOnly?.snapshot).toEqual({ protocol: 'hopAdviceReadonlyV8', jobs: [{ operationId: f.input.operationId }] });
    expect(calls.some((call) => call.name === HOP_ADVICE_V1_FUNCTIONS.ask)).toBe(false);
  });
});
