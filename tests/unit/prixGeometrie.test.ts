import { describe, expect, it } from 'vitest';
import { echelles, REPERE_390, xDe, yDe } from '../../src/ui/prix/geometrie';

describe('geometrie du graphe de c7c : deux échelles sur un axe commun', () => {
  const e = echelles(2.48, 5, 3636);
  const y = yDe(e, REPERE_390);
  it('les crans par an sont 1-2-5 (0 · 5 k · 10 k · 15 k…), pas des multiples de 3 636', () => {
    expect(e.anCrans.slice(0, 4)).toEqual([0, 5000, 10000, 15000]);
  });
  it('un cran par an se pose à cran ÷ unités sur l\'axe par bouteille : 5 000 ÷ 3 636 = 1,375', () => {
    expect(y(5000 / 3636)).toBeCloseTo(y(1.375), 1); // 5 000 ÷ 3 636 = 1,3751 : la maquette arrondit à 1,375
    expect(y(0)).toBe(REPERE_390.Y0);
  });
  it('les deux échelles ont le même zéro et le même sommet ; tous les crans tiennent dans l\'axe', () => {
    expect(y(e.yMax)).toBe(REPERE_390.T);
    expect(Math.max(...e.yCrans)).toBeLessThanOrEqual(e.yMax);
    expect(Math.max(...e.anCrans) / 3636).toBeLessThanOrEqual(e.yMax + 1e-9);
  });
  it('l\'aiguille à 5,00 est dans le graphe et à droite du point d\'équilibre 2,48', () => {
    const x = xDe(e, REPERE_390);
    expect(x(5)).toBeGreaterThan(x(2.48)); expect(x(5)).toBeLessThan(REPERE_390.X1);
    expect(e.xMax).toBeGreaterThan(5);
  });
  it('volume annuel inconnu : aucune échelle par an', () => {
    expect(echelles(2.48, 5, null).anCrans).toEqual([]);
  });
});
