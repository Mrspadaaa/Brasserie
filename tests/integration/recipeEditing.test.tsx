import React from 'react';
import { allerEtape } from '../helpers/wizard';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { NumberInput } from '../../src/ui/NumberInput';
import { RecipeReview } from '../../src/ui/RecipeReview';
import { defaultConfig } from '../../src/services/storage';
import { Recipe, StockItem } from '../../src/types';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { replanRecipeWater, recipeWaterSummary } from '../../src/domain/recipeWater';
import { prepareProposal, applyProposal } from '../../functions/src/brewerProposals';
import type { BrewerContext } from '../../functions/src/companionTypes';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { readYeastRecipeDesign, yeastRecipeDesignChanged } from '../../src/domain/yeastRecipeDesign';

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
const dossier = () => fireEvent.click(screen.getByText('Fiche, sources et données de la souche'));
const openYeastDetails = (label: string) => { const summary = screen.getByText(label, { selector: 'summary' }); expect(summary).toBeVisible();
  const details = summary.closest('details')!; if (!details.open) fireEvent.click(summary); expect(details).toHaveAttribute('open'); };
const changeYeast = (label: string, value: string) => { const input = screen.getByLabelText(label); expect(input).toBeVisible(); change(input, value); };

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
    fireEvent.click(screen.getByRole('button', { name: 'Changer / comparer' }));
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
    dossier();
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
    dossier();
    fireEvent.click(screen.getByText('Programme détaillé et guides enregistrés'));
    expect(screen.getByLabelText('Température du scénario 1 (°C)')).toHaveValue('18,5');
  });
  it('chooses a documented yeast outside the stock and returns to the actual recipe assessment', () => {
    const save = vi.fn(); wizard(base, save); step(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: 'Changer / comparer' }));
    const picker = screen.getByRole('combobox', { name: 'Souche de levure' });
    fireEvent.focus(picker); fireEvent.change(picker, { target: { value: 'Verdant' } });
    expect(screen.getByRole('option', { name: /LalBrew Verdant IPA/ })).toHaveTextContent('Stock non renseigné');
    fireEvent.keyDown(picker, { key: 'Enter' });
    expect(screen.getByLabelText('Quantité de levure')).toHaveValue('');
    expect(screen.getByLabelText('Unité de la quantité de levure')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'g' } });
    expect(screen.getByLabelText('Quantité de levure, en g')).toHaveValue('');
    change(screen.getByLabelText('Quantité de levure, en g'), '16');
    dossier();
    fireEvent.click(screen.getByText('Programme détaillé et guides enregistrés'));
    expect(screen.getByRole('region', { name: 'Résultat de ma fermentation' })).toHaveTextContent('Verdant');
    expect(screen.queryByRole('region', { name: 'Programme de levure proposé' })).not.toBeInTheDocument();
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save.mock.calls[0][0].yeast.hopIndexId).toBe('lalbrew-verdant-ipa');
    expect(save.mock.calls[0][0].yeast.qty).toBe(16);
    expect(save.mock.calls[0][0].yeastGuide).toBeUndefined();
  });
  it('applies the style-first yeast scenario across mash, fermentation, save and reopen', () => {
    const original: Recipe = { ...structuredClone(base), style: 'Hefeweizen',
      yeast: { name: 'Wyeast 3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', form: 'liquide', qty: 100, unit: 'mL', pitchTempC: 20 },
      fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }, { name: 'Garde', kind: 'garde', tempC: 4, days: 5 }],
    };
    const save = vi.fn(), view = wizard(original, save);
    step(/^Levure$/);
    fireEvent.change(screen.getByLabelText('Profil recherché'), { target: { value: 'clove' } });
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toBeVisible();
    expect(screen.getByLabelText('Température du palier 1')).toHaveValue('18');
    expect(screen.getByLabelText('Effets attendus de la stratégie')).toBeVisible(); expect(save).not.toHaveBeenCalled();
    openYeastDetails('Hypothèses et réglages complémentaires'); openYeastDetails('Ensemencement, durée et pression');
    changeYeast('Contre-pression du scénario en bar', '0');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(screen.queryByText(/La recette a changé pendant la comparaison/)).not.toBeInTheDocument();
    step(/^Paliers$/);
    expect(screen.getByLabelText('Nom du palier 1')).toHaveValue('Repos férulique · proposition L’Affinée');
    step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved = save.mock.calls[0][0];
    expect(saved.yeastDesign).toMatchObject({ goal: 'clove', pressureBar: 0, ferulicRest: true });
    expect(saved.fermentation).toEqual([{ ...original.fermentation[0], tempC: 18,
      note: expect.stringContaining('Suivre la densité et vérifier la fin de fermentation') }, original.fermentation[1]]);
    expect(saved.hops).toEqual(original.hops); expect(saved.waterPlan.mash).toEqual(original.waterPlan.mash);
    view.unmount(); wizard(saved); step(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('clove');
    expect(screen.getByLabelText('Température du palier 1')).toBeVisible(); expect(screen.getByLabelText('Température du palier 1')).toHaveValue('18');
  });
  it('propose automatiquement la finition d’une Lager puis conserve uniquement le programme explicitement appliqué', () => {
    const original: Recipe = { ...structuredClone(base), name: 'Lager de contrôle', style: 'Munich Helles',
      yeast: { name: 'SafLager W-34/70', hopIndexId: 'yeast-fermentis-saflager-w-34-70', form: 'sèche', qty: 20, unit: 'g',
        attenuationPct: 80, attenuationBasis: 'recipe', fermTempMinC: 12, fermTempMaxC: 18 },
      fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 12, days: 10 }] };
    const save = vi.fn(), view = wizard(original, save); step(/^Levure$/);
    fireEvent.change(screen.getByLabelText('Profil recherché'), { target: { value: 'low-sulfur' } });
    const programme = screen.getByRole('region', { name: 'Programme proposé' }); expect(programme).toBeVisible();
    const effects = screen.getByRole('region', { name: 'Effets attendus de la stratégie' });
    expect(effects).toBeVisible(); expect(effects).toHaveTextContent('Soufre'); expect(effects).toHaveTextContent('aucun résultat garanti');
    expect(within(programme).getByLabelText('Température du palier 1')).toHaveValue('12');
    expect(within(programme).getByLabelText('Température du palier 2')).toHaveValue('14');
    expect(within(programme).getByLabelText('Durée du palier 2')).toHaveValue('5');
    expect(within(programme).getByLabelText('Température du palier 3')).toHaveValue('2');
    expect(within(programme).getByLabelText('Température du palier 4')).toHaveValue('2');
    expect(programme).toHaveTextContent('test forcé du diacétyle négatif');
    expect(screen.getByText('Hypothèses et réglages complémentaires').closest('details')).not.toHaveAttribute('open');
    expect(save).not.toHaveBeenCalled();
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save.mock.lastCall![0].fermentation).toEqual(original.fermentation);
    expect(save.mock.lastCall![0].yeastDesign).toBeUndefined();
    step(/^Levure$/); fireEvent.change(screen.getByLabelText('Profil recherché'), { target: { value: 'low-sulfur' } });
    changeYeast('Durée du palier 2', '6');
    expect(screen.getByRole('region', { name: 'Programme proposé' })).toHaveTextContent('39 j indicatifs');
    const changes = screen.getByText(/Recette → proposition ·/, { selector: 'summary' });
    expect(changes).toBeVisible(); fireEvent.click(changes);
    expect(screen.getByLabelText('Changements proposés')).toHaveTextContent('14 °C');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(screen.getByText(/Conduite appliquée au brouillon/)).toBeVisible();
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved: Recipe = save.mock.lastCall![0];
    expect(saved.fermentation.map(({ kind, tempC, days }) => ({ kind, tempC, days }))).toEqual([
      { kind: 'primaire', tempC: 12, days: 10 }, { kind: 'reposDiacetyle', tempC: 14, days: 6 },
      { kind: 'garde', tempC: 2, days: 2 }, { kind: 'garde', tempC: 2, days: 21 }
    ]);
    expect(saved.fermentation[1].note).toContain('test forcé du diacétyle négatif');
    expect(saved.fermentation[2].note).toContain('seulement après densité stabilisée');
    expect(saved.yeastDesign).toMatchObject({ goal: 'low-sulfur', programme: saved.fermentation });
    expect(saved.yeastDesign?.applied.fermentation).toEqual(saved.fermentation);
    expect(saved.hops).toEqual(original.hops); expect(saved.fermentables).toEqual(original.fermentables);
    const restored = normalizeRecipe({ ...readRecipeText(writeRecipeText(saved))!, id: saved.id });
    expect(restored.fermentation).toEqual(saved.fermentation); expect(restored.yeastDesign).toEqual(saved.yeastDesign);
    const again = vi.fn(); view.unmount(); wizard(restored, again); step(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
    expect(screen.getByLabelText('Profil recherché')).toHaveValue('low-sulfur');
    expect(screen.getByLabelText('Durée du palier 2')).toBeVisible(); expect(screen.getByLabelText('Durée du palier 2')).toHaveValue('6');
    expect(screen.getByLabelText('Température du palier 4')).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeDisabled();
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(again.mock.lastCall![0].fermentation).toEqual(saved.fermentation);
    expect(again.mock.lastCall![0].yeastDesign).toEqual(saved.yeastDesign);
  });
  it('retient la conduite d’une souche rare sans catalogue ni forme connue jusque dans la recette relue', () => {
    const original: Recipe = { ...structuredClone(base), name: 'Sour R-125', style: 'Sour', yeast: {
      name: 'Culture rare R-125', lab: 'Micro labo', strain: 'R-125', qty: 125, unit: 'mL',
      attenuationPct: 78, attenuationBasis: 'recipe', fermTempMinC: 18, fermTempMaxC: 24,
      flocculation: 'Moyenne', alcoholTolerancePct: 12.5, technicalSource: 'Notice lot 231', notes: 'Essai conservé',
      technicalFacts: [{ key: 'attenuation', reported: '77,25–82,75 % selon le moût', range: { min: 77.25, max: 82.75 },
        unit: '%', qualifier: 'range', origin: 'manufacturer', source: 'Notice lot 231', sourceUrl: 'https://example.com/r-125' }]
    } };
    const save = vi.fn(), view = wizard(original, save);
    step(/^Levure$/);
    const current = screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' });
    expect(current).toHaveTextContent('78 %'); expect(current).toHaveTextContent('hypothèse de recette');
    expect(current).toHaveTextContent('Procédé acidulé non précisé');
    expect(screen.getByLabelText('Forme de la levure')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
    openYeastDetails('Hypothèses et réglages complémentaires');
    changeYeast('Atténuation retenue pour le scénario', '80');
    changeYeast('Température du palier 1', '21');
    fireEvent.change(screen.getByLabelText('Procédé de fermentation'), { target: { value: 'preacidified' } });
    openYeastDetails('Ensemencement, durée et pression');
    changeYeast('Température d’ensemencement du scénario', '20');
    changeYeast('Durée principale du scénario en jours', '14');
    changeYeast('Contre-pression du scénario en bar', '0,5');
    changeYeast('Taux de cellules visé par mL et degré Plato', '0,75');
    changeYeast('Cellules viables disponibles en milliards', '200');
    expect(current).toHaveTextContent('78 %'); expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('80 %');
    step(/^Paliers$/); step(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved: Recipe = save.mock.calls[0][0];
    expect(saved.yeast).toMatchObject({ ...original.yeast, attenuationPct: 80, attenuationBasis: 'recipe', pitchTempC: 20 });
    expect(saved.yeast.form).toBeUndefined(); expect(saved.yeast.hopIndexId).toBeUndefined();
    expect(saved.fermentation).toEqual([{ ...original.fermentation[0], tempC: 21, days: 14 }]);
    expect(saved.yeastDesign).toMatchObject({ modelVersion: 'yeast-recipe-2', yeastId: '', process: 'preacidified', pressureBar: 0.5,
      pitchRateMillionPerMlPlato: 0.75, viableCellsBillion: 200 });
    expect(saved.ogTarget).toBe(original.ogTarget);
    expect(saved.fgTarget).toBeCloseTo(1.01, 10); expect(saved.abvTarget).toBeCloseTo(5.25, 10);
    expect(yeastRecipeDesignChanged(saved, readYeastRecipeDesign(saved)!)).toBe(false);
    const restored = normalizeRecipe({ ...readRecipeText(writeRecipeText(saved))!, id: saved.id });
    expect(restored.yeast).toEqual(JSON.parse(JSON.stringify(saved.yeast)));
    expect(restored.yeastDesign).toEqual(JSON.parse(JSON.stringify(saved.yeastDesign)));
    view.unmount(); wizard(restored); step(/^Levure$/);
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('80 %');
    expect(screen.getByLabelText('Quantité de levure, en mL')).toHaveValue('125');
    fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
    openYeastDetails('Hypothèses et réglages complémentaires'); openYeastDetails('Ensemencement, durée et pression');
    expect(screen.getByLabelText('Taux de cellules visé par mL et degré Plato')).toHaveValue('0,75');
    expect(screen.getByLabelText('Cellules viables disponibles en milliards')).toHaveValue('200');
    expect(screen.getByLabelText('Contre-pression du scénario en bar')).toHaveValue('0,5');
    expect(screen.getByLabelText('Procédé de fermentation')).toHaveValue('preacidified');
  });
  it('reconnaît une Sour par son référentiel malgré un nom libre et conserve la DI retenue quand le procédé change', () => {
    const original: Recipe = { ...structuredClone(base), name: 'Lot expérimental 231', style: 'Essai maison',
      styleRef: { guideId: 'styles-bjcp-2021', version: '2026-09-09.1', styleId: 'berliner-weisse' },
      yeast: { name: 'Culture alcoolique personnelle', form: 'liquide', qty: 125, unit: 'mL', attenuationPct: 78,
        attenuationBasis: 'recipe', fermTempMinC: 18, fermTempMaxC: 24 } };
    const save = vi.fn(), view = wizard(original, save); step(/^Levure$/);
    const current = screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' });
    expect(current).toHaveTextContent('1,011'); expect(current).toHaveTextContent('Procédé acidulé non précisé');
    expect(current).toHaveTextContent('À préciser');
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    // Opening a saved recipe alone preserves its author's target, while the projection stays unknown.
    expect(save.mock.lastCall![0].ogTarget).toBe(1.05); expect(save.mock.lastCall![0].abvTarget).toBe(original.abvTarget);
    step(/^Levure$/); fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
    fireEvent.change(screen.getByLabelText('Procédé de fermentation'), { target: { value: 'preacidified' } });
    expect(screen.getByRole('figure', { name: 'Alcool estimé' })).toHaveTextContent('5,1 % vol');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved: Recipe = save.mock.lastCall![0];
    expect(saved.styleRef).toEqual(original.styleRef); expect(saved.ogTarget).toBe(1.05);
    expect(saved.fgTarget).toBeCloseTo(1.011, 10); expect(saved.abvTarget).toBeCloseTo(5.11875, 10);
    const again = vi.fn(); view.unmount(); wizard(saved, again); step(/^Levure$/);
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('5,1');
    fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
    fireEvent.change(screen.getByLabelText('Procédé de fermentation'), { target: { value: 'acidifying-yeast' } });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(again).toHaveBeenCalledTimes(1);
    expect(again.mock.lastCall![0]).toMatchObject({ ogTarget: 1.05, abvTarget: null });
    expect(again.mock.lastCall![0].fgTarget).toBeCloseTo(1.011, 10);
    expect(again.mock.lastCall![0].yeastDesign.process).toBe('acidifying-yeast');
  });
  it('empêche l’enregistrement après une conversion impossible et laisse corriger la quantité', () => {
    const original: Recipe = { ...structuredClone(base), yeast: { name: 'Culture liquide rare', form: 'liquide', qty: 125,
      unit: 'mL', attenuationPct: 78, fermTempMinC: 18, fermTempMaxC: 24 } };
    const save = vi.fn(); wizard(original, save); step(/^Levure$/);
    fireEvent.click(screen.getByText('Ensemencement', { exact: false, selector: '.yc-pitch summary > span' }).closest('summary')!);
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'flacon' } });
    expect(screen.getByLabelText('Quantité de levure, en flacon')).toHaveValue('');
    expect(screen.getByText(/aucune conversion depuis mL/)).toBeVisible();
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Quantité de levure');
    change(screen.getByLabelText('Quantité de levure, en flacon'), '2');
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1); expect(save.mock.calls[0][0].yeast).toMatchObject({ qty: 2, unit: 'flacon', form: 'liquide' });
  });
  it('ne transforme pas une dose négative en zéro et ramène le brasseur au champ à corriger', () => {
    const original: Recipe = { ...structuredClone(base), yeast: { name: 'Culture liquide rare', form: 'liquide', qty: 125, unit: 'mL', attenuationPct: 78 } };
    const save = vi.fn(); wizard(original, save); step(/^Levure$/);
    fireEvent.click(screen.getByText('Ensemencement', { exact: false, selector: '.yc-pitch summary > span' }).closest('summary')!);
    change(screen.getByLabelText('Quantité de levure, en mL'), '-1');
    expect(screen.getByLabelText('Quantité de levure, en mL')).toHaveValue('-1');
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Quantité de levure, en mL')).toBeVisible();
    expect(screen.getByLabelText('Quantité de levure, en mL')).toHaveValue('-1');
    change(screen.getByLabelText('Quantité de levure, en mL'), '125');
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1); expect(save.mock.calls[0][0].yeast.qty).toBe(125);
  });
  it('corrige une plage documentaire inversée et sauvegarde ses bornes exactes sans fabriquer de valeur centrale', () => {
    const original: Recipe = { ...structuredClone(base), style: 'American Pale Ale',
      yeast: { name: 'Culture personnelle documentée', form: 'liquide', qty: 125, unit: 'mL' } };
    const save = vi.fn(), view = wizard(original, save); step(/^Levure$/); dossier();
    fireEvent.click(screen.getByText('Saisir une plage ou une borne d’atténuation'));
    change(screen.getByLabelText('Atténuation documentaire minimale'), '82,75');
    change(screen.getByLabelText('Atténuation documentaire maximale'), '77,25');
    change(screen.getByLabelText('Source de la plage d’atténuation'), 'https://example.test/lot-231');
    fireEvent.click(screen.getByRole('button', { name: 'Conserver ce repère' }));
    expect(screen.getByRole('alert')).toHaveTextContent('maximum supérieur ou égal au minimum');
    change(screen.getByLabelText('Atténuation documentaire minimale'), '77,25');
    change(screen.getByLabelText('Atténuation documentaire maximale'), '82,75');
    fireEvent.click(screen.getByRole('button', { name: 'Conserver ce repère' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Levure choisie dans la recette' })).toHaveTextContent('77,25–82,75 %');
    expect(screen.getByRole('region', { name: 'Aperçu de la fermentation de cette recette' })).toHaveTextContent('1,009–1,011');
    expect(screen.getByLabelText('Atténuation de la levure, en pourcent')).toHaveValue('');
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved: Recipe = save.mock.lastCall![0];
    expect(saved.yeast.attenuationPct).toBeUndefined();
    expect(saved.yeast.technicalFacts).toEqual([{ key: 'attenuation', reported: 'Atténuation 77.25–82.75 %',
      range: { min: 77.25, max: 82.75 }, qualifier: 'range', unit: '%', origin: 'personal',
      source: 'https://example.test/lot-231', sourceUrl: 'https://example.test/lot-231' }]);
    expect(saved.fgTarget).toBeNull(); expect(saved.abvTarget).toBeNull();
    view.unmount(); wizard(saved); step(/^Levure$/); dossier();
    fireEvent.click(screen.getByText('Saisir une plage ou une borne d’atténuation'));
    expect(screen.getByLabelText('Atténuation documentaire minimale')).toHaveValue('77,25');
    expect(screen.getByLabelText('Atténuation documentaire maximale')).toHaveValue('82,75');
    expect(screen.getByLabelText('Source de la plage d’atténuation')).toHaveValue('https://example.test/lot-231');
  });
  it('conserve les contacts de houblon explicitement alignés après sauvegarde et réouverture de la NEIPA', () => {
    const original: Recipe = { ...structuredClone(base), yeast: { ...base.yeast, hopIndexId: 'fermentis-us05', qty: 16, unit: 'g' },
      hops: [{ name: 'Citra', weightG: 100, alpha: 12, stage: 'dryHop', aromaTiming: 'fermentation', aromaTemperatureC: 19, aromaContactHours: 48 },
        { name: 'Mosaic', weightG: 80, alpha: 11, stage: 'dryHop', aromaTiming: 'postFermentation', aromaTemperatureC: 14, aromaContactHours: 24 }] };
    const save = vi.fn(), view = wizard(original, save); step(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
    expect(screen.queryAllByRole('alert').map(alert => alert.textContent)).toEqual([]);
    changeYeast('Température du palier 1', '23');
    const align = screen.getByRole('checkbox', { name: /Aligner les ajouts en fermentation active/ });
    expect(align).not.toBeChecked();
    fireEvent.click(screen.getByText('Contacts, calcul et sources'));
    const previewContacts = screen.getByRole('table', { name: 'Contacts de houblon prévus' });
    expect(within(previewContacts).getByRole('row', { name: /Citra/ })).toHaveTextContent('19 °C');
    fireEvent.click(align);
    expect(align).toBeChecked();
    expect(within(previewContacts).getByRole('row', { name: /Citra/ })).toHaveTextContent('23 °C');
    expect(within(previewContacts).getByRole('row', { name: /Mosaic/ })).toHaveTextContent('14 °C');
    expect(save).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('alert').map(alert => alert.textContent)).toEqual([]);
    expect(screen.getByRole('button', { name: 'Appliquer les changements' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les changements' }));
    expect(screen.getByText(/Conduite appliquée au brouillon/)).toBeVisible();
    step(/^Récapitulatif$/); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    const saved: Recipe = save.mock.calls[0][0];
    expect(saved.hops).toEqual([{ ...original.hops[0], aromaTemperatureC: 23, tempC: 23 }, original.hops[1]]);
    expect(saved.yeastDesign?.applied.hops).toEqual(saved.hops);
    expect(yeastRecipeDesignChanged(saved, readYeastRecipeDesign(saved)!)).toBe(false);
    view.unmount(); wizard(JSON.parse(JSON.stringify(saved))); step(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: 'Régler / simuler' }));
    fireEvent.click(screen.getByText('Contacts, calcul et sources'));
    const contacts = screen.getByRole('table', { name: 'Contacts de houblon prévus' });
    expect(within(contacts).getByRole('row', { name: /Citra/ })).toHaveTextContent('23 °C');
    expect(within(contacts).getByRole('row', { name: /Mosaic/ })).toHaveTextContent('14 °C');
    expect(screen.queryByRole('checkbox', { name: /Aligner les ajouts en fermentation active/ })).not.toBeInTheDocument();
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
