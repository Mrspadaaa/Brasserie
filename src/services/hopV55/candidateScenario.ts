import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { Recipe } from '../../types';
import {
  assertBrewingScenarioRequest,
  assertBrewingScenarioResult,
  buildBrewingScenarioRequest,
  brewingScenarioCurrentReference,
  brewingScenarioInputReference,
  simulateBrewingScenario,
  type BrewingScenarioBranchRequest,
  type BrewingScenarioRequest,
  type BrewingScenarioResult,
} from '../../domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopRecipeAlphaChoice } from '../../domain/hopDecision/recipePreview';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { programFingerprint } from '../../domain/hopDecision/programs';
import { validateHopRecipeDraftOptions } from '../../domain/hopDecision/recipeAdapter';
import {
  assertHopV55FullRecipeCopyPlan,
  HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT,
  type HopV55FullRecipeCopyPlan,
  type HopV55FullRecipeCopyOriginAnnex,
} from './fullRecipeCopy';

export interface HopV55FullRecipeCopyRecomputeIdentity {
  scenarioId: string;
  revision: number;
}

export const HOP_V55_FULL_RECIPE_COPY_RECOMPUTE_FORMAT = 'hop-v55-full-recipe-copy-recompute-v2' as const;

export interface HopV55FullRecipeCopyRecomputePayload {
  format: typeof HOP_V55_FULL_RECIPE_COPY_RECOMPUTE_FORMAT;
  /** Canonical content fingerprint over every field except this one. */
  contentReference: string;
  scenarioId: string;
  snapshotReference: string;
  branchReference: string;
  /** J5 result, always based on the fresh, physical source recipe. */
  branchId: string;
  /** New J5 result, always based on the fresh, physical source recipe. */
  result: BrewingScenarioResult;
  request: BrewingScenarioRequest;
  plan: HopV55FullRecipeCopyPlan;
  alphaChoices: Record<string, HopRecipeAlphaChoice>;
  /** Immutable origin pointers keep the superseded scenario available in the dossier. */
  supersedes: HopV55FullRecipeCopyOriginAnnex;
  reasons: string[];
}

export type HopV55FullRecipeCopyRecomputeResult =
  | { status: 'ready'; payload: HopV55FullRecipeCopyRecomputePayload }
  | { status: 'blocked'; reason: string };

export type HopV55FullRecipeCopyRecomputeReadResult =
  | { status: 'available'; payload: HopV55FullRecipeCopyRecomputePayload }
  | { status: 'invalid'; reason: string };

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const safeText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const onlyKeys = (value: Row, allowed: readonly string[], label: string): void => {
  const key = Object.keys(value).find(candidate => !allowed.includes(candidate));
  if (key) throw Error(`${label} : champ inconnu « ${key} ».`);
};

function recomputeContentReference(value: Omit<HopV55FullRecipeCopyRecomputePayload, 'contentReference'>): string {
  return hopAdviceContentReference(HOP_V55_FULL_RECIPE_COPY_RECOMPUTE_FORMAT, value);
}

function sealRecomputePayload(value: Omit<HopV55FullRecipeCopyRecomputePayload, 'contentReference'>): HopV55FullRecipeCopyRecomputePayload {
  return { ...value, contentReference: recomputeContentReference(value) };
}

/**
 * Strict read-only validation for a locally persisted recompute preparation.
 * It checks the sealed request/result and all linked identities without running J5.
 */
export function readHopV55FullRecipeCopyRecomputePayload(value: unknown): HopV55FullRecipeCopyRecomputeReadResult {
  try {
    if (!isRow(value)) throw Error('Payload de reprise de copie complète absent.');
    onlyKeys(value, ['format', 'contentReference', 'scenarioId', 'snapshotReference', 'branchReference', 'branchId',
      'result', 'request', 'plan', 'alphaChoices', 'supersedes', 'reasons'], 'Payload de reprise');
    if (value.format !== HOP_V55_FULL_RECIPE_COPY_RECOMPUTE_FORMAT) {
      throw Error('Version de reprise inconnue ou payload historique non scellé; reconstruire une nouvelle prévision.');
    }
    assertBrewingScenarioRequest(value.request);
    assertBrewingScenarioResult(value.result);
    assertHopV55FullRecipeCopyPlan(value.plan);
    if (value.plan.branchId !== value.branchId) throw Error('Le plan de reprise ne correspond pas à la branche conservée.');
    if (!isRow(value.alphaChoices) || Object.entries(value.alphaChoices).some(([id, choice]) => {
      if (!safeText(id) || !isRow(choice)) return true;
      try { onlyKeys(choice, ['value', 'reason'], 'Choix alpha'); } catch { return true; }
      return typeof choice.value !== 'number' || !Number.isFinite(choice.value) || choice.value < 0 || choice.value > 100
        || !safeText(choice.reason);
    })) throw Error('Les choix alpha de reprise sont absents ou invalides.');
    if (!isRow(value.supersedes)) throw Error('Les références de la branche remplacée sont absentes.');
    onlyKeys(value.supersedes, ['scenarioId', 'snapshotReference', 'branchId', 'branchReference', 'scenarioApplicability',
      'requestBranch', 'programProposal'], 'Annexe de reprise');
    const annex = value.supersedes;
    if (!safeText(annex.scenarioId) || !safeText(annex.snapshotReference) || !safeText(annex.branchId)
      || !safeText(annex.branchReference) || annex.branchId !== value.branchId || !isRow(annex.requestBranch)
      || annex.requestBranch.id !== value.branchId
      || !['available', 'conditional', 'unavailable', 'hypotheticalOnly'].includes(annex.scenarioApplicability as string)) {
      throw Error('Les identités de l’annexe de reprise sont incohérentes.');
    }
    if (annex.programProposal !== undefined) {
      if (!isRow(annex.programProposal) || !isRow(annex.programProposal.program)) throw Error('La proposition J1 d’origine est invalide.');
      if (!safeText(annex.programProposal.baseline)
        || !['available', 'conditional', 'unavailable'].includes(annex.programProposal.applicability as string)) {
        throw Error('La référence ou l’état de la proposition J1 d’origine est invalide.');
      }
      programFingerprint(annex.programProposal.program as unknown as Parameters<typeof programFingerprint>[0]);
    }
    if (!Array.isArray(value.reasons) || value.reasons.some(reason => !safeText(reason))) {
      throw Error('Les raisons de la nouvelle prévision sont invalides.');
    }
    if (!safeText(value.scenarioId) || !safeText(value.snapshotReference) || !safeText(value.branchReference)
      || value.request.baseline.kind !== 'recipe'
      || value.request.scenarioId !== value.scenarioId || value.result.scenarioId !== value.scenarioId
      || value.request.revision !== value.result.revision
      || value.snapshotReference !== value.result.reference
      || value.result.inputReference !== brewingScenarioInputReference(value.request)
      || hopAdviceContentReference('hop-v55-recompute-request-link-v1', value.request)
        !== hopAdviceContentReference('hop-v55-recompute-request-link-v1', value.result.requestSnapshot)) {
      throw Error('Les références J5, la requête et le résultat ne désignent pas le même scénario exact.');
    }
    const requestBranch = value.request.branches.find(row => row.id === value.branchId);
    const resultBranch = value.result.branches.find(row => row.id === value.branchId);
    if (!requestBranch || !resultBranch || resultBranch.reference !== value.branchReference
      || value.plan.branchId !== value.branchId) {
      throw Error('La branche choisie ne correspond pas aux références scellées du résultat J5.');
    }
    assertBrewingScenarioRequest({ ...structuredClone(value.request), branches: [structuredClone(annex.requestBranch)] });
    if (value.plan.adoptHopProgram && hopAdviceContentReference('hop-v55-recompute-program-link-v1', requestBranch.programChanges ?? null)
      !== hopAdviceContentReference('hop-v55-recompute-program-link-v1', annex.requestBranch.programChanges ?? null)) {
      throw Error('Le programme repris ne correspond pas à la branche J1 conservée.');
    }
    if (!value.plan.adoptHopProgram && requestBranch.programChanges !== undefined) {
      throw Error('La branche J1 refusée ne doit pas être réintroduite dans la nouvelle prévision.');
    }
    if (value.plan.yeast && (resultBranch.input.yeastId !== value.plan.yeast.hopIndexId
      || value.plan.yeast.pitchTemperatureC !== undefined && resultBranch.input.pitchTempC !== value.plan.yeast.pitchTemperatureC
      || resultBranch.culture?.state !== 'single' || resultBranch.culture.members.length !== 1
      || resultBranch.culture.members[0].yeastId !== value.plan.yeast.hopIndexId)) {
      throw Error('La culture ou la cible choisie ne correspond pas à la branche J5 scellée.');
    }
    if (value.plan.fermentation && hopAdviceContentReference('hop-v55-recompute-fermentation-link-v1', resultBranch.input.fermentation)
      !== hopAdviceContentReference('hop-v55-recompute-fermentation-link-v1', value.plan.fermentation.map(step => ({
        kind: step.kind, name: step.name, tempC: step.tempC, days: step.days, ...(step.note !== undefined ? { note: step.note } : {}),
      })))) throw Error('Les phases du plan ne correspondent pas à la nouvelle prévision.');
    if (value.plan.style && (resultBranch.beerContext?.style?.role !== 'target'
      || resultBranch.beerContext.style.guideId !== value.plan.style.ref.guideId
      || resultBranch.beerContext.style.version !== value.plan.style.ref.version
      || resultBranch.beerContext.style.styleId !== value.plan.style.ref.styleId)) {
      throw Error('La référence de style du plan ne correspond pas à la nouvelle prévision.');
    }
    const selectedStyle = value.plan.style;
    if (selectedStyle && resultBranch.beerContext?.facts.some(fact => fact.field === 'style.name'
      && (fact.status === 'target' || fact.status === 'selected') && fact.value !== selectedStyle.name)) {
      throw Error('Le nom de style du plan contredit la nouvelle prévision.');
    }
    if (value.plan.volumeL !== undefined && (resultBranch.input.volumeL !== value.plan.volumeL
      || resultBranch.program?.volumeL !== value.plan.volumeL)) throw Error('Le volume du plan ne correspond pas à la nouvelle prévision.');
    const finalHopMasses = value.plan.finalHopMasses;
    if (finalHopMasses) {
      if (!resultBranch.program || finalHopMasses.length !== resultBranch.program.additions.length
        || resultBranch.program.additions.some(row => finalHopMasses.find(mass => mass.additionId === row.id)?.grams !== row.grams)) {
        throw Error('Les masses finales du plan ne correspondent pas au programme de la branche J5.');
      }
    }
    const targetUnits = { ogTarget: 'SG', fgTarget: 'SG', abvTarget: '% vol.', ibuTarget: 'IBU' } as const;
    for (const field of Object.keys(targetUnits) as Array<keyof typeof targetUnits>) {
      const selected = value.plan.targets?.[field];
      if (selected === undefined) continue;
      const matches = resultBranch.beerContext?.facts.filter(fact => fact.field === field && fact.status === 'target') ?? [];
      if (matches.length !== 1 || matches[0].value !== selected || matches[0].unit !== targetUnits[field]) {
        throw Error(`La cible ${field} ne correspond pas à la nouvelle prévision.`);
      }
    }
    for (const [id, range] of Object.entries(value.plan.targets?.hopAromaTarget ?? {})) {
      if (hopAdviceContentReference('hop-v55-recompute-target-link-v1', value.request.target?.[id] ?? null)
        !== hopAdviceContentReference('hop-v55-recompute-target-link-v1', range)) {
        throw Error(`La cible aromatique ${id} ne correspond pas à la nouvelle requête.`);
      }
    }
    const additionIds = new Set(resultBranch.program?.additions.map(row => row.id) ?? []);
    if (Object.keys(value.alphaChoices).some(id => !additionIds.has(id))) {
      throw Error('Un choix alpha ne correspond à aucun ajout de la branche J5.');
    }
    const { contentReference, ...body } = value as unknown as HopV55FullRecipeCopyRecomputePayload;
    if (!safeText(contentReference) || contentReference !== recomputeContentReference(body)) {
      throw Error('Le payload de reprise a été modifié après sa création.');
    }
    return { status: 'available', payload: value as unknown as HopV55FullRecipeCopyRecomputePayload };
  } catch (error) {
    return { status: 'invalid', reason: (error as Error).message || 'Payload de reprise invalide.' };
  }
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function planningContextError(context: BrewerContext, prepared: ReturnType<typeof prepareBrewingScenarioContext>): string | undefined {
  if (context.batch && context.batch.status !== 'planifie') {
    return 'La nouvelle prévision doit rester rattachée à une recette planifiée, sans brassin commencé.';
  }
  if (Number.isFinite(context.journal?.startedAt) || Number.isFinite(context.journal?.pitchedAt)
    || Object.values((context.journal?.additions ?? {}) as Record<string, { doneAt?: unknown } | undefined>)
      .some(row => typeof row?.doneAt === 'number' && Number.isFinite(row.doneAt))) {
    return 'Le journal contient un fait déjà réalisé; le scénario de copie ne peut pas réécrire le brassin.';
  }
  if (prepared.runtime.current?.performedAdditionIds?.length
    || prepared.binding?.program.additions.some(row => row.status === 'performed')) {
    return 'Une ligne du programme a déjà été réalisée; la nouvelle prévision doit rester un scénario sans écriture.';
  }
  if (prepared.binding && prepared.binding.program.stage !== 'planning') {
    return 'Le programme n’est plus planifié; une copie ne peut pas modifier la conduite en cours.';
  }
  return undefined;
}

function addAssumptionId(request: BrewingScenarioRequest, branch: BrewingScenarioBranchRequest, root: string): string {
  const used = new Set([...request.assumptions, ...branch.assumptions].map(row => row.id));
  let id = root.slice(0, 112);
  let index = 2;
  while (used.has(id)) id = `${root.slice(0, 108)}-${index++}`;
  return id;
}

function needsNewCultureRangeCleared(
  candidateContext: BrewerContext,
  branch: BrewingScenarioBranchRequest,
  priorBranch: BrewingScenarioResult['branches'][number],
  input: { context: BrewerContext; plan: HopV55FullRecipeCopyPlan },
): { required: boolean; reason?: string } {
  if (!input.plan.yeast) return { required: false };
  let candidatePrepared: ReturnType<typeof prepareBrewingScenarioContext>;
  try { candidatePrepared = prepareBrewingScenarioContext(candidateContext); }
  catch (error) { return { required: false, reason: `La candidate de levure ne peut pas être préparée: ${(error as Error).message}` }; }
  const candidateTemperature = candidatePrepared.runtime.current?.input.yeastTemperature;
  const selectedCultureId = input.plan.yeast.hopIndexId;
  const sourceCultureId = input.context.recipe?.yeast?.hopIndexId;
  const newCultureSelected = selectedCultureId !== sourceCultureId;
  const hadOldRange = branch.inputOverrides?.yeastTemperature != null
    || priorBranch.input.yeastTemperature != null
    || Number.isFinite(input.context.recipe?.yeast?.fermTempMinC)
    || Number.isFinite(input.context.recipe?.yeast?.fermTempMaxC);
  const losesRange = candidateTemperature == null && hadOldRange;
  if (!newCultureSelected && !losesRange) return { required: false };
  if (!losesRange) return { required: false };
  if (!input.plan.fermentation?.length) return { required: true,
    reason: 'La nouvelle culture ne porte pas l’ancienne plage de conduite. Choisis des paliers explicites avant de demander une nouvelle prévision.' };
  // The old range is deliberately not transferred as a technical fact. The scenario contract
  // supports an explicit null override, which preserves unknown status while keeping the phases.
  return { required: true };
}

function candidatePlanError(candidate: Recipe, context: BrewerContext, plan: HopV55FullRecipeCopyPlan): string | undefined {
  const expectedName = plan.recipeName ?? context.recipe?.name;
  if (expectedName !== undefined && candidate.name !== expectedName) return 'Le nom de recette ne correspond plus au choix conservé.';
  if (plan.volumeL !== undefined && candidate.volumeL !== plan.volumeL) return 'Le volume candidat diffère du volume explicitement choisi.';
  if (plan.yeast) {
    const yeast = candidate.yeast;
    if (yeast.hopIndexId !== plan.yeast.hopIndexId || yeast.name !== plan.yeast.name
      || yeast.qty !== plan.yeast.quantity.value || yeast.unit !== plan.yeast.quantity.unit
      || yeast.form !== plan.yeast.form || yeast.strain !== plan.yeast.strain
      || yeast.lab !== plan.yeast.product?.manufacturer
      || yeast.pitchTempC !== plan.yeast.pitchTemperatureC) {
      return 'La candidate ne correspond plus à l’identité, la quantité ou la cible de levure choisie.';
    }
  }
  if (plan.fermentation && !same(candidate.fermentation, plan.fermentation)) {
    return 'Les paliers de la candidate diffèrent des consignes conservées.';
  }
  if (plan.style && (candidate.style !== plan.style.name || !same(candidate.styleRef, plan.style.ref))) {
    return 'Le style de la candidate diffère de la référence exacte choisie.';
  }
  for (const field of ['ogTarget', 'fgTarget', 'abvTarget', 'ibuTarget'] as const) {
    const expected = plan.targets?.[field];
    if (expected !== undefined && candidate[field] !== expected) return `La cible ${field} de la candidate diffère du choix conservé.`;
  }
  for (const [id, range] of Object.entries(plan.targets?.hopAromaTarget ?? {})) {
    if (!same(candidate.hopAromaTarget?.[id], range)) return `La cible aromatique ${id} diffère du choix conservé.`;
  }
  return undefined;
}

function clearOldCultureRange(request: BrewingScenarioRequest, branch: BrewingScenarioBranchRequest): void {
  branch.inputOverrides = { ...branch.inputOverrides, yeastTemperature: null };
  branch.assumptions = branch.assumptions.filter(row => row.path !== 'recipe.yeastTemperature');
  request.assumptions = request.assumptions.filter(row => row.path !== 'recipe.yeastTemperature');
  branch.assumptions.push({
    id: addAssumptionId(request, branch, `${request.scenarioId}-clear-old-yeast-range`),
    path: 'recipe.yeastTemperature',
    label: 'Ne pas transférer la plage de l’ancienne culture',
    status: 'selected',
    origin: 'userHypothesis',
    explanation: 'Les phases de conduite sélectionnées sont conservées; aucune plage technique ni température propre à la nouvelle culture n’est créée.',
    value: null,
  });
}

/**
 * Rebuilds one selected branch on a fresh recipe-backed baseline. It never promotes the
 * previous candidate to the physical baseline and never derives J1 operations from free-form
 * Recipe hop rows: stable addition IDs and exact operations must come from the saved branch.
 */
export function prepareHopV55FullRecipeCopyRecompute(input: {
  context: BrewerContext;
  result: BrewingScenarioResult;
  branchId: string;
  candidate: Recipe;
  plan: HopV55FullRecipeCopyPlan;
  alphaChoices: Record<string, HopRecipeAlphaChoice>;
  identity: HopV55FullRecipeCopyRecomputeIdentity;
  reasons: string[];
}): HopV55FullRecipeCopyRecomputeResult {
  try {
    assertBrewingScenarioResult(input.result);
    if (input.result.requestSnapshot.baseline.kind !== 'recipe') return { status: 'blocked',
      reason: 'La reprise exige le même type de scénario rattaché à une recette réelle.' };
    if (input.plan.format !== HOP_V55_FULL_RECIPE_COPY_PLAN_FORMAT || input.plan.branchId !== input.branchId) {
      return { status: 'blocked', reason: 'Le plan de copie ne correspond pas à la branche sélectionnée.' };
    }
    validateHopRecipeDraftOptions(input.plan.futureProcurement ? { futureProcurement: input.plan.futureProcurement } : {});
    if (!input.context.recipe || input.candidate.id !== input.context.recipe.id) {
      return { status: 'blocked', reason: 'La candidate ne provient plus de la recette source courante; aucun scénario de reprise n’est créé.' };
    }
    const candidateIssue = candidatePlanError(input.candidate, input.context, input.plan);
    if (candidateIssue) return { status: 'blocked', reason: candidateIssue };
    const previousRequestBranch = input.result.requestSnapshot.branches.find(row => row.id === input.branchId);
    const previousResultBranch = input.result.branches.find(row => row.id === input.branchId);
    if (!previousRequestBranch || !previousResultBranch) return { status: 'blocked',
      reason: 'La branche sélectionnée n’est plus présente dans le résultat historique.' };

    const prepared = prepareBrewingScenarioContext(input.context);
    const current = prepared.runtime.current;
    if (!current) return { status: 'blocked', reason: 'La recette source courante ne peut pas former une nouvelle base de prévision.' };
    const stageError = planningContextError(input.context, prepared);
    if (stageError) return { status: 'blocked', reason: stageError };
    if (input.plan.yeast && input.plan.yeast.pitchTemperatureC === undefined
      && input.candidate.yeast.pitchTempC === undefined && previousResultBranch.input.pitchTempC !== undefined) {
      return { status: 'blocked', reason: `La cible d’ensemencement du scénario (${previousResultBranch.input.pitchTempC} °C) n’a pas été choisie pour cette culture. Coche la reprise de cette cible, puis prévisualise à nouveau; elle ne sera pas transférée automatiquement.` };
    }
    if (!input.identity.scenarioId.trim() || !Number.isSafeInteger(input.identity.revision) || input.identity.revision < 0) {
      return { status: 'blocked', reason: 'La nouvelle identité de scénario est invalide.' };
    }

    const request = buildBrewingScenarioRequest({
      scenarioId: input.identity.scenarioId,
      revision: input.identity.revision,
      baseline: {
        kind: 'recipe', recipeReference: current.recipeReference, input: current.input,
        ...(current.program ? { program: current.program } : {}),
        contextReference: brewingScenarioCurrentReference(current),
      },
      target: {
        ...(input.result.requestSnapshot.target ?? {}),
        ...(input.plan.targets?.hopAromaTarget ?? {}),
      },
      assumptions: input.result.requestSnapshot.assumptions,
    });
    const branch = structuredClone(previousRequestBranch);
    const supersedes: HopV55FullRecipeCopyOriginAnnex = {
      scenarioId: input.result.scenarioId, snapshotReference: input.result.reference,
      branchId: previousResultBranch.id, branchReference: previousResultBranch.reference,
      scenarioApplicability: previousResultBranch.applicability,
      requestBranch: structuredClone(previousRequestBranch),
      ...(previousResultBranch.programProposal ? { programProposal: structuredClone(previousResultBranch.programProposal) } : {}),
    };
    if (!input.plan.adoptHopProgram && branch.programChanges?.length) {
      // The new J5 request describes the user's effective Recipe copy. The refused J1
      // proposal remains exact in `supersedes` for the new preview receipt's annex.
      delete branch.programChanges;
      branch.assumptions = branch.assumptions.filter(row => row.path !== 'program.changes');
    }
    const rangeUpdate = needsNewCultureRangeCleared({ ...structuredClone(input.context), recipe: structuredClone(input.candidate) },
      branch, previousResultBranch, input);
    if (rangeUpdate.reason) return { status: 'blocked', reason: rangeUpdate.reason };
    if (rangeUpdate.required) clearOldCultureRange(request, branch);
    request.branches = [branch];
    assertBrewingScenarioRequest(request);

    const result = simulateBrewingScenario(request, prepared.runtime);
    const nextBranch = result.branches.find(row => row.id === input.branchId);
    if (!nextBranch) return { status: 'blocked', reason: 'La nouvelle prévision ne contient pas la branche de reprise.' };
    if (input.plan.yeast && (nextBranch.input.yeastId !== input.plan.yeast.hopIndexId
      || nextBranch.culture?.state !== 'single' || nextBranch.culture.members.length !== 1
      || nextBranch.culture.members[0].yeastId !== input.plan.yeast.hopIndexId)) {
      return { status: 'blocked', reason: 'La nouvelle prévision ne retrouve pas exactement la culture choisie; vérifie les références chargées.' };
    }
    if (input.plan.yeast?.pitchTemperatureC !== undefined
      && nextBranch.input.pitchTempC !== input.plan.yeast.pitchTemperatureC) {
      return { status: 'blocked', reason: 'La nouvelle prévision ne conserve pas la cible d’ensemencement choisie.' };
    }
    if (input.plan.fermentation && !same(nextBranch.input.fermentation, input.plan.fermentation.map(step => ({
      kind: step.kind, name: step.name, tempC: step.tempC, days: step.days,
      ...(step.note !== undefined ? { note: step.note } : {}),
    })))) return { status: 'blocked', reason: 'Les phases de la nouvelle prévision diffèrent des consignes choisies.' };
    if (input.plan.style && (nextBranch.beerContext?.style?.role !== 'target'
      || nextBranch.beerContext.style.guideId !== input.plan.style.ref.guideId
      || nextBranch.beerContext.style.version !== input.plan.style.ref.version
      || nextBranch.beerContext.style.styleId !== input.plan.style.ref.styleId)) {
      return { status: 'blocked', reason: 'La référence exacte du style n’est pas conservée dans la nouvelle prévision.' };
    }
    if (input.plan.style && nextBranch.beerContext?.facts.some(fact => fact.field === 'style.name'
      && (fact.status === 'target' || fact.status === 'selected') && fact.value !== input.plan.style!.name)) {
      return { status: 'blocked', reason: 'Le nom de style résolu contredit la référence cible de la nouvelle prévision.' };
    }
    const targetUnits = { ogTarget: 'SG', fgTarget: 'SG', abvTarget: '% vol.', ibuTarget: 'IBU' } as const;
    for (const field of Object.keys(targetUnits) as Array<keyof typeof targetUnits>) {
      const target = input.plan.targets?.[field];
      if (target === undefined) continue;
      const matches = nextBranch.beerContext?.facts.filter(fact => fact.field === field && fact.status === 'target') ?? [];
      if (matches.length !== 1 || matches[0].value !== target || matches[0].unit !== targetUnits[field]) {
        return { status: 'blocked', reason: `La cible ${field} et son unité ne sont pas reprises exactement dans la nouvelle prévision.` };
      }
    }
    if (input.plan.volumeL !== undefined && (nextBranch.input.volumeL !== input.plan.volumeL
      || nextBranch.program?.volumeL !== input.plan.volumeL)) {
      return { status: 'blocked', reason: 'Le volume de la nouvelle prévision ne correspond pas au volume final choisi.' };
    }
    if (input.plan.adoptHopProgram && !nextBranch.programProposal) {
      return { status: 'blocked', reason: 'Le programme de houblon choisi n’a pas été reproposé par la nouvelle prévision.' };
    }
    if (input.plan.finalHopMasses) {
      const additions = nextBranch.program?.additions;
      if (!additions || additions.length !== input.plan.finalHopMasses.length
        || additions.some(row => input.plan.finalHopMasses!.find(mass => mass.additionId === row.id)?.grams !== row.grams)) {
        return { status: 'blocked', reason: 'Les masses de la nouvelle prévision ne correspondent plus aux identités exactes des ajouts choisis.' };
      }
    }
    if (input.plan.targets?.hopAromaTarget && Object.entries(input.plan.targets.hopAromaTarget)
      .some(([id, range]) => !same(request.target?.[id], range))) {
      return { status: 'blocked', reason: 'Une cible aromatique explicitement choisie manque à la nouvelle prévision.' };
    }

    const branchReference = nextBranch.reference;
    const payload = sealRecomputePayload({
      format: HOP_V55_FULL_RECIPE_COPY_RECOMPUTE_FORMAT,
      scenarioId: result.scenarioId, snapshotReference: result.reference, branchReference,
      result, request, branchId: input.branchId,
      plan: structuredClone(input.plan), alphaChoices: structuredClone(input.alphaChoices),
      supersedes,
      reasons: [...input.reasons],
    });
    const read = readHopV55FullRecipeCopyRecomputePayload(payload);
    if (read.status !== 'available') return { status: 'blocked', reason: `La reprise préparée ne passe pas sa propre validation hors moteur: ${read.reason}` };
    return { status: 'ready', payload: read.payload };
  } catch (error) {
    return { status: 'blocked', reason: `La nouvelle prévision ne peut pas reprendre ces choix sans perte: ${(error as Error).message}` };
  }
}
