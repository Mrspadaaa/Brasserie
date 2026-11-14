// Voie vd, ST-V4 : la recherche du Stock (verdict bdd71433 n° 4). « cit » ne ramène plus Acide lactique, Sels de brassage ni Détergent CIP.
import { describe, expect, it } from 'vitest';
import { createSearch, runSearch } from '../../src/services/search';
import { rechercherStock } from '../../src/domain/stock/recherche';
import type { StockItem } from '../../src/types';

const art = (ref: string, name: string, category: string, extra: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name, category, unit: 'kg', currentStock: 1, reorder: false, ...extra } as StockItem);
const items = [
  art('h1', 'Citra', 'Houblon', { supplier: 'Hopfen der Welt' }),
  art('m1', 'Caramel 120', 'Malt', { supplier: 'Brouwland' }),
  art('m2', 'Caramünch II', 'Malt', { supplier: 'Brouwland' }),
  art('m3', 'Munich II', 'Malt', { supplier: 'Brouwland' }),
  art('a1', 'Acide lactique 80 %', 'Additif'),
  art('a2', 'Sels de brassage', 'Additif'),
  art('n1', 'Détergent CIP', 'CIP alcalin'),
  art('h2', 'Cascade', 'Houblon'),
  art('l1', 'SafAle US-05', 'Levure', { yeastStrain: 'American Ale' }),
];
const fuse = createSearch(items, ['name', 'ref', 'category', 'supplier']);
const noms = (r: StockItem[]) => r.map((i) => i.name);

describe('recherche du Stock : des mots, pas des ressemblances', () => {
  it('« cit » ne ramène que Citra', () => {
    expect(noms(rechercherStock(items, 'cit', (q) => runSearch(fuse, q)))).toEqual(['Citra']);
  });
  it('« citra » : Citra seul, plus de Caramel 120 ni de Détergent CIP', () => {
    expect(noms(rechercherStock(items, 'citra', (q) => runSearch(fuse, q)))).toEqual(['Citra']);
  });
  it('par fournisseur, par souche, sans accent', () => {
    expect(noms(rechercherStock(items, 'brouw'))).toEqual(['Caramel 120', 'Caramünch II', 'Munich II']);
    expect(noms(rechercherStock(items, 'american'))).toEqual(['SafAle US-05']);
    expect(noms(rechercherStock(items, 'caramunch'))).toEqual(['Caramünch II']);
  });
  it('plusieurs mots : tous doivent se retrouver', () => {
    expect(noms(rechercherStock(items, 'munich brouwland'))).toEqual(['Munich II']);
    expect(rechercherStock(items, 'citra brouwland')).toEqual([]);
  });
  it('à défaut de mot exact : le milieu d\'un mot, puis seulement la faute de frappe', () => {
    expect(noms(rechercherStock(items, 'unich'))).toEqual(['Munich II']);
    expect(noms(rechercherStock(items, 'casacde', (q) => runSearch(fuse, q)))).toContain('Cascade');
  });
  it('rien tapé ou rien de proche : aucun résultat, jamais tout le stock', () => {
    expect(rechercherStock(items, '  ')).toEqual([]);
    expect(rechercherStock(items, 'zzzzzz')).toEqual([]);
  });
});
