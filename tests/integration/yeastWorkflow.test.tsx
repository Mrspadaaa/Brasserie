import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { RecipePage } from '../../src/pages/RecipePage';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { YeastBrewDayGuide } from '../../src/ui/YeastBrewDayGuide';
import { YeastRecipeSummary } from '../../src/ui/YeastRecipeWorkbench';
import { defaultConfig } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch, BrewDayState } from '../../src/types';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);
const state = (): BrewDayState => ({ currentIndex: 0, steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }], readings: [] });
describe('Parcours levure entre les écrans', () => {
  it('shows the adopted goal and current setpoint in the closed overview, without a duplicate section', () => {
    const recipe = yeastFlowRecipe(); recipe.fermentation[0].tempC = 21;
    const { container } = render(<RecipePage recipe={recipe} batches={[]} config={defaultConfig} onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />);
    const section = container.querySelector('details[data-recipe-section="Levure"]') as HTMLDetailsElement;
    expect(section.open).toBe(false); expect(section.querySelector('summary')).toHaveTextContent('Girofle · épices · primaire 21 °C · réglages modifiés');
    expect(container.querySelector('[data-recipe-section="Conduite de levure"]')).toBeNull();
    fireEvent.click(section.querySelector('summary')!); section.open = true;
    expect(screen.getByLabelText('Conduite de levure de la recette')).toHaveTextContent('21 °C');
    expect(container.querySelector('[data-step="0"]')).toHaveAttribute('data-temp', '21');
  });
  it('keeps a read-only variant local to the overview', () => {
    const recipe = yeastFlowRecipe(), before = JSON.stringify(recipe);
    render(<YeastRecipeSummary recipe={recipe} />);
    fireEvent.click(screen.getByRole('button', { name: 'Simuler une variante de levure' }));
    const field = screen.getByLabelText('Température principale du scénario');
    fireEvent.change(field, { target: { value: '22' } }); fireEvent.blur(field);
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la variante de levure' }));
    expect(JSON.stringify(recipe)).toBe(before); expect(screen.getByLabelText('Conduite de levure de la recette')).toHaveTextContent('18 °C');
  });
  it('shows a propagated-culture form mismatch instead of the dry dose in the actual overview and guide', () => {
    const recipe = yeastFlowRecipe(); delete recipe.yeastDesign;
    recipe.style = 'NEIPA'; recipe.yeast = { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa', form: 'levain', qty: 125, unit: 'mL', pitchTempC: 20 };
    const journal = state(); journal.readings = [{ at: 1, kind: 'volume', stepId: 'ensemencement', value: 10, unit: 'L' }];
    render(<><YeastRecipeSummary recipe={recipe} /><YeastBrewDayGuide recipe={recipe} state={journal} phase="finish" /></>);
    const summary = screen.getByLabelText('Conduite de levure de la recette');
    const guide = screen.getByRole('complementary', { name: 'Conduite de levure du brassin' });
    for (const view of [summary, guide]) expect(view).toHaveTextContent('Forme prévue : levain ; référence : sèche');
    expect(summary).not.toHaveTextContent('Conversion des g/hL'); expect(guide).not.toHaveTextContent('Repère fabricant pour');
  });
  it('offers measurement actions without marking pitching or finishing as done', () => {
    const journal = state(), measure = vi.fn(), before = JSON.stringify(journal);
    render(<YeastBrewDayGuide recipe={yeastFlowRecipe()} state={journal} phase="finish" onMeasure={measure} />);
    const guide = screen.getByRole('complementary', { name: 'Conduite de levure du brassin' });
    expect(guide).toHaveTextContent('0 bar rel.'); expect(within(guide).getAllByText('Non relevé')).toHaveLength(3);
    fireEvent.click(within(guide).getByRole('button', { name: 'Relever température' }));
    expect(measure).toHaveBeenCalledWith('temperature'); expect(JSON.stringify(journal)).toBe(before);
    expect(guide.querySelector('details')!.open).toBe(false);
  });
  it('wires the guide to the frozen batch and actual measurement dialog', () => {
    const recipe = yeastFlowRecipe(), save = vi.fn(), finish = vi.fn();
    const batch = { id: 'B-YEAST', name: 'Brassin figé', style: 'Lager changé au catalogue', status: 'planifie', recipeSnapshot: { ...recipe, capturedAt: '2026-09-12' }, brewDay: state() } as unknown as Batch;
    render(<BrewDayPage batch={batch} config={defaultConfig} onSave={save} onFinish={finish} onClose={vi.fn()} />);
    const guide = screen.getByRole('complementary', { name: 'Conduite de levure du brassin' });
    expect(guide).toHaveTextContent('Girofle'); expect(guide).not.toHaveTextContent('Lager');
    fireEvent.click(within(guide).getByRole('button', { name: 'Relever température' }));
    expect(screen.getByRole('region', { name: 'Mesures de cette étape' })).toBeInTheDocument();
    expect(finish).not.toHaveBeenCalled();
  });
});
