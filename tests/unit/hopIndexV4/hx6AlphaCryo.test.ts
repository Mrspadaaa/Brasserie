// HX-6 (08.11, rejoué en ligne par le pilote) : Citra cryo du stock « 24,8 % » dans Suggérer, « 10–15 % » dans Comparer (plage de la variété en
// pellets). L'α du lot lu sur le nom de l'article est celui du moteur : Comparer le montre aussi. Échoue sur 5cd4085a (lot seulement si « fiche de stock »).
import { describe, expect, it } from 'vitest';
import { CATALOGUE, type StockHop } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { acides } from '../../../src/ui/hopIndex/comparer/valeurs';

const citra = CATALOGUE.find((h) => h.id === 'beermaverick-citra')!;
const stock: StockHop[] = [{ key: `${citra.id}:cryo`, varietyId: citra.id, form: 'cryo', grams: 65, alpha: 24.8, alphaFrom: 'lu sur l’article', items: ['Houblon Cryo Hops Citra 24.8%'] }];

describe('HX-6 — l’α d’un lot cryo lu sur l’article est montré par Comparer', () => {
  it('acides(…cryo, alpha).lot vaut 24,8, comme le moteur', () => {
    const m = creerMoteur({ catalogue: CATALOGUE, stock });
    const v = m.dans(() => acides(`${citra.id}:cryo`, 'alpha'));
    expect(v?.lot).toBe(24.8);
  });
});
