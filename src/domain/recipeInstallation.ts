import type { BrewhouseProfile, Recipe } from '../types';
import { equipmentCheck } from './brewEquipment';
import { fermenterRecommendation } from './fermenterPlanning';
import { BrewingMath, kettleHopGrams } from '../services/brewingMath';

/** A new batch must not silently assign today's installation to an old recipe. */
export function recipeInstallationAdoptionIssue(
  recipe: Pick<Recipe, 'brewhouse'>,
  activeProfile?: BrewhouseProfile
): string | undefined {
  if (recipe.brewhouse && (recipe.brewhouse.equipment || !activeProfile?.equipment)) return;
  const reason = recipe.brewhouse
    ? 'Les capacités du matériel de cette recette ne sont pas figées.'
    : 'Le matériel de cette recette n’est pas figé.';
  return activeProfile?.equipment
    ? `${reason} Ouvre « Modifier la recette », puis choisis « Adapter à mon matériel actuel » avant de lancer un nouveau brassin.`
    : `${reason} Renseigne ton matériel dans Paramètres → Brasserie, puis ouvre « Modifier la recette » pour l’adapter avant de lancer un nouveau brassin.`;
}

/** Drafts can be kept while unresolved; launching a batch requires a feasible recorded plan. */
export function recipeInstallationIssues(recipe: Recipe, activeProfile?: BrewhouseProfile): string[] {
  const adoptionIssue = recipeInstallationAdoptionIssue(recipe, activeProfile);
  if (adoptionIssue) return [adoptionIssue];
  const rig=recipe.brewhouse,e=rig?.equipment;
  if(!e) return [];
  const grain=(recipe.fermentables??[]).filter(f=>f.kind==='grain'&&(f.use??'empatage')==='empatage').reduce((s,f)=>s+f.weightKg,0);
  const recommendation=fermenterRecommendation(recipe,e);
  const issues:string[]=[];
  if(recipe.volumeL>=e.fermenterCapacityL) issues.push('Le volume prévu atteint ou dépasse la capacité physique du fermenteur.');
  if(recipe.nolo?.enabled && ['coldExtraction','secondRunnings'].includes(recipe.nolo.process)) return issues;
  if(!recipe.waterPlan || grain<=0) return issues;
  const mashL=recipe.waterPlan.mashWaterL,spargeL=recipe.waterPlan.spargeWaterL;
  if(recipe.mash?.spargeType==='none' && spargeL>0) issues.push('Un rinçage est saisi alors que le programme est prévu sans rinçage.');
  const water=BrewingMath.waterVolumes(grain,recipe.volumeL,rig,recipe.mash?.spargeType??'batch',recipe.boilMin,kettleHopGrams(recipe.hops??[]));
  if(water.planningStatus==='invalid') return [...issues,...water.issues];
  const check=equipmentCheck(e,{volumeL:recipe.volumeL,grainKg:grain,mashL,spargeL,preBoilHotL:water.preBoilHotL,preferences:rig.preferences,fermenterHeadspacePct:recommendation?.headspacePct});
  if(check?.mashTooFull) issues.push('L’eau et les grains dépassent la limite utile de la cuve.');
  if(check && !check.thinEnough) issues.push('Le rapport eau/grain est sous 2,5 L/kg : revois la répartition pour la circulation du panier.');
  if(check?.boilTooFull) issues.push('Le volume avant ébullition dépasse la limite utile de la cuve.');
  if(check?.spargeTooMuch) issues.push(`Le rinçage dépasse les ${check.spargeMaximumHotL} L exceptionnels disponibles à chaud.`);
  else if(check?.spargeStatus==='exception' && !recipe.installation?.spargeExceptionAccepted) issues.push('Confirme le complément de rinçage avec la bouilloire annexe dans les choix de cette recette.');
  if(Math.abs(mashL+spargeL-water.mashWaterL-water.spargeWaterL)>0.3) issues.push('Le total d’eau saisi ne correspond pas au volume final et aux pertes du plan. Revois les volumes avant de lancer.');
  return issues;
}
