import { describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopAxis, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { BrewingStyleGuide, BrewingStyleRef } from '../../functions/src/brewingStyleSchema';
import type { HopExtrapolation, HopExperimentalParameter } from '../../functions/src/hopExtrapolationSchema';
import type { FermentationStep, Recipe } from '../../src/types';
import {
  brewingScenarioCurrentReference,
  buildBrewingScenarioRequest,
  simulateBrewingScenario,
  type BrewingScenarioBranchRequest,
  type BrewingScenarioBeerContext,
} from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import { prepareHopV55FullRecipeCopyRecompute, readHopV55FullRecipeCopyRecomputePayload } from '../../src/services/hopV55/candidateScenario';
import {
  applyHopV55FullRecipeCopy,
  HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT,
  previewHopV55FullRecipeCopy,
  readHopV55FullRecipeCopyReceipt,
  type HopV55FullRecipeCopyPlan,
  type HopV55FullRecipeCopyPreview,
} from '../../src/services/hopV55/fullRecipeCopy';

const source: HopSource = { kind: 'observation', title: 'Fixture locale', author: 'Test', year: 2026, reference: 'fixture:hop-v55-full-copy' };
const futureProcurement = { id: 'future-procurement-recipe-copy-1', reason: 'Prévoir l’achat des matières avant le prochain brassin.' };
const styleSourceRef: BrewingStyleRef = { guideId: 'style-guide-fixture', version: 'v1', styleId: 'pale' };
const targetStyleRef: BrewingStyleRef = { guideId: 'style-guide-fixture', version: 'v1', styleId: 'blonde' };

function yeast(id: string, name: string, form: HopYeast['form'] = 'sèche'): HopYeast {
  return { id, kind: 'yeast', name, betaLyase: 'unknown', source, form };
}

function styleGuide(): BrewingStyleGuide {
  const style = (id: string, code: string, name: string) => ({ id, code, name, aliases: [], family: 'Ale', stats: {}, source });
  return { id: styleSourceRef.guideId, kind: 'styleGuide', name: 'Guide fixture', version: 'v1', enabled: true,
    edition: 'Fixture', retrievedAt: '2026-09-01', attribution: 'Fixture locale', source,
    styles: [style('pale', 'PALE', 'Pale Ale'), style('blonde', 'BLONDE', 'Blonde Ale')] };
}

function variety(id: string, name: string): HopVariety {
  return { id, name, aliases: [], form: 'pelletT90', descriptions: [], analysis: [] };
}

function modelParameter(value: number, min = value, max = value): HopExperimentalParameter {
  return { range: { min, max }, central: value, source };
}

function fixtureExtrapolation(): HopExtrapolation {
  const timings = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'] as const;
  const p = modelParameter;
  return { id: 'model-fixture', kind: 'extrapolation', name: 'Modèle fixture', version: '1', enabled: true,
    source, evidence: [source], limitations: ['Fixture de test uniquement.'],
    axes: [{ id: 'axis-aroma', version: '1', terms: ['agrumes'], doseScale: p(1, 0.1, 2), source }],
    descriptor: { mentioned: p(0.8, 0, 1), unmentioned: p(0.5, 0, 1), unknown: p(0.5, 0, 1) },
    gain: p(1, 0.1, 2), residual: p(0, -0.2, 0.2), matrix: p(1, 0.1, 2),
    sourceUncertainty: { coa: p(0, 0, 1), manufacturer: p(0.1, 0, 1), research: p(0.2, 0, 1),
      review: p(0.1, 0, 1), observation: p(0.2, 0, 1), community: p(0.3, 0, 1), judgment: p(0.5, 0, 1) },
    undatedUncertainty: p(0.4, 0, 1), unknownFormUncertainty: p(0.5, 0, 1),
    timings: Object.fromEntries(timings.map(timing => [timing, { expression: p(0.5, 0, 1), halfSaturationGL: p(1, 0.1, 5),
      extractionHours: p(2, 0.1, 12), decayHours: null, temperatureC: p(20, 0, 40), outsideTemperatureUncertainty: p(0.3, 0, 1) }])) as HopExtrapolation['timings'],
    defaultYeast: { aroma: p(0.5, 0, 1), expression: p(0.5, 0, 1) }, yeasts: [],
  };
}

function fixtureAxis(): HopAxis {
  return { id: 'axis-aroma', kind: 'axis', name: 'Axe agrumes', version: '1', description: 'Axe de fixture.',
    scale: { min: 0, max: 1 }, lowMax: 0.3, mediumMax: 0.7, weight: { range: { min: 1, max: 1 }, source }, source };
}

function recipe(): Recipe {
  return {
    id: 'recipe-source', name: 'Recette source', style: 'Pale Ale', styleRef: styleSourceRef, volumeL: 20,
    ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5.2, ibuTarget: 24, boilMin: 60, fermentables: [], totalGristKg: 0,
    hops: [{ name: 'Source', stage: 'boil', timeMin: 30, weightG: 20, alpha: 8, hopVarietyId: 'hop-source' }],
    yeast: { name: 'Souche source', hopIndexId: 'yeast-source', qty: 1, unit: 'sachet', form: 'sèche',
      pitchTempC: 19, stockItemRef: 'old-stock', fermTempMinC: 15, fermTempMaxC: 20,
      fermentationFacts: { source: 'old-source' } as unknown as Recipe['yeast']['fermentationFacts'],
      technicalFacts: [{ source: 'old-technical-fact' }] as unknown as Recipe['yeast']['technicalFacts'] },
    yeastGuide: { source: 'old-guide' } as unknown as Recipe['yeastGuide'],
    yeastDesign: { source: 'old-design' } as unknown as Recipe['yeastDesign'],
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 7 }],
    steps: [], notes: [],
  };
}

function context(overrides: Partial<BrewerContext> = {}): BrewerContext {
  return {
    recipe: recipe(),
    hopIndex: { varieties: [variety('hop-source', 'Houblon source'), variety('hop-target', 'Houblon cible')], lots: [],
      knowledge: [yeast('yeast-source', 'Souche source'), yeast('yeast-target', 'Souche cible'), styleGuide()],
      predictions: [], tastings: [], truncated: [] },
    inventory: [], material: [], waterSources: [], phase: 'recipe', now: Date.UTC(2026, 9, 2), provenance: [],
    ...overrides,
  };
}

function assumption(id: string, path: string, value?: number | string, unit?: string) {
  return { id, path, label: path, status: 'selected' as const, origin: 'userHypothesis' as const,
    explanation: `Choix explicite pour ${path}.`, ...(value !== undefined ? { value } : {}), ...(unit ? { unit } : {}) };
}

function scenario(ctx: BrewerContext, branch: BrewingScenarioBranchRequest, target?: Record<string, { min: number; max: number }>) {
  const prepared = prepareBrewingScenarioContext(ctx);
  const current = prepared.runtime.current;
  if (!current) throw Error('Fixture: current Recipe missing.');
  const request = buildBrewingScenarioRequest({ scenarioId: 'scenario-full-copy', revision: 1, ...(target ? { target } : {}), baseline: {
    kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
    ...(current.program ? { program: current.program } : {}),
    contextReference: brewingScenarioCurrentReference(current),
  } });
  request.branches.push(structuredClone(branch));
  return simulateBrewingScenario(request, prepared.runtime);
}

function predictFinalRecipeCandidate(ctx: BrewerContext, preview: HopV55FullRecipeCopyPreview) {
  const candidateContext: BrewerContext = { ...structuredClone(ctx), recipe: structuredClone(preview.candidate) };
  const prepared = prepareBrewingScenarioContext(candidateContext);
  const current = prepared.runtime.current;
  if (!current) throw Error('Fixture: candidate Recipe input missing.');
  const request = buildBrewingScenarioRequest({
    scenarioId: preview.candidateRequestSnapshot.scenarioId,
    revision: preview.candidateRequestSnapshot.revision,
    target: preview.candidateRequestSnapshot.target,
    assumptions: preview.candidateRequestSnapshot.assumptions,
    baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
      ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current) },
  });
  request.branches.push(...structuredClone(preview.candidateRequestSnapshot.branches));
  return simulateBrewingScenario(request, prepared.runtime);
}

function branchBeerContext(volumeL: number): BrewingScenarioBeerContext {
  return { style: { ...targetStyleRef, role: 'target' }, facts: [
    { id: 'style-intention', field: 'style.name', status: 'target', origin: 'userHypothesis', value: 'Blonde Ale' },
    { id: 'target-volumeL', field: 'volumeL', status: 'target', origin: 'userHypothesis', value: volumeL, unit: 'L' },
    { id: 'target-og', field: 'ogTarget', status: 'target', origin: 'userHypothesis', value: 1.056, unit: 'SG' },
    { id: 'target-fg', field: 'fgTarget', status: 'target', origin: 'userHypothesis', value: 1.012, unit: 'SG' },
    { id: 'target-abv', field: 'abvTarget', status: 'target', origin: 'userHypothesis', value: 5.4, unit: '% vol.' },
    { id: 'target-ibu', field: 'ibuTarget', status: 'target', origin: 'userHypothesis', value: 26, unit: 'IBU' },
  ] };
}

function fullBranch(ctx: BrewerContext, extras: Partial<BrewingScenarioBranchRequest> = {}): BrewingScenarioBranchRequest {
  const prepared = prepareBrewingScenarioContext(ctx);
  const addition = prepared.binding?.program.additions[0];
  if (!addition) throw Error('Fixture: J1 addition missing.');
  const phases = [{ kind: 'primaire' as const, name: 'Primaire cible', tempC: 18, days: 8 }];
  return {
    id: 'full-copy', label: 'Copie complète choisie',
    assumptions: [
      assumption('ass-volume', 'recipe.volumeL', 250, 'L'),
      assumption('ass-yeast', 'recipe.yeastId', 'yeast-target'),
      assumption('ass-pitch', 'recipe.pitchTempC', 18, '°C'),
      assumption('ass-fermentation', 'recipe.fermentation', 'Phases explicitement sélectionnées'),
      assumption('ass-program-volume', 'program.volumeL', 250, 'L'),
      assumption('ass-hop', 'program.changes', 'Remplacement explicitement choisi'),
    ],
    inputOverrides: { volumeL: 250, yeastId: 'yeast-target', pitchTempC: 18, fermentation: phases },
    programOverrides: { volumeL: 250 },
    programChanges: [{ kind: 'replace', additionId: addition.id, additions: [{ ...addition, materialId: 'variety:hop-target', grams: 18 }] }],
    culture: { state: 'single', members: [{ yeastId: 'yeast-target' }], explanation: 'Une souche cible explicitement choisie.' },
    beerContext: branchBeerContext(250),
    ...extras,
  };
}

function fullPlan(): HopV55FullRecipeCopyPlan {
  return {
    format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT,
    branchId: 'full-copy',
    yeast: { hopIndexId: 'yeast-target', name: 'Levure cible', product: { id: 'product-target', name: 'Levure cible', manufacturer: 'Levurière' },
      strain: 'LT-1', form: 'sèche', quantity: { value: 2, unit: 'sachet' }, pitchTemperatureC: 18 },
    fermentation: [{ kind: 'primaire', name: 'Primaire cible', tempC: 18, days: 8 }],
    style: { name: 'Blonde Ale', ref: targetStyleRef },
    volumeL: 250,
    finalHopMasses: [{ additionId: 'recipe-hop:0', grams: 18 }],
    adoptHopProgram: true,
    targets: { ogTarget: 1.056, fgTarget: 1.012, abvTarget: 5.4, ibuTarget: 26 },
  };
}

describe('copie complète locale V5.5', () => {
  it('prépare une Recipe complète depuis les choix explicites sans modifier la source ni l’applicabilité historique J5', () => {
    const ctx = context();
    const branch = fullBranch(ctx);
    const result = scenario(ctx, branch);
    const historicalApplicability = result.branches[0].applicability;
    expect(historicalApplicability).toBe('hypotheticalOnly');
    const before = structuredClone(ctx);
    const plan = { ...fullPlan(), futureProcurement };
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: 'full-copy', context: ctx, plan,
      alphaChoices: { 'recipe-hop:0': { value: 6, reason: 'Choix alpha de travail explicite.' } } });

    if (previewed.status !== 'ready') throw Error(previewed.status === 'blocked' ? previewed.reason : 'Aperçu complet attendu.');
    expect(previewed.status).toBe('ready');
    expect(previewed.preview).toMatchObject({ format: 'hop-v55-full-recipe-copy-v2', preservedScope: 'hypothesisNotPerformed',
      receipt: { format: 'hop-v55-full-recipe-copy-v2', scope: 'localDraft', scenarioApplicability: historicalApplicability,
        readiness: { localCopy: 'ready', saveConfirmed: false } } });
    expect(previewed.preview.receipt.readiness.brew).toBe('incomplete');
    expect(previewed.preview.candidate).toMatchObject({ style: 'Blonde Ale', styleRef: targetStyleRef, volumeL: 250,
      ogTarget: 1.056, fgTarget: 1.012, abvTarget: 5.4, ibuTarget: 26,
      hops: [{ name: 'Houblon cible', weightG: 18, alpha: 6, hopVarietyId: 'hop-target' }],
      yeast: { name: 'Levure cible', hopIndexId: 'yeast-target', lab: 'Levurière', strain: 'LT-1', form: 'sèche', qty: 2,
        unit: 'sachet', pitchTempC: 18 },
      fermentation: [{ kind: 'primaire', name: 'Primaire cible', tempC: 18, days: 8 }] });
    expect(previewed.preview.candidate.yeast).not.toHaveProperty('stockItemRef');
    expect(previewed.preview.candidate.yeast).not.toHaveProperty('technicalFacts');
    expect(previewed.preview.candidate).not.toHaveProperty('yeastGuide');
    expect(previewed.preview.candidate).not.toHaveProperty('yeastDesign');
    expect(previewed.preview.candidate.preBoilL).toBeUndefined();
    expect(previewed.preview.candidate.waterPlan).toBeUndefined();
    expect(previewed.preview.candidate.hops[0].weightG).not.toBe(20 * (250 / 20));
    expect(previewed.preview.candidate.hops[0].alpha).toBe(6);
    const finalRecipePrediction = predictFinalRecipeCandidate(ctx, previewed.preview);
    expect(finalRecipePrediction.baseline.program?.additions[0].grams).toBe(previewed.preview.candidate.hops[0].weightG);
    expect(previewed.preview.candidateSnapshotReference).toBe(finalRecipePrediction.reference);
    expect(previewed.preview.candidateBranchReference).toBe(finalRecipePrediction.branches[0].reference);
    expect(previewed.preview.futureProcurement).toEqual(futureProcurement);
    expect(previewed.preview.receipt.futureProcurement).toEqual(futureProcurement);
    expect(previewed.preview.hopPreview?.futureProcurement).toEqual(futureProcurement);
    expect(previewed.preview.receipt.procurementAnnex?.applicability).toBe('conditional');
    expect(previewed.preview.conditions?.[0]).toMatch(/aucun achat, aucune réservation ni écriture de stock/i);

    const applied = applyHopV55FullRecipeCopy({ preview: previewed.preview, context: ctx, copyId: 'recipe-copy-stable',
      createdAt: '2026-10-02T12:00:00.000Z' });
    expect(applied.status).toBe('ready');
    if (applied.status !== 'ready') throw Error(applied.status === 'blocked' ? applied.reason : 'Copie locale attendue.');
    expect(applied.copy.recipe.id).toBe('recipe-copy-stable');
    expect(applied.copy.recipe.parentRecipeId).toBe('recipe-source');
    expect(applied.copy.sourceRecipeId).toBe('recipe-source');
    expect(applied.receipt).toMatchObject({ copyId: 'recipe-copy-stable', createdAt: '2026-10-02T12:00:00.000Z',
      plan, preservedBranch: branch, futureProcurement });
    expect(readHopV55FullRecipeCopyReceipt(applied.receipt)).toMatchObject({ status: 'available',
      receipt: { copyId: 'recipe-copy-stable', format: 'hop-v55-full-recipe-copy-v2',
        finalRecipe: { id: 'recipe-copy-stable', parentRecipeId: 'recipe-source' } } });
    expect(ctx).toEqual(before);
    expect(result.branches[0].applicability).toBe(historicalApplicability);
    const repeated = applyHopV55FullRecipeCopy({ preview: previewed.preview, context: ctx, copyId: 'recipe-copy-stable',
      createdAt: '2026-10-02T12:00:00.000Z' });
    expect(repeated).toEqual(applied);
  });

  it('refuse au lecteur un reçu scellé dont le plan de volume a été altéré', () => {
    const ctx = context();
    const branch = fullBranch(ctx);
    const result = scenario(ctx, branch);
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan: fullPlan(),
      alphaChoices: { 'recipe-hop:0': { value: 6, reason: 'Choix alpha explicite.' } } });
    if (previewed.status !== 'ready') throw Error(JSON.stringify(previewed));
    const applied = applyHopV55FullRecipeCopy({ preview: previewed.preview, context: ctx, copyId: 'recipe-copy-tamper',
      createdAt: '2026-10-02T12:00:00.000Z' });
    if (applied.status !== 'ready') throw Error(JSON.stringify(applied));
    const tampered = structuredClone(applied.receipt);
    tampered.plan.volumeL = 999;
    expect(readHopV55FullRecipeCopyReceipt(tampered)).toMatchObject({ status: 'invalid' });
  });

  it('conserve un reçu v1 historique comme lecture seule explicitement non scellée', () => {
    const ctx = context();
    const branch = fullBranch(ctx);
    const result = scenario(ctx, branch);
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan: fullPlan(),
      alphaChoices: { 'recipe-hop:0': { value: 6, reason: 'Choix alpha explicite.' } } });
    if (previewed.status !== 'ready') throw Error(JSON.stringify(previewed));
    const applied = applyHopV55FullRecipeCopy({ preview: previewed.preview, context: ctx, copyId: 'recipe-copy-legacy',
      createdAt: '2026-10-02T12:00:00.000Z' });
    if (applied.status !== 'ready') throw Error(JSON.stringify(applied));
    const v2 = applied.receipt;
    const legacy = {
      format: 'hop-v55-full-recipe-copy-v1', scope: v2.scope, copyId: v2.copyId, createdAt: v2.createdAt,
      sourceRecipeId: v2.sourceRecipeId, scenarioId: v2.scenarioId, snapshotReference: v2.snapshotReference,
      branchId: v2.branchId, branchReference: v2.branchReference, candidateSnapshotReference: v2.candidateSnapshotReference,
      candidateBranchReference: v2.candidateBranchReference, scenarioApplicability: v2.scenarioApplicability,
      plan: structuredClone(v2.plan), alphaChoices: structuredClone(v2.alphaChoices), preservedBranch: structuredClone(v2.preservedBranch),
      ...(v2.procurementAnnex ? { procurementAnnex: structuredClone(v2.procurementAnnex) } : {}),
      ...(v2.futureProcurement ? { futureProcurement: structuredClone(v2.futureProcurement) } : {}),
      ...(v2.conditions ? { conditions: structuredClone(v2.conditions) } : {}), readiness: structuredClone(v2.readiness),
    };
    expect(readHopV55FullRecipeCopyReceipt(legacy)).toMatchObject({ status: 'legacyReadOnly',
      qualification: 'unsealedHistoricalV1', receipt: legacy });
  });

  it('autorise une copie levure seule lorsque la souche exacte est résolue et les autres champs restent inchangés', () => {
    const ctx = context();
    const branch: BrewingScenarioBranchRequest = {
      id: 'yeast-only', label: 'Souche seule', assumptions: [assumption('ass-yeast', 'recipe.yeastId', 'yeast-target')],
      inputOverrides: { yeastId: 'yeast-target' },
      culture: { state: 'single', members: [{ yeastId: 'yeast-target' }], explanation: 'Souche unique résolue.' },
    };
    const result = scenario(ctx, branch);
    const plan: HopV55FullRecipeCopyPlan = { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: 'yeast-only',
      yeast: { hopIndexId: 'yeast-target', name: 'Levure cible', product: { id: 'product-target', name: 'Levure cible', manufacturer: 'Levurière' },
        strain: 'LT-1', form: 'sèche', quantity: { value: 1.5, unit: 'sachet' }, pitchTemperatureC: 19 } };
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: 'yeast-only', context: ctx, plan });
    if (previewed.status !== 'ready') throw Error(JSON.stringify(previewed));
    expect(previewed.status).toBe('ready');
    expect(previewed.preview.candidate.hops).toEqual(ctx.recipe!.hops);
    expect(previewed.preview.candidate.yeast).toEqual({ name: 'Levure cible', hopIndexId: 'yeast-target', lab: 'Levurière',
      strain: 'LT-1', form: 'sèche', qty: 1.5, unit: 'sachet', pitchTempC: 19 });
  });

  it('retourne le champ à choisir et refuse un identifiant de levure fictif', () => {
    const ctx = context();
    const branch: BrewingScenarioBranchRequest = {
      id: 'yeast-only', label: 'Souche seule', assumptions: [assumption('ass-yeast', 'recipe.yeastId', 'yeast-target')],
      inputOverrides: { yeastId: 'yeast-target' },
      culture: { state: 'single', members: [{ yeastId: 'yeast-target' }], explanation: 'Souche unique résolue.' },
    };
    const result = scenario(ctx, branch);
    const basePlan = { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: 'yeast-only' } as const;
    const missing = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan: basePlan });
    expect(missing.status).toBe('needsSelection');
    if (missing.status === 'needsSelection') expect(missing.fields).toContain('yeast');

    const fictive = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan: { ...basePlan,
      yeast: { hopIndexId: 'yeast-fiction', name: 'Souche inventée', product: { id: 'product-x', name: 'Souche inventée', manufacturer: 'Laboratoire X' },
        strain: 'X', form: 'sèche', quantity: { value: 1, unit: 'sachet' } } } });
    expect(fictive.status).toBe('blocked');
    if (fictive.status === 'blocked') expect(fictive.reason).toMatch(/yeast-fiction.*yeast-target/i);
  });

  it('permet une culture maison identifiée sans produit ni fabricant inventé', () => {
    const ctx = context();
    delete ctx.recipe!.yeast.pitchTempC;
    ctx.hopIndex!.knowledge.push(yeast('yeast-homebrew', 'Culture maison identifiée'));
    const branch: BrewingScenarioBranchRequest = {
      id: 'homebrew', label: 'Culture maison',
      assumptions: [assumption('ass-homebrew', 'recipe.yeastId', 'yeast-homebrew')],
      inputOverrides: { yeastId: 'yeast-homebrew' },
      culture: { state: 'single', members: [{ yeastId: 'yeast-homebrew' }], explanation: 'Identité maison résolue.' },
    };
    const result = scenario(ctx, branch);
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx,
      plan: { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: branch.id,
        yeast: { hopIndexId: 'yeast-homebrew', name: 'Culture maison identifiée', quantity: { value: 1, unit: 'g' } } } });
    expect(previewed.status).toBe('ready');
    if (previewed.status !== 'ready') throw Error(JSON.stringify(previewed));
    expect(previewed.preview.candidate.yeast).toEqual({ name: 'Culture maison identifiée', hopIndexId: 'yeast-homebrew', qty: 1, unit: 'g' });
    expect(previewed.preview.candidate.yeast).not.toHaveProperty('lab');
    expect(previewed.preview.candidate.yeast).not.toHaveProperty('strain');
    expect(previewed.preview.candidate.yeast).not.toHaveProperty('form');
    expect(previewed.preview.candidate.yeast).not.toHaveProperty('stockItemRef');
    expect(previewed.preview.candidate.yeast).not.toHaveProperty('technicalFacts');
    expect(previewed.preview.readiness).toMatchObject({ localCopy: 'ready', save: 'readyToSave', brew: 'incomplete' });
    expect(previewed.preview.readiness.missing.some(issue => issue.field === 'wz-yeast-form')).toBe(true);
  });

  it('reprévoit depuis la recette physique, garde la plage ancienne inconnue et permet de reprendre exactement le brouillon', () => {
    const ctx = context();
    delete ctx.recipe!.yeast.pitchTempC;
    ctx.recipe!.yeast.technicalFacts = [{ key: 'temperature', reported: '15–20 °C', range: { min: 15, max: 20 },
      unit: '°C', qualifier: 'range', origin: 'manufacturer' }];
    ctx.hopIndex!.knowledge.push(yeast('yeast-homebrew', 'Culture maison identifiée'));
    const prepared = prepareBrewingScenarioContext(ctx);
    const current = prepared.runtime.current;
    if (!current?.input.yeastTemperature) throw Error('Fixture: plage source absente.');
    const branch: BrewingScenarioBranchRequest = {
      id: 'homebrew-range', label: 'Culture maison identifiée',
      assumptions: [assumption('ass-homebrew-range', 'recipe.yeastId', 'yeast-homebrew')],
      inputOverrides: { yeastId: 'yeast-homebrew' },
      culture: { state: 'single', members: [{ yeastId: 'yeast-homebrew' }], explanation: 'Culture maison chargée.' },
    };
    const aromaTarget = { 'axe-aroma': { min: 0.2, max: 0.8 } };
    const result = scenario(ctx, branch, aromaTarget);
    const originalReference = result.reference;
    const phases = current.input.fermentation.map(step => ({ kind: step.kind as FermentationStep['kind'],
      name: step.name ?? 'Phase choisie', tempC: step.tempC ?? 18, days: step.days ?? 7,
      ...(step.note !== undefined ? { note: step.note } : {}) }));
    const plan: HopV55FullRecipeCopyPlan = {
      format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: branch.id, recipeName: 'Brouillon maison',
      yeast: { hopIndexId: 'yeast-homebrew', name: 'Culture maison identifiée', quantity: { value: 1, unit: 'g' } },
      fermentation: phases,
      targets: { hopAromaTarget: aromaTarget },
    };
    const firstPreview = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan });
    expect(firstPreview.status).toBe('needsRecompute');
    if (firstPreview.status !== 'needsRecompute') throw Error('La reprise doit exiger une nouvelle prévision de culture.');
    const recomputed = prepareHopV55FullRecipeCopyRecompute({ context: ctx, result, branchId: branch.id,
      candidate: firstPreview.candidate, plan, alphaChoices: {}, identity: { scenarioId: 'scenario-full-copy-revision-2', revision: 2 },
      reasons: firstPreview.reasons });
    expect(recomputed.status).toBe('ready');
    if (recomputed.status !== 'ready') throw Error(recomputed.reason);
    expect(recomputed.payload.format).toBe('hop-v55-full-recipe-copy-recompute-v2');
    expect(recomputed.payload.contentReference).toMatch(/^hop-v55-full-recipe-copy-recompute-v2:sha256:[a-f0-9]{64}$/);
    expect(readHopV55FullRecipeCopyRecomputePayload(recomputed.payload)).toMatchObject({ status: 'available' });
    const changedPlan = structuredClone(recomputed.payload);
    changedPlan.plan.yeast!.quantity.value = 9;
    expect(readHopV55FullRecipeCopyRecomputePayload(changedPlan)).toMatchObject({ status: 'invalid' });
    const changedBranch = structuredClone(recomputed.payload);
    changedBranch.branchReference = 'branch-changed-after-seal';
    expect(readHopV55FullRecipeCopyRecomputePayload(changedBranch)).toMatchObject({ status: 'invalid' });
    const changedOrigin = structuredClone(recomputed.payload);
    changedOrigin.supersedes.snapshotReference = 'historical-snapshot-changed';
    expect(readHopV55FullRecipeCopyRecomputePayload(changedOrigin)).toMatchObject({ status: 'invalid' });

    const recomputedBaseline = recomputed.payload.request.baseline;
    expect(recomputedBaseline.kind).toBe('recipe');
    if (recomputedBaseline.kind !== 'recipe') throw Error('La nouvelle demande doit garder la recette physique comme base.');
    expect(recomputedBaseline.recipeReference).toBe(current.recipeReference);
    expect(recomputedBaseline.recipeReference).not.toBe(
      prepareBrewingScenarioContext({ ...ctx, recipe: firstPreview.candidate }).runtime.current?.recipeReference);
    expect(recomputed.payload.request.target).toEqual(aromaTarget);
    expect(recomputed.payload.request.branches[0].inputOverrides?.yeastTemperature).toBeNull();
    expect(recomputed.payload.request.branches[0].assumptions).toContainEqual(expect.objectContaining({
      path: 'recipe.yeastTemperature', value: null, status: 'selected',
    }));
    expect(recomputed.payload.result.branches[0].applicability).toBe('hypotheticalOnly');
    expect(recomputed.payload.supersedes).toMatchObject({ scenarioId: result.scenarioId, snapshotReference: result.reference,
      branchId: branch.id, branchReference: result.branches[0].reference });
    expect(result.reference).toBe(originalReference);
    expect(result.branches[0].input.yeastTemperature).toEqual(current.input.yeastTemperature);

    const nextPreview = previewHopV55FullRecipeCopy({ result: recomputed.payload.result, branchId: recomputed.payload.branchId,
      context: ctx, plan: recomputed.payload.plan, alphaChoices: recomputed.payload.alphaChoices });
    if (nextPreview.status !== 'ready') throw Error(nextPreview.status === 'blocked' ? nextPreview.reason : 'Le nouvel aperçu doit être prêt.');
    expect(nextPreview.status).toBe('ready');
    expect(nextPreview.preview.candidate).toMatchObject({ name: 'Brouillon maison', fermentation: phases,
      yeast: { name: 'Culture maison identifiée', hopIndexId: 'yeast-homebrew', qty: 1, unit: 'g' } });
    expect(nextPreview.preview.candidate.yeast).not.toHaveProperty('technicalFacts');
    expect(nextPreview.preview.preservedBranch.inputOverrides?.yeastTemperature).toBeNull();
    expect(nextPreview.preview.preservedBranch.inputOverrides?.yeastTemperature).not.toEqual(current.input.yeastTemperature);
    const nextBaseline = nextPreview.preview.requestSnapshot.baseline;
    expect(nextBaseline.kind).toBe('recipe');
    if (nextBaseline.kind !== 'recipe') throw Error('Le nouvel aperçu doit garder la recette physique comme base.');
    expect(nextBaseline.recipeReference).toBe(current.recipeReference);
  });

  it('retire du scénario de reprise le programme J1 refusé et le conserve en annexe de la copie des autres consignes', () => {
    const ctx = context();
    delete ctx.recipe!.yeast.pitchTempC;
    ctx.recipe!.yeast.technicalFacts = [{ key: 'temperature', reported: '15–20 °C', range: { min: 15, max: 20 },
      unit: '°C', qualifier: 'range', origin: 'manufacturer' }];
    ctx.hopIndex!.knowledge.push(yeast('yeast-homebrew', 'Culture maison identifiée'));
    const prepared = prepareBrewingScenarioContext(ctx);
    const addition = prepared.binding?.program.additions[0];
    if (!addition) throw Error('Fixture: programme de recette absent.');
    const branch: BrewingScenarioBranchRequest = {
      id: 'copy-with-declined-hop', label: 'Programme proposé et nouvelle culture',
      assumptions: [assumption('copy-yeast-choice', 'recipe.yeastId', 'yeast-homebrew'),
        assumption('copy-fermentation-choice', 'recipe.fermentation', 'Paliers explicitement choisis'),
        assumption('declined-hop-choice', 'program.changes', 'Remplacement proposé mais non repris')],
      inputOverrides: { yeastId: 'yeast-homebrew' },
      programChanges: [{ kind: 'replace', additionId: addition.id,
        additions: [{ ...addition, materialId: 'variety:hop-zero-copy-annex', grams: 18 }] }],
      materials: { hops: [{ id: 'variety:hop-zero-copy-annex', name: 'Houblon à commander', form: 'pelletT90',
        variety: variety('hop-zero-copy-annex', 'Houblon à commander'), stockItemRef: 'hop-zero-copy-stock', availableGrams: 0 }] },
      culture: { state: 'single', members: [{ yeastId: 'yeast-homebrew' }], explanation: 'Culture explicitement sélectionnée.' },
    };
    const result = scenario(ctx, branch);
    expect(result.branches[0].programProposal?.applicability).toBe('unavailable');
    const current = prepareBrewingScenarioContext(ctx).runtime.current!;
    const phases = current.input.fermentation.map(step => ({ kind: step.kind as FermentationStep['kind'],
      name: step.name ?? 'Phase choisie', tempC: step.tempC ?? 18, days: step.days ?? 7,
      ...(step.note !== undefined ? { note: step.note } : {}) }));
    const plan: HopV55FullRecipeCopyPlan = { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: branch.id,
      recipeName: 'Copie avec culture maison', yeast: { hopIndexId: 'yeast-homebrew', name: 'Culture maison identifiée',
        quantity: { value: 1, unit: 'g' } }, fermentation: phases };
    const first = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan });
    expect(first.status).toBe('needsRecompute');
    if (first.status !== 'needsRecompute') throw Error('La suppression de l’ancienne plage exige une nouvelle prévision.');
    const recompute = prepareHopV55FullRecipeCopyRecompute({ context: ctx, result, branchId: branch.id, candidate: first.candidate,
      plan, alphaChoices: {}, identity: { scenarioId: 'copy-with-declined-hop-r2', revision: 2 }, reasons: first.reasons });
    expect(recompute.status).toBe('ready');
    if (recompute.status !== 'ready') throw Error(recompute.reason);
    expect(recompute.payload.request.branches[0].programChanges).toBeUndefined();
    expect(recompute.payload.result.branches[0].programProposal).toBeUndefined();
    expect(recompute.payload.supersedes.programProposal?.program.additions[0].grams).toBe(18);
    expect(recompute.payload.supersedes.requestBranch.programChanges).toEqual(branch.programChanges);

    const finalPreview = previewHopV55FullRecipeCopy({ result: recompute.payload.result, branchId: recompute.payload.branchId,
      context: ctx, plan: recompute.payload.plan, alphaChoices: recompute.payload.alphaChoices,
      originAnnex: recompute.payload.supersedes });
    expect(finalPreview.status).toBe('ready');
    if (finalPreview.status !== 'ready') throw Error(finalPreview.status === 'blocked' ? finalPreview.reason : 'Aperçu candidat attendu.');
    expect(finalPreview.preview.candidate.hops[0].weightG).toBe(20);
    expect(finalPreview.preview.candidateSnapshotReference).toBe(finalPreview.preview.receipt.candidateSnapshotReference);
    expect(finalPreview.preview.receipt.originAnnex?.scenarioApplicability).toBe(result.branches[0].applicability);
    expect(finalPreview.preview.receipt.scenarioApplicability).toBe(recompute.payload.result.branches[0].applicability);
    expect(finalPreview.preview.receipt.originAnnex?.programProposal?.program.additions[0].grams).toBe(18);
    expect(finalPreview.preview.receipt.procurementAnnex?.applicability).toBe('unavailable');
    expect(finalPreview.preview.preservedBranch.programChanges).toEqual(branch.programChanges);
    const applied = applyHopV55FullRecipeCopy({ preview: finalPreview.preview, context: ctx, copyId: 'copy-declined-hop',
      createdAt: '2026-10-02T13:00:00.000Z' });
    expect(applied.status).toBe('ready');
    if (applied.status !== 'ready') throw Error(applied.status === 'blocked' ? applied.reason : 'Copie de recette attendue.');
    expect(applied.copy.recipe.hops[0].weightG).toBe(20);
    expect(applied.receipt.originAnnex?.programProposal?.program.additions[0].grams).toBe(18);
    expect(ctx.recipe!.hops[0].weightG).toBe(20);
  });

  it('préserve les coefficients divergents en annexe sans changer les consignes copiées', () => {
    const ctx = context();
    ctx.hopIndex!.knowledge.push(fixtureAxis(), fixtureExtrapolation());
    const branchFor = (value: number): BrewingScenarioBranchRequest => ({
      id: 'model-only', label: 'Même conduite',
      assumptions: [assumption('model-assumption', 'model.timings.boil.extractionHours', value)],
      modelOverrides: [{ modelId: 'model-fixture', parameter: { kind: 'timing', timing: 'boil', parameter: 'extractionHours' },
        assumptionId: 'model-assumption' }],
    });
    const lowResult = scenario(ctx, branchFor(2));
    const highResult = scenario(ctx, branchFor(8));
    const plan: HopV55FullRecipeCopyPlan = { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: 'model-only' };
    const low = previewHopV55FullRecipeCopy({ result: lowResult, branchId: 'model-only', context: ctx, plan });
    const high = previewHopV55FullRecipeCopy({ result: highResult, branchId: 'model-only', context: ctx, plan });
    expect(low.status).toBe('ready');
    expect(high.status).toBe('ready');
    if (low.status !== 'ready' || high.status !== 'ready') throw Error('Les aperçus du même plan doivent être prêts.');
    expect(low.preview.candidate).toEqual(high.preview.candidate);
    expect(low.preview.preservedBranch.modelOverrides).toEqual(branchFor(2).modelOverrides);
    expect(high.preview.preservedBranch.modelOverrides).toEqual(branchFor(8).modelOverrides);
    expect(low.preview.reference).not.toBe(high.preview.reference);
    expect(low.preview.preservedScope).toBe('hypothesisNotPerformed');
  });

  it('refuse les changements de volume sans masses finales explicites et ne déduit pas une dose à 250 L', () => {
    const ctx = context();
    const branch = fullBranch(ctx);
    const result = scenario(ctx, branch);
    const missing = previewHopV55FullRecipeCopy({ result, branchId: 'full-copy', context: ctx,
      plan: { ...fullPlan(), finalHopMasses: undefined }, alphaChoices: { 'recipe-hop:0': { value: 6, reason: 'Choix explicite.' } } });
    if (missing.status !== 'needsSelection') throw Error(JSON.stringify(missing));
    expect(missing.status).toBe('needsSelection');
    if (missing.status === 'needsSelection') expect(missing.fields).toContain('finalHopMasses');

    const ready = previewHopV55FullRecipeCopy({ result, branchId: 'full-copy', context: ctx, plan: fullPlan(),
      alphaChoices: { 'recipe-hop:0': { value: 6, reason: 'Choix explicite.' } } });
    expect(ready.status).toBe('ready');
    if (ready.status === 'ready') expect(ready.preview.candidate.hops[0].weightG).toBe(18);
  });

  it('conserve un brouillon futur sans déclarer disponible un programme J1 à stock nul', () => {
    const ctx = context();
    const prepared = prepareBrewingScenarioContext(ctx);
    const addition = prepared.binding?.program.additions[0];
    if (!addition) throw Error('Fixture: J1 addition missing.');
    const branch = fullBranch(ctx, {
      programChanges: [{ kind: 'replace', additionId: addition.id, additions: [{ ...addition, materialId: 'variety:hop-zero', grams: 18 }] }],
      materials: { hops: [{ id: 'variety:hop-zero', name: 'Houblon zéro', form: 'pelletT90', variety: variety('hop-zero', 'Houblon zéro'),
        stockItemRef: 'stock-zero', availableGrams: 0 }] },
    });
    const result = scenario(ctx, branch);
    expect(result.branches[0].applicability).toBe('hypotheticalOnly');
    expect(result.branches[0].programProposal?.applicability).toBe('unavailable');
    expect(result.branches[0].programProposal?.stock.find(row => row.materialId === 'variety:hop-zero'))
      .toMatchObject({ status: 'insufficient', neededGrams: 18, availableGrams: 0 });
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx,
      plan: { ...fullPlan(), adoptHopProgram: undefined, finalHopMasses: [{ additionId: 'recipe-hop:0', grams: 20 }] },
      alphaChoices: {} });
    expect(previewed.status).toBe('ready');
    if (previewed.status !== 'ready') throw Error(JSON.stringify(previewed));
    expect(previewed.preview.candidate).toMatchObject({ volumeL: 250, hops: [{ weightG: 20 }] });
    const finalRecipePrediction = predictFinalRecipeCandidate(ctx, previewed.preview);
    expect(finalRecipePrediction.baseline.program?.additions[0].grams).toBe(20);
    expect(previewed.preview.candidateSnapshotReference).toBe(finalRecipePrediction.reference);
    expect(previewed.preview.candidateBranchReference).toBe(finalRecipePrediction.branches[0].reference);
    expect(previewed.preview.receipt.procurementAnnex).toMatchObject({ applicability: 'unavailable',
      stock: expect.arrayContaining([expect.objectContaining({ status: 'insufficient', neededGrams: 18, availableGrams: 0 })]) });
    expect(result.branches[0].applicability).toBe('hypotheticalOnly');
  });

  it('exige et scelle l’approvisionnement futur pour un changement de volume sans adoption du programme proposé', () => {
    const ctx = context();
    ctx.recipe!.hops[0].weightG = 80;
    ctx.recipe!.hops[0].stockItemRef = 'source-hop-stock';
    ctx.inventory = [{ id: 'source-hop-stock-item', ref: 'source-hop-stock', name: 'Houblon source', category: 'Houblon',
      unit: 'g', currentStock: 0, minStock: 0, reorder: false }];
    const branch: BrewingScenarioBranchRequest = {
      id: 'volume-only-copy', label: 'Volume prévu',
      assumptions: [assumption('volume-input', 'recipe.volumeL', 22, 'L'), assumption('volume-program', 'program.volumeL', 22, 'L')],
      inputOverrides: { volumeL: 22 }, programOverrides: { volumeL: 22 },
    };
    const result = scenario(ctx, branch);
    const plan: HopV55FullRecipeCopyPlan = { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: branch.id,
      volumeL: 22, finalHopMasses: [{ additionId: 'recipe-hop:0', grams: 80 }] };
    const withoutChoice = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan });
    expect(withoutChoice.status).not.toBe('ready');

    const futureChoice = { id: 'future-procurement-volume-22', reason: 'Commander avant de planifier ce volume.' };
    const withChoice = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx,
      plan: { ...plan, futureProcurement: futureChoice } });
    if (withChoice.status !== 'ready') throw Error(JSON.stringify(withChoice));
    expect(withChoice.status).toBe('ready');
    expect(withChoice.preview.candidate.volumeL).toBe(22);
    expect(withChoice.preview.candidate.hops[0].weightG).toBe(80);
    expect(withChoice.preview.candidateProgramAnnex).toMatchObject({ applicability: 'unavailable',
      stock: [expect.objectContaining({ status: 'insufficient', neededGrams: 80, availableGrams: 0 })] });
    expect(withChoice.preview.futureProcurement).toEqual(futureChoice);
    const applied = applyHopV55FullRecipeCopy({ preview: withChoice.preview, context: ctx, copyId: 'copy-volume-future',
      createdAt: '2026-10-02T13:00:00.000Z' });
    expect(applied.status).toBe('ready');
    if (applied.status !== 'ready') throw Error(applied.status === 'blocked' ? applied.reason : 'Copie future attendue.');
    expect(applied.copy.recipe.hops[0].weightG).toBe(80);
    expect(applied.receipt.candidateProgramAnnex?.stock[0]).toMatchObject({ neededGrams: 80, availableGrams: 0 });
    expect(applied.receipt.futureProcurement).toEqual(futureChoice);
    expect(readHopV55FullRecipeCopyReceipt(applied.receipt)).toMatchObject({ status: 'available' });
  });

  it('exige des phases choisies lorsque la branche ne peut porter fidèlement une plage typed de levure', () => {
    const ctx = context();
    ctx.recipe!.yeast.technicalFacts = [{ key: 'temperature', reported: '15–20 °C', range: { min: 15, max: 20 },
      unit: '°C', qualifier: 'range', origin: 'personal', source: 'Fiche de recette fixture' }];
    const range = { range: { min: 12, max: 16 }, source };
    const branch: BrewingScenarioBranchRequest = {
      id: 'temperature-range', label: 'Plage technique',
      assumptions: [assumption('ass-temp-range', 'recipe.yeastTemperature', 'Plage explicitement choisie')],
      inputOverrides: { yeastTemperature: range },
    };
    const result = scenario(ctx, branch);
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx,
      plan: { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: branch.id } });
    expect(previewed.status).toBe('needsSelection');
    if (previewed.status === 'needsSelection') {
      expect(previewed.fields).toEqual(['yeastTemperature', 'fermentation']);
      expect(previewed.reasons[0]).toMatch(/ne se copie pas comme un fait technique/i);
    }
  });

  it('refuse une culture mixte sans la réduire à un membre inventé', () => {
    const ctx = context({ hopIndex: { ...context().hopIndex!, knowledge: [yeast('yeast-source', 'Souche source'),
      yeast('yeast-target', 'Souche cible'), yeast('yeast-other', 'Autre souche'), styleGuide()] } });
    const branch: BrewingScenarioBranchRequest = { id: 'mixed', label: 'Culture mixte', assumptions: [],
      culture: { state: 'mixed', members: [{ yeastId: 'yeast-target' }, { yeastId: 'yeast-other' }], explanation: 'Deux membres explicites.' } };
    const result = scenario(ctx, branch);
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: 'mixed', context: ctx,
      plan: { format: HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT, branchId: 'mixed' } });
    expect(previewed.status).toBe('blocked');
    if (previewed.status === 'blocked') expect(previewed.reason).toMatch(/culture.*mixte/i);
  });

  it.each(['source', 'catalogue', 'plan'] as const)('refuse un %s modifié après l’aperçu', mutation => {
    const ctx = context();
    const branch = fullBranch(ctx);
    const result = scenario(ctx, branch);
    const plan = fullPlan();
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan,
      alphaChoices: { 'recipe-hop:0': { value: 6, reason: 'Choix explicite.' } } });
    if (previewed.status !== 'ready') throw Error(JSON.stringify(previewed));
    expect(previewed.status).toBe('ready');
    if (mutation === 'source') ctx.recipe!.name = 'Recette changée';
    if (mutation === 'catalogue') ctx.hopIndex!.varieties[1].name = 'Catalogue changé';
    if (mutation === 'plan') previewed.preview.plan.yeast!.quantity.value = 5;
    const applied = applyHopV55FullRecipeCopy({ preview: previewed.preview, context: ctx, copyId: 'stale-copy',
      createdAt: '2026-10-02T12:00:00.000Z' });
    expect(applied.status).toBe('blocked');
    if (applied.status === 'blocked') expect(applied.recompute).toBe(true);
  });

  it('ne demande l’ID stable à l’hôte qu’après la revalidation complète', () => {
    const ctx = context();
    const branch = fullBranch(ctx);
    const result = scenario(ctx, branch);
    const previewed = previewHopV55FullRecipeCopy({ result, branchId: branch.id, context: ctx, plan: fullPlan(),
      alphaChoices: { 'recipe-hop:0': { value: 6, reason: 'Choix explicite.' } } });
    if (previewed.status !== 'ready') throw Error('Aperçu attendu.');
    ctx.hopIndex!.varieties[1].name = 'Catalogue changé';
    const createCopyId = vi.fn(() => 'allocated-too-early');
    const applied = applyHopV55FullRecipeCopy({ preview: previewed.preview, context: ctx, createCopyId,
      createdAt: '2026-10-02T12:00:00.000Z' });
    expect(applied.status).toBe('blocked');
    expect(createCopyId).not.toHaveBeenCalled();
  });
});
