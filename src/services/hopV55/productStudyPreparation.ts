import type { HopDecisionContext, HopDecisionStudySnapshotV2 } from '../../domain/hopDecision/dossier';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { loadHopCatalogueQualificationInput, type HopAssembledCatalogueInput, type HopCatalogueLoaderInput } from '../../domain/hopDecision/catalogueLoader';
import { answerQualifiedHopDecision } from '../../domain/hopDecision/qualifiedDecision';
import type { HopDecisionResponse } from '../../domain/hopDecision/service';
import {
  HOP_V55_DECISION_READING_FORMAT_V2,
  HOP_V55_DECISION_READING_FORMAT_V3,
  HOP_V55_DECISION_READING_FORMAT_V4,
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchiveV2,
  type HopV55DecisionReadingArchiveV3,
  type HopV55DecisionReadingArchiveV4,
  type HopV55DecisionReadingSource,
} from './decisionArchive';
import type { HopV55QuestionReading } from './decision';
import type { HopV55SemanticQuestionReadingV1 } from './questionSemanticReading';
import type { HopV55QuestionScopeLedgerV1, HopV55QuestionScopeTransitionV1 } from './questionScopeReading';
import type { HopV55Workspace } from './contracts';
import {
  createHopV55QualifiedStudyPreparationV1,
  type HopV55QualifiedStudyPreparationV1,
} from './qualifiedStudyWorkspace';

export const HOP_V55_PRODUCT_STUDY_PREPARATION_V1_FORMAT = 'hop-v55-product-study-preparation-v1' as const;
/** V2 is the explicit evolution for a semantic V4 source reading; V1 keeps its closed V2/V3 list. */
export const HOP_V55_PRODUCT_STUDY_PREPARATION_V2_FORMAT = 'hop-v55-product-study-preparation-v2' as const;
export type HopV55ProductStudySourceReadingFormatV1 = typeof HOP_V55_DECISION_READING_FORMAT_V2 | typeof HOP_V55_DECISION_READING_FORMAT_V3;
export type HopV55ProductStudySourceReadingFormatV2 = typeof HOP_V55_DECISION_READING_FORMAT_V4;
type HopV55ProductStudySourceArchiveV1 = HopV55DecisionReadingArchiveV2 | HopV55DecisionReadingArchiveV3;
type ProductStudySourceArchive = HopV55ProductStudySourceArchiveV1 | HopV55DecisionReadingArchiveV4;
type ProductStudyRoute = 'v1' | 'v2';

export type HopV55ProductStudyPreparationRefusalCodeV1 =
  | 'invalidWorkspace'
  | 'sourceReadingMissing'
  | 'sourceReadingInvalid'
  | 'sourceReadingUnsupported'
  | 'sourceActionMismatch'
  | 'sourceProductsEmpty'
  | 'requestedProductScopeMissing'
  | 'requestedProductScopeInvalid'
  | 'requestedProductNotDisplayed'
  | 'runtimeReferenceStale'
  | 'sourceContextMismatch'
  | 'invalidPreparationIdentity';

export interface HopV55ProductStudyPreparationV1 {
  format: typeof HOP_V55_PRODUCT_STUDY_PREPARATION_V1_FORMAT;
  kind: 'products';
  workspaceId: string;
  ownerKey: string;
  sourceReadingReference: string;
  sourceReadingFormat: HopV55ProductStudySourceReadingFormatV1;
  /** Exact V2-shaped reading read from the immutable source archive; never reparsed for a product study. */
  sourceReading: HopV55QuestionReading;
  /** Present only for V3 archives; the strict archive reader has validated its seal and relations. */
  scopeLedger?: HopV55QuestionScopeLedgerV1;
  scopeLedgerReference?: string;
  scopeTransition?: HopV55QuestionScopeTransitionV1;
  sourceRuntimeReference: string;
  /** Current source context passed explicitly by the host, including explicit null for standalone. */
  sourceContext: HopDecisionContext | null;
  sourceContextReference: string;
  /** Qualification is performed over this exact loaded snapshot, not a flattened materials map. */
  qualificationInputReference: string;
  displayedProductIds: string[];
  /** Explicit IDs selected from cards actually shown by the source reading. */
  requestedProductIds: string[];
  preparedReference: string;
  study: HopDecisionStudySnapshotV2<'understandProducts'>;
  blockingIssues: HopDecisionStudySnapshotV2<'understandProducts'>['blockingIssues'];
  preparation: HopV55QualifiedStudyPreparationV1;
  reference: string;
}

/** Same product study from a semantic V4 reading; its annotations stay typed, never reduced to V2 drafts. */
export interface HopV55ProductStudyPreparationV2 extends Omit<HopV55ProductStudyPreparationV1, 'format' | 'sourceReadingFormat' | 'sourceReading'> {
  format: typeof HOP_V55_PRODUCT_STUDY_PREPARATION_V2_FORMAT;
  sourceReadingFormat: HopV55ProductStudySourceReadingFormatV2;
  sourceReading: HopV55SemanticQuestionReadingV1;
}

export type HopV55ProductStudyPreparation = HopV55ProductStudyPreparationV1 | HopV55ProductStudyPreparationV2;

export type PrepareHopV55ProductStudyResultV1 =
  | { status: 'ready'; result: HopV55ProductStudyPreparationV1 }
  | { status: 'refused'; code: HopV55ProductStudyPreparationRefusalCodeV1; reason: string; snapshot?: unknown };

export type PrepareHopV55ProductStudyResultV2 =
  | { status: 'ready'; result: HopV55ProductStudyPreparationV2 }
  | { status: 'refused'; code: HopV55ProductStudyPreparationRefusalCodeV1; reason: string; snapshot?: unknown };

export interface HopV55ProductStudyFreshnessInputV1 {
  /** Read-only workspace snapshot. This function never persists or mutates it. */
  workspace: HopV55Workspace;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  /** Root supplies the current prepared runtime reference; it must match the sealed source reading. */
  expectedRuntimeReference: string;
  /** Explicit IDs from the product cards shown to the brewer at the save-study gesture. */
  requestedProductIds: readonly string[];
  /** Required property: null is an explicit standalone context, never inferred from missing identifiers. */
  sourceContext: HopDecisionContext | null;
  /** Already-read saved rows and exact associated variants; the loader itself remains storage-free. */
  catalogueInput: HopCatalogueLoaderInput;
}

export interface PrepareHopV55ProductStudyInputV1 extends HopV55ProductStudyFreshnessInputV1 {
  /** All command IDs and timestamp are allocated by Root at the user gesture. */
  identity: {
    preparationId: string;
    dossierId: string;
    eventId: string;
    recordedAt: string;
  };
}

export interface InspectHopV55ProductStudyPreparedReferenceV1 {
  status: 'ready';
  sourceReadingReference: string;
  sourceReadingFormat: HopV55ProductStudySourceReadingFormatV1;
  sourceReading: HopV55QuestionReading;
  scopeLedger?: HopV55QuestionScopeLedgerV1;
  scopeLedgerReference?: string;
  scopeTransition?: HopV55QuestionScopeTransitionV1;
  sourceRuntimeReference: string;
  sourceContextReference: string;
  qualificationInputReference: string;
  displayedProductIds: string[];
  requestedProductIds: string[];
  preparedReference: string;
}

export interface InspectHopV55ProductStudyPreparedReferenceV2
  extends Omit<InspectHopV55ProductStudyPreparedReferenceV1, 'sourceReadingFormat' | 'sourceReading'> {
  sourceReadingFormat: HopV55ProductStudySourceReadingFormatV2;
  sourceReading: HopV55SemanticQuestionReadingV1;
}

export type InspectHopV55ProductStudyPreparedReferenceResultV1 =
  | InspectHopV55ProductStudyPreparedReferenceV1
  | { status: 'refused'; code: HopV55ProductStudyPreparationRefusalCodeV1; reason: string; snapshot?: unknown };

export type InspectHopV55ProductStudyPreparedReferenceResultV2 =
  | InspectHopV55ProductStudyPreparedReferenceV2
  | { status: 'refused'; code: HopV55ProductStudyPreparationRefusalCodeV1; reason: string; snapshot?: unknown };

type ProductStudyRefusal = { status: 'refused'; code: HopV55ProductStudyPreparationRefusalCodeV1; reason: string; snapshot?: unknown };

const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

function validSourceContext(value: HopDecisionContext | null): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if (value.kind === 'recipe') {
    return Object.keys(value).every(key => ['kind', 'recipeId', 'recipeReference'].includes(key))
      && isText(value.recipeId) && isText(value.recipeReference);
  }
  if (value.kind === 'batch') {
    return Object.keys(value).every(key => ['kind', 'batchId', 'recipeId', 'recipeSnapshotReference', 'brewDayRevision', 'programFingerprint', 'stage'].includes(key))
      && isText(value.batchId) && (value.recipeId === undefined || isText(value.recipeId))
      && isText(value.recipeSnapshotReference) && Number.isSafeInteger(value.brewDayRevision) && value.brewDayRevision >= 0
      && isText(value.programFingerprint) && isText(value.stage);
  }
  return false;
}

function validInstant(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    && Number.isFinite(Date.parse(value));
}

function isUnderstandProductsResponse(value: HopDecisionResponse | undefined): value is HopDecisionResponse<'understandProducts'> {
  const result: unknown = value?.result;
  return !!value && value.actionKind === 'understandProducts' && isRecord(result) && Array.isArray(result.products);
}

function sourceContextReferenceV1(sourceContext: HopDecisionContext | null): string {
  return hopAdviceContentReference('hop-v55-product-study-source-context-v1', sourceContext);
}

function qualificationInputReferenceV1(qualificationInput: HopAssembledCatalogueInput): string {
  return hopAdviceContentReference('hop-v55-product-study-qualification-input-v1', qualificationInput);
}

/** Content fingerprint only; it is neither a freshness authorization nor a proof of persistence. */
export function hopV55ProductStudyPreparedReferenceV1(input: {
  sourceReadingReference: string;
  sourceReadingFormat: HopV55ProductStudySourceReadingFormatV1;
  scopeLedgerReference: string | null;
  scopeTransitionReference: string | null;
  sourceRuntimeReference: string;
  sourceContext: HopDecisionContext | null;
  qualificationInput: HopAssembledCatalogueInput;
  requestedProductIds: readonly string[];
}): string {
  return hopAdviceContentReference('hop-v55-product-study-prepared-v1', {
    sourceReadingReference: input.sourceReadingReference,
    sourceReadingFormat: input.sourceReadingFormat,
    scopeLedgerReference: input.scopeLedgerReference,
    scopeTransitionReference: input.scopeTransitionReference,
    runtimeReference: input.sourceRuntimeReference,
    sourceContext: input.sourceContext,
    qualificationInput: input.qualificationInput,
    requestedProductIds: [...input.requestedProductIds],
  });
}

/** Fingerprint of a product study prepared from a semantic V4 reading; a separate kind keeps V1 values unchanged. */
export function hopV55ProductStudyPreparedReferenceV2(input: Omit<Parameters<typeof hopV55ProductStudyPreparedReferenceV1>[0], 'sourceReadingFormat'>
  & { sourceReadingFormat: HopV55ProductStudySourceReadingFormatV2 }): string {
  return hopAdviceContentReference('hop-v55-product-study-prepared-v2', {
    sourceReadingReference: input.sourceReadingReference,
    sourceReadingFormat: input.sourceReadingFormat,
    scopeLedgerReference: input.scopeLedgerReference,
    scopeTransitionReference: input.scopeTransitionReference,
    runtimeReference: input.sourceRuntimeReference,
    sourceContext: input.sourceContext,
    qualificationInput: input.qualificationInput,
    requestedProductIds: [...input.requestedProductIds],
  });
}

function contextMatchesSource(workspace: HopV55Workspace, source: HopV55DecisionReadingSource, context: HopDecisionContext | null): boolean {
  if (source.kind === 'exploration') return context === null;
  if (source.kind === 'recipe') {
    return context?.kind === 'recipe' && context.recipeId === source.id
      && (workspace.sourceRecipeId === undefined || workspace.sourceRecipeId === source.id);
  }
  if (source.kind === 'batch') {
    return context?.kind === 'batch' && context.batchId === source.id
      && (workspace.sourceBatchId === undefined || workspace.sourceBatchId === source.id);
  }
  if (source.kind === 'localRecipeCopy') {
    const copy = workspace.copies.find(row => row.id === source.copyId && row.recipe.id === source.recipeId);
    return source.workspaceId === workspace.id && context?.kind === 'recipe'
      && context.recipeId === source.recipeId && context.recipeReference === source.recipeReference
      && !!copy && hopDecisionReference(copy.recipe) === source.recipeReference;
  }
  const draft = workspace.futureDrafts?.find(row => row.draftId === source.draftId
    && row.revision === source.revision && row.contentReference === source.contentReference);
  // A future draft is hypothetical, not a physical recipe or batch context.
  return source.workspaceId === workspace.id && !!draft && context === null;
}

interface ValidatedProductStudySourceV1 {
  workspace: HopV55Workspace;
  archive: ProductStudySourceArchive;
  productResponse: HopDecisionResponse<'understandProducts'>;
  displayedProductIds: string[];
  requestedProductIds: string[];
  sourceContext: HopDecisionContext | null;
}

interface LoadedProductStudyReferenceV1 extends ValidatedProductStudySourceV1 {
  qualificationInput: HopAssembledCatalogueInput;
  sourceContextReference: string;
  qualificationInputReference: string;
  preparedReference: string;
}

type ProductStudyInspectionCoreV1 =
  | { status: 'ready'; core: LoadedProductStudyReferenceV1 }
  | { status: 'refused'; refusal: ProductStudyRefusal };

function routeAccepts(route: ProductStudyRoute, archive: ProductStudySourceArchive): boolean {
  return route === 'v2' ? archive.format === HOP_V55_DECISION_READING_FORMAT_V4
    : archive.format === HOP_V55_DECISION_READING_FORMAT_V2 || archive.format === HOP_V55_DECISION_READING_FORMAT_V3;
}

function scopesOf(archive: ProductStudySourceArchive): { scopeLedger: HopV55QuestionScopeLedgerV1; transition: HopV55QuestionScopeTransitionV1 } | undefined {
  if (archive.format === HOP_V55_DECISION_READING_FORMAT_V3) return { scopeLedger: archive.scopeLedger, transition: archive.transition };
  if (archive.format === HOP_V55_DECISION_READING_FORMAT_V4 && archive.scopeLedger && archive.transition) {
    return { scopeLedger: archive.scopeLedger, transition: archive.transition };
  }
  return undefined;
}

function validateProductStudySourceV1(input: HopV55ProductStudyFreshnessInputV1, route: ProductStudyRoute):
  | { status: 'ready'; source: ValidatedProductStudySourceV1 }
  | { status: 'refused'; refusal: ProductStudyRefusal } {
  if (!isRecord(input) || !isRecord(input.workspace)
    || !isText(input.ownerKey) || !isText(input.workspaceId)
    || !isText(input.sourceReadingReference) || !isText(input.expectedRuntimeReference)
    || !isRecord(input.catalogueInput)
    || !Object.prototype.hasOwnProperty.call(input, 'sourceContext')
    || !validSourceContext(input.sourceContext)) {
    return { status: 'refused', refusal: { status: 'refused', code: 'invalidPreparationIdentity', reason: 'Workspace, contexte explicite et références de lecture valides sont requis.' } };
  }
  if (input.workspace.ownerKey !== input.ownerKey || input.workspace.id !== input.workspaceId) {
    return { status: 'refused', refusal: { status: 'refused', code: 'invalidWorkspace', reason: 'La préparation ne correspond pas à l’owner/workspace courant.' } };
  }

  const rawArchive = input.workspace.decisionReadings?.find(row => isRecord(row)
    && row.contentReference === input.sourceReadingReference);
  if (!rawArchive) {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingMissing', reason: 'La lecture source exacte n’est pas présente dans le workspace.' } };
  }
  const archived = readHopV55DecisionReadingArchive(rawArchive);
  if (archived.status === 'unsupportedFormat') {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingUnsupported', reason: `Format de lecture future conservé en lecture seule (${archived.format}).`, snapshot: archived.raw } };
  }
  if (archived.status !== 'available') {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingInvalid', reason: archived.reason, snapshot: structuredClone(rawArchive) } };
  }
  const archive = archived.archive;
  if (archive.format === HOP_V55_DECISION_READING_FORMAT_V4 && route === 'v1') {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingUnsupported',
      reason: 'Une lecture sémantique V4 passe par la préparation produit V2; le DTO V1 garde sa liste fermée V2/V3.' } };
  }
  if ((archive.format === HOP_V55_DECISION_READING_FORMAT_V2 || archive.format === HOP_V55_DECISION_READING_FORMAT_V3) && route === 'v2') {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingUnsupported',
      reason: 'Une lecture historique V2/V3 garde la préparation produit V1; aucune promotion implicite vers V4.' } };
  }
  if (archive.format === 'hop-v55-decision-reading-v1' || !routeAccepts(route, archive)
    || archive.ownerKey !== input.ownerKey || archive.workspaceId !== input.workspaceId
    || archive.contentReference !== input.sourceReadingReference) {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingInvalid', reason: 'La lecture structurée ne correspond pas au workspace/owner et à sa référence exacte.', snapshot: structuredClone(archive) } };
  }
  if (archive.runtimeReference !== input.expectedRuntimeReference) {
    return { status: 'refused', refusal: { status: 'refused', code: 'runtimeReferenceStale', reason: 'Le runtime préparé a changé depuis la lecture source; relire la demande avant de créer une nouvelle étude.' } };
  }

  const response = archive.reading.response;
  if (!isUnderstandProductsResponse(response)) {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceActionMismatch', reason: 'La lecture source n’est pas une réponse produit understandProducts.' } };
  }
  const productResponse = response;
  if (productResponse.intent.originalQuestion !== archive.reading.intent.question) {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingInvalid', reason: 'La réponse produit ne conserve pas la question originale exacte.' } };
  }
  const displayedProductIds = productResponse.result.products.map(product => product.id);
  if (displayedProductIds.some(id => !isText(id)) || new Set(displayedProductIds).size !== displayedProductIds.length) {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceReadingInvalid', reason: 'Les identités de produits affichées ne sont pas uniques et exactes.' } };
  }
  if (displayedProductIds.length === 0) {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceProductsEmpty', reason: 'La lecture archivée ne montre aucune fiche produit à conserver.' } };
  }
  if (!Array.isArray(input.requestedProductIds) || input.requestedProductIds.length === 0) {
    return { status: 'refused', refusal: { status: 'refused', code: 'requestedProductScopeMissing', reason: 'Le geste doit fournir explicitement les IDs des fiches produit affichées à conserver.' } };
  }
  if (input.requestedProductIds.some(id => !isText(id))
    || new Set(input.requestedProductIds).size !== input.requestedProductIds.length) {
    return { status: 'refused', refusal: { status: 'refused', code: 'requestedProductScopeInvalid', reason: 'Le périmètre produit explicite contient une identité vide ou dupliquée.' } };
  }
  if (input.requestedProductIds.some(id => !displayedProductIds.includes(id))) {
    return { status: 'refused', refusal: { status: 'refused', code: 'requestedProductNotDisplayed', reason: 'Le périmètre demandé contient un produit qui n’est pas affiché par la lecture source exacte.' } };
  }
  if (!contextMatchesSource(input.workspace, archive.source, input.sourceContext)) {
    return { status: 'refused', refusal: { status: 'refused', code: 'sourceContextMismatch', reason: 'Le contexte produit ne correspond pas à la source recipe/batch/copiedraft de la lecture; aucune matière n’est substituée.' } };
  }

  return {
    status: 'ready',
    source: {
      workspace: input.workspace,
      archive,
      productResponse,
      displayedProductIds,
      requestedProductIds: [...input.requestedProductIds],
      sourceContext: structuredClone(input.sourceContext),
    },
  };
}

async function inspectProductStudyCoreV1(input: HopV55ProductStudyFreshnessInputV1, route: ProductStudyRoute): Promise<ProductStudyInspectionCoreV1> {
  const validated = validateProductStudySourceV1(input, route);
  if (validated.status !== 'ready') return validated;
  const qualificationInput = await loadHopCatalogueQualificationInput(structuredClone(input.catalogueInput));
  const sourceContextReference = sourceContextReferenceV1(validated.source.sourceContext);
  const qualificationInputReference = qualificationInputReferenceV1(qualificationInput);
  const archive = validated.source.archive;
  const scopes = scopesOf(archive);
  const common = {
    sourceReadingReference: archive.contentReference,
    scopeLedgerReference: scopes ? scopes.scopeLedger.reference : null,
    scopeTransitionReference: scopes ? hopAdviceContentReference('hop-v55-product-study-scope-transition-v1', scopes.transition) : null,
    sourceRuntimeReference: archive.runtimeReference,
    sourceContext: validated.source.sourceContext,
    qualificationInput,
    requestedProductIds: validated.source.requestedProductIds,
  };
  const preparedReference = archive.format === HOP_V55_DECISION_READING_FORMAT_V4
    ? hopV55ProductStudyPreparedReferenceV2({ ...common, sourceReadingFormat: archive.format })
    : hopV55ProductStudyPreparedReferenceV1({ ...common, sourceReadingFormat: archive.format as HopV55ProductStudySourceReadingFormatV1 });
  return {
    status: 'ready',
    core: { ...validated.source, qualificationInput, sourceContextReference, qualificationInputReference, preparedReference },
  };
}

function inspectedFields(core: LoadedProductStudyReferenceV1) {
  const scopes = scopesOf(core.archive);
  return {
    sourceReadingReference: core.archive.contentReference,
    ...(scopes ? {
      scopeLedger: structuredClone(scopes.scopeLedger),
      scopeLedgerReference: scopes.scopeLedger.reference,
      scopeTransition: structuredClone(scopes.transition),
    } : {}),
    sourceRuntimeReference: core.archive.runtimeReference,
    sourceContextReference: core.sourceContextReference,
    qualificationInputReference: core.qualificationInputReference,
    displayedProductIds: [...core.displayedProductIds],
    requestedProductIds: [...core.requestedProductIds],
    preparedReference: core.preparedReference,
  };
}

/**
 * Reloads the exact qualification snapshot and recomputes freshness without
 * calling answerQualifiedHopDecision, creating a study, or persisting anything.
 */
export async function inspectHopV55ProductStudyPreparedReferenceV1(
  input: HopV55ProductStudyFreshnessInputV1,
): Promise<InspectHopV55ProductStudyPreparedReferenceResultV1> {
  const inspected = await inspectProductStudyCoreV1(input, 'v1');
  if (inspected.status !== 'ready') return inspected.refusal;
  const core = inspected.core;
  const archive = core.archive as HopV55ProductStudySourceArchiveV1;
  return { status: 'ready', sourceReadingFormat: archive.format, sourceReading: structuredClone(archive.reading), ...inspectedFields(core) };
}

/** V2 inspection of a product study from a semantic V4 reading. */
export async function inspectHopV55ProductStudyPreparedReferenceV2(
  input: HopV55ProductStudyFreshnessInputV1,
): Promise<InspectHopV55ProductStudyPreparedReferenceResultV2> {
  const inspected = await inspectProductStudyCoreV1(input, 'v2');
  if (inspected.status !== 'ready') return inspected.refusal;
  const core = inspected.core;
  const archive = core.archive as HopV55DecisionReadingArchiveV4;
  return { status: 'ready', sourceReadingFormat: archive.format, sourceReading: structuredClone(archive.reading), ...inspectedFields(core) };
}

async function prepareProductStudyCore(input: PrepareHopV55ProductStudyInputV1, route: ProductStudyRoute) {
  if (!isRecord(input) || !isRecord(input.identity)
    || !isText(input.identity.preparationId) || !isText(input.identity.dossierId)
    || !isText(input.identity.eventId) || !validInstant(input.identity.recordedAt)) {
    return { status: 'refused' as const, refusal: { status: 'refused' as const, code: 'invalidPreparationIdentity' as const,
      reason: 'Les identités Root de préparation/dossier/événement et l’instant enregistrés sont requis.' } };
  }
  const inspected = await inspectProductStudyCoreV1(input, route);
  if (inspected.status !== 'ready') return inspected;
  const core = inspected.core;
  const study = answerQualifiedHopDecision({
    intent: structuredClone(core.productResponse.intent),
    action: { kind: 'understandProducts', productIds: [...core.requestedProductIds] },
    qualificationInput: core.qualificationInput,
    context: core.sourceContext,
  });
  const createCommand = {
    kind: 'products' as const,
    ownerKey: input.ownerKey,
    dossierId: input.identity.dossierId,
    eventId: input.identity.eventId,
    recordedAt: input.identity.recordedAt,
    study,
  };
  const preparation = createHopV55QualifiedStudyPreparationV1({
    id: input.identity.preparationId,
    ownerKey: input.ownerKey,
    workspaceId: input.workspaceId,
    sourceReadingReference: core.archive.contentReference,
    preparedReference: core.preparedReference,
    createCommand,
  });
  const blockingIssues = study.kind === 'resolutionRequired' ? structuredClone(study.blockingIssues) : [];
  const scopes = scopesOf(core.archive);
  return { status: 'ready' as const, core, body: {
    kind: 'products' as const,
    workspaceId: input.workspaceId,
    ownerKey: input.ownerKey,
    sourceReadingReference: core.archive.contentReference,
    ...(scopes ? {
      scopeLedger: structuredClone(scopes.scopeLedger),
      scopeLedgerReference: scopes.scopeLedger.reference,
      scopeTransition: structuredClone(scopes.transition),
    } : {}),
    sourceRuntimeReference: core.archive.runtimeReference,
    sourceContext: core.sourceContext,
    sourceContextReference: core.sourceContextReference,
    qualificationInputReference: core.qualificationInputReference,
    displayedProductIds: [...core.displayedProductIds],
    requestedProductIds: [...core.requestedProductIds],
    preparedReference: core.preparedReference,
    study: structuredClone(study),
    blockingIssues,
    preparation,
  } };
}

/**
 * Prepares a new qualified product study from an archived V2 or V3 product reading.
 * V3 keeps its exact V2-shaped reading and validated query-scope ledger alongside the study.
 * It requalifies the full supplied catalogue snapshot but scopes the action to
 * the exact product IDs the user explicitly chose from that archived answer.
 * No repository, workspace CAS, parser, preference or programme writer is called.
 * A semantic V4 source is refused here and goes through `prepareHopV55ProductStudyV2`.
 */
export async function prepareHopV55ProductStudyV1(
  input: PrepareHopV55ProductStudyInputV1,
): Promise<PrepareHopV55ProductStudyResultV1> {
  const prepared = await prepareProductStudyCore(input, 'v1');
  if (prepared.status !== 'ready') return prepared.refusal;
  const archive = prepared.core.archive as HopV55ProductStudySourceArchiveV1;
  const ordered = { format: HOP_V55_PRODUCT_STUDY_PREPARATION_V1_FORMAT, ...withSourceReading(prepared.body,
    archive.format, structuredClone(archive.reading)) };
  const result: HopV55ProductStudyPreparationV1 = {
    ...ordered,
    reference: hopAdviceContentReference(HOP_V55_PRODUCT_STUDY_PREPARATION_V1_FORMAT, ordered),
  } as HopV55ProductStudyPreparationV1;
  return { status: 'ready', result };
}

/** V2 product study from a semantic V4 reading; same qualification, typed annotations kept in `sourceReading`. */
export async function prepareHopV55ProductStudyV2(
  input: PrepareHopV55ProductStudyInputV1,
): Promise<PrepareHopV55ProductStudyResultV2> {
  const prepared = await prepareProductStudyCore(input, 'v2');
  if (prepared.status !== 'ready') return prepared.refusal;
  const archive = prepared.core.archive as HopV55DecisionReadingArchiveV4;
  const ordered = { format: HOP_V55_PRODUCT_STUDY_PREPARATION_V2_FORMAT, ...withSourceReading(prepared.body,
    archive.format, structuredClone(archive.reading)) };
  const result: HopV55ProductStudyPreparationV2 = {
    ...ordered,
    reference: hopAdviceContentReference(HOP_V55_PRODUCT_STUDY_PREPARATION_V2_FORMAT, ordered),
  } as HopV55ProductStudyPreparationV2;
  return { status: 'ready', result };
}

/** Keeps the historical V1 body key order (source reading fields after the reading reference). */
function withSourceReading<Body extends { sourceReadingReference: string }, Format extends string, Reading>(body: Body,
  sourceReadingFormat: Format, sourceReading: Reading) {
  const { kind, workspaceId, ownerKey, sourceReadingReference, ...rest } = body as Body & { kind: 'products'; workspaceId: string; ownerKey: string };
  return { kind, workspaceId, ownerKey, sourceReadingReference, sourceReadingFormat, sourceReading, ...rest };
}
