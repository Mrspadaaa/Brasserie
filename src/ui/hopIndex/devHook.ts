/**
 * Crochet de développement de la pile des outils houblons (#162).
 *
 * `window.__hopPile` n'existe qu'en développement (`import.meta.env.DEV`, remplacé par `false` au build) : il permet
 * aux contrôles Chrome d'ouvrir les couches d'outils tant que le drapeau `hopV4` est éteint. Il ne lit ni n'écrit
 * aucune donnée : il ne fait que pousser et dépiler des routes.
 */
import { useEffect } from 'react';
import { poserFermeurJusquaLEtape, poserOuvreurCouche } from './ouvrirCouche';
import { isLayerRoute, type FullScreenRoute, type LayerRoute, type Route } from '../../pages/useFullScreenRoute';

export interface HopPileDevHook {
  /** Ouvre une couche (outil v4 ou atelier V5.5) par-dessus l'écran courant. */
  open: (route: LayerRoute) => void;
  /** Ferme le sommet (un niveau), comme le retour du téléphone. */
  close: () => void;
  /** Revient à la plus haute route de la vue donnée. */
  closeTo: (view: Route['view']) => void;
  /** La pile, du fond au sommet. */
  pile: () => Route[];
}

declare global { interface Window { __hopPile?: HopPileDevHook } }

export function useHopPileDevHook(route: Pick<FullScreenRoute, 'open' | 'close' | 'pile'> & Partial<Pick<FullScreenRoute, 'closeTo'>>) {
  const { open, close, closeTo, pile } = route;
  // La pile est aussi posée pour les écrans montés dessous (l'étape Houblons du wizard, T12), en production comme en dev.
  useEffect(() => {
    poserOuvreurCouche(next => { if (isLayerRoute(next)) open(next); });
    return () => poserOuvreurCouche(null);
  }, [open]);
  // D118 : la croix d'une couche empilée ferme toute la pile jusqu'à l'étape Houblons, jamais ailleurs.
  useEffect(() => {
    if (!closeTo) return;
    poserFermeurJusquaLEtape(() => {
      const haut = pile.length - 1;
      if (haut < 1 || !isLayerRoute(pile[haut]) || pile[haut].view === 'hopBeer') return false;
      closeTo(r => !isLayerRoute(r), { view: 'hopBeer' });
      return true;
    });
    return () => poserFermeurJusquaLEtape(null);
  }, [closeTo, pile]);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__hopPile = {
      open: next => { if (isLayerRoute(next)) open(next); },
      close,
      // Sans effet si la pile n'a pas cette vue : le crochet ne fabrique pas d'écran de repli.
      closeTo: view => { if (pile.some(r => r.view === view)) closeTo?.(r => r.view === view, { view: 'hopBeer' }); },
      pile: () => [...pile]
    };
    return () => { delete window.__hopPile; };
  }, [open, close, closeTo, pile]);
}
