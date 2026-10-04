import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { buildBrewingScenarioRequest, simulateBrewingScenario, type BrewingScenarioRequest, type BrewingScenarioResult, type BrewingScenarioRuntime } from '../../src/domain/brewingScenario';
import {
  applyBrewingScenarioEvent, createBrewingScenarioDossier, createBrewingScenarioResultRevisionEvent,
  readBrewingScenarioRecord
} from '../../src/domain/brewingScenarioDossier';
import { decodeBrewingScenarioArchive, encodeBrewingScenarioArchive } from '../../src/domain/brewingScenarioArchive';
import { readScenarioBackupGroups, reconcileScenarioBackup, preserveCatalogueOnBackupRestore, type BrewingScenarioDossierApi } from '../../functions/src/scenarioBackupRestore';
import { testHopData, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';

const ownerKey = 'backup-scenario-owner';
const scenarioId = 'backup-scenario-fixture';
const source = { volumeL: 24, yeastId: testHopYeast.id, additions: [{ id: 'hop-1', name: 'Lot témoin', triplet: structuredClone(testHopTriplet) }],
  fermentation: [{ kind: 'primaire' as const, tempC: 20, days: 7 }] };
const runtime: BrewingScenarioRuntime = { engineData: testHopData(), materials: [] };
const result = (revision: number, label = 'Base de test'): BrewingScenarioResult => simulateBrewingScenario(
  buildBrewingScenarioRequest({ scenarioId, revision, baseline: { kind: 'hypothetical', label, input: source } } as BrewingScenarioRequest),
  structuredClone(runtime)
);
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const api: BrewingScenarioDossierApi = { readBrewingScenarioRecord };
const archiveApi = { decodeBrewingScenarioArchive };

function history(revision: number, label = 'Base de test') {
  const first = createBrewingScenarioDossier({ ownerKey, scenarioId, eventId: 'event-initial', recordedAt: '2026-10-01T10:00:00.000Z', result: result(1, label) });
  const events = [first.event];
  let dossier = first.dossier;
  if (revision >= 2) {
    const next = createBrewingScenarioResultRevisionEvent({ ownerKey, scenarioId, eventId: 'event-revision-2', expectedRevision: 1,
      recordedAt: '2026-10-02T10:00:00.000Z', previousSnapshotReference: first.event.payload.snapshot.reference,
      reason: 'Nouvelle simulation de fixture', result: result(2, label) });
    dossier = applyBrewingScenarioEvent(dossier, next, events); events.push(next);
  }
  const key = hash(`${ownerKey}:${scenarioId}`);
  const head = { id: key, data: { id: key, ownerKey, scenarioId, dossier, updatedAt: dossier.updatedAt } };
  const eventRows = events.map(event => {
    const id = hash(`${ownerKey}:${event.eventId}`);
    return { id, data: { id, ownerKey, scenarioId, dossierKey: key, resultingRevision: event.resultingRevision,
      commandFingerprint: 'd'.repeat(64), event } };
  });
  return { key, head, eventRows, events, dossier };
}

describe('restauration des dossiers scénario', () => {
  it('préserve un backup préfixe et ne restaure que le suffixe cohérent vers une base plus ancienne', () => {
    const old = history(1), current = history(2);
    const oldGroup = readScenarioBackupGroups([old.head], old.eventRows, ownerKey, api)[0];
    const currentGroup = readScenarioBackupGroups([current.head], current.eventRows, ownerKey, api)[0];
    expect(reconcileScenarioBackup(oldGroup, currentGroup)).toMatchObject({ kind: 'preserve', eventsToWrite: [] });
    const forward = reconcileScenarioBackup(currentGroup, oldGroup);
    expect(forward).toMatchObject({ kind: 'apply', headToWrite: current.head, eventsToWrite: [current.eventRows[1]] });
    expect(readBrewingScenarioRecord(forward.headToWrite!.data.dossier, [old.events[0], current.events[1]])).toMatchObject({
      dossier: current.dossier, currentSnapshot: { reference: current.dossier.currentSnapshotReference }
    });
  });

  it('refuse une divergence de lignée et une paire tête/historique incomplète', () => {
    const current = history(2), fork = history(2, 'Autre scénario');
    const currentGroup = readScenarioBackupGroups([current.head], current.eventRows, ownerKey, api)[0];
    const forkGroup = readScenarioBackupGroups([fork.head], fork.eventRows, ownerKey, api)[0];
    expect(() => reconcileScenarioBackup(forkGroup, currentGroup)).toThrow(/divergent/);
    expect(() => readScenarioBackupGroups([current.head], [], ownerKey, api)).toThrow();
    expect(() => readScenarioBackupGroups([], current.eventRows, ownerKey, api)).toThrow(/sans projection/);
  });

  it('décode une enveloppe compressée pour la validation, tout en gardant la ligne encodée à écrire', () => {
    const current = history(2);
    const packedRows = current.eventRows.map(row => ({ ...row, data: { ...row.data, event: encodeBrewingScenarioArchive(row.data.event) } }));
    const group = readScenarioBackupGroups([current.head], packedRows, ownerKey, api, archiveApi)[0];
    expect(group.events).toEqual(current.events);
    expect(group.eventRows[0].data.event).toMatchObject({ format: 'brewing-scenario-archive-v1' });
    expect(decodeBrewingScenarioArchive(group.eventRows[0].data.event)).toEqual(current.events[0]);
  });

  it('garde en place une fiche catalogue versionnée plutôt que d’écraser ses assertions avec un backup ancien', () => {
    const current = { id: 'hop', name: 'Nom courant', catalogueMeta: { schemaVersion: 1, revision: 4, claims: [{ id: 'source-claim' }] } };
    expect(preserveCatalogueOnBackupRestore('hopVarieties', current, { id: 'hop', name: 'Nom ancien' })).toBe(true);
    expect(preserveCatalogueOnBackupRestore('hopVarieties', current, structuredClone(current))).toBe(false);
    expect(preserveCatalogueOnBackupRestore('hopVarieties', { id: 'legacy' }, { id: 'legacy', name: 'Restauration classique' })).toBe(false);
    expect(preserveCatalogueOnBackupRestore('recipes', current, { id: 'hop' })).toBe(false);
  });
});
