import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const base = (over: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'IPA', style: 'IPA', volumeL: 30, brewDate: '02.11.2026', status: 'fermentation', stockAccountingVersion: 1, ...over });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 8, 12));
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('BR-122 / BE-48 : « Jour réellement brassé » refuse le futur', () => {
  it('une date après aujourd’hui n’est pas écrite et dit pourquoi ; une date passée s’écrit', () => {
    render(<BatchDetailSheet batch={base()} initialSection="measurements" onClose={vi.fn()} />);
    const champ = screen.getByLabelText('Jour réellement brassé');
    fireEvent.change(champ, { target: { value: '2026-11-25' } });
    expect(screen.getByText(/dans le futur/)).toBeInTheDocument();
    expect(StorageService.updateBatch).not.toHaveBeenCalled();
    fireEvent.change(champ, { target: { value: '2026-11-03' } });
    expect(screen.queryByText(/dans le futur/)).not.toBeInTheDocument();
    expect(StorageService.updateBatch).toHaveBeenCalledWith(expect.objectContaining({ brewDate: '03.11.2026' }));
  });
});

describe('AM-46 : occupation du fermenteur', () => {
  const equipment = { fermenterCapacityL: 30 };
  const avecFermenteur = (over: Partial<Batch>): Batch => base({ recipeSnapshot: { brewhouse: { equipment } } as unknown as Batch['recipeSnapshot'], ...over });
  it('un second brassin en fermentation dans l’unique fermenteur de 30 L : alerte nommant le premier', () => {
    const autre = base({ id: 'B0', name: 'Stout', volumeL: 20 });
    vi.spyOn(StorageService, 'getBatches').mockReturnValue([autre]);
    render(<BatchDetailSheet batch={avecFermenteur({ volumeL: 20 })} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Fermenteur occupé : Stout \(B0\).*40 L pour un fermenteur de 30 L/);
  });
  it('deux petits brassins qui tiennent, ou une capacité inconnue : rien', () => {
    vi.spyOn(StorageService, 'getBatches').mockReturnValue([base({ id: 'B0', volumeL: 8 })]);
    render(<BatchDetailSheet batch={avecFermenteur({ volumeL: 20 })} onClose={vi.fn()} />);
    expect(screen.queryByText(/Fermenteur occupé/)).not.toBeInTheDocument();
    cleanup();
    vi.spyOn(StorageService, 'getBatches').mockReturnValue([base({ id: 'B0', volumeL: 30 })]);
    render(<BatchDetailSheet batch={base({ volumeL: 30 })} onClose={vi.fn()} />);
    expect(screen.queryByText(/Fermenteur occupé/)).not.toBeInTheDocument();
  });
});

describe('TE-40 : pas de « brassé le » à côté de « date illisible »', () => {
  it('quand une date réelle est connue, l’ancien texte devient une note, pas une alerte', () => {
    const brewDay = { currentIndex: 0, steps: [], startedAt: Date.parse('2026-09-03T08:00:00Z') } as Batch['brewDay'];
    render(<BatchDetailSheet batch={base({ brewDate: 'Planifié ~06,2026', brewDay })} onClose={vi.fn()} />);
    expect(screen.getByText(/Brassé le 03.09.2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Date réelle illisible/)).not.toBeInTheDocument();
    expect(screen.getByText(/Ancienne indication de date, conservée : Planifié ~06.2026/)).toBeInTheDocument();
  });
});
