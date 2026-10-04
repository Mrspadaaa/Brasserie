import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { Recipe } from '../../types';
import {
  assertBrewingScenarioResult,
  brewingScenarioCurrentReference,
  simulateBrewingScenario,
  type BrewingScenarioBranchRequest,
  type BrewingScenarioBranchResult,
  type BrewingScenarioRequest,
  type BrewingScenarioResult,
} from '../../domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { applyHopRecipeDraftPreview, previewHopRecipeDraft, type HopRecipeAlphaChoice, type HopRecipeFinalPreview } from '../../domain/hopDecision/recipePreview';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type { HopV55Copy } from './contracts';

export interface HopV55ReadyPreview {
  format: 'hop-v55-recipe-copy-preview-v1';
  /** Deterministic content reference for the full preview, not an authorization token. */
  reference: string;
  sourceRecipeId: string;
  sourceRecipeReference: string;
  contextReference: string;
  scenarioId: string;
  snapshotReference: string;
  branchId: string;
  branchReference: string;
  /** The request is retained so application can rerun it against the live context. */
  requestSnapshot: BrewingScenarioRequest;
  recipePreview: HopRecipeFinalPreview<Recipe>;
}

export type HopV55BranchPreviewResult =
  | { status: 'ready'; preview: HopV55ReadyPreview }
  | { status: 'needsAlphaSelection'; scenarioId: string; branchId: string; materialIds: string[]; reasons: string[] }
  | { status: 'blocked'; reason: string; recompute: boolean };

export type HopV55CopyResult =
  | { status: 'ready'; copy: HopV55Copy }
  | { status: 'blocked'; reason: string; recompute: boolean };

interface PreviewFromRequestInput {
  requestSnapshot: BrewingScenarioRequest;
  branchId: string;
  context: BrewerContext;
  alphaChoices: Record<string, HopRecipeAlphaChoice>;
  expectedSnapshotReference?: string;
  expectedBranchReference?: string;
}

const blocked = (reason: string, recompute = false): HopV55BranchPreviewResult => ({ status: 'blocked', reason, recompute });
const copyBlocked = (reason: string, recompute = false): HopV55CopyResult => ({ status: 'blocked', reason, recompute });
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const sameContent = (left: unknown, right: unknown): boolean => hopDecisionReference(left) === hopDecisionReference(right);
const safeHostId = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.length <= 120
  && !/[\\/]/.test(value) && !/^__.*__$/.test(value) && !['.', '..', 'constructor', 'prototype'].includes(value);

function currentSourceRecipe(context: BrewerContext): Recipe | null {
  const candidate = context.recipe;
  if (!isRecord(candidate) || typeof candidate.id !== 'string' || !candidate.id.trim()
    || !Number.isFinite(candidate.volumeL) || !Array.isArray(candidate.hops)) return null;
  return candidate as unknown as Recipe;
}

/**
 * Context preparation assigns a batch identity to its working copy. A Recipe
 * copy may still use the displayed Recipe when that is the only difference.
 */
function bindingForDisplayedRecipe(
  binding: NonNullable<ReturnType<typeof prepareBrewingScenarioContext>['binding']>, recipe: Recipe,
) {
  const recipeReference = hopDecisionReference(recipe);
  if (binding.recipeReference === recipeReference) return binding;
  const preparedIdentityCopy = { ...structuredClone(recipe), id: binding.program.id };
  if (hopDecisionReference(preparedIdentityCopy) !== binding.recipeReference) {
    throw Error('La recette affichée ne correspond pas exactement à la recette qui a produit ce scénario. Repréparer depuis la recette courante.');
  }
  return { ...binding, recipeReference };
}

function requestBranch(request: BrewingScenarioRequest, branchId: string): BrewingScenarioBranchRequest | undefined {
  return request.branches.find(branch => branch.id === branchId);
}

function branchScopeError(
  requestBranchRow: BrewingScenarioBranchRequest,
  branch: BrewingScenarioBranchResult,
  context: ReturnType<typeof prepareBrewingScenarioContext>,
): string | undefined {
  if (branch.applicability !== 'available' && branch.applicability !== 'conditional') {
    return 'La branche complète est hypothétique ou indisponible; elle reste consultable pour exploration.';
  }
  if (!branch.programProposal || (branch.programProposal.applicability !== 'available' && branch.programProposal.applicability !== 'conditional')) {
    return 'Le programme de cette branche ne dispose pas d’un aperçu J1 applicable.';
  }
  if (!requestBranchRow.programChanges?.length || !branch.programProposal.changes.length) {
    return 'La branche ne porte aucun changement de programme à copier dans une recette.';
  }
  if (requestBranchRow.input || requestBranchRow.inputOverrides || requestBranchRow.programOverrides) {
    return 'La branche ajoute des changements d’entrée ou de programme hors du raccord de copie Recipe; conserver l’exploration ou refaire une branche J1 seule.';
  }
  if (requestBranchRow.modelOverrides?.length || requestBranchRow.analogies?.length || requestBranchRow.biologicalInputs?.length) {
    return 'La branche contient des hypothèses de calcul, analogies ou contributions biologiques que le brouillon Recipe ne peut pas enregistrer.';
  }
  const current = context.runtime.current;
  if (requestBranchRow.culture !== undefined && !sameContent(requestBranchRow.culture, current?.culture ?? null)) {
    return 'La branche remplace la culture courante; ce raccord ne copie que le programme houblon dans une recette.';
  }
  if (requestBranchRow.beerContext !== undefined && !sameContent(requestBranchRow.beerContext, current?.beerContext ?? null)) {
    return 'La branche remplace le contexte courant de la bière; ce raccord ne copie que le programme houblon dans une recette.';
  }
  if (requestBranchRow.biologicalContext !== undefined
    && !sameContent(requestBranchRow.biologicalContext, current?.biologicalContext ?? context.runtime.biologicalContext ?? null)) {
    return 'La branche remplace le contexte biologique courant; ce raccord ne copie que le programme houblon dans une recette.';
  }
  const outOfScopeHop = (requestBranchRow.materials?.hops ?? []).some(candidate =>
    !context.runtime.materials.some(currentMaterial => currentMaterial.id === candidate.id && sameContent(currentMaterial, candidate)));
  const outOfScopeYeast = (requestBranchRow.materials?.yeasts ?? []).some(candidate =>
    !context.runtime.engineData.knowledge.some(currentKnowledge => currentKnowledge.kind === 'yeast'
      && currentKnowledge.id === candidate.id && sameContent(currentKnowledge, candidate)));
  if (outOfScopeHop || outOfScopeYeast) {
    return 'La branche apporte des matières hypothétiques hors des références courantes chargées; qualifier/recharger ces références avant copie.';
  }
  const currentProgram = current?.program;
  if (!currentProgram || currentProgram.stage !== 'planning' || branch.program?.stage !== 'planning') {
    return 'Ce résultat concerne un brassin déjà commencé. L’exploration reste disponible, mais le raccord Recipe ne modifie pas un programme en cours; une conduite dédiée sera nécessaire.';
  }
  const afterById = new Map((branch.program?.additions ?? []).map(row => [row.id, row]));
  for (const performed of currentProgram.additions.filter(row => row.status === 'performed')) {
    const after = afterById.get(performed.id);
    if (!after || !sameContent(performed, after)) {
      return `L’ajout déjà réalisé « ${performed.id} » diffère dans la branche; aucune copie n’est permise.`;
    }
  }
  return undefined;
}

function compositeReference(value: Omit<HopV55ReadyPreview, 'reference'>): string {
  return hopDecisionReference(value);
}

function previewCurrentRequest(input: PreviewFromRequestInput): HopV55BranchPreviewResult {
  const recipe = currentSourceRecipe(input.context);
  if (!recipe) return blocked('Aucune recette source complète n’est disponible dans le contexte courant.', true);

  let prepared: ReturnType<typeof prepareBrewingScenarioContext>;
  let currentReference: string;
  try {
    prepared = prepareBrewingScenarioContext(input.context);
    const current = prepared.runtime.current;
    if (!current) return blocked('La préparation courante n’a pas de base recette; reprendre depuis une Recipe affichée.', true);
    currentReference = brewingScenarioCurrentReference(current);
    const baseline = input.requestSnapshot.baseline;
    if (baseline.kind !== 'recipe') return blocked('Le scénario est fondé sur une base hypothétique, pas sur la recette affichée.', true);
    const programReference = current.program ? programFingerprint(current.program) : undefined;
    if (baseline.recipeReference !== current.recipeReference || baseline.inputReference !== current.inputReference
      || baseline.programReference !== programReference || baseline.contextReference !== currentReference) {
      return blocked('La recette, le programme, le journal ou le contexte a changé depuis le scénario; recalculer avant copie.', true);
    }
  } catch (error) {
    return blocked(`Le contexte Recipe courant ne peut pas être préparé: ${(error as Error).message}`, true);
  }

  if (!prepared!.binding) return blocked('Le contexte courant ne permet pas de lier un programme J1 à la recette.', true);
  if (prepared!.binding.program.stage !== 'planning') {
    return blocked('Le brassin est déjà commencé. Le résultat reste disponible pour exploration, mais ce raccord ne crée pas une Recipe qui réécrit sa conduite; une application au batch demandera un type et un parcours dédiés.');
  }

  let fresh: BrewingScenarioResult;
  try {
    fresh = simulateBrewingScenario(input.requestSnapshot, prepared!.runtime);
  } catch (error) {
    return blocked(`Le scénario ne peut pas être recalculé sur le contexte courant: ${(error as Error).message}`, true);
  }
  if (input.expectedSnapshotReference && fresh.reference !== input.expectedSnapshotReference) {
    return blocked('Le snapshot archivé diffère du recalcul courant (moteur, références ou dépendances); créer un nouveau résultat avant copie.', true);
  }
  const requestRow = requestBranch(input.requestSnapshot, input.branchId);
  const branch = fresh.branches.find(row => row.id === input.branchId);
  if (!requestRow || !branch) return blocked('Cette branche est absente du résultat courant; sélectionner une branche recalculée.', true);
  if (input.expectedBranchReference && branch.reference !== input.expectedBranchReference) {
    return blocked('La référence de branche ne correspond plus au résultat recalculé; recalculer avant copie.', true);
  }

  const scopeError = branchScopeError(requestRow, branch, prepared!);
  if (scopeError) return blocked(scopeError);
  let draftBinding;
  try {
    draftBinding = bindingForDisplayedRecipe(prepared!.binding, recipe);
  } catch (error) {
    return blocked((error as Error).message, true);
  }

  let recipePreview;
  try {
    recipePreview = previewHopRecipeDraft(recipe, draftBinding, branch.programProposal!,
      prepared!.runtime.materials, input.alphaChoices);
  } catch (error) {
    return blocked(`L’aperçu J4 refuse cette branche: ${(error as Error).message}`);
  }
  if (recipePreview.status === 'needsAlphaSelection') {
    return { status: 'needsAlphaSelection', scenarioId: fresh.scenarioId, branchId: branch.id,
      materialIds: [...recipePreview.materialIds], reasons: [...recipePreview.reasons] };
  }

  const payload: Omit<HopV55ReadyPreview, 'reference'> = {
    format: 'hop-v55-recipe-copy-preview-v1',
    sourceRecipeId: recipe.id,
    sourceRecipeReference: hopDecisionReference(recipe),
    contextReference: currentReference!,
    scenarioId: fresh.scenarioId,
    snapshotReference: fresh.reference,
    branchId: branch.id,
    branchReference: branch.reference,
    requestSnapshot: structuredClone(input.requestSnapshot),
    recipePreview,
  };
  return { status: 'ready', preview: { ...payload, reference: compositeReference(payload) } };
}

/** Recompute branch applicability on the currently displayed BrewerContext. */
export function previewHopV55Branch(input: {
  result: BrewingScenarioResult;
  branchId: string;
  context: BrewerContext;
  alphaChoices?: Record<string, HopRecipeAlphaChoice>;
}): HopV55BranchPreviewResult {
  try {
    assertBrewingScenarioResult(input.result);
  } catch (error) {
    return blocked(`Le résultat fourni n’est pas un snapshot de scénario valide: ${(error as Error).message}`, true);
  }
  if (input.result.requestSnapshot.baseline.kind !== 'recipe') {
    return blocked('Seul un résultat lié à une Recipe courante peut alimenter une copie Recipe.', true);
  }
  return previewCurrentRequest({ requestSnapshot: input.result.requestSnapshot, branchId: input.branchId,
    context: input.context, alphaChoices: structuredClone(input.alphaChoices ?? {}), expectedSnapshotReference: input.result.reference,
    expectedBranchReference: input.result.branches.find(row => row.id === input.branchId)?.reference });
}

function previewIntegrityError(preview: HopV55ReadyPreview): string | undefined {
  if (preview.format !== 'hop-v55-recipe-copy-preview-v1' || !preview.reference) return 'Format d’aperçu Recipe non reconnu.';
  const { reference, ...payload } = preview;
  if (compositeReference(payload) !== reference) return 'L’aperçu Recipe a changé depuis sa confirmation; le recalculer.';
  if (preview.recipePreview.status !== 'ready' || preview.recipePreview.format !== 'hop-recipe-final-preview-v1') {
    return 'L’aperçu J4 n’est pas un aperçu final prêt à appliquer.';
  }
  return undefined;
}

/** Apply only to a detached Recipe value; storage, stock and batch writes belong to the host. */
export function applyHopV55Copy(input: {
  preview: HopV55ReadyPreview;
  context: BrewerContext;
  copyId: string;
  createdAt: string;
}): HopV55CopyResult {
  const integrityError = previewIntegrityError(input.preview);
  if (integrityError) return copyBlocked(integrityError, true);

  const recipe = currentSourceRecipe(input.context);
  if (!recipe || recipe.id !== input.preview.sourceRecipeId
    || hopDecisionReference(recipe) !== input.preview.sourceRecipeReference) {
    return copyBlocked('La Recipe source a changé depuis l’aperçu. Refaire l’aperçu avant de choisir l’identifiant de copie.', true);
  }

  const revalidated = previewCurrentRequest({ requestSnapshot: input.preview.requestSnapshot, branchId: input.preview.branchId,
    context: input.context, alphaChoices: structuredClone(input.preview.recipePreview.alphaChoices),
    expectedSnapshotReference: input.preview.snapshotReference, expectedBranchReference: input.preview.branchReference });
  if (revalidated.status !== 'ready') {
    if (revalidated.status === 'blocked') return copyBlocked(revalidated.reason, revalidated.recompute);
    return copyBlocked('Le choix alpha du brouillon est devenu incomplet; refaire la sélection avant copie.', true);
  }
  if (revalidated.preview.reference !== input.preview.reference) {
    return copyBlocked('Le brouillon J4 ne correspond plus à son aperçu confirmé; le recalculer.', true);
  }

  let applied;
  try {
    const prepared = prepareBrewingScenarioContext(input.context);
    if (!prepared.binding) return copyBlocked('La liaison J1 courante a disparu; recalculer le scénario.', true);
    const binding = bindingForDisplayedRecipe(prepared.binding, recipe);
    applied = applyHopRecipeDraftPreview(recipe, binding, revalidated.preview.recipePreview,
      revalidated.preview.recipePreview.draft.dossier.materials);
  } catch (error) {
    return copyBlocked(`La validation finale J4 a échoué: ${(error as Error).message}`, true);
  }

  // Do not assign a host ID until J4 has proved that its output is still the source recipe's draft.
  if (applied.recipe.id !== recipe.id || hopDecisionReference(applied.recipe) !== hopDecisionReference(input.preview.recipePreview.draft.recipe)) {
    return copyBlocked('J4 n’a pas rendu le brouillon attendu depuis la Recipe source.', true);
  }
  if (!safeHostId(input.copyId) || input.copyId === recipe.id) return copyBlocked('L’identifiant fourni doit être non vide, sûr et différent de celui de la recette source.');
  if (typeof input.createdAt !== 'string' || !input.createdAt.trim() || !Number.isFinite(Date.parse(input.createdAt))) {
    return copyBlocked('La date de création fournie est invalide.');
  }

  const copiedRecipe: Recipe = { ...structuredClone(applied.recipe), id: input.copyId };
  const copy: HopV55Copy = {
    id: input.copyId,
    recipe: copiedRecipe,
    sourceRecipeId: recipe.id,
    previewReference: applied.previewReference,
    scenarioId: input.preview.scenarioId,
    snapshotReference: input.preview.snapshotReference,
    branchId: input.preview.branchId,
    branchReference: input.preview.branchReference,
    createdAt: input.createdAt,
    scope: 'local',
  };
  return { status: 'ready', copy };
}
