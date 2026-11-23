import { describe, expect, it } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopLot, HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import type { Recipe } from '../../src/types';
import {
  brewingScenarioCurrentReference,
  buildBrewingScenarioRequest,
  simulateBrewingScenario,
  type BrewingScenarioBranchRequest,
} from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { previewHopV55Branch, applyHopV55Copy } from '../../src/services/hopV55/application';

const source: HopSource = { kind: 'observation', title: 'Fixture locale', author: 'Test', year: 2026, reference: 'fixture:hop-v55' };
const variety = (id: string, name: string): HopVariety => ({ id, name, aliases: [], form: 'pelletT90',
  descriptions: [{ text: 'Description synthétique de fixture.', context: 'rawHop', source }], analysis: [] });

function recipe(): Recipe {
  return {
    id: 'recipe-source', name: 'Recette de fixture', style: 'Pale Ale', volumeL: 20,
    ogTarget: null, fgTarget: null, abvTarget: null, fermentables: [], totalGristKg: 0,
    hops: [{ name: 'Source', stage: 'boil', timeMin: 30, weightG: 20, alpha: 8, hopVarietyId: 'hop-source' }],
    yeast: { name: 'Levure de fixture' }, steps: [], notes: [],
  };
}

function context(overrides: Partial<BrewerContext> = {}): BrewerContext {
  const lots: HopLot[] = [{ id: 'lot-candidate', varietyId: 'hop-candidate', name: 'Lot de fixture', form: 'pelletT90',
    stockItemRef: 'stock-fixture-candidate', analysis: [] }];
  return {
    recipe: recipe(),
    hopIndex: { varieties: [variety('hop-source', 'Source'), variety('hop-candidate', 'Candidate')], lots,
      knowledge: [], predictions: [], tastings: [], truncated: [] },
    inventory: [], material: [], waterSources: [], phase: 'recipe', now: Date.UTC(2026, 9, 2), provenance: [],
    ...overrides,
  };
}

function scenario(ctx: BrewerContext, branchExtra: Partial<BrewingScenarioBranchRequest> = {}) {
  const prepared = prepareBrewingScenarioContext(ctx);
  const current = prepared.runtime.current;
  const binding = prepared.binding;
  if (!current?.program || !binding) throw Error('Fixture: le programme courant doit être lié.');
  const currentAddition = current.program.additions.at(-1)!;
  const request = buildBrewingScenarioRequest({ scenarioId: 'scenario-fixture', revision: 1, baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
    contextReference: brewingScenarioCurrentReference(current),
  } });
  const assumptions: BrewingScenarioBranchRequest['assumptions'] = [{ id: 'program-change', path: 'program.changes',
    label: 'Remplacement dans le programme', status: 'selected', origin: 'userHypothesis', explanation: 'Changement J1 synthétique.', value: 'remplacement du lot' }];
  const inputOverrides = branchExtra.inputOverrides;
  if (inputOverrides?.yeastId !== undefined) assumptions.push({ id: 'yeast-change', path: 'recipe.yeastId',
    label: 'Souche explorée', status: 'selected', origin: 'userHypothesis', explanation: 'Hypothèse de portée pour le test.', value: inputOverrides.yeastId });
  if (inputOverrides?.volumeL !== undefined) assumptions.push({ id: 'input-volume', path: 'recipe.volumeL',
    label: 'Volume de recette exploré', status: 'selected', origin: 'userHypothesis', explanation: 'Hypothèse de portée pour le test.', value: inputOverrides.volumeL, unit: 'L' });
  if (branchExtra.programOverrides?.volumeL !== undefined) assumptions.push({ id: 'program-volume', path: 'program.volumeL',
    label: 'Volume de programme exploré', status: 'selected', origin: 'userHypothesis', explanation: 'Hypothèse de portée pour le test.', value: branchExtra.programOverrides.volumeL, unit: 'L' });
  request.branches.push({ id: 'candidate-hop', label: 'Remplacer par le lot de fixture', assumptions,
    programChanges: [{ kind: 'replace', additionId: currentAddition.id, additions: [{ ...currentAddition,
      materialId: 'lot:lot-candidate', grams: 18 }] }], ...branchExtra });
  return simulateBrewingScenario(request, prepared.runtime);
}

const alphaChoice = { 'recipe-hop:0': { value: 6, reason: 'Valeur de travail explicitement choisie dans le test.' } };

describe('raccord Recipe V5.5 depuis un résultat de scénario frais', () => {
  it('exige un alpha final, puis rend une copie locale avec les références historiques exactes', () => {
    const ctx = context();
    const result = scenario(ctx);
    const missing = previewHopV55Branch({ result, branchId: 'candidate-hop', context: ctx });
    expect(missing.status).toBe('needsAlphaSelection');
    if (missing.status !== 'needsAlphaSelection') throw Error('Le lot de fixture doit exiger un choix alpha.');
    expect(missing.materialIds).toContain('lot:lot-candidate');

    const previewed = previewHopV55Branch({ result, branchId: 'candidate-hop', context: ctx, alphaChoices: alphaChoice });
    expect(previewed.status).toBe('ready');
    if (previewed.status !== 'ready') throw Error(`Aperçu attendu, reçu ${previewed.status}.`);
    const before = structuredClone(ctx);
    const applied = applyHopV55Copy({ preview: previewed.preview, context: ctx, copyId: 'recipe-copy-1', createdAt: '2026-10-02T12:00:00.000Z' });

    expect(applied.status).toBe('ready');
    if (applied.status !== 'ready') throw Error(applied.reason);
    expect(applied.copy).toMatchObject({ id: 'recipe-copy-1', sourceRecipeId: 'recipe-source',
      scenarioId: result.scenarioId, snapshotReference: result.reference, branchId: 'candidate-hop',
      branchReference: result.branches[0].reference, previewReference: previewed.preview.recipePreview.reference, scope: 'local' });
    expect(applied.copy.recipe).toMatchObject({ id: 'recipe-copy-1', name: 'Recette de fixture', volumeL: 20,
      hops: [{ name: 'Lot de fixture', weightG: 18, alpha: 6, hopLotId: 'lot-candidate', stockItemRef: 'stock-fixture-candidate' }] });
    expect(ctx).toEqual(before);
    expect(applied.copy.recipe).not.toBe(ctx.recipe);
  });

  it('bloque une recette source modifiée après aperçu avant d’utiliser le nouvel ID fourni', () => {
    const ctx = context();
    const result = scenario(ctx);
    const previewed = previewHopV55Branch({ result, branchId: 'candidate-hop', context: ctx, alphaChoices: alphaChoice });
    if (previewed.status !== 'ready') throw Error('Aperçu attendu.');
    const sourceBefore = structuredClone(ctx.recipe);
    ctx.recipe.hops[0].weightG = 24;

    const applied = applyHopV55Copy({ preview: previewed.preview, context: ctx, copyId: 'must-not-be-used', createdAt: '2026-10-02T12:00:00.000Z' });
    expect(applied.status).toBe('blocked');
    if (applied.status !== 'blocked') throw Error('La source modifiée doit bloquer la copie.');
    expect(applied.recompute).toBe(true);
    expect(applied.reason).toMatch(/source a changé/i);
    expect(ctx.recipe).not.toEqual(sourceBefore);
    expect(ctx.recipe.id).toBe('recipe-source');
  });

  it.each([
    ['levure hors programme', { inputOverrides: { yeastId: 'yeast-extra', volumeL: 20 } }],
    ['volume et levure hors programme', { programOverrides: { volumeL: 22 }, inputOverrides: { yeastId: 'yeast-extra', volumeL: 22 } }],
  ])('refuse la portée complète non traduite vers Recipe (%s)', (_label, extra) => {
    const ctx = context();
    const result = scenario(ctx, extra);
    expect(result.branches[0].applicability).toBe('hypotheticalOnly');
    const previewed = previewHopV55Branch({ result, branchId: 'candidate-hop', context: ctx, alphaChoices: alphaChoice });
    expect(previewed.status).toBe('blocked');
    if (previewed.status !== 'blocked') throw Error('Un override hors portée doit rester en exploration.');
    expect(previewed.recompute).toBe(false);
  });

  it('ne laisse pas l’ancienne étiquette available autoriser un résultat devenu périmé', () => {
    const ctx = context();
    const result = scenario(ctx);
    const previewed = previewHopV55Branch({ result, branchId: 'candidate-hop', context: ctx, alphaChoices: alphaChoice });
    if (previewed.status !== 'ready') throw Error('Aperçu attendu.');
    ctx.hopIndex!.varieties[1].name = 'Catalogue modifié après aperçu';

    const applied = applyHopV55Copy({ preview: previewed.preview, context: ctx, copyId: 'stale-copy', createdAt: '2026-10-02T12:00:00.000Z' });
    expect(applied.status).toBe('blocked');
    if (applied.status !== 'blocked') throw Error('Le catalogue modifié doit périmer le snapshot.');
    expect(applied.recompute).toBe(true);
    expect(applied.reason).toMatch(/snapshot archivé diffère/i);
  });

  it('bloque si une addition devient un fait réalisé après l’aperçu', () => {
    const ctx = context();
    const result = scenario(ctx);
    const previewed = previewHopV55Branch({ result, branchId: 'candidate-hop', context: ctx, alphaChoices: alphaChoice });
    if (previewed.status !== 'ready') throw Error('Aperçu attendu.');
    ctx.batch = { id: 'batch-started-after-preview', status: 'fermentation' };
    ctx.journal = { startedAt: Date.UTC(2026, 9, 2), additions: {
      'hop-0': { doneAt: Date.UTC(2026, 9, 2), amount: 20, unit: 'g' },
    } };
    const afterEvent = structuredClone(ctx);

    const applied = applyHopV55Copy({ preview: previewed.preview, context: ctx, copyId: 'performed-copy', createdAt: '2026-10-02T12:00:00.000Z' });
    expect(applied.status).toBe('blocked');
    if (applied.status !== 'blocked') throw Error('Un fait réalisé après aperçu doit bloquer l’application.');
    expect(applied.recompute).toBe(true);
    expect(applied.reason).toMatch(/contexte a changé/i);
    expect(ctx).toEqual(afterEvent);
  });

  it('garde le programme réalisé d’un brassin lancé hors du raccord Recipe', () => {
    const ctx = context({ batch: { id: 'batch-fixture', status: 'fermentation' },
      journal: { startedAt: Date.UTC(2026, 9, 2), additions: { 'hop-0': { doneAt: Date.UTC(2026, 9, 2), amount: 20, unit: 'g' } } } });
    ctx.recipe = { ...recipe(), hops: [
      { name: 'Réalisé', stage: 'boil', timeMin: 30, weightG: 20, alpha: 8, hopVarietyId: 'hop-source' },
      { name: 'À venir', stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 48, weightG: 15, alpha: 8, hopVarietyId: 'hop-source' },
    ] };
    const result = scenario(ctx, { programChanges: [{ kind: 'append', addition: { id: 'future-addition',
      materialId: 'lot:lot-candidate', grams: 18, use: 'postFermentation', status: 'planned', dayOffset: 4 } }] });
    const before = structuredClone(ctx);
    const previewed = previewHopV55Branch({ result, branchId: 'candidate-hop', context: ctx, alphaChoices: alphaChoice });
    expect(previewed.status).toBe('blocked');
    if (previewed.status !== 'blocked') throw Error('Un brassin en fermentation ne produit pas une copie Recipe applicable.');
    expect(previewed.reason).toMatch(/brassin est déjà commencé/i);
    expect(previewed.reason).toMatch(/parcours dédiés/i);
    expect(ctx).toEqual(before);
  });
});
