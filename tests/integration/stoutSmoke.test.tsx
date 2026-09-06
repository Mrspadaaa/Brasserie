import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SaltSolver, WaterState } from '../../src/ui/SaltSolver';
import { ALKALINE_SALTS, SALT_IDS } from '../../src/domain/water';
import { monSuperStoutRo } from '../fixtures/monSuperStout';

afterEach(cleanup);
const recipe = monSuperStoutRo;
const plan = recipe.waterPlan!;
function mount(overrides: Partial<WaterState> = {}) {
  let current: WaterState;
  function Host() {
    const [state, setState] = useState<WaterState>({
      diRatioPct: 100, styleCode: '20C', doses: { ...plan.mash }, disabled: [],
      acidId: 'lactique', mashWaterL: 34.6, spargeWaterL: 11,
      allSaltsInMash: true, ratioOverride: 0.4, ...overrides
    });
    current = state;
    return <SaltSolver source={plan.sourceSnapshot!} onSourceChange={() => {}}
      beerEbc={98.8} beerVolumeL={30} state={state} onChange={setState}
      brew={{ grist: recipe.fermentables, totalGristKg: 9.1, style: 'Imperial stout' }}
      noSparge={state.spargeWaterL === 0} />;
  }
  render(<Host />);
  return () => current;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const doser = () => click('Proposer les doses');
const graph = () => screen.getByRole('img', { name: /Profil ionique/ });
const zones = () => Array.from(graph().querySelectorAll('[data-ion-target]')).map(e => e.getAttribute('d'));
const readPh = () => Number(screen.getByText(/^pH estimé — cible/).parentElement!.textContent!.match(/(\d\.\d{2})\s*±/)![1]);
function acid(amount: string) {
  const field = screen.getByRole('textbox', { name: /Dose d’acide.*à l’empâtage/ });
  fireEvent.change(field, { target: { value: amount } });
  fireEvent.blur(field);
}

describe('Imperial stout UI smoke — Doser and live controls', () => {
  it('reports unavailable alkali, then recovers when bicarbonate is enabled again', () => {
    const state = mount({ disabled: ALKALINE_SALTS, doses: {} });
    doser();
    expect(state().doses.nahco3 ?? 0).toBe(0);
    expect(screen.getByText(/sels alcalins écartés/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Bicarbonate de soude — écarté' }));
    doser();
    expect(state().doses.nahco3).toBeGreaterThan(0);
    expect(screen.queryByText(/sels alcalins écartés/)).not.toBeInTheDocument();
    const doses = { ...state().doses };
    doser();
    expect(state().doses).toEqual(doses);
  });

  it('does not erase weighed salts when no proposal is possible, but can reset manual acid', () => {
    const state = mount({ disabled: SALT_IDS, acidOverride: { mash: 2, sparge: 1 } });
    doser();
    expect(state().doses).toEqual(plan.mash);
    expect(state().acidOverride).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Proposer les doses' })).toBeDisabled();
    expect(graph()).toHaveAccessibleName(/Alcalinité.*62 ppm/);
  });

  it.each([0.2, 0.4, 0.9, 5])('ratio %s updates doses without moving the style zones; subsequent manual salts move the slider', (ratio) => {
    const state = mount();
    const before = zones();
    const slider = screen.getByRole('slider', { name: 'SO₄ ⇄ Cl' });
    fireEvent.change(slider, { target: { value: String(ratio) } });
    expect(state().ratioOverride).toBe(ratio);
    expect(zones()).toEqual(before);
    const doses = { ...state().doses };
    doser();
    expect(state().doses).toEqual(doses);
    const oldSlider = Number((slider as HTMLInputElement).value);
    click('Ajouter 0.5 g de Chlorure de calcium');
    expect(Number((slider as HTMLInputElement).value)).toBeLessThan(oldSlider);
    expect(zones()).toEqual(before);
  });

  it('an Epsom addition shows magnesium immediately and removes the zero-magnesium explanation', () => {
    mount();
    expect(screen.getByText(/Mg : 0 ppm dans l’eau/)).toBeInTheDocument();
    const before = zones();
    click('Ajouter 0.5 g de Sel d’Epsom');
    expect(graph()).toHaveAccessibleName(/Magnésium[^)]*\) 1 ppm/);
    expect(screen.queryByText(/Mg : 0 ppm dans l’eau/)).not.toBeInTheDocument();
    expect(zones()).toEqual(before);
  });

  it.each(['lactique', 'phosphorique'] as const)('%s: pH feedback must continue below zero bicarbonate when more acid is entered', (acidId) => {
    mount({ acidId });
    // Both doses exceed the initial bicarbonate capacity. The graph must not
    // invent negative HCO3; the pH estimate must still account for more acid.
    acid('6');
    expect(graph()).toHaveAccessibleName(/Alcalinité[^)]*\) 0 ppm/);
    const before = readPh();
    acid('15');
    expect(readPh()).toBeLessThan(before);
    expect(readPh()).toBeLessThan(5.2);
    expect(screen.getByText(/^pH estimé — cible/).parentElement!.querySelector('.text-ebc-amber')).not.toBeNull();
    doser();
    expect(readPh()).toBe(5.5);
    expect(screen.getByRole('textbox', { name: /Dose d’acide.*à l’empâtage/ })).toHaveValue('0');
  });

  it('zero sparge removes its acid input, and zero total water disables Doser', () => {
    mount({ spargeWaterL: 0 });
    expect(screen.queryByRole('textbox', { name: /Dose d’acide.*au rinçage/ })).not.toBeInTheDocument();
    doser();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity|undefined/);
    cleanup();
    mount({ mashWaterL: 0, spargeWaterL: 0 });
    expect(screen.getByRole('button', { name: 'Proposer les doses' })).toBeDisabled();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity|undefined/);
  });
});
