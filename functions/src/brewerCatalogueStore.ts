import { createHash } from 'node:crypto';
import type { Firestore, Query, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import {
  applyBrewerCatalogueCommand, canonicalBrewerCatalogueFingerprintInput,
  projectBrewerCatalogueEntity, stampBrewerCatalogueFingerprint
} from './brewerCatalogueCore.js';
import {
  assertBrewerCatalogueCommand, brewerCatalogueIdentityKeys,
  type BrewerCatalogueCommand, type BrewerCatalogueEntity,
  type BrewerCatalogueIdentityCandidate, type BrewerCatalogueKind
} from './brewerCatalogueSchema.js';
import type { HopVariety } from './hopIndexSchema.js';
import type { HopKnowledge } from './hopPredictionSchema.js';

const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_MAX_IDENTITY_SCAN = 10_000;
const DEFAULT_LOOKUP_LIMIT = 100;
const MAX_LOCK_KEYS = 350;

export interface BrewerCatalogueReceipt {
  schemaVersion: 1;
  ownerKey: string;
  namespace: string;
  operationId: string;
  commandFingerprint: string;
  kind: BrewerCatalogueKind;
  targetId: string;
  status: 'committed';
  revision: number;
  fingerprint: string;
  committedAt: string;
}

export interface BrewerCatalogueStoreOptions {
  database: Firestore;
  /** Explicit authenticated owner; shared/anonymous stores are not accepted. */
  ownerKey: string;
  /** Stable receipt namespace. Retries may belong to a new job but retain this namespace. */
  namespace: string;
  guard?: (transaction: Transaction, command: BrewerCatalogueCommand) => void | Promise<void>;
  /** Called in the same transaction for both a new commit and a recovered duplicate. */
  attachReceipt?: (transaction: Transaction, receipt: BrewerCatalogueReceipt, command: BrewerCatalogueCommand) => void | Promise<void>;
  /** References consumed by the brewer tools but not yet present in Firestore. */
  loadReferences?: () => Promise<{ varieties: HopVariety[]; knowledge: HopKnowledge[] }>;
  /** Small limits are injectable for deterministic incomplete-scan tests. */
  pageSize?: number;
  maxIdentityScanDocs?: number;
  lookupLimit?: number;
  now?: () => Date;
}

export interface BrewerCatalogueLookupRecord {
  kind: BrewerCatalogueKind;
  id: string;
  record: BrewerCatalogueEntity;
  revision: number;
  fingerprint: string;
  origin: 'persisted' | 'bundled';
  /** Set only for a particular style nested in a shared guide. */
  styleId?: string;
}

export type BrewerCatalogueWriteResult =
  | { status: 'applied' | 'duplicate'; kind: BrewerCatalogueKind; id: string; record: BrewerCatalogueEntity; revision: number; fingerprint: string; receipt: BrewerCatalogueReceipt }
  | { status: 'conflict' | 'invalid'; reason: string; identityCandidates?: BrewerCatalogueIdentityCandidate[] };

export interface BrewerCatalogueStore {
  readReceipts(): Promise<Array<{ operationId: string; kind: BrewerCatalogueKind; targetId: string }>>;
  lookup(input: { kind: BrewerCatalogueKind; query: string }): Promise<{ records: BrewerCatalogueLookupRecord[]; truncated: boolean }>;
  write(command: BrewerCatalogueCommand): Promise<BrewerCatalogueWriteResult>;
}

interface ScannedRecord {
  kind: BrewerCatalogueKind;
  id: string;
  refPath: string;
  record: BrewerCatalogueEntity;
  fingerprint: string;
  revision: number;
  origin: 'persisted' | 'bundled';
  /** An identity key can point to an individual style or to the whole guide. */
  keys: Map<string, Array<BrewerCatalogueIdentityCandidate>>;
}

interface ScanResult {
  records: ScannedRecord[];
  complete: boolean;
  reason?: string;
}

interface IdentityLock {
  schemaVersion: 1;
  key: string;
  records: BrewerCatalogueIdentityCandidate[];
  updatedAt: string;
}

type TransactionOutcome =
  | { status: 'applied' | 'duplicate'; receipt: BrewerCatalogueReceipt }
  | { status: 'conflict' | 'invalid'; reason: string; identityCandidates?: BrewerCatalogueIdentityCandidate[] };

class IdentityScanError extends Error {}

const isPlain = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const clone = <T>(value: T): T => structuredClone(value);
const sha256 = (value: string): string => createHash('sha256').update(value, 'utf8').digest('hex');
const canonical = (value: unknown): string => JSON.stringify(sortJson(value));

function sortJson(value: any): any {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!isPlain(value)) return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => [key, sortJson(child)]));
}

function collectionName(kind: BrewerCatalogueKind): 'hopVarieties' | 'hopKnowledge' {
  return kind === 'hopVariety' ? 'hopVarieties' : 'hopKnowledge';
}

function kindMatches(record: unknown, kind: BrewerCatalogueKind): record is BrewerCatalogueEntity {
  if (!isPlain(record)) return false;
  if (kind === 'hopVariety') return typeof record.id === 'string' && !('kind' in record) && Array.isArray(record.aliases);
  if (kind === 'yeastStrain') return record.kind === 'yeast' && typeof record.id === 'string';
  return record.kind === 'styleGuide' && typeof record.id === 'string';
}

function entityRef(database: Firestore, kind: BrewerCatalogueKind, id: string) {
  return database.doc(`${collectionName(kind)}/${id}`);
}

function styleKeys(record: BrewerCatalogueEntity, styleId: string): string[] {
  if (!('kind' in record) || record.kind !== 'styleGuide') return [];
  const style = record.styles.find(row => row.id === styleId);
  return style ? brewerCatalogueIdentityKeys({ ...record, catalogueMeta: undefined, styles: [style] } as BrewerCatalogueEntity) : [];
}

function keysByOwner(record: BrewerCatalogueEntity, kind: BrewerCatalogueKind, fingerprint: string): Map<string, Array<BrewerCatalogueIdentityCandidate>> {
  const keys = new Map<string, Array<BrewerCatalogueIdentityCandidate>>();
  const add = (key: string, styleId?: string) => {
    const candidate: BrewerCatalogueIdentityCandidate = { kind, id: record.id, fingerprint, ...(styleId ? { styleId } : {}) };
    const rows = keys.get(key) ?? [];
    if (!rows.some(row => row.styleId === candidate.styleId)) rows.push(candidate);
    keys.set(key, rows);
  };
  const allKeys = brewerCatalogueIdentityKeys(record);
  if (kind === 'brewingStyle' && 'kind' in record && record.kind === 'styleGuide') {
    const styleOwned = new Set<string>();
    for (const style of record.styles) {
      for (const key of styleKeys(record, style.id)) { styleOwned.add(key); add(key, style.id); }
    }
    for (const key of allKeys) if (!styleOwned.has(key)) add(key);
  } else {
    for (const key of allKeys) add(key);
  }
  return keys;
}

function recordFromSnapshot(
  doc: QueryDocumentSnapshot,
  kind: BrewerCatalogueKind
): ScannedRecord {
  const data = doc.data();
  if (!kindMatches(data, kind)) throw new IdentityScanError(`Entrée ${doc.ref.path} incohérente avec le catalogue ${kind}.`);
  const record = { ...data, id: data.id ?? doc.id } as BrewerCatalogueEntity;
  if (record.id !== doc.id) throw new IdentityScanError(`L’identifiant porté par ${doc.ref.path} diverge du chemin Firestore.`);
  let input: string;
  try { input = canonicalBrewerCatalogueFingerprintInput(record); }
  catch { throw new IdentityScanError(`Fiche catalogue invalide pendant le contrôle d’identité : ${doc.ref.path}.`); }
  const fingerprint = sha256(input);
  return {
    kind, id: doc.id, refPath: doc.ref.path, record, fingerprint,
    revision: record.catalogueMeta?.revision ?? 0, origin: 'persisted',
    keys: keysByOwner(record, kind, fingerprint)
  };
}

function recordFromReference(raw: unknown, kind: BrewerCatalogueKind): ScannedRecord {
  if (!kindMatches(raw, kind)) throw new IdentityScanError(`Référence bundlée invalide pour ${kind}.`);
  const record = clone(raw) as BrewerCatalogueEntity;
  if (!record.id.trim() || record.id.includes('/')) throw new IdentityScanError(`Identité bundlée invalide pour ${kind}.`);
  let input: string;
  try { input = canonicalBrewerCatalogueFingerprintInput(record); }
  catch { throw new IdentityScanError(`Référence bundlée invalide pour ${kind}/${record.id}.`); }
  const fingerprint = sha256(input);
  return {
    kind, id: record.id, refPath: `${collectionName(kind)}/${record.id}`, record, fingerprint,
    revision: record.catalogueMeta?.revision ?? 0, origin: 'bundled',
    keys: keysByOwner(record, kind, fingerprint)
  };
}

function combinePersistedAndBundled(persisted: ScannedRecord[], bundled: ScannedRecord[]): ScannedRecord[] {
  const byIdentity = new Map<string, ScannedRecord>();
  for (const row of [...bundled, ...persisted]) byIdentity.set(`${row.kind}\0${row.id}`, row);
  return [...byIdentity.values()];
}

function candidateKey(candidate: BrewerCatalogueIdentityCandidate): string {
  return `${candidate.kind}\0${candidate.id}\0${candidate.styleId ?? ''}`;
}

function sortCandidates(rows: BrewerCatalogueIdentityCandidate[]): BrewerCatalogueIdentityCandidate[] {
  const byKey = new Map<string, BrewerCatalogueIdentityCandidate>();
  for (const row of rows) byKey.set(candidateKey(row), { ...row, fingerprint: row.fingerprint.toLowerCase() });
  return [...byKey.values()].sort((a, b) => candidateKey(a).localeCompare(candidateKey(b)));
}

function candidatesForKeys(rows: ScannedRecord[], keys: string[]): BrewerCatalogueIdentityCandidate[] {
  const candidates: BrewerCatalogueIdentityCandidate[] = [];
  const requested = new Set(keys);
  for (const row of rows) for (const [key, owners] of row.keys) if (requested.has(key)) candidates.push(...owners);
  return sortCandidates(candidates);
}

function lockDocId(key: string): string { return sha256(key); }

function assertOptions(options: BrewerCatalogueStoreOptions) {
  if (!options.ownerKey.trim() || options.ownerKey === 'anonymous' || options.ownerKey.includes('/')) throw Error('Le store catalogue exige un ownerKey authentifié explicite.');
  if (!options.namespace.trim() || options.namespace.includes('/') || options.namespace === '.' || options.namespace === '..') throw Error('Namespace de reçu invalide.');
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxIdentityScanDocs = options.maxIdentityScanDocs ?? DEFAULT_MAX_IDENTITY_SCAN;
  const lookupLimit = options.lookupLimit ?? DEFAULT_LOOKUP_LIMIT;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 500 || !Number.isInteger(maxIdentityScanDocs) || maxIdentityScanDocs < pageSize || !Number.isInteger(lookupLimit) || lookupLimit < 1) throw Error('Limites de lecture catalogue invalides.');
}

export function createBrewerCatalogueStore(options: BrewerCatalogueStoreOptions): BrewerCatalogueStore {
  assertOptions(options);
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxIdentityScanDocs = options.maxIdentityScanDocs ?? DEFAULT_MAX_IDENTITY_SCAN;
  const lookupLimit = options.lookupLimit ?? DEFAULT_LOOKUP_LIMIT;
  const now = options.now ?? (() => new Date());

  function receiptRef(operationId: string) {
    const id = sha256(`${options.ownerKey}\0${operationId}`);
    return options.database.doc(`brewerJobs/${options.namespace}/catalogueMutations/${id}`);
  }

  async function loadBundledRecords(kind: BrewerCatalogueKind): Promise<ScannedRecord[]> {
    const references = await options.loadReferences?.() ?? { varieties: [], knowledge: [] };
    return kind === 'hopVariety'
      ? references.varieties.map(row => recordFromReference(row, kind))
      : references.knowledge.filter(row => kindMatches(row, kind)).map(row => recordFromReference(row, kind));
  }

  async function scanInTransaction(transaction: Transaction, kind: BrewerCatalogueKind, bundled: ScannedRecord[]): Promise<ScanResult> {
    let query: Query = options.database.collection(collectionName(kind));
    if (kind === 'yeastStrain') query = query.where('kind', '==', 'yeast');
    if (kind === 'brewingStyle') query = query.where('kind', '==', 'styleGuide');
    const records: ScannedRecord[] = [];
    let cursor: QueryDocumentSnapshot | undefined;
    while (true) {
      let page = query.limit(pageSize);
      if (cursor) page = page.startAfter(cursor);
      const snapshot = await transaction.get(page);
      if (snapshot.empty) break;
      for (const doc of snapshot.docs) {
        records.push(recordFromSnapshot(doc, kind));
        if (records.length > maxIdentityScanDocs) return { records: [], complete: false, reason: 'identity-check-incomplete: le scan exhaustif dépasse la limite configurée.' };
      }
      if (snapshot.size < pageSize) break;
      cursor = snapshot.docs[snapshot.docs.length - 1];
    }
    const combined = combinePersistedAndBundled(records, bundled);
    if (combined.length > maxIdentityScanDocs) return { records: [], complete: false, reason: 'identity-check-incomplete: références et fiches Firestore dépassent la limite configurée.' };
    return { records: combined, complete: true };
  }

  async function scanForLookup(kind: BrewerCatalogueKind, bundled: ScannedRecord[]): Promise<ScanResult> {
    let query: Query = options.database.collection(collectionName(kind));
    if (kind === 'yeastStrain') query = query.where('kind', '==', 'yeast');
    if (kind === 'brewingStyle') query = query.where('kind', '==', 'styleGuide');
    const records: ScannedRecord[] = [];
    let cursor: QueryDocumentSnapshot | undefined;
    let invalidRows = false;
    while (records.length <= maxIdentityScanDocs) {
      let page = query.limit(pageSize);
      if (cursor) page = page.startAfter(cursor);
      const snapshot = await page.get();
      if (snapshot.empty) break;
      for (const doc of snapshot.docs) {
        try { records.push(recordFromSnapshot(doc, kind)); }
        catch { invalidRows = true; }
        if (records.length > maxIdentityScanDocs) return { records: records.slice(0, maxIdentityScanDocs), complete: false, reason: 'identity-check-incomplete' };
      }
      if (snapshot.size < pageSize) break;
      cursor = snapshot.docs[snapshot.docs.length - 1];
    }
    const combined = combinePersistedAndBundled(records, bundled);
    return { records: combined.slice(0, maxIdentityScanDocs), complete: !invalidRows && combined.length <= maxIdentityScanDocs, reason: invalidRows ? 'identity-check-incomplete' : undefined };
  }

  async function readReceipts(): Promise<Array<{ operationId: string; kind: BrewerCatalogueKind; targetId: string }>> {
    let query: Query = options.database.collection(`brewerJobs/${options.namespace}/catalogueMutations`)
      .where('ownerKey', '==', options.ownerKey).limit(pageSize);
    let cursor: QueryDocumentSnapshot | undefined;
    const result: Array<{ operationId: string; kind: BrewerCatalogueKind; targetId: string }> = [];
    while (true) {
      const page = cursor ? query.startAfter(cursor) : query;
      const snapshot = await page.get();
      if (snapshot.empty) break;
      for (const doc of snapshot.docs) {
        const receipt = doc.data();
        if (receipt.status === 'committed' && receipt.ownerKey === options.ownerKey &&
          typeof receipt.operationId === 'string' && ['hopVariety', 'yeastStrain', 'brewingStyle'].includes(receipt.kind) && typeof receipt.targetId === 'string') {
          result.push({ operationId: receipt.operationId, kind: receipt.kind, targetId: receipt.targetId });
        }
      }
      if (snapshot.size < pageSize) break;
      cursor = snapshot.docs[snapshot.docs.length - 1];
    }
    return result;
  }

  async function lookup(input: { kind: BrewerCatalogueKind; query: string }): Promise<{ records: BrewerCatalogueLookupRecord[]; truncated: boolean }> {
    if (!['hopVariety', 'yeastStrain', 'brewingStyle'].includes(input.kind) || !input.query.trim() || input.query.length > 200) throw Error('Recherche de catalogue invalide.');
    let bundled: ScannedRecord[];
    try { bundled = await loadBundledRecords(input.kind); }
    catch (error) { return { records: [], truncated: true }; }
    const scan = await scanForLookup(input.kind, bundled);
    const needle = input.query.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
    const matches: BrewerCatalogueLookupRecord[] = [];
    for (const row of scan.records) {
      const projection = projectBrewerCatalogueEntity(row.record);
      const haystack = `${row.id}\n${projection.searchTerms.join('\n')}`.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr');
      if (!haystack.includes(needle)) continue;
      matches.push({ kind: row.kind, id: row.id, record: clone(row.record), revision: row.revision, fingerprint: row.fingerprint, origin: row.origin });
      if (row.kind === 'brewingStyle' && 'kind' in row.record && row.record.kind === 'styleGuide') {
        for (const style of row.record.styles) {
          if (styleKeys(row.record, style.id).some(key => key.toLocaleLowerCase('fr').includes(needle))) {
            matches[matches.length - 1].styleId = style.id;
          }
        }
      }
    }
    const truncated = !scan.complete || matches.length > lookupLimit;
    return { records: matches.slice(0, lookupLimit), truncated };
  }

  async function write(command: BrewerCatalogueCommand): Promise<BrewerCatalogueWriteResult> {
    assertBrewerCatalogueCommand(command);
    const commandFingerprint = sha256(canonical(command));
    const committedAt = now().toISOString();
    const receiptDocument = receiptRef(command.operationId);
    const targetKind = command.operation === 'create' ? command.entity.kind : command.target.kind;
    const createAllocatedId = command.operation === 'create' ? options.database.collection(collectionName(targetKind)).doc().id : undefined;
    const createStyleIds = command.operation === 'create' && command.entity.kind === 'brewingStyle'
      ? command.entity.value.styles.map(() => options.database.collection('hopKnowledge').doc().id)
      : undefined;
    const outcome = await options.database.runTransaction<TransactionOutcome>(async transaction => {
      await options.guard?.(transaction, command);
      const priorReceiptSnapshot = await transaction.get(receiptDocument);
      if (priorReceiptSnapshot.exists) {
        const prior = priorReceiptSnapshot.data() as BrewerCatalogueReceipt;
        if (prior.ownerKey !== options.ownerKey || prior.namespace !== options.namespace || prior.operationId !== command.operationId) {
          return { status: 'conflict', reason: 'Le reçu d’opération ne correspond pas au propriétaire courant.' };
        }
        if (prior.commandFingerprint !== commandFingerprint) return { status: 'conflict', reason: 'operationId déjà utilisé avec un contenu différent.' };
        if (prior.status !== 'committed' || !['hopVariety', 'yeastStrain', 'brewingStyle'].includes(prior.kind)) return { status: 'conflict', reason: 'Reçu de catalogue illisible; relire avant toute reprise.' };
        if (prior.kind !== targetKind) return { status: 'conflict', reason: 'Le reçu ne correspond pas au type de catalogue demandé.' };
        const currentRef = entityRef(options.database, prior.kind, prior.targetId);
        const currentSnapshot = await transaction.get(currentRef);
        if (!currentSnapshot.exists) return { status: 'conflict', reason: 'Reçu trouvé mais fiche absente; vérifier l’identité avant toute reprise.' };
        await options.attachReceipt?.(transaction, prior, command);
        return { status: 'duplicate', receipt: prior };
      }

      let bundled: ScannedRecord[];
      try { bundled = await loadBundledRecords(targetKind); }
      catch (error) {
        return { status: 'conflict', reason: `identity-check-incomplete: ${error instanceof Error ? error.message : 'références catalogue indisponibles.'}` };
      }
      const scan = await scanInTransaction(transaction, targetKind, bundled);
      if (!scan.complete) return { status: 'conflict', reason: scan.reason ?? 'identity-check-incomplete' };
      const scanned = scan.records;
      let current: BrewerCatalogueEntity | null = null;
      let currentFingerprint: string | null = null;
      let currentRecord: ScannedRecord | undefined;
      if (command.operation !== 'create') {
        currentRecord = scanned.find(row => row.id === command.target.id);
        if (!currentRecord) {
          const directSnapshot = await transaction.get(entityRef(options.database, command.target.kind, command.target.id));
          if (directSnapshot.exists) return { status: 'conflict', reason: 'La cible existe mais n’appartient pas au type courant; aucun remplacement effectué.' };
          return { status: 'conflict', reason: 'L’identité cible est absente; relire le catalogue avant toute écriture.' };
        }
        current = currentRecord.record;
        currentFingerprint = currentRecord.fingerprint;
        if (currentFingerprint !== command.target.expectedFingerprint.toLowerCase() || currentRecord.revision !== command.target.expectedRevision) {
          return { status: 'conflict', reason: 'La fiche a changé depuis sa lecture; relire révision et empreinte.' };
        }
      }

      const operationKeys = command.operation === 'create'
        ? brewerCatalogueIdentityKeys(command.entity, command.claims, command.projectionChoices)
        : [...new Set([
            ...currentRecord!.keys.keys(),
            ...brewerCatalogueIdentityKeys(current!, command.claims, command.projectionChoices)
          ])].sort();
      if (!operationKeys.length || operationKeys.length > MAX_LOCK_KEYS) return { status: 'conflict', reason: 'identity-check-incomplete: la fiche dépasse le nombre de clés transactionnelles admis.' };

      const identityCandidates = command.operation === 'create' ? candidatesForKeys(scanned, operationKeys) : [];
      if (command.operation !== 'create') {
        const existingKeys = new Set(currentRecord!.keys.keys());
        const nextKeys = new Set(brewerCatalogueIdentityKeys(current!, command.claims, command.projectionChoices));
        const newlyAssertedKeys = [...nextKeys].filter(key => !existingKeys.has(key));
        const collisions = candidatesForKeys(scanned, newlyAssertedKeys).filter(candidate =>
          !(candidate.kind === command.target.kind && candidate.id === command.target.id));
        if (collisions.length) return { status: 'conflict', reason: 'Cette identité possède déjà un nom ou alias attribué à une autre fiche; aucune fusion n’a été faite.', identityCandidates: collisions };
      }

      const lockKeys = new Set(operationKeys);
      for (const candidate of identityCandidates) {
        const candidateRecord = scanned.find(row => row.id === candidate.id && row.kind === candidate.kind);
        for (const key of candidateRecord?.keys.keys() ?? []) lockKeys.add(key);
      }
      if (lockKeys.size > MAX_LOCK_KEYS) return { status: 'conflict', reason: 'identity-check-incomplete: trop de réservations d’identité pour une transaction sûre.' };
      const lockRefs = new Map([...lockKeys].sort().map(key => [key, options.database.doc(`brewerCatalogueIdentityClaims/${sha256(key)}`)]));
      // The document scan inside this transaction is the source of truth. Lock
      // documents only serialize writers; their cached candidates are derived
      // data and may be stale after a permitted client edit that preserves the
      // ledger but changes a legacy field. Read each lock to serialize, then
      // replace its contents below from the current transaction snapshot.
      await Promise.all([...lockRefs.values()].map(ref => transaction.get(ref)));

      const execution = {
        recordedAt: committedAt,
        ...(command.operation === 'create' ? {
          allocatedId: createAllocatedId,
          ...(createStyleIds ? { allocatedStyleIds: createStyleIds } : {}),
          identityCheckComplete: true,
          identityCandidates
        } : { currentFingerprint })
      };
      const reduced = applyBrewerCatalogueCommand(current, command, execution);
      if (reduced.status !== 'applied') return { status: reduced.status, reason: reduced.reason, ...(identityCandidates.length ? { identityCandidates } : {}) };

      const fingerprint = sha256(canonicalBrewerCatalogueFingerprintInput(reduced.record));
      const sealed = stampBrewerCatalogueFingerprint(reduced.record, fingerprint);
      const recordRef = entityRef(options.database, targetKind, sealed.id);
      const revision = sealed.catalogueMeta!.revision;
      const receipt: BrewerCatalogueReceipt = {
        schemaVersion: 1, ownerKey: options.ownerKey, namespace: options.namespace,
        operationId: command.operationId, commandFingerprint, kind: targetKind, targetId: sealed.id,
        status: 'committed', revision, fingerprint, committedAt
      };

      const finalRecordByKey = new Map<string, Array<BrewerCatalogueIdentityCandidate>>();
      for (const row of scanned) {
        if (command.operation !== 'create' && row.id === command.target.id) continue;
        for (const [key, owners] of row.keys) if (lockKeys.has(key)) finalRecordByKey.set(key, [...(finalRecordByKey.get(key) ?? []), ...owners]);
      }
      const sealedKeys = keysByOwner(sealed, targetKind, fingerprint);
      for (const [key, owners] of sealedKeys) if (lockKeys.has(key)) finalRecordByKey.set(key, [...(finalRecordByKey.get(key) ?? []), ...owners]);

      // All reads, including the optional job fence, happen before this first write.
      if (command.operation === 'create') transaction.create(recordRef, sealed);
      else transaction.set(recordRef, sealed);
      for (const [key, ref] of lockRefs) {
        const records = sortCandidates(finalRecordByKey.get(key) ?? []);
        if (!records.length) transaction.delete(ref);
        else transaction.set(ref, { schemaVersion: 1, key, records, updatedAt: committedAt } satisfies IdentityLock);
      }
      transaction.create(receiptDocument, receipt);
      await options.attachReceipt?.(transaction, receipt, command);
      return { status: 'applied', receipt };
    }).catch(error => {
      if (error instanceof IdentityScanError) return { status: 'conflict' as const, reason: error.message };
      throw error;
    });

    if (outcome.status === 'conflict' || outcome.status === 'invalid') return outcome;
    if (!('receipt' in outcome)) throw Error('Résultat de transaction catalogue incomplet.');
    const liveSnapshot = await entityRef(options.database, outcome.receipt.kind, outcome.receipt.targetId).get();
    if (!liveSnapshot.exists) throw Error('Reçu commis mais lecture après écriture absente; le reçu permet une reprise sûre sans recréer la fiche.');
    const liveRecord = { ...liveSnapshot.data(), id: liveSnapshot.data()?.id ?? liveSnapshot.id } as BrewerCatalogueEntity;
    const actualFingerprint = sha256(canonicalBrewerCatalogueFingerprintInput(liveRecord));
    if (liveRecord.catalogueMeta?.fingerprint && liveRecord.catalogueMeta.fingerprint.toLowerCase() !== actualFingerprint) throw Error('La fiche lue après écriture a une empreinte incohérente; conserver le reçu pour inspection.');
    return {
      status: outcome.status, kind: outcome.receipt.kind, id: outcome.receipt.targetId,
      record: liveRecord, revision: liveRecord.catalogueMeta?.revision ?? 0,
      fingerprint: actualFingerprint, receipt: outcome.receipt
    };
  }

  return { readReceipts, lookup, write };
}
