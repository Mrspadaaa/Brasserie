import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecipeAutoComplete } from '../../src/ui/RecipeAutoComplete';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { StorageService, defaultConfig } from '../../src/services/storage';
import type { Fermentable, Recipe, StockItem, YeastSpec } from '../../src/types';
import { allerEtape } from '../helpers/wizard';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { factsFromStock, applyYeastFacts } from '../../src/domain/ingredientFacts';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';

const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...args: unknown[]) => run(...args) } }));
afterEach(() => { cleanup(); run.mockReset(); vi.restoreAllMocks(); });

const malt: Fermentable = { name: 'Malt témoin sans fiche', kind: 'grain', use: 'empatage', weightKg: 5 };
const yeast: YeastSpec = { name: 'Levure témoin sans fiche', form: 'sèche', qty: 12, unit: 'g' };
const facts = (values = {}) => ({ ok: true, data: { found: true, name: malt.name, source: 'Fiche fabricant de contrôle', colorEbc: 6, potentialPpg: 38, ...values } });
const search = () => fireEvent.click(screen.getByRole('button', { name: /Compléter les données manquantes/ }));

function mountCompletion() {
  const learn = vi.fn();
  let current: Fermentable[] = [];
  function Host({ stockItems }: { stockItems: StockItem[] }) {
    const [fermentables, setFermentables] = useState([malt]);
    current = fermentables;
    return <RecipeAutoComplete fermentables={fermentables} onFermentables={setFermentables}
      hops={[]} onHops={() => {}} yeast={{ ...yeast, name: '' }} onYeast={() => {}}
      stockItems={stockItems} onLearnIngredient={learn} />;
  }
  const view = render(<Host stockItems={[]} />);
  return { learn, current: () => current, refreshStock: () => view.rerender(<Host stockItems={[]} />) };
}

describe('Autocomplétion pendant la synchronisation du catalogue', () => {
  it('termine la recherche malgré les notifications sans changement de recette', async () => {
    let resolve!: (value: unknown) => void;
    run.mockReturnValue(new Promise(r => { resolve = r; }));
    const view = mountCompletion();
    search();
    act(() => StorageService.notify());
    view.refreshStock();
    expect(screen.getByRole('button', { name: 'Annuler la recherche' })).toBeInTheDocument();
    await act(async () => resolve(facts()));
    expect(await screen.findByRole('button', { name: 'Reprendre ces valeurs' })).toBeInTheDocument();
    expect(view.current()[0].colorEbc).toBeUndefined();
    expect(view.learn).not.toHaveBeenCalled();
  });

  it('garde la proposition consultable et applicable après une actualisation du stock', async () => {
    run.mockResolvedValue(facts());
    const view = mountCompletion();
    search();
    await screen.findByText('Fiche fabricant de contrôle');
    act(() => StorageService.notify());
    view.refreshStock();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(view.current()[0]).toMatchObject({ weightKg: 5, colorEbc: 6, potentialPpg: 38 });
    expect(view.learn).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('ne réutilise pas une réponse arrivée après annulation dans une nouvelle recherche', async () => {
    let resolve!: (value: unknown) => void;
    run.mockReturnValueOnce(new Promise(r => { resolve = r; })).mockResolvedValue(facts({ colorEbc: 9 }));
    const view = mountCompletion();
    search();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la recherche' }));
    await act(async () => resolve(facts({ colorEbc: 3 })));
    search();
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(run).toHaveBeenCalledTimes(2);
    expect(view.current()[0].colorEbc).toBe(9);
  });

  it('refuse des valeurs IA sans source et permet de relancer la recherche', async () => {
    run.mockResolvedValueOnce(facts({ source: ' ' })).mockResolvedValue(facts());
    const view = mountCompletion();
    search();
    await waitFor(() => expect(screen.getByRole('button', { name: /Compléter les données/ })).toBeEnabled());
    expect(screen.queryByRole('button', { name: 'Reprendre ces valeurs' })).not.toBeInTheDocument();
    expect(view.current()[0].colorEbc).toBeUndefined();
    search();
    expect(await screen.findByRole('button', { name: 'Reprendre ces valeurs' })).toBeInTheDocument();
  });
});

describe('Révision de fiche des levures rares', () => {
  const rare: YeastSpec = { name: 'Culture rare R-125', qty: 125, unit: 'mL', lab: 'Micro labo',
    attenuationPct: 78, attenuationBasis: 'recipe', fermTempMinC: 18, fermTempMaxC: 24 };
  const technicalFacts: YeastTechnicalFact[] = [{ key: 'attenuation', reported: '77,25–82,75 %', range: { min: 77.25, max: 82.75 },
    unit: '%', qualifier: 'range', origin: 'ai', source: 'Fiche R-125', sourceUrl: 'https://example.com/r-125', retrievedAt: '2026-09-20' }];
  const response = (values = {}) => facts({ name: rare.name, form: 'liquide', flocculation: 'Moyenne',
    alcoholTolerancePct: 12.5, source: 'Fiche R-125', technicalFacts, ...values });
  function mountYeast(initial = rare) {
    let current: YeastSpec = initial;
    const learn = vi.fn();
    function Host() {
      const [y, setY] = useState(initial);
      current = y;
      return <><RecipeAutoComplete scope="levure" yeastEnrichment embedded fermentables={[]} onFermentables={() => {}}
        hops={[]} onHops={() => {}} yeast={y} onYeast={setY} onLearnIngredient={learn} />
        <button onClick={() => setY({ ...y, name: 'Autre culture rare' })}>Changer de culture test</button>
        <button onClick={() => setY({ ...y, attenuationPct: 75 })}>Modifier l’hypothèse test</button></>;
    }
    render(<Host />);
    return { current: () => current, learn };
  }
  const enrich = () => fireEvent.click(screen.getByRole('button', { name: 'Rechercher la fiche de cette levure' }));

  it('reste accessible même avec les entrées du calcul remplies et conserve les plages après validation', async () => {
    run.mockResolvedValue(response());
    const view = mountYeast();
    enrich();
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(view.current()).toMatchObject({ ...rare, form: 'liquide', flocculation: 'Moyenne', alcoholTolerancePct: 12.5 });
    expect(view.current().technicalFacts).toEqual(expect.arrayContaining(technicalFacts));
    expect(normalizeRecipe({ yeast: JSON.parse(JSON.stringify(view.current())) } as Recipe).yeast).toEqual(view.current());
    expect(view.learn).toHaveBeenCalledWith(rare.name, expect.objectContaining({ yeastForm: 'liquide', yeastTechnicalFacts: expect.arrayContaining(technicalFacts) }));
  });
  it('demande un choix pour les conflits, conserve la valeur manuelle par défaut et corrige la forme choisie', async () => {
    run.mockResolvedValue(response({ attenuationPct: 81, technicalFacts: [] }));
    const view = mountYeast({ ...rare, form: 'sèche' });
    enrich();
    const apply = await screen.findByRole('button', { name: 'Reprendre ces valeurs' });
    expect(apply).toBeDisabled();
    expect(view.current()).toMatchObject({ form: 'sèche', attenuationPct: 78 });
    fireEvent.change(screen.getByRole('combobox', { name: 'Choisir Forme' }), { target: { value: 'replace' } });
    expect(apply).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Choisir Atténuation (%)' }), { target: { value: 'keep' } });
    fireEvent.click(apply);
    expect(view.current()).toMatchObject({ form: 'liquide', attenuationPct: 78, attenuationBasis: 'recipe', qty: 125, unit: 'mL' });
  });
  it('rejette la réponse d’une souche précédente sans apprendre de données au stock', async () => {
    let resolve!: (value: unknown) => void;
    run.mockReturnValue(new Promise(r => { resolve = r; }));
    const view = mountYeast();
    enrich();
    fireEvent.click(screen.getByRole('button', { name: 'Changer de culture test' }));
    await act(async () => resolve(response()));
    expect(screen.queryByRole('button', { name: 'Reprendre ces valeurs' })).not.toBeInTheDocument();
    expect(view.current().technicalFacts).toBeUndefined();
    expect(view.learn).not.toHaveBeenCalled();
  });
  it('invalide aussi une proposition quand une hypothèse est modifiée avant validation', async () => {
    run.mockResolvedValue(response());
    const view = mountYeast();
    enrich();
    await screen.findByRole('button', { name: 'Reprendre ces valeurs' });
    fireEvent.click(screen.getByRole('button', { name: 'Modifier l’hypothèse test' }));
    expect(screen.queryByRole('button', { name: 'Reprendre ces valeurs' })).not.toBeInTheDocument();
    expect(view.current().attenuationPct).toBe(75);
    expect(view.learn).not.toHaveBeenCalled();
  });
  it('accepte une fiche partielle sans inventer les autres données', async () => {
    run.mockResolvedValue(response({ technicalFacts: [], flocculation: undefined, alcoholTolerancePct: undefined }));
    const view = mountYeast({ name: rare.name });
    enrich();
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(view.current()).toMatchObject({ name: rare.name, form: 'liquide' });
    expect(view.current().qty).toBeUndefined();
    expect(view.current().attenuationPct).toBeUndefined();
    expect(view.current().alcoholTolerancePct).toBeUndefined();
  });
  it('sauvegarde et réutilise les faits riches acceptés sans changer le conditionnement du stock', () => {
    let rows: StockItem[] = [{ id: 'rare', ref: 'rare', name: rare.name, category: 'Levure', unit: 'mL',
      currentStock: 500, minStock: 0, reorder: false }];
    vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: rows, cleaning: [], equipment: [], kegs: [] }));
    const put = vi.spyOn(FirestoreRepo, 'put').mockImplementation((collection, id, patch) => {
      if (collection === 'stockItems') rows = rows.map(row => row.ref === id ? JSON.parse(JSON.stringify({ ...row, ...patch })) : row);
      return undefined;
    });
    const fermentation = { version: 1 as const, strainName: rare.name, source: { title: 'Fiche R-125', author: 'Micro labo',
      reference: 'https://example.com/r-125', year: null, kind: 'manufacturer' as const, locator: 'Fiche technique' }, retrievedAt: '2026-09-20',
      conditions: 'Moût de contrôle', sugars: { glucose: 'yes' as const }, pof: 'unknown' as const, hydrolysis: 'unknown' as const };
    StorageService.learnIngredient(rare.name, { category: 'Levure', yeastTechnicalFacts: technicalFacts,
      yeastFermentationFacts: fermentation, yeastForm: 'liquide', yeastFlocculation: 'Moyenne', yeastAlcoholTolerancePct: 12.5, technicalSource: 'Fiche R-125' });
    expect(put).toHaveBeenCalledTimes(1);
    expect(rows[0]).toMatchObject({ currentStock: 500, unit: 'mL', yeastFermentationFacts: fermentation, yeastTechnicalFacts: technicalFacts });
    const reused = applyYeastFacts({ name: rare.name, qty: 125, unit: 'mL' }, factsFromStock(rows[0]));
    expect(reused).toMatchObject({ form: 'liquide', fermentationFacts: fermentation, technicalFacts: expect.arrayContaining(technicalFacts) });
    StorageService.learnIngredient(rare.name, { category: 'Levure', yeastTechnicalFacts: technicalFacts, yeastFermentationFacts: fermentation });
    expect(put).toHaveBeenCalledTimes(1);
  });
});

describe('IA dans les étapes d’une recette enregistrée', () => {
  it('complète la levure seule puis tous les ingrédients au récapitulatif, et enregistre les valeurs acceptées', async () => {
    const recipe: Recipe = { id: 'recipe-ai-workflow', name: 'Recette à compléter', style: 'Pale Ale', volumeL: 20,
      boilMin: 60, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5, totalGristKg: 5,
      fermentables: [malt], hops: [
        { name: 'Houblon témoin sans fiche', alpha: 0, weightG: 30, stage: 'boil', timeMin: 15 },
        { name: 'Lot déjà mesuré', alpha: 7.2, weightG: 10, stage: 'boil', timeMin: 5 }
      ], yeast,
      mash: { steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }], spargeType: 'batch' },
      fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] };
    run.mockImplementation(({ context }) => Promise.resolve(facts(context.kind === 'levure'
      ? { name: yeast.name, lab: 'Laboratoire témoin', attenuationPct: 77, tempMinC: 17, tempMaxC: 24 }
      : context.kind === 'houblon' ? { name: context.name, alphaPct: 12 } : { name: malt.name })));
    const save = vi.fn(), learn = vi.fn();
    render(<BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={() => {}}
      onSave={save} onLearnIngredient={learn} onCreateStockItem={vi.fn()} onSaveWaterSource={() => {}} />);
    allerEtape('Levure');
    fireEvent.click(screen.getByText('Fiche, sources et données de la souche'));
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher la fiche de cette levure' }));
    await screen.findByRole('button', { name: 'Reprendre ces valeurs' });
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0].context).toMatchObject({ kind: 'levure', name: yeast.name });
    expect(learn).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(learn).toHaveBeenCalledWith(yeast.name, expect.objectContaining({ yeastAttenuationPct: 77, yeastTempMinC: 17, yeastTempMaxC: 24 }));
    allerEtape('Récapitulatif');
    search();
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(run).toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast).toMatchObject({ ...yeast, attenuationPct: 77, fermTempMinC: 17, fermTempMaxC: 24 });
    expect(saved.fermentables?.[0]).toMatchObject({ ...malt, colorEbc: 6, potentialPpg: 38 });
    expect(saved.hops.map(h => h.alpha)).toEqual([12, 7.2]);
    expect(saved.fermentation).toEqual(recipe.fermentation);
  });
});
