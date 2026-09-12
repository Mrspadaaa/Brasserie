import { useEffect, useReducer } from 'react';
import { FirestoreRepo } from '../services/firestoreRepo';

/** Until the whole register is available, no finance screen receives a partial year. */
export function FinancialLedgerLoading() {
  const [, refresh] = useReducer(value => value + 1, 0);
  useEffect(() => FirestoreRepo.subscribe(refresh), []);
  const state = FirestoreRepo.financialLedgerStatus();
  if (state.complete) return null;
  return <div className="max-w-sm text-center text-sm leading-relaxed space-y-3" role="status">
    <p className="text-cave-400">{state.loadedRows ? `${state.loadedRows} écritures et règlements chargés…` : 'Préparation du registre comptable…'}</p>
    <p className="text-cave-500 text-xs">La première ouverture reprend les années conservées. Les prochaines ouvertures synchroniseront seulement les changements.</p>
    {state.error && <><p className="text-alert">{state.error}</p><button type="button" className="min-h-11 rounded-xl border border-cave-700 px-4 text-ebc-straw" onClick={() => FirestoreRepo.resumeSync(true)}>Réessayer le chargement</button></>}
  </div>;
}
