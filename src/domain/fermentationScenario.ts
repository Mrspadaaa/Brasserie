import type { FermentationGuide, FermentationGoal } from '../../functions/src/fermentationGuideSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { agreedFermentationFact, fermentationProgramIssues } from '../../functions/src/fermentationContext';
import { fermentationGravityFromAttenuation } from '../../functions/src/fermentationScienceCore';
import type { TrialRecipe } from './hopIndex/trials';
import { findRecipeYeastMatches, withDocumentedYeastNames } from './hopIndex/recipeGuide';
import { normalizeHop } from './hopStage';

/** Read-time identity resolution, shared by choice, manual scenario and consultation.
 * An explicit missing ID or ambiguous name cannot be replaced by another strain. */
export function resolveFermentationYeast<T extends HopYeast & { aliases?: readonly string[] }>(recipe: TrialRecipe, yeasts: T[]) {
  if (recipe.yeast.hopIndexId) return yeasts.find(y => y.id === recipe.yeast.hopIndexId);
  const matches = findRecipeYeastMatches(recipe.yeast.name, withDocumentedYeastNames(yeasts));
  return matches.length === 1 ? matches[0].item : undefined;
}

export function fermentationDefaultGoal(guide?: FermentationGuide): FermentationGoal {
  // Prefer a documented neutral/balanced plan to an unsolicited aroma maximisation.
  return guide?.plans.find(p => p.goal === 'balanced' || p.goal === 'clean')?.goal ?? guide?.plans[0]?.goal ?? 'clean';
}

export function evaluateFermentationScenario(recipe: TrialRecipe, yeasts: (HopYeast & { aliases?: readonly string[] })[], guides: FermentationGuide[]) {
  const yeast = resolveFermentationYeast(recipe, yeasts);
  const guide = guides.find(g => g.enabled && g.yeastId === yeast?.id);
  const temperature = guide?.temperatureC ?? agreedFermentationFact(yeast, 'temperature', '°C');
  const attenuation = guide?.attenuationPct ?? agreedFermentationFact(yeast, 'attenuation', '%');
  const warnings: string[] = [];
  if (!yeast) warnings.push('Souche non identifiée avec certitude : choisis sa référence pour préciser ce scénario.');
  const issues = fermentationProgramIssues(recipe.fermentation ?? [], temperature, {
    pitchTempC: recipe.yeast.pitchTempC,
    hasDryHop: recipe.hops.some(h => normalizeHop(h).stage === 'dryHop' && (h.weightG > 0 || !Number.isFinite(h.weightG)))
  });
  warnings.push(...issues.map(i => i.message));
  const fg = fermentationGravityFromAttenuation(attenuation, recipe.ogTarget);
  return { version: 'yeast-scenario-2', yeast, guide, temperature, attenuation, fg, warnings, issues };
}
