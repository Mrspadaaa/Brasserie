import { describe, it, expect } from 'vitest';
import {
  practicalEquipment,
  fermenterLimit,
  equipmentCheck,
  equipmentErrors,
  roPackages
} from '../../src/domain/brewEquipment';
import { adaptRecipeEquipment } from '../../src/domain/adaptRecipeEquipment';
import { BrewingMath } from '../../src/services/brewingMath';
import { boilScenario } from '../../src/domain/brewAssist';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { BrewhouseProfile, Recipe } from '../../src/types';
import { readRecipeFields } from '../../src/domain/recipeTransfer';

export const rig: BrewhouseProfile = {
  id: 'test',
  name: 'Cuve 45 L',
  volumeL: 24,
  efficiencyPct: 75,
  boilOffRatePct: 10,
  deadSpaceL: 1.5,
  mashRatioLPerKg: 3.8,
  equipment: { ...practicalEquipment }
};
describe('Matériel réel : capacités, conservation et paquets', () => {
  it('30 L totaux donnent 24 L utiles avec 20 % du récipient réservés', () => {
    expect(fermenterLimit(rig.equipment)).toBe(24);
    expect(fermenterLimit({ ...practicalEquipment, fermenterHeadspacePct: 25 })).toBe(22.5);
    expect(equipmentErrors({ ...practicalEquipment, kettleWorkingL: 45 })).not.toHaveLength(0);
    expect(equipmentErrors({ ...practicalEquipment, roPackL: NaN })).not.toHaveLength(0);
  });
  it('le même appareil évapore le même débit pour 18 et 24 L', () => {
    expect(BrewingMath.waterVolumes(5, 18, rig, 'batch', 70).boilOffL).toBe(3.4);
    expect(BrewingMath.waterVolumes(5, 24, rig, 'batch', 70).boilOffL).toBe(3.4);
  });
  it('ferme le bilan à froid et à chaud sans confondre absorption et place du grain', () => {
    const w = BrewingMath.waterVolumes(7.28, 24, rig, 'batch', 75, 48);
    expect(w.preBoilHotL).toBeCloseTo((24 + 1.5 + 0.3) / 0.96 + 3.75, 1);
    const collected = w.mashWaterL + w.spargeWaterL - w.grainAbsorptionL;
    expect(collected).toBeCloseTo(w.preBoilVolumeL, 1);
    expect(collected - 3.75 * 0.96 - 1.5 - w.hopLossL).toBeCloseTo(24, 1);
    expect(w.mashWaterL).toBe(27.7);
    expect(w.spargeWaterL).toBeLessThanOrEqual(18);
    expect(
      equipmentCheck(rig.equipment, {
        volumeL: 24,
        grainKg: 7.28,
        mashL: w.mashWaterL,
        spargeL: w.spargeWaterL,
        preBoilHotL: w.preBoilHotL
      })?.mashTooFull
    ).toBe(false);
  });
  it('reporte au rinçage l’eau qui ne tient pas avec le grain, sans perdre de litres', () => {
    const w = BrewingMath.waterVolumes(9.1, 24, rig, 'batch', 75);
    const check = equipmentCheck(rig.equipment, {
      volumeL: 24,
      grainKg: 9.1,
      mashL: w.mashWaterL,
      spargeL: w.spargeWaterL,
      preBoilHotL: w.preBoilHotL
    })!;
    expect(check.mashTooFull).toBe(false);
    expect(w.mashWaterL).toBeLessThan(9.1 * 3.8);
    expect(w.mashWaterL + w.spargeWaterL - w.grainAbsorptionL).toBeCloseTo(w.preBoilVolumeL, 1);
    const full = BrewingMath.waterVolumes(9.1, 24, rig, 'none', 75);
    expect(full.spargeWaterL).toBe(0);
    expect(
      equipmentCheck(rig.equipment, {
        volumeL: 24,
        grainKg: 9.1,
        mashL: full.mashWaterL,
        spargeL: 0
      })!.mashTooFull
    ).toBe(true);
  });
  it('répartit 25 L de rinçage en plusieurs charges et réserve la dilatation du sparger 18 L', () => {
    const check = equipmentCheck(rig.equipment, {
      volumeL: 24,
      grainKg: 5,
      mashL: 20,
      spargeL: 25
    })!;
    expect(check.loads).toEqual([17.4, 7.6]);
    for (const charge of check.loads) expect(charge * 1.03).toBeLessThanOrEqual(18);
  });
  it('achète par packs entiers mais dose au litre exact', () => {
    expect(roPackages(7.3, 5)).toEqual({
      count: 2,
      packL: 5,
      requiredL: 7.3,
      purchasedL: 10,
      remainingL: 2.7
    });
    expect(roPackages(10, 5)!.count).toBe(2);
    expect(roPackages(0, 5)!.count).toBe(0);
    expect(roPackages(2, 0)).toBeNull();
    for (let i = 0; i <= 1000; i++) {
      const p = roPackages(i / 10, 5)!;
      expect(p.purchasedL - p.remainingL).toBeCloseTo(i / 10, 5);
      expect(p.remainingL).toBeLessThan(5);
    }
  });
  it('adapte ingrédients, sels et acide sans toucher l’original ni arrondir le besoin d’osmosée aux packs', () => {
    const r = { ...recipe(), id: 'source', volumeL: 30 } as Recipe;
    r.waterPlan!.diRatioPct = 20;
    const before = JSON.stringify(r);
    const adapted = adaptRecipeEquipment(r, rig);
    expect(adapted.volumeL).toBe(24);
    expect(adapted.fermentables![0].weightKg).toBe(4);
    expect(adapted.hops![0].weightG).toBe(16);
    expect(adapted.waterPlan!.mash.cacl2! / adapted.waterPlan!.mashWaterL).toBeCloseTo(0.1, 2);
    expect(adapted.waterPlan!.acid!.mash / adapted.waterPlan!.mashWaterL).toBeCloseTo(0.05, 2);
    expect(adapted.waterPlan!.diRatioPct).toBe(20);
    expect(JSON.stringify(r)).toBe(before);
    expect(readRecipeFields(adapted).brewhouse?.equipment).toEqual(rig.equipment);
    expect(() => adaptRecipeEquipment(r, rig, 30)).toThrow(/ne tient pas/);
  });
  it('l’aide d’ébullition et le plan utilisent la même rétraction', () => {
    const r = recipe({ ...adaptRecipeEquipment({ ...recipe(), id: 'r' } as Recipe, rig) });
    const now = Date.now();
    const s = brewState(r, {
      readings: [
        {
          kind: 'volume',
          stepId: 'preboil',
          value: r.preBoilL!,
          at: now,
          unit: 'L',
          roomTemp: true
        },
        { kind: 'densite', stepId: 'preboil', value: 1.04, at: now, unit: 'SG', roomTemp: true }
      ]
    });
    const result = boilScenario(r, s, 60)!;
    expect(result.finalL).toBeCloseTo(r.preBoilL! - 3 * 0.96, 5);
  });
});
