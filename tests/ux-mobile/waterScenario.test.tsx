import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DEFAULT_WATER_SOURCE, splitDoses } from '../../src/domain/water';
import { newNoloConfig } from '../../src/domain/nolo';
import { styleByCode } from '../../src/domain/waterStyles';
import { IonComparison } from '../../src/ui/IonComparison';
import { RatioSlider } from '../../src/ui/RatioSlider';
import { SaltSolver, type WaterBrewContext, type WaterState } from '../../src/ui/SaltSolver';
import type { WaterSource, WaterIons } from '../../src/types';

afterEach(cleanup);

const baseState: WaterState = {
  styleCode: '20C', diRatioPct: 20, mashWaterL: 10.8, spargeWaterL: 21.5,
  doses: { gypse: 2.5, cacl2: 5.2, nahco3: 1.6 }, disabled: [], acidId: 'lactique',
  acidOverride: { mash: 0, sparge: 6.2 }, ratioOverride: 0.7,
};

function mount(options: {
  source?: WaterSource;
  initial?: WaterState;
  styleCode?: string;
  brew?: WaterBrewContext;
  onChange?: ReturnType<typeof vi.fn>;
} = {}) {
  const onChange = options.onChange ?? vi.fn();
  let setBrewFromTest: React.Dispatch<React.SetStateAction<WaterBrewContext>> = () => {};
  function Host() {
    const [water, setWater] = useState(options.initial ?? baseState);
    const [brew, setBrew] = useState(options.brew ?? { totalGristKg: 2.2, grist: [{ kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }] });
    setBrewFromTest = setBrew;
    return <SaltSolver
      source={options.source ?? DEFAULT_WATER_SOURCE}
      onSourceChange={() => {}}
      beerEbc={3.6}
      beerVolumeL={24}
      brew={brew}
      state={{ ...water, ...(options.styleCode ? { styleCode: options.styleCode } : {}) }}
      onChange={next => { onChange(next); setWater(next); }}
      noSparge={false}
      onNoSpargeChange={() => {}}
    />;
  }
  render(<Host />);
  fireEvent.click(screen.getByRole('button', { name: /2\. Sels/ }));
  return { onChange, setBrew: (brew: WaterBrewContext) => act(() => setBrewFromTest(brew)) };
}

function chooseCalcium() {
  fireEvent.click(screen.getByRole('button', { name: 'Sélectionner : Calcium' }));
}

describe('Atelier de l’eau · réglages directs du brouillon', () => {
  it('keeps a missing source ion unknown and withholds profile claims', () => {
    const incomplete = { ...DEFAULT_WATER_SOURCE, ca: undefined } as unknown as WaterSource;
    mount({ source: incomplete });

    const calcium = screen.getAllByRole('listitem', { name: /Calcium.*analyse manquante/ });
    expect(calcium).toHaveLength(2); // analyse détaillée et atelier de dosage
    for (const row of calcium) { expect(row).toHaveTextContent('inconnu'); expect(row).toHaveTextContent('60–130'); }
    expect(screen.getByRole('button', { name: /Sélectionner : Calcium.*inconnu.*analyse manquante/ })).toBeVisible();
    expect(screen.getByText(/Analyse source incomplète : Ca inconnus/)).toBeVisible();
    expect(screen.queryByRole('img', { name: /Profil ionique/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Proposer les doses' })).toBeDisabled();
    expect(screen.queryByLabelText('Bilan des objectifs de l’eau')).toBeNull();
    const analysis = screen.getByText(/Analyse source ·/).closest('details')!;
    fireEvent.click(within(analysis).getByText(/Analyse source ·/));
    expect(within(analysis).getByRole('listitem', { name: /Calcium.*analyse manquante/ })).toHaveTextContent('inconnu');
  });

  it('does not label a missing magnesium analysis as zero ppm in water', () => {
    const incomplete = { ...DEFAULT_WATER_SOURCE, mg: undefined } as unknown as WaterSource;
    mount({ source: incomplete });

    expect(screen.getByText(/Analyse source incomplète : Mg inconnus/)).toBeVisible();
    expect(document.querySelector('[data-water-magnesium-note]')).toBeNull();
    expect(screen.queryByText(/Mg : 0 ppm dans l’eau/)).toBeNull();
  });

  it('does not turn the domain zero fallback into a known concentration after a direct ion edit', () => {
    const incomplete = { ...DEFAULT_WATER_SOURCE, ca: undefined } as unknown as WaterSource;
    const { onChange } = mount({ source: incomplete });
    chooseCalcium();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 g de Gypse' }));

    const calcium = screen.getAllByRole('listitem', { name: /Calcium.*analyse manquante/ });
    const impact = screen.getByLabelText('Conséquences du réglage de Gypse');
    for (const row of calcium) expect(row).toHaveTextContent('inconnu');
    expect(impact).toHaveTextContent('Ca inconnu');
    expect(impact).not.toHaveTextContent('Ca +3,6');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].doses.gypse).toBe(3);
  });

  it('keeps a manual acid input available when bicarbonate is unknown without claiming a zero-dose impact', () => {
    const incomplete = { ...DEFAULT_WATER_SOURCE, hco3: undefined } as unknown as WaterSource;
    const { onChange } = mount({ source: incomplete, initial: { ...baseState, acidOverride: undefined } });
    const acid = screen.getByRole('textbox', { name: /Dose d’acide lactique.*à l’empâtage/ });

    expect(acid).toHaveValue('');
    expect(acid).not.toBeDisabled();
    expect(screen.getByText(/Tu peux saisir une dose manuelle/)).toBeVisible();
    fireEvent.focus(acid);
    fireEvent.change(acid, { target: { value: '3,2' } });
    fireEvent.blur(acid);
    expect(acid).toHaveValue('3,2');
    expect(screen.queryByLabelText('Conséquences du réglage de Acide empâtage')).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].acidOverride.mash).toBe(3.2);
  });

  it('keeps NOLO acidity outside the model while showing the known coupled ion effects', () => {
    const nolo = { ...newNoloConfig(), process: 'coldExtraction' as const };
    const brew: WaterBrewContext = {
      totalGristKg: 2.2,
      grist: [{ kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }],
      nolo,
    };
    const { onChange, setBrew } = mount({
      initial: { ...baseState, acidOverride: undefined },
      brew,
    });

    expect(screen.getByText(/Extraction à froid.*Aucune dose automatique validée/)).toBeVisible();
    expect(screen.getByRole('textbox', { name: /Dose d’acide lactique.*à l’empâtage/ })).toHaveValue('');

    chooseCalcium();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 g de Gypse' }));

    const impact = screen.getByLabelText('Conséquences du réglage de Gypse');
    expect(impact).toHaveTextContent('Ca +3,6');
    expect(impact).toHaveTextContent('SO₄ +8,6');
    expect(impact).not.toHaveTextContent(/pH estimé|Acide calculé/);
    expect(screen.queryByLabelText('Essai local sur l’eau')).toBeNull();
    expect(screen.getByRole('textbox', { name: /Dose d’acide lactique.*à l’empâtage/ })).toHaveValue('');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].doses.gypse).toBe(3);

    setBrew({ ...brew, nolo: { ...nolo, enabled: false } });
    expect(screen.queryByLabelText('Conséquences du réglage de Gypse')).toBeNull();
  });

  it('shows coupled ion changes immediately and accepts a correction by resubmitting the dose', () => {
    const { onChange } = mount();
    chooseCalcium();

    const gypsum = document.querySelector<HTMLElement>('[data-salt-dose="gypse"]')!;
    expect(gypsum).toHaveAttribute('data-affects-selected-ion', 'true');
    expect(within(gypsum).getByText('→Ca')).toBeVisible();
    expect(screen.getByRole('group', { name: 'Doses agissant sur Calcium' })).toHaveTextContent('Gypse');

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 g de Gypse' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox', { name: 'Dose de Gypse en grammes' })).toHaveValue('3');
    const impact = screen.getByLabelText('Conséquences du réglage de Gypse');
    expect(impact).toHaveTextContent('Ca +3,6');
    expect(impact).toHaveTextContent('SO₄ +8,6');
    expect(screen.queryByLabelText('Essai local sur l’eau')).toBeNull();

    const dose = screen.getByRole('textbox', { name: 'Dose de Gypse en grammes' });
    fireEvent.focus(dose);
    fireEvent.change(dose, { target: { value: '2,5' } });
    fireEvent.blur(dose);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0].doses.gypse).toBe(2.5);
    expect(screen.getByRole('textbox', { name: 'Dose de Gypse en grammes' })).toHaveValue('2,5');
  });

  it('updates the parent draft as soon as a salt dose changes', () => {
    const { onChange } = mount();
    chooseCalcium();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 g de Gypse' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].doses.gypse).toBe(3);
    expect(screen.queryByLabelText('Essai local sur l’eau')).toBeNull();
  });

  it('keeps the repartition and unrelated salt overrides when a dose changes directly', () => {
    const initial: WaterState = {
      ...baseState,
      autoTreatment: true,
      allSaltsInMash: false,
      saltOverrides: {
        mash: { gypse: 1.8, cacl2: 4.1 },
        sparge: { gypse: 0.7, cacl2: 1.1 },
      },
    };
    const { onChange } = mount({ initial });

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 g de Gypse' }));
    expect(onChange).toHaveBeenCalledTimes(1);

    const changed = onChange.mock.calls[0][0] as WaterState;
    const expectedSplit = splitDoses(changed.doses, changed.mashWaterL, changed.spargeWaterL, false);
    expect(changed.allSaltsInMash).toBe(false);
    expect(changed.saltOverrides?.mash?.gypse).toBeCloseTo(expectedSplit.mash.gypse);
    expect(changed.saltOverrides?.sparge?.gypse).toBeCloseTo(expectedSplit.sparge.gypse);
    expect(changed.saltOverrides?.mash?.cacl2).toBe(4.1);
    expect(changed.saltOverrides?.sparge?.cacl2).toBe(1.1);
  });

  it('rebases a custom mash/sparge salt split when a dose changes directly', () => {
    const initial: WaterState = {
      ...baseState,
      allSaltsInMash: false,
      saltSplit: {
        mash: { gypse: 0.5, cacl2: 5.2, nahco3: 1.6 },
        sparge: { gypse: 2 },
      },
    };
    const { onChange } = mount({ initial });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0,5 g de Gypse' }));
    expect(onChange).toHaveBeenCalledTimes(1);

    const changed = onChange.mock.calls[0][0] as WaterState;
    expect(changed.allSaltsInMash).toBe(false);
    expect(changed.saltSplit?.mash.gypse).toBeCloseTo(0.6);
    expect(changed.saltSplit?.sparge.gypse).toBeCloseTo(2.4);
    expect(changed.saltSplit?.mash.cacl2).toBe(5.2);
    expect(changed.saltSplit?.sparge.cacl2).toBeUndefined();

    fireEvent.click(screen.getByRole('switch', { name: 'Gypse — autorisé' }));
    expect(onChange).toHaveBeenCalledTimes(2);
    const excluded = onChange.mock.calls[1][0] as WaterState;
    expect(excluded.disabled).toContain('gypse');
    expect(excluded.saltSplit?.mash.gypse).toBeUndefined();
    expect(excluded.saltSplit?.sparge.gypse).toBeUndefined();
    expect(excluded.saltSplit?.mash.cacl2).toBe(5.2);
  });

  it('updates the wizard draft immediately when the ratio changes', () => {
    const { onChange } = mount();
    const slider = screen.getByRole('slider', { name: 'SO₄ ⇄ Cl' });

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].ratioOverride).not.toBe(baseState.ratioOverride);
    expect(screen.queryByLabelText('Essai local sur l’eau')).toBeNull();
  });

  it('updates an acid dose immediately and accepts a correction by resubmitting it', () => {
    const { onChange } = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Sélectionner : Alcalinité' }));
    const acid = screen.getByRole('textbox', { name: /Dose d’acide lactique.*au rinçage/ });
    fireEvent.focus(acid);
    fireEvent.change(acid, { target: { value: '5,2' } });
    fireEvent.blur(acid);

    const impact = screen.getByLabelText('Conséquences du réglage de Acide rinçage');
    expect(impact).toHaveTextContent('Ton réglage : 6,2 → 5,2 mL');
    expect(impact).toHaveTextContent('HCO₃ +18,6');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].acidOverride.sparge).toBe(5.2);
    const correctedAcid = screen.getByRole('textbox', { name: /Dose d’acide lactique.*au rinçage/ });
    fireEvent.focus(correctedAcid);
    fireEvent.change(correctedAcid, { target: { value: '6,2' } });
    fireEvent.blur(correctedAcid);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0].acidOverride.sparge).toBe(6.2);
  });

  it('shows low sulfate and chloride separately even when their ratio is in range', () => {
    const low: WaterIons = { ca: 0, mg: 0, na: 0, so4: 10, cl: 10, hco3: 0 };
    const style = styleByCode('—');
    render(<>
      <RatioSlider value={1} target={{ min: 0.7, max: 1.4 }} ions={low} />
      <IonComparison start={low} achieved={low} style={style} />
    </>);

    expect(screen.getByText(/obtenu dans la plage/)).toBeVisible();
    const sulfate = screen.getByRole('listitem', { name: /Sulfate.*sous la cible/ });
    const chloride = screen.getByRole('listitem', { name: /Chlorure.*sous la cible/ });
    expect(sulfate).toBeVisible();
    expect(chloride).toBeVisible();
    expect(sulfate.getAttribute('aria-label')).toContain('départ 10 mg/L');
    expect(sulfate.getAttribute('aria-label')).toContain('valeur exacte corrigée 10 mg/L');
  });
});
