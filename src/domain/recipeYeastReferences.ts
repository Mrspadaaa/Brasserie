import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { YeastSpec } from '../types';
import { yeastReferences } from './yeastReferences';

/** Save only referenced identities with the recipe. Existing personal records,
 * including invalid ones, remain authoritative and are never repaired here. */
export function recipeYeastReferencesToSave(recipes: { yeast?: YeastSpec }[], saved: HopKnowledge[]): HopYeast[] {
  const present = new Set(saved.map(r => r.id));
  const requested = new Set(recipes.map(r => r.yeast?.hopIndexId).filter((id): id is string => !!id && !present.has(id)));
  if (!requested.size) return [];
  return yeastReferences(saved).filter(r => requested.has(r.id)).map(({ aliases: _aliases, ...reference }) => reference);
}
