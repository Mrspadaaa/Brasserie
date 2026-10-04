import { describe, expect, it } from 'vitest';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { buildBrewingScenarioRequest, brewingScenarioCurrentReference, assertBrewingScenarioRequest, simulateBrewingScenario } from '../../src/domain/brewingScenario';
import type { BrewingScenarioBranchRequest } from '../../src/domain/brewingScenario';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import {
  getHopV55ScenarioHypothesisOptions,
  reviseHopV55Analogy,
  reviseHopV55ModelHypothesis,
  type ReviseHopV55ModelHypothesisInput,
} from '../../src/services/hopV55/scenarioHypotheses';
import extrapolationBootstrap from '../../src/data/hopExtrapolationBootstrap.json';
import knowledgeBootstrap from '../../src/data/hopKnowledgeBootstrap.json';
import { hopV55FixtureSource } from '../fixtures/hopV55';

const descriptionSource: HopSource = { ...hopV55FixtureSource, title: 'Source de descripteur exacte', reference: 'fixture://scenario-hypothesis/description' };

function harness() {
  const context = makeHopV55FixtureContext('planning');
  const firstModel = structuredClone((extrapolationBootstrap as HopExtrapolation[])[0]);
  if (!firstModel) throw new Error('Le pack doit contenir un modèle déclaré.');
  const secondModel = structuredClone(firstModel);
  secondModel.id = 'fixture-model-second-source';
  secondModel.name = 'Second model fixture';
  secondModel.version = 'source-v2';
  const firstProfile = firstModel.yeasts[0];
  if (!firstProfile) throw new Error('La fixture de modèle doit contenir un profil de levure.');
  const loadedReferenceYeast: HopYeast = { id: firstProfile.yeastId, kind: 'yeast', name: 'Levure source chargée', betaLyase: 'unknown', source: firstProfile.source };
  const loadedTargetYeast: HopYeast = { id: 'fixture-target-yeast-exact', kind: 'yeast', name: 'Levure cible chargée', betaLyase: 'unknown', source: hopV55FixtureSource };
  const varieties = context.hopIndex!.varieties as HopVariety[];
  const target = varieties.find(row => row.id === 'hop-v55-fixture-identity-a')!;
  const reference = varieties.find(row => row.id === 'hop-v55-fixture-identity-b')!;
  const alternateReference = varieties.find(row => row.id === 'hop-v55-fixture-identity-c')!;
  reference.descriptions = [{ text: 'Note descriptive fictive explicitement sourcée.', context: 'rawHop', source: descriptionSource }];
  alternateReference.descriptions = [{ text: 'Autre descripteur fictif, source distincte.', context: 'infusion',
    source: { ...descriptionSource, title: 'Autre source de descripteur', reference: 'fixture://scenario-hypothesis/alternate-description' } }];
  context.hopIndex!.knowledge.push(
    ...(knowledgeBootstrap as Array<{ kind: string }>).filter(row => row.kind === 'axis') as any[],
    loadedReferenceYeast, loadedTargetYeast, firstModel, secondModel,
  );
  const prepared = prepareBrewingScenarioContext(context);
  return { context, prepared, firstModel, secondModel, target, reference, alternateReference, loadedReferenceYeast, loadedTargetYeast };
}

function scenarioRequest(prepared: ReturnType<typeof prepareBrewingScenarioContext>, branch: BrewingScenarioBranchRequest) {
  const current = prepared.runtime.current;
  if (!current) throw new Error('La fixture planning doit lier une entrée de scénario.');
  const request = buildBrewingScenarioRequest({ scenarioId: 'scenario-hypothesis-test', revision: 1,
    baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
      contextReference: brewingScenarioCurrentReference(current) } });
  request.branches.push(structuredClone(branch));
  assertBrewingScenarioRequest(request);
  return request;
}

function baseBranch(): BrewingScenarioBranchRequest {
  return { id: 'branch-hypothesis-test', label: 'Branche d’hypothèses', assumptions: [] };
}

function modelEdit(prepared: ReturnType<typeof prepareBrewingScenarioContext>, overrides: Partial<ReviseHopV55ModelHypothesisInput> = {}) {
  const option = getHopV55ScenarioHypothesisOptions(prepared).modelParameters.find(row => row.parameter.kind === 'matrix');
  if (!option) throw new Error('Paramètre de matrice chargé attendu.');
  return { prepared, branch: baseBranch(), modelId: option.modelId, parameter: option.parameter, unit: option.unit,
    range: { min: 1.1, max: 1.4 }, central: 1.2, explanation: 'Plage explicitement choisie pour la fixture.', ...overrides };
}

describe('Révision des hypothèses et analogies J5', () => {
  it('expose plusieurs modèles chargés par identifiant/version, paramètres typés, unités et sources exactes', () => {
    const { prepared, firstModel, secondModel } = harness();
    const options = getHopV55ScenarioHypothesisOptions(prepared);
    const matrixA = options.modelParameters.find(row => row.modelId === firstModel.id && row.parameter.kind === 'matrix');
    const matrixB = options.modelParameters.find(row => row.modelId === secondModel.id && row.parameter.kind === 'matrix');
    const halfSaturation = options.modelParameters.find(row => row.parameter.kind === 'timing' && row.parameter.parameter === 'halfSaturationGL');
    const extraction = options.modelParameters.find(row => row.parameter.kind === 'timing' && row.parameter.parameter === 'extractionHours');

    expect(options.models.map(row => [row.id, row.version])).toEqual(expect.arrayContaining([
      [firstModel.id, firstModel.version], [secondModel.id, secondModel.version],
    ]));
    expect(matrixA).toMatchObject({ unit: 'sans unité · paramètre interne du modèle', current: firstModel.matrix });
    expect(matrixA?.sources).toEqual(expect.arrayContaining([firstModel.matrix.source, firstModel.source]));
    expect(matrixB).toMatchObject({ modelId: secondModel.id, current: secondModel.matrix });
    expect(halfSaturation?.unit).toBe('g/L');
    expect(extraction?.unit).toBe('h');
    expect(options.modelParameters.some(row => row.parameter.kind === 'timing' && row.parameter.parameter === 'temperatureC')).toBe(false);
  });

  it('révise un modèle choisi sans remplacer programme, entrées bière ou autres hypothèses', () => {
    const { prepared, firstModel, secondModel } = harness();
    const currentProgram = prepared.runtime.current?.program;
    if (!currentProgram) throw new Error('Programme J1 de fixture attendu.');
    const planned = currentProgram.additions.find(row => row.status === 'planned')!;
    const oldMatrixOption = getHopV55ScenarioHypothesisOptions(prepared).modelParameters.find(row => row.modelId === firstModel.id && row.parameter.kind === 'matrix')!;
    const branch: BrewingScenarioBranchRequest = {
      ...baseBranch(),
      programChanges: [{ kind: 'replace', additionId: planned.id, additions: [{ ...structuredClone(planned), grams: planned.grams! + 1 }] }],
      inputOverrides: { yeastId: prepared.runtime.current!.input.yeastId },
      beerContext: { facts: [{ id: 'retained-fact', field: 'test.target', status: 'target', origin: 'userHypothesis', value: 22, unit: 'L' }] },
      assumptions: [
        { id: 'program-selected', path: 'program.changes', label: 'Programme', status: 'selected', origin: 'userHypothesis', explanation: 'Dose conservée.', value: planned.id },
        { id: 'yeast-selected', path: 'recipe.yeastId', label: 'Culture', status: 'selected', origin: 'userHypothesis', explanation: 'Culture conservée.', value: prepared.runtime.current!.input.yeastId },
        { id: 'prior-model-hypothesis', path: 'model.matrix', label: 'Matrice antérieure', status: 'selected', origin: 'userHypothesis', explanation: 'Ancienne sélection du modèle.', range: oldMatrixOption.current.range, central: oldMatrixOption.current.central, unit: oldMatrixOption.unit },
        { id: 'other-model-hypothesis', path: 'model.gain', label: 'Gain de l’autre modèle', status: 'selected', origin: 'userHypothesis', explanation: 'Autre modèle conservé.', range: firstModel.gain.range, central: firstModel.gain.central, unit: 'sans unité · paramètre interne du modèle' },
      ],
      modelOverrides: [
        { modelId: firstModel.id, parameter: { kind: 'matrix' }, assumptionId: 'prior-model-hypothesis' },
        { modelId: firstModel.id, parameter: { kind: 'gain' }, assumptionId: 'other-model-hypothesis' },
      ],
    };
    const before = structuredClone(branch);
    const revised = reviseHopV55ModelHypothesis({ prepared, branch, modelId: secondModel.id,
      parameter: { kind: 'matrix' }, unit: 'sans unité · paramètre interne du modèle',
      range: { min: 1.1, max: 1.4 }, central: 1.25, explanation: 'Révision explicite du second modèle.' });

    expect(revised.inputOverrides).toEqual(before.inputOverrides);
    expect(revised.programChanges).toEqual(before.programChanges);
    expect(revised.beerContext).toEqual(before.beerContext);
    expect(revised.modelOverrides).toEqual([...before.modelOverrides!, { modelId: secondModel.id,
      parameter: { kind: 'matrix' }, assumptionId: revised.modelOverrides!.find(row => row.modelId === secondModel.id)!.assumptionId }]);
    expect(revised.assumptions.find(row => row.id === 'prior-model-hypothesis')).toMatchObject({ status: 'selected', explanation: 'Ancienne sélection du modèle.' });
    const selected = revised.assumptions.find(row => row.id === revised.modelOverrides!.find(row => row.modelId === secondModel.id)!.assumptionId)!;
    expect(selected).toMatchObject({ status: 'selected', origin: 'userHypothesis', range: { min: 1.1, max: 1.4 }, central: 1.25,
      unit: 'sans unité · paramètre interne du modèle', explanation: 'Révision explicite du second modèle.' });
    expect(branch).toEqual(before);
    const result = simulateBrewingScenario(scenarioRequest(prepared, revised), prepared.runtime);
    expect(result.branches[0].dependencySnapshot.scenarioModelInstances).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: expect.stringContaining('scenario-model-') }),
    ]));
    expect(prepared.runtime.engineData.knowledge.find(row => row.id === secondModel.id)).toMatchObject({ matrix: secondModel.matrix });
  });

  it('corrige le même paramètre sans écraser son ancienne raison ni dupliquer l’override actif', () => {
    const { prepared } = harness();
    const option = getHopV55ScenarioHypothesisOptions(prepared).modelParameters.find(row => row.parameter.kind === 'gain')!;
    const first = reviseHopV55ModelHypothesis({ prepared, branch: baseBranch(), modelId: option.modelId,
      parameter: option.parameter, unit: option.unit, range: { min: 1.1, max: 1.3 }, central: 1.2,
      explanation: 'Première hypothèse déclarée.' });
    const oldId = first.modelOverrides![0].assumptionId;
    const oldContent = structuredClone(first.assumptions[0]);
    const corrected = reviseHopV55ModelHypothesis({ prepared, branch: first, modelId: option.modelId,
      parameter: option.parameter, unit: option.unit, range: { min: 1.2, max: 1.6 }, central: 1.4,
      explanation: 'Correction motivée de la plage.' });
    const activeOverride = corrected.modelOverrides!.filter(row => row.modelId === option.modelId && row.parameter.kind === 'gain');

    expect(activeOverride).toHaveLength(1);
    expect(corrected.assumptions.find(row => row.id === oldId)).toMatchObject({ ...oldContent, status: 'proposed' });
    expect(corrected.assumptions.find(row => row.id === activeOverride[0].assumptionId)).toMatchObject({
      status: 'selected', range: { min: 1.2, max: 1.6 }, central: 1.4, explanation: 'Correction motivée de la plage.',
    });
    expect(corrected.assumptions).toHaveLength(2);
  });

  it('exige plage et central déclarés dans l’intervalle et refuse modèle/unité non résolus', () => {
    const { prepared } = harness();
    const input = modelEdit(prepared);
    expect(() => reviseHopV55ModelHypothesis({ ...input, central: 9 })).toThrow(/central explicite doit rester dans la plage/i);
    expect(() => reviseHopV55ModelHypothesis({ ...input, central: undefined })).toThrow(/central dans la plage/i);
    expect(() => reviseHopV55ModelHypothesis({ ...input, unit: 'pourcentage inventé' })).toThrow(/Unité attendue/i);
    expect(() => reviseHopV55ModelHypothesis({ ...input, modelId: 'Modèle aux oranges' })).toThrow(/exact n’est pas chargé/i);

    const ambiguousPrepared = structuredClone(prepared);
    const model = (extrapolationBootstrap as HopExtrapolation[])[0];
    ambiguousPrepared.runtime.engineData.knowledge.push({ ...structuredClone(model), version: `${model.version}-autre-version` });
    expect(getHopV55ScenarioHypothesisOptions(ambiguousPrepared).ambiguousModels).toContainEqual(expect.objectContaining({ id: model.id }));
    expect(() => reviseHopV55ModelHypothesis({ ...input, prepared: ambiguousPrepared, modelId: model.id }))
      .toThrow(/exact n’est pas chargé/i);
  });

  it('lie une analogie descriptive aux deux identités chargées, la corrige append-only et refuse un nom ou ID absent', () => {
    const { prepared, target, reference, alternateReference } = harness();
    const branch = baseBranch();
    const revised = reviseHopV55Analogy({ prepared, branch, edit: { kind: 'hopDescriptions',
      targetVarietyId: target.id, referenceVarietyId: reference.id, explanation: 'Comparer ce descripteur, sans transférer de mesure.' } });
    expect(revised.analogies).toContainEqual(expect.objectContaining({ kind: 'hopDescriptions',
      targetVarietyId: target.id, referenceVarietyId: reference.id }));
    const selected = revised.assumptions[0];
    expect(selected).toMatchObject({ status: 'selected', origin: 'analogy', value: reference.id,
      source: descriptionSource, explanation: 'Comparer ce descripteur, sans transférer de mesure.' });
    expect(branch.analogies).toBeUndefined();
    const sameChoice = reviseHopV55Analogy({ prepared, branch: revised, edit: { kind: 'hopDescriptions',
      targetVarietyId: target.id, referenceVarietyId: reference.id, explanation: 'Comparer ce descripteur, sans transférer de mesure.' } });
    expect(sameChoice.analogies).toHaveLength(1);
    expect(sameChoice.assumptions.filter(row => row.id === selected.id)).toHaveLength(1);
    const corrected = reviseHopV55Analogy({ prepared, branch: sameChoice, edit: { kind: 'hopDescriptions',
      targetVarietyId: target.id, referenceVarietyId: alternateReference.id, explanation: 'Tester une autre source descriptive.' } });
    expect(corrected.analogies).toHaveLength(1);
    expect(corrected.analogies[0]).toMatchObject({ referenceVarietyId: alternateReference.id });
    expect(corrected.assumptions.find(row => row.id === selected.id)).toMatchObject({ status: 'proposed', explanation: selected.explanation });
    expect(() => reviseHopV55Analogy({ prepared, branch, edit: { kind: 'hopDescriptions',
      targetVarietyId: target.name, referenceVarietyId: reference.id, explanation: 'Nom donné à la place de l’ID.' } }))
      .toThrow(/deux variétés distinctes et chargées/i);
    expect(() => reviseHopV55Analogy({ prepared, branch, edit: { kind: 'hopDescriptions',
      targetVarietyId: target.id, referenceVarietyId: 'identity-with-a-similar-name-only', explanation: 'Référence absente.' } }))
      .toThrow(/deux variétés distinctes et chargées/i);
    const result = simulateBrewingScenario(scenarioRequest(prepared, corrected), prepared.runtime);
    const targetAfter = result.branches[0].dependencySnapshot.engineData.varieties.find(row => row.id === target.id);
    expect(targetAfter?.descriptions).toEqual(expect.arrayContaining([expect.objectContaining({ text: alternateReference.descriptions[0].text,
      source: expect.objectContaining({ kind: 'judgment', year: null }) })]));
  });

  it('ne transfère un profil de levure que depuis un profil modèle sourcé applicable', () => {
    const { prepared, loadedReferenceYeast, loadedTargetYeast } = harness();
    const revised = reviseHopV55Analogy({ prepared, branch: baseBranch(), edit: { kind: 'yeastProfile',
      targetYeastId: loadedTargetYeast.id, referenceYeastId: loadedReferenceYeast.id,
      explanation: 'Analogie ciblée de profil, pas mesure de la culture cible.' } });
    expect(revised.analogies).toContainEqual(expect.objectContaining({ kind: 'yeastProfile',
      targetYeastId: loadedTargetYeast.id, referenceYeastId: loadedReferenceYeast.id }));
    expect(revised.assumptions[0]).toMatchObject({ status: 'selected', origin: 'analogy', value: loadedReferenceYeast.id,
      source: loadedReferenceYeast.source });
    const result = simulateBrewingScenario(scenarioRequest(prepared, revised), prepared.runtime);
    expect(result.branches[0].limitations.join(' ')).toContain('analogie');
  });
});
