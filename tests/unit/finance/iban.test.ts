import { describe, expect, it } from 'vitest';
import { ibanAffiche, ibanValide } from '../../../src/domain/finance/iban';

// Exemples publics de la norme (CH93 0076 2011 6238 5295 7 est l'IBAN d'exemple de la documentation suisse).
describe('IBAN', () => {
  it('accepte un IBAN suisse valide, avec ou sans espaces, en minuscules aussi', () => {
    expect(ibanValide('CH93 0076 2011 6238 5295 7')).toBe(true);
    expect(ibanValide('ch9300762011623852957')).toBe(true);
    expect(ibanValide('DE89 3704 0044 0532 0130 00')).toBe(true);
  });
  it('refuse une clé fausse, une longueur fausse, du texte', () => {
    expect(ibanValide('CH93 0076 2011 6238 5295 8')).toBe(false);
    expect(ibanValide('CH93 0076 2011 6238 5295')).toBe(false);
    expect(ibanValide('abc')).toBe(false);
    expect(ibanValide('')).toBe(false);
    expect(ibanValide(undefined)).toBe(false);
  });
  it('groupe par quatre pour l’affichage', () => {
    expect(ibanAffiche('ch9300762011623852957')).toBe('CH93 0076 2011 6238 5295 7');
  });
});
