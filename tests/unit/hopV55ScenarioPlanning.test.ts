import { describe, expect, it } from 'vitest';
import type { HopAxis, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { BrewingStyleGuide } from '../../functions/src/brewingStyleSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { assertBrewingScenarioRequest, BREWING_SCENARIO_VERSION, brewingScenarioCurrentReference, type BrewingScenarioRequest } from '../../src/domain/brewingScenario';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import {
  applyHopV55PlanningEdits,
  getHopV55PlanningAxes,
  getHopV55PlanningStage,
  getHopV55PlanningStyles,
  HopV55ScenarioPlanningError,
} from '../../src/services/hopV55/scenarioPlanning';
import { hopV55FixtureSource } from '../fixtures/hopV55';

const axis: HopAxis = {
  id: 'axis-planning-citrus', kind: 'axis', name: 'Citrus synthétique', version: 'axis-fixture-v3',
  description: 'Axe de test uniquement.', scale: { min: 0, max: 10 }, lowMax: 3, mediumMax: 7,
  weight: { range: { min: 1, max: 1 }, source: hopV55FixtureSource }, source: hopV55FixtureSource,
};

const styleGuide: BrewingStyleGuide = {
  id: 'style-guide-planning-fixture', kind: 'styleGuide', name: 'Guide synthétique', version: 'guide-fixture-v1',
  enabled: true, edition: 'Fixture locale', retrievedAt: null, createdAt: '2026-10-02', attribution: 'Fixture locale uniquement',
  source: hopV55FixtureSource,
  styles: [{ id: 'style-planning-fixture', code: 'F-1', name: 'Bière témoin', aliases: [], family: 'Fixture', stats: {}, source: hopV55FixtureSource }],
};

const alternateYeast: HopYeast = { id: 'yeast-planning-alternate', kind: 'yeast', name: 'Culture témoin alternative',
  betaLyase: 'unknown', source: hopV55FixtureSource };

function harness(mode: 'planning' | 'fermenting' = 'planning') {
  const context = makeHopV55FixtureContext(mode);
  context.hopIndex!.knowledge.push(structuredClone(axis), structuredClone(styleGuide), structuredClone(alternateYeast));
  const prepared = prepareBrewingScenarioContext(context);
  return { context, prepared };
}

const branchId = 'scenario-planning-test';

function assertRecipeRequest(prepared: ReturnType<typeof prepareBrewingScenarioContext>, branch: BrewingScenarioBranchRequest,
  target?: BrewingScenarioRequest['target']) {
  const current = prepared.runtime.current!;
  assertBrewingScenarioRequest({ version: BREWING_SCENARIO_VERSION, scenarioId: 'planning-contract-check', revision: 0,
    baseline: { kind: 'recipe', recipeReference: current.recipeReference, inputReference: current.inputReference,
      ...(current.program ? { programReference: programFingerprint(current.program) } : {}),
      contextReference: brewingScenarioCurrentReference(current) }, ...(target ? { target } : {}), assumptions: [], branches: [branch] });
}

describe('Édition typée d’une branche de planification V5.5', () => {
  it('applique volume final, souche, ensemencement et paliers explicites sans modifier la source', () => {
    const { context, prepared } = harness();
    const contextBefore = structuredClone(context);
    const preparedBefore = structuredClone(prepared);
    const yeastId = prepared.runtime.current!.input.yeastId!;
    const phases = [
      { kind: 'primaire', name: 'Primaire déclarée', tempC: 18.5, days: 6 },
      { kind: 'garde', name: 'Garde déclarée', tempC: 3, days: 12, note: 'Exemple synthétique.' },
    ];

    const result = applyHopV55PlanningEdits({ prepared, branchId, label: 'Essai fermentation explicite', edits: {
      volumeL: { action: 'set', value: 28.5 }, yeastId: { action: 'set', value: yeastId },
      pitchTempC: { action: 'set', value: 19.25 }, fermentation: { action: 'set', value: phases },
    } });

    expect(result.branch.inputOverrides).toMatchObject({ volumeL: 28.5, yeastId, pitchTempC: 19.25, fermentation: phases });
    expect(result.branch.programOverrides?.volumeL).toBe(28.5);
    expect(result.branch.programChanges).toBeUndefined();
    expect(result.branch.assumptions.filter(row => row.status === 'selected').map(row => row.path)).toEqual([
      'recipe.volumeL', 'program.volumeL', 'recipe.yeastId', 'recipe.pitchTempC', 'recipe.fermentation',
    ]);
    expect(result.branch.assumptions.every(row => row.origin === 'userHypothesis')).toBe(true);
    expect(result.branch.assumptions.find(row => row.path === 'recipe.volumeL')).toMatchObject({ value: 28.5, unit: 'L' });
    expect(result.branch.assumptions.find(row => row.path === 'recipe.pitchTempC')).toMatchObject({ value: 19.25, unit: '°C' });
    expect(result.branch.assumptions.find(row => row.path === 'recipe.fermentation')?.value).toBe(JSON.stringify(phases));
    assertRecipeRequest(prepared, result.branch);
    expect(context).toEqual(contextBefore);
    expect(prepared).toEqual(preparedBefore);
  });

  it('réinitialise les overrides numériques sans garder leur ancienne valeur cachée', () => {
    const { prepared } = harness();
    const branch = {
      id: branchId, label: 'Volume antérieur', assumptions: [
        { id: 'old-input-volume', path: 'recipe.volumeL', label: 'Volume choisi', status: 'selected' as const,
          origin: 'userHypothesis' as const, explanation: 'Choix précédent.', value: 33, unit: 'L' },
        { id: 'old-program-volume', path: 'program.volumeL', label: 'Volume programme', status: 'selected' as const,
          origin: 'userHypothesis' as const, explanation: 'Choix précédent.', value: 33, unit: 'L' },
      ], inputOverrides: { volumeL: 33 }, programOverrides: { volumeL: 33 },
    };
    const result = applyHopV55PlanningEdits({ prepared, branch, branchId, label: 'Retour à la source', edits: {
      volumeL: { action: 'reset' },
    } });
    expect(result.branch.inputOverrides).toBeUndefined();
    expect(result.branch.programOverrides).toBeUndefined();
    expect(result.branch.assumptions.map(row => [row.path, row.status, row.value])).toEqual([
      ['recipe.volumeL', 'proposed', 33], ['program.volumeL', 'proposed', 33],
    ]);
    expect(result.target).toBeUndefined();
  });

  it('lie une souche choisie à une projection unique sans réécrire la culture source, puis restaure le contexte antérieur', () => {
    const { context, prepared } = harness();
    const originalContext = structuredClone(context);
    const branch = { id: 'culture-plan', label: 'Culture à comparer', assumptions: [],
      culture: { state: 'unknown' as const, members: [], explanation: 'Contexte de branche antérieur.' } };
    const selected = applyHopV55PlanningEdits({ prepared, branch, branchId: branch.id, label: branch.label, edits: {
      yeastId: { action: 'set', value: alternateYeast.id },
    } });
    expect(selected.branch.inputOverrides?.yeastId).toBe(alternateYeast.id);
    expect(selected.branch.culture).toMatchObject({ state: 'single', members: [{ yeastId: alternateYeast.id, name: alternateYeast.name }] });
    expect(selected.branch.assumptions.find(row => row.path === 'planning.previousCulture')?.value).toBe(JSON.stringify(branch.culture));
    expect(context).toEqual(originalContext);

    const reset = applyHopV55PlanningEdits({ prepared, branch: selected.branch, branchId: branch.id, label: branch.label, edits: {
      yeastId: { action: 'reset' },
    } });
    expect(reset.branch.inputOverrides).toBeUndefined();
    expect(reset.branch.culture).toEqual(branch.culture);
    expect(reset.branch.assumptions.find(row => row.path === 'recipe.yeastId')?.status).toBe('proposed');
  });

  it('refuse les champs incomplets et les valeurs invalides au lieu de fabriquer des cibles', () => {
    const { prepared } = harness();
    const commit = (edits: Parameters<typeof applyHopV55PlanningEdits>[0]['edits']) => applyHopV55PlanningEdits({
      prepared, branchId, label: 'Invalide', edits,
    });
    expect(() => commit({ volumeL: { action: 'set', value: 0 } })).toThrow(HopV55ScenarioPlanningError);
    expect(() => commit({ pitchTempC: { action: 'set', value: Number.NaN } })).toThrow(/température d’ensemencement/);
    expect(() => commit({ fermentation: { action: 'set', value: [{ kind: 'primaire', name: 'Sans durée', tempC: 18 }] } }))
      .toThrow(/type, un libellé, une température et une durée explicites/);
    expect(() => commit({ axisTargets: { [axis.id]: { action: 'set', value: { min: 4, max: 3 } } } })).toThrow(/échelle/);
    expect(() => commit({ axisTargets: { [axis.id]: { action: 'set', value: { min: 2, max: 11 } } } })).toThrow(/échelle/);
  });

  it('préserve les changements J1, les overrides de modèle et les analogies déjà attachés', () => {
    const { prepared } = harness();
    const currentProgram = prepared.runtime.current!.program!;
    const change = { kind: 'remove' as const, additionId: currentProgram.additions[0].id };
    const model = { modelId: 'fixture-model', parameter: { kind: 'matrix' as const }, assumptionId: 'model-matrix-choice' };
    const analogy = { kind: 'hopDescriptions' as const, targetVarietyId: 'target-variety-fixture',
      referenceVarietyId: 'reference-variety-fixture', assumptionId: 'analogy-choice', explanation: 'Analogie fixture.' };
    const branch = {
      id: branchId, label: 'J1 et modèle', assumptions: [
        { id: 'program-choice', path: 'program.changes', label: 'Conduite prévue', status: 'selected' as const,
          origin: 'userHypothesis' as const, explanation: 'Ligne future retirée.', value: change.additionId },
        { id: 'model-matrix-choice', path: 'model.matrix', label: 'Matrice synthétique', status: 'selected' as const,
          origin: 'userHypothesis' as const, explanation: 'Choix moteur conservé.', value: 1 },
        { id: 'analogy-choice', path: 'analogy.hopDescriptions', label: 'Analogie déclarée', status: 'selected' as const,
          origin: 'analogy' as const, explanation: 'Choix lexical conservé.', value: 'declared' },
      ], programChanges: [change], modelOverrides: [model], analogies: [analogy],
    };
    const before = structuredClone(branch);
    const result = applyHopV55PlanningEdits({ prepared, branch, branchId, label: 'J1 avec note cible', edits: {
      beerTargets: { ibuTarget: { action: 'set', value: 24 } },
    } });
    expect(result.branch.programChanges).toEqual(before.programChanges);
    expect(result.branch.modelOverrides).toEqual(before.modelOverrides);
    expect(result.branch.analogies).toEqual(before.analogies);
    expect(result.branch.assumptions.find(row => row.path === 'beerContext.target.ibuTarget')).toMatchObject({
      status: 'selected', origin: 'userHypothesis', value: 24, unit: 'IBU',
    });
    expect(branch).toEqual(before);
  });

  it('distingue style cible et référence, et ne convertit pas la référence en cible de recette', () => {
    const { context, prepared } = harness();
    const [style] = getHopV55PlanningStyles(context);
    expect(style).toMatchObject({ guideId: styleGuide.id, version: styleGuide.version, styleId: styleGuide.styles[0].id });
    const selected = { name: style.name, reference: { ...style.reference, role: 'target' as const } };
    const targetResult = applyHopV55PlanningEdits({ prepared, context, branchId, label: 'Style cible déclaré', edits: {
      style: { action: 'set', value: selected },
    } });
    expect(targetResult.branch.beerContext?.style).toEqual({ ...style.reference, role: 'target' });
    expect(targetResult.branch.beerContext?.facts.find(row => row.field === 'style.name' && row.status === 'target')).toMatchObject({
      status: 'target', origin: 'userHypothesis', value: style.name, source: style.source,
    });

    const referenceResult = applyHopV55PlanningEdits({ prepared, context, branchId: 'scenario-reference-style', label: 'Comparaison seule', edits: {
      style: { action: 'set', value: { name: style.name, reference: { ...style.reference, role: 'reference' } } },
    } });
    expect(referenceResult.branch.beerContext?.style).toEqual({ ...style.reference, role: 'reference' });
    const baselineStyleName = prepared.runtime.current?.beerContext?.facts.find(row => row.field === 'style.name' && row.status === 'target')?.value;
    const retainedStyleTargets = referenceResult.branch.beerContext?.facts.filter(row => row.field === 'style.name' && row.status === 'target') ?? [];
    expect(retainedStyleTargets.map(row => row.value)).toEqual(baselineStyleName === undefined ? [] : [baselineStyleName]);
    expect(retainedStyleTargets.some(row => row.value === style.name && row.value !== baselineStyleName)).toBe(false);
  });

  it('conserve les autres cibles, respecte les plages des axes réellement chargés et ne choisit aucun milieu', () => {
    const { context, prepared } = harness();
    const result = applyHopV55PlanningEdits({ prepared, context, branchId, label: 'Cible d’axe',
      target: { [axis.id]: { min: 1, max: 4 }, 'axis-not-loaded': { min: 2, max: 8 } },
      edits: { axisTargets: { [axis.id]: { action: 'set', value: { min: 3, max: 8 } } } },
    });
    expect(result.target).toEqual({ [axis.id]: { min: 3, max: 8 }, 'axis-not-loaded': { min: 2, max: 8 } });
    expect(result.branch.assumptions).toContainEqual(expect.objectContaining({
      path: `target.${axis.id}`, range: { min: 3, max: 8 }, unit: 'axisScale', basis: `${axis.id}@${axis.version}`,
    }));
    expect(result.branch.assumptions.find(row => row.path === `target.${axis.id}`)).not.toHaveProperty('central');
    assertRecipeRequest(prepared, result.branch, result.target);
    expect(getHopV55PlanningAxes(prepared).map(row => row.id)).toContain(axis.id);
  });

  it('refuse une plage si la définition source de l’axe a changé depuis la préparation', () => {
    const { context, prepared } = harness();
    const liveAxis = context.hopIndex!.knowledge.find(row => row.kind === 'axis' && row.id === axis.id) as HopAxis;
    liveAxis.version = 'axis-fixture-v4';
    expect(() => applyHopV55PlanningEdits({ prepared, context, branchId, label: 'Définition périmée', edits: {
      axisTargets: { [axis.id]: { action: 'set', value: { min: 1, max: 3 } } },
    } })).toThrow(/définition source de l’axe .* a changé/);
  });

  it('revalide le guide et la version de style contre le catalogue reçu au moment du commit', () => {
    const { context, prepared } = harness();
    const selected = { name: styleGuide.styles[0].name,
      reference: { guideId: styleGuide.id, version: styleGuide.version, styleId: styleGuide.styles[0].id, role: 'target' as const } };
    const liveGuide = context.hopIndex!.knowledge.find(row => row.kind === 'styleGuide' && row.id === styleGuide.id) as BrewingStyleGuide;
    liveGuide.version = 'guide-fixture-v2';
    expect(() => applyHopV55PlanningEdits({ prepared, context, branchId: 'stale-style', label: 'Guide périmé', edits: {
      style: { action: 'set', value: selected },
    } })).toThrow(/style choisi n’est plus résolu/);
  });

  it('garde les comparaisons possibles pendant la fermentation et refuse un changement de souche réalisé', () => {
    const { prepared } = harness('fermenting');
    const axisResult = applyHopV55PlanningEdits({ prepared, branchId, label: 'Comparaison de fermentation',
      edits: { axisTargets: { [axis.id]: { action: 'set', value: { min: 1, max: 2 } } } },
    });
    expect(axisResult.target).toEqual({ [axis.id]: { min: 1, max: 2 } });
    expect(() => applyHopV55PlanningEdits({ prepared, branchId: 'late-culture', label: 'Trop tard', edits: {
      yeastId: { action: 'set', value: prepared.runtime.current!.input.yeastId },
    } })).toThrow(/fermentation/);
  });

  it('verrouille les consignes si le stade du contexte réel a avancé depuis la préparation', () => {
    const { context, prepared } = harness();
    const lateContext = makeHopV55FixtureContext('fermenting');
    context.batch = lateContext.batch;
    context.journal = lateContext.journal;
    expect(getHopV55PlanningStage(prepared, context)).toBe('unknown');
    expect(() => applyHopV55PlanningEdits({ prepared, context, branchId: 'stale-process-stage', label: 'Stade périmé', edits: {
      pitchTempC: { action: 'set', value: 19 },
    } })).toThrow(/stade inconnu|stade|future/i);
    const comparison = applyHopV55PlanningEdits({ prepared, context, branchId: 'stale-stage-comparison', label: 'Comparaison encore possible',
      edits: { beerTargets: { ibuTarget: { action: 'set', value: 22 } } },
    });
    expect(comparison.branch.beerContext?.facts.find(row => row.field === 'ibuTarget')?.value).toBe(22);
  });

  it('garde les cibles inconnues hors axes chargés et refuse de réduire une culture composée à une souche', () => {
    const { prepared } = harness();
    const mixed = structuredClone(prepared);
    mixed.runtime.current!.culture = { state: 'mixed', members: [
      { yeastId: 'fixture-member-a', name: 'Membre A' }, { yeastId: 'fixture-member-b', name: 'Membre B' },
    ] };
    expect(() => applyHopV55PlanningEdits({ prepared: mixed, branchId: 'mixed-culture', label: 'Culture composée', edits: {
      yeastId: { action: 'set', value: mixed.runtime.current!.input.yeastId },
    } })).toThrow(/culture est composée/);
    const preserved = applyHopV55PlanningEdits({ prepared, branchId: 'unknown-axis-preserved', label: 'Conserver axe inconnu',
      target: { 'axis-not-loaded': { min: 1, max: 3 } }, edits: {
        beerTargets: { ogTarget: { action: 'set', value: 1.05 } },
      },
    });
    expect(preserved.target).toBeUndefined();
    expect(preserved.branch.beerContext?.facts.find(row => row.field === 'ogTarget')?.value).toBe(1.05);
  });
});
