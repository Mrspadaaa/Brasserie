import { describe, expect, it } from 'vitest';
import { applyHopProgramProposal, previewHopProgramChanges, restoreHopProgramDraft, undoHopProgramApplication } from '../../src/domain/hopDecision/programs';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';

function fixture(stage: HopDecisionProgram['stage'] = 'fermenting') {
  const materials: HopDecisionMaterial[] = [{ id: 'A', name: 'Indisponible', form: 'pelletT90', stockItemRef: 'stock-A', availableGrams: 0 },
    { id: 'B', name: 'Remplacement', form: 'pelletT90', stockItemRef: 'stock-B', availableGrams: 40 }];
  const before: HopDecisionProgram = { id: 'batch-plan', revision: 2, stage, volumeL: 24, wortGravity: 1.047, additions: [
    { id: 'done', materialId: 'A', grams: 12, use: 'boil', boilMinutes: 30, status: 'performed' },
    { id: 'future', materialId: 'A', grams: 15, use: 'postFermentation', contactHours: 24, temperatureC: 16, status: 'planned' },
  ] };
  const proposal = previewHopProgramChanges(before, [{ kind: 'replace', additionId: 'future', additions: [
    { ...before.additions[1], materialId: 'B' },
  ] }], materials);
  const application = applyHopProgramProposal(before, proposal, materials);
  return { materials, before, application };
}

describe('retour au brouillon local distinct du stade et de l’application opérationnelle', () => {
  it.each(['planning', 'fermenting', 'conditioning'] as const)('restaure un futur indisponible au stade %s avec sa faisabilité, sans écrire ni réappliquer', stage => {
    const f = fixture(stage), initial = structuredClone(f);
    expect(() => undoHopProgramApplication(f.application.after, f.application, f.materials)).toThrow(/Stock insuffisant/);
    const result = restoreHopProgramDraft(f.application.after, f.application, f.materials);
    expect(result.scope).toBe('localDraft');
    expect(result.program.stage).toBe(stage);
    expect(result.program.revision).toBe(f.application.after.revision + 1);
    expect(result.program.additions).toEqual(f.before.additions);
    expect(result.program.additions[0]).toEqual(f.application.after.additions[0]);
    expect(result.feasibility.applicability).toBe('unavailable');
    expect(result.feasibility.stock).toContainEqual(expect.objectContaining({ materialId: 'A', availableGrams: 0, neededGrams: 15, status: 'insufficient' }));
    expect(result.effects).toEqual({ writesRecipe: false, writesBrewDay: false, writesStock: false });
    const newPreview = previewHopProgramChanges(result.program, [{ kind: 'replace', additionId: 'future',
      additions: [{ ...result.program.additions[1], grams: 14 }] }], f.materials);
    expect(() => applyHopProgramProposal(result.program, newPreview, f.materials)).toThrow(/Stock insuffisant/);
    expect(f).toEqual(initial);
  });

  it('garde les gardes sur faits, programme, passé et intégrité de l’application', () => {
    const f = fixture(), initial = structuredClone(f);
    const factual = structuredClone(f.application.after); factual.additions[0].grams = 13;
    expect(() => restoreHopProgramDraft(factual, f.application, f.materials)).toThrow(/programme a changé/);
    const progressed = structuredClone(f.application.after); progressed.stage = 'conditioning';
    expect(() => restoreHopProgramDraft(progressed, f.application, f.materials)).toThrow(/programme a changé/);
    const differentFacts = structuredClone(f.materials); differentFacts[0].stockItemRef = 'other-lot';
    expect(() => restoreHopProgramDraft(f.application.after, f.application, differentFacts)).toThrow(/faits ou l’identité/);
    const forged = structuredClone(f.application); forged.before.additions[0].grams = 99;
    expect(() => restoreHopProgramDraft(f.application.after, forged, f.materials)).toThrow(/aperçu/);
    expect(f).toEqual(initial);
  });

  it('actualise la faisabilité du brouillon sans confondre un changement de solde avec une opération déjà effectuée', () => {
    const f = fixture();
    const restocked = f.materials.map(m => ({ ...m, availableGrams: 50 }));
    const result = restoreHopProgramDraft(f.application.after, f.application, restocked);
    expect(result.feasibility.applicability).toBe('available');
    expect(result.program.additions[0]).toEqual(f.before.additions[0]);
    expect(f.materials[0].availableGrams).toBe(0);
  });
});
