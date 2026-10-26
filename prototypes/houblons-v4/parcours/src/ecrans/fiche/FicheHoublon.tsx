// La fiche d'un houblon dans la maquette (T13, #173) : le code vit dans l'app (src/ui/hopIndex/fiche/, une seule copie) ; ici
// l'hôte maquette lui donne l'état en mémoire du parcours (recette, visée, comparaison) et sa navigation. Il est posé à chaque
// emploi (route #/fiche, appui long d'un autre écran, useFiche), comme l'écran le lisait avant le portage.
import { useMemo, useState, type ReactNode } from 'react';
import '../../moteur';
import { FicheHoublon as FicheContenu, HoteFicheProvider, type HoteFiche } from '@app/ui/hopIndex/fiche';
import { useGestesFiche } from '@app/ui/hopIndex/fiche/gestes';
import { useNavigation } from '../../coquille/navigation';
import { useComparaison, useGestes, useRecette, useVisee } from '../../etat/EtatParcours';

function HoteMaquette({ children }: { children: ReactNode }) {
  const recette = useRecette();
  const visee = useVisee();
  const aComparer = useComparaison();
  const { basculerComparaison } = useGestes();
  const { aller } = useNavigation();
  const valeur = useMemo<HoteFiche>(() => ({ recette, visee, aComparer, basculerComparaison, aller }), [recette, visee, aComparer, basculerComparaison, aller]);
  return <HoteFicheProvider valeur={valeur}>{children}</HoteFicheProvider>;
}

/** La fiche, ouverte sur un houblon. */
export function FicheHoublon({ cle, onFermer }: { cle: string; onFermer: () => void }) {
  return <HoteMaquette><FicheContenu cle={cle} onFermer={onFermer} /></HoteMaquette>;
}

/** La fiche pour un écran qui n'a pas de route de fiche : état local. */
export function useFiche() {
  const [cle, setCle] = useState<string | null>(null);
  const g = useGestesFiche(setCle);
  return { ...g, ouverte: cle, fermer: () => setCle(null), rendu: cle ? <FicheHoublon key={cle} cle={cle} onFermer={() => setCle(null)} /> : null };
}
