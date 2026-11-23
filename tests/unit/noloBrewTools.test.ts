import { describe, expect, it } from 'vitest';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import { assertNoloConfig, type NoloOperation, type NoloScience } from '../../functions/src/noloSchema';
import currentScience from '../../src/data/noloScenarioBootstrap.json';
import { newNoloConfig, noloPlanningSource } from '../../src/domain/nolo';
import { BrewingMath } from '../../src/services/brewingMath';
import type { Recipe } from '../../src/types';
import {
  additionImpact, analyzeGravityTrial, applyNoloWortSg, aromaOperation, dilutionTool, fruitSugarOperation,
  noloVolumeAfterOperations, primingSugarOperation, scaleBenchTrial, wortTool,
  type NoloDilutionInput, type NoloWortInput, type ToolResult
} from '../../src/domain/noloBrewTools';
import { fullRecipe } from '../fixtures/fullRecipe';

const science = currentScience[0] as NoloScience;
const r = (min: number, max = min): HopRange => ({ min, max });
function value<T>(result: ToolResult<T>): T {
  expect(result.issue).toBeNull();
  expect(result.value).not.toBeNull();
  return result.value!;
}
function recipe(): Recipe {
  return { ...structuredClone(fullRecipe), volumeL: 30, efficiencyPct: 75, brewhouse: undefined,
    nolo: newNoloConfig(), totalGristKg: 2,
    fermentables: [
      { name: 'Pils', kind: 'grain' as const, use: 'empatage' as const, weightKg: 1.8, potentialPpg: 37, pct: 90 },
      { name: 'Caramalt', kind: 'grain' as const, use: 'empatage' as const, weightKg: .2, potentialPpg: 32, pct: 10 },
      { name: 'Saccharose', kind: 'sucre' as const, use: 'ebullition' as const, weightKg: .1, potentialPpg: 46 },
      { name: 'Lactose', kind: 'lactose' as const, use: 'ebullition' as const, weightKg: .05, potentialPpg: 44, fermentabilityPct: 0 },
      { name: 'Fruit tardif', kind: 'fruit' as const, use: 'fermentation' as const, weightKg: 1.5, dayOffset: 4 },
      { name: 'Ligne vide', kind: 'grain' as const, use: 'empatage' as const, weightKg: 0 }
    ] };
}
const wortInput: NoloWortInput = { targetAbvPct: .5, reserveAbvPct: .1, attenuationPct: r(20, 30), simulationSg: 1.01 };
const dilutionInput: NoloDilutionInput = { baseVolumeL: 30, baseAbvPct: r(.5, .6), targetAbvPct: .5, waterL: 6 };
const fruitInput = { id: 'fruit', name: 'Purée', fruitKg: 1.5, sugarsGPer100G: 10, addedVolumeL: 1.4 };
const primeInput = { id: 'prime', name: 'Resucrage', doseGL: 100 / 30, beerVolumeL: 30, sugar: 'sucrose' as const };
const aromaInput = { id: 'aroma', name: 'Produit aromatique', doseML: 30, carrierAbvPct: r(40), sugarG: 2 };

describe('Dimensionnement du moût NOLO : hypothèses explicites et extrait exact', () => {
  it('réserve 0,1 point pour les ajouts et borne l’OG à l’atténuation haute', () => {
    const out = value(wortTool(recipe(), wortInput, science));
    expect(out.wortBudgetAbvPct).toBe(.4);
    expect(out.maxSg).toBeCloseTo(1.0101587301587302, 13);
    expect(out.simulationAbvPct!.min).toBeCloseTo(.2625, 12);
    expect(out.simulationAbvPct!.max).toBeCloseTo(.39375, 12);
    // 61.55 PPG·kg extracted across 30 L, using the project's unit conversions.
    // Includes kettle sugar/lactose at 100 % extraction, excludes later fruit.
    expect(out.currentSg).toBeCloseTo(1.0171219881172138, 14);
    expect(out.currentSg).not.toBe(1.0171);
    const limit = out.curve.find(p => p.sg === out.maxSg)!;
    expect(limit.abvPct.max).toBeCloseTo(.4, 12);
    expect(out.curve[0]).toEqual({ sg: 1, abvPct: r(0) });
    expect(out.curve.every((point, i) => !i || point.sg > out.curve[i - 1].sg)).toBe(true);
  });

  it('continue de préparer une recette vide sans inventer son OG actuelle', () => {
    const empty = recipe(); empty.fermentables = [];
    const out = value(wortTool(empty, { ...wortInput, simulationSg: null }, science));
    expect(out.maxSg).toBeCloseTo(1.0101587301587302, 13);
    expect(out.currentSg).toBeNull(); expect(out.currentAbvPct).toBeNull();
    expect(out.scaleFactor).toBeNull(); expect(out.simulationAbvPct).toBeNull();
    expect(out.currentIssue).toContain('fermentescibles');
    expect(out.curve.length).toBeGreaterThan(1);
  });

  it('garde une hypothèse de SG simulable si un malt ou le rendement est inconnu', () => {
    const unknownPpg = recipe(); delete unknownPpg.fermentables[0].potentialPpg;
    const ppg = value(wortTool(unknownPpg, wortInput, science));
    expect(ppg.currentSg).toBeNull(); expect(ppg.currentIssue).toContain('Pils');
    expect(ppg.simulationAbvPct!.max).toBeCloseTo(.39375, 12);
    const unknownYield = recipe(); delete unknownYield.efficiencyPct;
    const efficiency = value(wortTool(unknownYield, wortInput, science));
    expect(efficiency.currentSg).toBeNull(); expect(efficiency.currentIssue).toContain('rendement');
    expect(efficiency.maxSg).toBe(ppg.maxSg);
    unknownYield.brewhouse = { id: 'pilot', name: 'Pilote 30 L', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 8, deadSpaceL: 0, mashRatioLPerKg: 3 };
    expect(value(wortTool(unknownYield, wortInput, science)).currentSg).not.toBeNull();
  });

  it('utilise le facteur de l’édition scientifique sélectionnée, sans constante cachée', () => {
    const changed = structuredClone(science); changed.planningModels!.sgAbvFactor.value = 200;
    const out = value(wortTool(recipe(), wortInput, changed));
    expect(out.maxSg).toBeCloseTo(1 + .4 / 60, 14);
    expect(out.simulationAbvPct!.max).toBeCloseTo(.6, 13);
    delete changed.planningModels;
    expect(wortTool(recipe(), wortInput, changed).issue).toContain('sourcée');
  });

  it('ne suppose pas un rendement d’empâtage pour une recette tout extrait/sucre', () => {
    const extract = recipe(); extract.fermentables = extract.fermentables.filter(f => f.kind === 'sucre');
    delete extract.efficiencyPct;
    const out = value(wortTool(extract, wortInput, science));
    expect(out.currentSg).not.toBeNull(); expect(out.currentIssue).toBeNull();
  });

  it('accepte zéro cible ou zéro atténuation basse sans division par zéro', () => {
    const zeroBudget = value(wortTool(recipe(), { ...wortInput, targetAbvPct: 0, reserveAbvPct: 0, attenuationPct: r(0, 30) }, science));
    expect(zeroBudget.maxSg).toBe(1); expect(zeroBudget.scaleFactor).toBe(0);
    expect(zeroBudget.simulationAbvPct!.min).toBe(0);
    expect(wortTool(recipe(), { ...wortInput, attenuationPct: r(0) }, science).issue).toContain('OG maximale');
  });

  it.each([
    { targetAbvPct: null }, { reserveAbvPct: null }, { attenuationPct: null },
    { targetAbvPct: NaN }, { reserveAbvPct: Infinity }, { reserveAbvPct: .6 },
    { attenuationPct: r(30, 20) }, { attenuationPct: r(-1, 30) }, { attenuationPct: r(10, 101) },
    { simulationSg: NaN }, { simulationSg: Infinity }, { simulationSg: .999 }
  ])('signale l’entrée absente ou invalide %j sans lancer d’exception', patch => {
    const out = wortTool(recipe(), { ...wortInput, ...patch }, science);
    expect(out.value).toBeNull(); expect(out.issue).toBeTruthy();
  });

  it('refuse de recalculer ou redimensionner les drêches par un nouveau rendement', () => {
    const spent = recipe(); spent.nolo.process = 'secondRunnings';
    const out = value(wortTool(spent, wortInput, science));
    expect(out.currentSg).toBeNull(); expect(out.currentIssue).toContain('Drêches');
    expect(applyNoloWortSg(spent, 1.008).value).toBeNull();
  });

  it('exige le rendement et la densité d’extraction à froid sans reprendre le rendement chaud', () => {
    const cold = recipe(); cold.nolo.process = 'coldExtraction';
    const out = value(wortTool(cold, wortInput, science));
    expect(out.currentSg).toBeNull(); expect(out.currentAbvPct).toBeNull(); expect(out.scaleFactor).toBeNull();
    expect(out.currentIssue).toContain('à chaud');
    expect(out.simulationAbvPct!.max).toBeCloseTo(.39375, 12);
    expect(applyNoloWortSg(cold, 1.008).value).toBeNull();
  });

  it('applique les proportions exactes de tous les apports avant fermentation en conservant le reste', () => {
    const before = recipe();
    before.nolo.measurements = [{ id: 'sg', stage: 'wort', date: '2026-09-12', method: 'Densimètre', sg: 1.017, basis: 'original' }];
    before.nolo.planning = { version: 1, source: noloPlanningSource, stopAttenuationPct: r(25) };
    before.nolo.operations = [value(fruitSugarOperation(fruitInput))];
    const preserved = structuredClone(before);
    const scaled = value(applyNoloWortSg(before, 1.009));
    const multiplier = .009 / .0171219881172138;
    for (let index = 0; index < 4; index++)
      expect(scaled.fermentables[index].weightKg).toBeCloseTo(before.fermentables[index].weightKg * multiplier, 12);
    expect(scaled.fermentables[4]).toEqual(before.fermentables[4]);
    expect(scaled.fermentables[5]).toEqual(before.fermentables[5]);
    expect(scaled.totalGristKg).toBeCloseTo(2 * multiplier, 12);
    expect(scaled.fermentables[0].weightKg / scaled.fermentables[1].weightKg).toBeCloseTo(9, 12);
    expect(scaled.nolo.planning).toEqual({ ...before.nolo.planning, exactExtract: true });
    expect(scaled.nolo.measurements).toEqual(before.nolo.measurements);
    expect(scaled.nolo.operations).toEqual(before.nolo.operations);
    expect(scaled.nolo.wort).toEqual(before.nolo.wort);
    expect(scaled.hops).toEqual(before.hops); expect(scaled.waterPlan).toEqual(before.waterPlan);
    expect(scaled.mash).toEqual(before.mash); expect(scaled.fermentation).toEqual(before.fermentation);
    expect(scaled.yeast).toEqual(before.yeast); expect(scaled.fgTarget).toBe(before.fgTarget);
    expect(scaled.ogTarget).toBe(1.009); expect(before).toEqual(preserved);
    const points = BrewingMath.extractPoints(scaled.fermentables.filter(f => f.use !== 'fermentation'), 30, 75, 'full')!;
    expect(1 + points.total / 1000).toBeCloseTo(1.009, 14);
    const reapplied = value(applyNoloWortSg(scaled, 1.009));
    expect(reapplied.fermentables).toEqual(scaled.fermentables);
  });

  it('conserve les petites masses utiles et autorise une cible SG 1 explicite', () => {
    const tiny = value(applyNoloWortSg(recipe(), 1.000001));
    expect(tiny.fermentables[3].weightKg).toBeGreaterThan(0);
    expect(tiny.fermentables[3].weightKg).toBeLessThan(.0001);
    const zero = value(applyNoloWortSg(recipe(), 1));
    expect(zero.fermentables.slice(0, 4).every(f => f.weightKg === 0)).toBe(true);
    expect(zero.fermentables[4].weightKg).toBe(1.5);
    expect(zero.totalGristKg).toBe(0);
    expect(applyNoloWortSg(recipe(), null).value).toBeNull();
    expect(applyNoloWortSg(recipe(), NaN).value).toBeNull();
  });
});

describe('Ajouts NOLO : sucres, support aromatique et conservation de la matière', () => {
  it('convertit une vraie fiche fruit en masse de sucres sans lui attribuer une espèce ni un volume', () => {
    const fruit = value(fruitSugarOperation(fruitInput));
    expect(fruit.sugarsG).toEqual({}); expect(fruit.unclassifiedSugarG).toEqual(r(150));
    expect(fruit.volumeL).toBe(1.4); expect(fruit.complete).toBe(true);
    const out = value(additionImpact({ baseVolumeL: 30, baseAbvPct: r(.3, .4), targetAbvPct: .5, operation: fruit }, science));
    expect(out.finalVolumeL).toBe(31.4); expect(out.sugarG).toEqual(r(150));
    expect(out.abvPct.min).toBeCloseTo(.3 * 30 / 31.4, 13);
    // Conservative unknown-sugar maximum: 150 g × 0.5479586076424041 g/g.
    expect(out.abvPct.max).toBeCloseTo(.7138310884354788, 13);
    expect(out.addedAlcoholAbvPct.min).toBe(0);
    expect(out.addedAlcoholAbvPct.max).toBeCloseTo(150 * .5479586076424041 / 789.24 / 31.4 * 100, 13);
    expect(out.marginAbvPct).toBeCloseTo(-.2138310884354788, 13);
  });

  it('distingue le rendement physique du saccharose et du glucose pur au resucrage', () => {
    const sucrose = value(primingSugarOperation(primeInput));
    const glucose = value(primingSugarOperation({ ...primeInput, sugar: 'glucose' }));
    expect(sucrose.sugarsG).toEqual({ sucrose: r(100) }); expect(sucrose.volumeL).toBe(0);
    const project = (operation: NoloOperation) => value(additionImpact({ baseVolumeL: 30, baseAbvPct: r(.3, .4), targetAbvPct: .5, operation }, science));
    const sugar = project(sucrose), hexose = project(glucose);
    expect(sugar.abvPct.min).toBeCloseTo(.3, 14);
    expect(sugar.abvPct.max).toBeCloseTo(.6273687225425381, 13);
    expect(hexose.abvPct.max).toBeCloseTo(.4 + 100 * .5114286583374353 / 789.24 / 30 * 100, 13);
    expect(hexose.abvPct.max).toBeLessThan(sugar.abvPct.max);
  });

  it('compte les mL d’arôme dans le volume et sépare le support alcoolique des sucres susceptibles de fermenter', () => {
    const operation = value(aromaOperation(aromaInput));
    const out = value(additionImpact({ baseVolumeL: 30, baseAbvPct: r(.4), targetAbvPct: .5, operation }, science));
    expect(out.finalVolumeL).toBe(30.03);
    // 120 mL ethanol in beer + 12 mL carrier ethanol, in 30.03 L final beer.
    expect(out.abvPct.min).toBeCloseTo(.132 / 30.03 * 100, 13);
    expect(out.abvPct.max).toBeCloseTo((.132 + 2 * .5479586076424041 / 789.24) / 30.03 * 100, 13);
    expect(out.sugarG).toEqual(r(2));
    expect(out.addedAlcoholAbvPct.min).toBeCloseTo(.012 / 30.03 * 100, 13);
    expect(out.abvPct.min - .4 * 30 / 30.03).toBeCloseTo(out.addedAlcoholAbvPct.min, 13);
  });

  it('réutilise les coefficients sélectionnés et conserve les plages de sucres', () => {
    const changed = structuredClone(science);
    changed.ethanolDensityGL.value = 1000;
    changed.ethanolMaxGPerG.glucose.value = .5;
    const operation: NoloOperation = { id: 'glucose', name: 'Glucose', kind: 'sugar', volumeL: 0, complete: true, sugarsG: { glucose: r(80, 120) } };
    const out = value(additionImpact({ baseVolumeL: 30, baseAbvPct: r(.3, .4), targetAbvPct: .5, operation }, changed));
    expect(out.abvPct.min).toBeCloseTo(.3, 14); expect(out.abvPct.max).toBeCloseTo(.6, 14);
    expect(out.sugarG).toEqual(r(80, 120));
    expect(out.addedAlcoholAbvPct.min).toBe(0); expect(out.addedAlcoholAbvPct.max).toBeCloseTo(.2, 14);
  });

  it('ne traite pas une composition, une dose ou un volume absent comme zéro', () => {
    expect(fruitSugarOperation({ ...fruitInput, sugarsGPer100G: null }).value).toBeNull();
    expect(fruitSugarOperation({ ...fruitInput, addedVolumeL: null }).value).toBeNull();
    expect(fruitSugarOperation({ ...fruitInput, fruitKg: NaN }).value).toBeNull();
    expect(fruitSugarOperation({ ...fruitInput, sugarsGPer100G: 101 }).value).toBeNull();
    expect(primingSugarOperation({ ...primeInput, doseGL: null }).value).toBeNull();
    expect(primingSugarOperation({ ...primeInput, beerVolumeL: 0 }).value).toBeNull();
    expect(aromaOperation({ ...aromaInput, carrierAbvPct: null }).value).toBeNull();
    expect(aromaOperation({ ...aromaInput, sugarG: null }).value).toBeNull();
    expect(aromaOperation({ ...aromaInput, doseML: NaN }).value).toBeNull();
    expect(aromaOperation({ ...aromaInput, carrierAbvPct: r(45, 40) }).value).toBeNull();
    expect(aromaOperation({ ...aromaInput, doseML: 0 }).value).toBeNull();
    const unknown: NoloOperation = { id: 'unknown', kind: 'sugar', name: 'Inconnu', volumeL: 0, sugarsG: {}, complete: false };
    expect(additionImpact({ baseVolumeL: 30, baseAbvPct: r(.3), targetAbvPct: .5, operation: unknown }, science).value).toBeNull();
    expect(additionImpact({ baseVolumeL: 30, baseAbvPct: null, targetAbvPct: .5, operation: value(fruitSugarOperation(fruitInput)) }, science).value).toBeNull();
  });

  it('signale un profil partiellement connu ou contradictoire et accepte les zéros explicites', () => {
    const sugar = value(primingSugarOperation({ ...primeInput, doseGL: 0 }));
    const zero = value(additionImpact({ baseVolumeL: 30, baseAbvPct: r(0), targetAbvPct: 0, operation: sugar }, science));
    expect(zero.abvPct).toEqual(r(0)); expect(zero.marginAbvPct).toBe(0);
    expect(additionImpact({ baseVolumeL: 30, baseAbvPct: r(.3), targetAbvPct: .5,
      operation: { ...sugar, sugarsG: { glucose: null } } }, science).value).toBeNull();
    expect(additionImpact({ baseVolumeL: 30, baseAbvPct: r(.3), targetAbvPct: .5,
      operation: { ...sugar, unclassifiedSugarG: null } }, science).value).toBeNull();
    const contradictory = { ...value(aromaOperation(aromaInput)), compositionBound: { massG: 1, inertMassPct: r(0), source: noloPlanningSource } };
    const out = additionImpact({ baseVolumeL: 30, baseAbvPct: r(.3), targetAbvPct: .5, operation: contradictory }, science);
    expect(out.value).toBeNull(); expect(out.issue).toContain('contradictoire');
  });

  it('produit des opérations acceptées par le schéma existant, sans altérer les anciennes mesures', () => {
    const config = newNoloConfig();
    config.operations = [value(fruitSugarOperation(fruitInput)), value(primingSugarOperation(primeInput)), value(aromaOperation(aromaInput))];
    expect(() => assertNoloConfig(config)).not.toThrow();
  });
});

describe('Dilution NOLO : borne haute, volumes déjà traités et capacité', () => {
  it('calcule 6 L d’eau pour 30 L à 0,5–0,6 % puis conserve alcool et concentration IBU', () => {
    const out = value(dilutionTool({ ...dilutionInput, initialIbu: 24, capacityL: 35 }));
    expect(out.requiredWaterL).toBe(6); expect(out.requiredIssue).toBeNull();
    expect(out.finalVolumeL).toBe(36); expect(out.abvPct).toEqual(r(5 / 12, .5));
    expect(out.beerFractionPct).toBeCloseTo(83.33333333333333, 12); expect(out.ibu).toBe(20);
    expect(out.capacityExceeded).toBe(true); expect(out.requiredCapacityExceeded).toBe(true);
    expect(out.abvPct.min * out.finalVolumeL).toBeCloseTo(.5 * 30, 13);
    expect(out.abvPct.max * out.finalVolumeL).toBeCloseTo(.6 * 30, 13);
    expect(out.curve.find(p => p.waterL === 6)?.abvPct).toEqual(out.abvPct);
  });

  it('arrondit toujours l’eau à appliquer vers le haut au centilitre', () => {
    const out = value(dilutionTool({ baseVolumeL: 30, baseAbvPct: r(.7), targetAbvPct: .45, waterL: 0, capacityL: 40 }));
    expect(out.requiredWaterL).toBe(16.67);
    expect(out.capacityExceeded).toBe(false); expect(out.requiredCapacityExceeded).toBe(true);
    const applied = value(dilutionTool({ baseVolumeL: 30, baseAbvPct: r(.7), targetAbvPct: .45, waterL: out.requiredWaterL }));
    expect(applied.abvPct.max).toBeLessThanOrEqual(.45);
    const roundedDown = value(dilutionTool({ baseVolumeL: 30, baseAbvPct: r(.7), targetAbvPct: .45, waterL: 16.66 }));
    expect(roundedDown.abvPct.max).toBeGreaterThan(.45);
  });

  it('explique une cible zéro impossible sans rendre NaN, Infinity ou une fausse dilution finie', () => {
    const out = value(dilutionTool({ ...dilutionInput, targetAbvPct: 0 }));
    expect(out.requiredWaterL).toBeNull(); expect(out.requiredIssue).toContain('Aucune quantité finie');
    expect(out.abvPct.max).toBe(.5);
    const alreadyZero = value(dilutionTool({ ...dilutionInput, baseAbvPct: r(0), targetAbvPct: 0, waterL: 0 }));
    expect(alreadyZero.requiredWaterL).toBe(0); expect(alreadyZero.abvPct).toEqual(r(0));
    expect(alreadyZero.requiredIssue).toBeNull();
  });

  it('respecte les IBU et capacités inconnus, la cible déjà atteinte et une capacité exactement suffisante', () => {
    const out = value(dilutionTool({ ...dilutionInput, baseAbvPct: r(.3, .5), waterL: 0, initialIbu: null, capacityL: 30 }));
    expect(out.requiredWaterL).toBe(0); expect(out.ibu).toBeNull(); expect(out.beerFractionPct).toBe(100);
    expect(out.capacityExceeded).toBe(false); expect(out.requiredCapacityExceeded).toBe(false);
    expect(value(dilutionTool({ ...dilutionInput, initialIbu: 0 })).ibu).toBe(0);
  });

  it.each([
    { baseVolumeL: null }, { baseVolumeL: 0 }, { baseVolumeL: NaN }, { baseAbvPct: null },
    { baseAbvPct: r(.6, .5) }, { baseAbvPct: r(.5, Infinity) }, { targetAbvPct: null },
    { waterL: null }, { waterL: -1 }, { waterL: Infinity }, { initialIbu: NaN }, { capacityL: 0 }
  ])('renvoie une explication pendant une saisie absente ou invalide %j', patch => {
    const out = dilutionTool({ ...dilutionInput, ...patch });
    expect(out.value).toBeNull(); expect(out.issue).toBeTruthy();
  });

  it('remplace le volume lors d’un retrait et rejoue chaque ajout une seule fois dans l’ordre', () => {
    const operations: NoloOperation[] = [
      { id: 'water1', name: 'Eau', kind: 'dilution', volumeL: 3 },
      value(aromaOperation({ ...aromaInput, doseML: 100 })),
      value(fruitSugarOperation({ ...fruitInput, addedVolumeL: 1.2 })),
      { id: 'removal', name: 'Traitement', kind: 'removal', finalVolumeL: 24.5, ethanolRemovedPct: r(95), source: 'Pilote' },
      { id: 'water2', name: 'Eau après traitement', kind: 'dilution', volumeL: .5 }
    ];
    expect(value(noloVolumeAfterOperations(30, operations.slice(0, 3)))).toBeCloseTo(34.3, 12);
    expect(value(noloVolumeAfterOperations(30, operations))).toBe(25);
    expect(value(noloVolumeAfterOperations(30, operations))).toBe(25);
    expect(noloVolumeAfterOperations(30, [operations[0], operations[0]]).issue).toContain('unique');
    expect(value(noloVolumeAfterOperations(30, [operations[0], { ...operations[0], id: 'other-water' }]))).toBe(36);
  });

  it('redemande les volumes manquants et reprend un volume final connu après traitement', () => {
    const missing: NoloOperation = { id: 'water', name: 'Eau', kind: 'dilution', volumeL: null };
    expect(noloVolumeAfterOperations(30, [missing]).value).toBeNull();
    expect(noloVolumeAfterOperations(null, []).value).toBeNull();
    expect(value(noloVolumeAfterOperations(null, [missing, { id: 'removal', name: 'Traitement', kind: 'removal', finalVolumeL: 25, ethanolRemovedPct: null, source: '' }]))).toBe(25);
  });

  it('utilise le volume courant et ne redemande pas une dilution déjà appliquée', () => {
    const initial = value(dilutionTool(dilutionInput));
    const operations: NoloOperation[] = [{ id: 'water', name: 'Eau déjà appliquée', kind: 'dilution', volumeL: initial.requiredWaterL }];
    const currentVolume = value(noloVolumeAfterOperations(30, operations));
    const again = value(dilutionTool({ baseVolumeL: currentVolume, baseAbvPct: initial.abvPct, targetAbvPct: .5, waterL: 0 }));
    expect(currentVolume).toBe(36); expect(again.requiredWaterL).toBe(0);
    expect(again.finalVolumeL).toBe(36); expect(again.abvPct).toEqual(initial.abvPct);
  });
});

describe('Essai sur verre NOLO : ratio produit/bière et aliquotes séparées', () => {
  it('transpose 0,6 mL dans 100 mL de bière vers 30 L en conservant la concentration finale', () => {
    const out = value(scaleBenchTrial({ sampleML: 100, doseML: .6, beerVolumeL: 30 }));
    expect(out.batchDoseML).toBe(180); expect(out.doseMLPerL).toBe(6);
    expect(out.aliquots.map(a => a.factor)).toEqual([0, .5, 1, 1.5]);
    out.aliquots.forEach((aliquot, index) => {
      expect(aliquot.sampleML).toBe(100);
      expect(aliquot.doseML).toBeCloseTo([0, .3, .6, .9][index], 14);
    });
    expect(out.batchDoseML / (30_000 + out.batchDoseML)).toBeCloseTo(.6 / 100.6, 14);
  });

  it('accepte un témoin explicite à zéro mais demande toute saisie manquante', () => {
    expect(value(scaleBenchTrial({ sampleML: 100, doseML: 0, beerVolumeL: 30 })).batchDoseML).toBe(0);
    for (const patch of [{ sampleML: 0 }, { sampleML: null }, { doseML: null }, { doseML: NaN }, { doseML: -1 }, { beerVolumeL: null }, { beerVolumeL: Infinity }]) {
      const out = scaleBenchTrial({ sampleML: 100, doseML: .6, beerVolumeL: 30, ...patch });
      expect(out.value).toBeNull(); expect(out.issue).toBeTruthy();
    }
  });
});

describe('Lecture de pilote NOLO : atténuation apparente et tolérance SG explicite', () => {
  it('relit SG 1,025 → 1,0205 à 18 % d’atténuation et 0,590625 % vol. approximatifs', () => {
    const out = value(analyzeGravityTrial({ ogSg: 1.025, fgSg: 1.0205, readingToleranceSg: 0 }, science));
    expect(out.attenuationPct.min).toBeCloseTo(18, 11);
    expect(out.attenuationPct.max).toBeCloseTo(18, 11);
    expect(out.abvPct.min).toBeCloseTo(.590625, 12);
    expect(out.abvPct.max).toBeCloseTo(.590625, 12);
  });

  it('combine les tolérances des deux lectures sans promettre une précision de laboratoire', () => {
    const out = value(analyzeGravityTrial({ ogSg: 1.025, fgSg: 1.0205, readingToleranceSg: .001 }, science));
    expect(out.abvPct.min).toBeCloseTo(.328125, 12);
    expect(out.abvPct.max).toBeCloseTo(.853125, 12);
    expect(out.attenuationPct.min).toBeCloseTo(10.41666666666667, 11);
    expect(out.attenuationPct.max).toBeCloseTo(25, 11);
  });

  it('borne l’atténuation à 0–100 uniquement quand une lecture centrale valide croise la limite avec sa tolérance', () => {
    const atZero = value(analyzeGravityTrial({ ogSg: 1.025, fgSg: 1.025, readingToleranceSg: .001 }, science));
    expect(atZero.attenuationPct.min).toBe(0); expect(atZero.abvPct.min).toBe(0);
    expect(atZero.attenuationPct.max).toBeCloseTo(100 / 13, 10);
    const atHundred = value(analyzeGravityTrial({ ogSg: 1.025, fgSg: 1, readingToleranceSg: .001 }, science));
    expect(atHundred.attenuationPct.max).toBe(100);
    expect(atHundred.attenuationPct.min).toBeCloseTo(95.833333333333, 10);
    const changed = structuredClone(science); changed.planningModels!.sgAbvFactor.value = 200;
    expect(value(analyzeGravityTrial({ ogSg: 1.025, fgSg: 1.0205, readingToleranceSg: 0 }, changed)).abvPct.max).toBeCloseTo(.9, 12);
  });

  it.each([
    { ogSg: null }, { fgSg: null }, { readingToleranceSg: null }, { ogSg: NaN }, { fgSg: Infinity },
    { ogSg: 1 }, { fgSg: .999 }, { fgSg: 1.026 }, { readingToleranceSg: -1 },
    { readingToleranceSg: .025 }, { readingToleranceSg: Infinity }
  ])('signale une lecture incohérente ou inconnue %j', patch => {
    const out = analyzeGravityTrial({ ogSg: 1.025, fgSg: 1.0205, readingToleranceSg: .001, ...patch }, science);
    expect(out.value).toBeNull(); expect(out.issue).toBeTruthy();
  });
});
