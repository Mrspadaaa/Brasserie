import { describe, expect, it } from 'vitest';
import { BrewingMath } from '../../src/services/brewingMath';

// Contre-calcul du 08.11, CF-9 : sans profil d'équipement, le volume avant ébullition était V + évaporation + fond + houblon + 4 % de V :
// un volume « à chaud » mal défini, alors que le mode équipement rend au même champ un volume FROID (preBoilVolumeL = chaud × (1 − rétraction)).
// Cas R13 du rapport : 300 L, 60 min, 10 %/h, fond 2 L, 880 g de houblon en cuve. Référence indépendante :
//   post-ébullition froid = 300 + 2 + 0,006 × 880 = 307,28 L ; à chaud = 307,28 / 0,96 = 320,08 L
//   avant ébullition à chaud = 320,08 / (1 − 0,10 × 1 h) = 355,6 L ; à froid = 355,6 × 0,96 = 341,4 L.
describe('CF-9 — volume avant ébullition sans équipement, dans le sens du mode équipement', () => {
  const brewhouse = { boilOffRatePct: 10, deadSpaceL: 2, mashRatioLPerKg: 4.2 } as never;
  const plan = BrewingMath.waterVolumes(64, 300, brewhouse, 'batch', 60, 880);

  it('300 L : 341,4 L à froid (349,3 avant, +2,3 % de trop)', () => {
    expect(plan.preBoilVolumeL).toBeGreaterThan(341.4 * 0.995);
    expect(plan.preBoilVolumeL).toBeLessThan(341.4 * 1.005);
  });

  it('le volume à chaud est donné à côté : 355,6 L', () => {
    expect(plan.preBoilHotL).toBeCloseTo(355.6, 0);
    expect(plan.preBoilVolumeL).toBeCloseTo(plan.preBoilHotL! * 0.96, 0);
  });

  it('l’eau totale reste dans les 2 % de la référence (empâtage + rinçage = froid + absorption)', () => {
    const reference = 341.4 + 64 * 0.96;
    expect(Math.abs(plan.mashWaterL + plan.spargeWaterL - reference) / reference).toBeLessThanOrEqual(0.02);
  });

  it('un petit brassin garde la même logique (20 L, 10 %/h, 60 min, fond 2 L)', () => {
    const p = BrewingMath.waterVolumes(5, 20, brewhouse, 'batch', 60, 0);
    // (20 + 2) / 0,96 = 22,917 à chaud après ébullition ; / 0,9 = 25,463 avant ; × 0,96 = 24,44 à froid.
    expect(p.preBoilVolumeL).toBeCloseTo(24.4, 1);
  });
});
