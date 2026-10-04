import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { answerQualifiedHopAdvice, type HopAdviceAction } from '../../domain/hopDecision/qualifiedAdvice';
import { assertHopAdviceSituation } from '../../domain/hopDecision/adviceSchema';
import { loadHopCatalogueQualificationInput, type HopCatalogueLoaderInput, type HopAssembledCatalogueInput } from '../../domain/hopDecision/catalogueLoader';
import type { HopDecisionContext } from '../../domain/hopDecision/dossier';
import type { HopProcessStage } from '../../domain/hopDecision/types';
import type { HopDecisionIntent } from '../../domain/hopDecision/service';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { programFingerprint } from '../../domain/hopDecision/programs';
import {
  readHopV55DecisionReadingArchive,
} from './decisionArchive';
import { hopV55DecisionReadingScopesV1, isHopV55StructuredDecisionReadingArchive,
  type HopV55StructuredDecisionReadingArchive } from './decisionReadingAccessors';
import { projectHopV55QuestionScopeCoverageV1,
  type HopV55QuestionScopeCoverageV1, type HopV55QuestionScopeLedgerV1 } from './questionScopeReading';
import type { HopV55Workspace } from './contracts';
import { hopV55ScenarioRuntimeReference } from './scenarioCommit';
import {
  createHopV55QualifiedAdvicePreparationContextV1,
  createHopV55QualifiedStudyPreparationV1,
  type HopV55QualifiedAdvicePreparationContextV1,
  type HopV55QualifiedStudyPreparationV1,
} from './qualifiedStudyWorkspace';

export const HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V1_FORMAT = 'hop-v55-qualified-advice-study-preparation-v1' as const;
export const HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V2_FORMAT = 'hop-v55-qualified-advice-study-preparation-v2' as const;

export type HopV55QualifiedAdviceStudyPreparationRefusalCodeV1 =
  | 'invalidPreparationIdentity'
  | 'invalidWorkspace'
  | 'sourceReadingMissing'
  | 'sourceReadingInvalid'
  | 'sourceReadingUnsupported'
  | 'sourceActionMismatch'
  | 'runtimeReferenceStale'
  | 'sourceContextMismatch'
  | 'sourceProgramMismatch'
  | 'unknownStage'
  | 'stageMismatch'
  | 'futureStageNotAllowed'
  | 'materialScopeMissing'
  | 'materialScopeInvalid'
  | 'criteriaScopeInvalid'
  | 'qualificationInputInvalid'
  | 'studyInvalid';

export interface HopV55QualifiedAdviceFutureStageV1 {
  kind: 'futureExploration';
  stage: HopProcessStage;
  basis: string;
}

export interface HopV55QualifiedAdviceStudyFreshnessInputV1 {
  workspace: HopV55Workspace;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  /** Must be the Root/Page runtime reference for this same Prepared context. */
  expectedRuntimeReference: string;
  /** Explicit context; null means the host declared a standalone exploration. */
  sourceContext: HopDecisionContext | null;
  prepared: PreparedBrewingScenarioContext;
  /** Exact typed user scope. `materialIds: []` and `program: null` are explicit. */
  action: Omit<HopAdviceAction, 'qualification'>;
  /** Already-read catalogue inputs. The loader remains storage-free. */
  catalogueInput: HopCatalogueLoaderInput;
  /** Required if neither the source nor an explicitly supplied program establishes a stage. */
  explicitFutureStage?: HopV55QualifiedAdviceFutureStageV1;
}

export interface PrepareHopV55QualifiedAdviceStudyInputV1 extends HopV55QualifiedAdviceStudyFreshnessInputV1 {
  identity: { preparationId: string; dossierId: string; eventId: string; recordedAt: string };
}

export interface HopV55QualifiedAdviceStudyPreparationV1 {
  format: typeof HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V1_FORMAT;
  kind: 'advice';
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  sourceRuntimeReference: string;
  sourceContext: HopDecisionContext | null;
  sourceContextReference: string;
  qualificationInputReference: string;
  preparedReference: string;
  action: Omit<HopAdviceAction, 'qualification'>;
  explicitFutureStage?: HopV55QualifiedAdviceFutureStageV1;
  study: ReturnType<typeof answerQualifiedHopAdvice>;
  preparation: HopV55QualifiedStudyPreparationV1;
  advicePreparationContext?: HopV55QualifiedAdvicePreparationContextV1;
  reference: string;
}

/** V2 projection adds non-domain source-scope coverage without changing the persisted Runtime V1 create command. */
export interface HopV55QualifiedAdviceStudyPreparationV2 extends Omit<HopV55QualifiedAdviceStudyPreparationV1, 'format' | 'reference'> {
  format: typeof HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V2_FORMAT;
  scopeLedgerReference: string;
  scopeCoverage: HopV55QuestionScopeCoverageV1[];
  reference: string;
}

export type HopV55QualifiedAdviceStudyPreparation = HopV55QualifiedAdviceStudyPreparationV1 | HopV55QualifiedAdviceStudyPreparationV2;

export type PrepareHopV55QualifiedAdviceStudyResultV1 =
  | { status: 'ready'; result: HopV55QualifiedAdviceStudyPreparation }
  | { status: 'refused'; code: HopV55QualifiedAdviceStudyPreparationRefusalCodeV1; reason: string; snapshot?: unknown };

export type InspectHopV55QualifiedAdvicePreparedReferenceResultV1 =
  | { status: 'ready'; sourceReadingReference: string; sourceRuntimeReference: string; sourceContextReference: string;
      qualificationInputReference: string; preparedReference: string; materialIds: string[]; stage: HopProcessStage;
      scopeLedgerReference?: string; scopeIds?: string[] }
  | { status: 'refused'; code: HopV55QualifiedAdviceStudyPreparationRefusalCodeV1; reason: string; snapshot?: unknown };

/**
 * Q09 needs a structured reading with an exploreStrategies response, its exact
 * question, source and runtime, and optional scopes. V2, V3 and V4 offer that
 * capability; the preparation DTOs store only the opaque reading reference.
 * For a semantic V4 reading the study covers the projected criteria only; the
 * non-projected annotations stay visible on the reading, never claimed covered.
 */
type QualifiedAdviceSourceArchive = HopV55StructuredDecisionReadingArchive;

interface PreparedCore {
  archive: QualifiedAdviceSourceArchive;
  scopeLedger?: HopV55QuestionScopeLedgerV1;
  intent: HopDecisionIntent;
  qualificationInput: HopAssembledCatalogueInput;
  sourceContextReference: string;
  qualificationInputReference: string;
  preparedReference: string;
  stage: HopProcessStage;
}

const isRow = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const isStage = (value: unknown): value is HopProcessStage =>
  ['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'].includes(String(value));
const validInstant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));

function sameExact(left: unknown, right: unknown): boolean {
  return hopAdviceContentReference('hop-v55-qualified-advice-equality-v1', left)
    === hopAdviceContentReference('hop-v55-qualified-advice-equality-v1', right);
}

function validSourceContext(value: HopDecisionContext | null): boolean {
  if (value === null) return true;
  if (!isRow(value)) return false;
  if (value.kind === 'recipe') return Object.keys(value).every(key => ['kind', 'recipeId', 'recipeReference'].includes(key))
    && isText(value.recipeId) && isText(value.recipeReference);
  if (value.kind === 'batch') return Object.keys(value).every(key => ['kind', 'batchId', 'recipeId', 'recipeSnapshotReference',
    'brewDayRevision', 'programFingerprint', 'stage'].includes(key))
    && isText(value.batchId) && (value.recipeId === undefined || isText(value.recipeId))
    && isText(value.recipeSnapshotReference) && Number.isSafeInteger(value.brewDayRevision) && value.brewDayRevision >= 0
    && isText(value.programFingerprint) && isText(value.stage);
  return false;
}

function contextMatchesSource(workspace: HopV55Workspace, archive: QualifiedAdviceSourceArchive,
  context: HopDecisionContext | null): boolean {
  const source = archive.source;
  if (source.kind === 'exploration') return context === null;
  if (source.kind === 'recipe') return context?.kind === 'recipe' && context.recipeId === source.id
    && (workspace.sourceRecipeId === undefined || workspace.sourceRecipeId === source.id);
  if (source.kind === 'batch') return context?.kind === 'batch' && context.batchId === source.id
    && (workspace.sourceBatchId === undefined || workspace.sourceBatchId === source.id);
  if (source.kind === 'localRecipeCopy') {
    const copy = workspace.copies.find(row => row.id === source.copyId && row.recipe.id === source.recipeId);
    return source.workspaceId === workspace.id && context?.kind === 'recipe'
      && context.recipeId === source.recipeId && context.recipeReference === source.recipeReference
      && !!copy && hopDecisionReference(copy.recipe) === source.recipeReference;
  }
  const draft = workspace.futureDrafts?.find(row => row.draftId === source.draftId
    && row.revision === source.revision && row.contentReference === source.contentReference);
  return source.workspaceId === workspace.id && !!draft && context === null;
}

function sourceFutureDraft(workspace: HopV55Workspace, archive: QualifiedAdviceSourceArchive) {
  const source = archive.source;
  if (source.kind !== 'localFutureDraft') return undefined;
  return workspace.futureDrafts?.find(row => row.draftId === source.draftId
    && row.revision === source.revision && row.contentReference === source.contentReference);
}

type SourceStageResult =
  | { status: 'ready'; stage: HopProcessStage }
  | { status: 'refused'; code: HopV55QualifiedAdviceStudyPreparationRefusalCodeV1; reason: string };

function sourceStage(input: HopV55QualifiedAdviceStudyFreshnessInputV1,
  archive: QualifiedAdviceSourceArchive): SourceStageResult {
  const { action, prepared, sourceContext, explicitFutureStage } = input;
  if (archive.source.kind === 'batch') {
    if (explicitFutureStage) return { status: 'refused', code: 'futureStageNotAllowed',
      reason: 'Un batch réel ne peut pas être renommé en exploration future pour contourner son stade.' };
    if (sourceContext?.kind !== 'batch' || !isStage(sourceContext.stage)) {
      return { status: 'refused', code: 'unknownStage', reason: 'Le stade source du batch est absent ou inconnu; aucune valeur planning n’est substituée.' };
    }
    if (action.situation.stage !== sourceContext.stage) return { status: 'refused', code: 'stageMismatch',
      reason: 'Le stade de la stratégie diffère du batch source exact.' };
    if (action.situation.program && programFingerprint(action.situation.program) !== sourceContext.programFingerprint) {
      return { status: 'refused', code: 'sourceProgramMismatch', reason: 'Le programme de stratégie ne correspond pas à l’empreinte du batch source.' };
    }
    return { status: 'ready', stage: sourceContext.stage };
  }

  const draft = sourceFutureDraft(input.workspace, archive);
  const knownProgram = archive.source.kind === 'localFutureDraft' ? draft?.origin.sourceProgram
    : ['recipe', 'batch', 'localRecipeCopy'].includes(archive.source.kind) ? prepared.runtime.current?.program ?? undefined : undefined;
  if (archive.source.kind === 'localFutureDraft' && !draft) return { status: 'refused', code: 'sourceContextMismatch',
    reason: 'Le brouillon futur exact de la lecture n’est plus présent.' };
  if (archive.source.kind === 'localFutureDraft' && knownProgram && action.situation.program
    && programFingerprint(action.situation.program) !== programFingerprint(knownProgram)) {
    return { status: 'refused', code: 'sourceProgramMismatch', reason: 'Le programme du conseil diffère du programme du brouillon futur exact.' };
  }
  if (knownProgram && action.situation.program && programFingerprint(action.situation.program) !== programFingerprint(knownProgram)) {
    if (!explicitFutureStage || explicitFutureStage.stage !== action.situation.stage) {
      return { status: 'refused', code: 'sourceProgramMismatch',
        reason: 'Le programme choisi diffère du programme source; déclare explicitement une exploration future distincte.' };
    }
  }
  if (knownProgram && !explicitFutureStage) {
    if (action.situation.stage !== knownProgram.stage) return { status: 'refused', code: 'stageMismatch',
      reason: 'Le stade de la stratégie diffère du programme source exact.' };
    return { status: 'ready', stage: knownProgram.stage };
  }
  if (explicitFutureStage) {
    if (archive.source.kind === 'localFutureDraft') {
      if (explicitFutureStage.stage !== draft?.origin.sourceProgram.stage || action.situation.stage !== explicitFutureStage.stage) {
        return { status: 'refused', code: 'stageMismatch', reason: 'Un brouillon futur conserve le stade de son programme source exact.' };
      }
      return { status: 'ready', stage: draft.origin.sourceProgram.stage };
    }
    if (!isStage(explicitFutureStage.stage) || !isText(explicitFutureStage.basis)
      || action.situation.stage !== explicitFutureStage.stage) {
      return { status: 'refused', code: 'stageMismatch', reason: 'La déclaration d’exploration future ne correspond pas au stade demandé.' };
    }
    return { status: 'ready', stage: explicitFutureStage.stage };
  }
  return { status: 'refused', code: 'unknownStage',
    reason: 'Aucun programme ou stade connu ne justifie cette étude; déclare explicitement une exploration future.' };
}

function validateAction(input: HopV55QualifiedAdviceStudyFreshnessInputV1, intent: HopDecisionIntent):
  | { status: 'ready'; stage: HopProcessStage; materialIds: string[] }
  | { status: 'refused'; code: HopV55QualifiedAdviceStudyPreparationRefusalCodeV1; reason: string } {
  if (input.action.kind !== 'exploreStrategies' || !isRow(input.action.situation)) {
    return { status: 'refused', code: 'sourceActionMismatch', reason: 'Le raccord Q09 exige une action exploreStrategies typée.' };
  }
  const situation = input.action.situation;
  if (!Object.prototype.hasOwnProperty.call(situation, 'materialIds') || !Array.isArray(situation.materialIds)) {
    return { status: 'refused', code: 'materialScopeMissing', reason: 'Le périmètre de matières doit être explicite, y compris `[]`.' };
  }
  if (!Object.prototype.hasOwnProperty.call(situation, 'program')) {
    return { status: 'refused', code: 'sourceProgramMismatch', reason: 'Le programme doit être fourni explicitement, ou être null.' };
  }
  if (!isStage(situation.stage)) return { status: 'refused', code: 'unknownStage', reason: 'Le stade de stratégie doit être un stade domaine explicite.' };
  if (situation.materialIds.some(id => !isText(id)) || new Set(situation.materialIds).size !== situation.materialIds.length) {
    return { status: 'refused', code: 'materialScopeInvalid', reason: 'Le périmètre de matières contient un ID vide ou répété.' };
  }
  const criterionIds = new Set((intent.criteria ?? []).map(criterion => criterion.id));
  if (!Array.isArray(situation.criterionDimensions)
    || situation.criterionDimensions.some(row => !criterionIds.has(row.criterionId))) {
    return { status: 'refused', code: 'criteriaScopeInvalid', reason: 'Une dimension de critère ne référence pas une intention exacte de la lecture archivée.' };
  }
  try { assertHopAdviceSituation(situation); }
  catch (error) { return { status: 'refused', code: 'criteriaScopeInvalid', reason: `Situation de conseil invalide : ${(error as Error).message}` }; }
  return { status: 'ready', stage: situation.stage, materialIds: [...situation.materialIds] };
}

interface ValidatedSourceV1 {
  workspace: HopV55Workspace;
  archive: QualifiedAdviceSourceArchive;
  scopeLedger?: HopV55QuestionScopeLedgerV1;
  intent: HopDecisionIntent;
  sourceContext: HopDecisionContext | null;
  action: Omit<HopAdviceAction, 'qualification'>;
  stage: HopProcessStage;
  materialIds: string[];
}

type CoreResultV1 =
  | { status: 'ready'; core: ValidatedSourceV1; qualificationInput: HopAssembledCatalogueInput; sourceContextReference: string;
      qualificationInputReference: string; preparedReference: string }
  | { status: 'refused'; refusal: Extract<PrepareHopV55QualifiedAdviceStudyResultV1, { status: 'refused' }> };

async function loadQualifiedAdviceCore(input: HopV55QualifiedAdviceStudyFreshnessInputV1): Promise<CoreResultV1> {
  if (!isRow(input) || !isRow(input.workspace) || !isText(input.ownerKey) || !isText(input.workspaceId)
    || !isText(input.sourceReadingReference) || !isText(input.expectedRuntimeReference)
    || !isRow(input.prepared) || !isRow(input.catalogueInput)
    || !Object.prototype.hasOwnProperty.call(input, 'sourceContext') || !validSourceContext(input.sourceContext)
    || !isRow(input.action) || !isRow(input.action.situation)) {
    return { status: 'refused', refusal: { status: 'refused', code: 'invalidPreparationIdentity',
      reason: 'Workspace, lecture, Prepared, action, catalogue et sourceContext explicites sont requis.' } };
  }
  if (input.workspace.ownerKey !== input.ownerKey || input.workspace.id !== input.workspaceId) {
    return { status: 'refused', refusal: { status: 'refused', code: 'invalidWorkspace', reason: 'Le workspace courant diffère de l’owner ou de l’identifiant fourni.' } };
  }
  if (hopV55ScenarioRuntimeReference(input.prepared.runtime) !== input.expectedRuntimeReference) {
    return { status: 'refused', refusal: { status: 'refused', code: 'runtimeReferenceStale', reason: 'Le runtime préparé a changé depuis la lecture; relis avant de lancer un conseil.' } };
  }
  const rawArchive = input.workspace.decisionReadings?.find(row => isRow(row) && row.contentReference === input.sourceReadingReference);
  if (!rawArchive) return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingMissing', reason: 'La lecture source exacte est absente du workspace.' } };
  const archiveRead = readHopV55DecisionReadingArchive(rawArchive);
  if (archiveRead.status === 'unsupportedFormat') return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingUnsupported',
    reason: `Format source futur conservé en lecture seule (${archiveRead.format}).`, snapshot: archiveRead.raw } };
  if (archiveRead.status !== 'available') return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingInvalid',
    reason: archiveRead.reason, snapshot: structuredClone(rawArchive) } };
  const decoded = archiveRead.archive;
  if (!isHopV55StructuredDecisionReadingArchive(decoded)
    || decoded.ownerKey !== input.ownerKey || decoded.workspaceId !== input.workspaceId || decoded.contentReference !== input.sourceReadingReference) {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingInvalid',
      reason: 'Une étude Q09 exige la référence structurée V2/V3/V4 exacte dans le workspace owner courant.', snapshot: structuredClone(decoded) } };
  }
  const archive = decoded;
  if (archive.runtimeReference !== input.expectedRuntimeReference) return { status: 'refused', refusal: { status: 'refused',
    code: 'runtimeReferenceStale', reason: 'La référence runtime archivée diffère du runtime courant.' } };
  if (!contextMatchesSource(input.workspace, archive, input.sourceContext)) return { status: 'refused', refusal: { status: 'refused',
    code: 'sourceContextMismatch', reason: 'Le contexte fourni ne correspond pas à la recette, au batch ou au brouillon exact de la lecture.' } };
  const response = archive.reading.response;
  if (!response || response.actionKind !== 'exploreStrategies'
    || response.intent.originalQuestion !== archive.reading.intent.question) return { status: 'refused', refusal: { status: 'refused',
    code: 'sourceActionMismatch', reason: 'La source doit conserver une réponse exploreStrategies et la question originale exacte.' } };
  const intent = structuredClone(response.intent);
  const actionCheck = validateAction(input, intent);
  if (actionCheck.status !== 'ready') return { status: 'refused', refusal: actionCheck };
  const stageResult = sourceStage(input, archive);
  if (stageResult.status !== 'ready') return { status: 'refused', refusal: { status: 'refused',
    code: stageResult.code, reason: stageResult.reason } };
  if (stageResult.stage !== input.action.situation.stage) return { status: 'refused', refusal: { status: 'refused',
    code: 'stageMismatch', reason: 'Le stade de stratégie diffère du programme/batch source exact.' } };

  let qualificationInput: HopAssembledCatalogueInput;
  try { qualificationInput = await loadHopCatalogueQualificationInput(structuredClone(input.catalogueInput)); }
  catch (error) { return { status: 'refused', refusal: { status: 'refused', code: 'qualificationInputInvalid',
    reason: `Le snapshot de qualification ne peut pas être chargé : ${(error as Error).message}` } }; }
  const sourceContextReference = hopAdviceContentReference('hop-v55-qualified-advice-source-context-v1', input.sourceContext);
  const qualificationInputReference = hopAdviceContentReference('hop-v55-qualified-advice-qualification-input-v1', qualificationInput);
  const preparedReference = hopAdviceContentReference('hop-v55-qualified-advice-prepared-v1', {
    sourceReadingReference: archive.contentReference, sourceRuntimeReference: archive.runtimeReference,
    sourceContext: input.sourceContext, qualificationInput, intent, action: input.action,
    ...(input.explicitFutureStage ? { explicitFutureStage: input.explicitFutureStage } : {}),
  });
  const scopes = hopV55DecisionReadingScopesV1(archive);
  return { status: 'ready', core: { workspace: input.workspace, archive,
    ...(scopes ? { scopeLedger: scopes.scopeLedger } : {}),
    intent, sourceContext: structuredClone(input.sourceContext),
    action: structuredClone(input.action), stage: actionCheck.stage, materialIds: actionCheck.materialIds },
    qualificationInput, sourceContextReference, qualificationInputReference, preparedReference };
}

export async function inspectHopV55QualifiedAdvicePreparedReferenceV1(
  input: HopV55QualifiedAdviceStudyFreshnessInputV1,
): Promise<InspectHopV55QualifiedAdvicePreparedReferenceResultV1> {
  const loaded = await loadQualifiedAdviceCore(input);
  if (loaded.status !== 'ready') return loaded.refusal;
  return { status: 'ready', sourceReadingReference: loaded.core.archive.contentReference,
    sourceRuntimeReference: loaded.core.archive.runtimeReference, sourceContextReference: loaded.sourceContextReference,
    qualificationInputReference: loaded.qualificationInputReference, preparedReference: loaded.preparedReference,
    materialIds: [...loaded.core.materialIds], stage: loaded.core.stage,
    ...(loaded.core.scopeLedger ? { scopeLedgerReference: loaded.core.scopeLedger.reference,
      scopeIds: loaded.core.scopeLedger.sourceScopes.map(scope => scope.id) } : {}) };
}

export async function prepareHopV55QualifiedAdviceStudyV1(
  input: PrepareHopV55QualifiedAdviceStudyInputV1,
): Promise<PrepareHopV55QualifiedAdviceStudyResultV1> {
  const loaded = await loadQualifiedAdviceCore(input);
  if (loaded.status !== 'ready') return loaded.refusal;
  const identity = input.identity;
  if (!isText(identity?.preparationId) || !isText(identity.dossierId) || !isText(identity.eventId) || !validInstant(identity.recordedAt)) {
    return { status: 'refused', code: 'invalidPreparationIdentity', reason: 'Les IDs et date de préparation/dossier/événement doivent être fournis par le geste hôte.' };
  }
  let study: ReturnType<typeof answerQualifiedHopAdvice>;
  try {
    study = answerQualifiedHopAdvice({ intent: loaded.core.intent, action: loaded.core.action,
      qualificationInput: loaded.qualificationInput, context: loaded.core.sourceContext });
  } catch (error) {
    return { status: 'refused', code: 'studyInvalid', reason: `Le conseil qualifié a refusé l’entrée typée : ${(error as Error).message}` };
  }
  const preparation = createHopV55QualifiedStudyPreparationV1({ id: identity.preparationId,
    ownerKey: input.ownerKey, workspaceId: input.workspaceId, sourceReadingReference: loaded.core.archive.contentReference,
    preparedReference: loaded.preparedReference,
    ...(input.explicitFutureStage ? { advicePreparationContext: createHopV55QualifiedAdvicePreparationContextV1({
      explicitFutureStage: input.explicitFutureStage,
    }) } : {}),
    createCommand: { kind: 'advice', ownerKey: input.ownerKey, dossierId: identity.dossierId,
      eventId: identity.eventId, recordedAt: identity.recordedAt, study } });
  const common = {
    kind: 'advice' as const,
    ownerKey: input.ownerKey, workspaceId: input.workspaceId, sourceReadingReference: loaded.core.archive.contentReference,
    sourceRuntimeReference: loaded.core.archive.runtimeReference, sourceContext: structuredClone(loaded.core.sourceContext),
    sourceContextReference: loaded.sourceContextReference, qualificationInputReference: loaded.qualificationInputReference,
    preparedReference: loaded.preparedReference, action: structuredClone(loaded.core.action),
    ...(input.explicitFutureStage ? { explicitFutureStage: structuredClone(input.explicitFutureStage) } : {}),
    study: structuredClone(study), preparation,
    ...(preparation.advicePreparationContext ? { advicePreparationContext: structuredClone(preparation.advicePreparationContext) } : {}),
  };
  if (loaded.core.scopeLedger) {
    const question = loaded.core.archive.reading.intent.question;
    const scopeCoverage = projectHopV55QuestionScopeCoverageV1({ ledger: loaded.core.scopeLedger, question,
      reading: loaded.core.archive.reading, study });
    const body: Omit<HopV55QualifiedAdviceStudyPreparationV2, 'reference'> = {
      ...common, format: HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V2_FORMAT,
      scopeLedgerReference: loaded.core.scopeLedger.reference, scopeCoverage,
    };
    return { status: 'ready', result: { ...body,
      reference: hopAdviceContentReference(HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V2_FORMAT, body) } };
  }
  const body: Omit<HopV55QualifiedAdviceStudyPreparationV1, 'reference'> = {
    ...common, format: HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V1_FORMAT,
  };
  return { status: 'ready', result: { ...body,
    reference: hopAdviceContentReference(HOP_V55_QUALIFIED_ADVICE_STUDY_PREPARATION_V1_FORMAT, body) } };
}
