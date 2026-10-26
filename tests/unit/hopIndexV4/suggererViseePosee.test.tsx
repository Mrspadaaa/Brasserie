// @vitest-environment jsdom
// Voie t12e-fiche-details (#184), point 4 : Suggérer (et la fiche) reçoivent la visée posée dans Ma bière, par la porte
// (parcours/visee.ts : poserVisee / lireVisee). Sans visée ni dégustation, Suggérer le dit sobrement et ne propose rien d'inventé.
// Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EcranSuggererApp from '../../../src/ui/hopIndex/suggerer/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { abonnerVisee, lireVisee, poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';

const RECETTE = {
  id: 'REC-T12E', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserVisee(null); viderComparaison(); });

describe('Suggérer reçoit la visée posée dans Ma bière', () => {
  it('sans visée : il le dit et ne propose ni voie houblon ni levure', async () => {
    poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-T12E', onChange: () => {} });
    const { container } = render(<EcranSuggererApp onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-role="suggerer-sans-visee"]')).not.toBeNull());
    expect(container.querySelector('[aria-label="Objectifs"]')).toBeNull();
    expect(container.querySelector('[data-libre="houblon"]')).toBeNull();
    expect(container.textContent).not.toMatch(/Changer de levure/);
  });

  it('la visée posée (poserVisee) arrive à Suggérer, sans prop, et se retire avec elle', async () => {
    poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-T12E', onChange: () => {} });
    const { container } = render(<EcranSuggererApp onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-role="suggerer-sans-visee"]')).not.toBeNull());
    act(() => { poserVisee({ floral: 2.5, resin: 0.5 }); });
    expect(lireVisee()).toEqual({ floral: 2.5, resin: 0.5 });
    await waitFor(() => expect(container.querySelector('[aria-label="Objectifs"]')).not.toBeNull());
    expect(container.querySelector('[data-role="suggerer-sans-visee"]')).toBeNull();
    expect(container.textContent).toMatch(/Plus floral/);
    expect(container.textContent).toMatch(/Plus résineux/);
    act(() => { poserVisee(null); });
    await waitFor(() => expect(container.querySelector('[data-role="suggerer-sans-visee"]')).not.toBeNull());
  });

  it('une visée identique ne prévient personne ; une valeur non finie est ignorée (jamais 0)', () => {
    let n = 0;
    poserVisee({ floral: 1.5 });
    const f = () => { n += 1; };
    const unsub = abonnerVisee(f);
    poserVisee({ floral: 1.5 });
    expect(n).toBe(0);
    poserVisee({ floral: Number.NaN, resin: 0 });
    expect(lireVisee()).toEqual({ resin: 0 });
    expect(n).toBe(1);
    unsub();
  });
});

