import { describe, expect, it } from 'vitest';
import { messageJourFermentable } from '../../../src/domain/fermentables/jours';

// AM-5 (08.11) : « Jour J+ sans plafond ni lien avec le programme de fermentation ».
describe('messageJourFermentable', () => {
  const fruit = { name: 'Purée de mangue', use: 'fermentation' as const, dayOffset: 3 };
  it('dans le programme : rien', () => {
    expect(messageJourFermentable(fruit, 14)).toBeNull();
    expect(messageJourFermentable({ ...fruit, dayOffset: 14 }, 14)).toBeNull();
  });
  it('après la fin du programme : le dit, avec les deux nombres', () => {
    const m = messageJourFermentable({ ...fruit, dayOffset: 60 }, 14)!;
    expect(m).toContain('J+60');
    expect(m).toContain('14 j');
  });
  it('sans programme connu : seul le plafond d’un an s’applique', () => {
    expect(messageJourFermentable({ ...fruit, dayOffset: 60 }, null)).toBeNull();
    expect(messageJourFermentable({ ...fruit, dayOffset: 400 }, null)).toMatch(/un an/);
  });
  it('un ingrédient qui n’est pas ajouté en fermentation, ou sans jour : rien', () => {
    expect(messageJourFermentable({ ...fruit, use: 'ebullition' as never, dayOffset: 60 }, 14)).toBeNull();
    expect(messageJourFermentable({ name: 'x', use: 'fermentation', dayOffset: undefined }, 14)).toBeNull();
  });
});
