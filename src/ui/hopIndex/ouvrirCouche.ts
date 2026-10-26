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

let fermeur: (() => boolean) | null = null;

/** La pile pose ici sa fermeture « jusqu'à l'étape » (devHook.ts) : elle rend false quand elle n'a rien à faire. */
export function poserFermeurJusquaLEtape(f: (() => boolean) | null): void { fermeur = f; }

/**
 * D118 : la croix d'une couche empilée sur Ma bière (Suggérer, Comparer) ramène à l'étape Houblons, jamais à Ma bière. Ferme
 * toute la pile d'un saut d'historique. false (rien fermé) : pas de pile posée, ou aucune couche Ma bière dessous ; l'appelant
 * garde alors sa fermeture d'un niveau.
 */
export function fermerJusquaLEtape(): boolean {
  return fermeur ? fermeur() : false;
}

/** Ouvre la couche ; false si aucune pile n'est posée. */
export function ouvrirCouche(route: LayerRoute): boolean {
  if (!ouvreur) return false;
  ouvreur(route);
  return true;
}
