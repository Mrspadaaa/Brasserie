import type { BrewDayState, RecipeSnapshot } from '../types';
import type { BrewThermalChoices } from '../types/brewSystem';
import { YEAST_PRACTICAL_GUIDES } from '../data/yeastPracticalGuides';
import { readFermentationGuide } from './fermentationGuide';
import { documentedDirectPitchProtocol } from '../../functions/src/yeastPitchingProtocol';

const known = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
export type PitchingChoiceId = NonNullable<BrewThermalChoices['pitchingMode']>;

/** Product/form-specific preparation guidance. A fermentation maximum is never a warm-pitch licence. */
export function pitchingPlan(recipe: RecipeSnapshot, state?: BrewDayState) {
  const yeast = recipe.yeast;
  const primaryC = recipe.fermentation?.find(p => p.kind === 'primaire')?.tempC ?? recipe.fermentation?.[0]?.tempC;
  const plannedTargetC = yeast?.pitchTempC ?? primaryC;
  const targetC = state?.thermalChoices?.pitchTargetC ?? plannedTargetC;
  const guide = yeast?.hopIndexId ? YEAST_PRACTICAL_GUIDES[yeast.hopIndexId] : undefined;
  const exactGuide = guide?.form === yeast?.form ? guide : undefined;
  const direct = documentedDirectPitchProtocol(yeast?.hopIndexId, yeast?.form);
  const note = exactGuide?.notes.find(n => n.id === 'direct-pitch');
  const warmProtocol = direct && !recipe.nolo?.enabled ? {
    ...direct.temperatureC,
    source: direct.source.reference,
    conditions: `${direct.conditions} La notice d’ajout ne fixe pas ici un délai pour rejoindre la consigne principale : aucun temps de descente n’est garanti.`,
  } : undefined;
  const frozen = readFermentationGuide(recipe);
  const sourceWindow = frozen?.yeast.id === yeast?.hopIndexId &&
    yeast?.fermTempMinC === frozen?.applied.yeast.fermTempMinC &&
    yeast?.fermTempMaxC === frozen?.applied.yeast.fermTempMaxC
    ? frozen?.guide.temperatureC.range : undefined;
  const fermentationRange = {
    min: sourceWindow?.min ?? yeast?.fermTempMinC,
    max: sourceWindow?.max ?? yeast?.fermTempMaxC,
  };
  const plannedDirect = frozen?.pitchingProtocol?.method === 'direct' && frozen.pitchingProtocol.yeastId === yeast?.hopIndexId &&
    frozen.pitchingProtocol.form === yeast?.form && frozen.applied.yeast.pitchTempC === plannedTargetC;
  const warmSelected = state?.thermalChoices?.pitchingMode === 'documented-warm' || plannedDirect && targetC === plannedTargetC;
  const warmValid = !!warmProtocol && known(targetC) && targetC >= warmProtocol.min && targetC <= warmProtocol.max;
  const warmAvailable = !!warmProtocol && known(plannedTargetC) && warmProtocol.max > plannedTargetC;
  const choices: Array<{ id: PitchingChoiceId; label: string; available: boolean; reason: string; targetC?: number }> = [
    { id: 'at-target', label: 'Finir au serpentin', available: known(plannedTargetC), targetC: plannedTargetC,
      reason: 'Rejoindre la cible choisie, puis vérifier le moût homogénéisé avant la levure.' },
    { id: 'chamber-before-pitch', label: 'Finir au froid avant levure', available: known(plannedTargetC) && recipe.brewhouse?.preferences?.regulatedCoolingAvailable !== false, targetC: plannedTargetC,
      reason: recipe.brewhouse?.preferences?.regulatedCoolingAvailable === false ? 'Aucune enceinte régulée disponible dans ce profil matériel.' : 'Après transfert dans le fermenteur, suivre la température du moût dans l’enceinte régulée. Durée inconnue avant les premiers relevés de cette méthode.' },
    { id: 'documented-warm', label: 'Ensemencer plus chaud', available: warmAvailable,
      reason: warmAvailable ? warmProtocol!.conditions : note
        ? `${note.detail} Aucun plafond chiffré d’ajout direct n’est documenté ici : pas de température plus chaude proposée automatiquement.`
        : 'Pas de protocole chiffré d’ajout direct pour ce produit et cette forme. La plage de fermentation et la réhydratation ne le remplacent pas.' },
  ];
  return { targetC, plannedTargetC, primaryC, fermentationRange, warmProtocol, warmAvailable, warmValid, documentedWarmSelected: !!warmSelected,
    choices, preparationNotes: exactGuide?.notes.filter(n => n.phase === 'preparation') ?? [],
    warning: warmSelected && !warmValid ? 'Le choix plus chaud n’est plus couvert par la notice conservée. Reviens à la cible prévue ou vérifie le produit et sa forme.' : undefined };
}

export function effectivePitchTarget(recipe: RecipeSnapshot, state?: BrewDayState) {
  return pitchingPlan(recipe, state).targetC;
}

export function pitchTemperatureFeedback(recipe: RecipeSnapshot, temperature: number, state?: BrewDayState) {
  const plan = pitchingPlan(recipe, state);
  if (plan.warning) return plan.warning;
  if (!known(plan.targetC)) return 'Consigne de levure absente : consulte sa fiche avant d’ensemencer.';
  if (plan.documentedWarmSelected && plan.warmValid &&
    plan.warmProtocol && temperature >= plan.warmProtocol.min && temperature <= plan.warmProtocol.max &&
    Math.abs(temperature - plan.targetC) <= 1)
    return `Température dans la plage d’ajout direct documentée. Confirme l’homogénéité, applique la méthode de la notice et suis ensuite la consigne principale (${plan.primaryC ?? 'à préciser'} °C).`;
  if (plan.fermentationRange.max != null && temperature > plan.fermentationRange.max)
    return 'Au-dessus de la plage de fermentation renseignée : continue le refroidissement ou sélectionne un protocole d’ajout direct documenté. La température de réhydratation ne convient pas au moût entier.';
  if (temperature > plan.targetC + 1)
    return 'Au-dessus de la cible choisie. Continue le refroidissement ou compare les conduites disponibles avant d’ajouter la levure.';
  if (plan.fermentationRange.min != null && temperature < plan.fermentationRange.min)
    return 'En dessous de la plage renseignée : le démarrage peut être ralenti. Ramène progressivement le moût à la consigne.';
  if (temperature < plan.targetC - 2)
    return 'Sous la cible choisie : vérifie la plage de la levure avant d’ensemencer.';
  return 'Température proche de la cible choisie. Vérifie l’homogénéité et les conditions de la notice avant la levure.';
}
