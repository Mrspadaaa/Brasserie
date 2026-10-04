import { useSyncExternalStore } from 'react';
import { BrewerChat as api } from './brewerChat';
import type {
  BrewerChatInput,
  BrewerReply,
  BrewerJob,
  BrewerScope,
  BrewerTurn
} from '../../functions/src/companionTypes';

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
