import { describe, expect, it } from 'vitest';
import * as M from '../../../../src/services/stockLineMatching';
import { art, ligne } from './aide';

/** N3 (voie n1-nom-fr) : toute facture suivante se relie — par le nom imprimé gardé (sûr) ou par le nom français (mêmes règles que le nom imprimé). */
const lie = (l: any, stock: any[]) => M.matchStockLine(l, stock)?.item.name;
const regle = (l: any, stock: any[]) => M.regleProduit(l, stock);

describe('N3 — le lien entre langues par le nom français', () => {
  it('« Wiener Malz » (nameFr « Malt de Vienne ») relie l\'article « Malt de Vienne »', () => {
    expect(lie(ligne('Wiener Malz', { nomFr: 'Malt de Vienne', nomLu: 'Wiener Malz' }), [art('A', 'Malt de Vienne')])).toBe('Malt de Vienne');
    expect(regle(ligne('Wiener Malz', { nomFr: 'Malt de Vienne' }), [art('A', 'Malt de Vienne')]).cas).toBe('meme');
  });
  it('« Vienna Malt » (même nameFr) relie « Malt de Vienne »', () => {
    expect(lie(ligne('Vienna Malt', { nomFr: 'Malt de Vienne', nomLu: 'Vienna Malt' }), [art('A', 'Malt de Vienne')])).toBe('Malt de Vienne');
  });
  it('« Röstgerste » (nameFr « Orge torréfiée ») relie « Orge torréfiée »', () => {
    expect(lie(ligne('Röstgerste', { nomFr: 'Orge torréfiée' }), [art('O', 'Orge torréfiée')])).toBe('Orge torréfiée');
  });
  it('« Haferflocken » (nameFr « Flocons d\'avoine ») relie « Flocons d\'Avoine »', () => {
    expect(lie(ligne('Haferflocken', { nomFr: 'Flocons d\'avoine' }), [art('F', 'Flocons d\'Avoine')])).toBe('Flocons d\'Avoine');
  });
  it('« Haferflocken » face à [Flocons d\'Avoine, Haferflocken] : deux candidats, jamais un lien d\'office', () => {
    const stock = [art('F', 'Flocons d\'Avoine'), art('H', 'Haferflocken')];
    const l = ligne('Haferflocken', { nomFr: 'Flocons d\'avoine' });
    expect(lie(l, stock)).toBeUndefined();
    const r = regle(l, stock);
    expect(r.cas).toBe('ambigu');
    expect((r as any).candidats.map((a: any) => a.name).sort()).toEqual(['Flocons d\'Avoine', 'Haferflocken']);
  });
  it('sans nameFr : « Haferflocken » face aux deux articles garde son lien par les mots exacts (comme avant)', () => {
    const stock = [art('F', 'Flocons d\'Avoine'), art('H', 'Haferflocken')];
    expect(lie(ligne('Haferflocken'), stock)).toBe('Haferflocken');
  });
  it('inchangé : « Premium Pilsner Malz » relie « Premium Pilsner Malt »', () => {
    expect(lie(ligne('Premium Pilsner Malz'), [art('P', 'Premium Pilsner Malt')])).toBe('Premium Pilsner Malt');
  });
});

describe('N3 — le lien par le nom imprimé gardé', () => {
  const vienna = art('V', 'Vienna Malt', 'Malt', 'kg', { nomsFacture: ['Wiener Malz'] });
  it('« Wiener Malz » relie « Vienna Malt » qui garde ce nom (lien sûr, mots du nom gardé)', () => {
    const l = ligne('Wiener Malz', { nomLu: 'Wiener Malz' });
    expect(lie(l, [vienna])).toBe('Vienna Malt');
    expect(M.matchStockLine(l, [vienna])?.pass).toBe(1);
  });
  it('jetons égaux : le nom lu et le nom gardé se lisent du même côté (`side: line`)', () => {
    expect(lie(ligne('wiener  MALZ', { nomLu: 'wiener  MALZ' }), [vienna])).toBe('Vienna Malt');
  });
  it('restes : « Wiener Malz · gemahlen » (description) relie par le nom lu « Wiener Malz »', () => {
    expect(lie(ligne('Wiener Malz · gemahlen', { nomLu: 'Wiener Malz' }), [vienna])).toBe('Vienna Malt');
    expect(lie(ligne('Wiener Malz · gemahlen'), [vienna])).toBeUndefined();
  });
  it('un nom gardé sur deux articles ne donne jamais un lien sûr : ambigu', () => {
    const deux = [vienna, art('M', 'Malt de Vienne', 'Malt', 'kg', { nomsFacture: ['Wiener Malz'] })];
    const l = ligne('Wiener Malz', { nomLu: 'Wiener Malz' });
    expect(lie(l, deux)).toBeUndefined();
    expect(regle(l, deux).cas).toBe('ambigu');
  });
  it('négatifs : le nom gardé passe toutes les autres portes', () => {
    const l = ligne('Wiener Malz', { nomLu: 'Wiener Malz' });
    expect(lie(l, [art('V', 'Vienna Malt', 'Houblon', 'kg', { nomsFacture: ['Wiener Malz'] })])).toBeUndefined(); // catégorie refusée
    expect(lie(l, [art('V', 'Vienna Malt', 'Malt', 'L', { nomsFacture: ['Wiener Malz'] })])).toBeUndefined(); // unité incompatible
    expect(lie(l, [art('V', 'Vienna Malt', 'Divers', 'kg', { nomsFacture: ['Wiener Malz'] })])).toBeUndefined(); // jamais un fourre-tout « sûr »
    expect(lie(ligne('Wiener Malz', { nomLu: 'Wiener Malz', quantity: 0 }), [vienna])).toBeUndefined();
  });
  it('houblon : nom gardé, mais α imprimée différente → rien', () => {
    const cascade = art('C', 'Cascade US', 'Houblon', 'g', { alphaPct: 5.5, nomsFacture: ['Kaskade'] });
    const l = ligne('Kaskade 8,0 %', { unit: 'g', stockCategory: 'houblon', nomLu: 'Kaskade' });
    expect(lie(l, [cascade])).toBeUndefined();
  });
});

describe('N3 — le français ne prête que son nom', () => {
  it('négatifs : autre produit, unité incompatible, catégorie refusée', () => {
    expect(lie(ligne('Wiener Malz', { nomFr: 'Malt de Vienne' }), [art('M', 'Malt de Munich')])).toBeUndefined();
    expect(lie(ligne('Wiener Malz', { nomFr: 'Malt de Vienne' }), [art('A', 'Malt de Vienne', 'Malt', 'L')])).toBeUndefined();
    expect(lie(ligne('Wiener Malz', { nomFr: 'Malt de Vienne' }), [art('A', 'Malt de Vienne', 'Emballage')])).toBeUndefined();
  });
  it('nameFr sans α, α imprimée ≠ article → rien (D215 : l\'α se lit sur le libellé imprimé)', () => {
    const cascade = art('C', 'Houblon Cascade', 'Houblon', 'g', { alphaPct: 5.5 });
    expect(lie(ligne('Kaskade 8,0 %', { unit: 'g', stockCategory: 'houblon', nomFr: 'Houblon Cascade' }), [cascade])).toBeUndefined();
    expect(lie(ligne('Kaskade 5,5 %', { unit: 'g', stockCategory: 'houblon', nomFr: 'Houblon Cascade' }), [cascade])).toBe('Houblon Cascade');
  });
  it('l\'unité de la ligne reste celle du libellé imprimé (unité illisible : jamais devinée)', () => {
    const m = M.matchStockLine(ligne('Wiener Malz', { unit: '', nomFr: 'Malt de Vienne' }), [art('A', 'Malt de Vienne')]);
    expect(m?.unitMissing).toBe(true);
  });
});
