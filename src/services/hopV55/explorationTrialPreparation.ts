import type { BrewingScenarioBranchRequest, BrewingScenarioRequest } from '../../domain/brewingScenario';
import type { BrewingReferenceIdentityV1 } from '../../domain/brewingReference';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../domain/hopDecision/types';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import { readHopV55AdoptedContextBinding, type HopV55AdoptedContextBindingV1 } from './adoptedContextResolution';
import { readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchive } from './decisionArchive';
import { HOP_V55_PROGRAM_PREPARATION_VERSION, type HopV55DecisionProgramPreparationV1,
  type PrepareHopV55DecisionProgramInput } from './decisionProgramPreparation';
import type { HopV55ContextSource, HopV55Intent } from './contracts';
import type { HopV55Workspace } from './contracts';
import { readHopV55ExplorationProfile, type HopV55ExplorationProfileV1 } from './explorationProfiles';
import type { HopV55ProgramCopy } from './programCopy';

export const HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT = 'hop-v55-exploration-trial-entry-v1' as const;
export const HOP_V55_EXPLORATION_TRIAL_ORIGIN_CONTEXT_V1_FORMAT = 'hop-v55-exploration-trial-origin-context-v1' as const;
export const HOP_V55_EXPLORATION_TRIAL_PREPARATION_V1_FORMAT = 'hop-v55-exploration-trial-preparation-v1' as const;
export const HOP_V55_EXPLORATION_TRIAL_RECEIPT_V1_FORMAT = 'hop-v55-exploration-trial-receipt-v1' as const;

export type HopV55ExplorationTrialProgramOriginV1 =
  | { kind: 'physicalSource'; reference: string }
  | { kind: 'programCopy'; id: string; reference: string }
  | { kind: 'futureDraft'; draftId: string; revision: number; reference: string }
  | { kind: 'adoptedReference'; identity: BrewingReferenceIdentityV1 };

export type HopV55ExplorationTrialProfileSnapshotV1 =
  | { kind: 'persisted'; profile: HopV55ExplorationProfileV1 }
  | { kind: 'session'; profile: HopV55ExplorationProfileV1 };

/** Exact context captured when a trial line is first created; same-program A→B still gets a new reference. */
export interface HopV55ExplorationTrialOriginContextV1 {
  format: typeof HOP_V55_EXPLORATION_TRIAL_ORIGIN_CONTEXT_V1_FORMAT;
  ownerKey: string;
  workspaceId: string;
  source: HopV55ContextSource;
  sourceReference: string | null;
  runtimeReference: string;
  cultureBindingReference: string | null;
  readingReference: string | null;
  programOrigin: HopV55ExplorationTrialProgramOriginV1;
  programReference: string;
  reference: string;
}

export type HopV55ExplorationTrialOriginContextReadV1 =
  | { status: 'current'; originContext: HopV55ExplorationTrialOriginContextV1 }
  | { status: 'unsupportedReadOnly'; format: string | null; raw: unknown }
  | { status: 'invalid'; reason: string; raw: unknown };

export interface HopV55ExplorationTrialEntryV1 {
  format: typeof HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT;
  /** Stable across an exact retry; new only after an explicit edit to the entry. */
  commandId: string;
  /** Programme fingerprint captured when the first line in this trial was created. */
  originProgramReference: string;
  /** Exact full context from the first row gesture, including same-program source changes. */
  originContext: HopV55ExplorationTrialOriginContextV1;
  /** One provenance row per operation; no operation may be silently rebound to a newer frame. */
  lineOrigins: Array<{ operationId: string; originProgramReference: string; originContextReference: string }>;
  programReference: string;
  /** Exact input passed to the canonical J1 service; never reconstructed at send or on history read. */
  preparationInput: PrepareHopV55DecisionProgramInput;
  preparation: HopV55DecisionProgramPreparationV1;
  /** The only accepted branch is the canonical preparation branch plus explicit volume/culture overrides. */
  branch: BrewingScenarioBranchRequest;
  overrides: { volumeL?: number; yeastId?: string };
  profileSnapshot: HopV55ExplorationTrialProfileSnapshotV1 | null;
  /** Canonical read-model snapshot from the UI model; null when no source/alternative pair was compared. */
  comparisonSnapshot: unknown | null;
}

/** Explicit deterministic projection from a selected local program copy to the physical J5 programme. */
export interface HopV55ExplorationTrialProgramCopyRebaseV1 {
  kind: 'programCopyRebase';
  copy: HopV55ProgramCopy;
  sourceProgram: HopDecisionProgram;
  sourceProgramReference: string;
  originalBranchReference: string;
  rebasedChanges: NonNullable<BrewingScenarioBranchRequest['programChanges']>;
  j5BranchReference: string;
  reference: string;
}

export interface HopV55ExplorationTrialInputSnapshotV1 {
  reference: string | null;
  volumeL: number | null;
  yeastId: string | null;
}

export interface HopV55ExplorationTrialComparisonEvidenceV1 {
  sourceId: string;
  alternativeId: string;
  sourceMaterialReference: string;
  alternativeMaterialReference: string;
  readingReference: string | null;
  profileSnapshotReference: string | null;
  reference: string;
}

export type HopV55ExplorationTrialComparisonReadV1 =
  | ({ status: 'current' } & HopV55ExplorationTrialComparisonEvidenceV1)
  | { status: 'invalid' | 'unsupported'; reason: string };

export type HopV55ExplorationTrialComparisonReaderV1 = (input: {
  snapshot: unknown;
  sourceMaterial: HopDecisionMaterial;
  alternativeMaterial: HopDecisionMaterial;
}) => HopV55ExplorationTrialComparisonReadV1;

export interface HopV55ExplorationTrialCaptureV1 {
  ownerKey: string;
  workspaceId: string;
  source: HopV55ContextSource;
  /** Exact source content reference supplied by the caller for the selected recipe/batch/copy/draft. */
  sourceReference: string | null;
  runtimeReference: string;
  cultureBinding: HopV55AdoptedContextBindingV1 | null;
  readingArchive: HopV55DecisionReadingArchive | null;
  program: HopDecisionProgram;
  programOrigin: HopV55ExplorationTrialProgramOriginV1;
  /** Physical J5 branch after an explicit program-copy rebase, or the unchanged J1 branch. */
  j5Branch: BrewingScenarioBranchRequest;
  programCopyRebase: HopV55ExplorationTrialProgramCopyRebaseV1 | null;
  /** Exact question intent and target used for the eventual scenario request. */
  intent: HopV55Intent;
  target: BrewingScenarioRequest['target'] | null;
  materials: HopDecisionMaterial[];
  yeasts: HopYeast[];
  input: HopV55ExplorationTrialInputSnapshotV1;
  /** Current workspace rows are passed only to prove that a selected persisted profile is still exact. */
  workspaceProfiles?: readonly unknown[];
}

export interface PrepareHopV55ExplorationTrialInputV1 extends HopV55ExplorationTrialCaptureV1 {
  identity: { id: string; scenarioId: string; scenarioPreparationId: string; eventId: string; recordedAt: string };
  entry: HopV55ExplorationTrialEntryV1;
  readComparison?: HopV55ExplorationTrialComparisonReaderV1;
}

export interface HopV55ExplorationTrialPreparationV1 {
  format: typeof HOP_V55_EXPLORATION_TRIAL_PREPARATION_V1_FORMAT;
  id: string;
  commandId: string;
  ownerKey: string;
  workspaceId: string;
  scenarioId: string;
  scenarioPreparationId: string;
  eventId: string;
  recordedAt: string;
  source: HopV55ContextSource;
  sourceReference: string | null;
  runtimeReference: string;
  cultureBinding: HopV55AdoptedContextBindingV1 | null;
  cultureBindingReference: string | null;
  readingArchive: HopV55DecisionReadingArchive | null;
  readingReference: string | null;
  programOrigin: HopV55ExplorationTrialProgramOriginV1;
  j5Branch: BrewingScenarioBranchRequest;
  programCopyRebase: HopV55ExplorationTrialProgramCopyRebaseV1 | null;
  intent: HopV55Intent;
  target: BrewingScenarioRequest['target'] | null;
  programReference: string;
  programSnapshot: HopDecisionProgram;
  programSnapshotReference: string;
  materials: HopDecisionMaterial[];
  materialsReference: string;
  yeasts: HopYeast[];
  yeastsReference: string;
  input: HopV55ExplorationTrialInputSnapshotV1;
  entry: HopV55ExplorationTrialEntryV1;
  comparisonEvidence: HopV55ExplorationTrialComparisonEvidenceV1 | null;
  /** Hash of every fresh source/runtime/NR/reading/program/material/input/provenance/entry field. */
  captureReference: string;
  reference: string;
}

export type HopV55ExplorationTrialPreparationResultV1 =
  | { status: 'ready'; preparation: HopV55ExplorationTrialPreparationV1 }
  | { status: 'refused'; code: 'invalidInput' | 'missingProgram' | 'staleProgram' | 'profileUnavailable' | 'comparisonInvalid'; reason: string };

export interface HopV55ExplorationTrialFreshnessInputV1 extends HopV55ExplorationTrialCaptureV1 {
  entry: HopV55ExplorationTrialEntryV1;
  readComparison?: HopV55ExplorationTrialComparisonReaderV1;
}

export type ConfirmHopV55ExplorationTrialResultV1 =
  | { status: 'current'; preparationReference: string; branch: BrewingScenarioBranchRequest;
      scenarioId: string; scenarioPreparationId: string; eventId: string }
  | { status: 'stale'; reason: string };

export interface HopV55ExplorationTrialReceiptV1 {
  format: typeof HOP_V55_EXPLORATION_TRIAL_RECEIPT_V1_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  preparationReference: string;
  commandId: string;
  scenarioId: string;
  scenarioPreparationId: string;
  eventId: string;
  branchId: string;
  branchReference: string;
  snapshotReference: string;
  recordedAt: string;
  reference: string;
}

export type HopV55ExplorationTrialPreparationHistoryEntry = HopV55ExplorationTrialPreparationV1 | { format: string; readonly [key: string]: unknown };
export type HopV55ExplorationTrialReceiptHistoryEntry = HopV55ExplorationTrialReceiptV1 | { format: string; readonly [key: string]: unknown };

const isRow = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clone = <T,>(value: T): T => structuredClone(value);
const validInstant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  && Number.isFinite(Date.parse(value));

function stable(value: unknown): string {
  return hopAdviceContentReference('hop-v55-exploration-trial-value-v1', value);
}

function exactValue(left: unknown, right: unknown): boolean {
  try { return stable(left) === stable(right); } catch { return false; }
}

function isPlainJson(value: unknown, path = 'value', seen = new Set<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    const valid = value.every((row, index) => row !== undefined && isPlainJson(row, `${path}[${index}]`, seen));
    seen.delete(value);
    return valid;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) { seen.delete(value); return false; }
  // Optional DTO keys may be explicitly undefined in a local JS object; JSON and
  // the content-reference format omit those keys. Array holes/undefined values
  // have different positional meaning and remain invalid.
  const valid = Object.keys(value as Record<string, unknown>).every(key => key.length > 0
    && ((value as Record<string, unknown>)[key] === undefined
      || isPlainJson((value as Record<string, unknown>)[key], `${path}.${key}`, seen)));
  seen.delete(value);
  return valid;
}

function onlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every(key => keys.includes(key));
}

function validIntent(value: unknown): value is HopV55Intent {
  if (!isRow(value) || !onlyKeys(value, ['question', 'criteria']) || typeof value.question !== 'string' || !Array.isArray(value.criteria)) return false;
  return value.criteria.every((criterion: unknown) => isRow(criterion) && onlyKeys(criterion,
    ['id', 'label', 'direction', 'axisId', 'familyId']) && isText(criterion.id) && isText(criterion.label)
    && ['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(String(criterion.direction))
    && (criterion.axisId === undefined || isText(criterion.axisId))
    && (criterion.familyId === undefined || isText(criterion.familyId)));
}

function validScenarioTarget(value: unknown): value is BrewingScenarioRequest['target'] | null {
  if (value === null) return true;
  if (!isRow(value)) return false;
  return Object.entries(value).every(([id, range]) => isText(id) && isRow(range)
    && onlyKeys(range, ['min', 'max']) && finite(range.min) && finite(range.max) && range.min <= range.max);
}

function validSource(value: unknown): value is HopV55ContextSource {
  if (!isRow(value) || !isText(value.kind)) return false;
  if (value.kind === 'recipe') return onlyKeys(value, ['kind', 'recipeId']) && isText(value.recipeId);
  if (value.kind === 'batch') return onlyKeys(value, ['kind', 'batchId']) && isText(value.batchId);
  if (value.kind === 'exploration') return onlyKeys(value, ['kind']);
  if (value.kind === 'localRecipeCopy') return onlyKeys(value, ['kind', 'workspaceId', 'copyId', 'recipeId', 'recipeReference'])
    && isText(value.workspaceId) && isText(value.copyId) && isText(value.recipeId) && isText(value.recipeReference);
  if (value.kind === 'localFutureDraft') return onlyKeys(value, ['kind', 'workspaceId', 'draftId', 'revision', 'contentReference'])
    && isText(value.workspaceId) && isText(value.draftId) && Number.isSafeInteger(value.revision)
    && value.revision > 0 && isText(value.contentReference);
  return false;
}

function validProgramOrigin(value: unknown): value is HopV55ExplorationTrialProgramOriginV1 {
  if (!isRow(value) || !isText(value.kind)) return false;
  if (value.kind === 'physicalSource') return onlyKeys(value, ['kind', 'reference']) && isText(value.reference);
  if (value.kind === 'programCopy') return onlyKeys(value, ['kind', 'id', 'reference']) && isText(value.id) && isText(value.reference);
  if (value.kind === 'futureDraft') return onlyKeys(value, ['kind', 'draftId', 'revision', 'reference'])
    && isText(value.draftId) && Number.isSafeInteger(value.revision) && value.revision > 0 && isText(value.reference);
  if (value.kind === 'adoptedReference') return onlyKeys(value, ['kind', 'identity']) && isRow(value.identity)
    && onlyKeys(value.identity, ['id', 'version', 'contentReference'])
    && isText(value.identity.id) && Number.isSafeInteger(value.identity.version) && value.identity.version > 0
    && isText(value.identity.contentReference);
  return false;
}

function originContextReference(value: Omit<HopV55ExplorationTrialOriginContextV1, 'reference'>
  | HopV55ExplorationTrialOriginContextV1): string {
  const { reference: _reference, ...body } = value as HopV55ExplorationTrialOriginContextV1;
  return hopAdviceContentReference(HOP_V55_EXPLORATION_TRIAL_ORIGIN_CONTEXT_V1_FORMAT, body);
}

export function createHopV55ExplorationTrialOriginContextV1(input: Omit<HopV55ExplorationTrialOriginContextV1,
  'format' | 'reference'>): HopV55ExplorationTrialOriginContextV1 {
  if (!isText(input.ownerKey) || !isText(input.workspaceId) || !validSource(input.source)
    || input.sourceReference !== null && !isText(input.sourceReference) || !isText(input.runtimeReference)
    || input.cultureBindingReference !== null && !isText(input.cultureBindingReference)
    || input.readingReference !== null && !isText(input.readingReference) || !validProgramOrigin(input.programOrigin)
    || !isText(input.programReference) || !isPlainJson(input)) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Le cadre exact du geste est incomplet ou non sérialisable.');
  }
  const body: Omit<HopV55ExplorationTrialOriginContextV1, 'reference'> = {
    format: HOP_V55_EXPLORATION_TRIAL_ORIGIN_CONTEXT_V1_FORMAT, ...clone(input),
  };
  return { ...body, reference: originContextReference(body) };
}

export function readHopV55ExplorationTrialOriginContextV1(value: unknown): HopV55ExplorationTrialOriginContextReadV1 {
  if (!isRow(value)) return { status: 'invalid', reason: 'Cadre d’origine absent ou illisible.', raw: value };
  if (value.format !== HOP_V55_EXPLORATION_TRIAL_ORIGIN_CONTEXT_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', format: typeof value.format === 'string' ? value.format : null, raw: value };
  }
  const keys = ['format', 'ownerKey', 'workspaceId', 'source', 'sourceReference', 'runtimeReference',
    'cultureBindingReference', 'readingReference', 'programOrigin', 'programReference', 'reference'];
  if (!onlyKeys(value, keys) || !isText(value.ownerKey) || !isText(value.workspaceId) || !validSource(value.source)
    || value.sourceReference !== null && !isText(value.sourceReference) || !isText(value.runtimeReference)
    || value.cultureBindingReference !== null && !isText(value.cultureBindingReference)
    || value.readingReference !== null && !isText(value.readingReference) || !validProgramOrigin(value.programOrigin)
    || !isText(value.programReference) || !isText(value.reference) || !isPlainJson(value)) {
    return { status: 'invalid', reason: 'Cadre d’origine incomplet ou contenant des champs inconnus.', raw: value };
  }
  if (originContextReference(value as unknown as HopV55ExplorationTrialOriginContextV1) !== value.reference) {
    return { status: 'invalid', reason: 'Référence du cadre d’origine différente de son contenu.', raw: value };
  }
  return { status: 'current', originContext: clone(value) as unknown as HopV55ExplorationTrialOriginContextV1 };
}

function branchContentReference(branch: BrewingScenarioBranchRequest): string {
  return hopAdviceContentReference('hop-v55-exploration-trial-j5-branch-v1', branch);
}

function programCopyRebaseContentReference(value: Omit<HopV55ExplorationTrialProgramCopyRebaseV1, 'reference'>
  | HopV55ExplorationTrialProgramCopyRebaseV1): string {
  const { reference: _reference, ...body } = value as HopV55ExplorationTrialProgramCopyRebaseV1;
  return hopAdviceContentReference('hop-v55-exploration-trial-program-copy-rebase-v1', body);
}

export function createHopV55ExplorationTrialProgramCopyRebaseV1(input: Omit<HopV55ExplorationTrialProgramCopyRebaseV1,
  'kind' | 'reference'>): HopV55ExplorationTrialProgramCopyRebaseV1 {
  if (!isRow(input.copy) || !isText(input.copy.id) || !isText(input.copy.previewReference)
    || !isRow(input.sourceProgram) || !isText(input.sourceProgramReference)
    || !isText(input.originalBranchReference) || !Array.isArray(input.rebasedChanges)
    || !isText(input.j5BranchReference) || !isPlainJson(input)) {
    throw new HopV55ExplorationTrialError('invalidInput', 'La preuve de rebase de copie est incomplète ou non sérialisable.');
  }
  let sourceProgramReference = '';
  try { sourceProgramReference = programFingerprint(input.sourceProgram as HopDecisionProgram); }
  catch { throw new HopV55ExplorationTrialError('invalidInput', 'Le programme physique du rebase est invalide.'); }
  if (sourceProgramReference !== input.sourceProgramReference || !exactValue(input.copy.programBefore, input.sourceProgram)) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Le rebase ne part pas du programme physique exact enregistré dans cette copie.');
  }
  const body: Omit<HopV55ExplorationTrialProgramCopyRebaseV1, 'reference'> = { kind: 'programCopyRebase', ...clone(input) };
  return { ...body, reference: programCopyRebaseContentReference(body) };
}

function validateJ5Branch(entry: HopV55ExplorationTrialEntryV1, j5Branch: BrewingScenarioBranchRequest,
  rebase: HopV55ExplorationTrialProgramCopyRebaseV1 | null): string | undefined {
  if (!isRow(j5Branch) || !isText(j5Branch.id) || !isText(j5Branch.label)) return 'La branche J5 scellée est invalide.';
  if (rebase === null) {
    if (entry.originContext.programOrigin.kind === 'programCopy') return 'Une copie de programme active exige la preuve de rebase exacte avant J5.';
    if (!exactValue(j5Branch, entry.branch)) return 'Sans rebase, la branche J5 doit être identique à la branche J1 scellée.';
    return undefined;
  }
  if (!isRow(rebase) || !onlyKeys(rebase as unknown as Record<string, unknown>, ['kind', 'copy', 'sourceProgram', 'sourceProgramReference',
    'originalBranchReference', 'rebasedChanges', 'j5BranchReference', 'reference'])
    || rebase.kind !== 'programCopyRebase' || !isRow(rebase.copy) || !isRow(rebase.sourceProgram)
    || !isText(rebase.sourceProgramReference) || !isText(rebase.originalBranchReference)
    || !Array.isArray(rebase.rebasedChanges) || !isText(rebase.j5BranchReference) || !isText(rebase.reference)) {
    return 'La preuve de rebase est illisible ou contient des champs inconnus.';
  }
  try {
    if (programCopyRebaseContentReference(rebase) !== rebase.reference
      || programFingerprint(rebase.sourceProgram as HopDecisionProgram) !== rebase.sourceProgramReference
      || !exactValue(rebase.copy.programBefore, rebase.sourceProgram)
      || !exactValue(rebase.copy.programAfter, entry.preparationInput.program)
      || !isText(rebase.copy.id) || !isText(rebase.copy.previewReference)
      || entry.originContext.programOrigin.kind !== 'programCopy' || rebase.copy.id !== entry.originContext.programOrigin.id
      || rebase.copy.previewReference !== entry.originContext.programOrigin.reference
      || rebase.originalBranchReference !== branchContentReference(entry.branch)
      || !exactValue(j5Branch.programChanges, rebase.rebasedChanges)
      || j5Branch.id !== entry.branch.id || j5Branch.label !== entry.branch.label
      || !exactValue(j5Branch.assumptions, entry.branch.assumptions)
      || !exactValue(j5Branch.inputOverrides ?? null, entry.branch.inputOverrides ?? null)
      || branchContentReference(j5Branch) !== rebase.j5BranchReference) {
      return 'Le résultat J5 ne correspond pas au rebase canonique de la copie/source exacte.';
    }
  } catch { return 'La preuve de rebase de copie n’est pas calculable ou lisible.'; }
  return undefined;
}

function validateOverrides(value: unknown):
  | { status: 'ready'; count: number }
  | { status: 'refused'; reason: string } {
  if (!isRow(value) || !onlyKeys(value, ['volumeL', 'yeastId'])) return { status: 'refused', reason: 'Les hypothèses de volume/culture contiennent un champ inconnu.' };
  let count = 0;
  if (Object.prototype.hasOwnProperty.call(value, 'volumeL')) {
    if (!finite(value.volumeL) || value.volumeL <= 0) return { status: 'refused', reason: 'Le volume hypothétique doit être fini et positif.' };
    count++;
  }
  if (Object.prototype.hasOwnProperty.call(value, 'yeastId')) {
    if (!isText(value.yeastId)) return { status: 'refused', reason: 'L’identifiant de levure hypothétique doit être exact.' };
    count++;
  }
  const overrides = value as { volumeL?: number; yeastId?: string };
  return { status: 'ready', count };
}

function validateBranchAndPreparation(entry: HopV55ExplorationTrialEntryV1, program: HopDecisionProgram): string | undefined {
  const preparation = entry.preparation;
  if (!isRow(preparation) || preparation.version !== HOP_V55_PROGRAM_PREPARATION_VERSION
    || preparation.status !== 'ready' || preparation.programReference !== entry.programReference
    || !Array.isArray(preparation.operations) || !preparation.operations.length || !Array.isArray(preparation.evaluations)
    || preparation.evaluations.length !== preparation.operations.length
    || !preparation.evaluations.every((row: unknown, index: number) => isRow(row) && row.status === 'ready'
      && row.operationId === preparation.operations[index]?.id && Array.isArray(row.needs) && row.needs.length === 0)
    || !Array.isArray(preparation.needs) || preparation.needs.length > 0 || !Array.isArray(preparation.changes)
    || !isRow(preparation.proposal) || preparation.proposal.applicability === 'unavailable'
    || !Array.isArray(preparation.proposal.changes) || !exactValue(preparation.proposal.changes, preparation.changes)
    || !isRow(preparation.branch)) {
    return 'La préparation canonique doit être complète et liée au programme courant.';
  }
  let currentProgramReference: string;
  try { currentProgramReference = programFingerprint(program); }
  catch { return 'Le programme courant ne peut pas être empreinté.'; }
  if (entry.originProgramReference !== currentProgramReference || entry.programReference !== currentProgramReference) {
    return 'Les lignes ont été commencées sur un autre programme; elles ne sont pas réaffectées automatiquement.';
  }
  const canonical = preparation.branch;
  const branch = entry.branch as unknown as Record<string, unknown>;
  if (!isRow(branch) || !onlyKeys(branch, ['id', 'label', 'assumptions', 'programChanges', 'inputOverrides'])
    || !isText(branch.id) || !isText(branch.label) || branch.id !== canonical.id || branch.label !== canonical.label
    || !Array.isArray(branch.assumptions) || !Array.isArray(canonical.assumptions)
    || !Array.isArray(branch.programChanges) || !Array.isArray(canonical.programChanges)
    || !exactValue(branch.programChanges, canonical.programChanges)
    || !exactValue(branch.programChanges, preparation.changes)
    || branch.assumptions.length < canonical.assumptions.length
    || !canonical.assumptions.every((row: unknown, index: number) => exactValue(row, branch.assumptions[index]))) {
    return 'La branche transmise diffère de la branche canonique préparée.';
  }
  const overrideResult = validateOverrides(entry.overrides);
  if (overrideResult.status !== 'ready') return overrideResult.reason;
  const overrides = entry.overrides;
  const branchOverrides = branch.inputOverrides === undefined ? {} : branch.inputOverrides;
  if (!isRow(branchOverrides) || !onlyKeys(branchOverrides, ['volumeL', 'yeastId'])
    || branchOverrides.volumeL !== overrides.volumeL || branchOverrides.yeastId !== overrides.yeastId) {
    return 'Les overrides du résultat ne correspondent pas aux hypothèses explicites préparées.';
  }
  const extra = branch.assumptions.slice(canonical.assumptions.length) as unknown[];
  if (extra.length !== overrideResult.count) return 'Chaque override doit garder sa déclaration d’hypothèse explicite, sans autre fait ajouté.';
  const expected: Array<{ path: string; value: string | number; unit?: string }> = [];
  if (overrides.volumeL !== undefined) expected.push({ path: 'recipe.volumeL', value: overrides.volumeL, unit: 'L' });
  if (overrides.yeastId !== undefined) expected.push({ path: 'recipe.yeastId', value: overrides.yeastId });
  for (const assumption of extra) {
    if (!isRow(assumption)) return 'Une hypothèse de volume/culture est invalide.';
    const expectedRow = expected.find(row => row.path === assumption.path);
    if (!expectedRow || assumption.origin !== 'userHypothesis' || assumption.status !== 'selected'
      || assumption.value !== expectedRow.value || expectedRow.unit !== assumption.unit
      || !isText(assumption.id) || !isText(assumption.label) || !isText(assumption.explanation)) {
      return 'Une hypothèse de volume/culture ne correspond pas à son override explicite.';
    }
    expected.splice(expected.indexOf(expectedRow), 1);
  }
  return undefined;
}

function validateEntryLineOrigins(entry: HopV55ExplorationTrialEntryV1): string | undefined {
  const frame = readHopV55ExplorationTrialOriginContextV1(entry.originContext);
  if (frame.status !== 'current') return 'Le cadre source d’origine de l’essai est illisible ou futur.';
  const rows = entry.lineOrigins;
  const operations = entry.preparation.operations;
  if (!Array.isArray(rows) || rows.length !== operations.length) return 'Chaque opération doit garder son origine de ligne exacte.';
  const byId = new Map<string, { operationId: string; originProgramReference: string; originContextReference: string }>();
  for (const raw of rows) {
    if (!isRow(raw) || !onlyKeys(raw, ['operationId', 'originProgramReference', 'originContextReference'])
      || !isText(raw.operationId) || !isText(raw.originProgramReference) || !isText(raw.originContextReference)
      || byId.has(raw.operationId)) return 'Les origines des lignes sont invalides ou dupliquées.';
    byId.set(raw.operationId, raw as { operationId: string; originProgramReference: string; originContextReference: string });
  }
  const operationIds = operations.map((operation: unknown) => isRow(operation) && isText(operation.id) ? operation.id : '');
  if (operationIds.some(id => !id) || new Set(operationIds).size !== operationIds.length
    || operationIds.some(id => {
      const origin = byId.get(id);
      return !origin || origin.originProgramReference !== entry.originProgramReference
        || origin.originContextReference !== frame.originContext.reference;
    })) return 'Une ligne a été créée sous une autre source ou un autre cadre, même si son programme porte le même fingerprint.';
  return undefined;
}

function validatePreparationInput(entry: HopV55ExplorationTrialEntryV1, program: HopDecisionProgram,
  materials: readonly HopDecisionMaterial[], readingArchive: HopV55DecisionReadingArchive | null): string | undefined {
  const input: unknown = entry.preparationInput;
  if (!isRow(input) || !onlyKeys(input, ['branch', 'program', 'materials', 'intent', 'operations', 'expectedProgramReference'])
    || !isRow(input.branch) || !isText(input.branch.id) || !isText(input.branch.label)
    || !isRow(input.intent) || !isText(input.intent.question) || typeof input.intent.interpretation !== 'string'
    || !Array.isArray(input.intent.criteria) || !Array.isArray(input.operations) || !Array.isArray(input.materials)
    || !isRow(input.program) || !exactValue(input.program, program) || !exactValue(input.materials, materials)
    || !exactValue(input.operations, entry.preparation.operations)
    || input.branch.id !== entry.preparation.branch?.id || input.branch.label !== entry.preparation.branch?.label
    || input.expectedProgramReference !== undefined && input.expectedProgramReference !== entry.programReference) {
    return 'L’entrée J1 exacte doit rester liée aux opérations, au programme, aux matières et à la branche préparés.';
  }
  if (readingArchive !== null) {
    const read = readHopV55DecisionReadingArchive(readingArchive);
    if (read.status !== 'available' || input.intent.question !== read.archive.reading.intent.question) {
      return 'La question de la préparation J1 ne correspond pas à la lecture scellée exacte.';
    }
  }
  return undefined;
}

function validateProfileSnapshot(entry: HopV55ExplorationTrialEntryV1, workspaceProfiles: readonly unknown[] | undefined):
  | { status: 'ready'; profileReference: string | null }
  | { status: 'refused'; reason: string } {
  const selection = entry.profileSnapshot;
  if (selection === null) return { status: 'ready', profileReference: null };
  if (!isRow(selection) || !['persisted', 'session'].includes(String(selection.kind))) {
    return { status: 'refused', reason: 'Le snapshot de profil ne distingue pas une version conservée d’un brouillon de session.' };
  }
  const read = readHopV55ExplorationProfile(selection.profile);
  if (read.status !== 'current' || !exactValue(read.profile, selection.profile)) {
    return { status: 'refused', reason: 'Le profil choisi est absent, futur ou altéré; aucune version récente n’est substituée.' };
  }
  if (selection.kind === 'persisted') {
    const persisted = (workspaceProfiles ?? []).map(readHopV55ExplorationProfile).some(row =>
      row.status === 'current' && row.profile.reference === read.profile.reference && exactValue(row.profile, read.profile));
    if (!persisted) return { status: 'refused', reason: 'La version exacte du profil n’est plus présente dans le workspace.' };
  }
  return { status: 'ready', profileReference: read.profile.reference };
}

function trialCaptureReference(input: HopV55ExplorationTrialCaptureV1, entry: HopV55ExplorationTrialEntryV1,
  fields: { programReference: string; programSnapshotReference: string; materialsReference: string;
    yeastsReference: string; cultureBindingReference: string | null; readingReference: string | null;
    profileReference: string | null; comparisonEvidence: HopV55ExplorationTrialComparisonEvidenceV1 | null }): string {
  return hopAdviceContentReference('hop-v55-exploration-trial-capture-v1', {
    ownerKey: input.ownerKey, workspaceId: input.workspaceId, source: input.source,
    sourceReference: input.sourceReference, runtimeReference: input.runtimeReference,
    cultureBindingReference: fields.cultureBindingReference, cultureBinding: input.cultureBinding,
    readingReference: fields.readingReference, readingArchive: input.readingArchive,
    programOrigin: input.programOrigin, programReference: fields.programReference,
    program: input.program, programSnapshotReference: fields.programSnapshotReference,
    materials: input.materials, materialsReference: fields.materialsReference,
    yeasts: input.yeasts, yeastsReference: fields.yeastsReference,
    input: input.input, entry, j5Branch: input.j5Branch, programCopyRebase: input.programCopyRebase,
    intent: input.intent, target: input.target, profileReference: fields.profileReference,
    comparisonEvidence: fields.comparisonEvidence,
  });
}

function validateReadingArchive(archive: HopV55DecisionReadingArchive | null, ownerKey: string, workspaceId: string):
  | { status: 'ready'; reference: string | null }
  | { status: 'refused'; reason: string } {
  if (archive === null) return { status: 'ready', reference: null };
  const read = readHopV55DecisionReadingArchive(archive);
  if (read.status !== 'available' || read.archive.ownerKey !== ownerKey || read.archive.workspaceId !== workspaceId
    || read.archive.contentReference !== archive.contentReference) {
    return { status: 'refused', reason: 'La lecture source exacte est absente, future ou liée à un autre workspace.' };
  }
  return { status: 'ready', reference: archive.contentReference };
}

interface ValidatedTrialCaptureV1 {
  captureReference: string;
  programReference: string;
  programSnapshotReference: string;
  materialsReference: string;
  yeastsReference: string;
  cultureBindingReference: string | null;
  readingReference: string | null;
  profileReference: string | null;
  comparisonEvidence: HopV55ExplorationTrialComparisonEvidenceV1 | null;
}

function validateTrialCapture(input: HopV55ExplorationTrialCaptureV1, entry: HopV55ExplorationTrialEntryV1,
  readComparison?: HopV55ExplorationTrialComparisonReaderV1):
  | { status: 'ready'; validated: ValidatedTrialCaptureV1 }
  | { status: 'refused'; code: 'invalidInput' | 'missingProgram' | 'staleProgram' | 'profileUnavailable' | 'comparisonInvalid'; reason: string } {
  if (!isRow(input) || !isText(input.ownerKey) || !isText(input.workspaceId) || !validSource(input.source)
    || input.sourceReference !== null && !isText(input.sourceReference) || !isText(input.runtimeReference) || !isRow(input.program)
    || !validProgramOrigin(input.programOrigin) || !Array.isArray(input.materials) || !Array.isArray(input.yeasts) || !isRow(input.input)
    || !validIntent(input.intent) || !validScenarioTarget(input.target)
    || input.input.reference !== null && !isText(input.input.reference) || input.input.volumeL !== null && (!finite(input.input.volumeL) || input.input.volumeL <= 0)
    || input.input.yeastId !== null && !isText(input.input.yeastId)
    || !isRow(entry) || entry.format !== HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT || !isText(entry.commandId)
    || !isText(entry.originProgramReference) || !isText(entry.programReference)
    || !isRow(entry.preparationInput) || !isRow(entry.preparation) || !isRow(entry.branch) || !isRow(entry.overrides)
    || !isRow(input.j5Branch) || input.programCopyRebase !== null && !isRow(input.programCopyRebase)
    || !isRow(entry.originContext) || !Array.isArray(entry.lineOrigins)
    || !Object.prototype.hasOwnProperty.call(entry, 'profileSnapshot')
    || !Object.prototype.hasOwnProperty.call(entry, 'comparisonSnapshot')) {
    return { status: 'refused', code: 'invalidInput', reason: 'Source, runtime, programme, matières, entrée et valeurs de base explicites sont requis.' };
  }
  let programReference = '';
  try { programReference = programFingerprint(input.program); }
  catch { return { status: 'refused', code: 'missingProgram', reason: 'Aucun programme exact et réutilisable n’est fourni pour ce geste.' }; }
  if (programReference !== entry.programReference || programReference !== entry.originProgramReference
    || entry.preparation.programReference !== programReference) {
    return { status: 'refused', code: 'staleProgram', reason: 'Le programme a changé depuis le premier geste de ligne; aucun identifiant source n’est rebondi.' };
  }
  if (input.programOrigin.kind === 'physicalSource' && input.programOrigin.reference !== input.sourceReference) {
    return { status: 'refused', code: 'invalidInput', reason: 'L’origine physique du programme ne correspond pas à la source exacte.' };
  }
  if (input.programOrigin.kind === 'futureDraft' && (input.source.kind !== 'localFutureDraft'
    || input.programOrigin.draftId !== input.source.draftId || input.programOrigin.revision !== input.source.revision
    || input.programOrigin.reference !== input.source.contentReference || input.source.workspaceId !== input.workspaceId)) {
    return { status: 'refused', code: 'invalidInput', reason: 'L’origine du brouillon futur ne correspond pas à sa source active exacte.' };
  }
  if (new Set(input.materials.map(material => material.id)).size !== input.materials.length
    || input.materials.some(material => !isText(material.id))) {
    return { status: 'refused', code: 'invalidInput', reason: 'Le snapshot des matières contient un ID absent ou répété.' };
  }
  if (new Set(input.yeasts.map(yeast => yeast.id)).size !== input.yeasts.length
    || input.yeasts.some(yeast => !isText(yeast.id))) {
    return { status: 'refused', code: 'invalidInput', reason: 'Le snapshot des cultures contient un ID absent ou répété.' };
  }
  if (entry.overrides.yeastId !== undefined && !input.yeasts.some(yeast => yeast.id === entry.overrides.yeastId)) {
    return { status: 'refused', code: 'invalidInput', reason: 'La souche choisie n’est pas dans le snapshot exact des cultures chargé.' };
  }
  try { if (!isPlainJson(input.materials) || !isPlainJson(input.yeasts) || !isPlainJson(input.program) || !isPlainJson(input.source)
    || !isPlainJson(input.input) || !isPlainJson(entry)) throw Error('non-json'); }
  catch { return { status: 'refused', code: 'invalidInput', reason: 'Les données du geste contiennent une valeur non sérialisable.' }; }
  const branchReason = validateBranchAndPreparation(entry, input.program);
  if (branchReason) return { status: 'refused', code: 'invalidInput', reason: branchReason };
  const j1InputReason = validatePreparationInput(entry, input.program, input.materials, input.readingArchive);
  if (j1InputReason) return { status: 'refused', code: 'invalidInput', reason: j1InputReason };
  if (entry.preparationInput.intent.question !== input.intent.question) {
    return { status: 'refused', code: 'invalidInput', reason: 'La lecture et la préparation J1 ne conservent pas la même question exacte.' };
  }
  const j5BranchReason = validateJ5Branch(entry, input.j5Branch, input.programCopyRebase);
  if (j5BranchReason) return { status: 'refused', code: 'invalidInput', reason: j5BranchReason };
  let cultureBindingReference: string | null = null;
  if (input.cultureBinding !== null) {
    const binding = readHopV55AdoptedContextBinding(input.cultureBinding);
    if (binding.status !== 'available' || binding.binding.ownerKey !== input.ownerKey
      || binding.binding.workspaceId !== input.workspaceId || !exactValue(binding.binding, input.cultureBinding)) {
      return { status: 'refused', code: 'invalidInput', reason: 'La liaison NR/culture n’est pas l’archive exacte du workspace courant.' };
    }
    cultureBindingReference = binding.binding.bindingReference;
  }
  if (input.programOrigin.kind === 'adoptedReference') {
    const binding = input.cultureBinding && readHopV55AdoptedContextBinding(input.cultureBinding);
    if (!binding || binding.status !== 'available' || !exactValue(binding.binding.reference, input.programOrigin.identity)) {
      return { status: 'refused', code: 'invalidInput', reason: 'L’origine programme ne correspond pas à la référence NR effectivement adoptée.' };
    }
  }
  const reading = validateReadingArchive(input.readingArchive, input.ownerKey, input.workspaceId);
  if (reading.status !== 'ready') return { status: 'refused', code: 'invalidInput', reason: reading.reason };
  if (input.readingArchive !== null) {
    const archived = readHopV55DecisionReadingArchive(input.readingArchive);
    if (archived.status !== 'available' || archived.archive.runtimeReference !== input.runtimeReference
      || !sourceMatchesReading(input.source, archived.archive)) {
      return { status: 'refused', code: 'invalidInput', reason: 'La lecture conservée ne couvre pas la source et le runtime exacts de cet essai.' };
    }
  }
  let originContext: HopV55ExplorationTrialOriginContextV1;
  try {
    originContext = createHopV55ExplorationTrialOriginContextV1({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
      source: input.source, sourceReference: input.sourceReference, runtimeReference: input.runtimeReference,
      cultureBindingReference, readingReference: reading.reference, programOrigin: input.programOrigin, programReference });
  } catch (error) {
    return { status: 'refused', code: 'invalidInput', reason: error instanceof Error ? error.message : 'Cadre d’origine invalide.' };
  }
  const originRead = readHopV55ExplorationTrialOriginContextV1(entry.originContext);
  if (originRead.status !== 'current' || !exactValue(originRead.originContext, originContext)
    || validateEntryLineOrigins(entry)) {
    return { status: 'refused', code: 'staleProgram', reason: validateEntryLineOrigins(entry)
      ?? 'Le contexte de la ligne a changé depuis le premier geste; recrée explicitement les lignes sous la source courante.' };
  }
  const profile = validateProfileSnapshot(entry, input.workspaceProfiles);
  if (profile.status !== 'ready') return { status: 'refused', code: 'profileUnavailable', reason: profile.reason };
  let comparisonEvidence: HopV55ExplorationTrialComparisonEvidenceV1 | null = null;
  const comparisonSnapshot = entry.comparisonSnapshot;
  if (comparisonSnapshot !== null) {
    if (!readComparison || !isRow(comparisonSnapshot) || !isText(comparisonSnapshot.sourceId)
      || !isText(comparisonSnapshot.alternativeId) || comparisonSnapshot.sourceId === comparisonSnapshot.alternativeId) {
      return { status: 'refused', code: 'comparisonInvalid', reason: 'La comparaison exacte exige un reader canonique, deux identités distinctes et un snapshot complet.' };
    }
    const sourceMaterial = input.materials.find(material => material.id === comparisonSnapshot.sourceId);
    const alternativeMaterial = input.materials.find(material => material.id === comparisonSnapshot.alternativeId);
    if (!sourceMaterial || !alternativeMaterial) {
      return { status: 'refused', code: 'comparisonInvalid', reason: 'Les identités source et alternative ne sont pas dans le snapshot complet des matières.' };
    }
    const comparison = readComparison({ snapshot: comparisonSnapshot, sourceMaterial, alternativeMaterial });
    const expectedProfileReference = profile.profileReference;
    if (comparison.status !== 'current' || comparison.sourceId !== sourceMaterial.id || comparison.alternativeId !== alternativeMaterial.id
      || !exactValue(comparisonSnapshot.sourceMaterial, sourceMaterial)
      || !exactValue(comparisonSnapshot.alternativeMaterial, alternativeMaterial)
      || comparisonSnapshot.sourceMaterialReference !== comparison.sourceMaterialReference
      || comparisonSnapshot.alternativeMaterialReference !== comparison.alternativeMaterialReference
      || comparison.readingReference !== reading.reference || comparison.profileSnapshotReference !== expectedProfileReference
      || !isText(comparison.reference)) {
      return { status: 'refused', code: 'comparisonInvalid', reason: comparison.status === 'current'
        ? 'La comparaison ne cite pas exactement la lecture, le profil et les matières affichés.'
        : comparison.reason };
    }
    comparisonEvidence = {
      sourceId: comparison.sourceId, alternativeId: comparison.alternativeId,
      sourceMaterialReference: comparison.sourceMaterialReference, alternativeMaterialReference: comparison.alternativeMaterialReference,
      readingReference: comparison.readingReference, profileSnapshotReference: comparison.profileSnapshotReference,
      reference: comparison.reference,
    };
  }
  const programSnapshotReference = hopDecisionReference(input.program);
  const materialsReference = hopAdviceContentReference('hop-v55-exploration-trial-materials-v1', input.materials);
  const yeastsReference = hopAdviceContentReference('hop-v55-exploration-trial-yeasts-v1', input.yeasts);
  const captureReference = trialCaptureReference(input, entry, { programReference,
    programSnapshotReference, materialsReference, yeastsReference, cultureBindingReference,
    readingReference: reading.reference, profileReference: profile.profileReference, comparisonEvidence });
  return { status: 'ready', validated: { captureReference, programReference, programSnapshotReference, materialsReference,
    yeastsReference, cultureBindingReference, readingReference: reading.reference, profileReference: profile.profileReference, comparisonEvidence } };
}

export function prepareHopV55ExplorationTrialV1(input: PrepareHopV55ExplorationTrialInputV1): HopV55ExplorationTrialPreparationResultV1 {
  if (!isRow(input.identity) || !isText(input.identity.id) || !isRow(input.entry)
    || input.identity.id !== input.entry.commandId || !isText(input.identity.scenarioId)
    || !isText(input.identity.scenarioPreparationId) || !isText(input.identity.eventId) || !validInstant(input.identity.recordedAt)) {
    return { status: 'refused', code: 'invalidInput', reason: 'Identifiants stables et date de préparation requis.' };
  }
  const capture = validateTrialCapture(input, input.entry, input.readComparison);
  if (capture.status !== 'ready') return capture;
  const body: Omit<HopV55ExplorationTrialPreparationV1, 'reference'> = {
    format: HOP_V55_EXPLORATION_TRIAL_PREPARATION_V1_FORMAT,
    id: input.identity.id, commandId: input.entry.commandId, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    scenarioId: input.identity.scenarioId, scenarioPreparationId: input.identity.scenarioPreparationId,
    eventId: input.identity.eventId, recordedAt: input.identity.recordedAt,
    source: clone(input.source), sourceReference: input.sourceReference, runtimeReference: input.runtimeReference,
    cultureBinding: clone(input.cultureBinding), cultureBindingReference: capture.validated.cultureBindingReference,
    readingArchive: clone(input.readingArchive), readingReference: capture.validated.readingReference,
    programOrigin: clone(input.programOrigin), programReference: capture.validated.programReference,
    j5Branch: clone(input.j5Branch), programCopyRebase: clone(input.programCopyRebase),
    intent: clone(input.intent), target: clone(input.target),
    programSnapshot: clone(input.program), programSnapshotReference: capture.validated.programSnapshotReference,
    materials: clone(input.materials), materialsReference: capture.validated.materialsReference,
    yeasts: clone(input.yeasts), yeastsReference: capture.validated.yeastsReference,
    input: clone(input.input), entry: clone(input.entry), comparisonEvidence: clone(capture.validated.comparisonEvidence),
    captureReference: capture.validated.captureReference,
  };
  const preparation = { ...body, reference: hopAdviceContentReference(HOP_V55_EXPLORATION_TRIAL_PREPARATION_V1_FORMAT, body) };
  const read = readHopV55ExplorationTrialPreparationV1(preparation);
  if (read.status !== 'available') return { status: 'refused', code: 'invalidInput',
    reason: read.status === 'invalid' ? read.reason : 'Format de préparation d’essai non pris en charge.' };
  return { status: 'ready', preparation: read.preparation };
}

export type HopV55ExplorationTrialPreparationReadV1 =
  | { status: 'available'; preparation: HopV55ExplorationTrialPreparationV1 }
  | { status: 'unsupportedReadOnly'; format: string | null; raw: unknown }
  | { status: 'invalid'; reason: string; raw: unknown };

export function readHopV55ExplorationTrialPreparationV1(value: unknown): HopV55ExplorationTrialPreparationReadV1 {
  if (!isRow(value)) return { status: 'invalid', reason: 'Préparation d’essai illisible.', raw: value };
  if (value.format !== HOP_V55_EXPLORATION_TRIAL_PREPARATION_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', format: typeof value.format === 'string' ? value.format : null, raw: value };
  }
  const { reference, ...body } = value;
  const allowed = ['format', 'id', 'commandId', 'ownerKey', 'workspaceId', 'scenarioId', 'scenarioPreparationId', 'eventId',
    'recordedAt', 'source', 'sourceReference', 'runtimeReference', 'cultureBinding', 'cultureBindingReference',
    'readingArchive', 'readingReference', 'programOrigin', 'programReference', 'programSnapshot', 'programSnapshotReference',
    'j5Branch', 'programCopyRebase', 'intent', 'target', 'materials', 'materialsReference', 'yeasts', 'yeastsReference', 'input', 'entry',
    'comparisonEvidence', 'captureReference', 'reference'];
  if (!onlyKeys(value, allowed) || !isText(value.id) || !isText(value.commandId) || !isText(value.ownerKey)
    || !isText(value.workspaceId) || !isText(value.scenarioId) || !isText(value.scenarioPreparationId)
    || !isText(value.eventId) || !validInstant(value.recordedAt) || !validSource(value.source)
    || !isText(value.sourceReference) && value.sourceReference !== null || !isText(value.runtimeReference) || !isText(value.cultureBindingReference) && value.cultureBindingReference !== null
    || !isText(value.readingReference) && value.readingReference !== null || !validProgramOrigin(value.programOrigin)
    || !isText(value.programReference) || !isRow(value.programSnapshot) || !isText(value.programSnapshotReference)
    || !Array.isArray(value.materials) || !isText(value.materialsReference) || !Array.isArray(value.yeasts)
    || !isText(value.yeastsReference) || !isRow(value.input) || !validIntent(value.intent) || !validScenarioTarget(value.target)
    || !isRow(value.j5Branch)
    || value.programCopyRebase !== null && !isRow(value.programCopyRebase)
    || !isRow(value.entry) || !isText(value.captureReference) || !isText(reference)) {
    return { status: 'invalid', reason: 'Préparation d’essai incomplète ou contenant des champs inconnus.', raw: value };
  }
  try {
    if (!isPlainJson(value)) return { status: 'invalid', reason: 'Préparation d’essai non sérialisable.', raw: value };
    if (!validProgramOrigin(value.programOrigin) || !isRow(value.input)
      || !onlyKeys(value.input, ['reference', 'volumeL', 'yeastId'])
      || value.input.reference !== null && !isText(value.input.reference)
      || value.input.volumeL !== null && (!finite(value.input.volumeL) || value.input.volumeL <= 0)
      || value.input.yeastId !== null && !isText(value.input.yeastId)
      || value.materials.some((material: unknown) => !isRow(material) || !isText(material.id))
      || value.yeasts.some((yeast: unknown) => !isRow(yeast) || !isText(yeast.id))
      || new Set(value.materials.map((material: HopDecisionMaterial) => material.id)).size !== value.materials.length
      || new Set(value.yeasts.map((yeast: HopYeast) => yeast.id)).size !== value.yeasts.length) {
      return { status: 'invalid', reason: 'Les snapshots d’entrée, matières, cultures ou origine de programme sont invalides.', raw: value };
    }
    const entryKeys = ['format', 'commandId', 'originProgramReference', 'originContext', 'lineOrigins', 'programReference',
      'preparationInput', 'preparation', 'branch', 'overrides', 'profileSnapshot', 'comparisonSnapshot'];
    if (!onlyKeys(value.entry, entryKeys) || !isText(value.entry.commandId)
      || !isText(value.entry.originProgramReference) || !isText(value.entry.programReference)
      || !isRow(value.entry.preparationInput) || !isRow(value.entry.preparation) || !isRow(value.entry.branch)
      || !isRow(value.entry.originContext) || !Array.isArray(value.entry.lineOrigins)
      || !isRow(value.entry.overrides) || !Object.prototype.hasOwnProperty.call(value.entry, 'profileSnapshot')
      || !Object.prototype.hasOwnProperty.call(value.entry, 'comparisonSnapshot')) {
      return { status: 'invalid', reason: 'Entrée d’essai V1 invalide ou contenant des champs inconnus.', raw: value };
    }
    const fingerprint = programFingerprint(value.programSnapshot as HopDecisionProgram);
    if (fingerprint !== value.programReference
      || hopDecisionReference(value.programSnapshot) !== value.programSnapshotReference
      || hopAdviceContentReference('hop-v55-exploration-trial-materials-v1', value.materials) !== value.materialsReference
      || hopAdviceContentReference('hop-v55-exploration-trial-yeasts-v1', value.yeasts) !== value.yeastsReference
      || value.entry.format !== HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT
      || value.entry.commandId !== value.commandId || value.entry.programReference !== value.programReference
      || value.entry.originProgramReference !== value.programReference
      || (value.readingArchive === null ? value.readingReference !== null
        : readHopV55DecisionReadingArchive(value.readingArchive).status !== 'available'
          || (readHopV55DecisionReadingArchive(value.readingArchive) as { status: 'available'; archive: HopV55DecisionReadingArchive }).archive.contentReference !== value.readingReference)
      || (value.cultureBinding === null ? value.cultureBindingReference !== null
        : readHopV55AdoptedContextBinding(value.cultureBinding).status !== 'available'
          || (readHopV55AdoptedContextBinding(value.cultureBinding) as { status: 'available'; binding: HopV55AdoptedContextBindingV1 }).binding.bindingReference !== value.cultureBindingReference)
      || (value.entry.profileSnapshot === null ? (value.comparisonEvidence?.profileSnapshotReference ?? null) !== null
        : readHopV55ExplorationProfile(value.entry.profileSnapshot.profile).status !== 'current'
          || value.comparisonEvidence !== null
            && (value.entry.profileSnapshot.profile as HopV55ExplorationProfileV1).reference !== value.comparisonEvidence.profileSnapshotReference)) {
      return { status: 'invalid', reason: 'Références, préparation canonique ou provenance d’essai altérées.', raw: value };
    }
    const branchReason = validateBranchAndPreparation(value.entry as HopV55ExplorationTrialEntryV1,
      value.programSnapshot as HopDecisionProgram);
    if (branchReason) return { status: 'invalid', reason: branchReason, raw: value };
    const j1InputReason = validatePreparationInput(value.entry as HopV55ExplorationTrialEntryV1,
      value.programSnapshot as HopDecisionProgram, value.materials as HopDecisionMaterial[], value.readingArchive as HopV55DecisionReadingArchive | null);
    if (j1InputReason) return { status: 'invalid', reason: j1InputReason, raw: value };
    if (value.entry.preparationInput.intent.question !== value.intent.question) {
      return { status: 'invalid', reason: 'Question de préparation J1 différente de la question conservée.', raw: value };
    }
    const j5BranchReason = validateJ5Branch(value.entry as HopV55ExplorationTrialEntryV1,
      value.j5Branch as BrewingScenarioBranchRequest, value.programCopyRebase as HopV55ExplorationTrialProgramCopyRebaseV1 | null);
    if (j5BranchReason) return { status: 'invalid', reason: j5BranchReason, raw: value };
    const lineOriginReason = validateEntryLineOrigins(value.entry as HopV55ExplorationTrialEntryV1);
    const originContext = readHopV55ExplorationTrialOriginContextV1(value.entry.originContext);
    if (lineOriginReason || originContext.status !== 'current'
      || originContext.originContext.ownerKey !== value.ownerKey || originContext.originContext.workspaceId !== value.workspaceId
      || !exactValue(originContext.originContext.source, value.source)
      || originContext.originContext.sourceReference !== value.sourceReference
      || originContext.originContext.runtimeReference !== value.runtimeReference
      || originContext.originContext.cultureBindingReference !== value.cultureBindingReference
      || originContext.originContext.readingReference !== value.readingReference
      || originContext.originContext.programReference !== value.programReference
      || !exactValue(originContext.originContext.programOrigin, value.programOrigin)) {
      return { status: 'invalid', reason: lineOriginReason ?? 'Cadre d’origine dissocié de la préparation scellée.', raw: value };
    }
    let profileReference: string | null = null;
    if (value.entry.profileSnapshot !== null) {
      if (!isRow(value.entry.profileSnapshot) || value.entry.profileSnapshot.kind !== 'persisted' && value.entry.profileSnapshot.kind !== 'session') {
        return { status: 'invalid', reason: 'Snapshot de profil inconnu.', raw: value };
      }
      const profile = readHopV55ExplorationProfile(value.entry.profileSnapshot.profile);
      if (profile.status !== 'current') return { status: 'invalid', reason: 'Le profil scellé est altéré ou futur.', raw: value };
      profileReference = profile.profile.reference;
    }
    if (value.entry.comparisonSnapshot === null) {
      if (value.comparisonEvidence !== null) return { status: 'invalid', reason: 'Une preuve de comparaison existe sans snapshot.', raw: value };
    } else {
      if (!isRow(value.entry.comparisonSnapshot) || !isRow(value.comparisonEvidence)
        || !isText(value.comparisonEvidence.sourceId) || !isText(value.comparisonEvidence.alternativeId)
        || !isText(value.comparisonEvidence.sourceMaterialReference) || !isText(value.comparisonEvidence.alternativeMaterialReference)
        || !isText(value.comparisonEvidence.reference)
        || value.comparisonEvidence.readingReference !== (value.readingReference ?? null)
        || value.comparisonEvidence.profileSnapshotReference !== profileReference
        || value.entry.comparisonSnapshot.sourceId !== value.comparisonEvidence.sourceId
        || value.entry.comparisonSnapshot.alternativeId !== value.comparisonEvidence.alternativeId
        || value.entry.comparisonSnapshot.sourceMaterialReference !== value.comparisonEvidence.sourceMaterialReference
        || value.entry.comparisonSnapshot.alternativeMaterialReference !== value.comparisonEvidence.alternativeMaterialReference
        || value.entry.comparisonSnapshot.reference !== value.comparisonEvidence.reference) {
        return { status: 'invalid', reason: 'Preuve de comparaison scellée invalide.', raw: value };
      }
      const sourceMaterial = value.materials.find((material: HopDecisionMaterial) => material.id === value.comparisonEvidence.sourceId);
      const alternativeMaterial = value.materials.find((material: HopDecisionMaterial) => material.id === value.comparisonEvidence.alternativeId);
      if (!sourceMaterial || !alternativeMaterial || !exactValue(value.entry.comparisonSnapshot.sourceMaterial, sourceMaterial)
        || !exactValue(value.entry.comparisonSnapshot.alternativeMaterial, alternativeMaterial)) {
        return { status: 'invalid', reason: 'Comparaison sans les identités exactes du snapshot de matières.', raw: value };
      }
    }
    const captureInput: HopV55ExplorationTrialCaptureV1 = {
      ownerKey: value.ownerKey as string, workspaceId: value.workspaceId as string, source: value.source as HopV55ContextSource,
      sourceReference: value.sourceReference as string | null, runtimeReference: value.runtimeReference as string,
      cultureBinding: value.cultureBinding as HopV55AdoptedContextBindingV1 | null,
      readingArchive: value.readingArchive as HopV55DecisionReadingArchive | null,
      program: value.programSnapshot as HopDecisionProgram, programOrigin: value.programOrigin as HopV55ExplorationTrialProgramOriginV1,
      j5Branch: value.j5Branch as BrewingScenarioBranchRequest,
      programCopyRebase: value.programCopyRebase as HopV55ExplorationTrialProgramCopyRebaseV1 | null,
      intent: value.intent as HopV55Intent, target: value.target as BrewingScenarioRequest['target'] | null,
      materials: value.materials as HopDecisionMaterial[], yeasts: value.yeasts as HopYeast[],
      input: value.input as HopV55ExplorationTrialInputSnapshotV1,
    };
    const capture = trialCaptureReference(captureInput, value.entry as HopV55ExplorationTrialEntryV1, {
      programReference: value.programReference as string, programSnapshotReference: value.programSnapshotReference as string,
      materialsReference: value.materialsReference as string, yeastsReference: value.yeastsReference as string,
      cultureBindingReference: value.cultureBindingReference as string | null, readingReference: value.readingReference as string | null,
      profileReference, comparisonEvidence: value.comparisonEvidence as HopV55ExplorationTrialComparisonEvidenceV1 | null,
    });
    if (capture !== value.captureReference) return { status: 'invalid', reason: 'Empreinte de capture différente de l’entrée et des snapshots scellés.', raw: value };
    if (hopAdviceContentReference(HOP_V55_EXPLORATION_TRIAL_PREPARATION_V1_FORMAT, body) !== reference) {
      return { status: 'invalid', reason: 'Référence de préparation différente de son contenu scellé.', raw: value };
    }
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Préparation d’essai invalide.', raw: value };
  }
  return { status: 'available', preparation: clone(value) as unknown as HopV55ExplorationTrialPreparationV1 };
}

export function confirmHopV55ExplorationTrialV1(input: {
  preparation: HopV55ExplorationTrialPreparationV1;
  current: HopV55ExplorationTrialFreshnessInputV1;
}): ConfirmHopV55ExplorationTrialResultV1 {
  const stored = readHopV55ExplorationTrialPreparationV1(input.preparation);
  if (stored.status !== 'available') return { status: 'stale', reason: 'La préparation V1 exacte est illisible ou future; elle reste en lecture seule.' };
  const current = validateTrialCapture(input.current, input.current.entry, input.current.readComparison);
  if (current.status !== 'ready') return { status: 'stale', reason: current.reason };
  const { id: _id, commandId: _commandId, ownerKey: _ownerKey, workspaceId: _workspaceId,
    scenarioId: _scenarioId, scenarioPreparationId: _scenarioPreparationId, eventId: _eventId,
    recordedAt: _recordedAt, reference: _reference, ...captured } = stored.preparation;
  if (input.current.ownerKey !== stored.preparation.ownerKey || input.current.workspaceId !== stored.preparation.workspaceId
    || current.validated.captureReference !== stored.preparation.captureReference
    || !exactValue(input.current.entry, stored.preparation.entry)
    || !exactValue(captured.source, input.current.source)
    || captured.sourceReference !== input.current.sourceReference || captured.runtimeReference !== input.current.runtimeReference) {
    return { status: 'stale', reason: 'Source, runtime, NR, lecture, programme, matières, entrées ou provenance ont changé depuis la préparation.' };
  }
  return { status: 'current', preparationReference: stored.preparation.reference,
    branch: clone(stored.preparation.j5Branch), scenarioId: stored.preparation.scenarioId,
    scenarioPreparationId: stored.preparation.scenarioPreparationId, eventId: stored.preparation.eventId };
}

export class HopV55ExplorationTrialError extends Error {
  constructor(readonly code: 'invalidInput' | 'notFound' | 'conflict' | 'unsupportedFormat', message: string) {
    super(message);
    this.name = 'HopV55ExplorationTrialError';
  }
}

function preparationReference(value: Omit<HopV55ExplorationTrialPreparationV1, 'reference'>
  | HopV55ExplorationTrialPreparationV1): string {
  const { reference: _reference, ...body } = value as HopV55ExplorationTrialPreparationV1;
  return hopAdviceContentReference(HOP_V55_EXPLORATION_TRIAL_PREPARATION_V1_FORMAT, body);
}

function receiptReference(value: Omit<HopV55ExplorationTrialReceiptV1, 'reference'>
  | HopV55ExplorationTrialReceiptV1): string {
  const { reference: _reference, ...body } = value as HopV55ExplorationTrialReceiptV1;
  return hopAdviceContentReference(HOP_V55_EXPLORATION_TRIAL_RECEIPT_V1_FORMAT, body);
}

export type HopV55ExplorationTrialReceiptReadV1 =
  | { status: 'available'; receipt: HopV55ExplorationTrialReceiptV1 }
  | { status: 'unsupportedReadOnly'; format: string | null; raw: unknown }
  | { status: 'invalid'; reason: string; raw: unknown };

export function readHopV55ExplorationTrialReceiptV1(value: unknown): HopV55ExplorationTrialReceiptReadV1 {
  if (!isRow(value)) return { status: 'invalid', reason: 'Reçu de l’essai illisible.', raw: value };
  if (value.format !== HOP_V55_EXPLORATION_TRIAL_RECEIPT_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', format: typeof value.format === 'string' ? value.format : null, raw: value };
  }
  const keys = ['format', 'id', 'ownerKey', 'workspaceId', 'preparationReference', 'commandId', 'scenarioId',
    'scenarioPreparationId', 'eventId', 'branchId', 'branchReference', 'snapshotReference', 'recordedAt', 'reference'];
  if (!onlyKeys(value, keys) || !isText(value.id) || !isText(value.ownerKey) || !isText(value.workspaceId)
    || !isText(value.preparationReference) || !isText(value.commandId) || !isText(value.scenarioId)
    || !isText(value.scenarioPreparationId) || !isText(value.eventId) || !isText(value.branchId)
    || !isText(value.branchReference) || !isText(value.snapshotReference) || !validInstant(value.recordedAt)
    || !isText(value.reference)) return { status: 'invalid', reason: 'Reçu de l’essai incomplet ou altéré.', raw: value };
  if (receiptReference(value as unknown as HopV55ExplorationTrialReceiptV1) !== value.reference) {
    return { status: 'invalid', reason: 'Empreinte du reçu d’essai différente de son contenu.', raw: value };
  }
  return { status: 'available', receipt: clone(value) as unknown as HopV55ExplorationTrialReceiptV1 };
}

export function createHopV55ExplorationTrialReceiptV1(input: {
  preparation: HopV55ExplorationTrialPreparationV1;
  result: { scenarioId: string; snapshotReference: string; branchId: string };
  recordedAt: string;
}): HopV55ExplorationTrialReceiptV1 {
  const preparation = readHopV55ExplorationTrialPreparationV1(input.preparation);
  if (preparation.status !== 'available') throw new HopV55ExplorationTrialError('invalidInput', 'La préparation exacte est invalide ou future.');
  if (!isText(input.result.scenarioId) || input.result.scenarioId !== preparation.preparation.scenarioId
    || !isText(input.result.snapshotReference) || !isText(input.result.branchId)
    || input.result.branchId !== preparation.preparation.j5Branch.id || !validInstant(input.recordedAt)) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Le reçu doit relier le scénario, la branche et le snapshot exacts de la préparation.');
  }
  const body: Omit<HopV55ExplorationTrialReceiptV1, 'reference'> = {
    format: HOP_V55_EXPLORATION_TRIAL_RECEIPT_V1_FORMAT,
    id: `exploration-trial-receipt:${preparation.preparation.commandId}`,
    ownerKey: preparation.preparation.ownerKey, workspaceId: preparation.preparation.workspaceId,
    preparationReference: preparation.preparation.reference, commandId: preparation.preparation.commandId,
    scenarioId: input.result.scenarioId, scenarioPreparationId: preparation.preparation.scenarioPreparationId,
    eventId: preparation.preparation.eventId, branchId: input.result.branchId,
    branchReference: branchContentReference(preparation.preparation.j5Branch),
    snapshotReference: input.result.snapshotReference, recordedAt: input.recordedAt,
  };
  const receipt = { ...body, reference: receiptReference(body) };
  const read = readHopV55ExplorationTrialReceiptV1(receipt);
  if (read.status !== 'available') throw new HopV55ExplorationTrialError('invalidInput', 'Le reçu d’essai n’a pas passé son reader V1.');
  return read.receipt;
}

function sourceMatchesReading(source: HopV55ContextSource, archive: HopV55DecisionReadingArchive): boolean {
  if (source.kind === 'recipe') return archive.source.kind === 'recipe' && archive.source.id === source.recipeId;
  if (source.kind === 'batch') return archive.source.kind === 'batch' && archive.source.id === source.batchId;
  if (source.kind === 'exploration') return archive.source.kind === 'exploration';
  if (source.kind === 'localRecipeCopy') return archive.source.kind === 'localRecipeCopy'
    && archive.source.workspaceId === source.workspaceId && archive.source.copyId === source.copyId
    && archive.source.recipeId === source.recipeId && archive.source.recipeReference === source.recipeReference;
  return archive.source.kind === 'localFutureDraft' && archive.source.workspaceId === source.workspaceId
    && archive.source.draftId === source.draftId && archive.source.revision === source.revision
    && archive.source.contentReference === source.contentReference;
}

function sourceMatchesWorkspace(source: HopV55ContextSource, workspace: Pick<HopV55Workspace,
  'id' | 'sourceRecipeId' | 'sourceBatchId' | 'copies' | 'futureDrafts' | 'programCopies'>): boolean {
  if (source.kind === 'recipe') return workspace.sourceRecipeId === source.recipeId && workspace.sourceBatchId === undefined;
  if (source.kind === 'batch') return workspace.sourceBatchId === source.batchId;
  if (source.kind === 'exploration') return workspace.sourceRecipeId === undefined && workspace.sourceBatchId === undefined;
  if (source.kind === 'localRecipeCopy') {
    const copy = workspace.copies.find(row => row.id === source.copyId && row.recipe.id === source.recipeId);
    return source.workspaceId === workspace.id && !!copy && hopDecisionReference(copy.recipe) === source.recipeReference;
  }
  return source.workspaceId === workspace.id && (workspace.futureDrafts ?? []).some(row => row.draftId === source.draftId
    && row.revision === source.revision && row.contentReference === source.contentReference);
}

function programOriginMatchesWorkspace(preparation: HopV55ExplorationTrialPreparationV1, workspace: Pick<HopV55Workspace,
  'id' | 'sourceRecipeId' | 'sourceBatchId' | 'copies' | 'futureDrafts' | 'programCopies'>): boolean {
  const origin = preparation.programOrigin;
  if (origin.kind === 'physicalSource') return preparation.sourceReference !== null && origin.reference === preparation.sourceReference;
  if (origin.kind === 'futureDraft') return preparation.source.kind === 'localFutureDraft'
    && origin.draftId === preparation.source.draftId && origin.revision === preparation.source.revision
    && origin.reference === preparation.source.contentReference && sourceMatchesWorkspace(preparation.source, workspace);
  if (origin.kind === 'programCopy') {
    const copy = workspace.programCopies?.find(row => row.id === origin.id);
    return !!copy && copy.previewReference === origin.reference && exactValue(copy.programAfter, preparation.programSnapshot)
      && programFingerprint(copy.programAfter) === preparation.programReference;
  }
  const binding = preparation.cultureBinding && readHopV55AdoptedContextBinding(preparation.cultureBinding);
  return !!binding && binding.status === 'available' && exactValue(binding.binding.reference, origin.identity);
}

export function appendHopV55ExplorationTrialPreparationRecord(workspace: HopV55Workspace,
  preparation: HopV55ExplorationTrialPreparationV1): HopV55Workspace {
  const read = readHopV55ExplorationTrialPreparationV1(preparation);
  if (read.status !== 'available') throw new HopV55ExplorationTrialError('invalidInput', 'Seule une préparation V1 valide peut être ajoutée.');
  if (workspace.id !== preparation.workspaceId || workspace.ownerKey !== preparation.ownerKey) {
    throw new HopV55ExplorationTrialError('invalidInput', 'La préparation est liée à un autre owner/workspace.');
  }
  if (!sourceMatchesWorkspace(preparation.source, workspace)) {
    throw new HopV55ExplorationTrialError('invalidInput', 'La source exacte du programme ne correspond pas au workspace courant.');
  }
  if (!programOriginMatchesWorkspace(preparation, workspace)) {
    throw new HopV55ExplorationTrialError('invalidInput', 'L’origine exacte du programme n’est plus présente sous sa référence dans le workspace.');
  }
  if (preparation.readingReference !== null) {
    const raw = workspace.decisionReadings?.find(row => row.contentReference === preparation.readingReference);
    const archive = raw && readHopV55DecisionReadingArchive(raw);
    if (archive?.status !== 'available' || !exactValue(archive.archive, preparation.readingArchive)
      || archive.archive.runtimeReference !== preparation.runtimeReference
      || !sourceMatchesReading(preparation.source, archive.archive)) {
      throw new HopV55ExplorationTrialError('invalidInput', 'La lecture exacte et sa source doivent être archivées avant l’essai.');
    }
  }
  if (preparation.entry.profileSnapshot?.kind === 'persisted') {
    const profile = preparation.entry.profileSnapshot.profile;
    const found = (workspace.explorationProfiles ?? []).map(readHopV55ExplorationProfile).some(row =>
      row.status === 'current' && row.profile.reference === profile.reference && exactValue(row.profile, profile));
    if (!found) throw new HopV55ExplorationTrialError('invalidInput', 'La version de profil persistée doit exister exactement dans le workspace.');
  }
  const rows = workspace.explorationTrialPreparations ?? [];
  const existing = rows.map(readHopV55ExplorationTrialPreparationV1).find(row =>
    row.status === 'available' && row.preparation.id === preparation.id);
  if (existing?.status === 'available') {
    if (existing.preparation.reference !== preparation.reference) throw new HopV55ExplorationTrialError('conflict', 'Cette commande d’essai existe avec un autre contenu.');
    return clone(workspace);
  }
  if (rows.some(row => isRow(row) && row.id === preparation.id && row.format !== HOP_V55_EXPLORATION_TRIAL_PREPARATION_V1_FORMAT)) {
    throw new HopV55ExplorationTrialError('unsupportedFormat', 'Une préparation future réserve cette identité; aucun repli n’est autorisé.');
  }
  return { ...clone(workspace), explorationTrialPreparations: [...clone(rows), clone(preparation)] };
}

export function appendHopV55ExplorationTrialReceiptRecord(workspace: HopV55Workspace,
  receipt: HopV55ExplorationTrialReceiptV1): HopV55Workspace {
  const read = readHopV55ExplorationTrialReceiptV1(receipt);
  if (read.status !== 'available') throw new HopV55ExplorationTrialError('invalidInput', 'Seul un reçu V1 valide peut être ajouté.');
  if (workspace.id !== receipt.workspaceId || workspace.ownerKey !== receipt.ownerKey) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Le reçu est lié à un autre owner/workspace.');
  }
  const preparationRaw = workspace.explorationTrialPreparations?.find(row => isRow(row) && row.reference === receipt.preparationReference);
  const preparation = preparationRaw && readHopV55ExplorationTrialPreparationV1(preparationRaw);
  if (preparation?.status !== 'available' || preparation.preparation.commandId !== receipt.commandId
    || preparation.preparation.scenarioId !== receipt.scenarioId || preparation.preparation.scenarioPreparationId !== receipt.scenarioPreparationId
    || preparation.preparation.eventId !== receipt.eventId || preparation.preparation.j5Branch.id !== receipt.branchId
    || branchContentReference(preparation.preparation.j5Branch) !== receipt.branchReference) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Le reçu ne correspond pas à la préparation et sa branche exacte.');
  }
  if (!(workspace.scenarioPreparations ?? []).some(row => row.id === receipt.scenarioPreparationId
    && row.scenarioId === receipt.scenarioId && row.ownerKey === receipt.ownerKey && row.workspaceId === receipt.workspaceId)) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Le staging J5 exact doit être conservé avant son reçu d’essai.');
  }
  if (!(workspace.snapshotIntents ?? []).some(row => row.scenarioId === receipt.scenarioId
    && row.snapshotReference === receipt.snapshotReference
    && row.decisionReadingReference === preparation.preparation.readingReference)) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Le reçu doit relier le snapshot J5 et la lecture source exacts.');
  }
  const rows = workspace.explorationTrialReceipts ?? [];
  const existing = rows.map(readHopV55ExplorationTrialReceiptV1).find(row => row.status === 'available'
    && row.receipt.preparationReference === receipt.preparationReference);
  if (existing?.status === 'available') {
    if (existing.receipt.reference !== receipt.reference) throw new HopV55ExplorationTrialError('conflict', 'Cette préparation est déjà reçue avec un autre snapshot.');
    return clone(workspace);
  }
  if (rows.some(row => isRow(row) && row.preparationReference === receipt.preparationReference
    && row.format !== HOP_V55_EXPLORATION_TRIAL_RECEIPT_V1_FORMAT)) {
    throw new HopV55ExplorationTrialError('unsupportedFormat', 'Un reçu futur réserve cette préparation; aucun repli n’est autorisé.');
  }
  return { ...clone(workspace), explorationTrialReceipts: [...clone(rows), clone(receipt)] };
}

export function assertHopV55ExplorationTrialWorkspaceCollections(workspace: Pick<HopV55Workspace,
  'id' | 'ownerKey' | 'sourceRecipeId' | 'sourceBatchId' | 'copies' | 'futureDrafts'
  | 'programCopies' | 'decisionReadings' | 'explorationProfiles' | 'scenarioPreparations' | 'snapshotIntents'
  | 'explorationTrialPreparations' | 'explorationTrialReceipts'>): void {
  for (const [field, rows] of [['explorationTrialPreparations', workspace.explorationTrialPreparations],
    ['explorationTrialReceipts', workspace.explorationTrialReceipts]] as const) {
    if (rows !== undefined && !Array.isArray(rows)) throw new HopV55ExplorationTrialError('invalidInput', `${field} doit rester un historique append-only.`);
  }
  const preparations = new Map<string, HopV55ExplorationTrialPreparationV1>();
  const ids = new Set<string>();
  for (const raw of workspace.explorationTrialPreparations ?? []) {
    const read = readHopV55ExplorationTrialPreparationV1(raw);
    if (read.status === 'unsupportedReadOnly' || read.status === 'invalid') {
      if (isRow(raw) && isText(raw.ownerKey) && raw.ownerKey !== workspace.ownerKey
        || isRow(raw) && isText(raw.workspaceId) && raw.workspaceId !== workspace.id) {
        throw new HopV55ExplorationTrialError('invalidInput', 'Préparation future d’un autre owner/workspace.');
      }
      continue;
    }
    const preparation = read.preparation;
    if (preparation.ownerKey !== workspace.ownerKey || preparation.workspaceId !== workspace.id
      || ids.has(preparation.id) || preparations.has(preparation.reference)) {
      throw new HopV55ExplorationTrialError('invalidInput', 'Préparation d’essai d’un autre dossier ou identifiant dupliqué.');
    }
    if (preparation.readingReference !== null) {
      const archiveRaw = workspace.decisionReadings?.find(row => row.contentReference === preparation.readingReference);
      const archive = archiveRaw && readHopV55DecisionReadingArchive(archiveRaw);
      if (archive?.status !== 'available' || !exactValue(archive.archive, preparation.readingArchive)
        || archive.archive.runtimeReference !== preparation.runtimeReference
        || !sourceMatchesReading(preparation.source, archive.archive)) {
        throw new HopV55ExplorationTrialError('invalidInput', 'La préparation référence une lecture absente ou une source différente.');
      }
    }
    if (!sourceMatchesWorkspace(preparation.source, workspace)) {
      throw new HopV55ExplorationTrialError('invalidInput', 'La source exacte de la préparation ne correspond pas au workspace courant.');
    }
    if (preparation.entry.profileSnapshot?.kind === 'persisted'
      && !(workspace.explorationProfiles ?? []).map(readHopV55ExplorationProfile).some(row => row.status === 'current'
        && row.profile.reference === preparation.entry.profileSnapshot!.profile.reference
        && exactValue(row.profile, preparation.entry.profileSnapshot!.profile))) {
      throw new HopV55ExplorationTrialError('invalidInput', 'Le profil persisté de la préparation est absent du workspace.');
    }
    if (!programOriginMatchesWorkspace(preparation, workspace)) {
      throw new HopV55ExplorationTrialError('invalidInput', 'L’origine exacte du programme ne correspond plus à sa référence dans le workspace.');
    }
    ids.add(preparation.id); preparations.set(preparation.reference, preparation);
  }
  const receiptIds = new Set<string>(), receiptReferences = new Set<string>(), receivedPreparationReferences = new Set<string>();
  for (const raw of workspace.explorationTrialReceipts ?? []) {
    const read = readHopV55ExplorationTrialReceiptV1(raw);
    if (read.status === 'unsupportedReadOnly' || read.status === 'invalid') {
      if (isRow(raw) && isText(raw.ownerKey) && raw.ownerKey !== workspace.ownerKey
        || isRow(raw) && isText(raw.workspaceId) && raw.workspaceId !== workspace.id) {
        throw new HopV55ExplorationTrialError('invalidInput', 'Reçu futur d’un autre owner/workspace.');
      }
      continue;
    }
    const receipt = read.receipt, preparation = preparations.get(receipt.preparationReference);
    if (!preparation || receipt.ownerKey !== workspace.ownerKey || receipt.workspaceId !== workspace.id
      || receiptIds.has(receipt.id) || receiptReferences.has(receipt.reference)
      || receivedPreparationReferences.has(receipt.preparationReference)
      || receipt.commandId !== preparation.commandId || receipt.scenarioId !== preparation.scenarioId
      || receipt.scenarioPreparationId !== preparation.scenarioPreparationId || receipt.eventId !== preparation.eventId
      || receipt.branchId !== preparation.j5Branch.id
      || receipt.branchReference !== branchContentReference(preparation.j5Branch)) {
      throw new HopV55ExplorationTrialError('invalidInput', 'Le reçu d’essai ne correspond pas à une préparation V1 exacte.');
    }
    if (!(workspace.scenarioPreparations ?? []).some(row => row.id === receipt.scenarioPreparationId && row.scenarioId === receipt.scenarioId)
      || !(workspace.snapshotIntents ?? []).some(row => row.scenarioId === receipt.scenarioId
        && row.snapshotReference === receipt.snapshotReference && row.decisionReadingReference === preparation.readingReference)) {
      throw new HopV55ExplorationTrialError('invalidInput', 'Le reçu ne correspond pas au staging J5/snapshot exact conservé.');
    }
    receiptIds.add(receipt.id); receiptReferences.add(receipt.reference); receivedPreparationReferences.add(receipt.preparationReference);
  }
}

export function assertHopV55ExplorationTrialAppendOnly(previous: HopV55Workspace, next: HopV55Workspace): void {
  const priorPreparations = previous.explorationTrialPreparations ?? [], nextPreparations = next.explorationTrialPreparations ?? [];
  if (nextPreparations.length < priorPreparations.length || priorPreparations.some((row, index) => !exactValue(row, nextPreparations[index]))) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Une préparation d’essai est immuable et append-only.');
  }
  const priorRefs = new Set(priorPreparations.flatMap(row => {
    const read = readHopV55ExplorationTrialPreparationV1(row);
    return read.status === 'available' ? [read.preparation.reference] : [];
  }));
  for (const raw of nextPreparations.slice(priorPreparations.length)) {
    const read = readHopV55ExplorationTrialPreparationV1(raw);
    if (read.status !== 'available') throw new HopV55ExplorationTrialError('unsupportedFormat', 'Une préparation future ou altérée reste en lecture seule.');
    if (read.preparation.ownerKey !== previous.ownerKey || read.preparation.workspaceId !== previous.id
      || read.preparation.readingReference && !priorRefs.has(read.preparation.readingReference)
        && !(previous.decisionReadings ?? []).some(row => row.contentReference === read.preparation.readingReference)) {
      throw new HopV55ExplorationTrialError('invalidInput', 'Owner/workspace/source de lecture non persistés avant la préparation.');
    }
  }
  const priorReceipts = previous.explorationTrialReceipts ?? [], nextReceipts = next.explorationTrialReceipts ?? [];
  if (nextReceipts.length < priorReceipts.length || priorReceipts.some((row, index) => !exactValue(row, nextReceipts[index]))) {
    throw new HopV55ExplorationTrialError('invalidInput', 'Un reçu d’essai est immuable et append-only.');
  }
  for (const raw of nextReceipts.slice(priorReceipts.length)) {
    const read = readHopV55ExplorationTrialReceiptV1(raw);
    if (read.status !== 'available') throw new HopV55ExplorationTrialError('unsupportedFormat', 'Un reçu futur ou altéré reste en lecture seule.');
    const receipt = read.receipt;
    const prepExists = priorPreparations.some(row => {
      const prep = readHopV55ExplorationTrialPreparationV1(row);
      return prep.status === 'available' && prep.preparation.reference === receipt.preparationReference;
    });
    if (!prepExists || receipt.ownerKey !== previous.ownerKey || receipt.workspaceId !== previous.id) {
      throw new HopV55ExplorationTrialError('invalidInput', 'La préparation et son owner/workspace doivent être persistés avant le reçu.');
    }
  }
}
