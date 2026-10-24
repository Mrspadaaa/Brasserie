// Les onglets de la base v4.10 et de q2b (D105) : « Ma bière · Suggestions · Comparer », en tête de l'onglet
// Ma bière, de Suggérer et de Comparer. Comparer s'ouvre avec les houblons retenus (le « + » de Suggérer).
// D119 (« Header qui change ??? ») : c'est LA tête des trois onglets, posée par chacun en `mobileHeader` de PageShell
// (CadreOutil pour Suggérer et Comparer) : mêmes onglets, même croix, même hauteur, d'un onglet à l'autre.
// D109 (« Juste une croix bien positionné, facile, dans le thème suffirait ») et D118 (« Je veux juste retour au
// "menu" pas principal ») : la croix remplace le « ‹ » de la base ; elle ramène toujours à l'étape Houblons.
import { useNavigation } from '../coquille/navigation';
import { useComparaison } from '../etat/EtatParcours';

export type Onglet = 'biere' | 'suggerer' | 'comparer';

/** La croix des outils : 44 × 44 px, icône de 22 px à l'encre (dessinée pleine : une seule épaisseur de trait rendue, D83 S4), à gauche de la tête, au même endroit sur chaque outil.
 * Elle ferme l'outil vers l'étape Houblons (#/ma-biere), quel que soit le chemin (D118) ; le retour du téléphone, lui,
 * revient d'un écran. `data-page-titlebar` sur la tête : les scripts du parcours y cherchent `aria-label="Fermer"`. */
export function Croix() {
  const { revenirMaBiere } = useNavigation();
  return (
    <button type="button" data-role="retour" aria-label="Fermer" title="Fermer : retour à l’étape Houblons" onClick={revenirMaBiere}
      className="pq-croix shrink-0">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="pq-croix-icone" fill="currentColor"><path d="M5.4 4 12 10.6 18.6 4 20 5.4 13.4 12 20 18.6 18.6 20 12 13.4 5.4 20 4 18.6 10.6 12 4 5.4Z" /></svg>
    </button>
  );
}

export function Onglets({ actif }: { actif: Onglet }) {
  const { aller } = useNavigation();
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
    <div data-role="onglets" data-page-titlebar className="pq-tete flex items-center gap-1.5">
      <Croix />
      <div role="tablist" className="pq-onglets flex-1 grid grid-cols-3 gap-0.5 rounded-full bg-cave-850 p-0.5">
        {onglets.map((o) => (
          <button key={o.id} type="button" role="tab" aria-selected={o.id === actif} data-onglet={o.id} onClick={() => ouvrir(o.id)}
            className={`pq-onglet rounded-full px-2 whitespace-nowrap ${o.id === actif ? 'bg-cave-950 text-cave-50 font-bold shadow-sm' : 'text-cave-200'}`}>
            {o.nom}
          </button>
        ))}
      </div>
    </div>
  );
}

/** La tête d'un outil sans onglets (Dryhopper, Levure, Substituer) : la même croix, au même endroit, puis la question.
 * D129 (« Fait attention aux header, footer, sur la continuité de l'app ») : le titre d'écran de DESIGN.md (`title`,
 * 18 px, graisse 600, interligne 22 px), le même sur les trois outils, sur une ligne (« … » si trop long). */
export function TeteOutil({ question }: { question: string }) {
  return (
    <div data-page-titlebar className="pq-tete flex items-center gap-1.5">
      <Croix />
      <h1 data-role="titre-outil" className="pq-tete-titre min-w-0 flex-1 truncate text-cave-50">{question}</h1>
    </div>
  );
}
