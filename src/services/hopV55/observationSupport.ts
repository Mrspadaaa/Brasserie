import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopV55Workspace } from './contracts';
import type {
  BrewingReferenceObservationDimensionV1,
  BrewingReferenceObservationV1,
} from '../../domain/brewingReference';
import { readBrewingReferenceRecord } from '../../domain/brewingReference';
import type { BrewingObservedHopScope, BrewingObservationTargetRequest } from '../../domain/brewingObservationInputs';
import type { BrewingObservationRestStability } from '../../domain/brewingObservationProjection';
import {
  assertBrewingObservationArithmeticContract,
  brewingObservationArithmeticReference,
  type BrewingObservationArithmeticContract,
} from '../../domain/brewingObservationNumerics';
import {
  assertBrewingSensoryDefinitionReference,
  assertBrewingSensoryMetric,
  createBrewingSensoryDefinitionReference,
  type BrewingSensoryDefinitionReference,
  type BrewingSensoryDimension,
  type BrewingSensoryMetric,
  type BrewingSensoryScale,
} from '../../domain/brewingSensory';
import { readHopV55ObservationAnchorRecord } from './observationSession';
import { assertBrewingNuancePlan, type BrewingNuancePlan } from '../../domain/brewingNuanceProjection';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopSourceError } from '../../../functions/src/hopIndexSchema';

export const HOP_V55_OBSERVATION_SUPPORT_RECORD_FORMAT = 'hop-v55-observation-support-record-v1' as const;
export const HOP_V55_OBSERVATION_SUPPORT_SELECTION_FORMAT = 'hop-v55-observation-support-selection-v1' as const;

export type HopV55ObservationSupportRecordKind = 'protocolNote' | 'hopScope' | 'arithmetic' | 'stability';
export type HopV55ObservationSupportMeaning = {
  kind: 'intensity' | 'preference' | 'ranking';
  orientation: 'increasing' | 'decreasing';
};
export interface HopV55ObservationSupportActorV1 {
  origin: 'user' | 'assistant' | 'model';
  name: string;
}

interface HopV55ObservationSupportRecordBaseV1 {
  format: typeof HOP_V55_OBSERVATION_SUPPORT_RECORD_FORMAT;
  recordKind: HopV55ObservationSupportRecordKind;
  /** Unique immutable record identity. */
  id: string;
  /** Stable identity shared only by revisions of this same declaration. */
  supportId: string;
  revision: number;
  /** Exact fingerprint of the immediately preceding version, or null at v1. */
  predecessorReference: string | null;
  workspaceId: string;
  ownerKey: string;
  recordedAt: string;
  recordedBy: HopV55ObservationSupportActorV1;
  reference: string;
}

export type HopV55ObservationSupportRecordV1 =
  | (HopV55ObservationSupportRecordBaseV1 & {
      recordKind: 'protocolNote';
      definition: BrewingSensoryDefinitionReference;
      meaning: HopV55ObservationSupportMeaning;
    })
  | (HopV55ObservationSupportRecordBaseV1 & {
      recordKind: 'hopScope';
      scope: BrewingObservedHopScope;
    })
  | (HopV55ObservationSupportRecordBaseV1 & {
      recordKind: 'arithmetic';
      contract: BrewingObservationArithmeticContract;
    })
  | (HopV55ObservationSupportRecordBaseV1 & {
      recordKind: 'stability';
      stability: BrewingObservationRestStability;
      comparisonBinding: HopV55ObservationSupportComparisonBindingV1;
    });

export type HopV55ObservationSupportArithmeticRecordV1 = Extract<HopV55ObservationSupportRecordV1, { recordKind: 'arithmetic' }>;
export type HopV55ObservationSupportStabilityRecordV1 = Extract<HopV55ObservationSupportRecordV1, { recordKind: 'stability' }>;

export interface HopV55ObservationSupportComparisonBindingV1 {
  anchorReference: string;
  /** Exact `PreparedBrewingObservedContextV1.reference`, not a timestamp or recipe pointer. */
  currentStateReference: string;
  targetRequestReference: string;
  frameReferences: string[];
  /** Reference of the persisted support arithmetic record, not a display label. */
  arithmeticReference: string;
}

export interface HopV55ObservationSupportSelectionV1 {
  format: typeof HOP_V55_OBSERVATION_SUPPORT_SELECTION_FORMAT;
  /** Each row is an immutable new active-selection version. */
  id: string;
  revision: number;
  predecessorReference: string | null;
  workspaceId: string;
  ownerKey: string;
  recordedAt: string;
  recordedBy: HopV55ObservationSupportActorV1;
  dimensionReference: string;
  hopScopeReference: string;
  /** Exact adopted plan references, kept in the brewer's selected order. */
  frameReferences: string[];
  arithmeticReference: string | null;
  reference: string;
}

export type HopV55ObservationSupportRecordRead =
  | { status: 'readOnly'; record: HopV55ObservationSupportRecordV1 }
  | { status: 'unsupportedRO'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type HopV55ObservationSupportSelectionRead =
  | { status: 'readOnly'; selection: HopV55ObservationSupportSelectionV1 }
  | { status: 'unsupportedRO'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export interface HopV55ObservationSupportDefinitionChoiceV1 {
  id: string;
  supportId?: string;
  revision?: number;
  predecessorReference?: string | null;
  reference: string;
  label: string;
  description: string;
  origin: 'protocolNote' | 'observation' | 'adoptedPlan';
  definition: BrewingSensoryDefinitionReference;
  meaning?: HopV55ObservationSupportMeaning;
}

export interface HopV55ObservationSupportFrameChoiceV1 {
  id: string;
  label: string;
  description: string;
  plan: BrewingNuancePlan;
}

export interface HopV55ObservationSupportArithmeticChoiceV1 {
  id: string;
  supportId: string;
  revision: number;
  predecessorReference: string | null;
  label: string;
  description: string;
  contract: BrewingObservationArithmeticContract;
  reference: string;
}

export interface HopV55ObservationStabilityProposalV1 {
  id: string;
  supportId: string;
  revision: number;
  predecessorReference: string | null;
  label: string;
  description: string;
  stability: BrewingObservationRestStability;
  reference: string;
  comparisonBinding: HopV55ObservationSupportComparisonBindingV1;
}

export interface HopV55ObservationWorkbenchSupportV1 {
  requestedDimension: BrewingReferenceObservationDimensionV1;
  hopScope: BrewingObservedHopScope;
  adoptedFrames: HopV55ObservationSupportFrameChoiceV1[];
  arithmeticChoices: HopV55ObservationSupportArithmeticChoiceV1[];
  /** Historical stability declarations are proposals only; a question must revalidate/adopt its exact binding. */
  stabilityProposals: HopV55ObservationStabilityProposalV1[];
  /** Valid non-model-index protocols and exact existing observation definitions for ReferencePanel. */
  observationDefinitions: BrewingSensoryDefinitionReference[];
}

export interface HopV55ObservationSupportChoicesV1 {
  observationDefinitions: BrewingSensoryDefinitionReference[];
  dimensions: HopV55ObservationSupportDefinitionChoiceV1[];
  hopScopes: Array<{ id: string; supportId: string; revision: number; predecessorReference: string | null;
    reference: string; label: string; scope: BrewingObservedHopScope }>;
  frames: HopV55ObservationSupportFrameChoiceV1[];
  arithmetic: HopV55ObservationSupportArithmeticChoiceV1[];
  stabilities: HopV55ObservationStabilityProposalV1[];
}

export type HopV55ObservationSupportResolutionV1 =
  | { status: 'ready'; support: HopV55ObservationWorkbenchSupportV1; selection: HopV55ObservationSupportSelectionV1;
      choices: HopV55ObservationSupportChoicesV1; notices: string[] }
  | { status: 'needsSetup'; missing: string[]; selection?: HopV55ObservationSupportSelectionV1;
      support?: HopV55ObservationWorkbenchSupportV1; choices: HopV55ObservationSupportChoicesV1 }
  | { status: 'unsupportedRO'; reason: string; snapshot?: unknown; choices: HopV55ObservationSupportChoicesV1 };

export interface HopV55CreateObservationSupportRecordBaseV1 {
  workspace: HopV55Workspace;
  id: string;
  supportId: string;
  revision: number;
  predecessorReference: string | null;
  recordedAt: string;
  recordedBy: HopV55ObservationSupportActorV1;
}

export interface HopV55ObservationSupportSelectionInputV1 {
  id: string;
  recordedAt: string;
  recordedBy: HopV55ObservationSupportActorV1;
  dimensionReference: string;
  hopScopeReference: string;
  frameReferences: string[];
  arithmeticReference: string | null;
}

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const iso = (value: unknown): value is string => text(value) && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const clone = <T,>(value: T): T => structuredClone(value);
const hash = (kind: string, value: unknown) => hopAdviceContentReference(kind, value);
const onlyKeys = (value: Record<string, unknown>, allowed: readonly string[]) => Object.keys(value).every(key => allowed.includes(key));
const actorValid = (value: unknown): value is HopV55ObservationSupportActorV1 => object(value)
  && onlyKeys(value, ['origin', 'name']) && ['user', 'assistant', 'model'].includes(value.origin) && text(value.name);

function invalid(message: string): never { throw new Error(message); }

function recordReference(value: Omit<HopV55ObservationSupportRecordV1, 'reference'> | HopV55ObservationSupportRecordV1): string {
  const { reference: _reference, ...body } = value as HopV55ObservationSupportRecordV1;
  return hash(HOP_V55_OBSERVATION_SUPPORT_RECORD_FORMAT, body);
}

function selectionReference(value: Omit<HopV55ObservationSupportSelectionV1, 'reference'> | HopV55ObservationSupportSelectionV1): string {
  const { reference: _reference, ...body } = value as HopV55ObservationSupportSelectionV1;
  return hash(HOP_V55_OBSERVATION_SUPPORT_SELECTION_FORMAT, body);
}

function validScope(value: unknown): value is BrewingObservedHopScope {
  return object(value) && onlyKeys(value, ['id', 'dependencyIds', 'fromAt', 'explanation'])
    && text(value.id) && Array.isArray(value.dependencyIds) && value.dependencyIds.length > 0
    && value.dependencyIds.every(text) && new Set(value.dependencyIds).size === value.dependencyIds.length
    && iso(value.fromAt) && text(value.explanation);
}

function validMeaning(value: unknown): value is HopV55ObservationSupportMeaning {
  return object(value) && onlyKeys(value, ['kind', 'orientation'])
    && ['intensity', 'preference', 'ranking'].includes(value.kind)
    && ['increasing', 'decreasing'].includes(value.orientation);
}

function validBinding(value: unknown): value is HopV55ObservationSupportComparisonBindingV1 {
  return object(value) && onlyKeys(value, ['anchorReference', 'currentStateReference', 'targetRequestReference', 'frameReferences', 'arithmeticReference'])
    && text(value.anchorReference) && text(value.currentStateReference) && text(value.targetRequestReference)
    && Array.isArray(value.frameReferences) && value.frameReferences.length > 0 && value.frameReferences.every(text)
    && new Set(value.frameReferences).size === value.frameReferences.length && text(value.arithmeticReference);
}

function validRestStability(value: unknown): value is BrewingObservationRestStability {
  if (!object(value) || !onlyKeys(value, ['status', 'explanation', 'conditions', 'adoptedAt', 'adoptedBy'])
    || !['adopted', 'notEstablished'].includes(value.status) || !text(value.explanation) || !Array.isArray(value.conditions)) return false;
  const ids = new Set<string>();
  for (const condition of value.conditions) {
    if (!object(condition) || !onlyKeys(condition, ['id', 'status', 'explanation', 'sourceRefs']) || !text(condition.id)
      || ids.has(condition.id) || !['declaredCompatible', 'unknown', 'changed'].includes(condition.status)
      || !text(condition.explanation) || !Array.isArray(condition.sourceRefs) || condition.sourceRefs.some((source: HopSource) => !!hopSourceError(source))) return false;
    ids.add(condition.id);
  }
  if (value.status === 'adopted') {
    if (!iso(value.adoptedAt) || !actorValid(value.adoptedBy) || value.conditions.length === 0) return false;
  } else if (value.adoptedAt !== undefined || value.adoptedBy !== undefined) return false;
  return true;
}

function assertRecord(value: unknown): asserts value is HopV55ObservationSupportRecordV1 {
  if (!object(value) || value.format !== HOP_V55_OBSERVATION_SUPPORT_RECORD_FORMAT
    || !['protocolNote', 'hopScope', 'arithmetic', 'stability'].includes(value.recordKind)
    || !text(value.id) || !text(value.supportId) || !Number.isSafeInteger(value.revision) || value.revision < 1
    || !(value.predecessorReference === null || text(value.predecessorReference))
    || !text(value.workspaceId) || !text(value.ownerKey) || !iso(value.recordedAt) || !actorValid(value.recordedBy) || !text(value.reference)) {
    throw new Error('Enregistrement de support d’observation incomplet.');
  }
  if (value.revision === 1 && value.predecessorReference !== null || value.revision > 1 && value.predecessorReference === null) {
    throw new Error('Prédécesseur de support incohérent avec sa révision.');
  }
  if (value.recordKind === 'protocolNote') {
    if (!onlyKeys(value, ['format', 'recordKind', 'id', 'supportId', 'revision', 'predecessorReference', 'workspaceId', 'ownerKey', 'recordedAt', 'recordedBy', 'definition', 'meaning', 'reference'])) {
      throw new Error('Record de protocole de note avec champs inconnus.');
    }
    assertBrewingSensoryDefinitionReference(value.definition);
    if (value.definition.metric?.kind === 'modelIndex' || !validMeaning(value.meaning)) {
      throw new Error('Un protocole de note ne peut pas rebaptiser un index de modèle et doit déclarer son sens/orientation.');
    }
  } else if (value.recordKind === 'hopScope') {
    if (!onlyKeys(value, ['format', 'recordKind', 'id', 'supportId', 'revision', 'predecessorReference', 'workspaceId', 'ownerKey', 'recordedAt', 'recordedBy', 'scope', 'reference'])
      || !validScope(value.scope)) throw new Error('Portée de houblon invalide.');
  } else if (value.recordKind === 'arithmetic') {
    if (!onlyKeys(value, ['format', 'recordKind', 'id', 'supportId', 'revision', 'predecessorReference', 'workspaceId', 'ownerKey', 'recordedAt', 'recordedBy', 'contract', 'reference'])) {
      throw new Error('Record arithmétique avec champs inconnus.');
    }
    assertBrewingObservationArithmeticContract(value.contract);
  } else {
    if (!onlyKeys(value, ['format', 'recordKind', 'id', 'supportId', 'revision', 'predecessorReference', 'workspaceId', 'ownerKey', 'recordedAt', 'recordedBy', 'stability', 'comparisonBinding', 'reference'])
      || !validRestStability(value.stability) || !validBinding(value.comparisonBinding)) {
      throw new Error('Record de stabilité invalide ou sans binding exact.');
    }
  }
  if (value.reference !== recordReference(value as HopV55ObservationSupportRecordV1)) throw new Error('Empreinte de support d’observation incorrecte.');
}

export function readHopV55ObservationSupportRecord(value: unknown): HopV55ObservationSupportRecordRead {
  if (object(value) && text(value.format) && value.format.startsWith('hop-v55-observation-support-record-')
    && value.format !== HOP_V55_OBSERVATION_SUPPORT_RECORD_FORMAT) {
    return { status: 'unsupportedRO', snapshot: clone(value), reason: 'Format futur de support préservé sans interprétation.' };
  }
  try { assertRecord(value); return { status: 'readOnly', record: clone(value) }; }
  catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Record support illisible.' }; }
}

function assertSelection(value: unknown): asserts value is HopV55ObservationSupportSelectionV1 {
  if (!object(value) || !onlyKeys(value, ['format', 'id', 'revision', 'predecessorReference', 'workspaceId', 'ownerKey', 'recordedAt', 'recordedBy',
    'dimensionReference', 'hopScopeReference', 'frameReferences', 'arithmeticReference', 'reference'])
    || value.format !== HOP_V55_OBSERVATION_SUPPORT_SELECTION_FORMAT || !text(value.id) || !Number.isSafeInteger(value.revision) || value.revision < 1
    || !(value.predecessorReference === null || text(value.predecessorReference)) || !text(value.workspaceId) || !text(value.ownerKey)
    || !iso(value.recordedAt) || !actorValid(value.recordedBy) || !text(value.dimensionReference) || !text(value.hopScopeReference)
    || !Array.isArray(value.frameReferences) || value.frameReferences.some((reference: unknown) => !text(reference))
    || new Set(value.frameReferences).size !== value.frameReferences.length
    || !(value.arithmeticReference === null || text(value.arithmeticReference)) || !text(value.reference)) {
    throw new Error('Sélection de support d’observation incomplète.');
  }
  if (value.revision === 1 && value.predecessorReference !== null || value.revision > 1 && value.predecessorReference === null) {
    throw new Error('Prédécesseur de sélection de support incohérent.');
  }
  if (value.reference !== selectionReference(value as HopV55ObservationSupportSelectionV1)) throw new Error('Empreinte de sélection support incorrecte.');
}

export function readHopV55ObservationSupportSelection(value: unknown): HopV55ObservationSupportSelectionRead {
  if (object(value) && text(value.format) && value.format.startsWith('hop-v55-observation-support-selection-')
    && value.format !== HOP_V55_OBSERVATION_SUPPORT_SELECTION_FORMAT) {
    return { status: 'unsupportedRO', snapshot: clone(value), reason: 'Format futur de sélection de support préservé sans interprétation.' };
  }
  try { assertSelection(value); return { status: 'readOnly', selection: clone(value) }; }
  catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'Sélection support illisible.' }; }
}

function workspaceIdentity(workspace: HopV55Workspace, record: HopV55ObservationSupportRecordV1): void {
  if (record.workspaceId !== workspace.id || record.ownerKey !== workspace.ownerKey) throw new Error('Support d’observation lié à un autre owner/workspace.');
}

function supportedRecordRows(workspace: HopV55Workspace): HopV55ObservationSupportRecordV1[] {
  const rows: HopV55ObservationSupportRecordV1[] = [];
  for (const raw of workspace.observationSupportRecords ?? []) {
    const read = readHopV55ObservationSupportRecord(raw);
    if (read.status === 'invalid') throw new Error(read.reason);
    if (read.status === 'unsupportedRO') continue;
    workspaceIdentity(workspace, read.record);
    rows.push(read.record);
  }
  return rows;
}

function supportedSelectionRows(workspace: HopV55Workspace): HopV55ObservationSupportSelectionV1[] {
  const rows: HopV55ObservationSupportSelectionV1[] = [];
  for (const raw of workspace.observationSupportSelections ?? []) {
    const read = readHopV55ObservationSupportSelection(raw);
    if (read.status === 'invalid') throw new Error(read.reason);
    if (read.status === 'unsupportedRO') continue;
    if (read.selection.workspaceId !== workspace.id || read.selection.ownerKey !== workspace.ownerKey) {
      throw new Error('Sélection de support d’observation liée à un autre owner/workspace.');
    }
    rows.push(read.selection);
  }
  return rows;
}

function adoptedFrameDisplayLabel(plan: BrewingNuancePlan): string {
  const dimensions = plan.definitions.map(definition => definition.dimension.name);
  const dimensionLabel = dimensions.length <= 3 ? dimensions.join(' / ')
    : `${dimensions.slice(0, 3).join(' / ')} · +${dimensions.length - 3}`;
  return `${plan.sourceModel.name} v${plan.sourceModel.version} · ${dimensionLabel} · r${plan.revision}`;
}

function arithmeticDisplayLabel(contract: BrewingObservationArithmeticContract): string {
  const definition = contract.unitBridge?.sourceDefinition ?? contract.definition;
  const dimension = definition.dimension.name;
  if (contract.unitBridge) return `Correspondance note–indice · ${dimension}`;
  if (contract.operation === 'additiveDifference') {
    const unit = contract.definition.metric?.kind === 'ordinalNote' ? 'ordinales'
      : contract.definition.metric?.kind === 'measurement' ? 'mesurées' : 'numériques';
    return `Différences ${unit} · ${dimension}`;
  }
  return `Hypothèse ordinale · ${dimension}`;
}

function findAdoptedPlans(workspace: HopV55Workspace): HopV55ObservationSupportFrameChoiceV1[] {
  const plans = new Map<string, BrewingNuancePlan>();
  const add = (plan: BrewingNuancePlan) => {
    assertBrewingNuancePlan(plan);
    if (plan.status !== 'adopted') return;
    const prior = plans.get(plan.reference);
    if (prior && hash('hop-v55-observation-support-plan-dedup-v1', prior) !== hash('hop-v55-observation-support-plan-dedup-v1', plan)) {
      throw new Error('Deux plans adoptés ont une référence identique avec des contenus divergents.');
    }
    plans.set(plan.reference, clone(plan));
  };
  for (const plan of workspace.nuancePlans ?? []) add(plan);
  for (const study of workspace.nuanceStudies ?? []) {
    if (!object(study) || !object(study.projection)) continue;
    const snapshot = study.projection.planSnapshot;
    if (!object(snapshot)) continue;
    try { add(snapshot as BrewingNuancePlan); } catch { /* Unknown/proposed plans remain opaque or unavailable choices. */ }
  }
  return [...plans.values()].sort((a, b) => a.reference.localeCompare(b.reference)).map(plan => ({
    id: plan.reference,
    label: adoptedFrameDisplayLabel(plan),
    description: plan.explanation,
    plan,
  }));
}

function definitionChoices(workspace: HopV55Workspace, records: HopV55ObservationSupportRecordV1[], frames: HopV55ObservationSupportFrameChoiceV1[]) {
  const definitions = new Map<string, HopV55ObservationSupportDefinitionChoiceV1>();
  const add = (choice: HopV55ObservationSupportDefinitionChoiceV1) => {
    assertBrewingSensoryDefinitionReference(choice.definition);
    const prior = definitions.get(choice.reference);
    if (prior && hash('hop-v55-observation-support-definition-choice-v1', prior.definition)
      !== hash('hop-v55-observation-support-definition-choice-v1', choice.definition)) {
      throw new Error('Définitions sensorielles divergentes sous une même référence.');
    }
    definitions.set(choice.reference, clone(choice));
  };
  for (const record of records) if (record.recordKind === 'protocolNote' && !hasUnsupportedSuccessor(workspace, record)) add({ id: record.id, reference: record.definition.contentReference,
    supportId: record.supportId, revision: record.revision, predecessorReference: record.predecessorReference,
    label: `${record.definition.dimension.name} · ${record.meaning.kind} · ${record.meaning.orientation}`,
    description: record.definition.dimension.definition, origin: 'protocolNote', definition: record.definition, meaning: record.meaning });
  const addObservation = (observation: BrewingReferenceObservationV1) => {
    if (observation.dimension.status !== 'resolved') return;
    const definition = observation.dimension.definition;
    add({ id: `${observation.id}:v${observation.version}`, reference: definition.contentReference,
      label: `${definition.dimension.name} · note ${observation.id} v${observation.version}`,
      description: definition.dimension.definition, origin: 'observation', definition });
  };
  if (workspace.referenceJournal) {
    const read = readBrewingReferenceRecord(workspace.referenceJournal.record, workspace.referenceJournal.events);
    if (!('status' in read)) read.projection.observations.forEach(addObservation);
  }
  for (const raw of workspace.observationAnchors ?? []) {
    const read = readHopV55ObservationAnchorRecord(raw);
    if (read.status === 'readOnly' && read.record.recordKind !== 'currentPreparation' && read.record.anchor) {
      addObservation(read.record.anchor.observation);
    }
  }
  for (const frame of frames) for (const definition of frame.plan.definitions) {
    add({ id: `${frame.plan.reference}:${definition.contentReference}`, reference: definition.contentReference,
      label: `${definition.dimension.name} · ${frame.plan.planId} r${frame.plan.revision}`,
      description: definition.dimension.definition, origin: 'adoptedPlan', definition });
  }
  const all = [...definitions.values()].sort((a, b) => a.reference.localeCompare(b.reference));
  const observationDefinitions = all.flatMap(choice => choice.definition.metric?.kind === 'modelIndex' ? [] : [clone(choice.definition)])
    .filter((definition, index, rows) => rows.findIndex(other => other.contentReference === definition.contentReference) === index);
  return { dimensions: all, observationDefinitions };
}

function buildChoices(workspace: HopV55Workspace, records: HopV55ObservationSupportRecordV1[]): HopV55ObservationSupportChoicesV1 {
  const frames = findAdoptedPlans(workspace);
  const definitions = definitionChoices(workspace, records, frames);
  const hopScopes = records.filter((record): record is Extract<HopV55ObservationSupportRecordV1, {recordKind:'hopScope'}> =>
    record.recordKind === 'hopScope' && !hasUnsupportedSuccessor(workspace, record))
    .map(record => ({ id: record.id, supportId: record.supportId, revision: record.revision,
      predecessorReference: record.predecessorReference, reference: record.reference,
      label: record.scope.explanation, scope: clone(record.scope) }));
  const arithmetic = records.filter((record): record is Extract<HopV55ObservationSupportRecordV1, {recordKind:'arithmetic'}> =>
    record.recordKind === 'arithmetic' && !hasUnsupportedSuccessor(workspace, record))
    .map(record => ({ id: record.id, supportId: record.supportId, revision: record.revision,
      predecessorReference: record.predecessorReference, label: arithmeticDisplayLabel(record.contract),
      description: record.contract.explanation, contract: clone(record.contract), reference: record.reference }));
  const stabilities = records.filter((record): record is Extract<HopV55ObservationSupportRecordV1, {recordKind:'stability'}> =>
    record.recordKind === 'stability' && !hasUnsupportedSuccessor(workspace, record))
    .map(record => ({ id: record.id, supportId: record.supportId, revision: record.revision,
      predecessorReference: record.predecessorReference,
      label: record.stability.status === 'adopted' ? 'Stabilité adoptée' : 'Stabilité non établie',
      description: record.stability.explanation, stability: clone(record.stability), reference: record.reference,
      comparisonBinding: clone(record.comparisonBinding) }));
  return { observationDefinitions: definitions.observationDefinitions, dimensions: definitions.dimensions, hopScopes, frames,
    arithmetic, stabilities };
}

function same(left: unknown, right: unknown): boolean {
  return hash('hop-v55-observation-support-comparison-v1', left) === hash('hop-v55-observation-support-comparison-v1', right);
}

function supportRecordsPrefix(workspace: HopV55Workspace): HopV55ObservationSupportRecordV1[] {
  return supportedRecordRows(workspace);
}

function supportRecordByReference(workspace: HopV55Workspace, reference: string): HopV55ObservationSupportRecordV1 | undefined {
  return supportRecordsPrefix(workspace).find(record => record.reference === reference);
}

function predecessorForRecord(workspace: HopV55Workspace, input: Pick<HopV55ObservationSupportRecordV1, 'id' | 'supportId' | 'revision' | 'recordKind' | 'predecessorReference'>): void {
  const rawRows = workspace.observationSupportRecords ?? [];
  const sameId = rawRows.find(raw => object(raw) && raw.id === input.id);
  if (sameId) {
    const read = readHopV55ObservationSupportRecord(sameId);
    if (read.status === 'readOnly' && read.record.reference === (input as HopV55ObservationSupportRecordV1).reference) return;
    throw new Error('Identifiant de record support déjà utilisé avec un autre contenu.');
  }
  const keyRows = rawRows.flatMap(raw => {
    if (!object(raw) || raw.supportId !== input.supportId || raw.recordKind !== input.recordKind) return [];
    const read = readHopV55ObservationSupportRecord(raw);
    if (read.status === 'unsupportedRO') throw new Error('Une révision future de cette déclaration support reste en lecture seule.');
    if (read.status !== 'readOnly') throw new Error('Une ancienne révision de support est illisible.');
    return [read.record];
  }).sort((a, b) => a.revision - b.revision);
  const prior = keyRows.at(-1);
  if (!prior) {
    if (input.revision !== 1 || input.predecessorReference !== null) throw new Error('Une déclaration support nouvelle commence à la révision1.');
  } else if (input.revision !== prior.revision + 1 || input.predecessorReference !== prior.reference) {
    throw new Error('La déclaration support ne prolonge pas son prédécesseur exact.');
  }
}

function exactObservationAnchor(workspace: HopV55Workspace, reference: string) {
  for (const raw of workspace.observationAnchors ?? []) {
    const read = readHopV55ObservationAnchorRecord(raw);
    if (read.status === 'readOnly' && (read.record.recordKind ?? 'observationAnchor') === 'observationAnchor'
      && read.record.anchor?.reference === reference) return read.record;
  }
  return undefined;
}

function exactCurrentPreparation(workspace: HopV55Workspace, reference: string) {
  for (const raw of workspace.observationAnchors ?? []) {
    const read = readHopV55ObservationAnchorRecord(raw);
    if (read.status === 'readOnly' && read.record.recordKind === 'currentPreparation'
      && read.record.preparation.reference === reference && read.record.preparation.status === 'prepared') return read.record;
  }
  return undefined;
}

function assertComparisonBindingInWorkspace(workspace: HopV55Workspace, binding: HopV55ObservationSupportComparisonBindingV1): void {
  if (!exactObservationAnchor(workspace, binding.anchorReference)) throw new Error('Le binding de stabilité ne référence pas une ancre exacte du workspace.');
  if (!exactCurrentPreparation(workspace, binding.currentStateReference)) throw new Error('Le binding de stabilité ne référence pas une préparation courante exacte du workspace.');
  const plans = findAdoptedPlans(workspace);
  if (binding.frameReferences.some(reference => !plans.some(row => row.plan.reference === reference))) {
    throw new Error('Le binding de stabilité contient un cadre absent ou non adopté.');
  }
  const arithmetic = supportRecordByReference(workspace, binding.arithmeticReference);
  if (!arithmetic || arithmetic.recordKind !== 'arithmetic') throw new Error('Le binding de stabilité ne référence pas un contrat arithmétique adopté du support.');
}

export function hopV55ObservationSupportComparisonBindingReference(binding: HopV55ObservationSupportComparisonBindingV1): string {
  if (!validBinding(binding)) throw new Error('Binding de stabilité incomplet.');
  return hash('hop-v55-observation-support-comparison-binding-v1', binding);
}

export function createHopV55ObservationSupportComparisonBinding(input: {
  anchorReference: string;
  currentStateReference: string;
  target: Omit<BrewingObservationTargetRequest, 'current'>;
  frameReferences: string[];
  arithmeticReference: string;
}): HopV55ObservationSupportComparisonBindingV1 {
  const binding: HopV55ObservationSupportComparisonBindingV1 = {
    anchorReference: input.anchorReference,
    currentStateReference: input.currentStateReference,
    targetRequestReference: hash('hop-v55-observation-support-target-v1', input.target),
    frameReferences: [...input.frameReferences],
    arithmeticReference: input.arithmeticReference,
  };
  if (!validBinding(binding)) throw new Error('L’ancre, l’état, la cible, les cadres et l’arithmétique exacts sont requis pour lier une stabilité.');
  return binding;
}

function makeBase(input: HopV55CreateObservationSupportRecordBaseV1, recordKind: HopV55ObservationSupportRecordKind) {
  if (!object(input.workspace) || !text(input.workspace.id) || !text(input.workspace.ownerKey)
    || !text(input.id) || !text(input.supportId) || !Number.isSafeInteger(input.revision) || input.revision < 1
    || !(input.predecessorReference === null || text(input.predecessorReference)) || !iso(input.recordedAt) || !actorValid(input.recordedBy)) {
    throw new Error('Identité, révision, prédécesseur et attribution de support requis.');
  }
  predecessorForRecord(input.workspace, { ...input, recordKind });
  return { format: HOP_V55_OBSERVATION_SUPPORT_RECORD_FORMAT, recordKind, id: input.id, supportId: input.supportId,
    revision: input.revision, predecessorReference: input.predecessorReference,
    workspaceId: input.workspace.id, ownerKey: input.workspace.ownerKey,
    recordedAt: input.recordedAt, recordedBy: clone(input.recordedBy) } as const;
}

function sealRecord(value: Record<string, unknown>): HopV55ObservationSupportRecordV1 {
  const record = { ...value, reference: '' } as unknown as HopV55ObservationSupportRecordV1;
  record.reference = recordReference(record);
  assertRecord(record);
  return clone(record);
}

export function createHopV55ObservationSupportDefinition(input: {
  dimension: BrewingSensoryDimension;
  metric: BrewingSensoryMetric | null;
  scale: BrewingSensoryScale | null;
}): BrewingSensoryDefinitionReference {
  if (input.metric?.kind === 'modelIndex') throw new Error('Un index de modèle ne peut pas devenir un protocole de note par réétiquetage.');
  if (input.metric) assertBrewingSensoryMetric(input.metric);
  return createBrewingSensoryDefinitionReference(input.dimension, input.metric, input.scale);
}

export function createHopV55ObservationSupportProtocolNoteRecord(input: HopV55CreateObservationSupportRecordBaseV1 & {
  definition: BrewingSensoryDefinitionReference;
  meaning: HopV55ObservationSupportMeaning;
}): HopV55ObservationSupportRecordV1 {
  const base = makeBase(input, 'protocolNote');
  if (input.definition.metric?.kind === 'modelIndex' || !validMeaning(input.meaning)) {
    throw new Error('Le protocole doit conserver sa définition exacte et son sens/orientation déclarés; un index modèle ne devient pas note.');
  }
  assertBrewingSensoryDefinitionReference(input.definition);
  return sealRecord({ ...base, definition: clone(input.definition), meaning: clone(input.meaning) });
}

export function createHopV55ObservationSupportHopScopeRecord(input: HopV55CreateObservationSupportRecordBaseV1 & {
  scope: BrewingObservedHopScope;
}): HopV55ObservationSupportRecordV1 {
  const base = makeBase(input, 'hopScope');
  if (!validScope(input.scope)) throw new Error('Portée houblon invalide. La déclaration de portée n’atteste pas sa couverture.');
  return sealRecord({ ...base, scope: clone(input.scope) });
}

export function createHopV55ObservationSupportArithmeticRecord(input: HopV55CreateObservationSupportRecordBaseV1 & {
  contract: BrewingObservationArithmeticContract;
}): HopV55ObservationSupportRecordV1 {
  const base = makeBase(input, 'arithmetic');
  assertBrewingObservationArithmeticContract(input.contract);
  return sealRecord({ ...base, contract: clone(input.contract) });
}

export function createHopV55ObservationSupportStabilityRecord(input: HopV55CreateObservationSupportRecordBaseV1 & {
  stability: BrewingObservationRestStability;
  comparisonBinding: HopV55ObservationSupportComparisonBindingV1;
}): HopV55ObservationSupportRecordV1 {
  const base = makeBase(input, 'stability');
  if (!validRestStability(input.stability) || !validBinding(input.comparisonBinding)) throw new Error('La stabilité de comparaison et son binding exact sont requis.');
  assertComparisonBindingInWorkspace(input.workspace, input.comparisonBinding);
  return sealRecord({ ...base, stability: clone(input.stability), comparisonBinding: clone(input.comparisonBinding) });
}

function unsupportedSupportReference(workspace: HopV55Workspace, reference: string): { snapshot: unknown; reason: string } | undefined {
  const supported = supportedRecordRows(workspace);
  const selected = supported.find(record => record.reference === reference
    || record.recordKind === 'protocolNote' && record.definition.contentReference === reference);
  for (const raw of workspace.observationSupportRecords ?? []) {
    const read = readHopV55ObservationSupportRecord(raw);
    const futureRevision = read.status === 'unsupportedRO' && selected && object(raw)
      && raw.recordKind === selected.recordKind && raw.supportId === selected.supportId
      && Number.isSafeInteger(raw.revision) && (raw.revision as number) > selected.revision;
    if (read.status === 'unsupportedRO' && object(raw)
      && (raw.reference === reference || raw.id === reference || raw.predecessorReference === selected?.reference || futureRevision)) {
      return { snapshot: clone(read.snapshot), reason: read.reason };
    }
  }
  return undefined;
}

function hasUnsupportedSuccessor(workspace: HopV55Workspace, record: HopV55ObservationSupportRecordV1): boolean {
  return (workspace.observationSupportRecords ?? []).some(raw => {
    const read = readHopV55ObservationSupportRecord(raw);
    return read.status === 'unsupportedRO' && object(raw) && raw.recordKind === record.recordKind
      && raw.supportId === record.supportId && Number.isSafeInteger(raw.revision) && (raw.revision as number) > record.revision;
  });
}

function matchingArithmeticDefinition(contract: BrewingObservationArithmeticContract, dimension: BrewingSensoryDefinitionReference): boolean {
  if (contract.definition.contentReference === dimension.contentReference) return true;
  return contract.unitBridge?.sourceDefinition.contentReference === dimension.contentReference
    && contract.definition.dimensionReference === dimension.dimensionReference;
}

function assertSelectionLinks(workspace: HopV55Workspace, selection: HopV55ObservationSupportSelectionV1): void {
  const records = supportedRecordRows(workspace);
  const choiceSet = buildChoices(workspace, records);
  const dimension = choiceSet.dimensions.find(row => row.reference === selection.dimensionReference);
  if (!dimension) {
    const future = unsupportedSupportReference(workspace, selection.dimensionReference);
    if (future) throw new Error(`La définition sélectionnée est dans un format futur : ${future.reason}`);
    throw new Error('La sélection de dimension doit pointer vers une définition exacte conservée.');
  }
  const scope = records.find((row): row is Extract<HopV55ObservationSupportRecordV1, {recordKind:'hopScope'}> =>
    row.reference === selection.hopScopeReference && row.recordKind === 'hopScope');
  if (!scope) {
    const future = unsupportedSupportReference(workspace, selection.hopScopeReference);
    if (future) throw new Error(`La portée sélectionnée est dans un format futur : ${future.reason}`);
    throw new Error('La sélection doit pointer vers une portée houblon exacte conservée.');
  }
  const planRefs = new Set(choiceSet.frames.map(row => row.plan.reference));
  if (selection.frameReferences.some(reference => !planRefs.has(reference))) {
    throw new Error('Chaque cadre sélectionné doit être une version exacte adoptée, issue du registre ou d’une nuance archivée.');
  }
  let arithmetic: Extract<HopV55ObservationSupportRecordV1, {recordKind:'arithmetic'}> | undefined;
  if (selection.arithmeticReference !== null) {
    const raw = records.find(row => row.reference === selection.arithmeticReference);
    if (!raw) {
      const future = unsupportedSupportReference(workspace, selection.arithmeticReference);
      if (future) throw new Error(`Le contrat arithmétique sélectionné est dans un format futur : ${future.reason}`);
      throw new Error('Le contrat arithmétique sélectionné est absent ou périmé.');
    }
    if (raw.recordKind !== 'arithmetic') throw new Error('La référence arithmétique ne désigne pas un record d’arithmétique.');
    if (!matchingArithmeticDefinition(raw.contract, dimension.definition)) {
      throw new Error('Le contrat arithmétique ne porte pas sur la définition sensorielle sélectionnée.');
    }
    arithmetic = raw;
  }
}

export function appendHopV55ObservationSupportRecord(
  workspace: HopV55Workspace,
  recordValue: HopV55ObservationSupportRecordV1,
): HopV55Workspace {
  const read = readHopV55ObservationSupportRecord(recordValue);
  if (read.status === 'unsupportedRO') throw new Error('Un record support futur reste en lecture seule.');
  if (read.status !== 'readOnly') throw new Error(read.reason);
  const record = read.record;
  workspaceIdentity(workspace, record);
  const existing = (workspace.observationSupportRecords ?? []).find(row => object(row) && row.id === record.id);
  if (existing) {
    const prior = readHopV55ObservationSupportRecord(existing);
    if (prior.status === 'readOnly' && prior.record.reference === record.reference) return clone(workspace);
    throw new Error('L’identifiant de record support est déjà utilisé avec un autre contenu.');
  }
  const next = clone(workspace);
  next.observationSupportRecords = [...(next.observationSupportRecords ?? []).map(clone), clone(record)];
  assertHopV55ObservationSupportCollections(next);
  return next;
}

function createSelection(workspace: HopV55Workspace, input: HopV55ObservationSupportSelectionInputV1): HopV55ObservationSupportSelectionV1 {
  if (!text(input.id) || !iso(input.recordedAt) || !actorValid(input.recordedBy) || !text(input.dimensionReference)
    || !text(input.hopScopeReference) || !Array.isArray(input.frameReferences) || input.frameReferences.some(row => !text(row))
    || new Set(input.frameReferences).size !== input.frameReferences.length
    || !(input.arithmeticReference === null || text(input.arithmeticReference))) {
    throw new Error('Identité, dimension, portée, cadre(s) ou arithmétique de sélection invalides.');
  }
  const rawRows = workspace.observationSupportSelections ?? [];
  const latestRaw = rawRows.at(-1);
  if (latestRaw !== undefined) {
    const latest = readHopV55ObservationSupportSelection(latestRaw);
    if (latest.status === 'unsupportedRO') throw new Error('La sélection active est dans un format futur; aucune sélection précédente ne la remplace.');
    if (latest.status !== 'readOnly') throw new Error(latest.reason);
  }
  const prior = latestRaw === undefined ? undefined : (readHopV55ObservationSupportSelection(latestRaw) as {status:'readOnly';selection:HopV55ObservationSupportSelectionV1}).selection;
  const base = {
    format: HOP_V55_OBSERVATION_SUPPORT_SELECTION_FORMAT,
    id: input.id,
    revision: prior ? prior.revision + 1 : 1,
    predecessorReference: prior?.reference ?? null,
    workspaceId: workspace.id,
    ownerKey: workspace.ownerKey,
    recordedAt: input.recordedAt,
    recordedBy: clone(input.recordedBy),
    dimensionReference: input.dimensionReference,
    hopScopeReference: input.hopScopeReference,
    frameReferences: clone(input.frameReferences),
    arithmeticReference: input.arithmeticReference,
  } satisfies Omit<HopV55ObservationSupportSelectionV1, 'reference'>;
  const selection = { ...base, reference: selectionReference(base) };
  assertSelection(selection);
  assertSelectionLinks(workspace, selection);
  return selection;
}

export function appendHopV55ObservationSupportSelection(
  workspace: HopV55Workspace,
  selectionValue: HopV55ObservationSupportSelectionV1,
): HopV55Workspace {
  const read = readHopV55ObservationSupportSelection(selectionValue);
  if (read.status === 'unsupportedRO') throw new Error('Une sélection support future reste en lecture seule.');
  if (read.status !== 'readOnly') throw new Error(read.reason);
  const selection = read.selection;
  if (selection.workspaceId !== workspace.id || selection.ownerKey !== workspace.ownerKey) throw new Error('La sélection support appartient à un autre workspace/owner.');
  const prior = workspace.observationSupportSelections?.at(-1);
  if (prior) {
    const priorRead = readHopV55ObservationSupportSelection(prior);
    if (priorRead.status !== 'readOnly' || selection.predecessorReference !== priorRead.selection.reference
      || selection.revision !== priorRead.selection.revision + 1) throw new Error('La sélection ne prolonge pas exactement la version active précédente.');
  } else if (selection.revision !== 1 || selection.predecessorReference !== null) {
    throw new Error('La première sélection support doit être v1 sans prédécesseur.');
  }
  if (workspace.observationSupportSelections?.some(row => object(row) && row.id === selection.id)) {
    const existing = workspace.observationSupportSelections.find(row => object(row) && row.id === selection.id);
    const existingRead = readHopV55ObservationSupportSelection(existing);
    if (existingRead.status === 'readOnly' && existingRead.selection.reference === selection.reference) return clone(workspace);
    throw new Error('ID de sélection déjà utilisé avec un autre contenu.');
  }
  assertSelectionLinks(workspace, selection);
  const next = clone(workspace);
  next.observationSupportSelections = [...(next.observationSupportSelections ?? []).map(clone), clone(selection)];
  assertHopV55ObservationSupportCollections(next);
  return next;
}

export function selectHopV55ObservationSupport(workspace: HopV55Workspace, input: HopV55ObservationSupportSelectionInputV1): HopV55Workspace {
  const selection = createSelection(workspace, input);
  return appendHopV55ObservationSupportSelection(workspace, selection);
}

function latestSelection(workspace: HopV55Workspace): HopV55ObservationSupportSelectionRead | null {
  const raw = workspace.observationSupportSelections?.at(-1);
  return raw === undefined ? null : readHopV55ObservationSupportSelection(raw);
}

function resolveCurrentSelection(workspace: HopV55Workspace, selection: HopV55ObservationSupportSelectionV1,
  choices: HopV55ObservationSupportChoicesV1): HopV55ObservationSupportResolutionV1 {
  const dimension = choices.dimensions.find(row => row.reference === selection.dimensionReference);
  const scope = choices.hopScopes.find(row => row.reference === selection.hopScopeReference);
  const missing: string[] = [];
  if (!dimension) missing.push('La définition sensorielle exacte de la sélection est absente; choisis une définition conservée.');
  if (!scope) missing.push('La portée houblon exacte de la sélection est absente; déclare ou choisis une portée.');
  const adoptedByReference = new Map(choices.frames.map(row => [row.plan.reference, row]));
  const adoptedFrames = selection.frameReferences.flatMap(reference => {
    const frame = adoptedByReference.get(reference);
    if (!frame) missing.push(`Le cadre ${reference} n’est plus disponible sous sa référence exacte.`);
    return frame ? [clone(frame)] : [];
  });
  let selectedArithmetic: HopV55ObservationSupportArithmeticRecordV1 | undefined;
  if (selection.arithmeticReference !== null) {
    const row = choices.arithmetic.find(choice => choice.reference === selection.arithmeticReference);
    if (!row) missing.push('Le contrat arithmétique sélectionné est absent; le support ne choisit pas un autre contrat.');
    else {
      const raw = supportRecordByReference(workspace, row.reference);
      if (raw?.recordKind === 'arithmetic' && dimension && matchingArithmeticDefinition(raw.contract, dimension.definition)) selectedArithmetic = raw;
      else missing.push('Le contrat arithmétique ne correspond plus à la définition exacte sélectionnée.');
    }
  }
  const notices: string[] = [];
  if (!dimension || !scope) {
    return { status: 'needsSetup', missing: missing.length ? missing : ['Choisir une dimension exacte et une portée houblon.'],
      selection, choices };
  }
  const support: HopV55ObservationWorkbenchSupportV1 = {
    requestedDimension: { status: 'resolved', definition: clone(dimension.definition) },
    hopScope: clone(scope.scope), adoptedFrames,
    arithmeticChoices: selectedArithmetic ? [{ id: selectedArithmetic.id, supportId: selectedArithmetic.supportId,
      revision: selectedArithmetic.revision, predecessorReference: selectedArithmetic.predecessorReference,
      label: arithmeticDisplayLabel(selectedArithmetic.contract), description: selectedArithmetic.contract.explanation,
      contract: clone(selectedArithmetic.contract), reference: selectedArithmetic.reference }] : [],
    stabilityProposals: clone(choices.stabilities),
    observationDefinitions: clone(choices.observationDefinitions),
  };
  if (missing.length) return { status: 'needsSetup', missing, selection, support, choices };
  return { status: 'ready', support, selection, choices, notices };
}

/** Resolves exact host support without prediction, projection, or automatic adoption. */
export function resolveHopV55ObservationSupport(input: { workspace: HopV55Workspace }): HopV55ObservationSupportResolutionV1 {
  let records: HopV55ObservationSupportRecordV1[];
  let choices: HopV55ObservationSupportChoicesV1;
  try {
    records = supportRecordsPrefix(input.workspace);
    choices = buildChoices(input.workspace, records);
  } catch (error) {
    return { status: 'needsSetup', missing: [error instanceof Error ? error.message : 'Le support du workspace est illisible.'],
      choices: { observationDefinitions: [], dimensions: [], hopScopes: [], frames: [], arithmetic: [], stabilities: [] } };
  }
  const active = latestSelection(input.workspace);
  if (!active) return { status: 'needsSetup', missing: ['Choisir une définition sensorielle et une portée houblon pour ce workspace.'], choices };
  if (active.status === 'unsupportedRO') return { status: 'unsupportedRO', reason: active.reason, snapshot: clone(active.snapshot), choices };
  if (active.status !== 'readOnly') return { status: 'needsSetup', missing: [active.reason], choices };
  for (const reference of [active.selection.dimensionReference, active.selection.hopScopeReference,
    ...(active.selection.arithmeticReference ? [active.selection.arithmeticReference] : [])]) {
    const future = unsupportedSupportReference(input.workspace, reference);
    if (future) return { status: 'unsupportedRO', reason: future.reason, snapshot: clone(future.snapshot), choices };
  }
  try {
    return resolveCurrentSelection(input.workspace, active.selection, choices);
  } catch (error) {
    return { status: 'needsSetup', missing: [error instanceof Error ? error.message : 'La sélection de support doit être relue.'],
      selection: active.selection, choices };
  }
}

export type HopV55ObservationStabilityResolutionV1 =
  | { status: 'ready'; record: HopV55ObservationSupportStabilityRecordV1 }
  | { status: 'needsSetup'; reason: string }
  | { status: 'unsupportedRO'; reason: string; snapshot: unknown };

/** A stability record is usable only for the exact comparison binding passed by the question editor. */
export function resolveHopV55ObservationStabilityForComparison(input: {
  workspace: HopV55Workspace;
  recordReference: string;
  comparisonBinding: HopV55ObservationSupportComparisonBindingV1;
}): HopV55ObservationStabilityResolutionV1 {
  if (!text(input.recordReference) || !validBinding(input.comparisonBinding)) {
    return { status: 'needsSetup', reason: 'Référence et binding exacts de comparaison requis.' };
  }
  const raw = (input.workspace.observationSupportRecords ?? []).find(row => object(row)
    && (row.reference === input.recordReference || row.id === input.recordReference));
  if (!raw) return { status: 'needsSetup', reason: 'La proposition de stabilité n’existe plus dans le registre du workspace.' };
  const future = unsupportedSupportReference(input.workspace, input.recordReference);
  if (future) return { status: 'unsupportedRO', reason: future.reason, snapshot: clone(future.snapshot) };
  const read = readHopV55ObservationSupportRecord(raw);
  if (read.status === 'unsupportedRO') return { status: 'unsupportedRO', reason: read.reason, snapshot: clone(read.snapshot) };
  if (read.status !== 'readOnly') return { status: 'needsSetup', reason: read.reason };
  if (read.record.recordKind !== 'stability') return { status: 'needsSetup', reason: 'La référence ne désigne pas un record de stabilité.' };
  if (read.record.workspaceId !== input.workspace.id || read.record.ownerKey !== input.workspace.ownerKey) {
    return { status: 'needsSetup', reason: 'La stabilité appartient à un autre owner ou workspace.' };
  }
  try { assertComparisonBindingInWorkspace(input.workspace, read.record.comparisonBinding); }
  catch (error) { return { status: 'needsSetup', reason: error instanceof Error ? error.message : 'Le binding historique est périmé.' }; }
  if (!same(read.record.comparisonBinding, input.comparisonBinding)) {
    return { status: 'needsSetup', reason: 'La stabilité a été déclarée pour une autre ancre, un autre état, une autre cible, un autre cadre ou une autre arithmétique.' };
  }
  return { status: 'ready', record: clone(read.record) };
}

export function assertHopV55ObservationSupportCollections(value: unknown): void {
  if (!object(value) || !text(value.id) || !text(value.ownerKey)) throw new Error('Workspace absent pour ses registres de support.');
  const recordRows = value.observationSupportRecords;
  if (recordRows !== undefined && !Array.isArray(recordRows)) throw new Error('Le registre observationSupportRecords doit être une liste append-only.');
  const selectionRows = value.observationSupportSelections;
  if (selectionRows !== undefined && !Array.isArray(selectionRows)) throw new Error('Le registre observationSupportSelections doit être une liste append-only.');

  const ids = new Set<string>(), refs = new Set<string>();
  const chains = new Map<string, { revision: number; reference: string }>();
  const futureChains = new Set<string>();
  for (const raw of (recordRows ?? []) as unknown[]) {
    const read = readHopV55ObservationSupportRecord(raw);
    if (read.status === 'invalid') throw new Error(read.reason);
    if (read.status === 'unsupportedRO') {
      if (object(read.snapshot) && (read.snapshot.workspaceId !== undefined && read.snapshot.workspaceId !== value.id
        || read.snapshot.ownerKey !== undefined && read.snapshot.ownerKey !== value.ownerKey)) throw new Error('Record support futur attribué à un autre workspace ou owner.');
      if (object(read.snapshot) && text(read.snapshot.recordKind) && text(read.snapshot.supportId)) {
        futureChains.add(`${read.snapshot.recordKind}\0${read.snapshot.supportId}`);
      }
      continue;
    }
    const row = read.record;
    if (row.workspaceId !== value.id || row.ownerKey !== value.ownerKey) throw new Error('Record support attribué à un autre workspace ou owner.');
    const key = `${row.recordKind}\0${row.supportId}`;
    if (futureChains.has(key)) throw new Error('Une déclaration support future reste opaque; aucune version actuelle ne la remplace.');
    if (row.recordKind === 'stability') assertComparisonBindingInWorkspace(value as unknown as HopV55Workspace, row.comparisonBinding);
    if (ids.has(row.id) || refs.has(row.reference)) throw new Error('ID ou empreinte de record support dupliqué.');
    ids.add(row.id); refs.add(row.reference);
    const prior = chains.get(key);
    if (!prior) {
      if (row.revision !== 1 || row.predecessorReference !== null) throw new Error('La chaîne support ne commence pas à la révision1.');
    } else if (row.revision !== prior.revision + 1 || row.predecessorReference !== prior.reference) {
      throw new Error('La chaîne support ne prolonge pas la version précédente exacte.');
    }
    chains.set(key, { revision: row.revision, reference: row.reference });
  }
  const selectionIds = new Set<string>(), selectionRefs = new Set<string>();
  let priorSelection: HopV55ObservationSupportSelectionV1 | undefined;
  let unsupportedSelectionSeen = false;
  for (const raw of (selectionRows ?? []) as unknown[]) {
    const read = readHopV55ObservationSupportSelection(raw);
    if (read.status === 'invalid') throw new Error(read.reason);
    if (read.status === 'unsupportedRO') {
      if (object(read.snapshot) && (read.snapshot.workspaceId !== undefined && read.snapshot.workspaceId !== value.id
        || read.snapshot.ownerKey !== undefined && read.snapshot.ownerKey !== value.ownerKey)) throw new Error('Sélection support future attribuée à un autre workspace ou owner.');
      priorSelection = undefined;
      unsupportedSelectionSeen = true;
      continue;
    }
    const row = read.selection;
    if (unsupportedSelectionSeen) throw new Error('Une sélection future reste opaque; aucune sélection actuelle ne la remplace.');
    if (row.workspaceId !== value.id || row.ownerKey !== value.ownerKey) throw new Error('Sélection support attribuée à un autre workspace ou owner.');
    if (selectionIds.has(row.id) || selectionRefs.has(row.reference)) throw new Error('ID ou empreinte de sélection support dupliqué.');
    if (!priorSelection) {
      if (row.revision !== 1 || row.predecessorReference !== null) throw new Error('La sélection support ne commence pas à la révision1.');
    } else if (row.revision !== priorSelection.revision + 1 || row.predecessorReference !== priorSelection.reference) {
      throw new Error('La sélection support ne prolonge pas la version active précédente exacte.');
    }
    assertSelectionLinks(value as unknown as HopV55Workspace, row);
    selectionIds.add(row.id); selectionRefs.add(row.reference); priorSelection = row;
  }
}

export function assertHopV55ObservationSupportAppendOnly(previous: HopV55Workspace, next: HopV55Workspace): void {
  for (const [field, reader] of [
    ['observationSupportRecords', readHopV55ObservationSupportRecord],
    ['observationSupportSelections', readHopV55ObservationSupportSelection],
  ] as const) {
    const priorRows = previous[field] ?? [];
    const nextRows = next[field] ?? [];
    if (nextRows.length < priorRows.length || priorRows.some((row, index) => hash('hop-v55-observation-support-prefix-v1', row)
      !== hash('hop-v55-observation-support-prefix-v1', nextRows[index]))) {
      throw new Error(`Les versions ${field} sont immuables et append-only.`);
    }
    for (const row of nextRows.slice(priorRows.length)) {
      const read = reader(row);
      if (read.status !== 'readOnly') throw new Error(`Un nouvel élément ${field} doit utiliser son format support courant.`);
    }
  }
  assertHopV55ObservationSupportCollections(next);
}
