import { describe, expect, it } from 'vitest';
import { predictHopTriplet, rankHopTriplets, compareHopTasting, hopTripletsOfRecipe, recipeForHopAnalysis, scoreHopProfile } from '../../functions/src/hopPredictionCore';
import { HopRiskPolicy, assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { hopTestSource } from '../fixtures/hopIndex';
import { testHopAxis, testHopData, testHopModel, testHopTriplet } from '../fixtures/hopPrediction';
import { patchIndexedHop } from '../../src/domain/hopIndex/recipeBindings';
const target = { citrus: { min: 7, max: 8 } };
describe('Prédictions conditionnelles avec marges', () => {
  it('annule le poids d’un seul axe et ne crée pas de marge lorsque toutes les distances sont égales', () => {
    const axis = structuredClone(testHopAxis); axis.weight.range = { min: 1, max: 10 };
    const estimate = (value: number) => ({ range: { min: value, max: value }, confidence: 'medium' as const, sources: [hopTestSource], reasons: [] });
    expect(scoreHopProfile({ citrus: estimate(10) }, { citrus: { min: 0, max: 0 } }, [axis]).range).toEqual({ min: 0, max: 0 });
    const other = { ...structuredClone(axis), id: 'floral', weight: { ...axis.weight, range: { min: 1, max: 1 } } };
    const requested = { citrus: { min: 0, max: 0 }, floral: { min: 0, max: 0 } };
    const a = scoreHopProfile({ citrus: estimate(10), floral: estimate(0) }, requested, [axis, other]).range!;
    const b = scoreHopProfile({ citrus: estimate(8), floral: estimate(8) }, requested, [axis, other]).range!;
    expect(a.min).toBeCloseTo(100 / 11); expect(a.max).toBeCloseTo(50);
    expect(b.min).toBeCloseTo(20); expect(b.max).toBeCloseTo(20); expect(b.min).toBeGreaterThan(a.min);
    axis.weight.range = { min: 1e-300, max: 1e300 }; other.weight.range = { min: 1e-300, max: 1e300 };
    const extreme = scoreHopProfile({ citrus: estimate(8), floral: estimate(8) }, requested, [axis, other]).range!;
    expect(extreme.min).toBeCloseTo(20); expect(extreme.max).toBeCloseTo(20);
  });
  it('retrouve les extrema exacts de toutes les combinaisons de valeurs et de poids, indépendamment de leur ordre', () => {
    let seed = 526;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
    for (let trial = 0; trial < 60; trial++) {
      const n = 1 + trial % 5;
      const axes = Array.from({ length: n }, (_, i) => ({ ...structuredClone(testHopAxis), id: `axis-${i}`, weight: { source: hopTestSource, range: { min: 0.1 + random(), max: 2 + 8 * random() } } }));
      const values = axes.map(() => { const min = 8 * random(); return { min, max: min + (10 - min) * random() }; });
      const profile = Object.fromEntries(axes.map((axis, i) => [axis.id, { range: values[i], confidence: 'medium', sources: [hopTestSource], reasons: [] }]));
      const wanted = Object.fromEntries(axes.map(axis => [axis.id, { min: 0, max: 0 }]));
      const corners: number[] = [];
      for (let mask = 0; mask < 2 ** (n * 2); mask++) {
        let numerator = 0, denominator = 0;
        axes.forEach((axis, i) => { const w = mask & 2 ** i ? axis.weight.range.max : axis.weight.range.min; const x = mask & 2 ** (n + i) ? values[i].max : values[i].min; numerator += w * x / 10; denominator += w; });
        corners.push(100 * (1 - numerator / denominator));
      }
      const actual = scoreHopProfile(profile as any, wanted, axes).range!;
      expect(actual.min).toBeCloseTo(Math.min(...corners), 10); expect(actual.max).toBeCloseTo(Math.max(...corners), 10);
      const reversed = scoreHopProfile(profile as any, Object.fromEntries(Object.entries(wanted).reverse()), axes).range!;
      expect(reversed.min).toBeCloseTo(actual.min, 10); expect(reversed.max).toBeCloseTo(actual.max, 10);
    }
  });
  it('contient tous les sommets d’un étalonnage à pente signée et conserve son résidu', () => {
    const d = testHopData(), axis = d.knowledge[0] as typeof testHopAxis, model = d.knowledge.find(k => k.kind === 'model') as ReturnType<typeof testHopModel>;
    axis.scale.max = 100;
    const c = model.outputs[0].calibration!;
    c.intercept.range = { min: 30, max: 31 }; c.residual.range = { min: -0.2, max: 0.5 }; c.terms[0].coefficient.range = { min: -2, max: 1.5 };
    const range = predictHopTriplet(testHopTriplet, {}, d).profile.citrus.range!;
    const observations = [30, 31].flatMap(intercept => [-0.2, 0.5].flatMap(residual => [-2, 1.5].flatMap(slope => [5, 9].map(alpha => intercept + slope * alpha + residual))));
    expect(range.min).toBeCloseTo(Math.min(...observations)); expect(range.max).toBeCloseTo(Math.max(...observations));
  });
  it('le score encadre les distances possibles, y compris avec des poids incertains', () => {
    const axes = [structuredClone(testHopAxis), { ...structuredClone(testHopAxis), id: 'floral', name: 'Floral' }];
    axes[0].weight.range = { min: 1, max: 2 }; axes[1].weight.range = { min: 2, max: 4 };
    const profile = { citrus: { range: { min: 2, max: 8 }, confidence: 'medium' as const, sources: [hopTestSource], reasons: [] }, floral: { range: { min: 1, max: 3 }, confidence: 'medium' as const, sources: [hopTestSource], reasons: [] } };
    const range = scoreHopProfile(profile, { citrus: { min: 5, max: 7 }, floral: { min: 4, max: 6 } }, axes).range!;
    for (const x of [2, 5, 7, 8]) for (const y of [1, 2, 3]) for (const w of [1, 2]) for (const z of [2, 4]) {
      const distance = (v: number, lo: number, hi: number) => v < lo ? lo - v : v > hi ? v - hi : 0;
      const score = 100 * (1 - (w * distance(x, 5, 7) + z * distance(y, 4, 6)) / (10 * (w + z)));
      expect(score).toBeGreaterThanOrEqual(range.min); expect(score).toBeLessThanOrEqual(range.max);
    }
  });
  it('le COA resserre le résultat sans éliminer le résidu du modèle', () => {
    const data = testHopData(), before = structuredClone(data);
    const generic = predictHopTriplet(testHopTriplet, target, data);
    const lot = predictHopTriplet({ ...testHopTriplet, lotId: 'test-lot' }, target, data);
    expect(generic.profile.citrus.range).toEqual({ min: 4.8, max: 9.2 });
    expect(lot.profile.citrus.range?.min).toBeCloseTo(6.6);
    expect(lot.profile.citrus.range?.max).toBeCloseTo(7.4);
    expect(lot.score.range!.min).toBeGreaterThan(generic.score.range!.min);
    expect(data).toEqual(before);
  });
  it.each(['yeastId', 'timing', 'matrixId', 'doseGL', 'temperatureC', 'contactHours'] as const)('sans %s, aucune intensité n’est inventée', key => {
    const result = predictHopTriplet({ ...testHopTriplet, [key]: null }, target, testHopData());
    expect(result.profile.citrus.range).toBeNull(); expect(result.score.range).toBeNull();
  });
  it('une mesure absente conserve l’enveloppe empirique à confiance faible', () => {
    const data = testHopData(); data.varieties[0].analysis = [];
    const result = predictHopTriplet(testHopTriplet, target, data);
    expect(result.profile.citrus.range).toEqual({ min: 0, max: 10 });
    expect(result.profile.citrus.confidence).toBe('low');
  });
  it('un coefficient modifié dans la donnée change le calcul sans modification de code', () => {
    const data = testHopData(), model = data.knowledge.find(m => m.kind === 'model') as ReturnType<typeof testHopModel>;
    model.outputs[0].calibration!.terms[0].coefficient.range = { min: 0.5, max: 0.5 };
    expect(predictHopTriplet(testHopTriplet, target, data).profile.citrus.range).toEqual({ min: 2.3, max: 4.7 });
  });
  it('une source de coefficient sans année invalide le modèle, pas le résultat entier', () => {
    const data = testHopData(), model = data.knowledge.find(m => m.kind === 'model') as ReturnType<typeof testHopModel>;
    model.outputs[0].calibration!.terms[0].coefficient.source = { ...hopTestSource, year: null };
    expect(() => assertHopKnowledge(model)).toThrow(/année/);
    const result = predictHopTriplet(testHopTriplet, target, data);
    expect(result.score.range).toBeNull(); expect(result.reasons.join(' ')).toMatch(/inutilisable/);
  });
  it('un lot incompatible ou une valeur hors étalonnage ne déclenche pas une extrapolation', () => {
    const data = testHopData(); data.lots[0].analysis[0].range = { min: 12, max: 13 }; data.lots[0].analysis[0].value = 12.5;
    expect(predictHopTriplet({ ...testHopTriplet, lotId: 'test-lot' }, target, data).score.range).toBeNull();
    expect(predictHopTriplet({ ...testHopTriplet, lotId: 'absent' }, target, data).score.range).toBeNull();
  });
  it('une valeur ponctuelle hors domaine reste incompatible même sans marge analytique', () => {
    const data = testHopData(); data.lots[0].analysis[0].value = 12; delete data.lots[0].analysis[0].range;
    expect(predictHopTriplet({ ...testHopTriplet, lotId: 'test-lot' }, target, data).score.range).toBeNull();
  });
  it('des modèles contradictoires élargissent la plage au lieu de sommer deux conversions', () => {
    const second = testHopModel(); second.id = 'second'; second.outputs[0] = { target: 'axis:citrus', axisVersion: 'test-1', envelope: { range: { min: 1, max: 2 }, source: hopTestSource } };
    const result = predictHopTriplet(testHopTriplet, target, testHopData([second]));
    expect(result.profile.citrus.range).toEqual({ min: 1, max: 9.2 });
    expect(result.profile.citrus.confidence).toBe('low');
    expect(result.profile.citrus.reasons.join(' ')).toMatch(/contradictoires/);
  });
  it('un nouvel axe cible sans données élargit le score et une nouvelle version invalide l’ancien étalonnage', () => {
    const data = testHopData([{ ...testHopAxis, id: 'floral' }]);
    const baseline = predictHopTriplet(testHopTriplet, target, data);
    const mixed = predictHopTriplet(testHopTriplet, { ...target, floral: { min: 4, max: 8 } }, data);
    expect(mixed.score.range!.min).toBeLessThan(baseline.score.range!.min);
    expect(mixed.score.confidence).toBe('low');
    (data.knowledge[0] as typeof testHopAxis).version = 'new';
    expect(predictHopTriplet(testHopTriplet, target, data).score.range).toBeNull();
  });
  it('le classement place les résultats prudents en tête, les inconnus à la fin', () => {
    const results = rankHopTriplets([{ ...testHopTriplet, timing: null }, testHopTriplet, { ...testHopTriplet, lotId: 'test-lot' }], target, testHopData());
    expect(results[0].triplet.lotId).toBe('test-lot'); expect(results[2].score.range).toBeNull();
  });
});
describe('Contexte explicite et journal de brassage', () => {
  it('changer de houblon ou de procédé retire les associations devenues fausses', () => {
    const hop: any = { name: 'Cascade', hopVarietyId: 'cascade', hopLotId: 'lot', stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 20, timeMin: 10 };
    expect(patchIndexedHop(hop, { name: 'Citra' })).toMatchObject({ hopVarietyId: undefined, hopLotId: undefined });
    expect(patchIndexedHop(hop, { stage: 'whirlpool' })).toMatchObject({ aromaTiming: undefined, aromaContactHours: undefined, aromaTemperatureC: undefined });
    expect(patchIndexedHop({ ...hop, stage: 'boil' }, { timeMin: 30 }).aromaContactHours).toBeUndefined();
    expect(patchIndexedHop(hop, { weightG: 120 })).toMatchObject({ hopVarietyId: 'cascade', aromaContactHours: 48 });
  });
  const recipe: any = { volumeL: 20, yeast: { hopIndexId: 'yeast-test' }, hopMatrixId: 'fixture-beer', hops: [{ name: 'Témoin', hopVarietyId: 'test-variety', weightG: 80, stage: 'dryHop', dayOffset: 3, aromaTemperatureC: 20, aromaContactHours: 48 }] };
  it('un jour de dry-hop ne prouve pas la phase physiologique de fermentation', () => {
    expect(hopTripletsOfRecipe(recipe)[0]).toMatchObject({ timing: null, doseGL: 4 });
    const firstWort = { ...recipe, hops: [{ ...recipe.hops[0], stage: 'firstWort' }] };
    expect(hopTripletsOfRecipe(firstWort)[0].timing).toBe('firstWort');
  });
  it('le journal modifie dose et contact terminé, en préservant les identités et le plan', () => {
    const boiled = { ...recipe, hops: [{ ...recipe.hops[0], stage: 'boil' }] };
    const actual = recipeForHopAnalysis(boiled, { boilStartedAt: 1000, boilFinishedAt: 3601000, additions: { 'hop-0': { amount: 100, doneAt: 1801000 } } });
    expect(hopTripletsOfRecipe(actual)[0]).toMatchObject({ doseGL: 5, contactHours: 0.5, varietyId: 'test-variety' });
    expect(boiled.hops[0].weightG).toBe(80);
  });
  it('un domaine expérimental non renseigné n’est pas interprété comme universel', () => {
    const data = testHopData(); (data.knowledge.find(k => k.kind === 'model') as any).scope.contactHours = null;
    expect(predictHopTriplet(testHopTriplet, target, data).score.range).toBeNull();
  });
});
describe('Alertes et comparaison indépendantes du score', () => {
  const risk: HopRiskPolicy = { id: 'creep', kind: 'risk', risk: 'hopCreep', name: 'Hop creep', enabled: true, source: hopTestSource, advice: 'Suivre la densité.' };
  it.each(['3mhGsh', '3mhCys', '4mmpCys'] as const)('β-lyase positive ne certifie pas le rendement de %s dans le milieu', analyte => {
    const policy: HopRiskPolicy = { ...risk, id: 'precursor-test', risk: 'precursors', matrixId: 'fixture-beer', analyte, unit: 'ugKg', basis: 'asIs', threshold: { range: { min: 9, max: 10 }, source: hopTestSource } };
    const d = testHopData([policy]), yeast = d.knowledge.find(k => k.kind === 'yeast');
    if (yeast?.kind !== 'yeast') throw Error('Fixture invalide'); yeast.betaLyase = 'positive';
    d.varieties[0].analysis.push({ analyte, unit: 'ugKg', basis: 'asIs', kind: 'range', range: { min: 11, max: 12 }, confidence: 'medium', source: hopTestSource });
    expect(predictHopTriplet(testHopTriplet, target, d).risks[0]).toMatchObject({ status: 'possible', message: expect.stringContaining('rendement dans ce milieu non établis') });
    d.varieties[0].analysis.at(-1)!.unit = 'ugKgThiolEquivalent';
    expect(predictHopTriplet(testHopTriplet, target, d).risks[0].status).toBe('unknown');
  });
  it('un risque reste visible lorsque le score est inconnu', () => {
    const result = predictHopTriplet({ ...testHopTriplet, yeastId: null }, target, testHopData([risk]));
    expect(result.score.range).toBeNull(); expect(result.risks[0].status).toBe('possible');
  });
  it('4MMP reste non évaluable sans seuil sourcé et contextuel', () => {
    const result = predictHopTriplet(testHopTriplet, target, testHopData([{ ...risk, id: '4mmp', risk: 'fourMmp' }]));
    expect(result.risks[0].status).toBe('unknown');
  });
  it('un excès documenté de 4MMP est signalé uniquement dans sa matrice de bière', () => {
    const policy: HopRiskPolicy = { ...risk, id: '4mmp-test', risk: 'fourMmp', matrixId: 'fixture-beer', analyte: '4mmpFree', unit: 'ngL', basis: 'beer', threshold: { range: { min: 9, max: 10 }, source: hopTestSource } };
    const data = testHopData([policy]), model = data.knowledge.find(k => k.kind === 'model') as ReturnType<typeof testHopModel>;
    model.outputs.push({ target: 'beer:4mmpFree', envelope: { range: { min: 11, max: 14 }, source: hopTestSource } });
    expect(predictHopTriplet(testHopTriplet, target, data).risks[0]).toMatchObject({ status: 'flagged', confidence: 'medium' });
    expect(predictHopTriplet({ ...testHopTriplet, matrixId: 'other-beer' }, target, data).risks[0].status).toBe('unknown');
  });
  it('des précurseurs élevés ne sont comparés que dans la même unité et base', () => {
    const policy: HopRiskPolicy = { ...risk, id: 'precursor-test', risk: 'precursors', matrixId: 'fixture-beer', analyte: '3mhCys', unit: 'ugKg', basis: 'asIs', threshold: { range: { min: 9, max: 10 }, source: hopTestSource } };
    const data = testHopData([policy]), yeast = data.knowledge.find(k => k.kind === 'yeast');
    if (yeast?.kind !== 'yeast') throw Error('Fixture invalide'); yeast.betaLyase = 'negative';
    data.varieties[0].analysis.push({ analyte: '3mhCys', unit: 'ugKg', basis: 'asIs', kind: 'range', range: { min: 11, max: 12 }, confidence: 'medium', source: hopTestSource });
    expect(predictHopTriplet(testHopTriplet, target, data).risks[0].status).toBe('flagged');
    yeast.betaLyase = 'unknown'; expect(predictHopTriplet(testHopTriplet, target, data).risks[0].status).toBe('possible');
    data.varieties[0].analysis.at(-1)!.basis = 'dryMatter'; expect(predictHopTriplet(testHopTriplet, target, data).risks[0].status).toBe('unknown');
  });
  it('l’écart dégusté conserve les deux marges et refuse une autre version d’axe', () => {
    const prediction = predictHopTriplet(testHopTriplet, target, testHopData());
    const tasting: any = { axes: [{ axis: testHopAxis, perceived: { min: 8, max: 9 }, confidence: 'medium' }] };
    const result = compareHopTasting(tasting, prediction, [testHopAxis]);
    expect(result[0].gap!.min).toBeCloseTo(-1.2); expect(result[0].gap!.max).toBeCloseTo(4.2);
    expect(compareHopTasting(tasting, prediction, [{ ...testHopAxis, version: '2' }])[0].gap).toBeNull();
  });
});
