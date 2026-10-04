import { describe, expect, it } from 'vitest';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import {
  answerHopDecision, selectHopReplacementPath, applySelectedHopReplacement, restoreHopProgramDraft,
  bindHopRecipe, previewHopPlannedRecipe, applyHopPlannedRecipe,
  type HopDecisionMaterial, type HopDecisionProgram, type HopDecisionIntent, type HopUse,
} from '../../src/domain/hopDecision';

const source = (id: string, kind: HopSource['kind'] = 'observation'): HopSource => ({
  title: 'Données synthétiques du parcours public', author: 'Fixture J1', year: 2026, kind,
  reference: `fixture:public:${id}`, locator: 'Ni lot réel, ni essai de bière, ni recommandation de dose.',
});
function matter(id: string, text: string, availableGrams: number, uses?: HopUse[]): HopDecisionMaterial {
  return { id, name: `Matière ${id}`, form: 'pelletT90', stockItemRef: `stock:${id}`, availableGrams,
    variety: { id: `v:${id}`, name: `Variété ${id}`, aliases: [], form: 'pelletT90', analysis: [],
      descriptions: [{ text, context: 'rawHop', source: source(id) }] },
    lot: { id: `lot:${id}`, varietyId: `v:${id}`, name: `Lot ${id}`, form: 'pelletT90', analysis: [] },
    ...(uses ? { product: { id: `p:${id}`, name: `Produit ${id}`, manufacturer: 'Fixture', form: 'pelletT90' as const,
      supportedUses: uses, source: source(`p:${id}`, 'manufacturer'), reviewedOn: '2026-10-01', cautions: ['Propriété de fixture.'] } } : {}) };
}

function activeFixture() {
  const materials = [matter('absent', 'pine, resinous', 0), matter('anchor', 'floral', 0),
    matter('fer', 'floral citrus', 7.5, ['fermentation']), matter('post', 'floral herbal', 8.5, ['postFermentation']),
    matter('all', 'resinous pine', 50, ['fermentation', 'postFermentation'])];
  materials[1].variety!.descriptions[0].context = 'beer';
  const program: HopDecisionProgram = { id: 'active-public', revision: 4, stage: 'fermenting', volumeL: 20, wortGravity: 1.05,
    additions: [
      { id: 'done-source', materialId: 'absent', grams: 5, use: 'boil', boilMinutes: 30, status: 'performed' },
      { id: 'done-anchor', materialId: 'anchor', grams: 2, use: 'fermentation', status: 'performed', contactHours: 24, temperatureC: 18 },
      { id: 'future-fer', materialId: 'absent', grams: 7, use: 'fermentation', status: 'planned', contactHours: 24, temperatureC: 18 },
      { id: 'future-post', materialId: 'absent', grams: 8, use: 'postFermentation', status: 'planned', contactHours: 24, temperatureC: 16 },
    ] };
  const intent: HopDecisionIntent = { originalQuestion: 'La matière manque pour les deux emplois restants ; garder un accord floral et éviter la résine.',
    interpretation: 'Remplacer les seuls ajouts futurs de la matière indiquée ; les caractères sont documentaires.', criteria: [
      { id: 'accord', description: 'Accord avec le contexte déjà ajouté', role: 'pairWith', origin: 'user', familyId: 'floral',
        partner: { kind: 'material', id: 'anchor', additionId: 'done-anchor' } },
      { id: 'avoid-resin', description: 'Éviter la résine', role: 'avoid', origin: 'user', familyId: 'resin' },
    ] };
  const action = { kind: 'planReplacement' as const, program,
    unavailable: { materialId: 'absent', reason: 'Indisponibilité signalée.', origin: 'user' as const },
    basisByUse: { fermentation: 'sameMass' as const, postFermentation: 'sameMass' as const },
    candidateMaterialIds: ['fer', 'post', 'all'], limits: { maxCandidateMaterials: 10, maxAssignments: 50, maxPrograms: 20 } };
  return { intent, action, materials };
}

function computedBoilFixture(id: string, gravity: number, minutes: number, volume: number, nominal = false) {
  const origin = matter('computed-origin', '', 0), candidate = matter('computed-candidate', '', 100);
  origin.alphaForModel = { analyte: 'alpha', unit: 'percentAlpha', kind: 'point', value: 8, analyticalBasis: 'unknown',
    origin: 'workingHypothesis', source: source('computed-model'), selectionReason: 'Paramètre de fixture.' };
  candidate.declaredAnalysis = [{ analyte: 'alpha', unit: 'percentMass', basis: 'unknown', source: source('computed-observation'),
    confidence: 'low', ...(nominal ? { kind: 'point', value: 5 } : { kind: 'range', range: { min: 3, max: 5 } }) }];
  const program: HopDecisionProgram = { id: 'computed-dose', revision: 0, stage: 'planning', volumeL: volume, wortGravity: gravity,
    ibuModelContext: { variant: 'tinseth-original', volumeL: volume, volumeReference: 'finishedBeer', gravity,
      gravityReference: 'averageBoil', explanation: 'Même convention pour les deux contributions synthétiques.' },
    additions: [{ id, materialId: origin.id, grams: 20, use: 'boil', boilMinutes: minutes, status: 'planned' }] };
  return { intent: { originalQuestion: 'Remplacer selon la contribution du même modèle d’ébullition.' }, materials: [origin, candidate],
    action: { kind: 'planReplacement' as const, program,
      unavailable: { materialId: origin.id, reason: 'Indisponibilité de fixture.', origin: 'user' as const },
      basisByUse: { boil: 'tinsethIbu' as const }, candidateMaterialIds: [candidate.id],
      limits: { maxCandidateMaterials: 4, maxAssignments: 10, maxPrograms: 4 } } };
}

describe('parcours public de planification J1', () => {
  it('accepte les bornes calculées à leur représentation flottante sans ajouter de marge de dosage', () => {
    for (const gravity of [1.04, 1.047, 1.06]) for (const minutes of [10, 35, 60]) for (const volume of [20, 24, 30]) {
      const response = answerHopDecision(computedBoilFixture('boundary', gravity, minutes, volume));
      const { request, plan } = response.result, pathId = plan.paths[0].pathId;
      for (const grams of [20 * 8 / 5, 20 * 8 / 3]) {
        const selection = selectHopReplacementPath({ request, plan, pathId, dosesByAdditionId: { boundary: grams } });
        expect(applySelectedHopReplacement(request, selection).after.additions[0].grams).toBe(grams);
      }
      for (const grams of [31.99, 32 - 1e-9, 20 * 8 / 3 + 1e-9, -Number.MIN_VALUE]) {
        expect(() => selectHopReplacementPath({ request, plan, pathId, dosesByAdditionId: { boundary: grams } })).toThrow();
      }
    }
  });

  it('garde la même limite de représentation pour une dose nominale fixée par le calcul', () => {
    const { request, plan } = answerHopDecision(computedBoilFixture('nominal', 1.04, 10, 20, true)).result;
    const pathId = plan.paths[0].pathId;
    const selection = selectHopReplacementPath({ request, plan, pathId, dosesByAdditionId: { nominal: 32 } });
    expect(applySelectedHopReplacement(request, selection).after.additions[0].grams).toBe(32);
    expect(() => selectHopReplacementPath({ request, plan, pathId, dosesByAdditionId: { nominal: 32.000001 } })).toThrow();
  });

  it('reconstruit les choix en plage pour toute clé d’ajout, y compris __proto__', () => {
    for (const id of ['ordinary', '__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      const input = computedBoilFixture(id, 1.05, 60, 20), before = structuredClone(input);
      const { request, plan } = answerHopDecision(input).result;
      const selection = selectHopReplacementPath({ request, plan, pathId: plan.paths[0].pathId,
        dosesByAdditionId: Object.fromEntries([[id, 40]]) });
      const result = applySelectedHopReplacement(request, JSON.parse(JSON.stringify(selection)));
      expect(result.after.additions[0]).toMatchObject({ id, grams: 40, materialId: 'computed-candidate' });
      expect(input).toEqual(before);
    }
  });

  it('génère depuis la demande et le catalogue, puis choisit, applique, restaure et corrige avec le programme entier', () => {
    const input = activeFixture(), original = structuredClone(input);
    const response = answerHopDecision(input);
    expect(response.intent).toEqual(input.intent);
    expect(response.status).toBe('conditional');
    const { plan, request } = response.result;
    const mixed = plan.paths.find(path => path.assignments.length === 2
      && path.assignments.find(a => a.additionId === 'future-fer')?.candidateMaterialId === 'fer'
      && path.assignments.find(a => a.additionId === 'future-post')?.candidateMaterialId === 'post');
    expect(mixed?.kind).toBe('mixedMaterials');
    expect(mixed?.applicability).toBe('available');
    const resin = response.criteria.find(item => item.id === 'avoid-resin')!;
    expect(resin.status).toBe('evaluatedByOption');
    const evaluation = resin.options!.find(item => item.pathId === mixed!.pathId)!;
    expect(evaluation.evaluations).toContainEqual(expect.objectContaining({ additionId: 'done-source', performed: true, changed: false, status: 'documentedTension' }));
    expect(evaluation.evaluations).toContainEqual(expect.objectContaining({ additionId: 'future-fer', changed: true, status: 'notDocumented' }));
    const selected = selectHopReplacementPath({ request, plan, pathId: mixed!.pathId });
    expect(selected.proposal).toEqual(mixed!.preview);
    const applied = applySelectedHopReplacement(request, JSON.parse(JSON.stringify(selected)));
    expect(applied.after.additions.filter(row => row.status === 'performed')).toEqual(input.action.program.additions.filter(row => row.status === 'performed'));
    expect(applied.after.additions.filter(row => row.status === 'planned').every(row => row.materialId !== 'absent')).toBe(true);
    const restored = restoreHopProgramDraft(applied.after, applied, input.materials);
    expect(restored.scope).toBe('localDraft');
    expect(restored.feasibility.applicability).toBe('unavailable');
    expect(restored.program.stage).toBe('fermenting');
    const corrected = answerHopDecision({ ...input, action: { ...input.action, program: restored.program } });
    const single = corrected.result.plan.paths.find(path => path.assignments.every(a => a.candidateMaterialId === 'all'))!;
    const alternative = selectHopReplacementPath({ request: corrected.result.request, plan: corrected.result.plan, pathId: single.pathId });
    const changed = applySelectedHopReplacement(corrected.result.request, alternative);
    expect(changed.after.additions.filter(row => row.status === 'planned').map(row => row.materialId)).toEqual(['all', 'all']);
    expect(corrected.criteria.find(c => c.id === 'avoid-resin')?.options?.find(p => p.pathId === single.pathId)?.evaluations
      .filter(row => row.changed).every(row => row.status === 'documentedTension')).toBe(true);
    expect(input).toEqual(original);
  });

  it('change la qualification avec le critère et invalide l’ancienne sélection sans changer silencieusement la physique', () => {
    const input = activeFixture();
    input.intent.criteria = [{ id: 'character', description: 'Chercher le floral', role: 'seek', origin: 'user', familyId: 'floral' }];
    const sought = answerHopDecision(input);
    const path = sought.result.plan.paths.find(p => p.assignments.some(a => a.candidateMaterialId === 'fer'))!;
    const selected = selectHopReplacementPath({ request: sought.result.request, plan: sought.result.plan, pathId: path.pathId });
    const avoidedInput = structuredClone(input);
    avoidedInput.intent.criteria![0] = { ...avoidedInput.intent.criteria![0], role: 'avoid', description: 'Éviter le floral' };
    const avoided = answerHopDecision(avoidedInput);
    expect(sought.criteria[0].options!.flatMap(p => p.evaluations).some(e => e.changed && e.materialId === 'fer' && e.status === 'documentedSupport')).toBe(true);
    expect(avoided.criteria[0].options!.flatMap(p => p.evaluations).some(e => e.changed && e.materialId === 'fer' && e.status === 'documentedTension')).toBe(true);
    expect(() => applySelectedHopReplacement(avoided.result.request, selected)).toThrow();
  });

  it('conserve une exclusion certaine sur un ajout futur non ciblé et ses alias', () => {
    const input = activeFixture();
    const alias = { ...structuredClone(input.materials[4]), id: 'alias-all' };
    input.materials.push(alias);
    input.action.program.additions.push({ id: 'unchanged-forbidden', materialId: alias.id, grams: 1, use: 'postFermentation', status: 'planned', contactHours: 12, temperatureC: 16 });
    const response = answerHopDecision({ ...input, action: { ...input.action, candidateMaterialIds: ['fer', 'post', 'alias-all'],
      exclusions: [{ kind: 'materialId', value: 'all', reason: 'Ne plus utiliser ce lot dans le futur.', origin: 'user' }] } });
    expect(response.status).toBe('noApplicableOption');
    expect(response.result.plan.paths.every(path => path.applicability === 'unavailable')).toBe(true);
    expect(response.result.plan.lines.every(line => line.options.every(option => option.candidateMaterialId !== 'alias-all'))).toBe(true);
    expect(response.result.plan.paths[0].conditions.join(' ')).toContain('unchanged-forbidden');
  });

  it('ne choisit pas un solde favorable en ignorant un alias physique connu hors du périmètre des candidats', () => {
    const input = activeFixture();
    input.materials.push({ ...structuredClone(input.materials[4]), id: 'zz-stock-alias', name: 'Autre déclaration du même stock', availableGrams: 0 });
    input.action.candidateMaterialIds = ['all'];
    const response = answerHopDecision(input);
    const path = response.result.plan.paths[0];
    expect(path.applicability).toBe('conditional');
    expect(path.preview?.stock).toContainEqual(expect.objectContaining({ stockItemRef: 'stock:all', neededGrams: 15, availableGrams: null, status: 'unknown' }));
    expect(path.conditions.join(' ')).toContain('zz-stock-alias');
    input.materials.at(-1)!.availableGrams = null;
    expect(answerHopDecision(input).result.plan.paths[0].applicability).toBe('available');
    input.materials.at(-1)!.availableGrams = 0;
    input.materials.at(-1)!.lot!.referenceOnly = true;
    expect(answerHopDecision(input).result.plan.paths[0].applicability).toBe('available');
    input.materials.at(-1)!.lot!.referenceOnly = false;
    input.materials.at(-1)!.lot!.archived = true;
    expect(answerHopDecision(input).result.plan.paths[0].applicability).toBe('available');
  });

  it('traite les identifiants comme des données, même lorsqu’ils nomment une propriété JavaScript', () => {
    const input = activeFixture();
    input.action.program.additions[0].id = 'constructor';
    input.action.program.additions[2].id = 'toString';
    const response = answerHopDecision(input);
    const path = response.result.plan.paths.find(p => p.assignments.find(a => a.additionId === 'toString')?.candidateMaterialId === 'fer'
      && p.assignments.find(a => a.additionId === 'future-post')?.candidateMaterialId === 'post')!;
    const selection = selectHopReplacementPath({ request: response.result.request, plan: response.result.plan, pathId: path.pathId, dosesByAdditionId: {} });
    expect(applySelectedHopReplacement(response.result.request, selection).after.additions[0]).toEqual(input.action.program.additions[0]);
    expect(response.result.programEvidence.find(item => item.pathId === path.pathId)?.additions[0].materialId).toBe('absent');
  });

  it('relie convention IBU, choix alpha, aperçu de recette et acceptation de la demande courante', () => {
    const origin = matter('unavailable-boil', '', 0), candidate = matter('constructor', 'floral', 100);
    candidate.declaredAnalysis = [{ analyte: 'alpha', kind: 'range', range: { min: 3, max: 5 }, unit: 'percentMass', basis: 'unknown',
      source: source('candidate-alpha', 'coa'), confidence: 'low' }];
    const recipe = { id: 'public-recipe', volumeL: 20, hops: [{ name: origin.name, weightG: 20, alpha: 8,
      stage: 'boil' as const, timeMin: 60, stockItemRef: origin.stockItemRef }] };
    const binding = bindHopRecipe(recipe, { materials: [origin, candidate], materialByIndex: { 0: origin.id },
      stage: 'planning', revision: 0, wortGravity: 1.05, ibuModelContext: { variant: 'tinseth-original', volumeL: 20,
        volumeReference: 'finishedBeer', gravity: 1.05, gravityReference: 'averageBoil', explanation: 'Convention synthétique déclarée pour le test.' } });
    const target = binding.program.additions[0];
    const response = answerHopDecision({ intent: { originalQuestion: 'Remplacer en conservant cette estimation d’ébullition.', criteria: [] },
      action: { kind: 'planReplacement', program: binding.program, unavailable: { materialId: target.materialId, reason: 'Indisponible', origin: 'user' },
        basisByUse: { boil: 'tinsethIbu' }, candidateMaterialIds: [candidate.id], limits: { maxCandidateMaterials: 5, maxAssignments: 10, maxPrograms: 10 } }, materials: binding.materials });
    const { request, plan } = response.result, path = plan.paths[0];
    expect(path.status).toBe('chooseDose');
    const selection = selectHopReplacementPath({ request, plan, pathId: path.pathId, dosesByAdditionId: { [target.id]: 40 } });
    expect(previewHopPlannedRecipe({ request, selection, recipe, binding }).status).toBe('needsAlphaSelection');
    const mismatch = previewHopPlannedRecipe({ request, selection, recipe, binding,
      alphaChoices: { [target.id]: { value: 5, reason: 'Hypothèse explicite à la borne haute.' } } });
    expect(mismatch.status).toBe('conventionMismatch');
    if (mismatch.status === 'needsAlphaSelection') throw Error('La sélection est renseignée.');
    expect(() => applyHopPlannedRecipe({ request, recipe, binding, preview: mismatch })).toThrow(/convention/);
    const correctedSelection = selectHopReplacementPath({ request, plan, pathId: path.pathId,
      dosesByAdditionId: { [target.id]: path.assignments[0].doseGrams.range!.min } });
    const preview = previewHopPlannedRecipe({ request, selection: correctedSelection, recipe, binding,
      alphaChoices: { [target.id]: { value: 5, reason: 'Même hypothèse, dose corrigée sous la convention.' } } });
    if (preview.status !== 'ready') throw Error('La dose corrigée doit rétablir la convention.');
    expect(preview.conventions[0].status).toBe('nominalEquality');
    const applied = applyHopPlannedRecipe({ request, recipe, binding, preview: JSON.parse(JSON.stringify(preview)) });
    expect(applied.recipe.hops[0].alpha).toBe(5);
    expect(applied.recipe.hops[0].weightG).toBeCloseTo(32, 10);
    expect(applied.analysis.alphaGrams.status).toBe('unknown');
    expect(applied.analysis).toEqual(preview.recipePreview.analysis);
    const changedRequest = structuredClone(request); changedRequest.question += ' Avec une autre priorité.';
    expect(() => applyHopPlannedRecipe({ request: changedRequest, recipe, binding, preview })).toThrow();
    expect(recipe.hops[0]).toMatchObject({ weightG: 20, alpha: 8 });
  });
});
