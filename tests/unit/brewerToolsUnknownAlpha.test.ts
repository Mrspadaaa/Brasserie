import { describe, expect, it } from 'vitest';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { recipe } from '../fixtures/brewCompanion';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import type { BrewerContext } from '../../functions/src/companionTypes';

// #32 (REV-WIZ N2) : une recette garde un alpha inconnu sous la valeur 0 (`recipeValidation.ts:50`). Les outils du
// compagnon gardent ce 0, qu'une proposition `hops` exige comme nombre, mais disent au modèle qu'il signifie « inconnu ».
// Aucun appel de modèle ici : les outils sont des calculs locaux.
function context(alphas: number[]): BrewerContext {
  const base = recipe({ efficiencyPct: 75 });
  return {
    recipe: { ...base, hops: alphas.map((alpha, index) => ({ name: index ? 'Magnum' : 'Cascade', weightG: 30, alpha,
      stage: 'boil' as const, timeMin: 60 })) },
    now: Date.now(), phase: 'Recette', provenance: [], inventory: [], material: [], waterSources: [],
    equipment: { id: 'test', volumeL: 24, efficiencyPct: 75, equipment: practicalEquipment }
  };
}
const unknownAlpha = (limits: string[]) => limits.filter(line => /alpha/i.test(line) && /inconnu/i.test(line));

describe('Outils du compagnon — alpha inconnu (#32, N2)', () => {
  it('inspect_brewery nomme la ligne dont l’alpha 0 signifie « inconnu », sans changer la valeur transmise', () => {
    const evidence = runBrewerTool('inspect_brewery', { section: 'recipe' }, context([0, 12]));
    const data = evidence.data as { recipe: { hops: Array<{ alpha: number }> } };
    expect(data.recipe.hops.map(h => h.alpha)).toEqual([0, 12]);
    const lines = unknownAlpha(evidence.limits);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/hop-0 Cascade/);
    expect(lines[0]).toMatch(/jamais 0 %/);
    expect(lines[0]).not.toMatch(/Magnum/);
  });

  it('calculate_recipe garde l’IBU inconnu et dit pourquoi au modèle', () => {
    const evidence = runBrewerTool('calculate_recipe', {}, context([0]));
    const data = evidence.data as { ibu: unknown; ingredients: { hops: Array<{ alpha: number }> } };
    expect(data.ibu).toBeNull();
    expect(data.ingredients.hops[0].alpha).toBe(0);
    expect(unknownAlpha(evidence.limits)[0]).toMatch(/hop-0 Cascade/);
  });

  it('lit encore un contexte ancien sans provenance, comme avant la limite', () => {
    const legacy = { ...context([0]), provenance: undefined } as unknown as BrewerContext;
    const evidence = runBrewerTool('inspect_brewery', { section: 'recipe' }, legacy);
    expect(unknownAlpha(evidence.limits)[0]).toMatch(/hop-0 Cascade/);
  });

  it('n’ajoute rien quand tous les alphas sont connus', () => {
    expect(unknownAlpha(runBrewerTool('inspect_brewery', { section: 'recipe' }, context([5.5, 12])).limits)).toEqual([]);
    expect(unknownAlpha(runBrewerTool('calculate_recipe', {}, context([5.5])).limits)).toEqual([]);
  });
});
