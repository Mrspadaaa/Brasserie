import { describe, expect, it } from 'vitest';
import type { HopLot, HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import { loadHopCatalogueQualificationInput } from '../../src/domain/hopDecision/catalogueLoader';
import { answerQualifiedHopDecision } from '../../src/domain/hopDecision/qualifiedDecision';
import { hopRawObservationReference, type HopCatalogueVariant } from '../../src/domain/hopDecision/catalogueQualification';
import { makeHopDossierJourneyFixture } from '../fixtures/hopDecisionDossierJourney';
import { createHopDecisionDossierV2 } from '../../src/domain/hopDecision/dossier';

function assignment(material: ReturnType<typeof makeHopDossierJourneyFixture>['candidate'], variantId = material.id): HopCatalogueVariant {
  return { variantId, scope: 'assignment', recordId: material.id, origin: { kind: 'assignment' }, material: structuredClone(material) };
}

describe('chargement réel des packs vers la décision qualifiée', () => {
  it('rend les six dossiers produits chargés sans demander une seconde liste non qualifiée', async () => {
    const qualificationInput = await loadHopCatalogueQualificationInput();
    const study = answerQualifiedHopDecision({ qualificationInput,
      intent: { originalQuestion: 'Quelles sont les formes de produits documentées ici ?', interpretation: 'Dossiers embarqués, pas une preuve d’exhaustivité.' },
      action: { kind: 'understandProducts' } });
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Dossiers produits attendus.');
    expect(study.responseSnapshot.result.products).toHaveLength(6);
    expect(study.calculationInput.products).toHaveLength(6);
    expect(study.request.qualificationInput).toEqual(qualificationInput);
    expect(study.request.qualificationInput.assembly).toEqual(qualificationInput.assembly);
  });

  it('emploie une assertion liée à la variété puis refuse le repli derrière une mesure de lot invalide', async () => {
    const source: HopSource = { title: 'Fixture de raccord complet', author: 'Pilote', kind: 'observation', year: 2026, reference: 'fixture:j3:source' };
    const variety: HopVariety = { id: 'fixture-j3-variety', name: 'Fixture J3', aliases: [], form: 'pelletT90', descriptions: [],
      analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value: 5, confidence: 'low', source }] };
    const lot: HopLot = { id: 'fixture-j3-lot', varietyId: variety.id, name: 'Lot synthétique', form: 'pelletT90', analysis: [] };
    const first = await loadHopCatalogueQualificationInput({ saved: { varieties: [variety], lots: [lot] } });
    const version = first.variants.find(row => row.scope === 'variety' && row.recordId === variety.id)!;
    const proof = { evidenceId: 'fixture-j3-declaration', variantId: version.variantId, scope: 'variety' as const, recordId: variety.id,
      location: 'variety.analysis' as const, observationFingerprint: hopRawObservationReference(variety.analysis[0]),
      basis: 'asIs' as const, denominator: 'productMass' as const, evidenceType: 'userChoice' as const,
      sourceReference: source.reference, sourceLocator: 'Déclaration synthétique, pas une mesure réelle.',
      declarationId: 'fixture-j3-human-choice', declaredBy: 'fixture-user', declaredAt: '2026-10-01T01:00:00Z', reason: 'Base explicite de fixture.' };
    const action = { kind: 'assessProgram' as const, program: { id: 'fixture-j3-program', revision: 1, stage: 'planning' as const,
      volumeL: 20, wortGravity: 1.05, additions: [{ id: 'a', materialId: `lot:${lot.id}`, grams: 10,
        use: 'boil' as const, status: 'planned' as const, boilMinutes: 60 }] } };
    const intent = { originalQuestion: 'Évaluer cette addition.', interpretation: 'Fixture du raccord source et qualification.' };
    const calculate = async (value: HopLot) => answerQualifiedHopDecision({ intent, action,
      qualificationInput: await loadHopCatalogueQualificationInput({ saved: { varieties: [variety], lots: [value] }, basisEvidence: [proof] }) });
    const known = await calculate(lot);
    expect(known.kind).toBe('calculated');
    if (known.kind !== 'calculated') throw Error('Bilan attendu.');
    expect(known.responseSnapshot.result.analysis.additions[0].alphaGrams).toMatchObject({ status: 'nominal', value: 0.5 });
    expect(known.request.qualificationInput.assembly?.evidenceBindings).toHaveLength(1);
    const invalid = await calculate({ ...lot, analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'range',
      range: { min: 9, max: 2 }, confidence: 'low', source }] });
    expect(invalid.kind).toBe('calculated');
    if (invalid.kind !== 'calculated') throw Error('Bilan des inconnues attendu.');
    expect(invalid.responseSnapshot.result.analysis.additions[0].alphaGrams.status).toBe('unknown');
    expect(invalid.request.qualificationInput.variants.find(row => row.recordId === lot.id)?.material.lot?.analysis[0].range).toEqual({ min: 9, max: 2 });
  });

  it('laisse une voie sameMass exploiter les faits physiques communs malgré des analyses source divergentes', async () => {
    const fixture = makeHopDossierJourneyFixture();
    const source = fixture.input.materials.find(row => row.id === fixture.input.action.unavailable.materialId)!;
    const first = assignment(source, 'source-first'), second = assignment(source, 'source-second');
    first.material.declaredAnalysis = [{ ...structuredClone(fixture.observation), kind: 'point', value: 4 }];
    second.material.declaredAnalysis = [{ ...structuredClone(fixture.observation), kind: 'point', value: 9 }];
    delete first.material.declaredAnalysis[0].range; delete second.material.declaredAnalysis[0].range;
    const additionalVariants = [first, second, ...fixture.input.materials.filter(row => row.id !== source.id).map(row => assignment(row))];
    const study = answerQualifiedHopDecision({ intent: fixture.input.intent, action: fixture.input.action,
      qualificationInput: await loadHopCatalogueQualificationInput({ additionalVariants }) });
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('sameMass ne dépend pas du choix d’une analyse alpha.');
    expect(study.resolutionCoverage).toBe('partial');
    expect(study.responseSnapshot.result.plan.paths.some(path => path.assignments.every(row => row.candidateMaterialId === fixture.candidate.id))).toBe(true);
    expect(study.request.qualificationInput.variants.filter(row => row.recordId === source.id)).toHaveLength(2);
  });

  it('conserve la contradiction d’un alias actif du même stock hors des candidats autorisés', async () => {
    const fixture = makeHopDossierJourneyFixture();
    const alias = { ...structuredClone(fixture.candidate), id: 'fixture-unselected-stock-alias', availableGrams: 0 };
    const study = answerQualifiedHopDecision({ intent: fixture.input.intent,
      action: { ...fixture.input.action, candidateMaterialIds: [fixture.candidate.id] },
      qualificationInput: await loadHopCatalogueQualificationInput({ additionalVariants: [...fixture.input.materials, alias].map(row => assignment(row)) }) });
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Étude de faisabilité attendue.');
    const path = study.responseSnapshot.result.plan.paths.find(row => row.assignments.every(item => item.candidateMaterialId === fixture.candidate.id))!;
    expect(path).toBeDefined();
    expect(path.applicability).not.toBe('available');
    expect(path.conditions.join(' ')).toMatch(/contradictoires/);
    expect(study.responseSnapshot.result.plan.search.candidateMaterialIds).not.toContain(alias.id);
  });

  it('ne masque pas deux soldes contradictoires en remplaçant l’alias support par un solde inconnu', async () => {
    const fixture = makeHopDossierJourneyFixture();
    const alias = { ...structuredClone(fixture.candidate), id: 'fixture-conflicting-stock-alias', availableGrams: 0 };
    const a = assignment(alias, 'support-balance-zero'), b = assignment({ ...alias, availableGrams: 80 }, 'support-balance-eighty');
    const study = answerQualifiedHopDecision({ intent: fixture.input.intent,
      action: { ...fixture.input.action, candidateMaterialIds: [fixture.candidate.id] },
      qualificationInput: await loadHopCatalogueQualificationInput({ additionalVariants: [...fixture.input.materials.map(row => assignment(row)), a, b] }) });
    if (study.kind === 'calculated') {
      expect(study.responseSnapshot.result.plan.paths.filter(row => row.assignments.every(item => item.candidateMaterialId === fixture.candidate.id))
        .every(row => row.applicability !== 'available')).toBe(true);
      expect(study.resolutionCoverage).toBe('partial');
    } else {
      expect(study.blockingIssues.some(row => row.code === 'stockAliasUnresolved')).toBe(true);
    }
  });

  it('refuse à la création un snapshot dont la projection ou la demande ne correspond plus au résultat figé', async () => {
    const fixture = makeHopDossierJourneyFixture();
    const study = answerQualifiedHopDecision({ intent: fixture.input.intent, action: fixture.input.action,
      qualificationInput: await loadHopCatalogueQualificationInput({ additionalVariants: fixture.input.materials.map(row => assignment(row)) }) });
    if (study.kind !== 'calculated') throw Error('Étude calculée attendue.');
    const input = { ownerKey: 'fixture-owner', dossierId: 'fixture-study', eventId: 'fixture-saved', recordedAt: '2026-10-01T02:00:00Z' };
    expect(() => createHopDecisionDossierV2({ ...input, study })).not.toThrow();
    const changedProjection = structuredClone(study);
    changedProjection.calculationInput.materials.find(row => row.id === fixture.candidate.id)!.availableGrams = 99999;
    expect(() => createHopDecisionDossierV2({ ...input, study: changedProjection })).toThrow();
    const changedQuestion = structuredClone(study);
    changedQuestion.request.intent.originalQuestion = 'Autre question, sans recalcul associé.';
    expect(() => createHopDecisionDossierV2({ ...input, study: changedQuestion })).toThrow();
  });

  it('archive aussi une recherche implicite avec doublons équivalents et matières produits qualifiées', async () => {
    const fixture = makeHopDossierJourneyFixture();
    const extra = fixture.input.materials.map(row => assignment(row));
    extra.push(assignment(fixture.candidate, 'equivalent-copy-of-candidate'));
    const qualificationInput = await loadHopCatalogueQualificationInput({ additionalVariants: extra });
    const { candidateMaterialIds: _limitedCandidates, ...action } = fixture.input.action;
    const study = answerQualifiedHopDecision({ intent: fixture.input.intent, action, qualificationInput });
    if (study.kind !== 'calculated') throw Error('La recherche implicite sûre doit être calculée.');
    expect(study.calculationInput.materials.some(row => row.product)).toBe(true);
    expect(study.calculationInput.materials.filter(row => row.id === fixture.candidate.id)).toHaveLength(1);
    expect(() => createHopDecisionDossierV2({ ownerKey: 'fixture-owner', dossierId: 'implicit-catalogue', eventId: 'implicit-saved',
      recordedAt: '2026-10-01T02:00:00Z', study })).not.toThrow();
  });
});
