import React, { useRef } from 'react';
import { ajouterJours, etiquetteS, jourLisible, lundiDe } from '../../../domain/calendrier';
import { lettreDuJour, type Echelle } from '../echelle';
import type { Colonne } from '../frise/Rangee';

/**
 * La bande d'un axe qui n'est pas en semaines seules (D385, `work/missions/2026-11-18-choix-calendrier/axe/index.html`) :
 * - vue Jour (variante B, `bandeJours('deux')`) : « S47 » au-dessus de chaque semaine, puis la lettre et le numéro de chaque jour ; aujourd'hui
 *   en rouge texte, plus gras ;
 * - semaine dépliée (variante C, `bandeC()`) : « S47 16–22 nov. · toucher pour replier » sur ses sept jours, puis ses jours ; les autres
 *   semaines restent des boutons qui déplient la leur ;
 * - Mois : le nom court de chaque mois.
 * Un appui long de 500 ms sur une semaine note une idée à son lundi, comme la bande des semaines (E36). Le toucher d'un jour donne sa date dans
 * la bulle de l'en-tête (E04 suit D385 : la date d'une semaine est dans son en-tête dépliée).
 */
export interface BandeColonnesProps {
  colonnes: readonly Colonne[];
  echelle: Echelle;
  aujourdhui?: string;
  /** Le lundi de la semaine dépliée (variante C) ; `null` : aucune. */
  deplie?: string | null;
  onDeplier?: (lundi: string | null) => void;
  onIdeeSemaine?: (lundi: string) => void;
  /** Le toucher d'un jour : sa date (bulle de l'en-tête). */
  onJour?: (jour: string, colonne: number, colonnes: number) => void;
  /** Le toucher d'une semaine en vue Jour : sa date, comme avant (« S47, 16 – 22 nov. »). */
  onSemaine?: (lundi: string, colonne: number, colonnes: number) => void;
}

const DELAI = 500;
const NOMS_JOURS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'] as const;
/** « lun. 16 nov. » */
export const jourEntier = (iso: string): string => `${NOMS_JOURS[(new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7]} ${jourLisible(iso)}`;
/** « 16–22 nov. », « 30 nov.–6 déc. » */
export function plageSemaine(lundi: string): string {
  const fin = ajouterJours(lundi, 6);
  const [j1, m1] = jourLisible(lundi).split(' ');
  return lundi.slice(5, 7) === fin.slice(5, 7) ? `${j1}–${jourLisible(fin)}` : `${j1} ${m1}–${jourLisible(fin)}`;
}

/** L'appui long d'une semaine (idée datée) et son toucher, sans que l'un déclenche l'autre. */
function useAppui(onLong: ((lundi: string) => void) | undefined) {
  const appui = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout>; long: boolean } | null>(null);
  const annule = () => { if (appui.current) { clearTimeout(appui.current.timer); appui.current = null; } };
  return (lundi: string, toucher: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button > 0 || !onLong) return;
      annule();
      const timer = setTimeout(() => { if (appui.current) { appui.current.long = true; onLong(lundi); } }, DELAI);
      appui.current = { x: e.clientX, y: e.clientY, timer, long: false };
    },
    onPointerMove: (e: React.PointerEvent) => { const a = appui.current; if (a && !a.long && Math.hypot(e.clientX - a.x, e.clientY - a.y) > 8) annule(); },
    onPointerUp: () => { if (appui.current && !appui.current.long) annule(); },
    onPointerCancel: annule,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => { if (appui.current?.long) { appui.current = null; return; } toucher(); }
  });
}

export function BandeColonnes({ colonnes, echelle, aujourdhui, deplie = null, onDeplier, onIdeeSemaine, onJour, onSemaine }: BandeColonnesProps) {
  const n = colonnes.length;
  const appui = useAppui(onIdeeSemaine);
  const grille = { ['--n' as string]: n } as React.CSSProperties;

  if (echelle === 'mois' && !colonnes.some(c => c.debut === c.fin)) {
    return (
      <div className="ent-bj ent-bj--mois" data-bande-colonnes="mois" role="group" aria-label="Mois" style={grille}>
        {colonnes.map((c, i) => <span key={c.debut} className="ent-bj-m" style={{ gridColumn: `${i + 1}` }}>{c.etiquette}</span>)}
      </div>
    );
  }

  /* les semaines de l'axe : leurs colonnes (7 jours, ou une semaine entière) */
  const semaines: Array<{ lundi: string; de: number; a: number; jours: boolean }> = [];
  colonnes.forEach((c, i) => {
    const lundi = lundiDe(c.debut), jour = c.debut === c.fin;
    const der = semaines[semaines.length - 1];
    if (der && der.lundi === lundi) der.a = i;
    else semaines.push({ lundi, de: i, a: i, jours: jour });
  });
  const jourBouton = (c: Colonne, i: number) => {
    const auj = c.debut === aujourdhui;
    return (
      <button key={c.debut} type="button" className={`ent-bj-j${auj ? ' ent-bj-auj' : ''}`} data-jour={c.debut} data-lundi={c.debut}
        style={{ gridColumn: `${i + 1}`, gridRow: '2' }} aria-label={jourEntier(c.debut)} onClick={() => onJour?.(c.debut, i, n)}>
        <small aria-hidden="true">{lettreDuJour(c.debut)}</small><span aria-hidden="true">{Number(c.debut.slice(8, 10))}</span>
      </button>
    );
  };

  return (
    <div className={`ent-bj ent-bj--${deplie ? 'deplie' : 'jours'}`} data-bande-colonnes={deplie ? 'deplie' : 'jours'} role="group" aria-label="Jours et semaines" style={grille}>
      {semaines.map(s => {
        const col = `${s.de + 1} / ${s.a + 2}`;
        if (!s.jours) {
          /* une semaine fermée, à côté de la dépliée : la toucher déplie la sienne */
          return (
            <button key={s.lundi} type="button" className="ent-bj-s" data-semaine-bande={s.lundi} data-lundi={s.lundi} style={{ gridColumn: col, gridRow: '1 / span 2' }}
              aria-label={`${etiquetteS(s.lundi)}, ${plageSemaine(s.lundi)} : déplier en jours`} {...appui(s.lundi, () => onDeplier?.(s.lundi))}>
              {etiquetteS(s.lundi)}
            </button>
          );
        }
        if (deplie && s.lundi === deplie) {
          return (
            <React.Fragment key={s.lundi}>
              <button type="button" className="ent-bj-t ent-bj-replier" data-replier={s.lundi} style={{ gridColumn: col, gridRow: '1' }}
                aria-label={`${etiquetteS(s.lundi)}, ${plageSemaine(s.lundi)} : replier`} {...appui(s.lundi, () => onDeplier?.(null))}>
                {etiquetteS(s.lundi)} <small>{plageSemaine(s.lundi)} · toucher pour replier</small>
              </button>
              {colonnes.slice(s.de, s.a + 1).map((c, k) => jourBouton(c, s.de + k))}
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={s.lundi}>
            <button type="button" className="ent-bj-t" data-semaine-bande={s.lundi} style={{ gridColumn: col, gridRow: '1' }}
              aria-label={`${etiquetteS(s.lundi)}, ${plageSemaine(s.lundi)}`} {...appui(s.lundi, () => onSemaine?.(s.lundi, s.de, n))}>
              {etiquetteS(s.lundi)}
            </button>
            {colonnes.slice(s.de, s.a + 1).map((c, k) => jourBouton(c, s.de + k))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
