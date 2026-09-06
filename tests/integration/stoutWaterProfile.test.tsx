import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { writeRecipeText, readRecipeText } from '../../src/domain/recipeTransfer';
import { Recipe } from '../../src/types';
import { monSuperStout } from '../fixtures/monSuperStout';

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
  it('preserves the saved choices and exposes the two causes before making a correction', () => {
    mount();
    click('Eau et sels');
    expect(waterProfile()).toHaveValue('Équilibré (sans style)');
    expect(acid()).toHaveValue('7,5');
    expect(screen.getByRole('status')).toHaveTextContent('Acide empâtage manuel : 7,5 mL ; calcul : 0 mL.');
    expect(screen.getByRole('status')).toHaveTextContent('200 → 101 ppm');
    expect(screen.getByRole('button', { name: 'Utiliser Imperial Stout' })).toBeInTheDocument();
    expect(radar()).toHaveAccessibleName(/Alcalinité.*101 ppm pour 0 à 100/);
  });

  it('adopts the matching profile, resets acid through Doser, then saves and exports the actual result', () => {
    const save = mount();
    click('Eau et sels');
    click('Utiliser Imperial Stout');
    expect(waterProfile()).toHaveValue('20C — Imperial Stout');
    expect(acid()).toHaveValue('7,5'); // Profile selection never erases a manual dose.
    click('Proposer les doses');
    expect(acid()).toHaveValue('0');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(radar()).toHaveAccessibleName(/Alcalinité.*200 ppm pour 120 à 250/);
    const first = radar().getAttribute('aria-label');
    click('Proposer les doses');
    expect(radar().getAttribute('aria-label')).toBe(first);
    click('Récapitulatif');
    click('Enregistrer la recette');
    const saved = save.mock.calls[0][0];
    expect(saved.waterPlan).toMatchObject({
      targetProfileId: '20C', wortIons: { hco3: 200 }, acid: { id: 'lactique', mash: 0, sparge: 0 }
    });
    expect(saved.waterPlan.acidOverride).toBeUndefined();
    expect(saved.waterPlan.wortIons.so4).toBeLessThanOrEqual(80);
    const copied = readRecipeText(writeRecipeText(saved));
    expect(copied.waterPlan.acid).toEqual(saved.waterPlan.acid);
    expect(copied.waterPlan.wortIons).toEqual(saved.waterPlan.wortIons);
    cleanup();
    mount(saved);
    click('Eau et sels');
    expect(radar().getAttribute('aria-label')).toBe(first);
    expect(acid()).toHaveValue('0');
  });

  it('can reset just the acid while keeping the weighed salts and chosen profile', () => {
    const save = mount();
    click('Eau et sels');
    click('Revenir aux doses d’acide calculées');
    expect(acid()).toHaveValue('0');
    expect(radar()).toHaveAccessibleName(/Alcalinité.*200 ppm/);
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
