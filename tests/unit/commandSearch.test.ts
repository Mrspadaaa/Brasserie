import { describe, expect, it } from 'vitest';
import { searchCommandGroups } from '../../src/services/search';

describe('recherche universelle complète, archives sur demande', () => {
  it('trouve une écriture au-delà des 200 premières avant de limiter le rendu', () => {
    const items = Array.from({ length: 450 }, (_, i) => ({
      id: `tx-${i}`, label: i === 420 ? 'Levure spéciale introuvable' : `Achat ${i}`
    }));
    const result = searchCommandGroups([{ heading: 'Écritures', items }], 'levure speciale');
    expect(result.total).toBe(1);
    expect(result.groups[0].items[0].id).toBe('tx-420');
  });

  it('exclut les archives par défaut et les inclut uniquement sur demande', () => {
    const groups = [{ heading: 'Écritures', items: [
      { id: 'old', label: 'Malt Pils', archived: true },
      { id: 'current', label: 'Malt Pils', archived: false }
    ] }];
    expect(searchCommandGroups(groups, 'malt').groups[0].items.map(item => item.id)).toEqual(['current']);
    expect(searchCommandGroups(groups, 'malt', true).groups[0].items.map(item => item.id)).toEqual(['old', 'current']);
    expect(groups[0].items).toHaveLength(2);
  });

  it('ne laisse pas une rubrique volumineuse cacher les résultats des autres rubriques', () => {
    const groups = [
      { heading: 'Stock', items: Array.from({ length: 1500 }, (_, i) => ({ id: `stock-${i}`, label: `Malt ${i}` })) },
      { heading: 'Écritures', items: [{ id: 'invoice', label: 'Malt de septembre' }] }
    ];
    const result = searchCommandGroups(groups, 'malt');
    expect(result.total).toBe(1501);
    expect(result.visible).toBe(13);
    expect(result.groups[0].items).toHaveLength(12);
    expect(result.groups[1].items[0].id).toBe('invoice');
  });

  it('cherche les mots dans le fournisseur, la référence et la date, sans accents', () => {
    const groups = [{ heading: 'Écritures', items: [{
      id: 'invoice', label: 'Röstgerste', detail: '18.09.2026 · 25 CHF', keywords: ['Fournisseur Fictif', 'FACT-409']
    }] }];
    expect(searchCommandGroups(groups, 'fictif fact-409 2026').total).toBe(1);
    expect(searchCommandGroups(groups, 'rostgerste').total).toBe(1);
    expect(searchCommandGroups(groups, 'absent').groups).toEqual([]);
  });

  it('garde les résultats exacts en tête et les rubriques sans statut d’archive', () => {
    const groups = [{ heading: 'Recettes', items: [
      { id: 'keyword', label: 'Blonde', keywords: ['stout'] },
      { id: 'name', label: 'Stout avoine' }
    ] }];
    expect(searchCommandGroups(groups, 'stout').groups[0].items.map(item => item.id)).toEqual(['name', 'keyword']);
    expect(searchCommandGroups(groups, '').total).toBe(2);
  });
});
