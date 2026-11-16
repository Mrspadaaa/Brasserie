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

// p4 : e4c remplace le formulaire de volume par l'échelle des étapes : bouteilles au curseur, fûts, volume = ce qui est réparti, plafonné au volume en fermenteur (22 L mesurés).
const ouvrir = (batch: Batch) => {
  render(<BatchDetailSheet batch={{ og: '1.050', fg: '1.010', ...batch } as Batch} initialSection="measurements" onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Conditionner · bouteilles et fût/ }));
  return within(document.querySelector('[data-echelle]') as HTMLElement);
};
const plus = (echelle: ReturnType<typeof ouvrir>, n: number) => { for (let i = 0; i < n; i++) fireEvent.click(echelle.getByRole('button', { name: 'Une bouteille de plus' })); };

describe('Fiche brassin : passage en Conditionné', () => {
  it('demande le volume ; 0 est refusé et dit à l’écran, plus que le fermenteur (22 L mesurés) est impossible à régler, et l’étape ne change pas', () => {
    const echelle = ouvrir(base());
    fireEvent.click(echelle.getByRole('button', { name: /^Conditionner/ }));
    expect(echelle.getByRole('alert').textContent).toMatch(/plus grand que 0 L/);
    plus(echelle, 90); // 66 bouteilles de 33 cl = 21,78 L : le curseur s'arrête au volume en fermenteur
    expect(echelle.getAllByText('66').length).toBeGreaterThan(0);
    expect(echelle.getByRole('button', { name: /^Conditionner 21,78 L/ })).toBeInTheDocument();
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
  });
  it('un volume valide et la date : l’étape passe, volume et date partent avec elle', () => {
    const echelle = ouvrir(base());
    plus(echelle, 62); // 62 × 33 cl = 20,46 L
    fireEvent.click(echelle.getByRole('button', { name: /^Conditionner 20,46 L/ }));
    expect(StorageService.completeBrewStock).toHaveBeenCalledWith(expect.objectContaining({ status: 'conditionne', volumePackagedL: 20.46, bottlingDate: expect.stringMatching(/^\d{2}\.\d{2}\.\d{4}$/) }), 'remaining', false);
  });
  it('RF-8 : un retour en arrière (Terminé vers Conditionné) sur un lot sans volume ne rouvre pas le formulaire', () => {
    render(<BatchDetailSheet batch={base({ status: 'termine' })} initialSection="overview" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revenir à « Conditionné »' }));
    // Le retour en arrière demande d'abord sa confirmation ; le volume n'est jamais demandé, ni avant ni après.
    expect(screen.queryByLabelText('Conditionnement du brassin')).toBeNull();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Revenir à « Conditionné »' }).at(-1)!);
    expect(screen.queryByLabelText('Conditionnement du brassin')).toBeNull();
    expect(StorageService.updateBatch).toHaveBeenCalledWith(expect.objectContaining({ status: 'conditionne' }));
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
  });
  it('Fermer l’échelle : rien ne change', () => {
    const echelle = ouvrir(base());
    plus(echelle, 5);
    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer' }).at(-1)!);
    expect(document.querySelector('[data-echelle]')).toBeNull();
    expect(StorageService.completeBrewStock).not.toHaveBeenCalled();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
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
