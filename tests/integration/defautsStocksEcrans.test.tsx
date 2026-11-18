import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Batch, EquipmentItem, Recipe, StockItem } from '../../src/types';

/**
 * Voie d-stocks (2026-11-08-defauts), écrans : ce que le brasseur voit. Le service d'écriture est simulé ; aucune donnée réelle.
 */
vi.mock('../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/storage')>('../../src/services/storage');
  const base: Record<string, unknown> = { updateKeg: vi.fn(), deleteKeg: vi.fn(), getUiState: (_k: string, f: unknown) => f, setUiState: vi.fn(),
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }) };
  // Toute autre lecture rend une liste vide : la fiche ne dépend que de ce qu'on lui passe.
  return { ...actual, StorageService: new Proxy(base, { get: (cible, nom: string) => nom in cible ? cible[nom] : nom.startsWith('get') ? () => [] : undefined }) };
});

const { InventoryCorrectionSheet } = await import('../../src/ui/InventoryCorrectionSheet');
const { StockDetailSheet } = await import('../../src/ui/StockDetailSheet');
const { EquipmentSheet } = await import('../../src/ui/EquipmentSheet');
const { EntityList } = await import('../../src/ui/EntityList');
const { KegBoard } = await import('../../src/ui/KegBoard');

const item = (over: Partial<StockItem> = {}): StockItem => ({
  id: 'RM-1', ref: 'MP-001', name: 'Pilsner Malz', category: 'Malt', unit: 'kg', currentStock: 25, minStock: 5, reorder: false, ...over
});

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('AM-54 — la feuille de correction', () => {
  it('quand le compté dépasse le théorique, casse, perte et don sont éteints et « Inventaire physique » reste choisi', () => {
    const onConfirm = vi.fn();
    render(<InventoryCorrectionSheet open item={item()} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Casse' }));
    const champ = screen.getAllByRole('textbox').concat(screen.queryAllByRole('spinbutton')).find(e => (e as HTMLInputElement).value === '25');
    expect(champ).toBeTruthy();
    fireEvent.change(champ!, { target: { value: '30' } });
    fireEvent.blur(champ!);
    expect(screen.getByRole('radio', { name: 'Casse' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Perte ou péremption' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Don ou dégustation' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Inventaire physique' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer l’écart/ }));
    expect(onConfirm).toHaveBeenCalledWith(30, 'comptage', undefined);
  });
});

describe('AM-55, MV-43, BR-76 — la fiche d’un article', () => {
  const props = { batches: [] as Batch[], onClose: () => {}, onSave: vi.fn(), onDelete: vi.fn(), onCorrectInventory: () => {}, onToggleFavorite: () => {} };
  const recette = { id: 'R1', name: 'Pils maison', style: 'Pilsner', volumeL: 20, fermentables: [{ name: 'Pilsner Malz', weightKg: 4, stockItemRef: 'MP-001' }], hops: [] } as unknown as Recipe;

  it('un article cité par une recette ne se supprime pas, et la fiche dit laquelle', () => {
    render(<StockDetailSheet {...props} item={item()} recipes={[recette]} />);
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeDisabled();
    expect(screen.getByRole('status', { name: '' }) ?? null).toBeTruthy();
    expect(document.querySelector('[data-stock-suppression-bloquee]')).toHaveTextContent(/Pils maison/);
  });
  it('un article libre se supprime', () => {
    render(<StockDetailSheet {...props} item={item()} recipes={[]} />);
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeEnabled();
  });
  it('un seuil de 999 999 kg est refusé avec son motif, Enregistrer est éteint', () => {
    render(<StockDetailSheet {...props} item={item()} recipes={[]} />);
    const seuil = document.getElementById('stock-min') as HTMLInputElement;
    fireEvent.change(seuil, { target: { value: '999999' } });
    fireEvent.blur(seuil);
    expect(screen.getByText(/Seuil trop haut/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  });
  it('AM-56 : la levure périmée le dit dans sa fiche ; sans date, rien n’est inventé', () => {
    const levure = item({ ref: 'LV-1', name: 'US-05', category: 'Levure', unit: 'sachet', currentStock: 3, yeastLot: { expiresOn: '2020-01-01' } });
    const { unmount } = render(<StockDetailSheet {...props} item={levure} recipes={[]} />);
    expect(document.querySelector('[data-stock-durabilite]')).toHaveTextContent(/Périmé depuis/);
    unmount();
    render(<StockDetailSheet {...props} item={{ ...levure, yeastLot: undefined }} recipes={[]} />);
    expect(document.querySelector('[data-stock-durabilite]')).toBeNull();
  });
  it('BR-71 : la virgule suisse dans « Caractéristiques techniques »', () => {
    render(<StockDetailSheet {...props} item={item({ colorEbc: 3.5 })} recipes={[]} />);
    expect(screen.getByText(/3,5 EBC/)).toBeInTheDocument();
    expect(screen.queryByText(/3\.5 EBC/)).toBeNull();
  });
});

describe('TE-46, TE-47, TE-48, BR-94 — la fiche du matériel', () => {
  const achat: EquipmentItem = { id: 'EQ-6c0b6340-dcdb-4e5c-bb04-355931fc1d2e-0', ref: 'EQ-6c0b6340-dcdb-4e5c-bb04-355931fc1d2e-0', name: 'Cuve de fermentation', category: 'Fermentation', state: 'Bon', purchaseDate: '2025-02-01', purchasePrice: 1800 };
  it('la référence interne n’est pas montrée, la date d’achat ISO remplit son champ', () => {
    render(<EquipmentSheet item={achat} onClose={() => {}} onSave={() => {}} onDelete={() => {}} />);
    expect(screen.queryByText(/EQ-6c0b6340/)).toBeNull();
    expect(screen.getByText(/01\.02\.2025/)).toBeInTheDocument();
    expect((document.querySelector('input[type="date"]') as HTMLInputElement).value).toBe('2025-02-01');
  });
  it('« Matériel déjà possédé » s’ouvre sans reproche, et un prix négatif est refusé', () => {
    const onSave = vi.fn();
    render(<EquipmentSheet item={{ id: 'EQ-x', ref: 'EQ-012', name: '', category: 'Brassage', state: 'Neuf' }} onClose={() => {}} onSave={onSave} onDelete={() => {}} />);
    expect(screen.queryByText(/au moins 2 caractères/)).toBeNull();
    fireEvent.change(document.getElementById('eq-name')!, { target: { value: 'Pompe' } });
    fireEvent.click(screen.getByText(/Achat/));
    const prix = document.getElementById('eq-price') as HTMLInputElement;
    fireEvent.change(prix, { target: { value: '-1' } });
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(screen.getByText(/ne peut pas être négatif/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('BR-69, BR-70, BR-74 — la liste', () => {
  type Ligne = { ref: string; name: string; favorite: boolean };
  const lignes = (fav: string[]): Ligne[] => ['A', 'B', 'C'].map(n => ({ ref: n, name: `Article ${n}`, favorite: fav.includes(n) }));
  const rendu = (rows: Ligne[], extra: Record<string, unknown> = {}) => <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 40 }}>
    <EntityList items={rows} keyOf={r => r.ref} isFavorite={r => r.favorite} searchKeys={['name']} renderItem={r => <span data-row={r.ref} data-fav={r.favorite}>{r.name}</span>} {...extra} />
  </VirtuosoMockContext.Provider>;
  const ordre = () => [...document.querySelectorAll('[data-row]')].map(e => e.getAttribute('data-row')).join('');

  it('épingler change l’étoile tout de suite, mais la ligne ne bouge qu’après une pause', () => {
    vi.useFakeTimers();
    const vue = render(rendu(lignes([])));
    expect(ordre()).toBe('ABC');
    vue.rerender(rendu(lignes(['C'])));
    expect(document.querySelector('[data-row="C"]')).toHaveAttribute('data-fav', 'true');
    expect(ordre()).toBe('ABC'); // pas de saut sous le doigt : un second appui retombe sur la même ligne
    act(() => { vi.advanceTimersByTime(1300); });
    expect(ordre()).toBe('CAB');
  });
  it('un mot de 90 lettres sans résultat ne déborde pas', () => {
    render(rendu(lignes([])));
    fireEvent.change(screen.getByLabelText('Rechercher…'), { target: { value: 'X'.repeat(90) } });
    const message = screen.getByText(/Rien ne correspond/);
    expect(message.className).toMatch(/break-words/);
    expect(message.className).toMatch(/overflow-wrap:anywhere/);
  });
});

describe('TE-45 — créer un fût', () => {
  it('le bouton fourni s’affiche dans la barre de la liste, même sans fût', () => {
    render(<VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 60 }}>
      <KegBoard kegs={[]} batches={[]} toolbarAction={<button type="button">Ajouter un fût</button>} />
    </VirtuosoMockContext.Provider>);
    expect(screen.getByRole('button', { name: 'Ajouter un fût' })).toBeInTheDocument();
    expect(screen.getByText(/Ajoute un fût avec le bouton/)).toBeInTheDocument();
  });
  // VI-10 (rejeu b47cd90b n° 10) : à 390 le bouton n'est qu'un « + » sans libellé (« Ajouter un fût » n'apparaît qu'à partir de sm) : la phrase ne doit citer
  // que ce qui est à l'écran aux deux largeurs, le « + ».
  it('la phrase du vide cite le « + », présent à toutes les largeurs, pas le libellé caché au téléphone', () => {
    render(<VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 60 }}>
      <KegBoard kegs={[]} batches={[]} toolbarAction={<button type="button" aria-label="Ajouter un fût"><span aria-hidden="true">+</span><span className="hidden sm:inline">Ajouter un fût</span></button>} />
    </VirtuosoMockContext.Provider>);
    const phrase = screen.getByText(/Ajoute un fût avec le bouton/).textContent ?? '';
    expect(phrase).toContain('« + »');
    expect(phrase).not.toContain('« Ajouter un fût »');
  });
});
void within;
