// Comparer dans la maquette (cmc2k, son choix) : l'écran vit dans l'app, une seule copie (T15, #174) :
// src/ui/hopIndex/comparer/. Ce fichier n'est que son hôte maquette : la recette de l'état du parcours, la coquille
// (cadre à onglets, hash, pile), la fiche de la maquette, et le moteur avec la dégustation S1 posée (../../moteur).
import { useMemo } from 'react';
import '../../moteur';
import Comparer from '@app/ui/hopIndex/comparer';
import { HoteComparerProvider, type HoteComparer } from '@app/ui/hopIndex/comparer/hote';
import { CadreOutil } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useOuvrir } from '../../coquille/ouvrir';
import { useRecette } from '../../etat/EtatParcours';
import Fiche from '../fiche';

export default function ComparerMaquette({ houblons }: { houblons: string[] }) {
  const recette = useRecette();
  const { route, aller } = useNavigation();
  const ouvrir = useOuvrir();
  const valeur = useMemo<HoteComparer>(() => ({
    recette, route: { ecran: route.ecran, ...(route.ecran === 'comparer' && route.pin ? { pin: route.pin } : {}) },
    aller, ouvrir, Cadre: CadreOutil, Fiche,
  }), [recette, route, aller, ouvrir]);
  return <HoteComparerProvider valeur={valeur}><Comparer houblons={houblons} /></HoteComparerProvider>;
}
