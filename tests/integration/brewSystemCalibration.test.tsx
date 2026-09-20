import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch, BrewhouseProfile } from '../../src/types';
import { BrewSystemCalibration } from '../../src/ui/BrewSystemCalibration';
import { BrewSystemFeedback } from '../../src/ui/BrewSystemFeedback';
import { recipe, brewState } from '../fixtures/brewCompanion';

const rig: BrewhouseProfile = { id: 'rig', name: 'Mon système', volumeL: 20, efficiencyPct: 75,
  boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2 };
function batch(id: string): Batch {
  const r = recipe({ brewhouse: rig });
  return { id, name: `Pale ${id}`, style: 'Pale', brewDate: '2026-09-20', volumeL: 20, status: 'fermentation', recipeSnapshot: r,
    brewDay: brewState(r, { additions: { 'grain-0': { amount: 5, doneAt: 1 } }, readings: [
      { id: `${id}-v`, pairId: id, at: 100_000, stepId: 'ensemencement', kind: 'volume', unit: 'L', value: 20, volumeBasis: 'cold' },
      { id: `${id}-g`, pairId: id, at: 100_000, stepId: 'ensemencement', kind: 'densite', unit: 'SG', value: 1.05, roomTemp: true },
    ] }) };
}
afterEach(cleanup);
describe('bilan compact et application volontaire', () => {
  it('montre un état vide honnête avec une prochaine mesure accessible', () => {
    const r = recipe(), measure = vi.fn();
    render(<BrewSystemFeedback recipe={r} state={brewState(r)} onMeasure={measure} />);
    expect(screen.getAllByLabelText('Pas encore mesuré')).toHaveLength(6);
    fireEvent.click(screen.getByRole('button', { name: 'Compléter les mesures' }));
    expect(measure).toHaveBeenCalledWith('preboil');
    expect(screen.getByText('0 / 6 résultats')).toBeInTheDocument();
  });
  it('donne un premier résultat et la progression sans modifier le profil', () => {
    const change = vi.fn();
    render(<BrewSystemCalibration profile={rig} batches={[batch('1')]} onChange={change} />);
    expect(screen.getByText('Encore 2 brassins comparables')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Appliquer / })).not.toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });
  it('applique seulement au clic et donne accès aux brassins sources', () => {
    const change = vi.fn(), open = vi.fn();
    render(<BrewSystemCalibration profile={rig} batches={['1', '2', '3'].map(batch)} onChange={change} onOpenBatch={open} />);
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: '1 · Pale 1' })[0]);
    expect(open).toHaveBeenCalledWith('1');
    fireEvent.click(screen.getByRole('button', { name: /^Appliquer Rendement en fermenteur/ }));
    expect(change).toHaveBeenCalledTimes(1);
    const next = change.mock.calls[0][0] as BrewhouseProfile;
    expect(next.efficiencyPct).toBeLessThan(75);
    expect(next.calibrationHistory).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Enregistre les réglages');
  });
  it('signale une mesure corrigée après une calibration sans réécrire la valeur retenue', () => {
    const change = vi.fn(), batches = ['1', '2', '3'].map(batch);
    const view = render(<BrewSystemCalibration profile={rig} batches={batches} onChange={change} />);
    fireEvent.click(screen.getByRole('button', { name: /^Appliquer Rendement en fermenteur/ }));
    const next = change.mock.calls[0][0] as BrewhouseProfile;
    const corrected = structuredClone(batches); corrected[0].brewDay!.readings![0].value = 18;
    view.rerender(<BrewSystemCalibration profile={next} batches={corrected} onChange={change} />);
    expect(screen.getByText('Mesures corrigées : calibration à revoir.')).toBeInTheDocument();
    expect(change).toHaveBeenCalledTimes(1);
  });
});
