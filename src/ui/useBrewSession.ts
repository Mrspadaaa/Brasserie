import { useCallback, useEffect, useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../services/firebase';
import { Batch, BrewDayState } from '../types';
import { restoreBrewDay } from '../domain/brewDay';
import { brewNow, setBrewClock } from '../services/brewClock';
import { mergeBrewTimestamps } from '../domain/brewSessionMerge';

type Queued = {
  operationId: string;
  state: BrewDayState;
  baseRevision?: number;
  clientNow: number;
};
type Response = { state: BrewDayState | null; serverNow: number };

/** An acknowledged revision, a persistent outbox, and idempotent operations survive retries. */
export function useBrewSession(
  batch: Batch,
  initial: () => BrewDayState,
  onSave: (b: Batch) => void
) {
  const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('preview');
  const live = !!auth?.currentUser && !demo;
  const key = `brew-outbox-${auth?.currentUser?.uid ?? 'demo'}-${batch.id}`;
  const [state, setState] = useState(initial);
  const latest = useRef(state),
    revision = useRef(state.revision ?? 0),
    queue = useRef<Queued[]>([]);
  const flight = useRef<Promise<boolean> | null>(null),
    mounted = useRef(true),
    ready = useRef(!live);
  const writer = useRef(!live),
    acquireWriter = useRef<() => void>(() => {});
  const batchRef = useRef(batch);
  batchRef.current = batch;
  const [status, setStatus] = useState(live ? 'Connexion au journal…' : '');
  const [error, setError] = useState('');
  const persist = () => {
    try {
      if (queue.current.length) localStorage.setItem(key, JSON.stringify(queue.current));
      else localStorage.removeItem(key);
    } catch {
      if (mounted.current)
        setError('Mémoire locale pleine : garde cette page ouverte jusqu’à confirmation serveur.');
    }
  };
  const adopt = (saved: BrewDayState) => {
    if ((saved.revision ?? 0) < revision.current) return;
    revision.current = saved.revision ?? 0;
    latest.current = restoreBrewDay(saved);
    if (mounted.current) setState(latest.current);
  };
  const pump = useCallback((): Promise<boolean> => {
    if (flight.current) return flight.current;
    if (!live || !queue.current.length) return Promise.resolve(true);
    if (!ready.current || !writer.current) return Promise.resolve(false);
    const work = async () => {
      if (mounted.current) {
        setError('');
        setStatus('Enregistrement…');
      }
      try {
        while (queue.current.length && mounted.current) {
          const op = queue.current[0];
          op.baseRevision ??= revision.current;
          persist();
          const before = performance.now();
          const res = await httpsCallable<Record<string, unknown>, Response>(
            functions,
            'saveBrewSession'
          )({ batchId: batch.id, ...op, clientNow: brewNow() });
          if (!res.data.state) throw new Error('Le serveur n’a pas confirmé le journal.');
          setBrewClock(res.data.serverNow, performance.now() - before);
          revision.current = res.data.state.revision ?? revision.current;
          queue.current.shift();
          queue.current = queue.current.map((pending) => ({
            ...pending,
            state: mergeBrewTimestamps(pending.state, op.state, res.data.state!)
          }));
          persist();
          if (!queue.current.length) adopt(res.data.state);
          else {
            latest.current = queue.current[queue.current.length - 1].state;
            if (mounted.current) setState(latest.current);
          }
        }
        if (mounted.current) setStatus(queue.current.length ? 'À synchroniser' : 'Sauvegardé');
        return queue.current.length === 0;
      } catch (e) {
        if (mounted.current) {
          setError(e instanceof Error ? e.message : 'Enregistrement interrompu.');
          setStatus('À synchroniser');
        }
        return false;
      } finally {
        flight.current = null;
      }
    };
    flight.current = work();
    return flight.current;
  }, [batch.id, live]);
  const refresh = useCallback(async () => {
    if (!writer.current) return false;
    try {
      const before = performance.now();
      const res = await httpsCallable<{ batchId: string }, Response>(
        functions,
        'getBrewSession'
      )({ batchId: batch.id });
      if (!writer.current) return false;
      setBrewClock(res.data.serverNow, performance.now() - before);
      if (res.data.state && !queue.current.length) adopt(res.data.state);
      else if (res.data.state && queue.current[0]?.baseRevision == null)
        revision.current = res.data.state.revision ?? 0;
      ready.current = true;
      if (mounted.current) {
        setStatus(queue.current.length ? 'Enregistrement…' : 'Sauvegardé');
        setError('');
      }
      return await pump();
    } catch (e) {
      if (mounted.current) {
        setStatus('Connexion interrompue');
        setError(e instanceof Error ? e.message : 'Journal indisponible.');
      }
      return false;
    }
  }, [batch.id, pump]);
  useEffect(() => {
    mounted.current = true;
    if (!live)
      return () => {
        mounted.current = false;
      };
    writer.current = false;
    ready.current = false;
    let cancelled = false,
      acquiring = false,
      release: (() => void) | undefined;
    const controller = new AbortController();
    let pendingNotice: ReturnType<typeof setTimeout> | undefined;
    const begin = async () => {
      if (cancelled) return;
      writer.current = true;
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? '[]');
        if (
          Array.isArray(saved) &&
          saved.length &&
          saved.every((op) => op.operationId && op.state?.steps)
        ) {
          queue.current = saved;
          latest.current = restoreBrewDay(saved[saved.length - 1].state);
          setState(latest.current);
        }
      } catch {
        setError('Le brouillon local ne peut pas être relu.');
      }
      await refresh();
    };
    acquireWriter.current = () => {
      if (writer.current) {
        void refresh();
        return;
      }
      if (acquiring) return;
      if (typeof navigator.locks?.request !== 'function') {
        void begin();
        return;
      }
      acquiring = true;
      pendingNotice = setTimeout(() => {
        if (!cancelled && !writer.current) {
          setStatus('Ouvert dans un autre onglet');
          setError(
            'Le journal est déjà ouvert dans un autre onglet. Ferme-le là-bas : la saisie reprendra automatiquement ici.'
          );
        }
      }, 400);
      void navigator.locks
        .request(`brew-writer-${key}`, { signal: controller.signal }, async (lock) => {
          clearTimeout(pendingNotice);
          acquiring = false;
          if (cancelled) return;
          const held = new Promise<void>((resolve) => {
            release = resolve;
          });
          await begin();
          if (cancelled) release?.();
          await held;
          writer.current = false;
        })
        .catch(() => {
          acquiring = false;
          clearTimeout(pendingNotice);
          if (!cancelled) {
            ready.current = false;
            setError('Impossible de réserver ce journal sur cet appareil. Réessaie.');
          }
        });
    };
    const online = () => {
      void refresh();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    acquireWriter.current();
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', visible);
    return () => {
      mounted.current = false;
      cancelled = true;
      controller.abort();
      clearTimeout(pendingNotice);
      if (flight.current) void flight.current.finally(() => release?.());
      else release?.();
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [batch.id, live, refresh]);
  useEffect(() => {
    if (
      live &&
      batch.brewDay &&
      (batch.brewDay.revision ?? 0) > revision.current &&
      !queue.current.length
    )
      adopt(batch.brewDay);
  }, [batch.brewDay, live]);
  const update = useCallback(
    (fn: (s: BrewDayState) => BrewDayState) => {
      if (live && (!writer.current || !ready.current)) return;
      const next = fn(latest.current);
      if (next === latest.current) return;
      latest.current = next;
      setState(next);
      if (!live) {
        onSave({ ...batchRef.current, brewDay: next });
        return;
      }
      queue.current.push({
        operationId: crypto.randomUUID(),
        state: JSON.parse(JSON.stringify(next)),
        clientNow: brewNow(),
        ...(!queue.current.length ? { baseRevision: revision.current } : {})
      });
      persist();
      void pump();
    },
    [onSave, pump, live]
  );
  const reload = async () => {
    if (live && !writer.current) {
      acquireWriter.current();
      return;
    }
    if (flight.current) await flight.current;
    try {
      const before = performance.now();
      const res = await httpsCallable<{ batchId: string }, Response>(
        functions,
        'getBrewSession'
      )({ batchId: batch.id });
      if (!res.data.state) throw new Error('Pas encore de journal sur le serveur.');
      if (queue.current.length)
        localStorage.setItem(`${key}-conflict-backup`, JSON.stringify(queue.current));
      queue.current = [];
      persist();
      setBrewClock(res.data.serverNow, performance.now() - before);
      adopt(res.data.state);
      ready.current = true;
      setError('');
      setStatus('Sauvegardé');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Le brouillon reste conservé sur cet appareil.');
    }
  };
  return {
    state,
    latest,
    update,
    status,
    error,
    retry: () => {
      if (writer.current) return refresh();
      acquireWriter.current();
      return Promise.resolve(false);
    },
    reload,
    flush: pump,
    canStart: !live || (ready.current && writer.current),
    pending: queue.current.length > 0,
    live
  };
}
