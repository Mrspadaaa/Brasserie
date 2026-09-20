import { describe, expect, it } from 'vitest';
import { readYeastTechnicalFacts, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { applyYeastFacts, factsForStock, factsFromStock, ingredientGaps, sanitizeFacts, yeastFactChanges } from '../../src/domain/ingredientFacts';
import { normalizeRecipe, captureSnapshot, yeastFromLegacy } from '../../src/domain/recipeSnapshot';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { normalizeRecipeImport } from '../../src/domain/recipeImport';
import { completeFromStockReferences } from '../../src/domain/localStockFacts';
import { readYeastRecipeDesign, yeastRecipeDesignChanged } from '../../src/domain/yeastRecipeDesign';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { StockItem, YeastSpec } from '../../src/types';

const range: YeastTechnicalFact = { key: 'attenuation', reported: '77,25–82,75 %', range: { min: 77.25, max: 82.75 },
  unit: '%', qualifier: 'range', origin: 'ai', source: 'Fiche R-125', sourceUrl: 'https://example.com/r-125',
  retrievedAt: '2026-09-20', context: 'Moût de contrôle à 20 °C ; dépend du brassin.' };
const liquid: YeastSpec = { name: 'Culture rare R-125', lab: 'Micro labo', strain: 'R-125', qty: 125,
  unit: 'mL', pitchTempC: 20, attenuationPct: 78, attenuationBasis: 'recipe', fermTempMinC: 18,
  fermTempMaxC: 24, notes: 'Essai personnel', technicalFacts: [range] };

describe('Faits de levure transportables et données partielles', () => {
  it('préserve la levure structurée sans forme au lieu de la convertir en sachet sec', () => {
    const recipe = { ...fullRecipe, yeast: liquid };
    expect(normalizeRecipe(recipe).yeast).toEqual(liquid);
    expect(captureSnapshot(recipe).yeast).toEqual(liquid);
    expect(captureSnapshot(recipe).yeast).not.toBe(liquid);
  });
  it('ne déduit aucune forme ou quantité d’un simple nom ancien', () => {
    expect(yeastFromLegacy('Labo rare R-125')).toEqual({ name: 'Labo rare R-125', lab: undefined });
    expect(yeastFromLegacy('White Labs R-125 (125 mL)')).toMatchObject({ qty: 125, unit: 'mL' });
    expect(yeastFromLegacy('White Labs R-125 (125 mL)')?.form).toBeUndefined();
    expect(yeastFromLegacy('R-125 (culture expérimentale)')?.name).toBe('R-125 (culture expérimentale)');
    expect(yeastFromLegacy('R-125 (125,5 mL)')).toMatchObject({ qty: 125.5, unit: 'mL' });
  });
  it('convertit uniquement les anciennes clés, sans perdre les données modernes ajoutées', () => {
    const legacy = { ...liquid, qty: '125 mL', pitchTemp: 21 };
    delete legacy.pitchTempC;
    expect(normalizeRecipe({ ...fullRecipe, yeast: legacy as unknown as YeastSpec }).yeast)
      .toEqual({ ...liquid, pitchTempC: 21 });
  });
  it('conserve plage, contexte, origine et unités sans arrondi pendant un export/import', () => {
    const yeast = { ...liquid, form: 'liquide' as const, flocculation: 'Moyenne à forte', alcoholTolerancePct: 12.5,
      technicalSource: 'Notice lot 231', technicalFacts: [range,
        { key: 'alcoholTolerance' as const, reported: 'jusqu’à 12,5 %', range: { min: 12.5, max: 12.5 }, unit: '%', qualifier: 'upTo' as const, origin: 'manufacturer' as const }] };
    const source = { ...fullRecipe, yeast };
    const parsed = readRecipeText(writeRecipeText(source));
    expect(parsed?.yeast).toEqual(yeast);
    expect(normalizeRecipeImport(parsed, 'local', true).yeast).toEqual(yeast);
  });
  it('conserve aussi l’absence de forme dans le transfert', () => {
    expect(readRecipeText(writeRecipeText({ ...fullRecipe, yeast: liquid }))?.yeast).toEqual(liquid);
  });
  it('conserve la conduite v2, les cultures et les hypothèses cellulaires dans la copie', () => {
    const recipe = { ...fullRecipe, yeast: { ...liquid, stockItemRef: 'local-yeast' },
      hops: fullRecipe.hops.map(h => ({ ...h, stockItemRef: 'local-hop', hopVarietyId: 'local-index' })) };
    const snapshot = { modelVersion: 'yeast-recipe-2' as const, yeastId: '', styleId: 'sour' as const, goal: 'balanced' as const,
      ferulicRest: false, process: 'preacidified' as const, cultureRoles: [{ name: liquid.name, role: 'alcoholic' as const }],
      pitchRateMillionPerMlPlato: 0.9, viableCellsBillion: 184.25,
      applied: { yeast: recipe.yeast, volumeL: recipe.volumeL, fermentation: recipe.fermentation ?? [],
        mashSteps: recipe.mash?.steps ?? [], hops: recipe.hops, style: recipe.style } };
    const parsed = readRecipeText(writeRecipeText({ ...recipe, yeastDesign: snapshot }));
    expect(parsed?.yeastDesign).toMatchObject({ process: 'preacidified', cultureRoles: snapshot.cultureRoles,
      pitchRateMillionPerMlPlato: 0.9, viableCellsBillion: 184.25 });
    expect(parsed?.yeastDesign?.applied.hops?.[0].stockItemRef).toBeUndefined();
    expect(parsed?.yeastDesign?.applied.hops?.[0].hopVarietyId).toBeUndefined();
    expect(yeastRecipeDesignChanged(parsed!, readYeastRecipeDesign(parsed!)!)).toBe(false);
  });
  it('refuse les bornes incohérentes, les bornes unilatérales ambiguës et les liens dangereux', () => {
    expect(readYeastTechnicalFacts([{ ...range, range: { min: 80, max: 70 } }])).toBeUndefined();
    expect(readYeastTechnicalFacts([{ ...range, qualifier: 'upTo' }])).toBeUndefined();
    expect(readYeastTechnicalFacts([{ ...range, sourceUrl: 'javascript:alert(1)' }])).toBeUndefined();
    expect(readYeastTechnicalFacts([range])).toEqual([range]);
    expect(() => normalizeRecipeImport({ yeast: { ...liquid, technicalFacts: [{ ...range, unit: undefined }] } }, 'local', true)).toThrow(/Faits de levure/);
  });
});

describe('Acceptation et réutilisation des faits de levure', () => {
  const found = { found: true, name: liquid.name, source: 'Fiche R-125', form: 'liquide' as const,
    flocculation: 'Moyenne', alcoholTolerancePct: 12.5, technicalFacts: [range], note: 'Température contrôlée lors des essais.' };
  it('complète une levure rare liquide sans quantité ni atténuation inventée', () => {
    const result = applyYeastFacts({ name: liquid.name }, found);
    expect(result).toMatchObject({ form: 'liquide', flocculation: 'Moyenne', alcoholTolerancePct: 12.5,
      notes: found.note, technicalSource: found.source });
    expect(result.qty).toBeUndefined();
    expect(result.unit).toBeUndefined();
    expect(result.attenuationPct).toBeUndefined();
    expect(result.technicalFacts).toContainEqual(range);
  });
  it('préserve les hypothèses manuelles et ne remplace qu’un conflit explicitement choisi', () => {
    const source = { ...found, technicalFacts: undefined, attenuationPct: 81, form: 'liquide' as const };
    const manual = { ...liquid, form: 'sèche' as const };
    expect(yeastFactChanges(manual, source).find(c => c.field === 'form')).toMatchObject({ current: 'sèche', proposed: 'liquide', conflict: true });
    expect(applyYeastFacts(manual, source)).toMatchObject({ form: 'sèche', attenuationPct: 78, attenuationBasis: 'recipe', notes: liquid.notes });
    expect(applyYeastFacts(manual, source, ['form'])).toMatchObject({ form: 'liquide', qty: 125, unit: 'mL', attenuationPct: 78, attenuationBasis: 'recipe' });
    expect(applyYeastFacts(manual, source, ['attenuationPct'])).toMatchObject({ attenuationPct: 81, attenuationBasis: 'declared' });
  });
  it('ne considère pas une plage publiée comme une valeur ponctuelle manquante', () => {
    const yeast = applyYeastFacts({ name: liquid.name, lab: 'Micro labo', fermTempMinC: 18, fermTempMaxC: 24 }, found);
    expect(ingredientGaps([], [], yeast)).toEqual([]);
    expect(sanitizeFacts({ ...found, attenuationPct: NaN }).attenuationPct).toBeUndefined();
    expect(sanitizeFacts({ ...found, attenuationPct: 80 }).attenuationPct).toBeUndefined();
  });
  it('ne transforme pas une borne unilatérale en une plage complète', () => {
    const partial: YeastSpec = { name: liquid.name, lab: 'Micro labo', technicalFacts: [
      { ...range, reported: 'au moins 77,25 %', range: { min: 77.25, max: 77.25 }, qualifier: 'atLeast' },
      { key: 'temperature', reported: 'au moins 18 °C', range: { min: 18, max: 18 }, unit: '°C', qualifier: 'atLeast', origin: 'ai' }
    ] };
    expect(ingredientGaps([], [], partial)[0].missing).toEqual(['atténuation', 'température maximale']);
  });
  it('fait suivre les mêmes observations de l’acceptation au stock puis à une autre recette', () => {
    const fields = factsForStock('levure', found);
    const stock = { id: 'rare', ref: 'rare', name: liquid.name, category: 'Levure', unit: 'mL', currentStock: 250,
      minStock: 0, reorder: false, ...fields } satisfies StockItem;
    const stored = factsFromStock(JSON.parse(JSON.stringify(stock)));
    const reused = completeFromStockReferences([], [], { name: liquid.name, qty: 125, unit: 'mL' }, [stock]).yeast;
    expect(stored).toMatchObject({ technicalFacts: expect.arrayContaining([range]), form: 'liquide', flocculation: 'Moyenne', alcoholTolerancePct: 12.5, note: found.note });
    expect(reused).toMatchObject({ form: 'liquide', qty: 125, unit: 'mL', technicalFacts: expect.arrayContaining([range]) });
    expect(applyYeastFacts(reused, stored).technicalFacts).toEqual(reused.technicalFacts);
  });
});
