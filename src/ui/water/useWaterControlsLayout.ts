import { useLayoutEffect, type RefObject } from 'react';

/** Reserve the mobile viewport for the radar and the complete set of dosing controls. */
export function useWaterControlsLayout(ref: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const measure = () => {
      if (window.innerWidth >= 640) {
        root.style.removeProperty('--water-radar-max-height');
        return;
      }
      const svg = root.querySelector<SVGSVGElement>('svg[role="img"]');
      if (!svg || !root.offsetHeight) return;
      let scroller = root.parentElement;
      while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
      const box = root.getBoundingClientRect();
      const controls = box.height - svg.getBoundingClientRect().height;
      // Scroll position must not resize the graph while a dose is being entered.
      const top = box.top + (scroller?.scrollTop ?? window.scrollY);
      const bottom = Math.min(window.innerHeight, scroller?.getBoundingClientRect().bottom ?? window.innerHeight);
      const height = Math.max(160, Math.min(320, Math.floor(bottom - top - controls - 8)));
      const value = `${height}px`;
      if (root.style.getPropertyValue('--water-radar-max-height') !== value) root.style.setProperty('--water-radar-max-height', value);
      const nav = root.closest('.water-workshop')?.querySelector('[data-water-navigation]');
      if (nav) document.documentElement.style.setProperty('--water-navigation-top', `${nav.getBoundingClientRect().top + 6}px`);
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
}
