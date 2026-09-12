import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { savedWaterDisplay } from '../../src/domain/water';
import { monSuperStout } from '../fixtures/monSuperStout';
import type { Recipe } from '../../src/types';
import { changeWaterRatio } from '../helpers/waterRatio';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

const click = (name: string) => fireEvent.click(screen.getAllByRole('button', { name, exact: true })[0]);
const spargeAcid = () => screen.getByRole('textbox', { name: /Dose d’acide lactique.*au rinçage/ });
const radar = () => screen.getAllByRole('img', { name: /Profil ionique/ })[0].getAttribute('aria-label');
const changeAcid = (value: string) => {
  fireEvent.change(spargeAcid(), { target: { value } });
  fireEvent.blur(spargeAcid());
};

function mount(recipe: Recipe) {
  const save = vi.fn();
  const view = render(<BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]}
    knownStyles={['Hazy IPA']} onSave={save} onClose={vi.fn()} onSaveWaterSource={vi.fn()}
    onCreateStockItem={vi.fn()} />);
  return { save, ...view };
}

describe('Manual sparge acid through the complete recipe workflow', () => {
  it.each([true, false])('retains sparge acid through dosing, ratio, save and reopen (autoTreatment=%s)', (autoTreatment) => {
    const recipe: Recipe = {
      ...structuredClone(monSuperStout), style: 'Hazy IPA', volumeL: 20,
      fermentables: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 5,
        colorEbc: 4, potentialPpg: 37 }], totalGristKg: 5, hops: [],
      waterPlan: { ...monSuperStout.waterPlan!, autoTreatment, targetProfileId: '21C',
        diRatioPct: 0, spargeDiRatioPct: 0, mashWaterL: 20, spargeWaterL: 10,
        mash: {}, sparge: {}, acid: { id: 'lactique', mash: 0, sparge: 0 },
        acidOverride: { mash: 0, sparge: 0 }, startIons: undefined, wortIons: undefined }
    };
    const view = mount(recipe);
    click('Eau et sels');
    changeAcid('2');
    expect(spargeAcid()).toHaveValue('2');
    // 250 mg/L − 2 mL × 600 mg/mL / 10 L, independent of mash salts.
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('130');
    const acidifiedGraph = radar();

    click('Proposer les doses');
    expect(spargeAcid()).toHaveValue('2');
    changeWaterRatio(screen.getByRole('slider', { name: 'SO₄ ⇄ Cl' }), 1.5);
    expect(spargeAcid()).toHaveValue('2');
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('130');

    // Explicit zero also remains a manual quantity and immediately restores bicarbonate.
    changeAcid('0');
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('250');
    expect(radar()).not.toBe(acidifiedGraph);
    changeAcid('2');
    const finalGraph = radar();
    click('Récapitulatif');
    expect(radar()).toBe(finalGraph);
    click('Enregistrer la recette');
    const saved = view.save.mock.calls[0][0] as Recipe;
    expect(saved.waterPlan).toMatchObject({ autoTreatment, acidOverride: { mash: 0, sparge: 2 },
      acid: { id: 'lactique', mash: 0, sparge: 2 }, wortIons: { hco3: 210 } });
    expect(savedWaterDisplay(saved.waterPlan)!.achieved).toEqual(saved.waterPlan!.wortIons);
    const exported = readRecipeText(writeRecipeText(saved));
    expect(exported.waterPlan!.acidOverride).toEqual({ mash: 0, sparge: 2 });
    view.unmount();

    const reopened = mount(exported);
    click('Eau et sels');
    expect(spargeAcid()).toHaveValue('2');
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('130');
    expect(radar()).toBe(finalGraph);
    click('Récapitulatif');
    click('Enregistrer la recette');
    expect(reopened.save.mock.calls[0][0].waterPlan).toEqual(saved.waterPlan);
  });
});
