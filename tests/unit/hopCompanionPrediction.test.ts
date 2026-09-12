import { describe, expect, it } from 'vitest';
import { compactHopRecipeEvidence } from '../../src/domain/hopIndex/companionPrediction';
import { prepareHopRecipeInput } from '../../src/domain/hopIndex/recipePrediction';
import { predictHopRecipe, type HopRecipePrediction } from '../../functions/src/hopRecipePrediction';
import { cleanContext } from '../../functions/src/brewerContext';
import { runBrewerTool } from '../../src/domain/brewerTools';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { Recipe } from '../../src/types';
import fixture from '../fixtures/hopScientific/test-houb.json';
import manufacturer from '../../src/data/hopManufacturerBootstrap.json';
import publicLots from '../../src/data/hopPublicLotBootstrap.json';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import conventions from '../../src/data/hopKnowledgeBootstrap.json';
import extrapolation from '../../src/data/hopExtrapolationBootstrap.json';
import dose from '../../src/data/hopDoseStudyBootstrap.json';

const data = (): HopEngineData => structuredClone({ varieties: [...manufacturer.hopVarieties, ...publicLots.hopVarieties], lots: publicLots.hopLots,
  knowledge: [...conventions, ...catalogue.filter(k => k.id === 'lalbrew-diamond'), ...extrapolation, ...dose] }) as HopEngineData;
const predict = (recipe: Recipe, d: HopEngineData): HopRecipePrediction => predictHopRecipe(prepareHopRecipeInput(recipe, d.varieties,
  d.knowledge.filter((k): k is HopYeast => k.kind === 'yeast')).input, {}, d);

describe('Preuve du compagnon compacte, sans perte scientifique', () => {
  it('reconstruit exactement chaque source, raison et chiffre du programme complet', () => {
    const raw = predict(fixture as Recipe, data()), before = structuredClone(raw), compact = compactHopRecipeEvidence(raw);
    const { sourceDictionary, sourceSets, reasonSets, ...body } = compact;
    const expand = (value: any): any => {
      if (Array.isArray(value)) return value.map(expand);
      if (!value || typeof value !== 'object') return value;
      if (value.sourceRef) { expect(sourceDictionary[value.sourceRef]).toBeDefined(); return sourceDictionary[value.sourceRef]; }
      if (value.sourceSetRef) {
        expect(sourceSets[value.sourceSetRef]).toBeDefined();
        return sourceSets[value.sourceSetRef].map(id => { expect(sourceDictionary[id]).toBeDefined(); return sourceDictionary[id]; });
      }
      if (value.reasonSetRef) { expect(reasonSets[value.reasonSetRef]).toBeDefined(); return reasonSets[value.reasonSetRef]; }
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, expand(entry)]));
    };
    expect(expand(body)).toEqual(raw); expect(raw).toEqual(before);
    expect(Object.values(sourceDictionary).some(s => s.kind === 'judgment')).toBe(true);
    Object.values(sourceDictionary)[0].reference = 'Copie de transport modifiée';
    expect(raw).toEqual(before);
  });
  it('garde vingt ajouts et dix COA publics sous le budget de conversation sans tronquer le résultat', () => {
    const d = data(), recipe = { ...structuredClone(fixture), hops: Array.from({ length: 20 }, (_, i) => {
      const lot = publicLots.hopLots[i % publicLots.hopLots.length];
      return { name: lot.name, hopVarietyId: lot.varietyId, hopLotId: lot.id, stage: 'dryHop', aromaTiming: 'postFermentation',
        dayOffset: 7 + Math.floor(i / publicLots.hopLots.length), weightG: 4.8, alpha: 0, aromaContactHours: 24, aromaTemperatureC: 15 };
    }) } as Recipe;
    const c: BrewerContext = { recipe, now: 0, phase: 'Test logiciel', provenance: [], inventory: [], material: [], waterSources: [],
      hopIndex: { ...d, predictions: [], tastings: [], truncated: [] } };
    const result = runBrewerTool('predict_hop_aroma', {}, c), output = result.data as ReturnType<typeof compactHopRecipeEvidence>;
    expect(output.additions).toHaveLength(20); expect(output.input.additions).toHaveLength(20);
    expect(output.overall.conditionalEnvelope).toBe(true); expect(result.limits.join(' ')).toContain('reasonSetRef');
    expect(() => cleanContext({ evidence: [result] })).not.toThrow();
    // App storage budget, never a chemistry coefficient: leave room in the 650 kB turn for advice and other evidence.
    expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThan(400_000);
  });
});
