import { BrewingEquipment, BrewhouseProfile } from '../types';

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
    e.fermenterHeadspacePct < 10 ||
    e.fermenterHeadspacePct > 50
  )
    errors.push('Réserve entre 10 et 50 % du fermenteur à la mousse.');
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
  return Math.min(profile?.volumeL ?? 30, fermenterLimit(profile?.equipment) ?? Infinity);
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
  return waterL * 1.03 + grainKg * e.grainDisplacementLPerKg;
}

export function equipmentCheck(
  e: BrewingEquipment | undefined,
  input: {
    volumeL: number;
    grainKg: number;
    mashL: number;
    spargeL: number;
    preBoilHotL?: number;
  }
) {
  if (!e || equipmentErrors(e).length) return null;
  const occupiedL = occupiedMashL(input.mashL, input.grainKg, e);
  const maxFermenterL = fermenterLimit(e)!;
  const spargeFillL = Math.floor((e.spargeCapacityL / 1.03) * 10) / 10;
  const spargeLoads =
    spargeFillL > 0 ? Math.max(0, Math.ceil((input.spargeL - 1e-8) / spargeFillL)) : 0;
  const loads: number[] = [];
  let left = input.spargeL;
  for (let i = 0; i < Math.min(spargeLoads, 100); i++) {
    const dose = Math.min(spargeFillL, left);
    loads.push(r1(dose));
    left -= dose;
  }
  return {
    occupiedL: r1(occupiedL),
    maxFermenterL,
    headspaceL: r1(e.fermenterCapacityL - input.volumeL),
    mashTooFull: occupiedL > e.kettleWorkingL + 0.05,
    boilTooFull: input.preBoilHotL != null && input.preBoilHotL > e.kettleWorkingL + 0.05,
    fermenterTooFull: input.volumeL > maxFermenterL + 0.01,
    thinEnough: input.grainKg <= 0 || input.mashL / input.grainKg >= 2.5,
    spargeLoads,
    spargeFillL,
    loads
  };
}
