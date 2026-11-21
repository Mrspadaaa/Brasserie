import { describe, expect, it } from 'vitest';
import { baseMateriel, nomParDefaut, plusGrandNumero, premierLibre } from '../../src/domain/nomParDefaut';

describe('nomParDefaut (D396 : G3 avec le nom posé de G1)', () => {
  it('événement : la rangée et la semaine, puis le numéro libre', () => {
    expect(nomParDefaut({ genre: 'evenement', rangee: 'Travaux', semaine: 47 })).toBe('Travaux · S47');
    expect(nomParDefaut({ genre: 'evenement', rangee: 'Travaux', semaine: 47 }, ['Travaux · S47'])).toBe('Travaux · S47 · 2');
    expect(nomParDefaut({ genre: 'evenement', rangee: 'Papiers', semaine: 1 }, ['travaux · s1'])).toBe('Papiers · S1');
  });

  it('recette : « IPA n° k », k = plus grand numéro existant + 1, où qu’il soit dans le nom', () => {
    expect(nomParDefaut({ genre: 'recette', style: 'IPA' }, ['ZZ TEST IPA n° 1', 'ZZ TEST IPA n° 2'])).toBe('IPA n° 3');
    expect(nomParDefaut({ genre: 'recette', style: 'IPA' }, ['IPA n° 7 — Citra', 'IPA #2'])).toBe('IPA n° 8');
    expect(nomParDefaut({ genre: 'recette', style: 'IPA' }, ['NEIPA n° 4', 'Black IPA'])).toBe('IPA n° 1');
    expect(nomParDefaut({ genre: 'recette', style: 'Bière de garde' }, ['biere de garde no 2'])).toBe('Bière de garde n° 3');
    expect(nomParDefaut({ genre: 'recette' }, [])).toBe('Recette n° 1');
  });

  it('matériel : le projet du carnet d’abord, sinon la catégorie', () => {
    expect(nomParDefaut({ genre: 'materiel', projet: 'Pompe de brassage', categorie: 'Brassage' })).toBe('Pompe de brassage');
    expect(nomParDefaut({ genre: 'materiel', categorie: 'Mesure' })).toBe('Matériel de mesure');
    expect(nomParDefaut({ genre: 'materiel', categorie: 'Atelier' })).toBe("Matériel d'atelier");
    expect(nomParDefaut({ genre: 'materiel', categorie: 'Embouteillage' })).toBe("Matériel d'embouteillage");
    expect(nomParDefaut({ genre: 'materiel' })).toBe('Matériel');
    expect(nomParDefaut({ genre: 'materiel', categorie: 'Mesure' }, ['Materiel de mesure', 'Matériel de mesure 2'])).toBe('Matériel de mesure 3');
  });

  it('client et idée : pas de nom par défaut (le texte est la chose)', () => {
    expect(nomParDefaut({ genre: 'client' })).toBeNull();
    expect(nomParDefaut({ genre: 'idee' })).toBeNull();
  });

  it('aides : numéros et noms libres', () => {
    expect(plusGrandNumero('IPA', [])).toBe(0);
    expect(plusGrandNumero('IPA', ['IPA n°12', 'IPA nº 3'])).toBe(12);
    expect(premierLibre('Pompe', ['pompe', 'Pompe 2'])).toBe('Pompe 3');
    expect(baseMateriel('  ')).toBe('Matériel');
  });
});
