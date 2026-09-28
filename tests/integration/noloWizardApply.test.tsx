import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { RecipePage } from '../../src/pages/RecipePage';
import { evaluateNoloRecipe, newNoloConfig } from '../../src/domain/nolo';
import { defaultConfig } from '../../src/services/storage';
import { BrewingMath } from '../../src/services/brewingMath';
import { currentInstallation } from '../../src/domain/brewPreferences';
import { recipeInstallationIssues } from '../../src/domain/recipeInstallation';
import { adaptRecipeEquipment } from '../../src/domain/adaptRecipeEquipment';
import { readRecipeDraft, serializeRecipeDraft, writeRecipeDraft } from '../../src/services/recipeDraft';
import { describeSavedRecipeWater } from '../../src/domain/recipeWaterReadings';
import { recipeWaterExport } from '../../src/domain/recipeWaterExport';
import { writeRecipeText } from '../../src/domain/recipeTransfer';
import fixture from '../fixtures/hopScientific/test-houb.json';
import type { Recipe } from '../../src/types';
import { allerEtape } from '../helpers/wizard';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

function sourceRecipe(): Recipe {
  return {
    ...structuredClone(fixture), id: 'qa-nolo-wizard-lona', name: 'NOLO LoNa · contrôle',
    style: 'Hefeweisse', nolo: newNoloConfig(),
    hops: Array.from({ length: 20 }, (_, index) => ({ ...fixture.hops[index % 2], weightG: 24 })),
    yeast: { name: 'Fermentis SafBrew LA-01', hopIndexId: 'yeast-fermentis-safbrew-la-01', form: 'sèche', qty: 12, unit: 'g' },
    fermentation: [{ kind: 'primaire', name: 'Primaire NOLO', tempC: 20, days: 2 }]
  } as Recipe;
}

function mount(recipe: Recipe, save = vi.fn()) {
  return { save, ...render(<BrewWizard localOnly seed={{ recipe }} draftKey="qa-nolo-wizard-lona"
    stockItems={[]} config={defaultConfig} knownStyles={[]}
    onClose={vi.fn()} onSave={save} onCreateStockItem={vi.fn()}
    onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()}/>) };
}

async function saveCurrent(save: ReturnType<typeof vi.fn>): Promise<Recipe> {
  allerEtape(/^Récapitulatif$/);
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  return save.mock.calls[0][0] as Recipe;
}

describe('application NOLO du Wizard avec une ancienne recette sans plan d’eau', () => {
  it('conserve le plan LoNa accepté, la projection et le snapshot au retour dans la recette', async () => {
    const original = sourceRecipe();
    const originalCopy = structuredClone(original);
    const first = mount(original);
    allerEtape(/^Levure$/);
    expect(screen.queryByLabelText('Simulateur de recette NOLO')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Adapter à mon matériel actuel/ }));
    await screen.findByLabelText('Simulateur de recette NOLO');
    fireEvent.change(screen.getByLabelText('Levure de la simulation'), { target: { value: 'lalbrew-lona' } });
    const waterPreview = screen.getByRole('region', { name: 'Eau proposée pour le scénario NOLO' });
    expect(waterPreview).toHaveTextContent(/Empâtage 15,5 L \+ rinçage 17,4 L/);
    expect(waterPreview).toHaveTextContent(/Ratio atteint 9,16 L\/kg/);
    expect(waterPreview).toHaveTextContent(/pH à mesurer ou à titrer/);
    expect(waterPreview).toHaveTextContent(/Aucune dose d’acide calculée/);
    const waterChange = within(screen.getByRole('table', { name: 'Changements proposés dans la recette NOLO', hidden: true }))
      .getByRole('row', { name: /^Eau /, hidden: true });
    expect(waterChange).toHaveTextContent('15,5 L + 17,4 L');
    const simulatedMax = Number(screen.getByRole('figure', { name: 'Résultat de la simulation NOLO' }).getAttribute('data-nolo-max'));
    expect(Number.isFinite(simulatedMax)).toBe(true);
    expect(first.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer à la recette' }));
    expect(first.save).not.toHaveBeenCalled();
    allerEtape(/^Eau et sels$/);
    expect(screen.getByRole('status', { name: 'Acidification à mesurer' })).toHaveTextContent(/dose d’acide non calculée/);
    expect(screen.queryByText('rien à corriger')).not.toBeInTheDocument();
    expect(screen.getByText('Additifs retenus à préparer')).toBeInTheDocument();
    expect(document.querySelector('[aria-label="HCO₃ après ajouts retenus — moyenne du graphique"]'))
      .toHaveTextContent('125');
    expect(screen.queryByText(/3,2 mL|3,1 mL/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 g de Gypse' }));
    expect(screen.getByRole('textbox', { name: 'Dose de Gypse en grammes' })).toHaveValue('0,5');
    expect(first.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer 0,5 g de Gypse' }));
    expect(screen.getByRole('textbox', { name: 'Dose de Gypse en grammes' })).toHaveValue('0');
    expect(screen.getByRole('status', { name: 'Acidification à mesurer' })).toHaveTextContent(/dose d’acide non calculée/);
    allerEtape(/^Récapitulatif$/);
    const appliedOverview = screen.getByRole('region', { name: 'Aperçu NOLO' });
    expect(appliedOverview).not.toHaveTextContent('Simulation à recalculer');
    expect(screen.getByText(/Aucune dose d’acide calculée pour ce plan/)).toBeVisible();
    const saved = await saveCurrent(first.save);
    expect(saved.yeast.hopIndexId).toBe('lalbrew-lona');
    expect(saved.waterPlan?.mashWaterL).toBeGreaterThan(0);
    expect(saved.waterPlan?.spargeWaterL).toBeGreaterThan(0);
    expect(saved.waterPlan).toMatchObject({ mashWaterL: 15.5, spargeWaterL: 17.4 });
    expect(saved.waterPlan?.acid).toBeUndefined();
    expect(saved.waterPlan?.acidOverride).toBeUndefined();
    expect(saved.waterPlan?.startIons).toBeUndefined();
    expect(saved.waterPlan?.wortIons).toBeUndefined();
    expect(saved.installation?.manualWaterSplit).toBe(false);
    expect(saved.preBoilL).toBe(31.3);
    expect(saved.preBoilHotL).toBe(32.6);
    expect(saved.mash?.ratioLPerKg).toBeCloseTo(saved.waterPlan!.mashWaterL / saved.totalGristKg!, 8);
    const planning = BrewingMath.waterVolumes(saved.totalGristKg!, saved.volumeL, saved.brewhouse,
      saved.mash?.spargeType, saved.boilMin, saved.hops.filter(h => h.stage !== 'dryHop').reduce((sum, h) => sum + h.weightG, 0),
      { manualWaterSplit: { mashWaterL: saved.waterPlan!.mashWaterL, spargeWaterL: saved.waterPlan!.spargeWaterL } });
    expect(planning.planningStatus).not.toBe('impossible');
    expect(recipeInstallationIssues(saved, currentInstallation(defaultConfig.brewhouses[0]))).toEqual([]);
    expect(evaluateNoloRecipe(saved)?.simulationActive).toBe(true);
    expect(evaluateNoloRecipe(saved)?.projection.max).toBeCloseTo(simulatedMax, 8);
    expect(describeSavedRecipeWater(saved)?.phEstimate).toBeUndefined();
    expect(recipeWaterExport(saved)).toMatchObject({ mashPhNote: expect.stringContaining('pH à mesurer ou à titrer') });
    expect(recipeWaterExport(saved).mashPhEstimated).toBeUndefined();
    expect(writeRecipeText(saved)).not.toContain('pH empâtage estimé après acide');
    expect(writeRecipeText(saved)).toContain('Empâtage très dilué : pH à mesurer ou à titrer');
    const cold = structuredClone(saved);
    cold.nolo!.process = 'coldExtraction';
    expect(recipeWaterExport(cold).mashPhEstimated).toBeUndefined();
    expect(recipeWaterExport(cold).mashPhNote).toContain('Extraction à froid');
    expect(original).toEqual(originalCopy);

    first.unmount();
    const reading = render(<RecipePage recipe={saved} batches={[]} config={defaultConfig}
      onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()}
      onBrew={vi.fn()} onOpenBatch={vi.fn()}/>);
    expect(screen.getAllByText(/pH d’empâtage à mesurer ou à titrer ; modèle non applicable/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/pH estimé 5,99/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rinçage acidifié seul/)).not.toBeInTheDocument();
    reading.unmount();
    const reopened = mount(saved);
    allerEtape(/^Récapitulatif$/);
    expect(screen.getByRole('region', { name: 'Aperçu NOLO' })).not.toHaveTextContent('Simulation à recalculer');
    const savedAgain = await saveCurrent(reopened.save);
    expect(savedAgain.waterPlan).toEqual(saved.waterPlan);
    expect(savedAgain.mash?.ratioLPerKg).toBe(saved.mash?.ratioLPerKg);
    expect(savedAgain.brewhouse).toEqual(saved.brewhouse);
    expect(savedAgain.preBoilL).toBe(saved.preBoilL);
    expect(savedAgain.fermentation).toEqual(saved.fermentation);
    expect(evaluateNoloRecipe(savedAgain)?.simulationActive).toBe(true);
    const corrected = structuredClone(savedAgain);
    corrected.fermentables[0].weightKg += 0.1;
    expect(evaluateNoloRecipe(corrected)?.simulationActive).toBe(false);
  });

  it('refuse un rinçage LoNa qui dépasse la capacité du matériel figé', async () => {
    const active = currentInstallation(defaultConfig.brewhouses[0]);
    const profile = { ...active, preferences: { ...active.preferences!, preferredMashRatioLPerKg: 3.9, increaseMashToLimitSparge: false } };
    const original = adaptRecipeEquipment(sourceRecipe(), profile, 24);
    const copy = structuredClone(original);
    const mounted = mount(original);
    allerEtape(/^Levure$/);
    fireEvent.change(screen.getByLabelText('Levure de la simulation'), { target: { value: 'lalbrew-lona' } });
    const waterChange = within(screen.getByRole('table', { name: 'Changements proposés dans la recette NOLO', hidden: true }))
      .getByRole('row', { name: /^Eau /, hidden: true });
    expect(waterChange).toHaveTextContent('6,6 L + 26,3 L');
    const waterPreview = screen.getByRole('region', { name: 'Eau proposée pour le scénario NOLO' });
    expect(within(waterPreview).getByRole('alert')).toHaveTextContent(/rinçage dépasse le maximum de 24 L à chaud/);
    expect(screen.getByRole('button', { name: 'Appliquer à la recette' })).toBeDisabled();
    expect(screen.queryByText(/Programme appliqué à la recette/)).not.toBeInTheDocument();
    expect(mounted.save).not.toHaveBeenCalled();
    expect(original).toEqual(copy);
  });

  it('reprend un ratio corrigé dans le brouillon même si la simulation enregistrée devient périmée', async () => {
    const first = mount(sourceRecipe());
    allerEtape(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: /Adapter à mon matériel actuel/ }));
    fireEvent.change(screen.getByLabelText('Levure de la simulation'), { target: { value: 'lalbrew-lona' } });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer à la recette' }));
    const saved = await saveCurrent(first.save);
    first.unmount();

    const editor = mount(saved);
    allerEtape(/^Paliers$/);
    await waitFor(() => expect(readRecipeDraft('qa-nolo-wizard-lona')).toBeDefined());
    editor.unmount();
    const draft = readRecipeDraft('qa-nolo-wizard-lona')!;
    draft.mashRatioOverride = 10;
    draft.volumesEdited = false;
    writeRecipeDraft('qa-nolo-wizard-lona', serializeRecipeDraft(draft));

    const resumed = mount(saved);
    expect(screen.getByText(/Brouillon repris/)).toBeVisible();
    const corrected = await saveCurrent(resumed.save);
    expect(corrected.brewhouse?.preferences?.preferredMashRatioLPerKg).toBe(10);
    expect(corrected.waterPlan?.mashWaterL).toBeCloseTo(10 * corrected.totalGristKg!, 1);
    expect(evaluateNoloRecipe(corrected)?.simulationActive).toBe(false);
  });

  it('ne réintroduit pas une dose automatique à l’empâtage quand seul le rinçage est corrigé', async () => {
    const first = mount(sourceRecipe());
    allerEtape(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: /Adapter à mon matériel actuel/ }));
    fireEvent.change(screen.getByLabelText('Levure de la simulation'), { target: { value: 'lalbrew-lona' } });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer à la recette' }));
    const saved = await saveCurrent(first.save);
    first.unmount();

    const editor = mount(saved);
    allerEtape(/^Paliers$/);
    await waitFor(() => expect(readRecipeDraft('qa-nolo-wizard-lona')).toBeDefined());
    editor.unmount();
    const draft = readRecipeDraft('qa-nolo-wizard-lona')!;
    draft.water.acidOverride = { sparge: 1 };
    writeRecipeDraft('qa-nolo-wizard-lona', serializeRecipeDraft(draft));

    const resumed = mount(saved);
    allerEtape(/^Eau et sels$/);
    const acidity = screen.getByRole('status', { name: 'Acidification à mesurer' });
    expect(acidity).toHaveTextContent(/Empâtage · dose d’acide non calculée/);
    expect(acidity).toHaveTextContent(/Rinçage · dose manuelle retenue : 1 mL/);
    const bicarbonate = screen.getByRole('region', { name: 'Bilan du bicarbonate des eaux', hidden: true });
    expect(bicarbonate).toHaveTextContent('À déterminer');
    expect(bicarbonate).toHaveTextContent('1 mL (dose retenue)');
    expect(bicarbonate).not.toHaveTextContent('3,2 mL');
    allerEtape(/^Récapitulatif$/);
    expect(screen.getByText(/Seules les doses d’acide saisies manuellement sont retenues/)).toBeVisible();
    const corrected = await saveCurrent(resumed.save);
    expect(corrected.waterPlan?.acidOverride).toEqual({ sparge: 1 });
    expect(corrected.waterPlan?.acid).toMatchObject({ mash: 0, sparge: 1 });
    expect(evaluateNoloRecipe(corrected)?.simulationActive).toBe(true);
    expect(recipeWaterExport(corrected).mashPhEstimated).toBeUndefined();

    resumed.unmount();
    const manualReading = render(<RecipePage recipe={corrected} batches={[]} config={defaultConfig}
      onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()}
      onBrew={vi.fn()} onOpenBatch={vi.fn()}/>);
    expect(screen.getByText(/Rinçage acidifié seul/)).toBeInTheDocument();
    manualReading.unmount();
    const zeroEditor = mount(corrected);
    allerEtape(/^Paliers$/);
    await waitFor(() => expect(readRecipeDraft('qa-nolo-wizard-lona')).toBeDefined());
    zeroEditor.unmount();
    const zeroDraft = readRecipeDraft('qa-nolo-wizard-lona')!;
    zeroDraft.water.acidOverride = { mash: 0, sparge: 1 };
    writeRecipeDraft('qa-nolo-wizard-lona', serializeRecipeDraft(zeroDraft));
    const zeroResumed = mount(corrected);
    allerEtape(/^Eau et sels$/);
    expect(screen.getByRole('status', { name: 'Acidification à mesurer' }))
      .toHaveTextContent(/Empâtage · dose manuelle retenue : 0 mL/);
    expect(screen.getByRole('region', { name: 'Bilan du bicarbonate des eaux', hidden: true }))
      .toHaveTextContent('0 mL (dose retenue)');
    const zeroSaved = await saveCurrent(zeroResumed.save);
    expect(zeroSaved.waterPlan?.acidOverride).toEqual({ mash: 0, sparge: 1 });
    expect(zeroSaved.waterPlan?.acid).toMatchObject({ mash: 0, sparge: 1 });
  });
});
