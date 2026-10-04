import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopAdviceEventContentReference, hopAdviceStudyReference, readHopAdviceDossier, readHopAdviceEvent,
  type HopAdviceDossierV3, type HopAdviceEventRead, type HopAdviceEventV3 } from '../../domain/hopDecision/adviceDossier';
import type { HopDecisionLocalRepository } from '../hopDecisionLocalRepository';
import { readHopV55DecisionReadingArchive } from './decisionArchive';
import { readHopV55QualifiedStudyLink, readHopV55QualifiedStudyPreparation,
  type HopV55QualifiedStudyFreshness, type HopV55QualifiedStudyLinkV1,
  type HopV55QualifiedStudyPreparationRecord } from './qualifiedStudyWorkspace';
import type { HopV55Workspace, HopV55WorkspaceRepository } from './contracts';

export const HOP_V55_QUALIFIED_STUDY_PREFERENCE_V1_FORMAT = 'hop-v55-qualified-study-preference-command-v1' as const;
export type HopV55StrategyPreferredEventV3 = Extract<HopAdviceEventV3, { kind: 'strategyPreferred' }>;

/** Exact event prepared by the caller before staging. It contains no program change or quantity. */
export interface HopV55QualifiedStudyPreferenceCommandV1 {
  format: typeof HOP_V55_QUALIFIED_STUDY_PREFERENCE_V1_FORMAT;
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparationReference: string;
  dossierId: string;
  studyReference: string;
  preferenceId: string;
  event: HopV55StrategyPreferredEventV3;
  reference: string;
}

export interface HopV55QualifiedStudyPreferenceUnknownRecord {
  format: string;
  readonly [key: string]: unknown;
}

export type HopV55QualifiedStudyPreferenceHistoryEntry =
  | HopV55QualifiedStudyPreferenceCommandV1
  | HopV55QualifiedStudyPreferenceUnknownRecord;

export interface HopV55QualifiedStudyPreferenceFreshnessInput {
  command: HopV55QualifiedStudyPreferenceCommandV1;
  phase: 'beforeStage' | 'beforeAppend' | 'alreadyAppended';
}

export type HopV55QualifiedStudyPreferenceFreshnessValidator =
  (input: HopV55QualifiedStudyPreferenceFreshnessInput) => Promise<HopV55QualifiedStudyFreshness>;

export type HopV55QualifiedStudyPreferenceStatus = 'appended' | 'alreadyAppended' | 'recoveredHistorical';

export interface PersistHopV55QualifiedStudyPreferenceResult {
  status: HopV55QualifiedStudyPreferenceStatus;
  repositoryStatus: 'appended' | 'duplicate';
  freshContext: HopV55QualifiedStudyFreshness;
  command: HopV55QualifiedStudyPreferenceCommandV1;
  /** The original study link. A preference does not create or rewrite workspace links. */
  link: HopV55QualifiedStudyLinkV1;
  dossierAdvice3: HopAdviceDossierV3;
  eventAdvice3: HopV55StrategyPreferredEventV3;
  eventsAdvice3: HopAdviceEventV3[];
}

export class HopV55QualifiedStudyPreferenceError extends Error {
  constructor(readonly code: 'invalidInput' | 'notFound' | 'staleRevision' | 'eventConflict' | 'unsupportedFormat' | 'invalidStoredRecord', message: string) {
    super(message);
    this.name = 'HopV55QualifiedStudyPreferenceError';
  }
}

type Row = Record<string, any>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const clone = <T,>(value: T): T => structuredClone(value);

function commandReference(value: Omit<HopV55QualifiedStudyPreferenceCommandV1, 'reference'>
  | HopV55QualifiedStudyPreferenceCommandV1): string {
  const { reference: _reference, ...body } = value as HopV55QualifiedStudyPreferenceCommandV1;
  return hopAdviceContentReference(HOP_V55_QUALIFIED_STUDY_PREFERENCE_V1_FORMAT, body);
}

function assertPreferenceEvent(value: unknown): asserts value is HopV55StrategyPreferredEventV3 {
  let read: ReturnType<typeof readHopAdviceEvent>;
  try { read = readHopAdviceEvent(value); }
  catch (error) { throw new HopV55QualifiedStudyPreferenceError('invalidInput', `Événement strategyPreferred invalide : ${(error as Error).message}`); }
  if ('status' in read) throw new HopV55QualifiedStudyPreferenceError('unsupportedFormat', 'Un événement de préférence futur ne peut pas être écrit comme V3.');
  if (read.kind !== 'strategyPreferred') throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Seul l’événement strategyPreferred V3 est accepté ici.');
}

function assertCommand(value: unknown): asserts value is HopV55QualifiedStudyPreferenceCommandV1 {
  if (!isRow(value) || value.format !== HOP_V55_QUALIFIED_STUDY_PREFERENCE_V1_FORMAT || !text(value.id)
    || !text(value.ownerKey) || !text(value.workspaceId) || !text(value.sourceReadingReference)
    || !text(value.preparationReference) || !text(value.dossierId) || !text(value.studyReference)
    || !text(value.preferenceId) || !text(value.reference)) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Commande de préférence stratégie incomplète.');
  }
  const allowed = ['format', 'id', 'ownerKey', 'workspaceId', 'sourceReadingReference', 'preparationReference',
    'dossierId', 'studyReference', 'preferenceId', 'event', 'reference'];
  if (Object.keys(value).some(key => !allowed.includes(key))) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'La commande de préférence contient un champ non pris en charge.');
  }
  assertPreferenceEvent(value.event);
  const event = value.event as HopV55StrategyPreferredEventV3;
  if (value.id !== event.eventId || value.ownerKey !== event.ownerKey || value.dossierId !== event.dossierId
    || value.studyReference !== event.payload.studyReference || value.preferenceId !== event.payload.preferenceId
    || !Number.isSafeInteger(event.expectedRevision) || event.expectedRevision < 1
    || commandReference(value as unknown as HopV55QualifiedStudyPreferenceCommandV1) !== value.reference) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'La commande ne correspond pas exactement à son événement V3 scellé.');
  }
}

export function createHopV55QualifiedStudyPreferenceCommandV1(input: {
  preparation: HopV55QualifiedStudyPreparationRecord;
  event: HopV55StrategyPreferredEventV3;
}): HopV55QualifiedStudyPreferenceCommandV1 {
  assertPreferenceEvent(input.event);
  const preparation = input.preparation;
  if (preparation.kind !== 'advice' || preparation.formatVersion !== 3
    || preparation.ownerKey !== input.event.ownerKey || preparation.dossierId !== input.event.dossierId
    || preparation.studyReference !== input.event.payload.studyReference) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'La préférence ne référence pas exactement une préparation de stratégie V3.');
  }
  const body: Omit<HopV55QualifiedStudyPreferenceCommandV1, 'reference'> = {
    format: HOP_V55_QUALIFIED_STUDY_PREFERENCE_V1_FORMAT,
    id: input.event.eventId, ownerKey: preparation.ownerKey, workspaceId: preparation.workspaceId,
    sourceReadingReference: preparation.sourceReadingReference, preparationReference: preparation.reference,
    dossierId: preparation.dossierId, studyReference: preparation.studyReference,
    preferenceId: input.event.payload.preferenceId, event: clone(input.event),
  };
  const command = { ...body, reference: commandReference(body) };
  assertCommand(command);
  return clone(command);
}

export function readHopV55QualifiedStudyPreferenceCommand(value: unknown):
  | { status: 'available'; command: HopV55QualifiedStudyPreferenceCommandV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string } {
  if (isRow(value) && typeof value.format === 'string'
    && value.format.startsWith('hop-v55-qualified-study-preference-command-')
    && value.format !== HOP_V55_QUALIFIED_STUDY_PREFERENCE_V1_FORMAT) {
    return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: 'Format futur de commande de préférence conservé brut.' };
  }
  assertCommand(value);
  return { status: 'available', command: clone(value) };
}

function sameExact(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((row, index) => sameExact(row, right[index]));
  const leftRow = left as Row, rightRow = right as Row;
  const leftKeys = Object.keys(leftRow).sort(), rightKeys = Object.keys(rightRow).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index]
    && sameExact(leftRow[key], rightRow[key]));
}

function opaqueScope(value: unknown, ownerKey: string, workspaceId: string, sourceReferences: ReadonlySet<string>): void {
  if (!isRow(value)) throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Une commande future de préférence est illisible.');
  if (value.ownerKey !== undefined && value.ownerKey !== ownerKey
    || value.workspaceId !== undefined && value.workspaceId !== workspaceId) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Une commande future de préférence appartient à un autre owner/workspace.');
  }
  if (value.sourceReadingReference !== undefined
    && (!text(value.sourceReadingReference) || !sourceReferences.has(value.sourceReadingReference))) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Une commande future de préférence ne cite pas une lecture exacte du workspace.');
  }
}

export function assertHopV55QualifiedStudyPreferenceCommands(workspace: Pick<HopV55Workspace,
  'id' | 'ownerKey' | 'decisionReadings' | 'qualifiedStudyPreparations' | 'qualifiedStudyLinks' | 'qualifiedStudyPreferenceCommands'>): void {
  const rows = workspace.qualifiedStudyPreferenceCommands ?? [];
  if (!Array.isArray(rows)) throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Historique des préparations de préférence invalide.');
  const sourceReferences = new Set((workspace.decisionReadings ?? []).flatMap(raw => {
    const read = readHopV55DecisionReadingArchive(raw);
    return read.status === 'available' && read.archive.ownerKey === workspace.ownerKey
      && read.archive.workspaceId === workspace.id ? [read.archive.contentReference] : [];
  }));
  const preparations = new Map<string, HopV55QualifiedStudyPreparationRecord>();
  for (const raw of workspace.qualifiedStudyPreparations ?? []) {
    const read = readHopV55QualifiedStudyPreparation(raw);
    if (read.status === 'available') preparations.set(read.preparation.reference, read.preparation);
  }
  const links = new Map<string, HopV55QualifiedStudyLinkV1>();
  for (const raw of workspace.qualifiedStudyLinks ?? []) {
    const read = readHopV55QualifiedStudyLink(raw);
    if (read.status === 'available') links.set(read.link.preparationReference, read.link);
  }
  const ids = new Set<string>(), references = new Set<string>(), eventIds = new Set<string>(), preferenceIds = new Set<string>();
  const futureSources = new Set<string>();
  for (const raw of rows) {
    const read = readHopV55QualifiedStudyPreferenceCommand(raw);
    if (read.status === 'unsupportedReadOnly') {
      opaqueScope(read.snapshot, workspace.ownerKey, workspace.id, sourceReferences);
      if (isRow(read.snapshot)) {
        if (typeof read.snapshot.sourceReadingReference === 'string') futureSources.add(read.snapshot.sourceReadingReference);
        if (typeof read.snapshot.id === 'string') {
          if (ids.has(read.snapshot.id)) throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'ID de commande de préférence dupliqué.');
          ids.add(read.snapshot.id);
        }
      }
      continue;
    }
    const command = read.command;
    const preparation = preparations.get(command.preparationReference);
    const link = links.get(command.preparationReference);
    if (command.ownerKey !== workspace.ownerKey || command.workspaceId !== workspace.id
      || !sourceReferences.has(command.sourceReadingReference)
      || !preparation || !link || preparation.kind !== 'advice' || preparation.formatVersion !== 3
      || preparation.ownerKey !== command.ownerKey || preparation.workspaceId !== command.workspaceId
      || preparation.sourceReadingReference !== command.sourceReadingReference
      || preparation.dossierId !== command.dossierId || preparation.studyReference !== command.studyReference
      || link.kind !== 'advice' || link.formatVersion !== 3 || link.ownerKey !== command.ownerKey
      || link.workspaceId !== command.workspaceId || link.sourceReadingReference !== command.sourceReadingReference
      || link.preparationReference !== command.preparationReference || link.dossierId !== command.dossierId
      || link.studyReference !== command.studyReference || command.event.ownerKey !== command.ownerKey
      || command.event.dossierId !== command.dossierId || command.event.eventId !== command.id) {
      throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'La commande de préférence doit être rattachée à sa préparation, son lien et sa lecture exacte du même workspace.');
    }
    if (futureSources.has(command.sourceReadingReference)) {
      throw new HopV55QualifiedStudyPreferenceError('unsupportedFormat', 'Une commande future de préférence existe pour cette lecture; aucun writer courant ne la remplace.');
    }
    if (ids.has(command.id) || references.has(command.reference) || eventIds.has(command.event.eventId)
      || preferenceIds.has(command.preferenceId)) {
      throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'ID, référence, eventId ou preferenceId de staging dupliqué.');
    }
    ids.add(command.id); references.add(command.reference); eventIds.add(command.event.eventId); preferenceIds.add(command.preferenceId);
  }
}

export function appendHopV55QualifiedStudyPreferenceCommand(workspace: HopV55Workspace,
  command: HopV55QualifiedStudyPreferenceCommandV1): HopV55Workspace {
  assertCommand(command);
  if (workspace.ownerKey !== command.ownerKey || workspace.id !== command.workspaceId) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Owner/workspace du staging différent.');
  }
  const existing = (workspace.qualifiedStudyPreferenceCommands ?? []).flatMap(raw => {
    const read = readHopV55QualifiedStudyPreferenceCommand(raw);
    return read.status === 'available' && read.command.id === command.id ? [read.command] : [];
  })[0];
  if (existing) {
    if (existing.reference !== command.reference || !sameExact(existing, command)) {
      throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'EventId de préférence déjà préparé avec un autre payload.');
    }
    return clone(workspace);
  }
  const samePreference = (workspace.qualifiedStudyPreferenceCommands ?? []).map(readHopV55QualifiedStudyPreferenceCommand)
    .find(read => read.status === 'available' && read.command.preferenceId === command.preferenceId);
  if (samePreference?.status === 'available') {
    throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'Ce preferenceId est déjà préparé sous un autre eventId ou contenu.');
  }
  if ((workspace.qualifiedStudyPreferenceCommands ?? []).some(raw => isRow(raw)
    && typeof raw.format === 'string' && raw.format.startsWith('hop-v55-qualified-study-preference-command-')
    && raw.format !== HOP_V55_QUALIFIED_STUDY_PREFERENCE_V1_FORMAT
    && raw.sourceReadingReference === command.sourceReadingReference)) {
    throw new HopV55QualifiedStudyPreferenceError('unsupportedFormat', 'Une commande future de préférence reste en lecture seule.');
  }
  const preparation = (workspace.qualifiedStudyPreparations ?? []).flatMap(raw => {
    const read = readHopV55QualifiedStudyPreparation(raw);
    return read.status === 'available' && read.preparation.reference === command.preparationReference ? [read.preparation] : [];
  })[0];
  const link = (workspace.qualifiedStudyLinks ?? []).flatMap(raw => {
    const read = readHopV55QualifiedStudyLink(raw);
    return read.status === 'available' && read.link.preparationReference === command.preparationReference ? [read.link] : [];
  })[0];
  const archive = (workspace.decisionReadings ?? []).flatMap(raw => {
    const read = readHopV55DecisionReadingArchive(raw);
    return read.status === 'available' && read.archive.contentReference === command.sourceReadingReference
      && read.archive.ownerKey === command.ownerKey && read.archive.workspaceId === command.workspaceId ? [read.archive] : [];
  })[0];
  if (!preparation || !link || !archive || preparation.kind !== 'advice' || preparation.formatVersion !== 3
    || preparation.studyReference !== command.studyReference || link.studyReference !== command.studyReference
    || link.dossierId !== command.dossierId || link.eventId !== preparation.eventId) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Sauvegarde d’abord l’étude conseil V3 liée avant le staging de sa préférence.');
  }
  return { ...clone(workspace), qualifiedStudyPreferenceCommands: [
    ...(workspace.qualifiedStudyPreferenceCommands ?? []).map(clone), clone(command),
  ] };
}

export function assertHopV55QualifiedStudyPreferenceAppendOnly(previous: HopV55Workspace, next: HopV55Workspace): void {
  const prior = previous.qualifiedStudyPreferenceCommands ?? [], incoming = next.qualifiedStudyPreferenceCommands ?? [];
  if (incoming.length < prior.length || prior.some((row, index) => !sameExact(row, incoming[index]))) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Les commandes préparées de préférence sont immuables et append-only.');
  }
  const priorReadingReferences = new Set((previous.decisionReadings ?? []).map(row => row.contentReference));
  const priorPreparations = new Set((previous.qualifiedStudyPreparations ?? []).flatMap(raw => {
    const read = readHopV55QualifiedStudyPreparation(raw);
    return read.status === 'available' ? [read.preparation.reference] : [];
  }));
  const priorLinks = new Set((previous.qualifiedStudyLinks ?? []).flatMap(raw => {
    const read = readHopV55QualifiedStudyLink(raw);
    return read.status === 'available' ? [read.link.preparationReference] : [];
  }));
  for (const raw of incoming.slice(prior.length)) {
    const read = readHopV55QualifiedStudyPreferenceCommand(raw);
    if (read.status !== 'available') throw new HopV55QualifiedStudyPreferenceError('unsupportedFormat', 'Une commande future ne peut pas être écrite par ce client.');
    if (!priorReadingReferences.has(read.command.sourceReadingReference)
      || !priorPreparations.has(read.command.preparationReference) || !priorLinks.has(read.command.preparationReference)) {
      throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'La lecture, l’étude conseil et son lien doivent être CAS-persistés avant le staging de préférence.');
    }
  }
}

function normalizeFreshness(value: unknown): HopV55QualifiedStudyFreshness {
  if (!isRow(value) || value.status === 'current' && Object.keys(value).some(key => key !== 'status')
    || value.status === 'historical' && (Object.keys(value).some(key => key !== 'status' && key !== 'reason') || !text(value.reason))
    || value.status !== 'current' && value.status !== 'historical') {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Le contrôle de fraîcheur doit répondre courant ou historique avec motif.');
  }
  return value.status === 'current' ? { status: 'current' } : { status: 'historical', reason: value.reason as string };
}

function validateStoredCommand(workspace: HopV55Workspace, command: HopV55QualifiedStudyPreferenceCommandV1): void {
  if (workspace.ownerKey !== command.ownerKey || workspace.id !== command.workspaceId) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Owner/workspace du staging persistant différent.');
  }
  const raw = workspace.qualifiedStudyPreferenceCommands?.find(row => {
    const read = readHopV55QualifiedStudyPreferenceCommand(row);
    return read.status === 'available' && read.command.id === command.id;
  });
  const read = raw && readHopV55QualifiedStudyPreferenceCommand(raw);
  if (!read || read.status !== 'available' || read.command.reference !== command.reference || !sameExact(read.command, command)) {
    throw new HopV55QualifiedStudyPreferenceError('notFound', 'Commande de préférence exacte absente du staging workspace.');
  }
}

function validateLinkedWorkspace(workspace: HopV55Workspace, command: HopV55QualifiedStudyPreferenceCommandV1) {
  validateStoredCommand(workspace, command);
  const preparationRead = (workspace.qualifiedStudyPreparations ?? []).map(readHopV55QualifiedStudyPreparation)
    .find(row => row.status === 'available' && row.preparation.reference === command.preparationReference);
  const linkRead = (workspace.qualifiedStudyLinks ?? []).map(readHopV55QualifiedStudyLink)
    .find(row => row.status === 'available' && row.link.preparationReference === command.preparationReference);
  const archiveRead = (workspace.decisionReadings ?? []).map(readHopV55DecisionReadingArchive)
    .find(row => row.status === 'available' && row.archive.contentReference === command.sourceReadingReference);
  if (!preparationRead || preparationRead.status !== 'available' || !linkRead || linkRead.status !== 'available'
    || !archiveRead || archiveRead.status !== 'available'
    || archiveRead.archive.ownerKey !== command.ownerKey || archiveRead.archive.workspaceId !== command.workspaceId
    || archiveRead.archive.contentReference !== command.sourceReadingReference
    || preparationRead.preparation.kind !== 'advice' || preparationRead.preparation.formatVersion !== 3
    || preparationRead.preparation.reference !== command.preparationReference
    || preparationRead.preparation.studyReference !== command.studyReference
    || linkRead.link.kind !== 'advice' || linkRead.link.formatVersion !== 3
    || linkRead.link.preparationReference !== command.preparationReference || linkRead.link.dossierId !== command.dossierId
    || linkRead.link.studyReference !== command.studyReference || linkRead.link.sourceReadingReference !== command.sourceReadingReference) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'L’étude conseil V3 liée ou son archive source exacte manque.');
  }
  return { preparation: preparationRead.preparation, link: linkRead.link };
}

async function readCurrentAdvice(repository: HopDecisionLocalRepository, command: HopV55QualifiedStudyPreferenceCommandV1,
  preparation: HopV55QualifiedStudyPreparationRecord) {
  const rawDossier = await repository.read(command.ownerKey, command.dossierId);
  if (!rawDossier) throw new HopV55QualifiedStudyPreferenceError('notFound', 'Dossier conseil local introuvable pour sa préférence.');
  const dossierRead = readHopAdviceDossier(rawDossier);
  if ('status' in dossierRead) throw new HopV55QualifiedStudyPreferenceError('unsupportedFormat', 'Dossier conseil futur conservé en lecture seule.');
  if (dossierRead.formatVersion !== 3 || dossierRead.ownerKey !== command.ownerKey || dossierRead.dossierId !== command.dossierId
    || dossierRead.supersedesDossierId !== preparation.createCommand.supersedesDossierId
    || hopAdviceStudyReference(dossierRead.study) !== command.studyReference) {
    throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'Le dossier actuel ne correspond plus au lien d’étude conseil préparé.');
  }
  const eventReads = await repository.readEvents(command.ownerKey, command.dossierId);
  if (eventReads.some(event => 'status' in event)) throw new HopV55QualifiedStudyPreferenceError('unsupportedFormat', 'L’historique du dossier conseil contient un événement futur.');
  const events = eventReads as HopAdviceEventV3[];
  const first = events[0];
  if (!first || first.kind !== 'studySaved' || first.eventId !== preparation.eventId || first.ownerKey !== command.ownerKey
    || first.dossierId !== command.dossierId || first.eventFormatVersion !== 3
    || first.payload.snapshotFormatVersion !== 3
    || first.payload.supersedesDossierId !== preparation.createCommand.supersedesDossierId
    || !sameExact(dossierRead.study, preparation.createCommand.study)) {
    throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'Le studySaved initial ne correspond pas à la préparation source exacte.');
  }
  return { dossier: dossierRead, events };
}

function exactEvent(left: HopAdviceEventV3, right: HopAdviceEventV3): boolean {
  return left.kind === right.kind && left.eventId === right.eventId
    && hopAdviceEventContentReference(left) === hopAdviceEventContentReference(right)
    && sameExact(left, right);
}

export async function appendHopV55QualifiedStudyPreference(input: {
  workspaces: Pick<HopV55WorkspaceRepository, 'read' | 'save'>;
  qualifiedStudies: HopDecisionLocalRepository;
  command: HopV55QualifiedStudyPreferenceCommandV1;
  validateFreshness: HopV55QualifiedStudyPreferenceFreshnessValidator;
  maxStageAttempts?: number;
}): Promise<PersistHopV55QualifiedStudyPreferenceResult> {
  assertCommand(input.command);
  if (typeof input.validateFreshness !== 'function') throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Une vérification de fraîcheur explicite est requise.');
  const maxAttempts = input.maxStageAttempts ?? 4;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 8) {
    throw new HopV55QualifiedStudyPreferenceError('invalidInput', 'Nombre de reprises CAS de staging invalide.');
  }

  let staged = false;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const workspace = await input.workspaces.read(input.command.ownerKey, input.command.workspaceId);
    if (!workspace) throw new HopV55QualifiedStudyPreferenceError('notFound', 'Workspace source de la préférence introuvable.');
    const alreadyStaged = (workspace.qualifiedStudyPreferenceCommands ?? []).map(readHopV55QualifiedStudyPreferenceCommand)
      .find(read => read.status === 'available' && read.command.id === input.command.id);
    if (alreadyStaged?.status === 'available') {
      if (alreadyStaged.command.reference !== input.command.reference || !sameExact(alreadyStaged.command, input.command)) {
        throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'EventId de préférence déjà préparé avec un contenu différent.');
      }
      staged = true;
      break;
    }
    const beforeStage = normalizeFreshness(await input.validateFreshness({ command: input.command, phase: 'beforeStage' }));
    if (beforeStage.status !== 'current') {
      throw new HopV55QualifiedStudyPreferenceError('staleRevision', beforeStage.reason || 'Le contexte est historique; la préférence n’a pas été préparée.');
    }
    const next = appendHopV55QualifiedStudyPreferenceCommand(workspace, input.command);
    try {
      await input.workspaces.save(next, workspace.revision);
      staged = true;
      break;
    } catch (error) {
      if ((error as { code?: unknown })?.code === 'staleRevision') { lastError = error; continue; }
      throw error;
    }
  }
  if (!staged) throw new HopV55QualifiedStudyPreferenceError('staleRevision',
    `La commande de préférence exacte reste en attente d’un CAS workspace : ${(lastError as Error | undefined)?.message ?? 'révision modifiée'}`);

  const workspace = await input.workspaces.read(input.command.ownerKey, input.command.workspaceId);
  if (!workspace) throw new HopV55QualifiedStudyPreferenceError('notFound', 'Workspace source de la préférence introuvable après staging.');
  const { preparation, link } = validateLinkedWorkspace(workspace, input.command);
  const before = await readCurrentAdvice(input.qualifiedStudies, input.command, preparation);
  const matchingEvent = before.events.find(event => event.eventId === input.command.event.eventId);
  if (matchingEvent) {
    if (!exactEvent(matchingEvent, input.command.event)) {
      throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'EventId déjà commis avec un contenu de préférence différent.');
    }
    const matchingPreference = before.events.find(event => event.kind === 'strategyPreferred'
      && event.payload.preferenceId === input.command.preferenceId);
    if (!matchingPreference || matchingPreference.eventId !== input.command.event.eventId) {
      throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'La préférence persistée ne correspond pas à son eventId exact.');
    }
    if (matchingEvent.kind !== 'strategyPreferred') {
      throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'L’eventId exact ne contient pas strategyPreferred.');
    }
    const freshness = normalizeFreshness(await input.validateFreshness({ command: input.command, phase: 'alreadyAppended' }));
    return { status: freshness.status === 'historical' ? 'recoveredHistorical' : 'alreadyAppended',
      repositoryStatus: 'duplicate', freshContext: freshness, command: input.command, link,
      dossierAdvice3: before.dossier, eventAdvice3: matchingEvent, eventsAdvice3: before.events };
  }
  if (before.events.some(event => event.kind === 'strategyPreferred' && event.payload.preferenceId === input.command.preferenceId)) {
    throw new HopV55QualifiedStudyPreferenceError('eventConflict', 'Ce preferenceId existe déjà avec une autre commande ou un autre eventId.');
  }
  const freshness = normalizeFreshness(await input.validateFreshness({ command: input.command, phase: 'beforeAppend' }));
  if (freshness.status !== 'current') {
    throw new HopV55QualifiedStudyPreferenceError('staleRevision', freshness.reason || 'La source est historique; la préférence reste préparée sans événement domaine.');
  }
  if (input.command.event.expectedRevision !== before.dossier.revision) {
    throw new HopV55QualifiedStudyPreferenceError('staleRevision', 'La préférence exacte attend une autre révision dossier; elle ne sera ni reconstruite ni déplacée.');
  }
  try {
    const result = await input.qualifiedStudies.append({ ownerKey: input.command.ownerKey,
      dossierId: input.command.dossierId, event: clone(input.command.event) });
    const after = await readCurrentAdvice(input.qualifiedStudies, input.command, preparation);
    const committed = after.events.find(event => event.eventId === input.command.event.eventId);
    if (!committed || !exactEvent(committed, input.command.event)) {
      throw new HopV55QualifiedStudyPreferenceError('invalidStoredRecord', 'L’append n’a pas produit l’événement exact et relisible.');
    }
    if (committed.kind !== 'strategyPreferred') {
      throw new HopV55QualifiedStudyPreferenceError('invalidStoredRecord', 'L’event relu n’est pas strategyPreferred.');
    }
    return { status: result.status === 'duplicate' ? 'alreadyAppended' : 'appended',
      repositoryStatus: result.status, freshContext: freshness, command: input.command, link,
      dossierAdvice3: after.dossier, eventAdvice3: committed, eventsAdvice3: after.events };
  } catch (error) {
    if (error instanceof HopV55QualifiedStudyPreferenceError) throw error;
    throw error;
  }
}
