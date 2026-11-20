import { describe, expect, it } from 'vitest';
import { titreAffiche } from '../../src/ui/carnets/titre';

describe('titreAffiche : majuscule initiale, sauf un nom qui ne la prend pas', () => {
  it('met la majuscule à une phrase', () => {
    expect(titreAffiche('embouteillage')).toBe('Embouteillage');
    expect(titreAffiche('écran de la salle')).toBe('Écran de la salle');
  });
  it('laisse un domaine, une adresse ou un nom à casse propre tels quels', () => {
    expect(titreAffiche('exemple.invalid')).toBe('exemple.invalid');
    expect(titreAffiche('exemple.invalid/pompe et filtre')).toBe('exemple.invalid/pompe et filtre');
    expect(titreAffiche('www.brouwland.com')).toBe('www.brouwland.com');
    expect(titreAffiche('iPhone support')).toBe('iPhone support');
    expect(titreAffiche('eBay pompe')).toBe('eBay pompe');
  });
});
