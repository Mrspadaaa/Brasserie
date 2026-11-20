// @vitest-environment jsdom
/**
 * T3B-6 (en ligne, 20.11, tag tour3) : fiche Milk Stout › Simuler › Viser des IBU : « À compléter pour calculer : durée d'ébullition de la recette »
 * alors que la fiche écrit « Ébullition 60′ ». Le correctif TL-27 (0dbc6f305) n'avait normalisé que le Bilan (`analyseHopRecipe`) :
 * l'onglet Simuler appelait `evaluateHopRecipeAdjustment(recipe, …)` avec la recette brute, sans `boilMin`.
 * Rouge avant : l'onglet Simuler dit « durée d'ébullition de la recette ».
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HopRecipeWorkbench } from '../../src/ui/hopIndex/HopRecipeWorkbench';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../src/ui/hopIndex/useHopCatalogue', () => ({ useHopCatalogue: () => ({ varieties: [], loading: false, error: '' }) }));
vi.mock('../../src/ui/hopIndex/guideData', async importOriginal => ({ ...await importOriginal<any>(), ensureGuideReferences: vi.fn(async () => {}) }));
afterEach(() => { cleanup(); });

/** La recette du brasseur : Milk Stout 30 L, Target 35 g α 11,3 et East Kent Goldings 20 g α 5,5 à 60′, aucune durée d'ébullition enregistrée. */
const milkStout = (): Recipe => {
  const r = structuredClone(fullRecipe) as Recipe;
  delete (r as { boilMin?: number }).boilMin;
  return { ...r, name: 'Milk Stout', volumeL: 30, ogTarget: 1.062, style: 'Milk Stout', styleRef: undefined, nolo: undefined,
    hops: [
      { name: 'Target', weightG: 35, alpha: 11.3, stage: 'boil', timeMin: 60 },
      { name: 'East Kent Goldings', weightG: 20, alpha: 5.5, stage: 'boil', timeMin: 60 },
    ] } as Recipe;
};

describe('T3B-6 : Simuler › Viser des IBU lit la même durée d’ébullition que la fiche (60′ par défaut)', () => {
  it('ne demande pas « durée d’ébullition de la recette » quand la fiche affiche 60′', () => {
    expect(milkStout().boilMin).toBeUndefined();
    render(<HopRecipeWorkbench recipe={milkStout()} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Simuler' }));
    expect(document.body.textContent).not.toMatch(/durée d’ébullition/);
  });
  it('l’ajout à 60′ de Target n’est pas dit « supérieur aux » minutes d’ébullition', () => {
    render(<HopRecipeWorkbench recipe={milkStout()} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Simuler' }));
    expect(document.body.textContent).not.toMatch(/ébullition de la recette/);
    expect(document.body.textContent).not.toMatch(/supérieur aux/);
  });
});
