import { beforeEach, describe, expect, it, vi } from 'vitest';
/** Plan § D-j (voie n1-nom-fr) : jamais deux articles du même nom français, pour toute catégorie ; sans nameFr, le comportement d'avant. */
vi.mock('../../../../src/services/storage', async () => (await import('./ecriture-aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./ecriture-aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./ecriture-aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./ecriture-aide')).documentsSimules);
import * as entry from '../../../../src/services/purchaseEntry';
import { remettre, saisie } from './ecriture-aide';
import { art, brouillon } from './aide';

beforeEach(remettre);
const erreurs = (lignes: any[], stock: any[]) => entry.validatePurchase(saisie(lignes), { rawMaterials: stock, cleaning: [], equipment: [] } as any, []);
const existe = (e: string[]) => e.filter(m => /existe déjà|porte déjà ce nom/.test(m));

describe('un nom français déjà pris ne crée pas un second article', () => {
  it('houblon/malt : ligne `new` touchée dont le français désigne un article → refus au message existant', () => {
    const e = erreurs([brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne' })], [art('A', 'Malt de Vienne')]);
    expect(existe(e).join('|')).toMatch(/existe déjà/);
  });
  it('non dérivé (sucre) : même refus quand le français désigne un article du stock', () => {
    const e = erreurs([brouillon('l1', 'Rohrzucker', { stockCategory: 'sucre', nameFr: 'Sucre de canne' })], [art('S', 'Sucre de canne', 'Sucre')]);
    expect(existe(e)).toHaveLength(1);
  });
  it('non dérivé : deux lignes de la saisie au même nom français → refus « Un article porte déjà ce nom »', () => {
    const e = erreurs([brouillon('l1', 'Rohrzucker', { stockCategory: 'sucre', nameFr: 'Sucre de canne' }), brouillon('l2', 'Cane sugar', { stockCategory: 'sucre', nameFr: 'Sucre de canne' })], []);
    expect(existe(e).join('|')).toMatch(/porte déjà ce nom/);
  });
  it('sans nameFr, rien ne change pour un article non dérivé (comportement d\'avant)', () => {
    const e = erreurs([brouillon('l1', 'Sucre de canne', { stockCategory: 'sucre' })], [art('S', 'Sucre de canne', 'Sucre')]);
    expect(existe(e)).toHaveLength(0);
  });
});
