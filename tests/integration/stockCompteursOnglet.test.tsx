// Part z, choix 2, 3, 4, 5 et 7 (maquette sy/fA) : les pastilles d'état comptent TOUT le stock et ne bougent pas avec le filtre ;
// un seul filtre à la fois, re-toucher l'ôte ; la ligne « Filtre … : N articles · Tout voir » ; la bascule Étagère | Recompter garde
// recherche et filtre ; un comptage de Recompter écrit un mouvement « comptage » ; Autres stocks : le sucre une fois, l'Emballage présent.
// (Remplace les radios « Tous · N / À commander · N / Épinglés · N » de la barre d'avant, c26.)
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    art('sucre', 'Sucre candi', 'Sucre', 3),
    art('citra', 'Citra', 'Houblon', 1, { favorite: true }),
    art('caps', 'Capsules 26 mm', 'Emballage', 350, { unit: 'pce', minStock: 100 })
  ] });
});
afterEach(cleanup);

const pastille = (mot: string) => screen.getAllByRole('button').find(b => b.hasAttribute('data-f') && (b.textContent ?? '').startsWith(mot))!;
const compte = (mot: string) => pastille(mot).querySelector('b')!.textContent;

describe('filtres du stock (pastilles, ligne de filtre, Recompter)', () => {
  it('les pastilles comptent tout le stock et ne bougent pas quand on filtre ; une seule active à la fois, re-toucher l\'ôte', async () => {
    render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    const avant = ['manque', 'bas', 'épuisés', 'à compter', 'DDM'].map(compte);
    fireEvent.click(pastille('manque'));
    expect(pastille('manque')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(pastille('bas'));
    expect(pastille('bas')).toHaveAttribute('aria-pressed', 'true');
    expect(pastille('manque')).toHaveAttribute('aria-pressed', 'false');
    expect(['manque', 'bas', 'épuisés', 'à compter', 'DDM'].map(compte)).toEqual(avant);
    fireEvent.click(pastille('bas'));
    expect(pastille('bas')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('Tout voir')).toBeNull();
  });

  it('la pastille « bas » ne garde que les articles au seuil ou dessous, et la ligne de filtre dit « Filtre bas : N articles · Tout voir »', async () => {
    render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    fireEvent.click(pastille('bas'));
    const ligne = await screen.findByRole('status', { name: 'Filtre en cours' });
    expect(ligne).toHaveTextContent(/^Filtre bas : \d+ articles?/);
    expect(screen.queryByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeNull();
    fireEvent.click(within(ligne).getByRole('button', { name: 'Tout voir' }));
    expect(await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Tout voir' })).toBeNull();
  });

  it('la pastille « ★ épinglés » n\'apparaît que s\'il y a des épinglés, et filtre', async () => {
    render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    expect(compte('★ épinglés')).toBe('2');
    fireEvent.click(pastille('★ épinglés'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ouvrir Malt Pilsner' })).toBeNull());
    expect(screen.getByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeVisible();
    expect(screen.getByRole('status', { name: 'Filtre en cours' })).toHaveTextContent('Filtre épinglés : 2 articles');
  });

  it('la recherche compte à partir de 2 lettres, se dit dans la ligne de filtre, et « Tout voir » efface filtre ET recherche', async () => {
    render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    const champ = screen.getByRole('searchbox', { name: 'Rechercher dans le stock' });
    expect(champ).not.toHaveAttribute('type', 'number');
    fireEvent.change(champ, { target: { value: 'c' } });
    expect(screen.queryByRole('status', { name: 'Filtre en cours' })).toBeNull();
    fireEvent.change(champ, { target: { value: 'caramunch' } });
    expect(await screen.findByRole('button', { name: 'Ouvrir Caramünch II' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Ouvrir Malt Pilsner' })).toBeNull();
    expect(screen.getByRole('status', { name: 'Filtre en cours' })).toHaveTextContent('Recherche « caramunch » : 1 article');
    fireEvent.click(screen.getByRole('button', { name: 'Tout voir' }));
    expect(await screen.findByRole('button', { name: 'Ouvrir Malt Pilsner' })).toBeVisible();
    expect(champ).toHaveValue('');
  });

  it('un rayon touché au mur remplace le filtre ; la liste montre les six familles, sucre dans Malts', async () => {
    const { container } = render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    fireEvent.click(pastille('bas'));
    const rayon = await waitFor(() => { const b = container.querySelector<HTMLButtonElement>('.l1e-n[data-filtre="Houblons"]'); expect(b).not.toBeNull(); return b!; });
    fireEvent.click(rayon);
    expect(pastille('bas')).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeNull());
    expect(screen.getByRole('button', { name: 'Ouvrir Citra' })).toBeVisible();
    expect(screen.getByRole('status', { name: 'Filtre en cours' })).toHaveTextContent('Filtre Houblons : 1 article');
    fireEvent.click(screen.getByRole('button', { name: 'Tout voir' }));
    expect(await screen.findByRole('button', { name: 'Ouvrir Sucre candi' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ouvrir Capsules 26 mm' })).toBeVisible();
  });

  it('Recompter garde la recherche et le filtre de l\'étagère ; ses tuiles sont des filtres', async () => {
    render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans le stock' }), { target: { value: 'malt' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Recompter' }));
    const vue = await screen.findByTestId('recompter');
    expect(screen.getByRole('searchbox', { name: 'Rechercher dans le stock' })).toHaveValue('malt');
    expect(within(vue).getByText('Malt Pale Ale')).toBeVisible();
    expect(within(vue).queryByText('Citra')).toBeNull();
    expect(within(vue).getAllByRole('button', { name: /Trier .* : nom/ }).length).toBeGreaterThan(0);
    fireEvent.click(within(vue).getByRole('button', { name: /^Houblons/ }));
    fireEvent.click(screen.getByRole('tab', { name: 'Étagère' }));
    expect(screen.getByRole('status', { name: 'Filtre en cours' })).toHaveTextContent('Filtre Houblons et recherche « malt »');
  });

  // F2 (D396, 21.11) : un champ laissé vide = « comme prévu » (la quantité connue) ; le bouton du pied devient « Compter le reste du rayon comme prévu : N articles » ;
  // chaque ligne du rayon devient un comptage daté. Remplace « un champ vide n'écrit rien » (Enregistrer 1 comptage).
  it('un comptage de Recompter met le stock à la quantité lue (virgule ou point), écrit un mouvement « comptage » ; un champ vide vaut « comme prévu » (stock inchangé)', async () => {
    render(<Catalogue/>);
    fireEvent.click(await screen.findByRole('tab', { name: 'Recompter' }));
    const vue = await screen.findByTestId('recompter');
    const rayon = within(vue).getByRole('region', { name: 'Malts' });
    fireEvent.click(within(rayon).getByRole('button', { name: 'Compter' }));
    fireEvent.change(within(rayon).getByLabelText('Il en reste, Malt Pilsner'), { target: { value: '1,5' } });
    fireEvent.click(within(rayon).getByRole('button', { name: /^Compter le reste du rayon comme prévu : \d+ articles?$/ }));
    await waitFor(() => expect(StorageService.getStocks().rawMaterials.find(r => r.ref === 'pils')?.currentStock).toBe(1.5));
    expect(StorageService.getStocks().rawMaterials.find(r => r.ref === 'pale')?.currentStock).toBe(18);
    const mv = StorageService.getStockMovements().filter((m: any) => m.reasonCode === 'comptage');
    expect(mv.find((m: any) => m.stockItemRef === 'pils')).toMatchObject({ newStock: 1.5, delta: -0.5 });
    expect(mv.filter((m: any) => m.delta !== 0)).toHaveLength(1); // seul l'écart tapé bouge le stock ; le reste du rayon est « comme prévu »
    expect(await within(vue).findByRole('button', { name: /^Malts : 4 articles, \d compt/ })).toBeVisible();
  });

  it('Autres stocks : le sucre est rangé une fois (dans Malts), l\'Emballage est présent', async () => {
    const { container } = render(<Catalogue/>);
    fireEvent.click(await screen.findByRole('tab', { name: 'Autres stocks' }));
    await waitFor(() => expect(container.querySelector('[data-autre="Emballage"]')).not.toBeNull());
    // L'Emballage est une carte (1 article) ; le sucre n'est pas compté une seconde fois en « Additifs » : sa carte n'existe pas.
    expect(container.querySelector('[data-autre="Emballage"]')).toHaveTextContent('Emballage 1');
    expect(container.querySelector('[data-autre="Additifs"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ouvrir Capsules 26 mm' })).toBeVisible();
  });
});
