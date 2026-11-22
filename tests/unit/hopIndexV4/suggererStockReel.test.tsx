// @vitest-environment jsdom
// 08.11 : le pilote a vu l'onglet geler (> 90 s) en ouvrant Suggestions sur « neipa v3 » avec SON stock. Ce banc monte Suggérer avec le stock réel versionné
// (tests/fixtures/production/houblons-2026-10-17.json, 18 articles, lecture seule du 17.10), le catalogue plein et les composés à part, et chronomètre.
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

const articles = vi.hoisted(() => {
  process.env.VITE_COMPOSES_A_PART = 'on';
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs'), path = require('node:path');
  const j = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'tests/fixtures/production/houblons-2026-10-17.json'), 'utf8')) as { stockItems: Record<string, unknown>[] };
  // Du stock : chaque article à 100 g au moins (le snapshot en a beaucoup à 0).
  return j.stockItems.map((s) => ({ ...s, category: 'Houblon', currentStock: Math.max(100, Number(s.currentStock) || 0) }));
});
vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: articles, cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EcranSuggererApp from '../../../src/ui/hopIndex/suggerer/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';
import { lancerTypicite } from '../../../src/ui/hopIndex/parcours/donnees';

const NEIPA = {
  id: 'REC-NEIPA', name: 'neipa v3', style: 'Double IPA', styleRef: { version: '2026-09-09.1', styleId: 'double-ipa', guideId: 'styles-bjcp-2021' },
  volumeL: 24, boilMin: 60, ogTarget: 1.081, colorEbc: 7,
  fermentables: [
    { name: 'Pilsner Malz', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 },
    { name: 'Flocons d\'Avoine', weightKg: 2, kind: 'grain', use: 'ebullition', colorEbc: 2, potentialPpg: 33 },
  ],
  hops: [
    { name: 'Lotus', alpha: 0, weightG: 100, stage: 'boil', timeMin: 10 },
    { name: 'Lotus', alpha: 0, weightG: 144, stage: 'dryHop', aromaTiming: 'fermentation', dayOffset: 3 },
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

describe('Suggérer sur neipa v3 avec le stock réel du 17.10 : s\'ouvre en quelques secondes', () => {
  for (const visee of [null, { citrus: 2.5 }, { citrus: 2.5, resin: 0 }, { floral: 2.5, resin: 0.5 }] as const) {
    it(`visée ${JSON.stringify(visee)}`, async () => {
      if (visee) poserVisee(visee as Record<string, number>);
      poserPorteEtape({ recipe: NEIPA, boilOg: 1.081, draftId: 'REC-NEIPA', onChange: () => {} });
      const t0 = performance.now();
      const { container } = render(<EcranSuggererApp onClose={() => {}} />);
      await waitFor(() => expect(container.textContent).toMatch(/Aucune visée|Plus |Moins |Sans /), { timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1500));
      const ms = Math.round(performance.now() - t0);
      console.log('STOCKREEL', JSON.stringify(visee), ms, 'ms', (container.textContent?.match(/même effet/g) ?? []).length, 'groupes');
      expect(ms).toBeLessThan(15000);
    }, 60000);
  }
});
