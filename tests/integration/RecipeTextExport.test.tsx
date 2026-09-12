import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecipeTextExport } from '../../src/ui/RecipeTextExport';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('copie complète de recette', () => {
  it('attend la résolution du presse-papier avant d’annoncer une copie', async () => {
    let complete!: () => void;
    const write = vi.fn(() => new Promise<void>(resolve => { complete = resolve; }));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: write } });
    render(<RecipeTextExport buildText={() => 'Recette NOLO complète · 0,5 %'}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Copier la recette en texte' }));
    expect(screen.getByRole('button', { name: 'Copie en cours…' })).toBeDisabled();
    expect(screen.queryByText(/Recette copiée/)).not.toBeInTheDocument();
    await act(async () => complete());
    expect(write).toHaveBeenCalledWith('Recette NOLO complète · 0,5 %');
    expect(screen.getByText(/Recette copiée/)).toBeVisible();
  });
  it('rend le texte et le fichier accessibles quand le presse-papier refuse', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new DOMException('Refus', 'NotAllowedError')) } });
    render(<RecipeTextExport buildText={() => 'Analyses\nSucres : 100 g'}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Copier la recette en texte' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Copie refusée');
    expect(screen.getByLabelText('Texte complet de la recette')).toHaveValue('Analyses\nSucres : 100 g');
    expect(screen.getByRole('button', { name: 'Télécharger .txt' })).toBeVisible();
    expect(screen.queryByText(/Recette copiée/)).not.toBeInTheDocument();
  });
  it('signale une configuration invalide sans copier une recette incomplète', async () => {
    const write = vi.fn(); Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: write } });
    render(<RecipeTextExport buildText={() => { throw Error('Configuration NOLO invalide'); }}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Copier la recette en texte' }));
    expect((await screen.findAllByRole('alert'))[0]).toHaveTextContent('Configuration NOLO invalide');
    expect(write).not.toHaveBeenCalled();
  });
});
