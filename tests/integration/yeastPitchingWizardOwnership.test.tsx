import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe, StockItem } from '../../src/types';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

function mount(recipe: Recipe, save = vi.fn(), stockItems: StockItem[] = []) {
  return render(<BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={stockItems} knownStyles={[recipe.style]}
    onSave={save} onClose={vi.fn()} onSaveWaterSource={vi.fn()} onLearnIngredient={vi.fn()} onCreateStockItem={vi.fn()} />);
}

describe('Moût opérationnel et propriétaire documentaire du Wizard', () => {
  it.each(['stock', 'free'] as const)('conserve le même moût mesuré lors du choix %s, sans reprendre produit ni lot de la souche précédente', async mode => {
    const recipe = structuredClone(fullRecipe);
    const wort = { volumeL: 25, sg: 1.048, basis: 'measured' as const, volumeBasis: 'measured' as const, sgBasis: 'measured' as const };
    recipe.yeast = { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 1, unit: 'sachet',
      pitching: { version: 1, wort, product: { id: 'old-product-QA', referenceId: 'fermentis-us05', label: 'Ancien produit exact QA', manufacturer: 'Fermentis', form: 'sèche',
        source: { title: 'Source QA', url: 'https://example.invalid/old-product', checkedAt: '2026-09-27' } }, lot: { productId: 'old-product-QA', lotNumber: 'OLD-QA' } } };
    const item: StockItem = { id: 'stock-new-QA', ref: 'STOCK-NEW-QA', name: 'Nouvelle culture QA', category: 'Levure',
      unit: 'flacon', currentStock: 2, minStock: 0, reorder: false, yeastForm: 'liquide' };
    const save = vi.fn(); mount(recipe, save, [item]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Levure' })[0]);
    await screen.findByRole('region', { name: 'Moût à ensemencer' });
    const source = document.querySelector<HTMLDetailsElement>('.yc-personal-fold')!;
    if (!source.open) fireEvent.click(source.querySelector('summary')!);
    const picker = screen.getByRole('combobox', { name: 'Souche de levure' });
    const name = mode === 'stock' ? item.name : 'Culture libre QA';
    fireEvent.focus(picker); fireEvent.change(picker, { target: { value: name } }); fireEvent.keyDown(picker, { key: 'Enter' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Récapitulatif' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved = save.mock.lastCall?.[0] as Recipe;
    expect(saved.yeast.name).toBe(name);
    expect(saved.yeast.pitching?.wort).toEqual(wort);
    expect(saved.yeast.pitching?.product).toBeUndefined();
    expect(saved.yeast.pitching?.lot).toBeUndefined();
    expect(saved.yeast.stockItemRef).toBe(mode === 'stock' ? item.ref : undefined);
  });

  it.each(['stock', 'free'] as const)('modifie et qualifie au clavier, rouvre puis efface le moût sans remplacer la fiche locale %s', async mode => {
    const recipe = structuredClone(fullRecipe);
    recipe.yeast = { name: 'Culture locale QA', ...(mode === 'stock' ? { stockItemRef: 'LOT-local-QA' } : {}), form: 'liquide',
      localDocumentary: { version: 1, documentary: { form: 'liquide', lab: 'Fabricant QA' } },
      pitching: { version: 1, wort: { volumeL: 40, basis: 'hypothesis', volumeBasis: 'hypothesis' } } };
    const localStock: StockItem = { id: 'lot-local-QA', ref: 'LOT-local-QA', name: 'Culture locale QA', category: 'Levure',
      unit: 'flacon', currentStock: 2, minStock: 0, reorder: false, yeastForm: 'liquide' };
    const save = vi.fn(); const firstView = mount(recipe, save, mode === 'stock' ? [localStock] : []);
    fireEvent.click(screen.getAllByRole('button', { name: 'Levure' })[0]);
    const wort = await screen.findByRole('region', { name: 'Moût à ensemencer' });
    fireEvent.click(within(wort).getByRole('button', { name: 'Corriger' }));
    const volume = within(wort).getByRole('textbox', { name: 'Volume du moût à ensemencer en litres' });
    fireEvent.change(volume, { target: { value: '42' } }); fireEvent.blur(volume);
    const group = within(wort).getByRole('radiogroup', { name: 'Nature du volume' });
    const hypothesis = within(group).getByRole('radio', { name: 'Hypothèse' });
    hypothesis.focus(); fireEvent.keyDown(hypothesis, { key: 'ArrowLeft' });
    expect(within(group).getByRole('radio', { name: 'Mesuré' })).toHaveAttribute('aria-checked', 'true');
    const density = within(wort).getByRole('textbox', { name: 'Densité du moût à ensemencer en SG' });
    fireEvent.change(density, { target: { value: '1.050' } }); fireEvent.blur(density);
    expect(wort).toHaveTextContent('SG 1,050');
    fireEvent.click(screen.getAllByRole('button', { name: 'Récapitulatif' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved = save.mock.lastCall?.[0] as Recipe;
    expect(saved.yeast.pitching?.wort).toMatchObject({ volumeL: 42, volumeBasis: 'measured', sg: 1.05 });
    expect(saved.yeast.localDocumentary).toEqual(recipe.yeast.localDocumentary);
    expect(saved.yeast.technicalFacts).toBeUndefined();
    firstView.unmount();
    const saveCleared = vi.fn(); mount(saved, saveCleared, mode === 'stock' ? [localStock] : []);
    fireEvent.click(screen.getAllByRole('button', { name: 'Levure' })[0]);
    const reopenedWort = await screen.findByRole('region', { name: 'Moût à ensemencer' });
    fireEvent.click(within(reopenedWort).getByRole('button', { name: 'Corriger' }));
    fireEvent.click(within(reopenedWort).getByRole('button', { name: 'Effacer le moût' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Récapitulatif' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(saveCleared.mock.lastCall?.[0].yeast.pitching?.wort).toBeUndefined();
    expect(saveCleared.mock.lastCall?.[0].yeast.localDocumentary).toEqual(recipe.yeast.localDocumentary);
    expect(saveCleared.mock.lastCall?.[0].yeast.technicalFacts).toBeUndefined();
  });
});
