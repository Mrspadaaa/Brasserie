import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { writeRecipeText, readRecipeText } from '../../src/domain/recipeTransfer';
import { Recipe } from '../../src/types';
import { monSuperStout, monSuperStoutRo } from '../fixtures/monSuperStout';
import { styleByCode } from '../../src/domain/waterStyles';
import { PROFILE_IONS } from '../../src/domain/water/profileAssessment';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

const click = (name: string | RegExp) => fireEvent.click(screen.getAllByRole('button', { name })[0]);
const acid = () => screen.getByRole('textbox', { name: /Dose d’acide lactique.*à l’empâtage/ });
const radar = () => screen.getAllByRole('img', { name: /Profil ionique/ })[0];
const waterProfile = () => screen.getByRole('combobox', { name: 'NEIPA, Pils, Imperial Stout…' });

function mount(recipe: Recipe = monSuperStout) {
  const save = vi.fn();
  render(<BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]}
    knownStyles={['Imperial stout', 'Hazy IPA', 'Saison']} onSave={save} onClose={vi.fn()}
    onSaveWaterSource={vi.fn()} onCreateStockItem={vi.fn()} />);
  return save;
}

function selectBeerStyle(name: string) {
  click('Identité');
  fireEvent.click(screen.getByRole('combobox', { name: 'Style de la bière' }));
  fireEvent.click(screen.getByRole('option', { name, exact: true }));
}

describe('Mon super stout — recipe profile, manual acid and Doser', () => {
  it('RO stout: explains the real bicarbonate objective consistently in the workshop and recap', () => {
    const save = mount(monSuperStoutRo);
    click('Eau et sels');
    expect(screen.getByText(/Alcalinité résiduelle — repère pour les malts/)).toHaveTextContent('≈ -18 ppm');
    expect(screen.queryByText(/Alcalinité résiduelle — repère 110 à 166/)).not.toBeInTheDocument();
    const explanation = screen.getByLabelText('Objectif du bicarbonate');
    expect(explanation).toHaveTextContent('62,1 ppm sur l’eau totale ; 81,9 à l’empâtage');
    expect(explanation).toHaveTextContent('pH estimé 5.50 ±0.15');
    expect(explanation).toHaveTextContent('à vérifier au brassage');
    expect(screen.getByText(/Mg : 0 ppm dans l’eau/)).toHaveTextContent('les malts en apportent au moût');
    const graphBefore = radar().getAttribute('aria-label');
    click('Récapitulatif');
    expect(screen.getByText(/Alcalinité résiduelle après acide/)).toHaveTextContent('repère pour les malts ≈ -18 ppm');
    expect(radar().getAttribute('aria-label')).toBe(graphBefore);
    click('Enregistrer la recette');
    const saved = save.mock.calls[0][0];
    expect(saved.waterPlan.mash).toEqual(monSuperStoutRo.waterPlan.mash);
    expect(saved.waterPlan.wortIons).toEqual(monSuperStoutRo.waterPlan.wortIons);
    const copied = readRecipeText(writeRecipeText(saved));
    expect(copied.waterPlan.wortIons).toEqual(saved.waterPlan.wortIons);
    cleanup();
    mount(copied);
    click('Eau et sels');
    expect(radar().getAttribute('aria-label')).toBe(graphBefore);
  });

  it('RO stout: manual acid updates the estimated mash pH without moving the style zone or the alkali objective', () => {
    mount(monSuperStoutRo);
    click('Eau et sels');
    const ph = () => screen.getByText(/^pH estimé — cible/).parentElement!;
    const zone = () => radar().querySelector('[data-ion-target="hco3"]')!.getAttribute('d');
    const zoneBefore = zone();
    expect(ph()).toHaveTextContent('5.50');
    fireEvent.change(acid(), { target: { value: '2' } });
    fireEvent.blur(acid());
    expect(ph()).toHaveTextContent('5.45');
    expect(screen.getByLabelText('Objectif du bicarbonate')).toHaveTextContent('pH estimé 5.45');
    expect(screen.getByText(/Alcalinité résiduelle — repère pour les malts/)).toHaveTextContent('≈ -18 ppm');
    expect(zone()).toBe(zoneBefore);
    click('Revenir aux doses d’acide calculées');
    expect(acid()).toHaveValue('0');
    expect(ph()).toHaveTextContent('5.50');
    click('Proposer les doses');
    expect(acid()).toHaveValue('0');
    const graph = radar().getAttribute('aria-label');
    click('Proposer les doses');
    expect(radar().getAttribute('aria-label')).toBe(graph);
    expect(zone()).toBe(zoneBefore);
  });

  it('preserves the saved choices and exposes the two causes before making a correction', () => {
    mount();
    click('Eau et sels');
    expect(waterProfile()).toHaveValue('Équilibré (sans style)');
    expect(acid()).toHaveValue('7,5');
    expect(screen.getByRole('status', { name: 'Acide manuel à l’empâtage' })).toHaveTextContent('Acide empâtage manuel : 7,5 mL ; calcul : 13,3 mL.');
    expect(screen.getByRole('status', { name: 'Acide manuel à l’empâtage' })).toHaveTextContent('200 → 101 ppm');
    expect(screen.getByRole('button', { name: 'Utiliser Imperial Stout' })).toBeInTheDocument();
    expect(radar()).toHaveAccessibleName(/Alcalinité.*101,3 ppm pour 0 à 100/);
  });

  it('adopts the profile, preserves manual acid through Doser, then explicitly resets and saves', () => {
    const save = mount();
    click('Eau et sels');
    click('Utiliser Imperial Stout');
    expect(waterProfile()).toHaveValue('20C — Imperial Stout');
    expect(acid()).toHaveValue('7,5'); // Profile selection never erases a manual dose.
    click('Proposer les doses');
    expect(acid()).toHaveValue('7,5');
    click('Revenir aux doses d’acide calculées');
    // Resetting acid preserves weighed salts, including the alkali that
    // compensated the manual dose. Doser below then removes that compensation.
    expect(acid()).toHaveValue('7,5');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Profil atteint : 6/6 ions dans les plages.')).toBeInTheDocument();
    // A new plan no longer needs to compensate for the removed manual acid.
    click('Proposer les doses');
    // This grist does not support the style's interior HCO3. The weighed dose
    // stays above its hard floor: 200 - 6 * 600 / 45.6 = 121.05 ppm.
    expect(acid()).toHaveValue('6');
    expect(radar()).toHaveAccessibleName(/Alcalinité.*121,1 ppm pour 120 à 250/);
    const first = radar().getAttribute('aria-label');
    click('Proposer les doses');
    expect(radar().getAttribute('aria-label')).toBe(first);
    click('Récapitulatif');
    click('Enregistrer la recette');
    const saved = save.mock.calls[0][0];
    expect(saved.waterPlan).toMatchObject({
      targetProfileId: '20C', acid: { id: 'lactique', mash: 6, sparge: 0 }
    });
    expect(saved.waterPlan.acidOverride).toBeUndefined();
    for (const ion of PROFILE_IONS) {
      expect(saved.waterPlan.wortIons[ion], ion).toBeGreaterThanOrEqual(styleByCode('20C').ions[ion].min);
      expect(saved.waterPlan.wortIons[ion], ion).toBeLessThanOrEqual(styleByCode('20C').ions[ion].max);
    }
    const copied = readRecipeText(writeRecipeText(saved));
    expect(copied.waterPlan.acid).toEqual(saved.waterPlan.acid);
    expect(copied.waterPlan.wortIons).toEqual(saved.waterPlan.wortIons);
    cleanup();
    mount(saved);
    click('Eau et sels');
    expect(radar().getAttribute('aria-label')).toBe(first);
    expect(acid()).toHaveValue('6');
  });

  it('can reset just the acid while keeping the weighed salts and chosen profile', () => {
    const save = mount();
    click('Eau et sels');
    click('Revenir aux doses d’acide calculées');
    expect(acid()).toHaveValue('13,3');
    // No positive profile floor here: actual grist alkalinity guides the acid.
    // 200 - 13.3 * 600 / 45.6 = 25 ppm, within the unchanged 0–100 range.
    expect(radar()).toHaveAccessibleName(/Alcalinité.*25 ppm pour 0 à 100/);
    expect(screen.getByLabelText('Bilan du pH estimé')).toHaveTextContent('5,40');
    click('Récapitulatif');
    click('Enregistrer la recette');
    expect(save.mock.calls[0][0].waterPlan.mash).toEqual(monSuperStout.waterPlan.mash);
    expect(save.mock.calls[0][0].waterPlan.targetProfileId).toBe('—');
  });

  it('follows changes to beer style until the brewer chooses another water profile', () => {
    mount({ ...monSuperStout, style: '', waterPlan: undefined });
    selectBeerStyle('Imperial stout');
    click('Eau et sels');
    expect(waterProfile()).toHaveValue('20C — Imperial Stout');
    selectBeerStyle('Hazy IPA');
    click('Eau et sels');
    expect(waterProfile()).toHaveValue('21C — Hazy IPA · NEIPA');
    fireEvent.click(waterProfile());
    fireEvent.click(screen.getByRole('option', { name: /Équilibré \(sans style\)/ }));
    selectBeerStyle('Saison');
    click('Eau et sels');
    expect(waterProfile()).toHaveValue('Équilibré (sans style)');
  });

  it('keeps a saved numeric water target when beer style changes', () => {
    const targetIons = { cl: 150, so4: 75, hco3: 100 };
    const save = mount({ ...monSuperStout, waterPlan: {
      ...monSuperStout.waterPlan, targetIons, targetName: 'Mon eau ronde'
    } });
    selectBeerStyle('Hazy IPA');
    click('Eau et sels');
    expect(screen.queryByRole('button', { name: /^Utiliser / })).not.toBeInTheDocument();
    click('Récapitulatif');
    click('Enregistrer la recette');
    expect(save.mock.calls[0][0].waterPlan.targetIons).toEqual(targetIons);
  });
});
