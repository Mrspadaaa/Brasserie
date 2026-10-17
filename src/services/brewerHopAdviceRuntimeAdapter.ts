import {
  HOP_ADVICE_PROTOCOL_V1,
  buildHopAdviceV1Wire,
  hopAdviceV1ClientPartitionKey,
  type HopAdviceV1ClientEntry,
  type HopAdviceV1PublicJob,
  type HopAdviceV1PublicTurn,
  type HopAdviceV1Scope,
  type HopAdviceV1WireInput,
  type HopAdviceV1WizardWireInputV1,
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
  createBrewerHopAdviceApiV3,
  readHopAdviceV1PublicTurn,
  type BrewerHopAdviceApiForWizardV1,
  type BrewerHopAdviceV1Api,
  type BrewerHopAdviceApiV3,
  type BrewerHopAdviceV1HistoryView,
  type BrewerHopAdviceV1Read,
} from './brewerHopAdviceApi';
import { createBrewerHopAdviceRuntime, type BrewerHopAdviceRuntimeScopeInput, type BrewerHopAdviceRuntimeV1,
  type BrewerHopAdviceHistoryV1, type BrewerHopAdviceV1RuntimeTransport } from './brewerHopAdviceRuntime';
import type { ClientBrewerJob } from './brewerJobs';
import { createBrewerHopAdviceSemanticRuntimeV3, type BrewerHopAdviceSemanticRuntimeV3 } from './brewerHopAdviceRuntime';
import type { HopV55SemanticJobSnapshotV3 } from './hopV55/semanticAdoptionApplicationHost';
import type { HopV55SemanticWizardJobSnapshotV1 } from './hopV55/semanticAdoptionApplicationHost';
import type { HopV55SemanticJobStoreTransportV3, HopV55SemanticJobSendInputV3, HopV55SemanticJobReadInputV3 } from './brewerJobs';
import type { HopV55SemanticWizardJobStoreTransportV1, HopV55SemanticWizardJobSendInputV1, HopV55SemanticWizardJobReadInputV1 } from './brewerJobs';
import { createBrewerHopAdviceSemanticRuntimeWizardV1, hopAdviceWizardClientPartitionKey,
  type BrewerHopAdviceSemanticRuntimeWizardV1 } from './brewerHopAdviceRuntime';
import { hopAdviceContentReference } from '../domain/hopDecision/adviceContentReference';

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

type V3SubmitRead = BrewerHopAdviceV1Read<SubmitReceipt>;
type V3JobLookup =
  | { status: 'found'; job: HopAdviceV1PublicJob }
  | { status: 'none' }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

function semanticSnapshotBase(input: { operationId: string; generation: number; ticketReference: string; wireReference: string }):
  Pick<HopV55SemanticJobSnapshotV3, 'format' | 'operationId' | 'generation' | 'ticketReference' | 'wireReference'> {
  return { format: 'hop-v55-semantic-job-snapshot-v3', operationId: input.operationId, generation: input.generation,
    ticketReference: input.ticketReference, wireReference: input.wireReference };
}

function semanticJobMatches(job: HopAdviceV1PublicJob, input: { operationId: string; generation: number; question: string; scope: HopAdviceV1Scope }): boolean {
  return job.protocol === HOP_ADVICE_PROTOCOL_V1.name && job.operationId === input.operationId
    && job.generation === input.generation && job.question === input.question
    && exactScope(job.scope, input.scope);
}
function semanticJobError(job: HopAdviceV1PublicJob): string | undefined {
  if (typeof job.error === 'string') return job.error;
  return job.error && typeof job.error.message === 'string' ? job.error.message : undefined;
}

/** Request3 adapter over the existing callable names; lifecycle DTOs remain their closed V1 forms. */
export type BrewerHopAdviceApiRuntimeV3 = BrewerHopAdviceSemanticRuntimeV3 & {
  unsupportedReadOnly(): ReadonlyArray<{ operationId?: string; snapshot: unknown; reason: string }>;
};

export function createBrewerHopAdviceApiRuntimeV3(input: {
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  providerKind: 'fixture' | 'authorizedRequest3';
  api: BrewerHopAdviceApiV3;
}): BrewerHopAdviceApiRuntimeV3 {
  const { ownerKey, workspaceId, scope, providerKind, api } = input;
  if (!api || api.ownerKey !== ownerKey || api.protocol !== 'hopAdviceRequest3') {
    throw new Error('Le runtime Request3 exige son client V3 sous le même owner exact.');
  }
  const unsupported = new Map<string, { operationId?: string; snapshot: unknown; reason: string }>();
  const rememberUnsupported = (inputValue: { operationId?: string; snapshot: unknown; reason: string }) => {
    let key: string;
    try { key = JSON.stringify([inputValue.operationId ?? '', hopAdviceContentReference('hop-v55-runtime-v3-unsupported-v1', inputValue.snapshot)]); }
    catch { key = `${inputValue.operationId ?? ''}:${unsupported.size}`; }
    unsupported.set(key, structuredClone(inputValue));
    return structuredClone(inputValue);
  };
  const failureSnapshot = (send: HopV55SemanticJobSendInputV3, reason: string,
    status: HopV55SemanticJobSnapshotV3['status'] = 'failed', turn?: unknown): HopV55SemanticJobSnapshotV3 => ({
      ...semanticSnapshotBase(send), status, reason, ...(turn === undefined ? {} : { turn }),
    });
  const readCurrentGeneration = async (requestedScope: BrewerScope): Promise<number> => {
    if (!exactScope(requestedScope, scope as HopAdviceV1Scope)) {
      throw new Error('La lecture de génération vise un scope différent du runtime Request3.');
    }
    const read = await api.history({ scope: scope as HopAdviceV1Scope });
    if (read.status !== 'available') {
      throw new Error(read.status === 'unsupportedReadOnly'
        ? 'La génération courante est conservée sans interpréter l’historique futur.'
        : read.status === 'invalid' ? read.reason : 'L’historique courant est indisponible.');
    }
    if (read.value.protocol !== HOP_ADVICE_PROTOCOL_V1.name || !Number.isSafeInteger(read.value.generation) || read.value.generation < 0) {
      throw new Error('La réponse d’historique ne contient pas de génération courante valide.');
    }
    return read.value.generation;
  };
  const unsupportedSnapshot = (send: HopV55SemanticJobSendInputV3, reason: string, snapshot: unknown): HopV55SemanticJobSnapshotV3 => {
    rememberUnsupported({ operationId: send.operationId, snapshot, reason });
    return failureSnapshot(send, reason, 'unsupportedReadOnly', snapshot);
  };
  const lookupJob = async (expected: { operationId: string; generation: number; question: string; scope: HopAdviceV1Scope }): Promise<V3JobLookup> => {
    const read = await api.activity();
    if (read.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    if (read.status === 'invalid') return { status: 'invalid', reason: read.reason };
    const matches: HopAdviceV1PublicJob[] = [];
    for (const row of read.value.jobs) {
      if (row.status === 'unsupportedReadOnly') {
        const raw = row.snapshot as Record<string, unknown> | null;
        if (raw && typeof raw === 'object' && raw.operationId === expected.operationId) {
          return { status: 'unsupportedReadOnly', snapshot: row.snapshot, reason: row.reason };
        }
      } else if (row.status === 'available' && semanticJobMatches(row.value, expected)) matches.push(row.value);
    }
    if (matches.length > 1) return { status: 'invalid', reason: 'Plusieurs jobs publics portent le même operationId Request3.' };
    return matches.length ? { status: 'found', job: matches[0] } : { status: 'none' };
  };
  const snapshotFromTurn = async (send: HopV55SemanticJobSendInputV3, turn: HopAdviceV1PublicTurn): Promise<HopV55SemanticJobSnapshotV3> => {
    if (turn.operationId !== send.operationId || turn.question !== send.wire.question
      || turn.protocol !== HOP_ADVICE_PROTOCOL_V1.name) {
      return failureSnapshot(send, 'Le tour public diffère de la question ou opération Request3.', 'failed', turn);
    }
    const guard = await send.authorizeBeforeEachEmission();
    if (guard.status !== 'authorized' || guard.operationId !== send.operationId || guard.generation !== send.generation
      || guard.ticketReference !== send.ticketReference || guard.wireReference !== send.wireReference || !sameJson(guard.wire, send.wire)) {
      return failureSnapshot(send, guard.status === 'authorized' ? 'Le garde de relecture cite une autre fermeture Request3.' : guard.reason,
        guard.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed', turn);
    }
    const found = await lookupJob({ operationId: send.operationId, generation: send.generation,
      question: send.wire.question, scope: send.wire.scope });
    if (found.status === 'unsupportedReadOnly') return unsupportedSnapshot(send, found.reason, found.snapshot);
    if (found.status === 'invalid') return failureSnapshot(send, found.reason, 'failed', turn);
    if (found.status !== 'found') return unsupportedSnapshot(send,
      'Le retour public contient un tour sans job public correspondant; aucun job/id n’est fabriqué.', turn);
    if (found.job.status !== 'done' || found.job.id !== turn.id) {
      return failureSnapshot(send, 'Le job public et le tour ne forment pas une réponse terminée exacte.', 'failed', turn);
    }
    return { ...semanticSnapshotBase(send), status: 'received', job: found.job, turn };
  };
  const statusSnapshot = async (inputValue: HopV55SemanticJobReadInputV3): Promise<HopV55SemanticJobSnapshotV3 | null> => {
    const expectedScope = scope as HopAdviceV1Scope;
    const read = await api.status({ scope: expectedScope, operationId: inputValue.operationId, generation: inputValue.generation });
    if (read.status === 'unsupportedReadOnly') return {
      ...semanticSnapshotBase(inputValue), status: 'unsupportedReadOnly', reason: read.reason, turn: read.snapshot,
    };
    if (read.status === 'invalid') return { ...semanticSnapshotBase(inputValue), status: 'failed', reason: read.reason };
    if ('turn' in read.value) {
      const turn = read.value.turn;
      if (turn.operationId !== inputValue.operationId || turn.question !== inputValue.question) {
        return { ...semanticSnapshotBase(inputValue), status: 'failed', reason: 'Tour status différent du ticket Request3.', turn };
      }
      const found = await lookupJob({ operationId: inputValue.operationId, generation: inputValue.generation,
        question: inputValue.question, scope: expectedScope });
      if (found.status === 'unsupportedReadOnly') return { ...semanticSnapshotBase(inputValue), status: 'unsupportedReadOnly',
        reason: found.reason, turn: found.snapshot };
      if (found.status === 'invalid') return { ...semanticSnapshotBase(inputValue), status: 'failed', reason: found.reason, turn };
      if (found.status !== 'found') return { ...semanticSnapshotBase(inputValue), status: 'unsupportedReadOnly',
        reason: 'Tour public présent sans job public correspondant; aucun identifiant de job n’est fabriqué.', turn };
      if (found.job.status !== 'done' || found.job.id !== turn.id) return { ...semanticSnapshotBase(inputValue), status: 'failed',
        reason: 'Le job public et le tour ne forment pas une réponse terminée exacte.', job: found.job, turn };
      return { ...semanticSnapshotBase(inputValue), status: 'received', job: found.job, turn };
    }
    if ('job' in read.value) {
      const job = read.value.job;
      if (!semanticJobMatches(job, { operationId: inputValue.operationId, generation: inputValue.generation,
        question: inputValue.question, scope: expectedScope })) {
        return { ...semanticSnapshotBase(inputValue), status: 'failed', reason: 'Job status différent du ticket Request3.' };
      }
      return { ...semanticSnapshotBase(inputValue), status: job.status === 'error' || job.status === 'cancelled' ? 'failed' : 'pending',
        job, ...(job.status === 'error' || job.status === 'cancelled' ? { reason: semanticJobError(job) ?? 'Le job public est en échec.' } : {}) };
    }
    if ('pending' in read.value) {
      const found = await lookupJob({ operationId: inputValue.operationId, generation: inputValue.generation,
        question: inputValue.question, scope: expectedScope });
      if (found.status === 'found') return { ...semanticSnapshotBase(inputValue), status: 'pending', job: found.job };
      if (found.status === 'unsupportedReadOnly') return { ...semanticSnapshotBase(inputValue), status: 'unsupportedReadOnly',
        reason: found.reason, turn: found.snapshot };
      if (found.status === 'invalid') return { ...semanticSnapshotBase(inputValue), status: 'failed', reason: found.reason };
      return { ...semanticSnapshotBase(inputValue), status: 'pending' };
    }
    return null;
  };
  const transport: HopV55SemanticJobStoreTransportV3 = {
    async submit(send) {
      const checked = await send.authorizeBeforeEachEmission();
      if (checked.status !== 'authorized' || checked.operationId !== send.operationId
        || checked.generation !== send.generation || checked.ticketReference !== send.ticketReference
        || checked.wireReference !== send.wireReference || !sameJson(checked.wire, send.wire)) {
        return failureSnapshot(send, checked.status === 'authorized' ? 'Le dernier garde a lu une autre fermeture Request3.' : checked.reason,
          checked.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed');
      }
      let currentGeneration: number;
      try { currentGeneration = await readCurrentGeneration(scope); }
      catch (error) { return failureSnapshot(send, error instanceof Error ? error.message : 'Génération serveur indisponible.'); }
      if (currentGeneration !== send.generation) {
        return failureSnapshot(send, `La conversation serveur est à la génération ${currentGeneration}; le ticket Request3 cite ${send.generation}. Ouvre une nouvelle lecture.`);
      }
      const finalAuthorization = await send.authorizeBeforeEachEmission();
      if (finalAuthorization.status !== 'authorized' || finalAuthorization.operationId !== send.operationId
        || finalAuthorization.generation !== send.generation || finalAuthorization.ticketReference !== send.ticketReference
        || finalAuthorization.wireReference !== send.wireReference || !sameJson(finalAuthorization.wire, send.wire)) {
        return failureSnapshot(send, finalAuthorization.status === 'authorized' ? 'Le garde final cite une autre fermeture Request3.' : finalAuthorization.reason,
          finalAuthorization.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed');
      }
      const read = await api.askWireV3(finalAuthorization.wire);
      if (read.status === 'unsupportedReadOnly') return unsupportedSnapshot(send, read.reason, read.snapshot);
      if (read.status === 'invalid') return failureSnapshot(send, read.reason);
      if ('turn' in read.value) return snapshotFromTurn(send, read.value.turn);
      const job = read.value.job;
      if (!semanticJobMatches(job, { operationId: send.operationId, generation: send.generation,
        question: send.wire.question, scope: send.wire.scope })) return failureSnapshot(send, 'Job de submit différent du wire Request3.');
      if (job.status === 'done') {
        const gate = await send.authorizeBeforeEachEmission();
        if (gate.status !== 'authorized' || gate.operationId !== send.operationId || gate.generation !== send.generation
          || gate.ticketReference !== send.ticketReference || gate.wireReference !== send.wireReference || !sameJson(gate.wire, send.wire)) {
          return failureSnapshot(send, gate.status === 'authorized' ? 'Le garde de reprise cite une autre fermeture Request3.' : gate.reason,
            gate.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed');
        }
        const current = await statusSnapshot({ ownerKey, workspaceId, operationId: send.operationId, generation: send.generation,
          question: send.wire.question, ticketReference: send.ticketReference, wireReference: send.wireReference });
        return current ?? { ...semanticSnapshotBase(send), status: 'pending', job };
      }
      return { ...semanticSnapshotBase(send), status: job.status === 'error' || job.status === 'cancelled' ? 'failed' : 'pending',
        job, ...(job.status === 'error' || job.status === 'cancelled' ? { reason: semanticJobError(job) ?? 'Le job public a échoué.' } : {}) };
    },
    async retry(send) {
      const before = await statusSnapshot({ ownerKey, workspaceId, operationId: send.operationId, generation: send.generation,
        question: send.wire.question, ticketReference: send.ticketReference, wireReference: send.wireReference });
      const job = before?.job;
      if (!job || before?.status === 'unsupportedReadOnly' || before?.status === 'received'
        || job.status !== 'error') {
        return before ?? failureSnapshot(send, 'Job public absent; retry refusé sans le job exact.');
      }
      const finalAuthorization = await send.authorizeBeforeEachEmission();
      if (finalAuthorization.status !== 'authorized' || finalAuthorization.operationId !== send.operationId
        || finalAuthorization.generation !== send.generation || finalAuthorization.ticketReference !== send.ticketReference
        || finalAuthorization.wireReference !== send.wireReference || !sameJson(finalAuthorization.wire, send.wire)) {
        return failureSnapshot(send, finalAuthorization.status === 'authorized' ? 'Le garde final du retry cite une autre fermeture Request3.' : finalAuthorization.reason,
          finalAuthorization.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed');
      }
      let currentGeneration: number;
      try { currentGeneration = await readCurrentGeneration(scope); }
      catch (error) { return failureSnapshot(send, error instanceof Error ? error.message : 'Génération serveur indisponible.'); }
      if (currentGeneration !== send.generation) {
        return failureSnapshot(send, `La conversation serveur est à la génération ${currentGeneration}; le retry conserve ${send.generation}.`);
      }
      const finalGenerationAuthorization = await send.authorizeBeforeEachEmission();
      if (finalGenerationAuthorization.status !== 'authorized' || finalGenerationAuthorization.operationId !== send.operationId
        || finalGenerationAuthorization.generation !== send.generation || finalGenerationAuthorization.ticketReference !== send.ticketReference
        || finalGenerationAuthorization.wireReference !== send.wireReference || !sameJson(finalGenerationAuthorization.wire, send.wire)) {
        return failureSnapshot(send, finalGenerationAuthorization.status === 'authorized'
          ? 'Le garde final du retry cite une autre fermeture Request3.' : finalGenerationAuthorization.reason,
          finalGenerationAuthorization.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed');
      }
      const retry = await api.retry({ jobId: job.id, operationId: send.operationId, generation: send.generation }, scope as HopAdviceV1Scope);
      if (retry.status === 'unsupportedReadOnly') return unsupportedSnapshot(send, retry.reason, retry.snapshot);
      if (retry.status === 'invalid') return failureSnapshot(send, retry.reason);
      if ('turn' in retry.value) return snapshotFromTurn(send, retry.value.turn);
      const retryJob = retry.value.job;
      if (!semanticJobMatches(retryJob, { operationId: send.operationId, generation: send.generation,
        question: send.wire.question, scope: send.wire.scope })) return failureSnapshot(send, 'Job de retry différent du wire Request3.');
      return { ...semanticSnapshotBase(send), status: retryJob.status === 'error' || retryJob.status === 'cancelled' ? 'failed' : 'pending',
        job: retryJob, ...(retryJob.status === 'error' || retryJob.status === 'cancelled' ? { reason: semanticJobError(retryJob) ?? 'Le retry public a échoué.' } : {}) };
    },
    read: statusSnapshot,
  };
  const runtime = createBrewerHopAdviceSemanticRuntimeV3({ ownerKey, workspaceId, scope, providerKind, transport,
    readGeneration: readCurrentGeneration });
  return { ...runtime, unsupportedReadOnly: () => [...unsupported.values()].map(clone) };
}

/** Use only after a host explicitly declares a Request3 provider capability. */
export function createBrewerHopAdviceApiRuntimeFactoryV3(apiForOwner: (ownerKey: string) => BrewerHopAdviceApiV3 =
  ownerKey => createBrewerHopAdviceApiV3({ ownerKey })):
  (input: Omit<Parameters<typeof createBrewerHopAdviceApiRuntimeV3>[0], 'api'>) => BrewerHopAdviceApiRuntimeV3 {
  return input => createBrewerHopAdviceApiRuntimeV3({ ...input, api: apiForOwner(input.ownerKey) });
}

export type BrewerHopAdviceApiRuntimeWizardV1 = BrewerHopAdviceSemanticRuntimeWizardV1 & {
  unsupportedReadOnly(): ReadonlyArray<{ operationId?: string; snapshot: unknown; reason: string }>;
};

/** Request3 Wizard lane on the existing hopAdviceReadonlyV1 callable; no Request2 or classic V3 fallback. */
export function createBrewerHopAdviceApiRuntimeWizardV1(input: {
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  providerKind: 'fixture' | 'authorizedRequest3';
  api: BrewerHopAdviceApiForWizardV1;
  readGeneration(scope: BrewerScope): Promise<number>;
}): BrewerHopAdviceApiRuntimeWizardV1 {
  const { ownerKey, workspaceId, scope, providerKind, api } = input;
  if (!api || api.ownerKey !== ownerKey || api.protocol !== 'hopAdviceWizardRequest3V1' || scope.kind !== 'draft') {
    throw new Error('Le runtime exige le client Wizard Request3 explicite, le même owner et un scope draft.');
  }
  const namespace = hopAdviceWizardClientPartitionKey(ownerKey, workspaceId, scope);
  const unsupported = new Map<string, { operationId?: string; snapshot: unknown; reason: string }>();
  const rememberUnsupported = (row: { operationId?: string; snapshot: unknown; reason: string }) => {
    let key: string;
    try { key = JSON.stringify([row.operationId ?? '', hopAdviceContentReference('hop-v55-wizard-runtime-unsupported-v1', row.snapshot)]); }
    catch { key = `${row.operationId ?? ''}:${unsupported.size}`; }
    unsupported.set(key, structuredClone(row));
  };
  const base = (send: Pick<HopV55SemanticWizardJobSendInputV1,
    'operationId' | 'generation' | 'ticketReference' | 'wireReference'>): Omit<HopV55SemanticWizardJobSnapshotV1, 'status'> => ({
      format: 'hop-v55-semantic-job-snapshot-wizard-v1', operationId: send.operationId, generation: send.generation,
      ticketReference: send.ticketReference, wireReference: send.wireReference,
    });
  const failure = (send: Pick<HopV55SemanticWizardJobSendInputV1,
    'operationId' | 'generation' | 'ticketReference' | 'wireReference'>, reason: string,
    status: HopV55SemanticWizardJobSnapshotV1['status'] = 'failed', extra: { job?: HopAdviceV1PublicJob; turn?: unknown } = {}): HopV55SemanticWizardJobSnapshotV1 => ({
      ...base(send), status, reason, ...extra,
    });
  const readGeneration = async () => {
    const generation = await input.readGeneration(structuredClone(scope));
    if (!Number.isSafeInteger(generation) || generation < 0) throw new Error('La génération Wizard renvoyée par le serveur est invalide.');
    return generation;
  };
  const currentAuthorization = async (send: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSnapshotV1 | null> => {
    let generation: number;
    try { generation = await readGeneration(); }
    catch (error) { return failure(send, error instanceof Error ? error.message : 'Génération Wizard indisponible.'); }
    if (generation !== send.generation) return failure(send,
      `La génération courante est ${generation}; le ticket Wizard cite ${send.generation}.`);
    const gate = await send.authorizeBeforeEachEmission();
    if (gate.status !== 'authorized') {
      const snapshot = failure(send, gate.reason, gate.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed');
      if (gate.status === 'unsupportedReadOnly' && gate.snapshot !== undefined) rememberUnsupported({ operationId: send.operationId,
        snapshot: gate.snapshot, reason: gate.reason });
      return snapshot;
    }
    let exact: boolean;
    try { exact = hopAdviceContentReference('hop-v55-wizard-runtime-wire-equality-v1', gate.wire)
      === hopAdviceContentReference('hop-v55-wizard-runtime-wire-equality-v1', send.wire); }
    catch { exact = false; }
    if (gate.operationId !== send.operationId || gate.generation !== send.generation
      || gate.ticketReference !== send.ticketReference || gate.wireReference !== send.wireReference || !exact) {
      return failure(send, 'Le garde live ne confirme pas le scope, operationId, génération et wire Wizard exacts.');
    }
    return null;
  };

  const lookupJob = async (expected: { operationId: string; generation: number; question: string }): Promise<V3JobLookup> => {
    const read = await api.activity();
    if (read.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    if (read.status === 'invalid') return { status: 'invalid', reason: read.reason };
    const matches: HopAdviceV1PublicJob[] = [];
    for (const row of read.value.jobs) {
      if (row.status === 'unsupportedReadOnly') {
        const raw = row.snapshot as Record<string, unknown> | null;
        if (raw && typeof raw === 'object' && raw.operationId === expected.operationId) {
          return { status: 'unsupportedReadOnly', snapshot: row.snapshot, reason: row.reason };
        }
      } else if (row.status === 'available' && semanticJobMatches(row.value, { ...expected, scope })) matches.push(row.value);
    }
    if (matches.length > 1) return { status: 'invalid', reason: 'Plusieurs jobs publics portent le même operationId Wizard.' };
    return matches.length ? { status: 'found', job: matches[0] } : { status: 'none' };
  };

  const turnFromHistory = async (send: Pick<HopV55SemanticWizardJobSendInputV1,
    'operationId' | 'generation' | 'ticketReference' | 'wireReference'>, question: string): Promise<
      { status: 'found'; turn: HopAdviceV1PublicTurn } | { status: 'none' } | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } | { status: 'invalid'; reason: string }> => {
    const read = await api.history({ scope });
    if (read.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: read.snapshot, reason: read.reason };
    if (read.status === 'invalid') return { status: 'invalid', reason: read.reason };
    const matches: HopAdviceV1PublicTurn[] = [];
    for (const row of read.value.turns) {
      if (row.status === 'unsupportedReadOnly') {
        const raw = row.snapshot as Record<string, unknown> | null;
        if (raw && typeof raw === 'object' && raw.operationId === send.operationId) {
          return { status: 'unsupportedReadOnly', snapshot: row.snapshot, reason: row.reason };
        }
      } else if (row.status === 'available' && row.value.operationId === send.operationId && row.value.question === question) {
        matches.push(row.value);
      }
    }
    if (matches.length > 1) return { status: 'invalid', reason: 'Plusieurs tours publics correspondent à l’opération Wizard.' };
    return matches.length ? { status: 'found', turn: matches[0] } : { status: 'none' };
  };

  const snapshotFromTurn = async (send: HopV55SemanticWizardJobSendInputV1, turnValue: unknown): Promise<HopV55SemanticWizardJobSnapshotV1> => {
    const turn = readHopAdviceV1PublicTurn(turnValue);
    if (turn.status === 'unsupportedReadOnly') {
      rememberUnsupported({ operationId: send.operationId, snapshot: turn.snapshot, reason: turn.reason });
      return failure(send, turn.reason, 'unsupportedReadOnly', { turn: clone(turn.snapshot) });
    }
    if (turn.status !== 'available') return failure(send, turn.reason, 'failed', { turn: clone(turnValue) });
    if (turn.value.operationId !== send.operationId || turn.value.question !== send.wire.question
      || turn.value.protocol !== HOP_ADVICE_PROTOCOL_V1.name) {
      return failure(send, 'Le tour public diffère de la question ou operationId Wizard.', 'failed', { turn: clone(turn.value) });
    }
    const found = await lookupJob({ operationId: send.operationId, generation: send.generation, question: send.wire.question });
    if (found.status === 'unsupportedReadOnly') {
      rememberUnsupported({ operationId: send.operationId, snapshot: found.snapshot, reason: found.reason });
      return failure(send, found.reason, 'unsupportedReadOnly', { turn: clone(turn.value) });
    }
    if (found.status === 'invalid') return failure(send, found.reason, 'failed', { turn: clone(turn.value) });
    if (found.status !== 'found') {
      const reason = 'Tour Wizard sans job public exact; aucun identifiant de job n’est fabriqué.';
      rememberUnsupported({ operationId: send.operationId, snapshot: turn.value, reason });
      return failure(send, reason, 'unsupportedReadOnly', { turn: clone(turn.value) });
    }
    if (found.job.status !== 'done' || found.job.id !== turn.value.id) return failure(send,
      'Le job public et le tour Wizard ne forment pas une réponse terminée exacte.', 'failed', { job: found.job, turn: clone(turn.value) });
    return { ...base(send), status: 'received', job: found.job, turn: clone(turn.value) };
  };

  const statusSnapshot = async (send: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSnapshotV1 | null> => {
    const read = await api.status({ scope, operationId: send.operationId, generation: send.generation });
    if (read.status === 'unsupportedReadOnly') return failure(send, read.reason, 'unsupportedReadOnly', { turn: clone(read.snapshot) });
    if (read.status === 'invalid') return failure(send, read.reason);
    if ('turn' in read.value) return snapshotFromTurn(send, read.value.turn);
    if ('job' in read.value) {
      const job = read.value.job;
      if (!semanticJobMatches(job, { operationId: send.operationId, generation: send.generation,
        question: send.wire.question, scope })) return failure(send, 'Job status différent du ticket Wizard.');
      if (job.status === 'done') {
        const turn = await turnFromHistory(send, send.wire.question);
        if (turn.status === 'found') return snapshotFromTurn(send, turn.turn);
        if (turn.status === 'unsupportedReadOnly') {
          rememberUnsupported({ operationId: send.operationId, snapshot: turn.snapshot, reason: turn.reason });
          return failure(send, turn.reason, 'unsupportedReadOnly', { job, turn: clone(turn.snapshot) });
        }
        if (turn.status === 'invalid') return failure(send, turn.reason, 'failed', { job });
        return failure(send, 'Job marqué terminé sans tour public exact dans l’historique; aucun tour n’est inventé.', 'unsupportedReadOnly', { job });
      }
      return { ...base(send), status: job.status === 'error' || job.status === 'cancelled' ? 'failed' : 'pending',
        job, ...(job.status === 'error' || job.status === 'cancelled' ? { reason: semanticJobError(job) ?? 'Job Wizard en échec.' } : {}) };
    }
    if ('pending' in read.value) {
      const found = await lookupJob({ operationId: send.operationId, generation: send.generation, question: send.wire.question });
      if (found.status === 'found') return { ...base(send), status: 'pending', job: found.job };
      if (found.status === 'unsupportedReadOnly') return failure(send, found.reason, 'unsupportedReadOnly', { turn: clone(found.snapshot) });
      if (found.status === 'invalid') return failure(send, found.reason);
      return { ...base(send), status: 'pending' };
    }
    return null;
  };

  const transport: HopV55SemanticWizardJobStoreTransportV1 = {
    async submit(send) {
      const before = await currentAuthorization(send);
      if (before) return before;
      const read = await api.askWireForWizardV1(send.wire);
      if (read.status === 'unsupportedReadOnly') {
        rememberUnsupported({ operationId: send.operationId, snapshot: read.snapshot, reason: read.reason });
        return failure(send, read.reason, 'unsupportedReadOnly', { turn: clone(read.snapshot) });
      }
      if (read.status === 'invalid') return failure(send, read.reason);
      if ('turn' in read.value) return snapshotFromTurn(send, read.value.turn);
      const job = read.value.job;
      if (!semanticJobMatches(job, { operationId: send.operationId, generation: send.generation,
        question: send.wire.question, scope })) return failure(send, 'Job de submit différent du wire Wizard.');
      if (job.status === 'done') return (await statusSnapshot(send)) ?? { ...base(send), status: 'pending', job };
      return { ...base(send), status: job.status === 'error' || job.status === 'cancelled' ? 'failed' : 'pending',
        job, ...(job.status === 'error' || job.status === 'cancelled' ? { reason: semanticJobError(job) ?? 'Job Wizard en échec.' } : {}) };
    },
    async retry(send) {
      const before = await statusSnapshot(send);
      const job = before?.job;
      if (!job || before?.status === 'unsupportedReadOnly' || before?.status === 'received' || job.status !== 'error') {
        return before ?? failure(send, 'Job public absent; retry Wizard refusé sans closure exacte.');
      }
      const finalGuard = await currentAuthorization(send);
      if (finalGuard) return finalGuard;
      const retry = await api.retry({ jobId: job.id, operationId: send.operationId, generation: send.generation }, scope);
      if (retry.status === 'unsupportedReadOnly') {
        rememberUnsupported({ operationId: send.operationId, snapshot: retry.snapshot, reason: retry.reason });
        return failure(send, retry.reason, 'unsupportedReadOnly', { turn: clone(retry.snapshot) });
      }
      if (retry.status === 'invalid') return failure(send, retry.reason);
      if ('turn' in retry.value) return snapshotFromTurn(send, retry.value.turn);
      const retryJob = retry.value.job;
      if (!semanticJobMatches(retryJob, { operationId: send.operationId, generation: send.generation,
        question: send.wire.question, scope })) return failure(send, 'Job de retry différent du wire Wizard.');
      if (retryJob.status === 'done') return (await statusSnapshot(send)) ?? { ...base(send), status: 'pending', job: retryJob };
      return { ...base(send), status: retryJob.status === 'error' || retryJob.status === 'cancelled' ? 'failed' : 'pending',
        job: retryJob, ...(retryJob.status === 'error' || retryJob.status === 'cancelled' ? { reason: semanticJobError(retryJob) ?? 'Retry Wizard en échec.' } : {}) };
    },
    async read(readInput) {
      return statusSnapshot({ operationId: readInput.operationId, generation: readInput.generation,
        ticketReference: readInput.ticketReference, wireReference: readInput.wireReference, wire: readInput.wire,
        authorizeBeforeEachEmission: readInput.authorizeBeforeRead });
    },
  };
  const runtime = createBrewerHopAdviceSemanticRuntimeWizardV1({ ownerKey, workspaceId, scope, providerKind,
    transport, readGeneration: input.readGeneration });
  return { ...runtime, unsupportedReadOnly: () => [...unsupported.values()].map(clone) };
}
