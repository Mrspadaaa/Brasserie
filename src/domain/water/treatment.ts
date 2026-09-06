import { AcidId, SaltId, WaterIons, WaterSource, WaterPlan } from '../../types';
import { addIons, dilute, residualAlkalinity, sulfateChlorideRatio } from './ions';
import { ACIDS, ionsFromSalts } from './substances';
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

function averageWater(
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

/** Upgrade the old pre-acid display from its own frozen data, never today's network analysis. */
export function savedWaterDisplay(plan: WaterPlan | undefined) {
  if (!plan?.startIons || !plan.wortIons) return null;
  if (plan.treatmentVersion === 2) return { start: plan.startIons, achieved: plan.wortIons };
  const start = plan.startIons;
  const spargeDi = plan.spargeDiRatioPct ?? plan.diRatioPct;
  if (plan.diRatioPct >= 100 && spargeDi < 100 && plan.spargeWaterL > 0) return null;
  const factor = plan.diRatioPct >= 100 ? 1 : (100 - spargeDi) / (100 - plan.diRatioPct);
  const spargeStart = Object.fromEntries(
    Object.entries(start).map(([k, v]) => [k, v * factor])
  ) as unknown as WaterIons;
  const mash = addIons(start, ionsFromSalts(plan.mash, plan.mashWaterL));
  const sparge = addIons(spargeStart, ionsFromSalts(plan.sparge, plan.spargeWaterL));
  const acid = plan.acid;
  return {
    start: averageWater(start, spargeStart, plan.mashWaterL, plan.spargeWaterL),
    achieved: averageWater(
      acid ? ionsAfterAcid(mash, acid.mash, acid.id, plan.mashWaterL) : mash,
      acid ? ionsAfterAcid(sparge, acid.sparge, acid.id, plan.spargeWaterL) : sparge,
      plan.mashWaterL,
      plan.spargeWaterL
    )
  };
}
