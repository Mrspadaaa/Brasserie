import { describe, expect, it } from 'vitest';
import { practicalEquipment, profileVolumeErrors } from '../../src/domain/brewEquipment';
import { plausibilite, type SystemMetric } from '../../src/domain/brewSystemInsights';
import type { BrewhouseProfile } from '../../src/types';

// AM-48 : volume habituel sans plafond ni lien avec le fermenteur. AM-50 : évaporation et absorption entraient dans la médiane sans contrôle.

const profil = (volumeL: number, equipment = practicalEquipment) => ({ id: 'b', name: 'Cave', volumeL, equipment } as unknown as BrewhouseProfile);
const mesure = (parameter: SystemMetric['parameter'], value: number): SystemMetric => ({
  id: parameter === 'boilOffLPerHour' ? 'evaporation' : 'absorption', label: 'x', unit: parameter === 'boilOffLPerHour' ? 'L/h' : 'L/kg', value, expected: null,
  approximate: false, sourceIds: [], reason: '', parameter, calibrationEligible: true,
});

describe('Volume habituel du profil', () => {
  it('24 L dans un fermenteur de 30 L à 20 % de réserve passe (repère 24 L)', () => {
    expect(profileVolumeErrors(profil(24))).toEqual([]);
  });
  it('25 L ou 99 999 L dépassent le repère du fermenteur, avec le chiffre', () => {
    expect(profileVolumeErrors(profil(25))[0]).toMatch(/repère du fermenteur \(24 L/);
    expect(profileVolumeErrors(profil(99999))[0]).toMatch(/99999 L/);
  });
  it('0, négatif ou inconnu sont refusés sans être pris pour un volume', () => {
    expect(profileVolumeErrors(profil(0))).toHaveLength(1);
    expect(profileVolumeErrors(profil(-3))).toHaveLength(1);
    expect(profileVolumeErrors(profil(Number.NaN))).toHaveLength(1);
  });
});

describe('Plausibilité d’une calibration', () => {
  it('une évaporation de 3 L/h reste éligible', () => {
    expect(plausibilite(mesure('boilOffLPerHour', 3)).calibrationEligible).toBe(true);
  });
  it('4 000 L/h ou −2 L/h sortent de la médiane, avec la raison', () => {
    for (const v of [4000, -2]) {
      const m = plausibilite(mesure('boilOffLPerHour', v));
      expect(m.calibrationEligible).toBe(false);
      expect(m.reason).toMatch(/invraisemblable/);
    }
  });
  it('une absorption de 8 L/kg est écartée, 0,96 L/kg reste', () => {
    expect(plausibilite(mesure('grainAbsorptionLPerKg', 8)).calibrationEligible).toBe(false);
    expect(plausibilite(mesure('grainAbsorptionLPerKg', 0.96)).calibrationEligible).toBe(true);
  });
});
