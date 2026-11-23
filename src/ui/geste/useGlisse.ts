import { useCallback, useEffect, useRef } from 'react';
import { aBouge, armerSens, vitesseBord } from './moteur';

/**
 * Le geste d'une frise ou d'un curseur, un seul pour toute l'app (Pointer Events W3C : doigt, souris, stylet ; `setPointerCapture`).
 * Il ne dessine rien et ne connaît pas la valeur : il appelle les rappels de l'écran.
 * - R1 : poser le doigt ne change rien ; `suivre` n'est appelé qu'après 6 px ; un toucher sans glisser ne change rien (le clic qui suit un
 *   glisser est avalé, celui d'un toucher passe).
 * - R2 : `suivre` reçoit le DÉPLACEMENT depuis la saisie, jamais la position absolue.
 * - R7 : doigt à moins de 40 px d'un bord du cadre ET allant vers lui : `bord` est appelé à chaque image avec le sens et la vitesse.
 * - R10 : lâcher = `lacher` ; pointercancel ou Échap = `annuler` (l'écran remet la valeur et l'échelle d'avant).
 * - R13 : capture du pointeur à la saisie ; `touch-action: none` reste au CSS de la seule frise.
 */
export interface RappelsGlisse<S> {
  /** Le doigt se pose en `x` (px depuis le bord gauche du cadre). Rend l'état de la saisie, ou `null` : pas pour nous. */
  saisir: (x: number, e: PointerEvent) => S | null;
  /** Après R1 : `dx` est le déplacement (px) depuis la saisie ; `x` la position courante dans le cadre. */
  suivre: (dx: number, s: S, x: number) => void;
  /** R7 : au bord, à chaque image ; `dt` en secondes. Après lui, `suivre` est rappelé avec le même `dx`. */
  bord?: (sens: -1 | 1, vitesse: number, dt: number, s: S) => void;
  lacher?: (s: S, bouge: boolean) => void;
  annuler?: (s: S) => void;
  /** L'élément dont les bords comptent pour R7 et pour `x` (par défaut l'élément tenu). */
  cadre?: () => HTMLElement | null;
}

export interface OptionsGlisse {
  /** Curseur natif (`<input type="range">`) : empêche son propre geste (saut à la position touchée) au doigt et à la souris. */
  natif?: boolean;
}

interface Saisie<S> { id: number; x0: number; x: number; bouge: boolean; arme: number; pivot: number; s: S; raf: number; t: number }

/** Branche le geste sur `el` ; rend la fonction qui le retire. `r()` rend les rappels du moment (les props les plus récentes). */
export function attacherGlisse<S>(el: HTMLElement, r: () => RappelsGlisse<S>, o: OptionsGlisse = {}): () => void {
  let g: Saisie<S> | null = null;
  let avaler = false;
  const cadre = () => r().cadre?.() ?? el;
  const xDe = (e: PointerEvent) => e.clientX - cadre().getBoundingClientRect().left;

  const arreterBord = () => { if (g?.raf) cancelAnimationFrame(g.raf); if (g) { g.raf = 0; g.t = 0; } };
  const image = (t: number) => {
    if (!g) return;
    g.raf = 0;
    const rp = r(); if (!rp.bord) return;
    const { sens, vitesse } = vitesseBord(g.x, cadre().getBoundingClientRect().width, g.arme);
    if (!sens) { g.t = 0; return; }
    const dt = g.t ? Math.min(0.05, (t - g.t) / 1000) : 0; g.t = t;
    if (dt > 0) { rp.bord(sens, vitesse, dt, g.s); rp.suivre(g.x - g.x0, g.s, g.x); }
    g.raf = requestAnimationFrame(image);
  };
  const echap = (e: KeyboardEvent) => { if (e.key === 'Escape' && g) { e.preventDefault(); e.stopPropagation(); terminer(true); } };
  function terminer(annule: boolean) {
    const gg = g; if (!gg) return;
    arreterBord(); g = null;
    window.removeEventListener('keydown', echap, true);
    try { if (el.hasPointerCapture?.(gg.id)) el.releasePointerCapture(gg.id); } catch { /* déjà relâché */ }
    if (annule) r().annuler?.(gg.s); else { avaler = gg.bouge; r().lacher?.(gg.s, gg.bouge); }
  }

  const bas = (e: PointerEvent) => {
    if (e.button > 0 || g) return;
    const x = xDe(e), s = r().saisir(x, e);
    if (s == null) return;
    if (o.natif) e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch { /* pointeur synthétique */ }
    g = { id: e.pointerId, x0: x, x, bouge: false, arme: 0, pivot: x, s, raf: 0, t: 0 };
    avaler = false;
    window.addEventListener('keydown', echap, true);
    if (o.natif) el.focus({ preventScroll: true });
  };
  const bouge = (e: PointerEvent) => {
    if (!g || e.pointerId !== g.id) return;
    const x = xDe(e); g.x = x;
    if (!g.bouge) { if (!aBouge(x - g.x0)) return; g.bouge = true; }
    // T9-1 : le tremblement d'un doigt tenu (±1 px) ne retourne pas le sens (hystérésis de 6 px, armerSens)
    const a = armerSens(g.arme, g.pivot, x); g.arme = a.arme; g.pivot = a.pivot;
    r().suivre(x - g.x0, g.s, x);
    if (r().bord && !g.raf && vitesseBord(x, cadre().getBoundingClientRect().width, g.arme).sens) g.raf = requestAnimationFrame(image);
  };
  const haut = (e: PointerEvent) => { if (g && e.pointerId === g.id) terminer(false); };
  const annule = (e: PointerEvent) => { if (g && e.pointerId === g.id) terminer(true); };
  const clic = (e: MouseEvent) => { if (avaler) { avaler = false; e.preventDefault(); e.stopPropagation(); } };
  // Curseur natif : son geste propre saute à la position touchée (contraire à R1 et R2) ; on le coupe, le nôtre le remplace.
  const natifTouche = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
  const natifSouris = (e: MouseEvent) => { if (e.button === 0) e.preventDefault(); };

  el.addEventListener('pointerdown', bas);
  el.addEventListener('pointermove', bouge);
  el.addEventListener('pointerup', haut);
  el.addEventListener('pointercancel', annule);
  el.addEventListener('lostpointercapture', haut);
  el.addEventListener('click', clic, true);
  if (o.natif) { el.addEventListener('touchstart', natifTouche, { passive: false }); el.addEventListener('mousedown', natifSouris); }
  return () => {
    if (g) terminer(true);
    el.removeEventListener('pointerdown', bas);
    el.removeEventListener('pointermove', bouge);
    el.removeEventListener('pointerup', haut);
    el.removeEventListener('pointercancel', annule);
    el.removeEventListener('lostpointercapture', haut);
    el.removeEventListener('click', clic, true);
    if (o.natif) { el.removeEventListener('touchstart', natifTouche); el.removeEventListener('mousedown', natifSouris); }
  };
}

/** Le geste en React : rend la `ref` à poser sur l'élément tenu. Les rappels sont relus à chaque geste (jamais périmés). */
export function useGlisse<S, E extends HTMLElement = HTMLElement>(rappels: RappelsGlisse<S>, o: OptionsGlisse = {}): (el: E | null) => void {
  const courant = useRef(rappels);
  courant.current = rappels;
  const retirer = useRef<(() => void) | null>(null);
  const natif = !!o.natif;
  useEffect(() => () => { retirer.current?.(); retirer.current = null; }, []);
  return useCallback((el: E | null) => {
    retirer.current?.(); retirer.current = null;
    if (el) retirer.current = attacherGlisse(el, () => courant.current, { natif });
  }, [natif]);
}
