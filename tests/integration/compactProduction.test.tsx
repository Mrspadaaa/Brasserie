import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { BatchCard } from '../../src/ui/production/CatalogCards';
import { batchEntries } from '../../src/domain/productionCatalog';
import { StorageService } from '../../src/services/storage';
import type { Batch, BrewhouseProfile, Recipe } from '../../src/types';

const brewhouse: BrewhouseProfile = { id: 'qa', name: 'Cuve QA', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3 };
const recipe: Recipe = { id: 'qa', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, fermentables: [{ name: 'Pale', weightKg: 6, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 }], hops: [{ name: 'Citra', weightG: 100, stage: 'boil', timeMin: 15, alpha: 12 }], adjuncts: [{ name: 'Écorce', amount: 30, unit: 'g', step: 'Ébullition' }], yeast: { name: 'US-05', qty: 1, unit: 'sachet' } };
function mount(recipes: Recipe[] = [recipe], brewhouses = [brewhouse]) {
  return render(<ProductionTab recipes={recipes} batches={[]} brewhouses={brewhouses} activeBrewhouseId="qa" globalTimeFilter="all" targetSubTab="scaler" onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()}/>);
}
beforeEach(() => { localStorage.clear(); vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('adaptation compacte de la production', () => {
  it.each([false, true])('retire le scénario lors de l’effacement réel puis reste vide après Tab (coarse=%s)', async coarse => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: coarse && query === '(pointer: coarse)', media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }));
    const user = userEvent.setup();
    mount();
    const field = screen.getByRole('textbox', { name: 'Volume cible' });
    expect(field.tagName).toBe(coarse ? 'TEXTAREA' : 'INPUT');
    await user.clear(field);
    expect(field).toHaveValue('');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await user.tab();
    expect(field).toHaveValue('');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Rétablir 30 L' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter 0,5 L' }));
    expect(screen.getByRole('table', { name: 'Ingrédients pour 30,5 L' })).toBeInTheDocument();
    await user.clear(field);
    expect(field).toHaveValue('');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.tab();
    expect(field).toHaveValue('');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(field).toHaveAccessibleDescription('Indique un volume cible de 0,5 L ou plus.');
    await user.type(field, '12,5');
    expect(screen.getByRole('table', { name: 'Ingrédients pour 12,5 L' })).toBeInTheDocument();
    await user.keyboard('{Control>}a{/Control}{Backspace}');
    expect(field).toHaveValue('');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await user.tab();
    expect(field).toHaveValue('');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('accepte un volume décimal hors des quatre anciens choix et conserve la recette source', () => {
    const original = structuredClone(recipe);
    mount();
    fireEvent.change(screen.getByRole('textbox', { name: 'Volume cible' }), { target: { value: '25,5' } });
    const table = screen.getByRole('table', { name: 'Ingrédients pour 25,5 L' });
    expect(within(table).getByRole('row', { name: /Pale 5,1 kg/ })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: /Citra.*85 g/ })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: /Écorce.*25,5 g/ })).toBeInTheDocument();
    expect(recipe).toEqual(original);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 L' }));
    expect(screen.getByRole('table', { name: 'Ingrédients pour 26 L' })).toBeInTheDocument();
  });
  it.each([false, true])('garde la saisie accessible si le volume est invalide puis recalcule après correction (coarse=%s)', coarse => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: coarse && query === '(pointer: coarse)', media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }));
    mount();
    const field = screen.getByRole('textbox', { name: 'Volume cible' });
    expect(field.tagName).toBe(coarse ? 'TEXTAREA' : 'INPUT');
    fireEvent.change(field, { target: { value: '-2' } });
    expect(screen.getByRole('alert')).toHaveTextContent('0,5 L ou plus');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.change(field, { target: { value: '15' } });
    expect(screen.getByRole('table', { name: 'Ingrédients pour 15 L' })).toBeInTheDocument();
    fireEvent.change(field, { target: { value: 'abc' } });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(/Volume « abc » non reconnu/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Empâtage', { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText(/de la recette$/)).not.toBeInTheDocument();
    fireEvent.keyDown(field, { key: 'Enter', ctrlKey: true });
    fireEvent.blur(field);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Volume « abc » non reconnu');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 L' }));
    expect(field).toHaveValue('15,5');
    expect(field).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('table', { name: 'Ingrédients pour 15,5 L' })).toBeInTheDocument();
    fireEvent.change(field, { target: { value: 'inconnu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir 30 L' }));
    expect(field).toHaveValue('30');
    expect(screen.getByRole('table', { name: 'Ingrédients pour 30 L' })).toBeInTheDocument();
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.blur(field);
    expect(field).toHaveValue('');
    expect(field).toHaveAccessibleDescription('Indique un volume cible de 0,5 L ou plus.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer 0,5 L' }));
    expect(field).toHaveValue('0,5');
    expect(field).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('table')).toBeInTheDocument();
    fireEvent.change(field, { target: { value: '' } });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir 30 L' }));
    expect(field).toHaveValue('30');
    expect(field).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('table', { name: 'Ingrédients pour 30 L' })).toBeInTheDocument();
    fireEvent.change(field, { target: { value: 'inconnu' } });
    fireEvent.change(field, { target: { value: '30,0' } });
    expect(field).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Ingrédients pour 30 L' })).toBeInTheDocument();
  });
  it('permet de changer de source même si une recette a un volume nul et signale une cuverie absente', () => {
    const view = mount([{ ...recipe, id: 'incomplete', volumeL: 0 }, recipe]);
    expect(screen.getByRole('alert')).toHaveTextContent('recette source');
    fireEvent.change(screen.getByRole('combobox', { name: 'Recette source' }), { target: { value: 'qa' } });
    expect(screen.getByRole('table')).toBeInTheDocument();
    view.unmount();
    mount([recipe], []);
    expect(screen.getByRole('alert')).toHaveTextContent('Configure une cuverie');
  });
  it.each([
    ['planifie', undefined, undefined, '30 L visés'],
    ['fermentation', 28, undefined, '28 L en cuve'],
    ['conditionne', 28, 25, '25 L conditionnés'],
    ['conditionne', undefined, undefined, '— L conditionnés'],
    ['annule', undefined, undefined, '30 L visés'],
  ] as const)('affiche le volume pertinent pour un brassin %s', (status, volumeBrewedL, volumePackagedL, expected) => {
    const batch: Batch = { id: 'QA', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, status, volumeBrewedL, volumePackagedL };
    const onOpen = vi.fn();
    render(<BatchCard compact entry={batchEntries([batch])[0]} onOpen={onOpen} onBrew={vi.fn()} onFavorite={vi.fn()} onArchive={vi.fn()}/>);
    expect(screen.getByRole('button', { name: 'Ouvrir le brassin QA' })).toHaveTextContent(expected);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le brassin QA' }));
    expect(onOpen).toHaveBeenCalledWith(batch);
  });
  it.each([null, Number.NaN, Number.POSITIVE_INFINITY])('garde les brassins consultables quand les cibles exportées sont inconnues (%s)', (unknownTarget) => {
    const batches = (['planifie', 'fermentation', 'conditionne'] as const).map(status => ({
      id: status, name: 'Recette importée', style: 'Pale Ale', volumeL: 30, status,
      recipeSnapshot: { ...recipe, ogTarget: 1.046, fgTarget: unknownTarget, abvTarget: unknownTarget },
    } as Batch));
    const onOpen = vi.fn();
    const view = render(<>{batchEntries(batches).map(entry => <BatchCard key={entry.id} entry={entry} onOpen={onOpen} onBrew={vi.fn()} onFavorite={vi.fn()} onArchive={vi.fn()}/>)}</>);
    for (const batch of batches) {
      const card = screen.getByRole('article', { name: `Brassin ${batch.id}, Recette importée` });
      expect(card).toHaveTextContent('—');
      expect(card).not.toHaveTextContent(/NaN|Infinity|∞/);
      fireEvent.click(within(card).getByRole('button', { name: `Ouvrir le brassin ${batch.id}` }));
      expect(onOpen).toHaveBeenCalledWith(batch);
    }
    expect(view.container).toHaveTextContent('Alcool cible— %');
    expect(view.container).toHaveTextContent('FG visée —');
  });
});
