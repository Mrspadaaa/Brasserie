import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { brewSystemInsights, measuredWortYield } from '../../src/domain/brewSystemInsights';
import type { Batch, BrewDayState, RecipeSnapshot } from '../../src/types';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
const MIN = 60_000;
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); vi.clearAllMocks(); });

function mount(over: Partial<BrewDayState> = {}) {
  const recipe: RecipeSnapshot = fixtureRecipe();
  const state: BrewDayState = {
    currentIndex: 0,
    steps: [{ id: 'preboil', label: 'Moût avant ébullition', durationMin: 0 }, { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }],
    readings: [], additions: { 'grain-0': { amount: 5, doneAt: 0 } }, ...over,
  };
  const batch: Batch = { id: 'LOT-navigation', name: 'Pale de navigation', style: 'Pale', volumeL: 20,
    brewDate: '2026-09-20', status: 'planifie', recipeSnapshot: recipe, brewDay: state };
  const save = vi.fn();
  render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={save} onFinish={vi.fn()} />);
  return { recipe, original: state, save, latest: () => save.mock.calls.at(-1)?.[0].brewDay as BrewDayState };
}
const form = () => within(screen.getByRole('region', { name: 'Mesures de cette étape' }));

describe('navigation depuis le retour système vers les vrais gestes du brassin', () => {
  it('Compléter les mesures ouvre le couple pré-ébullition et enregistre un relevé exploitable', () => {
    const view = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Compléter les mesures' }));
    expect(screen.getByLabelText('Moment du couple volume et densité')).toHaveValue('preboil');
    expect(screen.getByLabelText('Volume du même moût en litres')).toHaveValue('');
    expect(screen.getByLabelText('Densité du même moût')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('Volume du même moût en litres'), { target: { value: '26,8' } });
    fireEvent.change(screen.getByLabelText('Densité du même moût'), { target: { value: '1,042' } });
    fireEvent.change(screen.getByLabelText('Référence de température du volume'), { target: { value: 'cold' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Densité refroidie ou corrigée/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Noter volume et densité' }));
    const readings = view.latest().readings!;
    expect(readings).toHaveLength(2);
    expect(readings[0].pairId).toBe(readings[1].pairId);
    expect(readings.every(reading => reading.stepId === 'preboil' && reading.measurementStage === 'preboil')).toBe(true);
    expect(measuredWortYield(view.recipe, view.latest(), 'preboil').value).not.toBeNull();
    expect(view.original.readings).toEqual([]);
  });

  it('un couple déjà relevé dirige vers les ajouts et une heure réelle corrigée débloque le rendement', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    const now = new Date('2026-09-20T12:00').getTime();
    const measuredAt = new Date('2026-09-20T11:00').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const view = mount({
      currentIndex: 1,
      steps: [
        { id: 'mash-0', label: 'Saccharification', tempC: 67, durationMin: 60 },
        { id: 'preboil', label: 'Moût avant ébullition', durationMin: 0 },
        { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 },
      ],
      additions: {},
      readings: [
        { id: 'volume-recorded', pairId: 'same-wort', at: measuredAt, stepId: 'preboil', measurementStage: 'preboil', kind: 'volume', value: 25, unit: 'L', volumeBasis: 'cold', roomTemp: true },
        { id: 'density-recorded', pairId: 'same-wort', at: measuredAt, stepId: 'preboil', measurementStage: 'preboil', kind: 'densite', value: 1.04, unit: 'SG', roomTemp: true },
      ],
    });
    const feedback = within(screen.getByRole('region', { name: 'Ce brassin · mon installation' }));
    expect(feedback.getByText('Confirme les quantités réellement ajoutées : Pale.', { selector: 'p' })).toBeVisible();
    expect(feedback.queryByRole('button', { name: 'Compléter les mesures' })).not.toBeInTheDocument();
    fireEvent.click(feedback.getByRole('button', { name: 'Vérifier les ajouts réels' }));

    expect(within(screen.getByRole('region', { name: 'Étape consultée' })).getByRole('heading', { name: 'Saccharification' })).toBeVisible();
    const additions = within(screen.getByRole('region', { name: 'Ingrédients à ajouter' }));
    expect(additions.getByRole('checkbox', { name: 'Ajouté : Pale' })).not.toBeChecked();
    expect(additions.getByRole('button', { name: 'Modifier la quantité de Pale' })).toHaveTextContent('5 kg');
    expect(screen.queryByLabelText('Volume du même moût en litres')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Densité du même moût')).not.toBeInTheDocument();
    expect(view.latest().currentIndex).toBe(0);
    expect(view.latest().readings).toEqual(view.original.readings);
    expect(view.latest().additions).toEqual({});
    await waitFor(() => expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' }));

    fireEvent.click(additions.getByRole('button', { name: 'Modifier la quantité de Pale' }));
    const time = () => screen.getByLabelText('Date et heure réelles d’ajout de Pale');
    const confirmTime = () => screen.getByRole('button', { name: 'Consigner à cette heure' });
    expect(time()).toHaveValue('');
    expect(confirmTime()).toBeDisabled();
    fireEvent.change(time(), { target: { value: '2026-09-20T13:00' } });
    expect(time()).toHaveAttribute('aria-invalid', 'true');
    expect(confirmTime()).toBeDisabled();
    expect(view.latest().additions).toEqual({});

    fireEvent.click(additions.getByRole('checkbox', { name: 'Ajouté : Pale' }));
    expect(time()).toHaveValue('2026-09-20T12:00');
    expect(view.latest().additions?.['grain-0'].doneAt).toBe(now);
    expect(measuredWortYield(view.recipe, view.latest(), 'preboil')).toMatchObject({ value: null, missingIngredients: true });
    expect(measuredWortYield(view.recipe, view.latest(), 'preboil').reason).toContain('consignés après le relevé');
    fireEvent.change(time(), { target: { value: '2026-09-20T08:30' } });
    expect(view.latest().additions?.['grain-0'].doneAt).toBe(now);
    fireEvent.click(confirmTime());
    expect(view.latest().additions?.['grain-0']).toMatchObject({ amount: 5, doneAt: new Date('2026-09-20T08:30').getTime() });
    expect(view.latest().readings).toEqual(view.original.readings);

    fireEvent.click(screen.getByRole('button', { name: 'Choisir une étape' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Choisir une étape' })).getByRole('button', { name: 'Moût avant ébullition', exact: true }));
    expect(within(screen.getByRole('row', { name: /Rendement avant ébullition/ })).getAllByRole('cell')[1]).toHaveTextContent('66,6');
    expect(screen.queryByRole('button', { name: 'Vérifier les ajouts réels' })).not.toBeInTheDocument();
    expect(view.original.additions).toEqual({});
  });

  it('consigner une eau à une heure choisie conserve le zéro réel et la référence froide', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-09-20T12:00').getTime());
    const view = mount({ additions: {}, steps: [{ id: 'eau', label: 'Préparation des eaux', durationMin: 0 }, { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }] });
    fireEvent.click(screen.getByRole('button', { name: 'Modifier la quantité de Eau d’empâtage au mash' }));
    fireEvent.change(screen.getByLabelText('Quantité réelle de Eau d’empâtage au mash'), { target: { value: '0' } });
    const time = screen.getByLabelText('Date et heure réelles d’ajout de Eau d’empâtage');
    expect(time).toHaveValue('');
    fireEvent.change(time, { target: { value: '2026-09-20T08:00' } });
    expect(view.latest().additions?.['water-mash'].doneAt).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Consigner à cette heure' }));
    expect(view.latest().additions?.['water-mash']).toEqual({ amount: 0, doneAt: new Date('2026-09-20T08:00').getTime(), volumeBasis: 'cold' });
    expect(screen.getByRole('checkbox', { name: 'Ajouté : Eau d’empâtage' })).toBeChecked();
  });

  it('décocher la référence froide dans une correction seule rend le couple inadmissible sans perdre son identité', () => {
    const view = mount({ readings: [
      { id: 'volume-old', pairId: 'pair-old', at: 10 * MIN, stepId: 'preboil', measurementStage: 'preboil', kind: 'volume', value: 26, unit: 'L', volumeBasis: 'cold', roomTemp: true, temperatureC: 20, note: 'Graduation vérifiée' },
      { id: 'density-old', pairId: 'pair-old', at: 10 * MIN, stepId: 'preboil', measurementStage: 'preboil', kind: 'densite', value: 1.04, unit: 'SG', roomTemp: true },
    ] });
    expect(measuredWortYield(view.recipe, view.original, 'preboil').value).not.toBeNull();
    fireEvent.click(form().getByRole('button', { name: 'Volume', exact: true }));
    fireEvent.click(form().getByRole('button', { name: 'Corriger le relevé' }));
    const reference = form().getByRole('checkbox', { name: 'Volume ramené à 20 °C' });
    expect(reference).toBeChecked(); fireEvent.click(reference);
    fireEvent.click(form().getByRole('button', { name: 'Corriger', exact: true }));
    const corrected = view.latest().readings!.find(reading => reading.id === 'volume-old')!;
    expect(corrected).toMatchObject({ id: 'volume-old', pairId: 'pair-old', at: 10 * MIN, value: 26, roomTemp: false, note: 'Graduation vérifiée' });
    expect(corrected.volumeBasis).toBeUndefined();
    expect(corrected.temperatureC).toBeUndefined();
    expect(measuredWortYield(view.recipe, view.latest(), 'preboil').value).toBeNull();
  });

  it('le bouton de maintien ferme la montée et les relevés suivants ne réduisent pas la vitesse de chauffe observée', () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(40 * MIN);
    const view = mount({
      steps: [{ id: 'mash-1', label: 'Mash-out', tempC: 75, durationMin: 10, rampStartedAt: 0 }, { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }],
      thermalSegments: [{ id: 'heating', stepId: 'mash-1', method: 'heating', targetC: 75, volumeL: 25, startedAt: 0 }],
      readings: [
        { id: 'temp-start', stepId: 'mash-1', kind: 'temperature', unit: '°C', value: 67, at: 0, thermalSegmentId: 'heating', medium: 'wort' },
        { id: 'temp-arrival', stepId: 'mash-1', kind: 'temperature', unit: '°C', value: 75, at: 40 * MIN, thermalSegmentId: 'heating', medium: 'wort' },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer le maintien' }));
    expect(view.latest().steps[0].holdStartedAt).toBe(40 * MIN);
    expect(view.latest().thermalSegments![0].endedAt).toBe(40 * MIN);
    clock.mockReturnValue(50 * MIN);
    fireEvent.click(screen.getByRole('button', { name: 'Relever le moût' }));
    fireEvent.change(form().getByLabelText('Température (°C)'), { target: { value: '75' } });
    fireEvent.click(form().getByRole('button', { name: 'Noter', exact: true }));
    const last = view.latest().readings!.at(-1)!;
    expect(last.at).toBe(50 * MIN);
    expect(last.thermalSegmentId).toBeUndefined();
    expect(brewSystemInsights(view.recipe, view.latest()).metrics.find(metric => metric.id === 'heating')!.value).toBeCloseTo(0.2);
  });
});
