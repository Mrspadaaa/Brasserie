import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

/**
 * L'appui long sur un bouton (D393 A2, PORT « État de l'art » : long press). Méthode standard, sans dépendance :
 *  - Pointer Events natifs ; une minuterie de `APPUI_LONG_MS` (≈ 450 ms, sous les 500 ms d'Android et d'iOS : la caisse va vite) ;
 *  - annulée si le doigt bouge de plus de `TOLERANCE_PX` (6 px), s'il se lève, ou si le navigateur reprend le geste (défilement : `pointercancel`) ;
 *  - le menu contextuel et la loupe de sélection sont coupés (`contextmenu` empêché, `-webkit-touch-callout` et `user-select` à none, rendus en `style`) ;
 *  - pas de clic fantôme : le `click` qu'un pointeur émet au lâcher d'un appui long est avalé, comme celui d'un doigt qui a bougé de plus de
 *    `TOLERANCE_PX` (Chrome tient un toucher jusqu'à ≈ 15 px : sans cela, un doigt qui hésite ajouterait 1) ; un clic du clavier, `detail` 0, passe toujours ;
 *  - équivalent clavier et souris : Maj+F10, la touche Menu et le clic droit (le geste standard du menu contextuel) déclenchent l'appui long.
 * Reprend la logique de `calendrier/frise/usePointeur.ts` (minuterie, tolérance, menu coupé), sans la modifier ; l'unification se fait dans V-CAL.
 *
 * Un seul crochet pour une rangée de boutons : `lier(cle, onToucher)` rend les gestionnaires d'un bouton. Le toucher simple appelle `onToucher`.
 */
export const APPUI_LONG_MS = 450;
export const TOLERANCE_PX = 6;
/** Le raccourci annoncé (`aria-keyshortcuts`) : Maj+F10, celui du menu contextuel. */
export const RACCOURCI_APPUI_LONG = 'Shift+F10';

export interface InfoAppuiLong {
  /** Le bouton tenu (pour lui rendre le focus). */
  cible: HTMLElement;
  /** Déclenché au clavier : l'appelant porte le focus dans ce qu'il ouvre. */
  clavier: boolean;
}

export interface OptionsAppuiLong<K> {
  onAppuiLong: (cle: K, info: InfoAppuiLong) => void;
  ms?: number;
  tolerance?: number;
}

export interface GestesAppuiLong {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  'aria-keyshortcuts': string;
  style: React.CSSProperties;
}

interface Etat<K> {
  id: number | null;
  x0: number;
  y0: number;
  minuterie: ReturnType<typeof setTimeout> | null;
  /** L'appui long du geste en cours (ou du dernier) a été déclenché : le clic de pointeur qui suit est avalé. */
  declenche: boolean;
  /** Le doigt du geste en cours (ou du dernier) a bougé de plus de la tolérance : ni appui long, ni toucher. */
  bouge: boolean;
  /** Heure du dernier déclenchement au clavier : le `contextmenu` que la touche émet ensuite ne redéclenche pas. */
  clavierA: number;
}

const STYLE: React.CSSProperties = { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' };

/** Un élément interactif à l'intérieur du bouton (le « − » d'une tuile) garde son propre geste : l'appui n'y commence pas. */
function surUnAutreActionneur(e: React.SyntheticEvent<HTMLElement>): boolean {
  const t = e.target instanceof Element ? e.target.closest('button,a,input,select,textarea,[role=button]') : null;
  return !!t && t !== e.currentTarget;
}

export function useAppuiLong<K>({ onAppuiLong, ms = APPUI_LONG_MS, tolerance = TOLERANCE_PX }: OptionsAppuiLong<K>): (cle: K, onToucher: (e: React.MouseEvent<HTMLElement>) => void) => GestesAppuiLong {
  const etat = useRef<Etat<K>>({ id: null, x0: 0, y0: 0, minuterie: null, declenche: false, bouge: false, clavierA: 0 });
  const rappel = useRef(onAppuiLong);
  rappel.current = onAppuiLong;

  const arreter = useCallback(() => {
    const s = etat.current;
    if (s.minuterie) clearTimeout(s.minuterie);
    s.minuterie = null; s.id = null;
  }, []);
  useEffect(() => arreter, [arreter]);

  return useCallback((cle: K, onToucher: (e: React.MouseEvent<HTMLElement>) => void): GestesAppuiLong => ({
    onPointerDown: e => {
      const s = etat.current;
      arreter(); s.declenche = false; s.bouge = false;
      if ((e.pointerType === 'mouse' && e.button !== 0) || surUnAutreActionneur(e)) return;
      const cible = e.currentTarget;
      s.id = e.pointerId; s.x0 = e.clientX; s.y0 = e.clientY;
      s.minuterie = setTimeout(() => {
        s.minuterie = null; s.declenche = true;
        try { navigator.vibrate?.(12); } catch { /* sans vibreur : rien */ }
        rappel.current(cle, { cible, clavier: false });
      }, ms);
    },
    onPointerMove: e => {
      const s = etat.current;
      if (s.id !== e.pointerId || !s.minuterie) return;
      if (Math.hypot(e.clientX - s.x0, e.clientY - s.y0) > tolerance) { s.bouge = true; arreter(); }
    },
    onPointerUp: () => arreter(),
    onPointerCancel: () => arreter(),
    onPointerLeave: () => arreter(),
    onContextMenu: e => {
      e.preventDefault();
      const s = etat.current;
      // Au toucher, Chrome émet `contextmenu` vers 500 ms : la minuterie a déjà déclenché (ou le doigt a bougé). Après une touche, aussi.
      if (s.declenche || Date.now() - s.clavierA < 1000 || surUnAutreActionneur(e)) return;
      const tenu = s.minuterie !== null;
      arreter();
      // Clic droit à la souris (aucun clic ne suit), ou appui long d'un navigateur plus rapide que la minuterie (le clic du lâcher sera avalé).
      s.declenche = tenu;
      rappel.current(cle, { cible: e.currentTarget, clavier: false });
    },
    onKeyDown: e => {
      if (!((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu')) return;
      e.preventDefault();
      etat.current.clavierA = Date.now();
      rappel.current(cle, { cible: e.currentTarget, clavier: true });
    },
    onClick: e => {
      const s = etat.current;
      if ((s.declenche || s.bouge) && e.detail !== 0) { e.preventDefault(); e.stopPropagation(); s.declenche = false; s.bouge = false; return; }
      s.declenche = false; s.bouge = false;
      onToucher(e);
    },
    'aria-keyshortcuts': RACCOURCI_APPUI_LONG,
    style: STYLE,
  }), [arreter, ms, tolerance]);
}
