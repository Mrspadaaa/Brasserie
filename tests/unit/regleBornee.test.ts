import { describe, it, expect } from 'vitest';
import { graduations } from '../../src/ui/identite/regles';

/**
 * Le singe de l'assistant (graine 3, geste 249) a gelé puis épuisé le tas : une durée d'ébullition de 999 999 999 999 min,
 * acceptée par la cellule « Ébullition » de la fiche de brassage (min 0, sans max), étendait la règle de l'étape Identité
 * jusqu'à 1 000 000 000 020 min, et `graduations` poussait un chiffre toutes les 60 min, soit 1,7 × 10^10 éléments.
 * Un brasseur qui tape un zéro de trop figerait l'écran de la même façon.
 *
 * Les valeurs d'essai restent modestes (1 × 10^7) : l'ancien code les traite en quelques centaines de milliers d'éléments
 * sans épuiser la mémoire, et le test échoue sur la longueur, sans emporter le processus.
 */
describe('graduations — la règle ne compte pas jusqu’à l’infini', () => {
  it('garde un nombre borné de chiffres pour une règle démesurée', () => {
    expect(graduations(10_000_020, 60).length).toBeLessThanOrEqual(250);
    expect(graduations(10_000_020, 10).length).toBeLessThanOrEqual(250);
  });

  it('une règle démesurée garde son premier chiffre (0) et un dernier chiffre marqué', () => {
    const g = graduations(10_000_020, 60);
    expect(g[0].valeur).toBe(0);
    expect(g.filter((x) => x.derniere)).toHaveLength(1);
    expect(g[g.length - 1].derniere).toBe(true);
  });

  it('une règle ordinaire reste inchangée : un chiffre tous les 30 min jusqu’à 150', () => {
    expect(graduations(150, 30).map((x) => x.valeur)).toEqual([0, 30, 60, 90, 120, 150]);
    expect(graduations(65, 10).map((x) => x.valeur)).toEqual([0, 10, 20, 30, 40, 50, 60]);
  });
});
