import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { BatchGravityEntry } from '../../src/ui/production/BatchGravityEntry';
import { StorageService } from '../../src/services/storage';
import type { Batch } from '../../src/types';
import { captureSnapshot } from '../../src/domain/recipeSnapshot';
import { fullRecipe } from '../fixtures/fullRecipe';
import { poserDate, zoneDate } from '../helpers/poserDate';

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
  it.each(['annule'] as const)('preserves a legacy actual date when changing to %s', status => {
    const update = vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
    render(<BatchDetailSheet batch={batch} initialSection="overview" onClose={vi.fn()} />);
    // e3gb (15.11) : le sélecteur d'étape n'existe plus en fermentation ; l'abandon passe par « Revenir · abandon ».
    fireEvent.click(screen.getByRole('button', { name: /Revenir · abandon/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Annulé (abandon)' }));
    expect(update).not.toHaveBeenCalled(); // RJ-15 : l'abandon se confirme dans la page
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner le brassin' }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status, brewDate: '01.09.2026', plannedBrewDate: '' }));
    expect(screen.queryByRole('button', { name: 'Planifier' })).not.toBeInTheDocument();
    // p4 : e2a ne montre plus la ligne « Brassé le » ; le bloc d'état dit que le lot a bien été brassé (les dates restent écrites, vérifié ci-dessus).
    expect(screen.getByText('Abandonnée en cours de route')).toBeInTheDocument();
  });

  it('cancels a legacy plan without turning it into an actual brewing day', () => {
    const update = vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
    render(<BatchDetailSheet batch={{ ...batch, status: 'planifie' }} initialSection="measurements" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Étape/ }));
    fireEvent.click(screen.getByRole('button', { name: /Abandonner le lot/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ brewDate: '', plannedBrewDate: '01.09.2026' }));
    // p4 : e2a ne montre plus « Était prévu le » ; le bloc d'état dit que le lot n'a jamais été brassé, et la date prévue reste écrite (vérifié ci-dessus).
    expect(screen.getByText('Abandonnée, jamais brassée')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Changer la date' })).not.toBeInTheDocument();
  });

  it('appends a comma-decimal reading while preserving OG, FG and previous readings, without inventing temperature', () => {
    const update = vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
    // gfc (15.11) : le relevé se fait par « Mesurer » dans la rubrique Mesures ; « Taper » ouvre la saisie décimale au clavier.
    render(<BatchDetailSheet batch={{ ...batch, fg: '1.015' }} initialSection="measurements" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Mesurer/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Taper' })[0]); // le premier : la densité (puis °C cuve, °C échantillon)
    fireEvent.change(screen.getByLabelText('Densité du relevé'), { target: { value: '1,024' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le relevé' }));
    expect(update).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        og: '1.065',
        fg: '1.015',
        status: 'fermentation',
        gravityLog: [...batch.gravityLog!, { date: '2026-09-08', sg: 1.024 }]
      })
    );
    // Le geste se referme sur le « Mesurer » du pied : le relevé est écrit (vérifié ci-dessus), plus rien d'ouvert.
    expect(screen.queryByRole('button', { name: 'Enregistrer le relevé' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mesurer/ })).toBeInTheDocument();
  });
  it('rejects invalid SG and future or pre-brew measurements, accepts an actually measured zero temperature', () => {
    const onAdd = vi.fn();
    render(<BatchGravityEntry batch={batch} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un relevé de densité' }));
    fireEvent.change(screen.getByLabelText('Densité du relevé'), { target: { value: '1024' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le relevé' }));
    expect(screen.getByRole('alert')).toHaveTextContent('entre 0,990 et 1,200');
    // AM-40 (08.11) : 0,9 et 1,3 étaient acceptés ; une température de 120 °C aussi.
    for (const sg of ['0,9', '1,3']) {
      fireEvent.change(screen.getByLabelText('Densité du relevé'), { target: { value: sg } });
      fireEvent.click(screen.getByRole('button', { name: 'Ajouter le relevé' }));
      expect(screen.getByRole('alert')).toHaveTextContent('entre 0,990 et 1,200');
    }
    fireEvent.change(screen.getByLabelText('Densité du relevé'), { target: { value: '1,024' } });
    fireEvent.change(screen.getByLabelText('Température du relevé'), { target: { value: '120' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le relevé' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Saisis une température entre');
    fireEvent.change(screen.getByLabelText('Température du relevé'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Densité du relevé'), { target: { value: '1,024' } });
    // GESTE-DATE-PARTOUT : le futur ne se pose plus (la frise revient sur aujourd'hui, `max`) ; avant le brassage, c'est le message qui refuse
    poserDate('Date du relevé', '2026-09-09');
    expect(zoneDate('Date du relevé')).toHaveAttribute('data-valeur', '2026-09-08');
    poserDate('Date du relevé', '2026-08-31');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le relevé' }));
    expect(screen.getByRole('alert')).toHaveTextContent('entre le brassage et aujourd’hui');
    expect(onAdd).not.toHaveBeenCalled();
    poserDate('Date du relevé', '2026-09-08');
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
