// Rejeu en ligne ff0f822e (08.11), TE-51 : recherche « Nelson » puis « Nouvelle variété » : nom prérempli « Nelson » alors que Nelson Sauvin existe.
import { describe, expect, it } from 'vitest';
import { nomPourNouvelleVariete } from '../../../src/ui/hopIndex/nomNouvelleVariete';

const catalogue = [
  { name: 'Nelson Sauvin', aliases: ['NZ Nelson'] },
  { name: 'Citra', aliases: ['HBC 394'] },
  { name: 'Mosaic', aliases: [] },
];

describe('TE-51 — « Nouvelle variété » ne propose pas un nom qui existe déjà ou presque', () => {
  it('le début d’un nom existant, un mot d’un nom, un alias : champ vide', () => {
    expect(nomPourNouvelleVariete('Nelson', catalogue)).toBe('');
    expect(nomPourNouvelleVariete('nelson sau', catalogue)).toBe('');
    expect(nomPourNouvelleVariete('Sauvin', catalogue)).toBe('');
    expect(nomPourNouvelleVariete('HBC', catalogue)).toBe('');
    expect(nomPourNouvelleVariete('citra', catalogue)).toBe('');
  });
  it('un nom vraiment neuf est repris tel que tapé', () => {
    expect(nomPourNouvelleVariete('  Zappa ', catalogue)).toBe('Zappa');
    expect(nomPourNouvelleVariete('', catalogue)).toBe('');
  });
  it('deux lettres ne désignent aucune variété', () => {
    expect(nomPourNouvelleVariete('Mo', catalogue)).toBe('Mo');
  });
});
