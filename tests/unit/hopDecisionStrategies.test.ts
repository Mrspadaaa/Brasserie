import { describe, expect, it } from 'vitest';
import { proposeRemainingHopReplacement } from '../../src/domain/hopDecision/strategies';
import { bindHopRecipe } from '../../src/domain/hopDecision/recipeAdapter';
import { answerHopDecision } from '../../src/domain/hopDecision/service';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import type { HopMeasurement } from '../../functions/src/hopIndexSchema';

const alpha = (value: number): HopMeasurement => ({ analyte: 'alpha', value, unit: 'percentMass', basis: 'asIs', kind: 'point', confidence: 'low',
  source: { title: 'Fixture', author: 'Test', year: 2026, kind: 'observation', reference: 'fixture:physical-material' } });
const material = (id: string, stockItemRef: string, lotId: string, amount: number, alphaPct: number): HopDecisionMaterial => ({ id, name: id, form: 'pelletT90', stockItemRef, availableGrams: amount,
  lot: { id: lotId, varietyId: 'same-cultivar', name: lotId, form: 'pelletT90', stockItemRef, analysis: [alpha(alphaPct)] } });

describe('identité physique au raccordement des stratégies', () => {
  it('remplace ensemble deux alias recette du même lot/stock, sans fusionner un autre lot', () => {
    const a = material('A', 'stock-A', 'lot-A', 0, 10), b = material('B', 'stock-B', 'lot-B', 100, 5);
    const recipe = { id: 'R', volumeL: 20, hops: [0, 1].map(() => ({ name: 'A', alpha: 10, weightG: 20, stage: 'boil' as const, timeMin: 60, hopLotId: 'lot-A', stockItemRef: 'stock-A' })) };
    const binding = bindHopRecipe(recipe, { materials: [a, b], stage: 'planning', revision: 0, wortGravity: 1.05 });
    expect(binding.program.additions[0].materialId).not.toBe(binding.program.additions[1].materialId);
    const input = { program: binding.program, sourceMaterialId: binding.program.additions[0].materialId, candidateId: 'B', materials: binding.materials, basisByUse: { boil: 'alphaLoad' as const } };
    const result = proposeRemainingHopReplacement(input);
    expect(result.parts).toHaveLength(2);
    expect(result.proposal?.applicability).toBe('available');
    expect(result.proposal?.program.additions.map(a => a.grams)).toEqual([40, 40]);
    const otherLot = material('C', 'stock-C', 'lot-C', 100, 10);
    const modified = structuredClone(binding.program); modified.additions[1].materialId = 'C';
    const distinct = proposeRemainingHopReplacement({ ...input, program: modified, materials: [...binding.materials, otherLot] });
    expect(distinct.parts).toHaveLength(1);
    expect(distinct.proposal?.program.additions[1]).toMatchObject({ materialId: 'C', grams: 20 });
  });
  it('refuse une liaison recette qui transposerait la disponibilité d’un autre stock', () => {
    const a = material('A', 'stock-A', 'lot-A', 100, 10);
    const recipe = { id: 'R', volumeL: 20, hops: [{ name: 'A', alpha: 10, weightG: 20, stage: 'boil' as const, timeMin: 60, stockItemRef: 'stock-B' }] };
    expect(() => bindHopRecipe(recipe, { materials: [a], materialByIndex: { 0: 'A' }, stage: 'planning', revision: 0, wortGravity: 1.05 })).toThrow(/stock/);
  });
  it('ne crée pas d’hybride entre un lot ou une variété acquis et une sélection contradictoire', () => {
    const a = material('A', 'stock-A', 'lot-A', 100, 10);
    const recipe = { id: 'R', volumeL: 20, hops: [{ name: 'A', alpha: 10, weightG: 20, stage: 'boil' as const, timeMin: 60, stockItemRef: 'stock-A', hopLotId: 'lot-OTHER' }] };
    const input = { materials: [a], materialByIndex: { 0: 'A' }, stage: 'planning' as const, revision: 0, wortGravity: 1.05 };
    expect(() => bindHopRecipe(recipe, input)).toThrow(/lot/);
    expect(() => bindHopRecipe({ ...recipe, hops: [{ ...recipe.hops[0], hopLotId: 'lot-A', hopVarietyId: 'different-cultivar' }] }, input)).toThrow(/variété/);
  });
  it('évalue sans mutation un programme courant ou déjà conditionné', () => {
    const a = material('A', 'stock-A', 'lot-A', 100, 10);
    const program = { id: 'P', revision: 0, volumeL: 20, wortGravity: 1.05, stage: 'planning' as const,
      additions: [{ id: 'a', materialId: 'A', grams: 20, status: 'planned' as const, use: 'boil' as const, boilMinutes: 60 }] };
    const snapshot = structuredClone(program);
    for (const stage of ['planning', 'packaged'] as const) {
      const response = answerHopDecision({ intent: { originalQuestion: 'Comprendre le programme existant.' }, action: { kind: 'assessProgram', program: { ...program, stage } }, materials: [a] });
      expect(response.result.analysis.alphaGrams.value).toBe(2);
      expect(response.result.feasibility).toHaveProperty('conditions');
    }
    expect(program).toEqual(snapshot);
  });
});
