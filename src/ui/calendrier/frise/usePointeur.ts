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
  /** D385 : la largeur d'un jour, pour tirer le bord (une colonne d'un jour : la colonne). Absente : 1/7 de colonne (une semaine). */
  largeurJour?: number;
  /** Plage de pas permise pour le glisser (par exemple `[-ia, nc - 1 - ia]`). */
  borne?: () => [number, number];
  /** Une chose qui ne se déplace pas : le glisser est refusé avec sa raison (la barre ne bouge pas). */
  refuseGlisse?: (cible: Element | null) => string | null;
  /** CAL-POINTS-MUETS : `cible`, l'élément sous le doigt (un point d'étape d'un brassin se lit au toucher). */
  onToucher?: (cible: Element | null) => void;
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
  /**
   * CRITIQUE-9 doute f2-a : la zone de prise du bord droit, en px de part et d'autre du bord (0 : pas de bord). Un doigt posé à 10 px du bord
   * d'une rangée de 18 px (paysage) tire le bord, au lieu de déplacer la barre ; jamais plus d'un tiers de la barre, dont le corps se glisse.
   */
  zoneBord?: number;
}

/** Le doigt est-il sur la zone du bord droit de `el` ? Lu sur la boîte de la barre (une boîte vide, jsdom : non). */
export function surLeBord(el: Element, x: number, zone: number): boolean {
  if (!zone) return false;
  const r = el.getBoundingClientRect();
  if (!(r.width > 0)) return false;
  return x >= r.right - Math.min(zone, r.width / 3) && x <= r.right + zone;
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

/*
 * CRITIQUE-11 n° 2 a (E29 « tirer le bord l'allonge et rien d'autre », E22 « l'œil ne masque que sur un toucher voulu »). En 6 mois à 390, une
 * colonne fait 14 px : un f2-a ou un f1-a d'une colonne reste sous la tolérance d'un toucher, et Chrome émet un `click` au lâcher. Si un
 * message a poussé les rangées entre-temps, ce clic tombe ailleurs (l'œil de Brassins) : hors de la barre, donc une garde posée sur elle ne
 * le voit pas. La garde vit au niveau du document, en phase de capture :
 *  - à la fin de tout glissé de la frise (barre, bord, jalon, marque) et d'un appui long, `poserGardeClic` note l'heure ;
 *  - le `click` d'un pointeur (`detail > 0` ; un clic au clavier vaut 0 et passe toujours) qui suit est arrêté, pendant 300 ms ou jusqu'au
 *    prochain `pointerdown` (un nouveau toucher, voulu, n'est jamais avalé) ;
 *  - `appuiCommenceSur(el)` dit si le dernier `pointerdown` a commencé sur `el` (la garde propre de l'œil, Rangee).
 * Une seule paire d'écouteurs pour toute la page, posée au premier geste de la frise.
 */
export const GARDE_CLIC_MS = 300;
let gardeDepuis = 0;
let dernierAppui: EventTarget | null = null;
let gardeInstallee = false;

function installerGarde(): void {
  if (gardeInstallee || typeof document === 'undefined') return;
  gardeInstallee = true;
  document.addEventListener('pointerdown', e => { gardeDepuis = 0; dernierAppui = e.target; }, true);
  document.addEventListener('click', e => {
    if (!gardeDepuis) return;
    const recent = Date.now() - gardeDepuis < GARDE_CLIC_MS;
    if (recent && e.detail > 0) { gardeDepuis = 0; e.preventDefault(); e.stopPropagation(); }
    else if (!recent) gardeDepuis = 0;
  }, true);
}

/** La fin d'un glissé : le clic de pointeur qui suit, dans 300 ms et avant un nouvel appui, n'agit nulle part. */
export function poserGardeClic(): void {
  installerGarde();
  gardeDepuis = Date.now();
}

/**
 * Le dernier appui du doigt a-t-il commencé sur `el` ? Vrai si aucun appui n'a encore été vu (clavier, première visite) : l'inconnu ne
 * bloque pas un geste voulu.
 */
export function appuiCommenceSur(el: Element | null): boolean {
  if (!gardeInstallee || !dernierAppui) return true;
  return !!el && dernierAppui instanceof Node && el.contains(dernierAppui);
}

/*
 * D385 (pincer, variante B) : au deuxième doigt posé sur la frise, le geste en cours d'une barre (appui, appui long à venir, glisser, bord)
 * est annulé : la barre revient, rien n'est écrit. Chaque geste en cours s'inscrit ici et se retire à sa fin.
 */
const gestesEnCours = new Set<() => void>();
export function annulerGestesFrise(): void {
  [...gestesEnCours].forEach(annuler => annuler());
  gestesEnCours.clear();
}

export function usePointeur(options: OptionsPointeur) {
  const opts = useRef(options);
  opts.current = options;
  const etat = useRef<Etat | null>(null);
  /** Le geste en cours inscrit pour l'annulation au pincement (D385) ; retiré à sa fin. */
  const inscrit = useRef<(() => void) | null>(null);
  useEffect(() => { installerGarde(); }, []);

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
    const bord = (e.target as HTMLElement | null)?.closest?.('[data-bord]') || surLeBord(e.currentTarget, e.clientX, opts.current.zoneBord ?? 0);
    const s: Etat = { id: e.pointerId, cible: e.target instanceof Element ? e.target : null, x0: e.clientX, y0: e.clientY, t0: Date.now(), mode: bord ? 'bord' : 'appui', k: 0, minuterie: null };
    etat.current = s;
    const annuler = () => {
      if (etat.current !== s) return;
      if (s.minuterie) { clearTimeout(s.minuterie); s.minuterie = null; }
      etat.current = null;
      if (s.mode === 'glisse') opts.current.onLacheGlisse?.(s.k, true);
      else if (s.mode === 'bord') opts.current.onLacheBord?.(s.k, true);
    };
    if (inscrit.current) gestesEnCours.delete(inscrit.current);
    inscrit.current = annuler;
    gestesEnCours.add(annuler);
    if (bord) {
      e.stopPropagation();
      capturer(e.currentTarget, e.pointerId);
      opts.current.onDebutBord?.();
      return;
    }
    /* paquet E n° 1 (PC-136, « la vente reste au 7 déc. ») : un doigt est capturé d'office par le navigateur (capture implicite des
       Pointer Events), une souris ou un stylet non. Une marque fait 28 px : le premier mouvement d'un glisser rapide sortait de la marque,
       le `pointermove` tombait sur la piste, et le glisser n'était jamais lu. On capture donc dès l'appui, comme le doigt. */
    if (e.pointerType !== 'touch') capturer(e.currentTarget, e.pointerId);
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
      s.k = Math.round(dx / (o.largeurJour && o.largeurJour > 0 ? o.largeurJour : o.largeurColonne / 7));
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
    if (inscrit.current) { gestesEnCours.delete(inscrit.current); inscrit.current = null; }
    const o = opts.current;
    if (s.mode === 'long' || s.mode === 'glisse' || s.mode === 'bord') { avalerClic.current = Date.now(); poserGardeClic(); }
    if (s.mode === 'glisse') o.onLacheGlisse?.(s.k, annule);
    else if (s.mode === 'bord') o.onLacheBord?.(s.k, annule);
    else if (s.mode === 'appui' && !annule && Date.now() - s.t0 < APPUI_LONG_MS) o.onToucher?.(s.cible);
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
