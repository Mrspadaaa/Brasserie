import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { NoloRecipeOverview } from '../../src/ui/NoloRecipeOverview';
import { NoloOperationList } from '../../src/ui/NoloOperationList';
import { noloInput, noloPlanningSource } from '../../src/domain/nolo';
import { applyNoloWortSg } from '../../src/domain/noloBrewTools';
import { noloScenarioBasis } from '../../functions/src/noloScenario';
import { fruty } from '../fixtures/fruty';
import { batchEntries, recipeEntries } from '../../src/domain/productionCatalog';
import type { Recipe } from '../../src/types';

afterEach(cleanup);
function fixture() {
  const recipe = fruty(true); recipe.volumeL = 20; recipe.hops = [];
  recipe.nolo!.process = 'arrested'; recipe.nolo!.targetAbvPct = .4;
  recipe.nolo!.planning = { version: 1, source: noloPlanningSource, stopSg: { min: 1.014, max: 1.015 } };
  recipe.nolo!.operations = [{ id: 'water', kind: 'dilution', name: 'Eau après fermentation', volumeL: 6 }];
  return applyNoloWortSg(recipe, 1.018).value!;
}
function assay(recipe: ReturnType<typeof fixture>, stage: 'primary' | 'packaged' = 'packaged') {
  recipe.nolo!.measurements.push({ id: 'lab', stage, date: '2026-09-12', method: 'Laboratoire pilote',
    volumeL: 26, abvPct: { min: .29, max: .31 }, afterOperationId: 'water', basis: noloScenarioBasis(noloInput(recipe), 'water') });
}

describe('aperçu NOLO du plan enregistré', () => {
  it('utilise la cible NOLO pour le catalogue et ne déduit aucun alcool de brassin par OG–FG', () => {
    const recipe = fixture() as Recipe; recipe.abvTarget = 5;
    expect(recipeEntries([recipe], [])[0].abv).toBe(.4);
    const entry = batchEntries([{ id: 'nolo', name: 'Pilote', style: '', status: 'termine', volumeL: 20, brewDate: '', og: '1.040', fg: '1.010', abv: '4%', recipeSnapshot: { ...recipe, capturedAt: '2026-09-12' } }])[0];
    expect(entry.abv).toBeUndefined();
    recipe.nolo!.process = 'coldExtraction';
    expect(recipeEntries([recipe], [])[0].ebc).toBeUndefined();
  });
  it('rend la cible, le franchissement et les deux volumes visibles ; masque les doses au premier regard', () => {
    const recipe = fixture();
    // A calculator draft has no effect until the brewer applies it to operations.
    recipe.nolo!.brewTools = { version: 1, waterL: 400, aromaML: 250 };
    render(<NoloRecipeOverview recipe={recipe}/>);
    expect(screen.getByText('Cible ≤ 0,4 % vol.')).toBeVisible();
    expect(screen.getByText('La plage traverse la cible')).toBeVisible();
    expect(screen.getByText('20 L')).toBeVisible(); expect(screen.getByText('26 L')).toBeVisible();
    const details = screen.getByText('1 opération prévue · doses et ordre').closest('details')!;
    expect(details.open).toBe(false);
    fireEvent.click(within(details).getByText('1 opération prévue · doses et ordre'));
    expect(details.open).toBe(true);
    expect(within(details).getByText('6 L')).toBeVisible();
    expect(screen.queryByText('400 L')).not.toBeInTheDocument();
  });

  it('distingue une analyse avant conditionnement de la bière conditionnée', () => {
    const recipe = fixture(); assay(recipe, 'primary');
    const view = render(<NoloRecipeOverview recipe={recipe}/>);
    expect(screen.getByText('Alcool analysé · avant conditionnement')).toBeVisible();
    const packaged = structuredClone(recipe); packaged.nolo!.measurements[0].stage = 'packaged';
    view.rerender(<NoloRecipeOverview recipe={packaged}/>);
    expect(screen.getByText('Alcool analysé · bière conditionnée')).toBeVisible();
    expect(screen.getByText('0,29–0,31 % vol.')).toBeVisible();
  });

  it('retire le statut analysé quand la composition du plan a changé', () => {
    const recipe = fixture(); assay(recipe);
    const changed = structuredClone(recipe); changed.nolo!.operations[0] = { id: 'water', kind: 'dilution', name: 'Eau', volumeL: 8 };
    render(<NoloRecipeOverview recipe={changed}/>);
    expect(screen.queryByText(/Alcool analysé/)).not.toBeInTheDocument();
    expect(screen.getByText('Projection au conditionnement')).toBeVisible();
  });

  it('ne remplace pas une projection inconnue d’extraction froide par un plafond physique', () => {
    const recipe = fixture(); recipe.nolo!.process = 'coldExtraction'; recipe.nolo!.planning = undefined;
    render(<NoloRecipeOverview recipe={recipe}/>);
    expect(screen.getByText('Projection à compléter')).toBeVisible();
    expect(screen.getByText('Données manquantes')).toBeVisible();
    expect(screen.queryByRole('img', { name: 'Échelle d’alcool et cible' })).not.toBeInTheDocument();
  });

  it('affiche le volume récupéré pour les drêches, même si le volume de recette est différent', () => {
    const recipe = fixture(); recipe.nolo!.process = 'secondRunnings';
    recipe.nolo!.secondRunnings = { sourceBatchId: 'lot-source', previousExtraction: '', waterAddedL: null, alkalinityPpm: null, temperatureC: null, minutes: null, recoveredL: 12, sg: 1.01, ph: null };
    render(<NoloRecipeOverview recipe={recipe}/>);
    expect(screen.getByText('Moût récupéré')).toBeVisible();
    expect(screen.getByText('12 L')).toBeVisible(); expect(screen.getByText('18 L')).toBeVisible();
    expect(screen.queryByText('20 L')).not.toBeInTheDocument();
  });

  it('présente la liaison du fruit sans exposer ses identifiants ni le JSON de référence', () => {
    const recipe = fixture(); const fruit = { name: 'Purée de framboise', kind: 'fruit' as const, use: 'fermentation' as const, weightKg: 2 };
    recipe.fermentables.push(fruit);
    render(<NoloOperationList recipe={recipe} operations={[{ id: 'internal-id', name: 'Framboise', kind: 'sugar', volumeL: 1.8,
      sugarsG: {}, unclassifiedSugarG: { min: 100, max: 100 }, complete: true,
      recipeAddition: { index: recipe.fermentables.length - 1, basis: JSON.stringify(fruit) } }]}/>);
    expect(screen.getByText('100 g')).toBeVisible();
    expect(screen.getByText('Lié à Purée de framboise · compté une fois')).toBeVisible();
    expect(screen.queryByText(/recipeAddition|weightKg|internal-id/)).not.toBeInTheDocument();
  });

  it('montre une erreur visible si la configuration est invalide', () => {
    const recipe = fixture(); recipe.nolo!.targetAbvPct = -1;
    render(<NoloRecipeOverview recipe={recipe}/>);
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByText('Projection à compléter')).toBeVisible();
  });
});
