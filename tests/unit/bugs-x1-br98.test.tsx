// @vitest-environment jsdom
/**
 * BR-98 (08.11) : « Houblon pour ce style » (Simuler) disait « Altus · Hopsteiner · Forme non précisée », sans α ni arômes.
 * Rouge sur le code d'avant : la ligne de détail n'était que « source · forme ». Elle vient maintenant de pickerOptions (α, arômes, puis source et forme).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HopRecipeWorkbench } from '../../src/ui/hopIndex/HopRecipeWorkbench';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';
import type { HopVariety } from '../../functions/src/hopIndexSchema';

const source = { title: 'Fiche', author: 'Hopsteiner', year: 2024, kind: 'manufacturer', reference: 'x' } as const;
const mocks = vi.hoisted(() => ({ varieties: [] as HopVariety[] }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../src/ui/hopIndex/useHopCatalogue', () => ({ useHopCatalogue: () => ({ varieties: mocks.varieties, loading: false, error: '' }) }));
vi.mock('../../src/ui/hopIndex/guideData', async importOriginal => ({ ...await importOriginal<any>(), ensureGuideReferences: vi.fn(async () => {}) }));
afterEach(() => { cleanup(); });

mocks.varieties = [
  { id: 'citra', name: 'Citra', aliases: [], form: 'pelletT90', analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'range', range: { min: 11, max: 13 }, source, confidence: 'medium' }] as never,
    descriptions: [{ text: 'Agrumes, fruit de la passion', source }] as never },
  { id: 'mosaic', name: 'Mosaic', aliases: [], form: 'unknown', analysis: [], descriptions: [] },
] as HopVariety[];

describe('BR-98 : la liste « Houblon pour ce style » dit l’α et les arômes', () => {
  it('une variété de référence montre son α publié et ses arômes avant la source', () => {
    const recipe = { ...structuredClone(fullRecipe), style: 'Double IPA', styleRef: undefined, hops: [] } as Recipe;
    render(<HopRecipeWorkbench recipe={recipe} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Simuler' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Houblon du scénario' }));
    const citra = screen.getByRole('option', { name: /Citra/ });
    expect(citra).toHaveTextContent('11–13 % α');
    expect(citra).toHaveTextContent('Agrumes');
    // Sans α publié : dit « α non publié », jamais 0 ni vide.
    expect(screen.getByRole('option', { name: /Mosaic/ })).toHaveTextContent('α non publié');
  });
});
