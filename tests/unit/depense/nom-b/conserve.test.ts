import { beforeEach, describe, expect, it, vi } from 'vitest';
/** N2 (voie n1-nom-fr) : l'article créé garde le nom imprimé lu (jamais le libellé retapé) ; ajout seulement, aucun article d'avant B n'est touché. */
vi.mock('../../../../src/services/storage', async () => (await import('./ecriture-aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./ecriture-aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./ecriture-aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./ecriture-aide')).documentsSimules);
import * as entry from '../../../../src/services/purchaseEntry';
import * as M from '../../../../src/services/stockLineMatching';
import { articlesEcrits, putsStock, remettre, saisie } from './ecriture-aide';
import { art, brouillon, ligne } from './aide';

beforeEach(remettre);

describe('N2 — le nom imprimé gardé à la création', () => {
  it('« Wiener Malz » + nameFr : l\'article s\'appelle « Malt de Vienne » et garde « Wiener Malz »', () => {
    entry.savePurchase(saisie([brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne', nomLu: 'Wiener Malz' })]));
    expect(articlesEcrits()).toHaveLength(1);
    expect(articlesEcrits()[0]).toMatchObject({ name: 'Malt de Vienne', nomsFacture: ['Wiener Malz'], unit: 'Kg', currentStock: 5 });
  });
  it('libellé retouché à la main : le nom gardé est le nom LU, jamais le retapé', () => {
    entry.savePurchase(saisie([brouillon('l1', 'Mon Vienna', { nomLu: 'Wiener Malz' })]));
    expect(articlesEcrits()[0]).toMatchObject({ name: 'Mon Vienna', nomsFacture: ['Wiener Malz'] });
  });
  it('sans nomLu (saisie à la main, brouillon d\'avant B) : aucun nom gardé', () => {
    entry.savePurchase(saisie([brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne' })]));
    expect(articlesEcrits()[0].name).toBe('Malt de Vienne');
    expect(Object.keys(articlesEcrits()[0])).not.toContain('nomsFacture');
  });
  it('sans nameFr (hors ligne, table vide) : le nom imprimé seul, rien à garder (égal au nom)', () => {
    entry.savePurchase(saisie([brouillon('l1', 'Wiener Malz', { nomLu: 'Wiener Malz' })]));
    expect(articlesEcrits()[0].name).toBe('Wiener Malz');
    expect(Object.keys(articlesEcrits()[0])).not.toContain('nomsFacture');
  });
  it('hors ligne, table de noms renseignée : nom français ET nom gardé, un seul écrit de création', () => {
    entry.savePurchase(saisie([brouillon('l1', 'Wiener Malz', { nameFr: 'Malt Viennois', nomLu: 'Wiener Malz' })]));
    expect(articlesEcrits()).toHaveLength(1);
    expect(articlesEcrits()[0]).toMatchObject({ name: 'Malt Viennois', nomsFacture: ['Wiener Malz'] });
    expect(putsStock()).toHaveLength(0);
  });
  it('le nom gardé n\'est jamais écrit s\'il égale le nom de l\'article (mots normalisés)', () => {
    entry.savePurchase(saisie([brouillon('l1', 'Wiener Malz', { nameFr: 'wiener  MALZ', nomLu: 'Wiener Malz' })]));
    expect(Object.keys(articlesEcrits()[0])).not.toContain('nomsFacture');
  });
  it('un article d\'avant B (sans le champ) se relie comme avant', () => {
    const ancien = art('A', 'Premium Pilsner Malt');
    expect(M.matchStockLine(ligne('Premium Pilsner Malz'), [ancien])?.item.name).toBe('Premium Pilsner Malt');
    expect(M.regleProduit(ligne('Wiener Malz'), [ancien]).cas).toBe('inconnu');
  });
});
