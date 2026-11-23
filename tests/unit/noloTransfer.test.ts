import { describe, expect, it } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import { readRecipeFields, readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { normalizeRecipeImport } from '../../src/domain/recipeImport';
import { evaluateNoloRecipe, newNoloConfig, noloInput, noloPlanningSource, noloScience } from '../../src/domain/nolo';
import { noloInputBasis } from '../../functions/src/noloCore';
import { noloScenarioBasis } from '../../functions/src/noloScenario';
import { noloToolContext } from '../../src/domain/noloToolContext';
import { fruitSugarOperation } from '../../src/domain/noloBrewTools';
import type { Recipe } from '../../src/types';

const range = (min: number, max = min) => ({ min, max });
function completeNoloRecipe(): Recipe {
  const recipe: Recipe = {
    ...structuredClone(fullRecipe), name: 'Pilote NOLO · fruit et restitution',
    volumeL: 30, totalGristKg: 1.5, ogTarget: 1.009, fgTarget: null, abvTarget: null,
    fermentables: [
      { kind: 'grain', use: 'empatage', name: 'Pils', weightKg: 1.5, potentialPpg: 37, pct: 100 },
      // This is the insertion order produced by the fruit tool, unlike the text schema.
      { kind: 'fruit', use: 'fermentation', name: 'Purée de mangue', weightKg: 1.25, dayOffset: 4 }
    ],
    hops: [], yeast: { name: 'LA-01', form: 'sèche', qty: 15, unit: 'g' },
    fermentation: [{ kind: 'primaire', name: 'Pilote', tempC: 20, days: 5 }],
    mash: { ...fullRecipe.mash, steps: [{ name: 'Palier', tempC: 72, durationMin: 30 }] },
    waterPlan: undefined,
    nolo: { ...newNoloConfig(), process: 'restored', orientation: 'banana',
      wort: { ogPlato: range(2.1, 2.3), sugarsGL: { glucose: range(1, 1.2), fructose: null }, sugarsComplete: false },
      scienceSnapshot: structuredClone(noloScience()!),
      planning: { version: 1, source: noloPlanningSource, exactExtract: true,
        aromaTransfer: { axes: { banana: range(.3, .6) }, source: noloPlanningSource } },
      equipment: ['Maîtrise thermique'],
      stabilization: { method: 'Validation pilote à établir', validationReference: '', storage: 'Froid' },
      trials: [{ id: 'glass-1', name: 'Comparaison avec témoin', volumeL: .1, product: 'Extrait',
        composition: 'Support indiqué par le fournisseur', dosageML: .12, carrierAbvPct: range(40),
        moment: 'Avant conditionnement', tasting: 'Fruit perceptible\nComparer après repos', comparator: 'Sans ajout' }],
      brewTools: { version: 1, attenuationPct: range(20, 30), reserveAbvPct: .1, simulationSg: 1.008,
        baseMode: 'hypothesis', baseAbvPct: range(.25, .35), additionKind: 'aroma', additionName: 'Extrait pilote',
        fruitRecipeIndex: null, fruitKg: null, fruitSugarGPer100G: 12, fruitVolumeL: null,
        primingGL: 0, primingSugar: 'sucrose', aromaML: 36, carrierAbvPct: 40, aromaSugarG: 0,
        blendVolumeL: 0, blendAbvPct: null, blendSugarGL: null, waterL: 2, initialIbu: 12,
        capacityL: 40, benchSampleML: 100, benchDoseML: .12,
        trialOgSg: 1.01, trialFgSg: 1.007, readingToleranceSg: .0002 }
    }
  };
  const fruit = fruitSugarOperation({ id: 'fruit-1', name: 'Purée de mangue', fruitKg: 1.25, sugarsGPer100G: 12, addedVolumeL: 1.1 }).value!;
  recipe.nolo!.operations = [{ ...fruit, recipeAddition: { index: 1, basis: JSON.stringify(recipe.fermentables[1]) } },
    { id: 'aroma-1', name: 'Extrait pilote', kind: 'aroma', volumeML: 36, carrierAbvPct: range(40), sugarG: range(0), composition: 'Support alcoolique documenté', moment: 'Après fruit' },
    { id: 'water-1', name: 'Eau de dilution', kind: 'dilution', volumeL: 2 }];
  recipe.nolo!.inactiveOperations = [{ process: 'dealcoholized', index: 1,
    operation: { id: 'removal-1', kind: 'removal', name: 'Essai non retenu', ethanolRemovedPct: range(80, 90), finalVolumeL: 30, source: 'Hypothèse pilote' } }];
  recipe.nolo!.measurements = [
    { id: 'lab-primary', stage: 'primary', date: '2026-09-11', method: 'Laboratoire', abvPct: range(.21, .25), volumeL: 31.1,
      ph: 4.1, sg: 1.006, sugarsGL: {}, sugarsComplete: true, afterOperationId: 'fruit-1',
      basis: noloScenarioBasis(noloInput(recipe), 'fruit-1') },
    { id: 'lab-final', stage: 'packaged', date: '2026-09-12', method: 'Laboratoire · incertitude fournie',
      abvPct: range(.24, .28), volumeL: 33.136, co2Vol: 2.1, sugarsGL: {}, sugarsComplete: true,
      afterOperationId: 'water-1', basis: noloScenarioBasis(noloInput(recipe), 'water-1') }
  ];
  recipe.nolo!.brewTools!.baseBasis = noloToolContext(recipe);
  recipe.nolo!.brewTools!.ibuBasis = noloToolContext(recipe);
  return recipe;
}

describe('Transfert NOLO complet et références contextuelles', () => {
  it('conserve données, zéros, inconnues et essais puis rejoue le même bilan après copie', () => {
    const recipe = completeNoloRecipe(), before = structuredClone(recipe);
    const original = evaluateNoloRecipe(recipe)!;
    expect(original.measuredPackaged).toBe(true);
    const text = writeRecipeText(recipe), imported = readRecipeText(text)!;
    expect(imported.nolo!.trials).toEqual(recipe.nolo!.trials);
    expect(imported.nolo!.scienceSnapshot).toEqual(recipe.nolo!.scienceSnapshot);
    expect(imported.nolo!.inactiveOperations).toEqual(recipe.nolo!.inactiveOperations);
    expect(imported.nolo!.brewTools).toMatchObject({ fruitKg: null, primingGL: 0, aromaSugarG: 0, initialIbu: 12 });
    expect(imported.nolo!.measurements.map(({ basis: _, ...measurement }) => measurement))
      .toEqual(recipe.nolo!.measurements.map(({ basis: _, ...measurement }) => measurement));
    expect(noloInput(imported).untrackedFermentationAdditions).toBe(false);
    expect(evaluateNoloRecipe(imported)).toEqual({ ...original, activeOperations: imported.nolo!.operations });
    expect(imported.nolo!.brewTools!.baseBasis).toBe(noloToolContext(imported));
    expect(imported.nolo!.brewTools!.ibuBasis).toBe(noloToolContext(imported));
    expect(normalizeRecipeImport(imported, 'local', true).nolo).toEqual(imported.nolo);
    expect(writeRecipeText(imported)).toBe(text);
    expect(recipe).toEqual(before);
  });

  it('conserve aussi les analyses anciennes encore compatibles, sans raviver les références périmées', () => {
    const recipe = completeNoloRecipe();
    recipe.nolo!.measurements[1].basis = noloInputBasis(noloInput(recipe), 'water-1');
    recipe.nolo!.measurements[0].basis = 'ancien scénario';
    recipe.nolo!.brewTools!.baseBasis = 'ancienne hypothèse';
    const imported = readRecipeText(writeRecipeText(recipe))!;
    expect(evaluateNoloRecipe(imported)!.measuredPackaged).toBe(true);
    expect(imported.nolo!.measurements[0].basis).toBe('ancien scénario');
    expect(imported.nolo!.brewTools!.baseBasis).toBe('ancienne hypothèse');
  });

  it('conserve la souche explicitement associée sans en déduire une autre de son nom', () => {
    for (const name of ['LA-01', 'Ma souche locale']) {
      const recipe = completeNoloRecipe();
      recipe.yeast = { ...recipe.yeast, name, hopIndexId: 'yeast-fermentis-safbrew-la-01' };
      recipe.nolo!.measurements[1].basis = noloScenarioBasis(noloInput(recipe), 'water-1');
      const imported = readRecipeText(writeRecipeText(recipe))!;
      expect(imported.yeast.hopIndexId).toBe('yeast-fermentis-safbrew-la-01');
      expect(evaluateNoloRecipe(imported)!.measuredPackaged).toBe(true);
      expect(imported.nolo!.measurements[1].abvPct).toEqual(range(.24, .28));
    }
  });

  it('un fruit changé reste non suivi et une recette modifiée ne réutilise aucune analyse ancienne', () => {
    const recipe = completeNoloRecipe(); recipe.fermentables[1].weightKg = 2;
    const imported = readRecipeText(writeRecipeText(recipe))!;
    expect(noloInput(imported).untrackedFermentationAdditions).toBe(true);
    expect(evaluateNoloRecipe(imported)!.measuredPackaged).toBe(false);
    expect(imported.nolo!.operations[0]).toEqual(recipe.nolo!.operations[0]);
    expect(imported.nolo!.measurements).toEqual(recipe.nolo!.measurements);
  });

  it.each([
    ['version inconnue', (recipe: Recipe) => { recipe.nolo!.version = 2 as any; }],
    ['plage inversée', (recipe: Recipe) => { recipe.nolo!.brewTools!.attenuationPct = range(40, 20); }],
    ['masse non finie', (recipe: Recipe) => { recipe.nolo!.brewTools!.fruitKg = Infinity; }],
    ['sucre non reconnu', (recipe: Recipe) => { (recipe.nolo!.operations[0] as any).sugarsG = { inconnu: range(5) }; }],
    ['identité répétée', (recipe: Recipe) => { recipe.nolo!.operations[1].id = 'fruit-1'; }],
    ['lien fruit invalide', (recipe: Recipe) => { (recipe.nolo!.operations[0] as any).recipeAddition.index = -1; }]
  ])('rejette %s à toutes les frontières sans supprimer discrètement le mode NOLO', (_name, damage) => {
    const valid = completeNoloRecipe(), invalid = structuredClone(valid); damage(invalid);
    expect(() => writeRecipeText(invalid)).toThrow(/NOLO/);
    expect(() => readRecipeFields(invalid)).toThrow(/NOLO/);
    expect(() => normalizeRecipeImport(invalid, 'ia')).toThrow(/NOLO/);
    // Infinity is deliberately kept as an invalid JSON numeric token on this boundary.
    const raw = JSON.stringify(invalid.nolo, (_key, value) => value === Infinity ? '__INFINITY__' : value).replace('"__INFINITY__"', '1e309');
    const damagedText = writeRecipeText(valid).replace(/^Configuration NOLO versionnée : .*$/m, `Configuration NOLO versionnée : ${raw}`);
    expect(() => readRecipeText(damagedText)).toThrow(/NOLO/);
  });
});
