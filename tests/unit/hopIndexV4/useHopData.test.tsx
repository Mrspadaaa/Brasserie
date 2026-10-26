// @vitest-environment jsdom
// Voie t8-donnees (#169) : useHopData lit le stock, la dégustation et le catalogue du moteur, et crée le moteur dans le chunk
// des outils. Un snapshot identique (mêmes données, tableaux neufs) ne change ni le stock, ni le moteur, ni la dégustation,
// et ne crée aucun contexte ; un article changé donne un moteur neuf. Stockage simulé (aucune donnée réelle).
import fs from 'node:fs';
import path from 'node:path';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const etat = vi.hoisted(() => ({
  articles: [] as unknown[], brassins: [] as unknown[], degustations: [] as unknown[], abonnes: new Set<() => void>(),
}));
vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: (f: () => void) => { etat.abonnes.add(f); return () => etat.abonnes.delete(f); },
    // Chaque lecture rend des tableaux NEUFS, comme un snapshot Firestore.
    getStocks: () => ({ rawMaterials: JSON.parse(JSON.stringify(etat.articles)), cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => JSON.parse(JSON.stringify(etat.brassins)),
    getHopTastings: () => JSON.parse(JSON.stringify(etat.degustations)),
  },
}));

import { useHopData } from '../../../src/ui/hopIndex/useHopData';
import { oublierOutils } from '../../../src/ui/hopIndex/chargement';
import { oublierContextes, statistiquesMoteur } from '../../../src/domain/hopIndex/v4/moteur';

const production = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../fixtures/production/houblons-2026-10-17.json'), 'utf8')) as { stockItems: Record<string, unknown>[] };
const snapshot = () => act(() => { etat.abonnes.forEach((f) => f()); });

beforeEach(() => {
  oublierOutils(); oublierContextes();
  etat.articles = production.stockItems.map((s) => ({ ...s, category: 'Houblon' }))
    .concat([{ name: 'Pale Ale Malt', category: 'Malt', currentStock: 25, unit: 'kg' }, { name: 'Houblon Zythos Imaginaire 9.9%', category: 'Houblon', currentStock: 40, unit: 'g' }]);
  etat.brassins = [{ id: 'LOT-7', recipeRef: 'R1', brewDate: '2026-10-01' }];
  etat.degustations = [{
    id: 't1', name: 'Stout du 12', date: '2026-10-12', origin: 'batch', batchId: 'LOT-7', notes: 'trop résineuse',
    axes: [{ axis: { id: 'resin', scale: { min: 0, max: 100 }, lowMax: 33, mediumMax: 66 }, perceived: { min: 70, max: 95 } }],
  }];
});
afterEach(() => { cleanup(); etat.abonnes.clear(); });

describe('useHopData', () => {
  it('lit le stock « Houblon » (pas les malts), le relie au moteur, liste l\'inconnu et rend la dégustation de la recette', async () => {
    const { result } = renderHook(() => useHopData({ id: 'R1' }));
    await waitFor(() => expect(result.current.moteur).not.toBeNull());
    const d = result.current;
    expect(d.catalogue!.length).toBe(317);                               // le catalogue du moteur, pas fusionné
    expect(d.stock).toHaveLength(16);
    expect(d.nonRelies).toEqual([expect.objectContaining({ cle: 'inconnu:Houblon Zythos Imaginaire 9.9%', grams: 40 })]);
    expect(d.stock.some((s) => s.items.includes('Pale Ale Malt'))).toBe(false);
    expect(d.degustation?.axes.find((a) => a.family === 'resin')?.perceived).toBe('marqué');
    expect(d.degustation?.axes.find((a) => a.family === 'floral')?.perceived).toBeNull();
    expect(d.degustation?.batch).toEqual({ id: 'LOT-7', date: '2026-10-01' });
    expect(d.moteur!.empreinte).toBe(d.empreinte);
    expect(d.moteur!.stock).toBe(d.stock);
  });
  it('sans recette : stock et catalogue, aucune dégustation inventée', async () => {
    const { result } = renderHook(() => useHopData(null));
    await waitFor(() => expect(result.current.moteur).not.toBeNull());
    expect(result.current.degustation).toBeNull();
    expect(result.current.stock).toHaveLength(16);
  });

  it('un snapshot identique ne change rien : mêmes stock, moteur, dégustation ; aucun contexte créé', async () => {
    const { result } = renderHook(() => useHopData({ id: 'R1' }));
    await waitFor(() => expect(result.current.moteur).not.toBeNull());
    const avant = result.current, crees = statistiquesMoteur().crees;
    for (let i = 0; i < 5; i++) snapshot();
    expect(result.current.stock).toBe(avant.stock);
    expect(result.current.moteur).toBe(avant.moteur);
    expect(result.current.degustation).toBe(avant.degustation);
    expect(result.current.nonRelies).toBe(avant.nonRelies);
    expect(statistiquesMoteur().crees).toBe(crees);
  });
  it('un champ sans effet sur le moteur (fournisseur, prix, seuil) ne relance rien non plus', async () => {
    const { result } = renderHook(() => useHopData({ id: 'R1' }));
    await waitFor(() => expect(result.current.moteur).not.toBeNull());
    const avant = result.current;
    etat.articles = etat.articles.map((a) => ({ ...(a as object), supplier: 'Autre', pricePerUnit: 9.99, minStock: 1, reorder: true }));
    snapshot();
    expect(result.current.moteur).toBe(avant.moteur);
    expect(result.current.stock).toBe(avant.stock);
  });
  it('l\'ordre des articles dans le snapshot ne crée pas de contexte neuf', async () => {
    const { result } = renderHook(() => useHopData({ id: 'R1' }));
    await waitFor(() => expect(result.current.moteur).not.toBeNull());
    const crees = statistiquesMoteur().crees;
    etat.articles = [...etat.articles].reverse();
    snapshot();
    expect(statistiquesMoteur().crees).toBe(crees);
  });

  it('un article changé donne un moteur neuf, aux données neuves', async () => {
    const { result } = renderHook(() => useHopData({ id: 'R1' }));
    await waitFor(() => expect(result.current.moteur).not.toBeNull());
    const avant = result.current, crees = statistiquesMoteur().crees;
    etat.articles = etat.articles.map((a) => ((a as { name: string }).name === 'Cascade' ? { ...(a as object), currentStock: 10 } : a));
    snapshot();
    await waitFor(() => expect(result.current.moteur).not.toBe(avant.moteur));
    expect(result.current.empreinte).not.toBe(avant.empreinte);
    expect(result.current.stock.find((s) => s.key === 'beermaverick-cascade')!.grams).toBe(10);
    expect(statistiquesMoteur().crees).toBe(crees + 1);
  });
  it('une dégustation changée donne une dégustation neuve sans toucher au moteur', async () => {
    const { result } = renderHook(() => useHopData({ id: 'R1' }));
    await waitFor(() => expect(result.current.moteur).not.toBeNull());
    const avant = result.current;
    etat.degustations = [{ ...(etat.degustations[0] as object), axes: [{ axis: { id: 'resin', scale: { min: 0, max: 100 }, lowMax: 33, mediumMax: 66 }, perceived: { min: 40, max: 60 } }] }];
    snapshot();
    await waitFor(() => expect(result.current.degustation).not.toBe(avant.degustation));
    expect(result.current.degustation?.axes.find((a) => a.family === 'resin')?.perceived).toBe('moyen');
    expect(result.current.moteur).toBe(avant.moteur);
  });
});
