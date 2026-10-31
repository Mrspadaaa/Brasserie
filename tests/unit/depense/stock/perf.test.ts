/**
 * Voie s1-stock — le moteur d'appariement est synchrone, sur le fil de l'interface : 35 lignes (le plafond de la lecture) contre un
 * stock de 500 articles doivent rester sous une seconde (borne large : le poste est chargé, la mesure détaillée va dans RESULTAT.md).
 */
import { describe, expect, it } from 'vitest';
import { matchStockLine } from '../../../../src/services/stockLineMatching';
import type { StockItem } from '../../../../src/types';

describe('coût de l’appariement', () => {
  it('35 lignes × 500 articles en moins d’une seconde', () => {
    const categories = ['Malt', 'Houblon', 'Levure', 'Emballage'];
    const stock: StockItem[] = Array.from({ length: 500 }, (_, i) => ({ id: `a${i}`, ref: `a${i}`, name: `Article ${i} Type ${i % 7} Variante${i}`, category: categories[i % 4], unit: i % 4 === 1 ? 'g' : i % 4 === 2 ? 'sachet' : 'kg', currentStock: 1, minStock: 0, reorder: false }));
    const t0 = performance.now();
    let propositions = 0;
    for (let n = 0; n < 35; n++) if (matchStockLine({ description: `Article ${n * 13} Type ${(n * 13) % 7} Variante${n * 13}`, unit: 'kg', quantity: 5, vendor: 'Malterie du Banc SA' }, stock)) propositions++;
    const ms = performance.now() - t0;
    // eslint-disable-next-line no-console
    console.log(`PERF appariement : 35 lignes x 500 articles = ${Math.round(ms)} ms, ${propositions} proposition(s)`);
    expect(ms).toBeLessThan(1000);
  });
});
