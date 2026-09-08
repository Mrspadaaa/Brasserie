import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SaltSolver, type WaterState } from '../../src/ui/SaltSolver';
import { DEFAULT_WATER_SOURCE, calculateWaterTreatment, targetRaForGrist, savedWaterDisplay } from '../../src/domain/water';
import { styleByCode } from '../../src/domain/waterStyles';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import type { Recipe } from '../../src/types';
import { monSuperStout } from '../fixtures/monSuperStout';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

afterEach(cleanup);
const grains = [{ name: 'Pilsner Malz', kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }];

describe('Product contract: Doser respects the complete chosen water profile', () => {
  it.each([true, false])('brings the photo into all six ranges after both acid doses (manual=%s)', (manual) => {
    let actual: WaterState;
    function Host() {
      const [state, setState] = useState<WaterState>({
        styleCode: '20C', diRatioPct: 20, mashWaterL: 10.8, spargeWaterL: 21.5,
        allSaltsInMash: true, doses: { gypse: 2.6, cacl2: 2.1, nacl: .5, kcl: 3 },
        disabled: [], acidId: 'lactique',
        acidOverride: manual ? { mash: 0, sparge: 6.2 } : undefined,
      });
      actual = state;
      return <SaltSolver state={state} onChange={setState} source={DEFAULT_WATER_SOURCE}
        onSourceChange={() => {}} beerEbc={3.6} beerVolumeL={24}
        noSparge={false} onNoSpargeChange={() => {}}
        brew={{ style: 'Imperial stout', totalGristKg: 2.2, grist: grains, targetPh: 5.4 }} />;
    }
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: 'Proposer les doses' }));
    const retained = (side: string) => Number((screen.getByRole('textbox', { name: new RegExp(`Dose d’acide lactique.*${side}`) }) as HTMLInputElement).value.replace(',', '.'));
    const output = calculateWaterTreatment(DEFAULT_WATER_SOURCE, { ...actual!,
      acidOverride: { mash: retained('à l’empâtage'), sparge: retained('au rinçage') } }, targetRaForGrist(3.6, grains, 10.8 / 2.2));
    const bands = styleByCode('20C').ions;
    for (const ion of ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as const) {
      expect(output.treatedTotal[ion], `${ion} after retained acid`).toBeGreaterThanOrEqual(bands[ion].min);
      expect(output.treatedTotal[ion], `${ion} after retained acid`).toBeLessThanOrEqual(bands[ion].max);
    }
    if (manual) expect(actual!.acidOverride).toEqual({ mash: 0, sparge: 6.2 });
    expect(screen.getByLabelText('Bilan des objectifs de l’eau')).toHaveTextContent('Profil atteint');
  });

  it.each([true, false])('keeps all six ranges through recap, export and reopening (autoTreatment=%s)', autoTreatment => {
    const recipe: Recipe = {
      ...structuredClone(monSuperStout), name: 'Ttt', volumeL: 24, boilMin: 95,
      fermentables: grains, totalGristKg: 2.2, hops: [],
      mash: { ...monSuperStout.mash!, ratioLPerKg: 10.8 / 2.2 },
      waterPlan: { ...monSuperStout.waterPlan!, autoTreatment, targetProfileId: '20C',
        mashWaterL: 10.8, spargeWaterL: 21.5, diRatioPct: 20,
        mash: { gypse: 2.6, cacl2: 2.1, nacl: .5, kcl: 3 }, sparge: {},
        acid: { id: 'lactique', mash: 0, sparge: 6.2 }, acidOverride: { mash: 0, sparge: 6.2 },
        startIons: undefined, wortIons: undefined }
    };
    const save = vi.fn();
    const mount = (recipe: Recipe) => render(<BrewWizard seed={{ recipe }} config={defaultConfig}
      stockItems={[]} knownStyles={['Imperial stout']} onSave={save} onClose={vi.fn()}
      onSaveWaterSource={vi.fn()} onCreateStockItem={vi.fn()} />);
    const click = (name: string) => fireEvent.click(screen.getAllByRole('button', { name, exact: true })[0]);
    const graph = () => screen.getAllByRole('img', { name: /Profil ionique/ })[0].getAttribute('aria-label');
    mount(recipe);
    click('Eau et sels');
    click('Proposer les doses');
    expect(screen.getByLabelText('Bilan des objectifs de l’eau')).toHaveTextContent('Profil atteint : 6/6');
    const workshop = graph();
    click('Récapitulatif');
    expect(graph()).toBe(workshop);
    click('Enregistrer la recette');
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.waterPlan).toMatchObject({ autoTreatment,
      acidOverride: { mash: 0, sparge: 6.2 }, acid: { id: 'lactique', mash: 0, sparge: 6.2 } });
    const actual = savedWaterDisplay(saved.waterPlan)!.achieved;
    expect(saved.waterPlan!.wortIons).toEqual(actual);
    for (const ion of ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as const) {
      expect(actual[ion], ion).toBeGreaterThanOrEqual(styleByCode('20C').ions[ion].min);
      expect(actual[ion], ion).toBeLessThanOrEqual(styleByCode('20C').ions[ion].max);
    }
    const imported = readRecipeText(writeRecipeText(saved));
    expect(imported.waterPlan).toEqual(saved.waterPlan);
    cleanup();
    mount(imported);
    click('Eau et sels');
    expect(graph()).toBe(workshop);
    expect(screen.getByLabelText('Bilan des objectifs de l’eau')).toHaveTextContent('Profil atteint : 6/6');
  });
});
