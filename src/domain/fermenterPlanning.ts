import type { BrewingEquipment, Recipe, RecipeSnapshot } from '../types';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import { YEAST_RECIPE_PROFILES } from '../data/yeastRecipeProfiles';
import { findRecipeYeastMatches, withDocumentedYeastNames } from './hopIndex/recipeGuide';
import { yeastReferences } from './yeastReferences';

export interface FermenterRecommendation {
  headspacePct: number;
  recommendedFillL: number;
  basis: 'manual' | 'manufacturer' | 'profile' | 'provisional';
  reason: string;
  source?: HopSource;
  documentedHeadspacePct?: number;
  belowDocumentedRecommendation: boolean;
}

const validPct = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 100;
type FermenterRecipe = Pick<Recipe | RecipeSnapshot, 'yeast' | 'installation'>;

/** Re-evaluated for the actual selected product. Names identify only an exact,
 * unambiguous catalogue product; another form never inherits its guidance. */
export function fermenterRecommendation(recipe: FermenterRecipe, equipment?: BrewingEquipment): FermenterRecommendation | undefined {
  if (!equipment || !Number.isFinite(equipment.fermenterCapacityL) || equipment.fermenterCapacityL <= 0) return;
  const yeast = recipe.yeast;
  const refs = yeastReferences(undefined, { includeCatalogue: false });
  const matches = yeast?.hopIndexId ? refs.filter(r => r.id === yeast.hopIndexId)
    : yeast?.name ? findRecipeYeastMatches(yeast.name, withDocumentedYeastNames(refs)).map(m => m.item) : [];
  const reference = matches.length === 1 ? matches[0] : undefined;
  const documented = reference && yeast?.form && reference.form === yeast.form
    ? YEAST_RECIPE_PROFILES.find(p => p.yeastId === reference.id && validPct(p.headspacePct)) : undefined;
  const manual = recipe.installation?.fermenterHeadspacePct;
  const profile = equipment.fermenterHeadspacePct;
  const basis = validPct(manual) ? 'manual' : documented ? 'manufacturer'
    : validPct(profile) && profile !== 20 ? 'profile' : 'provisional';
  const headspacePct = basis === 'manual' ? manual! : documented?.headspacePct ?? (validPct(profile) ? profile : 20);
  const reason = basis === 'manual' ? recipe.installation?.headspaceReason?.trim() || 'Réserve choisie pour cette recette.'
    : basis === 'manufacturer' ? `${documented!.label} : réserve documentée par ${documented!.source.author}.`
    : basis === 'profile' ? 'Repère personnel de l’installation, ajustable pour cette recette.'
    : 'Repère provisoire : 20 % d’espace libre, à ajuster selon la recette et la levure.';
  return {
    headspacePct,
    recommendedFillL: Math.floor((equipment.fermenterCapacityL * (1 - headspacePct / 100) + 1e-8) * 10) / 10,
    basis, reason,
    ...(documented ? { source: documented.source, documentedHeadspacePct: documented.headspacePct } : {}),
    belowDocumentedRecommendation: !!documented && headspacePct < documented.headspacePct!
  };
}
