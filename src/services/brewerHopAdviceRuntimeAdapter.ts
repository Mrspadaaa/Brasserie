import {
  HOP_ADVICE_PROTOCOL_V1,
  buildHopAdviceV1Wire,
  hopAdviceV1ClientPartitionKey,
  type HopAdviceV1ClientEntry,
  type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn,
  type HopAdviceV1Scope,
  type HopAdviceV1WireInput,
} from '../../functions/src/brewerHopAdviceTransportV1';
import type { BrewerChatInput, BrewerJob, BrewerReply, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
import {
  assertBrewerHopAdviceProposalEnvelope,
  BREWER_HOP_ADVICE_PROPOSAL_FORMAT,
  stableBrewerHopAdviceJson,
  verifyBrewerHopAdviceEvidence,
  type BrewerHopAdviceProposalEnvelope,
} from '../../functions/src/brewerHopAdviceProposal';
import { readBrewingScenarioEvidence } from '../domain/brewingScenarioArchive';
import {
  createBrewerHopAdviceApiV1,
  type BrewerHopAdviceV1Api,
  type BrewerHopAdviceV1HistoryView,
  type BrewerHopAdviceV1Read,
} from './brewerHopAdviceApi';
import { createBrewerHopAdviceRuntime, type BrewerHopAdviceRuntimeScopeInput, type BrewerHopAdviceRuntimeV1,
  type BrewerHopAdviceHistoryV1, type BrewerHopAdviceV1RuntimeTransport } from './brewerHopAdviceRuntime';
import type { ClientBrewerJob } from './brewerJobs';

export interface BrewerHopAdviceUnsupportedSnapshot {
  source: string;
  snapshot: unknown;
  reason: string;
  operationId?: string;
  input?: BrewerChatInput;
}

export type BrewerHopAdviceApiRuntimeV1 = BrewerHopAdviceRuntimeV1 & {
  /** Explicit raw archive for rows that are retained but cannot be actioned by this client. */
  unsupportedReadOnly(): readonly BrewerHopAdviceUnsupportedSnapshot[];
};

type StoreInput = BrewerChatInput & { mode: NonNullable<BrewerChatInput['mode']> };
type SubmitReceipt = { job: HopAdviceV1PublicJob } | { turn: HopAdviceV1PublicTurn };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const clone = <T>(value: T): T => structuredClone(value);
const sameJson = (left: unknown, right: unknown) => stableBrewerHopAdviceJson(left) === stableBrewerHopAdviceJson(right);

function exactScope(left: unknown, right: HopAdviceV1Scope): boolean {
  return isRecord(left) && left.kind === right.kind && left.id === right.id
    && Object.keys(left).length === 2;
}

function assertOwnerAndScope(envelope: BrewerHopAdviceProposalEnvelope, ownerKey: string,
  storeNamespace: string, expectedScope?: HopAdviceV1Scope): void {
  const launch = envelope.request.contextLaunch;
  if (launch.ownerKey !== ownerKey) throw new Error('La proposition hopAdvice v1 provient d’un autre ownerKey.');
  const source = launch.scope;
  if (hopAdviceV1ClientPartitionKey(ownerKey, source) !== storeNamespace) {
    throw new Error('La proposition hopAdvice v1 cite une autre partition locale.');
  }
  if (expectedScope && !exactScope(source, expectedScope)) {
    throw new Error('La source de la proposition ne correspond pas à la requête exacte.');
  }
}

function unsupportedError(row: BrewerHopAdviceUnsupportedSnapshot): Error & { unsupportedReadOnly: BrewerHopAdviceUnsupportedSnapshot } {
  const error = new Error(row.reason) as Error & { unsupportedReadOnly: BrewerHopAdviceUnsupportedSnapshot };
  error.unsupportedReadOnly = clone(row);
  return error;
}

function assertStoreInput(input: BrewerChatInput, ownerKey: string, namespace: string): asserts input is StoreInput {
  if (!isRecord(input) || !isRecord(input.scope) || !['recipe', 'batch', 'draft', 'app'].includes(String(input.scope.kind))
    || typeof input.scope.id !== 'string' || !input.scope.id.trim() || input.scope.id.trim() !== input.scope.id
    || hopAdviceV1ClientPartitionKey(ownerKey, input.scope as HopAdviceV1Scope) !== namespace
    || typeof input.operationId !== 'string' || !input.operationId.trim() || input.operationId.trim() !== input.operationId
    || typeof input.question !== 'string' || !isRecord(input.hopAdvice) || input.hopAdvice.question !== input.question
    || !['fast', 'auto', 'deep'].includes(String(input.mode))) {
    throw new Error('Entrée client hopAdvice v1 invalide ou hors partition.');
  }
  if (input.scope.kind === 'draft') {
    if (input.draft === undefined || input.localJournal !== undefined) throw new Error('Source draft incomplète ou avec journal inattendu.');
  } else if (input.scope.kind === 'batch') {
    if (input.draft !== undefined) throw new Error('Source batch avec draft inattendu.');
  } else if (input.draft !== undefined || input.localJournal !== undefined) {
    throw new Error('Source recipe/app avec données draft ou journal inattendues.');
  }
}

function inputToWire(input: StoreInput): HopAdviceV1WireInput {
  const common = {
    operationId: input.operationId, question: input.question,
    ...(input.generation === undefined ? {} : { generation: input.generation }),
    ...(input.phase === undefined ? {} : { phase: input.phase }),
    hopAdvice: input.hopAdvice!, analysisMode: input.mode!,
  };
  switch (input.scope.kind) {
    case 'draft': return buildHopAdviceV1Wire({ ...common, scope: { kind: 'draft', id: input.scope.id }, draft: input.draft } as HopAdviceV1ClientEntry);
    case 'batch': return buildHopAdviceV1Wire({ ...common, scope: { kind: 'batch', id: input.scope.id },
      ...(input.localJournal === undefined ? {} : { localJournal: input.localJournal }) } as HopAdviceV1ClientEntry);
    case 'recipe': return buildHopAdviceV1Wire({ ...common, scope: { kind: 'recipe', id: input.scope.id } } as HopAdviceV1ClientEntry);
    case 'app': return buildHopAdviceV1Wire({ ...common, scope: { kind: 'app', id: input.scope.id } } as HopAdviceV1ClientEntry);
  }
}

/**
 * Only the canonical v4 envelope plus its same-turn evidence can become a BrewerTurn.
 * Future proposal bytes are recorded in the sidecar and never cast into the UI type.
 */
function readKnownTurn(value: HopAdviceV1PublicTurn, input: {
  ownerKey: string;
  storeNamespace: string;
  expectedScope?: HopAdviceV1Scope;
  expectedRequest?: unknown;
  operationId: string;
  question: string;
}): BrewerTurn {
  if (value.operationId !== input.operationId || value.question !== input.question) {
    throw new Error('Le tour reçu ne correspond pas exactement à l’opération et au texte capturés.');
  }
  const proposal = value.hopAdviceProposal as unknown;
  if (!isRecord(proposal) || typeof proposal.format !== 'string' || !proposal.format.trim()) {
    throw unsupportedError({ source: 'hopAdviceProposal', snapshot: clone(value),
      operationId: value.operationId, reason: 'Enveloppe hopAdvice absente ou mal formée; le tour reste conservé en lecture seule.' });
  }
  if (proposal.format !== BREWER_HOP_ADVICE_PROPOSAL_FORMAT) {
    throw unsupportedError({ source: 'hopAdviceProposal', snapshot: clone(value), operationId: value.operationId,
      reason: `Format de proposition non pris en charge (${proposal.format}); contenu conservé sans interprétation.` });
  }
  if (value.proposal !== undefined) {
    throw unsupportedError({ source: 'hopAdviceProposal.mixedTurn', snapshot: clone(value), operationId: value.operationId,
      reason: 'Un BrewerProposal ordinaire est joint à la lecture assistée; aucune proposition métier n’est transmise au store.' });
  }
  try {
    assertBrewerHopAdviceProposalEnvelope(proposal);
    assertOwnerAndScope(proposal, input.ownerKey, input.storeNamespace, input.expectedScope);
    if (proposal.request.question !== value.question || input.expectedRequest !== undefined
      && !sameJson(proposal.request, input.expectedRequest)) {
      throw new Error('La requête scellée par la proposition diffère du texte ou du handoff capturés.');
    }
    verifyBrewerHopAdviceEvidence(proposal, value.evidence, {
      readScenario: (evidence, resolve) => readBrewingScenarioEvidence(evidence, resolve),
    });
  } catch (error) {
    throw unsupportedError({ source: 'hopAdviceProposal.invalid', snapshot: clone(value), operationId: value.operationId,
      reason: `Proposition v4 refusée par les contrôles canoniques : ${error instanceof Error ? error.message : 'contenu invalide.'}` });
  }

  const turn: BrewerTurn = {
    id: value.id,
    protocol: value.protocol,
    operationId: value.operationId,
    question: value.question,
    advice: clone(value.advice),
    evidence: clone(value.evidence),
    createdAt: value.createdAt,
    model: value.model,
    reviewed: value.reviewed,
    contextLabel: value.contextLabel,
    hopAdviceProposal: clone(proposal),
    ...(value.reviewModel === undefined ? {} : { reviewModel: value.reviewModel }),
    ...(value.reviewReason === undefined ? {} : { reviewReason: value.reviewReason }),
    ...(value.mode === undefined ? {} : { mode: value.mode }),
  };
  return turn;
}

function toBrewerJob(value: HopAdviceV1PublicJob): BrewerJob {
  const { protocol: _protocol, ...job } = value;
  return clone(job);
}

function mapReply(read: BrewerHopAdviceV1Read<SubmitReceipt>, expected: {
  ownerKey: string; storeNamespace: string; expectedScope: HopAdviceV1Scope;
  operationId: string; question: string; expectedRequest?: unknown;
}): BrewerReply {
  if (read.status === 'unsupportedReadOnly') throw unsupportedError({ source: 'submit', snapshot: read.snapshot, reason: read.reason,
    operationId: expected.operationId });
  if (read.status === 'invalid') throw new Error(`Réponse callable hopAdvice v1 invalide : ${read.reason}`);
  const receipt = read.value;
  if ('job' in receipt) {
    const job = toBrewerJob(receipt.job);
    if (!exactScope(job.scope, expected.expectedScope) || job.operationId !== expected.operationId
      || job.question !== expected.question) throw new Error('Le job reçu diffère de l’opération, question ou source demandée.');
    return { job };
  }
  return { turn: readKnownTurn(receipt.turn, { ...expected, expectedScope: expected.expectedScope }) };
}

export function createBrewerHopAdviceApiRuntime(input: BrewerHopAdviceRuntimeScopeInput & { api: BrewerHopAdviceV1Api }): BrewerHopAdviceApiRuntimeV1 {
  const { ownerKey, scope, api } = input;
  if (!api || api.ownerKey !== ownerKey) throw new Error('L’API assistée doit être capturée sous le même ownerKey que le runtime.');
  const namespace = hopAdviceV1ClientPartitionKey(ownerKey, scope as HopAdviceV1Scope);
  let jobs: ReturnType<typeof createBrewerHopAdviceRuntime>['jobs'];
  const unsupported = new Map<string, BrewerHopAdviceUnsupportedSnapshot>();
  const inputs = new Map<string, BrewerChatInput>();

  const rememberUnsupported = (row: BrewerHopAdviceUnsupportedSnapshot): BrewerHopAdviceUnsupportedSnapshot => {
    const inputFromStore = jobs?.snapshot().jobs.find((job) => job.operationId === row.operationId)?.input;
    const saved = { ...clone(row), ...(row.input || inputFromStore ? { input: clone(row.input ?? inputFromStore) } : {}) };
    let contentKey: string;
    try { contentKey = stableBrewerHopAdviceJson(saved.snapshot); }
    catch { contentKey = `snapshot-${unsupported.size}`; }
    const key = `${saved.source}:${saved.operationId ?? ''}:${contentKey}`;
    unsupported.set(key, saved);
    return saved;
  };
  const failUnsupported = (row: BrewerHopAdviceUnsupportedSnapshot): never => {
    throw unsupportedError(rememberUnsupported(row));
  };
  const expectedRequest = (operationId: string): unknown => {
    const source = inputs.get(operationId) ?? jobs?.snapshot().jobs.find((job) => job.operationId === operationId)?.input;
    return source?.hopAdvice;
  };
  const localInput = (operationId: string) => inputs.get(operationId)
    ?? jobs?.snapshot().jobs.find((job) => job.operationId === operationId)?.input;
  const captureUnsupported = <T>(operationId: string, source: string, action: () => T): T => {
    try { return action(); }
    catch (error) {
      const raw = (error as any)?.unsupportedReadOnly as BrewerHopAdviceUnsupportedSnapshot | undefined;
      if (!raw) throw error;
      throw unsupportedError(rememberUnsupported({ ...raw, source, operationId,
        ...(localInput(operationId) ? { input: localInput(operationId) } : {}) }));
    }
  };
  const baseRuntimeTransport: BrewerHopAdviceV1RuntimeTransport = {
    async userKey() { return api.userKey(); },
    async submit(wire) {
      const read = await api.askWire(wire);
      if (read.status === 'unsupportedReadOnly') failUnsupported({ source: 'submit', snapshot: read.snapshot,
        operationId: wire.operationId, input: localInput(wire.operationId), reason: read.reason });
      if (read.status === 'invalid') throw new Error(`Réponse hopAdvice v1 invalide : ${read.reason}`);
      return captureUnsupported(wire.operationId, 'submit', () => mapReply(read, { ownerKey, storeNamespace: namespace,
        expectedScope: wire.scope, operationId: wire.operationId, question: wire.question,
        expectedRequest: expectedRequest(wire.operationId) }));
    },
    async retry(jobId, operationId) {
      const job = jobs?.snapshot().jobs.find((candidate) => candidate.operationId === operationId);
      const storedInput = localInput(operationId);
      if (!job || !storedInput || job.id !== jobId || storedInput.operationId !== operationId
        || (storedInput.generation ?? 0) !== job.generation || !exactScope(storedInput.scope, job.scope)) {
        throw new Error('Retry hopAdvice sans job et requête locaux exacts; aucune requête de remplacement créée.');
      }
      const request: HopAdviceV1WireInput = inputToWire(storedInput as StoreInput);
      const read = await api.retry({ jobId, operationId, generation: job.generation }, request.scope);
      if (read.status === 'unsupportedReadOnly') failUnsupported({ source: 'retry', snapshot: read.snapshot, operationId,
        input: localInput(operationId), reason: read.reason });
      if (read.status === 'invalid') throw new Error(`Réponse retry hopAdvice v1 invalide : ${read.reason}`);
      return captureUnsupported(operationId, 'retry', () => mapReply(read, { ownerKey, storeNamespace: namespace,
        expectedScope: request.scope, operationId, question: request.question, expectedRequest: expectedRequest(operationId) }));
    },
    async activity() {
      const read = await api.activity();
      if (read.status === 'unsupportedReadOnly') {
        const raw = rememberUnsupported({ source: 'activity', snapshot: read.snapshot, reason: read.reason });
        return localUnreceivedJobs(jobs?.snapshot().jobs ?? [], ownerKey, namespace, raw);
      }
      if (read.status === 'invalid') throw new Error(`Activity hopAdvice v1 invalide : ${read.reason}`);
      const result: ClientBrewerJob[] = [];
      for (const row of read.value.jobs) {
        if (row.status === 'unsupportedReadOnly') {
          const raw = rememberUnsupported({ source: 'activity.job', snapshot: row.snapshot, reason: row.reason,
            ...(minimalOperationId(row.snapshot) ? { operationId: minimalOperationId(row.snapshot) } : {}) });
          result.push(...localJobsForUnsupported(jobs?.snapshot().jobs ?? [], ownerKey, namespace, raw));
          continue;
        }
        if (row.status === 'invalid') throw new Error(`Ligne activity hopAdvice v1 invalide : ${row.reason}`);
        const job = toBrewerJob(row.value);
        if (hopAdviceV1ClientPartitionKey(ownerKey, job.scope as HopAdviceV1Scope) !== namespace) continue;
        const current = jobs?.snapshot().jobs.find((candidate) => candidate.operationId === job.operationId);
        if (current?.input && (current.input.question !== job.question || current.input.operationId !== job.operationId
          || (current.input.generation ?? 0) !== job.generation || !exactScope(current.input.scope, job.scope))) {
          throw new Error('Activity v1 croise l’identité source, le texte ou la génération d’une entrée locale.');
        }
        result.push({ ...job, unsupportedReadOnly: undefined, sendError: undefined });
      }
      return result;
    },
    async status(statusInput) {
      if (!isRecord(statusInput.scope) || hopAdviceV1ClientPartitionKey(ownerKey, statusInput.scope as HopAdviceV1Scope) !== namespace) {
        throw new Error('Status hors partition hopAdvice v1.');
      }
      const read = await api.status({ scope: statusInput.scope as HopAdviceV1Scope, operationId: statusInput.operationId,
        generation: statusInput.generation });
      if (read.status === 'unsupportedReadOnly') failUnsupported({ source: 'status', snapshot: read.snapshot,
        operationId: statusInput.operationId, input: localInput(statusInput.operationId), reason: read.reason });
      if (read.status === 'invalid') throw new Error(`Status hopAdvice v1 invalide : ${read.reason}`);
      if (read.status !== 'available') throw new Error('Status hopAdvice v1 non disponible.');
      const receipt = read.value;
      if ('job' in receipt) {
        const job = toBrewerJob(receipt.job);
        if (!exactScope(job.scope, statusInput.scope as HopAdviceV1Scope) || job.operationId !== statusInput.operationId
          || job.generation !== (statusInput.generation ?? 0) || job.question !== statusInput.question) {
          throw new Error('Status job hopAdvice v1 différent du scope, du texte ou de la génération locale.');
        }
        return { job, ...(receipt.pending ? { pending: clone(receipt.pending) } : {}) };
      }
      if ('turn' in receipt) return captureUnsupported(statusInput.operationId, 'status', () => ({
        turn: readKnownTurn(receipt.turn, { ownerKey, storeNamespace: namespace,
          expectedScope: statusInput.scope as HopAdviceV1Scope, operationId: statusInput.operationId, question: statusInput.question,
          expectedRequest: expectedRequest(statusInput.operationId) })
      }));
      if ('pending' in receipt) return { pending: clone(receipt.pending) };
      return {};
    },
    async markRead(jobId) {
      const job = jobs?.snapshot().jobs.find((candidate) => candidate.id === jobId);
      if (!job || job.unsupportedReadOnly) throw new Error('Lecture refusée sans job connu et qualifié.');
      if (hopAdviceV1ClientPartitionKey(ownerKey, job.scope as HopAdviceV1Scope) !== namespace) throw new Error('MarkRead hors partition.');
      const read = await api.markRead({ jobId });
      if (read.status === 'unsupportedReadOnly') failUnsupported({ source: 'markRead', snapshot: read.snapshot,
        operationId: job.operationId, input: job.input, reason: read.reason });
      if (read.status === 'invalid') throw new Error(`MarkRead hopAdvice v1 invalide : ${read.reason}`);
    },
    async history(requestedScope, before) {
      if (hopAdviceV1ClientPartitionKey(ownerKey, requestedScope as HopAdviceV1Scope) !== namespace) throw new Error('Historique hors partition hopAdvice v1.');
      const read = await api.history({ scope: requestedScope as HopAdviceV1Scope, ...(before === undefined ? {} : { before }) });
      if (read.status !== 'available') {
        if (read.status === 'unsupportedReadOnly') failUnsupported({ source: 'history', snapshot: read.snapshot, reason: read.reason });
        throw new Error(`Historique hopAdvice v1 invalide : ${read.reason}`);
      }
      const history = toHistory(read.value, { ownerKey, namespace, requestedScope, inputFor: localInput, rememberUnsupported });
      if (history.unsupportedReadOnly?.length) {
        throw unsupportedError({ source: 'history.turns', snapshot: clone(history.unsupportedReadOnly),
          reason: 'L’historique contient des tours conservés en lecture seule; aucun historique partiel n’est présenté comme complet.' });
      }
      return history;
    },
    async reset(requestedScope, generation, operationId) {
      if (hopAdviceV1ClientPartitionKey(ownerKey, requestedScope as HopAdviceV1Scope) !== namespace) throw new Error('Reset hors partition hopAdvice v1.');
      const read = await api.reset({ scope: requestedScope as HopAdviceV1Scope, operationId, generation });
      if (read.status !== 'available') {
        if (read.status === 'unsupportedReadOnly') failUnsupported({ source: 'reset', snapshot: read.snapshot, operationId, reason: read.reason });
        throw new Error(`Reset hopAdvice v1 invalide : ${read.reason}`);
      }
      return { generation: read.value.generation };
    },
  };

  const runtime = createBrewerHopAdviceRuntime({ ownerKey, scope, transport: baseRuntimeTransport });
  jobs = runtime.jobs;
  const runtimeSubmit = runtime.jobs.submit.bind(runtime.jobs);
  // Capture the original user request before the store projects it to the wire DTO.
  const jobsWithCapture = runtime.jobs as typeof runtime.jobs & { submit: typeof runtime.jobs.submit };
  jobsWithCapture.submit = (input, label) => {
    assertStoreInput(input, ownerKey, namespace);
    const prior = inputs.get(input.operationId);
    if (prior && !sameJson(prior, input)) throw new Error('operationId hopAdvice réutilisé avec une entrée différente.');
    inputs.set(input.operationId, clone(input));
    runtimeSubmit(input, label);
  };

  return {
    ...runtime,
    unsupportedReadOnly: () => [...unsupported.values()].map(clone),
  };
}

function minimalOperationId(snapshot: unknown): string | undefined {
  return isRecord(snapshot) && typeof snapshot.operationId === 'string' && snapshot.operationId.trim() === snapshot.operationId
    ? snapshot.operationId : undefined;
}

function localJobsForUnsupported(jobs: ClientBrewerJob[], ownerKey: string, namespace: string,
  unsupported: BrewerHopAdviceUnsupportedSnapshot): ClientBrewerJob[] {
  const operationId = unsupported.operationId;
  if (!operationId) return [];
  return jobs.flatMap((job) => job.operationId === operationId && job.input && job.readAt === undefined
    && !job.turn && job.input.operationId === operationId && isRecord(job.scope)
    && (() => { try { return hopAdviceV1ClientPartitionKey(ownerKey, job.input!.scope as HopAdviceV1Scope) === namespace
      && exactScope(job.scope, job.input!.scope as HopAdviceV1Scope); } catch { return false; } })()
    ? [{ ...job, status: 'error' as const, sending: false, sendError: unsupported.reason,
      unsupportedReadOnly: clone(unsupported), input: clone(job.input) }]
    : []);
}

function localUnreceivedJobs(jobs: ClientBrewerJob[], ownerKey: string, namespace: string,
  unsupported: BrewerHopAdviceUnsupportedSnapshot): ClientBrewerJob[] {
  return jobs.filter((job) => job.input && job.readAt === undefined && !job.turn && isRecord(job.scope)
    && (() => { try { return hopAdviceV1ClientPartitionKey(ownerKey, job.scope as HopAdviceV1Scope) === namespace; } catch { return false; } })())
    .map((job) => ({ ...job, status: 'error' as const, sending: false, sendError: unsupported.reason,
      unsupportedReadOnly: clone({ ...unsupported, operationId: job.operationId, input: clone(job.input) }), input: clone(job.input) }));
}

function toHistory(view: BrewerHopAdviceV1HistoryView, context: {
  ownerKey: string; namespace: string; requestedScope: BrewerScope; inputFor(operationId: string): BrewerChatInput | undefined;
  rememberUnsupported(row: BrewerHopAdviceUnsupportedSnapshot): BrewerHopAdviceUnsupportedSnapshot;
}): BrewerHopAdviceHistoryV1 {
  const turns: BrewerTurn[] = [];
  const unsupportedRows: BrewerHopAdviceUnsupportedSnapshot[] = [];
  for (const row of view.turns) {
    if (row.status === 'unsupportedReadOnly') {
      const operationId = minimalOperationId(row.snapshot);
      const input = operationId ? context.inputFor(operationId) : undefined;
      unsupportedRows.push(context.rememberUnsupported({ source: 'history.turn', snapshot: row.snapshot, reason: row.reason,
        ...(operationId ? { operationId } : {}), ...(input ? { input } : {}) }));
      continue;
    }
    if (row.status === 'invalid') throw new Error(`Tour d’historique hopAdvice v1 invalide : ${row.reason}`);
    const operationId = row.value.operationId;
    const localInput = context.inputFor(operationId);
    try {
      turns.push(readKnownTurn(row.value, { ownerKey: context.ownerKey, storeNamespace: context.namespace,
        operationId, question: row.value.question,
        ...(localInput?.hopAdvice ? { expectedRequest: localInput.hopAdvice } : {}) }));
    } catch (error) {
      const unsupportedReadOnly = (error as any)?.unsupportedReadOnly as BrewerHopAdviceUnsupportedSnapshot | undefined;
      if (!unsupportedReadOnly) throw error;
      unsupportedRows.push(context.rememberUnsupported({ ...unsupportedReadOnly, source: 'history.turn',
        ...(localInput ? { input: localInput } : {}),
        snapshot: unsupportedReadOnly.snapshot ?? clone(row.value) }));
    }
  }
  return Object.assign(turns, { generation: view.generation, ...(view.draft === undefined ? {} : { draft: clone(view.draft) }),
    ...(unsupportedRows.length ? { unsupportedReadOnly: unsupportedRows } : {}) }) as BrewerHopAdviceHistoryV1;
}

/** Host-compatible factory. Firebase remains lazy inside the callable API. */
export function createBrewerHopAdviceApiRuntimeFactory(apiForOwner: (ownerKey: string) => BrewerHopAdviceV1Api =
  (ownerKey) => createBrewerHopAdviceApiV1({ ownerKey })):
  (input: BrewerHopAdviceRuntimeScopeInput) => BrewerHopAdviceApiRuntimeV1 {
  return ({ ownerKey, scope }) => createBrewerHopAdviceApiRuntime({ ownerKey, scope, api: apiForOwner(ownerKey) });
}
