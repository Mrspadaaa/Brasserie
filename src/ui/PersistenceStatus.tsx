import { useEffect, useReducer } from 'react';
import { FirestoreRepo } from '../services/firestoreRepo';

/** Quiet when confirmed, visible whenever a device's edits still need the server.
 *  CAL-FRISE-PRIX (CFP-8, 21.11) : posé PAR-DESSUS l'écran (fixed), jamais dans le flux : il ne pousse plus la courbe sous le doigt ; seul
 *  « Actualiser » prend le doigt. */
export function PersistenceStatus() {
  const [, refresh] = useReducer(n => n + 1, 0);
  useEffect(() => FirestoreRepo.subscribe(refresh), []);
  const state = FirestoreRepo.syncStatus();
  if (!state.error && !state.pending && !state.fromCache && !state.refreshing) return null;
  return <div role="status" data-bandeau-persistance className={`pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.25rem)] z-50 max-w-[calc(100%-1rem)] -translate-x-1/2 rounded-[10px] border border-cave-700 bg-cave-850 px-3 py-1 text-center text-xs shadow-lift ${state.error ? 'text-alert' : 'text-ebc-straw'}`}>
    {state.error || (state.refreshing ? 'Actualisation des données…' : state.fromCache ? 'Synchronisation en attente · données de cet appareil' : 'Enregistrement sur le serveur…')}
    {(state.needsRefresh || state.fromCache) && <button type="button" onClick={() => FirestoreRepo.resumeSync(true)}
      disabled={state.refreshing} className="pointer-events-auto ml-2 min-h-touch px-3 underline underline-offset-2 disabled:opacity-50">
      Actualiser
    </button>}
  </div>;
}
