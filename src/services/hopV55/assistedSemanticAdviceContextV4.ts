import type { BrewerContext, BrewerEvidence } from '../../../functions/src/companionTypes';
import type { HopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
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
  readHopV55DecisionReadingArchive,
  HOP_V55_DECISION_READING_FORMAT_V4,
  prepareHopV55PropertyAdviceFromSemanticReadingV1,
  type HopV55DecisionReadingArchiveV4,
  type HopV55PropertyAdviceRequestDraftV3,
} from './brewerHopAdviceSemanticSource4';
import {
  assertBrewerHopAdviceSourceViewMatchesArchiveV1,
  assertBrewerHopAdviceProposalV5MatchesSource,
  readBrewerHopAdviceProposalEnvelopeV5,
  readBrewerHopAdviceRequestV3,
  verifyBrewerHopAdviceSemanticEvidenceV5,
  type BrewerHopAdviceProposalEnvelopeV5,
} from '../../../functions/src/brewerHopAdviceSemanticV3';
import { readAssistedColdContactEvidence, type AssistedColdContactEvidence } from './assistedColdContactEvidence';
import { readHopV55FutureRecipeDraft } from './futureRecipeDraft';
import { getHopV55ReferenceProjection } from './referenceWorkspace';
import { hopV55ScenarioRuntimeReference } from './scenarioCommit';
import type { HopV55Workspace } from './contracts';
import {
  createHopV55AssistedSemanticAdviceRequestV3FromArchive,
  type BuildHopV55AssistedSemanticAdviceRequestV3Result,
} from './assistedSemanticAdviceRequestV3';

type HopV55SemanticSourceV4 = HopV55DecisionReadingArchiveV4['source'];

export type PrepareHopV55SemanticAdviceContextLaunchResult =
  | {
      status: 'ready';
      launch: BrewerHopAdviceContextLaunchClaimV1;
      sourceReadingReference: string;
    }
  | { status: 'stale'; reason: string }
  | { status: 'invalid'; reason: string }
  | { status: 'unsupportedFormat'; format: string; raw: unknown }
  | { status: 'legacyReadOnly'; format: string; raw: unknown };

export type PrepareHopV55SemanticAssistedAdviceLaunchV1Result =
  | BuildHopV55AssistedSemanticAdviceRequestV3Result
  | Exclude<PrepareHopV55SemanticAdviceContextLaunchResult, { status: 'ready' }>;

export type PrepareHopV55SemanticCurrentContextResult =
  | { status: 'ready'; sourceReadingReference: string; projection: BrewerHopAdviceContextProjectionV1 }
  | { status: 'stale'; reason: string }
  | { status: 'invalid'; reason: string }
  | { status: 'unsupportedFormat'; format: string; raw: unknown }
  | { status: 'legacyReadOnly'; format: string; raw: unknown };

export interface PrepareHopV55SemanticContextLaunchInput {
  archive: unknown;
  workspace: HopV55Workspace;
  ownerKey: string;
  workspaceId: string;
  /** Immutable launch scope captured by Page. Never reconstruct this from Host props. */
  scopeAtPageLaunch: BrewerHopAdviceContextScopeV1;
  context: BrewerContext;
}

export type CompareHopV55SemanticAdviceContextAtReceptionResult = {
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

export type HopV55SemanticAdviceReaderBaselineResultV1 =
  | { status: 'ready'; draft: HopV55PropertyAdviceRequestDraftV3 }
  | { status: 'withheld' | 'unavailable'; reason: string };

type HopV55SemanticColdEvidenceView = {
  /** The original turn array is passed through read-only; this helper does not normalize or rewrite it. */
  turnEvidence: readonly BrewerEvidence[];
  coldContactEvidence: AssistedColdContactEvidence[];
};

export type ReceiveHopV55AssistedSemanticAdviceProposalV5Result = HopV55SemanticColdEvidenceView & (
  | {
      status: 'readOnly';
      envelope: BrewerHopAdviceProposalEnvelopeV5;
      sourceReadingReference: string;
      contextCheck: CompareHopV55SemanticAdviceContextAtReceptionResult;
      /** Server mapper output for source-bound suggestion checks; never a client baseline or a qualified action. */
      sourcePropertyProjection: BrewerHopAdviceProposalEnvelopeV5['sourcePropertyProjection'];
      readerBaseline: HopV55SemanticAdviceReaderBaselineResultV1;
      /** Source annotations and model suggestions are separate, immutable review inputs. */
      suggestions: {
        annotationReviews: BrewerHopAdviceProposalEnvelopeV5['proposal']['annotationReviews'];
        propertyIntentProposals: BrewerHopAdviceProposalEnvelopeV5['proposal']['propertyIntentProposals'];
        semanticRevisionProposals: BrewerHopAdviceProposalEnvelopeV5['proposal']['semanticRevisionProposals'];
      };
      answer: BrewerHopAdviceProposalEnvelopeV5['proposal']['answer'];
      /** The runtime owner must still gate ticket, operationId and generation before any current use. */
      runtimeGate: { status: 'notChecked'; requiredChecks: readonly ['ticket identity', 'operationId', 'generation'] };
    }
  | { status: 'legacyReadOnly'; format: string; snapshot: unknown }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string }
);

export interface ReceiveHopV55AssistedSemanticAdviceProposalV5Input {
  request: unknown;
  /** Exact full archive4 retained locally beside compact RequestV3; never reconstructed from sourceView. */
  sourceArchive: unknown;
  /** V5 envelope from the same public turn; never a reconstructed model response. */
  envelope: unknown;
  /** Current Page/workspace/context, freshly read at reception. May refer to corrected source B. */
  current: PrepareHopV55SemanticContextLaunchInput;
  /** Public turn evidence array; kept as the exact caller-owned payload alongside cold display reads. */
  turnEvidence: readonly BrewerEvidence[];
  /** Optional exact local baseline identity/policy supplied by the caller; neither is derived here. */
  baselineRequestId?: string;
  candidatePolicy?: HopPropertyAdviceRequestV3['candidatePolicy'];
}

type PageContextProjectionResult =
  | { status: 'ready'; archive: HopV55DecisionReadingArchiveV4; projection: BrewerHopAdviceContextProjectionV1;
      prepared: PreparedBrewingScenarioContext }
  | Exclude<PrepareHopV55SemanticAdviceContextLaunchResult, { status: 'ready' }>;

const same = (left: unknown, right: unknown) => hopDecisionReference(left) === hopDecisionReference(right);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

function sourceForWorkspace(workspace: HopV55Workspace): { source?: HopV55SemanticSourceV4; reason?: string } {
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

function sourceMatchesScope(source: HopV55SemanticSourceV4, scope: BrewerHopAdviceContextScopeV1,
  ownerKey: string, workspaceId: string): boolean {
  try { return same(mapBrewerHopAdviceLaunchSourceToScopeV1(ownerKey, workspaceId, source), scope); }
  catch { return false; }
}

function contextMatchesSource(source: HopV55SemanticSourceV4, context: BrewerContext): boolean {
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
function projectHopV55SemanticPageContext(input: PrepareHopV55SemanticContextLaunchInput,
  compareArchiveRuntime: boolean): PageContextProjectionResult {
  try {
    if (!isText(input.ownerKey) || !isText(input.workspaceId) || input.workspace.ownerKey !== input.ownerKey
      || input.workspace.id !== input.workspaceId) return { status: 'invalid', reason: 'Owner/workspace local différent du workspace ouvert.' };
    const read = readHopV55DecisionReadingArchive(input.archive);
    if (read.status === 'unsupportedFormat') return { status: 'unsupportedFormat', format: read.format, raw: read.raw };
    if (read.status !== 'available') return { status: 'invalid', reason: read.reason };
    const archiveRead = read.archive;
    if (archiveRead.format !== HOP_V55_DECISION_READING_FORMAT_V4) {
      return { status: 'legacyReadOnly', format: archiveRead.format, raw: structuredClone(archiveRead) };
    }
    const archive = archiveRead as HopV55DecisionReadingArchiveV4;
    if (archive.reading.format !== 'hop-v55-question-semantic-reading-v1') {
      return { status: 'unsupportedFormat', format: String(archive.reading.format), raw: structuredClone(archive) };
    }
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
    return { status: 'ready', archive, projection: projection.projection, prepared };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Liaison locale illisible.' };
  }
}

/** Validate the exact archive/runtime, owner/workspace and Page-frozen scope before dispatch. */
export function prepareHopV55SemanticAdviceContextLaunchV1(
  input: PrepareHopV55SemanticContextLaunchInput
): PrepareHopV55SemanticAdviceContextLaunchResult {
  const current = projectHopV55SemanticPageContext(input, true);
  if (current.status !== 'ready') return current;
  const { archive, projection } = current;
  const launch: BrewerHopAdviceContextLaunchClaimV1 = {
    format: 'brewer-hop-advice-context-launch-v1', ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: archive.contentReference, source: structuredClone(archive.source),
    sourceRuntimeReference: archive.runtimeReference, scope: structuredClone(input.scopeAtPageLaunch), expected: projection,
  };
  return { status: 'ready', launch, sourceReadingReference: archive.contentReference };
}

/**
 * Read and bind one complete source4 archive to fresh Page context, then construct
 * its compact RequestV3 snapshot. The exact archive is returned separately for the
 * local ticket; no workspace, prepared runtime or catalogue cache escapes this helper.
 */
export function prepareHopV55SemanticAssistedAdviceLaunchV1(
  input: PrepareHopV55SemanticContextLaunchInput,
): PrepareHopV55SemanticAssistedAdviceLaunchV1Result {
  const current = projectHopV55SemanticPageContext(input, true);
  if (current.status !== 'ready') return current;
  const { archive, projection } = current;
  const launch: BrewerHopAdviceContextLaunchClaimV1 = {
    format: 'brewer-hop-advice-context-launch-v1', ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: archive.contentReference, source: structuredClone(archive.source),
    sourceRuntimeReference: archive.runtimeReference, scope: structuredClone(input.scopeAtPageLaunch), expected: projection,
  };
  return createHopV55AssistedSemanticAdviceRequestV3FromArchive({ sourceArchive: archive, contextLaunch: launch });
}

/** Revalidate current archive/source/physical projection without comparing its old unsplit runtime hash. */
export function prepareHopV55SemanticCurrentPageContextV1(
  input: PrepareHopV55SemanticContextLaunchInput
): PrepareHopV55SemanticCurrentContextResult {
  const current = projectHopV55SemanticPageContext(input, false);
  if (current.status !== 'ready') return current;
  return { status: 'ready', sourceReadingReference: current.archive.contentReference, projection: current.projection };
}

/**
 * Recheck all three contexts at reception and again immediately before confirmation:
 * launch A, server's actual generation context, and freshly prepared current Page context.
 * A valid historical result for A remains archivable under A while applicability to B is refused.
 */
export function compareHopV55SemanticAdviceContextAtReceptionV1(input: {
  launch: BrewerHopAdviceContextLaunchClaimV1;
  serverRequestReadingReference: string;
  serverProjection: unknown;
  /** Fresh Page/workspace/archive/context read; re-prepared here at reception or confirmation. */
  current: PrepareHopV55SemanticContextLaunchInput;
  stage: 'reception' | 'confirmation';
}): CompareHopV55SemanticAdviceContextAtReceptionResult {
  return compareHopV55SemanticAdviceContextAgainstSnapshot(input, projectHopV55SemanticPageContext(input.current, false));
}

function compareHopV55SemanticAdviceContextAgainstSnapshot(input: {
  launch: BrewerHopAdviceContextLaunchClaimV1;
  serverRequestReadingReference: string;
  serverProjection: unknown;
  stage: 'reception' | 'confirmation';
}, current: PageContextProjectionResult): CompareHopV55SemanticAdviceContextAtReceptionResult {
  if (!isBrewerHopAdviceContextLaunchClaim(input.launch)) {
    return {
      history: { status: 'invalid', reason: 'Lancement sémantique local invalide.' },
      applicability: { status: 'unavailable', reason: 'Lancement assisté local invalide.' },
      stage: input.stage, historicalSourceReadingReference: '',
    };
  }
  let history: CompareHopV55SemanticAdviceContextAtReceptionResult['history'];
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
  let applicability: CompareHopV55SemanticAdviceContextAtReceptionResult['applicability'];
  if (current.status !== 'ready') {
    const currentReason = current.status === 'unsupportedFormat'
      ? `Page conserve un format ${current.format} sans conversion.`
      : current.status === 'legacyReadOnly' ? `Page conserve l’archive historique ${current.format} en lecture seule.` : current.reason;
    applicability = { status: 'stale', conflicts: ['currentReadingReference'],
      reason: currentReason || 'La lecture ou le contexte Page courant ne peut pas être revalidé; la proposition reste historisée sous sa lecture d’origine.' };
  } else if (current.archive.contentReference !== input.launch.sourceReadingReference) {
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
    ...(current.status === 'ready' ? { currentSourceReadingReference: current.archive.contentReference } : {}) };
}

function coldEvidenceView(turnEvidence: readonly BrewerEvidence[]): HopV55SemanticColdEvidenceView {
  const coldContactEvidence = turnEvidence.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const row = entry as unknown as Record<string, unknown>;
    if (row.name !== 'cold_contact_bitterness_reference') return [];
    try { return [readAssistedColdContactEvidence(entry)]; }
    catch (error) {
      const id = row.id;
      return [{ status: 'invalid' as const, ...(typeof id === 'string' ? { evidenceId: id } : {}),
        reason: error instanceof Error ? error.message : 'Preuve froide illisible.' }];
    }
  });
  return { turnEvidence, coldContactEvidence };
}

/**
 * Read and qualify one V5 reply against its exact RequestV3, source4 archive and immutable launch.
 * A valid historical reply is returned intact even when the freshly read Page is now source B.
 * A complete direct source4→PropertyV3 baseline is prepared only from the original archive and the
 * one fresh context used for this qualification. Suggestions remain separate and are never applied.
 */
export function receiveHopV55AssistedSemanticAdviceProposalV5(
  input: ReceiveHopV55AssistedSemanticAdviceProposalV5Input,
): ReceiveHopV55AssistedSemanticAdviceProposalV5Result {
  const proofView = coldEvidenceView(input.turnEvidence);
  let requestRead: ReturnType<typeof readBrewerHopAdviceRequestV3>;
  try { requestRead = readBrewerHopAdviceRequestV3(input.request); }
  catch (error) {
    return { ...proofView, status: 'invalid', reason: error instanceof Error ? error.message : 'RequestV3 illisible.' };
  }
  if (requestRead.status === 'legacyReadOnly') {
    return { ...proofView, status: 'legacyReadOnly', format: 'brewer-hop-advice-request-v2', snapshot: structuredClone(requestRead.request) };
  }
  if (requestRead.status === 'unsupportedReadOnly') {
    return { ...proofView, status: 'unsupportedReadOnly', snapshot: structuredClone(requestRead.snapshot), reason: requestRead.reason };
  }
  if (requestRead.status !== 'readOnly') return { ...proofView, status: 'invalid', reason: requestRead.reason };

  let envelopeRead: ReturnType<typeof readBrewerHopAdviceProposalEnvelopeV5>;
  try { envelopeRead = readBrewerHopAdviceProposalEnvelopeV5(input.envelope); }
  catch (error) {
    return { ...proofView, status: 'invalid', reason: error instanceof Error ? error.message : 'Enveloppe V5 illisible.' };
  }
  if (envelopeRead.status === 'legacyReadOnly') {
    return { ...proofView, status: 'legacyReadOnly', format: 'brewer-hop-advice-proposal-v4', snapshot: structuredClone(envelopeRead.snapshot) };
  }
  if (envelopeRead.status === 'unsupportedReadOnly') {
    return { ...proofView, status: 'unsupportedReadOnly', snapshot: structuredClone(envelopeRead.snapshot), reason: envelopeRead.reason };
  }
  if (envelopeRead.status !== 'readOnly') return { ...proofView, status: 'invalid', reason: envelopeRead.reason };

  const request = requestRead.request;
  const envelope = structuredClone(envelopeRead.envelope);
  try { assertBrewerHopAdviceProposalV5MatchesSource(envelope, request); }
  catch (error) {
    return { ...proofView, status: 'invalid', reason: error instanceof Error ? error.message : 'La réponse V5 diffère du RequestV3 du ticket.' };
  }

  let sourceArchive: HopV55DecisionReadingArchiveV4;
  let localArchive: unknown;
  try { localArchive = structuredClone(input.sourceArchive); }
  catch (error) {
    return { ...proofView, status: 'invalid', reason: error instanceof Error ? error.message : 'Archive locale non clonable.' };
  }
  if (!isRecord(localArchive) || typeof localArchive.format !== 'string') {
    return { ...proofView, status: 'invalid', reason: 'Archive locale absente ou sans format.' };
  }
  if (localArchive.format !== HOP_V55_DECISION_READING_FORMAT_V4) {
    let olderOrFuture: ReturnType<typeof readHopV55DecisionReadingArchive>;
    try { olderOrFuture = readHopV55DecisionReadingArchive(localArchive); }
    catch (error) {
      return { ...proofView, status: 'invalid', reason: error instanceof Error ? error.message : 'Archive locale illisible.' };
    }
    if (olderOrFuture.status === 'unsupportedFormat') {
      return { ...proofView, status: 'unsupportedReadOnly', snapshot: structuredClone(olderOrFuture.raw),
        reason: `Archive source future conservée sans conversion (${olderOrFuture.format}).` };
    }
    if (olderOrFuture.status === 'available') {
      return { ...proofView, status: 'legacyReadOnly', format: olderOrFuture.archive.format, snapshot: structuredClone(olderOrFuture.archive) };
    }
    return { ...proofView, status: 'invalid', reason: olderOrFuture.reason };
  }
  if (isRecord(localArchive.reading) && typeof localArchive.reading.format === 'string'
    && localArchive.reading.format.startsWith('hop-v55-question-semantic-reading-')
    && localArchive.reading.format !== 'hop-v55-question-semantic-reading-v1') {
    return { ...proofView, status: 'unsupportedReadOnly', snapshot: localArchive,
      reason: `Lecture source future conservée sans conversion (${localArchive.reading.format}).` };
  }
  sourceArchive = localArchive as unknown as HopV55DecisionReadingArchiveV4;

  try {
    if (!isRecord(request.contextLaunch) || !isBrewerHopAdviceContextLaunchClaim(request.contextLaunch)) {
      return { ...proofView, status: 'invalid', reason: 'RequestV3 ne conserve pas un lancement source4 strict.' };
    }
    assertBrewerHopAdviceSourceViewMatchesArchiveV1(request.sourceView, sourceArchive);
    if (request.question !== sourceArchive.reading.intent.question
      || request.sourceReadingReference !== sourceArchive.contentReference
      || request.contextLaunch.sourceReadingReference !== sourceArchive.contentReference) {
      return { ...proofView, status: 'invalid', reason: 'La sourceView RequestV3 ne correspond pas à l’archive source4 locale exacte.' };
    }
  } catch (error) {
    return { ...proofView, status: 'invalid', reason: error instanceof Error ? error.message : 'L’archive locale ne correspond pas à sourceView.' };
  }

  try {
    if (!same(envelope.requestSnapshot, request)
      || !same(envelope.requestSnapshot.sourceView, request.sourceView)
      || !same(envelope.requestSnapshot.contextLaunch, request.contextLaunch)) {
      return { ...proofView, status: 'invalid', reason: 'La réponse V5 n’est pas celle de la RequestV3 conservée dans ce ticket.' };
    }
    verifyBrewerHopAdviceSemanticEvidenceV5(envelope, input.turnEvidence);
  } catch (error) {
    return { ...proofView, status: 'invalid', reason: error instanceof Error ? error.message : 'Référence RequestV3 illisible.' };
  }

  const currentSnapshot = projectHopV55SemanticPageContext(input.current, false);
  const contextCheck = compareHopV55SemanticAdviceContextAgainstSnapshot({
    launch: request.contextLaunch,
    serverRequestReadingReference: envelope.requestSnapshot.sourceReadingReference,
    serverProjection: envelope.serverContext.binding,
    stage: 'reception',
  }, currentSnapshot);

  let readerBaseline: HopV55SemanticAdviceReaderBaselineResultV1;
  if (contextCheck.history.status !== 'matched' || contextCheck.applicability.status !== 'current'
    || currentSnapshot.status !== 'ready') {
    readerBaseline = { status: 'withheld', reason: 'Le contexte A→Page courant n’est pas qualifié; aucune baseline A n’est recalculée sous un contexte différent.' };
  } else if (!isText(input.baselineRequestId) || input.candidatePolicy === undefined) {
    readerBaseline = { status: 'withheld', reason: 'La baseline fraîche attend un requestId local et une candidatePolicy explicites; le lecteur ne les invente pas.' };
  } else {
    try {
      const draft = prepareHopV55PropertyAdviceFromSemanticReadingV1({ reading: sourceArchive.reading,
        prepared: currentSnapshot.prepared, sourceReadingReference: sourceArchive.contentReference,
        requestId: input.baselineRequestId, ownerKey: sourceArchive.ownerKey,
        workspaceId: sourceArchive.workspaceId, candidatePolicy: input.candidatePolicy });
      if (draft.sourceReadingReference !== sourceArchive.contentReference
        || draft.ownerKey !== sourceArchive.ownerKey || draft.workspaceId !== sourceArchive.workspaceId
        || draft.requestSnapshot.originalQuestion !== request.question || draft.id !== input.baselineRequestId) {
        throw new Error('La baseline directe ne correspond pas à la question, l’archive ou au workspace source4.');
      }
      readerBaseline = { status: 'ready', draft: structuredClone(draft) };
    } catch (error) {
      readerBaseline = { status: 'unavailable', reason: error instanceof Error ? error.message : 'Baseline directe source4 indisponible.' };
    }
  }

  return {
    ...proofView,
    status: 'readOnly', envelope,
    sourceReadingReference: envelope.requestSnapshot.sourceReadingReference,
    contextCheck,
    sourcePropertyProjection: structuredClone(envelope.sourcePropertyProjection),
    readerBaseline,
    suggestions: {
      annotationReviews: structuredClone(envelope.proposal.annotationReviews),
      propertyIntentProposals: structuredClone(envelope.proposal.propertyIntentProposals),
      semanticRevisionProposals: structuredClone(envelope.proposal.semanticRevisionProposals),
    },
    answer: structuredClone(envelope.proposal.answer),
    runtimeGate: { status: 'notChecked', requiredChecks: ['ticket identity', 'operationId', 'generation'] as const },
  };
}

