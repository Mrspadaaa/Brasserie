// @vitest-environment jsdom
/* BE-97 (banc du 08.11) : renommer un tarif le faisait disparaître (4 tarifs → 1), et « Enregistrer » sans rien changer
   en retirait deux autres. Cause : le tarif réécrit portait encore l'`id` de l'ancien document ; `FirestoreRepo.remove(ancien id)`
   filtre `d.id !== id && d.__docId !== id` et retirait donc aussi la ligne neuve. Reproduit en mode local (?dev-local),
   avec des documents posés comme le fait le banc (id technique propre, hors du nom du produit). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';
import type { PricingItem } from '../../src/types';

const tarif = (product: string, ci: number, prix: number): PricingItem => {
  const costTotal = ci + 1;
  return { product, costIngredients: ci, costLabor: 0, costFixed: 1, costTotal, priceHT: prix, marginCHF: prix - costTotal, marginPercent: Math.round(((prix - costTotal) / prix) * 1000) / 10 };
};
const NOMS = ['Pale Ale 33 cl', 'Stout export 75 cl', 'Fût 20 L — Hazy IPA', 'Bière de saison 33 cl'];
const noms = () => StorageService.getTarifs().map(t => t.product).sort();
/** Ce que fait ClientsTab quand l'utilisateur renomme puis enregistre (src/components/tabs/ClientsTab.tsx, onSave). */
const renommer = (ancien: string, nouveau: PricingItem) =>
  StorageService.saveTarifs(StorageService.getTarifs().map(current => current.product === ancien ? nouveau : current));
/** Une fiche telle que la feuille de tarif la rend : copie de la ligne lue, champs modifiés par-dessus. */
const feuille = (product: string) => ({ ...StorageService.getTarifs().find(t => t.product === product)! });

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
});
afterEach(() => { for (const t of StorageService.getTarifs()) StorageService.deleteTarif(t.product); FirestoreRepo.stopSync(); });

describe('Tarifs : renommer, enregistrer, supprimer ne perdent jamais un autre tarif', () => {
  describe('fiches créées par l’application', () => {
    beforeEach(() => { StorageService.saveTarifs(NOMS.map((n, i) => tarif(n, 1 + i, 5 + i))); });

    it('renommer garde le tarif sous son nouveau nom, avec ses valeurs, et ne touche pas aux trois autres', () => {
      const avant = feuille('Pale Ale 33 cl');
      renommer('Pale Ale 33 cl', { ...avant, product: 'Pale Ale 33 cl bis' });
      expect(noms()).toEqual([...NOMS.filter(n => n !== 'Pale Ale 33 cl'), 'Pale Ale 33 cl bis'].sort());
      const apres = feuille('Pale Ale 33 cl bis');
      expect(apres.priceHT).toBe(avant.priceHT);
      expect(apres.costIngredients).toBe(avant.costIngredients);
      expect(StorageService.getTarifs().find(t => t.product === 'Pale Ale 33 cl')).toBeUndefined();
      expect(feuille('Stout export 75 cl').priceHT).toBe(6);
    });

    it('renommer deux fois de suite garde un seul tarif sous le dernier nom', () => {
      renommer('Pale Ale 33 cl', { ...feuille('Pale Ale 33 cl'), product: 'Pale Ale bis' });
      renommer('Pale Ale bis', { ...feuille('Pale Ale bis'), product: 'Pale Ale ter' });
      expect(noms()).toEqual([...NOMS.filter(n => n !== 'Pale Ale 33 cl'), 'Pale Ale ter'].sort());
    });

    it('enregistrer sans rien changer garde les quatre tarifs', () => {
      StorageService.updateTarif(feuille('Stout export 75 cl'));
      expect(noms()).toEqual([...NOMS].sort());
    });

    it('supprimer un tarif garde les trois autres', () => {
      StorageService.deleteTarif('Fût 20 L — Hazy IPA');
      expect(noms()).toEqual(NOMS.filter(n => n !== 'Fût 20 L — Hazy IPA').sort());
    });
  });

  describe('fiches posées par le banc : id technique propre, accents et tiret final non retirés', () => {
    const bancSlug = (p: string) => p.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    beforeEach(() => {
      NOMS.forEach((n, i) => { const id = bancSlug(n); FirestoreRepo.put('tarifs', id, { ...tarif(n, 1 + i, 5 + i), id }); });
    });

    it('enregistrer sans rien changer garde les quatre tarifs', () => {
      expect(noms()).toEqual([...NOMS].sort());
      StorageService.updateTarif(feuille('Stout export 75 cl'));
      expect(noms()).toEqual([...NOMS].sort());
    });

    it('renommer garde le tarif sous son nouveau nom et les trois autres', () => {
      renommer('Pale Ale 33 cl', { ...feuille('Pale Ale 33 cl'), product: 'Pale Ale 33 cl bis' });
      expect(noms()).toEqual([...NOMS.filter(n => n !== 'Pale Ale 33 cl'), 'Pale Ale 33 cl bis'].sort());
    });

    it('renommer un tarif aux accents garde les quatre', () => {
      renommer('Fût 20 L — Hazy IPA', { ...feuille('Fût 20 L — Hazy IPA'), product: 'Fût 30 L — Hazy IPA' });
      expect(noms()).toEqual([...NOMS.filter(n => n !== 'Fût 20 L — Hazy IPA'), 'Fût 30 L — Hazy IPA'].sort());
    });

    it('supprimer garde les trois autres', () => {
      StorageService.deleteTarif('Stout export 75 cl');
      expect(noms()).toEqual(NOMS.filter(n => n !== 'Stout export 75 cl').sort());
    });
  });
});
