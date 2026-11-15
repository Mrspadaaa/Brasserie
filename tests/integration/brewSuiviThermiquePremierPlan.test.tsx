import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrewThermalControl } from '../../src/ui/BrewThermalControl';
import type { BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

const T0 = 1_700_000_000_000;
afterEach(cleanup);
const montre = (rampMs: number) => {
  const step: BrewDayStep = { id: 'mash-1', label: 'Saccharification', durationMin: 60, tempC: 67, startedAt: T0, rampStartedAt: T0, holdStartedAt: T0 + rampMs };
  const state = { steps: [step], currentIndex: 0, readings: [] } as unknown as BrewDayState;
  render(<BrewThermalControl recipe={{} as RecipeSnapshot} state={state} step={step} now={T0 + rampMs + 60000} update={() => {}} onMeasure={() => {}} />);
};

describe('Suivi thermique : rien d’inutile au premier plan (VB-1, « montée 0,1 min »)', () => {
  it('une montée de 6 s (0,1 min) ne s’affiche pas : durée absurde', () => {
    montre(6000);
    expect(screen.queryByText('Montée')).toBeNull();
    expect(screen.queryByText(/0,1 min/)).toBeNull();
  });
  it('une vraie montée (22 min) reste dite', () => {
    montre(22 * 60000);
    expect(screen.getByText('Montée')).toBeInTheDocument();
    expect(screen.getByText('22 min')).toBeInTheDocument();
  });
});
