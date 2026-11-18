// D261a : le libellé d'une ligne lue ne répète pas sa variante. Pièce Brau- und Rauchshop (01.11) : la lecture met la mouture dans le
// nom ET dans la variante ; l'écran les joignait, d'où « … [+CHF 0.10]· Mischung: … [+CHF 0.10] ».
import { describe, expect, it } from 'vitest';
import { libelleDeLigne } from '../../../../src/ui/depense/etat';

const MOUTURE = 'Mischung: Einzelprodukt Schrotung: geschrotet [+CHF 0.10]';

describe('libelleDeLigne (D261a)', () => {
  it('garde le nom seul quand la lecture y a déjà mis la variante', () => {
    expect(libelleDeLigne(`CARABELGE, ${MOUTURE}`, MOUTURE)).toBe(`CARABELGE, ${MOUTURE}`);
  });
  it('compare sans casse, accents, espaces ni ponctuation', () => {
    expect(libelleDeLigne('Premium Pilsner Malz, Mischung: Einzelprodukt  Schrotung: geschrotet', 'mischung einzelprodukt, schrotung GESCHROTET'))
      .toBe('Premium Pilsner Malz, Mischung: Einzelprodukt  Schrotung: geschrotet');
    expect(libelleDeLigne('Malt Château Pilsen, moulu', 'MOULU')).toBe('Malt Château Pilsen, moulu');
  });
  it('joint la variante absente du nom, comme avant', () => {
    expect(libelleDeLigne('CARABELGE', 'geschrotet')).toBe('CARABELGE · geschrotet');
    expect(libelleDeLigne('Wyeast 3787', 'Activator')).toBe('Wyeast 3787 · Activator');
  });
  it('sans variante, le nom seul ; sans nom, la variante seule', () => {
    expect(libelleDeLigne('Hop Spider Bag', '')).toBe('Hop Spider Bag');
    expect(libelleDeLigne('Hop Spider Bag', undefined)).toBe('Hop Spider Bag');
    expect(libelleDeLigne('', 'geschrotet')).toBe('geschrotet');
  });
});
