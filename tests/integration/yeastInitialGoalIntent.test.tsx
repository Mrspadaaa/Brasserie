import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { YeastRecipeWorkbench } from '../../src/ui/YeastRecipeWorkbench';
import { applyYeastRecipeDesign, createYeastRecipeDraft, readYeastRecipeDesign } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
import type { TrialRecipe } from '../../src/domain/hopIndex/trials';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';

const knowledge = vi.hoisted(() => []);
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => knowledge }));
afterEach(cleanup);

const refs = yeastReferences([]);
const wheat = (): Recipe => ({ ...structuredClone(fullRecipe), name: 'Hefe maison', style: 'Hefeweizen', styleRef: undefined,
  volumeL: 20, ogTarget: 1.05,
  yeast: { name: 'Wyeast 3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', form: 'liquide', attenuationPct: 78, attenuationBasis: 'recipe' },
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 7 }],
  mash: { ...fullRecipe.mash, steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] }, hops: [] });

const change = (label: string, value: string) => {
  const field = screen.getByLabelText(label);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};
const open = (text: RegExp) => {
  const summary = screen.getByText(text), details = summary.closest('details')!;
  if (!details.open) fireEvent.click(summary);
  expect(details).toHaveAttribute('open');
};
function Host({ initial, changed }: { initial: Recipe; changed: (recipe: Recipe) => void }) {
  const [recipe, setRecipe] = useState<Recipe>(initial);
  return <YeastRecipeWorkbench recipe={recipe} onChange={next => {
    changed(next as Recipe); setRecipe(next as Recipe); return next as TrialRecipe;
  }} />;
}

describe('Intention initiale et programme explicite de levure', () => {
  it('accepte un objectif initial compatible, propose, applique et conserve son intention dans le snapshot', () => {
    const onChange = vi.fn();
    render(<YeastRecipeWorkbench recipe={wheat()} onChange={onChange} initialGoal="banana" />);

    const suggestion = screen.getByRole('button', { name: /Essayer 22 °C/ });
    fireEvent.click(suggestion);
    expect(screen.getByLabelText('Température principale du scénario')).toHaveValue('22');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));

    const applied = onChange.mock.calls[0][0] as Recipe;
    expect(applied.fermentation?.[0]).toMatchObject({ tempC: 22, days: 10 });
    expect(readYeastRecipeDesign(applied)).toMatchObject({ goal: 'banana', goalExplicit: true });
  });

  it('ignore un objectif initial hors des choix du style et ne propose rien depuis le défaut', () => {
    render(<YeastRecipeWorkbench recipe={wheat()} onChange={vi.fn()} initialGoal="low-sulfur" />);
    expect(screen.queryByRole('button', { name: /Essayer|Préparer/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Appliquer le scénario' })).toBeEnabled();
  });

  it('synchronise les scalaires avec le programme sauvegardé : vide reste inconnu, zéro reste zéro', () => {
    const recipe = wheat(), initial = createYeastRecipeDraft(recipe, refs);
    const saved = applyYeastRecipeDesign(recipe, { ...initial, goal: 'banana', goalExplicit: true, programme: structuredClone(recipe.fermentation!) }, refs);
    const onChange = vi.fn();
    render(<Host initial={saved} changed={onChange} />);
    open(/Ensemencement et durée à préparer/);

    change('Température principale du scénario', '');
    expect(screen.getByRole('button', { name: 'Appliquer le scénario' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Programme incomplet');
    expect(onChange).not.toHaveBeenCalled();

    change('Température principale du scénario', '20');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    change('Durée principale du scénario en jours', '0');
    expect(screen.getByLabelText('Durée principale du scénario en jours')).toHaveValue('0');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));

    const applied = onChange.mock.calls[0][0] as Recipe;
    expect(applied.fermentation?.[0].days).toBe(0);
    expect(readYeastRecipeDesign(applied)?.programme?.[0].days).toBe(0);
    expect(screen.getByLabelText('Durée principale du scénario en jours')).toHaveValue('0');

    change('Durée principale du scénario en jours', '');
    expect(screen.getByRole('alert')).toHaveTextContent('Programme incomplet');
    expect(screen.getByRole('button', { name: 'Appliquer le scénario' })).toBeDisabled();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
