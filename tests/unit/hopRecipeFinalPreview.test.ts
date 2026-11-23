import { describe, expect, it } from 'vitest';
import { bindHopRecipe } from '../../src/domain/hopDecision/recipeAdapter';
import { previewHopRecipeDraft, applyHopRecipeDraftPreview } from '../../src/domain/hopDecision/recipePreview';
import { previewHopProgramChanges, undoHopProgramApplication } from '../../src/domain/hopDecision/programs';
import { analyzeHopProgram } from '../../src/domain/hopDecision/programAnalysis';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import { findHopSubstitutions } from '../../src/domain/hopDecision/substitution';
import { proposeHopBlend, proposeHopUseChange } from '../../src/domain/hopDecision/strategies';
import { hopAlphaObservationReference } from '../../src/domain/hopDecision/modelInputs';
import type { HopMeasurement } from '../../functions/src/hopIndexSchema';
import type { HopAlphaModelParameter } from '../../src/domain/hopDecision/types';

function fixture() {
  const source = { title: 'Plage synthétique', author: 'Fixture', year: 2026, kind: 'coa' as const, reference: 'fixture:final-alpha' };
  const candidate: HopDecisionMaterial = { id: 'replacement', name: 'Candidate', form: 'pelletT90', availableGrams: 100,
    declaredAnalysis: [{ analyte: 'alpha', kind: 'range', range: { min: 4, max: 6 }, unit: 'percentMass', basis: 'unknown', source, confidence: 'low' }] };
  const recipe = { id: 'R', volumeL: 20, hops: [{ name: 'Original', weightG: 20, alpha: 8, stage: 'boil' as const, timeMin: 30 }] };
  const binding = bindHopRecipe(recipe, { materials: [], stage: 'planning', revision: 0, wortGravity: 1.05 });
  binding.materials[0].availableGrams = 100;
  const materials = [...binding.materials, candidate];
  const proposal = previewHopProgramChanges(binding.program, [{ kind: 'replace', additionId: 'recipe-hop:0', additions: [
    { ...binding.program.additions[0], materialId: candidate.id, grams: 15 },
  ] }], materials);
  return { recipe, binding, materials, proposal };
}

describe('aperçu final après choix de l’alpha de recette', () => {
  it.each(['additionSelected', 'overridesMaterial', 'editWorkingWithReference', 'reverseSources', 'materialOnly'] as const)
    ('résout la même observation effective pour calcul, choix et provenance : %s', scenario => {
      const f = fixture(), candidate = f.materials[1];
      const a: HopMeasurement = { ...candidate.declaredAnalysis![0], range: { min: 4, max: 10 } };
      const b: HopMeasurement = { ...structuredClone(a), range: { min: 12, max: 18 }, basis: 'dryMatter',
        source: { ...a.source, reference: 'fixture:other-analysis' } };
      candidate.declaredAnalysis = [a, b];
      const selected = (m: HopMeasurement): HopAlphaModelParameter => ({ analyte: 'alpha', unit: 'percentAlpha', kind: 'range',
        range: structuredClone(m.range!), analyticalBasis: m.basis as HopAlphaModelParameter['analyticalBasis'],
        origin: 'selectedObservation', source: structuredClone(m.source), observationRef: hopAlphaObservationReference(m),
        selectionReason: 'Observation retenue explicitement.' });
      const observation = scenario === 'reverseSources' || scenario === 'materialOnly' ? b : a;
      if (scenario !== 'additionSelected') candidate.alphaForModel = selected(scenario === 'reverseSources' ? a : b);
      let perAddition = selected(observation);
      if (scenario === 'editWorkingWithReference') perAddition = { ...perAddition, kind: 'point', range: undefined, value: 6,
        origin: 'workingHypothesis', source: { ...a.source, kind: 'judgment', reference: 'fixture:previous-choice' } };
      const row = { ...f.proposal.program.additions[0], alphaForModel: scenario === 'materialOnly' ? undefined : perAddition };
      const proposal = previewHopProgramChanges(f.binding.program, [{ kind: 'replace', additionId: row.id, additions: [row] }], f.materials);
      const preliminary = analyzeHopProgram(proposal.program, f.materials).additions[0].boilIbu.model!.alphaInput;
      if (scenario === 'editWorkingWithReference') expect(preliminary.value).toBe(6);
      else expect(preliminary.range).toEqual(observation.range);
      const choice = observation === b ? 14 : scenario === 'editWorkingWithReference' ? 7 : 6;
      const preview = previewHopRecipeDraft(f.recipe, f.binding, proposal, f.materials,
        { [row.id]: { value: choice, reason: 'Nominal corrigé dans l’observation effective de cet ajout.' } });
      if (preview.status !== 'ready') throw Error('Aperçu final attendu');
      expect(preview.draft.recipe.hops[0].alpha).toBe(choice);
      expect(preview.analysis.additions[0].boilIbu.model?.alphaInput.value).toBe(choice);
      expect(preview.programApplication.after.additions[0].alphaForModel).toMatchObject({
        observationRef: hopAlphaObservationReference(observation), analyticalBasis: observation.basis,
      });
      expect(applyHopRecipeDraftPreview(f.recipe, f.binding, preview, f.materials).analysis).toEqual(preview.analysis);
      const excluded = observation === b ? 6 : 14;
      expect(() => previewHopRecipeDraft(f.recipe, f.binding, proposal, f.materials,
        { [row.id]: { value: excluded, reason: 'Hors de la source choisie.' } })).toThrow(/domaine/);
      expect(candidate.declaredAnalysis).toEqual([a, b]);
    });

  it('refuse une sélection par ajout invalide sans reprendre la sélection valide de la matière', () => {
    const f = fixture(), candidate = f.materials[1];
    const a: HopMeasurement = { ...candidate.declaredAnalysis![0], range: { min: 4, max: 10 } };
    const b: HopMeasurement = { ...structuredClone(a), range: { min: 12, max: 18 },
      source: { ...a.source, reference: 'fixture:material-selection' } };
    candidate.declaredAnalysis = [a, b];
    const selected = (m: HopMeasurement): HopAlphaModelParameter => ({ analyte: 'alpha', unit: 'percentAlpha', kind: 'range',
      range: structuredClone(m.range!), analyticalBasis: 'unknown', origin: 'selectedObservation', source: m.source,
      observationRef: hopAlphaObservationReference(m), selectionReason: 'Sélection explicite.' });
    candidate.alphaForModel = selected(b);
    for (const invalid of [
      { ...selected(a), observationRef: 'absent' },
      { ...selected(a), source: b.source },
      { ...selected(a), kind: 'point' as const, range: undefined, value: 6, origin: 'workingHypothesis' as const, observationRef: 'absent' },
    ]) {
      const row = { ...f.proposal.program.additions[0], alphaForModel: invalid };
      const proposal = previewHopProgramChanges(f.binding.program, [{ kind: 'replace', additionId: row.id, additions: [row] }], f.materials);
      expect(analyzeHopProgram(proposal.program, f.materials).additions[0].boilIbu.model?.alphaInput.status).toBe('unknown');
      expect(() => previewHopRecipeDraft(f.recipe, f.binding, proposal, f.materials,
        { [row.id]: { value: 6, reason: 'Une référence invalide ne vaut pas une autre sélection.' } })).toThrow();
    }
    const row = { ...f.proposal.program.additions[0], alphaForModel: selected(a) };
    const valid = previewHopProgramChanges(f.binding.program, [{ kind: 'replace', additionId: row.id, additions: [row] }], f.materials);
    const preview = previewHopRecipeDraft(f.recipe, f.binding, valid, f.materials, { [row.id]: { value: 6, reason: 'Choix dans A.' } });
    if (preview.status !== 'ready') throw Error('Aperçu attendu');
    candidate.declaredAnalysis[0].range!.min = 5;
    expect(() => applyHopRecipeDraftPreview(f.recipe, f.binding, preview, f.materials)).toThrow();
    const freshWithStaleSelection = previewHopProgramChanges(f.binding.program, [{ kind: 'replace', additionId: row.id, additions: [row] }], f.materials);
    expect(analyzeHopProgram(freshWithStaleSelection.program, f.materials).additions[0].boilIbu.model?.alphaInput.status).toBe('unknown');
    expect(() => previewHopRecipeDraft(f.recipe, f.binding, freshWithStaleSelection, f.materials,
      { [row.id]: { value: 6, reason: 'Même URL mais observation modifiée.' } })).toThrow();
  });

  it('recalcule le résultat exact choisi avant acceptation, conserve la plage physique et permet le retour du programme', () => {
    const f = fixture(), before = structuredClone(f);
    const preliminary = analyzeHopProgram(f.proposal.program, f.materials);
    expect(preliminary.hotIbu.range?.min).toBeGreaterThan(0);
    expect(previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials).status).toBe('needsAlphaSelection');
    const preview = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, { 'recipe-hop:0': { value: 5, reason: 'Nominal de travail choisi pour comparer ce brouillon.' } });
    if (preview.status !== 'ready') throw Error('Le choix doit produire le second aperçu.');
    expect(preview.analysis.hotIbu.status).toBe('nominal');
    expect(preview.analysis.hotIbu.value).toBeCloseTo(preliminary.hotIbu.range!.min * 5 / 4, 10);
    expect(preview.draft.recipe.hops[0].alpha).toBe(5);
    const applied = applyHopRecipeDraftPreview(f.recipe, f.binding, JSON.parse(JSON.stringify(preview)), f.materials);
    expect(applied.analysis).toEqual(preview.analysis);
    expect(applied.recipe).toEqual(preview.draft.recipe);
    const selected = applied.dossier.materials.find(m => m.id === 'replacement')!;
    expect(selected.declaredAnalysis![0].range).toEqual({ min: 4, max: 6 });
    expect(selected.alphaForModel).toBeUndefined();
    expect(applied.programApplication.after.additions[0].alphaForModel).toMatchObject({ value: 5, origin: 'workingHypothesis', analyticalBasis: 'unknown' });
    expect(applied.dossier.recipeModelAlpha['recipe-hop:0'].value).toBe(5);
    expect(applied.analysis.alphaGrams.status).toBe('unknown');
    const restored = undoHopProgramApplication(applied.programApplication.after, applied.programApplication, applied.dossier.materials);
    expect(restored.additions).toEqual(f.binding.program.additions);
    expect(analyzeHopProgram(restored, applied.dossier.materials).hotIbu).toEqual(analyzeHopProgram(f.binding.program, f.materials).hotIbu);
    expect(f).toEqual(before);
  });

  it('corriger le choix produit un autre aperçu et interdit la modification silencieuse du reçu', () => {
    const f = fixture();
    const make = (value: number) => previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, { 'recipe-hop:0': { value, reason: 'Valeur de travail corrigée.' } });
    const first = make(5), corrected = make(4);
    if (first.status !== 'ready' || corrected.status !== 'ready') throw Error('Aperçu attendu');
    expect(first.reference).not.toBe(corrected.reference);
    expect(corrected.analysis.hotIbu.value).toBeCloseTo(first.analysis.hotIbu.value! * 4 / 5, 10);
    const tampered = structuredClone(first); tampered.alphaChoices['recipe-hop:0'].value = 4;
    expect(() => applyHopRecipeDraftPreview(f.recipe, f.binding, tampered, f.materials)).toThrow();
    const wrongRecipe = structuredClone(first); wrongRecipe.draft.recipe.hops[0].alpha = 4;
    expect(() => applyHopRecipeDraftPreview(f.recipe, f.binding, wrongRecipe, f.materials)).toThrow();
    expect(applyHopRecipeDraftPreview(f.recipe, f.binding, corrected, f.materials).recipe.hops[0].alpha).toBe(4);
  });

  it('refuse les références changées même lorsqu’un choix de travail aurait masqué la modification', () => {
    const f = fixture();
    const preview = previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, { 'recipe-hop:0': { value: 5, reason: 'Choix explicite.' } });
    if (preview.status !== 'ready') throw Error('Aperçu attendu');
    const modified = structuredClone(f.materials); modified[1].declaredAnalysis![0].range!.max = 7;
    expect(() => applyHopRecipeDraftPreview(f.recipe, f.binding, preview, modified)).toThrow();
    const restocked = structuredClone(f.materials); restocked[1].availableGrams = 2;
    expect(() => applyHopRecipeDraftPreview(f.recipe, f.binding, preview, restocked)).toThrow();
    const recipe = structuredClone(f.recipe); recipe.hops[0].weightG = 21;
    expect(() => applyHopRecipeDraftPreview(recipe, f.binding, preview, f.materials)).toThrow();
  });

  it('refuse choix inexpliqué, hors plage, sans cible et zéro impossible à conserver dans le champ historique', () => {
    const f = fixture();
    for (const choices of [{ 'recipe-hop:0': { value: 5, reason: '' } }, { 'recipe-hop:0': { value: 7, reason: 'Choix' } },
      { absent: { value: 5, reason: 'Choix' } }, { 'recipe-hop:0': { value: 0, reason: 'Choix' } }]) {
      expect(() => previewHopRecipeDraft(f.recipe, f.binding, f.proposal, f.materials, choices)).toThrow();
    }
  });

  it('garde les choix propres à chaque ajout de la même matière et restaure leurs références', () => {
    const f = fixture();
    const row = f.proposal.program.additions[0];
    const sourceProposal = previewHopProgramChanges(f.binding.program, [{ kind: 'replace', additionId: row.id,
      additions: [{ ...row, id: 'part-a', grams: 10 }, { ...row, id: 'part-b', grams: 5 }] }], f.materials);
    const preview = previewHopRecipeDraft(f.recipe, f.binding, sourceProposal, f.materials, {
      'part-a': { value: 4, reason: 'Hypothèse basse pour ce premier ajout.' }, 'part-b': { value: 6, reason: 'Autre déclaration de travail conservée séparément.' },
    });
    if (preview.status !== 'ready') throw Error('Aperçu attendu');
    expect(preview.draft.recipe.hops.map(h => h.alpha)).toEqual([4, 6]);
    expect(preview.analysis.additions.map(a => a.boilIbu.model?.alphaInput.value)).toEqual([4, 6]);
    const applied = applyHopRecipeDraftPreview(f.recipe, f.binding, preview, f.materials);
    expect(applied.dossier.materials.find(m => m.id === 'replacement')?.alphaForModel).toBeUndefined();
    const changed = structuredClone(applied.programApplication.after); changed.additions[0].alphaForModel!.value = 5;
    expect(() => undoHopProgramApplication(changed, applied.programApplication, f.materials)).toThrow();
    expect(undoHopProgramApplication(applied.programApplication.after, applied.programApplication, f.materials).additions)
      .toEqual(f.binding.program.additions);
  });

  it('ne remplace pas un choix de modèle invalide par l’ancien alpha scalaire de la recette', () => {
    const f = fixture();
    const source = f.materials[1].declaredAnalysis![0].source;
    const invalidSelection = previewHopProgramChanges(f.binding.program, [{ kind: 'replace', additionId: 'recipe-hop:0',
      additions: [{ ...f.binding.program.additions[0], alphaForModel: { analyte: 'alpha', unit: 'percentAlpha', kind: 'point',
        value: 5, analyticalBasis: 'unknown', origin: 'selectedObservation', source, observationRef: 'observation-absente', selectionReason: 'Sélection déclarée mais introuvable.' } }] }], f.materials);
    expect(previewHopRecipeDraft(f.recipe, f.binding, invalidSelection, f.materials).status).toBe('needsAlphaSelection');
  });

  it('ne transfère pas le choix alpha à une autre matière, mais le conserve pour le reliquat et le déplacement de la même matière', () => {
    const f = fixture(), p = structuredClone(f.binding.program);
    const original = f.materials[0];
    p.additions[0].alphaForModel = structuredClone(original.alphaForModel!);
    const options = findHopSubstitutions({ program: p, additionId: 'recipe-hop:0', materials: f.materials,
      candidateIds: ['replacement'], basis: 'sameMass', fraction: 0.5 });
    const change = options[0].changes![0];
    if (change.kind !== 'replace') throw Error('Remplacement attendu');
    expect(change.additions[0].alphaForModel).toEqual(original.alphaForModel);
    expect(change.additions[1].alphaForModel).toBeUndefined();
    const blend = proposeHopBlend({ program: p, additionId: 'recipe-hop:0', materials: f.materials, basis: 'sameMass',
      allocations: [{ materialId: original.id, fraction: 0.5 }, { materialId: 'replacement', fraction: 0.5 }] });
    expect(blend.parts[0].addition.alphaForModel).toEqual(original.alphaForModel);
    expect(blend.parts[1].addition.alphaForModel).toBeUndefined();
    const shift = proposeHopUseChange({ program: p, additionId: 'recipe-hop:0', materials: f.materials, grams: 10,
      use: 'fermentation', parameters: { contactHours: 24, temperatureC: 18 } });
    expect(shift.proposal.program.additions.find(a => a.id.endsWith(':shifted'))?.alphaForModel).toEqual(original.alphaForModel);
  });

  it('permet de corriger le nominal de recette dans la plage du lot sans prendre le nominal précédent pour une borne analytique', () => {
    const source = { title: 'Plage du lot synthétique', author: 'Fixture', year: 2026, kind: 'coa' as const, reference: 'fixture:L05' };
    const lot: HopDecisionMaterial = { id: 'source', name: 'Lot source', form: 'pelletT90', availableGrams: 100,
      lot: { id: 'lot-L05', name: 'Lot', varietyId: 'var-L05', form: 'pelletT90',
        analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'unknown', kind: 'range', range: { min: 4, max: 10 }, source, confidence: 'low' }] } };
    const recipe = { id: 'R-L05', volumeL: 20, hops: [{ name: 'Lot source', hopLotId: 'lot-L05', weightG: 20, alpha: 8, stage: 'boil' as const, timeMin: 30 }] };
    const binding = bindHopRecipe(recipe, { materials: [lot], stage: 'planning', revision: 0, wortGravity: 1.05 });
    const before = structuredClone(binding);
    const changes = [{ kind: 'replace' as const, additionId: 'recipe-hop:0', additions: [{ ...binding.program.additions[0], grams: 21 }] }];
    const proposal = previewHopProgramChanges(binding.program, changes, binding.materials);
    const preview = previewHopRecipeDraft(recipe, binding, proposal, binding.materials, { 'recipe-hop:0': { value: 6, reason: 'Correction explicite du nominal dans la plage rapportée du lot.' } });
    if (preview.status !== 'ready') throw Error('Correction L05 attendue');
    expect(preview.draft.recipe.hops[0].alpha).toBe(6);
    expect(preview.analysis.additions[0].boilIbu.model?.alphaInput.value).toBe(6);
    expect(preview.analysis.alphaGrams.status).toBe('unknown');
    expect(preview.programApplication.after.additions[0].alphaForModel?.source.kind).toBe('judgment');
    expect(JSON.parse(preview.programApplication.after.additions[0].alphaForModel!.observationRef!)).toEqual(lot.lot!.analysis[0]);
    expect(preview.programApplication.after.additions[0].alphaForModel!.selectionReason).toContain('Correction explicite');
    expect(binding).toEqual(before);
    expect(() => previewHopRecipeDraft(recipe, binding, proposal, binding.materials,
      { 'recipe-hop:0': { value: 11, reason: 'Choix hors plage' } })).toThrow(/domaine/);

    const knownBasis = structuredClone(binding.materials);
    knownBasis.find(m => m.id === binding.program.additions[0].materialId)!.lot!.analysis[0].basis = 'asIs';
    const qualifiedProposal = previewHopProgramChanges(binding.program, changes, knownBasis);
    const qualified = previewHopRecipeDraft(recipe, binding, qualifiedProposal, knownBasis,
      { 'recipe-hop:0': { value: 6, reason: 'Nominal de travail dans la plage sur produit tel quel.' } });
    if (qualified.status !== 'ready') throw Error('Aperçu qualifié attendu');
    expect(qualified.programApplication.after.additions[0].alphaForModel?.analyticalBasis).toBe('asIs');
    expect(qualified.analysis.alphaGrams.range).toEqual({ min: 21 * 4 / 100, max: 21 * 10 / 100 });

    for (const invalidKind of ['unit', 'invalidRange', 'conflictingReferences'] as const) {
      const changed = structuredClone(binding.materials);
      const target = changed.find(m => m.id === binding.program.additions[0].materialId)!;
      if (invalidKind === 'unit') target.lot!.analysis[0].unit = 'unknown';
      if (invalidKind === 'invalidRange') target.lot!.analysis[0].range!.max = Number.NaN;
      if (invalidKind === 'conflictingReferences') target.lot!.analysis.push({ ...structuredClone(target.lot!.analysis[0]), range: { min: 12, max: 15 } });
      const fresh = previewHopProgramChanges(binding.program, changes, changed);
      expect(() => previewHopRecipeDraft(recipe, binding, fresh, changed,
        { 'recipe-hop:0': { value: 6, reason: 'Ce choix ne qualifie pas la donnée ambiguë.' } })).toThrow();
    }
  });
});
