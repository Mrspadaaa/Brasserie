import type { FermentationGuide, FermentationGoal } from '../../functions/src/fermentationGuideSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { HopRange, HopSource } from '../../functions/src/hopIndexSchema';
import { fermentationGravityFromAttenuation } from '../../functions/src/fermentationScienceCore';
import type { TrialRecipe } from './hopIndex/trials';
import { findRecipeYeastMatches, withDocumentedYeastNames } from './hopIndex/recipeGuide';
import { catalogueFacts } from './yeastCatalogue';
import { normalizeHop } from './hopStage';

/** Read-time identity resolution, shared by choice, manual scenario and consultation.
 * An explicit missing ID or ambiguous name cannot be replaced by another strain. */
export function resolveFermentationYeast<T extends HopYeast & { aliases?: readonly string[] }>(recipe: TrialRecipe, yeasts: T[]) {
  if (recipe.yeast.hopIndexId) return yeasts.find(y => y.id === recipe.yeast.hopIndexId);
  const matches = findRecipeYeastMatches(recipe.yeast.name, withDocumentedYeastNames(yeasts));
  return matches.length === 1 ? matches[0].item : undefined;
}

type SourcedRange = { range: HopRange; source: HopSource };
/** Qualified/conflicting facts stay documentary. Identical reports are not replicas. */
function agreedFact(yeast: HopYeast | undefined, key: 'temperature' | 'attenuation', unit: string): SourcedRange | undefined {
  if (!yeast) return undefined;
  const facts = catalogueFacts(yeast, key), first = facts[0];
  if (!first?.range || !facts.every(f => f.qualifier === 'range' && f.unit === unit &&
    f.range?.min === first.range!.min && f.range?.max === first.range!.max &&
    (!f.context || f.context === 'Beer'))) return undefined;
  return { range: first.range, source: first.source };
}

export function fermentationDefaultGoal(guide?: FermentationGuide): FermentationGoal {
  // Prefer a documented neutral/balanced plan to an unsolicited aroma maximisation.
  return guide?.plans.find(p => p.goal === 'balanced' || p.goal === 'clean')?.goal ?? guide?.plans[0]?.goal ?? 'clean';
}

export function evaluateFermentationScenario(recipe: TrialRecipe, yeasts: (HopYeast & { aliases?: readonly string[] })[], guides: FermentationGuide[]) {
  const yeast = resolveFermentationYeast(recipe, yeasts);
  const guide = guides.find(g => g.enabled && g.yeastId === yeast?.id);
  const temperature = guide?.temperatureC ?? agreedFact(yeast, 'temperature', '°C');
  const attenuation = guide?.attenuationPct ?? agreedFact(yeast, 'attenuation', '%');
  const warnings: string[] = [];
  if (!yeast) warnings.push('Souche non identifiée avec certitude : choisis sa référence pour préciser ce scénario.');
  const steps = recipe.fermentation ?? [];
  const active = steps.filter(s => s.kind === 'primaire' || s.kind === 'reposDiacetyle');
  if (!active.length) warnings.push('Aucun palier de fermentation principale renseigné.');
  for (const s of steps) {
    const name = s.name || 'Palier';
    if (!s.kind || !['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(s.kind)) warnings.push(`${name} : phase inconnue, effet sur la fermentation non évalué.`);
    if (!Number.isFinite(s.days) || s.days < 0) warnings.push(`${name} : durée inconnue ou invalide.`);
    if (s.kind !== 'primaire' && s.kind !== 'reposDiacetyle') continue;
    if (!Number.isFinite(s.tempC)) warnings.push(`${name} : température inconnue.`);
    else if (temperature && (s.tempC < temperature.range.min || s.tempC > temperature.range.max)) warnings.push(`${name} : ${s.tempC} °C, hors de la fenêtre fabricant (${temperature.range.min}–${temperature.range.max} °C).`);
  }
  if (Number.isFinite(recipe.yeast.pitchTempC) && temperature && (recipe.yeast.pitchTempC! < temperature.range.min || recipe.yeast.pitchTempC! > temperature.range.max)) warnings.push('Ensemencement hors de la fenêtre de fermentation fabricant ; vérifier la consigne spécifique d’ensemencement.');
  if (yeast && !temperature) warnings.push('Fenêtre de température absente ou sources non concordantes.');
  const dryHopSteps = steps.filter(s => s.kind === 'ajout' && /houblonnage\s+[àa]\s+cru|dry[ -]?hop/iu.test(s.name));
  if (dryHopSteps.length && !recipe.hops.some(h => normalizeHop(h).stage === 'dryHop')) warnings.push('Le calendrier nomme un houblonnage à cru, mais aucun ajout à cru ne figure dans la recette. Ce palier ne crée pas un effet aromatique.');
  const fg = fermentationGravityFromAttenuation(attenuation, recipe.ogTarget);
  return { version: 'yeast-scenario-1', yeast, guide, temperature, attenuation, fg, warnings };
}
