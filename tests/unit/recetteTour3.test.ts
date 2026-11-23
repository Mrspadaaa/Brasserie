/**
 * T2-8 (tour 3, 19.11) : l'eau ajoutée pendant ou après l'ébullition (`installation.kettleTopUp`) doit se lire de la même façon
 * partout où une recette a ce choix. Cas de sa capture : 29 L, 130 min d'ébullition, cuve utile 35 L, 3,7 L ajoutés.
 * Référence : `BrewingMath.waterVolumes` avec `topUpToKettle`, l'appel de `BrewWizard`.
 */
import { describe, expect, it } from 'vitest';
import { BrewingMath, kettleHopGrams } from '../../src/services/brewingMath';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { refreshCompanionRecipe } from '../../src/domain/brewerRecipeRefresh';
import { recipe } from '../fixtures/brewCompanion';
import type { BrewhouseProfile } from '../../src/types';
import type { BrewerContext } from '../../functions/src/companionTypes';

const profil: BrewhouseProfile = {
  id: 'p', name: 'Royal Catering', volumeL: 26, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences }
};
const GRAIN = 6.5;
const base = recipe({
  volumeL: 29, boilMin: 130, totalGristKg: GRAIN, efficiencyPct: 75,
  fermentables: [{ name: 'Pale', kind: 'grain', use: 'empatage', weightKg: GRAIN, colorEbc: 6, potentialPpg: 36 }],
  hops: [{ name: 'Citra', stage: 'boil', weightG: 70, alpha: 12, timeMin: 60 }, { name: 'Mosaic', stage: 'dryHop', weightG: 40, alpha: 12 }],
  brewhouse: profil,
  installation: { kettleTopUp: true }
});
const hopsCuve = kettleHopGrams(base.hops);
const attendu = BrewingMath.waterVolumes(GRAIN, 29, profil, 'batch', 130, hopsCuve, { topUpToKettle: true });
const sans = BrewingMath.waterVolumes(GRAIN, 29, profil, 'batch', 130, hopsCuve);

const contexte = (r: typeof base): BrewerContext => ({
  recipe: r, now: Date.now(), phase: 'Recette', provenance: [], inventory: [], material: [], waterSources: [],
  equipment: { id: 'test', volumeL: 29, efficiencyPct: 75, equipment: practicalEquipment }
});

describe('T2-8 — l’eau ajoutée dans les lectures du compagnon', () => {
  it('la référence : 3,7 L ajoutés, 3,7 L de moins à l’empâtage et au rinçage, moût avant ébullition dans la cuve', () => {
    expect(attendu.topUpL).toBe(3.7);
    expect(Math.round((sans.mashWaterL + sans.spargeWaterL - attendu.mashWaterL - attendu.spargeWaterL) * 10) / 10).toBe(3.7);
    expect(attendu.preBoilHotL!).toBeLessThanOrEqual(practicalEquipment.kettleWorkingL);
  });

  it('calculate_recipe : recommendedWater donne le même plan d’eau que BrewWizard', () => {
    const data = runBrewerTool('calculate_recipe', {}, contexte(base)).data as {
      recommendedWater: { mashWaterL: number; spargeWaterL: number; topUpL?: number; preBoilHotL?: number } | null;
    };
    expect(data.recommendedWater).not.toBeNull();
    expect(data.recommendedWater!.topUpL).toBe(attendu.topUpL);
    expect(data.recommendedWater!.mashWaterL).toBe(attendu.mashWaterL);
    expect(data.recommendedWater!.spargeWaterL).toBe(attendu.spargeWaterL);
    expect(data.recommendedWater!.preBoilHotL).toBe(attendu.preBoilHotL);
  });

  it('calculate_recipe sans le choix : rien ne change (pas d’eau ajoutée)', () => {
    const r = { ...base, installation: {} };
    const data = runBrewerTool('calculate_recipe', {}, contexte(r)).data as { recommendedWater: { mashWaterL: number; spargeWaterL: number; topUpL?: number } };
    expect(data.recommendedWater.topUpL).toBeUndefined();
    expect(data.recommendedWater.mashWaterL).toBe(sans.mashWaterL);
    expect(data.recommendedWater.spargeWaterL).toBe(sans.spargeWaterL);
  });

  it('calculate_recipe à un autre volume : l’eau ajoutée se recalcule pour ce volume (scaleRecipe et recommendedWater d’accord)', () => {
    const data = runBrewerTool('calculate_recipe', { volumeL: 25 }, contexte(base)).data as {
      recommendedWater: { mashWaterL: number; spargeWaterL: number; topUpL?: number };
    };
    const ref = BrewingMath.waterVolumes(GRAIN * 25 / 29, 25, profil, 'batch', 130, hopsCuve * 25 / 29, { topUpToKettle: true });
    expect(data.recommendedWater.topUpL ?? 0).toBeCloseTo(ref.topUpL ?? 0, 1);
    expect(data.recommendedWater.mashWaterL + data.recommendedWater.spargeWaterL).toBeCloseTo(ref.mashWaterL + ref.spargeWaterL, 0);
  });

  it('refreshCompanionRecipe : le plan enregistré avec l’eau ajoutée donne le moût avant ébullition du plan, pas un dépassement', () => {
    const r = { ...base, waterPlan: { ...base.waterPlan!, mashWaterL: attendu.mashWaterL, spargeWaterL: attendu.spargeWaterL } };
    const rafraichie = refreshCompanionRecipe(r as never);
    // Le plan arrondit le volume froid puis le chaud : 0,1 L d'écart au plus.
    expect(Math.abs(rafraichie.preBoilHotL! - attendu.preBoilHotL!)).toBeLessThanOrEqual(0.15);
    expect(rafraichie.preBoilHotL!).toBeLessThanOrEqual(practicalEquipment.kettleWorkingL);
  });
});
