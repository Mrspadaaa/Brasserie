import lotFixture from '../fixtures/hopScientific/cascade-lots-2015.json';
import recipeFixture from '../fixtures/hopScientific/test-houb.json';
import manufacturer from '../../src/data/hopManufacturerBootstrap.json';
import yeastPack from '../../src/data/hopYeastBootstrap.json';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import conventions from '../../src/data/hopKnowledgeBootstrap.json';
import extrapolation from '../../src/data/hopExtrapolationBootstrap.json';
import { benchmarkMetrics, doseBenchmarkData, doseBenchmarkTriplet, fitLine, fitLotTrainingEnvelope, lotPredictionFromTraining, type LotRow } from './hopBenchmark';
import { compareHopPredictions, predictHopTriplet, type HopEngineData } from '../../functions/src/hopPredictionCore';
import { predictHopRecipe, type HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import type { HopAxis, HopTriplet, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import { prepareHopRecipeInput } from '../../src/domain/hopIndex/recipePrediction';
import type { Recipe } from '../../src/types';

export { runHopScientificBenchmark } from './hopBenchmark';
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const extent = (values: number[]): HopRange => ({ min: Math.min(...values), max: Math.max(...values) });
const contains = (a: HopRange, b: HopRange) => a.min <= b.min + 1e-9 && a.max >= b.max - 1e-9;

/** Rejected model candidates remain reproducible, using the same outer holdouts.
 * Held-out sensory observations never participate in fits, margins or support. */
export function compareLotEnvelopeMethods() {
  const rows = lotFixture.rows as LotRow[];
  const folds = rows.map((held, i) => {
    const training = rows.filter((_, j) => i !== j);
    const fitted = fitLotTrainingEnvelope(training);
    const fits = [fitted.complete, ...training.map((_, j) => fitLine(training.filter((__, k) => j !== k)))];
    const { prediction, central } = lotPredictionFromTraining(training, held[1], held[0]);
    const boxed = prediction.profile['citrus-lafontaine'].range;
    const joint = extent(fits.map(f => f.intercept + f.slope * held[1]));
    const withResidual = (r: HopRange) => ({ min: Math.max(0, r.min + fitted.residual.min), max: Math.min(15, r.max + fitted.residual.max) });
    return { id: held[0], observed: held[2], central: boxed ? central : null, boxed,
      paired: boxed ? withResidual(joint) : null, singleFit: boxed ? withResidual({ min: central, max: central }) : null };
  });
  return (['boxed', 'paired', 'singleFit'] as const).map(method => ({
    method, deployed: method === 'boxed', validation: 'internal-nested-leave-one-lot-out', unit: 'panel 0–15',
    metrics: benchmarkMetrics(folds.map(f => ({ ...f, range: f[method] })), lotFixture.sensoryScale),
    missed: folds.filter(f => f[method] && (f.observed < f[method]!.min || f.observed > f[method]!.max)).map(f => f.id),
    decision: method === 'boxed' ? 'Maintenu : comparaison sur les mêmes cas.' : 'Non retenu : plages réduites mais couverture empirique dégradée, erreur centrale inchangée.',
  }));
}

/** These are brewer-entered objectives and software scenarios, not new chemical coefficients. */
export function compareBrewerObjectives() {
  const data = doseBenchmarkData();
  const objectives = [
    { id: 'agrumes-prioritaires', target: { citrus: { min: 60, max: 100 } } },
    { id: 'agrumes-sans-herbace-fort', target: { citrus: { min: 40, max: 60 }, herbal: { min: 0, max: 40 } } },
    { id: 'herbace-recherche', target: { herbal: { min: 60, max: 80 } } },
  ] as { id: string; target: Record<string, HopRange> }[];
  return objectives.map(({ id, target }) => {
    const predictions = [2, 3.86, 8, 16].map(d => predictHopTriplet(doseBenchmarkTriplet(d), target, data));
    const sorted = [...predictions].sort(compareHopPredictions);
    const first = sorted[0].score.range!;
    return { id, target, basis: 'Même protocole publié ; classement conventionnel, sans probabilité de réussite.',
      ranked: sorted.map(p => ({ doseGL: p.triplet.doseGL, score: p.score, citrus: p.profile.citrus.range, herbal: p.profile.herbal.range,
        overlapsFirst: !!p.score.range && p.score.range.max >= first.min && p.score.range.min <= first.max })),
      profilesUnchangedByTarget: predictions.every(p => JSON.stringify(p.profile) === JSON.stringify(predictHopTriplet(p.triplet, {}, data).profile)),
    };
  });
}

export function recipeArithmeticCases() {
  const data: HopEngineData = structuredClone({ varieties: manufacturer.hopVarieties, lots: [],
    knowledge: [...conventions, ...yeastPack, ...catalogue.filter(y => y.id === 'lalbrew-diamond'), ...extrapolation] }) as HopEngineData;
  // Deduplicate identities exactly as the loaded catalogue does.
  data.knowledge = [...new Map(data.knowledge.map(k => [k.id, k])).values()];
  const axes = data.knowledge.filter((k): k is HopAxis => k.kind === 'axis');
  const base: HopTriplet = { varietyId: 'hopsteiner-cas', yeastId: 'fermentis-us05', timing: 'postFermentation', doseGL: 4, temperatureC: 18, contactHours: 24, matrixId: null };
  const recipe = (triplets: HopTriplet[]): HopRecipeInput => ({ volumeL: 24, yeastId: triplets.length ? triplets[0].yeastId : base.yeastId,
    additions: triplets.map((triplet, i) => ({ id: 'hop-' + i, name: 'Cascade', triplet })), fermentation: [{ kind: 'primaire', tempC: 19, days: 7 }] });
  const boil = { ...base, timing: 'boil' as const, temperatureC: 100, contactHours: 1 };
  const real = prepareHopRecipeInput(recipeFixture as Recipe, data.varieties, data.knowledge.filter((k): k is HopYeast => k.kind === 'yeast')).input;
  const cases: { id: string; input: HopRecipeInput }[] = [
    { id: 'test-houb', input: real },
    { id: 'agrumes-cru-24h', input: recipe([base]) },
    { id: 'fruits-noyau-verdant', input: recipe([{ ...base, yeastId: 'lalbrew-verdant-ipa' }]) },
    { id: 'dose-inconnue-ebullition-60min', input: recipe([{ ...boil, doseGL: null }]) },
    { id: 'dose-inconnue-cru-1h', input: recipe([{ ...base, doseGL: null, contactHours: 1 }]) },
    { id: 'dose-inconnue-cru-72h', input: recipe([{ ...base, doseGL: null, contactHours: 72 }]) },
    { id: 'dose-partielle-deux-contacts', input: recipe([{ ...base, doseGL: 2, contactHours: 1 }, { ...base, doseGL: null, contactHours: 2 }]) },
    { id: 'contact-inconnu', input: recipe([{ ...base, contactHours: null }]) },
    { id: 'dose-et-contact-inconnus', input: recipe([{ ...base, doseGL: null, contactHours: null }]) },
    { id: 'phase-inconnue', input: recipe([{ ...base, timing: null }]) },
    { id: 'levure-inconnue', input: recipe([{ ...base, yeastId: null }]) },
    { id: 'vingt-ajouts', input: recipe(Array.from({ length: 20 }, (_, i) => ({ ...base, doseGL: .2, contactHours: 12 + i }))) },
  ];
  return { data, axes, cases };
}
export function compareRecipeArithmetic() {
  const { data, axes, cases } = recipeArithmeticCases();
  const failures: string[] = [];
  const summaries = cases.map(({ id, input }) => {
    const old = predictHopRecipe(input, {}, data, 'hop-recipe-experimental-v1');
    const next = predictHopRecipe(input, {}, data);
    const metrics = (p: typeof next) => {
      const known = axes.filter(a => p.overall.profile[a.id]?.range);
      const normalizedWidths = known.map(a => { const r = p.overall.profile[a.id].range!; return 100 * (r.max - r.min) / (a.scale.max - a.scale.min); });
      return { meanWidthPercentOfScale: normalizedWidths.length ? mean(normalizedWidths) : null,
        unknown: axes.length - known.length, fullScale: normalizedWidths.filter(w => w >= 100 - 1e-9).length,
        centralCount: known.filter(a => p.overall.profile[a.id].central !== undefined).length };
    };
    let narrowerAxes = 0, checkedCompletions = 0;
    for (const axis of axes) {
      const a = old.overall.profile[axis.id], b = next.overall.profile[axis.id];
      if (a.range && b.range) {
        if (!contains(a.range, b.range)) failures.push(id + ': wider ' + axis.id);
        if (b.range.max - b.range.min < a.range.max - a.range.min - 1e-9) narrowerAxes++;
      } else if (!!a.range !== !!b.range) failures.push(id + ': changed availability ' + axis.id);
      if (a.confidence !== b.confidence || a.central !== b.central) failures.push(id + ': invented confidence/central ' + axis.id);
    }
    const missingDose = input.additions.some(a => a.triplet.doseGL === null);
    if (!missingDose && JSON.stringify({ ...next, engineVersion: old.engineVersion }) !== JSON.stringify(old)) failures.push(id + ': known scenario changed');
    if (missingDose) for (const dose of [0, .01, 1, 4, 8, 16, 100, 1e6]) {
      const completed = structuredClone(input);
      completed.additions.forEach(a => { if (a.triplet.doseGL === null) a.triplet.doseGL = dose; });
      const p = predictHopRecipe(completed, {}, data);
      for (const axis of axes) {
        const range = next.overall.profile[axis.id]?.range, concrete = p.overall.profile[axis.id]?.range;
        if (range && concrete && !contains(range, concrete)) failures.push(id + ': lost completion ' + dose + '/' + axis.id);
      }
      checkedCompletions++;
    }
    return { id, before: metrics(old), after: metrics(next), narrowerAxes, checkedCompletions,
      citrus: { before: old.overall.profile.citrus?.range, after: next.overall.profile.citrus?.range },
      warnings: next.warnings, profileBasis: 'Enveloppe mathématique conditionnelle ; précision empirique non mesurée sur ces scénarios.' };
  });
  return { summaries, failures };
}

export function runHopSecondPass() {
  const arithmetic = compareRecipeArithmetic(), objectives = compareBrewerObjectives();
  return { version: '2026-09-09.2', recipeEngine: 'hop-recipe-experimental-v2',
    scientificAlternatives: compareLotEnvelopeMethods(), objectives, arithmetic: arithmetic.summaries,
    failures: [...arithmetic.failures, ...objectives.filter(o => !o.profilesUnchangedByTarget).map(o => o.id + ': target altered aroma')],
    limitations: ['Aucune nouvelle validation externe.', 'Les intervalles expérimentaux ne sont pas des intervalles de confiance statistiques calibrés.',
      'Le gain v2 concerne uniquement les doses incomplètes et les contraintes déjà connues ; coefficients chimiques inchangés.'] };
}
