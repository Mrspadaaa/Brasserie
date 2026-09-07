import { useEffect, useReducer } from 'react';
import { FirestoreRepo } from '../services/firestoreRepo';

/** Quiet when confirmed, visible whenever a device's edits still need the server. */
export function PersistenceStatus() {
  const [, refresh] = useReducer(n => n + 1, 0);
  useEffect(() => FirestoreRepo.subscribe(refresh), []);
  const state = FirestoreRepo.syncStatus();
  if (!state.error && !state.pending && !state.fromCache) return null;
  return <div role="status" className={`px-4 py-1.5 text-center text-xs ${state.error ? 'text-alert bg-alert/10' : 'text-ebc-straw bg-ebc-straw/5'}`}>
    {state.error || (state.fromCache ? 'Synchronisation en attente · données de cet appareil' : 'Enregistrement sur le serveur…')}
  </div>;
}
