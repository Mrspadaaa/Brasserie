import { describe, expect, it } from 'vitest';
import { BrewingMath } from '../../src/services/brewingMath';

// Contre-calcul du 08.11, CF-7 : le facteur de température du whirlpool suit la cinétique d'isomérisation de Malowicki et
// Shellhammer (2005), k(T) = 7,9e11 · exp(−11858 / T) (T en kelvin, k en min⁻¹) : facteur relatif à 100 °C = exp(−11858/T) / exp(−11858/373,15).
// L'ancien « moitié par 10 °C » (0,25 à 80 °C) surestimait l'amertume : NEIPA R3 du rapport, 50,7 IBU contre 37,4.
const malowicki = (tC: number) => Math.exp(-11858 / (tC + 273.15)) / Math.exp(-11858 / 373.15);
const wp = (tempC: number) => ({ name: 'Citra', weightG: 50, alpha: 12, stage: 'whirlpool' as const, timeMin: 20, tempC });

describe('CF-7 — whirlpool : facteur de température de Malowicki', () => {
  it.each([[90, 0.417], [80, 0.165], [70, 0.062], [60, 0.022]])('à %s °C : %f de l’isomérisation à 100 °C', (tempC, attendu) => {
    const rapport = BrewingMath.hopIbu(wp(tempC), 20, 1.05) / BrewingMath.hopIbu(wp(100), 20, 1.05);
    expect(rapport).toBeCloseTo(attendu, 2);
    expect(rapport).toBeCloseTo(malowicki(tempC), 3);
  });

  it('NEIPA R3 (25 L, 1,055 environ) : le whirlpool de 250 g à 80 °C passe sous 40 IBU au total (50,7 avant)', () => {
    const houblons = [
      { name: 'Magnum', weightG: 10, alpha: 13, stage: 'boil' as const, timeMin: 60 },
      { name: 'Citra', weightG: 150, alpha: 12, stage: 'whirlpool' as const, timeMin: 20, tempC: 80 },
      { name: 'Mosaic', weightG: 100, alpha: 11.5, stage: 'whirlpool' as const, timeMin: 20, tempC: 80 }
    ];
    const total = houblons.reduce((s, h) => s + BrewingMath.hopIbu(h, 25, 1.057), 0);
    expect(total).toBeGreaterThan(30);
    expect(total).toBeLessThan(42);
  });

  it('sans température, le repli reste 80 °C', () => {
    const { tempC: _t, ...sans } = wp(80);
    expect(BrewingMath.hopIbu(sans, 20, 1.05)).toBe(BrewingMath.hopIbu(wp(80), 20, 1.05));
  });
});
