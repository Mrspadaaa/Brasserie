// Intensité de la variété sur un axe (voie f9, A3, D120) : le radar Beer Maverick (entier de 0 à 5) pèse dans l'EFFET simulé par un facteur centré sur 1.
import { hopRef } from './data';
import { radarDe } from './departage';
import type { FamilyId } from './families';

/** Radar Beer Maverick : 3 sur 5 est le repère neutre (facteur 1), chaque cran de radar en plus ou en moins pèse ± `PENTE_INTENSITE` dans l'effet. Hypothèse du pilote [H] à confirmer par le brasseur. */
export const RADAR_NEUTRE = 3;
export const PENTE_INTENSITE = 0.2;
export interface FacteurIntensite { radar: number | null; facteur: number }
/** Facteur de l'effet d'une variété sur une famille : 1 + 0,2 × (radar − 3), soit 0,4 à 1,4. Radar inconnu, ou famille sans axe (pomme/poire, melon, terreux) : 1 et `radar: null` (neutre, dit). */
export function facteurIntensite(varietyId: string, f: FamilyId): FacteurIntensite {
  const h = hopRef(varietyId)?.catalogue;
  const radar = h ? radarDe(h, f) : null;
  return radar === null ? { radar: null, facteur: 1 } : { radar, facteur: Math.round((1 + PENTE_INTENSITE * (radar - RADAR_NEUTRE)) * 100) / 100 };
}
