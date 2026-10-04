import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { getHopV55AdoptedBaseline, getHopV55ReferenceProjection, readHopV55ReferenceJournal } from '../../src/services/hopV55/referenceWorkspace';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { HopV55ReferenceEditor } from '../../src/ui/hopV55/ReferenceEditor';
import { HopV55ReferencePanel } from '../../src/ui/hopV55/ReferencePanel';
import knowledge from '../../src/data/hopKnowledgeBootstrap.json';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function makeContext() {
  const context = makeHopV55FixtureContext('planning');
  if (context.hopIndex) context.hopIndex.knowledge = structuredClone(knowledge) as HopKnowledge[];
  return { context, prepared: prepareBrewingScenarioContext(context) };
}

function makeWorkspace(id: string): HopV55Workspace {
  return { format: 'hop-v55-workspace-v1', id, ownerKey: 'culture-reference-editor-test', revision: 0,
    title: 'Référence culturelle de test', intent: { question: '', criteria: [] }, scenarioIds: [],
    referenceHypotheses: [], copies: [], updatedAt: '2026-10-03T10:00:00.000Z' };
}

function harness(id: string) {
  const { context, prepared } = makeContext();
  let current = makeWorkspace(id);
  const getWorkspace = vi.fn(async () => structuredClone(current));
  const onSave = vi.fn(async (next: HopV55Workspace) => {
    if (next.revision !== current.revision) throw new Error('staleRevision · le workspace a changé.');
    current = { ...structuredClone(next), revision: current.revision + 1 };
    return structuredClone(current);
  });
  return { context, prepared, getWorkspace, onSave, current: () => current };
}

function knownYeasts(prepared: ReturnType<typeof prepareBrewingScenarioContext>): HopYeast[] {
  return prepared.runtime.engineData.knowledge.filter((row): row is HopYeast => row.kind === 'yeast');
}

async function confirmCulture(state: 'unknown' | 'single' | 'mixed', reason: string, yeasts: HopYeast[] = []) {
  fireEvent.click(screen.getByRole('radio', { name: state === 'unknown' ? 'Inconnue' : state === 'single' ? 'Une souche' : 'Mixte' }));
  if (state !== 'unknown') fireEvent.click(screen.getByRole('button', { name: 'Ajouter un membre de culture' }));
  if (state === 'mixed') fireEvent.click(screen.getByRole('button', { name: 'Ajouter un membre de culture' }));
  if (state === 'single' || state === 'mixed') {
    const count = state === 'single' ? 1 : 2;
    for (let index = 0; index < count; index++) {
      fireEvent.change(screen.getByLabelText(`Type d’identité du membre ${index + 1}`), { target: { value: 'documented' } });
      fireEvent.change(screen.getByLabelText(`Levure documentée du membre ${index + 1}`), { target: { value: yeasts[index].id } });
    }
  }
  fireEvent.change(screen.getByLabelText('Motif de la proposition ou correction'), { target: { value: reason } });
  const confirmation = screen.getByRole('button', { name: /Confirmer (cette hypothèse|la révision de l’hypothèse)/ });
  fireEvent.click(confirmation);
  await waitFor(() => expect(screen.getByText(/Culture confirmée pour l’adoption explicite/)).toBeInTheDocument());
}

describe('éditeur de référence et culture confirmée', () => {
  it('adopte par le geste NR explicite une culture mixte exacte, la relit sans toucher à la recette et garde les parts manquantes', async () => {
    const h = harness('workspace-reference-culture-mixed');
    const recipeBefore = structuredClone(h.context.recipe);
    const preparedCulture = h.prepared.runtime.current?.culture;
    render(<HopV55ReferencePanel context={h.context} prepared={h.prepared} getWorkspace={h.getWorkspace} onSave={h.onSave} />);

    const hypothesisSummary = screen.getByText('Hypothèse de référence', { exact: true });
    if (!hypothesisSummary.closest('details')?.open) fireEvent.click(hypothesisSummary);
    fireEvent.change(screen.getByLabelText('Nom de la référence'), { target: { value: 'Culture mixte de comparaison' } });
    fireEvent.change(screen.getByLabelText('Volume de la référence'), { target: { value: '20' } });
    fireEvent.click(screen.getByLabelText('Cette référence est déclarée sans ajout de houblon.'));

    fireEvent.click(screen.getByRole('radio', { name: 'Mixte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un membre de culture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un membre de culture' }));
    const yeasts = knownYeasts(h.prepared);
    expect(yeasts.length).toBeGreaterThanOrEqual(2);
    for (let index = 0; index < 2; index++) {
      fireEvent.change(screen.getByLabelText(`Type d’identité du membre ${index + 1}`), { target: { value: 'documented' } });
      fireEvent.change(screen.getByLabelText(`Levure documentée du membre ${index + 1}`), { target: { value: yeasts[index].id } });
    }
    fireEvent.change(screen.getByLabelText('Nature de la proportion du membre 1'), { target: { value: 'range' } });
    fireEvent.change(screen.getByLabelText('Proportion du membre 1 borne basse en pourcentage'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Proportion du membre 1 borne haute en pourcentage'), { target: { value: '38' } });
    fireEvent.change(screen.getByLabelText('Contexte ou limites de la culture hypothétique'), {
      target: { value: 'Les membres sont déclarés; aucune activité biologique n’est inférée.' },
    });
    fireEvent.change(screen.getByLabelText('Motif de la proposition ou correction'), {
      target: { value: 'Conserver les deux identités exactes issues de la comparaison adoptée.' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette hypothèse' }));
    await waitFor(() => expect(screen.getByText(/Culture confirmée pour l’adoption explicite/)).toBeInTheDocument());
    expect(h.getWorkspace).not.toHaveBeenCalled();
    expect(h.onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Adopter cette hypothèse de référence' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Adopter cette hypothèse de référence' }));
    await waitFor(() => expect(h.onSave).toHaveBeenCalledTimes(1));
    expect(readHopV55ReferenceJournal(h.current()).status).toBe('available');
    const projection = getHopV55ReferenceProjection(h.current())!;
    const baseline = getHopV55AdoptedBaseline(h.current());
    expect(h.current().referenceJournal!.events.map(event => event.kind)).toEqual(['contextOpened', 'referenceProposed', 'referenceAdopted']);
    expect(baseline?.kind).toBe('hypothetical');
    if (baseline?.kind !== 'hypothetical') throw new Error('La baseline adoptée doit rester une hypothèse typée.');
    expect(baseline.culture).toEqual({ state: 'mixed', members: [
      { yeastId: yeasts[0].id, name: yeasts[0].name, source: yeasts[0].source, proportion: { min: 0.12, max: 0.38 } },
      { yeastId: yeasts[1].id, name: yeasts[1].name, source: yeasts[1].source },
    ], explanation: 'Les membres sont déclarés; aucune activité biologique n’est inférée.\nMotif de l’hypothèse : Conserver les deux identités exactes issues de la comparaison adoptée.' });
    expect(baseline.input.yeastId).toBeNull();
    expect(h.prepared.runtime.current?.culture).toEqual(preparedCulture);
    expect(h.context.recipe).toEqual(recipeBefore);
    expect(h.current().referenceHypotheses).toEqual([]);

    const identity = projection.currentReference!;
    expect(screen.getByText(new RegExp(`Culture mixte de comparaison · ${identity.id} · v${identity.version}`))).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mixte' })).toBeChecked();
    expect(screen.getByLabelText('Nature de la proportion du membre 2')).toHaveValue('notProvided');
  });

  it('n’inscrit un ID dans l’entrée de scénario qu’avec une souche unique documentée; un nom libre reste sans ID', async () => {
    const h = harness('workspace-reference-culture-single');
    const captured = vi.fn();
    const yeasts = knownYeasts(h.prepared);
    const view = render(<HopV55ReferenceEditor prepared={h.prepared} hypotheses={[]} references={[]} currentReference={null}
      cultureSourceLabel="Référence comparative sans source courante" onAdopt={captured} />);

    fireEvent.change(screen.getByLabelText('Nom de la référence'), { target: { value: 'Hypothèse à nom libre' } });
    fireEvent.change(screen.getByLabelText('Volume de la référence'), { target: { value: '20' } });
    fireEvent.click(screen.getByLabelText('Cette référence est déclarée sans ajout de houblon.'));
    await confirmCulture('single', 'Souche documentée retenue sous son ID exact.', yeasts);
    fireEvent.click(screen.getByRole('button', { name: 'Adopter cette hypothèse de référence' }));
    await waitFor(() => expect(captured).toHaveBeenCalledTimes(1));
    expect(captured.mock.calls[0][0].baseline).toMatchObject({ kind: 'hypothetical', input: { yeastId: yeasts[0].id },
      culture: { state: 'single', members: [{ yeastId: yeasts[0].id, source: yeasts[0].source }] } });

    view.unmount();
    cleanup();
    const freeNameCapture = vi.fn();
    render(<HopV55ReferenceEditor prepared={h.prepared} hypotheses={[]} references={[]} currentReference={null}
      onAdopt={freeNameCapture} />);
    fireEvent.change(screen.getByLabelText('Nom de la référence'), { target: { value: 'Hypothèse à nom libre' } });
    fireEvent.change(screen.getByLabelText('Volume de la référence'), { target: { value: '20' } });
    fireEvent.click(screen.getByLabelText('Cette référence est déclarée sans ajout de houblon.'));
    fireEvent.click(screen.getByRole('radio', { name: 'Une souche' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un membre de culture' }));
    fireEvent.change(screen.getByLabelText('Type d’identité du membre 1'), { target: { value: 'freeName' } });
    fireEvent.change(screen.getByLabelText('Nom libre du membre 1'), { target: { value: 'Souche transmise sans étiquette' } });
    fireEvent.change(screen.getByLabelText('Motif de la proposition ou correction'), { target: { value: 'Nom exact communiqué par le brasseur.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette hypothèse' }));
    await waitFor(() => expect(screen.getByText(/Culture confirmée pour l’adoption explicite/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Adopter cette hypothèse de référence' }));
    await waitFor(() => expect(freeNameCapture).toHaveBeenCalledTimes(1));
    expect(freeNameCapture.mock.calls[0][0].baseline).toMatchObject({ kind: 'hypothetical', input: { yeastId: null },
      culture: { state: 'single', members: [{ name: 'Souche transmise sans étiquette' }] } });
    expect(freeNameCapture.mock.calls[0][0].baseline).not.toHaveProperty('culture.members.0.yeastId');
  });
});
