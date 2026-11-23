import { describe, expect, it } from 'vitest';
import { estimateBrewBudget } from '../../src/domain/finance/brewBudget';
import { ANCIEN_PRIX_A_CONFIRMER, NOTE_PRIX_DU_STOCK, prixDuStockPropose } from '../../src/domain/finance/prixDuStock';
import type { Recipe, StockItem } from '../../src/types';

const article = (ref: string, name: string, unit: string, pricePerUnit?: number) => ({ ref, name, category: 'Malt', unit, currentStock: 50, ...(pricePerUnit !== undefined ? { pricePerUnit } : {}) }) as unknown as StockItem;
const recette = { id: 'R', name: 'ZZ TEST IPA', style: 'IPA', volumeL: 100, fermentables: [{ name: 'ZZ TEST Malt pilsner', weightKg: 20, kind: 'grain' }, { name: 'ZZ TEST Sans prix', weightKg: 1, kind: 'grain' }], hops: [{ name: 'ZZ TEST Citra', weightG: 200, stage: 'boil', time: 60 }], yeast: { name: 'ZZ TEST US-05', qty: 2, unit: 'sachet' } } as unknown as Recipe;
const stock = [article('P', 'ZZ TEST Malt pilsner', 'kg', 1.6), article('S', 'ZZ TEST Sans prix', 'kg'), article('C', 'ZZ TEST Citra', 'g', 0.09), article('Y', 'ZZ TEST US-05', 'sachet', 4.5)];
const estime = () => estimateBrewBudget({ recipe: recette, stockItems: stock, batches: [], brewDate: '2026-12-01' });

describe('WF2-8 : reprendre les prix du stock', () => {
  it('chaque ancien prix du stock devient une proposition estimée en TTC ; sans prix au stock, rien (jamais 0)', () => {
    const lignes = estime().lines;
    expect(lignes.filter(l => l.issues.includes(ANCIEN_PRIX_A_CONFIRMER))).toHaveLength(3);
    const propose = prixDuStockPropose(lignes, stock, '21.11.2026');
    const parNom = Object.fromEntries(lignes.map(l => [l.name, propose[l.key]]));
    expect(parNom['ZZ TEST Malt pilsner']).toMatchObject({ amount: 1.6, quantity: 1, unit: 'kg', basis: 'TTC', source: 'manual', note: NOTE_PRIX_DU_STOCK });
    expect(parNom['ZZ TEST Citra']).toMatchObject({ amount: 0.09, unit: 'g' });
    expect(parNom['ZZ TEST US-05']).toMatchObject({ amount: 4.5, unit: 'sachet' });
    expect(parNom['ZZ TEST Sans prix']).toBeUndefined();
  });

  it('avec ces prix, le coût des ingrédients est chiffré (20 kg × 1,6 + 200 g × 0,09 + 2 sachets × 4,5 hors le malt sans prix)', () => {
    const lignes = estime().lines;
    const prices = prixDuStockPropose(lignes, stock, '21.11.2026');
    const chiffre = estimateBrewBudget({ recipe: recette, stockItems: stock, batches: [], brewDate: '2026-12-01', prices });
    const cout = (nom: string) => chiffre.lines.find(l => l.name === nom)?.consumedCost;
    expect(cout('ZZ TEST Malt pilsner')).toBe(32);
    expect(cout('ZZ TEST Citra')).toBe(18);
    expect(cout('ZZ TEST US-05')).toBe(9);
    expect(cout('ZZ TEST Sans prix')).toBeNull();
  });

  it('une ligne déjà chiffrée (facture ou saisie) n\'est jamais écrasée', () => {
    const lignes = estime().lines.map(l => (l.name === 'ZZ TEST Citra' ? { ...l, price: { amount: 1, quantity: 10, unit: 'g', basis: 'TTC' as const, tvaRate: 0, source: 'invoice' as const, date: '01.11.2026' } } : l));
    expect(Object.keys(prixDuStockPropose(lignes, stock, '21.11.2026'))).toHaveLength(2);
  });
});
