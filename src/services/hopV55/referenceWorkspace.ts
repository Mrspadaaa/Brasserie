import type { BrewerContext } from '../../../functions/src/companionTypes';
import {
  applyBrewingReferenceCommand,
  brewingReferenceVersionContentReference,
  getBrewingReferenceProjection,
  openBrewingReferenceContext,
  readBrewingReferenceRecord,
  type BrewingReferenceCommandInput,
  type BrewingReferenceContextV1,
  type BrewingReferenceEvent,
  type BrewingReferenceIdentityV1,
  type BrewingReferenceProjectionV1,
  type BrewingReferenceReadResult,
  type BrewingReferenceRecordV1,
  type BrewingReferenceVersionV1,
  type JsonValue,
} from '../../domain/brewingReference';
import { BREWING_SCENARIO_VERSION, assertBrewingScenarioRequest, type BrewingScenarioRequest, type BrewingScenarioResult } from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { programFingerprint } from '../../domain/hopDecision/programs';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { createBrewingSensoryDefinitionReference, type BrewingSensoryDefinitionReference, type BrewingSensoryDimension, type BrewingSensoryMetric, type BrewingSensoryScale } from '../../domain/brewingSensory';
import type { HopAxis } from '../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import type { HopV55ReferenceJournal, HopV55Workspace } from './contracts';

export type HopV55ReferenceJournalRead =
  | { status: 'absent' }
  | { status: 'unsupportedFormat'; read: Extract<BrewingReferenceReadResult, { status: 'unsupportedFormat' }> }
  | { status: 'available'; read: Extract<BrewingReferenceReadResult, { record: BrewingReferenceRecordV1 }> };

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isoDate = (value: unknown): value is string => text(value)
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value));
const clone = <T>(value: T): T => structuredClone(value);

/** Stable identity keeps each workspace's reference ledger inside that workspace's CAS partition. */
export function hopV55ReferenceContextId(workspaceId: string): string {
  if (!text(workspaceId) || workspaceId.trim() !== workspaceId) throw new Error('Identifiant de workspace invalide pour le contexte de référence.');
  return `hop-v55:${workspaceId}`;
}

function assertJournalShape(value: unknown): asserts value is HopV55ReferenceJournal {
  if (!object(value) || Object.keys(value).some(key => key !== 'record' && key !== 'events') || !Array.isArray(value.events)) {
    throw new Error('Journal de référence workspace mal formé.');
  }
}

function assertWorkspaceJournalIdentity(workspace: HopV55Workspace, journal: HopV55ReferenceJournal, read: BrewingReferenceReadResult): void {
  const expectedContextId = hopV55ReferenceContextId(workspace.id);
  const record = journal.record as unknown;
  if (!object(record) || record.ownerKey !== workspace.ownerKey || record.contextId !== expectedContextId) {
    throw new Error('Le journal de référence appartient à un autre ownerKey ou contextId.');
  }
  // A future event stays opaque and read-only, but any identity fields it still
  // exposes must remain in this workspace's partition.
  if ('status' in read) {
    for (const event of journal.events) {
      if (!object(event)) continue;
      if (event.ownerKey !== undefined && event.ownerKey !== workspace.ownerKey
        || event.contextId !== undefined && event.contextId !== expectedContextId) {
        throw new Error('Un événement futur de référence pointe vers un autre ownerKey ou contextId.');
      }
    }
  }
}

/** Validates journal hashes and replay without translating future formats. */
export function readHopV55ReferenceJournal(workspace: HopV55Workspace): HopV55ReferenceJournalRead {
  const journal = workspace.referenceJournal;
  if (journal === undefined) return { status: 'absent' };
  assertJournalShape(journal);
  const read = readBrewingReferenceRecord(journal.record, journal.events);
  assertWorkspaceJournalIdentity(workspace, journal, read);
  if ('status' in read) return { status: 'unsupportedFormat', read };
  return { status: 'available', read };
}

function jsonValue(value: unknown, path = 'contenu', inArray = false): JsonValue | undefined {
  if (value === undefined) {
    if (inArray) throw new Error(`${path} contient une valeur non JSON dans un tableau.`);
    return undefined;
  }
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} contient un nombre non fini.`);
    return value;
  }
  if (Array.isArray(value)) return value.map((item, index) => jsonValue(item, `${path}[${index}]`, true) ?? null);
  if (!object(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${path} n’est pas un objet JSON pur.`);
  const result: Record<string, JsonValue> = {};
  for (const [key, child] of Object.entries(value)) {
    const parsed = jsonValue(child, `${path}.${key}`);
    if (parsed !== undefined) result[key] = parsed;
  }
  return result;
}

function baselineFromUnknown(value: unknown): BrewingScenarioRequest['baseline'] | undefined {
  if (!object(value) || (value.kind !== 'recipe' && value.kind !== 'hypothetical')) return undefined;
  try {
    assertBrewingScenarioRequest({ version: BREWING_SCENARIO_VERSION, scenarioId: 'hop-v55-reference-baseline', revision: 0,
      baseline: clone(value), assumptions: [], branches: [] });
    return clone(value) as BrewingScenarioRequest['baseline'];
  } catch { return undefined; }
}

function currentProgramReference(prepared: PreparedBrewingScenarioContext): BrewingReferenceContextV1['programReference'] {
  const program = prepared.binding?.program ?? prepared.runtime.current?.program ?? null;
  return program ? { id: program.id, contentReference: programFingerprint(program) } : null;
}

/** Freezes real model axes as model-index scales; these definitions are never
 * represented as ordinal human ratings. Matching lexemes are copied only from
 * an extrapolation axis with the exact same identity and version. */
export function getHopV55ReferenceDefinitions(prepared: PreparedBrewingScenarioContext): BrewingSensoryDefinitionReference[] {
  const axes = prepared.runtime.engineData.knowledge.filter((row): row is HopAxis => row.kind === 'axis');
  const extrapolations = prepared.runtime.engineData.knowledge.filter((row): row is HopExtrapolation => row.kind === 'extrapolation');
  const byIdentity = new Map<string, BrewingSensoryDefinitionReference>();
  for (const axis of axes) {
    const key = `${axis.id}\0${axis.version}`;
    const modelAxes = extrapolations.flatMap(model => model.axes.map(candidate => ({ candidate, source: model.source })))
      .filter(row => row.candidate.id === axis.id && row.candidate.version === axis.version);
    const termSets = new Set(modelAxes.map(row => JSON.stringify(row.candidate.terms)));
    const modelAxis = termSets.size === 1 ? modelAxes[0] : undefined;
    const suffix = hopAdviceContentReference('hop-v55-model-axis-identity-v1', { id: axis.id, version: axis.version }).slice(-24);
    const metricId = `hop-model-axis-${suffix}`;
    const dimension: BrewingSensoryDimension = {
      id: axis.id,
      version: axis.version,
      name: axis.name,
      definition: axis.description,
      sourceRefs: [clone(axis.source), ...(modelAxis ? [clone(modelAxis.source)] : [])],
      ...(modelAxis?.candidate.terms.length ? { terms: [...modelAxis.candidate.terms] } : {}),
    };
    const metric: BrewingSensoryMetric = {
      id: metricId,
      version: axis.version,
      kind: 'modelIndex',
      name: axis.name,
      meaning: 'Indice du modèle sur cette définition, pas note observée.',
      unit: 'axisScale',
      sourceRefs: [clone(axis.source)],
    };
    const scale: BrewingSensoryScale = {
      id: `hop-model-scale-${suffix}`,
      version: axis.version,
      metricRef: { id: metric.id, version: metric.version },
      domain: clone(axis.scale),
      sourceRefs: [clone(axis.source)],
    };
    const definition = createBrewingSensoryDefinitionReference(dimension, metric, scale);
    const prior = byIdentity.get(key);
    if (prior && prior.contentReference !== definition.contentReference) throw new Error(`Axe de référence ${axis.id}@${axis.version} chargé avec deux contenus.`);
    byIdentity.set(key, definition);
  }
  return [...byIdentity.values()];
}

function performedAdditionIds(context: BrewerContext, prepared: PreparedBrewingScenarioContext): string[] {
  const ids = new Set(prepared.runtime.current?.performedAdditionIds ?? []);
  const additions = context.journal?.additions;
  if (object(additions)) {
    for (const [key, value] of Object.entries(additions)) {
      if (!object(value) || typeof value.doneAt !== 'number' || !Number.isFinite(value.doneAt)) continue;
      const match = /^hop-(\d+)$/.exec(key);
      ids.add(match ? `recipe-hop:${Number(match[1])}` : key);
    }
  }
  return [...ids];
}

function pastForContext(context: BrewerContext, prepared: PreparedBrewingScenarioContext): BrewingReferenceContextV1['past'] {
  const ids = performedAdditionIds(context, prepared);
  if (ids.length) {
    const additions = prepared.runtime.current?.input.additions ?? [];
    const sourceReference = prepared.runtime.current?.recipeReference;
    return { status: 'partial', knownAdditions: ids.map(id => {
      const addition = additions.find(row => row.id === id);
      return { id, label: addition?.name ?? id, ...(sourceReference ? { reference: sourceReference } : {}) };
    }) };
  }
  const hasStarted = Number.isFinite(context.journal?.startedAt) || Number.isFinite(context.journal?.pitchedAt);
  const beforeBrew = !hasStarted && (context.batch?.status === 'planifie' || !context.batch && !!context.recipe);
  return beforeBrew ? { status: 'declaredComplete', additions: [] } : { status: 'unknown' };
}

function referenceContext(context: BrewerContext, prepared: PreparedBrewingScenarioContext): BrewingReferenceContextV1 {
  return {
    programReference: currentProgramReference(prepared),
    past: pastForContext(context, prepared),
    details: {
      phase: prepared.runtime.current?.program?.stage ?? context.phase ?? null,
      recipeId: typeof context.recipe?.id === 'string' ? context.recipe.id : null,
      batchId: typeof context.batch?.id === 'string' ? context.batch.id : null,
      recipeReference: prepared.runtime.current?.recipeReference ?? null,
      inputReference: prepared.runtime.current?.inputReference ?? null,
    },
  };
}

function referenceVersion(workspace: HopV55Workspace, hypothesis: HopV55Workspace['referenceHypotheses'][number],
  predecessor: BrewingReferenceIdentityV1 | null, context: BrewerContext, prepared: PreparedBrewingScenarioContext,
  sensoryDefinitions: BrewingSensoryDefinitionReference[], explicitReferenceVersion?: string): BrewingReferenceVersionV1 {
  if (!text(hypothesis.id) || !Number.isSafeInteger(hypothesis.version) || hypothesis.version < 1 || !text(hypothesis.label) || !isoDate(hypothesis.recordedAt)) {
    throw new Error('Hypothèse legacy sans identité, version, libellé ou date exploitable; elle reste conservée sans conversion.');
  }
  if (explicitReferenceVersion !== undefined && !text(explicitReferenceVersion)) {
    throw new Error('La version de référence explicite doit être un texte non vide.');
  }
  const baseline = baselineFromUnknown(hypothesis.baseline);
  if (!baseline) throw new Error(`Baseline de l’hypothèse ${hypothesis.id} invalide; aucune conversion avec perte n’est faite.`);
  const jsonBaseline = jsonValue(baseline, `baseline ${hypothesis.id}`);
  if (!jsonBaseline || Array.isArray(jsonBaseline) || typeof jsonBaseline !== 'object') throw new Error('Baseline de référence non sérialisable en JSON.');
  const content = { label: hypothesis.label, baseline: jsonBaseline };
  const body = {
    id: hypothesis.id,
    version: explicitReferenceVersion === undefined ? String(hypothesis.version) : explicitReferenceVersion,
    origin: { kind: 'userHypothesis', description: 'Hypothèse explicitement adoptée par le brasseur.' },
    hypotheses: [],
    context: {
      workspaceId: workspace.id,
      ...referenceContext(context, prepared).details,
    } as Record<string, JsonValue>,
    author: { id: workspace.ownerKey, label: 'Brasseur' },
    createdAt: hypothesis.recordedAt,
    predecessor: predecessor ? clone(predecessor) : null,
    sensoryDefinitions: clone(sensoryDefinitions),
    content,
  };
  return { ...body, contentReference: brewingReferenceVersionContentReference(body) };
}

function sameReferencePayload(left: unknown, right: unknown): boolean {
  try { return hopAdviceContentReference('hop-v55-legacy-reference-equality-v1', left)
    === hopAdviceContentReference('hop-v55-legacy-reference-equality-v1', right); }
  catch { return false; }
}

function referenceCommandVersionSuffix(hypothesis: HopV55Workspace['referenceHypotheses'][number], explicitReferenceVersion?: string): string {
  if (explicitReferenceVersion === undefined) return `v${hypothesis.version}`;
  return `nr-${hopAdviceContentReference('hop-v55-explicit-reference-version-command-v1', {
    id: hypothesis.id, wrapperVersion: hypothesis.version, referenceVersion: explicitReferenceVersion,
  })}`;
}

function appendAdoption(workspace: HopV55Workspace, journal: HopV55ReferenceJournal,
  hypothesis: HopV55Workspace['referenceHypotheses'][number], identity: BrewingReferenceIdentityV1,
  explicitReferenceVersion?: string): HopV55ReferenceJournal {
  return applyToJournal(workspace, journal, commandAt(workspace, journal, {
    commandId: `reference-adopt:${hypothesis.id}:${referenceCommandVersionSuffix(hypothesis, explicitReferenceVersion)}`,
    recordedAt: hypothesis.recordedAt,
    kind: 'referenceAdopted',
    payload: { reference: clone(identity), adoptedBy: { id: workspace.ownerKey, label: 'Brasseur' } },
  }));
}

function applyToJournal(
  workspace: HopV55Workspace,
  journal: HopV55ReferenceJournal,
  command: BrewingReferenceCommandInput,
): HopV55ReferenceJournal {
  const read = readBrewingReferenceRecord(journal.record, journal.events);
  if ('status' in read) throw new Error('Le journal de référence est en format futur; il reste en lecture seule.');
  assertWorkspaceJournalIdentity(workspace, journal, read);
  const applied = applyBrewingReferenceCommand(read.record, command, read.events);
  if (applied.duplicate) return { record: clone(applied.record), events: clone(journal.events) };
  return { record: clone(applied.record), events: [...clone(journal.events), clone(applied.event)] };
}

function commandAt(workspace: HopV55Workspace, journal: HopV55ReferenceJournal, input: Omit<BrewingReferenceCommandInput, 'ownerKey' | 'contextId' | 'expectedRevision'>): BrewingReferenceCommandInput {
  const read = readBrewingReferenceRecord(journal.record, journal.events);
  if ('status' in read) throw new Error('Le journal de référence est en format futur; aucune nouvelle commande n’est autorisée.');
  assertWorkspaceJournalIdentity(workspace, journal, read);
  return { ...clone(input), ownerKey: workspace.ownerKey, contextId: hopV55ReferenceContextId(workspace.id), expectedRevision: read.record.revision } as BrewingReferenceCommandInput;
}

function appendHypothesis(workspace: HopV55Workspace, journal: HopV55ReferenceJournal,
  hypothesis: HopV55Workspace['referenceHypotheses'][number], context: BrewerContext, prepared: PreparedBrewingScenarioContext,
  options: { legacyConversion: boolean; referenceVersion?: string } = { legacyConversion: false }): HopV55ReferenceJournal {
  const current = readBrewingReferenceRecord(journal.record, journal.events);
  if ('status' in current) throw new Error('Le journal de référence est en format futur; les hypothèses legacy restent en lecture seule.');
  if (options.referenceVersion !== undefined && !text(options.referenceVersion)) {
    throw new Error('La version de référence explicite doit être un texte non vide.');
  }
  if (options.legacyConversion && options.referenceVersion !== undefined) {
    throw new Error('Une conversion historique ne peut pas remplacer la version NR d’origine.');
  }
  const definitions = options.legacyConversion ? [] : getHopV55ReferenceDefinitions(prepared);
  if (!options.legacyConversion && definitions.length === 0) throw new Error('Aucune définition de modèle source n’est chargée; la nouvelle référence n’est pas adoptée.');
  const version = referenceVersion(workspace, hypothesis, current.projection.currentReference, context, prepared, definitions,
    options.referenceVersion);
  const commandVersionSuffix = referenceCommandVersionSuffix(hypothesis, options.referenceVersion);
  const proposalId = `reference-propose:${hypothesis.id}:${commandVersionSuffix}`;
  const proposed = applyToJournal(workspace, journal, commandAt(workspace, journal, {
    commandId: proposalId, recordedAt: hypothesis.recordedAt, kind: 'referenceProposed', payload: { reference: version },
  }));
  const identity: BrewingReferenceIdentityV1 = { id: version.id, version: version.version, contentReference: version.contentReference };
  return appendAdoption(workspace, proposed, hypothesis, identity, options.referenceVersion);
}

function openJournal(workspace: HopV55Workspace, context: BrewerContext, prepared: PreparedBrewingScenarioContext): HopV55ReferenceJournal {
  const contextId = hopV55ReferenceContextId(workspace.id);
  const legacyTimes = workspace.referenceHypotheses.map(row => row.recordedAt);
  const recordedAt = legacyTimes.length
    ? legacyTimes.filter(isoDate).sort()[0]
    : workspace.updatedAt;
  if (!isoDate(recordedAt)) throw new Error('Date d’ouverture de référence invalide.');
  const opened = openBrewingReferenceContext({
    ownerKey: workspace.ownerKey,
    contextId,
    commandId: `context-open:${workspace.id}`,
    recordedAt,
    context: referenceContext(context, prepared),
  });
  return { record: opened.record, events: [opened.event] };
}

/** Creates the shared reference journal once; no empty baseline is proposed. */
export function ensureHopV55ReferenceJournal(workspaceValue: HopV55Workspace, context: BrewerContext,
  prepared: PreparedBrewingScenarioContext): HopV55Workspace {
  const workspace = clone(workspaceValue);
  const read = readHopV55ReferenceJournal(workspace);
  if (read.status === 'unsupportedFormat') return workspace;
  let journal = read.status === 'available' ? clone(workspace.referenceJournal!) : openJournal(workspace, context, prepared);
  for (const hypothesis of workspace.referenceHypotheses) {
    const current = readBrewingReferenceRecord(journal.record, journal.events);
    if ('status' in current) return workspace;
    const reference = current.projection.references.find(row => row.id === hypothesis.id && row.version === String(hypothesis.version));
    if (!reference) {
      journal = appendHypothesis(workspace, journal, hypothesis, context, prepared, { legacyConversion: true });
      continue;
    }
    const baseline = baselineFromUnknown(hypothesis.baseline);
    const storedBaseline = baselineInReference(reference);
    if (!baseline || !storedBaseline || reference.content.label !== hypothesis.label || !sameReferencePayload(storedBaseline, baseline)) {
      throw new Error(`Hypothèse legacy ${hypothesis.id}@${hypothesis.version} diverge de sa version déjà journalisée; aucune conversion destructive n’est faite.`);
    }
    const identity: BrewingReferenceIdentityV1 = { id: reference.id, version: reference.version, contentReference: reference.contentReference };
    const adopted = current.projection.adoptions.some(row => row.reference.id === identity.id && row.reference.version === identity.version
      && row.reference.contentReference === identity.contentReference);
    if (!adopted) journal = appendAdoption(workspace, journal, hypothesis, identity);
  }
  return { ...workspace, referenceJournal: journal };
}

function currentJournalRead(workspace: HopV55Workspace): Extract<BrewingReferenceReadResult, { record: BrewingReferenceRecordV1 }> | null {
  const read = readHopV55ReferenceJournal(workspace);
  return read.status === 'available' ? read.read : null;
}

export function getHopV55ReferenceProjection(workspace: HopV55Workspace): BrewingReferenceProjectionV1 | null {
  const read = currentJournalRead(workspace);
  return read ? getBrewingReferenceProjection(read) : null;
}

function baselineInReference(reference: BrewingReferenceVersionV1): BrewingScenarioRequest['baseline'] | undefined {
  return object(reference.content) ? baselineFromUnknown(reference.content.baseline) : undefined;
}

export function getHopV55AdoptedBaseline(workspace: HopV55Workspace): BrewingScenarioRequest['baseline'] | undefined {
  const projection = getHopV55ReferenceProjection(workspace);
  if (!projection?.currentReference) return undefined;
  const exact = projection.references.find(row => row.id === projection.currentReference?.id
    && row.version === projection.currentReference?.version && row.contentReference === projection.currentReference?.contentReference);
  return exact ? baselineInReference(exact) : undefined;
}

export function getHopV55ReferenceHypotheses(workspace: HopV55Workspace): HopV55Workspace['referenceHypotheses'] {
  const journal = readHopV55ReferenceJournal(workspace);
  if (journal.status !== 'available') return clone(workspace.referenceHypotheses);
  const { projection } = journal.read;
  return projection.adoptions.flatMap(adoption => {
    const reference = projection.references.find(row => row.id === adoption.reference.id
      && row.version === adoption.reference.version && row.contentReference === adoption.reference.contentReference);
    const baseline = reference && baselineInReference(reference);
    const version = reference ? Number(reference.version) : NaN;
    if (!reference || !baseline || !Number.isSafeInteger(version) || version < 1) return [];
    const label = typeof reference.content.label === 'string' && reference.content.label.trim() ? reference.content.label : reference.id;
    return [{ id: reference.id, version, label, baseline, recordedAt: adoption.adoptedAt }];
  });
}

export function adoptHopV55ReferenceHypothesis(workspaceValue: HopV55Workspace,
  hypothesis: HopV55Workspace['referenceHypotheses'][number], context: BrewerContext,
  prepared: PreparedBrewingScenarioContext, options: { referenceVersion?: string } = {}): HopV55Workspace {
  if (options.referenceVersion !== undefined && !text(options.referenceVersion)) {
    throw new Error('La version NR explicite doit être un texte non vide.');
  }
  const workspace = ensureHopV55ReferenceJournal(workspaceValue, context, prepared);
  if (!workspace.referenceJournal) throw new Error('Le journal de référence est indisponible pour adoption.');
  const journal = appendHypothesis(workspace, workspace.referenceJournal, hypothesis, context, prepared, {
    legacyConversion: false, ...(options.referenceVersion !== undefined ? { referenceVersion: options.referenceVersion } : {}),
  });
  return { ...workspace, referenceJournal: journal };
}

export function applyHopV55ReferenceEvent(workspaceValue: HopV55Workspace, command: BrewingReferenceCommandInput): HopV55Workspace {
  const workspace = clone(workspaceValue);
  if (!workspace.referenceJournal) throw new Error('Ouvre le contexte de référence avant d’ajouter un événement.');
  const journal = applyToJournal(workspace, workspace.referenceJournal, command);
  return { ...workspace, referenceJournal: journal };
}

/** Call only after the local scenario repository has returned its durable save receipt.
 * The scenario save and this workspace event are separate transactions: if the
 * second write fails, retry this link with the same receiptId; never rerun J5. */
export function linkHopV55ScenarioResult(workspaceValue: HopV55Workspace, input: {
  result: BrewingScenarioResult;
  snapshotReference: string;
  receiptId: string;
  receivedAt: string;
  /** Frozen adopted identity from the J5 preparation; if omitted, uses today's adopted reference. */
  reference?: BrewingReferenceIdentityV1;
}): HopV55Workspace {
  if (!text(input.receiptId) || !text(input.snapshotReference) || !isoDate(input.receivedAt)) throw new Error('Reçu local ou snapshot enregistré invalide.');
  if (input.snapshotReference !== input.result.reference) throw new Error('Le snapshot fourni ne correspond pas au résultat exact enregistré.');
  const workspace = clone(workspaceValue);
  const projection = getHopV55ReferenceProjection(workspace);
  const reference = input.reference ?? projection?.currentReference;
  if (!projection || !reference) throw new Error('Aucune référence adoptée n’existe pour lier ce résultat.');
  const exactReference = projection.references.some(row => row.id === reference.id && row.version === reference.version
    && row.contentReference === reference.contentReference);
  const adopted = projection.adoptions.some(row => row.reference.id === reference.id && row.reference.version === reference.version
    && row.reference.contentReference === reference.contentReference);
  if (!exactReference || !adopted) throw new Error('La référence figée doit être une identité exacte déjà adoptée dans le journal NR.');
  const commandId = `reference-result-link:${input.receiptId}`;
  const linkId = `result-link:${input.receiptId}`;
  const journal = workspace.referenceJournal;
  if (!journal) throw new Error('Journal de référence absent.');
  const next = applyToJournal(workspace, journal, commandAt(workspace, journal, {
    commandId,
    recordedAt: input.receivedAt,
    kind: 'j5ResultLinked',
    payload: { link: {
      id: linkId,
      reference: clone(reference),
      result: { scenarioId: input.result.scenarioId, resultId: input.result.scenarioId, resultRevision: input.result.revision,
        resultReference: input.result.reference, snapshotReference: input.snapshotReference },
      receipt: { status: 'local', receiptId: input.receiptId, localRecordId: input.result.scenarioId, receivedAt: input.receivedAt },
    } },
  }));
  return { ...workspace, referenceJournal: next };
}
