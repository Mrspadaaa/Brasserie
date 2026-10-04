import { describe, expect, it } from 'vitest';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopDecisionProgram, HopProgramChange } from '../../src/domain/hopDecision/types';
import knowledge from '../../src/data/hopKnowledgeBootstrap.json';
import {
  brewingScenarioCurrentReference,
  buildBrewingScenarioRequest,
  simulateBrewingScenario,
  type BrewingScenarioBranchRequest,
  type BrewingScenarioResult,
} from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { previewHopProgramChanges } from '../../src/domain/hopDecision/programs';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { assertHopV55ProgramCopy, applyHopV55ProgramCopy, previewHopV55ProgramCopy } from '../../src/services/hopV55/programCopy';

function context() {
  const context = makeHopV55FixtureContext('fermenting');
  if (context.hopIndex) context.hopIndex.knowledge = structuredClone(knowledge) as HopKnowledge[];
  return context;
}

function scenario(ctx = context(), branchPatch: Partial<BrewingScenarioBranchRequest> = {}): {
  result: BrewingScenarioResult; branch: BrewingScenarioBranchRequest; ctx: ReturnType<typeof context>
} {
  const prepared = prepareBrewingScenarioContext(ctx);
  const current = prepared.runtime.current;
  if (!current?.program) throw new Error('La fixture active doit fournir un programme réel.');
  const performed = current.program.additions.find(row => row.status === 'performed');
  const future = current.program.additions.find(row => row.status === 'planned');
  if (!performed || !future) throw new Error('La fixture active doit contenir un ajout réalisé et un ajout futur.');
  const request = buildBrewingScenarioRequest({ scenarioId: 'scenario-program-copy-fixture', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
    contextReference: brewingScenarioCurrentReference(current),
  } });
  const model = prepared.runtime.engineData.knowledge.find((row): row is HopExtrapolation => row.kind === 'extrapolation');
  const programChangeAssumption = { id: 'future-program-change', path: 'program.changes', label: 'Réglage futur', status: 'selected' as const,
    origin: 'userHypothesis' as const, explanation: 'Dose et contact décidés pour le programme futur.', value: 'dose et contact futurs' };
  const assumptions = [programChangeAssumption];
  const modelOverrides: NonNullable<BrewingScenarioBranchRequest['modelOverrides']> = [];
  if (model) {
    assumptions.push({ id: 'math-annex', path: 'model.matrix', label: 'Annexe de calcul', status: 'selected',
      origin: 'userHypothesis', explanation: 'Hypothèse conservée séparément du programme J1.',
      range: structuredClone(model.matrix.range), central: model.matrix.central, unit: 'sans unité' });
    modelOverrides.push({ modelId: model.id, parameter: { kind: 'matrix' }, assumptionId: 'math-annex' });
  }
  const change: HopProgramChange = { kind: 'replace', additionId: future.id, additions: [{ ...structuredClone(future), grams: 36, contactHours: 72 }] };
  const { assumptions: extraAssumptions, ...patch } = branchPatch;
  const branch: BrewingScenarioBranchRequest = { ...patch, id: 'future-addition', label: 'Dose future corrigée',
    assumptions: [...assumptions, ...(extraAssumptions ?? [])], programChanges: branchPatch.programChanges ?? [change],
    ...(modelOverrides.length && branchPatch.modelOverrides === undefined ? { modelOverrides } : {}) };
  request.branches.push(branch);
  return { result: simulateBrewingScenario(request, prepared.runtime), branch, ctx };
}

function hotSideContext() {
  const ctx = makeHopV55FixtureContext('planning');
  if (ctx.hopIndex) ctx.hopIndex.knowledge = structuredClone(knowledge) as HopKnowledge[];
  ctx.batch = { id: 'batch-hot-side-fixture', status: 'planifie' };
  ctx.journal = { startedAt: Date.parse('2026-10-01T09:00:00.000Z'),
    additions: { 'hop-0': { doneAt: Date.parse('2026-10-01T10:00:00.000Z'), amount: 40, unit: 'g' } } };
  return ctx;
}

describe('Copie locale du programme J1 depuis une branche J5 fraîche', () => {
  it('copie dose et contact du futur sans transformer le stade réel ni toucher l’ajout réalisé, le batch ou le journal', () => {
    const { ctx, result } = scenario();
    const before = structuredClone({ ctx, result });
    const branch = result.branches[0];
    expect(branch.applicability).toBe('conditional');
    expect(branch.program?.stage).toBe('fermenting');
    expect(branch.program?.additions.find(row => row.status === 'performed')?.grams).toBe(40);
    expect(result.requestSnapshot.branches[0].modelOverrides).toHaveLength(1);
    expect(branch.assumptions.find(row => row.id === 'math-annex')).toMatchObject({ status: 'selected', path: 'model.matrix' });

    const preview = previewHopV55ProgramCopy({ result, branchId: 'future-addition', context: ctx });
    expect(preview.status).toBe('ready');
    if (preview.status !== 'ready') throw new Error(preview.reason);
    expect(preview.preview.programBefore.stage).toBe('fermenting');
    expect(preview.preview.programAfter.stage).toBe('fermenting');
    expect(preview.preview.programAfter.additions.find(row => row.status === 'planned')).toMatchObject({ grams: 36, contactHours: 72 });
    expect(preview.preview.programAfter.additions.find(row => row.status === 'performed'))
      .toEqual(preview.preview.programBefore.additions.find(row => row.status === 'performed'));
    expect(preview.preview.inputAfter).toEqual(branch.input);
    expect(preview.preview.sourceRuntimeReference).toBe(branch.dependencySnapshot.reference);

    const applied = applyHopV55ProgramCopy({ preview: preview.preview, context: ctx,
      copyId: 'program-copy-future-1', createdAt: '2026-10-02T12:00:00.000Z' });
    expect(applied.status).toBe('ready');
    if (applied.status !== 'ready') throw new Error(applied.reason);
    expect(applied.copy).toMatchObject({ format: 'hop-v55-program-copy-v1', id: 'program-copy-future-1',
      sourceProgramId: preview.preview.sourceProgramId, batchId: ctx.batch.id, scope: 'local',
      scenarioId: result.scenarioId, snapshotReference: result.reference, branchId: 'future-addition', branchReference: branch.reference,
      contextReference: result.requestSnapshot.baseline.kind === 'recipe' ? result.requestSnapshot.baseline.contextReference : '',
      sourceRuntimeReference: branch.dependencySnapshot.reference, inputAfter: branch.input });
    expect(applied.copy.id).not.toBe(applied.copy.sourceProgramId);
    expect(applied.copy.programAfter.stage).toBe('fermenting');
    expect(applied.copy.programAfter.additions.find(row => row.status === 'performed'))
      .toEqual(applied.copy.programBefore.additions.find(row => row.status === 'performed'));
    expect(applied.copy.programAfter.additions.find(row => row.status === 'planned')).toMatchObject({ grams: 36, contactHours: 72 });
    expect(applied.copy.previewReference).toMatch(/^hop-v55-program-copy-payload-v1:sha256:/);
    expect(() => assertHopV55ProgramCopy(applied.copy)).not.toThrow();
    expect(ctx).toEqual(before.ctx);
    expect(result).toEqual(before.result);
  });

  it('refuse une source dont la température de contact ou le batch a changé depuis l’aperçu', () => {
    const { ctx, result } = scenario();
    const previewed = previewHopV55ProgramCopy({ result, branchId: 'future-addition', context: ctx });
    if (previewed.status !== 'ready') throw new Error('Aperçu J1 attendu.');

    const changedTemperature = structuredClone(ctx);
    changedTemperature.recipe.hops[1].aromaTemperatureC = 17;
    const temperatureState = structuredClone(changedTemperature);
    const staleTemperature = applyHopV55ProgramCopy({ preview: previewed.preview, context: changedTemperature,
      copyId: 'stale-temperature', createdAt: '2026-10-02T12:00:00.000Z' });
    expect(staleTemperature.status).toBe('blocked');
    if (staleTemperature.status !== 'blocked') throw new Error('Une source modifiée doit bloquer.');
    expect(staleTemperature.recompute).toBe(true);
    expect(staleTemperature.reason).toMatch(/contexte a changé|ne peut pas être recalculé/i);
    expect(changedTemperature).toEqual(temperatureState);

    const changedCatalogue = structuredClone(ctx);
    changedCatalogue.hopIndex!.varieties[0].name = 'Référence catalogue changée';
    const catalogueState = structuredClone(changedCatalogue);
    const staleCatalogue = applyHopV55ProgramCopy({ preview: previewed.preview, context: changedCatalogue,
      copyId: 'stale-catalogue', createdAt: '2026-10-02T12:00:00.000Z' });
    expect(staleCatalogue.status).toBe('blocked');
    if (staleCatalogue.status !== 'blocked') throw new Error('Un catalogue modifié doit périmer le snapshot.');
    expect(staleCatalogue.recompute).toBe(true);
    expect(staleCatalogue.reason).toMatch(/snapshot archivé diffère/i);
    expect(changedCatalogue).toEqual(catalogueState);

    const changedBatch = structuredClone(ctx);
    changedBatch.batch.id = 'another-batch-id';
    const batchState = structuredClone(changedBatch);
    const staleBatch = applyHopV55ProgramCopy({ preview: previewed.preview, context: changedBatch,
      copyId: 'stale-batch', createdAt: '2026-10-02T12:00:00.000Z' });
    expect(staleBatch.status).toBe('blocked');
    if (staleBatch.status !== 'blocked') throw new Error('Un batch différent doit bloquer.');
    expect(staleBatch.recompute).toBe(true);
    expect(changedBatch).toEqual(batchState);
  });

  it('bloque une compensation d’une phase fermée au hotSide sans convertir le programme en planning', () => {
    const ctx = hotSideContext();
    const prepared = prepareBrewingScenarioContext(ctx);
    const program = prepared.runtime.current?.program;
    expect(program?.stage).toBe('hotSide');
    if (!program) throw new Error('Programme hotSide attendu.');
    const before = structuredClone(ctx);
    const future = program.additions.find(row => row.status === 'planned');
    if (!future) throw new Error('Ajout futur attendu.');
    const compensation: HopProgramChange = { kind: 'replace', additionId: future.id,
      additions: [{ ...structuredClone(future), use: 'firstWort' }] };
    expect(() => previewHopProgramChanges(program, [compensation], prepared.runtime.materials)).toThrow(/déjà passé/i);
    expect(ctx).toEqual(before);
    expect(program.stage).toBe('hotSide');
  });

  it('ne copie pas des overrides de volume ou de levure non traduits dans le programme futur', () => {
    const ctx = context();
    const prepared = prepareBrewingScenarioContext(ctx);
    const currentVolume = prepared.runtime.current?.input.volumeL;
    if (currentVolume === undefined) throw new Error('Volume courant attendu dans la fixture.');
    const extraAssumptions = [
      { id: 'volume-extra', path: 'recipe.volumeL', label: 'Volume de recette', status: 'selected' as const,
        origin: 'userHypothesis' as const, explanation: 'Volume explicitement exploré.', value: currentVolume, unit: 'L' },
      { id: 'yeast-extra', path: 'recipe.yeastId', label: 'Souche explorée', status: 'selected' as const,
        origin: 'userHypothesis' as const, explanation: 'Hypothèse de culture hors portée de la copie programme.', value: 'yeast-extra-fixture' },
    ];
    const { result, ctx: sourceContext } = scenario(ctx, { inputOverrides: { volumeL: currentVolume, yeastId: 'yeast-extra-fixture' }, assumptions: extraAssumptions });
    expect(result.branches[0].applicability).toBe('hypotheticalOnly');
    const preview = previewHopV55ProgramCopy({ result, branchId: 'future-addition', context: sourceContext });
    expect(preview.status).toBe('blocked');
    if (preview.status !== 'blocked') throw new Error('La portée hors J1 doit rester en exploration.');
    expect(preview.reason).toMatch(/branche entière est hypothétique|changement d’entrée/i);
  });

  it('refuse les références altérées et un ID qui réutilise le programme source', () => {
    const { ctx, result } = scenario();
    const previewed = previewHopV55ProgramCopy({ result, branchId: 'future-addition', context: ctx });
    if (previewed.status !== 'ready') throw new Error('Aperçu J1 attendu.');
    const applied = applyHopV55ProgramCopy({ preview: previewed.preview, context: ctx,
      copyId: 'program-copy-4', createdAt: '2026-10-02T12:00:00.000Z' });
    if (applied.status !== 'ready') throw new Error(applied.reason);
    const altered = { ...applied.copy, branchReference: 'branchReference-altérée' };
    expect(() => assertHopV55ProgramCopy(altered)).toThrow(/Référence de contenu.*altérée/i);

    const wrongSourceId = applyHopV55ProgramCopy({ preview: previewed.preview, context: ctx,
      copyId: previewed.preview.sourceProgramId, createdAt: '2026-10-02T12:00:00.000Z' });
    expect(wrongSourceId.status).toBe('blocked');
    if (wrongSourceId.status !== 'blocked') throw new Error('Un ID source ne peut pas être réutilisé comme ID de copie.');
    expect(wrongSourceId.reason).toMatch(/distinct du programme source/i);
  });
});
