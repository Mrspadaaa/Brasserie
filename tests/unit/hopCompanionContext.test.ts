import { describe, expect, it } from 'vitest';
import { publicHopData } from '../fixtures/hopPublicPacks';
import { recipe } from '../fixtures/brewCompanion';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { brewerContextForPrompt, brewerContextForStorage } from '../../functions/src/hopCompanionContext';
import { cleanContext } from '../../functions/src/brewerContext';
import { prepareProposal, applyProposal } from '../../functions/src/brewerProposals';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { predictHopTriplet } from '../../functions/src/hopPredictionCore';
import study from '../../src/data/hopStudies/lafontaine2018.cascade2015.json';
import extrapolation from '../../src/data/hopExtrapolationBootstrap.json';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopRecipeCompanionEvidence } from '../../src/domain/hopIndex/companionPrediction';

const context = (): BrewerContext => ({ recipe: recipe(), now: 1788825600000, phase: 'Planification', provenance: [], inventory: [], material: [], waterSources: [], editableTargets: ['recipe'],
  hopIndex: { ...publicHopData(), predictions: [], tastings: [], truncated: [] } });

describe('Compagnon avec tous les catalogues publics, sans appel IA', () => {
  it('sans triplets explicites, simule la recette réelle avec reconnaissance, journal et événements distincts', () => {
    const c = context();
    c.hopIndex!.knowledge.push(extrapolation[0] as HopExtrapolation);
    c.hopIndex!.truncated.push('lots non chargés');
    c.recipe = recipe({ hops: [
      { name: 'Cascade', weightG: 20, alpha: 6, stage: 'dryHop', aromaTiming: 'postFermentation', aromaContactHours: 24, aromaTemperatureC: 18, dayOffset: 7 },
      { name: 'Cascade', weightG: 30, alpha: 6, stage: 'dryHop', aromaTiming: 'postFermentation', aromaContactHours: 48, aromaTemperatureC: 18, dayOffset: 12 }
    ], fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 7 }] });
    c.journal = { additions: { 'hop-0': { amount: 80 } } };
    const before = structuredClone(c), result = runBrewerTool('predict_hop_aroma', { target: [{ axisId: 'citrus', min: 40, max: 70 }] }, c);
    const output = result.data as HopRecipeCompanionEvidence;
    expect(output.engineVersion).toBe('hop-recipe-experimental-v1'); expect(output.overall).not.toHaveProperty('triplet');
    expect(output.input.yeastId).toBe('fermentis-us05'); expect(output.input.additions.map(a => a.triplet.varietyId)).toEqual(['hopsteiner-cas', 'hopsteiner-cas']);
    expect(output.input.additions.map(a => a.triplet.doseGL)).toEqual([4, 1.5]); expect(output.input.additions.map(a => a.dayOffset)).toEqual([7, 12]);
    expect(output.input.fermentation).toEqual(c.recipe.fermentation);
    expect(output.overall.conditionalEnvelope).toBe(true); expect(output.overall.interactionsNonQuantifiees).toBe(true);
    expect(output.additions).toHaveLength(2); expect(output.overall.profile.citrus.range).not.toBeNull();
    expect(result.facts.join(' ')).toContain('Souche reconnue'); expect(result.limits.join(' ')).toContain('Catalogue partiel');
    expect(result.limits.join(' ')).toContain('aucun taux de couverture statistique'); expect(c).toEqual(before);
  });
  it('les alternatives explicites restent indépendantes de la souche et des ajouts de recette', () => {
    const c = context(), base = { varietyId: study.protocol.varietyId, timing: 'postFermentation' as const, doseGL: 3.86, temperatureC: 14, contactHours: 24, matrixId: study.protocol.matrixId };
    const triplets = [{ ...base, yeastId: 'fermentis-us05' }, { ...base, yeastId: 'uncharacterized' }];
    const result = runBrewerTool('predict_hop_aroma', { triplets }, c);
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as any[]).map(p => p.triplet.yeastId).sort()).toEqual(['fermentis-us05', 'uncharacterized']);
    expect(result.limits.join(' ')).toContain('Alternatives indépendantes');
  });
  it('garde la matière complète dans les outils et un aperçu compact dans les prompts', () => {
    const c = context(), before = JSON.stringify(c.hopIndex), prompt = brewerContextForPrompt(c);
    expect(prompt.hopIndex!.catalogue.references).toBe(766);
    expect(prompt.hopIndex!.varieties).toHaveLength(7);
    expect(prompt.hopIndex!.lots.every(l => l.referenceOnly)).toBe(true);
    expect(prompt.hopIndex!.varieties[0]).not.toHaveProperty('analysis');
    expect(prompt.hopIndex!.knowledge.some(k => k.kind === 'note')).toBe(true);
    expect(JSON.stringify(prompt).length).toBeLessThan(JSON.stringify(c).length / 10);
    const found = runBrewerTool('lookup_hop_reference', { query: 'Citra' }, c).data as any;
    expect(found.varieties.length).toBeGreaterThanOrEqual(3);
    expect(found.varieties.every((v: any) => v.analysis.length && v.analysis.every((m: any) => m.source.reference))).toBe(true);
    expect(JSON.stringify(c.hopIndex)).toBe(before);
    const triplet = { varietyId: study.protocol.varietyId, yeastId: study.protocol.yeastId, timing: 'postFermentation' as const, doseGL: 3.86, temperatureC: 14, contactHours: 24, matrixId: study.protocol.matrixId };
    const target = { 'citrus-lafontaine': { min: 5, max: 10 } };
    const toolResult = runBrewerTool('predict_hop_aroma', { triplets: [triplet], target: [{ axisId: 'citrus-lafontaine', min: 5, max: 10 }] }, c).data as any[];
    expect(toolResult[0]).toEqual(predictHopTriplet(triplet, target, c.hopIndex!));
  });
  it('rejoue une proposition avec seulement ses identités utiles, sous la limite de stockage', () => {
    const c = context(), citra = c.hopIndex!.varieties.find(v => v.id === 'beermaverick-citra')!;
    const proposal = prepareProposal(c, { target: 'recipe', title: 'Associer la source choisie', changes: [{ path: 'hops.0.hopVarietyId', valueJson: JSON.stringify(citra.id), reason: 'Référence Citra sélectionnée' }] });
    const compact = cleanContext(brewerContextForStorage(c, proposal));
    expect(compact.hopIndex.varieties.map((v: any) => v.id)).toEqual([citra.id]);
    expect(compact.hopIndex.varieties[0].analysis).toEqual([]);
    expect(Buffer.byteLength(JSON.stringify(compact), 'utf8')).toBeLessThan(650_000);
    expect(applyProposal(compact, proposal, proposal.changes.map(ch => ch.id)).hops[0].hopVarietyId).toBe(citra.id);
  });
  it('retrouve un lot par région et récolte sans attribuer cette région à toute la variété', () => {
    const c = context();
    c.hopIndex!.lots.push({ id: 'lot-test-region', varietyId: 'beermaverick-citra', name: 'Lot de test', form: 'pelletT90', harvestYear: 2025, growingRegion: 'Vallée témoin', analysis: [] });
    const found = runBrewerTool('lookup_hop_reference', { query: 'vallee 2025' }, c).data as any;
    expect(found.lots.map((l: any) => l.id)).toEqual(['lot-test-region']);
    expect(found.varieties[0].origin).toBe('United States of America (USA)');
  });
});
