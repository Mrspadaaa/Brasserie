import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { WaterIons } from '../types';
import { ION_LABEL, ION_ROLE, ION_SYMBOL, radarScaleMax } from '../domain/water';
import { StyleWater, styleIonRange } from '../domain/waterStyles';
import { formatIonReading } from './waterReadings';
import { nombreFr } from '../domain/nombreAffiche';

/** Profil ionique des deux eaux traitées face aux repères du style. */

/** La place que la pesée laisse à la toile sur le téléphone, en pixels CSS (mesurée par `useWaterControlsLayout`). */
export interface RadarBoite { w: number; h: number }

interface WaterRadarProps {
  /** L'eau du réseau, coupée d'osmosée : ce qu'on a avant d'ouvrir un sachet. */
  start: WaterIons;
  /** La moyenne des eaux après les sels et les doses d’acide retenues. */
  achieved: WaterIons;
  style: StyleWater;
  /**
   * Les ions déplacés par le sel qu'on manipule.
   *
   * Sans eux, la toile ne répond pas à la question que se pose le brasseur
   * devant sa balance : « ce sel-là, il pousse quoi ? »
   */
  highlight?: Array<keyof WaterIons>;
  /** Prend la hauteur laissée par les commandes de pesée sur mobile. */
  fitToControls?: boolean;
  /**
   * EAU-SELS-UN-ECRAN (22.11) : « maximiser la grandeur du spidergraph ». Avec la boîte mesurée, la toile de pesée prend
   * toute la largeur et toute la hauteur laissée par les sels et les acides : le cercle est borné par la hauteur, les
   * étiquettes vont dans les coins. Sans boîte (bureau, récapitulatif), la géométrie d'origine.
   */
  boite?: RadarBoite | null;
  /** Potassium apporté par les sels (ppm), hors des six axes : pastille dans la toile dès qu'il dépasse 0. */
  potassium?: number | null;
  className?: string;
}

/** Sens de lecture : Cl en haut, puis dans le sens des aiguilles. */
const IONS: Array<keyof WaterIons> = ['cl', 'so4', 'ca', 'mg', 'na', 'hco3'];

const W = 360;
/**
 * Rayon du dernier anneau, et la boîte qui en découle (géométrie d'origine, hors pesée sur téléphone).
 *
 * ⚠️ La géométrie est calculée À L'ENVERS : c'est le rayon qu'on veut le plus
 * grand possible, et la boîte s'ajuste. Les étiquettes du HAUT et du BAS ne
 * portent que deux lignes — symbole et valeur sur la même —, celles des flancs
 * trois.
 *
 *   en haut  : 16 (ligne symbole+valeur) + 17 (fourchette) + 3 (jambages) = 36
 *   en bas   : 18 (descente sous l'anneau) + 17 + 3                       = 38
 */
const R0 = 133;
/**
 * Demi-ouverture d'un secteur.
 *
 * ⚠️ 24° et non 27 : sur une grande toile les six quartiers se rejoignaient en
 * un disque vert barré de fentes noires. Douze degrés d'écart, et chaque ion
 * retrouve son quartier.
 */
const HALF = 24;
/** Un anneau tous les 50 ppm — c'est la graduation qu'on lit sur la toile. */
const RING_STEP = 50;
/** Pesée : largeur réservée à une étiquette de coin (« HCO₃⁻ moy. 12,5 ▲ »), et à la légende du flanc. */
const COIN = 64;
/** Pesée : hauteur de la ligne de légende posée sous la toile quand le disque prend toute la largeur. */
export const LEGENDE_H = 18;

const GREEN = 'rgb(var(--hop))'; // hop — la fourchette du style
const STRAW = 'rgb(var(--ebc-straw))'; // ebc-straw — l'eau corrigée
const BLUE = 'rgb(var(--water))'; // water — l'eau de départ
const AMBER = '#C87A2C'; // ebc-amber — hors fourchette
const GRID = 'rgb(var(--cave-800))'; // cave-800
const FOND = 'rgb(var(--cave-900))'; // fond du panneau : le halo des étiquettes posées sur la toile

const rad = (d: number) => (d * Math.PI) / 180;
const angle = (i: number) => -90 + i * 60;
const pt = ([x, y]: [number, number]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

/** De quel côté de la toile l'étiquette se pose. */
const anchorAt = (cos: number): 'start' | 'end' | 'middle' =>
  cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';

/** Halo couleur du fond : une étiquette qui chevauche un anneau ou un secteur reste lisible. */
const HALO = { paintOrder: 'stroke', stroke: FOND, strokeWidth: 3, strokeLinejoin: 'round' } as const;

/*
 * ── Pesée sur téléphone : les étiquettes au bout de leur axe (EAU-RADAR-ETIQUETTES, 22.11, « Oula c'est pas terribles ça »).
 * Décision : work/missions/2026-11-22-eau-sels/ETIQUETTES.md. Placement d'étiquettes à positions candidates : chaque boîte
 * (mesurée par getBBox sur un gabarit invisible) cherche sa place à ≤ 22 px du bout de son axe, hors du disque, entière dans la
 * toile, sans toucher une autre ; le plus grand rayon qui laisse une place à toutes est trouvé par dichotomie.
 */
/** Forme d'une étiquette : une ligne (Cl, Mg : symbole, valeur, plage), deux (symbole et valeur / plage) ou trois. */
export type FormeEtiquette = 'ligne' | 'deux' | 'trois';
/** Boîte d'un groupe dans son repère propre (origine = point d'ancrage). */
export interface BoiteLocale { x: number; y: number; w: number; h: number }
interface Rect { x: number; y: number; d: number; b: number }
export interface Disposition {
  R: number; CX: number; CY: number;
  etiquettes: Partial<Record<keyof WaterIons, { forme: FormeEtiquette; ancre: 'start' | 'middle' | 'end'; tx: number; ty: number; r: Rect }>>;
  legende: { tx: number; ty: number; r: Rect } | null;
  haut: number; bas: number;
  /** La légende va en ligne HTML sous la toile (LEGENDE_H px) : la colonne dans la toile aurait coûté plus de rayon. */
  legendeDessous: boolean;
}
const ANGLE: Record<keyof WaterIons, number> = { cl: -90, so4: -30, ca: 30, mg: 90, na: 150, hco3: 210 };
const FORMES: Record<keyof WaterIons, FormeEtiquette[]> = {
  cl: ['ligne'], mg: ['ligne'], so4: ['deux', 'trois'], ca: ['deux', 'trois'], na: ['deux', 'trois'], hco3: ['deux', 'trois']
};
/** Le plus contraint d'abord : le haut et le bas prennent la hauteur, puis les flancs. */
const ORDRE: Array<keyof WaterIons> = ['cl', 'mg', 'so4', 'hco3', 'ca', 'na'];
const MARGE_DISQUE = 3;
const AIR = 3;
const BORD = 1;
const PORTEE = 22;
const PAS = 2;
/** Morsure permise sur le bord du disque, et bande gardée libre de part et d'autre de chaque axe. */
const PROF = 18;
const BANDE = 7;
const touche = (a: Rect, c: Rect, m: number) => a.x < c.d + m && c.x < a.d + m && a.y < c.b + m && c.y < a.b + m;

function essai(R: number, w: number, h: number, boites: Record<string, BoiteLocale>, force: boolean, legendeAvant = true): Disposition | null {
  const CX = w / 2, CY = h / 2;
  const poses: Rect[] = [];
  const dirs = IONS.map((ion) => [Math.cos(rad(ANGLE[ion])), Math.sin(rad(ANGLE[ion]))] as const);
  /*
   * Une étiquette peut mordre sur le bord du disque (PROF px au plus, au-delà du dernier repère du style) pour que la toile
   * reste grande sur 390×660 ; jamais sur un axe ni sur ses points (bande de 7 px). −1 : refusée ; sinon la profondeur mordue.
   */
  const morsure = (r: Rect, prof: number) => {
    if (r.x < BORD || r.y < BORD || r.d > w - BORD || r.b > h - BORD) return -1;
    const nx = Math.min(Math.max(CX, r.x), r.d), ny = Math.min(Math.max(CY, r.y), r.b);
    const pres = Math.hypot(nx - CX, ny - CY);
    if (pres < R - prof) return -1;
    if (poses.some((p) => touche(p, r, AIR))) return -1;
    if (pres >= R + MARGE_DISQUE) return 0;
    for (const [c, s] of dirs) {
      for (let q = Math.max(0, R - prof - 8); q <= R; q += 3) {
        const px = CX + q * c, py = CY + q * s;
        if (px > r.x - BANDE && px < r.d + BANDE && py > r.y - BANDE && py < r.b + BANDE) return -1;
      }
    }
    return R + MARGE_DISQUE - pres;
  };
  const libre = (r: Rect) => morsure(r, -MARGE_DISQUE) === 0;
  /*
   * La légende (et K⁺), posée après Cl et Mg et avant les flancs (ou après eux, second essai), entière hors du disque : au milieu du flanc gauche quand
   * la toile est large (390×660), sinon dans le coin libre le plus proche. false : aucune place.
   */
  let legende: Disposition['legende'] = null;
  const placerLegende = (): boolean => {
    const lb = boites.legende;
    if (!lb) return true;
    let meilleur: { score: number; r: Rect } | null = null;
    for (let x = BORD; x <= w - BORD - lb.w; x += PAS) {
      for (let y = BORD; y <= h - BORD - lb.h; y += PAS) {
        const r = { x, y, d: x + lb.w, b: y + lb.h };
        if (!libre(r)) continue;
        const coin = Math.min(Math.hypot(x, y), Math.hypot(w - r.d, y), Math.hypot(x, h - r.b), Math.hypot(w - r.d, h - r.b));
        const score = Math.min(Math.hypot(x, y + lb.h / 2 - CY), coin + 10);
        if (!meilleur || score < meilleur.score) meilleur = { score, r };
      }
    }
    if (!meilleur) return force;
    poses.push(meilleur.r);
    legende = { tx: meilleur.r.x - lb.x, ty: meilleur.r.y - lb.y, r: meilleur.r };
    return true;
  };
  const etiquettes: Disposition['etiquettes'] = {};
  for (const ion of ORDRE) {
    if (legendeAvant && ion === 'so4' && !placerLegende()) return null;
    const c = Math.cos(rad(ANGLE[ion])), s = Math.sin(rad(ANGLE[ion]));
    const tx0 = CX + R * c, ty0 = CY + R * s;
    let best: { score: number; r: Rect; forme: FormeEtiquette; tx: number; ty: number } | null = null;
    FORMES[ion].forEach((forme, k) => {
      const b = boites[`${ion}-${forme}`];
      if (!b) return;
      // le centre idéal : dans le prolongement de l'axe, la boîte juste hors du disque
      const ext = MARGE_DISQUE + 2 + Math.abs(c) * b.w / 2 + Math.abs(s) * b.h / 2;
      const ix = tx0 + c * ext, iy = ty0 + s * ext;
      for (let x = Math.floor(tx0 - b.w - PORTEE); x <= tx0 + PORTEE; x += PAS) {
        for (let y = Math.floor(ty0 - b.h - PORTEE); y <= ty0 + PORTEE; y += PAS) {
          const r = { x, y, d: x + b.w, b: y + b.h };
          const dist = Math.hypot(Math.max(r.x - tx0, 0, tx0 - r.d), Math.max(r.y - ty0, 0, ty0 - r.b));
          if (dist > PORTEE) continue;
          const mord = force ? 0 : morsure(r, PROF);
          if (mord < 0) continue;
          const score = dist + 0.35 * Math.hypot(x + b.w / 2 - ix, y + b.h / 2 - iy) + k * 6 + 0.6 * mord;
          if (!best || score < best.score) best = { score, r, forme, tx: x - b.x, ty: y - b.y };
        }
      }
    });
    if (!best) return null;
    const retenu: { score: number; r: Rect; forme: FormeEtiquette; tx: number; ty: number } = best;
    poses.push(retenu.r);
    // le vrai texte (plus court que son gabarit) s'aligne sur le bord de la boîte qui regarde le bout de l'axe
    const milieu = (retenu.r.x + retenu.r.d) / 2;
    const ancre = milieu > tx0 + 4 ? 'start' as const : milieu < tx0 - 4 ? 'end' as const : 'middle' as const;
    etiquettes[ion] = { forme: retenu.forme, ancre, tx: ancre === 'start' ? retenu.r.x : ancre === 'end' ? retenu.r.d : milieu, ty: retenu.ty, r: retenu.r };
  }
  if (!legendeAvant && !placerLegende()) return null;
  const haut = Math.min(CY - R, ...poses.map((p) => p.y)) - BORD;
  const bas = Math.max(CY + R, ...poses.map((p) => p.b)) + BORD;
  return { R, CX, CY, etiquettes, legende, haut, bas, legendeDessous: false };
}

/** Le plus grand rayon qui laisse aux six étiquettes et à la légende une place au bout de leur axe. */
function plusGrandRayon(w: number, h: number, boites: Record<string, BoiteLocale>): Disposition {
  let lo = 40, hi = Math.max(40, Math.floor(Math.min(w, h) / 2 - 2));
  const tente = (r: number) => essai(r, w, h, boites, false) ?? essai(r, w, h, boites, false, false);
  let retenue = tente(lo);
  if (!retenue) return essai(lo, w, h, boites, true)!;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const d = tente(mid);
    if (d) { lo = mid; retenue = d; } else hi = mid - 1;
  }
  return retenue;
}

/**
 * Le plus grand rayon qui laisse aux six étiquettes une place au bout de leur axe. La légende : colonne dans un coin libre
 * de la toile (large et basse, 390×660), ou ligne HTML sous elle (toile presque carrée, 390×844) — celle des deux qui laisse
 * le plus grand disque.
 */
export function disposerEtiquettes(w: number, h: number, boites: Record<string, BoiteLocale>): Disposition {
  const dedans = plusGrandRayon(w, h, boites);
  if (!boites.legende) return dedans;
  const sansLegende = Object.fromEntries(Object.entries(boites).filter(([cle]) => cle !== 'legende'));
  const dessous = plusGrandRayon(w, h - LEGENDE_H - 3, sansLegende);
  // 3 px d'air entre l'étiquette du bas et la ligne de légende
  return dessous.R > dedans.R ? { ...dessous, bas: dessous.bas + 3, legendeDessous: true } : dedans;
}

/** Un morceau de ligne d'étiquette : texte, taille, gras, rôle de couleur. */
interface Morceau { t: string; fs: number; gras?: boolean; role: 'teinte' | 'valeur' | 'plage'; dx?: number }
/** Lignes d'une étiquette de pesée : la même description sert au rendu, au gabarit et à l'estimation. */
function lignesEtiquette(forme: FormeEtiquette, symbole: string, valeur: string, fleche: string, plage: string): Array<{ y: number; m: Morceau[] }> {
  const sym: Morceau = { t: symbole, fs: 12, role: 'teinte' };
  const val: Morceau[] = [{ t: ` ${valeur}`, fs: 16, gras: true, role: 'valeur' }, ...(fleche ? [{ t: fleche, fs: 11, role: 'valeur' as const }] : [])];
  const pl: Morceau = { t: plage, fs: 11, role: 'plage' };
  if (forme === 'ligne') return [{ y: 0, m: [sym, ...val, { ...pl, dx: 5 }] }];
  if (forme === 'deux') return [{ y: 0, m: [sym, ...val] }, { y: 14, m: [pl] }];
  return [{ y: 0, m: [sym] }, { y: 17, m: val.map((v, i) => (i === 0 ? { ...v, t: valeur } : v)) }, { y: 31, m: [pl] }];
}
/** Estimation de la boîte avant la première mesure (et sous jsdom, sans getBBox). */
function estimer(lignes: Array<{ y: number; m: Morceau[] }>, ancre: 'start' | 'middle' | 'end'): BoiteLocale {
  const w = Math.max(...lignes.map((l) => l.m.reduce((s, m) => s + m.t.length * m.fs * 0.56 + (m.dx ?? 0), 0)));
  const fsMax = Math.max(...lignes[0].m.map((m) => m.fs));
  const y = -fsMax, b = lignes[lignes.length - 1].y + 4;
  return { x: ancre === 'start' ? 0 : ancre === 'end' ? -w : -w / 2, y, w, h: b - y };
}
const ancreDe = (ion: keyof WaterIons): 'start' | 'middle' | 'end' => {
  const c = Math.cos(rad(ANGLE[ion]));
  return c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
};
/** Gabarit de valeur : chaque chiffre devient un 8, au moins trois chiffres — la toile ne bouge pas pendant la pesée. */
const gabaritValeur = (ion: keyof WaterIons, lecture: string) => {
  const g = lecture.replace(/\d/g, '8');
  return g.replace(/\D/g, '').length >= 3 ? g : ion === 'hco3' ? '88,8' : '888';
};

export const WaterRadar: React.FC<WaterRadarProps> = ({
  start,
  achieved,
  style,
  highlight,
  fitToControls = false,
  boite = null,
  potassium = null,
  className = ''
}) => {
  const pese = fitToControls && boite != null && boite.w > 0 && boite.h > 0;
  /* Les lectures : ce qu'on écrit au bout de chaque axe, indépendant de la géométrie. */
  const lectures = useMemo(() => IONS.map((ion) => {
    const band = styleIonRange(style, ion);
    const targeted = !style.untargetedIons?.includes(ion);
    const value = achieved[ion];
    const brut = formatIonReading(value, targeted ? band : undefined, ion === 'hco3' ? 1 : 0);
    return { ion, band, targeted, value, reading: ion === 'hco3' ? brut.replace(/,0$/, '') : brut };
  }), [achieved, style]);
  const plageDe = (ion: keyof WaterIons, targeted: boolean, band: { min: number; max: number }) =>
    targeted ? `${band.min}–${band.max}` : 'sans cible';
  const symbolePese = (ion: keyof WaterIons) => `${ION_SYMBOL[ion]}${ion === 'hco3' ? ' moy.' : ''}`;

  /*
   * Pesée sur téléphone : la boîte est celle de l'écran, unité SVG = pixel CSS (les tailles de police sont celles qu'on lit).
   * EAU-RADAR-ETIQUETTES : les gabarits invisibles (valeur « 888 ▲ ») sont mesurés par getBBox ; le rayon le plus grand qui
   * laisse chaque étiquette au bout de son axe, entière et sans chevauchement, est cherché par `disposerEtiquettes`.
   */
  const gabarits = useMemo(() => {
    if (!pese) return [];
    const out: Array<{ cle: string; ancre: 'start' | 'middle' | 'end'; lignes: ReturnType<typeof lignesEtiquette> }> = [];
    for (const l of lectures) {
      for (const forme of FORMES[l.ion]) {
        out.push({ cle: `${l.ion}-${forme}`, ancre: ancreDe(l.ion), lignes: lignesEtiquette(forme, symbolePese(l.ion), gabaritValeur(l.ion, l.reading), ' ▲', plageDe(l.ion, l.targeted, l.band)) });
      }
    }
    return out;
  }, [pese, lectures]);
  const gabaritCle = gabarits.map((g) => `${g.cle}:${g.lignes.map((l) => l.m.map((m) => m.t).join('')).join('|')}`).join(';')
    + (potassium != null && Number.isFinite(potassium) && potassium > 0 ? ';K' : ''); // la ligne K⁺ change la boîte de la légende
  const refs = useRef(new Map<string, SVGGraphicsElement>());
  const attacher = useCallback((cle: string) => (el: SVGGraphicsElement | null) => { if (el) refs.current.set(cle, el); else refs.current.delete(cle); }, []);
  const [mesures, setMesures] = useState<Record<string, BoiteLocale>>({});
  const [polices, setPolices] = useState(0);
  useEffect(() => {
    let vivant = true;
    document.fonts?.ready?.then(() => { if (vivant) setPolices((v) => v + 1); }).catch(() => {});
    return () => { vivant = false; };
  }, []);
  useLayoutEffect(() => {
    if (!pese) return;
    const m: Record<string, BoiteLocale> = {};
    refs.current.forEach((el, cle) => {
      try {
        const b = el.getBBox();
        if (b.width > 0 && b.height > 0) m[cle] = { x: b.x, y: b.y, w: Math.ceil(b.width), h: Math.ceil(b.height) };
      } catch { /* jsdom : pas de getBBox, l'estimation reste */ }
    });
    setMesures((avant) => (JSON.stringify(avant) === JSON.stringify(m) ? avant : m));
  }, [pese, gabaritCle, polices]);
  const boites = useMemo(() => {
    const b: Record<string, BoiteLocale> = {};
    for (const g of gabarits) b[g.cle] = mesures[g.cle] ?? estimer(g.lignes, g.ancre);
    b.legende = mesures.legende ?? { x: 0, y: -10, w: 62, h: 59 };
    return b;
  }, [gabarits, mesures]);
  const boitesCle = JSON.stringify(boites);
  const disp = useMemo<Disposition | null>(
    () => (pese ? disposerEtiquettes(boite!.w, boite!.h, JSON.parse(boitesCle) as Record<string, BoiteLocale>) : null),
    [pese, boite, boitesCle]
  );
  const geo = useMemo(() => {
    if (!pese || !disp) return { VW: W, VH: 74 + 2 * R0, R: R0, CX: W / 2, CY: 36 + R0, LABEL_R: R0 + 12, top: -14 };
    return { VW: boite!.w, VH: disp.bas, R: disp.R, CX: disp.CX, CY: disp.CY, LABEL_R: disp.R + 12, top: disp.haut };
  }, [pese, boite, disp]);
  const { VW, VH, R, CX, CY, LABEL_R } = geo;
  const xy = useCallback((d: number, r: number): [number, number] => [CX + r * Math.cos(rad(d)), CY + r * Math.sin(rad(d))], [CX, CY]);
  const sector = useCallback((d: number, r0: number, r1: number): string => {
    const outer = `A ${r1} ${r1} 0 0 1 ${pt(xy(d + HALF, r1))}`;
    if (r0 < 1) return `M ${CX} ${CY} L ${pt(xy(d - HALF, r1))} ${outer} Z`;
    return [`M ${pt(xy(d - HALF, r1))}`, outer, `L ${pt(xy(d + HALF, r0))}`, `A ${r0} ${r0} 0 0 0 ${pt(xy(d - HALF, r0))}`, 'Z'].join(' ');
  }, [xy, CX, CY]);
  const lit = useMemo(() => new Set(highlight ?? []), [highlight]);

  /*
   * Échelle commune en racine (son choix du 05.09).
   * Hors pesée : fixée par la source et le profil. Pesée (EAU-SELS-UN-ECRAN, 22.11) : par les plages du style SEULES — une eau
   * de départ à 125 ppm de HCO₃ écrasait Mg, Na et HCO₃ au centre (« polygone écrasé »). Elle ne bouge pas pendant la
   * pesée ; une valeur au-delà est coupée au bord, chiffrée, et marquée ▲ (obtenu) ou d'un repère (départ).
   */
  const scale = useMemo(
    () => radarScaleMax(IONS.flatMap((ion) => pese ? [style.ions[ion].max] : [style.ions[ion].max, start[ion]])),
    [style, start, pese]
  );

  /*
   * Les anneaux, tous les 50 ppm — 100 quand l'échelle monte haut.
   * ⚠️ Le pas GRANDIT avec l'échelle, et la boucle est bornée en NOMBRE (le fuzz de saisie l'avait fait exploser).
   */
  const rings = useMemo(() => {
    const pas = Math.max(RING_STEP, Math.ceil(scale / 5 / RING_STEP) * RING_STEP);
    const out: number[] = [];
    for (let v = pas; v <= scale + 0.5 && out.length < 6; v += pas) out.push(v);
    return out;
  }, [scale]);

  /**
   * Du ppm au rayon — en RACINE, pas en droite : la racine étale le bas de l'échelle sans toucher à l'ordre ; « dedans ou
   * dehors » se lit exactement pareil. Les anneaux portent leur valeur en ppm.
   */
  const rayon = useCallback(
    (v: number) => R * Math.sqrt(Math.max(0, Math.min(1, v / scale))),
    [scale, R]
  );

  const axes = useMemo(
    () =>
      lectures.map(({ ion, band, targeted, value, reading }, i) => {
        const d = angle(i);
        const [lx, ly] = xy(d, LABEL_R);
        const [ex, ey] = xy(d, R);
        const cos = Math.cos(rad(d));
        const sin = Math.sin(rad(d));
        const haut = sin < -0.7, bas = sin > 0.7;
        return {
          ion,
          d,
          band,
          targeted,
          value,
          reading,
          ex,
          ey,
          /** −1 sous la fourchette, 1 au-dessus, 0 dedans. */
          out: !targeted ? 0 : value < band.min ? -1 : value > band.max ? 1 : 0,
          alarm: targeted && (value < band.min || value > band.max),
          rStart: rayon(start[ion]),
          startBeyond: Number.isFinite(start[ion]) && start[ion] > scale,
          rNow: rayon(value),
          rMin: rayon(band.min),
          rMax: rayon(band.max),
          lx,
          /*
           * Hors pesée : en haut et en bas, la place manque, le symbole et la valeur partagent une ligne. Sur les flancs elle
           * ne manque pas, et les trois lignes se centrent sur l'axe.
           */
          serre: Math.abs(sin) > 0.7,
          ly: haut ? 16 : bas ? CY + R + 18 : ly - 12,
          anchor: anchorAt(cos)
        };
      }),
    [lectures, start, rayon, xy, R, CY, LABEL_R, scale]
  );

  const path = (key: 'rStart' | 'rNow') =>
    axes.map((a) => pt(xy(a.d, a[key]))).join(' ');

  const résumé = axes
    .map(
      (a) =>
        `${ION_LABEL[a.ion]} (${ION_ROLE[a.ion]}) ${a.reading} ppm ${a.targeted ? `pour ${a.band.min} à ${a.band.max}` : 'sans cible renseignée'}` // virgule-ok : reading est le texte déjà formaté par formatIonReading
    )
    .join(', ');
  const kppm = potassium != null && Number.isFinite(potassium) && potassium > 0 ? Math.round(potassium) : null;
  const symboleTaille = fitToControls ? 14 : 12.5;
  const valeurTaille = fitToControls ? 19 : 17;
  const plageTaille = fitToControls ? 13 : 11.5;
  /* Pesée : boîtes posées (étiquettes, légende) — une graduation qui en touche une se tait. */
  const posees = disp ? [...Object.values(disp.etiquettes).map((e) => e!.r), ...(disp.legende ? [disp.legende.r] : [])] : [];
  const teinteDe = (ion: keyof WaterIons) => (lit.has(ion) ? STRAW : 'rgb(var(--cave-texte-200))');
  /** Les lignes d'une étiquette de pesée, rendues (étiquette visible ou gabarit). */
  const rendreLignes = (lignes: ReturnType<typeof lignesEtiquette>, ancre: 'start' | 'middle' | 'end', teinte: string, alarme: boolean, gras: boolean) =>
    lignes.map((l, i) => (
      <text key={i} x={0} y={l.y} textAnchor={ancre} style={HALO}>
        {l.m.map((m, j) => (
          <tspan key={j} fontSize={m.fs} dx={m.dx} fontWeight={m.gras || (gras && m.role === 'teinte') ? 700 : undefined}
            fill={m.role === 'valeur' ? (alarme ? AMBER : 'rgb(var(--cave-texte-200))') : teinte}>{m.t}</tspan>
        ))}
      </text>
    ));
  /** La légende de pesée (posée dans la toile) ; `k` : la ligne du potassium, hors des six axes. */
  const rendreLegende = (k: string | null) => (
    <>
      <line x1={0} x2={14} y1={-4} y2={-4} stroke={BLUE} strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={18} y={0}>départ</text>
      <line x1={0} x2={14} y1={11} y2={11} stroke={STRAW} strokeWidth={2.5} />
      <text x={18} y={15}>obtenu</text>
      <rect x={1} y={22} width={12} height={8} rx={1.5} fill={GREEN} fillOpacity={0.4} />
      <text x={18} y={30}>style</text>
      {k != null && <text data-radar-potassium x={0} y={45}>K⁺ <tspan fontWeight={700}>{k}</tspan> ppm</text>}
    </>
  );

  return (
    <div className={`water-radar ${className}`}>
      <svg
        /* BR-105 : l'étiquette du sommet dépassait le haut du cadre : 14 unités de marge en haut (géométrie d'origine). */
        viewBox={`0 ${geo.top} ${VW} ${VH - geo.top}`}
        {...(pese ? { width: VW, height: Math.ceil(VH - geo.top) } : {})}
        className={pese ? 'block mx-auto' : `block w-full mx-auto ${fitToControls ? 'sm:max-w-[30rem]' : 'max-w-[30rem]'}`}
        data-radar-pesee={pese || undefined}
        role="img"
        aria-label={`Profil ionique de l’eau corrigée face à la fourchette du style ${style.name} : ${résumé}${kppm != null ? `, potassium ${kppm} ppm hors des six axes` : ''}. Moyenne des eaux après sels et acides, avant apports des malts. Échelle fixe en racine carrée de 0 à ${nombreFr(scale, 1)} ppm ; valeurs supérieures au bord.`}
      >
        {/* Les anneaux et les rayons — le repère, jamais la donnée. */}
        {rings.map((ppm) => (
          <circle key={ppm} cx={CX} cy={CY} r={rayon(ppm)} fill="none" stroke={GRID} strokeWidth={ppm === scale ? 1.5 : 1} />
        ))}

        {/* La fourchette du style, un quartier par ion. */}
        {axes.filter(a => a.targeted).map((a) => (
          <path
            key={`s-${a.ion}`}
            data-ion-target={a.ion}
            d={sector(a.d, a.rMin, a.rMax)}
            fill={GREEN}
            fillOpacity={lit.has(a.ion) ? 0.5 : lit.size ? 0.14 : 0.28}
          >
            <title>{`${ION_SYMBOL[a.ion]} : ${a.band.min}–${nombreFr(a.band.max, 1)} ppm`}</title>
          </path>
        ))}

        {/* P12 : l'axe mis en avant ne se dessine plus en trait foncé — le secteur et l'étiquette le disent. */}
        {axes.map((a) => (
          <line key={`a-${a.ion}`} x1={CX} y1={CY} x2={a.ex} y2={a.ey} stroke={GRID}
            strokeWidth={lit.has(a.ion) && !pese ? 1.5 : 1} />
        ))}

        {/* L'eau de départ : un trait tireté, qui ne réclame pas l'attention. */}
        <polygon points={path('rStart')} fill="none" stroke={BLUE} strokeWidth={1.5} strokeDasharray="5 4" strokeLinejoin="round" />
        {pese && axes.filter(a => a.startBeyond).map((a) => {
          /* Départ au-delà de l'échelle : coupé au bord, un chevron dit « plus loin ». */
          const [x0, y0] = xy(a.d, R - 1);
          const [x1, y1] = xy(a.d - 5, R - 7);
          const [x2, y2] = xy(a.d + 5, R - 7);
          return <polyline key={`b-${a.ion}`} data-depart-au-dela={a.ion} points={`${x1.toFixed(1)},${y1.toFixed(1)} ${x0.toFixed(1)},${y0.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`}
            fill="none" stroke={BLUE} strokeWidth={1.5} />;
        })}

        {/* L'eau corrigée : c'est elle qu'on lit. */}
        <polygon points={path('rNow')} fill={STRAW} fillOpacity={0.12} stroke={STRAW} strokeWidth={2.5} strokeLinejoin="round" />

        {axes.map((a) => {
          const [x, y] = xy(a.d, a.rNow);
          return (
            <circle
              key={`d-${a.ion}`}
              cx={x}
              cy={y}
              r={lit.has(a.ion) ? 6 : 4.5}
              fill={!a.targeted ? 'rgb(var(--cave-texte-400))' : a.alarm ? AMBER : GREEN}
              stroke="rgb(var(--cave-950))"
              strokeWidth={1.5}
            />
          );
        })}

        {/*
          ⚠️ LA GRADUATION EN PPM, posée sur la diagonale entre le chlorure et le sulfate — le seul endroit du disque
          qu'aucune étiquette d'axe ne réclame.
        */}
        {rings.map((ppm) => {
          const [tx, ty] = xy(-60, rayon(ppm));
          // Pesée : la graduation dont la boîte toucherait une étiquette ou la légende se tait ; les autres gardent leur valeur.
          const demi = String(ppm).length * 3.4 + 1;
          if (pese && posees.some((p) => touche(p, { x: tx - demi, y: ty - 12, d: tx + demi, b: ty + 1 }, 2))) return null;
          return (
            <text key={`g-${ppm}`} x={tx} y={ty - 2} textAnchor="middle" fontSize={pese ? 11 : 10}
              fill={pese ? 'rgb(var(--cave-texte-200))' : 'rgb(var(--cave-texte-400))'} style={pese ? HALO : undefined}>
              {ppm}
            </text>
          );
        })}

        {pese && disp && axes.map((a) => {
          /* EAU-RADAR-ETIQUETTES : au bout de l'axe, à la place trouvée par `disposerEtiquettes`. */
          const e = disp.etiquettes[a.ion];
          if (!e) return null;
          const fleche = a.out !== 0 || a.value > scale ? (a.out === 1 || a.value > scale ? ' ▲' : ' ▼') : '';
          const lignes = lignesEtiquette(e.forme, symbolePese(a.ion), a.reading, fleche, plageDe(a.ion, a.targeted, a.band));
          return (
            <g key={`t-${a.ion}`} data-radar-etiquette={a.ion} data-forme={e.forme} transform={`translate(${e.tx.toFixed(1)} ${e.ty.toFixed(1)})`}>
              {rendreLignes(lignes, e.ancre, teinteDe(a.ion), a.alarm, lit.has(a.ion))}
            </g>
          );
        })}
        {pese && disp?.legende && (
          <g data-radar-legende aria-hidden fontSize={11} fill="rgb(var(--cave-texte-200))" style={HALO}
            transform={`translate(${disp.legende.tx.toFixed(1)} ${disp.legende.ty.toFixed(1)})`}>
            {rendreLegende(kppm != null ? String(kppm) : null)}
          </g>
        )}
        {/* Gabarits invisibles : mesurés par getBBox, jamais vus. Posés au centre, sous le dessin. */}
        {pese && (
          <g data-radar-gabarit visibility="hidden" aria-hidden transform={`translate(${CX} ${CY})`}>
            {gabarits.map((g) => (
              <g key={g.cle} ref={attacher(g.cle)}>{rendreLignes(g.lignes, g.ancre, STRAW, false, true)}</g>
            ))}
            <g ref={attacher('legende')} fontSize={11}>{rendreLegende(kppm != null ? '888' : null)}</g>
          </g>
        )}

        {!pese && axes.map((a) => {
          /* Le sens de l'écart, en petit : le chiffre reste le sujet. */
          const flèche = (a.out !== 0 || a.value > scale) && (
            <tspan fontSize={10} dy={-1}>
              {a.out === 1 || a.value > scale ? ' ▲' : ' ▼'}
            </tspan>
          );
          const valeur = (
            <tspan fontSize={valeurTaille} fontWeight={700} fill={a.alarm ? AMBER : 'rgb(var(--cave-texte-200))'}>
              {a.reading}
              {flèche}
            </tspan>
          );
          const teinte = lit.has(a.ion) ? STRAW : pese ? 'rgb(var(--cave-texte-200))' : 'rgb(var(--cave-texte-400))';
          return (
            <g key={`t-${a.ion}`} data-radar-etiquette={a.ion}>
              <text x={a.lx} y={a.ly} textAnchor={a.anchor} fontSize={symboleTaille} fill={teinte}
                fontWeight={lit.has(a.ion) && pese ? 700 : undefined} style={pese ? HALO : undefined}>
                {ION_SYMBOL[a.ion]}{pese && a.ion === 'hco3' ? ' moy.' : ''}
                {a.serre && <> {valeur}</>}
              </text>
              {!a.serre && (
                <text x={a.lx} y={a.ly + 17} textAnchor={a.anchor} fontSize={17}>
                  {valeur}
                </text>
              )}
              {/*
                ⚠️ La FOURCHETTE, et non plus un mot de goût : c'est la seule chose qu'on veut savoir devant la balance — où il
                faut tomber.
              */}
              <text x={a.lx} y={a.ly + (pese ? 14 : a.serre ? 17 : 31)} textAnchor={a.anchor} fontSize={plageTaille} fill={teinte}
                style={pese ? HALO : undefined}>
                {a.targeted ? `${a.band.min}–${a.band.max}` : 'sans cible'}
              </text>
            </g>
          );
        })}

      </svg>
      {!pese && <p className="water-radar-caption text-center text-2xs text-cave-400 leading-tight pb-0.5">
        Moyenne des eaux après sels et acides
        <span className="block">Avant apports des malts et ébullition</span>
      </p>}
      {pese && disp?.legendeDessous && <div className="water-radar-legend water-radar-legend-pesee flex flex-wrap justify-center gap-x-3 gap-y-1 text-2xs text-cave-400" style={{ height: LEGENDE_H }} aria-hidden>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-water" />départ</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-ebc-straw" />obtenu</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-hop/50" />style</span>
        {kppm != null && <span data-radar-potassium>K⁺ <strong>{kppm}</strong> ppm</span>}
      </div>}
      {!pese && <div className="water-radar-legend flex flex-wrap justify-center gap-x-3 gap-y-1 py-1 text-2xs text-cave-400" aria-hidden>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-water" />Départ</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-ebc-straw" />Après sels et acide</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-hop/50" />Cible</span>
      </div>}
    </div>
  );
};
