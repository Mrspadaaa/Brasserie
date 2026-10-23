// Moments d'un ajout : la forme claire (Quand) et les champs du moteur. Sans dépendance au moteur en direct.
import { MOMENTS, type MomentId } from '../../../src/engine';
import { CONDITIONS } from '../donnees/cas';
import type { AjoutParcours, Quand, RecetteParcours } from './types';

const BOUILLIR: MomentId[] = ['b60', 'b30', 'b15', 'b10', 'b5', 'b0'];
/** Classe de moment du moteur la plus proche d'une minute d'ébullition (la minute, elle, fait foi). */
export function classeEbullition(minutes: number): MomentId {
  return BOUILLIR.reduce((m, x) => (Math.abs(MOMENTS[x].minutes! - minutes) < Math.abs(MOMENTS[m].minutes! - minutes) ? x : m), 'b60');
}

/** Où se trouve un ajout, en clair. */
export function quandDe(a: AjoutParcours, recette: RecetteParcours): Quand {
  const t = MOMENTS[a.moment].timing;
  if (t === 'firstWort') return { type: 'premierMout' };
  if (t === 'boil') return { type: 'ebullition', minutes: a.minutes ?? MOMENTS[a.moment].minutes ?? recette.boilMin };
  if (t === 'whirlpool') return { type: 'whirlpool' };
  return { type: 'dryhop', phase: a.moment === 'dryActive' ? 'actif' : 'apres', jours: a.jours ?? CONDITIONS.jours };
}

/** Pose un ajout à un moment : champs du moteur (moment, day) et du parcours (minutes, jours). */
export function placer(a: AjoutParcours, q: Quand, recette: RecetteParcours): AjoutParcours {
  const { minutes: _m, jours: _j, day: _d, ...reste } = a;
  switch (q.type) {
    case 'premierMout': return { ...reste, moment: 'fwh' };
    case 'whirlpool': return { ...reste, moment: 'wp' };
    case 'ebullition': {
      const minutes = Math.max(0, Math.min(recette.boilMin, Math.round(q.minutes / 5) * 5));
      return { ...reste, moment: classeEbullition(minutes), minutes };
    }
    case 'dryhop': {
      const moment = q.phase === 'actif' ? 'dryActive' : 'dryPost';
      return { ...reste, moment, day: CONDITIONS.jourDebut[moment], jours: Math.max(1, Math.round(q.jours)) };
    }
  }
}
