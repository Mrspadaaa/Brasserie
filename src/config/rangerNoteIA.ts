import type { ModeIA } from '../domain/rangerNote';

/**
 * Drapeau d'interface de ks4 (la note rangée par l'IA). La tâche serveur `rangerNote` est écrite et testée, PAS déployée :
 * la production ne propose donc jamais l'IA (la note se garde brute dans le fil).
 *  - `production` : seulement si le build porte `VITE_RANGER_NOTE_IA=production` (après déploiement de la fonction, avec son accord) ;
 *  - `simule` : serveur de développement (`import.meta.env.DEV`, éliminé au build) ET banc `?dev-local` : réponse simulée, marquée « exemple » ;
 *  - sinon `eteint`.
 */
export function modeDe(valeur: unknown, dev: unknown, devLocal: boolean): ModeIA {
  if (valeur === 'production') return 'production';
  if (dev === true && devLocal) return 'simule';
  return 'eteint';
}

const devLocal = (): boolean => typeof location !== 'undefined' && new URLSearchParams(location.search).has('dev-local');

/** Lu à l'appel, jamais au chargement du module. */
export const modeRangerNote = (): ModeIA => modeDe(import.meta.env.VITE_RANGER_NOTE_IA, import.meta.env.DEV, devLocal());
