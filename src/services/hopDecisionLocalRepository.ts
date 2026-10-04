import Dexie, { type Table } from 'dexie';
import { hopDecisionReference } from '../domain/hopDecision/measurements';
import { applyHopAdviceEvent, createHopAdviceDossier, HopAdviceDossierError,
  type CreateHopAdviceDossierInput, type HopAdviceDossierV3, type HopAdviceEventV3 } from '../domain/hopDecision/adviceDossier';
import {
  applyHopDecisionEvent,
  applyHopDecisionEventV2,
  assertHopDecisionSupersedesFormatCompatible,
  createHopDecisionDossier,
  createHopDecisionDossierV2,
  hopDecisionEventContentReference,
  readHopDecisionDossier,
  readHopDecisionEvent,
  HopDecisionDossierError,
  type CreateHopDecisionDossierInput,
  type CreateHopDecisionDossierV2Input,
  type HopDecisionDossierRead,
  type HopDecisionDossierV1,
  type HopDecisionDossierV2,
  type HopDecisionEventRead,
  type HopDecisionEventV1,
  type HopDecisionEventV2,
  type HopDecisionWritableEvent,
} from '../domain/hopDecision/dossier';

export const DEFAULT_HOP_DECISION_DATABASE_NAME = 'laffinee-hop-decision-local-v1';
const DEXIE_SCHEMA_VERSION = 1;
const NATIVE_INDEXED_DB_VERSION = DEXIE_SCHEMA_VERSION * 10;

export class HopDecisionLocalRepositoryError extends Error {
  constructor(readonly code: 'invalidInput' | 'notFound' | 'staleRevision' | 'eventIdConflict' | 'dossierIdConflict'
    | 'unsupportedFormat' | 'invalidStoredRecord' | 'invalidTransition', message: string) {
    super(message);
    this.name = 'HopDecisionLocalRepositoryError';
  }
}

interface StoredDossierRow {
  ownerKey: string;
  dossierId: string;
  formatVersion: number;
  [key: string]: unknown;
}

interface StoredEventRow {
  ownerKey: string;
  dossierId: string;
  eventId: string;
  eventFormatVersion: number;
  resultingRevision: number;
  [key: string]: unknown;
}

class HopDecisionDatabase extends Dexie {
  dossiers!: Table<StoredDossierRow, [string, string]>;
  events!: Table<StoredEventRow, [string, string]>;

  constructor(databaseName: string) {
    super(databaseName, dexieOptionsFor(databaseName));
    this.version(DEXIE_SCHEMA_VERSION).stores({
      dossiers: '[ownerKey+dossierId], ownerKey, formatVersion, updatedAt',
      events: '[ownerKey+eventId], [ownerKey+dossierId], &[ownerKey+dossierId+resultingRevision], ownerKey, dossierId, eventFormatVersion, kind, recordedAt',
    });
  }
}

/**
 * Dexie 4 retries a VersionError with an unversioned open, then can patch an
 * unexpected schema to a higher native version. Reject every such retry for
 * our isolated databases. The lock is checked by the IndexedDB open request
 * itself, so an upgrade racing the first read cannot slip between a preflight
 * and a second open.
 */
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
        // Only a brand-new database can be initialized by this first local schema.
        // Abort before Dexie's own upgrader can create or patch any stores.
        event.stopImmediatePropagation();
        request.transaction?.abort();
      }
    }, { once: true });
    return request;
  } } };
}

export interface CreateLocalDossierResult {
  status: 'created' | 'duplicate';
  dossier: HopDecisionDossierRead;
  event: HopDecisionEventRead;
}

export interface AppendLocalEventResult {
  status: 'appended' | 'duplicate';
  dossier: HopDecisionDossierRead;
  event: HopDecisionEventRead;
}

export interface HopDecisionLocalRepository {
  /** Create the immutable study row and its first studySaved event atomically. */
  create(input: CreateHopDecisionDossierInput | CreateHopDecisionDossierV2Input | CreateHopAdviceDossierInput): Promise<CreateLocalDossierResult>;
  /** Append one local event and advance only the dossier projection, in one IDB transaction. */
  append(input: { ownerKey: string; dossierId: string; event: HopDecisionWritableEvent }): Promise<AppendLocalEventResult>;
  read(ownerKey: string, dossierId: string): Promise<HopDecisionDossierRead | null>;
  list(ownerKey: string): Promise<HopDecisionDossierRead[]>;
  readEvents(ownerKey: string, dossierId: string): Promise<HopDecisionEventRead[]>;
  /** Closes this Dexie connection. It never deletes or resets the database. */
  close(): void;
}

function requireOwner(ownerKey: string): void {
  if (typeof ownerKey !== 'string' || !ownerKey.trim() || ownerKey.trim() !== ownerKey) throw new HopDecisionLocalRepositoryError('invalidInput', 'Une clé de compte/profil locale explicite, déjà normalisée, est requise.');
}

function convertDomainError(error: unknown): never {
  if (error instanceof HopDecisionDossierError || error instanceof HopAdviceDossierError) {
    const code = error.code === 'unsupportedFormat' ? 'unsupportedFormat'
      : error.code === 'staleRevision' ? 'staleRevision'
        : error.code === 'invalidTransition' ? 'invalidTransition' : 'invalidInput';
    throw new HopDecisionLocalRepositoryError(code, error.message);
  }
  throw error;
}

type SupportedHopDecisionDossier = HopDecisionDossierV1 | HopDecisionDossierV2 | HopAdviceDossierV3;
type SupportedHopDecisionEvent = HopDecisionEventV1 | HopDecisionEventV2 | HopAdviceEventV3;
type OptionRetainedEvent = Extract<SupportedHopDecisionEvent, { kind: 'optionRetained' }>;

function supportedDossier(value: unknown, ownerKey: string, dossierId: string): SupportedHopDecisionDossier {
  let parsed: HopDecisionDossierRead;
  try { parsed = readHopDecisionDossier(value); } catch (error) { return convertDomainError(error); }
  if (parsed.ownerKey !== ownerKey || parsed.dossierId !== dossierId) {
    throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas aux identités persistées.');
  }
  if ('status' in parsed && parsed.status === 'unsupportedFormat') {
    throw new HopDecisionLocalRepositoryError('unsupportedFormat', `Dossier conservé en lecture seule (format ${parsed.formatVersion}, motif ${parsed.reason}).`);
  }
  return parsed as SupportedHopDecisionDossier;
}

function supportedEvent(value: unknown, ownerKey: string, dossierId: string): SupportedHopDecisionEvent {
  let parsed: HopDecisionEventRead;
  try { parsed = readHopDecisionEvent(value); } catch (error) { return convertDomainError(error); }
  if (parsed.ownerKey !== ownerKey || parsed.dossierId !== dossierId) {
    throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas aux identités persistées.');
  }
  if ('status' in parsed && parsed.status === 'unsupportedEventFormat') {
    throw new HopDecisionLocalRepositoryError('unsupportedFormat', `Événement conservé en lecture seule (format ${parsed.eventFormatVersion}).`);
  }
  return parsed as SupportedHopDecisionEvent;
}

function sameStudy(a: SupportedHopDecisionDossier, b: SupportedHopDecisionDossier): boolean {
  return a.ownerKey === b.ownerKey && a.dossierId === b.dossierId
    && a.supersedesDossierId === b.supersedesDossierId
    && a.formatVersion === b.formatVersion
    && hopDecisionReference(a.study) === hopDecisionReference(b.study);
}

function ensureSuccessorLink(
  database: HopDecisionDatabase,
  ownerKey: string,
  dossierId: string,
  successorDossierId: string,
): Promise<SupportedHopDecisionDossier> {
  return database.dossiers.get([ownerKey, successorDossierId]).then(raw => {
    if (!raw) throw new HopDecisionLocalRepositoryError('invalidTransition', 'Le dossier successeur doit être enregistré sous le même ownerKey avant la correction/supersession.');
    const successor = supportedDossier(raw, ownerKey, successorDossierId);
    if (successor.supersedesDossierId !== dossierId) throw new HopDecisionLocalRepositoryError('invalidTransition', 'Le dossier successeur ne référence pas ce dossier comme origine.');
    return successor;
  });
}

export function createHopDecisionLocalRepository(options: { databaseName?: string } = {}): HopDecisionLocalRepository {
  const databaseName = options.databaseName ?? DEFAULT_HOP_DECISION_DATABASE_NAME;
  if (typeof databaseName !== 'string' || !databaseName.trim()) throw new HopDecisionLocalRepositoryError('invalidInput', 'Nom de base locale vide.');
  const database = new HopDecisionDatabase(databaseName);

  return {
    async create(input) {
      requireOwner(input.ownerKey);
      let created: ReturnType<typeof createHopDecisionDossier> | ReturnType<typeof createHopDecisionDossierV2> | ReturnType<typeof createHopAdviceDossier>;
      try {
        created = 'formatVersion' in input.study && input.study.formatVersion === 3 ? createHopAdviceDossier(input as CreateHopAdviceDossierInput)
          : 'formatVersion' in input.study && input.study.formatVersion === 2 ? createHopDecisionDossierV2(input as CreateHopDecisionDossierV2Input)
          : createHopDecisionDossier(input as CreateHopDecisionDossierInput);
      } catch (error) { return convertDomainError(error); }

      return database.transaction('rw', database.dossiers, database.events, async () => {
        const dossierKey: [string, string] = [input.ownerKey, input.dossierId];
        const eventKey: [string, string] = [input.ownerKey, input.eventId];
        const [existingDossier, existingEvent] = await Promise.all([
          database.dossiers.get(dossierKey),
          database.events.get(eventKey),
        ]);
        if (existingDossier) {
          const storedDossier = supportedDossier(existingDossier, input.ownerKey, input.dossierId);
          if (storedDossier.formatVersion !== created.dossier.formatVersion) {
            throw new HopDecisionLocalRepositoryError('dossierIdConflict', 'Le dossier existe déjà sous un autre format; un ID distinct est requis pour conserver l’historique.');
          }
        }
        if (existingEvent) {
          if (existingEvent.ownerKey !== input.ownerKey || existingEvent.eventId !== input.eventId) throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'La clé d’événement IndexedDB ne correspond pas à ses identités persistées.');
          if (existingEvent.dossierId !== input.dossierId) throw new HopDecisionLocalRepositoryError('eventIdConflict', 'Ce eventId est déjà utilisé par un autre dossier du même compte.');
          const storedEvent = supportedEvent(existingEvent, input.ownerKey, input.dossierId);
          if (storedEvent.eventFormatVersion !== created.event.eventFormatVersion
            || storedEvent.eventFormatVersion !== created.dossier.formatVersion) {
            throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'Le rejeu utilise une version d’événement incompatible avec le dossier existant.');
          }
          if (hopDecisionEventContentReference(storedEvent) !== hopDecisionEventContentReference(created.event)) {
            throw new HopDecisionLocalRepositoryError('eventIdConflict', 'Ce eventId existe déjà avec un contenu différent.');
          }
          if (!existingDossier) throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'Événement créé sans son dossier correspondant.');
          const storedDossier = supportedDossier(existingDossier, input.ownerKey, input.dossierId);
          if (!sameStudy(storedDossier, created.dossier)) throw new HopDecisionLocalRepositoryError('eventIdConflict', 'Le rejeu de création ne correspond pas au snapshot original.');
          return { status: 'duplicate', dossier: storedDossier, event: storedEvent };
        }
        if (existingDossier) throw new HopDecisionLocalRepositoryError('dossierIdConflict', 'Ce dossierId existe déjà sans le même événement de création.');
        if (input.supersedesDossierId) {
          const rawPrevious = await database.dossiers.get([input.ownerKey, input.supersedesDossierId]);
          if (!rawPrevious) throw new HopDecisionLocalRepositoryError('invalidTransition', 'Le dossier d’origine doit exister sous le même ownerKey avant sa correction.');
          const previous = supportedDossier(rawPrevious, input.ownerKey, input.supersedesDossierId);
          try { assertHopDecisionSupersedesFormatCompatible(created.dossier.formatVersion, previous.formatVersion); }
          catch (error) { return convertDomainError(error); }
        }
        await database.dossiers.add(created.dossier as unknown as StoredDossierRow);
        await database.events.add(created.event as unknown as StoredEventRow);
        return { status: 'created', dossier: created.dossier, event: created.event };
      });
    },

    async append({ ownerKey, dossierId, event }) {
      requireOwner(ownerKey);
      if (event.ownerKey !== ownerKey || event.dossierId !== dossierId) {
        throw new HopDecisionLocalRepositoryError('invalidInput', 'OwnerKey/dossierId doivent correspondre exactement à l’événement fourni.');
      }
      let incoming: SupportedHopDecisionEvent;
      try {
        const parsed = readHopDecisionEvent(event);
        if ('status' in parsed) throw new HopDecisionLocalRepositoryError('unsupportedFormat', `Format d’événement non pris en charge (${parsed.eventFormatVersion}).`);
        incoming = parsed;
      } catch (error) { return convertDomainError(error); }
      return database.transaction('rw', database.dossiers, database.events, async () => {
        const rawDossier = await database.dossiers.get([ownerKey, dossierId]);
        if (!rawDossier) {
          const orphanEvent = await database.events.get([ownerKey, incoming.eventId]);
          if (orphanEvent) throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'Événement existant sans son dossier correspondant.');
          throw new HopDecisionLocalRepositoryError('notFound', 'Dossier introuvable pour ce compte/profil local.');
        }
        const current = supportedDossier(rawDossier, ownerKey, dossierId);
        // The new event's own schema and its compatibility with the dossier are checked before idempotency lookup.
        if (incoming.eventFormatVersion !== current.formatVersion) {
          throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'La version entrante ne correspond pas au format du dossier; elle ne peut pas être dédupliquée comme un ancien événement.');
        }
        const existingEvent = await database.events.get([ownerKey, incoming.eventId]);
        if (existingEvent) {
          if (existingEvent.ownerKey !== ownerKey || existingEvent.eventId !== incoming.eventId) throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'La clé d’événement IndexedDB ne correspond pas à ses identités persistées.');
          if (existingEvent.dossierId !== dossierId) throw new HopDecisionLocalRepositoryError('eventIdConflict', 'Ce eventId est déjà utilisé par un autre dossier du même compte.');
          const storedEvent = supportedEvent(existingEvent, ownerKey, dossierId);
          if (storedEvent.eventFormatVersion !== current.formatVersion || storedEvent.eventFormatVersion !== incoming.eventFormatVersion) {
            throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'Le eventId existant appartient à une version incompatible; le rejeu est refusé.');
          }
          if (hopDecisionEventContentReference(storedEvent) !== hopDecisionEventContentReference(incoming)) {
            throw new HopDecisionLocalRepositoryError('eventIdConflict', 'Ce eventId existe déjà avec un contenu différent.');
          }
          return { status: 'duplicate', dossier: current, event: storedEvent };
        }
        event = incoming;
        if (event.kind === 'programPrepared') {
          const preparation = event;
          const retained = await database.events.where('[ownerKey+dossierId]').equals([ownerKey, dossierId]).toArray();
          const prior = retained.map(row => supportedEvent(row, ownerKey, dossierId))
            .find(item => item.kind === 'optionRetained' && item.payload.decisionId === preparation.payload.decisionId
              && item.payload.optionId === preparation.payload.optionId) as OptionRetainedEvent | undefined;
          if (!prior) {
            throw new HopDecisionLocalRepositoryError('invalidTransition', 'La préparation doit référencer une option préalablement retenue dans ce dossier.');
          }
        }
        if (event.kind === 'correctionRecorded' || event.kind === 'supersededBy') {
          await ensureSuccessorLink(database, ownerKey, dossierId, event.payload.successorDossierId);
        }
        const rows = (await database.events.where('[ownerKey+dossierId]').equals([ownerKey, dossierId]).toArray())
          .sort((a, b) => a.resultingRevision - b.resultingRevision);
        const previousEvents = rows.map(row => supportedEvent(row, ownerKey, dossierId));
        if (event.eventFormatVersion !== current.formatVersion) {
          throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'La version de l’événement ne correspond pas au format du dossier; les journaux ne se mélangent pas.');
        }
        let next: SupportedHopDecisionDossier;
        try {
          if (current.formatVersion === 1 && event.eventFormatVersion === 1) {
            const history = previousEvents.map(item => {
              if (item.eventFormatVersion !== 1) throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'Historique v1 contenant un événement d’une autre version.');
              return item as HopDecisionEventV1;
            });
            next = applyHopDecisionEvent(current, event as HopDecisionEventV1, history);
          } else if (current.formatVersion === 2 && event.eventFormatVersion === 2) {
            const history = previousEvents.map(item => {
              if (item.eventFormatVersion !== 2) throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'Historique v2 contenant un événement d’une autre version.');
              return item as HopDecisionEventV2;
            });
            next = applyHopDecisionEventV2(current, event as HopDecisionEventV2, history);
          } else if (current.formatVersion === 3 && event.eventFormatVersion === 3) {
            const history = previousEvents.map(item => {
              if (item.eventFormatVersion !== 3) throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'Historique v3 contenant un événement d’une autre version.');
              return item as HopAdviceEventV3;
            });
            next = applyHopAdviceEvent(current, event as HopAdviceEventV3, history);
          } else throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'Format d’événement incompatible avec le dossier.');
        } catch (error) { return convertDomainError(error); }
        await database.events.add(event as unknown as StoredEventRow);
        await database.dossiers.put(next as unknown as StoredDossierRow);
        return { status: 'appended', dossier: next, event };
      });
    },

    async read(ownerKey, dossierId) {
      requireOwner(ownerKey);
      if (typeof dossierId !== 'string' || !dossierId.trim()) throw new HopDecisionLocalRepositoryError('invalidInput', 'DossierId vide.');
      const row = await database.dossiers.get([ownerKey, dossierId]);
      if (!row) return null;
      if (row.ownerKey !== ownerKey || row.dossierId !== dossierId) throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas aux identités persistées.');
      return readHopDecisionDossier(row);
    },

    async list(ownerKey) {
      requireOwner(ownerKey);
      const rows = await database.dossiers.where('ownerKey').equals(ownerKey).toArray();
      return rows.sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))
        || a.dossierId.localeCompare(b.dossierId)).map(row => {
        if (row.ownerKey !== ownerKey || typeof row.dossierId !== 'string') throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'Ligne de dossier mal partitionnée.');
        return readHopDecisionDossier(row);
      });
    },

    async readEvents(ownerKey, dossierId) {
      requireOwner(ownerKey);
      if (typeof dossierId !== 'string' || !dossierId.trim()) throw new HopDecisionLocalRepositoryError('invalidInput', 'DossierId vide.');
      const rawDossier = await database.dossiers.get([ownerKey, dossierId]);
      if (!rawDossier) throw new HopDecisionLocalRepositoryError('notFound', 'Dossier introuvable pour ce compte/profil local.');
      if (rawDossier.ownerKey !== ownerKey || rawDossier.dossierId !== dossierId) throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'La clé IndexedDB ne correspond pas aux identités persistées.');
      const rows = await database.events.where('[ownerKey+dossierId]').equals([ownerKey, dossierId]).toArray();
      return rows.sort((a, b) => a.resultingRevision - b.resultingRevision).map(row => {
        if (row.ownerKey !== ownerKey || row.dossierId !== dossierId) throw new HopDecisionLocalRepositoryError('invalidStoredRecord', 'L’événement IndexedDB ne correspond pas à son compte/dossier.');
        const parsed = readHopDecisionEvent(row);
        if ((rawDossier.formatVersion === 1 || rawDossier.formatVersion === 2 || rawDossier.formatVersion === 3) && !('status' in parsed)
          && parsed.eventFormatVersion !== rawDossier.formatVersion) {
          throw new HopDecisionLocalRepositoryError('unsupportedFormat', 'Le journal contient une version d’événement incompatible avec le dossier; aucune histoire mélangée n’est interprétée.');
        }
        return parsed;
      });
    },

    close() { database.close(); },
  };
}
