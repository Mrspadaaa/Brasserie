// La table des calculs lourds de la maquette (#165, D65 § Recommandation 2) : proposer, suggerer, remplacants,
// substitutes et les leviers levure. Fonctions pures et synchrones, arguments et résultats en données simples
// (clonables). Servie sur le fil principal (client.ts) ou par le worker persistant (calcul.worker.ts, #171) : la même
// table, importée par les deux.
import type { SubstitutionOptions } from '../../../domain/hopIndex/v4';
import { leviersLevure, proposer, remplacants, suggerer } from './adaptateur';
import { moteur } from './donnees';
import { memo } from './mesure';

// L'échelle du style est un gros objet dérivé de son code : la clé lit le code.
export const cleSubstitutes = (cle: string, o: SubstitutionOptions) => JSON.stringify([cle, { ...o, style: o.style?.code ?? null }]);

export const CALCULS = {
  proposer,
  suggerer,
  remplacants,
  /** substitutes du moteur des données injectées (pas celui des fixtures). */
  substitutes: memo('substitutes', cleSubstitutes, (cle: string, options: SubstitutionOptions) => moteur().substitutes(cle, options), 64),
  leviers: leviersLevure,
};
export type CalculsParcours = typeof CALCULS;
