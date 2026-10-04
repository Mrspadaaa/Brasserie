import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { createBrewingSensoryDefinitionReference } from '../../src/domain/brewingSensory';
import { brewingObservationFactReference } from '../../src/domain/brewingObservationNumerics';
import { loadHopV55CanonicalObservationFixture } from '../../src/services/hopV55/canonicalObservationFixture';
import {
  appendHopV55ObservationSupportRecord,
  createHopV55ObservationSupportHopScopeRecord,
  resolveHopV55ObservationSupport,
  readHopV55ObservationSupportRecord,
} from '../../src/services/hopV55/observationSupport';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { applyHopV55ReferenceEvent, ensureHopV55ReferenceJournal, hopV55ReferenceContextId } from '../../src/services/hopV55/referenceWorkspace';
import { HopV55ObservationSupportPanel } from '../../src/ui/hopV55/ObservationSupportPanel';
import { hopV55Workspace } from '../fixtures/hopV55';

afterEach(() => cleanup());

function localInputAt(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function harness(initial: HopV55Workspace) {
  let stored = structuredClone(initial);
  const getWorkspace = vi.fn(async () => structuredClone(stored));
  const onSave = vi.fn(async (next: HopV55Workspace) => {
    if (next.id !== stored.id || next.ownerKey !== stored.ownerKey || next.revision !== stored.revision) throw Error('Révision CAS périmée.');
    stored = { ...structuredClone(next), revision: stored.revision + 1 };
    return structuredClone(stored);
  });
  return { getWorkspace, onSave, current: () => structuredClone(stored) };
}

function component(workspace: HopV55Workspace, fixture: Awaited<ReturnType<typeof loadHopV55CanonicalObservationFixture>>,
  h: ReturnType<typeof harness>) {
  return <HopV55ObservationSupportPanel workspace={workspace} context={fixture.context}
    prepared={prepareBrewingScenarioContext(fixture.context)} getWorkspace={h.getWorkspace} onSave={h.onSave} />;
}

describe('configuration utilisateur du support de comparaison V5.5', () => {
  it('conserve un protocole sourcé et une portée sans attestation, sélectionne leurs références exactes puis les relit', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const initial = hopV55Workspace('support-panel-owner', 'support-panel-first-path');
    const h = harness(initial);
    const view = render(component(initial, fixture, h));

    expect(screen.getByText('Aucune sélection active. Les choix restent vides jusqu’à une action explicite.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer cette sélection exacte' })).toBeDisabled();
    expect(screen.getByLabelText('protocole · Mode de source')).toHaveValue('');
    expect(h.onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Dimension du protocole'), { target: { value: 'new' } });
    fireEvent.change(screen.getByLabelText('Nom de la nuance'), { target: { value: 'arôme mûr' } });
    fireEvent.change(screen.getByLabelText('Définition sensorielle'), { target: { value: 'Arôme perçu à la dégustation; intensité déclarée par le brasseur.' } });
    fireEvent.change(screen.getByLabelText('protocole · Mode de source'), { target: { value: 'external' } });
    fireEvent.change(screen.getByLabelText('Type de source protocole'), { target: { value: 'observation' } });
    expect(screen.getByRole('option', { name: 'Observation' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('protocole · Titre de la source'), { target: { value: 'Carnet de dégustation' } });
    fireEvent.change(screen.getByLabelText('protocole · Auteur de la source'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('protocole · Année de la source'), { target: { value: '2026' } });
    fireEvent.change(screen.getByLabelText('protocole · Référence de la source'), { target: { value: 'fixture://sensory-protocol/pear' } });
    fireEvent.change(screen.getByLabelText('Sens de la note'), { target: { value: 'intensity' } });
    fireEvent.change(screen.getByLabelText('Orientation de l’échelle'), { target: { value: 'increasing' } });
    fireEvent.change(screen.getByLabelText('Domaine numérique de la note'), { target: { value: 'known' } });
    fireEvent.change(screen.getByLabelText('Borne basse incluse'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Borne haute incluse'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Auteur du protocole'), { target: { value: 'Brasseur fixture' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Conserver ce protocole de note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Conserver ce protocole de note' }));
    await waitFor(() => expect(h.current().observationSupportRecords).toHaveLength(1));

    const protocolRaw = h.current().observationSupportRecords![0];
    const protocolRead = readHopV55ObservationSupportRecord(protocolRaw);
    expect(protocolRead.status).toBe('readOnly');
    if (protocolRead.status !== 'readOnly' || protocolRead.record.recordKind !== 'protocolNote') throw Error('Le protocole doit être conservé.');
    expect(protocolRead.record.definition).toMatchObject({ metric: { kind: 'ordinalNote', unit: null }, scale: { domain: { min: 0, max: 100 } } });
    expect(protocolRead.record.meaning).toEqual({ kind: 'intensity', orientation: 'increasing' });
    expect(protocolRead.record.definition.dimension.sourceRefs).toContainEqual(expect.objectContaining({
      reference: 'fixture://sensory-protocol/pear', author: 'Brasseur fixture', year: 2026,
    }));
    expect(h.current().referenceJournal).toBeUndefined();
    expect(h.current().observationAnchors).toBeUndefined();

    expect(screen.getByLabelText('Houblons ajoutés')).not.toBeChecked();
    expect(screen.getByLabelText('Continuité du contact')).not.toBeChecked();
    fireEvent.click(screen.getByLabelText('Houblons ajoutés'));
    fireEvent.click(screen.getByLabelText('Continuité du contact'));
    fireEvent.change(screen.getByLabelText('Début de portée'), { target: { value: localInputAt('2026-10-02T00:00:00.000Z') } });
    fireEvent.change(screen.getByLabelText('Auteur de la portée'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('Motif de la portée'), { target: { value: 'Dépendances retenues pour décrire le périmètre de cette comparaison.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette portée' }));
    await waitFor(() => expect(h.current().observationSupportRecords).toHaveLength(2));

    const scopeRead = readHopV55ObservationSupportRecord(h.current().observationSupportRecords![1]);
    expect(scopeRead.status).toBe('readOnly');
    if (scopeRead.status !== 'readOnly' || scopeRead.record.recordKind !== 'hopScope') throw Error('La portée doit être conservée.');
    expect(scopeRead.record.scope).toMatchObject({ dependencyIds: ['hopMaterials', 'hopContact'],
      fromAt: '2026-10-02T00:00:00.000Z', explanation: 'Dépendances retenues pour décrire le périmètre de cette comparaison.' });
    expect(h.current().observationSupportSelections).toBeUndefined();

    const readyChoices = resolveHopV55ObservationSupport({ workspace: h.current() });
    expect(readyChoices.status).toBe('needsSetup');
    const definitionReference = protocolRead.record.definition.contentReference;
    const scopeReference = scopeRead.record.reference;
    fireEvent.change(screen.getByLabelText('Définition de la sélection'), { target: { value: definitionReference } });
    fireEvent.change(screen.getByLabelText('Portée de la sélection'), { target: { value: scopeReference } });
    fireEvent.change(screen.getByLabelText('Auteur de la sélection'), { target: { value: 'Brasseur fixture' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer cette sélection exacte' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette sélection exacte' }));
    await waitFor(() => expect(h.current().observationSupportSelections).toHaveLength(1));

    const resolved = resolveHopV55ObservationSupport({ workspace: h.current() });
    expect(resolved.status).toBe('ready');
    if (resolved.status !== 'ready') throw Error('Le couple de références exactes doit rendre le support disponible.');
    expect(resolved.selection).toMatchObject({ dimensionReference: definitionReference, hopScopeReference: scopeReference,
      frameReferences: [], arithmeticReference: null });
    expect(resolved.support.adoptedFrames).toEqual([]);
    expect(resolved.support.arithmeticChoices).toEqual([]);
    expect(h.current().referenceJournal).toBeUndefined();
    expect(h.current().observationAnchors).toBeUndefined();
    expect(h.current().observationProjections).toBeUndefined();

    view.unmount();
    render(component(h.current(), fixture, h));
    await waitFor(() => expect(screen.getByLabelText('Définition de la sélection')).toHaveValue(definitionReference));
    expect(screen.getByLabelText('Portée de la sélection')).toHaveValue(scopeReference);
    expect(screen.getByTestId('hop-v55-active-observation-support')).toHaveTextContent(definitionReference);
    const activeSupport = screen.getByTestId('hop-v55-active-observation-support');
    expect(activeSupport).toHaveTextContent('Houblons ajoutés, Continuité du contact');
    const exactReferences = activeSupport.querySelector('details');
    expect(exactReferences).not.toHaveAttribute('open');
    expect(exactReferences).toHaveTextContent('hopMaterials · hopContact');
    expect(h.onSave).toHaveBeenCalledTimes(3);
  });

  it('refuse la correspondance ordinale 0–5 vers indice 0–100 sans créer un contrat', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const initial = hopV55Workspace('support-panel-owner', 'support-panel-mismatch');
    initial.nuancePlans = [structuredClone(fixture.plan)];
    const h = harness(initial);
    render(component(initial, fixture, h));

    const adoptedDefinition = fixture.plan.definitions[0];
    const initialChoices = resolveHopV55ObservationSupport({ workspace: initial });
    const planDimension = initialChoices.choices.dimensions.find(row => row.reference === adoptedDefinition.contentReference);
    if (!planDimension) throw Error('La dimension du plan adopté doit être disponible par référence exacte.');
    fireEvent.change(screen.getByLabelText('Dimension du protocole'), { target: { value: planDimension.reference } });
    fireEvent.change(screen.getByLabelText('Source exacte de la dimension'), { target: { value: adoptedDefinition.dimension.sourceRefs[0].reference } });
    fireEvent.change(screen.getByLabelText('protocole · Mode de source'), { target: { value: 'external' } });
    fireEvent.change(screen.getByLabelText('Type de source protocole'), { target: { value: 'observation' } });
    fireEvent.change(screen.getByLabelText('protocole · Titre de la source'), { target: { value: 'Protocole ordinal séparé' } });
    fireEvent.change(screen.getByLabelText('protocole · Auteur de la source'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('protocole · Référence de la source'), { target: { value: 'fixture://ordinal-protocol/pear' } });
    fireEvent.change(screen.getByLabelText('Sens de la note'), { target: { value: 'intensity' } });
    fireEvent.change(screen.getByLabelText('Orientation de l’échelle'), { target: { value: 'increasing' } });
    fireEvent.change(screen.getByLabelText('Domaine numérique de la note'), { target: { value: 'known' } });
    fireEvent.change(screen.getByLabelText('Borne basse incluse'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Borne haute incluse'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Auteur du protocole'), { target: { value: 'Brasseur fixture' } });
    fireEvent.click(screen.getByRole('button', { name: 'Conserver ce protocole de note' }));
    await waitFor(() => expect(h.current().observationSupportRecords).toHaveLength(1));
    const protocol = readHopV55ObservationSupportRecord(h.current().observationSupportRecords![0]);
    if (protocol.status !== 'readOnly' || protocol.record.recordKind !== 'protocolNote') throw Error('Le protocole ordinale doit exister.');
    expect(protocol.record.definition.dimension.sourceRefs[0].reference).toBe(adoptedDefinition.dimension.sourceRefs[0].reference);
    expect(protocol.record.definition.metric?.sourceRefs[0].reference).toBe('fixture://ordinal-protocol/pear');

    const frameChoiceLabel = `Cadre adopté · ${fixture.plan.sourceModel.name} · version ${fixture.plan.revision}`;
    fireEvent.click(screen.getByLabelText(frameChoiceLabel));
    expect(screen.getByLabelText(frameChoiceLabel)).toBeChecked();
    fireEvent.change(screen.getByLabelText('Définition exacte de note'), { target: { value: protocol.record.definition.contentReference } });
    fireEvent.change(screen.getByLabelText('Cadre exact du calcul'), { target: { value: adoptedDefinition.contentReference } });
    expect(screen.getByLabelText('Cadre exact du calcul')).toHaveValue(adoptedDefinition.contentReference);
    fireEvent.change(screen.getByLabelText('Type d’hypothèse arithmétique'), { target: { value: 'ordinalWorkingHypothesis' } });
    fireEvent.change(screen.getByLabelText('Sens déclaré du cadre'), { target: { value: 'intensity' } });
    fireEvent.change(screen.getByLabelText('Orientation du cadre'), { target: { value: 'increasing' } });
    fireEvent.change(screen.getByLabelText('Motif de la correspondance'), { target: { value: 'Hypothèse de correspondance demandée pour la vérification; domaine à comparer.' } });
    fireEvent.change(screen.getByLabelText('Motif de l’hypothèse arithmétique'), { target: { value: 'Vérifier les bornes avant tout usage.' } });
    fireEvent.change(screen.getByLabelText('Auteur de la convention'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('convention · Mode de source'), { target: { value: 'external' } });
    fireEvent.change(screen.getByLabelText('Type de source convention'), { target: { value: 'observation' } });
    fireEvent.change(screen.getByLabelText('convention · Titre de la source'), { target: { value: 'Carnet de calibration' } });
    fireEvent.change(screen.getByLabelText('convention · Auteur de la source'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('convention · Référence de la source'), { target: { value: 'fixture://arithmetic/check' } });

    expect(adoptedDefinition.scale?.domain).toEqual({ min: 0, max: 100 });
    expect(await screen.findByText(/Refus : domaines incompatibles/)).toHaveTextContent('0–5 vers 0–100');
    expect(screen.getByRole('button', { name: 'Conserver cette convention sans l’activer' })).toBeDisabled();
    expect(h.current().observationSupportRecords?.map(row => (row as { recordKind?: string }).recordKind)).toEqual(['protocolNote']);
    expect(h.current().nuancePlans?.[0]).toEqual(fixture.plan);
    expect(h.current().nuancePlans?.[0].definitions[0].metric?.kind).toBe('modelIndex');
    expect(h.current().observationSupportSelections).toBeUndefined();
  });

  it('affiche la note et son échelle avant la date/version, puis replie les identifiants exacts', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const planDefinition = fixture.plan.definitions[0];
    const noteMetric = { id: 'test-note-metric-3-of-5', version: '1', kind: 'ordinalNote' as const,
      name: 'Note ordinale', meaning: 'Intensité croissante', unit: null, sourceRefs: structuredClone(planDefinition.dimension.sourceRefs) };
    const noteScale = { id: 'test-note-scale-0-5', version: '1', metricRef: { id: noteMetric.id, version: noteMetric.version },
      domain: { min: 0, max: 5 }, sourceRefs: structuredClone(planDefinition.dimension.sourceRefs) };
    const noteDefinition = createBrewingSensoryDefinitionReference(planDefinition.dimension, noteMetric, noteScale);
    const note = structuredClone(fixture.note);
    note.id = 'observation:human-note-three-of-five';
    note.observedAt = '2026-10-02T06:00:00.000Z';
    note.originalText = 'Note fruitée 3 sur 5.';
    note.dimension = { status: 'resolved', definition: noteDefinition };
    note.scale = { status: 'known', metric: noteMetric, scale: noteScale };
    note.sense = { kind: 'sensoryRating', value: 3 };

    const base = hopV55Workspace('support-panel-owner', 'support-panel-readable-note');
    base.nuancePlans = [structuredClone(fixture.plan)];
    let initial = ensureHopV55ReferenceJournal(base, fixture.context, prepareBrewingScenarioContext(fixture.context));
    initial = applyHopV55ReferenceEvent(initial, { ownerKey: initial.ownerKey, contextId: hopV55ReferenceContextId(initial.id),
      commandId: 'record-note-three-of-five', expectedRevision: initial.referenceJournal!.record.revision,
      recordedAt: '2026-10-02T08:00:00.000Z', kind: 'observationRecorded', payload: { observation: note } });
    const h = harness(initial);
    render(component(initial, fixture, h));

    fireEvent.change(screen.getByLabelText('Définition exacte de note'), { target: { value: noteDefinition.contentReference } });
    const frameChoiceLabel = `Cadre adopté · ${fixture.plan.sourceModel.name} · version ${fixture.plan.revision}`;
    fireEvent.click(screen.getByLabelText(frameChoiceLabel));
    fireEvent.change(screen.getByLabelText('Cadre exact du calcul'), { target: { value: planDefinition.contentReference } });
    fireEvent.change(screen.getByLabelText('Type d’hypothèse arithmétique'), { target: { value: 'ordinalWorkingHypothesis' } });

    const noteSelect = screen.getByLabelText('Exemple de note numérique') as HTMLSelectElement;
    expect(noteSelect).toHaveValue('');
    const option = [...noteSelect.options].find(row => row.value.includes(note.id));
    expect(option).toBeDefined();
    expect(option?.textContent).toMatch(/Poire · note 3 · échelle 0–5 · .* · v1/);
    expect(option?.textContent).not.toContain(note.id);
    fireEvent.change(noteSelect, { target: { value: option!.value } });

    const exactDetails = screen.getByText('Références exactes de cette observation').closest('details');
    expect(exactDetails).not.toHaveAttribute('open');
    expect(exactDetails).toHaveTextContent(note.id);
    expect(exactDetails).toHaveTextContent(noteDefinition.contentReference);
    expect(exactDetails).toHaveTextContent(brewingObservationFactReference(note));
    expect(screen.getByLabelText('Auteur de la convention').tagName).toBe('INPUT');
    expect(h.onSave).not.toHaveBeenCalled();
  });

  it('crée la référence d’une déclaration personnelle au geste de conservation, sans URI à inventer', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const initial = hopV55Workspace('support-panel-owner', 'support-panel-personal-source');
    const h = harness(initial);
    render(component(initial, fixture, h));

    fireEvent.change(screen.getByLabelText('Dimension du protocole'), { target: { value: 'new' } });
    fireEvent.change(screen.getByLabelText('Nom de la nuance'), { target: { value: 'impression fruitée' } });
    fireEvent.change(screen.getByLabelText('Définition sensorielle'), { target: { value: 'Impression décrite par la personne après dégustation.' } });
    fireEvent.change(screen.getByLabelText('protocole · Mode de source'), { target: { value: 'personal' } });
    fireEvent.change(screen.getByLabelText('protocole · Titre de la déclaration'), { target: { value: 'Carnet personnel de dégustation' } });
    fireEvent.change(screen.getByLabelText('protocole · Acteur de la déclaration'), { target: { value: 'Brasseuse fixture' } });
    fireEvent.change(screen.getByLabelText('protocole · Motif de la déclaration'), { target: { value: 'Observation consignée directement après la dégustation.' } });
    expect(screen.queryByLabelText('protocole · Référence de la source')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sens de la note'), { target: { value: 'intensity' } });
    fireEvent.change(screen.getByLabelText('Orientation de l’échelle'), { target: { value: 'increasing' } });
    fireEvent.change(screen.getByLabelText('Domaine numérique de la note'), { target: { value: 'known' } });
    fireEvent.change(screen.getByLabelText('Borne basse incluse'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Borne haute incluse'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Auteur du protocole'), { target: { value: 'Brasseuse fixture' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Conserver ce protocole de note' })).toBeEnabled());
    expect(h.onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Conserver ce protocole de note' }));
    await waitFor(() => expect(h.current().observationSupportRecords).toHaveLength(1));

    const saved = readHopV55ObservationSupportRecord(h.current().observationSupportRecords![0]);
    if (saved.status !== 'readOnly' || saved.record.recordKind !== 'protocolNote') throw Error('Le protocole personnel doit être conservé.');
    const source = saved.record.definition.metric?.sourceRefs[0];
    expect(source).toMatchObject({ title: 'Carnet personnel de dégustation', author: 'Brasseuse fixture', year: null, kind: 'observation' });
    expect(source?.reference).toMatch(/^local-declaration:observation-support-record:/);
    expect(source?.locator).toContain('Observation consignée directement après la dégustation.');
    expect(saved.record.definition.dimension.sourceRefs[0].reference).toBe(source?.reference);
  });

  it('propose une autre dépendance déjà enregistrée sans la cocher ni déclarer sa couverture', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const base = hopV55Workspace('support-panel-owner', 'support-panel-existing-dependency');
    const priorScope = createHopV55ObservationSupportHopScopeRecord({ workspace: base, id: 'prior-scope-record',
      supportId: 'prior-scope', revision: 1, predecessorReference: null, recordedAt: '2026-10-02T08:00:00.000Z',
      recordedBy: { origin: 'user', name: 'Brasseur fixture' },
      scope: { id: 'prior-scope', dependencyIds: ['fermentationLog'], fromAt: '2026-10-01T00:00:00.000Z', explanation: 'Portée antérieure explicitement déclarée.' } });
    const initial = appendHopV55ObservationSupportRecord(base, priorScope);
    const h = harness(initial);
    render(component(initial, fixture, h));

    expect(screen.getByLabelText('Houblons ajoutés')).not.toBeChecked();
    expect(screen.getByLabelText('Continuité du contact')).not.toBeChecked();
    const otherDependency = screen.getByLabelText('Autre dépendance existante 1');
    expect(otherDependency).not.toBeChecked();
    const keyDetails = screen.getByText('Clés exactes et provenances existantes').closest('details');
    expect(keyDetails).not.toHaveAttribute('open');
    expect(keyDetails).toHaveTextContent('fermentationLog');

    fireEvent.click(otherDependency);
    fireEvent.change(screen.getByLabelText('Début de portée'), { target: { value: localInputAt('2026-10-02T00:00:00.000Z') } });
    fireEvent.change(screen.getByLabelText('Auteur de la portée'), { target: { value: 'Brasseur fixture' } });
    fireEvent.change(screen.getByLabelText('Motif de la portée'), { target: { value: 'Autre dépendance reprise après lecture d’une portée enregistrée.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Conserver cette portée' }));
    await waitFor(() => expect(h.current().observationSupportRecords).toHaveLength(2));
    const added = readHopV55ObservationSupportRecord(h.current().observationSupportRecords![1]);
    if (added.status !== 'readOnly' || added.record.recordKind !== 'hopScope') throw Error('La nouvelle portée doit être conservée.');
    expect(added.record.scope.dependencyIds).toEqual(['fermentationLog']);
    expect(added.record.scope).not.toHaveProperty('coverage');
    expect(added.record.scope).not.toHaveProperty('attestation');
  });

  it('ne transforme pas une déclaration de registre illisible en source ou dépendance déjà choisie', async () => {
    const fixture = await loadHopV55CanonicalObservationFixture();
    const initial = hopV55Workspace('support-panel-owner', 'support-panel-malformed-registry');
    const malformedRecord = { format: 'hop-v55-observation-support-record-vfuture', recordKind: 'protocolNote', id: 'unreadable' } as never;
    initial.observationSupportRecords = [malformedRecord];
    const h = harness(initial);
    render(component(initial, fixture, h));

    expect(screen.getByLabelText('protocole · Mode de source')).toHaveValue('');
    expect(screen.getByLabelText('Houblons ajoutés')).not.toBeChecked();
    expect(screen.getByLabelText('Continuité du contact')).not.toBeChecked();
    expect(h.onSave).not.toHaveBeenCalled();
  });
});
