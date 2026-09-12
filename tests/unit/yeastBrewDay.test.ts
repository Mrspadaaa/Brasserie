import { describe, expect, it } from 'vitest';
import { buildYeastBrewDay } from '../../src/domain/yeastBrewDay';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { BrewDayState } from '../../src/types';
const refs = yeastReferences([]);
const state = (): BrewDayState => ({ currentIndex: 0, steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }], readings: [] });
describe('Consignes levure dans le brassin', () => {
  it('keeps the frozen plan separate from observations and never mutates either', () => {
    const recipe = yeastFlowRecipe(), journal = state(), before = JSON.stringify({ recipe, journal });
    const guide = buildYeastBrewDay(recipe, journal, 'finish', refs)!;
    expect(guide.goal).toBe('Girofle · épices'); expect(guide.pressureBar).toBe(0);
    expect(guide.instructions.map(i => i.id)).toEqual(['pitch', 'pressure', 'dry-hop']);
    expect(guide.measured).toEqual({ temperature: undefined, gravity: undefined, volume: undefined });
    expect(JSON.stringify({ recipe, journal })).toBe(before);
  });
  it('prepares the declared liquid quantity without guessing viable cells or dry sachets', () => {
    const guide = buildYeastBrewDay(yeastFlowRecipe(), state(), 'preparation', refs)!;
    expect(guide.instructions[0].title).toContain('125 mL'); expect(guide.plannedDoseG).toBeUndefined();
    expect(guide.instructions.map(i => i.id)).toEqual(['prepare']);
  });
  it('reads the real ferulic rest, and detects a removed rest without adding it back', () => {
    const recipe = yeastFlowRecipe(); recipe.mash.steps[0] = { name: 'Repos du brasseur', tempC: 45, durationMin: 12 };
    expect(buildYeastBrewDay(recipe, state(), 'mash', refs)!.instructions[0].title).toContain('45 °C pendant 12 min');
    recipe.mash.steps.shift();
    const guide = buildYeastBrewDay(recipe, state(), 'mash', refs)!;
    expect(guide.stale).toBe(true); expect(guide.instructions[0]).toMatchObject({ id: 'ferulic-missing', warning: true });
    expect(recipe.mash.steps).toHaveLength(1);
  });
  it('does not reuse a pressure intent from another strain', () => {
    const recipe = yeastFlowRecipe(); recipe.yeast.hopIndexId = 'fermentis-us05';
    const guide = buildYeastBrewDay(recipe, state(), 'finish', refs)!;
    expect(guide.pressureBar).toBeUndefined(); expect(guide.stale).toBe(true);
    expect(guide.instructions.find(i => i.id === 'pressure')!.title).toContain('à préciser');
  });
  it('keeps pressure when the same strain is resolved by its name after an identity field is lost', () => {
    const recipe = yeastFlowRecipe(); delete recipe.yeast.hopIndexId;
    expect(buildYeastBrewDay(recipe, state(), 'finish', refs)!.pressureBar).toBe(0);
  });
  it('keeps day numbers distinct from biological phase and carries actual contacts', () => {
    const recipe = yeastFlowRecipe(); delete recipe.hops[1].aromaTiming;
    const guide = buildYeastBrewDay(recipe, state(), 'finish', refs)!;
    expect(guide.hops.additions[0]).toMatchObject({ phase: 'unknown', dayOffset: 3, contactHours: 48, temperatureC: 18 });
    expect(guide.instructions.find(i => i.id === 'dry-hop')!.warning).toBe(true);
  });
  it('uses the latest valid final-wort reading, never mash/preboil readings or wrong units', () => {
    const journal = state(); journal.readings = [
      { at: 5, kind: 'volume', stepId: 'preboil', value: 30, unit: 'L' },
      { at: 4, kind: 'temperature', stepId: 'mash-0', value: 66, unit: '°C' },
      { at: 3, kind: 'temperature', stepId: 'ensemencement', value: 18, unit: '°C' },
      { at: 2, kind: 'temperature', stepId: 'refroidissement', value: 22, unit: '°C' },
      { at: 8, kind: 'temperature', stepId: 'ensemencement', value: 67, unit: '°F' },
      { at: 9, kind: 'temperature', stepId: 'ensemencement', value: 200, unit: '°C' },
      { at: 10, kind: 'volume', stepId: 'ensemencement', value: -3, unit: 'L' },
    ];
    const guide = buildYeastBrewDay(yeastFlowRecipe(), journal, 'finish', refs)!;
    expect(guide.measured.temperature!.value).toBe(18); expect(guide.measured.volume).toBeUndefined();
  });
  it('recognizes a pitching step already recorded as done, without proposing another addition', () => {
    const journal = state(); journal.steps[0].doneAt = 123;
    const guide = buildYeastBrewDay(yeastFlowRecipe(), journal, 'finish', refs)!;
    expect(guide.instructions.find(i => i.id === 'pitch')!.title).toContain('Ensemencement consigné');
    expect(journal.steps[0].doneAt).toBe(123);
  });
  it('recalculates the mass range at observed fermenter volume without replacing planned grams', () => {
    const recipe = yeastFlowRecipe(); delete recipe.yeastDesign;
    recipe.style = 'NEIPA'; recipe.yeast = { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa', form: 'sèche', qty: 12, unit: 'g', pitchTempC: 20 };
    const journal = state(); journal.readings = [{ at: 1, kind: 'volume', stepId: 'ensemencement', value: 10, unit: 'L' }];
    const guide = buildYeastBrewDay(recipe, journal, 'finish', refs)!;
    expect(guide.observedDoseG!.range.min).toBe(guide.plannedDoseG!.range.min / 2);
    expect(guide.quantity).toBe('12 g'); expect(recipe.volumeL).toBe(20);
  });
  it.each(['levain', undefined] as const)('does not apply a catalogue dry dose to a current %s form', form => {
    const recipe = yeastFlowRecipe(); delete recipe.yeastDesign;
    recipe.style = 'NEIPA'; recipe.yeast = { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa', form, qty: 125, unit: 'mL', pitchTempC: 20 };
    const journal = state(); journal.readings = [{ at: 1, kind: 'volume', stepId: 'ensemencement', value: 10, unit: 'L' }];
    const guide = buildYeastBrewDay(recipe, journal, 'finish', refs)!;
    expect(guide.observedDoseG).toBeUndefined(); expect(guide.plannedDoseG).toBeUndefined();
    expect(guide.formWarning).toContain('repères de dose'); expect(guide.quantity).toBe('125 mL');
  });
  it('does not invent missing quantities, temperature, pressure or NOLO advice', () => {
    const recipe = yeastFlowRecipe(); delete recipe.yeastDesign;
    delete (recipe.yeast as any).qty; delete recipe.yeast.pitchTempC;
    const guide = buildYeastBrewDay(recipe, state(), 'finish', refs)!;
    expect(guide.quantity).toBe('Quantité à préciser'); expect(guide.pressureBar).toBeUndefined();
    expect(guide.instructions[0].warning).toBe(true);
    recipe.nolo = { enabled: true } as any;
    expect(buildYeastBrewDay(recipe, state(), 'finish', refs)).toBeNull();
  });
});
