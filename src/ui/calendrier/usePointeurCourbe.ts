import { useMemo, useRef, useState } from 'react';

/**
 * Le doigt sur la courbe (E11 c2-b, E12 c3-a) : Pointer Events natifs, une machine à états explicite (MISSION § État de l'art).
 *
 *   repos ──pointerdown──▶ appui ──500 ms sans bouger──▶ long   (appui long : la courbe en grand)
 *                            └──glisse de plus de 8 px, plutôt à l'horizontale──▶ lit   (lecture de la semaine sous le doigt)
 *                            └──glisse à la verticale──▶ repos   (le défilement reste natif : `touch-action: pan-y` sur la courbe)
 *
 * Les mouvements suivants sont écoutés sur `window` : quand l'appui long remplace la petite courbe par la grande, le doigt qui continue
 * de lire ne perd pas son geste (le nœud d'origine a disparu). `indexSous` est relu à chaque événement : il suit la courbe affichée.
 */
export type ModeGeste = 'repos' | 'appui' | 'lit' | 'long';

export interface OptionsPointeurCourbe {
  /** La semaine (index dans la courbe) sous l'abscisse écran donnée. */
  indexSous: (clientX: number) => number;
  /** Le doigt lit cette semaine (en glissant, ou après un appui long). */
  onLire: (index: number, mode: 'lit' | 'long') => void;
  /** L'appui long a pris : la courbe passe en grand. */
  onAppuiLong: (index: number) => void;
  actif?: boolean;
  /** Durée de l'appui long, en ms (500 par défaut, convention Android et iOS). */
  delaiMs?: number;
  /** Mouvement au-delà duquel l'appui long est annulé, en px (8 par défaut). */
  seuilPx?: number;
}

export const DELAI_APPUI_LONG = 500;
export const SEUIL_MOUVEMENT = 8;

export function usePointeurCourbe(options: OptionsPointeurCourbe) {
  const opts = useRef(options);
  opts.current = options;
  const [mode, setMode] = useState<ModeGeste>('repos');

  const props = useMemo(() => ({
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    onPointerDown: (e: { button: number; pointerId: number; clientX: number; clientY: number }) => {
      const o0 = opts.current;
      if (e.button > 0 || o0.actif === false) return;
      const id = e.pointerId, x0 = e.clientX, y0 = e.clientY;
      let etat: ModeGeste = 'appui';
      setMode('appui');
      const minuterie = setTimeout(() => {
        if (etat !== 'appui') return;
        etat = 'long';
        setMode('long');
        opts.current.onAppuiLong(opts.current.indexSous(x0));
      }, o0.delaiMs ?? DELAI_APPUI_LONG);
      const nettoie = () => { clearTimeout(minuterie); window.removeEventListener('pointermove', suit); window.removeEventListener('pointerup', leve); window.removeEventListener('pointercancel', leve); };
      const suit = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        const o = opts.current;
        if (etat === 'appui') {
          const dx = ev.clientX - x0, dy = ev.clientY - y0;
          if (Math.hypot(dx, dy) <= (o.seuilPx ?? SEUIL_MOUVEMENT)) return;
          clearTimeout(minuterie);
          if (Math.abs(dy) > Math.abs(dx)) { etat = 'repos'; nettoie(); setMode('repos'); return; }
          etat = 'lit';
          setMode('lit');
        }
        if (etat === 'lit' || etat === 'long') o.onLire(o.indexSous(ev.clientX), etat);
      };
      const leve = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        nettoie();
        // La lecture reste affichée après le doigt levé (comme le jouable) : seul un toucher ailleurs ou × la ferme.
        setMode('repos');
      };
      window.addEventListener('pointermove', suit);
      window.addEventListener('pointerup', leve);
      window.addEventListener('pointercancel', leve);
    }
  }), []);

  return { mode, props };
}
