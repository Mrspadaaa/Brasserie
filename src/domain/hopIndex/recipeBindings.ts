import type { HopIngredient } from '../../types';

/** Editing a recipe must not keep an aroma context contradicted by its new values. */
export function patchIndexedHop(hop: HopIngredient, patch: Partial<HopIngredient>): HopIngredient {
  const next = { ...hop, ...patch };
  if (next.name.trim().toLocaleLowerCase('fr') !== hop.name.trim().toLocaleLowerCase('fr')) {
    next.hopVarietyId = undefined;
    next.hopLotId = undefined;
  }
  if (next.stage !== hop.stage) {
    next.aromaTiming = undefined;
    next.aromaContactHours = undefined;
    next.aromaTemperatureC = undefined;
  } else {
    if (next.timeMin !== hop.timeMin) next.aromaContactHours = undefined;
    if (next.tempC !== hop.tempC) next.aromaTemperatureC = undefined;
  }
  return next;
}
