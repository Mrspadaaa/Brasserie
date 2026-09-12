import { describe, expect, it } from 'vitest';
import doseSource from '../fixtures/hopScientific/lafontaine-dose-2018.json';
import lotSource from '../fixtures/hopScientific/cascade-lots-2015.json';
import phenolSource from '../fixtures/hopScientific/cui-dm303-2015.json';
import samiaSource from '../fixtures/hopScientific/samia-diamond-2024.json';
import recipeSource from '../fixtures/hopScientific/test-houb.json';
import productionLotStudy from '../../src/data/hopStudies/lafontaine2018.cascade2015.json';
import sciencePack from '../../src/data/fermentationScienceBootstrap.json';
import type { FermentationScience } from '../../functions/src/fermentationScienceSchema';
import type { HopModel } from '../../functions/src/hopPredictionSchema';
import { predictHopTriplet } from '../../functions/src/hopPredictionCore';
import { fitPhenolStudy, predictStudyPhenols } from '../../functions/src/fermentationScienceCore';
import {
  benchmarkDose, benchmarkDoseInterpolation, benchmarkLots, benchmarkMetrics, benchmarkPhenols, benchmarkSamiaAndRecipe,
  doseBenchmarkData, doseBenchmarkTriplet, fitLotTrainingEnvelope, lotPredictionFromTraining,
  phenolSourceObservations, runHopScientificBenchmark, type LotRow,
} from '../scientific/hopBenchmark';

const study = structuredClone((sciencePack[0] as unknown as FermentationScience).phenolStudy!);

describe('Benchmark scientifique : observations indépendantes des coefficients calculés', () => {
  it('conserve la source primaire, la date, le localisateur et les unités de chaque transcription', () => {
    for (const fixture of [doseSource, lotSource, phenolSource, samiaSource]) {
      expect(fixture.source.kind).toBe('research');
      expect(fixture.source.year).toBeGreaterThan(2000);
      expect(fixture.source.reference).toMatch(/^https:\/\//);
      expect(fixture.source.locator.length).toBeGreaterThan(20);
      expect(fixture.verifiedAt).toBe('2026-09-09');
      expect(fixture.limitations.length).toBeGreaterThan(1);
    }
    expect(phenolSource.intervalReference.source.year).toBeNull(); // NIST table is undated.
    expect(lotSource.columns).toEqual(['sampleId', 'geraniolMg100g', 'citrusPanelMean']);
    expect(doseSource.publishedDoseUnit).toBe('g/hL');
  });

  it('contrôle les transcriptions utilisées en production avec les tables sources séparées', () => {
    expect(productionLotStudy.rows).toEqual(lotSource.rows);
    expect(study.observations).toEqual(phenolSourceObservations());
    expect(study.levels).toEqual(phenolSource.protocol.levels);
    expect(study.validation).toEqual({
      wheatPct: 40, mashInC: 44, boilMin: 88, fermentC: 19.5, n: 3, vgMgL: 2.418, vpMgL: 1.402,
    });
    expect(new Set(lotSource.rows.map(row => row[0])).size).toBe(29);
  });

  it('reproduit les cinq doses du tableau 3 via le vrai moteur et la conversion 0–15 / 0–100', () => {
    const results = benchmarkDose();
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.validation).toBe('reproduction');
      expect(result.metrics.quantified).toBe(5);
      expect(result.metrics.mae).toBeLessThan(1e-12);
      expect(result.metrics.uninformative).toBe(0);
      expect(result.rows.map(row => row.doseGL)).toEqual([0, 2, 3.86, 8, 16]);
      expect(result.rows.every(row => row.confidence === 'low' && row.range!.min < row.range!.max)).toBe(true);
      expect(result.sampling.harvestLots).toBe(1);
      expect(result.sampling.independentValidationBrews).toBe(0);
    }
    expect(results[0].rows.map(row => row.observed)).toEqual([1.9, 4.4, 5.8, 7.1, 7]);
    expect(results[1].rows.map(row => row.observed)).toEqual([2.5, 4.3, 5.7, 7.4, 10.4]);
  });

  it('détecte une erreur de coefficient ou d’échelle au lieu de recalculer les valeurs attendues depuis le pack', () => {
    const data = doseBenchmarkData();
    const model = data.knowledge.find(k => k.kind === 'model') as HopModel;
    model.outputs[0].doseCurve!.points.forEach(point => { point.value *= .15; });
    const wrong = benchmarkDose(data)[0];
    expect(wrong.metrics.mae).toBeGreaterThan(1);
    expect(wrong.rows.map(row => row.observed)).toEqual([1.9, 4.4, 5.8, 7.1, 7]);
  });

  it('garde le plateau agrumes documenté et la hausse herbacée aux fortes doses', () => {
    const [citrus, herbal] = benchmarkDose();
    expect(doseSource.rows[3][4]).toBe('a');
    expect(doseSource.rows[4][4]).toBe('a');
    expect(citrus.rows[4].central).toBeLessThan(citrus.rows[3].central!);
    expect(citrus.rows[4].range!.max).toBeGreaterThan(citrus.rows[3].range!.min);
    expect(herbal.rows[4].central! - herbal.rows[3].central!).toBeCloseTo(3, 12);
    const slopes = citrus.rows.slice(1).map((row, i) =>
      (row.central! - citrus.rows[i].central!) / (row.doseGL - citrus.rows[i].doseGL));
    expect(slopes[0]).toBeGreaterThan(slopes[2]);
    expect(citrus.limitations.join(' ')).toContain("n'établit pas une diminution significative");
  });

  it('évalue les trois doses intérieures réservées avec leurs marges recalculées sans elles', () => {
    for (const result of benchmarkDoseInterpolation()) {
      expect(result.metrics.total).toBe(3);
      expect(result.metrics.scored).toBe(3);
      expect(result.metrics.mae).toBeGreaterThan(0);
      expect(result.independentValidationBrews).toBe(0);
      for (const fold of result.folds) {
        expect(fold.trainingDoses).toHaveLength(4);
        expect(fold.trainingDoses).not.toContain(Number(fold.id));
        expect(fold.fittedResidualRadius).toBeGreaterThan(0);
      }
    }
  });

  it('n’utilise pas la courbe de dose hors levure, contact, matrice, forme et dose étudiés', () => {
    const data = doseBenchmarkData(), original = doseBenchmarkTriplet(3.86);
    for (const change of [
      { yeastId: 'lalbrew-diamond' }, { timing: 'fermentation' as const }, { matrixId: 'unfiltered-beer' },
      { temperatureC: 20 }, { contactHours: 48 }, { doseGL: 16.01 }, { temperatureC: null },
    ]) expect(predictHopTriplet({ ...original, ...change }, {}, data).profile.citrus.range).toBeNull();
    data.varieties[0].form = 'pelletT90';
    expect(predictHopTriplet(original, {}, data).profile.citrus.range).toBeNull();
  });

  it('recalcule paramètres, support et résidus sans jamais revoir le lot réservé', () => {
    const rows = lotSource.rows as LotRow[];
    const training = rows.filter(row => row[0] !== 'CAS_24_15');
    const first = lotPredictionFromTraining(training, .7, 'CAS_24_15');
    const changedHeld = structuredClone(rows);
    changedHeld.find(row => row[0] === 'CAS_24_15')![2] = 14.9;
    const second = lotPredictionFromTraining(changedHeld.filter(row => row[0] !== 'CAS_24_15'), .7, 'CAS_24_15');
    expect(second).toEqual(first);
    expect(first.fitted.trainingIds).not.toContain('CAS_24_15');
    expect(first.fitted.trainingIds).toHaveLength(28);
    const withoutExtreme = fitLotTrainingEnvelope(rows.filter(row => row[0] !== 'CAS_12_15'));
    expect(withoutExtreme.support.min).toBe(.7);
    expect(withoutExtreme.support.max).toBe(4.07);
  });

  it('distingue les 27 prédictions autorisées des deux diagnostics OLS hors support', () => {
    const result = benchmarkLots();
    expect(result.metrics).toMatchObject({
      total: 29, quantified: 27, unknown: 2, scored: 27, uninformative: 0, covered: 26,
      unknownIds: ['CAS_12_15', 'CAS_17_15'],
    });
    expect(result.metrics.mae).toBeCloseTo(.44407696863526747, 10);
    expect(result.metrics.rmse).toBeCloseTo(.5556478342313025, 10);
    expect(result.metrics.meanWidth).toBeCloseTo(2.7630915436127474, 10);
    expect(result.metrics.mae).toBeLessThan(result.baselineOnSameSupportedCases.mae!);
    expect(result.baselineOnSameSupportedCases.count).toBe(27);
    expect(result.diagnosticOlsAll29.productionPrediction).toBe(false);
    expect(result.diagnosticOlsAll29.mae).toBeCloseTo(.41537307496511094, 10);
    for (const fold of result.folds) expect(fold.trainingIds).not.toContain(fold.id);
  });

  it('refuse un ajustement linéaire non identifiable', () => {
    expect(() => fitLotTrainingEnvelope([['a', 2, 3], ['b', 2, 4], ['c', 2, 5]])).toThrow(/identifiable/);
  });

  it('ne récompense ni 0–100, ni une valeur absente, ni un intervalle invalide', () => {
    const report = benchmarkMetrics([
      { id: 'full', observed: 50, central: 50, range: { min: 0, max: 100 } },
      { id: 'missing', observed: 20, central: null, range: null },
      { id: 'bad', observed: 20, central: 20, range: { min: 30, max: 10 } },
    ], { min: 0, max: 100 });
    expect(report).toMatchObject({ total: 3, quantified: 1, unknown: 2, uninformative: 1,
      scored: 0, mae: null, rmse: null, covered: 1, informativeCovered: 0, informativeCoverageOverAllCases: 0 });
    expect(report.meanWidth).toBe(100);
    expect(benchmarkMetrics([], { min: 0, max: 100 }).mae).toBeNull();
  });

  it('compte les inconnues dans la couverture totale et compare les erreurs aux mêmes cas', () => {
    const report = benchmarkMetrics([
      { id: 'known', observed: 1, central: 2, range: { min: 0, max: 3 } },
      { id: 'unknown', observed: 4, central: null, range: null },
    ], { min: 0, max: 15 });
    expect(report.empiricalCoverageAmongQuantified).toBe(1);
    expect(report.informativeCoverageOverAllCases).toBe(.5);
    expect(report.mae).toBe(1);
    expect(report.scored).toBe(1);
  });

  it('reproduit les statistiques phénols publiées avant de parler de validation', () => {
    const report = benchmarkPhenols();
    expect(report.reproduction).toMatchObject({ validation: 'reproduction', runs: 29, parameters: 15, residualDf: 14 });
    expect(report.reproduction.results[0].r2).toBeCloseTo(phenolSource.publishedDiagnostics.vgR2, 4);
    expect(report.reproduction.results[0].mse).toBeCloseTo(phenolSource.publishedDiagnostics.vgResidualMse, 6);
    expect(report.reproduction.results[1].mse).toBeCloseTo(phenolSource.publishedDiagnostics.vpResidualMse, 6);
  });

  it('évalue DM303 en laissant chaque essai de côté avec df et marge recalculés', () => {
    const report = benchmarkPhenols().internalValidation;
    expect(report).toMatchObject({ validation: 'internal-leave-one-run-out', runs: 29,
      uniqueConditions: 25, sameConditionCenterReplicates: 5 });
    expect(report.results[0].metrics.mae).toBeCloseTo(.08474827586206934, 10);
    expect(report.results[1].metrics.mae).toBeCloseTo(.0805103448275864, 10);
    expect(report.results[0].metrics.covered).toBe(28);
    expect(report.results[1].metrics.covered).toBe(26);
    for (const result of report.results) {
      expect(result.metrics.mae).toBeLessThan(result.baseline.mae!);
      expect(result.metrics.unknown).toBe(0);
      expect(result.metrics.meanWidth).toBeGreaterThan(.4);
    }
  });

  it('expose la non-identifiabilité lorsque les cinq répétitions au centre sont réservées ensemble', () => {
    const grouped = benchmarkPhenols().groupedIdentifiability;
    expect(grouped).toHaveLength(25);
    expect(grouped.filter(row => !row.identifiable)).toEqual([
      expect.objectContaining({ condition: '0,0,0,0', withheldRuns: 5, identifiable: false, reason: expect.stringMatching(/identifiable/) }),
    ]);
  });

  it('teste la condition réservée publiée sans la transformer en trois observations ni en validation externe', () => {
    const report = benchmarkPhenols().reservedValidation;
    expect(report.independentStudy).toBe(false);
    expect(report.results[0].predictedMean).toBeCloseTo(2.429767833333334, 10);
    expect(report.results[0].observedMean).toBe(2.418);
    expect(report.results[1].predictedMean).toBeCloseTo(1.435992604166668, 10);
    expect(report.results[1].observedMean).toBe(1.402);
    for (const result of report.results) {
      expect(result.observationCount).toBe(1);
      expect(result.replicatesReported).toBe(3);
      expect(result.empiricalCoverage).toBeNull();
      expect(result.absoluteError).toBeLessThan(.04);
      expect(result.unit).toBe('mg/L');
    }
    const changed = structuredClone(study);
    changed.validation.vgMgL = 100;
    changed.validation.vpMgL = 100;
    expect(fitPhenolStudy(changed)).toEqual(fitPhenolStudy(study));
    expect(benchmarkPhenols(changed).reservedValidation.results).toEqual(report.results);
  });

  it('refuse les transpositions phénols non documentées et la température de mash-in seule', () => {
    const input = benchmarkPhenols().reservedValidation.input;
    for (const change of [{ yeastId: 'lalbrew-diamond' }, { protocolMatched: false }, { wortPlato: 12 },
      { pitchMillionCellsMl: 9 }, { mashInC: 45 }, { wheatPct: 50, mashInC: 52, boilMin: 110, fermentC: 20 }]) {
      const result = predictStudyPhenols(study, { ...input, ...change });
      expect(result.vg.range).toBeNull();
      expect(result.vp.range).toBeNull();
    }
  });

  it('conserve le contre-exemple Diamond sans inventer une intensité tropicale depuis les thiols', () => {
    const result = benchmarkSamiaAndRecipe();
    expect(result.contradictionCount).toBe(0);
    expect(result.sensoryIntensities).toBeNull();
    expect(result.validation).toBe('qualitative-consistency');
    expect(result.comparisons).toEqual(samiaSource.qualitative);
  });

  it('rejoue Test houb : identités reconnues, deux ajouts réels et écarts au protocole explicites', () => {
    const before = structuredClone(recipeSource), report = benchmarkSamiaAndRecipe().recipe;
    expect(recipeSource).toEqual(before);
    expect(report.scenarios).toHaveLength(2);
    expect(report.scenarios.map(row => row.doseGL)).toEqual([1.2, 3]);
    expect(report.scenarios.map(row => row.contactHours)).toEqual([1 / 6, 1 / 3]);
    expect(report.scenarios.every(row => row.varietyId === 'hopsteiner-cas' && row.yeastId === 'lalbrew-diamond')).toBe(true);
    expect(report.actualDryHopAdditions).toBe(0);
    expect(report.dryHopNamedSteps).toBe(2);
    expect(report.publishedTemperatureMatched).toBe(false);
    expect(report.differences).toContainEqual(expect.objectContaining({ label: 'Début d’ébullition · Cascade', status: 'changed' }));
    expect(report.differences).toContainEqual(expect.objectContaining({ label: 'Fermentation', status: 'changed' }));
  });

  it('produit un rapport hors ligne sans prétendre avoir une étude indépendante de validation', () => {
    const report = runHopScientificBenchmark();
    expect(report.failures).toEqual([]);
    expect(report).toMatchObject({ offline: true, paidAiCalls: 0, externalIndependentStudies: 0 });
    expect(report.results.dose.every(row => row.validation === 'reproduction')).toBe(true);
    expect(report.results.lots.validation).toBe('internal-nested-leave-one-lot-out');
  });
});
