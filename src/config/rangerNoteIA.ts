import type { ModeIA } from '../domain/rangerNote';

/**
 * Drapeau d'interface de ks4 (la note rangée par l'IA). Passe 3 (15.11) : allumé en production, accord du brasseur mot pour mot
 * « Oui la moins chère, et bouton + pour utiliser l'autre meilleure mais un peu plus chère » (Rapide = Flash-Lite, « + » = Hydrogen,
 * côté serveur : `functions/src/models.ts`, `rangerNoteAttempts`).
 *  - banc `?dev-local` sur le serveur de développement : TOUJOURS `simule` (réponse simulée, marquée « exemple »), même si la valeur dit
 *    `production` ; `?dev-local&ia=eteint` y rejoue le mode éteint ;
 *  - `production` : le build la pose par défaut (`vite.config.ts`, `VITE_RANGER_NOTE_IA`), vérifiée par `scripts/check-build-flags.mjs` ;
 *  - `eteint` : `VITE_RANGER_NOTE_IA=eteint` au build l'éteint exprès (la note se garde brute, rangeable à la main) ;
 *  - aucune valeur (serveur de développement hors banc, Vitest) : `eteint`, jamais un appel Gemini par accident.
 */
export function modeDe(valeur: unknown, dev: unknown, devLocal: boolean, force?: unknown): ModeIA {
  if (dev === true && devLocal) return force === 'eteint' ? 'eteint' : 'simule';
  if (valeur === 'production') return 'production';
  return 'eteint';
}

const param = (nom: string): string | null => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get(nom));

/** La clé reste écrite dans le paquet (`VITE_RANGER_NOTE_IA:"production"`) : `check-build-flags.mjs` la lit avant tout déploiement. */
const DRAPEAU = { VITE_RANGER_NOTE_IA: import.meta.env.VITE_RANGER_NOTE_IA as unknown };

/** Lu à l'appel, jamais au chargement du module. Hors serveur de développement, `?dev-local` et `?ia` ne font rien. */
export const modeRangerNote = (): ModeIA => modeDe(DRAPEAU.VITE_RANGER_NOTE_IA, import.meta.env.DEV, param('dev-local') !== null, param('ia'));
