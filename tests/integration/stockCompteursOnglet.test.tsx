// Voie sz, critique af0763f4 n° 1 : « Tous · 18 » au-dessus d'une seule carte. Les trois compteurs (Tous, À commander, Épinglés) comptent
// la liste réellement affichée : l'onglet (Ingrédients / Autres stocks) et le rayon touché au mur. Le badge de la barre, lui, reste global.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const art = (ref: string, name: string, category: string, quantity: number, extra: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name, currentStock: quantity, minStock: 5, unit: 'kg', category, reorder: false, kind: 'rawMaterials', ...extra } as StockItem);
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={[]} onOpenQuickAction={() => {}}/>
  </VirtuosoMockContext.Provider>;
}
beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  seedQa({ stockItems: [
    art('pale', 'Malt Pale Ale', 'Malt', 18, { favorite: true }),
    art('pils', 'Malt Pilsner', 'Malt', 2),
    art('cara', 'Caramünch II', 'Malt', 7),
    art('citra', 'Citra', 'Houblon', 1, { favorite: true }),
    art('caps', 'Capsules 26 mm', 'Emballage', 1, { favorite: true })
  ] });
});
afterEach(cleanup);

const radio = (debut: string) => screen.getAllByRole('radio').find(r => (r.getAttribute('aria-label') ?? r.textContent ?? '').startsWith(debut))!;
const comptes = () => `${radio('Tous').textContent} | ${radio('À commander').textContent} | ${radio('Épinglés').textContent}`;

describe('compteurs de la barre de filtre du stock', () => {
  it('Ingrédients : seuls les articles du mur sont comptés (pas les capsules)', async () => {
    render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    expect(comptes()).toBe('Tous · 4 | À commander · 2 | Épinglés · 2');
  });
  it('Autres stocks : un seul article, donc « Tous · 1 », pas le total du stock', async () => {
    render(<Catalogue/>);
    fireEvent.click(await screen.findByRole('tab', { name: 'Autres stocks' }));
    await screen.findByRole('button', { name: 'Ouvrir Capsules 26 mm' });
    expect(comptes()).toBe('Tous · 1 | À commander · 1 | Épinglés · 1');
  });
  it('« À commander · 0 » d\'un onglet ne contredit pas le badge global : la liste vide dit où est la commande', async () => {
    seedQa({ stockItems: [art('pale', 'Malt Pale Ale', 'Malt', 18), art('caps', 'Capsules 26 mm', 'Emballage', 1)] });
    render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    fireEvent.click(radio('À commander'));
    expect(radio('À commander').textContent).toBe('À commander · 0');
    expect(await screen.findByText('Rien à commander')).toBeVisible();
    expect(screen.getByText('1 article à commander ailleurs : changez d’onglet ou de rayon.')).toBeVisible();
  });
  it('un rayon touché au mur :les compteurs suivent la liste (Malts 3, Houblons 1) et reviennent quand on le relâche', async () => {
    const { container } = render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    const rayon = async (nom: string) => waitFor(() => { const b = container.querySelector<HTMLButtonElement>(`.l1e-n[data-filtre="${nom}"]`); expect(b).not.toBeNull(); return b!; });
    fireEvent.click(await rayon('Malts'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ouvrir Citra' })).toBeNull());
    expect(comptes()).toBe('Tous · 3 | À commander · 1 | Épinglés · 1');
    fireEvent.click(await rayon('Malts'));
    fireEvent.click(await rayon('Houblons'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeNull());
    expect(comptes()).toBe('Tous · 1 | À commander · 1 | Épinglés · 1');
    fireEvent.click(await rayon('Houblons'));
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    expect(comptes()).toBe('Tous · 4 | À commander · 2 | Épinglés · 2');
  });
});
