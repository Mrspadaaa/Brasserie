import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/hopScientific/test-houb.json';
import manufacturer from '../../src/data/hopManufacturerBootstrap.json';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import publicLots from '../../src/data/hopPublicLotBootstrap.json';
import { captureHopRecipePrediction } from '../../src/domain/hopIndex/snapshots';
import { prepareHopRecipeInput } from '../../src/domain/hopIndex/recipePrediction';
import { guidePredictionKnowledge, guideYeasts } from '../../src/ui/hopIndex/guideData';
import { assertHopPredictionSnapshot } from '../../functions/src/hopPredictionValidation';
import { parseBackup } from '../../functions/src/backupCore';
import { predictHopRecipe } from '../../functions/src/hopRecipePrediction';
import { compareHopTasting } from '../../functions/src/hopPredictionCore';
import { runBrewerTool } from '../../src/domain/brewerTools';
import type { Recipe } from '../../src/types';
import type { HopLot, HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopAxis, HopTasting, HopKnowledge, HopPredictionSnapshot, HopYeast } from '../../functions/src/hopPredictionSchema';

const make = () => {
  const data = structuredClone({ varieties: manufacturer.hopVarieties as HopVariety[], lots: [], knowledge: guidePredictionKnowledge(catalogue.filter(k => k.id === 'lalbrew-diamond') as HopKnowledge[]) });
  const { input } = prepareHopRecipeInput(fixture as Recipe, data.varieties, guideYeasts([]));
  return { data, input, saved: captureHopRecipePrediction(input, {}, data, { id: 'whole-recipe', name: 'Programme Test houb', createdAt: '2026-09-09T10:00:00Z' }) };
};

const backupJson = (saved: HopPredictionSnapshot) => JSON.stringify({ schemaVersion: 3, source: 'device',
  exportedAt: saved.createdAt, collections: { hopPredictions: [{ id: saved.id, data: saved }] } });
describe('Programme figé autonome et rejouable', () => {
  it('importe et rejoue la v2 avec ses anciens diagnostics, sans la réétiqueter v3', () => {
    const { data, input, saved } = make();
    input.fermentation.push({ kind: 'ajout', name: 'Sucre', tempC: 19, days: 0 });
    const { additions, ...legacy } = predictHopRecipe(input, {}, saved.evidence, 'hop-recipe-experimental-v2');
    saved.prediction = additions[0]; saved.recipePrediction = legacy;
    expect(parseBackup(backupJson(saved)).collections.hopPredictions![0].data).toEqual(JSON.parse(JSON.stringify(saved)));
    expect(predictHopRecipe(input, {}, data).overall).toEqual(legacy.overall);
    saved.recipePrediction.engineVersion = 'hop-recipe-experimental-v3';
    expect(() => assertHopPredictionSnapshot(saved)).toThrow();
  });
  it('rejoue la v1 conservée avec ses anciennes bornes et refuse de la réétiqueter v2', () => {
    const { data, input } = make();
    input.additions = input.additions.slice(0, 1);
    input.additions[0].triplet.doseGL = null;
    input.additions[0].triplet.contactHours = 1;
    input.additions[0].triplet.temperatureC = 100;
    const saved = captureHopRecipePrediction(input, {}, data, { id: 'legacy-v1', name: 'Archive de calcul v1', createdAt: '2026-09-09T10:00:00Z' });
    const { additions, ...legacy } = predictHopRecipe(input, {}, saved.evidence, 'hop-recipe-experimental-v1');
    expect(legacy.overall.profile.citrus.range!.max).toBeGreaterThan(saved.recipePrediction!.overall.profile.citrus.range!.max);
    saved.prediction = additions[0]; saved.recipePrediction = legacy;
    expect(parseBackup(backupJson(saved)).collections.hopPredictions![0].data).toEqual(JSON.parse(JSON.stringify(saved)));
    saved.recipePrediction.engineVersion = 'hop-recipe-experimental-v2';
    expect(() => assertHopPredictionSnapshot(saved)).toThrow();
  });
  it('garde un véritable contexte global et une ancre du premier ajout explicitement distincte', () => {
    const { data, input, saved } = make();
    const { additions, ...programme } = predictHopRecipe(input, {}, data);
    expect(saved.recipePrediction).toEqual(programme);
    expect(saved.prediction).toEqual(additions[0]);
    expect(saved.recipePrediction!.overall).not.toHaveProperty('triplet');
    expect(() => assertHopPredictionSnapshot(JSON.parse(JSON.stringify(saved)))).not.toThrow();
    const serialized = JSON.stringify(saved);
    expect(serialized.length).toBeLessThan(700_000);
    expect(parseBackup(backupJson(saved)).collections.hopPredictions![0].data).toEqual(JSON.parse(serialized));
    // Firestore document headroom: no copy of the thousands of unrelated yeast cards.
    expect(new TextEncoder().encode(JSON.stringify(saved)).length).toBeLessThan(800_000);
    const before = JSON.stringify(saved);
    const model = data.knowledge.find(k => k.kind === 'extrapolation');
    if (model?.kind === 'extrapolation') model.gain.central = model.gain.range.min;
    expect(JSON.stringify(saved)).toBe(before);
    expect(() => assertHopPredictionSnapshot(saved)).not.toThrow();
  });

  it('importe un programme de vingt ajouts avec dix COA publics partiels sans dépasser la limite du document', () => {
    const lots = publicLots.hopLots as HopLot[];
    expect(lots).toHaveLength(10);
    const data = { varieties: [...manufacturer.hopVarieties, ...publicLots.hopVarieties] as HopVariety[], lots,
      knowledge: guidePredictionKnowledge(catalogue.filter(k => k.id === 'lalbrew-diamond') as HopKnowledge[]) };
    const recipe = { ...structuredClone(fixture), hops: Array.from({ length: 20 }, (_, i) => {
      const lot = lots[i % lots.length];
      return { name: lot.name, hopVarietyId: lot.varietyId, hopLotId: lot.id, stage: 'dryHop',
        aromaTiming: 'postFermentation', dayOffset: 7 + Math.floor(i / lots.length), weightG: 4.8,
        alpha: 0, aromaContactHours: 24, aromaTemperatureC: 15 };
    }) } as Recipe;
    const { input } = prepareHopRecipeInput(recipe, data.varieties, guideYeasts(data.knowledge));
    const saved = captureHopRecipePrediction(input, {}, data, { id: 'twenty-public-coas', name: 'Vingt ajouts — contrôle logiciel', createdAt: '2026-09-09T10:00:00Z' });
    const serialized = JSON.stringify(saved);
    expect(saved.recipePrediction!.input.additions).toHaveLength(20);
    expect(saved.evidence.lots).toHaveLength(10);
    expect(saved.evidence.varieties.length).toBeGreaterThan(1);
    expect(saved.evidence.lots).toEqual(lots);
    expect(Object.values(saved.recipePrediction!.chemistry.introduced).some(amount => amount.range === null && amount.coverage.knownAdditions < amount.coverage.totalAdditions)).toBe(true);
    // Backup checks characters; Firestore checks bytes. Keep explicit headroom for both.
    expect(serialized.length).toBeLessThan(700_000);
    expect(new TextEncoder().encode(serialized).length).toBeLessThan(1_000_000);
    const restored = parseBackup(backupJson(saved)).collections.hopPredictions![0].data;
    expect(restored).toEqual(JSON.parse(serialized));
    expect(() => assertHopPredictionSnapshot(restored)).not.toThrow();
  });

  it.each(['identical', 'conflicting', 'qualified'] as const)('fige et rejoue le repli des températures fabricant : %s', mode => {
    const { data, input } = make();
    expect(data.knowledge.some(k => k.kind === 'fermentation' && k.yeastId === input.yeastId)).toBe(false);
    const yeast = data.knowledge.find(k => k.kind === 'yeast' && k.id === input.yeastId) as HopYeast;
    const temperature = yeast.catalogue!.facts.find(f => f.key === 'temperature')!;
    if (mode === 'identical') yeast.catalogue!.facts.push(structuredClone(temperature));
    if (mode === 'conflicting') yeast.catalogue!.facts.push({ ...structuredClone(temperature), reported: 'Autre plage — contrôle logiciel', range: { min: 18, max: 22 } });
    if (mode === 'qualified') for (const fact of yeast.catalogue!.facts.filter(f => f.key === 'temperature')) {
      fact.range = { min: 15, max: 15 }; fact.qualifier = 'upTo'; fact.reported = 'Jusqu’à 15 °C — contrôle logiciel';
    }
    const saved = captureHopRecipePrediction(input, {}, data, { id: 'temperature-' + mode, name: 'Conduite figée — contrôle logiciel', createdAt: '2026-09-09T10:00:00Z' });
    const warnings = saved.recipePrediction!.warnings.join(' ');
    if (mode === 'identical') expect(warnings).toContain('19 °C, hors de la fenêtre fabricant (10–15 °C)');
    else {
      expect(warnings).toContain('sources non concordantes');
      expect(warnings).not.toContain('fenêtre fabricant 10–22');
      expect(warnings).not.toContain('fenêtre fabricant 15–15');
    }
    expect(warnings).not.toContain('Froid court :');
    const restored = parseBackup(backupJson(saved)).collections.hopPredictions![0].data;
    expect(restored.recipePrediction.warnings).toEqual(saved.recipePrediction!.warnings);
  });
  it.each(['dose', 'temperature', 'central', 'unit', 'coverage', 'reason', 'context', 'first-addition', 'source', 'extra-field'])('rejette avant import une altération : %s', change => {
    const saved = JSON.parse(JSON.stringify(make().saved)), p = saved.recipePrediction;
    if (change === 'dose') p.input.additions[0].triplet.doseGL = 20;
    if (change === 'temperature') p.input.fermentation[0].tempC = 12;
    if (change === 'central') p.overall.profile.citrus.central = 50;
    if (change === 'unit') Object.values<any>(p.chemistry.introduced)[0].unit = 'ngL';
    if (change === 'coverage') Object.values<any>(p.chemistry.introduced)[0].coverage.knownAdditions = 100;
    if (change === 'reason') p.overall.reasons.push('Essai indépendant validé');
    if (change === 'context') p.input.additions[1].triplet.yeastId = 'fermentis-us05';
    if (change === 'first-addition') saved.prediction.triplet = p.input.additions[1].triplet;
    if (change === 'source') p.overall.profile.citrus.sources[0].reference = 'Inventé';
    if (change === 'extra-field') p.chemistry.final.unproven = { range: { min: 2, max: 3 }, unit: 'ngL' };
    const json = JSON.stringify({ schemaVersion: 3, source: 'test', exportedAt: saved.createdAt, collections: { hopPredictions: [{ id: saved.id, data: saved }] } });
    expect(() => parseBackup(json)).toThrow();
  });
  it('une dégustation associée compare le profil global dans le compagnon', () => {
    const { data, saved } = make(), axes = saved.evidence.knowledge.filter((k): k is HopAxis => k.kind === 'axis');
    const tasting: HopTasting = { id: 't', name: 'Bière', date: '2026-09-09', origin: 'commercial', notes: '', predictionId: saved.id, triplet: null, tripletSource: null,
      axes: axes.map(axis => ({ axis, perceived: { min: 0, max: 10 }, confidence: 'low' })) };
    const context: any = { now: 0, inventory: [], material: [], waterSources: [], provenance: [], phase: 'test', hopIndex: { ...data, truncated: [], predictions: [saved], tastings: [tasting] } };
    expect(runBrewerTool('compare_hop_tasting', { tastingId: 't' }, context).data).toEqual(compareHopTasting(tasting, saved.recipePrediction!.overall, axes));
  });
});
