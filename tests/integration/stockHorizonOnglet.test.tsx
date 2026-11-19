// Pastille C (16.11), de bout en bout dans StocksTab : le chiffre clé suit l'horizon, « Commander ces N » ouvre les courses
// limitées au même horizon, et les sous-onglets n'ont plus de chiffre. Fixtures simulées, dates relatives à aujourd'hui.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import { articlesACommander } from '../../src/domain/stockLevel';
import { vueHorizon } from '../../src/domain/stock/horizon';
import { aujourdhuiLocal } from '../../src/ui/stock/useHorizonStock';
import type { Batch, StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const iso = (jours: number) => { const d = new Date(); d.setDate(d.getDate() + jours); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const art = (ref: string, name: string, stock: number, min = 0, extra: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name, currentStock: stock, minStock: min, unit: 'kg', category: 'Malt', reorder: false, kind: 'rawMaterials', ...extra } as StockItem);
const brassin = (id: string, nom: string, date: string, lignes: Array<[string, string, number]>): Batch => ({
  id, name: nom, style: 'Porter', volumeL: 20, brewDate: '', plannedBrewDate: date, status: 'planifie', stockAccountingVersion: 1,
  recipeSnapshot: { name: nom, style: 'Porter', volumeL: 20, capturedAt: new Date().toISOString(),
    fermentables: lignes.map(([ref, name, kg]) => ({ name, stockItemRef: ref, weightKg: kg, kind: 'grain', use: 'empatage' })), hops: [], yeast: { name: '' } }
} as unknown as Batch);

const BATCHES = [
  brassin('B1', 'Porter', iso(3), [['munich', 'Munich', 6], ['choc', 'Malt chocolat', 1.2]]),
  brassin('B2', 'Pils de Noël', iso(40), [['pils', 'Pilsner', 25]])
];
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={BATCHES} onOpenQuickAction={() => {}}/>
  </VirtuosoMockContext.Provider>;
}
beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  seedQa({ stockItems: [
    art('munich', 'Munich', 2), art('choc', 'Malt chocolat', 0), art('pils', 'Pilsner', 5),
    art('gypse', 'Gypse', 0.2, 0.3), art('pale', 'Pale Ale', 20, 5)
  ] });
});
afterEach(cleanup);

// 19.11 (STK-COMMANDE-REPLIEE) : le bloc vit replié en tête de Courses ; on l'y ouvre d'un toucher.
async function ouvrirBloc() {
  fireEvent.click(await screen.findByRole('button', { name: 'Courses' }));
  fireEvent.click(await screen.findByRole('button', { name: /à commander/, expanded: false }));
  await screen.findByTestId('chiffre-a-commander');
}

describe('chiffre clé, pastille et courses : un seul horizon', () => {
  it('par défaut « avant le prochain brassin » : 2 articles (Munich, Malt chocolat) ; Tout en compte 4, seuil compris', async () => {
    render(<Catalogue/>);
    await ouvrirBloc();
    expect(screen.getByTestId('cac-gros')).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('radio', { name: /Tout/ }));
    expect(screen.getByTestId('cac-gros')).toHaveTextContent('4'); // + Pilsner (brassin dans 40 jours, hors des six semaines) et Gypse (au seuil)
  });

  it('le chiffre et la pastille de l’onglet (la même vue) comptent pareil, à chaque horizon', async () => {
    render(<Catalogue/>);
    await ouvrirBloc();
    const stocks = StorageService.getStocks();
    const vue = vueHorizon(articlesACommander([...stocks.rawMaterials, ...stocks.cleaning], BATCHES, []), BATCHES, aujourdhuiLocal());
    for (const [nom, h] of [[/prochain brassin/, 'brassin'], [/6 sem\./, 'six'], [/Tout/, 'tout']] as const) {
      fireEvent.click(screen.getByRole('radio', { name: nom }));
      expect(screen.getByTestId('cac-gros')).toHaveTextContent(String(vue.comptes[h]));
    }
  });

  it('« Commander ces 2 » replie le bloc sur les courses limitées à l’horizon, qui le disent et offrent Tout voir', async () => {
    render(<Catalogue/>);
    await ouvrirBloc();
    fireEvent.click(screen.getByRole('button', { name: 'Commander ces 2' }));
    expect(screen.queryByTestId('chiffre-a-commander')).toBeNull();
    const bandeau = await screen.findByTestId('courses-horizon');
    // Vision du 19.11, n° 3 : le compte se dit une fois, dans la ligne repliée ; le bandeau ne garde que « Tout voir ».
    expect(screen.getByRole('button', { name: /à commander/, expanded: false })).toHaveTextContent(/^2 à commander avant S\d+ · 4 en tout$/);
    expect(bandeau).toHaveTextContent(/^Tout voir$/);
    expect(screen.getByText('Munich')).toBeVisible();
    expect(screen.queryByText('Gypse')).toBeNull();
    fireEvent.click(within(bandeau).getByRole('button', { name: 'Tout voir' }));
    await waitFor(() => expect(screen.getByText('Gypse')).toBeVisible());
    expect(screen.queryByTestId('courses-horizon')).toBeNull();
  });

  it('les sous-onglets n’ont plus de chiffre ; Articles ne montre plus la carte (elle est repliée dans Courses)', async () => {
    render(<Catalogue/>);
    await screen.findByRole('searchbox', { name: 'Rechercher dans le stock' });
    expect(screen.getByRole('button', { name: 'Courses' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Articles \(\d+\)|Courses \(\d+\)/ })).toBeNull();
    expect(screen.queryByTestId('chiffre-a-commander')).toBeNull();
  });
});
