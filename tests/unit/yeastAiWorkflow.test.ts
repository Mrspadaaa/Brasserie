import { describe, expect, it } from 'vitest';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { brewerContextForPrompt } from '../../functions/src/hopCompanionContext';
import { pick, RECIPE_FIELDS } from '../../functions/src/brewerContext';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { BrewerContext } from '../../functions/src/companionTypes';
const context = (): BrewerContext => ({ recipe: yeastFlowRecipe(), inventory: [], material: [], waterSources: [], now: 0, phase: 'Recette', provenance: [], editableTargets: ['recipe'] });
describe('Routage IA de la recette levure', () => {
  it('keeps all yeast and hop fields through the actual server whitelist and includes their prompt summary', () => {
    const c = context(); c.recipe = pick(c.recipe, RECIPE_FIELDS);
    const prompt = brewerContextForPrompt(c);
    expect(prompt.recipe.yeastDesign.pressureBar).toBe(0); expect(prompt.recipe.hops[1].aromaContactHours).toBe(48);
    expect(prompt.yeastContext.join(' ')).toContain('Girofle');
    expect(prompt.yeastContext.join(' ')).toContain('0 bar relatif');
    expect(prompt.yeastContext.join(' ')).toContain('fermentation active déclarée');
  });
  it('uses the adopted intent without requiring a new taste-first request', () => {
    const c = context(), before = JSON.stringify(c), data = runBrewerTool('fermentation_advice', {}, c).data as any;
    expect(data.recipeDesign.analysis.goal).toBe('clove'); expect(data.recipeDesign.analysis.goalOrigin).toBe('adopted');
    expect(data.alternatives.length).toBeGreaterThan(0);
    expect(data.alternatives.every((a: any) => a.styleMatch === 'documented')).toBe(true);
    expect(new Set(data.alternatives.map((a: any) => a.lab)).size).toBe(data.alternatives.length);
    expect(data.alternatives.some((a: any) => a.yeastId === 'fermentis-us05')).toBe(false);
    expect(data.alternatives).toEqual(data.recipeDesign.alternatives);
    expect(data.recipeDesign.style.comparisonFamily).toBe('weissbier'); expect(JSON.stringify(c)).toBe(before);
  });
  it('rejects banana as a lager goal without yielding taste-first legacy guides or replacing the style', () => {
    const c = context(); c.recipe = { ...c.recipe!, style: 'Helles Lager', yeastDesign: undefined,
      yeast: { name: 'Diamond', hopIndexId: 'lalbrew-diamond', form: 'sèche', qty: 20, unit: 'g' } };
    const data = runBrewerTool('fermentation_advice', { goal: 'banana' }, c).data as any;
    expect(data.recipeDesign.request.goal.status).toBe('rejected'); expect(data.guides).toEqual([]); expect(data.levers).toEqual([]);
    expect(data.recipeDesign.style.comparisonFamily).toBe('lager');
  });
  it('does not label the recipe OG as a measurement or explicit scenario input', () => {
    const implicit = runBrewerTool('fermentation_advice', {}, context()).data as any;
    expect(implicit.recipeDesign.analysis.gravityOrigin).toBe('recipe-target-not-measured');
    const explicit = runBrewerTool('fermentation_advice', { og: 1.06, goal: 'clove' }, context()).data as any;
    expect(explicit.recipeDesign.analysis.gravityOrigin).toBe('explicit-scenario-not-certified');
  });
  it('keeps the same actual strain and OG in legacy fields when an incompatible request is rejected', () => {
    const c = context(), data = runBrewerTool('fermentation_advice', { yeastId: 'lalbrew-diamond', og: 1.28 }, c).data as any;
    expect(data.recipeDesign.request.yeastId.status).toBe('rejected'); expect(data.recipeDesign.request.og.status).toBe('rejected');
    expect(data.yeastId).toBe('wyeast-3068'); expect(data.gravityContext.og).toBe(1.05);
    expect(data.gravityContext.origin).toContain('pas mesure');
  });
});
