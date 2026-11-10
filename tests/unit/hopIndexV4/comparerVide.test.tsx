// @vitest-environment jsdom
// 08.11 (« Suggestions et comparez ne fonctionne plus ??? ») : « Comparer (0) » ouvert sans aucun houblon rendait « Ta bière » superposée à son « + », des rangées sans barres
// et un « Par famille » qui ne parlait que de la recette. Un état vide, dit, avec le « + » qui ouvre l'ajout. Stockage simulé : aucune donnée réelle.
import { cleanup, render, waitFor } from '@testing-library/react';
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

import EcranComparerApp from '../../../src/ui/hopIndex/comparer/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';

const RECETTE = {
  id: 'REC-VIDE', name: 'IPA', style: '21A', volumeL: 20, boilMin: 60, ogTarget: 1.060, colorEbc: 12,
  fermentables: [], hops: [{ name: 'Galaxy', alpha: 14, weightG: 40, stage: 'boil', timeMin: 15 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); });

describe('Comparer sans aucun houblon', () => {
  it('dit l\'état vide, garde le « + », et ne montre ni rangées ni « Par famille »', async () => {
    poserPorteEtape({ recipe: RECETTE, boilOg: 1.06, draftId: 'REC-VIDE', onChange: () => {} });
    const { container } = render(<EcranComparerApp houblons={[]} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="comparer"]')).not.toBeNull());
    expect(container.querySelector('[data-role="comparer-vide"]')?.textContent).toMatch(/Aucun houblon à comparer/);
    expect(container.querySelector('[data-role="ajouter-colonne"]')).not.toBeNull();
    expect(container.querySelector('[data-colonnes="0"]')).not.toBeNull();
    expect(container.textContent).not.toMatch(/Par famille/);
    expect(container.querySelector('h1')?.textContent).toMatch(/^Quel houblon pour ma bière \?/);
  });
});
