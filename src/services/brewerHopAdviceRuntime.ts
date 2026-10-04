import {
  HOP_ADVICE_PROTOCOL_V1,
  buildHopAdviceV1Wire,
  hopAdviceV1ClientPartitionKey,
  type HopAdviceV1ClientEntry,
  type HopAdviceV1Scope,
  type HopAdviceV1WireInput,
} from '../../functions/src/brewerHopAdviceTransportV1';
import type { BrewerChatInput, BrewerJob, BrewerReply, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
import { createBrewerJobStore, type BrewerJobStatusInput, type BrewerJobStoreTransport } from './brewerJobs';

export type BrewerHopAdviceHistoryV1 = BrewerTurn[] & { generation?: number; draft?: unknown;
  unsupportedReadOnly?: Array<{ source: string; snapshot: unknown; reason: string; operationId?: string; input?: BrewerChatInput }> };

/** Callable adapters are injected; this module creates no Firebase callable and assumes no DTO for them. */
export interface BrewerHopAdviceV1RuntimeTransport {
  submit(input: HopAdviceV1WireInput): Promise<BrewerReply>;
  retry(jobId: string, operationId: string): Promise<BrewerReply>;
  activity(): Promise<BrewerJob[]>;
  status(input: BrewerJobStatusInput): Promise<BrewerReply>;
  markRead(jobId: string): Promise<void>;
  userKey(): Promise<string>;
  history(scope: BrewerScope, before?: number): Promise<BrewerHopAdviceHistoryV1>;
  reset(scope: BrewerScope, generation: number, operationId: string): Promise<{ generation: number }>;
}

export interface BrewerHopAdviceRuntimeV1 {
  mode: typeof HOP_ADVICE_PROTOCOL_V1.name;
  storeNamespace: string;
  jobs: ReturnType<typeof createBrewerJobStore>;
  history(scope: BrewerScope, before?: number): Promise<BrewerHopAdviceHistoryV1>;
  reset(scope: BrewerScope, generation: number, operationId: string): Promise<{ generation: number }>;
  dispose(): void;
}

export interface BrewerHopAdviceRuntimeScopeInput {
  ownerKey: string;
  scope: BrewerScope;
}

type StoreOwnerInput = BrewerChatInput & { mode: NonNullable<BrewerChatInput['mode']> };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function assertScope(value: unknown): asserts value is HopAdviceV1Scope {
  if (!isRecord(value) || !['recipe', 'batch', 'draft', 'app'].includes(String(value.kind))
    || typeof value.id !== 'string' || !value.id.trim() || value.id.trim() !== value.id
    || Object.keys(value).some((key) => key !== 'kind' && key !== 'id')) {
    throw new Error('Scope hopAdviceReadonlyV1 invalide.');
  }
}

function belongsToPartition(ownerKey: string, storeNamespace: string, scope: unknown): scope is HopAdviceV1Scope {
  try {
    assertScope(scope);
    return hopAdviceV1ClientPartitionKey(ownerKey, scope) === storeNamespace;
  } catch {
    return false;
  }
}

function exactScope(left: BrewerScope, right: HopAdviceV1Scope): boolean {
  return left.kind === right.kind && left.id === right.id;
}

function assertStoreInput(input: BrewerChatInput, ownerKey: string, storeNamespace: string): asserts input is StoreOwnerInput {
  if (!isRecord(input) || !belongsToPartition(ownerKey, storeNamespace, input.scope)
    || typeof input.operationId !== 'string' || !input.operationId.trim()
    || typeof input.question !== 'string' || !isRecord(input.hopAdvice)
    || !['fast', 'auto', 'deep'].includes(String(input.mode))
    || input.hopAdvice.question !== input.question) {
    throw new Error('La requête doit porter explicitement un mode et une lecture hopAdviceReadonlyV1 exacte.');
  }
  const requestScope = input.hopAdvice.contextLaunch?.scope;
  if (!isRecord(requestScope) || requestScope.kind !== input.scope.kind || requestScope.id !== input.scope.id) {
    throw new Error('La portée du handoff doit rester exactement celle de la requête.');
  }
  if (input.scope.kind === 'draft') {
    if (input.draft === undefined || input.localJournal !== undefined) {
      throw new Error('Un scope draft transmet son draft exact et aucun localJournal.');
    }
  } else if (input.scope.kind === 'batch') {
    if (input.draft !== undefined) throw new Error('Un scope batch ne transmet pas de draft recipe.');
  } else if (input.draft !== undefined || input.localJournal !== undefined) {
    throw new Error('Un scope recipe/app ne transmet pas de draft ou localJournal.');
  }
}

function toV1ClientEntry(input: StoreOwnerInput): HopAdviceV1ClientEntry {
  const common = {
    operationId: input.operationId,
    question: input.question,
    ...(input.generation === undefined ? {} : { generation: input.generation }),
    ...(input.phase === undefined ? {} : { phase: input.phase }),
    hopAdvice: input.hopAdvice!,
    analysisMode: input.mode!,
  };
  switch (input.scope.kind) {
    case 'draft': return { ...common, scope: { kind: 'draft', id: input.scope.id }, draft: input.draft };
    case 'batch': return { ...common, scope: { kind: 'batch', id: input.scope.id },
      ...(input.localJournal === undefined ? {} : { localJournal: input.localJournal }) };
    case 'recipe': return { ...common, scope: { kind: 'recipe', id: input.scope.id } };
    case 'app': return { ...common, scope: { kind: 'app', id: input.scope.id } };
  }
}

function assertTransport(value: unknown): asserts value is BrewerHopAdviceV1RuntimeTransport {
  if (!isRecord(value) || !['submit', 'retry', 'activity', 'status', 'markRead', 'userKey', 'history', 'reset']
    .every((key) => typeof value[key] === 'function')) {
    throw new Error('Le runtime exige tous les transports v1 et les callbacks history/reset injectés.');
  }
}

/** One owner+partition runtime. The canonical helper, not a local recreation, owns its storage key. */
export function createBrewerHopAdviceRuntime(input: BrewerHopAdviceRuntimeScopeInput & {
  transport: BrewerHopAdviceV1RuntimeTransport;
}): BrewerHopAdviceRuntimeV1 {
  if (!input || typeof input.ownerKey !== 'string' || !input.ownerKey.trim() || input.ownerKey.trim() !== input.ownerKey) {
    throw new Error('ownerKey courant normalisé requis pour le runtime assisté.');
  }
  assertScope(input.scope);
  assertTransport(input.transport);
  const { ownerKey, transport } = input;
  const scope = input.scope;
  const storeNamespace = hopAdviceV1ClientPartitionKey(ownerKey, scope);

  function assertCurrentPartition(value: unknown): asserts value is HopAdviceV1Scope {
    if (!belongsToPartition(ownerKey, storeNamespace, value)) {
      throw new Error('La portée n’appartient pas à la partition hopAdviceReadonlyV1 capturée.');
    }
  }
  const jobTransport: BrewerJobStoreTransport = {
    async submit(rawInput) {
      assertStoreInput(rawInput, ownerKey, storeNamespace);
      return transport.submit(buildHopAdviceV1Wire(toV1ClientEntry(rawInput)));
    },
    retry: (jobId, operationId) => transport.retry(jobId, operationId),
    async activity() {
      const jobs = await transport.activity();
      return jobs.filter((job) => belongsToPartition(ownerKey, storeNamespace, job.scope));
    },
    status(input) {
      assertCurrentPartition(input.scope);
      return transport.status(input);
    },
    markRead: (jobId) => transport.markRead(jobId),
    async userKey() {
      const userKey = await transport.userKey();
      if (userKey !== ownerKey) throw new Error('Le userKey du transport diffère de l’ownerKey capturé.');
      return userKey;
    },
  };
  const jobs = createBrewerJobStore({
    transport: jobTransport,
    storageKeyForUser(userKey) {
      if (userKey !== ownerKey) throw new Error('La clé de stockage assistée refuse un autre ownerKey.');
      return storeNamespace;
    },
    scopeIdentity(jobScope) {
      assertCurrentPartition(jobScope);
      return hopAdviceV1ClientPartitionKey(ownerKey, jobScope);
    },
    sameScope(left, right) {
      const leftKey = belongsToPartition(ownerKey, storeNamespace, left)
        ? hopAdviceV1ClientPartitionKey(ownerKey, left) : undefined;
      const rightKey = belongsToPartition(ownerKey, storeNamespace, right)
        ? hopAdviceV1ClientPartitionKey(ownerKey, right) : undefined;
      return leftKey !== undefined && leftKey === rightKey;
    },
    retainInputUntilRead: true,
  });

  return {
    mode: HOP_ADVICE_PROTOCOL_V1.name,
    storeNamespace,
    jobs,
    history(requestedScope, before) {
      assertCurrentPartition(requestedScope);
      return transport.history(requestedScope, before);
    },
    reset(requestedScope, generation, operationId) {
      assertCurrentPartition(requestedScope);
      return transport.reset(requestedScope, generation, operationId);
    },
    dispose() { jobs.stop(); },
  };
}

/** Host-compatible owner/scope callback; actual network adapters remain caller-owned. */
export function createBrewerHopAdviceRuntimeFactory(transport: BrewerHopAdviceV1RuntimeTransport):
  (input: BrewerHopAdviceRuntimeScopeInput) => BrewerHopAdviceRuntimeV1 {
  assertTransport(transport);
  return (input) => createBrewerHopAdviceRuntime({ ...input, transport });
}
