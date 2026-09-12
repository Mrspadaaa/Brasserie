import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecipeAutoComplete } from '../../src/ui/RecipeAutoComplete';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { StorageService, defaultConfig } from '../../src/services/storage';
import type { Fermentable, Recipe, StockItem, YeastSpec } from '../../src/types';
import { allerEtape } from '../helpers/wizard';

const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...args: unknown[]) => run(...args) } }));
afterEach(() => { cleanup(); run.mockReset(); });

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
    fireEvent.click(screen.getByRole('button', { name: 'Compléter la levure avec l’IA' }));
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
