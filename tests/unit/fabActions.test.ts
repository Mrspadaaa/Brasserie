import { describe, expect, it } from 'vitest';
import { fabActionFor } from '../../src/domain/fabActions';

// #114 : sur le tableau de bord comme sur Finances, l'action principale du +
// crée une écriture comptable ; les autres saisies restent dans le menu, dessous.
describe('Bouton + · action principale « écriture comptable » (#114)', () => {
  it('le tableau de bord propose la nouvelle écriture, plus le sommaire des saisies', () => {
    expect(fabActionFor('dashboard')).toEqual({ intent: 'newTransaction', label: 'Nouvelle écriture', hint: 'Dépense saisie à la main' });
  });

  it('Finances garde exactement la même action', () => {
    expect(fabActionFor('finances')).toEqual(fabActionFor('dashboard'));
  });

  it('un sous-onglet inconnu retombe toujours sur la saisie rapide', () => {
    expect(fabActionFor('stocks', 'inexistant' as never).intent).toBe('quickAction');
  });
});
