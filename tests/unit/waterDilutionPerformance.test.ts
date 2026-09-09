import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WaterIons } from '../../src/types';
import { minimalDilution, HCO3_ACID_TOLERANCE_PPM, type MinimalDilution, type MinimalDilutionInput } from '../../src/domain/water/dilution';
import * as solver from '../../src/domain/water/solve';
import * as treatment from '../../src/domain/water/treatment';
import { calculateSpargeTreatment, lactateInBeer } from '../../src/domain/water/acid';
import { ACIDS, DEFAULT_WATER_SOURCE, LACTATE_TASTE_THRESHOLD } from '../../src/domain/water/substances';
import { dilute } from '../../src/domain/water/ions';
import { ION_LABEL } from '../../src/domain/water/labels';
import { assessWaterProfile } from '../../src/domain/water/profileAssessment';
import { raForGrist, raSaltCeilingForGrist, targetRaForGrist } from '../../src/domain/water/mashPh';
import { waterProfileTarget, waterTreatmentTarget } from '../../src/domain/water/profileTarget';
import { styleByCode } from '../../src/domain/waterStyles';

const style = styleByCode('20C');
const grist = [{ kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }];
const mash = { ceiling: raSaltCeilingForGrist(grist, 10.8 / 2.2), target: raForGrist(grist, 10.8 / 2.2) };
const fixture = (patch: Partial<MinimalDilutionInput> = {}): MinimalDilutionInput => ({
  ...waterProfileTarget(style, DEFAULT_WATER_SOURCE, undefined, 0.7),
  ...waterTreatmentTarget(style, undefined, mash),
  source: DEFAULT_WATER_SOURCE, totalWaterL: 32.3, mashWaterL: 10.8, spargeWaterL: 21.5,
  targetRa: targetRaForGrist(3.6, grist, 10.8 / 2.2), raCeiling: mash.ceiling, raPreference: mash.target,
  ratio: 0.7, acid: 'lactique', beerVolumeL: 24, sourcePh: DEFAULT_WATER_SOURCE.ph,
  ...patch,
});

/** Deliberately exhaustive reference: visit every 5% candidate in order,
 * independently of the production shortcut and its local caches. Chemistry
 * and profile policy stay shared; this checks the search's complete contract.
 */
function exhaustiveDilution(input: MinimalDilutionInput): MinimalDilution {
  if (!Number.isFinite(input.totalWaterL) || input.totalWaterL <= 0) {
    const def = ACIDS[input.acid];
    return { feasible: false, pct: 0, reasons: ['Volumes d’eau nécessaires pour proposer une dilution.'],
      acid: { mash: 0, sparge: 0, unit: def.unit, name: def.name, hco3Left: 0 } };
  }
  let initialReasons: string[] = [];
  for (let pct = 0; pct <= 100; pct += 5) {
    const start = dilute(input.source, pct);
    const result = solver.solveSalts({
      mineralTargetMode: input.mineralTargetMode, fitBicarbonate: input.fitBicarbonate,
      profilePriority: input.profilePriority, targetedIons: input.targetedIons,
      start, startSparge: start, target: input.target, ranges: input.ranges,
      totalWaterL: input.totalWaterL, mashWaterL: input.mashWaterL, disabled: input.disabled,
      targetRa: input.targetRa, raCeiling: input.raCeiling, raPreference: input.raPreference,
      ratio: input.ratio, allSaltsInMash: input.allSaltsInMash,
      mashAcidHco3Mg: (input.acidOverride?.mash ?? 0) * ACIDS[input.acid].hco3NeutralizedPerUnit,
      spargeHco3AfterAcid: (input.fitBicarbonate ?? input.mineralTargetMode === 'target')
        ? calculateSpargeTreatment(start, input.spargeWaterL, input.acid,
          { sourcePh: input.sourcePh, override: input.acidOverride?.sparge }).ions.hco3 : undefined,
    });
    const water = treatment.calculateWaterTreatment(
      { ...input.source, id: 'dilution', name: 'Eau de départ', ph: input.sourcePh },
      { diRatioPct: pct, doses: result.doses, mashWaterL: input.mashWaterL, spargeWaterL: input.spargeWaterL,
        allSaltsInMash: input.allSaltsInMash, acidId: input.acid, acidOverride: input.acidOverride,
        hco3Target: input.hco3Target, hco3Range: input.hco3Range, matchMashAlkalinity: input.matchMashAlkalinity,
        mashRaCeiling: input.raCeiling, mashRaTarget: input.raPreference }, input.targetRa,
    );
    const reasons: string[] = [];
    if (input.profilePriority) {
      for (const deviation of assessWaterProfile(water.treatedTotal, input.ranges, input.targetedIons).deviations)
        reasons.push(`${ION_LABEL[deviation.ion]} après traitement : ${deviation.value} ppm pour ${deviation.min}–${deviation.max} visés`);
    }
    for (const ion of ['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>) {
      const max = input.ranges?.[ion]?.max;
      if (max != null && Number.isFinite(max) && start[ion] > max + 2)
        reasons.push(`${ION_LABEL[ion].toLowerCase()} du réseau à ${Math.round(input.source[ion])} ppm pour ${max} au maximum du style`);
    }
    const hco3Max = input.ranges?.hco3?.max;
    if (hco3Max != null && Number.isFinite(hco3Max) && start.hco3 > hco3Max + HCO3_ACID_TOLERANCE_PPM)
      reasons.push(`bicarbonate du réseau à ${Math.round(input.source.hco3)} ppm ; repère de dilution ${hco3Max + HCO3_ACID_TOLERANCE_PPM} ppm pour limiter la charge d’acide`);
    const lactate = lactateInBeer(water.mashAcid.amount + water.spargeAcid.amount, input.beerVolumeL);
    if (input.acid === 'lactique' && input.beerVolumeL > 0 && lactate > LACTATE_TASTE_THRESHOLD)
      reasons.push(`acide lactique à ${lactate} g/L de bière (seuil ${LACTATE_TASTE_THRESHOLD}) — ou passe au phosphorique, qui ne se goûte pas`);
    const acid = { mash: water.mashAcid.amount, sparge: water.spargeAcid.amount,
      unit: water.mashAcid.unit, name: water.mashAcid.name, hco3Left: start.hco3 };
    if (!reasons.length) return { feasible: true, pct, reasons: initialReasons, acid };
    if (!pct) initialReasons = reasons;
    if (pct === 100) return { feasible: false, pct, acid,
      reasons: ['La dilution seule ne suffit pas avec les doses d’acide retenues.', ...reasons] };
  }
  throw new Error('The exhaustive search must return by 100%');
}

afterEach(() => vi.restoreAllMocks());

describe('Dilution search preserves its full result while skipping a proven impossibility', () => {
  const cases: Array<[string, Partial<MinimalDilutionInput>]> = [
    ['automatic acids', {}],
    ['manual photo doses', { acidOverride: { mash: 0, sparge: 6.2 } }],
    ['retained sparge alone exceeds the threshold', { acidOverride: { sparge: 10 } }],
    ['retained mash alone exceeds the threshold', { acidOverride: { mash: 10 } }],
    ['both retained doses exceed the threshold together', { acidOverride: { mash: 4, sparge: 4 } }],
    ['rounded lactate still equals the threshold', { acidOverride: { mash: 0, sparge: 7.6 } }],
    ['rounded lactate first exceeds the threshold', { acidOverride: { mash: 0, sparge: 7.7 } }],
    ['manual zero', { acidOverride: { mash: 0, sparge: 0 } }],
    ['negative override retained as zero', { acidOverride: { mash: -20, sparge: 10 } }],
    ['nonfinite override falls back to automatic acid', { acidOverride: { mash: NaN, sparge: Infinity } }],
    ['no sparge ignores its retained dose', { spargeWaterL: 0, totalWaterL: 10.8, acidOverride: { sparge: 10 } }],
    ['negative sparge volume cannot carry retained acid', { spargeWaterL: -1, acidOverride: { sparge: 10 } }],
    ['nonfinite sparge volume cannot carry retained acid', { spargeWaterL: NaN, acidOverride: { sparge: 10 } }],
    ['no mash ignores its retained dose', { mashWaterL: 0, totalWaterL: 21.5, acidOverride: { mash: 10 } }],
    ['nonfinite mash volume cannot carry retained acid', { mashWaterL: Infinity, acidOverride: { mash: 10 } }],
    ['zero total volume returns its existing diagnostic', { totalWaterL: 0, acidOverride: { sparge: 10 } }],
    ['nonfinite total volume returns its existing diagnostic', { totalWaterL: NaN, acidOverride: { sparge: 10 } }],
    ['zero beer volume has no lactate threshold', { beerVolumeL: 0, acidOverride: { sparge: 10 } }],
    ['nonfinite beer volume has no lactate threshold', { beerVolumeL: Infinity, acidOverride: { sparge: 10 } }],
    ['phosphoric acid has no lactate threshold', { acid: 'phosphorique', acidOverride: { sparge: 10 } }],
    ['acidulated malt ignores sparge doses and lactate', { acid: 'maltAcidule', acidOverride: { mash: 300, sparge: 100 } }],
    ['source excess and unavailable salts retain all diagnostics', {
      source: { ...DEFAULT_WATER_SOURCE, ca: 300, hco3: 500 },
      disabled: ['nahco3', 'chaux', 'caco3'], acidOverride: { sparge: 10 },
    }],
    ['legacy profile mode retains taste failure', { profilePriority: false, acidOverride: { sparge: 10 } }],
  ];
  it.each(cases)('%s', (_name, patch) => {
    const input = fixture(patch);
    const {proposal,stepPct,...legacy}=minimalDilution(input);
    expect(legacy).toEqual(exhaustiveDilution(input));
    if(proposal)expect(proposal.diRatioPct).toBe(legacy.pct);
  });

  it('uses two endpoint fits instead of 21 without losing the diagnosis or retained dose', () => {
    const input = fixture({ acidOverride: { mash: 0, sparge: 10 } });
    const solve = vi.spyOn(solver, 'solveSalts');
    const calculate = vi.spyOn(treatment, 'calculateWaterTreatment');
    const expected = exhaustiveDilution(input);
    expect(solve).toHaveBeenCalledTimes(21);
    solve.mockClear();
    calculate.mockClear();
    const actual = minimalDilution(input);
    expect(actual).toEqual(expected);
    expect(actual.feasible).toBe(false);
    expect(actual.acid.sparge).toBe(10);
    expect(solve).toHaveBeenCalledTimes(2);
    expect(calculate).toHaveBeenCalledTimes(2);
  });

  it('reuses one treatment for profile assessment, lactate and the selected acid result', () => {
    const input = fixture({ acidOverride: { mash: 0, sparge: 6.2 } });
    const calculate = vi.spyOn(treatment, 'calculateWaterTreatment');
    const actual = minimalDilution(input);
    expect(actual).toMatchObject({ feasible: true, pct: 0 });
    expect(calculate).toHaveBeenCalledTimes(1);
  });
});
