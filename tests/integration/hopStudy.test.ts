import { describe, expect, it } from 'vitest';
import study from '../../src/data/hopStudies/lafontaine2018.cascade2015.json';
import pack from '../../src/data/hopStudyBootstrap.json';
import manufacturer from '../../src/data/hopManufacturerBootstrap.json';
import { parseBackup } from '../../functions/src/backupCore';
import { predictHopTriplet } from '../../functions/src/hopPredictionCore';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopTriplet, HopModel } from '../../functions/src/hopPredictionSchema';
import { captureHopPrediction } from '../../src/domain/hopIndex/snapshots';
import { assertHopPredictionSnapshot } from '../../functions/src/hopPredictionValidation';
import { guidePredictionKnowledge, guidePredictionKnowledgeQualification } from '../../src/ui/hopIndex/guideData';
import { hopTestSource } from '../fixtures/hopIndex';
import { resolveHopFacts } from '../../functions/src/hopIndexFacts';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import { assertHopKnowledge, HOP_TIMINGS } from '../../functions/src/hopPredictionSchema';
import { rankHopTriplets } from '../../functions/src/hopPredictionCore';
import { publicHopData, publicHopPacks } from '../fixtures/hopPublicPacks';
const data = (): HopEngineData => structuredClone({ varieties: pack.hopVarieties, lots: [], knowledge: guidePredictionKnowledge([]) }) as HopEngineData;
const triplet: HopTriplet = { varietyId: study.protocol.varietyId, yeastId: study.protocol.yeastId, timing: 'postFermentation', doseGL: 3.86, temperatureC: 14, contactHours: 24, matrixId: study.protocol.matrixId };
const target = { 'citrus-lafontaine': { min: 5, max: 10 } };
const backup = (p: Record<string, { id: string }[]>) => JSON.stringify({ schemaVersion: 3, source: 'device', exportedAt: '2026-09-08T10:00:00Z', collections: Object.fromEntries(Object.entries(p).map(([name, rows]) => [name, rows.map(data => ({ id: data.id, data }))])) });
describe('Données publiques distinctes des fixtures du moteur', () => {
  it('conserve les valeurs des COA et leurs limites sans les convertir en prédictions ou années de récolte inventées', () => {
    const lots = publicHopData().lots;
    const old = lots.find(l => l.lotNumber === 'CAS-2400')!;
    expect(old.harvestYear).toBeUndefined();
    expect(old.analysis.find(m => m.analyte === 'geraniol')).toMatchObject({ value: 0.19, kind: 'point', unit: 'percentOil', basis: 'oil' });
    expect(old.analysis.every(m => !m.range && m.source.year === 2024)).toBe(true);
    const recent = lots.find(l => l.lotNumber === 'CAS-2519')!;
    expect(recent.harvestYear).toBe(2025); expect(recent.analysis.find(m => m.analyte === 'hsi')?.value).toBe(0.228);
    const farm = lots.find(l => l.lotNumber === 'CH25-BH01-MKA')!;
    expect(farm.grower).toBe('Battery Hill Hop Farm');
    expect(farm.analysis.find(m => m.analyte === 'caryophyllene')).toMatchObject({ value: 0.91, unit: 'unknown', basis: 'unknown' });
    const research = lots.find(l => l.id === 'cascade-t90-samia2026-sample')!;
    expect(research.analysis.find(m => m.analyte === '3mhGsh')).toMatchObject({ value: 7920, unit: 'ugKgThiolEquivalent', basis: 'unknown' });
    expect(research.analysis.find(m => m.analyte === '3s4mpFree')?.value).toBe(8);
    expect(research.analysis.find(m => m.analyte === '4mmpFree')?.value).toBe(2);
    expect(research.analysis.every(m => m.range == null && m.limit == null)).toBe(true);
  });
  it('valide les 766 références et les échantillons publics sans fusionner les sources', () => {
    for (const p of Object.values(publicHopPacks)) expect(() => parseBackup(backup(p))).not.toThrow();
    const all = publicHopData();
    expect(all.varieties).toHaveLength(766); expect(new Set(all.varieties.map(v => v.id)).size).toBe(766);
    all.knowledge.forEach(k => expect(() => assertHopKnowledge(k)).not.toThrow());
    expect(all.lots).toHaveLength(10); expect(all.lots.every(l => l.referenceOnly && !l.stockItemRef)).toBe(true);
    const citra = all.varieties.filter(v => v.name === 'Citra');
    expect(citra.length).toBeGreaterThanOrEqual(3);
    expect(new Set(citra.map(v => v.analysis[0].source.author)).size).toBe(citra.length);
    for (const p of [publicHopPacks.database, publicHopPacks.legacy]) {
      expect(p.hopVarieties.flatMap(v => v.analysis).every(m => m.unit === 'unknown' && m.basis === 'unknown' && m.source.year === null && m.confidence === 'low')).toBe(true);
    }
    expect(publicHopPacks.maverick.hopVarieties.find(v => v.id === 'beermaverick-citra')!.analysis[0].source.year).toBe(2023);
  });
  it('classe le catalogue comme le calcul isolé sans réutiliser la calibration suspendue', () => {
    const d = publicHopData(), candidates = d.varieties.flatMap(v => HOP_TIMINGS.map(timing => ({ ...triplet, varietyId: v.id, timing })));
    const isolated = predictHopTriplet(triplet, target, d), ranked = rankHopTriplets(candidates, target, d);
    expect(ranked).toHaveLength(3830); expect(ranked.filter(p => p.score.range)).toHaveLength(0);
    expect(ranked.find(prediction => prediction.triplet.varietyId === triplet.varietyId
      && prediction.triplet.yeastId === triplet.yeastId && prediction.triplet.timing === triplet.timing
      && prediction.triplet.doseGL === triplet.doseGL && prediction.triplet.matrixId === triplet.matrixId)).toEqual(isolated);
    const model = d.knowledge.find(k => k.id === 'cascade1728-clarified-lafontaine') as HopModel;
    expect(model).toMatchObject({ enabled: false, version: 'lafontaine2015-local-2' });
    expect(rankHopTriplets([triplet], target, d)[0].modelRefs.some(ref => ref.id === model.id)).toBe(false);
  });
  it('une unité non attestée reste documentaire et ne peut devenir un prédicteur ou un seuil', () => {
    const d = data(), model = d.knowledge.find(k => k.kind === 'model') as HopModel;
    model.outputs[0].calibration!.terms[0].unit = 'unknown';
    expect(() => assertHopKnowledge(model)).toThrow(/prédicteur/);
    expect(predictHopTriplet(triplet, target, d).score.range).toBeNull();
  });
  it('garde visible une incohérence fabricant sans inverser ses bornes ni la faire calculer', () => {
    const variety = manufacturer.hopVarieties.find(v => v.id === 'hopsteiner-sga') as HopVariety;
    const beta = resolveHopFacts(null, variety).find(f => f.analyte === 'beta')!;
    expect(beta).toMatchObject({ origin: 'unknown', range: null, compatible: false });
    expect(beta.measurement).toBeUndefined();
    expect(beta.documentary?.note).toContain('8.0 - 2.5');
    expect(beta.documentary?.source.year).toBe(2025);
  });
  it('les deux packs respectent le même contrat de restauration et ne contiennent pas de brassins inventés', () => {
    expect(() => parseBackup(backup(pack))).not.toThrow();
    expect(() => parseBackup(backup(manufacturer))).not.toThrow();
    expect(pack.hopLots).toHaveLength(0); expect(pack.hopTastings).toHaveLength(0);
    expect(manufacturer.hopKnowledge).toHaveLength(0);
    expect(manufacturer.hopVarieties.every(v => v.form === 'unknown' && v.descriptions.every(d => d.context === 'rawHop'))).toBe(true);
  });
  it('les 29 appariements retrouvent le R² publié, sans confondre ce contrôle avec une validation externe', () => {
    const rows = study.rows, mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const xs = rows.map(r => r[1] as number), ys = rows.map(r => r[2] as number), x = mean(xs), y = mean(ys);
    const covariance = xs.reduce((s, value, i) => s + (value - x) * (ys[i] - y), 0);
    const rSquared = covariance ** 2 / (xs.reduce((s, v) => s + (v - x) ** 2, 0) * ys.reduce((s, v) => s + (v - y) ** 2, 0));
    expect(new Set(rows.map(r => r[0])).size).toBe(29);
    expect(rSquared).toBeCloseTo(0.50, 2);
    const model = pack.hopKnowledge.find(k => k.kind === 'model') as HopModel;
    expect(model.source.kind).toBe('judgment'); expect(model.confidence).toBe('low');
    expect(model.outputs[0].calibration?.terms[0].unit).toBe('mg100g');
    expect(model.enabled).toBe(false);
    expect(model.outputs[0].calibration?.terms[0].basis).toBe('unknown');
  });
  it('aucun COA ne réactive la calibration dont la base Lafontaine reste inconnue', () => {
    const savedLegacy = structuredClone(pack.hopKnowledge.find(k => k.kind === 'model') as HopModel);
    savedLegacy.version = 'lafontaine2015-local-1';
    savedLegacy.enabled = true;
    savedLegacy.outputs[0].calibration!.terms[0].basis = 'asIs';
    const view = guidePredictionKnowledgeQualification([savedLegacy]);
    const qualification = view.modelQualifications.find(row => row.id === savedLegacy.id)!;
    expect(qualification.status).toBe('suspended');
    expect(qualification.reason).toMatch(/base analytique non établie/i);
    expect(qualification.rawVariants.some(row => row.origin === 'saved' && row.raw.kind === 'model'
      && row.raw.enabled && row.raw.outputs[0].calibration?.terms[0].basis === 'asIs')).toBe(true);

    const qualificationSafeKnowledge = guidePredictionKnowledge([savedLegacy]);
    for (const basis of ['asIs', 'dryMatter', 'unknown'] as const) {
      const d = { varieties: pack.hopVarieties, lots: [], knowledge: structuredClone(qualificationSafeKnowledge) } as HopEngineData;
      d.lots.push({ id: `coa-${basis}`, varietyId: triplet.varietyId!, name: `Fixture synthétique ${basis}`, form: 'cone', analysis: [{
        analyte: 'geraniol', unit: 'mg100g', basis, kind: 'range', range: { min: 2, max: 2.1 },
        source: hopTestSource, confidence: 'medium',
      }] });
      const prediction = predictHopTriplet({ ...triplet, lotId: `coa-${basis}` }, target, d);
      expect(prediction.profile['citrus-lafontaine'].range).toBeNull();
      expect(prediction.modelRefs.some(ref => ref.id === savedLegacy.id)).toBe(false);
    }
  });

  it('valide le seed suspendu à l’import local sans réécrire un snapshot historique', () => {
    expect(() => parseBackup(backup(pack))).not.toThrow();
    const oldVariety = structuredClone(pack.hopVarieties[0]);
    oldVariety.analysis[0].basis = 'asIs';
    const oldModel = structuredClone(pack.hopKnowledge.find(k => k.kind === 'model') as HopModel);
    oldModel.version = 'lafontaine2015-local-1';
    oldModel.enabled = true;
    oldModel.outputs[0].calibration!.terms[0].basis = 'asIs';
    const savedCalibration = structuredClone(oldModel.outputs[0].calibration!);
    const oldKnowledge = pack.hopKnowledge.map(row => row.id === oldModel.id ? oldModel : row);
    const frozenData: HopEngineData = { varieties: [oldVariety], lots: [], knowledge: oldKnowledge };
    const snapshot = captureHopPrediction(triplet, target, frozenData, {
      id: 'fixture-lafontaine-archive', name: 'Archive ancienne fixture', createdAt: '2026-09-30T12:00:00.000Z',
    });
    const before = JSON.stringify(snapshot);
    expect(() => assertHopPredictionSnapshot(snapshot)).not.toThrow();
    expect(snapshot.evidence.knowledge.find(row => row.id === oldModel.id)).toMatchObject({ enabled: true, version: 'lafontaine2015-local-1' });
    expect((snapshot.evidence.knowledge.find(row => row.id === oldModel.id) as HopModel).outputs[0].calibration!.terms[0].basis).toBe('asIs');
    expect(JSON.stringify(snapshot)).toBe(before);
    const current = guidePredictionKnowledge([oldModel]).find(row => row.id === oldModel.id) as HopModel;
    expect(current).toMatchObject({ enabled: false, version: 'lafontaine2015-local-1-basis-suspended-lf01' });
    expect(current.outputs[0].calibration!.intercept.range).toEqual(savedCalibration.intercept.range);
    expect(current.outputs[0].calibration!.residual.range).toEqual(savedCalibration.residual.range);
    expect(current.outputs[0].calibration!.terms[0]).toMatchObject({
      basis: 'unknown', support: savedCalibration.terms[0].support,
      coefficient: savedCalibration.terms[0].coefficient,
    });
  });
});
