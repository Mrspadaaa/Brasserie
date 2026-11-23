import { describe, expect, it } from 'vitest';
import type { HopMeasurement, HopSource } from '../../functions/src/hopIndexSchema';
import { hopAlphaObservationReference, readHopAlphaChoiceDomainForAddition } from '../../src/domain/hopDecision/modelInputs';
import { bindHopRecipe } from '../../src/domain/hopDecision/recipeAdapter';
import { previewHopRecipeDraft, applyHopRecipeDraftPreview } from '../../src/domain/hopDecision/recipePreview';
import { previewHopProgramChanges } from '../../src/domain/hopDecision/programs';
import { numericBounds } from '../../src/domain/hopDecision/measurements';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';

const source = (reference: string): HopSource => ({ title: 'Plage alpha de fixture', author: 'Fixture', year: 2026,
  kind: 'coa', reference });

function measurement(reference: string, basis: HopMeasurement['basis'] = 'asIs'): HopMeasurement {
  return { analyte: 'alpha', unit: 'percentMass', basis, kind: 'range', range: { min: 9, max: 12 },
    source: source(reference), confidence: 'medium' };
}

function fixture(candidate: HopDecisionMaterial) {
  const recipe = { id: 'recipe-alpha-witness', volumeL: 20,
    hops: [{ name: 'Ancien houblon', weightG: 20, alpha: 8, stage: 'boil' as const, timeMin: 30 }] };
  const binding = bindHopRecipe(recipe, { materials: [], stage: 'planning', revision: 0, wortGravity: 1.05 });
  const materials = [...binding.materials, candidate];
  const original = binding.program.additions[0];
  const proposal = previewHopProgramChanges(binding.program, [{ kind: 'replace', additionId: original.id,
    additions: [{ ...original, materialId: candidate.id, grams: 20 }] }], materials);
  return { recipe, binding, materials, proposal, addition: proposal.program.additions[0] };
}

function varietyMaterial(observation = measurement('fixture:variety-alpha')): HopDecisionMaterial {
  return { id: 'candidate-variety', name: 'Houblon candidat', form: 'pelletT90', availableGrams: 100,
    variety: { id: 'variety-1', name: 'Variété 1', aliases: [], form: 'pelletT90', descriptions: [], analysis: [observation] } };
}

describe('témoin alpha de l’aperçu de recette', () => {
  it('expose le domaine variétal renvoyé par le helper et garde 5,875 hors de 9–12', () => {
    const candidate = varietyMaterial(), f = fixture(candidate);
    const legacy = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials);
    const explicitEmptyOptions = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, {}, {});
    const witnessed = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, {}, {}, { includeAlphaChoiceWitness: true });

    expect(legacy).toEqual(explicitEmptyOptions);
    expect(legacy.status).toBe('needsAlphaSelection');
    expect('alphaChoiceWitnesses' in legacy).toBe(false);
    if (witnessed.status !== 'needsAlphaSelection') throw Error('Sélection alpha attendue.');
    const witness = witnessed.alphaChoiceWitnesses?.[0];
    if (!witness) throw Error('Témoin alpha opt-in attendu.');
    const direct = readHopAlphaChoiceDomainForAddition(candidate, f.addition);
    expect(witness.additionId).toBe(f.addition.id);
    expect(witness.material).toMatchObject({ id: candidate.id, varietyId: 'variety-1', lotId: null });
    expect(witness.domain).toMatchObject({ status: 'comparable', bounds: { min: 9, max: 12 }, scope: 'variety',
      analyticalBasis: 'asIs', sources: [source('fixture:variety-alpha')], observations: [measurement('fixture:variety-alpha')] });
    expect(witness.domain.reading).toEqual(direct);
    expect(witness.domain.bounds).toEqual(numericBounds(direct));
    expect(witness.domain.observations.map(hopAlphaObservationReference)).toEqual([hopAlphaObservationReference(candidate.variety!.analysis[0])]);
    expect(() => previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials,
      { [f.addition.id]: { value: 5.875, reason: 'Valeur de travail test.' } })).toThrow(/domaine/);
  });

  it('distingue une analyse de lot d’une analyse variétale sans promouvoir cette dernière au lot', () => {
    const lotAlpha = measurement('fixture:lot-alpha');
    const candidate: HopDecisionMaterial = { id: 'candidate-lot', name: 'Lot candidat', form: 'pelletT90', availableGrams: 100,
      lot: { id: 'lot-1', name: 'Lot 1', varietyId: 'variety-1', form: 'pelletT90', analysis: [lotAlpha] } };
    const f = fixture(candidate);
    const result = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, {}, {}, { includeAlphaChoiceWitness: true });
    if (result.status !== 'needsAlphaSelection') throw Error('Sélection alpha attendue.');
    expect(result.alphaChoiceWitnesses?.[0]).toMatchObject({
      material: { id: 'candidate-lot', lotId: 'lot-1', varietyId: null },
      domain: { scope: 'lot', bounds: { min: 9, max: 12 }, sources: [source('fixture:lot-alpha')] },
    });
  });

  it('conserve la base distincte et l’absence de borne, sans repli sur la variété', () => {
    const incomparable = varietyMaterial(measurement('fixture:dry-matter', 'dryMatter'));
    incomparable.declaredAnalysis = [measurement('fixture:declared-incomparable', 'dryMatter')];
    const f = fixture(incomparable);
    const scoped = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, {}, {}, { includeAlphaChoiceWitness: true });
    if (scoped.status !== 'needsAlphaSelection') throw Error('Sélection alpha attendue.');
    expect(scoped.alphaChoiceWitnesses?.[0]?.domain).toMatchObject({ status: 'comparable', bounds: { min: 9, max: 12 },
      analyticalBasis: 'dryMatter', scope: 'declaration', sources: [source('fixture:declared-incomparable')],
      observations: [measurement('fixture:declared-incomparable', 'dryMatter')] });
    expect(scoped.alphaChoiceWitnesses?.[0]?.domain.reason).toContain('aucune base « tel quel »');
    expect(scoped.alphaChoiceWitnesses?.[0]?.domain.sources).not.toContainEqual(source('fixture:dry-matter'));

    const noAnalysis = fixture({ id: 'candidate-empty', name: 'Sans analyse', form: 'pelletT90', availableGrams: 100 });
    const absent = previewHopRecipeDraft(noAnalysis.recipe, noAnalysis.binding, noAnalysis.proposal, noAnalysis.materials,
      {}, {}, { includeAlphaChoiceWitness: true });
    if (absent.status !== 'needsAlphaSelection') throw Error('Sélection alpha attendue.');
    expect(absent.alphaChoiceWitnesses?.[0]?.domain).toMatchObject({ status: 'unavailable', bounds: null,
      analyticalBasis: 'unknown', scope: 'unknown', observations: [], sources: [] });
    expect(absent.alphaChoiceWitnesses?.[0]?.domain.reason).toBeTruthy();
  });

  it('conserve exactement le preview historique sans option et vérifie les reçus avec ou sans témoin', () => {
    const f = fixture(varietyMaterial());
    const choices = { [f.addition.id]: { value: 10, reason: 'Nominal de travail choisi dans le domaine documenté.' } };
    const legacy = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, choices);
    const emptyOptions = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, choices, {}, {});
    const witnessed = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, choices, {}, { includeAlphaChoiceWitness: true });
    if (legacy.status !== 'ready' || witnessed.status !== 'ready') throw Error('Aperçu prêt attendu.');
    expect(emptyOptions).toEqual(legacy);
    expect('alphaChoiceWitnesses' in legacy).toBe(false);
    expect(witnessed.alphaChoiceWitnesses?.[0]?.domain.scope).toBe('variety');
    expect(witnessed.reference).not.toBe(legacy.reference);
    expect(applyHopRecipeDraftPreview(f.recipe, f.binding, legacy, f.materials).recipe).toEqual(legacy.draft.recipe);
    expect(applyHopRecipeDraftPreview(f.recipe, f.binding, witnessed, f.materials).recipe).toEqual(witnessed.draft.recipe);
    const tampered = structuredClone(witnessed);
    tampered.alphaChoiceWitnesses![0].domain.bounds!.min = 10;
    expect(() => applyHopRecipeDraftPreview(f.recipe, f.binding, tampered, f.materials)).toThrow();

    const changed = structuredClone(f.materials);
    changed.find(m => m.id === 'candidate-variety')!.variety!.analysis[0].source.reference = 'fixture:changed-alpha-source';
    const changedProposal = previewHopProgramChanges(f.binding.program, [{ kind: 'replace', additionId: f.addition.id,
      additions: [{ ...f.addition }] }], changed);
    const changedPreview = previewHopRecipeDraft(f.recipe, f.binding, changedProposal, changed, choices, {}, { includeAlphaChoiceWitness: true });
    if (changedPreview.status !== 'ready') throw Error('Aperçu prêt après mise à jour de source attendu.');
    expect(changedPreview.alphaChoiceWitnesses?.[0]?.domain.sources[0].reference).toBe('fixture:changed-alpha-source');
    expect(changedPreview.reference).not.toBe(witnessed.reference);
  });
});
