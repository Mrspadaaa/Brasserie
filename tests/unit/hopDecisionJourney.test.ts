import { describe, expect, it } from 'vitest';
import type { HopIngredient } from '../../src/types';
import type { HopMeasurement, HopSource } from '../../functions/src/hopIndexSchema';
import {
  answerHopDecision,
  type HopDecisionIntent,
  type HopDecisionResponse,
} from '../../src/domain/hopDecision/service';
import { HOP_DECISION_VERSION, type HopDecisionMaterial, type HopDecisionProgram } from '../../src/domain/hopDecision/types';
import { chooseHopSubstitutionDose } from '../../src/domain/hopDecision/substitution';
import {
  applyHopProgramProposal,
  previewHopProgramChanges,
  undoHopProgramApplication,
} from '../../src/domain/hopDecision/programs';
import { bindHopRecipe, buildHopRecipeDraft, type HopRecipeLike } from '../../src/domain/hopDecision/recipeAdapter';

const fixtureSource = (identity: string): HopSource => ({
  title: `Analyse de fixture ${identity}`, author: 'Laboratoire de test', year: 2026,
  kind: 'coa', reference: `fixture:coa:${identity}`, locator: 'Données synthétiques de test uniquement.',
});

function point(analyte: HopMeasurement['analyte'], value: number, identity: string): HopMeasurement {
  return {
    analyte,
    unit: analyte === 'totalOil' ? 'ml100g' : analyte === '3mhCys' ? 'ugKgThiolEquivalent' : 'percentMass',
    basis: 'asIs', kind: 'point', value, source: fixtureSource(`${identity}-${analyte}`), confidence: 'high',
    method: 'fixture synthétique',
  };
}

function alphaRange(min: number, max: number, identity: string): HopMeasurement {
  return {
    analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'range', range: { min, max },
    source: fixtureSource(`${identity}-alpha`), confidence: 'high', method: 'fixture synthétique',
  };
}

function material(input: {
  id: string; name: string; alpha: number | { min: number; max: number }; oil: number;
  stockItemRef: string; availableGrams: number;
}): HopDecisionMaterial {
  const varietyId = `variety:${input.id}`;
  const analysis = [typeof input.alpha === 'number' ? point('alpha', input.alpha, input.id) : alphaRange(input.alpha.min, input.alpha.max, input.id),
    point('totalOil', input.oil, input.id)];
  const variety = { id: varietyId, name: input.name, aliases: [], form: 'pelletT90' as const, descriptions: [], analysis: [] };
  const lot = { id: `lot:${input.id}`, varietyId, name: `Lot ${input.name}`, form: 'pelletT90' as const, analysis };
  return {
    id: input.id, name: input.name, form: 'pelletT90', variety, lot,
    stockItemRef: input.stockItemRef, availableGrams: input.availableGrams,
  };
}

const sourceMaterial = material({ id: 'source', name: 'Source matière A', alpha: 10, oil: 2, stockItemRef: 'stock:A', availableGrams: 100 });
const candidateRange = material({ id: 'candidate-range', name: 'Nom commercial illustratif', alpha: { min: 4, max: 5 }, oil: 1.5, stockItemRef: 'stock:B', availableGrams: 100 });
const candidateFixed = material({ id: 'candidate-fixed', name: 'Autre identité de matière', alpha: 8, oil: 0.5, stockItemRef: 'stock:C', availableGrams: 200 });
const candidateLimited = material({ id: 'candidate-limited', name: 'Matière à stock partagé', alpha: 4, oil: 2, stockItemRef: 'stock:D', availableGrams: 60 });
const candidateLimitedAlias: HopDecisionMaterial = { ...candidateLimited, id: 'candidate-limited-alias', name: 'Alias du même stock' };

const recipeHops: HopIngredient[] = [
  { name: 'Ajout source déjà effectué', alpha: 10, weightG: 12, stage: 'boil', timeMin: 45,
    stockItemRef: 'stock:A', hopVarietyId: 'variety:source', hopLotId: 'lot:source' },
  { name: 'Ajout source au whirlpool', alpha: 10, weightG: 20, stage: 'whirlpool', timeMin: 30, tempC: 78,
    stockItemRef: 'stock:A', hopVarietyId: 'variety:source', hopLotId: 'lot:source' },
  { name: 'Autre ligne source prévue', alpha: 10, weightG: 95, stage: 'dryHop', aromaTiming: 'postFermentation',
    aromaContactHours: 24, aromaTemperatureC: 16, stockItemRef: 'stock:A', hopVarietyId: 'variety:source', hopLotId: 'lot:source' },
  { name: 'Ligne d’un alias de stock', alpha: 4, weightG: 20, stage: 'dryHop', aromaTiming: 'postFermentation',
    aromaContactHours: 24, aromaTemperatureC: 16, stockItemRef: 'stock:D', hopVarietyId: 'variety:candidate-limited', hopLotId: 'lot:candidate-limited' },
];

const recipe: HopRecipeLike & { name: string; hopPredictionIds: string[]; hopTrialId: string } = {
  id: 'recipe-journey', name: 'Recette témoin', volumeL: 20, hops: recipeHops,
  hopPredictionIds: ['historical-prediction'], hopTrialId: 'historical-trial',
};

const intent: HopDecisionIntent = {
  originalQuestion: 'Je veux garder la charge alpha du houblon source tout en comparant l’huile et plusieurs matières disponibles.',
  interpretation: 'Comparer séparément les conventions de charge alpha et d’huile.',
  assumptions: ['La ligne au whirlpool est celle qui peut être remplacée.'],
  criteria: [{ id: 'intent-aroma', description: 'Conserver l’intention aromatique du brasseur.', role: 'preserve', origin: 'user' }],
};

function bindFixture() {
  const binding = bindHopRecipe(recipe, {
    materials: [sourceMaterial, candidateRange, candidateFixed, candidateLimitedAlias],
    materialByIndex: { 0: sourceMaterial.id, 1: sourceMaterial.id, 2: sourceMaterial.id, 3: candidateLimitedAlias.id },
    performedIndices: [0], stage: 'planning', revision: 4, wortGravity: 1.05,
  });
  const materials = [...binding.materials, candidateLimited];
  return { binding, materials, targetId: 'recipe-hop:1' };
}

function byOption(response: HopDecisionResponse<'substitute'>, materialId: string) {
  const option = response.result.options.find(candidate => candidate.materialId === materialId);
  if (!option) throw new Error(`Option absente : ${materialId}`);
  return option;
}

function byAddition(program: HopDecisionProgram, id: string) {
  const addition = program.additions.find(candidate => candidate.id === id);
  if (!addition) throw new Error(`Ajout absent : ${id}`);
  return addition;
}

describe('Parcours métier local des décisions houblon', () => {
  it('préserve la demande et compare des propriétés sourcées sans règle par nom ni prédiction biologique', () => {
    const { binding, materials, targetId } = bindFixture();
    const request = {
      intent,
      action: { kind: 'substitute' as const, program: binding.program, additionId: targetId,
        candidateIds: [candidateRange.id, candidateFixed.id, candidateLimited.id], basis: 'alphaLoad' as const },
      materials,
    };
    const alpha = answerHopDecision(request);
    expect(alpha.version).toBe(HOP_DECISION_VERSION);
    expect(alpha.intent).toEqual(intent);
    expect(alpha.intent.originalQuestion).toBe(intent.originalQuestion);
    expect(alpha.criteria[0].status).toBe('notEstablished');
    expect(alpha.boundaries).toEqual({ offline: true, writesRecipe: false, writesBatch: false, sensoryValidation: 'notEstablished' });
    expect(alpha.result.options).toHaveLength(3);

    const ranged = byOption(alpha, candidateRange.id);
    expect(ranged.doseGrams).toMatchObject({ status: 'range', range: { min: 40, max: 50 }, value: null, unit: 'g' });
    expect(ranged.changes).toBeNull();
    expect(ranged.introduced.alphaGrams).toMatchObject({ status: 'range', range: { min: 1.6, max: 2.5 } });
    expect(ranged.introduced.oilMl).toMatchObject({ status: 'range', range: { min: 0.6, max: 0.75 } });
    expect(ranged.comparison.analytical.find(row => row.analyte === 'alpha')?.right.sources[0].reference)
      .toBe(fixtureSource('candidate-range-alpha').reference);
    expect(alpha.sources.some(source => source.reference === fixtureSource('candidate-range-alpha').reference)).toBe(true);

    const oil = answerHopDecision({ ...request, action: { ...request.action, basis: 'totalOil' } });
    expect(byOption(oil, candidateRange.id).doseGrams).toMatchObject({ status: 'nominal', value: 26.666666666666668 });
    expect(byOption(oil, candidateFixed.id).doseGrams).toMatchObject({ status: 'nominal', value: 80 });
    expect(byOption(oil, candidateRange.id).doseGrams.value).not.toBe(ranged.doseGrams.value);

    const twin: HopDecisionMaterial = {
      ...structuredClone(candidateRange), id: 'other-id-same-properties', name: 'Nom sans rapport', stockItemRef: 'stock:other', availableGrams: 100,
      variety: { ...structuredClone(candidateRange.variety!), id: 'variety:other', name: 'Nom sans rapport' },
      lot: { ...structuredClone(candidateRange.lot!), id: 'lot:other', varietyId: 'variety:other', name: 'Lot au nom différent' },
    };
    const sameProperties = answerHopDecision({ ...request,
      action: { ...request.action, candidateIds: [twin.id] }, materials: [...materials, twin] });
    const twinOption = sameProperties.result.options[0];
    expect({ dose: twinOption.doseGrams, alpha: twinOption.introduced.alphaGrams, oil: twinOption.introduced.oilMl, applicability: twinOption.applicability })
      .toEqual({ dose: ranged.doseGrams, alpha: ranged.introduced.alphaGrams, oil: ranged.introduced.oilMl, applicability: ranged.applicability });

    const thiol = point('3mhCys', 24, 'same-measured-precursor');
    const bio = (betaLyase: 'positive' | 'negative' | 'unknown') => answerHopDecision({
      intent,
      action: { kind: 'biotransformation' as const, context: {
        hopMeasurements: [thiol], yeast: { betaLyase }, fermentation: { state: 'active' as const },
      } }, materials,
    });
    const documented = bio('positive').result.findings.find(item => item.id === 'thiolRelease');
    const uncertain = bio('unknown').result.findings.find(item => item.id === 'thiolRelease');
    const negative = bio('negative').result.findings.find(item => item.id === 'thiolRelease');
    expect(documented?.status).toBe('contextuallyRelevant');
    expect(uncertain?.status).toBe('conditional');
    expect(negative?.yeastBetaLyaseActivity).toBe('negative');
    expect(uncertain?.yeastBetaLyaseActivity).toBe('unknown');
    expect(documented).not.toHaveProperty('yield');
    expect(documented).not.toHaveProperty('score');
  });

  it('choisit une dose de plage, vérifie tout le programme, applique localement, adapte séparément et annule une correction', () => {
    const { binding, materials, targetId } = bindFixture();
    const originalRecipe = structuredClone(recipe);
    const batchSnapshot = structuredClone({ id: 'batch-snapshot', recipeId: recipe.id, status: 'inProgress', hops: recipe.hops });
    const originalBatch = structuredClone(batchSnapshot);
    const request = { program: binding.program, additionId: targetId, materials,
      candidateIds: [candidateRange.id, candidateFixed.id, candidateLimited.id], basis: 'alphaLoad' as const };
    const response = answerHopDecision({ intent, action: { kind: 'substitute', ...request }, materials });
    const limited = byOption(response, candidateLimited.id);
    expect(limited.applicability).toBe('blocked');
    expect(limited.proposal?.applicability).toBe('unavailable');
    expect(limited.proposal?.stock.some(line => line.stockItemRef === 'stock:D' && line.status === 'insufficient')).toBe(true);

    const partialRequest = { ...request, fraction: 0.5 };
    const partialResponse = answerHopDecision({ intent, action: { kind: 'substitute', ...partialRequest }, materials });
    const partialOption = byOption(partialResponse, candidateRange.id);
    const partialDose = chooseHopSubstitutionDose(partialOption, 22.5, partialRequest);
    const partialProposal = previewHopProgramChanges(binding.program, partialDose.changes!, materials);
    expect(partialProposal.applicability).toBe('unavailable');
    expect(partialProposal.stock.find(line => line.stockItemRef === 'stock:A'))
      .toMatchObject({ neededGrams: 105, availableGrams: 100, status: 'insufficient' });

    const option = byOption(response, candidateRange.id);
    const selected = chooseHopSubstitutionDose(option, 45, request);
    expect(selected.doseGrams).toMatchObject({ status: 'range', range: { min: 40, max: 50 } });
    expect(selected.changes?.[0]).toMatchObject({ kind: 'replace', additionId: targetId, additions: [{ materialId: candidateRange.id, grams: 45 }] });
    const proposal = previewHopProgramChanges(binding.program, selected.changes!, materials);
    expect(proposal.applicability).toBe('available');
    expect(proposal.stock).toContainEqual(expect.objectContaining({ stockItemRef: 'stock:A', neededGrams: 95, availableGrams: 100, status: 'available' }));
    expect(proposal.program.additions).toHaveLength(binding.program.additions.length);
    expect(byAddition(proposal.program, 'recipe-hop:0')).toEqual(byAddition(binding.program, 'recipe-hop:0'));
    expect(byAddition(proposal.program, 'recipe-hop:2').grams).toBe(95);
    expect(byAddition(proposal.program, targetId).grams).toBe(45);

    const applied = applyHopProgramProposal(binding.program, proposal, materials);
    expect(applied.before).toEqual(binding.program);
    expect(applied.after).toEqual(proposal.program);
    expect(binding.program).not.toEqual(proposal.program);
    const comparison = answerHopDecision({ intent,
      action: { kind: 'comparePrograms', before: binding.program, after: applied.after }, materials });
    expect(comparison.result.before.additions).toHaveLength(4);
    expect(comparison.result.after.additions).toHaveLength(4);
    expect(comparison.result.before.additions.find(row => row.id === 'recipe-hop:0')?.status).toBe('performed');
    expect(comparison.result.after.additions.find(row => row.id === 'recipe-hop:0')?.status).toBe('performed');
    expect(comparison.result.delta.alphaGrams.status).toBe('range');
    expect(comparison.result.delta.alphaGrams.range?.min).toBeCloseTo(-0.2, 10);
    expect(comparison.result.delta.alphaGrams.range?.max).toBeCloseTo(0.25, 10);
    expect(comparison.result.delta.oilMl.status).toBe('nominal');
    expect(comparison.result.delta.oilMl.value).toBeCloseTo(0.275, 10);

    const needsAlpha = buildHopRecipeDraft(recipe, binding, applied, materials);
    expect(needsAlpha).toMatchObject({ status: 'needsAlphaSelection', materialIds: [candidateRange.id] });
    expect(needsAlpha.status === 'needsAlphaSelection' && needsAlpha.reasons.join(' ')).toContain('ne devient pas zéro');
    const correctedRecipe = buildHopRecipeDraft(recipe, binding, applied, materials, { [candidateRange.id]: 4.5 });
    expect(correctedRecipe.status).toBe('ready');
    if (correctedRecipe.status !== 'ready') throw new Error('La sélection explicite devait rendre le brouillon exploitable.');
    expect(correctedRecipe.recipe.hops[0]).toEqual(recipe.hops[0]);
    expect(correctedRecipe.recipe.hops[1]).toMatchObject({ name: candidateRange.name, weightG: 45, alpha: 4.5, stockItemRef: 'stock:B' });
    expect(correctedRecipe.recipe.hops[2]).toEqual(recipe.hops[2]);
    expect(correctedRecipe.dossier.before).toEqual(binding.program);
    expect(correctedRecipe.dossier.after).toEqual(applied.after);
    expect(recipe).toEqual(originalRecipe);
    expect(batchSnapshot).toEqual(originalBatch);

    const correctionProposal = previewHopProgramChanges(applied.after, [{ kind: 'replace', additionId: targetId,
      additions: [{ ...byAddition(applied.after, targetId), grams: 46 }] }], materials);
    const correction = applyHopProgramProposal(applied.after, correctionProposal, materials);
    expect(byAddition(correction.after, targetId).grams).toBe(46);
    const undoneCorrection = undoHopProgramApplication(correction.after, correction, materials);
    expect(byAddition(undoneCorrection, targetId).grams).toBe(45);
    expect(undoneCorrection.additions.find(row => row.id === 'recipe-hop:0')).toEqual(byAddition(binding.program, 'recipe-hop:0'));

    const offlinePayload = JSON.parse(JSON.stringify({
      version: HOP_DECISION_VERSION, intent, request, response, selected, proposal, application: applied,
      sources: response.sources,
    }));
    expect(offlinePayload.version).toBe(HOP_DECISION_VERSION);
    expect(offlinePayload.sources.some((source: HopSource) => source.reference === fixtureSource('candidate-range-alpha').reference)).toBe(true);
    const replayed = answerHopDecision({ intent: offlinePayload.intent,
      action: { kind: 'substitute', ...offlinePayload.request }, materials: offlinePayload.request.materials });
    expect(replayed).toEqual(offlinePayload.response);
    expect(previewHopProgramChanges(offlinePayload.request.program, offlinePayload.selected.changes, offlinePayload.request.materials))
      .toEqual(offlinePayload.proposal);
    expect(applyHopProgramProposal(offlinePayload.request.program, offlinePayload.proposal, offlinePayload.request.materials).after)
      .toEqual(offlinePayload.application.after);
  });

  it('remplace les ajouts restants ensemble, déplace 20 g sans inventer le contact et garde les fractions hors du goût', () => {
    const materials = [sourceMaterial, candidateFixed, candidateLimitedAlias, candidateLimited];
    const wholeProgram: HopDecisionProgram = {
      id: 'remaining-source', revision: 7, stage: 'planning', volumeL: 20, wortGravity: 1.05,
      additions: [
        { id: 'performed-source', materialId: sourceMaterial.id, grams: 12, use: 'boil', status: 'performed', boilMinutes: 45 },
        { id: 'remaining-whirlpool', materialId: sourceMaterial.id, grams: 10, use: 'whirlpool', status: 'planned', contactHours: 0.5, temperatureC: 78 },
        { id: 'remaining-dry-hop', materialId: sourceMaterial.id, grams: 15, use: 'postFermentation', status: 'planned', contactHours: 24, temperatureC: 16 },
        { id: 'stock-alias-line', materialId: candidateLimitedAlias.id, grams: 20, use: 'postFermentation', status: 'planned', contactHours: 24, temperatureC: 16 },
      ],
    };
    const failedWholeReplacement = answerHopDecision({ intent, action: { kind: 'replaceRemaining', program: wholeProgram,
      sourceMaterialId: sourceMaterial.id, candidateId: candidateLimited.id,
      basisByUse: { whirlpool: 'alphaLoad', postFermentation: 'alphaLoad' } }, materials });
    expect(failedWholeReplacement.status).toBe('noApplicableOption');
    expect(failedWholeReplacement.result.proposal?.applicability).toBe('unavailable');
    expect(failedWholeReplacement.result.proposal?.stock.find(line => line.stockItemRef === 'stock:D'))
      .toMatchObject({ neededGrams: 82.5, availableGrams: 60, status: 'insufficient' });
    expect(failedWholeReplacement.result.proposal?.program.additions.find(row => row.id === 'performed-source'))
      .toEqual(wholeProgram.additions[0]);
    expect(wholeProgram.additions.filter(row => row.status === 'planned' && row.materialId === sourceMaterial.id)).toHaveLength(2);

    const { binding, materials: recipeMaterials, targetId } = bindFixture();
    const shifted = answerHopDecision({ intent, action: { kind: 'changeUse', program: binding.program,
      additionId: targetId, grams: 20, use: 'postFermentation' }, materials: recipeMaterials });
    const shiftedAddition = shifted.result.proposal.program.additions.find(row => row.id === `${targetId}:shifted`);
    expect(shiftedAddition).toMatchObject({ use: 'postFermentation', grams: 20 });
    expect(shiftedAddition?.contactHours).toBeUndefined();
    expect(shiftedAddition?.temperatureC).toBeUndefined();
    expect(shifted.result.proposal.conditions.join(' ')).toContain('durée de contact non précisée');
    expect(shifted.result.reasons.join(' ')).toContain('ne sont pas recopiés');

    const blend = answerHopDecision({ intent, action: { kind: 'blend', program: binding.program, additionId: targetId,
      basis: 'alphaLoad', allocations: [
        { materialId: candidateFixed.id, fraction: 0.6 },
        { materialId: candidateLimited.id, fraction: 0.4 },
      ] }, materials: recipeMaterials });
    expect(blend.result.parts.map(part => part.fraction)).toEqual([0.6, 0.4]);
    expect(blend.result.proposal?.program.additions.filter(row => row.id.includes(':blend:')).map(row => row.grams)).toEqual([15, 20]);
    expect(blend.result.reasons.join(' ')).toContain('pas le goût');
    expect(blend.result.reasons.join(' ')).toContain('Aucune synergie chiffrée');
    expect(blend.result).not.toHaveProperty('sensoryProfile');
  });
});
