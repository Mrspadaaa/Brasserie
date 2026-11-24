import React, { useEffect, useRef, useState } from 'react';
import { bornes, etiquetteCourte, type Periode } from '../../../components/periode/periode';
import { lundiDe, numeroSemaine } from '../../../domain/calendrier';
import { ajouterJours, jourCourt, largeurTexte, placeEtiquette, type Boite } from './Courbe';
import { cadrerDeuxBouts, CIBLE_PX, MARGE_BOUTS_PX, poserPlage, RECALAGE_MS, useGlisse, zonesBords } from '../../geste';
import { rentrer, vueDansRepere, type VueEcran } from '../frise/prisesBord';
import { plafondFenetre, vitesseCalendrier } from '../frise/defileBord';
import { avalerClicSuivant } from '../usePointeurCourbe';

/**
 * La fenêtre (E06, c1-d) : le cadre posé sur la courbe, ses deux poignées, l'étiquette « S47 – S52 » qui suit le doigt ; et le lien avec la
 * période de l'app (E07, ET-PER) : la fenêtre ET la période sont la même chose, écrite sous la forme `Periode` de `dates`.
 */

/* D444 : la fenêtre, sa période et leur lecture l'une dans l'autre vivent dans le temps de la frise (d3-time), une seule fois */
import { fenetreDePeriode, type FenetreSemaines } from '../../../domain/calendrier/temps';
export { fenetreDePeriode, MOIS_MIN_SEMAINES, periodeDeFenetre, semainesEntre, type FenetreSemaines } from '../../../domain/calendrier/temps';

export const SEMAINES_ANNEE = 52;
/** Part de la largeur au-delà de laquelle la poignée lâchée ouvre l'année (c1-d). */
const SEUIL_ANNEE = 0.8;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Le texte du bouton de période : « 6 sem. », « 3 mois », « 6 mois », « An », ou le nombre de semaines tel quel. */
export function libelleDuree(semaines: number, annee: boolean): string {
  // CAL-PLUS-QU-UN-AN : au-delà de l'An, les années entières (« 2 ans ») ou les mois (« 18 mois »)
  if (semaines > SEMAINES_ANNEE + 1) {
    const ans = semaines / 52.18;
    if (Math.abs(ans - Math.round(ans)) < 0.04 && Math.round(ans) === 1) return 'An';
    /* T29-12 (23.11, « 31 mois », « 46 mois », « 63 mois » : attendu « 2 ans ½ », « 5 ans ») : dès deux ans, des années au demi-an près (le quart
       s'arrondit vers le bas) ; en dessous, les mois (« 18 mois ») */
    if (ans < 1.95) return `${Math.round(semaines / 4.348)} mois`;
    const demis = Math.ceil(ans * 2 - 0.55);
    return demis % 2 ? `${(demis - 1) / 2} ans ½` : `${demis / 2} ans`;
  }
  if (annee || semaines >= SEMAINES_ANNEE) return 'An';
  if (semaines === 13) return '3 mois';
  if (semaines === 26) return '6 mois';
  return `${semaines} sem.`;
}

/**
 * Le texte du bouton de période (CRITIQUE-5 n° 18, E07 ET-PER) : la période de l'app est la même partout. Quand elle est un mois, un trimestre
 * ou une année (réglée dans la barre de l'app ou Finances) et que la fenêtre montre ses semaines, le bouton dit le même libellé que la barre
 * (`etiquetteCourte` : « Nov. », « T4 », « 2026 ») ; sinon, les formes du calendrier (« 6 sem. », « 3 mois », « 6 mois », « An »).
 */
export function libellePeriode(periode: Periode | undefined, fenetre: FenetreSemaines, premierLundi: string, total: number, annee: boolean): string {
  if (!annee && periode && (periode.genre === 'mois' || periode.genre === 'trimestre' || periode.genre === 'annee')) {
    const f = fenetreDePeriode(periode, premierLundi, total);
    if (f && f.du === fenetre.du && f.semaines === fenetre.semaines) return etiquetteCourte(periode);
  }
  return libelleDuree(fenetre.semaines, annee);
}

export interface CadreProps {
  /** Les numéros ISO des semaines de la courbe (52). */
  numeros: readonly number[];
  /** Les lundis ISO des mêmes semaines : l'année d'une semaine de fin dans l'année suivante (« S47 – S45 2027 »). */
  lundis?: readonly string[];
  index: number;
  nombre: number;
  largeur: number;
  /** Vue de l'année : le cadre remplit la courbe. */
  annee: boolean;
  /** Le geste a posé une autre fenêtre (début, fin ou les deux). */
  onChange: (f: { index: number; nombre: number }) => void;
  /** Entrée au clavier sur la poignée de fin : l'année. */
  onAnnee: () => void;
  /** Un toucher sur la poignée, dans l'année : on revient à la fenêtre d'avant. */
  onRevient?: () => void;
  /** Pendant le tirage, la boîte de l'étiquette qui suit le doigt (les noms qu'elle couvrirait s'effacent) ; `null` au lâcher. */
  onTirage?: (boite: Boite | null) => void;
  /** CAL-ECHELLE-SUIT-CADRE (2e refus, 23.11) : la fenêtre sous le doigt pendant le geste (début, nombre de semaines) ; `null` au lâcher. La bande
   *  des graduations la suit en direct (gris, grain), pas seulement au lâcher. */
  onTire?: (f: { index: number; nombre: number } | null) => void;
  /** Le nœud de la courbe : le geste s'y attache (le doigt posé à plus de 22 px du cadre fait défiler la fenêtre, CAL-SANS-LECTURE). */
  surface: React.RefObject<HTMLElement | null>;
  /** Dans l'année, l'étiquette dit les mois (« nov. – oct. »), jamais « S47 – S45 » (c1-d). */
  etiquetteAnnee?: string;
  /** T9-2 : aujourd'hui (ISO), l'année de référence de l'étiquette. */
  aujourdhui?: string;
  /** CAL-PASSE : la courbe commence avant aujourd'hui ; la prise de la poignée de début reste dans l'écran même à la première semaine. */
  debutRamenee?: boolean;
  /** R4 : la vue de la courbe (semaines), celle où se posent le cadre et ses poignées. */
  vue: VueCourbe;
  /** CAL-ETIQUETTE-GRAIN-AU-DESSUS : le grain de la bande ; en jours, le cadre dit ses semaines avec l'année (« S52 2026 – S1 2027 »). */
  grain?: 'jour' | 'semaine' | 'mois' | 'an';
  /** R7, R10 : pendant le tirage, la vue qui défile ou se resserre, puis son recalage ; `null` : la vue du repos. */
  onVue?: (v: VueCourbe | null) => void;
}

/** L'année ISO d'une semaine : celle de son jeudi. */
const anneeIso = (lundi: string): number => Number(ajouterJours(lundi, 3).slice(0, 4));

/**
 * L'étiquette du cadre : les semaines, ou les mois dans l'année. Une semaine de fin dans l'année qui suit la première semaine de la courbe porte
 * son année (« S47 – S45 2027 », CRITIQUE-3 n° 24) : sans elle, S45 se lit comme une semaine passée.
 */
export function etiquetteCadre(numeros: readonly number[], index: number, nombre: number, annee: boolean, etiquetteAnnee?: string, lundis?: readonly string[], aujourdhui?: string): string {
  if (annee && etiquetteAnnee) return etiquetteAnnee;
  const total = numeros.length;
  const fin = Math.min(total - 1, index + nombre - 1);
  /*
   * T9-2 (tour 9, 22.11, « bute sur S47 ») : la courbe commence un an avant aujourd'hui (CAL-PASSE) ; la référence de l'année est celle
   * d'aujourd'hui, plus la première semaine de la courbe. Un début dans une autre année que la fin, ou hors de l'année en cours, porte la
   * sienne : « S47 2025 – S52 2026 », jamais « S47 – S52 2026 » qui se lit comme la fenêtre d'avant le geste.
   */
  const ref = aujourdhui ? anneeIso(lundiDe(aujourdhui)) : lundis?.[0] ? anneeIso(lundis[0]) : null;
  const ya = lundis?.[index] ? anneeIso(lundis[index]) : null, yb = lundis?.[fin] ? anneeIso(lundis[fin]) : null;
  const anA = ya !== null && ref !== null && ya !== ref && ya !== yb ? ` ${ya}` : '';
  const anB = yb !== null && ref !== null && (yb !== ref || (ya !== null && ya !== yb)) ? ` ${yb}` : '';
  // CHG-7 : une semaine se dit une fois (« S40 »), jamais « S40 – S40 »
  if (fin <= index) return `S${numeros[index] ?? ''}${anB || anA}`;
  return `S${numeros[index] ?? ''}${anA} – S${numeros[fin] ?? ''}${anB}`;
}

/**
 * D434 (23.11, « Dates sur le cadre ») : le cadre dit ses dates, du lundi de sa première semaine au dimanche de sa dernière (« 26 oct. – 6 déc. ») ;
 * les graduations disent les semaines, chaque chose une fois. L'année s'écrit au bout quand elle n'est pas celle d'aujourd'hui, et aux deux
 * bouts quand ils n'ont pas la même. Une semaine : ses jours (« 16–22 nov. »). `null` : semaines inconnues.
 */
export function etiquetteDates(lundis: readonly string[] | undefined, index: number, nombre: number, aujourdhui?: string): string | null {
  const a = lundis?.[index], l = lundis?.[Math.min(lundis.length - 1, index + Math.max(1, nombre) - 1)];
  if (!a || !l) return null;
  if (nombre <= 1 || l === a) return joursSemaine(a);
  const b = ajouterJours(l, 6), ya = a.slice(0, 4), yb = b.slice(0, 4), ref = aujourdhui?.slice(0, 4);
  return `${jourCourt(a)}${ya !== yb ? ` ${ya}` : ''} – ${jourCourt(b)}${yb !== ref || ya !== yb ? ` ${yb}` : ''}`;
}

/** L'année ISO d'une semaine (celle de son jeudi) et son numéro : « S52 2026 » ; deux bouts : « S52 2026 – S1 2027 », « S47 – S49 2026 ». */
export function etiquetteSemainesAnnees(lundis: readonly string[], index: number, nombre: number): string {
  const a = lundis[index], b = lundis[Math.min(lundis.length - 1, index + Math.max(1, nombre) - 1)];
  if (!a || !b) return '';
  const s = (l: string) => `S${numeroSemaine(l)}`, an = (l: string) => anneeIso(l);
  if (a === b) return `${s(a)} ${an(a)}`;
  return an(a) === an(b) ? `${s(a)} – ${s(b)} ${an(b)}` : `${s(a)} ${an(a)} – ${s(b)} ${an(b)}`;
}

/** Les jours d'une semaine, court : « 16–22 févr. », « 26 oct.–1 nov. » (l'étiquette d'une fenêtre d'une semaine, CAL-FRISE-ETIQUETTES). */
export function joursSemaine(lundi: string): string {
  const a = jourCourt(lundi), b = jourCourt(ajouterJours(lundi, 6));
  const [ja, ma] = a.split(' '), [jb, mb] = b.split(' ');
  return ma && ma === mb ? `${ja}–${jb} ${mb}` : `${a}–${b}`;
}

/** L'étiquette du cadre au repos : les jours d'une fenêtre d'une semaine, sinon `etiquetteCadre`. La courbe s'en sert comme obstacle (même texte). */
export function etiquetteRepos(numeros: readonly number[], index: number, nombre: number, annee: boolean, etiquetteAnnee?: string, lundis?: readonly string[], aujourdhui?: string): string {
  if (annee && etiquetteAnnee) return etiquetteAnnee;
  return etiquetteDates(lundis, index, nombre, aujourdhui) ?? etiquetteCadre(numeros, index, nombre, annee, etiquetteAnnee, lundis, aujourdhui);
}

/** Zone de prise d'une poignée : 44 px (cible tactile minimale de l'app). */
export const PRISE_POIGNEE = 44;
/** Part de la zone de prise posée DANS le cadre : le reste déborde dehors, pour que l'intérieur du cadre reste à la lecture (c2-b). */
const PRISE_DEDANS = 10;

/**
 * Les zones de prise des deux poignées, en px de la courbe (CRITIQUE-3 n° 6). Seules ces deux zones tirent la fenêtre ; tout autre glisser sur
 * la courbe, l'intérieur du cadre compris, est une lecture (c2-b), comme le jouable où la brosse lit et seule sa poignée tire.
 * - Fin : 10 px dans le cadre, 34 px dehors à droite ; ramenée dans la courbe si elle en sortirait (fenêtre au bout, l'année).
 * - Début : 34 px dehors à gauche, 10 px dedans ; jamais ramenée : quand la fenêtre commence à la première semaine, seul son bord dépasse, et le
 *   doigt qui part de « maintenant » lit la courbe (le geste c2-b du jouable) au lieu de pousser la fenêtre.
 */
export function zonesPoignees(gauche: number, droite: number, largeur: number, debutRamenee = false, vue: VueEcran = { gauche: 0, droite: largeur }): { debut: { l: number; w: number }; fin: { l: number; w: number } } {
  const finL = Math.max(0, Math.min(droite - PRISE_DEDANS, largeur - PRISE_POIGNEE));
  // CAL-PASSE (20.11) : quand la courbe commence AVANT aujourd'hui, l'index 0 n'est plus « maintenant » : le doigt qui part du bord gauche ne lit
  // plus la courbe, il recule la fenêtre. La prise du début reste donc entière dans l'écran (44 px) au lieu de sortir de 34 px.
  const debutL = gauche - (PRISE_POIGNEE - PRISE_DEDANS);
  /* POI-1 (24.11, « maintenant tout est au bord, l'actionnable est plus difficile sur mobile ») : contre le bord de l'écran (geste retour d'Android, 24 px),
     la prise rentre vers l'intérieur du cadre pour que sa part utile fasse 44 px ; elle s'arrête où commence la prise de l'autre bout. Le dessin ne bouge pas. */
  const dedansMax = Math.min(CIBLE_PX / 2, (droite - gauche) / 3);
  const zd = rentrer([debutRamenee ? Math.max(0, debutL) : debutL, (debutRamenee ? Math.max(0, debutL) : debutL) + PRISE_POIGNEE], vue, [-Infinity, droite - dedansMax]);
  const zf = rentrer([finL, finL + PRISE_POIGNEE], vue, [gauche + dedansMax, Infinity]);
  return { debut: { l: zd[0], w: zd[1] - zd[0] }, fin: { l: zf[0], w: zf[1] - zf[0] } };
}

/**
 * Le rôle du doigt posé en `x` (px de la courbe) sur le cadre [`xa`, `xb`] : celui de `roleSous` (module geste, partagé), avec la prise de chaque bout
 * rentrée contre le bord de l'écran (POI-1). Loin du bord, le même rôle que `roleSous`.
 */
export function roleRentre(x: number, xa: number, xb: number, vue: VueEcran): 'a' | 'b' | 'corps' {
  const z = zonesBords(xa, xb), dedans = Math.min(CIBLE_PX / 2, Math.max(0, xb - xa) / 3);
  const a = rentrer(z.a, vue, [-Infinity, xb - dedans]), b = rentrer(z.b, vue, [xa + dedans, Infinity]);
  if (x < a[1]) return 'a';
  if (x >= b[0]) return 'b';
  return 'corps';
}

/** Écart entre la bulle du tirage et le bout tiré : au-delà de la prise de la poignée posée dans le cadre (10 px). */
const ECART_BULLE = 14;

/**
 * L'étiquette qui suit le doigt pendant le tirage : en haut de la courbe, bornée à la courbe. Hauteur 22 px. CHG-7 (R9 : jamais sur un bout) :
 * un bout tiré garde sa bulle à côté de lui, dans le cadre (début : à droite ; fin : à gauche), ni sur son coin ni sur sa poignée ; le corps
 * la centre.
 */
export function boiteTirage(texte: string, bord: number, largeur: number, cote: 'a' | 'b' | 'corps' = 'corps'): Boite {
  const w = largeurTexte(texte, true) + 12;
  const voulu = cote === 'a' ? bord + ECART_BULLE : cote === 'b' ? bord - ECART_BULLE - w : bord - w / 2;
  const l = clamp(voulu, 2, Math.max(2, largeur - 2 - w));
  return { l, r: l + w, t: 0, b: 22 };
}

/**
 * Frise B, R4 (le brasseur, 20.11 : « sur la frise du temps, l'échelle doit changer pour toujours voir les 2 bouts ») : la vue de la courbe, en
 * semaines (`v0` : la semaine au bord gauche, fractionnaire ; `span` : les semaines sur la largeur). Au repos, le début de la fenêtre est à 56 px
 * du bord gauche et sa fin à 56 px du bord droit, quelle que soit sa durée (1 semaine à l'année).
 */
export interface VueCourbe { v0: number; span: number }
export const vueDeFenetre = (index: number, nombre: number, largeur: number): VueCourbe => {
  const n = Math.max(1, nombre), v = cadrerDeuxBouts(index, index + n, Math.max(1, largeur));
  /* D441 (CAL-UN-SEUL-AXE) : les marges en unités entières (jours sous 5 semaines de vue, semaines au-delà), les mêmes des deux côtés : la
     courbe, la bande et les rangées commencent au début d'un jour ou d'un lundi et partagent la même transformation date → x */
  const u = uniteDeVue(v.span), m = Math.max(1, Math.round(((v.span - n) / 2) * u));
  return { v0: index - m / u, span: n + (2 * m) / u };
};

/**
 * D441 (CAL-UN-SEUL-AXE) : l'axe que la courbe donne aux rangées : `unites` colonnes d'un jour ou d'une semaine dès `du`, sur la largeur de la
 * courbe ; le cadre (`cadreDu` → `cadreAu`, inclus) en zone ; les graduations de la bande (px de la courbe), où les rangées tirent leurs lignes.
 */
export interface AxeCourbe { du: string; unites: number; unite: 'jour' | 'semaine'; cadreDu: string; cadreAu: string; graduations: readonly number[]; auj?: { cote: 'dans' | 'gauche' | 'droite'; x0: number; x1: number } | null }

/** D441 : l'unité des rangées sous la courbe : 7 (des jours) pour une vue de moins de 5 semaines, 1 (des semaines) au-delà. */
export const uniteDeVue = (span: number): 1 | 7 => (span < 5 ? 7 : 1);
/** D441 : une vue (pendant un tirage, son recalage) posée sur des unités entières : début au début d'un jour ou d'un lundi, largeur en unités. */
export function vueEnUnites(v: VueCourbe): VueCourbe {
  const u = uniteDeVue(v.span);
  return { v0: Math.round(v.v0 * u) / u, span: Math.max(1 / u, Math.round(v.span * u) / u) };
}

/**
 * Les semaines de la courbe que la vue montre, et leurs bords en px de la courbe (bornés à la largeur) : la même forme que l'alignement sur la
 * frise (D387), pour que la courbe se trace par le même chemin. `null` : aucune semaine dans la largeur.
 */
export function semainesDeVue(total: number, vue: VueCourbe, largeur: number): { debut: number; abscisses: number[] } | null {
  if (!(total > 0) || !(largeur > 0) || !(vue.span > 0)) return null;
  const debut = clamp(Math.floor(vue.v0), 0, total - 1), fin = clamp(Math.ceil(vue.v0 + vue.span) - 1, 0, total - 1);
  if (fin < debut || vue.v0 + vue.span <= 0 || vue.v0 >= total) return null;
  const x = (i: number) => Math.round(clamp((i - vue.v0) * largeur / vue.span, 0, largeur) * 10) / 10;
  const abscisses: number[] = [];
  for (let i = debut; i <= fin + 1; i++) abscisses.push(x(i));
  return { debut, abscisses };
}

/** Le geste en cours sur le cadre (semaines, fin exclusive ; px de la courbe à l'écran). */
interface SaisieCadre {
  /** `defile` (CAL-SANS-LECTURE, D436) : le doigt posé hors du cadre fait défiler la fenêtre sous lui, comme une carte (vers la droite : le passé). */
  role: 'a' | 'b' | 'corps' | 'defile';
  a0: number; b0: number; a: number; b: number;
  /** Largeur et bord gauche de la courbe à l'écran (px). */
  w: number; left: number;
  vue0: VueCourbe; v: VueCourbe;
  /** Écart du doigt au bout tenu (R2) ; défilement R7 du corps (semaines). */
  off: number; pan: number;
  /** L-13 : la part de semaine que le doigt a parcourue au-delà de la semaine posée (corps) ; le cadre est dessiné là, posé à la semaine au lâcher. */
  glis?: number;
}

export function Cadre({ numeros, lundis, index, nombre, largeur, annee, onChange, onAnnee, onRevient, onTirage, onTire, etiquetteAnnee, surface, debutRamenee, vue, onVue, aujourdhui, grain }: CadreProps) {
  const total = numeros.length;
  // R4 : une semaine fait `unit` px dans la vue ; la semaine i commence en (i − v0) × unit.
  const unit = largeur / Math.max(1e-6, vue.span);
  const xDe = (i: number) => (i - vue.v0) * unit;
  const [drag, setDrag] = useState<{ index: number; nombre: number; bord: number; cote: 'a' | 'b' | 'corps'; glis?: number } | null>(null);
  const cur = drag ?? { index, nombre };
  /* CAL-FRISE-ETIQUETTES (« S47 » écrit deux fois) : au repos, une fenêtre d'une semaine a sa graduation « S44 » juste dessous ; le cadre dit ses jours
     (« 26 oct. – 1 nov. »), jamais le même numéro. Pendant le tirage, la bulle garde le numéro (il change sous le doigt). */
  /* D434 : les dates, au repos comme pendant le tirage (l'An au repos garde ses mois) */
  /* CAL-ETIQUETTE-GRAIN-AU-DESSUS (23.11, « en mode jour, 21dec et 10 janvier ont pas besoin d'être afficher, mais il faudrait mettre les semaines
     genre S52 2026 - S1 2027 ») : l'étiquette dit le grain au-dessus de celui de la bande : bande en jours → semaines avec l'année ; sinon les dates */
  const etiquette = annee && !drag && etiquetteAnnee ? etiquetteAnnee : grain === 'jour' && lundis ? etiquetteSemainesAnnees(lundis, cur.index, cur.nombre) : etiquetteDates(lundis, cur.index, cur.nombre, aujourdhui) ?? etiquetteCadre(numeros, cur.index, cur.nombre, annee && !drag, etiquetteAnnee, lundis, aujourdhui);
  /* L-13 (T10-13) : pendant le glisser du corps, le cadre accompagne le doigt (R2) ; à une semaine (248 px), il ne bougeait qu'après 124 px */
  const glis = drag?.glis ?? 0;
  const gauche = xDe(cur.index + glis), droite = xDe(cur.index + cur.nombre + glis);
  // Plus large que le cadre (fenêtre de 2 semaines), l'étiquette passe à côté du cadre, sur une ligne, jamais hors de l'écran (placeEtiquette).
  const place = placeEtiquette(etiquette, gauche, cur.nombre * unit, largeur);
  const lignes = place.lignes;
  const styleL = place.dehors ? { left: place.l - gauche, transform: 'none', alignItems: 'flex-start' } : undefined;
  const zones = zonesPoignees(gauche, droite, largeur, debutRamenee);
  // Pendant le tirage, l'étiquette quitte le bas du cadre (où elle couvrait « 1 740 mis de côté », n° 24) : elle suit le doigt, en haut.
  const tirage = drag ? boiteTirage(etiquette, drag.bord, largeur, drag.cote) : null;
  const onTirageRef = useRef(onTirage);
  onTirageRef.current = onTirage;
  const cleTirage = tirage ? `${Math.round(tirage.l)}-${Math.round(tirage.r)}` : '';
  useEffect(() => { onTirageRef.current?.(tirage); }, [cleTirage]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onTirageRef.current?.(null), []);
  const onTireRef = useRef(onTire);
  onTireRef.current = onTire;
  useEffect(() => { onTireRef.current?.(drag ? { index: drag.index, nombre: drag.nombre } : null); }, [drag?.index, drag?.nombre, !!drag]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onTireRef.current?.(null), []);

  // R10 : le recalage de la vue après le lâcher (200 ms, sans animation si le mouvement est réduit) ; un nouveau tirage l'arrête.
  const recalage = useRef(0);
  const onVueRef = useRef(onVue);
  onVueRef.current = onVue;
  useEffect(() => () => { if (recalage.current) cancelAnimationFrame(recalage.current); }, []);
  const recaler = (de: VueCourbe, vers: VueCourbe) => {
    if (recalage.current) cancelAnimationFrame(recalage.current);
    recalage.current = 0;
    const reduit = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduit || typeof requestAnimationFrame !== 'function' || (Math.abs(de.v0 - vers.v0) < 1e-3 && Math.abs(de.span - vers.span) < 1e-3)) { onVueRef.current?.(null); return; }
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / RECALAGE_MS), e = 1 - Math.pow(1 - k, 3);
      if (k >= 1) { recalage.current = 0; onVueRef.current?.(null); return; }
      onVueRef.current?.({ v0: de.v0 + (vers.v0 - de.v0) * e, span: de.span + (vers.span - de.span) * e });
      recalage.current = requestAnimationFrame(pas);
    };
    recalage.current = requestAnimationFrame(pas);
  };

  /*
   * CAL-FRISE-PRIX (D410) : le geste de Finances › Opérations, un seul pour l'app (src/ui/geste : useGlisse, roleSous, poserPlage), attaché à
   * la courbe ; en semaines, fin exclusive. Un doigt posé à plus de 22 px du cadre fait défiler la fenêtre (CAL-SANS-LECTURE, D436). Début : il
   * s'étire seul, la fin reste (R6) ; fin : pareil ; corps : la fenêtre entière se déplace (R5), la courbe défile sous elle à 56 px du bord.
   * Plus aucune lecture de la courbe au doigt (D436). Au bord (R7) : le corps fait défiler ; un bout tiré
   * dehors resserre l'échelle, l'autre bout reste à sa place à l'écran. Lâcher : la fenêtre posée, la vue se recale sur ses deux bouts (R4,
   * R10). Échap ou pointercancel : la fenêtre et la vue d'avant. Dans l'An, le geste marche aussi et en sort (CAL-ECHELLE-FIGEE, EnTete).
   */
  const montrer = (s: SaisieCadre) => {
    const px = (u: number) => (u - s.v.v0) * largeur / s.v.span;
    const g = s.role === 'corps' ? s.glis ?? 0 : 0;
    setDrag({ index: s.a, nombre: s.b - s.a, bord: s.role === 'a' ? px(s.a) : s.role === 'b' ? px(s.b) : (px(s.a + g) + px(s.b + g)) / 2, cote: s.role === 'defile' ? 'corps' : s.role, glis: g });
    onVueRef.current?.(s.v);
  };
  const glisse = useGlisse<SaisieCadre>({
    cadre: () => surface.current,
    saisir: (x, e) => {
      if (total === 0) return null;
      const r = surface.current?.getBoundingClientRect();
      const w = r && r.width ? r.width : largeur;
      const v = { ...vue }, xa = ((index - v.v0) / v.span) * w, xb = ((index + nombre - v.v0) / v.span) * w;
      const dehors = x < xa - CIBLE_PX / 2 || x > xb + CIBLE_PX / 2;
      /* CAL-SANS-LECTURE (D436) : hors du cadre, le doigt fait défiler la fenêtre ; sans stopPropagation, l'appui long (courbe en grand) reste. */
      if (!dehors) e.stopPropagation();
      if (recalage.current) { cancelAnimationFrame(recalage.current); recalage.current = 0; }
      const role = dehors ? 'defile' : roleRentre(x, xa, xb, vueDansRepere(r?.left ?? 0));
      return { role, a0: index, b0: index + nombre, a: index, b: index + nombre, w, left: r?.left ?? 0, vue0: v, v, off: role === 'a' ? xa - x : role === 'b' ? xb - x : 0, pan: 0 };
    },
    suivre: (dx, s, x) => {
      const o = { min: 0, max: total, minLarg: 1 }, parPx = s.v.span / s.w;
      if (s.role === 'defile') {
        // la courbe suit le doigt (vers la droite : le passé arrive par la gauche) ; la fenêtre garde sa place à l'écran, posée à la semaine
        const k = Math.round(-dx * (s.vue0.span / s.w));
        const p = poserPlage('corps', s.a0, s.b0, k, o);
        s.v = { ...s.vue0, v0: s.vue0.v0 + (p.a - s.a0) };
        s.a = p.a; s.b = p.b;
      } else if (s.role === 'corps') {
        const brut = dx * (s.vue0.span / s.w) + s.pan, k = Math.round(brut);
        const p = poserPlage('corps', s.a0, s.b0, k, o);
        // L-13 : la fraction de semaine sous le doigt, sauf contre une borne (le cadre ne la dépasse pas)
        s.glis = p.a - s.a0 === k ? brut - k : 0;
        // R5 : un bout arrivé à 56 px du bord, c'est la courbe qui défile sous la fenêtre (elle reste entière à l'écran)
        const marge = Math.min(MARGE_BOUTS_PX, s.w / 3) * parPx;
        if (p.a < s.v.v0 + marge) s.v = { ...s.v, v0: p.a - marge };
        else if (p.b > s.v.v0 + s.v.span - marge) s.v = { ...s.v, v0: p.b - s.v.span + marge };
        s.a = p.a; s.b = p.b;
      } else {
        // un bout garde son écart au doigt (R2) ; la semaine sous le doigt se lit dans la vue du moment (elle change au bord, R7)
        const u = Math.round(s.v.v0 + (x + s.off) * parPx);
        const p = poserPlage(s.role, s.a0, s.b0, s.role === 'a' ? u - s.a0 : u - s.b0, o);
        /* CAL-PLUS-QU-UN-AN (23.11) : plus de plafond à l'An (T9-2 bornait à 52 semaines) ; poserPlage borne à l'horizon */
        // R4 pendant le geste : aucun bout ne sort de la courbe
        if (p.a < s.v.v0) s.v = { ...s.v, v0: p.a };
        if (p.b > s.v.v0 + s.v.span) s.v = { ...s.v, v0: p.b - s.v.span };
        s.a = p.a; s.b = p.b;
      }
      montrer(s);
    },
    bord: (sens, vitesseBrute, dt, s) => {
      /* Q4-1 (24.11, « Trop lente sur le calendrier ») : ×2,5 sur la vitesse du module geste, propre au Calendrier */
      const vitesse = vitesseCalendrier(vitesseBrute);
      if (s.role === 'defile') return;
      /* K57-1 : au plus 8 colonnes par seconde, comme les barres (plafondFenetre) ; la croissance était un pourcentage de l'échelle par image (exponentielle) */
      if (s.role === 'corps') { s.pan += sens * Math.min(vitesse * s.v.span * dt, plafondFenetre(s.vue0.span, dt)); return; }
      if ((s.role === 'b' && sens > 0) || (s.role === 'a' && sens < 0)) {
        const ancre = s.role === 'b' ? s.a0 : s.b0, xAncre = (ancre - s.v.v0) / s.v.span;
        const span = Math.min(total * 1.3, s.v.span + Math.min(s.v.span * vitesse * 0.6 * dt, plafondFenetre(s.vue0.span, dt)));
        s.v = { span, v0: ancre - xAncre * span };
      }
    },
    lacher: (s, bouge) => {
      // le Cadre a pris le doigt : le clic fabriqué au doigt levé n'atteint ni ± ni la courbe (les poignées ne répondent qu'au clic clavier)
      avalerClicSuivant();
      /* CAL-ECHELLE-SUIT-CADRE : l'état du tirage part toujours au lâcher (resté, la bulle du tirage gardait une autre fenêtre : « S49 – S46 2027 » à 3 sem.) */
      setDrag(null);
      if (!bouge) { onVueRef.current?.(null); return; }
      const n = s.b - s.a;
      if (s.a !== s.a0 || s.b !== s.b0) onChange({ index: s.a, nombre: n });
      recaler(s.v, vueDeFenetre(s.a, n, largeur));
    },
    annuler: () => { setDrag(null); onVueRef.current?.(null); },
  });
  useEffect(() => { glisse(surface.current); return () => glisse(null); }, [glisse, surface]);

  // R6 au clavier : la poignée de début étire ou réduit la fenêtre, sa fin reste
  const clavierDebut = (e: React.KeyboardEvent) => {
    const pas = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!pas) return;
    e.preventDefault();
    const fin = index + nombre, a = clamp(index + pas, 0, fin - 1);
    if (a !== index) onChange({ index: a, nombre: fin - a });
  };

  // Les poignées sont posées à côté du cadre, en px de la courbe : leur zone de prise (44 px) déborde dehors, la barre visible reste sur le bord.
  return (
    <>
      <div className="ent-cadre" role="group" aria-label={`Fenêtre : ${etiquette}`} data-annee={annee ? 'oui' : undefined} data-glisse={drag ? 'oui' : undefined}
        style={{ left: gauche, width: cur.nombre * unit }}>
        {!tirage && <span className="ent-cadre-l" data-cadre-etiquette style={styleL}>{lignes.map(l => <span key={l}>{l}</span>)}</span>}
      </div>
      {tirage && <span className="ent-cadre-tir" data-cadre-etiquette data-cadre-tirage style={{ left: tirage.l, width: tirage.r - tirage.l }}>{etiquette}</span>}
      <button type="button" className="ent-poi ent-poi-debut" data-poignee="debut" style={{ left: zones.debut.l, width: zones.debut.w }}
        aria-label={`Poignée de début : étirer la fenêtre, elle commence en S${numeros[cur.index]}`}
        onKeyDown={clavierDebut}><i aria-hidden="true" style={{ left: gauche - zones.debut.l - 3 }} /></button>
      <button type="button" className="ent-poi ent-poi-fin" data-poignee="fin" style={{ left: zones.fin.l, width: zones.fin.w }}
        aria-label={annee ? 'Revenir à la fenêtre d’avant' : 'Poignée de fin : étirer ou réduire la fenêtre (Entrée : l’année)'}
        onClick={e => { if (e.detail === 0) (annee ? onRevient : onAnnee)?.(); }}><i aria-hidden="true" style={{ left: droite - zones.fin.l - 3 }} /></button>
    </>
  );
}
