// Vision du 19.11, lot stock (tour 2), de bout en bout dans StocksTab. Fixtures simulées, dates relatives à aujourd'hui.
// APP-ENTETE-COLLE : Stocks défilait dans un conteneur interne (`overflow-y-auto`), l'en-tête de l'app ne partait pas ; il défile
// avec la fenêtre (EntityList `defileFenetre`, tour 3).
// n° 2 : « Rien à commander » en gros alors qu'Étagère dit « manque 24 » (« 24 manquent et il me dit rien à commander ?? ») ;
// n° 3 : « Rien à commander » dit deux fois. La ligne repliée dit le compte de l'horizon et le total, seule.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { Batch, StockItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const iso = (jours: number) => { const d = new Date(); d.setDate(d.getDate() + jours); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const art = (ref: string, name: string, stock: number, min = 0, extra: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name, currentStock: stock, minStock: min, unit: 'kg', category: 'Malt', reorder: false, kind: 'rawMaterials', ...extra } as StockItem);
const brassin = (id: string, nom: string, date: string, lignes: Array<[string, string, number]>): Batch => ({
  id, name: nom, style: 'Saison', volumeL: 20, brewDate: '', plannedBrewDate: date, status: 'planifie', stockAccountingVersion: 1,
  recipeSnapshot: { name: nom, style: 'Saison', volumeL: 20, capturedAt: new Date().toISOString(),
    fermentables: lignes.map(([ref, name, kg]) => ({ name, stockItemRef: ref, weightKg: kg, kind: 'grain', use: 'empatage' })), hops: [], yeast: { name: '' } }
} as unknown as Batch);

// Le prochain brassin est couvert ; ce qui manque vient plus tard (Pilsner, brassin dans 40 jours) ou est au seuil (Gypse, Biscuit épuisé).
const BATCHES = [
  brassin('B1', 'Saison de ferme', iso(3), [['pale', 'Pale Ale', 6]]),
  brassin('B2', 'Pils de Noël', iso(40), [['pils', 'Pilsner', 25]])
];
const readStocks = () => StorageService.getStocks();
function Catalogue({ batches = BATCHES }: { batches?: Batch[] }) {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 2000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={batches}/>
  </VirtuosoMockContext.Provider>;
}
const semer = (manquants: boolean) => seedQa({ stockItems: [
  art('pale', 'Pale Ale', 20, 5), art('pils', 'Pilsner', manquants ? 5 : 30),
  art('gypse', 'Gypse', manquants ? 0.2 : 1, 0.3, { category: 'Additif' }), art('biscuit', 'Biscuit', manquants ? 0 : 2, 1)
] });

beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
afterEach(cleanup);

describe('APP-ENTETE-COLLE : Stocks défile avec la fenêtre', () => {
  it('Articles et Courses : aucun conteneur interne qui défile, aucune hauteur fixée à l’écran', async () => {
    semer(true);
    const { container } = render(<Catalogue/>);
    await screen.findByRole('searchbox', { name: 'Rechercher dans le stock' });
    const ecran = container.querySelector('.stocks-screen')!;
    expect(ecran.className).not.toMatch(/h-\[calc\(100dvh/);
    expect(ecran.querySelectorAll('.overflow-y-auto')).toHaveLength(0);
    fireEvent.click(screen.getByRole('tab', { name: /Recompter/ }));
    expect(ecran.querySelectorAll('.overflow-y-auto')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Courses' }));
    await screen.findByTestId('commande-repliee');
    expect(ecran.querySelectorAll('.overflow-y-auto')).toHaveLength(0);
  });

  it('la liste défile par la fenêtre (option d’EntityList) : plus de relais, plus de zone défilante dans la liste', async () => {
    semer(true);
    const { container } = render(<Catalogue/>);
    await screen.findByRole('searchbox', { name: 'Rechercher dans le stock' });
    expect(screen.queryByTestId('stock-fenetre')).toBeNull();
    const zone = container.querySelector<HTMLElement>('[data-testid="virtuoso-scroller"]');
    expect(zone?.style.overflowY ?? '').not.toBe('auto');
  });
});

describe('n° 2 et 3 : Courses ne dit pas « Rien à commander » quand des articles manquent', () => {
  it('rien avant le prochain brassin, 3 manquent : la ligne repliée le dit, sans contredire Étagère, et une seule fois', async () => {
    semer(true);
    render(<Catalogue/>);
    // Étagère : la pastille « manque ».
    const manque = await screen.findByRole('button', { name: /^manque/ });
    expect(manque).toHaveTextContent('3');
    fireEvent.click(screen.getByRole('button', { name: 'Courses' }));
    // CT4C-1 (tour 4) : plus de « 0 à commander … · 3 manquent », qui se contredisait : le manque d'abord, puis « rien » pour l'horizon.
    const ligne = await screen.findByRole('button', { name: /manquent/, expanded: false });
    expect(ligne).toHaveTextContent(/^3 manquent · rien avant S\d+$/);
    const courses = screen.getByTestId('commande-repliee').parentElement!;
    expect(within(courses).queryByText(/Rien à commander/)).toBeNull();
    // Une seule phrase de compte : « avant S.. » ne revient pas sous la ligne repliée.
    expect(courses.textContent!.match(/à commander/g)).toBeNull();
    expect(courses.textContent!.match(/avant S\d+/g)).toHaveLength(1);
    // Tout voir reste à un toucher, et rend les 3.
    fireEvent.click(within(courses).getByRole('button', { name: 'Tout voir' }));
    expect(await screen.findByText('Pilsner')).toBeVisible();
    expect(screen.getByText('Gypse')).toBeVisible();
    expect(ligne).toHaveTextContent(/^3 manquent$/);
  });

  it('stock couvrant tout : « Rien à commander » une seule fois, puis la raison', async () => {
    semer(false);
    render(<Catalogue/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Courses' }));
    const courses = (await screen.findByTestId('commande-repliee')).parentElement!;
    expect(courses.textContent!.match(/Rien à commander/g)).toHaveLength(1);
    expect(courses).toHaveTextContent(/Le stock couvre les brassins planifiés/);
  });
});
