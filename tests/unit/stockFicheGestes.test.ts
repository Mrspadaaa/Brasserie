// Chasse stock V4 : règles pures de la fiche (STM-5, 9, 13, 15, STC-6, 7, 19).
import { describe, expect, it } from 'vitest';
import { champsChanges, phraseEcrit, phraseSeuil, quantiteArticle, refusDit, uniteAccordee } from '../../src/domain/stock/ficheArticle';
import { datesAffichees } from '../../src/domain/stock/mouvementsArticle';
import { ficheAEnregistrer } from '../../src/domain/stock/regles';
import type { StockItem } from '../../src/types';

const art = (o: Partial<StockItem> = {}): StockItem =>
  ({ id: 'RM-1', ref: 'MP-001', name: 'Lactose', category: 'Divers', unit: 'kg', currentStock: 2, reorder: false, supplier: 'A', ...o }) as StockItem;

describe('quantiteArticle / uniteAccordee', () => {
  it('accorde pièce et sachet au nombre', () => {
    expect(quantiteArticle(200, 'pièce')).toBe('200 pièces');
    expect(quantiteArticle(1, 'pièce')).toBe('1 pièce');
    expect(quantiteArticle(1.5, 'sachet')).toBe('1,5 sachet');
    expect(uniteAccordee(3, 'pièce')).toBe('pièces');
  });
  it('valeur absente : « ? »', () => expect(quantiteArticle(undefined, 'kg')).toBe('?'));
});

describe('seuil vidé ou à 0', () => {
  it('vidé : le seuil reste inconnu, jamais 0', () => {
    const v = art({ minStock: 5 });
    const f = ficheAEnregistrer(v, v, { ...v, minStock: undefined });
    expect(f.minStock).toBeUndefined();
    expect(f.reorder).toBe(false);
  });
  it('0 est un seuil écrit', () => {
    const v = art();
    expect(ficheAEnregistrer(v, v, { ...v, minStock: 0 }).minStock).toBe(0);
  });
  it('phraseSeuil distingue vide, 0 et positif', () => {
    expect(phraseSeuil(undefined)).toMatch(/sans seuil/);
    expect(phraseSeuil(0)).toMatch(/épuisement/);
    expect(phraseSeuil(4)).toMatch(/sous ce niveau/);
  });
});

describe('datesAffichees', () => {
  it('masque une date répétée sur la ligne suivante', () => {
    expect(datesAffichees(['1.11', '1.11', '2.11', null, '2.11'])).toEqual(['1.11', null, '2.11', null, '2.11']);
  });
});

describe('champsChanges', () => {
  it('identique ou vide équivalent : aucun changement', () => {
    expect(champsChanges(art(), art({ supplier: ' A ' }))).toEqual([]);
    expect(champsChanges(art({ lot: undefined } as Partial<StockItem>), art({ supplier: 'A' }))).toEqual([]);
  });
  it('un champ modifié est listé', () => {
    expect(champsChanges(art(), art({ supplier: 'B' })).length).toBe(1);
    expect(champsChanges(art(), art({ name: 'Autre' })).length).toBe(1);
  });
});

describe('phraseEcrit', () => {
  it('dit renommage, seuil, ou mise à jour', () => {
    expect(phraseEcrit(art(), art({ name: 'Sucre' }))).toBe('Enregistré · renommé en « Sucre »');
    expect(phraseEcrit(art({ minStock: 3 }), art({ minStock: undefined }))).toBe('Enregistré · seuil retiré');
    expect(phraseEcrit(art(), art({ minStock: 2 }))).toMatch(/^Enregistré · seuil 2 kg/);
    expect(phraseEcrit(art(), art({ supplier: 'B' }))).toBe('Enregistré · fiche mise à jour');
  });
});

describe('refusDit', () => {
  it('traduit le refus « supérieur au théorique », laisse les autres', () => {
    expect(refusDit('Stock saisi supérieur au théorique')).toMatch(/Compté/);
    expect(refusDit('Autre refus')).toBe('Autre refus');
  });
});
