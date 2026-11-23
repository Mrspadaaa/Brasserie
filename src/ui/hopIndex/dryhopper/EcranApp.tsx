// Dryhopper et Levure dans l'app (T15c, #174) : la couche `hopTiming`. Dryhopper (p4b2f, son choix) et, en étape, Levure (la
// feuille « Souche ») partagent le même brouillon d'outil (./outilApp.tsx) : « Levure › » passe à l'étape sans quitter la
// couche, « Quand » en revient. `step: 'yeast'` (route) ouvre directement la levure. Chargé à la demande (HopToolLayer).
import { useCallback, useState } from 'react';
import { CONDITIONS } from '../comparer/cas';
import { quandDe } from '../parcours/operations';
import type { Brouillon, RecetteParcours } from '../parcours/types';
import Levure from '../levure';
import Dryhopper from './index';
import { OutilApp } from './outilApp';

export interface EcranTimingProps {
  /** L'ajout visé (a1, a2… : sa position dans les houblons du brouillon). */
  additionId: string;
  /** 'yeast' : la couche s'ouvre sur l'étape Levure. */
  step?: 'yeast';
  recipeId?: string;
  onClose: () => void;
}

const brouillonDe = (ajoutId: string) => (recette: RecetteParcours): Brouillon | null =>
  recette.additions.some((a) => a.id === ajoutId)
    ? { outil: 'dryhopper', ajoutId, recette: { ...recette, additions: recette.additions.map((a) => ({ ...a })) } }
    : null;

/** « Placer » (Comparer) écrit l'ajout tout de suite : 4 g/L, dry hop actif, 3 j, en fin de liste. Un ajout qui a exactement cette signature
 * est reçu comme neuf : Dryhopper s'ouvre sur ★, dans le brouillon d'outil seulement (« Annuler » le jette). */
const estPlace = (r: RecetteParcours, id: string): boolean => {
  const dernier = r.additions[r.additions.length - 1];
  if (!dernier || dernier.id !== id) return false;
  const q = quandDe(dernier, r);
  return q.type === 'dryhop' && q.phase === 'actif' && q.jours === CONDITIONS.jours && Math.abs(dernier.grams - CONDITIONS.doseGL * r.volumeL) < 0.5;
};

export default function EcranTimingApp({ additionId, step, recipeId, onClose }: EcranTimingProps) {
  const [etape, setEtape] = useState<'dryhopper' | 'levure'>(step === 'yeast' ? 'levure' : 'dryhopper');
  const versLevure = useCallback(() => setEtape('levure'), []);
  const versQuand = useCallback(() => setEtape('dryhopper'), []);
  const titre = etape === 'levure' ? 'Levure' : 'Dryhopper';
  return (
    <OutilApp recipeId={recipeId} onClose={onClose} titre={titre} creer={brouillonDe(additionId)} versLevure={versLevure} retour={versQuand} ajoutNeuf={estPlace}
      absent={`L’ajout ${additionId} n’est plus dans le brouillon : rouvre ${titre} depuis l’étape Houblons.`}>
      {etape === 'levure' ? <Levure ajoutId={additionId} /> : <Dryhopper ajoutId={additionId} />}
    </OutilApp>
  );
}
