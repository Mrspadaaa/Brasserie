import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { avalerClicSuivant, DELAI_CLIC_AVALE } from '../usePointeurCourbe';
import { aBouge, armerSens, BANDE_PX } from '../../geste';
import type React from 'react';
import { correctionAuBout, joursDuDoigt, joursJusquAuDoigt, pasDuDoigt, type AxeDoigt } from '../entete/alignement';
import type { Colonne } from './Rangee';
import { correctionPrise, priseDebut, priseDebutAvant, priseFin, priseFinAvant, vueEcran, type VueEcran } from './prisesBord';
import { COLONNES_MAX_PAR_S, DT_MAX_S, accelerationTenue, vitesseBordCalendrier, vitesseCalendrier } from './defileBord';

/**
 * Les gestes d'une barre de la frise (MISSION § État de l'art : Pointer Events natifs, `setPointerCapture`, appui long = minuterie
 * de 500 ms annulée au-delà de 8 px, `touch-action: pan-y` pour laisser le défilement vertical au navigateur ; aucune dépendance).
 *
 * Machine à états explicite, tenue dans une référence (un geste ne rend rien tant qu'il n'a pas de conséquence) :
 *   repos → appui → glisser | tirer le bord | appui long → lâché ou annulé.
 * Le pas est la semaine, lu par la POSITION du doigt (CAL-BARRE-BORD) : `k = round((x - L) / w - (x0 - L) / w0) - recul`, L la gauche de la frise
 * à l'appui, w et w0 la largeur d'une colonne maintenant et à l'appui (égales : `round(dx / w)`) ; borné par l'appelant (`borne`).
 * Un toucher (appui bref, sans mouvement) appelle `onToucher` ; un geste vertical rend la main au défilement.
 */

export const APPUI_LONG_MS = 500;
export const SEUIL_MOUVEMENT_PX = 8;
const SEUIL_VERTICAL_PX = 10;

export type ModeGeste = 'repos' | 'appui' | 'glisse' | 'bord' | 'long';

export interface OptionsPointeur {
  /** CAL-LACHER-OU-DESSINE : les colonnes dessinées ; le pas et les jours se lisent par le jour sous le doigt (`alignement.ts`), la transformation du dessin. */
  colonnes?: readonly Colonne[];
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
  onDebutBord?: (cote: CoteBord) => void;
  /** CHG-4 : `cote` dit quel bord se tire ; `'debut'` : le bord gauche (la fin reste), `'fin'` : le droit. */
  onBord?: (k: number, dx: number, cote: CoteBord) => void;
  onLacheBord?: (k: number, annule: boolean, cote: CoteBord) => void;
  /** CAL-JOUR-EXACT : le jour (ISO) du bout tiré (`debut` ou `fin` de la chose) ; présent avec `colonnes`, le bord va au jour sous le doigt. */
  bout?: (cote: CoteBord) => string | undefined;
  /** CHG-4 : la zone de prise du bord gauche, en px (0 : pas de bord gauche) ; jamais plus du quart de la barre, dont le corps se glisse. */
  zoneBordDebut?: number;
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
   * CAL-BARRE-BORD (« une barre tirée hors du cadre agrandit l'échelle ») : le bord tiré défile aussi (`mode` 'bord'), et la fenêtre peut grandir
   * au lieu de glisser. Elle rend `false` (plus rien de ce côté) ou les semaines dont son début a reculé (1 : vers le passé, 0 : elle a grandi
   * vers le futur, -1 : elle a avancé).
   */
  defile?: (sens: -1 | 1, mode: 'glisse' | 'bord', garder?: boolean) => false | number;
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
const ZONE_DEFILE_PX = BANDE_PX;

/**
 * T29-6 (23.11, « tenir la barre 2,5 s au bord droit : la frise passe de 6 sem. à 6 mois et l'événement saute de 11 semaines ») : le défilement
 * au bord est mesuré. La vitesse du module `geste` croît avec la profondeur du doigt ; comptée en colonnes de l'appui (65 px à 6 sem.), elle
 * allait jusqu'à 8 colonnes par seconde. Au plus 3 colonnes par seconde : un doigt tenu 2,5 s ajoute 7 semaines, jamais 20.
 * Q4-1 (24.11, « Trop lente sur le calendrier ») : la vitesse du module est multipliée par 2,5 (defileBord.ts) et le plafond passe à 8 colonnes par seconde.
 */
export { COLONNES_MAX_PAR_S };
export function colonnesParImage(vitesse: number, dt: number, largeur: number, colonne: number, accel = 1): number {
  return Math.min((vitesse * dt * largeur) / Math.max(1, colonne), COLONNES_MAX_PAR_S * accel * dt);
}

/** Le sens où le doigt tire la fenêtre : `-1` bord gauche (le passé), `1` bord droit (le futur), `0` ailleurs. `arme` : sens du dernier mouvement. */
export function sensDefilement(x: number, arme: number, cadre: { left: number; right: number }): -1 | 0 | 1 {
  return vitesseBordCalendrier(x - cadre.left, cadre.right - cadre.left, arme).sens;
}

/** Le doigt est-il sur la zone du bord droit de `el` ? Lu sur la boîte de la barre (une boîte vide, jsdom : non). */
export function surLeBord(el: Element, x: number, zone: number, vue: VueEcran = vueEcran()): boolean {
  return prisePourBord(el, x, zone, 'fin', vue).dans;
}

/**
 * POI-1 (24.11, « tout est au bord, l'actionnable est plus difficile sur mobile ») : la prise d'un bord de barre contre le bord de l'écran, où Android
 * place le geste retour, se rentre vers l'intérieur (au moins 44 px hors des 24 px du bord, prisesBord.ts) ; la zone d'avant reste prise. `corr` : le
 * décalage du doigt posé dans la part rentrée, pour que la fin tirée parte de son jour et non d'un saut.
 */
export function prisePourBord(el: Element, x: number, zone: number, cote: CoteBord, vue: VueEcran = vueEcran()): { dans: boolean; corr: number } {
  if (!zone) return { dans: false, corr: 0 };
  const r = el.getBoundingClientRect();
  if (!(r.width > 0)) return { dans: false, corr: 0 };
  const rentree = cote === 'fin' ? priseFin(r.left, r.right, zone, vue) : priseDebut(r.left, r.right, zone, vue);
  if (x < rentree[0] || x > rentree[1]) return { dans: false, corr: 0 };
  return { dans: true, corr: correctionPrise(x, cote === 'fin' ? priseFinAvant(r.left, r.right, zone) : priseDebutAvant(r.left, r.right, zone)) };
}

/** CHG-4 : le bord tiré, la fin (droit) ou le début (gauche). */
export type CoteBord = 'fin' | 'debut';

/** CHG-4 : le doigt est-il sur la zone du bord gauche de `el` ? Au plus le quart de la barre : le corps garde au moins 5/12 de sa largeur. */
export function surLeBordDebut(el: Element, x: number, zone: number, vue: VueEcran = vueEcran()): boolean {
  return prisePourBord(el, x, zone, 'debut', vue).dans;
}

interface Etat {
  id: number;
  cible: Element | null;
  x0: number;
  y0: number;
  t0: number;
  mode: ModeGeste;
  /** CHG-4 : le bord tiré. */
  cote: CoteBord;
  k: number;
  minuterie: ReturnType<typeof setTimeout> | null;
  /** Le déplacement du doigt depuis l'appui, et le nombre de colonnes dont la fenêtre a reculé (>0) ou avancé (<0) depuis le début du geste. */
  dx: number;
  recul: number;
  /** CAL-JOUR : le pas du glisser est un jour (1/7 de colonne), figé à l'appui. */
  parJour: boolean;
  /** CAL-BARRE-BORD : la gauche de la frise, la largeur d'une colonne et d'un jour, à l'appui (le pas se lit par la position). */
  L: number;
  /** T9-1 : la droite visible de la frise à l'appui ; un doigt au bord de l'écran, au-delà de la dernière colonne, la vise encore (jamais une colonne hors de la fenêtre). */
  R: number;
  w0: number;
  d0: number;
  /** CAL-LACHER-OU-DESSINE : l'axe de l'appui (colonnes, largeur, gauche de la colonne 0) ; `null` sans colonnes connues. */
  axe0: AxeDoigt | null;
  /** R1 : le bord ne suit qu'après 6 px. */
  bouge: boolean;
  /** R7 : sens du dernier mouvement (−1, 0, 1), dernière abscisse, colonnes accumulées, image en cours et son heure. */
  arme: number;
  /** T9-1 : le point le plus avancé dans le sens armé (hystérésis du sens, armerSens). */
  pivot: number;
  xPrec: number;
  /** K57-2 : le décalage (px) du doigt posé au milieu du jour du bout tiré : le bord suit le déplacement du doigt, jamais sa position absolue. */
  corr: number;
  /** POI-1 : le doigt a été posé dans la part rentrée du bord (hors de la zone d'avant) : un toucher bref y ouvre la fiche. */
  rentree: boolean;
  acc: number;
  raf: number;
  tPrec: number;
  /** cal-74 : secondes tenues au bord (la vitesse monte avec elles) */
  tenu?: number;
  /** cal-74 : bord gauche de la frise, lu au plus tous les 250 ms */
  gaucheV?: number;
  gaucheT?: number;
  /** R10 : l'écouteur d'Échap pendant le glisser. */
  echap: ((e: KeyboardEvent) => void) | null;
  /** L-1 : l'élément qui a reçu l'appui, la frise, et le retrait des écouteurs de la fenêtre (le geste qui a perdu la barre se finit là). */
  el: HTMLElement;
  frise: Element | null;
  ecoute: (() => void) | null;
}

const bornes = (k: number, b?: [number, number]) => (b ? Math.max(b[0], Math.min(b[1], k)) : k);
/** La plage de pas permise, élargie des colonnes hors fenêtre (`marge`). */
const plage = (b: [number, number] | undefined, marge: [number, number] | undefined): [number, number] | undefined => (b ? [b[0] - (marge?.[0] ?? 0), b[1] + (marge?.[1] ?? 0)] : undefined);
/**
 * T29-6 / C38-2 (tour 38, en ligne : barre tenue au bord droit, posée le 22 mars, hors du cadre qui finit le 7 mars) : un doigt SUR la frise vise une
 * colonne que la fenêtre montre, jamais au-delà ; les colonnes hors fenêtre (`marge`) ne se visent qu'un doigt sorti de la frise, de son côté.
 */
export const plageDuDoigt = (b: [number, number] | undefined, marge: [number, number] | undefined, surLaFrise: boolean): [number, number] | undefined => (surLaFrise ? b : plage(b, marge));

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
  /** L-1 : la barre est-elle encore montée (ses propres écouteurs React reçoivent ce qui tombe sur elle) ? */
  const monte = useRef(true);
  useEffect(() => { installerGarde(); }, []);

  const stopDefile = (e: Etat | null) => {
    if (e?.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(e.raf);
    if (e) { e.raf = 0; e.tPrec = 0; e.acc = 0; e.tenu = 0; }
    if (e?.echap) { window.removeEventListener('keydown', e.echap, true); e.echap = null; }
    if (e?.ecoute) { e.ecoute(); e.ecoute = null; }
  };
  const stopMinuterie = () => {
    const e = etat.current;
    if (e?.minuterie) { clearTimeout(e.minuterie); e.minuterie = null; }
  };
  /*
   * L-1 (T10-1, bloquant) : la fenêtre qui grandit sous le doigt rend la barre trop petite ; elle se redessine en marque (un autre composant) et
   * celle-ci est démontée en plein glisser. Le geste ne meurt pas avec elle : il se finit au lever du doigt, par les écouteurs de la fenêtre.
   */
  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
      stopMinuterie();
      const s = etat.current;
      if (s && (s.mode === 'glisse' || s.mode === 'bord')) return;
      stopDefile(s); etat.current = null;
    };
  }, []);
  /* CAL-LACHER-OU-DESSINE : l'axe du moment (la fenêtre a pu glisser ou grandir sous le doigt) */
  const axeDuMoment = (s: Etat): AxeDoigt | null => {
    const o = opts.current;
    if (!s.axe0 || !o.colonnes?.length || !(o.largeurColonne > 0)) return null;
    /* cal-74 : le bord gauche de la frise ne bouge pas pendant un geste ; lu au plus une fois par 250 ms (avant : une mise en page forcée par
       rendu de la barre tenue, 449 ms sur 2 s au bord à ×6) */
    const t = typeof performance !== 'undefined' ? performance.now() : 0;
    if (s.frise?.isConnected && s.gaucheT === undefined) { s.gaucheV = s.frise.getBoundingClientRect().left; s.gaucheT = t; }
    return { colonnes: o.colonnes, largeurColonne: o.largeurColonne, gauche: s.frise?.isConnected ? (s.gaucheV ?? s.L) : s.L };
  };
  /* le doigt est sur la frise (entre sa gauche et sa droite visibles à l'appui) */
  const surLaFrise = (s: Etat) => Number.isFinite(s.R) && s.xPrec >= s.L && s.xPrec <= s.R;
  /* la cible lue : le pas du doigt, moins les colonnes dont la fenêtre a bougé sous lui (la colonne sous le doigt est celle de la fenêtre d'ORIGINE moins le recul) */
  const pasDe = (s: Etat): number => {
    const w = opts.current.largeurColonne || 1;
    /* CAL-BARRE-BORD : par la position (la fenêtre a pu grandir sous le doigt : la colonne d'origine n'a plus la même largeur) */
    const xv = Number.isFinite(s.R) ? Math.min(s.xPrec, s.R - w / 2) : s.xPrec;
    /* CAL-LACHER-OU-DESSINE : le jour sous le doigt à l'appui (axe de l'appui) et maintenant (axe du moment) ; le recul n'a plus à se compter */
    const axe = axeDuMoment(s);
    if (s.axe0 && axe) {
      /* au jour, la barre se glisse aussi dans sa colonne (1 sem. : une seule colonne, les bornes en colonnes la figeaient) */
      const b = plageDuDoigt(opts.current.borne?.(), opts.current.marge, surLaFrise(s));
      /* T9-1 : un doigt au-delà de la frise vise son dernier jour (le milieu de la dernière colonne figeait le glisser au jour d'une fenêtre d'une colonne) */
      const xj = Number.isFinite(s.R) ? Math.min(s.xPrec, s.R - 1) : s.xPrec;
      return bornes(pasDuDoigt(s.axe0, s.x0, axe, xj, s.parJour), b && s.parJour ? [b[0] - 6 / 7, b[1] + 6 / 7] : b);
    }
    const cols = (xv - s.L) / w - (s.x0 - s.L) / (s.w0 || w);
    /* CAL-JOUR : au jour, le pas est 1/7 de colonne ; `k` reste en semaines (3 jours = 3/7), la barre et sa bulle se posent sans autre calcul */
    const brut = s.parJour ? Math.round(cols * 7) / 7 : Math.round(cols);
    return bornes(brut - s.recul, plageDuDoigt(opts.current.borne?.(), opts.current.marge, surLaFrise(s)));
  };
  /* le bord, au jour : les jours entre le doigt et l'appui, chacun lu dans sa fenêtre, moins les semaines dont le début a reculé */
  const largeurJourDe = (o: OptionsPointeur) => (o.largeurJour && o.largeurJour > 0 ? o.largeurJour : o.largeurColonne / 7);
  const joursDe = (s: Etat): number => {
    const axe = axeDuMoment(s);
    if (s.axe0 && axe) {
      /* CAL-JOUR-EXACT : le bout tiré va au jour dont la colonne contient le doigt, d'où qu'il ait été pris (la zone du bord fait 22 px) */
      const bout = opts.current.bout?.(s.cote);
      return bout ? joursJusquAuDoigt(axe, s.xPrec + s.corr, bout) : joursDuDoigt(s.axe0, s.x0, axe, s.xPrec);
    }
    const d = largeurJourDe(opts.current) || 1;
    return Math.round((s.xPrec - s.L) / d - (s.x0 - s.L) / (s.d0 || d) - 7 * s.recul);
  };
  /* après chaque rendu de la barre (la fenêtre a pu bouger sous le doigt) : le pas est relu, la bulle et le fantôme suivent ;
     cal-76 : avant la peinture (la bulle suit la fenêtre dans la même image, pas un rendu de plus une image plus tard) */
  useLayoutEffect(() => {
    const s = etat.current;
    if (!s || !(opts.current.largeurColonne > 0)) return;
    if (s.mode === 'glisse') {
      const k = pasDe(s);
      if (k !== s.k) { s.k = k; opts.current.onGlisse?.(k, s.dx); }
    } else if (s.mode === 'bord' && s.bouge) {
      const k = joursDe(s);
      if (k !== s.k) { s.k = k; opts.current.onBord?.(k, s.dx, s.cote); }
    }
  });

  const capturer = (cible: Element, id: number) => {
    try { (cible as HTMLElement).setPointerCapture?.(id); } catch { /* jsdom, ou pointeur déjà relâché */ }
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.button > 0) return;
    cacheCadre.current = null; /* cal-75 : un geste neuf relit le cadre (rotation, redimensionnement entre deux gestes) */
    stopMinuterie();
    /* CHG-4 : `[data-bord="debut"]` > bord droit > (hors jalon) bord gauche */
    const cibleEl = e.target as HTMLElement | null;
    const marque = cibleEl?.closest?.('[data-bord]');
    let cote: CoteBord = marque?.getAttribute('data-bord') === 'debut' ? 'debut' : 'fin';
    const priseFinBord = prisePourBord(e.currentTarget, e.clientX, opts.current.zoneBord ?? 0, 'fin');
    let bord = !!marque || priseFinBord.dans;
    let corr = marque ? 0 : priseFinBord.corr, rentree = !marque && priseFinBord.corr !== 0;
    if (!bord && !cibleEl?.closest?.('[data-jalon]')) {
      const priseDebutBord = prisePourBord(e.currentTarget, e.clientX, opts.current.zoneBordDebut ?? 0, 'debut');
      if (priseDebutBord.dans) { bord = true; cote = 'debut'; corr = priseDebutBord.corr; rentree = priseDebutBord.corr !== 0; }
    }
    const o0 = opts.current, L = e.currentTarget.closest?.('[data-frise]')?.getBoundingClientRect().left ?? 0;
    const s: Etat = { id: e.pointerId, cible: e.target instanceof Element ? e.target : null, x0: e.clientX, y0: e.clientY, t0: Date.now(), mode: bord ? 'bord' : 'appui', cote, k: 0, minuterie: null, dx: 0, recul: 0, parJour: !!o0.parJour,
      L, R: cadreDe(e.currentTarget).right, w0: o0.largeurColonne, d0: largeurJourDe(o0),
      axe0: o0.colonnes?.length && o0.largeurColonne > 0 ? { colonnes: o0.colonnes, largeurColonne: o0.largeurColonne, gauche: L } : null,
      bouge: false, arme: 0, pivot: e.clientX, xPrec: e.clientX, corr, rentree, acc: 0, raf: 0, tPrec: 0, echap: null,
      el: e.currentTarget, frise: e.currentTarget.closest?.('[data-frise]') ?? null, ecoute: null };
    /* K57-2 : le bout tiré part de son jour : la prise ne change rien, le bord suit le déplacement du doigt (`corr` : le décalage de la prise au milieu du jour du bout) */
    const boutPris = bord && s.axe0 ? o0.bout?.(s.cote) : undefined;
    if (boutPris && s.axe0) s.corr = correctionAuBout(s.axe0, e.clientX, boutPris);
    if (etat.current) stopDefile(etat.current);
    etat.current = s;
    const annuler = () => {
      if (etat.current !== s) return;
      if (s.minuterie) { clearTimeout(s.minuterie); s.minuterie = null; }
      stopDefile(s);
      etat.current = null;
      if (s.mode === 'glisse' || s.mode === 'bord') { avalerClic.current = Date.now(); poserGardeClic(); }
      if (s.mode === 'glisse') opts.current.onLacheGlisse?.(s.k, true);
      else if (s.mode === 'bord') opts.current.onLacheBord?.(s.k, true, s.cote);
    };
    /* Frise B, R10 : Échap pendant un glisser ou un bord tiré rend la barre d'avant, exactement (rien n'est écrit) */
    s.echap = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape' || etat.current !== s || (s.mode !== 'glisse' && s.mode !== 'bord')) return;
      ev.preventDefault(); ev.stopPropagation();
      if (inscrit.current) { gestesEnCours.delete(inscrit.current); inscrit.current = null; }
      annuler();
    };
    window.addEventListener('keydown', s.echap, true);
    /* L-1 : ce qui ne tombe plus sur la barre (capture perdue, barre redessinée ou démontée sous le doigt) mène et finit le geste depuis la
       fenêtre ; ce qui tombe sur elle passe par ses écouteurs React (jamais deux fois) */
    const surFenetre = (ev: PointerEvent) => {
      if (etat.current !== s || ev.pointerId !== s.id) return;
      const t = ev.target instanceof Node ? ev.target : null;
      if (monte.current && s.el.isConnected && t && s.el.contains(t)) return;
      if (ev.type === 'pointermove') bouger(s, ev.clientX, ev.clientY, s.el);
      else finir(s, ev.type === 'pointercancel', s.el);
    };
    const types = ['pointermove', 'pointerup', 'pointercancel'] as const;
    types.forEach(t => window.addEventListener(t, surFenetre, true));
    s.ecoute = () => types.forEach(t => window.removeEventListener(t, surFenetre, true));
    if (inscrit.current) gestesEnCours.delete(inscrit.current);
    inscrit.current = annuler;
    gestesEnCours.add(annuler);
    if (bord) {
      e.stopPropagation();
      capturer(e.currentTarget, e.pointerId);
      opts.current.onDebutBord?.(s.cote);
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
  /* cal-74 : le cadre de la frise ne bouge pas pendant un geste ; lu au plus une fois par 250 ms (avant : `getBoundingClientRect` et `innerWidth`,
     deux mises en page forcées, à chaque image du défilement) */
  const cacheCadre = useRef<{ geste: unknown; t: number; v: { left: number; right: number } } | null>(null);
  const cadreDe = (el: Element) => {
    const maintenant = typeof performance !== 'undefined' ? performance.now() : 0;
    /* cal-75 : lu UNE fois par geste (le cadre ne bouge pas sous le doigt) : chaque lecture, même espacée de 250 ms, forçait la mise en page de l'onglet entier (394 ms sur 2 s au bord à ×6) */
    const geste = etat.current;
    if (cacheCadre.current && (geste ? cacheCadre.current.geste === geste : maintenant - cacheCadre.current.t < 250)) return cacheCadre.current.v;
    const cadre = (el.closest('[data-frise]') ?? (etat.current?.frise?.isConnected ? etat.current.frise : null))?.getBoundingClientRect();
    const vue = typeof window !== 'undefined' ? window.innerWidth : 0;
    const v = { left: Math.max(0, cadre?.left ?? 0), right: Math.min(vue || Infinity, cadre && cadre.width > 0 ? cadre.right : Infinity) };
    cacheCadre.current = { geste, t: maintenant, v };
    return v;
  };
  const majDefile = (s: Etat, x: number, el: HTMLElement) => {
    if (!opts.current.defile || s.raf || typeof requestAnimationFrame !== 'function') return;
    if (!sensDefilement(x, s.arme, cadreDe(el))) return;
    const image = (t: number) => {
      s.raf = 0;
      if (etat.current !== s || (s.mode !== 'glisse' && s.mode !== 'bord')) return;
      const c = cadreDe(el), largeur = c.right - c.left;
      const { sens, vitesse } = vitesseBordCalendrier(s.xPrec - c.left, largeur, s.arme);
      if (!sens || !Number.isFinite(largeur)) { s.tPrec = 0; s.acc = 0; s.tenu = 0; return; }
      const dt = s.tPrec ? Math.min(DT_MAX_S, (t - s.tPrec) / 1000) : 0;
      s.tPrec = t;
      /* cal-74 : la vitesse monte avec le temps tenu au bord (×1 à ×1,6 en 1,2 s) */
      s.tenu = (s.tenu ?? 0) + dt;
      const accel = accelerationTenue(s.tenu);
      const oo = opts.current;
      /* comptée en semaines (un axe en jours en a sept par semaine : le bord n'y avance pas sept fois plus vite) */
      /* VISION-tour9 n° 2 : comptée en colonnes de l'APPUI (une fenêtre qui grandit rétrécit ses colonnes : comptée en colonnes du moment, elle
         allait de 6 à 23 semaines en 1,5 s et la bulle ne suivait plus) */
      s.acc += colonnesParImage(vitesseCalendrier(vitesse) * accel, dt, largeur, Math.max(1, s.mode === 'bord' ? (s.d0 || largeurJourDe(oo)) * 7 : (s.w0 || oo.largeurColonne)), accel);
      while (s.acc >= 1) {
        s.acc -= 1;
        /* la barre sortirait d'une fenêtre qui GLISSE : elle ne fait alors que grandir (jamais une barre tenue qui disparaît sous le doigt) ;
           L-8 (T10-8) : la garde refusait tout pas, et une barre de la première colonne ne gagnait rien au bord droit ; un bord tiré la suit toujours */
        const dansLaVue = s.mode === 'glisse' ? oo.borne?.() : undefined;
        const garder = !!dansLaVue && (sens < 0 ? dansLaVue[1] < 1 : dansLaVue[0] > -1);
        const r = oo.defile?.(sens, s.mode, garder);
        if (r === false || r === undefined) { s.acc = 0; break; }
        s.recul += r;
      }
      s.raf = requestAnimationFrame(image);
    };
    s.raf = requestAnimationFrame(image);
  };

  const bouger = (s: Etat, x: number, y: number, el: HTMLElement) => {
    const dx = x - s.x0;
    const dy = y - s.y0;
    const o = opts.current;
    /* f1-a au vrai toucher (CRITIQUE-2 n° 1) : un doigt qui a tenu 500 ms puis part de côté glisse quand même ; le menu ouvert se ferme
       (`onDebutGlisse` ou le premier `onGlisse` le dit à l'appelant). Au-delà de 8 px avant 500 ms, c'est un glisser et le menu ne s'ouvre pas. */
    // R7 : le sens du dernier mouvement arme le défilement au bord
    s.xPrec = x;
    // T9-1 : le tremblement d'un doigt tenu (±1 px) ne retourne pas le sens (hystérésis de 6 px, armerSens)
    const sa = armerSens(s.arme, s.pivot, x); s.arme = sa.arme; s.pivot = sa.pivot;
    if (s.mode === 'appui' || s.mode === 'long') {
      if (s.mode === 'appui' && Math.abs(dy) > SEUIL_VERTICAL_PX && Math.abs(dy) > Math.abs(dx)) { stopMinuterie(); stopDefile(s); etat.current = null; return; }
      // Frise B, R1 : la barre ne part qu'après 6 px de déplacement horizontal
      if (aBouge(dx)) {
        stopMinuterie();
        const raison = o.refuseGlisse?.(s.cible) ?? null;
        if (raison) { stopDefile(s); etat.current = null; o.onRefus?.(raison, s.cible); return; }
        s.mode = 'glisse';
        capturer(el, s.id);
        o.onDebutGlisse?.();
      }
    }
    if (s.mode === 'glisse' && o.largeurColonne > 0) {
      s.dx = dx;
      s.k = pasDe(s);
      o.onGlisse?.(s.k, dx);
      majDefile(s, x, el);
    } else if (s.mode === 'bord' && o.largeurColonne > 0) {
      // Frise B, R1 : le bord ne suit qu'après 6 px (en 6 mois, un jour fait 2 px : un doigt qui tremble ne le déplace pas)
      if (!s.bouge && !aBouge(dx)) return;
      s.bouge = true;
      s.dx = dx;
      /* le bord se tire au jour : une semaine = 7 jours, le pas du bord est 1/7 de colonne (E29) ; tenu au bord de la frise, la fenêtre grandit */
      s.k = joursDe(s);
      o.onBord?.(s.k, dx, s.cote);
      majDefile(s, x, el);
    }
  };
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const s = etat.current;
    if (!s || e.pointerId !== s.id) return;
    bouger(s, e.clientX, e.clientY, e.currentTarget);
  }, []);

  /* CRITIQUE-3 n° 3 : le lâcher d'un appui long n'agit jamais. Le `click` que le navigateur émet après ce lâcher est avalé ici ; le menu,
     de son côté, n'exécute une action que sur un appui ET un lâcher faits dans le menu après son ouverture (MenuAppuiLong). */
  const avalerClic = useRef(0);
  const finir = (s: Etat, annule: boolean, el: HTMLElement) => {
    stopMinuterie();
    stopDefile(s);
    etat.current = null;
    if (inscrit.current) { gestesEnCours.delete(inscrit.current); inscrit.current = null; }
    const o = opts.current;
    if (s.mode === 'long' || s.mode === 'glisse' || s.mode === 'bord') { avalerClic.current = Date.now(); poserGardeClic(); }
    if (s.mode === 'glisse') o.onLacheGlisse?.(s.k, annule);
    else if (s.mode === 'bord') {
      o.onLacheBord?.(s.k, annule, s.cote);
      /* CHG-4 : un toucher sur le bord gauche, sans mouvement, ouvre encore le détail (comme sur le corps) */
      /* POI-1 : de même un toucher dans la part rentrée du bord droit (un point d'étape, le corps de la barre) : il ne tire rien, il ouvre */
      if ((s.cote === 'debut' || s.rentree) && !s.bouge && !annule && Date.now() - s.t0 < APPUI_LONG_MS) o.onToucher?.(s.cible);
    }
    else if (s.mode === 'appui' && !annule && Date.now() - s.t0 < APPUI_LONG_MS) {
      /* TOUCHER-FANTOME (21.11, tour7 : toucher « La Cigogne, 3 fûts » a annulé la vente) : le toucher ouvre le détail au lâcher ; le `click`
         que le navigateur émet ensuite au même point tombait sur « Annuler la vente », apparu sous le doigt. Ce clic est avalé s'il tombe hors de
         la pièce touchée (la souris, dont le clic reste sur elle, et le clavier passent) ; un nouveau doigt posé lève la garde. */
      avalerClicSuivant(DELAI_CLIC_AVALE, el);
      o.onToucher?.(s.cible);
    }
  };
  const fin = useCallback((e: React.PointerEvent<HTMLElement>, annule: boolean) => {
    const s = etat.current;
    if (!s || e.pointerId !== s.id) return;
    finir(s, annule, e.currentTarget);
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
