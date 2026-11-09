// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CarteVolume } from '../../../src/ui/identite/CarteVolume';
import { CarteEbullition } from '../../../src/ui/identite/CarteEbullition';
import { messageRefusSaisie } from '../../../src/ui/identite/regles';

afterEach(cleanup);

/**
 * BR-65 / BE-19 (08.11) : « Volume −1 → 30 L ; capacité 0 → 30 L ; le champ revient, aucun message ».
 * Un texte refusé à la sortie du champ rend la valeur d'avant ET le dit : la plage permise, la valeur gardée.
 */
function Volume() {
  const [v, setV] = useState(20);
  return <CarteVolume volumeL={v} onVolume={setV} capaciteL={30} onOuvrirFermenteur={() => undefined} />;
}
function Ebullition() {
  const [m, setM] = useState(60);
  return <CarteEbullition minutes={m} onMinutes={setM} />;
}

describe('messageRefusSaisie (pur)', () => {
  it('dit la plage et la valeur gardée, à la virgule', () => {
    expect(messageRefusSaisie('hors-limites', { min: 1, max: 2000, unite: 'L', gardee: 20.5 })).toBe('Valeur hors limites, de 1 à 2000 L. Valeur gardée : 20,5 L.');
    expect(messageRefusSaisie('illisible', { min: 0, max: 1440, unite: 'min', gardee: 60 })).toContain('Un nombre est attendu, de 0 à 1440 min.');
    expect(messageRefusSaisie('vide', { min: 1, max: 5, gardee: Number.NaN })).toBe('Une valeur est attendue, de 1 à 5.');
  });
});

describe('Identité : un refus de saisie est dit', () => {
  for (const mauvais of ['-1', '0', '99999', 'abc']) {
    it(`volume « ${mauvais} » : valeur d'avant rendue + message`, () => {
      render(<Volume />);
      const champ = screen.getByRole('textbox', { name: 'Volume en fermenteur' }) as HTMLInputElement;
      fireEvent.focus(champ);
      fireEvent.change(champ, { target: { value: mauvais } });
      fireEvent.blur(champ);
      expect(champ.value).toBe('20');
      const alerte = screen.getAllByRole('alert').find((a) => a.getAttribute('data-role') === 'refus');
      expect(alerte?.textContent).toMatch(/de 1 à 2000 L/);
      expect(alerte?.textContent).toMatch(/Valeur gardée : 20 L/);
    });
  }

  it('« -1 » se dit hors limites (un nombre négatif), « abc » se dit illisible', () => {
    render(<Volume />);
    const champ = screen.getByRole('textbox', { name: 'Volume en fermenteur' }) as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '-1' } });
    fireEvent.blur(champ);
    expect(screen.getAllByRole('alert').find((a) => a.getAttribute('data-role') === 'refus')?.textContent).toMatch(/^Valeur hors limites/);
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: 'abc' } });
    fireEvent.blur(champ);
    expect(screen.getAllByRole('alert').find((a) => a.getAttribute('data-role') === 'refus')?.textContent).toMatch(/^Un nombre est attendu/);
  });

  it('le message disparaît dès qu’une valeur permise est tapée', () => {
    render(<Volume />);
    const champ = screen.getByRole('textbox', { name: 'Volume en fermenteur' }) as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '0' } });
    fireEvent.blur(champ);
    expect(screen.queryByText(/Valeur gardée/)).not.toBeNull();
    fireEvent.focus(champ);
    expect(screen.queryByText(/Valeur gardée/)).toBeNull();
    fireEvent.change(champ, { target: { value: '25' } });
    fireEvent.blur(champ);
    expect(screen.queryByText(/Valeur gardée/)).toBeNull();
    expect(champ.value).toBe('25');
  });

  it('ébullition « -1 » : 60 min gardées et dites', () => {
    render(<Ebullition />);
    const champ = screen.getByRole('textbox', { name: 'Durée d’ébullition' }) as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '-1' } });
    fireEvent.blur(champ);
    expect(champ.value).toBe('60');
    expect(screen.getByRole('alert').textContent).toMatch(/de 0 à 1440 min.*60 min/);
  });
});
