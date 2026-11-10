// d2, P4 du banc b1 (09.11) : un rabais se rattache à l'article du dessus et s'appelle « Rabais », pas le libellé de taxe imprimé sous l'article ; il n'est jamais compté comme article.
// Sun Store 2 : 3 articles et 2 rabais ; le libellé imprimé est une ligne de taxe (« NoVatTax - 0% »). Lectures simulées, noms fictifs.
import { describe, expect, it } from 'vitest';
import type { ScannedInvoiceResult } from '../../../src/services/geminiScanner';
import { lignesDeLecture } from '../../../src/ui/depense/finale';
import { articleDuDessus } from '../../../src/ui/depense/groupes';
import { compterArticles } from '../../../src/domain/finance/controlesPiece';

const item = (i: number, name: string, kind: string, amount: number) => ({ id: `line-${i}`, name, kind, quantity: 1, unit: 'pièce', price: amount, amountTTC: amount });
const lecture = (items: any[]): ScannedInvoiceResult => ({ vendor: 'Fournisseur fictif', date: '02.11.2026', currency: 'CHF', invoiceNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 149.25, category: 'divers', subcategory: '', description: '', items, issues: [] } as unknown as ScannedInvoiceResult);

describe('P4 — un rabais est un « Rabais », jamais le libellé de taxe', () => {
  it('une ligne de remise lue sous le libellé « NoVatTax - 0% » s\'appelle « Rabais » ; le libellé imprimé reste sous « Imprimé »', () => {
    const { lines } = lignesDeLecture(lecture([item(1, 'VACCIN FICTIF A', 'equipment', 82.33), item(2, 'NoVatTax - 0%', 'discount', -1.29), item(3, 'H21 CONSULTATION', 'service', 50)]), [], 'S1');
    expect(lines.map(l => l.description)).toEqual(['VACCIN FICTIF A', 'Rabais', 'H21 CONSULTATION']);
    expect(lines[1]).toMatchObject({ kind: 'discount', amount: -1.29, imprime: { nom: 'NoVatTax - 0%' } });
    expect(lines[0].imprime).toBeUndefined();
  });
  it('un article dont le libellé contient « rabais » n\'est pas touché (la règle suit le genre de la ligne, pas le mot)', () => {
    const { lines } = lignesDeLecture(lecture([item(1, 'Fût rabais fictif', 'equipment', 40)]), [], 'S1');
    expect(lines[0].description).toBe('Fût rabais fictif');
  });
});

describe('P4 — le rabais suit l\'article du dessus', () => {
  const kinds = (...k: string[]) => k.map(kind => ({ kind }));
  it('articleDuDessus : le rang de l\'article qui précède ; deux rabais de suite pointent le même article ; -1 sans article au-dessus', () => {
    const l = kinds('equipment', 'discount', 'service', 'discount', 'discount');
    expect([1, 3, 4].map(i => articleDuDessus(l, i))).toEqual([0, 2, 2]);
    expect(articleDuDessus(kinds('discount', 'equipment'), 0)).toBe(-1);
    expect(articleDuDessus(kinds('equipment', 'service'), 1)).toBe(-1);
  });
  it('un rabais n\'est jamais compté comme article', () => {
    const { articles, remises } = compterArticles([item(1, 'A', 'equipment', 82.33), item(2, 'B', 'equipment', 19.5), item(3, 'C', 'service', 50), item(4, 'NoVatTax - 0%', 'discount', -1.29), item(5, 'NoVatTax - 0%', 'discount', -1.29)]);
    expect({ articles, remises }).toEqual({ articles: 3, remises: 2 });
  });
});
