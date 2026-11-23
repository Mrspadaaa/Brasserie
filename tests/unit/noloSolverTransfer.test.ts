import { describe, expect, it } from 'vitest';
import { fruty } from '../fixtures/fruty';
import { prepareNoloRecipe, applyNoloRecipeProposal } from '../../src/domain/noloRecipeSolver';
import { noloYeastCandidates } from '../../src/domain/noloYeastSelection';
import { noloScience, evaluateNoloRecipe } from '../../src/domain/nolo';
import { readRecipeFields, readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { noloBrewDayPlan } from '../../src/domain/noloBrewDay';
import { buildTimeline } from '../../src/services/brewTimer';
import { assertNoloConfig, type NoloProcess } from '../../functions/src/noloSchema';
import type { Recipe } from '../../src/types';

const science = noloScience()!;
const processes: NoloProcess[] = ['restricted','restored','lowExtract','arrested','dealcoholized','coldContact','coldExtraction','secondRunnings'];
function proposal(process: NoloProcess) {
  const recipe = fruty(true); recipe.nolo!.process = process;
  const strain = noloYeastCandidates(recipe, science)[0].strain;
  return { recipe, strain, proposal: prepareNoloRecipe(recipe, science, strain) };
}
describe('simulation NOLO, recette transférée et outils partagés', () => {
  it.each(processes)('rejoue %s après lecture, export texte et import sans changer la plage ni fabriquer de mesure', process => {
    const { recipe, proposal: p } = proposal(process);
    expect(p.blocking).toEqual([]);
    const applied = applyNoloRecipeProposal(recipe, p) as Recipe;
    for (const restored of [readRecipeFields(applied), readRecipeText(writeRecipeText(applied))]) {
      expect(restored).toBeDefined(); assertNoloConfig(restored!.nolo);
      expect(restored!.nolo!.measurements).toEqual(recipe.nolo!.measurements);
      const result = evaluateNoloRecipe(restored as Recipe)!;
      expect(result.simulationActive).toBe(true);
      expect(result.projection).toEqual(p.result!.projection);
    }
  });
  it('donne à l’IA le même programme, les candidates du procédé et les hypothèses sans muter le contexte', () => {
    const { recipe, strain, proposal: p } = proposal('lowExtract');
    const context = { recipe } as any, before = JSON.stringify(context);
    const result = runBrewerTool('simulate_nolo_recipe', { process: 'lowExtract', yeastId: strain.yeastId }, context).data as any;
    expect(result.projection).toEqual(p.result!.projection);
    expect(result.settings).toEqual(p.settings);
    expect(result.candidates.length).toBeGreaterThan(3);
    expect(result.proposedRecipe.nolo.planning.simulation).toBeDefined();
    expect(result.sources.length).toBeGreaterThan(0);
    expect(JSON.stringify(context)).toBe(before);
    expect(() => runBrewerTool('simulate_nolo_recipe', { attenuationMinPct: 90, attenuationMaxPct: 10 }, context)).toThrow(/minimum/);
    expect(() => runBrewerTool('simulate_nolo_recipe', { yeastId: 'inconnue' }, context)).toThrow(/Souche/);
  });
  it.each(['coldExtraction','secondRunnings'] as NoloProcess[])('utilise la consigne de %s dans le minuteur sans la déclarer mesurée', process => {
    const { recipe, proposal: p } = proposal(process), applied = applyNoloRecipeProposal(recipe, p) as Recipe;
    const plan = noloBrewDayPlan(applied)!;
    expect(plan.simulation).toBeTruthy();
    expect(plan.executionHint).toContain('Extraction prévue');
    const step = buildTimeline(applied).find(s => s.id === (process === 'secondRunnings' ? 'nolo-second-runnings' : 'nolo-extraction'))!;
    expect(step.durationMin).toBe(p.settings.extractionHours * 60);
    expect(step.tempC).toBe(p.settings.extractionTempC);
    expect(step.detail).toContain('réellement obtenus');
    if (process === 'coldExtraction') {
      const water = buildTimeline(applied).find(s => s.id === 'eau')!;
      expect(water.detail).toContain('Eau estimée pour le pilote');
      expect(water.detail).toContain(String(p.settings.extractionTempC));
      expect(water.detail).not.toContain('Préciser le protocole');
    }
    expect(applied.nolo!.secondRunnings?.sg ?? null).toBeNull();
    expect(applied.nolo!.measurements).toEqual([]);
  });
  it('signale un plan périmé au helper si le rendement est changé après la simulation', () => {
    const { recipe, proposal: p } = proposal('lowExtract'), applied = applyNoloRecipeProposal(recipe, p) as Recipe;
    applied.efficiencyPct = 65;
    const plan = noloBrewDayPlan(applied)!;
    expect(plan.simulation).toBeNull();
    expect(plan.simulationStale).toBe(true);
    expect(plan.executionHint).toBeNull();
  });
});
