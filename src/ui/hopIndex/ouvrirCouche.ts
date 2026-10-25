/**
 * L'ouverture d'une couche d'outil houblons depuis un écran monté sous la pile (T12, #170).
 *
 * L'étape Houblons du wizard n'a pas la pile de l'app (`useFullScreenRoute`, tenue par App.tsx) : App la pose ici par
 * `useHopPileDevHook` (devHook.ts), qu'elle appelle déjà, et l'étape s'en sert. Sans pile posée (aperçu isolé, test), ouvrir
 * ne fait rien. À remplacer par une prop explicite du wizard quand App.tsx sera repris (hors de la voie T12).
 */
import type { LayerRoute } from '../../pages/useFullScreenRoute';

let ouvreur: ((route: LayerRoute) => void) | null = null;

export function poserOuvreurCouche(f: ((route: LayerRoute) => void) | null): void { ouvreur = f; }

/** Ouvre la couche ; false si aucune pile n'est posée. */
export function ouvrirCouche(route: LayerRoute): boolean {
  if (!ouvreur) return false;
  ouvreur(route);
  return true;
}
