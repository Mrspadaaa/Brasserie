// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewSheet, type BrewSheetProps } from '../../../src/ui/BrewSheet';
import { CarteEbullition } from '../../../src/ui/identite/CarteEbullition';
import { CarteVolume } from '../../../src/ui/identite/CarteVolume';
import { EBULLITION_SAISIE_MAX, VOLUME_SAISIE_MAX } from '../../../src/ui/identite/regles';

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

/**
 * 31.10 : le singe de l'assistant (graine 3) tapait 999 999 999 999 dans « Ébullition » de la fiche, puis revenait à l'étape
 * Identité : la règle écrivait un chiffre toutes les 60 min jusqu'à 10^12 et le tas V8 s'épuisait. Ici : l'écran reste vivant,
 * et la fiche dit la borne (la valeur affichée est ramenée à 1 440 min à la sortie du champ, comme les autres bornes de la fiche).
 */
function fiche(overrides: Partial<BrewSheetProps> = {}): BrewSheetProps {
  return {
    name: 'Essai', onName: vi.fn(), style: 'NEIPA', onStyle: vi.fn(),
    volumeL: 20, onVolumeL: vi.fn(), boilMin: 60, onBoilMin: vi.fn(),
    carboTarget: '', onCarboTarget: vi.fn(),
    fermentables: [], onFermentables: vi.fn(), totalGristKg: 0,
    hops: [], onHops: vi.fn(), hopIbu: () => null,
    yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' }, onYeast: vi.fn(),
    mashSteps: [], onMashSteps: vi.fn(), fermentation: [], onFermentation: vi.fn(),
    mashWaterL: 0, onMashWaterL: vi.fn(), spargeWaterL: 0, onSpargeWaterL: vi.fn(),
    notes: '', onNotes: vi.fn(), shortages: [], ...overrides
  };
}

function FicheVivante({ onBoil }: { onBoil: (v: number) => void }) {
  const [boil, setBoil] = useState(60);
  const [vol, setVol] = useState(20);
  return (
    <BrewSheet
      {...fiche({ boilMin: boil, onBoilMin: (v) => { onBoil(v); setBoil(v); }, volumeL: vol, onVolumeL: setVol })}
    />
  );
}

describe('une durée ou un volume démesuré tapé dans la fiche', () => {
  it('Ébullition 999999999999 : le champ est ramené à la borne à la sortie, la valeur remontée est bornée', () => {
    const remontees: number[] = [];
    render(<FicheVivante onBoil={(v) => remontees.push(v)} />);
    const champ = screen.getByRole('textbox', { name: 'Ébullition' }) as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '999999999999' } });
    fireEvent.blur(champ);
    expect(champ.value).toBe(String(EBULLITION_SAISIE_MAX));
    expect(remontees[remontees.length - 1]).toBe(EBULLITION_SAISIE_MAX);
  });

  it('Volume 999999999999 : même borne que l’étape Identité', () => {
    render(<FicheVivante onBoil={() => undefined} />);
    const champ = screen.getByRole('textbox', { name: 'Volume' }) as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '999999999999' } });
    fireEvent.blur(champ);
    expect(Number(champ.value.replace(/\s/g, '').replace(',', '.'))).toBe(VOLUME_SAISIE_MAX);
  });

  it('une valeur démesurée qui atteint quand même la règle (sans sortie du champ) ne fige pas l’écran', () => {
    const boil = render(<CarteEbullition minutes={999_999_999_999} onMinutes={() => undefined} />);
    const nombresEbullition = boil.container.querySelectorAll('[data-role="echelle-ébullition"] span, [data-role^="echelle"] span');
    expect(nombresEbullition.length).toBeLessThanOrEqual(250);
    cleanup();
    const vol = render(<CarteVolume volumeL={999_999_999_999} onVolume={() => undefined} onOuvrirFermenteur={() => undefined} />);
    expect(vol.container.querySelectorAll('[data-role^="echelle"] span').length).toBeLessThanOrEqual(250);
    expect(vol.container.textContent).not.toMatch(/NaN|Infinity|undefined/);
  });
});
