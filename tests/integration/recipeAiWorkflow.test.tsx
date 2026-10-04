import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecipeAutoComplete, applyYeastReview, reviewYeastFacts } from '../../src/ui/RecipeAutoComplete';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { StorageService, defaultConfig } from '../../src/services/storage';
import type { Fermentable, HopIngredient, Recipe, StockItem, YeastSpec } from '../../src/types';
import { allerEtape } from '../helpers/wizard';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { factsFromStock, applyYeastFacts, type IngredientFacts } from '../../src/domain/ingredientFacts';
import { YeastRecipeDossier } from '../../src/ui/YeastRecipeDossier';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { resolveYeastDossier } from '../../src/domain/yeastProjection';
import { tryAdoptYeastDocumentary } from '../../src/services/recipeDraft';

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
    expect(await screen.findByText(/Source citée.*Fiche fabricant de contrôle/)).toBeVisible();
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

describe('Portée des compléments locaux par étape', () => {
  it('complète seulement les houblons à cette étape, puis seulement la levure à la sienne', async () => {
    const initial: YeastSpec = { name: 'Wyeast 3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', qty: 125, unit: 'mL', pitchTempC: 18 };
    const initialFermentables = [{ ...malt, name: 'Malt de portée', stockItemRef: 'M-A' }];
    const initialHops = [{ name: 'Cascade de portée', stockItemRef: 'H-A', weightG: 10, alpha: 0, stage: 'boil' as const, timeMin: 15 }];
    const stockItems: StockItem[] = [
      { id: 'malt-doc', ref: 'M-A', name: 'Malt de portée', category: 'Malt', unit: 'kg', currentStock: 5, minStock: 0,
        reorder: false, colorEbc: 6, potentialPpg: 38, technicalSource: 'Fiche malt locale' },
      { id: 'hop-doc', ref: 'H-A', name: 'Cascade de portée', category: 'Houblon', unit: 'g', currentStock: 30, minStock: 0,
        reorder: false, alphaPct: 6, technicalSource: 'Fiche houblon locale' },
    ];
    let currentYeast = initial, currentFermentables: Fermentable[] = initialFermentables, currentHops: HopIngredient[] = initialHops;
    const yeastWrites: YeastSpec[] = [], fermentableWrites: Fermentable[][] = [], hopWrites: HopIngredient[][] = [];
    function Host({ scope }: { scope: 'houblon' | 'levure' }) {
      const [fermentables, setFermentables] = useState(initialFermentables);
      const [hops, setHops] = useState(initialHops);
      const [value, setValue] = useState(initial);
      currentYeast = value; currentFermentables = fermentables; currentHops = hops;
      return <RecipeAutoComplete scope={scope} fermentables={fermentables} onFermentables={next => { fermentableWrites.push(next); setFermentables(next); }}
        hops={hops} onHops={next => { hopWrites.push(next); setHops(next); }} yeast={value}
        onYeast={next => { yeastWrites.push(next); setValue(next); }} stockItems={stockItems} />;
    }
    const view = render(<Host scope="houblon" />);
    await waitFor(() => expect(currentHops[0].alpha).toBe(6));
    expect(currentYeast).toEqual(initial);
    expect(currentFermentables).toEqual(initialFermentables);
    expect(yeastWrites).toHaveLength(0);
    expect(fermentableWrites).toHaveLength(0); expect(hopWrites).toHaveLength(1);

    view.rerender(<Host scope="levure" />);
    await waitFor(() => expect(currentYeast.technicalFacts?.length).toBeGreaterThan(0));
    expect(currentYeast).toMatchObject({ hopIndexId: initial.hopIndexId, qty: 125, unit: 'mL', pitchTempC: 18 });
    expect(currentFermentables).toEqual(initialFermentables); expect(fermentableWrites).toHaveLength(0);
    expect(currentHops[0].alpha).toBe(6); expect(hopWrites).toHaveLength(1);
  });
});

describe('Révision de fiche des levures rares', () => {
  const rare: YeastSpec = { name: 'Culture rare R-125', qty: 125, unit: 'mL', lab: 'Micro labo',
    attenuationPct: 78, attenuationBasis: 'recipe', fermTempMinC: 18, fermTempMaxC: 24 };
  const technicalFacts: YeastTechnicalFact[] = [{ key: 'attenuation', reported: '77,25–82,75 %', range: { min: 77.25, max: 82.75 },
    unit: '%', qualifier: 'range', origin: 'ai', source: 'Fiche R-125', sourceUrl: 'https://example.com/r-125', retrievedAt: '2026-09-20' }];
  const response = (values = {}) => facts({ name: rare.name, form: 'liquide', flocculation: 'Moyenne',
    alcoholTolerancePct: 12.5, source: 'Fiche R-125', technicalFacts, ...values });
  function mountYeast(initial = rare, reviewScope?: 'trial' | 'recipe') {
    let current: YeastSpec = initial;
    const learn = vi.fn();
    function Host() {
      const [y, setY] = useState(initial);
      current = y;
      return <><RecipeAutoComplete scope="levure" yeastEnrichment embedded reviewScope={reviewScope} fermentables={[]} onFermentables={() => {}}
        hops={[]} onHops={() => {}} yeast={y} onYeast={setY} onLearnIngredient={learn} />
        <button onClick={() => setY({ ...y, name: 'Autre culture rare' })}>Changer de culture test</button>
        <button onClick={() => setY({ ...y, attenuationPct: 75 })}>Modifier l’hypothèse test</button></>;
    }
    render(<Host />);
    return { current: () => current, learn };
  }
  const enrich = () => fireEvent.click(screen.getByRole('button', { name: 'Rechercher la fiche avec l’IA' }));
  const review = (name: string) => screen.findByRole('region', { name: `Proposition IA pour ${name}` });
  const gap = (label: string) => screen.getByRole('group', { name: `Écart · ${label}` });
  const reopen = (y: YeastSpec) => normalizeRecipe({ yeast: JSON.parse(JSON.stringify(y)) } as Recipe).yeast;
  /** Historic mode (no review scope): every acceptance teaches the stock what it retained, in order. */
  const learnWithoutScope = async (initial: YeastSpec, act: (panel: HTMLElement) => void) => {
    cleanup();
    const view = mountYeast(initial);
    enrich();
    act(await review(initial.name));
    expect(view.learn).toHaveBeenCalled();
    const calls = view.learn.mock.calls as [string, Partial<StockItem>][];
    // Simulated stock that keeps every learned observation, as successive acceptances would.
    return { name: calls[0][0], learned: { ...Object.assign({}, ...calls.map(([, learned]) => learned)),
      yeastTechnicalFacts: calls.flatMap(([, learned]) => learned.yeastTechnicalFacts ?? []) } as Partial<StockItem>, calls };
  };

  it('propose la fiche enrichie, valide les données cohérentes en un geste et garde l’hypothèse de recette', async () => {
    run.mockResolvedValue(response());
    const view = mountYeast();
    enrich();
    const panel = await review(rare.name);
    expect(within(panel).queryByRole('region', { name: 'Écarts à vérifier' })).not.toBeInTheDocument();
    // A published range reads as a range; the recipe's own 78 % hypothesis is not a documentary conflict.
    expect(within(panel).getByRole('list', { name: `Données proposées pour ${rare.name}` })).toHaveTextContent('77,25–82,75 % · plage');
    expect(view.current()).toEqual(rare);
    fireEvent.click(within(panel).getByRole('button', { name: 'Tout valider' }));
    expect(view.current()).toMatchObject({ ...rare, form: 'liquide', flocculation: 'Moyenne', alcoholTolerancePct: 12.5 });
    expect(view.current().technicalFacts).toEqual(expect.arrayContaining(technicalFacts));
    expect(view.current().technicalSelections?.attenuation?.range).toEqual({ min: 77.25, max: 82.75 });
    expect(resolveYeastDossier(view.current())).toMatchObject({ attenuation: { basis: 'recipe', range: { min: 78, max: 78 } },
      documentedAttenuation: { qualifier: 'range', range: { min: 77.25, max: 82.75 } } });
    expect(reopen(view.current())).toEqual(view.current());
    expect(view.learn).toHaveBeenCalledWith(rare.name, expect.objectContaining({ yeastForm: 'liquide', yeastTechnicalFacts: expect.arrayContaining(technicalFacts) }));
    expect(within(panel).getByText(/Retenu dans la fiche de Culture rare R-125/)).toHaveTextContent('Forme');
    expect(within(panel).queryByRole('button', { name: 'Tout valider' })).not.toBeInTheDocument();
  });

  it('valide les données sans conflit malgré un écart, puis tranche l’écart restant', async () => {
    run.mockResolvedValue(response({ attenuationPct: 81, technicalFacts: [] }));
    const view = mountYeast({ ...rare, form: 'sèche' });
    enrich();
    const panel = await review(rare.name);
    const zone = within(panel).getByRole('region', { name: 'Écarts à vérifier' });
    expect(within(zone).getByRole('group', { name: 'Écart · Forme' }).querySelector('[data-side="current"]')).toHaveTextContent('sèche');
    expect(within(zone).getByRole('group', { name: 'Écart · Forme' }).querySelector('[data-side="proposed"]')).toHaveTextContent('liquide');
    expect(within(panel).queryByRole('button', { name: 'Tout valider' })).not.toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: 'Valider les données sans conflit' }));
    // Independent data are retained, the open gap keeps the current value, the hypothesis stays the recipe's.
    expect(view.current()).toMatchObject({ form: 'sèche', flocculation: 'Moyenne', alcoholTolerancePct: 12.5, attenuationPct: 78, attenuationBasis: 'recipe', qty: 125, unit: 'mL' });
    expect(view.current().technicalSelections?.attenuation).toMatchObject({ qualifier: 'reportedPoint', range: { min: 81, max: 81 } });
    expect(within(panel).getByText(/Retenu dans la fiche/)).toBeInTheDocument();
    fireEvent.click(within(gap('Forme')).getByRole('button', { name: 'Prendre la proposition' }));
    expect(view.current()).toMatchObject({ form: 'liquide', attenuationPct: 78, attenuationBasis: 'recipe', qty: 125, unit: 'mL' });
    expect(screen.queryByRole('region', { name: 'Écarts à vérifier' })).not.toBeInTheDocument();
  });

  it('rejette la réponse d’une souche précédente sans apprendre de données au stock', async () => {
    let resolve!: (value: unknown) => void;
    run.mockReturnValue(new Promise(r => { resolve = r; }));
    const view = mountYeast();
    enrich();
    fireEvent.click(screen.getByRole('button', { name: 'Changer de culture test' }));
    await act(async () => resolve(response()));
    expect(screen.queryByRole('region', { name: /^Proposition IA pour/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tout valider' })).not.toBeInTheDocument();
    expect(view.current().technicalFacts).toBeUndefined();
    expect(view.learn).not.toHaveBeenCalled();
  });

  it('invalide aussi une proposition quand une hypothèse est modifiée avant validation', async () => {
    run.mockResolvedValue(response());
    const view = mountYeast();
    enrich();
    await review(rare.name);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier l’hypothèse test' }));
    expect(screen.queryByRole('button', { name: 'Tout valider' })).not.toBeInTheDocument();
    expect(screen.getByText(/proposition périmée, rien n’a été retenu/)).toBeInTheDocument();
    expect(view.current().attenuationPct).toBe(75);
    expect(view.learn).not.toHaveBeenCalled();
  });

  it('accepte une fiche partielle sans inventer les autres données', async () => {
    run.mockResolvedValue(response({ technicalFacts: [], flocculation: undefined, alcoholTolerancePct: undefined }));
    const view = mountYeast({ name: rare.name });
    enrich();
    fireEvent.click(within(await review(rare.name)).getByRole('button', { name: 'Tout valider' }));
    expect(view.current()).toMatchObject({ name: rare.name, form: 'liquide' });
    expect(view.current().qty).toBeUndefined();
    expect(view.current().attenuationPct).toBeUndefined();
    expect(view.current().alcoholTolerancePct).toBeUndefined();
  });

  it('propose et retient une note documentaire seule, avec la source de cette réponse et sans toucher les anciennes notes', async () => {
    run.mockResolvedValue({ ok: true, data: { found: true, name: rare.name, source: 'Recherche fabricant R-125', sourceUrl: 'https://example.com/r-125-note',
      note: 'Identité du lot à confirmer auprès du laboratoire.' } });
    const view = mountYeast({ ...rare, notes: 'Lot du 12 septembre', technicalSource: 'Ancienne fiche' }, 'recipe');
    enrich();
    const panel = await review(rare.name);
    expect(within(panel).getByRole('list', { name: `Données proposées pour ${rare.name}` })).toHaveTextContent('Identité du lot à confirmer');
    const searchSource = within(panel).getByRole('link', { name: 'Recherche fabricant R-125' });
    expect(searchSource).toHaveAttribute('href', 'https://example.com/r-125-note');
    fireEvent.click(within(panel).getByRole('button', { name: 'Tout valider' }));
    expect(view.current().documentaryNotes).toEqual([{ text: 'Identité du lot à confirmer auprès du laboratoire.', origin: 'ai',
      source: 'Recherche fabricant R-125', sourceUrl: 'https://example.com/r-125-note' }]);
    expect(view.current()).toMatchObject({ notes: 'Lot du 12 septembre', technicalSource: 'Ancienne fiche', attenuationPct: 78, fermTempMaxC: 24 });
    expect(reopen(view.current()).documentaryNotes).toEqual(view.current().documentaryNotes);
    expect(view.learn).not.toHaveBeenCalled();
  });

  it('met toute la fiche en attente quand l’identité de la réponse diffère, jusqu’à confirmation explicite', async () => {
    run.mockResolvedValue(response({ lab: 'Autre laboratoire', strain: 'Z-9' }));
    const view = mountYeast({ ...rare, strain: 'R-125' });
    enrich();
    const panel = await review(rare.name);
    expect(within(panel).getByRole('alert')).toHaveTextContent('Identité à confirmer');
    expect(within(panel).getByRole('button', { name: 'Valider les données sans conflit' })).toBeDisabled();
    expect(within(gap('Laboratoire')).getByRole('button', { name: 'Prendre la proposition' })).toBeDisabled();
    fireEvent.click(within(panel).getByRole('button', { name: `C’est bien ${rare.name}` }));
    fireEvent.click(within(panel).getByRole('button', { name: 'Valider les données sans conflit' }));
    // The laboratory and code stay the sheet's until the brewer takes them explicitly.
    expect(view.current()).toMatchObject({ lab: 'Micro labo', strain: 'R-125', form: 'liquide' });
    expect(within(gap('Laboratoire')).getByRole('button', { name: 'Garder l’actuelle' })).toBeEnabled();
  });

  it('ne confond pas un code de souche avec son préfixe avant de retenir des données', async () => {
    run.mockResolvedValue(response({ strain: 'R-125', form: 'liquide' }));
    const view = mountYeast({ ...rare, strain: 'R-1', form: undefined });
    enrich();
    const panel = await review(rare.name);
    expect(within(panel).getByRole('alert')).toHaveTextContent('Identité à confirmer');
    expect(within(panel).getByRole('button', { name: 'Valider les données sans conflit' })).toBeDisabled();
    expect(view.current()).toMatchObject({ strain: 'R-1' });
    expect(view.current().form).toBeUndefined();
    expect(view.learn).not.toHaveBeenCalled();
  });

  it('vérifie les seuls écarts avec l’IA applicative, sans boucle ni écriture, puis suit la recommandation au choix', async () => {
    run.mockResolvedValueOnce(response({ form: 'sèche', technicalFacts: [] }))
      .mockResolvedValueOnce(facts({ name: rare.name, source: 'Vérification R-125', form: 'liquide' }));
    const view = mountYeast({ ...rare, form: 'liquide' }, 'recipe');
    enrich();
    const panel = await review(rare.name);
    fireEvent.click(within(panel).getByRole('button', { name: 'Vérifier avec l’IA applicative' }));
    await waitFor(() => expect(within(gap('Forme')).getByText(/Vérification IA : confirme la valeur actuelle/)).toBeInTheDocument());
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1][0].context.verifyDifferences).toEqual([expect.objectContaining({ field: 'form', label: 'Forme' })]);
    expect(within(panel).getByRole('button', { name: 'Vérification faite' })).toBeDisabled();
    expect(view.current().form).toBe('liquide');
    fireEvent.click(within(gap('Forme')).getByRole('button', { name: 'Suivre la vérification' }));
    expect(view.current().form).toBe('liquide');
    expect(within(panel).getByText(/Conservé tel quel : Forme/)).toBeInTheDocument();
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('choisit l’observation contradictoire à retenir avant d’utiliser une plage', async () => {
    run.mockResolvedValue(response({ name: 'Culture sans plage', tempMinC: 18, tempMaxC: 28, technicalFacts: [
      { key: 'temperature', reported: '18–28 °C', range: { min: 18, max: 28 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Fiche A' },
      { key: 'temperature', reported: '18–30 °C', range: { min: 18, max: 30 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Fiche B' },
    ], form: undefined, flocculation: undefined, alcoholTolerancePct: undefined }));
    const view = mountYeast({ name: 'Culture sans plage' }, 'trial');
    enrich();
    await review('Culture sans plage');
    const temperature = gap('Température de fermentation');
    expect(temperature).toHaveTextContent('plusieurs valeurs différentes');
    expect(view.current().fermTempMaxC).toBeUndefined();
    fireEvent.click(within(temperature).getByRole('button', { name: 'Prendre 18–30 °C · plage' }));
    expect(view.current().fermTempMaxC).toBe(30);
    expect(view.current().technicalSelections?.temperature?.range).toEqual({ min: 18, max: 30 });
  });

  it('confronte la plage scalaire existante à une nouvelle observation sans changer le calcul en silence', async () => {
    const current = { name: 'Culture personnelle', fermTempMinC: 18, fermTempMaxC: 30, technicalSource: 'Fiche personnelle' };
    const answer = facts({ name: current.name, source: 'Fiche IA 18–28', technicalFacts: [
      { key: 'temperature', reported: '18–28 °C', range: { min: 18, max: 28 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Fiche IA 18–28' }
    ] });
    run.mockResolvedValue(answer);
    const view = mountYeast(current, 'trial');
    enrich();
    const panel = await review(current.name);
    const temperature = gap('Température de fermentation');
    expect(temperature.querySelector('[data-side="current"]')).toHaveTextContent('18–30 °C · plage');
    expect(temperature.querySelector('[data-side="proposed"]')).toHaveTextContent('18–28 °C · plage');
    expect(panel.querySelector('[data-review-found]')).toHaveTextContent('Fiche IA 18–28');
    expect(temperature.querySelector('.yc-review-source')).toBeNull();
    fireEvent.click(within(temperature).getByRole('button', { name: 'Garder l’actuelle' }));
    expect(view.current().fermTempMaxC).toBe(30);
    expect(resolveYeastDossier(view.current()).temperature?.range.max).toBe(30);
    expect(screen.getByText(/Conservé tel quel : Température de fermentation/)).toBeInTheDocument();
    cleanup();
    const second = mountYeast(current, 'trial');
    enrich();
    await review(current.name);
    fireEvent.click(within(gap('Température de fermentation')).getByRole('button', { name: 'Prendre la proposition' }));
    expect(second.current().fermTempMaxC).toBe(28);
    expect(resolveYeastDossier(reopen(second.current())).temperature?.range.max).toBe(28);
  });

  it('retient la plage choisie même lorsqu’elle égale les anciens chiffres et qu’une autre observation diverge', async () => {
    const current = { name: 'Culture personnelle', fermTempMinC: 18, fermTempMaxC: 30 };
    run.mockResolvedValue(facts({ name: current.name, technicalFacts: [
      { key: 'temperature', reported: '18–28 °C', range: { min: 18, max: 28 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Fiche A' },
      { key: 'temperature', reported: '18–30 °C', range: { min: 18, max: 30 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Fiche B' },
    ] }));
    const view = mountYeast(current, 'trial');
    enrich();
    await review(current.name);
    fireEvent.click(within(gap('Température de fermentation')).getByRole('button', { name: 'Prendre 18–30 °C · plage' }));
    expect(view.current().technicalSelections?.temperature?.range).toEqual({ min: 18, max: 30 });
    expect(resolveYeastDossier(reopen(view.current())).temperature?.range.max).toBe(30);
  });

  it('essai : montre la source exacte du fait près de l’écart et n’apprend rien au stock malgré le callback fourni', async () => {
    const formUrl = 'https://example.com/r-125/forme', genericUrl = 'https://example.com/catalogue';
    run.mockResolvedValue(facts({ name: rare.name, form: 'liquide', source: 'Catalogue R-125', sourceUrl: genericUrl, technicalFacts: [
      { key: 'form', reported: 'liquide', origin: 'ai', source: 'Fiche R-125 · conditionnement', sourceUrl: formUrl },
      { key: 'temperature', reported: '18–28 °C', range: { min: 18, max: 28 }, unit: '°C', qualifier: 'range', origin: 'ai', source: 'Note R-125 sans lien' }
    ] }));
    const view = mountYeast({ name: rare.name, form: 'sèche', fermTempMinC: 18, fermTempMaxC: 30 }, 'trial');
    enrich();
    const panel = await review(rare.name);
    const found = panel.querySelector('[data-review-found]')!;
    expect(found).toHaveTextContent('Catalogue R-125');
    expect(found.querySelector('a')).toHaveAttribute('href', genericUrl);
    const form = gap('Forme');
    expect(form).toHaveTextContent('source citée pour ce fait : Fiche R-125 · conditionnement');
    expect(within(form).getAllByRole('link').map(link => link.getAttribute('href'))).toEqual([formUrl]);
    const temperature = gap('Température de fermentation');
    expect(temperature).toHaveTextContent('source citée pour ce fait : Note R-125 sans lien');
    expect(within(temperature).queryByRole('link')).not.toBeInTheDocument();
    fireEvent.click(within(form).getByRole('button', { name: 'Prendre la proposition' }));
    fireEvent.click(within(gap('Température de fermentation')).getByRole('button', { name: 'Prendre la proposition' }));
    expect(view.current()).toMatchObject({ form: 'liquide', fermTempMaxC: 28 });
    expect(view.learn).not.toHaveBeenCalled();
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

  it('n’écrit aucun lot homonyme au hasard et n’utilise qu’une référence encore présente', () => {
    const rows: StockItem[] = ['A', 'B'].map(ref => ({ id: ref, ref, name: rare.name, category: 'Levure', unit: 'mL',
      currentStock: 100, minStock: 0, reorder: false }));
    vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: rows, cleaning: [], equipment: [], kegs: [] }));
    const put = vi.spyOn(FirestoreRepo, 'put').mockImplementation(() => undefined);
    StorageService.learnIngredient(rare.name, { category: 'Levure', yeastLab: 'Labo B' });
    expect(put).not.toHaveBeenCalled();
    StorageService.learnIngredient(rare.name, { category: 'Levure', ref: 'B', yeastLab: 'Labo B' });
    expect(put).toHaveBeenCalledExactlyOnceWith('stockItems', 'B', { yeastLab: 'Labo B' }, { merge: true });
    StorageService.learnIngredient(rare.name, { category: 'Levure', ref: 'supprimée', yeastLab: 'Labo C' });
    expect(put).toHaveBeenCalledTimes(1);
  });

  describe('réponses réelles S‑04 et M54 (fixtures du 25/09/2026, aucun appel)', () => {
    const s04Doc = { origin: 'ai' as const, source: 'SafAle™ S-04 - Fermentis', sourceUrl: 'https://fermentis.com/en/product/safale-s-04/', retrievedAt: '2026-09-25' };
    const s04: IngredientFacts = { found: true, name: 'SafAle S-04', source: s04Doc.source, sourceUrl: s04Doc.sourceUrl, retrievedAt: s04Doc.retrievedAt,
      lab: 'Fermentis', strain: 'SafAle S-04', form: 'sèche', tempMinC: 18, tempMaxC: 26, technicalFacts: [
        { key: 'temperature', reported: '18–26 °C', qualifier: 'range', range: { min: 18, max: 26 }, unit: '°C', ...s04Doc },
        { key: 'attenuation', reported: '74–82%', qualifier: 'range', range: { min: 74, max: 82 }, unit: '%', ...s04Doc },
        { key: 'alcoholTolerance', reported: '9–11%', qualifier: 'range', range: { min: 9, max: 11 }, unit: '%', ...s04Doc },
        { key: 'pitchRate', reported: '50 to 80 g/hl', qualifier: 'range', range: { min: 50, max: 80 }, unit: 'g/hl', ...s04Doc },
        { key: 'flocculation', reported: 'High / Fast sedimentation', ...s04Doc },
        { key: 'form', reported: 'Sèche active', ...s04Doc },
        { key: 'species', reported: 'Saccharomyces cerevisiae', ...s04Doc }
      ] };
    const m54Doc = { origin: 'ai' as const, source: 'Mangrove Jack\'s — Craft Series Yeast Technical Data',
      sourceUrl: 'https://help.mangrovejacks.com/hc/en-us/article_attachments/13551379984785', retrievedAt: '2026-09-25' };
    const m54: IngredientFacts = { found: true, name: 'M54 · Californian Lager', source: m54Doc.source, sourceUrl: m54Doc.sourceUrl, retrievedAt: m54Doc.retrievedAt,
      lab: 'Mangrove Jack’s', strain: 'M54', form: 'sèche', flocculation: 'High', attenuationPct: 79.5, alcoholTolerancePct: 9, tempMinC: 18, tempMaxC: 20, technicalFacts: [
        { key: 'temperature', reported: '18 - 20°C', context: 'Recommandation de température de fermentation', qualifier: 'range', range: { min: 18, max: 20 }, unit: '°C', ...m54Doc },
        { key: 'attenuation', reported: '77 - 82%', context: 'Atténuation apparente', qualifier: 'range', range: { min: 77, max: 82 }, unit: '%', ...m54Doc },
        { key: 'alcoholTolerance', reported: '9 % ABV', context: 'Tolérance maximale à l\'alcool', qualifier: 'upTo', range: { min: 9, max: 9 }, unit: '%', ...m54Doc },
        { key: 'flocculation', reported: 'High', context: 'Niveau de sédimentation / flocculation', ...m54Doc },
        { key: 'form', reported: 'sèche', context: 'Forme commerciale de la levure', ...m54Doc }
      ] };
    // Noms hors catalogue local : seule la réponse réelle est éprouvée, sans complétion locale préalable.
    const s04Name = 'Culture témoin anglaise', m54Name = 'Culture témoin lager';
    const row = (name: string) => screen.getByRole('group', { name }).querySelector('[data-fact-reading]');

    it('S‑04 : valide les données cohérentes, tranche la floculation textuelle, la sauvegarde au stock et la relit typée', async () => {
      run.mockResolvedValue({ ok: true, data: s04 });
      const view = mountYeast({ name: s04Name, qty: 11.5, unit: 'g', flocculation: 'Moyenne' }, 'recipe');
      enrich();
      const panel = await review(s04Name);
      expect(run.mock.calls[0][0].context).toMatchObject({ kind: 'levure', name: s04Name });
      const flocculation = gap('Floculation');
      expect(flocculation.querySelector('[data-side="current"]')).toHaveTextContent('Moyenne');
      expect(flocculation.querySelector('[data-side="proposed"]')).toHaveTextContent('High / Fast sedimentation');
      fireEvent.click(within(panel).getByRole('button', { name: 'Valider les données sans conflit' }));
      expect(view.current().flocculation).toBe('Moyenne');
      fireEvent.click(within(gap('Floculation')).getByRole('button', { name: 'Prendre la proposition' }));
      const applied = view.current();
      expect(applied).toMatchObject({ name: s04Name, qty: 11.5, unit: 'g', lab: 'Fermentis', strain: 'SafAle S-04', form: 'sèche',
        fermTempMinC: 18, fermTempMaxC: 26, flocculation: 'High / Fast sedimentation', technicalSource: s04.source });
      expect([applied.attenuationPct, applied.alcoholTolerancePct, applied.pitchTempC]).toEqual([undefined, undefined, undefined]);
      expect(applied.technicalFacts).toEqual(expect.arrayContaining([
        expect.objectContaining({ key: 'flocculation', reported: 'High / Fast sedimentation', sourceUrl: s04Doc.sourceUrl })]));
      const reopened = reopen(applied);
      expect(reopened).toMatchObject({ flocculation: 'High / Fast sedimentation', lab: 'Fermentis', fermTempMinC: 18, fermTempMaxC: 26 });
      expect(reopened.technicalSelections?.attenuation?.range).toEqual({ min: 74, max: 82 });
      // Portée recette : aucune écriture au stock, même avec un callback fourni.
      expect(view.learn).not.toHaveBeenCalled();
      const { name: learnedName, calls } = await learnWithoutScope({ name: s04Name, qty: 11.5, unit: 'g', flocculation: 'Moyenne' }, panel => {
        fireEvent.click(within(panel).getByRole('button', { name: 'Valider les données sans conflit' }));
        fireEvent.click(within(gap('Floculation')).getByRole('button', { name: 'Prendre la proposition' }));
      });
      expect(calls).toHaveLength(2);

      // Base simulée : l’écriture passe par learnIngredient, jamais par Firestore réel.
      let rows: StockItem[] = [{ id: 's04', ref: 's04', name: s04Name, category: 'Levure', unit: 'g', currentStock: 100, minStock: 0, reorder: false }];
      vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: rows, cleaning: [], equipment: [], kegs: [] }));
      vi.spyOn(FirestoreRepo, 'put').mockImplementation((collection, id, patch) => {
        if (collection === 'stockItems') rows = rows.map(row => row.ref === id ? JSON.parse(JSON.stringify({ ...row, ...patch })) : row);
        return undefined;
      });
      calls.forEach(([, learned]) => StorageService.learnIngredient(learnedName, learned));
      expect(rows[0]).toMatchObject({ currentStock: 100, unit: 'g', yeastFlocculation: 'High / Fast sedimentation', yeastLab: 'Fermentis', yeastForm: 'sèche' });
      expect([rows[0].yeastAttenuationPct, rows[0].yeastAlcoholTolerancePct]).toEqual([undefined, undefined]);
      const reused = applyYeastFacts({ name: s04Name, qty: 11.5, unit: 'g' }, factsFromStock(rows[0]));
      expect(reused).toMatchObject({ flocculation: 'High / Fast sedimentation', form: 'sèche', lab: 'Fermentis', qty: 11.5, unit: 'g' });

      cleanup();
      render(<YeastRecipeDossier yeast={reopened} onChange={() => {}} reference={null} />);
      // The retained values are read as published, never as an empty scalar box under a documented range.
      expect(row('Floculation')).toHaveTextContent('High / Fast sedimentation');
      expect(row('Tolérance à l’alcool')).toHaveTextContent('9–11 % vol');
      expect(row('Atténuation annoncée')).toHaveTextContent('74–82 %');
      expect(row('Température de fermentation')).toHaveTextContent('18–26 °C');
    });

    it('M54 : présente 9 % comme plafond, écarte 79,5 % et ne crée aucun point exact après sauvegarde', async () => {
      run.mockResolvedValue({ ok: true, data: m54 });
      const view = mountYeast({ name: m54Name, qty: 10, unit: 'g' }, 'recipe');
      enrich();
      const panel = await review(m54Name);
      expect(within(panel).getByRole('list', { name: `Données proposées pour ${m54Name}` })).toHaveTextContent('≤ 9 % vol · borne');
      expect(screen.queryByText(/79[.,]5/)).not.toBeInTheDocument();
      expect(within(panel).queryByRole('region', { name: 'Écarts à vérifier' })).not.toBeInTheDocument();
      fireEvent.click(within(panel).getByRole('button', { name: 'Tout valider' }));
      const applied = view.current();
      expect(applied).toMatchObject({ qty: 10, unit: 'g', lab: 'Mangrove Jack’s', strain: 'M54', form: 'sèche', flocculation: 'High', fermTempMinC: 18, fermTempMaxC: 20 });
      // Contextes descriptifs de la fiche : la plage et le plafond sont retenus tels quels pour le calcul.
      expect(applied.technicalSelections).toMatchObject({ attenuation: { qualifier: 'range', range: { min: 77, max: 82 } },
        alcoholTolerance: { qualifier: 'upTo', range: { min: 9, max: 9 } } });
      const reopened = reopen(applied);
      expect([reopened.attenuationPct, reopened.alcoholTolerancePct]).toEqual([undefined, undefined]);
      expect(resolveYeastDossier(reopened)).toMatchObject({ documentedAttenuation: { qualifier: 'range', range: { min: 77, max: 82 } },
        alcoholTolerance: { qualifier: 'upTo', range: { min: 9, max: 9 } } });
      expect(reopened.technicalFacts?.filter(fact => fact.key === 'alcoholTolerance')).toEqual([expect.objectContaining({ qualifier: 'upTo', sourceUrl: m54Doc.sourceUrl })]);
      expect(view.learn).not.toHaveBeenCalled();
      const { learned } = await learnWithoutScope({ name: m54Name, qty: 10, unit: 'g' }, panel =>
        fireEvent.click(within(panel).getByRole('button', { name: 'Tout valider' })));
      expect([learned.yeastAttenuationPct, learned.yeastAlcoholTolerancePct, learned.yeastFlocculation]).toEqual([undefined, undefined, 'High']);
      const stored: StockItem = JSON.parse(JSON.stringify({ id: 'm54', ref: 'm54', name: m54Name, unit: 'g', currentStock: 0, minStock: 0, reorder: false, ...learned }));
      const reused = applyYeastFacts({ name: m54Name }, factsFromStock(stored));
      expect([reused.attenuationPct, reused.alcoholTolerancePct, reused.flocculation]).toEqual([undefined, undefined, 'High']);

      cleanup();
      render(<YeastRecipeDossier yeast={reopened} onChange={() => {}} reference={null} />);
      expect(row('Tolérance à l’alcool')).toHaveTextContent('≤ 9 % vol');
      expect(screen.getByRole('group', { name: 'Tolérance à l’alcool' })).toHaveAttribute('data-value-kind', 'bound');
      expect(row('Atténuation annoncée')).toHaveTextContent('77–82 %');
      expect(row('Floculation')).toHaveTextContent('High');
      expect(screen.queryByText(/Non repris dans les champs/)).not.toBeInTheDocument();
    });
  });

  it('place une observation seule dans son champ, rend écarts et désaccords visibles, puis sauvegarde sans quantité ni ensemencement', async () => {
    const doc = { origin: 'ai' as const, source: 'Fiche de contrôle Q-12', sourceUrl: 'https://example.com/q-12', retrievedAt: '2026-09-25' };
    const point = (key: YeastTechnicalFact['key'], value: number, unit: string, extra: Partial<YeastTechnicalFact> = {}): YeastTechnicalFact =>
      ({ key, reported: `${value} ${unit}`, qualifier: 'reportedPoint', range: { min: value, max: value }, unit, ...doc, ...extra });
    const name = 'Culture témoin Q-12';
    const sheet: IngredientFacts = { found: true, name, source: doc.source, sourceUrl: doc.sourceUrl, technicalFacts: [
      { key: 'temperature', reported: '12–18 °C', context: 'Recommandation de température de fermentation', qualifier: 'range', range: { min: 12, max: 18 }, unit: '°C', ...doc },
      point('attenuation', 78, '%', { context: 'Atténuation apparente' }),
      { key: 'attenuation', reported: '85–90 %', context: 'Atténuation apparente en hydromel', qualifier: 'range', range: { min: 85, max: 90 }, unit: '%', ...doc },
      point('alcoholTolerance', 10, '%'), point('fermentationTime', 14, 'jours', { context: 'Durée de fermentation' }),
      { key: 'flocculation', reported: 'High', ...doc }, { key: 'flocculation', reported: 'Medium', ...doc, source: 'Autre fiche Q-12' },
      { key: 'pitchRate', reported: '50–80 g/hl', qualifier: 'range', range: { min: 50, max: 80 }, unit: 'g/hl', ...doc }
    ] };
    run.mockResolvedValue({ ok: true, data: sheet });
    const view = mountYeast({ name, qty: 2, unit: 'sachet', fermentDays: 10 }, 'recipe');
    enrich();
    const panel = await review(name);
    const days = gap('Durée indicative de la fiche');
    expect(days.querySelector('[data-side="current"]')).toHaveTextContent('10 j');
    expect(days.querySelector('[data-side="proposed"]')).toHaveTextContent('14 jours');
    const flocculation = gap('Floculation');
    expect(flocculation).toHaveTextContent('ne s’accordent pas');
    expect(flocculation.querySelector('[data-side="proposed"]')).toHaveTextContent('High');
    expect(flocculation.querySelector('[data-side="proposed"]')).toHaveTextContent('Medium');
    const found = panel.querySelector('[data-review-found]')!;
    expect(found).toHaveTextContent('Fiche de contrôle Q-12');
    expect(found.querySelector('a')).toHaveAttribute('href', doc.sourceUrl);
    expect(flocculation.querySelector('.yc-review-source')).toBeNull();
    expect(within(panel).getByText(/non repris dans les calculs/)).toHaveTextContent('hydromel');
    fireEvent.click(within(panel).getByRole('button', { name: 'Valider les données sans conflit' }));
    expect(view.current().fermentDays).toBe(10);
    fireEvent.click(within(gap('Durée indicative de la fiche')).getByRole('button', { name: 'Prendre la proposition' }));
    fireEvent.click(within(gap('Floculation')).getByRole('button', { name: 'Plus tard' }));
    expect(within(panel).getByText(/Plus tard · Floculation/)).toBeInTheDocument();
    const applied = view.current();
    expect(applied).toMatchObject({ name, qty: 2, unit: 'sachet', fermTempMinC: 12, fermTempMaxC: 18, attenuationPct: 78, attenuationBasis: 'declared',
      alcoholTolerancePct: 10, fermentDays: 14 });
    expect([applied.flocculation, applied.pitchTempC, applied.stockItemRef]).toEqual([undefined, undefined, undefined]);
    const pitchRate = expect.objectContaining({ key: 'pitchRate', reported: '50–80 g/hl', range: { min: 50, max: 80 }, unit: 'g/hl',
      qualifier: 'range', origin: 'ai', source: doc.source, sourceUrl: doc.sourceUrl, retrievedAt: doc.retrievedAt });
    expect(applied.technicalFacts).toEqual(expect.arrayContaining([pitchRate]));
    const reopened = normalizeRecipe({ yeast: JSON.parse(JSON.stringify(applied)) } as Recipe).yeast;
    expect(reopened.technicalFacts).toEqual(expect.arrayContaining([pitchRate]));
    expect(reopened).toMatchObject({ fermTempMinC: 12, fermTempMaxC: 18, attenuationPct: 78, alcoholTolerancePct: 10, fermentDays: 14 });
    expect(resolveYeastDossier(reopened)).toMatchObject({ temperature: { range: { min: 12, max: 18 } }, documentedAttenuation: { range: { min: 78, max: 78 } } });
    expect(view.learn).not.toHaveBeenCalled();
    const { learned } = await learnWithoutScope({ name, qty: 2, unit: 'sachet', fermentDays: 10 }, panel => {
      fireEvent.click(within(panel).getByRole('button', { name: 'Valider les données sans conflit' }));
      fireEvent.click(within(gap('Durée indicative de la fiche')).getByRole('button', { name: 'Prendre la proposition' }));
    });
    expect(learned).toMatchObject({ yeastTempMinC: 12, yeastTempMaxC: 18, yeastAttenuationPct: 78, yeastAlcoholTolerancePct: 10 });
    expect([learned.currentStock, learned.yeastFlocculation]).toEqual([undefined, undefined]);
    const stored: StockItem = JSON.parse(JSON.stringify({ id: 'q12', ref: 'q12', name, unit: 'sachet', currentStock: 4, minStock: 0, reorder: false, ...learned }));
    expect(applyYeastFacts({ name }, factsFromStock(stored))).toMatchObject({ fermTempMinC: 12, fermTempMaxC: 18, attenuationPct: 78, alcoholTolerancePct: 10, fermentDays: 14 });

    const correctedDays = tryAdoptYeastDocumentary(reopened, { ...reopened, fermentDays: 10 }, { intent: 'documentary' });
    expect(correctedDays.accepted).toBe(true);
    cleanup();
    render(<YeastRecipeDossier yeast={correctedDays.yeast} onChange={() => {}} reference={null} />);
    expect(screen.getByLabelText('Durée indicative de la fiche, en jours')).toHaveValue('10');
    expect(screen.getByText(/^Fiche : 14 jours/)).toBeInTheDocument();
    expect(screen.getByText('Non repris dans les champs ni le calcul : milieu ou condition non attribuable à la bière.')).toBeInTheDocument();
    const observations = screen.getByLabelText('Données documentaires conservées');
    fireEvent.click(within(observations).getByText(/Toutes les observations/));
    const preparation = within(observations).getByRole('region', { name: 'Préparer et ensemencer' });
    expect(within(preparation).getByText('50–80 g/hl · plage')).toBeVisible();
    expect(within(observations).getByRole('link', { name: 'Fiche de contrôle Q-12' })).toHaveAttribute('href', doc.sourceUrl);
    expect(observations.querySelector('[data-citations]')).toHaveTextContent('Source commune');
    expect(observations.querySelector('[data-citations]')).toHaveTextContent('date indiquée : 25.09.2026');
  });
});

describe('IA dans les étapes d’une recette enregistrée', () => {
  const wizard = (recipe: Recipe, save = vi.fn(), learn = vi.fn()) => render(<BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()}
    onSave={save} onLearnIngredient={learn} onCreateStockItem={vi.fn()} onSaveWaterSource={vi.fn()} />);
  const M20 = 'M20 · Bavarian Wheat';
  /** The sheet of the strain in view is one in-flow action named for it. */
  const openSheet = (name: string) => {
    const fold = screen.getByRole('group', { name: `Fiche de ${name}` }) as HTMLDetailsElement;
    if (!fold.open) fireEvent.click(fold.querySelector('summary')!);
    expect(fold).toHaveAttribute('open');
    return fold;
  };
  const tryCandidate = (query: string, label: string) => {
    fireEvent.change(screen.getByRole('searchbox', { name: 'Chercher une autre levure' }), { target: { value: query } });
    const compare = screen.getByRole('checkbox', { name: `Comparer ${label}` });
    if (!(compare as HTMLInputElement).checked) fireEvent.click(compare);
    const sideBySide = screen.getByRole('button', { name: /^(Comparer côte à côte|Masquer le côte à côte)/ });
    if (sideBySide.getAttribute('aria-expanded') !== 'true') fireEvent.click(sideBySide);
    fireEvent.click(screen.getByRole('button', { name: `Essayer la conduite avec ${label}, sans changer le brouillon` }));
  };
  const tryM20 = () => { tryCandidate('M20', M20); return openSheet(M20); };
  const chooseDirectCandidate = (query: string, label: string) => {
    fireEvent.change(screen.getByRole('searchbox', { name: 'Chercher une autre levure' }), { target: { value: query } });
    fireEvent.click(screen.getByRole('button', { name: `Choisir ${label} pour le brouillon` }));
  };
  const searchSheet = (fold: HTMLElement) => fireEvent.click(within(fold).getByRole('button', { name: 'Rechercher la fiche avec l’IA' }));
  const m20Reference = () => yeastReferences([]).find(reference => reference.id === 'yeast-mangrove-jacks-132040951')!;
  /** Takes the proposal for the named gaps and keeps the current value everywhere else; nothing else is validated. */
  const decideGaps = (fold: HTMLElement, take: string[]) => {
    for (let guard = 0; guard < 10; guard++) {
      const open = within(fold).queryAllByRole('group', { name: /^Écart · / }).filter(group => !group.closest('details:not([open])'));
      const next = open[0]; if (!next) return;
      const label = next.getAttribute('aria-label')!.replace('Écart · ', '');
      fireEvent.click(within(next).getByRole('button', { name: take.includes(label) ? 'Prendre la proposition' : /^(Garder l’actuelle|Laisser non renseignée)$/ }));
    }
  };

  it('range une note IA de la levure choisie dans son livre, puis la retrouve après un choix direct A → B → A', async () => {
    const sourceUrl = 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g';
    run.mockResolvedValue({ ok: true, data: { found: true, name: M20, source: 'Fiche M20 publiée', sourceUrl,
      note: 'Profil de la souche : source narrative conservée.' } });
    const recipe = yeastFlowRecipe();
    recipe.yeast.notes = 'Note opérationnelle de la Wyeast 3068.';
    const save = vi.fn(), learn = vi.fn();
    const view = wizard(recipe, save, learn);
    allerEtape('Levure');
    chooseDirectCandidate('M20', M20);
    let sheet = openSheet(M20);
    searchSheet(sheet);
    const proposal = await within(sheet).findByRole('region', { name: `Proposition IA pour ${M20}` });
    fireEvent.click(within(proposal).getByRole('button', { name: 'Tout valider' }));
    expect(within(sheet).getByRole('group', { name: 'Notes documentaires de la souche' })).toHaveTextContent('Profil de la souche : source narrative conservée.');
    expect(run.mock.calls[0][0].context).toMatchObject({ kind: 'levure', name: M20 });
    expect(learn).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();

    chooseDirectCandidate('3638', '3638 · Bavarian Wheat');
    expect(screen.getByRole('region', { name: 'Levure de la recette' })).not.toHaveTextContent('Profil de la souche : source narrative conservée.');
    chooseDirectCandidate('M20', M20);
    sheet = openSheet(M20);
    const notes = within(sheet).getByRole('group', { name: 'Notes documentaires de la souche' });
    expect(notes).toHaveTextContent('Profil de la souche : source narrative conservée.');
    expect(notes).toHaveTextContent('Recherche IA');
    expect(within(notes).getByRole('link', { name: 'Fiche M20 publiée' })).toHaveAttribute('href', sourceUrl);
    expect(sheet).not.toHaveTextContent('Note opérationnelle de la Wyeast 3068.');
    expect(run).toHaveBeenCalledTimes(1); expect(learn).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();

    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast.documentaryNotes).toEqual([{ text: 'Profil de la souche : source narrative conservée.', origin: 'ai', source: 'Fiche M20 publiée', sourceUrl }]);
    expect(saved.yeast.qty).toBeUndefined(); expect(saved.yeast.unit).toBeUndefined();
    expect(saved.yeast.pitchTempC).toBeUndefined(); expect(saved.yeast.stockItemRef).toBeUndefined(); expect(saved.yeast.notes).toBeUndefined();
    expect(normalizeRecipe(JSON.parse(JSON.stringify(saved)) as Recipe).yeast.documentaryNotes).toEqual(saved.yeast.documentaryNotes);
    view.unmount();
  });

  it('refuse une réponse tardive sur A après qu’une correction manuelle a avancé sa révision de fiche', async () => {
    let resolveLate!: (value: unknown) => void;
    run.mockReturnValueOnce(new Promise(resolve => { resolveLate = resolve; }));
    const recipe = yeastFlowRecipe(), save = vi.fn();
    const view = wizard(recipe, save);
    allerEtape('Levure');
    chooseDirectCandidate('M20', M20);
    let sheet = openSheet(M20);
    searchSheet(sheet);
    expect(run).toHaveBeenCalledTimes(1);

    const temperature = within(sheet).getByRole('group', { name: 'Température de fermentation' });
    fireEvent.click(within(temperature).getByRole('button', { name: 'Corriger Température de fermentation' }));
    const maximum = within(temperature).getByLabelText('Température de fermentation · maximum');
    fireEvent.change(maximum, { target: { value: '29' } }); fireEvent.blur(maximum);
    const sourceUrl = 'https://mangrovejacks.com/products/m20-bavarian-wheat-10g';
    fireEvent.change(within(temperature).getByLabelText('Source · Température de fermentation'), { target: { value: sourceUrl } });
    fireEvent.click(within(temperature).getByRole('button', { name: 'Retenir' }));

    await act(async () => resolveLate(facts({ name: M20, source: 'Réponse tardive de M20', note: 'Note IA périmée.', technicalFacts: [
      { key: 'temperature', reported: '20–25 °C', range: { min: 20, max: 25 }, unit: '°C', qualifier: 'range', origin: 'ai',
        source: 'Réponse tardive de M20', sourceUrl: 'https://example.com/stale-m20-temperature', context: 'beer' }
    ] })));
    sheet = openSheet(M20);
    expect(sheet).not.toHaveTextContent('Note IA périmée.');
    expect(within(sheet).getByRole('group', { name: 'Température de fermentation' }).querySelector('[data-fact-reading]')).toHaveTextContent('18–29 °C');

    chooseDirectCandidate('3638', '3638 · Bavarian Wheat');
    chooseDirectCandidate('M20', M20);
    sheet = openSheet(M20);
    expect(sheet).not.toHaveTextContent('Note IA périmée.');
    expect(within(sheet).getByRole('group', { name: 'Température de fermentation' }).querySelector('[data-fact-reading]')).toHaveTextContent('18–29 °C');
    expect(save).not.toHaveBeenCalled();
    view.unmount();
  });

  it('retient la fiche IA de l’essai M20 dans sa fiche locale, puis applique, sauvegarde et rouvre sans reprendre le pack 3068', async () => {
    const save = vi.fn(), learn = vi.fn();
    run.mockResolvedValue(facts({ name: M20, source: 'Fiche M20 contrôlée', form: 'liquide',
      tempMinC: 18, tempMaxC: 28, alcoholTolerancePct: 11 }));
    const view = wizard(yeastFlowRecipe(), save, learn);
    allerEtape('Levure');
    const trial = tryM20();
    const scopeNote = trial.querySelector('summary [data-sheet-scope-note]');
    expect(scopeNote).toHaveTextContent('Essai local · fiche du catalogue · recette, stock et autres candidats inchangés');
    searchSheet(trial);
    await within(trial).findByRole('region', { name: `Proposition IA pour ${M20}` });
    expect(run.mock.calls[0][0].context).toMatchObject({ kind: 'levure', name: M20 });
    expect(run.mock.calls[0][0].context.known).not.toHaveProperty('qty');
    decideGaps(trial, ['Température de fermentation']);
    expect(within(openSheet(M20)).getByText(/fiche corrigée localement/)).toBeInTheDocument();
    expect(within(trial).getByRole('group', { name: 'Température de fermentation' }).querySelector('[data-fact-reading]')).toHaveTextContent('18–28 °C');
    expect(screen.getByRole('region', { name: 'Décider des changements de l’essai' })).toHaveTextContent('Fiche du candidat retenue dans l’essai');
    expect(screen.getByRole('region', { name: 'Décider des changements de l’essai' })).toHaveTextContent('Fiche M20 contrôlée');
    expect(learn).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(screen.getByRole('group', { name: `Fiche de ${M20}` })).toHaveAttribute('data-sheet-scope', 'recipe');
    const plannedQuantity = screen.getByRole('group', { name: 'Quantité prévue de levure' });
    expect(plannedQuantity).toHaveAttribute('data-yeast-quantity', 'missing');
    expect(within(plannedQuantity).getByRole('textbox', { name: 'Quantité de levure' })).toHaveValue('');
    const state = screen.getByLabelText('État du choix de levure');
    expect(state.querySelector('[data-difference="quantity"] [data-side="draft"]')).not.toHaveTextContent('125 mL');
    // The saved 3068 pack stays readable as the saved side of the exact difference, never as the draft value.
    expect(state.querySelector('[data-difference="quantity"] [data-side="saved"]')).toHaveTextContent('125 mL');
    expect(state.querySelector('[data-difference="quantity"] [data-side="draft"]')).toHaveTextContent('quantité à renseigner');
    fireEvent.change(screen.getByRole('combobox', { name: 'Unité de la quantité de levure' }), { target: { value: 'g' } });
    fireEvent.change(screen.getByLabelText('Quantité de levure, en g'), { target: { value: '12' } });
    fireEvent.blur(screen.getByLabelText('Quantité de levure, en g'));
    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast).toMatchObject({ name: M20, form: 'sèche', qty: 12, unit: 'g', fermTempMinC: 18, fermTempMaxC: 28 });
    expect(saved.yeast.hopIndexId).toMatch(/^yeast-mangrove-jacks-/);
    expect(saved.yeast.stockItemRef).toBeUndefined();
    expect(saved.yeast.pitchTempC).toBeUndefined();
    expect(saved.yeast.technicalFacts).toEqual(expect.arrayContaining([expect.objectContaining({ origin: 'ai', source: 'Fiche M20 contrôlée' })]));
    const reference = m20Reference();
    expect(resolveYeastDossier(saved.yeast, reference).temperature?.range).toEqual({ min: 18, max: 28 });
    // The refused tolerance proposal never entered the sheet: the catalogue reading is unchanged.
    const typed = (value?: { range: { min: number; max: number }; qualifier: string }) => value && { range: value.range, qualifier: value.qualifier };
    expect(typed(resolveYeastDossier(saved.yeast, reference).alcoholTolerance)).toEqual(typed(resolveYeastDossier({ name: M20 }, reference).alcoholTolerance));
    expect(resolveYeastDossier(saved.yeast, reference).alcoholTolerance?.range.min).not.toBe(11);
    view.unmount();
    wizard(saved);
    allerEtape('Levure');
    const reopenedSheet = screen.getByRole('group', { name: `Fiche de ${M20}` });
    expect(reopenedSheet).toHaveTextContent('Fiche M20 contrôlée');
    expect(within(reopenedSheet).getByRole('group', { name: 'Température de fermentation' }).querySelector('[data-fact-reading]')).toHaveTextContent('18–28 °C');
    expect(screen.getByLabelText('État du choix de levure')).toHaveTextContent('identiques à la recette enregistrée');
    expect(screen.getByLabelText('Quantité de levure, en g')).toHaveValue('12');
  });

  it('ajoute une source concordante sans remplacer la sélection personnelle ni l’hypothèse de recette', () => {
    const retained: YeastTechnicalFact = { key: 'attenuation', reported: '70–75 %', range: { min: 70, max: 75 }, unit: '%',
      qualifier: 'range', origin: 'personal', source: 'Ma sélection de fiche', sourceUrl: 'https://example.com/ma-selection', context: 'beer' };
    const proposed: YeastTechnicalFact = { key: 'attenuation', reported: '70–75 %', range: { min: 70, max: 75 }, unit: '%',
      qualifier: 'range', origin: 'ai', source: 'Fiche M20 atténuation', sourceUrl: 'https://example.com/m20-attenuation', context: 'beer' };
    const current: YeastSpec = { name: M20, hopIndexId: 'yeast-mangrove-jacks-132040951', attenuationPct: 72,
      attenuationBasis: 'recipe', technicalSelections: { attenuation: retained }, technicalFacts: [retained] };
    const incoming = facts({ name: M20, source: proposed.source, sourceUrl: proposed.sourceUrl, technicalFacts: [proposed] }).data;
    const review = reviewYeastFacts(current, incoming, m20Reference());
    expect(review.corroborating.map(item => item.id)).toEqual(['attenuation']);
    const result = applyYeastReview(current, incoming, review, new Set(review.corroborating.map(item => item.id)));
    expect(result.yeast.technicalSelections?.attenuation).toEqual(retained);
    expect(result.yeast.technicalFacts).toEqual(expect.arrayContaining([retained, proposed]));
    expect(result.yeast).toMatchObject({ attenuationPct: 72, attenuationBasis: 'recipe' });
    const reopened = normalizeRecipe({ yeast: JSON.parse(JSON.stringify(result.yeast)) } as Recipe).yeast;
    expect(reopened.technicalSelections?.attenuation).toEqual(retained);
    expect(reopened.technicalFacts).toEqual(expect.arrayContaining([expect.objectContaining({ sourceUrl: proposed.sourceUrl })]));
    expect(reopened).toMatchObject({ attenuationPct: 72, attenuationBasis: 'recipe' });
  });

  it('retient la source concordante de 70–75 % dans la décision, sans moyenne ni milieu', async () => {
    const url = 'https://example.com/m20-attenuation';
    run.mockResolvedValue(facts({ name: M20, source: 'Fiche M20 atténuation', technicalFacts: [
      { key: 'attenuation', reported: '70–75 %', qualifier: 'range', range: { min: 70, max: 75 }, unit: '%', origin: 'ai', source: 'Fiche M20 atténuation', sourceUrl: url }] }));
    const save = vi.fn(), learn = vi.fn();
    const view = wizard(yeastFlowRecipe(), save, learn);
    allerEtape('Levure');
    const trial = tryM20();
    searchSheet(trial);
    const panel = await within(trial).findByRole('region', { name: `Proposition IA pour ${M20}` });
    const corroborating = within(panel).getByRole('region', { name: 'Sources concordantes à conserver' });
    expect(corroborating).toHaveTextContent('70–75 % · plage');
    expect(within(corroborating).getByRole('link', { name: 'Fiche M20 atténuation' })).toHaveAttribute('href', url);
    fireEvent.click(within(panel).getByRole('button', { name: 'Tout valider' }));
    decideGaps(trial, ['Atténuation annoncée']);
    const decision = screen.getByRole('region', { name: 'Décider des changements de l’essai' });
    const summary = within(decision).getByText('Observations et sources modifiées', { selector: 'summary' });
    fireEvent.click(summary);
    const retained = within(summary.closest('details')!).getByRole('list', { name: 'Observations documentaires retenues' });
    expect(retained).toHaveTextContent('Atténuation');
    expect(retained).toHaveTextContent('plage 70–75 %');
    expect(decision).not.toHaveTextContent(/72[,.]5/);
    expect(within(decision).getAllByRole('link').map(link => link.getAttribute('href'))).toContain(url);
    expect(learn).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Unité de la quantité de levure' }), { target: { value: 'g' } });
    fireEvent.change(screen.getByLabelText('Quantité de levure, en g'), { target: { value: '12' } });
    fireEvent.blur(screen.getByLabelText('Quantité de levure, en g'));
    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast.technicalFacts).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'attenuation', qualifier: 'range',
      range: { min: 70, max: 75 }, origin: 'ai', source: 'Fiche M20 atténuation', sourceUrl: url })]));
    expect(saved.yeast.technicalSelections?.attenuation).toBeUndefined();
    expect(resolveYeastDossier(saved.yeast, m20Reference()).documentedAttenuation).toMatchObject({ qualifier: 'range', range: { min: 70, max: 75 } });
    view.unmount();
    wizard(saved);
    allerEtape('Levure');
    expect(screen.getByRole('group', { name: `Fiche de ${M20}` })).toHaveAttribute('data-sheet-scope', 'recipe');
    expect(screen.getByLabelText('État du choix de levure')).toHaveTextContent('identiques à la recette enregistrée');
    expect(screen.getByLabelText('Quantité de levure, en g')).toHaveValue('12');
  });

  it('garde sous M20 sa réponse tardive sans l’appliquer à 3638, puis la périme après une correction manuelle de M20', async () => {
    let resolve!: (value: unknown) => void;
    run.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    const save = vi.fn(), learn = vi.fn();
    wizard(yeastFlowRecipe(), save, learn);
    allerEtape('Levure');
    searchSheet(tryM20());
    tryCandidate('3638', '3638 · Bavarian Wheat');
    await act(async () => resolve(facts({ name: M20, source: 'Fiche tardive M20', alcoholTolerancePct: 14 })));
    const other = openSheet('3638 · Bavarian Wheat');
    expect(within(other).queryByRole('region', { name: /^Proposition IA/ })).not.toBeInTheDocument();
    expect(within(other).getByText(/Essai local · fiche du catalogue/)).toBeInTheDocument();
    expect(other).not.toHaveTextContent('Fiche tardive M20');
    // Back to M20: its answer is still valid for its unchanged sheet and stays consultable there.
    tryCandidate('M20', M20);
    const back = screen.getByRole('group', { name: `Fiche de ${M20}` });
    expect(back).toHaveAttribute('open');
    expect(within(back).getByRole('region', { name: `Proposition IA pour ${M20}` })).toHaveTextContent('Fiche tardive M20');
    // A manual correction of M20's sheet makes that proposal stale; nothing from it is retained.
    fireEvent.click(within(back).getByRole('button', { name: 'Corriger Tolérance à l’alcool' }));
    const tolerance = within(back).getByRole('group', { name: 'Tolérance à l’alcool' });
    fireEvent.change(within(tolerance).getByLabelText('Type de valeur · Tolérance à l’alcool'), { target: { value: 'reportedPoint' } });
    fireEvent.change(within(tolerance).getByLabelText('Tolérance à l’alcool · valeur'), { target: { value: '9' } });
    fireEvent.blur(within(tolerance).getByLabelText('Tolérance à l’alcool · valeur'));
    fireEvent.click(within(tolerance).getByRole('button', { name: 'Retenir' }));
    expect(within(back).queryByRole('region', { name: `Proposition IA pour ${M20}` })).not.toBeInTheDocument();
    expect(within(back).getByText(/proposition périmée, rien n’a été retenu/)).toBeInTheDocument();
    expect(within(back).getByRole('group', { name: 'Tolérance à l’alcool' }).querySelector('[data-fact-reading]')).toHaveTextContent('9 % vol · valeur ponctuelle');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler l’essai' }));
    expect(screen.getByRole('group', { name: 'Fiche de Wyeast 3068' })).toBeInTheDocument();
    expect(screen.getByLabelText('Quantité de levure, en mL')).toHaveValue('125');
    expect(learn).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('garde l’hypothèse d’atténuation dans la conduite, hors de la fiche du candidat, et retire l’hypothèse en revenant à la fiche', () => {
    const save = vi.fn();
    wizard(yeastFlowRecipe(), save);
    allerEtape('Levure');
    const trial = tryM20();
    expect(within(trial).queryByLabelText('Atténuation retenue pour cette recette, en pourcent')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Hypothèses et réglages complémentaires', { selector: 'summary' }));
    const scenario = screen.getByLabelText('Atténuation retenue pour le scénario');
    fireEvent.change(scenario, { target: { value: '80' } }); fireEvent.blur(scenario);
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser la plage de la fiche' }));
    expect(scenario).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'g' } });
    fireEvent.change(screen.getByLabelText('Quantité de levure, en g'), { target: { value: '12' } });
    fireEvent.blur(screen.getByLabelText('Quantité de levure, en g'));
    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect((save.mock.calls[0][0] as Recipe).yeast.attenuationPct).toBeUndefined();
    expect((save.mock.calls[0][0] as Recipe).yeast.attenuationBasis).toBe('declared');
  });

  it('affiche la forme effectivement retenue quand la revue IA corrige le conditionnement', async () => {
    run.mockResolvedValue(facts({ name: M20, source: 'Fiche du produit vérifiée', form: 'liquide' }));
    const save = vi.fn(), learn = vi.fn();
    wizard(yeastFlowRecipe(), save, learn);
    allerEtape('Levure');
    const trial = tryM20();
    searchSheet(trial);
    await within(trial).findByRole('region', { name: `Proposition IA pour ${M20}` });
    decideGaps(trial, ['Forme']);
    const trialStatus = document.querySelector('.yc-trial-status')!;
    expect(trialStatus).toBeVisible();
    expect(trialStatus).toHaveTextContent('liquide');
    expect(trialStatus).toHaveTextContent('brouillon garde Wyeast 3068 jusqu’à « Appliquer au brouillon »');
    expect(screen.getByRole('region', { name: 'Décider des changements de l’essai' })).not.toHaveTextContent('Masse sèche prévue');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const chosenDraft = screen.getByRole('region', { name: 'Levure de la recette' });
    expect(chosenDraft).toHaveTextContent(M20);
    expect(within(chosenDraft).getByRole('button', { name: 'Annuler le changement' })).toBeVisible();
    const planned = screen.getByRole('group', { name: 'Quantité prévue de levure' });
    expect(planned).toHaveAttribute('data-yeast-quantity', 'missing');
    expect(within(planned).getByRole('textbox', { name: 'Quantité de levure' })).toHaveValue('');
    expect(screen.getByLabelText('Forme de la levure')).toHaveValue('liquide');
    expect(learn).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
  });

  it('ne remplace pas l’hypothèse de recette par une valeur annoncée sourcée retenue dans la fiche', async () => {
    run.mockResolvedValue(facts({ name: M20, source: 'Atténuation M20 contrôlée', attenuationPct: 75 }));
    const save = vi.fn();
    wizard(yeastFlowRecipe(), save);
    allerEtape('Levure');
    const trial = tryM20();
    fireEvent.click(screen.getByText('Hypothèses et réglages complémentaires', { selector: 'summary' }));
    const scenario = screen.getByLabelText('Atténuation retenue pour le scénario');
    fireEvent.change(scenario, { target: { value: '70' } }); fireEvent.blur(scenario);
    searchSheet(trial);
    const panel = await within(trial).findByRole('region', { name: `Proposition IA pour ${M20}` });
    const independent = within(panel).queryByRole('button', { name: /^(Tout valider|Valider les données sans conflit)$/ });
    if (independent) fireEvent.click(independent);
    decideGaps(trial, ['Atténuation annoncée']);
    expect(screen.getByLabelText('Atténuation retenue pour le scénario')).toHaveValue('70');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    fireEvent.change(screen.getByLabelText('Unité de la quantité de levure'), { target: { value: 'g' } });
    fireEvent.change(screen.getByLabelText('Quantité de levure, en g'), { target: { value: '12' } });
    fireEvent.blur(screen.getByLabelText('Quantité de levure, en g'));
    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast).toMatchObject({ attenuationPct: 70, attenuationBasis: 'recipe' });
    const dossier = resolveYeastDossier(saved.yeast, m20Reference());
    expect(dossier.attenuation).toMatchObject({ basis: 'recipe', range: { min: 70, max: 70 } });
    expect(dossier.documentedAttenuation).toMatchObject({ qualifier: 'reportedPoint', range: { min: 75, max: 75 } });
  });

  it('présente la fiche de la levure visée sans mélanger brouillon et essai', () => {
    const save = vi.fn();
    render(<BrewWizard seed={{ recipe: yeastFlowRecipe() }} config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()}
      onSave={save} onLearnIngredient={vi.fn()} onCreateStockItem={vi.fn()} onSaveWaterSource={vi.fn()} />);
    allerEtape('Levure');
    const current = openSheet('Wyeast 3068');
    expect(within(current).getByRole('button', { name: 'Rechercher la fiche avec l’IA' })).toBeVisible();
    expect(within(current).getByText(/Portée : ce brouillon de recette/)).toBeInTheDocument();
    tryCandidate('M20', M20);
    const reference = screen.getByRole('group', { name: 'Fiche de Wyeast 3068' });
    expect(reference).toHaveAttribute('data-sheet-scope', 'recipe');
    expect(within(reference).getByText(/Référence du brouillon · distincte de la fiche en essai/)).toBeInTheDocument();
    expect(within(reference).getByRole('button', { name: 'Rechercher la fiche avec l’IA' })).toBeVisible();
    const trial = openSheet(M20);
    expect(trial).toHaveAttribute('data-sheet-scope', 'candidate');
    expect(within(trial).getByRole('button', { name: 'Rechercher la fiche avec l’IA' })).toBeVisible();
    expect(trial.querySelector('summary [data-sheet-scope-note]')).toHaveTextContent('Essai local · fiche du catalogue · recette, stock et autres candidats inchangés');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(screen.getByRole('group', { name: `Fiche de ${M20}` })).toHaveAttribute('data-sheet-scope', 'recipe');
    expect(run).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
  });

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
      ? { name: yeast.name, lab: 'Laboratoire témoin', attenuationPct: 77, tempMinC: 17, tempMaxC: 24, technicalFacts: [{ key: 'fermentationTime',
        reported: '14 jours', qualifier: 'reportedPoint', range: { min: 14, max: 14 }, unit: 'jours', origin: 'ai', source: 'Fiche fabricant de contrôle' }] }
      : context.kind === 'houblon' ? { name: context.name, alphaPct: 12 } : { name: malt.name })));
    const save = vi.fn(), learn = vi.fn();
    render(<BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={() => {}}
      onSave={save} onLearnIngredient={learn} onCreateStockItem={vi.fn()} onSaveWaterSource={() => {}} />);
    allerEtape('Levure');
    const sheet = openSheet(yeast.name);
    fireEvent.click(within(sheet).getByRole('button', { name: 'Rechercher la fiche avec l’IA' }));
    const panel = await within(sheet).findByRole('region', { name: `Proposition IA pour ${yeast.name}` });
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0].context).toMatchObject({ kind: 'levure', name: yeast.name });
    expect(learn).not.toHaveBeenCalled();
    fireEvent.click(within(panel).getByRole('button', { name: 'Tout valider' }));
    expect(learn).not.toHaveBeenCalled();
    allerEtape('Récapitulatif');
    search();
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(run).toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.yeast).toMatchObject({ ...yeast, attenuationPct: 77, fermTempMinC: 17, fermTempMaxC: 24, fermentDays: 14 });
    expect(saved.fermentables?.[0]).toMatchObject({ ...malt, colorEbc: 6, potentialPpg: 38 });
    expect(saved.hops.map(h => h.alpha)).toEqual([12, 7.2]);
    // La durée de fiche (14 j) reste un repère : le palier primaire de 10 j est inchangé.
    expect(saved.fermentation).toEqual(recipe.fermentation);
  });
});
