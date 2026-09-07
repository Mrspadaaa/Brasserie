import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null,
  ConfirmSheet: () => null
}));
import { useLiveSelection, useStorageValue, useSyncedDraft, rebaseDraft } from '../../src/hooks/useLiveData';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { CreativeLabTab } from '../../src/components/CreativeLabTab';
import { EditClientModal } from '../../src/components/EditClientModal';
import { EditTransactionModal } from '../../src/components/EditTransactionModal';
import { fullRecipe } from '../fixtures/fullRecipe';

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Live records and unsaved forms', () => {
  it('follows the selected identity, keeps new-record seeds, and hides deleted records', () => {
    const { result, rerender } = renderHook(({ items }) => useLiveSelection(items, 'id'), {
      initialProps: { items: [{ id: 'one', name: 'Ancien' }] }
    });
    act(() => result.current[1]({ id: 'one', name: 'Ancien' }));
    rerender({ items: [{ id: 'one', name: 'Nouveau' }] });
    expect(result.current[0]?.name).toBe('Nouveau');
    rerender({ items: [] });
    expect(result.current[0]).toBeNull();
    act(() => result.current[1]({ id: 'new', name: '' }));
    expect(result.current[0]).toEqual({ id: 'new', name: '' });
    rerender({ items: [{ id: 'new', name: 'Enregistré' }] });
    expect(result.current[0]?.name).toBe('Enregistré');
    rerender({ items: [] });
    expect(result.current[0]).toBeNull();
  });

  it('rebases untouched fields, including nested water values, and releases acknowledged edits', () => {
    const source = { id: 'R', name: 'Avant', water: { diL: 20, salts: 3, acid: 1 }, notes: ['a'] };
    const { result, rerender } = renderHook(({ value }) => useSyncedDraft(value, value.id), { initialProps: { value: source } });
    act(() => result.current[1]({ ...source, water: { ...source.water, acid: 2 }, notes: ['saisie'] }));
    rerender({ value: { ...source, name: 'IA', water: { diL: 10, salts: 4, acid: 1 } } });
    expect(result.current[0]).toEqual({ id: 'R', name: 'IA', water: { diL: 10, salts: 4, acid: 2 }, notes: ['saisie'] });
    // Server acknowledges the user's save. Future AI changes must no longer be held back.
    rerender({ value: { ...result.current[0] } });
    rerender({ value: { ...result.current[0], water: { diL: 5, salts: 5, acid: 3 }, notes: ['serveur'] } });
    expect(result.current[0].water).toEqual({ diL: 5, salts: 5, acid: 3 });
    expect(result.current[0].notes).toEqual(['serveur']);
    rerender({ value: { ...source, id: 'different' } });
    expect(result.current[0]).toEqual({ ...source, id: 'different' });
  });

  it('preserves explicit field removals and accepts new remote fields', () => {
    expect(rebaseDraft({ name: 'a', note: 'old' }, { name: 'local' }, { name: 'remote', note: 'old', supplier: 'new' }))
      .toEqual({ name: 'local', supplier: 'new' });
  });

  it('catches a change between initial render and subscription', () => {
    let value = 'avant';
    vi.spyOn(StorageService, 'subscribe').mockImplementation(() => { value = 'après'; return () => {}; });
    const read = () => value;
    const { result } = renderHook(() => useStorageValue(read));
    expect(result.current).toBe('après');
  });

  it('updates an open batch sheet after a server edit, preserving an in-progress density reading', () => {
    const batch: any = { id: 'B-live', name: 'Avant', style: 'Stout', volumeL: 30, status: 'planifie', brewDate: '07.09.2026' };
    const view = (b: any) => <ProductionTab batches={[b]} recipes={[]} brewhouses={defaultConfig.brewhouses}
      activeBrewhouseId={defaultConfig.activeBrewhouseId} globalTimeFilter="all" targetSubTab="batches"
      onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenBrewDay={vi.fn()} onOpenRecipe={vi.fn()} />;
    const { rerender } = render(view(batch));
    fireEvent.click(screen.getByTitle('Modifier la fiche'));
    const density = document.querySelector('input[name="batch_sheet_og"]')!;
    fireEvent.change(density, { target: { value: '1.054' } });
    rerender(view({ ...batch, name: 'Nom confirmé par IA', volumeL: 24 }));
    expect(screen.getByRole('dialog', { name: 'Nom confirmé par IA' })).toBeInTheDocument();
    expect(density).toHaveValue('1.054');
    const save = vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
    fireEvent.blur(density);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nom confirmé par IA', volumeL: 24, og: '1.054' }));
  });

  it('recalculates the selected recipe in the scaler when its fermentables change', () => {
    const recipe = fullRecipe;
    const view = (r: any) => <ProductionTab batches={[]} recipes={[r]} brewhouses={defaultConfig.brewhouses}
      activeBrewhouseId={defaultConfig.activeBrewhouseId} globalTimeFilter="all" targetSubTab="scaler"
      onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenBrewDay={vi.fn()} onOpenRecipe={vi.fn()} />;
    const { rerender } = render(view(recipe));
    rerender(view({ ...recipe, fermentables: recipe.fermentables.map((f, i) => i === 0 ? { ...f, name: 'Malt substitué par IA' } : f) }));
    expect(screen.getByText('Malt substitué par IA')).toBeInTheDocument();
  });

  it('refreshes the creative lab after a delayed write notification and a later external edit', () => {
    render(<CreativeLabTab />);
    expect(screen.queryByText('Nouvelle idée')).not.toBeInTheDocument();
    act(() => StorageService.addCreativeItem({ id: 'CR-new', type: 'equipment', status: 'idea', title: 'Nouvelle idée' }));
    expect(screen.getByText('Nouvelle idée')).toBeInTheDocument();
    act(() => StorageService.updateCreativeItem({ id: 'CR-new', type: 'equipment', status: 'done', title: 'Idée actualisée' }));
    expect(screen.getByText('Idée actualisée')).toBeInTheDocument();
    expect(screen.queryByText('Nouvelle idée')).not.toBeInTheDocument();
  });

  it('opens and closes a client editor without breaking hooks and keeps local notes through remote updates', () => {
    const client = { id: 'C-live', name: 'Avant', type: 'Pro' as const, contact: '', phone: '', email: '', notes: '' };
    const view = (value: typeof client | null) => <EditClientModal isOpen={!!value} client={value} onClose={vi.fn()} onSave={vi.fn()} />;
    const { rerender } = render(view(null));
    rerender(view(client));
    fireEvent.change(document.querySelector('[name="cl_logistics_memo"]')!, { target: { value: 'Livraison demain' } });
    rerender(view({ ...client, name: 'Actualisé', phone: '0261234567' }));
    expect(document.querySelector('[name="cl_company_label"]')).toHaveValue('Actualisé');
    expect(document.querySelector('[name="cl_contact_tel_digits"]')).toHaveValue('0261234567');
    expect(document.querySelector('[name="cl_logistics_memo"]')).toHaveValue('Livraison demain');
    rerender(view(null));
    rerender(view(client));
    expect(document.querySelector('[name="cl_logistics_memo"]')).toHaveValue('');
  });

  it('updates a transaction amount while preserving its typed description and recalculates the saved total', () => {
    const tx = { id: 'T-live', date: '07.09.2026', description: 'Malt', category: 'brassage' as const,
      subcategory: 'Malt', amountHT: 100, tvaRate: 0.081, tvaAmount: 8.1, amountTTC: 108.1 };
    const view = (value: typeof tx | null) => <EditTransactionModal isOpen={!!value} transaction={value} onClose={vi.fn()} onSave={vi.fn()} />;
    const { rerender } = render(view(null));
    rerender(view(tx));
    fireEvent.change(document.querySelector('[name="tx_edit_label"]')!, { target: { value: 'Malt et livraison' } });
    rerender(view({ ...tx, amountHT: 200, tvaAmount: 16.2, amountTTC: 216.2 }));
    expect(document.querySelector('[name="tx_edit_label"]')).toHaveValue('Malt et livraison');
    expect(screen.getByText('216.20 CHF')).toBeInTheDocument();
    const save = vi.spyOn(StorageService, 'updateTransaction').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ description: 'Malt et livraison', amountHT: 200, amountTTC: 216.2 }));
  });
});
