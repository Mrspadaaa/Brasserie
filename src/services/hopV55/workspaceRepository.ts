import Dexie, { type Table } from 'dexie';
import {
  BREWING_SCENARIO_VERSION,
  assertBrewingScenarioRequest,
} from '../../domain/brewingScenario';
import { assertBrewingNuancePlan, brewingNuanceViewModel, readBrewingNuanceProjection } from '../../domain/brewingNuanceProjection';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { readHopV55FullRecipeCopyReceipt, type HopV55FullRecipeCopyReceipt } from './fullRecipeCopy';
import { assertHopV55ProgramCopy } from './programCopy';
import { getHopV55ReferenceProjection, readHopV55ReferenceJournal } from './referenceWorkspace';
import { readHopV55ReferenceComparison } from './referenceComparison';
import { readHopV55ScenarioPreparation } from './scenarioCommit';
import { readHopV55FullRecipeCopyRecomputePayload } from './candidateScenario';
import { readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchive, type HopV55DecisionReadingArchiveV4 } from './decisionArchive';
import { hopV55DecisionReadingScopesV1 } from './decisionReadingAccessors';
import type { HopV55DocumentaryAnswerRecordV1, HopV55DocumentaryRevisionContextV1 } from './documentaryDecision';
import { readHopV55DocumentaryAnswerRecord, readHopV55DocumentaryDossierRecord,
  type HopV55DocumentaryAnswerRecord, type HopV55DocumentaryDossierRecord } from './documentaryRecords';
import type { HopV55PropertyAdviceAnswerRecordV2 } from './propertyAdviceRecords';
import type { HopV55PropertyAdviceAnswerRecordV3 } from './propertyAdviceRecordsV3';
import type { HopV55PropertyAdviceAnswerRecordV4 } from './propertyAdviceRecordsV4';
import { readHopV55FutureRecipeDraft, readHopV55FutureRecipeMaterializationReceipt,
  type HopV55FutureRecipeDraftV1, type HopV55FutureRecipeMaterializationReceiptV1 } from './futureRecipeDraft';
import { assertHopV55ObservationAppendOnly, assertHopV55ObservationCollections,
  HopV55ObservationSessionError } from './observationSession';
import { assertHopV55ObservationSupportAppendOnly, assertHopV55ObservationSupportCollections } from './observationSupport';
import { assertHopV55QualifiedStudyAppendOnly, assertHopV55QualifiedStudyWorkspaceCollections,
  HopV55QualifiedStudyWorkspaceError } from './qualifiedStudyWorkspace';
import { assertHopV55QualifiedStudyPreferenceAppendOnly, assertHopV55QualifiedStudyPreferenceCommands,
  HopV55QualifiedStudyPreferenceError } from './qualifiedStudyPreference';
import { assertHopV55PropertyAdviceReexaminationCommandAppendOnly,
  assertHopV55PropertyAdviceReexaminationCommandWorkspace } from './propertyAdviceReexaminationCommand';
import { assertHopV55AssistedAdviceWorkspaceAppendOnly, assertHopV55AssistedAdviceWorkspaceCollections } from './assistedAdviceWorkspace';
import { assertHopV55ExplorationTrialAppendOnly, assertHopV55ExplorationTrialWorkspaceCollections,
  HopV55ExplorationTrialError } from './explorationTrialPreparation';
import { assertHopV55ExplorationProfileAppendOnly, assertHopV55ExplorationProfileCollection } from './explorationProfiles';
import type { HopV55AssistedAdviceBackendContractV1 } from './assistedAdviceArchive';
import type { HopV55Workspace, HopV55WorkspaceRepository } from './contracts';

export const DEFAULT_HOP_V55_WORKSPACE_DATABASE_NAME = 'laffinee-hop-v55-workspaces-v1';
const DEXIE_SCHEMA_VERSION = 1;

export type HopV55WorkspaceRepositoryErrorCode =
  | 'invalidInput'
  | 'ownerMismatch'
  | 'notFound'
  | 'staleRevision'
  | 'unsupportedFormat'
  | 'invalidStoredRecord';

export class HopV55WorkspaceRepositoryError extends Error {
  constructor(readonly code: HopV55WorkspaceRepositoryErrorCode, message: string) {
    super(message);
    this.name = 'HopV55WorkspaceRepositoryError';
  }
}

export interface HopV55WorkspaceEnvelopeV1 {
  format: 'hop-v55-workspace-envelope-v1';
  ownerKey: string;
  workspaceId: string;
  revision: number;
  workspace: HopV55Workspace;
}

interface HopV55WorkspaceRow extends HopV55WorkspaceEnvelopeV1 {}

/** Small adapter contract keeps CAS and corruption cases testable without a DOM. */
export interface HopV55WorkspaceTable<Row> {
  get(key: unknown): Promise<Row | undefined>;
  add(row: Row): Promise<unknown>;
  put(row: Row): Promise<unknown>;
  where(index: string): { equals(key: unknown): { toArray(): Promise<Row[]> } };
}

export interface HopV55WorkspaceDatabaseAdapter {
  workspaces: HopV55WorkspaceTable<HopV55WorkspaceRow>;
  transaction<T>(mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T>;
  close(): void;
}

class HopV55WorkspaceDatabase extends Dexie {
  workspaces!: Table<HopV55WorkspaceRow, [string, string]>;

  constructor(databaseName: string) {
    super(databaseName);
    this.version(DEXIE_SCHEMA_VERSION).stores({
      workspaces: '[ownerKey+workspaceId], ownerKey, revision, updatedAt',
    });
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isId = (value: unknown): value is string => isText(value) && value.length <= 160 && !value.includes('/');
const onlyKeys = (value: Record<string, unknown>, allowed: readonly string[]) => Object.keys(value).every(key => allowed.includes(key));
const clone = <T>(value: T): T => structuredClone(value);

function requireOwner(ownerKey: string, expectedOwnerKey: string): void {
  if (!isText(ownerKey) || ownerKey.trim() !== ownerKey) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une clé ownerKey locale explicite et normalisée est requise.');
  }
  if (ownerKey !== expectedOwnerKey) {
    throw new HopV55WorkspaceRepositoryError('ownerMismatch', 'Ce dépôt local appartient à un autre ownerKey.');
  }
}

function assertScenarioBaseline(value: unknown): void {
  if (!isRecord(value) || (value.kind !== 'recipe' && value.kind !== 'hypothetical')) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Base de référence de scénario invalide.');
  }
  try {
    assertBrewingScenarioRequest({
      version: BREWING_SCENARIO_VERSION,
      scenarioId: 'hop-v55-workspace-baseline-validation',
      revision: 0,
      baseline: clone(value),
      assumptions: [],
      branches: [],
    });
  } catch (error) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', `Base de référence invalide : ${(error as Error).message}`);
  }
}

function assertIntent(value: unknown, label: string): asserts value is HopV55Workspace['intent'] {
  if (!isRecord(value) || !onlyKeys(value, ['question', 'criteria']) || typeof value.question !== 'string' || !Array.isArray(value.criteria)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', `Intention ${label} invalide.`);
  }
  const criteriaIds = new Set<string>();
  for (const criterion of value.criteria) {
    if (!isRecord(criterion) || !onlyKeys(criterion, ['id', 'label', 'direction', 'axisId', 'familyId']) || !isId(criterion.id) || !isText(criterion.label)
      || !['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(String(criterion.direction))
      || criterion.axisId !== undefined && !isId(criterion.axisId)
      || criterion.familyId !== undefined && !isId(criterion.familyId) || criteriaIds.has(criterion.id)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Critère d’intention ${label} invalide ou dupliqué.`);
    }
    criteriaIds.add(criterion.id);
  }
}

function assertRecipe(value: unknown, label: string): asserts value is HopV55Workspace['copies'][number]['recipe'] {
  if (!isRecord(value) || !isId(value.id) || !isText(value.name) || !isText(value.style)
    || typeof value.volumeL !== 'number' || !Number.isFinite(value.volumeL) || value.volumeL <= 0
    || !Array.isArray(value.fermentables) || !Array.isArray(value.hops) || !isRecord(value.yeast)
    || !isText(value.yeast.name) || !Array.isArray(value.steps) || !Array.isArray(value.notes)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', `Recette de copie ${label} invalide.`);
  }
  if (typeof value.totalGristKg !== 'number' || !Number.isFinite(value.totalGristKg)
    || !['ogTarget', 'fgTarget', 'abvTarget'].every(key => value[key] === null || typeof value[key] === 'number' && Number.isFinite(value[key]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', `Valeurs de base de la recette ${label} invalides.`);
  }
  if (value.fermentables.some(row => !isRecord(row) || !isText(row.name)
    || typeof row.weightKg !== 'number' || !Number.isFinite(row.weightKg) || row.weightKg < 0)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', `Ingrédient fermentescible de la recette ${label} invalide.`);
  }
  if (value.hops.some(row => !isRecord(row) || !isText(row.name) || !isId(row.stage)
    || !['firstWort', 'boil', 'whirlpool', 'dryHop'].includes(String(row.stage))
    || typeof row.weightG !== 'number' || !Number.isFinite(row.weightG) || row.weightG < 0
    || typeof row.alpha !== 'number' || !Number.isFinite(row.alpha))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', `Ajout de houblon de la recette ${label} invalide.`);
  }
}

function sameWorkspaceValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  try {
    return hopAdviceContentReference('hop-v55-workspace-append-only-value-v1', left)
      === hopAdviceContentReference('hop-v55-workspace-append-only-value-v1', right);
  } catch { return false; }
}

function assertNuanceStudies(value: unknown, scenarioIds: Set<string>): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Archives de nuance invalides.');
  const ids = new Set<string>();
  for (const study of value) {
    if (!isRecord(study) || !onlyKeys(study, ['id', 'scenarioId', 'snapshotReference', 'projection', 'context', 'reference'])
      || !isId(study.id) || ids.has(study.id) || !isId(study.scenarioId) || !scenarioIds.has(study.scenarioId)
      || !isText(study.snapshotReference) || !isRecord(study.context) || !isRecord(study.reference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Identité ou portée d’une archive de nuance invalide.');
    }
    try {
      const projection = readBrewingNuanceProjection(study.projection);
      if (!('status' in projection)) brewingNuanceViewModel(projection, { context: study.context as any, reference: study.reference as any });
    } catch (error) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Archive de nuance incohérente : ${(error as Error).message}`);
    }
    ids.add(study.id);
  }
}

function assertNuancePlans(value: unknown): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Historique de plans de nuance invalide.');
  const references = new Set<string>();
  for (const plan of value) {
    try { assertBrewingNuancePlan(plan); }
    catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', `Plan de nuance invalide : ${(error as Error).message}`); }
    if (references.has(plan.reference)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Référence de plan de nuance répétée.');
    references.add(plan.reference);
  }
}

function assertProgramCopies(value: unknown, scenarioIds: Set<string>, recipeCopyIds: Set<string>): Set<string> {
  if (value === undefined) return new Set();
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Copies de programme invalides.');
  const ids = new Set<string>();
  for (const copy of value) {
    try { assertHopV55ProgramCopy(copy); }
    catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', `Copie de programme invalide : ${(error as Error).message}`); }
    if (ids.has(copy.id) || recipeCopyIds.has(copy.id) || !scenarioIds.has(copy.scenarioId)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'ID de copie de programme dupliqué ou scénario source absent.');
    }
    ids.add(copy.id);
  }
  return ids;
}

function assertFullCopyReceipts(
  value: unknown,
  copies: readonly HopV55Workspace['copies'][number][],
  scenarioIds: Set<string>,
): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Reçus de copie complète invalides.');
  const receiptCopyIds = new Set<string>();
  const copiesById = new Map(copies.map(copy => [copy.id, copy]));
  for (const raw of value) {
    const read = readHopV55FullRecipeCopyReceipt(raw);
    if (read.status === 'invalid') throw new HopV55WorkspaceRepositoryError('invalidInput', `Reçu de copie complète refusé : ${read.reason}`);
    const legacy = read.status === 'legacyReadOnly';
    const receipt = read.receipt;
    // The reader also accepts an unapplied preview receipt. The workspace log
    // only accepts the receipt returned after apply assigned a distinct copy ID.
    if (!receipt.copyId || !receipt.createdAt || receiptCopyIds.has(receipt.copyId)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un reçu complet doit provenir d’une copie locale appliquée unique.');
    }
    const copy = copiesById.get(receipt.copyId);
    if (!copy || !scenarioIds.has(receipt.scenarioId) || copy.scope !== 'local'
      || copy.recipe.id !== receipt.copyId || copy.sourceRecipeId !== receipt.sourceRecipeId
      || copy.scenarioId !== receipt.scenarioId || copy.snapshotReference !== receipt.snapshotReference
      || copy.branchId !== receipt.branchId || copy.branchReference !== receipt.branchReference
      || copy.createdAt !== receipt.createdAt) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le reçu complet ne correspond pas exactement à la copie, source, scénario, snapshot ou branche persistés.');
    }
    if (!legacy && (!sameWorkspaceValue((receipt as HopV55FullRecipeCopyReceipt).finalRecipe, copy.recipe)
      || (receipt as HopV55FullRecipeCopyReceipt).finalRecipeReference !== hopDecisionReference(copy.recipe))) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le reçu V2 scellé ne correspond pas exactement au Recipe de la copie persistée.');
    }
    receiptCopyIds.add(receipt.copyId);
  }
}

function isLegacyFullCopyReceipt(value: unknown): boolean {
  return readHopV55FullRecipeCopyReceipt(value).status === 'legacyReadOnly';
}

function assertServerScenarioReceipts(value: unknown, scenarioIds: Set<string>): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Reçus de scénario serveur invalides.');
  const operationIds = new Set<string>();
  for (const receipt of value) {
    if (!isRecord(receipt) || !onlyKeys(receipt, ['scenarioId', 'snapshotReference', 'operationId', 'revision', 'reference', 'committedAt', 'scope'])
      || !isId(receipt.scenarioId) || !scenarioIds.has(receipt.scenarioId)
      || !isText(receipt.snapshotReference) || !isId(receipt.operationId) || operationIds.has(receipt.operationId)
      || !Number.isSafeInteger(receipt.revision) || (receipt.revision as number) < 0
      || !isText(receipt.reference) || !isText(receipt.committedAt) || !Number.isFinite(Date.parse(receipt.committedAt))
      || receipt.scope !== 'serverConfirmed') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Reçu serveur mal formé, rattaché à un scénario absent ou déjà utilisé.');
    }
    operationIds.add(receipt.operationId);
  }
}

function assertReferenceComparisons(value: unknown, ownerKey: string, scenarioIds: Set<string>): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Archives de comparaison à la référence invalides.');
  const references = new Set<string>();
  for (const raw of value) {
    const read = readHopV55ReferenceComparison(raw);
    if (read.status === 'unsupportedFormat') {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', `Format d’archive de comparaison conservé sans modification : ${read.reason}`);
    }
    if (read.status !== 'available') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Archive de comparaison invalide : ${read.reason}`);
    }
    const dto = read.dto;
    if (dto.source.ownerKey !== ownerKey || !scenarioIds.has(dto.source.scenarioId)
      || dto.archive.scenarioRecord.dossier.scenarioId !== dto.source.scenarioId
      || !dto.archive.scenarioRecord.snapshots.some(snapshot => snapshot.reference === dto.source.snapshotReference)
      || dto.archive.scenarioRecord.snapshots.find(snapshot => snapshot.reference === dto.source.snapshotReference)?.result.reference !== dto.source.resultReference) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'La comparaison ne référence pas exactement un scénario et snapshot conservés par ce owner.');
    }
    if (references.has(dto.contentReference)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Référence de comparaison dupliquée dans le workspace.');
    references.add(dto.contentReference);
  }
}

function futureDraftReferenceKey(draftId: string, revision: number, contentReference: string): string {
  return `${draftId}\0${revision}\0${contentReference}`;
}

function assertFutureDrafts(value: unknown): { byReference: Map<string, HopV55FutureRecipeDraftV1>; latestById: Map<string, HopV55FutureRecipeDraftV1> } {
  const byReference = new Map<string, HopV55FutureRecipeDraftV1>();
  const latestById = new Map<string, HopV55FutureRecipeDraftV1>();
  if (value === undefined) return { byReference, latestById };
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Historique des brouillons futurs invalide.');
  const contentReferences = new Set<string>();
  for (const raw of value) {
    const read = readHopV55FutureRecipeDraft(raw);
    if (read.status !== 'available') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Version de brouillon futur invalide : ${read.reason}`);
    }
    const draft = read.draft;
    const key = futureDraftReferenceKey(draft.draftId, draft.revision, draft.contentReference);
    if (byReference.has(key) || contentReferences.has(draft.contentReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Révision ou référence de contenu de brouillon futur dupliquée.');
    }
    const previous = latestById.get(draft.draftId);
    if (previous) {
      const predecessor = { draftId: previous.draftId, revision: previous.revision, contentReference: previous.contentReference };
      if (draft.revision !== previous.revision + 1 || !sameWorkspaceValue(draft.predecessor, predecessor)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une révision de brouillon doit suivre exactement son prédécesseur conservé.');
      }
    } else if (draft.revision !== 1 || draft.predecessor !== null) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le premier brouillon conservé doit commencer à la révision 1 sans prédécesseur.');
    }
    byReference.set(key, draft);
    contentReferences.add(draft.contentReference);
    latestById.set(draft.draftId, draft);
  }
  return { byReference, latestById };
}

function assertFutureDraftOrigins(workspace: HopV55Workspace, futureDrafts: Map<string, HopV55FutureRecipeDraftV1>,
  scenarioIds: Set<string>): void {
  for (const draft of futureDrafts.values()) {
    const origin = draft.origin;
    const snapshotIntent = workspace.snapshotIntents?.find(row => row.scenarioId === origin.scenarioId
      && row.snapshotReference === origin.snapshotReference);
    if (!scenarioIds.has(origin.scenarioId) || !snapshotIntent || !sameWorkspaceValue(snapshotIntent.intent, origin.intent)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le brouillon matérialisable doit garder son scénario, snapshot et intention exacte dans le workspace.');
    }
  }
}

function assertFutureRecipeMaterializations(value: unknown,
  futureDrafts: Map<string, HopV55FutureRecipeDraftV1>): Map<string, HopV55FutureRecipeMaterializationReceiptV1> {
  const receipts = new Map<string, HopV55FutureRecipeMaterializationReceiptV1>();
  if (value === undefined) return receipts;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Matérialisations de recettes futures invalides.');
  const receiptIds = new Set<string>();
  const recipeIds = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw) || !onlyKeys(raw, ['recipe', 'receipt'])) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Chaque matérialisation doit contenir exactement Recipe et reçu.');
    }
    const read = readHopV55FutureRecipeMaterializationReceipt(raw.receipt);
    if (read.status !== 'available') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Reçu de matérialisation future invalide : ${read.reason}`);
    }
    const receipt = read.receipt;
    try { assertRecipe(raw.recipe, receipt.recipeId); }
    catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', `Recipe matérialisé invalide : ${(error as Error).message}`); }
    const draft = futureDrafts.get(futureDraftReferenceKey(receipt.draftId, receipt.draftRevision, receipt.draftReference));
    if (!draft
      || receipt.sourceScenarioId !== draft.origin.scenarioId
      || receipt.sourceSnapshotReference !== draft.origin.snapshotReference
      || receipt.sourceResultReference !== draft.origin.resultReference
      || receipt.sourceBranchId !== draft.origin.branchId
      || receipt.sourceBranchReference !== draft.origin.branchReference
      || !sameWorkspaceValue(receipt.adoptedReference, draft.origin.adoptedReference)
      || receipt.recipeId !== raw.recipe.id || !sameWorkspaceValue(receipt.recipe, raw.recipe)
      || receipt.recipeReference !== hopDecisionReference(raw.recipe)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Recipe matérialisé, reçu et version d’origine conservée ne correspondent pas exactement.');
    }
    if (receiptIds.has(receipt.receiptId) || recipeIds.has(receipt.recipeId) || receipts.has(receipt.contentReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'ID de reçu, recette ou référence de matérialisation dupliqué.');
    }
    receiptIds.add(receipt.receiptId);
    recipeIds.add(receipt.recipeId);
    receipts.set(receipt.contentReference, receipt);
  }
  return receipts;
}

function assertFutureRecipeSaveReceipts(value: unknown,
  materializations: Map<string, HopV55FutureRecipeMaterializationReceiptV1>): Set<string> {
  const savedRecipeIds = new Set<string>();
  if (value === undefined) return savedRecipeIds;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Confirmations de sauvegarde de future recette invalides.');
  const receiptReferences = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw) || !onlyKeys(raw, ['recipeId', 'receiptReference', 'confirmedAt'])
      || !isId(raw.recipeId) || !isText(raw.receiptReference) || !isText(raw.confirmedAt)
      || !Number.isFinite(Date.parse(raw.confirmedAt)) || savedRecipeIds.has(raw.recipeId)
      || receiptReferences.has(raw.receiptReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Confirmation de sauvegarde future mal formée ou dupliquée.');
    }
    const materialization = materializations.get(raw.receiptReference);
    if (!materialization || materialization.recipeId !== raw.recipeId) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une confirmation ne référence pas le reçu exact d’une Recipe matérialisée.');
    }
    savedRecipeIds.add(raw.recipeId);
    receiptReferences.add(raw.receiptReference);
  }
  return savedRecipeIds;
}

function decisionArchiveSourceForPreparation(source: unknown): unknown {
  if (!isRecord(source)) return null;
  if (source.kind === 'recipe' && onlyKeys(source, ['kind', 'recipeId'])) return { kind: 'recipe', id: source.recipeId };
  if (source.kind === 'batch' && onlyKeys(source, ['kind', 'batchId'])) return { kind: 'batch', id: source.batchId };
  if (source.kind === 'exploration' && onlyKeys(source, ['kind'])) return { kind: 'exploration' };
  if (source.kind === 'localRecipeCopy' && onlyKeys(source, ['kind', 'workspaceId', 'copyId', 'recipeId', 'recipeReference'])) return source;
  if (source.kind === 'localFutureDraft' && onlyKeys(source, ['kind', 'workspaceId', 'draftId', 'revision', 'contentReference'])) return source;
  return null;
}

function isExactLocalRecipeCopySource(workspace: HopV55Workspace, source: unknown): boolean {
  if (!isRecord(source) || !onlyKeys(source, ['kind', 'workspaceId', 'copyId', 'recipeId', 'recipeReference'])
    || source.kind !== 'localRecipeCopy' || source.workspaceId !== workspace.id || !isId(source.copyId)
    || !isId(source.recipeId) || !isText(source.recipeReference)) return false;
  const copy = workspace.copies?.find(row => row.id === source.copyId);
  if (!copy || copy.recipe?.id !== source.recipeId) return false;
  try { return hopDecisionReference(copy.recipe) === source.recipeReference; }
  catch { return false; }
}

function assertScenarioPreparations(value: unknown, workspace: HopV55Workspace, scenarioIds: Set<string>,
  decisionReadings: Map<string, HopV55DecisionReadingArchive>, futureDrafts: Map<string, HopV55FutureRecipeDraftV1>): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Préparations J5 invalides.');
  const ids = new Set<string>(), eventIds = new Set<string>();
  let referenceProjection: ReturnType<typeof getHopV55ReferenceProjection> = null;
  try { referenceProjection = getHopV55ReferenceProjection(workspace); }
  catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', `Journal NR invalide pour la préparation J5 : ${(error as Error).message}`); }
  const expectedSource = workspace.sourceBatchId ? { kind: 'batch', batchId: workspace.sourceBatchId }
    : workspace.sourceRecipeId ? { kind: 'recipe', recipeId: workspace.sourceRecipeId } : { kind: 'exploration' };
  for (const raw of value) {
    const read = readHopV55ScenarioPreparation(raw);
    if (read.status === 'unsupportedFormat') {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', `Préparation J5 future conservée sans modification : ${read.reason}`);
    }
    if (read.status !== 'available') throw new HopV55WorkspaceRepositoryError('invalidInput', `Préparation J5 invalide : ${read.reason}`);
    const preparation = read.preparation;
    const localRecipeCopySource = isExactLocalRecipeCopySource(workspace, preparation.source);
    const futureSource = preparation.source.kind === 'localFutureDraft'
      && preparation.source.workspaceId === workspace.id
      && futureDrafts.has(futureDraftReferenceKey(preparation.source.draftId, preparation.source.revision,
        preparation.source.contentReference));
    if (preparation.ownerKey !== workspace.ownerKey || preparation.workspaceId !== workspace.id
      || !(localRecipeCopySource || futureSource || sameWorkspaceValue(preparation.source, expectedSource))
      || preparation.operation === 'reevaluate' && !scenarioIds.has(preparation.scenarioId)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Owner, workspace, source ou scénario de la préparation J5 ne correspond pas au workspace.');
    }
    if (preparation.decisionReadingReference !== undefined) {
      const archive = decisionReadings.get(preparation.decisionReadingReference);
      const expectedReadingSource = decisionArchiveSourceForPreparation(preparation.source);
      if (!archive || archive.ownerKey !== workspace.ownerKey || archive.workspaceId !== workspace.id
        || !expectedReadingSource || !sameWorkspaceValue(archive.source, expectedReadingSource)
        || !sameWorkspaceValue(archive.reading.intent, preparation.intent)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Lecture de décision absente ou incompatible avec owner, workspace, source et intention de la préparation J5.');
      }
    }
    if (preparation.reference !== null) {
      const identity = preparation.reference;
      const version = referenceProjection?.references.find(row => row.id === identity.id && row.version === identity.version
        && row.contentReference === identity.contentReference);
      const adopted = referenceProjection?.adoptions.some(row => row.reference.id === identity.id && row.reference.version === identity.version
        && row.reference.contentReference === identity.contentReference);
      if (!version || !adopted) throw new HopV55WorkspaceRepositoryError('invalidInput', 'La référence de préparation J5 n’est pas exactement adoptée dans le journal NR du workspace.');
    }
    if (ids.has(preparation.id) || eventIds.has(preparation.eventId)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'ID de préparation ou eventId J5 dupliqué dans le workspace.');
    }
    ids.add(preparation.id); eventIds.add(preparation.eventId);
  }
}

function assertCopyRecomputations(value: unknown): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Reprises de prévision de copie invalides.');
  const contentReferences = new Set<string>();
  const scenarioSnapshots = new Set<string>();
  for (const raw of value) {
    const read = readHopV55FullRecipeCopyRecomputePayload(raw);
    if (read.status !== 'available') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Reprise de prévision de copie invalide : ${read.reason}`);
    }
    const payload = read.payload;
    if (!isId(payload.scenarioId) || !isText(payload.snapshotReference) || !isId(payload.branchId)
      || !isText(payload.branchReference) || !isText(payload.contentReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Identité de reprise de prévision de copie invalide.');
    }
    const scenarioSnapshot = `${payload.scenarioId}\0${payload.snapshotReference}`;
    if (contentReferences.has(payload.contentReference) || scenarioSnapshots.has(scenarioSnapshot)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Référence de contenu ou snapshot de reprise dupliqué dans le workspace.');
    }
    contentReferences.add(payload.contentReference);
    scenarioSnapshots.add(scenarioSnapshot);
  }
}

/**
 * Semantic V4 filiation inside the same workspace: a reinterpretation cites an
 * earlier parent of its declared format; a correction cites an earlier V4 of
 * the same question, keeps every annotation anchor and changes exactly the
 * annotations it declares; a scope revision cites an earlier V3/V4 parent.
 * V1–V3 archives keep their historical acceptance rules unchanged.
 */
function assertSemanticReadingFiliation(archive: HopV55DecisionReadingArchiveV4,
  earlier: ReadonlyMap<string, HopV55DecisionReadingArchive>): void {
  const question = archive.reading.intent.question;
  const parentOf = (reference: string, label: string): HopV55DecisionReadingArchive => {
    const parent = earlier.get(reference);
    if (!parent || parent.ownerKey !== archive.ownerKey || parent.workspaceId !== archive.workspaceId
      || parent.reading.intent.question !== question) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `${label} : lecture parent absente, postérieure, étrangère ou d’une autre question.`);
    }
    return parent;
  };
  if (archive.lineage) {
    const parent = parentOf(archive.lineage.parentReadingReference, 'Réinterprétation V4');
    if (parent.format !== archive.lineage.parentReadingFormat) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le format déclaré du parent de la réinterprétation V4 diverge de l’archive citée.');
    }
  }
  const correction = archive.reading.correction;
  if (correction) {
    const parent = parentOf(correction.sourceReadingReference, 'Correction sémantique V4');
    if (parent.format !== 'hop-v55-decision-reading-v4') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une correction sémantique V4 part d’une lecture V4; une ancienne lecture passe par une réinterprétation explicite.');
    }
    const changed = new Set(correction.changedAnnotationIds);
    const previous = parent.reading.annotations;
    const next = archive.reading.annotations;
    const anchorsKept = previous.length === next.length && previous.every((row, index) => {
      const corrected = next[index];
      return corrected.id === row.id && sameWorkspaceValue(corrected.source, row.source)
        && sameWorkspaceValue(corrected.qualifierSource ?? null, row.qualifierSource ?? null)
        && sameWorkspaceValue(corrected.frameSource ?? null, row.frameSource ?? null)
        && sameWorkspaceValue(corrected.instrumentSource ?? null, row.instrumentSource ?? null)
        && sameWorkspaceValue(corrected.subject?.source ?? null, row.subject?.source ?? null);
    });
    if (!anchorsKept) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une correction V4 doit garder chaque annotation, son ID et ses sources exactes.');
    if (previous.some((row, index) => changed.has(row.id) === sameWorkspaceValue(row, next[index]))) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une correction V4 doit déclarer exactement les annotations modifiées; aucune altération cachée n’est admise.');
    }
  }
  if (archive.transition?.kind === 'reviseScopes') {
    const parent = parentOf(archive.transition.parentReadingReference ?? '', 'Révision de portées V4');
    if (parent.format !== 'hop-v55-decision-reading-v3' && parent.format !== 'hop-v55-decision-reading-v4') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une révision de portées V4 doit citer une lecture V3/V4 qui porte des portées.');
    }
  }
}

function assertDecisionReadings(value: unknown, workspace: HopV55Workspace,
  futureDrafts: Map<string, HopV55FutureRecipeDraftV1>): Map<string, HopV55DecisionReadingArchive> {
  const archives = new Map<string, HopV55DecisionReadingArchive>();
  if (value === undefined) return archives;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Archives de lectures de décision invalides.');
  const ids = new Set<string>();
  const contentReferences = new Set<string>();
  const expectedSource = workspace.sourceBatchId ? { kind: 'batch', id: workspace.sourceBatchId }
    : workspace.sourceRecipeId ? { kind: 'recipe', id: workspace.sourceRecipeId } : { kind: 'exploration' };
  for (const raw of value) {
    const read = readHopV55DecisionReadingArchive(raw);
    if (read.status === 'unsupportedFormat') {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', `Lecture de décision future conservée sans interprétation : ${read.format}`);
    }
    if (read.status !== 'available') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Archive de lecture de décision invalide : ${read.reason}`);
    }
    const archive = read.archive;
    const sourceMatches = archive.source.kind === 'localFutureDraft'
      ? archive.source.workspaceId === workspace.id && futureDrafts.has(futureDraftReferenceKey(
        archive.source.draftId, archive.source.revision, archive.source.contentReference))
      : archive.source.kind === 'localRecipeCopy' ? isExactLocalRecipeCopySource(workspace, archive.source)
        : sameWorkspaceValue(archive.source, expectedSource);
    if (archive.ownerKey !== workspace.ownerKey || archive.workspaceId !== workspace.id || !sourceMatches) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Owner, workspace ou source de la lecture ne correspond pas aux identités figées du dossier.');
    }
    if (!isId(archive.id) || ids.has(archive.id) || contentReferences.has(archive.contentReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'ID ou référence de contenu de lecture dupliqué dans le workspace.');
    }
    if (archive.format === 'hop-v55-decision-reading-v4') assertSemanticReadingFiliation(archive, archives);
    ids.add(archive.id);
    contentReferences.add(archive.contentReference);
    archives.set(archive.contentReference, archive);
  }
  return archives;
}

function assertOpaqueDocumentaryMetadata(raw: unknown, workspace: HopV55Workspace,
  decisionReadings: Map<string, HopV55DecisionReadingArchive>, label: string): void {
  if (!isRecord(raw)) throw new HopV55WorkspaceRepositoryError('invalidInput', `${label} futur illisible.`);
  if (raw.ownerKey !== undefined && raw.ownerKey !== workspace.ownerKey
    || raw.workspaceId !== undefined && raw.workspaceId !== workspace.id) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', `${label} futur lié à un autre owner ou workspace.`);
  }
  if (raw.sourceReadingReference !== undefined
    && (typeof raw.sourceReadingReference !== 'string' || !decisionReadings.has(raw.sourceReadingReference))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', `${label} futur sans archive de lecture exacte dans ce workspace.`);
  }
}

type HopV55DocumentaryAnswerVersion = 'v1' | 'v2' | 'v3' | 'v4';
type HopV55VersionedDocumentaryAnswer = { version: HopV55DocumentaryAnswerVersion; record: HopV55DocumentaryAnswerRecord };

function documentaryDomainAnswerReference(record: HopV55DocumentaryAnswerRecord,
  version: HopV55DocumentaryAnswerVersion): string | undefined {
  if (version === 'v4') {
    const v4 = record as HopV55PropertyAdviceAnswerRecordV4;
    return v4.outcome.kind === 'domainAnswer' ? v4.outcome.answerReference : undefined;
  }
  return (record as { answerReference: string }).answerReference;
}

function assertV4AnswerTransition(input: {
  record: HopV55PropertyAdviceAnswerRecordV4;
  latestForReading?: HopV55VersionedDocumentaryAnswer;
  recordsByReference: Map<string, HopV55VersionedDocumentaryAnswer>;
  workspace: HopV55Workspace;
}): void {
  const { record, latestForReading, recordsByReference, workspace } = input;
  const transition = record.transition;
  const firstEntryById = new Map<string, HopV55PropertyAdviceAnswerRecordV4['ledger']['entries'][number]>();
  for (const entry of record.ledger.entries) if (!firstEntryById.has(entry.annotationId)) firstEntryById.set(entry.annotationId, entry);
  const assertInitialLedger = (requiredSources?: HopV55PropertyAdviceAnswerRecordV3['answerSnapshot']['requestSnapshot']['propertyIntents']) => {
    for (let index = 0; index < record.ledger.sourceAnnotations.length; index++) {
      const annotation = record.ledger.sourceAnnotations[index];
      const first = firstEntryById.get(annotation.id);
      if (!first) throw new HopV55WorkspaceRepositoryError('invalidInput', `Annotation V4 initiale absente du ledger : ${annotation.id}.`);
      if (requiredSources && index < requiredSources.length) {
        if (!sameWorkspaceValue(annotation, requiredSources[index]) || first.sourceKind !== 'initial'
          || first.decision.kind !== 'initialize' || first.disposition !== 'active'
          || !sameWorkspaceValue(first.activeIntent, annotation)) {
          throw new HopV55WorkspaceRepositoryError('invalidInput', 'Upgrade V3→V4 doit initialiser actives et exactes toutes les annotations V3 archivées.');
        }
      } else if (requiredSources && index >= requiredSources.length && first.sourceKind !== 'added') {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Toute annotation hors du snapshot V3 initial doit être une addition V4 explicite.');
      } else if (first.sourceKind === 'added') {
        if (first.decision.kind !== 'add' || first.disposition !== 'active' || first.decision.actId !== transition.actId
          || first.additionActId !== transition.actId || first.sourceQuestionReference !== record.sourceReadingReference) {
          throw new HopV55WorkspaceRepositoryError('invalidInput', 'Toute annotation ajoutée dans cette transition doit porter son acte explicite et sa lecture exacte.');
        }
      } else if (first.sourceKind !== 'initial' || first.decision.kind !== 'initialize'
        || first.disposition !== 'active' || !sameWorkspaceValue(first.activeIntent, annotation)
        || first.decision.actId !== transition.actId) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Toute annotation initiale doit être conservée active avant ses corrections explicites.');
      }
    }
  };
  const assertLedgerContinuation = (priorLedger: HopV55PropertyAdviceAnswerRecordV4['ledger']) => {
    const nextLedger = record.ledger;
    if (nextLedger.sourceAnnotations.length < priorLedger.sourceAnnotations.length
      || priorLedger.sourceAnnotations.some((annotation, index) => !sameWorkspaceValue(annotation, nextLedger.sourceAnnotations[index]))
      || nextLedger.entries.length < priorLedger.entries.length
      || priorLedger.entries.some((entry, index) => !sameWorkspaceValue(entry, nextLedger.entries[index]))) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une transition V4 doit conserver exactement le préfixe source et ledger de son parent.');
    }
    if (nextLedger.entries.slice(priorLedger.entries.length).some(entry => entry.decision.actId !== transition.actId)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Les nouvelles décisions du ledger doivent citer l’acte exact de la transition V4.');
    }
    const priorIds = new Set(priorLedger.sourceAnnotations.map(annotation => annotation.id));
    for (const annotation of nextLedger.sourceAnnotations.slice(priorLedger.sourceAnnotations.length)) {
      if (priorIds.has(annotation.id)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une annotation source V4 ne peut pas être remplacée sous le même ID.');
      const first = firstEntryById.get(annotation.id);
      if (!first || first.sourceKind !== 'added' || first.decision.kind !== 'add'
        || first.decision.actId !== transition.actId || first.additionActId !== transition.actId
        || first.sourceQuestionReference !== record.sourceReadingReference) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Toute nouvelle annotation doit citer l’acte et la lecture courants.');
      }
    }
  };
  if (transition.kind === 'create') {
    if (latestForReading) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une nouvelle ligne de lecture V4 ne peut pas contourner sa tête existante.');
    assertInitialLedger();
    return;
  }
  const parent = transition.parentRecordReference ? recordsByReference.get(transition.parentRecordReference) : undefined;
  if (!parent || parent.record.ownerKey !== workspace.ownerKey || parent.record.workspaceId !== workspace.id
    || parent.record.sourceReadingReference !== transition.parentReadingReference) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'La transition V4 doit citer un record parent exact du même owner/workspace.');
  }
  if (transition.kind === 'reexamine') {
    if (transition.parentReadingReference === record.sourceReadingReference || latestForReading) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un réexamen V4 doit ouvrir une lecture distincte sans reprendre sa tête par fallback.');
    }
    if (parent.version !== 'v4') throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Un réexamen V4 doit reprendre un record V4 explicite; la montée V3 reste upgradeV3.');
    assertLedgerContinuation((parent.record as HopV55PropertyAdviceAnswerRecordV4).ledger);
    return;
  }
  if (!latestForReading || latestForReading.record.reference !== transition.parentRecordReference
    || transition.parentReadingReference !== record.sourceReadingReference) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une transition V4 même lecture doit prolonger sa tête précédente exacte.');
  }
  if (transition.kind === 'upgradeV3') {
    if (latestForReading.version !== 'v3' || parent.version !== 'v3') {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'L’upgrade explicite V3→V4 doit partir de la réponse V3 courante exacte.');
    }
    const sourceV3 = parent.record as HopV55PropertyAdviceAnswerRecordV3;
    const original = sourceV3.answerSnapshot.requestSnapshot.propertyIntents;
    if (record.ledger.sourceAnnotations.length < original.length) throw new HopV55WorkspaceRepositoryError('invalidInput', 'L’upgrade V3→V4 ne peut pas perdre une annotation source.');
    assertInitialLedger(original);
    return;
  }
  if (transition.kind !== 'revise' || latestForReading.version !== 'v4' || parent.version !== 'v4') {
    throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une révision V4 doit prolonger une tête V4; l’upgrade V3 reste une étape explicite.');
  }
  assertLedgerContinuation((parent.record as HopV55PropertyAdviceAnswerRecordV4).ledger);
}

function assertDocumentaryAnswers(value: unknown, workspace: HopV55Workspace,
  decisionReadings: Map<string, HopV55DecisionReadingArchive>): Map<string, HopV55VersionedDocumentaryAnswer> {
  const records = new Map<string, HopV55VersionedDocumentaryAnswer>();
  if (value === undefined) return records;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Historique des réponses documentaires invalide.');
  const ids = new Set<string>(), references = new Set<string>();
  const earlierAnswers = new Map<string, HopV55DocumentaryAnswerRecord>();
  const latestByReading = new Map<string, HopV55VersionedDocumentaryAnswer>();
  const futureFormatsByReading = new Set<string>();
  for (const raw of value) {
    let read: ReturnType<typeof readHopV55DocumentaryAnswerRecord>;
    try { read = readHopV55DocumentaryAnswerRecord(raw); }
    catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', `Réponse documentaire invalide : ${(error as Error).message}`); }
    if (read.status === 'unsupportedReadOnly') {
      assertOpaqueDocumentaryMetadata(read.snapshot, workspace, decisionReadings, 'Réponse documentaire');
      if (isRecord(read.snapshot)) {
        if (typeof read.snapshot.sourceReadingReference === 'string') futureFormatsByReading.add(read.snapshot.sourceReadingReference);
        if (typeof read.snapshot.id === 'string') {
          if (ids.has(read.snapshot.id)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'ID de réponse documentaire dupliqué.');
          ids.add(read.snapshot.id);
        }
        if (typeof read.snapshot.reference === 'string') {
          if (references.has(read.snapshot.reference)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Référence de réponse documentaire dupliquée.');
          references.add(read.snapshot.reference);
        }
      }
      continue;
    }
    const record = read.record;
    const version = read.version;
    if (record.ownerKey !== workspace.ownerKey || record.workspaceId !== workspace.id) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'La réponse documentaire appartient à un autre owner ou workspace.');
    }
    const reading = decisionReadings.get(record.sourceReadingReference);
    if (!reading || reading.ownerKey !== workspace.ownerKey || reading.workspaceId !== workspace.id) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'La réponse documentaire doit pointer vers une lecture persistée du même workspace.');
    }
    const domainAnswerReference = documentaryDomainAnswerReference(record, version);
    if (version === 'v4') {
      const recordV4 = record as HopV55PropertyAdviceAnswerRecordV4;
      if (!isId(record.id) || !isText(record.reference) || recordV4.originalQuestion !== reading.reading.intent.question
        || !sameWorkspaceValue(recordV4.preparation.source, reading.source)
        || !recordV4.preparation.preparedReference
        || recordV4.outcome.kind === 'domainAnswer' && (!isText(recordV4.outcome.requestDraftReference)
          || !isText(recordV4.outcome.answerReference) || recordV4.outcome.answerSnapshot?.reference !== recordV4.outcome.answerReference)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Réponse documentaire V4, question source ou préparation exacte invalide.');
      }
      const firstLedgerEntries = new Map<string, HopV55PropertyAdviceAnswerRecordV4['ledger']['entries'][number]>();
      for (const entry of recordV4.ledger.entries) if (!firstLedgerEntries.has(entry.annotationId)) firstLedgerEntries.set(entry.annotationId, entry);
      for (const [annotationId, entry] of firstLedgerEntries) {
        if (entry.sourceKind !== 'added') continue;
        if (!entry.sourceQuestionReference) throw new HopV55WorkspaceRepositoryError('invalidInput', `Ajout d’annotation ${annotationId} sans source de question exacte.`);
        const additionSource = decisionReadings.get(entry.sourceQuestionReference);
        if (!additionSource || additionSource.ownerKey !== workspace.ownerKey || additionSource.workspaceId !== workspace.id
          || additionSource.reading.intent.question !== recordV4.originalQuestion
          || entry.additionActId !== entry.decision.actId
          || entry.decision.actId === recordV4.transition.actId && entry.sourceQuestionReference !== recordV4.sourceReadingReference) {
          throw new HopV55WorkspaceRepositoryError('invalidInput', `Ajout d’annotation ${annotationId} sans sa source de question exacte dans le même workspace.`);
        }
      }
    } else if (!isId(record.id) || !isText(record.reference) || !isText((record as any).requestDraftReference)
      || !isText((record as any).preparedReference) || !isText(domainAnswerReference)
      || (record as any).answerSnapshot?.reference !== domainAnswerReference) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Réponse documentaire, empreinte ou références de préparation invalides.');
    }
    if (futureFormatsByReading.has(record.sourceReadingReference)) {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une réponse future précède ce record; aucun ancien format courant ne la remplace.');
    }
    if (ids.has(record.id) || references.has(record.reference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'ID ou empreinte de réponse documentaire dupliqué.');
    }
    const previousForReading = latestByReading.get(record.sourceReadingReference);
    if (version !== 'v4' && previousForReading?.version === 'v4') {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une réponse V1/V2/V3 ne peut pas reprendre la tête universelle V4, y compris allRejected.');
    }
    if (version === 'v1' && previousForReading && previousForReading.version !== 'v1') {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une réponse V1 ne peut pas reprendre la tête d’une lignée documentaire V2/V3.');
    }
    if (version === 'v2' && previousForReading?.version === 'v3') {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une réponse V2 ne peut pas reprendre la tête d’une lignée documentaire V3.');
    }
    if (version === 'v3' && previousForReading?.version === 'v1') {
      throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une lignée documentaire V1 doit passer explicitement par V2 avant V3.');
    }
    if (version === 'v4') {
      try { assertV4AnswerTransition({ record: record as HopV55PropertyAdviceAnswerRecordV4,
        latestForReading: previousForReading, recordsByReference: records, workspace }); }
      catch (error) {
        const code = error instanceof HopV55WorkspaceRepositoryError && error.code === 'unsupportedFormat' ? 'unsupportedFormat' : 'invalidInput';
        throw new HopV55WorkspaceRepositoryError(code, error instanceof Error ? error.message : 'Transition de réponse V4 invalide.');
      }
    }
    const versionedV2V3 = version === 'v2' || version === 'v3'
      ? record as HopV55PropertyAdviceAnswerRecordV2 | HopV55PropertyAdviceAnswerRecordV3 : undefined;
    const revisionContext: HopV55DocumentaryRevisionContextV1 | undefined = version === 'v1'
      ? (record as HopV55DocumentaryAnswerRecordV1).revisionContext
      : versionedV2V3?.revisionContext;
    if (version !== 'v4' && previousForReading && !revisionContext) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Une réponse ${version.toUpperCase()} doit conserver une filiation explicite vers la réponse antérieure exacte.`);
    }
    if (revisionContext !== undefined) {
      const revision = revisionContext;
      const sourceVersioned = records.get(revision.sourceAnswerRecordReference);
      const source = sourceVersioned?.record ?? earlierAnswers.get(revision.sourceAnswerRecordReference);
      const latest = previousForReading?.record;
      if (!source || source.reference !== latest?.reference || source.ownerKey !== record.ownerKey
        || source.workspaceId !== record.workspaceId || source.sourceReadingReference !== record.sourceReadingReference
        || documentaryDomainAnswerReference(source, sourceVersioned?.version ?? 'v1') !== revision.sourceAnswerReference || !isText(revision.reason)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'La révision documentaire doit prolonger la réponse précédente exacte de la même lecture.');
      }
      if (version === 'v3' && sourceVersioned?.version === 'v1'
        || version === 'v2' && sourceVersioned?.version === 'v3') {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'La filiation documentaire ne peut pas sauter ou inverser une version de schéma.');
      }
      if (version === 'v1' && sourceVersioned?.version !== 'v1') {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une filiation documentaire V1 ne peut citer qu’une réponse V1 antérieure.');
      }
    }
    const reexamination = versionedV2V3?.reexaminationContext;
    if (reexamination !== undefined) {
      const source = earlierAnswers.get(reexamination.sourceAnswerRecordReference);
      if (!source || source.ownerKey !== record.ownerKey || source.workspaceId !== record.workspaceId
        || documentaryDomainAnswerReference(source, 'v3') !== reexamination.sourceAnswerReference
        || source.sourceReadingReference !== reexamination.sourceReadingReference
        || source.sourceReadingReference === record.sourceReadingReference) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le réexamen doit référencer une réponse antérieure exacte du même owner/workspace, issue d’une autre lecture.');
      }
    }
    ids.add(record.id); references.add(record.reference);
    earlierAnswers.set(record.reference, record); latestByReading.set(record.sourceReadingReference, { version, record });
    records.set(record.reference, { version, record });
  }
  return records;
}

function assertDocumentaryDossiers(value: unknown, workspace: HopV55Workspace,
  decisionReadings: Map<string, HopV55DecisionReadingArchive>,
  answers: Map<string, HopV55VersionedDocumentaryAnswer>): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Historique des dossiers documentaires invalide.');
  const ids = new Set<string>(), references = new Set<string>(), dossierReferences = new Set<string>();
  for (const raw of value) {
    let read: ReturnType<typeof readHopV55DocumentaryDossierRecord>;
    try { read = readHopV55DocumentaryDossierRecord(raw); }
    catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', `Dossier documentaire invalide : ${(error as Error).message}`); }
    if (read.status === 'unsupportedReadOnly') {
      assertOpaqueDocumentaryMetadata(read.snapshot, workspace, decisionReadings, 'Dossier documentaire');
      if (isRecord(read.snapshot)) {
        if (typeof read.snapshot.id === 'string') {
          if (ids.has(read.snapshot.id)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'ID de dossier documentaire dupliqué.');
          ids.add(read.snapshot.id);
        }
        if (typeof read.snapshot.reference === 'string') {
          if (references.has(read.snapshot.reference)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Référence de dossier documentaire dupliquée.');
          references.add(read.snapshot.reference);
        }
      }
      continue;
    }
    const record = read.record;
    const version = read.version;
    if (record.ownerKey !== workspace.ownerKey || record.workspaceId !== workspace.id) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le dossier documentaire appartient à un autre owner ou workspace.');
    }
    const reading = decisionReadings.get(record.sourceReadingReference);
    const answerEnvelope = answers.get(record.answerRecordReference);
    const answer = answerEnvelope?.record;
    const answerReference = answer && answerEnvelope ? documentaryDomainAnswerReference(answer, answerEnvelope.version) : undefined;
    if (!reading || !answer || reading.ownerKey !== workspace.ownerKey || reading.workspaceId !== workspace.id
      || answer.sourceReadingReference !== record.sourceReadingReference || !answerReference) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le dossier doit pointer vers une lecture et une réponse exactes du même workspace.');
    }
    if (version !== answerEnvelope?.version
      || !isId(record.id) || !isText(record.reference) || !isText(record.dossierReference)
      || !isText(record.answerRecordReference) || !isText(record.answerReference)
      || record.answerReference !== answerReference
      || record.dossierSnapshot?.reference !== record.dossierReference
      || record.dossierSnapshot?.answerReference !== record.answerReference) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Dossier documentaire, empreinte ou lien vers la réponse choisi invalide.');
    }
    if (version === 'v2' || version === 'v3') {
      const strategyDossier = record as Extract<HopV55DocumentaryDossierRecord,
        { format: 'hop-v55-documentary-dossier-record-v2' | 'hop-v55-documentary-dossier-record-v3' }>;
      if (strategyDossier.dossierSnapshot.strategyId !== strategyDossier.strategyId
        || strategyDossier.dossierSnapshot.strategyReference !== strategyDossier.strategyReference) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', `Le dossier ${version.toUpperCase()} doit rester lié à sa stratégie exacte.`);
      }
    }
    if (version === 'v4') {
      const answerV4 = answer as HopV55PropertyAdviceAnswerRecordV4;
      const dossierV4 = record as Extract<HopV55DocumentaryDossierRecord, { format: 'hop-v55-documentary-dossier-record-v4' }>;
      if (answerV4.outcome.kind !== 'domainAnswer' || dossierV4.ledgerReference !== answerV4.ledger.reference
        || dossierV4.dossierSnapshot.strategyId !== dossierV4.strategyId
        || dossierV4.dossierSnapshot.strategyReference !== dossierV4.strategyReference
        || dossierV4.dossierSnapshot.answerSnapshot.reference !== answerV4.outcome.answerReference) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un dossier V4 doit lier la réponse V4 domainAnswer, son ledger et sa stratégie V3 exacts.');
      }
    }
    if (ids.has(record.id) || references.has(record.reference) || dossierReferences.has(record.dossierReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'ID ou empreinte de dossier documentaire dupliqué.');
    }
    ids.add(record.id); references.add(record.reference); dossierReferences.add(record.dossierReference);
  }
}

function hasUnsupportedDocumentaryRecordForReading(
  rows: Array<HopV55DocumentaryAnswerRecord | HopV55DocumentaryDossierRecord | Record<string, unknown>>,
  reader: typeof readHopV55DocumentaryAnswerRecord | typeof readHopV55DocumentaryDossierRecord,
  sourceReadingReference: string,
): boolean {
  return rows.some(raw => {
    try {
      const result = reader(raw);
      return result.status === 'unsupportedReadOnly' && isRecord(result.snapshot)
        && result.snapshot.sourceReadingReference === sourceReadingReference;
    } catch { return false; }
  });
}

function validateWorkspace(value: unknown, assistedAdviceContract?: HopV55AssistedAdviceBackendContractV1): asserts value is HopV55Workspace {
  if (!isRecord(value) || !onlyKeys(value, ['format', 'id', 'ownerKey', 'revision', 'title', 'intent', 'sourceRecipeId', 'sourceBatchId',
    'decisionReadings', 'futureDrafts', 'activeFutureDraftSource', 'futureRecipeMaterializations', 'futureRecipeSaveReceipts',
    'documentaryAnswers', 'documentaryDossiers',
    'qualifiedStudyPreparations', 'qualifiedStudyLinks', 'qualifiedStudyPreferenceCommands',
    'propertyAdviceReexaminationCommandStaging', 'propertyAdviceReexaminationCommandReceipts',
    'scenarioIds', 'activeScenarioId', 'selected', 'referenceHypotheses', 'referenceJournal', 'nuancePlans', 'nuanceStudies',
    'explorationProfiles',
    'explorationTrialPreparations', 'explorationTrialReceipts',
    'snapshotIntents', 'recipeSaveReceipts', 'serverScenarioReceipts', 'referenceComparisons', 'scenarioPreparations',
    'observationAnchors', 'observationProjections', 'observationSupportRecords', 'observationSupportSelections',
    'assistedAdviceTickets', 'assistedAdviceRecords',
    'copies', 'fullCopyReceipts', 'copyRecomputations', 'programCopies', 'activeProgramCopyId', 'activeCopyId', 'updatedAt'])
    || value.format !== 'hop-v55-workspace-v1' || !isId(value.id) || !isText(value.ownerKey)
    || value.ownerKey.trim() !== value.ownerKey || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0
    || !isText(value.title) || !Array.isArray(value.scenarioIds)
    || !Array.isArray(value.referenceHypotheses) || !Array.isArray(value.copies) || !isText(value.updatedAt)
    || !Number.isFinite(Date.parse(value.updatedAt))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Structure du workspace houblon invalide.');
  }
  try { assertHopV55ObservationCollections(value); }
  catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', error instanceof Error ? error.message : 'Collections d’observation invalides.'); }
  assertIntent(value.intent, 'courante');

  for (const key of ['sourceRecipeId', 'sourceBatchId', 'activeScenarioId', 'activeCopyId', 'activeProgramCopyId'] as const) {
    if (value[key] !== undefined && !isId(value[key])) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Référence ${key} invalide.`);
    }
  }

  const scenarioIds = new Set<string>();
  for (const scenarioId of value.scenarioIds) {
    if (!isId(scenarioId) || scenarioIds.has(scenarioId)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Identifiant de scénario invalide ou dupliqué.');
    }
    scenarioIds.add(scenarioId);
  }
  if (value.activeScenarioId !== undefined && !scenarioIds.has(value.activeScenarioId as string)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le scénario actif est absent du workspace.');
  }
  assertServerScenarioReceipts(value.serverScenarioReceipts, scenarioIds);
  assertReferenceComparisons(value.referenceComparisons, value.ownerKey as string, scenarioIds);
  assertCopyRecomputations(value.copyRecomputations);
  const futureDraftHistory = assertFutureDrafts(value.futureDrafts);
  const decisionReadings = assertDecisionReadings(value.decisionReadings, value as unknown as HopV55Workspace, futureDraftHistory.byReference);
  const scopeLedgersByReading = new Map([...decisionReadings].flatMap(([reference, archive]) => {
    const scopes = hopV55DecisionReadingScopesV1(archive);
    return scopes ? [[reference, scopes.scopeLedger] as const] : [];
  }));
  const sourceRuntimeReferencesByReading = new Map([...decisionReadings].map(([reference, archive]) =>
    [reference, archive.runtimeReference] as const));
  try {
    assertHopV55QualifiedStudyWorkspaceCollections({ ownerKey: value.ownerKey as string, workspaceId: value.id as string,
      sourceReadingReferences: new Set(decisionReadings.keys()),
      scopeLedgersByReading,
      sourceRuntimeReferencesByReading,
      preparations: value.qualifiedStudyPreparations, links: value.qualifiedStudyLinks });
  } catch (error) {
    throw new HopV55WorkspaceRepositoryError(error instanceof HopV55QualifiedStudyWorkspaceError
      && error.code === 'unsupportedFormat' ? 'unsupportedFormat' : 'invalidInput',
    error instanceof Error ? error.message : 'Historique des études qualifiées invalide.');
  }
  try { assertHopV55QualifiedStudyPreferenceCommands(value as unknown as HopV55Workspace); }
  catch (error) {
    throw new HopV55WorkspaceRepositoryError(error instanceof HopV55QualifiedStudyPreferenceError
      && error.code === 'unsupportedFormat' ? 'unsupportedFormat' : 'invalidInput',
    error instanceof Error ? error.message : 'Staging des préférences qualifiées invalide.');
  }
  const documentaryAnswers = assertDocumentaryAnswers(value.documentaryAnswers, value as unknown as HopV55Workspace, decisionReadings);
  assertDocumentaryDossiers(value.documentaryDossiers, value as unknown as HopV55Workspace, decisionReadings, documentaryAnswers);
  try { assertHopV55PropertyAdviceReexaminationCommandWorkspace(value as unknown as HopV55Workspace); }
  catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', error instanceof Error ? error.message : 'Commande de réexamen V4 invalide.'); }
  assertScenarioPreparations(value.scenarioPreparations, value as unknown as HopV55Workspace, scenarioIds, decisionReadings, futureDraftHistory.byReference);

  if (value.selected !== undefined) {
    const selected = value.selected;
    if (!isRecord(selected) || !onlyKeys(selected, ['scenarioId', 'snapshotReference', 'branchId', 'branchReference'])
      || !isId(selected.scenarioId) || !scenarioIds.has(selected.scenarioId)
      || !isText(selected.snapshotReference) || !isId(selected.branchId) || !isText(selected.branchReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Sélection de scénario invalide.');
    }
  }

  const hypothesisIds = new Set<string>();
  for (const hypothesis of value.referenceHypotheses) {
    if (!isRecord(hypothesis) || !onlyKeys(hypothesis, ['id', 'version', 'label', 'baseline', 'recordedAt'])
      || !isId(hypothesis.id) || !Number.isSafeInteger(hypothesis.version)
      || (hypothesis.version as number) < 1 || !isText(hypothesis.label) || !isText(hypothesis.recordedAt)
      || !Number.isFinite(Date.parse(hypothesis.recordedAt)) || hypothesisIds.has(hypothesis.id)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Hypothèse de référence invalide ou dupliquée.');
    }
    assertScenarioBaseline(hypothesis.baseline);
    hypothesisIds.add(hypothesis.id);
  }

  if (value.referenceJournal !== undefined) {
    try { readHopV55ReferenceJournal(value as unknown as HopV55Workspace); }
    catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', `Journal de référence invalide : ${(error as Error).message}`); }
  }

  assertNuancePlans(value.nuancePlans);
  try { assertHopV55ExplorationProfileCollection(value.explorationProfiles); }
  catch (error) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', error instanceof Error ? error.message : 'Profils d’exploration invalides.');
  }
  try { assertHopV55ExplorationTrialWorkspaceCollections(value as unknown as HopV55Workspace); }
  catch (error) {
    throw new HopV55WorkspaceRepositoryError(error instanceof HopV55ExplorationTrialError && error.code === 'unsupportedFormat'
      ? 'unsupportedFormat' : 'invalidInput', error instanceof Error ? error.message : 'Historique des essais contextuels invalide.');
  }

  if (value.snapshotIntents !== undefined) {
    if (!Array.isArray(value.snapshotIntents)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Intents figés invalides.');
    const snapshotIntentKeys = new Set<string>();
    for (const snapshotIntent of value.snapshotIntents) {
      if (!isRecord(snapshotIntent) || !onlyKeys(snapshotIntent, ['scenarioId', 'snapshotReference', 'intent', 'decisionReadingReference'])
        || !isId(snapshotIntent.scenarioId) || !scenarioIds.has(snapshotIntent.scenarioId)
        || !isText(snapshotIntent.snapshotReference)
        || snapshotIntent.decisionReadingReference !== undefined && !isText(snapshotIntent.decisionReadingReference)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Référence d’intention figée invalide.');
      }
      const key = `${snapshotIntent.scenarioId}\0${snapshotIntent.snapshotReference}`;
      if (snapshotIntentKeys.has(key)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Intention figée dupliquée pour le même snapshot.');
      assertIntent(snapshotIntent.intent, 'figée');
      if (snapshotIntent.decisionReadingReference !== undefined) {
        const archive = decisionReadings.get(snapshotIntent.decisionReadingReference as string);
        if (!archive || !sameWorkspaceValue(archive.reading.intent, snapshotIntent.intent)) {
          throw new HopV55WorkspaceRepositoryError('invalidInput', 'Lecture de décision absente ou question/critères différents de l’intention figée.');
        }
      }
      snapshotIntentKeys.add(key);
    }
  }

  assertFutureDraftOrigins(value as unknown as HopV55Workspace, futureDraftHistory.byReference, scenarioIds);
  const futureMaterializationReceipts = assertFutureRecipeMaterializations(value.futureRecipeMaterializations,
    futureDraftHistory.byReference);
  assertFutureRecipeSaveReceipts(value.futureRecipeSaveReceipts, futureMaterializationReceipts);

  const copyIds = new Set<string>();
  for (const copyRow of value.copies) {
    if (!isRecord(copyRow) || !onlyKeys(copyRow, ['id', 'recipe', 'sourceRecipeId', 'previewReference', 'scenarioId',
      'snapshotReference', 'branchId', 'branchReference', 'createdAt', 'scope'])
      || !isId(copyRow.id) || copyIds.has(copyRow.id) || !isId(copyRow.sourceRecipeId)
      || !scenarioIds.has(String(copyRow.scenarioId)) || !isText(copyRow.previewReference)
      || !isText(copyRow.snapshotReference) || !isId(copyRow.branchId) || !isText(copyRow.branchReference)
      || !isText(copyRow.createdAt) || !Number.isFinite(Date.parse(copyRow.createdAt)) || copyRow.scope !== 'local') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Copie de recette invalide.');
    }
    assertRecipe(copyRow.recipe, copyRow.id);
    copyIds.add(copyRow.id);
  }
  if (value.activeCopyId !== undefined && !copyIds.has(value.activeCopyId as string)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'La copie active est absente du workspace.');
  }

  if (value.activeFutureDraftSource !== undefined) {
    const active = value.activeFutureDraftSource;
    if (!isRecord(active) || !onlyKeys(active, ['kind', 'workspaceId', 'draftId', 'revision', 'contentReference'])
      || active.kind !== 'localFutureDraft' || active.workspaceId !== value.id || !isId(active.draftId)
      || !Number.isSafeInteger(active.revision) || (active.revision as number) < 1 || !isText(active.contentReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Référence active du brouillon futur invalide ou d’un autre workspace.');
    }
    const exact = futureDraftHistory.byReference.get(futureDraftReferenceKey(active.draftId as string,
      active.revision as number, active.contentReference as string));
    const latest = futureDraftHistory.latestById.get(active.draftId as string);
    if (!exact || exact !== latest) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le brouillon futur actif doit référencer sa dernière révision conservée.');
    }
  }

  assertFullCopyReceipts(value.fullCopyReceipts, value.copies as HopV55Workspace['copies'], scenarioIds);
  const programCopyIds = assertProgramCopies(value.programCopies, scenarioIds, copyIds);
  if (value.activeProgramCopyId !== undefined && !programCopyIds.has(value.activeProgramCopyId as string)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le programme futur actif doit pointer vers une copie appliquée et conservée.');
  }
  if (Number(value.activeCopyId !== undefined) + Number(value.activeProgramCopyId !== undefined)
    + Number(value.activeFutureDraftSource !== undefined) > 1) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un workspace ne peut avoir qu’une source active parmi copie de recette, programme futur et brouillon futur.');
  }

  assertNuanceStudies(value.nuanceStudies, scenarioIds);
  try { assertHopV55ObservationSupportCollections(value); }
  catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', error instanceof Error ? error.message : 'Support d’observation invalide.'); }
  try { assertHopV55AssistedAdviceWorkspaceCollections(value as unknown as HopV55Workspace, assistedAdviceContract); }
  catch (error) {
    const code = error instanceof Error && 'code' in error && (error as { code?: unknown }).code === 'unsupportedFormat'
      ? 'unsupportedFormat' : 'invalidInput';
    throw new HopV55WorkspaceRepositoryError(code, error instanceof Error ? error.message : 'Archives assistées invalides.');
  }

  if (value.recipeSaveReceipts !== undefined) {
    if (!Array.isArray(value.recipeSaveReceipts)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Reçus de sauvegarde de recette invalides.');
    for (const receipt of value.recipeSaveReceipts) {
      if (!isRecord(receipt) || !onlyKeys(receipt, ['copyId', 'recipeId', 'confirmedAt'])
        || !copyIds.has(String(receipt.copyId)) || !isId(receipt.recipeId)
        || !isText(receipt.confirmedAt) || !Number.isFinite(Date.parse(receipt.confirmedAt))) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Reçu de sauvegarde sans copie, ID recette ou date valide.');
      }
    }
  }
}

function parseEnvelope(row: unknown, ownerKey: string, workspaceId?: string,
  assistedAdviceContract?: HopV55AssistedAdviceBackendContractV1): HopV55WorkspaceEnvelopeV1 {
  if (!isRecord(row) || !onlyKeys(row, ['format', 'ownerKey', 'workspaceId', 'revision', 'workspace'])
    || row.format !== 'hop-v55-workspace-envelope-v1' || row.ownerKey !== ownerKey
    || !isId(row.workspaceId) || workspaceId !== undefined && row.workspaceId !== workspaceId
    || !Number.isSafeInteger(row.revision) || (row.revision as number) < 1) {
    throw new HopV55WorkspaceRepositoryError('invalidStoredRecord', 'Enveloppe v1 du workspace illisible ou incohérente.');
  }
  try { validateWorkspace(row.workspace, assistedAdviceContract); }
  catch (error) {
    if (error instanceof HopV55WorkspaceRepositoryError && error.code === 'unsupportedFormat') throw error;
    throw new HopV55WorkspaceRepositoryError('invalidStoredRecord', (error as Error).message);
  }
  if (row.workspace.id !== row.workspaceId || row.workspace.ownerKey !== ownerKey || row.workspace.revision !== row.revision) {
    throw new HopV55WorkspaceRepositoryError('invalidStoredRecord', 'Les identités ou la révision de l’enveloppe divergent du workspace.');
  }
  return row as unknown as HopV55WorkspaceEnvelopeV1;
}

function assertAppendOnlyTransition(previous: HopV55Workspace, next: HopV55Workspace,
  assistedAdviceContract?: HopV55AssistedAdviceBackendContractV1): void {
  try { assertHopV55ObservationAppendOnly(previous, next); }
  catch (error) {
    const code = error instanceof HopV55ObservationSessionError && error.code === 'unsupportedFormat' ? 'unsupportedFormat' : 'invalidInput';
    throw new HopV55WorkspaceRepositoryError(code, error instanceof Error ? error.message : 'Transition des archives d’observation invalide.');
  }
  try { assertHopV55ObservationSupportAppendOnly(previous, next); }
  catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', error instanceof Error ? error.message : 'Transition du support d’observation invalide.'); }
  try { assertHopV55PropertyAdviceReexaminationCommandAppendOnly(previous, next); }
  catch (error) { throw new HopV55WorkspaceRepositoryError('invalidInput', error instanceof Error ? error.message : 'Transition de commande de réexamen V4 invalide.'); }
  try { assertHopV55AssistedAdviceWorkspaceAppendOnly(previous, next, assistedAdviceContract); }
  catch (error) {
    const code = error instanceof Error && 'code' in error && (error as { code?: unknown }).code === 'unsupportedFormat'
      ? 'unsupportedFormat' : 'invalidInput';
    throw new HopV55WorkspaceRepositoryError(code, error instanceof Error ? error.message : 'Transition assistée invalide.');
  }
  try { assertHopV55ExplorationTrialAppendOnly(previous, next); }
  catch (error) {
    const code = error instanceof HopV55ExplorationTrialError && error.code === 'unsupportedFormat'
      ? 'unsupportedFormat' : 'invalidInput';
    throw new HopV55WorkspaceRepositoryError(code, error instanceof Error ? error.message : 'Transition d’essai contextuel invalide.');
  }
  if (!sameWorkspaceValue(previous.sourceRecipeId, next.sourceRecipeId)
    || !sameWorkspaceValue(previous.sourceBatchId, next.sourceBatchId)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Les références source recette/brassin sont figées à la création du workspace.');
  }

  const priorAnswers = previous.documentaryAnswers ?? [];
  const nextAnswers = next.documentaryAnswers ?? [];
  if (nextAnswers.length < priorAnswers.length
    || priorAnswers.some((record, index) => !sameWorkspaceValue(record, nextAnswers[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Les réponses documentaires sont immuables et append-only.');
  }
  for (const raw of nextAnswers.slice(priorAnswers.length)) {
    try {
      const read = readHopV55DocumentaryAnswerRecord(raw);
      if (read.status !== 'readOnly') {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une réponse documentaire future reste en lecture seule et ne peut pas être ajoutée comme format courant.');
      }
      if (!(previous.decisionReadings ?? []).some(archive => archive.contentReference === read.record.sourceReadingReference)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'L’archive de lecture doit être persistée par CAS avant sa réponse documentaire.');
      }
      if (hasUnsupportedDocumentaryRecordForReading(priorAnswers, readHopV55DocumentaryAnswerRecord,
        read.record.sourceReadingReference)) {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une réponse future existe déjà pour cette lecture; aucun nouveau résultat courant ne la remplace.');
      }
      const latestSameReading = [...priorAnswers].reverse().flatMap(row => {
        const prior = readHopV55DocumentaryAnswerRecord(row);
        return prior.status === 'readOnly' && prior.record.sourceReadingReference === read.record.sourceReadingReference
          ? [prior] : [];
      })[0];
      if (read.version === 'v4') {
        const recordV4 = read.record as HopV55PropertyAdviceAnswerRecordV4;
        const transition = recordV4.transition;
        const parent = transition.parentRecordReference ? priorAnswers.flatMap(row => {
          const prior = readHopV55DocumentaryAnswerRecord(row);
          return prior.status === 'readOnly' && prior.record.reference === transition.parentRecordReference ? [prior] : [];
        })[0] : undefined;
        if (transition.kind === 'create') {
          if (latestSameReading || parent) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une création V4 n’ouvre que la première tête d’une lecture sans parent.');
        } else if (transition.kind === 'reexamine') {
          if (!parent || parent.record.ownerKey !== read.record.ownerKey || parent.record.workspaceId !== read.record.workspaceId
            || parent.record.sourceReadingReference !== transition.parentReadingReference
            || transition.parentReadingReference === read.record.sourceReadingReference || latestSameReading) {
            throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le réexamen V4 doit ouvrir une lecture distincte depuis un record parent déjà sauvegardé.');
          }
        } else {
          if (!latestSameReading || !parent || parent.record.reference !== latestSameReading.record.reference
            || parent.record.sourceReadingReference !== read.record.sourceReadingReference) {
            throw new HopV55WorkspaceRepositoryError('invalidInput', 'La transition V4 doit prolonger le record le plus récent et exact de la même lecture.');
          }
          if (transition.kind === 'upgradeV3' && (latestSameReading.version !== 'v3' || parent.version !== 'v3')
            || transition.kind === 'revise' && (latestSameReading.version !== 'v4' || parent.version !== 'v4')) {
            throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'L’upgrade V3→V4 et les révisions V4 restent des étapes de version explicites.');
          }
        }
        continue;
      }
      if (read.version === 'v1' && latestSameReading && latestSameReading.version !== 'v1') {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Un writer V1 ne peut pas reprendre la tête d’une réponse V2/V3.');
      }
      if (read.version === 'v2' && latestSameReading?.version === 'v3') {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Un writer V2 ne peut pas reprendre la tête d’une réponse V3.');
      }
      if (read.version === 'v3' && latestSameReading?.version === 'v1') {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Une lignée V1 doit passer explicitement par V2 avant V3.');
      }
      if (read.version === 'v1') {
        const recordV1 = read.record as HopV55DocumentaryAnswerRecordV1;
        if (latestSameReading && !recordV1.revisionContext) {
          throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une réponse V1 qui révise une lecture doit porter une filiation explicite.');
        }
        if (recordV1.revisionContext !== undefined) {
          const revision = recordV1.revisionContext;
          const sourceVersioned = priorAnswers.flatMap(row => {
            const prior = readHopV55DocumentaryAnswerRecord(row);
            return prior.status === 'readOnly' && prior.record.reference === revision.sourceAnswerRecordReference
              ? [prior] : [];
          })[0];
          const source = sourceVersioned?.record;
          if (!latestSameReading || !source || sourceVersioned?.version !== 'v1'
            || source.reference !== latestSameReading.record.reference
            || source.ownerKey !== read.record.ownerKey || source.workspaceId !== read.record.workspaceId
            || source.sourceReadingReference !== read.record.sourceReadingReference
            || documentaryDomainAnswerReference(source, 'v1') !== revision.sourceAnswerReference || !isText(revision.reason)) {
            throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une révision V1 doit prolonger la réponse précédente exacte de la même lecture.');
          }
        }
      }
      if (read.version === 'v2' || read.version === 'v3') {
        const recordV2V3 = read.record as HopV55PropertyAdviceAnswerRecordV2 | HopV55PropertyAdviceAnswerRecordV3;
        if (latestSameReading && !recordV2V3.revisionContext) {
          throw new HopV55WorkspaceRepositoryError('invalidInput', `Une réponse ${read.version.toUpperCase()} qui révise une lecture doit porter une filiation explicite.`);
        }
        if (recordV2V3.revisionContext !== undefined) {
          const revision = recordV2V3.revisionContext;
          const sourceVersioned = priorAnswers.flatMap(row => {
            const prior = readHopV55DocumentaryAnswerRecord(row);
            return prior.status === 'readOnly' && prior.record.reference === revision.sourceAnswerRecordReference
              ? [prior] : [];
          })[0];
          const source = sourceVersioned?.record;
          if (!source || source.ownerKey !== read.record.ownerKey || source.workspaceId !== read.record.workspaceId
            || source.sourceReadingReference !== read.record.sourceReadingReference
            || documentaryDomainAnswerReference(source, sourceVersioned!.version) !== revision.sourceAnswerReference || !isText(revision.reason)) {
            throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le contexte de révision doit référencer une réponse antérieure exacte du même owner, workspace et lecture.');
          }
          if (!latestSameReading || latestSameReading.record.reference !== source.reference
            || latestSameReading.version !== sourceVersioned!.version) {
            throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une réponse révisée doit prolonger la réponse courante la plus récente de cette lecture.');
          }
          if (read.version === 'v3' && sourceVersioned!.version === 'v1'
            || read.version === 'v2' && sourceVersioned!.version === 'v3') {
            throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'La filiation ne peut pas sauter ou inverser une version documentaire.');
          }
        }
        const reexamination = recordV2V3.reexaminationContext;
        if (reexamination !== undefined) {
          const sourceVersioned = priorAnswers.flatMap(row => {
            const prior = readHopV55DocumentaryAnswerRecord(row);
            return prior.status === 'readOnly' && prior.record.reference === reexamination.sourceAnswerRecordReference
              ? [prior] : [];
          })[0];
          const source = sourceVersioned?.record;
          if (!source || source.ownerKey !== read.record.ownerKey || source.workspaceId !== read.record.workspaceId
            || documentaryDomainAnswerReference(source, sourceVersioned!.version) !== reexamination.sourceAnswerReference
            || source.sourceReadingReference !== reexamination.sourceReadingReference
            || source.sourceReadingReference === read.record.sourceReadingReference) {
            throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un réexamen doit citer une réponse déjà persistée du même owner/workspace, avec réponse V2/V3 disponible et lecture distincte.');
          }
        }
      }
    } catch (error) {
      if (error instanceof HopV55WorkspaceRepositoryError) throw error;
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Nouvelle réponse documentaire invalide : ${(error as Error).message}`);
    }
  }
  const priorAnswerRecordReferences = new Set<string>();
  for (const raw of priorAnswers) {
    try {
      const read = readHopV55DocumentaryAnswerRecord(raw);
      if (read.status === 'readOnly') priorAnswerRecordReferences.add(read.record.reference);
    } catch { /* A stored future/opaque answer remains preserved but cannot authorize a new dossier. */ }
  }
  const priorDossiers = previous.documentaryDossiers ?? [];
  const nextDossiers = next.documentaryDossiers ?? [];
  if (nextDossiers.length < priorDossiers.length
    || priorDossiers.some((record, index) => !sameWorkspaceValue(record, nextDossiers[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Les dossiers documentaires sont immuables et append-only.');
  }
  for (const raw of nextDossiers.slice(priorDossiers.length)) {
    try {
      const read = readHopV55DocumentaryDossierRecord(raw);
      if (read.status !== 'readOnly') {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Un dossier documentaire futur reste en lecture seule et ne peut pas être ajouté comme format courant.');
      }
      if (!priorAnswerRecordReferences.has(read.record.answerRecordReference)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un dossier documentaire ne peut être ajouté qu’après l’enregistrement CAS de sa réponse exacte.');
      }
      const latestAnswer = [...priorAnswers].reverse().flatMap(row => {
        const prior = readHopV55DocumentaryAnswerRecord(row);
        return prior.status === 'readOnly' && prior.record.sourceReadingReference === read.record.sourceReadingReference
          ? [prior] : [];
      })[0];
      if (!latestAnswer || latestAnswer.record.reference !== read.record.answerRecordReference
        || latestAnswer.version !== read.version) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un dossier ne peut pas réutiliser une réponse antérieure à la dernière révision de cette lecture.');
      }
      if (hasUnsupportedDocumentaryRecordForReading(priorAnswers, readHopV55DocumentaryAnswerRecord,
        read.record.sourceReadingReference)
        || hasUnsupportedDocumentaryRecordForReading(priorDossiers, readHopV55DocumentaryDossierRecord,
          read.record.sourceReadingReference)) {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Un format documentaire futur existe pour cette lecture; aucun ancien choix n’est réutilisé.');
      }
    } catch (error) {
      if (error instanceof HopV55WorkspaceRepositoryError) throw error;
      throw new HopV55WorkspaceRepositoryError('invalidInput', `Nouveau dossier documentaire invalide : ${(error as Error).message}`);
    }
  }

  if (next.scenarioIds.length < previous.scenarioIds.length
    || previous.scenarioIds.some((scenarioId, index) => scenarioId !== next.scenarioIds[index])) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Les identités de scénario du workspace sont append-only.');
  }

  const priorSnapshotIntents = previous.snapshotIntents ?? [];
  const nextSnapshotIntents = next.snapshotIntents ?? [];
  if (nextSnapshotIntents.length < priorSnapshotIntents.length
    || priorSnapshotIntents.some((intent, index) => !sameWorkspaceValue(intent, nextSnapshotIntents[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Les intentions liées aux snapshots sont immuables et append-only.');
  }

  const priorDecisionReadings = previous.decisionReadings ?? [];
  const nextDecisionReadings = next.decisionReadings ?? [];
  if (nextDecisionReadings.length < priorDecisionReadings.length
    || priorDecisionReadings.some((archive, index) => !sameWorkspaceValue(archive, nextDecisionReadings[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Les lectures de décision sont immuables et append-only.');
  }
  try { assertHopV55QualifiedStudyAppendOnly(previous, next); }
  catch (error) {
    const code = error instanceof HopV55QualifiedStudyWorkspaceError && error.code === 'unsupportedFormat'
      ? 'unsupportedFormat' : 'invalidInput';
    throw new HopV55WorkspaceRepositoryError(code, error instanceof Error ? error.message : 'Transition d’étude qualifiée invalide.');
  }
  try { assertHopV55QualifiedStudyPreferenceAppendOnly(previous, next); }
  catch (error) {
    const code = error instanceof HopV55QualifiedStudyPreferenceError && error.code === 'unsupportedFormat'
      ? 'unsupportedFormat' : 'invalidInput';
    throw new HopV55WorkspaceRepositoryError(code, error instanceof Error ? error.message : 'Transition de staging préférence invalide.');
  }
  const priorFutureDrafts = previous.futureDrafts ?? [];
  const nextFutureDrafts = next.futureDrafts ?? [];
  if (nextFutureDrafts.length < priorFutureDrafts.length
    || priorFutureDrafts.some((draft, index) => !sameWorkspaceValue(draft, nextFutureDrafts[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Les révisions de brouillon futur sont immuables et append-only.');
  }
  const priorMaterializations = previous.futureRecipeMaterializations ?? [];
  const nextMaterializations = next.futureRecipeMaterializations ?? [];
  if (nextMaterializations.length < priorMaterializations.length
    || priorMaterializations.some((materialization, index) => !sameWorkspaceValue(materialization, nextMaterializations[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une Recipe matérialisée et son reçu d’origine sont immuables et append-only.');
  }
  const priorSaveReceipts = previous.futureRecipeSaveReceipts ?? [];
  const nextSaveReceipts = next.futureRecipeSaveReceipts ?? [];
  if (nextSaveReceipts.length < priorSaveReceipts.length
    || priorSaveReceipts.some((receipt, index) => !sameWorkspaceValue(receipt, nextSaveReceipts[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une confirmation de sauvegarde de future Recipe est immuable et append-only.');
  }
  const priorMaterializationReferences = new Set(priorMaterializations.map(materialization => materialization.receipt.contentReference));
  for (const receipt of nextSaveReceipts.slice(priorSaveReceipts.length)) {
    if (!priorMaterializationReferences.has(receipt.receiptReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le reçu de matérialisation doit être sauvegardé en CAS avant sa confirmation de Recipe.');
    }
  }
  const priorReadingReferences = new Set(priorDecisionReadings.map(archive => archive.contentReference));
  const priorPreparationCount = (previous.scenarioPreparations ?? []).length;
  for (const raw of (next.scenarioPreparations ?? []).slice(priorPreparationCount)) {
    const read = readHopV55ScenarioPreparation(raw);
    if (read.status === 'available' && read.preparation.decisionReadingReference
      && !priorReadingReferences.has(read.preparation.decisionReadingReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'La lecture doit être persistée avant la préparation qui peut lancer J5.');
    }
  }
  for (const intent of nextSnapshotIntents.slice(priorSnapshotIntents.length)) {
    if (intent.decisionReadingReference && !priorReadingReferences.has(intent.decisionReadingReference)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'La lecture doit être persistée dans un CAS antérieur au rattachement du snapshot J5.');
    }
  }

  if (!sameWorkspaceValue(previous.referenceHypotheses, next.referenceHypotheses)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'referenceHypotheses est un héritage en lecture seule; les nouvelles hypothèses passent par referenceJournal.');
  }

  const priorJournal = previous.referenceJournal;
  const nextJournal = next.referenceJournal;
  if (priorJournal && !nextJournal) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le journal de référence est append-only et ne peut pas être supprimé.');
  }
  if (priorJournal && nextJournal) {
    const priorRead = readHopV55ReferenceJournal(previous);
    const nextRead = readHopV55ReferenceJournal(next);
    if (priorRead.status === 'unsupportedFormat' || nextRead.status === 'unsupportedFormat') {
      if (!sameWorkspaceValue(priorJournal, nextJournal)) {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Un journal de référence futur reste en lecture seule.');
      }
    } else if (priorRead.status !== 'available' || nextRead.status !== 'available') {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Transition de journal de référence invalide.');
    } else {
      const priorEvents = priorRead.read.events;
      const nextEvents = nextRead.read.events;
      if (nextEvents.length < priorEvents.length || priorEvents.some((event, index) => !sameWorkspaceValue(event, nextEvents[index]))) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Le journal de référence ne conserve pas son préfixe historique exact.');
      }
    }
  }

  const priorStudies = previous.nuanceStudies ?? [];
  const nextStudies = next.nuanceStudies ?? [];
  if (nextStudies.length < priorStudies.length || priorStudies.some((study, index) => !sameWorkspaceValue(study, nextStudies[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une archive de nuance historique est immuable et append-only.');
  }

  const priorPlans = previous.nuancePlans ?? [];
  const nextPlans = next.nuancePlans ?? [];
  if (nextPlans.length < priorPlans.length || priorPlans.some((plan, index) => !sameWorkspaceValue(plan, nextPlans[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un plan de nuance historique est immuable et append-only.');
  }
  try { assertHopV55ExplorationProfileAppendOnly(previous.explorationProfiles, next.explorationProfiles); }
  catch (error) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', error instanceof Error ? error.message : 'Les profils d’exploration sont append-only.');
  }

  const priorFullReceipts = previous.fullCopyReceipts ?? [];
  const nextFullReceipts = next.fullCopyReceipts ?? [];
  if (nextFullReceipts.length < priorFullReceipts.length
    || priorFullReceipts.some((receipt, index) => !sameWorkspaceValue(receipt, nextFullReceipts[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un reçu de copie complète appliquée est immuable et append-only.');
  }
  if (nextFullReceipts.slice(priorFullReceipts.length).some(isLegacyFullCopyReceipt)) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un reçu historique V1 reste lisible mais ne peut pas être ajouté après la migration; produire un nouveau reçu scellé V2.');
  }
  const priorProgramCopies = previous.programCopies ?? [];
  const nextProgramCopies = next.programCopies ?? [];
  if (nextProgramCopies.length < priorProgramCopies.length
    || priorProgramCopies.some((copy, index) => !sameWorkspaceValue(copy, nextProgramCopies[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une copie de programme appliquée est immuable et append-only.');
  }
  if (next.copies.length < previous.copies.length
    || previous.copies.some((copy, index) => !sameWorkspaceValue(copy, next.copies[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une copie de recette appliquée est immuable et append-only.');
  }
  const priorServerReceipts = previous.serverScenarioReceipts ?? [];
  const nextServerReceipts = next.serverScenarioReceipts ?? [];
  if (nextServerReceipts.length < priorServerReceipts.length
    || priorServerReceipts.some((receipt, index) => !sameWorkspaceValue(receipt, nextServerReceipts[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un reçu serveur de scénario est immuable et append-only.');
  }
  const priorComparisons = previous.referenceComparisons ?? [];
  const nextComparisons = next.referenceComparisons ?? [];
  if (nextComparisons.length < priorComparisons.length
    || priorComparisons.some((comparison, index) => !sameWorkspaceValue(comparison, nextComparisons[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une comparaison historique à la référence est immuable et append-only.');
  }
  const priorPreparations = previous.scenarioPreparations ?? [];
  const nextPreparations = next.scenarioPreparations ?? [];
  if (nextPreparations.length < priorPreparations.length
    || priorPreparations.some((preparation, index) => !sameWorkspaceValue(preparation, nextPreparations[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une préparation J5 historique est immuable et append-only.');
  }
  for (const raw of nextPreparations.slice(priorPreparations.length)) {
    const read = readHopV55ScenarioPreparation(raw);
    if (read.status === 'available' && read.preparation.operation === 'create'
      && next.scenarioIds.includes(read.preparation.scenarioId)) {
      throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une nouvelle création J5 doit être préparée avant que son scenarioId soit rattaché au workspace.');
    }
  }
  const priorRecomputations = previous.copyRecomputations ?? [];
  const nextRecomputations = next.copyRecomputations ?? [];
  if (nextRecomputations.length < priorRecomputations.length
    || priorRecomputations.some((payload, index) => !sameWorkspaceValue(payload, nextRecomputations[index]))) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une reprise de candidate historique est immuable et append-only.');
  }
}

export function createHopV55WorkspaceRepository(options: {
  ownerKey: string;
  databaseName?: string;
  /** Pure exact readers for assisted archive rows; absent means preserve-only. */
  assistedAdviceContract?: HopV55AssistedAdviceBackendContractV1;
  /** Test/host adapter hook; production uses the isolated Dexie database above. */
  database?: HopV55WorkspaceDatabaseAdapter;
}): HopV55WorkspaceRepository {
  const ownerKey = options.ownerKey;
  if (!isText(ownerKey) || ownerKey.trim() !== ownerKey) {
    throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une clé ownerKey locale explicite et normalisée est requise.');
  }
  const databaseName = options.databaseName ?? DEFAULT_HOP_V55_WORKSPACE_DATABASE_NAME;
  if (!isText(databaseName)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Nom de base workspace vide.');
  const database = options.database ?? new HopV55WorkspaceDatabase(databaseName) as unknown as HopV55WorkspaceDatabaseAdapter;

  const repository: HopV55WorkspaceRepository = {
    async list(requestedOwnerKey) {
      requireOwner(requestedOwnerKey, ownerKey);
      const rows = await database.workspaces.where('ownerKey').equals(ownerKey).toArray();
      return rows
        .map(row => parseEnvelope(row, ownerKey, undefined, options.assistedAdviceContract))
        .sort((a, b) => a.workspace.updatedAt.localeCompare(b.workspace.updatedAt) || a.workspaceId.localeCompare(b.workspaceId))
        .map(row => clone(row.workspace));
    },

    async read(requestedOwnerKey, id) {
      requireOwner(requestedOwnerKey, ownerKey);
      if (!isId(id)) throw new HopV55WorkspaceRepositoryError('invalidInput', 'Identifiant de workspace invalide.');
      const row = await database.workspaces.get([ownerKey, id]);
      if (!row) return null;
      return clone(parseEnvelope(row, ownerKey, id, options.assistedAdviceContract).workspace);
    },

    async save(workspace, expectedRevision) {
      const incoming = clone(workspace);
      validateWorkspace(incoming, options.assistedAdviceContract);
      requireOwner(incoming.ownerKey, ownerKey);
      if (!Number.isSafeInteger(expectedRevision) && expectedRevision !== null || expectedRevision !== null && expectedRevision < 1) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Révision attendue invalide.');
      }
      const inputRevision = expectedRevision ?? 0;
      if (incoming.revision !== inputRevision) {
        throw new HopV55WorkspaceRepositoryError('staleRevision', 'La copie éditée ne porte pas la révision attendue.');
      }
      if (expectedRevision === null && (incoming.fullCopyReceipts ?? []).some(isLegacyFullCopyReceipt)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un reçu historique V1 peut être relu dans un workspace existant, mais ne peut pas entrer dans une nouvelle écriture.');
      }
      if (expectedRevision === null && ((incoming.qualifiedStudyPreparations?.length ?? 0) > 0
        || (incoming.qualifiedStudyLinks?.length ?? 0) > 0 || (incoming.qualifiedStudyPreferenceCommands?.length ?? 0) > 0)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une préparation ou un lien d’étude qualifiée exige un workspace et une lecture source déjà persistés par CAS.');
      }
      if (expectedRevision === null && ((incoming.propertyAdviceReexaminationCommandStaging?.length ?? 0) > 0
        || (incoming.propertyAdviceReexaminationCommandReceipts?.length ?? 0) > 0)) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Une commande de réexamen V4 exige un workspace source déjà persisté.');
      }
      if (expectedRevision === null && ((incoming.assistedAdviceTickets?.length ?? 0) > 0
        || (incoming.assistedAdviceRecords?.length ?? 0) > 0) && !options.assistedAdviceContract) {
        throw new HopV55WorkspaceRepositoryError('unsupportedFormat', 'Les archives assistées sont préservées, mais leur contrat absent interdit toute écriture.');
      }
      if (expectedRevision === null && (incoming.assistedAdviceRecords?.length ?? 0) > 0) {
        throw new HopV55WorkspaceRepositoryError('invalidInput', 'Un receipt assisté exige un ticket persisté dans un CAS antérieur.');
      }
      const nextRevision = inputRevision + 1;
      const saved = { ...incoming, revision: nextRevision } satisfies HopV55Workspace;
      const envelope: HopV55WorkspaceEnvelopeV1 = {
        format: 'hop-v55-workspace-envelope-v1', ownerKey, workspaceId: saved.id, revision: nextRevision,
        workspace: clone(saved),
      };
      return database.transaction('rw', database.workspaces, async () => {
        const prior = await database.workspaces.get([ownerKey, saved.id]);
        if (expectedRevision === null) {
          if (prior) throw new HopV55WorkspaceRepositoryError('staleRevision', 'Ce workspace existe déjà; relire avant de le créer.');
          await database.workspaces.add(clone(envelope) as HopV55WorkspaceRow);
        } else {
          if (!prior) throw new HopV55WorkspaceRepositoryError('notFound', 'Workspace introuvable pour cette révision.');
          const current = parseEnvelope(prior, ownerKey, saved.id, options.assistedAdviceContract);
          if (current.revision !== expectedRevision) {
            throw new HopV55WorkspaceRepositoryError('staleRevision', 'Le workspace a changé depuis sa lecture.');
          }
          assertAppendOnlyTransition(current.workspace, incoming, options.assistedAdviceContract);
          await database.workspaces.put(clone(envelope) as HopV55WorkspaceRow);
        }
        return clone(saved);
      });
    },

    close() { database.close(); },
  };
  return repository;
}
