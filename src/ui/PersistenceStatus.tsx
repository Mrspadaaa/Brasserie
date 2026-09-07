import { useEffect, useReducer } from 'react';
import { FirestoreRepo } from '../services/firestoreRepo';

/** Quiet when confirmed, visible whenever a device's edits still need the server. */
export function PersistenceStatus() {
  const [, refresh] = useReducer(n => n + 1, 0);
  useEffect(() => FirestoreRepo.subscribe(refresh), []);
  const state = FirestoreRepo.syncStatus();
  if (!state.error && !state.pending && !state.fromCache && !state.refreshing) return null;
  return <div role="status" className={`px-4 py-1.5 text-center text-xs ${state.error ? 'text-alert bg-alert/10' : 'text-ebc-straw bg-ebc-straw/5'}`}>
    {state.error || (state.refreshing ? 'Actualisation des données…' : state.fromCache ? 'Synchronisation en attente · données de cet appareil' : 'Enregistrement sur le serveur…')}
    {(state.needsRefresh || state.fromCache) && <button type="button" onClick={() => FirestoreRepo.resumeSync(true)}
      disabled={state.refreshing} className="ml-2 min-h-touch px-3 underline underline-offset-2 disabled:opacity-50">
      Actualiser
    </button>}
  </div>;
}
