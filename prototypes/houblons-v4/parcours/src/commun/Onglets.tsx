// Les onglets de la base v4.10 et de q2b (D105) : « Ma bière · Suggestions · Comparer », en tête de l'onglet
// Ma bière et de Suggérer. Comparer s'ouvre avec les houblons retenus (le « + » de Suggérer).
import { ChevronLeft } from 'lucide-react';
import { useNavigation } from '../coquille/navigation';
import { useComparaison } from '../etat/EtatParcours';

export type Onglet = 'biere' | 'suggerer' | 'comparer';

export function Onglets({ actif }: { actif: Onglet }) {
  const { aller, retour } = useNavigation();
  const aComparer = useComparaison();
  const onglets: { id: Onglet; nom: string }[] = [
    { id: 'biere', nom: 'Ma bière' },
    { id: 'suggerer', nom: 'Suggestions' },
    { id: 'comparer', nom: aComparer.length ? `Comparer (${aComparer.length})` : 'Comparer' },
  ];
  const ouvrir = (id: Onglet) => {
    if (id === actif) return;
    if (id === 'comparer') aller({ ecran: 'comparer', houblons: aComparer });
    else aller({ ecran: id });
  };
  return (
    <div data-role="onglets" className="flex items-center gap-1.5 px-2 py-1">
      <button type="button" aria-label="Retour à l'étape Houblons" onClick={retour} className="touch-target rounded-control text-cave-200 shrink-0">
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <div role="tablist" className="flex-1 grid grid-cols-3 gap-0.5 rounded-full bg-cave-850 p-0.5">
        {onglets.map((o) => (
          <button key={o.id} type="button" role="tab" aria-selected={o.id === actif} data-onglet={o.id} onClick={() => ouvrir(o.id)}
            className={`rounded-full px-2 py-1 text-sm ${o.id === actif ? 'bg-cave-950 text-cave-50 font-semibold shadow-sm' : 'text-cave-400'}`}>
            {o.nom}
          </button>
        ))}
      </div>
    </div>
  );
}
