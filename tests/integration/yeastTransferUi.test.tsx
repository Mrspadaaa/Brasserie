import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { RecipeReview } from '../../src/ui/RecipeReview';
import { AiClient } from '../../src/services/aiClient';
import { defaultConfig } from '../../src/services/storage';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';
import type { Recipe } from '../../src/types';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function mount(recipe = yeastFlowRecipe(), save = vi.fn()) {
  return render(<BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]} knownStyles={['Hefeweizen']} onSave={save} onClose={vi.fn()} onSaveWaterSource={vi.fn()} onLearnIngredient={vi.fn()} onCreateStockItem={vi.fn()} />);
}
describe('Copie, import et relecture de la conduite levure', () => {
  it('affiche la quantité liquide exacte dans le récapitulatif et la conserve à l’enregistrement', () => {
    const initial = yeastFlowRecipe(), save = vi.fn();
    initial.yeast = { ...initial.yeast, form: 'liquide', qty: .125, unit: 'L' };
    mount(initial, save); allerEtape('Récapitulatif');
    /* Récap m2 : la rangée Levure (un <details>) montre la quantité dans son résumé et, dépliée, dans la ligne de sa fiche ; le tableau des besoins
       porte la même quantité dans une cellule. Trois endroits, trois rôles : on vise le résumé de la rangée, puis la fiche de la même rangée. */
    const rangee = document.querySelector<HTMLElement>('details.rc2-rlev')!;
    expect(within(rangee).getByText('0,125 L', { selector: '.rc2-m' })).toBeInTheDocument();
    // RL-1 : la fiche dépliée ne répète plus le nom ni la quantité ; le résumé au repos garde les deux (m2).
    expect(rangee.querySelector('summary')).toHaveTextContent(/Wyeast 3068.*0,125 L/);
    expect(within(rangee).queryByText(/Wyeast 3068 · 0,125 L/, { selector: 'span' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save.mock.calls[0][0].yeast).toMatchObject({ qty: .125, unit: 'L' });
  });
  it('copies the real wizard text, imports that exact text locally, and saves the same intent and hop contacts', async () => {
    const copy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
    const initial = yeastFlowRecipe(), view = mount(initial);
    allerEtape('Récapitulatif'); fireEvent.click(screen.getByRole('button', { name: 'Copier la recette en texte' }));
    await waitFor(() => expect(copy).toHaveBeenCalledOnce());
    const text = copy.mock.calls[0][0] as string, copied = readRecipeText(text)!;
    expect(copied.yeastDesign).toEqual(initial.yeastDesign); expect(copied.hops).toEqual(initial.hops);
    expect(copied.yeast.hopIndexId).toBe('wyeast-3068');
    view.unmount();
    const save = vi.fn(); mount({ ...initial, name: 'Autre brouillon', yeastDesign: undefined, yeast: { name: 'Autre souche', form: 'sèche', qty: 99, unit: 'sachet' } }, save);
    // r4-a (D205) : sur une recette remplie, l'import passe par l'icône de l'en-tête ; le bouton du corps ne reste que sur une recette vide.
    fireEvent.click(screen.getByRole('button', { name: 'Coller une recette' }));
    fireEvent.change(screen.getByLabelText('Texte de la recette'), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Lire la recette' }));
    await screen.findByRole('button', { name: 'Reprendre' }); fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
    allerEtape('Récapitulatif'); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const restored = save.mock.calls[0][0] as Recipe;
    expect(restored.yeast).toEqual(copied.yeast); expect(restored.yeastDesign).toEqual(copied.yeastDesign);
    expect(restored.hops).toEqual(copied.hops); expect(restored.fermentation).toEqual(copied.fermentation); expect(restored.mash.steps).toEqual(copied.mash.steps);
    expect(AiClient.run).not.toHaveBeenCalled();
  });
  it('gives review AI the current recipe, intent, pressure zero and cross-step details', async () => {
    vi.mocked(AiClient.run).mockResolvedValue({ ok: true, data: { verdict: 'Relecture simulée', findings: [] } });
    mount(); allerEtape('Récapitulatif'); fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    await screen.findByText('Relecture simulée');
    const request = vi.mocked(AiClient.run).mock.calls[0][0], context = request.context as any;
    expect(context.fiche.recipe.yeastDesign.goal).toBe('clove');
    expect(context.fiche.yeastContext.current.pressure.plannedBar).toBe(0);
    expect(context.fiche.yeastContext.current.hops[1]).toMatchObject({ biologicalContext: 'active', contactHours: 48, temperatureC: 18 });
    expect(context.fiche.yeastContext.current.mash[0]).toMatchObject({ tempC: 44, durationMin: 15 });
    expect(request.task).toBe('reviewRecipe');
  });
  it('keeps a malformed export visible as a correction instead of crashing the review or calling AI', () => {
    render(<RecipeReview buildText={() => { throw new Error('Scénario de levure invalide'); }} data={{}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Scénario de levure invalide');
    expect(screen.getByRole('button', { name: 'Faire relire la recette' })).toBeDisabled(); expect(AiClient.run).not.toHaveBeenCalled();
  });
  it('imports an unknown quantity without old sachets, saves it incomplete and requires a dose before brewing', async () => {
    const unknown = yeastFlowRecipe();
    delete (unknown.yeast as any).qty; delete (unknown.yeast as any).unit;
    delete (unknown.yeastDesign!.applied.yeast as any).qty; delete (unknown.yeastDesign!.applied.yeast as any).unit;
    const copy = vi.fn().mockResolvedValue(undefined), save = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
    mount({ ...yeastFlowRecipe(), yeastDesign: undefined, yeast: { name: 'Ancienne levure', form: 'sèche', qty: 99, unit: 'sachet' } }, save);
    // r4-a (D205) : sur une recette remplie, l'import passe par l'icône de l'en-tête ; le bouton du corps ne reste que sur une recette vide.
    fireEvent.click(screen.getByRole('button', { name: 'Coller une recette' }));
    fireEvent.change(screen.getByLabelText('Texte de la recette'), { target: { value: writeRecipeText(unknown) } });
    fireEvent.click(screen.getByRole('button', { name: 'Lire la recette' }));
    const apply = await screen.findByRole('button', { name: 'Reprendre' });
    expect(screen.getByText(/Objectif adopté/)).toHaveTextContent('Girofle · épices');
    expect(screen.getByText(/Objectif adopté/)).toHaveTextContent('0 bar rel.');
    expect(screen.queryByText(/undefined undefined/)).not.toBeInTheDocument();
    fireEvent.click(apply);
    allerEtape('Récapitulatif');
    // Récap m2 : le résumé de la rangée Levure signale la quantité manquante (« quantité, unité »), sans la remplacer par une valeur inventée.
    expect(document.querySelector('details.rc2-rlev summary')).toHaveTextContent(/quantité, unité/);
    fireEvent.click(screen.getByRole('button', { name: 'Copier la recette en texte' }));
    await waitFor(() => expect(copy).toHaveBeenCalledOnce());
    const copied = readRecipeText(copy.mock.calls[0][0])!;
    expect(copied.yeast.qty).toBeUndefined(); expect(copied.yeast.unit).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0].yeast.qty).toBeUndefined();
    expect(save.mock.calls[0][0].yeast.unit).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et préparer un brassin' }));
    expect(save).toHaveBeenCalledOnce();
    expect(screen.getByText('Quantité de levure : à compléter.')).toBeInTheDocument();
    expect(AiClient.run).not.toHaveBeenCalled();
  });
});
