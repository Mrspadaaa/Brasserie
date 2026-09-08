import { AcidId, SaltId, WaterIons, WaterSource, WaterPlan, IonBand } from '../../types';
import { addIons, dilute, residualAlkalinity, sulfateChlorideRatio, ZERO } from './ions';
import { ACIDS, SALT_IDS, ionsFromSalts } from './substances';
import { acidNeeded, ionsAfterAcid, calculateSpargeTreatment, retainAcidDose } from './acid';
import { RaBand, raAcidTarget } from './mashPh';
import { positiveSaltDoses, splitDoses } from './plan';

export interface TreatmentInput {
  diRatioPct: number;
  spargeDiRatioPct?: number;
  doses: Partial<Record<SaltId, number>>;
  saltSplit?: { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> };
  mashWaterL: number;
  spargeWaterL: number;
  allSaltsInMash?: boolean;
  acidId: AcidId;
  acidOverride?: { mash?: number; sparge?: number };
  /** Explicit custom bicarbonate target on the combined water after acid, in mg/L. */
  hco3Target?: number;
  /** Required range on the combined water after both retained acid additions. */
  hco3Range?: IonBand;
  /** Soft style preference after both acids; missing it is not a profile failure. */
  hco3Preferred?: number;
}

export interface BicarbonateTargetResult {
  requested: number;
  achieved: number;
  delta: number;
  reached: boolean;
  reason?: 'manual-acid' | 'mash-alkalinity' | 'mineral-balance';
  message?: string;
}

export function averageWater(
  mash: WaterIons,
  sparge: WaterIons,
  mashL: number,
  spargeL: number
): WaterIons {
  mashL = Number.isFinite(mashL) ? Math.max(0, mashL) : 0;
  spargeL = Number.isFinite(spargeL) ? Math.max(0, spargeL) : 0;
  const total = mashL + spargeL;
  if (total <= 0) return { ...mash };
  return Object.fromEntries(
    Object.keys(mash).map((key: keyof WaterIons) => [
      key,
      Math.round(((mash[key] * mashL + sparge[key] * spargeL) / total) * 10) / 10
    ])
  ) as unknown as WaterIons;
}

/** Water before extraction/boiling. Shared by the workshop, recap and saved recipe. */
export function calculateWaterTreatment(source: WaterSource, input: TreatmentInput, band: RaBand) {
  const { mashWaterL, spargeWaterL, acidId } = input;
  const start = dilute(source, input.diRatioPct);
  const startSparge = dilute(source, input.spargeDiRatioPct ?? input.diRatioPct);
  const exact = input.saltSplit && {
    mash: positiveSaltDoses(input.saltSplit.mash),
    sparge: positiveSaltDoses(input.saltSplit.sparge)
  };
  const matches = exact
    && (mashWaterL > 0 || Object.keys(exact.mash).length === 0)
    && (spargeWaterL > 0 || Object.keys(exact.sparge).length === 0)
    && [...new Set([...Object.keys(input.doses), ...Object.keys(exact.mash), ...Object.keys(exact.sparge)])]
    .every((id: SaltId) => Math.abs((input.doses[id] ?? 0) - (exact.mash[id] ?? 0) - (exact.sparge[id] ?? 0)) < 1e-9);
  const split = matches ? exact : splitDoses(input.doses, mashWaterL, spargeWaterL, input.allSaltsInMash !== false);
  const raw = {
    mash: addIons(start, ionsFromSalts(split.mash, mashWaterL)),
    sparge: addIons(startSparge, ionsFromSalts(split.sparge, spargeWaterL))
  };
  const average = (mash: WaterIons, sparge: WaterIons): WaterIons => {
    return averageWater(mash, sparge, mashWaterL, spargeWaterL);
  };
  const spargeTreatment = calculateSpargeTreatment(raw.sparge, spargeWaterL, acidId, {
    sourcePh: source.ph, override: input.acidOverride?.sparge
  });
  const spargeAcidCalculated = spargeTreatment.calculated;
  const spargeAcid = spargeTreatment.retained;
  const explicitHco3 = Number.isFinite(input.hco3Target) && input.hco3Target >= 0
    ? input.hco3Target : undefined;
  let mashAcidTargetRa = raAcidTarget(band);
  let hco3LimitedByRa = false;
  if (explicitHco3 != null && Number.isFinite(mashWaterL) && mashWaterL > 0) {
    const desiredMashHco3 = (explicitHco3 * (mashWaterL + spargeWaterL)
      - spargeTreatment.ions.hco3 * spargeWaterL) / mashWaterL;
    const desiredRa = residualAlkalinity({ ...raw.mash, hco3: desiredMashHco3 });
    // An explicit profile selects a point within the mash's alkalinity band.
    // It cannot prescribe excess acid or counteract it with more alkaline salts.
    mashAcidTargetRa = Math.max(band.min, Math.min(band.max, desiredRa));
    hco3LimitedByRa = Math.abs(mashAcidTargetRa - desiredRa) > 1e-9;
  }
  let mashAcidCalculated = acidNeeded(raw.mash, mashWaterL, mashAcidTargetRa, acidId);
  const profileRange = input.hco3Range;
  if (profileRange && Number.isFinite(profileRange.min) && Number.isFinite(profileRange.max)
    && profileRange.min >= 0 && profileRange.max >= profileRange.min && mashWaterL > 0) {
    const totalL = mashWaterL + spargeWaterL;
    const spargeMass = spargeTreatment.ions.hco3 * spargeWaterL;
    const minimumMash = Math.max(0, (profileRange.min * totalL - spargeMass) / mashWaterL);
    const maximumMash = Math.max(0, (profileRange.max * totalL - spargeMass) / mashWaterL);
    const strength = ACIDS[acidId].hco3NeutralizedPerUnit;
    const minDose = Math.max(0, (raw.mash.hco3 - maximumMash) * mashWaterL / strength);
    const maxDose = Math.max(0, (raw.mash.hco3 - minimumMash) * mashWaterL / strength);
    const low = Math.ceil((minDose - 1e-9) * 10) / 10;
    const high = Math.floor((maxDose + 1e-9) * 10) / 10;
    const preferred = Number.isFinite(input.hco3Preferred)
      ? Math.max(profileRange.min, Math.min(profileRange.max, input.hco3Preferred)) : undefined;
    const referenceDose = preferred != null
      ? Math.max(0, (raw.mash.hco3 * mashWaterL + spargeMass - preferred * totalL) / strength)
      : mashAcidCalculated.amount;
    const boundedDose = Math.max(low, Math.min(high, referenceDose));
    // Whole 0.1 mL/g doses must stay inside the profile too. If the interval
    // is narrower than one step, choose the dose with the smallest real gap.
    const candidates = [...new Set([low, high,
      Math.floor((boundedDose + 1e-9) * 10) / 10,
      Math.ceil((boundedDose - 1e-9) * 10) / 10])].filter(value => value >= 0);
    const gap = (dose: number) => {
      const value = (Math.max(0, raw.mash.hco3 - dose * strength / mashWaterL) * mashWaterL + spargeMass) / totalL;
      return Math.max(0, profileRange.min - value, value - profileRange.max);
    };
    candidates.sort((a, b) => gap(a) - gap(b) || Math.abs(a - referenceDose) - Math.abs(b - referenceDose));
    mashAcidCalculated = { ...mashAcidCalculated, amount: candidates[0] ?? 0 };
    hco3LimitedByRa = false;
  }
  const mashAcid = retainAcidDose(mashAcidCalculated, input.acidOverride?.mash, mashWaterL);
  const treated = {
    mash: ionsAfterAcid(raw.mash, mashAcid.amount, acidId, mashWaterL),
    sparge: spargeTreatment.ions
  };
  const total = average(raw.mash, raw.sparge);
  const treatedTotal = average(treated.mash, treated.sparge);
  let hco3Target: BicarbonateTargetResult | undefined;
  if (explicitHco3 != null) {
    const delta = Math.round((treatedTotal.hco3 - explicitHco3) * 10) / 10;
    const reached = Math.abs(delta) <= 2;
    const manualAcid = (Number.isFinite(input.acidOverride?.mash)
      && Math.abs(mashAcid.amount - mashAcidCalculated.amount) >= 0.05)
      || (Number.isFinite(input.acidOverride?.sparge)
        && Math.abs(spargeAcid.amount - spargeAcidCalculated.amount) >= 0.05);
    const reason = manualAcid ? 'manual-acid' : hco3LimitedByRa ? 'mash-alkalinity' : 'mineral-balance';
    const detail = reason === 'manual-acid' ? 'Les doses d’acide manuelles sont conservées.'
      : reason === 'mash-alkalinity' ? 'La plage d’alcalinité de l’empâtage limite la correction.'
      : 'Les sels autorisés et les autres minéraux limitent la correction.';
    hco3Target = { requested: explicitHco3, achieved: treatedTotal.hco3, delta, reached,
      ...(!reached ? { reason, message: `HCO₃ après acide : ${treatedTotal.hco3} mg/L pour une cible de ${explicitHco3}. ${detail}` } : {}) };
  }
  const raBefore = residualAlkalinity(raw.mash);
  // The graph cannot show negative bicarbonate. For the mash buffer model,
  // however, acid beyond the water's alkalinity still consumes grain buffers.
  // Keep the full acid equivalents here; never use this estimate to prescribe acid.
  const acidAlkalinity = Number.isFinite(mashWaterL) && mashWaterL > 0
    ? (mashAcid.amount / mashWaterL) * ACIDS[acidId].hco3NeutralizedPerUnit * 50 / 61
    : 0;
  return {
    start,
    startSparge,
    startTotal: average(start, startSparge),
    raw,
    treated,
    total,
    treatedTotal,
    hco3Target,
    hco3Range: profileRange,
    hco3Preferred: input.hco3Preferred,
    mashAcidCalculated,
    spargeAcidCalculated,
    mashAcid,
    spargeAcid,
    raBefore,
    raAfter: residualAlkalinity(treated.mash),
    mashPhRa: raBefore - acidAlkalinity,
    ratio: sulfateChlorideRatio(total),
    split
  };
}

/** Recover only the frozen source: legacy startIons are mash-only; v2 startIons are weighted. */
export function waterSourceFromPlan(plan: WaterPlan): WaterIons | null {
  const keys = ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as const;
  const map = (value: (key: keyof WaterIons) => number) =>
    Object.fromEntries(keys.map(k => [k, value(k)])) as unknown as WaterIons;
  if (plan.sourceSnapshot) return map(k => plan.sourceSnapshot![k]);
  if (!plan.startIons) return null;
  const mashTap = 1 - plan.diRatioPct / 100;
  const spargeTap = 1 - (plan.spargeDiRatioPct ?? plan.diRatioPct) / 100;
  const totalL = plan.mashWaterL + plan.spargeWaterL;
  const fraction = plan.treatmentVersion === 2 && totalL > 0
    ? (plan.mashWaterL * mashTap + plan.spargeWaterL * spargeTap) / totalL
    : mashTap;
  if (fraction > 0) return map(k => plan.startIons![k] / fraction);
  // Only pre-acid legacy totals can recover a source absent from a pure-RO mash.
  if (plan.treatmentVersion !== 2 && plan.wortIons && totalL > 0 && spargeTap > 0 && plan.spargeWaterL > 0) {
    const doses = Object.fromEntries(SALT_IDS.map(id => [id, (plan.mash?.[id] ?? 0) + (plan.sparge?.[id] ?? 0)]));
    const salts = ionsFromSalts(doses, totalL);
    const spargeFraction = spargeTap * plan.spargeWaterL / totalL;
    return map(k => Math.max(0, plan.wortIons![k] - salts[k]) / spargeFraction);
  }
  return null;
}

/** Recompute from the recipe's frozen analysis and retained doses, never today's source or a new prescription. */
export function savedWaterDisplay(plan: WaterPlan | undefined) {
  if (!plan) return null;
  const spargeDi = plan.spargeDiRatioPct ?? plan.diRatioPct;
  const pureRo = plan.diRatioPct === 100 && (spargeDi === 100 || plan.spargeWaterL <= 0);
  const source = waterSourceFromPlan(plan) ?? (pureRo ? ZERO : null);
  if (!source) return null;
  const startMash = dilute(source, plan.diRatioPct);
  const startSparge = dilute(source, spargeDi);
  const mash = addIons(startMash, ionsFromSalts(plan.mash, plan.mashWaterL));
  const sparge = addIons(startSparge, ionsFromSalts(plan.sparge, plan.spargeWaterL));
  return {
    start: averageWater(startMash, startSparge, plan.mashWaterL, plan.spargeWaterL),
    achieved: averageWater(
      plan.acid ? ionsAfterAcid(mash, plan.acid.mash, plan.acid.id, plan.mashWaterL) : mash,
      plan.acid ? calculateSpargeTreatment(sparge, plan.spargeWaterL, plan.acid.id,
        { override: plan.acid.sparge }).ions : sparge,
      plan.mashWaterL,
      plan.spargeWaterL
    )
  };
}
