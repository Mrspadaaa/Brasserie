import Dexie, { type Table } from 'dexie';
import type { BrewingScenarioResult } from '../domain/brewingScenario';
import {
  applyBrewingScenarioEvent,
  assertBrewingScenarioSizeLimit,
  createBrewingScenarioBranchPreferenceEvent,
  createBrewingScenarioDossier,
  createBrewingScenarioObservationEvent,
  createBrewingScenarioResultRevisionEvent,
  readBrewingScenarioDossier,
  readBrewingScenarioEvent,
  readBrewingScenarioRecord,
  BrewingScenarioDossierError,
  type BrewingScenarioDossierRead,
  type BrewingScenarioDossierV1,
  type BrewingScenarioEventRead,
  type BrewingScenarioEventV1,
  type BrewingScenarioObservation,
  type BrewingScenarioRecordRead,
} from '../domain/brewingScenarioDossier';

export const DEFAULT_BREWING_SCENARIO_DATABASE_NAME = 'laffinee-brewing-scenarios-local-v1';
export const DEFAULT_BREWING_SCENARIO_SNAPSHOT_MAX_BYTES = 8_000_000;
const DEXIE_SCHEMA_VERSION = 1;
const NATIVE_INDEXED_DB_VERSION = DEXIE_SCHEMA_VERSION * 10;

export class BrewingScenarioLocalRepositoryError extends Error {
  constructor(readonly code: 'invalidInput' | 'notFound' | 'staleRevision' | 'eventIdConflict' | 'scenarioIdConflict'
    | 'unsupportedFormat' | 'invalidStoredRecord' | 'invalidTransition' | 'sizeLimit', message: string) {
    super(message);
    this.name = 'BrewingScenarioLocalRepositoryError';
  }
}

interface StoredDossierRow {
  ownerKey: string;
  scenarioId: string;
  formatVersion: number;
  [key: string]: unknown;
}

interface StoredEventRow {
  ownerKey: string;
  scenarioId: string;
  eventId: string;
  eventFormatVersion: number;
  resultingRevision: number;
  [key: string]: unknown;
}

/** Small adapter contract also makes transaction behavior testable without a browser IndexedDB polyfill. */
export interface BrewingScenarioLocalTable<Row> {
  get(key: unknown): Promise<Row | undefined>;
  add(row: Row): Promise<unknown>;
  put(row: Row): Promise<unknown>;
  where(index: string): { equals(key: unknown): { toArray(): Promise<Row[]> } };
}

export interface BrewingScenarioLocalDatabaseAdapter {
  dossiers: BrewingScenarioLocalTable<StoredDossierRow>;
  events: BrewingScenarioLocalTable<StoredEventRow>;
  transaction<T>(mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T>;
  close(): void;
}

class BrewingScenarioDatabase extends Dexie {
  dossiers!: Table<StoredDossierRow, [string, string]>;
  events!: Table<StoredEventRow, [string, string]>;

  constructor(databaseName: string) {
    super(databaseName, dexieOptionsFor(databaseName));
    this.version(DEXIE_SCHEMA_VERSION).stores({
      dossiers: '[ownerKey+scenarioId], ownerKey, formatVersion, updatedAt',
      events: '[ownerKey+eventId], [ownerKey+scenarioId], &[ownerKey+scenarioId+resultingRevision], ownerKey, scenarioId, eventFormatVersion, kind, recordedAt',
    });
  }
}

/** Never upgrades or patches a pre-existing native database under this isolated name. */
function dexieOptionsFor(databaseName: string): { indexedDB: { open(name: string, version?: number): IDBOpenDBRequest } } | undefined {
  if (typeof indexedDB === 'undefined') return undefined;
  const nativeIndexedDB = indexedDB;
  return { indexedDB: { open(name, version) {
    if (name !== databaseName) return nativeIndexedDB.open(name, version);
    if (version !== NATIVE_INDEXED_DB_VERSION) {
      const error = new Error(`La version IndexedDB de ${name} n’est pas prise en charge par ce client.`);
      error.name = 'VersionError';
      throw error;
    }
    const request = nativeIndexedDB.open(name, version);
    request.addEventListener('upgradeneeded', event => {
      const upgrade = event as IDBVersionChangeEvent;
      if (upgrade.oldVersion > 0) {
        event.stopImmediatePropagation();
        request.transaction?.abort();
      }
    }, { once: true });
    return request;
  } } };
}

export interface SaveBrewingScenarioResultInput {
  ownerKey: string;
  scenarioId: string;
  eventId: string;
  recordedAt: string;
  result: BrewingScenarioResult;
}

export interface AppendBrewingScenarioEventInput {
  ownerKey: string;
  scenarioId: string;
  event: BrewingScenarioEventV1;
}

export type BrewingScenarioLocalSaveResult = {
  scope: 'local';
  status: 'created' | 'duplicate';
  dossier: BrewingScenarioDossierV1;
  event: Extract<BrewingScenarioEventV1, { kind: 'resultSaved' }>;
};

export type BrewingScenarioLocalAppendResult = {
  scope: 'local';
  status: 'appended' | 'duplicate';
  dossier: BrewingScenarioDossierV1;
  event: BrewingScenarioEventV1;
};

export type BrewingScenarioLocalRecordRead =
  | { scope: 'local'; status: 'available'; record: BrewingScenarioRecordRead }
  | { scope: 'local'; status: 'unsupportedFormat'; record: Extract<ReturnType<typeof readBrewingScenarioRecord>, { status: 'unsupportedFormat' }> };

export interface BrewingScenarioLocalRepository {
  /** Save only engine output validated by the pure domain contract. */
  saveResult(input: SaveBrewingScenarioResultInput): Promise<BrewingScenarioLocalSaveResult>;
  /** Append the same pure event command used by a server adapter, with CAS and content-checked idempotence. */
  appendEvent(input: AppendBrewingScenarioEventInput): Promise<BrewingScenarioLocalAppendResult>;
  reviseResult(input: {
    ownerKey: string; scenarioId: string; eventId: string; expectedRevision: number; recordedAt: string;
    previousSnapshotReference: string; reason: string; result: BrewingScenarioResult;
  }): Promise<BrewingScenarioLocalAppendResult>;
  preferBranch(input: {
    ownerKey: string; scenarioId: string; eventId: string; expectedRevision: number; recordedAt: string;
    preferenceId: string; snapshotReference: string; branchId: string; branchReference: string; reason: string; interpretation?: string;
  }): Promise<BrewingScenarioLocalAppendResult>;
  appendObservation(input: {
    ownerKey: string; scenarioId: string; eventId: string; expectedRevision: number; recordedAt: string;
    observationId: string; snapshotReference: string; branchId?: string; observedAt: string; observation: BrewingScenarioObservation;
  }): Promise<BrewingScenarioLocalAppendResult>;
  read(ownerKey: string, scenarioId: string): Promise<BrewingScenarioLocalRecordRead | null>;
  list(ownerKey: string): Promise<Array<{ scope: 'local'; scenarioId: string; result: BrewingScenarioLocalRecordRead }>>;
  readEvents(ownerKey: string, scenarioId: string): Promise<BrewingScenarioEventRead[]>;
  close(): void;
}

function requireOwner(ownerKey: string): void {
  if (typeof ownerKey !== 'string' || !ownerKey.trim() || ownerKey.trim() !== ownerKey) {
    throw new BrewingScenarioLocalRepositoryError('invalidInput', 'Une clé de compte/profil locale explicite, déjà normalisée, est requise.');
  }
}

function mapDomainError(error: unknown): never {
  if (error instanceof BrewingScenarioDossierError) throw new BrewingScenarioLocalRepositoryError(error.code, error.message);
  throw error;
}

function supportedDossier(value: unknown, ownerKey: string, scenarioId: string): BrewingScenarioDossierV1 {
  let parsed: BrewingScenarioDossierRead;
  try { parsed = readBrewingScenarioDossier(value); } catch (error) { return mapDomainError(error); }
  if ('status' in parsed) throw new BrewingScenarioLocalRepositoryError('unsupportedFormat', `Dossier conservé en lecture seule (format ${parsed.formatVersion}).`);
  if (parsed.ownerKey !== ownerKey || parsed.scenarioId !== scenarioId) {
    throw new BrewingScenarioLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas aux identités de dossier persistées.');
  }
  return parsed;
}

function supportedEvent(value: unknown, ownerKey: string, scenarioId: string): BrewingScenarioEventV1 {
  let parsed: BrewingScenarioEventRead;
  try { parsed = readBrewingScenarioEvent(value); } catch (error) { return mapDomainError(error); }
  if ('status' in parsed) throw new BrewingScenarioLocalRepositoryError('unsupportedFormat', `Événement conservé en lecture seule (format ${parsed.eventFormatVersion}).`);
  if (parsed.ownerKey !== ownerKey || parsed.scenarioId !== scenarioId) {
    throw new BrewingScenarioLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas aux identités d’événement persistées.');
  }
  return parsed;
}

function readProjection(dossier: unknown, events: readonly unknown[]): BrewingScenarioLocalRecordRead {
  let record: ReturnType<typeof readBrewingScenarioRecord>;
  const ordered = [...events].sort((a, b) => Number((a as StoredEventRow).resultingRevision) - Number((b as StoredEventRow).resultingRevision));
  try { record = readBrewingScenarioRecord(dossier, ordered); } catch (error) { return mapDomainError(error); }
  if ('status' in record) return { scope: 'local', status: 'unsupportedFormat', record };
  return { scope: 'local', status: 'available', record };
}

function assertRowIdentity(row: Record<string, unknown>, ownerKey: string, scenarioId: string, event = false): void {
  if (row.ownerKey !== ownerKey || row.scenarioId !== scenarioId || (event && typeof row.eventId !== 'string')) {
    throw new BrewingScenarioLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas aux identités de dossier ou d’événement persistées.');
  }
}

function compareEventContent(existing: unknown, incoming: BrewingScenarioEventV1, ownerKey: string, scenarioId: string): BrewingScenarioEventV1 {
  const stored = supportedEvent(existing, ownerKey, scenarioId);
  if (stored.eventFormatVersion !== incoming.eventFormatVersion) {
    throw new BrewingScenarioLocalRepositoryError('unsupportedFormat', 'Le rejeu utilise un format d’événement différent.');
  }
  if (stored.contentReference !== incoming.contentReference) {
    throw new BrewingScenarioLocalRepositoryError('eventIdConflict', 'Ce eventId existe déjà avec un contenu ou un type différents.');
  }
  return stored;
}

function assertWriteSize(dossier: unknown, event: unknown, maxBytes: number): void {
  try {
    assertBrewingScenarioSizeLimit(dossier, maxBytes);
    // Events are separate documents, and result events carry the full immutable snapshot.
    assertBrewingScenarioSizeLimit(event, maxBytes);
  }
  catch (error) { return mapDomainError(error); }
}

export function createBrewingScenarioLocalRepository(options: {
  databaseName?: string;
  maxSnapshotBytes?: number;
  /** Test/host adapter hook; production defaults to an isolated Dexie database. */
  database?: BrewingScenarioLocalDatabaseAdapter;
} = {}): BrewingScenarioLocalRepository {
  const databaseName = options.databaseName ?? DEFAULT_BREWING_SCENARIO_DATABASE_NAME;
  const maxSnapshotBytes = options.maxSnapshotBytes ?? DEFAULT_BREWING_SCENARIO_SNAPSHOT_MAX_BYTES;
  if (typeof databaseName !== 'string' || !databaseName.trim()) throw new BrewingScenarioLocalRepositoryError('invalidInput', 'Nom de base locale vide.');
  if (!Number.isSafeInteger(maxSnapshotBytes) || maxSnapshotBytes <= 0) throw new BrewingScenarioLocalRepositoryError('invalidInput', 'Limite de taille locale invalide.');
  const database = options.database ?? new BrewingScenarioDatabase(databaseName) as unknown as BrewingScenarioLocalDatabaseAdapter;

  const repository: BrewingScenarioLocalRepository = {
    async saveResult(input) {
      requireOwner(input.ownerKey);
      let created: ReturnType<typeof createBrewingScenarioDossier>;
      try { created = createBrewingScenarioDossier(input); } catch (error) { return mapDomainError(error); }
      assertWriteSize(created.dossier, created.event, maxSnapshotBytes);
      return database.transaction('rw', database.dossiers, database.events, async () => {
        const [existingDossier, existingEvent] = await Promise.all([
          database.dossiers.get([input.ownerKey, input.scenarioId]),
          database.events.get([input.ownerKey, input.eventId]),
        ]);
        if (existingEvent) {
          if (existingEvent.ownerKey !== input.ownerKey || existingEvent.eventId !== input.eventId) {
            throw new BrewingScenarioLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas à l’identité d’événement persistée.');
          }
          if (existingEvent.scenarioId !== input.scenarioId) throw new BrewingScenarioLocalRepositoryError('eventIdConflict', 'Ce eventId appartient déjà à un autre scénario du même compte.');
          const storedEvent = compareEventContent(existingEvent, created.event, input.ownerKey, input.scenarioId);
          if (!existingDossier) throw new BrewingScenarioLocalRepositoryError('invalidStoredRecord', 'Événement initial sans projection de dossier correspondante.');
          assertRowIdentity(existingDossier as unknown as Record<string, unknown>, input.ownerKey, input.scenarioId);
          const history = await database.events.where('[ownerKey+scenarioId]').equals([input.ownerKey, input.scenarioId]).toArray();
          const read = readProjection(existingDossier, history);
          if (read.status !== 'available') throw new BrewingScenarioLocalRepositoryError('unsupportedFormat', 'Le dossier existe dans un format conservé en lecture seule.');
          const firstEvent = read.record.events[0];
          if (firstEvent.eventId !== storedEvent.eventId || read.record.events[0].contentReference !== created.event.contentReference) {
            throw new BrewingScenarioLocalRepositoryError('eventIdConflict', 'Le rejeu de création ne correspond pas au snapshot initial.');
          }
          return { scope: 'local', status: 'duplicate', dossier: read.record.dossier, event: storedEvent };
        }
        if (existingDossier) throw new BrewingScenarioLocalRepositoryError('scenarioIdConflict', 'Ce scénario existe déjà sans l’événement initial correspondant.');
        await database.dossiers.add(created.dossier as unknown as StoredDossierRow);
        await database.events.add(created.event as unknown as StoredEventRow);
        return { scope: 'local', status: 'created', dossier: created.dossier, event: created.event };
      });
    },

    async appendEvent({ ownerKey, scenarioId, event }) {
      requireOwner(ownerKey);
      if (event.ownerKey !== ownerKey || event.scenarioId !== scenarioId) {
        throw new BrewingScenarioLocalRepositoryError('invalidInput', 'ownerKey/scenarioId doivent correspondre exactement à l’événement.');
      }
      let incoming: BrewingScenarioEventV1;
      try {
        const parsed = readBrewingScenarioEvent(event);
        if ('status' in parsed) throw new BrewingScenarioLocalRepositoryError('unsupportedFormat', 'Format d’événement conservé en lecture seule.');
        incoming = parsed;
      } catch (error) { return mapDomainError(error); }
      return database.transaction('rw', database.dossiers, database.events, async () => {
        const rawDossier = await database.dossiers.get([ownerKey, scenarioId]);
        if (!rawDossier) throw new BrewingScenarioLocalRepositoryError('notFound', 'Dossier scénario introuvable pour ce compte/profil local.');
        assertRowIdentity(rawDossier as unknown as Record<string, unknown>, ownerKey, scenarioId);
        const current = supportedDossier(rawDossier, ownerKey, scenarioId);
        if (incoming.eventFormatVersion !== current.formatVersion) {
          throw new BrewingScenarioLocalRepositoryError('unsupportedFormat', 'Format d’événement incompatible avec le dossier actuel.');
        }
        const priorEvent = await database.events.get([ownerKey, incoming.eventId]);
        if (priorEvent) {
          if (priorEvent.ownerKey !== ownerKey || priorEvent.eventId !== incoming.eventId) {
            throw new BrewingScenarioLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas à l’identité d’événement persistée.');
          }
          if (priorEvent.scenarioId !== scenarioId) throw new BrewingScenarioLocalRepositoryError('eventIdConflict', 'Ce eventId appartient déjà à un autre scénario du même compte.');
          const storedEvent = compareEventContent(priorEvent, incoming, ownerKey, scenarioId);
          const history = await database.events.where('[ownerKey+scenarioId]').equals([ownerKey, scenarioId]).toArray();
          const read = readProjection(rawDossier, history);
          if (read.status !== 'available') throw new BrewingScenarioLocalRepositoryError('unsupportedFormat', 'Le dossier est conservé en lecture seule.');
          return { scope: 'local', status: 'duplicate', dossier: read.record.dossier, event: storedEvent };
        }
        const rows = await database.events.where('[ownerKey+scenarioId]').equals([ownerKey, scenarioId]).toArray();
        const previousEvents = rows.map(row => {
          assertRowIdentity(row as unknown as Record<string, unknown>, ownerKey, scenarioId, true);
          return supportedEvent(row, ownerKey, scenarioId);
        }).sort((a, b) => a.resultingRevision - b.resultingRevision);
        let next: BrewingScenarioDossierV1;
        try { next = applyBrewingScenarioEvent(current, incoming, previousEvents); }
        catch (error) { return mapDomainError(error); }
        assertWriteSize(next, incoming, maxSnapshotBytes);
        await database.events.add(incoming as unknown as StoredEventRow);
        await database.dossiers.put(next as unknown as StoredDossierRow);
        return { scope: 'local', status: 'appended', dossier: next, event: incoming };
      });
    },

    reviseResult(input) {
      requireOwner(input.ownerKey);
      let event: BrewingScenarioEventV1;
      try { event = createBrewingScenarioResultRevisionEvent(input); } catch (error) { return mapDomainError(error); }
      return repository.appendEvent({ ownerKey: input.ownerKey, scenarioId: input.scenarioId, event });
    },

    preferBranch(input) {
      requireOwner(input.ownerKey);
      let event: BrewingScenarioEventV1;
      try { event = createBrewingScenarioBranchPreferenceEvent(input); } catch (error) { return mapDomainError(error); }
      return repository.appendEvent({ ownerKey: input.ownerKey, scenarioId: input.scenarioId, event });
    },

    appendObservation(input) {
      requireOwner(input.ownerKey);
      let event: BrewingScenarioEventV1;
      try { event = createBrewingScenarioObservationEvent(input); } catch (error) { return mapDomainError(error); }
      return repository.appendEvent({ ownerKey: input.ownerKey, scenarioId: input.scenarioId, event });
    },

    async read(ownerKey, scenarioId) {
      requireOwner(ownerKey);
      if (typeof scenarioId !== 'string' || !scenarioId.trim()) throw new BrewingScenarioLocalRepositoryError('invalidInput', 'scenarioId vide.');
      return database.transaction('r', database.dossiers, database.events, async () => {
        const dossier = await database.dossiers.get([ownerKey, scenarioId]);
        if (!dossier) return null;
        assertRowIdentity(dossier as unknown as Record<string, unknown>, ownerKey, scenarioId);
        const events = await database.events.where('[ownerKey+scenarioId]').equals([ownerKey, scenarioId]).toArray();
        for (const row of events) assertRowIdentity(row as unknown as Record<string, unknown>, ownerKey, scenarioId, true);
        return readProjection(dossier, events);
      });
    },

    async list(ownerKey) {
      requireOwner(ownerKey);
      const rows = await database.dossiers.where('ownerKey').equals(ownerKey).toArray();
      const ordered = rows.sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))
        || a.scenarioId.localeCompare(b.scenarioId));
      const result: Array<{ scope: 'local'; scenarioId: string; result: BrewingScenarioLocalRecordRead }> = [];
      for (const row of ordered) {
        assertRowIdentity(row as unknown as Record<string, unknown>, ownerKey, row.scenarioId);
        const read = await repository.read(ownerKey, row.scenarioId);
        if (read) result.push({ scope: 'local', scenarioId: row.scenarioId, result: read });
      }
      return result;
    },

    async readEvents(ownerKey, scenarioId) {
      requireOwner(ownerKey);
      if (typeof scenarioId !== 'string' || !scenarioId.trim()) throw new BrewingScenarioLocalRepositoryError('invalidInput', 'scenarioId vide.');
      const rawDossier = await database.dossiers.get([ownerKey, scenarioId]);
      if (!rawDossier) throw new BrewingScenarioLocalRepositoryError('notFound', 'Dossier scénario introuvable pour ce compte/profil local.');
      assertRowIdentity(rawDossier as unknown as Record<string, unknown>, ownerKey, scenarioId);
      const rows = await database.events.where('[ownerKey+scenarioId]').equals([ownerKey, scenarioId]).toArray();
      return rows.sort((a, b) => a.resultingRevision - b.resultingRevision).map(row => {
        assertRowIdentity(row as unknown as Record<string, unknown>, ownerKey, scenarioId, true);
        return readBrewingScenarioEvent(row);
      });
    },

    close() { database.close(); },
  };
  return repository;
}
