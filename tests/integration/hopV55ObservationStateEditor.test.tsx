import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { loadHopV55CanonicalObservationFixture } from '../../src/services/hopV55/canonicalObservationFixture';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { getHopV55ReferenceProjection } from '../../src/services/hopV55/referenceWorkspace';
import { applyHopV55ReferenceEvent, ensureHopV55ReferenceJournal, hopV55ReferenceContextId } from '../../src/services/hopV55/referenceWorkspace';
import { brewingObservationFactReference } from '../../src/domain/brewingObservationNumerics';
import {
  appendHopV55CurrentPreparationRecord,
  appendHopV55ObservationAnchor,
  appendHopV55ObservationProjection,
  prepareHopV55CurrentPreparationRecord,
  prepareHopV55ObservationAnchor,
  prepareHopV55ObservationProjection,
  readHopV55ObservationAnchorRecord,
  resolveHopV55CurrentObservation,
} from '../../src/services/hopV55/observationSession';
import { HopV55ReferencePanel } from '../../src/ui/hopV55/ReferencePanel';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function localInputAt(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function workspace(id = 'workspace-observation-state-fixture', sourceBatchId?: string): HopV55Workspace {
  return { format: 'hop-v55-workspace-v1', id, ownerKey: 'fixture-owner', revision: 0,
    ...(sourceBatchId ? { sourceBatchId } : {}),
    title: 'Workspace de test d’ancrage', intent: { question: '', criteria: [] }, scenarioIds: [],
    referenceHypotheses: [], copies: [], updatedAt: '2026-10-02T00:00:00.000Z' };
}

function harness(initial: HopV55Workspace) {
  let current = structuredClone(initial);
  const getWorkspace = vi.fn(async () => structuredClone(current));
  const onSave = vi.fn(async (next: HopV55Workspace) => {
    if (next.revision !== current.revision) throw new Error('staleRevision · le workspace a changé.');
    current = { ...structuredClone(next), revision: current.revision + 1 };
    return structuredClone(current);
  });
  return { getWorkspace, onSave, current: () => current };
}

function decodedObservationRecords(value: HopV55Workspace) {
  return (value.observationAnchors ?? []).flatMap(raw => {
    const read = readHopV55ObservationAnchorRecord(raw);
    return read.status === 'readOnly' ? [read.record] : [];
  });
}

function noteAnchors(value: HopV55Workspace) {
  return decodedObservationRecords(value).filter(row => row.recordKind === 'observationAnchor' && !!row.anchor);
}

function currentPreparations(value: HopV55Workspace) {
  return decodedObservationRecords(value).filter(row => row.recordKind === 'currentPreparation');
}

async function workspaceWithExistingObservationAndQuestion(fixture: Awaited<ReturnType<typeof loadHopV55CanonicalObservationFixture>>) {
  const prepared = prepareBrewingScenarioContext(fixture.context);
  let current = ensureHopV55ReferenceJournal(workspace('workspace-state-only-existing-question', fixture.context.batch!.id),
    fixture.context, prepared);
  const command = { ownerKey: current.ownerKey, contextId: hopV55ReferenceContextId(current.id), commandId: 'state-only-existing-note',
    expectedRevision: current.referenceJournal!.record.revision, recordedAt: fixture.note.observedAt,
    kind: 'observationRecorded' as const, payload: { observation: fixture.note } };
  current = applyHopV55ReferenceEvent(current, command);
  const anchor = prepareHopV55ObservationAnchor({ workspace: current, id: 'state-only-existing-note-anchor',
    source: { kind: 'context', context: fixture.context, options: fixture.options },
    observationReference: { id: fixture.note.id, version: fixture.note.version,
      contentReference: brewingObservationFactReference(fixture.note) },
    anchor: { subjectRelation: 'sameSubject', explanation: 'Identité exacte du batch canonique de fixture.',
      createdAt: '2026-10-02T07:00:00.000Z', createdBy: { origin: 'user', name: 'Brasseur fixture' } } });
  if (anchor.status !== 'ready') throw Error('L’ancre antérieure au parcours sans note doit être prête.');
  current = appendHopV55ObservationAnchor(current, anchor.record, anchor.referenceJournalPatch);
  const currentPreparation = prepareHopV55CurrentPreparationRecord({ workspace: current, id: 'state-only-original-preparation',
    context: fixture.context, options: fixture.options });
  if (currentPreparation.status !== 'ready') throw Error('L’état courant initial de fixture doit être prêt.');
  current = appendHopV55CurrentPreparationRecord(current, currentPreparation.record);
  const question = prepareHopV55ObservationProjection({ workspace: current, currentPreparationRecordId: currentPreparation.record.id,
    requestedDimension: { status: 'resolved', definition: fixture.noteDefinition },
    requiredDependencyIds: fixture.options.hopScope!.dependencyIds, target: fixture.target,
    projection: { id: 'state-only-older-question', question: 'Question antérieure conservée.', role: 'targetHorizon',
      frames: [{ id: 'state-only-existing-frame', name: 'Cadre exact de fixture', plan: fixture.plan }],
      arithmetic: fixture.arithmetic, restStability: fixture.restStability,
      createdAt: '2026-10-02T07:10:00.000Z', createdBy: { origin: 'user', name: 'Brasseur fixture' } }, data: fixture.data });
  if (question.status !== 'ready') throw Error(`La question antérieure de fixture doit être archivable: ${question.status}`);
  current = appendHopV55ObservationProjection(current, question.record);
  return { workspace: current, prepared, question: question.record };
}

function fillOrdinalNote(definitionReference: string, note = '37 sur l’échelle ordinale synthétique 0–100.') {
  fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: localInputAt('2026-10-02T06:00:00.000Z') } });
  fireEvent.change(screen.getByLabelText('Nature du constat'), { target: { value: 'sensoryRating' } });
  fireEvent.change(screen.getByLabelText('Dimension de l’observation'), { target: { value: definitionReference } });
  fireEvent.change(screen.getByLabelText('Note sensorielle'), { target: { value: '37' } });
  fireEvent.change(screen.getByLabelText('Texte original de la note'), { target: { value: note } });
}

describe('État dégusté, ancre et journal dans le même CAS', () => {
  it('conserve la note 37/100 avec la définition ordinale exacte, sans attestation de contact ni complétude inventée', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const initial = workspace();
    const h = harness(initial);
    const prepared = prepareBrewingScenarioContext(fixture.context);
    render(<HopV55ReferencePanel workspace={initial} context={fixture.context} prepared={prepared}
      observationDefinitions={[fixture.noteDefinition]} getWorkspace={h.getWorkspace} onSave={h.onSave} />);

    fillOrdinalNote(fixture.noteDefinition.contentReference);
    expect(screen.getByText(/Échelle exacte/)).toBeInTheDocument();
    expect(screen.getByLabelText('État du contact hop-0')).toHaveValue('unknown');
    expect(screen.getByText(/durée reste inconnue/)).toBeInTheDocument();
    expect(h.getWorkspace).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer cette observation' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));

    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));
    const saved = h.current();
    const observations = getHopV55ReferenceProjection(saved)!.observations;
    expect(saved.referenceJournal?.events.map(row => row.kind)).toEqual(['contextOpened', 'observationRecorded']);
    expect(noteAnchors(saved)).toHaveLength(1);
    expect(h.getWorkspace).toHaveBeenCalledTimes(1);
    expect(currentPreparations(saved)).toHaveLength(1);
    expect(currentPreparations(saved)[0].preparation.state?.asOf).toBe('2026-10-02T06:00:00.000Z');
    expect(currentPreparations(saved)[0].preparation.hopScope).toBeNull();
    expect(currentPreparations(saved)[0].preparation.observedHopInput).toBeNull();
    expect(screen.getByText(/Aucune portée de dépendances n’est fournie/)).toBeInTheDocument();
    const anchorRecord = noteAnchors(saved)[0];
    expect(currentPreparations(saved)[0].preparation.reference).toBe(anchorRecord.preparation.reference);
    expect(currentPreparations(saved)[0].preparationOptions).toEqual(anchorRecord.preparationOptions);
    const anchor = anchorRecord.anchor!;
    expect(anchor.observationReference).toBeDefined();
    expect(observations[0]).toMatchObject({
      id: anchor.observation.id,
      observedAt: '2026-10-02T06:00:00.000Z',
      subject: { kind: 'beer', id: 'batch:fixture-canonical-batch' },
      sense: { kind: 'sensoryRating', value: 37 },
      dimension: { status: 'resolved', definition: { contentReference: fixture.noteDefinition.contentReference,
        metric: { kind: 'ordinalNote', id: 'fixture-ordinal-intensity' }, scale: { domain: { min: 0, max: 100 } } } },
      scale: { status: 'known', metric: { kind: 'ordinalNote', unit: null }, scale: { domain: { min: 0, max: 100 } } },
    });
    expect(anchor.observedState.asOf).toBe('2026-10-02T06:00:00.000Z');
    expect(anchor.observedState.knowledgeAsOf).toBe(anchorRecord.preparationOptions.knowledgeAsOf);
    expect(anchorRecord.preparation.sourceSnapshot?.hops[0].weightG).toBe(200);
    expect(anchorRecord.preparation.sourceSnapshot?.hops[0].weightG).not.toBe(999);
    expect(anchor.observedState.coverage).toEqual([]);
    expect(anchor.observedState.contactStates[0]).toMatchObject({ status: 'continuityUnknown' });
    expect(anchor.observedState.contactStates[0]).not.toHaveProperty('elapsedSeconds');
    expect(anchorRecord.preparationOptions.contactAttestations).toBeUndefined();
    expect(anchorRecord.preparationOptions.coverageAttestations).toBeUndefined();
    expect(screen.getByText(/État dégusté et ancre historique/)).toBeInTheDocument();
  });

  it('prépare une entrée seulement avec la portée explicite, puis corrige depuis l’ancre malgré un contexte courant modifié', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const initial = workspace('workspace-observation-correction-fixture');
    const h = harness(initial);
    const prepared = prepareBrewingScenarioContext(fixture.context);
    const first = render(<HopV55ReferencePanel workspace={initial} context={fixture.context} prepared={prepared}
      observationDefinitions={[fixture.noteDefinition]} observationScope={fixture.options.hopScope}
      getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    fillOrdinalNote(fixture.noteDefinition.contentReference);

    fireEvent.change(screen.getByLabelText('État du contact hop-0'), { target: { value: 'activeThrough' } });
    fireEvent.change(screen.getByLabelText('Instant de contact hop-0'), { target: { value: localInputAt('2026-10-02T06:00:00.000Z') } });
    fireEvent.change(screen.getByLabelText('Nature de la source des contacts'), { target: { value: 'carnet de brassage' } });
    fireEvent.change(screen.getByLabelText('Référence de source des contacts'), { target: { value: 'fixture://contact-at-cutoff' } });
    fireEvent.change(screen.getByLabelText('Description de source des contacts'), { target: { value: 'Le houblon était encore en contact à la dégustation.' } });
    fireEvent.click(screen.getByLabelText(/attester les matières et quantités réalisées/));
    fireEvent.click(screen.getByLabelText(/attester la durée des contacts/));
    fireEvent.change(screen.getByLabelText('Début de la période contrôlée'), { target: { value: localInputAt('2026-10-02T00:00:00.000Z') } });
    fireEvent.change(screen.getByLabelText('Nature de la source de couverture'), { target: { value: 'journal vérifié' } });
    fireEvent.change(screen.getByLabelText('Référence de source de couverture'), { target: { value: 'fixture://coverage-materials' } });
    fireEvent.change(screen.getByLabelText('Description de source de couverture'), { target: { value: 'Contrôle complet des matières sur la période.' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer cette observation' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));

    const firstSaved = h.current();
    const firstRecord = noteAnchors(firstSaved)[0];
    if (!firstRecord?.anchor) throw new Error('L’ancre initiale doit être conservée.');
    const firstAnchor = firstRecord.anchor;
    const noteId = firstAnchor.observation.id;
    expect(currentPreparations(firstSaved)[0].preparation.hopScope).toEqual(fixture.options.hopScope);
    expect(currentPreparations(firstSaved)[0].preparation.observedHopInput?.status).toBe('available');
    expect(firstAnchor.observedState.contactDispositions[0]).toMatchObject({ disposition: 'effective' });
    expect(firstAnchor.observedState.contactStates[0]).toMatchObject({ status: 'active', elapsedSeconds: 6 * 3600 });
    expect(firstAnchor.observedState.coverageDispositions).toContainEqual(expect.objectContaining({ dependencyId: 'hopMaterials', disposition: 'applies' }));
    expect(firstAnchor.observedState.coverageDispositions).toContainEqual(expect.objectContaining({ dependencyId: 'hopContact', disposition: 'applies' }));
    expect(firstAnchor.observedState.coverage[0]).toMatchObject({ fromAt: '2026-10-02T00:00:00.000Z', throughAt: '2026-10-02T06:00:00.000Z', status: 'complete' });
    first.unmount();

    const changedContext = structuredClone(fixture.context);
    changedContext.batch!.recipeSnapshot.hops[0].weightG = 444;
    (changedContext.journal!.additions!['hop-0'] as { amount: number }).amount = 17;
    const changedPrepared = prepareBrewingScenarioContext(changedContext);
    render(<HopV55ReferencePanel workspace={firstSaved} context={changedContext} prepared={changedPrepared}
      observationDefinitions={[fixture.noteDefinition]} observationScope={fixture.options.hopScope}
      getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    fireEvent.change(screen.getByLabelText('Action d’observation'), { target: { value: 'correction' } });
    fireEvent.change(screen.getByLabelText('Observation à corriger'), { target: { value: noteId } });
    expect(screen.getByText('Ancre historique reprise')).toBeInTheDocument();
    expect(screen.getAllByText(firstRecord.preparation.sourceSnapshotReference!).length).toBeGreaterThan(0);
    expect(screen.getAllByText('2026-10-02T06:00:00.000Z').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Note sensorielle'), { target: { value: '39' } });
    fireEvent.change(screen.getByLabelText('Texte original de la note'), { target: { value: 'Correction de transcription : 39 sur la même échelle.' } });
    fireEvent.change(screen.getByLabelText('Motif de correction'), { target: { value: 'Correction de lecture du carnet.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la correction comme version suivante' }));

    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(2));
    const corrected = h.current();
    expect(noteAnchors(corrected)).toHaveLength(2);
    expect(currentPreparations(corrected)).toHaveLength(1);
    expect(currentPreparations(corrected)[0]).toEqual(currentPreparations(firstSaved)[0]);
    expect(corrected.referenceJournal?.events.map(row => row.kind)).toEqual(['contextOpened', 'observationRecorded', 'observationCorrected']);
    const [oldRecord, nextRecord] = noteAnchors(corrected);
    if (!oldRecord.anchor || !nextRecord.anchor) throw new Error('Les deux versions doivent garder une ancre lisible.');
    expect(oldRecord).toEqual(firstRecord);
    expect(nextRecord.preparation).toEqual(firstRecord.preparation);
    expect(nextRecord.anchor.observedState.resolutionReference).toBe(firstAnchor.observedState.resolutionReference);
    expect(nextRecord.anchor.previousAnchorReference).toBe(firstAnchor.reference);
    expect(nextRecord.anchor.observation.sense).toEqual({ kind: 'sensoryRating', value: 39 });
    expect(nextRecord.preparation.sourceSnapshot?.hops[0].weightG).toBe(200);
    expect(nextRecord.preparation.sourceSnapshot?.hops[0].weightG).not.toBe(444);
  });

  it('sépare la date de prélèvement, l’instant de dégustation et une continuité laissée inconnue', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const initial = workspace('workspace-observation-sample-fixture');
    const h = harness(initial);
    render(<HopV55ReferencePanel workspace={initial} context={fixture.context} prepared={prepareBrewingScenarioContext(fixture.context)}
      getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: localInputAt('2026-10-02T06:00:00.000Z') } });
    fireEvent.change(screen.getByLabelText('Sujet de l’état observé'), { target: { value: 'sample' } });
    fireEvent.change(screen.getByLabelText('ID exact de l’échantillon'), { target: { value: 'sample-sensory-01' } });
    fireEvent.change(screen.getByLabelText('Version du prélèvement'), { target: { value: 'v1' } });
    fireEvent.change(screen.getByLabelText('Instant exact du prélèvement'), { target: { value: localInputAt('2026-10-02T05:00:00.000Z') } });
    fireEvent.change(screen.getByLabelText('Nature de la source du prélèvement'), { target: { value: 'carnet de laboratoire' } });
    fireEvent.change(screen.getByLabelText('Référence de source du prélèvement'), { target: { value: 'fixture://sample-collection' } });
    fireEvent.change(screen.getByLabelText('Description de source du prélèvement'), { target: { value: 'Heure de collecte portée par la fiche synthétique.' } });
    fireEvent.change(screen.getByLabelText('Libellé de dimension libre'), { target: { value: 'arôme perçu' } });
    fireEvent.change(screen.getByLabelText('Note qualitative originale'), { target: { value: 'Échantillon dégusté une heure après collecte.' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer cette observation' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));

    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));
    const read = noteAnchors(h.current())[0];
    if (!read?.anchor) throw new Error('L’ancre sample doit être conservée.');
    expect(currentPreparations(h.current())).toHaveLength(1);
    expect(read.anchor.observation.subject).toMatchObject({ kind: 'sample', id: 'sample:sample-sensory-01' });
    expect(read.anchor.observation.observedAt).toBe('2026-10-02T06:00:00.000Z');
    expect(read.anchor.observedState.asOf).toBe('2026-10-02T05:00:00.000Z');
    expect(read.anchor.observedState.subject.kind).toBe('sample');
    expect(read.anchor.observedState.subject.kind === 'sample' && read.anchor.observedState.subject.collection.effectiveAt)
      .toBe('2026-10-02T05:00:00.000Z');
    expect(read.anchor.observedState.sampleContinuity).toEqual([]);
    expect(read.anchor.observedState.contactStates[0]).toMatchObject({ status: 'continuityUnknown' });
    expect(read.anchor.observedState.contactStates[0]).not.toHaveProperty('elapsedSeconds');
  });

  it('conserve un currentPreparation sans créer de note/ancre NR et laisse sélectionnable la note de l’état exact', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const initial = await workspaceWithExistingObservationAndQuestion(fixture);
    const h = harness(initial.workspace);
    const view = render(<HopV55ReferencePanel workspace={initial.workspace} context={fixture.context} prepared={initial.prepared}
      observationDefinitions={[fixture.noteDefinition]} observationScope={fixture.options.hopScope}
      getWorkspace={h.getWorkspace} onSave={h.onSave} />);

    fireEvent.click(screen.getByText('État physique sans nouvelle dégustation'));
    const statePanel = screen.getByTestId('hop-v55-current-preparation-state');
    expect(within(statePanel).getByLabelText('Instant physique de l’état à conserver')).toHaveValue('');
    fireEvent.change(within(statePanel).getByLabelText('Instant physique de l’état à conserver'),
      { target: { value: localInputAt('2026-10-02T06:00:00.000Z') } });
    fireEvent.change(within(statePanel).getByLabelText('État du contact hop-0'), { target: { value: 'activeThrough' } });
    fireEvent.change(within(statePanel).getByLabelText('Instant de contact hop-0'),
      { target: { value: localInputAt('2026-10-02T06:00:00.000Z') } });
    fireEvent.change(within(statePanel).getByLabelText('Nature de la source des contacts'), { target: { value: 'carnet synthétique vérifié' } });
    fireEvent.change(within(statePanel).getByLabelText('Référence de source des contacts'), { target: { value: 'fixture://state-only-contact' } });
    fireEvent.change(within(statePanel).getByLabelText('Description de source des contacts'),
      { target: { value: 'Le contact actif est attesté au même instant physique.' } });
    fireEvent.click(within(statePanel).getByLabelText(/attester les matières et quantités réalisées/));
    fireEvent.click(within(statePanel).getByLabelText(/attester la durée des contacts/));
    fireEvent.change(within(statePanel).getByLabelText('Début de la période contrôlée'),
      { target: { value: localInputAt('2026-10-02T00:00:00.000Z') } });
    fireEvent.change(within(statePanel).getByLabelText('Nature de la source de couverture'), { target: { value: 'journal synthétique vérifié' } });
    fireEvent.change(within(statePanel).getByLabelText('Référence de source de couverture'), { target: { value: 'fixture://state-only-coverage' } });
    fireEvent.change(within(statePanel).getByLabelText('Description de source de couverture'),
      { target: { value: 'Les deux dépendances sont complètes sur la période déclarée.' } });

    const noteCount = getHopV55ReferenceProjection(initial.workspace)!.observations.length;
    const journalEvents = structuredClone(initial.workspace.referenceJournal!.events);
    const oldQuestion = structuredClone(initial.workspace.observationProjections![0]);
    const currentPreparationPanel = within(screen.getByTestId('hop-v55-current-preparation'));
    await waitFor(() => expect(currentPreparationPanel.getByRole('button', { name: 'Conserver cet état sans ajouter de note' })).toBeEnabled());
    expect(h.getWorkspace).not.toHaveBeenCalled();
    fireEvent.click(currentPreparationPanel.getByRole('button', { name: 'Conserver cet état sans ajouter de note' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));

    const saved = h.current();
    expect(saved.referenceJournal?.events).toEqual(journalEvents);
    expect(getHopV55ReferenceProjection(saved)!.observations).toHaveLength(noteCount);
    expect(noteAnchors(saved)).toHaveLength(1);
    expect(saved.observationProjections).toEqual([oldQuestion]);
    expect(currentPreparations(saved)).toHaveLength(2);
    expect(currentPreparations(saved)[1].preparation.state?.asOf).toBe('2026-10-02T06:00:00.000Z');
    expect(currentPreparations(saved)[1].preparation.observedHopInput?.status).toBe('available');
    expect(resolveHopV55CurrentObservation({ workspace: saved,
      requestedDimension: { status: 'resolved', definition: fixture.noteDefinition },
      requiredDependencyIds: fixture.options.hopScope!.dependencyIds })).toMatchObject({
      status: 'selected', selection: { selected: { observation: { id: fixture.note.id } } },
    });

    view.rerender(<HopV55ReferencePanel workspace={saved} context={fixture.context} prepared={initial.prepared}
      observationDefinitions={[fixture.noteDefinition]} observationScope={fixture.options.hopScope}
      getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    await waitFor(() => expect(screen.getByText(/conservé sans nouvelle note NR/)).toBeInTheDocument());
  });

  it('conserve un 0 sans unité comme inconnu, puis qualifie seulement la clé de journal choisie avec source', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const context = structuredClone(fixture.context);
    const addition = context.journal!.additions!['hop-0'] as { amount: number; unit?: string };
    addition.amount = 0;
    delete addition.unit;
    const initial = workspace('workspace-observation-legacy-unit-fixture');
    const h = harness(initial);
    render(<HopV55ReferencePanel workspace={initial} context={context} prepared={prepareBrewingScenarioContext(context)}
      getWorkspace={h.getWorkspace} onSave={h.onSave} />);

    const enterSimpleNote = (value: string) => {
      fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: localInputAt('2026-10-02T06:00:00.000Z') } });
      fireEvent.change(screen.getByLabelText('Libellé de dimension libre'), { target: { value: 'arôme perçu' } });
      fireEvent.change(screen.getByLabelText('Note qualitative originale'), { target: { value } });
    };
    enterSimpleNote('Première note qualitative, unité historique non établie.');
    expect(screen.getByText(/hop-0 · 0 \(unité inconnue\)/)).toBeInTheDocument();
    const qualify = screen.getByText(/hop-0 · 0 \(unité inconnue\)/).closest('label')!.querySelector('input[type="checkbox"]')!;
    expect(qualify).not.toBeChecked();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer cette observation' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));
    const first = noteAnchors(h.current())[0];
    if (!first?.anchor) throw new Error('L’observation non qualifiée doit garder son ancre.');
    const firstMass = first.preparation.stateInput!.facts.find(row => row.kind === 'materialAdded')!;
    expect(firstMass.quantity).toMatchObject({ status: 'unitUnknown', value: 0, rawUnit: '(unité absente)' });
    expect(first.preparationOptions.legacyHopUnitQualification).toBeUndefined();

    enterSimpleNote('Deuxième note, avec qualification explicitement sourcée.');
    fireEvent.click(screen.getByLabelText(/hop-0.*0/));
    fireEvent.change(screen.getByLabelText('Motif de qualification en grammes'), { target: { value: 'Convention historique confirmée pour cette ligne exacte.' } });
    fireEvent.change(screen.getByLabelText('Nature de la source de l’unité historique'), { target: { value: 'carnet historique' } });
    fireEvent.change(screen.getByLabelText('Référence de source de l’unité historique'), { target: { value: 'fixture://legacy-hop-0-g' } });
    fireEvent.change(screen.getByLabelText('Description de source de l’unité historique'), { target: { value: 'Le carnet identifie les quantités de cette ligne en grammes.' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer cette observation' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(2));
    const second = noteAnchors(h.current())[1];
    expect(currentPreparations(h.current())).toHaveLength(2);
    if (!second?.anchor) throw new Error('La qualification exacte doit rester ancrée.');
    const qualifiedMass = second.preparation.stateInput!.facts.find(row => row.kind === 'materialAdded')!;
    expect(qualifiedMass.quantity).toEqual({ status: 'known', value: 0, unit: 'g' });
    expect(second.preparationOptions.legacyHopUnitQualification).toMatchObject({
      additionKeys: ['hop-0'], unit: 'g', reason: 'Convention historique confirmée pour cette ligne exacte.',
      provenance: { reference: 'fixture://legacy-hop-0-g' },
    });
  });
});

