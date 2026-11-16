import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { StorageService } from '../../src/services/storage';
import type { BrewhouseProfile, Recipe } from '../../src/types';

const brewhouse: BrewhouseProfile = { id: 'qa', name: 'Cuve QA', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3 };
const recipe: Recipe = { id: 'qa', name: 'Hazy', style: 'Hazy IPA', volumeL: 19.75, fermentables: [{ name: 'Pale', weightKg: 6, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 }], hops: [{ name: 'Citra', weightG: 100, stage: 'boil', timeMin: 15, alpha: 12 }], yeast: { name: 'US-05', qty: 1, unit: 'sachet' } } as Recipe;
const mount = () => render(<ProductionTab recipes={[recipe]} batches={[]} brewhouses={[brewhouse]} activeBrewhouseId="qa" globalTimeFilter="all" targetSubTab="scaler" onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()} />);
beforeEach(() => { localStorage.clear(); vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Maquette e10c : le volume cible se tape après « Taper le volume » et se valide au blur ou à Entrée.
const taper = (valeur: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Taper le volume' }));
  const champ = screen.getByRole('textbox', { name: 'Volume cible' });
  fireEvent.change(champ, { target: { value: valeur } });
  fireEvent.blur(champ);
  return champ;
};
const totaux = () => screen.getByLabelText('Totaux');

describe('Brassins › Volumes : BR-111, BE-100, BE-101, BR-113', () => {
  it('99 999 L : refusé avec la borne, aucun calcul de 18 000 kg', () => {
    mount();
    taper('99999');
    expect(screen.getByRole('alert')).toHaveTextContent(/au plus 2\s?000 L/i);
    expect(totaux().textContent).not.toMatch(/18\s?000/);
    expect(within(totaux()).getAllByText('—').length).toBeGreaterThan(0);
  });
  it('0 L : la borne est dite (0,5 L ou plus), aucun total calculé', () => {
    mount();
    taper('0');
    expect(screen.getByRole('alert')).toHaveTextContent('0,5 L ou plus');
    expect(within(totaux()).getAllByText('—').length).toBeGreaterThan(0);
  });
  it('« 0 » tapé puis quitté dit la borne au lieu de changer en silence (Entrée comme blur)', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Taper le volume' }));
    const champ = screen.getByRole('textbox', { name: 'Volume cible' });
    fireEvent.change(champ, { target: { value: '0' } });
    fireEvent.keyDown(champ, { key: 'Enter' });
    expect(screen.getByRole('alert')).toHaveTextContent('0,5 L ou plus');
  });
  it('la recette source s’écrit à la virgule : « recette 19,75 L », jamais « 19.75 L »', () => {
    mount();
    expect(screen.getByText(/recette 19,75 L/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/19\.75 L/);
  });
});

