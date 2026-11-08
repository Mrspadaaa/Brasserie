import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

// AM n° 6 : le volume conditionné se saisit dans le parcours réel du brassin, au passage « Conditionné » ; borné par le volume en fermenteur.
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const base = (over: Partial<Batch> = {}): Batch => ({ id: 'B7', name: 'Pale Ale', style: 'Pale Ale', volumeL: 25, volumeBrewedL: 22, brewDate: '01.10.2026', status: 'garde',
  stockAccountingVersion: 1, stockConsumption: { appliedAt: '2026-10-01', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [] }, ...over } as Batch);
beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'completeBrewStock').mockReturnValue({ success: true, issues: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ouvrir = (batch: Batch) => {
  render(<BatchDetailSheet batch={batch} initialSection="overview" onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Passer en « Conditionné »' }));
  return within(screen.getByLabelText('Conditionnement du brassin'));
};

describe('Fiche brassin : passage en Conditionné', () => {
  it('demande le volume ; 0, vide et plus que le fermenteur (22 L mesurés) sont refusés, dits à l’écran, et l’étape ne change pas', () => {
    const form = ouvrir(base());
    for (const valeur of ['', '0', '22,5']) {
      fireEvent.change(screen.getByLabelText('Volume conditionné (L)'), { target: { value: valeur } });
      fireEvent.click(form.getByRole('button', { name: 'Passer en « Conditionné »' }));
      expect(screen.getByLabelText('Conditionnement du brassin')).toBeInTheDocument();
    }
    expect(screen.getByLabelText('Conditionnement du brassin').textContent).toMatch(/Plus que le volume en fermenteur \(22 L\)/);
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
  });
  it('un volume valide et la date : l’étape passe, volume et date partent avec elle', () => {
    const form = ouvrir(base());
    fireEvent.change(screen.getByLabelText('Volume conditionné (L)'), { target: { value: '20,4' } });
    fireEvent.click(form.getByRole('button', { name: 'Passer en « Conditionné »' }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status: 'conditionne', volumePackagedL: 20.4, bottlingDate: expect.stringMatching(/^\d{2}\.\d{2}\.\d{4}$/) }), 'remaining', false);
  });
  it('Annuler : rien ne change', () => {
    const form = ouvrir(base());
    fireEvent.click(form.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByLabelText('Conditionnement du brassin')).toBeNull();
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
  });
  it('un lot déjà conditionné sans volume : l’alerte et la saisie sont dans les mesures ; l’enregistrement ne change pas l’étape', () => {
    render(<BatchDetailSheet batch={base({ status: 'conditionne' })} onClose={vi.fn()} />);
    expect(screen.getByText(/Volume conditionné manquant/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Saisir le volume conditionné' }));
    fireEvent.change(screen.getByLabelText('Volume conditionné (L)'), { target: { value: '19' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le volume' }));
    expect(StorageService.updateBatch).toHaveBeenCalledWith(expect.objectContaining({ status: 'conditionne', volumePackagedL: 19 }));
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
  });
});
