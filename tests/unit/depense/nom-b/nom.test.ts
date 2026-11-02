import { describe, expect, it } from 'vitest';
import * as AN from '../../../../src/domain/stock/articleNeuf';
import { nomAffiche } from '../../../../src/ui/depense/etat';
import { art, brouillon } from './aide';

/** N1 (voie n1-nom-fr) : un nouvel article venu d'une ligne lue entre sous son nom français ; le nom tapé gagne ; sans `nameFr`, le nom imprimé. */
const neuf = (ligne: any, stock: any[] = [], tape?: string, virtuels: any[] = []) => AN.articleNeufDe((AN.ligneDeBrouillon as any)(ligne), stock, {}, tape, virtuels);

describe('N1 — le nom au stock', () => {
  it('« Wiener Malz » + nameFr « Malt de Vienne » : l\'article neuf s\'appelle « Malt de Vienne »', () => {
    const n = neuf(brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne' }));
    expect(n.name).toBe('Malt de Vienne');
    expect(n.nomPropose).toBe('Malt de Vienne');
  });
  it('sans nameFr : le nom imprimé, comme avant', () => {
    expect(neuf(brouillon('l1', 'Wiener Malz')).name).toBe('Wiener Malz');
  });
  it('le nom que le brasseur a tapé gagne toujours', () => {
    expect(neuf(brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne' }), [], 'Mon Vienna').name).toBe('Mon Vienna');
  });
  it('le deux-points final du français tombe', () => {
    expect(neuf(brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne :' })).name).toBe('Malt de Vienne');
  });
  it('nomFrPropre est nomAffiche (6 cas)', () => {
    for (const cas of ['Malt de Vienne', 'Malt de Vienne :', 'Flocons d\'avoine', 'Orge torréfiée', 'Houblon Cascade 7,5 %', 'Levure sèche']) {
      expect((AN as any).nomFrPropre(cas)).toBe(nomAffiche(cas));
    }
  });
  it('un article non dérivé se nomme aussi en français (flocons, sucre, emballage, levure)', () => {
    const cas: Array<[any, string]> = [
      [brouillon('l1', 'Rohrzucker', { stockCategory: 'sucre', nameFr: 'Sucre de canne' }), 'Sucre de canne'],
      [brouillon('l2', 'Flaschen 0,33 l', { kind: 'packaging', stockCategory: 'emballage', nameFr: 'Bouteilles 0,33 l' }), 'Bouteilles 0,33 l'],
      [brouillon('l3', 'Trockenhefe Fermentis US-05', { stockCategory: 'levure', nameFr: 'Levure sèche Fermentis US-05' }), 'Levure sèche Fermentis US-05'],
      [brouillon('l4', 'Haferflocken', { stockCategory: 'cereale', nameFr: 'Flocons d\'avoine' }), 'Flocons d\'avoine'],
      [brouillon('l5', 'Röstgerste', { stockCategory: 'cereale', nameFr: 'Orge torréfiée' }), 'Orge torréfiée'],
    ];
    for (const [ligne, attendu] of cas) expect(neuf(ligne).name).toBe(attendu);
    expect(neuf(cas[0][0]).derive).toBe(false);
  });
  it('« Malt de Vienne » déjà au stock : la règle dit `meme` (pas de second article)', () => {
    const n = neuf(brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne' }), [art('A', 'Malt de Vienne')]);
    expect(n.regle.cas).toBe('meme');
  });
  it('deux lignes de même nameFr dans la saisie : la seconde prend « bis » (nomsPris, S6)', () => {
    const premiere = neuf(brouillon('l1', 'Wiener Malz', { nameFr: 'Malt de Vienne' }));
    const seconde = neuf(brouillon('l2', 'Vienna Malt', { nameFr: 'Malt de Vienne' }), [], undefined, [{ nom: premiere.name }]);
    expect(seconde.name).toBe('Malt de Vienne bis');
  });
  it('houblon : nom français, α et origine du libellé imprimé (jamais du français)', () => {
    const n = neuf(brouillon('l1', 'Cascade 7,5 % CH', { unit: 'g', stockCategory: 'houblon', nameFr: 'Houblon Cascade' }));
    expect(n.name).toMatch(/Cascade/);
    expect(n.alphaPct).toBe(7.5);
    expect(n.origin).toBe('CH');
  });
});
