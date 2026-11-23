/**
 * Voie s1-stock — l'identité d'un produit tirée de son libellé (A8, A9, S3, S4) et ce que l'appariement en rend.
 * Casse imprimée gardée dans `name` ; toutes les comparaisons sont sans casse ni accents (REVUE-PLAN Prêt n° 1).
 * Le libellé brut n'est jamais modifié ; une valeur absente n'est jamais 0 ; le poids d'un sachet n'est jamais converti.
 */
import { describe, expect, it } from 'vitest';
import { hasHopWord, hasYeastWord, readProductLabel } from '../../../../src/services/ingredientIdentity';
import { matchStockLine } from '../../../../src/services/stockLineMatching';
import { normalize } from '../../../../src/services/search';
import type { StockItem } from '../../../../src/types';
import factureJson from './fixtures/lignes-372765.json';

const item = (ref: string, name: string, category: string, unit: string): StockItem => ({ id: ref, ref, name, category, unit, currentStock: 1, minStock: 0, reorder: false });
const lire = (libelle: string, unit?: string, quantity?: number) => readProductLabel(libelle, { unit, quantity, hop: hasHopWord(libelle), yeast: hasYeastWord(libelle) });

describe('A8 : le nom propre de chaque ligne de stock de la facture 372765 (sans unité, conditionnement, ®, ™), libellé brut gardé', () => {
  for (const l of factureJson.lignes.filter(x => x.kind === 'stock')) {
    it(`ligne ${l.n} « ${l.libelle} » → ${l.nomPropre}`, () => {
      const identite = lire(l.libelle, l.unite, l.quantite);
      expect(normalize(identite.name)).toBe(normalize(l.nomPropre));
      expect(identite.rawLabel).toBe(l.libelle);
    });
  }
  it('garde la casse imprimée, sans ®', () => {
    expect(lire('CARAMÜNCH® Typ 2 Kg', 'Kg', 1).name).toBe('CARAMÜNCH Typ 2');
    expect(lire('LALLEMAND Windsor 11g', 'Stk', 2).name).toBe('LALLEMAND Windsor');
  });
  it('un « 25 kg » collé au nom reste du texte incertain, jamais effacé', () => {
    const identite = lire('Pilsner 25 kg', 'kg', 1);
    expect(identite.name).toBe('Pilsner 25 kg');
    expect(identite.uncertain).toEqual(['25 kg']);
    expect(identite.packSize).toBeUndefined();
  });
});

describe('A9 / S3 : l’α et la récolte sortent de l’identité, avec leur source « libellé »', () => {
  it('« Target 11.3% » et « Target 11.8% » sont le même produit « Target », α rendue à part', () => {
    const a = lire('Target 11.3%', 'g', 40), b = lire('Target 11.8%', 'g', 40);
    expect(a.name).toBe('Target');
    expect(b.name).toBe('Target');
    expect(a.tokens).toEqual(b.tokens);
    expect(a.alpha).toEqual({ value: 11.3, source: 'libellé' });
    expect(b.alpha).toEqual({ value: 11.8, source: 'libellé' });
    expect(a.deduced).toContain('α 11,3 % (libellé)');
  });
  it('« Cascade 2024 » : récolte rendue à part', () => {
    const identite = lire('Cascade 2024', 'g', 100);
    expect(identite.name).toBe('Cascade');
    expect(identite.harvestYear).toEqual({ value: 2024, source: 'libellé' });
  });
  it('l’inconnu n’est jamais 0 : pas d’α, pas de récolte, pas de poids quand rien n’est imprimé', () => {
    const identite = lire('Galaxy', 'g', 60);
    expect(identite.alpha).toBeUndefined();
    expect(identite.harvestYear).toBeUndefined();
    expect(identite.pieceWeight).toBeUndefined();
  });
  it('hors houblon, « 75% » est de l’identité (acide), « 2007 » aussi (code Wyeast)', () => {
    expect(readProductLabel('Acide phosphorique 75%', { unit: 'L' }).alpha).toBeUndefined();
    expect(readProductLabel('Acide phosphorique 75%', { unit: 'L' }).tokens).toContain('75');
    expect(readProductLabel('Wyeast 2007', { unit: 'g', yeast: true }).harvestYear).toBeUndefined();
    expect(readProductLabel('Wyeast 2007', { unit: 'g', yeast: true }).tokens).toContain('2007');
  });
});

describe('S4 : le poids d’un sachet est lu à part, jamais converti', () => {
  it('« Safale US-05 11,5g » → poids 11,5 g, source libellé ; nom « Safale US-05 »', () => {
    const identite = lire('Safale US-05 11,5g', 'Stk', 2);
    expect(identite.pieceWeight).toEqual({ value: 11.5, unit: 'g', source: 'libellé' });
    expect(identite.name).toBe('Safale US-05');
    expect(identite.deduced).toContain('poids du sachet 11,5 g (libellé)');
    expect(JSON.stringify(identite)).not.toContain('23');
  });
});

describe('ce que l’appariement rend avec la proposition (matchStockLine)', () => {
  it('Target 11.3% ↔ « Target » : proposé, α 11,3 % rendue, aucune différence d’α', () => {
    const m = matchStockLine({ description: 'Target 11.3%', unit: 'g', quantity: 40, vendor: '' }, [item('T', 'Target', 'Houblon', 'g')]);
    expect(m?.item.ref).toBe('T');
    expect(m?.identity.alpha?.value).toBe(11.3);
    expect(m?.deduced).toEqual(['α 11,3 % (libellé)']);
  });
  it('Safale US-05 11,5g × 2 Stk ↔ sachet : équivalence dite, poids non confirmé, quantité et unité de la ligne intactes', () => {
    const m = matchStockLine({ description: 'Safale US-05 11,5g', unit: 'Stk', quantity: 2, vendor: '' }, [item('U', 'Safale US-05', 'Levure', 'sachet')]);
    expect(m?.unitAlias).toEqual({ from: 'Stk', to: 'sachet' });
    expect(m?.weightUnconfirmed).toBe(true);
    expect(m?.deduced).toEqual(['poids du sachet 11,5 g (libellé)']);
  });
  it('le même poids des deux côtés : proposé, aucune marque de poids', () => {
    const m = matchStockLine({ description: 'Safale US-05 11,5 g', unit: 'Stk', quantity: 2, vendor: '' }, [item('U', 'Safale US-05 11,5 g', 'Levure', 'sachet')]);
    expect(m?.item.ref).toBe('U');
    expect(m?.weightUnconfirmed).toBeUndefined();
  });
  it('unité illisible (D214) : proposé, unité à préciser, jamais devinée', () => {
    const m = matchStockLine({ description: 'Maris Otter', unit: '', quantity: 6, vendor: '' }, [item('MO', 'Maris Otter', 'Malt', 'kg')]);
    expect(m?.item.ref).toBe('MO');
    expect(m?.unitMissing).toBe(true);
    expect(m?.unitAlias).toBeUndefined();
  });
});
