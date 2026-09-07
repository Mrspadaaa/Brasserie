import { useSyncExternalStore } from 'react';
import { BrewerChat as api } from './brewerChat';
import type {
  BrewerChatInput,
  BrewerJob,
  BrewerScope,
  BrewerTurn
} from '../../functions/src/companionTypes';

export type ClientBrewerJob = BrewerJob & {
  input?: BrewerChatInput;
  turn?: BrewerTurn;
  sending?: boolean;
  sendError?: string;
  contextSignature?: string;
  sourceJobId?: string;
};
export const sameBrewerScope = (a: BrewerScope, b: BrewerScope) =>
  a.id === b.id && (a.kind === 'batch') === (b.kind === 'batch');
export const isBrewerWorking = (j: ClientBrewerJob) =>
  !j.sendError && (j.status === 'running' || j.status === 'queued');
type State = { jobs: ClientBrewerJob[]; connectionError: string };

/** Lives outside React pages. The server owns execution; this store only follows receipts. */
export function createBrewerJobStore() {
  let state: State = { jobs: [], connectionError: '' },
    uid = '',
    epoch = 0;
  let timer: ReturnType<typeof setTimeout> | undefined, init: Promise<void> | undefined;
  let pollVersion = -1,
    started = false;
  const listeners = new Set<() => void>(),
    sending = new Set<string>(),
    reading = new Set<string>();
  const minimumGenerations = new Map<string, number>();
  const key = (s: BrewerScope) => `${s.kind === 'batch' ? 'batch' : 'recipe'}:${s.id}`;
  const emit = (next: State) => {
    state = next;
    try {
      if (uid)
        localStorage.setItem(
          `brewer-jobs:${uid}`,
          JSON.stringify(state.jobs.map(({ turn, contextSignature, ...j }) => j).slice(-60))
        );
    } catch {
      /* Server receipts remain recoverable; retain the outbox in memory. */
    }
    listeners.forEach((f) => f());
  };
  const merge = (jobs: ClientBrewerJob[]) => {
    const next = new Map(state.jobs.map((j) => [j.operationId, j]));
    jobs.forEach((job) => {
      if (job.generation < (minimumGenerations.get(key(job.scope)) ?? 0)) return;
      const old = next.get(job.operationId);
      // A delayed HTTP acknowledgement must not rewind newer progress from polling.
      if (
        old &&
        old.id !== old.operationId &&
        job.id !== job.operationId &&
        job.updatedAt < old.updatedAt
      )
        return;
      next.set(job.operationId, {
        ...old,
        ...job,
        ...(job.status === 'done' ? { input: undefined } : {})
      });
    });
    emit({ ...state, jobs: [...next.values()].sort((a, b) => a.createdAt - b.createdAt) });
  };
  const update = (operationId: string, patch: Partial<ClientBrewerJob>) => {
    const job = state.jobs.find((j) => j.operationId === operationId);
    if (job) merge([{ ...job, ...patch }]);
  };
  const send = async (job: ClientBrewerJob) => {
    if ((!job.input && !job.sourceJobId) || sending.has(job.operationId)) return;
    const version = epoch;
    sending.add(job.operationId);
    update(job.operationId, { sending: true, sendError: undefined });
    try {
      const reply = job.sourceJobId
        ? await api.retry(job.sourceJobId, job.operationId)
        : await api.submit(job.input!);
      if (version !== epoch) return;
      if (reply.job)
        merge([{ ...reply.job, input: job.input, sending: false, sendError: undefined }]);
      else if (reply.turn)
        update(job.operationId, {
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
      const current = state.jobs.find((j) => j.operationId === job.operationId);
      if (current && current.id !== current.operationId) return;
      const reason = (error as any)?.details?.reason;
      if (reason === 'chat-reset') {
        forget(job.scope, (error as any)?.details?.generation ?? job.generation + 1);
        return;
      }
      update(job.operationId, {
        sending: false,
        sendError: (error as any)?.code?.includes('resource-exhausted')
          ? 'La file est pleine. Réessaie cet envoi quand une réponse sera arrivée.'
          : 'Réception non confirmée. Vérifie ta connexion puis réessaie l’envoi ; la même question ne sera pas envoyée deux fois.'
      });
    } finally {
      sending.delete(job.operationId);
    }
  };
  const refresh = async () => {
    if (pollVersion === epoch || !started) return;
    const version = epoch;
    pollVersion = version;
    try {
      const jobs = await api.activity();
      if (version !== epoch) return;
      const incoming = jobs.map((j) => ({ ...j, sending: false, sendError: undefined }));
      // A missing acknowledged job was removed by a reset on another device.
      const ids = new Set(jobs.map((j) => j.operationId));
      emit({
        jobs: state.jobs.filter((j) => j.id === j.operationId || ids.has(j.operationId)),
        connectionError: ''
      });
      merge(incoming);
      await Promise.all(
        state.jobs
          .filter((j) => j.status === 'done' && !j.turn && !j.readAt)
          .map(async (job) => {
            const reply = await api.status({
              scope: job.scope,
              operationId: job.operationId,
              generation: job.generation,
              question: job.question
            });
            if (version === epoch && reply.turn) update(job.operationId, { turn: reply.turn });
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
      if (started && version === epoch) {
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
      const nextUid = await api.userKey();
      if (version !== epoch) return;
      uid = nextUid;
      try {
        const stored = JSON.parse(localStorage.getItem(`brewer-jobs:${uid}`) ?? '[]');
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
    minimumGenerations.set(key(scope), generation);
    emit({
      ...state,
      jobs: state.jobs.filter((j) => !sameBrewerScope(j.scope, scope) || j.generation >= generation)
    });
  };
  return {
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
    retry: (job: ClientBrewerJob) => void send(job),
    retrySaved: (previous: ClientBrewerJob) => {
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
      if (job.readAt || isBrewerWorking(job) || reading.has(job.operationId)) return;
      reading.add(job.operationId);
      void api
        .markRead(job.id)
        .then(() => update(job.operationId, { readAt: Date.now() }))
        .catch(() => {})
        .finally(() => reading.delete(job.operationId));
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
