import { describe, expect, it } from 'vitest';
import { yeastLookupResultError } from '../../functions/src/yeastLookupResult';
import { adaptYeastLookupResult, applyYeastFacts, sanitizeFacts, type IngredientFacts } from '../../src/domain/ingredientFacts';
import { readYeastTechnicalFacts } from '../../functions/src/yeastTechnicalFacts';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { resolveYeastDossier } from '../../src/domain/yeastProjection';

const result = (): IngredientFacts => ({ found: true, name: 'Culture de test', source: 'Fiche synthétique',
  sourceUrl: 'https://example.invalid/culture', attenuationPct: 77.25, form: 'liquide',
  technicalFacts: [{ key: 'attenuation', reported: '77,25–82,75 %', range: { min: 77.25, max: 82.75 }, unit: '%',
    qualifier: 'range', origin: 'ai', source: 'Fiche synthétique', sourceUrl: 'https://example.invalid/culture' }] });

describe('Autocomplete levure : résultat documentaire utilisable', () => {
  const autoMarked = (): IngredientFacts => ({ found: true, name: 'Culture de test', source: 'Source IA synthétique',
    sourceUrl: 'https://example.invalid/flocculation', retrievedAt: '2026-09-28', technicalFacts: [
      { key: 'flocculation', reported: 'Low', origin: 'ai', source: 'Source IA synthétique', sourceUrl: 'https://example.invalid/flocculation',
        retrievedAt: '2026-09-28', context: 'Beer', acceptedScalarFields: ['yeastFlocculation'] }
    ] });
  it('refuse une nouvelle réponse IA qui déclare elle-même une acceptation de scalaire', () => {
    expect(yeastLookupResultError(autoMarked())).toContain('Aucune donnée appliquée');
  });
  it('neutralise un auto-marquage à l’adaptation sans attribuer sa source au scalaire historique', () => {
    const response = autoMarked();
    const normalized = adaptYeastLookupResult(response);
    expect(normalized.technicalFacts?.[0]).not.toHaveProperty('acceptedScalarFields');
    expect(normalized.technicalFacts?.[0]).toMatchObject({ reported: 'Low', origin: 'ai', sourceUrl: response.sourceUrl,
      retrievedAt: '2026-09-28', context: 'Beer' });
    const recipe = yeastFlowRecipe();
    recipe.yeast = applyYeastFacts({ name: 'Culture de test', flocculation: 'Low' }, normalized);
    const reopened = readRecipeText(writeRecipeText(recipe));
    const dossier = resolveYeastDossier(reopened!.yeast!);
    expect(dossier.flocculation.value).toEqual({ kind: 'category', value: 'Low' });
    expect(dossier.flocculation.origin).toBeUndefined();
    expect(dossier.flocculation.sourceUrl).toBeUndefined();
    expect(dossier.flocculationFact).toBeUndefined();
    expect(response.technicalFacts?.[0].acceptedScalarFields).toEqual(['yeastFlocculation']);
    expect(readYeastTechnicalFacts(response.technicalFacts)?.[0].acceptedScalarFields).toEqual(['yeastFlocculation']);
  });
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
  it('refuse une racine seule, mais conserve les racines qui identifient une ressource par query ou fragment', () => {
    const rootResult = result();
    rootResult.sourceUrl = 'https://mangrovejacks.com/';
    rootResult.technicalFacts![0].sourceUrl = rootResult.sourceUrl;
    expect(yeastLookupResultError(rootResult)).toBeDefined();

    const rootFact = result();
    rootFact.technicalFacts![0].sourceUrl = 'https://example.invalid/';
    expect(yeastLookupResultError(rootFact)).toBeDefined();

    for (const sourceUrl of ['https://example.invalid/?product=culture', 'https://example.invalid/#/products/culture']) {
      const identified = result();
      identified.sourceUrl = sourceUrl;
      identified.technicalFacts![0].sourceUrl = sourceUrl;
      expect(yeastLookupResultError(identified)).toBeUndefined();
      expect(identified.sourceUrl).toBe(sourceUrl);
      expect(identified.technicalFacts![0].sourceUrl).toBe(sourceUrl);
    }
  });
  it('accepte une fiche PDF et un constat explicite de recherche infructueuse', () => {
    const facts = result(); facts.sourceUrl = 'https://example.invalid/fiche.pdf';
    expect(yeastLookupResultError(facts)).toBeUndefined();
    expect(yeastLookupResultError({ found: false, note: 'Fiche non retrouvée.' })).toBeUndefined();
  });
});
