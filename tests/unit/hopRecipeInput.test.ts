import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/hopScientific/test-houb.json';
import manufacturer from '../../src/data/hopManufacturerBootstrap.json';
import guide from '../../src/data/hopGuideVarietyBootstrap.json';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import trials from '../../src/data/hopTrialBootstrap.json';
import previous from '../../src/data/hopExtrapolationV4Bootstrap.json';
import { prepareHopRecipeInput } from '../../src/domain/hopIndex/recipePrediction';
import { checkHopFermentation } from '../../src/domain/hopIndex/solver';
import { currentGuideRevision, guideYeasts, guideSolverPolicy } from '../../src/ui/hopIndex/guideData';
import type { Recipe } from '../../src/types';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';

const varieties = [...manufacturer.hopVarieties, ...guide.hopVarieties, ...trials.hopVarieties] as HopVariety[];
const documentedYeasts = catalogue.filter(k => k.id === 'lalbrew-diamond') as HopKnowledge[];
const yeasts = guideYeasts(documentedYeasts);
const prepare = (recipe: Recipe) => prepareHopRecipeInput(recipe, varieties, yeasts);
describe('Recette réelle : contexte commun sans conditions inventées', () => {
  it('reconnaît Test houb, conserve les contacts et les inconnues, sans mutation', () => {
    const recipe = structuredClone(fixture) as Recipe, before = JSON.stringify(recipe);
    const { input } = prepare(recipe);
    expect(input.yeastId).toBe('lalbrew-diamond');
    expect(input.additions.map(a => a.triplet.varietyId)).toEqual(['hopsteiner-cas', 'hopsteiner-cas']);
    expect(input.additions.map(a => a.triplet.contactHours)).toEqual([10 / 60, 20 / 60]);
    expect(input.additions.map(a => a.triplet.temperatureC)).toEqual([null, 80]);
    expect(input.additions.map(a => a.triplet.doseGL)).toEqual([recipe.hops[0].weightG / 24, 3]);
    expect(input.fermentation[0]).toMatchObject({ tempC: 19, days: 4, kind: 'primaire' });
    expect(JSON.stringify(recipe)).toBe(before);
    const warnings = checkHopFermentation(recipe, input.yeastId!, guideSolverPolicy(documentedYeasts)!);
    expect(warnings.some(w => w.message.includes('hors de la fenêtre fabricant'))).toBe(true);
    expect(warnings.some(w => w.message.includes('aucun ajout'))).toBe(true);
  });
  it('J+3 ne prouve ni la phase active ni la durée de contact, le nom AA ne devient pas un COA', () => {
    const recipe = { ...structuredClone(fixture), yeast: { ...fixture.yeast, name: 'Fermentis Levure Safale US-05' },
      hops: [{ name: 'Houblon Idaho 7 12.7%', stage: 'dryHop', dayOffset: 3, weightG: 20, alpha: 0 }] } as Recipe;
    const { input } = prepare(recipe);
    expect(input.yeastId).toBe('fermentis-us05');
    expect(input.additions[0]).toMatchObject({ dayOffset: 3, triplet: { timing: null, contactHours: null, temperatureC: null, lotId: null } });
    expect(input.additions[0].triplet.varietyId).toBeTruthy();
    expect(recipe.hops[0].alpha).toBe(0);
  });
  it('une référence explicite indisponible reste visible, un volume manquant ne produit pas de dose', () => {
    const recipe = structuredClone(fixture) as Recipe;
    recipe.yeast.hopIndexId = 'removed-yeast'; recipe.hops[0].hopVarietyId = 'removed-hop'; recipe.volumeL = 0;
    const { input } = prepare(recipe);
    expect(input.yeastId).toBe('removed-yeast');
    expect(input.additions[0].triplet.varietyId).toBe('removed-hop');
    expect(input.additions.every(a => a.triplet.doseGL === null)).toBe(true);
  });
  it('les paliers froids ne sont pas des fermentations primaires hors plage', () => {
    const recipe = structuredClone(fixture) as Recipe;
    recipe.fermentation = [{ kind: 'garde', name: 'Garde', tempC: 4, days: 3 }];
    const checks = checkHopFermentation(recipe, 'lalbrew-diamond', guideSolverPolicy(documentedYeasts)!);
    expect(checks.map(c => c.message)).toEqual(['Aucun palier de fermentation principale renseigné.']);
  });
  it('actualise seulement le pack v4 intact, sans toucher aux coefficients édités ou désactivés', () => {
    const row = previous[0] as HopKnowledge;
    expect(currentGuideRevision(row)).toMatchObject({ version: '2026-09-09.1' });
    for (const patch of [{ enabled: false }, { name: 'Convention personnelle' }]) {
      const custom = { ...row, ...patch } as HopKnowledge;
      expect(currentGuideRevision(custom)).toBe(custom);
    }
  });
});
