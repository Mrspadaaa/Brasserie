// @vitest-environment jsdom
// BRS-TITRE-INUTILE, LST-TITRE-COMPTEUR, BRS-CARTES-GROSSES (19.11) : « Ça c'est inutile, et les fiche de brassin sont beaucoup trop gros » ;
// « Pareil, inutile ». Le grand titre-compteur en tête des listes (« 2 en cuve / 14 à brasser », « 16 brassins », « 3 à un achat près »,
// « 22 lignées · 23 recettes ») part ; puces et sections restent ; la carte de brassin garde tout son contenu.
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { batchEntries, DEFAULT_CATALOG_FILTERS, type CatalogFilters } from '../../src/domain/productionCatalog';
import { CRITERES_VIDES, type Criteres } from '../../src/ui/production/liste/listeModel';
import { ListeBrassins } from '../../src/ui/production/liste/ListeBrassins';
import { CarnetRecettes } from '../../src/ui/production/recettes/CarnetRecettes';
import type { Batch, Recipe, StockItem } from '../../src/types';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: <T,>(read: () => T) => read() }));
const stockCourant: { items: StockItem[] } = { items: [] };
vi.mock('../../src/services/storage', () => ({
  StorageService: {
    // V-LOT (B1) : la liste lit les ventes pour le reste à vendre.
    getTransactions: () => [],
    getStocks: () => ({ rawMaterials: stockCourant.items, cleaning: [] }),
    getConfig: () => ({ brewhouses: [{ id: 'b', efficiencyPct: 75 }], activeBrewhouseId: 'b' }),
    getUiState: (_k: string, d: unknown) => d,
    setUiState: () => undefined,
    subscribe: () => () => undefined
  }
}));

afterEach(cleanup);

const NOW = new Date(2026, 10, 15, 12).getTime();
const lot = (id: string, extra: Partial<Batch> = {}): Batch =>
  ({
    id,
    name: `ZZ ${id}`,
    style: 'IPA',
    volumeL: 24,
    status: 'fermentation',
    brewDate: '2026-11-10',
    volumeBrewedL: 24,
    recipeSnapshot: { name: `ZZ ${id}`, style: extra.style ?? 'IPA', volumeL: 24, hops: [] },
    ...extra
  }) as Batch;

const lots: Batch[] = [
  lot('LOT-001', { status: 'garde', style: 'Milk Stout', og: '1,060', gravityLog: [{ date: '2026-11-11', sg: 1.01 }] as Batch['gravityLog'] }),
  lot('LOT-002', { status: 'garde', style: 'NEIPA' }),
  lot('LOT-003', { status: 'planifie', plannedBrewDate: '2026-11-20', brewDate: undefined as unknown as string })
];
const entries = batchEntries(lots);

function Liste() {
  const [criteres, setCriteres] = useState<Criteres>(CRITERES_VIDES);
  const [filtres, setFiltres] = useState<CatalogFilters>({ ...DEFAULT_CATALOG_FILTERS });
  return (
    <ListeBrassins entries={entries} filtres={filtres} onFiltres={setFiltres} criteres={criteres} onCriteres={setCriteres}
      appPeriode={{ genre: 'tout' }} now={NOW} onOpenBatch={vi.fn()} onBrew={vi.fn()} onFavorite={vi.fn()} onArchive={vi.fn()} onBilan={vi.fn()} />
  );
}

describe('Brassins : sans titre-compteur (BRS-TITRE-INUTILE, LST-TITRE-COMPTEUR)', () => {
  it('ni « en cuve / à brasser » en titre, ni « N brassins » à droite ; la recherche ouvre la liste', () => {
    const { container } = render(<Liste />);
    expect(container.querySelector('.lst-rep, .lst-h1, .lst-cnt')).toBeNull();
    expect(screen.queryByRole('heading', { name: /en cuve|à brasser/ })).toBeNull();
    expect(screen.queryByText(/^brassins?$/)).toBeNull();
    // la recherche est le premier élément de la liste
    expect(container.querySelector('[data-liste-brassins]')!.firstElementChild!.classList.contains('lst-search')).toBe(true);
  });

  it('les puces restent, avec leurs comptes', () => {
    render(<Liste />);
    const puces = screen.getByRole('group', { name: 'Avancement' });
    expect(within(puces).getByText('Tous')).toBeTruthy();
    expect(within(puces).getByRole('button', { name: 'En cuve' })).toBeTruthy();
    expect(within(puces).getByRole('button', { name: 'À brasser' })).toBeTruthy();
  });
});

describe('Brassins : la carte dense garde tout son contenu (BRS-CARTES-GROSSES)', () => {
  it('état, lot, nom, style, mesure ou « aucun relevé », action, ···, étoile', () => {
    render(<Liste />);
    const carte = (id: string) => screen.getByRole('article', { name: new RegExp(`Brassin ${id},`) });
    for (const id of ['LOT-001', 'LOT-002', 'LOT-003']) {
      const c = carte(id);
      expect(c.querySelector('.lst-pastille')!.textContent!.trim().length, `${id} état`).toBeGreaterThan(0);
      expect(within(c).getByText(id), `${id} lot`).toBeTruthy();
      expect(within(c).getByText(`ZZ ${id}`), `${id} nom`).toBeTruthy();
      expect(c.querySelector('.lst-style'), `${id} style`).not.toBeNull();
      expect(c.querySelector('.lst-reading')!.textContent!.trim().length, `${id} mesure`).toBeGreaterThan(0);
      expect(within(c).getByRole('button', { name: new RegExp(`· ${id}$`) }), `${id} action`).toBeTruthy();
      expect(within(c).getByRole('button', { name: new RegExp(`(Épingler|Retirer) le brassin ${id}`) }), `${id} étoile`).toBeTruthy();
      expect(within(c).getByRole('button', { name: /^Ranger / }), `${id} ···`).toBeTruthy();
    }
    expect(within(carte('LOT-001')).getByText('1,010')).toBeTruthy();
    expect(within(carte('LOT-002')).getByText(/aucun relevé/)).toBeTruthy();
  });

  it('une puce posée : le nombre de résultats se dit en petit sous le tri, jamais en titre', () => {
    render(<Liste />);
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'À brasser' }));
    expect(screen.getByRole('status').textContent).toBe('1 sur 3 brassins');
    expect(screen.getByRole('status').className).toBe('lst-resultat');
  });

  it('deux rangées : nom, style et état ; puis lot, mesure et action sur la même rangée compacte', () => {
    render(<Liste />);
    const c = screen.getByRole('article', { name: /Brassin LOT-001,/ });
    const r1 = c.querySelector('.lst-ouvrir')!;
    expect(r1.querySelector('.lst-nom')!.textContent).toBe('ZZ LOT-001');
    expect(r1.querySelector('.lst-pastille')).not.toBeNull();
    const r2 = c.querySelector('.lst-l3') as HTMLElement;
    expect(within(r2).getByText('LOT-001')).toBeTruthy();
    expect(r2.querySelector('.lst-reading')!.textContent).toBe('1,010');
    expect(r2.querySelector('.lst-go')).not.toBeNull();
    // rien d'autre : la troisième rangée d'avant (pastille et lot seuls au-dessus du nom) n'existe plus
    expect(c.querySelectorAll('.lst-body > *')).toHaveLength(2);
  });
});

describe('Recettes : sans titre-compteur (LST-TITRE-COMPTEUR)', () => {
  const article = (ref: string, name: string, category: string, currentStock: number, unit = 'g'): StockItem =>
    ({ id: ref, ref, name, category, unit, currentStock, minStock: 0, reorder: false }) as StockItem;
  const recette = (id: string, name: string): Recipe =>
    ({
      id, name, style: 'New England IPA', volumeL: 24, ogTarget: 1.062,
      fermentables: [{ name: 'ZZ Pale', stockItemRef: 'ZZ-PALE', weightKg: 5.4 }],
      hops: [{ name: 'ZZ Citra', stockItemRef: 'ZZ-CITRA', weightG: 250, stage: 'dryHop' }],
      yeast: { name: 'ZZ Verdant', stockItemRef: 'ZZ-VERDANT', qty: 1, unit: 'sachet' },
      adjuncts: []
    }) as unknown as Recipe;

  it('ni « N à un achat près » en titre, ni « lignées / recettes » à droite ; la section « À un achat près » reste', () => {
    stockCourant.items = [article('ZZ-PALE', 'ZZ Pale', 'Malt', 25, 'kg'), article('ZZ-CITRA', 'ZZ Citra', 'Houblon', 100), article('ZZ-VERDANT', 'ZZ Verdant', 'Levure', 2, 'sachet')];
    const { container } = render(<CarnetRecettes recipes={[recette('n1', 'ZZ NEIPA')]} batches={[]} onOpenRecipe={vi.fn()} onEditRecipe={vi.fn()} onOpenBatch={vi.fn()} onBrew={vi.fn()} onNewRecipe={vi.fn()} />);
    expect(container.querySelector('.rcp-tete, .rcp-phrase, .rcp-total')).toBeNull();
    expect(screen.queryByText(/^1 à un achat près$/)).toBeNull();
    expect(screen.queryByText(/lignées?/)).toBeNull();
    expect(screen.getByText('À un achat près')).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: 'Chercher une recette' })).toBeTruthy();
  });
});
