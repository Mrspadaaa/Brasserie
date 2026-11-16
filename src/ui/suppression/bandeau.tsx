/**
 * Le bandeau « F-19 supprimé · Annuler » (maquette suppression/v2) : 6 s, posé au-dessus du bouton rond « + » et de la barre du bas, sur toute la largeur.
 * Il vit hors de la fiche qui l'a déclenché : une fiche de brassin supprimé se ferme, le bandeau reste. Le toast de l'app est un texte sans geste ; celui-ci porte Annuler.
 *
 * Un nœud neuf à chaque bandeau : une feuille ouverte marque les nœuds déjà présents `aria-hidden` ; un nœud ajouté après elle reste lisible et touchable.
 */
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Undo2 } from 'lucide-react';

export const DUREE_BANDEAU_MS = 6000;

let courant: { racine: Root; noeud: HTMLDivElement } | null = null;
let minuteur: ReturnType<typeof setTimeout> | undefined;

const Bandeau: React.FC<{ texte: string; geste: string; onGeste: () => void }> = ({ texte, geste, onGeste }) => (
  <div role="status" className="su-bandeau" data-testid="bandeau-suppression">
    <span>{texte}</span>
    <button type="button" onClick={onGeste}><Undo2 size={18} aria-hidden="true" />{geste}</button>
  </div>
);

export function effacerBandeau(): void {
  clearTimeout(minuteur);
  if (!courant) return;
  const { racine, noeud } = courant;
  courant = null;
  noeud.remove();
  // Démonté après le rendu en cours : un geste ou un effet d'une autre racine peut nous appeler en plein rendu.
  setTimeout(() => racine.unmount(), 0);
}

/** Affiche le bandeau ; un geste (Annuler, Ressortir) l'exécute puis l'efface. Un nouveau bandeau remplace le précédent. */
export function montrerBandeau(texte: string, geste: string, auGeste: () => void): void {
  if (typeof document === 'undefined') return;
  effacerBandeau();
  const noeud = document.createElement('div');
  noeud.className = 'su';
  document.body.appendChild(noeud);
  const racine = createRoot(noeud);
  courant = { racine, noeud };
  racine.render(<Bandeau texte={texte} geste={geste} onGeste={() => { effacerBandeau(); auGeste(); }} />);
  minuteur = setTimeout(effacerBandeau, DUREE_BANDEAU_MS);
}
