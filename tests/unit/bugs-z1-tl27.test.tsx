// @vitest-environment jsdom
/**
 * TL-27 (07.11) : « Calcul incomplet : durée d'ébullition » pour une recette sans `boilMin` enregistré, alors que la fiche
 * (RecipePage, recipeMetrics, BrewDayPage) lit partout `recipe.boilMin ?? 60`. L'atelier et le bilan doivent lire le même défaut.
 * Rouge avant : `analyseHopRecipe(recipe)` recevait `boilMin` absent et disait « durée d'ébullition » manquante.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HopRecipeWorkbench } from '../../src/ui/hopIndex/HopRecipeWorkbench';
import { HopRecipeSnapshot } from '../../src/ui/hopIndex/HopRecipeSnapshot';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../src/ui/hopIndex/useHopCatalogue', () => ({ useHopCatalogue: () => ({ varieties: [], loading: false, error: '' }) }));
vi.mock('../../src/ui/hopIndex/guideData', async importOriginal => ({ ...await importOriginal<any>(), ensureGuideReferences: vi.fn(async () => {}) }));
afterEach(() => { cleanup(); });

const sansDuree = (): Recipe => {
  const r = structuredClone(fullRecipe) as Recipe;
  delete (r as { boilMin?: number }).boilMin;
  return { ...r, volumeL: 20, ogTarget: 1.06, style: 'Double IPA', styleRef: undefined, nolo: undefined,
    hops: [
      { name: 'Citra', weightG: 30, alpha: 12, stage: 'boil', timeMin: 60 },
      { name: 'Mosaic', weightG: 30, alpha: 11, stage: 'boil', timeMin: 15 },
      { name: 'Galaxy', weightG: 60, alpha: 14, stage: 'dryHop' },
    ] } as Recipe;
};

describe('TL-27 : une recette sans durée d’ébullition enregistrée prend le défaut de l’app (60 min)', () => {
  it('l’atelier ne dit pas « Calcul incomplet : durée d’ébullition »', () => {
    expect(sansDuree().boilMin).toBeUndefined();
    render(<HopRecipeWorkbench recipe={sansDuree()} onChange={vi.fn()} />);
    expect(screen.queryByText(/Calcul incomplet/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/durée d’ébullition/);
  });
  it('le bilan ne dit pas « IBU incomplets : durée d’ébullition »', () => {
    render(<HopRecipeSnapshot recipe={sansDuree()} />);
    expect(screen.queryByText(/IBU incomplets/)).not.toBeInTheDocument();
  });
});
