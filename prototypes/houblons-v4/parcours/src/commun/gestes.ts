// Gestes du téléphone : appui long (ouvre la fiche), sans bloquer le toucher court.
import { useCallback, useRef } from 'react';

export const DUREE_APPUI_LONG = 450;

/** Props à étaler sur l'élément : appui long → onLong ; toucher court → onCourt (facultatif). Un glissement de
 * plus de 10 px annule (le doigt défile). Le menu contextuel du navigateur est retenu. */
export function useAppuiLong(onLong: () => void, onCourt?: () => void) {
  const minuterie = useRef<number | null>(null);
  const depart = useRef<{ x: number; y: number } | null>(null);
  const long = useRef(false);
  const annuler = () => { if (minuterie.current != null) window.clearTimeout(minuterie.current); minuterie.current = null; };
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    long.current = false;
    depart.current = { x: e.clientX, y: e.clientY };
    annuler();
    minuterie.current = window.setTimeout(() => { long.current = true; minuterie.current = null; onLong(); }, DUREE_APPUI_LONG);
  }, [onLong]);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (depart.current && Math.hypot(e.clientX - depart.current.x, e.clientY - depart.current.y) > 10) annuler();
  }, []);
  const onPointerUp = useCallback(() => { annuler(); depart.current = null; }, []);
  const onClick = useCallback((e: React.MouseEvent) => {
    if (long.current) { e.preventDefault(); long.current = false; return; }
    onCourt?.();
  }, [onCourt]);
  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onPointerLeave: onPointerUp, onClick, onContextMenu: (e: React.MouseEvent) => e.preventDefault(), 'data-appui-long': '' };
}
