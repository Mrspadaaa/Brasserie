import { analyzeHopProgram } from './programAnalysis';
import { hopDecisionReference, numericBounds, unknownResult } from './measurements';
import { applySelectedHopReplacement, type HopPlannerRequest, type HopPlannerSelection } from './planner';
import { programFingerprint } from './programs';
import { applyHopRecipeDraftPreview, previewHopRecipeDraft, type HopRecipeAlphaChoice, type HopRecipeFinalPreview } from './recipePreview';
import type { HopRecipeBinding, HopRecipeFutureProcurementChoice, HopRecipeLike } from './recipeAdapter';
import type { HopNumericResult } from './types';

export interface HopPlannerConventionCheck {
  additionId: string;
  basis: 'tinsethIbu';
  status: 'nominalEquality' | 'conditionalOverlap' | 'notConserved' | 'unknown';
  before: HopNumericResult;
  after: HopNumericResult;
  reason: string;
}

export interface HopPlannedRecipePreview<T extends HopRecipeLike> {
  format: 'hop-planned-recipe-v1';
  status: 'ready' | 'conventionMismatch' | 'conventionUnresolved';
  requestReference: string;
  selection: HopPlannerSelection;
  recipePreview: HopRecipeFinalPreview<T>;
  conventions: HopPlannerConventionCheck[];
  reference: string;
}

function compareConvention(additionId: string, before: HopNumericResult, after: HopNumericResult): HopPlannerConventionCheck {
  const a = numericBounds(before), b = numericBounds(after);
  const common = { additionId, basis: 'tinsethIbu' as const, before, after };
  if (!a || !b) return { ...common, status: 'unknown', reason: 'La convention ne peut pas être vérifiée sur les paramètres finaux.' };
  // Floating-point equality only; this is not a sensory or analytical tolerance.
  const tolerance = 64 * Number.EPSILON * Math.max(Math.abs(a.min), Math.abs(a.max), Math.abs(b.min), Math.abs(b.max));
  if (before.status === 'nominal' && after.status === 'nominal') {
    return Math.abs(a.min - b.min) <= tolerance
      ? { ...common, status: 'nominalEquality', reason: 'Les deux contributions nominales du même modèle sont égales sous les paramètres retenus.' }
      : { ...common, status: 'notConserved', reason: 'Le choix alpha final et cette dose ne conservent pas la contribution nominale demandée ; revoir la dose ou la convention.' };
  }
  return a.min > b.max + tolerance || b.min > a.max + tolerance
    ? { ...common, status: 'notConserved', reason: 'Les bornes finales ne permettent pas l’égalité de contribution dans ce modèle.' }
    : { ...common, status: 'conditionalOverlap', reason: 'Les bornes se recouvrent ; cela permet une égalité conditionnelle, pas une conservation garantie pour toutes les teneurs.' };
}

/** Connect the selected decision to its scalar recipe preview without losing the original intent/constraints. */
export function previewHopPlannedRecipe<T extends HopRecipeLike>(input: {
  request: HopPlannerRequest; selection: HopPlannerSelection; recipe: T; binding: HopRecipeBinding;
  alphaChoices?: Record<string, HopRecipeAlphaChoice>;
  futureProcurement?: HopRecipeFutureProcurementChoice;
}) {
  if (programFingerprint(input.request.program) !== programFingerprint(input.binding.program)) throw Error('La décision et la recette ne portent pas sur le même programme.');
  applySelectedHopReplacement(input.request, input.selection); // Local validation, no persistence or stock operation.
  const preview = previewHopRecipeDraft(input.recipe, input.binding, input.selection.proposal, input.request.materials, input.alphaChoices,
    input.futureProcurement ? { futureProcurement: input.futureProcurement } : {});
  if (preview.status !== 'ready') return { ...preview, requestReference: input.selection.requestReference, selection: structuredClone(input.selection) };
  const baseline = analyzeHopProgram(input.request.program, input.request.materials);
  const conventions = input.selection.selectedDoses.filter(dose => dose.basis === 'tinsethIbu').map(dose => compareConvention(dose.additionId,
    baseline.additions.find(row => row.id === dose.additionId)?.boilIbu ?? unknownResult('IBU estimés', 'Ajout source absent.'),
    preview.analysis.additions.find(row => row.id === dose.additionId)?.boilIbu ?? unknownResult('IBU estimés', 'Ajout final absent.')));
  const payload: Omit<HopPlannedRecipePreview<T>, 'reference'> = { format: 'hop-planned-recipe-v1',
    status: conventions.some(item => item.status === 'notConserved') ? 'conventionMismatch'
      : conventions.some(item => item.status === 'unknown') ? 'conventionUnresolved' : 'ready',
    requestReference: input.selection.requestReference, selection: structuredClone(input.selection), recipePreview: preview, conventions };
  return { ...payload, reference: hopDecisionReference(payload) };
}

/** Revalidate current request, selected path, final scalar inputs and displayed convention before returning a local recipe draft. */
export function applyHopPlannedRecipe<T extends HopRecipeLike>(input: {
  request: HopPlannerRequest; recipe: T; binding: HopRecipeBinding; preview: HopPlannedRecipePreview<T>;
}) {
  if (input.preview.format !== 'hop-planned-recipe-v1' || input.preview.status !== 'ready') throw Error('Le brouillon ne respecte pas encore la convention finale retenue.');
  const fresh = previewHopPlannedRecipe({ request: input.request, recipe: input.recipe, binding: input.binding,
    selection: input.preview.selection, alphaChoices: input.preview.recipePreview.alphaChoices,
    ...(input.preview.recipePreview.futureProcurement ? { futureProcurement: input.preview.recipePreview.futureProcurement } : {}) });
  if (fresh.status !== 'ready' || hopDecisionReference(fresh) !== hopDecisionReference(input.preview)) throw Error('La décision ou son aperçu final a changé ; reconstruire le brouillon.');
  const applied = applyHopRecipeDraftPreview(input.recipe, input.binding, fresh.recipePreview, input.request.materials);
  return { ...applied, decision: { requestReference: fresh.requestReference, pathId: fresh.selection.pathId,
    selectedDoses: structuredClone(fresh.selection.selectedDoses), conventions: structuredClone(fresh.conventions), previewReference: fresh.reference } };
}
