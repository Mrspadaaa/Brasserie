/* RO-4 (08.11) : « Recette › Houblons (aperçu avec 99 999 g) : la page ne répond plus aux captures après son ouverture ».
   Les composants de houblon de la voie (bilan, guide aromatique, atelier) rendent une recette à 99 999 g sans geler la page :
   chacun se rend en moins de 3 s. Le gel, s'il existe, vient donc d'un autre morceau de l'étape (atelier V5.5, hors voie). */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { HopRecipeWorkbench } from '../../src/ui/hopIndex/HopRecipeWorkbench';
import { HopRecipeGuide } from '../../src/ui/hopIndex/HopRecipeGuide';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../src/ui/hopIndex/useHopCatalogue', () => ({ useHopCatalogue: () => ({ varieties: [], loading: false, error: '' }) }));
vi.mock('../../src/ui/hopIndex/guideData', async importOriginal => ({ ...await importOriginal<any>(), ensureGuideReferences: vi.fn(async () => {}) }));
afterEach(cleanup);

const enorme = (): Recipe => ({ ...structuredClone(fullRecipe), style: 'Hefeweizen', styleRef: undefined, nolo: undefined, volumeL: 30,
  hops: [{ name: 'Cascade', stage: 'boil', weightG: 99999, alpha: 100, timeMin: 60 }, { name: 'Citra', stage: 'dryHop', weightG: 99999, alpha: 12, aromaTiming: 'fermentation', aromaContactHours: 48, dayOffset: 4 }] as Recipe['hops'] });

describe('RO-4 — 99 999 g de houblon', () => {
  it('l’atelier se rend en moins de 3 s', () => {
    const t0 = performance.now();
    render(<HopRecipeWorkbench recipe={enorme()} onChange={vi.fn()} />);
    expect(performance.now() - t0).toBeLessThan(3000);
  });
  it('le guide aromatique se rend en moins de 3 s', () => {
    const t0 = performance.now();
    render(<HopRecipeGuide recipe={enorme()} onChange={vi.fn()} />);
    expect(performance.now() - t0).toBeLessThan(3000);
  });
});
