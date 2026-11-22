// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AcidDoseControl } from '../../src/ui/water/AcidDoseControl';
import { SaltDoseControl } from '../../src/ui/water/SaltDoseControl';
import { SALTS } from '../../src/domain/water';

afterEach(cleanup);

/**
 * BR-85 / BE-9 (08.11) : « −1 » refusé en silence sur une dose de sel ou d'acide (champ ramené à 0, aucune phrase).
 * La dose d'avant est rendue et la phrase dit pourquoi.
 */
function Acide() {
  const [mL, setML] = useState(5.3);
  return <AcidDoseControl label="À l’empâtage" name="Dose d’acide lactique, en mL" unit="mL" amount={mL} force={false} onDose={setML} />;
}
function Sel() {
  const [g, setG] = useState(2);
  const def = (SALTS as Record<string, never>).gypsum ?? Object.values(SALTS)[0];
  const id = (SALTS as Record<string, unknown>).gypsum ? 'gypsum' : Object.keys(SALTS)[0];
  return (
    <ul>
      <SaltDoseControl id={id as never} def={def} grams={g} off={false} active={false} ions={[]} onDetails={() => undefined}
        onDose={setG} onToggle={() => undefined} onActivate={() => undefined} />
    </ul>
  );
}

describe('Eau : une dose négative est refusée et dite', () => {
  it('acide « −1 » : 5,3 mL gardés, phrase affichée', () => {
    render(<Acide />);
    const champ = screen.getByLabelText('Dose d’acide lactique, en mL') as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '-1' } });
    fireEvent.blur(champ);
    expect(champ.value).toBe('5,3');
    const phrase = screen.getByRole('alert').textContent ?? '';
    expect(phrase).toMatch(/négative n’existe pas/);
    expect(phrase).toMatch(/5,3 mL/);
  });

  it('sel « −1 » : 2 g gardés, phrase affichée', () => {
    render(<Sel />);
    const champ = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '-1' } });
    fireEvent.blur(champ);
    expect(champ.value).toBe('2');
    expect(screen.getByRole('alert').textContent).toMatch(/négative n’existe pas.*2 g/);
  });
});

describe('TE-31 · un ion épuisé s’affiche 0 ppm, jamais un négatif', () => {
  it('l’acide avec HCO₃ −1,2 dit « 0 ppm » (la carte et le résumé disent la même chose)', () => {
    render(<AcidDoseControl label="À l’empâtage" name="Dose d’acide, en mL" unit="mL" amount={5.8} force={false} hco3={-1.2} onDose={() => undefined} />);
    const ligne = screen.getByLabelText('HCO₃ après acide — À l’empâtage');
    expect(ligne.textContent).toContain('0');
    expect(ligne.textContent).not.toContain('-1');
    expect(ligne.textContent).not.toContain('−1');
  });
  it('hco3Affiche : planché à 0, arrondi au dixième', async () => {
    const { hco3Affiche } = await import('../../src/ui/water/AcidDoseControl');
    expect(hco3Affiche(-1.2)).toBe('0');
    expect(hco3Affiche(42.46)).toBe('42,5');
  });
});
