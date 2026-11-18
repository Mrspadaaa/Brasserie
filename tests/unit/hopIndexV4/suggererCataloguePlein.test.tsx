// @vitest-environment jsdom
// 08.11 : en ligne, les outils tournent sur le catalogue PLEIN (505 variétés : c7, chargé au repos) et la table de typicité ; les tests
// d'écran montaient Suggérer sur les 317 variétés de Beer Maverick seules. Même chemin que le build : composés à part, outils chargés par
// chargerOutils, catalogue plein et typicité arrivés.
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
import { lancerTypicite } from '../../../src/ui/hopIndex/parcours/donnees';

const R21A = {
  id: 'REC-21A', name: 'IPA saaz galaxy', style: '21A', volumeL: 20, boilMin: 60, ogTarget: 1.027, colorEbc: 12,
  fermentables: [{ name: 'Pilsner', weightKg: 2.2, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 }],
  hops: [
    { name: 'Saaz (CZ)', alpha: 0, weightG: 30, stage: 'boil', timeMin: 60 },
    { name: 'Galaxy', alpha: 0, weightG: 25, stage: 'boil', timeMin: 10 },
    { name: 'Galaxy', alpha: 0, weightG: 25, stage: 'whirlpool', timeMin: 20 },
  ],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const NEIPA = {
  id: 'REC-NEIPA', name: 'neipa v3', style: 'Double IPA', styleRef: { version: '2026-09-09.1', styleId: 'double-ipa', guideId: 'styles-bjcp-2021' },
  volumeL: 24, boilMin: 60, ogTarget: 1.081, colorEbc: 7,
  fermentables: [
    { name: 'Pilsner Malz', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 },
    { name: 'Flocons d\'Avoine', weightKg: 2, kind: 'grain', use: 'ebullition', colorEbc: 2, potentialPpg: 33 },
  ],
  hops: [
    { name: 'Lotus', alpha: 0, weightG: 100, stage: 'boil', timeMin: 10 },
    { name: 'Lotus', alpha: 0, weightG: 144, stage: 'dryHop', aromaTiming: 'postFermentation' },
  ],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(async () => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  const { chargerOutils } = await import('../../../src/ui/hopIndex/chargement');
  const o = await chargerOutils();
  await o.chargerAjouts();
  await lancerTypicite();
}, 60000);
afterEach(() => { cleanup(); poserPorteEtape(null); poserVisee(null); viderComparaison(); });

describe('Suggérer sur le catalogue plein, composés à part : l\'écran s\'ouvre vite et propose des voies', () => {
  for (const [nom, recette, visee] of [
    ['21A Saaz + Galaxy, plus agrumes', R21A, { citrus: 2.5 }],
    ['neipa v3, plus agrumes', NEIPA, { citrus: 2.5 }],
    ['neipa v3, sans visée', NEIPA, null],
  ] as const) {
    it(nom, async () => {
      if (visee) poserVisee(visee as Record<string, number>);
      poserPorteEtape({ recipe: recette, boilOg: recette.ogTarget ?? 1.05, draftId: recette.id, onChange: () => {} });
      const t0 = performance.now();
      const { container } = render(<EcranSuggererApp onClose={() => {}} />);
      await waitFor(() => expect(container.textContent).toMatch(/Aucune visée|Plus |Moins |Sans /), { timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1500));
      const ms = Math.round(performance.now() - t0);
      console.log('PLEIN', nom, ms, 'ms', container.textContent?.replace(/\s+/g, ' ').slice(430, 900));
      expect(ms).toBeLessThan(15000);
      if (visee) expect(container.textContent).not.toMatch(/Aucune\s*voie houblon/);
    }, 120000);
  }
});
