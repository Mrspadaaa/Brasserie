import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWortPair } from '../../src/ui/BrewWortPair';
import type { BrewReadingDraft } from '../../src/ui/BrewDayMeasurements';
import type { BrewDayReading, BrewDayState, BrewDayStep } from '../../src/types';

const step: BrewDayStep = { id: 'preboil', label: 'Avant ébullition', durationMin: 0 };
const empty = (): BrewDayState => ({ steps: [step], currentIndex: 0, readings: [] });
function Harness({ initial = empty(), drafts, onUpdate }: { initial?: BrewDayState; drafts?: Map<string, BrewReadingDraft>; onUpdate: (state: BrewDayState) => void }) {
  const [state, setState] = useState(initial);
  return <BrewWortPair step={step} state={state} drafts={drafts} update={change => setState(previous => {
    const next = change(previous); onUpdate(next); return next;
  })} />;
}
const enter = (volume = '24,5', gravity = '1,050') => {
  fireEvent.change(screen.getByLabelText('Volume du même moût en litres'), { target: { value: volume } });
  fireEvent.change(screen.getByLabelText('Densité du même moût'), { target: { value: gravity } });
};
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('couple volume et densité mesuré', () => {
  it('commence vide sans prétendre connaître les températures ou les pertes', () => {
    const update = vi.fn(); render(<Harness onUpdate={update} />);
    expect(screen.getByLabelText('Volume du même moût en litres')).toHaveValue('');
    expect(screen.getByLabelText('Densité du même moût')).toHaveValue('');
    expect(screen.getByLabelText('Référence de température du volume')).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: /Densité refroidie/ })).not.toBeChecked();
    expect(screen.getByLabelText('Moût libre resté après filtration')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Noter volume et densité' })).toBeDisabled();
    expect(update).not.toHaveBeenCalled();
  });
  it('enregistre les décimales françaises dans un couple commun sans température numérique inventée', () => {
    const update = vi.fn(); render(<Harness onUpdate={update} />);
    enter();
    fireEvent.change(screen.getByLabelText('Référence de température du volume'), { target: { value: 'cold' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Densité refroidie/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Noter volume et densité' }));
    const saved = update.mock.calls.at(-1)![0] as BrewDayState;
    expect(saved.readings).toHaveLength(2);
    const [volume, density] = saved.readings!;
    expect(volume).toMatchObject({ value: 24.5, kind: 'volume', volumeBasis: 'cold', measurementStage: 'preboil' });
    expect(density).toMatchObject({ value: 1.05, kind: 'densite', roomTemp: true, measurementStage: 'preboil' });
    expect(volume.pairId).toBeTruthy(); expect(volume.pairId).toBe(density.pairId);
    expect(volume.id).not.toBe(density.id); expect(volume.at).toBe(density.at);
    expect(volume.temperatureC).toBeUndefined();
    expect(screen.getByRole('status')).toHaveTextContent('enregistrés');
    expect(screen.getByLabelText('Volume du même moût en litres')).toHaveValue('');
  });
  it('autorise de consigner une mesure incomplètement documentée sans la déclarer corrigée', () => {
    const update = vi.fn(); render(<Harness onUpdate={update} />); enter();
    fireEvent.click(screen.getByRole('button', { name: 'Noter volume et densité' }));
    const saved = update.mock.calls.at(-1)![0] as BrewDayState;
    expect(saved.readings![0].volumeBasis).toBeUndefined();
    expect(saved.readings![1].roomTemp).toBe(false);
    expect(screen.getByText(/Le rendement attendra/)).toBeInTheDocument();
  });
  it('corrige les valeurs sans changer les identifiants, l’heure ou la provenance existante', () => {
    const readings: BrewDayReading[] = [
      { id: 'v1', pairId: 'p1', at: 1000, stepId: 'preboil', measurementStage: 'preboil', kind: 'volume', value: 24, unit: 'L', volumeBasis: 'cold', roomTemp: true, temperatureC: 20, medium: 'wort', thermalSegmentId: 'segment-1', note: 'Graduation de cuve vérifiée' },
      { id: 'g1', pairId: 'p1', at: 1010, stepId: 'preboil', measurementStage: 'preboil', kind: 'densite', value: 1.05, unit: 'SG', roomTemp: true, temperatureC: 20, note: 'Densimètre étalonné' },
    ];
    const update = vi.fn(); render(<Harness initial={{ ...empty(), readings }} onUpdate={update} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corriger le dernier couple · 24 L' }));
    fireEvent.change(screen.getByLabelText('Volume du même moût en litres'), { target: { value: '23,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Corriger le couple' }));
    const saved = update.mock.calls.at(-1)![0] as BrewDayState;
    expect(saved.readings).toHaveLength(2);
    expect(saved.readings![0]).toMatchObject({ ...readings[0], value: 23.5 });
    expect(saved.readings![1]).toEqual(readings[1]);
    // A deliberate basis correction must remove an incompatible old numeric temperature.
    fireEvent.click(screen.getByRole('button', { name: 'Corriger le dernier couple · 23.5 L' }));
    fireEvent.change(screen.getByLabelText('Référence de température du volume'), { target: { value: 'hot' } });
    fireEvent.click(screen.getByRole('button', { name: 'Corriger le couple' }));
    const changedBasis = update.mock.calls.at(-1)![0] as BrewDayState;
    expect(changedBasis.readings![0]).toMatchObject({ id: 'v1', pairId: 'p1', at: 1000, volumeBasis: 'hot', note: readings[0].note });
    expect(changedBasis.readings![0].temperatureC).toBeUndefined();
  });
  it('préserve un brouillon de mesure à la fermeture sans l’enregistrer comme relevé', () => {
    const drafts = new Map<string, BrewReadingDraft>(), update = vi.fn();
    const view = render(<Harness drafts={drafts} onUpdate={update} />); enter('22,4', '1,04');
    view.unmount(); render(<Harness drafts={drafts} onUpdate={update} />);
    expect(screen.getByLabelText('Volume du même moût en litres')).toHaveValue('22,4');
    expect(screen.getByLabelText('Densité du même moût')).toHaveValue('1,04');
    expect(update).not.toHaveBeenCalled();
  });
  it('ne valide pas un nombre encore partiellement saisi', () => {
    const update = vi.fn(); render(<Harness onUpdate={update} />); enter('24,', '1,050');
    expect(screen.getByRole('button', { name: 'Noter volume et densité' })).toBeDisabled();
    enter('24', '1,');
    expect(screen.getByRole('button', { name: 'Noter volume et densité' })).toBeDisabled();
    expect(update).not.toHaveBeenCalled();
  });
  it('accepte un volume froid avant transfert sans fabriquer une densité', () => {
    const update = vi.fn(); render(<Harness onUpdate={update} />);
    fireEvent.change(screen.getByLabelText('Moment du couple volume et densité'), { target: { value: 'kettle-cold' } });
    fireEvent.change(screen.getByLabelText('Volume du même moût en litres'), { target: { value: '22' } });
    fireEvent.change(screen.getByLabelText('Référence de température du volume'), { target: { value: 'cold' } });
    fireEvent.click(screen.getByRole('button', { name: 'Noter le relevé en cuve' }));
    const saved = update.mock.calls.at(-1)![0] as BrewDayState;
    expect(saved.readings).toHaveLength(1);
    expect(saved.readings![0]).toMatchObject({ kind: 'volume', value: 22, measurementStage: 'kettle-cold', volumeBasis: 'cold' });
  });
  it('distingue un reste de filtration nul confirmé d’un champ vide', () => {
    const update = vi.fn(); render(<Harness onUpdate={update} />);
    const button = screen.getByRole('button', { name: 'Noter la perte mesurée', hidden: true });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Moût libre resté après filtration'), { target: { value: '0' } });
    expect(button).toBeEnabled(); fireEvent.click(button);
    expect((update.mock.calls.at(-1)![0] as BrewDayState).lauterRetainedL).toBe(0);
  });
});
