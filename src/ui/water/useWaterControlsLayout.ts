import { useLayoutEffect, useState, type RefObject } from 'react';
import type { RadarBoite } from '../WaterRadar';

/** Haut du « + » docké (40 px) dans la rangée « 1. Eau | 2. Sels » : centré dans sa hauteur, jamais au-dessus (EAU-3, 19.11). */
export function hautBoutonDocke(navTop: number, navHeight: number, bouton = 40): number {
  return navTop + Math.max(0, (navHeight - bouton) / 2);
}

/** Hauteur de toile au plus bas : sous ce plancher, les commandes défilent plutôt que d'écraser le disque. */
export const TOILE_MIN = 180;

/**
 * La boîte de la toile de pesée sur téléphone (EAU-SELS-UN-ECRAN, 22.11 : « maximiser la grandeur du spidergraph […] sur un
 * seul écran, sel, radargraph et acides »).
 *
 * Largeur : celle du panneau. Hauteur : la fenêtre, moins ce qui précède la toile et les commandes qui la suivent (rapport,
 * sels, acides). Le calcul ne dépend ni du défilement ni de la hauteur courante de la toile : il ne boucle pas, et une
 * dose qu'on saisit ne la redimensionne pas. Au-delà de 640 px (bureau), `null` : la géométrie d'origine.
 */
export function useWaterControlsLayout(ref: RefObject<HTMLDivElement | null>): RadarBoite | null {
  const [boite, setBoite] = useState<RadarBoite | null>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const measure = () => {
      const nav = root.closest('.water-workshop')?.querySelector('[data-water-navigation]');
      if (nav) {
        const r = nav.getBoundingClientRect();
        document.documentElement.style.setProperty('--water-navigation-top', `${hautBoutonDocke(r.top, r.height)}px`);
      }
      if (window.innerWidth >= 640) { setBoite(null); return; }
      const panel = root.querySelector<HTMLElement>('.water-radar-panel');
      const bloc = panel?.querySelector<HTMLElement>('.water-radar');
      if (!panel || !bloc || !root.offsetHeight) return;
      let scroller = root.parentElement;
      while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
      const cs = getComputedStyle(panel);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const box = root.getBoundingClientRect();
      // Tout ce qui n'est pas la toile : la rangée de cible, le cadre du panneau, le rapport, les sels, les acides.
      const controls = box.height - bloc.getBoundingClientRect().height;
      // La place se compte page au repos (défilement à 0) : le défilement ne redimensionne pas la toile.
      const top = box.top + (scroller?.scrollTop ?? window.scrollY);
      const bottom = Math.min(window.innerHeight, scroller?.getBoundingClientRect().bottom ?? window.innerHeight);
      const w = Math.floor(panel.clientWidth - padX);
      const h = Math.max(TOILE_MIN, Math.floor(bottom - top - controls - 6));
      setBoite((avant) => (avant && avant.w === w && avant.h === h ? avant : { w, h }));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    const main = root.closest('main');
    if (main) observer.observe(main);
    main?.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); main?.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); document.documentElement.style.removeProperty('--water-navigation-top'); };
  }, [ref]);
  return boite;
}
