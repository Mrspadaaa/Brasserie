import { answerHopDecision, type HopClassicDecisionAction as HopDecisionAction, type HopDecisionResponse } from './service';
import { hopDecisionReference } from './measurements';
import { createHopDecisionEvent, createHopDecisionEventV2, type HopDecisionEventCommand, type HopDecisionEventCommandV2, type HopDecisionContext,
  type HopDecisionObservationSnapshot, type HopDecisionPublicInput, type HopDecisionStudySnapshot, type HopDecisionStudySnapshotV2 } from './dossier';
import { applySelectedHopReplacement, type HopPlannerRequest, type HopPlannerSelection } from './planner';
import { applyHopPlannedRecipe, type HopPlannedRecipePreview } from './plannerRecipe';
import type { HopRecipeBinding, HopRecipeLike } from './recipeAdapter';

type PlanAction = Extract<HopDecisionAction, { kind: 'planReplacement' }>;
type EventIdentity = Pick<HopDecisionEventCommand, 'ownerKey' | 'dossierId' | 'eventId' | 'expectedRevision' | 'recordedAt'>;
type EventIdentityV2 = Pick<HopDecisionEventCommandV2, 'ownerKey' | 'dossierId' | 'eventId' | 'expectedRevision' | 'recordedAt'>;

/** Capture is an explicit new study action. Historical readers never call this function. */
export function captureHopDecisionStudy<A extends HopDecisionAction>(input: {
  request: HopDecisionPublicInput<A>;
  response: HopDecisionResponse<A['kind']>;
  context?: HopDecisionContext | null;
}): HopDecisionStudySnapshot<A['kind']> {
  if ((input.request?.action?.kind as string) === 'exploreStrategies') throw Error('Un conseil se capture avec le format de dossier 3.');
  const fresh = answerHopDecision(input.request);
  if (hopDecisionReference(fresh) !== hopDecisionReference(input.response)) {
    throw Error('La réponse ne correspond plus à cette demande et à ces données ; préparer une nouvelle étude avant de l’enregistrer.');
  }
  const observations: HopDecisionObservationSnapshot[] = [];
  for (const material of input.request.materials) {
    const origins = [['declared', material.declaredAnalysis], ['lot', material.lot?.analysis], ['variety', material.variety?.analysis]] as const;
    for (const [origin, measures] of origins) for (const [index, snapshot] of (measures ?? []).entries()) {
      observations.push({
        // Stable inside this frozen study; content and source URL are different identities.
        observationId: `hop-observation-v1:${JSON.stringify([material.id, origin, index])}`,
        materialId: material.id, origin, observationRef: hopDecisionReference(snapshot), snapshot: structuredClone(snapshot),
      });
    }
  }
  return structuredClone({ actionKind: input.request.action.kind, request: input.request,
    responseSnapshot: input.response, observations, context: input.context ?? null }) as unknown as HopDecisionStudySnapshot<A['kind']>;
}

function currentPlanningRequest(study: HopDecisionStudySnapshot<'planReplacement'>, current: HopDecisionPublicInput<PlanAction>) {
  if (study.actionKind !== 'planReplacement' || hopDecisionReference(study.request) !== hopDecisionReference(current)) {
    throw Error('La demande ou ses données ont changé ; conserver cet historique et créer une nouvelle étude.');
  }
  return study.responseSnapshot.result.request;
}

/** Validate the deliberate current choice before recording it. This does not persist or operate on stock. */
export function captureHopDecisionSelectionEvent(input: {
  identity: EventIdentity; study: HopDecisionStudySnapshot<'planReplacement'>; currentRequest: HopDecisionPublicInput<PlanAction>;
  decisionId: string; selection: HopPlannerSelection; reason: string;
}) {
  const request = currentPlanningRequest(input.study, input.currentRequest);
  applySelectedHopReplacement(request, input.selection);
  return createHopDecisionEvent({ ...input.identity, kind: 'optionRetained',
    payload: { decisionId: input.decisionId, optionId: input.selection.pathId, selection: input.selection, reason: input.reason } });
}

/** Capture an applicable final recipe receipt. Persisting this event never confirms a recipe save. */
export function captureHopDecisionRecipePreparationEvent<T extends HopRecipeLike>(input: {
  identity: EventIdentity; study: HopDecisionStudySnapshot<'planReplacement'>; currentRequest: HopDecisionPublicInput<PlanAction>;
  decisionId: string; preparationId: string; recipe: T; binding: HopRecipeBinding; preview: HopPlannedRecipePreview<T>;
}) {
  const request = currentPlanningRequest(input.study, input.currentRequest);
  if (input.study.context && (input.study.context.kind !== 'recipe' || input.study.context.recipeId !== input.recipe.id
    || input.study.context.recipeReference !== input.binding.recipeReference)) {
    throw Error('Cette étude ne porte pas sur le contexte de recette préparé.');
  }
  applyHopPlannedRecipe({ request, recipe: input.recipe, binding: input.binding, preview: input.preview });
  return createHopDecisionEvent({ ...input.identity, kind: 'programPrepared', payload: {
    decisionId: input.decisionId, optionId: input.preview.selection.pathId, preparationId: input.preparationId, preview: input.preview,
  } });
}

function currentQualifiedPlanningRequest(
  study: HopDecisionStudySnapshotV2<'planReplacement'>,
  currentStudy: HopDecisionStudySnapshotV2<'planReplacement'>,
): HopPlannerRequest {
  if (study.kind !== 'calculated' || currentStudy.kind !== 'calculated'
    || hopDecisionReference(study.request) !== hopDecisionReference(currentStudy.request)
    || hopDecisionReference(study.qualificationSnapshot) !== hopDecisionReference(currentStudy.qualificationSnapshot)
    || hopDecisionReference(study.calculationInput) !== hopDecisionReference(currentStudy.calculationInput)
    || hopDecisionReference(study.responseSnapshot) !== hopDecisionReference(currentStudy.responseSnapshot)) {
    throw Error('La qualification ou la demande a changé; conserver cette étude et en créer une nouvelle avant de retenir/préparer une option.');
  }
  return study.responseSnapshot.result.request;
}

/** Qualified v2 counterpart. The caller supplies a fresh result from the public qualified endpoint. */
export function captureHopDecisionQualifiedSelectionEvent(input: {
  identity: EventIdentityV2; study: HopDecisionStudySnapshotV2<'planReplacement'>;
  currentStudy: HopDecisionStudySnapshotV2<'planReplacement'>; decisionId: string; selection: HopPlannerSelection; reason: string;
}) {
  const request = currentQualifiedPlanningRequest(input.study, input.currentStudy);
  if (!input.reason.trim()) throw Error('Justifier le choix retenu.');
  applySelectedHopReplacement(request, input.selection);
  return createHopDecisionEventV2({ ...input.identity, kind: 'optionRetained', payload: {
    decisionId: input.decisionId, optionId: input.selection.pathId, selection: input.selection, reason: input.reason,
  } });
}

/** Retains the same J1 full-preview guard for v2; this event still does not write a recipe. */
export function captureHopDecisionQualifiedRecipePreparationEvent<T extends HopRecipeLike>(input: {
  identity: EventIdentityV2; study: HopDecisionStudySnapshotV2<'planReplacement'>;
  currentStudy: HopDecisionStudySnapshotV2<'planReplacement'>; decisionId: string; preparationId: string;
  recipe: T; binding: HopRecipeBinding; preview: HopPlannedRecipePreview<T>;
}) {
  const request = currentQualifiedPlanningRequest(input.study, input.currentStudy);
  if (input.study.context && (input.study.context.kind !== 'recipe' || input.study.context.recipeId !== input.recipe.id
    || input.study.context.recipeReference !== input.binding.recipeReference)) {
    throw Error('Cette étude qualifiée ne porte pas sur le contexte de recette préparé.');
  }
  applyHopPlannedRecipe({ request, recipe: input.recipe, binding: input.binding, preview: input.preview });
  return createHopDecisionEventV2({ ...input.identity, kind: 'programPrepared', payload: {
    decisionId: input.decisionId, optionId: input.preview.selection.pathId, preparationId: input.preparationId, preview: input.preview,
  } });
}
