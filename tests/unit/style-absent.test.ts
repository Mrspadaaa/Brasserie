import { describe, expect, it } from 'vitest';
import { brewingStyles, matchBrewingStyles, resolveBrewingStyle } from '../../src/domain/brewingStyles';

// WFR-9 : la feuille Brasser d'un brassin planifié dont l'instantané de recette n'a pas de champ `style` affichait « Écran indisponible ».
describe('style absent d\'un instantané de recette', () => {
  it('ne lève pas : aucun style reconnu', () => {
    expect(matchBrewingStyles(undefined as unknown as string)).toEqual([]);
    expect(resolveBrewingStyle(undefined as unknown as string)).toBeUndefined();
  });
  it('un style présent se reconnaît toujours', () => {
    const connu = brewingStyles().find((s) => s.selectable !== false && !s.historical)!;
    expect(matchBrewingStyles(connu.name).length).toBeGreaterThan(0);
  });
});
