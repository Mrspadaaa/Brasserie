import { describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { adoptBrewingNuancePlan, proposeBrewingNuancePlans, type BrewingNuancePlan } from '../../src/domain/brewingNuanceProjection';
import { createBrewingSensoryDefinitionReference } from '../../src/domain/brewingSensory';
import { prepareBrewingObservedContext, type PrepareBrewingObservedContextOptions } from '../../src/domain/brewingObservationContext';
import { createBrewingReferenceObservationCorrectionCommand } from '../../src/domain/brewingObservationSelection';
import { applyBrewingReferenceCommand, openBrewingReferenceContext,
  readBrewingReferenceRecord, type BrewingReferenceObservationV1 } from '../../src/domain/brewingReference';
import type { BrewingObservationArithmeticContract } from '../../src/domain/brewingObservationNumerics';
import { hopV55ReferenceContextId } from '../../src/services/hopV55/referenceWorkspace';
import { loadHopV55CanonicalObservationFixture } from '../../src/services/hopV55/canonicalObservationFixture';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1,
  type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { appendHopV55ObservationAnchor, appendHopV55ObservationProjection, hopV55ObservationAnchorRecordReference,
  hopV55ObservationProjectionRecordReference,
  appendHopV55CurrentPreparationRecord, prepareHopV55CurrentPreparationRecord, prepareHopV55ObservationAnchor,
  prepareHopV55ObservationProjection, readHopV55ObservationAnchorRecord, readHopV55ObservationProjectionRecord,
  resolveHopV55CurrentObservation } from '../../src/services/hopV55/observationSession';
import { hopV55Workspace } from '../fixtures/hopV55';

const baseAt = '2026-10-02T09:00:00.000Z';
const anchorAt = '2026-10-02T10:00:00.000Z';
const currentAt = '2026-10-02T12:00:00.000Z';
const targetAt = '2026-10-02T13:00:00.000Z';
const actor = { origin: 'user' as const, name: 'Brasseur de fixture, entrée synthétique' };
const source: HopSource = { title: 'Provenance synthétique', author: 'Fixture automatisée', year: null,
  kind: 'judgment', reference: 'fixture://observation-session/source' };

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown) {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as HopV55WorkspaceEnvelopeV1;
    return JSON.stringify([row.ownerKey, row.workspaceId]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) { const key = this.key(row); if (this.rows.has(key)) throw Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}
class MemoryDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]) { return (tablesAndWork.at(-1) as () => Promise<T>)(); }
  close() { /* Fixture mémoire sans handle. */ }
}

function context(readAt: string, batchId = 'batch-observation-fixture'): BrewerContext {
  const snapshot = { capturedAt: baseAt, sourceRecipeId: 'recipe-observation-fixture', name: 'Snapshot de test', style: '', volumeL: 20,
    fermentables: [], totalGristKg: 0, hops: [], yeast: { name: 'Levure de fixture', hopIndexId: 'yeast-fixture' }, fermentation: [], steps: [], notes: [] };
  return { now: Date.parse(readAt), phase: 'fixture', batch: { id: batchId, status: 'fermentation', recipeSnapshot: snapshot },
    recipe: { ...snapshot, volumeL: 999 }, journal: { steps: [], currentIndex: 0, additions: {} }, inventory: [], material: [],
    waterSources: [], provenance: [], hopIndex: { varieties: [], lots: [], knowledge: [], predictions: [], tastings: [], truncated: [] },
  } as unknown as BrewerContext;
}

function preparationOptions(asOf: string, knowledgeAsOf: string): PrepareBrewingObservedContextOptions {
  return { source: { kind: 'batch', id: 'batch-observation-fixture' }, asOf, knowledgeAsOf,
    hopScope: { id: 'explicit-test-scope', dependencyIds: ['hopMaterials', 'hopContact'], fromAt: baseAt,
      explanation: 'Portée déclarée pour la fixture; l’absence de couverture reste inconnue.' } };
}

async function domainSetup() {
  const data = await loadBrewingCatalogueReferences();
  const sourceModel = data.knowledge.find(row => row.kind === 'extrapolation' && (row as HopExtrapolation).enabled) as HopExtrapolation | undefined;
  const axes = data.knowledge.filter((row): row is HopAxis => row.kind === 'axis');
  if (!sourceModel || !axes.length) throw Error('Le catalogue local doit contenir un modèle et des axes déjà reçus.');
  const dimension = { id: 'synthetic-session-dimension', version: '1', name: 'Dimension de fixture',
    definition: 'Dimension synthétique qui sert uniquement à contrôler les contrats du parcours.', sourceRefs: [source], terms: ['fixture'] };
  const proposed = proposeBrewingNuancePlans({ planId: 'synthetic-observation-session', dimensions: [dimension], sourceModel,
    axes, proposedAt: currentAt, proposedBy: actor });
  const candidate = proposed.find(row => row.status === 'proposed');
  if (!candidate) throw Error('Aucune convention locale valide pour le test de contrat.');
  const plan = adoptBrewingNuancePlan(candidate, { adoptedAt: currentAt, adoptedBy: actor,
    reason: 'Hypothèse synthétique requise par le validateur de test; aucun résultat sensoriel n’est calculé.' });
  const modelDefinition = plan.definitions[0];
  const noteMetric = { id: 'synthetic-session-ordinal', version: '1', kind: 'ordinalNote' as const,
    name: 'Note de fixture', meaning: 'Ordinale synthétique pour vérifier la préservation de la note.', unit: null, sourceRefs: [source] };
  const noteScale = { id: 'synthetic-session-note-scale', version: '1', metricRef: { id: noteMetric.id, version: noteMetric.version },
    domain: structuredClone(modelDefinition.scale!.domain), sourceRefs: [source] };
  const noteDefinition = createBrewingSensoryDefinitionReference(modelDefinition.dimension, noteMetric, noteScale);
  return { data: data as HopEngineData, plan, noteDefinition };
}

function noteFor(id: string, observedAt: string, subjectId: string, definition: ReturnType<typeof createBrewingSensoryDefinitionReference>): BrewingReferenceObservationV1 {
  return { id, version: 1, subject: { kind: 'beer', id: subjectId, label: 'Bière synthétique' }, observedAt,
    author: { label: 'Brasseur de fixture' }, origin: { kind: 'fixture', description: 'Observation synthétique; aucune dégustation réelle.' },
    originalText: 'Énoncé de fixture conservé tel quel.', dimension: { status: 'resolved', definition },
    scale: { status: 'known', metric: definition.metric!, scale: definition.scale! }, sense: { kind: 'sensoryRating', value: 3 },
    comparison: { kind: 'absolute' }, context: { fixture: 'synthetic-only' } };
}

function workspaceWithOpenJournal(noteDefinition: ReturnType<typeof createBrewingSensoryDefinitionReference>, workspaceId = 'workspace-observation-session') {
  const workspace = hopV55Workspace('owner-observation-session', workspaceId);
  workspace.sourceBatchId = 'batch-observation-fixture';
  const opened = openBrewingReferenceContext({ ownerKey: workspace.ownerKey, contextId: hopV55ReferenceContextId(workspace.id),
    commandId: `open-${workspace.id}`, recordedAt: baseAt,
    context: { programReference: null, past: { status: 'unknown' }, details: { fixture: 'synthetic-only' } } });
  workspace.referenceJournal = { record: opened.record, events: [opened.event] };
  const prepared = prepareBrewingObservedContext(context(currentAt), preparationOptions(anchorAt, currentAt));
  if (prepared.status !== 'prepared' || !prepared.state) throw Error('La source physique synthétique doit produire un état archivable.');
  const note = noteFor('note-session-1', anchorAt, prepared.state.subject.identity.id, noteDefinition);
  return { workspace, prepared, note };
}

function recordFirstAnchor(workspace: ReturnType<typeof workspaceWithOpenJournal>['workspace'], note: BrewingReferenceObservationV1) {
  const command = { ownerKey: workspace.ownerKey, contextId: hopV55ReferenceContextId(workspace.id), commandId: 'record-observation-1',
    expectedRevision: workspace.referenceJournal!.record.revision, recordedAt: note.observedAt, kind: 'observationRecorded' as const,
    payload: { observation: note } };
  const prepared = prepareHopV55ObservationAnchor({ workspace, id: 'anchor-record-1', source: { kind: 'context', context: context(currentAt),
    options: preparationOptions(anchorAt, currentAt) }, referenceCommand: command,
    anchor: { subjectRelation: 'sameSubject', explanation: 'Identité batch exacte issue du snapshot de fixture.',
      createdAt: anchorAt, createdBy: actor } });
  if (prepared.status !== 'ready') throw Error(`Ancre de fixture non prête: ${prepared.status}`);
  return prepared;
}

function projectionInput(workspace: ReturnType<typeof workspaceWithOpenJournal>['workspace'], plan: BrewingNuancePlan,
  noteDefinition: ReturnType<typeof createBrewingSensoryDefinitionReference>, data: HopEngineData,
  role: 'documentedAdvance' | 'targetHorizon' = 'documentedAdvance') {
  const definition = plan.definitions[0];
  const arithmetic: BrewingObservationArithmeticContract = { version: 'brewing-observation-arithmetic-v1', id: 'fixture-arithmetic',
    definition, operation: 'additiveDifference', basis: null, explanation: 'Contrat synthétique pour vérifier archive/reprise uniquement.',
    sourceRefs: [source], adoptedAt: currentAt, adoptedBy: actor,
    unitBridge: { sourceDefinition: noteDefinition, rule: 'unitCorrespondence', domain: structuredClone(noteDefinition.scale!.domain!),
      sourceMeaning: { kind: 'intensity', direction: 'increasing' }, targetMeaning: { kind: 'intensity', direction: 'increasing' },
      explanation: 'Correspondance synthétique de fixture; ne qualifie aucune note réelle.' } };
  return { workspace, currentPreparationRecordId: 'current-preparation-q1',
    requestedDimension: { status: 'resolved' as const, definition }, requiredDependencyIds: [],
    target: { future: [], contactTargets: [], horizon: { kind: 'instant' as const, at: role === 'documentedAdvance' ? currentAt : targetAt,
      explanation: role === 'documentedAdvance' ? 'Coupure exacte des faits courants.' : 'Horizon futur explicitement déclaré.' },
      explanation: 'Cible de fixture distincte des faits observés.' },
    projection: { id: 'projection-q1', question: 'Question synthétique Q1 archivée.', role,
      frames: [{ id: 'frame-1', name: 'Cadre adopté de fixture', plan }], arithmetic,
      restStability: { status: 'notEstablished' as const, explanation: 'Aucune stabilité réelle revendiquée.', conditions: [] },
      createdAt: targetAt, createdBy: actor }, data };
}

describe('sessions d’ancrage d’observation V5.5', () => {
  it('archive atomiquement une note NR et son ancre, puis re-ancre une correction depuis l’état historique', async () => {
    const { plan, noteDefinition } = await domainSetup();
    const { workspace, prepared: anchorPrepared, note } = workspaceWithOpenJournal(noteDefinition);
    const first = recordFirstAnchor(workspace, note);
    const savedAnchor = appendHopV55ObservationAnchor(workspace, first.record, first.referenceJournalPatch);
    expect(savedAnchor.referenceJournal?.record.revision).toBe(workspace.referenceJournal!.record.revision + 1);
    expect(savedAnchor.observationAnchors).toHaveLength(1);
    expect(savedAnchor.observationAnchors?.[0].anchor?.observationReference).toBe(first.record.observationReference?.contentReference);
    expect(first.record.preparation.state?.resolutionReference).toBe(anchorPrepared.state?.resolutionReference);
    const idempotentRetry = appendHopV55ObservationAnchor(savedAnchor, first.record, first.referenceJournalPatch);
    expect(idempotentRetry.referenceJournal).toEqual(savedAnchor.referenceJournal);
    expect(idempotentRetry.observationAnchors).toEqual(savedAnchor.observationAnchors);

    const currentRead = readBrewingReferenceRecord(savedAnchor.referenceJournal!.record, savedAnchor.referenceJournal!.events);
    if ('status' in currentRead) throw Error('Le journal de fixture doit rester lisible.');
    const correction = createBrewingReferenceObservationCorrectionCommand({ journal: currentRead,
      expectedObservation: first.record.observationReference!, commandId: 'correct-observation-q1', recordedAt: currentAt,
      correctedBy: { label: 'Correcteur de fixture' }, reason: 'Correction de transcription synthétique, même instant et même sujet.',
      changes: { value: 4 } });
    const revised = prepareHopV55ObservationAnchor({ workspace: savedAnchor, id: 'anchor-record-2', source: {
      kind: 'reanchorCorrection', previousAnchorRecordId: 'anchor-record-1' }, referenceCommand: correction,
      anchor: { subjectRelation: 'sameSubject', explanation: 'Nouvelle version de note, même état physique historique.',
        createdAt: currentAt, createdBy: actor } });
    expect(revised.status).toBe('ready');
    if (revised.status !== 'ready') return;
    expect(revised.record.preparation.reference).toBe(first.record.preparation.reference);
    expect(revised.record.preparation.state?.resolutionReference).toBe(first.record.anchor?.observedState.resolutionReference);
    expect(revised.record.anchor?.observation.version).toBe(2);
    expect(revised.record.anchor?.previousAnchorReference).toBe(first.record.anchor?.reference);
    const correctedWorkspace = appendHopV55ObservationAnchor(savedAnchor, revised.record, revised.referenceJournalPatch);
    expect(correctedWorkspace.observationAnchors?.[0]).toEqual(savedAnchor.observationAnchors?.[0]);
    expect(correctedWorkspace.observationAnchors).toHaveLength(2);
    expect(correctedWorkspace.referenceJournal?.events).toHaveLength(savedAnchor.referenceJournal!.events.length + 1);
  });

  it('conserve les refus et refuse les altérations de snapshot, archive ou identifiant concurrent', async () => {
    const { plan: _plan, noteDefinition } = await domainSetup();
    const { workspace, note } = workspaceWithOpenJournal(noteDefinition, 'workspace-observation-refusal');
    const first = recordFirstAnchor(workspace, note);
    const anchored = appendHopV55ObservationAnchor(workspace, first.record, first.referenceJournalPatch);
    const invalidContext = prepareHopV55ObservationAnchor({ workspace: anchored, id: 'refused-preparation-1',
      source: { kind: 'context', context: context(currentAt, 'wrong-batch'), options: preparationOptions(anchorAt, currentAt) },
      observationReference: first.record.observationReference!,
      anchor: { subjectRelation: 'sameSubject', explanation: 'Motif conservé sans déduire de lien physique.', createdAt: currentAt, createdBy: actor } });
    expect(invalidContext.status).toBe('refused');
    if (invalidContext.status !== 'refused') return;
    expect(invalidContext.record.preparation.refusal?.code).toBe('sourceBatchMismatch');
    expect(invalidContext.record.anchor).toBeNull();
    const retained = appendHopV55ObservationAnchor(anchored, invalidContext.record);
    expect(readHopV55ObservationAnchorRecord(retained.observationAnchors?.[1]).status).toBe('readOnly');

    const tampered = structuredClone(first.record);
    tampered.preparationOptions.knowledgeAsOf = targetAt;
    expect(() => readHopV55ObservationAnchorRecord(tampered)).toThrow(/altéré|référence/i);
    const conflictingId = structuredClone(first.record); conflictingId.reference = 'fixture:conflict';
    expect(() => appendHopV55ObservationAnchor(retained, conflictingId)).toThrow(/altéré|référence/i);
  });

  it('recharge le dernier état documenté, garde la nouvelle note courante après correction historique et ne prépare rien au reload', async () => {
    const { plan, noteDefinition } = await domainSetup();
    const { workspace, note: note37 } = workspaceWithOpenJournal(noteDefinition, 'workspace-observation-current');
    const repository = createHopV55WorkspaceRepository({ ownerKey: workspace.ownerKey, database: new MemoryDatabase() });
    let saved = await repository.save(workspace, null);
    const firstAnchor = recordFirstAnchor(saved, note37);
    saved = appendHopV55ObservationAnchor(saved, firstAnchor.record, firstAnchor.referenceJournalPatch);
    saved = await repository.save(saved, 1);

    const currentPreparation = prepareHopV55CurrentPreparationRecord({ workspace: saved, id: 'current-preparation-12h',
      context: context(currentAt), options: preparationOptions(currentAt, currentAt) });
    expect(currentPreparation.status).toBe('ready');
    if (currentPreparation.status !== 'ready') return;
    saved = appendHopV55CurrentPreparationRecord(saved, currentPreparation.record);
    const note50 = noteFor('note-session-2', currentAt, currentPreparation.record.preparation.state!.subject.identity.id, noteDefinition);
    note50.sense = { kind: 'sensoryRating', value: 50 };
    const recordCurrentObservation = { ownerKey: saved.ownerKey, contextId: hopV55ReferenceContextId(saved.id), commandId: 'record-observation-current',
      expectedRevision: saved.referenceJournal!.record.revision, recordedAt: currentAt, kind: 'observationRecorded' as const,
      payload: { observation: note50 } };
    const latestAnchor = prepareHopV55ObservationAnchor({ workspace: saved, id: 'anchor-record-2',
      source: { kind: 'context', context: context(currentAt), options: preparationOptions(currentAt, currentAt) },
      referenceCommand: recordCurrentObservation,
      anchor: { subjectRelation: 'sameSubject', explanation: 'Note récente liée au même batch exact.', createdAt: currentAt, createdBy: actor } });
    expect(latestAnchor.status).toBe('ready');
    if (latestAnchor.status !== 'ready') return;
    saved = appendHopV55ObservationAnchor(saved, latestAnchor.record, latestAnchor.referenceJournalPatch);
    const beforeNewObservationSaveRevision = saved.revision;
    saved = await repository.save(saved, beforeNewObservationSaveRevision);

    const selectionInput = { workspace: saved, requestedDimension: { status: 'resolved' as const, definition: noteDefinition }, requiredDependencyIds: [] };
    const beforeCorrection = resolveHopV55CurrentObservation(selectionInput);
    expect(beforeCorrection.status).toBe('selected');
    if (beforeCorrection.status !== 'selected') return;
    expect(beforeCorrection.currentPreparation.id).toBe('current-preparation-12h');
    expect(beforeCorrection.selection.selected?.observation).toMatchObject({ id: note50.id, sense: { kind: 'sensoryRating', value: 50 } });

    const journal = readBrewingReferenceRecord(saved.referenceJournal!.record, saved.referenceJournal!.events);
    if ('status' in journal) throw Error('Le journal doit rester lisible après la note récente.');
    const correction = createBrewingReferenceObservationCorrectionCommand({ journal,
      expectedObservation: firstAnchor.record.observationReference!, commandId: 'correct-old-note-after-current', recordedAt: targetAt,
      correctedBy: { label: 'Correcteur de fixture' }, reason: 'Corriger l’ancienne transcription sans nouvelle dégustation ni nouveau snapshot physique.',
      changes: { value: 4 } });
    const oldCorrectionAnchor = prepareHopV55ObservationAnchor({ workspace: saved, id: 'anchor-record-old-note-corrected',
      source: { kind: 'reanchorCorrection', previousAnchorRecordId: 'anchor-record-1' }, referenceCommand: correction,
      anchor: { subjectRelation: 'sameSubject', explanation: 'Même état ancien; aucune promotion de la correction au courant.',
        createdAt: targetAt, createdBy: actor } });
    expect(oldCorrectionAnchor.status).toBe('ready');
    if (oldCorrectionAnchor.status !== 'ready') return;
    saved = appendHopV55ObservationAnchor(saved, oldCorrectionAnchor.record, oldCorrectionAnchor.referenceJournalPatch);
    saved = await repository.save(saved, saved.revision);

    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('Reload ne choisit pas son état avec l’horloge.'); });
    try {
      const afterCorrection = resolveHopV55CurrentObservation({ ...selectionInput, workspace: saved });
      expect(afterCorrection.status).toBe('selected');
      if (afterCorrection.status !== 'selected') return;
      expect(afterCorrection.currentPreparation.id).toBe('current-preparation-12h');
      expect(afterCorrection.selection.selected?.observation).toMatchObject({ id: note50.id, version: 1, sense: { kind: 'sensoryRating', value: 50 } });
      expect(afterCorrection.selection.candidates.find(row => row.observation.id === note37.id)?.observation).toMatchObject({
        version: 2, sense: { kind: 'sensoryRating', value: 4 },
      });
      expect(saved.observationAnchors?.find(row => row.recordKind === 'currentPreparation')?.preparation.state?.resolutionReference)
        .toBe(currentPreparation.record.preparation.state?.resolutionReference);
    } finally { clock.mockRestore(); }

    const noCurrentState = { ...saved, observationAnchors: saved.observationAnchors?.filter(row => row.recordKind !== 'currentPreparation') };
    expect(resolveHopV55CurrentObservation({ ...selectionInput, workspace: noCurrentState })).toMatchObject({ status: 'needs' });
    const legacyAnchors = structuredClone(noCurrentState);
    legacyAnchors.observationAnchors = (legacyAnchors.observationAnchors ?? []).map(row => {
      const legacy = structuredClone(row); delete legacy.recordKind;
      legacy.reference = hopV55ObservationAnchorRecordReference(legacy);
      return legacy;
    });
    expect(legacyAnchors.observationAnchors?.every(row => readHopV55ObservationAnchorRecord(row).status === 'readOnly')).toBe(true);
    expect(resolveHopV55CurrentObservation({ ...selectionInput, workspace: legacyAnchors })).toMatchObject({ status: 'needs' });
    const futureCurrent = { ...saved, observationAnchors: [...(saved.observationAnchors ?? []),
      { format: 'hop-v55-observation-anchor-record-v9', recordKind: 'currentPreparation', id: 'future-current-state', payload: { retained: true } }] } as unknown as HopV55Workspace;
    expect(resolveHopV55CurrentObservation({ ...selectionInput, workspace: futureCurrent })).toMatchObject({
      status: 'needs', requirements: [expect.stringContaining('format futur')],
    });
    repository.close();
  });

  it('compare explicitement une note historique ancrée à six heures au dernier état cible six heures trente sans la promouvoir comme courante', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const workspace = hopV55Workspace('owner-observation-retrospective', 'workspace-observation-retrospective');
    workspace.sourceBatchId = fixture.context.batch!.id;
    const contextId = hopV55ReferenceContextId(workspace.id);
    const opened = openBrewingReferenceContext({ ownerKey: workspace.ownerKey, contextId, commandId: 'open-retrospective',
      recordedAt: fixture.note.observedAt, context: { programReference: null, past: { status: 'unknown' }, details: { fixture: 'retrospective' } } });
    workspace.referenceJournal = { record: opened.record, events: [opened.event] };
    const noteCommand = { ownerKey: workspace.ownerKey, contextId, commandId: 'note-retrospective-37',
      expectedRevision: opened.record.revision, recordedAt: fixture.note.observedAt, kind: 'observationRecorded' as const,
      payload: { observation: structuredClone(fixture.note) } };
    const anchorPrepared = prepareHopV55ObservationAnchor({ workspace, id: 'anchor-record-37-at-6h', source: fixture.source,
      referenceCommand: noteCommand, anchor: { subjectRelation: 'sameSubject', explanation: 'Version 1 ancrée sur l’état conservé à six heures.',
        createdAt: fixture.anchor.createdAt, createdBy: actor } });
    expect(anchorPrepared.status).toBe('ready');
    if (anchorPrepared.status !== 'ready') return;
    let saved = appendHopV55ObservationAnchor(workspace, anchorPrepared.record, anchorPrepared.referenceJournalPatch);
    const sourceCurrent = prepareHopV55CurrentPreparationRecord({ workspace: saved, id: 'current-preparation-at-6h',
      context: fixture.context, options: fixture.options });
    expect(sourceCurrent.status).toBe('ready');
    if (sourceCurrent.status !== 'ready') return;
    saved = appendHopV55CurrentPreparationRecord(saved, sourceCurrent.record);
    const dimension = { status: 'resolved' as const, definition: fixture.noteDefinition };
    const dependencies = fixture.options.hopScope!.dependencyIds;
    const q1 = prepareHopV55ObservationProjection({ workspace: saved, currentPreparationRecordId: sourceCurrent.record.id,
      requestedDimension: dimension, requiredDependencyIds: dependencies,
      target: { future: [], contactTargets: [], horizon: { kind: 'instant', at: fixture.options.asOf,
        explanation: 'État Q1 exact à six heures.' }, explanation: 'Archive Q1 antérieure, conservée.' },
      projection: { id: 'projection-retrospective-q1', question: 'Q1 avant l’état intermédiaire.', role: 'documentedAdvance',
        frames: [{ id: 'frame-retrospective', name: 'Cadre canonique de fixture', plan: fixture.plan }], arithmetic: fixture.arithmetic,
        restStability: { status: 'notEstablished', explanation: 'La stabilité du reste n’est pas établie.', conditions: [] },
        createdAt: fixture.anchor.createdAt, createdBy: actor }, data: fixture.data });
    expect(q1.status).toBe('ready');
    if (q1.status !== 'ready') return;
    saved = appendHopV55ObservationProjection(saved, q1.record);

    const targetAt = new Date(Date.parse(fixture.options.asOf) + 30 * 60_000).toISOString();
    const targetOptions = { ...structuredClone(fixture.options), asOf: targetAt };
    const targetContext = { ...structuredClone(fixture.context), now: Date.parse(targetAt) } as BrewerContext;
    const targetPreparation = prepareHopV55CurrentPreparationRecord({ workspace: saved, id: 'current-preparation-after-state-only-6-5',
      context: targetContext, options: targetOptions });
    expect(targetPreparation.status).toBe('ready');
    if (targetPreparation.status !== 'ready') return;
    const targetWorkspace = appendHopV55CurrentPreparationRecord(saved, targetPreparation.record);
    const latestCurrent = resolveHopV55CurrentObservation({ workspace: targetWorkspace, requestedDimension: dimension,
      requiredDependencyIds: dependencies });
    expect(latestCurrent.status).toBe('needs');
    if (latestCurrent.status !== 'needs') return;
    expect(latestCurrent.currentPreparation?.id).toBe(targetPreparation.record.id);
    expect(latestCurrent.candidates?.find(row => row.observation.id === fixture.note.id)?.status).not.toBe('applicable');
    expect(latestCurrent.candidates?.find(row => row.observation.id === fixture.note.id)?.observation.sense)
      .toEqual({ kind: 'sensoryRating', value: 37 });

    const historicalProjectionInput = {
      workspace: targetWorkspace, currentPreparationRecordId: targetPreparation.record.id,
      anchorRecordId: anchorPrepared.record.id, expectedAnchorReference: anchorPrepared.record.anchor!.reference,
      expectedObservationReference: anchorPrepared.record.observationReference!,
      requestedDimension: dimension, requiredDependencyIds: dependencies,
      target: { future: [], contactTargets: [], horizon: { kind: 'instant' as const, at: targetAt,
        explanation: 'État documenté après la progression sans nouvelle note.' },
        explanation: 'Comparer l’ancre historique à la cible physique courante.' },
      projection: { id: 'projection-retrospective-q2', question: 'Depuis la note historique, vers l’état à six heures trente.',
        role: 'documentedAdvance' as const, frames: [{ id: 'frame-retrospective', name: 'Cadre canonique de fixture', plan: fixture.plan }],
        arithmetic: fixture.arithmetic,
        restStability: { status: 'notEstablished' as const, explanation: 'La stabilité reste non établie.', conditions: [] },
        createdAt: targetAt, createdBy: actor }, data: fixture.data,
    };
    const unqualifiedHistoricalChoice = prepareHopV55ObservationProjection({ ...historicalProjectionInput,
      expectedAnchorReference: 'anchor-ref-stale' });
    expect(unqualifiedHistoricalChoice.status).toBe('needs');

    const q2 = prepareHopV55ObservationProjection(historicalProjectionInput);
    expect(q2.status).toBe('ready');
    if (q2.status !== 'ready') return;
    expect(q2.selection.selected).toBeNull();
    expect(q2.selection.candidates.find(row => row.observation.id === fixture.note.id)?.status).not.toBe('applicable');
    expect(q2.chosenAnchor.observationReference).toEqual(anchorPrepared.record.observationReference);
    expect(q2.chosenAnchor.anchor?.reference).toBe(anchorPrepared.record.anchor?.reference);
    expect(q2.chosenAnchor.anchor.observation).toMatchObject({ id: fixture.note.id, version: 1,
      sense: { kind: 'sensoryRating', value: 37 }, scale: { status: 'known', scale: { domain: { min: 0, max: 100 } } } });
    expect(q2.record.anchorRecordId).toBe(anchorPrepared.record.id);
    expect(q2.record.currentPreparationRecordId).toBe(targetPreparation.record.id);
    const request = q2.projection.requestSnapshot;
    expect(request.anchor.observedState.asOf).toBe(fixture.options.asOf);
    expect(request.observedInput.source.state.asOf).toBe(fixture.options.asOf);
    expect(request.observedInput.used[0]).toMatchObject({ grams: 80, elapsedHours: 6 });
    expect(request.targetInput.source.current.source.state.asOf).toBe(targetAt);
    expect(request.targetInput.source.current.status).toBe('unknown');
    expect(request.targetInput.source.future).toEqual([]);
    expect(request.targetInput.source.contactTargets).toEqual([]);
    expect(request.targetInput.source.horizon).toMatchObject({ kind: 'instant', at: targetAt });
    const withQ2 = appendHopV55ObservationProjection(targetWorkspace, q2.record);
    expect(withQ2.observationProjections?.[0]).toEqual(q1.record);
    expect(withQ2.observationProjections?.[1]).toEqual(q2.record);

    const journal = readBrewingReferenceRecord(withQ2.referenceJournal!.record, withQ2.referenceJournal!.events);
    if ('status' in journal) throw Error('Le journal de fixture après Q2 doit rester lisible.');
    const correction = createBrewingReferenceObservationCorrectionCommand({ journal,
      expectedObservation: anchorPrepared.record.observationReference!, commandId: 'correct-retrospective-note-37',
      recordedAt: targetAt, correctedBy: { label: 'Correcteur de fixture' }, reason: 'Corriger la valeur de la version historique sans nouveau fait physique.',
      changes: { value: 38 } });
    const revisedAnchor = prepareHopV55ObservationAnchor({ workspace: withQ2, id: 'anchor-record-37-v2-at-6h',
      source: { kind: 'reanchorCorrection', previousAnchorRecordId: anchorPrepared.record.id }, referenceCommand: correction,
      anchor: { subjectRelation: 'sameSubject', explanation: 'Version 2 corrigée, ancrée au même état historique.',
        createdAt: targetAt, createdBy: actor } });
    expect(revisedAnchor.status).toBe('ready');
    if (revisedAnchor.status !== 'ready') return;
    const withRevisedAnchor = appendHopV55ObservationAnchor(withQ2, revisedAnchor.record, revisedAnchor.referenceJournalPatch);
    const staleVersion = prepareHopV55ObservationProjection({ ...historicalProjectionInput, workspace: withRevisedAnchor,
      expectedObservationReference: revisedAnchor.record.observationReference! });
    expect(staleVersion.status).toBe('needs');
    const oldVersionAfterCorrection = prepareHopV55ObservationProjection({ ...historicalProjectionInput, workspace: withRevisedAnchor,
      projection: { ...historicalProjectionInput.projection, id: 'projection-retrospective-q3-v1-source',
        question: 'Reprise explicite de la version 1 conservée.' } });
    expect(oldVersionAfterCorrection.status).toBe('ready');
    if (oldVersionAfterCorrection.status !== 'ready') return;
    expect(oldVersionAfterCorrection.chosenAnchor.observationReference).toEqual(anchorPrepared.record.observationReference);
    expect(oldVersionAfterCorrection.projection.requestSnapshot.anchor.observation.sense).toEqual({ kind: 'sensoryRating', value: 37 });
    const q3 = prepareHopV55ObservationProjection({ ...historicalProjectionInput, workspace: withRevisedAnchor,
      anchorRecordId: revisedAnchor.record.id, expectedAnchorReference: revisedAnchor.record.anchor!.reference,
      expectedObservationReference: revisedAnchor.record.observationReference!,
      projection: { ...historicalProjectionInput.projection, id: 'projection-retrospective-q3-v2-source',
        question: 'Depuis la version corrigée à ancre historique exacte.' } });
    expect(q3.status).toBe('ready');
    if (q3.status !== 'ready') return;
    expect(q3.selection.selected).toBeNull();
    expect(q3.chosenAnchor.anchor.observation).toMatchObject({ id: fixture.note.id, version: 2, sense: { kind: 'sensoryRating', value: 38 } });
    const withQ3 = appendHopV55ObservationProjection(withRevisedAnchor, oldVersionAfterCorrection.record);
    const withQ4 = appendHopV55ObservationProjection(withQ3, q3.record);
    expect(withQ4.observationProjections?.[0]).toEqual(q1.record);
    expect(withQ4.observationProjections?.[1]).toEqual(q2.record);
    expect(withQ4.observationProjections?.[2]).toEqual(oldVersionAfterCorrection.record);
    expect(withQ4.observationProjections?.[3]).toEqual(q3.record);
  });

  it('archive Q1 canonique, refuse le conflit CAS, puis réappende la même archive sans reprojecter', async () => {
    const { plan, noteDefinition, data } = await domainSetup();
    const { workspace, note } = workspaceWithOpenJournal(noteDefinition, 'workspace-observation-cas');
    const first = recordFirstAnchor(workspace, note);
    let initialWithAnchor = appendHopV55ObservationAnchor(workspace, first.record, first.referenceJournalPatch);
    const savedCurrent = prepareHopV55CurrentPreparationRecord({ workspace: initialWithAnchor, id: 'current-preparation-q1',
      context: context(currentAt), options: preparationOptions(currentAt, currentAt) });
    expect(savedCurrent.status).toBe('ready');
    if (savedCurrent.status !== 'ready') return;
    initialWithAnchor = appendHopV55CurrentPreparationRecord(initialWithAnchor, savedCurrent.record);
    const repository = createHopV55WorkspaceRepository({ ownerKey: workspace.ownerKey, database: new MemoryDatabase() });
    const created = await repository.save(initialWithAnchor, null);

    const touch = structuredClone(created); touch.title = 'Révision concurrente explicite'; touch.updatedAt = currentAt;
    await repository.save(touch, created.revision);
    let engineReads = 0;
    const guardedData = new Proxy(data, { get(target, property, receiver) { engineReads++; return Reflect.get(target, property, receiver); } });
    const mismatchedRole = projectionInput(created, plan, noteDefinition, guardedData);
    mismatchedRole.target.horizon.at = targetAt;
    expect(prepareHopV55ObservationProjection(mismatchedRole)).toMatchObject({ status: 'needs' });
    expect(engineReads).toBe(0);
    const projection = prepareHopV55ObservationProjection(projectionInput(created, plan, noteDefinition, guardedData));
    expect(projection.status).toBe('ready');
    if (projection.status !== 'ready') return;
    expect(projection.projection.frames[0].status).toBe('unknown');
    expect(projection.projection.frames[0].delta).toBeNull();
    expect(engineReads).toBe(0);
    expect(projection.record.question).toEqual({ text: 'Question synthétique Q1 archivée.',
      projectionQuestionReference: projection.projection.questionReference });
    const tampered = structuredClone(projection.record); tampered.question.text = 'Question altérée sans nouvelle référence.';
    expect(() => readHopV55ObservationProjectionRecord(tampered)).toThrow(/altérée|référence/i);

    const archived = appendHopV55ObservationProjection(created, projection.record);
    await expect(repository.save(archived, created.revision)).rejects.toMatchObject({ code: 'staleRevision' });
    const latest = await repository.read(workspace.ownerKey, workspace.id);
    if (!latest) throw Error('Le workspace concurrent doit être relisible.');
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('La reprise ne relit ni moteur ni horloge.'); });
    let saved;
    try {
      const rebased = appendHopV55ObservationProjection(latest, projection.record);
      saved = await repository.save(rebased, latest.revision);
      expect(readHopV55ObservationProjectionRecord(saved.observationProjections?.[0]).status).toBe('readOnly');
      expect(saved.observationProjections?.[0]).toEqual(projection.record);
      expect(engineReads).toBe(0);
    } finally { clock.mockRestore(); }

    const q1Saved = structuredClone(saved!);
    const q1Workspace = structuredClone(saved!);
    const conflictingId = structuredClone(projection.record);
    conflictingId.question.text = 'Question synthétique Q1 modifiée sous le même identifiant.';
    conflictingId.reference = hopV55ObservationProjectionRecordReference(conflictingId);
    expect(() => appendHopV55ObservationProjection(q1Workspace, conflictingId)).toThrow(/référence|identifiant/i);

    const journalRead = readBrewingReferenceRecord(q1Saved.referenceJournal!.record, q1Saved.referenceJournal!.events);
    if ('status' in journalRead) throw Error('Le journal après Q1 doit rester lisible.');
    const correction = createBrewingReferenceObservationCorrectionCommand({ journal: journalRead,
      expectedObservation: q1Saved.observationAnchors![0].observationReference!,
      commandId: 'correct-session-after-q1', recordedAt: currentAt, correctedBy: { label: 'Correcteur fixture' },
      reason: 'Nouvelle version de la note NR, sans nouvelle dégustation.', changes: { value: 4 } });
    const reanchor = prepareHopV55ObservationAnchor({ workspace: q1Saved, id: 'anchor-record-after-q1',
      source: { kind: 'reanchorCorrection', previousAnchorRecordId: 'anchor-record-1' }, referenceCommand: correction,
      anchor: { subjectRelation: 'sameSubject', explanation: 'Même état historique; nouvelle ancre exacte de la correction.',
        createdAt: currentAt, createdBy: actor } });
    expect(reanchor.status).toBe('ready');
    if (reanchor.status !== 'ready') return;
    const corrected = appendHopV55ObservationAnchor(q1Saved, reanchor.record, reanchor.referenceJournalPatch);
    const correctedSaved = await repository.save(corrected, q1Saved.revision);
    const q2Input = projectionInput(correctedSaved, plan, noteDefinition, guardedData, 'targetHorizon');
    q2Input.projection.id = 'projection-q2';
    q2Input.projection.question = 'Question synthétique Q2 après la correction NR.';
    const q2 = prepareHopV55ObservationProjection(q2Input);
    expect(q2.status).toBe('ready');
    if (q2.status !== 'ready') return;
    expect(q2.record.projectionReference).not.toBe(projection.record.projectionReference);
    const withQ2 = appendHopV55ObservationProjection(correctedSaved, q2.record);
    expect(withQ2.observationProjections?.[0]).toEqual(projection.record);
    expect(withQ2.observationProjections).toHaveLength(2);
    expect(engineReads).toBe(0);

    const futureArchiveRecord = structuredClone(projection.record);
    futureArchiveRecord.id = 'projection-future-archive';
    futureArchiveRecord.archive = { format: 'brewing-observation-projection-archive-v9', payload: ['future', null, 'retained'] };
    futureArchiveRecord.reference = hopV55ObservationProjectionRecordReference(futureArchiveRecord);
    expect(readHopV55ObservationProjectionRecord(futureArchiveRecord)).toMatchObject({ status: 'unsupportedReadOnly' });
    const futureWorkspace = structuredClone(created); futureWorkspace.revision = 0; futureWorkspace.observationProjections = [futureArchiveRecord];
    const futureRepository = createHopV55WorkspaceRepository({ ownerKey: workspace.ownerKey, database: new MemoryDatabase() });
    const futureCreated = await futureRepository.save(futureWorkspace, null);
    const futureRead = await futureRepository.read(workspace.ownerKey, workspace.id);
    expect(futureRead?.observationProjections?.[0]).toEqual(futureArchiveRecord);
    const preserveFuture = structuredClone(futureCreated); preserveFuture.title = 'Autre métadonnée, format futur inchangé';
    const futureUpdated = await futureRepository.save(preserveFuture, futureCreated.revision);
    expect(futureUpdated.observationProjections?.[0]).toEqual(futureArchiveRecord);
    futureRepository.close();
    repository.close();
  });
});
