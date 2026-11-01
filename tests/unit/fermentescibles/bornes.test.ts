// La saisie d'une masse démesurée (fuzzSaisie : 999999999999) ne doit ni geler ni saturer la mémoire : la masse est plafonnée à une borne
// nommée, et la piste du plateau ne dessine jamais plus de 200 graduations (comme `graduations` de src/ui/identite/regles.ts).
import { describe, expect, it } from 'vitest';
import { MASSE_MAX_KG, arrondiKg, graduationsPiste, pmax } from '../../../src/ui/fermentescibles/modele';

describe('bornes de la masse et de la piste', () => {
  it('une masse tapée est plafonnée à la borne nommée', () => {
    expect(MASSE_MAX_KG).toBeGreaterThan(100);
    expect(arrondiKg(999999999999)).toBe(MASSE_MAX_KG);
    expect(arrondiKg(12.3456)).toBe(12.346);
    expect(arrondiKg(Infinity)).toBe(MASSE_MAX_KG);
  });
  it('la plage de la piste reste finie même pour une masse démesurée', () => {
    expect(Number.isFinite(pmax(arrondiKg(999999999999)))).toBe(true);
  });
  it('la piste ne dessine jamais plus de 200 graduations', () => {
    for (const m of [2, 8, 50, 1500, MASSE_MAX_KG * 1.5, 999999999999 * 1.5]) {
      const g = graduationsPiste(m);
      expect(g.length).toBeGreaterThan(1);
      expect(g.length).toBeLessThanOrEqual(201);
    }
  });
  it('les graduations ordinaires sont celles de la maquette (0,1 sous 2 kg, 0,5 sous 6, 1 au-delà)', () => {
    expect(graduationsPiste(2).length).toBe(21);
    expect(graduationsPiste(8).length).toBe(9);
    expect(graduationsPiste(2).filter((x) => x.grosse).length).toBe(3);
  });
});
