import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NoloBrewDayGuide } from '../../src/ui/NoloBrewDayGuide';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { newNoloConfig } from '../../src/domain/nolo';
import { defaultConfig } from '../../src/services/storage';
import { AiClient } from '../../src/services/aiClient';
import { brewerJobs } from '../../src/services/brewerJobs';
import type { Batch, BrewDayState, RecipeSnapshot } from '../../src/types';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); brewerJobs.stop(); vi.clearAllMocks(); });

const recipe = (): RecipeSnapshot => ({
  name: 'Pilote NOLO figé', capturedAt: '2026-09-12', volumeL: 20, ogTarget: 1.018,
  fermentables: [], hops: [], yeast: { name: 'Souche inscrite', qty: 3, unit: 'g', form: 'sèche' },
  nolo: { ...newNoloConfig(), operations: [
    { id: 'water', kind: 'dilution', name: 'Dilution finale', volumeL: 2 },
    { id: 'aroma', kind: 'aroma', name: 'Essence banane', volumeML: 5, carrierAbvPct: null, sugarG: null, composition: '', moment: 'Après fermentation' }
  ], measurements: [{ id: 'lab', stage: 'wort', date: '2026-09-10', method: 'Laboratoire', sg: 1.099 }],
  trials: [{ id: 'trial', name: 'Verre A', product: 'Arôme', composition: 'Support à confirmer', volumeL: .1,
    dosageML: .02, carrierAbvPct: null, moment: 'Après fermentation', tasting: '', comparator: 'Témoin sans ajout' }] }
}) as RecipeSnapshot;
const step = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
const state: BrewDayState = { steps: [step], currentIndex: 0, readings: [] };

describe('Aide NOLO du jour de brassage', () => {
  it('montre la cible et des mesures inconnues puis ouvre la saisie demandée sans écrire au plan', () => {
    const frozen = recipe(), original = JSON.stringify(frozen), onMeasure = vi.fn();
    render(<NoloBrewDayGuide recipe={frozen} state={state} step={step} onMeasure={onMeasure} onNote={vi.fn()} />);
    const guide = screen.getByRole('region', { name: 'NOLO · Fermentation limitée' });
    expect(within(guide).getByText('0,5 % vol.')).toBeInTheDocument();
    expect(within(guide).getByRole('button', { name: 'Relever Densité pour le suivi NOLO' })).toHaveTextContent('SG—');
    fireEvent.click(within(guide).getByRole('button', { name: 'Relever Densité pour le suivi NOLO' }));
    expect(onMeasure).toHaveBeenCalledWith('densite');
    expect(JSON.stringify(frozen)).toBe(original);
    expect(screen.queryByText('1,099 SG')).not.toBeInTheDocument();
  });

  it('garde les opérations dépliables et ouvre seulement un brouillon de note', () => {
    const frozen = recipe(), onNote = vi.fn();
    render(<NoloBrewDayGuide recipe={frozen} state={state} step={step} onMeasure={vi.fn()} onNote={onNote} />);
    const summary = screen.getByText('Plan NOLO figé').closest('summary')!;
    expect(summary.parentElement).not.toHaveAttribute('open');
    fireEvent.click(summary);
    expect(summary.parentElement).toHaveAttribute('open');
    expect(screen.getByText(/Support : Non renseigné\. Sucres : Non renseigné\. Après fermentation/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Noter la réalisation de Dilution finale' }));
    expect(onNote).toHaveBeenCalledWith('Dilution finale');
    fireEvent.click(screen.getByRole('button', { name: 'Noter l’essai Verre A' }));
    expect(onNote).toHaveBeenLastCalledWith('Essai Verre A');
    expect(frozen.nolo!.operations[0]).toEqual({ id: 'water', kind: 'dilution', name: 'Dilution finale', volumeL: 2 });
    fireEvent.click(summary);
    expect(summary.parentElement).not.toHaveAttribute('open');
  });

  it('l’aperçu de la recette n’expose aucune commande de mesure ou d’ajout', () => {
    render(<NoloBrewDayGuide recipe={recipe()} state={state} step={step} overview onMeasure={vi.fn()} onNote={vi.fn()} />);
    fireEvent.click(screen.getByText('Plan NOLO figé').closest('summary')!);
    expect(screen.queryByRole('button', { name: /Relever|Noter/ })).not.toBeInTheDocument();
    expect(screen.getByText('Témoin sans ajout · Après fermentation · support Non renseigné')).toBeInTheDocument();
  });

  it('les étapes déjà enregistrées survivent à l’ouverture du guide d’extraction à froid', () => {
    const frozen = recipe(); frozen.nolo!.process = 'coldExtraction';
    const oldStep = { id: 'mash-0', label: 'Palier historique conservé', durationMin: 55, tempC: 67, startedAt: 1000, doneAt: 2000 };
    const batch = { id: 'LOT-NOLO', name: 'Brassin NOLO', recipeSnapshot: frozen,
      brewDay: { steps: [oldStep, step], currentIndex: 0, readings: [{ at: 1500, stepId: 'mash-0', kind: 'ph', value: 5.4, unit: '', roomTemp: true }] }
    } as unknown as Batch;
    const before = JSON.stringify(batch), save = vi.fn();
    render(<BrewDayPage batch={batch} config={defaultConfig} onSave={save} onClose={vi.fn()} onFinish={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Palier historique conservé' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'NOLO · Extraction à froid' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Plan NOLO figé').closest('summary')!);
    expect(JSON.stringify(batch)).toBe(before);
    expect(save).not.toHaveBeenCalled();
  });

  it('l’exécution froide ne propose ni eau chaude, ni rinçage, ni correction issue du plan chaud', () => {
    const frozen = recipe(); frozen.nolo!.process = 'coldExtraction';
    frozen.mash = { ratioLPerKg: 3, spargeTempC: 76, steps: [{ name: 'Chaud', tempC: 67, durationMin: 60 }] };
    frozen.waterPlan = { mashWaterL: 6, spargeWaterL: 14, mash: {}, sparge: {}, acid: { id: 'lactique', mash: 2, sparge: 5 } };
    const batch = { id: 'LOT-NOLO', name: 'Brassin NOLO', recipeSnapshot: frozen } as unknown as Batch;
    render(<BrewDayPage batch={batch} config={defaultConfig} onSave={vi.fn()} onClose={vi.fn()} onFinish={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Eau d’extraction à froid' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Ajuster la coupe d’eau' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Rinçage · 76/)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Ajouté : Acide lactique 80 %' })).not.toBeInTheDocument();
    expect(screen.queryByText('Eau de rinçage')).not.toBeInTheDocument();
  });

  it.each(['coldExtraction', 'secondRunnings'] as const)('l’ajout de grains à %s respecte le moût neuf ou les drêches', async process => {
    const frozen = recipe(); frozen.nolo!.process = process;
    frozen.fermentables = [{ name: 'Grain du pilote', kind: 'grain', use: 'empatage', weightKg: 4, potentialPpg: 37 }];
    const extraction = { id: process === 'coldExtraction' ? 'nolo-extraction' : 'nolo-second-runnings', label: 'Extraction', durationMin: 0 };
    const batch = { id: 'LOT-NOLO', name: 'Brassin NOLO', recipeSnapshot: frozen,
      brewDay: { steps: [extraction], currentIndex: 0, readings: [] } } as unknown as Batch;
    const before = JSON.stringify(frozen), save = vi.fn();
    render(<BrewDayPage batch={batch} config={defaultConfig} onSave={save} onClose={vi.fn()} onFinish={vi.fn()} />);
    if (process === 'coldExtraction') {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Ajouté : Grain du pilote', exact: true }));
      await waitFor(() => expect(save.mock.calls.at(-1)?.[0]?.brewDay?.additions?.['grain-0']).toMatchObject({ amount: 4, doneAt: expect.any(Number) }));
      expect(screen.getByRole('checkbox', { name: 'Ajouté : Grain du pilote', exact: true })).toBeChecked();
    } else {
      expect(screen.queryByRole('checkbox', { name: 'Ajouté : Grain du pilote', exact: true })).not.toBeInTheDocument();
      expect(save).not.toHaveBeenCalled();
    }
    expect(JSON.stringify(frozen)).toBe(before);
  });

  it('ouvrir un relevé depuis le guide active le bon type dans le formulaire existant', () => {
    const batch = { id: 'LOT-NOLO', name: 'Brassin NOLO', recipeSnapshot: recipe(), brewDay: state } as unknown as Batch;
    render(<BrewDayPage batch={batch} config={defaultConfig} onSave={vi.fn()} onClose={vi.fn()} onFinish={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Relever Volume pour le suivi NOLO' }));
    expect(within(screen.getByRole('group', { name: 'Type de mesure' })).getByRole('button', { name: 'Volume' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('la lecture compacte conserve un retour de pH qui demande une action', () => {
    const mash = { id: 'mash-0', label: 'Empâtage', durationMin: 45, tempC: 67 };
    const batch = { id: 'LOT-NOLO', name: 'Brassin NOLO', recipeSnapshot: recipe(),
      brewDay: { steps: [mash], currentIndex: 0, readings: [{ at: 10, stepId: mash.id, kind: 'ph', value: 5.8, unit: '', roomTemp: true }] }
    } as unknown as Batch;
    render(<BrewDayPage batch={batch} config={defaultConfig} onSave={vi.fn()} onClose={vi.fn()} onFinish={vi.fn()} />);
    expect(within(screen.getByRole('region', { name: 'Relevés de cette étape' })).getByText('Au-dessus de la fenêtre de pH')).toBeInTheDocument();
  });

  it('le conseil NOLO reçoit la recette figée, jamais les grains remis à zéro pour conduire la seconde extraction', async () => {
    const frozen = recipe(); frozen.nolo!.process = 'secondRunnings';
    frozen.fermentables = [{ name: 'Drêches d’origine', kind: 'grain', use: 'empatage', weightKg: 4, potentialPpg: 37 }];
    const batch = { id: 'LOT-NOLO', name: 'Brassin NOLO', recipeSnapshot: frozen, brewDay: state } as unknown as Batch;
    vi.mocked(AiClient.run).mockResolvedValue({ ok: true, data: { verdict: 'Observation test locale.' } });
    render(<BrewDayPage batch={batch} config={defaultConfig} onSave={vi.fn()} onClose={vi.fn()} onFinish={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une note', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Conseil IA' }));
    await waitFor(() => expect(AiClient.run).toHaveBeenCalledTimes(1));
    const context = vi.mocked(AiClient.run).mock.calls[0][0].context as { recipe: RecipeSnapshot; ingredients: { name: string }[] };
    expect(context.recipe).toEqual(frozen);
    expect(context.recipe.fermentables[0].weightKg).toBe(4);
    expect(context.ingredients.some(item => item.name === 'Drêches d’origine')).toBe(false);
    await screen.findByText('Observation test locale.');
  });
});
