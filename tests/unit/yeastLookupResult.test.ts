import { describe, expect, it } from 'vitest';
import { yeastLookupResultError } from '../../functions/src/yeastLookupResult';
import { applyYeastFacts, sanitizeFacts, type IngredientFacts } from '../../src/domain/ingredientFacts';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { resolveYeastDossier } from '../../src/domain/yeastProjection';

const result = (): IngredientFacts => ({ found: true, name: 'Culture de test', source: 'Fiche synthétique',
  sourceUrl: 'https://example.invalid/culture', attenuationPct: 77.25, form: 'liquide',
  technicalFacts: [{ key: 'attenuation', reported: '77,25–82,75 %', range: { min: 77.25, max: 82.75 }, unit: '%',
    qualifier: 'range', origin: 'ai', source: 'Fiche synthétique', sourceUrl: 'https://example.invalid/culture' }] });

describe('Autocomplete levure : résultat documentaire utilisable', () => {
  it('préserve une plage exacte sans retenir le scalaire supplémentaire du modèle, puis la copie', () => {
    const facts = result(); expect(yeastLookupResultError(facts)).toBeUndefined();
    expect(sanitizeFacts(facts).attenuationPct).toBeUndefined();
    const recipe = yeastFlowRecipe();
    recipe.yeast = applyYeastFacts({ name: 'Culture de test', form: 'liquide', qty: .125, unit: 'L' }, facts);
    expect(recipe.yeast.attenuationPct).toBeUndefined();
    expect(recipe.yeast.technicalFacts?.[0].range).toEqual({ min: 77.25, max: 82.75 });
    expect(readRecipeText(writeRecipeText(recipe))?.yeast).toEqual(recipe.yeast);
  });
  it('refuse une image sociale citée comme preuve technique', () => {
    const facts = result(); facts.technicalFacts![0].sourceUrl = 'https://example.invalid/ogimage.png?size=600';
    expect(yeastLookupResultError(facts)).toContain('Aucune donnée appliquée');
  });
  it('conserve une limite en % ABV sans la doubler d’une valeur exacte ni perdre sa borne', () => {
    const facts = result(); facts.alcoholTolerancePct = 13;
    facts.technicalFacts!.push({ key: 'alcoholTolerance', reported: 'Jusqu’à 13 % ABV', range: { min: 13, max: 13 },
      unit: '% ABV', qualifier: 'upTo', origin: 'ai', source: 'Fiche synthétique', sourceUrl: facts.sourceUrl });
    expect(sanitizeFacts(facts).alcoholTolerancePct).toBeUndefined();
    const yeast = applyYeastFacts({ name: 'Culture de test', form: 'liquide', qty: .125, unit: 'L' }, facts);
    expect(yeast.technicalFacts?.[1].unit).toBe('% ABV');
    expect(resolveYeastDossier(yeast).alcoholTolerance).toMatchObject({ qualifier: 'upTo', range: { min: 13, max: 13 } });
  });
  it('refuse les liens absents, non documentaires et les bornes incohérentes', () => {
    const missing = result(); delete missing.sourceUrl;
    expect(yeastLookupResultError(missing)).toBeDefined();
    const unsafe = result(); unsafe.sourceUrl = 'javascript:alert(1)';
    expect(yeastLookupResultError(unsafe)).toBeDefined();
    const reversed = result(); reversed.technicalFacts![0].range = { min: 83, max: 77 };
    expect(yeastLookupResultError(reversed)).toBeDefined();
  });
  it('accepte une fiche PDF et un constat explicite de recherche infructueuse', () => {
    const facts = result(); facts.sourceUrl = 'https://example.invalid/fiche.pdf';
    expect(yeastLookupResultError(facts)).toBeUndefined();
    expect(yeastLookupResultError({ found: false, note: 'Fiche non retrouvée.' })).toBeUndefined();
  });
});
