import doseFixture from '../fixtures/hopScientific/lafontaine-dose-2018.json';
import lotFixture from '../fixtures/hopScientific/cascade-lots-2015.json';
import phenolFixture from '../fixtures/hopScientific/cui-dm303-2015.json';
import samiaFixture from '../fixtures/hopScientific/samia-diamond-2024.json';
import recipeFixture from '../fixtures/hopScientific/test-houb.json';
import lotPack from '../../src/data/hopStudyBootstrap.json';
import dosePack from '../../src/data/hopDoseStudyBootstrap.json';
import conventions from '../../src/data/hopKnowledgeBootstrap.json';
import manufacturer from '../../src/data/hopManufacturerBootstrap.json';
import yeastPack from '../../src/data/hopYeastBootstrap.json';
import trialPack from '../../src/data/hopTrialBootstrap.json';
import sciencePack from '../../src/data/fermentationScienceBootstrap.json';
import { predictHopTriplet, type HopEngineData } from '../../functions/src/hopPredictionCore';
import { fitPhenolStudy, phenolFeatures, predictStudyPhenols, type PhenolScenario } from '../../functions/src/fermentationScienceCore';
import type { FermentationPhenolStudy, FermentationScience } from '../../functions/src/fermentationScienceSchema';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { HopModel, HopTriplet, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { HopTrial } from '../../functions/src/hopTrialSchema';
import type { Recipe } from '../../src/types';
import { recipeHopScenario } from '../../src/domain/hopIndex/exploration';
import { compareHopTrial } from '../../src/domain/hopIndex/trials';

export type LotRow = [string, number, number];
export interface BenchmarkObservation {
  id: string; observed: number; central: number | null; range: HopRange | null;
  reason?: string;
}
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const bounds = (values: number[]): HopRange => ({ min: Math.min(...values), max: Math.max(...values) });
const center = (range: HopRange | null) => range ? (range.min + range.max) / 2 : null;
const clone = <T>(value: T): T => structuredClone(value);
const vectorDot = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const validRange = (range: HopRange | null) => !!range && finite(range.min) && finite(range.max) && range.min <= range.max;

/** No precision credit for missing estimates, invalid bounds, or the entire known scale. */
export function benchmarkMetrics(rows: BenchmarkObservation[], scale?: HopRange) {
  const known = rows.filter(row => validRange(row.range));
  const uninformative = known.filter(row => !!scale && row.range!.min <= scale.min && row.range!.max >= scale.max);
  const useful = known.filter(row => !uninformative.includes(row));
  const scored = useful.filter(row => finite(row.central));
  const covered = known.filter(row => row.observed >= row.range!.min && row.observed <= row.range!.max);
  const usefulCovered = useful.filter(row => row.observed >= row.range!.min && row.observed <= row.range!.max);
  return {
    total: rows.length, quantified: known.length, unknown: rows.length - known.length,
    uninformative: uninformative.length, scored: scored.length,
    mae: scored.length ? mean(scored.map(row => Math.abs(row.central! - row.observed))) : null,
    rmse: scored.length ? Math.sqrt(mean(scored.map(row => (row.central! - row.observed) ** 2))) : null,
    meanWidth: known.length ? mean(known.map(row => row.range!.max - row.range!.min)) : null,
    covered: covered.length,
    empiricalCoverageAmongQuantified: known.length ? covered.length / known.length : null,
    informativeCovered: usefulCovered.length,
    informativeCoverageOverAllCases: rows.length ? usefulCovered.length / rows.length : null,
    unknownIds: rows.filter(row => !validRange(row.range)).map(row => row.id),
  };
}
function pointErrors(rows: { observed: number; central: number }[]) {
  return { count: rows.length,
    mae: rows.length ? mean(rows.map(r => Math.abs(r.central - r.observed))) : null,
    rmse: rows.length ? Math.sqrt(mean(rows.map(r => (r.central - r.observed) ** 2))) : null };
}
function assertValidLotRows(rows: LotRow[]) {
  if (!Array.isArray(rows)) throw Error('Lot observations must be an array.');
  const identities = new Set<string>();
  for (const [index, row] of rows.entries()) {
    if (!Array.isArray(row) || row.length !== 3) throw Error(`Invalid lot row shape at index ${index}.`);
    const id = row[0];
    if (typeof id !== 'string' || id.length === 0 || id.trim() !== id)
      throw Error(`Invalid lot row identity at index ${index}.`);
    if (identities.has(id)) throw Error(`Duplicate lot row identity: ${id}.`);
    identities.add(id);
    if (!finite(row[1]) || !finite(row[2])) throw Error(`Non-finite lot data for ${id}.`);
  }
}
export function fitLine(rows: LotRow[]) {
  assertValidLotRows(rows);
  if (rows.length < 3) throw Error('At least three distinct source rows are required.');
  const x = mean(rows.map(row => row[1])), y = mean(rows.map(row => row[2]));
  const ssx = rows.reduce((sum, row) => sum + (row[1] - x) ** 2, 0);
  if (!(ssx > Number.EPSILON)) throw Error('Non-identifiable linear calibration.');
  const slope = rows.reduce((sum, row) => sum + (row[1] - x) * (row[2] - y), 0) / ssx;
  return { slope, intercept: y - slope * x };
}

/** Every bound and residual is refitted INSIDE the outer training split. */
export function fitLotTrainingEnvelope(training: LotRow[]) {
  const complete = fitLine(training);
  const inner = training.map((_, i) => fitLine(training.filter((__, j) => j !== i)));
  const residuals = training.map((row, i) => row[2] - inner[i].intercept - inner[i].slope * row[1]);
  return {
    trainingIds: training.map(row => row[0]),
    support: bounds(training.map(row => row[1])),
    intercept: bounds([complete.intercept, ...inner.map(fit => fit.intercept)]),
    coefficient: bounds([complete.slope, ...inner.map(fit => fit.slope)]),
    residual: bounds(residuals), complete,
    baseline: mean(training.map(row => row[2])),
  };
}
/** A numeric, held-out source coordinate is diagnostic only; it is not a typed COA measurement. */
export function diagnoseLotFromTraining(training: LotRow[], covariate: number) {
  if (!finite(covariate)) throw Error('Non-finite held-out lot coordinate.');
  const fitted = fitLotTrainingEnvelope(training);
  const central = fitted.complete.intercept + fitted.complete.slope * covariate;
  const inSupport = covariate >= fitted.support.min && covariate <= fitted.support.max;
  if (!inSupport) return { fitted, central, range: null, inSupport, reason: 'Coordonnée publiée hors du support d’entraînement ; aucune extrapolation.' };

  const products = [fitted.coefficient.min * covariate, fitted.coefficient.max * covariate];
  const raw = {
    min: fitted.intercept.min + fitted.residual.min + Math.min(...products),
    max: fitted.intercept.max + fitted.residual.max + Math.max(...products),
  };
  const range = { min: Math.max(0, raw.min), max: Math.min(15, raw.max) };
  if (!validRange(range)) return { fitted, central, range: null, inSupport, reason: 'Enveloppe diagnostique hors de l’échelle publiée.' };
  return { fitted, central, range, inSupport, reason: 'Enveloppe exploratoire recalculée dans le support ; base d’humidité inconnue.' };
}

/** Production probe uses the unchanged LF01 pack and no synthetic lot/COA. */
function lotProductionStatus(total: number) {
  const model = lotPack.hopKnowledge.find(row => row.kind === 'model') as HopModel;
  const protocol = lotFixture.protocol;
  const triplet: HopTriplet = { varietyId: protocol.varietyId, yeastId: protocol.yeastId,
    timing: 'postFermentation', doseGL: protocol.doseGL, temperatureC: protocol.temperatureC,
    contactHours: protocol.contactHours, matrixId: protocol.matrixId };
  const prediction = predictHopTriplet(triplet, {}, {
    varieties: clone(lotPack.hopVarieties) as HopEngineData['varieties'], lots: [],
    knowledge: clone(lotPack.hopKnowledge) as HopEngineData['knowledge'],
  });
  const estimate = prediction.profile['citrus-lafontaine'];
  const variety = lotPack.hopVarieties.find(row => row.id === protocol.varietyId)!;
  const observation = variety.analysis.find(row => row.analyte === 'geraniol')!;
  return {
    status: 'suspended-LF01', modelId: model.id, modelVersion: model.version, modelEnabled: model.enabled,
    observationBasis: observation.basis,
    calibrationBasis: model.outputs[0].calibration!.terms[0].basis,
    total, quantified: estimate.range ? total : 0, unknown: estimate.range ? 0 : total,
    probe: { lotId: triplet.lotId ?? null, range: estimate.range, reasons: estimate.reasons, modelRefs: prediction.modelRefs },
    note: `Un seul probe du protocole, sans lot ni COA synthétique ; l’absence de plage sur le modèle suspendu laisse les ${total} observations inconnues en production.`,
  };
}

export function benchmarkLots(sourceRows: LotRow[] = lotFixture.rows as LotRow[]) {
  assertValidLotRows(sourceRows);
  const rows = sourceRows;
  const folds = rows.map((held, index) => {
    const training = rows.filter((_, i) => i !== index);
    const diagnostic = diagnoseLotFromTraining(training, held[1]);
    const { fitted, central } = diagnostic;
    return { id: held[0], inputCoordinate: held[1], inputUnit: 'mg/100 g · base d’humidité inconnue',
      observed: held[2], central: diagnostic.range ? central : null,
      range: diagnostic.range, reason: diagnostic.reason, inSupport: diagnostic.inSupport,
      diagnosticOls: central, baseline: fitted.baseline, trainingIds: fitted.trainingIds,
      support: fitted.support, calibration: { intercept: fitted.intercept, coefficient: fitted.coefficient, residual: fitted.residual } };
  });
  const supported = folds.filter(fold => fold.range);
  return {
    id: lotFixture.id, source: lotFixture.source,
    production: lotProductionStatus(rows.length),
    diagnostic: {
      validation: 'internal-nested-leave-one-lot-out-diagnostic',
      unit: 'panel Citrus 0–15', input: 'géraniol publié, mg/100 g · base d’humidité inconnue',
      trainingUnit: 'one published lot mean', outerFolds: rows.length,
      method: 'OLS descriptif intra-étude. L’observation extérieure est exclue des coefficients, résidus internes, enveloppes et supports. Les bornes sont exploratoires ; ce ne sont ni des IC95 %, ni des prédictions de production, ni une validation externe.',
      metrics: benchmarkMetrics(folds, lotFixture.sensoryScale),
      baselineOnSameSupportedCases: pointErrors(supported.map(row => ({ observed: row.observed, central: row.baseline }))),
      diagnosticOlsAll29: { ...pointErrors(folds.map(row => ({ observed: row.observed, central: row.diagnosticOls }))),
        productionPrediction: false, note: 'Le diagnostic ponctuel hors support est descriptif uniquement ; aucune plage ne lui est attribuée.' },
      baselineAll29: pointErrors(folds.map(row => ({ observed: row.observed, central: row.baseline }))),
      limitations: lotFixture.limitations, folds,
    },
  };
}

export function doseBenchmarkData(): HopEngineData {
  return clone({ varieties: lotPack.hopVarieties, lots: [],
    knowledge: [...conventions, ...lotPack.hopKnowledge.filter(row => row.kind === 'yeast'), ...dosePack] }) as HopEngineData;
}
export function doseBenchmarkTriplet(doseGL: number): HopTriplet {
  const p = doseFixture.protocol;
  return { varietyId: p.varietyId, yeastId: p.yeastId, timing: 'postFermentation', doseGL,
    temperatureC: 14, contactHours: p.contactHours, matrixId: p.matrixId };
}
export function benchmarkDose(data = doseBenchmarkData()) {
  return ['citrus', 'herbal'].map((axis, index) => {
    const rows = doseFixture.rows.map(row => {
      const doseGL = (row[0] as number) / 100;
      const estimate = predictHopTriplet(doseBenchmarkTriplet(doseGL), {}, data).profile[axis];
      // The engine's symmetric published-dose envelope is centered on the interpolated mean.
      const range = estimate?.range ? { min: estimate.range.min * 15 / 100, max: estimate.range.max * 15 / 100 } : null;
      return { id: String(doseGL), doseGL, observed: row[index + 1] as number,
        central: center(range), range, confidence: estimate?.confidence, reasons: estimate?.reasons ?? [] };
    });
    return { id: doseFixture.id + '-' + axis, source: doseFixture.source, validation: 'reproduction',
      unit: 'panel 0–15', localUnit: 'index 0–100', metrics: benchmarkMetrics(rows, doseFixture.sensoryScale),
      sampling: doseFixture.sampling, limitations: doseFixture.limitations, rows };
  });
}

/** Shape diagnostic only: the outer dose is absent from both the curve and its margin. */
export function benchmarkDoseInterpolation() {
  return ['citrus', 'herbal'].map((axis, axisIndex) => {
    const sourceRows = doseFixture.rows.map(row => ({ doseGL: (row[0] as number) / 100, value: row[axisIndex + 1] as number }));
    const folds = sourceRows.slice(1, -1).map((held, heldIndex) => {
      const training = sourceRows.filter((_, i) => i !== heldIndex + 1);
      const innerResiduals = training.slice(1, -1).map((row, i) => {
        const left = training[i], right = training[i + 2];
        return row.value - (left.value + (right.value - left.value) * (row.doseGL - left.doseGL) / (right.doseGL - left.doseGL));
      });
      const radius = Math.max(...innerResiduals.map(Math.abs));
      const data = doseBenchmarkData(), model = data.knowledge.find(k => k.kind === 'model') as HopModel;
      const curve = model.outputs.find(output => output.target === 'axis:' + axis)!.doseCurve!;
      curve.points = training.map(row => ({ doseGL: row.doseGL, value: row.value * 100 / 15 }));
      curve.residual.range = { min: -radius * 100 / 15, max: radius * 100 / 15 };
      const estimate = predictHopTriplet(doseBenchmarkTriplet(held.doseGL), {}, data).profile[axis];
      const range = estimate.range ? { min: estimate.range.min * 15 / 100, max: estimate.range.max * 15 / 100 } : null;
      return { id: String(held.doseGL), observed: held.value, central: center(range), range,
        trainingDoses: training.map(row => row.doseGL), fittedResidualRadius: radius };
    });
    return { id: doseFixture.id + '-interior-' + axis, source: doseFixture.source,
      validation: 'internal-interpolation-diagnostic', unit: 'panel 0–15',
      independentValidationBrews: 0, metrics: benchmarkMetrics(folds, doseFixture.sensoryScale), folds,
      note: 'Three withheld interior doses from the same lot and panel. Outer endpoints cannot be tested by interpolation. Margins are recomputed using only the four training doses; this is not external validation.' };
  });
}

const defaultStudy = () => clone((sciencePack[0] as unknown as FermentationScience).phenolStudy!);
export function phenolSourceObservations() {
  return phenolFixture.rows.map(row => ({ coded: row.slice(0, 4) as [number, number, number, number], vgMgL: row[4], vpMgL: row[5] }));
}
function scenarioFromCoded(coded: number[]): PhenolScenario {
  const p = phenolFixture.protocol;
  const actual = Object.fromEntries(Object.entries(p.levels).map(([key, levels], i) => [key, levels[coded[i] + 1]]));
  return { yeastId: p.yeastId, protocolMatched: true, wortPlato: p.wortPlato, pitchMillionCellsMl: p.pitchMillionCellsMl,
    ...actual } as PhenolScenario;
}
function withTraining(study: FermentationPhenolStudy, rows: FermentationPhenolStudy['observations']) {
  const df = rows.length - phenolFixture.publishedDiagnostics.parameters;
  const criticalT = (phenolFixture.intervalReference.criticalTByDf as Record<string, number>)[String(df)];
  if (!criticalT) throw Error('No independently sourced t critical value for this training split.');
  return { ...clone(study), observations: clone(rows), prediction: { ...study.prediction, df, criticalT } };
}
export function benchmarkPhenols(study = defaultStudy()) {
  const observations = phenolSourceObservations();
  const fit = fitPhenolStudy(study);
  const loo = observations.map((held, i) => {
    const training = observations.filter((_, j) => i !== j);
    const trainingStudy = withTraining(study, training);
    const prediction = predictStudyPhenols(trainingStudy, scenarioFromCoded(held.coded));
    return { id: String(i + 1), held, prediction, trainingRows: training.map(row => row.coded),
      baselineVG: mean(training.map(row => row.vgMgL)), baselineVP: mean(training.map(row => row.vpMgL)) };
  });
  const summaries = (['vg', 'vp'] as const).map(key => {
    const observedKey = key === 'vg' ? 'vgMgL' : 'vpMgL';
    const rows = loo.map(row => ({ id: row.id, observed: row.held[observedKey],
      central: center(row.prediction[key].range), range: row.prediction[key].range }));
    return { compound: key === 'vg' ? '4VG' : '4VP', unit: 'mg/L', metrics: benchmarkMetrics(rows),
      baseline: pointErrors(loo.map(row => ({ observed: row.held[observedKey], central: key === 'vg' ? row.baselineVG : row.baselineVP }))), rows };
  });
  // Holding all center replicates out together reveals the missing intercept/quadratic information.
  const conditions = [...new Set(observations.map(row => row.coded.join(',')))];
  const grouped = conditions.map(condition => {
    const held = observations.filter(row => row.coded.join(',') === condition);
    const training = observations.filter(row => row.coded.join(',') !== condition);
    try { fitPhenolStudy(withTraining(study, training)); return { condition, withheldRuns: held.length, identifiable: true }; }
    catch (error) { return { condition, withheldRuns: held.length, identifiable: false, reason: String(error) }; }
  });
  const reserved = phenolFixture.reservedValidation;
  const validationInput: PhenolScenario = { yeastId: phenolFixture.protocol.yeastId, protocolMatched: true,
    wortPlato: phenolFixture.protocol.wortPlato, pitchMillionCellsMl: phenolFixture.protocol.pitchMillionCellsMl,
    wheatPct: reserved.wheatPct, mashInC: reserved.mashInC, boilMin: reserved.boilMin, fermentC: reserved.fermentC };
  const validationPrediction = predictStudyPhenols(study, validationInput);
  const reservedRows = (['vg', 'vp'] as const).map(key => {
    const observed = reserved[key === 'vg' ? 'vgMgL' : 'vpMgL'];
    const prediction = validationPrediction[key];
    return { compound: key === 'vg' ? '4VG' : '4VP', unit: 'mg/L', observedMean: observed,
      predictedMean: center(prediction.range), absoluteError: prediction.range ? Math.abs(center(prediction.range)! - observed) : null,
      modelRangeForOneFutureObservation: prediction.range, empiricalCoverage: null,
      observationCount: reserved.availableObservations, replicatesReported: reserved.replicates,
      note: 'One held-out published mean, not three individual validation observations. Its location inside a future-observation interval does not validate nominal coverage.' };
  });
  const reproduction = (['vg', 'vp'] as const).map(key => {
    const rows = observations.map((row, i) => {
      const value = vectorDot(phenolFeatures(row.coded), fit[key].coefficients);
      const prediction = predictStudyPhenols(study, scenarioFromCoded(row.coded))[key];
      return { id: String(i + 1), observed: row[key === 'vg' ? 'vgMgL' : 'vpMgL'], central: value, range: prediction.range };
    });
    return { compound: key === 'vg' ? '4VG' : '4VP', unit: 'mg/L', metrics: benchmarkMetrics(rows), r2: fit[key].r2, mse: fit[key].mse };
  });
  return { id: phenolFixture.id, source: phenolFixture.source,
    reproduction: { validation: 'reproduction', parameters: fit.parameters, runs: fit.n, residualDf: fit.df, results: reproduction },
    internalValidation: { validation: 'internal-leave-one-run-out', runs: observations.length,
      uniqueConditions: conditions.length, sameConditionCenterReplicates: observations.filter(row => row.coded.every(x => x === 0)).length,
      note: 'Internal diagnostics in the designed study, not independent studies or a transfer assessment. A missing edge point may be outside the retained design hull.', results: summaries },
    groupedIdentifiability: grouped,
    reservedValidation: { validation: 'published-reserved-condition-same-study', independentStudy: false,
      input: validationInput, results: reservedRows },
    limitations: phenolFixture.limitations };
}

export function benchmarkSamiaAndRecipe() {
  const trial = trialPack.hopKnowledge.find(row => row.id === samiaFixture.trialId) as unknown as HopTrial;
  const varieties = manufacturer.hopVarieties as HopEngineData['varieties'], yeasts = yeastPack as HopYeast[];
  const recipe = clone(recipeFixture) as Recipe;
  const scenarios = recipe.hops.map((_, index) => recipeHopScenario(recipe, index, varieties, yeasts)!);
  const resolved = { ...recipe, hops: recipe.hops.map((hop, i) => ({ ...hop, hopVarietyId: scenarios[i].triplet.varietyId })),
    yeast: { ...recipe.yeast, hopIndexId: scenarios[0].triplet.yeastId } } as Recipe;
  const predictions = scenarios.map(scenario => predictHopTriplet(scenario.triplet, {}, {
    varieties, lots: [], knowledge: [...conventions, ...yeasts, trial] as HopEngineData['knowledge'] }));
  const checks = [
    { id: 'qualitative-no-invented-panel-intensity', passed: trial.sensory.length === 0 },
    { id: 'diamond-is-not-a-positive-tropical-shortcut', passed: !trial.families.includes('tropical') && /plus faible/u.test(trial.result) && /soufr/u.test(trial.result) },
    { id: 'boil-start-evidence-kept', passed: !!trial.hops.find(hop => hop.timing === 'boil')?.boilStart },
    { id: 'correct-documented-doses', passed: trial.hops.every((hop, i) => hop.doseGL.range.min === samiaFixture.hops[i].doseGL && hop.doseGL.range.max === samiaFixture.hops[i].doseGL) },
    { id: 'test-houb-two-real-additions', passed: scenarios.length === 2 && scenarios.every(row => row.triplet.timing !== 'fermentation' && row.triplet.timing !== 'postFermentation') },
    { id: 'cascade-and-diamond-recognized', passed: scenarios.every(row => row.triplet.varietyId === 'hopsteiner-cas' && row.triplet.yeastId === samiaFixture.yeastId) },
    { id: 'trial-alone-does-not-fabricate-scores', passed: predictions.every(p => !Object.values(p.profile).some(value => value.range) && !Object.values(p.compounds).some(value => value.range)) },
  ];
  return { id: samiaFixture.id, source: samiaFixture.source, validation: 'qualitative-consistency',
    comparisons: samiaFixture.qualitative, sensoryIntensities: null, checks, contradictionCount: checks.filter(check => !check.passed).length,
    recipe: { id: recipe.id, scenarios: scenarios.map(row => row.triplet), differences: compareHopTrial(resolved, trial),
      primaryC: recipe.fermentation!.find(step => step.kind === 'primaire')!.tempC,
      publishedTemperatureMatched: samiaFixture.fermentationTemperaturesC.includes(recipe.fermentation![0].tempC),
      actualDryHopAdditions: recipe.hops.filter(hop => hop.stage === 'dryHop').length,
      dryHopNamedSteps: recipe.fermentation!.filter(step => /houblonnage à cru/iu.test(step.name)).length },
    limitations: samiaFixture.limitations };
}

export function runHopScientificBenchmark() {
  const dose = benchmarkDose(), doseInterpolation = benchmarkDoseInterpolation(), lots = benchmarkLots(), phenols = benchmarkPhenols(), qualitative = benchmarkSamiaAndRecipe();
  const failures: string[] = [];
  for (const result of dose) if (result.metrics.quantified !== doseFixture.rows.length || result.metrics.mae == null || result.metrics.mae > 1e-10)
    failures.push(result.id + ': source means are not reproduced by the current engine.');
  if (qualitative.contradictionCount) failures.push(...qualitative.checks.filter(c => !c.passed).map(c => c.id));
  if (Math.abs(phenols.reproduction.results[0].r2 - phenolFixture.publishedDiagnostics.vgR2) > .00005)
    failures.push('DM303 published R² is not reproduced.');
  if (lots.production.modelEnabled || lots.production.observationBasis !== 'unknown' || lots.production.calibrationBasis !== 'unknown')
    failures.push('Suspended LF01 model or unknown measurement basis changed in production data.');
  if (lots.production.unknown !== lots.production.total) failures.push('Suspended LF01 production model unexpectedly quantified held-out lots.');
  if (lots.diagnostic.metrics.scored === 0) failures.push('All held-out lot diagnostic estimates became indeterminate.');
  return { schemaVersion: 1, offline: true, paidAiCalls: 0,
    interpretation: 'Reproduction is not validation. Report errors, width, unknowns and informative coverage together. No general 95% confidence or universal aroma precision is claimed.',
    externalIndependentStudies: 0, results: { dose, doseInterpolation, lots, phenols, qualitative }, failures };
}
