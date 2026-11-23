import { describe, expect, it } from 'vitest';
import { makeHopDossierJourneyFixture } from '../fixtures/hopDecisionDossierJourney';
import { answerHopDecision, type HopDecisionAction } from '../../src/domain/hopDecision/service';
import { answerQualifiedHopDecision } from '../../src/domain/hopDecision/qualifiedDecision';
import { createHopDecisionDossierV2 } from '../../src/domain/hopDecision/dossier';
import type { HopCatalogueVariant } from '../../src/domain/hopDecision/catalogueQualification';
import type { HopDecisionProgram } from '../../src/domain/hopDecision/types';

function setup() {
  const fixture = makeHopDossierJourneyFixture();
  const material = fixture.candidate;
  const alias = { ...structuredClone(material), id: 'alias-same-live-stock', name: 'Alias actif synthétique', availableGrams: 0 };
  const materials = [material, alias];
  const variants: HopCatalogueVariant[] = materials.map(row => ({ variantId: `variant:${row.id}`, scope: 'assignment',
    recordId: row.id, origin: { kind: 'assignment' }, material: structuredClone(row) }));
  const intent = { originalQuestion: 'Vérifier le solde courant après une modification de programme future.' };
  const program = { id: 'future-stock-program', revision: 1, stage: 'planning' as const, volumeL: 18, wortGravity: 1.048,
    additions: [{ id: 'future-original', materialId: material.id, grams: 10, use: 'boil' as const,
      boilMinutes: 30, status: 'planned' as const }] };
  return { intent, program, material, alias, materials, variants };
}

function qualify<A extends HopDecisionAction>(intent: { originalQuestion: string }, action: A, variants: HopCatalogueVariant[]) {
  return answerQualifiedHopDecision({ intent, action, qualificationInput: { variants } });
}

describe('J3-R04 — le stock suit le programme futur proposé', () => {
  const reschedules: Array<{ stage: HopDecisionProgram['stage']; from: HopDecisionProgram['additions'][number]['use']; to: HopDecisionProgram['additions'][number]['use']; parameters: { boilMinutes?: number; temperatureC?: number; contactHours?: number } }> = [
    { stage: 'hotSide', from: 'firstWort', to: 'boil', parameters: { boilMinutes: 30 } },
    { stage: 'fermenting', from: 'boil', to: 'fermentation', parameters: { temperatureC: 20, contactHours: 24 } },
    { stage: 'conditioning', from: 'fermentation', to: 'postFermentation', parameters: { temperatureC: 15, contactHours: 24 } },
  ];
  it.each(reschedules)('évalue le nouvel emploi $to au stade $stage, sans réécrire une opération effectuée', ({ stage, from, to, parameters }) => {
    const { intent, program, materials, variants } = setup();
    const pending = { ...program, stage, additions: [{ ...program.additions[0], use: from }] };
    const action = { kind: 'changeUse' as const, program: pending, additionId: 'future-original', grams: 10, use: to, parameters };
    const direct = answerHopDecision({ intent, action, materials });
    const study = qualify(intent, action, variants);
    expect(direct.result.proposal.applicability).toBe('conditional');
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Reprogrammation réelle attendue.');
    expect(study.calculationInput.materials.map(row => row.id)).toContain('alias-same-live-stock');
    expect(study.responseSnapshot.result.proposal.applicability).toBe('conditional');
    expect(study.responseSnapshot.result.proposal.stock).toEqual(direct.result.proposal.stock);
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-owner', dossierId: `reschedule-${stage}`,
      eventId: `save-${stage}`, recordedAt: '2026-10-01T03:00:00Z', study })).not.toThrow();
    const performed = { ...action, program: { ...pending, additions: [{ ...pending.additions[0], status: 'performed' as const }] } };
    expect(() => answerHopDecision({ intent, action: performed, materials })).toThrow();
    expect(() => qualify(intent, performed, variants)).toThrow();
  });

  it.each([4, 10])('garde les alias de stock pour changeUse, avec %i g déplacés et le reliquat éventuel', movedGrams => {
    const { intent, program, materials, variants } = setup();
    const action = { kind: 'changeUse' as const, program, additionId: 'future-original', grams: movedGrams,
      use: 'whirlpool' as const, parameters: { temperatureC: 80, contactHours: 0.5 } };
    const direct = answerHopDecision({ intent, action, materials });
    const study = qualify(intent, action, variants);

    expect(direct.result.proposal.applicability).toBe('conditional');
    expect(direct.result.proposal.stock.some(line => line.status === 'unknown' && line.availableGrams === null)).toBe(true);
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('L’alias futur ne doit pas effacer la demande.');
    expect(study.calculationInput.materials.map(row => row.id)).toContain('alias-same-live-stock');
    expect(study.responseSnapshot.result.proposal.applicability).not.toBe('available');
    expect(study.responseSnapshot.result.proposal.stock.some(line => line.status === 'unknown' && line.availableGrams === null)).toBe(true);
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-owner', dossierId: `change-use-${movedGrams}`,
      eventId: `save-change-${movedGrams}`, recordedAt: '2026-10-01T03:00:00Z', study })).not.toThrow();
  });

  it('garde les dépendances de stock des allocations réellement proposées par blend', () => {
    const { intent, program, materials, variants } = setup();
    const action = { kind: 'blend' as const, program, additionId: 'future-original', basis: 'sameMass' as const,
      allocations: [
        { materialId: 'petal', fraction: 0.4 },
        { materialId: 'woody', fraction: 0.6 },
      ] };
    const woody = { ...structuredClone(materials[0]), id: 'woody', availableGrams: 100, stockItemRef: 'fixture-stock:woody',
      variety: { ...materials[0].variety!, id: 'fixture-variety:woody' },
      lot: { ...materials[0].lot!, id: 'fixture-lot:woody', varietyId: 'fixture-variety:woody', stockItemRef: 'fixture-stock:woody' } };
    const blendVariants = [...variants, { variantId: 'variant:woody', scope: 'assignment' as const, recordId: 'woody',
      origin: { kind: 'assignment' as const }, material: woody }];
    const direct = answerHopDecision({ intent, action, materials: [...materials, woody] });
    const study = qualify(intent, action, blendVariants);

    expect(direct.result.proposal?.applicability).not.toBe('available');
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Les allocations sûres doivent rester calculables.');
    expect(study.calculationInput.materials.map(row => row.id)).toContain('alias-same-live-stock');
    expect(study.responseSnapshot.result.proposal?.applicability).not.toBe('available');
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-owner', dossierId: 'blend-kept-source',
      eventId: 'save-blend', recordedAt: '2026-10-01T03:00:00Z', study })).not.toThrow();
  });
});
