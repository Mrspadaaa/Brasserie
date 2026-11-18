// @vitest-environment jsdom
// Voie r4 (mission 2026-11-09-levure-retours), constat n° 2 du jeu en ligne du 09.11 : Nelson Sauvin et Galaxy étaient « mixte » dans la
// recherche avancée et « double » sur leur ligne de l'étape Houblons, pour le même houblon. Un seul mot, celui de l'étape (Usage de
// maBiere/briques.tsx, qui lit hopRole), dans la ligne, dans le filtre Rôle et dans son compte.
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/storage', () => ({
  StorageService: { subscribe: () => () => {}, getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getBatches: () => [], getHopTastings: () => [] },
}));

import { catalogueHoublons, chercherHoublons, facettesHoublons, fichesHoublons } from '../../../src/ui/hopIndex/rechercheAvancee/catalogue';
import { Usage } from '../../../src/ui/hopIndex/maBiere/briques';
import { hopRole } from '../../../src/ui/hopIndex/parcours/v4';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(cleanup);

describe('recherche avancée houblons : le rôle se dit comme dans l’étape', () => {
  const fiches = fichesHoublons();
  const facettes = facettesHoublons(fiches);
  const doubles = fiches.filter((f) => hopRole(f.cle).value === 'double');

  it('il y a des houblons à double usage dans le catalogue (Nelson Sauvin, Galaxy)', () => {
    expect(doubles.length).toBeGreaterThan(5);
    expect(doubles.some((f) => /nelson/i.test(f.h.nom))).toBe(true);
  });

  it('la ligne dit le mot de l’étape, pour chaque rôle', () => {
    const cat = catalogueHoublons(fiches, () => ({ ajouter() {}, proposition: () => null, fiche() {} }));
    const Ligne = cat.ApresNom!;
    for (const f of [doubles.find((x) => /nelson/i.test(x.h.nom))!, ...fiches.filter((x) => hopRole(x.cle).value === 'amérisant').slice(0, 1), ...fiches.filter((x) => hopRole(x.cle).value === 'aromatique').slice(0, 1)]) {
      const etape = render(<Usage h={f.h} mot />).container.querySelector('[data-role="usage"]')!.textContent;
      cleanup();
      const ligne = render(<Ligne item={f} filtres={{}} />).container.querySelector('.hx-role')!.textContent;
      cleanup();
      expect(ligne, f.h.nom).toBe(etape);
    }
    // et jamais « mixte »
    const nelson = doubles.find((x) => /nelson/i.test(x.h.nom))!;
    expect(render(<Ligne item={nelson} filtres={{}} />).container.querySelector('.hx-role')!.textContent).toBe('double');
  });

  it('le filtre Rôle propose « double » (pas « mixte »), et le compte et le filtre suivent', () => {
    const role = facettes.find((f) => f.id === 'role')!;
    expect(role.options.map((o) => o.libelle)).toEqual(['amérisant', 'aromatique', 'double']);
    expect(role.options.map((o) => o.valeur)).toEqual(['amérisant', 'aromatique', 'double']);
    const r = chercherHoublons(fiches, facettes, '', { role: ['double'] });
    expect(r.total).toBe(doubles.length);
    expect(r.comptes.role!.options.find((o) => o.valeur === 'double')!.n).toBe(doubles.length);
  });
});
