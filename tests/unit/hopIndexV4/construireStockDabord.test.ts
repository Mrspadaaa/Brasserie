/* D402 (N1, v03 « ton stock d'abord ») : une recette vide se construit avec le houblon du stock devant, et un nom de variété devant un code
   d'essai sans nom (« X06297 ») ; le moteur départage à rang égal. Banc : catalogue plein, stock d'un seul Citra (500 g, α 12,5). */
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerCataloguePlein, type CatalogueHop, type StockHop } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur, type Moteur } from '../../../src/domain/hopIndex/v4/moteur';
import { buildFromEmpty } from '../../../src/domain/hopIndex/v4/cases';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { getStyleScale } from '../../../src/domain/hopIndex/v4/style/scale';
import bandes from '../../../src/data/hopV4/style-bands.json';

const CITRA = 'beermaverick-citra';
const STYLES = Object.keys((bandes as unknown as { styles: Record<string, unknown> }).styles);
const vide = (style: string): Recipe => ({ name: 'ZZ TEST', styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [] });
let m: Moteur;
beforeAll(async () => {
  const plein: CatalogueHop[] = await chargerCataloguePlein();
  const citra: StockHop = { key: CITRA, varietyId: CITRA, form: 'unknown', grams: 500, alpha: 12.5, alphaFrom: 'lot', items: ['ZZ TEST Citra'] } as StockHop;
  m = creerMoteur({ catalogue: plein, stock: [citra] });
}, 60000);

describe('buildFromEmpty : stock nommé d’abord (D402)', () => {
  it('dans chaque style, la première proposition est le Citra du stock, et aucun code sans nom ne passe devant une variété nommée', () => {
    for (const style of STYLES) {
      const c = m.dans(() => buildFromEmpty(vide(style), getStyleScale(style)));
      const toutes = [...c.amerisants, ...c.aromatiques];
      if (!toutes.length) continue;
      if (process.env.VRECETTE_DEBUG) console.log(style, toutes.map((r) => `${r.name}·${r.stock.etat}·${r.role.value}`).join(' | '));
      expect(toutes.some((r) => r.key === CITRA), `${style} : Citra du stock absent`).toBe(true);
      expect(c.amerisants.slice(1).every((r) => !/^[A-Z]{1,4}[\s-]?\d{3,}$/i.test(r.name)), `${style} : un code sans nom parmi les amérisants`).toBe(true);
      const premier = c.amerisants[0] ?? c.aromatiques[0];
      expect(premier.stock.etat, `${style} : ${premier.name} devant le stock`).toBe('en stock');
    }
  });
});
