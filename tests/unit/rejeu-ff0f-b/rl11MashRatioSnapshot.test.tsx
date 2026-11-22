// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../../src/pages/BrewWizard';
import { defaultConfig } from '../../../src/services/storage';
import { brewerJobs } from '../../../src/services/brewerJobs';
import { practicalBrewingPreferences, practicalEquipment } from '../../../src/domain/brewEquipment';
import { DEFAULT_WATER_SOURCE } from '../../../src/domain/water';
import type { BrewhouseProfile, Recipe } from '../../../src/types';
import { recipe as fixtureRecipe } from '../../fixtures/brewCompanion';
import { allerEtape } from '../../helpers/wizard';

// RL-11 : « ZZ TEST — Recette », ajout puis retrait d'un fermentescible de 0,1 kg et deux enregistrements. `mash.ratioLPerKg` revenait à 3,
// mais `brewhouse.mashRatioLPerKg` restait à 2,9655 (25,8 L / 8,7 kg) : le rapport du matériel gardé dans la recette reprenait le quotient de
// l'enregistrement précédent, calculé sur une masse que la recette n'avait plus. Il doit suivre la valeur retenue, jamais un quotient périmé.

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); vi.clearAllMocks(); });

const PROFIL: BrewhouseProfile = { id: 'rig-rl11', name: 'Cuve RL-11', volumeL: 40, efficiencyPct: 75,
  boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment },
  preferences: { ...practicalBrewingPreferences } };
const MASH_L = 25.8;

/** Une recette tout grain à répartition d'eau saisie (25,8 L d'empâtage) pour `grainKg` de grain. */
function recetteManuelle(grainKg: number): Recipe {
  const fixture = fixtureRecipe();
  return { ...fixture, id: 'REC-RL11', name: 'ZZ TEST — Recette', brewhouse: PROFIL, volumeL: 40, totalGristKg: grainKg,
    installation: { manualWaterSplit: true, fermenterHeadspacePct: 10, spargeExceptionAccepted: false },
    hops: [], fermentables: [{ ...fixture.fermentables[0], kind: 'grain', use: 'empatage', weightKg: grainKg }],
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], ratioLPerKg: MASH_L / grainKg, spargeType: 'batch' },
    waterPlan: { ...fixture.waterPlan!, sourceId: DEFAULT_WATER_SOURCE.id, sourceSnapshot: DEFAULT_WATER_SOURCE,
      mashWaterL: MASH_L, spargeWaterL: 18 },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] };
}
function ouvrirEtEnregistrer(recipe: Recipe): Recipe {
  const save = vi.fn();
  const rendu = render(<BrewWizard localOnly seed={{ recipe }}
    config={{ ...defaultConfig, brewhouses: [PROFIL], activeBrewhouseId: PROFIL.id }}
    stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={save}
    onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
  allerEtape(/^Récapitulatif$/);
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
  expect(save).toHaveBeenCalledTimes(1);
  rendu.unmount();
  return save.mock.calls[0][0] as Recipe;
}

describe('RL-11 · le rapport du matériel gardé dans la recette suit la valeur retenue', () => {
  it('+0,1 kg puis −0,1 kg, deux enregistrements : brewhouse.mashRatioLPerKg revient à mash.ratioLPerKg (3), pas à 25,8 / 8,7', () => {
    // Avant : 8,6 kg, 25,8 L d'empâtage, soit 3 L/kg. Ajout de 0,1 kg : 8,7 kg, l'eau saisie ne bouge pas.
    const apresAjout = ouvrirEtEnregistrer(recetteManuelle(8.7));
    expect(apresAjout.mash!.ratioLPerKg).toBeCloseTo(MASH_L / 8.7, 4);
    expect(apresAjout.brewhouse!.mashRatioLPerKg).toBeCloseTo(MASH_L / 8.7, 4);
    // Retrait : la recette enregistrée repasse à 8,6 kg.
    const retrait: Recipe = { ...apresAjout, totalGristKg: 8.6, fermentables: apresAjout.fermentables!.map(f => ({ ...f, weightKg: 8.6 })) };
    const apresRetrait = ouvrirEtEnregistrer(retrait);
    expect(apresRetrait.mash!.ratioLPerKg).toBeCloseTo(3, 4);
    expect(apresRetrait.brewhouse!.mashRatioLPerKg).toBeCloseTo(3, 4);
    expect(apresRetrait.brewhouse!.mashRatioLPerKg).toBe(apresRetrait.mash!.ratioLPerKg);
    expect(apresRetrait.brewhouse!.preferences?.preferredMashRatioLPerKg).toBeCloseTo(3, 4);
    expect(apresRetrait.brewhouse!.mashRatioLPerKg).not.toBeCloseTo(2.9655, 3);
  }, 60000);

  it('répartition automatique : le rapport du matériel reste celui du profil (4,2), jamais le quotient arrondi de l’eau', () => {
    const auto: Recipe = { ...recetteManuelle(5), installation: { manualWaterSplit: false, fermenterHeadspacePct: 10, spargeExceptionAccepted: false } };
    const enregistree = ouvrirEtEnregistrer(auto);
    expect(enregistree.brewhouse!.mashRatioLPerKg).toBe(4.2);
    expect(enregistree.brewhouse!.preferences).toEqual(PROFIL.preferences);
  }, 60000);
});
