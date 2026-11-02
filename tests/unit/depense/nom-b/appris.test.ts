import { beforeEach, describe, expect, it, vi } from 'vitest';
/** N4 (voie n1-nom-fr) : le lien appris. Un lien confirmé vers un article ajoute le nom imprimé lu à ses noms gardés (champ seul, `merge`). */
vi.mock('../../../../src/services/storage', async () => (await import('./ecriture-aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./ecriture-aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./ecriture-aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./ecriture-aide')).documentsSimules);
import * as entry from '../../../../src/services/purchaseEntry';
import { avecStock, etat, putsStock, remettre, saisie } from './ecriture-aide';
import { art, brouillon } from './aide';

beforeEach(remettre);
const relie = (id: string, description: string, ref: string, more: Record<string, unknown> = {}) => brouillon(id, description, { stockAction: 'existing', stockRef: ref, nomLu: description, ...more });

describe('N4 — le nom imprimé s\'ajoute au lien confirmé', () => {
  it('« Vienna Malt » relié à « Malt de Vienne » : un put merge de nomsFacture seul', () => {
    avecStock(art('A', 'Malt de Vienne'));
    entry.savePurchase(saisie([relie('l1', 'Vienna Malt', 'A')]));
    expect(putsStock()).toEqual([{ ref: 'A', data: { nomsFacture: ['Vienna Malt'] }, options: { merge: true } }]);
    expect(Object.keys(putsStock()[0].data)).not.toContain('currentStock');
    expect(etat.writes.some(w => w[0] === 'adjust' && w[2] === 'A')).toBe(true);
  });
  it('un lien venu du français : rien n\'est écrit avant `savePurchase` (ni à la lecture, ni à l\'arrivée du nom)', () => {
    avecStock(art('A', 'Malt de Vienne'));
    const s = saisie([relie('l1', 'Vienna Malt', 'A', { nameFr: 'Malt de Vienne' })]);
    entry.validatePurchase(s, etat.stocks as any, []); // la validation ne fait que lire
    expect(putsStock()).toHaveLength(0);
    expect(etat.writes).toHaveLength(0);
    entry.savePurchase(s);
    expect(putsStock()).toHaveLength(1);
  });
  it('double clic : la même saisie n\'écrit qu\'une fois', () => {
    avecStock(art('A', 'Malt de Vienne'));
    const s = saisie([relie('l1', 'Vienna Malt', 'A')]);
    entry.savePurchase(s); entry.savePurchase(s);
    expect(putsStock()).toHaveLength(1);
  });
  it('un nom déjà gardé ne se répète pas (2e facture « Vienna Malt »)', () => {
    avecStock(art('A', 'Malt de Vienne', 'Malt', 'kg', { nomsFacture: ['Vienna Malt'] }));
    entry.savePurchase(saisie([relie('l1', 'Vienna Malt', 'A')]));
    expect(putsStock()).toHaveLength(0);
  });
  it('le nom lu égal au nom de l\'article : aucun écrit', () => {
    avecStock(art('A', 'Malt de Vienne'));
    entry.savePurchase(saisie([relie('l1', 'Malt de Vienne', 'A')]));
    expect(putsStock()).toHaveLength(0);
  });
  it('sans nomLu : aucun écrit', () => {
    avecStock(art('A', 'Malt de Vienne'));
    entry.savePurchase(saisie([relie('l1', 'Vienna Malt', 'A', { nomLu: undefined })]));
    expect(putsStock()).toHaveLength(0);
  });
  it('plafond de 8 noms : au-delà rien n\'est écrit, aucun nom retiré', () => {
    avecStock(art('A', 'Malt de Vienne', 'Malt', 'kg', { nomsFacture: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'] }));
    entry.savePurchase(saisie([relie('l1', 'Vienna Malt', 'A')]));
    expect(putsStock()).toHaveLength(0);
  });
  it('un article de catégorie « Divers » n\'apprend rien (jamais un fourre-tout « sûr »)', () => {
    avecStock(art('D', 'Divers malt', 'Divers'));
    entry.savePurchase(saisie([relie('l1', 'Vienna Malt', 'D')]));
    expect(putsStock()).toHaveLength(0);
  });
  it('lien manuel vers B quand le nom est gardé sur A : le nom se déplace (retiré de A, ajouté à B)', () => {
    avecStock(art('A', 'Vienna Malt', 'Malt', 'kg', { nomsFacture: ['Wiener Malz'] }), art('B', 'Malt de Vienne'));
    entry.savePurchase(saisie([relie('l1', 'Wiener Malz', 'B')]));
    const puts = putsStock();
    expect(puts.find(p => p.ref === 'B')?.data).toEqual({ nomsFacture: ['Wiener Malz'] });
    expect(puts.find(p => p.ref === 'A')?.data).toEqual({ nomsFacture: [] });
  });
  it('deux lignes de la saisie vers le même article : un seul put, les deux noms réunis', () => {
    avecStock(art('A', 'Malt de Vienne'));
    entry.savePurchase(saisie([relie('l1', 'Vienna Malt', 'A'), relie('l2', 'Wiener Malz', 'A')]));
    expect(putsStock()).toHaveLength(1);
    expect(putsStock()[0].data.nomsFacture.sort()).toEqual(['Vienna Malt', 'Wiener Malz']);
  });
});
