import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

/**
 * Les gestes d'une barre de la frise (MISSION § État de l'art : Pointer Events natifs, `setPointerCapture`, appui long = minuterie
 * de 500 ms annulée au-delà de 8 px, `touch-action: pan-y` pour laisser le défilement vertical au navigateur ; aucune dépendance).
 *
 * Machine à états explicite, tenue dans une référence (un geste ne rend rien tant qu'il n'a pas de conséquence) :
 *   repos → appui → glisser | tirer le bord | appui long → lâché ou annulé.
 * Le pas est la semaine : `k = round(dx / largeurColonne)`, borné par l'appelant (`borne`).
 * Un toucher (appui bref, sans mouvement) appelle `onToucher` ; un geste vertical rend la main au défilement.
 */

export const APPUI_LONG_MS = 500;
export const SEUIL_MOUVEMENT_PX = 8;
const SEUIL_VERTICAL_PX = 10;

export type ModeGeste = 'repos' | 'appui' | 'glisse' | 'bord' | 'long';

export interface OptionsPointeur {
  /** Largeur d'une colonne (une semaine) en px ; 0 ou inconnue : aucun glisser n'est lu (jamais un pas inventé). */
  largeurColonne: number;
  /** Plage de pas permise pour le glisser (par exemple `[-ia, nc - 1 - ia]`). */
  borne?: () => [number, number];
  /** Une chose qui ne se déplace pas : le glisser est refusé avec sa raison (la barre ne bouge pas). */
  refuseGlisse?: (cible: Element | null) => string | null;
  onToucher?: () => void;
  onAppuiLong?: () => void;
  onDebutGlisse?: () => void;
  onGlisse?: (k: number, dx: number) => void;
  /** Lâché : `k` pas, `annule` si le geste a été interrompu. */
  onLacheGlisse?: (k: number, annule: boolean) => void;
  onDebutBord?: () => void;
  onBord?: (k: number, dx: number) => void;
  onLacheBord?: (k: number, annule: boolean) => void;
  /** Le glisser est refusé : la raison, une fois. */
  onRefus?: (raison: string, cible: Element | null) => void;
}

interface Etat {
  id: number;
  cible: Element | null;
  x0: number;
  y0: number;
  t0: number;
  mode: ModeGeste;
  k: number;
  minuterie: ReturnType<typeof setTimeout> | null;
}

const bornes = (k: number, b?: [number, number]) => (b ? Math.max(b[0], Math.min(b[1], k)) : k);

export function usePointeur(options: OptionsPointeur) {
  const opts = useRef(options);
  opts.current = options;
  const etat = useRef<Etat | null>(null);

  const stopMinuterie = () => {
    const e = etat.current;
    if (e?.minuterie) { clearTimeout(e.minuterie); e.minuterie = null; }
  };
  useEffect(() => () => { stopMinuterie(); etat.current = null; }, []);

  const capturer = (cible: Element, id: number) => {
    try { (cible as HTMLElement).setPointerCapture?.(id); } catch { /* jsdom, ou pointeur déjà relâché */ }
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button > 0) return;
    stopMinuterie();
    const bord = (e.target as HTMLElement | null)?.closest?.('[data-bord]');
    const s: Etat = { id: e.pointerId, cible: e.target instanceof Element ? e.target : null, x0: e.clientX, y0: e.clientY, t0: Date.now(), mode: bord ? 'bord' : 'appui', k: 0, minuterie: null };
    etat.current = s;
    if (bord) {
      e.stopPropagation();
      capturer(e.currentTarget, e.pointerId);
      opts.current.onDebutBord?.();
      return;
    }
    s.minuterie = setTimeout(() => {
      s.minuterie = null;
      if (etat.current === s && s.mode === 'appui') { s.mode = 'long'; opts.current.onAppuiLong?.(); }
    }, APPUI_LONG_MS);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const s = etat.current;
    if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    const o = opts.current;
    /* f1-a au vrai toucher (CRITIQUE-2 n° 1) : un doigt qui a tenu 500 ms puis part de côté glisse quand même ; le menu ouvert se ferme
       (`onDebutGlisse` ou le premier `onGlisse` le dit à l'appelant). Au-delà de 8 px avant 500 ms, c'est un glisser et le menu ne s'ouvre pas. */
    if (s.mode === 'appui' || s.mode === 'long') {
      if (s.mode === 'appui' && Math.abs(dy) > SEUIL_VERTICAL_PX && Math.abs(dy) > Math.abs(dx)) { stopMinuterie(); etat.current = null; return; }
      if (Math.abs(dx) > SEUIL_MOUVEMENT_PX) {
        stopMinuterie();
        const raison = o.refuseGlisse?.(s.cible) ?? null;
        if (raison) { etat.current = null; o.onRefus?.(raison, s.cible); return; }
        s.mode = 'glisse';
        capturer(e.currentTarget, e.pointerId);
        o.onDebutGlisse?.();
      }
    }
    if (s.mode === 'glisse' && o.largeurColonne > 0) {
      s.k = bornes(Math.round(dx / o.largeurColonne), o.borne?.());
      o.onGlisse?.(s.k, dx);
    } else if (s.mode === 'bord' && o.largeurColonne > 0) {
      /* le bord se tire au jour : une semaine = 7 jours, le pas du bord est 1/7 de colonne (E29) */
      s.k = Math.round(dx / (o.largeurColonne / 7));
      o.onBord?.(s.k, dx);
    }
  }, []);

  /* CRITIQUE-3 n° 3 : le lâcher d'un appui long n'agit jamais. Le `click` que le navigateur émet après ce lâcher est avalé ici ; le menu,
     de son côté, n'exécute une action que sur un appui ET un lâcher faits dans le menu après son ouverture (MenuAppuiLong). */
  const avalerClic = useRef(0);
  const fin = useCallback((e: React.PointerEvent<HTMLElement>, annule: boolean) => {
    const s = etat.current;
    if (!s || e.pointerId !== s.id) return;
    stopMinuterie();
    etat.current = null;
    const o = opts.current;
    if (s.mode === 'long' || s.mode === 'glisse' || s.mode === 'bord') avalerClic.current = Date.now();
    if (s.mode === 'glisse') o.onLacheGlisse?.(s.k, annule);
    else if (s.mode === 'bord') o.onLacheBord?.(s.k, annule);
    else if (s.mode === 'appui' && !annule && Date.now() - s.t0 < APPUI_LONG_MS) o.onToucher?.();
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => fin(e, false), [fin]);
  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLElement>) => fin(e, true), [fin]);
  /* l'appui long ne doit pas ouvrir le menu du navigateur */
  const onContextMenu = useCallback((e: React.SyntheticEvent) => e.preventDefault(), []);
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (avalerClic.current && Date.now() - avalerClic.current < 800) { avalerClic.current = 0; e.preventDefault(); e.stopPropagation(); }
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onClickCapture };
}
