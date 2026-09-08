import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SaltSolver, type WaterState } from '../../src/ui/SaltSolver';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';

afterEach(cleanup);
function mount() {
  function Host() {
    const [state, setState] = useState<WaterState>({ styleCode: '20C', diRatioPct: 20,
      mashWaterL: 10.8, spargeWaterL: 21.5, doses: {}, disabled: [], acidId: 'lactique',
      ratioOverride: 0.7, acidOverride: { mash: 0, sparge: 6.2 } });
    return <><button onClick={() => setState({ ...state, mashWaterL: 15 })}>Autre volume</button>
      <SaltSolver source={DEFAULT_WATER_SOURCE} onSourceChange={() => {}} state={state} onChange={setState}
        beerEbc={3.6} beerVolumeL={24} noSparge={false}
        brew={{ totalGristKg: 2.2, grist: [{ kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }] }} /></>;
  }
  render(<Host />);
  fireEvent.click(screen.getByRole('button', { name: 'Proposer les doses' }));
}
function acid(side: string, value: string) {
  const field = screen.getByRole('textbox', { name: new RegExp(`Dose d’acide lactique.*${side}`) });
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

describe('Manual water edits explain their actual consequences beside the control', () => {
  it('shows gypsum ion increments, the newly exceeded calcium bound and the balance shift', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0.5 g de Gypse' }));
    const impact = screen.getByLabelText('Conséquences du réglage de Gypse');
    // 0.5 g * coefficients / 32.3 L, with the treatment's 0.1 ppm rounding.
    expect(impact).toHaveTextContent(/Ca \+3,6/);
    expect(impact).toHaveTextContent(/SO₄ \+8,6/);
    expect(impact).toHaveTextContent('Ca sort de la cible');
    expect(impact).toHaveTextContent('Orientation plus sèche');
    expect(impact).toHaveTextContent('pH estimé');
    expect(impact.closest('li')).toContainElement(screen.getByRole('textbox', { name: 'Dose de Gypse en grammes' }));
  });

  it('shows the total bicarbonate change from sparge acid without attributing a mash pH change to it', () => {
    mount();
    acid('au rinçage', '5,2');
    const impact = screen.getByLabelText('Conséquences du réglage de Acide rinçage');
    expect(impact).toHaveTextContent('HCO₃ +18,6'); // 600 mg retained / 32.3 L.
    const ph = impact.textContent!.match(/pH estimé : ([\d,]+) → ([\d,]+)/)!;
    expect(ph[1]).toBe(ph[2]);
    expect(impact).toHaveTextContent('HCO₃ rinçage : 27 → 54,9 ppm');
  });

  it('compares the complete decimal entry with the dose before focus, not the intermediate keystroke', () => {
    mount();
    const field = screen.getByRole('textbox', { name: /Dose d’acide lactique.*au rinçage/ });
    fireEvent.focus(field);
    for (const value of ['5', '5,', '5,2']) fireEvent.change(field, { target: { value } });
    fireEvent.blur(field);
    const impact = screen.getByLabelText('Conséquences du réglage de Acide rinçage');
    expect(impact).toHaveTextContent('Ton réglage : 6,2 → 5,2 mL');
    expect(impact).toHaveTextContent('HCO₃ +18,6');
  });

  it('continues to explain an acid-induced pH decrease after bicarbonate has reached zero', () => {
    mount();
    acid('à l’empâtage', '6');
    acid('à l’empâtage', '7');
    const impact = screen.getByLabelText('Conséquences du réglage de Acide empâtage');
    expect(impact).toHaveTextContent('Ions affichés inchangés');
    expect(impact).toHaveTextContent('HCO₃ empâtage : 0 → 0 ppm');
    const ph = impact.textContent!.match(/pH estimé : ([\d,]+) → ([\d,]+)/)!;
    expect(Number(ph[2].replace(',', '.'))).toBeLessThan(Number(ph[1].replace(',', '.')));
  });

  it('explains the model limit instead of implying that a large acid dose stops affecting pH', () => {
    mount();
    acid('à l’empâtage', '20');
    acid('à l’empâtage', '21');
    expect(screen.getByLabelText('Conséquences du réglage de Acide empâtage')).toHaveTextContent('ce chiffre ne signifie pas que le pH est stabilisé');
    expect(screen.getByLabelText('Bilan du pH estimé')).toHaveTextContent('la valeur affichée est plafonnée, pas le pH réel');
  });

  it('discards the before/after claim when applying Doser or changing the volume', () => {
    mount();
    const add = () => fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0.5 g de Gypse' }));
    add();
    fireEvent.click(screen.getByRole('button', { name: 'Proposer les doses' }));
    expect(screen.queryByLabelText(/Conséquences du réglage/)).not.toBeInTheDocument();
    add();
    fireEvent.click(screen.getByRole('button', { name: 'Autre volume' }));
    expect(screen.queryByLabelText(/Conséquences du réglage/)).not.toBeInTheDocument();
  });
});
