import type { BrewerScenarioCommand, BrewerScenarioReceipt } from '../../../functions/src/brewerScenarioStore';
import { assertBrewingScenarioResult, type BrewingScenarioResult } from '../../domain/brewingScenario';
import type { BrewingScenarioEventV1, BrewingScenarioRecordRead, BrewingScenarioRecordResult } from '../../domain/brewingScenarioDossier';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { BrewingScenarios } from '../brewingScenarios';

export type HopV55ServerScenarioRecord = BrewingScenarioRecordResult & { scope: 'serverConfirmed' };

export interface HopV55ServerScenarioWriteResult {
  status: 'applied' | 'duplicate';
  receipt: BrewerScenarioReceipt;
  record: HopV55ServerScenarioRecord;
}

/** Injectable browser transport. Its scope must be returned by the authenticated server adapter. */
export interface HopV55ServerScenarioClient {
  read(scenarioId: string): Promise<HopV55ServerScenarioRecord | null>;
  write(command: BrewerScenarioCommand): Promise<HopV55ServerScenarioWriteResult>;
}

export type HopV55ServerScenarioReceipt = BrewerScenarioReceipt & { snapshotReference: string };

type AvailableServerRecord = BrewingScenarioRecordRead & { scope: 'serverConfirmed' };
type ResultEvent = Extract<BrewingScenarioEventV1, { kind: 'resultSaved' | 'resultRevised' }>;
type PendingResultCommand = Extract<BrewerScenarioCommand, { kind: 'saveResult' }>;

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

function availableServerRecord(value: unknown, action: string): AvailableServerRecord {
  if (!isRecord(value) || value.scope !== 'serverConfirmed') {
    throw new Error(`${action} : réponse sans portée serverConfirmed ; la prévision locale reste inchangée.`);
  }
  if ('status' in value) throw new Error(`${action} : dossier serveur dans un format non modifiable ; la prévision locale reste disponible.`);
  if (!isRecord(value.dossier) || !Number.isSafeInteger(value.dossier.currentResultRevision)
    || !Number.isSafeInteger(value.dossier.revision) || !isRecord(value.currentSnapshot)
    || !Array.isArray(value.snapshots) || !Array.isArray(value.events)) {
    throw new Error(`${action} : dossier serveur mal formé ; aucune confirmation locale n’est créée.`);
  }
  return value as unknown as AvailableServerRecord;
}

function resultEvents(record: AvailableServerRecord): ResultEvent[] {
  return record.events.filter((event): event is ResultEvent => event.kind === 'resultSaved' || event.kind === 'resultRevised');
}

function matchingResultEvent(record: AvailableServerRecord, result: BrewingScenarioResult): ResultEvent | undefined {
  return resultEvents(record).find(event => event.scenarioId === result.scenarioId
    && event.payload.snapshot.reference === result.reference
    && event.payload.snapshot.result.reference === result.reference
    && event.payload.snapshot.result.scenarioId === result.scenarioId
    && event.payload.snapshot.result.revision === result.revision);
}

function receiptFromEvent(event: ResultEvent): HopV55ServerScenarioReceipt {
  return {
    scope: 'serverConfirmed', scenarioId: event.scenarioId, snapshotReference: event.payload.snapshot.reference,
    operationId: event.eventId, revision: event.resultingRevision, reference: event.contentReference, committedAt: event.recordedAt,
  };
}

function sameCommitReceipt(receipt: BrewerScenarioReceipt, event: ResultEvent): boolean {
  return receipt.scope === 'serverConfirmed' && receipt.scenarioId === event.scenarioId
    && receipt.operationId === event.eventId && receipt.revision === event.resultingRevision
    && receipt.reference === event.contentReference && receipt.committedAt === event.recordedAt;
}

function operationIdFor(result: BrewingScenarioResult): string {
  return hopAdviceContentReference('hop-v55-confirm-operation-v1', {
    scenarioId: result.scenarioId, revision: result.revision, resultReference: result.reference,
  });
}

function confirmationKey(result: BrewingScenarioResult): string {
  return `${result.scenarioId}\0${result.reference}`;
}

/** Confirms an exact local preview only after an authoritative server read/write response.
 * Failed writes keep their immutable command for an idempotent retry with the same operation ID. */
export function createHopV55ScenarioConfirmer(client: HopV55ServerScenarioClient = BrewingScenarios) {
  const pendingCommands = new Map<string, PendingResultCommand>();
  const inFlight = new Map<string, Promise<HopV55ServerScenarioReceipt>>();

  async function confirmOne(result: BrewingScenarioResult, key: string): Promise<HopV55ServerScenarioReceipt> {
    assertBrewingScenarioResult(result);
    let command = pendingCommands.get(key);
    if (!command) {
      const read = await client.read(result.scenarioId);
      let existing: AvailableServerRecord | undefined;
      if (read !== null) {
        existing = availableServerRecord(read, 'Lecture serveur');
        if (existing.dossier.scenarioId !== result.scenarioId) {
          throw new Error('Le dossier relu ne correspond pas à cette lignée de scénario; aucune écriture n’a été tentée.');
        }
      }

      if (existing) {
        const matching = matchingResultEvent(existing, result);
        if (matching) return receiptFromEvent(matching);
        if (result.revision !== existing.dossier.currentResultRevision + 1) {
          throw new Error('Une autre version est déjà conservée sur le serveur; relis-la avant toute nouvelle confirmation. La prévision locale est intacte.');
        }
      } else if (result.revision !== 1) {
        throw new Error('La première prévision serveur doit commencer à la révision 1; aucune écriture n’a été tentée.');
      }

      command = {
        kind: 'saveResult', scenarioId: result.scenarioId, operationId: operationIdFor(result),
        expectedRevision: existing?.dossier.revision ?? 0, result: structuredClone(result),
        ...(existing ? { previousSnapshotReference: existing.currentSnapshot.reference,
          reason: 'Confirmation explicite d’une nouvelle prévision locale.' } : {}),
      };
      pendingCommands.set(key, structuredClone(command));
    }

    // A transport/mock cannot mutate the retained retry command through its argument.
    const confirmed = await client.write(structuredClone(command));
    if (!confirmed || !['applied', 'duplicate'].includes(confirmed.status)) {
      throw new Error('Réponse de confirmation serveur invalide; reprendre avec la même commande.');
    }
    const record = availableServerRecord(confirmed.record, 'Écriture serveur');
    if (record.dossier.scenarioId !== result.scenarioId) {
      throw new Error('La réponse serveur concerne une autre lignée; le reçu reste non confirmé.');
    }
    const committedEvent = resultEvents(record).find(event => event.eventId === command!.operationId);
    if (!committedEvent || committedEvent.scenarioId !== result.scenarioId
      || committedEvent.payload.snapshot.reference !== result.reference
      || committedEvent.payload.snapshot.result.reference !== result.reference
      || committedEvent.payload.snapshot.result.revision !== result.revision
      || !sameCommitReceipt(confirmed.receipt, committedEvent)) {
      throw new Error('La réponse serveur ne relit pas l’événement et le snapshot exacts de cette prévision; le reçu reste non confirmé.');
    }
    const authoritativeReceipt = receiptFromEvent(committedEvent);
    pendingCommands.delete(key);
    return authoritativeReceipt;
  }

  return async function confirmScenario(result: BrewingScenarioResult): Promise<HopV55ServerScenarioReceipt> {
    const key = confirmationKey(result);
    const running = inFlight.get(key);
    if (running) return structuredClone(await running);
    const attempt = confirmOne(result, key);
    inFlight.set(key, attempt);
    try { return structuredClone(await attempt); }
    finally { if (inFlight.get(key) === attempt) inFlight.delete(key); }
  };
}

