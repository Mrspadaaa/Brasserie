import { useEffect, useRef } from 'react';
import { sensPincement, type SensPincement } from '../echelle';
import { annulerGestesFrise } from './usePointeur';

/**
 * Pincer pour zoomer (D385, variante B) : deux doigts écartés sur la frise passent en jours, pincés en mois. Pointer Events natifs (méthode
 * standard : table des pointeurs actifs, rapport des distances, seuil ; Hammer.js, @use-gesture), sans dépendance.
 *
 * Il ne vole aucun geste : un doigt seul n'est jamais lu comme un pincement (glisser, appui long, bord, toucher restent à `usePointeur`). Au
 * deuxième doigt, le geste en cours d'une barre est annulé (`annulerGestesFrise` : la barre revient, rien n'est écrit) et ce doigt ne
 * commence aucun geste de barre (arrêté à la capture, avant React). Un cran par geste ; le pincement se lit jusqu'au lever des doigts.
 * Pendant le pincement, le défilement de la page est retenu (`touchmove` à deux doigts) ; la frise porte `touch-action: pan-y`.
 */
export function usePincement(ref: React.RefObject<HTMLElement | null>, onPincer: ((sens: SensPincement, xClient: number) => void) | undefined): void {
  const rappel = useRef(onPincer);
  rappel.current = onPincer;
  const actif = !!onPincer;
  useEffect(() => {
    const el = ref.current;
    if (!el || !actif) return undefined;
    const pts = new Map<number, { x: number; y: number }>();
    let depart = 0;
    let fait = false;
    const deux = () => [...pts.values()].slice(0, 2);
    const distance = () => { const [a, b] = deux(); return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; };
    const bas = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { depart = distance(); fait = false; annulerGestesFrise(); }
      if (pts.size >= 2) e.stopPropagation();
    };
    const bouge = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size !== 2 || fait) return;
      const sens = sensPincement(depart, distance());
      if (!sens) return;
      fait = true;
      const [a, b] = deux();
      rappel.current?.(sens, (a.x + b.x) / 2);
    };
    const leve = (e: PointerEvent) => {
      if (!pts.delete(e.pointerId)) return;
      if (pts.size < 2) depart = 0;
      if (pts.size === 0) fait = false;
    };
    const retient = (e: TouchEvent) => { if (e.touches.length >= 2 && e.cancelable) e.preventDefault(); };
    el.addEventListener('pointerdown', bas, true);
    window.addEventListener('pointermove', bouge, true);
    window.addEventListener('pointerup', leve, true);
    window.addEventListener('pointercancel', leve, true);
    el.addEventListener('touchmove', retient, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', bas, true);
      window.removeEventListener('pointermove', bouge, true);
      window.removeEventListener('pointerup', leve, true);
      window.removeEventListener('pointercancel', leve, true);
      el.removeEventListener('touchmove', retient);
    };
  }, [ref, actif]);
}
