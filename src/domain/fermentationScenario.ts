import type { FermentationGuide, FermentationGoal } from '../../functions/src/fermentationGuideSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { agreedFermentationFact, fermentationProgramIssues, recipeFermentationTemperature } from '../../functions/src/fermentationContext';
import { projectYeastRecipe } from './yeastProjection';
import type { TrialRecipe } from './hopIndex/trials';
import { findRecipeYeastMatches, withDocumentedYeastNames } from './hopIndex/recipeGuide';
import { normalizeHop } from './hopStage';
import { normalizedYeastText } from './yeastCatalogue';

/** Read-time identity resolution, shared by choice, manual scenario and consultation.
 * An explicit missing ID, ambiguous name, or conflicting maker/code cannot be
 * replaced by another strain. A unique stored alias can still supply documentary facts. */
export function resolveFermentationYeast<T extends HopYeast & { aliases?: readonly string[] }>(recipe: TrialRecipe, yeasts: T[]) {
  if (recipe.yeast.hopIndexId) return yeasts.find(y => y.id === recipe.yeast.hopIndexId);
  const names = withDocumentedYeastNames(yeasts);
  let matches = findRecipeYeastMatches(recipe.yeast.name, names);
  const maker = recipe.yeast.lab?.trim();
  if (maker) {
    const makerWords = normalizedYeastText(maker).split(' ').filter(Boolean);
    matches = matches.filter(match => {
      const published = match.item.catalogue?.manufacturer;
      if (!published || !makerWords.length) return false;
      const publishedWords = new Set(normalizedYeastText(published).split(' ').filter(Boolean));
      // A short stored lab name (e.g. "Lallemand") may omit its product division;
      // every supplied word must still name the published manufacturer.
      return makerWords.every(word => publishedWords.has(word));
    });
  }
  const strain = recipe.yeast.strain?.trim();
  if (strain) {
    const wanted = normalizedYeastText(strain).split(' ').filter(Boolean);
    const wantedCode = wanted.join('');
    matches = matches.filter(({ item }) => {
      const catalogue = item.catalogue;
      const productCode = catalogue?.productCode;
      if (productCode && normalizedYeastText(productCode).replace(/ /g, '') === wantedCode) return true;
      // Some listed products have no separate code field. Accept only a whole
      // token sequence in their stored name/aliases, never a fuzzy or first-row match.
      const labels = [item.name, ...(item.aliases ?? []), ...(catalogue?.aliases ?? [])];
      return labels.some(label => {
        const words = normalizedYeastText(label).split(' ').filter(Boolean);
        for (let start = 0; start + wanted.length <= words.length; start++) {
          if (words.slice(start, start + wanted.length).join('') === wantedCode) return true;
        }
        return false;
      });
    });
  }
  return matches.length === 1 ? matches[0].item : undefined;
}

export function fermentationDefaultGoal(guide?: FermentationGuide): FermentationGoal {
  // Prefer a documented neutral/balanced plan to an unsolicited aroma maximisation.
  return guide?.plans.find(p => p.goal === 'balanced' || p.goal === 'clean')?.goal ?? guide?.plans[0]?.goal ?? 'clean';
}

export function evaluateFermentationScenario(recipe: TrialRecipe, yeasts: (HopYeast & { aliases?: readonly string[] })[], guides: FermentationGuide[]) {
  const yeast = resolveFermentationYeast(recipe, yeasts);
  const guide = guides.find(g => g.enabled && g.yeastId === yeast?.id);
  const personalTemperature = recipeFermentationTemperature(recipe.yeast);
  const temperature = personalTemperature === undefined ? guide?.temperatureC ?? agreedFermentationFact(yeast, 'temperature', '°C') : personalTemperature ?? undefined;
  const attenuation = agreedFermentationFact(yeast, 'attenuation', '%') ?? (!yeast?.catalogue?.facts.some(f => f.key === 'attenuation') ? guide?.attenuationPct : undefined);
  const projection = projectYeastRecipe(recipe, { reference: yeast });
  const warnings: string[] = [];
  if (!yeast && !recipe.yeast.name.trim()) warnings.push('Levure à renseigner pour préciser ce scénario.');
  const issues = fermentationProgramIssues(recipe.fermentation ?? [], temperature, {
    pitchTempC: recipe.yeast.pitchTempC,
    ...(personalTemperature !== undefined ? { windowLabel: 'plage de conduite retenue' } : {}),
    hasDryHop: recipe.hops.some(h => normalizeHop(h).stage === 'dryHop' && (h.weightG > 0 || !Number.isFinite(h.weightG)))
  });
  warnings.push(...issues.map(i => i.message));
  const fg = projection.fg;
  // Process warnings are shared with hop tools. Projection warnings additionally
  // need the grist/OG, which those tools do not receive. Avoid duplicate windows.
  warnings.push(...projection.warnings.filter(w => !w.startsWith('Température :')));
  if(recipe.nolo?.enabled)warnings.push('NOLO : l’atténuation documentaire ne prédit pas l’alcool au conditionnement. Utiliser le bilan des sucres et les analyses du panneau NOLO.');
  return { version: 'yeast-scenario-3', yeast, guide, temperature, attenuation, fg, abv: projection.abv, projection, warnings, issues };
}
