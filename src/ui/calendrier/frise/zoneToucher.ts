import { useCallback, useRef } from 'react';
import type React from 'react';
import { APPUI_LONG_MS, SEUIL_MOUVEMENT_PX } from './usePointeur';

/**
 * Tour 3 n° T2-2 (19.11, Calendrier 390 : « toucher la barre minuscule du brassin Ttt n'ouvre aucune fiche, vignette et nom touchés »).
 * Deux causes : la barre d'un jour ne mesure que quelques pixels (cible de toucher bien sous les 44 × 24 px) ; et le nom posé à côté de la
 * barre ne recevait aucun geste (`pointer-events: none` : le doigt traversait).
 * Remède : une zone élargie INVISIBLE (`ZoneToucher`, enfant de la barre : ses gestes remontent à la barre, le dessin ne change pas) et le
 * toucher du nom (`useToucherNom`) : un appui bref sans mouvement sur le nom ouvre la fiche de sa chose, comme la barre. Le nom ne glisse pas
 * et n'ouvre pas de menu ; un bouton du nom (la pastille « lié à ») garde son propre geste.
 */
export const ZONE_TOUCHER_LARGEUR_PX = 44;
export const ZONE_TOUCHER_HAUTEUR_PX = 24;

/** La zone de toucher élargie, centrée sur la boîte (`largeur` × `hauteur`) d'une barre dont la bordure gauche fait `bordGauche` px. */
export function zoneToucher(largeur: number, hauteur: number, bordGauche = 5, bordHaut = 1.5): React.CSSProperties | null {
  const L = Math.max(largeur, ZONE_TOUCHER_LARGEUR_PX), H = Math.max(hauteur, ZONE_TOUCHER_HAUTEUR_PX);
  if (L === largeur && H === hauteur) return null;
  return { left: (largeur - L) / 2 - bordGauche, top: (hauteur - H) / 2 - bordHaut, width: L, height: H };
}

/** Le toucher d'un nom posé à côté de sa chose : appui bref, sans mouvement, ailleurs que sur un bouton du nom. */
export function useToucherNom(onToucher: () => void) {
  const rappel = useRef(onToucher);
  rappel.current = onToucher;
  const depart = useRef<{ id: number; x: number; y: number; t: number } | null>(null);
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const cible = e.target instanceof Element ? e.target : null;
    if (e.button > 0 || cible?.closest('button, a, [role="button"]')) { depart.current = null; return; }
    depart.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now() };
  }, []);
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = depart.current;
    depart.current = null;
    if (!d || d.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > SEUIL_MOUVEMENT_PX || Date.now() - d.t >= APPUI_LONG_MS) return;
    rappel.current();
  }, []);
  const onPointerCancel = useCallback(() => { depart.current = null; }, []);
  const onContextMenu = useCallback((e: React.SyntheticEvent) => e.preventDefault(), []);
  return { onPointerDown, onPointerUp, onPointerCancel, onContextMenu };
}
