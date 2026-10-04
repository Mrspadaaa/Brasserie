import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { BrewingStyleGuide, BrewingStyleRef } from '../../../functions/src/brewingStyleSchema';
import type { HopRecipeInput } from '../../../functions/src/hopRecipePrediction';
import type { FermentationStep, Recipe, YeastSpec } from '../../types';
import { recipeReadiness } from '../../domain/recipeValidation';
import {
  assertBrewingScenarioResult,
  buildBrewingScenarioRequest,
  brewingScenarioCurrentReference,
  simulateBrewingScenario,
  type BrewingScenarioBranchRequest,
  type BrewingScenarioBranchResult,
  type BrewingScenarioRequest,
  type BrewingScenarioResult,
} from '../../domain/brewingScenario';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { applyHopRecipeDraftPreview, previewHopRecipeDraft, type HopRecipeAlphaChoice, type HopRecipeAlphaChoiceWitness,
  type HopRecipeFinalPreview } from '../../domain/hopDecision/recipePreview';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { applyHopProgramProposal, previewHopProgramChanges, programFingerprint } from '../../domain/hopDecision/programs';
import { hopRecipeFutureProcurementCondition, validateHopRecipeDraftOptions, type HopRecipeFutureProcurementChoice } from '../../domain/hopDecision/recipeAdapter';
import type { HopDecisionProgram, HopProgramChange } from '../../domain/hopDecision/types';
import type { HopV55Copy } from './contracts';

export const HOP_V55_FULL_RECIPE_COPY_FORMAT = 'hop-v55-full-recipe-copy-v2' as const;
export const HOP_V55_FULL_RECIPE_COPY_LEGACY_FORMAT = 'hop-v55-full-recipe-copy-v1' as const;
export const HOP_V55_FULL_RECIPE_COPY_INTEGRITY_FORMAT = 'hop-v55-copy-receipt-seal-v1' as const;
export const HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT = 'hop-v55-full-recipe-copy-plan-v1' as const;

export interface HopV55FullRecipeYeastSelection {
  /** Must resolve to this exact, currently loaded single culture member. */
  hopIndexId: string;
  /** Recipe name is declared here; none is inferred from an identity or product. */
  name: string;
  /** A commercial product is separate from the strain and may be unknown. */
  product?: { id: string; name: string; manufacturer: string };
  strain?: string;
  form?: YeastSpec['form'];
  quantity: { value: number; unit: string };
  /** A recipe process target, not a technical range for the strain. */
  pitchTemperatureC?: number;
}

export interface HopV55FullRecipeTargetSelection {
  ogTarget?: number;
  fgTarget?: number;
  abvTarget?: number;
  ibuTarget?: number;
  /** Exact selected scenario targets; no prediction output is converted to a recipe target. */
  hopAromaTarget?: Record<string, { min: number; max: number }>;
}

export interface HopV55FullRecipeCopyPlan {
  format: typeof HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT;
  branchId: string;
  /** Optional name chosen by the brewer. Omission preserves the source name. */
  recipeName?: string;
  yeast?: HopV55FullRecipeYeastSelection;
  /** Must exactly match the explicit phases selected for the scenario branch. */
  fermentation?: FermentationStep[];
  /** A resolved catalogue target; labels alone do not identify a style. */
  style?: { name: string; ref: BrewingStyleRef };
  /** Explicit final masses in grams, keyed by stable J1 addition identity. */
  finalHopMasses?: Array<{ additionId: string; grams: number }>;
  /** Copy J1's exact proposed hop program through the existing J4 preview/apply path. */
  adoptHopProgram?: true;
  /** Explicit local declaration; does not reserve, purchase, or change any stock fact. */
  futureProcurement?: HopRecipeFutureProcurementChoice;
  /** Must be the exact volume carried by the selected branch input and programme. */
  volumeL?: number;
  /** Explicitly adopt selected beer-context targets only. */
  targets?: HopV55FullRecipeTargetSelection;
}

export interface HopV55FullRecipeCopyReadiness {
  localCopy: 'ready';
  save: 'readyToSave' | 'invalid';
  brew: 'ready' | 'incomplete' | 'invalid';
  invalid: ReturnType<typeof recipeReadiness>['invalid'];
  missing: ReturnType<typeof recipeReadiness>['missing'];
  /** This adapter never persists and never creates a save receipt. */
  saveConfirmed: false;
}

export interface HopV55FullRecipeCopyProcurementAnnex {
  /** Exact J1 assessment; an unavailable state is never changed by the copy flow. */
  applicability: 'available' | 'conditional' | 'unavailable';
  stock: Array<{ materialId: string; materialIds?: string[]; stockItemRef?: string; neededGrams: number | null;
    availableGrams: number | null; status: 'available' | 'unknown' | 'insufficient' | 'referenceOnly' }>;
  conditions: string[];
}

export interface HopV55FullRecipeCopyOriginAnnex {
  scenarioId: string;
  snapshotReference: string;
  branchId: string;
  branchReference: string;
  scenarioApplicability: BrewingScenarioBranchResult['applicability'];
  requestBranch: BrewingScenarioBranchRequest;
  programProposal?: NonNullable<BrewingScenarioBranchResult['programProposal']>;
}

export interface HopV55FullRecipeCopyReceipt {
  format: typeof HOP_V55_FULL_RECIPE_COPY_FORMAT;
  scope: 'localDraft';
  copyId?: string;
  createdAt?: string;
  sourceRecipeId: string;
  scenarioId: string;
  snapshotReference: string;
  branchId: string;
  branchReference: string;
  candidateSnapshotReference: string;
  candidateBranchReference: string;
  candidatePredictionScope: 'finalRecipeAfterJ4';
  /** Kept separately from local copy/save/brew readiness. */
  scenarioApplicability: BrewingScenarioBranchResult['applicability'];
  plan: HopV55FullRecipeCopyPlan;
  alphaChoices: Record<string, HopRecipeAlphaChoice>;
  preservedBranch: BrewingScenarioBranchRequest;
  procurementAnnex?: HopV55FullRecipeCopyProcurementAnnex;
  /** J1 assessment of the program represented by the final copied recipe. */
  candidateProgramAnnex?: HopV55FullRecipeCopyProcurementAnnex;
  /** Original J1 branch retained if recompute re-anchors an effective copy branch. */
  originAnnex?: HopV55FullRecipeCopyOriginAnnex;
  futureProcurement?: HopRecipeFutureProcurementChoice;
  conditions?: string[];
  readiness: HopV55FullRecipeCopyReadiness;
  previewReference?: string;
  finalRecipe?: Recipe;
  finalRecipeReference?: string;
  integritySeal?: { format: typeof HOP_V55_FULL_RECIPE_COPY_INTEGRITY_FORMAT; reference: string };
}

export interface HopV55FullRecipeCopyReceiptV1 extends Omit<HopV55FullRecipeCopyReceipt,
  'format' | 'candidatePredictionScope' | 'candidateProgramAnnex' | 'originAnnex'
  | 'previewReference' | 'finalRecipe' | 'finalRecipeReference' | 'integritySeal'> {
  format: typeof HOP_V55_FULL_RECIPE_COPY_LEGACY_FORMAT;
}

export interface HopV55FullRecipeCopyPreview {
  format: typeof HOP_V55_FULL_RECIPE_COPY_FORMAT;
  reference: string;
  sourceRecipeId: string;
  sourceRecipeReference: string;
  scenarioId: string;
  snapshotReference: string;
  branchId: string;
  branchReference: string;
  candidateSnapshotReference: string;
  candidateBranchReference: string;
  candidatePredictionScope: 'finalRecipeAfterJ4';
  requestSnapshot: BrewingScenarioRequest;
  candidateRequestSnapshot: BrewingScenarioRequest;
  plan: HopV55FullRecipeCopyPlan;
  alphaChoices: Record<string, HopRecipeAlphaChoice>;
  futureProcurement?: HopRecipeFutureProcurementChoice;
  conditions?: string[];
  /** Candidate still uses the source ID; a new host ID is assigned after final validation. */
  candidate: Recipe;
  hopPreview?: HopRecipeFinalPreview<Recipe>;
  readiness: HopV55FullRecipeCopyReadiness;
  receipt: HopV55FullRecipeCopyReceipt;
  /** Exact branch request is preserved as a hypothesis, never replayed as recipe facts. */
  preservedBranch: BrewingScenarioBranchRequest;
  /** J1 assessment of the program represented by the final copied recipe. */
  candidateProgramAnnex?: HopV55FullRecipeCopyProcurementAnnex;
  originAnnex?: HopV55FullRecipeCopyOriginAnnex;
  /** Model outputs, sensory results, and observations are not copied into `candidate`. */
  preservedScope: 'hypothesisNotPerformed';
}

export type HopV55FullRecipeCopyPreviewResult =
  | { status: 'ready'; preview: HopV55FullRecipeCopyPreview }
  | { status: 'needsSelection'; fields: string[]; reasons: string[] }
  | { status: 'needsAlphaSelection'; scenarioId: string; branchId: string; materialIds: string[]; reasons: string[];
    alphaChoiceWitnesses?: HopRecipeAlphaChoiceWitness[]; futureProcurement?: HopRecipeFutureProcurementChoice; conditions?: string[] }
  | { status: 'needsRecompute'; candidate: Recipe; reasons: string[] }
  | { status: 'blocked'; reason: string; recompute: boolean };

export type HopV55FullRecipeCopyApplyResult =
  | { status: 'ready'; copy: HopV55Copy; receipt: HopV55FullRecipeCopyReceipt }
  | { status: 'needsRecompute'; candidate: Recipe; reasons: string[] }
  | { status: 'blocked'; reason: string; recompute: boolean };

export type HopV55FullRecipeCopyApplyInput = {
  preview: HopV55FullRecipeCopyPreview;
  context: BrewerContext;
  createdAt: string;
} & ({ copyId: string; createCopyId?: never } | { copyId?: never; createCopyId: () => string });

export type HopV55FullRecipeCopyReceiptReadResult =
  | { status: 'available'; receipt: HopV55FullRecipeCopyReceipt }
  | { status: 'legacyReadOnly'; qualification: 'unsealedHistoricalV1'; receipt: HopV55FullRecipeCopyReceiptV1; reason: string }
  | { status: 'invalid'; reason: string };

interface PreviewInput {
  requestSnapshot: BrewingScenarioRequest;
  branchId: string;
  context: BrewerContext;
  plan: HopV55FullRecipeCopyPlan;
  alphaChoices: Record<string, HopRecipeAlphaChoice>;
  originAnnex?: HopV55FullRecipeCopyOriginAnnex;
  expectedSnapshotReference?: string;
  expectedBranchReference?: string;
}

const blocked = (reason: string, recompute = false): HopV55FullRecipeCopyPreviewResult => ({ status: 'blocked', reason, recompute });
const applyBlocked = (reason: string, recompute = false): HopV55FullRecipeCopyApplyResult => ({ status: 'blocked', reason, recompute });
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const same = (left: unknown, right: unknown): boolean => hopDecisionReference(left) === hopDecisionReference(right);
const sameUnknownTemperatureRange = (left: unknown, right: unknown): boolean =>
  left == null && right == null || same(left, right);
function sameScenarioInput(left: HopRecipeInput, right: HopRecipeInput): boolean {
  const normalizedLeft = structuredClone(left) as HopRecipeInput & Record<string, unknown>;
  const normalizedRight = structuredClone(right) as HopRecipeInput & Record<string, unknown>;
  if (normalizedLeft.yeastTemperature == null) delete normalizedLeft.yeastTemperature;
  if (normalizedRight.yeastTemperature == null) delete normalizedRight.yeastTemperature;
  return same(normalizedLeft, normalizedRight);
}
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const hasText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();

function unknownKeys(value: unknown, allowed: readonly string[], label: string): string | undefined {
  if (!isRecord(value)) return `${label} invalide.`;
  const unknown = Object.keys(value).find(key => !allowed.includes(key));
  return unknown ? `${label} : champ non reconnu « ${unknown} ».` : undefined;
}

function copyPlanShapeError(value: unknown): string | undefined {
  const topLevel = unknownKeys(value, ['format', 'branchId', 'recipeName', 'yeast', 'fermentation', 'style',
    'finalHopMasses', 'adoptHopProgram', 'futureProcurement', 'volumeL', 'targets'], 'Plan de copie complète');
  if (topLevel) return topLevel;
  const plan = value as HopV55FullRecipeCopyPlan;
  if (plan.format !== HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT || !hasText(plan.branchId)) return 'Version ou branche du plan de copie complète invalide.';
  if (plan.futureProcurement !== undefined) {
    if (!plan.adoptHopProgram && plan.volumeL === undefined && plan.finalHopMasses === undefined) {
      return 'Une déclaration d’approvisionnement futur exige un programme, un volume ou des masses finales explicitement qualifiés.';
    }
    if (plan.finalHopMasses !== undefined && !Array.isArray(plan.finalHopMasses)) {
      return 'Une déclaration d’approvisionnement futur exige une liste complète des masses finales du programme.';
    }
    try { validateHopRecipeDraftOptions({ futureProcurement: plan.futureProcurement }); }
    catch (error) { return (error as Error).message; }
  }
  if (plan.yeast !== undefined) {
    const issue = unknownKeys(plan.yeast, ['hopIndexId', 'name', 'product', 'strain', 'form', 'quantity', 'pitchTemperatureC'], 'YeastSpec choisie');
    if (issue) return issue;
    const productIssue = unknownKeys(plan.yeast.product, ['id', 'name', 'manufacturer'], 'Produit de levure');
    if (plan.yeast.product !== undefined && productIssue) return productIssue;
    const quantityIssue = unknownKeys(plan.yeast.quantity, ['value', 'unit'], 'Quantité de levure');
    if (quantityIssue) return quantityIssue;
  }
  if (plan.fermentation !== undefined) {
    if (!Array.isArray(plan.fermentation)) return 'Les phases de fermentation doivent former une liste typée.';
    for (const phase of plan.fermentation) {
      const issue = unknownKeys(phase, ['kind', 'name', 'tempC', 'days', 'note'], 'Phase de fermentation');
      if (issue) return issue;
    }
  }
  if (plan.style !== undefined) {
    const issue = unknownKeys(plan.style, ['name', 'ref'], 'Style choisi');
    if (issue) return issue;
    const refIssue = unknownKeys(plan.style.ref, ['guideId', 'version', 'styleId'], 'Référence de style');
    if (refIssue) return refIssue;
  }
  if (plan.finalHopMasses !== undefined) {
    if (!Array.isArray(plan.finalHopMasses)) return 'Les masses finales doivent former une liste d’ajouts J1.';
    for (const mass of plan.finalHopMasses) {
      const issue = unknownKeys(mass, ['additionId', 'grams'], 'Masse finale de houblon');
      if (issue) return issue;
    }
  }
  if (plan.targets !== undefined) {
    const issue = unknownKeys(plan.targets, ['ogTarget', 'fgTarget', 'abvTarget', 'ibuTarget', 'hopAromaTarget'], 'Cibles Recipe');
    if (issue) return issue;
    if (plan.targets.hopAromaTarget !== undefined) {
      if (!isRecord(plan.targets.hopAromaTarget)) return 'Les cibles aromatiques doivent rester indexées par leur identité exacte.';
      for (const range of Object.values(plan.targets.hopAromaTarget)) {
        const rangeIssue = unknownKeys(range, ['min', 'max'], 'Plage aromatique');
        if (rangeIssue) return rangeIssue;
      }
    }
  }
  return undefined;
}

/** Structural/domain validation shared with the persisted J5 recompute reader. */
export function assertHopV55FullRecipeCopyPlan(value: unknown): asserts value is HopV55FullRecipeCopyPlan {
  const issue = copyPlanShapeError(value);
  if (issue) throw Error(issue);
  const plan = value as HopV55FullRecipeCopyPlan;
  if (plan.recipeName !== undefined && !hasText(plan.recipeName)) throw Error('Le nom de recette choisi est vide.');
  if (plan.yeast) {
    if (!hasText(plan.yeast.hopIndexId) || !hasText(plan.yeast.name)
      || !finite(plan.yeast.quantity?.value) || plan.yeast.quantity.value <= 0 || !hasText(plan.yeast.quantity.unit)) {
      throw Error('La culture et sa quantité/unité déclarées sont invalides.');
    }
    if (plan.yeast.form !== undefined && !['sèche', 'liquide', 'levain'].includes(plan.yeast.form)) {
      throw Error('La forme de la culture déclarée est invalide.');
    }
    if (plan.yeast.pitchTemperatureC !== undefined && !finite(plan.yeast.pitchTemperatureC)) {
      throw Error('La cible de température d’ensemencement est invalide.');
    }
    if (plan.yeast.product && [plan.yeast.product.id, plan.yeast.product.name, plan.yeast.product.manufacturer].some(value => !hasText(value))) {
      throw Error('Le produit commercial doit rester complet ou inconnu.');
    }
    if (plan.yeast.strain !== undefined && !hasText(plan.yeast.strain)) throw Error('La souche déclarée est vide.');
  }
  if (plan.fermentation?.some(step => !hasText(step.name) || !finite(step.tempC) || !finite(step.days) || step.days < 0
    || !['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(step.kind))) {
    throw Error('Une phase de fermentation est incomplète ou invalide.');
  }
  if (plan.style && (!hasText(plan.style.name) || !hasText(plan.style.ref.guideId)
    || !hasText(plan.style.ref.version) || !hasText(plan.style.ref.styleId))) throw Error('La référence de style choisie est incomplète.');
  if (plan.finalHopMasses) {
    const ids = new Set<string>();
    for (const mass of plan.finalHopMasses) {
      if (!hasText(mass.additionId) || !finite(mass.grams) || mass.grams < 0 || ids.has(mass.additionId)) {
        throw Error('Une masse finale est non finie, négative ou liée à un ajout dupliqué.');
      }
      ids.add(mass.additionId);
    }
  }
  if (plan.volumeL !== undefined && (!finite(plan.volumeL) || plan.volumeL < 1)) throw Error('Le volume de recette doit être exprimé en litres et être positif.');
  if (plan.targets) {
    for (const field of ['ogTarget', 'fgTarget', 'abvTarget', 'ibuTarget'] as const) {
      if (plan.targets[field] !== undefined && !finite(plan.targets[field])) throw Error(`La cible ${field} est invalide.`);
    }
    for (const range of Object.values(plan.targets.hopAromaTarget ?? {})) {
      if (!finite(range.min) || !finite(range.max) || range.min > range.max) throw Error('Une cible aromatique est invalide.');
    }
  }
}

function currentSourceRecipe(context: BrewerContext): Recipe | null {
  const value = context.recipe;
  if (!isRecord(value) || !hasText(value.id) || !finite(value.volumeL) || !Array.isArray(value.hops)) return null;
  return value as unknown as Recipe;
}

function sourceBranch(request: BrewingScenarioRequest, branchId: string): BrewingScenarioBranchRequest | undefined {
  return request.branches.find(row => row.id === branchId);
}

function copyBranchRequest(source: BrewingScenarioBranchRequest, adoptHopProgram: boolean): BrewingScenarioBranchRequest {
  const branch = structuredClone(source);
  if (!adoptHopProgram) {
    delete branch.programChanges;
    branch.assumptions = branch.assumptions.filter(row => row.path !== 'program.changes');
  }
  return branch;
}

function originAnnexFrom(result: BrewingScenarioResult, requestBranch: BrewingScenarioBranchRequest,
  resultBranchValue: BrewingScenarioBranchResult): HopV55FullRecipeCopyOriginAnnex {
  return {
    scenarioId: result.scenarioId,
    snapshotReference: result.reference,
    branchId: resultBranchValue.id,
    branchReference: resultBranchValue.reference,
    scenarioApplicability: resultBranchValue.applicability,
    requestBranch: structuredClone(requestBranch),
    ...(resultBranchValue.programProposal ? { programProposal: structuredClone(resultBranchValue.programProposal) } : {}),
  };
}

function resultBranch(result: BrewingScenarioResult, branchId: string): BrewingScenarioBranchResult | undefined {
  return result.branches.find(row => row.id === branchId);
}

function initialContextError(context: BrewerContext, prepared: PreparedBrewingScenarioContext): string | undefined {
  if (context.batch && context.batch.status !== 'planifie') {
    return 'La copie complète est réservée à une recette planifiée, sans brassin commencé. Le programme du batch reste immuable.';
  }
  if (finite(context.journal?.startedAt) || finite(context.journal?.pitchedAt)
    || (Object.values(context.journal?.additions ?? {}) as Array<{ doneAt?: unknown } | undefined>)
      .some(row => finite(row?.doneAt))) {
    return 'Le journal contient un fait déjà réalisé. La copie complète ne réécrit pas un brassin commencé.';
  }
  if (prepared.runtime.current?.performedAdditionIds?.length
    || prepared.binding?.program.additions.some(row => row.status === 'performed')) {
    return 'Une addition est déjà réalisée. La copie complète ne réécrit pas un brassin commencé.';
  }
  if (prepared.binding && prepared.binding.program.stage !== 'planning') {
    return 'Le programme n’est plus au stade planifié; la copie complète ne modifie pas une conduite en cours.';
  }
  return undefined;
}

function preparationError(request: BrewingScenarioRequest, prepared: PreparedBrewingScenarioContext): string | undefined {
  if (request.baseline.kind !== 'recipe') return 'Une copie complète exige un scénario rattaché à une recette source courante.';
  const current = prepared.runtime.current;
  if (!current) return 'La recette source n’est plus présente dans le contexte courant.';
  const programReference = current.program ? programFingerprint(current.program) : undefined;
  if (request.baseline.recipeReference !== current.recipeReference
    || request.baseline.inputReference !== current.inputReference
    || request.baseline.programReference !== programReference
    || request.baseline.contextReference !== brewingScenarioCurrentReference(current)) {
    return 'La recette, le journal, le programme ou le contexte a changé depuis le scénario; recalculer avant copie.';
  }
  return undefined;
}

function safeHostId(value: unknown): value is string {
  return hasText(value) && value.length <= 120 && !/[\\/]/.test(value)
    && !/^__.*__$/.test(value) && !['.', '..', 'constructor', 'prototype'].includes(value);
}

function adoptedOverrideSelectionError(
  requestRow: BrewingScenarioBranchRequest,
  current: HopRecipeInput,
  recipe: Recipe,
  plan: HopV55FullRecipeCopyPlan,
): { fields: string[]; reasons: string[] } | undefined {
  const fields: string[] = [];
  const reasons: string[] = [];
  const overrides = requestRow.inputOverrides;
  if (overrides?.yeastId !== undefined && overrides.yeastId !== current.yeastId && !plan.yeast) {
    fields.push('yeast'); reasons.push('La souche de scénario doit être reprise par une YeastSpec explicitement déclarée.');
  }
  if (overrides?.volumeL !== undefined && overrides.volumeL !== recipe.volumeL && plan.volumeL === undefined) {
    fields.push('volumeL'); reasons.push('Le volume de scénario doit être adopté avec les masses finales de houblon en grammes.');
  }
  if (requestRow.programOverrides?.volumeL !== undefined && requestRow.programOverrides.volumeL !== recipe.volumeL && plan.volumeL === undefined) {
    fields.push('volumeL'); reasons.push('Le volume du programme de scénario doit être adopté avec les masses finales de houblon en grammes.');
  }
  if (overrides?.pitchTempC !== undefined && overrides.pitchTempC !== current.pitchTempC && plan.yeast?.pitchTemperatureC === undefined) {
    fields.push('pitchTemperatureC'); reasons.push('La température d’ensemencement est une cible de recette; elle doit être adoptée explicitement.');
  }
  if (overrides?.fermentation !== undefined && !same(overrides.fermentation, current.fermentation) && !plan.fermentation) {
    fields.push('fermentation'); reasons.push('Les phases de scénario doivent être reprises comme paliers de conduite typés.');
  }
  if (overrides?.yeastTemperature !== undefined && !same(overrides.yeastTemperature, current.yeastTemperature) && !plan.fermentation) {
    return { fields: ['yeastTemperature', 'fermentation'], reasons: [
      'Une plage typed de température de levure ne se copie pas comme un fait technique. Choisis des paliers de fermentation résolus avant de poursuivre.',
    ] };
  }
  return fields.length ? { fields, reasons } : undefined;
}

function findYeast(prepared: PreparedBrewingScenarioContext, yeastId: string): HopYeast | undefined {
  return prepared.runtime.engineData.knowledge.find((row): row is HopYeast => row.kind === 'yeast' && row.id === yeastId);
}

function makeYeastSpec(selection: HopV55FullRecipeYeastSelection, prepared: PreparedBrewingScenarioContext,
  branch: BrewingScenarioBranchResult): YeastSpec | string {
  if (!hasText(selection.hopIndexId) || !hasText(selection.name)
    || selection.product !== undefined && (!hasText(selection.product.id) || !hasText(selection.product.name) || !hasText(selection.product.manufacturer))
    || selection.strain !== undefined && !hasText(selection.strain)
    || selection.form !== undefined && !['sèche', 'liquide', 'levain'].includes(selection.form)
    || !finite(selection.quantity?.value) || selection.quantity.value <= 0 || !hasText(selection.quantity?.unit)) {
    return 'La YeastSpec exige une identité, une quantité positive et son unité. Produit, souche et forme restent facultatifs s’ils sont inconnus.';
  }
  if (branch.input.yeastId !== selection.hopIndexId) {
    return `L’identifiant sélectionné ${selection.hopIndexId} ne correspond pas à la souche simulée (${branch.input.yeastId ?? 'inconnue'}).`;
  }
  if (branch.culture?.state === 'mixed') return 'La culture est mixte; le contrat de recette ne permet pas de représenter ses membres comme une souche unique.';
  if (branch.culture?.state !== 'single' || branch.culture.members.length !== 1
    || branch.culture.members[0].yeastId !== selection.hopIndexId) {
    return 'La culture simulée ne résout pas exactement une souche chargée; aucune identité ne sera déduite.';
  }
  const resolved = findYeast(prepared, selection.hopIndexId);
  if (!resolved) return `La souche ${selection.hopIndexId} n’est pas résolue dans les références courantes.`;
  if (selection.form && resolved.form && resolved.form !== selection.form) return `La forme choisie (${selection.form}) contredit la forme de catalogue (${resolved.form}).`;
  if (selection.product && resolved.catalogue && (resolved.catalogue.productId !== selection.product.id
    || resolved.catalogue.manufacturer !== selection.product.manufacturer)) {
    return `Le produit déclaré ${selection.product.id} ne correspond pas au produit exact de la référence levure ${selection.hopIndexId}.`;
  }
  return {
    name: selection.name,
    hopIndexId: selection.hopIndexId,
    ...(selection.product ? { lab: selection.product.manufacturer } : {}),
    ...(selection.strain ? { strain: selection.strain } : {}),
    ...(selection.form ? { form: selection.form } : {}),
    qty: selection.quantity.value,
    unit: selection.quantity.unit,
    ...(selection.pitchTemperatureC !== undefined ? { pitchTempC: selection.pitchTemperatureC } : {}),
  };
}

function resolvedStyle(context: BrewerContext, ref: BrewingStyleRef): { name: string } | undefined {
  const guide = context.hopIndex?.knowledge.find((row): row is BrewingStyleGuide => row.kind === 'styleGuide' && row.id === ref.guideId);
  if (!guide) return undefined;
  const revision = guide.version === ref.version ? guide : guide.history?.find(row => row.version === ref.version);
  const style = revision?.styles.find(row => row.id === ref.styleId);
  return style ? { name: style.name } : undefined;
}

function styleSelectionError(selection: HopV55FullRecipeCopyPlan['style'], context: BrewerContext,
  branch: BrewingScenarioBranchResult): string | undefined {
  if (!selection) return undefined;
  const resolved = resolvedStyle(context, selection.ref);
  if (!resolved) return `Le style ${selection.ref.guideId}/${selection.ref.version}/${selection.ref.styleId} n’est pas résolu dans le catalogue courant.`;
  if (resolved.name !== selection.name) return 'Le libellé du style ne correspond pas à sa référence exacte.';
  if (branch.beerContext?.style?.role !== 'target'
    || branch.beerContext.style.guideId !== selection.ref.guideId
    || branch.beerContext.style.version !== selection.ref.version
    || branch.beerContext.style.styleId !== selection.ref.styleId) {
    return 'La branche ne porte pas cette référence de style avec le rôle cible.';
  }
  const styleFacts = branch.beerContext.facts.filter(fact => fact.field === 'style.name' && (fact.status === 'target' || fact.status === 'selected'));
  if (styleFacts.some(fact => fact.value !== selection.name)) return 'Le nom de style de la branche contredit sa référence cible résolue.';
  return undefined;
}

function targetSelectionError(selection: HopV55FullRecipeTargetSelection | undefined, request: BrewingScenarioRequest,
  branch: BrewingScenarioBranchResult): string | undefined {
  if (!selection) return undefined;
  const targetFields = [
    ['ogTarget', selection.ogTarget, 'SG'], ['fgTarget', selection.fgTarget, 'SG'],
    ['abvTarget', selection.abvTarget, '% vol.'], ['ibuTarget', selection.ibuTarget, 'IBU'],
  ] as const;
  for (const [field, value, unit] of targetFields) {
    if (value === undefined) continue;
    if (!finite(value)) return `La cible ${field} doit être une valeur finie explicitement choisie.`;
    const matches = (branch.beerContext?.facts ?? []).filter(row => row.field === field && row.status === 'target');
    if (matches.length !== 1 || matches[0].value !== value || matches[0].unit !== unit) {
      return `La cible ${field} doit correspondre à un fait cible exact (${unit}) de la branche; aucune sortie calculée ne peut la remplacer.`;
    }
  }
  if (selection.hopAromaTarget !== undefined) {
    const selectedTargets = request.target ?? {};
    for (const [id, range] of Object.entries(selection.hopAromaTarget)) {
      if (!id.trim() || !finite(range?.min) || !finite(range?.max) || range.min > range.max
        || !same(selectedTargets[id], range)) return `La cible aromatique ${id} n’est pas une plage explicitement choisie de la requête.`;
    }
  }
  return undefined;
}

function mappedFermentation(phases: FermentationStep[]): HopRecipeInput['fermentation'] {
  return phases.map(step => ({ kind: step.kind, name: step.name, tempC: step.tempC, days: step.days,
    ...(step.note !== undefined ? { note: step.note } : {}) }));
}

function recipeFromPlan(source: Recipe, requestRow: BrewingScenarioBranchRequest, branch: BrewingScenarioBranchResult,
  prepared: PreparedBrewingScenarioContext, context: BrewerContext, request: BrewingScenarioRequest,
  plan: HopV55FullRecipeCopyPlan): { recipe?: Recipe; missing?: { fields: string[]; reasons: string[] }; error?: string } {
  if (plan.format !== HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT || plan.branchId !== branch.id) {
    return { error: 'Le plan typé ne correspond pas à la branche sélectionnée.' };
  }
  const currentInput = prepared.runtime.current?.input;
  if (!currentInput) return { error: 'L’entrée de recette ne peut pas être préparée pour contrôler les choix de copie.' };
  const missing = adoptedOverrideSelectionError(requestRow, currentInput, source, plan);
  if (missing) return { missing };
  if (branch.culture?.state === 'mixed') return { error: 'Culture mixte : la copie Recipe ne peut pas réduire plusieurs membres à une souche unique.' };

  const next = structuredClone(source);
  if (plan.recipeName !== undefined) {
    if (!hasText(plan.recipeName) || plan.recipeName.trim().length < 2) return { error: 'Le nom choisi pour la copie doit contenir au moins deux caractères.' };
    next.name = plan.recipeName.trim();
  }
  if (plan.yeast) {
    const yeast = makeYeastSpec(plan.yeast, prepared, branch);
    if (typeof yeast === 'string') return { error: yeast };
    next.yeast = yeast;
    // Catalogue facts, starter/stock records and old design snapshots belong to the old recipe/souche.
    delete next.yeastGuide;
    delete next.yeastDesign;
  }
  if (plan.yeast?.pitchTemperatureC !== undefined && branch.input.pitchTempC !== plan.yeast.pitchTemperatureC) {
    return { error: 'La température d’ensemencement choisie ne correspond pas à la cible de la branche.' };
  }
  if (plan.fermentation) {
    if (!Array.isArray(plan.fermentation) || plan.fermentation.length === 0
      || plan.fermentation.some(step => !step || !['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(step.kind)
        || !hasText(step.name)
        || !finite(step.tempC) || !finite(step.days) || step.days < 0
        || step.note !== undefined && typeof step.note !== 'string')) {
      return { error: 'Les phases doivent avoir un type, un libellé, une température et une durée explicites.' };
    }
    if (!same(mappedFermentation(plan.fermentation), branch.input.fermentation)) {
      return { error: 'Les paliers déclarés ne correspondent pas exactement aux phases simulées.' };
    }
    next.fermentation = structuredClone(plan.fermentation);
  }
  if (plan.yeast?.pitchTemperatureC === undefined && plan.yeast && next.yeast.pitchTempC !== undefined) {
    delete next.yeast.pitchTempC;
  }
  if (plan.yeast && !plan.fermentation && requestRow.inputOverrides?.yeastTemperature !== undefined
    && !same(requestRow.inputOverrides.yeastTemperature, currentInput.yeastTemperature)) {
    return { missing: { fields: ['fermentation'], reasons: [
      'La plage typed de souche ne devient pas un fait technique de la nouvelle levure. Choisis des phases de fermentation exactes pour porter la conduite.',
    ] } };
  }
  const styleError = styleSelectionError(plan.style, context, branch);
  if (styleError) return { error: styleError };
  if (plan.style) {
    next.style = plan.style.name;
    next.styleRef = structuredClone(plan.style.ref);
  }
  if (plan.volumeL !== undefined) {
    if (!finite(plan.volumeL) || plan.volumeL < 1) return { error: 'Le volume final doit être positif et explicitement indiqué en litres.' };
    if (branch.input.volumeL !== plan.volumeL || branch.program?.volumeL !== plan.volumeL) {
      return { error: 'Le volume choisi ne correspond pas au volume de l’entrée et du programme de la branche.' };
    }
    if (plan.finalHopMasses === undefined) return { missing: { fields: ['finalHopMasses'], reasons: [
      'Un changement de volume exige une masse finale explicite en grammes pour chaque ajout prévu.',
    ] } };
    next.volumeL = plan.volumeL;
    // The final masses are applied after J4 when its program is adopted; otherwise they must bind to existing rows.
    if (!plan.adoptHopProgram) {
      const masses = exactMassMap(plan.finalHopMasses);
      if (masses.error) return { error: masses.error };
      const program = prepared.binding?.program;
      if (!program) return { error: 'Le programme ne peut pas relier les masses finales aux lignes de houblon de la recette.' };
      const mismatch = massMismatch(program, masses.map!);
      if (mismatch) return { error: mismatch };
      const hopIndices = new Map(program.additions.map((addition, index) => [addition.id, index]));
      for (const [id, grams] of masses.map!) {
        const index = hopIndices.get(id);
        if (index === undefined || !next.hops[index]) return { error: `La masse finale ${id} ne correspond pas à une ligne de houblon existante.` };
        next.hops[index] = { ...next.hops[index], weightG: grams };
      }
    }
    // These values depend on the old batch volume; no stale calculation is carried into the copy.
    delete next.preBoilL;
    delete next.preBoilHotL;
    delete next.waterPlan;
    delete next.water;
  }
  if (plan.yeast && plan.yeast.pitchTemperatureC === undefined && plan.yeast.hopIndexId !== source.yeast?.hopIndexId) {
    // A pitch target from the old strain is not carried forward by identity alone.
    delete next.yeast.pitchTempC;
  }
  const targetError = targetSelectionError(plan.targets, request, branch);
  if (targetError) return { error: targetError };
  if (plan.targets) {
    if (plan.targets.ogTarget !== undefined) next.ogTarget = plan.targets.ogTarget;
    if (plan.targets.fgTarget !== undefined) next.fgTarget = plan.targets.fgTarget;
    if (plan.targets.abvTarget !== undefined) next.abvTarget = plan.targets.abvTarget;
    if (plan.targets.ibuTarget !== undefined) next.ibuTarget = plan.targets.ibuTarget;
    if (plan.targets.hopAromaTarget !== undefined) next.hopAromaTarget = {
      ...(next.hopAromaTarget ?? {}), ...structuredClone(plan.targets.hopAromaTarget),
    };
  }
  return { recipe: next };
}

function exactMassMap(rows: Array<{ additionId: string; grams: number }> | undefined): { map?: Map<string, number>; error?: string } {
  if (!Array.isArray(rows)) return { error: 'Les masses finales ne sont pas déclarées.' };
  const result = new Map<string, number>();
  for (const row of rows) {
    if (!row || !hasText(row.additionId) || !finite(row.grams) || row.grams < 0 || result.has(row.additionId)) {
      return { error: 'Chaque masse finale doit avoir un ID unique et une valeur finie en grammes.' };
    }
    result.set(row.additionId, row.grams);
  }
  return { map: result };
}

function massMismatch(program: HopDecisionProgram, selected: Map<string, number>): string | undefined {
  const additions = program.additions;
  if (selected.size !== additions.length) return 'Les masses explicites ne couvrent pas exactement les lignes du programme.';
  for (const addition of additions) {
    if (!selected.has(addition.id) || selected.get(addition.id) !== addition.grams) {
      return `La masse finale de ${addition.id} diffère de la dose J1 (${addition.grams ?? 'inconnue'} g).`;
    }
  }
  return undefined;
}

function validateBranchProgramMapping(branch: BrewingScenarioBranchResult, recipe: Recipe): string | undefined {
  if (!branch.program) return undefined;
  if (branch.program.volumeL !== recipe.volumeL || branch.input.volumeL !== recipe.volumeL) {
    return 'Le volume en litres de Recipe, du programme et de l’entrée simulée ne correspond pas.';
  }
  const inputById = new Map(branch.input.additions.map(row => [row.id, row]));
  if (inputById.size !== branch.program.additions.length) return 'Les IDs des ajouts Recipe, programme et simulation ne correspondent pas.';
  for (const addition of branch.program.additions) {
    const modeled = inputById.get(addition.id);
    if (!modeled || modeled.triplet.timing !== addition.use) return `Le timing simulé de ${addition.id} ne correspond pas à son emploi J1.`;
    const expectedDose = addition.grams === null ? null : addition.grams / recipe.volumeL;
    if (modeled.triplet.doseGL !== expectedDose) return `La dose g/L de ${addition.id} ne correspond pas à sa masse finale et au volume.`;
    if (modeled.triplet.yeastId !== branch.input.yeastId) return `La souche simulée de ${addition.id} diffère de la souche commune.`;
  }
  return undefined;
}

function noOpProgramChanges(program: HopDecisionProgram): HopProgramChange[] {
  return program.additions.filter(row => row.status === 'planned').map(row => ({
    kind: 'replace' as const, additionId: row.id, additions: [structuredClone(row)],
  }));
}

function readiness(recipe: Recipe): HopV55FullRecipeCopyReadiness {
  const value = recipeReadiness(recipe);
  const missing = [...value.missing, ...(!recipe.yeast?.form ? [{ field: 'wz-yeast-form', step: 'levure' as const,
    message: 'Forme de levure inconnue : le brouillon reste enregistrable, mais cette précision manque avant le brassage.' }] : [])];
  return {
    localCopy: 'ready',
    save: value.invalid.length ? 'invalid' : 'readyToSave',
    brew: value.invalid.length ? 'invalid' : missing.length ? 'incomplete' : 'ready',
    invalid: value.invalid,
    missing,
    saveConfirmed: false,
  };
}

function beerSemantics(value: BrewingScenarioBranchResult['beerContext']) {
  return value ? { style: value.style ?? null, matrixId: value.matrixId ?? null,
    facts: value.facts.map(({ source: _source, ...fact }) => fact) } : null;
}

function beerSemanticsOutsideCopyPlan(value: BrewingScenarioBranchResult['beerContext'], plan: HopV55FullRecipeCopyPlan) {
  const semantics = beerSemantics(value);
  if (!semantics) return null;
  const explicit = new Set<string>();
  if (plan.volumeL !== undefined) explicit.add('volumeL');
  for (const field of ['ogTarget', 'fgTarget', 'abvTarget', 'ibuTarget'] as const) {
    if (plan.targets?.[field] !== undefined) explicit.add(field);
  }
  if (plan.style) explicit.add('style.name');
  return { ...semantics, style: plan.style ? null : semantics.style,
    facts: semantics.facts.filter(fact => !explicit.has(fact.field)) };
}

function makeCandidateContext(context: BrewerContext, recipe: Recipe): BrewerContext {
  return { ...structuredClone(context), recipe: structuredClone(recipe) };
}

function predictFinalRecipeCandidate(input: {
  context: BrewerContext; recipe: Recipe; scenario: BrewingScenarioRequest; branchId: string;
  target: Record<string, { min: number; max: number }>;
}): { request: BrewingScenarioRequest; result: BrewingScenarioResult; branch: BrewingScenarioBranchResult }
  | { error: string } {
  try {
    const prepared = prepareBrewingScenarioContext(makeCandidateContext(input.context, input.recipe));
    const current = prepared.runtime.current;
    if (!current) return { error: 'La recette finale ne peut pas être préparée pour sa prévision propre.' };
    const request = buildBrewingScenarioRequest({
      scenarioId: input.scenario.scenarioId,
      revision: input.scenario.revision,
      target: input.target,
      assumptions: [],
      baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
        ...(current.program ? { program: current.program } : {}), contextReference: brewingScenarioCurrentReference(current) },
    });
    request.branches.push({ id: input.branchId, label: 'Prévision de la recette proposée', assumptions: [],
      ...(current.culture ? { culture: structuredClone(current.culture) } : {}),
      ...(current.beerContext ? { beerContext: structuredClone(current.beerContext) } : {}) });
    const result = simulateBrewingScenario(request, prepared.runtime);
    const branch = result.branches.find(row => row.id === input.branchId);
    return branch ? { request, result, branch } : { error: 'La prévision finale ne contient pas la candidate Recipe.' };
  } catch (error) {
    return { error: `La recette finale ne peut pas être prévisualisée indépendamment: ${(error as Error).message}` };
  }
}

function previewFromRequest(input: PreviewInput): HopV55FullRecipeCopyPreviewResult {
  const source = currentSourceRecipe(input.context);
  if (!source) return blocked('Aucune recette source complète n’est disponible dans le contexte courant.', true);
  let prepared: PreparedBrewingScenarioContext;
  try {
    prepared = prepareBrewingScenarioContext(input.context);
  } catch (error) {
    return blocked(`Le contexte Recipe courant ne peut pas être préparé: ${(error as Error).message}`, true);
  }
  const stageError = initialContextError(input.context, prepared);
  if (stageError) return blocked(stageError);
  const baselineError = preparationError(input.requestSnapshot, prepared);
  if (baselineError) return blocked(baselineError, true);
  const planError = copyPlanShapeError(input.plan);
  if (planError) return blocked(planError);
  if (input.plan?.branchId !== input.branchId) return blocked('Le plan de copie ne désigne pas la branche sélectionnée.');

  let sourceFresh: BrewingScenarioResult;
  try {
    sourceFresh = simulateBrewingScenario(input.requestSnapshot, prepared.runtime);
  } catch (error) {
    return blocked(`Le scénario ne peut pas être recalculé sur le contexte courant: ${(error as Error).message}`, true);
  }
  if (input.expectedSnapshotReference && sourceFresh.reference !== input.expectedSnapshotReference) {
    return blocked('Le snapshot du scénario a changé depuis l’aperçu; recalculer avant copie.', true);
  }
  const requestRow = sourceBranch(input.requestSnapshot, input.branchId);
  const sourceResultBranch = resultBranch(sourceFresh, input.branchId);
  if (!requestRow || !sourceResultBranch) return blocked('La branche sélectionnée est absente du résultat courant.', true);
  if (input.expectedBranchReference && sourceResultBranch.reference !== input.expectedBranchReference) {
    return blocked('La référence de branche a changé depuis l’aperçu; recalculer avant copie.', true);
  }
  const originAnnex = input.originAnnex ?? originAnnexFrom(sourceFresh, requestRow, sourceResultBranch);
  if (originAnnex.branchId !== sourceResultBranch.id || originAnnex.requestBranch.id !== originAnnex.branchId
    || !hasText(originAnnex.snapshotReference) || !hasText(originAnnex.branchReference)) {
    return blocked('L’annexe de la branche historique ne correspond pas au scénario retenu. Refaire cette prévision.', true);
  }
  if (sourceResultBranch.culture?.state === 'mixed') {
    return blocked('La culture de la branche est mixte; la Recipe ne peut pas représenter plusieurs membres comme une souche unique.');
  }

  const built = recipeFromPlan(source, requestRow, sourceResultBranch, prepared, input.context, input.requestSnapshot, input.plan);
  if (built.missing) return { status: 'needsSelection', ...built.missing };
  if (built.error) return blocked(built.error);
  let candidate = built.recipe!;
  const copyRequestBranch = copyBranchRequest(requestRow, !!input.plan.adoptHopProgram);
  const copySourceRequest = { ...structuredClone(input.requestSnapshot), branches: [copyRequestBranch] };
  let copySourceResult: BrewingScenarioResult;
  try { copySourceResult = simulateBrewingScenario(copySourceRequest, prepared.runtime); }
  catch (error) { return blocked(`Le scénario de la recette copiée ne peut pas être recalculé: ${(error as Error).message}`, true); }
  const copySourceBranch = resultBranch(copySourceResult, input.branchId);
  if (!copySourceBranch) return blocked('La prévision de la recette copiée ne contient pas la branche sélectionnée.', true);
  const semanticError = validateBranchProgramMapping(copySourceBranch, source);
  if (semanticError && !input.plan.adoptHopProgram && input.plan.volumeL === undefined) return blocked(semanticError);

  let candidatePrepared: PreparedBrewingScenarioContext;
  let candidateContext: BrewerContext;
  try {
    candidateContext = makeCandidateContext(input.context, candidate);
    candidatePrepared = prepareBrewingScenarioContext(candidateContext);
  } catch (error) {
    return blocked(`Le candidat Recipe ne peut pas être préparé: ${(error as Error).message}`);
  }
  const candidateStageError = initialContextError(candidateContext, candidatePrepared);
  if (candidateStageError) return blocked(candidateStageError);
  const candidateCurrent = candidatePrepared.runtime.current;
  if (!candidateCurrent) return blocked('Le candidat n’a pas produit d’entrée de recette exploitable.');

  if (requestRow.inputOverrides?.yeastTemperature !== undefined && input.plan.fermentation
    && !sameUnknownTemperatureRange(requestRow.inputOverrides.yeastTemperature, candidateCurrent.input.yeastTemperature)
    && !sameUnknownTemperatureRange(sourceResultBranch.input.yeastTemperature, candidateCurrent.input.yeastTemperature)) {
    return { status: 'needsRecompute', candidate: structuredClone(candidate), reasons: [
      'La plage technique de la branche n’existe pas sur la nouvelle YeastSpec. Les paliers sélectionnés restent une conduite de recette; relance la scène sans transférer cette plage comme fait technique.',
    ] };
  }

  if (input.plan.volumeL !== undefined) {
    if (candidate.volumeL !== candidateCurrent.input.volumeL) return blocked('Le volume préparé depuis Recipe diffère du volume choisi en litres.');
    if (!candidatePrepared.binding) return blocked('Le programme doit être résolu pour vérifier les masses finales après changement de volume.');
  }
  const candidateProgramError = input.plan.adoptHopProgram && !candidatePrepared.binding
    ? 'Le programme complet de houblon ne peut pas être relié à la recette candidate.' : undefined;
  if (candidateProgramError) return blocked(candidateProgramError);

  const candidateBaseline = {
    kind: 'recipe' as const,
    recipeReference: candidateCurrent.recipeReference,
    inputReference: candidateCurrent.inputReference,
    ...(candidateCurrent.program ? { programReference: programFingerprint(candidateCurrent.program) } : {}),
    contextReference: brewingScenarioCurrentReference(candidateCurrent),
  };
  const candidateRequest: BrewingScenarioRequest = { ...structuredClone(copySourceRequest), baseline: candidateBaseline };
  const candidateRequestBranch = candidateRequest.branches.find(row => row.id === input.branchId);
  if (candidateRequestBranch?.inputOverrides?.yeastTemperature === null
    && candidateCurrent.input.yeastTemperature == null) {
    // The physical source branch records that the old strain's range is not transferred.
    // On the candidate baseline, unknown is already its native state; omit the redundant null
    // patch there because scenario comparison expects absent values on an already-unknown input.
    const { yeastTemperature: _unknownRange, ...remainingOverrides } = candidateRequestBranch.inputOverrides;
    candidateRequestBranch.inputOverrides = remainingOverrides;
  }
  let candidateProcessResult: BrewingScenarioResult;
  try {
    candidateProcessResult = simulateBrewingScenario(candidateRequest, candidatePrepared.runtime);
  } catch (error) {
    return blocked(`Le candidat exige une nouvelle prévision de scénario: ${(error as Error).message}`, true);
  }
  const candidateProcessBranch = resultBranch(candidateProcessResult, input.branchId);
  if (!candidateProcessBranch) return blocked('La branche disparaît lors de la prévision sur le candidat.', true);

  const recomputeReasons: string[] = [];
  if (!sameScenarioInput(copySourceBranch.input, candidateProcessBranch.input)) {
    const before = copySourceBranch.input as unknown as Record<string, unknown>;
    const after = candidateProcessBranch.input as unknown as Record<string, unknown>;
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .filter(field => !same(before[field], after[field])).sort();
    recomputeReasons.push(`L’entrée de scénario change sur ${changed.join(', ')} quand la recette candidate est préparée; refaire la prévision avant de confirmer la copie.`);
  }
  if (!same(copySourceBranch.program ?? null, candidateProcessBranch.program ?? null)) recomputeReasons.push('Le programme J1 change quand la recette candidate est préparée; refaire la prévision avant de confirmer la copie.');
  if (!same(copySourceBranch.culture ?? null, candidateProcessBranch.culture ?? null)) recomputeReasons.push('La culture résolue change quand la recette candidate est préparée; confirmer une nouvelle prévision de culture.');
  if (!same(beerSemanticsOutsideCopyPlan(copySourceBranch.beerContext, input.plan),
    beerSemanticsOutsideCopyPlan(candidateProcessBranch.beerContext, input.plan))) {
    recomputeReasons.push('Les rôles ou valeurs du contexte bière changent quand la recette candidate est préparée; refaire la prévision avant copie.');
  }
  if (input.plan.yeast && (candidateProcessBranch.input.yeastId !== input.plan.yeast.hopIndexId
    || candidateProcessBranch.culture?.state !== 'single' || candidateProcessBranch.culture.members.length !== 1
    || candidateProcessBranch.culture.members[0].yeastId !== input.plan.yeast.hopIndexId)) {
    recomputeReasons.push('La culture et l’identifiant de levure de la nouvelle prévision ne correspondent pas à la YeastSpec sélectionnée.');
  }
  if (input.plan.yeast?.pitchTemperatureC !== undefined && candidateProcessBranch.input.pitchTempC !== input.plan.yeast.pitchTemperatureC) {
    recomputeReasons.push('La température d’ensemencement de la nouvelle prévision ne correspond pas à la cible de recette.');
  }
  if (input.plan.fermentation && !same(candidateProcessBranch.input.fermentation, mappedFermentation(input.plan.fermentation))) {
    recomputeReasons.push('Les phases et unités de la nouvelle prévision ne correspondent pas aux paliers sélectionnés.');
  }
  if (input.plan.style && (candidateProcessBranch.beerContext?.style?.role !== 'target'
    || candidateProcessBranch.beerContext.style.guideId !== input.plan.style.ref.guideId
    || candidateProcessBranch.beerContext.style.version !== input.plan.style.ref.version
    || candidateProcessBranch.beerContext.style.styleId !== input.plan.style.ref.styleId)) {
    recomputeReasons.push('Le rôle ou la référence exacte du style de la nouvelle prévision a changé.');
  }
  if (input.plan.volumeL !== undefined && (candidateProcessBranch.input.volumeL !== input.plan.volumeL
    || candidateProcessBranch.program?.volumeL !== input.plan.volumeL)) {
    recomputeReasons.push('Le volume de Recipe, de l’entrée et du programme n’est pas identique en litres.');
  }
  if (recomputeReasons.length) return { status: 'needsRecompute', candidate: structuredClone(candidate), reasons: recomputeReasons };

  let hopPreview: HopRecipeFinalPreview<Recipe> | undefined;
  if (input.plan.adoptHopProgram) {
    if (!requestRow.programChanges?.length || !candidateProcessBranch.programProposal) {
      return blocked('La branche ne contient pas de changement J1 à adopter comme programme de houblon.');
    }
    const binding = candidatePrepared.binding!;
    if (candidateProcessBranch.programProposal.baseline !== programFingerprint(binding.program)) {
      return { status: 'needsRecompute', candidate: structuredClone(candidate), reasons: [
        'La proposition J1 utilise une base différente du programme de la recette candidate. Refaire la branche depuis ce programme avant copie.',
      ] };
    }
    if (candidateProcessBranch.programProposal.applicability === 'unavailable' && !input.plan.futureProcurement) {
      return blocked('J1 qualifie ce programme comme indisponible. Son adoption dans la Recipe est bloquée; tu peux garder les houblons source et conserver la proposition en annexe.');
    }
    const mappingError = validateBranchProgramMapping(candidateProcessBranch, candidate);
    if (mappingError) return blocked(mappingError);
    let finalPreview;
    try {
      finalPreview = previewHopRecipeDraft(candidate, binding, candidateProcessBranch.programProposal,
        candidatePrepared.runtime.materials, input.alphaChoices,
        input.plan.futureProcurement ? { futureProcurement: input.plan.futureProcurement } : {},
        { includeAlphaChoiceWitness: true });
    } catch (error) {
      return blocked(`L’aperçu J4 refuse le candidat: ${(error as Error).message}`);
    }
    if (finalPreview.status === 'needsAlphaSelection') {
      return { status: 'needsAlphaSelection', scenarioId: candidateProcessResult.scenarioId, branchId: candidateProcessBranch.id,
        materialIds: [...finalPreview.materialIds], reasons: [...finalPreview.reasons],
        ...(finalPreview.alphaChoiceWitnesses ? { alphaChoiceWitnesses: structuredClone(finalPreview.alphaChoiceWitnesses) } : {}),
        ...(finalPreview.futureProcurement ? { futureProcurement: structuredClone(finalPreview.futureProcurement) } : {}),
        ...(finalPreview.conditions ? { conditions: structuredClone(finalPreview.conditions) } : {}) };
    }
    hopPreview = finalPreview;
    candidate = structuredClone(finalPreview.draft.recipe);
    const selectedMasses = exactMassMap(input.plan.finalHopMasses);
    if (selectedMasses.error) return blocked(selectedMasses.error);
    const mismatch = massMismatch(candidateProcessBranch.program!, selectedMasses.map!);
    if (mismatch) return blocked(mismatch);
  } else if (input.plan.volumeL !== undefined || input.plan.futureProcurement !== undefined) {
    if (!candidatePrepared.binding) return blocked('Le programme de houblon de la recette finale ne peut pas être relié aux identités chargées.');
    const selectedMasses = exactMassMap(input.plan.finalHopMasses);
    if (selectedMasses.error) return blocked(selectedMasses.error);
    const mismatch = massMismatch(candidatePrepared.binding!.program, selectedMasses.map!);
    if (mismatch) return blocked(mismatch);
    const changes = noOpProgramChanges(candidatePrepared.binding!.program);
    if (changes.length) {
      let proposal;
      try {
        proposal = previewHopProgramChanges(candidatePrepared.binding!.program, changes, candidatePrepared.runtime.materials);
      } catch (error) {
        return blocked(`Le programme exact ne peut pas être qualifié au nouveau volume: ${(error as Error).message}`);
      }
      if (proposal.applicability === 'unavailable' && !input.plan.futureProcurement) {
        return { status: 'needsSelection', fields: ['futureProcurement'], reasons: [
          'Le programme de la nouvelle recette manque de houblon disponible. Déclare l’approvisionnement futur avant de poursuivre.',
        ] };
      }
      try {
        const finalPreview = previewHopRecipeDraft(candidate, candidatePrepared.binding!, proposal,
          candidatePrepared.runtime.materials, input.alphaChoices,
          input.plan.futureProcurement ? { futureProcurement: input.plan.futureProcurement } : {},
          { includeAlphaChoiceWitness: true });
        if (finalPreview.status === 'needsAlphaSelection') {
          return { status: 'needsAlphaSelection', scenarioId: candidateProcessResult.scenarioId, branchId: candidateProcessBranch.id,
            materialIds: [...finalPreview.materialIds], reasons: [...finalPreview.reasons],
            ...(finalPreview.alphaChoiceWitnesses ? { alphaChoiceWitnesses: structuredClone(finalPreview.alphaChoiceWitnesses) } : {}),
            ...(finalPreview.futureProcurement ? { futureProcurement: structuredClone(finalPreview.futureProcurement) } : {}),
            ...(finalPreview.conditions ? { conditions: structuredClone(finalPreview.conditions) } : {}) };
        }
        hopPreview = finalPreview;
        candidate = structuredClone(finalPreview.draft.recipe);
      } catch (error) {
        return blocked(`Le programme final de la recette refuse son aperçu: ${(error as Error).message}`);
      }
    }
  } else if (input.plan.finalHopMasses !== undefined) {
    return blocked('Les masses finales sont sans portée : sélectionne un volume ou adopte le programme J1.');
  }

  if (input.plan.volumeL !== undefined && !input.plan.adoptHopProgram) {
    const selectedMasses = exactMassMap(input.plan.finalHopMasses);
    if (selectedMasses.error) return blocked(selectedMasses.error);
    const mismatch = massMismatch(candidatePrepared.binding!.program, selectedMasses.map!);
    if (mismatch) return blocked(mismatch);
  }

  const finalCandidateForecast = predictFinalRecipeCandidate({ context: input.context, recipe: candidate,
    scenario: input.requestSnapshot, branchId: input.branchId,
    target: { ...(input.requestSnapshot.target ?? {}), ...(input.plan.targets?.hopAromaTarget ?? {}) } });
  if ('error' in finalCandidateForecast) return blocked(finalCandidateForecast.error);
  const candidateProgramAnnex = hopPreview ? {
    applicability: hopPreview.sourceProposal.applicability,
    stock: structuredClone(hopPreview.sourceProposal.stock),
    conditions: structuredClone(hopPreview.sourceProposal.conditions),
  } satisfies HopV55FullRecipeCopyProcurementAnnex : undefined;
  let finalReadiness = readiness(candidate);
  if (candidateProgramAnnex && candidateProgramAnnex.applicability !== 'available' && finalReadiness.brew === 'ready') {
    finalReadiness = { ...finalReadiness, brew: 'incomplete',
      missing: [...finalReadiness.missing, { field: 'hop-procurement', step: 'houblons' as const,
        message: candidateProgramAnnex.applicability === 'unavailable'
          ? 'Le houblon reste à approvisionner avant le brassage; la copie locale et son enregistrement restent possibles.'
          : 'Le stock de houblon doit être relu et confirmé avant le brassage.' }] };
  }
  const preservedBranch = input.originAnnex?.requestBranch ?? requestRow;
  const originalProposalAnnex = input.originAnnex?.programProposal ?? sourceResultBranch.programProposal;
  const receipt: HopV55FullRecipeCopyReceipt = {
    format: HOP_V55_FULL_RECIPE_COPY_FORMAT,
    scope: 'localDraft',
    sourceRecipeId: source.id,
    scenarioId: sourceFresh.scenarioId,
    snapshotReference: sourceFresh.reference,
    branchId: sourceResultBranch.id,
    branchReference: sourceResultBranch.reference,
    candidateSnapshotReference: finalCandidateForecast.result.reference,
    candidateBranchReference: finalCandidateForecast.branch.reference,
    candidatePredictionScope: 'finalRecipeAfterJ4',
    scenarioApplicability: sourceResultBranch.applicability,
    plan: structuredClone(input.plan),
    alphaChoices: structuredClone(input.alphaChoices),
    preservedBranch: structuredClone(preservedBranch),
    originAnnex: structuredClone(originAnnex),
    ...(originalProposalAnnex ? { procurementAnnex: {
      applicability: originalProposalAnnex.applicability,
      stock: structuredClone(originalProposalAnnex.stock),
      conditions: structuredClone(originalProposalAnnex.conditions),
    } } : {}),
    ...(candidateProgramAnnex ? { candidateProgramAnnex } : {}),
    ...(input.plan.futureProcurement ? { futureProcurement: structuredClone(input.plan.futureProcurement),
      conditions: [hopRecipeFutureProcurementCondition(input.plan.futureProcurement)] } : {}),
    readiness: structuredClone(finalReadiness),
  };
  const previewBody: Omit<HopV55FullRecipeCopyPreview, 'reference'> = {
    format: HOP_V55_FULL_RECIPE_COPY_FORMAT,
    sourceRecipeId: source.id,
    sourceRecipeReference: hopDecisionReference(source),
    scenarioId: sourceFresh.scenarioId,
    snapshotReference: sourceFresh.reference,
    branchId: sourceResultBranch.id,
    branchReference: sourceResultBranch.reference,
    candidateSnapshotReference: finalCandidateForecast.result.reference,
    candidateBranchReference: finalCandidateForecast.branch.reference,
    candidatePredictionScope: 'finalRecipeAfterJ4',
    requestSnapshot: structuredClone(input.requestSnapshot),
    candidateRequestSnapshot: finalCandidateForecast.request,
    plan: structuredClone(input.plan),
    alphaChoices: structuredClone(input.alphaChoices),
    candidate: structuredClone(candidate),
    ...(hopPreview ? { hopPreview: structuredClone(hopPreview) } : {}),
    ...(input.plan.futureProcurement ? { futureProcurement: structuredClone(input.plan.futureProcurement),
      conditions: [hopRecipeFutureProcurementCondition(input.plan.futureProcurement)] } : {}),
    readiness: finalReadiness,
    receipt,
    preservedBranch: structuredClone(preservedBranch),
    ...(candidateProgramAnnex ? { candidateProgramAnnex } : {}),
    originAnnex: structuredClone(originAnnex),
    preservedScope: 'hypothesisNotPerformed',
  };
  const reference = hopDecisionReference(previewBody);
  return { status: 'ready', preview: { ...previewBody, reference } };
}

/** Preview a typed full-recipe candidate against the current recipe, catalogue and scenario. */
export function previewHopV55FullRecipeCopy(input: {
  result: BrewingScenarioResult;
  branchId: string;
  context: BrewerContext;
  plan: HopV55FullRecipeCopyPlan;
  alphaChoices?: Record<string, HopRecipeAlphaChoice>;
  originAnnex?: HopV55FullRecipeCopyOriginAnnex;
}): HopV55FullRecipeCopyPreviewResult {
  try {
    assertBrewingScenarioResult(input.result);
  } catch (error) {
    return blocked(`Le résultat fourni n’est pas un snapshot de scénario valide: ${(error as Error).message}`, true);
  }
  if (input.result.requestSnapshot.baseline.kind !== 'recipe') {
    return blocked('Seul un scénario lié à une recette courante peut alimenter une copie Recipe complète.', true);
  }
  return previewFromRequest({ requestSnapshot: input.result.requestSnapshot, branchId: input.branchId,
    context: input.context, plan: structuredClone(input.plan), alphaChoices: structuredClone(input.alphaChoices ?? {}),
    ...(input.originAnnex ? { originAnnex: structuredClone(input.originAnnex) } : {}),
    expectedSnapshotReference: input.result.reference,
    expectedBranchReference: input.result.branches.find(row => row.id === input.branchId)?.reference });
}

function previewIntegrityError(preview: HopV55FullRecipeCopyPreview): string | undefined {
  if (preview.format !== HOP_V55_FULL_RECIPE_COPY_FORMAT || !preview.reference) return 'Format d’aperçu de copie complète non reconnu.';
  const { reference, ...payload } = preview;
  if (hopDecisionReference(payload) !== reference) return 'L’aperçu de copie complète a changé depuis sa confirmation; le recalculer.';
  if (preview.receipt.format !== HOP_V55_FULL_RECIPE_COPY_FORMAT || preview.receipt.scope !== 'localDraft'
    || preview.readiness.localCopy !== 'ready' || preview.readiness.saveConfirmed) {
    return 'Le reçu local de copie complète est incohérent.';
  }
  return undefined;
}

function receiptIntegrityReference(receipt: Omit<HopV55FullRecipeCopyReceipt, 'integritySeal'>
  | HopV55FullRecipeCopyReceipt): string {
  const { integritySeal: _integritySeal, ...body } = receipt as HopV55FullRecipeCopyReceipt;
  return hopDecisionReference({ format: HOP_V55_FULL_RECIPE_COPY_INTEGRITY_FORMAT, receipt: body });
}

function sealCopyReceipt(receipt: Omit<HopV55FullRecipeCopyReceipt, 'integritySeal'>): HopV55FullRecipeCopyReceipt {
  return { ...receipt, integritySeal: { format: HOP_V55_FULL_RECIPE_COPY_INTEGRITY_FORMAT,
    reference: receiptIntegrityReference(receipt) } };
}

/** Read a persisted receipt structurally. This does not load context or rerun any engine. */
export function readHopV55FullRecipeCopyReceipt(value: unknown): HopV55FullRecipeCopyReceiptReadResult {
  const legacy = isRecord(value) && value.format === HOP_V55_FULL_RECIPE_COPY_LEGACY_FORMAT;
  const allowed = legacy
    ? ['format', 'scope', 'copyId', 'createdAt', 'sourceRecipeId', 'scenarioId', 'snapshotReference', 'branchId', 'branchReference',
      'candidateSnapshotReference', 'candidateBranchReference', 'scenarioApplicability', 'plan', 'alphaChoices', 'preservedBranch',
      'procurementAnnex', 'futureProcurement', 'conditions', 'readiness']
    : ['format', 'scope', 'copyId', 'createdAt', 'sourceRecipeId', 'scenarioId', 'snapshotReference', 'branchId', 'branchReference',
      'candidateSnapshotReference', 'candidateBranchReference', 'candidatePredictionScope', 'scenarioApplicability', 'plan', 'alphaChoices',
      'preservedBranch', 'procurementAnnex', 'candidateProgramAnnex', 'originAnnex', 'futureProcurement', 'conditions', 'readiness',
      'previewReference', 'finalRecipe', 'finalRecipeReference', 'integritySeal'];
  const issue = unknownKeys(value, allowed, 'Reçu de copie complète');
  if (issue) return { status: 'invalid', reason: issue };
  const receipt = value as HopV55FullRecipeCopyReceipt | HopV55FullRecipeCopyReceiptV1;
  if (receipt.format !== (legacy ? HOP_V55_FULL_RECIPE_COPY_LEGACY_FORMAT : HOP_V55_FULL_RECIPE_COPY_FORMAT)
    || receipt.scope !== 'localDraft'
    || !hasText(receipt.sourceRecipeId) || !hasText(receipt.scenarioId) || !hasText(receipt.snapshotReference)
    || !hasText(receipt.branchId) || !hasText(receipt.branchReference)
    || !hasText(receipt.candidateSnapshotReference) || !hasText(receipt.candidateBranchReference)) {
    return { status: 'invalid', reason: 'Format, portée ou référence du reçu invalide.' };
  }
  if (!legacy && (receipt as HopV55FullRecipeCopyReceipt).candidatePredictionScope !== 'finalRecipeAfterJ4') {
    return { status: 'invalid', reason: 'La portée des références de la recette finale est inconnue.' };
  }
  if (!['available', 'conditional', 'unavailable', 'hypotheticalOnly'].includes(receipt.scenarioApplicability)) {
    return { status: 'invalid', reason: 'Applicabilité historique du reçu inconnue.' };
  }
  const planIssue = copyPlanShapeError(receipt.plan);
  if (planIssue || receipt.plan.branchId !== receipt.branchId) return { status: 'invalid', reason: planIssue ?? 'Branche du plan et du reçu différente.' };
  if (receipt.futureProcurement !== undefined) {
    try { validateHopRecipeDraftOptions({ futureProcurement: receipt.futureProcurement }); }
    catch (error) { return { status: 'invalid', reason: (error as Error).message }; }
    if (!same(receipt.futureProcurement, receipt.plan.futureProcurement)
      || !same(receipt.conditions, [hopRecipeFutureProcurementCondition(receipt.futureProcurement)])) {
      return { status: 'invalid', reason: 'La déclaration d’approvisionnement ne correspond pas au plan ou à sa condition.' };
    }
  } else if (receipt.plan.futureProcurement !== undefined || receipt.conditions !== undefined) {
    return { status: 'invalid', reason: 'Le reçu a perdu la déclaration d’approvisionnement de son plan.' };
  }
  if (!isRecord(receipt.preservedBranch) || receipt.preservedBranch.id !== receipt.branchId
    || unknownKeys(receipt.preservedBranch, ['id', 'label', 'input', 'inputOverrides', 'programOverrides', 'programChanges',
      'materials', 'assumptions', 'analogies', 'modelOverrides', 'biologicalContext', 'biologicalInputs', 'culture', 'beerContext'],
    'Branche conservée')) return { status: 'invalid', reason: 'Branche conservée invalide ou étrangère au reçu.' };
  if (!isRecord(receipt.alphaChoices) || Object.entries(receipt.alphaChoices).some(([id, choice]) => !hasText(id)
    || !isRecord(choice) || !finite(choice.value) || !hasText(choice.reason))) {
    return { status: 'invalid', reason: 'Choix alpha conservés invalides.' };
  }
  const validateAnnex = (annex: unknown, label: string): string | undefined => {
    if (annex === undefined) return undefined;
    const annexIssue = unknownKeys(annex, ['applicability', 'stock', 'conditions'], label);
    if (annexIssue) return annexIssue;
    const value = annex as HopV55FullRecipeCopyProcurementAnnex;
    if (!['available', 'conditional', 'unavailable'].includes(value.applicability)
      || !Array.isArray(value.stock) || !Array.isArray(value.conditions) || !value.conditions.every(hasText)
      || value.stock.some(row => !isRecord(row) || !hasText(row.materialId)
        || !['available', 'unknown', 'insufficient', 'referenceOnly'].includes(row.status)
        || !(row.neededGrams === null || finite(row.neededGrams) && row.neededGrams >= 0)
        || !(row.availableGrams === null || finite(row.availableGrams) && row.availableGrams >= 0))) {
      return `${label} incohérente.`;
    }
    return undefined;
  };
  const proposalIssue = validateAnnex(receipt.procurementAnnex, 'Annexe de proposition');
  if (proposalIssue) return { status: 'invalid', reason: proposalIssue };
  if (!legacy) {
    const candidateProgramIssue = validateAnnex((receipt as HopV55FullRecipeCopyReceipt).candidateProgramAnnex, 'Programme final de la recette');
    if (candidateProgramIssue) return { status: 'invalid', reason: candidateProgramIssue };
  }
  if (!legacy && (receipt as HopV55FullRecipeCopyReceipt).originAnnex !== undefined) {
    const origin = (receipt as HopV55FullRecipeCopyReceipt).originAnnex!;
    const originIssue = unknownKeys(origin, ['scenarioId', 'snapshotReference', 'branchId', 'branchReference', 'scenarioApplicability',
      'requestBranch', 'programProposal'], 'Annexe du scénario antérieur');
    const branchIssue = unknownKeys(origin.requestBranch, ['id', 'label', 'input', 'inputOverrides', 'programOverrides', 'programChanges',
      'materials', 'assumptions', 'analogies', 'modelOverrides', 'biologicalContext', 'biologicalInputs', 'culture', 'beerContext'],
    'Branche J5 antérieure');
    if (originIssue || branchIssue || !hasText(origin.scenarioId) || !hasText(origin.snapshotReference)
      || !hasText(origin.branchId) || !hasText(origin.branchReference) || origin.requestBranch.id !== origin.branchId
      || !['available', 'conditional', 'unavailable', 'hypotheticalOnly'].includes(origin.scenarioApplicability)) {
      return { status: 'invalid', reason: originIssue ?? branchIssue ?? 'Annexe du scénario antérieur incohérente.' };
    }
  }
  if (!isRecord(receipt.readiness) || receipt.readiness.localCopy !== 'ready'
    || !['readyToSave', 'invalid'].includes(receipt.readiness.save)
    || !['ready', 'incomplete', 'invalid'].includes(receipt.readiness.brew)
    || receipt.readiness.saveConfirmed !== false || !Array.isArray(receipt.readiness.invalid)
    || !Array.isArray(receipt.readiness.missing)) {
    return { status: 'invalid', reason: 'États de préparation du reçu incohérents.' };
  }
  const hasCopyId = receipt.copyId !== undefined, hasCreatedAt = receipt.createdAt !== undefined;
  if (hasCopyId !== hasCreatedAt || hasCopyId && (!safeHostId(receipt.copyId) || !hasText(receipt.createdAt)
    || !Number.isFinite(Date.parse(receipt.createdAt)))) {
    return { status: 'invalid', reason: 'Identité ou date de copie du reçu invalide.' };
  }
  if (legacy) return { status: 'legacyReadOnly', qualification: 'unsealedHistoricalV1',
    receipt: structuredClone(receipt as HopV55FullRecipeCopyReceiptV1),
    reason: 'Ce reçu historique v1 est conservé sans modification. Il ne porte pas de sceau reliant le plan et le Recipe; il est lisible mais non certifiable pour une nouvelle écriture.' };

  const sealed = receipt as HopV55FullRecipeCopyReceipt;
  if (!hasText(sealed.copyId) || !hasText(sealed.createdAt) || !hasText(sealed.previewReference)
    || !sealed.finalRecipe || !hasText(sealed.finalRecipeReference) || sealed.finalRecipe.id !== sealed.copyId
    || sealed.finalRecipe.parentRecipeId !== sealed.sourceRecipeId
    || sealed.finalRecipe.batchRef !== undefined || sealed.finalRecipe.archivedAt !== undefined
    || sealed.finalRecipeReference !== hopDecisionReference(sealed.finalRecipe)) {
    return { status: 'invalid', reason: 'Le Recipe final, son identité ou son empreinte ne correspond pas au reçu.' };
  }
  if (!isRecord(sealed.integritySeal) || unknownKeys(sealed.integritySeal, ['format', 'reference'], 'Sceau du reçu')
    || sealed.integritySeal.format !== HOP_V55_FULL_RECIPE_COPY_INTEGRITY_FORMAT
    || sealed.integritySeal.reference !== receiptIntegrityReference(sealed)) {
    return { status: 'invalid', reason: 'Le sceau du reçu ne correspond plus au plan, au Recipe ou à ses références.' };
  }
  return { status: 'available', receipt: structuredClone(sealed) };
}

/** Revalidates the entire preview, then returns a detached local Recipe copy. No persistence is performed. */
export function applyHopV55FullRecipeCopy(input: HopV55FullRecipeCopyApplyInput): HopV55FullRecipeCopyApplyResult {
  const integrityError = previewIntegrityError(input.preview);
  if (integrityError) return applyBlocked(integrityError, true);
  const source = currentSourceRecipe(input.context);
  if (!source || source.id !== input.preview.sourceRecipeId
    || hopDecisionReference(source) !== input.preview.sourceRecipeReference) {
    return applyBlocked('La recette source a changé depuis l’aperçu. Refaire l’aperçu avant de choisir l’identifiant de copie.', true);
  }
  const currentPreview = previewFromRequest({ requestSnapshot: input.preview.requestSnapshot,
    branchId: input.preview.branchId, context: input.context, plan: structuredClone(input.preview.plan),
    alphaChoices: structuredClone(input.preview.alphaChoices), ...(input.preview.originAnnex ? { originAnnex: structuredClone(input.preview.originAnnex) } : {}),
    expectedSnapshotReference: input.preview.snapshotReference,
    expectedBranchReference: input.preview.branchReference });
  if (currentPreview.status === 'needsRecompute') return currentPreview;
  if (currentPreview.status !== 'ready') {
    return applyBlocked(currentPreview.status === 'blocked' ? currentPreview.reason
      : currentPreview.status === 'needsSelection' ? currentPreview.reasons.join(' ')
        : currentPreview.reasons.join(' '), currentPreview.status === 'blocked' ? currentPreview.recompute : true);
  }
  if (currentPreview.preview.reference !== input.preview.reference) {
    return applyBlocked('La recette candidate, les références ou la prévision J4 diffèrent de l’aperçu confirmé; créer un nouvel aperçu.', true);
  }
  if (!hasText(input.createdAt) || !Number.isFinite(Date.parse(input.createdAt))) return applyBlocked('La date de création fournie est invalide.');

  let copyId: string | undefined;
  try {
    copyId = input.createCopyId ? input.createCopyId() : input.copyId;
  } catch (error) {
    return applyBlocked(`L’hôte n’a pas pu attribuer l’identifiant stable de copie: ${(error as Error).message}`);
  }
  if (!safeHostId(copyId) || copyId === source.id) return applyBlocked('L’identifiant fourni doit être non vide, sûr et différent de la recette source.');

  const copiedRecipe: Recipe = { ...structuredClone(currentPreview.preview.candidate), id: copyId,
    parentRecipeId: source.id, favorite: false };
  delete copiedRecipe.batchRef;
  delete copiedRecipe.archivedAt;
  const copy: HopV55Copy = {
    id: copyId,
    recipe: copiedRecipe,
    sourceRecipeId: source.id,
    previewReference: currentPreview.preview.reference,
    scenarioId: currentPreview.preview.scenarioId,
    snapshotReference: currentPreview.preview.snapshotReference,
    branchId: currentPreview.preview.branchId,
    branchReference: currentPreview.preview.branchReference,
    createdAt: input.createdAt,
    scope: 'local',
  };
  const receipt = sealCopyReceipt({ ...structuredClone(currentPreview.preview.receipt), format: HOP_V55_FULL_RECIPE_COPY_FORMAT,
    copyId, createdAt: input.createdAt, previewReference: currentPreview.preview.reference,
    finalRecipe: structuredClone(copiedRecipe), finalRecipeReference: hopDecisionReference(copiedRecipe) });
  return { status: 'ready', copy, receipt };
}
