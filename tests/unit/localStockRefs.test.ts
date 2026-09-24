import { describe, expect, it } from 'vitest';
import { completeFromStockReferences } from '../../src/domain/localStockFacts';
import { completeFromLocalReferences } from '../../src/domain/localIngredientFacts';
import type { Fermentable, HopIngredient, StockItem, YeastSpec } from '../../src/types';

const row = (ref: string, category: string, patch: Partial<StockItem>): StockItem => ({
  id: `doc-${ref}`, ref, name: 'Même nom', category, unit: category === 'Malt' ? 'kg' : 'g',
  currentStock: 10, minStock: 0, reorder: false, technicalSource: `Fiche ${ref}`, ...patch,
});

describe('Faits repris depuis une référence de stock', () => {
  it.each([completeFromStockReferences, (f: Fermentable[], h: HopIngredient[], y: YeastSpec, s: StockItem[]) => completeFromLocalReferences(f, h, y, s, [])])('utilise le lot choisi et laisse un nom ambigu sans déduction', complete => {
    const stock = [
      row('M-A', 'Malt', { colorEbc: 4, potentialPpg: 36 }),
      row('M-B', 'Malt', { colorEbc: 12, potentialPpg: 38 }),
      row('H-A', 'Houblon', { alphaPct: 5 }),
      row('H-B', 'Houblon', { alphaPct: 12 }),
      row('Y-A', 'Levure', { yeastAttenuationPct: 72 }),
      row('Y-B', 'Levure', { yeastAttenuationPct: 80 }),
    ];
    const grain: Fermentable = { name: 'Même nom', stockItemRef: 'M-B', kind: 'grain', use: 'empatage', weightKg: 2 };
    const hop: HopIngredient = { name: 'Même nom', stockItemRef: 'H-B', stage: 'boil', weightG: 20, alpha: 0, timeMin: 30 };
    const yeast: YeastSpec = { name: 'Même nom', stockItemRef: 'Y-B' };
    const selected = complete([grain], [hop], yeast, stock);
    expect(selected.fermentables[0]).toMatchObject({ colorEbc: 12, potentialPpg: 38, stockItemRef: 'M-B' });
    expect(selected.hops[0]).toMatchObject({ alpha: 12, stockItemRef: 'H-B' });
    expect(selected.yeast).toMatchObject({ attenuationPct: 80, stockItemRef: 'Y-B' });
    const ambiguous = complete([{ ...grain, stockItemRef: undefined }], [{ ...hop, stockItemRef: undefined }], { name: 'Même nom' }, stock);
    expect(ambiguous.fermentables[0].colorEbc).toBeUndefined();
    expect(ambiguous.hops[0].alpha).toBe(0);
    expect(ambiguous.yeast.attenuationPct).toBeUndefined();
  });
});
