import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import type { BrewingReferenceObservationV1 } from '../../src/domain/brewingReference';
import knowledge from '../../src/data/hopKnowledgeBootstrap.json';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import {
  adoptHopV55ReferenceHypothesis,
  applyHopV55ReferenceEvent,
  ensureHopV55ReferenceJournal,
  getHopV55ReferenceProjection,
  getHopV55AdoptedBaseline,
  hopV55ReferenceContextId,
  readHopV55ReferenceJournal,
} from '../../src/services/hopV55/referenceWorkspace';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { HopV55ReferencePanel } from '../../src/ui/hopV55/ReferencePanel';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function recentLocalDateTime(daysAgo = 1) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T10:00`;
}

function futureLocalDateTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T10:00`;
}

function makeContext(mode: 'planning' | 'unknown' = 'planning') {
  const context = makeHopV55FixtureContext(mode);
  if (context.hopIndex) context.hopIndex.knowledge = structuredClone(knowledge) as HopKnowledge[];
  const prepared = prepareBrewingScenarioContext(context);
  return { context, prepared };
}

function makeWorkspace(id = 'reference-workspace'): HopV55Workspace {
  return { format: 'hop-v55-workspace-v1', id, ownerKey: 'fixture-owner', revision: 0,
    title: 'Workspace de référence fixture', intent: { question: '', criteria: [] }, scenarioIds: [],
    referenceHypotheses: [], copies: [], updatedAt: '2026-10-02T08:00:00.000Z' };
}

function harness(mode: 'planning' | 'unknown' = 'planning', initialWorkspace?: HopV55Workspace) {
  const { context, prepared } = makeContext(mode);
  let current = structuredClone(initialWorkspace ?? makeWorkspace());
  const getWorkspace = vi.fn(async () => structuredClone(current));
  const onSave = vi.fn(async (next: HopV55Workspace) => {
    if (next.revision !== current.revision) throw new Error('staleRevision · le workspace a changé.');
    current = { ...structuredClone(next), revision: current.revision + 1 };
    return structuredClone(current);
  });
  return { context, prepared, getWorkspace, onSave, current: () => current };
}

function recordQualitativeNote(note = 'Floral au nez, finale sèche.') {
  fireEvent.change(screen.getByLabelText('Objet observé'), { target: { value: 'Échantillon de dégustation' } });
  fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: recentLocalDateTime() } });
  fireEvent.change(screen.getByLabelText('Libellé de dimension libre'), { target: { value: 'floral' } });
  fireEvent.change(screen.getByLabelText('Note qualitative originale'), { target: { value: note } });
}

async function adoptDeclaredEmptyReference() {
  const summary = screen.getByText('Hypothèse de référence', { exact: true });
  if (!summary.closest('details')?.open) fireEvent.click(summary);
  fireEvent.change(screen.getByLabelText('Volume de la référence'), { target: { value: '20' } });
  fireEvent.click(screen.getByLabelText('Cette référence est déclarée sans ajout de houblon.'));
  await confirmCultureUnknown();
  fireEvent.click(screen.getByRole('button', { name: 'Adopter cette hypothèse de référence' }));
}

async function confirmCultureUnknown(reason = 'La référence ne déclare pas d’identité de culture.') {
  const unknown = screen.getByRole('radio', { name: 'Inconnue' });
  if (!(unknown as HTMLInputElement).checked) fireEvent.click(unknown);
  fireEvent.change(screen.getByLabelText('Motif de la proposition ou correction'), { target: { value: reason } });
  fireEvent.click(screen.getByRole('button', { name: /Confirmer (cette hypothèse|la révision de l’hypothèse)/ }));
  await waitFor(() => expect(screen.getByText(/Culture confirmée pour l’adoption explicite/)).toBeInTheDocument());
}

describe('Référence et observations dans le vrai journal de workspace', () => {
  it('ne crée aucun workspace à l’ouverture et ouvre le journal avec la première commande réellement conservée', async () => {
    const unknown = harness('unknown');
    const first = render(<HopV55ReferencePanel context={unknown.context} prepared={unknown.prepared}
      getWorkspace={unknown.getWorkspace} onSave={unknown.onSave} />);
    expect(unknown.getWorkspace).not.toHaveBeenCalled();
    expect(unknown.onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Note qualitative originale')).toHaveValue('');
    expect(screen.getByText(/Définitions sensorielles chargées ·/)).toBeInTheDocument();
    expect(screen.getByText(/Aucun espace de travail de référence n’est encore créé/)).toBeInTheDocument();
    expect(screen.getByText('Contexte réel non renseigné')).toBeInTheDocument();
    expect(screen.getByText('Programme effectif inconnu.')).toBeInTheDocument();
    expect(screen.queryByText('Programme réel courant')).not.toBeInTheDocument();
    expect(screen.getByText(/Aucune hypothèse comparative n’est adoptée pour le moment/)).toBeInTheDocument();
    const exactContext = first.container.querySelector<HTMLDetailsElement>('.hv55-ref-context')!;
    fireEvent.click(exactContext.querySelector('summary')!);
    expect(exactContext).toHaveTextContent('Source actuelle · Contexte réel non renseigné');
    expect(exactContext).toHaveTextContent('Stade reçu · Inconnu · aucun programme effectif reçu');

    recordQualitativeNote();
    expect(unknown.getWorkspace).not.toHaveBeenCalled();
    expect(unknown.onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(unknown.onSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(readHopV55ReferenceJournal(unknown.current()).status).toBe('available'));
    const unknownProjection = getHopV55ReferenceProjection(unknown.current())!;
    expect(unknownProjection.context.past).toEqual({ status: 'unknown' });
    expect(unknownProjection.currentReference).toBeNull();
    expect(screen.getByText('Contexte réel non renseigné')).toBeInTheDocument();
    expect(screen.getByText('Programme effectif inconnu.')).toBeInTheDocument();
    expect(getHopV55AdoptedBaseline(unknown.current())).toBeUndefined();
    expect(unknown.current().referenceJournal!.events.map(event => event.kind)).toEqual(['contextOpened', 'observationRecorded']);
    expect(screen.getByText(/Passé inconnu/)).toBeInTheDocument();
    expect(screen.getByText(/pour chiffrer une exploration sans recette/i)).toBeInTheDocument();
    expect(screen.getByText('Hypothèse de référence', { exact: true }).closest('details')).toHaveProperty('open', true);
    first.unmount();

    const existingWorkspace = structuredClone(unknown.current());
    const reread = render(<HopV55ReferencePanel workspace={existingWorkspace} context={unknown.context} prepared={unknown.prepared}
      getWorkspace={unknown.getWorkspace} onSave={unknown.onSave} />);
    expect(unknown.getWorkspace).toHaveBeenCalledTimes(1);
    expect(unknown.onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Passé inconnu · aucune absence d’ajout n’est déduite.')).toBeInTheDocument();
    expect(unknown.current().id).toBe(existingWorkspace.id);
    reread.unmount();

    const planning = harness('planning');
    render(<HopV55ReferencePanel context={planning.context} prepared={planning.prepared}
      getWorkspace={planning.getWorkspace} onSave={planning.onSave} />);
    expect(planning.getWorkspace).not.toHaveBeenCalled();
    expect(planning.onSave).not.toHaveBeenCalled();
    await adoptDeclaredEmptyReference();
    await waitFor(() => expect(planning.onSave).toHaveBeenCalledTimes(1));
    expect(getHopV55ReferenceProjection(planning.current())!.context.past)
      .toEqual({ status: 'declaredComplete', additions: [] });
    expect(screen.getByText('Passé déclaré complet · aucun ajout consigné (0).')).toBeInTheDocument();
    expect(planning.current().referenceHypotheses).toEqual([]);
    expect(getHopV55AdoptedBaseline(planning.current())?.kind).toBe('hypothetical');
  });

  it('présente le programme et son horizon en premier, replie l’hypothèse si une recette existe et réserve les identifiants aux détails', async () => {
    const h = harness('planning');
    render(<HopV55ReferencePanel context={h.context} prepared={h.prepared} getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    expect(h.getWorkspace).not.toHaveBeenCalled();
    expect(h.onSave).not.toHaveBeenCalled();

    expect(screen.getByText('Recette synthétique avant brassage · Avant brassage')).toBeInTheDocument();
    expect(screen.getByText(/ajouts? planifiés? à partir de cette étape/i)).toBeInTheDocument();
    expect(screen.getByText(/aucune hypothèse comparative n’est adoptée/i)).toBeInTheDocument();
    const panel = screen.getByTestId('hop-v55-reference-panel');
    const firstView = `${panel.querySelector('.hv55-ref-heading')?.textContent} ${panel.querySelector('.hv55-ref-current')?.textContent}`;
    expect(firstView).not.toMatch(/modelIndex|append-only|contentReference|définition\(s\)|reference-workspace/i);
    const exactContext = panel.querySelector('.hv55-ref-context');
    expect(exactContext).toHaveProperty('open', false);
    expect(exactContext).toHaveTextContent(h.prepared.runtime.current!.recipeReference);
    expect(exactContext).toHaveTextContent('Contexte réel et raccords exacts');
    const definitions = panel.querySelector('.hv55-ref-model-definitions');
    expect(definitions).toHaveProperty('open', false);
    expect(definitions).toHaveTextContent('Agrumes');
    expect(definitions).toHaveTextContent('local-1');
    expect(definitions).toHaveTextContent('docs/hop-extrapolation.md');
    const hypothesisSummary = screen.getByText('Hypothèse de référence', { exact: true });
    expect(hypothesisSummary.closest('details')).toHaveProperty('open', false);
    expect(screen.getByLabelText('Volume de la référence')).not.toBeVisible();
    expect(screen.getByText(/Définitions sensorielles chargées ·/)).toBeInTheDocument();
    expect(screen.getByText('Contexte réel et raccords exacts')).toBeInTheDocument();

    fireEvent.click(hypothesisSummary);
    expect(screen.getByLabelText('Volume de la référence')).toBeVisible();
  });

  it('ne relit ni n’écrit le workspace lors d’une transition de contexte unknown vers planning', () => {
    const unknown = harness('unknown');
    const workspace = makeWorkspace('workspace-transition-fixture');
    const view = render(<HopV55ReferencePanel workspace={workspace} context={unknown.context} prepared={unknown.prepared}
      getWorkspace={unknown.getWorkspace} onSave={unknown.onSave} />);
    expect(screen.getByText('Contexte réel non renseigné')).toBeInTheDocument();
    expect(screen.getByText('Programme effectif inconnu.')).toBeInTheDocument();
    expect(unknown.getWorkspace).not.toHaveBeenCalled();
    expect(unknown.onSave).not.toHaveBeenCalled();

    const planning = makeContext('planning');
    view.rerender(<HopV55ReferencePanel workspace={workspace} context={planning.context} prepared={planning.prepared}
      getWorkspace={unknown.getWorkspace} onSave={unknown.onSave} />);
    expect(screen.getByText(/Recette synthétique avant brassage · Avant brassage/)).toBeInTheDocument();
    expect(unknown.getWorkspace).not.toHaveBeenCalled();
    expect(unknown.onSave).not.toHaveBeenCalled();
  });

  it('corrige une note historique sans déplacer son instant, son lot ou son contact; une nouvelle note garde un nouvel ID', async () => {
    const { context, prepared } = makeContext('unknown');
    const workspaceId = 'workspace-retrospective-note-v55';
    const opened = ensureHopV55ReferenceJournal(makeWorkspace(workspaceId), context, prepared);
    const original: BrewingReferenceObservationV1 = {
      id: 'observation:contact-four-days', version: 1,
      subject: { kind: 'batch', id: 'batch-fixture-contact-four', label: 'Brassin synthétique · relevé historique' },
      observedAt: '2026-09-28T15:20:12.345Z',
      author: { id: 'fixture-owner', label: 'Brasseur fixture' },
      origin: { kind: 'userEntered', description: 'Note de dégustation au quatrième jour.', sourceReference: 'fixture:note-contact-four' },
      originalText: 'Note 3 au contact de quatre jours.',
      dimension: { status: 'unresolved', label: 'floral perçu' },
      scale: { status: 'unknown' }, sense: { kind: 'sensoryRating', value: 3 },
      comparison: { kind: 'relative', relationship: 'plus floral que le témoin', referent: null },
      context: { workspaceId, conditions: 'Contact après quatre jours.', contactHours: 96,
        state: 'fermentation', lotId: 'lot-fixture-contact-four' },
    };
    const initialWorkspace = applyHopV55ReferenceEvent(opened, {
      ownerKey: opened.ownerKey, contextId: hopV55ReferenceContextId(workspaceId),
      commandId: 'fixture-record-contact-four', expectedRevision: opened.referenceJournal!.record.revision,
      recordedAt: '2026-10-02T08:01:00.000Z', kind: 'observationRecorded', payload: { observation: original },
    });
    const h = harness('unknown', initialWorkspace);
    const preparedBefore = structuredClone(h.prepared);
    render(<HopV55ReferencePanel workspace={initialWorkspace} context={h.context} prepared={h.prepared}
      getWorkspace={h.getWorkspace} onSave={h.onSave} />);

    fireEvent.change(screen.getByLabelText('Action d’observation'), { target: { value: 'correction' } });
    fireEvent.change(screen.getByLabelText('Observation à corriger'), { target: { value: original.id } });
    expect(screen.getByText(/Correction du relevé historique/)).toBeInTheDocument();
    expect(screen.getAllByText(original.observedAt, { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Contact après quatre jours\./).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/lot-fixture-contact-four/).length).toBeGreaterThan(0);
    expect(screen.getByText('Contact conservé').closest('span')).toHaveTextContent('96 h');
    expect(screen.getByText('État conservé').closest('span')).toHaveTextContent('fermentation');
    expect(screen.getByText('Lot exact').closest('span')).toHaveTextContent('lot-fixture-contact-four');
    expect(screen.queryByLabelText('Date observée')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nature du constat')).toBeDisabled();
    expect(screen.getByLabelText('Note sensorielle')).toHaveValue('3');

    fireEvent.change(screen.getByLabelText('Note sensorielle'), { target: { value: '3,5' } });
    fireEvent.change(screen.getByLabelText('Texte original de la note'), { target: { value: 'Note corrigée à 3,5; contact historique de quatre jours.' } });
    fireEvent.change(screen.getByLabelText('Motif de correction'), { target: { value: 'Relecture du carnet original.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la correction comme version suivante' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));

    let projection = getHopV55ReferenceProjection(h.current())!;
    const corrected = projection.observations.find(row => row.id === original.id && row.version === 2)!;
    expect(projection.observations.find(row => row.id === original.id && row.version === 1)).toEqual(original);
    expect(corrected).toMatchObject({
      id: original.id, version: 2, subject: original.subject, observedAt: original.observedAt,
      origin: original.origin, dimension: original.dimension, scale: original.scale,
      sense: { kind: 'sensoryRating', value: 3.5 },
      comparison: original.comparison, context: original.context,
      originalText: 'Note corrigée à 3,5; contact historique de quatre jours.',
      author: { id: 'fixture-owner' },
    });
    expect(h.current().referenceJournal!.events.at(-1)).toMatchObject({
      kind: 'observationCorrected', payload: { correctsVersion: 1, reason: 'Relecture du carnet original.' },
    });
    expect(getHopV55AdoptedBaseline(h.current())).toBeUndefined();

    fireEvent.change(screen.getByLabelText('Action d’observation'), { target: { value: 'new' } });
    recordQualitativeNote('Note actuelle après cinq jours, toujours distincte.');
    fireEvent.change(screen.getByLabelText('Type de comparaison'), { target: { value: 'relative' } });
    fireEvent.change(screen.getByLabelText('Relation relative'), { target: { value: 'comparée à la note historique' } });
    fireEvent.change(screen.getByLabelText('Conditions observées'), { target: { value: 'Contact observé après cinq jours.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(2));
    projection = getHopV55ReferenceProjection(h.current())!;
    const newCurrentNote = projection.observations.find(row => row.originalText === 'Note actuelle après cinq jours, toujours distincte.')!;
    expect(newCurrentNote.id).not.toBe(original.id);
    expect(newCurrentNote.version).toBe(1);
    expect(newCurrentNote.observedAt).not.toBe(original.observedAt);
    expect(newCurrentNote.context).toMatchObject({ conditions: 'Contact observé après cinq jours.' });
    expect(projection.observations.find(row => row.id === original.id && row.version === 1)).toEqual(original);
    expect(projection.observations.find(row => row.id === original.id && row.version === 2)).toEqual(corrected);
    expect(projection.references).toEqual(getHopV55ReferenceProjection(initialWorkspace)!.references);
    expect(projection.j5ResultLinks).toEqual(getHopV55ReferenceProjection(initialWorkspace)!.j5ResultLinks);
    expect(h.prepared).toEqual(preparedBefore);
    expect(getHopV55AdoptedBaseline(h.current())).toBeUndefined();
  });

  it('lit un événement V2 de réactivation historique comme activation distincte, sans mutation', () => {
    const h = harness('planning');
    const workspace = makeWorkspace('workspace-reference-activation-v2');
    const opened = ensureHopV55ReferenceJournal(workspace, h.context, h.prepared);
    const baselineV1 = {
      kind: 'hypothetical' as const,
      label: 'Référence adoptée initialement',
      input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] },
      program: { id: 'reference-activation-v2', revision: 1, stage: 'planning' as const,
        volumeL: 20, wortGravity: null, additions: [] },
      culture: { state: 'unknown' as const, members: [] },
    };
    const firstHypothesis: HopV55Workspace['referenceHypotheses'][number] = {
      id: 'reference-activation-v2', version: 1, label: baselineV1.label,
      recordedAt: '2026-10-02T08:01:00.000Z', baseline: baselineV1,
    };
    const adoptedV1 = adoptHopV55ReferenceHypothesis(opened, firstHypothesis, h.context, h.prepared);
    const identityV1 = structuredClone(getHopV55ReferenceProjection(adoptedV1)!.currentReference!);
    const baselineV2 = { ...getHopV55AdoptedBaseline(adoptedV1)!, label: 'Référence révisée, adoptée ensuite' };
    const secondHypothesis: HopV55Workspace['referenceHypotheses'][number] = {
      id: firstHypothesis.id, version: 2, label: baselineV2.label,
      recordedAt: '2026-10-02T08:02:00.000Z', baseline: baselineV2,
    };
    const adoptedV2 = adoptHopV55ReferenceHypothesis(adoptedV1, secondHypothesis, h.context, h.prepared);
    const priorAdoptions = structuredClone(getHopV55ReferenceProjection(adoptedV2)!.adoptions);
    const activatedV1 = applyHopV55ReferenceEvent(adoptedV2, {
      ownerKey: adoptedV2.ownerKey,
      contextId: hopV55ReferenceContextId(adoptedV2.id),
      commandId: 'fixture-reference-activation-v2',
      expectedRevision: adoptedV2.referenceJournal!.record.revision,
      recordedAt: '2026-10-02T08:03:00.000Z',
      kind: 'referenceActivated',
      payload: { reference: identityV1, activatedBy: { id: 'fixture-owner', label: 'Brasseur fixture' },
        reason: 'Retour déclaré à la version initiale pour cette comparaison.' },
    });
    const readProjection = getHopV55ReferenceProjection(activatedV1)!;
    const getWorkspace = vi.fn(async () => { throw new Error('Un journal reçu en lecture ne doit pas être relu par effet de bord.'); });
    const onSave = vi.fn(async (next: HopV55Workspace) => next);

    render(<HopV55ReferencePanel workspace={activatedV1} context={h.context} prepared={h.prepared}
      getWorkspace={getWorkspace} onSave={onSave} />);

    expect(readHopV55ReferenceJournal(activatedV1).status).toBe('available');
    expect(readProjection.currentReference).toEqual(identityV1);
    expect(readProjection.adoptions).toEqual(priorAdoptions);
    expect(activatedV1.referenceJournal!.events.at(-1)).toMatchObject({
      eventFormatVersion: 2, kind: 'referenceActivated', payload: { reference: identityV1, reason: 'Retour déclaré à la version initiale pour cette comparaison.' },
    });
    expect(screen.getByText(/Réactivation d’une référence/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Référence réactivée · ${identityV1.id} · v${identityV1.version}`))).toBeInTheDocument();
    expect(screen.getByText(/Activation déclarée par Brasseur fixture.*Retour déclaré à la version initiale/u)).toBeInTheDocument();
    expect(screen.getByText(/Date d’activation consignée/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réactiver cette référence comme comparaison courante' })).toBeDisabled();
    const identityV2 = readProjection.references.find(row => row.version === '2')!;
    expect(screen.getByLabelText('Version adoptée à réactiver')).toHaveValue(identityV2.contentReference);
    expect(getWorkspace).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('réactive une version exacte sans nouvelle adoption, puis crée la version suivante depuis le nouvel ancrage', async () => {
    const h = harness('planning');
    const opened = ensureHopV55ReferenceJournal(makeWorkspace('workspace-activation-command'), h.context, h.prepared);
    const baselineV1 = {
      kind: 'hypothetical' as const,
      label: 'Référence initiale',
      input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] },
      program: { id: 'workspace-activation-command', revision: 1, stage: 'planning' as const,
        volumeL: 20, wortGravity: null, additions: [] },
      culture: { state: 'unknown' as const, members: [] },
    };
    const adoptedV1 = adoptHopV55ReferenceHypothesis(opened, { id: 'reference-activation-series', version: 1,
      label: baselineV1.label, recordedAt: '2026-10-02T08:01:00.000Z', baseline: baselineV1 }, h.context, h.prepared);
    const identityV1 = structuredClone(getHopV55ReferenceProjection(adoptedV1)!.currentReference!);
    const baselineV2 = { ...getHopV55AdoptedBaseline(adoptedV1)!, label: 'Révision adoptée ensuite' };
    const adoptedV2 = adoptHopV55ReferenceHypothesis(adoptedV1, { id: identityV1.id, version: 2,
      label: baselineV2.label, recordedAt: '2026-10-02T08:02:00.000Z', baseline: baselineV2 }, h.context, h.prepared);
    const before = getHopV55ReferenceProjection(adoptedV2)!;
    const priorReferences = structuredClone(before.references);
    const priorAdoptions = structuredClone(before.adoptions);
    const priorObservations = structuredClone(before.observations);
    const priorInterpretations = structuredClone(before.interpretations);
    const priorJ5Links = structuredClone(before.j5ResultLinks);
    const initialWorkspace = { ...adoptedV2, revision: 0 };
    const active = harness('planning', initialWorkspace);
    render(<HopV55ReferencePanel workspace={initialWorkspace} context={active.context} prepared={active.prepared}
      getWorkspace={active.getWorkspace} onSave={active.onSave} />);

    expect(screen.getByText('Hypothèse courante exacte').parentElement).toHaveTextContent(`${before.currentReference!.id} · v${before.currentReference!.version}`);
    expect(screen.getByLabelText('Version adoptée à réactiver')).toHaveValue(identityV1.contentReference);
    const activate = screen.getByRole('button', { name: 'Réactiver cette référence comme comparaison courante' });
    expect(activate).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Version adoptée à réactiver'), { target: { value: identityV1.contentReference } });
    fireEvent.change(screen.getByLabelText('Motif du retour à une référence adoptée'), {
      target: { value: 'Retour à la référence initiale pour examiner cette variante.' },
    });
    fireEvent.click(activate);
    await waitFor(() => expect(active.onSave).toHaveBeenCalledTimes(1));

    let projection = getHopV55ReferenceProjection(active.current())!;
    expect(projection.currentReference).toEqual(identityV1);
    expect(projection.references).toEqual(priorReferences);
    expect(projection.adoptions).toEqual(priorAdoptions);
    expect(projection.observations).toEqual(priorObservations);
    expect(projection.interpretations).toEqual(priorInterpretations);
    expect(projection.j5ResultLinks).toEqual(priorJ5Links);
    const activation = active.current().referenceJournal!.events.at(-1)!;
    expect(activation).toMatchObject({ eventFormatVersion: 2, kind: 'referenceActivated', payload: {
      reference: identityV1, activatedBy: { id: active.current().ownerKey, label: 'Brasseur' },
      reason: 'Retour à la référence initiale pour examiner cette variante.',
    } });
    expect(Date.parse(activation.recordedAt)).not.toBeNaN();
    expect(active.current().referenceJournal!.events.filter(event => event.kind === 'referenceAdopted')).toHaveLength(2);
    expect(active.current().referenceJournal!.events.filter(event => event.kind === 'j5ResultLinked')).toHaveLength(0);

    const hypothesisSummary = screen.getByText('Hypothèse de référence', { exact: true });
    if (!hypothesisSummary.closest('details')?.open) fireEvent.click(hypothesisSummary);
    expect(screen.getByText('Prochaine version de cette série · v3 · filiation depuis v1.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les valeurs de la référence active pour une révision' }));
    await confirmCultureUnknown('Révision de la référence après réactivation exacte de la version 1.');
    fireEvent.click(screen.getByRole('button', { name: 'Proposer et adopter cette nouvelle version' }));
    await waitFor(() => expect(active.onSave).toHaveBeenCalledTimes(2));

    projection = getHopV55ReferenceProjection(active.current())!;
    expect(projection.references.map(reference => reference.version)).toEqual(['1', '2', '3']);
    expect(projection.references[2].predecessor).toEqual(identityV1);
    expect(projection.references[1]).toEqual(priorReferences[1]);
    expect(projection.currentReference?.version).toBe('3');
    expect(projection.observations).toEqual(priorObservations);
    expect(projection.interpretations).toEqual(priorInterpretations);
    expect(projection.j5ResultLinks).toEqual(priorJ5Links);
  });

  it('demande un libellé explicite face aux versions opaques sans les convertir', async () => {
    const h = harness('planning');
    const opened = ensureHopV55ReferenceJournal(makeWorkspace('workspace-opaque-reference-version'), h.context, h.prepared);
    const baseline = {
      kind: 'hypothetical' as const, label: 'Référence lisible',
      input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] },
      program: { id: 'opaque-version-program', revision: 1, stage: 'planning' as const,
        volumeL: 20, wortGravity: null, additions: [] },
      culture: { state: 'unknown' as const, members: [] },
    };
    const first = adoptHopV55ReferenceHypothesis(opened, { id: 'opaque-series', version: 1, label: baseline.label,
      recordedAt: '2026-10-02T08:01:00.000Z', baseline }, h.context, h.prepared);
    const opaque = adoptHopV55ReferenceHypothesis(first, { id: 'opaque-series', version: 2, label: 'Version éditoriale A',
      recordedAt: '2026-10-02T08:02:00.000Z', baseline }, h.context, h.prepared, { referenceVersion: 'release-alpha' });
    const opaqueWorkspace = { ...opaque, revision: 0 };
    const active = harness('planning', opaqueWorkspace);
    render(<HopV55ReferencePanel workspace={opaqueWorkspace} context={active.context} prepared={active.prepared}
      getWorkspace={active.getWorkspace} onSave={active.onSave} />);
    const summary = screen.getByText('Hypothèse de référence', { exact: true });
    if (!summary.closest('details')?.open) fireEvent.click(summary);
    expect(screen.getByText(/les versions conservées ne sont pas toutes des entiers décimaux canoniques \(release-alpha\)/i)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Proposer et adopter cette nouvelle version' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Volume de la référence'), { target: { value: '20' } });
    fireEvent.click(screen.getByLabelText('Cette référence est déclarée sans ajout de houblon.'));
    fireEvent.change(screen.getByLabelText('Nouvelle version explicite'), { target: { value: ' release-3.5-A ' } });
    expect(submit).toBeDisabled();
    await confirmCultureUnknown('La nouvelle version garde une culture explicitement inconnue.');
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() => expect(active.onSave).toHaveBeenCalledTimes(1));
    const projection = getHopV55ReferenceProjection(active.current())!;
    expect(projection.references.map(reference => reference.version)).toEqual(['1', 'release-alpha', ' release-3.5-A ']);
    expect(projection.references[2].predecessor).toEqual(projection.references[1] && {
      id: projection.references[1].id, version: projection.references[1].version,
      contentReference: projection.references[1].contentReference,
    });
  });

  it('enregistre une observation relative avant la première référence; adoption et lien séparé ne réancrent pas son null', async () => {
    const h = harness('planning');
    render(<HopV55ReferencePanel context={h.context} prepared={h.prepared} getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    expect(h.getWorkspace).not.toHaveBeenCalled();
    expect(h.onSave).not.toHaveBeenCalled();

    recordQualitativeNote();
    fireEvent.change(screen.getByLabelText('Type de comparaison'), { target: { value: 'relative' } });
    fireEvent.change(screen.getByLabelText('Relation relative'), { target: { value: 'plus floral que le souvenir précédent' } });
    expect(screen.getByLabelText('Référent initial')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));
    let projection = getHopV55ReferenceProjection(h.current())!;
    const original = projection.observations[0];
    expect(original).toMatchObject({ version: 1, sense: { kind: 'qualitative' }, scale: { status: 'unknown' },
      dimension: { status: 'unresolved', label: 'floral' }, comparison: { kind: 'relative', referent: null } });
    expect(original.originalText).toBe('Floral au nez, finale sèche.');
    const observationEvent = h.current().referenceJournal!.events.find(event => event.kind === 'observationRecorded');
    expect(observationEvent?.recordedAt).not.toBe(original.observedAt);
    expect(Date.parse(observationEvent!.recordedAt)).toBeGreaterThan(Date.parse(original.observedAt));
    expect(h.current().referenceHypotheses).toEqual([]);
    expect(getHopV55AdoptedBaseline(h.current())).toBeUndefined();

    await waitFor(() => expect(screen.queryByText('Enregistrement et relecture du journal de référence…')).not.toBeInTheDocument());
    await adoptDeclaredEmptyReference();
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Enregistrement et relecture du journal de référence…')).not.toBeInTheDocument());
    projection = getHopV55ReferenceProjection(h.current())!;
    expect(projection.currentReference).not.toBeNull();
    expect(projection.references).toHaveLength(1);
    expect(screen.getByTestId('hop-v55-reference-panel').querySelector('.hv55-ref-current'))
      .toHaveTextContent(/Adoptée le /);
    expect(projection.references[0].sensoryDefinitions.length).toBeGreaterThan(0);
    expect(projection.references[0].sensoryDefinitions.every(definition => definition.metric?.kind === 'modelIndex')).toBe(true);
    expect(projection.references[0].sensoryDefinitions[0].contentReference).toMatch(/^brewing-sensory-reference-v1:/);
    expect(projection.references[0].sensoryDefinitions[0].dimension.sourceRefs.length).toBeGreaterThan(0);
    expect(h.current().referenceHypotheses).toEqual([]);
    expect(projection.observations[0].comparison).toEqual({ kind: 'relative', relationship: 'plus floral que le souvenir précédent', referent: null });
    expect(projection.adoptions[0].reference.contentReference).toBe(projection.currentReference!.contentReference);
    await waitFor(() => expect(screen.getByTestId('hop-v55-reference-panel').querySelectorAll('.hv55-ref-link')).toHaveLength(1));

    const target = projection.references[0].sensoryDefinitions[0];
    fireEvent.change(screen.getByLabelText(/Référence pour observation:/), { target: { value: projection.currentReference!.contentReference } });
    fireEvent.change(screen.getByLabelText(/Relation pour observation:/), { target: { value: 'piste lexicale, pas une intensité' } });
    fireEvent.change(screen.getByLabelText(/Motif pour observation:/), { target: { value: 'La note est qualitative et son échelle initiale reste inconnue.' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer le lien séparé' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le lien séparé' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.queryByText('Enregistrement et relecture du journal de référence…')).not.toBeInTheDocument());
    projection = getHopV55ReferenceProjection(h.current())!;
    expect(projection.interpretations).toHaveLength(1);
    expect(projection.interpretations[0]).toMatchObject({ observationId: original.id, observationVersion: 1,
      reference: projection.currentReference, targetDefinition: target, relation: 'piste lexicale, pas une intensité',
      comparability: { kind: 'nonComparable', reason: 'La note est qualitative et son échelle initiale reste inconnue.' } });
    expect(projection.observations[0].comparison.referent).toBeNull();
    const firstAdoptedIdentity = structuredClone(projection.currentReference!);
    expect(h.current().referenceJournal!.events.map(event => event.kind)).toEqual([
      'contextOpened', 'observationRecorded', 'referenceProposed', 'referenceAdopted', 'interpretationLinked',
    ]);

    const hypothesisSummary = screen.getByText('Hypothèse de référence', { exact: true });
    if (!hypothesisSummary.closest('details')?.open) fireEvent.click(hypothesisSummary);
    fireEvent.click(screen.getByText('Réviser la référence active · v1'));
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les valeurs de la référence active pour une révision' }));
    fireEvent.change(screen.getByLabelText('Nom de la référence'), { target: { value: 'Référence de travail révisée' } });
    await confirmCultureUnknown('Révision de la référence après ajout d’un lien qualitatif non comparable.');
    fireEvent.click(screen.getByRole('button', { name: 'Proposer et adopter cette nouvelle version' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(4));
    projection = getHopV55ReferenceProjection(h.current())!;
    expect(projection.references.map(reference => reference.version)).toEqual(['1', '2']);
    expect(projection.references[1].predecessor).toEqual(firstAdoptedIdentity);
    expect(projection.currentReference).toMatchObject({ id: firstAdoptedIdentity.id, version: '2' });
    expect(projection.interpretations[0].reference).toEqual(firstAdoptedIdentity);
    expect(projection.observations[0].comparison.referent).toBeNull();
    expect(h.current().referenceHypotheses).toEqual([]);
  });

  it('garde la note 3 avec échelle inconnue, puis accepte une échelle ordinale seulement quand le brasseur en déclare les bornes', async () => {
    const h = harness('unknown');
    render(<HopV55ReferencePanel context={h.context} prepared={h.prepared} getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    expect(h.getWorkspace).not.toHaveBeenCalled();
    expect(h.onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Objet observé'), { target: { value: 'Échantillon A' } });
    fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: recentLocalDateTime() } });
    fireEvent.change(screen.getByLabelText('Libellé de dimension libre'), { target: { value: 'amertume perçue' } });
    fireEvent.change(screen.getByLabelText('Nature du constat'), { target: { value: 'sensoryRating' } });
    fireEvent.change(screen.getByLabelText('Note sensorielle'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Texte original de la note'), { target: { value: 'Note 3/5 dans mon carnet.' } });
    expect(screen.getByLabelText('Échelle de la note sensorielle')).toHaveValue('unknown');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText('Nature du constat')).toHaveValue('qualitative'));
    let observations = getHopV55ReferenceProjection(h.current())!.observations;
    expect(observations[0].sense).toEqual({ kind: 'sensoryRating', value: 3 });
    expect(observations[0].scale).toEqual({ status: 'unknown' });
    expect(observations[0].originalText).toBe('Note 3/5 dans mon carnet.');

    fireEvent.change(screen.getByLabelText('Objet observé'), { target: { value: 'Échantillon B' } });
    fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: recentLocalDateTime() } });
    fireEvent.change(screen.getByLabelText('Libellé de dimension libre'), { target: { value: 'astringence perçue' } });
    fireEvent.change(screen.getByLabelText('Nature du constat'), { target: { value: 'sensoryRating' } });
    fireEvent.change(screen.getByLabelText('Note sensorielle'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Texte original de la note'), { target: { value: 'Quatre selon mon échelle de dégustation.' } });
    fireEvent.change(screen.getByLabelText('Échelle de la note sensorielle'), { target: { value: 'declared' } });
    fireEvent.change(screen.getByLabelText('Borne minimale'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Borne maximale'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Description de l’échelle déclarée'), { target: { value: 'Échelle personnelle du carnet, de 1 faible à 5 fort.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(2));
    observations = getHopV55ReferenceProjection(h.current())!.observations;
    expect(observations[1].sense).toEqual({ kind: 'sensoryRating', value: 4 });
    expect(observations[1].scale.status).toBe('known');
    if (observations[1].scale.status !== 'known') throw new Error('Échelle ordinale déclarée attendue.');
    expect(observations[1].scale.metric).toMatchObject({ kind: 'ordinalNote', unit: null });
    expect(observations[1].scale.scale.domain).toEqual({ min: 1, max: 5 });
    expect(observations[1].scale.metric.sourceRefs[0]).toMatchObject({ kind: 'judgment', reference: expect.stringContaining('user-declared-scale:') });
  });

  it('refuse une mesure analytique incomplète, puis corrige en nouvelle version et garde une nouvelle dégustation sous un nouvel ID', async () => {
    const h = harness('unknown');
    render(<HopV55ReferencePanel context={h.context} prepared={h.prepared} getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    expect(h.getWorkspace).not.toHaveBeenCalled();
    expect(h.onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Objet observé'), { target: { value: 'Échantillon analytique A' } });
    fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: recentLocalDateTime() } });
    fireEvent.change(screen.getByLabelText('Libellé de dimension libre'), { target: { value: 'composé mesuré' } });
    fireEvent.change(screen.getByLabelText('Nature du constat'), { target: { value: 'analyticalMeasurement' } });
    fireEvent.change(screen.getByLabelText('Valeur mesurée'), { target: { value: '12,5' } });
    fireEvent.change(screen.getByLabelText('Texte original de la mesure'), { target: { value: 'Résultat de laboratoire.' } });
    expect(screen.getByRole('button', { name: 'Enregistrer cette observation' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Unité analytique'), { target: { value: 'mg/L' } });
    fireEvent.change(screen.getByLabelText('Base analytique'), { target: { value: 'bière filtrée' } });
    fireEvent.change(screen.getByLabelText('Méthode analytique'), { target: { value: 'HPLC fixture' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText('Nature du constat')).toHaveValue('qualitative'));
    const firstObservation = getHopV55ReferenceProjection(h.current())!.observations[0];
    expect(firstObservation.sense).toEqual({ kind: 'analyticalMeasurement', value: 12.5, unit: 'mg/L', basis: 'bière filtrée', method: 'HPLC fixture' });

    fireEvent.change(screen.getByLabelText('Action d’observation'), { target: { value: 'correction' } });
    fireEvent.change(screen.getByLabelText('Observation à corriger'), { target: { value: firstObservation.id } });
    fireEvent.change(screen.getByLabelText('Texte original de la mesure'), { target: { value: 'Valeur corrigée après relecture du rapport.' } });
    fireEvent.change(screen.getByLabelText('Motif de correction'), { target: { value: 'Transcription corrigée depuis la feuille de laboratoire.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la correction comme version suivante' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByLabelText('Nature du constat')).toHaveValue('qualitative'));
    let projection = getHopV55ReferenceProjection(h.current())!;
    expect(projection.observations.filter(row => row.id === firstObservation.id).map(row => row.version)).toEqual([1, 2]);
    expect(projection.observations.find(row => row.id === firstObservation.id && row.version === 1)?.originalText).toBe('Résultat de laboratoire.');
    expect(projection.observations.find(row => row.id === firstObservation.id && row.version === 2)?.originalText).toBe('Valeur corrigée après relecture du rapport.');

    fireEvent.change(screen.getByLabelText('Objet observé'), { target: { value: 'Échantillon analytique B' } });
    fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: recentLocalDateTime() } });
    fireEvent.change(screen.getByLabelText('Libellé de dimension libre'), { target: { value: 'composé mesuré' } });
    fireEvent.change(screen.getByLabelText('Note qualitative originale'), { target: { value: 'Nouvelle prise distincte.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(3));
    projection = getHopV55ReferenceProjection(h.current())!;
    const nextTasting = projection.observations.find(row => row.originalText === 'Nouvelle prise distincte.')!;
    expect(nextTasting.id).not.toBe(firstObservation.id);
    expect(nextTasting.version).toBe(1);
    expect(h.current().referenceHypotheses).toEqual([]);
  });

  it('affiche une erreur de CAS sans effacer la note ni écrire le journal local', async () => {
    const h = harness('unknown');
    render(<HopV55ReferencePanel context={h.context} prepared={h.prepared} getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    h.onSave.mockImplementationOnce(async () => { throw new Error('staleRevision · relire le workspace.'); });
    recordQualitativeNote('Brouillon conservé après conflit de révision.');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer cette observation' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('staleRevision'));
    expect(h.getWorkspace).toHaveBeenCalledTimes(1);
    expect(h.onSave).toHaveBeenCalledTimes(1);
    expect(h.current().referenceJournal).toBeUndefined();
    expect(h.current().referenceHypotheses).toEqual([]);
    expect(screen.getByLabelText('Note qualitative originale')).toHaveValue('Brouillon conservé après conflit de révision.');
  });

  it('bloque une date observée future sans ajouter d’événement', async () => {
    const h = harness('unknown');
    render(<HopV55ReferencePanel context={h.context} prepared={h.prepared} getWorkspace={h.getWorkspace} onSave={h.onSave} />);
    recordQualitativeNote();
    fireEvent.change(screen.getByLabelText('Date observée'), { target: { value: futureLocalDateTime() } });
    expect(screen.getByRole('button', { name: 'Enregistrer cette observation' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('ne peut pas être dans le futur');
    expect(h.getWorkspace).not.toHaveBeenCalled();
    expect(h.onSave).not.toHaveBeenCalled();
    expect(h.current().referenceJournal).toBeUndefined();
  });

  it('conserve un format de journal futur en lecture seule sans tentative de sauvegarde', async () => {
    const h = harness('unknown');
    const future = { ...makeWorkspace(), referenceJournal: {
      record: { formatVersion: 2, ownerKey: 'fixture-owner', contextId: 'hop-v55:reference-workspace' },
      events: [{ eventFormatVersion: 2, ownerKey: 'fixture-owner', contextId: 'hop-v55:reference-workspace' }],
    } as unknown as HopV55Workspace['referenceJournal'] };
    const getWorkspace = vi.fn(async () => structuredClone(future));
    const onSave = vi.fn(async (workspace: HopV55Workspace) => workspace);
    render(<HopV55ReferencePanel workspace={future} context={h.context} prepared={h.prepared} getWorkspace={getWorkspace} onSave={onSave} />);
    await waitFor(() => expect(screen.getByText(/Cette version de notes est conservée en lecture seule/)).toBeInTheDocument());
    expect(screen.getByText(/"formatVersion": 2/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nature du constat')).not.toBeInTheDocument();
    expect(getWorkspace).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
