import type React from 'react';

/**
 * D406 et D408 (21.11, VUE-SAUTE du Calendrier : « il faudrait des tailles fix car SI non ça fait bouger le calendrier ») : un objet de la frise
 * (barre, marque, nom, trait de la grille) se pose par `transform`, jamais par `left`/`top`. Une semaine dépliée ou une autre période le déplace
 * sans décalage de mise en page : sa boîte reste en (0, 0) de sa piste, seule sa translation change. Même rendu au repos.
 */
export function posee(x: number, y?: number): React.CSSProperties {
  return y === undefined ? { left: 0, transform: `translateX(${x}px)` } : { left: 0, top: 0, transform: `translate(${x}px, ${y}px)` };
}

/**
 * Ancrée par son bord droit à `droite` px du bord gauche de la piste (l'ancien `right: calc(100% - droite)`) : la boîte recule de sa propre largeur.
 * Sa largeur reste bornée à `droite` (`maxWidth`), comme quand `right` la bornait.
 */
export function poseeADroite(droite: number, y: number, maxWidth: number): React.CSSProperties {
  return { left: 0, top: 0, transform: `translate(calc(${droite}px - 100%), ${y}px)`, maxWidth: Math.max(0, Math.min(maxWidth, droite)) };
}

/** Pour les contrôles : la position posée d'un objet (x, y en px), lue sur sa translation. `droite` : ancrée par le bord droit. */
export function lirePosee(style: { transform: string }): { x: number; y: number; droite: boolean } {
  const m = /translateX?\((?:calc\()?(-?[\d.]+)px(\s*-\s*100%\))?(?:,\s*(-?[\d.]+)px)?\)/.exec(style.transform || '');
  return m ? { x: Number(m[1]), y: m[3] === undefined ? 0 : Number(m[3]), droite: !!m[2] } : { x: 0, y: 0, droite: false };
}
