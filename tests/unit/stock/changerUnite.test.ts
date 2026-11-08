import { describe, expect, it } from 'vitest';
import { changerUniteArticle } from '../../../src/domain/stock/changerUnite';
import type { StockItem } from '../../../src/types';

// AM n° 8 : l'unité d'un article est fixe dès qu'il a un stock, un seuil ou un maximum. La changer convertit les trois dans la même famille d'unités ;
// entre deux familles (kg → sachet), le changement est refusé avec son motif. Avant : 25 kg devenait 25 g.
const malt = (more: Partial<StockItem> = {}): StockItem => ({ ref: 'M1', name: 'Pilsner', category: 'Malt', unit: 'kg', currentStock: 25, minStock: 5, maxStock: 50, reorder: false, ...more } as StockItem);

describe('AM n° 8 : changer l’unité d’un article en stock', () => {
  it('kg → g : 25 kg valent 25 000 g ; seuil et maximum suivent', () => {
    const r = changerUniteArticle(malt(), 'g', false);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.item.unit).toBe('g'); expect(r.item.currentStock).toBe(25000); expect(r.item.minStock).toBe(5000); expect(r.item.maxStock).toBe(50000); expect(r.note).toMatch(/25 kg/); }
  });
  it('g → kg : 250 g valent 0,25 kg, sans perte aux petites quantités', () => {
    const r = changerUniteArticle(malt({ unit: 'g', currentStock: 250, minStock: 0.4, maxStock: undefined }), 'kg', false);
    expect(r.ok && r.item.currentStock).toBe(0.25);
    expect(r.ok && r.item.minStock).toBe(0.0004);
    expect(r.ok && r.item.maxStock).toBeUndefined();
  });
  it('kg → sachet : refusé, avec le motif, l’article reste inchangé', () => {
    const r = changerUniteArticle(malt(), 'sachet', false);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.refus).toMatch(/kg.*sachet.*pas de la même famille/);
  });
  it('kg → L : famille masse contre volume : refusé', () => {
    expect(changerUniteArticle(malt(), 'L', false).ok).toBe(false);
  });
  it('article vide (ni stock, ni seuil, ni maximum, aucun brassin) : l’unité se choisit librement', () => {
    const r = changerUniteArticle(malt({ currentStock: 0, minStock: 0, maxStock: undefined }), 'sachet', false);
    expect(r.ok && r.item.unit).toBe('sachet');
  });
  it('article vide mais réservé par un brassin : famille fixe', () => {
    expect(changerUniteArticle(malt({ currentStock: 0, minStock: 0, maxStock: undefined }), 'sachet', true).ok).toBe(false);
    expect(changerUniteArticle(malt({ currentStock: 0, minStock: 0, maxStock: undefined }), 'g', true).ok).toBe(true);
  });
  it('même unité (casse, alias) : rien ne change', () => {
    const r = changerUniteArticle(malt(), 'KG', false);
    expect(r.ok && r.item.currentStock).toBe(25);
    expect(r.ok && r.note).toBe('');
  });
});
