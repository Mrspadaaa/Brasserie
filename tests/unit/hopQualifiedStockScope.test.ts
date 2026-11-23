import { describe, expect, it } from 'vitest';
import { makeHopDossierJourneyFixture } from '../fixtures/hopDecisionDossierJourney';
import { answerQualifiedHopDecision } from '../../src/domain/hopDecision/qualifiedDecision';
import { createHopDecisionDossierV2 } from '../../src/domain/hopDecision/dossier';
import type { HopCatalogueVariant } from '../../src/domain/hopDecision/catalogueQualification';

function makeFixture() {
  const fixture = makeHopDossierJourneyFixture();
  const variants: HopCatalogueVariant[] = fixture.input.materials.map(material => ({
    variantId: `assignment:${material.id}`, scope: 'assignment', recordId: material.id,
    origin: { kind: 'assignment' }, material: structuredClone(material),
  }));
  return { fixture, variants };
}

function run(fixture: ReturnType<typeof makeFixture>['fixture'], variants: HopCatalogueVariant[], action = fixture.input.action) {
  return answerQualifiedHopDecision({ intent: fixture.input.intent, action, qualificationInput: { variants } });
}

function allPetalPath(study: ReturnType<typeof run>, candidateId: string) {
  return study.kind === 'calculated'
    ? study.responseSnapshot.result.plan.paths.find(path => path.assignments.every(row => row.candidateMaterialId === candidateId))
    : undefined;
}

describe('J3-R02 — portée des alias de stock', () => {
  it('écarte un candidat dont un alias de stock seul est contradictoire, tout en calculant un autre candidat', () => {
    const { fixture, variants } = makeFixture();
    const alias = structuredClone(fixture.candidate);
    alias.id = 'petal-stock-alias';
    alias.name = 'Alias de fixture';
    alias.availableGrams = 0;
    variants.push(
      { variantId: 'alias-zero', scope: 'assignment', recordId: alias.id, origin: { kind: 'assignment' }, material: alias },
      { variantId: 'alias-eighty', scope: 'assignment', recordId: alias.id, origin: { kind: 'assignment' },
        material: { ...structuredClone(alias), availableGrams: 80 } },
    );

    const study = run(fixture, variants);
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Le conflit limité à petal ne doit pas bloquer woody.');
    expect(study.calculationInput.action.kind).toBe('planReplacement');
    if (study.calculationInput.action.kind !== 'planReplacement') throw Error('Action planReplacement attendue.');
    expect(study.calculationInput.action.candidateMaterialIds).toEqual(['woody']);
    expect(study.skippedCandidates).toContainEqual(expect.objectContaining({
      materialId: 'petal', disposition: 'stockAliasConflict',
      reasons: [expect.stringMatching(/soldes différents.*0?\/80|soldes différents/i)],
    }));
    expect(allPetalPath(study, 'woody')).toBeDefined();
    expect(allPetalPath(study, 'petal')).toBeUndefined();
    expect(study.resolutionCoverage).toBe('partial');
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-stock-scope', dossierId: 'candidate-only-conflict',
      eventId: 'candidate-only-conflict-saved', recordedAt: '2026-10-01T05:20:00Z', study })).not.toThrow();
  });

  it('ignore un alias de solde seulement lié à un ajout déjà effectué', () => {
    const { fixture, variants } = makeFixture();
    const action = { ...fixture.input.action, candidateMaterialIds: ['petal'],
      program: { ...fixture.input.action.program, additions: [...fixture.input.action.program.additions,
        { id: 'past-only', materialId: 'woody', grams: 4, use: 'boil' as const, boilMinutes: 20, status: 'performed' as const }] } };
    const alias = structuredClone(fixture.input.materials.find(material => material.id === 'woody')!);
    alias.id = 'past-stock-alias';
    alias.availableGrams = 0;
    variants.push(
      { variantId: 'past-zero', scope: 'assignment', recordId: alias.id, origin: { kind: 'assignment' }, material: alias },
      { variantId: 'past-eighty', scope: 'assignment', recordId: alias.id, origin: { kind: 'assignment' },
        material: { ...structuredClone(alias), availableGrams: 80 } },
    );

    const study = run(fixture, variants, action);
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Le stock d’un ajout effectué ne doit pas bloquer les futurs candidats.');
    expect(study.blockingIssues).toEqual([]);
    expect(study.calculationInput.action.kind).toBe('planReplacement');
    if (study.calculationInput.action.kind !== 'planReplacement') throw Error('Action planReplacement attendue.');
    expect(study.calculationInput.action.candidateMaterialIds).toEqual(['petal']);
    expect(allPetalPath(study, 'petal')).toBeDefined();
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-stock-scope', dossierId: 'performed-alias',
      eventId: 'performed-alias-saved', recordedAt: '2026-10-01T05:21:00Z', study })).not.toThrow();
  });

  it('conserve une matière candidate à solde contradictoire comme inconnue, sans la présenter disponible', () => {
    const { fixture, variants } = makeFixture();
    const first = variants.findIndex(row => row.material.id === 'petal');
    const original = variants.splice(first, 1)[0];
    variants.push(
      { ...structuredClone(original), variantId: 'petal-zero', material: { ...structuredClone(original.material), availableGrams: 0 } },
      { ...structuredClone(original), variantId: 'petal-eighty', material: { ...structuredClone(original.material), availableGrams: 80 } },
    );

    const study = run(fixture, variants);
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Une projection inconnue reste calculable comme conditionnelle.');
    expect(study.calculationInput.materials.find(material => material.id === 'petal')?.availableGrams).toBeNull();
    expect(allPetalPath(study, 'petal')?.applicability).toBe('conditional');
    expect(allPetalPath(study, 'petal')?.applicability).not.toBe('available');
    expect(allPetalPath(study, 'woody')?.applicability).toBe('available');
    expect(study.resolutionCoverage).toBe('partial');
  });

  it('préserve petal effectué comme matière de programme tout en excluant sa voie candidate incertaine', () => {
    const { fixture, variants } = makeFixture();
    const action = { ...fixture.input.action,
      program: { ...fixture.input.action.program, additions: [...fixture.input.action.program.additions,
        { id: 'petal-already-performed', materialId: 'petal', grams: 5, use: 'boil' as const,
          boilMinutes: 15, status: 'performed' as const }] } };
    const alias = structuredClone(fixture.candidate);
    alias.id = 'petal-stock-alias';
    alias.availableGrams = 0;
    variants.push(
      { variantId: 'performed-alias-zero', scope: 'assignment', recordId: alias.id, origin: { kind: 'assignment' }, material: alias },
      { variantId: 'performed-alias-eighty', scope: 'assignment', recordId: alias.id, origin: { kind: 'assignment' },
        material: { ...structuredClone(alias), availableGrams: 80 } },
    );

    const study = run(fixture, variants, action);
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('La réserve porte sur la voie future petal, pas sur l’ajout déjà effectué.');
    expect(study.calculationInput.materials.find(material => material.id === 'petal')).toBeDefined();
    expect(study.calculationInput.action.kind).toBe('planReplacement');
    if (study.calculationInput.action.kind !== 'planReplacement') throw Error('Action planReplacement attendue.');
    expect(study.calculationInput.action.candidateMaterialIds).toEqual(['woody']);
    expect(allPetalPath(study, 'woody')).toBeDefined();
    expect(allPetalPath(study, 'petal')).toBeUndefined();
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-stock-scope', dossierId: 'performed-candidate-alias',
      eventId: 'performed-candidate-alias-saved', recordedAt: '2026-10-01T05:22:00Z', study })).not.toThrow();
  });
});
