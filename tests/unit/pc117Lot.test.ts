import { describe, expect, it } from 'vitest';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { texteLot } from '../../src/ui/finance/previsions/EscalierSvg';

/**
 * PC-117 (en ligne, tours 18 à 51) : deux écritures du même jour dont le mot-clé coïncide (« ZZ TEST — achat » et « ZZ TEST — achat rond » se lisaient « TEST »)
 * faisaient « TEST (2 fois) » : deux choses différentes dites comme une seule qui revient. Attendu : le nom de l'écriture (le plus gros) et « + 1 autre ».
 * « 2 fois » reste pour la même écriture deux fois (« achats (2 fois) »), et « N sorties » pour des mots-clés différents (revue du 10.11).
 */
const sortie = (id: string, label: string, amountCents: number, source: ForecastItem['source'] = 'invoice'): ForecastItem =>
  ({ id, date: '2026-12-08', label, amountCents, direction: 'out', source, category: 'achats' });

describe('PC-117 : le lot du même jour nomme les écritures, pas un mot-clé commun', () => {
  it('deux écritures au mot-clé commun : le plus gros nom entier et « + 1 autre », la somme', () => {
    const t = texteLot([sortie('a', 'ZZ TEST — achat', 7995), sortie('b', 'ZZ TEST — achat rond', 8000)]);
    expect(t).toBe('ZZ TEST — achat rond + 1 autre −159,95, 08.12');
    expect(t).not.toMatch(/fois/);
  });

  it('trois écritures : « + 2 autres »', () => {
    expect(texteLot([sortie('a', 'ZZ TEST — achat', 7995), sortie('b', 'ZZ TEST — achat rond', 8000), sortie('c', 'ZZ TEST — achat de port', 1000)]))
      .toBe('ZZ TEST — achat rond + 2 autres −169,95, 08.12');
  });

  it('la même écriture deux fois reste « (2 fois) »', () => {
    expect(texteLot([sortie('a', 'Achats', 5000), sortie('b', 'Achats', 5000)])).toBe('achats (2 fois) −100, 08.12');
  });

  it("des mots-clés différents nomment aussi la marche : l'écriture la plus lourde + « 1 autre » (R20, C54-1 : jamais « 2 sorties » sans nom ; remplace l'acquis de la revue du 10.11)", () => {
    expect(texteLot([sortie('a', 'Loyer de l’atelier', 40000), sortie('b', 'Assurance', 5000)])).toBe('Loyer de l’atelier + 1 autre −450, 08.12');
  });
});
