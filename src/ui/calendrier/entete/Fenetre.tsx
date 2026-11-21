import React, { useEffect, useRef, useState } from 'react';
import { bornes, etiquetteCourte, type Periode } from '../../../components/periode/periode';
import { lundiDe } from '../../../domain/calendrier';
import { ajouterJours, largeurTexte, placeEtiquette, type Boite } from './Courbe';
import { aBouge, cadrerDeuxBouts, MARGE_BOUTS_PX, RECALAGE_MS, vitesseBord } from '../../geste';

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
  if (debut < premierLundi) debut = premierLundi;
  const fin = lundiDe(au);
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
  /** La poignée de début a glissé la fenêtre à une autre semaine. */
  onChange: (f: { index: number; nombre: number }) => void;
  /** La poignée de fin est lâchée au-delà de 80 % : l'année. */
  onAnnee: () => void;
  /** Un toucher sur la poignée, dans l'année : on revient à la fenêtre d'avant. */
  onRevient?: () => void;
  /** Lâchée avant : la fenêtre revient et le message le dit. */
  onTropCourt?: () => void;
  /** Pendant le tirage, la boîte de l'étiquette qui suit le doigt (les noms qu'elle couvrirait s'effacent) ; `null` au lâcher. */
  onTirage?: (boite: Boite | null) => void;
  /** Rempli à chaque rendu : la courbe y lit les zones de prise et lance le tirage (voir `PriseCadre`). */
  prise?: React.MutableRefObject<PriseCadre | null>;
  /** Dans l'année, l'étiquette dit les mois (« nov. – oct. »), jamais « S47 – S45 » (c1-d). */
  etiquetteAnnee?: string;
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
export function etiquetteCadre(numeros: readonly number[], index: number, nombre: number, annee: boolean, etiquetteAnnee?: string, lundis?: readonly string[]): string {
  if (annee && etiquetteAnnee) return etiquetteAnnee;
  const total = numeros.length;
  const fin = Math.min(total - 1, index + nombre - 1);
  const an = lundis && lundis[0] && lundis[fin] && anneeIso(lundis[fin]) > anneeIso(lundis[0]) ? ` ${anneeIso(lundis[fin])}` : '';
  return `S${numeros[index] ?? ''} – S${numeros[fin] ?? ''}${an}`;
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

/** L'étiquette qui suit le doigt pendant le tirage : au-dessus du cadre (en haut de la courbe), bornée à la courbe. Hauteur 22 px. */
export function boiteTirage(texte: string, bord: number, largeur: number): Boite {
  const w = largeurTexte(texte, true) + 12;
  const l = clamp(bord - w / 2, 2, Math.max(2, largeur - 2 - w));
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

/** Ce que la courbe sait des poignées pour leur donner le doigt : leurs zones de prise, et le geste à lancer. */
export interface PriseCadre {
  zones: ReturnType<typeof zonesPoignees>;
  tirer: (genre: 'debut' | 'fin', e: React.PointerEvent<Element>) => void;
}

export function Cadre({ numeros, lundis, index, nombre, largeur, annee, onChange, onAnnee, onRevient, onTropCourt, onTirage, etiquetteAnnee, prise, debutRamenee, vue, onVue }: CadreProps) {
  const total = numeros.length;
  // R4 : une semaine fait `unit` px dans la vue ; la semaine i commence en (i − v0) × unit.
  const unit = largeur / Math.max(1e-6, vue.span);
  const xDe = (i: number) => (i - vue.v0) * unit;
  const [drag, setDrag] = useState<{ index: number; nombre: number; bord: number } | null>(null);
  const cur = drag ?? { index, nombre };
  const etiquette = etiquetteCadre(numeros, cur.index, cur.nombre, annee && !drag, etiquetteAnnee, lundis);
  const gauche = xDe(cur.index), droite = xDe(cur.index + cur.nombre);
  // Plus large que le cadre (fenêtre de 2 semaines), l'étiquette passe à côté du cadre, sur une ligne, jamais hors de l'écran (placeEtiquette).
  const place = placeEtiquette(etiquette, gauche, cur.nombre * unit, largeur);
  const lignes = place.lignes;
  const styleL = place.dehors ? { left: place.l - gauche, transform: 'none', alignItems: 'flex-start' } : undefined;
  const zones = zonesPoignees(gauche, droite, largeur, debutRamenee);
  // Pendant le tirage, l'étiquette quitte le bas du cadre (où elle couvrait « 1 740 mis de côté », n° 24) : elle suit le doigt, en haut.
  const tirage = drag ? boiteTirage(etiquette, drag.bord, largeur) : null;
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
   * Frise B sur la courbe (R1, R2, R4, R5, R6, R7, R10). Le début déplace la fenêtre entière (c1-d : sa durée reste) ; la fin l'étire ou la
   * réduit, une semaine au moins. Rien ne bouge avant 6 px (R1) ; la valeur suit le DÉPLACEMENT du doigt (R2). Quand la fenêtre arrive à 56 px
   * d'un bord, c'est la courbe qui défile sous elle (R5). Doigt à moins de 40 px d'un bord en allant vers lui (R7) : le début fait défiler la
   * fenêtre et la courbe ; la fin tirée vers la droite resserre l'échelle, le début reste où il est à l'écran. Lâcher : la fenêtre reste, la vue
   * se recale sur les deux bouts (R4, R10). Échap ou pointercancel : la fenêtre et la vue d'avant, exactement.
   */
  const demarrer = (genre: 'debut' | 'fin') => (e: React.PointerEvent<Element>) => {
    if (e.button > 0 || total === 0) return;
    e.stopPropagation();
    if (recalage.current) { cancelAnimationFrame(recalage.current); recalage.current = 0; }
    // Le doigt reste à la poignée même s'il sort du cadre (vrai toucher : Pointer Events, capture ; `touch-action: none` en CSS).
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* jsdom, pointeur déjà levé */ }
    const id = e.pointerId;
    // px de la courbe : la boîte de l'élément tenu (la courbe) ; son échelle d'affichage peut différer de `largeur` (zoom CSS)
    const r0 = e.currentTarget.getBoundingClientRect?.();
    const kx = r0 && r0.width ? largeur / r0.width : 1, gauche0 = r0?.left ?? 0;
    const xEcran = (cx: number) => (cx - gauche0) * kx;
    let v: VueCourbe = { ...vue };
    const ppu = () => largeur / v.span;
    const px = (u: number) => (u - v.v0) * ppu();
    const un = (x: number) => v.v0 + x / ppu();
    const ppu0 = ppu();
    const a0 = index, b0 = index + nombre;
    const x0 = xEcran(e.clientX);
    const off = (genre === 'debut' ? px(a0) : px(b0)) - x0;
    let x = x0, arme = 0, bouge = false, pan = 0, a = a0, b = b0, raf = 0, tPrec = 0;
    const M = Math.min(MARGE_BOUTS_PX, largeur / 3);

    const poser = () => {
      if (genre === 'debut') {
        // R5 : la durée reste ; le déplacement se lit à l'échelle de la saisie, plus ce que R7 a fait défiler
        const d = clamp(Math.round((x - x0) / ppu0 + pan), -a0, Math.max(0, total - b0));
        a = a0 + d; b = b0 + d;
        const q = ppu();
        if (px(a) < M) v = { ...v, v0: a - M / q };
        else if (px(b) > largeur - M) v = { ...v, v0: b - (largeur - M) / q };
      } else {
        // R6 : la fin seule, une semaine au moins, jamais au-delà de la courbe
        b = clamp(Math.round(un(x + off)), a0 + 1, total);
      }
      setDrag({ index: a, nombre: b - a, bord: px(genre === 'debut' ? a : b) });
      onVueRef.current?.(v);
    };
    const image = (t: number) => {
      raf = 0;
      if (!bouge) return;
      const { sens, vitesse } = vitesseBord(x, largeur, arme);
      if (!sens) { tPrec = 0; return; }
      const dt = tPrec ? Math.min(0.05, (t - tPrec) / 1000) : 0;
      tPrec = t;
      if (dt > 0) {
        if (genre === 'debut') pan += sens * vitesse * v.span * dt;
        else if (sens > 0) {
          // la fin tirée dehors : l'échelle se resserre autour du début, qui ne bouge pas à l'écran
          const xa = px(a), span = Math.min(total * 1.3, v.span * (1 + vitesse * 0.6 * dt));
          v = { span, v0: a - xa * span / largeur };
        } else { tPrec = 0; return; }
        poser();
      }
      raf = requestAnimationFrame(image);
    };
    const suit = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      const xn = xEcran(ev.clientX), d = xn - x;
      x = xn;
      // Frise B, R1 : rien ne bouge avant 6 px ; un toucher ne change rien
      if (!bouge && !aBouge(x - x0)) return;
      bouge = true;
      if (annee) return;
      if (d < -0.5) arme = -1; else if (d > 0.5) arme = 1;
      poser();
      if (!raf && vitesseBord(x, largeur, arme).sens && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(image);
    };
    const nettoie = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('pointermove', suit); window.removeEventListener('pointerup', fin); window.removeEventListener('pointercancel', annule); window.removeEventListener('keydown', echap, true);
    };
    // R10 : pointercancel ou Échap rend la fenêtre ET la vue d'avant, exactement (rien n'est posé)
    const retour = () => { nettoie(); setDrag(null); onVueRef.current?.(null); };
    const annule = (ev: PointerEvent) => { if (ev.pointerId === id) retour(); };
    const echap = (ev: KeyboardEvent) => { if (ev.key !== 'Escape') return; ev.preventDefault(); ev.stopPropagation(); retour(); };
    const fin = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      nettoie();
      setDrag(null);
      if (annee) { onVueRef.current?.(null); if (!bouge) onRevient?.(); return; }
      if (!bouge) {
        onVueRef.current?.(null);
        /* un toucher sur la fin garde l'invite d'avant ; rien ne change */
        if (genre === 'fin') onTropCourt?.();
        return;
      }
      const n = b - a;
      /* CAL-PERIODE-LIBRE (« Je peux pas choisir une période donnée ») : la fenêtre prend la plage posée ; tirée jusqu'à une année, l'An (c1-d). */
      if (genre === 'fin' && n >= Math.min(SEMAINES_ANNEE, total)) onAnnee();
      else if (a !== a0 || n !== nombre) onChange({ index: a, nombre: n });
      // R10 : seule la vue se recale, en 200 ms, sur les deux bouts de la plage posée
      recaler(v, vueDeFenetre(a, genre === 'fin' && n >= Math.min(SEMAINES_ANNEE, total) ? Math.min(SEMAINES_ANNEE, total - a) : n, largeur));
    };
    window.addEventListener('pointermove', suit);
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', annule);
    window.addEventListener('keydown', echap, true);
  };

  // La courbe décide du doigt par la géométrie (EnTete) : les boutons des poignées ne reçoivent pas le toucher (`pointer-events: none`), sans
  // quoi l'ajustement tactile du navigateur y rabat un doigt posé à 2 px, dans le cadre (CRITIQUE-3 n° 6, constaté au banc le 17.11).
  if (prise) prise.current = { zones, tirer: (genre, e) => demarrer(genre)(e) };

  const clavierDebut = (e: React.KeyboardEvent) => {
    const pas = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!pas || annee) return;
    e.preventDefault();
    const i = clamp(index + pas, 0, Math.max(0, total - nombre));
    if (i !== index) onChange({ index: i, nombre });
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
        aria-label={annee ? 'Revenir à la fenêtre d’avant' : `Poignée de début : déplacer la fenêtre, elle commence en S${numeros[cur.index]}`}
        onPointerDown={demarrer('debut')} onKeyDown={clavierDebut}><i aria-hidden="true" style={{ left: gauche - zones.debut.l - 3 }} /></button>
      <button type="button" className="ent-poi ent-poi-fin" data-poignee="fin" style={{ left: zones.fin.l, width: zones.fin.w }}
        aria-label={annee ? 'Revenir à la fenêtre d’avant' : 'Poignée de fin : tirer jusqu’au bout pour l’année'}
        onPointerDown={demarrer('fin')} onClick={e => { if (e.detail === 0) (annee ? onRevient : onAnnee)?.(); }}><i aria-hidden="true" style={{ left: droite - zones.fin.l - 3 }} /></button>
    </>
  );
}
