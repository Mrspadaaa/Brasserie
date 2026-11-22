import Dexie, { type Table } from 'dexie';
import type { ProofUpload } from '../domain/finance/types';

/**
 * Le magasin local des justificatifs en attente d'envoi (voie d3c). Une ligne par saisie (`submissionId`) : le fichier est gardé tel que le code
 * le consomme, la chaîne `data:…;base64,…`, jusqu'à ce que le lien à la dépense soit confirmé.
 */
export interface ProofJob extends ProofUpload {
  submissionId: string;
  /** `TX-<submissionId>` */
  transactionId: string;
  /** `proof-<submissionId>` ou `proof-<submissionId>-<fileNo>` (un autre fichier = un autre identifiant). */
  documentId: string;
  dataUrl: string;
  mimeType: string;
  /** Le nom lisible prévu dans Drive. */
  driveName: string;
  /** Le nom du fichier tel que reçu de l'appareil. */
  originalName?: string;
  year: number;
  sha256: string;
  bytes: number;
  createdAt: string;
  /** Le réveil du dernier essai, et son heure (ms) : 30 s au moins entre deux essais d'un même job. */
  wakeId?: string;
  lastWakeAt?: number;
  /** La vie de la page de ce dernier essai (le délai de 30 s ne vaut que dans la même vie : un redémarrage est un nouveau réveil), et si cet essai a échoué faute de réseau (aucun serveur atteint : rien n'est compté, rien n'attend). */
  lastLife?: string;
  waited?: boolean;
  /** Le dernier réveil dont l'échec a été compté : un échec ne se compte qu'une fois par réveil. */
  countedWakeId?: string;
  /** Premier échec passager compté (ms) : `failed network` demande aussi un délai minimal (2 h). */
  firstFailureAt?: number;
  lastFailure?: { message: string; at: string };
  /** Heure (ms) où le job est devenu `failed` ou `voided` : la purge locale compte 30 jours à partir d'elle. */
  settledAt?: number;
}

/** Le contrat commun du magasin Dexie et du magasin mémoire des tests. */
export interface ProofFileStore {
  put(job: ProofJob): Promise<void>;
  get(submissionId: string): Promise<ProofJob | undefined>;
  all(): Promise<ProofJob[]>;
  delete(submissionId: string): Promise<void>;
}

export const PROOF_DATABASE_NAME = 'laffinee-justificatifs';
const DEXIE_SCHEMA_VERSION = 1;
const NATIVE_INDEXED_DB_VERSION = DEXIE_SCHEMA_VERSION * 10;

class ProofDatabase extends Dexie {
  envois!: Table<ProofJob, string>;
  constructor(name: string, options?: ConstructorParameters<typeof Dexie>[1]) {
    super(name, options);
    this.version(DEXIE_SCHEMA_VERSION).stores({ envois: 'submissionId, state, createdAt' });
  }
}

/** Un schéma d'une autre version est refusé tel quel : Dexie ne doit jamais « réparer » la base d'un autre client (modèle : `hopDecisionLocalRepository`). */
function dexieOptions(): ConstructorParameters<typeof Dexie>[1] | undefined {
  if (typeof indexedDB === 'undefined') return undefined;
  const native = indexedDB;
  return { indexedDB: { open(name: string, version?: number) {
    if (name !== PROOF_DATABASE_NAME) return native.open(name, version);
    if (version !== NATIVE_INDEXED_DB_VERSION) {
      const error = new Error(`La version IndexedDB de ${name} n’est pas prise en charge par ce client.`);
      error.name = 'VersionError';
      throw error;
    }
    const request = native.open(name, version);
    request.addEventListener('upgradeneeded', event => {
      if ((event as IDBVersionChangeEvent).oldVersion > 0) { event.stopImmediatePropagation(); request.transaction?.abort(); }
    }, { once: true });
    return request;
  } } } as ConstructorParameters<typeof Dexie>[1];
}

/** Le magasin Dexie ; `null` sans IndexedDB (jsdom, node, navigation privée refusée). */
export function createDexieProofStore(name = PROOF_DATABASE_NAME): ProofFileStore | null {
  if (typeof indexedDB === 'undefined') return null;
  let db: ProofDatabase | undefined;
  const open = () => (db ??= new ProofDatabase(name, dexieOptions()));
  return {
    // Dexie rend la main quand la transaction IndexedDB est terminée : l'écriture est durable.
    put: async job => { await open().envois.put(job); },
    get: async id => open().envois.get(id),
    all: async () => open().envois.toArray(),
    delete: async id => { await open().envois.delete(id); },
  };
}

/** Un magasin en mémoire : les tests, ou tout contexte sans IndexedDB qui veut tout de même la file. */
export function createMemoryProofStore(): ProofFileStore & { rows: Map<string, ProofJob> } {
  const rows = new Map<string, ProofJob>();
  return {
    rows,
    put: async job => { rows.set(job.submissionId, structuredClone(job)); },
    get: async id => { const row = rows.get(id); return row ? structuredClone(row) : undefined; },
    all: async () => [...rows.values()].map(row => structuredClone(row)),
    delete: async id => { rows.delete(id); },
  };
}
