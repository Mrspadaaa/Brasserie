// L'hôte maquette des trois outils à brouillon (T15c, #174) : Substituer, Dryhopper et Levure vivent dans l'app (src/ui/hopIndex/
// substituer, dryhopper, levure), une seule copie de chaque écran. Ici, ce que la maquette leur donne : son état en mémoire (le
// brouillon et ses gestes, le réducteur), sa coquille (cadre à croix, hash, pile) et la fiche de la maquette. Les écrans ne lisent
// rien d'autre de leur environnement.
import { useMemo, type ReactNode } from 'react';
import '../../moteur';
import { HoteOutilProvider, type HoteOutil } from '@app/ui/hopIndex/dryhopper/hote';
import { CadreOutil } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useBrouillon, useComparaison, useGestes, useRecette } from '../../etat/EtatParcours';
import { useFiche } from '../fiche/FicheHoublon';
import { useFicheSurOutil } from './fiche-sur-outil';

export function HoteMaquette({ children }: { children: ReactNode }) {
  const brouillon = useBrouillon();
  const recette = useRecette();
  const aComparer = useComparaison();
  const g = useGestes();
  const { aller, retour, revenirMaBiere } = useNavigation();
  const valeur = useMemo<HoteOutil>(() => ({
    brouillon, recette, aComparer,
    gestes: { moment: g.moment, dose: g.dose, remplacer: g.remplacer, levure: g.levure, inscrire: g.inscrire, basculerComparaison: g.basculerComparaison },
    aller, retour, revenirMaBiere,
    // « Annuler » jette le brouillon et ramène à l'étape Houblons (D120, D118).
    annuler: () => { g.abandonner(); revenirMaBiere(); },
    Cadre: CadreOutil, useFiche, useFicheSurOutil,
  }), [brouillon, recette, aComparer, g, aller, retour, revenirMaBiere]);
  return <HoteOutilProvider valeur={valeur}>{children}</HoteOutilProvider>;
}
