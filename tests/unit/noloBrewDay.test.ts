import { describe, expect, it } from 'vitest';
import type { NoloProcess } from '../../functions/src/noloSchema';
import type { RecipeSnapshot } from '../../src/types';
import { newNoloConfig, noloInput } from '../../src/domain/nolo';
import { noloScenarioBasis } from '../../functions/src/noloScenario';
import { NOLO_BREW_PROCESSES, noloBrewDayPlan, noloExecutionRecipe, noloStepReadings } from '../../src/domain/noloBrewDay';
import { areaOf, brewAlarms, brewIngredients, effectiveFermentables, isUsefulTimer } from '../../src/domain/brewCompanion';
import { buildTimeline } from '../../src/services/brewTimer';
import { isMash, restoreBrewDay } from '../../src/domain/brewDay';

function recipe(process: NoloProcess = 'restricted'): RecipeSnapshot {
  return {
    name: 'Pilote figé', capturedAt: '2026-09-12', volumeL: 20, ogTarget: 1.018, boilMin: 30,
    yeast: { name: 'Souche du pilote', qty: 5, unit: 'g', form: 'sèche' },
    fermentables: [
      { kind: 'grain', use: 'empatage', name: 'Grain d’origine', weightKg: 2, potentialPpg: 37 },
      { kind: 'sugar', use: 'ebullition', name: 'Sucre de cuve', weightKg: .1, potentialPpg: 46 },
      { kind: 'fruit', use: 'fermentation', name: 'Fruit', weightKg: .5, potentialPpg: 5 }
    ],
    hops: [], nolo: { ...newNoloConfig(), process },
    mash: { steps: [{ name: 'Empâtage enregistré', tempC: 67, durationMin: 55 }], mashoutTempC: 78, mashoutDurationMin: 10, spargeType: 'batch', spargeTempC: 76 },
    waterPlan: { mashWaterL: 6, spargeWaterL: 19, mash: {}, sparge: {} }
  } as RecipeSnapshot;
}

describe('NOLO · conduite propre au procédé', () => {
  it.each(Object.keys(NOLO_BREW_PROCESSES) as NoloProcess[])('propose une aide pour %s sans muter la recette', process => {
    const frozen = recipe(process), before = JSON.stringify(frozen);
    expect(noloBrewDayPlan(frozen)?.focus.length).toBeGreaterThan(20);
    buildTimeline(frozen);
    expect(JSON.stringify(frozen)).toBe(before);
  });

  it('extrait à froid sans reprendre les paliers chauds et garde la chauffe explicite', () => {
    const frozen = recipe('coldExtraction');
    frozen.waterPlan!.acid = { id: 'lactique', mash: 2, sparge: 5 };
    const execution = noloExecutionRecipe(frozen);
    expect(execution.fermentables).toEqual(frozen.fermentables);
    expect(execution.waterPlan).toBeUndefined();
    expect(execution.mash).toBeUndefined();
    expect(brewIngredients(execution).some(item => ['water', 'salt', 'acid'].includes(item.kind))).toBe(false);
    const steps = buildTimeline(frozen);
    const extraction = steps.find(step => step.id === 'nolo-extraction')!;
    expect(steps.some(step => isMash(step.id) || step.id === 'sparge')).toBe(false);
    expect(extraction).toMatchObject({ durationMin: 0 });
    expect(extraction.tempC).toBeUndefined();
    expect(isUsefulTimer(extraction)).toBe(false);
    expect(areaOf(extraction.id)).toBe('mash');
    expect(steps.filter(step => step.id.startsWith('boil-')).reduce((sum, step) => sum + step.durationMin, 0)).toBe(30);
    expect(steps.find(step => step.id === 'preboil')?.detail).not.toMatch(/absorption|6 L|19 L/);
    expect(steps.find(step => step.id === 'eau')?.detail).toMatch(/mesurer le volume/);
  });

  it('le contact à froid conserve le brassage explicitement prévu sans inventer un protocole de fermentation', () => {
    const frozen = recipe('coldContact');
    const steps = buildTimeline(frozen);
    expect(steps.find(step => step.id === 'mash-0')).toMatchObject({ tempC: 67, durationMin: 55 });
    expect(steps.find(step => step.id === 'ensemencement')?.tempC).toBeUndefined();
    expect(steps.some(step => step.id === 'nolo-extraction')).toBe(false);
  });

  it('aucune température ou durée standard NOLO quand le programme manque', () => {
    const frozen = recipe('coldContact');
    delete frozen.mash; delete frozen.boilMin;
    frozen.hops = [{ name: 'Houblon prévu', stage: 'boil', timeMin: 10, weightG: 5, alpha: 4 }];
    const steps = buildTimeline(frozen);
    expect(steps.every(step => step.tempC == null && step.durationMin === 0)).toBe(true);
    expect(steps.some(step => step.boilElapsedMin != null)).toBe(false);
    expect(noloBrewDayPlan(frozen)?.missingProgramme).toMatch(/non renseignée/);
  });

  it('la seconde extraction utilise seulement les conditions inscrites et garde les identités des ajouts postérieurs', () => {
    const frozen = recipe('secondRunnings');
    frozen.nolo!.secondRunnings = { sourceBatchId: 'LOT-source', previousExtraction: '', waterAddedL: 10,
      alkalinityPpm: null, temperatureC: 0, minutes: 25, recoveredL: null, sg: null, ph: null };
    const execution = noloExecutionRecipe(frozen), before = JSON.stringify(frozen);
    expect(execution.fermentables).toHaveLength(3);
    expect(execution.fermentables[0].weightKg).toBe(0);
    expect(execution.fermentables[1]).toEqual(frozen.fermentables[1]);
    expect(execution.fermentables[2]).toEqual(frozen.fermentables[2]);
    expect(brewIngredients(execution).find(item => item.name === 'Sucre de cuve')?.id).toBe('grain-1');
    expect(effectiveFermentables(execution, { steps: [], currentIndex: 0, additions: { 'grain-1': { amount: .2 } } })[1].weightKg).toBe(.2);
    const steps = buildTimeline(frozen), extraction = steps.find(step => step.id === 'nolo-second-runnings')!;
    expect(extraction).toMatchObject({ durationMin: 25, tempC: 0 });
    expect(steps.some(step => ['concassage', 'mash-0', 'mashout', 'sparge'].includes(step.id))).toBe(false);
    expect(isMash(extraction.id)).toBe(false);
    expect(isUsefulTimer(extraction)).toBe(true);
    const journal = { steps: [{ ...extraction, startedAt: 1000 }], currentIndex: 0, readings: [] };
    expect(brewAlarms(journal, frozen).some(alarm => alarm.stepId === extraction.id)).toBe(true);
    expect(restoreBrewDay(journal).steps).toEqual(journal.steps);
    expect(JSON.stringify(frozen)).toBe(before);
  });

  it('le plan distingue les opérations inscrites des simulations et traitements inactifs', () => {
    const frozen = recipe();
    frozen.nolo!.brewTools = { version: 1, waterL: 15, fruitKg: 8, aromaML: 200 };
    frozen.nolo!.operations = [
      { id: 'fruit', kind: 'sugar', name: 'Fruit inscrit', sugarsG: { fructose: { min: 20, max: 25 } }, complete: false, volumeL: null },
      { id: 'water', kind: 'dilution', name: 'Eau inscrite', volumeL: 2 },
      { id: 'removed', kind: 'removal', name: 'Traitement écarté', finalVolumeL: 20, ethanolRemovedPct: { min: 80, max: 90 }, source: '' }
    ];
    const plan = noloBrewDayPlan(frozen)!;
    expect(plan.operations.map(operation => operation.id)).toEqual(['fruit', 'water']);
    expect(plan.operations[0].amount).toBe('Sucres à préciser');
    expect(plan.operations[1].amount).toBe('2 L d’eau');
    expect(plan.inactiveCount).toBe(1);
    expect(plan.trials).toEqual([]);
  });

  it('une mesure d’une autre étape ou du laboratoire ne remplit pas un raccourci de mesure courant', () => {
    const step = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    const current = noloStepReadings({ steps: [step], currentIndex: 0, readings: [
      { at: 100, stepId: 'preboil', kind: 'densite', value: 1.019, unit: 'SG' },
      { at: 10, stepId: 'ensemencement', kind: 'volume', value: 18, unit: 'L' },
      { at: 5, stepId: 'ensemencement', kind: 'volume', value: 20, unit: 'L' }
    ] }, step);
    expect(current.find(item => item.kind === 'densite')?.reading).toBeUndefined();
    expect(current.find(item => item.kind === 'volume')?.reading?.value).toBe(18);
  });

  it('ne traite pas des sucres non répartis inconnus comme une masse nulle', () => {
    const frozen = recipe();
    frozen.nolo!.operations = [{ id: 'priming', kind: 'sugar', name: 'Resucrage à peser',
      sugarsG: {}, complete: true, unclassifiedSugarG: null, volumeL: 0 }];
    expect(noloBrewDayPlan(frozen)!.operations[0]).toMatchObject({ amount: 'Sucres à préciser' });
  });

  it('le repère OG suit la charge calculée et distingue une ancienne valeur annoncée', () => {
    const frozen = recipe(); frozen.efficiencyPct = 75;
    expect(noloBrewDayPlan(frozen)!.facts).toEqual(expect.arrayContaining([
      { label: 'OG calculée', value: '1,025 SG' },
      { label: 'OG annoncée à la recette', value: '1,018 SG' }
    ]));
    frozen.ogTarget = 1.025;
    expect(noloBrewDayPlan(frozen)!.facts.some(fact => fact.label === 'OG annoncée à la recette')).toBe(false);
    frozen.nolo!.process = 'coldExtraction';
    expect(noloBrewDayPlan(frozen)!.facts).toContainEqual({ label: 'OG du moût', value: 'Non renseigné' });
    expect(noloBrewDayPlan(frozen)!.facts.some(fact => fact.label === 'OG calculée')).toBe(false);
  });

  it('une observation du moût liée à la recette devient le repère inscrit et demeure distincte du journal du jour', () => {
    const frozen = recipe('coldExtraction'); frozen.efficiencyPct = 75;
    frozen.nolo!.measurements = [{ id: 'wort', stage: 'wort', date: '2026-09-12', method: 'Densimètre', sg: 1.012,
      basis: noloScenarioBasis(noloInput(frozen)) }];
    expect(noloBrewDayPlan(frozen)!.facts).toContainEqual({ label: 'OG mesurée inscrite', value: '1,012 SG' });
    const step = { id: 'nolo-extraction', label: 'Extraction', durationMin: 0 };
    const readings = noloStepReadings({ steps: [step], currentIndex: 0 }, step);
    expect(readings.find(row => row.kind === 'densite')?.reading).toBeUndefined();
    expect(readings.find(row => row.kind === 'temperature')?.reading).toBeUndefined();
    expect(readings.map(row => row.kind)).toContain('temperature');
  });
});
