import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: mocks.run } }));

import { yeastLookupResultError } from '../../functions/src/yeastLookupResult';
import { readYeastTechnicalFacts } from '../../functions/src/yeastTechnicalFacts';
import { applyYeastReview, lookupYeastSheet, reviewYeastFacts } from '../../src/ui/RecipeAutoComplete';
import { withRetainedYeastFact } from '../../src/ui/YeastRecipeDossier';
import { readYeastDocumentaryView, tryAdoptYeastDocumentary } from '../../src/services/recipeDraft';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { adaptYeastLookupResult, sanitizeFacts, type IngredientFacts } from '../../src/domain/ingredientFacts';
import type { YeastSpec } from '../../src/types';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import s04Lookup from '../fixtures/public-history/yeast-lookup-fermentis.json';
import mangroveLookup from '../fixtures/public-history/yeast-lookup-mangrove.json';

afterEach(() => mocks.run.mockReset());

const dataFor = (fixture: typeof s04Lookup, requestedName: string): IngredientFacts => {
  const result = fixture.results.find(row => row.requestedName === requestedName && row.validationError === null);
  if (!result?.data) throw new Error(`Réponse sauvegardée absente : ${requestedName}`);
  return structuredClone(result.data) as IngredientFacts;
};

async function lookup(data: IngredientFacts, yeast: YeastSpec) {
  mocks.run.mockResolvedValue({ ok: true, data });
  return lookupYeastSheet(yeast);
}

function acceptIndependent(current: YeastSpec, facts: IngredientFacts) {
  const review = reviewYeastFacts(current, facts);
  const additions = review.items.filter(item => item.status === 'addition').map(item => item.id);
  const accepted = applyYeastReview(current, facts, review, new Set(additions), {}, false, true);
  return { review, ...accepted };
}

describe('lookup de levure : de la réponse sauvegardée à la fiche réouverte', () => {
  it('garde la description de floculation S-04 mot pour mot et la transporte avec pitchRate', async () => {
    const data = dataFor(s04Lookup, 'SafAle S-04');
    expect(yeastLookupResultError(data)).toBeUndefined();
    const current: YeastSpec = { name: 'SafAle S-04', hopIndexId: 'fermentis-s04' };
    const result = await lookup(data, current);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);

    const flocculation = result.facts.technicalFacts?.find(fact => fact.key === 'flocculation');
    expect(flocculation).toMatchObject({
      reported: 'High / Fast sedimentation', origin: 'ai',
      source: 'SafAle™ S-04 - Fermentis',
      sourceUrl: 'https://fermentis.com/en/product/safale-s-04/'
    });
    expect(readYeastTechnicalFacts([flocculation])?.[0].reported).toBe('High / Fast sedimentation');
    expect(result.facts.technicalFacts?.find(fact => fact.key === 'pof')).toBeUndefined();
    expect(result.facts.technicalFacts?.find(fact => fact.key === 'pitchRate')).toMatchObject({
      range: { min: 50, max: 80 }, unit: 'g/hl', qualifier: 'range',
      sourceUrl: data.sourceUrl, retrievedAt: '2026-09-25'
    });

    const { review, yeast: proposed } = acceptIndependent(current, result.facts);
    expect(review.items.find(item => item.id === 'flocculation')?.proposals[0]).toMatchObject({ text: 'High / Fast sedimentation' });
    const adoption = tryAdoptYeastDocumentary(current, proposed, { intent: 'documentary' });
    expect(adoption.accepted).toBe(true);
    if (!adoption.accepted) throw new Error(adoption.message);

    const recipe = { ...yeastFlowRecipe(), yeastDesign: undefined, yeast: adoption.yeast };
    const reopened = readRecipeText(writeRecipeText(recipe));
    expect(reopened?.yeast).toBeDefined();
    const effective = readYeastDocumentaryView(reopened!.yeast!).effectiveYeast;
    expect(effective.technicalFacts?.find(fact => fact.key === 'flocculation')).toMatchObject({
      reported: 'High / Fast sedimentation', origin: 'ai', sourceUrl: data.sourceUrl
    });
    expect(effective.technicalFacts?.find(fact => fact.key === 'pitchRate')).toMatchObject({
      range: { min: 50, max: 80 }, unit: 'g/hl', qualifier: 'range',
      sourceUrl: data.sourceUrl, retrievedAt: '2026-09-25'
    });
    expect(effective).toMatchObject({ lab: 'Fermentis', strain: 'SafAle S-04', form: 'sèche', fermTempMinC: 18, fermTempMaxC: 26 });
  });

  it('promote une floculation scalaire en observation sourcée sans inférer de catégorie', async () => {
    const data: IngredientFacts = {
      found: true, name: 'SafAle S-04', source: 'Fiche Fermentis',
      sourceUrl: 'https://fermentis.com/en/product/safale-s-04/', retrievedAt: '2026-09-27',
      flocculation: 'High / Fast sedimentation', technicalFacts: []
    };
    expect(yeastLookupResultError(data)).toBeUndefined();
    const current: YeastSpec = { name: 'SafAle S-04', hopIndexId: 'fermentis-s04' };
    const result = await lookup(data, current);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.facts.technicalFacts?.filter(fact => fact.key === 'flocculation')).toEqual([{
      key: 'flocculation', reported: 'High / Fast sedimentation', origin: 'ai', source: 'Fiche Fermentis',
      sourceUrl: data.sourceUrl, retrievedAt: data.retrievedAt
    }]);

    const { review, yeast: proposed } = acceptIndependent(current, result.facts);
    expect(review.items.find(item => item.id === 'flocculation')?.status).toBe('addition');
    const adoption = tryAdoptYeastDocumentary(current, proposed, { intent: 'documentary' });
    expect(adoption.accepted).toBe(true);
    if (!adoption.accepted) throw new Error(adoption.message);
    const effective = readYeastDocumentaryView(JSON.parse(JSON.stringify(adoption.yeast))).effectiveYeast;
    expect(effective.technicalSelections?.flocculation?.reported).toBe('High / Fast sedimentation');
    expect(effective.technicalSelections?.flocculation?.origin).toBe('ai');
  });

  it('garde le contre-exemple Mangrove Jack en anglais sans inventer de POF', async () => {
    const data = dataFor(mangroveLookup, 'M20 · Bavarian Wheat');
    expect(data.sourceUrl).toBe('https://mangrovejacks.com/products/m20-bavarian-wheat-10g');
    expect(yeastLookupResultError(data)).toBeUndefined();
    const current: YeastSpec = { name: 'M20 · Bavarian Wheat', hopIndexId: 'mangrove-m20' };
    const result = await lookup(data, current);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.facts.technicalFacts?.find(fact => fact.key === 'flocculation')).toMatchObject({ reported: 'Low', origin: 'ai' });
    expect(result.facts.technicalFacts?.find(fact => fact.key === 'pof')).toBeUndefined();
    expect(result.facts.form).toBe('sèche');
  });

  it('ne transforme pas le scalaire d’atténuation en moyenne d’une plage documentée', () => {
    const data = dataFor(mangroveLookup, 'M54 · Californian Lager');
    const normalized = sanitizeFacts(adaptYeastLookupResult(data));
    expect(data.attenuationPct).toBe(79.5);
    expect(normalized.attenuationPct).toBeUndefined();
    expect(normalized.technicalFacts?.find(fact => fact.key === 'attenuation')).toMatchObject({
      range: { min: 77, max: 82 }, unit: '%', qualifier: 'range',
      context: 'Atténuation apparente', sourceUrl: data.sourceUrl, retrievedAt: '2026-09-25'
    });
    expect(normalized.technicalFacts?.find(fact => fact.key === 'alcoholTolerance')).toMatchObject({
      range: { min: 9, max: 9 }, unit: '%', qualifier: 'upTo', context: "Tolérance maximale à l'alcool"
    });
  });

  it('distingue une page produit lisible d’une image qui ne prouve pas les faits', () => {
    const imageAttempt = s04Lookup.results.find(row => row.requestedName === 'M20 · Bavarian Wheat');
    expect(imageAttempt?.data).toBeDefined();
    const imageAnswer = structuredClone(imageAttempt!.data) as IngredientFacts;
    expect(imageAnswer.sourceUrl).toBe('https://darkrockbrewing.co.uk/wp-content/uploads/2023/06/bavarian_wheat_1.jpg');
    expect(yeastLookupResultError(imageAnswer)).toContain('Aucune donnée appliquée');
    const pageAnswer = dataFor(mangroveLookup, 'M20 · Bavarian Wheat');
    expect(yeastLookupResultError(pageAnswer)).toBeUndefined();
  });

  it('conserve les sources et la valeur personnelle après édition documentaire et réouverture', async () => {
    const data = dataFor(s04Lookup, 'SafAle S-04');
    const current: YeastSpec = { name: 'SafAle S-04', hopIndexId: 'fermentis-s04' };
    const result = await lookup(data, current);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    const { yeast: proposed } = acceptIndependent(current, result.facts);
    const adopted = tryAdoptYeastDocumentary(current, proposed, { intent: 'documentary' });
    expect(adopted.accepted).toBe(true);
    if (!adopted.accepted) throw new Error(adopted.message);
    const manualFact = {
      key: 'flocculation' as const, reported: 'Description qualitative relue', origin: 'personal' as const,
      source: 'Observation du brasseur', sourceUrl: 'https://fermentis.com/en/product/safale-s-04/',
      retrievedAt: '2026-09-27T10:00:00Z'
    };
    const edited = withRetainedYeastFact(adopted.yeast, 'flocculation', manualFact);
    const confirmed = tryAdoptYeastDocumentary(adopted.yeast, edited, { intent: 'documentary' });
    expect(confirmed.accepted).toBe(true);
    if (!confirmed.accepted) throw new Error(confirmed.message);
    const reopened = readRecipeText(writeRecipeText({ ...yeastFlowRecipe(), yeastDesign: undefined, yeast: confirmed.yeast }));
    const effective = readYeastDocumentaryView(reopened!.yeast!).effectiveYeast;
    expect(effective.technicalSelections?.flocculation).toMatchObject({
      reported: 'Description qualitative relue', origin: 'personal', source: 'Observation du brasseur'
    });
    expect(effective.technicalFacts?.find(fact => fact.key === 'flocculation' && fact.origin === 'ai')?.reported)
      .toBe('High / Fast sedimentation');
  });
});
