import { describe, expect, it } from 'vitest';
import { disponibilites, libelleSource, recetteAuxCourses, recetteDansCourses } from '../../../src/domain/stock/disponibilite';
import type { Batch, Recipe, StockItem } from '../../../src/types';

/** « Ajouter aux courses » (v07, rebrasser) : une recette déjà brassée pose ses manques sur Courses, jusqu'à son prochain brassin. Fixtures simulées. */
const article: StockItem = { id: 'A', ref: 'A', name: 'ZZ TEST Citra', category: 'Houblon', unit: 'kg', currentStock: 0.1, minStock: 0, reorder: false } as StockItem;
const recette = (over: Partial<Recipe> = {}): Recipe => ({
  id: 'R1', name: 'ZZ TEST Blonde de juillet', style: 'Pale Ale', volumeL: 100,
  fermentables: [{ name: 'ZZ TEST Citra', stockItemRef: 'A', weightKg: 0.3, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '' }, ...over
} as unknown as Recipe);
const brassin = (id: string, over: Partial<Batch>): Batch => ({
  id, name: 'ZZ TEST Blonde de juillet', style: 'Pale Ale', volumeL: 100, brewDate: '', plannedBrewDate: '', status: 'termine', recipeRef: 'R1', stockAccountingVersion: 1, ...over
} as unknown as Batch);
const passe = brassin('B0', { brewDate: '20.07.2026', plannedBrewDate: '20.07.2026' });

describe('recetteAuxCourses (v07)', () => {
  it('une recette brassée n’est pas dans Courses tant qu’on ne l’y pose pas', () => {
    expect(recetteDansCourses(recette(), [passe])).toBeNull();
    expect(disponibilites([article], [passe], [recette()]).parArticle.get('A')?.manque ?? 0).toBe(0);
  });

  it('posée le 21.11 : son manque compte, source « à rebrasser » datée du jour', () => {
    const r = recette({ coursesLe: '2026-11-21' });
    expect(recetteDansCourses(r, [passe])).toBe('demandee');
    const d = disponibilites([article], [passe], [r]).parArticle.get('A')!;
    expect(d.manque).toBeCloseTo(0.2);
    expect(d.sources).toEqual([expect.objectContaining({ genre: 'courses', nom: 'ZZ TEST Blonde de juillet', date: '2026-11-21' })]);
    expect(libelleSource(d.sources[0])).toBe('ZZ TEST Blonde de juillet à rebrasser');
  });

  it('un brassin qui la cite depuis porte le besoin : jamais compté deux fois', () => {
    const r = recette({ coursesLe: '2026-11-21' });
    expect(recetteAuxCourses(r, [passe, brassin('B1', { status: 'planifie', plannedBrewDate: '05.12.2026' })])).toBe(false);
    expect(recetteAuxCourses(r, [passe, brassin('B2', { brewDate: '28.11.2026' })])).toBe(false);
    expect(recetteAuxCourses(r, [passe, brassin('B3', { status: 'annule', plannedBrewDate: '05.12.2026' })])).toBe(true);
  });

  it('une recette jamais brassée y est d’office ; archivée, jamais', () => {
    expect(recetteDansCourses(recette(), [])).toBe('jamais-brassee');
    expect(recetteDansCourses(recette({ coursesLe: '2026-11-21', archivedAt: '2026-11-22' }), [passe])).toBeNull();
  });
});
