import { useSyncExternalStore } from 'react';
import type { BrewerScope } from './brewerChat';
import { sameBrewerScope } from './brewerJobs';

// The most recently mounted recipe, wizard or batch sheet owns the contextual
// shortcut. Opening its existing chat preserves live drafts and apply callbacks.
const launchers = new Map<symbol, { scope: BrewerScope; open: () => void }>();
const dialogs = new Set<symbol>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
export const brewerLauncher = {
  register(scope: BrewerScope, open: () => void) {
    const id = Symbol();
    launchers.set(id, { scope, open });
    return () => { launchers.delete(id); };
  },
  open(scope?: BrewerScope) {
    const entry = [...launchers.values()].reverse().find((item) => !scope || sameBrewerScope(item.scope, scope));
    if (!entry) return false;
    entry.open();
    return true;
  },
  dialog() {
    const id = Symbol();
    dialogs.add(id);
    emit();
    return () => { dialogs.delete(id); emit(); };
  },
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  snapshot: () => dialogs.size > 0
};
export const useBrewerDialogOpen = () => useSyncExternalStore(brewerLauncher.subscribe, brewerLauncher.snapshot);
