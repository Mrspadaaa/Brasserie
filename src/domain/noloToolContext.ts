import type { TrialRecipe } from './hopIndex/trials';
import { noloInput } from './nolo';
import { noloInputBasis } from '../../functions/src/noloCore';
import { noloScenarioBasis } from '../../functions/src/noloScenario';

/** Planning inputs describe a particular mixture. Any change to its recipe,
 * process, additions or observations requires the brewer to enter them again. */
export function noloToolContext(recipe: TrialRecipe): string {
  const c = recipe.nolo;
  return JSON.stringify([recipe.volumeL, recipe.fermentables, recipe.hops, recipe.yeast,
    recipe.mash, recipe.fermentation, recipe.efficiencyPct, recipe.brewhouse?.efficiencyPct,
    c?.process, c?.wort, c?.planning, c?.operations, c?.measurements, c?.secondRunnings]);
}

/** An explicitly NEW late ingredient is appended after the current mixture.
 * Its matching operation is also appended. Earlier compatible observations
 * still describe the same sampled beer, despite the ingredient-list extension.
 * Never use this when editing an existing ingredient or moving an operation. */
export function keepObservationsBeforeNewAddition(before: TrialRecipe, after: TrialRecipe): TrialRecipe {
  if (!before.nolo || !after.nolo) return after;
  const oldInput = noloInput(before), nextInput = noloInput(after);
  return { ...after, nolo: { ...after.nolo, measurements: after.nolo.measurements.map(m => {
    const wasCurrent = m.basis === noloScenarioBasis(oldInput, m.afterOperationId)
      || (!before.nolo!.planning?.stopSg && !before.nolo!.planning?.stopAttenuationPct && m.basis === noloInputBasis(oldInput, m.afterOperationId));
    return wasCurrent ? { ...m, basis: noloScenarioBasis(nextInput, m.afterOperationId) } : m;
  }) } };
}
