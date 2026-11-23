import { validHopRange, type HopRange } from '../../functions/src/hopIndexSchema';
import type { ListedStyle } from './brewingStyles';

export type BrewingStyleDimension = 'og' | 'fg' | 'abv' | 'ibu' | 'srm';
export interface BrewingStyleEstimate { range: HopRange | null; origin: 'recipeProjection' | 'scenarioHypothesis' | 'measured'; }
const units = { og: 'SG', fg: 'SG', abv: '% vol.', ibu: 'IBU', srm: 'SRM' } as const;

/** A style is an explicit target, never a multiplier for flavour or chemistry. */
export function compareBeerWithBrewingStyle(style: ListedStyle, estimates: Partial<Record<BrewingStyleDimension, BrewingStyleEstimate>>) {
  const dimensions = (Object.keys(units) as BrewingStyleDimension[]).map(dimension => {
    const estimate = estimates[dimension];
    const target = style.stats[dimension] ?? null;
    if (target && (!validHopRange(target) || target.min < 0)) throw Error('Plage de style invalide.');
    if (estimate?.range && (!validHopRange(estimate.range) || estimate.range.min < 0)) throw Error('Valeur de comparaison invalide.');
    const range = estimate?.range ?? null;
    const status = !target ? 'notSpecified' : !range ? 'unknown'
      : range.max < target.min ? 'below' : range.min > target.max ? 'above'
      : range.min >= target.min && range.max <= target.max ? 'within' : 'overlapping';
    return { dimension, unit: units[dimension], range: range && { ...range }, origin: estimate?.origin ?? null,
      target: target && { ...target }, targetSource: structuredClone(style.source), status };
  });
  return { version: 'brewing-style-comparison-v1' as const, style: structuredClone(style), dimensions,
    outside: dimensions.filter(row => row.status === 'above' || row.status === 'below').map(row => row.dimension),
    uncertain: dimensions.filter(row => row.status === 'unknown' || row.status === 'overlapping').map(row => row.dimension),
    limitations: ['La comparaison porte sur des valeurs et une intention déclarée; elle ne mesure ni conformité sensorielle ni préférence.',
      'Une dimension inconnue reste inconnue. Renommer le style ne modifie aucun calcul de bière.'] };
}
