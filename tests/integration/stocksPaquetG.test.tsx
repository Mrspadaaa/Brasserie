// Paquet G, lot C-stocks (19.11), de bout en bout dans StocksTab. Ses mots : « la vue de commande de matériel soit replié, et pas très
// visible, elle apporte peu », puis « Ou mettre cette vue dans les courses... ».
// n° 5 STK-COMMANDE-REPLIEE : Articles ne garde rien du bloc « à commander » ; il vit replié en tête de Courses, un toucher le déplie
// (horizon et histogramme intacts), et l'horizon règle encore la liste de courses (Pastille C).
// n° 6 STK-AUTRES-MORT : en Autres stocks, la liste perd Malts, Houblons, Levures et le tri des ingrédients ; Additifs filtre la liste,
// Fûts et Matériel ouvrent leur sous-onglet ; Ingrédients rend la liste et le tri. Fixtures simulées, dates relatives à aujourd'hui.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { Batch, EquipmentItem, KegItem, StockItem } from '../../src/types';

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
const FUTS = [{ id: 'F-001', capacityL: 20, state: 'plein', beerName: 'Porter' }] as KegItem[];
const PARC = [{ id: 'EQ-1', ref: 'EQ-001', name: 'Réfractomètre', category: 'Mesure', state: 'Bon' }] as EquipmentItem[];
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 2000, itemHeight: 54 }}>
    <StocksTab stocks={{ ...stocks, kegs: FUTS, equipment: PARC }} batches={BATCHES}/>
  </VirtuosoMockContext.Provider>;
}
const sousOnglet = () => document.querySelector('nav button[aria-current="page"]')?.textContent;
const entetes = () => [...document.querySelectorAll('.l1-eh h2')].map((e) => e.textContent ?? '');

beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  seedQa({ stockItems: [
    art('munich', 'Munich', 2), art('choc', 'Malt chocolat', 0), art('pils', 'Pilsner', 5),
    art('gypse', 'Gypse', 0.2, 0.3, { category: 'Additif' }), art('acide', 'Acide lactique', 1, 0, { category: 'Additif', unit: 'L' }),
    art('pale', 'Pale Ale', 20, 5), art('citra', 'Citra', 500, 0, { category: 'Houblon', unit: 'g' }),
    art('caps', 'Capsules 26 mm', 300, 0, { category: 'Emballage', unit: 'pièce' }), art('soude', 'Soude CIP', 3, 1, { category: 'CIP alcalin' })
  ] });
});
afterEach(cleanup);

describe('n° 5 : la vue « à commander » quitte Articles, repliée en tête de Courses', () => {
  it('Articles : ni chiffre « à commander », ni boutons d’horizon, ni histogramme', async () => {
    render(<Catalogue/>);
    await screen.findByRole('tab', { name: 'Autres stocks' });
    expect(screen.queryByTestId('chiffre-a-commander')).toBeNull();
    expect(screen.queryByTestId('commande-repliee')).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: /Horizon/ })).toBeNull();
    expect(screen.queryByTestId('cac-fenetre')).toBeNull();
    expect(screen.queryByText(/à commander/)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Commander ces/ })).toBeNull();
  });

  it('Courses : une ligne repliée « 2 à commander » ; un toucher la déplie, l’horizon y règle la liste de courses', async () => {
    render(<Catalogue/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Courses' }));
    const ligne = await screen.findByRole('button', { name: /^2 à commander/ });
    expect(ligne).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('chiffre-a-commander')).toBeNull();
    expect(screen.queryByTestId('cac-fenetre')).toBeNull();
    // La liste de courses suit l'horizon par défaut (prochain brassin) : Munich, pas Gypse (au seuil).
    expect(screen.getByText('Munich')).toBeVisible();
    expect(screen.queryByText('Gypse')).toBeNull();

    fireEvent.click(ligne);
    expect(ligne).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('chiffre-a-commander')).toBeVisible();
    expect(screen.getByTestId('cac-fenetre')).toBeInTheDocument(); // l'histogramme et sa fenêtre
    const radios = screen.getAllByRole('radio').map((r) => r.textContent ?? '');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toMatch(/prochain brassin/);
    expect(radios[1]).toMatch(/6 sem\./);
    expect(radios[2]).toMatch(/Tout/);

    fireEvent.click(screen.getByRole('radio', { name: /Tout/ }));
    await waitFor(() => expect(screen.getAllByText('Gypse').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: /^4 manquent/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('cac-gros')).toHaveTextContent('4');

    // « Commander ces 4 » replie le bloc : la liste de courses reste sous le doigt.
    fireEvent.click(screen.getByRole('button', { name: 'Commander ces 4' }));
    expect(screen.getByRole('button', { name: /^4 manquent/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('chiffre-a-commander')).toBeNull();
    expect(screen.getByText('Gypse')).toBeVisible();
  });
});

describe('n° 6 : Autres stocks vit', () => {
  it('la liste perd Malts, Houblons, Levures et « Trié par couleur » ; Additifs filtre ; Ingrédients rend tout', async () => {
    const { container } = render(<Catalogue/>);
    await screen.findByText('Munich');
    expect(screen.getAllByRole('button', { name: /Trier Malts : couleur/ })[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Autres stocks' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ouvrir Munich' })).toBeNull());
    expect(screen.queryByRole('button', { name: /Trier Malts : couleur/ })).toBeNull();
    for (const nom of ['Malts', 'Houblons', 'Levures']) expect(entetes().some((t) => t.trim().startsWith(nom))).toBe(false);
    expect(screen.queryByRole('button', { name: 'Ouvrir Citra' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Ouvrir Capsules 26 mm' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ouvrir Soude CIP' })).toBeVisible();

    const additifs = container.querySelector('[data-filtre="Additifs"]') as HTMLElement;
    expect(additifs.tagName).toBe('BUTTON');
    fireEvent.click(additifs);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ouvrir Capsules 26 mm' })).toBeNull());
    expect(additifs).toHaveAttribute('aria-pressed', 'true');
    const lignes = [...container.querySelectorAll('button[aria-label^="Ouvrir "]')].map((b) => b.getAttribute('aria-label'));
    expect(lignes.sort()).toEqual(['Ouvrir Acide lactique', 'Ouvrir Gypse']);
    expect(screen.getByRole('status', { name: 'Filtre en cours' })).toHaveTextContent(/Sels et additifs : 2 articles/);

    // « Tout voir » ôte le filtre : toutes les lignes d'Autres stocks reviennent, jamais les ingrédients.
    fireEvent.click(screen.getByRole('button', { name: 'Tout voir' }));
    await screen.findByRole('button', { name: 'Ouvrir Capsules 26 mm' });
    expect(screen.queryByRole('button', { name: 'Ouvrir Munich' })).toBeNull();

    fireEvent.click(additifs);
    fireEvent.click(screen.getByRole('tab', { name: 'Ingrédients' }));
    await screen.findByRole('button', { name: 'Ouvrir Munich' });
    expect(screen.getAllByRole('button', { name: /Trier Malts : couleur/ })[0]).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Filtre en cours' })).toBeNull();
    expect(entetes().some((t) => t.trim().startsWith('Malts'))).toBe(true);
  });

  it('Fûts et Matériel ouvrent leur sous-onglet', async () => {
    const { container } = render(<Catalogue/>);
    fireEvent.click(await screen.findByRole('tab', { name: 'Autres stocks' }));
    await waitFor(() => expect(container.querySelector('[data-autre="Fûts"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-autre="Fûts"]') as HTMLElement);
    await waitFor(() => expect(sousOnglet()).toBe('Fûts'));

    fireEvent.click(screen.getByRole('button', { name: 'Articles' }));
    fireEvent.click(await screen.findByRole('tab', { name: 'Autres stocks' }));
    await waitFor(() => expect(container.querySelector('[data-autre="Matériel"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-autre="Matériel"]') as HTMLElement);
    await waitFor(() => expect(sousOnglet()).toBe('Matériel'));
    expect(await screen.findByText('Réfractomètre')).toBeInTheDocument();
  });
});
