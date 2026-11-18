import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HopRecipeSnapshot } from '../../src/ui/hopIndex/HopRecipeSnapshot';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';

afterEach(cleanup);

// 08.11, rejeu en ligne : 99 999 g de Lotus dans 24 L.
const enorme = (): Recipe => ({ ...structuredClone(fullRecipe), volumeL: 24, ogTarget: 1.08,
  hops: [{ name: 'Lotus', weightG: 99999, alpha: 15, stage: 'boil', timeMin: 10 }] } as Recipe);

describe('Bilan de houblonnage : une dose hors bornes (RJ-11)', () => {
  it('le message ne finit pas par « .. » et la dose en g/L n’a qu’une décimale', () => {
    render(<HopRecipeSnapshot recipe={enorme()} />);
    const bilan = screen.getByRole('region', { name: 'Bilan de houblonnage de la recette' });
    expect(bilan).toHaveTextContent('IBU incomplets');
    expect(bilan.textContent).not.toContain('..');
    expect(bilan.textContent).toMatch(/des kg tapés en g \?\)\./);
    expect(bilan.textContent).not.toContain('4 166,625');
    expect(bilan.textContent).toMatch(/4\s166,6\sg\/L/);
  });
});
