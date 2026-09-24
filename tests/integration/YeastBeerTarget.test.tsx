import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { YeastBeerTargetPanel } from '../../src/ui/YeastBeerTargetPanel';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { readYeastRecipeDesign } from '../../src/domain/yeastRecipeDesign';
import { projectYeastRecipe } from '../../src/domain/yeastProjection';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { defaultConfig } from '../../src/services/storage';
import { fullRecipe } from '../fixtures/fullRecipe';
import { allerEtape } from '../helpers/wizard';
import type { Recipe } from '../../src/types';

afterEach(cleanup);
const refs: [] = [];
const initialRecipe = (): Recipe => ({ ...structuredClone(fullRecipe), name: 'Session personnelle', style: 'NEIPA', styleRef: undefined,
  volumeL: 20, efficiencyPct: 75, boilMin: 60, ogTarget: 1.06, fgTarget: null, abvTarget: null, ibuTarget: undefined,
  yeast: { name: 'Culture liquide confidentielle R-125', lab: 'Micro labo', form: 'liquide', qty: 125, unit: 'mL', attenuationPct: 75, attenuationBasis: 'recipe' },
  fermentables: [{ name: 'Pale', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37, colorEbc: 5 }],
  hops: [{ name: 'Magnum', stage: 'boil', timeMin: 60, weightG: 40, alpha: 12 }, { name: 'Mosaic', stage: 'dryHop', weightG: 60, alpha: 12, aromaTiming: 'postFermentation', aromaContactHours: 48, aromaTemperatureC: 14 }],
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }], yeastDesign: undefined, nolo: undefined, adjuncts: [],
});
function Host({ initial = initialRecipe(), changed = vi.fn(), navigate = vi.fn() }: { initial?: Recipe; changed?: ReturnType<typeof vi.fn>; navigate?: ReturnType<typeof vi.fn> }) {
  const [recipe, setRecipe] = useState(initial);
  return <YeastBeerTargetPanel recipe={recipe} refs={refs} onChange={next => { changed(next); setRecipe(next as Recipe); return next; }} onNavigate={navigate} />;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name, exact: typeof name === 'string' }));
const change = (label: string, value: string) => { const field = screen.getByRole('textbox', { name: label, exact: true }); expect(field).toBeVisible(); fireEvent.change(field, { target: { value } }); fireEvent.blur(field); };
const example = (value: string) => { click('Définir ma cible'); fireEvent.change(screen.getByRole('combobox', { name: 'Point de départ' }), { target: { value } }); };
const targets = () => { change('Alcool cible minimum', '2,5'); change('Alcool cible maximum', '3,5'); change('IBU à chaud cible minimum', '10'); change('IBU à chaud cible maximum', '20'); };

describe('Cible de bière, levure personnelle et variantes explicites', () => {
  it('garde les détails fermés et ne traduit pas des mots sensoriels en nombres', () => {
    const changed = vi.fn(); render(<Host changed={changed} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    example('session');
    expect(screen.getByRole('textbox', { name: 'Ma cible' })).toHaveValue('Session NEIPA douce, peu amère, très légère');
    expect(screen.getByRole('textbox', { name: 'Alcool cible maximum' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'IBU à chaud cible maximum' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Finale recherchée' })).toHaveValue('round');
    expect(screen.getByRole('button', { name: 'Préparer une variante chiffrée' })).toBeDisabled();
    expect(changed).not.toHaveBeenCalled();
  });

  it('prépare une NEIPA légère, compare trois plages exactes et conserve le cru jusqu’à application', () => {
    const changed = vi.fn(), before = initialRecipe(); render(<Host initial={before} changed={changed} />);
    example('session'); targets(); click('Préparer une variante chiffrée');
    expect(screen.queryByRole('textbox', { name: 'Ma cible' })).not.toBeInTheDocument();
    expect(changed).not.toHaveBeenCalled();
    const plot = screen.getByRole('figure', { name: 'Alcool estimé' });
    expect(within(plot).getByText('Cible')).toBeVisible(); expect(within(plot).getByText('Recette')).toBeVisible(); expect(within(plot).getByText('Variante')).toBeVisible();
    expect(within(plot).getByText('2,5–3,5')).toBeVisible();
    expect(Number(screen.getByRole('slider', { name: 'Tous les fermentescibles, variation en pourcent' }).getAttribute('value'))).toBeLessThan(100);
    click('Appliquer cible et variante');
    expect(changed).toHaveBeenCalledTimes(1);
    const saved = changed.mock.lastCall![0] as Recipe;
    expect(saved.hops[1]).toEqual(before.hops[1]);
    expect(saved.yeast).toEqual(before.yeast);
    expect(saved.fermentables![0].weightKg).toBeLessThan(before.fermentables![0].weightKg);
    expect(projectYeastRecipe(saved).abv.range!.max).toBeLessThanOrEqual(3.5 + 1e-8);
    expect(readYeastRecipeDesign(saved)?.beerTarget).toMatchObject({ finish: 'round', abv: { min: 2.5, max: 3.5 }, ibu: { min: 10, max: 20 } });
    const restored = normalizeRecipe({ ...readRecipeText(writeRecipeText(saved))!, id: saved.id });
    expect(readYeastRecipeDesign(restored)?.beerTarget).toEqual(readYeastRecipeDesign(saved)?.beerTarget);
    expect(restored.fermentables).toEqual(saved.fermentables);
    expect(screen.getByRole('button', { name: 'Ajuster ma cible' })).toBeVisible();
  });

  it('permet un réglage exact puis annule sans écrire ni perdre la recette', () => {
    const changed = vi.fn(); render(<Host changed={changed} />); example('session'); targets(); click('Essayer mes réglages');
    change('Tous les fermentescibles, pourcentage exact', '50'); change('Hypothèse d’atténuation de la variante', '68');
    expect(screen.getByRole('button', { name: 'Appliquer cible et variante' })).toBeEnabled();
    click('Annuler la variante');
    expect(changed).not.toHaveBeenCalled(); expect(screen.getByText(/Variations annulées, recette inchangée/)).toBeVisible();
  });

  it('refuse une demi-plage et une plage inversée, puis permet de corriger', () => {
    render(<Host />); example('session'); change('Alcool cible minimum', '4');
    expect(screen.getByRole('button', { name: 'Conserver cette cible' })).toBeDisabled();
    change('Alcool cible maximum', '3'); expect(screen.getByRole('button', { name: 'Conserver cette cible' })).toBeDisabled();
    change('Alcool cible maximum', '5'); expect(screen.getByRole('button', { name: 'Conserver cette cible' })).toBeEnabled();
  });

  it('conserve une hypothèse de moût en préparant la cible puis en repliant les réglages', () => {
    render(<Host />); example('session'); targets(); click('Essayer mes réglages');
    change('Hypothèse d’atténuation de la variante', '60'); click('Préparer une variante chiffrée');
    expect(screen.getByRole('textbox', { name: 'Hypothèse d’atténuation de la variante' })).toHaveValue('60');
    click('Replier les variations');
    expect(within(screen.getByRole('figure', { name: 'Alcool estimé' })).getByText('Variante')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Appliquer cible et variante' })).toBeEnabled();
    click('Annuler la variante');
    expect(screen.getByRole('figure', { name: 'Alcool estimé' })).toHaveTextContent('2,5–3,5');
    expect(screen.getByRole('button', { name: 'Conserver cette cible' })).toBeEnabled();
  });

  it('accepte un essai à 5 %, signale une valeur vide et ne dessine pas de résultat fictif', () => {
    render(<Host />); example('session'); click('Essayer mes réglages');
    change('Tous les fermentescibles, pourcentage exact', '5');
    expect(screen.getByRole('slider', { name: 'Tous les fermentescibles, variation en pourcent' })).toHaveValue('5');
    change('Tous les fermentescibles, pourcentage exact', '');
    const graph = screen.getByRole('figure', { name: 'Alcool estimé' });
    expect(graph).toHaveTextContent('Variante à corriger');
    expect(graph.querySelector('[data-kind="variant"]')).toBeNull();
    expect(screen.getByRole('region', { name: 'Cible de la bière' })).not.toHaveTextContent(/NaN|Infinity|undefined/);
    expect(screen.getByRole('button', { name: 'Appliquer cible et variante' })).toBeDisabled();
    change('Tous les fermentescibles, pourcentage exact', '50');
    expect(graph.querySelector('[data-kind="variant"]')).not.toBeNull();
  });

  it('valide les bornes sans remplacer silencieusement les valeurs saisies', () => {
    render(<Host />); example('stout');
    change('IBU à chaud cible minimum', '200'); change('IBU à chaud cible maximum', '250');
    expect(screen.getByRole('textbox', { name: 'IBU à chaud cible maximum' })).toHaveValue('250');
    change('Alcool cible minimum', '-1'); change('Alcool cible maximum', '4');
    expect(screen.getByRole('textbox', { name: 'Alcool cible minimum' })).toHaveValue('-1');
    expect(screen.getByRole('button', { name: 'Conserver cette cible' })).toBeDisabled();
  });

  it('préserve la saisie décimale pendant le focus et la précision calculée au retour', () => {
    render(<Host />); example('session'); click('Essayer mes réglages');
    const field = screen.getByRole('textbox', { name: 'Tous les fermentescibles, pourcentage exact' });
    fireEvent.focus(field); fireEvent.change(field, { target: { value: '14' } });
    expect(field).toHaveValue('14');
    fireEvent.change(field, { target: { value: '13,9' } }); expect(field).toHaveValue('13,9');
    fireEvent.blur(field); expect(field).toHaveValue('13,9');
    fireEvent.focus(field); expect(field).toHaveValue('13,9');
  });

  it('ne chiffre pas un alcool absent et laisse explorer une hypothèse personnelle', () => {
    const initial = initialRecipe(); delete initial.yeast.attenuationPct;
    const changed = vi.fn(); render(<Host initial={initial} changed={changed} />); example('session'); targets(); click('Essayer mes réglages');
    expect(screen.getAllByText(/Atténuation absente/).length).toBeGreaterThan(0);
    change('Hypothèse d’atténuation de la variante', '60');
    expect(screen.getByRole('figure', { name: 'Alcool estimé' })).toHaveTextContent('4,7');
    expect(changed).not.toHaveBeenCalled();
  });

  it('conserve explicitement la cible chocolat avant navigation sans appliquer une variante de quantités', () => {
    const initial = initialRecipe(); initial.fermentables!.push({ name: 'Chocolate malt', kind: 'grain', use: 'empatage', weightKg: .4, potentialPpg: 30, colorEbc: 900 });
    const changed = vi.fn(), navigate = vi.fn(); render(<Host initial={initial} changed={changed} navigate={navigate} />); example('stout');
    expect(screen.getByRole('region', { name: 'Cible de la bière' })).toHaveTextContent('Chocolate malt (400 g)');
    click('Conserver la cible et choisir les malts / ajouts');
    expect(navigate).toHaveBeenCalledWith('fermentescibles');
    expect(changed.mock.lastCall![0].fermentables).toEqual(initial.fermentables);
    expect(readYeastRecipeDesign(changed.mock.lastCall![0])?.beerTarget?.accent).toBe('chocolate');
  });

  it('rend le focus au déclencheur visible après application de la cible', async () => {
    render(<Host />); example('stout');
    const button = screen.getByRole('button', { name: 'Conserver cette cible' }); button.focus(); fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ajuster ma cible' })).toHaveFocus());
  });

  it('conserve la DI explicitement retenue quand seul le souhait est enregistré avant navigation', () => {
    const initial = initialRecipe(), save = vi.fn(); initial.ogTarget = 1.11;
    render(<BrewWizard config={defaultConfig} stockItems={[]} knownStyles={[]} onSave={save} onClose={vi.fn()} onSaveWaterSource={vi.fn()} onLearnIngredient={vi.fn()} onCreateStockItem={vi.fn()} seed={{ recipe: initial }} />);
    allerEtape('Levure'); example('stout'); click('Conserver la cible et choisir les malts / ajouts');
    allerEtape('Récapitulatif'); click('Enregistrer la recette');
    expect(save).toHaveBeenCalledTimes(1); expect(save.mock.lastCall![0].ogTarget).toBe(1.11);
    expect(save.mock.lastCall![0].fermentables).toEqual(initial.fermentables);
    expect(save.mock.lastCall![0].hops).toEqual(initial.hops);
  });

  it('garde les IBU d’ébullition indépendants du sucre tardif et conserve la précision du calcul enregistré', () => {
    const props = { config: defaultConfig, stockItems: [], knownStyles: [], onClose: vi.fn(), onSaveWaterSource: vi.fn(), onLearnIngredient: vi.fn(), onCreateStockItem: vi.fn() };
    const original = initialRecipe(); original.ogTarget = null;
    const first = vi.fn(), view = render(<BrewWizard {...props} seed={{ recipe: original }} onSave={first} />);
    allerEtape('Récapitulatif'); click('Enregistrer la recette'); expect(first).toHaveBeenCalledTimes(1);
    view.unmount();
    const late = structuredClone(original); late.fermentables!.push({ name: 'Saccharose', kind: 'sucre', use: 'fermentation', weightKg: 1, potentialPpg: 46, fermentabilityPct: 100 });
    const second = vi.fn(); render(<BrewWizard {...props} seed={{ recipe: late }} onSave={second} />);
    allerEtape('Levure'); expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).not.toHaveTextContent('À préciser');
    allerEtape('Récapitulatif'); click('Enregistrer la recette'); expect(second).toHaveBeenCalledTimes(1);
    expect(second.mock.lastCall![0].ibuTarget).toBe(first.mock.lastCall![0].ibuTarget);
    const sugarPoints = 46 * 2.2046226 / (20 * .26417205);
    expect(second.mock.lastCall![0].ogTarget - first.mock.lastCall![0].ogTarget).toBeCloseTo(sugarPoints / 1000, 12);
  });

  it('garde la douceur Champagne qualitative et rend la refermentation accessible', () => {
    const navigate = vi.fn(); render(<Host navigate={navigate} />); example('champagne');
    expect(screen.getByRole('region', { name: 'Cible de la bière' })).toHaveTextContent('ne garantit pas une bière sèche ou sucrée');
    expect(screen.getByRole('region', { name: 'Cible de la bière' })).toHaveTextContent('Refroidir seul');
    click('Conserver la cible et examiner la refermentation'); expect(navigate).toHaveBeenCalledWith('paliers');
  });

  it('rend une masse manquante lisible dans les leviers sensoriels', () => {
    const initial = initialRecipe(); initial.fermentables!.push({ name: 'Malt chocolat', kind: 'grain', weightKg: NaN });
    render(<Host initial={initial} />); example('stout');
    expect(screen.getByRole('region', { name: 'Cible de la bière' })).toHaveTextContent('Malt chocolat (quantité à préciser)');
    expect(screen.getByRole('region', { name: 'Cible de la bière' })).not.toHaveTextContent('NaN');
  });

  it('bloque l’application lorsque la recette a changé pendant l’essai', () => {
    const recipe = initialRecipe(), changed = vi.fn();
    const view = render(<YeastBeerTargetPanel recipe={recipe} refs={refs} onChange={changed} />);
    example('session'); targets(); click('Préparer une variante chiffrée');
    view.rerender(<YeastBeerTargetPanel recipe={{ ...recipe, volumeL: 30 }} refs={refs} onChange={changed} />);
    expect(screen.getByRole('button', { name: 'Appliquer cible et variante' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('La recette a changé');
    click('Reprendre les données actuelles'); expect(changed).not.toHaveBeenCalled();
  });

  it('applique la variante dans le véritable assistant puis enregistre et retrouve cible et ingrédients', async () => {
    const initial = initialRecipe(), save = vi.fn();
    const props = { config: defaultConfig, stockItems: [], knownStyles: ['NEIPA'], onSave: save, onClose: vi.fn(), onSaveWaterSource: vi.fn(), onLearnIngredient: vi.fn(), onCreateStockItem: vi.fn() };
    const view = render(<BrewWizard {...props} seed={{ recipe: initial }} />);
    allerEtape('Levure'); example('session'); targets(); click('Préparer une variante chiffrée'); click('Appliquer cible et variante');
    allerEtape('Houblons'); allerEtape('Levure'); expect(screen.getByRole('button', { name: 'Ajuster ma cible' })).toBeVisible();
    allerEtape('Récapitulatif'); click('Enregistrer la recette');
    expect(save).toHaveBeenCalledTimes(1); const saved = save.mock.lastCall![0] as Recipe;
    expect(saved.yeast.name).toBe(initial.yeast.name); expect(saved.hops[1]).toEqual(initial.hops[1]);
    expect(saved.fermentables![0].weightKg).toBeLessThan(initial.fermentables![0].weightKg);
    expect(readYeastRecipeDesign(saved)?.beerTarget?.abv).toEqual({ min: 2.5, max: 3.5 });
    view.unmount(); render(<BrewWizard {...props} seed={{ recipe: saved }} />); allerEtape('Levure'); click('Ajuster ma cible'); click('Modifier la cible');
    expect(screen.getByRole('textbox', { name: 'Alcool cible maximum' })).toHaveValue('3,5');
  });
});
