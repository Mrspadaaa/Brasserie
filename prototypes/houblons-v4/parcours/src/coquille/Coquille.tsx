// Coquille de la maquette : Ma bière au fond (la page de la recette), l'outil de la route par-dessus en plein
// écran, la fiche en feuille. Elle tient le brouillon en accord avec la route : une route d'outil suppose son
// brouillon ; revenir hors de l'outil l'abandonne (la recette reste intacte).
import { useEffect, useRef } from 'react';
import { JeuPictos } from '../commun/Pictos';
import { useParcours } from '../etat/EtatParcours';
import { brouillonPour } from '../etat/etapes';
import MaBiere from '../ecrans/ma-biere';
import Biere from '../ecrans/biere';
import Fiche from '../ecrans/fiche';
import Suggerer from '../ecrans/suggerer';
import Comparer from '../ecrans/comparer';
import Dryhopper from '../ecrans/dryhopper';
import Levure from '../ecrans/levure';
import Substituer from '../ecrans/substituer';
import { useNavigation } from './navigation';
import { estOutil } from './routes';

export function Coquille() {
  const { route } = useNavigation();
  const { etat, dispatch } = useParcours();
  const etatRef = useRef(etat); etatRef.current = etat;
  // À chaque changement de route seulement (pas à chaque geste) : le brouillon suit la route.
  useEffect(() => {
    const e = etatRef.current;
    const b = brouillonPour(route, e);
    if (b === 'garder') return;
    if (b) dispatch({ type: 'brouillon/ouvrir', brouillon: b });
    else if (e.brouillon) dispatch({ type: 'brouillon/abandonner' });
  }, [route, dispatch]);

  const outil = (() => {
    switch (route.ecran) {
      case 'biere': return <Biere />;
      case 'suggerer': return <Suggerer />;
      case 'comparer': return <Comparer houblons={route.houblons} />;
      case 'dryhopper': return etat.brouillon ? <Dryhopper ajoutId={route.ajout} /> : null;
      case 'levure': return etat.brouillon ? <Levure ajoutId={route.ajout} /> : null;
      case 'substituer': return etat.brouillon ? <Substituer houblon={route.houblon} /> : null;
      default: return null;
    }
  })();
  return (
    <>
      <JeuPictos />
      {/* Sous un outil plein écran, Ma bière n'est pas montée : ses titres, ses mots et ses houblons ne doivent pas
          se lire avec l'outil (contrôles du dépôt, lecteurs d'écran). Elle se remonte au retour, recalculée. */}
      {!estOutil(route) && <MaBiere />}
      {route.ecran === 'fiche' && <Fiche houblon={route.houblon} />}
      {outil}
    </>
  );
}
