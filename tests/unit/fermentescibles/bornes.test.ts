// La saisie d'une masse démesurée (fuzzSaisie : 999999999999) ne doit ni geler ni saturer la mémoire : la masse est plafonnée à une borne
// nommée (par `setKg` de l'étape, qui le dit), arrondie au centième de kg, et la piste du plateau ne dessine jamais plus de 60 graduations
// (B1 n° 12 : à 15 000 kg, 200 traits de 1 px sur 330 px font une barre noire).
import { describe, expect, it } from 'vitest';
import { GRADUATIONS_MAX, MASSE_MAX_KG, arrondiKg, graduationsPiste, pmax } from '../../../src/ui/fermentescibles/modele';

describe('bornes de la masse et de la piste', () => {
  it('la borne est nommée, et une masse infinie ou illisible y est ramenée', () => {
    expect(MASSE_MAX_KG).toBeGreaterThan(100);
    expect(arrondiKg(Infinity)).toBe(MASSE_MAX_KG);
    expect(arrondiKg(NaN)).toBe(MASSE_MAX_KG);
  });
  it('une masse tapée est arrondie au centième de kg (10 g), jamais à trois décimales', () => {
    expect(arrondiKg(12.3456)).toBe(12.35);
    expect(arrondiKg(0.004)).toBe(0);
    expect(arrondiKg(0.3)).toBe(0.3);
    expect(arrondiKg(1.25)).toBe(1.25);
  });
  it('la plage de la piste reste finie même pour une masse démesurée', () => {
    expect(Number.isFinite(pmax(arrondiKg(999999999999)))).toBe(true);
  });
  it('la piste ne dessine jamais plus de 60 intervalles, et finit sur une graduation ronde', () => {
    for (const m of [2, 8, 50, 60, 70, 1500, MASSE_MAX_KG * 1.5, 999999999999 * 1.5]) {
      const g = graduationsPiste(m);
      expect(g.length).toBeGreaterThan(1);
      expect(g.length).toBeLessThanOrEqual(GRADUATIONS_MAX + 1);
      expect(g.some((x) => x.grosse)).toBe(true);
    }
    // 15 000 kg : un trait tous les 500 kg, gros tous les 1000
    const g = graduationsPiste(15000);
    expect(g.length).toBe(31);
    expect(g[2].v).toBe(1000);
    expect(g[2].grosse).toBe(true);
    expect(g[1].grosse).toBe(false);
  });
  it('les graduations ordinaires sont celles de la maquette (0,1 sous 2 kg, 0,5 sous 6, 1 au-delà)', () => {
    expect(graduationsPiste(2).length).toBe(21);
    expect(graduationsPiste(8).length).toBe(9);
    expect(graduationsPiste(2).filter((x) => x.grosse).length).toBe(3);
    expect(graduationsPiste(50).length).toBe(51);
  });
});
