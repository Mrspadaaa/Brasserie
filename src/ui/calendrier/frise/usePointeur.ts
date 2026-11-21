import { useCallback, useEffect, useRef } from 'react';
import { avalerClicSuivant, DELAI_CLIC_AVALE } from '../usePointeurCourbe';
import { aBouge, BANDE_PX, vitesseBord } from '../../geste';
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
  /** CAL-JOUR (21.11) : le glisser se lit au jour, `k` compte des semaines par septièmes (3 jours : 3/7) ; lu à l'appui. Absent : à la semaine. */
  parJour?: boolean;
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
  /**
   * CAL-PASSE N1 n° 1 (20.11, « impossible de modifier dans le passé ») : la méthode standard du glisser-déposer dans une zone qui défile, le
   * défilement automatique au bord. Un doigt qui tient une barre près du bord de la frise, en allant vers lui, décale la fenêtre d'une colonne à
   * chaque pas (`defile(-1)` : vers le passé, `defile(1)` : vers le futur ; elle rend `false` quand la fenêtre ne peut plus aller de ce côté) ; la
   * barre reste sous le doigt et la cible lue est celle de la colonne sous le doigt.
   */
  defile?: (sens: -1 | 1) => boolean;
  /**
   * Les colonnes hors de la fenêtre où la barre peut encore se poser (`[avant, après]`) : un glisser de 4 semaines vers la gauche d'une barre au
   * bord gauche de la fenêtre vise la semaine d'avant, même si la fenêtre ne l'affiche pas (le fantôme et la bulle disent la date).
   */
  marge?: [number, number];
}

/**
 * Frise B, R7 (le brasseur, 21.11 : « la fize au doigt n'est pas porté ??? ») : la bande du bord est celle du module `geste` (40 px) ; le doigt
 * doit aller VERS le bord (sens de son dernier mouvement) ; la vitesse croît avec la profondeur, de 0,15 à 1,35 largeur de frise par seconde,
 * comptée ici en colonnes (une colonne de plus chaque fois que la distance parcourue en fait une).
 */
export const ZONE_DEFILE_PX = BANDE_PX;

/** Le sens où le doigt tire la fenêtre : `-1` bord gauche (le passé), `1` bord droit (le futur), `0` ailleurs. `arme` : sens du dernier mouvement. */
export function sensDefilement(x: number, arme: number, cadre: { left: number; right: number }): -1 | 0 | 1 {
  return vitesseBord(x - cadre.left, cadre.right - cadre.left, arme).sens;
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
  /** Le déplacement du doigt depuis l'appui, et le nombre de colonnes dont la fenêtre a reculé (>0) ou avancé (<0) depuis le début du geste. */
  dx: number;
  recul: number;
  /** CAL-JOUR : le pas du glisser est un jour (1/7 de colonne), figé à l'appui. */
  parJour: boolean;
  /** R1 : le bord ne suit qu'après 6 px. */
  bouge: boolean;
  /** R7 : sens du dernier mouvement (−1, 0, 1), dernière abscisse, colonnes accumulées, image en cours et son heure. */
  arme: number;
  xPrec: number;
  acc: number;
  raf: number;
  tPrec: number;
  /** R10 : l'écouteur d'Échap pendant le glisser. */
  echap: ((e: KeyboardEvent) => void) | null;
}

const bornes = (k: number, b?: [number, number]) => (b ? Math.max(b[0], Math.min(b[1], k)) : k);
/** La plage de pas permise, élargie des colonnes hors fenêtre (`marge`). */
const plage = (b: [number, number] | undefined, marge: [number, number] | undefined): [number, number] | undefined => (b ? [b[0] - (marge?.[0] ?? 0), b[1] + (marge?.[1] ?? 0)] : undefined);

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

  const stopDefile = (e: Etat | null) => {
    if (e?.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(e.raf);
    if (e) { e.raf = 0; e.tPrec = 0; e.acc = 0; }
    if (e?.echap) { window.removeEventListener('keydown', e.echap, true); e.echap = null; }
  };
  const stopMinuterie = () => {
    const e = etat.current;
    if (e?.minuterie) { clearTimeout(e.minuterie); e.minuterie = null; }
  };
  useEffect(() => () => { stopMinuterie(); stopDefile(etat.current); etat.current = null; }, []);
  /* la cible lue : le pas du doigt, moins les colonnes dont la fenêtre a bougé sous lui (la colonne sous le doigt est celle de la fenêtre d'ORIGINE moins le recul) */
  const pasDe = (s: Etat): number => {
    const w = opts.current.largeurColonne || 1;
    /* CAL-JOUR : au jour, le pas est 1/7 de colonne ; `k` reste en semaines (3 jours = 3/7), la barre et sa bulle se posent sans autre calcul */
    const brut = s.parJour ? Math.round((s.dx * 7) / w) / 7 : Math.round(s.dx / w);
    return bornes(brut - s.recul, plage(opts.current.borne?.(), opts.current.marge));
  };
  /* après chaque rendu de la barre (la fenêtre a pu bouger sous le doigt) : le pas est relu, la bulle et le fantôme suivent */
  useEffect(() => {
    const s = etat.current;
    if (!s || s.mode !== 'glisse' || !(opts.current.largeurColonne > 0)) return;
    const k = pasDe(s);
    if (k !== s.k) { s.k = k; opts.current.onGlisse?.(k, s.dx); }
  });

  const capturer = (cible: Element, id: number) => {
    try { (cible as HTMLElement).setPointerCapture?.(id); } catch { /* jsdom, ou pointeur déjà relâché */ }
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button > 0) return;
    stopMinuterie();
    const bord = (e.target as HTMLElement | null)?.closest?.('[data-bord]') || surLeBord(e.currentTarget, e.clientX, opts.current.zoneBord ?? 0);
    const s: Etat = { id: e.pointerId, cible: e.target instanceof Element ? e.target : null, x0: e.clientX, y0: e.clientY, t0: Date.now(), mode: bord ? 'bord' : 'appui', k: 0, minuterie: null, dx: 0, recul: 0, parJour: !!opts.current.parJour,
      bouge: false, arme: 0, xPrec: e.clientX, acc: 0, raf: 0, tPrec: 0, echap: null };
    etat.current = s;
    const annuler = () => {
      if (etat.current !== s) return;
      if (s.minuterie) { clearTimeout(s.minuterie); s.minuterie = null; }
      stopDefile(s);
      etat.current = null;
      if (s.mode === 'glisse' || s.mode === 'bord') { avalerClic.current = Date.now(); poserGardeClic(); }
      if (s.mode === 'glisse') opts.current.onLacheGlisse?.(s.k, true);
      else if (s.mode === 'bord') opts.current.onLacheBord?.(s.k, true);
    };
    /* Frise B, R10 : Échap pendant un glisser ou un bord tiré rend la barre d'avant, exactement (rien n'est écrit) */
    s.echap = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape' || etat.current !== s || (s.mode !== 'glisse' && s.mode !== 'bord')) return;
      ev.preventDefault(); ev.stopPropagation();
      if (inscrit.current) { gestesEnCours.delete(inscrit.current); inscrit.current = null; }
      annuler();
    };
    window.addEventListener('keydown', s.echap, true);
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

  /*
   * Frise B, R7 : le défilement automatique. Doigt à moins de 40 px d'un bord de la frise, en allant vers lui : la fenêtre avance d'autant de
   * colonnes que la vitesse en parcourt (0,15 à 1,35 largeur de frise par seconde selon la profondeur), à chaque image, tant que la barre reste
   * dans la fenêtre. Arrêt dès que le doigt sort de la bande ou repart (`arme` change de sens).
   */
  const cadreDe = (el: Element) => {
    const cadre = el.closest('[data-frise]')?.getBoundingClientRect();
    const vue = typeof window !== 'undefined' ? window.innerWidth : 0;
    return { left: Math.max(0, cadre?.left ?? 0), right: Math.min(vue || Infinity, cadre && cadre.width > 0 ? cadre.right : Infinity) };
  };
  const majDefile = (s: Etat, x: number, el: HTMLElement) => {
    if (!opts.current.defile || s.raf || typeof requestAnimationFrame !== 'function') return;
    if (!sensDefilement(x, s.arme, cadreDe(el))) return;
    const image = (t: number) => {
      s.raf = 0;
      if (etat.current !== s || s.mode !== 'glisse') return;
      const c = cadreDe(el), largeur = c.right - c.left;
      const { sens, vitesse } = vitesseBord(s.xPrec - c.left, largeur, s.arme);
      if (!sens || !Number.isFinite(largeur)) { s.tPrec = 0; s.acc = 0; return; }
      const dt = s.tPrec ? Math.min(0.05, (t - s.tPrec) / 1000) : 0;
      s.tPrec = t;
      const oo = opts.current;
      s.acc += (vitesse * dt * largeur) / Math.max(1, oo.largeurColonne);
      while (s.acc >= 1) {
        s.acc -= 1;
        const dansLaVue = oo.borne?.();
        /* la barre sortirait de la fenêtre : on attend (jamais une barre tenue qui disparaît sous le doigt) */
        if (dansLaVue && (sens < 0 ? dansLaVue[1] < 1 : dansLaVue[0] > -1)) break;
        if (!oo.defile?.(sens)) { s.acc = 0; break; }
        s.recul += sens < 0 ? 1 : -1;
      }
      s.raf = requestAnimationFrame(image);
    };
    s.raf = requestAnimationFrame(image);
  };

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const s = etat.current;
    if (!s || e.pointerId !== s.id) return;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    const o = opts.current;
    /* f1-a au vrai toucher (CRITIQUE-2 n° 1) : un doigt qui a tenu 500 ms puis part de côté glisse quand même ; le menu ouvert se ferme
       (`onDebutGlisse` ou le premier `onGlisse` le dit à l'appelant). Au-delà de 8 px avant 500 ms, c'est un glisser et le menu ne s'ouvre pas. */
    // R7 : le sens du dernier mouvement arme le défilement au bord
    const pas = e.clientX - s.xPrec;
    s.xPrec = e.clientX;
    if (pas < -0.5) s.arme = -1; else if (pas > 0.5) s.arme = 1;
    if (s.mode === 'appui' || s.mode === 'long') {
      if (s.mode === 'appui' && Math.abs(dy) > SEUIL_VERTICAL_PX && Math.abs(dy) > Math.abs(dx)) { stopMinuterie(); stopDefile(s); etat.current = null; return; }
      // Frise B, R1 : la barre ne part qu'après 6 px de déplacement horizontal
      if (aBouge(dx)) {
        stopMinuterie();
        const raison = o.refuseGlisse?.(s.cible) ?? null;
        if (raison) { etat.current = null; o.onRefus?.(raison, s.cible); return; }
        s.mode = 'glisse';
        capturer(e.currentTarget, e.pointerId);
        o.onDebutGlisse?.();
      }
    }
    if (s.mode === 'glisse' && o.largeurColonne > 0) {
      s.dx = dx;
      s.k = pasDe(s);
      o.onGlisse?.(s.k, dx);
      majDefile(s, e.clientX, e.currentTarget);
    } else if (s.mode === 'bord' && o.largeurColonne > 0) {
      // Frise B, R1 : le bord ne suit qu'après 6 px (en 6 mois, un jour fait 2 px : un doigt qui tremble ne le déplace pas)
      if (!s.bouge && !aBouge(dx)) return;
      s.bouge = true;
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
    stopDefile(s);
    etat.current = null;
    if (inscrit.current) { gestesEnCours.delete(inscrit.current); inscrit.current = null; }
    const o = opts.current;
    if (s.mode === 'long' || s.mode === 'glisse' || s.mode === 'bord') { avalerClic.current = Date.now(); poserGardeClic(); }
    if (s.mode === 'glisse') o.onLacheGlisse?.(s.k, annule);
    else if (s.mode === 'bord') o.onLacheBord?.(s.k, annule);
    else if (s.mode === 'appui' && !annule && Date.now() - s.t0 < APPUI_LONG_MS) {
      /* TOUCHER-FANTOME (21.11, tour7 : toucher « La Cigogne, 3 fûts » a annulé la vente) : le toucher ouvre le détail au lâcher ; le `click`
         que le navigateur émet ensuite au même point tombait sur « Annuler la vente », apparu sous le doigt. Ce clic est avalé s'il tombe hors de
         la pièce touchée (la souris, dont le clic reste sur elle, et le clavier passent) ; un nouveau doigt posé lève la garde. */
      avalerClicSuivant(DELAI_CLIC_AVALE, e.currentTarget);
      o.onToucher?.(s.cible);
    }
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
