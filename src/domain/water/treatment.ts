import { AcidId, SaltId, WaterIons, WaterSource, WaterPlan } from '../../types';
import { addIons, dilute, residualAlkalinity, sulfateChlorideRatio, ZERO } from './ions';
import { ACIDS, SALT_IDS, ionsFromSalts } from './substances';
import { acidNeeded, ionsAfterAcid, spargeAcidNeeded, SPARGE_TARGET_PH } from './acid';
import { RaBand, raAcidTarget } from './mashPh';
import { splitDoses, waterFromPlan } from './plan';

interface TreatmentInput {
  diRatioPct: number;
  spargeDiRatioPct?: number;
  doses: Partial<Record<SaltId, number>>;
  saltSplit?: { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> };
  mashWaterL: number;
  spargeWaterL: number;
  allSaltsInMash?: boolean;
  acidId: AcidId;
  acidOverride?: { mash?: number; sparge?: number };
}

export function averageWater(
  mash: WaterIons,
  sparge: WaterIons,
  mashL: number,
  spargeL: number
): WaterIons {
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
  const exact = input.saltSplit;
  const matches = exact && [...new Set([...Object.keys(input.doses), ...Object.keys(exact.mash), ...Object.keys(exact.sparge)])]
    .every((id: SaltId) => Math.abs((input.doses[id] ?? 0) - (exact.mash[id] ?? 0) - (exact.sparge[id] ?? 0)) < 1e-9);
  const split = matches ? exact : splitDoses(input.doses, mashWaterL, spargeWaterL, input.allSaltsInMash !== false);
  const raw = matches ? {
    mash: addIons(start, ionsFromSalts(split.mash, mashWaterL)),
    sparge: addIons(startSparge, ionsFromSalts(split.sparge, spargeWaterL))
  } : waterFromPlan(
    start,
    input.doses,
    mashWaterL,
    spargeWaterL,
    startSparge,
    input.allSaltsInMash !== false
  );
  const average = (mash: WaterIons, sparge: WaterIons): WaterIons => {
    return averageWater(mash, sparge, mashWaterL, spargeWaterL);
  };
  const mashAcidCalculated = acidNeeded(raw.mash, mashWaterL, raAcidTarget(band), acidId);
  const spargeAcidCalculated = spargeAcidNeeded(
    raw.sparge,
    spargeWaterL,
    acidId,
    SPARGE_TARGET_PH,
    source.ph ?? 7.4
  );
  const retained = <T extends { amount: number }>(
    calculated: T,
    amount: number | undefined,
    litres: number
  ): T => ({
    ...calculated,
    amount:
      litres <= 0
        ? 0
        : amount != null && Number.isFinite(amount)
          ? Math.max(0, amount)
          : calculated.amount
  });
  const mashAcid = retained(mashAcidCalculated, input.acidOverride?.mash, mashWaterL);
  const spargeAcid = retained(spargeAcidCalculated, input.acidOverride?.sparge, spargeWaterL);
  const treated = {
    mash: ionsAfterAcid(raw.mash, mashAcid.amount, acidId, mashWaterL),
    sparge: ionsAfterAcid(raw.sparge, spargeAcid.amount, acidId, spargeWaterL)
  };
  const total = average(raw.mash, raw.sparge);
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
    treatedTotal: average(treated.mash, treated.sparge),
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
      plan.acid ? ionsAfterAcid(sparge, plan.acid.sparge, plan.acid.id, plan.spargeWaterL) : sparge,
      plan.mashWaterL,
      plan.spargeWaterL
    )
  };
}
