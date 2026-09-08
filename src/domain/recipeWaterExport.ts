import { describeSavedRecipeWater, type WaterReadingsRecipe } from './recipeWaterReadings';

/** Read-only export diagnostics. Reconstruct the retained treatment; never replan its doses. */
export function recipeWaterExport(recipe: WaterReadingsRecipe) {
  const plan = recipe.waterPlan;
  if (!plan) return {};
  const readings = describeSavedRecipeWater(recipe);
  if (!readings) {
    return { waterDiagnosticNote: 'Analyse source ou volumes manquants : traitement et pH non vérifiables.' };
  }
  const { treatment, phEstimate: ph, style, requestedRatio, targetRanges } = readings;
  return {
    treatedWater: treatment.treatedTotal,
    mashIons: treatment.treated.mash,
    spargeIons: treatment.treated.sparge,
    ra: treatment.raAfter,
    ...(ph.known ? {
      mashPhEstimated: ph.phPredicted,
      mashPhUncertainty: ph.uncertainty,
      mashPhNote: 'Estimation après les doses d’acide retenues ; ne garantit pas la consigne. Vérifier au pH-mètre sur un échantillon refroidi.'
    } : { mashPhNote: ph.note }),
    ...(Number.isFinite(requestedRatio) ? { requestedRatio } : {}),
    requestedRatioNote: plan.ratioOverride != null ? 'Choix manuel enregistré.'
      : plan.targetIons ? 'Rapport de la cible personnelle.'
      : 'Recommandation actuelle calculée depuis la recette ; les doses retenues peuvent provenir d’un réglage antérieur.',
    ...(treatment.ratio.ratio != null ? { achievedRatio: treatment.ratio.ratio } : {}),
    mineralRanges: Object.fromEntries(Object.entries(targetRanges)
      .filter(([ion]) => !style.untargetedIons?.includes(ion as keyof typeof targetRanges))),
    bicarbonateReferenceNote: plan.targetIons?.hco3 != null
      ? 'Cible personnelle après acide ; à concilier avec l’alcalinité de l’empâtage.'
      : 'Les six ions, HCO₃ inclus, doivent respecter le profil après les deux doses d’acide. Le pH d’empâtage est évalué séparément.'
  };
}
