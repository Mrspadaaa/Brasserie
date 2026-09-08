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

const context = (): BrewerContext => ({ recipe: recipe(), now: 1788825600000, phase: 'Planification', provenance: [], inventory: [], material: [], waterSources: [], editableTargets: ['recipe'],
  hopIndex: { ...publicHopData(), predictions: [], tastings: [], truncated: [] } });

describe('Compagnon avec tous les catalogues publics, sans appel IA', () => {
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
