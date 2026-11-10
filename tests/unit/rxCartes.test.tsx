// @vitest-environment jsdom
// Voie RX (08.11) : RX-3 (pas de « J+ » sans date de brassage) et RX-5 (seule l'icône d'épingle épingle). Fixtures simulées.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BatchCard, RecipeCard } from '../../src/ui/production/CatalogCards';
import { batchEntries, recipeEntries } from '../../src/domain/productionCatalog';
import type { Batch, Recipe } from '../../src/types';

afterEach(cleanup);

const jour = 24 * 3600 * 1000;
const lot = (p: Partial<Batch>): Batch => ({ id: 'LOT1', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, status: 'fermentation', ...p } as Batch);
const carte = (b: Batch, compact: boolean) =>
  render(<BatchCard compact={compact} entry={batchEntries([b])[0]} onOpen={vi.fn()} onBrew={vi.fn()} onFavorite={vi.fn()} onArchive={vi.fn()} />);

describe('RX-3 — « J+ » demande une date de brassage', () => {
  it.each([false, true])('un brassin en fermentation avec un ensemencement mais sans date de brassage ne dit pas « J+66 » (compact=%s)', (compact) => {
    carte(lot({ brewDate: '', brewDay: { pitchedAt: Date.now() - 66 * jour } as Batch['brewDay'] }), compact);
    expect(screen.getByRole('article').textContent).not.toMatch(/J\+/);
  });
  it.each([false, true])('avec une date de brassage, le jour s’écrit (compact=%s)', (compact) => {
    const d = new Date(Date.now() - 6 * jour);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    carte(lot({ brewDate: iso, plannedBrewDate: iso }), compact);
    expect(screen.getByRole('article').textContent).toMatch(/J\+[56] depuis brassage/);
  });
});

const recette = { id: 'R1', name: 'Écume', style: 'Pale Ale', volumeL: 20, fermentables: [], hops: [], yeast: { name: 'US-05' } } as unknown as Recipe;
describe('RX-5 — le toucher au centre d’une carte recette ouvre, seule l’icône épingle', () => {
  it.each([false, true])('le centre ouvre la recette sans épingler (compact=%s)', (compact) => {
    const onOpen = vi.fn(); const onFavorite = vi.fn();
    render(<RecipeCard compact={compact} entry={recipeEntries([recette], [])[0]} onOpen={onOpen} onEdit={vi.fn()} onHistory={vi.fn()} onFavorite={onFavorite}
      onArchive={vi.fn()} comparing={false} selected={false} disabled={false} onSelect={vi.fn()} />);
    const carteRecette = screen.getByRole('article');
    fireEvent.click(carteRecette);
    fireEvent.click(screen.getByText('Écume'));
    expect(onFavorite).not.toHaveBeenCalled();
    expect(onOpen).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /^Épingler la recette Écume/ }));
    expect(onFavorite).toHaveBeenCalledTimes(1);
  });
});
