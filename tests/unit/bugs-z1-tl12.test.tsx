// @vitest-environment jsdom
/**
 * TL-12 (07.11) : « Même chose nommée de plusieurs façons ». Reste : la fiche appelait le même geste « Modifier la recette » (en-tête, menu) et
 * « Modifier dans l'atelier de recette » (Potentiel aromatique). Un seul nom, celui de l'en-tête.
 * Rouge avant : le bouton s'appelait « Modifier dans l’atelier de recette ».
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HopRecipePanel } from '../../src/ui/hopIndex/HopRecipePanel';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../src/ui/hopIndex/useHopCatalogue', () => ({ useHopCatalogue: () => ({ varieties: [], loading: false, error: '' }) }));
vi.mock('../../src/ui/hopIndex/guideData', async importOriginal => ({ ...await importOriginal<any>(), ensureGuideReferences: vi.fn(async () => {}) }));
afterEach(() => { cleanup(); });

describe('TL-12 : un seul nom pour modifier la recette', () => {
  it('le Potentiel aromatique propose « Modifier la recette », pas « atelier de recette »', () => {
    const onEdit = vi.fn();
    render(<HopRecipePanel recipe={structuredClone(fullRecipe) as Recipe} onEdit={onEdit} />);
    const bouton = screen.getByRole('button', { name: 'Modifier la recette' });
    fireEvent.click(bouton);
    expect(onEdit).toHaveBeenCalledOnce();
    expect(document.body.textContent).not.toMatch(/atelier de recette/);
  });
});
