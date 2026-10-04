import { createHash } from 'node:crypto';
import type { Firestore, Transaction } from 'firebase-admin/firestore';
import { brewingScenarioDossierApi as domain, brewingScenarioArchiveApi as archive } from './brewerTools.js';

export type BrewerScenarioCommand = {
  operationId: string; scenarioId: string; expectedRevision: number;
} & (
  | { kind: 'saveResult'; result: unknown; previousSnapshotReference?: string; reason?: string }
  | { kind: 'observe'; snapshotReference: string; branchId?: string; observationId: string; observedAt: string; observation: unknown }
  | { kind: 'preferBranch'; snapshotReference: string; branchId: string; branchReference: string; preferenceId: string; reason: string; interpretation?: string }
);
export interface BrewerScenarioReceipt {
  scope: 'serverConfirmed'; scenarioId: string; operationId: string;
  revision: number; reference: string; committedAt: string;
}
export interface BrewerScenarioStoreOptions {
  database: Firestore; ownerKey: string; maxSnapshotBytes?: number;
  guard?: (transaction: Transaction) => Promise<void> | void;
  attachReceipt?: (transaction: Transaction, receipt: BrewerScenarioReceipt) => Promise<void> | void;
  now?: () => Date;
}
export interface BrewerScenarioAccess {
  read(scenarioId: string): Promise<any | null>;
  write(command: BrewerScenarioCommand): Promise<{ status: 'applied' | 'duplicate'; receipt: BrewerScenarioReceipt; record: any }>;
}

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const canonical = (value: unknown) => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const plainJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const text = (value: unknown, max = 200): value is string => typeof value === 'string' && !!value.trim() && value.length <= max;

/** Admin-only persistence of the same scenario events as the offline repository.
 * Neither reads nor historical revisions execute a prediction engine. */
export function createBrewerScenarioStore(options: BrewerScenarioStoreOptions): BrewerScenarioAccess {
  if (!text(options.ownerKey)) throw Error('Compte du dossier scénario requis.');
  const db = options.database, maxBytes = options.maxSnapshotBytes ?? 900_000;
  const keyFor = (scenarioId: string) => {
    if (!text(scenarioId)) throw Error('Identifiant de scénario invalide.');
    return hash(`${options.ownerKey}:${scenarioId}`);
  };
  const eventRows = (key: string) => db.collection('brewerScenarioEvents').where('dossierKey', '==', key);
  const checked = (head: any, rows: any[]) => {
    if (head.ownerKey !== options.ownerKey || head.dossier?.ownerKey !== options.ownerKey || head.scenarioId !== head.dossier?.scenarioId)
      throw Error('Le dossier scénario appartient à un autre compte ou contient une identité invalide.');
    const events = rows.map(row => archive.decodeBrewingScenarioArchive(row.event)).sort((a, b) => a.resultingRevision - b.resultingRevision);
    const record = domain.readBrewingScenarioRecord(head.dossier, events);
    return { ...record, scope: 'serverConfirmed' as const };
  };
  const receiptFor = (scenarioId: string, event: any): BrewerScenarioReceipt => ({ scope: 'serverConfirmed', scenarioId,
    operationId: event.eventId, revision: event.resultingRevision, reference: event.contentReference, committedAt: event.recordedAt });

  const read = async (scenarioId: string) => {
    const key = keyFor(scenarioId);
    return db.runTransaction(async tx => {
      const [head, events] = await Promise.all([tx.get(db.doc(`brewerScenarios/${key}`)), tx.get(eventRows(key))]);
      if (!head.exists) return null;
      return checked(head.data(), events.docs.map(row => row.data()));
    }, { readOnly: true });
  };
  return {
    read,
    async write(command) {
      if (!command || !['saveResult', 'observe', 'preferBranch'].includes(command.kind) || !text(command.operationId, 128) || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(command.operationId)
        || !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0) throw Error('Commande de dossier invalide.');
      const key = keyFor(command.scenarioId);
      const headRef = db.doc(`brewerScenarios/${key}`);
      const operationRef = db.doc(`brewerScenarioEvents/${hash(`${options.ownerKey}:${command.operationId}`)}`);
      const commandFingerprint = hash(canonical(command));
      const outcome = await db.runTransaction(async tx => {
        await options.guard?.(tx);
        const [headSnapshot, eventSnapshot, historySnapshot] = await Promise.all([
          tx.get(headRef), tx.get(operationRef), tx.get(eventRows(key))
        ]);
        const head = headSnapshot.data();
        const rows = historySnapshot.docs.map(row => row.data());
        if (!head && rows.length) throw Error('Un historique existe sans projection de dossier lisible; il est conservé pour réparation explicite.');
        const prior = head ? checked(head, rows) : null;
        // A future or damaged format is read-only, even if an old event ID exists.
        if (prior?.status === 'unsupportedFormat') throw Error('Format de dossier conservé en lecture seule.');
        if (eventSnapshot.exists) {
          const stored = eventSnapshot.data()!;
          if (!prior || stored.ownerKey !== options.ownerKey || stored.scenarioId !== command.scenarioId || stored.commandFingerprint !== commandFingerprint)
            throw Error('Identifiant d’opération déjà utilisé pour un autre contenu.');
          const event = archive.decodeBrewingScenarioArchive(stored.event);
          domain.readBrewingScenarioEvent(event);
          const receipt = receiptFor(command.scenarioId, event);
          await options.attachReceipt?.(tx, receipt);
          return { status: 'duplicate' as const, receipt };
        }
        if ((prior?.dossier?.revision ?? 0) !== command.expectedRevision) throw Error('Le dossier scénario a changé : relire sa révision avant de modifier.');
        const recordedAt = (options.now?.() ?? new Date()).toISOString();
        const identity = { ownerKey: options.ownerKey, scenarioId: command.scenarioId, eventId: command.operationId,
          expectedRevision: command.expectedRevision, recordedAt };
        let dossier: any, event: any;
        if (command.kind === 'saveResult' && !prior) {
          if (command.previousSnapshotReference) throw Error('Prédécesseur absent pour la révision du scénario.');
          ({ dossier, event } = domain.createBrewingScenarioDossier({ ...identity, result: command.result }));
        } else {
          if (!prior) throw Error('Dossier scénario introuvable.');
          if (command.kind === 'saveResult') {
            event = domain.createBrewingScenarioResultRevisionEvent({ ...identity, result: command.result,
              previousSnapshotReference: command.previousSnapshotReference, reason: command.reason });
          } else if (command.kind === 'observe') {
            event = domain.createBrewingScenarioObservationEvent({ ...identity, snapshotReference: command.snapshotReference,
              observationId: command.observationId, observedAt: command.observedAt, observation: command.observation,
              ...(command.branchId ? { branchId: command.branchId } : {}) });
          } else if (command.kind === 'preferBranch') {
            event = domain.createBrewingScenarioBranchPreferenceEvent({ ...identity, snapshotReference: command.snapshotReference,
              preferenceId: command.preferenceId, branchId: command.branchId, branchReference: command.branchReference,
              reason: command.reason, ...(command.interpretation ? { interpretation: command.interpretation } : {}) });
          } else throw Error('Opération de dossier inconnue.');
          dossier = domain.applyBrewingScenarioEvent(prior.dossier, event, prior.events);
        }
        const nextHead = plainJson({ id: key, ownerKey: options.ownerKey, scenarioId: command.scenarioId, dossier, updatedAt: recordedAt });
        const eventRow = plainJson({ id: operationRef.id, ownerKey: options.ownerKey, scenarioId: command.scenarioId,
          dossierKey: key, resultingRevision: event.resultingRevision, commandFingerprint, event: archive.encodeBrewingScenarioArchive(event) });
        domain.assertBrewingScenarioSizeLimit(nextHead, maxBytes);
        domain.assertBrewingScenarioSizeLimit(eventRow, maxBytes);
        const receipt = receiptFor(command.scenarioId, event);
        tx.create(operationRef, eventRow);
        if (headSnapshot.exists) tx.update(headRef, nextHead); else tx.create(headRef, nextHead);
        await options.attachReceipt?.(tx, receipt);
        return { status: 'applied' as const, receipt };
      });
      // A real readback follows the transaction; an interrupted answer cannot erase it.
      const record = await read(command.scenarioId);
      if (!record) throw Error('Le reçu existe mais sa relecture est indisponible. Reprendre avec le même identifiant d’opération.');
      return { ...outcome, record };
    }
  };
}
