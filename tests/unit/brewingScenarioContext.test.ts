import { describe, expect, it } from 'vitest';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { brewingScenarioCurrentReference, buildBrewingScenarioRequest, simulateBrewingScenario } from '../../src/domain/brewingScenario';
import { brewingScenarioViewModel } from '../../src/domain/brewingScenarioTools';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { testHopData } from '../fixtures/hopPrediction';
import { recipe } from '../fixtures/brewCompanion';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { inspectHopProgramAvailability, previewHopProgramChanges, applyHopProgramProposal } from '../../src/domain/hopDecision/programs';

function context(): BrewerContext {
  return { recipe: recipe({ sourceRecipeId: 'fixture-recipe', hops: [{ name: 'Lot témoin', hopVarietyId: 'test-variety', stage: 'boil', weightG: 20, alpha: 5, timeMin: 60 }],
      yeast: { name: 'Levure témoin', hopIndexId: 'yeast-test', form: 'sèche', qty: 1, unit: 'sachet' } }),
    hopIndex: { ...testHopData(), predictions: [], tastings: [], truncated: [] },
    now: 1_700_000_000_000, phase: 'Brouillon', inventory: [], material: [], waterSources: [], provenance: [],
    journal: { steps: [], currentIndex: 0, revision: 2, startedAt: 1000, boilStartedAt: 1000, boilFinishedAt: 3_601_000,
      additions: { 'hop-0': { amount: 0.04, unit: 'kg', doneAt: 1_801_000, temperatureC: 97 } },
      readings: [{ at: 1000, kind: 'volume', value: 18, unit: 'L', volumeBasis: 'cold' }] } };
}

describe('Préparation canonique UI et aide au brasseur', () => {
  it('relie un vrai zéro par ref jusqu’à J1 et groupe deux ajouts sans multiplier le solde', () => {
    const c = context(); c.journal = undefined;
    c.recipe.hops[0].stockItemRef = 'HOP-1';
    c.recipe.hops.push({ ...c.recipe.hops[0] });
    c.inventory = [{ id: 'id-distinct', ref: 'HOP-1', name: 'Nom quelconque', currentStock: 0, unit: 'kg' }];
    c.stockReservations = { complete: true, batches: [], source: 'localCache' };
    const before = structuredClone(c), prepared = prepareBrewingScenarioContext(c);
    const availability = inspectHopProgramAvailability(prepared.binding!.program, prepared.runtime.materials);
    expect(availability.stock).toHaveLength(1);
    expect(availability.stock[0]).toMatchObject({ stockItemRef: 'HOP-1', availableGrams: 0, neededGrams: 40, status: 'insufficient' });
    c.inventory[0].currentStock = 0.03;
    const next = prepareBrewingScenarioContext(c);
    expect(inspectHopProgramAvailability(next.binding!.program, next.runtime.materials).stock[0]).toMatchObject({ availableGrams: 30, neededGrams: 40, status: 'insufficient' });
    expect(before.inventory[0].currentStock).toBe(0);
    expect(before.recipe).toEqual(c.recipe);
  });
  it('invalide le contexte et réévalue J1 quand le solde change, sans changer l’identité de matière', () => {
    const c = context(); c.journal = undefined; c.recipe.hops[0].stockItemRef = 'HOP-1';
    c.inventory = [{ ref: 'HOP-1', currentStock: 100, unit: 'g' }]; c.stockReservations = { complete: true, batches: [] };
    const first = prepareBrewingScenarioContext(c), current = first.runtime.current!;
    const request = buildBrewingScenarioRequest({ scenarioId: 'stock-freshness', revision: 1,
      baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program, contextReference: brewingScenarioCurrentReference(current) } });
    const changes = [{ kind: 'replace' as const, additionId: 'recipe-hop:0', additions: [{ ...first.binding!.program.additions[0], grams: 25 }] }];
    const preview = previewHopProgramChanges(first.binding!.program, changes, first.runtime.materials);
    expect(() => applyHopProgramProposal(first.binding!.program, preview, first.runtime.materials)).not.toThrow();
    c.inventory[0].currentStock = 0;
    const changed = prepareBrewingScenarioContext(c);
    expect(() => simulateBrewingScenario(request, changed.runtime)).toThrow(/changé|chang|périm/i);
    const newPreview = previewHopProgramChanges(changed.binding!.program, changes, changed.runtime.materials);
    expect(newPreview.materialReferences).toEqual(preview.materialReferences);
    expect(() => applyHopProgramProposal(changed.binding!.program, preview, changed.runtime.materials)).toThrow();
  });
  it('conserve le vrai ajout, son unité, son contact réalisé et sa protection performed', () => {
    const c = context(), before = structuredClone(c);
    const prepared = prepareBrewingScenarioContext(c);
    expect(prepared.runtime.current?.input.additions[0]).toMatchObject({ id: 'recipe-hop:0', triplet: { doseGL: 2, contactHours: 0.5, temperatureC: 97 } });
    expect(prepared.runtime.current?.program?.additions[0]).toMatchObject({ id: 'recipe-hop:0', grams: 40, boilMinutes: 30, status: 'performed' });
    expect(prepared.runtime.current?.performedAdditionIds).toEqual(['recipe-hop:0']);
    expect(prepared.runtime.current?.beerContext?.facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'volumeL', status: 'target', value: 20 }),
      expect.objectContaining({ field: 'journal.volume', status: 'observed', value: 18 })
    ]));
    expect(c).toEqual(before);
  });
  it('ne perd pas performed quand une autre phase manquante empêche le programme physique', () => {
    const c = context(); c.recipe.hops.push({ name: 'Contact dont la phase reste inconnue', stage: 'dryHop', weightG: 10, alpha: 5 });
    const prepared = prepareBrewingScenarioContext(c);
    expect(prepared.runtime.current?.program).toBeNull();
    expect(prepared.runtime.current?.performedAdditionIds).toEqual(['recipe-hop:0']);
    expect(prepared.runtime.current?.input.additions[1].triplet.timing).toBeNull();
    expect(prepared.limitations.join(' ')).toMatch(/Phase|phase/);
  });
  it('retire les anciennes analyses et identité après remplacement réel sans nouvelles analyses', () => {
    const c = context(); c.journal!.additions!['hop-0'].replacement = { name: 'Matière de remplacement inconnue' };
    const prepared = prepareBrewingScenarioContext(c);
    expect(prepared.runtime.current?.input.additions[0].triplet.varietyId).toBeNull();
    expect(prepared.binding?.materials.find(material => material.id.includes('recipe-hop:0'))?.alphaForModel).toBeUndefined();
  });
  it('un relevé de journal changé invalide le scénario de recette précédemment préparé', () => {
    const c = context(), prepared = prepareBrewingScenarioContext(c), current = prepared.runtime.current!;
    const request = buildBrewingScenarioRequest({ scenarioId: 'fixture-scenario', revision: 1,
      baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program, contextReference: brewingScenarioCurrentReference(current) } });
    c.journal!.additions!['hop-0'].amount = 0.06;
    expect(() => simulateBrewingScenario(request, prepareBrewingScenarioContext(c).runtime)).toThrow(/chang|périm|correspond/i);
  });
  it('donne exactement le même résultat et les mêmes données Barres/Radar à UI et runBrewerTool', () => {
    const c = context();
    const prepared = runBrewerTool('prepare_brewing_scenario', { scenarioId: 'same-input', revision: 1 }, c).data as any;
    const direct = simulateBrewingScenario(prepared.request, prepareBrewingScenarioContext(c).runtime);
    const viaTool = runBrewerTool('simulate_brewing_scenarios', { requestJson: JSON.stringify(prepared.request) }, c).data as any;
    expect(viaTool.result).toEqual(direct);
    expect(viaTool.view).toEqual(brewingScenarioViewModel(direct));
    for (const axis of viaTool.view.axes) {
      expect(axis.values[0].estimate).toEqual(direct.baseline.hopPrediction.overall.profile[axis.id] ?? null);
    }
  });
});
