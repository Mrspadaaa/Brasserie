import { describe, expect, it } from 'vitest';
import { recipeEntries } from '../../src/domain/productionCatalog';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { recipe as companionRecipe } from '../fixtures/brewCompanion';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { toHopRecipe } from '../../src/domain/hopIndex/v4/recipeConversion';
import type { Fermentable } from '../../src/types';

// Contre-calcul du 08.11, CF-3 : le compagnon, la liste, la fiche et l'assistant donnent le même EBC (une seule fonction,
// `recipeBeerColor`). Cas R11 du rapport : dubbel au sirop candi, le compagnon donnait 47,0 contre 22,3 ailleurs.
const pils: Fermentable = { name: 'Pilsner', weightKg: 4.5, potentialPpg: 37, colorEbc: 3.5, kind: 'grain', use: 'empatage' };
const specialB: Fermentable = { name: 'Special B', weightKg: 0.25, potentialPpg: 30, colorEbc: 300, kind: 'grain', use: 'empatage' };
const candi: Fermentable = { name: 'Sirop candi D-180', weightKg: 0.5, potentialPpg: 32, colorEbc: 355, kind: 'sucre', use: 'ebullition', fermentabilityPct: 100 };

const recette = (fermentables: Fermentable[]) => ({
  id: 'r', name: 'Dubbel', style: 'Dubbel', volumeL: 20, boilMin: 75, fermentables, hops: [],
  yeast: { name: 'Levure', qty: 1, unit: 'sachet' }
}) as never;

function companion(fermentables: Fermentable[]) {
  const ctx: BrewerContext = {
    recipe: companionRecipe({ volumeL: 20, fermentables }),
    now: Date.now(), phase: 'Recette', provenance: [], inventory: [], material: [], waterSources: [],
    equipment: { id: 'test', volumeL: 24, efficiencyPct: 75, equipment: practicalEquipment }
  };
  const data = runBrewerTool('calculate_recipe', {}, ctx).data as { color: { ebc: number } | null };
  return data.color?.ebc ?? null;
}

describe('CF-3 — le compagnon donne le même EBC que les autres écrans', () => {
  it('dubbel : compagnon = liste des recettes', () => {
    const lignes = [pils, specialB, candi];
    expect(companion(lignes)).toBe(recipeEntries([recette(lignes)], [])[0].ebc);
  });

  it('un sucre sans colorEbc ne rend plus null toute la couleur du compagnon', () => {
    const sucreSansCouleur = { name: 'Sucre', weightKg: 0.4, potentialPpg: 46, kind: 'sucre', use: 'ebullition' } as Fermentable;
    const lignes = [pils, specialB, sucreSansCouleur];
    expect(companion(lignes)).not.toBeNull();
    expect(companion(lignes)).toBe(recipeEntries([recette(lignes)], [])[0].ebc);
  });

  it('l’atelier houblons lit le même EBC que la liste (sirop candi compris)', () => {
    const lignes = [pils, specialB, candi];
    const atelier = toHopRecipe({ ...recette(lignes), ogTarget: 1.07, hops: [], yeast: { name: 'Levure', qty: 1, unit: 'sachet' } }).recette.ebc;
    expect(atelier).toBe(recipeEntries([recette(lignes)], [])[0].ebc);
  });
});
