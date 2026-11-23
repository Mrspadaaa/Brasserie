import { describe, expect, it } from 'vitest';
import { disponibilites, libelleSource, dateDepuisIdRecette } from '../../../src/domain/stock/disponibilite';
import { articlesACommander, compareRecipeWithStock } from '../../../src/domain/stockLevel';
import type { Batch, Recipe, StockItem } from '../../../src/types';

/** Voie k2, R1 : la disponibilité unique. Fixtures simulées ; aucune donnée réelle. */
const article = (ref: string, over: Partial<StockItem> = {}): StockItem => ({
  id: ref, ref, name: `Article ${ref}`, category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0, reorder: false, ...over
} as StockItem);

const recette = (id: string, nom: string, lignes: Array<{ ref: string; kg: number }>, over: Partial<Recipe> = {}): Recipe => ({
  id, name: nom, style: 'IPA', volumeL: 20,
  fermentables: lignes.map(l => ({ name: `Article ${l.ref}`, stockItemRef: l.ref, weightKg: l.kg, kind: 'grain', use: 'empatage' })),
  hops: [], yeast: { name: '' }, ...over
} as unknown as Recipe);

const brassin = (id: string, nom: string, date: string, lignes: Array<{ ref: string; kg: number }>, over: Partial<Batch> = {}): Batch => ({
  id, name: nom, style: 'IPA', volumeL: 20, brewDate: '', plannedBrewDate: date, status: 'planifie', stockAccountingVersion: 1,
  recipeSnapshot: { name: nom, style: 'IPA', volumeL: 20, capturedAt: '2026-11-01T10:00:00.000Z',
    fermentables: lignes.map(l => ({ name: `Article ${l.ref}`, stockItemRef: l.ref, weightKg: l.kg, kind: 'grain', use: 'empatage' })), hops: [], yeast: { name: '' } },
  ...over
} as unknown as Batch);

const idDu09 = `REC-${new Date('2026-11-09T10:00:00Z').getTime().toString(36).toUpperCase()}`;

describe('R1 — disponibilites : sources nommées', () => {
  it('chaque source est nommée, avec sa date quand elle est connue', () => {
    const { parArticle } = disponibilites([article('A', { currentStock: 5 })],
      [brassin('B1', 'Pale Ale', '2026-11-14', [{ ref: 'A', kg: 3 }])], [recette(idDu09, 'IPA', [{ ref: 'A', kg: 4 }])]);
    const d = parArticle.get('A')!;
    expect(d).toMatchObject({ enStock: 5, besoin: 7, manque: 2, inconnu: false });
    expect(d.sources.map(libelleSource)).toEqual(['Pale Ale prévu le 14.11', 'IPA écrite le 09.11']);
    expect(dateDepuisIdRecette(idDu09)).toBe('2026-11-09');
    expect(dateDepuisIdRecette('REC-df46da79-dce9')).toBeNull();
  });

  it('une source sort du besoin quand son brassin est déstocké, annulé, ou quand sa recette est archivée ou brassée', () => {
    const a = article('A');
    const destocke = brassin('B1', 'Fait', '2026-11-01', [{ ref: 'A', kg: 9 }], {
      stockConsumption: { appliedAt: '2026-11-01T10:00:00.000Z', eventId: 'E', completedStages: ['brewday'], items: [{ stockItemRef: 'A', quantity: 9, unit: 'kg' }], pendingItems: [] }
    } as Partial<Batch>);
    const annule = brassin('B2', 'Annulé', '2026-11-02', [{ ref: 'A', kg: 9 }], { status: 'annule' });
    const archivee = recette('R-OLD', 'Archivée', [{ ref: 'A', kg: 9 }], { archivedAt: '2026-11-03T00:00:00.000Z' });
    const brassee = recette('R-DONE', 'Brassée', [{ ref: 'A', kg: 9 }]);
    const citee = brassin('B3', 'Brassée en fermentation', '2026-11-01', [], { status: 'fermentation', recipeRef: 'R-DONE' } as Partial<Batch>);
    const d = disponibilites([a], [destocke, annule, citee], [archivee, brassee]).parArticle.get('A')!;
    expect(d.sources).toEqual([]);
    expect(d.besoin).toBe(0);
    expect(d.manque).toBe(0);
  });

  it('les ajouts restants d’un brassin déjà brassé restent un besoin (encore en rayon), jusqu’à la fin du brassin', () => {
    const avecReste = (status: Batch['status']) => brassin('B1', 'Dry hop', '2026-11-01', [], {
      status, stockConsumption: { appliedAt: '2026-11-01T10:00:00.000Z', eventId: 'E', completedStages: ['brewday'], items: [],
        pendingItems: [{ stockItemRef: 'A', quantity: 2, unit: 'kg' }] }
    } as Partial<Batch>);
    const a = article('A', { currentStock: 1 });
    const d = disponibilites([a], [avecReste('fermentation')], []).parArticle.get('A')!;
    expect(d.sources[0]).toMatchObject({ genre: 'ajouts-restants', quantite: 2 });
    expect(d.manque).toBe(1);
    expect(disponibilites([a], [avecReste('termine')], []).parArticle.get('A')!.manque).toBe(0);
  });

  it('la recette qui a déjà un brassin planifié n’est pas comptée deux fois', () => {
    const r = recette('R1', 'IPA', [{ ref: 'A', kg: 3 }]);
    const b = brassin('B1', 'IPA', '2026-11-14', [{ ref: 'A', kg: 3 }], { recipeRef: 'R1' } as Partial<Batch>);
    expect(disponibilites([article('A', { currentStock: 0 })], [b], [r]).parArticle.get('A')!.besoin).toBe(3);
  });
});

describe('R1 — l’inconnu n’est jamais 0', () => {
  it('une unité absente ou incompatible rend le besoin et le manque inconnus, avec un plancher « au moins »', () => {
    const a = article('A', { currentStock: 1 });
    const r = recette('R1', 'IPA', [{ ref: 'A', kg: 3 }]);
    const incompatible = { ...recette('R2', 'Sachets', []), adjuncts: [{ name: 'Article A', stockItemRef: 'A', amount: 2, unit: 'sachet', step: 'x' }] } as unknown as Recipe;
    const d = disponibilites([a], [], [r, incompatible]).parArticle.get('A')!;
    expect(d.besoin).toBeNull();
    expect(d.manque).toBeNull();
    expect(d.inconnu).toBe(true);
    expect(d.manqueAuMoins).toBe(2);
    expect(d.raisons.join(' ')).toContain('sachet vers kg');
    const liste = articlesACommander([a], [], [r, incompatible]);
    expect(liste[0]).toMatchObject({ missing: 2, auMoins: true });
  });

  it('une quantité absente donne « inconnu », pas 0 ; un stock illisible aussi', () => {
    const sansQuantite = recette('R1', 'IPA', [{ ref: 'A', kg: Number.NaN }]);
    expect(disponibilites([article('A')], [], [sansQuantite]).parArticle.get('A')).toMatchObject({ besoin: null, manque: null, inconnu: true });
    const r = recette('R2', 'IPA', [{ ref: 'A', kg: 3 }]);
    const d = disponibilites([article('A', { currentStock: Number.NaN })], [], [r]).parArticle.get('A')!;
    expect(d).toMatchObject({ enStock: null, besoin: 3, manque: null, inconnu: true });
  });

  it('un ingrédient sans article dans le stock est dit à part, jamais attribué à un autre', () => {
    const r = recette('R1', 'IPA', [{ ref: 'ABSENT', kg: 3 }]);
    const res = disponibilites([article('A')], [], [r]);
    expect(res.parArticle.get('A')!.sources).toEqual([]);
    expect(res.sansArticle).toHaveLength(1);
    expect(res.sansArticle[0].raison).toContain('absente');
  });
});

describe('R1 — la comparaison d’une recette suit la même règle', () => {
  it('manque d’une recette = besoin de la recette + prévu ailleurs − stock, comme À commander', () => {
    const items = [article('A', { currentStock: 5 })];
    const brassins = [brassin('B1', 'Pale', '2026-11-14', [{ ref: 'A', kg: 3 }])];
    const r = recette('R1', 'IPA', [{ ref: 'A', kg: 4 }]);
    const [ligne] = compareRecipeWithStock(r, brassins, items, [r]);
    expect(ligne).toMatchObject({ quantity: 4, elsewhere: 3, shortage: 2 });
    expect(ligne.elsewhereSources.map(libelleSource)).toEqual(['Pale prévu le 14.11']);
    expect(articlesACommander(items, brassins, [r])[0].missing).toBe(2);
  });
});

describe('R1 — temps (L20) : 30 recettes, 100 articles, 10 brassins planifiés', () => {
  it('se calcule en quelques millisecondes', () => {
    const items = Array.from({ length: 100 }, (_, i) => article(`A${i}`, { currentStock: 2 }));
    const recettes = Array.from({ length: 30 }, (_, r) => recette(`R${r}`, `Recette ${r}`, Array.from({ length: 8 }, (_, k) => ({ ref: `A${(r * 3 + k) % 100}`, kg: 1 }))));
    const brassins = Array.from({ length: 10 }, (_, b) => brassin(`B${b}`, `Brassin ${b}`, '2026-11-20', Array.from({ length: 8 }, (_, k) => ({ ref: `A${(b * 7 + k) % 100}`, kg: 1 }))));
    disponibilites(items, brassins, recettes); // chauffe
    const t0 = performance.now();
    const N = 20;
    for (let i = 0; i < N; i++) articlesACommander(items, brassins, recettes);
    const moyenne = (performance.now() - t0) / N;
    console.log(`TEMPS articlesACommander (100 articles, 30 recettes, 10 brassins) : ${moyenne.toFixed(2)} ms`);
    expect(moyenne).toBeLessThan(50);
  });
});
