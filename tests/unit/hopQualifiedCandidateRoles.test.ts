import { describe, expect, it } from 'vitest';
import { makeHopDossierJourneyFixture } from '../fixtures/hopDecisionDossierJourney';
import { answerHopDecision } from '../../src/domain/hopDecision/service';
import { answerQualifiedHopDecision } from '../../src/domain/hopDecision/qualifiedDecision';
import { createHopDecisionDossierV2 } from '../../src/domain/hopDecision/dossier';

function fixture() {
  const source = makeHopDossierJourneyFixture();
  const program = structuredClone(source.input.action.program);
  program.additions.push({ id: 'candidate-already-used', materialId: source.candidate.id, grams: 5,
    use: 'boil', status: 'planned', boilMinutes: 5 });
  const qualificationInput = { variants: source.input.materials.map(material => ({
    variantId: material.id, recordId: material.id, scope: 'assignment' as const, origin: { kind: 'assignment' as const }, material,
  })) };
  return { source, program, qualificationInput };
}

describe('J3-R01 — une matière peut être indispensable et candidate', () => {
  it.each(['explicit', 'implicit'] as const)('garde le candidat déjà employé dans le planificateur (%s)', mode => {
    const { source, program, qualificationInput } = fixture();
    const { candidateMaterialIds: _oldCandidates, ...original } = source.input.action;
    const action = { ...original, program, ...(mode === 'explicit' ? { candidateMaterialIds: [source.candidate.id] } : {}) };
    const direct = answerHopDecision({ intent: source.input.intent, action, materials: source.input.materials });
    const study = answerQualifiedHopDecision({ intent: source.input.intent, action, qualificationInput });
    if (study.kind !== 'calculated') throw Error('Une étude calculée est attendue.');
    expect(direct.result.plan.paths.some(path => path.assignments.every(row => row.candidateMaterialId === source.candidate.id))).toBe(true);
    expect(study.calculationInput.action.candidateMaterialIds).toContain(source.candidate.id);
    const path = study.responseSnapshot.result.plan.paths.find(row => row.assignments.every(item => item.candidateMaterialId === source.candidate.id));
    expect(path).toBeDefined();
    expect(path!.preview!.stock.find(row => row.materialId === source.candidate.id)?.neededGrams).toBe(41);
    expect(study.calculationInput.materials.filter(row => row.id === source.candidate.id)).toHaveLength(1);
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-owner', dossierId: `plan-${mode}`, eventId: `plan-${mode}-saved`,
      recordedAt: '2026-10-01T03:00:00Z', study })).not.toThrow();
  });

  it.each(['explicit', 'implicit'] as const)('garde ce même rôle dans une substitution simple (%s)', mode => {
    const { source, program, qualificationInput } = fixture();
    const action = { kind: 'substitute' as const, program, additionId: program.additions[0].id, basis: 'sameMass' as const,
      ...(mode === 'explicit' ? { candidateIds: [source.candidate.id] } : {}) };
    const direct = answerHopDecision({ intent: source.input.intent, action, materials: source.input.materials });
    const study = answerQualifiedHopDecision({ intent: source.input.intent, action, qualificationInput });
    if (study.kind !== 'calculated') throw Error('Une substitution évaluée est attendue.');
    expect(direct.result.searchedMaterialIds).toContain(source.candidate.id);
    expect(study.calculationInput.action.candidateIds).toContain(source.candidate.id);
    expect(study.responseSnapshot.result.searchedMaterialIds).toContain(source.candidate.id);
    expect(study.calculationInput.materials.filter(row => row.id === source.candidate.id)).toHaveLength(1);
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-owner', dossierId: `sub-${mode}`, eventId: `sub-${mode}-saved`,
      recordedAt: '2026-10-01T03:00:00Z', study })).not.toThrow();
  });
});
