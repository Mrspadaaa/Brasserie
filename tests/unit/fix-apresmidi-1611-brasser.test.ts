// Jeu en ligne 16.11 après-midi, feuille « Brasser » (d1b) : deux défauts mineurs.
// 1. Le titre du mois est tronqué : « Nove. – déce. » ; attendu l'abréviation française : « Nov. – déc. ».
// 2. Pluriel : « 1 jours depuis aujourd'hui » ; attendu « 1 jour ».
import { describe, expect, it } from 'vitest';
import { titreDesMois, joursDepuis } from '../../src/ui/production/brasser/FeuilleBrasser';

describe('feuille Brasser : titre des mois', () => {
  it('deux mois : abréviations françaises, sans troncature', () => {
    expect(titreDesMois(['novembre', 'décembre'])).toBe('Nov. – déc.');
    expect(titreDesMois(['juillet', 'août'])).toBe('Juil. – août');
    expect(titreDesMois(['février', 'mars'])).toBe('Févr. – mars');
    expect(titreDesMois(['mai', 'juin'])).toBe('Mai – juin');
    expect(titreDesMois(['septembre', 'octobre'])).toBe('Sept. – oct.');
  });
  it('un seul mois : le mot entier', () => {
    expect(titreDesMois(['novembre'])).toBe('Novembre');
  });
});

describe('feuille Brasser : jours depuis aujourd’hui', () => {
  it('accorde le pluriel', () => {
    expect(joursDepuis(0)).toBe("aujourd'hui");
    expect(joursDepuis(1)).toBe("1 jour depuis aujourd'hui");
    expect(joursDepuis(5)).toBe("5 jours depuis aujourd'hui");
  });
});
