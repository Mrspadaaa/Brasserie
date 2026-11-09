// Mission levure-port, voie b-stock (09.11) : TE-38 — Brassins › Volumes garde les accents des noms d'ingrédients, à 30 L comme à 31 L.
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { StorageService } from '../../src/services/storage';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import type { BrewhouseProfile, Recipe } from '../../src/types';

const brewhouse: BrewhouseProfile = { id: 'qa', name: 'Cuve QA', volumeL: 50, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3 };
const recipe: Recipe = {
  id: 'qa', name: 'Milk Stout', style: 'Milk Stout', volumeL: 30,
  fermentables: [
    { name: 'Maris Otter', weightKg: 5.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 },
    { name: 'Röstgerste (orge torréfiée)', weightKg: 0.4, kind: 'grain', use: 'empatage', potentialPpg: 30, colorEbc: 1100 },
    { name: 'Caramünch Typ 2', weightKg: 0.6, kind: 'grain', use: 'empatage', potentialPpg: 33, colorEbc: 120 }
  ],
  hops: [{ name: 'Fuggle', weightG: 60, stage: 'boil', timeMin: 60, alpha: 4.5 }],
  yeast: { name: 'S-04', qty: 1, unit: 'sachet' }
} as Recipe;
const mount = () => render(<ProductionTab recipes={[recipe]} batches={[]} brewhouses={[brewhouse]} activeBrewhouseId="qa" globalTimeFilter="all" targetSubTab="scaler" onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()} />);
beforeEach(() => { localStorage.clear(); vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('TE-38 — les accents des ingrédients survivent à l’adaptation au volume', () => {
  it('« Röstgerste (orge torréfiée) » et « Caramünch Typ 2 » s’écrivent comme dans la recette', () => {
    mount();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Röstgerste (orge torréfiée)')).toBeInTheDocument();
    expect(within(table).getByText('Caramünch Typ 2')).toBeInTheDocument();
    expect(table.textContent).not.toMatch(/Rstgerste|Caramnch/);
  });
});

describe('TE-39 — l’écran dit où l’empâtage est plafonné par la cuve', () => {
  const equipe: BrewhouseProfile = { ...brewhouse, equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences } };
  const gros: Recipe = { ...recipe, fermentables: [{ name: 'Pilsner', weightKg: 12, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 4 }] } as Recipe;
  const monter = (r: Recipe) => render(<ProductionTab recipes={[r]} batches={[]} brewhouses={[equipe]} activeBrewhouseId="qa" globalTimeFilter="all" targetSubTab="scaler" onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()} />);
  it('gros grain : « Empâtage plafonné par la cuve (35 L utiles) » sous les deux volumes d’eau', () => {
    monter(gros);
    expect(screen.getByText(/Empâtage plafonné par la cuve \(35 L utiles\)/)).toBeInTheDocument();
  });
  it('petit grain : aucune mention', () => {
    monter(recipe);
    expect(screen.queryByText(/plafonné par la cuve/)).toBeNull();
  });
});
