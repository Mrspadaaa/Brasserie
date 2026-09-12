import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StockRow } from '../../src/ui/StockRow';
import { Stepper } from '../../src/components/ui/Stepper';
import { QuantityStepper } from '../../src/ui/QuantityStepper';
import { InventoryCorrectionSheet } from '../../src/ui/InventoryCorrectionSheet';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { Batch, StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
// Cet atelier voisin n'appartient pas au parcours de stock testé.
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const item = (ref: string, name: string, quantity: number, minStock = 5): StockItem => ({ id: ref, ref, name, currentStock: quantity, minStock, unit: 'kg', category: 'Malt', reorder: false });
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={[]} onOpenQuickAction={() => {}}/>
  </VirtuosoMockContext.Provider>;
}
beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  seedQa({ stockItems: [item('pale', 'Malt Pale Ale', 18), item('pils', 'Malt Pilsner', 2), item('cara', 'Caramünch II', 7)].map(row => ({ ...row, kind: 'rawMaterials', favorite: row.ref === 'pale' })) });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('stocks compacts', () => {
  it('place le focus dans la fiche et le rend à l’article après Échap', async () => {
    render(<Catalogue/>);
    const opener = await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    opener.focus(); fireEvent.click(opener);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fermer', exact: true })).toHaveFocus());
    fireEvent.keyDown(screen.getByRole('button', { name: 'Fermer', exact: true }), { key: 'Escape' });
    await waitFor(() => expect(opener).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('combine commande, recherche et favoris avec un vrai groupe radio au clavier', async () => {
    render(<Catalogue/>);
    expect(await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeVisible();
    const order = screen.getByRole('radio', { name: 'À commander · 1' });
    fireEvent.click(order);
    expect(await screen.findByRole('button', { name: 'Ouvrir Malt Pilsner' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeNull();
    fireEvent.keyDown(order, { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'Épinglés · 1' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Épinglés · 1' })).toBeChecked();
    expect(await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer Malt Pale Ale des favoris' }));
    expect(await screen.findByText('Aucun article épinglé')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Voir tous les articles' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Rechercher un article…' }), { target: { value: 'caramunch' } });
    expect(await screen.findByRole('button', { name: 'Ouvrir Caramünch II' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Ouvrir Malt Pilsner' })).toBeNull();
  });

  it('édite un seuil, garde les données techniques et journalise le stock compté', async () => {
    render(<Catalogue/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir Malt Pilsner' }));
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled();
    expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Malt Pilsner' } });
    fireEvent.change(screen.getByLabelText('Seuil minimum (kg)'), { target: { value: '3,5' } });
    fireEvent.click(screen.getByText('Caractéristiques techniques'));
    fireEvent.change(screen.getByLabelText('Couleur (EBC)'), { target: { value: '4,2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    expect(StorageService.getStocks().rawMaterials.find(row => row.ref === 'pils')).toMatchObject({ minStock: 3.5, colorEbc: 4.2, currentStock: 2 });
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir Malt Pilsner' }));
    fireEvent.click(screen.getByRole('button', { name: 'Corriger l’inventaire', exact: true }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Stock réellement compté (kg)' }), { target: { value: '1,5' } });
    fireEvent.change(screen.getByLabelText('Précision (facultatif)'), { target: { value: 'Sac pesé' } });
    expect(screen.getByRole('status')).toHaveTextContent('-500 g');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’écart' }));
    expect(StorageService.getStocks().rawMaterials.find(row => row.ref === 'pils')?.currentStock).toBe(1.5);
    expect(StorageService.getAuditLogs()[0].details).toContain('Sac pesé');
  });

  it('ne transforme ni un seuil en brassins ni un niveau inconnu en jauge pleine', () => {
    const view = render(<StockRow item={item('x', 'Article', 2)} batches={[]} onOpen={() => {}} onToggleFavorite={() => {}}/>);
    expect(screen.getByText('Sous le seuil')).toBeVisible();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Sous le seuil');
    expect(screen.getByRole('button', { name: 'Ouvrir Article' })).toHaveAccessibleDescription('2 kg · Sous le seuil');
    view.rerender(<StockRow item={item('x', 'Article', 2, 0)} batches={[]} onOpen={() => {}} onToggleFavorite={() => {}}/>);
    expect(screen.getByText('Niveau inconnu')).toBeVisible();
    expect(screen.queryByRole('meter')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ouvrir Article' })).toHaveAccessibleDescription('2 kg · Niveau inconnu');
  });

  it('affiche les réserves de fermentation avec leur unité', () => {
    const batch = { id: 'B', status: 'fermentation', stockConsumption: { pendingItems: [{ stockItemRef: 'x', quantity: 500, unit: 'g' }] } } as Batch;
    render(<StockRow item={item('x', 'Citra', 2)} batches={[batch]} onOpen={() => {}} onToggleFavorite={() => {}}/>);
    expect(screen.getByText('500 g réservés en fermentation')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ouvrir Citra' })).toHaveAccessibleDescription('2 kg · Sous le seuil · 500 g réservés en fermentation');
  });

  it('garde une couverture inconnue entre homonymes et attribue seulement la référence explicite', async () => {
    const stocks = { rawMaterials: [item('pils-a', 'Pils', 10, 0), item('pils-b', 'Pils', 20, 0)], cleaning: [], equipment: [], kegs: [] };
    const planned = { id: 'B-PILS', name: 'Pale Ale', status: 'planifie', recipeSnapshot: { fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [] } } as Batch;
    const catalogue = (batch: Batch) => <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
      <StocksTab stocks={stocks} batches={[batch]} onOpenQuickAction={() => {}}/>
    </VirtuosoMockContext.Provider>;
    const view = render(catalogue(planned));
    const unknownRows = await screen.findAllByRole('button', { name: 'Ouvrir Pils' });
    expect(unknownRows).toHaveLength(2);
    expect(unknownRows[0]).toHaveAccessibleDescription('10 kg · Niveau inconnu');
    expect(unknownRows[1]).toHaveAccessibleDescription('20 kg · Niveau inconnu');
    expect(unknownRows[0].getAttribute('aria-describedby')).not.toBe(unknownRows[1].getAttribute('aria-describedby'));
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    const referenced = { ...planned, recipeSnapshot: { ...planned.recipeSnapshot!, fermentables: [{ ...planned.recipeSnapshot!.fermentables[0], stockItemRef: 'pils-a' }] } };
    view.rerender(catalogue(referenced));
    expect(screen.getAllByRole('button', { name: 'Ouvrir Pils' })[0]).toHaveAccessibleDescription('10 kg · 2 brassins d’avance');
    expect(screen.getAllByRole('button', { name: 'Ouvrir Pils' })[1]).toHaveAccessibleDescription('20 kg · Niveau inconnu');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '2 brassins d’avance');
  });

  it('refuse une correction vide au raccourci clavier comme au bouton', () => {
    const confirm = vi.fn();
    render(<InventoryCorrectionSheet open item={item('x', 'Article', 2)} onClose={() => {}} onConfirm={confirm}/>);
    expect(screen.getByRole('button', { name: 'Aucun écart' })).toBeDisabled();
    fireEvent.keyDown(screen.getByLabelText('Stock réellement compté (kg)'), { key: 'Enter', ctrlKey: true });
    expect(confirm).not.toHaveBeenCalled();
  });

  it('incrémente plusieurs fois en appui long sans dépasser la borne ni écrire après fermeture', () => {
    vi.useFakeTimers();
    const changed = vi.fn();
    function Counter() { const [value, setValue] = useState(2); return <Stepper value={value} onChange={next => { setValue(next); changed(next); }} unit="kg" max={5}/>; }
    const view = render(<Counter/>);
    const plus = screen.getByRole('button', { name: 'Ajouter 0,5 kg' });
    fireEvent.pointerDown(plus);
    act(() => vi.advanceTimersByTime(1050));
    expect(changed.mock.calls.length).toBeGreaterThan(1);
    expect(screen.getByLabelText('Quantité en kg')).toHaveValue('5');
    view.unmount();
    const count = changed.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(changed).toHaveBeenCalledTimes(count);
  });

  it('arrête une répétition en cours au démontage du compteur', () => {
    vi.useFakeTimers();
    const changed = vi.fn();
    const view = render(<QuantityStepper value={2} onChange={changed} unit="kg"/>);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Ajouter 0,5 kg' }));
    act(() => vi.advanceTimersByTime(600));
    expect(changed).toHaveBeenLastCalledWith(3);
    view.unmount();
    const count = changed.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(changed).toHaveBeenCalledTimes(count);
  });
});
