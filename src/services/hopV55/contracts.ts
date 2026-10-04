import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { BrewerCatalogueKind, BrewerCatalogueCommand } from '../../../functions/src/brewerCatalogueSchema';
import type { BrewerCatalogueLookupRecord, BrewerCatalogueWriteResult } from '../../../functions/src/brewerCatalogueStore';
import type { Recipe } from '../../types';
import type { BrewingScenarioLocalRepository } from '../brewingScenarioLocalRepository';
import type { BrewingScenarioRequest } from '../../domain/brewingScenario';
import type { BrewingReferenceRecordV1, BrewingReferenceEvent } from '../../domain/brewingReference';
import type { BrewingNuancePlan, BrewingNuanceProjection } from '../../domain/brewingNuanceProjection';
import type { BrewingSensoryComparisonContext, BrewingSensoryComparisonReference } from '../../domain/brewingSensory';
import type { HopV55FullRecipeCopyReceipt, HopV55FullRecipeCopyReceiptV1 } from './fullRecipeCopy';
import type { HopV55ProgramCopy } from './programCopy';
import type { HopV55ReferenceComparisonDTO } from './referenceComparison';
import type { HopV55ScenarioPreparationV1 } from './scenarioCommit';
import type { HopV55FullRecipeCopyRecomputePayload } from './candidateScenario';
import type { HopV55DecisionReadingArchive, HopV55DecisionReadingSource } from './decisionArchive';
import type { HopV55DocumentaryAnswerHistoryEntry, HopV55DocumentaryDossierHistoryEntry } from './documentaryRecords';
import type { HopV55FutureRecipeDraftV1, HopV55FutureRecipeMaterializationReceiptV1 } from './futureRecipeDraft';
import type { HopV55ObservationAnchorRecordV1, HopV55ObservationProjectionRecordV1 } from './observationSession';
import type { HopV55ObservationSupportRecordV1, HopV55ObservationSupportSelectionV1 } from './observationSupport';
import type { HopDecisionLocalRepository } from '../hopDecisionLocalRepository';
import type { HopV55QualifiedStudyLinkHistoryEntry,
  HopV55QualifiedStudyPreparationHistoryEntry } from './qualifiedStudyWorkspace';
import type { HopV55QualifiedStudyPreferenceHistoryEntry } from './qualifiedStudyPreference';
import type {
  HopV55PropertyAdviceReexaminationCommandReceiptHistoryEntry,
  HopV55PropertyAdviceReexaminationCommandStagingHistoryEntry,
} from './propertyAdviceReexaminationCommand';

export interface HopV55Intent {
  question: string;
  criteria: Array<{ id: string; label: string; direction: 'increase' | 'decrease' | 'keep' | 'exclude' | 'investigate'; axisId?: string; familyId?: string }>;
}

export interface HopV55Copy {
  id: string;
  recipe: Recipe;
  sourceRecipeId: string;
  previewReference: string;
  scenarioId: string;
  snapshotReference: string;
  branchId: string;
  branchReference: string;
  createdAt: string;
  scope: 'local';
}

/** The record remains v1; its append-only event stream can contain known V1 and V2 events. */
export interface HopV55ReferenceJournal {
  record: BrewingReferenceRecordV1;
  events: BrewingReferenceEvent[];
}

/** Explicitly resolved source for reopening a saved workspace. */
export type HopV55LocalFutureDraftSource = Extract<HopV55DecisionReadingSource, { kind: 'localFutureDraft' }>;
export type HopV55LocalRecipeCopySource = Extract<HopV55DecisionReadingSource, { kind: 'localRecipeCopy' }>;

export type HopV55ContextSource =
  | { kind: 'recipe'; recipeId: string }
  | { kind: 'batch'; batchId: string }
  | { kind: 'exploration' }
  | HopV55LocalRecipeCopySource
  | HopV55LocalFutureDraftSource;

/** Journey metadata complements the immutable domain scenario dossier. */
export interface HopV55Workspace {
  format: 'hop-v55-workspace-v1';
  id: string;
  ownerKey: string;
  revision: number;
  title: string;
  intent: HopV55Intent;
  sourceRecipeId?: string;
  sourceBatchId?: string;
  /** Immutable archived reading captured before its scenario is calculated. */
  decisionReadings?: HopV55DecisionReadingArchive[];
  /** Documentary answers, sealed against their reading and source; never operational writes. */
  documentaryAnswers?: HopV55DocumentaryAnswerHistoryEntry[];
  /** Exact selected documentary dossiers, sealed against an answer already archived here. */
  documentaryDossiers?: HopV55DocumentaryDossierHistoryEntry[];
  /** Immutable future-recipe draft history; each new revision appends after its exact predecessor. */
  futureDrafts?: HopV55FutureRecipeDraftV1[];
  /** The sole active future-draft source, independently of its immutable historical versions. */
  activeFutureDraftSource?: HopV55LocalFutureDraftSource;
  /** True Recipe candidates and their sealed origin receipts, durable before host save confirmation. */
  futureRecipeMaterializations?: Array<{ recipe: Recipe; receipt: HopV55FutureRecipeMaterializationReceiptV1 }>;
  /** Host-confirmed saves of exact future materialization receipts; separate from copy save receipts. */
  futureRecipeSaveReceipts?: Array<{ recipeId: string; receiptReference: string; confirmedAt: string }>;
  scenarioIds: string[];
  activeScenarioId?: string;
  selected?: { scenarioId: string; snapshotReference: string; branchId: string; branchReference: string };
  referenceHypotheses: Array<{ id: string; version: number; label: string; baseline: BrewingScenarioRequest['baseline']; recordedAt: string }>;
  /** Append-only shared business journal; legacy hypotheses above are read-only input for conversion. */
  referenceJournal?: HopV55ReferenceJournal;
  /** Immutable free exploration profiles; unknown future formats remain raw and read-only. */
  explorationProfiles?: unknown[];
  /** Exact trial preparation, staged before J5 and linked to the canonical result by an append-only receipt. */
  explorationTrialPreparations?: unknown[];
  explorationTrialReceipts?: unknown[];
  nuancePlans?: BrewingNuancePlan[];
  referenceComparisons?: HopV55ReferenceComparisonDTO[];
  scenarioPreparations?: HopV55ScenarioPreparationV1[];
  /** Prepared physical observations and exact NR anchors; immutable, workspace-scoped history. */
  observationAnchors?: HopV55ObservationAnchorRecordV1[];
  /** Canonical archived observation projections; new questions append without rewriting prior results. */
  observationProjections?: HopV55ObservationProjectionRecordV1[];
  /** Exact qualified-study commands durably prepared before creating a domain dossier. */
  qualifiedStudyPreparations?: HopV55QualifiedStudyPreparationHistoryEntry[];
  /** Workspace links to studies already committed by the separate domain repository. */
  qualifiedStudyLinks?: HopV55QualifiedStudyLinkHistoryEntry[];
  /** Exact Q09 preference events staged before their separate domain-repository append. */
  qualifiedStudyPreferenceCommands?: HopV55QualifiedStudyPreferenceHistoryEntry[];
  /** Exact V4 reexamination confirmations durably staged before the answer-record CAS. */
  propertyAdviceReexaminationCommandStaging?: HopV55PropertyAdviceReexaminationCommandStagingHistoryEntry[];
  /** Append-only receipts close matching staged V4 reexamination commands. */
  propertyAdviceReexaminationCommandReceipts?: HopV55PropertyAdviceReexaminationCommandReceiptHistoryEntry[];
  /** Immutable protocol/scope/arithmetic/stability declarations for observation workbench support. */
  observationSupportRecords?: HopV55ObservationSupportRecordV1[];
  /** Immutable active-support selections; the latest explicit version is current. */
  observationSupportSelections?: HopV55ObservationSupportSelectionV1[];
  /** App-owned launch tickets captured before assisted network submission. */
  assistedAdviceTickets?: unknown[];
  /** Runtime-owned immutable receipts paired to a ticket persisted by an earlier CAS. */
  assistedAdviceRecords?: unknown[];
  nuanceStudies?: Array<{ id: string; scenarioId: string; snapshotReference: string; projection: BrewingNuanceProjection;
    context: BrewingSensoryComparisonContext; reference: BrewingSensoryComparisonReference }>;
  snapshotIntents?: Array<{ scenarioId: string; snapshotReference: string; intent: HopV55Intent; decisionReadingReference?: string }>;
  recipeSaveReceipts?: Array<{ copyId: string; recipeId: string; confirmedAt: string }>;
  serverScenarioReceipts?: Array<{ scenarioId: string; snapshotReference: string; operationId: string; revision: number; reference: string; committedAt: string; scope: 'serverConfirmed' }>;
  copies: HopV55Copy[];
  /** V1 is accepted only as an immutable pre-upgrade historical prefix. New receipts are sealed V2. */
  fullCopyReceipts?: Array<HopV55FullRecipeCopyReceipt | HopV55FullRecipeCopyReceiptV1>;
  /** Durable scenario recomputations created before a final copy receipt exists. */
  copyRecomputations?: HopV55FullRecipeCopyRecomputePayload[];
  programCopies?: HopV55ProgramCopy[];
  activeProgramCopyId?: string;
  activeCopyId?: string;
  updatedAt: string;
}

export interface HopV55WorkspaceRepository {
  list(ownerKey: string): Promise<HopV55Workspace[]>;
  read(ownerKey: string, id: string): Promise<HopV55Workspace | null>;
  save(workspace: HopV55Workspace, expectedRevision: number | null): Promise<HopV55Workspace>;
  close(): void;
}

export interface HopV55CatalogueClient {
  scope: 'server' | 'fixture';
  lookup(kind: BrewerCatalogueKind, query: string): Promise<{ records: BrewerCatalogueLookupRecord[]; truncated: boolean }>;
  write(command: BrewerCatalogueCommand): Promise<BrewerCatalogueWriteResult & { scope: 'server' | 'fixture' }>;
}

export interface HopV55Services {
  scope: 'local' | 'fixture';
  ownerKey: string;
  catalogue: HopV55CatalogueClient;
  scenarios: BrewingScenarioLocalRepository;
  /** Offline repository; its dossiers/events remain separate from workspace links. */
  qualifiedStudies: HopDecisionLocalRepository;
  workspaces: HopV55WorkspaceRepository;
  /** Exact offline CAS client for App tickets and Runtime receipts. */
  assistedAdvice: import('./assistedAdviceWorkspace').HopV55AssistedAdviceWorkspaceClientV1;
  loadContext(recipe?: Recipe, source?: HopV55ContextSource): Promise<BrewerContext>;
  loadFutureDraft(source: HopV55LocalFutureDraftSource): Promise<HopV55FutureRecipeDraftV1>;
  close(): void;
}

export type {
  HopV55QualifiedStudyCreateCommandV1,
  HopV55QualifiedStudyFreshness,
  HopV55QualifiedStudyLinkStatus,
  HopV55QualifiedStudyLinkV1,
  HopV55QualifiedStudyPreparationV1,
  HopV55QualifiedAdvicePreparationContextV1,
  PersistHopV55QualifiedStudyResult,
} from './qualifiedStudyWorkspace';
export type {
  HopV55QualifiedStudyPreferenceCommandV1,
  HopV55QualifiedStudyPreferenceFreshnessInput,
  HopV55QualifiedStudyPreferenceFreshnessValidator,
  HopV55QualifiedStudyPreferenceStatus,
  PersistHopV55QualifiedStudyPreferenceResult,
} from './qualifiedStudyPreference';
export type {
  HopV55PropertyAdviceAnswerRecordV4,
  HopV55PropertyAdviceAnnotationLedgerV1,
  HopV55PropertyAdviceCorrectionV4Draft,
  HopV55PropertyAdviceDossierRecordV4,
  HopV55PropertyAdviceLedgerDecisionV1,
  HopV55PropertyAdviceLedgerEntryV1,
  HopV55PropertyAdvicePreparationV4,
  HopV55PropertyAdviceV4ReadingContext,
  HopV55PropertyAdviceOutcomeV4,
  HopV55PropertyAdviceV4Actor,
  HopV55PropertyAdviceV4Transition,
} from './propertyAdviceRecordsV4';
