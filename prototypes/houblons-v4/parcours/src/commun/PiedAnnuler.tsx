// Le pied d'un outil qui propose de changer la recette (D120, « Pas de bouton cancer », 23.10) : « Annuler » à
// gauche de l'action, à la même hauteur (48 px, la cible du pouce), sur Substituer, Levure et Dryhopper, toujours la
// même forme. Annuler jette le brouillon (la recette ne bouge pas) et ramène à l'étape Houblons (#/ma-biere, D118).
// L'action reste le Pont de l'outil (data-role="pont-…"), seulement agrandie à 48 px dans ce pied.
// Au portage : composant commun des outils (src/ui/hops/ToolFooter.tsx), à côté du Dock.
// Classes propres préfixées pq-annuler- (L26).
import type { ReactNode } from 'react';
import { useNavigation } from '../coquille/navigation';
import { useGestes } from '../etat/EtatParcours';
import './pied-annuler.css';

export function PiedAnnuler({ resume, children }: { resume?: ReactNode; children: ReactNode }) {
  const gestes = useGestes();
  const { revenirMaBiere } = useNavigation();
  const annuler = () => { gestes.abandonner(); revenirMaBiere(); };
  return (
    <div data-pied="annuler" className="pq-annuler-pied">
      {resume != null && <div className="pq-annuler-resume">{resume}</div>}
      <div className="pq-annuler-rang">
        <button type="button" data-role="annuler" onClick={annuler} className="pq-annuler-bouton">Annuler</button>
        <div className="pq-annuler-action">{children}</div>
      </div>
    </div>
  );
}
