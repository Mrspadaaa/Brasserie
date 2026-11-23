import type { BrewerContext } from '../../../functions/src/companionTypes';
import {
  compareBrewerHopAdviceContextBindings,
  isBrewerHopAdviceContextLaunchClaim,
  mapBrewerHopAdviceLaunchSourceToScopeV1,
  projectBrewerHopAdviceContext,
  type BrewerHopAdviceContextLaunchClaimV1,
  type BrewerHopAdviceContextProjectionV1,
  type BrewerHopAdviceContextScopeV1,
  type BrewerHopAdviceCultureUseV1,
} from '../../../functions/src/brewerHopAdviceContextBinding';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { prepareBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { resolveHopV55AdoptedContext } from './adoptedContextResolution';
import {
  hopV55DecisionReadingForDisplay,
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchive,
  type HopV55DecisionReadingSource,
} from './decisionArchive';
import { readHopV55FutureRecipeDraft } from './futureRecipeDraft';
import { getHopV55ReferenceProjection } from './referenceWorkspace';
import { hopV55ScenarioRuntimeReference } from './scenarioCommit';
import type { HopV55Workspace } from './contracts';

export type PrepareHopV55AssistedContextLaunchResult =
  | {
      status: 'ready';
      launch: BrewerHopAdviceContextLaunchClaimV1;
      archive: HopV55DecisionReadingArchive;
      /** The displayed reading is returned unchanged; callers must keep this source archive for stale display. */
      reading: ReturnType<typeof hopV55DecisionReadingForDisplay>;
    }
  | { status: 'stale'; reason: string }
  | { status: 'invalid'; reason: string }
  | { status: 'unsupportedFormat'; format: string; raw: unknown };

export type PrepareHopV55AssistedCurrentContextResult =
  | { status: 'ready'; sourceReadingReference: string; projection: BrewerHopAdviceContextProjectionV1 }
  | { status: 'stale'; reason: string }
  | { status: 'invalid'; reason: string }
  | { status: 'unsupportedFormat'; format: string; raw: unknown };

export interface PrepareHopV55AssistedContextLaunchInput {
  archive: unknown;
  workspace: HopV55Workspace;
  ownerKey: string;
  workspaceId: string;
  /** Immutable launch scope captured by Page. Never reconstruct this from Host props. */
  scopeAtPageLaunch: BrewerHopAdviceContextScopeV1;
  context: BrewerContext;
}

export type CompareHopV55AssistedContextAtReceptionResult = {
  /** Whether the immutable server turn corresponds to its original launch under A. */
  history:
    | { status: 'matched'; catalogueDependenciesChanged: boolean; calculationDependenciesChanged: boolean;
        runtimeDataRevisionChanged: boolean; stockAvailabilityChanged: boolean }
    | { status: 'stale'; conflicts: string[]; reason: string }
    | { status: 'invalid'; reason: string };
  /** Whether that historical proposal is still applicable to the freshly read current Page context. */
  applicability:
    | { status: 'current'; recalculationRequired: boolean; catalogueDependenciesChanged: boolean;
        calculationDependenciesChanged: boolean; runtimeDataRevisionChanged: boolean; stockAvailabilityChanged: boolean }
    | { status: 'stale'; conflicts: string[]; reason: string }
    | { status: 'unavailable'; reason: string };
  stage: 'reception' | 'confirmation';
  /** Historical proposal remains associated with this original archive even when applicability is stale. */
  historicalSourceReadingReference: string;
  currentSourceReadingReference?: string;
};

type PageContextProjectionResult =
  | { status: 'ready'; archive: HopV55DecisionReadingArchive; projection: BrewerHopAdviceContextProjectionV1 }
  | Exclude<PrepareHopV55AssistedContextLaunchResult, { status: 'ready' }>;

const same = (left: unknown, right: unknown) => hopDecisionReference(left) === hopDecisionReference(right);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;

function sourceForWorkspace(workspace: HopV55Workspace): { source?: HopV55DecisionReadingSource; reason?: string } {
  if (workspace.activeFutureDraftSource) {
    const active = workspace.activeFutureDraftSource;
    if (active.workspaceId !== workspace.id) return { reason: 'La source du brouillon pointe vers un autre workspace.' };
    const stored = workspace.futureDrafts?.find(row => row.draftId === active.draftId && row.revision === active.revision
      && row.contentReference === active.contentReference);
    if (!stored) return { reason: 'La révision exacte du brouillon actif est absente du workspace.' };
    const read = readHopV55FutureRecipeDraft(stored);
    if (read.status !== 'available') return { reason: `Le brouillon actif ne se relit pas exactement : ${read.reason}` };
    return { source: structuredClone(active) };
  }
  if (workspace.activeCopyId) {
    const copy = workspace.copies.find(row => row.id === workspace.activeCopyId);
    if (!copy || !isText(copy.id) || !isText(copy.recipe?.id)) return { reason: 'La copie locale active ne porte pas une identité exacte.' };
    return { source: { kind: 'localRecipeCopy', workspaceId: workspace.id, copyId: copy.id,
      recipeId: copy.recipe.id, recipeReference: hopDecisionReference(copy.recipe) } };
  }
  if (workspace.sourceBatchId) return { source: { kind: 'batch', id: workspace.sourceBatchId } };
  if (workspace.sourceRecipeId) return { source: { kind: 'recipe', id: workspace.sourceRecipeId } };
  return { source: { kind: 'exploration' } };
}

function sourceMatchesScope(source: HopV55DecisionReadingSource, scope: BrewerHopAdviceContextScopeV1,
  ownerKey: string, workspaceId: string): boolean {
  try { return same(mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, workspaceId, source), scope); }
  catch { return false; }
}

function contextMatchesSource(source: HopV55DecisionReadingSource, context: BrewerContext): boolean {
  if (source.kind === 'recipe') return context.recipe?.id === source.id && context.batch == null;
  if (source.kind === 'batch') return context.batch?.id === source.id;
  if (source.kind === 'exploration') return context.recipe == null && context.batch == null;
  if (source.kind === 'localRecipeCopy') return context.recipe != null && context.batch == null
    && hopDecisionReference(context.recipe) === source.recipeReference;
  // A future draft is usable only when its own materialized draft context was loaded; no recipe ID is fabricated.
  return context.recipe != null && context.batch == null;
}

function cultureUseForCurrentWorkspace(workspace: HopV55Workspace):
  | { status: 'ready'; value: BrewerHopAdviceCultureUseV1 }
  | { status: 'stale' | 'invalid' | 'unsupportedFormat'; reason: string; raw?: unknown } {
  let projection: ReturnType<typeof getHopV55ReferenceProjection>;
  try { projection = getHopV55ReferenceProjection(workspace); }
  catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Journal NR illisible.' }; }
  const resolved = resolveHopV55AdoptedContext({ workspace,
    expected: projection?.currentReference ?? null });
  if (resolved.status === 'absent') return { status: 'ready', value: { status: 'notApplicable' } };
  if (resolved.status === 'stale') return { status: 'stale', reason: `L’adoption NR courante a changé (${resolved.code}).` };
  if (resolved.status === 'unsupportedFormat') return { status: 'unsupportedFormat', reason: 'Le journal NR courant utilise un format futur conservé sans conversion.', raw: resolved.raw };
  if (resolved.status === 'invalid') return { status: 'invalid', reason: resolved.reason };
  // Page's present preparer does not inject this workspace NR binding into its runtime.
  // Preserve exact lineage as not consumed; the server must not promote equal values to adoption.
  return { status: 'ready', value: { status: 'declaredNotConsumed', reference: structuredClone(resolved.binding.reference),
    bindingReference: resolved.binding.bindingReference } };
}

/**
 * Validate the immutable archive and current Page workspace before dispatch. This is
 * local integrity/scope validation, not server authentication. The historical archive
 * stores only the full runtime reference; if it differs, the old format cannot tell
 * a physical-source change from a catalogue-only change, so the conservative result is stale.
 */
function projectHopV55AssistedPageContext(input: PrepareHopV55AssistedContextLaunchInput,
  compareArchiveRuntime: boolean): PageContextProjectionResult {
  try {
    if (!isText(input.ownerKey) || !isText(input.workspaceId) || input.workspace.ownerKey !== input.ownerKey
      || input.workspace.id !== input.workspaceId) return { status: 'invalid', reason: 'Owner/workspace local différent du workspace ouvert.' };
    const read = readHopV55DecisionReadingArchive(input.archive);
    if (read.status === 'unsupportedFormat') return { status: 'unsupportedFormat', format: read.format, raw: read.raw };
    if (read.status !== 'available') return { status: 'invalid', reason: read.reason };
    const archive = read.archive;
    if (archive.ownerKey !== input.ownerKey || archive.workspaceId !== input.workspaceId) {
      return { status: 'stale', reason: 'L’archive exacte appartient à un autre owner ou workspace.' };
    }
    const stored = input.workspace.decisionReadings?.find(row => row.contentReference === archive.contentReference);
    if (!stored) return { status: 'stale', reason: 'L’archive n’est plus présente sous cette référence dans le workspace actif.' };
    const storedRead = readHopV55DecisionReadingArchive(stored);
    if (storedRead.status !== 'available' || !same(storedRead.archive, archive)) {
      return { status: 'stale', reason: 'L’archive affichée diffère de la copie exacte enregistrée dans le workspace.' };
    }
    const current = sourceForWorkspace(input.workspace);
    if (!current.source) return { status: 'stale', reason: current.reason ?? 'La source active ne peut pas être résolue.' };
    if (!same(current.source, archive.source)) return { status: 'stale', reason: 'La source active a changé depuis la lecture archivée.' };
    if (!sourceMatchesScope(current.source, input.scopeAtPageLaunch, input.ownerKey, input.workspaceId)) {
      return { status: 'stale', reason: 'Le scope figé par Page ne représente pas la source archivée; aucune prop Host ne le remplace.' };
    }
    if (!contextMatchesSource(current.source, input.context)) {
      return { status: 'stale', reason: 'Le contexte local chargé ne correspond pas à la recette, au brassin ou au brouillon déclaré.' };
    }
    const culture = cultureUseForCurrentWorkspace(input.workspace);
    if (culture.status !== 'ready') return culture.status === 'unsupportedFormat'
      ? { status: 'unsupportedFormat', format: 'referenceJournal', raw: culture.raw }
      : { status: culture.status, reason: culture.reason };

    // Use the canonical preparation already used by Page; do not add NR values that this runtime did not consume.
    const prepared = prepareBrewingScenarioContext(input.context);
    const currentRuntimeReference = hopV55ScenarioRuntimeReference(prepared.runtime);
    if (compareArchiveRuntime && archive.runtimeReference !== currentRuntimeReference) {
      return { status: 'stale', reason: 'La référence runtime historique ne correspond plus. Ce format ne permet pas de séparer catalogue et ancre physique.' };
    }
    const projection = projectBrewerHopAdviceContext({ scope: input.scopeAtPageLaunch, context: input.context,
      runtime: prepared.runtime, cultureUse: culture.value });
    if (projection.status === 'conflict') return { status: 'stale', reason: projection.reason };
    if (projection.status !== 'ready') return { status: 'invalid', reason: projection.reason };
    return { status: 'ready', archive, projection: projection.projection };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Liaison locale illisible.' };
  }
}

/** Validate the exact archive/runtime, owner/workspace and Page-frozen scope before dispatch. */
export function prepareHopV55AssistedAdviceContextLaunch(
  input: PrepareHopV55AssistedContextLaunchInput
): PrepareHopV55AssistedContextLaunchResult {
  const current = projectHopV55AssistedPageContext(input, true);
  if (current.status !== 'ready') return current;
  const { archive, projection } = current;
  const launch: BrewerHopAdviceContextLaunchClaimV1 = {
    format: 'brewer-hop-advice-context-launch-v1', ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: archive.contentReference, source: structuredClone(archive.source),
    sourceRuntimeReference: archive.runtimeReference, scope: structuredClone(input.scopeAtPageLaunch), expected: projection,
  };
  return { status: 'ready', launch, archive: structuredClone(archive), reading: hopV55DecisionReadingForDisplay(archive) };
}

/** Revalidate current archive/source/physical projection without comparing its old unsplit runtime hash. */
export function prepareHopV55AssistedCurrentPageContext(
  input: PrepareHopV55AssistedContextLaunchInput
): PrepareHopV55AssistedCurrentContextResult {
  const current = projectHopV55AssistedPageContext(input, false);
  if (current.status !== 'ready') return current;
  return { status: 'ready', sourceReadingReference: current.archive.contentReference, projection: current.projection };
}

/**
 * Recheck all three contexts at reception and again immediately before confirmation:
 * launch A, server's actual generation context, and freshly prepared current Page context.
 * A valid historical result for A remains archivable under A while applicability to B is refused.
 */
export function compareHopV55AssistedAdviceContextAtReception(input: {
  launch: BrewerHopAdviceContextLaunchClaimV1;
  serverRequestReadingReference: string;
  serverProjection: unknown;
  /** Fresh Page/workspace/archive/context read; re-prepared here at reception or confirmation. */
  current: PrepareHopV55AssistedContextLaunchInput;
  stage: 'reception' | 'confirmation';
}): CompareHopV55AssistedContextAtReceptionResult {
  if (!isBrewerHopAdviceContextLaunchClaim(input.launch)) {
    return {
      history: { status: 'invalid', reason: 'Lancement assisté local invalide.' },
      applicability: { status: 'unavailable', reason: 'Lancement assisté local invalide.' },
      stage: input.stage, historicalSourceReadingReference: '',
    };
  }
  let history: CompareHopV55AssistedContextAtReceptionResult['history'];
  if (input.serverRequestReadingReference !== input.launch.sourceReadingReference) {
    history = { status: 'stale', conflicts: ['sourceReadingReference'], reason: 'Le tour serveur ne porte pas la même archive de lecture que son lancement.' };
  } else {
    const compared = compareBrewerHopAdviceContextBindings(input.launch.expected, input.serverProjection);
    history = compared.status === 'invalid' ? { status: 'invalid', reason: compared.reason }
      : compared.status === 'stale' ? { status: 'stale', conflicts: compared.conflicts,
        reason: 'Le contexte réellement consommé par le serveur diffère du lancement historique.' }
        : { status: 'matched', catalogueDependenciesChanged: compared.catalogueDependenciesChanged,
          calculationDependenciesChanged: compared.calculationDependenciesChanged,
          runtimeDataRevisionChanged: compared.runtimeDataRevisionChanged,
          stockAvailabilityChanged: compared.stockAvailabilityChanged };
  }
  let applicability: CompareHopV55AssistedContextAtReceptionResult['applicability'];
  const current = prepareHopV55AssistedCurrentPageContext(input.current);
  if (current.status !== 'ready') {
    const currentReason = current.status === 'unsupportedFormat'
      ? `Page conserve un format ${current.format} sans conversion.` : current.reason;
    applicability = { status: 'stale', conflicts: ['currentReadingReference'],
      reason: currentReason || 'La lecture ou le contexte Page courant ne peut pas être revalidé; la proposition reste historisée sous sa lecture d’origine.' };
  } else if (current.sourceReadingReference !== input.launch.sourceReadingReference) {
    applicability = { status: 'stale', conflicts: ['currentReadingReference'],
      reason: 'Page affiche une autre archive; la proposition reste historisée sous sa lecture d’origine.' };
  } else if (history.status !== 'matched') {
    applicability = { status: 'stale', conflicts: history.status === 'stale' ? history.conflicts : ['serverContextUnavailable'],
      reason: 'Le tour historique ne peut pas être relié sans conflit au contexte courant.' };
  } else {
    const physicalCurrent = compareBrewerHopAdviceContextBindings(input.launch.expected, current.projection);
    const actualServerCurrent = compareBrewerHopAdviceContextBindings(input.serverProjection, current.projection);
    applicability = physicalCurrent.status === 'invalid' ? { status: 'unavailable', reason: physicalCurrent.reason }
      : physicalCurrent.status === 'stale' ? { status: 'stale', conflicts: physicalCurrent.conflicts,
        reason: 'Le contexte courant de Page diffère du lancement; l’ancienne proposition n’est pas rescélée dessus.' }
        : actualServerCurrent.status === 'invalid' ? { status: 'unavailable', reason: actualServerCurrent.reason }
          : actualServerCurrent.status === 'stale' ? { status: 'stale', conflicts: actualServerCurrent.conflicts,
            reason: 'Le résultat serveur ne correspond pas aux dépendances/à l’ancre courantes; recalcule ou réexamine avant confirmation.' }
            : { status: 'current',
              // Dependencies are compared server↔current. A launch B / server C / Page C is current,
              // while launch B / server C / Page B remains available only with an explicit recalc flag.
              recalculationRequired: actualServerCurrent.catalogueDependenciesChanged || actualServerCurrent.calculationDependenciesChanged
                || actualServerCurrent.runtimeDataRevisionChanged || actualServerCurrent.stockAvailabilityChanged,
              catalogueDependenciesChanged: actualServerCurrent.catalogueDependenciesChanged,
              calculationDependenciesChanged: actualServerCurrent.calculationDependenciesChanged,
              runtimeDataRevisionChanged: actualServerCurrent.runtimeDataRevisionChanged,
              stockAvailabilityChanged: actualServerCurrent.stockAvailabilityChanged };
  }
  return { history, applicability, stage: input.stage,
    historicalSourceReadingReference: input.launch.sourceReadingReference,
    ...(current.status === 'ready' ? { currentSourceReadingReference: current.sourceReadingReference } : {}) };
}

