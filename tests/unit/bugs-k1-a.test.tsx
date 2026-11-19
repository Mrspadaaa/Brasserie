// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';

// Voie k1, correction A (critique du 19.11), feuille Mesures : points 1 (valeur refusée affichée), 2 (deux comptes de relevés),
// 3 (densité au point), 4 (alerte de volume dite deux fois).
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const base = (over: Partial<Batch> = {}): Batch => ({ id: 'B9', name: 'Hazy IPA', style: 'Hazy IPA', volumeL: 19.8, brewDate: '01.10.2026', status: 'conditionne',
  og: '1.060', fg: '1.012', volumeBrewedL: 19.8, volumePackagedL: 18.5, stockAccountingVersion: 1,
  stockConsumption: { appliedAt: '2026-10-01', eventId: 'e', completedStages: ['brewday'], items: [], pendingItems: [] }, ...over } as Batch);

beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'completeBrewStock').mockReturnValue({ success: true, issues: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const rendre = (b: Batch) => render(<BatchDetailSheet batch={b} initialSection="measurements" onClose={vi.fn()} />);
const carteDensite = () => screen.getByText('Densité', { selector: 'div' }).closest('div') as HTMLElement;

describe('k1 A — feuille Mesures', () => {
  it('1 : une OG refusée (2,5) ne passe pas dans le résumé « Densité », qui garde la dernière valeur valide', () => {
    rendre(base());
    const champ = document.querySelector('input[name="batch_sheet_og"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '2,5' } });
    fireEvent.blur(champ);
    expect(screen.getAllByRole('alert').some(a => /impossible/.test(a.textContent ?? ''))).toBe(true);
    const resume = carteDensite().textContent ?? '';
    expect(resume).not.toMatch(/2,500/);
    expect(resume).toMatch(/OG 1,060/);
    // La tuile « OG » du bandeau du haut garde aussi la valeur enregistrée.
    expect(screen.queryAllByText('2,500')).toHaveLength(0);
    expect(screen.getAllByText('1,060').length).toBeGreaterThan(0);
  });

  it('2 : un seul compte de relevés, le même dans le résumé « Densité » et sous « Densité au fil du brassin »', () => {
    const journal = [{ date: '2026-10-04', sg: 1.030, tempC: 19 }, { date: '2026-10-07', sg: 1.018, tempC: 19 }];
    rendre(base({ gravityLog: journal } as Partial<Batch>));
    const carte = carteDensite().textContent ?? '';
    const courbe = (document.querySelector('[aria-label="Courbe des densités mesurées"]') as HTMLElement).textContent ?? '';
    expect(carte).toMatch(/\b2 relevés/);
    expect(courbe).toMatch(/\b2 relevés/);
    expect(courbe).not.toMatch(/\bmesures? enregistrées?\b/);
    cleanup();
    rendre(base());
    expect(carteDensite().textContent).toMatch(/\b0 relevé/);
    expect((document.querySelector('[aria-label="Courbe des densités mesurées"]') as HTMLElement).textContent).toMatch(/\b0 relevé/);
  });

  it('3 : la densité finale et la densité initiale enregistrées au point s’affichent à la virgule', () => {
    rendre(base());
    expect((document.querySelector('input[name="batch_sheet_fg"]') as HTMLInputElement).value).toBe('1,012');
    expect((document.querySelector('input[name="batch_sheet_og"]') as HTMLInputElement).value).toBe('1,060');
  });

  it('4 : « 57,9 L pour 19,8 L brassés » n’est dit qu’une fois sur la feuille d’un brassin conditionné', () => {
    rendre(base({ volumePackagedL: 57.9 }));
    const dit = (document.body.textContent ?? '').match(/57,9 L\s*(?:conditionnés\s*)?pour 19,8 L brassés/g) ?? [];
    expect(dit.length).toBe(1);
    // Et la carte « Contenants » n'ajoute pas une seconde alerte de volume (« non répartis ») pour le même fait.
    expect(screen.queryByText(/non répartis/)).toBeNull();
  });
});
