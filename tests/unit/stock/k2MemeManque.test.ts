import { describe, expect, it } from 'vitest';
import { articlesACommander, compareRecipeWithStock } from '../../../src/domain/stockLevel';
import type { Batch, Recipe, StockItem } from '../../../src/types';

/**
 * Voie k2 (mission 2026-11-11-stock), R1 : UNE disponibilité. Une fixture à deux brassins planifiés et une recette écrite
 * donne le même manque sur chaque lecteur : À commander (et donc le badge et le Bord), la comparaison d'une recette.
 * Ce fichier n'utilise que des exports qui existent déjà : sur l'état d'avant, il échoue par ses chiffres, pas par un import.
 */
const pilsner = (over: Partial<StockItem> = {}): StockItem => ({
  id: 'MALT-1', ref: 'MALT-1', name: 'Pilsner Malz', category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0, reorder: false, ...over
} as StockItem);

const recette = (over: Partial<Recipe> = {}): Recipe => ({
  id: 'REC-LKX1234', name: 'IPA témoin', style: 'IPA', volumeL: 20,
  fermentables: [{ name: 'Pilsner Malz', stockItemRef: 'MALT-1', weightKg: 4, kind: 'grain', use: 'empatage' }],
  hops: [], yeast: { name: '' }, ...over
} as unknown as Recipe);

const planifie = (id: string, nom: string, date: string, kg: number, over: Partial<Batch> = {}): Batch => ({
  id, name: nom, style: 'Pale Ale', volumeL: 20, brewDate: '', plannedBrewDate: date, status: 'planifie', stockAccountingVersion: 1,
  recipeRef: `REC-${id}`,
  recipeSnapshot: { name: nom, style: 'Pale Ale', volumeL: 20, capturedAt: '2026-11-01T10:00:00.000Z',
    fermentables: [{ name: 'Pilsner Malz', stockItemRef: 'MALT-1', weightKg: kg, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '' } },
  ...over
} as unknown as Batch);

const deuxBrassins = [planifie('B-A', 'Pale Ale A', '2026-11-14', 3), planifie('B-B', 'Pale Ale B', '2026-11-20', 2)];

describe('R1 — le même manque sur chaque lecteur (5 kg en stock ; 3 + 2 kg planifiés ; 4 kg écrits)', () => {
  it('À commander (liste, badge, Bord) compte les deux brassins ET la recette écrite : 9 − 5 = 4 kg', () => {
    const liste = articlesACommander([pilsner()], deuxBrassins, [recette()]);
    expect(liste).toHaveLength(1);
    expect(liste[0].missing).toBe(4);
  });

  it('la comparaison de la recette écrite dit le même manque : 4 kg', () => {
    const [ligne] = compareRecipeWithStock(recette(), deuxBrassins, [pilsner()], [recette()]);
    expect(ligne.quantity).toBe(4);
    expect(ligne.shortage).toBe(4);
  });

  it('les deux lecteurs disent le même chiffre quand la recette écrite change', () => {
    const grande = recette({ fermentables: [{ name: 'Pilsner Malz', stockItemRef: 'MALT-1', weightKg: 7, kind: 'grain', use: 'empatage' }] as Recipe['fermentables'] });
    const aCommander = articlesACommander([pilsner()], deuxBrassins, [grande])[0].missing;
    const [ligne] = compareRecipeWithStock(grande, deuxBrassins, [pilsner()], [grande]);
    expect(aCommander).toBe(7);
    expect(ligne.shortage).toBe(aCommander);
  });

  it('une recette archivée, ou déjà passée en brassin déstocké, ne compte plus', () => {
    const archivee = recette({ id: 'REC-OLD', archivedAt: '2026-11-02T08:00:00.000Z' });
    const brassee = recette({ id: 'REC-B-DONE' });
    const fait = planifie('B-DONE', 'Brassée', '2026-11-01', 9, {
      status: 'fermentation', recipeRef: 'REC-B-DONE',
      stockConsumption: { appliedAt: '2026-11-01T10:00:00.000Z', eventId: 'BREW-B-DONE', completedStages: ['brewday'], items: [{ stockItemRef: 'MALT-1', quantity: 9, unit: 'kg' }], pendingItems: [] }
    } as Partial<Batch>);
    const liste = articlesACommander([pilsner()], [...deuxBrassins, fait], [archivee, brassee, recette()]);
    expect(liste[0].missing).toBe(4);
  });
});
