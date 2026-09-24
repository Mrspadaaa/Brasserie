import { BrewingEquipment, BrewhouseProfile } from '../types';
import type { BrewingPreferences } from '../types/brewSystem';

/** Approximate expansion at mash/rinse temperature, distinct from boiling shrinkage. */
export const MASH_WATER_EXPANSION = 1.03;
export const practicalBrewingPreferences: BrewingPreferences = {
  preferredMashRatioLPerKg: 4.2,
  preferredSpargeHotL: 18,
  maximumSpargeHotL: 24,
  increaseMashToLimitSparge: true,
  coolingMethod: 'immersion',
  regulatedCoolingAvailable: true
};

export const practicalEquipment: BrewingEquipment = {
  kettleCapacityL: 45,
  kettleWorkingL: 35,
  workingVolumeConfirmed: false,
  spargeCapacityL: 18,
  fermenterCapacityL: 30,
  fermenterHeadspacePct: 20,
  roPackL: 5,
  boilOffLPerHour: 3,
  grainAbsorptionLPerKg: 0.96,
  grainDisplacementLPerKg: 0.67,
  coolingShrinkagePct: 4,
  heatingRateCPerMin: 13 / 30
};
export const r1 = (v: number) => Math.round((v + Number.EPSILON) * 10) / 10;
const positive = (v: number) => Number.isFinite(v) && v > 0;

export function equipmentErrors(e: BrewingEquipment): string[] {
  const errors: string[] = [];
  for (const key of [
    'kettleCapacityL',
    'kettleWorkingL',
    'spargeCapacityL',
    'fermenterCapacityL',
    'roPackL',
    'grainDisplacementLPerKg',
    'heatingRateCPerMin'
  ] as const)
    if (!positive(e[key]))
      errors.push('Renseigne des capacités et coefficients strictement positifs.');
  if (!(e.kettleWorkingL < e.kettleCapacityL))
    errors.push('La limite utile doit rester sous le volume total de la cuve.');
  if (
    !Number.isFinite(e.fermenterHeadspacePct) ||
    e.fermenterHeadspacePct < 0 ||
    e.fermenterHeadspacePct >= 100
  )
    errors.push('La réserve pour la mousse doit être comprise entre 0 et moins de 100 %.');
  if (
    !Number.isFinite(e.coolingShrinkagePct) ||
    e.coolingShrinkagePct < 0 ||
    e.coolingShrinkagePct > 10
  )
    errors.push('La rétraction doit être comprise entre 0 et 10 %.');
  for (const key of ['boilOffLPerHour', 'grainAbsorptionLPerKg'] as const)
    if (!Number.isFinite(e[key]) || e[key] < 0)
      errors.push('Évaporation et absorption ne peuvent pas être négatives.');
  return [...new Set(errors)];
}

export function fermenterLimit(e?: BrewingEquipment): number | undefined {
  if (!e || equipmentErrors(e).length) return undefined;
  // Round DOWN: rounding to nearest could exceed the selected headspace.
  return Math.floor((e.fermenterCapacityL * (1 - e.fermenterHeadspacePct / 100) + 1e-8) * 10) / 10;
}
export function defaultBrewVolume(profile?: BrewhouseProfile) {
  // A headspace recommendation must never silently resize a chosen recipe.
  return profile?.volumeL ?? 30;
}

export function brewingPreferenceErrors(p?: BrewingPreferences): string[] {
  if (!p) return [];
  const errors: string[] = [];
  if (!positive(p.preferredMashRatioLPerKg)) errors.push('Le ratio d’empâtage préféré doit être positif.');
  if (![p.preferredSpargeHotL, p.maximumSpargeHotL].every(v => Number.isFinite(v) && v >= 0) ||
      p.maximumSpargeHotL < p.preferredSpargeHotL)
    errors.push('Le maximum de rinçage à chaud doit couvrir le budget habituel.');
  if (typeof p.increaseMashToLimitSparge !== 'boolean') errors.push('Précise la préférence de répartition de l’eau.');
  return errors;
}

/** All inputs/outputs named Hot are available at rinsing temperature, not cold fills.
 * The auxiliary amount is a need, never an invented auxiliary vessel capacity. */
export function spargePlan(coldL: number, e: BrewingEquipment, preferences?: BrewingPreferences) {
  if (!Number.isFinite(coldL) || coldL < 0 || !positive(e.spargeCapacityL) || brewingPreferenceErrors(preferences).length) return null;
  const hotL = coldL * MASH_WATER_EXPANSION;
  const preferredHotL = preferences?.preferredSpargeHotL ?? e.spargeCapacityL;
  const mainHotL = Math.min(hotL, e.spargeCapacityL, preferredHotL);
  const auxiliaryHotL = Math.max(0, hotL - mainHotL);
  const maximumHotL = preferences?.maximumSpargeHotL;
  return {
    coldL, hotL, mainHotL, auxiliaryHotL,
    mainColdL: mainHotL / MASH_WATER_EXPANSION,
    auxiliaryColdL: auxiliaryHotL / MASH_WATER_EXPANSION,
    preferredHotL, maximumHotL,
    status: maximumHotL != null && hotL > maximumHotL + 1e-8 ? 'impossible' as const
      : hotL > preferredHotL + 1e-8 || auxiliaryHotL > 1e-8 ? 'exception' as const : 'ready' as const
  };
}

/** Packages are a shopping quantity, never an instruction to pour the remainder. */
export function roPackages(requiredL: number, packL: number) {
  if (!Number.isFinite(requiredL) || requiredL < 0 || !positive(packL)) return null;
  const count = Math.max(0, Math.ceil((requiredL - 1e-8) / packL));
  const precise = (v: number) => Number(v.toFixed(2));
  return {
    count,
    packL,
    requiredL: precise(requiredL),
    purchasedL: precise(count * packL),
    remainingL: precise(count * packL - requiredL)
  };
}

/** Estimated occupied mash volume at mashout; grain displacement is NOT absorption. */
export function occupiedMashL(waterL: number, grainKg: number, e: BrewingEquipment) {
  return waterL * MASH_WATER_EXPANSION + grainKg * e.grainDisplacementLPerKg;
}

export function equipmentCheck(
  e: BrewingEquipment | undefined,
  input: {
    volumeL: number;
    grainKg: number;
    mashL: number;
    spargeL: number;
    preBoilHotL?: number;
    preferences?: BrewingPreferences;
    fermenterHeadspacePct?: number;
  }
) {
  if (!e || equipmentErrors(e).length || brewingPreferenceErrors(input.preferences).length ||
      ![input.volumeL, input.grainKg, input.mashL, input.spargeL].every(v => Number.isFinite(v) && v >= 0) ||
      input.preBoilHotL != null && (!Number.isFinite(input.preBoilHotL) || input.preBoilHotL < 0)) return null;
  const occupiedL = occupiedMashL(input.mashL, input.grainKg, e);
  const headspacePct = input.fermenterHeadspacePct ?? e.fermenterHeadspacePct;
  if (!Number.isFinite(headspacePct) || headspacePct < 0 || headspacePct >= 100) return null;
  const maxFermenterL = Math.floor((e.fermenterCapacityL * (1 - headspacePct / 100) + 1e-8) * 10) / 10;
  const sparge = spargePlan(input.spargeL, e, input.preferences)!;
  // Legacy fields describe the main/auxiliary preparation, never repeated fills.
  const loads = [sparge.mainColdL, sparge.auxiliaryColdL].filter(v => v > 0).map(r1);
  return {
    occupiedL: r1(occupiedL),
    maxFermenterL,
    headspaceL: r1(e.fermenterCapacityL - input.volumeL),
    mashTooFull: occupiedL > e.kettleWorkingL + 0.05,
    boilTooFull: input.preBoilHotL != null && input.preBoilHotL > e.kettleWorkingL + 0.05,
    fermenterCapacityL: e.fermenterCapacityL,
    fermenterTooFull: input.volumeL >= e.fermenterCapacityL - 1e-8,
    fermenterAboveRecommendation: input.volumeL > maxFermenterL + 0.01,
    fermenterHeadspacePct: headspacePct,
    thinEnough: input.grainKg <= 0 || input.mashL / input.grainKg >= 2.5,
    spargeLoads: loads.length,
    spargeFillL: Math.floor((e.spargeCapacityL / MASH_WATER_EXPANSION) * 10) / 10,
    loads,
    spargeHotL: sparge.hotL,
    spargeMainHotL: sparge.mainHotL,
    spargeAuxiliaryHotL: sparge.auxiliaryHotL,
    spargePreferredHotL: sparge.preferredHotL,
    spargeMaximumHotL: sparge.maximumHotL,
    spargeStatus: sparge.status,
    spargeTooMuch: sparge.status === 'impossible'
  };
}
