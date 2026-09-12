import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SaltSolver, type WaterState } from '../../src/ui/SaltSolver';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';

afterEach(cleanup);

function mount(patch: Partial<WaterState> = {}) {
  function Host() {
    const [state, setState] = useState<WaterState>({
      styleCode: '05B', diRatioPct: 45, spargeDiRatioPct: 45,
      mashWaterL: 7.7, spargeWaterL: 22, allSaltsInMash: true,
      doses: { gypse: 3.4, nacl: 1.4 }, disabled: [], acidId: 'lactique',
      acidOverride: { mash: 107.7, sparge: 4.4 }, ...patch,
    });
    return <SaltSolver source={DEFAULT_WATER_SOURCE} onSourceChange={() => {}}
      state={state} onChange={setState} beerEbc={null} beerVolumeL={24}
      noSparge={state.spargeWaterL === 0} brew={{ totalGristKg: 1.4, grist: [] }} />;
  }
  render(<Host />);
  fireEvent.click(screen.getByRole('button', { name: /2\. Sels/ }));
}

function acid(side: string) {
  return screen.getByRole('textbox', { name: new RegExp(`Dose d’acide lactique.*${side}`) });
}

function enter(side: string, value: string) {
  fireEvent.change(acid(side), { target: { value } });
  fireEvent.blur(acid(side));
}

describe('Bicarbonate and acid feedback at the point of dosing', () => {
  it('shows the two HCO3 readings and the acid warning without opening any detail', () => {
    mount();
    const warning = screen.getByRole('status', { name: 'Acide au-delà du bicarbonate' });
    expect(warning).toBeVisible();
    expect(warning).toHaveTextContent('Empâtage : HCO₃ épuisé');
    expect(warning).toHaveTextContent('peut encore abaisser le pH');
    expect(warning.closest('[data-water-acids]')).not.toBeNull();
    expect(acid('à l’empâtage')).toHaveAccessibleDescription(warning.textContent!);
    expect(screen.getByLabelText('HCO₃ après acide — empâtage')).toBeVisible();
    expect(screen.getByLabelText('HCO₃ après acide — empâtage')).toHaveTextContent('HCO₃ 0 ppm');
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('17,5 ppm');
    expect(screen.getByLabelText('HCO₃ après acide — moyenne du graphique')).toHaveTextContent('13 ppm');
    const details = screen.getByLabelText('HCO₃ après acide — moyenne du graphique').closest('details')!;
    expect(details).not.toHaveAttribute('open');
    fireEvent.click(details.querySelector('summary')!);
    expect(details).toHaveTextContent('Le HCO₃ encore affiché vient du rinçage');
    expect(details).toHaveTextContent('≈ 1,8 mL');
    expect(details).toHaveTextContent('105,9 mL au-delà');
    expect(details).toHaveTextContent('Ce repère n’est pas une dose conseillée');
  });

  it('keeps the warning after Doser and offers an explicit return to calculated doses', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Proposer les doses' }));
    expect(acid('à l’empâtage')).toHaveValue('107,7');
    expect(screen.getByRole('status', { name: 'Acide au-delà du bicarbonate' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Revenir aux doses d’acide calculées' }));
    expect(Number((acid('à l’empâtage') as HTMLInputElement).value.replace(',', '.'))).toBeLessThan(2);
    expect(screen.queryByRole('status', { name: 'Acide au-delà du bicarbonate' })).not.toBeInTheDocument();
    expect(acid('à l’empâtage')).not.toHaveAttribute('aria-describedby');
  });

  it('updates the right water and removes the warning when the excessive dose is corrected', () => {
    mount();
    enter('à l’empâtage', '1');
    expect(screen.queryByRole('status', { name: 'Acide au-delà du bicarbonate' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('HCO₃ après acide — empâtage')).toHaveTextContent('59,6 ppm');
    enter('au rinçage', '100');
    const warning = screen.getByRole('status', { name: 'Acide au-delà du bicarbonate' });
    expect(warning).toHaveTextContent('Rinçage : HCO₃ épuisé');
    expect(acid('au rinçage')).toHaveAccessibleDescription(warning.textContent!);
    expect(acid('à l’empâtage')).not.toHaveAttribute('aria-describedby');
    expect(screen.getByLabelText('HCO₃ après acide — rinçage')).toHaveTextContent('HCO₃ 0 ppm');
  });

  it('does not signal a zero bicarbonate source with no acid as an excessive dose', () => {
    mount({ diRatioPct: 100, spargeDiRatioPct: 100, acidOverride: { mash: 0, sparge: 0 } });
    expect(screen.queryByRole('status', { name: 'Acide au-delà du bicarbonate' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('HCO₃ après acide — empâtage')).toHaveTextContent('HCO₃ 0 ppm');
  });

  it('omits absent sparge water from the readings and warning', () => {
    mount({ spargeWaterL: 0 });
    expect(screen.queryByLabelText('HCO₃ après acide — rinçage')).not.toBeInTheDocument();
    expect(screen.getByLabelText('HCO₃ après acide — moyenne du graphique')).toHaveTextContent('0 ppm');
    expect(screen.getByRole('status', { name: 'Acide au-delà du bicarbonate' })).not.toHaveTextContent('Rinçage');
  });
});
