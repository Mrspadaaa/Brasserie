import { describe, expect, it } from 'vitest';
import type { Recipe, StockItem } from '../../src/types';
import { delier, lignesSansLien, relierAuStock, trouverArticle } from '../../src/domain/recette/relierAuStock';

const article = (ref: string, name: string, category: string, unit: string, currentStock: number, extra: Partial<StockItem> = {}): StockItem =>
  ({ ref, name, category, unit, currentStock, minStock: 0, ...extra }) as StockItem;

const stock: StockItem[] = [
  article('ZZ-PILS', 'ZZ TEST Malt pilsner', 'Malt', 'kg', 25),
  article('ZZ-MUNICH', 'ZZ TEST Munich', 'Malt', 'kg', 10),
  article('ZZ-ROST', 'Röstgerste (orge torréfiée)', 'Malt', 'kg', 0.5),
  article('ZZ-CITRA', 'ZZ TEST Citra', 'Houblon', 'g', 500, { alphaPct: 12.5 }),
  article('ZZ-US05', 'ZZ TEST US-05', 'Levure', 'sachet', 4)
];

const recette = (): Recipe => ({
  id: 'R-ZZ-PA-V1', name: 'ZZ TEST Blonde de juillet', style: 'Pale Ale', volumeL: 100, ingredients: [],
  fermentables: [
    { name: 'zz test malt PILSNER', weightKg: 20, kind: 'grain' },
    { name: 'Rstgerste (orge torrfie)', weightKg: 0.5, kind: 'grain' },
    { name: 'ZZ TEST Whirlfloc maison', weightKg: 0.01, kind: 'grain' },
    { name: 'ZZ TEST Munich', weightKg: 4, kind: 'grain', stockItemRef: 'ZZ-MUNICH' }
  ],
  hops: [{ name: 'ZZ TEST Citra', weightG: 300, stage: 'boil', time: 60, alpha: 9 }],
  yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' }
} as unknown as Recipe);

describe('N3 — relierAuStock', () => {
  it('relie au nom exact sans casse, au nom proche (accents perdus), laisse la ligne sans article', () => {
    const r = relierAuStock(recette(), stock);
    expect(r.aRelier).toBe(5);
    expect(r.reliees).toBe(4);
    expect(r.aConfirmer).toBe(1);
    expect(r.recette.fermentables!.map((l) => l.stockItemRef)).toEqual(['ZZ-PILS', 'ZZ-ROST', undefined, 'ZZ-MUNICH']);
    expect(r.liens.find((l) => l.nom.startsWith('Rst'))?.correspondance).toBe('proche');
    expect(r.liens.find((l) => l.nom.includes('Whirlfloc'))?.correspondance).toBe('aucun');
    expect(r.recette.yeast?.stockItemRef).toBe('ZZ-US05');
  });

  it("un houblon relié prend l'α du lot ; la dose ne bouge pas ; × rend l'α d'avant", () => {
    const r = relierAuStock(recette(), stock);
    const h = r.recette.hops![0];
    expect(h.stockItemRef).toBe('ZZ-CITRA');
    expect(h.alpha).toBe(12.5);
    expect(h.weightG).toBe(300);
    const lien = r.liens.find((l) => l.genre === 'houblon')!;
    expect(lien.alphaAvant).toBe(9);
    const d = delier(r.recette, lien).hops![0];
    expect(d.alpha).toBe(9);
    expect('stockItemRef' in d).toBe(false);
  });

  it('ne relie jamais à un article d’une autre catégorie, ni à deux articles du même nom', () => {
    const doublon = [...stock, article('ZZ-PILS-2', 'ZZ TEST Malt pilsner', 'Malt', 'kg', 3)];
    expect(trouverArticle('ZZ TEST Malt pilsner', 'malt', 20, 'kg', doublon).correspondance).toBe('aucun');
    expect(trouverArticle('ZZ TEST Citra', 'malt', 1, 'kg', stock).correspondance).toBe('aucun');
  });

  it('compte les lignes sans lien et ne touche pas une recette déjà reliée', () => {
    expect(lignesSansLien(recette())).toBe(5);
    const r = relierAuStock(recette(), stock);
    const deux = relierAuStock(r.recette, stock);
    expect(deux.aRelier).toBe(1);
    expect(deux.reliees).toBe(0);
  });
});
