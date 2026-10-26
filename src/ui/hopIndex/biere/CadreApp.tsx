// Le cadre de Ma bière dans l'app (p6, #174) : PageShell de l'app, la tête à onglets de la base v4.10 (Ma bière · Suggestions ·
// Comparer (n)), Ma bière active. Même tête que celle de Suggérer et de Comparer (suggerer/CadreApp.tsx, comparer/CadreApp.tsx) :
// la croix ferme la couche (retour à l'étape Houblons, dessous) ; « Suggestions » et « Comparer » ouvrent leur couche par-dessus.
// Les classes de la tête (pq-croix, pq-onglets…) sont celles de comparer/cadre-app.css.
import { createContext, useContext } from 'react';
import { PageShell } from '../../../pages/PageShell';
import type { CadreBiereProps } from './hote';
import '../comparer/cadre-app.css';
import './biere.css';

export interface ActionsCadreBiere { fermer: () => void; suggerer: () => void; comparer: () => void; nbHoublons: number }
export const CadreBiereCtx = createContext<ActionsCadreBiere | null>(null);

function Onglets({ a }: { a: ActionsCadreBiere }) {
  const onglets = [
    { id: 'biere', nom: 'Ma bière', va: () => {} },
    { id: 'suggerer', nom: 'Suggestions', va: a.suggerer },
    { id: 'comparer', nom: a.nbHoublons ? `Comparer (${a.nbHoublons})` : 'Comparer', va: a.comparer },
  ];
  return (
    <div data-role="onglets" data-page-titlebar className="pq-tete flex items-center gap-1.5">
      <button type="button" data-role="retour" aria-label="Fermer" title="Fermer : retour à l’étape Houblons" onClick={a.fermer} className="pq-croix shrink-0">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="pq-croix-icone" fill="currentColor"><path d="M5.4 4 12 10.6 18.6 4 20 5.4 13.4 12 20 18.6 18.6 20 12 13.4 5.4 20 4 18.6 10.6 12 4 5.4Z" /></svg>
      </button>
      <div role="tablist" className="pq-onglets flex-1 grid grid-cols-3 gap-0.5 rounded-full bg-cave-850 p-0.5">
        {onglets.map((o) => (
          <button key={o.id} type="button" role="tab" aria-selected={o.id === 'biere'} data-onglet={o.id} onClick={o.va}
            className={`pq-onglet rounded-full px-2 whitespace-nowrap ${o.id === 'biere' ? 'bg-cave-950 text-cave-50 font-bold shadow-sm' : 'text-cave-200'}`}>
            {o.nom}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CadreApp({ elementTete, children }: CadreBiereProps) {
  const a = useContext(CadreBiereCtx);
  if (!a) throw new Error('CadreApp (Ma bière) hors de CadreBiereCtx');
  return (
    <PageShell title="Ma bière" onClose={a.fermer}
      mobileHeader={<div {...(elementTete ? { 'data-element': elementTete } : {})}><Onglets a={a} /></div>}
      className="pq-outil pq-outil-biere pq-cadre-retour">
      {children}
    </PageShell>
  );
}
