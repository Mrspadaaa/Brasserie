import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { NumberInput } from '../../src/ui/NumberInput';
import { RecipeReview } from '../../src/ui/RecipeReview';
import { defaultConfig } from '../../src/services/storage';
import { Recipe, StockItem } from '../../src/types';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';

const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({
  AiClient: { run: (...args: any[]) => run(...args) }
}));
afterEach(() => {
  cleanup();
  run.mockReset();
});
const base: Recipe = {
  id: 'R-test',
  name: 'Test',
  style: 'NEIPA',
  volumeL: 20,
  boilMin: 60,
  ogTarget: 1.05,
  fgTarget: 1.01,
  abvTarget: 5,
  totalGristKg: 5,
  fermentables: [
    { name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 5, colorEbc: 4, potentialPpg: 37 }
  ],
  hops: [{ name: 'Citra', weightG: 30, alpha: 12, stage: 'boil', timeMin: 10 }],
  yeast: {
    name: 'US-05',
    form: 'sèche',
    qty: 1,
    unit: 'sachet',
    attenuationPct: 81,
    lab: 'Fermentis',
    fermTempMinC: 18,
    fermTempMaxC: 22
  },
  mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }], spargeType: 'batch' },
  waterPlan: {
    sourceId: DEFAULT_WATER_SOURCE.id,
    sourceSnapshot: DEFAULT_WATER_SOURCE,
    treatmentVersion: 2,
    diRatioPct: 0,
    spargeDiRatioPct: 60,
    targetProfileId: 'NEIPA',
    mashWaterL: 25,
    spargeWaterL: 10,
    allSaltsInMash: true,
    mash: { gypse: 2, cacl2: 3 },
    sparge: {},
    acid: { id: 'lactique', mash: 1.7, sparge: 0.4 },
    acidOverride: { mash: 1.7, sparge: 0.4 },
    targetPh: 5.4
  },
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }],
  steps: [],
  notes: []
};
const stock: StockItem = {
  id: 'm2',
  ref: 'M2',
  name: 'Munich',
  category: 'Malt',
  unit: 'kg',
  currentStock: 10,
  minStock: 0,
  reorder: false,
  colorEbc: 20,
  potentialPpg: 36
};
function wizard(recipe = base, save = vi.fn()) {
  return render(
    <BrewWizard
      seed={{ recipe }}
      config={defaultConfig}
      stockItems={[
        stock,
        {
          ...stock,
          id: 'y2',
          ref: 'Y2',
          name: 'Nouvelle souche',
          category: 'Levure',
          unit: 'sachet'
        }
      ]}
      knownStyles={['NEIPA']}
      onSave={save}
      onClose={vi.fn()}
      onSaveWaterSource={vi.fn()}
      onLearnIngredient={vi.fn()}
      onCreateStockItem={vi.fn()}
    />
  );
}
const step = (name: RegExp) => fireEvent.click(screen.getAllByRole('button', { name })[0]);
const change = (el: HTMLElement, value: string) => {
  fireEvent.change(el, { target: { value } });
  fireEvent.blur(el);
};
const radar = () => screen.getByRole('img', { name: /Profil ionique/ }).getAttribute('aria-label');

describe('Recipe data entry regressions', () => {
  it('lets the brewer explicitly update a saved source snapshot', async () => {
    wizard();
    step(/^Eau/);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    change(screen.getByLabelText('Nom du réseau ou de la source'), 'Analyse corrigée');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’analyse' }));
    step(/^Récapitulatif$/);
    run.mockResolvedValue({ ok: true, data: { verdict: 'Source à jour', findings: [] } });
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    await screen.findByText('Source à jour');
    expect(run.mock.calls[0][0].context.fiche.recipe.waterPlan.sourceSnapshot.name).toBe(
      'Analyse corrigée'
    );
  });
  it('does not carry the previous yeast technical data into a different strain', async () => {
    wizard();
    step(/^Levure$/);
    const picker = screen.getByRole('combobox', { name: 'Souche de levure' });
    fireEvent.focus(picker);
    fireEvent.change(picker, { target: { value: 'Nouvelle souche' } });
    fireEvent.keyDown(picker, { key: 'Enter' });
    step(/^Récapitulatif$/);
    run.mockResolvedValue({ ok: true, data: { verdict: 'Données manquantes', findings: [] } });
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    await screen.findByText('Données manquantes');
    const yeast = run.mock.calls[0][0].context.fiche.recipe.yeast;
    expect(yeast.name).toBe('Nouvelle souche');
    expect(yeast.attenuationPct).toBeUndefined();
    expect(yeast.lab).toBeUndefined();
    expect(yeast.fermTempMinC).toBeUndefined();
  });
  it('adding a malt completes a touch click without advancing to hops', () => {
    wizard();
    step(/^Fermentescibles$/);
    const picker = screen.getByRole('combobox', { name: /Ajouter un fermentescible/ });
    fireEvent.focus(picker);
    fireEvent.change(picker, { target: { value: 'Munich' } });
    const option = screen.getByRole('option', { name: /Munich/ });
    fireEvent.pointerDown(option, { pointerType: 'touch', clientX: 100, clientY: 200 });
    fireEvent.pointerUp(option, { pointerType: 'touch', clientX: 100, clientY: 200 });
    expect(option).toBeInTheDocument();
    fireEvent.click(option);
    expect(screen.getByRole('button', { name: /Suivant — Houblons/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retirer Munich/ })).toBeInTheDocument();
  });
  it('edits EBC and PPG in both steps, saves them, and restores manual acids', async () => {
    const save = vi.fn();
    wizard(base, save);
    step(/^Fermentescibles$/);
    fireEvent.click(screen.getByText(/Base · 4 EBC/));
    change(screen.getByLabelText('Couleur de Pilsner en EBC'), '9,5');
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByText(/Base · 9.5 EBC/));
    change(screen.getByLabelText('Potentiel de Pilsner en PPG'), '38');
    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer la recette$/ }));
    expect(save).toHaveBeenCalled();
    const saved = save.mock.calls[0][0];
    expect(saved.fermentables[0]).toMatchObject({ colorEbc: 9.5, potentialPpg: 38 });
    expect(saved.waterPlan.acid).toEqual({ id: 'lactique', mash: 1.7, sparge: 0.4 });
    cleanup();
    wizard(JSON.parse(JSON.stringify(saved)));
    step(/^Récapitulatif$/);
    expect(screen.getByText(/Base · 9.5 EBC/)).toBeInTheDocument();
    run.mockResolvedValue({ ok: true, data: { verdict: 'OK', findings: [] } });
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    await waitFor(() => expect(run).toHaveBeenCalled());
    expect(run.mock.calls[0][0].context.fiche.recipe.waterPlan).toMatchObject({
      acidOverride: { mash: 1.7, sparge: 0.4 }
    });
  });
  it('shows identical current ions in workshop and recap, and sends salts, acids and ranges to AI', async () => {
    wizard();
    step(/^Eau/);
    const workshop = radar();
    step(/^Récapitulatif$/);
    expect(radar()).toBe(workshop);
    run.mockResolvedValue({ ok: true, data: { verdict: 'À jour', findings: [] } });
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    await screen.findByText('À jour');
    const context = run.mock.calls[0][0].context;
    expect(context.fiche.recipe.waterPlan.mash).toEqual({ gypse: 2, cacl2: 3 });
    expect(context.fiche.waterTreatment.mashAcid.amount).toBe(1.7);
    expect(context.fiche.waterTreatment.style.ions.hco3).toBeDefined();
    expect(context.recette).toMatch(/Empâtage après acide/);
    expect(context.recette).toMatch(/Gypse/);
    change(screen.getByLabelText('Masse de Pilsner'), '5.5');
    expect(screen.queryByText('À jour')).toBeNull();
  });
  it('keeps optional empty numbers missing while quantities default to zero', () => {
    const optional = vi.fn(),
      quantity = vi.fn();
    render(
      <>
        <NumberInput aria-label="EBC" value={6} onValue={optional} emptyValue={undefined} />
        <NumberInput aria-label="Dose" value={6} onValue={quantity} />
      </>
    );
    change(screen.getByLabelText('EBC'), '');
    change(screen.getByLabelText('Dose'), '');
    expect(optional).toHaveBeenLastCalledWith(undefined);
    expect(quantity).toHaveBeenLastCalledWith(0);
  });
  it('discards a review returned after its recipe was changed and allows retry after failure', async () => {
    let resolve: (result: any) => void;
    run.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const { rerender } = render(<RecipeReview buildText={() => 'Acide 1 mL'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    rerender(<RecipeReview buildText={() => 'Acide 3 mL'} />);
    resolve!({ ok: true, data: { verdict: 'Ancienne analyse', findings: [] } });
    await waitFor(() => expect(screen.queryByText('Ancienne analyse')).toBeNull());
    run.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    await screen.findByText(/Analyse interrompue/);
    expect(screen.getByRole('button', { name: 'Faire relire la recette' })).toBeEnabled();
  });
});
