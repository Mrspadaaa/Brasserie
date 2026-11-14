// Voie cx, ST-T48 (14.11) : la recherche du Stock filtre la liste ET le mur (maquette sy/fA : marques hors recherche pâlies, compte du rayon « N sur M »),
// saisie au fil ou Entrée. « Sirop » doit retrouver « Sirop de candi extra foncé 460ml », la dernière ligne d'une liste de 44.
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
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 4000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={[]} onOpenQuickAction={() => {}}/>
  </VirtuosoMockContext.Provider>;
}
beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  const malts = Array.from({ length: 30 }, (_, k) => art(`m${k}`, `Malt numéro ${k}`, 'Malt', 10 + k, { ebc: 5 + k }));
  seedQa({ stockItems: [
    ...malts,
    art('citra', 'Houblon Citra 12%', 'Houblon', 400, { unit: 'g', alphaAcid: 12 }),
    art('saaz', 'Houblon Saaz 3,5%', 'Houblon', 300, { unit: 'g', alphaAcid: 3.5 }),
    art('sirop', 'Sirop de candi extra foncé 460ml', 'Sucre', 2, { unit: 'pce' }),
  ] });
});
afterEach(cleanup);

const champ = () => screen.getByRole('searchbox', { name: 'Rechercher dans le stock' });
const nombreRayon = (c: HTMLElement, rayon: string) => c.querySelector(`.l1e-n[data-filtre="${rayon}"] span`)?.textContent;

describe('ST-T48 : la recherche filtre la liste et le mur', () => {
  it('« Sirop » : la liste ne garde que le sirop, saisie au fil comme Entrée', async () => {
    render(<Catalogue/>);
    await screen.findByRole('button', { name: 'Ouvrir Malt numéro 3' });
    fireEvent.change(champ(), { target: { value: 'Sirop' } });
    fireEvent.keyDown(champ(), { key: 'Enter', code: 'Enter' });
    expect(await screen.findByRole('button', { name: 'Ouvrir Sirop de candi extra foncé 460ml' })).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Ouvrir Malt numéro 3' })).toBeNull());
    expect(champ()).toHaveValue('Sirop');
    expect(screen.getByRole('status', { name: 'Filtre en cours' })).toHaveTextContent('Recherche « Sirop » : 1 article');
  });

  it('le mur : les marques hors recherche pâlissent, le compte du rayon dit « 1 sur 2 »', async () => {
    const { container } = render(<Catalogue/>);
    await waitFor(() => expect(container.querySelector('.l1e-n[data-filtre="Houblons"]')).not.toBeNull());
    expect(nombreRayon(container, 'Houblons')).toBe('2');
    expect(container.querySelectorAll('.l1-pale')).toHaveLength(0);
    fireEvent.change(champ(), { target: { value: 'citra' } });
    await waitFor(() => expect(nombreRayon(container, 'Houblons')).toBe('1 sur 2'));
    expect(nombreRayon(container, 'Malts')).toMatch(/^[01] sur 31$/); // 30 malts et le sirop de candi (rayon Malts, sucres compris)
    const pales = [...container.querySelectorAll<HTMLElement>('.stock-mur [data-ref].l1-pale')].map((e) => e.dataset.ref);
    expect(pales).toContain('saaz');
    expect(pales).toContain('m3');
    expect(pales).not.toContain('citra');
    fireEvent.click(screen.getByRole('button', { name: 'Tout voir' }));
    await waitFor(() => expect(nombreRayon(container, 'Houblons')).toBe('2'));
    expect(container.querySelectorAll('.l1-pale')).toHaveLength(0);
  });
});
