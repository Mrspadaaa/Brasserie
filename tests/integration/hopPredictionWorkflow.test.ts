import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testHopAxis, testHopData, testHopTriplet } from '../fixtures/hopPrediction';
import { captureHopPrediction } from '../../src/domain/hopIndex/snapshots';
import { compareHopTasting, predictHopTriplet } from '../../functions/src/hopPredictionCore';
import { assertHopKnowledge, assertHopTasting, HopTasting, HopPredictionSnapshot } from '../../functions/src/hopPredictionSchema';
import { assertHopPredictionSnapshot } from '../../functions/src/hopPredictionValidation';
import { parseBackup } from '../../functions/src/backupCore';
import bootstrap from '../../src/data/hopKnowledgeBootstrap.json';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { hopTestSource } from '../fixtures/hopIndex';
const memory = vi.hoisted(() => ({ docs: new Map<string, any>(), writes: vi.fn() }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...memory.docs.entries()].filter(([key]) => key.startsWith(name + '/')).map(([key, value]) => ({ ...structuredClone(value), __docId: key.split('/')[1] })),
  put: (name: string, id: string, value: any) => { memory.writes(name, id, value); memory.docs.set(`${name}/${id}`, structuredClone(value)); },
  bulkWrite: async (entries: any[]) => { for (const { name, id, data } of entries) { memory.writes(name, id, data); memory.docs.set(`${name}/${id}`, structuredClone(data)); } }
} }));
import { StorageService } from '../../src/services/storage';
beforeEach(() => { memory.docs.clear(); memory.writes.mockClear(); });
const target = { citrus: { min: 7, max: 8 } };
const snapshot = () => captureHopPrediction({ ...testHopTriplet, lotId: 'test-lot' }, target, testHopData(), { id: 'prediction-test', name: 'Témoin avant brassage', recipeId: 'recipe-test', batchId: 'batch-test', createdAt: '2026-09-08T10:00:00.000Z' });
const tasting = (): HopTasting => ({ id: 'tasting-test', name: 'Dégustation témoin', origin: 'batch', batchId: 'batch-test', date: '2026-09-09', notes: '', predictionId: 'prediction-test', triplet: null, tripletSource: null,
  axes: [{ axis: structuredClone(testHopAxis), perceived: { min: 4, max: 7 }, confidence: 'low' }] });
describe('Parcours persistant du triplet à la dégustation', () => {
  it('versionne le nouveau calcul sans réécrire les instantanés v1 valides', () => {
    const current = snapshot(); expect(current.engineVersion).toBe('hop-envelope-v2');
    const historical = { ...structuredClone(current), engineVersion: 'hop-envelope-v1' as const };
    historical.prediction.score.range = { min: 0, max: 100 };
    const before = JSON.stringify(historical); expect(() => assertHopPredictionSnapshot(historical)).not.toThrow();
    expect(JSON.stringify(historical)).toBe(before);
  });
  it.each(['basis', 'source', 'score', 'profile', 'provenance', 'risk'] as const)('rejoue les preuves v2 et refuse une incohérence sémantique : %s', change => {
    // JSON deliberately breaks shared object identities, as an actual backup does.
    const fixed: HopPredictionSnapshot = JSON.parse(JSON.stringify(snapshot()));
    if (change === 'basis') (fixed.evidence.lots[0] as any).analysis[0].basis = 'dryMatter';
    if (change === 'source') { const model = fixed.evidence.knowledge.find(k => k.kind === 'model'); if (model) model.source.kind = 'judgment'; }
    if (change === 'score') fixed.prediction.score.range = { min: 100, max: 100 };
    if (change === 'profile') fixed.prediction.profile.citrus.range = { min: 7, max: 7 };
    if (change === 'provenance') fixed.prediction.profile.citrus.sources[0].reference = 'Source sans lien avec le calcul';
    if (change === 'risk') fixed.prediction.risks.push({ code: 'hopCreep', title: 'Alerte inventée', message: 'Sans politique figée', status: 'flagged', confidence: 'high', source: hopTestSource });
    expect(() => assertHopPredictionSnapshot(fixed)).toThrow(/Instantané v2 incohérent/);
  });
  it('rejette tout le fichier avant une écriture si un instantané v2 ne correspond plus à son COA', async () => {
    const fixed: HopPredictionSnapshot = JSON.parse(JSON.stringify(snapshot()));
    (fixed.evidence.lots[0] as any).analysis[0].basis = 'dryMatter';
    const backup = JSON.stringify({ schemaVersion: 3, source: 'device', exportedAt: '2026-09-08T10:00:00Z', collections: {
      hopVarieties: testHopData().varieties.map(data => ({ id: data.id, data })),
      hopPredictions: [{ id: fixed.id, data: fixed }]
    } });
    expect(() => parseBackup(backup)).toThrow(/quantification incompatible/);
    await expect(StorageService.importHopIndex(backup)).rejects.toThrow(/quantification incompatible/);
    expect(memory.writes).not.toHaveBeenCalled(); expect(memory.docs.size).toBe(0);
  });
  it.each(['yeast', 'dose', 'evidence', 'axis-output', 'score-alone', 'target', 'duplicate'] as const)('refuse un instantané dont le lien scientifique est rompu : %s', change => {
    const fixed = snapshot();
    if (change === 'yeast') fixed.prediction.triplet.yeastId = 'unrelated-yeast';
    if (change === 'dose') fixed.prediction.triplet.doseGL = 300;
    if (change === 'evidence') { fixed.evidence.varieties = []; fixed.evidence.lots = []; fixed.evidence.knowledge = fixed.evidence.knowledge.filter(k => k.kind !== 'yeast'); }
    if (change === 'axis-output') { const model = fixed.evidence.knowledge.find(k => k.kind === 'model'); if (model?.kind === 'model') model.outputs[0].axisVersion = 'other-axis-version'; }
    if (change === 'score-alone') { [...Object.values(fixed.prediction.profile), ...Object.values(fixed.prediction.compounds)].forEach(e => { e.range = null; }); fixed.prediction.modelRefs = []; fixed.evidence.knowledge = fixed.evidence.knowledge.filter(k => k.kind !== 'model'); }
    if (change === 'target') fixed.target = {};
    if (change === 'duplicate') fixed.evidence.varieties.push(structuredClone(fixed.evidence.varieties[0]));
    expect(() => assertHopPredictionSnapshot(fixed)).toThrow();
  });
  it('une année de COA inconnue réduit la confiance sans empêcher de figer un calcul traçable', () => {
    const d = testHopData(); d.lots[0].analysis[0].source = { ...hopTestSource, year: null };
    const fixed = captureHopPrediction({ ...testHopTriplet, lotId: 'test-lot' }, target, d, { id: 'unknown-coa-year', name: 'COA de test non daté', createdAt: '2026-09-08T10:00:00Z' });
    expect(fixed.prediction.profile.citrus.range).not.toBeNull();
    expect(fixed.prediction.profile.citrus.confidence).toBe('low');
    expect(() => assertHopPredictionSnapshot(fixed)).not.toThrow();
    StorageService.saveHopPrediction(fixed);
    expect(StorageService.getHopPredictions()[0].evidence.lots).toEqual(d.lots);
    expect(() => assertHopTasting({ ...tasting(), triplet: testHopTriplet, tripletSource: { ...hopTestSource, year: null } })).not.toThrow();
  });
  it('refuse les versions figées incohérentes et les dates de dégustation impossibles', () => {
    const fixed = snapshot(); fixed.prediction.modelRefs[0].version = 'version-absente';
    expect(() => assertHopPredictionSnapshot(fixed)).toThrow(/Version de modèle/);
    expect(() => assertHopTasting({ ...tasting(), date: '2026-02-30' })).toThrow(/Dégustation/);
    expect(() => assertHopTasting({ ...tasting(), brewery: 42 })).toThrow(/Information de bière/);
    expect(() => assertHopTasting({ ...tasting(), date: '2024-02-29' })).not.toThrow();
  });
  it('les conventions initiales sont toutes sourcées, sans modèle chimique de secours', () => {
    bootstrap.forEach(row => expect(() => assertHopKnowledge(row)).not.toThrow());
    expect(bootstrap.some(row => row.kind === 'model')).toBe(false);
  });
  it('fige les données et l’écart, puis survit à une modification de COA et une restauration complète', async () => {
    const data = testHopData();
    data.varieties.forEach(v => StorageService.saveHopVariety(v)); data.lots.forEach(l => StorageService.saveHopLot(l)); data.knowledge.forEach(k => StorageService.saveHopKnowledge(k));
    const fixed = snapshot(); StorageService.saveHopPrediction(fixed); StorageService.saveHopTasting(tasting());
    const initialGap = compareHopTasting(tasting(), fixed.prediction, [testHopAxis])[0].gap;
    data.lots[0].analysis[0].range = { min: 1, max: 2 }; data.lots[0].analysis[0].value = 1.5;
    StorageService.saveHopLot(data.lots[0]);
    expect(predictHopTriplet({ ...testHopTriplet, lotId: 'test-lot' }, target, data).profile.citrus.range).not.toEqual(fixed.prediction.profile.citrus.range);
    expect(compareHopTasting(StorageService.getHopTastings()[0], StorageService.getHopPredictions()[0].prediction, [testHopAxis])[0].gap).toEqual(initialGap);
    const backup = StorageService.exportHopIndex(); expect(parseBackup(backup).collections.hopPredictions).toHaveLength(1);
    memory.docs.clear(); await StorageService.importHopIndex(backup);
    expect(StorageService.getHopPredictions()[0]).toEqual(fixed);
    expect(StorageService.getHopTastings()[0]).toEqual(tasting());
    memory.writes.mockClear(); expect(await StorageService.importHopIndex(backup)).toBe(0); expect(memory.writes).not.toHaveBeenCalled();
  });
  it('refuse d’écraser une prédiction historique ou d’importer un coefficient non sourcé', async () => {
    const fixed = snapshot(); StorageService.saveHopPrediction(fixed); memory.writes.mockClear();
    expect(() => StorageService.saveHopPrediction({ ...fixed, name: 'Réécriture' })).toThrow(/figée/);
    const raw = JSON.parse(StorageService.exportHopIndex()); raw.collections.hopPredictions[0].data.evidence.knowledge.find((k: any) => k.kind === 'model').outputs[0].calibration.residual.source.reference = '';
    await expect(StorageService.importHopIndex(JSON.stringify(raw))).rejects.toThrow(/provenance/);
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('le compagnon utilise exactement le moteur et les anciennes données de dégustation', () => {
    const data = testHopData(), fixed = snapshot();
    const context: any = { now: 0, inventory: [], material: [], waterSources: [], provenance: [], phase: 'test', hopIndex: { ...data, truncated: [], predictions: [fixed], tastings: [tasting()] } };
    const result: any = runBrewerTool('predict_hop_aroma', { triplets: [testHopTriplet], target: [{ axisId: 'citrus', min: 7, max: 8 }] }, context);
    expect(result.data[0]).toEqual(predictHopTriplet(testHopTriplet, target, data));
    data.knowledge = [];
    expect((runBrewerTool('compare_hop_tasting', { tastingId: 'tasting-test' }, context).data as any[])[0].gap).toEqual(compareHopTasting(tasting(), fixed.prediction, [testHopAxis])[0].gap);
  });
  it('une bière commerciale sans recette reste une observation sans identité inventée', () => {
    const { batchId, ...base } = tasting();
    StorageService.saveHopTasting({ ...base, origin: 'commercial', predictionId: null });
    expect(StorageService.getHopTastings()[0]).toMatchObject({ origin: 'commercial', triplet: null, predictionId: null });
  });
  it('le lancement du brassin copie profondément les associations et la cible aromatiques', () => {
    const recipe: any = { id: 'recipe-test', name: 'Témoin', volumeL: 20, yeast: { name: 'Test', form: 'sèche', qty: 1, unit: 'g', hopIndexId: 'yeast-test' }, fermentables: [], hops: [{ name: 'Témoin', alpha: 7, weightG: 80, stage: 'dryHop', hopVarietyId: 'test-variety', hopLotId: 'test-lot', aromaTiming: 'fermentation' }], hopAromaTarget: structuredClone(target), hopPredictionIds: ['prediction-test'] };
    const captured = captureSnapshot(recipe); recipe.hops[0].hopLotId = 'different'; recipe.hopAromaTarget.citrus.min = 0; recipe.hopPredictionIds.push('new');
    expect(captured.hops[0].hopLotId).toBe('test-lot'); expect(captured.hopAromaTarget.citrus.min).toBe(7); expect(captured.hopPredictionIds).toEqual(['prediction-test']);
  });
});
