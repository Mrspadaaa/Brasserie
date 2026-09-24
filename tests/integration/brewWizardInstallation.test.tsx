import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { BrewingMath } from '../../src/services/brewingMath';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { recipeThermalPlan } from '../../src/domain/recipeThermalPlan';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import type { BrewhouseProfile, Recipe } from '../../src/types';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';
import { allerEtape } from '../helpers/wizard';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); vi.clearAllMocks(); });

function automaticRecipe(): Recipe {
  const profile: BrewhouseProfile = { id: 'my-rig', name: 'Cuve personnelle', volumeL: 26, efficiencyPct: 75,
    boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment },
    preferences: { ...practicalBrewingPreferences } };
  const water = BrewingMath.waterVolumes(2.5, 26, profile, 'batch', 60, 0);
  const fixture = fixtureRecipe();
  return { ...fixture, id: 'recipe-auto', brewhouse: profile, volumeL: 26, totalGristKg: 2.5,
    installation: { manualWaterSplit: false, fermenterHeadspacePct: 10, spargeExceptionAccepted: false },
    hops: [], fermentables: [{ ...fixture.fermentables[0], weightKg: 2.5 }],
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }, { name: 'Mash-out importé', tempC: 75, durationMin: 15 }],
      ratioLPerKg: water.mashWaterL / 2.5, spargeType: 'batch' },
    preBoilL: water.preBoilVolumeL, preBoilHotL: water.preBoilHotL,
    waterPlan: { ...fixture.waterPlan!, sourceId: DEFAULT_WATER_SOURCE.id, sourceSnapshot: DEFAULT_WATER_SOURCE,
      mashWaterL: water.mashWaterL, spargeWaterL: water.spargeWaterL },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] };
}
function mount(recipe: Recipe, save = vi.fn()) {
  return { save, ...render(<BrewWizard localOnly seed={{ recipe }}
    config={{ ...defaultConfig, brewhouses: [recipe.brewhouse!], activeBrewhouseId: recipe.brewhouse!.id }}
    stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={save}
    onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />) };
}
function saveRecipe(save: ReturnType<typeof vi.fn>): Recipe {
  allerEtape(/^Récapitulatif$/);
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
  expect(save).toHaveBeenCalledTimes(1);
  return save.mock.calls[0][0] as Recipe;
}

describe('réouverture de l’assistant avec les choix de l’installation', () => {
  it('ne transforme pas une répartition automatique en saisie manuelle ni son ratio calculé en préférence', () => {
    const original = automaticRecipe();
    expect(original.mash!.ratioLPerKg).toBeGreaterThan(4.2); // More mash water was needed to keep the hot sparge within 18 L.
    const before = structuredClone(original);
    const first = mount(original);
    const saved = saveRecipe(first.save);
    expect(saved.installation!.manualWaterSplit).toBe(false);
    expect(saved.brewhouse!.preferences).toEqual(original.brewhouse!.preferences);
    expect(saved.brewhouse!.preferences).toMatchObject({ preferredMashRatioLPerKg: 4.2, increaseMashToLimitSparge: true });
    expect(saved.waterPlan!.mashWaterL).toBe(original.waterPlan!.mashWaterL);
    expect(saved.waterPlan!.spargeWaterL).toBe(original.waterPlan!.spargeWaterL);
    expect(original).toEqual(before);
    first.unmount();
    const reopened = mount(saved);
    const again = saveRecipe(reopened.save);
    expect(again.installation!.manualWaterSplit).toBe(false);
    expect(again.brewhouse!.preferences).toEqual(original.brewhouse!.preferences);
  });

  it('retrouve le mash-out importé à 75 °C pendant 15 min après suppression, enregistrement et réouverture', () => {
    const original = automaticRecipe();
    const first = mount(original);
    allerEtape(/^Paliers$/);
    fireEvent.click(screen.getByText('Comparer sans mash-out', { selector: 'summary' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choisir le programme sans mash-out' }));
    const without = saveRecipe(first.save);
    expect(recipeThermalPlan(without).rows).toHaveLength(1);
    expect(without.mash).toMatchObject({ mashoutEnabled: false, mashoutTempC: 75, mashoutDurationMin: 15 });
    first.unmount();
    const reopened = mount(without);
    allerEtape(/^Paliers$/);
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir le mash-out' }));
    const restored = saveRecipe(reopened.save);
    expect(recipeThermalPlan(restored).rows.at(-1)).toMatchObject({ tempC: 75, durationMin: 15 });
    expect(recipeThermalPlan(restored).rows).toHaveLength(2);
    expect(original.mash!.steps[1]).toMatchObject({ tempC: 75, durationMin: 15 });
  });
});
