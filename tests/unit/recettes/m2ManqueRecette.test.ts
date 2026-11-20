import { describe, expect, it } from 'vitest';
import { besoinsDe, lignees } from '../../../src/ui/production/recettes/recettesModel';
import type { Batch, Recipe, StockItem } from '../../../src/types';
import type { CatalogEntry } from '../../../src/domain/productionCatalog';

/**
 * Point 37 (test en ligne, 16.11) : « il manque Pilsner Malz 49 kg » alors que la recette en demande 5.
 * Cause : le manque affiché sur la recette reprenait le chiffre de « À commander » (besoin de la recette + prévu ailleurs − stock),
 * qui peut dépasser ce que CETTE recette demande. Sur la recette : manque = max(0, besoin − disponible), jamais au-delà du besoin.
 */
const pilsner = (over: Partial<StockItem> = {}): StockItem => ({
  id: 'MALT-1', ref: 'MALT-1', name: 'Pilsner Malz', category: 'Malt', unit: 'kg', currentStock: 0, minStock: 0, reorder: false, ...over
} as StockItem);

const recette = (kg = 5, nom = 'Pilsner Malz', over: Partial<Recipe> = {}): Recipe => ({
  id: 'REC-ZZTEST1', name: 'ZZ TEST — Pils', style: 'Pilsner', volumeL: 20,
  fermentables: [{ name: nom, stockItemRef: nom === 'Pilsner Malz' ? 'MALT-1' : undefined, weightKg: kg, kind: 'grain', use: 'empatage' }],
  hops: [], yeast: { name: '' }, ...over
} as unknown as Recipe);

const planifie = (id: string, kg: number): Batch => ({
  id, name: `Brassin ${id}`, style: 'Pale Ale', volumeL: 20, brewDate: '', plannedBrewDate: '2026-11-20', status: 'planifie', stockAccountingVersion: 1,
  recipeRef: `REC-${id}`,
  recipeSnapshot: { name: id, style: 'Pale Ale', volumeL: 20, capturedAt: '2026-11-01T10:00:00.000Z',
    fermentables: [{ name: 'Pilsner Malz', stockItemRef: 'MALT-1', weightKg: kg, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '' } }
} as unknown as Batch);

const ligne = (r: Recipe, stock: StockItem[], batches: Batch[] = []) => besoinsDe(r, batches, stock)[0];

describe('point 37 — le manque d’une recette ne dépasse jamais ce qu’elle demande', () => {
  it('stock à 0 : il manque les 5 kg demandés', () => {
    const l = ligne(recette(), [pilsner()]);
    expect(l.etat).toBe('manque');
    expect(l.manque).toBe('Pilsner Malz 5 kg');
  });

  it('stock à 0 et 44 kg déjà prévus dans d’autres brassins : il manque 5 kg, pas 49', () => {
    const l = ligne(recette(), [pilsner()], [planifie('B-1', 30), planifie('B-2', 14)]);
    expect(l.etat).toBe('manque');
    expect(l.manque).toBe('Pilsner Malz 5 kg');
    expect(l.droite).toBe('manque 5 kg');
  });

  it('stock 10 kg, 8 kg prévus ailleurs : 2 kg libres, il manque 3 kg sur les 5', () => {
    const l = ligne(recette(), [pilsner({ currentStock: 10 })], [planifie('B-1', 8)]);
    expect(l.manque).toBe('Pilsner Malz 3 kg');
  });

  it('stock 10 kg, 3 kg prévus ailleurs : les 5 kg sont couverts', () => {
    const l = ligne(recette(), [pilsner({ currentStock: 10 })], [planifie('B-1', 3)]);
    expect(l.etat).toBe('ok');
  });

  it('stock négatif : le manque n’est pas gonflé, l’article est à vérifier et le dit', () => {
    const l = ligne(recette(), [pilsner({ currentStock: -44 })]);
    expect(l.etat).toBe('inconnu');
    expect(l.manque).toBeUndefined();
    expect(l.droite).toBe('stock négatif : à corriger');
  });

  it('stock en grammes : 3 000 g pour 5 kg demandés, il manque 2 kg (même unité)', () => {
    const l = ligne(recette(), [pilsner({ unit: 'g', currentStock: 3000 })]);
    expect(l.manque).toBe('Pilsner Malz 2 kg');
  });

  it('stock en grammes à 0 : il manque 5 kg, jamais plus', () => {
    const l = ligne(recette(), [pilsner({ unit: 'g', currentStock: 0 })], [planifie('B-1', 44)]);
    expect(l.manque).toBe('Pilsner Malz 5 kg');
  });

  it('stock en sacs : un sac n’est pas convertible en kg, on ne devine pas (à vérifier, jamais un manque inventé)', () => {
    const l = ligne(recette(), [pilsner({ unit: 'sac', currentStock: 2 })]);
    expect(l.etat).not.toBe('manque');
  });

  it('nom proche : « Pilsner » ne prend pas l’article « Pilsner Malz », et inversement', () => {
    const proche = recette(5, 'Pilsner');
    const l = ligne(proche, [pilsner()]);
    expect(l.etat).toBe('inconnu');
    expect(l.droite).toBe('non relié');
  });

  it('nom proche : deux articles « Pilsner » et « Pilsner Malz », la recette lie le bon', () => {
    const l = ligne(recette(), [pilsner({ currentStock: 2 }), pilsner({ id: 'MALT-2', ref: 'MALT-2', name: 'Pilsner', currentStock: 100 })]);
    expect(l.manque).toBe('Pilsner Malz 3 kg');
  });

  it('la lignée du carnet dit le même manque : 5 kg, pas 49', () => {
    const entree = { family: 'F1', version: 1, name: 'ZZ TEST — Pils', recipe: recette(), linkedBatches: [] } as unknown as CatalogEntry;
    const [lignee] = lignees([entree], [planifie('B-1', 44)], [pilsner()]);
    expect(lignee.manques[0].manque).toBe('Pilsner Malz 5 kg');
  });
});
