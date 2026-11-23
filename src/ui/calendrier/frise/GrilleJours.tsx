import React from 'react';
import { ecartJours } from '../../../domain/calendrier';
import { estWeekEnd } from '../echelle';
import type { Colonne } from './Rangee';
import { posee } from './posee';

/**
 * D385 (variantes B et C, `work/missions/2026-11-18-choix-calendrier/axe/index.html`) : la grille d'un axe qui porte des jours, posée dans la piste
 * de chaque rangée. Le week-end ombré, un trait par semaine (1,5 px, cave-700), un pointillé par jour (1 px, cave-800), le cadre de la semaine
 * dépliée (cave-50 à 25 %), et le trait d'aujourd'hui (2 px, `--alert`) ; son mot « auj. » n'est posé qu'une fois, en bas de la dernière piste.
 */
export interface GrilleJoursProps {
  colonnes: readonly Colonne[];
  largeurColonne: number;
  aujourdhui?: string;
  /** Le mot « auj. » au pied du trait (une seule piste le porte). */
  mot?: boolean;
}

const estLundi = (iso: string): boolean => new Date(`${iso}T00:00:00Z`).getUTCDay() === 1;

/** Le x (px) du milieu d'un jour sur l'axe ; `null` hors de l'axe. */
export function xDuMilieu(colonnes: readonly Colonne[], largeurColonne: number, iso: string): number | null {
  const i = colonnes.findIndex(c => iso >= c.debut && iso <= c.fin);
  if (i < 0) return null;
  const c = colonnes[i];
  const n = ecartJours(c.debut, c.fin) + 1;
  return (i + (ecartJours(c.debut, iso) + 0.5) / n) * largeurColonne;
}

export const GrilleJours: React.FC<GrilleJoursProps> = ({ colonnes, largeurColonne, aujourdhui, mot = false }) => {
  const lc = largeurColonne;
  const jours = colonnes.map((c, i) => ({ c, i, jour: c.debut === c.fin }));
  /* la semaine dépliée : une suite de 7 colonnes d'un jour au milieu de semaines (en vue Jour, tout est en jours : pas de cadre) */
  const toutEnJours = jours.every(j => j.jour);
  const premierJour = jours.findIndex(j => j.jour);
  const xAuj = aujourdhui ? xDuMilieu(colonnes, lc, aujourdhui) : null;
  return (
    <span className="cal-grille" aria-hidden="true" data-grille-jours>
      {jours.map(({ c, i, jour }) => (
        <React.Fragment key={c.debut}>
          {jour && estWeekEnd(c.debut) && <i className="cal-g-we" style={{ ...posee(i * lc), width: lc }} />}
          {i > 0 && <i className={`cal-g-t ${jour && !estLundi(c.debut) ? 'cal-g-jour' : toutEnJours ? 'cal-g-sem' : 'cal-g-s1'}`} style={posee(i * lc)} />}
        </React.Fragment>
      ))}
      {/* D406 : traits et cadres posés par `transform` (posee.ts) : une semaine dépliée les déplace sans décalage de mise en page */}
      {!toutEnJours && premierJour >= 0 && <i className="cal-g-deplie" style={{ ...posee(premierJour * lc), width: 7 * lc }} />}
      {xAuj !== null && <i className="cal-g-auj" data-auj style={posee(xAuj)}>{mot && <b>auj.</b>}</i>}
    </span>
  );
};
