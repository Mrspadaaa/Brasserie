import { describe, it, expect } from 'vitest';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { simulateBrewingScenario } from '../../src/domain/brewingScenario';
import { createHopV55ScenarioRequest } from '../../src/services/hopV55/scenarioAdapter';

describe('Raccord du geste React vers le scénario réel', () => {
  it('relie une dose décimale à sa raison J1 sans modifier le programme source', () => {
    const context = makeHopV55FixtureContext('planning');
    const prepared = prepareBrewingScenarioContext(context);
    const original = structuredClone(context);
    const source = prepared.runtime.current!.program!.additions[0];
    const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'manual-dose-fixture', revision: 1,
      intent: { question: 'Garder le floral, sans résine ni coco, pas plus d’amertume.', criteria: [] },
      branches: [{ id: 'precise-dose', label: 'Dose12,25', assumptions: [], programChanges: [
        { kind: 'replace', additionId: source.id, additions: [{ ...source, grams: 12.25 }] },
      ] }] });
    const result = simulateBrewingScenario(request, prepared.runtime);
    expect(result.branches[0].program!.additions[0].grams).toBe(12.25);
    expect(result.baseline.program!.additions[0].grams).toBe(40);
    expect(request.branches[0].assumptions.find(row => row.path === 'program.changes')?.explanation).toContain('sans résine ni coco');
    expect(context).toEqual(original);
  });
  it('conserve une cible explicite avec ses bornes sans la transformer en observation', () => {
    const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
    const target = { floral: { min: 18, max: 31 } };
    const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'target-fixture', revision: 1, target,
      intent: { question: 'Comparer à cette cible déclarée.', criteria: [] }, branches: [] });
    expect(request.target).toEqual(target);
    target.floral.min = 77;
    expect(request.target!.floral).toEqual({ min: 18, max: 31 });
    const result = simulateBrewingScenario(request, prepared.runtime);
    expect(result.requestSnapshot.target).toEqual({ floral: { min: 18, max: 31 } });
    expect(prepared.runtime.current!.beerContext?.facts.some(row => row.status === 'observed' && row.field === 'floral')).toBe(false);
  });
  it('refuse un passé absent puis accepte une hypothèse déclarée distincte du réel', () => {
    const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('unknown'));
    const input = { prepared, scenarioId: 'hypothesis-fixture', revision: 1, intent: { question: '', criteria: [] }, branches: [] };
    expect(() => createHopV55ScenarioRequest(input)).toThrow(/absence de programme/i);
    const request = createHopV55ScenarioRequest({ ...input, reference: { kind: 'hypothetical', label: 'Référence explicitement sans houblon',
      input: { volumeL: 18, yeastId: null, fermentation: [], additions: [] } } });
    expect(request.baseline.kind).toBe('hypothetical');
    expect(prepared.runtime.current).toBeUndefined();
    expect(simulateBrewingScenario(request, prepared.runtime).requestSnapshot.baseline.kind).toBe('hypothetical');
  });

  it('scinde un volume global remplacé par une branche et garde l’autre branche, modèle et analogie', () => {
    const context = makeHopV55FixtureContext('planning');
    const prepared = prepareBrewingScenarioContext(context);
    const sourceAssumptions = [
      { id: 'root-volume-recipe', path: 'recipe.volumeL', label: 'Volume de scénario', status: 'selected' as const,
        origin: 'userHypothesis' as const, explanation: 'Volume global avant révision.', value: 30, unit: 'L' },
      { id: 'root-volume-program', path: 'program.volumeL', label: 'Volume de programme', status: 'selected' as const,
        origin: 'userHypothesis' as const, explanation: 'Volume global avant révision.', value: 30, unit: 'L' },
      { id: 'root-model-matrix', path: 'model.matrix', label: 'Matrice du modèle', status: 'selected' as const,
        origin: 'userHypothesis' as const, explanation: 'Hypothèse de modèle à conserver.', value: 1 },
      { id: 'root-hop-analogy', path: 'analogy.hops', label: 'Analogie déclarée', status: 'selected' as const,
        origin: 'analogy' as const, explanation: 'La variété de référence sert uniquement d’analogie.', value: 'descripteurs' },
    ];
    const branches = [
      { id: 'volume-local-25', label: 'Volume local 25 L', assumptions: [
        { id: 'branch1-recipe-volume', path: 'recipe.volumeL', label: 'Volume de la branche', status: 'selected' as const,
          origin: 'userHypothesis' as const, explanation: 'Volume choisi explicitement dans cette branche.', value: 25, unit: 'L' },
        { id: 'branch1-program-volume', path: 'program.volumeL', label: 'Volume du programme', status: 'selected' as const,
          origin: 'userHypothesis' as const, explanation: 'Volume choisi explicitement dans cette branche.', value: 25, unit: 'L' },
      ], inputOverrides: { volumeL: 25 }, programOverrides: { volumeL: 25 }, analogies: [{
        kind: 'hopDescriptions' as const,
        targetVarietyId: context.hopIndex!.varieties[0].id,
        referenceVarietyId: context.hopIndex!.varieties[1].id,
        assumptionId: 'root-hop-analogy', explanation: 'Analogie héritée, conservée.' }],
      },
      { id: 'volume-inherited-30', label: 'Volume hérité 30 L', assumptions: [],
        inputOverrides: { volumeL: 30 }, programOverrides: { volumeL: 30 } },
    ];
    const originalAssumptions = structuredClone(sourceAssumptions);
    const originalBranches = structuredClone(branches);

    const request = createHopV55ScenarioRequest({ prepared, scenarioId: 'volume-root-revision', revision: 4,
      intent: { question: 'Conserver les hypothèses et réviser une branche.', criteria: [] }, branches, assumptions: sourceAssumptions });

    expect(sourceAssumptions).toEqual(originalAssumptions);
    expect(branches).toEqual(originalBranches);
    expect(request.assumptions.filter(row => row.id.startsWith('root-volume-')).map(row => row.status)).toEqual(['proposed', 'proposed']);
    expect(request.assumptions.find(row => row.id === 'root-model-matrix')).toEqual(originalAssumptions[2]);
    expect(request.assumptions.find(row => row.id === 'root-hop-analogy')).toEqual(originalAssumptions[3]);
    const local = request.branches.find(row => row.id === 'volume-local-25')!;
    const inherited = request.branches.find(row => row.id === 'volume-inherited-30')!;
    expect(local.assumptions.find(row => row.path === 'recipe.volumeL' && row.value === 25)?.status).toBe('selected');
    expect(local.assumptions.find(row => row.path === 'recipe.volumeL' && row.value === 30)?.status).toBe('proposed');
    expect(inherited.assumptions.find(row => row.path === 'recipe.volumeL' && row.value === 30)?.status).toBe('selected');
    expect(local.assumptions.find(row => row.path === 'program.volumeL' && row.value === 25)?.status).toBe('selected');
    expect(inherited.assumptions.find(row => row.path === 'program.volumeL' && row.value === 30)?.status).toBe('selected');
    expect(local.analogies?.[0].assumptionId).toBe('root-hop-analogy');

    const localScoped = local.assumptions.find(row => row.path === 'recipe.volumeL' && row.value === 30)!;
    const inheritedScoped = inherited.assumptions.find(row => row.path === 'recipe.volumeL' && row.value === 30)!;
    expect(localScoped.id).not.toBe(inheritedScoped.id);
    const repeated = createHopV55ScenarioRequest({ prepared, scenarioId: 'volume-root-revision', revision: 4,
      intent: { question: 'Conserver les hypothèses et réviser une branche.', criteria: [] }, branches, assumptions: sourceAssumptions });
    expect(repeated.branches.find(row => row.id === local.id)!.assumptions.find(row => row.path === 'recipe.volumeL' && row.value === 30)?.id)
      .toBe(localScoped.id);

    const result = simulateBrewingScenario(request, prepared.runtime);
    expect(result.branches.find(row => row.id === 'volume-local-25')?.input.volumeL).toBe(25);
    expect(result.branches.find(row => row.id === 'volume-inherited-30')?.input.volumeL).toBe(30);
  });

  it('refuse un override global incompatible sans choix local explicite', () => {
    const prepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('planning'));
    expect(() => createHopV55ScenarioRequest({ prepared, scenarioId: 'unroutable-global-assumption', revision: 1,
      intent: { question: '', criteria: [] }, assumptions: [
        { id: 'root-volume', path: 'recipe.volumeL', label: 'Volume global', status: 'selected', origin: 'userHypothesis',
          explanation: 'Valeur globale.', value: 30, unit: 'L' },
      ], branches: [{ id: 'unexplained-25', label: 'Sans hypothèse locale', assumptions: [], inputOverrides: { volumeL: 25 } }] }))
      .toThrow(/aucune hypothèse locale explicite/);
  });
});
