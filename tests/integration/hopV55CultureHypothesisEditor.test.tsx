import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import { HopV55CultureHypothesisEditor } from '../../src/ui/hopV55/CultureHypothesisEditor';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const sourceA = { title: 'Fiche A', author: 'Catalogue de fixture', year: 2026, kind: 'manufacturer' as const,
  reference: 'fixture://yeast/A' };
const sourceB = { title: 'Fiche B', author: 'Catalogue de fixture', year: 2026, kind: 'manufacturer' as const,
  reference: 'fixture://yeast/B' };
const yeastA: Pick<HopYeast, 'id' | 'name' | 'source'> = { id: 'yeast-a', name: 'Souche A', source: sourceA };
const yeastB: Pick<HopYeast, 'id' | 'name' | 'source'> = { id: 'yeast-b', name: 'Souche B', source: sourceB };

describe('éditeur de culture hypothétique', () => {
  it('construit une culture mixte par choix explicites, garde le nom libre sans ID et ne normalise pas les plages', async () => {
    const onConfirm = vi.fn(async (_culture: BrewingScenarioCultureContext, _reason: string) => undefined);
    render(<HopV55CultureHypothesisEditor documentedYeasts={[yeastA, yeastB]} sourceLabel="NR/adoption α · version 03"
      onConfirm={onConfirm} />);

    expect(screen.getByRole('heading', { name: 'Culture hypothétique de comparaison' })).toBeInTheDocument();
    expect(screen.getByText('NR/adoption α · version 03')).toBeInTheDocument();
    expect(screen.getByText(/Aucun état n’est présélectionné/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Inconnue' })).not.toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Mixte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un membre de culture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un membre de culture' }));
    fireEvent.change(screen.getByLabelText('Type d’identité du membre 1'), { target: { value: 'freeName' } });
    fireEvent.change(screen.getByLabelText('Nom libre du membre 1'), { target: { value: 'Culture transmise sans étiquette' } });
    fireEvent.change(screen.getByLabelText('Nature de la proportion du membre 1'), { target: { value: 'range' } });
    fireEvent.change(screen.getByLabelText('Proportion du membre 1 borne basse en pourcentage'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Proportion du membre 1 borne haute en pourcentage'), { target: { value: '35' } });
    fireEvent.change(screen.getByLabelText('Type d’identité du membre 2'), { target: { value: 'documented' } });
    fireEvent.change(screen.getByLabelText('Levure documentée du membre 2'), { target: { value: 'yeast-b' } });
    fireEvent.change(screen.getByLabelText('Motif de la proposition ou correction'), { target: { value: 'Comparer cette composition explicitement déclarée.' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette hypothèse' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledWith({ state: 'mixed', members: [
      { name: 'Culture transmise sans étiquette', proportion: { min: 0.1, max: 0.35 } },
      { yeastId: 'yeast-b', name: 'Souche B', source: sourceB },
    ] }, 'Comparer cette composition explicitement déclarée.');
    expect(onConfirm.mock.calls[0][0].members[0]).not.toHaveProperty('yeastId');
    expect(onConfirm.mock.calls[0][0].members[1].proportion).toBeUndefined();
  });

  it('corrige l’identité A vers B, conserve la plage initiale et permet une nouvelle tentative avec le même motif après refus', async () => {
    const initialCulture: BrewingScenarioCultureContext = { state: 'single', members: [{ yeastId: 'yeast-a', name: 'Souche A',
      source: sourceA, proportion: { min: 0.15, max: 0.42 } }], explanation: 'Contexte initial conservé.' };
    const onConfirm = vi.fn()
      .mockRejectedValueOnce(new Error('Révision du workspace périmée.'))
      .mockResolvedValueOnce(undefined);
    render(<HopV55CultureHypothesisEditor initialCulture={initialCulture} documentedYeasts={[yeastA, yeastB]} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText('Type d’identité du membre 1'), { target: { value: 'documented' } });
    fireEvent.change(screen.getByLabelText('Levure documentée du membre 1'), { target: { value: 'yeast-b' } });
    fireEvent.change(screen.getByLabelText('Motif de la proposition ou correction'), { target: { value: 'Correction de l’identité selon le dossier exact.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la révision de l’hypothèse' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Révision du workspace périmée.'));
    expect(screen.getByLabelText('Levure documentée du membre 1')).toHaveValue('yeast-b');
    expect(screen.getByLabelText('Motif de la proposition ou correction')).toHaveValue('Correction de l’identité selon le dossier exact.');
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0]).toEqual({ state: 'single', members: [{ yeastId: 'yeast-b', name: 'Souche B',
      source: sourceB, proportion: { min: 0.15, max: 0.42 } }], explanation: 'Contexte initial conservé.' });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la révision de l’hypothèse' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Culture confirmée pour l’adoption explicite'));
    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(onConfirm.mock.calls[1]).toEqual(onConfirm.mock.calls[0]);
  });

  it('refuse une culture mixte avec un seul membre et ne transforme pas une absence en unknown implicite', () => {
    const onConfirm = vi.fn(async (_culture: BrewingScenarioCultureContext, _reason: string) => undefined);
    const { rerender } = render(<HopV55CultureHypothesisEditor onConfirm={onConfirm} />);
    fireEvent.change(screen.getByLabelText('Motif de la proposition ou correction'), { target: { value: 'Motif explicite.' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Mixte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un membre de culture' }));
    fireEvent.change(screen.getByLabelText('Type d’identité du membre 1'), { target: { value: 'freeName' } });
    fireEvent.change(screen.getByLabelText('Nom libre du membre 1'), { target: { value: 'Nom témoin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette hypothèse' }));
    expect(screen.getByRole('alert')).toHaveTextContent('au moins deux membres');
    expect(onConfirm).not.toHaveBeenCalled();

    rerender(<HopV55CultureHypothesisEditor initialCulture={{ state: 'unknown', members: [] }} readOnly onConfirm={onConfirm} />);
    expect(screen.getByRole('radio', { name: 'Inconnue' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Confirmer la révision de l’hypothèse' })).toBeDisabled();
    expect(screen.getByLabelText('Motif de la proposition ou correction')).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirme unknown seulement après choix explicite et sans membres', async () => {
    const onConfirm = vi.fn(async (_culture: BrewingScenarioCultureContext, _reason: string) => undefined);
    render(<HopV55CultureHypothesisEditor onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Inconnue' }));
    fireEvent.change(screen.getByLabelText('Motif de la proposition ou correction'), { target: { value: 'L’identité reste inconnue dans la source.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer cette hypothèse' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ state: 'unknown', members: [] }, 'L’identité reste inconnue dans la source.'));
  });
});
