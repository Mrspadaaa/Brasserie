import React, { useEffect, useRef, useState } from 'react';
import { bornes, etiquetteCourte, type Periode } from '../../../components/periode/periode';
import { lundiDe } from '../../../domain/calendrier';
import { ajouterJours, largeurTexte, placeEtiquette, type Boite } from './Courbe';
import { cadrerDeuxBouts, CIBLE_PX, MARGE_BOUTS_PX, poserPlage, RECALAGE_MS, roleSous, useGlisse } from '../../geste';
import { APPUI_LONG_MS } from '../../gestes/useAppuiLong';
import { avalerClicSuivant } from '../usePointeurCourbe';

/**
 * La fenêtre (E06, c1-d) : le cadre posé sur la courbe, ses deux poignées, l'étiquette « S47 – S52 » qui suit le doigt ; et le lien avec la
 * période de l'app (E07, ET-PER) : la fenêtre ET la période sont la même chose, écrite sous la forme `Periode` de `dates`.
 */

/** La fenêtre : le lundi de sa première semaine et le nombre de semaines (colonnes de la frise). */
export interface FenetreSemaines { du: string; semaines: number }

export const SEMAINES_ANNEE = 52;
/** Part de la largeur au-delà de laquelle la poignée lâchée ouvre l'année (c1-d). */
export const SEUIL_ANNEE = 0.8;

const JOUR = 86400000;
const ms = (iso: string) => { const [a, m, j] = iso.split('-').map(Number); return Date.UTC(a, m - 1, j); };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const semainesEntre = (lundi1: string, lundi2: string): number => Math.round((ms(lundi2) - ms(lundi1)) / (7 * JOUR));

/** La fenêtre écrite comme la période de l'app : du lundi de sa première semaine au dimanche de la dernière. */
export const periodeDeFenetre = (f: FenetreSemaines): Periode => ({ genre: 'dates', du: f.du, au: ajouterJours(f.du, f.semaines * 7 - 1) });

/**
 * La période de l'app (réglée au calendrier ou dans Finances) lue comme une fenêtre de semaines, dans l'horizon de la courbe.
 * `tout` n'a pas de bornes : `null`, la fenêtre reste ce qu'elle est. Une période tout entière passée : `null`.
 */
export function fenetreDePeriode(periode: Periode | undefined, premierLundi: string, total: number): FenetreSemaines | null {
  if (!periode) return null;
  const { du, au } = bornes(periode);
  if (!du || !au) return null;
  let debut = lundiDe(du);
  const voulu = debut;
  if (debut < premierLundi) debut = premierLundi;
  let fin = lundiDe(au);
  /* CHV-4 : une plage tirée avant l'horizon garde sa durée (une année reste 52 semaines) : elle se pose au début de l'horizon, la barre dit ce que le cadre montre. */
  if (periode.genre === 'dates' && voulu < debut && fin >= debut) fin = lundiDe(new Date(Date.parse(`${debut}T00:00:00Z`) + semainesEntre(voulu, fin) * 7 * 864e5).toISOString().slice(0, 10));
  if (fin < debut) return null;
  const decalage = semainesEntre(premierLundi, debut);
  if (decalage >= total) return null;
  // Décision pilote (c), CRITIQUE-7 : un mois se lit dès aujourd'hui et montre au moins 4 semaines ; s'il finit avant, la fenêtre déborde sur
  // le suivant (le 30 nov. : S49 à S52, jamais une semaine seule). La période reste « mois » : seule sa lecture en semaines s'allonge.
  const semaines = semainesEntre(debut, fin) + 1;
  const min = periode.genre === 'mois' ? MOIS_MIN_SEMAINES : 1;
  return { du: debut, semaines: clamp(Math.max(semaines, min), 1, total - decalage) };
}

/** Un mois lu au calendrier montre au moins ces semaines (décision pilote (c), 18.11). */
export const MOIS_MIN_SEMAINES = 4;

/** Le texte du bouton de période : « 6 sem. », « 3 mois », « 6 mois », « An », ou le nombre de semaines tel quel. */
export function libelleDuree(semaines: number, annee: boolean): string {
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
  /** Le nœud de la courbe : le geste s'y attache (le doigt posé à plus de 22 px du cadre lui reste, pour la lecture c2-b). */
  surface: React.RefObject<HTMLElement | null>;
  /** CAL-FRISE-PRIX : le corps du cadre tenu 450 ms sans bouger lit la semaine sous le doigt (`clientX`) ; `null` : la lecture se ferme. */
  onLire?: (clientX: number | null) => void;
  /** Dans l'année, l'étiquette dit les mois (« nov. – oct. »), jamais « S47 – S45 » (c1-d). */
  etiquetteAnnee?: string;
  /** T9-2 : aujourd'hui (ISO), l'année de référence de l'étiquette. */
  aujourdhui?: string;
  /** CAL-PASSE : la courbe commence avant aujourd'hui ; la prise de la poignée de début reste dans l'écran même à la première semaine. */
  debutRamenee?: boolean;
  /** R4 : la vue de la courbe (semaines), celle où se posent le cadre et ses poignées. */
  vue: VueCourbe;
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
export function zonesPoignees(gauche: number, droite: number, largeur: number, debutRamenee = false): { debut: { l: number; w: number }; fin: { l: number; w: number } } {
  const finL = Math.max(0, Math.min(droite - PRISE_DEDANS, largeur - PRISE_POIGNEE));
  // CAL-PASSE (20.11) : quand la courbe commence AVANT aujourd'hui, l'index 0 n'est plus « maintenant » : le doigt qui part du bord gauche ne lit
  // plus la courbe, il recule la fenêtre. La prise du début reste donc entière dans l'écran (44 px) au lieu de sortir de 34 px.
  const debutL = gauche - (PRISE_POIGNEE - PRISE_DEDANS);
  return { debut: { l: debutRamenee ? Math.max(0, debutL) : debutL, w: PRISE_POIGNEE }, fin: { l: finL, w: PRISE_POIGNEE } };
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
export const vueDeFenetre = (index: number, nombre: number, largeur: number): VueCourbe => cadrerDeuxBouts(index, index + Math.max(1, nombre), Math.max(1, largeur));

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
  role: 'a' | 'b' | 'corps';
  a0: number; b0: number; a: number; b: number;
  /** Largeur et bord gauche de la courbe à l'écran (px). */
  w: number; left: number;
  vue0: VueCourbe; v: VueCourbe;
  /** Écart du doigt au bout tenu (R2) ; défilement R7 du corps (semaines). */
  off: number; pan: number;
  /** Appui long sur le corps : le doigt lit la courbe au lieu de déplacer. */
  lit: boolean;
  minuterie: ReturnType<typeof setTimeout> | null;
}

export function Cadre({ numeros, lundis, index, nombre, largeur, annee, onChange, onAnnee, onRevient, onTirage, etiquetteAnnee, surface, onLire, debutRamenee, vue, onVue, aujourdhui }: CadreProps) {
  const total = numeros.length;
  // R4 : une semaine fait `unit` px dans la vue ; la semaine i commence en (i − v0) × unit.
  const unit = largeur / Math.max(1e-6, vue.span);
  const xDe = (i: number) => (i - vue.v0) * unit;
  const [drag, setDrag] = useState<{ index: number; nombre: number; bord: number; cote: 'a' | 'b' | 'corps' } | null>(null);
  const cur = drag ?? { index, nombre };
  const etiquette = etiquetteCadre(numeros, cur.index, cur.nombre, annee && !drag, etiquetteAnnee, lundis, aujourdhui);
  const gauche = xDe(cur.index), droite = xDe(cur.index + cur.nombre);
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
   * la courbe ; en semaines, fin exclusive. Un doigt posé à plus de 22 px du cadre n'est pas pour lui : la courbe le lit (c2-b). Début : il
   * s'étire seul, la fin reste (R6) ; fin : pareil ; corps : la fenêtre entière se déplace (R5), la courbe défile sous elle à 56 px du bord.
   * Corps tenu 450 ms sans bouger (R1) : lecture de la semaine sous le doigt, qui le suit. Au bord (R7) : le corps fait défiler ; un bout tiré
   * dehors resserre l'échelle, l'autre bout reste à sa place à l'écran. Lâcher : la fenêtre posée, la vue se recale sur ses deux bouts (R4,
   * R10). Échap ou pointercancel : la fenêtre et la vue d'avant. Dans l'An, le geste marche aussi et en sort (CAL-ECHELLE-FIGEE, EnTete).
   */
  const onLireRef = useRef(onLire);
  onLireRef.current = onLire;
  const coupe = (s: SaisieCadre) => { if (s.minuterie) { clearTimeout(s.minuterie); s.minuterie = null; } };
  const montrer = (s: SaisieCadre) => {
    const px = (u: number) => (u - s.v.v0) * largeur / s.v.span;
    setDrag({ index: s.a, nombre: s.b - s.a, bord: s.role === 'a' ? px(s.a) : s.role === 'b' ? px(s.b) : (px(s.a) + px(s.b)) / 2, cote: s.role });
    onVueRef.current?.(s.v);
  };
  const glisse = useGlisse<SaisieCadre>({
    cadre: () => surface.current,
    saisir: (x, e) => {
      if (total === 0) return null;
      const r = surface.current?.getBoundingClientRect();
      const w = r && r.width ? r.width : largeur;
      const v = { ...vue }, xa = ((index - v.v0) / v.span) * w, xb = ((index + nombre - v.v0) / v.span) * w;
      if (x < xa - CIBLE_PX / 2 || x > xb + CIBLE_PX / 2) return null;
      // le doigt est au cadre : la lecture de la courbe (onPointerDown React, délégué à la racine) ne le reçoit pas
      e.stopPropagation();
      if (recalage.current) { cancelAnimationFrame(recalage.current); recalage.current = 0; }
      onLireRef.current?.(null);
      const role = roleSous(x, xa, xb);
      const s: SaisieCadre = { role, a0: index, b0: index + nombre, a: index, b: index + nombre, w, left: r?.left ?? 0, vue0: v, v, off: role === 'a' ? xa - x : role === 'b' ? xb - x : 0, pan: 0, lit: false, minuterie: null };
      if (role === 'corps') s.minuterie = setTimeout(() => { s.minuterie = null; s.lit = true; onLireRef.current?.(s.left + x); }, APPUI_LONG_MS);
      return s;
    },
    suivre: (dx, s, x) => {
      if (s.lit) { onLireRef.current?.(s.left + x); return; }
      coupe(s);
      const o = { min: 0, max: total, minLarg: 1 }, parPx = s.v.span / s.w;
      if (s.role === 'corps') {
        const p = poserPlage('corps', s.a0, s.b0, Math.round(dx * (s.vue0.span / s.w) + s.pan), o);
        // R5 : un bout arrivé à 56 px du bord, c'est la courbe qui défile sous la fenêtre (elle reste entière à l'écran)
        const marge = Math.min(MARGE_BOUTS_PX, s.w / 3) * parPx;
        if (p.a < s.v.v0 + marge) s.v = { ...s.v, v0: p.a - marge };
        else if (p.b > s.v.v0 + s.v.span - marge) s.v = { ...s.v, v0: p.b - s.v.span + marge };
        s.a = p.a; s.b = p.b;
      } else {
        // un bout garde son écart au doigt (R2) ; la semaine sous le doigt se lit dans la vue du moment (elle change au bord, R7)
        const u = Math.round(s.v.v0 + (x + s.off) * parPx);
        const p = poserPlage(s.role, s.a0, s.b0, s.role === 'a' ? u - s.a0 : u - s.b0, o);
        /* T9-2 : la fenêtre ne dépasse jamais l'An (52 semaines, CAL-PASSE) ; au-delà, l'autre bout suit. Sans cela, le début tenu au bord
           posait 58 semaines : bouton « An », frise de douze mois, et un cadre plus long qu'elle. */
        if (p.b - p.a > SEMAINES_ANNEE) { if (s.role === 'a') p.b = p.a + SEMAINES_ANNEE; else p.a = p.b - SEMAINES_ANNEE; }
        // R4 pendant le geste : aucun bout ne sort de la courbe
        if (p.a < s.v.v0) s.v = { ...s.v, v0: p.a };
        if (p.b > s.v.v0 + s.v.span) s.v = { ...s.v, v0: p.b - s.v.span };
        s.a = p.a; s.b = p.b;
      }
      montrer(s);
    },
    bord: (sens, vitesse, dt, s) => {
      if (s.lit) return;
      if (s.role === 'corps') { s.pan += sens * vitesse * s.v.span * dt; return; }
      if ((s.role === 'b' && sens > 0) || (s.role === 'a' && sens < 0)) {
        const ancre = s.role === 'b' ? s.a0 : s.b0, xAncre = (ancre - s.v.v0) / s.v.span;
        const span = Math.min(total * 1.3, s.v.span * (1 + vitesse * 0.6 * dt));
        s.v = { span, v0: ancre - xAncre * span };
      }
    },
    lacher: (s, bouge) => {
      coupe(s);
      // le Cadre a pris le doigt : le clic fabriqué au doigt levé n'atteint ni ± ni la courbe (les poignées ne répondent qu'au clic clavier)
      avalerClicSuivant();
      if (s.lit) return;
      setDrag(null);
      if (!bouge) { onVueRef.current?.(null); return; }
      const n = s.b - s.a;
      if (s.a !== s.a0 || s.b !== s.b0) onChange({ index: s.a, nombre: n });
      recaler(s.v, vueDeFenetre(s.a, n, largeur));
    },
    annuler: (s) => { coupe(s); setDrag(null); onVueRef.current?.(null); },
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
