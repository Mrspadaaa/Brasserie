// Tour 3, lot stock (T2-6a, T2-6b, T2-7). Fixtures simulées, dates relatives à aujourd'hui.
// T2-6a : « Rien à commander » dit une seule fois dans Courses, replié comme déplié.
// T2-6b : Courses dit les mots et le compte d'Étagère : « 22 manquent · 2 au seuil », jamais « 24 en tout ».
// T2-7 : la liste défile par la fenêtre grâce à l'option `defileFenetre` d'EntityList (react-virtuoso `useWindowScroll`), sans relais.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { EntityList } from '../../src/ui/EntityList';
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

// Le prochain brassin est couvert ; Pilsner manque pour un brassin plus tardif.
const BATCHES = [
  brassin('B1', 'Saison de ferme', iso(3), [['pale', 'Pale Ale', 6]]),
  brassin('B2', 'Pils de Noël', iso(40), [['pils', 'Pilsner', 25]])
];
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 2000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={BATCHES}/>
  </VirtuosoMockContext.Provider>;
}
/** `auSeuil` : deux articles dont le stock vaut pile le seuil (retenus par « à commander », classés « bas » par Étagère). */
const semer = (cas: 'couvert' | 'manque' | 'seuil') => seedQa({ stockItems: [
  art('pale', 'Pale Ale', 20, 5), art('pils', 'Pilsner', cas === 'couvert' ? 30 : 5),
  art('gypse', 'Gypse', cas === 'couvert' ? 1 : cas === 'seuil' ? 0.3 : 0.2, 0.3, { category: 'Additif' }),
  art('biscuit', 'Biscuit', cas === 'couvert' ? 2 : cas === 'seuil' ? 1 : 0, 1)
] });

beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
afterEach(cleanup);

describe('T2-6a : « Rien à commander » une seule fois', () => {
  it('replié comme déplié, la phrase ne revient pas (ligne, « 0 rien à commander », encadré)', async () => {
    semer('couvert');
    render(<Catalogue/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Courses' }));
    const courses = (await screen.findByTestId('commande-repliee')).parentElement!;
    expect(courses.textContent!.match(/rien à commander/gi)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /commander/i, expanded: false }));
    expect(screen.getByTestId('chiffre-a-commander')).toBeInTheDocument();
    expect(courses.textContent!.match(/rien à commander/gi)).toHaveLength(1);
  });
});

describe('T2-6b : Courses et Étagère comptent pareil', () => {
  it('2 articles pile au seuil : la pastille « manque N » et Courses disent N, puis « 2 au seuil »', async () => {
    semer('seuil');
    render(<Catalogue/>);
    const manque = await screen.findByRole('button', { name: /^manque/ });
    const n = Number(manque.textContent!.match(/\d+/)![0]);
    expect(n).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Courses' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Tout voir' }));
    const ligne = await screen.findByRole('button', { name: /manque|seuil/, expanded: false });
    expect(ligne.textContent).toBe(`${n} ${n > 1 ? 'manquent' : 'manque'} · 2 au seuil`);
    expect(ligne.textContent).not.toMatch(/en tout/);
  });

  it('aucun article au seuil : seulement « N manquent », jamais « au seuil » ni « en tout »', async () => {
    semer('manque');
    render(<Catalogue/>);
    const manque = await screen.findByRole('button', { name: /^manque/ });
    const n = Number(manque.textContent!.match(/\d+/)![0]);
    fireEvent.click(screen.getByRole('button', { name: 'Courses' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Tout voir' }));
    const ligne = await screen.findByRole('button', { name: /manque/, expanded: false });
    expect(ligne.textContent).toBe(`${n} ${n > 1 ? 'manquent' : 'manque'}`);
  });
});

describe('T2-7 : défilement par la fenêtre, une option d’EntityList', () => {
  const lignes = Array.from({ length: 30 }, (_, i) => ({ id: `l${i}`, nom: `Ligne ${i}` }));
  const monter = (defileFenetre?: boolean) => render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 40 }}>
      <EntityList items={lignes} keyOf={(l) => l.id} renderItem={(l) => <div>{l.nom}</div>} defileFenetre={defileFenetre} />
    </VirtuosoMockContext.Provider>
  );

  it('par défaut, la liste garde sa zone défilante (les autres écrans ne changent pas)', () => {
    const { container } = monter();
    const zone = container.querySelector<HTMLElement>('[data-testid="virtuoso-scroller"]')!;
    expect(zone.style.overflowY).toBe('auto');
    expect(container.querySelector('.flex-1.min-h-0')).not.toBeNull();
  });

  it('avec `defileFenetre`, aucune zone défilante : c’est la fenêtre qui défile', () => {
    const { container } = monter(true);
    const zone = container.querySelector<HTMLElement>('[data-testid="virtuoso-scroller"]');
    expect(zone?.style.overflowY ?? '').not.toBe('auto');
    expect(container.querySelector('.flex-1.min-h-0')).toBeNull();
  });

  it('Stocks n’a plus de relais de la fenêtre', async () => {
    semer('couvert');
    render(<Catalogue/>);
    await screen.findByRole('searchbox', { name: 'Rechercher dans le stock' });
    expect(screen.queryByTestId('stock-fenetre')).toBeNull();
  });
});
