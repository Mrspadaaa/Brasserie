import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { BatchGravityEntry } from '../../src/ui/production/BatchGravityEntry';
import { StorageService } from '../../src/services/storage';
import type { Batch } from '../../src/types';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { fullRecipe } from '../fixtures/fullRecipe';

const batch: Batch = {
  id: 'READING',
  name: 'Essai',
  style: 'IPA',
  volumeL: 24,
  status: 'fermentation',
  brewDate: '01.09.2026',
  og: '1.065',
  recipeSnapshot: captureSnapshot(fullRecipe),
  gravityLog: [{ date: '02.09.2026', sg: 1.04, tempC: 19 }]
};
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 8, 12));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Accessible fermentation follow-up in the active lot sheet', () => {
  it('appends a comma-decimal reading while preserving OG, FG and previous readings, without inventing temperature', () => {
    const update = vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
    render(<BatchDetailSheet batch={{ ...batch, fg: '1.015' }} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un relevé de densité' }));
    fireEvent.change(screen.getByLabelText('Densité du relevé'), { target: { value: '1,024' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le relevé' }));
    expect(update).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        og: '1.065',
        fg: '1.015',
        status: 'fermentation',
        gravityLog: [...batch.gravityLog!, { date: '2026-09-08', sg: 1.024 }]
      })
    );
    expect(screen.getByText('Relevé ajouté au suivi.')).toBeInTheDocument();
  });
  it('rejects invalid SG and future or pre-brew measurements, accepts an actually measured zero temperature', () => {
    const onAdd = vi.fn();
    render(<BatchGravityEntry batch={batch} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un relevé de densité' }));
    fireEvent.change(screen.getByLabelText('Densité du relevé'), { target: { value: '1024' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le relevé' }));
    expect(screen.getByRole('alert')).toHaveTextContent('entre 0,900 et 1,300');
    fireEvent.change(screen.getByLabelText('Densité du relevé'), { target: { value: '1,024' } });
    for (const date of ['2026-09-09', '2026-08-31']) {
      fireEvent.change(screen.getByLabelText('Date du relevé'), { target: { value: date } });
      fireEvent.click(screen.getByRole('button', { name: 'Ajouter le relevé' }));
      expect(screen.getByRole('alert')).toHaveTextContent('entre le brassage et aujourd’hui');
    }
    expect(onAdd).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Date du relevé'), { target: { value: '2026-09-08' } });
    fireEvent.change(screen.getByLabelText('Température du relevé'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le relevé' }));
    expect(onAdd).toHaveBeenCalledWith({ date: '2026-09-08', sg: 1.024, tempC: 0 });
  });
  it('opens tasting directly and saves the note through the existing batch service', () => {
    const update = vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
    render(
      <BatchDetailSheet
        batch={{ ...batch, status: 'conditionne' }}
        initialSection="tasting"
        onClose={vi.fn()}
      />
    );
    const input = screen.getByLabelText('Dégustation et prochain essai');
    expect(
      screen.queryByRole('button', { name: 'Ajouter un relevé de densité' })
    ).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Réduire le malt chocolat.' } });
    fireEvent.blur(input);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ notesTasting: 'Réduire le malt chocolat.', status: 'conditionne' })
    );
  });
});
