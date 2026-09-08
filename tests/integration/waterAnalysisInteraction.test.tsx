import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SaltSolver, type WaterState } from '../../src/ui/SaltSolver';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import * as saltSolver from '../../src/domain/water/solve';
import * as dilution from '../../src/domain/water/dilution';
import { computeWaterAnalysis } from '../../src/ui/water/computeWaterAnalysis';
import type { WaterAnalysisRequest, WaterAnalysisResponse } from '../../src/ui/water/waterAnalysisProtocol';

// Real domain arithmetic and real controls, but analysis completion is under
// test control: a slow worker must never prevent the brewer changing a dose.
class HeldWorker {
  static instances: HeldWorker[] = [];
  onmessage: ((event: MessageEvent<WaterAnalysisResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;
  requests: WaterAnalysisRequest[] = [];
  postMessage = vi.fn((request: WaterAnalysisRequest) => this.requests.push(request));
  terminate = vi.fn();

  constructor() { HeldWorker.instances.push(this); }

  answer(request: WaterAnalysisRequest) {
    const result = computeWaterAnalysis(request.input);
    act(() => this.onmessage?.({ data: { kind: 'result', id: request.id, key: request.key, result } } as MessageEvent<WaterAnalysisResponse>));
  }
}

const grains = [{ name: 'Pilsner Malz', kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }];
let retained: WaterState;
function Host() {
  const [state, setState] = useState<WaterState>({
    styleCode: '20C', diRatioPct: 20, spargeDiRatioPct: 20,
    mashWaterL: 10.8, spargeWaterL: 21.5, allSaltsInMash: true,
    doses: { gypse: 2.6, cacl2: 2.1, nacl: .5, kcl: 3 }, disabled: [],
    acidId: 'lactique', acidOverride: { mash: 0, sparge: 6.2 },
  });
  retained = state;
  return <SaltSolver state={state} onChange={setState} source={DEFAULT_WATER_SOURCE}
    onSourceChange={() => {}} beerEbc={3.6} beerVolumeL={24} noSparge={false}
    onNoSpargeChange={() => {}}
    brew={{ style: 'Imperial stout', totalGristKg: 2.2, grist: grains, targetPh: 5.4 }} />;
}

const sparge = () => screen.getByRole('textbox', { name: /Dose d’acide lactique.*au rinçage/ });
const osmosis = () => screen.getByRole('button', { name: /Juste ce qu’il faut d’osmosée/ });
const profile = () => screen.getByLabelText('Bilan des objectifs de l’eau');
const ppm = (label: string) => Number(screen.getByLabelText(label).textContent!.match(/([\d,]+) ppm/)![1].replace(',', '.'));
function checkSparge(amount: number) {
  expect(retained.acidOverride).toEqual({ mash: 0, sparge: amount });
  expect(sparge()).toHaveValue(String(amount).replace('.', ','));
  expect(screen.getByRole('textbox', { name: /Dose d’acide lactique.*à l’empâtage/ })).toHaveValue('0');
  const expectedSparge = Math.max(0, 200 - amount * 600 / 21.5);
  expect(Math.abs(ppm('HCO₃ après acide — rinçage') - expectedSparge)).toBeLessThan(.06);
  const expectedTotal = (ppm('HCO₃ après acide — empâtage') * 10.8 + expectedSparge * 21.5) / 32.3;
  expect(Math.abs(ppm('HCO₃ après acide — moyenne du graphique') - expectedTotal)).toBeLessThan(.11);
}

beforeEach(() => {
  HeldWorker.instances = [];
  vi.stubGlobal('Worker', HeldWorker);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Manual water input while background advice is still running', () => {
  it('updates both acid balances immediately and Doser uses the latest dose before any worker answer', () => {
    const solve = vi.spyOn(saltSolver, 'solveSalts');
    const search = vi.spyOn(dilution, 'minimalDilution');
    render(<Host />);
    const worker = HeldWorker.instances[0];
    const oldRequest = worker.requests[0];
    expect(oldRequest.input.dilution.acidOverride?.sparge).toBe(6.2);
    expect(osmosis()).toBeDisabled();
    expect(solve).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();

    fireEvent.change(sparge(), { target: { value: '5,2' } });
    checkSparge(5.2);
    expect(osmosis()).toBeDisabled();
    expect(osmosis()).toHaveTextContent('Calcul…');
    expect(solve).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
    expect(worker.requests).toHaveLength(1); // Coalesced behind the old running job.

    fireEvent.click(screen.getByRole('button', { name: 'Proposer les doses' }));
    expect(solve).toHaveBeenCalledTimes(1);
    expect(solve.mock.calls[0][0].spargeHco3AfterAcid).toBeCloseTo(200 - 5.2 * 600 / 21.5, 8);
    expect(search).not.toHaveBeenCalled();
    checkSparge(5.2);
    expect(profile()).toHaveTextContent('Profil atteint : 6/6');
    const weighed = structuredClone(retained.doses);

    worker.answer(oldRequest);
    expect(osmosis()).toBeDisabled();
    expect(osmosis()).toHaveTextContent('Calcul…');
    expect(worker.requests).toHaveLength(2);
    expect(worker.requests[1].input.dilution.acidOverride?.sparge).toBe(5.2);
    checkSparge(5.2);
    expect(retained.doses).toEqual(weighed);
    expect(profile()).toHaveTextContent('Profil atteint : 6/6');

    worker.answer(worker.requests[1]);
    expect(osmosis()).not.toHaveTextContent('Calcul…');
    expect(retained.doses).toEqual(weighed);
    checkSparge(5.2);
  });

  it('removes a previously usable osmosis suggestion as soon as the manual acid changes', () => {
    render(<Host />);
    const worker = HeldWorker.instances[0];
    worker.answer(worker.requests[0]);
    expect(osmosis()).toBeEnabled();
    expect(osmosis()).not.toHaveTextContent('Calcul…');

    fireEvent.change(sparge(), { target: { value: '5,2' } });
    checkSparge(5.2);
    expect(osmosis()).toBeDisabled();
    expect(osmosis()).toHaveTextContent('Calcul…');
    fireEvent.click(osmosis());
    expect(retained.diRatioPct).toBe(20);
    expect(retained.spargeDiRatioPct).toBe(20);

    // The brewer changes the value again before the previous calculation ends.
    const stale = worker.requests[1];
    fireEvent.change(sparge(), { target: { value: '5,7' } });
    checkSparge(5.7);
    worker.answer(stale);
    expect(osmosis()).toBeDisabled();
    expect(osmosis()).toHaveTextContent('Calcul…');
    expect(retained.diRatioPct).toBe(20);
    expect(worker.requests.at(-1)!.input.dilution.acidOverride?.sparge).toBe(5.7);
  });
});
