// @vitest-environment jsdom
// 08.11 : en ligne (build de production), les composés des houblons sont chargés à part (VITE_COMPOSES_A_PART=on, vite.config.ts) : le fil
// principal ne les a que si le chargeur des outils les a installés. Ce test monte Suggérer comme le build : sans le JSON en synchrone.
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.hoisted(() => { process.env.VITE_COMPOSES_A_PART = 'on'; });
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
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';
import { composesCharges, oublierComposes } from '../../../src/domain/hopIndex/v4/composes';

const RECETTE_21A = {
  id: 'REC-21A', name: 'IPA saaz galaxy', style: '21A', volumeL: 20, boilMin: 60, ogTarget: 1.027, colorEbc: 12,
  fermentables: [{ name: 'Pilsner', weightKg: 2.2, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 }],
  hops: [
    { name: 'Saaz (CZ)', alpha: 0, weightG: 30, stage: 'boil', timeMin: 60 },
    { name: 'Galaxy', alpha: 0, weightG: 25, stage: 'boil', timeMin: 10 },
    { name: 'Galaxy', alpha: 0, weightG: 25, stage: 'whirlpool', timeMin: 20 },
  ],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserVisee(null); viderComparaison(); });

describe('Suggérer dans la configuration du build (composés à part)', () => {
  it('sans l\'arrivée des composés, le test voit bien un fil principal sans données', () => {
    expect(composesCharges()).toBeNull();
  });
  it('21A, Saaz + Galaxy, « Plus agrumes » : des voies houblon, composés chargés comme le fait chargerOutils', async () => {
    oublierComposes();
    const { chargerOutils, oublierOutils } = await import('../../../src/ui/hopIndex/chargement');
    oublierOutils();
    await chargerOutils();
    expect(composesCharges()).not.toBeNull();
    poserVisee({ citrus: 2.5 });
    poserPorteEtape({ recipe: RECETTE_21A, boilOg: 1.027, draftId: 'REC-21A', onChange: () => {} });
    const { container } = render(<EcranSuggererApp onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[aria-label="Objectifs"]')).not.toBeNull());
    await new Promise((r) => setTimeout(r, 1500));
    console.log('TEXTE-APRES', container.textContent?.replace(/\s+/g, ' ').slice(420, 1000));
    expect(container.textContent).not.toMatch(/Aucune\s*voie houblon/);
  }, 40000);
});
