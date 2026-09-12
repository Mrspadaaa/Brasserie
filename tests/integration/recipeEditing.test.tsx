import React from 'react';
import { allerEtape } from '../helpers/wizard';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { NumberInput } from '../../src/ui/NumberInput';
import { RecipeReview } from '../../src/ui/RecipeReview';
import { defaultConfig } from '../../src/services/storage';
import { Recipe, StockItem } from '../../src/types';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { replanRecipeWater, recipeWaterSummary } from '../../src/domain/recipeWater';
import { prepareProposal, applyProposal } from '../../functions/src/brewerProposals';
import type { BrewerContext } from '../../functions/src/companionTypes';

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
/* Les étapes se rejoignent par la liste de l’assistant : voir tests/helpers/wizard.ts. */
const step = (name: RegExp) => allerEtape(name);
const change = (el: HTMLElement, value: string) => {
  fireEvent.change(el, { target: { value } });
  fireEvent.blur(el);
};
const radar = () => screen.getByRole('img', { name: /Profil ionique/ }).getAttribute('aria-label');

describe('Recipe data entry regressions', () => {
  it('treats the callable null representation as a linked sparge percentage', () => {
    const original = structuredClone(base);
    original.waterPlan!.spargeDiRatioPct = null as any;
    wizard(original);
    step(/^Eau/);
    expect(screen.getByText(/Rinçage identique/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Litres d’osmosée (Osmosée — rinçage)')).toBeNull();
  });
  it('keeps the companion water proposal identical after import, manual changes, save and reopen', () => {
    const original = structuredClone(base);
    original.waterPlan = { ...original.waterPlan!, diRatioPct: 80, spargeDiRatioPct: 100,
      targetProfileId: '21C', acidOverride: undefined };
    original.waterPlan = replanRecipeWater(original).plan;
    const c: BrewerContext = { recipe: original, inventory: [], material: [], waterSources: [DEFAULT_WATER_SOURCE],
      editableTargets: ['recipe'], provenance: [], now: Date.now(), phase: 'Recette' };
    const proposal = prepareProposal(c, { target: 'recipe', title: 'Seulement 10 L', changes: [
      { path: 'waterPlan.roLimitL', valueJson: '10', reason: 'Stock disponible.' }
    ] });
    const applied = applyProposal(c, proposal, proposal.changes.map(ch => ch.id));
    const save = vi.fn();
    const view = wizard(applied, save);
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer la recette$/ }));
    expect(save.mock.calls[0][0].waterPlan.mash).toEqual(applied.waterPlan.mash);
    expect(save.mock.calls[0][0].waterPlan.acid).toEqual(applied.waterPlan.acid);
    expect(save.mock.calls[0][0].waterPlan.wortIons).toEqual(applied.waterPlan.wortIons);
    step(/^Eau/);
    fireEvent.click(screen.getByText(/Osmosée : 10 L disponibles/));
    change(screen.getByLabelText('Osmosée disponible au total (L)'), '5');
    expect(screen.getByLabelText('Sels et acides suivent la recette')).toBeChecked();
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer la recette$/ }));
    const saved = save.mock.calls[1][0];
    expect(recipeWaterSummary(saved)!.totalRoL).toBe(5);
    expect(saved.waterPlan.mash).not.toEqual(applied.waterPlan.mash);
    expect(saved.waterPlan.acid).not.toEqual(applied.waterPlan.acid);
    expect(saved.waterPlan.roLimitL).toBe(5);
    view.unmount();
    const again = vi.fn();
    wizard(saved, again);
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer la recette$/ }));
    expect(again.mock.calls[0][0].waterPlan).toEqual(saved.waterPlan);
  });
  it('recalculates around a manually retained salt dose when the water changes', () => {
    const original = structuredClone(base);
    original.waterPlan = { ...original.waterPlan!, autoTreatment: true, diRatioPct: 80, targetProfileId: '21C', acidOverride: undefined };
    const save = vi.fn();
    wizard(original, save);
    step(/^Eau/);
    change(screen.getByLabelText(/Dose de Gypse en grammes/), '1.2');
    fireEvent.click(screen.getByText('Disponibilité & recalcul automatique'));
    change(screen.getByLabelText('Osmosée disponible au total (L)'), '5');
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer la recette$/ }));
    expect(save.mock.calls[0][0].waterPlan.mash.gypse).toBe(1.2);
    expect(save.mock.calls[0][0].waterPlan.saltOverrides.mash.gypse).toBe(1.2);
    expect(recipeWaterSummary(save.mock.calls[0][0])!.totalRoL).toBe(5);
  });
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
    wizard({ ...base, yeast: { ...base.yeast, hopIndexId: 'fermentis-us05', pitchTempC: 30, fermentDays: 3,
      fermentation: { version: 1, strainName: 'Ancienne souche', sugars: {}, pof: 'negative', hydrolysis: 'unknown' } as any } });
    step(/^Levure$/);
    fireEvent.click(screen.getByText(/Saisie libre et stock ·/));
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
    expect(yeast.hopIndexId).toBeUndefined();
    expect(yeast.pitchTempC).toBeUndefined();
    expect(yeast.fermentDays).toBeUndefined();
    expect(yeast.fermentation).toBeUndefined();
  });
  it('keeps an incomplete fermentation phase while editing and preserves the other recipe data', () => {
    const original = structuredClone(base);
    original.fermentation.push({ kind: 'garde', name: 'Garde', tempC: 4, days: 7 });
    const save = vi.fn(); const view = wizard(original, save);
    step(/^Levure$/);
    fireEvent.click(screen.getByText('Programme détaillé et guides enregistrés'));
    expect(screen.queryByRole('button', { name: 'Trouver une conduite' })).not.toBeInTheDocument();
    const temperature = screen.getByLabelText('Température du scénario 1 (°C)');
    change(temperature, '');
    expect(temperature).toBeInTheDocument();
    expect(temperature).toHaveValue('');
    expect(screen.getByLabelText('Température du scénario 2 (°C)')).toHaveValue('4');
    change(temperature, '18,5');
    const duration = screen.getByLabelText('Durée du scénario 1 (j)');
    change(duration, ''); change(duration, '12');
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved = save.mock.calls[0][0];
    expect(saved.fermentation).toEqual([{ ...original.fermentation[0], tempC: 18.5, days: 12 }, original.fermentation[1]]);
    expect(saved.hops).toEqual(original.hops);
    expect(saved.fermentables).toEqual(original.fermentables);
    expect(saved.waterPlan.mash).toEqual(original.waterPlan.mash);
    view.unmount(); wizard(saved);
    step(/^Levure$/);
    fireEvent.click(screen.getByText('Programme détaillé et guides enregistrés'));
    expect(screen.getByLabelText('Température du scénario 1 (°C)')).toHaveValue('18,5');
  });
  it('chooses a documented yeast outside the stock and returns to the actual recipe assessment', () => {
    const save = vi.fn(); wizard(base, save); step(/^Levure$/);
    fireEvent.click(screen.getByText(/Saisie libre et stock ·/));
    const picker = screen.getByRole('combobox', { name: 'Souche de levure' });
    fireEvent.focus(picker); fireEvent.change(picker, { target: { value: 'Verdant' } });
    expect(screen.getByRole('option', { name: /LalBrew Verdant IPA/ })).toHaveTextContent('Stock non renseigné');
    fireEvent.keyDown(picker, { key: 'Enter' });
    fireEvent.click(screen.getByText('Programme détaillé et guides enregistrés'));
    expect(screen.getByRole('region', { name: 'Résultat de ma fermentation' })).toHaveTextContent('Verdant');
    expect(screen.queryByRole('region', { name: 'Programme de levure proposé' })).not.toBeInTheDocument();
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save.mock.calls[0][0].yeast.hopIndexId).toBe('lalbrew-verdant-ipa');
    expect(save.mock.calls[0][0].yeast.qty).toBe(0);
    expect(save.mock.calls[0][0].yeastGuide).toBeUndefined();
  });
  it('applies the style-first yeast scenario across mash, fermentation, save and reopen', () => {
    const original: Recipe = { ...structuredClone(base), style: 'Hefeweizen',
      yeast: { name: 'Wyeast 3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', form: 'liquide', qty: 100, unit: 'mL', pitchTempC: 20 },
      fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 5 }],
    };
    const save = vi.fn(), view = wizard(original, save);
    step(/^Levure$/);
    fireEvent.click(screen.getByRole('radio', { name: 'Girofle · épices' }));
    fireEvent.click(screen.getByRole('button', { name: 'Préparer un essai girofle' }));
    change(screen.getByLabelText('Contre-pression du scénario en bar'), '0');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer le scénario' }));
    expect(screen.queryByText(/La recette a changé pendant la comparaison/)).not.toBeInTheDocument();
    step(/^Paliers$/);
    expect(screen.getByLabelText('Nom du palier 1')).toHaveValue('Repos férulique · proposition L’Affinée');
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved = save.mock.calls[0][0];
    expect(saved.yeastDesign).toMatchObject({ goal: 'clove', pressureBar: 0, ferulicRest: true });
    expect(saved.fermentation).toEqual([{ ...original.fermentation[0], tempC: 18 }, original.fermentation[1]]);
    expect(saved.hops).toEqual(original.hops); expect(saved.waterPlan.mash).toEqual(original.waterPlan.mash);
    view.unmount(); wizard(saved); step(/^Levure$/);
    expect(screen.getByRole('radio', { name: 'Girofle · épices' })).toBeChecked();
    expect(screen.getByLabelText('Température principale du scénario')).toHaveValue('18');
  });
  it('preserves aroma associations, target and historical predictions through recipe editing', () => {
    const original = { ...structuredClone(base), hopMatrixId: 'pale-ale',
      hopAromaTarget: { citrus: { min: 33, max: 66 } }, hopPredictionIds: ['before-brewing'] };
    original.hops[0] = { ...original.hops[0], hopVarietyId: 'citra', hopLotId: 'lot-2026' };
    original.yeast.hopIndexId = 'fermentis-us05';
    const save = vi.fn();
    wizard(original, save);
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer la recette$/ }));
    expect(save.mock.calls[0][0]).toMatchObject({ hopMatrixId: original.hopMatrixId,
      hopAromaTarget: original.hopAromaTarget, hopPredictionIds: original.hopPredictionIds,
      hops: [original.hops[0]], yeast: original.yeast });
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
  it('retains a sparge-only acid change in the graph, recap and reopened recipe', () => {
    const original = structuredClone(base);
    original.waterPlan!.acid = { id: 'lactique', mash: 0, sparge: 0 };
    original.waterPlan!.acidOverride = { mash: 0, sparge: 0 };
    const save = vi.fn();
    const view = wizard(original, save);
    step(/^Eau/);
    expect(radar()).toMatch(/Alcalinité .*207,1 ppm/);
    change(screen.getByLabelText(/Dose d’acide lactique .*au rinçage/), '1');
    // 25 L at 250 ppm + 10 L at (100 − 600 / 10) ppm = 190 ppm overall.
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('40');
    expect(radar()).toMatch(/Alcalinité .*190 ppm/);
    const changed = radar();
    step(/^Récapitulatif$/);
    expect(radar()).toBe(changed);
    fireEvent.click(screen.getByRole('button', { name: /^Enregistrer la recette$/ }));
    const saved = save.mock.calls[0][0];
    expect(saved.waterPlan.acid).toEqual({ id: 'lactique', mash: 0, sparge: 1 });
    expect(saved.waterPlan.wortIons.hco3).toBe(190);
    view.unmount();
    wizard(saved);
    step(/^Eau/);
    expect(radar()).toBe(changed);
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('40');
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
