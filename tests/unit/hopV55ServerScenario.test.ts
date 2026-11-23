import { describe, expect, it, vi } from 'vitest';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { brewingScenarioCurrentReference, buildBrewingScenarioRequest, simulateBrewingScenario } from '../../src/domain/brewingScenario';
import {
  createBrewingScenarioDossier,
  readBrewingScenarioRecord,
  type BrewingScenarioRecordRead,
} from '../../src/domain/brewingScenarioDossier';
import {
  createHopV55ScenarioConfirmer,
  type HopV55ServerScenarioClient,
  type HopV55ServerScenarioRecord,
} from '../../src/services/hopV55/serverScenario';
import type { BrewingScenarioResult } from '../../src/domain/brewingScenario';
import type { BrewerScenarioCommand } from '../../functions/src/brewerScenarioStore';

async function scenarioResult(options: { scenarioId?: string; revision?: number; label?: string } = {}): Promise<BrewingScenarioResult> {
  const context = makeHopV55FixtureContext('planning');
  const current = prepareBrewingScenarioContext(context).runtime.current;
  if (!current?.program) throw new Error('La fixture planning doit fournir un programme réel pour le scénario.');
  const request = buildBrewingScenarioRequest({
    scenarioId: options.scenarioId ?? 'hop-v55-confirm-scenario', revision: options.revision ?? 1,
    baseline: { kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
      contextReference: brewingScenarioCurrentReference(current) },
    assumptions: options.label ? [{ id: 'fixture-label', path: 'request.label', label: options.label, status: 'selected',
      origin: 'userHypothesis', explanation: 'Variation déterministe de résultat uniquement pour le test transport.', value: options.label }] : [],
  });
  return simulateBrewingScenario(request, prepareBrewingScenarioContext(context).runtime);
}

function recordFor(result: BrewingScenarioResult, eventId: string, recordedAt = '2026-10-02T11:00:00.000Z') {
  const created = createBrewingScenarioDossier({ ownerKey: 'fixture-owner', scenarioId: result.scenarioId, eventId, recordedAt, result });
  const record = readBrewingScenarioRecord(created.dossier, [created.event]);
  if ('status' in record) throw new Error('Le dossier domaine de test doit être lisible.');
  return { record, event: created.event };
}

function serverRecord(record: BrewingScenarioRecordRead): HopV55ServerScenarioRecord {
  return { ...structuredClone(record), scope: 'serverConfirmed' };
}

function serverWrite(command: BrewerScenarioCommand) {
  if (command.kind !== 'saveResult') throw new Error('La confirmation V5.5 ne doit écrire que saveResult.');
  const result = command.result as BrewingScenarioResult;
  const { record, event } = recordFor(result, command.operationId);
  return {
    status: 'applied' as const,
    receipt: { scope: 'serverConfirmed' as const, scenarioId: event.scenarioId, operationId: event.eventId,
      revision: event.resultingRevision, reference: event.contentReference, committedAt: event.recordedAt },
    record: serverRecord(record),
  };
}

describe('Confirmation serveur du scénario V5.5', () => {
  it('conserve exactement la commande après échec et reprend avec le même operationId', async () => {
    const result = await scenarioResult();
    const read = vi.fn(async () => null);
    const written: BrewerScenarioCommand[] = [];
    const write = vi.fn(async (command: BrewerScenarioCommand) => {
      written.push(structuredClone(command));
      if (written.length === 1) {
        // A bad client cannot mutate the command that will be retried.
        if (command.kind === 'saveResult') (command.result as BrewingScenarioResult).reference = 'mutated-by-transport';
        throw new Error('Connexion interrompue après envoi.');
      }
      return serverWrite(command);
    });
    const confirm = createHopV55ScenarioConfirmer({ read, write });

    await expect(confirm(result)).rejects.toThrow('Connexion interrompue');
    const receipt = await confirm(result);

    expect(read).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(2);
    expect(written[0]).toEqual(written[1]);
    expect(written[0]).toMatchObject({ kind: 'saveResult', scenarioId: result.scenarioId, result: { reference: result.reference } });
    expect(written[0].operationId).toBe(written[1].operationId);
    expect(receipt).toMatchObject({ scope: 'serverConfirmed', scenarioId: result.scenarioId, snapshotReference: result.reference,
      operationId: written[0].operationId, revision: 1 });
  });

  it('relit le reçu exact d’un événement déjà confirmé sans écrire de nouveau', async () => {
    const result = await scenarioResult();
    const committed = recordFor(result, 'server-operation-already-committed', '2026-10-02T11:03:00.000Z');
    const read = vi.fn(async () => serverRecord(committed.record));
    const write = vi.fn();
    const confirm = createHopV55ScenarioConfirmer({ read, write });

    const receipt = await confirm(result);

    expect(read).toHaveBeenCalledExactlyOnceWith(result.scenarioId);
    expect(write).not.toHaveBeenCalled();
    expect(receipt).toEqual({ scope: 'serverConfirmed', scenarioId: committed.event.scenarioId,
      snapshotReference: committed.event.payload.snapshot.reference, operationId: committed.event.eventId,
      revision: committed.event.resultingRevision, reference: committed.event.contentReference,
      committedAt: committed.event.recordedAt });
  });

  it('coalesce deux confirmations concurrentes vers une seule lecture et écriture', async () => {
    const result = await scenarioResult();
    let releaseRead!: (value: null) => void;
    const pendingRead = new Promise<null>(resolve => { releaseRead = resolve; });
    const read = vi.fn(() => pendingRead);
    const write = vi.fn(async (command: BrewerScenarioCommand) => serverWrite(command));
    const confirm = createHopV55ScenarioConfirmer({ read, write });

    const first = confirm(result);
    const second = confirm(structuredClone(result));
    releaseRead(null);
    const [a, b] = await Promise.all([first, second]);

    expect(a).toEqual(b);
    expect(read).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('refuse les révisions concurrentes périmées et les dossiers non pris en charge sans écrire', async () => {
    const current = await scenarioResult({ revision: 1 });
    const stale = await scenarioResult({ revision: 3 });
    const existing = recordFor(current, 'existing-event');
    const write = vi.fn();
    const staleConfirm = createHopV55ScenarioConfirmer({ read: vi.fn(async () => serverRecord(existing.record)), write });
    await expect(staleConfirm(stale)).rejects.toThrow(/autre version est déjà conservée/i);
    expect(write).not.toHaveBeenCalled();

    const unsupported = { scope: 'serverConfirmed' as const, status: 'unsupportedFormat' as const, reason: 'dossierFormat' as const, raw: {} };
    const unsupportedConfirm = createHopV55ScenarioConfirmer({
      read: vi.fn(async () => unsupported as unknown as HopV55ServerScenarioRecord), write,
    });
    await expect(unsupportedConfirm(await scenarioResult({ scenarioId: 'hop-v55-unsupported' })))
      .rejects.toThrow(/format non modifiable/i);
    expect(write).not.toHaveBeenCalled();

    const wrongScopeConfirm = createHopV55ScenarioConfirmer({
      read: vi.fn(async () => ({ ...serverRecord(existing.record), scope: 'local' } as unknown as HopV55ServerScenarioRecord)), write,
    });
    await expect(wrongScopeConfirm(await scenarioResult({ scenarioId: 'hop-v55-wrong-read-scope' })))
      .rejects.toThrow(/sans portée serverConfirmed/i);
    expect(write).not.toHaveBeenCalled();

    const firstRevisionConfirm = createHopV55ScenarioConfirmer({ read: vi.fn(async () => null), write });
    await expect(firstRevisionConfirm(await scenarioResult({ scenarioId: 'hop-v55-first-revision-gap', revision: 2 })))
      .rejects.toThrow(/première prévision serveur doit commencer à la révision 1/i);
    expect(write).not.toHaveBeenCalled();
  });

  it('refuse un reçu ou snapshot retourné qui ne correspond pas au commit demandé et garde la reprise', async () => {
    const result = await scenarioResult();
    const wrong = await scenarioResult({ label: 'Snapshot serveur différent' });
    const read = vi.fn(async () => null);
    const received: BrewerScenarioCommand[] = [];
    const write = vi.fn(async (command: BrewerScenarioCommand) => {
      received.push(structuredClone(command));
      return received.length === 1 ? serverWrite({ ...command,
        ...(command.kind === 'saveResult' ? { result: wrong } : {}) } as BrewerScenarioCommand) : serverWrite(command);
    });
    const confirm = createHopV55ScenarioConfirmer({ read, write });

    await expect(confirm(result)).rejects.toThrow(/événement et le snapshot exacts/i);
    const receipt = await confirm(result);

    expect(received).toHaveLength(2);
    expect(received[0]).toEqual(received[1]);
    expect(received[0].operationId).toBe(received[1].operationId);
    expect(receipt.snapshotReference).toBe(result.reference);
  });

  it('refuse une réponse write de portée locale même si son reçu prétend confirmer le résultat', async () => {
    const result = await scenarioResult();
    const read = vi.fn(async () => null);
    const write = vi.fn(async (command: BrewerScenarioCommand) => {
      const response = serverWrite(command);
      return { ...response, record: { ...response.record, scope: 'local' } } as unknown as ReturnType<typeof serverWrite>;
    });
    const confirm = createHopV55ScenarioConfirmer({ read, write });

    await expect(confirm(result)).rejects.toThrow(/sans portée serverConfirmed/i);
    expect(read).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
  });
});
