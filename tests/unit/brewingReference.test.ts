import { describe, expect, it } from 'vitest';
import {
  BREWING_REFERENCE_EVENT_FORMAT_VERSION,
  applyBrewingReferenceCommand,
  brewingReferenceMappingContentReference,
  brewingReferenceEventContentReference,
  brewingReferenceRecordContentReference,
  brewingReferenceVersionContentReference,
  createBrewingReferenceCommand,
  getBrewingReferenceProjection,
  openBrewingReferenceContext,
  readBrewingReferenceRecord,
  suggestNextBrewingReferenceVersion,
  type BrewingReferenceCommandInput,
  type BrewingReferenceEvent,
  type BrewingReferenceEventV1,
  type BrewingReferenceIdentityV1,
  type BrewingReferenceObservationV1,
  type BrewingReferenceVersionV1,
} from '../../src/domain/brewingReference';
import { createBrewingSensoryDefinitionReference, type BrewingSensoryDefinitionReference, type BrewingSensoryDimension, type BrewingSensoryMetric, type BrewingSensoryScale } from '../../src/domain/brewingSensory';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';

const source = { title: 'Fixture sensorielle', author: 'Test', year: 2026, kind: 'judgment' as const, reference: 'fixture:reference' };
const actor = { id: 'brewer-1', label: 'Brasseur témoin' };
const origin = { kind: 'brasseur', description: 'Saisie pendant la dégustation' };

function sensoryDefinition(dimensionVersion = '1', scaleVersion = '1'): BrewingSensoryDefinitionReference {
  const dimension: BrewingSensoryDimension = { id: 'poire', version: dimensionVersion, name: 'Poire', definition: 'Nuance sensorielle de poire.', sourceRefs: [source] };
  const metric: BrewingSensoryMetric = { id: 'note-personnelle', version: '1', kind: 'ordinalNote', name: 'Note déclarée', meaning: 'Appréciation sensorielle personnelle.', unit: null, sourceRefs: [source] };
  const scale: BrewingSensoryScale = { id: 'note-sur-cinq', version: scaleVersion, metricRef: { id: metric.id, version: metric.version }, domain: { min: 1, max: 5 }, labels: [{ value: 1, label: 'Faible' }, { value: 5, label: 'Fort' }], sourceRefs: [source] };
  return createBrewingSensoryDefinitionReference(dimension, metric, scale);
}

const definition1 = sensoryDefinition();
const definition2 = sensoryDefinition('2', '2');
function measurementDefinition(): BrewingSensoryDefinitionReference {
  const dimension: BrewingSensoryDimension = { id: 'acidite', version: '1', name: 'Acidité', definition: 'Mesure analytique d’acidité.', sourceRefs: [source] };
  const metric: BrewingSensoryMetric = { id: 'acidite-mesuree', version: '1', kind: 'measurement', name: 'Acidité titrable', meaning: 'Concentration d’acidité titrable dans la bière.', unit: 'g/L', sourceRefs: [source] };
  const scale: BrewingSensoryScale = { id: 'acidite-domain', version: '1', metricRef: { id: metric.id, version: metric.version }, domain: { min: 0, max: 10 }, sourceRefs: [source] };
  return createBrewingSensoryDefinitionReference(dimension, metric, scale);
}
const measuredDefinition = measurementDefinition();
type LocalCommand = { [K in BrewingReferenceCommandInput['kind']]: Omit<BrewingReferenceCommandInput<K>, 'ownerKey' | 'contextId'> }[BrewingReferenceCommandInput['kind']]
  & Partial<Pick<BrewingReferenceCommandInput, 'ownerKey' | 'contextId'>>;

function referenceVersion(version: string, definition: BrewingSensoryDefinitionReference, predecessor: BrewingReferenceIdentityV1 | null): BrewingReferenceVersionV1 {
  const content = {
    id: 'profil-sensoriel', version, origin, hypotheses: ['Hypothèse de travail explicitement déclarée.'],
    context: { scope: 'dégustation' as const }, author: actor, createdAt: version === '1' ? '2026-10-02T10:00:00.000Z' : '2026-10-02T10:07:00.000Z',
    predecessor, sensoryDefinitions: [definition], content: { note: version === '1' ? 3 : 4 },
  };
  return { ...content, contentReference: brewingReferenceVersionContentReference(content) };
}

function referenceWithDefinitions(version: string, definitions: BrewingSensoryDefinitionReference[]): BrewingReferenceVersionV1 {
  const draft = { ...referenceVersion(version, definitions[0], null), sensoryDefinitions: definitions };
  return { ...draft, contentReference: brewingReferenceVersionContentReference(draft) };
}

function observation(version = 1, definition = definition1): BrewingReferenceObservationV1 {
  return {
    id: 'degustation-1', version, subject: { kind: 'biere', id: 'brassin-7', label: 'Bière du brassin 7' },
    observedAt: '2026-10-01T18:20:00.000Z', author: actor, origin, originalText: version === 1 ? 'Note 3/5, trop poire.' : 'Correction : note 4/5, poire encore trop marquée.',
    dimension: { status: 'resolved', definition },
    scale: { status: 'known', metric: definition.metric!, scale: definition.scale! },
    sense: { kind: 'sensoryRating', value: version === 1 ? 3 : 4 },
    comparison: { kind: 'relative', relationship: 'trop intense', referent: null }, context: { temperatureC: 12 },
  };
}

function analyticalObservation(id: string, value: number | { min: number; max: number }, knownScale = true): BrewingReferenceObservationV1 {
  return { ...observation(), id, originalText: 'Mesure analytique transcrite.',
    dimension: knownScale ? { status: 'resolved', definition: measuredDefinition } : { status: 'unresolved', label: 'acidité' },
    scale: knownScale ? { status: 'known', metric: measuredDefinition.metric!, scale: measuredDefinition.scale! } : { status: 'unknown' },
    sense: { kind: 'analyticalMeasurement', value, unit: 'g/L', basis: 'beer', method: 'Titrage' }, comparison: { kind: 'absolute' } };
}

function initialContext(past: any = { status: 'unknown' }) {
  return { programReference: null, past, details: { beerLabel: 'Bière témoin' } };
}

function makeHarness(past?: any) {
  const opened = openBrewingReferenceContext({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'open-1',
    recordedAt: '2026-10-02T09:00:00.000Z', context: initialContext(past) });
  let record = opened.record;
  const events: BrewingReferenceEvent[] = [opened.event];
  const apply = (command: LocalCommand) => {
    const result = applyBrewingReferenceCommand(record, { ...command, ownerKey: 'user-1', contextId: 'degustation-7' }, events);
    if (!result.duplicate) { record = result.record; events.push(result.event); }
    return result;
  };
  return { opened, apply, events, get record() { return record; } };
}

function legacyV1ReaderUnsupportedEvent(events: readonly BrewingReferenceEvent[]): BrewingReferenceEvent | undefined {
  // Mirrors the pre-activation reader gate: any non-v1 event stays read-only.
  return events.find(event => event.eventFormatVersion !== BREWING_REFERENCE_EVENT_FORMAT_VERSION);
}

function proposalCommand(version: string, definition: BrewingSensoryDefinitionReference, predecessor: BrewingReferenceIdentityV1 | null, expectedRevision: number, commandId: string): BrewingReferenceCommandInput<'referenceProposed'> {
  return { ownerKey: 'user-1', contextId: 'degustation-7', commandId, expectedRevision, recordedAt: version === '1' ? '2026-10-02T10:00:00.000Z' : '2026-10-02T10:07:00.000Z',
    kind: 'referenceProposed', payload: { reference: referenceVersion(version, definition, predecessor) } };
}

function interpretationCommand(input: {
  commandId: string; expectedRevision: number; observationVersion: number; reference: BrewingReferenceIdentityV1;
  definition: BrewingSensoryDefinitionReference; comparability: any; recordedAt?: string;
}): BrewingReferenceCommandInput<'interpretationLinked'> {
  return { ownerKey: 'user-1', contextId: 'degustation-7', commandId: input.commandId, expectedRevision: input.expectedRevision,
    recordedAt: input.recordedAt ?? '2026-10-02T10:05:00.000Z', kind: 'interpretationLinked', payload: { interpretation: {
      id: input.commandId, observationId: 'degustation-1', observationVersion: input.observationVersion, reference: input.reference,
      targetDefinition: input.definition, relation: 'Lecture ultérieure sous cette référence', reason: 'Réancrage explicite après adoption.',
      origin, author: actor, comparability: input.comparability,
    } } };
}

describe('enveloppe de référence sensorielle append-only', () => {
  it('ouvre un contexte sans passé connu, conserve la note relative non ancrée, puis adopte et réancre deux versions sans calculer J5', () => {
    const h = makeHarness();
    expect(h.opened.record.revision).toBe(1);
    expect(h.opened.event.payload.context.past).toEqual({ status: 'unknown' });
    expect('knownAdditions' in h.opened.event.payload.context.past).toBe(false);

    h.apply({ commandId: 'observation-1', expectedRevision: 1, recordedAt: '2026-10-02T09:10:00.000Z', kind: 'observationRecorded', payload: { observation: observation() } });
    const recordedObservation = h.events[1] as Extract<BrewingReferenceEventV1, { kind: 'observationRecorded' }>;
    expect(recordedObservation.recordedAt).not.toBe(recordedObservation.payload.observation.observedAt);
    expect(recordedObservation.payload.observation.comparison).toEqual({ kind: 'relative', relationship: 'trop intense', referent: null });

    h.apply(proposalCommand('1', definition1, null, 2, 'proposal-r1'));
    const r1 = (h.events[2] as Extract<BrewingReferenceEventV1, { kind: 'referenceProposed' }>).payload.reference;
    const r1Identity: BrewingReferenceIdentityV1 = { id: r1.id, version: r1.version, contentReference: r1.contentReference };
    h.apply({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'adopt-r1', expectedRevision: 3,
      recordedAt: '2026-10-02T10:02:00.000Z', kind: 'referenceAdopted', payload: { reference: r1Identity, adoptedBy: actor } });
    h.apply(interpretationCommand({ commandId: 'link-r1', expectedRevision: 4, observationVersion: 1,
      reference: h.record.currentReference!, definition: definition1, comparability: { kind: 'exact' } }));

    // A failed calculation has no command in this envelope: adoption and observations remain readable.
    expect(h.record.revision).toBe(5);
    expect(h.events.some(event => event.kind === 'j5ResultLinked')).toBe(false);
    h.apply({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'link-result-r1', expectedRevision: 5,
      recordedAt: '2026-10-02T10:06:00.000Z', kind: 'j5ResultLinked', payload: { link: {
        id: 'j5-link-1', reference: h.record.currentReference!, result: { scenarioId: 'j5-1', resultId: 'result-1', resultRevision: 4,
          resultReference: 'j5-result:sha256:aaa', snapshotReference: 'j5-snapshot:sha256:bbb' },
        receipt: { status: 'local', receiptId: 'receipt-local-1', localRecordId: 'dexie-result-1', receivedAt: '2026-10-02T10:06:00.000Z' },
      } } });

    h.apply(proposalCommand('2', definition2, h.record.currentReference, 6, 'proposal-r2'));
    const r2 = (h.events[h.events.length - 1] as Extract<BrewingReferenceEventV1, { kind: 'referenceProposed' }>).payload.reference;
    h.apply({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'adopt-r2', expectedRevision: 7,
      recordedAt: '2026-10-02T10:08:00.000Z', kind: 'referenceAdopted', payload: { reference: { id: r2.id, version: r2.version, contentReference: r2.contentReference }, adoptedBy: actor } });
    const oldRetry = h.apply(interpretationCommand({ commandId: 'link-r1', expectedRevision: 4, observationVersion: 1,
      reference: r1Identity, definition: definition1, comparability: { kind: 'exact' } }));
    expect(oldRetry.duplicate).toBe(true);
    expect((oldRetry.event as Extract<BrewingReferenceEventV1, { kind: 'interpretationLinked' }>).payload.interpretation.reference.version).toBe('1');
    expect(() => h.apply(interpretationCommand({ commandId: 'stale-link-r1', expectedRevision: 4, observationVersion: 1,
      reference: r1Identity, definition: definition1, comparability: { kind: 'exact' } }))).toThrow(/périmée/);
    h.apply(interpretationCommand({ commandId: 'link-r2', expectedRevision: 8, observationVersion: 1,
      reference: h.record.currentReference!, definition: definition2, comparability: { kind: 'nonComparable', reason: 'La version de métrique/échelle diffère; aucune conversion n’a été adoptée.' }, recordedAt: '2026-10-02T10:09:00.000Z' }));
    h.apply({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'link-result-r2', expectedRevision: 9,
      recordedAt: '2026-10-02T10:10:00.000Z', kind: 'j5ResultLinked', payload: { link: {
        id: 'j5-link-2', reference: h.record.currentReference!, result: { scenarioId: 'j5-1', resultId: 'result-2', resultRevision: 5,
          resultReference: 'j5-result:sha256:ccc', snapshotReference: 'j5-snapshot:sha256:ddd' },
        receipt: { status: 'serverConfirmed', receiptId: 'receipt-server-2', serverReference: 'firestore:result-2', confirmedAt: '2026-10-02T10:10:00.000Z' },
      } } });
    const mappingDraft = { id: 'mapping-poire-1-vers-2', version: '1', source: { status: 'resolved' as const, definition: definition1 }, target: definition2,
      description: 'Mapping adopté par le brasseur pour cette comparaison seulement.', adopted: true as const, adoptedBy: actor, adoptedAt: '2026-10-02T10:11:00.000Z' };
    const mapping = { ...mappingDraft, contentReference: brewingReferenceMappingContentReference(mappingDraft) };
    h.apply(interpretationCommand({ commandId: 'link-r2-mapped', expectedRevision: 10, observationVersion: 1,
      reference: h.record.currentReference!, definition: definition2, comparability: { kind: 'mapped', mapping }, recordedAt: '2026-10-02T10:12:00.000Z' }));

    const read = readBrewingReferenceRecord(h.record, h.events);
    expect('status' in read).toBe(false);
    if ('status' in read) return;
    const projection = getBrewingReferenceProjection(read);
    expect(projection.currentReference).toEqual(h.record.currentReference);
    expect(projection.references.map(row => row.version)).toEqual(['1', '2']);
    expect(projection.observations).toEqual([observation()]);
    expect(projection.interpretations.map(row => [row.observationVersion, row.reference.version, row.comparability.kind])).toEqual([[1, '1', 'exact'], [1, '2', 'nonComparable'], [1, '2', 'mapped']]);
    expect(projection.j5ResultLinks[0].result.snapshotReference).toBe('j5-snapshot:sha256:bbb');
    expect(projection.j5ResultLinks[0].receipt.status).toBe('local');
    expect(projection.j5ResultLinks[1].receipt.status).toBe('serverConfirmed');
  });

  it('réactive une référence exacte déjà adoptée, garde les archives et réserve le prochain numéro après le maximum historique', () => {
    const h = makeHarness();
    h.apply({ commandId: 'observation-before-reference', expectedRevision: 1, recordedAt: '2026-10-02T09:10:00.000Z', kind: 'observationRecorded', payload: { observation: observation() } });
    h.apply(proposalCommand('1', definition1, null, 2, 'proposal-r1'));
    const r1 = (h.events.at(-1) as Extract<BrewingReferenceEventV1, { kind: 'referenceProposed' }>).payload.reference;
    const r1Identity: BrewingReferenceIdentityV1 = { id: r1.id, version: r1.version, contentReference: r1.contentReference };
    h.apply({ commandId: 'adopt-r1', expectedRevision: 3, recordedAt: '2026-10-02T10:02:00.000Z', kind: 'referenceAdopted', payload: { reference: r1Identity, adoptedBy: actor } });
    h.apply(proposalCommand('2', definition2, r1Identity, 4, 'proposal-r2'));
    const r2 = (h.events.at(-1) as Extract<BrewingReferenceEventV1, { kind: 'referenceProposed' }>).payload.reference;
    const r2Identity: BrewingReferenceIdentityV1 = { id: r2.id, version: r2.version, contentReference: r2.contentReference };
    h.apply({ commandId: 'adopt-r2', expectedRevision: 5, recordedAt: '2026-10-02T10:08:00.000Z', kind: 'referenceAdopted', payload: { reference: r2Identity, adoptedBy: actor } });
    h.apply({ commandId: 'link-r2-result', expectedRevision: 6, recordedAt: '2026-10-02T10:09:00.000Z', kind: 'j5ResultLinked', payload: { link: {
      id: 'result-r2', reference: r2Identity,
      result: { scenarioId: 'scenario-1', resultId: 'result-2', resultRevision: 1, resultReference: 'j5-result:r2', snapshotReference: 'j5-snapshot:r2' },
      receipt: { status: 'local', receiptId: 'receipt-r2', localRecordId: 'result-r2-local', receivedAt: '2026-10-02T10:09:00.000Z' },
    } } });

    const archivedReferences = h.events.filter(event => event.kind === 'referenceProposed').map(event => event.payload.reference);
    expect(suggestNextBrewingReferenceVersion(archivedReferences, r1.id)).toEqual({ status: 'suggested', id: r1.id, version: '3' });
    expect(suggestNextBrewingReferenceVersion([...archivedReferences, { id: 'autre-profil', version: '99' }], r1.id))
      .toEqual({ status: 'suggested', id: r1.id, version: '3' });
    const activationCommand: BrewingReferenceCommandInput<'referenceActivated'> = {
      ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'activate-r1', expectedRevision: 7,
      recordedAt: '2026-10-02T10:10:00.000Z', kind: 'referenceActivated',
      payload: { reference: r1Identity, activatedBy: actor, reason: 'Reprendre la comparaison sur la référence adoptée initialement.' },
    };
    const activation = h.apply(activationCommand);
    expect(activation.event.eventFormatVersion).toBe(2);
    expect(activation.event).toMatchObject({ kind: 'referenceActivated', recordedAt: activationCommand.recordedAt,
      payload: { reference: r1Identity, activatedBy: actor, reason: activationCommand.payload.reason } });
    expect(h.events.filter(event => event.kind === 'referenceAdopted')).toHaveLength(2);
    expect(h.events.filter(event => event.eventFormatVersion === 1)).toHaveLength(h.events.length - 1);
    expect(h.events.find(event => event.eventFormatVersion !== BREWING_REFERENCE_EVENT_FORMAT_VERSION)?.kind).toBe('referenceActivated');

    const revisionAfterActivation = h.record.revision;
    const retry = h.apply(activationCommand);
    expect(retry.duplicate).toBe(true);
    expect(retry.event).toEqual(activation.event);
    expect(h.record.revision).toBe(revisionAfterActivation);
    expect(h.events).toHaveLength(revisionAfterActivation);
    expect(() => h.apply({ ...activationCommand, payload: { ...activationCommand.payload, reason: 'Motif divergent.' } })).toThrow(/contenu différent/);
    expect(() => h.apply({ ...activationCommand, commandId: 'stale-activation', expectedRevision: 7, payload: { ...activationCommand.payload, reference: r2Identity } })).toThrow(/périmée/);
    expect(() => h.apply({ ...activationCommand, commandId: 'activate-current-r1', expectedRevision: h.record.revision,
      payload: { ...activationCommand.payload } })).toThrow(/déjà active/);

    const reusedR2 = proposalCommand('2', definition2, r1Identity, h.record.revision, 'reuse-r2-after-reactivation');
    expect(() => h.apply(reusedR2)).toThrow(/existe déjà/);
    const alteredR2 = { ...r2Identity, contentReference: 'brewing-reference-version-v1:sha256:altered' };
    expect(() => h.apply({ ...activationCommand, commandId: 'activate-altered-r2', expectedRevision: h.record.revision,
      payload: { ...activationCommand.payload, reference: alteredR2 } })).toThrow(/déjà adoptée/);

    const r3Draft = { ...referenceVersion('3', definition2, r1Identity), createdAt: '2026-10-02T10:11:00.000Z' };
    const r3 = { ...r3Draft, contentReference: brewingReferenceVersionContentReference(r3Draft) };
    h.apply({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'proposal-r3', expectedRevision: h.record.revision,
      recordedAt: '2026-10-02T10:11:00.000Z', kind: 'referenceProposed', payload: { reference: r3 } });
    expect(r3.predecessor).toEqual(r1Identity);
    expect(() => h.apply({ ...activationCommand, commandId: 'activate-unadopted-r3', expectedRevision: h.record.revision,
      payload: { ...activationCommand.payload, reference: { id: r3.id, version: r3.version, contentReference: r3.contentReference } } })).toThrow(/déjà adoptée/);

    const restored = readBrewingReferenceRecord(h.record, h.events);
    if ('status' in restored) throw Error('Le lecteur courant doit accepter un journal mixte v1/v2.');
    const projection = getBrewingReferenceProjection(restored);
    expect(restored.events.map(event => event.eventFormatVersion)).toContain(2);
    // A V1 reader's format gate sees the activation as an unsupported event and can keep the record read-only.
    expect(legacyV1ReaderUnsupportedEvent(restored.events)).toMatchObject({ kind: 'referenceActivated', eventFormatVersion: 2 });
    expect(projection.references.map(row => row.version)).toEqual(['1', '2', '3']);
    expect(projection.adoptions.map(row => row.reference.version)).toEqual(['1', '2']);
    expect(projection.currentReference).toEqual(r1Identity);
    expect(projection.context.past).toEqual({ status: 'unknown' });
    expect(projection.observations).toEqual([observation()]);
    expect(projection.interpretations).toEqual([]);
    expect(projection.j5ResultLinks).toHaveLength(1);
    expect(projection.j5ResultLinks[0].reference).toEqual(r2Identity);
    expect(projection.j5ResultLinks[0].result.snapshotReference).toBe('j5-snapshot:r2');
  });

  it('demande une version explicite face à un historique opaque sans interdire les versions texte', () => {
    const h = makeHarness();
    expect(suggestNextBrewingReferenceVersion([], 'profil-sensoriel')).toEqual({ status: 'suggested', id: 'profil-sensoriel', version: '1' });
    h.apply(proposalCommand('beta', definition1, null, 1, 'proposal-beta'));
    const archived = h.events.filter(event => event.kind === 'referenceProposed').map(event => event.payload.reference);
    expect(suggestNextBrewingReferenceVersion(archived, 'profil-sensoriel')).toMatchObject({
      status: 'explicitVersionRequired', id: 'profil-sensoriel', opaqueVersions: ['beta'],
    });
    h.apply(proposalCommand('release-candidate', definition2, null, 2, 'proposal-opaque-explicit'));
    expect((h.events.at(-1) as Extract<BrewingReferenceEventV1, { kind: 'referenceProposed' }>).payload.reference.version).toBe('release-candidate');
  });

  it('préserve le passé complètement déclaré vide et distingue correction, retry idempotent, contenu divergent et CAS concurrent', () => {
    const h = makeHarness({ status: 'declaredComplete', additions: [] });
    expect(h.opened.event.payload.context.past).toEqual({ status: 'declaredComplete', additions: [] });
    const retriedOpen = h.apply({ commandId: 'open-1', expectedRevision: 0, recordedAt: '2026-10-02T09:01:00.000Z', kind: 'contextOpened', payload: { context: initialContext({ status: 'declaredComplete', additions: [] }) } });
    expect(retriedOpen.duplicate).toBe(true);
    h.apply({ commandId: 'observation-1', expectedRevision: 1, recordedAt: '2026-10-02T09:10:00.000Z', kind: 'observationRecorded', payload: { observation: observation() } });
    const correction = { ...observation(2), originalText: 'Transcription corrigée : note 4/5.' };
    const correctionCommand: BrewingReferenceCommandInput<'observationCorrected'> = { ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'correct-1', expectedRevision: 2,
      recordedAt: '2026-10-02T09:20:00.000Z', kind: 'observationCorrected', payload: { observation: correction, correctsVersion: 1, reason: 'Correction de la transcription.' } };
    const first = h.apply(correctionCommand);
    const retried = h.apply({ ...correctionCommand, expectedRevision: 1, recordedAt: '2026-10-02T09:21:00.000Z' });
    expect(first.duplicate).toBe(false);
    expect(retried.duplicate).toBe(true);
    expect(h.events).toHaveLength(3);
    expect((h.events[1] as Extract<BrewingReferenceEventV1, { kind: 'observationRecorded' }>).payload.observation.originalText).toBe('Note 3/5, trop poire.');
    expect((h.events[2] as Extract<BrewingReferenceEventV1, { kind: 'observationCorrected' }>).payload.observation.originalText).toBe('Transcription corrigée : note 4/5.');

    expect(() => h.apply({ ...correctionCommand, payload: { ...correctionCommand.payload, reason: 'Contenu différent.' } })).toThrow(/contenu différent/);
    h.apply({ commandId: 'new-tasting', expectedRevision: 3, recordedAt: '2026-10-02T09:22:00.000Z', kind: 'observationRecorded', payload: { observation: { ...observation(), id: 'degustation-2' } } });
    const competing: BrewingReferenceCommandInput<'observationRecorded'> = { ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'concurrent-tasting', expectedRevision: 3,
      recordedAt: '2026-10-02T09:23:00.000Z', kind: 'observationRecorded', payload: { observation: { ...observation(), id: 'degustation-3' } } };
    expect(() => h.apply(competing)).toThrow(/périmée/);
    expect(() => h.apply({ commandId: 'reused-observation-id', expectedRevision: 4, recordedAt: '2026-10-02T09:24:00.000Z', kind: 'observationRecorded', payload: { observation: { ...observation(), id: 'degustation-2' } } })).toThrow(/nouvelle dégustation/);
    expect(h.record.revision).toBe(4);
  });

  it('garde séparés le qualitatif, la note déclarée sans échelle et la mesure analytique', () => {
    const h = makeHarness();
    const qualitative: BrewingReferenceObservationV1 = { ...observation(), id: 'qualitative-1', originalText: 'Trop rond par rapport au souvenir.',
      dimension: { status: 'unresolved', label: 'rondeur' }, scale: { status: 'unknown' }, sense: { kind: 'qualitative' },
      comparison: { kind: 'relative', relationship: 'trop rond', referent: null } };
    const declaredNote: BrewingReferenceObservationV1 = { ...observation(), id: 'note-1', originalText: 'Note 3, échelle non précisée.',
      dimension: { status: 'unresolved', label: 'poire' }, scale: { status: 'unknown' }, sense: { kind: 'sensoryRating', value: 3 },
      comparison: { kind: 'absolute' } };
    const analytic: BrewingReferenceObservationV1 = { ...observation(), id: 'measure-1', originalText: 'Mesure de laboratoire transcrite.',
      dimension: { status: 'unresolved', label: 'acidité' }, scale: { status: 'unknown' },
      sense: { kind: 'analyticalMeasurement', value: { min: 1.1, max: 1.4 }, unit: 'g/L', basis: 'beer', method: 'Titrage' },
      comparison: { kind: 'absolute' } };
    for (const [index, row] of [qualitative, declaredNote, analytic].entries()) h.apply({ commandId: `observation-${row.id}`, expectedRevision: index + 1,
      recordedAt: `2026-10-02T09:0${index + 1}:00.000Z`, kind: 'observationRecorded', payload: { observation: row } });
    const read = readBrewingReferenceRecord(h.record, h.events);
    if ('status' in read) throw Error('Format de test inattendu.');
    const rows = getBrewingReferenceProjection(read).observations;
    expect(rows.map(row => row.sense.kind)).toEqual(['qualitative', 'sensoryRating', 'analyticalMeasurement']);
    expect(rows[1].scale).toEqual({ status: 'unknown' });
    expect(rows[2].sense).toMatchObject({ unit: 'g/L', basis: 'beer', method: 'Titrage', value: { min: 1.1, max: 1.4 } });
  });

  it('borne les mesures analytiques par une échelle connue sans clamp, et garde les mesures d’échelle inconnue', () => {
    const h = makeHarness();
    expect(() => h.apply({ commandId: 'point-out', expectedRevision: 1, recordedAt: '2026-10-02T09:01:00.000Z', kind: 'observationRecorded', payload: { observation: analyticalObservation('point-out', 10.1) } })).toThrow(/hors du domaine/);
    expect(() => h.apply({ commandId: 'range-out', expectedRevision: 1, recordedAt: '2026-10-02T09:02:00.000Z', kind: 'observationRecorded', payload: { observation: analyticalObservation('range-out', { min: 0.5, max: 10.1 }) } })).toThrow(/hors du domaine/);
    expect(h.record.revision).toBe(1);

    h.apply({ commandId: 'point-at-boundary', expectedRevision: 1, recordedAt: '2026-10-02T09:03:00.000Z', kind: 'observationRecorded', payload: { observation: analyticalObservation('point-at-boundary', 0) } });
    h.apply({ commandId: 'range-in-domain', expectedRevision: 2, recordedAt: '2026-10-02T09:04:00.000Z', kind: 'observationRecorded', payload: { observation: analyticalObservation('range-in-domain', { min: 2, max: 9 }) } });
    h.apply({ commandId: 'range-scale-unknown', expectedRevision: 3, recordedAt: '2026-10-02T09:05:00.000Z', kind: 'observationRecorded', payload: { observation: analyticalObservation('range-scale-unknown', { min: -4, max: 20 }, false) } });
    const read = readBrewingReferenceRecord(h.record, h.events);
    if ('status' in read) throw Error('Format de test inattendu.');
    const observations = getBrewingReferenceProjection(read).observations;
    expect(observations.map(row => row.id)).toEqual(['point-at-boundary', 'range-in-domain', 'range-scale-unknown']);
    expect(observations[2].scale).toEqual({ status: 'unknown' });
    expect(observations[2].sense).toMatchObject({ value: { min: -4, max: 20 }, unit: 'g/L' });
  });

  it('refuse un lien exact entre dimensions ou échelles incompatibles et conserve les formats futurs en lecture seule', () => {
    const h = makeHarness();
    h.apply({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'observation-1', expectedRevision: 1,
      recordedAt: '2026-10-02T09:10:00.000Z', kind: 'observationRecorded', payload: { observation: observation() } });
    h.apply({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'observation-2', expectedRevision: 2,
      recordedAt: '2026-10-02T09:15:00.000Z', kind: 'observationRecorded', payload: { observation: { ...observation(), id: 'degustation-2' } } });
    h.apply(proposalCommand('1', definition2, null, 3, 'proposal-r1'));
    const ref = (h.events[h.events.length - 1] as Extract<BrewingReferenceEventV1, { kind: 'referenceProposed' }>).payload.reference;
    h.apply({ ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'adopt-r1', expectedRevision: 4,
      recordedAt: '2026-10-02T10:02:00.000Z', kind: 'referenceAdopted', payload: { reference: { id: ref.id, version: ref.version, contentReference: ref.contentReference }, adoptedBy: actor } });
    const firstLink = interpretationCommand({ commandId: 'batch-link-1', expectedRevision: 5, observationVersion: 1,
      reference: h.record.currentReference!, definition: definition2, comparability: { kind: 'nonComparable', reason: 'Une autre version de dimension et d’échelle.' } });
    const secondLink = interpretationCommand({ commandId: 'batch-link-2', expectedRevision: 5, observationVersion: 1,
      reference: h.record.currentReference!, definition: definition2, comparability: { kind: 'exact' } });
    const invalidBatch: BrewingReferenceCommandInput<'interpretationsLinked'> = { ownerKey: 'user-1', contextId: 'degustation-7', commandId: 'bad-batch', expectedRevision: 5,
      recordedAt: '2026-10-02T10:03:00.000Z', kind: 'interpretationsLinked', payload: { interpretations: [firstLink.payload.interpretation, secondLink.payload.interpretation] } };
    expect(() => h.apply(invalidBatch)).toThrow(/comparabilité exacte/);
    expect(h.record.revision).toBe(5);
    expect(h.events).toHaveLength(5);

    const validBatch: BrewingReferenceCommandInput<'interpretationsLinked'> = { ...invalidBatch, commandId: 'valid-batch', payload: { interpretations: [
      firstLink.payload.interpretation,
      { ...secondLink.payload.interpretation, comparability: { kind: 'nonComparable', reason: 'La version des métriques diffère.' } },
    ] } };
    h.apply(validBatch);
    const restored = readBrewingReferenceRecord(h.record, h.events);
    if ('status' in restored) throw Error('Format de test inattendu.');
    expect(getBrewingReferenceProjection(restored).interpretations.map(row => row.comparability.kind)).toEqual(['nonComparable', 'nonComparable']);

    const future = readBrewingReferenceRecord({ ...h.record, formatVersion: 9 }, h.events);
    expect(future).toMatchObject({ status: 'unsupportedFormat', reason: 'recordFormat', formatVersion: 9 });
    const futureEvent = readBrewingReferenceRecord(h.record, [...h.events, { ...h.events[h.events.length - 1], eventFormatVersion: 9 }]);
    expect(futureEvent).toMatchObject({ status: 'unsupportedFormat', reason: 'eventFormat', formatVersion: 9 });
  });

  it('refuse une archive altérée par contrôle des empreintes avant projection', () => {
    const h = makeHarness();
    const altered = structuredClone(h.events);
    ((altered[0] as Extract<BrewingReferenceEventV1, { kind: 'contextOpened' }>).payload.context.details as any).beerLabel = 'Valeur modifiée après archivage';
    expect(() => readBrewingReferenceRecord(h.record, altered)).toThrow(/Empreinte/);
    expect(readBrewingReferenceRecord(h.record, h.events)).not.toHaveProperty('status');
  });

  it('refuse une même version de dimension définie deux fois, accepte deux versions distinctes et relit intacte une archive antérieure', () => {
    const h = makeHarness();
    const conflictingDimension: BrewingSensoryDimension = { ...definition1.dimension, name: 'Portée alternative', definition: 'Définition concurrente de même ID/version.' };
    const conflictingDefinition = createBrewingSensoryDefinitionReference(conflictingDimension, definition1.metric, definition1.scale);
    const rejected = proposalCommand('1', definition1, null, 1, 'conflicting-proposal');
    rejected.payload.reference = referenceWithDefinitions('1', [definition1, conflictingDefinition]);
    expect(() => h.apply(rejected)).toThrow(/version de dimension référence deux définitions/);
    expect(h.record.revision).toBe(1);
    expect(h.events).toHaveLength(1);

    const accepted = proposalCommand('2', definition1, null, 1, 'versioned-proposal');
    accepted.payload.reference = referenceWithDefinitions('2', [definition1, definition2]);
    h.apply(accepted);
    const current = readBrewingReferenceRecord(h.record, h.events);
    if ('status' in current) throw Error('Format de test inattendu.');
    expect(current.projection.references[0].sensoryDefinitions.map(row => row.dimension.version)).toEqual(['1', '2']);

    // A proposal saved before the stricter creation boundary remains readable and unchanged.
    const legacyOpen = openBrewingReferenceContext({ ownerKey: 'user-1', contextId: 'legacy', commandId: 'legacy-open',
      recordedAt: '2026-10-02T08:00:00.000Z', context: initialContext() });
    const legacyObservation = createBrewingReferenceCommand({ ownerKey: 'user-1', contextId: 'legacy', commandId: 'legacy-observation',
      expectedRevision: 1, recordedAt: '2026-10-02T08:01:00.000Z', kind: 'observationRecorded', payload: { observation: observation() } });
    const legacyPayload = { reference: referenceWithDefinitions('1', [definition1, conflictingDefinition]) };
    const legacyCommand = { ownerKey: 'user-1', contextId: 'legacy', commandId: 'legacy-proposal', expectedRevision: 2,
      recordedAt: '2026-10-02T08:02:00.000Z', kind: 'referenceProposed' as const, payload: legacyPayload };
    const legacyEventBase = { ...legacyCommand, eventFormatVersion: 1 as const, resultingRevision: 3,
      commandReference: hopAdviceContentReference('brewing-reference-command-v1', { ownerKey: legacyCommand.ownerKey, contextId: legacyCommand.contextId,
        kind: legacyCommand.kind, payload: legacyCommand.payload }) };
    const legacyProposal = { ...legacyEventBase, contentReference: brewingReferenceEventContentReference(legacyEventBase as any) } as BrewingReferenceEventV1;
    const legacyEvents: BrewingReferenceEventV1[] = [legacyOpen.event, legacyObservation, legacyProposal];
    const legacyRecordBase = { formatVersion: 1 as const, ownerKey: 'user-1', contextId: 'legacy', revision: 3,
      createdAt: legacyOpen.record.createdAt, updatedAt: legacyProposal.recordedAt, lastCommandId: legacyProposal.commandId,
      state: 'referenceProposed' as const, currentReference: null };
    const legacyRecord = { ...legacyRecordBase, reference: brewingReferenceRecordContentReference(legacyRecordBase) };
    const before = structuredClone({ record: legacyRecord, events: legacyEvents });
    const restored = readBrewingReferenceRecord(legacyRecord, legacyEvents);
    if ('status' in restored) throw Error('Format historique refusé à tort.');
    expect(restored.projection.observations).toEqual([observation()]);
    expect(restored.projection.references[0].sensoryDefinitions.map(row => row.dimension.name)).toEqual(['Poire', 'Portée alternative']);
    expect({ record: legacyRecord, events: legacyEvents }).toEqual(before);
    const retry = applyBrewingReferenceCommand(legacyRecord, legacyCommand, legacyEvents);
    expect(retry.duplicate).toBe(true);
    expect(retry.event).toEqual(legacyProposal);
    expect(retry.record).toEqual(legacyRecord);
    expect({ record: legacyRecord, events: legacyEvents }).toEqual(before);
    expect(() => applyBrewingReferenceCommand(legacyRecord, { ownerKey: 'user-1', contextId: 'legacy', commandId: 'new-adoption',
      expectedRevision: 3, recordedAt: '2026-10-02T08:03:00.000Z', kind: 'referenceAdopted', payload: {
        reference: { id: legacyPayload.reference.id, version: legacyPayload.reference.version, contentReference: legacyPayload.reference.contentReference }, adoptedBy: actor,
      } }, legacyEvents)).toThrow(/version de dimension référence deux définitions/);
    expect({ record: legacyRecord, events: legacyEvents }).toEqual(before);

    const legacyIdentity: BrewingReferenceIdentityV1 = { id: legacyPayload.reference.id, version: legacyPayload.reference.version,
      contentReference: legacyPayload.reference.contentReference };
    const legacyAdoption = createBrewingReferenceCommand({ ownerKey: 'user-1', contextId: 'legacy', commandId: 'legacy-adoption',
      expectedRevision: 3, recordedAt: '2026-10-02T08:03:30.000Z', kind: 'referenceAdopted', payload: { reference: legacyIdentity, adoptedBy: actor } });
    const legacyAdoptedEvents: BrewingReferenceEvent[] = [...legacyEvents, legacyAdoption];
    const adoptedRecordBase = { formatVersion: 1 as const, ownerKey: 'user-1', contextId: 'legacy', revision: 4,
      createdAt: legacyRecord.createdAt, updatedAt: legacyAdoption.recordedAt, lastCommandId: legacyAdoption.commandId,
      state: 'referenceAdopted' as const, currentReference: legacyIdentity };
    const adoptedRecord = { ...adoptedRecordBase, reference: brewingReferenceRecordContentReference(adoptedRecordBase) };
    const adoptedBefore = structuredClone({ record: adoptedRecord, events: legacyAdoptedEvents });
    expect(readBrewingReferenceRecord(adoptedRecord, legacyAdoptedEvents)).not.toHaveProperty('status');
    const validSecondDraft = { ...referenceVersion('2', definition1, legacyIdentity), sensoryDefinitions: [definition1, definition2] };
    const validSecond = { ...validSecondDraft, contentReference: brewingReferenceVersionContentReference(validSecondDraft) };
    const secondProposal = createBrewingReferenceCommand({ ownerKey: 'user-1', contextId: 'legacy', commandId: 'valid-second-proposal',
      expectedRevision: 4, recordedAt: '2026-10-02T08:04:00.000Z', kind: 'referenceProposed', payload: { reference: validSecond } });
    const secondIdentity: BrewingReferenceIdentityV1 = { id: validSecond.id, version: validSecond.version, contentReference: validSecond.contentReference };
    const secondAdoption = createBrewingReferenceCommand({ ownerKey: 'user-1', contextId: 'legacy', commandId: 'valid-second-adoption',
      expectedRevision: 5, recordedAt: '2026-10-02T08:05:00.000Z', kind: 'referenceAdopted', payload: { reference: secondIdentity, adoptedBy: actor } });
    const historicalEvents: BrewingReferenceEvent[] = [...legacyAdoptedEvents, secondProposal, secondAdoption];
    const historicalRecordBase = { formatVersion: 1 as const, ownerKey: 'user-1', contextId: 'legacy', revision: 6,
      createdAt: legacyRecord.createdAt, updatedAt: secondAdoption.recordedAt, lastCommandId: secondAdoption.commandId,
      state: 'referenceAdopted' as const, currentReference: secondIdentity };
    const historicalRecord = { ...historicalRecordBase, reference: brewingReferenceRecordContentReference(historicalRecordBase) };
    const historicalBefore = structuredClone({ record: historicalRecord, events: historicalEvents });
    expect(readBrewingReferenceRecord(historicalRecord, historicalEvents)).not.toHaveProperty('status');
    expect(() => applyBrewingReferenceCommand(historicalRecord, { ownerKey: 'user-1', contextId: 'legacy', commandId: 'activate-legacy-invalid',
      expectedRevision: 6, recordedAt: '2026-10-02T08:06:00.000Z', kind: 'referenceActivated', payload: {
        reference: legacyIdentity, activatedBy: actor, reason: 'Réactivation demandée pour contrôle.',
      } }, historicalEvents)).toThrow(/version de dimension référence deux définitions/);
    expect({ record: historicalRecord, events: historicalEvents }).toEqual(historicalBefore);
    expect({ record: adoptedRecord, events: legacyAdoptedEvents }).toEqual(adoptedBefore);
  });
});

