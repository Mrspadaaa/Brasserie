// Mission levure-port, voie b-stock (09.11) : AM-47 — le volume repris d'une recette est comparé au matériel actuel ; on avertit, on propose, on ne change rien seul.
import { describe, expect, it } from 'vitest';
import { avertissementMaterielActuel } from '../../../src/domain/materielActuel';
import { practicalBrewingPreferences, practicalEquipment } from '../../../src/domain/brewEquipment';
import type { BrewhouseProfile, Recipe } from '../../../src/types';

const actuel: BrewhouseProfile = {
  id: 'perso', name: 'Mon installation', volumeL: 24, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences }
};
const recette = { id: 'R', name: 'Pale', volumeL: 24, boilMin: 60,
  fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [{ name: 'Citra', weightG: 40, stage: 'boil', timeMin: 15, alpha: 12 }] } as unknown as Recipe;

describe('AM-47 — volume de la recette contre le matériel actuel', () => {
  it('le volume de la recette tient : rien à dire', () => {
    expect(avertissementMaterielActuel(recette, 24, actuel)).toBeUndefined();
  });
  it('60 L sur un fermenteur de 30 L : avertit, dit pourquoi, propose un volume qui tient (jamais plus grand)', () => {
    const a = avertissementMaterielActuel(recette, 60, actuel)!;
    expect(a).toBeDefined();
    expect(a.message).toMatch(/matériel actuel/);
    expect(a.message).toMatch(/fermenteur|cuve/);
    expect(a.adaptationL).toBeGreaterThan(0);
    expect(a.adaptationL!).toBeLessThan(60);
    expect(avertissementMaterielActuel(recette, a.adaptationL!, actuel)).toBeUndefined();
  });
  it('matériel inconnu : l’inconnu n’est pas une alerte', () => {
    expect(avertissementMaterielActuel(recette, 60, { ...actuel, equipment: undefined })).toBeUndefined();
    expect(avertissementMaterielActuel(recette, 60, undefined)).toBeUndefined();
  });
});
