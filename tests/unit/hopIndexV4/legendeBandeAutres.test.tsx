// @vitest-environment jsdom
// Voie t12g-bandeau : la ligne ◇ de la légende (mots hors des 12 familles) vient d'`autresDe`, la source unique du chiffre
// « autres n % » (fiche/autres.ts) : mots traduits, distincts, mêmes fiches. Elle n'a plus de calcul propre.
// Données : les fixtures du moteur ; aucune donnée réelle, aucun appel Gemini.
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import { houblon } from '../../../src/ui/hopIndex/parcours/adaptateur';
import { autresDe } from '../../../src/ui/hopIndex/fiche/autres';
import { LignesV2a, speciauxDe } from '../../../src/ui/hopIndex/maBiere/legende-bande';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(cleanup);

const LOTUS = 'beermaverick-lotus';

describe('légende : les mots hors des 12 familles viennent d\'autresDe', () => {
  it('Lotus : mêmes mots que « autres 44 % », traduits, chacun une fois (vanille et vanilla = un mot)', () => {
    const a = autresDe(LOTUS)!;
    const sp = speciauxDe(LOTUS);
    expect(sp.sans.map((x) => x.mot)).toEqual(a.mots.map((m) => m.mot));
    expect(sp.sans.map((x) => x.mot)).toEqual(['vanille', 'crème', 'fruité', 'doux']);
    expect(sp.sans).toHaveLength(a.n);
    expect(sp.sans.find((x) => x.mot === 'vanille')!.sources).toEqual(['Beer Maverick', 'Hopsteiner']);
  });

  it('la ligne ◇ écrit ces mots, et le chiffre de la carte en compte autant', () => {
    const h = houblon(LOTUS);
    const { container } = render(<LignesV2a h={h} />);
    const ligne = [...container.querySelectorAll('.pq-mb-lg-ligne')].find((l) => l.querySelector('.pq-mb-lg-los'))!;
    expect(ligne.textContent).toContain('vanille');
    expect(ligne.textContent).not.toContain('vanilla');
    expect(h.motsSansFamille).toEqual(speciauxDe(LOTUS).sans.map((x) => x.mot));
  });
});
