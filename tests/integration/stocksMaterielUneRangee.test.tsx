import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));
vi.mock('../../src/ui/carnets/CarnetsVue', () => ({ CarnetsVue: () => <div data-testid="carnets-vue" /> }));

const readStocks = () => StorageService.getStocks();
const readBatches = () => StorageService.getBatches();

function Ecran({ onSub }: { onSub?: (s: string) => void }) {
  const stocks = useStorageValue(readStocks);
  const batches = useStorageValue(readBatches);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={batches} onSubTabChange={onSub} />
  </VirtuosoMockContext.Provider>;
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
  StorageService.clearMemoryCache();
  seedQa({ recipes: [], batches: [], stockItems: [] });
});
afterEach(() => { cleanup(); StorageService.clearMemoryCache(); localStorage.clear(); vi.restoreAllMocks(); });

const ouvrirMateriel = () => { StorageService.setUiState('stocks_subtab', 'materiel'); StorageService.setUiState('stocks_materiel', 'parc'); };

describe('D451 : Stocks › Matériel en une seule rangée', () => {
  it('Matériel : une rangée « Matériel ▾ · Parc · À venir · Carnets · Réalisés », sans les quatre autres sous-onglets en clair', () => {
    ouvrirMateriel();
    render(<Ecran />);
    const segments = screen.getByRole('navigation', { name: 'Vue du matériel' });
    expect(within(segments).getAllByRole('button').map((b) => b.textContent?.replace(/\d+$/, ''))).toEqual(['Parc', 'À venir', 'Carnets', 'Réalisés']);
    const declencheur = screen.getByRole('button', { name: 'Matériel' });
    expect(declencheur).toHaveAttribute('aria-haspopup', 'menu');
    expect(declencheur).toHaveAttribute('aria-expanded', 'false');
    for (const nom of ['Articles', 'Recompter', 'Courses', 'Fûts']) expect(screen.queryByRole('button', { name: nom })).toBeNull();
  });

  it('le menu ▾ rend Articles, Recompter, Courses et Fûts ; chacun s’atteint, puis la rangée de cinq revient, et Matériel se retrouve', () => {
    ouvrirMateriel();
    const vus: string[] = [];
    render(<Ecran onSub={(s) => vus.push(s)} />);
    for (const [nom, sub] of [['Articles', 'stock'], ['Recompter', 'recompter'], ['Courses', 'courses'], ['Fûts', 'futs']] as const) {
      fireEvent.click(screen.getByRole('button', { name: 'Matériel' }));
      const menu = screen.getByRole('menu', { name: 'Autres vues des stocks' });
      expect(within(menu).getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Articles', 'Recompter', 'Courses', 'Fûts']);
      fireEvent.click(within(menu).getByRole('menuitem', { name: nom }));
      expect(vus[vus.length - 1]).toBe(sub);
      expect(StorageService.getUiState('stocks_subtab', 'stock')).toBe(sub);
      // Hors Matériel : la rangée actuelle, inchangée (cinq boutons, pas de menu).
      expect(screen.queryByRole('menu')).toBeNull();
      for (const n of ['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel']) expect(screen.getAllByRole('button', { name: n }).length).toBeGreaterThan(0);
      fireEvent.click(screen.getAllByRole('button', { name: 'Matériel' })[0]);
      expect(screen.getByRole('navigation', { name: 'Vue du matériel' })).toBeInTheDocument();
    }
  });

  it('Échap et un toucher ailleurs ferment le menu ; le segment suit onSubTabChange (Carnets) et Parc revient', () => {
    ouvrirMateriel();
    const vus: string[] = [];
    render(<Ecran onSub={(s) => vus.push(s)} />);
    const declencheur = screen.getByRole('button', { name: 'Matériel' });
    fireEvent.click(declencheur);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(declencheur);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();

    const segments = () => screen.getByRole('navigation', { name: 'Vue du matériel' });
    fireEvent.click(within(segments()).getByRole('button', { name: /^Carnets/ }));
    expect(vus[vus.length - 1]).toBe('carnets');
    expect(StorageService.getUiState('stocks_materiel', 'parc')).toBe('carnets');
    fireEvent.click(within(segments()).getByRole('button', { name: /^Parc/ }));
    expect(vus[vus.length - 1]).toBe('materiel');
  });

  it('« Ouvrir le carnet » (openCarnetRequest) depuis un autre sous-onglet amène à Matériel › Carnets, en une rangée', () => {
    const vus: string[] = [];
    const Demande = () => {
      const stocks = useStorageValue(readStocks);
      const batches = useStorageValue(readBatches);
      return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
        <StocksTab stocks={stocks} batches={batches} onSubTabChange={(s) => vus.push(s)} openCarnetRequest={{ id: 'carnet-x', at: 1 }} />
      </VirtuosoMockContext.Provider>;
    };
    render(<Demande />);
    const segments = screen.getByRole('navigation', { name: 'Vue du matériel' });
    expect(within(segments).getByRole('button', { name: /^Carnets/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: 'Courses' })).toBeNull();
    expect(vus[vus.length - 1]).toBe('carnets');
  });

  it('ailleurs que dans Matériel : la rangée de cinq, sans menu', () => {
    render(<Ecran />);
    for (const n of ['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel']) expect(screen.getAllByRole('button', { name: n }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Vue du matériel' })).toBeNull();
  });
});
