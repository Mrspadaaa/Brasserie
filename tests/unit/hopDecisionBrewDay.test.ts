import { describe, expect, it } from 'vitest';
import { bindHopBrewDay } from '../../src/domain/hopDecision/brewDayAdapter';
import { previewHopProgramChanges } from '../../src/domain/hopDecision/programs';
import type { BrewDayState, HopIngredient } from '../../src/types';

const hop: HopIngredient = { name: 'Fixture de houblon', stockItemRef: 'stock-fixture', alpha: 10, weightG: 20, stage: 'boil', timeMin: 60 };
const journal = (): BrewDayState => ({ steps: [], currentIndex: 0, revision: 1, boilStartedAt: 1000, boilFinishedAt: 3601000,
  additions: { 'hop-0': { amount: 0.025, unit: 'kg', doneAt: 601000 } } });

describe('lecture du journal sans réécriture du brassin', () => {
  it('distingue deux historiques au même stade et protège le contact/ajout effectués', () => {
    const snapshot = { volumeL: 20, hops: [hop] };
    const actual = journal();
    const input = { programId: 'batch-fixture', recipeSnapshot: snapshot, journal: actual, stage: 'fermenting' as const, wortGravity: 1.05, materials: [] };
    const done = bindHopBrewDay(input);
    const pending = bindHopBrewDay({ ...input, journal: { ...actual, additions: {} } });
    expect(done.program.additions[0]).toMatchObject({ grams: 25, status: 'performed', boilMinutes: 50 });
    expect(pending.program.additions[0]).toMatchObject({ grams: 20, status: 'planned', boilMinutes: 60 });
    expect(() => previewHopProgramChanges(done.program, [{ kind: 'remove', additionId: done.program.additions[0].id }], done.materials)).toThrow();
    expect(snapshot.hops[0]).toEqual(hop);
    expect(actual).toEqual(journal());
  });
  it('ne remplace pas une quantité effectuée inconnue par la dose prévue ni une identité nouvelle par l’ancienne', () => {
    const actual = journal(); actual.additions!['hop-0'] = { amount: 1, unit: 'mL', doneAt: 601000, replacement: { name: 'Autre produit' } };
    const binding = bindHopBrewDay({ programId: 'batch-fixture', recipeSnapshot: { volumeL: 20, hops: [hop] }, journal: actual, stage: 'fermenting', wortGravity: null, materials: [] });
    expect(binding.program.additions[0]).toMatchObject({ grams: null, status: 'performed' });
    expect(binding.materials[0]).toMatchObject({ name: 'Autre produit', stockItemRef: undefined });
    expect(binding.materials[0].declaredAnalysis).toBeUndefined();
  });
  it('préfère la température journalisée et ne transforme pas une durée prévue en contact réel', () => {
    const actual = journal(); actual.additions!['hop-0'].temperatureC = 70;
    const whirlpool: HopIngredient = { ...hop, stage: 'whirlpool', tempC: 80, timeMin: 20, aromaContactHours: 1 / 3 };
    const binding = bindHopBrewDay({ programId: 'batch-fixture', recipeSnapshot: { volumeL: 20, hops: [whirlpool] }, journal: actual, stage: 'fermenting', wortGravity: null, materials: [] });
    expect(binding.program.additions[0].temperatureC).toBe(70);
    expect(binding.program.additions[0].contactHours).toBeUndefined();
    const partial = journal(); delete partial.boilFinishedAt;
    const boil = bindHopBrewDay({ programId: 'batch-fixture', recipeSnapshot: { volumeL: 20, hops: [hop] }, journal: partial, stage: 'fermenting', wortGravity: null, materials: [] });
    expect(boil.program.additions[0].boilMinutes).toBeNull();
    expect(boil.assumptions.some(s => s.includes('durée réelle inconnue'))).toBe(true);
  });
});
