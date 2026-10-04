import {
  BREWING_SCENARIO_VERSION,
  assertBrewingScenarioRequest,
  type BrewingScenarioBaseline,
  type BrewingScenarioCultureContext,
} from '../../domain/brewingScenario';
import {
  createBrewingReferenceCommand,
  openBrewingReferenceContext,
  brewingReferenceVersionContentReference,
  type BrewingReferenceActorV1,
  type BrewingReferenceContextV1,
  type BrewingReferenceEvent,
  type BrewingReferenceIdentityV1,
  type BrewingReferenceOriginV1,
  type BrewingReferenceVersionV1,
  type JsonValue,
} from '../../domain/brewingReference';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopV55Workspace } from './contracts';
import { hopV55ReferenceContextId, readHopV55ReferenceJournal } from './referenceWorkspace';

export const HOP_V55_ADOPTED_CONTEXT_BINDING_FORMAT = 'hop-v55-adopted-context-binding-v1' as const;

export type HopV55AdoptedCultureV1 =
  | { status: 'notProvided' }
  | { status: 'declared'; value: BrewingScenarioCultureContext };

export interface HopV55AdoptedContextActivationV1 {
  kind: 'referenceActivated';
  eventReference: string;
  commandId: string;
  activatedAt: string;
  activatedBy: BrewingReferenceActorV1;
  reason: string;
  eventSnapshot: Extract<BrewingReferenceEvent, { kind: 'referenceActivated' }>;
}

/**
 * Immutable, offline-verifiable copy of one currently adopted NR context.
 * `versionSnapshot` retains all original source/provenance fields; the extracted
 * baseline and culture are convenience views and are checked against that snapshot.
 */
export interface HopV55AdoptedContextBindingV1 {
  format: typeof HOP_V55_ADOPTED_CONTEXT_BINDING_FORMAT;
  ownerKey: string;
  workspaceId: string;
  contextId: string;
  reference: BrewingReferenceIdentityV1;
  versionSnapshot: BrewingReferenceVersionV1;
  baseline: BrewingScenarioBaseline;
  culture: HopV55AdoptedCultureV1;
  sourceContext: {
    /** Context as opened by the validated NR journal. */
    journal: BrewingReferenceContextV1;
    /** Exact source context frozen in this adopted version. */
    version: Record<string, JsonValue>;
  };
  origin: BrewingReferenceOriginV1;
  hypotheses: string[];
  author: BrewingReferenceActorV1;
  createdAt: string;
  adoption: {
    eventReference: string;
    adoptedBy: BrewingReferenceActorV1;
    adoptedAt: string;
    eventSnapshot: Extract<BrewingReferenceEvent, { kind: 'referenceAdopted' }>;
  };
  activations: HopV55AdoptedContextActivationV1[];
  /** Content fingerprint of this complete binding, not an authentication claim. */
  bindingReference: string;
}

export type HopV55AdoptedContextStaleCodeV1 =
  | 'expectedReferenceMissing'
  | 'expectedReferenceChanged'
  | 'expectedAbsenceOutdated'
  | 'expectedReferenceNotAdopted';

export type HopV55AdoptedContextInvalidCodeV1 =
  | 'workspaceIdentity'
  | 'expectedIdentity'
  | 'journalInvalid'
  | 'referenceInvalid'
  | 'bindingInvalid';

export type HopV55AdoptedContextResolutionV1 =
  | { status: 'absent' }
  | { status: 'resolved'; binding: HopV55AdoptedContextBindingV1 }
  | { status: 'stale'; code: HopV55AdoptedContextStaleCodeV1; expected: BrewingReferenceIdentityV1 | null;
      current: BrewingReferenceIdentityV1 | null }
  | { status: 'invalid'; code: HopV55AdoptedContextInvalidCodeV1; reason: string }
  | { status: 'unsupportedFormat'; reason: 'recordFormat' | 'eventFormat'; formatVersion?: number; raw: unknown };

export type HopV55AdoptedContextBindingReadV1 =
  | { status: 'available'; binding: HopV55AdoptedContextBindingV1 }
  | { status: 'invalid'; reason: string };

type WorkspaceJournalInput = Pick<HopV55Workspace, 'id' | 'ownerKey' | 'referenceJournal'>;

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const clone = <T>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown): boolean => hopAdviceContentReference('hop-v55-adopted-context-equality-v1', left)
  === hopAdviceContentReference('hop-v55-adopted-context-equality-v1', right);
const identityKey = (identity: BrewingReferenceIdentityV1): string => `${identity.id}\0${identity.version}\0${identity.contentReference}`;

function isIdentity(value: unknown): value is BrewingReferenceIdentityV1 {
  return object(value) && Object.keys(value).length === 3
    && Object.keys(value).every(key => key === 'id' || key === 'version' || key === 'contentReference')
    && text(value.id) && text(value.version) && text(value.contentReference);
}

function baselineFromVersion(version: BrewingReferenceVersionV1): BrewingScenarioBaseline | undefined {
  if (!object(version.content) || !Object.prototype.hasOwnProperty.call(version.content, 'baseline')) return undefined;
  const baseline = clone(version.content.baseline);
  try {
    assertBrewingScenarioRequest({ version: BREWING_SCENARIO_VERSION, scenarioId: 'hop-v55-adopted-context-validation',
      revision: 0, baseline, assumptions: [], branches: [] });
    return baseline as BrewingScenarioBaseline;
  } catch { return undefined; }
}

function cultureFromBaseline(baseline: BrewingScenarioBaseline): HopV55AdoptedCultureV1 {
  if (baseline.kind !== 'hypothetical' || !Object.prototype.hasOwnProperty.call(baseline, 'culture')) {
    return { status: 'notProvided' };
  }
  return { status: 'declared', value: clone(baseline.culture!) };
}

function bindingReference(value: Omit<HopV55AdoptedContextBindingV1, 'bindingReference'> | HopV55AdoptedContextBindingV1): string {
  const { bindingReference: _bindingReference, ...body } = value as HopV55AdoptedContextBindingV1;
  return hopAdviceContentReference('hop-v55-adopted-context-binding-v1', body);
}

function actor(value: unknown): value is BrewingReferenceActorV1 {
  return object(value) && Object.keys(value).every(key => key === 'id' || key === 'label')
    && text(value.label) && (value.id === undefined || text(value.id));
}

function eventMatchesCommand(value: unknown, expectedKind: 'referenceAdopted' | 'referenceActivated', ownerKey: string,
  contextId: string, reference: BrewingReferenceIdentityV1): value is BrewingReferenceEvent {
  if (!object(value) || value.kind !== expectedKind || value.ownerKey !== ownerKey || value.contextId !== contextId
    || !text(value.commandId) || !Number.isSafeInteger(value.expectedRevision) || !Number.isSafeInteger(value.resultingRevision)
    || !isoDate(value.recordedAt)) return false;
  try {
    const rebuilt = createBrewingReferenceCommand({ ownerKey, contextId, commandId: value.commandId,
      expectedRevision: value.expectedRevision, recordedAt: value.recordedAt, kind: expectedKind, payload: value.payload });
    return same(rebuilt, value) && object(value.payload) && isIdentity(value.payload.reference)
      && identityKey(value.payload.reference) === identityKey(reference);
  } catch { return false; }
}

function isoDate(value: unknown): value is string {
  return text(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function bindingError(value: unknown): string | null {
  if (!object(value) || value.format !== HOP_V55_ADOPTED_CONTEXT_BINDING_FORMAT
    || Object.keys(value).some(key => !['format', 'ownerKey', 'workspaceId', 'contextId', 'reference', 'versionSnapshot', 'baseline',
      'culture', 'sourceContext', 'origin', 'hypotheses', 'author', 'createdAt', 'adoption', 'activations', 'bindingReference'].includes(key))) {
    return 'Enveloppe de résolution de culture NR inconnue.';
  }
  if (Object.keys(value).length !== 16 || !text(value.ownerKey) || !text(value.workspaceId)
    || value.contextId !== hopV55ReferenceContextId(value.workspaceId) || !isIdentity(value.reference)
    || !object(value.versionSnapshot) || !object(value.sourceContext)
    || !Array.isArray(value.hypotheses) || value.hypotheses.some((item: unknown) => typeof item !== 'string')
    || !actor(value.author) || !isoDate(value.createdAt) || !object(value.adoption) || !Array.isArray(value.activations)
    || !text(value.bindingReference)) return 'Identité ou provenance de la résolution NR incomplète.';

  const version = value.versionSnapshot as BrewingReferenceVersionV1;
  try {
    createBrewingReferenceCommand({ ownerKey: value.ownerKey, contextId: value.contextId, commandId: 'verify-adopted-context-version',
      expectedRevision: 0, recordedAt: version.createdAt, kind: 'referenceProposed', payload: { reference: version } });
    openBrewingReferenceContext({ ownerKey: value.ownerKey, contextId: value.contextId, commandId: 'verify-adopted-context-source-context',
      recordedAt: version.createdAt, context: value.sourceContext.journal as BrewingReferenceContextV1 });
  } catch (error) {
    return error instanceof Error ? `Le snapshot NR ou son contexte source est invalide : ${error.message}`
      : 'Le snapshot NR ou son contexte source est invalide.';
  }
  if (!same({ id: version.id, version: version.version, contentReference: version.contentReference }, value.reference)
    || version.contentReference !== brewingReferenceVersionContentReference(version)
    || !same(value.origin, version.origin) || !same(value.hypotheses, version.hypotheses)
    || !same(value.author, version.author) || value.createdAt !== version.createdAt) {
    return 'La source ou la provenance initiale ne correspond pas à sa version NR exacte.';
  }
  const baseline = baselineFromVersion(version);
  if (!baseline || !same(value.baseline, baseline) || !same(value.sourceContext, { journal: value.sourceContext?.journal, version: version.context })) {
    return 'La baseline ou le contexte source ne correspond pas au snapshot NR.';
  }
  const expectedCulture = cultureFromBaseline(baseline);
  if (!same(value.culture, expectedCulture)) return 'La culture déclarée a été perdue ou transformée.';

  const adoption = value.adoption as Record<string, unknown>;
  if (Object.keys(adoption).length !== 4 || !text(adoption.eventReference) || !text(adoption.adoptedAt) || !isoDate(adoption.adoptedAt)
    || !actor(adoption.adoptedBy) || !eventMatchesCommand(adoption.eventSnapshot, 'referenceAdopted', value.ownerKey, value.contextId, value.reference)) {
    return 'Provenance de l’adoption NR incomplète.';
  }
  const adoptionEvent = adoption.eventSnapshot as Extract<BrewingReferenceEvent, { kind: 'referenceAdopted' }>;
  if (adoption.eventReference !== adoptionEvent.contentReference || adoption.adoptedAt !== adoptionEvent.recordedAt
    || !same(adoption.adoptedBy, adoptionEvent.payload.adoptedBy)) return 'L’acteur ou la date d’adoption ne correspond pas à son événement NR.';
  for (const activation of value.activations) {
    if (!object(activation) || Object.keys(activation).length !== 7 || activation.kind !== 'referenceActivated'
      || !text(activation.eventReference) || !text(activation.commandId) || !isoDate(activation.activatedAt)
      || !actor(activation.activatedBy) || !text(activation.reason)
      || !eventMatchesCommand(activation.eventSnapshot, 'referenceActivated', value.ownerKey, value.contextId, value.reference)) {
      return 'Provenance d’activation NR incomplète.';
    }
    const event = activation.eventSnapshot as Extract<BrewingReferenceEvent, { kind: 'referenceActivated' }>;
    if (activation.eventReference !== event.contentReference || activation.commandId !== event.commandId
      || activation.activatedAt !== event.recordedAt || !same(activation.activatedBy, event.payload.activatedBy)
      || activation.reason !== event.payload.reason) return 'L’acteur ou la date d’activation ne correspond pas à son événement NR.';
  }
  if (bindingReference(value as HopV55AdoptedContextBindingV1) !== value.bindingReference) return 'Empreinte de la résolution NR incorrecte.';
  return null;
}

/** Revalidates a stored binding offline without consulting today's NR head or running a model. */
export function readHopV55AdoptedContextBinding(value: unknown): HopV55AdoptedContextBindingReadV1 {
  try {
    const error = bindingError(value);
    return error ? { status: 'invalid', reason: error } : { status: 'available', binding: clone(value as HopV55AdoptedContextBindingV1) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Résolution NR illisible.' };
  }
}

function makeBinding(workspace: WorkspaceJournalInput, read: Extract<ReturnType<typeof readHopV55ReferenceJournal>, { status: 'available' }>,
  reference: BrewingReferenceVersionV1): HopV55AdoptedContextBindingV1 | undefined {
  const identity = { id: reference.id, version: reference.version, contentReference: reference.contentReference };
  const adoption = read.read.projection.adoptions.find(row => identityKey(row.reference) === identityKey(identity));
  if (!adoption) return undefined;
  const adoptionEvent = read.read.events.find((event): event is Extract<BrewingReferenceEvent, { kind: 'referenceAdopted' }> =>
    event.kind === 'referenceAdopted' && identityKey(event.payload.reference) === identityKey(identity));
  if (!adoptionEvent || !same(adoptionEvent.payload.adoptedBy, adoption.adoptedBy) || adoptionEvent.recordedAt !== adoption.adoptedAt) return undefined;
  const baseline = baselineFromVersion(reference);
  if (!baseline) return undefined;
  const activations = read.read.events.flatMap((event): HopV55AdoptedContextActivationV1[] => event.kind === 'referenceActivated'
    && identityKey(event.payload.reference) === identityKey(identity)
    ? [{ kind: 'referenceActivated' as const, eventReference: event.contentReference, commandId: event.commandId,
      activatedAt: event.recordedAt, activatedBy: clone(event.payload.activatedBy), reason: event.payload.reason, eventSnapshot: clone(event) }]
    : []);
  const body = {
    format: HOP_V55_ADOPTED_CONTEXT_BINDING_FORMAT,
    ownerKey: workspace.ownerKey,
    workspaceId: workspace.id,
    contextId: read.read.record.contextId,
    reference: clone(identity),
    versionSnapshot: clone(reference),
    baseline: clone(baseline),
    culture: cultureFromBaseline(baseline),
    sourceContext: { journal: clone(read.read.projection.context), version: clone(reference.context) },
    origin: clone(reference.origin),
    hypotheses: clone(reference.hypotheses),
    author: clone(reference.author),
    createdAt: reference.createdAt,
    adoption: { eventReference: adoptionEvent.contentReference, adoptedBy: clone(adoption.adoptedBy), adoptedAt: adoption.adoptedAt,
      eventSnapshot: clone(adoptionEvent) },
    activations,
  } satisfies Omit<HopV55AdoptedContextBindingV1, 'bindingReference'>;
  const binding = { ...body, bindingReference: bindingReference(body) };
  return bindingError(binding) === null ? binding : undefined;
}

/**
 * Resolves only the exact current NR adoption. A historical-but-inactive version
 * is stale for a new command; its already-frozen archives are read from their own binding.
 */
export function resolveHopV55AdoptedContext(input: {
  workspace: WorkspaceJournalInput;
  expected: BrewingReferenceIdentityV1 | null;
}): HopV55AdoptedContextResolutionV1 {
  const { workspace, expected } = input;
  if (!text(workspace?.id) || !text(workspace?.ownerKey)) {
    return { status: 'invalid', code: 'workspaceIdentity', reason: 'Owner ou workspace NR invalide.' };
  }
  if (expected !== null && !isIdentity(expected)) {
    return { status: 'invalid', code: 'expectedIdentity', reason: 'Identité NR attendue incomplète ou convertie hors contrat texte.' };
  }

  let journal: ReturnType<typeof readHopV55ReferenceJournal>;
  try { journal = readHopV55ReferenceJournal(workspace as HopV55Workspace); }
  catch (error) {
    return { status: 'invalid', code: 'journalInvalid', reason: error instanceof Error ? error.message : 'Journal NR invalide.' };
  }
  if (journal.status === 'unsupportedFormat') return {
    status: 'unsupportedFormat', reason: journal.read.reason,
    ...(journal.read.formatVersion !== undefined ? { formatVersion: journal.read.formatVersion } : {}), raw: clone(journal.read.raw),
  };

  const current = journal.status === 'available' ? journal.read.projection.currentReference : null;
  if (expected === null) {
    if (current) return { status: 'stale', code: 'expectedAbsenceOutdated', expected: null, current: clone(current) };
    return { status: 'absent' };
  }
  if (!current) return { status: 'stale', code: 'expectedReferenceMissing', expected: clone(expected), current: null };
  if (identityKey(current) !== identityKey(expected)) {
    return { status: 'stale', code: 'expectedReferenceChanged', expected: clone(expected), current: clone(current) };
  }
  if (journal.status === 'absent') return { status: 'stale', code: 'expectedReferenceMissing', expected: clone(expected), current: null };

  const reference = journal.read.projection.references.find(row => identityKey(row) === identityKey(expected));
  const adopted = journal.read.projection.adoptions.some(row => identityKey(row.reference) === identityKey(expected));
  if (!reference || !adopted) return { status: 'stale', code: 'expectedReferenceNotAdopted', expected: clone(expected), current: clone(current) };
  const binding = makeBinding(workspace, journal, reference);
  if (!binding) return { status: 'invalid', code: 'referenceInvalid', reason: 'La version NR adoptée ne fournit pas une baseline et une provenance cohérentes.' };
  return { status: 'resolved', binding };
}
