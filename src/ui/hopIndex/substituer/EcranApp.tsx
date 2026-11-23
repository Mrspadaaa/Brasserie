// Substituer dans l'app (T15c, #174) : la couche `hopSubstitute`. L'écran u4 (son choix, enrichi D127 à D130) sur le brouillon d'outil
// (../dryhopper/outilApp.tsx) : le moment et le remplaçant se règlent sur une copie ; « Remplacer » l'écrit par la porte unique, la
// croix et « Annuler » la jettent. « Comparer (n) › » ouvre la couche Comparer, Nugget épinglé. Chargé à la demande (HopToolLayer).
import type { Brouillon, RecetteParcours } from '../parcours/types';
import { OutilApp } from '../dryhopper/outilApp';
import Substituer from './index';

export interface EcranSubstituerProps {
  /** Le houblon remplacé (clé du moteur). */
  hopKey: string;
  recipeId?: string;
  onClose: () => void;
}

/** Le brouillon de Substituer : le premier ajout de ce houblon (l'étape Houblons ne dit pas lequel : comme la maquette). */
const brouillonDe = (hopKey: string) => (recette: RecetteParcours): Brouillon | null => {
  const a = recette.additions.find((x) => x.hopKey === hopKey);
  return a ? { outil: 'substituer', ajoutId: a.id, recette: { ...recette, additions: recette.additions.map((x) => ({ ...x })) }, remplace: { ajoutId: a.id, hopKey: a.hopKey } } : null;
};

export default function EcranSubstituerApp({ hopKey, recipeId, onClose }: EcranSubstituerProps) {
  return (
    <OutilApp recipeId={recipeId} onClose={onClose} titre="Substituer" creer={brouillonDe(hopKey)}
      absent="Ce houblon n’est plus dans le brouillon : rouvre Substituer depuis l’étape Houblons.">
      <Substituer houblon={hopKey} />
    </OutilApp>
  );
}
