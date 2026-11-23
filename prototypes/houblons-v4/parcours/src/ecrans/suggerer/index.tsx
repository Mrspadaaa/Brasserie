// Suggérer dans la maquette (q2b, base v4.10, son choix) : l'écran vit dans l'app, une seule copie (T13, #173) :
// src/ui/hopIndex/suggerer/. Ce fichier n'est que son hôte maquette : la recette, la visée et la comparaison de l'état du
// parcours, ses gestes (le réducteur), la coquille (cadre à onglets, hash, pile), la fiche de la maquette, et le moteur
// avec la dégustation S1 posée (../../moteur).
import { useMemo } from 'react';
import '../../moteur';
import Suggerer from '@app/ui/hopIndex/suggerer';
import { HoteSuggererProvider, type HoteSuggerer } from '@app/ui/hopIndex/suggerer/hote';
import { CadreOutil } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useOuvrir } from '../../coquille/ouvrir';
import { useComparaison, useGestes, useRecette, useVisee } from '../../etat/EtatParcours';
import Fiche from '../fiche';

/** Instantané du moteur (même état de départ) pour controle-autres-ajouts, lu depuis son dossier de cas (voir NOTE). */
const CAS_DIRECT = '../../../../../../prototypes/houblons-v4/parcours/src/ecrans/suggerer/cas-direct';

export default function SuggererMaquette() {
  const recette = useRecette();
  const visee = useVisee();
  const aComparer = useComparaison();
  const gestes = useGestes();
  const { route, aller } = useNavigation();
  const ouvrir = useOuvrir();
  const valeur = useMemo<HoteSuggerer>(() => ({
    recette, visee, aComparer, route: route as HoteSuggerer['route'], aller, ouvrir, Cadre: CadreOutil, Fiche, cas: CAS_DIRECT,
    gestes: {
      ajouter: gestes.ajouter, moment: gestes.moment, dose: gestes.dose, remplacer: gestes.remplacer, retirer: gestes.retirer,
      basculerComparaison: gestes.basculerComparaison, fixerComparaison: gestes.fixerComparaison,
    },
  }), [recette, visee, aComparer, route, aller, ouvrir, gestes]);
  return <HoteSuggererProvider valeur={valeur}><Suggerer /></HoteSuggererProvider>;
}
