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

/**
 * CAL-PASSE voie S, R2-1 (21.11, BLOQUANT : à 390 en 3 mois, un doigt posé au MILIEU de Hefe, barre de 24 à 52 px, tirait sa fin au lieu de la déplacer :
 * « prête le 6 nov. » → « prête le 1 nov. », une date fausse écrite par un geste qui voulait déplacer). Cause : les zones de prise du bord (la poignée
 * `.cal-grip` : 17 px dedans, le jalon de fin : 29 px dedans) étaient de taille fixe, et mangeaient toute la barre quand elle est courte.
 * Méthode standard (cibles de bord d'un élément redimensionnable, p. ex. les fenêtres et les plages d'un agenda) : la zone du bord ne prend jamais plus du
 * tiers de l'élément ; le reste de sa prise est dehors ; le corps garde le déplacement (le centre est à la barre). Même règle que `surLeBord` (usePointeur).
 * `dedans` : jusqu'où la poignée mord dans la barre (px depuis son bord droit). `jalonSup` : ce que la zone du jalon de fin ajoute à gauche de l'icône
 * (14 px). `jalonMuet` : l'icône de fin (14 px) dépasse déjà le tiers de la barre : elle ne reçoit plus aucun geste, la poignée et sa zone dehors restent.
 */
export const PRISE_BORD_DEDANS_PX = 17;
export const PRISE_JALON_SUP_PX = 15;
export const ICONE_JALON_PX = 14;
export function prisesDuBord(largeur: number): { dedans: number; jalonSup: number; jalonMuet: boolean } {
  const tiers = Math.max(0, largeur) / 3;
  return {
    dedans: Math.min(PRISE_BORD_DEDANS_PX, tiers),
    jalonSup: Math.max(0, Math.min(PRISE_JALON_SUP_PX, tiers - ICONE_JALON_PX)),
    jalonMuet: tiers < ICONE_JALON_PX,
  };
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
