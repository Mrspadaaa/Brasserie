import React, { useEffect, useRef, useState } from 'react';
import { bornes, etiquetteCourte, type Periode } from '../../../components/periode/periode';
import { lundiDe } from '../../../domain/calendrier';
import { ajouterJours, largeurTexte, lignesEtiquette, type Boite } from './Courbe';

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
export function zonesPoignees(gauche: number, droite: number, largeur: number): { debut: { l: number; w: number }; fin: { l: number; w: number } } {
  const finL = Math.max(0, Math.min(droite - PRISE_DEDANS, largeur - PRISE_POIGNEE));
  return { debut: { l: gauche - (PRISE_POIGNEE - PRISE_DEDANS), w: PRISE_POIGNEE }, fin: { l: finL, w: PRISE_POIGNEE } };
}

/** L'étiquette qui suit le doigt pendant le tirage : au-dessus du cadre (en haut de la courbe), bornée à la courbe. Hauteur 22 px. */
export function boiteTirage(texte: string, bord: number, largeur: number): Boite {
  const w = largeurTexte(texte, true) + 12;
  const l = clamp(bord - w / 2, 2, Math.max(2, largeur - 2 - w));
  return { l, r: l + w, t: 0, b: 22 };
}

/** Ce que la courbe sait des poignées pour leur donner le doigt : leurs zones de prise, et le geste à lancer. */
export interface PriseCadre {
  zones: ReturnType<typeof zonesPoignees>;
  tirer: (genre: 'debut' | 'fin', e: React.PointerEvent<Element>) => void;
}

export function Cadre({ numeros, lundis, index, nombre, largeur, annee, onChange, onAnnee, onRevient, onTropCourt, onTirage, etiquetteAnnee, prise }: CadreProps) {
  const total = numeros.length;
  const unit = largeur / Math.max(1, total);
  const [drag, setDrag] = useState<{ index: number; nombre: number; bord: number } | null>(null);
  const cur = drag ?? (annee ? { index: 0, nombre: total } : { index, nombre });
  const etiquette = etiquetteCadre(numeros, cur.index, cur.nombre, annee && !drag, etiquetteAnnee, lundis);
  const lignes = lignesEtiquette(etiquette, cur.nombre * unit);
  const gauche = cur.index * unit, droite = (cur.index + cur.nombre) * unit;
  const zones = zonesPoignees(gauche, droite, largeur);
  // Pendant le tirage, l'étiquette quitte le bas du cadre (où elle couvrait « 1 740 mis de côté », n° 24) : elle suit le doigt, en haut.
  const tirage = drag ? boiteTirage(etiquette, drag.bord, largeur) : null;
  const onTirageRef = useRef(onTirage);
  onTirageRef.current = onTirage;
  const cleTirage = tirage ? `${Math.round(tirage.l)}-${Math.round(tirage.r)}` : '';
  useEffect(() => { onTirageRef.current?.(tirage); }, [cleTirage]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onTirageRef.current?.(null), []);

  const demarrer = (genre: 'debut' | 'fin') => (e: React.PointerEvent<Element>) => {
    if (e.button > 0 || total === 0) return;
    e.stopPropagation();
    // Le doigt reste à la poignée même s'il sort du cadre (vrai toucher : Pointer Events, capture ; `touch-action: none` en CSS).
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* jsdom, pointeur déjà levé */ }
    const id = e.pointerId, x0 = e.clientX;
    const gauche0 = index * unit, w0 = nombre * unit;
    const gauche = gauche0;
    let bouge = false, droite = gauche0 + w0, dernier = index;
    const suit = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - x0;
      if (Math.abs(dx) > 4) bouge = true;
      if (annee) return;
      if (genre === 'fin') {
        const w = clamp(w0 + dx, w0, largeur - gauche);
        droite = gauche + w;
        setDrag({ index, nombre: Math.max(nombre, Math.round(w / unit)), bord: droite });
      } else {
        dernier = clamp(index + Math.round(dx / unit), 0, Math.max(0, total - nombre));
        setDrag({ index: dernier, nombre, bord: dernier * unit });
      }
    };
    const nettoie = () => { window.removeEventListener('pointermove', suit); window.removeEventListener('pointerup', fin); window.removeEventListener('pointercancel', annule); };
    const annule = (ev: PointerEvent) => { if (ev.pointerId !== id) return; nettoie(); setDrag(null); };
    const fin = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      nettoie();
      setDrag(null);
      if (annee) { if (!bouge) onRevient?.(); return; }
      if (genre === 'fin') {
        if (bouge && droite >= SEUIL_ANNEE * largeur) onAnnee(); else onTropCourt?.();
      } else if (bouge && dernier !== index) onChange({ index: dernier, nombre });
    };
    window.addEventListener('pointermove', suit);
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', annule);
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
        {!tirage && <span className="ent-cadre-l" data-cadre-etiquette>{lignes.map(l => <span key={l}>{l}</span>)}</span>}
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
