import React, { useState } from 'react';
import { bornes, type Periode } from '../../../components/periode/periode';
import { lundiDe } from '../../../domain/calendrier';
import { ajouterJours } from './Courbe';

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
  return { du: debut, semaines: clamp(semainesEntre(debut, fin) + 1, 1, total - decalage) };
}

/** Le texte du bouton de période : « 6 sem. », « 3 mois », « 6 mois », « An », ou le nombre de semaines tel quel. */
export function libelleDuree(semaines: number, annee: boolean): string {
  if (annee || semaines >= SEMAINES_ANNEE) return 'An';
  if (semaines === 13) return '3 mois';
  if (semaines === 26) return '6 mois';
  return `${semaines} sem.`;
}

export interface CadreProps {
  /** Les numéros ISO des semaines de la courbe (52). */
  numeros: readonly number[];
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
}

export function Cadre({ numeros, index, nombre, largeur, annee, onChange, onAnnee, onRevient, onTropCourt }: CadreProps) {
  const total = numeros.length;
  const unit = largeur / Math.max(1, total);
  const [drag, setDrag] = useState<{ index: number; nombre: number } | null>(null);
  const cur = drag ?? (annee ? { index: 0, nombre: total } : { index, nombre });
  const etiquette = `S${numeros[cur.index] ?? ''} – S${numeros[Math.min(total - 1, cur.index + cur.nombre - 1)] ?? ''}`;

  const demarrer = (genre: 'debut' | 'fin') => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button > 0 || total === 0) return;
    e.stopPropagation();
    const id = e.pointerId, x0 = e.clientX;
    const gauche = index * unit, w0 = nombre * unit;
    let bouge = false, droite = gauche + w0, dernier = index;
    const suit = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - x0;
      if (Math.abs(dx) > 4) bouge = true;
      if (annee) return;
      if (genre === 'fin') {
        const w = clamp(w0 + dx, w0, largeur - gauche);
        droite = gauche + w;
        setDrag({ index, nombre: Math.max(nombre, Math.round(w / unit)) });
      } else {
        dernier = clamp(index + Math.round(dx / unit), 0, Math.max(0, total - nombre));
        setDrag({ index: dernier, nombre });
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

  const clavierDebut = (e: React.KeyboardEvent) => {
    const pas = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!pas || annee) return;
    e.preventDefault();
    const i = clamp(index + pas, 0, Math.max(0, total - nombre));
    if (i !== index) onChange({ index: i, nombre });
  };

  return (
    <div className="ent-cadre" role="group" aria-label={`Fenêtre : ${etiquette}`} data-annee={annee ? 'oui' : undefined} data-glisse={drag ? 'oui' : undefined}
      style={{ left: cur.index * unit, width: cur.nombre * unit }}>
      <span className="ent-cadre-l">{etiquette}</span>
      <button type="button" className="ent-poi ent-poi-debut" aria-label={annee ? 'Revenir à la fenêtre d’avant' : `Poignée de début : déplacer la fenêtre, elle commence en S${numeros[cur.index]}`}
        onPointerDown={demarrer('debut')} onKeyDown={clavierDebut}><i aria-hidden="true" /></button>
      <button type="button" className="ent-poi ent-poi-fin" aria-label={annee ? 'Revenir à la fenêtre d’avant' : 'Poignée de fin : tirer jusqu’au bout pour l’année'}
        onPointerDown={demarrer('fin')} onClick={e => { if (e.detail === 0) (annee ? onRevient : onAnnee)?.(); }}><i aria-hidden="true" /></button>
    </div>
  );
}
