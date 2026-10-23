// Fiche d'un houblon ouverte par la route #/fiche/<houblon> (appui long sur un nom dans Ma bière) : la feuille
// posée sur Ma bière ; la fermer revient à l'écran d'avant (retour du téléphone, « ‹ », « × », Échap).
// Le composant lui-même (FicheHoublon) et son emploi depuis un autre écran (useFiche) : FicheHoublon.tsx.
import { useNavigation } from '../../coquille/navigation';
import { FicheHoublon } from './FicheHoublon';

export { FicheHoublon, useFiche } from './FicheHoublon';
export { AlphaLu, Autres, Intensite, StockIcone, Usage, sourceAlpha } from './briques';
export { useGestesFiche } from './gestes';
export { Silhouette } from './Silhouette';

export default function Fiche({ houblon: cle }: { houblon: string }) {
  const { retour } = useNavigation();
  return <FicheHoublon key={cle} cle={cle} onFermer={retour} />;
}
