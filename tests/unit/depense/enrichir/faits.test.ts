import { describe, expect, it } from 'vitest';
/** Voie f4-enrichir, P2 : la recette voit l'origine des valeurs d'un article (`factsFromStock`). Pur. */
import { factsFromStock } from '../../../../src/domain/ingredientFacts';
import { patchDeTrous, type FicheEnrichie } from '../../../../src/domain/stock/ficheValeurs';
import type { StockItem } from '../../../../src/types';

const LE = '2026-11-01T10:00:00.000Z';
const base = (more: Partial<StockItem> = {}): StockItem => ({ id: 'A', ref: 'A', name: 'Ambre 60', category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0, reorder: false, ...more }) as StockItem;

describe('factsFromStock : origin', () => {
  it('un EBC rempli en ligne, non vu → ai', () => {
    const { patch } = patchDeTrous(base(), { colorEbc: 60 }, { par: 'en-ligne', source: 'Fiche', niveau: 'repris' }, LE, { lien: { id: 'cle:k', approchee: false, par: 'en-ligne' } });
    expect(factsFromStock({ ...base(), ...patch }).origin).toBe('ai');
  });
  it('une levure du catalogue → manufacturer', () => {
    const lev = base({ category: 'Levure', name: 'Windsor' });
    const { patch } = patchDeTrous(lev, { yeastLab: 'Lallemand' }, { par: 'catalogue', source: 'Catalogue', niveau: 'sur' }, LE, { lien: { id: 'levure:lalbrew-windsor', approchee: false, par: 'catalogue' } });
    expect(factsFromStock({ ...lev, ...patch }).origin).toBe('manufacturer');
  });
  it('D4 (REVUE-code) : une levure du catalogue « à contrôler » (fabricant non lu), non vue → ai', () => {
    const lev = base({ category: 'Levure', name: 'Windsor' });
    const { patch } = patchDeTrous(lev, { yeastLab: 'Lallemand' }, { par: 'catalogue', source: 'Catalogue', niveau: 'repris' }, LE,
      { lien: { id: 'levure:lalbrew-windsor', approchee: false, par: 'catalogue' }, aControler: true });
    expect(factsFromStock({ ...lev, ...patch }).origin).toBe('ai');
  });
  it('après « Vu », ou pour une valeur tapée → personal', () => {
    const { patch } = patchDeTrous(base(), { colorEbc: 60 }, { par: 'en-ligne', source: 'Fiche', niveau: 'repris' }, LE, { lien: { id: 'cle:k', approchee: false, par: 'en-ligne' } });
    const item = { ...base(), ...patch };
    const vu = { ...item, fiche: { ...(item.fiche as unknown as FicheEnrichie), vu: '2026-11-02T00:00:00.000Z' } } as unknown as StockItem;
    expect(factsFromStock(vu).origin).toBe('personal');
    expect(factsFromStock(base({ colorEbc: 60 })).origin).toBe('personal');
    expect(factsFromStock({ ...item, colorEbc: 61 }).origin).toBe('personal');
  });
});
