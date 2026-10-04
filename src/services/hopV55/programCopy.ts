import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopRecipeInput } from '../../../functions/src/hopRecipePrediction';
import {
  assertBrewingScenarioRequest,
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
import { applyHopProgramProposal, programFingerprint } from '../../domain/hopDecision/programs';
import type { HopDecisionProgram, HopProgramProposal } from '../../domain/hopDecision/types';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';

export const HOP_V55_PROGRAM_COPY_FORMAT = 'hop-v55-program-copy-v1' as const;
export const HOP_V55_PROGRAM_COPY_PREVIEW_FORMAT = 'hop-v55-program-copy-preview-v1' as const;

/** Content carried by both the transient preview and its detached local copy. */
export interface HopV55ProgramCopyPayload {
  label: string;
  sourceProgramId: string;
  batchId?: string;
  contextReference: string;
  scenarioId: string;
  snapshotReference: string;
  branchId: string;
  branchReference: string;
  programBefore: HopDecisionProgram;
  programAfter: HopDecisionProgram;
  /** Exact J5 input returned by the freshly recomputed scenario branch. */
  inputAfter: HopRecipeInput;
  /** Exact J5 dependency snapshot reference for this branch. */
  sourceRuntimeReference: string;
}

export interface HopV55ProgramCopy extends HopV55ProgramCopyPayload {
  format: typeof HOP_V55_PROGRAM_COPY_FORMAT;
  id: string;
  previewReference: string;
  createdAt: string;
  scope: 'local';
}

export interface HopV55ProgramCopyPreview extends HopV55ProgramCopyPayload {
  format: typeof HOP_V55_PROGRAM_COPY_PREVIEW_FORMAT;
  /** Deterministic content reference; freshness still requires a live re-simulation. */
  reference: string;
  /** Kept so application can rerun the exact scenario request against today's context. */
  requestSnapshot: BrewingScenarioRequest;
}

export type HopV55ProgramCopyPreviewResult =
  | { status: 'ready'; preview: HopV55ProgramCopyPreview }
  | { status: 'blocked'; reason: string; recompute: boolean };

export type HopV55ProgramCopyApplyResult =
  | { status: 'ready'; copy: HopV55ProgramCopy }
  | { status: 'blocked'; reason: string; recompute: boolean };

interface RecomputeProgramCopyInput {
  requestSnapshot: BrewingScenarioRequest;
  branchId: string;
  context: BrewerContext;
  expectedSnapshotReference?: string;
  expectedBranchReference?: string;
}

const blocked = (reason: string, recompute = false): HopV55ProgramCopyPreviewResult => ({ status: 'blocked', reason, recompute });
const applyBlocked = (reason: string, recompute = false): HopV55ProgramCopyApplyResult => ({ status: 'blocked', reason, recompute });
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const sameContent = (left: unknown, right: unknown) => hopDecisionReference(left) === hopDecisionReference(right);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const safeId = (value: unknown): value is string => text(value) && value.length <= 120 && !/[\\/]/.test(value)
  && !/^__.*__$/.test(value) && !['.', '..', 'constructor', 'prototype'].includes(value);
const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)
  && Number.isFinite(Date.parse(value));

/** Verifiable hash of the business payload shared by preview and copy. */
export function hopV55ProgramCopyReference(value: HopV55ProgramCopyPayload): string {
  return hopAdviceContentReference('hop-v55-program-copy-payload-v1', value);
}

function copyPayload(value: HopV55ProgramCopy | HopV55ProgramCopyPreview): HopV55ProgramCopyPayload {
  return {
    label: value.label,
    sourceProgramId: value.sourceProgramId,
    ...(value.batchId ? { batchId: value.batchId } : {}),
    contextReference: value.contextReference,
    scenarioId: value.scenarioId,
    snapshotReference: value.snapshotReference,
    branchId: value.branchId,
    branchReference: value.branchReference,
    programBefore: value.programBefore,
    programAfter: value.programAfter,
    inputAfter: value.inputAfter,
    sourceRuntimeReference: value.sourceRuntimeReference,
  };
}

function performedAdditions(program: HopDecisionProgram) {
  return program.additions.filter(addition => addition.status === 'performed');
}

function branchScopeError(requestBranch: BrewingScenarioBranchRequest, branch: BrewingScenarioBranchResult,
  context: ReturnType<typeof prepareBrewingScenarioContext>): string | undefined {
  if (branch.applicability !== 'available' && branch.applicability !== 'conditional') {
    return 'La branche entière est hypothétique ou indisponible; son programme n’est pas applicable au programme futur courant.';
  }
  if (!branch.programProposal) return 'La branche ne contient pas de proposition J1 à copier.';
  if (branch.programProposal.applicability !== 'available' && branch.programProposal.applicability !== 'conditional') {
    return 'J1 a classé le programme comme indisponible. Aucun achat futur n’est supposé par cette copie.';
  }
  if (branch.programProposal.stock.some(line => line.status === 'insufficient' || line.status === 'referenceOnly')) {
    return 'Un ingrédient est insuffisant ou documentaire, sans choix explicite d’approvisionnement futur; aucune copie n’est créée.';
  }
  if (!requestBranch.programChanges?.length || !branch.programProposal.changes.length) {
    return 'La branche ne comporte aucun changement J1 à enregistrer comme programme futur.';
  }
  if (requestBranch.input !== undefined || requestBranch.inputOverrides !== undefined || requestBranch.programOverrides !== undefined) {
    return 'La branche ajoute un changement d’entrée ou de programme hors J1. Ce raccord copie uniquement le programme houblon, sans volume, levure ni autre contexte nouveau.';
  }
  if (requestBranch.biologicalInputs?.length) return 'Les contributions biologiques restent dans le snapshot de scénario et ne deviennent pas des opérations du programme.';

  const current = context.runtime.current;
  if (requestBranch.culture !== undefined && !sameContent(requestBranch.culture, current?.culture ?? null)) {
    return 'La branche remplace la culture du brassin. Elle reste une hypothèse de scénario, pas une ligne du programme futur.';
  }
  if (requestBranch.beerContext !== undefined && !sameContent(requestBranch.beerContext, current?.beerContext ?? null)) {
    return 'La branche remplace le contexte de bière; ce contexte est conservé par le snapshot, pas appliqué au programme houblon.';
  }
  if (requestBranch.biologicalContext !== undefined
    && !sameContent(requestBranch.biologicalContext, current?.biologicalContext ?? context.runtime.biologicalContext ?? null)) {
    return 'La branche remplace le contexte biologique; il reste dans le snapshot de scénario et n’est pas un acte du programme.';
  }

  const hopMaterialOutsideRuntime = (requestBranch.materials?.hops ?? []).some(candidate =>
    !context.runtime.materials.some(currentMaterial => currentMaterial.id === candidate.id && sameContent(currentMaterial, candidate)));
  const yeastOutsideRuntime = (requestBranch.materials?.yeasts ?? []).some(candidate =>
    !context.runtime.engineData.knowledge.some(currentKnowledge => currentKnowledge.kind === 'yeast'
      && currentKnowledge.id === candidate.id && sameContent(currentKnowledge, candidate)));
  if (hopMaterialOutsideRuntime || yeastOutsideRuntime) {
    return 'La branche apporte une matière hypothétique hors des références actuelles chargées. Recharge/qualifie la matière avant une copie.';
  }

  const currentProgram = current?.program;
  if (!currentProgram || !context.binding) return 'Le programme courant n’est pas lié; aucune copie J1 ne peut être vérifiée.';
  if (!branch.program || branch.program.stage !== currentProgram.stage || branch.program.id !== currentProgram.id) {
    return 'La branche ne conserve pas l’identité et le stade réels du programme source.';
  }
  if (branch.programProposal.baseline !== programFingerprint(currentProgram)) {
    return 'La proposition J1 ne part pas de l’empreinte exacte du programme courant.';
  }
  if (!sameContent(branch.programProposal.changes, requestBranch.programChanges)) {
    return 'Les changements du snapshot ne correspondent pas à la proposition J1 reçue.';
  }
  if (!sameContent(performedAdditions(currentProgram), performedAdditions(branch.program))) {
    return 'La copie modifierait un ajout déjà effectué; les faits réalisés restent intacts.';
  }
  const expectedPerformed = performedAdditions(currentProgram).map(row => row.id).sort();
  const branchPerformed = [...branch.performedAdditionIds].sort();
  if (!sameContent(expectedPerformed, branchPerformed)) return 'Les identités des ajouts effectués diffèrent entre la source et la branche.';
  return undefined;
}

function prepareCurrentCopy(input: RecomputeProgramCopyInput): HopV55ProgramCopyPreviewResult {
  const baseline = input.requestSnapshot.baseline;
  if (baseline.kind !== 'recipe') return blocked('Seul un scénario lié à une recette réelle peut produire une copie de programme J1.', true);
  let prepared: ReturnType<typeof prepareBrewingScenarioContext>;
  let sourceContextReference: string;
  try {
    prepared = prepareBrewingScenarioContext(input.context);
    const current = prepared.runtime.current;
    if (!current?.program || !prepared.binding) return blocked('Aucun programme réel n’est lié au contexte courant. Une hypothèse seule ne crée pas un programme J1 applicable.', true);
    sourceContextReference = brewingScenarioCurrentReference(current);
    const programReference = programFingerprint(current.program);
    if (baseline.recipeReference !== current.recipeReference || baseline.inputReference !== current.inputReference
      || baseline.programReference !== programReference || baseline.contextReference !== sourceContextReference) {
      return blocked('La recette, le programme, le journal ou le contexte a changé depuis le scénario; recalculer avant la copie.', true);
    }
    if (programFingerprint(prepared.binding.program) !== programReference) {
      return blocked('La liaison J1 ne correspond pas au programme réel courant.', true);
    }
  } catch (error) {
    return blocked(`Le contexte de programme courant ne peut pas être préparé: ${(error as Error).message}`, true);
  }

  let fresh: BrewingScenarioResult;
  try {
    assertBrewingScenarioRequest(input.requestSnapshot);
    fresh = simulateBrewingScenario(input.requestSnapshot, prepared!.runtime);
  } catch (error) {
    return blocked(`Le résultat ne peut pas être recalculé sur le programme et le journal courants: ${(error as Error).message}`, true);
  }
  if (input.expectedSnapshotReference && fresh.reference !== input.expectedSnapshotReference) {
    return blocked('Le snapshot archivé diffère du recalcul courant (programme, journal, matières ou moteurs); recalculer avant copie.', true);
  }
  const requestBranch = input.requestSnapshot.branches.find(row => row.id === input.branchId);
  const branch = fresh.branches.find(row => row.id === input.branchId);
  if (!requestBranch || !branch) return blocked('La branche est absente du scénario courant; recalculer avant copie.', true);
  if (input.expectedBranchReference && branch.reference !== input.expectedBranchReference) {
    return blocked('La référence de branche diffère du snapshot recalculé; aucune copie n’est permise.', true);
  }

  const scopeReason = branchScopeError(requestBranch, branch, prepared!);
  if (scopeReason) return blocked(scopeReason);
  const currentProgram = prepared!.runtime.current!.program!;
  let application;
  try {
    application = applyHopProgramProposal(currentProgram, branch.programProposal!, prepared!.runtime.materials);
  } catch (error) {
    return blocked(`J1 refuse l’application locale de la proposition: ${(error as Error).message}`);
  }
  if (!sameContent(application.before, currentProgram) || !sameContent(application.after, branch.programProposal!.program)
    || !branch.program || !sameContent(application.after, branch.program)) {
    return blocked('L’application J1 ne correspond pas au programme courant et à la branche recalculée.', true);
  }
  if (application.after.stage !== currentProgram.stage || application.after.id !== currentProgram.id) {
    return blocked('La copie ne peut pas changer le stade ni l’identité du programme source.', true);
  }
  if (!sameContent(performedAdditions(application.before), performedAdditions(application.after))) {
    return blocked('J1 a modifié un ajout effectué; le programme n’est pas copié.', true);
  }

  const payload: HopV55ProgramCopyPayload = {
    label: branch.label,
    sourceProgramId: application.before.id,
    ...(typeof input.context.batch?.id === 'string' ? { batchId: input.context.batch.id } : {}),
    contextReference: baseline.contextReference,
    scenarioId: fresh.scenarioId,
    snapshotReference: fresh.reference,
    branchId: branch.id,
    branchReference: branch.reference,
    programBefore: structuredClone(application.before),
    programAfter: structuredClone(application.after),
    inputAfter: structuredClone(branch.input),
    sourceRuntimeReference: branch.dependencySnapshot.reference,
  };
  const reference = hopV55ProgramCopyReference(payload);
  return { status: 'ready', preview: { ...payload, format: HOP_V55_PROGRAM_COPY_PREVIEW_FORMAT,
    reference, requestSnapshot: structuredClone(input.requestSnapshot) } };
}

/** Compute a separate local future-program draft from a freshly checked J5 branch. */
export function previewHopV55ProgramCopy(input: {
  result: BrewingScenarioResult;
  branchId: string;
  context: BrewerContext;
}): HopV55ProgramCopyPreviewResult {
  try {
    assertBrewingScenarioResult(input.result);
  } catch (error) {
    return blocked(`Le résultat fourni n’est pas un snapshot de scénario valide: ${(error as Error).message}`, true);
  }
  if (input.result.requestSnapshot.baseline.kind !== 'recipe') {
    return blocked('Seul un résultat lié au programme réel courant peut produire une copie de programme J1.', true);
  }
  return prepareCurrentCopy({ requestSnapshot: input.result.requestSnapshot, branchId: input.branchId,
    context: input.context, expectedSnapshotReference: input.result.reference,
    expectedBranchReference: input.result.branches.find(row => row.id === input.branchId)?.reference });
}

/** Recompute the same result and J1 application, then return a detached copy; writes no batch, journal or stock. */
export function applyHopV55ProgramCopy(input: {
  preview: HopV55ProgramCopyPreview;
  context: BrewerContext;
  copyId: string;
  createdAt: string;
}): HopV55ProgramCopyApplyResult {
  const { reference, ...previewBody } = input.preview;
  if (input.preview.format !== HOP_V55_PROGRAM_COPY_PREVIEW_FORMAT || !reference
    || hopV55ProgramCopyReference(copyPayload(input.preview)) !== reference) {
    return applyBlocked('Le contenu de l’aperçu de programme a changé; recalculer avant copie.', true);
  }
  const currentPreview = prepareCurrentCopy({ requestSnapshot: input.preview.requestSnapshot,
    branchId: input.preview.branchId, context: input.context, expectedSnapshotReference: input.preview.snapshotReference,
    expectedBranchReference: input.preview.branchReference });
  if (currentPreview.status === 'blocked') return applyBlocked(currentPreview.reason, currentPreview.recompute);
  if (currentPreview.preview.reference !== reference || !sameContent(currentPreview.preview, { ...previewBody, reference })) {
    return applyBlocked('Le programme, les entrées J5 ou les références diffèrent de l’aperçu confirmé; recalculer.', true);
  }

  if (!safeId(input.copyId) || input.copyId === currentPreview.preview.sourceProgramId) {
    return applyBlocked('L’identifiant du brouillon doit être stable, sûr et distinct du programme source.');
  }
  if (!validDate(input.createdAt)) return applyBlocked('La date de création fournie est invalide.');
  const copy: HopV55ProgramCopy = {
    ...copyPayload(currentPreview.preview),
    format: HOP_V55_PROGRAM_COPY_FORMAT,
    id: input.copyId,
    previewReference: reference,
    createdAt: input.createdAt,
    scope: 'local',
  };
  try { assertHopV55ProgramCopy(copy); }
  catch (error) { return applyBlocked(`Le brouillon local n’est pas cohérent: ${(error as Error).message}`, true); }
  return { status: 'ready', copy };
}

/** Structural and provenance check for a stored local program-copy record. */
export function assertHopV55ProgramCopy(value: unknown): asserts value is HopV55ProgramCopy {
  if (!object(value) || value.format !== HOP_V55_PROGRAM_COPY_FORMAT || value.scope !== 'local'
    || !safeId(value.id) || !text(value.label) || !text(value.sourceProgramId) || !text(value.contextReference)
    || !text(value.scenarioId) || !text(value.snapshotReference) || !text(value.branchId) || !text(value.branchReference)
    || !text(value.sourceRuntimeReference) || !text(value.previewReference) || !validDate(value.createdAt)
    || value.batchId !== undefined && !safeId(value.batchId)) {
    throw new Error('Copie locale de programme mal formée.');
  }
  const copy = value as unknown as HopV55ProgramCopy;
  programFingerprint(copy.programBefore);
  programFingerprint(copy.programAfter);
  if (copy.sourceProgramId !== copy.programBefore.id || copy.programAfter.id !== copy.sourceProgramId
    || copy.id === copy.sourceProgramId || copy.programAfter.stage !== copy.programBefore.stage
    || copy.programAfter.revision !== copy.programBefore.revision + 1
    || copy.programAfter.volumeL !== copy.programBefore.volumeL || copy.programAfter.wortGravity !== copy.programBefore.wortGravity
    || !sameContent(copy.programAfter.ibuModelContext ?? null, copy.programBefore.ibuModelContext ?? null)) {
    throw new Error('Identité ou contexte réel du programme source modifié dans la copie.');
  }
  if (!sameContent(performedAdditions(copy.programBefore), performedAdditions(copy.programAfter))) {
    throw new Error('La copie de programme modifie un ajout déjà effectué.');
  }
  if (hopV55ProgramCopyReference(copyPayload(copy)) !== copy.previewReference) {
    throw new Error('Référence de contenu de la copie de programme altérée.');
  }
}
