import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Le doigt sur la courbe (E11 c2-b, E12 c3-a) : Pointer Events natifs, une machine à états explicite (MISSION § État de l'art).
 *
 *   repos ──pointerdown──▶ appui ──500 ms sans bouger──▶ long   (appui long : la courbe en grand)
 *                            └──glisse de plus de 8 px, plutôt à l'horizontale──▶ lit   (lecture de la semaine sous le doigt)
 *                            └──glisse à la verticale──▶ repos   (le défilement reste natif : `touch-action: pan-y` sur la courbe)
 *
 * Les mouvements suivants sont écoutés sur `window` : quand l'appui long remplace la petite courbe par la grande, le doigt qui continue
 * de lire ne perd pas son geste (le nœud d'origine a disparu). `indexSous` est relu à chaque événement : il suit la courbe affichée.
 *
 * Le relâcher d'un appui long ou d'une lecture ne fait RIEN d'autre (CRITIQUE-4 n° 3) :
 * - le `click` que le navigateur fabrique après le doigt levé est avalé (capture sur `window`, une fois, 400 ms au plus, ou jusqu'au doigt suivant) : il tombait sur ce
 *   qui se trouvait sous le doigt après que la grande courbe eut pris la place, ou, par l'ajustement tactile, sur le bouton voisin (la période) ;
 * - pendant la lecture et après l'appui long, le défilement est bloqué (écouteur `touchmove` non passif posé sur la courbe dès son montage,
 *   seul moyen de rendre le `touchmove` annulable) : le doigt continue de lire, la page ne part pas et le pointeur n'est pas annulé ;
 * - le menu contextuel de l'appui long est empêché, sur la courbe et une fois sur la page.
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
/** Délai pendant lequel le `click` qui suit le doigt levé est avalé. */
export const DELAI_CLIC_AVALE = 400;

/**
 * Avale le prochain `click` (et le prochain `contextmenu`) de la page, une fois, pendant `ms`. Un nouveau doigt posé met fin à l'attente : le
 * clic fabriqué arrive toujours avant lui, et un vrai toucher qui suit n'est jamais perdu.
 *
 * `garder` : le clic qui tombe DANS ce nœud passe (le × de la grande courbe, le clic de la souris sur la courbe elle-même) ; seul celui que
 * l'ajustement tactile a rabattu HORS de lui (sur ±, la période, ⛶) est avalé (CRITIQUE-10 n° 6). Un clic du clavier (`detail` 0) passe.
 */
export function avalerClicSuivant(ms = DELAI_CLIC_AVALE, garder: Node | null = null): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const stop = (e: Event) => {
    // Avec `garder`, un clic sans pointeur (clavier, `el.click()` : `detail` 0) n'est jamais celui du toucher : il passe aussi.
    if (garder && ((e.target instanceof Node && garder.contains(e.target)) || (e as MouseEvent).detail === 0)) { fin(); return; }
    e.preventDefault(); e.stopPropagation(); fin();
  };
  const fin = () => {
    clearTimeout(t);
    window.removeEventListener('click', stop, true);
    window.removeEventListener('contextmenu', stop, true);
    window.removeEventListener('pointerdown', fin, true);
  };
  window.addEventListener('click', stop, true);
  window.addEventListener('contextmenu', stop, true);
  window.addEventListener('pointerdown', fin, true);
  const t = setTimeout(fin, ms);
  return fin;
}

/** Rien : sa seule présence fait de la courbe une cible du toucher pour l'ajustement tactile (voir `attacher`). */
const repondAuToucher = (): void => undefined;

export function usePointeurCourbe(options: OptionsPointeurCourbe) {
  const opts = useRef(options);
  opts.current = options;
  const [mode, setMode] = useState<ModeGeste>('repos');
  /** L'état du geste en cours, lu par l'écouteur `touchmove` posé sur la courbe. */
  const etatRef = useRef<ModeGeste>('repos');
  // L'écouteur `touchmove` non passif, posé sur chaque nœud de courbe monté (la petite, puis la grande) : il n'empêche le défilement que pendant
  // la lecture et l'appui long. Un nœud retiré du DOM garde son écouteur : le doigt qui a commencé sur la petite courbe y reste rattaché.
  const noeuds = useRef(new Set<HTMLElement>());
  /** Fin de l'attente du clic à avaler (rendue au démontage). */
  const finAvale = useRef<(() => void) | null>(null);
  const bloque = useCallback((ev: TouchEvent) => {
    if ((etatRef.current === 'lit' || etatRef.current === 'long') && ev.cancelable) ev.preventDefault();
  }, []);

  const props = useMemo(() => ({
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    onPointerDown: (e: { button: number; pointerId: number; clientX: number; clientY: number; currentTarget?: EventTarget | null }) => {
      const o0 = opts.current;
      if (e.button > 0 || o0.actif === false) return;
      // Un nouveau geste part d'un nœud monté : les nœuds retirés (une courbe remplacée) rendent leur écouteur.
      noeuds.current.forEach(el => { if (!el.isConnected) { el.removeEventListener('touchmove', bloque); noeuds.current.delete(el); } });
      const id = e.pointerId, x0 = e.clientX, y0 = e.clientY;
      const origine = typeof Node !== 'undefined' && e.currentTarget instanceof Node ? e.currentTarget : null;
      let etat: ModeGeste = 'appui';
      const poser = (m: ModeGeste) => { etat = m; etatRef.current = m; setMode(m); };
      poser('appui');
      const minuterie = setTimeout(() => {
        if (etat !== 'appui') return;
        poser('long');
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
          if (Math.abs(dy) > Math.abs(dx)) { nettoie(); poser('repos'); return; }
          poser('lit');
        }
        if (etat === 'lit' || etat === 'long') o.onLire(o.indexSous(ev.clientX), etat);
      };
      const leve = (ev: PointerEvent) => {
        if (ev.pointerId !== id) return;
        nettoie();
        // Après un appui long ou une lecture, le clic fabriqué au doigt levé n'ouvre rien (le menu de la période, n° 3).
        if (etat === 'long' || etat === 'lit') { finAvale.current?.(); finAvale.current = avalerClicSuivant(); }
        // Un toucher bref sur la courbe ne bascule jamais ± ni n'ouvre la période (CRITIQUE-10 n° 6, E11) : le clic que Chrome rabat sur le
        // bouton de tête voisin (ajustement tactile, jusqu'à 10 px sous les boutons à 390) est avalé ; celui qui reste dans la courbe passe.
        else if (etat === 'appui') { finAvale.current?.(); finAvale.current = avalerClicSuivant(DELAI_CLIC_AVALE, origine); }
        // La lecture reste affichée après le doigt levé (comme le jouable) : seul un toucher ailleurs ou × la ferme.
        poser('repos');
      };
      window.addEventListener('pointermove', suit);
      window.addEventListener('pointerup', leve);
      window.addEventListener('pointercancel', leve);
    }
  }), [bloque]);

  const attacher = useCallback((el: HTMLElement | null) => {
    if (!el || noeuds.current.has(el)) return;
    noeuds.current.add(el);
    el.addEventListener('touchmove', bloque, { passive: false });
    // La courbe répond elle-même au toucher (un écouteur `click` posé sur son nœud) : l'ajustement tactile de Chrome ne cherche une cible
    // voisine que si le nœud touché n'en est pas une ; il garde donc le toucher sur la courbe au lieu de le rabattre sur ± (CRITIQUE-10 n° 6).
    el.addEventListener('click', repondAuToucher);
  }, [bloque]);
  useEffect(() => {
    const ens = noeuds.current;
    // Démontée, la courbe n'avale plus rien.
    return () => { ens.forEach(el => { el.removeEventListener('touchmove', bloque); el.removeEventListener('click', repondAuToucher); }); ens.clear(); finAvale.current?.(); finAvale.current = null; };
  }, [bloque]);

  return { mode, props, attacher };
}
