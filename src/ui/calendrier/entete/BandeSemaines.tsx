import React, { useEffect, useRef, useState } from 'react';
import { Clock, Lightbulb } from 'lucide-react';
import { dateDeSemaine } from '../../../domain/calendrier';
import { sg, variation, type SoldeSemaine } from './Courbe';
import { INITIALES } from './BandeAnnee';

/**
 * La bande des semaines (E04, E05, E36) : au repos, la semaine seule (S47…), sans solde, sans mouvement, sans icône (D-184). Un toucher donne
 * sa date (« S50, 7 – 13 déc. », i3). Le bouton ± affiche, sous chaque semaine, son + ou son − et les petites icônes (idée datée du carnet,
 * retard), puis les masque (D-185, D-186). Un appui long de 500 ms sur une semaine note une idée à cette date (L1 b, D-122).
 */
export interface SemaineBande { debut: string; numero: number }

export interface BandeSemainesProps {
  /** D442 : aujourd'hui hors de la vue, de ce côté : « ‹ auj. » s'y pose, les graduations sous lui se taisent (MARGE_AUJ). */
  masqueAuj?: 'gauche' | 'droite';
  /** Les semaines de la fenêtre, de la première à la dernière colonne. */
  semaines: readonly SemaineBande[];
  /** La courbe entière et l'index de la première colonne dans cette courbe : pour la variation de chaque semaine. */
  courbe: readonly SoldeSemaine[] | null;
  decalage: number;
  /** CAL-PASSE : le lundi de la semaine en cours (la courbe commence avant aujourd'hui : l'index 0 n'est plus « maintenant »). */
  lundiCourant?: string;
  mouvements: boolean;
  /** Lundis ISO qui portent une idée datée, et lundis qui portent un retard. */
  idees: ReadonlySet<string>;
  retards: ReadonlySet<string>;
  onDate: (lundi: string, colonne: number) => void;
  onIdeeSemaine?: (lundi: string) => void;
  /** La largeur mesurée d'une colonne (celle de la frise) : elle choisit le pas des étiquettes (CRITIQUE-7 n° 1). 0 : inconnue. */
  largeurColonne?: number;
  /** D385 (variante C) : présent, toucher une semaine la déplie en sept jours (sa date est alors dans son en-tête dépliée), au lieu de la bulle. */
  onDeplier?: (lundi: string) => void;
  /**
   * D432 (23.11, « Graduations sur la courbe ») : les bords de chaque semaine en px de la courbe (n + 1 valeurs). Présents, la bande se pose sur
   * l'axe de la courbe : le cadre couvre exactement ses semaines, celles d'avant et d'après en gris dans les marges (`dansCadre`, index).
   */
  abscisses?: readonly number[];
  dansCadre?: readonly [number, number];
  /** CAL-GRAIN-SUIT-DUREE (sur la courbe seulement) : jours jusqu'à 3 semaines dans le cadre, semaines au-delà, mois pour un an et plus. */
  grain?: GrainBande;
  /** Le jour ISO d'aujourd'hui (grain jour : son chiffre en encre). */
  aujourdhui?: string;
}

export type GrainBande = 'jour' | 'semaine' | 'mois' | 'an';
/** Le grain des graduations selon la largeur du cadre, en semaines (CAL-GRAIN-SUIT-DUREE). Les années au-delà de 3 ans (CAL-BANDE-JAMAIS-VIDE :
 *  de 2 à 3 ans, la bande ne posait que deux années ; les mois, un sur 2, 3 ou 6, en posent toujours au moins trois). */
export function grainDeFenetre(semaines: number): GrainBande {
  return semaines <= 3 ? 'jour' : semaines > 3 * 52 ? 'an' : semaines >= 52 ? 'mois' : 'semaine';
}

/** Grain jour : un chiffre tous les `pas` jours (1, 2 ou 7 : le lundi), le plus petit qui tient avec 4 px d'écart. */
export function pasJours(largeurJour: number, largeurChiffre: number): 1 | 2 | 7 {
  for (const pas of [1, 2] as const) if (pas * largeurJour >= largeurChiffre + ECART_ETIQUETTES) return pas;
  return 7;
}
const JOUR_MS = 86400000;
/** Les jours d'une semaine posés sur l'axe : centre en px de la cellule (la cellule peut être rognée au bord de la courbe). */
function joursDeCellule(lundi: string, largeurSemaine: number, largeurCellule: number, rogneeAGauche: boolean, pas: 1 | 2 | 7, aujourdhui?: string, premiere = false, derniere = false, marge = 8) {
  const t0 = Date.parse(`${lundi}T00:00:00Z`), dj = largeurSemaine / 7, decal = rogneeAGauche ? largeurSemaine - largeurCellule : 0;
  const sortie: Array<{ iso: string; x: number; n: number; auj: boolean }> = [];
  for (let d = 0; d < 7; d++) {
    const t = t0 + d * JOUR_MS, iso = new Date(t).toISOString().slice(0, 10);
    if (Math.round(t / JOUR_MS) % pas !== (pas === 7 ? Math.round(t0 / JOUR_MS) % 7 : 0)) continue;
    const x = (d + 0.5) * dj - decal;
    // un chiffre se pose sur son jour, même s'il déborde un peu de sa semaine ; seul celui qui sortirait de la courbe (premiere, derniere : moins de sa demi-largeur au bord, CAL-BANDE-JAMAIS-VIDE) se tait
    if (x < 0 || x > largeurCellule || (premiere && x < marge) || (derniere && x > largeurCellule - marge)) continue;
    sortie.push({ iso, x, n: Number(iso.slice(8, 10)), auj: iso === aujourdhui });
  }
  return sortie;
}

const DELAI = 500;

/**
 * Le pas des étiquettes (CRITIQUE-7 n° 1, E04, E07, E43) : en 6 mois à 390, 26 colonnes de 14 px ne tiennent pas « S53 » chacune
 * (« S47484950… »). Chaque semaine si « S53 » tient dans sa colonne avec 4 px d'écart ; sinon une sur deux, sinon une sur quatre (les semaines
 * rondes : S48, S52, S4…) ; sinon les mois, comme l'An (N D J F…). Colonne inconnue (0) : chaque semaine, comme avant.
 */
export type PasEtiquettes = 1 | 2 | 4 | 'mois' | 'an';
export const ECART_ETIQUETTES = 4;
export function pasEtiquettes(largeurColonne: number, largeurEtiquette: number): PasEtiquettes {
  if (!(largeurColonne > 0)) return 1;
  const besoin = largeurEtiquette + ECART_ETIQUETTES;
  for (const pas of [1, 2, 4] as const) if (pas * largeurColonne >= besoin) return pas;
  return 'mois';
}

/** La largeur de « S53 », l'étiquette la plus large, dans la police de la bande (14 px, 600) ; hors navigateur, la chasse de Source Sans 3. */
let largeurS53: number | null = null;
export function largeurEtiquetteMax(): number {
  if (largeurS53 !== null) return largeurS53;
  let w = 0;
  try {
    const c = typeof document !== 'undefined' && !/jsdom/i.test(navigator.userAgent) ? document.createElement('canvas').getContext('2d') : null;
    if (c) {
      c.font = `600 14px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
      w = Math.ceil(c.measureText('S53').width);
    }
  } catch { w = 0; }
  // Ne se garde que mesurée avec la police chargée (la première mesure peut tomber sur la police de repli, plus large ou plus étroite).
  if (w > 0 && (typeof document === 'undefined' || !document.fonts || document.fonts.status === 'loaded')) largeurS53 = w;
  return w > 0 ? w : 23;
}

/** Le mois (0 à 11) du jeudi d'une semaine (ISO 8601), comme la bande de l'An. */
const moisDuJeudi = (lundi: string): number => new Date(Date.parse(`${lundi}T00:00:00Z`) + 3 * 86400000).getUTCMonth();

/**
 * Les repères d'un pas de 2 ou 4 (CHV-13) : un repère toutes les `pas` colonnes, sans trou ni écart double. L'ancre est la première semaine de
 * l'année quand la fenêtre passe le nouvel an (S52, S53 puis S1 : « S50 S52 S2 » sautait S53 et S1 et faisait un écart de 3) ; sans nouvel an,
 * la première semaine dont le numéro est un multiple du pas (S44, S46…). Les colonnes se comptent, pas les numéros : une année à 53 semaines
 * ou à 52 garde le même rythme.
 */
export function reperesReguliers(semaines: readonly SemaineBande[], pas: 1 | 2 | 4): Array<[number, string]> {
  const an = semaines.findIndex((s, k) => k > 0 && s.numero < semaines[k - 1].numero);
  const ancre = an >= 0 ? an : semaines.findIndex(s => s.numero % pas === 0);
  if (ancre < 0) return [];
  const sortie: Array<[number, string]> = [];
  for (let k = ancre % pas; k < semaines.length; k += pas) sortie.push([k, `S${semaines[k].numero}`]);
  return sortie;
}

/**
 * Les étiquettes visibles de la bande : l'index de la colonne et son texte. Avec un pas de 2 ou 4, les semaines dont le numéro en est un multiple ;
 * en mois, l'initiale du mois à la première semaine de chaque mois (celle de son jeudi). Garde-fou : une étiquette trop près de la précédente
 * (fin et début d'année, mois entamé à la première colonne) n'est pas posée ; aucune n'en chevauche une autre.
 */
export function etiquettesBande(semaines: readonly SemaineBande[], pas: PasEtiquettes, largeurColonne: number, largeurEtiquette: number): Map<number, string> {
  const res = new Map<number, string>();
  const candidates: Array<[number, string]> = pas === 'an'
    ? semaines.flatMap((s, k) => (k > 0 && s.debut.slice(0, 4) !== semaines[k - 1].debut.slice(0, 4) ? [[k, s.debut.slice(0, 4)] as [number, string]] : []))
    : pas === 'mois'
    ? semaines.flatMap((s, k) => (k === 0 || moisDuJeudi(s.debut) !== moisDuJeudi(semaines[k - 1].debut) ? [[k, INITIALES[moisDuJeudi(s.debut)]] as [number, string]] : []))
    : reperesReguliers(semaines, pas);
  if (!(largeurColonne > 0)) { candidates.forEach(([k, t]) => res.set(k, t)); return res; }
  const largeur = (t: string) => (t.length === 1 ? Math.ceil(largeurEtiquette / 2) : t.length === 4 ? Math.ceil(largeurEtiquette * 1.4) : largeurEtiquette);
  let derniere: [number, string] | null = null;
  for (const [k, t] of candidates) {
    if (derniere && (k - derniere[0]) * largeurColonne < (largeur(derniere[1]) + largeur(t)) / 2 + ECART_ETIQUETTES) {
      // Le mois entamé de la première colonne cède la place au mois entier qui le suit (« D » plutôt que la fin de « N »).
      if (pas === 'mois' && derniere[0] === 0 && res.size === 1) { res.clear(); res.set(k, t); derniere = [k, t]; }
      continue;
    }
    res.set(k, t);
    derniere = [k, t];
  }
  return res;
}

/**
 * CAL-GRILLE-SUR-GRADUATIONS (23.11, « le découpage en section … c'est pas corrélé à l'échelle ») : le x (px de la courbe) de chaque graduation
 * que la bande posée sur la courbe montre, au même grain (jours, semaines, mois) : le centre de chaque chiffre de jour, de chaque « S.. » ou
 * initiale de mois posé. Les rangées tirent leurs lignes de là. Même calcul que le rendu (pas, étiquettes, semaine rognée).
 */
/** D442 (maquette B, hors de la vue) : la place de « ‹ auj. » au bord ; aucune graduation n'y tient. */
export const MARGE_AUJ = 56;
const sousAuj = (masque: 'gauche' | 'droite' | undefined, x: number, largeur: number) => (masque === 'gauche' ? x < MARGE_AUJ : masque === 'droite' ? x > largeur - MARGE_AUJ : false);

export function graduationsBande(semaines: readonly SemaineBande[], abscisses: readonly number[], grain: GrainBande, largeurColonne: number, masqueAuj?: 'gauche' | 'droite'): number[] {
  const a = abscisses;
  if (a.length !== semaines.length + 1 || !(largeurColonne > 0)) return [];
  const larg = a[a.length - 1];
  const wEtiquette = largeurEtiquetteMax();
  const xs: number[] = [];
  if (grain === 'jour') {
    const pasJ = pasJours(largeurColonne / 7, Math.ceil(wEtiquette * 0.75));
    semaines.forEach((s, k) => joursDeCellule(s.debut, largeurColonne, a[k + 1] - a[k], k === 0 && a[1] - a[0] < largeurColonne - 0.5, pasJ, undefined, k === 0, k === semaines.length - 1, Math.ceil(wEtiquette * 0.75) / 2)
      .forEach(j => { if (!sousAuj(masqueAuj, a[k] + j.x, larg)) xs.push(a[k] + j.x); }));
    return xs;
  }
  /* CAL-SEMAINE-ENTRE-TRAITS (23.11, « une semaine, donc une durée est sur un trait alors que en théorie ça devrait être entre … pareil pour
     les moi, seul les jours sont fix ») : une semaine, un mois, une année sont des durées ; leurs traits sont leurs LIMITES (lundi 0 h, 1er du
     mois, 1er janvier) et leur nom se lit entre deux traits. Les jours (plus haut) restent sur leur trait. */
  const pas: PasEtiquettes = grain === 'mois' || grain === 'an' ? grain : pasEtiquettes(largeurColonne, wEtiquette);
  const limites = pas !== 1 ? periodesBande(semaines, a, pas, largeurColonne, wEtiquette).limites : a.filter(x => x > a[0] + 0.5 && x < larg - 0.5);
  return limites.filter(x => !sousAuj(masqueAuj, x, larg));
}

/** Un pas de 2 ou 4 semaines (« S53 » ne tient pas entre deux lundis) : chaque nom couvre son groupe de semaines, entre le lundi de sa semaine et
 *  celui du groupe suivant ; les traits sont ces lundis. */
function groupesDeSemaines(semaines: readonly SemaineBande[], a: readonly number[], pas: 2 | 4, wEtiquette: number) {
  const n = semaines.length, g = a[0], larg = a[n];
  const limites: number[] = [], noms: NomPeriode[] = [];
  for (const [k, texte] of reperesReguliers(semaines, pas)) {
    const x0 = a[k], x1 = a[Math.min(n, k + pas)];
    if (x0 > g + 0.5 && x0 < larg - 0.5) limites.push(x0);
    const l = Math.max(g, x0), r = Math.min(larg, x1);
    if (r - l < wEtiquette + ECART_ETIQUETTES) continue;
    const x = (l + r) / 2;
    noms.push({ k, texte, x, decal: x - (a[k] + a[k + 1]) / 2, periode: semaines[k].debut });
  }
  return { limites, noms };
}

/** Un nom de mois ou d'année posé sur la bande : la colonne (semaine) qui le porte, son x (px de la courbe) et son écart au centre de la colonne. */
export interface NomPeriode { k: number; texte: string; x: number; decal: number; periode: string }

/**
 * CAL-SEMAINE-ENTRE-TRAITS : les mois (ou les années) de la bande posée sur la courbe : leurs limites (le x du 1er du mois, du 1er janvier) et
 * leurs noms, chacun au milieu de sa part visible (entre ses deux traits, ou un trait et le bord de la courbe). Un mois dont la part visible ne
 * tient pas son nom reste sans nom. Le x d'un jour : linéaire sur la bande (une semaine = `largeurColonne`, la même transformation que la courbe).
 */
export function periodesBande(semaines: readonly SemaineBande[], abscisses: readonly number[], pas: 2 | 4 | 'mois' | 'an', largeurColonne: number, wEtiquette: number): { limites: number[]; noms: NomPeriode[] } {
  const a = abscisses, n = semaines.length;
  if (!n || a.length !== n + 1 || !(largeurColonne > 0)) return { limites: [], noms: [] };
  if (pas === 2 || pas === 4) return groupesDeSemaines(semaines, a, pas, wEtiquette);
  const g = a[0], larg = a[n], ref = n > 1 ? a[1] - largeurColonne : a[0];
  const t0 = Date.parse(`${semaines[0].debut}T00:00:00Z`);
  const X = (iso: string) => ref + ((Date.parse(`${iso}T00:00:00Z`) - t0) / JOUR_MS) * (largeurColonne / 7);
  const suivant = (iso: string) => (pas === 'mois' ? (Number(iso.slice(5, 7)) === 12 ? `${Number(iso.slice(0, 4)) + 1}-01-01` : `${iso.slice(0, 5)}${String(Number(iso.slice(5, 7)) + 1).padStart(2, '0')}-01`) : `${Number(iso.slice(0, 4)) + 1}-01-01`);
  const fin = new Date(t0 + 7 * n * JOUR_MS).toISOString().slice(0, 10);
  /* CAL-BANDE-JAMAIS-VIDE (23.11, « Répare déjà ça » : à 20 mois, aucun mois ne tenait son initiale entre ses deux traits, la bande était vide) :
     quand un mois de 30 jours ne tient plus son initiale, un mois sur 2, 3 ou 6 se nomme (janvier, puis un rythme régulier) ; de même une année
     sur 2, 5 ou 10 quand « 2026 » ne tient plus dans un an, au milieu de sa part
     visible ; son nom peut déborder ses traits, jamais le bord de la courbe ni le nom voisin. Tous les traits des mois restent (graduations). */
  const besoin = (pas === 'mois' ? Math.ceil(wEtiquette / 2) : Math.ceil(wEtiquette * 1.4)) + ECART_ETIQUETTES, lJour = largeurColonne / 7;
  const saut = pas === 'mois'
    ? (30 * lJour >= besoin ? 1 : [2, 3, 6].find(s => s * 28 * lJour >= besoin) ?? 12)
    : (365 * lJour >= besoin ? 1 : [2, 5, 10].find(s => s * 365 * lJour >= besoin) ?? 20);
  const rang = (iso: string) => (pas === 'mois' ? Number(iso.slice(5, 7)) - 1 : Number(iso.slice(0, 4)));
  const limites: number[] = [], noms: NomPeriode[] = [];
  let l0 = Infinity; // le début (1er du mois) du premier mois nommé : avant g, il est entamé
  for (let d = pas === 'mois' ? `${semaines[0].debut.slice(0, 7)}-01` : `${semaines[0].debut.slice(0, 4)}-01-01`; d < fin; d = suivant(d)) {
    const x0 = X(d), x1 = X(suivant(d));
    if (x0 > g + 0.5 && x0 < larg - 0.5) limites.push(x0);
    const texte = pas === 'mois' ? INITIALES[Number(d.slice(5, 7)) - 1] : d.slice(0, 4);
    const wt = texte.length === 1 ? Math.ceil(wEtiquette / 2) : Math.ceil(wEtiquette * 1.4);
    const l = Math.max(g, x0), r = Math.min(larg, x1);
    if (saut > 1) {
      if (rang(d) % saut !== 0 || r - l < wt / 2 || (l + r) / 2 - wt / 2 < g || (l + r) / 2 + wt / 2 > larg) continue;
    } else if (r - l < wt + ECART_ETIQUETTES) continue;
    const x = (l + r) / 2;
    let k = 0;
    while (k < n - 1 && x >= a[k + 1]) k++;
    // un mois sur deux ou plus : la période entamée au bord gauche cède la place à la période entière qui le suit s'ils se touchent
    if (saut > 1 && noms.length && x - noms[noms.length - 1].x < wt + ECART_ETIQUETTES) { if (noms.length === 1 && l0 < g) noms.pop(); else continue; }
    noms.push({ k, texte, x, decal: x - (a[k] + a[k + 1]) / 2, periode: pas === 'mois' ? d.slice(0, 7) : d.slice(0, 4) });
    if (noms.length === 1) l0 = x0;
  }
  return { limites, noms };
}

/**
 * CAL-BANDE-JAMAIS-VIDE (23.11, 20 mois : bande vide) : les noms que la bande posée sur la courbe montre, avec leur centre et leur largeur
 * (px de la courbe), par le même calcul que le rendu (jours, semaines, groupes, mois, années). Sert aux contrôles : jamais vide, jamais rogné.
 */
export function etiquettesPosees(semaines: readonly SemaineBande[], abscisses: readonly number[], grain: GrainBande, largeurColonne: number, wEtiquette = largeurEtiquetteMax()): Array<{ texte: string; x: number; w: number }> {
  const a = abscisses, n = semaines.length;
  if (!n || a.length !== n + 1 || !(largeurColonne > 0)) return [];
  const larg = (t: string) => (t.length === 1 ? Math.ceil(wEtiquette / 2) : t.length === 4 ? Math.ceil(wEtiquette * 1.4) : wEtiquette);
  if (grain === 'jour') {
    const pasJ = pasJours(largeurColonne / 7, Math.ceil(wEtiquette * 0.75));
    return semaines.flatMap((s, k) => joursDeCellule(s.debut, largeurColonne, a[k + 1] - a[k], k === 0 && a[1] - a[0] < largeurColonne - 0.5, pasJ, undefined, k === 0, k === n - 1, Math.ceil(wEtiquette * 0.75) / 2)
      .map(j => ({ texte: String(j.n), x: a[k] + j.x, w: Math.ceil(wEtiquette * 0.75) })));
  }
  const pas: PasEtiquettes = grain === 'mois' || grain === 'an' ? grain : pasEtiquettes(largeurColonne, wEtiquette);
  if (pas !== 1) return periodesBande(semaines, a, pas, largeurColonne, wEtiquette).noms.map(p => ({ texte: p.texte, x: p.x, w: larg(p.texte) }));
  return semaines.flatMap((s, k) => (a[k + 1] - a[k] < 0.6 * largeurColonne ? [] : [{ texte: `S${s.numero}`, x: (a[k] + a[k + 1]) / 2, w: wEtiquette }]));
}

export function BandeSemaines({ masqueAuj, semaines, courbe, decalage, mouvements, idees, retards, onDate, onIdeeSemaine, largeurColonne = 0, onDeplier, lundiCourant, abscisses, dansCadre, grain, aujourdhui }: BandeSemainesProps) {
  const surCourbe = !!abscisses && abscisses.length === semaines.length + 1;
  /* CAL-PLUS-QU-UN-AN (tour 20, en ligne) : la première colonne commence en abscisses[0] (la marge avant le début de l'horizon, passé compris) ;
     sans ce retrait, toute la bande glissait de la marge (56 px) à gauche de la courbe et des rangées. */
  /* Chrome pose les pistes au 1/64 de px : au-delà d'un an (313 colonnes de moins d'un px), l'arrondi de chacune s'ajoutait (1 px de dérive au bout).
     Chaque piste est la différence de deux bords arrondis au 1/64 : la somme tombe juste. */
  const au64 = (x: number) => Math.round(x * 64) / 64;
  const colonnesCourbe = surCourbe ? abscisses!.slice(1).map((x, k) => `${Math.max(0, au64(x) - au64(abscisses![k]))}px`).join(' ') : undefined;
  const appui = useRef<{ id: number; x: number; y: number; timer: ReturnType<typeof setTimeout>; long: boolean } | null>(null);
  const annule = () => { if (appui.current) { clearTimeout(appui.current.timer); appui.current = null; } };
  const wEtiquette = largeurEtiquetteMax();
  const pas: PasEtiquettes = surCourbe && (grain === 'mois' || grain === 'an') ? grain : pasEtiquettes(largeurColonne, wEtiquette);
  const etiquettes = pas === 1 ? null : etiquettesBande(semaines, pas, largeurColonne, wEtiquette);
  /* CAL-SEMAINE-ENTRE-TRAITS : sur la courbe, un groupe de semaines, un mois, une année se nomme au milieu de sa part visible, entre ses deux traits */
  const periodes = surCourbe && pas !== 1 ? new Map(periodesBande(semaines, abscisses!, pas, largeurColonne, wEtiquette).noms.map(p => [p.k, p] as const)) : null;
  const enJours = surCourbe && grain === 'jour' && largeurColonne > 0;
  const larg = surCourbe ? abscisses![abscisses!.length - 1] : 0;
  const tue = (x: number) => surCourbe && sousAuj(masqueAuj, x, larg);
  /* D442 : le mois d'aujourd'hui en bleu gras (maquette B, « N ») */
  const moisAuj = aujourdhui ? aujourdhui.slice(0, 7) : null;
  const jeudi = (lundi: string) => new Date(Date.parse(`${lundi}T00:00:00Z`) + 3 * 86400000).toISOString().slice(0, 7);
  const pasJ = enJours ? pasJours(largeurColonne / 7, Math.ceil(wEtiquette * 0.75)) : 1;
  // CRITIQUE-9 (doute « cadre noir sur S48 », m390-11) : l'anneau de focus d'une colonne n'est que pour le clavier. Après un toucher ou un clic
  // (où qu'il soit sur la page), une colonne qui reçoit le focus (rendu par une feuille qui se ferme, focus programmé) ne le montre pas, même si
  // le navigateur la dit `:focus-visible` ; une touche du clavier le rend (entete.css, `.ent-bd[data-doigt]`).
  const [doigt, setDoigt] = useState(false);
  useEffect(() => {
    const parDoigt = () => setDoigt(true);
    const parClavier = (e: KeyboardEvent) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) setDoigt(false); };
    document.addEventListener('pointerdown', parDoigt, true);
    document.addEventListener('keydown', parClavier, true);
    return () => { document.removeEventListener('pointerdown', parDoigt, true); document.removeEventListener('keydown', parClavier, true); };
  }, []);
  return (
    <div className="ent-bd" data-bande-semaines data-pas={pas} data-doigt={doigt ? 'oui' : undefined} role="group" aria-label="Semaines ; ± affiche les mouvements et les icônes" style={{ ['--n' as string]: semaines.length, ...(colonnesCourbe ? { gridTemplateColumns: colonnesCourbe, paddingLeft: au64(abscisses![0]) } : {}) }} data-sur-courbe={surCourbe ? 'oui' : undefined} data-grain={surCourbe ? (enJours ? 'jour' : pas === 'mois' || pas === 'an' ? pas : 'semaine') : undefined}>
      {semaines.map((s, k) => {
        const v = courbe ? variation(courbe, decalage + k) : null;
        const idee = idees.has(s.debut), retard = retards.has(s.debut);
        const hors = surCourbe && dansCadre ? k < dansCadre[0] || k >= dansCadre[1] : false;
        /* une semaine coupée au bord de la courbe (moins des 3/5 d'une semaine) garde sa place, sans son nom (il serait coupé) */
        const coupee = surCourbe && largeurColonne > 0 && abscisses![k + 1] - abscisses![k] < 0.6 * largeurColonne;
        return (
          <button key={s.debut} type="button" className="ent-bd-c" data-semaine={s.numero} data-lundi={s.debut} data-hors={hors ? 'oui' : undefined} data-courant={(lundiCourant ? s.debut === lundiCourant : decalage + k === 0) ? 'oui' : undefined}
            aria-label={`${dateDeSemaine(s.debut)}${mouvements && v !== null ? ` ; mouvement ${sg(v)}` : ''}${mouvements && idee ? ' ; idée du carnet' : ''}${mouvements && retard ? ' ; en retard' : ''}`}
            onPointerDown={e => {
              if (e.button > 0 || !onIdeeSemaine) return;
              annule();
              const timer = setTimeout(() => { if (appui.current) { appui.current.long = true; onIdeeSemaine(s.debut); } }, DELAI);
              appui.current = { id: e.pointerId, x: e.clientX, y: e.clientY, timer, long: false };
            }}
            onPointerMove={e => { const a = appui.current; if (a && !a.long && Math.hypot(e.clientX - a.x, e.clientY - a.y) > 8) annule(); }}
            onPointerUp={() => { if (appui.current && !appui.current.long) annule(); }}
            onPointerCancel={annule}
            onContextMenu={e => e.preventDefault()}
            onClick={() => {
              // L'appui long a déjà ouvert l'idée : le toucher qui suit ne donne pas la date.
              if (appui.current?.long) { appui.current = null; return; }
              if (onDeplier) onDeplier(s.debut);
              else onDate(s.debut, k);
            }}>
            {/* Pas de 2, 4 ou mois : seules les étiquettes posées se lisent ; chaque colonne reste touchable et garde son nom (« S50, 7 – 13 déc. »). */}
            {enJours ? (
              <span className="ent-bd-js" aria-hidden="true">
                {joursDeCellule(s.debut, largeurColonne, abscisses![k + 1] - abscisses![k], k === 0 && abscisses![1] - abscisses![0] < largeurColonne - 0.5, pasJ, aujourdhui, k === 0, k === semaines.length - 1, Math.ceil(wEtiquette * 0.75) / 2)
                  .filter(j => !tue(abscisses![k] + j.x)).map(j => <span key={j.iso} className="ent-bd-j" data-jour={j.iso} data-auj={j.auj ? 'oui' : undefined} style={{ left: j.x }}>{j.n}</span>)}
              </span>
            ) : periodes ? (() => { const p = periodes.get(k); return p && !tue(p.x) ? <span className="ent-sem ent-sem--pas" aria-hidden="true" data-periode={p.periode} style={{ position: 'relative', left: Math.round(p.decal * 10) / 10 }} data-auj-mois={pas === 'mois' && moisAuj === p.periode ? 'oui' : undefined}>{p.texte}</span> : null; })()
              : coupee || tue((abscisses?.[k] ?? 0) / 2 + (abscisses?.[k + 1] ?? 0) / 2) ? null : etiquettes === null ? <span className="ent-sem">{`S${s.numero}`}</span>
              : etiquettes.has(k) ? <span className="ent-sem ent-sem--pas" aria-hidden="true" data-auj-mois={pas === 'mois' && moisAuj && jeudi(s.debut) === moisAuj ? 'oui' : undefined}>{etiquettes.get(k)}</span> : null}
            {mouvements && (
              <span className="ent-bd-m">
                {v !== null && <span className={v < 0 ? 'ent-m' : 'ent-p'}>{sg(v)}</span>}
                {(idee || retard) && (
                  <span className="ent-ic">
                    {retard && <Clock size={14} strokeWidth={2.4} aria-hidden="true" />}
                    {idee && <Lightbulb size={14} strokeWidth={2.4} aria-hidden="true" />}
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
