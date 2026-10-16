import {
  HOP_ADVICE_PROTOCOL_V1,
  buildHopAdviceV1Wire,
  hopAdviceV1ClientPartitionKey,
  type HopAdviceV1ClientEntry,
  type HopAdviceV1Scope,
  type HopAdviceV1WireInput,
  type HopAdviceV1WizardWireInputV1,
} from '../../functions/src/brewerHopAdviceTransportV1';
import type { BrewerChatInput, BrewerJob, BrewerReply, BrewerScope, BrewerTurn } from '../../functions/src/companionTypes';
import { createBrewerJobStore, createHopV55SemanticJobStoreV3, type BrewerJobStatusInput, type BrewerJobStoreTransport,
  type HopV55SemanticJobSendInputV3, type HopV55SemanticJobStoreClientV3, type HopV55SemanticJobStoreOptionsV3,
  type HopV55SemanticJobStoreTransportV3 } from './brewerJobs';
import { createHopV55SemanticWizardJobStoreV1, type HopV55SemanticWizardJobStoreClientV1,
  type HopV55SemanticWizardJobStoreTransportV1, type HopV55SemanticWizardJobSendInputV1 } from './brewerJobs';
import type { HopV55SemanticWizardJobStoreV1, HopV55SemanticWizardJobSnapshotV1,
  HopV55SemanticWizardWireAuthorizationResultV1 } from './hopV55/semanticAdoptionApplicationHost';
import { hopAdviceContentReference } from '../domain/hopDecision/adviceContentReference';

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

export type BrewerHopAdviceSemanticRuntimeV3 = {
  format: 'hop-v55-semantic-companion-runtime-v3';
  protocol: 'hopAdviceRequest3';
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  storeNamespace: string;
  providerKind: HopV55SemanticJobStoreOptionsV3['providerKind'];
  jobs: HopV55SemanticJobStoreClientV3;
  /** Read only the server generation for this exact scope; history turns stay inside the adapter. */
  readGeneration(scope: BrewerScope): Promise<number>;
  dispose(): void;
};

export interface BrewerHopAdviceSemanticRuntimeInputV3 {
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  providerKind: HopV55SemanticJobStoreOptionsV3['providerKind'];
  transport: HopV55SemanticJobStoreTransportV3;
  readGeneration(scope: BrewerScope): Promise<number>;
}

/** Request3 has a separate local namespace: draft never aliases a saved recipe or Request2 row. */
export function hopAdviceSemanticV3ClientPartitionKey(ownerKey: string, workspaceId: string, scope: BrewerScope): string {
  if (!isRecord(scope) || !['recipe', 'batch', 'draft', 'app'].includes(String(scope.kind))
    || typeof scope.id !== 'string' || !scope.id.trim() || scope.id.trim() !== scope.id
    || Object.keys(scope).length !== 2) throw new Error('Scope Request3 normalisé et exact requis.');
  if (typeof ownerKey !== 'string' || !ownerKey.trim() || ownerKey.trim() !== ownerKey
    || typeof workspaceId !== 'string' || !workspaceId.trim() || workspaceId.trim() !== workspaceId) {
    throw new Error('Owner et workspace exacts requis pour la partition Request3.');
  }
  return JSON.stringify(['laffinee', 'hopAdviceRequest3', 3, ownerKey, workspaceId, scope.kind, scope.id]);
}

/** Explicit Request3 runtime. It never reuses a V1 store or Firebase default unless its factory is injected. */
export function createBrewerHopAdviceSemanticRuntimeV3(input: BrewerHopAdviceSemanticRuntimeInputV3): BrewerHopAdviceSemanticRuntimeV3 {
  const { ownerKey, workspaceId, scope, providerKind, transport, readGeneration } = input;
  const storeNamespace = hopAdviceSemanticV3ClientPartitionKey(ownerKey, workspaceId, scope);
  const readCurrentGeneration = async (requestedScope: BrewerScope): Promise<number> => {
    if (hopAdviceSemanticV3ClientPartitionKey(ownerKey, workspaceId, requestedScope) !== storeNamespace) {
      throw new Error('La lecture de génération vise une autre partition Request3.');
    }
    const generation = await readGeneration(structuredClone(requestedScope));
    if (!Number.isSafeInteger(generation) || generation < 0) throw new Error('La génération Request3 courante est invalide.');
    return generation;
  };
  const guardGenerationAndAuthority = async (send: HopV55SemanticJobSendInputV3): Promise<HopV55SemanticJobSendInputV3> => {
    const currentGeneration = await readCurrentGeneration(scope);
    if (currentGeneration !== send.generation) {
      throw new Error(`La conversation serveur est à la génération ${currentGeneration}; le ticket Request3 cite ${send.generation}.`);
    }
    const authorization = await send.authorizeBeforeEachEmission();
    if (authorization.status !== 'authorized' || authorization.operationId !== send.operationId
      || authorization.generation !== send.generation || authorization.ticketReference !== send.ticketReference
      || authorization.wireReference !== send.wireReference || JSON.stringify(authorization.wire) !== JSON.stringify(send.wire)) {
      throw new Error(authorization.status === 'authorized'
        ? 'Le garde final ne confirme pas le ticket/wire exacts Request3.' : authorization.reason);
    }
    return { ...send, wire: structuredClone(authorization.wire) };
  };
  const guardedTransport: HopV55SemanticJobStoreTransportV3 = {
    async submit(send) { return transport.submit(await guardGenerationAndAuthority(send)); },
    async retry(send) { return transport.retry(await guardGenerationAndAuthority(send)); },
    read: inputValue => transport.read(inputValue),
  };
  const jobs = createHopV55SemanticJobStoreV3({ ownerKey, workspaceId, scope, storeNamespace, providerKind, transport: guardedTransport });
  return { format: 'hop-v55-semantic-companion-runtime-v3', protocol: 'hopAdviceRequest3', ownerKey, workspaceId,
    scope: structuredClone(scope), storeNamespace, providerKind, jobs,
    readGeneration: readCurrentGeneration,
    dispose() { jobs.dispose(); } };
}

export type BrewerHopAdviceSemanticRuntimeWizardV1 = {
  format: 'hop-v55-semantic-companion-runtime-wizard-v1';
  protocol: 'hopAdviceWizardRequest3V1';
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  storeNamespace: string;
  providerKind: HopV55SemanticWizardJobStoreV1['providerKind'];
  jobs: HopV55SemanticWizardJobStoreClientV1;
  readGeneration(scope: BrewerScope): Promise<number>;
  dispose(): void;
};

export interface BrewerHopAdviceSemanticRuntimeWizardV1Input {
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  providerKind: HopV55SemanticWizardJobStoreV1['providerKind'];
  transport: HopV55SemanticWizardJobStoreTransportV1;
  readGeneration(scope: BrewerScope): Promise<number>;
}

export function hopAdviceWizardClientPartitionKey(ownerKey: string, workspaceId: string, scope: BrewerScope): string {
  if (typeof ownerKey !== 'string' || !ownerKey.trim() || ownerKey.trim() !== ownerKey
    || typeof workspaceId !== 'string' || !workspaceId.trim() || workspaceId.trim() !== workspaceId
    || scope.kind !== 'draft' || typeof scope.id !== 'string' || !scope.id.trim() || scope.id.trim() !== scope.id) {
    throw new Error('Partition Wizard explicite requise : owner, workspace et scope draft exacts.');
  }
  return JSON.stringify(['laffinee', 'hopAdviceWizardRequest3V1', 1, ownerKey, workspaceId, scope.kind, scope.id]);
}

/** Distinct Wizard runtime over the typed job lifecycle; every action retains its archived wire guard. */
export function createBrewerHopAdviceSemanticRuntimeWizardV1(
  input: BrewerHopAdviceSemanticRuntimeWizardV1Input,
): BrewerHopAdviceSemanticRuntimeWizardV1 {
  const { ownerKey, workspaceId, scope, providerKind, transport } = input;
  const storeNamespace = hopAdviceWizardClientPartitionKey(ownerKey, workspaceId, scope);
  const snapshotBase = (send: Pick<HopV55SemanticWizardJobSendInputV1,
    'operationId' | 'generation' | 'ticketReference' | 'wireReference'>): Omit<HopV55SemanticWizardJobSnapshotV1, 'status'> => ({
      format: 'hop-v55-semantic-job-snapshot-wizard-v1', operationId: send.operationId,
      generation: send.generation, ticketReference: send.ticketReference, wireReference: send.wireReference,
    });
  const failed = (send: Pick<HopV55SemanticWizardJobSendInputV1,
    'operationId' | 'generation' | 'ticketReference' | 'wireReference'>, reason: string,
    status: HopV55SemanticWizardJobSnapshotV1['status'] = 'failed'): HopV55SemanticWizardJobSnapshotV1 => ({
      ...snapshotBase(send), status, reason,
    });
  const sameWire = (left: HopAdviceV1WizardWireInputV1, right: HopAdviceV1WizardWireInputV1): boolean => {
    try { return hopAdviceContentReference('hop-v55-wizard-runtime-wire-equality-v1', left)
      === hopAdviceContentReference('hop-v55-wizard-runtime-wire-equality-v1', right); }
    catch { return false; }
  };
  const readCurrentGeneration = async (requested: BrewerScope): Promise<number> => {
    if (hopAdviceWizardClientPartitionKey(ownerKey, workspaceId, requested) !== storeNamespace) {
      throw new Error('La lecture de génération vise une autre partition Wizard.');
    }
    const generation = await input.readGeneration(structuredClone(requested));
    if (!Number.isSafeInteger(generation) || generation < 0) throw new Error('La génération Wizard courante est invalide.');
    return generation;
  };
  const authorize = async (send: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSendInputV1 | HopV55SemanticWizardJobSnapshotV1> => {
    const generation = await readCurrentGeneration(scope);
    if (generation !== send.generation) return failed(send,
      `La génération courante est ${generation}; le ticket Wizard cite ${send.generation}.`);
    const decision: HopV55SemanticWizardWireAuthorizationResultV1 = await send.authorizeBeforeEachEmission();
    if (decision.status !== 'authorized') return failed(send, decision.reason,
      decision.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed');
    if (decision.operationId !== send.operationId || decision.generation !== send.generation
      || decision.ticketReference !== send.ticketReference || decision.wireReference !== send.wireReference
      || !sameWire(decision.wire, send.wire)) {
      return failed(send, 'Le garde Wizard ne confirme pas operationId, génération, ticket et wire exacts.');
    }
    return { ...send, wire: structuredClone(decision.wire) };
  };
  const guarded: HopV55SemanticWizardJobStoreTransportV1 = {
    async submit(send) {
      const checked = await authorize(send);
      return 'status' in checked ? checked : transport.submit(checked);
    },
    async retry(send) {
      const checked = await authorize(send);
      return 'status' in checked ? checked : transport.retry(checked);
    },
    async read(readInput) {
      const checked = await authorize({ ...readInput, authorizeBeforeEachEmission: readInput.authorizeBeforeRead });
      if ('status' in checked) return checked;
      return transport.read({ ...readInput, wire: checked.wire });
    },
  };
  const jobs = createHopV55SemanticWizardJobStoreV1({ ownerKey, workspaceId, scope, storeNamespace, providerKind, transport: guarded });
  return { format: 'hop-v55-semantic-companion-runtime-wizard-v1', protocol: 'hopAdviceWizardRequest3V1',
    ownerKey, workspaceId, scope: structuredClone(scope), storeNamespace, providerKind, jobs,
    readGeneration: readCurrentGeneration, dispose() {} };
}
