import { describe, expect, it } from 'vitest';
import { completerMasseAjoutee, grainTotalVise, masseProposee } from '../../src/domain/recette/propositions';
import type { Fermentable } from '../../src/types';

const ctx = { volumeL: 24, rendementPct: 72, ogVisee: 1.065 };
const grain = (name: string, weightKg: number): Fermentable => ({ name, weightKg, kind: 'grain' } as Fermentable);

describe('N1 : masse proposée d’un malt ajouté (WFR-3)', () => {
  it('facture vide : le malt de base porte toute la densité visée', () => {
    // 65 points × 24 L ÷ (0,72 × 300) ≈ 7,2 kg
    expect(grainTotalVise(ctx)).toBeCloseTo(7.22, 1);
    expect(masseProposee('Malt pilsner', [], ctx)).toBeCloseTo(7.2, 1);
  });
  it('un caramel prend sa part usuelle (5 %), jamais 0', () => {
    expect(masseProposee('Caramünch Typ 2', [grain('Pils', 6)], ctx)).toBeCloseTo(0.35, 2);
  });
  it('seule une ligne de grain ajoutée à 0 kg est complétée ; une masse effacée à la main reste effacée', () => {
    const avant = [grain('Pils', 6)];
    const ajoutee = completerMasseAjoutee(avant, [...avant, grain('Caramünch Typ 2', 0)], ctx);
    expect(ajoutee[1].weightKg).toBeGreaterThan(0);
    const efface = completerMasseAjoutee(avant, [grain('Pils', 0)], ctx);
    expect(efface[0].weightKg).toBe(0);
    const tapee = completerMasseAjoutee(avant, [...avant, grain('Munich', 1.2)], ctx);
    expect(tapee[1].weightKg).toBe(1.2);
  });
});
