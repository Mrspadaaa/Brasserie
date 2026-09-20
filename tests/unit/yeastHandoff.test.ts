import { describe, expect, it } from 'vitest';
import { runBrewerTool, brewerToolDeclarations } from '../../src/domain/brewerTools';
import { projectYeastRecipe, yeastRecipeBoilOg } from '../../src/domain/yeastProjection';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { resolveFermentationYeast } from '../../src/domain/fermentationScenario';
import { applyYeastBeerTargetIntent } from '../../src/domain/yeastRecipeDesign';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { buildYeastBrewDay } from '../../src/domain/yeastBrewDay';
import { brewBitterness, brewIngredients } from '../../src/domain/brewCompanion';
import { hotBitterness } from '../../src/domain/hopBitterness';
import { prepareProposal, applyProposal, editableFields } from '../../functions/src/brewerProposals';
import { pick, STOCK_FIELDS, validateChatInput } from '../../functions/src/brewerContext';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { Recipe } from '../../src/types';

const refs = yeastReferences();
const recipe = (): Recipe => ({ id: 'handoff-test', name: 'Culture personnelle', style: 'NEIPA', volumeL: 20,
  efficiencyPct: 75, ogTarget: 1.065, fgTarget: null, abvTarget: null, totalGristKg: 5, boilMin: 60,
  fermentables: [{ name: 'Pale', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37, colorEbc: 5 }],
  hops: [{ name: 'Citra', stage: 'boil', weightG: 10, alpha: 12, timeMin: 15 },
    { name: 'Citra', stage: 'dryHop', weightG: 100, alpha: 12, dayOffset: 5 }],
  yeast: { name: 'Culture personnelle R-125', form: 'liquide', qty: .125, unit: 'L', attenuationPct: 78,
    attenuationBasis: 'recipe', pitchTempC: 19, technicalFacts: [{ key: 'temperature', reported: '18–24 °C',
      range: { min: 18, max: 24 }, unit: '°C', qualifier: 'range', origin: 'personal', source: 'Carnet de test' }] },
  mash: { steps: [{ name: 'Saccharification', tempC: 69, durationMin: 60 }] },
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 19, days: 10 },
    { name: 'Maturation', kind: 'garde', tempC: 20, days: 3, note: 'Contrôler après le dernier ajout à cru.' }],
  steps: [], notes: [] });
const context = (r = recipe()): BrewerContext => ({ recipe: r, inventory: [], material: [], waterSources: [],
  provenance: ['Recette synthétique'], now: 1770000000000, phase: 'Levure', editableTargets: ['recipe'] });
const calculate = (r: Recipe) => runBrewerTool('calculate_recipe', {}, context(r)).data as any;

describe('Levure : compagnon, copie et brassin partagent les données', () => {
  it('calcule la même DF et le même alcool sans seconde correction liée à l’empâtage', () => {
    const r = recipe(), before = structuredClone(r), result = calculate(r);
    expect(result.og).toBe(1.065);
    expect(result.fg).toBeCloseTo(1.0143, 10);
    expect(result.abv).toBeCloseTo(6.654375, 10);
    expect(result.fermentationProjection).toEqual(projectYeastRecipe(r));
    expect(r).toEqual(before);
  });
  it('transmet les plages documentées sans inventer un point central', () => {
    const r = recipe(); r.yeast = { name: 'WLP066 London Fog', hopIndexId: 'whitelabs-wlp066', form: 'liquide', qty: 125, unit: 'mL',
      technicalFacts: [{ key: 'attenuation', reported: '75–82 %', range: { min: 75, max: 82 }, unit: '%', qualifier: 'range', origin: 'personal' }] };
    const projection = projectYeastRecipe(r, { reference: resolveFermentationYeast(r, refs) }), result = calculate(r);
    expect(result.fg).toBeNull(); expect(result.abv).toBeNull();
    expect(result.fermentationProjection.fg).toEqual(projection.fg);
    expect(result.fermentationProjection.abv).toEqual(projection.abv);
  });
  it('ne transforme pas une atténuation de vin en prévision sur malt et accepte une hypothèse explicite', () => {
    const r = recipe(); r.yeast = { name: 'Champagne WLP715', attenuationPct: 80, attenuationBasis: 'declared' };
    expect(calculate(r).fg).toBeNull(); expect(calculate(r).abv).toBeNull();
    r.yeast.attenuationBasis = 'recipe'; r.yeast.attenuationPct = 60;
    expect(calculate(r).fg).toBeCloseTo(1.026, 10);
  });
  it('garde les IBU cohérents entre recette, compagnon et jour de brassage avec du sucre tardif', () => {
    const r = recipe(); r.fermentables.push({ name: 'Dextrose', kind: 'sucre', use: 'fermentation', weightKg: .25, potentialPpg: 46 });
    const boilOg = yeastRecipeBoilOg(r, { og: r.ogTarget }).og;
    const expected = hotBitterness(r.hops, r.volumeL, boilOg, r.boilMin).total;
    expect(boilOg).toBeLessThan(r.ogTarget!);
    expect(calculate(r).ibu).toBe(Math.round(expected!));
    expect(brewBitterness(captureSnapshot(r), { steps: [], currentIndex: 0 })).toEqual({ planned: Math.round(expected!), projected: Math.round(expected!) });
  });
  it('préserve la cible, les faits et 0,125 L de la copie jusqu’au guide d’ensemencement', () => {
    const source = applyYeastBeerTargetIntent(recipe(), { abv: { min: 2.5, max: 3.5 }, ibu: { min: 10, max: 20 }, finish: 'round', label: 'Session douce' }, refs);
    const copied = readRecipeText(writeRecipeText(source))!, frozen = captureSnapshot({ ...copied, id: 'copied-test' });
    expect(copied.yeast).toEqual(source.yeast); expect(frozen.yeast).toEqual(source.yeast);
    expect(frozen.yeastDesign?.beerTarget).toEqual(source.yeastDesign?.beerTarget);
    expect(frozen.fermentation).toEqual(source.fermentation);
    expect(brewIngredients(frozen).find(i => i.id === 'yeast')).toMatchObject({ planned: .125, unit: 'L' });
    const guide = buildYeastBrewDay(frozen, { steps: [], currentIndex: 0 }, 'finish', refs)!;
    expect(guide.quantity).toBe('0,125 L'); expect(guide.instructions[0].title).toContain('0,125 L');
    source.yeast.qty = 99; expect(frozen.yeast.qty).toBe(.125);
  });
  it('transmet dossier et cible au compagnon, en excluant les champs privés', () => {
    const draft = applyYeastBeerTargetIntent(recipe(), { finish: 'sweet', sparkling: true }, refs);
    const input = validateChatInput({ scope: { kind: 'draft', id: 'draft-test' }, operationId: 'test-operation-123456',
      question: 'Vérifie ma cible', editableTargets: ['recipe'], draft: { ...draft, bankAccount: 'PRIVATE' } });
    expect(input.draft.yeast).toEqual(draft.yeast); expect(input.draft.yeastDesign).toEqual(draft.yeastDesign);
    expect(input.draft).not.toHaveProperty('bankAccount');
    const stock = pick({ name: 'R-125', yeastTechnicalFacts: draft.yeast.technicalFacts, yeastNotes: 'Notice du lot',
      yeastFlocculation: 'Moyenne', yeastAlcoholTolerancePct: 12.5, privateContact: 'PRIVATE' }, STOCK_FIELDS);
    expect(stock.yeastTechnicalFacts).toEqual(draft.yeast.technicalFacts); expect(stock.yeastAlcoholTolerancePct).toBe(12.5);
    expect(stock).not.toHaveProperty('privateContact');
  });
  it('expose les outils et propose une hypothèse sans effacer le dossier ou modifier la recette', () => {
    expect(brewerToolDeclarations.map(t => t.name)).toEqual(expect.arrayContaining(['calculate_recipe', 'fermentation_advice', 'lookup_yeast_reference']));
    const c = context(), before = structuredClone(c);
    expect(editableFields(c, 'recipe')['yeast.attenuationBasis']).toBeDefined();
    const proposal = prepareProposal(c, { target: 'recipe', title: 'Essai de moût', changes: [
      { path: 'yeast.attenuationPct', valueJson: '75', reason: 'Hypothèse demandée' },
      { path: 'yeast.attenuationBasis', valueJson: '"recipe"', reason: 'Hypothèse, pas mesure' }
    ] });
    const applied = applyProposal(c, proposal, proposal.changes.map(ch => ch.id));
    expect(applied.yeast.attenuationPct).toBe(75); expect(applied.yeast.technicalFacts).toEqual(c.recipe.yeast.technicalFacts);
    expect(c).toEqual(before);
  });
});
