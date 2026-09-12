import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { YeastStrainDetails } from '../../src/ui/YeastStrainDetails';
import { YeastRecipeWorkbench, YeastRecipeSummary } from '../../src/ui/YeastRecipeWorkbench';
import { YeastBrewDayGuide } from '../../src/ui/YeastBrewDayGuide';
import { yeastStrainInformation } from '../../src/domain/yeastStrainInformation';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
const knowledge = vi.hoisted(() => []);
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => knowledge }));
afterEach(cleanup);
const openInfo = () => { const summary = screen.getByText('Fiche de la souche · repères pratiques'); fireEvent.click(summary); summary.closest('details')!.open = true; return summary.closest('details')!; };
describe('Compact strain information across brewing views', () => {
  it('is closed by default and retains access to evidence and unknowns', () => {
    render(<YeastStrainDetails information={yeastStrainInformation(yeastReferences([]).find(y => y.id === 'fermentis-us05'), 'sèche')} />);
    expect(screen.getByText('Fiche de la souche · repères pratiques').closest('details')!.open).toBe(false);
    const panel = openInfo();
    expect(within(panel).getByText('Réhydratation possible')).toBeVisible();
    expect(within(panel).getByText(/25–29 °C/)).toBeVisible();
    expect(within(panel).getByText('Conditions et sources des repères').closest('details')!.open).toBe(false);
    expect(within(panel).getByText(/Non documenté :/)).toHaveTextContent('Gène STA1');
  });
  it('keeps dry preparation hidden when product form is unconfirmed', () => {
    render(<YeastStrainDetails information={yeastStrainInformation(yeastReferences([]).find(y => y.id === 'fermentis-us05'), 'levain')} />);
    openInfo(); expect(screen.getByText(/Confirmer la forme du produit/)).toBeVisible(); expect(screen.queryByText('Réhydratation possible')).not.toBeInTheDocument();
  });
  it('shows the selected reference in the editor without modifying the recipe', () => {
    const change = vi.fn(); render(<YeastRecipeWorkbench recipe={yeastFlowRecipe()} onChange={change} />);
    const panel = openInfo(); expect(panel.dataset.yeastInformation).toBe('wyeast-3068');
    expect(within(panel).getByText(/33 % d’espace libre/)).toBeVisible(); expect(change).not.toHaveBeenCalled();
  });
  it.each(['overview', 'brew-day'])('makes the same information available in %s', view => {
    const recipe = yeastFlowRecipe();
    render(view === 'overview' ? <YeastRecipeSummary recipe={recipe} /> : <YeastBrewDayGuide recipe={recipe} state={{ currentIndex: 0, steps: [], readings: [] }} phase="preparation" />);
    expect(openInfo().dataset.yeastInformation).toBe('wyeast-3068');
    expect(screen.getByText('Soufre pendant la fermentation')).toBeVisible();
  });
});
