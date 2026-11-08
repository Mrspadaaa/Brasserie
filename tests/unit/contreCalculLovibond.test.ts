import { describe, expect, it } from 'vitest';
import { computeBeerColor, ebcToLovibond } from '../../src/domain/beerColor';
import type { MaltIngredient } from '../../src/types';

// Contre-calcul du 08.11, CF-2 : le degré Lovibond du malteur n'est pas le SRM. Daniels (Designing Great Beers) :
// °L = (EBC / 1,97 + 0,76) / 1,3546, puis Morey (MCU = Σ kg·2,2046·°L / gal US ; SRM = 1,4922 · MCU^0,6859 ; EBC = 1,97 · SRM).
// Vérifié sur les catalogues de malteurs : CaraMunich III à 150 EBC est vendue 57 °L, le Carafa III à 1300-1500 EBC vers 525-560 °L.
const ligne = (kg: number, colorEbc: number): MaltIngredient => ({ name: 'm', weightKg: kg, colorEbc, kind: 'grain', use: 'empatage' });

describe('CF-2 — conversion EBC vers °L de Daniels', () => {
  it('CaraMunich III (150 EBC) : 57 °L, pas 76', () => {
    expect(ebcToLovibond(150)).toBeCloseTo(57, 0);
  });
  it('Carafa III (1300 à 1500 EBC) : 488 à 563 °L chez Daniels', () => {
    expect(ebcToLovibond(1300)).toBeCloseTo(488, -1);
    expect(ebcToLovibond(1500)).toBeCloseTo(563, -1);
  });
  it('un malt pâle (3,5 EBC) reste proche de 1,9 °L', () => {
    expect(ebcToLovibond(3.5)).toBeCloseTo(1.9, 1);
  });

  // Valeurs du rapport (REFERENCES.md, oracle indépendant), tolérance ±0,3 EBC.
  it.each([
    ['pale ale R1 (4,5 kg pale + 0,3 kg crystal 120), 20 L', [ligne(4.5, 6.5), ligne(0.3, 120)], 20, 15.5],
    ['dry stout R2 (3,2 pale + 0,4 torréfiée 1300 + 0,5 flocons), 20 L', [ligne(3.2, 6), ligne(0.4, 1300), ligne(0.5, 3)], 20, 62.2],
    ['imperial stout R10, 20 L', [ligne(9, 6), ligne(0.6, 900), ligne(0.4, 1300), ligne(0.5, 150)], 20, 106.8],
    ['300 L R13 (60 kg pale + 4 kg crystal 120)', [ligne(60, 6.5), ligne(4, 120)], 300, 14.3],
    ['petite 10 L R7', [ligne(2.25, 6.5), ligne(0.15, 120)], 10, 15.5]
  ])('%s : %f EBC attendus', (_nom, lignes, volumeL, attendu) => {
    expect(computeBeerColor(lignes as MaltIngredient[], volumeL as number)!.ebc).toBeCloseTo(attendu as number, 0);
    expect(Math.abs(computeBeerColor(lignes as MaltIngredient[], volumeL as number)!.ebc - (attendu as number))).toBeLessThanOrEqual(0.3);
  });
});
