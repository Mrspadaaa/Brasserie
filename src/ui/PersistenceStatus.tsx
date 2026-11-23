import { useEffect, useLayoutEffect, useReducer, useState } from 'react';
import { FirestoreRepo } from '../services/firestoreRepo';

const enLigne = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/** Quiet when confirmed, visible whenever a device's edits still need the server.
 *  CAL-FRISE-PRIX (CFP-8, 21.11) : posé PAR-DESSUS l'écran (fixed), jamais dans le flux : il ne pousse plus la courbe sous le doigt ; seul
 *  « Actualiser » prend le doigt.
 *  L-49 (23.11) : jamais sur l'en-tête (il cachait ‹ Nov. › des minutes durant) : juste sous lui. `data-attente` dit ce qui retient
 *  « Enregistrement sur le serveur… » (diagnostic de la durée, cause non établie hors réseau réel).
 *  L-56 (T11-13) : hors ligne, un signe, même sans écriture en attente. */
export function PersistenceStatus() {
  const [, refresh] = useReducer(n => n + 1, 0);
  const [enReseau, setEnReseau] = useState(enLigne);
  useEffect(() => FirestoreRepo.subscribe(refresh), []);
  useEffect(() => {
    const suivre = () => setEnReseau(enLigne());
    window.addEventListener('online', suivre);
    window.addEventListener('offline', suivre);
    return () => { window.removeEventListener('online', suivre); window.removeEventListener('offline', suivre); };
  }, []);
  const state = FirestoreRepo.syncStatus();
  const visible = !enReseau || Boolean(state.error || state.pending || state.fromCache || state.refreshing);
  const [haut, setHaut] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!visible) return;
    const bas = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    setHaut(bas > 0 ? bas + 4 : null);
  }, [visible]);
  if (!visible) return null;
  const texte = state.error || (!enReseau
    ? (state.pending ? 'Hors ligne · gardé sur l’appareil' : 'Hors ligne')
    : state.refreshing ? 'Actualisation des données…' : state.fromCache ? 'Synchronisation en attente · données de cet appareil' : 'Enregistrement sur le serveur…');
  return <div role="status" data-bandeau-persistance data-hors-ligne={enReseau ? undefined : ''} data-attente={state.pendingSources?.join(' ') || undefined}
    style={haut !== null ? { top: haut } : undefined}
    className={`pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.25rem)] z-50 max-w-[calc(100%-1rem)] -translate-x-1/2 rounded-[10px] border border-cave-700 bg-cave-850 px-3 py-1 text-center text-xs shadow-lift ${state.error ? 'text-alert' : 'text-ebc-straw'}`}>
    {texte}
    {enReseau && (state.needsRefresh || state.fromCache) && <button type="button" onClick={() => FirestoreRepo.resumeSync(true)}
      disabled={state.refreshing} className="pointer-events-auto ml-2 min-h-touch px-3 underline underline-offset-2 disabled:opacity-50">
      Actualiser
    </button>}
  </div>;
}
