// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrewBudgetSheet } from '../../src/ui/finance/BrewBudgetSheet';
import type { AppConfig } from '../../src/types';
import { estimateBrewBudget } from '../../src/domain/finance/brewBudget';
import { brassin, instantane, recette, reglages, stocks } from './previsionsFixture';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));

/** Test d'écran P5B, constat 4 (bloquant) : « Prévoir » gris sans un mot. Le geste dit pourquoi il attend, dans le pied, à côté du bouton ; complet, il écrit. */
const config = { fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig;
const rendre = (savedEstimate: ReturnType<typeof instantane>, onSave = vi.fn()) => render(<BrewBudgetSheet open recipe={recette()} stockItems={stocks()} batches={[]} config={config} settings={reglages} savedEstimate={savedEstimate} onSave={onSave} onClose={vi.fn()} />);
const raison = () => document.querySelector('[data-booster="prevoir-raison"]');
afterEach(cleanup);

describe('Prévoir : le geste répond, ou dit ce qui manque', () => {
  it('prix manquant : le bouton est grisé et la raison est écrite dans le pied, à côté de lui', () => {
    const vide = estimateBrewBudget({ recipe: recette(), stockItems: stocks(), batches: [brassin()], brewDate: '20.11.2026', batchId: 'B1', netVolumeL: 27, og: '1.048', settings: reglages, prices: {}, isTvaRegistered: false, now: '2026-11-01T12:00:00Z' });
    rendre(vide);
    expect(screen.getByRole('button', { name: /^Prévoir/ })).toBeDisabled();
    expect(raison()).toHaveTextContent(/Prévoir attend : .*sans prix/);
    expect(raison()!.nextElementSibling).toContainElement(screen.getByRole('button', { name: /^Prévoir/ }));
  });

  it('complet : aucune raison, le geste écrit une fois avec « prévoir » et la feuille confirme', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    rendre(instantane(brassin()), save);
    expect(raison()).toBeNull();
    const bouton = screen.getByRole('button', { name: /^Prévoir/ });
    expect(bouton).toBeEnabled();
    fireEvent.click(bouton);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ complete: true }), true);
    expect(await screen.findByText('Ajouté aux prévisions')).toBeVisible();
  });
});
