import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { StorageService } from '../services/storage';

/** Read again after subscribing: a snapshot can arrive between render and the effect. */
export function useStorageValue<T>(read: () => T): T {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const refresh = () => setValue(read());
    const unsubscribe = StorageService.subscribe(refresh);
    refresh();
    return unsubscribe;
  }, [read]);
  return value;
}

/** Keep an identity, never a frozen copy of a saved record. Only new records need a seed. */
export function useLiveSelection<T>(items: T[], key: keyof T): [T | null, (item: T | null) => void] {
  const [selection, setSelection] = useState<{ id: T[keyof T]; seed?: T } | null>(null);
  const saved = selection ? items.find(item => item[key] === selection.id) : undefined;
  if (saved && selection?.seed) setSelection({ id: selection.id });
  const selected = saved ?? selection?.seed ?? null;
  return [selected, item => setSelection(item === null ? null : {
    id: item[key],
    ...(items.some(current => current[key] === item[key]) ? {} : { seed: item })
  })];
}

function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key =>
    Object.prototype.hasOwnProperty.call(b, key) && equal(a[key], b[key]));
}

/** Three-way merge: untouched fields follow the server; edits remain until acknowledged. */
export function rebaseDraft<T>(previous: T, draft: T, latest: T): T {
  if (equal(previous, draft) || equal(draft, latest)) return latest;
  if (previous && draft && latest &&
      typeof previous === 'object' && typeof draft === 'object' && typeof latest === 'object' &&
      !Array.isArray(previous) && !Array.isArray(draft) && !Array.isArray(latest)) {
    const result = { ...latest };
    for (const key of new Set([...Object.keys(previous), ...Object.keys(draft)])) {
      if (equal(previous[key], draft[key])) continue;
      if (!(key in draft)) delete result[key];
      else result[key] = rebaseDraft(previous[key], draft[key], latest[key]);
    }
    return result;
  }
  return draft;
}

/** Rebase before rendering inputs, so unrelated snapshots cannot erase a keystroke. */
export function useSyncedDraft<T>(source: T, identity: unknown): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState({ source, identity, value: source });
  let current = state;
  if (state.source !== source || state.identity !== identity) {
    current = { source, identity, value: source != null && state.identity === identity
      ? rebaseDraft(state.source, state.value, source) : source };
    setState(current);
  }
  return [current.value, update => setState(previous => ({
    ...previous,
    value: typeof update === 'function' ? (update as (value: T) => T)(previous.value) : update
  }))];
}
