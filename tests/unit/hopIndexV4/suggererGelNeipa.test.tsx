// @vitest-environment jsdom
// 08.11, constaté en ligne par le pilote (prod 597211d9, 525 px) : recette « neipa v3 » (NEIPA 24 L, Pilsner Malz 6,6 kg + flocons d'avoine 2 kg
// à l'ébullition, Lotus 100 g à 10′ et 144 g à froid, US-05) : un toucher sur « Suggestions » gèle l'onglet (renderer figé > 90 s).
// Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
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
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';

const NEIPA = (dry: 'fermentation' | 'postFermentation' | undefined, style = 'Double IPA') => ({
  id: 'REC-NEIPA', name: 'neipa v3', style, styleRef: style === 'Double IPA' ? { version: '2026-09-09.1', styleId: 'double-ipa', guideId: 'styles-bjcp-2021' } : undefined,
  volumeL: 24, boilMin: 60, ogTarget: 1.081, colorEbc: 7,
  fermentables: [
    { name: 'Pilsner Malz', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 },
    { name: 'Flocons d\'Avoine', weightKg: 2, kind: 'grain', use: 'ebullition', colorEbc: 2, potentialPpg: 33 },
  ],
  hops: [
    { name: 'Lotus', alpha: 0, weightG: 100, stage: 'boil', timeMin: 10 },
    { name: 'Lotus', alpha: 0, weightG: 144, stage: 'dryHop', ...(dry ? { aromaTiming: dry } : {}), dayOffset: 3 },
  ],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
}) as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserVisee(null); viderComparaison(); });

describe('Suggérer sur la recette neipa v3 : l\'écran s\'ouvre en quelques secondes', () => {
  for (const dry of ['fermentation', 'postFermentation', undefined] as const) {
    for (const visee of [null, { citrus: 2.5 }, { citrus: 2.5, resin: 0 }] as const) {
      it(`dry hop ${dry ?? 'sans moment'}, visée ${JSON.stringify(visee)}`, async () => {
        if (visee) poserVisee(visee as Record<string, number>);
        poserPorteEtape({ recipe: NEIPA(dry), boilOg: 1.081, draftId: 'REC-NEIPA', onChange: () => {} });
        const t0 = performance.now();
        const { container } = render(<EcranSuggererApp onClose={() => {}} />);
        await waitFor(() => expect(container.textContent).toMatch(/Aucune visée|Plus |Moins /), { timeout: 30000 });
        await new Promise((r) => setTimeout(r, 1500));
        console.log('DUREE', dry, JSON.stringify(visee), Math.round(performance.now() - t0), 'ms', container.textContent?.replace(/\s+/g, ' ').slice(380, 700));
        expect(performance.now() - t0).toBeLessThan(15000);
      }, 60000);
    }
  }
  void fireEvent;
});
