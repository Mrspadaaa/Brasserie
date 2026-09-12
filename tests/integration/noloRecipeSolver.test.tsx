import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { NoloRecipeSimulator } from '../../src/ui/NoloRecipeSimulator';
import { NoloPanel } from '../../src/ui/NoloPanel';
import { NoloFermentationWorkshop } from '../../src/ui/NoloFermentationWorkshop';
import { NoloRecipeOverview } from '../../src/ui/NoloRecipeOverview';
import { evaluateNoloRecipe, noloScience } from '../../src/domain/nolo';
import { fruty } from '../fixtures/fruty';
import type { Recipe } from '../../src/types';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { RecipePage } from '../../src/pages/RecipePage';
import { noloYeastCandidates } from '../../src/domain/noloYeastSelection';
import { defaultConfig } from '../../src/services/storage';
import * as solver from '../../src/domain/noloRecipeSolver';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
const science = noloScience()!;
const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
const band = () => screen.getByRole('figure', { name: 'Résultat de la simulation NOLO' });
const upper = () => Number(band().getAttribute('data-nolo-max'));
function mount(initial = fruty(true)) {
  let latest = initial;
  function Host() {
    const [recipe, setRecipe] = useState(initial); latest = recipe;
    return <><NoloRecipeSimulator recipe={recipe} onChange={next => setRecipe(next as Recipe)} science={science}/><NoloRecipeOverview recipe={recipe}/></>;
  }
  render(<Host/>); return () => latest;
}

describe('simulation NOLO depuis une consigne', () => {
  it('préremplit la proposition depuis les ingrédients, affiche une plage et laisse la recette intacte avant application', () => {
    const recipe = fruty(true), before = JSON.stringify(recipe), latest = mount(recipe);
    expect(screen.getByLabelText('Densité initiale visée', { exact: true })).not.toHaveValue('');
    expect(screen.getByLabelText('Charge de grain')).not.toHaveValue('');
    expect(screen.getByLabelText('Atténuation envisagée minimum')).not.toHaveValue('');
    expect(Number.isFinite(upper())).toBe(true);
    expect(upper()).toBeLessThanOrEqual(recipe.nolo!.targetAbvPct + 1e-8);
    expect(JSON.stringify(latest())).toBe(before);
    const changes = screen.getByRole('table', { name: 'Changements proposés dans la recette NOLO', hidden: true });
    expect(changes).toHaveTextContent('Ensemencement');
    expect(changes.closest('details')).not.toHaveAttribute('open');
  });
  it('change les levures et préremplit les champs adaptés aux huit procédés, sans appliquer le choix', () => {
    const original = fruty(true), latest = mount(original);
    const specialistIds = within(screen.getByLabelText('Levure de la simulation')).getAllByRole('option').map(option => option.getAttribute('value'));
    expect(specialistIds.length).toBeGreaterThanOrEqual(6);
    for (const process of ['lowExtract', 'arrested', 'dealcoholized', 'coldContact', 'coldExtraction', 'secondRunnings', 'restored', 'restricted']) {
      fill('Procédé à simuler', process);
      expect(Number.isFinite(upper())).toBe(true);
      expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeEnabled();
      if (process === 'lowExtract') expect(within(screen.getByLabelText('Levure de la simulation')).getAllByRole('option').every(option => !specialistIds.includes(option.getAttribute('value')))).toBe(true);
      if (process === 'arrested') expect(screen.getByLabelText('Densité d’arrêt minimum')).not.toHaveValue('');
      if (process === 'dealcoholized') expect(screen.getByLabelText('Retrait de l’alcool minimum')).not.toHaveValue('');
      if (process === 'coldContact') expect(screen.getByLabelText('Contact à froid')).not.toHaveValue('');
      if (process === 'coldExtraction') expect(screen.getByLabelText('Durée d’extraction')).not.toHaveValue('');
      if (process === 'secondRunnings') expect(screen.getByLabelText('Volume de récupération visé')).not.toHaveValue('');
    }
    expect(latest()).toEqual(original);
  });
  it('réagit à la densité et à la variation, puis applique tous les champs et retrouve la même plage dans l’aperçu', () => {
    const latest = mount(); fill('Procédé à simuler', 'lowExtract');
    const before = upper();
    fill('Densité initiale visée', '1,012');
    expect(upper()).toBeGreaterThan(before);
    const atTwelve = upper(); fill('Variation de l’extrait', '30');
    expect(upper()).toBeGreaterThan(atTwelve);
    const proposed = upper();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer à la recette' }));
    expect(latest().nolo!.process).toBe('lowExtract');
    expect(latest().nolo!.planning?.simulation?.settings.extractTolerancePct).toBe(30);
    expect(latest().fermentation?.[0].tempC).toBeGreaterThan(0);
    expect(latest().yeast.qty).toBeGreaterThan(0);
    expect(latest().nolo!.measurements).toEqual([]);
    expect(evaluateNoloRecipe(latest())!.projection.max).toBeCloseTo(proposed, 9);
    expect(screen.getByRole('status')).toHaveTextContent('Programme appliqué');
    expect(screen.getByLabelText('Aperçu NOLO')).toHaveTextContent('extrait ±30 %');
    expect(screen.getByLabelText('Aperçu NOLO')).toHaveTextContent('OG visée');
    expect(upper()).toBeCloseTo(proposed, 9);
  });
  it('garde une erreur visible et refuse les plages inversées jusqu’à correction', () => {
    mount(); fill('Atténuation envisagée minimum', '90');
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('atténuation');
    fill('Atténuation envisagée maximum', '95');
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeEnabled();
  });
  it.each(['', 'abc', '180'])('bloque la proposition pendant une saisie invalide (%s), y compris après sortie du champ', value => {
    mount();
    const field = screen.getByLabelText('Atténuation envisagée minimum');
    fireEvent.change(field, { target: { value } });
    fireEvent.blur(field);
    expect(field).toHaveValue(value);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Saisie à corriger');
    expect(band()).toHaveAttribute('data-nolo-max', 'unknown');
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeDisabled();
    fill('Atténuation envisagée minimum', '13');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(upper()).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeEnabled();
    fireEvent.change(field, { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeEnabled();
  });
  it('ne relance pas le solveur pour un nouveau nom et conserve ce nom en appliquant les réglages', () => {
    const recipe = fruty(true), change = vi.fn();
    const prepare = vi.spyOn(solver, 'prepareNoloRecipe');
    const view = render(<NoloRecipeSimulator recipe={recipe} onChange={change} science={science}/>);
    fill('Variation de l’extrait', '10');
    const calls = prepare.mock.calls.length, result = upper();
    view.rerender(<NoloRecipeSimulator recipe={{ ...recipe, name: 'Mon pilote renommé' }} onChange={change} science={science}/>);
    expect(prepare).toHaveBeenCalledTimes(calls);
    expect(upper()).toBe(result);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer à la recette' }));
    expect(change.mock.calls[0][0].name).toBe('Mon pilote renommé');
    expect(change.mock.calls[0][0].nolo.planning.simulation.settings.extractTolerancePct).toBe(10);
  });
  it('garde le clavier et les actions dans la variante temporaire', () => {
    const onVariantChange = vi.fn();
    render(<NoloPanel recipe={fruty(true)} onVariantChange={onVariantChange}/>);
    fireEvent.click(screen.getByRole('button', { name: 'Simuler une variante NOLO' }));
    expect(onVariantChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: 'Fermer la variante NOLO' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Appliquer à la variante' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Appliquer à la recette' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la variante NOLO' }));
    expect(onVariantChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('button', { name: 'Simuler une variante NOLO' })).toHaveFocus();
  });
  it('ne relance pas le préremplissage pendant la frappe du nom dans le vrai formulaire', () => {
    const prepare = vi.spyOn(solver, 'prepareNoloRecipe');
    render(<BrewWizard seed={{ recipe: fruty(true) }} stockItems={[]} config={defaultConfig} knownStyles={[]}
      onClose={() => {}} onSave={() => {}} onCreateStockItem={() => {}} onSaveWaterSource={() => {}}/>);
    const calls = prepare.mock.calls.length;
    fill('Nom de la bière', 'Pilote');
    fill('Nom de la bière', 'Pilote NOLO');
    expect(prepare).toHaveBeenCalledTimes(calls);
    expect(screen.getByLabelText('Nom de la bière')).toHaveValue('Pilote NOLO');
  });
  it('refuse une simulation éditée sur une ancienne recette et reprend les nouvelles données au recalcul', () => {
    const recipe = fruty(true), change = vi.fn();
    const view = render(<NoloRecipeSimulator recipe={recipe} onChange={change} science={science}/>);
    fill('Variation de l’extrait', '10');
    view.rerender(<NoloRecipeSimulator recipe={{ ...recipe, volumeL: 20 }} onChange={change} science={science}/>);
    expect(screen.getByRole('alert')).toHaveTextContent('La recette a changé');
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(screen.queryByText(/La recette a changé/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeEnabled();
    expect(change).not.toHaveBeenCalled();
  });
  it('place le même outil directement dans l’identité et l’atelier levure, avec les détails secondaires fermés', () => {
    const recipe = fruty(true), change = vi.fn();
    const view = render(<NoloPanel recipe={recipe} onChange={change} allowEnable/>);
    expect(screen.getByLabelText('Simulateur de recette NOLO')).toBeVisible();
    expect(screen.getByText('Outils complémentaires · ajouts, dilution et essais').closest('details')).not.toHaveAttribute('open');
    view.rerender(<NoloFermentationWorkshop recipe={recipe} onChange={change}/>);
    expect(screen.getAllByLabelText('Simulateur de recette NOLO')).toHaveLength(1);
    expect(within(screen.getByLabelText('Levure de la simulation')).getAllByRole('option').length).toBeGreaterThan(3);
  });
  it('indique quels ingrédients compléter au lieu de fabriquer leur potentiel', () => {
    mount(fruty());
    expect(screen.getByRole('alert')).toHaveTextContent("Flocons d'Avoine");
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeDisabled();
  });
  it('montre le programme froid sauvegardé et écarte ce programme si la recette change', () => {
    const source = fruty(true); source.nolo!.process = 'coldExtraction';
    const strain = noloYeastCandidates(source, science)[0].strain;
    const recipe = solver.prepareNoloRecipe(source, science, strain, { extractionTempC: 12, extractionHours: 12 }).recipe as Recipe;
    const props = { recipe, batches: [], config: defaultConfig, onClose: vi.fn(), onEdit: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(), onBrew: vi.fn(), onOpenBatch: vi.fn() };
    const view = render(<RecipePage {...props}/>);
    expect(screen.getByText('Eau prévue pour le pilote')).toBeVisible();
    fireEvent.click(screen.getByText('Extraction à froid prévue'));
    expect(screen.getByText('Maintenir 12 °C pendant 12 h, puis filtrer.')).toBeVisible();
    expect(screen.queryByText('Paliers chauds de référence')).not.toBeInTheDocument();
    view.rerender(<RecipePage {...props} recipe={{ ...recipe, efficiencyPct: 20 }}/>);
    expect(screen.queryByText('Extraction à froid prévue')).not.toBeInTheDocument();
    expect(screen.getByText('Paliers chauds de référence')).toBeVisible();
    expect(screen.getByLabelText('Aperçu NOLO')).toHaveTextContent('Simulation à recalculer');
  });
  it.each(['restricted','lowExtract','arrested','dealcoholized','coldContact','coldExtraction','secondRunnings','restored'] as const)('garde la plage %s dans les étapes réelles du wizard et dans la recette enregistrée', async process => {
    const recipe = fruty(true), save = vi.fn();
    render(<BrewWizard seed={{ recipe }} stockItems={[]} config={defaultConfig} knownStyles={[]}
      onClose={() => {}} onSave={save} onCreateStockItem={() => {}} onSaveWaterSource={() => {}}/>);
    fill('Procédé à simuler', process);
    const min = Number(band().getAttribute('data-nolo-min')), max = upper();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer à la recette' }));
    if (process === 'lowExtract') {
      fireEvent.click(screen.getAllByRole('button', { name: 'Levure', exact: true })[0]);
      expect(screen.getAllByLabelText('Simulateur de recette NOLO')).toHaveLength(1);
    }
    fireEvent.click(screen.getAllByRole('button', { name: 'Récapitulatif', exact: true })[0]);
    const overview = screen.getByRole('region', { name: 'Aperçu NOLO' });
    const current = within(overview).getByRole('figure');
    const overviewMin = Number(current.getAttribute('data-nolo-min'));
    const overviewMax = Number(current.getAttribute('data-nolo-max'));
    const overviewStale = overview.textContent?.includes('Simulation à recalculer');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    const saved = save.mock.calls[0][0] as Recipe;
    expect(overviewMin).toBeCloseTo(min, 8);
    expect(overviewMax).toBeCloseTo(max, 8);
    expect(overviewStale).toBe(false);
    expect(evaluateNoloRecipe(saved)?.simulationActive).toBe(true);
    expect(evaluateNoloRecipe(saved)?.projection.max).toBeCloseTo(max, 8);
  });
});
