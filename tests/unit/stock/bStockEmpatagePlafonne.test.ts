// Mission levure-port, voie b-stock (09.11) : TE-39 — le plan d'eau dit quand l'empâtage est plafonné par la cuve utile.
import { describe, expect, it } from 'vitest';
import { BrewingMath } from '../../../src/services/brewingMath';
import { practicalBrewingPreferences, practicalEquipment } from '../../../src/domain/brewEquipment';
import type { BrewhouseProfile } from '../../../src/types';

const profile: BrewhouseProfile = {
  id: 'personal', name: 'Mon installation', volumeL: 26, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences }
};

describe('TE-39 — empâtage plafonné par la cuve utile', () => {
  it('gros grain : l’empâtage est borné et le plan donne la cuve utile qui le borne', () => {
    const eau = BrewingMath.waterVolumes(12, 30, profile);
    expect(eau.mashWaterL).toBeLessThan(12 * 4.2);
    expect(eau.mashLimitedByKettleL).toBe(profile.equipment!.kettleWorkingL);
  });
  it('petit grain : rien n’est plafonné, aucun mot à dire', () => {
    const eau = BrewingMath.waterVolumes(5, 24, profile);
    expect(eau.mashLimitedByKettleL).toBeUndefined();
  });
  it('répartition manuelle : la cuve ne plafonne rien', () => {
    const eau = BrewingMath.waterVolumes(12, 30, profile, 'batch', 60, 0, { manualWaterSplit: { mashWaterL: 30, spargeWaterL: 20 } });
    expect(eau.mashLimitedByKettleL).toBeUndefined();
  });
});
