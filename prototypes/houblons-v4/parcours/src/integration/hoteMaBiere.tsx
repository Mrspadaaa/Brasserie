// L'hôte de l'étape Houblons dans la maquette (T12, #170). L'écran vit dans l'app (src/ui/hopIndex/maBiere/, une seule
// copie) ; ici, la maquette lui donne son état en mémoire (EtatParcours), sa pile et son hash (navigation), ses gestes
// (le réducteur) et ses commandes d'en-tête (thème, Recommencer). L'app lui donne les siens (EtapeHoublons.tsx).
import { useMemo, useRef } from 'react';
import '../moteur';
import MaBiere from '@app/ui/hopIndex/maBiere';
import { HoteEtapeProvider, type HoteEtape } from '@app/ui/hopIndex/maBiere/hote';
import { ActionsCoquille, useOuvrir } from '../coquille/ouvrir';
import { useNavigation } from '../coquille/navigation';
import { useGestes, useParcours } from '../etat/EtatParcours';

export default function MaBiereMaquette() {
  const { etat, dispatch } = useParcours();
  const { route, aller } = useNavigation();
  const ouvrir = useOuvrir();
  const gestes = useGestes();
  const ref = useRef(etat); ref.current = etat;
  const valeur = useMemo<HoteEtape>(() => ({
    recette: etat.recette,
    route,
    aller,
    ouvrir,
    gestes,
    modifierAjout: (id, f) => {
      const e = ref.current;
      dispatch({ type: 'etat/poser', etat: { ...e, gestes: e.gestes + 1, recette: { ...e.recette, additions: e.recette.additions.map((a) => (a.id === id ? f(a, e.recette) : a)) } } });
    },
    Actions: ActionsCoquille,
  }), [etat.recette, route, aller, ouvrir, gestes, dispatch]);
  return <HoteEtapeProvider valeur={valeur}><MaBiere /></HoteEtapeProvider>;
}
