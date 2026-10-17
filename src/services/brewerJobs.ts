import { useSyncExternalStore } from 'react';
import { BrewerChat as api } from './brewerChat';
import type {
  BrewerChatInput,
  BrewerReply,
  BrewerJob,
  BrewerScope,
  BrewerTurn
} from '../../functions/src/companionTypes';
import type {
  HopV55SemanticJobSnapshotV3,
  HopV55SemanticJobStoreV3,
  HopV55SemanticWireAuthorizationResultV3,
  HopV55SemanticWizardJobSnapshotV1,
  HopV55SemanticWizardJobStoreV1,
} from './hopV55/semanticAdoptionApplicationHost';
import { hopAdviceContentReference } from '../domain/hopDecision/adviceContentReference';

export type ClientBrewerJob = BrewerJob & {
  input?: BrewerChatInput;
  turn?: BrewerTurn;
  sending?: boolean;
  sendError?: string;
  unsupportedReadOnly?: { source: string; snapshot: unknown; reason: string };
  contextSignature?: string;
  sourceJobId?: string;
};
export const sameBrewerScope = (a: BrewerScope, b: BrewerScope) =>
  a.id === b.id && (a.kind === 'draft' ? 'recipe' : a.kind) === (b.kind === 'draft' ? 'recipe' : b.kind);
export const isBrewerWorking = (j: ClientBrewerJob) =>
  !j.sendError && (j.status === 'running' || j.status === 'queued');
type State = { jobs: ClientBrewerJob[]; connectionError: string };

export type BrewerJobStatusInput = Pick<BrewerChatInput, 'scope' | 'operationId' | 'question' | 'generation'>;

/** Complete transport boundary for one job store. No individual method may fall back to BrewerChat. */
export interface BrewerJobStoreTransport {
  submit(input: BrewerChatInput): Promise<BrewerReply>;
  retry(jobId: string, operationId: string): Promise<BrewerReply>;
  activity(): Promise<ClientBrewerJob[]>;
  status(input: BrewerJobStatusInput): Promise<BrewerReply>;
  markRead(jobId: string): Promise<void>;
  userKey(): Promise<string>;
}

/** An injected transport requires an isolated storage key and exact scope identity/comparison. */
export interface BrewerJobStoreOptions {
  transport: BrewerJobStoreTransport;
  storageKeyForUser(userKey: string): string;
  scopeIdentity(scope: BrewerScope): string;
  sameScope(left: BrewerScope, right: BrewerScope): boolean;
  /** Assisted histories keep the exact request until their local receipt is attached. */
  retainInputUntilRead?: boolean;
}

export type HopV55SemanticJobSendInputV3 = Parameters<HopV55SemanticJobStoreV3['submit']>[0];
export type HopV55SemanticJobReadInputV3 = Parameters<HopV55SemanticJobStoreV3['read']>[0];

/** Injectable Request3 transport. It never receives BrewerChatInput or rebuilds the wire. */
export interface HopV55SemanticJobStoreTransportV3 {
  submit(input: HopV55SemanticJobSendInputV3): Promise<HopV55SemanticJobSnapshotV3>;
  retry(input: HopV55SemanticJobSendInputV3): Promise<HopV55SemanticJobSnapshotV3>;
  read(input: HopV55SemanticJobReadInputV3): Promise<HopV55SemanticJobSnapshotV3 | null>;
}

export interface HopV55SemanticJobActivityV3 {
  format: 'hop-v55-semantic-job-activity-v3';
  jobs: HopV55SemanticJobSnapshotV3[];
  connectionError: string;
}

/** Browser projection over durable V3 tickets. It stores only current progress in memory; the workspace ticket owns wire recovery. */
export interface HopV55SemanticJobStoreClientV3 extends HopV55SemanticJobStoreV3 {
  readonly storeNamespace: string;
  subscribe(listener: () => void): () => void;
  snapshot(): HopV55SemanticJobActivityV3;
  start(): void | Promise<void>;
  refresh(): void | Promise<void>;
  forget(scope: BrewerScope, generation: number): void;
  dispose(): void;
}

export interface HopV55SemanticJobStoreOptionsV3 {
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  storeNamespace: string;
  providerKind: HopV55SemanticJobStoreV3['providerKind'];
  transport: HopV55SemanticJobStoreTransportV3;
}

export type HopV55SemanticWizardJobSendInputV1 = Parameters<HopV55SemanticWizardJobStoreV1['submit']>[0];
export type HopV55SemanticWizardJobReadInputV1 = Parameters<HopV55SemanticWizardJobStoreV1['read']>[0];

/** Transport lane for the explicit Wizard Request3 profile; no classic wire or Request2 adapter is accepted. */
export interface HopV55SemanticWizardJobStoreTransportV1 {
  submit(input: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSnapshotV1>;
  retry(input: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSnapshotV1>;
  read(input: HopV55SemanticWizardJobReadInputV1): Promise<HopV55SemanticWizardJobSnapshotV1 | null>;
}

export interface HopV55SemanticWizardJobStoreOptionsV1 {
  ownerKey: string;
  workspaceId: string;
  scope: BrewerScope;
  storeNamespace: string;
  providerKind: HopV55SemanticWizardJobStoreV1['providerKind'];
  transport: HopV55SemanticWizardJobStoreTransportV1;
}

export type HopV55SemanticWizardJobStoreClientV1 = HopV55SemanticWizardJobStoreV1 & { readonly storeNamespace: string };

/** Explicit Wizard job client. Durable ticket storage stays in workspace; this façade never rebuilds its wire. */
export function createHopV55SemanticWizardJobStoreV1(options: HopV55SemanticWizardJobStoreOptionsV1): HopV55SemanticWizardJobStoreClientV1 {
  if (!options || !isNormalized(options.ownerKey) || !isNormalized(options.workspaceId) || !isNormalized(options.storeNamespace)
    || !options.scope || options.scope.kind !== 'draft' || !isNormalized(options.scope.id)
    || !options.transport || typeof options.transport.submit !== 'function' || typeof options.transport.retry !== 'function'
    || typeof options.transport.read !== 'function') {
    throw new Error('Un store Wizard explicite exige owner/workspace/scope et transport complets.');
  }
  const active = new Set<string>();
  const operationKey = (operationId: string, generation: number) => `${options.storeNamespace}\u0000${operationId}\u0000${generation}`;
  async function run(kind: 'submit' | 'retry', input: HopV55SemanticWizardJobSendInputV1) {
    if (input.wire.scope.kind !== 'draft' || input.wire.scope.id !== options.scope.id
      || input.wire.operationId !== input.operationId || input.wire.generation !== input.generation
      || input.wire.question !== input.wire.hopAdvice.question) throw new Error('Wire Wizard hors opération/génération/scope capturés.');
    const key = operationKey(input.operationId, input.generation);
    if (active.has(key)) throw new Error('Une émission Wizard identique est déjà en cours; réutilise son ticket durable.');
    active.add(key);
    try {
      const snapshot = await options.transport[kind]({ ...input, wire: structuredClone(input.wire),
        authorizeBeforeEachEmission: input.authorizeBeforeEachEmission });
      if (snapshot.operationId !== input.operationId || snapshot.generation !== input.generation
        || snapshot.ticketReference !== input.ticketReference || snapshot.wireReference !== input.wireReference) {
        throw new Error('Réponse du transport Wizard liée à une autre fermeture durable.');
      }
      return structuredClone(snapshot);
    } finally { active.delete(key); }
  }
  return {
    kind: 'hopAdviceWizardRequest3V1', providerKind: options.providerKind, storeNamespace: options.storeNamespace,
    submit(input) { return run('submit', input); },
    retry(input) { return run('retry', input); },
    read(input) {
      if (input.ownerKey !== options.ownerKey || input.workspaceId !== options.workspaceId
        || input.operationId.trim() !== input.operationId || input.question.trim() !== input.question
        || input.ticketReference.trim() !== input.ticketReference || input.wireReference.trim() !== input.wireReference
        || input.generation < 0 || !Number.isSafeInteger(input.generation)
        || input.wire.scope.kind !== 'draft' || input.wire.scope.id !== options.scope.id
        || input.wire.operationId !== input.operationId || input.wire.generation !== input.generation
        || input.wire.question !== input.question || input.wire.hopAdvice.question !== input.question
        || typeof input.authorizeBeforeRead !== 'function') {
        throw new Error('Lecture de job Wizard hors owner/workspace/identité exacte.');
      }
      return options.transport.read({ ...input, wire: structuredClone(input.wire), authorizeBeforeRead: input.authorizeBeforeRead });
    },
  };
}

function isNormalized(value: string): boolean {
  return typeof value === 'string' && !!value.trim() && value.trim() === value;
}

const defaultScopeIdentity = (scope: BrewerScope) => `${scope.kind === 'draft' ? 'recipe' : scope.kind}:${scope.id}`;
const defaultTransport: BrewerJobStoreTransport = {
  submit: (input) => api.submit(input),
  retry: (jobId, operationId) => api.retry(jobId, operationId),
  activity: () => api.activity(),
  status: (input) => api.status(input),
  markRead: (jobId) => api.markRead(jobId),
  userKey: () => api.userKey()
};

function isStoreTransport(value: unknown): value is BrewerJobStoreTransport {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return ['submit', 'retry', 'activity', 'status', 'markRead', 'userKey'].every((method) => typeof row[method] === 'function');
}

function requireStoreOptions(options: BrewerJobStoreOptions): BrewerJobStoreOptions {
  if (!options || typeof options !== 'object' || !isStoreTransport(options.transport)
    || typeof options.storageKeyForUser !== 'function' || typeof options.scopeIdentity !== 'function'
    || typeof options.sameScope !== 'function') {
    throw new Error('Un store injecté exige un transport complet, une fabrique de clé et une identité/comparaison de scope.');
  }
  return options;
}

/** Lives outside React pages. The server owns execution; this store only follows receipts. */
export function createBrewerJobStore(options?: BrewerJobStoreOptions) {
  const injected = options === undefined ? undefined : requireStoreOptions(options);
  const transport = injected?.transport ?? defaultTransport;
  const storageKeyForUser = injected?.storageKeyForUser ?? ((userKey: string) => `brewer-jobs:${userKey}`);
  const scopeIdentity = injected?.scopeIdentity ?? defaultScopeIdentity;
  const scopeMatches = injected?.sameScope ?? sameBrewerScope;
  if (injected?.retainInputUntilRead !== undefined && typeof injected.retainInputUntilRead !== 'boolean') {
    throw new Error('retainInputUntilRead doit être un booléen.');
  }
  const retainInputUntilRead = injected?.retainInputUntilRead ?? false;
  let state: State = { jobs: [], connectionError: '' },
    uid = '',
    epoch = 0;
  let timer: ReturnType<typeof setTimeout> | undefined, init: Promise<void> | undefined;
  let pollVersion = -1,
    started = false;
  const listeners = new Set<() => void>(),
    sending = new Set<string>(),
    reading = new Set<string>(),
    inputReleased = new Set<string>();
  const minimumGenerations = new Map<string, number>();
  const scopeKey = (scope: BrewerScope) => {
    const identity = scopeIdentity(scope);
    if (typeof identity !== 'string' || !identity.trim() || identity.trim() !== identity) {
      throw new Error('L’identité de scope doit renvoyer une clé textuelle normalisée.');
    }
    return identity;
  };
  const jobKey = (job: Pick<ClientBrewerJob, 'scope' | 'operationId'>) => JSON.stringify([scopeKey(job.scope), job.operationId]);
  const storageKey = (userKey: string) => {
    const value = storageKeyForUser(userKey);
    if (typeof value !== 'string' || !value.trim() || value.trim() !== value) {
      throw new Error('La fabrique de clé du store doit renvoyer une clé textuelle normalisée.');
    }
    return value;
  };
  const emit = (next: State) => {
    state = next;
    try {
      if (uid)
        localStorage.setItem(
          storageKey(uid),
          JSON.stringify(state.jobs.map(({ turn, contextSignature, ...j }) => j).slice(-60))
        );
    } catch {
      /* Server receipts remain recoverable; retain the outbox in memory. */
    }
    listeners.forEach((f) => f());
  };
  const merge = (jobs: ClientBrewerJob[]) => {
    const next = new Map(state.jobs.map((j) => [jobKey(j), j]));
    jobs.forEach((job) => {
      if (job.generation < (minimumGenerations.get(scopeKey(job.scope)) ?? 0)) return;
      const itemKey = jobKey(job);
      const old = next.get(itemKey);
      // A delayed HTTP acknowledgement must not rewind newer progress from polling.
      if (
        old &&
        old.id !== old.operationId &&
        job.id !== job.operationId &&
        job.updatedAt < old.updatedAt
      )
        return;
      const preservedInput = old?.input;
      next.set(itemKey, {
        ...old,
        ...job,
        ...(retainInputUntilRead && preservedInput !== undefined
          ? { input: inputReleased.has(itemKey) ? undefined : preservedInput }
            : job.status === 'done' && !retainInputUntilRead ? { input: undefined } : {})
      });
    });
    emit({ ...state, jobs: [...next.values()].sort((a, b) => a.createdAt - b.createdAt) });
  };
  const update = (scope: BrewerScope, operationId: string, patch: Partial<ClientBrewerJob>) => {
    const job = state.jobs.find((j) => j.operationId === operationId && scopeMatches(j.scope, scope));
    if (job) merge([{ ...job, ...patch }]);
  };
  const send = async (job: ClientBrewerJob) => {
    const operationKey = jobKey(job);
    if (job.unsupportedReadOnly || (!job.input && !job.sourceJobId) || sending.has(operationKey)) return;
    const version = epoch;
    sending.add(operationKey);
    update(job.scope, job.operationId, { sending: true, sendError: undefined });
    try {
      const reply = job.sourceJobId
        ? await transport.retry(job.sourceJobId, job.operationId)
        : await transport.submit(job.input!);
      if (version !== epoch) return;
      if (reply.job)
        merge([{ ...reply.job, input: job.input, sending: false, sendError: undefined }]);
      else if (reply.turn)
        update(job.scope, job.operationId, {
          id: reply.turn.id,
          status: 'done',
          turn: reply.turn,
          sending: false,
          finishedAt: Date.now()
        });
      else throw Error('Accusé de réception absent.');
      void refresh();
    } catch (error) {
      if (version !== epoch) return;
      // The request may have timed out after polling already recovered its durable receipt.
      const current = state.jobs.find((j) => j.operationId === job.operationId && scopeMatches(j.scope, job.scope));
      if (current && current.id !== current.operationId) return;
      const reason = (error as any)?.details?.reason;
      if (reason === 'chat-reset') {
        forget(job.scope, (error as any)?.details?.generation ?? job.generation + 1);
        return;
      }
      update(job.scope, job.operationId, {
        sending: false,
        sendError: (error as any)?.code?.includes('resource-exhausted')
          ? 'La file est pleine. Réessaie cet envoi quand une réponse sera arrivée.'
          : (error as any)?.unsupportedReadOnly?.reason
            ?? 'Réception non confirmée. Vérifie ta connexion puis réessaie l’envoi ; la même question ne sera pas envoyée deux fois.',
        ...((error as any)?.unsupportedReadOnly ? { unsupportedReadOnly: (error as any).unsupportedReadOnly } : {})
      });
    } finally {
      sending.delete(operationKey);
    }
  };
  const refresh = async () => {
    if (pollVersion === epoch || !started) return;
    const version = epoch;
    pollVersion = version;
    try {
      const jobs = await transport.activity();
      if (version !== epoch) return;
      const incoming = jobs.map((j) => ({ ...j, sending: false, sendError: j.unsupportedReadOnly?.reason }));
      // A missing acknowledged job was removed by a reset on another device.
      const ids = new Set(jobs.map(jobKey));
      emit({
        jobs: state.jobs.filter((j) => j.id === j.operationId || ids.has(jobKey(j))
          || retainInputUntilRead && j.input !== undefined && j.readAt === undefined),
        connectionError: ''
      });
      merge(incoming);
      await Promise.all(
        state.jobs
          .filter((j) => j.status === 'done' && !j.turn && !j.readAt && !j.unsupportedReadOnly)
          .map(async (job) => {
            try {
              const reply = await transport.status({
                scope: job.scope,
                operationId: job.operationId,
                generation: job.generation,
                question: job.question
              });
              if (version === epoch && reply.turn) update(job.scope, job.operationId, { turn: reply.turn });
            } catch (error) {
              const unsupportedReadOnly = (error as any)?.unsupportedReadOnly;
              if (version === epoch && unsupportedReadOnly) update(job.scope, job.operationId, {
                status: 'error', sending: false, sendError: unsupportedReadOnly.reason,
                unsupportedReadOnly
              });
            }
          })
      );
    } catch {
      if (version === epoch)
        emit({
          ...state,
          connectionError:
            'Suivi hors connexion. Les analyses déjà reçues continuent sur le serveur ; leur état sera récupéré au retour du réseau.'
        });
    } finally {
      if (pollVersion === version) pollVersion = -1;
      // An activity request may settle while jsdom or the browser page is being
      // torn down. Do not recreate the polling timer once its document is gone.
      if (started && version === epoch && typeof document !== 'undefined') {
        clearTimeout(timer);
        timer = setTimeout(
          () => void refresh(),
          document.visibilityState === 'hidden'
            ? 30000
            : state.jobs.some(isBrewerWorking)
              ? 3000
              : 60000
        );
      }
    }
  };
  const start = () => {
    if (init) return init;
    started = true;
    const version = epoch;
    init = (async () => {
      const nextUid = await transport.userKey();
      if (version !== epoch) return;
      uid = nextUid;
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey(uid)) ?? '[]');
        if (Array.isArray(stored))
          merge(
            stored
              .filter(
                (j) =>
                  j.scope?.id && typeof j.question === 'string' && typeof j.operationId === 'string'
              )
              .map((j) => ({
                ...j,
                sending: false,
                ...(j.id === j.operationId
                  ? {
                      sendError:
                        'Cet envoi n’a pas été confirmé. Réessaie pour retrouver sa réponse ou le transmettre.'
                    }
                  : {})
              }))
          );
      } catch {
        /* Ignore invalid local cache. */
      }
      void refresh();
    })();
    return init;
  };
  const forget = (scope: BrewerScope, generation: number) => {
    const identity = scopeKey(scope);
    generation = Math.max(generation, minimumGenerations.get(identity) ?? 0);
    minimumGenerations.set(identity, generation);
    emit({
      ...state,
      jobs: state.jobs.filter((j) => !scopeMatches(j.scope, scope) || j.generation >= generation)
    });
  };
  return {
    retainInputUntilRead,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    snapshot: () => state,
    start,
    stop: () => {
      started = false;
      epoch++;
      clearTimeout(timer);
      init = undefined;
      uid = '';
      minimumGenerations.clear();
      sending.clear();
      reading.clear();
      inputReleased.clear();
      emit({ jobs: [], connectionError: '' });
    },
    refresh,
    merge,
    forget,
    submit: (input: BrewerChatInput, label: string) => {
      const now = Date.now();
      const job: ClientBrewerJob = {
        id: input.operationId,
        operationId: input.operationId,
        input,
        scope: input.scope,
        contextSignature: JSON.stringify([input.draft, input.localJournal, input.phase]),
        question: input.question,
        generation: input.generation ?? 0,
        label,
        status: 'queued',
        stage: 'queued',
        createdAt: now,
        updatedAt: now,
        attempt: 0,
        sending: true
      };
      merge([job]);
      const version = epoch;
      void start().then(() => {
        if (version === epoch && started) void send(job);
      });
    },
    retry: (job: ClientBrewerJob) => { if (!job.unsupportedReadOnly) void send(job); },
    retrySaved: (previous: ClientBrewerJob) => {
      if (previous.unsupportedReadOnly) return;
      const operationId = crypto.randomUUID(),
        now = Date.now();
      const job: ClientBrewerJob = {
        ...previous,
        id: operationId,
        operationId,
        sourceJobId: previous.id,
        status: 'queued',
        stage: 'queued',
        attempt: 0,
        error: undefined,
        readAt: undefined,
        finishedAt: undefined,
        createdAt: now,
        updatedAt: now,
        sending: true
      };
      merge([job]);
      const version = epoch;
      void start().then(() => {
        if (version === epoch && started) void send(job);
      });
    },
    markRead: (job: ClientBrewerJob) => {
      const operationKey = jobKey(job);
      if (job.unsupportedReadOnly || job.readAt || isBrewerWorking(job) || reading.has(operationKey)) return;
      reading.add(operationKey);
      void transport
        .markRead(job.id)
        .then(() => {
          if (retainInputUntilRead) inputReleased.add(operationKey);
          update(job.scope, job.operationId, { readAt: Date.now(),
            ...(retainInputUntilRead ? { input: undefined } : {}) });
        })
        .catch(() => {})
        .finally(() => reading.delete(operationKey));
    }
  };
}

const SEMANTIC_JOB_SNAPSHOT_V3_FORMAT = 'hop-v55-semantic-job-snapshot-v3' as const;
const sameSemanticValue = (left: unknown, right: unknown): boolean => {
  try { return hopAdviceContentReference('hop-v55-semantic-job-store-equality-v1', left)
    === hopAdviceContentReference('hop-v55-semantic-job-store-equality-v1', right); }
  catch { return false; }
};

function semanticText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim() === value;
}

function exactSemanticScope(left: unknown, right: BrewerScope): boolean {
  return !!left && typeof left === 'object' && !Array.isArray(left)
    && (left as { kind?: unknown }).kind === right.kind && (left as { id?: unknown }).id === right.id
    && Object.keys(left).length === 2;
}

function assertSemanticJobSnapshotV3(value: unknown, expected: {
  operationId: string; generation: number; ticketReference: string; wireReference: string;
  scope: BrewerScope; question: string;
}): asserts value is HopV55SemanticJobSnapshotV3 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Snapshot de job Request3 absent.');
  const row = value as Record<string, unknown>;
  if (row.format !== SEMANTIC_JOB_SNAPSHOT_V3_FORMAT || row.operationId !== expected.operationId
    || row.generation !== expected.generation || row.ticketReference !== expected.ticketReference
    || row.wireReference !== expected.wireReference
    || !['pending', 'received', 'failed', 'unsupportedReadOnly'].includes(String(row.status))) {
    throw new Error('Snapshot de job différent du ticket, wire ou génération Request3 exacts.');
  }
  if (row.job !== undefined) {
    const job = row.job as Record<string, unknown>;
    if (!job || typeof job !== 'object' || job.operationId !== expected.operationId
      || job.generation !== expected.generation || job.question !== expected.question
      || !exactSemanticScope(job.scope, expected.scope)) {
      throw new Error('Job public différent de la source, question ou génération Request3.');
    }
  }
  if (row.status === 'received' && (row.job === undefined || row.turn === undefined)) {
    throw new Error('Un job reçu exige son job public et le tour opaque du même retour.');
  }
  if (row.reason !== undefined && typeof row.reason !== 'string') throw new Error('Motif du job Request3 invalide.');
}

/**
 * A V3 broker store is deliberately separate from `createBrewerJobStore`: its payload is not
 * `BrewerChatInput`, it has no default transport and no ordinary-chat fallback. The durable workspace
 * ticket owns the full wire; this view keeps the exact ticket/wire references for recovery.
 */
export function createHopV55SemanticJobStoreV3(options: HopV55SemanticJobStoreOptionsV3): HopV55SemanticJobStoreClientV3 {
  if (!options || !semanticText(options.ownerKey) || !semanticText(options.workspaceId)
    || !semanticText(options.storeNamespace) || !['fixture', 'authorizedRequest3'].includes(options.providerKind)
    || !options.transport || typeof options.transport.submit !== 'function' || typeof options.transport.retry !== 'function'
    || typeof options.transport.read !== 'function') {
    throw new Error('Le store Request3 exige owner/workspace, namespace, provider et transport complet explicites.');
  }
  const scope = structuredClone(options.scope);
  if (!scope || !['recipe', 'batch', 'draft', 'app'].includes(scope.kind)
    || !semanticText(scope.id) || Object.keys(scope).length !== 2) throw new Error('Scope exact du store Request3 invalide.');
  let state: HopV55SemanticJobActivityV3 = { format: 'hop-v55-semantic-job-activity-v3', jobs: [], connectionError: '' };
  let started = false;
  let disposed = false;
  const listeners = new Set<() => void>();
  const emit = (jobs: HopV55SemanticJobSnapshotV3[], connectionError = '') => {
    if (disposed) return;
    state = { format: 'hop-v55-semantic-job-activity-v3', jobs: jobs.map(row => structuredClone(row)), connectionError };
    listeners.forEach(listener => listener());
  };
  const merge = (snapshot: HopV55SemanticJobSnapshotV3) => {
    const current = state.jobs.find(row => row.operationId === snapshot.operationId);
    if (current && (current.ticketReference !== snapshot.ticketReference || current.wireReference !== snapshot.wireReference)) {
      throw new Error('operationId Request3 déjà associé à une autre fermeture durable.');
    }
    const next = state.jobs.filter(row => row.operationId !== snapshot.operationId);
    next.push(structuredClone(snapshot));
    next.sort((left, right) => (left.job?.createdAt ?? 0) - (right.job?.createdAt ?? 0));
    emit(next);
  };
  const failedSnapshot = (input: HopV55SemanticJobSendInputV3, reason: string,
    status: 'failed' | 'unsupportedReadOnly' = 'failed'): HopV55SemanticJobSnapshotV3 => ({
      format: SEMANTIC_JOB_SNAPSHOT_V3_FORMAT,
      operationId: input.operationId,
      generation: input.generation,
      ticketReference: input.ticketReference,
      wireReference: input.wireReference,
      status,
      reason,
    });
  async function send(method: 'submit' | 'retry', input: HopV55SemanticJobSendInputV3): Promise<HopV55SemanticJobSnapshotV3> {
    if (disposed) throw new Error('Le store Request3 est fermé.');
    if (!semanticText(input.operationId) || !Number.isSafeInteger(input.generation) || input.generation < 0
      || !semanticText(input.ticketReference) || !semanticText(input.wireReference)
      || input.wire.operationId !== input.operationId || input.wire.generation !== input.generation
      || input.wire.question !== input.wire.hopAdvice.question || !exactSemanticScope(input.wire.scope, scope)
      || typeof input.authorizeBeforeEachEmission !== 'function') {
      throw new Error('Entrée de job Request3 différente du scope ou ticket du store.');
    }
    const authorization: HopV55SemanticWireAuthorizationResultV3 = await input.authorizeBeforeEachEmission();
    if (authorization.status !== 'authorized') {
      const blocked = failedSnapshot(input, authorization.reason,
        authorization.status === 'unsupportedReadOnly' ? 'unsupportedReadOnly' : 'failed');
      merge(blocked);
      return blocked;
    }
    if (authorization.operationId !== input.operationId || authorization.generation !== input.generation
      || authorization.ticketReference !== input.ticketReference || authorization.wireReference !== input.wireReference
      || !sameSemanticValue(authorization.wire, input.wire)) {
      throw new Error('Le garde avant émission n’a pas relu le ticket/wire Request3 exacts.');
    }
    // There is no callback, input projection or async boundary between the last guard and this call.
    const sentInput: HopV55SemanticJobSendInputV3 = { ...input, wire: structuredClone(authorization.wire) };
    const snapshot = await options.transport[method](sentInput);
    assertSemanticJobSnapshotV3(snapshot, { operationId: input.operationId, generation: input.generation,
      ticketReference: input.ticketReference, wireReference: input.wireReference, scope, question: input.wire.question });
    merge(snapshot);
    return structuredClone(snapshot);
  }
  const store: HopV55SemanticJobStoreClientV3 = {
    kind: 'hopAdviceRequest3',
    providerKind: options.providerKind,
    storeNamespace: options.storeNamespace,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    snapshot: () => state,
    start() { started = true; },
    async refresh() {
      // A refresh without a ticket-bound host session cannot authorize a Request3 recovery.
      if (!started || disposed) return;
    },
    forget(requestedScope, generation) {
      if (!exactSemanticScope(requestedScope, scope)) return;
      emit(state.jobs.filter(row => row.generation >= generation));
    },
    submit(input) { return send('submit', input); },
    retry(input) { return send('retry', input); },
    async read(input) {
      if (disposed || input.ownerKey !== options.ownerKey || input.workspaceId !== options.workspaceId
        || !semanticText(input.operationId) || !Number.isSafeInteger(input.generation) || input.generation < 0
        || !semanticText(input.question) || !semanticText(input.ticketReference) || !semanticText(input.wireReference)) {
        throw new Error('Lecture de job Request3 hors owner/workspace/ticket du store.');
      }
      const snapshot = await options.transport.read(input);
      if (!snapshot) return null;
      if (snapshot.ticketReference !== input.ticketReference || snapshot.wireReference !== input.wireReference) {
        throw new Error('La lecture de job Request3 ne correspond pas à son ticket/wire exacts.');
      }
      assertSemanticJobSnapshotV3(snapshot, { operationId: input.operationId, generation: input.generation,
        ticketReference: input.ticketReference, wireReference: snapshot.wireReference, scope,
        question: input.question });
      merge(snapshot);
      return structuredClone(snapshot);
    },
    dispose() { disposed = true; started = false; listeners.clear(); state = { format: 'hop-v55-semantic-job-activity-v3', jobs: [], connectionError: '' }; },
  };
  return store;
}

export const brewerJobs = createBrewerJobStore();
export const useBrewerJobs = () => useSyncExternalStore(brewerJobs.subscribe, brewerJobs.snapshot);

export function brewerJobStatus(job: ClientBrewerJob): string {
  if (job.sending) return 'Envoi de ta question…';
  if (job.sendError) return 'Envoi à confirmer';
  if (job.status === 'error') return 'L’analyse n’a pas abouti';
  if (job.status === 'done') return 'Réponse prête';
  return {
    queued: 'Question enregistrée · en attente',
    context: 'Lecture de ta recette et de ton matériel',
    analysis: 'Gemini analyse ta question',
    tools: 'Vérification avec les outils',
    research: 'Recherche sur le web',
    review: 'Relecture du conseil',
    repair: 'Correction après relecture',
    saving: 'Enregistrement de la réponse',
    retry: 'Nouvelle tentative automatique'
  }[job.stage];
}
