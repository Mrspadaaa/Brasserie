// Critique du 08.11, fiche brassin › Mesures (RJ-2) : une OG de 1,140 gardée après confirmation affichait ensuite « Alcool non calculé :
// densités hors bornes ». Une valeur confirmée est une vraie mesure : l'alcool se calcule tant qu'il reste plausible (0 à 18 % vol).
// Et la courbe d'une seule mesure s'ajuste à ses valeurs (axe de −1,000 à 3,000 avant).
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch } from '../../src/types';
import { BatchDetailSheet } from '../../src/ui/BatchDetailSheet';
import { StorageService } from '../../src/services/storage';
import { abvFromGravities, densityAxisDomain } from '../../src/domain/gravityBounds';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/hopIndex/HopTastingsPanel', () => ({ HopTastingsPanel: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetButton: () => null }));

const base = (over: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'Dubbel de banc', style: 'Dubbel', volumeL: 20, brewDate: '01.09.2026', status: 'fermentation', stockAccountingVersion: 1, ...over });
beforeEach(() => {
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'completeBrewStock').mockReturnValue({ success: true, issues: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const og = () => screen.getByPlaceholderText('À mesurer');
const fg = () => screen.getByPlaceholderText('Non confirmée');
const typeBlur = (el: HTMLElement, value: string) => { fireEvent.change(el, { target: { value } }); fireEvent.blur(el); };

describe('l’alcool d’une OG confirmée', () => {
  it('abvFromGravities : OG 1,140 / FG 1,012 (valeurs gardables) donne 17,7 ; au-delà de 18 %, impossible ou FG > OG : rien', () => {
    expect(abvFromGravities(1.14, 1.012)).toBe(17.7);
    expect(abvFromGravities(1.15, 0.995)).toBeNull();
    expect(abvFromGravities(1.29, 1.01)).toBeNull();
    expect(abvFromGravities(-5, 1.01)).toBeNull();
    expect(abvFromGravities(1.14, 1.15)).toBeNull();
    expect(abvFromGravities(1.05, 1.01)).toBe(5.3);
  });

  it('OG 1,140 gardée puis FG 1,012 : « Alcool calculé 17,7 % vol », jamais « non calculé », et l’alcool est écrit', () => {
    render(<BatchDetailSheet batch={base()} initialSection="measurements" onClose={vi.fn()} />);
    typeBlur(og(), '1,140');
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette valeur' }));
    typeBlur(fg(), '1,012');
    expect(screen.queryByText(/Alcool non calculé/)).not.toBeInTheDocument();
    expect(screen.getByText(/Alcool calculé/)).toHaveTextContent('17,7');
    const dernier = vi.mocked(StorageService.updateBatch).mock.calls.at(-1)![0];
    expect(dernier.abv).toBe('17.7%');
  });

  it('une fiche déjà gardée (OG 1,140, FG 1,012) affiche l’alcool à la réouverture', () => {
    render(<BatchDetailSheet batch={base({ og: '1,140', fg: '1,012' })} initialSection="measurements" onClose={vi.fn()} />);
    expect(screen.getByText(/Alcool calculé/)).toHaveTextContent('17,7');
    expect(screen.queryByText(/Alcool non calculé/)).not.toBeInTheDocument();
  });

  it('au-delà de 18 % : non calculé, et la raison le dit (pas « densités hors bornes »)', () => {
    render(<BatchDetailSheet batch={base({ og: '1,150', fg: '0,995' })} initialSection="measurements" onClose={vi.fn()} />);
    expect(screen.getByText(/Alcool non calculé/)).toHaveTextContent(/18 % vol/);
    expect(screen.getByText(/Alcool non calculé/)).not.toHaveTextContent(/hors bornes/);
  });
});

describe('l’axe de la courbe de densité', () => {
  it('une seule mesure : ±0,010 autour d’elle (jamais −1,000 à 3,000)', () => {
    const [min, max] = densityAxisDomain([1.14]);
    expect(min).toBeCloseTo(1.13, 3);
    expect(max).toBeCloseTo(1.15, 3);
  });
  it('plusieurs mesures et la FG cible : l’axe les contient toutes, avec une marge, et reste serré', () => {
    const [min, max] = densityAxisDomain([1.07, 1.03, 1.012, 1.011]);
    expect(min).toBeLessThan(1.011);
    expect(max).toBeGreaterThan(1.07);
    expect(max - min).toBeLessThan(0.1);
    expect(min).toBeGreaterThan(0.99);
  });
  it('valeurs inconnues ou illisibles ignorées ; aucune valeur : un axe plausible de la bière', () => {
    expect(densityAxisDomain([Number.NaN, 1.05])[0]).toBeCloseTo(1.04, 3);
    const [min, max] = densityAxisDomain([]);
    expect(min).toBeGreaterThan(0.99);
    expect(max).toBeLessThan(1.2);
  });
});
