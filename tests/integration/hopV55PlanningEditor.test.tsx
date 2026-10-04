import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BrewingStyleGuide } from '../../functions/src/brewingStyleSchema';
import type { HopAxis } from '../../functions/src/hopPredictionSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { BrewingScenarioBranchRequest } from '../../src/domain/brewingScenario';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { HopV55PlanningEditor } from '../../src/ui/hopV55/PlanningEditor';
import { hopV55FixtureSource } from '../fixtures/hopV55';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const axis: HopAxis = {
  id: 'axis-planning-citrus', kind: 'axis', name: 'Citrus synthétique', version: 'axis-fixture-v3',
  description: 'Axe de test uniquement.', scale: { min: 0, max: 10 }, lowMax: 3, mediumMax: 7,
  weight: { range: { min: 1, max: 1 }, source: hopV55FixtureSource }, source: hopV55FixtureSource,
};

const guide: BrewingStyleGuide = {
  id: 'style-guide-planning-fixture', kind: 'styleGuide', name: 'Guide synthétique', version: 'guide-fixture-v1',
  enabled: true, edition: 'Fixture locale', retrievedAt: null, createdAt: '2026-10-02', attribution: 'Fixture locale uniquement',
  source: hopV55FixtureSource,
  styles: [
    { id: 'style-planning-fixture-a', code: 'F-1', name: 'Bière témoin A', aliases: [], family: 'Fixture A', stats: {}, source: hopV55FixtureSource },
    { id: 'style-planning-fixture-b', code: 'F-2', name: 'Bière témoin B', aliases: [], family: 'Fixture B', stats: {}, source: hopV55FixtureSource },
  ],
};

function harness(mode: 'planning' | 'fermenting' = 'planning') {
  const context = makeHopV55FixtureContext(mode);
  context.hopIndex!.knowledge.push(structuredClone(axis), structuredClone(guide));
  const prepared = prepareBrewingScenarioContext(context);
  const onCommit = vi.fn<(branch: BrewingScenarioBranchRequest, target?: Record<string, { min: number; max: number }>) => void>();
  return { context, prepared, onCommit };
}

describe('Éditeur de branche de planification V5.5', () => {
  it('lit une décimale française et transmet le volume exact sans toucher aux masses source', async () => {
    const h = harness();
    const sourceBefore = structuredClone(h.context.recipe);
    render(<HopV55PlanningEditor prepared={h.prepared} context={h.context} onCommit={h.onCommit} />);

    fireEvent.change(screen.getByLabelText('Volume final de cette branche'), { target: { value: '28,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre cette branche' }));
    await waitFor(() => expect(h.onCommit).toHaveBeenCalledTimes(1));
    const branch = h.onCommit.mock.calls[0][0];
    expect(branch.inputOverrides?.volumeL).toBe(28.5);
    expect(branch.programOverrides?.volumeL).toBe(28.5);
    expect(h.context.recipe).toEqual(sourceBefore);
    expect(branch.programChanges).toBeUndefined();
  });

  it('ne transmet pas un nombre illisible et garde le formulaire corrigeable', () => {
    const h = harness();
    render(<HopV55PlanningEditor prepared={h.prepared} context={h.context} onCommit={h.onCommit} />);
    const volume = screen.getByLabelText('Volume final de cette branche');
    fireEvent.change(volume, { target: { value: '1,2,3' } });
    expect(volume).toHaveAttribute('aria-invalid', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre cette branche' }));
    expect(h.onCommit).not.toHaveBeenCalled();
    expect(screen.getByText(/Corrige les nombres signalés/)).toBeInTheDocument();
    fireEvent.change(volume, { target: { value: '29,25' } });
    expect(volume).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('efface un ancien override quand son champ est vidé au lieu de le garder caché', async () => {
    const h = harness();
    const branch: BrewingScenarioBranchRequest = {
      id: 'reset-volume-plan', label: 'Volume à réinitialiser', assumptions: [
        { id: 'old-input-volume', path: 'recipe.volumeL', label: 'Volume choisi', status: 'selected', origin: 'userHypothesis', explanation: 'Ancien choix.', value: 33, unit: 'L' },
        { id: 'old-program-volume', path: 'program.volumeL', label: 'Volume programme', status: 'selected', origin: 'userHypothesis', explanation: 'Ancien choix.', value: 33, unit: 'L' },
      ], inputOverrides: { volumeL: 33 }, programOverrides: { volumeL: 33 },
    };
    render(<HopV55PlanningEditor prepared={h.prepared} context={h.context} branch={branch} onCommit={h.onCommit} />);
    const volume = screen.getByLabelText('Volume final de cette branche');
    expect(volume).toHaveValue('33');
    fireEvent.change(volume, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre cette branche' }));
    await waitFor(() => expect(h.onCommit).toHaveBeenCalledTimes(1));
    const next = h.onCommit.mock.calls[0][0];
    expect(next.inputOverrides).toBeUndefined();
    expect(next.programOverrides).toBeUndefined();
    expect(next.assumptions.filter(row => row.path === 'recipe.volumeL' || row.path === 'program.volumeL')
      .every(row => row.status === 'proposed')).toBe(true);
  });

  it('requiert le rôle avant d’adopter un style prérempli et garde ses références exactes', async () => {
    const h = harness();
    const stylePrefill = { id: guide.id, guideId: guide.id, version: guide.version, styleId: guide.styles[0].id };
    render(<HopV55PlanningEditor prepared={h.prepared} context={h.context} stylePrefill={stylePrefill} onCommit={h.onCommit} />);
    expect(screen.getByLabelText('Style exact')).toHaveDisplayValue('Bière témoin A · F-1 · Fixture A');
    expect(screen.getByLabelText('Rôle du style')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre cette branche' }));
    expect(h.onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('précise si elle est une cible ou une comparaison');

    fireEvent.change(screen.getByLabelText('Rôle du style'), { target: { value: 'target' } });
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre cette branche' }));
    await waitFor(() => expect(h.onCommit).toHaveBeenCalledTimes(1));
    const branch = h.onCommit.mock.calls[0][0];
    expect(branch.beerContext?.style).toEqual({ guideId: guide.id, version: guide.version, styleId: guide.styles[0].id, role: 'target' });
    expect(branch.beerContext?.facts.find(row => row.field === 'style.name' && row.status === 'target')).toMatchObject({
      value: guide.styles[0].name, source: guide.styles[0].source,
    });
  });

  it('ne choisit pas arbitrairement le premier style d’un guide à plusieurs entrées', () => {
    const h = harness();
    const stylePrefill = { id: guide.id, guideId: guide.id, version: guide.version };
    render(<HopV55PlanningEditor prepared={h.prepared} context={h.context} stylePrefill={stylePrefill} onCommit={h.onCommit} />);
    expect(screen.getByLabelText('Guide de style')).toHaveDisplayValue(/Guide synthétique/);
    expect(screen.getByLabelText('Style exact')).toHaveValue('');
    expect(h.onCommit).not.toHaveBeenCalled();
  });

  it('garde les comparaisons accessibles après le début de la fermentation', () => {
    const h = harness('fermenting');
    const stylePrefill = { id: guide.id, guideId: guide.id, version: guide.version, styleId: guide.styles[0].id };
    render(<HopV55PlanningEditor prepared={h.prepared} context={h.context} stylePrefill={stylePrefill} onCommit={h.onCommit} />);
    expect(screen.getByText('Fermentation', { selector: '.hv-planning__stage' })).toBeInTheDocument();
    expect(screen.getByLabelText('Volume final de cette branche')).toBeDisabled();
    expect(screen.getByLabelText('Température d’ensemencement')).toBeDisabled();
    expect(screen.getByLabelText('Rôle du style')).toBeEnabled();
    expect(screen.getByText(/Les cibles et comparaisons restent disponibles/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Rôle du style'), { target: { value: 'reference' } });
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre cette branche' }));
    expect(h.onCommit).toHaveBeenCalledTimes(1);
    expect(h.onCommit.mock.calls[0][0].beerContext?.style?.role).toBe('reference');
    expect(h.onCommit.mock.calls[0][0].inputOverrides).toBeUndefined();
  });

  it('laisse retirer un ancien réglage devenu non futur sans déverrouiller les faits réalisés', async () => {
    const h = harness('fermenting');
    const branch: BrewingScenarioBranchRequest = {
      id: 'old-volume-comparison', label: 'Ancien volume de comparaison', assumptions: [
        { id: 'old-volume-input', path: 'recipe.volumeL', label: 'Volume de comparaison', status: 'selected', origin: 'userHypothesis', explanation: 'Ancien scénario.', value: 30, unit: 'L' },
        { id: 'old-volume-program', path: 'program.volumeL', label: 'Volume du programme', status: 'selected', origin: 'userHypothesis', explanation: 'Ancien scénario.', value: 30, unit: 'L' },
      ], inputOverrides: { volumeL: 30 }, programOverrides: { volumeL: 30 },
    };
    render(<HopV55PlanningEditor prepared={h.prepared} context={h.context} branch={branch} onCommit={h.onCommit} />);
    expect(screen.getByLabelText('Volume final de cette branche')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer l’override de volume' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transmettre cette branche' }));
    await waitFor(() => expect(h.onCommit).toHaveBeenCalledTimes(1));
    expect(h.onCommit.mock.calls[0][0].inputOverrides).toBeUndefined();
    expect(h.onCommit.mock.calls[0][0].programOverrides).toBeUndefined();
  });
});
